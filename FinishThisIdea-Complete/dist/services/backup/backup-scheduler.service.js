"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupScheduler = exports.BackupSchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const client_1 = require("@prisma/client");
const cleanup_backup_service_1 = require("./cleanup-backup.service");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const redis_1 = require("../../config/redis");
const bull_1 = __importDefault(require("bull"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const storage_1 = require("../../utils/storage");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const prisma = new client_1.PrismaClient();
class BackupSchedulerService {
    static instance;
    schedules = new Map();
    backupQueue;
    isInitialized = false;
    defaultSchedules = [
        {
            id: 'daily-database',
            name: 'Daily Database Backup',
            type: 'database',
            schedule: '0 3 * * *',
            enabled: true,
            retentionDays: 30
        },
        {
            id: 'daily-files',
            name: 'Daily Files Backup',
            type: 'files',
            schedule: '0 4 * * *',
            enabled: true,
            retentionDays: 7
        },
        {
            id: 'weekly-full',
            name: 'Weekly Full Backup',
            type: 'full',
            schedule: '0 2 * * 0',
            enabled: true,
            retentionDays: 90
        },
        {
            id: 'hourly-redis',
            name: 'Hourly Redis Snapshot',
            type: 'redis',
            schedule: '0 * * * *',
            enabled: true,
            retentionDays: 1
        }
    ];
    constructor() {
        this.backupQueue = new bull_1.default('backup-jobs', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379')
            }
        });
        this.setupQueueHandlers();
    }
    static getInstance() {
        if (!BackupSchedulerService.instance) {
            BackupSchedulerService.instance = new BackupSchedulerService();
        }
        return BackupSchedulerService.instance;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            logger_1.logger.info('Initializing backup scheduler');
            const schedules = await this.loadSchedules();
            for (const schedule of schedules) {
                if (schedule.enabled) {
                    await this.scheduleBackup(schedule);
                }
            }
            cron.schedule('0 5 * * *', async () => {
                await this.cleanupExpiredBackups();
            });
            this.isInitialized = true;
            logger_1.logger.info('Backup scheduler initialized', {
                activeSchedules: schedules.filter(s => s.enabled).length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize backup scheduler', error);
            throw error;
        }
    }
    async scheduleBackup(schedule) {
        try {
            if (this.schedules.has(schedule.id)) {
                this.schedules.get(schedule.id).stop();
                this.schedules.delete(schedule.id);
            }
            if (!schedule.enabled)
                return;
            if (!cron.validate(schedule.schedule)) {
                throw new Error(`Invalid cron expression: ${schedule.schedule}`);
            }
            const task = cron.schedule(schedule.schedule, async () => {
                await this.executeBackup(schedule);
            });
            this.schedules.set(schedule.id, task);
            const nextRun = this.getNextRunTime(schedule.schedule);
            await this.updateSchedule(schedule.id, { nextRun });
            logger_1.logger.info('Backup scheduled', {
                scheduleId: schedule.id,
                name: schedule.name,
                cron: schedule.schedule,
                nextRun
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to schedule backup', { schedule, error });
            throw error;
        }
    }
    async executeBackup(schedule) {
        const job = {
            scheduleId: schedule.id,
            type: schedule.type,
            startedAt: new Date(),
            status: 'pending'
        };
        try {
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
            prometheus_metrics_service_1.prometheusMetrics.backupsScheduled.inc({ type: schedule.type });
        }
        catch (error) {
            logger_1.logger.error('Failed to queue backup', { schedule, error });
            prometheus_metrics_service_1.prometheusMetrics.backupErrors.inc({ type: schedule.type });
        }
    }
    setupQueueHandlers() {
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
                prometheus_metrics_service_1.prometheusMetrics.backupsCompleted.inc({ type: schedule.type });
                logger_1.logger.info('Backup completed', {
                    scheduleId: schedule.id,
                    type: schedule.type,
                    duration: Date.now() - backupJob.startedAt.getTime()
                });
            }
            catch (error) {
                backupJob.status = 'failed';
                backupJob.error = error.message;
                backupJob.completedAt = new Date();
                await this.updateJobStatus(backupJob);
                prometheus_metrics_service_1.prometheusMetrics.backupErrors.inc({ type: schedule.type });
                logger_1.logger.error('Backup failed', {
                    scheduleId: schedule.id,
                    type: schedule.type,
                    error
                });
                throw error;
            }
        });
        this.backupQueue.on('completed', (job) => {
            logger_1.logger.info('Backup job completed', { jobId: job.id });
        });
        this.backupQueue.on('failed', (job, err) => {
            logger_1.logger.error('Backup job failed', { jobId: job.id, error: err });
        });
    }
    async backupDatabase(schedule) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-backup-${timestamp}.sql`;
        const filepath = path_1.default.join('/tmp', filename);
        try {
            const dbUrl = process.env.DATABASE_URL;
            const command = `pg_dump ${dbUrl} > ${filepath}`;
            await execAsync(command);
            await execAsync(`gzip ${filepath}`);
            const compressedPath = `${filepath}.gz`;
            const fileBuffer = await promises_1.default.readFile(compressedPath);
            const s3Key = `backups/database/${filename}.gz`;
            const backupUrl = await (0, storage_1.uploadToS3)(fileBuffer, s3Key);
            await promises_1.default.unlink(compressedPath);
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
        }
        catch (error) {
            logger_1.logger.error('Database backup failed', error);
            throw new Error(`Database backup failed: ${error.message}`);
        }
    }
    async backupFiles(schedule) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jobId = `files-backup-${timestamp}`;
        try {
            const backupDirs = [
                '/uploads',
                '/documents',
                '/generated'
            ].map(dir => path_1.default.join(process.cwd(), dir));
            const backupResults = [];
            for (const dir of backupDirs) {
                try {
                    await promises_1.default.access(dir);
                    const result = await cleanup_backup_service_1.cleanupBackup.createBackup(jobId, dir, {
                        compress: true,
                        retentionDays: schedule.retentionDays
                    });
                    backupResults.push({
                        directory: dir,
                        ...result
                    });
                }
                catch (error) {
                    if (error.code !== 'ENOENT') {
                        logger_1.logger.warn('Failed to backup directory', { dir, error });
                    }
                }
            }
            return {
                type: 'files',
                timestamp: new Date(),
                backups: backupResults,
                totalSize: backupResults.reduce((sum, b) => sum + b.size, 0)
            };
        }
        catch (error) {
            logger_1.logger.error('Files backup failed', error);
            throw new Error(`Files backup failed: ${error.message}`);
        }
    }
    async backupRedis(schedule) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `redis-backup-${timestamp}.rdb`;
        try {
            await redis_1.redis.bgsave();
            let saving = true;
            while (saving) {
                const info = await redis_1.redis.info('persistence');
                saving = info.includes('rdb_bgsave_in_progress:1');
                if (saving) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            const rdbFile = '/data/dump.rdb';
            const tempFile = path_1.default.join('/tmp', filename);
            await execAsync(`cp ${rdbFile} ${tempFile}`);
            await execAsync(`gzip ${tempFile}`);
            const compressedPath = `${tempFile}.gz`;
            const fileBuffer = await promises_1.default.readFile(compressedPath);
            const s3Key = `backups/redis/${filename}.gz`;
            const backupUrl = await (0, storage_1.uploadToS3)(fileBuffer, s3Key);
            await promises_1.default.unlink(compressedPath);
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
        }
        catch (error) {
            logger_1.logger.error('Redis backup failed', error);
            throw new Error(`Redis backup failed: ${error.message}`);
        }
    }
    async backupFull(schedule) {
        const results = {
            database: null,
            files: null,
            redis: null,
            success: true,
            errors: []
        };
        try {
            results.database = await this.backupDatabase(schedule);
        }
        catch (error) {
            results.errors.push(`Database: ${error.message}`);
            results.success = false;
        }
        try {
            results.files = await this.backupFiles(schedule);
        }
        catch (error) {
            results.errors.push(`Files: ${error.message}`);
            results.success = false;
        }
        try {
            results.redis = await this.backupRedis(schedule);
        }
        catch (error) {
            results.errors.push(`Redis: ${error.message}`);
            results.success = false;
        }
        if (!results.success) {
            throw new Error(`Full backup partially failed: ${results.errors.join(', ')}`);
        }
        return results;
    }
    async storeBackupMetadata(metadata) {
        const key = `backup:metadata:${metadata.type}:${Date.now()}`;
        await redis_1.redis.setex(key, 86400 * 365, JSON.stringify(metadata));
        await redis_1.redis.zadd(`backups:${metadata.type}`, Date.now(), key);
    }
    async updateJobStatus(job) {
        const key = `backup:job:${job.scheduleId}:${job.startedAt.getTime()}`;
        await redis_1.redis.setex(key, 86400 * 7, JSON.stringify(job));
    }
    async loadSchedules() {
        return this.defaultSchedules;
    }
    async updateSchedule(scheduleId, updates) {
        const key = `backup:schedule:${scheduleId}`;
        const existing = await redis_1.redis.get(key);
        const schedule = existing ? JSON.parse(existing) : {};
        const updated = { ...schedule, ...updates };
        await redis_1.redis.set(key, JSON.stringify(updated));
    }
    getNextRunTime(cronExpression) {
        const interval = require('cron-parser').parseExpression(cronExpression);
        return interval.next().toDate();
    }
    async cleanupExpiredBackups() {
        try {
            logger_1.logger.info('Starting expired backups cleanup');
            const types = ['database', 'files', 'redis'];
            let totalCleaned = 0;
            for (const type of types) {
                const backups = await redis_1.redis.zrange(`backups:${type}`, 0, -1);
                for (const key of backups) {
                    const metadata = await redis_1.redis.get(key);
                    if (!metadata)
                        continue;
                    const backup = JSON.parse(metadata);
                    if (backup.expiresAt && new Date(backup.expiresAt) < new Date()) {
                        try {
                            const s3Key = backup.url.split('.com/')[1];
                            await this.deleteFromS3(s3Key);
                        }
                        catch (error) {
                            logger_1.logger.error('Failed to delete backup from S3', { key, error });
                        }
                        await redis_1.redis.del(key);
                        await redis_1.redis.zrem(`backups:${type}`, key);
                        totalCleaned++;
                    }
                }
            }
            logger_1.logger.info('Expired backups cleanup completed', { totalCleaned });
        }
        catch (error) {
            logger_1.logger.error('Failed to clean up expired backups', error);
        }
    }
    async deleteFromS3(key) {
        const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const client = new S3Client({});
        await client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key
        }));
    }
    async triggerBackup(type) {
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
    async getBackupStatus() {
        const schedules = await this.loadSchedules();
        const status = [];
        for (const schedule of schedules) {
            const lastRunKey = `backup:schedule:${schedule.id}`;
            const lastRunData = await redis_1.redis.get(lastRunKey);
            const lastRun = lastRunData ? JSON.parse(lastRunData) : {};
            const jobKeys = await redis_1.redis.keys(`backup:job:${schedule.id}:*`);
            const recentJobs = [];
            for (const key of jobKeys.slice(-5)) {
                const jobData = await redis_1.redis.get(key);
                if (jobData) {
                    recentJobs.push(JSON.parse(jobData));
                }
            }
            status.push({
                ...schedule,
                lastRun: lastRun.lastRun,
                nextRun: lastRun.nextRun,
                recentJobs: recentJobs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            });
        }
        return status;
    }
    async restoreFromBackup(backupId, type) {
        logger_1.logger.info('Restore from backup requested', { backupId, type });
        throw new Error('Restore functionality not yet implemented');
    }
}
exports.BackupSchedulerService = BackupSchedulerService;
exports.backupScheduler = BackupSchedulerService.getInstance();
//# sourceMappingURL=backup-scheduler.service.js.map