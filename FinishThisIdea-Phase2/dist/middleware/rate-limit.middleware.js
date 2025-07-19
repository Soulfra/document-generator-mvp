"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRateLimiter = exports.strictRateLimiter = exports.rateLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
const errors_1 = require("../utils/errors");
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
function createRateLimiter(options) {
    const { windowMs, maxRequests, keyPrefix = 'ratelimit', skipFailedRequests = false, skipSuccessfulRequests = false, } = options;
    return async (req, res, next) => {
        try {
            // Generate key based on IP address
            const identifier = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `${keyPrefix}:${identifier}`;
            // Get current count
            const current = await redis.incr(key);
            // Set expiry on first request
            if (current === 1) {
                await redis.pexpire(key, windowMs);
            }
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', maxRequests.toString());
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());
            // Check if limit exceeded
            if (current > maxRequests) {
                const ttl = await redis.pttl(key);
                res.setHeader('X-RateLimit-Reset', new Date(Date.now() + ttl).toISOString());
                throw new errors_1.RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(ttl / 1000)} seconds`);
            }
            // Handle skipping logic after response
            if (skipFailedRequests || skipSuccessfulRequests) {
                const originalSend = res.send;
                res.send = function (data) {
                    const shouldSkip = (skipFailedRequests && res.statusCode >= 400) ||
                        (skipSuccessfulRequests && res.statusCode < 400);
                    if (shouldSkip) {
                        // Decrement the counter
                        redis.decr(key);
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
                // Don't block requests if Redis is down
                console.error('Rate limiter error:', error);
                next();
            }
        }
    };
}
// Default rate limiters
exports.rateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
});
exports.strictRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyPrefix: 'ratelimit:strict',
});
exports.uploadRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 uploads per hour
    keyPrefix: 'ratelimit:upload',
    skipFailedRequests: true,
});
//# sourceMappingURL=rate-limit.middleware.js.map