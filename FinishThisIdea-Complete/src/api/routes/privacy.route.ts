/**
 * Privacy & Data Rights API Routes
 * GDPR/CCPA compliance endpoints for data export, deletion, and consent management
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { gdprService } from '../../services/compliance/gdpr.service';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../../services/monitoring/prometheus-metrics.service';
import Joi from 'joi';

const router = Router();

// Validation schemas
const consentSchema = {
  body: Joi.object({
    consentType: Joi.string().valid(
      'essential', 'analytics', 'marketing', 'personalization',
      'third_party', 'ai_training', 'data_sharing', 'location',
      'cookies_functional', 'cookies_analytics', 'cookies_marketing'
    ).required(),
    granted: Joi.boolean().required(),
    purpose: Joi.string().max(500).required()
  })
};

const dataExportSchema = {
  body: Joi.object({
    includeActivity: Joi.boolean().default(true),
    includePreferences: Joi.boolean().default(true),
    format: Joi.string().valid('json', 'csv').default('json')
  })
};

const dataDeletionSchema = {
  body: Joi.object({
    anonymizationLevel: Joi.string().valid('partial', 'full').default('partial'),
    reason: Joi.string().max(500).optional()
  })
};

/**
 * Get current consent status
 * GET /api/privacy/consent
 */
router.get('/consent',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const consents = await gdprService.getUserConsent(userId);

      // Group by consent type and get latest for each
      const currentConsents = consents.reduce((acc, consent) => {
        if (!acc[consent.consentType] || consent.timestamp > acc[consent.consentType].timestamp) {
          acc[consent.consentType] = consent;
        }
        return acc;
      }, {} as Record<string, any>);

      res.json({
        success: true,
        data: {
          consents: currentConsents,
          totalRecords: consents.length,
          lastUpdated: Math.max(...consents.map(c => c.timestamp.getTime()))
        }
      });

    } catch (error) {
      logger.error('Failed to get user consent', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve consent information'
      });
    }
  }
);

/**
 * Update consent preferences
 * POST /api/privacy/consent
 */
router.post('/consent',
  authenticate(),
  validate(consentSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { consentType, granted, purpose } = req.body;

      const consent = await gdprService.recordConsent(
        userId,
        consentType,
        granted,
        purpose,
        req
      );

      logger.info('Consent updated', {
        userId,
        consentType,
        granted,
        requestId: (req as any).requestId
      });

      res.json({
        success: true,
        data: consent,
        message: `Consent for ${consentType} has been ${granted ? 'granted' : 'withdrawn'}`
      });

    } catch (error) {
      logger.error('Failed to update consent', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update consent preferences'
      });
    }
  }
);

/**
 * Withdraw specific consent
 * DELETE /api/privacy/consent/:consentType
 */
router.delete('/consent/:consentType',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { consentType } = req.params;

      await gdprService.withdrawConsent(userId, consentType as any, req);

      logger.info('Consent withdrawn', {
        userId,
        consentType,
        requestId: (req as any).requestId
      });

      res.json({
        success: true,
        message: `Consent for ${consentType} has been withdrawn`
      });

    } catch (error) {
      logger.error('Failed to withdraw consent', error);
      res.status(500).json({
        success: false,
        error: 'Failed to withdraw consent'
      });
    }
  }
);

/**
 * Request data export
 * POST /api/privacy/data/export
 */
router.post('/data/export',
  authenticate(),
  validate(dataExportSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Check if user has an existing pending request
      const existingRequest = await gdprService.getPendingExportRequest(userId);
      if (existingRequest) {
        return res.status(409).json({
          success: false,
          error: 'You already have a pending data export request',
          data: existingRequest
        });
      }

      const exportRequest = await gdprService.createDataExportRequest(userId);

      logger.info('Data export requested', {
        userId,
        requestId: exportRequest.id,
        ip: req.ip
      });

      prometheusMetrics.recordAchievementUnlocked('data_export_requested', req.user!.tier || 'seedling');

      res.json({
        success: true,
        data: exportRequest,
        message: 'Data export request created. You will receive an email when your data is ready for download.'
      });

    } catch (error) {
      logger.error('Failed to create data export request', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create data export request'
      });
    }
  }
);

/**
 * Get data export status
 * GET /api/privacy/data/export
 */
router.get('/data/export',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const exports = await gdprService.getUserExportRequests(userId);

      res.json({
        success: true,
        data: exports
      });

    } catch (error) {
      logger.error('Failed to get export requests', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve export requests'
      });
    }
  }
);

/**
 * Download exported data
 * GET /api/privacy/data/export/:requestId/download
 */
