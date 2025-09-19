#!/usr/bin/env node

/**
 * Manual Fetch API
 * Provides endpoints for manual price fetching with rate limiting
 */

const express = require('express');
const cors = require('cors');
const RedisPriceCache = require('./redis-price-cache');
const PricePersistenceService = require('./price-persistence');
const OSRSWikiFetcher = require('./osrs-wiki-fetcher');
const axios = require('axios');

class ManualFetchAPI {
    constructor(config = {}) {
        this.app = express();
        this.port = config.port || 3013;
        
        this.cache = config.cache || new RedisPriceCache();
        this.persistence = config.persistence || new PricePersistenceService();
        this.osrsFetcher = config.osrsFetcher || new OSRSWikiFetcher({ cache: this.cache, persistence: this.persistence });
        
        // Rate limiting configuration (per IP)
        this.rateLimits = {
            crypto: { requests: 60, window: 60000 }, // 60 requests per minute
            gaming: { requests: 30, window: 60000 }, // 30 requests per minute
            bulk: { requests: 5, window: 60000 }     // 5 bulk requests per minute
        };
        
        // Track requests per IP
        this.requestTracking = new Map();
        
        // API costs (all currently FREE)
        this.apiCosts = {
            coingecko: { cost: 0, limit: '10-50/min', name: 'CoinGecko (Free)' },
            cryptocompare: { cost: 0, limit: '100k/month', name: 'CryptoCompare (Free)' },
            osrs_wiki: { cost: 0, limit: 'Unlimited', name: 'OSRS Wiki (Free)' },
            binance: { cost: 0, limit: '1200/min', name: 'Binance Public (Free)' },
            kraken: { cost: 0, limit: '60/min', name: 'Kraken Public (Free)' }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🔄 Manual Fetch API initialized');
    }
    
    async initialize() {
        // Initialize services
        if (!this.cache.isConnected()) {
            await this.cache.connect();
        }
        
        if (!this.persistence.initialized) {
            await this.persistence.initialize();
        }
        
        await this.osrsFetcher.initialize();
        
        console.log('✅ Manual Fetch API ready');
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Rate limiting middleware
        this.app.use((req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            
            // Clean up old tracking data
            this.cleanupTracking();
            
            // Track this request
            if (!this.requestTracking.has(ip)) {
                this.requestTracking.set(ip, []);
            }
            
            const requests = this.requestTracking.get(ip);
            requests.push({ timestamp: now, endpoint: req.path });
            
            // Store IP for later use
            req.userIP = ip;
            
            next();
        });
    }
    
    setupRoutes() {
        // Manual fetch single crypto price
        this.app.post('/api/manual/fetch/crypto/:symbol', async (req, res) => {
            const { symbol } = req.params;
            const { force = false } = req.body;
            
            // Check rate limit
            if (!this.checkRateLimit(req.userIP, 'crypto')) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    limit: this.rateLimits.crypto,
                    retry_after: 60
                });
            }
            
            const startTime = Date.now();
            
            try {
                // Check cache first unless forced
                if (!force && this.cache) {
                    const cached = await this.cache.getPrice(symbol.toUpperCase(), 'crypto');
                    if (cached && cached.cache_age_seconds < 60) {
                        return res.json({
                            success: true,
                            data: cached,
                            cost: 0,
                            source: 'cache',
                            response_time: Date.now() - startTime
                        });
                    }
                }
                
                // Fetch fresh data from CoinGecko
                const response = await axios.get(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinGeckoId(symbol)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
                    { timeout: 10000 }
                );
                
                const coinData = response.data[this.getCoinGeckoId(symbol)];
                if (!coinData) {
                    throw new Error('Symbol not found');
                }
                
                const priceData = {
                    symbol: symbol.toUpperCase(),
                    price: coinData.usd,
                    currency: 'USD',
                    change_24h: coinData.usd_24h_change,
                    volume_24h: coinData.usd_24h_vol,
                    source: 'coingecko',
                    timestamp: new Date().toISOString()
                };
                
                // Cache and store
                await this.cache.cachePrice(symbol.toUpperCase(), priceData, 'crypto');
                await this.persistence.storePrice(symbol.toUpperCase(), priceData, 'crypto');
                
                // Track request
                await this.persistence.trackManualFetch({
                    userId: req.headers['x-user-id'] || null,
                    ipAddress: req.userIP,
                    symbol: symbol.toUpperCase(),
                    category: 'crypto',
                    success: true,
                    responseTime: Date.now() - startTime
                });
                
                res.json({
                    success: true,
                    data: priceData,
                    cost: 0,
                    api_used: 'coingecko',
                    api_limits: this.apiCosts.coingecko,
                    response_time: Date.now() - startTime,
                    cached: false
                });
                
            } catch (error) {
                // Track failed request
                await this.persistence.trackManualFetch({
                    userId: req.headers['x-user-id'] || null,
                    ipAddress: req.userIP,
                    symbol: symbol.toUpperCase(),
                    category: 'crypto',
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: error.message
                });
                
                res.status(500).json({
                    success: false,
                    error: error.message,
                    cost: 0,
                    response_time: Date.now() - startTime
                });
            }
        });
        
        // Manual fetch OSRS item price
        this.app.post('/api/manual/fetch/osrs/:itemId', async (req, res) => {
            const { itemId } = req.params;
            const { force = false } = req.body;
            
            // Check rate limit
            if (!this.checkRateLimit(req.userIP, 'gaming')) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    limit: this.rateLimits.gaming,
                    retry_after: 60
                });
            }
            
            const startTime = Date.now();
            
            try {
                // Check cache first unless forced
                if (!force && this.cache) {
                    const cached = await this.cache.getOSRSPrice(itemId);
                    if (cached && cached.cache_age_seconds < 600) { // 10 minutes for OSRS
                        return res.json({
                            success: true,
                            data: cached,
                            cost: 0,
                            source: 'cache',
                            response_time: Date.now() - startTime
                        });
                    }
                }
                
                // Fetch fresh data
                const priceData = await this.osrsFetcher.fetchItemPrice(itemId);
                
                // Track request
                await this.persistence.trackManualFetch({
                    userId: req.headers['x-user-id'] || null,
                    ipAddress: req.userIP,
                    symbol: priceData.short_name,
                    category: 'gaming',
                    success: true,
                    responseTime: Date.now() - startTime
                });
                
                res.json({
                    success: true,
                    data: priceData,
                    cost: 0,
                    api_used: 'osrs_wiki',
                    api_limits: this.apiCosts.osrs_wiki,
                    response_time: Date.now() - startTime,
                    cached: false
                });
                
            } catch (error) {
                await this.persistence.trackManualFetch({
                    userId: req.headers['x-user-id'] || null,
                    ipAddress: req.userIP,
                    symbol: `item_${itemId}`,
                    category: 'gaming',
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: error.message
                });
                
                res.status(500).json({
                    success: false,
                    error: error.message,
                    cost: 0,
                    response_time: Date.now() - startTime
                });
            }
        });
        
        // Bulk fetch multiple prices
        this.app.post('/api/manual/fetch/bulk', async (req, res) => {
            const { symbols = [], force = false } = req.body;
            
            // Check rate limit
            if (!this.checkRateLimit(req.userIP, 'bulk')) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    limit: this.rateLimits.bulk,
                    retry_after: 60
                });
            }
            
            if (symbols.length === 0 || symbols.length > 20) {
                return res.status(400).json({
                    error: 'Please provide 1-20 symbols'
                });
            }
            
            const startTime = Date.now();
            const results = {};
            const errors = [];
            
            // Process each symbol
            for (const symbol of symbols) {
                try {
                    // Determine type (crypto or OSRS)
                    if (typeof symbol === 'number' || /^\d+$/.test(symbol)) {
                        // OSRS item ID
                        results[symbol] = await this.osrsFetcher.fetchItemPrice(symbol);
                    } else {
                        // Crypto symbol
                        const cached = !force ? await this.cache.getPrice(symbol.toUpperCase(), 'crypto') : null;
                        
                        if (cached && cached.cache_age_seconds < 60) {
                            results[symbol] = cached;
                        } else {
                            // Fetch fresh crypto data
                            const response = await axios.get(
                                `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinGeckoId(symbol)}&vs_currencies=usd`,
                                { timeout: 10000 }
                            );
                            
                            const coinData = response.data[this.getCoinGeckoId(symbol)];
                            if (coinData) {
                                const priceData = {
                                    symbol: symbol.toUpperCase(),
                                    price: coinData.usd,
                                    currency: 'USD',
                                    source: 'coingecko',
                                    timestamp: new Date().toISOString()
                                };
                                
                                await this.cache.cachePrice(symbol.toUpperCase(), priceData, 'crypto');
                                results[symbol] = priceData;
                            }
                        }
                    }
                } catch (error) {
                    errors.push({ symbol, error: error.message });
                }
            }
            
            res.json({
                success: true,
                results,
                errors,
                total_cost: 0,
                apis_used: ['coingecko', 'osrs_wiki'],
                response_time: Date.now() - startTime
            });
        });
        
        // Get user's fetch statistics
        this.app.get('/api/manual/stats/:userId?', async (req, res) => {
            const { userId } = req.params;
            
            try {
                const stats = await this.persistence.getManualFetchStats(userId);
                
                res.json({
                    success: true,
                    stats: {
                        ...stats,
                        total_cost: 0, // All APIs are free
                        rate_limits: this.rateLimits,
                        current_usage: this.getUsageForIP(req.userIP)
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get API cost information
        this.app.get('/api/costs', (req, res) => {
            res.json({
                apis: this.apiCosts,
                total_monthly_cost: 0,
                note: 'All APIs currently used are FREE tier',
                recommendations: [
                    'CoinGecko: Best for crypto prices (10-50 req/min free)',
                    'OSRS Wiki: Unlimited requests for game items',
                    'Use caching to minimize API calls',
                    'Bulk requests are more efficient'
                ]
            });
        });
        
        // Clear cache endpoint (admin only)
        this.app.post('/api/manual/cache/clear', async (req, res) => {
            const { pattern = '*', admin_key } = req.body;
            
            // Simple admin check (in production, use proper auth)
            if (admin_key !== process.env.ADMIN_KEY && admin_key !== 'admin123') {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            
            try {
                await this.cache.clearCache(pattern);
                res.json({
                    success: true,
                    message: `Cache cleared for pattern: ${pattern}`
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Health check
        this.app.get('/health', async (req, res) => {
            const cacheStats = await this.cache.getCacheStats();
            const dbStats = await this.persistence.getStats();
            
            res.json({
                status: 'healthy',
                services: {
                    cache: this.cache.isConnected(),
                    database: this.persistence.initialized,
                    osrs_fetcher: true
                },
                cache_stats: cacheStats,
                db_stats: {
                    total_prices: dbStats.total_prices?.[0]?.count || 0,
                    recent_prices: dbStats.recent_prices?.[0]?.count || 0
                },
                uptime: process.uptime()
            });
        });
    }
    
    /**
     * Check rate limit for IP
     */
    checkRateLimit(ip, type) {
        const limit = this.rateLimits[type];
        const now = Date.now();
        const requests = this.requestTracking.get(ip) || [];
        
        // Count requests in the current window
        const recentRequests = requests.filter(r => 
            now - r.timestamp < limit.window
        );
        
        return recentRequests.length < limit.requests;
    }
    
    /**
     * Get current usage for IP
     */
    getUsageForIP(ip) {
        const now = Date.now();
        const requests = this.requestTracking.get(ip) || [];
        const usage = {};
        
        Object.entries(this.rateLimits).forEach(([type, limit]) => {
            const recentRequests = requests.filter(r => 
                now - r.timestamp < limit.window
            );
            
            usage[type] = {
                used: recentRequests.length,
                limit: limit.requests,
                window: limit.window,
                remaining: Math.max(0, limit.requests - recentRequests.length)
            };
        });
        
        return usage;
    }
    
    /**
     * Clean up old tracking data
     */
    cleanupTracking() {
        const now = Date.now();
        const maxAge = 300000; // 5 minutes
        
        this.requestTracking.forEach((requests, ip) => {
            const filtered = requests.filter(r => now - r.timestamp < maxAge);
            
            if (filtered.length === 0) {
                this.requestTracking.delete(ip);
            } else {
                this.requestTracking.set(ip, filtered);
            }
        });
    }
    
    /**
     * Map common symbols to CoinGecko IDs
     */
    getCoinGeckoId(symbol) {
        const mapping = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'XMR': 'monero',
            'SOL': 'solana',
            'BNB': 'binancecoin',
            'ADA': 'cardano',
            'DOT': 'polkadot',
            'MATIC': 'matic-network',
            'AVAX': 'avalanche-2',
            'LINK': 'chainlink'
        };
        
        return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
    }
    
    /**
     * Start the API server
     */
    async start() {
        await this.initialize();
        
        this.app.listen(this.port, () => {
            console.log('🔄 Manual Fetch API Started!');
            console.log('===================================');
            console.log(`📡 API: http://localhost:${this.port}`);
            console.log('');
            console.log('📋 Endpoints:');
            console.log('   POST /api/manual/fetch/crypto/{symbol}');
            console.log('   POST /api/manual/fetch/osrs/{itemId}');
            console.log('   POST /api/manual/fetch/bulk');
            console.log('   GET  /api/manual/stats/{userId}');
            console.log('   GET  /api/costs');
            console.log('');
            console.log('💰 Cost: $0 (All APIs are FREE tier)');
            console.log('⚡ Rate Limits:');
            console.log('   Crypto: 60/min');
            console.log('   Gaming: 30/min');
            console.log('   Bulk: 5/min');
            console.log('');
            console.log('✨ Ready for manual price fetching!');
        });
    }
    
    /**
     * Close connections
     */
    async close() {
        if (this.cache) {
            await this.cache.close();
        }
        
        if (this.persistence) {
            await this.persistence.close();
        }
        
        if (this.osrsFetcher) {
            await this.osrsFetcher.close();
        }
    }
}

// Export for use
module.exports = ManualFetchAPI;

// Start if run directly
if (require.main === module) {
    const api = new ManualFetchAPI();
    api.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await api.close();
        process.exit(0);
    });
}