import NodeCache from 'node-cache';
import { RedisService } from '../redis/redis.service';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  checkPeriod?: number; // Period for automatic delete check
  useRedis?: boolean; // Use Redis for distributed caching
  prefix?: string; // Key prefix for namespacing
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[]; // For cache invalidation by tags
  compress?: boolean; // Compress large values
  serialize?: boolean; // Custom serialization
}

export class CacheService {
  private nodeCache: NodeCache;
  private redisService: RedisService;
  private defaultConfig: Required<CacheConfig>;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(config: CacheConfig = { ttl: 300 }) {
    this.defaultConfig = {
      ttl: config.ttl,
      checkPeriod: config.checkPeriod || 600,
      useRedis: config.useRedis ?? true,
      prefix: config.prefix || 'cache:'
    };

    // Initialize in-memory cache
    this.nodeCache = new NodeCache({
      stdTTL: this.defaultConfig.ttl,
      checkperiod: this.defaultConfig.checkPeriod,
      useClones: false // Better performance, but be careful with mutations
    });

    // Initialize Redis for distributed caching
    this.redisService = RedisService.getInstance();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.nodeCache.on('set', (key, value) => {
      logger.debug('Cache set', { key, size: this.getValueSize(value) });
      prometheusMetrics.cacheOperations.inc({ operation: 'set', cache: 'memory' });
    });

    this.nodeCache.on('get', (key, value) => {
      if (value !== undefined) {
        this.cacheHits++;
        prometheusMetrics.cacheHits.inc({ cache: 'memory' });
      } else {
        this.cacheMisses++;
        prometheusMetrics.cacheMisses.inc({ cache: 'memory' });
      }
    });

    this.nodeCache.on('del', (key, value) => {
      logger.debug('Cache delete', { key });
      prometheusMetrics.cacheOperations.inc({ operation: 'delete', cache: 'memory' });
    });

    this.nodeCache.on('expired', (key, value) => {
      logger.debug('Cache expired', { key });
      prometheusMetrics.cacheOperations.inc({ operation: 'expire', cache: 'memory' });
    });
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.buildKey(key, options);

    try {
      // Try in-memory cache first
      const memoryValue = this.nodeCache.get<T>(fullKey);
      if (memoryValue !== undefined) {
        logger.debug('Cache hit (memory)', { key: fullKey });
        return memoryValue;
      }

      // Try Redis if enabled
      if (this.defaultConfig.useRedis) {
        const redisValue = await this.getFromRedis<T>(fullKey, options);
        if (redisValue !== null) {
          // Store in memory cache for faster access
          this.nodeCache.set(fullKey, redisValue, options.ttl || this.defaultConfig.ttl);
          logger.debug('Cache hit (Redis)', { key: fullKey });
          prometheusMetrics.cacheHits.inc({ cache: 'redis' });
          return redisValue;
        }
        prometheusMetrics.cacheMisses.inc({ cache: 'redis' });
      }

      logger.debug('Cache miss', { key: fullKey });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key: fullKey, error });
      prometheusMetrics.cacheErrors.inc({ operation: 'get' });
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options);
    const ttl = options.ttl || this.defaultConfig.ttl;

    try {
      // Validate value size
      const valueSize = this.getValueSize(value);
      if (valueSize > 1024 * 1024) { // 1MB limit
        logger.warn('Cache value too large', { key: fullKey, size: valueSize });
        return false;
      }

      // Set in memory cache
      const memorySuccess = this.nodeCache.set(fullKey, value, ttl);

      // Set in Redis if enabled
      if (this.defaultConfig.useRedis) {
        await this.setInRedis(fullKey, value, ttl, options);
      }

      // Store tags for invalidation
      if (options.tags) {
        await this.storeTags(fullKey, options.tags);
      }

      logger.debug('Cache set success', { key: fullKey, ttl, size: valueSize });
      return memorySuccess;
    } catch (error) {
      logger.error('Cache set error', { key: fullKey, error });
      prometheusMetrics.cacheErrors.inc({ operation: 'set' });
      return false;
    }
  }

  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options);

    try {
      // Delete from memory
      const memoryDeleted = this.nodeCache.del(fullKey) > 0;

      // Delete from Redis
      if (this.defaultConfig.useRedis) {
        await this.redisService.del(fullKey);
      }

      // Clean up tags
      if (options.tags) {
        await this.cleanupTags(fullKey, options.tags);
      }

      logger.debug('Cache delete', { key: fullKey, success: memoryDeleted });
      return memoryDeleted;
    } catch (error) {
      logger.error('Cache delete error', { key: fullKey, error });
      prometheusMetrics.cacheErrors.inc({ operation: 'delete' });
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = `${this.defaultConfig.prefix}tag:${tag}`;
      
      // Get all keys for this tag
      const keys = await this.redisService.smembers(tagKey);
      let deletedCount = 0;

      for (const key of keys) {
        // Delete from memory
        if (this.nodeCache.del(key) > 0) {
          deletedCount++;
        }

        // Delete from Redis
        if (this.defaultConfig.useRedis) {
          await this.redisService.del(key);
        }
      }

      // Clean up the tag set
      await this.redisService.del(tagKey);

      logger.info('Cache invalidated by tag', { tag, deletedCount });
      prometheusMetrics.cacheOperations.inc({ operation: 'invalidate_tag', cache: 'both' });
      
      return deletedCount;
    } catch (error) {
      logger.error('Cache invalidate by tag error', { tag, error });
      prometheusMetrics.cacheErrors.inc({ operation: 'invalidate_tag' });
      return 0;
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      let deletedCount = 0;

      // Memory cache invalidation
      const memoryKeys = this.nodeCache.keys();
      const matchingKeys = memoryKeys.filter(key => key.includes(pattern));
      
      for (const key of matchingKeys) {
        if (this.nodeCache.del(key) > 0) {
          deletedCount++;
        }
      }

      // Redis invalidation
      if (this.defaultConfig.useRedis) {
        const redisKeys = await this.redisService.keys(fullPattern);
        if (redisKeys.length > 0) {
          await this.redisService.del(...redisKeys);
          deletedCount += redisKeys.length;
        }
      }

      logger.info('Cache invalidated by pattern', { pattern, deletedCount });
      prometheusMetrics.cacheOperations.inc({ operation: 'invalidate_pattern', cache: 'both' });
      
      return deletedCount;
    } catch (error) {
      logger.error('Cache invalidate by pattern error', { pattern, error });
      prometheusMetrics.cacheErrors.inc({ operation: 'invalidate_pattern' });
      return 0;
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.nodeCache.flushAll();

      // Clear Redis cache with prefix
      if (this.defaultConfig.useRedis) {
        const keys = await this.redisService.keys(`${this.defaultConfig.prefix}*`);
        if (keys.length > 0) {
          await this.redisService.del(...keys);
        }
      }

      logger.info('Cache cleared');
      prometheusMetrics.cacheOperations.inc({ operation: 'clear', cache: 'both' });
    } catch (error) {
      logger.error('Cache clear error', error);
      prometheusMetrics.cacheErrors.inc({ operation: 'clear' });
    }
  }

  // Memoization wrapper for functions
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    options: CacheOptions = {}
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      
      return this.get(key, options).then(cached => {
        if (cached !== null) {
          return cached;
        }
        
        const result = fn(...args);
        
        // Handle both sync and async functions
        if (result instanceof Promise) {
          return result.then(value => {
            this.set(key, value, options);
            return value;
          });
        } else {
          this.set(key, result, options);
          return result;
        }
      });
    }) as T;
  }

  // Get cache statistics
  getStats(): {
    memory: {
      keys: number;
      hits: number;
      misses: number;
      hitRate: number;
    };
    redis: {
      connected: boolean;
    };
  } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    return {
      memory: {
        keys: this.nodeCache.keys().length,
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: Math.round(hitRate * 100) / 100
      },
      redis: {
        connected: this.redisService.isConnected()
      }
    };
  }

  private buildKey(key: string, options: CacheOptions = {}): string {
    return `${this.defaultConfig.prefix}${key}`;
  }

  private async getFromRedis<T>(key: string, options: CacheOptions): Promise<T | null> {
    try {
      const value = await this.redisService.get(key);
      if (value === null) return null;

      if (options.serialize !== false) {
        return JSON.parse(value);
      }
      return value as T;
    } catch (error) {
      logger.error('Redis get error', { key, error });
      return null;
    }
  }

  private async setInRedis<T>(key: string, value: T, ttl: number, options: CacheOptions): Promise<void> {
    try {
      let serializedValue: string;
      
      if (options.serialize !== false) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      if (options.compress && serializedValue.length > 1024) {
        // Implement compression if needed
        // serializedValue = await compress(serializedValue);
      }

      await this.redisService.setex(key, ttl, serializedValue);
      prometheusMetrics.cacheOperations.inc({ operation: 'set', cache: 'redis' });
    } catch (error) {
      logger.error('Redis set error', { key, error });
    }
  }

  private async storeTags(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `${this.defaultConfig.prefix}tag:${tag}`;
        await this.redisService.sadd(tagKey, key);
        // Set expiry for tag keys to prevent memory leaks
        await this.redisService.expire(tagKey, this.defaultConfig.ttl * 2);
      }
    } catch (error) {
      logger.error('Store tags error', { key, tags, error });
    }
  }

  private async cleanupTags(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `${this.defaultConfig.prefix}tag:${tag}`;
        await this.redisService.srem(tagKey, key);
      }
    } catch (error) {
      logger.error('Cleanup tags error', { key, tags, error });
    }
  }

  private getValueSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
  }
}

// Global cache instance
export const cacheService = new CacheService({
  ttl: 300, // 5 minutes default
  useRedis: process.env.NODE_ENV !== 'test',
  prefix: 'fti:'
});

// Specialized cache instances
export const apiCache = new CacheService({
  ttl: 60, // 1 minute for API responses
  prefix: 'api:'
});

export const dbCache = new CacheService({
  ttl: 900, // 15 minutes for database queries
  prefix: 'db:'
});

export const fileCache = new CacheService({
  ttl: 3600, // 1 hour for file processing results
  prefix: 'file:'
});