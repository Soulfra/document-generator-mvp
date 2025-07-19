"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const showcase_service_1 = require("../../services/showcase.service");
const logger_1 = require("../../utils/logger");
const presence_logger_1 = require("../../monitoring/presence-logger");
const router = (0, express_1.Router)();
/**
 * POST /api/showcase
 * Create a new project showcase
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, beforeCode, afterCode, technologies = [], userId = 'demo-user' } = req.body;
        if (!title || !beforeCode || !afterCode) {
            return res.status(400).json({
                success: false,
                error: 'Title, beforeCode, and afterCode are required'
            });
        }
        const showcase = await showcase_service_1.showcaseService.createShowcase(userId, title, description, beforeCode, afterCode, technologies, {
            sessionId: req.sessionID,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
        });
        // Log showcase creation
        await presence_logger_1.presenceLogger.logUserPresence('showcase_created', {
            userId,
            sessionId: req.sessionID,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
                showcaseId: showcase.id,
                title,
                technologies
            }
        });
        res.json({
            success: true,
            data: showcase
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create showcase', { error, body: req.body });
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/showcase/:id
 * Get showcase by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const viewerId = req.query.userId || req.session?.userId;
        const showcase = await showcase_service_1.showcaseService.getShowcase(id, viewerId);
        if (!showcase) {
            return res.status(404).json({
                success: false,
                error: 'Showcase not found'
            });
        }
        res.json({
            success: true,
            data: showcase
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get showcase', { error, showcaseId: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to get showcase'
        });
    }
});
/**
 * POST /api/showcase/:id/share
 * Share a showcase
 */
router.post('/:id/share', async (req, res) => {
    try {
        const { id } = req.params;
        const { shareMethod = 'link', userId } = req.body;
        const sharerId = userId || req.session?.userId;
        await showcase_service_1.showcaseService.shareShowcase(id, sharerId, shareMethod);
        res.json({
            success: true,
            message: 'Showcase shared successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to share showcase', { error, showcaseId: req.params.id });
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * POST /api/showcase/:id/like
 * Like a showcase
 */
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId = 'demo-user' } = req.body;
        await showcase_service_1.showcaseService.likeShowcase(id, userId);
        res.json({
            success: true,
            message: 'Showcase liked successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to like showcase', { error, showcaseId: req.params.id });
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /api/showcase/user/:userId
 * Get user's showcases
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const showcases = showcase_service_1.showcaseService.getUserShowcases(userId);
        res.json({
            success: true,
            data: showcases
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user showcases', { error, userId: req.params.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to get user showcases'
        });
    }
});
/**
 * GET /api/showcase/public
 * Get public showcases (trending/popular)
 */
router.get('/public', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const sortBy = req.query.sortBy || 'popular';
        const showcases = showcase_service_1.showcaseService.getPublicShowcases(limit, sortBy);
        res.json({
            success: true,
            data: showcases
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get public showcases', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get public showcases'
        });
    }
});
/**
 * GET /api/showcase/analytics
 * Get showcase analytics
 */
router.get('/analytics', async (req, res) => {
    try {
        const analytics = await showcase_service_1.showcaseService.getShowcaseAnalytics();
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get showcase analytics', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get showcase analytics'
        });
    }
});
/**
 * GET /api/showcase
 * Get current user's showcases (uses session)
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.session?.userId || 'demo-user';
        const showcases = showcase_service_1.showcaseService.getUserShowcases(userId);
        res.json({
            success: true,
            data: showcases
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get current user showcases', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get user showcases'
        });
    }
});
exports.default = router;
//# sourceMappingURL=showcase.route.js.map