/**
 * REDIS CONFIGURATION
 * 
 * Redis client configuration for caching and session management
 */

import Redis from 'ioredis';
import Bull from 'bull';
import { logger } from '../utils/logger';
import { env } from '../utils/env-validation';

// Redis client instance
let redis: Redis;

// Redis configuration
const redisConfig = {
  host: env.REDIS_URL ? new URL(env.REDIS_URL).hostname : 'localhost',
  port: env.REDIS_URL ? parseInt(new URL(env.REDIS_URL).port) || 6379 : 6379,
  password: env.REDIS_URL ? new URL(env.REDIS_URL).password || undefined : undefined,
  db: process.env.NODE_ENV === 'test' ? 1 : 0, // Use DB 1 for tests
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  
  // Connection timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Retry configuration
  retryConnect: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Initialize Redis client
try {
  redis = new Redis(redisConfig);

  // Event handlers
  redis.on('connect', () => {
    logger.info('Redis client connected');
  });

  redis.on('ready', () => {
    logger.info('Redis client ready');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error', { error: error.message });
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('reconnecting', (time: number) => {
    logger.info('Redis reconnecting', { delay: time });
  });

} catch (error) {
  logger.error('Failed to initialize Redis client', { error });
  
  // Create a mock Redis client for testing/development when Redis is not available
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
    disconnect: async () => {},
    quit: async () => 'OK',
  } as unknown as Redis;
  
  redis = mockRedis;
  logger.warn('Using mock Redis client - Redis server not available');
}

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    await redis.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection', { error });
  }
});

// Export Redis client
export default redis;
export { redis };

/**
 * Redis health check
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return false;
  }
}

/**
 * Redis cache utilities
 */
export class RedisCache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error', { key, error });
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis set error', { key, error });
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete error', { key, error });
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis exists error', { key, error });
      return false;
    }
  }

  static async keys(pattern: string): Promise<string[]> {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error', { pattern, error });
      return [];
    }
  }

  static async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      logger.error('Redis incr error', { key, error });
      return 0;
    }
  }

  static async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Redis expire error', { key, ttl, error });
      return false;
    }
  }
}

/**
 * Redis session utilities
 */
export class RedisSession {
  private static getKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  static async get(sessionId: string): Promise<any | null> {
    return RedisCache.get(this.getKey(sessionId));
  }

  static async set(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return RedisCache.set(this.getKey(sessionId), data, ttl);
  }

  static async destroy(sessionId: string): Promise<boolean> {
    return RedisCache.del(this.getKey(sessionId));
  }

  static async refresh(sessionId: string, ttl: number = 3600): Promise<boolean> {
    return RedisCache.expire(this.getKey(sessionId), ttl);
  }
}

/**
 * Redis rate limiting utilities
 */
export class RedisRateLimit {
  static async checkLimit(
    key: string, 
    limit: number, 
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
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
    } catch (error) {
      logger.error('Redis rate limit error', { key, error });
      return { allowed: true, remaining: limit, resetTime: Date.now() + (window * 1000) };
    }
  }
}

/**
 * Bull Queue instances for job processing
 */
export const cleanupQueue = new Bull('cleanup-jobs', {
  redis: env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Initial delay of 2 seconds
    },
  },
});

