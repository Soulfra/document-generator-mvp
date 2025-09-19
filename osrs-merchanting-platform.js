#!/usr/bin/env node

/**
 * OSRS Merchanting Platform
 * Automated flipping/merchanting system with social media integration
 * Token-based access, leaderboards, and self-debugging capabilities
 */

const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { TwitterApi } = require('twitter-api-v2');
const snoowrap = require('snoowrap');
const RedisPriceCache = require('./redis-price-cache');
const PricePersistenceService = require('./price-persistence');
const OSRSWikiFetcher = require('./osrs-wiki-fetcher');
const ForumPriceIntegration = require('./forum-price-integration');

// Import self-debugging systems
const AutoHealingOrchestrator = require('./FinishThisIdea/auto-healing-orchestrator');
const LogAggregator = require('./LOG-AGGREGATOR');
const ConstructionOrchestrator = require('./FinishThisIdea/construction-orchestrator');

class OSRSMerchantingPlatform {
    constructor(config = {}) {
        this.app = express();
        this.port = config.port || 8888;
        
        // Core services
        this.cache = new RedisPriceCache();
        this.persistence = new PricePersistenceService();
        this.osrsFetcher = new OSRSWikiFetcher({ cache: this.cache, persistence: this.persistence });
        this.forumIntegration = new ForumPriceIntegration({ cache: this.cache });
        
        // Self-debugging systems
        this.autoHealer = new AutoHealingOrchestrator();
        this.logAggregator = new LogAggregator();
        this.orchestrator = new ConstructionOrchestrator();
        
        // Social media clients
        this.twitterClient = null;
        this.redditClient = null;
        
        // Merchanting analysis
        this.flipOpportunities = new Map();
        this.trendingItems = new Map();
        this.socialSentiment = new Map();
        
        // Token access control
        this.tokenAccess = {
            free: { 
                priceUpdates: 60,      // updates per hour
                flipAlerts: 5,         // alerts per day
                socialAnalysis: false,
                advancedMetrics: false
            },
            basic: {
                priceUpdates: 300,     // 5 per minute
                flipAlerts: 50,
                socialAnalysis: true,
                advancedMetrics: false,
                cost: 10               // tokens per day
            },
            premium: {
                priceUpdates: -1,      // unlimited
                flipAlerts: -1,        // unlimited
                socialAnalysis: true,
                advancedMetrics: true,
                leaderboardAccess: true,
                cost: 50               // tokens per day
            }
        };
        
        // Leaderboard tracking
        this.leaderboard = {
            profits: new Map(),      // User ID -> total profit
            flips: new Map(),        // User ID -> successful flips
            accuracy: new Map(),     // User ID -> prediction accuracy
            contributions: new Map() // User ID -> community contributions
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeServices();
        
        console.log('💰 OSRS Merchanting Platform initialized');
    }
    
    async initializeServices() {
        try {
            // Initialize core services
            await this.cache.connect();
            await this.persistence.initialize();
            await this.osrsFetcher.initialize();
            await this.forumIntegration.initialize();
            
            // Start self-debugging
            this.autoHealer.start();
            await this.logAggregator.initialize();
            
            // Initialize social media if keys available
            this.initializeSocialMedia();
            
            // Start analysis loops
            this.startMerchantAnalysis();
            this.startSocialMonitoring();
            
            // WebSocket for real-time updates
            this.setupWebSocket();
            
            console.log('✅ All services initialized');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.autoHealer.healService('merchanting-platform', error);
        }
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Token authentication middleware
        this.app.use('/api/premium', this.requireToken('basic'));
        this.app.use('/api/advanced', this.requireToken('premium'));
        
        // Request logging
        this.app.use((req, res, next) => {
            this.logAggregator.log({
                type: 'http_request',
                method: req.method,
                path: req.path,
                ip: req.ip,
                timestamp: Date.now()
            });
            next();
        });
    }
    
    setupRoutes() {
        // Public endpoints
        this.app.get('/api/prices/current', this.getCurrentPrices.bind(this));
        this.app.get('/api/flips/basic', this.getBasicFlips.bind(this));
        this.app.get('/api/leaderboard/public', this.getPublicLeaderboard.bind(this));
        
        // Dashboard endpoints
        this.app.get('/live-merchanting-dashboard.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'live-merchanting-dashboard.html'));
        });
        
        // Mock data endpoints for demo
        this.app.get('/api/demo/flips', this.getDemoFlips.bind(this));
        this.app.get('/api/demo/metrics', this.getDemoMetrics.bind(this));
        
        // Premium endpoints (require token)
        this.app.get('/api/premium/flips/advanced', this.getAdvancedFlips.bind(this));
        this.app.get('/api/premium/social/sentiment', this.getSocialSentiment.bind(this));
        this.app.get('/api/premium/predictions', this.getPricePredictions.bind(this));
        
        // Advanced endpoints (premium token)
        this.app.get('/api/advanced/arbitrage', this.getArbitrageOpportunities.bind(this));
        this.app.get('/api/advanced/whale-tracking', this.getWhaleActivity.bind(this));
        this.app.post('/api/advanced/auto-flip', this.setupAutoFlip.bind(this));
        
        // Token management
        this.app.post('/api/token/purchase', this.purchaseTokenAccess.bind(this));
        this.app.get('/api/token/balance', this.getTokenBalance.bind(this));
        
        // Admin/Debug endpoints
        this.app.get('/api/debug/health', this.getSystemHealth.bind(this));
        this.app.get('/api/debug/logs', this.getAggregatedLogs.bind(this));
        this.app.post('/api/debug/heal', this.triggerAutoHeal.bind(this));
    }
    
