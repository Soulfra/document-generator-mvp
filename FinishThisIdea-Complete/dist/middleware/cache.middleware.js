"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicCache = exports.userSpecificCache = exports.longCache = exports.mediumCache = exports.shortCache = void 0;
exports.cacheMiddleware = cacheMiddleware;
exports.invalidateUserCache = invalidateUserCache;
exports.invalidateRouteCache = invalidateRouteCache;
exports.invalidateTaggedCache = invalidateTaggedCache;
exports.conditionalCache = conditionalCache;
exports.smartCache = smartCache;
const cache_service_1 = require("../services/cache/cache.service");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
const DEFAULT_OPTIONS = {
    ttl: 300,
    keyGenerator: (req) => `${req.method}:${req.originalUrl}`,
    condition: (req, res) => req.method === 'GET' && res.statusCode === 200,
    skipHeaders: ['set-cookie', 'authorization'],
    varyBy: ['accept', 'accept-encoding', 'user-agent'],
    tags: [],
    compress: true
};
function cacheMiddleware(options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    return async (req, res, next) => {
        if (!config.condition(req, res)) {
            return next();
        }
        const cacheKey = generateCacheKey(req, config);
        try {
            const cached = await cache_service_1.apiCache.get(cacheKey);
            if (cached) {
                if (cached.etag && req.headers['if-none-match'] === cached.etag) {
                    res.status(304).end();
                    return;
                }
                res.status(cached.statusCode);
                Object.entries(cached.headers).forEach(([key, value]) => {
                    if (!config.skipHeaders.includes(key.toLowerCase())) {
                        res.set(key, value);
                    }
                });
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Date', new Date(cached.timestamp).toISOString());
                if (cached.etag) {
                    res.set('ETag', cached.etag);
                }
                logger_1.logger.debug('Cache hit', { key: cacheKey, method: req.method, url: req.originalUrl });
                return res.json(cached.body);
            }
            const originalSend = res.json;
            const originalStatus = res.status;
            let statusCode = 200;
            res.status = function (code) {
                statusCode = code;
                return originalStatus.call(this, code);
            };
            res.json = function (body) {
                if (config.condition(req, res) && statusCode >= 200 && statusCode < 300) {
                    cacheResponse(req, res, body, statusCode, cacheKey, config);
                }
                res.set('X-Cache', 'MISS');
                logger_1.logger.debug('Cache miss', { key: cacheKey, method: req.method, url: req.originalUrl });
                return originalSend.call(this, body);
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Cache middleware error', { error, cacheKey });
            next();
        }
    };
}
function generateCacheKey(req, config) {
    let key = config.keyGenerator(req);
    const varyValues = config.varyBy
        .map(header => req.headers[header] || '')
        .join('|');
    if (varyValues) {
        key += `|vary:${crypto_1.default.createHash('md5').update(varyValues).digest('hex')}`;
    }
    const queryKeys = Object.keys(req.query).sort();
    if (queryKeys.length > 0) {
        const queryString = queryKeys
            .map(key => `${key}=${req.query[key]}`)
            .join('&');
        key += `|query:${crypto_1.default.createHash('md5').update(queryString).digest('hex')}`;
    }
    if (req.user?.id) {
        key += `|user:${req.user.id}`;
    }
    return key;
}
async function cacheResponse(req, res, body, statusCode, cacheKey, config) {
    try {
        const etag = `"${crypto_1.default.createHash('md5').update(JSON.stringify(body)).digest('hex')}"`;
        const headers = {};
        Object.entries(res.getHeaders()).forEach(([key, value]) => {
            if (!config.skipHeaders.includes(key.toLowerCase()) && value !== undefined) {
                headers[key] = value;
            }
        });
        const cachedResponse = {
            statusCode,
            headers,
            body,
            timestamp: Date.now(),
            etag
        };
        const tags = typeof config.tags === 'function' ? config.tags(req) : config.tags;
        await cache_service_1.apiCache.set(cacheKey, cachedResponse, {
            ttl: config.ttl,
            tags,
            compress: config.compress
        });
        res.set('ETag', etag);
        logger_1.logger.debug('Response cached', {
            key: cacheKey,
            ttl: config.ttl,
            size: JSON.stringify(body).length,
            tags
        });
    }
    catch (error) {
        logger_1.logger.error('Cache response error', { error, cacheKey });
    }
}
exports.shortCache = cacheMiddleware({
    ttl: 60,
    tags: ['short-lived']
});
exports.mediumCache = cacheMiddleware({
    ttl: 300,
    tags: ['medium-lived']
});
exports.longCache = cacheMiddleware({
    ttl: 3600,
    tags: ['long-lived']
});
exports.userSpecificCache = cacheMiddleware({
    ttl: 300,
    keyGenerator: (req) => `user:${req.user?.id}:${req.method}:${req.originalUrl}`,
    condition: (req) => !!req.user?.id,
    tags: (req) => [`user:${req.user?.id}`]
});
exports.publicCache = cacheMiddleware({
    ttl: 600,
    condition: (req) => !req.user?.id,
    tags: ['public']
});
async function invalidateUserCache(userId) {
    try {
        await cache_service_1.apiCache.invalidateByTag(`user:${userId}`);
        logger_1.logger.info('User cache invalidated', { userId });
    }
    catch (error) {
        logger_1.logger.error('Failed to invalidate user cache', { userId, error });
    }
}
async function invalidateRouteCache(route) {
    try {
        await cache_service_1.apiCache.invalidateByPattern(`*${route}*`);
        logger_1.logger.info('Route cache invalidated', { route });
    }
    catch (error) {
        logger_1.logger.error('Failed to invalidate route cache', { route, error });
    }
}
async function invalidateTaggedCache(tag) {
    try {
        await cache_service_1.apiCache.invalidateByTag(tag);
        logger_1.logger.info('Tagged cache invalidated', { tag });
    }
    catch (error) {
        logger_1.logger.error('Failed to invalidate tagged cache', { tag, error });
    }
}
function conditionalCache(options) {
    const maxRequestSize = options.maxRequestSize || 1024;
    const minResponseSize = options.minResponseSize || 100;
    return cacheMiddleware({
        ...options,
        condition: (req, res) => {
            const requestSize = JSON.stringify(req.body || {}).length;
            if (requestSize > maxRequestSize) {
                return false;
            }
            const originalCondition = options.condition || DEFAULT_OPTIONS.condition;
            return originalCondition(req, res);
        }
    });
}
function smartCache(baseOptions = {}) {
    return cacheMiddleware({
        ...baseOptions,
        ttl: baseOptions.ttl || 300,
        keyGenerator: (req) => {
            let ttl = baseOptions.ttl || 300;
            if (req.path.includes('/stats') || req.path.includes('/metrics')) {
                ttl = 60;
            }
            else if (req.path.includes('/profile') || req.path.includes('/settings')) {
                ttl = 900;
            }
            else if (req.path.includes('/public') || req.path.includes('/static')) {
                ttl = 3600;
            }
            return `${req.method}:${req.originalUrl}:ttl${ttl}`;
        }
    });
}
//# sourceMappingURL=cache.middleware.js.map