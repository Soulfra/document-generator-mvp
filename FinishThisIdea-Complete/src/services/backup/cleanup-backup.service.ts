import path from 'path';
import fs from 'fs/promises';
import archiver from 'archiver';
import crypto from 'crypto';
import { uploadToS3 } from '../../utils/storage';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/database';
import { platformLogger } from '../monitoring/platform-logger.service';

const serviceLogger = platformLogger.createServiceLogger('backup-service');

interface BackupOptions {
  includeMetadata?: boolean;
  compress?: boolean;
  encrypt?: boolean;
  retentionDays?: number;
}

interface BackupResult {
  backupId: string;
  backupUrl: string;
  size: number;
  checksum: string;
  createdAt: Date;
  expiresAt: Date;
}

export class CleanupBackupService {
  private backupPath: string;
  private defaultRetentionDays = 30;

  constructor() {
    this.backupPath = path.join(process.cwd(), 'backups');
    this.initializeBackupDirectory();
  }

  private async initializeBackupDirectory() {
    await fs.mkdir(this.backupPath, { recursive: true });
  }

  /**
   * Create a backup of the original files before cleanup
   */
  async createBackup(
    jobId: string,
    sourceDir: string,
    options: BackupOptions = {}
  ): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = `backup-${jobId}-${Date.now()}`;
    
    try {
      serviceLogger.info('Creating backup', { jobId, backupId });

      // Create backup metadata
      const metadata = await this.createBackupMetadata(jobId, sourceDir);
      
      // Create backup archive
      const archivePath = path.join(this.backupPath, `${backupId}.zip`);
      await this.createArchive(sourceDir, archivePath, metadata, options);
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(archivePath);
      
      // Get file size
      const stats = await fs.stat(archivePath);
      const size = stats.size;
      
      // Upload to S3
      const s3Key = `backups/${jobId}/${backupId}.zip`;
      const fileBuffer = await fs.readFile(archivePath);
      const backupUrl = await uploadToS3(fileBuffer, s3Key);
      
      // Clean up local archive
      await fs.unlink(archivePath);
      
      // Calculate expiration
      const retentionDays = options.retentionDays || this.defaultRetentionDays;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + retentionDays);
      
      // Store backup record in database
      const backupRecord = await this.storeBackupRecord({
        backupId,
        jobId,
        backupUrl,
        size,
        checksum,
        expiresAt,
        metadata
      });
      
      // Track performance
      const duration = Date.now() - startTime;
      await serviceLogger.track('backup-created', duration, { 
        jobId, 
        backupId,
        size 
      });