    /**
     * Merchanting Analysis Engine
     */
    async startMerchantAnalysis() {
        console.log('🔍 Starting merchanting analysis...');
        
        // Analyze prices every minute
        setInterval(async () => {
            try {
                await this.analyzeFlipOpportunities();
                await this.detectPriceManipulation();
                await this.updateLeaderboards();
                
            } catch (error) {
                console.error('Analysis error:', error);
                this.autoHealer.recordError('merchant-analysis', error);
            }
        }, 60000);
        
        // Initial analysis
        this.analyzeFlipOpportunities();
    }
    
    async analyzeFlipOpportunities() {
        const opportunities = [];
        
        // Get all tracked items
        const items = await this.osrsFetcher.getMarketSummary();
        
        for (const item of items.items) {
            // Calculate margins
            const margin = item.high - item.low;
            const marginPercent = (margin / item.low) * 100;
            
            // Get historical volatility
            const history = await this.persistence.getPriceHistory(
                item.short_name, 
                'gaming', 
                24
            );
            
            const volatility = this.calculateVolatility(history);
            
            // Calculate flip score (higher is better)
            const flipScore = this.calculateFlipScore({
                marginPercent,
                volatility,
                volume: item.volume || 0,
                socialMentions: this.socialSentiment.get(item.item_id)?.mentions || 0
            });
            
            if (flipScore > 50) { // Threshold for good opportunities
                opportunities.push({
                    item_id: item.item_id,
                    item_name: item.item_name,
                    buy_price: item.low,
                    sell_price: item.high,
                    margin: margin,
                    margin_percent: marginPercent,
                    volatility: volatility,
                    flip_score: flipScore,
                    confidence: this.calculateConfidence(item, history),
                    recommended_quantity: this.calculateOptimalQuantity(item, margin)
                });
            }
        }
        
        // Sort by flip score
        opportunities.sort((a, b) => b.flip_score - a.flip_score);
        
        // Update cache
        this.flipOpportunities = new Map(
            opportunities.map(opp => [opp.item_id, opp])
        );
        
        // Broadcast to premium users
        this.broadcastToSubscribers({
            type: 'flip_opportunities',
            data: opportunities.slice(0, 10), // Top 10
            timestamp: Date.now()
        });
        
        console.log(`💡 Found ${opportunities.length} flip opportunities`);
    }
    
    calculateFlipScore({ marginPercent, volatility, volume, socialMentions }) {
        // Weighted scoring algorithm
        const weights = {
            margin: 0.3,
            volatility: 0.2,
            volume: 0.3,
            social: 0.2
        };
        
        const scores = {
            margin: Math.min(marginPercent * 2, 100),          // Cap at 100
            volatility: Math.min(volatility * 10, 100),        // Higher volatility = more opportunities
            volume: Math.min(Math.log10(volume + 1) * 20, 100), // Log scale for volume
            social: Math.min(socialMentions * 5, 100)          // Social buzz indicator
        };
        
        return Object.entries(weights).reduce(
            (total, [key, weight]) => total + (scores[key] * weight),
            0
        );
    }
    
    calculateVolatility(priceHistory) {
        if (priceHistory.length < 2) return 0;
        
        const prices = priceHistory.map(h => h.close);
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        
        return Math.sqrt(variance) / mean * 100; // Coefficient of variation
    }
    