router.get('/data/export/:requestId/download',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { requestId } = req.params;

      const exportRequest = await gdprService.getExportRequest(requestId);

      if (!exportRequest || exportRequest.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Export request not found'
        });
      }

      if (exportRequest.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Export is not ready for download'
        });
      }

      if (exportRequest.expiresAt && exportRequest.expiresAt < new Date()) {
        return res.status(410).json({
          success: false,
          error: 'Download link has expired'
        });
      }

      // Generate secure download URL or stream file
      const downloadUrl = await gdprService.generateSecureDownloadUrl(requestId, userId);

      logger.info('Data export downloaded', {
        userId,
        requestId,
        ip: req.ip
      });

      res.json({
        success: true,
        data: {
          downloadUrl,
          expiresAt: exportRequest.expiresAt
        }
      });

    } catch (error) {
      logger.error('Failed to download export', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate download link'
      });
    }
  }
);

/**
 * Request data deletion (Right to be Forgotten)
 * POST /api/privacy/data/delete
 */
router.post('/data/delete',
  authenticate(),
  validate(dataDeletionSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { anonymizationLevel, reason } = req.body;

      // Check if user has an existing pending request
      const existingRequest = await gdprService.getPendingDeletionRequest(userId);
      if (existingRequest) {
        return res.status(409).json({
          success: false,
          error: 'You already have a pending data deletion request',
          data: existingRequest
        });
      }

      const deletionRequest = await gdprService.createDataDeletionRequest(
        userId,
        anonymizationLevel
      );

      logger.warn('Data deletion requested', {
        userId,
        requestId: deletionRequest.id,
        anonymizationLevel,
        reason,
        ip: req.ip
      });

      prometheusMetrics.recordAchievementUnlocked('data_deletion_requested', req.user!.tier || 'seedling');

      res.json({
        success: true,
        data: deletionRequest,
        message: 'Data deletion request created. Your data will be deleted after the required waiting period.',
        waitingPeriod: '30 days'
      });

    } catch (error) {
      logger.error('Failed to create data deletion request', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create data deletion request'
      });
    }
  }
);

/**
 * Get data deletion status
 * GET /api/privacy/data/delete
 */
router.get('/data/delete',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const deletions = await gdprService.getUserDeletionRequests(userId);

      res.json({
        success: true,
        data: deletions
      });

    } catch (error) {
      logger.error('Failed to get deletion requests', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve deletion requests'
      });
    }
  }
);

/**
 * Cancel data deletion request (if still in waiting period)
 * DELETE /api/privacy/data/delete/:requestId
 */
router.delete('/data/delete/:requestId',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { requestId } = req.params;

      const success = await gdprService.cancelDeletionRequest(requestId, userId);

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel deletion request - it may have already been processed'
        });
      }

      logger.info('Data deletion request cancelled', {
        userId,
        requestId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Data deletion request has been cancelled'
      });

    } catch (error) {
      logger.error('Failed to cancel deletion request', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel deletion request'
      });
    }
  }
);

/**
 * Get data access log (Right to Know)
 * GET /api/privacy/data/access-log
 */
router.get('/data/access-log',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, startDate, endDate } = req.query;

      const accessLog = await gdprService.getUserDataAccessLog(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.json({
        success: true,
        data: accessLog
      });

    } catch (error) {
      logger.error('Failed to get access log', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve data access log'
      });
    }
  }
);

/**
 * Get privacy policy acceptance status
 * GET /api/privacy/policy/status
 */
router.get('/policy/status',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const status = await gdprService.getPrivacyPolicyStatus(userId);

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Failed to get privacy policy status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve privacy policy status'
      });
    }
  }
);

/**
 * Accept privacy policy
 * POST /api/privacy/policy/accept
 */
router.post('/policy/accept',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { version } = req.body;

      await gdprService.acceptPrivacyPolicy(userId, version || 'latest', req);

      logger.info('Privacy policy accepted', {
        userId,
        version,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Privacy policy accepted'
      });

    } catch (error) {
      logger.error('Failed to accept privacy policy', error);
      res.status(500).json({
        success: false,
        error: 'Failed to accept privacy policy'
      });
    }
  }
);

/**
 * Get privacy dashboard summary
 * GET /api/privacy/dashboard
 */
router.get('/dashboard',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const [consents, exportRequests, deletionRequests, accessLog] = await Promise.all([
        gdprService.getUserConsent(userId),
        gdprService.getUserExportRequests(userId),
        gdprService.getUserDeletionRequests(userId),
        gdprService.getUserDataAccessLog(userId, { limit: 10 })
      ]);

      const dashboard = {
        consents: {
          total: consents.length,
          granted: consents.filter(c => c.granted).length,
          withdrawn: consents.filter(c => !c.granted).length
        },
        dataRequests: {
          exports: {
            total: exportRequests.length,
            pending: exportRequests.filter(r => r.status === 'pending').length,
            completed: exportRequests.filter(r => r.status === 'completed').length
          },
          deletions: {
            total: deletionRequests.length,
            pending: deletionRequests.filter(r => r.status === 'pending').length,
            completed: deletionRequests.filter(r => r.status === 'completed').length
          }
        },
        recentActivity: accessLog.records.slice(0, 5)
      };

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      logger.error('Failed to get privacy dashboard', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve privacy dashboard'
      });
    }
  }
);

export { router as privacyRouter };