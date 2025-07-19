"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileCache = exports.dbCache = exports.apiCache = exports.cacheService = exports.CacheService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const redis_service_1 = require("../redis/redis.service");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
class CacheService {
    nodeCache;
    redisService;
    defaultConfig;
    cacheHits = 0;
    cacheMisses = 0;
    constructor(config = { ttl: 300 }) {
        this.defaultConfig = {
            ttl: config.ttl,
            checkPeriod: config.checkPeriod || 600,
            useRedis: config.useRedis ?? true,
            prefix: config.prefix || 'cache:'
        };
        this.nodeCache = new node_cache_1.default({
            stdTTL: this.defaultConfig.ttl,
            checkperiod: this.defaultConfig.checkPeriod,
            useClones: false
        });
        this.redisService = redis_service_1.RedisService.getInstance();
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.nodeCache.on('set', (key, value) => {
            logger_1.logger.debug('Cache set', { key, size: this.getValueSize(value) });
            prometheus_metrics_service_1.prometheusMetrics.cacheOperations.inc({ operation: 'set', cache: 'memory' });
        });
        this.nodeCache.on('get', (key, value) => {
            if (value !== undefined) {
                this.cacheHits++;
                prometheus_metrics_service_1.prometheusMetrics.cacheHits.inc({ cache: 'memory' });
            }
            else {
                this.cacheMisses++;
                prometheus_metrics_service_1.prometheusMetrics.cacheMisses.inc({ cache: 'memory' });
            }
        });
        this.nodeCache.on('del', (key, value) => {
            logger_1.logger.debug('Cache delete', { key });
            prometheus_metrics_service_1.prometheusMetrics.cacheOperations.inc({ operation: 'delete', cache: 'memory' });
        });
        this.nodeCache.on('expired', (key, value) => {
            logger_1.logger.debug('Cache expired', { key });
            prometheus_metrics_service_1.prometheusMetrics.cacheOperations.inc({ operation: 'expire', cache: 'memory' });
        });
    }
    async get(key, options = {}) {
        const fullKey = this.buildKey(key, options);
        try {
            const memoryValue = this.nodeCache.get(fullKey);
            if (memoryValue !== undefined) {
                logger_1.logger.debug('Cache hit (memory)', { key: fullKey });
                return memoryValue;
            }
            if (this.defaultConfig.useRedis) {
                const redisValue = await this.getFromRedis(fullKey, options);
                if (redisValue !== null) {
                    this.nodeCache.set(fullKey, redisValue, options.ttl || this.defaultConfig.ttl);
                    logger_1.logger.debug('Cache hit (Redis)', { key: fullKey });
                    prometheus_metrics_service_1.prometheusMetrics.cacheHits.inc({ cache: 'redis' });
                    return redisValue;
                }
                prometheus_metrics_service_1.prometheusMetrics.cacheMisses.inc({ cache: 'redis' });
            }
            logger_1.logger.debug('Cache miss', { key: fullKey });
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', { key: fullKey, error });
            prometheus_metrics_service_1.prometheusMetrics.cacheErrors.inc({ operation: 'get' });
            return null;
        }
    }
    async set(key, value, options = {}) {
        const fullKey = this.buildKey(key, options);
        const ttl = options.ttl || this.defaultConfig.ttl;
        try {
            const valueSize = this.getValueSize(value);
            if (valueSize > 1024 * 1024) {
                logger_1.logger.warn('Cache value too large', { key: fullKey, size: valueSize });
                return false;
            }
            const memorySuccess = this.nodeCache.set(fullKey, value, ttl);
            if (this.defaultConfig.useRedis) {
                await this.setInRedis(fullKey, value, ttl, options);
            }
            if (options.tags) {
                await this.storeTags(fullKey, options.tags);
            }
            logger_1.logger.debug('Cache set success', { key: fullKey, ttl, size: valueSize });
            return memorySuccess;
        }
        catch (error) {
            logger_1.logger.error('Cache set error', { key: fullKey, error });
            prometheus_metrics_service_1.prometheusMetrics.cacheErrors.inc({ operation: 'set' });
            return false;
        }
    }
    async delete(key, options = {}) {
        const fullKey = this.buildKey(key, options);
        try {
            const memoryDeleted = this.nodeCache.del(fullKey) > 0;
            if (this.defaultConfig.useRedis) {
                await this.redisService.del(fullKey);
            }
            if (options.tags) {
                await this.cleanupTags(fullKey, options.tags);
            }
            logger_1.logger.debug('Cache delete', { key: fullKey, success: memoryDeleted });
            return memoryDeleted;
        }
        catch (error) {
            logger_1.logger.error('Cache delete error', { key: fullKey, error });
            prometheus_metrics_service_1.prometheusMetrics.cacheErrors.inc({ operation: 'delete' });
            return false;
        }
    }
    async invalidateByTag(tag) {
        try {
            const tagKey = `${this.defaultConfig.prefix}tag:${tag}`;
            const keys = await this.redisService.smembers(tagKey);
            let deletedCount = 0;
            for (const key of keys) {
                if (this.nodeCache.del(key) > 0) {
                    deletedCount++;
                }
                if (this.defaultConfig.useRedis) {
                    await this.redisService.del(key);
                }
            }
            await this.redisService.del(tagKey);
            logger_1.logger.info('Cache invalidated by tag', { tag, deletedCount });
            prometheus_metrics_service_1.prometheusMetrics.cacheOperations.inc({ operation: 'invalidate_tag', cache: 'both' });
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error('Cache invalidate by tag error', { tag, error });
            prometheus_metrics_service_1.prometheusMetrics.cacheErrors.inc({ operation: 'invalidate_tag' });
            return 0;
        }
    }
    async invalidateByPattern(pattern) {
        try {
            const fullPattern = this.buildKey(pattern);
            let deletedCount = 0;
            const memoryKeys = this.nodeCache.keys();
            const matchingKeys = memoryKeys.filter(key => key.includes(pattern));
            for (const key of matchingKeys) {
                if (this.nodeCache.del(key) > 0) {
                    deletedCount++;
                }
            }
            if (this.defaultConfig.useRedis) {
                const redisKeys = await this.redisService.keys(fullPattern);
                if (redisKeys.length > 0) {
                    await this.redisService.del(...redisKeys);
                    deletedCount += redisKeys.length;
                }
            }
            logger_1.logger.info('Cache invalidated by pattern', { pattern, deletedCount });
            prometheus_metrics_service_1.prometheusMetrics.cacheOperations.inc({ operation: 'invalidate_pattern', cache: 'both' });
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error('Cache invalidate by pattern error', { pattern, error });
            prometheus_metrics_service_1.prometheusMetrics.cacheErrors.inc({ operation: 'invalidate_pattern' });
            return 0;
        }
    }
    async clear() {
        try {
            this.nodeCache.flushAll();
            if (this.defaultConfig.useRedis) {
                const keys = await this.redisService.keys(`${this.defaultConfig.prefix}*`);
                if (keys.length > 0) {
                    await this.redisService.del(...keys);
                }
            }
            logger_1.logger.info('Cache cleared');
            prometheus_metrics_service_1.prometheusMetrics.cacheOperations.inc({ operation: 'clear', cache: 'both' });
        }
        catch (error) {
            logger_1.logger.error('Cache clear error', error);
            prometheus_metrics_service_1.prometheusMetrics.cacheErrors.inc({ operation: 'clear' });
        }
    }
    memoize(fn, keyGenerator, options = {}) {
        return ((...args) => {
            const key = keyGenerator(...args);
            return this.get(key, options).then(cached => {
                if (cached !== null) {
                    return cached;
                }
                const result = fn(...args);
                if (result instanceof Promise) {
                    return result.then(value => {
                        this.set(key, value, options);
                        return value;
                    });
                }
                else {
                    this.set(key, result, options);
                    return result;
                }
            });
        });
    }
    getStats() {
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
    buildKey(key, options = {}) {
        return `${this.defaultConfig.prefix}${key}`;
    }
    async getFromRedis(key, options) {
        try {
            const value = await this.redisService.get(key);
            if (value === null)
                return null;
            if (options.serialize !== false) {
                return JSON.parse(value);
            }
            return value;
        }
        catch (error) {
            logger_1.logger.error('Redis get error', { key, error });
            return null;
        }
    }
    async setInRedis(key, value, ttl, options) {
        try {
            let serializedValue;
            if (options.serialize !== false) {
                serializedValue = JSON.stringify(value);
            }
            else {
                serializedValue = value;
            }
            if (options.compress && serializedValue.length > 1024) {
            }
            await this.redisService.setex(key, ttl, serializedValue);
            prometheus_metrics_service_1.prometheusMetrics.cacheOperations.inc({ operation: 'set', cache: 'redis' });
        }
        catch (error) {
            logger_1.logger.error('Redis set error', { key, error });
        }
    }
    async storeTags(key, tags) {
        try {
            for (const tag of tags) {
                const tagKey = `${this.defaultConfig.prefix}tag:${tag}`;
                await this.redisService.sadd(tagKey, key);
                await this.redisService.expire(tagKey, this.defaultConfig.ttl * 2);
            }
        }
        catch (error) {
            logger_1.logger.error('Store tags error', { key, tags, error });
        }
    }
    async cleanupTags(key, tags) {
        try {
            for (const tag of tags) {
                const tagKey = `${this.defaultConfig.prefix}tag:${tag}`;
                await this.redisService.srem(tagKey, key);
            }
        }
        catch (error) {
            logger_1.logger.error('Cleanup tags error', { key, tags, error });
        }
    }
    getValueSize(value) {
        try {
            return JSON.stringify(value).length;
        }
        catch {
            return 0;
        }
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService({
    ttl: 300,
    useRedis: process.env.NODE_ENV !== 'test',
    prefix: 'fti:'
});
exports.apiCache = new CacheService({
    ttl: 60,
    prefix: 'api:'
});
exports.dbCache = new CacheService({
    ttl: 900,
    prefix: 'db:'
});
exports.fileCache = new CacheService({
    ttl: 3600,
    prefix: 'file:'
});
//# sourceMappingURL=cache.service.js.map