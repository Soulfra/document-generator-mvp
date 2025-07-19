"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAPIKey = exports.generateBYOKKey = exports.generateAPIKey = exports.createAPIKey = void 0;
exports.validateAPIKey = validateAPIKey;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
class APIKeyManager {
    internalKeys = new Set();
    keyCache = new Map();
    cacheExpiry = new Map();
    CACHE_TTL = 5 * 60 * 1000;
    constructor() {
        this.initializeInternalKeys();
    }
    initializeInternalKeys() {
        const internalKey = process.env.INTERNAL_API_KEY || this.generateInternalKey();
        this.internalKeys.add(internalKey);
        logger_1.logger.info('Initialized API key manager', {
            internalKeys: this.internalKeys.size,
            cacheEnabled: true
        });
    }
    generateInternalKey() {
        const key = `fti_internal_${crypto_1.default.randomBytes(32).toString('hex')}`;
        logger_1.logger.warn('Generated new internal API key - set INTERNAL_API_KEY environment variable', {
            key: `${key.substring(0, 20)}...`
        });
        return key;
    }
    async validateAPIKey(apiKey) {
        try {
            const cached = this.getCachedKey(apiKey);
            if (cached) {
                return this.apiKeyInfoToValidationResult(cached);
            }
            if (this.internalKeys.has(apiKey)) {
                const keyInfo = {
                    keyId: apiKey.substring(0, 20),
                    userId: 'internal',
                    tier: 'internal',
                    valid: true,
                    rateLimit: {
                        requestsPerMinute: 10000,
                        requestsPerDay: 1000000
                    },
                    costLimit: {
                        perRequest: 0,
                        perDay: 0,
                        perMonth: 0
                    },
                    features: ['all']
                };
                this.setCachedKey(apiKey, keyInfo);
                return this.apiKeyInfoToValidationResult(keyInfo);
            }
            const dbKey = await this.validateDatabaseKey(apiKey);
            if (dbKey.valid) {
                this.setCachedKey(apiKey, dbKey);
                return this.apiKeyInfoToValidationResult(dbKey);
            }
            if (apiKey.startsWith('byok_')) {
                return await this.validateBYOKKey(apiKey);
            }
            return {
                valid: false,
                error: 'INVALID_KEY'
            };
        }
        catch (error) {
            logger_1.logger.error('API key validation error', { error: error.message });
            return {
                valid: false,
                error: 'VALIDATION_ERROR'
            };
        }
    }
    async validateDatabaseKey(apiKey) {
        try {
            const keyHash = crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
            const mockKeys = {
                'fti_cleanup_demo123': {
                    keyId: 'key_demo123',
                    userId: 'user_demo',
                    tier: 'cleanup',
                    active: true
                },
                'fti_developer_abc456': {
                    keyId: 'key_abc456',
                    userId: 'user_developer',
                    tier: 'developer',
                    active: true
                },
                'fti_team_xyz789': {
                    keyId: 'key_xyz789',
                    userId: 'user_team',
                    tier: 'team',
                    active: true
                },
                'fti_enterprise_ent999': {
                    keyId: 'key_ent999',
                    userId: 'user_enterprise',
                    tier: 'enterprise',
                    active: true
                }
            };
            const keyData = mockKeys[apiKey];
            if (!keyData || !keyData.active) {
                return { valid: false, error: 'KEY_NOT_FOUND' };
            }
            return {
                valid: true,
                keyId: keyData.keyId,
                userId: keyData.userId,
                tier: keyData.tier,
                rateLimit: this.getRateLimitForTier(keyData.tier),
                costLimit: this.getCostLimitForTier(keyData.tier),
                features: this.getFeaturesForTier(keyData.tier)
            };
        }
        catch (error) {
            logger_1.logger.error('Database key validation error', { error: error.message });
            return { valid: false, error: 'DB_ERROR' };
        }
    }
    async validateBYOKKey(apiKey) {
        try {
            const parts = apiKey.split('_');
            if (parts.length < 3) {
                return { valid: false, error: 'INVALID_BYOK_FORMAT' };
            }
            const userId = parts[1];
            const encodedKeys = parts.slice(2).join('_');
            let customKeys = {};
            try {
                const decoded = Buffer.from(encodedKeys, 'base64').toString();
                customKeys = JSON.parse(decoded);
            }
            catch (error) {
                return { valid: false, error: 'INVALID_BYOK_KEYS' };
            }
            const hasValidKey = customKeys.anthropic || customKeys.openai || customKeys.azure;
            if (!hasValidKey) {
                return { valid: false, error: 'NO_VALID_PROVIDER_KEYS' };
            }
            return {
                valid: true,
                keyId: `byok_${userId}`,
                userId,
                tier: 'byok',
                customKeys,
                rateLimit: this.getRateLimitForTier('byok'),
                costLimit: this.getCostLimitForTier('byok'),
                features: this.getFeaturesForTier('byok')
            };
        }
        catch (error) {
            logger_1.logger.error('BYOK key validation error', { error: error.message });
            return { valid: false, error: 'BYOK_VALIDATION_ERROR' };
        }
    }
    getRateLimitForTier(tier) {
        const limits = {
            'internal': { requestsPerMinute: 10000, requestsPerDay: 1000000 },
            'byok': { requestsPerMinute: 500, requestsPerDay: 50000 },
            'cleanup': { requestsPerMinute: 10, requestsPerDay: 100 },
            'developer': { requestsPerMinute: 100, requestsPerDay: 500 },
            'team': { requestsPerMinute: 500, requestsPerDay: 5000 },
            'enterprise': { requestsPerMinute: 2000, requestsPerDay: 500000 }
        };
        return limits[tier] || limits.cleanup;
    }
    getCostLimitForTier(tier) {
        const limits = {
            'internal': { perRequest: 0, perDay: 0, perMonth: 0 },
            'byok': { perRequest: 0, perDay: 0, perMonth: 0 },
            'cleanup': { perRequest: 0, perDay: 0, perMonth: 0 },
            'developer': { perRequest: 0.10, perDay: 5.00, perMonth: 50.00 },
            'team': { perRequest: 0.50, perDay: 25.00, perMonth: 250.00 },
            'enterprise': { perRequest: 5.00, perDay: 500.00, perMonth: 5000.00 }
        };
        return limits[tier] || limits.cleanup;
    }
    getFeaturesForTier(tier) {
        const features = {
            'internal': ['all'],
            'byok': ['analyze', 'cleanup', 'structure', 'generate', 'custom_models'],
            'cleanup': ['analyze', 'cleanup'],
            'developer': ['analyze', 'cleanup', 'structure', 'agents'],
            'team': ['analyze', 'cleanup', 'structure', 'generate', 'agents', 'collaborations'],
            'enterprise': ['analyze', 'cleanup', 'structure', 'generate', 'agents', 'collaborations', 'custom_models', 'priority_support']
        };
        return features[tier] || features.cleanup;
    }
    getCachedKey(apiKey) {
        const cached = this.keyCache.get(apiKey);
        const expiry = this.cacheExpiry.get(apiKey);
        if (cached && expiry && Date.now() < expiry) {
            return cached;
        }
        this.keyCache.delete(apiKey);
        this.cacheExpiry.delete(apiKey);
        return null;
    }
    setCachedKey(apiKey, keyInfo) {
        this.keyCache.set(apiKey, keyInfo);
        this.cacheExpiry.set(apiKey, Date.now() + this.CACHE_TTL);
    }
    apiKeyInfoToValidationResult(keyInfo) {
        return {
            valid: keyInfo.valid,
            keyId: keyInfo.keyId,
            userId: keyInfo.userId,
            tier: keyInfo.tier,
            customKeys: keyInfo.customKeys,
            rateLimit: keyInfo.rateLimit,
            costLimit: keyInfo.costLimit,
            features: keyInfo.features
        };
    }
    generateAPIKey(tier, userId) {
        const prefix = `fti_${tier}`;
        const randomPart = crypto_1.default.randomBytes(16).toString('hex');
        return `${prefix}_${randomPart}`;
    }
    generateBYOKKey(userId, customKeys) {
        const encodedKeys = Buffer.from(JSON.stringify(customKeys)).toString('base64');
        return `byok_${userId}_${encodedKeys}`;
    }
    async createAPIKey(params) {
        const { userId, tier, customKeys } = params;
        if (tier === 'byok' && customKeys) {
            return this.generateBYOKKey(userId, customKeys);
        }
        const apiKey = this.generateAPIKey(tier, userId);
        logger_1.logger.info('Created new API key', {
            keyId: apiKey.substring(0, 20),
            userId,
            tier
        });
        return apiKey;
    }
    async revokeAPIKey(apiKey) {
        this.keyCache.delete(apiKey);
        this.cacheExpiry.delete(apiKey);
        logger_1.logger.info('Revoked API key', {
            keyId: apiKey.substring(0, 20)
        });
        return true;
    }
    cleanupCache() {
        const now = Date.now();
        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (now >= expiry) {
                this.keyCache.delete(key);
                this.cacheExpiry.delete(key);
            }
        }
    }
}
const apiKeyManager = new APIKeyManager();
setInterval(() => {
    apiKeyManager.cleanupCache();
}, 5 * 60 * 1000);
async function validateAPIKey(apiKey) {
    return apiKeyManager.validateAPIKey(apiKey);
}
exports.createAPIKey = apiKeyManager.createAPIKey, exports.generateAPIKey = apiKeyManager.generateAPIKey, exports.generateBYOKKey = apiKeyManager.generateBYOKKey, exports.revokeAPIKey = apiKeyManager.revokeAPIKey;
//# sourceMappingURL=auth.js.map