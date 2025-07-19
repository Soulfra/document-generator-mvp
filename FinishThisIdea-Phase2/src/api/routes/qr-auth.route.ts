import { Router } from 'express';
import { qrAuthService } from '../../services/qr-auth.service';
import { logger } from '../../utils/logger';
import { presenceLogger } from '../../monitoring/presence-logger';

const router = Router();

/**
 * POST /api/qr-auth/generate
 * Generate a new QR code for authentication
 */
router.post('/generate', async (req, res) => {
  try {
    const sessionId = req.sessionID;
    const metadata = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      timestamp: new Date().toISOString(),
      ...req.body.metadata
    };

    const qrCode = await qrAuthService.generateQRCode(sessionId, metadata);

    // Log QR generation event
    await presenceLogger.logUserPresence('qr_generated', {
      sessionId,
      userId: 'anonymous',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        qrUuid: qrCode.uuid,
        qrType: metadata.type || 'auth'
      }
    });

    res.json({
      success: true,
      data: qrCode
    });
  } catch (error) {
    logger.error('Failed to generate QR code', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

/**
 * POST /api/qr-auth/scan/:uuid
 * Process QR code scan
 */
router.post('/scan/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const userInfo = req.body;

    // Validate QR code first
    const qrData = await qrAuthService.validateQRCode(uuid);
    
    if (!qrData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired QR code'
      });
    }

    // Complete authentication
    const authResult = await qrAuthService.completeQRAuth(uuid, userInfo);

    // Log successful QR authentication
    await presenceLogger.logUserPresence('qr_auth_success', {
      sessionId: qrData.sessionId,
      userId: authResult.user.id,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        qrUuid: uuid,
        qrType: qrData.metadata?.type || 'auth',
        onboarding: authResult.onboarding
      }
    });

    res.json({
      success: true,
      data: authResult
    });
  } catch (error) {
    logger.error('QR authentication failed', { error, uuid: req.params.uuid });
    
    // Log failed authentication
    await presenceLogger.logUserPresence('qr_auth_failed', {
      sessionId: req.sessionID,
      userId: 'anonymous',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        qrUuid: req.params.uuid,
        error: error.message
      }
    });

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/qr-auth/validate/:uuid
 * Validate QR code without consuming it
 */
router.get('/validate/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const qrData = await qrAuthService.validateQRCode(uuid);
    
    if (!qrData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired QR code'
      });
    }

    // Return QR data without sensitive info
    res.json({
      success: true,
      data: {
        uuid: qrData.uuid,
        expires_at: qrData.expires_at,
        metadata: qrData.metadata,
        used: qrData.used || false
      }
    });
  } catch (error) {
    logger.error('QR validation failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to validate QR code'
    });
  }
});

/**
 * POST /api/qr-auth/share/project
 * Generate QR code for project sharing
 */
router.post('/share/project', async (req, res) => {
  try {
    const { projectId, uploadId, permissions } = req.body;
    
    if (!projectId || !uploadId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and Upload ID are required'
      });
    }

    const qrCode = await qrAuthService.generateProjectShareQR(
      projectId, 
      uploadId, 
      permissions
    );

    // Log project share QR generation
    await presenceLogger.logUserPresence('qr_project_share', {
      sessionId: req.sessionID,
      userId: req.body.userId || 'anonymous',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        qrUuid: qrCode.uuid,
        projectId,
        uploadId,
        permissions
      }
    });

    res.json({
      success: true,
      data: qrCode
    });
  } catch (error) {
    logger.error('Failed to generate project share QR', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate project share QR code'
    });
  }
});

/**
 * POST /api/qr-auth/share/referral
 * Generate QR code for referral sharing
 */
router.post('/share/referral', async (req, res) => {
  try {
    const { referrerId, incentive } = req.body;
    
    if (!referrerId) {
      return res.status(400).json({
        success: false,
        error: 'Referrer ID is required'
      });
    }

    const qrCode = await qrAuthService.generateReferralQR(referrerId, incentive);

    // Log referral QR generation  
    await presenceLogger.logUserPresence('qr_referral_share', {
      sessionId: req.sessionID,
      userId: referrerId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        qrUuid: qrCode.uuid,
        incentive
      }
    });

    res.json({
      success: true,
      data: qrCode
    });
  } catch (error) {
    logger.error('Failed to generate referral QR', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate referral QR code'
    });
  }
});

/**
 * GET /api/qr-auth/stats
 * Get QR code usage statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await qrAuthService.getQRStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get QR stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get QR statistics'
    });
  }
});

/**
 * POST /api/qr-auth/cleanup
 * Clean up expired QR codes (admin endpoint)
 */
router.post('/cleanup', async (req, res) => {
  try {
    const cleaned = await qrAuthService.cleanupExpiredQRCodes();
    
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
      error: 'Failed to cleanup expired QR codes'
    });
  }
});

export default router;