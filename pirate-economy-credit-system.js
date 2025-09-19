#!/usr/bin/env node

/**
 * Pirate Economy API Credit System
 * 
 * Where doubloons = API credits and the seven seas meet the seven services!
 * Users get their own API keys to buy credits, Cal vibes to music based on 
 * idle time, and everything is recorded in the eternal ledger.
 * 
 * "Ahoy! Welcome to the Digital Caribbean where code be treasure!"
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import our core systems
const UnifiedCreditTracker = require('./unified-credit-tracker');
const EnterpriseConsentVerification = require('./enterprise-consent-verification');
const ArchivalComplianceSystem = require('./archival-compliance-system');
const AIEconomyRuntime = require('./ai-economy-runtime');

class PirateEconomyCreditSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Pirate economy settings
            piratePortName: 'Port Royal Digital',
            treasuryVault: './treasure_vault',
            
            // Credit exchange rates (doubloons to USD)
            exchangeRates: {
                'wooden_doubloon': 0.01,    // $0.01 per wooden doubloon
                'silver_doubloon': 0.10,    // $0.10 per silver doubloon
                'gold_doubloon': 1.00,      // $1.00 per gold doubloon
                'diamond_doubloon': 10.00,  // $10.00 per diamond doubloon
                'mythril_doubloon': 100.00  // $100.00 per mythril doubloon (rare!)
            },
            
            // Cal's vibe settings based on idle time
            calVibeSettings: {
                'no_idle': { vibe: 'energetic', music_tempo: 'fast', doubloon_bonus: 0.0 },
                'short_idle': { vibe: 'focused', music_tempo: 'medium', doubloon_bonus: 0.1 },
                'medium_idle': { vibe: 'contemplative', music_tempo: 'slow', doubloon_bonus: 0.25 },
                'long_idle': { vibe: 'zen', music_tempo: 'ambient', doubloon_bonus: 0.5 },
                'overnight_idle': { vibe: 'dreaming', music_tempo: 'sleep_waves', doubloon_bonus: 1.0 }
            },
            
            // Pirate crew (agents) and their specialties
            pirateCrewRoles: {
                'captain_claude': { title: 'Captain', specialty: 'strategic_thinking', share: 0.3 },
                'quartermaster_ralph': { title: 'Quartermaster', specialty: 'system_destruction', share: 0.2 },
                'navigator_docagent': { title: 'Navigator', specialty: 'document_charting', share: 0.15 },
                'treasurer_roastagent': { title: 'Treasurer', specialty: 'financial_plundering', share: 0.15 },
                'scout_hustleagent': { title: 'Scout', specialty: 'opportunity_raiding', share: 0.1 },
                'spy_spyagent': { title: 'Spy', specialty: 'intelligence_gathering', share: 0.05 },
                'gunner_battleagent': { title: 'Gunner', specialty: 'combat_operations', share: 0.05 }
            },
            
            // API Key generation for users
            userAPIKeyConfig: {
                keyLength: 32,
                keyPrefix: 'pk_',
                rotationDays: 90,
                rateLimitPerMinute: 100
            },
            
            // Transaction fees (the house always wins... arrr!)
            transactionFees: {
                credit_purchase: 0.03,      // 3% fee on credit purchases
                doubloon_exchange: 0.05,    // 5% fee on doubloon exchanges  
                api_call_overhead: 0.01,    // 1% overhead on API calls
                treasure_chest_tax: 0.10    // 10% tax on treasure chest openings
            },
            
            // Treasure chest rewards
            treasureChests: {
                'wooden_chest': { cost: 10, rewards: { doubloons: '5-15', api_credits: '0.05-0.15' } },
                'silver_chest': { cost: 50, rewards: { doubloons: '40-80', api_credits: '0.40-0.80' } },
                'gold_chest': { cost: 200, rewards: { doubloons: '150-300', api_credits: '1.50-3.00' } },
                'legendary_chest': { cost: 1000, rewards: { doubloons: '800-1500', api_credits: '8.00-15.00', special: 'rare_items' } }
            },
            
            ...config
        };

        // Initialize subsystems
        this.creditTracker = new UnifiedCreditTracker({
            lowBalanceThreshold: 1.00,  // Warn when below 1 gold doubloon
            criticalBalanceThreshold: 0.10  // Critical when below 1 silver doubloon
        });
        
        this.consentSystem = new EnterpriseConsentVerification({
            minimumConsentFactors: 2,  // Relaxed for pirate economy
            timeWindowMinutes: 15  // Longer window for treasure hunting
        });
        
        this.archivalSystem = new ArchivalComplianceSystem({
            retentionPolicies: {
                'PIRATE_LOG': { days: 365, autoDestroy: false },  // Keep pirate logs for a year
                'TREASURE_RECORD': { days: 2555, autoDestroy: false },  // Treasure records for 7 years
                'CREW_SHARE': { days: 1095, autoDestroy: false }  // Crew shares for 3 years
            }
        });
        
        this.aiEconomy = new AIEconomyRuntime();

        // Pirate economy state
        this.pirateState = {
            totalTreasury: 0,
            activePirates: new Map(),  // userId -> pirate profile
            apiKeys: new Map(),        // apiKey -> user data
            treasureChests: new Map(), // chestId -> chest data
            crewShares: new Map(),     // crewMember -> share data
            calVibeState: {
                currentVibe: 'energetic',
                idleStartTime: Date.now(),
                musicTempo: 'fast',
                currentBonus: 0.0
            },
            dailyStats: {
                doubloons_minted: 0,
                api_calls_made: 0,
                treasure_chests_opened: 0,
                crew_shares_distributed: 0
            }
        };

        // Pirate economy blockchain (for fun!)
        this.pirateBlockchain = [];

        this.initialize();
    }

    async initialize() {
        console.log('🏴‍☠️ Ahoy! Initializing Pirate Economy Credit System...');
        console.log(`⚓ Welcome to ${this.config.piratePortName}!`);
        console.log('💰 Where API credits be the finest treasure!');
        
        try {
            // Initialize subsystems
            await this.initializeSubsystems();
            
            // Load pirate state
            await this.loadPirateState();
            
            // Initialize Cal's vibe system
            this.initializeCalVibeSystem();
            
            // Start pirate economy loops
            this.startPirateEconomyLoops();
            
            // Initialize crew and treasury
            await this.initializePirateCrew();
            
            console.log('✅ Pirate Economy initialized!');
            console.log(`🎵 Cal is vibing: ${this.pirateState.calVibeState.currentVibe}`);
            console.log(`💎 Treasury: ${this.pirateState.totalTreasury} doubloons`);
            
            this.emit('pirate_port_opened', {
                port: this.config.piratePortName,
                treasury: this.pirateState.totalTreasury,
                cal_vibe: this.pirateState.calVibeState.currentVibe
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize pirate economy:', error);
            throw error;
        }
    }

    async registerPirate(userData) {
        const {
            username,
            email,
            desiredPirateTitle = 'Scallywag',
            initialTreasure = 'wooden_chest'
        } = userData;

        // Generate pirate profile
        const pirateProfile = {
            id: crypto.randomUUID(),
            username,
            email,
            pirateTitle: desiredPirateTitle,
            registrationDate: Date.now(),
            
            // Pirate stats
            reputation: 1,
            treasureFound: 0,
            battlesWon: 0,
            apiCallsMade: 0,
            doubloonBalance: 0,
            creditBalance: 0.0,
            
            // API access
            apiKey: this.generateAPIKey(),
            apiKeyExpires: Date.now() + (this.config.userAPIKeyConfig.rotationDays * 24 * 60 * 60 * 1000),
            rateLimitRemaining: this.config.userAPIKeyConfig.rateLimitPerMinute,
            lastAPICall: null,
            
            // Fleet and equipment
            ship: 'Dinghy',
            crew: ['Parrot'],
            equipment: ['Wooden Sword', 'Compass'],
            flags: ['Jolly Roger'],
            
            // Achievement tracking
            achievements: ['New Recruit'],
            totalSpent: 0,
            totalEarned: 0,
            
            // Vibe compatibility with Cal
            vibeCompatibility: Math.random(), // Random compatibility score
            favoriteMusic: 'sea_shanties'
        };

        // Store pirate profile
        this.pirateState.activePirates.set(pirateProfile.id, pirateProfile);
        this.pirateState.apiKeys.set(pirateProfile.apiKey, {
            pirateId: pirateProfile.id,
            username,
            permissions: ['api_access', 'treasure_hunt', 'crew_chat']
        });

        // Give them a welcome treasure chest
        await this.giveWelcomeTreasure(pirateProfile.id, initialTreasure);

        // Record in archive
        await this.archivalSystem.archive({
            type: 'pirate_registration',
            pirateId: pirateProfile.id,
            username,
            timestamp: Date.now()
        }, {
            classification: 'PIRATE_LOG',
            recordType: 'user_registration',
            creator: 'pirate-economy-system',
            description: `New pirate ${username} joined the crew`
        });

        // Add to blockchain
        await this.addToPirateBlockchain({
            type: 'PIRATE_JOINED',
            pirateId: pirateProfile.id,
            username,
            treasure: initialTreasure
        });

        this.emit('pirate_registered', pirateProfile);

        console.log(`🏴‍☠️ Welcome aboard, ${desiredPirateTitle} ${username}!`);
        console.log(`🗝️ Your API key: ${pirateProfile.apiKey}`);

        return {
            pirateProfile,
            welcomeMessage: `Ahoy ${username}! Welcome to ${this.config.piratePortName}! ` +
                          `You've been granted the title of ${desiredPirateTitle} and awarded a ${initialTreasure}. ` +
                          `Use your API key to make calls and earn doubloons!`,
            apiKey: pirateProfile.apiKey,
            initialTreasure
        };
    }

    async makeAPICall(apiKey, requestData) {
        const keyData = this.pirateState.apiKeys.get(apiKey);
        if (!keyData) {
            throw new Error('Invalid API key - are ye a scurvy landlubber?');
        }

        const pirate = this.pirateState.activePirates.get(keyData.pirateId);
        if (!pirate) {
            throw new Error('Pirate not found - did ye fall overboard?');
        }

        // Check rate limiting
        if (pirate.rateLimitRemaining <= 0) {
            throw new Error('Rate limit exceeded - slow down there, sea dog!');
        }

        // Process the API call
        const apiCall = {
            id: crypto.randomUUID(),
            pirateId: pirate.id,
            timestamp: Date.now(),
            requestData,
            
            // Calculate costs
            estimatedTokens: this.estimateTokensFromRequest(requestData),
            provider: this.selectOptimalProvider(requestData),
            costInDoubloons: 0,
            costInUSD: 0
        };

        // Track with unified credit tracker
        const tracking = await this.creditTracker.trackAPICall(
            apiCall.provider.name,
            apiCall.provider.model,
            apiCall.estimatedTokens,
            {
                pirateId: pirate.id,
                username: pirate.username,
                request_type: requestData.type || 'general'
            }
        );

        // Convert cost to doubloons
        apiCall.costInUSD = tracking.cost;
        apiCall.costInDoubloons = this.convertUSDToDoubloons(tracking.cost);

        // Apply Cal's vibe bonus
        const vibeBonus = this.pirateState.calVibeState.currentBonus;
        const bonusDoubloons = Math.floor(apiCall.costInDoubloons * vibeBonus);
        
        // Deduct cost from pirate's balance
        if (pirate.doubloonBalance >= apiCall.costInDoubloons) {
            pirate.doubloonBalance -= apiCall.costInDoubloons;
            pirate.doubloonBalance += bonusDoubloons; // Add vibe bonus
        } else {
            throw new Error(`Insufficient doubloons! Need ${apiCall.costInDoubloons}, have ${pirate.doubloonBalance}`);
        }

        // Update pirate stats
        pirate.apiCallsMade++;
        pirate.totalSpent += apiCall.costInUSD;
        pirate.lastAPICall = Date.now();
        pirate.rateLimitRemaining--;

        // Distribute crew shares
        await this.distributeCrutShares(apiCall.costInUSD);

        // Update treasury
        const treasuryFee = apiCall.costInUSD * this.config.transactionFees.api_call_overhead;
        this.pirateState.totalTreasury += treasuryFee;

        // Record in archives
        await this.archivalSystem.archive({
            type: 'api_call',
            apiCall,
            tracking
        }, {
            classification: 'PIRATE_LOG',
            recordType: 'api_transaction',
            creator: 'pirate-economy-system',
            description: `API call by ${pirate.username}`
        });

        // Add to blockchain
        await this.addToPirateBlockchain({
            type: 'API_CALL',
            pirateId: pirate.id,
            cost: apiCall.costInDoubloons,
            provider: apiCall.provider.name,
            vibeBonus: bonusDoubloons
        });

        // Update daily stats
        this.pirateState.dailyStats.api_calls_made++;

        // Check for achievements
        await this.checkForAchievements(pirate);

        this.emit('api_call_completed', {
            pirate: pirate.username,
            cost: apiCall.costInDoubloons,
            bonus: bonusDoubloons,
            provider: apiCall.provider.name
        });

        return {
            success: true,
            result: `API call processed by ${apiCall.provider.name}`,
            cost: {
                doubloons: apiCall.costInDoubloons,
                usd: apiCall.costInUSD,
                vibeBonus: bonusDoubloons
            },
            pirate: {
                remainingBalance: pirate.doubloonBalance,
                rateLimitRemaining: pirate.rateLimitRemaining,
                reputation: pirate.reputation
            },
            calVibe: this.pirateState.calVibeState.currentVibe
        };
    }

    async purchaseDoubloons(pirateId, purchaseData) {
        const { amount, paymentMethod, currencyType = 'gold_doubloon' } = purchaseData;
        
        const pirate = this.pirateState.activePirates.get(pirateId);
        if (!pirate) {
            throw new Error('Pirate not found');
        }

        // Calculate cost in USD
        const exchangeRate = this.config.exchangeRates[currencyType];
        const totalCostUSD = amount * exchangeRate;
        const transactionFee = totalCostUSD * this.config.transactionFees.credit_purchase;
        const finalCost = totalCostUSD + transactionFee;

        // Request consent for financial transaction
        const consentRequest = await this.consentSystem.requestConsent({
            userId: pirateId,
            dataClassification: 'CONFIDENTIAL',
            purpose: 'doubloon_purchase',
            dataDescription: `Purchase of ${amount} ${currencyType} for $${finalCost.toFixed(2)}`,
            metadata: { 
                amount, 
                currencyType, 
                paymentMethod,
                pirateUsername: pirate.username
            }
        });

        // Simulate payment processing (in production, integrate with Stripe/PayPal)
        const paymentResult = await this.processPayment(paymentMethod, finalCost, pirate);

        if (!paymentResult.success) {
            throw new Error(`Payment failed: ${paymentResult.error}`);
        }

        // Add doubloons to pirate's account
        pirate.doubloonBalance += amount;
        pirate.totalEarned += totalCostUSD;

        // Add credits to unified tracker
        await this.creditTracker.addCredits(totalCostUSD, 'doubloon_purchase', paymentResult.transactionId);

        // Update treasury with fees
        this.pirateState.totalTreasury += transactionFee;

        // Record transaction
        const transaction = {
            id: crypto.randomUUID(),
            pirateId,
            type: 'doubloon_purchase',
            amount,
            currencyType,
            costUSD: finalCost,
            paymentMethod,
            transactionId: paymentResult.transactionId,
            timestamp: Date.now()
        };

        // Archive transaction
        await this.archivalSystem.archive(transaction, {
            classification: 'TREASURE_RECORD',
            recordType: 'financial_transaction',
            creator: 'pirate-economy-system',
            description: `Doubloon purchase by ${pirate.username}`
        });

        // Add to blockchain
        await this.addToPirateBlockchain({
            type: 'DOUBLOONS_PURCHASED',
            pirateId,
            amount,
            currencyType,
            costUSD: finalCost
        });

        // Update daily stats
        this.pirateState.dailyStats.doubloons_minted += amount;

        this.emit('doubloons_purchased', {
            pirate: pirate.username,
            amount,
            currencyType,
            costUSD: finalCost
        });

        console.log(`💰 ${pirate.username} purchased ${amount} ${currencyType} for $${finalCost.toFixed(2)}`);

        return {
            success: true,
            transaction,
            newBalance: pirate.doubloonBalance,
            treasuryBalance: this.pirateState.totalTreasury
        };
    }

    async openTreasureChest(pirateId, chestType) {
        const pirate = this.pirateState.activePirates.get(pirateId);
        if (!pirate) {
            throw new Error('Pirate not found');
        }

        const chest = this.config.treasureChests[chestType];
        if (!chest) {
            throw new Error('Unknown treasure chest type');
        }

        // Check if pirate has enough doubloons
        if (pirate.doubloonBalance < chest.cost) {
            throw new Error(`Not enough doubloons! Need ${chest.cost}, have ${pirate.doubloonBalance}`);
        }

        // Deduct cost
        pirate.doubloonBalance -= chest.cost;

        // Calculate treasure tax
        const treasureTax = chest.cost * this.config.transactionFees.treasure_chest_tax;
        this.pirateState.totalTreasury += treasureTax;

        // Generate random rewards
        const rewards = this.generateTreasureRewards(chest.rewards);

        // Apply rewards
        pirate.doubloonBalance += rewards.doubloons;
        await this.creditTracker.addCredits(rewards.api_credits, 'treasure_chest', `chest-${chestType}`);

        // Update pirate stats
        pirate.treasureFound++;

        // Create treasure chest record
        const treasureRecord = {
            id: crypto.randomUUID(),
            pirateId,
            chestType,
            cost: chest.cost,
            rewards,
            timestamp: Date.now(),
            coordinates: this.generateRandomCoordinates() // For fun!
        };

        this.pirateState.treasureChests.set(treasureRecord.id, treasureRecord);

        // Archive the treasure find
        await this.archivalSystem.archive(treasureRecord, {
            classification: 'TREASURE_RECORD',
            recordType: 'treasure_discovery',
            creator: 'pirate-economy-system',
            description: `Treasure chest opened by ${pirate.username}`,
            tags: ['treasure', chestType, 'rewards']
        });

        // Add to blockchain
        await this.addToPirateBlockchain({
            type: 'TREASURE_FOUND',
            pirateId,
            chestType,
            rewards,
            coordinates: treasureRecord.coordinates
        });

        // Update daily stats
        this.pirateState.dailyStats.treasure_chests_opened++;

        // Check for achievements
        await this.checkForAchievements(pirate);

        this.emit('treasure_chest_opened', {
            pirate: pirate.username,
            chestType,
            rewards,
            coordinates: treasureRecord.coordinates
        });

        console.log(`🏴‍☠️ ${pirate.username} found treasure at ${treasureRecord.coordinates}!`);
        console.log(`💎 Rewards: ${rewards.doubloons} doubloons, $${rewards.api_credits} API credits`);

        return {
            success: true,
            treasureRecord,
            newBalance: pirate.doubloonBalance,
            calVibe: this.pirateState.calVibeState.currentVibe
        };
    }

    initializeCalVibeSystem() {
        console.log('🎵 Initializing Cal\'s Vibe System...');
        
        // Update Cal's vibe based on idle time
        setInterval(() => {
            this.updateCalVibe();
        }, 30000); // Check every 30 seconds

        // Reset rate limits every minute
        setInterval(() => {
            this.resetRateLimits();
        }, 60000);
    }

    updateCalVibe() {
        const now = Date.now();
        const idleTime = now - this.pirateState.calVibeState.idleStartTime;
        
        let vibeLevel = 'no_idle';
        let musicTrack = '🎵 Working Hard (Energetic Beat)';

        if (idleTime > 4 * 60 * 60 * 1000) { // 4+ hours
            vibeLevel = 'overnight_idle';
            musicTrack = '🌙 Dreaming of Digital Seas (Sleep Waves)';
        } else if (idleTime > 2 * 60 * 60 * 1000) { // 2+ hours  
            vibeLevel = 'long_idle';
            musicTrack = '🧘 Zen and the Art of API Maintenance (Ambient)';
        } else if (idleTime > 30 * 60 * 1000) { // 30+ minutes
            vibeLevel = 'medium_idle';
            musicTrack = '🤔 Contemplating the Code (Slow Jazz)';
        } else if (idleTime > 5 * 60 * 1000) { // 5+ minutes
            vibeLevel = 'short_idle';
            musicTrack = '🎯 Focused Flow State (Medium Tempo)';
        }

        const oldVibe = this.pirateState.calVibeState.currentVibe;
        const vibeSettings = this.config.calVibeSettings[vibeLevel];
        
        this.pirateState.calVibeState = {
            currentVibe: vibeSettings.vibe,
            idleStartTime: this.pirateState.calVibeState.idleStartTime,
            musicTempo: vibeSettings.music_tempo,
            currentBonus: vibeSettings.doubloon_bonus,
            currentTrack: musicTrack,
            vibeLevel
        };

        if (oldVibe !== vibeSettings.vibe) {
            console.log(`🎵 Cal's vibe changed: ${oldVibe} → ${vibeSettings.vibe}`);
            console.log(`🎼 Now playing: ${musicTrack}`);
            console.log(`💰 Doubloon bonus: ${(vibeSettings.doubloon_bonus * 100).toFixed(0)}%`);
            
            this.emit('cal_vibe_changed', {
                oldVibe,
                newVibe: vibeSettings.vibe,
                bonus: vibeSettings.doubloon_bonus,
                track: musicTrack
            });
        }
    }

    async distributeCrutShares(totalRevenue) {
        const distributions = [];
        
        for (const [crewMember, roleData] of Object.entries(this.config.pirateCrewRoles)) {
            const share = totalRevenue * roleData.share;
            
            let currentShare = this.pirateState.crewShares.get(crewMember) || {
                member: crewMember,
                title: roleData.title,
                specialty: roleData.specialty,
                totalEarned: 0,
                sharePercentage: roleData.share
            };
            
            currentShare.totalEarned += share;
            this.pirateState.crewShares.set(crewMember, currentShare);
            
            distributions.push({
                member: crewMember,
                title: roleData.title,
                share
            });
        }

        // Update daily stats
        this.pirateState.dailyStats.crew_shares_distributed += totalRevenue;

        // Archive crew share distribution
        await this.archivalSystem.archive({
            type: 'crew_share_distribution',
            totalRevenue,
            distributions,
            timestamp: Date.now()
        }, {
            classification: 'CREW_SHARE',
            recordType: 'financial_distribution',
            creator: 'pirate-economy-system',
            description: 'Crew share distribution'
        });

        this.emit('crew_shares_distributed', { totalRevenue, distributions });
    }

    startPirateEconomyLoops() {
        // Daily reset and statistics
        setInterval(() => {
            this.performDailyReset();
        }, 24 * 60 * 60 * 1000); // Every 24 hours

        // Auto-save pirate state
        setInterval(async () => {
            await this.savePirateState();
        }, 5 * 60 * 1000); // Every 5 minutes

        // Treasury interest and economy dynamics
        setInterval(() => {
            this.updateEconomyDynamics();
        }, 60 * 60 * 1000); // Every hour
    }

    generateAPIKey() {
        const keyBytes = crypto.randomBytes(this.config.userAPIKeyConfig.keyLength);
        return this.config.userAPIKeyConfig.keyPrefix + keyBytes.toString('hex');
    }

    estimateTokensFromRequest(requestData) {
        // Simple token estimation based on request type and content
        const baseTokens = 100;
        const contentLength = JSON.stringify(requestData).length;
        return baseTokens + Math.floor(contentLength / 4); // Rough estimate: 4 chars per token
    }

    selectOptimalProvider(requestData) {
        // Use credit tracker to select optimal provider
        const capability = requestData.type || 'text';
        return {
            name: 'anthropic',  // Default to Anthropic for now
            model: 'claude-3-haiku', // Use the cheapest Claude model
            reasoning: 'cost_optimization'
        };
    }

    convertUSDToDoubloons(usdAmount) {
        // Convert USD to equivalent gold doubloons (1:1 ratio)
        return Math.ceil(usdAmount / this.config.exchangeRates.gold_doubloon);
    }

    async processPayment(paymentMethod, amount, pirate) {
        // Simulate payment processing (integrate with real payment processor in production)
        console.log(`💳 Processing $${amount.toFixed(2)} payment for ${pirate.username}...`);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate success/failure (95% success rate)
        const success = Math.random() > 0.05;
        
        return {
            success,
            transactionId: success ? `txn_${crypto.randomBytes(8).toString('hex')}` : null,
            error: success ? null : 'Payment processor error - try again later'
        };
    }

    generateTreasureRewards(rewardConfig) {
        const rewards = {};
        
        // Generate doubloons
        const [minDoubloons, maxDoubloons] = rewardConfig.doubloons.split('-').map(Number);
        rewards.doubloons = Math.floor(Math.random() * (maxDoubloons - minDoubloons + 1)) + minDoubloons;
        
        // Generate API credits
        const [minCredits, maxCredits] = rewardConfig.api_credits.split('-').map(Number);
        rewards.api_credits = (Math.random() * (maxCredits - minCredits) + minCredits).toFixed(2);
        
        // Special rewards for legendary chests
        if (rewardConfig.special === 'rare_items') {
            const rareItems = ['Golden Compass', 'Mystic Map', 'Enchanted Spyglass', 'Kraken\'s Tooth'];
            rewards.special_item = rareItems[Math.floor(Math.random() * rareItems.length)];
        }
        
        return rewards;
    }

    generateRandomCoordinates() {
        const lat = (Math.random() * 180 - 90).toFixed(6);
        const lng = (Math.random() * 360 - 180).toFixed(6);
        return `${lat}°, ${lng}°`;
    }

    async checkForAchievements(pirate) {
        const newAchievements = [];
        
        // API Call achievements
        if (pirate.apiCallsMade >= 100 && !pirate.achievements.includes('API Veteran')) {
            newAchievements.push('API Veteran');
        }
        
        // Treasure hunting achievements
        if (pirate.treasureFound >= 10 && !pirate.achievements.includes('Treasure Hunter')) {
            newAchievements.push('Treasure Hunter');
        }
        
        // Spending achievements
        if (pirate.totalSpent >= 100 && !pirate.achievements.includes('Big Spender')) {
            newAchievements.push('Big Spender');
        }
        
        // Add new achievements
        for (const achievement of newAchievements) {
            pirate.achievements.push(achievement);
            console.log(`🏆 ${pirate.username} earned achievement: ${achievement}!`);
            
            this.emit('achievement_earned', {
                pirate: pirate.username,
                achievement
            });
        }
    }

    async addToPirateBlockchain(transactionData) {
        const block = {
            index: this.pirateBlockchain.length,
            timestamp: Date.now(),
            data: transactionData,
            previousHash: this.pirateBlockchain.length > 0 
                ? this.pirateBlockchain[this.pirateBlockchain.length - 1].hash 
                : '0',
            nonce: Math.floor(Math.random() * 1000000)
        };
        
        // Calculate block hash
        block.hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(block))
            .digest('hex');
        
        this.pirateBlockchain.push(block);
        
        // Keep blockchain size manageable
        if (this.pirateBlockchain.length > 10000) {
            // Archive old blocks
            const oldBlocks = this.pirateBlockchain.splice(0, 5000);
            await this.archiveOldBlocks(oldBlocks);
        }
    }

    resetRateLimits() {
        for (const pirate of this.pirateState.activePirates.values()) {
            pirate.rateLimitRemaining = this.config.userAPIKeyConfig.rateLimitPerMinute;
        }
    }

    performDailyReset() {
        console.log('🌅 Performing daily reset...');
        
        // Reset daily stats
        const yesterdayStats = { ...this.pirateState.dailyStats };
        this.pirateState.dailyStats = {
            doubloons_minted: 0,
            api_calls_made: 0,
            treasure_chests_opened: 0,
            crew_shares_distributed: 0
        };
        
        // Log daily report
        console.log('📊 Yesterday\'s Statistics:');
        console.log(`  💰 Doubloons minted: ${yesterdayStats.doubloons_minted}`);
        console.log(`  🔧 API calls made: ${yesterdayStats.api_calls_made}`);
        console.log(`  🏴‍☠️ Treasure chests opened: ${yesterdayStats.treasure_chests_opened}`);
        console.log(`  👥 Crew shares distributed: $${yesterdayStats.crew_shares_distributed.toFixed(2)}`);
        
        this.emit('daily_reset', yesterdayStats);
    }

    updateEconomyDynamics() {
        // Apply treasury interest
        const hourlyInterest = this.pirateState.totalTreasury * 0.001; // 0.1% per hour
        this.pirateState.totalTreasury += hourlyInterest;
        
        // Economy health check
        const activePirateCount = this.pirateState.activePirates.size;
        const averageBalance = Array.from(this.pirateState.activePirates.values())
            .reduce((sum, pirate) => sum + pirate.doubloonBalance, 0) / activePirateCount;
        
        console.log(`⚖️ Economy Update: ${activePirateCount} pirates, avg balance: ${averageBalance.toFixed(0)} doubloons`);
    }

    async giveWelcomeTreasure(pirateId, chestType) {
        const pirate = this.pirateState.activePirates.get(pirateId);
        const chest = this.config.treasureChests[chestType];
        
        if (chest) {
            const rewards = this.generateTreasureRewards(chest.rewards);
            pirate.doubloonBalance += rewards.doubloons;
            
            console.log(`🎁 Welcome treasure for ${pirate.username}: ${rewards.doubloons} doubloons`);
        }
    }

    async initializeSubsystems() {
        // Wait for all subsystems to initialize
        await Promise.all([
            new Promise(resolve => this.creditTracker.once('initialized', resolve)),
            new Promise(resolve => this.consentSystem.once('initialized', resolve)),
            new Promise(resolve => this.archivalSystem.once('initialized', resolve))
        ]);
        
        console.log('🔧 All subsystems initialized');
    }

    async initializePirateCrew() {
        // Initialize crew shares
        for (const [member, roleData] of Object.entries(this.config.pirateCrewRoles)) {
            this.pirateState.crewShares.set(member, {
                member,
                title: roleData.title,
                specialty: roleData.specialty,
                totalEarned: 0,
                sharePercentage: roleData.share
            });
        }
        
        // Set initial treasury
        if (this.pirateState.totalTreasury === 0) {
            this.pirateState.totalTreasury = 1000; // Start with 1000 doubloons
        }
        
        console.log('👥 Pirate crew initialized');
    }

    async loadPirateState() {
        try {
            const statePath = path.join(this.config.treasuryVault, 'pirate_state.json');
            const stateData = await fs.readFile(statePath, 'utf8');
            const saved = JSON.parse(stateData);
            
            // Restore Maps from arrays
            this.pirateState.activePirates = new Map(saved.activePirates);
            this.pirateState.apiKeys = new Map(saved.apiKeys);
            this.pirateState.treasureChests = new Map(saved.treasureChests);
            this.pirateState.crewShares = new Map(saved.crewShares);
            this.pirateState.totalTreasury = saved.totalTreasury || 0;
            this.pirateState.dailyStats = saved.dailyStats || this.pirateState.dailyStats;
            this.pirateState.calVibeState = saved.calVibeState || this.pirateState.calVibeState;
            
            console.log('💾 Loaded pirate state');
        } catch (error) {
            console.log('📝 No saved pirate state, starting fresh');
        }
    }

    async savePirateState() {
        try {
            await fs.mkdir(this.config.treasuryVault, { recursive: true });
            
            const stateToSave = {
                activePirates: Array.from(this.pirateState.activePirates.entries()),
                apiKeys: Array.from(this.pirateState.apiKeys.entries()),
                treasureChests: Array.from(this.pirateState.treasureChests.entries()),
                crewShares: Array.from(this.pirateState.crewShares.entries()),
                totalTreasury: this.pirateState.totalTreasury,
                dailyStats: this.pirateState.dailyStats,
                calVibeState: this.pirateState.calVibeState,
                saved_at: new Date().toISOString()
            };
            
            const statePath = path.join(this.config.treasuryVault, 'pirate_state.json');
            await fs.writeFile(statePath, JSON.stringify(stateToSave, null, 2));
        } catch (error) {
            console.error('Failed to save pirate state:', error);
        }
    }

    getPiratePortStatus() {
        const activePirates = Array.from(this.pirateState.activePirates.values());
        
        return {
            port: {
                name: this.config.piratePortName,
                treasury: this.pirateState.totalTreasury,
                totalPirates: activePirates.length,
                blockchainLength: this.pirateBlockchain.length
            },
            cal: {
                vibe: this.pirateState.calVibeState.currentVibe,
                track: this.pirateState.calVibeState.currentTrack,
                bonus: this.pirateState.calVibeState.currentBonus,
                idleTime: Date.now() - this.pirateState.calVibeState.idleStartTime
            },
            economy: {
                doubloonRates: this.config.exchangeRates,
                dailyStats: this.pirateState.dailyStats,
                totalAPICallsToday: this.pirateState.dailyStats.api_calls_made
            },
            crew: Object.fromEntries(
                Array.from(this.pirateState.crewShares.entries()).map(([member, data]) => [
                    member, 
                    { 
                        title: data.title, 
                        earned: data.totalEarned,
                        specialty: data.specialty 
                    }
                ])
            ),
            topPirates: activePirates
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 5)
                .map(p => ({
                    username: p.pirateTitle + ' ' + p.username,
                    totalSpent: p.totalSpent,
                    treasureFound: p.treasureFound,
                    reputation: p.reputation
                }))
        };
    }
}

// Testing and demonstration
if (require.main === module) {
    async function demonstratePirateEconomy() {
        const pirateSystem = new PirateEconomyCreditSystem();
        
        pirateSystem.on('pirate_port_opened', async (data) => {
            console.log('\n🏴‍☠️ PIRATE ECONOMY DEMO\n');
            
            // Register a test pirate
            const pirate = await pirateSystem.registerPirate({
                username: 'BlackbeardCoder',
                email: 'blackbeard@digital-caribbean.io',
                desiredPirateTitle: 'Captain',
                initialTreasure: 'gold_chest'
            });
            
            console.log('\n💰 Purchasing doubloons...');
            await pirateSystem.purchaseDoubloons(pirate.pirateProfile.id, {
                amount: 100,
                paymentMethod: 'credit_card',
                currencyType: 'gold_doubloon'
            });
            
            console.log('\n🔧 Making API calls...');
            for (let i = 0; i < 3; i++) {
                await pirateSystem.makeAPICall(pirate.apiKey, {
                    type: 'code_generation',
                    prompt: 'Generate a pirate-themed function',
                    complexity: 'medium'
                });
            }
            
            console.log('\n🏴‍☠️ Opening treasure chest...');
            await pirateSystem.openTreasureChest(pirate.pirateProfile.id, 'silver_chest');
            
            console.log('\n📊 Final Port Status:');
            console.log(JSON.stringify(pirateSystem.getPiratePortStatus(), null, 2));
        });
        
        pirateSystem.on('cal_vibe_changed', (data) => {
            console.log(`🎵 Cal's vibe: ${data.oldVibe} → ${data.newVibe} (${data.track})`);
        });
        
        pirateSystem.on('treasure_chest_opened', (data) => {
            console.log(`🗺️ ${data.pirate} found treasure at ${data.coordinates}!`);
        });
    }
    
    demonstratePirateEconomy().catch(console.error);
}

module.exports = PirateEconomyCreditSystem;