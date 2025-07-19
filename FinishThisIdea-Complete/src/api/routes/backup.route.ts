/**
 * Backup Management API Routes
 * Endpoints for backup operations and scheduling
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireTokens } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { backupScheduler } from '../../services/backup/backup-scheduler.service';
import { cleanupBackup } from '../../services/backup/cleanup-backup.service';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const triggerBackupSchema = z.object({
  body: z.object({
    type: z.enum(['database', 'files', 'redis', 'full']),
    retentionDays: z.number().min(1).max(365).optional()
  })
});

const restoreBackupSchema = z.object({
  body: z.object({
    backupId: z.string(),
    type: z.enum(['database', 'files', 'redis']),
    targetPath: z.string().optional()
  })
});

const scheduleBackupSchema = z.object({
  body: z.object({
    name: z.string(),
    type: z.enum(['database', 'files', 'redis', 'full']),
    schedule: z.string(), // Cron expression
    enabled: z.boolean(),
    retentionDays: z.number().min(1).max(365)
  })
});

/**
 * @route GET /api/backups/status
 * @desc Get backup system status
 * @access Private - Requires authentication
 */
router.get('/status',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const status = await backupScheduler.getBackupStatus();
    
    res.json({
      success: true,
      data: {
        schedules: status,
        timestamp: new Date()
      }
    });
  })
);

/**
 * @route POST /api/backups/trigger
 * @desc Manually trigger a backup
 * @access Private - Requires 1000 tokens
 */
router.post('/trigger',
  authenticate,
  requireTokens(1000),
  validate(triggerBackupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { type, retentionDays } = req.body;
    
    logger.info('Manual backup triggered', {
      userId: req.user!.id,
      type
    });
    
    const result = await backupScheduler.triggerBackup(type);
    
    res.json({
      success: true,
      data: {
        message: `Backup ${type} has been queued`,
        ...result
      }
    });
  })
);

/**
 * @route GET /api/backups/list/:jobId
 * @desc List available backups for a job
 * @access Private - Requires authentication
 */
router.get('/list/:jobId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    
    // Verify user owns the job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: req.user!.id
      }
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    const backups = await cleanupBackup.listBackups(jobId);
    
    res.json({
      success: true,
      data: {
        jobId,
        backups,
        count: backups.length
      }
    });
  })
);

/**
 * @route POST /api/backups/restore
 * @desc Restore from a backup
 * @access Private - Requires 5000 tokens
 */
router.post('/restore',
  authenticate,
  requireTokens(5000),
  validate(restoreBackupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { backupId, type, targetPath } = req.body;
    
    logger.info('Backup restore requested', {
      userId: req.user!.id,
      backupId,
      type
    });
    
    // For file backups, use the cleanup backup service
    if (type === 'files' && targetPath) {
      await cleanupBackup.restoreBackup(backupId, targetPath);
      
      res.json({
        success: true,
        data: {
          message: 'Files restored successfully',
          backupId,
          targetPath
        }
      });
    } else {
      // For database/redis, use the scheduler service
      await backupScheduler.restoreFromBackup(backupId, type);
      
      res.json({
        success: true,
        data: {
          message: `${type} restore initiated`,
          backupId
        }
      });
    }
  })
);

/**
 * @route GET /api/backups/schedules
 * @desc Get backup schedules
 * @access Private - Admin only
 */
router.get('/schedules',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    // Check admin role (simplified for now)
    if (req.user!.platformTokens < 50000) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const schedules = await backupScheduler.getBackupStatus();
    
    res.json({
      success: true,
      data: {
        schedules,
        activeCount: schedules.filter((s: any) => s.enabled).length
      }
    });
  })
);

/**
 * @route POST /api/backups/schedules
 * @desc Create or update backup schedule
 * @access Private - Admin only
 */
router.post('/schedules',
  authenticate,
  validate(scheduleBackupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Check admin role
    if (req.user!.platformTokens < 50000) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const schedule = {
      id: `custom-${Date.now()}`,
      ...req.body,
      metadata: {
        createdBy: req.user!.id,
        createdAt: new Date()
      }
    };
    
    await backupScheduler.scheduleBackup(schedule);
    
    res.json({
      success: true,
      data: {
        message: 'Backup schedule created',
        schedule
      }
    });
  })
);

/**
 * @route DELETE /api/backups/expired
 * @desc Clean up expired backups
 * @access Private - Admin only
 */
router.delete('/expired',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    // Check admin role
    if (req.user!.platformTokens < 50000) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const count = await cleanupBackup.cleanupExpiredBackups();
    
    logger.info('Expired backups cleaned', {
      userId: req.user!.id,
      count
    });
    
    res.json({
      success: true,
      data: {
        message: 'Expired backups cleaned',
        cleanedCount: count
      }
    });
  })
);

/**
 * @route GET /api/backups/download/:backupId
 * @desc Get download URL for a backup
 * @access Private - Requires authentication
 */
router.get('/download/:backupId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { backupId } = req.params;
    
    // Get backup metadata
    const backup = await cleanupBackup.getBackupRecord(backupId);
    
    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found'
      });
    }
    
    // Generate signed URL for download
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
  })
);

// Initialize backup scheduler when this route is loaded
backupScheduler.initialize().catch(err => {
  logger.error('Failed to initialize backup scheduler', err);
});

export default router;