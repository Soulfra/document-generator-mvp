"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const backup_scheduler_service_1 = require("../../services/backup/backup-scheduler.service");
const cleanup_backup_service_1 = require("../../services/backup/cleanup-backup.service");
const logger_1 = require("../../utils/logger");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const triggerBackupSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['database', 'files', 'redis', 'full']),
        retentionDays: zod_1.z.number().min(1).max(365).optional()
    })
});
const restoreBackupSchema = zod_1.z.object({
    body: zod_1.z.object({
        backupId: zod_1.z.string(),
        type: zod_1.z.enum(['database', 'files', 'redis']),
        targetPath: zod_1.z.string().optional()
    })
});
const scheduleBackupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.enum(['database', 'files', 'redis', 'full']),
        schedule: zod_1.z.string(),
        enabled: zod_1.z.boolean(),
        retentionDays: zod_1.z.number().min(1).max(365)
    })
});
router.get('/status', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const status = await backup_scheduler_service_1.backupScheduler.getBackupStatus();
    res.json({
        success: true,
        data: {
            schedules: status,
            timestamp: new Date()
        }
    });
}));
router.post('/trigger', auth_middleware_1.authenticate, (0, auth_middleware_1.requireTokens)(1000), (0, validation_middleware_1.validate)(triggerBackupSchema), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { type, retentionDays } = req.body;
    logger_1.logger.info('Manual backup triggered', {
        userId: req.user.id,
        type
    });
    const result = await backup_scheduler_service_1.backupScheduler.triggerBackup(type);
    res.json({
        success: true,
        data: {
            message: `Backup ${type} has been queued`,
            ...result
        }
    });
}));
router.get('/list/:jobId', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    const job = await prisma.job.findFirst({
        where: {
            id: jobId,
            userId: req.user.id
        }
    });
    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }
    const backups = await cleanup_backup_service_1.cleanupBackup.listBackups(jobId);
    res.json({
        success: true,
        data: {
            jobId,
            backups,
            count: backups.length
        }
    });
}));
router.post('/restore', auth_middleware_1.authenticate, (0, auth_middleware_1.requireTokens)(5000), (0, validation_middleware_1.validate)(restoreBackupSchema), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { backupId, type, targetPath } = req.body;
    logger_1.logger.info('Backup restore requested', {
        userId: req.user.id,
        backupId,
        type
    });
    if (type === 'files' && targetPath) {
        await cleanup_backup_service_1.cleanupBackup.restoreBackup(backupId, targetPath);
        res.json({
            success: true,
            data: {
                message: 'Files restored successfully',
                backupId,
                targetPath
            }
        });
    }
    else {
        await backup_scheduler_service_1.backupScheduler.restoreFromBackup(backupId, type);
        res.json({
            success: true,
            data: {
                message: `${type} restore initiated`,
                backupId
            }
        });
    }
}));
router.get('/schedules', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (req.user.platformTokens < 50000) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    const schedules = await backup_scheduler_service_1.backupScheduler.getBackupStatus();
    res.json({
        success: true,
        data: {
            schedules,
            activeCount: schedules.filter((s) => s.enabled).length
        }
    });
}));
router.post('/schedules', auth_middleware_1.authenticate, (0, validation_middleware_1.validate)(scheduleBackupSchema), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (req.user.platformTokens < 50000) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    const schedule = {
        id: `custom-${Date.now()}`,
        ...req.body,
        metadata: {
            createdBy: req.user.id,
            createdAt: new Date()
        }
    };
    await backup_scheduler_service_1.backupScheduler.scheduleBackup(schedule);
    res.json({
        success: true,
        data: {
            message: 'Backup schedule created',
            schedule
        }
    });
}));
router.delete('/expired', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (req.user.platformTokens < 50000) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    const count = await cleanup_backup_service_1.cleanupBackup.cleanupExpiredBackups();
    logger_1.logger.info('Expired backups cleaned', {
        userId: req.user.id,
        count
    });
    res.json({
        success: true,
        data: {
            message: 'Expired backups cleaned',
            cleanedCount: count
        }
    });
}));
router.get('/download/:backupId', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { backupId } = req.params;
    const backup = await cleanup_backup_service_1.cleanupBackup.getBackupRecord(backupId);
    if (!backup) {
        return res.status(404).json({
            success: false,
            error: 'Backup not found'
        });
    }
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
    const client = new S3Client({});
    const s3Key = backup.url.split('.com/')[1];
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: s3Key
    });
    const downloadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    res.json({
        success: true,
        data: {
            backupId,
            downloadUrl,
            expiresIn: 3600,
            size: backup.size,
            createdAt: backup.createdAt
        }
    });
}));
backup_scheduler_service_1.backupScheduler.initialize().catch(err => {
    logger_1.logger.error('Failed to initialize backup scheduler', err);
});
exports.default = router;
//# sourceMappingURL=backup.route.js.map