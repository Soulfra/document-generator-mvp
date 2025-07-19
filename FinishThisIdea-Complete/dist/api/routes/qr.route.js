"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrRouter = void 0;
const express_1 = require("express");
const qr_service_1 = require("../../services/qr/qr.service");
const logger_1 = require("../../utils/logger");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.qrRouter = router;
const generateReferralQRSchema = joi_1.default.object({
    referralCode: joi_1.default.string().required().min(1),
    baseUrl: joi_1.default.string().uri().optional(),
    options: joi_1.default.object({
        width: joi_1.default.number().min(50).max(1000).optional(),
        color: joi_1.default.object({
            dark: joi_1.default.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
            light: joi_1.default.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
        }).optional(),
        errorCorrectionLevel: joi_1.default.string().valid('L', 'M', 'Q', 'H').optional()
    }).optional()
});
const generateAuthQRSchema = joi_1.default.object({
    sessionData: joi_1.default.object().required(),
    expiryMinutes: joi_1.default.number().min(1).max(60).optional()
});
const generateShareQRSchema = joi_1.default.object({
    url: joi_1.default.string().uri().required(),
    metadata: joi_1.default.object().optional(),
    options: joi_1.default.object({
        width: joi_1.default.number().min(50).max(1000).optional(),
        color: joi_1.default.object({
            dark: joi_1.default.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
            light: joi_1.default.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
        }).optional(),
        errorCorrectionLevel: joi_1.default.string().valid('L', 'M', 'Q', 'H').optional()
    }).optional()
});
router.post('/referral', (0, auth_middleware_1.authentication)({ optional: true }), (0, validation_middleware_1.validation)(generateReferralQRSchema), async (req, res) => {
    try {
        const { referralCode, baseUrl, options } = req.body;
        const result = await qr_service_1.qrService.generateReferralQR(referralCode, baseUrl, options);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate referral QR', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: {
                code: 'QR_GENERATION_FAILED',
                message: 'Failed to generate QR code'
            }
        });
    }
});
router.post('/auth', (0, auth_middleware_1.authentication)(), (0, validation_middleware_1.validation)(generateAuthQRSchema), async (req, res) => {
    try {
        const { sessionData, expiryMinutes } = req.body;
        const result = await qr_service_1.qrService.generateAuthQR(sessionData, expiryMinutes);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate auth QR', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: {
                code: 'QR_GENERATION_FAILED',
                message: 'Failed to generate authentication QR code'
            }
        });
    }
});
router.post('/share', (0, auth_middleware_1.authentication)({ optional: true }), (0, validation_middleware_1.validation)(generateShareQRSchema), async (req, res) => {
    try {
        const { url, metadata, options } = req.body;
        const result = await qr_service_1.qrService.generateShareQR(url, metadata, options);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate share QR', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: {
                code: 'QR_GENERATION_FAILED',
                message: 'Failed to generate share QR code'
            }
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const qrData = await qr_service_1.qrService.getQRData(id);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get QR data', { error, id: req.params.id });
        res.status(500).json({
            success: false,
            error: {
                code: 'QR_RETRIEVAL_FAILED',
                message: 'Failed to retrieve QR code data'
            }
        });
    }
});
router.post('/:id/scan', async (req, res) => {
    try {
        const { id } = req.params;
        const metadata = req.body;
        await qr_service_1.qrService.trackQRScan(id, {
            ...metadata,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date()
        });
        res.json({
            success: true,
            message: 'Scan tracked successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to track QR scan', { error, id: req.params.id });
        res.status(500).json({
            success: false,
            error: {
                code: 'SCAN_TRACKING_FAILED',
                message: 'Failed to track QR scan'
            }
        });
    }
});
router.get('/:id/analytics', (0, auth_middleware_1.authentication)(), async (req, res) => {
    try {
        const { id } = req.params;
        const analytics = await qr_service_1.qrService.getQRAnalytics(id);
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get QR analytics', { error, id: req.params.id });
        res.status(500).json({
            success: false,
            error: {
                code: 'ANALYTICS_FAILED',
                message: 'Failed to retrieve QR analytics'
            }
        });
    }
});
router.post('/cleanup', (0, auth_middleware_1.authentication)({ role: 'admin' }), async (req, res) => {
    try {
        const cleaned = await qr_service_1.qrService.cleanupExpiredQRCodes();
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
            error: {
                code: 'CLEANUP_FAILED',
                message: 'Failed to cleanup expired QR codes'
            }
        });
    }
});
//# sourceMappingURL=qr.route.js.map