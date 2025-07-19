"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeToken = exports.generateApiKey = exports.tokenBasedRateLimit = exports.requireTokens = exports.optionalAuth = exports.authenticate = exports.verifyToken = exports.generateToken = void 0;
exports.authentication = authentication;
exports.apiKeyAuth = apiKeyAuth;
exports.generateTokenLegacy = generateTokenLegacy;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const ioredis_1 = __importDefault(require("ioredis"));
const api_key_service_1 = require("../services/api-keys/api-key.service");
const security_config_1 = require("../config/security.config");
const prometheus_metrics_service_1 = require("../services/monitoring/prometheus-metrics.service");
const prisma = new client_1.PrismaClient();
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
const JWT_SECRET = security_config_1.security.secrets.jwtSecret;
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY || '24h'
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
const authenticate = async (req, res, next) => {
    try {
        let token = null;
        let authType = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            authType = 'bearer';
        }
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
            token = apiKey;
            authType = 'api-key';
        }
        if (req.cookies && req.cookies.finishthisidea_session) {
            token = req.cookies.finishthisidea_session;
            authType = 'session';
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        let user = null;
        if (authType === 'bearer' || authType === 'session') {
            const decoded = (0, exports.verifyToken)(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
            }
            const isBlacklisted = await redis.exists(`blacklist:${token}`);
            if (isBlacklisted) {
                return res.status(401).json({
                    success: false,
                    error: 'Token has been revoked'
                });
            }
            const cachedUser = await redis.get(`user:${decoded.id}`);
            if (cachedUser) {
                user = JSON.parse(cachedUser);
            }
            else {
                const dbUser = await prisma.user.findUnique({
                    where: { id: decoded.id }
                });
                if (dbUser) {
                    user = {
                        id: dbUser.id,
                        email: dbUser.email || undefined,
                        displayName: dbUser.displayName || undefined,
                        platformTokens: dbUser.platformTokens,
                        totalEarnings: dbUser.totalEarnings,
                        referralCode: dbUser.referralCode || undefined,
                        metadata: dbUser.metadata,
                        userNumber: dbUser.userNumber || undefined,
                        lastActiveAt: dbUser.lastActiveAt || undefined
                    };
                    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(user));
                }
            }
        }
        else if (authType === 'api-key') {
            const apiKeyValidation = await api_key_service_1.apiKeyService.validateApiKey(token);
            if (!apiKeyValidation.valid) {
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'invalid_api_key' });
                return res.status(401).json({
                    success: false,
                    error: apiKeyValidation.reason || 'Invalid API key'
                });
            }
            const rateLimit = await api_key_service_1.apiKeyService.checkRateLimit(apiKeyValidation.apiKey.id, apiKeyValidation.apiKey.rateLimit);
            if (!rateLimit.allowed) {
                prometheus_metrics_service_1.prometheusMetrics.rateLimitHits.inc({ key: apiKeyValidation.apiKey.id });
                res.setHeader('X-RateLimit-Limit', apiKeyValidation.apiKey.rateLimit.requests.toString());
                res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
                res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded'
                });
            }
            user = {
                id: apiKeyValidation.user.id,
                email: apiKeyValidation.user.email || undefined,
                displayName: apiKeyValidation.user.displayName || undefined,
                platformTokens: apiKeyValidation.user.platformTokens,
                totalEarnings: apiKeyValidation.user.totalEarnings,
                referralCode: apiKeyValidation.user.referralCode || undefined,
                metadata: apiKeyValidation.user.metadata,
                userNumber: apiKeyValidation.user.userNumber || undefined,
                lastActiveAt: apiKeyValidation.user.lastActiveAt || undefined
            };
            req.apiKey = apiKeyValidation.apiKey;
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid authentication credentials'
            });
        }
        req.user = user;
        req.authType = authType;
        if (user.id !== 'system') {
            await redis.setex(`activity:${user.id}`, 300, Date.now().toString());
            prisma.user.update({
                where: { id: user.id },
                data: { lastActiveAt: new Date() }
            }).catch(err => logger_1.logger.error('Failed to update last active:', err));
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const apiKey = req.headers['x-api-key'];
        const sessionCookie = req.cookies?.finishthisidea_session;
        if (authHeader || apiKey || sessionCookie) {
            return (0, exports.authenticate)(req, res, next);
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireTokens = (requiredTokens) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        if (req.user.platformTokens < requiredTokens) {
            return res.status(402).json({
                success: false,
                error: 'Insufficient platform tokens',
                required: requiredTokens,
                available: req.user.platformTokens
            });
        }
        next();
    };
};
exports.requireTokens = requireTokens;
const tokenBasedRateLimit = async (req, res, next) => {
    if (!req.user) {
        return next();
    }
    const limits = {
        free: { window: 60, max: 10 },
        bronze: { window: 60, max: 30 },
        silver: { window: 60, max: 60 },
        gold: { window: 60, max: 120 },
        platinum: { window: 60, max: 300 }
    };
    let tierLimit;
    if (req.user.platformTokens >= 20000) {
        tierLimit = limits.platinum;
    }
    else if (req.user.platformTokens >= 5000) {
        tierLimit = limits.gold;
    }
    else if (req.user.platformTokens >= 1000) {
        tierLimit = limits.silver;
    }
    else if (req.user.platformTokens >= 100) {
        tierLimit = limits.bronze;
    }
    else {
        tierLimit = limits.free;
    }
    const key = `rate:${req.user.id}:${Math.floor(Date.now() / (tierLimit.window * 1000))}`;
    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, tierLimit.window);
    }
    if (count > tierLimit.max) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            retry_after: tierLimit.window,
            current_tokens: req.user.platformTokens
        });
    }
    res.setHeader('X-RateLimit-Limit', tierLimit.max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, tierLimit.max - count).toString());
    res.setHeader('X-RateLimit-Reset', new Date((Math.floor(Date.now() / (tierLimit.window * 1000)) + 1) * tierLimit.window * 1000).toISOString());
    next();
};
exports.tokenBasedRateLimit = tokenBasedRateLimit;
const generateApiKey = async (userId, name, options) => {
    const result = await api_key_service_1.apiKeyService.createApiKey(userId, {
        name,
        scopes: options?.scopes || ['read', 'write'],
        expiresIn: options?.expiresIn,
        metadata: options?.metadata,
        rateLimit: options?.rateLimit
    });
    return {
        key: result.plainKey,
        masked: result.apiKey.key
    };
};
exports.generateApiKey = generateApiKey;
const revokeToken = async (token) => {
    await redis.setex(`blacklist:${token}`, 86400 * 7, '1');
};
exports.revokeToken = revokeToken;
function authentication(options = {}) {
    return async (req, res, next) => {
        await (0, exports.authenticate)(req, res, () => { });
        if (!req.user && !options.optional) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        if (options.platformTokens && req.user && req.user.platformTokens < options.platformTokens) {
            return res.status(402).json({
                success: false,
                error: 'Insufficient platform tokens',
                required: options.platformTokens,
                available: req.user.platformTokens
            });
        }
        next();
    };
}
async function apiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key required'
        });
    }
    req.headers['x-api-key'] = apiKey;
    return (0, exports.authenticate)(req, res, next);
}
function generateTokenLegacy(userId, role) {
    return jsonwebtoken_1.default.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}
//# sourceMappingURL=auth.middleware.js.map