export const emailQueue = new Bull('email-jobs', {
  redis: env.REDIS_URL || 'redis://localhost:6379',
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

export const notificationQueue = new Bull('notification-jobs', {
  redis: env.REDIS_URL || 'redis://localhost:6379',
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

// Queue event handlers
cleanupQueue.on('completed', (job, _result) => {
  logger.info('Cleanup job completed', { 
    jobId: job.data.jobId, 
    duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0 
  });
});

cleanupQueue.on('failed', (job, err) => {
  logger.error('Cleanup job failed', { 
    jobId: job.data.jobId, 
    error: err.message,
    attemptNumber: job.attemptsMade,
  });
});

cleanupQueue.on('progress', (job, progress) => {
  logger.debug('Cleanup job progress', { jobId: job.data.jobId, progress });
});

emailQueue.on('completed', (job) => {
  logger.info('Email job completed', { jobId: job.id });
});

emailQueue.on('failed', (job, err) => {
  logger.error('Email job failed', { jobId: job.id, error: err.message });
});

notificationQueue.on('completed', (job) => {
  logger.info('Notification job completed', { jobId: job.id });
});

notificationQueue.on('failed', (job, err) => {
  logger.error('Notification job failed', { jobId: job.id, error: err.message });
});

// Cleanup old jobs periodically
const cleanupInterval = setInterval(async () => {
  try {
    // Clean completed jobs older than 24 hours
    await cleanupQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await emailQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await notificationQueue.clean(24 * 60 * 60 * 1000, 'completed');
    
    // Clean failed jobs older than 7 days
    await cleanupQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    await emailQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    await notificationQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    
    logger.debug('Queue cleanup completed');
  } catch (error) {
    logger.error('Queue cleanup failed', { error });
  }
}, 60 * 60 * 1000); // Run every hour

// Graceful shutdown for queues
process.on('beforeExit', async () => {
  clearInterval(cleanupInterval);
  try {
    await Promise.all([
      cleanupQueue.close(),
      emailQueue.close(),
      notificationQueue.close(),
    ]);
    logger.info('All queues closed gracefully');
  } catch (error) {
    logger.error('Error closing queues', { error });
  }
});

/**
 * Enhanced Redis rate limiting utilities with sliding window
 */
export class RedisAdvancedRateLimit {
  static async slidingWindowLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; hits: number }> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      const multi = redis.multi();
      
      // Remove expired entries
      multi.zremrangebyscore(key, '-inf', windowStart);
      
      // Count current entries
      multi.zcard(key);
      
      // Add current request
      multi.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiry
      multi.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Redis multi exec failed');
      }
      
      const hits = (results[1][1] as number) || 0;
      const resetTime = now + windowMs;
      
      return {
        allowed: hits < limit,
        remaining: Math.max(0, limit - hits - 1), // -1 for current request
        resetTime,
        hits: hits + 1
      };
    } catch (error) {
      logger.error('Redis sliding window rate limit error', { key, error });
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs, hits: 0 };
    }
  }

  static async tokenBucketLimit(
    key: string,
    capacity: number,
    refillRate: number,
    tokensRequested: number = 1
  ): Promise<{ allowed: boolean; tokensRemaining: number; nextRefillTime: number }> {
    try {
      const now = Date.now();
      const bucket = await redis.hmget(key, 'tokens', 'lastRefill');
      
      let tokens = parseFloat(bucket[0] || capacity.toString());
      let lastRefill = parseInt(bucket[1] || now.toString());
      
      // Calculate tokens to add based on time passed
      const timePassed = now - lastRefill;
      const tokensToAdd = Math.floor(timePassed / 1000) * refillRate;
      tokens = Math.min(capacity, tokens + tokensToAdd);
      
      let allowed = false;
      if (tokens >= tokensRequested) {
        tokens -= tokensRequested;
        allowed = true;
      }
      
      // Update bucket state
      await redis.hmset(key, 'tokens', tokens.toString(), 'lastRefill', now.toString());
      await redis.expire(key, Math.ceil(capacity / refillRate) + 60); // TTL with buffer
      
      const nextRefillTime = now + (1000 / refillRate);
      
      return {
        allowed,
        tokensRemaining: tokens,
        nextRefillTime
      };
    } catch (error) {
      logger.error('Redis token bucket rate limit error', { key, error });
      return { 
        allowed: true, 
        tokensRemaining: capacity, 
        nextRefillTime: Date.now() + (1000 / refillRate) 
      };
    }
  }
}

/**
 * Redis pattern for distributed locks
 */
export class RedisLock {
  static async acquireLock(
    key: string, 
    ttl: number = 30000, 
    identifier?: string
  ): Promise<string | null> {
    try {
      const lockId = identifier || `${Date.now()}-${Math.random()}`;
      const lockKey = `lock:${key}`;
      
      const result = await redis.set(lockKey, lockId, 'PX', ttl, 'NX');
      return result === 'OK' ? lockId : null;
    } catch (error) {
      logger.error('Redis lock acquisition error', { key, error });
      return null;
    }
  }

  static async releaseLock(key: string, identifier: string): Promise<boolean> {
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
    } catch (error) {
      logger.error('Redis lock release error', { key, error });
      return false;
    }
  }

  static async extendLock(key: string, identifier: string, ttl: number): Promise<boolean> {
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
    } catch (error) {
      logger.error('Redis lock extension error', { key, error });
      return false;
    }
  }
}

/**
 * Redis pattern for pub/sub
 */
export class RedisPubSub {
  private static subscribers = new Map<string, Redis>();

  static async publish(channel: string, message: any): Promise<number> {
    try {
      const serializedMessage = JSON.stringify(message);
      return await redis.publish(channel, serializedMessage);
    } catch (error) {
      logger.error('Redis publish error', { channel, error });
      return 0;
    }
  }

  static async subscribe(
    channel: string, 
    callback: (message: any, channel: string) => void
  ): Promise<void> {
    try {
      if (this.subscribers.has(channel)) {
        logger.warn('Channel already subscribed', { channel });
        return;
      }

      const subscriber = redis.duplicate();
      this.subscribers.set(channel, subscriber);

      subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage, receivedChannel);
          } catch (error) {
            logger.error('Redis message parsing error', { channel, error });
          }
        }
      });

      await subscriber.subscribe(channel);
      logger.info('Subscribed to Redis channel', { channel });
    } catch (error) {
      logger.error('Redis subscribe error', { channel, error });
    }
  }

  static async unsubscribe(channel: string): Promise<void> {
    try {
      const subscriber = this.subscribers.get(channel);
      if (subscriber) {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
        this.subscribers.delete(channel);
        logger.info('Unsubscribed from Redis channel', { channel });
      }
    } catch (error) {
      logger.error('Redis unsubscribe error', { channel, error });
    }
  }

  static async unsubscribeAll(): Promise<void> {
    const channels = Array.from(this.subscribers.keys());
    await Promise.all(channels.map(channel => this.unsubscribe(channel)));
  }
}

/**
 * Redis cleanup for testing
 */
export async function cleanupTestRedis(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Redis cleanup only allowed in test environment');
  }
  
  try {
    const keys = await redis.keys('test:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    logger.info('Test Redis cleanup completed');
  } catch (error) {
    logger.error('Test Redis cleanup failed', { error });
    throw error;
  }
}