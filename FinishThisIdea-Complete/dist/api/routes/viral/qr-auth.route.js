"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qr_auth_service_1 = require("../../services/viral/qr-auth.service");
const logger_1 = require("../../utils/logger");
const presence_logger_1 = require("../../monitoring/presence-logger");
const router = (0, express_1.Router)();
router.post('/generate', async (req, res) => {
    try {
        const sessionId = req.sessionID;
        const metadata = {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            timestamp: new Date().toISOString(),
            ...req.body.metadata
        };
        const qrCode = await qr_auth_service_1.qrAuthService.generateQRCode(sessionId, metadata);
        await presence_logger_1.presenceLogger.logUserPresence('qr_generated', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to generate QR code', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to generate QR code'
        });
    }
});
router.post('/scan/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        const userInfo = req.body;
        const qrData = await qr_auth_service_1.qrAuthService.validateQRCode(uuid);
        if (!qrData) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired QR code'
            });
        }
        const authResult = await qr_auth_service_1.qrAuthService.completeQRAuth(uuid, userInfo);
        await presence_logger_1.presenceLogger.logUserPresence('qr_auth_success', {
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
    }
    catch (error) {
        logger_1.logger.error('QR authentication failed', { error, uuid: req.params.uuid });
        await presence_logger_1.presenceLogger.logUserPresence('qr_auth_failed', {
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
router.get('/validate/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        const qrData = await qr_auth_service_1.qrAuthService.validateQRCode(uuid);
        if (!qrData) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired QR code'
            });
        }
        res.json({
            success: true,
            data: {
                uuid: qrData.uuid,
                expires_at: qrData.expires_at,
                metadata: qrData.metadata,
                used: qrData.used || false
            }
        });
    }
    catch (error) {
        logger_1.logger.error('QR validation failed', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to validate QR code'
        });
    }
});
router.post('/share/project', async (req, res) => {
    try {
        const { projectId, uploadId, permissions } = req.body;
        if (!projectId || !uploadId) {
            return res.status(400).json({
                success: false,
                error: 'Project ID and Upload ID are required'
            });
        }
        const qrCode = await qr_auth_service_1.qrAuthService.generateProjectShareQR(projectId, uploadId, permissions);
        await presence_logger_1.presenceLogger.logUserPresence('qr_project_share', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to generate project share QR', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to generate project share QR code'
        });
    }
});
router.post('/share/referral', async (req, res) => {
    try {
        const { referrerId, incentive } = req.body;
        if (!referrerId) {
            return res.status(400).json({
                success: false,
                error: 'Referrer ID is required'
            });
        }
        const qrCode = await qr_auth_service_1.qrAuthService.generateReferralQR(referrerId, incentive);
        await presence_logger_1.presenceLogger.logUserPresence('qr_referral_share', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to generate referral QR', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to generate referral QR code'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await qr_auth_service_1.qrAuthService.getQRStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get QR stats', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get QR statistics'
        });
    }
});
router.post('/cleanup', async (req, res) => {
    try {
        const cleaned = await qr_auth_service_1.qrAuthService.cleanupExpiredQRCodes();
        res.json({
            success: true,
            data: {
                cleaned,
                message: `Cleaned up ${cleaned} expired QR codes`
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to cleanup QR codes', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup expired QR codes'
        });
    }
});
router.post('/laboratory/session', async (req, res) => {
    try {
        const { sessionId, profiles, storyMode } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }
        const qrCode = await qr_auth_service_1.qrAuthService.generateLabSessionQR(sessionId, profiles || ['storyteller', 'technical', 'educator'], storyMode || false);
        await presence_logger_1.presenceLogger.logUserPresence('qr_lab_session', {
            sessionId: req.sessionID,
            userId: req.body.userId || 'anonymous',
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
                qrUuid: qrCode.uuid,
                labSessionId: sessionId,
                profiles: profiles || ['storyteller', 'technical', 'educator'],
                storyMode: storyMode || false
            }
        });
        res.json({
            success: true,
            data: qrCode
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate laboratory session QR', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to generate laboratory session QR code'
        });
    }
});
router.post('/offline/sync', async (req, res) => {
    try {
        const { userId, syncData } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        const qrCode = await qr_auth_service_1.qrAuthService.generateOfflineSyncQR(userId, syncData);
        await presence_logger_1.presenceLogger.logUserPresence('qr_offline_sync', {
            sessionId: req.sessionID,
            userId: userId,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
                qrUuid: qrCode.uuid,
                syncDataSize: JSON.stringify(syncData || {}).length
            }
        });
        res.json({
            success: true,
            data: qrCode
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate offline sync QR', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to generate offline sync QR code'
        });
    }
});
router.post('/story/activate', async (req, res) => {
    try {
        const { sessionId, storyPreferences } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }
        const qrCode = await qr_auth_service_1.qrAuthService.generateStoryModeQR(sessionId, storyPreferences);
        await presence_logger_1.presenceLogger.logUserPresence('qr_story_mode', {
            sessionId: req.sessionID,
            userId: req.body.userId || 'anonymous',
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
                qrUuid: qrCode.uuid,
                storySessionId: sessionId,
                storyPreferences: storyPreferences || {}
            }
        });
        res.json({
            success: true,
            data: qrCode
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate story mode QR', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to generate story mode QR code'
        });
    }
});
router.post('/team/collaborate', async (req, res) => {
    try {
        const { teamId, permissions, aiProfiles } = req.body;
        if (!teamId) {
            return res.status(400).json({
                success: false,
                error: 'Team ID is required'
            });
        }
        const qrCode = await qr_auth_service_1.qrAuthService.generateTeamCollabQR(teamId, permissions, aiProfiles);
        await presence_logger_1.presenceLogger.logUserPresence('qr_team_collab', {
            sessionId: req.sessionID,
            userId: req.body.userId || 'anonymous',
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
                qrUuid: qrCode.uuid,
                teamId,
                permissions: permissions || ['view', 'comment', 'vote'],
                aiProfiles: aiProfiles || []
            }
        });
        res.json({
            success: true,
            data: qrCode
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate team collaboration QR', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to generate team collaboration QR code'
        });
    }
});
exports.default = router;
//# sourceMappingURL=qr-auth.route.js.map