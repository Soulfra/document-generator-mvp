#!/usr/bin/env node

/**
 * Global Ranking & API Gateway System
 * 
 * Converts high usage into API access tiers:
 * - Bronze: Basic rate limits
 * - Silver: Enhanced limits
 * - Gold: Premium access
 * - Platinum: Internal API layer
 * - Diamond: Infrastructure partner
 * 
 * Rankings based on total system stress generated!
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const http = require('http');
const WebSocket = require('ws');

class GlobalRankingAPIGateway extends EventEmitter {
    constructor() {
        super();
        
        this.gatewayId = `GRAG-${Date.now()}`;
        
        // Ranking tiers with API access levels
        this.rankingTiers = {
            bronze: {
                minScore: 0,
                rateLimit: 100, // requests per minute
                endpoints: ['public'],
                color: '\x1b[33m',
                perks: ['basic_access', 'public_leaderboard']
            },
            silver: {
                minScore: 10000,
                rateLimit: 1000,
                endpoints: ['public', 'advanced'],
                color: '\x1b[37m',
                perks: ['enhanced_limits', 'priority_queue', 'analytics_dashboard']
            },
            gold: {
                minScore: 100000,
                rateLimit: 10000,
                endpoints: ['public', 'advanced', 'premium'],
                color: '\x1b[93m',
                perks: ['premium_endpoints', 'bulk_operations', 'websocket_streams']
            },
            platinum: {
                minScore: 1000000,
                rateLimit: 100000,
                endpoints: ['public', 'advanced', 'premium', 'internal'],
                color: '\x1b[96m',
                perks: ['internal_api_access', 'custom_endpoints', 'dedicated_support']
            },
            diamond: {
                minScore: 10000000,
                rateLimit: Infinity,
                endpoints: ['all'],
                color: '\x1b[95m',
                perks: ['infrastructure_partner', 'revenue_sharing', 'whitelist_access', 'api_governance']
            }
        };
        
        // Global leaderboards
        this.leaderboards = {
            // Main leaderboard - total stress score
            totalStress: new Map(),
            
            // Specialized leaderboards
            peakRPS: new Map(),          // Highest RPS achieved
            sustainedLoad: new Map(),    // Longest high-load session
            rareCollector: new Map(),    // Most rare items collected
            clueHunter: new Map(),       // Most clues completed
            hackAttempts: new Map(),     // Most hacking attempts
            partyLeader: new Map(),      // Best collaborative scores
            
            // Time-based leaderboards
            daily: new Map(),
            weekly: new Map(),
            monthly: new Map(),
            allTime: new Map()
        };
        
        // API Gateway configuration
        this.apiGateway = {
            endpoints: {
                // Public endpoints
                public: {
                    '/api/status': { method: 'GET', description: 'System status' },
                    '/api/leaderboard': { method: 'GET', description: 'View rankings' },
                    '/api/user/:id': { method: 'GET', description: 'User profile' }
                },
                
                // Advanced endpoints
                advanced: {
                    '/api/analytics': { method: 'GET', description: 'Usage analytics' },
                    '/api/load/generate': { method: 'POST', description: 'Generate load' },
                    '/api/clue/start': { method: 'POST', description: 'Start clue scroll' }
                },
                
                // Premium endpoints
                premium: {
                    '/api/market/prices': { method: 'GET', description: 'Real-time market data' },
                    '/api/infrastructure/status': { method: 'GET', description: 'Infrastructure health' },
                    '/api/batch': { method: 'POST', description: 'Batch operations' }
                },
                
                // Internal endpoints (the golden goose!)
                internal: {
                    '/internal/database/query': { method: 'POST', description: 'Direct DB access' },
                    '/internal/cache/manipulate': { method: 'POST', description: 'Cache control' },
                    '/internal/loadbalancer/config': { method: 'GET', description: 'LB configuration' },
                    '/internal/autoscale/trigger': { method: 'POST', description: 'Force autoscaling' },
                    '/internal/revenue/stats': { method: 'GET', description: 'Revenue analytics' }
                }
            },
            
            // Rate limiter
            rateLimiter: new Map(),
            
            // API keys
            apiKeys: new Map(),
            
            // Revenue tracking
            revenue: {
                apiCalls: 0,
                revenueGenerated: 0,
                partnerShares: new Map()
            }
        };
        
        // Stress scoring system
        this.scoringSystem = {
            // Action multipliers
            actions: {
                request: 1,               // Per request
                sustainedLoad: 10,        // Per minute of high load
                peakRPS: 100,           // Per 100 RPS milestone
                rareItemDrop: 1000,      // Per rare item
                clueComplete: 5000,      // Per clue completed
                hackAttempt: 100,        // Per hack attempt
                successfulHack: 50000,   // If you actually hack us
                partyBonus: 2.0          // Multiplier for group activities
            },
            
            // Time decay (recent activity worth more)
            timeDecay: {
                last24h: 1.0,
                last7d: 0.7,
                last30d: 0.5,
                older: 0.3
            }
        };
        
        // User registry
        this.users = new Map();
        
        // Infrastructure impact tracking
        this.infrastructureImpact = {
            totalRequestsHandled: 0,
            peakConcurrentUsers: 0,
            autoscaleEvents: 0,
            downtime: 0,
            costGenerated: 0
        };
        
        // Partner companies
        this.partners = new Map();
        
        this.initialize();
    }
    
    initialize() {
        console.log('🏆 GLOBAL RANKING & API GATEWAY INITIALIZING...\n');
        
        // Initialize leaderboards
        this.initializeLeaderboards();
        
        // Start API gateway
        this.startAPIGateway();
        
        // Start ranking calculator
        this.startRankingCalculator();
        
        // Start revenue calculator
        this.startRevenueTracking();
        
        console.log('✅ Gateway ready - Generate stress to climb ranks!\n');
        
        this.emit('gateway_initialized');
    }
    
    initializeLeaderboards() {
        // Initialize with some legendary players
        const legends = [
            { id: 'Zezima', score: 50000000, tier: 'diamond' },
            { id: 'The_Old_Nite', score: 25000000, tier: 'diamond' },
            { id: 'Lynx_Titan', score: 15000000, tier: 'diamond' }
        ];
        
        legends.forEach(legend => {
            this.leaderboards.totalStress.set(legend.id, legend.score);
            this.leaderboards.allTime.set(legend.id, legend.score);
        });
        
        console.log(`🏆 Initialized leaderboards with ${legends.length} legendary players`);
    }
    
    startAPIGateway() {
        const server = http.createServer((req, res) => {
            this.handleAPIRequest(req, res);
        });
        
        server.listen(8888, () => {
            console.log('🌐 API Gateway listening on port 8888');
        });
        
        // WebSocket for real-time leaderboard updates
        const wss = new WebSocket.Server({ port: 8889 });
        
        wss.on('connection', (ws) => {
            console.log('📊 New connection to leaderboard stream');
            
            // Send initial leaderboard state
            ws.send(JSON.stringify({
                type: 'leaderboard_init',
                data: this.getLeaderboardSnapshot()
            }));
            
            // Subscribe to updates
            this.on('leaderboard_update', (data) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'leaderboard_update',
                        data
                    }));
                }
            });
        });
    }
    
    async handleAPIRequest(req, res) {
        const apiKey = req.headers['x-api-key'];
        const userId = req.headers['x-user-id'];
        
        // Check API key
        const keyData = this.apiKeys.get(apiKey);
        if (!keyData) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid API key' }));
            return;
        }
        
        // Check rate limit
        if (!this.checkRateLimit(userId, keyData.tier)) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Rate limit exceeded',
                tier: keyData.tier,
                limit: this.rankingTiers[keyData.tier].rateLimit
            }));
            return;
        }
        
        // Check endpoint access
        const endpoint = req.url.split('?')[0];
        const hasAccess = this.checkEndpointAccess(endpoint, keyData.tier);
        
        if (!hasAccess) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Insufficient tier for this endpoint',
                required: this.getRequiredTier(endpoint),
                current: keyData.tier
            }));
            return;
        }
        
        // Track API usage
        this.trackAPIUsage(userId, endpoint, keyData.tier);
        
        // Route to appropriate handler
        try {
            const response = await this.routeAPIRequest(req, endpoint, userId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    checkRateLimit(userId, tier) {
        const limit = this.rankingTiers[tier].rateLimit;
        const key = `${userId}-${Math.floor(Date.now() / 60000)}`; // Per minute
        
        const current = this.apiGateway.rateLimiter.get(key) || 0;
        
        if (current >= limit) {
            return false;
        }
        
        this.apiGateway.rateLimiter.set(key, current + 1);
        
        // Clean old entries
        if (this.apiGateway.rateLimiter.size > 10000) {
            const cutoff = Date.now() - 60000;
            for (const [k, v] of this.apiGateway.rateLimiter) {
                const timestamp = parseInt(k.split('-')[1]) * 60000;
                if (timestamp < cutoff) {
                    this.apiGateway.rateLimiter.delete(k);
                }
            }
        }
        
        return true;
    }
    
    checkEndpointAccess(endpoint, tier) {
        const allowedEndpoints = this.rankingTiers[tier].endpoints;
        
        if (allowedEndpoints.includes('all')) return true;
        
        for (const level of allowedEndpoints) {
            const endpoints = Object.keys(this.apiGateway.endpoints[level] || {});
            if (endpoints.some(e => endpoint.startsWith(e.replace(':id', '')))) {
                return true;
            }
        }
        
        return false;
    }
    
    getRequiredTier(endpoint) {
        for (const [level, endpoints] of Object.entries(this.apiGateway.endpoints)) {
            if (Object.keys(endpoints).some(e => endpoint.startsWith(e.replace(':id', '')))) {
                // Find minimum tier that has this level
                for (const [tier, config] of Object.entries(this.rankingTiers)) {
                    if (config.endpoints.includes(level)) {
                        return tier;
                    }
                }
            }
        }
        return 'unknown';
    }
    
    trackAPIUsage(userId, endpoint, tier) {
        this.apiGateway.revenue.apiCalls++;
        
        // Calculate revenue based on endpoint value
        let value = 0.001; // Base value per call
        
        if (endpoint.startsWith('/internal')) value = 0.1;
        else if (endpoint.startsWith('/api/batch')) value = 0.05;
        else if (endpoint.startsWith('/api/market')) value = 0.02;
        
        this.apiGateway.revenue.revenueGenerated += value;
        
        // Track partner revenue share
        if (tier === 'diamond') {
            const share = value * 0.1; // 10% revenue share
            const current = this.apiGateway.revenue.partnerShares.get(userId) || 0;
            this.apiGateway.revenue.partnerShares.set(userId, current + share);
        }
        
        // Update user's API usage score
        this.updateUserScore(userId, 'api_usage', 1);
    }
    
    async routeAPIRequest(req, endpoint, userId) {
        // Simplified routing for demo
        switch (endpoint) {
            case '/api/status':
                return this.getSystemStatus();
            
            case '/api/leaderboard':
                return this.getLeaderboardSnapshot();
            
            case '/api/user':
                return this.getUserProfile(userId);
            
            case '/internal/revenue/stats':
                return this.getRevenueStats();
            
            default:
                return { message: 'Endpoint under construction', endpoint };
        }
    }
    
    // User registration and scoring
    registerUser(userId, initialData = {}) {
        if (this.users.has(userId)) {
            return this.users.get(userId);
        }
        
        const user = {
            id: userId,
            registeredAt: Date.now(),
            score: 0,
            tier: 'bronze',
            apiKey: this.generateAPIKey(),
            stats: {
                totalRequests: 0,
                peakRPS: 0,
                totalLoadTime: 0,
                rareItems: 0,
                cluesCompleted: 0,
                hackAttempts: 0,
                partyParticipations: 0
            },
            achievements: [],
            ...initialData
        };
        
        this.users.set(userId, user);
        this.apiGateway.apiKeys.set(user.apiKey, { userId, tier: user.tier });
        
        console.log(`👤 Registered user: ${userId}`);
        console.log(`   API Key: ${user.apiKey}`);
        console.log(`   Starting Tier: ${user.tier}`);
        
        return user;
    }
    
    generateAPIKey() {
        return `GRAND-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    }
    
    updateUserScore(userId, action, value = 1) {
        const user = this.users.get(userId);
        if (!user) return;
        
        // Calculate score based on action
        const baseScore = this.scoringSystem.actions[action] || 1;
        const timeMultiplier = this.getTimeMultiplier();
        const scoreGain = Math.floor(baseScore * value * timeMultiplier);
        
        user.score += scoreGain;
        
        // Update stats
        switch (action) {
            case 'request':
                user.stats.totalRequests += value;
                break;
            case 'peakRPS':
                user.stats.peakRPS = Math.max(user.stats.peakRPS, value);
                break;
            case 'rareItemDrop':
                user.stats.rareItems += value;
                break;
            case 'clueComplete':
                user.stats.cluesCompleted += value;
                break;
            case 'hackAttempt':
                user.stats.hackAttempts += value;
                break;
        }
        
        // Check for tier upgrade
        this.checkTierUpgrade(user);
        
        // Update leaderboards
        this.updateLeaderboards(userId, user.score, action);
        
        return scoreGain;
    }
    
    getTimeMultiplier() {
        // Recent activity worth more
        const hour = new Date().getHours();
        
        // Peak hours bonus (6pm - 2am)
        if (hour >= 18 || hour <= 2) {
            return 1.5;
        }
        
        return 1.0;
    }
    
    checkTierUpgrade(user) {
        const oldTier = user.tier;
        let newTier = 'bronze';
        
        // Find highest tier user qualifies for
        for (const [tier, config] of Object.entries(this.rankingTiers)) {
            if (user.score >= config.minScore) {
                newTier = tier;
            }
        }
        
        if (newTier !== oldTier) {
            user.tier = newTier;
            this.apiGateway.apiKeys.get(user.apiKey).tier = newTier;
            
            console.log(`\n🎉 TIER UPGRADE: ${user.id} promoted to ${newTier.toUpperCase()}!`);
            console.log(`   New rate limit: ${this.rankingTiers[newTier].rateLimit} req/min`);
            console.log(`   Unlocked: ${this.rankingTiers[newTier].endpoints.join(', ')} endpoints`);
            
            // Award achievement
            user.achievements.push({
                name: `${newTier}_tier_reached`,
                timestamp: Date.now()
            });
            
            // Special message for diamond tier
            if (newTier === 'diamond') {
                console.log(`\n💎 WELCOME TO THE DIAMOND CLUB, ${user.id}!`);
                console.log(`   You are now an infrastructure partner!`);
                console.log(`   Revenue sharing activated!`);
                console.log(`   Unlimited API access granted!`);
                
                this.partners.set(user.id, {
                    joinedAt: Date.now(),
                    revenueShare: 0.1
                });
            }
            
            this.emit('tier_upgrade', { userId: user.id, oldTier, newTier });
        }
    }
    
    updateLeaderboards(userId, score, action) {
        // Update main leaderboard
        this.leaderboards.totalStress.set(userId, score);
        
        // Update specialized leaderboards based on action
        switch (action) {
            case 'peakRPS':
                const currentPeak = this.leaderboards.peakRPS.get(userId) || 0;
                this.leaderboards.peakRPS.set(userId, Math.max(currentPeak, score));
                break;
            case 'rareItemDrop':
                const currentRare = this.leaderboards.rareCollector.get(userId) || 0;
                this.leaderboards.rareCollector.set(userId, currentRare + 1);
                break;
            case 'clueComplete':
                const currentClues = this.leaderboards.clueHunter.get(userId) || 0;
                this.leaderboards.clueHunter.set(userId, currentClues + 1);
                break;
        }
        
        // Update time-based leaderboards
        const dailyScore = this.leaderboards.daily.get(userId) || 0;
        this.leaderboards.daily.set(userId, dailyScore + (score - dailyScore) * 0.1);
        
        // Emit update event
        this.emit('leaderboard_update', {
            userId,
            score,
            rank: this.getUserRank(userId)
        });
    }
    
    getUserRank(userId) {
        const sorted = Array.from(this.leaderboards.totalStress.entries())
            .sort(([,a], [,b]) => b - a);
        
        const index = sorted.findIndex(([id]) => id === userId);
        return index + 1;
    }
    
    startRankingCalculator() {
        // Periodic rank recalculation
        setInterval(() => {
            this.recalculateRanks();
            this.cleanupOldData();
        }, 30000); // Every 30 seconds
        
        // Daily reset
        setInterval(() => {
            this.performDailyReset();
        }, 86400000); // Every 24 hours
    }
    
    recalculateRanks() {
        // Sort all leaderboards
        for (const [name, leaderboard] of Object.entries(this.leaderboards)) {
            if (leaderboard instanceof Map) {
                const sorted = Array.from(leaderboard.entries())
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 1000); // Keep top 1000
                
                this.leaderboards[name] = new Map(sorted);
            }
        }
    }
    
    cleanupOldData() {
        // Clean up old rate limit entries
        const cutoff = Date.now() - 300000; // 5 minutes
        
        for (const [key] of this.apiGateway.rateLimiter) {
            const timestamp = parseInt(key.split('-')[1]) * 60000;
            if (timestamp < cutoff) {
                this.apiGateway.rateLimiter.delete(key);
            }
        }
    }
    
    performDailyReset() {
        console.log('\n🌅 DAILY RESET - New day, new opportunities!');
        
        // Archive daily scores
        const dailyWinner = Array.from(this.leaderboards.daily.entries())
            .sort(([,a], [,b]) => b - a)[0];
        
        if (dailyWinner) {
            console.log(`   Daily winner: ${dailyWinner[0]} with ${dailyWinner[1]} points!`);
            
            // Award daily winner bonus
            const user = this.users.get(dailyWinner[0]);
            if (user) {
                user.achievements.push({
                    name: 'daily_winner',
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }
        
        // Reset daily leaderboard
        this.leaderboards.daily.clear();
        
        this.emit('daily_reset', { winner: dailyWinner });
    }
    
    startRevenueTracking() {
        setInterval(() => {
            if (this.apiGateway.revenue.revenueGenerated > 1000) {
                console.log(`\n💰 REVENUE MILESTONE: $${this.apiGateway.revenue.revenueGenerated.toFixed(2)} generated!`);
                
                // Distribute partner shares
                this.distributePartnerRevenue();
                
                // Reset counter
                this.apiGateway.revenue.revenueGenerated = 0;
            }
        }, 60000); // Every minute
    }
    
    distributePartnerRevenue() {
        this.apiGateway.revenue.partnerShares.forEach((share, userId) => {
            if (share > 0) {
                console.log(`   💎 ${userId} earned $${share.toFixed(2)} in revenue share`);
                
                const user = this.users.get(userId);
                if (user) {
                    user.earnings = (user.earnings || 0) + share;
                }
            }
        });
        
        // Clear shares after distribution
        this.apiGateway.revenue.partnerShares.clear();
    }
    
    // Public API methods
    getSystemStatus() {
        return {
            gateway: {
                id: this.gatewayId,
                uptime: Date.now() - this.startTime,
                totalUsers: this.users.size,
                totalAPICalls: this.apiGateway.revenue.apiCalls,
                revenueGenerated: this.apiGateway.revenue.revenueGenerated
            },
            infrastructure: this.infrastructureImpact,
            tiers: Object.entries(this.rankingTiers).map(([tier, config]) => ({
                tier,
                minScore: config.minScore,
                rateLimit: config.rateLimit,
                userCount: Array.from(this.users.values()).filter(u => u.tier === tier).length
            })),
            partners: this.partners.size
        };
    }
    
    getLeaderboardSnapshot() {
        return {
            totalStress: this.topN(this.leaderboards.totalStress, 100),
            peakRPS: this.topN(this.leaderboards.peakRPS, 20),
            rareCollector: this.topN(this.leaderboards.rareCollector, 20),
            clueHunter: this.topN(this.leaderboards.clueHunter, 20),
            daily: this.topN(this.leaderboards.daily, 50)
        };
    }
    
    topN(leaderboard, n) {
        return Array.from(leaderboard.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, n)
            .map(([userId, score], index) => ({
                rank: index + 1,
                userId,
                score,
                tier: this.users.get(userId)?.tier || 'unknown'
            }));
    }
    
    getUserProfile(userId) {
        const user = this.users.get(userId);
        if (!user) return null;
        
        return {
            ...user,
            rank: this.getUserRank(userId),
            leaderboardPositions: {
                totalStress: this.getPosition(userId, this.leaderboards.totalStress),
                peakRPS: this.getPosition(userId, this.leaderboards.peakRPS),
                rareCollector: this.getPosition(userId, this.leaderboards.rareCollector),
                clueHunter: this.getPosition(userId, this.leaderboards.clueHunter)
            },
            nextTier: this.getNextTier(user.tier),
            progressToNext: this.calculateProgress(user.score, user.tier)
        };
    }
    
    getPosition(userId, leaderboard) {
        const sorted = Array.from(leaderboard.entries())
            .sort(([,a], [,b]) => b - a);
        
        const index = sorted.findIndex(([id]) => id === userId);
        return index === -1 ? null : index + 1;
    }
    
    getNextTier(currentTier) {
        const tiers = Object.keys(this.rankingTiers);
        const currentIndex = tiers.indexOf(currentTier);
        
        if (currentIndex === tiers.length - 1) {
            return null; // Already at max tier
        }
        
        return tiers[currentIndex + 1];
    }
    
    calculateProgress(score, tier) {
        const currentMin = this.rankingTiers[tier].minScore;
        const nextTier = this.getNextTier(tier);
        
        if (!nextTier) return 100;
        
        const nextMin = this.rankingTiers[nextTier].minScore;
        const progress = ((score - currentMin) / (nextMin - currentMin)) * 100;
        
        return Math.min(100, Math.max(0, progress));
    }
    
    getRevenueStats() {
        return {
            totalAPICalls: this.apiGateway.revenue.apiCalls,
            revenueGenerated: this.apiGateway.revenue.revenueGenerated,
            topPartners: Array.from(this.apiGateway.revenue.partnerShares.entries())
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10),
            projectedMonthly: this.apiGateway.revenue.revenueGenerated * 30 * 24 * 60,
            infrastructureCost: this.infrastructureImpact.costGenerated,
            netProfit: this.apiGateway.revenue.revenueGenerated - this.infrastructureImpact.costGenerated
        };
    }
}

// Export the system
module.exports = GlobalRankingAPIGateway;

// Run if called directly
if (require.main === module) {
    const gateway = new GlobalRankingAPIGateway();
    gateway.startTime = Date.now();
    
    // Register demo users
    const demoUsers = [
        gateway.registerUser('LoadMaster', { score: 50000 }),
        gateway.registerUser('StressKing', { score: 150000 }),
        gateway.registerUser('APIHammer', { score: 500000 }),
        gateway.registerUser('DiamondHands', { score: 15000000 })
    ];
    
    // Simulate activity
    setInterval(() => {
        demoUsers.forEach(user => {
            // Random actions
            if (Math.random() < 0.3) {
                gateway.updateUserScore(user.id, 'request', Math.floor(Math.random() * 1000));
            }
            if (Math.random() < 0.1) {
                gateway.updateUserScore(user.id, 'peakRPS', Math.floor(Math.random() * 5000));
            }
            if (Math.random() < 0.05) {
                gateway.updateUserScore(user.id, 'rareItemDrop', 1);
            }
        });
    }, 2000);
    
    // Display status
    setInterval(() => {
        console.clear();
        console.log('🏆 GLOBAL RANKING & API GATEWAY');
        console.log('=' .repeat(70));
        
        const status = gateway.getSystemStatus();
        const leaderboard = gateway.getLeaderboardSnapshot();
        
        console.log('\n📊 SYSTEM STATUS:');
        console.log(`   Total Users: ${status.gateway.totalUsers}`);
        console.log(`   API Calls: ${status.gateway.totalAPICalls}`);
        console.log(`   Revenue: $${status.gateway.revenueGenerated.toFixed(2)}`);
        console.log(`   Partners: ${status.partners}`);
        
        console.log('\n🎖️ TIER DISTRIBUTION:');
        status.tiers.forEach(tier => {
            const color = gateway.rankingTiers[tier.tier].color;
            console.log(`   ${color}${tier.tier.toUpperCase()}\x1b[0m: ${tier.userCount} users (${tier.minScore}+ score, ${tier.rateLimit} RPM)`);
        });
        
        console.log('\n🏆 TOP STRESS GENERATORS:');
        leaderboard.totalStress.slice(0, 10).forEach(entry => {
            const color = gateway.rankingTiers[entry.tier].color;
            console.log(`   ${entry.rank}. ${color}${entry.userId}\x1b[0m - ${entry.score.toLocaleString()} points`);
        });
        
        console.log('\n💎 ACCESS LEVELS:');
        console.log('   BRONZE: Public endpoints only');
        console.log('   SILVER: + Advanced analytics');
        console.log('   GOLD: + Premium features');
        console.log('   PLATINUM: + Internal API access');
        console.log('   DIAMOND: Full partner access + revenue share');
        
        console.log('\n🚀 GENERATE MORE STRESS TO CLIMB THE RANKS!');
        
        console.log('\n' + '=' .repeat(70));
    }, 3000);
    
    console.log('🏆 Global Ranking & API Gateway started!');
    console.log('🌐 API Gateway on port 8888');
    console.log('📊 Leaderboard stream on port 8889\n');
}