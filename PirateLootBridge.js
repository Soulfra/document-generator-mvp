#!/usr/bin/env node

/**
 * 🏴‍☠️ PIRATE LOOT BRIDGE
 * 
 * Connects the Pirate Storytelling Engine to your existing SatoshiStyleRewardSystem
 * for dynamic treasure distribution with continuous rewards (no absolute winners).
 * 
 * Transforms blockchain-style rewards into pirate treasures:
 * - Satoshi rewards → Cursed doubloons
 * - Mining rewards → Treasure hunting rewards
 * - Staking rewards → Ship maintenance bonuses
 * - Transaction fees → Tavern expenses
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class PirateLootBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Reward distribution settings
            baseRewardInterval: config.baseRewardInterval || 30000, // 30 seconds
            maxRewardPerInterval: config.maxRewardPerInterval || 100,
            minRewardPerInterval: config.minRewardPerInterval || 1,
            
            // Pirate-specific multipliers
            questCompletionMultiplier: config.questCompletionMultiplier || 5.0,
            explorationMultiplier: config.explorationMultiplier || 2.0,
            combatMultiplier: config.combatMultiplier || 3.0,
            socialMultiplier: config.socialMultiplier || 1.5,
            
            // Treasure types and their rarity
            treasureRarities: config.treasureRarities || {
                'cursed_doubloons': { weight: 70, baseValue: 1 },
                'silver_pieces': { weight: 20, baseValue: 5 },
                'golden_escudos': { weight: 8, baseValue: 25 },
                'crystal_gems': { weight: 2, baseValue: 100 }
            },
            
            // Continuous distribution (Satoshi style)
            enableContinuousRewards: config.enableContinuousRewards !== false,
            enableActivityBasedBonus: config.enableActivityBasedBonus !== false,
            enableSocialRewards: config.enableSocialRewards !== false
        };
        
        // Reward tracking
        this.playerRewards = new Map(); // playerId -> total rewards
        this.rewardHistory = new Map(); // rewardId -> reward details
        this.activityTracking = new Map(); // playerId -> activity metrics
        this.treasurePool = new Map(); // poolId -> treasure pool
        
        // Pirate-themed reward narratives
        this.treasureNarratives = {
            cursed_doubloons: [
                "A handful of cursed doubloons wash up on the shore...",
                "The ghost of a long-dead pirate drops these coins at your feet...",
                "You find these doubloons hidden in an old rum barrel..."
            ],
            silver_pieces: [
                "Spanish silver pieces gleam in the moonlight...",
                "These silver coins bear the mark of a merchant vessel...",
                "Heavy silver pieces clink together in your pouch..."
            ],
            golden_escudos: [
                "Golden escudos from the treasure fleet!",
                "These golden coins once belonged to a Spanish admiral...",
                "Pure gold escudos, still warm from the Caribbean sun..."
            ],
            crystal_gems: [
                "Crystal gems that pulse with inner light...",
                "These mystical gems seem to whisper ancient secrets...",
                "Rare crystal gems that glow like captured starlight..."
            ]
        };
        
        // Reward algorithms (Satoshi-style)
        this.rewardAlgorithms = {
            // Continuous base rewards for all active players
            continuous: {
                name: 'Tidal Rewards',
                description: 'Like the tide, rewards flow to all who sail the seas',
                calculate: (playerId) => this.calculateContinuousReward(playerId)
            },
            
            // Activity-based bonuses
            activity: {
                name: 'Adventure Bonus',
                description: 'More adventure yields more treasure',
                calculate: (playerId) => this.calculateActivityBonus(playerId)
            },
            
            // Social interaction rewards
            social: {
                name: 'Crew Camaraderie',
                description: 'Pirates who work together earn together',
                calculate: (playerId) => this.calculateSocialReward(playerId)
            },
            
            // Time-based accumulation
            temporal: {
                name: 'Seasoned Sailor',
                description: 'Time at sea brings wisdom and wealth',
                calculate: (playerId) => this.calculateTemporalReward(playerId)
            }
        };
        
        console.log('💰 PIRATE LOOT BRIDGE');
        console.log('🏴‍☠️ Connecting to SatoshiStyleRewardSystem...');
        console.log('⚓ Implementing continuous treasure distribution...');
    }
    
    /**
     * Initialize connection to SatoshiStyleRewardSystem
     */
    async initialize(satoshiRewardSystem) {
        console.log('🔗 Bridging to Satoshi-style reward system...');
        
        this.satoshiSystem = satoshiRewardSystem || this.createMockSatoshiSystem();
        
        // Start continuous reward distribution
        if (this.config.enableContinuousRewards) {
            this.startContinuousRewards();
        }
        
        // Start activity monitoring
        if (this.config.enableActivityBasedBonus) {
            this.startActivityMonitoring();
        }
        
        // Start social reward tracking
        if (this.config.enableSocialRewards) {
            this.startSocialRewards();
        }
        
        console.log('✅ Pirate loot bridge active!');
        this.emit('bridge:initialized', {
            algorithms: Object.keys(this.rewardAlgorithms),
            treasureTypes: Object.keys(this.config.treasureRarities)
        });
        
        return this;
    }
    
    /**
     * Start continuous reward distribution (core Satoshi principle)
     */
    startContinuousRewards() {
        console.log('🌊 Starting continuous treasure flow...');
        
        setInterval(() => {
            // Distribute rewards to all active players
            for (const [playerId, activity] of this.activityTracking) {
                if (this.isPlayerActive(playerId)) {
                    const reward = this.rewardAlgorithms.continuous.calculate(playerId);
                    if (reward.amount > 0) {
                        this.distributeTreasure(playerId, reward);
                    }
                }
            }
        }, this.config.baseRewardInterval);
        
        console.log(`⏰ Continuous rewards every ${this.config.baseRewardInterval / 1000}s`);
    }
    
    /**
     * Start activity-based bonus tracking
     */
    startActivityMonitoring() {
        console.log('🎯 Starting activity-based bonuses...');
        
        // Monitor player activities and award bonuses
        setInterval(() => {
            for (const [playerId, activity] of this.activityTracking) {
                const bonus = this.rewardAlgorithms.activity.calculate(playerId);
                if (bonus.amount > 0) {
                    this.distributeTreasure(playerId, bonus);
                }
            }
        }, this.config.baseRewardInterval * 2); // Less frequent than base rewards
        
        console.log('📊 Activity monitoring active');
    }
    
    /**
     * Start social reward system
     */
    startSocialRewards() {
        console.log('👥 Starting social rewards...');
        
        // Reward players for social interactions
        setInterval(() => {
            for (const [playerId, activity] of this.activityTracking) {
                if (activity.socialInteractions > 0) {
                    const socialReward = this.rewardAlgorithms.social.calculate(playerId);
                    if (socialReward.amount > 0) {
                        this.distributeTreasure(playerId, socialReward);
                    }
                    
                    // Reset social interaction count
                    activity.socialInteractions = 0;
                }
            }
        }, this.config.baseRewardInterval * 3); // Even less frequent
        
        console.log('🤝 Social rewards active');
    }
    
    /**
     * Calculate continuous reward (base Satoshi-style algorithm)
     */
    calculateContinuousReward(playerId) {
        const activity = this.activityTracking.get(playerId) || this.createActivityTracker(playerId);
        
        // Base reward for simply being active
        let baseAmount = Math.floor(Math.random() * this.config.maxRewardPerInterval) + this.config.minRewardPerInterval;
        
        // Apply activity multipliers
        if (activity.lastQuestCompletion && (Date.now() - activity.lastQuestCompletion) < 300000) {
            baseAmount *= this.config.questCompletionMultiplier;
        }
        
        if (activity.explorationPoints > 0) {
            baseAmount *= (1 + (activity.explorationPoints * this.config.explorationMultiplier / 100));
        }
        
        // Select treasure type based on rarity
        const treasureType = this.selectTreasureType();
        const treasureValue = this.config.treasureRarities[treasureType].baseValue;
        const finalAmount = Math.floor(baseAmount / treasureValue);
        
        return {
            type: treasureType,
            amount: Math.max(1, finalAmount),
            source: 'continuous_reward',
            narrative: this.getTreasureNarrative(treasureType),
            algorithm: 'continuous'
        };
    }
    
    /**
     * Calculate activity-based bonus
     */
    calculateActivityBonus(playerId) {
        const activity = this.activityTracking.get(playerId);
        if (!activity) return { amount: 0 };
        
        let bonusAmount = 0;
        
        // Combat activity bonus
        if (activity.combatActions > 5) {
            bonusAmount += activity.combatActions * this.config.combatMultiplier;
            activity.combatActions = 0; // Reset after bonus
        }
        
        // Exploration bonus
        if (activity.newLocationsVisited > 0) {
            bonusAmount += activity.newLocationsVisited * this.config.explorationMultiplier;
            activity.newLocationsVisited = 0;
        }
        
        if (bonusAmount === 0) return { amount: 0 };
        
        const treasureType = this.selectTreasureType();
        const treasureValue = this.config.treasureRarities[treasureType].baseValue;
        
        return {
            type: treasureType,
            amount: Math.floor(bonusAmount / treasureValue) || 1,
            source: 'activity_bonus',
            narrative: `Your adventurous spirit has earned you extra ${treasureType}!`,
            algorithm: 'activity'
        };
    }
    
    /**
     * Calculate social interaction rewards
     */
    calculateSocialReward(playerId) {
        const activity = this.activityTracking.get(playerId);
        if (!activity || activity.socialInteractions === 0) return { amount: 0 };
        
        const socialBonus = activity.socialInteractions * this.config.socialMultiplier;
        const treasureType = this.selectTreasureType();
        const treasureValue = this.config.treasureRarities[treasureType].baseValue;
        
        return {
            type: treasureType,
            amount: Math.floor(socialBonus / treasureValue) || 1,
            source: 'social_reward',
            narrative: `Your camaraderie with fellow pirates has earned you ${treasureType}!`,
            algorithm: 'social'
        };
    }
    
    /**
     * Calculate time-based reward
     */
    calculateTemporalReward(playerId) {
        const activity = this.activityTracking.get(playerId);
        if (!activity) return { amount: 0 };
        
        const timeAtSea = Date.now() - activity.firstSeen;
        const hoursAtSea = timeAtSea / (1000 * 60 * 60);
        
        // Award based on time spent in game (but cap it to prevent exploitation)
        const temporalBonus = Math.min(hoursAtSea * 2, 50);
        
        if (temporalBonus < 1) return { amount: 0 };
        
        const treasureType = this.selectTreasureType();
        const treasureValue = this.config.treasureRarities[treasureType].baseValue;
        
        return {
            type: treasureType,
            amount: Math.floor(temporalBonus / treasureValue) || 1,
            source: 'temporal_reward',
            narrative: `Your experience as a seasoned sailor brings you ${treasureType}!`,
            algorithm: 'temporal'
        };
    }
    
    /**
     * Distribute treasure to player (main reward function)
     */
    async distributeTreasure(playerId, reward) {
        const rewardId = crypto.randomUUID();
        
        // Create complete reward record
        const treasureReward = {
            id: rewardId,
            playerId,
            type: reward.type,
            amount: reward.amount,
            source: reward.source,
            narrative: reward.narrative,
            algorithm: reward.algorithm,
            timestamp: new Date().toISOString(),
            rarity: this.config.treasureRarities[reward.type]?.weight || 1,
            value: this.config.treasureRarities[reward.type]?.baseValue * reward.amount || reward.amount
        };
        
        // Update player totals
        const playerTotal = this.playerRewards.get(playerId) || {
            totalTreasure: 0,
            treasureByType: {},
            lastReward: null,
            rewardCount: 0
        };
        
        playerTotal.totalTreasure += treasureReward.value;
        playerTotal.treasureByType[reward.type] = (playerTotal.treasureByType[reward.type] || 0) + reward.amount;
        playerTotal.lastReward = treasureReward.timestamp;
        playerTotal.rewardCount++;
        
        this.playerRewards.set(playerId, playerTotal);
        this.rewardHistory.set(rewardId, treasureReward);
        
        // Connect to Satoshi system if available
        if (this.satoshiSystem) {
            await this.satoshiSystem.distributeReward({
                userId: playerId,
                amount: treasureReward.value,
                type: 'pirate_treasure',
                metadata: treasureReward
            });
        }
        
        // Emit reward event
        this.emit('treasure:distributed', treasureReward);
        
        console.log(`💎 ${playerId} received ${reward.amount} ${reward.type} (${reward.source})`);
        
        return treasureReward;
    }
    
    /**
     * Track player activity for reward calculations
     */
    trackActivity(playerId, activityType, details = {}) {
        const activity = this.activityTracking.get(playerId) || this.createActivityTracker(playerId);
        
        // Update activity based on type
        switch (activityType) {
            case 'quest_complete':
                activity.questsCompleted++;
                activity.lastQuestCompletion = Date.now();
                break;
                
            case 'combat':
                activity.combatActions++;
                activity.lastCombat = Date.now();
                break;
                
            case 'exploration':
                activity.explorationPoints++;
                if (details.newLocation) {
                    activity.newLocationsVisited++;
                }
                break;
                
            case 'social':
                activity.socialInteractions++;
                break;
                
            case 'ship_movement':
                activity.distanceTraveled += details.distance || 1;
                break;
        }
        
        activity.lastSeen = Date.now();
        activity.totalActions++;
        
        this.activityTracking.set(playerId, activity);
        
        this.emit('activity:tracked', {
            playerId,
            activityType,
            details,
            totalActions: activity.totalActions
        });
    }
    
    /**
     * Create treasure pools for group activities
     */
    createTreasurePool(poolId, config) {
        const pool = {
            id: poolId,
            type: config.type || 'group_quest',
            participants: new Set(),
            totalTreasure: 0,
            treasureTypes: {},
            createdAt: Date.now(),
            distributionRule: config.distributionRule || 'equal',
            minParticipants: config.minParticipants || 2,
            status: 'active'
        };
        
        this.treasurePool.set(poolId, pool);
        
        console.log(`🏴‍☠️ Treasure pool created: ${poolId} (${config.type})`);
        
        return pool;
    }
    
    /**
     * Add treasure to pool
     */
    addToTreasurePool(poolId, treasureType, amount) {
        const pool = this.treasurePool.get(poolId);
        if (!pool || pool.status !== 'active') return false;
        
        pool.totalTreasure += amount;
        pool.treasureTypes[treasureType] = (pool.treasureTypes[treasureType] || 0) + amount;
        
        this.emit('pool:treasure_added', {
            poolId,
            treasureType,
            amount,
            poolTotal: pool.totalTreasure
        });
        
        return true;
    }
    
    /**
     * Distribute treasure pool to participants
     */
    async distributeTreasurePool(poolId) {
        const pool = this.treasurePool.get(poolId);
        if (!pool || pool.participants.size < pool.minParticipants) return false;
        
        const participants = Array.from(pool.participants);
        
        // Distribute based on rule
        switch (pool.distributionRule) {
            case 'equal':
                await this.distributePoolEqually(pool, participants);
                break;
                
            case 'contribution':
                await this.distributePoolByContribution(pool, participants);
                break;
                
            case 'random':
                await this.distributePoolRandomly(pool, participants);
                break;
        }
        
        pool.status = 'distributed';
        
        this.emit('pool:distributed', {
            poolId,
            participants: participants.length,
            totalTreasure: pool.totalTreasure
        });
        
        return true;
    }
    
    /**
     * Get player's treasure summary
     */
    getPlayerTreasureSummary(playerId) {
        const playerData = this.playerRewards.get(playerId);
        const activity = this.activityTracking.get(playerId);
        
        if (!playerData) {
            return {
                playerId,
                totalTreasure: 0,
                treasureByType: {},
                rewardCount: 0,
                status: 'new_player'
            };
        }
        
        return {
            playerId,
            totalTreasure: playerData.totalTreasure,
            treasureByType: playerData.treasureByType,
            lastReward: playerData.lastReward,
            rewardCount: playerData.rewardCount,
            activity: activity ? {
                questsCompleted: activity.questsCompleted,
                combatActions: activity.combatActions,
                explorationPoints: activity.explorationPoints,
                socialInteractions: activity.socialInteractions,
                totalActions: activity.totalActions,
                timeAtSea: Date.now() - activity.firstSeen
            } : null,
            status: 'active_pirate'
        };
    }
    
    /**
     * Get system statistics
     */
    getSystemStats() {
        const totalPlayers = this.playerRewards.size;
        const totalRewards = this.rewardHistory.size;
        
        let totalTreasureValue = 0;
        const treasureDistribution = {};
        
        for (const [playerId, data] of this.playerRewards) {
            totalTreasureValue += data.totalTreasure;
            
            for (const [type, amount] of Object.entries(data.treasureByType)) {
                treasureDistribution[type] = (treasureDistribution[type] || 0) + amount;
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            totalPlayers,
            totalRewards,
            totalTreasureValue,
            treasureDistribution,
            averageTreasurePerPlayer: totalPlayers > 0 ? totalTreasureValue / totalPlayers : 0,
            activePools: Array.from(this.treasurePool.values()).filter(p => p.status === 'active').length,
            rewardAlgorithms: Object.keys(this.rewardAlgorithms),
            treasureTypes: Object.keys(this.config.treasureRarities)
        };
    }
    
    // Helper methods
    createActivityTracker(playerId) {
        const tracker = {
            playerId,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            questsCompleted: 0,
            combatActions: 0,
            explorationPoints: 0,
            socialInteractions: 0,
            distanceTraveled: 0,
            newLocationsVisited: 0,
            lastQuestCompletion: null,
            lastCombat: null,
            totalActions: 0
        };
        
        this.activityTracking.set(playerId, tracker);
        return tracker;
    }
    
    isPlayerActive(playerId) {
        const activity = this.activityTracking.get(playerId);
        if (!activity) return false;
        
        // Player is active if they've done something in the last 10 minutes
        return (Date.now() - activity.lastSeen) < 600000;
    }
    
    selectTreasureType() {
        const rarities = this.config.treasureRarities;
        const totalWeight = Object.values(rarities).reduce((sum, r) => sum + r.weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (const [type, config] of Object.entries(rarities)) {
            currentWeight += config.weight;
            if (random <= currentWeight) {
                return type;
            }
        }
        
        return 'cursed_doubloons'; // Fallback
    }
    
    getTreasureNarrative(treasureType) {
        const narratives = this.treasureNarratives[treasureType] || [
            `You've discovered some ${treasureType}!`
        ];
        
        return narratives[Math.floor(Math.random() * narratives.length)];
    }
    
    async distributePoolEqually(pool, participants) {
        for (const [treasureType, amount] of Object.entries(pool.treasureTypes)) {
            const amountPerPlayer = Math.floor(amount / participants.length);
            if (amountPerPlayer > 0) {
                for (const playerId of participants) {
                    await this.distributeTreasure(playerId, {
                        type: treasureType,
                        amount: amountPerPlayer,
                        source: 'treasure_pool',
                        narrative: `Your share of the ${pool.type} treasure: ${amountPerPlayer} ${treasureType}!`,
                        algorithm: 'pool_distribution'
                    });
                }
            }
        }
    }
    
    async distributePoolByContribution(pool, participants) {
        // For now, equal distribution - would need contribution tracking
        await this.distributePoolEqually(pool, participants);
    }
    
    async distributePoolRandomly(pool, participants) {
        for (const [treasureType, amount] of Object.entries(pool.treasureTypes)) {
            // Give random amounts to random players
            let remainingAmount = amount;
            while (remainingAmount > 0 && participants.length > 0) {
                const randomPlayer = participants[Math.floor(Math.random() * participants.length)];
                const randomAmount = Math.min(Math.floor(Math.random() * 10) + 1, remainingAmount);
                
                await this.distributeTreasure(randomPlayer, {
                    type: treasureType,
                    amount: randomAmount,
                    source: 'random_pool',
                    narrative: `Fortune smiles upon you! Random treasure: ${randomAmount} ${treasureType}!`,
                    algorithm: 'random_distribution'
                });
                
                remainingAmount -= randomAmount;
            }
        }
    }
    
    createMockSatoshiSystem() {
        return {
            distributeReward: async (reward) => {
                console.log(`🪙 Mock Satoshi system: ${reward.amount} to ${reward.userId}`);
                return { success: true, txId: crypto.randomUUID() };
            }
        };
    }
}

export default PirateLootBridge;

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const lootBridge = new PirateLootBridge({
        baseRewardInterval: 10000, // 10 seconds for demo
        maxRewardPerInterval: 50,
        enableContinuousRewards: true,
        enableActivityBasedBonus: true,
        enableSocialRewards: true
    });
    
    lootBridge.on('treasure:distributed', (reward) => {
        console.log(`💰 ${reward.playerId}: ${reward.amount} ${reward.type} (${reward.source})`);
        console.log(`   📖 ${reward.narrative}`);
    });
    
    lootBridge.on('activity:tracked', (activity) => {
        console.log(`📊 ${activity.playerId} performed ${activity.activityType} (total: ${activity.totalActions})`);
    });
    
    lootBridge.on('pool:distributed', (pool) => {
        console.log(`🏴‍☠️ Treasure pool ${pool.poolId} distributed to ${pool.participants} pirates`);
    });
    
    lootBridge.initialize().then(async () => {
        console.log('\n💰 PIRATE LOOT BRIDGE ACTIVE!');
        
        // Simulate player activities
        const players = ['player1', 'player2', 'player3'];
        
        players.forEach(playerId => {
            // Track various activities
            lootBridge.trackActivity(playerId, 'quest_complete');
            lootBridge.trackActivity(playerId, 'exploration', { newLocation: true });
            lootBridge.trackActivity(playerId, 'social');
            lootBridge.trackActivity(playerId, 'combat');
        });
        
        // Create a treasure pool
        const pool = lootBridge.createTreasurePool('group_quest_1', {
            type: 'raid_treasure',
            distributionRule: 'equal',
            minParticipants: 2
        });
        
        // Add participants
        players.forEach(playerId => {
            pool.participants.add(playerId);
        });
        
        // Add treasure to pool
        lootBridge.addToTreasurePool('group_quest_1', 'golden_escudos', 100);
        lootBridge.addToTreasurePool('group_quest_1', 'crystal_gems', 10);
        
        // Wait a bit then distribute pool
        setTimeout(async () => {
            await lootBridge.distributeTreasurePool('group_quest_1');
            
            // Show final stats
            console.log('\n📊 FINAL STATS:');
            const stats = lootBridge.getSystemStats();
            console.log(`   Total players: ${stats.totalPlayers}`);
            console.log(`   Total rewards: ${stats.totalRewards}`);
            console.log(`   Total treasure value: ${stats.totalTreasureValue}`);
            console.log(`   Average per player: ${stats.averageTreasurePerPlayer.toFixed(2)}`);
            
            // Show individual player summaries
            console.log('\n🏴‍☠️ PLAYER SUMMARIES:');
            players.forEach(playerId => {
                const summary = lootBridge.getPlayerTreasureSummary(playerId);
                console.log(`   ${playerId}: ${summary.totalTreasure} total treasure, ${summary.rewardCount} rewards`);
                Object.entries(summary.treasureByType).forEach(([type, amount]) => {
                    console.log(`      ${amount} ${type}`);
                });
            });
        }, 5000);
    });
}

console.log('💰 PIRATE LOOT BRIDGE LOADED');
console.log('🏴‍☠️ Ready to distribute treasure like the tide!');