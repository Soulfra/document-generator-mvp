"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trustTierCheck = trustTierCheck;
exports.trustTierRateLimit = trustTierRateLimit;
exports.trustTierFileValidation = trustTierFileValidation;
const trust_tier_service_1 = require("../services/trust/trust-tier.service");
const logger_1 = require("../utils/logger");
function trustTierCheck(options = {}) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || req.body?.userId || req.query?.userId;
            if (!userId) {
                req.trustTier = trust_tier_service_1.TrustTier.BRONZE;
                req.trustFeatures = trust_tier_service_1.trustTierService.getTierFeatures(trust_tier_service_1.TrustTier.BRONZE);
                return next();
            }
            const metrics = await trust_tier_service_1.trustTierService.getUserTrustMetrics(userId);
            req.trustTier = metrics.currentTier;
            req.trustFeatures = trust_tier_service_1.trustTierService.getTierFeatures(metrics.currentTier);
            req.trustMetrics = metrics;
            if (options.feature) {
                const value = options.checkValue ? options.checkValue(req) : undefined;
                const permission = await trust_tier_service_1.trustTierService.checkTierPermission(userId, options.feature, value);
                if (!permission.allowed) {
                    logger_1.logger.warn('Trust tier permission denied', {
                        userId,
                        tier: metrics.currentTier,
                        feature: options.feature,
                        reason: permission.reason
                    });
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'TIER_RESTRICTION',
                            message: permission.reason || 'This feature is not available for your tier',
                            currentTier: metrics.currentTier,
                            upgradeUrl: '/upgrade'
                        }
                    });
                }
            }
            if (options.minTier) {
                const tierOrder = [trust_tier_service_1.TrustTier.BRONZE, trust_tier_service_1.TrustTier.SILVER, trust_tier_service_1.TrustTier.GOLD, trust_tier_service_1.TrustTier.PLATINUM];
                const currentIndex = tierOrder.indexOf(metrics.currentTier);
                const requiredIndex = tierOrder.indexOf(options.minTier);
                if (currentIndex < requiredIndex) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_TIER',
                            message: `This feature requires ${options.minTier} tier or higher`,
                            currentTier: metrics.currentTier,
                            requiredTier: options.minTier,
                            upgradeUrl: '/upgrade'
                        }
                    });
                }
            }
            const upgradeCheck = await trust_tier_service_1.trustTierService.checkForTierUpgrade(userId);
            if (upgradeCheck.shouldUpgrade && upgradeCheck.newTier) {
                logger_1.logger.info('User tier auto-upgraded', {
                    userId,
                    from: upgradeCheck.currentTier,
                    to: upgradeCheck.newTier
                });
                req.trustTier = upgradeCheck.newTier;
                req.trustFeatures = trust_tier_service_1.trustTierService.getTierFeatures(upgradeCheck.newTier);
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Trust tier middleware error', { error });
            req.trustTier = trust_tier_service_1.TrustTier.BRONZE;
            req.trustFeatures = trust_tier_service_1.trustTierService.getTierFeatures(trust_tier_service_1.TrustTier.BRONZE);
            next();
        }
    };
}
function trustTierRateLimit() {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || req.body?.userId || req.query?.userId;
            if (!userId) {
                return next();
            }
            const rateLimit = await trust_tier_service_1.trustTierService.checkRateLimits(userId);
            if (!rateLimit.allowed) {
                logger_1.logger.warn('Trust tier rate limit exceeded', {
                    userId,
                    reason: rateLimit.reason
                });
                return res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: rateLimit.reason || 'Rate limit exceeded',
                        resetAt: rateLimit.resetAt,
                        upgradeUrl: '/upgrade'
                    }
                });
            }
            if (rateLimit.remaining !== undefined) {
                res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
            }
            if (rateLimit.resetAt) {
                res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Trust tier rate limit error', { error });
            next();
        }
    };
}
function trustTierFileValidation() {
    return async (req, res, next) => {
        try {
            if (!req.file) {
                return next();
            }
            const userId = req.user?.id || req.body?.userId || req.query?.userId;
            const tier = req.trustTier || trust_tier_service_1.TrustTier.BRONZE;
            const features = trust_tier_service_1.trustTierService.getTierFeatures(tier);
            const fileSizeMB = req.file.size / (1024 * 1024);
            if (fileSizeMB > features.maxFileSize) {
                return res.status(413).json({
                    success: false,
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: `File size ${fileSizeMB.toFixed(2)}MB exceeds ${tier} tier limit of ${features.maxFileSize}MB`,
                        currentTier: tier,
                        upgradeUrl: '/upgrade'
                    }
                });
            }
            const fileExt = req.file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
            if (fileExt && !features.allowedFileTypes.includes(fileExt)) {
                return res.status(415).json({
                    success: false,
                    error: {
                        code: 'FILE_TYPE_NOT_ALLOWED',
                        message: `File type ${fileExt} is not allowed for ${tier} tier`,
                        allowedTypes: features.allowedFileTypes,
                        currentTier: tier,
                        upgradeUrl: '/upgrade'
                    }
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Trust tier file validation error', { error });
            next();
        }
    };
}
//# sourceMappingURL=trust-tier.middleware.js.map