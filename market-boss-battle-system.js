#!/usr/bin/env node

/**
 * 🐉 MARKET BOSS BATTLE SYSTEM
 * 
 * Converts real market arbitrage opportunities into epic boss battles
 * Fight the DoorDash Dragon, defeat the Freight Kraken, slay the API Beast!
 * Real market data = Boss stats, Real savings = Loot drops
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class MarketBossBattleSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            battleInterval: config.battleInterval || 30000, // 30 seconds
            maxActiveBosses: config.maxActiveBosses || 5,
            difficultyMultiplier: config.difficultyMultiplier || 1.0,
            ...config
        };
        
        // Boss Templates - Each represents a different market type
        this.bossTemplates = {
            'doordash_dragon': {
                name: 'DoorDash Dragon 🐲',
                type: 'food_delivery',
                baseHP: 1000,
                baseDamage: 150,
                element: 'fire',
                weaknesses: ['time_efficiency', 'bulk_orders'],
                abilities: ['Surge Pricing Breath', 'Delivery Fee Slam', 'Restaurant Monopoly'],
                lootTable: {
                    common: ['Small Delivery Discount', 'Free Delivery Coupon'],
                    uncommon: ['Restaurant Credits', 'Priority Delivery Pass'],
                    rare: ['Ghost Kitchen Access', 'Bulk Order Multiplier'],
                    legendary: ['Platform Partnership Deal', 'Exclusive Restaurant Rights']
                },
                description: 'A fierce dragon that hoards delivery fees and breathes surge pricing flames',
                battleCry: 'Your hunger will cost you dearly, mortal!'
            },
            
            'freight_kraken': {
                name: 'Freight Kraken 🐙',
                type: 'shipping',
                baseHP: 2500,
                baseDamage: 300,
                element: 'water',
                weaknesses: ['route_optimization', 'container_efficiency'],
                abilities: ['Port Congestion Grip', 'Shipping Lane Whirlpool', 'Container Crush'],
                lootTable: {
                    common: ['Small Shipping Discount', 'Express Delivery Voucher'],
                    uncommon: ['Container Space Optimization', 'Port Priority Access'],
                    rare: ['Direct Shipping Route', 'Bulk Container Rates'],
                    legendary: ['Freight Network Control', 'Global Shipping Monopoly']
                },
                description: 'An ancient sea beast controlling global shipping lanes and cargo routes',
                battleCry: 'The seas belong to me! Your cargo will sink to the depths!'
            },
            
            'api_beast': {
                name: 'API Beast 🤖',
                type: 'technology',
                baseHP: 800,
                baseDamage: 200,
                element: 'electric',
                weaknesses: ['rate_limiting', 'caching_strategies'],
                abilities: ['Rate Limit Storm', 'Token Drain', 'Latency Spike'],
                lootTable: {
                    common: ['API Credits', 'Reduced Latency'],
                    uncommon: ['Premium Endpoints', 'Higher Rate Limits'],
                    rare: ['Custom API Access', 'Enterprise Features'],
                    legendary: ['API Partnership', 'White-label Solution']
                },
                description: 'A digital entity that feeds on API calls and grows stronger with each request',
                battleCry: 'Your tokens are mine! Prepare for infinite loops!'
            },
            
            'energy_elemental': {
                name: 'Energy Elemental ⚡',
                type: 'energy',
                baseHP: 1500,
                baseDamage: 250,
                element: 'lightning',
                weaknesses: ['renewable_sources', 'peak_hour_management'],
                abilities: ['Blackout Blast', 'Price Spike Surge', 'Grid Overload'],
                lootTable: {
                    common: ['Energy Credits', 'Off-Peak Rates'],
                    uncommon: ['Green Energy Access', 'Peak Hour Exemption'],
                    rare: ['Direct Grid Connection', 'Energy Storage Rights'],
                    legendary: ['Power Plant Partnership', 'Grid Control Authority']
                },
                description: 'A volatile being of pure energy that manipulates power grids and pricing',
                battleCry: 'Feel the power of a thousand lightning bolts!'
            },
            
            'real_estate_golem': {
                name: 'Real Estate Golem 🏢',
                type: 'real_estate',
                baseHP: 3000,
                baseDamage: 180,
                element: 'earth',
                weaknesses: ['market_timing', 'location_analysis'],
                abilities: ['Property Crush', 'Market Bubble', 'Zoning Restriction'],
                lootTable: {
                    common: ['Property Listing Access', 'Market Analysis Report'],
                    uncommon: ['Pre-Market Listings', 'Agent Network Access'],
                    rare: ['Investment Property Rights', 'Development Permits'],
                    legendary: ['Property Empire', 'Market Manipulation Control']
                },
                description: 'A massive stone creature built from bricks and mortar of countless properties',
                battleCry: 'This land is MINE! Your offers will be crushed like pebbles!'
            }
        };
        
        // Active bosses currently spawned
        this.activeBosses = new Map();
        
        // Battle sessions (players fighting bosses)
        this.battleSessions = new Map();
        
        // Player stats and inventory
        this.players = new Map();
        
        // Market data integration
        this.marketData = {
            arbitrageOpportunities: [],
            priceVolatility: new Map(),
            marketTrends: new Map()
        };
        
        // Battle statistics
        this.stats = {
            bossesSpawned: 0,
            bossesDefeated: 0,
            totalLootDropped: 0,
            totalSavingsGenerated: 0,
            activeBattles: 0,
            playersParticipating: 0
        };
        
        console.log('🐉 Initializing Market Boss Battle System...');
        this.initialize();
    }
    
    async initialize() {
        // Start the boss spawning system
        this.startBossSpawner();
        
        // Initialize battle mechanics
        this.setupBattleMechanics();
        
        // Connect to market data sources
        await this.connectToMarketSources();
        
        console.log('✅ Market Boss Battle System ready!');
        console.log(`🎮 Battle Arena: ${Object.keys(this.bossTemplates).length} boss types available`);
        console.log(`⚔️ Max concurrent bosses: ${this.config.maxActiveBosses}`);
        
        this.emit('battle_system_ready');
    }
    
    async connectToMarketSources() {
        // This would connect to the real arbitrage engines
        console.log('🔗 Connecting to market data sources...');
        
        // Simulate market data updates
        setInterval(() => {
            this.updateMarketData();
        }, 10000); // Update every 10 seconds
    }
    
    updateMarketData() {
        // Simulate receiving arbitrage opportunities from real engines
        const mockOpportunities = [
            {
                type: 'food_delivery',
                savings: 12.50,
                difficulty: 0.3,
                platform: 'doordash',
                description: 'DoorDash 40% cheaper than Uber Eats for Korean BBQ'
            },
            {
                type: 'shipping',
                savings: 2400.00,
                difficulty: 0.8,
                platform: 'freight_network',
                description: 'Shanghai → LA container 15% discount available'
            },
            {
                type: 'technology',
                savings: 0.015,
                difficulty: 0.2,
                platform: 'api_pricing',
                description: 'OpenAI vs Anthropic token arbitrage'
            }
        ];
        
        this.marketData.arbitrageOpportunities = mockOpportunities;
        
        // Update price volatility (affects boss spawn rates)
        mockOpportunities.forEach(opp => {
            this.marketData.priceVolatility.set(opp.type, Math.random() * 0.5 + 0.1);
        });
        
        // Check if new bosses should spawn
        this.checkBossSpawnConditions();
    }
    
    startBossSpawner() {
        // Spawn bosses based on market conditions
        setInterval(() => {
            this.spawnBossesFromMarketData();
        }, this.config.battleInterval);
        
        console.log(`🕒 Boss spawner active - checking every ${this.config.battleInterval / 1000} seconds`);
    }
    
    spawnBossesFromMarketData() {
        if (this.activeBosses.size >= this.config.maxActiveBosses) {
            return; // Arena full
        }
        
        // Check each arbitrage opportunity
        for (const opportunity of this.marketData.arbitrageOpportunities) {
            const shouldSpawn = this.calculateSpawnProbability(opportunity);
            
            if (shouldSpawn && Math.random() < 0.3) { // 30% chance per check
                const boss = this.spawnBoss(opportunity);
                if (boss) {
                    console.log(`🐉 ${boss.name} has spawned! Savings: $${opportunity.savings}`);
                    this.emit('boss_spawned', boss, opportunity);
                }
            }
        }
    }
    
    calculateSpawnProbability(opportunity) {
        // Higher savings = higher spawn probability
        const savingsMultiplier = Math.min(opportunity.savings / 100, 2.0);
        
        // Market volatility affects spawn rate
        const volatility = this.marketData.priceVolatility.get(opportunity.type) || 0.1;
        
        // Difficulty affects spawn probability (harder = rarer but better rewards)
        const difficultyFactor = 1 - (opportunity.difficulty * 0.5);
        
        return savingsMultiplier * volatility * difficultyFactor > 0.5;
    }
    
    spawnBoss(opportunity) {
        // Find appropriate boss template
        const bossType = this.getBossTypeForOpportunity(opportunity);
        const template = this.bossTemplates[bossType];
        
        if (!template) {
            console.error(`No boss template found for type: ${bossType}`);
            return null;
        }
        
        // Create boss instance with stats based on market data
        const boss = this.createBossFromTemplate(template, opportunity);
        
        // Add to active bosses
        this.activeBosses.set(boss.id, boss);
        this.stats.bossesSpawned++;
        
        return boss;
    }
    
    getBossTypeForOpportunity(opportunity) {
        const typeMapping = {
            'food_delivery': 'doordash_dragon',
            'shipping': 'freight_kraken',
            'technology': 'api_beast',
            'energy': 'energy_elemental',
            'real_estate': 'real_estate_golem'
        };
        
        return typeMapping[opportunity.type] || 'doordash_dragon';
    }
    
    createBossFromTemplate(template, opportunity) {
        const difficultyMultiplier = 1 + (opportunity.difficulty * this.config.difficultyMultiplier);
        const savingsMultiplier = Math.max(1, opportunity.savings / 10);
        
        const boss = {
            id: crypto.randomUUID(),
            ...template,
            
            // Stats scaled by market data
            hp: Math.floor(template.baseHP * difficultyMultiplier),
            maxHP: Math.floor(template.baseHP * difficultyMultiplier),
            damage: Math.floor(template.baseDamage * difficultyMultiplier),
            
            // Market-specific data
            linkedOpportunity: opportunity,
            potentialSavings: opportunity.savings,
            spawnTime: Date.now(),
            
            // Battle state
            currentHP: Math.floor(template.baseHP * difficultyMultiplier),
            status: 'active',
            battlers: new Set(),
            
            // Loot scaling
            lootMultiplier: savingsMultiplier,
            
            // Battle mechanics
            lastAttack: 0,
            abilityCharges: 3,
            enraged: false
        };
        
        return boss;
    }
    
    setupBattleMechanics() {
        // Battle tick system - process all active battles
        setInterval(() => {
            this.processBattleTick();
        }, 1000); // 1 second tick rate
    }
    
    processBattleTick() {
        for (const [bossId, boss] of this.activeBosses) {
            if (boss.battlers.size > 0) {
                this.processBossBattle(boss);
            } else {
                // Check if boss should despawn (no battlers for too long)
                if (Date.now() - boss.spawnTime > 300000) { // 5 minutes
                    this.despawnBoss(bossId, 'timeout');
                }
            }
        }
    }
    
    processBossBattle(boss) {
        const now = Date.now();
        
        // Boss attacks every 3 seconds
        if (now - boss.lastAttack > 3000) {
            this.executeBossAttack(boss);
            boss.lastAttack = now;
        }
        
        // Check if boss is defeated
        if (boss.currentHP <= 0) {
            this.defeatBoss(boss);
        }
        
        // Enrage if below 25% HP
        if (boss.currentHP / boss.maxHP < 0.25 && !boss.enraged) {
            boss.enraged = true;
            boss.damage *= 1.5;
            this.emit('boss_enraged', boss);
            console.log(`🔥 ${boss.name} has entered ENRAGE mode!`);
        }
    }
    
    executeBossAttack(boss) {
        const battlers = Array.from(boss.battlers);
        if (battlers.length === 0) return;
        
        // Choose random ability or basic attack
        const useAbility = Math.random() < 0.3 && boss.abilityCharges > 0;
        
        if (useAbility) {
            const ability = boss.abilities[Math.floor(Math.random() * boss.abilities.length)];
            const damage = boss.damage * 1.5;
            
            boss.abilityCharges--;
            
            // Attack all battlers with ability
            battlers.forEach(playerId => {
                this.dealDamageToPlayer(playerId, damage, boss, ability);
            });
            
            console.log(`💥 ${boss.name} uses ${ability}! Deals ${damage} damage to all battlers!`);
        } else {
            // Basic attack on random target
            const target = battlers[Math.floor(Math.random() * battlers.length)];
            this.dealDamageToPlayer(target, boss.damage, boss, 'Basic Attack');
        }
        
        this.emit('boss_attack', {
            boss: boss,
            damage: boss.damage,
            ability: useAbility ? boss.abilities[0] : 'Basic Attack'
        });
    }
    
    dealDamageToPlayer(playerId, damage, boss, attack) {
        const player = this.getOrCreatePlayer(playerId);
        
        // Apply damage reduction based on player level/gear
        const actualDamage = Math.max(1, damage - player.defense);
        player.hp = Math.max(0, player.hp - actualDamage);
        
        console.log(`⚔️ ${boss.name} hits ${playerId} with ${attack} for ${actualDamage} damage! (HP: ${player.hp}/${player.maxHP})`);
        
        // Check if player is defeated
        if (player.hp <= 0) {
            this.removePlayerFromBattle(playerId, boss.id);
            this.emit('player_defeated', { playerId, boss: boss });
        }
    }
    
    defeatBoss(boss) {
        console.log(`🏆 ${boss.name} has been defeated!`);
        
        // Calculate loot for all battlers
        const loot = this.calculateBossLoot(boss);
        
        // Distribute loot to all participants
        boss.battlers.forEach(playerId => {
            this.distributeLoot(playerId, loot, boss);
        });
        
        // Update stats
        this.stats.bossesDefeated++;
        this.stats.totalSavingsGenerated += boss.potentialSavings;
        
        // Remove boss from active list
        this.despawnBoss(boss.id, 'defeated');
        
        this.emit('boss_defeated', {
            boss: boss,
            loot: loot,
            participants: Array.from(boss.battlers)
        });
    }
    
    calculateBossLoot(boss) {
        const loot = {
            common: [],
            uncommon: [],
            rare: [],
            legendary: [],
            realSavings: boss.potentialSavings,
            xp: Math.floor(boss.maxHP / 10),
            coins: Math.floor(boss.potentialSavings * 100)
        };
        
        // Roll for each rarity tier
        const rarityChances = {
            common: 0.8,
            uncommon: 0.4,
            rare: 0.15,
            legendary: 0.03
        };
        
        Object.entries(rarityChances).forEach(([rarity, chance]) => {
            if (Math.random() < chance * boss.lootMultiplier) {
                const possibleLoot = boss.lootTable[rarity];
                const droppedItem = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
                loot[rarity].push(droppedItem);
            }
        });
        
        this.stats.totalLootDropped += Object.values(loot).flat().length;
        
        return loot;
    }
    
    distributeLoot(playerId, loot, boss) {
        const player = this.getOrCreatePlayer(playerId);
        
        // Add XP and coins
        player.xp += loot.xp;
        player.coins += loot.coins;
        
        // Add items to inventory
        Object.entries(loot).forEach(([rarity, items]) => {
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (!player.inventory[rarity]) player.inventory[rarity] = [];
                    player.inventory[rarity].push({
                        name: item,
                        source: boss.name,
                        realValue: loot.realSavings,
                        timestamp: Date.now()
                    });
                });
            }
        });
        
        // Level up check
        const newLevel = Math.floor(Math.sqrt(player.xp / 100)) + 1;
        if (newLevel > player.level) {
            player.level = newLevel;
            player.maxHP = 100 + (player.level * 20);
            player.hp = player.maxHP; // Full heal on level up
            player.defense = Math.floor(player.level / 2);
            
            this.emit('player_level_up', { playerId, newLevel, player });
        }
        
        console.log(`🎁 ${playerId} receives loot from ${boss.name}:`)
        console.log(`   💰 ${loot.coins} coins, ⭐ ${loot.xp} XP`)
        console.log(`   💵 Real savings: $${loot.realSavings}`)
        
        this.emit('loot_distributed', { playerId, loot, boss, player });
    }
    
    despawnBoss(bossId, reason = 'unknown') {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return;
        
        // Remove all battlers
        boss.battlers.forEach(playerId => {
            this.removePlayerFromBattle(playerId, bossId);
        });
        
        this.activeBosses.delete(bossId);
        
        console.log(`👻 ${boss.name} despawned (${reason})`);
        this.emit('boss_despawned', { boss, reason });
    }
    
    // Player interaction methods
    joinBattle(playerId, bossId) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return { success: false, error: 'Boss not found' };
        
        const player = this.getOrCreatePlayer(playerId);
        
        // Check if player is already in battle
        if (boss.battlers.has(playerId)) {
            return { success: false, error: 'Already in battle' };
        }
        
        // Check if player is alive
        if (player.hp <= 0) {
            return { success: false, error: 'Player defeated - wait for respawn' };
        }
        
        boss.battlers.add(playerId);
        this.stats.activeBattles = this.activeBosses.size;
        this.stats.playersParticipating = new Set(
            Array.from(this.activeBosses.values())
                .flatMap(b => Array.from(b.battlers))
        ).size;
        
        console.log(`⚔️ ${playerId} joined battle against ${boss.name}!`);
        
        this.emit('player_joined_battle', { playerId, boss, player });
        
        return {
            success: true,
            boss: boss,
            player: player,
            message: `${boss.battleCry}`,
            estimatedReward: boss.potentialSavings
        };
    }
    
    attackBoss(playerId, bossId, attackType = 'basic') {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return { success: false, error: 'Boss not found' };
        
        if (!boss.battlers.has(playerId)) {
            return { success: false, error: 'Not in battle - join first' };
        }
        
        const player = this.getOrCreatePlayer(playerId);
        if (player.hp <= 0) {
            return { success: false, error: 'Player defeated' };
        }
        
        // Calculate damage based on player level and attack type
        let damage = 50 + (player.level * 10);
        
        // Attack type modifiers
        const attackModifiers = {
            'basic': 1.0,
            'heavy': 1.5,
            'critical': 2.0,
            'exploit_weakness': 3.0
        };
        
        damage *= attackModifiers[attackType] || 1.0;
        
        // Check for weakness exploitation
        if (attackType === 'exploit_weakness') {
            // This would require understanding boss weaknesses
            console.log(`💡 ${playerId} exploits ${boss.name}'s weakness!`);
        }
        
        // Apply damage to boss
        boss.currentHP = Math.max(0, boss.currentHP - damage);
        
        console.log(`⚔️ ${playerId} deals ${damage} damage to ${boss.name}! (${boss.currentHP}/${boss.maxHP} HP)`);
        
        this.emit('player_attack', {
            playerId,
            boss,
            damage,
            attackType,
            bossHP: boss.currentHP
        });
        
        return {
            success: true,
            damage: damage,
            bossHP: boss.currentHP,
            bossMaxHP: boss.maxHP,
            attackType: attackType
        };
    }
    
    leaveBattle(playerId, bossId) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return { success: false, error: 'Boss not found' };
        
        this.removePlayerFromBattle(playerId, bossId);
        
        return { success: true, message: 'Left battle safely' };
    }
    
    removePlayerFromBattle(playerId, bossId) {
        const boss = this.activeBosses.get(bossId);
        if (boss) {
            boss.battlers.delete(playerId);
        }
        
        // Update stats
        this.stats.playersParticipating = new Set(
            Array.from(this.activeBosses.values())
                .flatMap(b => Array.from(b.battlers))
        ).size;
        
        this.emit('player_left_battle', { playerId, bossId });
    }
    
    getOrCreatePlayer(playerId) {
        if (!this.players.has(playerId)) {
            this.players.set(playerId, {
                id: playerId,
                level: 1,
                xp: 0,
                hp: 120,
                maxHP: 120,
                defense: 0,
                coins: 0,
                inventory: {
                    common: [],
                    uncommon: [],
                    rare: [],
                    legendary: []
                },
                stats: {
                    bossesDefeated: 0,
                    totalDamageDealt: 0,
                    totalSavingsEarned: 0
                },
                lastRespawn: 0
            });
        }
        
        const player = this.players.get(playerId);
        
        // Auto-respawn after 30 seconds if defeated
        if (player.hp <= 0 && Date.now() - player.lastRespawn > 30000) {
            player.hp = player.maxHP;
            player.lastRespawn = Date.now();
            console.log(`💊 ${playerId} has respawned!`);
        }
        
        return player;
    }
    
    checkBossSpawnConditions() {
        // Additional spawn logic based on market conditions
        const highVolatilityMarkets = Array.from(this.marketData.priceVolatility.entries())
            .filter(([market, volatility]) => volatility > 0.3);
        
        if (highVolatilityMarkets.length > 2 && this.activeBosses.size < 3) {
            console.log('📈 High market volatility detected - increased boss spawn rate!');
            this.emit('high_volatility_event', highVolatilityMarkets);
        }
    }
    
    // API Methods for external integration
    getActiveBosses() {
        return Array.from(this.activeBosses.values()).map(boss => ({
            id: boss.id,
            name: boss.name,
            type: boss.type,
            hp: boss.currentHP,
            maxHP: boss.maxHP,
            potentialSavings: boss.potentialSavings,
            battlers: boss.battlers.size,
            spawnTime: boss.spawnTime,
            enraged: boss.enraged,
            description: boss.description
        }));
    }
    
    getPlayerStats(playerId) {
        return this.getOrCreatePlayer(playerId);
    }
    
    getBattleSystemStats() {
        return {
            ...this.stats,
            activeBosses: this.activeBosses.size,
            totalPlayers: this.players.size,
            marketOpportunities: this.marketData.arbitrageOpportunities.length
        };
    }
    
    getLeaderboard() {
        return Array.from(this.players.values())
            .sort((a, b) => b.stats.totalSavingsEarned - a.stats.totalSavingsEarned)
            .slice(0, 10)
            .map((player, index) => ({
                rank: index + 1,
                playerId: player.id,
                level: player.level,
                totalSavings: player.stats.totalSavingsEarned,
                bossesDefeated: player.stats.bossesDefeated,
                coins: player.coins
            }));
    }
    
    // Integration with Master Arbitrage Orchestrator
    async processArbitrageForBossBattle(arbitrageData) {
        console.log('📊 Processing arbitrage data for boss battles...');
        
        // Convert arbitrage opportunities to potential boss spawns
        const processedOpportunities = arbitrageData.map(opp => ({
            type: this.classifyArbitrageType(opp),
            savings: opp.profitPotential || opp.savings || 0,
            difficulty: this.calculateDifficulty(opp),
            platform: opp.source || 'unknown',
            description: opp.description || 'Unknown arbitrage opportunity',
            originalData: opp
        }));
        
        this.marketData.arbitrageOpportunities = processedOpportunities;
        
        return {
            processed: processedOpportunities.length,
            potentialBosses: processedOpportunities.filter(opp => opp.savings > 5).length,
            totalValue: processedOpportunities.reduce((sum, opp) => sum + opp.savings, 0)
        };
    }
    
    classifyArbitrageType(arbitrage) {
        const keywords = arbitrage.description?.toLowerCase() || '';
        
        if (keywords.includes('delivery') || keywords.includes('food') || keywords.includes('doordash')) {
            return 'food_delivery';
        }
        if (keywords.includes('freight') || keywords.includes('shipping') || keywords.includes('container')) {
            return 'shipping';
        }
        if (keywords.includes('api') || keywords.includes('token') || keywords.includes('endpoint')) {
            return 'technology';
        }
        if (keywords.includes('energy') || keywords.includes('power') || keywords.includes('electric')) {
            return 'energy';
        }
        if (keywords.includes('real estate') || keywords.includes('property') || keywords.includes('rent')) {
            return 'real_estate';
        }
        
        return 'food_delivery'; // Default
    }
    
    calculateDifficulty(arbitrage) {
        const baseValue = arbitrage.profitPotential || arbitrage.savings || 0;
        const timeWindow = arbitrage.timeWindow || 'unknown';
        const riskLevel = arbitrage.riskLevel || 'medium';
        
        let difficulty = 0.3; // Base difficulty
        
        // Higher value = higher difficulty
        if (baseValue > 1000) difficulty += 0.3;
        else if (baseValue > 100) difficulty += 0.2;
        else if (baseValue > 10) difficulty += 0.1;
        
        // Time sensitivity affects difficulty
        if (timeWindow === 'immediate') difficulty += 0.2;
        if (timeWindow === 'urgent') difficulty += 0.3;
        
        // Risk level affects difficulty
        if (riskLevel === 'high') difficulty += 0.3;
        else if (riskLevel === 'medium') difficulty += 0.1;
        
        return Math.min(1.0, difficulty);
    }
}

module.exports = MarketBossBattleSystem;

// Run if executed directly
if (require.main === module) {
    const battleSystem = new MarketBossBattleSystem();
    
    // Simulate some players joining battles
    setTimeout(() => {
        console.log('\n🎮 BATTLE SYSTEM DEMO');
        console.log('====================');
        
        const player1 = 'player_1';
        const player2 = 'player_2';
        
        // Show active bosses
        const bosses = battleSystem.getActiveBosses();
        if (bosses.length > 0) {
            const boss = bosses[0];
            console.log(`\n🐉 Boss Available: ${boss.name}`);
            console.log(`💰 Potential Savings: $${boss.potentialSavings}`);
            
            // Players join battle
            const result1 = battleSystem.joinBattle(player1, boss.id);
            const result2 = battleSystem.joinBattle(player2, boss.id);
            
            console.log(`⚔️ ${player1} joined battle: ${result1.success}`);
            console.log(`⚔️ ${player2} joined battle: ${result2.success}`);
            
            // Players attack
            setTimeout(() => {
                battleSystem.attackBoss(player1, boss.id, 'critical');
                battleSystem.attackBoss(player2, boss.id, 'exploit_weakness');
            }, 2000);
        }
        
        // Show stats every 10 seconds
        setInterval(() => {
            const stats = battleSystem.getBattleSystemStats();
            console.log(`\n📊 Battle Stats: ${stats.activeBosses} bosses, ${stats.playersParticipating} players, $${stats.totalSavingsGenerated.toFixed(2)} savings generated`);
        }, 10000);
        
    }, 5000);
    
    process.on('SIGINT', () => {
        console.log('\n\n🏰 Battle system shutting down! All bosses retreat to their lairs...\n');
        process.exit(0);
    });
}