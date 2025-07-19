"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const analytics_service_1 = require("../../services/analytics/analytics.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
exports.analyticsRouter = router;
const trackEventSchema = joi_1.default.object({
    event: joi_1.default.string().required().min(1).max(100),
    properties: joi_1.default.object().optional(),
    userId: joi_1.default.string().optional(),
    sessionId: joi_1.default.string().optional()
});
const identifyUserSchema = joi_1.default.object({
    userId: joi_1.default.string().required(),
    traits: joi_1.default.object({
        email: joi_1.default.string().email().optional(),
        name: joi_1.default.string().optional(),
        tier: joi_1.default.string().optional(),
        properties: joi_1.default.object().optional()
    }).optional()
});
const pageViewSchema = joi_1.default.object({
    page: joi_1.default.string().required(),
    properties: joi_1.default.object().optional(),
    userId: joi_1.default.string().optional(),
    sessionId: joi_1.default.string().optional()
});
const analyticsRateLimit = (0, rate_limit_middleware_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many analytics requests'
});
router.post('/track', analyticsRateLimit, (0, validation_middleware_1.validate)(trackEventSchema), async (req, res) => {
    try {
        const { event, properties, userId, sessionId } = req.body;
        await analytics_service_1.analyticsService.track({
            event,
            properties,
            userId: userId || req.user?.id,
            sessionId: sessionId || req.sessionId,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        res.status(200).json({
            success: true,
            message: 'Event tracked successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error tracking event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track event'
        });
    }
});
router.post('/identify', analyticsRateLimit, (0, validation_middleware_1.validate)(identifyUserSchema), async (req, res) => {
    try {
        const { userId, traits } = req.body;
        await analytics_service_1.analyticsService.identify({
            userId,
            email: traits?.email,
            name: traits?.name,
            tier: traits?.tier,
            properties: traits?.properties,
            lastActive: new Date()
        });
        res.status(200).json({
            success: true,
            message: 'User identified successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error identifying user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to identify user'
        });
    }
});
router.post('/pageview', analyticsRateLimit, (0, validation_middleware_1.validate)(pageViewSchema), async (req, res) => {
    try {
        const { page, properties, userId, sessionId } = req.body;
        await analytics_service_1.analyticsService.trackPageView(userId || req.user?.id || 'anonymous', sessionId || req.sessionId || '', page, {
            ...properties,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date()
        });
        res.status(200).json({
            success: true,
            message: 'Page view tracked successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error tracking page view:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track page view'
        });
    }
});
router.get('/session/:sessionId', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await analytics_service_1.analyticsService.getSession(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        if (session.userId && session.userId !== req.user?.id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        res.status(200).json({
            success: true,
            data: session
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get session'
        });
    }
});
router.post('/session/:sessionId/end', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await analytics_service_1.analyticsService.getSession(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        if (session.userId && session.userId !== req.user?.id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        await analytics_service_1.analyticsService.endSession(sessionId);
        res.status(200).json({
            success: true,
            message: 'Session ended successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error ending session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end session'
        });
    }
});
router.get('/realtime', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const stats = await analytics_service_1.analyticsService.getRealtimeStats();
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting realtime stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get realtime analytics'
        });
    }
});
router.post('/business/job-created', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        await analytics_service_1.analyticsService.trackJobCreated(userId, req.body);
        res.status(200).json({
            success: true,
            message: 'Job creation tracked'
        });
    }
    catch (error) {
        logger_1.logger.error('Error tracking job creation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track job creation'
        });
    }
});
router.post('/business/job-completed', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        await analytics_service_1.analyticsService.trackJobCompleted(userId, req.body);
        res.status(200).json({
            success: true,
            message: 'Job completion tracked'
        });
    }
    catch (error) {
        logger_1.logger.error('Error tracking job completion:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track job completion'
        });
    }
});
router.post('/business/file-uploaded', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        await analytics_service_1.analyticsService.trackFileUploaded(userId, req.body);
        res.status(200).json({
            success: true,
            message: 'File upload tracked'
        });
    }
    catch (error) {
        logger_1.logger.error('Error tracking file upload:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track file upload'
        });
    }
});
router.post('/business/credits-purchased', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        await analytics_service_1.analyticsService.trackCreditsPurchased(userId, req.body);
        res.status(200).json({
            success: true,
            message: 'Credit purchase tracked'
        });
    }
    catch (error) {
        logger_1.logger.error('Error tracking credit purchase:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track credit purchase'
        });
    }
});
router.post('/business/feature-used', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const userId = req.user.id;
        const { feature, properties } = req.body;
        await analytics_service_1.analyticsService.trackFeatureUsed(userId, feature, properties);
        res.status(200).json({
            success: true,
            message: 'Feature usage tracked'
        });
    }
    catch (error) {
        logger_1.logger.error('Error tracking feature usage:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track feature usage'
        });
    }
});
router.get('/dashboard/overview', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const { timeRange = '24h' } = req.query;
        const dashboardData = {
            totalUsers: await getTotalUsers(timeRange),
            activeUsers: await getActiveUsers(timeRange),
            totalSessions: await getTotalSessions(timeRange),
            avgSessionDuration: await getAvgSessionDuration(timeRange),
            topEvents: await getTopEvents(timeRange),
            topPages: await getTopPages(timeRange),
            userGrowth: await getUserGrowth(timeRange),
            featureUsage: await getFeatureUsage(timeRange)
        };
        res.status(200).json({
            success: true,
            data: dashboardData
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting dashboard overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard data'
        });
    }
});
router.get('/dashboard/users', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const { timeRange = '7d', page = 1, limit = 50 } = req.query;
        const userData = {
            users: await getUserAnalytics(timeRange, Number(page), Number(limit)),
            segments: await getUserSegments(),
            cohorts: await getCohortAnalysis(timeRange),
            retention: await getRetentionAnalysis(timeRange)
        };
        res.status(200).json({
            success: true,
            data: userData
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting user analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user analytics'
        });
    }
});
router.get('/dashboard/events', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const { timeRange = '7d', eventType } = req.query;
        const eventData = {
            events: await getEventAnalytics(timeRange, eventType),
            funnels: await getFunnelAnalysis(),
            conversions: await getConversionRates(timeRange)
        };
        res.status(200).json({
            success: true,
            data: eventData
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting event analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get event analytics'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const health = {
            analytics: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };
        res.status(200).json({
            success: true,
            data: health
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Analytics service unhealthy'
        });
    }
});
async function getTotalUsers(timeRange) {
    return 0;
}
async function getActiveUsers(timeRange) {
    return 0;
}
async function getTotalSessions(timeRange) {
    return 0;
}
async function getAvgSessionDuration(timeRange) {
    return 0;
}
async function getTopEvents(timeRange) {
    return [];
}
async function getTopPages(timeRange) {
    return [];
}
async function getUserGrowth(timeRange) {
    return [];
}
async function getFeatureUsage(timeRange) {
    return [];
}
async function getUserAnalytics(timeRange, page, limit) {
    return [];
}
async function getUserSegments() {
    return [];
}
async function getCohortAnalysis(timeRange) {
    return [];
}
async function getRetentionAnalysis(timeRange) {
    return [];
}
async function getEventAnalytics(timeRange, eventType) {
    return [];
}
async function getFunnelAnalysis() {
    return [];
}
async function getConversionRates(timeRange) {
    return [];
}
//# sourceMappingURL=analytics.route.js.map