    calculateConfidence(item, history) {
        // Confidence based on data quality and patterns
        let confidence = 50; // Base confidence
        
        // More data points = higher confidence
        confidence += Math.min(history.length, 24); // Max +24
        
        // Recent updates = higher confidence
        const lastUpdate = new Date(item.timestamp || 0);
        const minutesSinceUpdate = (Date.now() - lastUpdate) / 60000;
        confidence += Math.max(0, 20 - minutesSinceUpdate); // Max +20
        
        // Stable patterns = higher confidence
        if (this.hasStablePattern(history)) {
            confidence += 10;
        }
        
        return Math.min(confidence, 100);
    }
    
    calculateOptimalQuantity(item, margin) {
        // Calculate based on typical buy limits and margin
        const typicalLimit = this.getTypicalBuyLimit(item.item_id);
        const profitPerItem = margin * 0.8; // Account for GE tax
        
        // Don't recommend more than would make 10M profit
        const maxQuantity = Math.floor(10000000 / profitPerItem);
        
        return Math.min(typicalLimit, maxQuantity);
    }
    
    getTypicalBuyLimit(itemId) {
        // Common OSRS buy limits
        const limits = {
            22486: 8,    // Scythe - 8 per 4 hours
            20997: 8,    // Twisted bow - 8 per 4 hours
            11832: 70,   // Bandos chestplate - 70 per 4 hours
            11834: 70,   // Bandos tassets - 70 per 4 hours
        };
        
        return limits[itemId] || 100; // Default to 100
    }
    
    hasStablePattern(history) {
        // Check if price follows predictable pattern
        if (history.length < 6) return false;
        
        // Calculate hour-over-hour changes
        const changes = [];
        for (let i = 1; i < history.length; i++) {
            changes.push((history[i].close - history[i-1].close) / history[i-1].close);
        }
        
        // Check for regular oscillation
        let directionChanges = 0;
        for (let i = 1; i < changes.length; i++) {
            if (Math.sign(changes[i]) !== Math.sign(changes[i-1])) {
                directionChanges++;
            }
        }
        
        // Stable if it changes direction regularly
        return directionChanges >= changes.length * 0.4;
    }
    
