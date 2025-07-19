"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisPubSub = exports.RedisLock = exports.RedisAdvancedRateLimit = exports.notificationQueue = exports.emailQueue = exports.cleanupQueue = exports.RedisRateLimit = exports.RedisSession = exports.RedisCache = void 0;
exports.checkRedisConnection = checkRedisConnection;
exports.cleanupTestRedis = cleanupTestRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const env_validation_1 = require("../utils/env-validation");
let redis;
const redisConfig = {
    host: env_validation_1.env.REDIS_URL ? new URL(env_validation_1.env.REDIS_URL).hostname : 'localhost',
    port: env_validation_1.env.REDIS_URL ? parseInt(new URL(env_validation_1.env.REDIS_URL).port) || 6379 : 6379,
    password: env_validation_1.env.REDIS_URL ? new URL(env_validation_1.env.REDIS_URL).password || undefined : undefined,
    db: process.env.NODE_ENV === 'test' ? 1 : 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryConnect: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
};
try {
    redis = new ioredis_1.default(redisConfig);
    redis.on('connect', () => {
        logger_1.logger.info('Redis client connected');
    });
    redis.on('ready', () => {
        logger_1.logger.info('Redis client ready');
    });
    redis.on('error', (error) => {
        logger_1.logger.error('Redis connection error', { error: error.message });
    });
    redis.on('close', () => {
        logger_1.logger.warn('Redis connection closed');
    });
    redis.on('reconnecting', (time) => {
        logger_1.logger.info('Redis reconnecting', { delay: time });
    });
}
catch (error) {
    logger_1.logger.error('Failed to initialize Redis client', { error });
    const mockRedis = {
        get: async () => null,
        set: async () => 'OK',
        setex: async () => 'OK',
        del: async () => 1,
        exists: async () => 0,
        keys: async () => [],
        ttl: async () => -1,
        expire: async () => 1,
        incr: async () => 1,
        hget: async () => null,
        hset: async () => 1,
        hdel: async () => 1,
        hgetall: async () => ({}),
        disconnect: async () => { },
        quit: async () => 'OK',
    };
    redis = mockRedis;
    logger_1.logger.warn('Using mock Redis client - Redis server not available');
}
process.on('beforeExit', async () => {
    try {
        await redis.quit();
        logger_1.logger.info('Redis connection closed gracefully');
    }
    catch (error) {
        logger_1.logger.error('Error closing Redis connection', { error });
    }
});
exports.default = redis;
async function checkRedisConnection() {
    try {
        const result = await redis.ping();
        return result === 'PONG';
    }
    catch (error) {
        logger_1.logger.error('Redis health check failed', { error });
        return false;
    }
}
class RedisCache {
    static async get(key) {
        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.logger.error('Redis get error', { key, error });
            return null;
        }
    }
    static async set(key, value, ttl) {
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await redis.setex(key, ttl, serialized);
            }
            else {
                await redis.set(key, serialized);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis set error', { key, error });
            return false;
        }
    }
    static async del(key) {
        try {
            const result = await redis.del(key);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Redis delete error', { key, error });
            return false;
        }
    }
    static async exists(key) {
        try {
            const result = await redis.exists(key);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Redis exists error', { key, error });
            return false;
        }
    }
    static async keys(pattern) {
        try {
            return await redis.keys(pattern);
        }
        catch (error) {
            logger_1.logger.error('Redis keys error', { pattern, error });
            return [];
        }
    }
    static async incr(key) {
        try {
            return await redis.incr(key);
        }
        catch (error) {
            logger_1.logger.error('Redis incr error', { key, error });
            return 0;
        }
    }
    static async expire(key, ttl) {
        try {
            const result = await redis.expire(key, ttl);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis expire error', { key, ttl, error });
            return false;
        }
    }
}
exports.RedisCache = RedisCache;
class RedisSession {
    static getKey(sessionId) {
        return `session:${sessionId}`;
    }
    static async get(sessionId) {
        return RedisCache.get(this.getKey(sessionId));
    }
    static async set(sessionId, data, ttl = 3600) {
        return RedisCache.set(this.getKey(sessionId), data, ttl);
    }
    static async destroy(sessionId) {
        return RedisCache.del(this.getKey(sessionId));
    }
    static async refresh(sessionId, ttl = 3600) {
        return RedisCache.expire(this.getKey(sessionId), ttl);
    }
}
exports.RedisSession = RedisSession;
class RedisRateLimit {
    static async checkLimit(key, limit, window) {
        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, window);
            }
            const ttl = await redis.ttl(key);
            const resetTime = Date.now() + (ttl * 1000);
            return {
                allowed: current <= limit,
                remaining: Math.max(0, limit - current),
                resetTime
            };
        }
        catch (error) {
            logger_1.logger.error('Redis rate limit error', { key, error });
            return { allowed: true, remaining: limit, resetTime: Date.now() + (window * 1000) };
        }
    }
}
exports.RedisRateLimit = RedisRateLimit;
exports.cleanupQueue = new bull_1.default('cleanup-jobs', {
    redis: env_validation_1.env.REDIS_URL || 'redis://localhost:6379',
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});
exports.emailQueue = new bull_1.default('email-jobs', {
    redis: env_validation_1.env.REDIS_URL || 'redis://localhost:6379',
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});
exports.notificationQueue = new bull_1.default('notification-jobs', {
    redis: env_validation_1.env.REDIS_URL || 'redis://localhost:6379',
    defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 50,
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 500,
        },
    },
});
exports.cleanupQueue.on('completed', (job, _result) => {
    logger_1.logger.info('Cleanup job completed', {
        jobId: job.data.jobId,
        duration: job.finishedOn ? job.finishedOn - job.processedOn : 0
    });
});
exports.cleanupQueue.on('failed', (job, err) => {
    logger_1.logger.error('Cleanup job failed', {
        jobId: job.data.jobId,
        error: err.message,
        attemptNumber: job.attemptsMade,
    });
});
exports.cleanupQueue.on('progress', (job, progress) => {
    logger_1.logger.debug('Cleanup job progress', { jobId: job.data.jobId, progress });
});
exports.emailQueue.on('completed', (job) => {
    logger_1.logger.info('Email job completed', { jobId: job.id });
});
exports.emailQueue.on('failed', (job, err) => {
    logger_1.logger.error('Email job failed', { jobId: job.id, error: err.message });
});
exports.notificationQueue.on('completed', (job) => {
    logger_1.logger.info('Notification job completed', { jobId: job.id });
});
exports.notificationQueue.on('failed', (job, err) => {
    logger_1.logger.error('Notification job failed', { jobId: job.id, error: err.message });
});
const cleanupInterval = setInterval(async () => {
    try {
        await exports.cleanupQueue.clean(24 * 60 * 60 * 1000, 'completed');
        await exports.emailQueue.clean(24 * 60 * 60 * 1000, 'completed');
        await exports.notificationQueue.clean(24 * 60 * 60 * 1000, 'completed');
        await exports.cleanupQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
        await exports.emailQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
        await exports.notificationQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
        logger_1.logger.debug('Queue cleanup completed');
    }
    catch (error) {
        logger_1.logger.error('Queue cleanup failed', { error });
    }
}, 60 * 60 * 1000);
process.on('beforeExit', async () => {
    clearInterval(cleanupInterval);
    try {
        await Promise.all([
            exports.cleanupQueue.close(),
            exports.emailQueue.close(),
            exports.notificationQueue.close(),
        ]);
        logger_1.logger.info('All queues closed gracefully');
    }
    catch (error) {
        logger_1.logger.error('Error closing queues', { error });
    }
});
class RedisAdvancedRateLimit {
    static async slidingWindowLimit(key, limit, windowMs) {
        try {
            const now = Date.now();
            const windowStart = now - windowMs;
            const multi = redis.multi();
            multi.zremrangebyscore(key, '-inf', windowStart);
            multi.zcard(key);
            multi.zadd(key, now, `${now}-${Math.random()}`);
            multi.expire(key, Math.ceil(windowMs / 1000));
            const results = await multi.exec();
            if (!results) {
                throw new Error('Redis multi exec failed');
            }
            const hits = results[1][1] || 0;
            const resetTime = now + windowMs;
            return {
                allowed: hits < limit,
                remaining: Math.max(0, limit - hits - 1),
                resetTime,
                hits: hits + 1
            };
        }
        catch (error) {
            logger_1.logger.error('Redis sliding window rate limit error', { key, error });
            return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs, hits: 0 };
        }
    }
    static async tokenBucketLimit(key, capacity, refillRate, tokensRequested = 1) {
        try {
            const now = Date.now();
            const bucket = await redis.hmget(key, 'tokens', 'lastRefill');
            let tokens = parseFloat(bucket[0] || capacity.toString());
            let lastRefill = parseInt(bucket[1] || now.toString());
            const timePassed = now - lastRefill;
            const tokensToAdd = Math.floor(timePassed / 1000) * refillRate;
            tokens = Math.min(capacity, tokens + tokensToAdd);
            let allowed = false;
            if (tokens >= tokensRequested) {
                tokens -= tokensRequested;
                allowed = true;
            }
            await redis.hmset(key, 'tokens', tokens.toString(), 'lastRefill', now.toString());
            await redis.expire(key, Math.ceil(capacity / refillRate) + 60);
            const nextRefillTime = now + (1000 / refillRate);
            return {
                allowed,
                tokensRemaining: tokens,
                nextRefillTime
            };
        }
        catch (error) {
            logger_1.logger.error('Redis token bucket rate limit error', { key, error });
            return {
                allowed: true,
                tokensRemaining: capacity,
                nextRefillTime: Date.now() + (1000 / refillRate)
            };
        }
    }
}
exports.RedisAdvancedRateLimit = RedisAdvancedRateLimit;
class RedisLock {
    static async acquireLock(key, ttl = 30000, identifier) {
        try {
            const lockId = identifier || `${Date.now()}-${Math.random()}`;
            const lockKey = `lock:${key}`;
            const result = await redis.set(lockKey, lockId, 'PX', ttl, 'NX');
            return result === 'OK' ? lockId : null;
        }
        catch (error) {
            logger_1.logger.error('Redis lock acquisition error', { key, error });
            return null;
        }
    }
    static async releaseLock(key, identifier) {
        try {
            const lockKey = `lock:${key}`;
            const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
            const result = await redis.eval(luaScript, 1, lockKey, identifier);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis lock release error', { key, error });
            return false;
        }
    }
    static async extendLock(key, identifier, ttl) {
        try {
            const lockKey = `lock:${key}`;
            const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;
            const result = await redis.eval(luaScript, 1, lockKey, identifier, ttl);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis lock extension error', { key, error });
            return false;
        }
    }
}
exports.RedisLock = RedisLock;
class RedisPubSub {
    static subscribers = new Map();
    static async publish(channel, message) {
        try {
            const serializedMessage = JSON.stringify(message);
            return await redis.publish(channel, serializedMessage);
        }
        catch (error) {
            logger_1.logger.error('Redis publish error', { channel, error });
            return 0;
        }
    }
    static async subscribe(channel, callback) {
        try {
            if (this.subscribers.has(channel)) {
                logger_1.logger.warn('Channel already subscribed', { channel });
                return;
            }
            const subscriber = redis.duplicate();
            this.subscribers.set(channel, subscriber);
            subscriber.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    try {
                        const parsedMessage = JSON.parse(message);
                        callback(parsedMessage, receivedChannel);
                    }
                    catch (error) {
                        logger_1.logger.error('Redis message parsing error', { channel, error });
                    }
                }
            });
            await subscriber.subscribe(channel);
            logger_1.logger.info('Subscribed to Redis channel', { channel });
        }
        catch (error) {
            logger_1.logger.error('Redis subscribe error', { channel, error });
        }
    }
    static async unsubscribe(channel) {
        try {
            const subscriber = this.subscribers.get(channel);
            if (subscriber) {
                await subscriber.unsubscribe(channel);
                await subscriber.quit();
                this.subscribers.delete(channel);
                logger_1.logger.info('Unsubscribed from Redis channel', { channel });
            }
        }
        catch (error) {
            logger_1.logger.error('Redis unsubscribe error', { channel, error });
        }
    }
    static async unsubscribeAll() {
        const channels = Array.from(this.subscribers.keys());
        await Promise.all(channels.map(channel => this.unsubscribe(channel)));
    }
}
exports.RedisPubSub = RedisPubSub;
async function cleanupTestRedis() {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Redis cleanup only allowed in test environment');
    }
    try {
        const keys = await redis.keys('test:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        logger_1.logger.info('Test Redis cleanup completed');
    }
    catch (error) {
        logger_1.logger.error('Test Redis cleanup failed', { error });
        throw error;
    }
}
//# sourceMappingURL=redis.js.map