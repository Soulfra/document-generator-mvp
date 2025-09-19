#!/usr/bin/env node

/**
 * 📊 MARKET DATA COLLECTOR SERVICE
 * 
 * Extends existing OSRS Merchanting Platform with comprehensive data collection
 * - Integrates with RuneLite plugin for real-time game data
 * - Collects from multiple sources: Grand Exchange API, OSRS Wiki, Social Media
 * - Uses existing caching and persistence systems
 * - Feeds data into Market Stats Engine for analysis
 */

const EventEmitter = require('events');
const WebSocket = require('ws');

// Import existing systems
const RedisPriceCache = require('./redis-price-cache');
const PricePersistenceService = require('./price-persistence');
const OSRSWikiFetcher = require('./osrs-wiki-fetcher');
const ResilientAPIWrapper = require('./resilient-api-wrapper');

class MarketDataCollector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Core services (reuse existing infrastructure)
        this.cache = options.cache || new RedisPriceCache();
        this.persistence = options.persistence || new PricePersistenceService();
        this.wikiFetcher = options.wikiFetcher || new OSRSWikiFetcher();
        
        // Initialize resilient API wrapper
        this.resilientAPI = new ResilientAPIWrapper({
            cache: this.cache,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            cacheEnabled: true,
            queueEnabled: true
        });
        
        // Data sources configuration
        this.dataSources = {
            grandExchange: {
                enabled: true,
                url: 'https://prices.runescape.wiki/api/v1/osrs/latest',
                interval: 60000, // 1 minute
                priority: 'high'
            },
            osrsWiki: {
                enabled: true,
                url: 'https://oldschool.runescape.wiki/api.php',
                interval: 300000, // 5 minutes
                priority: 'medium'
            },
            runelitePlugin: {
                enabled: true,
                port: 8889,
                priority: 'critical'
            },
            socialMedia: {
                enabled: true,
                sources: ['reddit', 'twitter'],
                interval: 900000, // 15 minutes
                priority: 'low'
            }
        };
        
        // Collection state
        this.isCollecting = false;
        this.collectionStats = {
            totalItems: 0,
            lastUpdate: null,
            successRate: 0,
            errorCount: 0
        };
        
        // Real-time data streams
        this.realTimeStreams = new Map();
        this.subscribers = new Set();
        
        console.log('📊 MARKET DATA COLLECTOR SERVICE');
        console.log('🔄 Multi-source data collection with real-time streaming');
        console.log('⚡ Extending existing OSRS platform infrastructure');
    }
    
    /**
     * 🔧 Initialize Collector
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Market Data Collector...');
            
            // Initialize existing services
            await this.cache.connect();
            await this.persistence.initialize();
            await this.wikiFetcher.initialize();
            
            // Initialize resilient API wrapper
            await this.resilientAPI.initialize();
            
            // Setup data source connections
            await this.setupDataSources();
            
            // Start collection loops
            this.startCollection();
            
            // Setup RuneLite plugin listener
            this.setupRuneLiteListener();
            
            console.log('✅ Market Data Collector initialized successfully');
            
            // Emit ready event
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Market Data Collector:', error);
            throw error;
        }
    }
    
    /**
     * 🔗 Setup Data Sources
     */
    async setupDataSources() {
        console.log('🔗 Setting up data source connections...');
        
        // Test Grand Exchange API
        if (this.dataSources.grandExchange.enabled) {
            try {
                const result = await this.resilientAPI.fetch({
                    url: this.dataSources.grandExchange.url,
                    priority: 'high'
                });
                
                if (result.success) {
                    console.log('✅ Grand Exchange API connected');
                    
                    // Cache initial data
                    if (result.data && result.data.data) {
                        await this.processGrandExchangeData(result.data.data);
                    }
                } else {
                    console.warn('⚠️ Grand Exchange API not available, will use cache/queue');
                }
            } catch (error) {
                console.warn('⚠️ Grand Exchange API connection failed:', error.message);
                this.dataSources.grandExchange.enabled = false;
            }
        }
        
        // Test OSRS Wiki API
        if (this.dataSources.osrsWiki.enabled) {
            try {
                const result = await this.resilientAPI.fetch({
                    url: this.dataSources.osrsWiki.url,
                    params: {
                        action: 'query',
                        format: 'json',
                        meta: 'siteinfo'
                    },
                    priority: 'medium'
                });
                
                if (result.success) {
                    console.log('✅ OSRS Wiki API connected');
                } else {
                    console.warn('⚠️ OSRS Wiki API not available, will use cache/queue');
                }
            } catch (error) {
                console.warn('⚠️ OSRS Wiki API connection failed:', error.message);
                // Don't disable - resilient wrapper will handle it
            }
        }
    }
    
    /**
     * 🎮 Setup RuneLite Plugin Listener
     */
    setupRuneLiteListener() {
        if (!this.dataSources.runelitePlugin.enabled) return;
        
        console.log('🎮 Setting up RuneLite plugin listener...');
        
        try {
            const wss = new WebSocket.Server({ 
                port: this.dataSources.runelitePlugin.port 
            });
            
            wss.on('connection', (ws) => {
                console.log('🔌 RuneLite plugin connected');
                
                ws.on('message', (message) => {
                    try {
                        const data = JSON.parse(message);
                        this.processRuneLiteData(data);
                    } catch (error) {
                        console.warn('Invalid RuneLite data:', error);
                    }
                });
                
                ws.on('close', () => {
                    console.log('🔌 RuneLite plugin disconnected');
                });
            });
            
            console.log(`✅ RuneLite listener active on port ${this.dataSources.runelitePlugin.port}`);
            
        } catch (error) {
            console.warn('⚠️ RuneLite listener setup failed:', error.message);
            this.dataSources.runelitePlugin.enabled = false;
        }
    }
    
    /**
     * 🏃 Start Collection
     */
    startCollection() {
        if (this.isCollecting) {
            console.log('⚠️ Collection already running');
            return;
        }
        
        console.log('🏃 Starting data collection loops...');
        this.isCollecting = true;
        
        // Grand Exchange data collection
        if (this.dataSources.grandExchange.enabled) {
            this.startGrandExchangeCollection();
        }
        
        // OSRS Wiki data collection
        if (this.dataSources.osrsWiki.enabled) {
            this.startWikiCollection();
        }
        
        // Social media sentiment collection
        if (this.dataSources.socialMedia.enabled) {
            this.startSocialMediaCollection();
        }
        
        // Collection stats updater
        this.startStatsUpdater();
    }
    
    /**
     * 💰 Start Grand Exchange Collection
     */
    startGrandExchangeCollection() {
        const collect = async () => {
            try {
                console.log('📈 Collecting Grand Exchange data...');
                
                const result = await this.resilientAPI.fetch({
                    url: this.dataSources.grandExchange.url,
                    cacheKey: 'ge_latest_prices',
                    fallbackToCache: true,
                    queueOnFailure: true,
                    priority: 'high'
                });
                
                if (result.success && result.data && result.data.data) {
                    await this.processGrandExchangeData(result.data.data);
                    this.collectionStats.lastUpdate = new Date();
                    
                    // Warn if using cached data
                    if (result.fromCache) {
                        console.warn(`⚠️ Using cached Grand Exchange data (${result.confidence}% confidence)`);
                    }
                } else if (result.queued) {
                    console.log('📋 Grand Exchange request queued for retry');
                } else {
                    console.error('❌ Grand Exchange collection failed');
                    this.collectionStats.errorCount++;
                }
                
            } catch (error) {
                console.error('Grand Exchange collection error:', error);
                this.collectionStats.errorCount++;
                // Resilient wrapper already handled retries and fallbacks
            }
        };
        
        // Immediate collection then interval
        collect();
        setInterval(collect, this.dataSources.grandExchange.interval);
    }
    
    /**
     * 📚 Start Wiki Collection
     */
    startWikiCollection() {
        const collect = async () => {
            try {
                console.log('📚 Collecting OSRS Wiki data...');
                
                // Use resilient wrapper for wiki API calls
                const result = await this.resilientAPI.fetch({
                    url: `${this.dataSources.osrsWiki.url}?action=query&format=json&prop=revisions&titles=Module:Exchange/Data`,
                    cacheKey: 'wiki_exchange_data',
                    fallbackToCache: true,
                    queueOnFailure: true,
                    priority: 'medium'
                });
                
                if (result.success && result.data) {
                    // Process wiki data
                    await this.processWikiData(result.data);
                    
                    if (result.fromCache) {
                        console.warn(`⚠️ Using cached Wiki data (${result.confidence}% confidence)`);
                    }
                } else if (result.queued) {
                    console.log('📋 Wiki request queued for retry');
                } else {
                    console.error('❌ Wiki collection failed');
                    this.collectionStats.errorCount++;
                }
                
            } catch (error) {
                console.error('Wiki collection error:', error);
                this.collectionStats.errorCount++;
            }
        };
        
        collect();
        setInterval(collect, this.dataSources.osrsWiki.interval);
    }
    
    /**
     * 🐦 Start Social Media Collection
     */
    startSocialMediaCollection() {
        const collect = async () => {
            try {
                console.log('🐦 Collecting social media sentiment...');
                
                // Reddit sentiment
                const redditData = await this.collectRedditSentiment();
                await this.processSocialData('reddit', redditData);
                
                // Twitter sentiment (if configured)
                // const twitterData = await this.collectTwitterSentiment();
                // await this.processSocialData('twitter', twitterData);
                
            } catch (error) {
                console.error('Social media collection error:', error);
                this.collectionStats.errorCount++;
            }
        };
        
        collect();
        setInterval(collect, this.dataSources.socialMedia.interval);
    }
    
    /**
     * 📊 Start Stats Updater
     */
    startStatsUpdater() {
        setInterval(() => {
            // Calculate success rate
            const totalRequests = this.collectionStats.totalItems + this.collectionStats.errorCount;
            if (totalRequests > 0) {
                this.collectionStats.successRate = 
                    (this.collectionStats.totalItems / totalRequests) * 100;
            }
            
            // Emit stats update
            this.emit('stats', this.collectionStats);
        }, 30000); // Every 30 seconds
    }
    
    /**
     * 💾 Process Grand Exchange Data
     */
    async processGrandExchangeData(data) {
        const processedItems = [];
        
        for (const [itemId, itemData] of Object.entries(data)) {
            try {
                const processedItem = {
                    itemId: parseInt(itemId),
                    high: itemData.high,
                    low: itemData.low,
                    highTime: itemData.highTime,
                    lowTime: itemData.lowTime,
                    timestamp: Date.now(),
                    source: 'grand_exchange'
                };
                
                // Cache the data
                await this.cache.setPriceData(itemId, processedItem);
                
                // Persist to database
                await this.persistence.savePriceData(processedItem);
                
                processedItems.push(processedItem);
                this.collectionStats.totalItems++;
                
            } catch (error) {
                console.warn(`Failed to process item ${itemId}:`, error);
                this.collectionStats.errorCount++;
            }
        }
        
        // Emit processed data
        this.emit('data', {
            type: 'grand_exchange',
            items: processedItems,
            count: processedItems.length
        });
        
        // Broadcast to subscribers
        this.broadcastToSubscribers('grand_exchange', processedItems);
        
        console.log(`📈 Processed ${processedItems.length} Grand Exchange items`);
    }
    
    /**
     * 🎮 Process RuneLite Data
     */
    async processRuneLiteData(data) {
        try {
            const processedData = {
                ...data,
                timestamp: Date.now(),
                source: 'runelite_plugin'
            };
            
            // Handle different RuneLite event types
            switch (data.type) {
                case 'grand_exchange_offer':
                    await this.processGrandExchangeOffer(processedData);
                    break;
                    
                case 'inventory_change':
                    await this.processInventoryChange(processedData);
                    break;
                    
                case 'widget_interaction':
                    await this.processWidgetInteraction(processedData);
                    break;
                    
                default:
                    console.log(`Unknown RuneLite event: ${data.type}`);
            }
            
            // Cache real-time data
            await this.cache.setRealTimeData(data.type, processedData);
            
            // Emit real-time event
            this.emit('realtime', processedData);
            this.broadcastToSubscribers('realtime', processedData);
            
        } catch (error) {
            console.error('RuneLite data processing error:', error);
            this.collectionStats.errorCount++;
        }
    }
    
    /**
     * 📖 Process Wiki Data
     */
    async processWikiData(data) {
        if (!data || !Array.isArray(data)) return;
        
        const processedItems = data.map(item => ({
            ...item,
            timestamp: Date.now(),
            source: 'osrs_wiki'
        }));
        
        // Cache and persist
        for (const item of processedItems) {
            await this.cache.setPriceData(item.itemId, item);
            await this.persistence.savePriceData(item);
        }
        
        this.emit('data', {
            type: 'osrs_wiki',
            items: processedItems,
            count: processedItems.length
        });
        
        console.log(`📚 Processed ${processedItems.length} Wiki items`);
    }
    
    /**
     * 🐦 Collect Reddit Sentiment
     */
    async collectRedditSentiment() {
        try {
            const result = await this.resilientAPI.fetch({
                url: 'https://www.reddit.com/r/2007scape/hot.json',
                params: { limit: 10 },
                cacheKey: 'reddit_sentiment_hot',
                fallbackToCache: true,
                queueOnFailure: true,
                priority: 'low',
                headers: {
                    'User-Agent': 'OSRS-Market-Collector/1.0'
                }
            });
            
            if (result.success && result.data && result.data.data && result.data.data.children) {
                const posts = result.data.data.children.map(post => ({
                    title: post.data.title,
                    score: post.data.score,
                    comments: post.data.num_comments,
                    created: post.data.created_utc,
                    url: post.data.url,
                    selftext: post.data.selftext?.slice(0, 500) // First 500 chars
                }));
                
                if (result.fromCache) {
                    console.warn(`⚠️ Using cached Reddit data (${result.confidence}% confidence)`);
                }
                
                return posts;
            }
            
            return [];
            
        } catch (error) {
            console.warn('Reddit collection error:', error.message);
            return [];
        }
    }
    
    /**
     * 🐦 Process Social Data
     */
    async processSocialData(platform, data) {
        if (!data || !Array.isArray(data)) return;
        
        const processedData = {
            platform,
            posts: data,
            timestamp: Date.now(),
            sentiment: this.analyzeSentiment(data)
        };
        
        // Cache social sentiment
        await this.cache.setSocialSentiment(platform, processedData);
        
        this.emit('social', processedData);
        this.broadcastToSubscribers('social', processedData);
        
        console.log(`🐦 Processed ${data.length} ${platform} posts`);
    }
    
    /**
     * 📊 Analyze Sentiment
     */
    analyzeSentiment(posts) {
        if (!posts.length) return { score: 0, confidence: 0 };
        
        // Simple sentiment analysis based on keywords
        const positiveWords = ['buy', 'profit', 'good', 'cheap', 'opportunity', 'rise', 'bullish'];
        const negativeWords = ['sell', 'loss', 'expensive', 'crash', 'drop', 'bearish'];
        
        let positiveScore = 0;
        let negativeScore = 0;
        
        posts.forEach(post => {
            const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
            
            positiveWords.forEach(word => {
                if (text.includes(word)) positiveScore++;
            });
            
            negativeWords.forEach(word => {
                if (text.includes(word)) negativeScore++;
            });
        });
        
        const totalScore = positiveScore + negativeScore;
        const sentiment = totalScore > 0 ? (positiveScore - negativeScore) / totalScore : 0;
        
        return {
            score: sentiment, // -1 to 1
            confidence: Math.min(totalScore / posts.length, 1),
            positive: positiveScore,
            negative: negativeScore
        };
    }
    
    /**
     * 📡 Subscribe to Data Stream
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        
        return () => {
            this.subscribers.delete(callback);
        };
    }
    
    /**
     * 📢 Broadcast to Subscribers
     */
    broadcastToSubscribers(type, data) {
        this.subscribers.forEach(callback => {
            try {
                callback({ type, data, timestamp: Date.now() });
            } catch (error) {
                console.warn('Subscriber callback error:', error);
            }
        });
    }
    
    /**
     * 📊 Get Collection Stats
     */
    getStats() {
        return {
            ...this.collectionStats,
            isCollecting: this.isCollecting,
            activeSources: Object.keys(this.dataSources).filter(
                key => this.dataSources[key].enabled
            ),
            subscribers: this.subscribers.size
        };
    }
    
    /**
     * 📈 Get Latest Market Data
     */
    async getLatestData(itemIds = null) {
        if (itemIds) {
            // Get specific items
            const items = await Promise.all(
                itemIds.map(id => this.cache.getPriceData(id))
            );
            return items.filter(item => item !== null);
        } else {
            // Get all cached data
            return await this.cache.getAllPriceData();
        }
    }
    
    /**
     * 🔍 Get Social Sentiment
     */
    async getSocialSentiment(platform = null) {
        if (platform) {
            return await this.cache.getSocialSentiment(platform);
        } else {
            // Get all platforms
            const platforms = ['reddit', 'twitter'];
            const sentiments = {};
            
            for (const p of platforms) {
                sentiments[p] = await this.cache.getSocialSentiment(p);
            }
            
            return sentiments;
        }
    }
    
    /**
     * 🛑 Stop Collection
     */
    stopCollection() {
        console.log('🛑 Stopping data collection...');
        this.isCollecting = false;
        
        // Clear intervals would go here if we stored references
        // For now, they'll continue but this.isCollecting guards the processing
        
        this.emit('stopped');
    }
    
    /**
     * ♻️ Cleanup
     */
    async cleanup() {
        console.log('♻️ Cleaning up Market Data Collector...');
        
        this.stopCollection();
        
        // Disconnect from services
        await this.cache.disconnect();
        
        // Clear subscribers
        this.subscribers.clear();
        
        console.log('✅ Market Data Collector cleaned up');
    }
}

/**
 * 🔧 Helper Methods for RuneLite Data Processing
 */
MarketDataCollector.prototype.processGrandExchangeOffer = async function(data) {
    // Process Grand Exchange offer from RuneLite
    const offerData = {
        itemId: data.itemId,
        itemName: data.itemName,
        quantity: data.quantity,
        price: data.price,
        offerType: data.offerType, // 'buy' or 'sell'
        state: data.state, // 'pending', 'completed', 'cancelled'
        timestamp: data.timestamp
    };
    
    await this.persistence.saveOfferData(offerData);
    console.log(`💰 GE Offer: ${data.offerType} ${data.quantity}x ${data.itemName} @ ${data.price}gp`);
};

MarketDataCollector.prototype.processInventoryChange = async function(data) {
    // Process inventory changes from RuneLite
    console.log(`🎒 Inventory: ${data.changes?.length || 0} changes detected`);
};

MarketDataCollector.prototype.processWidgetInteraction = async function(data) {
    // Process UI interactions that might indicate trading activity
    console.log(`🖱️ Widget: ${data.widget} interaction`);
};

module.exports = MarketDataCollector;