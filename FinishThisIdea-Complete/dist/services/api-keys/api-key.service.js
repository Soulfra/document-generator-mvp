"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyService = exports.ApiKeyService = void 0;
const client_1 = require("@prisma/client");
const crypto_service_1 = require("../crypto/crypto.service");
const secrets_manager_service_1 = require("../secrets/secrets-manager.service");
const logger_1 = require("../../utils/logger");
const errors_1 = require("../../utils/errors");
const redis_1 = require("../../config/redis");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
class ApiKeyService {
    static instance;
    prisma;
    keyPrefix = 'sk';
    testKeyPrefix = 'sk-test';
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.setupRotationCallbacks();
    }
    static getInstance() {
        if (!ApiKeyService.instance) {
            ApiKeyService.instance = new ApiKeyService();
        }
        return ApiKeyService.instance;
    }
    async createApiKey(userId, options) {
        const start = Date.now();
        try {
            const isTestKey = process.env.NODE_ENV !== 'production';
            const prefix = isTestKey ? this.testKeyPrefix : this.keyPrefix;
            const plainKey = crypto_service_1.cryptoService.generateApiKey(prefix);
            const hashedKey = await crypto_service_1.cryptoService.hashWithSalt(plainKey);
            const apiKeyData = {
                id: crypto_service_1.cryptoService.generateSecureToken(16),
                userId,
                name: options.name,
                hashedKey,
                prefix,
                scopes: options.scopes || ['read'],
                metadata: options.metadata,
                rateLimit: options.rateLimit
            };
            if (options.expiresIn) {
                apiKeyData.expiresAt = new Date(Date.now() + options.expiresIn * 1000);
            }
            const apiKey = await this.prisma.apiKey.create({
                data: {
                    id: apiKeyData.id,
                    userId,
                    name: apiKeyData.name,
                    hashedKey: apiKeyData.hashedKey,
                    prefix: apiKeyData.prefix,
                    scopes: apiKeyData.scopes,
                    metadata: apiKeyData.metadata,
                    expiresAt: apiKeyData.expiresAt,
                    lastUsedAt: null
                }
            });
            await this.cacheKeyMetadata(plainKey, apiKeyData);
            await secrets_manager_service_1.secretsManager.setSecret(`apikey:${apiKey.id}`, plainKey, {
                metadata: {
                    userId,
                    name: options.name,
                    rotationInterval: 7776000
                },
                tags: ['api-key', `user:${userId}`]
            });
            logger_1.logger.info('API key created', {
                userId,
                keyId: apiKey.id,
                name: options.name,
                scopes: options.scopes
            });
            prometheus_metrics_service_1.prometheusMetrics.apiKeysCreated.inc({ prefix });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'api_key_create' }, Date.now() - start);
            return {
                apiKey: {
                    ...apiKeyData,
                    key: this.maskApiKey(plainKey)
                },
                plainKey
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create API key', { userId, error });
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'api_key_create_error' });
            throw error;
        }
    }
    async validateApiKey(plainKey) {
        const start = Date.now();
        try {
            if (!crypto_service_1.cryptoService.validateApiKeyFormat(plainKey)) {
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'invalid_format' });
                return { valid: false, reason: 'Invalid API key format' };
            }
            const cached = await this.getCachedKeyMetadata(plainKey);
            if (cached) {
                prometheus_metrics_service_1.prometheusMetrics.cacheHits.inc({ cache: 'api_keys' });
                const validation = await this.validateCachedKey(cached, plainKey);
                if (validation.valid) {
                    this.updateLastUsed(cached.id);
                    prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'success' });
                    return validation;
                }
            }
            prometheus_metrics_service_1.prometheusMetrics.cacheMisses.inc({ cache: 'api_keys' });
            const apiKeys = await this.prisma.apiKey.findMany({
                where: {
                    prefix: plainKey.split('_')[0]
                },
                include: {
                    user: true
                }
            });
            for (const apiKey of apiKeys) {
                const isValid = await crypto_service_1.cryptoService.verifyHash(plainKey, apiKey.hashedKey);
                if (isValid) {
                    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
                        prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'expired' });
                        return { valid: false, reason: 'API key expired' };
                    }
                    if (!apiKey.user.isActive) {
                        prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'user_inactive' });
                        return { valid: false, reason: 'User account is inactive' };
                    }
                    const apiKeyData = {
                        id: apiKey.id,
                        userId: apiKey.userId,
                        name: apiKey.name,
                        key: this.maskApiKey(plainKey),
                        hashedKey: apiKey.hashedKey,
                        prefix: apiKey.prefix,
                        lastUsedAt: apiKey.lastUsedAt || undefined,
                        expiresAt: apiKey.expiresAt || undefined,
                        scopes: apiKey.scopes,
                        metadata: apiKey.metadata,
                        rateLimit: apiKey.metadata?.rateLimit
                    };
                    await this.cacheKeyMetadata(plainKey, apiKeyData);
                    this.updateLastUsed(apiKey.id);
                    prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'success' });
                    prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'api_key_validate' }, Date.now() - start);
                    return {
                        valid: true,
                        apiKey: apiKeyData,
                        user: apiKey.user
                    };
                }
            }
            prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'invalid_key' });
            return { valid: false, reason: 'Invalid API key' };
        }
        catch (error) {
            logger_1.logger.error('Failed to validate API key', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'api_key_validate_error' });
            return { valid: false, reason: 'Validation error' };
        }
    }
    async rotateApiKey(userId, apiKeyId) {
        const start = Date.now();
        try {
            const existing = await this.prisma.apiKey.findFirst({
                where: { id: apiKeyId, userId }
            });
            if (!existing) {
                throw new errors_1.AppError('API key not found', 404);
            }
            const result = await this.createApiKey(userId, {
                name: `${existing.name} (rotated)`,
                scopes: existing.scopes,
                metadata: {
                    ...existing.metadata,
                    rotatedFrom: existing.id,
                    rotatedAt: new Date()
                },
                rateLimit: existing.metadata?.rateLimit
            });
            await this.prisma.apiKey.update({
                where: { id: apiKeyId },
                data: {
                    metadata: {
                        ...existing.metadata,
                        rotatedTo: result.apiKey.id,
                        rotatedAt: new Date()
                    },
                    expiresAt: new Date(Date.now() + 86400000)
                }
            });
            logger_1.logger.info('API key rotated', {
                userId,
                oldKeyId: apiKeyId,
                newKeyId: result.apiKey.id
            });
            prometheus_metrics_service_1.prometheusMetrics.apiKeysRotated.inc();
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'api_key_rotate' }, Date.now() - start);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to rotate API key', { userId, apiKeyId, error });
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'api_key_rotate_error' });
            throw error;
        }
    }
    async revokeApiKey(userId, apiKeyId) {
        try {
            const apiKey = await this.prisma.apiKey.findFirst({
                where: { id: apiKeyId, userId }
            });
            if (!apiKey) {
                throw new errors_1.AppError('API key not found', 404);
            }
            await this.prisma.apiKey.delete({
                where: { id: apiKeyId }
            });
            await this.invalidateKeyCache(apiKey.prefix);
            await secrets_manager_service_1.secretsManager.deleteSecret(`apikey:${apiKeyId}`);
            logger_1.logger.info('API key revoked', { userId, apiKeyId });
            prometheus_metrics_service_1.prometheusMetrics.apiKeysRevoked.inc();
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke API key', { userId, apiKeyId, error });
            throw error;
        }
    }
    async listApiKeys(userId, options = {}) {
        try {
            const where = { userId };
            if (!options.includeExpired) {
                where.OR = [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ];
            }
            const apiKeys = await this.prisma.apiKey.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });
            return apiKeys.map(key => ({
                id: key.id,
                userId: key.userId,
                name: key.name,
                key: this.maskApiKey(`${key.prefix}_hidden`),
                hashedKey: key.hashedKey,
                prefix: key.prefix,
                lastUsedAt: key.lastUsedAt || undefined,
                expiresAt: key.expiresAt || undefined,
                scopes: key.scopes,
                metadata: key.metadata
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to list API keys', { userId, error });
            throw error;
        }
    }
    async checkRateLimit(apiKeyId, rateLimit) {
        if (!rateLimit) {
            return { allowed: true, remaining: -1, resetAt: new Date() };
        }
        const key = `ratelimit:apikey:${apiKeyId}`;
        const window = rateLimit.window || 3600;
        const limit = rateLimit.requests || 1000;
        const current = await redis_1.redis.incr(key);
        if (current === 1) {
            await redis_1.redis.expire(key, window);
        }
        const ttl = await redis_1.redis.ttl(key);
        const resetAt = new Date(Date.now() + ttl * 1000);
        return {
            allowed: current <= limit,
            remaining: Math.max(0, limit - current),
            resetAt
        };
    }
    async updateScopes(userId, apiKeyId, scopes) {
        try {
            const apiKey = await this.prisma.apiKey.update({
                where: { id: apiKeyId, userId },
                data: { scopes }
            });
            await this.invalidateKeyCache(apiKey.prefix);
            logger_1.logger.info('API key scopes updated', { userId, apiKeyId, scopes });
            return {
                id: apiKey.id,
                userId: apiKey.userId,
                name: apiKey.name,
                key: this.maskApiKey(`${apiKey.prefix}_hidden`),
                hashedKey: apiKey.hashedKey,
                prefix: apiKey.prefix,
                lastUsedAt: apiKey.lastUsedAt || undefined,
                expiresAt: apiKey.expiresAt || undefined,
                scopes: apiKey.scopes,
                metadata: apiKey.metadata
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update API key scopes', { userId, apiKeyId, error });
            throw error;
        }
    }
    async cacheKeyMetadata(plainKey, metadata) {
        const cacheKey = `apikey:meta:${crypto_service_1.cryptoService.hash(plainKey)}`;
        await redis_1.redis.setex(cacheKey, 3600, JSON.stringify(metadata));
    }
    async getCachedKeyMetadata(plainKey) {
        const cacheKey = `apikey:meta:${crypto_service_1.cryptoService.hash(plainKey)}`;
        const cached = await redis_1.redis.get(cacheKey);
        return cached ? JSON.parse(cached) : null;
    }
    async invalidateKeyCache(prefix) {
        logger_1.logger.info('Cache invalidation requested for prefix', { prefix });
    }
    async validateCachedKey(cached, plainKey) {
        const isValid = await crypto_service_1.cryptoService.verifyHash(plainKey, cached.hashedKey);
        if (!isValid) {
            return { valid: false, reason: 'Cache validation failed' };
        }
        if (cached.expiresAt && new Date() > new Date(cached.expiresAt)) {
            return { valid: false, reason: 'API key expired' };
        }
        const user = await this.prisma.user.findUnique({
            where: { id: cached.userId }
        });
        if (!user || !user.isActive) {
            return { valid: false, reason: 'User inactive' };
        }
        return {
            valid: true,
            apiKey: cached,
            user
        };
    }
    async updateLastUsed(apiKeyId) {
        setImmediate(async () => {
            try {
                await this.prisma.apiKey.update({
                    where: { id: apiKeyId },
                    data: { lastUsedAt: new Date() }
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to update last used', { apiKeyId, error });
            }
        });
    }
    maskApiKey(key) {
        const parts = key.split('_');
        if (parts.length < 2)
            return '********';
        const prefix = parts[0];
        const visibleChars = 4;
        const lastPart = parts[parts.length - 1];
        const suffix = lastPart.substring(Math.max(0, lastPart.length - visibleChars));
        return `${prefix}_****${suffix}`;
    }
    setupRotationCallbacks() {
        secrets_manager_service_1.secretsManager.on('secret:rotation-needed', async ({ name }) => {
            if (name.startsWith('apikey:')) {
                const apiKeyId = name.replace('apikey:', '');
                try {
                    const apiKey = await this.prisma.apiKey.findUnique({
                        where: { id: apiKeyId }
                    });
                    if (apiKey && !apiKey.metadata?.noAutoRotate) {
                        await this.rotateApiKey(apiKey.userId, apiKey.id);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Auto-rotation failed', { apiKeyId, error });
                }
            }
        });
    }
    generateApiKeyDocs(apiKey) {
        return `
# API Key: ${apiKey.name}

## Details
- Key ID: ${apiKey.id}
- Created: ${apiKey.metadata?.createdAt || 'Unknown'}
- Expires: ${apiKey.expiresAt || 'Never'}
- Last Used: ${apiKey.lastUsedAt || 'Never'}

## Scopes
${apiKey.scopes.map(scope => `- ${scope}`).join('\n')}

## Rate Limits
${apiKey.rateLimit ? `- ${apiKey.rateLimit.requests} requests per ${apiKey.rateLimit.window} seconds` : '- No rate limits'}

## Usage Example

\`\`\`bash
curl -H "X-API-Key: YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.finishthisidea.com/v1/endpoint
\`\`\`

## Security Notes
- Keep your API key secret
- Rotate regularly (recommended: every 90 days)
- Use HTTPS for all API requests
- Set appropriate scopes for least privilege
`;
    }
}
exports.ApiKeyService = ApiKeyService;
exports.apiKeyService = ApiKeyService.getInstance();
//# sourceMappingURL=api-key.service.js.map