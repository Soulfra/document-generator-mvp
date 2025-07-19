"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const gdpr_service_1 = require("../../services/compliance/gdpr.service");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../../services/monitoring/prometheus-metrics.service");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.privacyRouter = router;
const consentSchema = {
    body: joi_1.default.object({
        consentType: joi_1.default.string().valid('essential', 'analytics', 'marketing', 'personalization', 'third_party', 'ai_training', 'data_sharing', 'location', 'cookies_functional', 'cookies_analytics', 'cookies_marketing').required(),
        granted: joi_1.default.boolean().required(),
        purpose: joi_1.default.string().max(500).required()
    })
};
const dataExportSchema = {
    body: joi_1.default.object({
        includeActivity: joi_1.default.boolean().default(true),
        includePreferences: joi_1.default.boolean().default(true),
        format: joi_1.default.string().valid('json', 'csv').default('json')
    })
};
const dataDeletionSchema = {
    body: joi_1.default.object({
        anonymizationLevel: joi_1.default.string().valid('partial', 'full').default('partial'),
        reason: joi_1.default.string().max(500).optional()
    })
};
router.get('/consent', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const consents = await gdpr_service_1.gdprService.getUserConsent(userId);
        const currentConsents = consents.reduce((acc, consent) => {
            if (!acc[consent.consentType] || consent.timestamp > acc[consent.consentType].timestamp) {
                acc[consent.consentType] = consent;
            }
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                consents: currentConsents,
                totalRecords: consents.length,
                lastUpdated: Math.max(...consents.map(c => c.timestamp.getTime()))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user consent', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve consent information'
        });
    }
});
router.post('/consent', (0, auth_middleware_1.authenticate)(), (0, validation_middleware_1.validate)(consentSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { consentType, granted, purpose } = req.body;
        const consent = await gdpr_service_1.gdprService.recordConsent(userId, consentType, granted, purpose, req);
        logger_1.logger.info('Consent updated', {
            userId,
            consentType,
            granted,
            requestId: req.requestId
        });
        res.json({
            success: true,
            data: consent,
            message: `Consent for ${consentType} has been ${granted ? 'granted' : 'withdrawn'}`
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update consent', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update consent preferences'
        });
    }
});
router.delete('/consent/:consentType', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const { consentType } = req.params;
        await gdpr_service_1.gdprService.withdrawConsent(userId, consentType, req);
        logger_1.logger.info('Consent withdrawn', {
            userId,
            consentType,
            requestId: req.requestId
        });
        res.json({
            success: true,
            message: `Consent for ${consentType} has been withdrawn`
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to withdraw consent', error);
        res.status(500).json({
            success: false,
            error: 'Failed to withdraw consent'
        });
    }
});
router.post('/data/export', (0, auth_middleware_1.authenticate)(), (0, validation_middleware_1.validate)(dataExportSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const existingRequest = await gdpr_service_1.gdprService.getPendingExportRequest(userId);
        if (existingRequest) {
            return res.status(409).json({
                success: false,
                error: 'You already have a pending data export request',
                data: existingRequest
            });
        }
        const exportRequest = await gdpr_service_1.gdprService.createDataExportRequest(userId);
        logger_1.logger.info('Data export requested', {
            userId,
            requestId: exportRequest.id,
            ip: req.ip
        });
        prometheus_metrics_service_1.prometheusMetrics.recordAchievementUnlocked('data_export_requested', req.user.tier || 'seedling');
        res.json({
            success: true,
            data: exportRequest,
            message: 'Data export request created. You will receive an email when your data is ready for download.'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create data export request', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create data export request'
        });
    }
});
router.get('/data/export', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const exports = await gdpr_service_1.gdprService.getUserExportRequests(userId);
        res.json({
            success: true,
            data: exports
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get export requests', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve export requests'
        });
    }
});
router.get('/data/export/:requestId/download', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;
        const exportRequest = await gdpr_service_1.gdprService.getExportRequest(requestId);
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
        const downloadUrl = await gdpr_service_1.gdprService.generateSecureDownloadUrl(requestId, userId);
        logger_1.logger.info('Data export downloaded', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to download export', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate download link'
        });
    }
});
router.post('/data/delete', (0, auth_middleware_1.authenticate)(), (0, validation_middleware_1.validate)(dataDeletionSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { anonymizationLevel, reason } = req.body;
        const existingRequest = await gdpr_service_1.gdprService.getPendingDeletionRequest(userId);
        if (existingRequest) {
            return res.status(409).json({
                success: false,
                error: 'You already have a pending data deletion request',
                data: existingRequest
            });
        }
        const deletionRequest = await gdpr_service_1.gdprService.createDataDeletionRequest(userId, anonymizationLevel);
        logger_1.logger.warn('Data deletion requested', {
            userId,
            requestId: deletionRequest.id,
            anonymizationLevel,
            reason,
            ip: req.ip
        });
        prometheus_metrics_service_1.prometheusMetrics.recordAchievementUnlocked('data_deletion_requested', req.user.tier || 'seedling');
        res.json({
            success: true,
            data: deletionRequest,
            message: 'Data deletion request created. Your data will be deleted after the required waiting period.',
            waitingPeriod: '30 days'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create data deletion request', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create data deletion request'
        });
    }
});
router.get('/data/delete', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const deletions = await gdpr_service_1.gdprService.getUserDeletionRequests(userId);
        res.json({
            success: true,
            data: deletions
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get deletion requests', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve deletion requests'
        });
    }
});
router.delete('/data/delete/:requestId', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;
        const success = await gdpr_service_1.gdprService.cancelDeletionRequest(requestId, userId);
        if (!success) {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel deletion request - it may have already been processed'
            });
        }
        logger_1.logger.info('Data deletion request cancelled', {
            userId,
            requestId,
            ip: req.ip
        });
        res.json({
            success: true,
            message: 'Data deletion request has been cancelled'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to cancel deletion request', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel deletion request'
        });
    }
});
router.get('/data/access-log', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, startDate, endDate } = req.query;
        const accessLog = await gdpr_service_1.gdprService.getUserDataAccessLog(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        res.json({
            success: true,
            data: accessLog
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get access log', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve data access log'
        });
    }
});
router.get('/policy/status', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const status = await gdpr_service_1.gdprService.getPrivacyPolicyStatus(userId);
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get privacy policy status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve privacy policy status'
        });
    }
});
router.post('/policy/accept', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const { version } = req.body;
        await gdpr_service_1.gdprService.acceptPrivacyPolicy(userId, version || 'latest', req);
        logger_1.logger.info('Privacy policy accepted', {
            userId,
            version,
            ip: req.ip
        });
        res.json({
            success: true,
            message: 'Privacy policy accepted'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to accept privacy policy', error);
        res.status(500).json({
            success: false,
            error: 'Failed to accept privacy policy'
        });
    }
});
router.get('/dashboard', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const [consents, exportRequests, deletionRequests, accessLog] = await Promise.all([
            gdpr_service_1.gdprService.getUserConsent(userId),
            gdpr_service_1.gdprService.getUserExportRequests(userId),
            gdpr_service_1.gdprService.getUserDeletionRequests(userId),
            gdpr_service_1.gdprService.getUserDataAccessLog(userId, { limit: 10 })
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get privacy dashboard', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve privacy dashboard'
        });
    }
});
//# sourceMappingURL=privacy.route.js.map