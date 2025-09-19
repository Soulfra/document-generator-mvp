#!/usr/bin/env node

/**
 * 🔮 REAL-TIME DATA ORACLE SYSTEM
 * 
 * Unified data fetching system with tiered access control
 * - Free users: 5-minute cached data or demo data
 * - Paid users: 10-second cached data  
 * - Premium users: Real-time data with no caching
 * 
 * Supports multiple data sources:
 * - Sports: ESPN, TheScore
 * - Crypto: CoinGecko, Binance, CoinMarketCap
 * - Stocks: Polygon, AlphaVantage
 */

const EventEmitter = require('events');
const axios = require('axios');
const Redis = require('redis');

// Import data sources
const ESPNDataSource = require('./data-sources/espn-client');
const CoinGeckoDataSource = require('./data-sources/coingecko-client');
const BinanceDataSource = require('./data-sources/binance-client');
const CoinMarketCapDataSource = require('./data-sources/coinmarketcap-client');

class RealTimeDataOracle extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Initialize configuration
        this.config = {
            redis: config.redis || { url: process.env.REDIS_URL || 'redis://localhost:6379' },
            database: config.database || { url: process.env.DATABASE_URL },
            ...config
        };
        
        // Initialize data sources
        this.sources = {
            sports: {
                espn: new ESPNDataSource({
                    apiKey: process.env.ESPN_API_KEY,
                    rateLimit: { requests: 100, window: 60000 }
                }),
                theScore: null // Placeholder for future implementation
            },
            crypto: {
                coingecko: new CoinGeckoDataSource({
                    apiKey: process.env.COINGECKO_API_KEY,
                    rateLimit: { requests: 50, window: 60000 }
                }),
                binance: new BinanceDataSource({
                    apiKey: process.env.BINANCE_API_KEY,
                    apiSecret: process.env.BINANCE_SECRET,
                    rateLimit: { requests: 1200, window: 60000 }
                }),
                coinmarketcap: new CoinMarketCapDataSource({
                    apiKey: process.env.COINMARKETCAP_API_KEY,
                    rateLimit: { requests: 30, window: 60000 }
                })
            },
            stocks: {
                polygon: null, // Placeholder
                alphavantage: null // Placeholder
            }
        };
        
        // Initialize tiered cache
        this.cache = new TieredCache({
            free: { ttl: 300, maxSize: 1000 },      // 5 min cache for free users
            paid: { ttl: 10, maxSize: 10000 },      // 10 sec cache for paid users
            premium: { ttl: 0, maxSize: 100000 }    // No cache for premium users
        });
        
        // Initialize rate limiter
        this.rateLimiter = new RateLimiter();
        
        // Track data quality metrics
        this.metrics = {
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
            fallbacks: 0,
            errors: 0
        };
        
        // Initialize Redis client
        this.initializeRedis();
        
        console.log('🔮 Real-Time Data Oracle initialized');
    }
    
    async initializeRedis() {
        this.redis = Redis.createClient(this.config.redis);
        
        this.redis.on('error', (err) => {
            console.error('Redis error:', err);
        });
        
        this.redis.on('connect', () => {
            console.log('📡 Connected to Redis cache');
        });
        
        await this.redis.connect();
    }
    
    /**
     * Get data with tier-based access control
     */
    async getData(userId, dataType, ticker, options = {}) {
        try {
            // Get user tier
            const userTier = await this.getUserTier(userId);
            
            // Log request
            this.emit('data_request', {
                userId,
                userTier,
                dataType,
                ticker,
                timestamp: Date.now()
            });
            
            // Route based on tier
            switch (userTier) {
                case 'premium':
                    return await this.getRealTimeData(dataType, ticker, options);
                    
                case 'paid':
                    return await this.getCachedData(dataType, ticker, { 
                        ...options, 
                        maxAge: 10 
                    });
                    
                case 'free':
                default:
                    // Try cache first, then demo data
                    const cached = await this.getCachedData(dataType, ticker, { 
                        ...options, 
                        maxAge: 300 
                    });
                    
                    if (!cached || this.isDataStale(cached, 300)) {
                        return await this.getDemoData(dataType, ticker, options);
                    }
                    
                    return cached;
            }
        } catch (error) {
            console.error('Data fetch error:', error);
            this.metrics.errors++;
            
            // Fallback to demo data on error
            return await this.getDemoData(dataType, ticker, options);
        }
    }
    
    /**
     * Get real-time data from primary sources
     */
    async getRealTimeData(dataType, ticker, options = {}) {
        this.metrics.apiCalls++;
        
        const [category, source] = dataType.split('/');
        const dataSource = this.sources[category]?.[source];
        
        if (!dataSource) {
            throw new Error(`Unknown data source: ${dataType}`);
        }
        
        // Check rate limits
        if (!await this.rateLimiter.checkLimit(dataType)) {
            throw new Error('Rate limit exceeded');
        }
        
        // Fetch real data
        const data = await dataSource.getData(ticker, options);
        
        // Cache the result
        await this.cacheData(dataType, ticker, data, 'realtime');
        
        // Emit event
        this.emit('data_fetched', {
            type: 'realtime',
            dataType,
            ticker,
            source: dataSource.name,
            timestamp: Date.now()
        });
        
        return {
            ...data,
            quality: 'realtime',
            cached: false,
            timestamp: Date.now()
        };
    }
    
    /**
     * Get cached data
     */
    async getCachedData(dataType, ticker, options = {}) {
        const cacheKey = this.getCacheKey(dataType, ticker);
        
        try {
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {
                const data = JSON.parse(cached);
                
                // Check if data is within maxAge
                const age = Date.now() - data.timestamp;
                if (options.maxAge && age > options.maxAge * 1000) {
                    this.metrics.cacheMisses++;
                    return null;
                }
                
                this.metrics.cacheHits++;
                
                return {
                    ...data,
                    quality: 'cached',
                    cached: true,
                    cacheAge: age
                };
            }
        } catch (error) {
            console.error('Cache retrieval error:', error);
        }
        
        this.metrics.cacheMisses++;
        
        // Try to fetch fresh data
        return await this.getRealTimeData(dataType, ticker, options);
    }
    
    /**
     * Get demo/simulated data
     */
    async getDemoData(dataType, ticker, options = {}) {
        this.metrics.fallbacks++;
        
        const [category] = dataType.split('/');
        
        let demoData;
        switch (category) {
            case 'crypto':
                demoData = this.generateCryptoDemoData(ticker);
                break;
                
            case 'sports':
                demoData = this.generateSportsDemoData(ticker);
                break;
                
            case 'stocks':
                demoData = this.generateStockDemoData(ticker);
                break;
                
            default:
                throw new Error(`Unknown data category: ${category}`);
        }
        
        return {
            ...demoData,
            quality: 'demo',
            cached: false,
            timestamp: Date.now(),
            warning: 'This is demo data. Subscribe for real-time access.'
        };
    }
    
    /**
     * Cache data with TTL based on tier
     */
    async cacheData(dataType, ticker, data, tier) {
        const cacheKey = this.getCacheKey(dataType, ticker);
        const ttl = this.cache.config[tier]?.ttl || 300;
        
        if (ttl > 0) {
            try {
                await this.redis.setEx(
                    cacheKey,
                    ttl,
                    JSON.stringify({
                        ...data,
                        cachedAt: Date.now()
                    })
                );
            } catch (error) {
                console.error('Cache storage error:', error);
            }
        }
    }
    
    /**
     * Get user tier from database
     */
    async getUserTier(userId) {
        // TODO: Implement actual database lookup
        // For now, return based on userId pattern
        if (userId.includes('premium')) return 'premium';
        if (userId.includes('paid')) return 'paid';
        return 'free';
    }
    
    /**
     * Check if data is stale
     */
    isDataStale(data, maxAgeSeconds) {
        const age = Date.now() - data.timestamp;
        return age > maxAgeSeconds * 1000;
    }
    
    /**
     * Generate cache key
     */
    getCacheKey(dataType, ticker) {
        return `oracle:${dataType}:${ticker}`.toLowerCase();
    }
    
    /**
     * Generate demo crypto data
     */
    generateCryptoDemoData(ticker) {
        const basePrice = {
            bitcoin: 50000,
            ethereum: 3000,
            solana: 100,
            dogecoin: 0.1
        }[ticker.toLowerCase()] || 100;
        
        // Add some realistic variation
        const variation = (Math.random() - 0.5) * 0.1; // ±5%
        const price = basePrice * (1 + variation);
        
        return {
            ticker,
            price: parseFloat(price.toFixed(2)),
            change24h: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
            volume24h: Math.floor(Math.random() * 1000000000),
            marketCap: Math.floor(price * 1000000000),
            source: 'demo'
        };
    }
    
    /**
     * Generate demo sports data
     */
    generateSportsDemoData(ticker) {
        const [sport, teamId] = ticker.split(':');
        
        return {
            sport,
            teamId,
            score: {
                home: Math.floor(Math.random() * 10),
                away: Math.floor(Math.random() * 10)
            },
            period: Math.floor(Math.random() * 9) + 1,
            timeRemaining: `${Math.floor(Math.random() * 20)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            source: 'demo'
        };
    }
    
    /**
     * Generate demo stock data
     */
    generateStockDemoData(ticker) {
        const basePrice = 100 + Math.random() * 400;
        
        return {
            ticker,
            price: parseFloat(basePrice.toFixed(2)),
            change: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
            changePercent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
            volume: Math.floor(Math.random() * 10000000),
            source: 'demo'
        };
    }
    
    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
            errorRate: this.metrics.errors / this.metrics.apiCalls || 0
        };
    }
}

/**
 * Tiered Cache Manager
 */
class TieredCache {
    constructor(config) {
        this.config = config;
        this.stats = {
            free: { hits: 0, misses: 0 },
            paid: { hits: 0, misses: 0 },
            premium: { hits: 0, misses: 0 }
        };
    }
    
    updateStats(tier, hit) {
        if (hit) {
            this.stats[tier].hits++;
        } else {
            this.stats[tier].misses++;
        }
    }
}

/**
 * Rate Limiter
 */
class RateLimiter {
    constructor() {
        this.limits = new Map();
    }
    
    async checkLimit(dataType) {
        const now = Date.now();
        const limit = this.limits.get(dataType) || { count: 0, resetAt: now + 60000 };
        
        if (now > limit.resetAt) {
            limit.count = 0;
            limit.resetAt = now + 60000;
        }
        
        if (limit.count >= 100) { // Default limit
            return false;
        }
        
        limit.count++;
        this.limits.set(dataType, limit);
        return true;
    }
}

module.exports = RealTimeDataOracle;

// Auto-start if run directly
if (require.main === module) {
    const oracle = new RealTimeDataOracle();
    
    // Example usage
    (async () => {
        console.log('\n📊 Testing Real-Time Data Oracle...\n');
        
        // Test different user tiers
        const tests = [
            { userId: 'free_user_123', dataType: 'crypto/coingecko', ticker: 'bitcoin' },
            { userId: 'paid_user_456', dataType: 'crypto/binance', ticker: 'ethereum' },
            { userId: 'premium_user_789', dataType: 'sports/espn', ticker: 'mlb:nyy' }
        ];
        
        for (const test of tests) {
            try {
                const data = await oracle.getData(test.userId, test.dataType, test.ticker);
                console.log(`✅ ${test.userId} - ${test.ticker}:`, data);
            } catch (error) {
                console.error(`❌ ${test.userId} - Error:`, error.message);
            }
        }
        
        console.log('\n📈 Metrics:', oracle.getMetrics());
    })();
}