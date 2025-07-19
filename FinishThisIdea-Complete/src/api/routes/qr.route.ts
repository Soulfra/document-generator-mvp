/**
 * QR Code API Routes
 */

import { Router } from 'express';
import { qrService } from '../../services/qr/qr.service';
import { logger } from '../../utils/logger';
import { validation } from '../../middleware/validation.middleware';
import { authentication } from '../../middleware/auth.middleware';
import Joi from 'joi';

const router = Router();

// Validation schemas
const generateReferralQRSchema = Joi.object({
  referralCode: Joi.string().required().min(1),
  baseUrl: Joi.string().uri().optional(),
  options: Joi.object({
    width: Joi.number().min(50).max(1000).optional(),
    color: Joi.object({
      dark: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
      light: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
    }).optional(),
    errorCorrectionLevel: Joi.string().valid('L', 'M', 'Q', 'H').optional()
  }).optional()
});

const generateAuthQRSchema = Joi.object({
  sessionData: Joi.object().required(),
  expiryMinutes: Joi.number().min(1).max(60).optional()
});

const generateShareQRSchema = Joi.object({
  url: Joi.string().uri().required(),
  metadata: Joi.object().optional(),
  options: Joi.object({
    width: Joi.number().min(50).max(1000).optional(),
    color: Joi.object({
      dark: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
      light: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
    }).optional(),
    errorCorrectionLevel: Joi.string().valid('L', 'M', 'Q', 'H').optional()
  }).optional()
});

/**
 * Generate QR code for referral links
 * POST /api/qr/referral
 */
router.post('/referral', 
  authentication({ optional: true }),
  validation(generateReferralQRSchema),
  async (req, res) => {
    try {
      const { referralCode, baseUrl, options } = req.body;
      
      const result = await qrService.generateReferralQR(referralCode, baseUrl, options);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to generate referral QR', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: {
          code: 'QR_GENERATION_FAILED',
          message: 'Failed to generate QR code'
        }
      });
    }
  }
);

/**
 * Generate QR code for authentication
 * POST /api/qr/auth
 */
router.post('/auth',
  authentication(),
  validation(generateAuthQRSchema),
  async (req, res) => {
    try {
      const { sessionData, expiryMinutes } = req.body;
      
      const result = await qrService.generateAuthQR(sessionData, expiryMinutes);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to generate auth QR', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: {
          code: 'QR_GENERATION_FAILED',
          message: 'Failed to generate authentication QR code'
        }
      });
    }
  }
);

/**
 * Generate QR code for sharing
 * POST /api/qr/share
 */
router.post('/share',
  authentication({ optional: true }),
  validation(generateShareQRSchema),
  async (req, res) => {
    try {
      const { url, metadata, options } = req.body;
      
      const result = await qrService.generateShareQR(url, metadata, options);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to generate share QR', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: {
          code: 'QR_GENERATION_FAILED',
          message: 'Failed to generate share QR code'
        }
      });
    }
  }
);

/**
 * Get QR code data
 * GET /api/qr/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const qrData = await qrService.getQRData(id);
    
    if (!qrData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QR_NOT_FOUND',
          message: 'QR code not found or expired'
        }
      });
    }
    
    res.json({
      success: true,
      data: qrData
    });
  } catch (error) {
    logger.error('Failed to get QR data', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'QR_RETRIEVAL_FAILED',
        message: 'Failed to retrieve QR code data'
      }
    });
  }
});

/**
 * Track QR code scan
 * POST /api/qr/:id/scan
 */
router.post('/:id/scan', async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = req.body;
    
    await qrService.trackQRScan(id, {
      ...metadata,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Scan tracked successfully'
    });
  } catch (error) {
    logger.error('Failed to track QR scan', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      error: {
        code: 'SCAN_TRACKING_FAILED',
        message: 'Failed to track QR scan'
      }
    });
  }
});

/**
 * Get QR code analytics
 * GET /api/qr/:id/analytics
 */
router.get('/:id/analytics',
  authentication(),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const analytics = await qrService.getQRAnalytics(id);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Failed to get QR analytics', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_FAILED',
          message: 'Failed to retrieve QR analytics'
        }
      });
    }
  }
);

/**
 * Clean up expired QR codes (admin only)
 * POST /api/qr/cleanup
 */
router.post('/cleanup',
  authentication({ role: 'admin' }),
  async (req, res) => {
    try {
      const cleaned = await qrService.cleanupExpiredQRCodes();
      
      res.json({
        success: true,
        data: {
          cleaned,
          message: `Cleaned up ${cleaned} expired QR codes`
        }
      });
    } catch (error) {
      logger.error('Failed to cleanup QR codes', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'CLEANUP_FAILED',
          message: 'Failed to cleanup expired QR codes'
        }
      });
    }
  }
);

export { router as qrRouter };