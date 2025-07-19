"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ddosProtection = exports.ipSecurityMiddleware = exports.apiRateLimiter = exports.authRateLimiter = exports.uploadRateLimiter = exports.strictRateLimiter = exports.rateLimiter = void 0;
exports.createAdvancedRateLimiter = createAdvancedRateLimiter;
exports.createIPSecurityMiddleware = createIPSecurityMiddleware;
exports.createRateLimiter = createRateLimiter;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = __importDefault(require("crypto"));
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
function getRealIP(req, trustProxy = true) {
    if (trustProxy) {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        const realIP = req.headers['x-real-ip'];
        if (realIP) {
            return realIP;
        }
        const cfConnectingIP = req.headers['cf-connecting-ip'];
        if (cfConnectingIP) {
            return cfConnectingIP;
        }
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}
function generateFingerprint(req) {
    const components = [
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.headers['accept-encoding'] || '',
        getRealIP(req)
    ];
    return crypto_1.default
        .createHash('sha256')
        .update(components.join('|'))
        .digest('hex')
        .substring(0, 16);
}
function createAdvancedRateLimiter(options) {
    const { windowMs, maxRequests, keyPrefix = 'ratelimit', skipFailedRequests = false, skipSuccessfulRequests = false, slidingWindow = true, trustProxy = true, whitelist = [], blacklist = [], blockDuration = 0, skipRateLimitedPaths = [] } = options;
    return async (req, res, next) => {
        try {
            if (skipRateLimitedPaths.some(path => req.path.startsWith(path))) {
                return next();
            }
            const ip = getRealIP(req, trustProxy);
            const fingerprint = generateFingerprint(req);
            if (blacklist.includes(ip)) {
                logger_1.logger.warn(`Blacklisted IP attempted access: ${ip}`, {
                    ip,
                    path: req.path,
                    userAgent: req.headers['user-agent']
                });
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
            }
            if (whitelist.length > 0 && !whitelist.includes(ip)) {
                if (whitelist.includes(ip)) {
                    return next();
                }
            }
            const blockKey = `block:${keyPrefix}:${ip}`;
            const isBlocked = await redis.exists(blockKey);
            if (isBlocked) {
                const ttl = await redis.ttl(blockKey);
                return res.status(429).json({
                    success: false,
                    error: 'IP temporarily blocked due to rate limit violations',
                    unblockTime: new Date(Date.now() + (ttl * 1000)).toISOString()
                });
            }
            let key;
            let current;
            let ttl;
            if (slidingWindow) {
                const now = Date.now();
                const windowStart = now - windowMs;
                key = `${keyPrefix}:sliding:${ip}`;
                await redis.zremrangebyscore(key, 0, windowStart);
                await redis.zadd(key, now, `${now}-${fingerprint}`);
                current = await redis.zcard(key);
                await redis.expire(key, Math.ceil(windowMs / 1000));
                ttl = windowMs;
            }
            else {
                const windowId = Math.floor(Date.now() / windowMs);
                key = `${keyPrefix}:${ip}:${windowId}`;
                current = await redis.incr(key);
                if (current === 1) {
                    await redis.expire(key, Math.ceil(windowMs / 1000));
                }
                ttl = await redis.pttl(key);
            }
            res.setHeader('X-RateLimit-Limit', maxRequests.toString());
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());
            res.setHeader('X-RateLimit-Reset', new Date(Date.now() + ttl).toISOString());
            res.setHeader('X-RateLimit-Window', (windowMs / 1000).toString());
            if (current > maxRequests) {
                logger_1.logger.warn(`Rate limit exceeded for IP: ${ip}`, {
                    ip,
                    fingerprint,
                    path: req.path,
                    method: req.method,
                    userAgent: req.headers['user-agent'],
                    current,
                    limit: maxRequests
                });
                if (blockDuration > 0) {
                    await redis.setex(blockKey, Math.ceil(blockDuration / 1000), '1');
                    logger_1.logger.warn(`IP blocked for ${blockDuration}ms: ${ip}`);
                }
                throw new errors_1.RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(ttl / 1000)} seconds`);
            }
            if (skipFailedRequests || skipSuccessfulRequests) {
                const originalSend = res.send;
                res.send = function (data) {
                    const shouldSkip = (skipFailedRequests && res.statusCode >= 400) ||
                        (skipSuccessfulRequests && res.statusCode < 400);
                    if (shouldSkip) {
                        if (slidingWindow) {
                            redis.zrem(key, `${Date.now()}-${fingerprint}`);
                        }
                        else {
                            redis.decr(key);
                        }
                    }
                    return originalSend.call(this, data);
                };
            }
            next();
        }
        catch (error) {
            if (error instanceof errors_1.RateLimitError) {
                next(error);
            }
            else {
                logger_1.logger.error('Rate limiter error:', error);
                next();
            }
        }
    };
}
function createIPSecurityMiddleware(options) {
    const { maxFailedAttempts, blockDuration, keyPrefix, monitorEndpoints = [] } = options;
    return async (req, res, next) => {
        const ip = getRealIP(req);
        const failureKey = `${keyPrefix}:failures:${ip}`;
        const shouldMonitor = monitorEndpoints.length === 0 ||
            monitorEndpoints.some(endpoint => req.path.startsWith(endpoint));
        if (!shouldMonitor) {
            return next();
        }
        const failures = await redis.get(failureKey);
        const failureCount = parseInt(failures || '0', 10);
        if (failureCount >= maxFailedAttempts) {
            logger_1.logger.warn(`IP blocked due to security violations: ${ip}`, {
                ip,
                failures: failureCount,
                path: req.path
            });
            return res.status(403).json({
                success: false,
                error: 'Access denied due to security policy'
            });
        }
        const originalSend = res.send;
        res.send = function (data) {
            if ([401, 403, 429].includes(res.statusCode)) {
                redis.incr(failureKey);
                redis.expire(failureKey, Math.ceil(blockDuration / 1000));
                logger_1.logger.info(`Security failure recorded for IP: ${ip}`, {
                    ip,
                    statusCode: res.statusCode,
                    path: req.path,
                    failures: failureCount + 1
                });
            }
            else if (res.statusCode < 400) {
                redis.del(failureKey);
            }
            return originalSend.call(this, data);
        };
        next();
    };
}
function createRateLimiter(options) {
    return createAdvancedRateLimiter(options);
}
exports.rateLimiter = createAdvancedRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60,
    slidingWindow: true,
    blockDuration: 5 * 60 * 1000,
});
exports.strictRateLimiter = createAdvancedRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'ratelimit:strict',
    slidingWindow: true,
    blockDuration: 15 * 60 * 1000,
});
exports.uploadRateLimiter = createAdvancedRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'ratelimit:upload',
    skipFailedRequests: true,
    slidingWindow: true,
    blockDuration: 60 * 60 * 1000,
});
exports.authRateLimiter = createAdvancedRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'ratelimit:auth',
    skipSuccessfulRequests: true,
    slidingWindow: true,
    blockDuration: 30 * 60 * 1000,
});
exports.apiRateLimiter = createAdvancedRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'ratelimit:api',
    slidingWindow: true,
    skipRateLimitedPaths: ['/health', '/metrics'],
});
exports.ipSecurityMiddleware = createIPSecurityMiddleware({
    maxFailedAttempts: 10,
    blockDuration: 60 * 60 * 1000,
    keyPrefix: 'security',
    monitorEndpoints: ['/api/auth', '/api/payment', '/api/upload']
});
exports.ddosProtection = createAdvancedRateLimiter({
    windowMs: 1000,
    maxRequests: 20,
    keyPrefix: 'ddos',
    slidingWindow: true,
    blockDuration: 10 * 60 * 1000,
    skipRateLimitedPaths: ['/health']
});
//# sourceMappingURL=rate-limit.middleware.js.map