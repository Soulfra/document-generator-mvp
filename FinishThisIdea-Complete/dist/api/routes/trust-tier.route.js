"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trustTierRouter = void 0;
const express_1 = __importDefault(require("express"));
const async_handler_1 = require("../../utils/async-handler");
const trust_tier_service_1 = require("../../services/trust/trust-tier.service");
const logger_1 = require("../../utils/logger");
const database_1 = require("../../utils/database");
const router = express_1.default.Router();
exports.trustTierRouter = router;
router.get('/tiers', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const tiers = trust_tier_service_1.trustTierService.getAllTiers();
    res.json({
        success: true,
        data: {
            tiers,
            description: 'Trust tiers provide progressive access to features based on usage history and reliability'
        }
    });
}));
router.get('/my-tier', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
        return res.json({
            success: true,
            data: {
                tier: 'BRONZE',
                message: 'Anonymous users have BRONZE tier access',
                features: trust_tier_service_1.trustTierService.getTierFeatures('BRONZE')
            }
        });
    }
    try {
        const metrics = await trust_tier_service_1.trustTierService.getUserTrustMetrics(userId);
        const features = trust_tier_service_1.trustTierService.getTierFeatures(metrics.currentTier);
        const upgradeCheck = await trust_tier_service_1.trustTierService.checkForTierUpgrade(userId);
        const nextTierProgress = await calculateNextTierProgress(metrics);
        res.json({
            success: true,
            data: {
                currentTier: metrics.currentTier,
                metrics: {
                    totalJobs: metrics.totalJobs,
                    successRate: Math.round(metrics.successRate * 100),
                    totalSpent: metrics.totalSpent,
                    accountAge: metrics.accountAge,
                    violations: metrics.violations
                },
                features,
                nextTierProgress,
                canUpgrade: upgradeCheck.shouldUpgrade,
                upgradeToTier: upgradeCheck.newTier
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user tier', { error, userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'TIER_LOOKUP_FAILED',
                message: 'Failed to retrieve tier information'
            }
        });
    }
}));
router.post('/check-permission', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { feature, value } = req.body;
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'USER_ID_REQUIRED',
                message: 'User ID is required'
            }
        });
    }
    if (!feature) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'FEATURE_REQUIRED',
                message: 'Feature name is required'
            }
        });
    }
    const permission = await trust_tier_service_1.trustTierService.checkTierPermission(userId, feature, value);
    res.json({
        success: true,
        data: permission
    });
}));
router.get('/rate-limits', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'USER_ID_REQUIRED',
                message: 'User ID is required'
            }
        });
    }
    const rateLimit = await trust_tier_service_1.trustTierService.checkRateLimits(userId);
    const metrics = await trust_tier_service_1.trustTierService.getUserTrustMetrics(userId);
    const features = trust_tier_service_1.trustTierService.getTierFeatures(metrics.currentTier);
    res.json({
        success: true,
        data: {
            allowed: rateLimit.allowed,
            limits: {
                daily: features.maxJobsPerDay === -1 ? 'unlimited' : features.maxJobsPerDay,
                monthly: features.maxJobsPerMonth === -1 ? 'unlimited' : features.maxJobsPerMonth,
                remaining: rateLimit.remaining,
                resetAt: rateLimit.resetAt
            },
            currentTier: metrics.currentTier
        }
    });
}));
router.post('/simulate-tier', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId, tier } = req.body;
    if (!userId || !tier) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_PARAMS',
                message: 'userId and tier are required'
            }
        });
    }
    await database_1.prisma.user.update({
        where: { id: userId },
        data: {
            metadata: {
                simulatedTier: tier,
                simulatedAt: new Date().toISOString()
            }
        }
    });
    res.json({
        success: true,
        data: {
            message: `User ${userId} tier simulated as ${tier}`,
            note: 'This is for testing only and will be removed in production'
        }
    });
}));
async function calculateNextTierProgress(metrics) {
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const currentIndex = tierOrder.indexOf(metrics.currentTier);
    if (currentIndex === tierOrder.length - 1) {
        return {
            nextTier: null,
            message: 'You have reached the highest tier!',
            progress: 100
        };
    }
    const nextTier = tierOrder[currentIndex + 1];
    const requirements = {
        SILVER: {
            minJobs: 5,
            minSuccessRate: 0.8,
            minSpent: 5,
            minAccountAge: 7,
            maxViolations: 2
        },
        GOLD: {
            minJobs: 20,
            minSuccessRate: 0.9,
            minSpent: 20,
            minAccountAge: 30,
            maxViolations: 1
        },
        PLATINUM: {
            minJobs: 100,
            minSuccessRate: 0.95,
            minSpent: 100,
            minAccountAge: 90,
            maxViolations: 0
        }
    };
    const nextReqs = requirements[nextTier];
    if (!nextReqs)
        return null;
    const progress = {
        jobs: Math.min(100, (metrics.totalJobs / nextReqs.minJobs) * 100),
        successRate: Math.min(100, (metrics.successRate / nextReqs.minSuccessRate) * 100),
        spent: Math.min(100, (metrics.totalSpent / nextReqs.minSpent) * 100),
        accountAge: Math.min(100, (metrics.accountAge / nextReqs.minAccountAge) * 100),
        violations: metrics.violations <= nextReqs.maxViolations ? 100 : 0
    };
    const overallProgress = Object.values(progress).reduce((a, b) => a + b, 0) / 5;
    return {
        nextTier,
        requirements: nextReqs,
        progress: progress,
        overallProgress: Math.round(overallProgress),
        missing: Object.entries(progress)
            .filter(([_, value]) => value < 100)
            .map(([key]) => key)
    };
}
//# sourceMappingURL=trust-tier.route.js.map