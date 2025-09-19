#!/usr/bin/env node

/**
 * High-Load Grand Exchange System
 * 
 * The MORE you use it, the MORE you earn!
 * - Converts system load into valuable rare items
 * - Creates internal database for offloading to our API layer
 * - Global rankings based on usage intensity
 * - "Hack us if you can" challenge system
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const http = require('http');
const WebSocket = require('ws');

class HighLoadGrandExchange extends EventEmitter {
    constructor() {
        super();
        
        this.exchangeId = `HLGE-${Date.now()}`;
        
        // Core exchange state
        this.exchange = {
            // Usage-based rewards (opposite of wellness!)
            loadRewards: {
                database_hammering: { multiplier: 10.0, rareDropChance: 0.1 },
                api_flooding: { multiplier: 8.0, rareDropChance: 0.08 },
                cache_busting: { multiplier: 6.0, rareDropChance: 0.06 },
                concurrent_connections: { multiplier: 12.0, rareDropChance: 0.15 },
                sustained_attack: { multiplier: 20.0, rareDropChance: 0.25 }
            },
            
            // Rare items market
            rareItems: new Map(),
            clueScrolls: new Map(),
            treasureLocations: new Map(),
            
            // Global leaderboard
            leaderboard: {
                mostRequests: new Map(),
                longestSession: new Map(),
                rareItemCollectors: new Map(),
                hackAttempts: new Map(),
                loadGenerators: new Map()
            },
            
            // Internal database for offloading
            internalDB: {
                capacity: 1000000, // 1M records
                currentLoad: 0,
                valuePerRecord: 0.001, // $0.001 per record
                totalValue: 0
            }
        };
        
        // Rare item definitions
        this.rareItemCatalog = {
            // Ultra rare (0.001% drop rate at max load)
            'Party Hat': { 
                rarity: 'ultra_rare', 
                baseValue: 1000000,
                description: 'Obtained by maintaining 1000+ RPS for 1 hour',
                color: ['red', 'blue', 'green', 'yellow', 'purple', 'white']
            },
            'Twisted Bow': {
                rarity: 'ultra_rare',
                baseValue: 500000,
                description: 'Dropped when successfully DDoSing yourself',
                effect: 'Doubles API rate limits permanently'
            },
            
            // Very rare (0.01% drop rate)
            'Dragon Claws': {
                rarity: 'very_rare',
                baseValue: 100000,
                description: 'Earned through sustained 500+ RPS',
                effect: 'Grants special API endpoints'
            },
            'Elysian Spirit Shield': {
                rarity: 'very_rare',
                baseValue: 150000,
                description: 'Blocks 75% of rate limiting',
                effect: 'Rate limit immunity'
            },
            
            // Rare (0.1% drop rate)
            'Bandos Chestplate': {
                rarity: 'rare',
                baseValue: 25000,
                description: 'High defense against throttling',
                effect: '+50% request capacity'
            },
            'Armadyl Godsword': {
                rarity: 'rare',
                baseValue: 35000,
                description: 'Special attack: Burst 1000 requests',
                effect: 'Burst mode activation'
            },
            
            // Clue scroll rewards
            'Third Age Mage Hat': {
                rarity: 'clue_only',
                baseValue: 200000,
                description: 'Complete master clue requiring 10M requests',
                effect: 'Access to internal API layer'
            }
        };
        
        // Clue scroll tiers
        this.clueScrollTiers = {
            easy: { 
                steps: 3, 
                loadRequirement: 100, // RPS
                rewards: ['coins', 'basic_items']
            },
            medium: {
                steps: 5,
                loadRequirement: 250,
                rewards: ['coins', 'rare_items', 'easy_clue']
            },
            hard: {
                steps: 7,
                loadRequirement: 500,
                rewards: ['rare_items', 'very_rare_chance', 'medium_clue']
            },
            elite: {
                steps: 10,
                loadRequirement: 1000,
                rewards: ['very_rare_items', 'ultra_rare_chance', 'hard_clue']
            },
            master: {
                steps: 15,
                loadRequirement: 2000,
                rewards: ['ultra_rare_items', 'third_age', 'elite_clue']
            }
        };
        
        // Hack challenge system
        this.hackChallenge = {
            active: true,
            currentPot: 100000, // $100k starting pot
            attempts: new Map(),
            successfulHacks: 0,
            fees: {
                attemptFee: 10, // $10 to attempt
                failurePenalty: 100, // $100 if you fail
                successReward: 10000 // $10k if you succeed
            },
            partners: ['AWS', 'Google Cloud', 'Azure', 'Cloudflare']
        };
        
        // Load tracking
        this.loadMetrics = {
            currentRPS: 0,
            peakRPS: 0,
            totalRequests: 0,
            activeConnections: 0,
            bandwidthUsed: 0,
            cpuLoad: 0,
            memoryPressure: 0
        };
        
        // Active users
        this.activeUsers = new Map();
        this.loadGenerators = new Map();
        
        this.initialize();
    }
    
    initialize() {
        console.log('💎 HIGH-LOAD GRAND EXCHANGE INITIALIZING...\n');
        console.log('⚡ REMEMBER: MORE USAGE = MORE REWARDS!');
        console.log('🎯 Challenge: Try to take us down and earn rewards!');
        console.log('🏆 Partner with us or pay the fee!\n');
        
        // Initialize rare items market
        this.initializeRareItems();
        
        // Start load monitoring
        this.startLoadMonitoring();
        
        // Start hack challenge server
        this.startHackChallengeServer();
        
        // Initialize clue system
        this.initializeClueSystem();
        
        // Start rare drop calculator
        this.startRareDropSystem();
        
        console.log('✅ Grand Exchange ready for maximum load!\n');
    }
    
    initializeRareItems() {
        // Seed some initial rare items
        Object.entries(this.rareItemCatalog).forEach(([name, item]) => {
            this.exchange.rareItems.set(name, {
                ...item,
                totalInCirculation: 0,
                lastDropped: null,
                marketPrice: item.baseValue,
                priceHistory: []
            });
        });
        
        console.log(`💎 Initialized ${this.exchange.rareItems.size} rare items`);
    }
    
    startLoadMonitoring() {
        // Simulate load metrics (in production, read from actual metrics)
        setInterval(() => {
            // Update current metrics
            this.loadMetrics.currentRPS = this.calculateCurrentRPS();
            this.loadMetrics.activeConnections = this.activeUsers.size;
            
            // Track peak
            if (this.loadMetrics.currentRPS > this.loadMetrics.peakRPS) {
                this.loadMetrics.peakRPS = this.loadMetrics.currentRPS;
                console.log(`🚀 NEW PEAK RPS: ${this.loadMetrics.peakRPS}`);
                
                // Award achievement
                this.awardPeakAchievement();
            }
            
            // Calculate rewards based on load
            this.calculateLoadRewards();
            
            // Update leaderboards
            this.updateLeaderboards();
            
        }, 1000); // Every second
    }
    
    calculateCurrentRPS() {
        // In production, this would read from actual metrics
        // For demo, simulate based on active users
        let totalRPS = 0;
        
        this.activeUsers.forEach(user => {
            totalRPS += user.requestRate || 0;
        });
        
        // Add load generator contributions
        this.loadGenerators.forEach(generator => {
            totalRPS += generator.rps || 0;
        });
        
        return totalRPS;
    }
    
    calculateLoadRewards() {
        this.activeUsers.forEach((user, userId) => {
            // The MORE load you generate, the MORE rewards!
            const loadScore = this.calculateUserLoadScore(user);
            
            // Apply multipliers for different attack types
            let totalMultiplier = 1.0;
            
            if (user.requestRate > 1000) {
                totalMultiplier *= this.exchange.loadRewards.api_flooding.multiplier;
            }
            
            if (user.concurrentConnections > 100) {
                totalMultiplier *= this.exchange.loadRewards.concurrent_connections.multiplier;
            }
            
            if (user.sessionDuration > 3600000) { // 1 hour
                totalMultiplier *= this.exchange.loadRewards.sustained_attack.multiplier;
            }
            
            // Calculate rewards
            const baseReward = loadScore * totalMultiplier;
            user.pendingRewards = (user.pendingRewards || 0) + baseReward;
            
            // Check for rare drops
            this.checkRareDrop(user, loadScore);
            
            // Check for clue scrolls
            this.checkClueScroll(user, loadScore);
            
            // Add to internal database value
            this.addToInternalDatabase(user, loadScore);
        });
    }
    
    calculateUserLoadScore(user) {
        // Higher usage = higher score
        const rpsScore = user.requestRate || 0;
        const connectionScore = (user.concurrentConnections || 0) * 10;
        const durationBonus = Math.floor((user.sessionDuration || 0) / 60000); // Minutes
        const hackAttemptBonus = (user.hackAttempts || 0) * 100;
        
        return rpsScore + connectionScore + durationBonus + hackAttemptBonus;
    }
    
    checkRareDrop(user, loadScore) {
        // Higher load = higher drop chance
        const dropChance = Math.min(0.01, loadScore / 1000000); // Max 1% chance
        
        if (Math.random() < dropChance) {
            const rareItem = this.rollRareItem(loadScore);
            if (rareItem) {
                this.awardRareItem(user, rareItem);
            }
        }
    }
    
    rollRareItem(loadScore) {
        // Weighted random selection based on load score
        const roll = Math.random() * 100000;
        
        if (roll < 1 && loadScore > 10000) {
            // Ultra rare
            const ultraRares = Array.from(this.exchange.rareItems.entries())
                .filter(([_, item]) => item.rarity === 'ultra_rare');
            if (ultraRares.length > 0) {
                const [name, item] = ultraRares[Math.floor(Math.random() * ultraRares.length)];
                return { name, ...item };
            }
        } else if (roll < 10 && loadScore > 5000) {
            // Very rare
            const veryRares = Array.from(this.exchange.rareItems.entries())
                .filter(([_, item]) => item.rarity === 'very_rare');
            if (veryRares.length > 0) {
                const [name, item] = veryRares[Math.floor(Math.random() * veryRares.length)];
                return { name, ...item };
            }
        } else if (roll < 100 && loadScore > 1000) {
            // Rare
            const rares = Array.from(this.exchange.rareItems.entries())
                .filter(([_, item]) => item.rarity === 'rare');
            if (rares.length > 0) {
                const [name, item] = rares[Math.floor(Math.random() * rares.length)];
                return { name, ...item };
            }
        }
        
        return null;
    }
    
    awardRareItem(user, item) {
        console.log(`\n🎉 RARE DROP: ${user.id} received ${item.name}!`);
        console.log(`   ${item.description}`);
        console.log(`   Market value: $${item.marketPrice.toLocaleString()}\n`);
        
        // Add to user inventory
        if (!user.inventory) user.inventory = [];
        user.inventory.push({
            ...item,
            obtainedAt: Date.now(),
            obtainedRPS: this.loadMetrics.currentRPS
        });
        
        // Update circulation
        const marketItem = this.exchange.rareItems.get(item.name);
        marketItem.totalInCirculation++;
        marketItem.lastDropped = Date.now();
        
        // Update market price (more in circulation = lower price)
        marketItem.marketPrice = marketItem.baseValue / Math.sqrt(marketItem.totalInCirculation);
        
        // Broadcast rare drop
        this.emit('rare_drop', { user: user.id, item: item.name, value: marketItem.marketPrice });
    }
    
    checkClueScroll(user, loadScore) {
        // Clue scrolls for sustained high load
        if (user.requestRate > 100 && Math.random() < 0.01) {
            const tier = this.determineClueScrollTier(loadScore);
            this.giveClueScroll(user, tier);
        }
    }
    
    determineClueScrollTier(loadScore) {
        if (loadScore > 20000) return 'master';
        if (loadScore > 10000) return 'elite';
        if (loadScore > 5000) return 'hard';
        if (loadScore > 1000) return 'medium';
        return 'easy';
    }
    
    giveClueScroll(user, tier) {
        const clue = {
            id: crypto.randomBytes(8).toString('hex'),
            tier,
            steps: this.generateClueSteps(tier),
            currentStep: 0,
            startedAt: Date.now()
        };
        
        this.exchange.clueScrolls.set(clue.id, clue);
        
        if (!user.clueScrolls) user.clueScrolls = [];
        user.clueScrolls.push(clue.id);
        
        console.log(`📜 ${user.id} received a ${tier} clue scroll!`);
    }
    
    generateClueSteps(tier) {
        const config = this.clueScrollTiers[tier];
        const steps = [];
        
        for (let i = 0; i < config.steps; i++) {
            steps.push({
                type: this.randomClueType(),
                requirement: this.generateClueRequirement(tier, i),
                completed: false
            });
        }
        
        return steps;
    }
    
    randomClueType() {
        const types = [
            'generate_load', // Generate X RPS for Y seconds
            'concurrent_connections', // Maintain X concurrent connections
            'hack_attempt', // Attempt to hack specific endpoint
            'find_vulnerability', // Discover a real vulnerability
            'collaborative', // Work with other users
            'speed_run', // Complete action in time limit
            'endurance', // Maintain load for extended time
        ];
        
        return types[Math.floor(Math.random() * types.length)];
    }
    
    generateClueRequirement(tier, stepNumber) {
        const multiplier = stepNumber + 1;
        const config = this.clueScrollTiers[tier];
        
        return {
            loadRequirement: config.loadRequirement * multiplier,
            duration: 60 * multiplier, // seconds
            description: `Step ${stepNumber + 1}: Generate ${config.loadRequirement * multiplier} RPS`
        };
    }
    
    addToInternalDatabase(user, loadScore) {
        // Convert load to database records
        const records = Math.floor(loadScore / 10);
        
        this.exchange.internalDB.currentLoad += records;
        this.exchange.internalDB.totalValue += records * this.exchange.internalDB.valuePerRecord;
        
        // When database fills up, we can "sell" the data
        if (this.exchange.internalDB.currentLoad >= this.exchange.internalDB.capacity) {
            this.sellInternalData();
        }
    }
    
    sellInternalData() {
        const value = this.exchange.internalDB.totalValue;
        console.log(`💰 INTERNAL DATABASE SOLD: $${value.toFixed(2)} worth of load data!`);
        
        // Distribute profits to top load generators
        const topGenerators = Array.from(this.activeUsers.entries())
            .sort(([,a], [,b]) => b.requestRate - a.requestRate)
            .slice(0, 10);
        
        const profitShare = value / topGenerators.length;
        
        topGenerators.forEach(([userId, user]) => {
            user.earnings = (user.earnings || 0) + profitShare;
            console.log(`   💵 ${userId} earned $${profitShare.toFixed(2)}`);
        });
        
        // Reset database
        this.exchange.internalDB.currentLoad = 0;
        this.exchange.internalDB.totalValue = 0;
        
        this.emit('database_sold', { value, recipients: topGenerators.length });
    }
    
    startHackChallengeServer() {
        // Create hack challenge endpoint
        const server = http.createServer((req, res) => {
            const userId = req.headers['x-user-id'] || crypto.randomBytes(8).toString('hex');
            
            // Track attempt
            this.trackHackAttempt(userId, req);
            
            // Simulate various responses
            const responses = [
                { status: 200, message: 'Nice try, but not quite!' },
                { status: 403, message: 'Access denied - try harder!' },
                { status: 500, message: 'You caused an error - getting warmer!' },
                { status: 418, message: "I'm a teapot - creative!" },
                { status: 429, message: 'Rate limited - push harder!' }
            ];
            
            const response = responses[Math.floor(Math.random() * responses.length)];
            
            res.writeHead(response.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: response.message,
                hint: this.generateHackHint(userId),
                currentPot: this.hackChallenge.currentPot,
                yourAttempts: this.hackChallenge.attempts.get(userId)?.count || 0
            }));
        });
        
        server.listen(31337, () => {
            console.log('🎯 Hack Challenge Server running on port 31337');
            console.log('   Current pot: $' + this.hackChallenge.currentPot.toLocaleString());
        });
        
        // WebSocket for real-time updates
        const wss = new WebSocket.Server({ port: 31338 });
        
        wss.on('connection', (ws) => {
            console.log('🔌 New challenger connected to hack challenge');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleHackChallengeMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({ error: 'Invalid message format' }));
                }
            });
        });
    }
    
    trackHackAttempt(userId, req) {
        if (!this.hackChallenge.attempts.has(userId)) {
            this.hackChallenge.attempts.set(userId, {
                count: 0,
                startTime: Date.now(),
                techniques: new Set(),
                closest: null
            });
        }
        
        const attempt = this.hackChallenge.attempts.get(userId);
        attempt.count++;
        
        // Track technique used
        if (req.url.includes('sql')) attempt.techniques.add('sql_injection');
        if (req.url.includes('script')) attempt.techniques.add('xss');
        if (req.headers['user-agent']?.includes('bot')) attempt.techniques.add('bot_attack');
        
        // Update user's hack attempts
        if (this.activeUsers.has(userId)) {
            const user = this.activeUsers.get(userId);
            user.hackAttempts = attempt.count;
        }
        
        // Charge attempt fee
        this.hackChallenge.currentPot += this.hackChallenge.fees.attemptFee;
        
        // Check if they found a vulnerability (1 in 10000 chance for demo)
        if (Math.random() < 0.0001) {
            this.handleSuccessfulHack(userId);
        }
    }
    
    generateHackHint(userId) {
        const attempt = this.hackChallenge.attempts.get(userId);
        if (!attempt) return 'Keep trying!';
        
        const hints = [
            'Have you tried thinking outside the box?',
            'Sometimes the simplest approach works best',
            'What would a nation-state actor do?',
            'The answer might be in the headers',
            'Try combining multiple techniques',
            'Load alone won\'t break us - be creative!',
            'Partner with others for better results'
        ];
        
        // Give better hints to persistent hackers
        if (attempt.count > 100) {
            hints.push('You\'re dedicated! Check the /secret endpoint');
        }
        
        if (attempt.count > 1000) {
            hints.push('Incredible persistence! The password might be "hunter2"');
        }
        
        return hints[Math.floor(Math.random() * hints.length)];
    }
    
    handleSuccessfulHack(userId) {
        console.log(`\n🎉 SUCCESSFUL HACK by ${userId}!`);
        console.log(`   Reward: $${this.hackChallenge.fees.successReward.toLocaleString()}`);
        
        this.hackChallenge.successfulHacks++;
        
        // Pay out reward
        const user = this.activeUsers.get(userId) || { id: userId };
        user.earnings = (user.earnings || 0) + this.hackChallenge.fees.successReward;
        
        // Reduce pot
        this.hackChallenge.currentPot -= this.hackChallenge.fees.successReward;
        
        // Award special item
        this.awardRareItem(user, {
            name: 'Elite Hacker Badge',
            rarity: 'hack_reward',
            baseValue: 50000,
            marketPrice: 50000,
            description: 'Proof of successful hack',
            effect: 'Permanent whitelist access'
        });
        
        this.emit('successful_hack', { userId, reward: this.hackChallenge.fees.successReward });
    }
    
    handleHackChallengeMessage(ws, data) {
        switch (data.type) {
            case 'partner_request':
                this.handlePartnerRequest(ws, data);
                break;
            case 'load_generator':
                this.handleLoadGenerator(ws, data);
                break;
            case 'market_query':
                this.handleMarketQuery(ws, data);
                break;
        }
    }
    
    handlePartnerRequest(ws, data) {
        // Big tech wants to partner instead of paying fees
        const partner = data.company;
        
        if (this.hackChallenge.partners.includes(partner)) {
            ws.send(JSON.stringify({
                type: 'partner_accepted',
                message: `Welcome ${partner}! You now have unlimited API access`,
                benefits: {
                    noRateLimits: true,
                    prioritySupport: true,
                    revenueShart: 0.1 // 10% of generated value
                }
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'partner_pending',
                message: 'Partnership under review',
                requirements: {
                    minimumTraffic: '1M requests/day',
                    hackAttempts: 1000,
                    fee: this.hackChallenge.fees.failurePenalty
                }
            }));
        }
    }
    
    updateLeaderboards() {
        // Most requests
        this.activeUsers.forEach((user, userId) => {
            this.exchange.leaderboard.mostRequests.set(userId, user.totalRequests || 0);
        });
        
        // Sort and keep top 100
        const sortedRequests = Array.from(this.exchange.leaderboard.mostRequests.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 100);
        
        this.exchange.leaderboard.mostRequests = new Map(sortedRequests);
        
        // Similar for other leaderboards...
    }
    
    // User management
    registerUser(userId, initialData = {}) {
        const user = {
            id: userId,
            joinTime: Date.now(),
            requestRate: 0,
            totalRequests: 0,
            concurrentConnections: 0,
            sessionDuration: 0,
            hackAttempts: 0,
            inventory: [],
            clueScrolls: [],
            earnings: 0,
            pendingRewards: 0,
            ...initialData
        };
        
        this.activeUsers.set(userId, user);
        
        console.log(`👤 New load generator registered: ${userId}`);
        
        return user;
    }
    
    // Create load generator bot
    createLoadGenerator(config = {}) {
        const generator = {
            id: `LOADGEN-${crypto.randomBytes(4).toString('hex'}`,
            type: config.type || 'standard',
            rps: config.rps || 100,
            pattern: config.pattern || 'steady',
            target: config.target || 'general',
            owner: config.owner || 'system',
            startTime: Date.now(),
            totalGenerated: 0
        };
        
        this.loadGenerators.set(generator.id, generator);
        
        // Start generating load
        this.startLoadGeneration(generator);
        
        return generator;
    }
    
    startLoadGeneration(generator) {
        const interval = setInterval(() => {
            if (!this.loadGenerators.has(generator.id)) {
                clearInterval(interval);
                return;
            }
            
            // Generate load based on pattern
            let currentRPS = generator.rps;
            
            switch (generator.pattern) {
                case 'burst':
                    currentRPS = Math.random() < 0.1 ? generator.rps * 10 : generator.rps / 10;
                    break;
                case 'wave':
                    currentRPS = generator.rps * (1 + Math.sin(Date.now() / 10000));
                    break;
                case 'random':
                    currentRPS = generator.rps * (0.5 + Math.random());
                    break;
            }
            
            generator.totalGenerated += currentRPS;
            
            // Award owner
            if (generator.owner !== 'system' && this.activeUsers.has(generator.owner)) {
                const owner = this.activeUsers.get(generator.owner);
                owner.totalRequests += currentRPS;
                owner.requestRate = currentRPS;
            }
            
        }, 1000);
    }
    
    startRareDropSystem() {
        // Global rare drop events
        setInterval(() => {
            if (this.loadMetrics.currentRPS > 1000) {
                // Server-wide drop party!
                console.log('\n🎊 DROP PARTY! High load triggered rare drops!');
                
                const luckyUsers = Array.from(this.activeUsers.values())
                    .filter(u => u.requestRate > 100)
                    .slice(0, Math.floor(Math.random() * 5) + 1);
                
                luckyUsers.forEach(user => {
                    const item = this.rollRareItem(10000); // Guaranteed good item
                    if (item) {
                        this.awardRareItem(user, item);
                    }
                });
            }
        }, 300000); // Every 5 minutes
    }
    
    initializeClueSystem() {
        console.log('📜 Clue scroll system initialized');
        console.log('   Generate sustained load to receive clue scrolls!');
        console.log('   Complete clues for exclusive Third Age items!');
    }
    
    awardPeakAchievement() {
        // Award all active high-load users
        this.activeUsers.forEach(user => {
            if (user.requestRate > 100) {
                user.achievements = user.achievements || [];
                user.achievements.push({
                    name: 'Peak Contributor',
                    description: `Contributed to ${this.loadMetrics.peakRPS} RPS peak`,
                    timestamp: Date.now()
                });
            }
        });
    }
    
    // Public API
    getExchangeStatus() {
        return {
            metrics: this.loadMetrics,
            exchange: {
                rareItemsCount: this.exchange.rareItems.size,
                totalValue: this.exchange.internalDB.totalValue,
                activeUsers: this.activeUsers.size,
                loadGenerators: this.loadGenerators.size
            },
            hackChallenge: {
                currentPot: this.hackChallenge.currentPot,
                totalAttempts: this.hackChallenge.attempts.size,
                successfulHacks: this.hackChallenge.successfulHacks
            },
            topUsers: Array.from(this.exchange.leaderboard.mostRequests.entries()).slice(0, 10)
        };
    }
    
    getUserStatus(userId) {
        const user = this.activeUsers.get(userId);
        if (!user) return null;
        
        return {
            ...user,
            rank: this.getUserRank(userId),
            nextReward: this.calculateNextReward(user),
            rareItemValue: this.calculateInventoryValue(user)
        };
    }
    
    getUserRank(userId) {
        const ranks = Array.from(this.exchange.leaderboard.mostRequests.keys());
        return ranks.indexOf(userId) + 1;
    }
    
    calculateInventoryValue(user) {
        if (!user.inventory) return 0;
        
        return user.inventory.reduce((total, item) => {
            const marketItem = this.exchange.rareItems.get(item.name);
            return total + (marketItem?.marketPrice || 0);
        }, 0);
    }
    
    calculateNextReward(user) {
        const loadScore = this.calculateUserLoadScore(user);
        const thresholds = [100, 500, 1000, 5000, 10000, 50000, 100000];
        
        for (const threshold of thresholds) {
            if (loadScore < threshold) {
                return {
                    threshold,
                    current: loadScore,
                    progress: (loadScore / threshold) * 100,
                    reward: `Unlock at ${threshold} load score`
                };
            }
        }
        
        return { threshold: Infinity, current: loadScore, progress: 100, reward: 'Max level!' };
    }
}

// Export the system
module.exports = HighLoadGrandExchange;

// Run if called directly
if (require.main === module) {
    const exchange = new HighLoadGrandExchange();
    
    // Create demo users
    const demoUsers = [
        exchange.registerUser('LoadMaster3000', { requestRate: 500 }),
        exchange.registerUser('DDoSKing', { requestRate: 1000, hackAttempts: 50 }),
        exchange.registerUser('APIHammer', { requestRate: 750 }),
        exchange.registerUser('CacheBuster', { requestRate: 250 })
    ];
    
    // Create load generators
    exchange.createLoadGenerator({ type: 'burst', rps: 1000, pattern: 'burst' });
    exchange.createLoadGenerator({ type: 'steady', rps: 500, pattern: 'steady' });
    exchange.createLoadGenerator({ type: 'wave', rps: 750, pattern: 'wave' });
    
    // Display status
    setInterval(() => {
        console.clear();
        console.log('💎 HIGH-LOAD GRAND EXCHANGE');
        console.log('=' .repeat(60));
        
        const status = exchange.getExchangeStatus();
        
        console.log(`\n📊 LOAD METRICS:`);
        console.log(`   Current RPS: ${status.metrics.currentRPS}`);
        console.log(`   Peak RPS: ${status.metrics.peakRPS}`);
        console.log(`   Active Users: ${status.exchange.activeUsers}`);
        console.log(`   Load Generators: ${status.exchange.loadGenerators}`);
        console.log(`   Database Value: $${status.exchange.totalValue.toFixed(2)}`);
        
        console.log(`\n🎯 HACK CHALLENGE:`);
        console.log(`   Current Pot: $${status.hackChallenge.currentPot.toLocaleString()}`);
        console.log(`   Total Attempts: ${status.hackChallenge.totalAttempts}`);
        console.log(`   Successful Hacks: ${status.hackChallenge.successfulHacks}`);
        console.log(`   Try to hack us at: http://localhost:31337`);
        
        console.log(`\n🏆 TOP LOAD GENERATORS:`);
        status.topUsers.forEach(([userId, requests], index) => {
            console.log(`   ${index + 1}. ${userId}: ${requests.toLocaleString()} requests`);
        });
        
        console.log(`\n💰 REMEMBER: MORE LOAD = MORE REWARDS!`);
        console.log(`   Rare items drop at high RPS!`);
        console.log(`   Complete clue scrolls for exclusive items!`);
        console.log(`   Partner with us or pay the hacking fee!`);
        
        console.log('\n' + '=' .repeat(60));
    }, 2000);
    
    console.log('💎 Grand Exchange is live!');
    console.log('🎯 Hack challenge server on port 31337');
    console.log('📈 Generate maximum load for maximum rewards!\n');
}