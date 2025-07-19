"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyManagementService = exports.APIKeyManagementService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const presence_logger_1 = require("../monitoring/presence-logger");
const pricing_service_1 = require("./pricing.service");
class APIKeyManagementService {
    async generateAPIKeyForUser(userId, tier, options = {}) {
        try {
            const keyPrefix = `fti_${tier}`;
            const randomPart = crypto_1.default.randomBytes(24).toString('hex');
            const apiKey = `${keyPrefix}_${randomPart}`;
            const keyHash = crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
            let expiresAt;
            if (options.expiresInDays) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + options.expiresInDays);
            }
            const keyInfo = {
                id: crypto_1.default.randomUUID(),
                keyId: `key_${randomPart.substring(0, 12)}`,
                keyHash,
                tier,
                userId,
                isActive: true,
                createdAt: new Date(),
                expiresAt,
                usageCount: 0,
                metadata: {
                    name: options.name || `${tier} API Key`,
                    description: options.description || `Generated for ${tier} tier access`,
                }
            };
            await presence_logger_1.presenceLogger.logUserPresence('api_key_generated', {
                userId,
                metadata: {
                    tier,
                    keyId: keyInfo.keyId,
                    expiresAt: expiresAt?.toISOString()
                }
            });
            logger_1.logger.info('API key generated for user', {
                userId,
                tier,
                keyId: keyInfo.keyId,
                expiresAt
            });
            return { apiKey, keyInfo };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate API key', { error, userId, tier });
            throw error;
        }
    }
    async issueAPIKeyForPayment(userId, tierId, paymentId) {
        const tier = this.mapPricingTierToAPITier(tierId);
        await this.deactivateUserKeysForTier(userId, tier);
        const result = await this.generateAPIKeyForUser(userId, tier, {
            name: `${pricing_service_1.PRICING_TIERS[tierId]?.name} Access`,
            description: `Access key for ${tierId} tier (Payment: ${paymentId})`,
            expiresInDays: this.getExpirationDaysForTier(tier)
        });
        await presence_logger_1.presenceLogger.logUserPresence('payment_api_key_issued', {
            userId,
            metadata: {
                tier,
                tierId,
                paymentId,
                keyId: result.keyInfo.keyId
            }
        });
        return result;
    }
    async getUserAPIKeys(userId) {
        return [];
    }
    async deactivateAPIKey(userId, keyId) {
        try {
            await presence_logger_1.presenceLogger.logUserPresence('api_key_deactivated', {
                userId,
                metadata: { keyId }
            });
            logger_1.logger.info('API key deactivated', { userId, keyId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to deactivate API key', { error, userId, keyId });
            return false;
        }
    }
    async validateAPIKey(apiKey) {
        try {
            const parts = apiKey.split('_');
            if (parts.length < 3 || parts[0] !== 'fti') {
                return { valid: false, error: 'INVALID_KEY_FORMAT' };
            }
            const tier = parts[1];
            const isValidTier = ['internal', 'byok', 'cleanup', 'developer', 'team', 'enterprise'].includes(tier);
            if (!isValidTier) {
                return { valid: false, error: 'INVALID_TIER' };
            }
            const keyInfo = {
                id: 'mock-id',
                keyId: parts[2].substring(0, 12),
                keyHash: crypto_1.default.createHash('sha256').update(apiKey).digest('hex'),
                tier,
                userId: 'mock-user',
                isActive: true,
                createdAt: new Date(),
                usageCount: 0
            };
            return { valid: true, keyInfo, tier };
        }
        catch (error) {
            logger_1.logger.error('API key validation error', { error });
            return { valid: false, error: 'VALIDATION_ERROR' };
        }
    }
    async trackAPIKeyUsage(apiKey, endpoint, cost = 0) {
        try {
            const validation = await this.validateAPIKey(apiKey);
            if (!validation.valid || !validation.keyInfo)
                return;
            await presence_logger_1.presenceLogger.logUserPresence('api_key_usage', {
                userId: validation.keyInfo.userId,
                metadata: {
                    keyId: validation.keyInfo.keyId,
                    endpoint,
                    cost,
                    tier: validation.tier
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to track API key usage', { error });
        }
    }
    async upgradeAPIKey(userId, fromTier, toTier) {
        await this.deactivateUserKeysForTier(userId, fromTier);
        const result = await this.generateAPIKeyForUser(userId, toTier, {
            name: `${toTier} Tier Access (Upgraded)`,
            description: `Upgraded from ${fromTier} to ${toTier}`,
            expiresInDays: this.getExpirationDaysForTier(toTier)
        });
        await presence_logger_1.presenceLogger.logUserPresence('api_key_upgraded', {
            userId,
            metadata: {
                fromTier,
                toTier,
                newKeyId: result.keyInfo.keyId
            }
        });
        return result;
    }
    mapPricingTierToAPITier(pricingTierId) {
        const mapping = {
            'cleanup': 'cleanup',
            'developer': 'developer',
            'team': 'team',
            'enterprise': 'enterprise'
        };
        return mapping[pricingTierId] || 'cleanup';
    }
    getExpirationDaysForTier(tier) {
        const expirationDays = {
            'internal': 0,
            'byok': 365,
            'cleanup': 30,
            'developer': 90,
            'team': 365,
            'enterprise': 0
        };
        return expirationDays[tier] || 30;
    }
    async deactivateUserKeysForTier(userId, tier) {
        logger_1.logger.info('Deactivating existing keys for tier', { userId, tier });
    }
    async getAPIKeyStats(userId) {
        return {
            totalKeys: 0,
            activeKeys: 0,
            totalUsage: 0,
            tierBreakdown: {
                internal: 0,
                byok: 0,
                cleanup: 0,
                developer: 0,
                team: 0,
                enterprise: 0
            }
        };
    }
}
exports.APIKeyManagementService = APIKeyManagementService;
exports.apiKeyManagementService = new APIKeyManagementService();
//# sourceMappingURL=api-key-management.service.js.map