      return {
        backupId: backupRecord.id,
        backupUrl,
        size,
        checksum,
        createdAt: backupRecord.createdAt,
        expiresAt
      };

    } catch (error) {
      serviceLogger.error(error, { jobId, backupId, operation: 'create-backup' });
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Restore files from a backup
   */
  async restoreBackup(backupId: string, targetDir: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      serviceLogger.info('Restoring backup', { backupId });

      // Get backup record
      const backup = await this.getBackupRecord(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Download backup from S3
      const backupBuffer = await this.downloadBackup(backup.url);
      
      // Verify checksum
      const downloadedChecksum = this.calculateBufferChecksum(backupBuffer);
      if (downloadedChecksum !== backup.checksum) {
        throw new Error('Backup checksum verification failed');
      }

      // Create target directory
      await fs.mkdir(targetDir, { recursive: true });
      
      // Save and extract backup
      const tempArchive = path.join(this.backupPath, `restore-${Date.now()}.zip`);
      await fs.writeFile(tempArchive, backupBuffer);
      
      // Extract archive
      await this.extractArchive(tempArchive, targetDir);
      
      // Clean up temp file
      await fs.unlink(tempArchive);
      
      // Track performance
      const duration = Date.now() - startTime;
      await serviceLogger.track('backup-restored', duration, { 
        backupId,
        size: backup.size 
      });

      serviceLogger.info('Backup restored successfully', { backupId });

    } catch (error) {
      serviceLogger.error(error, { backupId, operation: 'restore-backup' });
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  /**
   * List available backups for a job
   */
  async listBackups(jobId: string): Promise<any[]> {
    try {
      const backups = await prisma.$queryRaw`
        SELECT 
          id as "backupId",
          url as "backupUrl",
          size,
          checksum,
          created_at as "createdAt",
          expires_at as "expiresAt",
          metadata
        FROM backups
        WHERE job_id = ${jobId}
        AND expires_at > NOW()
        ORDER BY created_at DESC
      `;

      return backups as any[];
    } catch (error) {
      serviceLogger.error(error, { jobId, operation: 'list-backups' });
      return [];
    }
  }

  /**
   * Create backup metadata
   */
  private async createBackupMetadata(jobId: string, sourceDir: string): Promise<any> {
    const files = await this.getAllFiles(sourceDir);
    
    const metadata = {
      jobId,
      backupDate: new Date().toISOString(),
      fileCount: files.length,
      files: files.map(file => ({
        path: path.relative(sourceDir, file),
        size: 0 // Will be populated if needed
      })),
      sourceDirectory: path.basename(sourceDir)
    };

    // Get file sizes if not too many files
    if (files.length < 1000) {
      for (const file of metadata.files) {
        try {
          const stats = await fs.stat(path.join(sourceDir, file.path));
          file.size = stats.size;
        } catch (error) {
          // Skip if file can't be accessed
        }
      }
    }

    return metadata;
  }

  /**
   * Create archive from directory
   */
  private async createArchive(
    sourceDir: string,
    outputPath: string,
    metadata: any,
    options: BackupOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: options.compress ? 9 : 5 }
      });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);

      // Add metadata file
      archive.append(JSON.stringify(metadata, null, 2), { 
        name: 'backup-metadata.json' 
      });

      // Add all files
      archive.directory(sourceDir, false);

      archive.finalize();
    });
  }

  /**
   * Extract archive to directory
   */
  private async extractArchive(archivePath: string, targetDir: string): Promise<void> {
    const unzipper = require('unzipper');
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(archivePath)
        .pipe(unzipper.Extract({ path: targetDir }))
        .on('close', () => resolve())
        .on('error', (err: any) => reject(err));
    });
  }

  /**
   * Calculate file checksum
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return this.calculateBufferChecksum(fileBuffer);
  }

  /**
   * Calculate buffer checksum
   */
  private calculateBufferChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get all files in directory
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(currentDir: string) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common ignore directories
          if (!shouldIgnoreDir(entry.name)) {
            await scan(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    }
    
    function shouldIgnoreDir(dirName: string): boolean {
      const ignoreDirs = [
        'node_modules', '.git', '.svn', '.hg', 'dist', 'build'
      ];
      return ignoreDirs.includes(dirName) || dirName.startsWith('.');
    }
    
    await scan(dir);
    return files;
  }

  /**
   * Store backup record in database
   */
  private async storeBackupRecord(data: any): Promise<any> {
    // Since we don't have a backups table yet, we'll store it in job metadata
    const job = await prisma.job.findUnique({
      where: { id: data.jobId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    const backups = (job.metadata as any)?.backups || [];
    backups.push({
      id: data.backupId,
      url: data.backupUrl,
      size: data.size,
      checksum: data.checksum,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
      metadata: data.metadata
    });

    await prisma.job.update({
      where: { id: data.jobId },
      data: {
        metadata: {
          ...(job.metadata as any || {}),
          backups
        }
      }
    });

    return backups[backups.length - 1];
  }

  /**
   * Get backup record
   */
  private async getBackupRecord(backupId: string): Promise<any> {
    // Search through job metadata for the backup
    const jobs = await prisma.job.findMany({
      where: {
        metadata: {
          path: ['backups'],
          array_contains: [{
            id: backupId
          }]
        }
      }
    });

    for (const job of jobs) {
      const backups = (job.metadata as any)?.backups || [];
      const backup = backups.find((b: any) => b.id === backupId);
      if (backup) {
        return backup;
      }
    }

    return null;
  }

  /**
   * Download backup from S3
   */
  private async downloadBackup(backupUrl: string): Promise<Buffer> {
    // Extract S3 key from URL
    const s3Key = backupUrl.split('.com/')[1];
    const downloadFromS3 = require('../../utils/storage').downloadFromS3;
    
    return await downloadFromS3(`s3://${process.env.S3_BUCKET}/${s3Key}`);
  }

  /**
   * Clean up expired backups
   */
  async cleanupExpiredBackups(): Promise<number> {
    try {
      const expiredBackups = await prisma.$queryRaw`
        UPDATE jobs
        SET metadata = jsonb_set(
          metadata,
          '{backups}',
          (
            SELECT jsonb_agg(backup)
            FROM jsonb_array_elements(metadata->'backups') AS backup
            WHERE (backup->>'expiresAt')::timestamp > NOW()
          )
        )
        WHERE metadata->'backups' IS NOT NULL
        RETURNING id
      `;

      const count = Array.isArray(expiredBackups) ? expiredBackups.length : 0;
      
      serviceLogger.info('Cleaned up expired backups', { count });
      
      return count;
    } catch (error) {
      serviceLogger.error(error, { operation: 'cleanup-expired-backups' });
      return 0;
    }
  }
}

// Export singleton instance
export const cleanupBackup = new CleanupBackupService();