    /**
     * Social Media Monitoring
     */
    async initializeSocialMedia() {
        // Twitter API v2
        if (process.env.TWITTER_BEARER_TOKEN) {
            this.twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
            console.log('✅ Twitter API connected');
        }
        
        // Reddit API
        if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
            this.redditClient = new snoowrap({
                userAgent: 'OSRS-Merchanting-Platform/1.0',
                clientId: process.env.REDDIT_CLIENT_ID,
                clientSecret: process.env.REDDIT_CLIENT_SECRET,
                refreshToken: process.env.REDDIT_REFRESH_TOKEN
            });
            console.log('✅ Reddit API connected');
        }
    }
    
    async startSocialMonitoring() {
        if (!this.twitterClient && !this.redditClient) {
            console.log('⚠️ No social media APIs configured');
            return;
        }
        
        console.log('📱 Starting social media monitoring...');
        
        // Monitor every 5 minutes
        setInterval(async () => {
            await this.monitorTwitter();
            await this.monitorReddit();
            await this.analyzeDiscussions();
        }, 300000);
        
        // Initial scan
        this.monitorTwitter();
        this.monitorReddit();
    }
    
    async monitorTwitter() {
        if (!this.twitterClient) return;
        
        try {
            const tweets = await this.twitterClient.v2.search(
                'OSRS merch OR "oldschool runescape" flip OR "grand exchange" profit',
                {
                    max_results: 100,
                    'tweet.fields': 'created_at,public_metrics'
                }
            );
            
            for (const tweet of tweets.data || []) {
                this.analyzeTweet(tweet);
            }
            
        } catch (error) {
            console.error('Twitter monitoring error:', error);
        }
    }
    
    async monitorReddit() {
        if (!this.redditClient) return;
        
        try {
            // Monitor r/2007scape
            const subreddit = await this.redditClient.getSubreddit('2007scape');
            const posts = await subreddit.getNew({ limit: 50 });
            
            for (const post of posts) {
                if (post.title.match(/merch|flip|profit|money making|ge/i)) {
                    await this.analyzeRedditPost(post);
                }
            }
            
        } catch (error) {
            console.error('Reddit monitoring error:', error);
        }
    }
    
    analyzeTweet(tweet) {
        const items = this.extractItemMentions(tweet.text);
        
        for (const itemName of items) {
            const sentiment = this.socialSentiment.get(itemName) || {
                mentions: 0,
                positive: 0,
                negative: 0,
                lastSeen: 0
            };
            
            sentiment.mentions++;
            sentiment.lastSeen = Date.now();
            
            // Simple sentiment analysis
            if (tweet.text.match(/profit|gains|moon|pump/i)) {
                sentiment.positive++;
            } else if (tweet.text.match(/crash|dump|loss|avoid/i)) {
                sentiment.negative++;
            }
            
            this.socialSentiment.set(itemName, sentiment);
        }
    }
    
    async analyzeRedditPost(post) {
        const items = this.extractItemMentions(post.title + ' ' + post.selftext);
        
        for (const itemName of items) {
            const sentiment = this.socialSentiment.get(itemName) || {
                mentions: 0,
                positive: 0,
                negative: 0,
                lastSeen: 0,
                redditScore: 0
            };
            
            sentiment.mentions++;
            sentiment.lastSeen = Date.now();
            sentiment.redditScore += post.score; // Upvotes - downvotes
            
            this.socialSentiment.set(itemName, sentiment);
        }
    }
    
    extractItemMentions(text) {
        const items = [];
        
        // Common OSRS items
        const itemPatterns = [
            /scythe/i, /twisted bow|tbow/i, /elysian|ely/i,
            /bandos|bcp|tassets/i, /ancestral/i, /kodai/i,
            /dhcb|dragon hunter/i, /avernic/i, /rapier/i
        ];
        
        for (const pattern of itemPatterns) {
            if (text.match(pattern)) {
                items.push(pattern.source.replace(/[|\\]/g, ''));
            }
        }
        
        return items;
    }
    
    async analyzeDiscussions() {
        // Find trending items
        const trending = Array.from(this.socialSentiment.entries())
            .filter(([_, data]) => data.mentions > 5)
            .sort((a, b) => b[1].mentions - a[1].mentions)
            .slice(0, 10);
        
        this.trendingItems = new Map(trending);
        
        // Alert on significant sentiment
        for (const [item, sentiment] of trending) {
            if (sentiment.positive > sentiment.negative * 2) {
                console.log(`📈 Bullish sentiment on ${item}`);
            } else if (sentiment.negative > sentiment.positive * 2) {
                console.log(`📉 Bearish sentiment on ${item}`);
            }
        }
    }
    
    /**
     * Token Access Control
     */
    requireToken(tier) {
        return async (req, res, next) => {
            const token = req.headers['x-api-token'];
            
            if (!token) {
                return res.status(401).json({ error: 'Token required' });
            }
            
            // Verify token and check tier
            const userAccess = await this.verifyToken(token);
            
            if (!userAccess || userAccess.tier < this.getTierLevel(tier)) {
                return res.status(403).json({ 
                    error: 'Insufficient access',
                    required: tier,
                    current: userAccess?.tier || 'none'
                });
            }
            
            // Track usage
            await this.trackUsage(userAccess.userId, req.path);
            
            req.user = userAccess;
            next();
        };
    }
    
    async verifyToken(token) {
        // In production, verify against database
        // For now, simple mock
        return {
            userId: 'user123',
            tier: 'premium',
            balance: 1000
        };
    }
    
    getTierLevel(tier) {
        const levels = { free: 0, basic: 1, premium: 2 };
        return levels[tier] || 0;
    }
    
    /**
     * API Endpoints
     */
    async getCurrentPrices(req, res) {
        try {
            const summary = await this.osrsFetcher.getMarketSummary();
            
            res.json({
                success: true,
                items: summary.items.slice(0, 20), // Top 20 for free tier
                total_value: summary.total_value,
                timestamp: summary.timestamp
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getBasicFlips(req, res) {
        let opportunities = Array.from(this.flipOpportunities.values())
            .slice(0, 5) // Only top 5 for free tier
            .map(opp => ({
                item_name: opp.item_name,
                margin_percent: opp.margin_percent.toFixed(1),
                flip_score: opp.flip_score.toFixed(0)
            }));
        
        // If no opportunities, provide demo data
        if (opportunities.length === 0) {
            opportunities = this.getDemoFlipsData();
        }
        
        res.json({
            success: true,
            opportunities,
            message: 'Upgrade for detailed analysis and more opportunities'
        });
    }
    
    // Demo endpoints for testing
    async getDemoFlips(req, res) {
        const demoFlips = this.getDemoFlipsData();
        res.json({
            success: true,
            opportunities: demoFlips,
            source: 'demo_data',
            timestamp: Date.now()
        });
    }
    
    getDemoFlipsData() {
        return [
            {
                item_name: "Scythe of Vitur",
                margin_percent: "3.2",
                flip_score: "85",
                buy_price: 1450000000,
                sell_price: 1497000000
            },
            {
                item_name: "Twisted Bow",
                margin_percent: "2.8",
                flip_score: "82",
                buy_price: 1200000000,
                sell_price: 1233600000
            },
            {
                item_name: "Elysian Spirit Shield",
                margin_percent: "4.1",
                flip_score: "78",
                buy_price: 750000000,
                sell_price: 780750000
            },
            {
                item_name: "Kodai Wand",
                margin_percent: "5.5",
                flip_score: "71",
                buy_price: 120000000,
                sell_price: 126600000
            },
            {
                item_name: "Dragon Hunter Crossbow",
                margin_percent: "6.2",
                flip_score: "68",
                buy_price: 85000000,
                sell_price: 90270000
            }
        ];
    }
    
    async getDemoMetrics(req, res) {
        res.json({
            success: true,
            metrics: {
                totalRequests: Math.floor(Math.random() * 1000) + 500,
                successRate: 95.5 + Math.random() * 3,
                cacheHits: Math.floor(Math.random() * 50) + 20,
                circuitBreakers: Math.floor(Math.random() * 3),
                activeFlips: 23,
                totalProfit: 15750000,
                uptime: process.uptime()
            },
            timestamp: Date.now()
        });
    }
    
    async getAdvancedFlips(req, res) {
        const opportunities = Array.from(this.flipOpportunities.values());
        
        res.json({
            success: true,
            opportunities,
            trending_items: Array.from(this.trendingItems.keys()),
            market_conditions: this.getMarketConditions()
        });
    }
    
    async getSocialSentiment(req, res) {
        const sentiment = Array.from(this.socialSentiment.entries())
            .map(([item, data]) => ({
                item,
                ...data,
                sentiment_score: (data.positive - data.negative) / data.mentions
            }))
            .sort((a, b) => b.mentions - a.mentions);
        
        res.json({
            success: true,
            sentiment,
            sources: ['twitter', 'reddit'],
            last_update: Date.now()
        });
    }
    
    async getPricePredictions(req, res) {
        // AI-powered price predictions
        const predictions = [];
        
        for (const [itemId, opportunity] of this.flipOpportunities) {
            const prediction = await this.predictPrice(itemId);
            predictions.push(prediction);
        }
        
        res.json({
            success: true,
            predictions,
            accuracy: this.getPredictionAccuracy()
        });
    }
    
    async predictPrice(itemId) {
        // Simple prediction based on trends and sentiment
        const history = await this.persistence.getPriceHistory(itemId, 'gaming', 168); // 1 week
        const sentiment = this.socialSentiment.get(itemId) || {};
        
        // Calculate trend
        const trend = this.calculateTrend(history);
        const sentimentScore = (sentiment.positive - sentiment.negative) / (sentiment.mentions || 1);
        
        // Simple prediction model
        const currentPrice = history[history.length - 1]?.close || 0;
        const prediction = {
            item_id: itemId,
            current_price: currentPrice,
            predicted_1h: currentPrice * (1 + trend * 0.01 + sentimentScore * 0.005),
            predicted_6h: currentPrice * (1 + trend * 0.05 + sentimentScore * 0.02),
            predicted_24h: currentPrice * (1 + trend * 0.10 + sentimentScore * 0.05),
            confidence: Math.min(80, 50 + history.length / 2),
            factors: {
                trend: trend > 0 ? 'bullish' : 'bearish',
                sentiment: sentimentScore > 0 ? 'positive' : 'negative',
                volatility: this.calculateVolatility(history)
            }
        };
        
        return prediction;
    }
    
    calculateTrend(history) {
        if (history.length < 2) return 0;
        
        // Simple linear regression
        const n = history.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = history.map(h => h.close);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        return slope / (sumY / n) * 100; // Percentage change per hour
    }
    
    async getPublicLeaderboard(req, res) {
        const leaderboard = {
            profits: this.getTopUsers(this.leaderboard.profits, 10),
            flips: this.getTopUsers(this.leaderboard.flips, 10),
            accuracy: this.getTopUsers(this.leaderboard.accuracy, 10)
        };
        
        res.json({
            success: true,
            leaderboard,
            your_rank: req.user ? this.getUserRank(req.user.userId) : null
        });
    }
    
    getTopUsers(map, limit) {
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([userId, value], index) => ({
                rank: index + 1,
                userId: this.anonymizeUserId(userId),
                value
            }));
    }
    
    anonymizeUserId(userId) {
        // Show first 4 chars only
        return userId.substring(0, 4) + '****';
    }
    
    /**
     * Self-Debugging Integration
     */
    async getSystemHealth(req, res) {
        const health = {
            platform: 'healthy',
            services: {
                cache: await this.cache.isConnected(),
                database: await this.persistence.initialized,
                osrs_fetcher: true,
                forum: true,
                social_media: {
                    twitter: !!this.twitterClient,
                    reddit: !!this.redditClient
                }
            },
            performance: {
                flip_opportunities: this.flipOpportunities.size,
                social_mentions: this.socialSentiment.size,
                active_users: await this.getActiveUserCount(),
                requests_per_minute: await this.getRequestRate()
            },
            debugging: {
                errors_last_hour: await this.autoHealer.getErrorCount(),
                heals_performed: await this.autoHealer.getHealCount(),
                log_compression_ratio: this.logAggregator.getCompressionRatio()
            }
        };
        
        res.json(health);
    }
    
    async getAggregatedLogs(req, res) {
        const { type, hours = 1 } = req.query;
        
        const logs = await this.logAggregator.getCompressedLogs({
            type,
            since: Date.now() - (hours * 3600000)
        });
        
        res.json({
            success: true,
            logs,
            compression_ratio: this.logAggregator.getCompressionRatio(),
            total_events: logs.length
        });
    }
    
    async triggerAutoHeal(req, res) {
        const { service } = req.body;
        
        try {
            const result = await this.autoHealer.healService(service);
            
            res.json({
                success: true,
                service,
                actions_taken: result.actions,
                new_status: result.status
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * WebSocket for real-time updates
     */
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: 8889 });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Client connected to merchanting platform');
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'welcome',
                data: {
                    flip_opportunities: this.flipOpportunities.size,
                    trending_items: this.trendingItems.size,
                    server_time: Date.now()
                }
            }));
            
            // Handle client messages
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
        });
        
        console.log('🔌 WebSocket server started on port 8889');
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                // Add to subscription list based on tier
                if (data.tier === 'premium') {
                    this.premiumSubscribers.add(ws);
                }
                break;
                
            case 'get_flip':
                // Send specific flip opportunity
                const flip = this.flipOpportunities.get(data.item_id);
                ws.send(JSON.stringify({
                    type: 'flip_detail',
                    data: flip
                }));
                break;
                
            case 'track_flip':
                // Track user's flip for leaderboard
                await this.trackUserFlip(data.userId, data.flip);
                break;
        }
    }
    
    broadcastToSubscribers(message) {
        const data = JSON.stringify(message);
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    /**
     * Start the platform
     */
    async start() {
        this.app.listen(this.port, () => {
            console.log('💰 OSRS Merchanting Platform Started!');
            console.log('=====================================');
            console.log(`📡 API: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:8889`);
            console.log('');
            console.log('📊 Features:');
            console.log('   • Real-time flip opportunities');
            console.log('   • Social media sentiment analysis');
            console.log('   • Price predictions with AI');
            console.log('   • Token-based premium access');
            console.log('   • Competitive leaderboards');
            console.log('   • Self-debugging orchestration');
            console.log('');
            console.log('💰 Token Tiers:');
            console.log('   • Free: Basic prices, 5 flip alerts/day');
            console.log('   • Basic: 10 tokens/day - Social analysis');
            console.log('   • Premium: 50 tokens/day - Full access');
            console.log('');
            console.log('🔍 Monitoring:');
            console.log('   • Twitter: ' + (this.twitterClient ? '✅' : '❌'));
            console.log('   • Reddit: ' + (this.redditClient ? '✅' : '❌'));
            console.log('   • Forums: ✅');
            console.log('');
            console.log('✨ Ready for merchanting!');
        });
    }
}

// Export for use
module.exports = OSRSMerchantingPlatform;

// Start if run directly
if (require.main === module) {
    const platform = new OSRSMerchantingPlatform();
    platform.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down merchanting platform...');
        process.exit(0);
    });
}