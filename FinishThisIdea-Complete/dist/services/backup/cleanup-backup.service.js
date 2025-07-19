"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupBackup = exports.CleanupBackupService = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const archiver_1 = __importDefault(require("archiver"));
const crypto_1 = __importDefault(require("crypto"));
const storage_1 = require("../../utils/storage");
const database_1 = require("../../utils/database");
const platform_logger_service_1 = require("../monitoring/platform-logger.service");
const serviceLogger = platform_logger_service_1.platformLogger.createServiceLogger('backup-service');
class CleanupBackupService {
    backupPath;
    defaultRetentionDays = 30;
    constructor() {
        this.backupPath = path_1.default.join(process.cwd(), 'backups');
        this.initializeBackupDirectory();
    }
    async initializeBackupDirectory() {
        await promises_1.default.mkdir(this.backupPath, { recursive: true });
    }
    async createBackup(jobId, sourceDir, options = {}) {
        const startTime = Date.now();
        const backupId = `backup-${jobId}-${Date.now()}`;
        try {
            serviceLogger.info('Creating backup', { jobId, backupId });
            const metadata = await this.createBackupMetadata(jobId, sourceDir);
            const archivePath = path_1.default.join(this.backupPath, `${backupId}.zip`);
            await this.createArchive(sourceDir, archivePath, metadata, options);
            const checksum = await this.calculateChecksum(archivePath);
            const stats = await promises_1.default.stat(archivePath);
            const size = stats.size;
            const s3Key = `backups/${jobId}/${backupId}.zip`;
            const fileBuffer = await promises_1.default.readFile(archivePath);
            const backupUrl = await (0, storage_1.uploadToS3)(fileBuffer, s3Key);
            await promises_1.default.unlink(archivePath);
            const retentionDays = options.retentionDays || this.defaultRetentionDays;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + retentionDays);
            const backupRecord = await this.storeBackupRecord({
                backupId,
                jobId,
                backupUrl,
                size,
                checksum,
                expiresAt,
                metadata
            });
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
        }
        catch (error) {
            serviceLogger.error(error, { jobId, backupId, operation: 'create-backup' });
            throw new Error(`Failed to create backup: ${error.message}`);
        }
    }
    async restoreBackup(backupId, targetDir) {
        const startTime = Date.now();
        try {
            serviceLogger.info('Restoring backup', { backupId });
            const backup = await this.getBackupRecord(backupId);
            if (!backup) {
                throw new Error('Backup not found');
            }
            const backupBuffer = await this.downloadBackup(backup.url);
            const downloadedChecksum = this.calculateBufferChecksum(backupBuffer);
            if (downloadedChecksum !== backup.checksum) {
                throw new Error('Backup checksum verification failed');
            }
            await promises_1.default.mkdir(targetDir, { recursive: true });
            const tempArchive = path_1.default.join(this.backupPath, `restore-${Date.now()}.zip`);
            await promises_1.default.writeFile(tempArchive, backupBuffer);
            await this.extractArchive(tempArchive, targetDir);
            await promises_1.default.unlink(tempArchive);
            const duration = Date.now() - startTime;
            await serviceLogger.track('backup-restored', duration, {
                backupId,
                size: backup.size
            });
            serviceLogger.info('Backup restored successfully', { backupId });
        }
        catch (error) {
            serviceLogger.error(error, { backupId, operation: 'restore-backup' });
            throw new Error(`Failed to restore backup: ${error.message}`);
        }
    }
    async listBackups(jobId) {
        try {
            const backups = await database_1.prisma.$queryRaw `
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
            return backups;
        }
        catch (error) {
            serviceLogger.error(error, { jobId, operation: 'list-backups' });
            return [];
        }
    }
    async createBackupMetadata(jobId, sourceDir) {
        const files = await this.getAllFiles(sourceDir);
        const metadata = {
            jobId,
            backupDate: new Date().toISOString(),
            fileCount: files.length,
            files: files.map(file => ({
                path: path_1.default.relative(sourceDir, file),
                size: 0
            })),
            sourceDirectory: path_1.default.basename(sourceDir)
        };
        if (files.length < 1000) {
            for (const file of metadata.files) {
                try {
                    const stats = await promises_1.default.stat(path_1.default.join(sourceDir, file.path));
                    file.size = stats.size;
                }
                catch (error) {
                }
            }
        }
        return metadata;
    }
    async createArchive(sourceDir, outputPath, metadata, options) {
        return new Promise((resolve, reject) => {
            const output = promises_1.default.createWriteStream(outputPath);
            const archive = (0, archiver_1.default)('zip', {
                zlib: { level: options.compress ? 9 : 5 }
            });
            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));
            archive.pipe(output);
            archive.append(JSON.stringify(metadata, null, 2), {
                name: 'backup-metadata.json'
            });
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }
    async extractArchive(archivePath, targetDir) {
        const unzipper = require('unzipper');
        return new Promise((resolve, reject) => {
            promises_1.default.createReadStream(archivePath)
                .pipe(unzipper.Extract({ path: targetDir }))
                .on('close', () => resolve())
                .on('error', (err) => reject(err));
        });
    }
    async calculateChecksum(filePath) {
        const fileBuffer = await promises_1.default.readFile(filePath);
        return this.calculateBufferChecksum(fileBuffer);
    }
    calculateBufferChecksum(buffer) {
        return crypto_1.default.createHash('sha256').update(buffer).digest('hex');
    }
    async getAllFiles(dir) {
        const files = [];
        async function scan(currentDir) {
            const entries = await promises_1.default.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    if (!shouldIgnoreDir(entry.name)) {
                        await scan(fullPath);
                    }
                }
                else {
                    files.push(fullPath);
                }
            }
        }
        function shouldIgnoreDir(dirName) {
            const ignoreDirs = [
                'node_modules', '.git', '.svn', '.hg', 'dist', 'build'
            ];
            return ignoreDirs.includes(dirName) || dirName.startsWith('.');
        }
        await scan(dir);
        return files;
    }
    async storeBackupRecord(data) {
        const job = await database_1.prisma.job.findUnique({
            where: { id: data.jobId }
        });
        if (!job) {
            throw new Error('Job not found');
        }
        const backups = job.metadata?.backups || [];
        backups.push({
            id: data.backupId,
            url: data.backupUrl,
            size: data.size,
            checksum: data.checksum,
            createdAt: new Date(),
            expiresAt: data.expiresAt,
            metadata: data.metadata
        });
        await database_1.prisma.job.update({
            where: { id: data.jobId },
            data: {
                metadata: {
                    ...(job.metadata || {}),
                    backups
                }
            }
        });
        return backups[backups.length - 1];
    }
    async getBackupRecord(backupId) {
        const jobs = await database_1.prisma.job.findMany({
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
            const backups = job.metadata?.backups || [];
            const backup = backups.find((b) => b.id === backupId);
            if (backup) {
                return backup;
            }
        }
        return null;
    }
    async downloadBackup(backupUrl) {
        const s3Key = backupUrl.split('.com/')[1];
        const downloadFromS3 = require('../../utils/storage').downloadFromS3;
        return await downloadFromS3(`s3://${process.env.S3_BUCKET}/${s3Key}`);
    }
    async cleanupExpiredBackups() {
        try {
            const expiredBackups = await database_1.prisma.$queryRaw `
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
        }
        catch (error) {
            serviceLogger.error(error, { operation: 'cleanup-expired-backups' });
            return 0;
        }
    }
}
exports.CleanupBackupService = CleanupBackupService;
exports.cleanupBackup = new CleanupBackupService();
//# sourceMappingURL=cleanup-backup.service.js.map