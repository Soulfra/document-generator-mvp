/**
 * Automated Backup Scheduler Service
 * Manages scheduled backups for all critical data
 * Leverages existing backup service with automated scheduling
 */

import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { cleanupBackup } from './cleanup-backup.service';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';
import { redis } from '../../config/redis';
import Bull from 'bull';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadToS3 } from '../../utils/storage';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export interface BackupSchedule {
  id: string;
  name: string;
  type: 'database' | 'files' | 'redis' | 'full';
  schedule: string; // Cron expression
  enabled: boolean;
  retentionDays: number;
  lastRun?: Date;
  nextRun?: Date;
  metadata?: Record<string, any>;
}

export interface BackupJob {
  scheduleId: string;
  type: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export class BackupSchedulerService {
  private static instance: BackupSchedulerService;
  private schedules: Map<string, cron.ScheduledTask> = new Map();
  private backupQueue: Bull.Queue;
  private isInitialized = false;
  
  // Default backup schedules
  private defaultSchedules: BackupSchedule[] = [
    {
      id: 'daily-database',
      name: 'Daily Database Backup',
      type: 'database',
      schedule: '0 3 * * *', // 3 AM daily
      enabled: true,
      retentionDays: 30
    },
    {
      id: 'daily-files',
      name: 'Daily Files Backup',
      type: 'files',
      schedule: '0 4 * * *', // 4 AM daily
      enabled: true,
      retentionDays: 7
    },
    {
      id: 'weekly-full',
      name: 'Weekly Full Backup',
      type: 'full',
      schedule: '0 2 * * 0', // 2 AM Sunday
      enabled: true,
      retentionDays: 90
    },
    {
      id: 'hourly-redis',
      name: 'Hourly Redis Snapshot',
      type: 'redis',
      schedule: '0 * * * *', // Every hour
      enabled: true,
      retentionDays: 1
    }
  ];

  constructor() {
    this.backupQueue = new Bull('backup-jobs', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
    
    this.setupQueueHandlers();
  }

  public static getInstance(): BackupSchedulerService {
    if (!BackupSchedulerService.instance) {
      BackupSchedulerService.instance = new BackupSchedulerService();
    }
    return BackupSchedulerService.instance;
  }

  /**
   * Initialize backup scheduler
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing backup scheduler');
      
      // Load schedules from database or use defaults
      const schedules = await this.loadSchedules();
      
      // Set up cron jobs
      for (const schedule of schedules) {
        if (schedule.enabled) {
          await this.scheduleBackup(schedule);
        }
      }
      
      // Clean up expired backups daily
      cron.schedule('0 5 * * *', async () => {
        await this.cleanupExpiredBackups();
      });
      
      this.isInitialized = true;
      logger.info('Backup scheduler initialized', { 
        activeSchedules: schedules.filter(s => s.enabled).length 
      });
      
    } catch (error) {
      logger.error('Failed to initialize backup scheduler', error);
      throw error;
    }
  }

  /**
   * Schedule a backup
   */
  public async scheduleBackup(schedule: BackupSchedule): Promise<void> {
    try {
      // Remove existing schedule if any
      if (this.schedules.has(schedule.id)) {
        this.schedules.get(schedule.id)!.stop();
        this.schedules.delete(schedule.id);
      }
      
      if (!schedule.enabled) return;
      
      // Validate cron expression
      if (!cron.validate(schedule.schedule)) {
        throw new Error(`Invalid cron expression: ${schedule.schedule}`);
      }
      
      // Create cron job
      const task = cron.schedule(schedule.schedule, async () => {
        await this.executeBackup(schedule);
      });
      
      this.schedules.set(schedule.id, task);
      
      // Calculate next run time
      const nextRun = this.getNextRunTime(schedule.schedule);
      await this.updateSchedule(schedule.id, { nextRun });
      
      logger.info('Backup scheduled', { 
        scheduleId: schedule.id,
        name: schedule.name,
        cron: schedule.schedule,
        nextRun
      });
      
    } catch (error) {
      logger.error('Failed to schedule backup', { schedule, error });
      throw error;
    }
  }

  /**
   * Execute a backup
   */
  private async executeBackup(schedule: BackupSchedule): Promise<void> {
    const job: BackupJob = {
      scheduleId: schedule.id,
      type: schedule.type,
      startedAt: new Date(),
      status: 'pending'
    };
    
    try {
      // Add to queue
      await this.backupQueue.add('backup', {
        schedule,
        job
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
      
      prometheusMetrics.backupsScheduled.inc({ type: schedule.type });
      
    } catch (error) {
      logger.error('Failed to queue backup', { schedule, error });
      prometheusMetrics.backupErrors.inc({ type: schedule.type });
    }
  }

  /**
   * Set up queue handlers
   */
  private setupQueueHandlers(): void {
    this.backupQueue.process('backup', async (job) => {
      const { schedule, job: backupJob } = job.data;
      
      try {
        backupJob.status = 'running';
        await this.updateJobStatus(backupJob);
        
        let result;
        switch (schedule.type) {
          case 'database':
            result = await this.backupDatabase(schedule);
            break;
          case 'files':
            result = await this.backupFiles(schedule);
            break;
          case 'redis':
            result = await this.backupRedis(schedule);
            break;
          case 'full':
            result = await this.backupFull(schedule);
            break;
          default:
            throw new Error(`Unknown backup type: ${schedule.type}`);
        }
        
        backupJob.status = 'completed';
        backupJob.completedAt = new Date();
        backupJob.result = result;
        
        await this.updateJobStatus(backupJob);
        await this.updateSchedule(schedule.id, { lastRun: new Date() });
        
        prometheusMetrics.backupsCompleted.inc({ type: schedule.type });
        
        logger.info('Backup completed', {
          scheduleId: schedule.id,
          type: schedule.type,
          duration: Date.now() - backupJob.startedAt.getTime()
        });
        
      } catch (error) {
        backupJob.status = 'failed';
        backupJob.error = error.message;
        backupJob.completedAt = new Date();
        
        await this.updateJobStatus(backupJob);
        
        prometheusMetrics.backupErrors.inc({ type: schedule.type });
        
        logger.error('Backup failed', {
          scheduleId: schedule.id,
          type: schedule.type,
          error
        });
        
        throw error;
      }
    });
    
    // Queue event handlers
    this.backupQueue.on('completed', (job) => {
      logger.info('Backup job completed', { jobId: job.id });
    });
    
    this.backupQueue.on('failed', (job, err) => {
      logger.error('Backup job failed', { jobId: job.id, error: err });
    });
  }

  /**
   * Backup database
   */
  private async backupDatabase(schedule: BackupSchedule): Promise<any> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-backup-${timestamp}.sql`;
    const filepath = path.join('/tmp', filename);
    
    try {
      // Use pg_dump to create database backup
      const dbUrl = process.env.DATABASE_URL;
      const command = `pg_dump ${dbUrl} > ${filepath}`;
      
      await execAsync(command);
      
      // Compress the backup
      await execAsync(`gzip ${filepath}`);
      const compressedPath = `${filepath}.gz`;
      
      // Read compressed file
      const fileBuffer = await fs.readFile(compressedPath);
      
      // Upload to S3
      const s3Key = `backups/database/${filename}.gz`;
      const backupUrl = await uploadToS3(fileBuffer, s3Key);
      
      // Clean up local file
      await fs.unlink(compressedPath);
      
      // Store backup metadata
      const backupMetadata = {
        type: 'database',
        filename: `${filename}.gz`,
        size: fileBuffer.length,
        url: backupUrl,
        timestamp: new Date(),
        retentionDays: schedule.retentionDays,
        expiresAt: new Date(Date.now() + schedule.retentionDays * 24 * 60 * 60 * 1000)
      };
      
      await this.storeBackupMetadata(backupMetadata);
      
      return backupMetadata;
      
    } catch (error) {
      logger.error('Database backup failed', error);
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  /**
   * Backup files
   */
  private async backupFiles(schedule: BackupSchedule): Promise<any> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jobId = `files-backup-${timestamp}`;
    
    try {
      // Define directories to backup
      const backupDirs = [
        '/uploads',
        '/documents',
        '/generated'
      ].map(dir => path.join(process.cwd(), dir));
      
      const backupResults = [];
      
      for (const dir of backupDirs) {
        try {
          // Check if directory exists
          await fs.access(dir);
          
          // Use existing backup service
          const result = await cleanupBackup.createBackup(
            jobId,
            dir,
            {
              compress: true,
              retentionDays: schedule.retentionDays
            }
          );
          
          backupResults.push({
            directory: dir,
            ...result
          });
          
        } catch (error) {
          // Skip if directory doesn't exist
          if (error.code !== 'ENOENT') {
            logger.warn('Failed to backup directory', { dir, error });
          }
        }
      }
      
      return {
        type: 'files',
        timestamp: new Date(),
        backups: backupResults,
        totalSize: backupResults.reduce((sum, b) => sum + b.size, 0)
      };
      
    } catch (error) {
      logger.error('Files backup failed', error);
      throw new Error(`Files backup failed: ${error.message}`);
    }
  }

  /**
   * Backup Redis
   */
  private async backupRedis(schedule: BackupSchedule): Promise<any> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `redis-backup-${timestamp}.rdb`;
    
    try {
      // Trigger Redis BGSAVE
      await redis.bgsave();
      
      // Wait for save to complete
      let saving = true;
      while (saving) {
        const info = await redis.info('persistence');
        saving = info.includes('rdb_bgsave_in_progress:1');
        if (saving) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Get Redis dump file location
      const rdbFile = '/data/dump.rdb'; // Default Redis dump location
      
      // Copy and compress
      const tempFile = path.join('/tmp', filename);
      await execAsync(`cp ${rdbFile} ${tempFile}`);
      await execAsync(`gzip ${tempFile}`);
      
      const compressedPath = `${tempFile}.gz`;
      const fileBuffer = await fs.readFile(compressedPath);
      
      // Upload to S3
      const s3Key = `backups/redis/${filename}.gz`;
      const backupUrl = await uploadToS3(fileBuffer, s3Key);
      
      // Clean up
      await fs.unlink(compressedPath);
      
      // Store metadata
      const backupMetadata = {
        type: 'redis',
        filename: `${filename}.gz`,
        size: fileBuffer.length,
        url: backupUrl,
        timestamp: new Date(),
        retentionDays: schedule.retentionDays,
        expiresAt: new Date(Date.now() + schedule.retentionDays * 24 * 60 * 60 * 1000)
      };
      
      await this.storeBackupMetadata(backupMetadata);
      
      return backupMetadata;
      
    } catch (error) {
      logger.error('Redis backup failed', error);
      throw new Error(`Redis backup failed: ${error.message}`);
    }
  }

  /**
   * Full system backup
   */
  private async backupFull(schedule: BackupSchedule): Promise<any> {
    const results = {
      database: null as any,
      files: null as any,
      redis: null as any,
      success: true,
      errors: [] as string[]
    };
    
    // Backup all components
    try {
      results.database = await this.backupDatabase(schedule);
    } catch (error) {
      results.errors.push(`Database: ${error.message}`);
      results.success = false;
    }
    
    try {
      results.files = await this.backupFiles(schedule);
    } catch (error) {
      results.errors.push(`Files: ${error.message}`);
      results.success = false;
    }
    
    try {
      results.redis = await this.backupRedis(schedule);
    } catch (error) {
      results.errors.push(`Redis: ${error.message}`);
      results.success = false;
    }
    
    if (!results.success) {
      throw new Error(`Full backup partially failed: ${results.errors.join(', ')}`);
    }
    
    return results;
  }

  /**
   * Store backup metadata
   */
  private async storeBackupMetadata(metadata: any): Promise<void> {
    const key = `backup:metadata:${metadata.type}:${Date.now()}`;
    await redis.setex(key, 86400 * 365, JSON.stringify(metadata)); // 1 year TTL
    
    // Add to sorted set for easy retrieval
    await redis.zadd(
      `backups:${metadata.type}`,
      Date.now(),
      key
    );
  }

  /**
   * Update job status
   */
  private async updateJobStatus(job: BackupJob): Promise<void> {
    const key = `backup:job:${job.scheduleId}:${job.startedAt.getTime()}`;
    await redis.setex(key, 86400 * 7, JSON.stringify(job)); // 7 days TTL
  }

  /**
   * Load schedules
   */
  private async loadSchedules(): Promise<BackupSchedule[]> {
    // For now, use default schedules
    // In production, these would be loaded from database
    return this.defaultSchedules;
  }

  /**
   * Update schedule
   */
  private async updateSchedule(
    scheduleId: string,
    updates: Partial<BackupSchedule>
  ): Promise<void> {
    const key = `backup:schedule:${scheduleId}`;
    const existing = await redis.get(key);
    
    const schedule = existing ? JSON.parse(existing) : {};
    const updated = { ...schedule, ...updates };
    
    await redis.set(key, JSON.stringify(updated));
  }

  /**
   * Get next run time for cron expression
   */
  private getNextRunTime(cronExpression: string): Date {
    const interval = require('cron-parser').parseExpression(cronExpression);
    return interval.next().toDate();
  }

  /**
   * Clean up expired backups
   */
  private async cleanupExpiredBackups(): Promise<void> {
    try {
      logger.info('Starting expired backups cleanup');
      
      const types = ['database', 'files', 'redis'];
      let totalCleaned = 0;
      
      for (const type of types) {
        const backups = await redis.zrange(`backups:${type}`, 0, -1);
        
        for (const key of backups) {
          const metadata = await redis.get(key);
          if (!metadata) continue;
          
          const backup = JSON.parse(metadata);
          if (backup.expiresAt && new Date(backup.expiresAt) < new Date()) {
            // Delete from S3
            try {
              const s3Key = backup.url.split('.com/')[1];
              await this.deleteFromS3(s3Key);
            } catch (error) {
              logger.error('Failed to delete backup from S3', { key, error });
            }
            
            // Remove metadata
            await redis.del(key);
            await redis.zrem(`backups:${type}`, key);
            
            totalCleaned++;
          }
        }
      }
      
      logger.info('Expired backups cleanup completed', { totalCleaned });
      
    } catch (error) {
      logger.error('Failed to clean up expired backups', error);
    }
  }

  /**
   * Delete from S3 (placeholder)
   */
  private async deleteFromS3(key: string): Promise<void> {
    // Implement S3 deletion
    const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const client = new S3Client({});
    
    await client.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key
    }));
  }

  /**
   * Manual backup trigger
   */
  public async triggerBackup(type: string): Promise<any> {
    const schedule = this.defaultSchedules.find(s => s.type === type);
    
    if (!schedule) {
      throw new Error(`Unknown backup type: ${type}`);
    }
    
    await this.executeBackup(schedule);
    
    return {
      message: `Backup ${type} triggered`,
      schedule
    };
  }

  /**
   * Get backup status
   */
  public async getBackupStatus(): Promise<any> {
    const schedules = await this.loadSchedules();
    const status = [];
    
    for (const schedule of schedules) {
      const lastRunKey = `backup:schedule:${schedule.id}`;
      const lastRunData = await redis.get(lastRunKey);
      const lastRun = lastRunData ? JSON.parse(lastRunData) : {};
      
      // Get recent jobs
      const jobKeys = await redis.keys(`backup:job:${schedule.id}:*`);
      const recentJobs = [];
      
      for (const key of jobKeys.slice(-5)) {
        const jobData = await redis.get(key);
        if (jobData) {
          recentJobs.push(JSON.parse(jobData));
        }
      }
      
      status.push({
        ...schedule,
        lastRun: lastRun.lastRun,
        nextRun: lastRun.nextRun,
        recentJobs: recentJobs.sort((a, b) => 
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )
      });
    }
    
    return status;
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(
    backupId: string,
    type: string
  ): Promise<void> {
    // This would implement the restore logic
    // For now, it's a placeholder
    logger.info('Restore from backup requested', { backupId, type });
    throw new Error('Restore functionality not yet implemented');
  }
}

// Export singleton instance
export const backupScheduler = BackupSchedulerService.getInstance();