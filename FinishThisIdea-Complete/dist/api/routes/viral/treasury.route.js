"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const treasury_service_1 = require("../../services/treasury.service");
const logger_1 = require("../../utils/logger");
const presence_logger_1 = require("../../monitoring/presence-logger");
const router = (0, express_1.Router)();
router.get('/stats', async (req, res) => {
    try {
        const stats = await treasury_service_1.treasuryService.getPlatformStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get treasury stats', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get treasury statistics'
        });
    }
});
router.get('/earnings/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const earnings = await treasury_service_1.treasuryService.getUserEarnings(userId);
        await presence_logger_1.presenceLogger.logUserPresence('earnings_viewed', {
            sessionId: req.sessionID,
            userId,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
                tokensHeld: earnings.tokensHeld,
                totalEarnings: earnings.totalEarnings
            }
        });
        res.json({
            success: true,
            data: earnings
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user earnings', { error, userId: req.params.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to get user earnings'
        });
    }
});
router.post('/revenue', async (req, res) => {
    try {
        const { amount, source = 'usage', userId = 'anonymous', metadata = {} } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }
        const result = await treasury_service_1.treasuryService.addRevenue(amount, {
            source,
            userId,
            metadata: {
                ...metadata,
                sessionId: req.sessionID,
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip
            }
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to add revenue', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: 'Failed to add revenue'
        });
    }
});
router.post('/tokens/award', async (req, res) => {
    try {
        const { userId, achievement, tokens } = req.body;
        if (!userId || !achievement || !tokens || tokens <= 0) {
            return res.status(400).json({
                success: false,
                error: 'userId, achievement, and tokens are required'
            });
        }
        const result = await treasury_service_1.treasuryService.awardAchievementTokens(userId, achievement, tokens);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to award tokens', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: 'Failed to award tokens'
        });
    }
});
router.post('/dividends/distribute', async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }
        const result = await treasury_service_1.treasuryService.distributeDividends(amount);
        await presence_logger_1.presenceLogger.logUserPresence('dividends_distributed', {
            sessionId: req.sessionID,
            userId: 'admin',
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            metadata: {
                amount,
                holdersCount: result.holders,
                totalDistributed: result.distributed
            }
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to distribute dividends', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: 'Failed to distribute dividends'
        });
    }
});
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type || 'tokens';
        let leaderboard = [];
        try {
            if (type === 'tokens') {
                const users = await global.prisma?.user.findMany({
                    where: {
                        platformTokens: { gt: 0 }
                    },
                    select: {
                        id: true,
                        name: true,
                        platformTokens: true
                    },
                    orderBy: {
                        platformTokens: 'desc'
                    },
                    take: limit
                });
                leaderboard = users || [];
            }
            else if (type === 'earnings') {
                const users = await global.prisma?.user.findMany({
                    where: {
                        totalEarnings: { gt: 0 }
                    },
                    select: {
                        id: true,
                        name: true,
                        totalEarnings: true,
                        referralEarnings: true
                    },
                    orderBy: {
                        totalEarnings: 'desc'
                    },
                    take: limit
                });
                leaderboard = users || [];
            }
        }
        catch (error) {
            logger_1.logger.warn('Cannot fetch leaderboard from database', { error: error.message });
        }
        res.json({
            success: true,
            data: {
                type,
                leaderboard,
                count: leaderboard.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get leaderboard', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get leaderboard'
        });
    }
});
router.post('/payment/process', async (req, res) => {
    try {
        const { amount, userId, metadata = {} } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }
        const result = await treasury_service_1.treasuryService.processPayment(amount, userId || 'anonymous', {
            ...metadata,
            sessionId: req.sessionID,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            timestamp: new Date().toISOString()
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to process payment', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: 'Failed to process payment'
        });
    }
});
router.get('/earnings', async (req, res) => {
    try {
        const userId = req.session?.userId || 'anonymous';
        const earnings = await treasury_service_1.treasuryService.getUserEarnings(userId);
        res.json({
            success: true,
            data: earnings
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get current user earnings', { error });
        res.status(500).json({
            success: false,
            error: 'Failed to get earnings'
        });
    }
});
router.post('/referral', async (req, res) => {
    try {
        const { amount, referrerId, newUserId, metadata = {} } = req.body;
        if (!amount || !referrerId || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'amount and referrerId are required'
            });
        }
        const result = await treasury_service_1.treasuryService.addRevenue(amount, {
            source: 'referral',
            userId: newUserId || 'anonymous',
            metadata: {
                ...metadata,
                referrerId,
                sessionId: req.sessionID,
                timestamp: new Date().toISOString()
            }
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to process referral', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: 'Failed to process referral'
        });
    }
});
exports.default = router;
//# sourceMappingURL=treasury.route.js.map