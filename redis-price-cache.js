#!/usr/bin/env node

/**
 * Redis Price Cache Service
 * Provides fast caching layer for all price data with TTL management
 */

const redis = require('redis');
const { promisify } = require('util');

class RedisPriceCache {
    constructor(config = {}) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 6379,
            keyPrefix: config.keyPrefix || 'price:',
            defaultTTL: config.defaultTTL || 300, // 5 minutes default
            ...config
        };
        
        // TTL configurations per data type
        this.ttlConfig = {
            crypto: 60,        // 1 minute for crypto (fast moving)
            gaming: 600,       // 10 minutes for gaming items
            stocks: 300,       // 5 minutes for stocks
            forex: 120,        // 2 minutes for forex
            arbitrage: 30,     // 30 seconds for arbitrage opportunities
            historical: 3600   // 1 hour for historical data
        };
        
        this.client = null;
        this.connected = false;
        
        // Promisified Redis commands
        this.get = null;
        this.set = null;
        this.del = null;
        this.exists = null;
        this.expire = null;
        this.ttl = null;
        this.keys = null;
        this.mget = null;
        this.mset = null;
        this.hset = null;
        this.hget = null;
        this.hgetall = null;
        this.zadd = null;
        this.zrange = null;
        this.zremrangebyscore = null;
        
        console.log('🔴 Redis Price Cache initialized');
    }
    
    async connect() {
        try {
            this.client = redis.createClient({
                host: this.config.host,
                port: this.config.port,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        console.error('Redis connection refused');
                        return new Error('Redis connection refused');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        return new Error('Redis retry time exhausted');
                    }
                    if (options.attempt > 10) {
                        return undefined;
                    }
                    return Math.min(options.attempt * 100, 3000);
                }
            });
            
            // Promisify Redis commands
            this.get = promisify(this.client.get).bind(this.client);
            this.set = promisify(this.client.set).bind(this.client);
            this.del = promisify(this.client.del).bind(this.client);
            this.exists = promisify(this.client.exists).bind(this.client);
            this.expire = promisify(this.client.expire).bind(this.client);
            this.ttl = promisify(this.client.ttl).bind(this.client);
            this.keys = promisify(this.client.keys).bind(this.client);
            this.mget = promisify(this.client.mget).bind(this.client);
            this.mset = promisify(this.client.mset).bind(this.client);
            this.hset = promisify(this.client.hset).bind(this.client);
            this.hget = promisify(this.client.hget).bind(this.client);
            this.hgetall = promisify(this.client.hgetall).bind(this.client);
            this.zadd = promisify(this.client.zadd).bind(this.client);
            this.zrange = promisify(this.client.zrange).bind(this.client);
            this.zremrangebyscore = promisify(this.client.zremrangebyscore).bind(this.client);
            
            this.client.on('connect', () => {
                this.connected = true;
                console.log('✅ Redis connected successfully');
            });
            
            this.client.on('error', (err) => {
                console.error('Redis error:', err);
                this.connected = false;
            });
            
            this.client.on('end', () => {
                this.connected = false;
                console.log('Redis connection closed');
            });
            
            return new Promise((resolve) => {
                this.client.once('ready', () => {
                    resolve(true);
                });
            });
            
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    
    /**
     * Cache price data with automatic TTL
     */
    async cachePrice(symbol, data, category = 'crypto') {
        if (!this.connected) return false;
        
        const key = `${this.config.keyPrefix}${category}:${symbol}`;
        const ttl = this.ttlConfig[category] || this.config.defaultTTL;
        
        const cacheData = {
            ...data,
            cached_at: Date.now(),
            ttl: ttl
        };
        
        try {
            await this.set(key, JSON.stringify(cacheData), 'EX', ttl);
            
            // Also add to sorted set for time-based queries
            await this.zadd(
                `${this.config.keyPrefix}${category}:by_time`,
                Date.now(),
                symbol
            );
            
            console.log(`💾 Cached ${category}/${symbol} for ${ttl}s`);
            return true;
        } catch (error) {
            console.error(`Failed to cache ${symbol}:`, error);
            return false;
        }
    }
    
    /**
     * Get cached price data
     */
    async getPrice(symbol, category = 'crypto') {
        if (!this.connected) return null;
        
        const key = `${this.config.keyPrefix}${category}:${symbol}`;
        
        try {
            const data = await this.get(key);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            const age = Date.now() - parsed.cached_at;
            
            return {
                ...parsed,
                cache_age_ms: age,
                cache_age_seconds: Math.floor(age / 1000),
                from_cache: true
            };
        } catch (error) {
            console.error(`Failed to get cached ${symbol}:`, error);
            return null;
        }
    }
    
    /**
     * Get multiple prices at once
     */
    async getPrices(symbols, category = 'crypto') {
        if (!this.connected) return {};
        
        const keys = symbols.map(s => `${this.config.keyPrefix}${category}:${s}`);
        
        try {
            const values = await this.mget(keys);
            const result = {};
            
            symbols.forEach((symbol, index) => {
                if (values[index]) {
                    const parsed = JSON.parse(values[index]);
                    const age = Date.now() - parsed.cached_at;
                    
                    result[symbol] = {
                        ...parsed,
                        cache_age_ms: age,
                        cache_age_seconds: Math.floor(age / 1000),
                        from_cache: true
                    };
                }
            });
            
            return result;
        } catch (error) {
            console.error('Failed to get multiple cached prices:', error);
            return {};
        }
    }
    
    /**
     * Cache all prices from aggregator
     */
    async cacheAggregatedData(aggregatedData) {
        if (!this.connected) return false;
        
        const pipeline = this.client.multi();
        
        try {
            // Cache each coin's aggregated data
            Object.entries(aggregatedData).forEach(([coin, data]) => {
                const key = `${this.config.keyPrefix}aggregated:${coin}`;
                pipeline.set(key, JSON.stringify({
                    ...data,
                    cached_at: Date.now()
                }), 'EX', 120); // 2 minute TTL for aggregated data
            });
            
            // Store metadata
            pipeline.set(
                `${this.config.keyPrefix}aggregated:metadata`,
                JSON.stringify({
                    last_update: Date.now(),
                    coins: Object.keys(aggregatedData)
                }),
                'EX', 120
            );
            
            await promisify(pipeline.exec).bind(pipeline)();
            console.log('💾 Cached aggregated price data');
            return true;
        } catch (error) {
            console.error('Failed to cache aggregated data:', error);
            return false;
        }
    }
    
    /**
     * Get aggregated data from cache
     */
    async getAggregatedData() {
        if (!this.connected) return null;
        
        try {
            const metadata = await this.get(`${this.config.keyPrefix}aggregated:metadata`);
            if (!metadata) return null;
            
            const meta = JSON.parse(metadata);
            const result = {
                cached_at: meta.last_update,
                cache_age_seconds: Math.floor((Date.now() - meta.last_update) / 1000),
                data: {}
            };
            
            // Get all coin data
            for (const coin of meta.coins) {
                const data = await this.get(`${this.config.keyPrefix}aggregated:${coin}`);
                if (data) {
                    result.data[coin] = JSON.parse(data);
                }
            }
            
            return result;
        } catch (error) {
            console.error('Failed to get aggregated data from cache:', error);
            return null;
        }
    }
    
    /**
     * Cache OSRS item prices with longer TTL
     */
    async cacheOSRSPrice(itemId, itemName, priceData) {
        if (!this.connected) return false;
        
        const key = `${this.config.keyPrefix}osrs:${itemId}`;
        const ttl = 600; // 10 minutes for OSRS prices
        
        const cacheData = {
            item_id: itemId,
            item_name: itemName,
            ...priceData,
            cached_at: Date.now(),
            ttl: ttl
        };
        
        try {
            await this.set(key, JSON.stringify(cacheData), 'EX', ttl);
            
            // Also cache by name for easy lookup
            await this.set(
                `${this.config.keyPrefix}osrs:name:${itemName.toLowerCase().replace(/\s+/g, '_')}`,
                itemId.toString(),
                'EX', ttl
            );
            
            console.log(`💾 Cached OSRS ${itemName} for ${ttl}s`);
            return true;
        } catch (error) {
            console.error(`Failed to cache OSRS item ${itemName}:`, error);
            return false;
        }
    }
    
    /**
     * Get OSRS price by item ID or name
     */
    async getOSRSPrice(identifier) {
        if (!this.connected) return null;
        
        try {
            let itemId = identifier;
            
            // If identifier is not a number, try to find by name
            if (isNaN(identifier)) {
                const nameKey = `${this.config.keyPrefix}osrs:name:${identifier.toLowerCase().replace(/\s+/g, '_')}`;
                itemId = await this.get(nameKey);
                if (!itemId) return null;
            }
            
            const key = `${this.config.keyPrefix}osrs:${itemId}`;
            const data = await this.get(key);
            
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            const age = Date.now() - parsed.cached_at;
            
            return {
                ...parsed,
                cache_age_ms: age,
                cache_age_seconds: Math.floor(age / 1000),
                from_cache: true
            };
        } catch (error) {
            console.error(`Failed to get OSRS price for ${identifier}:`, error);
            return null;
        }
    }
    
    /**
     * Clear all price caches
     */
    async clearCache(pattern = '*') {
        if (!this.connected) return false;
        
        try {
            const keys = await this.keys(`${this.config.keyPrefix}${pattern}`);
            if (keys.length > 0) {
                await this.del(...keys);
                console.log(`🧹 Cleared ${keys.length} cache entries`);
            }
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }
    
    /**
     * Get cache statistics
     */
    async getCacheStats() {
        if (!this.connected) return null;
        
        try {
            const patterns = ['crypto:*', 'gaming:*', 'osrs:*', 'aggregated:*'];
            const stats = {
                total_keys: 0,
                by_category: {},
                oldest_entry: null,
                newest_entry: null
            };
            
            for (const pattern of patterns) {
                const keys = await this.keys(`${this.config.keyPrefix}${pattern}`);
                const category = pattern.split(':')[0];
                stats.by_category[category] = keys.length;
                stats.total_keys += keys.length;
            }
            
            return stats;
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return null;
        }
    }
    
    /**
     * Check if Redis is connected
     */
    isConnected() {
        return this.connected && this.client && this.client.connected;
    }
    
    /**
     * Close Redis connection
     */
    async close() {
        if (this.client) {
            await promisify(this.client.quit).bind(this.client)();
            this.connected = false;
            console.log('Redis connection closed');
        }
    }
}

// Export for use in other modules
module.exports = RedisPriceCache;

// Example usage and testing
if (require.main === module) {
    (async () => {
        const cache = new RedisPriceCache();
        
        try {
            await cache.connect();
            
            // Test caching crypto price
            await cache.cachePrice('BTC', {
                price: 111424,
                currency: 'USD',
                source: 'coingecko'
            });
            
            // Test retrieving cached price
            const btcPrice = await cache.getPrice('BTC');
            console.log('Cached BTC price:', btcPrice);
            
            // Test OSRS price caching
            await cache.cacheOSRSPrice(22486, 'Scythe of Vitur', {
                high: 1589000000,
                low: 1580000000,
                average: 1584500000,
                currency: 'GP'
            });
            
            // Get stats
            const stats = await cache.getCacheStats();
            console.log('Cache statistics:', stats);
            
            // Close connection
            await cache.close();
            
        } catch (error) {
            console.error('Redis test failed:', error);
        }
    })();
}