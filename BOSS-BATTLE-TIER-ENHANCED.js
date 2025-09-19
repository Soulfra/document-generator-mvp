#!/usr/bin/env node

/**
 * ⚔️🐉 BOSS BATTLE TIER ENHANCED SYSTEM
 * Integrates tier-based damage system with existing boss battles
 * Dragons use magic+physical, lower tiers have restrictions
 */

const EventEmitter = require('events');
const TierBasedDamageSystem = require('./TIER-BASED-DAMAGE-SYSTEM.js');
const BossDamageTierIntegration = require('./BOSS-DAMAGE-TIER-INTEGRATION.js');
const GamingEconomySystem = require('./gaming-economy-system.js');

class BossBattleTierEnhanced extends EventEmitter {
    constructor(mudEngine, streamLayer) {
        super();
        
        this.mudEngine = mudEngine;
        this.streamLayer = streamLayer;
        this.economy = new GamingEconomySystem();
        
        // Initialize tier systems
        this.damageSystem = new TierBasedDamageSystem();
        this.tierIntegration = new BossDamageTierIntegration();
        
        // Enhanced boss definitions with tiers
        this.bosses = {
            // Tier 1 - Physical only
            'goblin_grunt': {
                name: '👺 Goblin Grunt',
                tier: 1,
                baseType: 'goblin',
                level: 2,
                health: 150,
                maxHealth: 150,
                lootTable: ['common_sword', 'goblin_ears', 'copper_coins'],
                spawnMessage: 'A goblin grunt appears, wielding a rusty blade!',
                deathMessage: 'The goblin collapses with a pathetic whimper.'
            },
            
            // Tier 2 - Physical + Ranged
            'elite_archer': {
                name: '🏹 Elite Archer',
                tier: 2,
                baseType: 'archer',
                level: 5,
                health: 300,
                maxHealth: 300,
                lootTable: ['enchanted_bow', 'piercing_arrows', 'leather_armor'],
                spawnMessage: 'An Elite Archer takes position, bow drawn!',
                deathMessage: 'The archer falls, bow clattering to the ground.'
            },
            
            // Tier 3 - Magic + Physical (DRAGONS!)
            'crimson_dragon': {
                name: '🐉 Crimson Dragon',
                tier: 3,
                baseType: 'dragon',
                element: 'fire',
                level: 10,
                health: 1000,
                maxHealth: 1000,
                lootTable: ['dragon_scale', 'flame_essence', 'legendary_sword'],
                spawnMessage: 'The ground trembles as a Crimson Dragon descends, flames licking its jaws!',
                deathMessage: 'With a final roar, the dragon crashes down, its flames extinguished forever.'
            },
            
            'frost_wyrm': {
                name: '❄️ Frost Wyrm',
                tier: 3,
                baseType: 'dragon',
                element: 'ice',
                level: 12,
                health: 1200,
                maxHealth: 1200,
                lootTable: ['frozen_scale', 'ice_crystal', 'frostbite_staff'],
                spawnMessage: 'Temperature plummets as the Frost Wyrm emerges, ice crystals forming in the air!',
                deathMessage: 'The Frost Wyrm shatters into a thousand ice shards.'
            },
            
            // Tier 4 - All damage types
            'ancient_dragon': {
                name: '👑 Ancient Dragon',
                tier: 4,
                baseType: 'ancient_dragon',
                level: 20,
                health: 2500,
                maxHealth: 2500,
                lootTable: ['legendary_essence', 'ancient_wisdom', 'godslayer_weapon'],
                spawnMessage: 'Reality warps as the Ancient Dragon materializes, power radiating from every scale!',
                deathMessage: 'The Ancient Dragon fades into legend, leaving only whispers of its might.'
            },
            
            // Tier 5 - All + Chaos
            'chaos_dragon': {
                name: '🌀 Chaos Dragon',
                tier: 5,
                baseType: 'chaos_dragon',
                level: 30,
                health: 5000,
                maxHealth: 5000,
                lootTable: ['chaos_fragment', 'reality_tear', 'infinity_gem'],
                spawnMessage: 'REALITY BREAKS! The Chaos Dragon emerges from dimensions unknown!',
                deathMessage: 'The Chaos Dragon dissipates across infinite realities...'
            },
            
            // Keep original bosses with tier assignments
            'cal_nightmare': {
                name: '💀 Cal Nightmare',
                tier: 3, // Magic + Physical (roasts and wisdom)
                baseType: 'unique',
                level: 5,
                health: 500,
                maxHealth: 500,
                lootTable: ['legendary_keyboard', 'epic_coffee_mug', 'rare_debugging_tool'],
                spawnMessage: 'The air grows thick with sarcasm... Cal Nightmare has awakened!',
                deathMessage: 'Cal Nightmare fades away, muttering "...even in death, your code still sucks..."'
            },
            
            'data_dragon': {
                name: '🐉 Data Dragon',
                tier: 3, // Magic + Physical dragon variant
                baseType: 'dragon',
                element: 'data',
                level: 8,
                health: 800,
                maxHealth: 800,
                lootTable: ['mythic_ssd', 'legendary_ram_stick', 'epic_database'],
                spawnMessage: 'The servers tremble as the Data Dragon emerges from the cloud!',
                deathMessage: 'Data Dragon crashes with a blue screen of death...'
            }
        };
        
        this.activeBattles = new Map();
        this.battleStats = new Map(); // Track damage type usage
        this.wikiEntries = new Map(); // Auto-generated wiki data
    }
    
    /**
     * Spawn a tier-enhanced boss
     */
    async spawnBoss(roomId, bossType, spawnedBy = 'system') {
        if (!this.bosses[bossType]) {
            throw new Error(`Unknown boss type: ${bossType}`);
        }
        
        const bossTemplate = this.bosses[bossType];
        
        // Create tiered boss using integration system
        const boss = await this.tierIntegration.createTieredBoss(
            bossTemplate.baseType,
            {
                name: bossTemplate.name,
                level: bossTemplate.level,
                element: bossTemplate.element,
                ...bossTemplate
            }
        );
        
        // Merge with template data
        Object.assign(boss, {
            id: `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            roomId,
            spawnTime: Date.now(),
            spawnedBy,
            currentPhase: 'spawn',
            participants: new Set(),
            viewerActions: new Map(),
            damageDealt: 0,
            lastAction: Date.now(),
            spawnMessage: bossTemplate.spawnMessage,
            deathMessage: bossTemplate.deathMessage,
            lootTable: bossTemplate.lootTable,
            
            // Track damage types used
            damageTypeStats: {
                physical: { dealt: 0, taken: 0, blocked: 0 },
                ranged: { dealt: 0, taken: 0, blocked: 0 },
                magic: { dealt: 0, taken: 0, blocked: 0 },
                true: { dealt: 0, taken: 0, blocked: 0 },
                chaos: { dealt: 0, taken: 0, blocked: 0 }
            }
        });
        
        // Create enhanced battle instance
        const battle = {
            boss,
            players: new Map(),
            status: 'active',
            phase: 'spawn',
            startTime: Date.now(),
            events: [],
            damageLog: [], // Track all damage with types
            tierInfo: this.damageSystem.tierDefinitions[boss.tier],
            availableDamageTypes: this.damageSystem.getAvailableDamageTypes(boss.tier)
        };
        
        this.activeBattles.set(boss.id, battle);
        
        // Notify all systems with tier info
        this.emit('boss_spawned', {
            battle,
            tierInfo: battle.tierInfo,
            damageTypes: battle.availableDamageTypes
        });
        
        this.notifyMUDPlayers(roomId, boss.spawnMessage);
        this.notifyStreamViewersEnhanced(boss, 'spawned');
        
        // Start enhanced boss AI
        this.startEnhancedBossAI(boss.id);
        
        console.log(`⚔️ Tier ${boss.tier} boss spawned: ${boss.name} in ${roomId}`);
        console.log(`   Available damage types: ${battle.availableDamageTypes.map(dt => dt.type).join(', ')}`);
        
        return battle;
    }
    
    /**
     * Enhanced player attack with damage types
     */
    attackBoss(bossId, playerId, attackType = 'basic', damageType = 'physical') {
        const battle = this.activeBattles.get(bossId);
        if (!battle || battle.status !== 'active') {
            throw new Error('Battle not available');
        }
        
        const player = battle.players.get(playerId);
        if (!player || !player.alive) {
            throw new Error('Player not in battle or deceased');
        }
        
        // Validate player can use this damage type (based on equipment/class)
        const playerTier = player.tier || 1; // Default tier 1 for players
        if (!this.damageSystem.canUseDamageType(playerTier, damageType)) {
            return {
                error: true,
                message: `You cannot use ${damageType} damage at tier ${playerTier}!`,
                allowedTypes: this.damageSystem.getAvailableDamageTypes(playerTier)
            };
        }
        
        // Calculate damage using tier system
        const damage = this.tierIntegration.calculateTieredDamage(
            { ...player, tier: playerTier },
            battle.boss,
            damageType
        );
        
        // Update boss health
        battle.boss.health = Math.max(0, battle.boss.health - damage);
        battle.boss.damageTypeStats[damageType].taken += damage;
        player.damageDealt = (player.damageDealt || 0) + damage;
        
        // Create visual feedback
        const visualFeedback = this.damageSystem.createDamageIndicator(
            damage,
            damageType,
            playerTier
        );
        
        // Log damage event
        const damageEvent = {
            attacker: player.name,
            target: battle.boss.name,
            damage,
            damageType,
            attackType,
            visualFeedback,
            timestamp: Date.now()
        };
        
        battle.damageLog.push(damageEvent);
        
        this.addBattleEvent(battle, 'player_attack', {
            playerId,
            playerName: player.name,
            damage,
            damageType,
            attackType,
            message: `${player.name} deals ${damage} ${damageType} damage with ${attackType} attack!`,
            visual: visualFeedback
        });
        
        // Check boss phase
        this.tierIntegration.updateBossPhase(battle.boss);
        
        // Check for boss death
        if (battle.boss.health <= 0) {
            this.defeatBossEnhanced(bossId);
            return { result: 'boss_defeated', damage, damageType };
        }
        
        // Trigger boss counterattack
        setTimeout(() => this.bossTakeTurnEnhanced(bossId), 1000);
        
        return {
            result: 'hit',
            damage,
            damageType,
            bossHealth: battle.boss.health,
            bossPhase: battle.boss.currentPhase,
            visualFeedback
        };
    }
    
    /**
     * Enhanced boss turn with tier-appropriate attacks
     */
    bossTakeTurnEnhanced(bossId) {
        const battle = this.activeBattles.get(bossId);
        if (!battle || battle.status !== 'active') return;
        
        const boss = battle.boss;
        const alivePlayers = Array.from(battle.players.values()).filter(p => p.alive);
        if (alivePlayers.length === 0) {
            this.defeatPlayers(bossId);
            return;
        }
        
        // Choose damage type based on tier
        const availableTypes = battle.availableDamageTypes.map(dt => dt.type);
        let chosenDamageType;
        
        // Dragons (Tier 3+) intelligently switch between magic and physical
        if (boss.tier >= 3 && boss.isDragon) {
            // Alternate between breath (magic) and physical attacks
            const lastAttack = battle.events.slice(-1)[0];
            if (lastAttack?.data?.damageType === 'magic') {
                chosenDamageType = 'physical';
            } else {
                chosenDamageType = 'magic';
            }
        } else {
            // Random from available types
            chosenDamageType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        }
        
        // Select target
        const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        
        // Calculate damage
        const damage = this.tierIntegration.calculateTieredDamage(
            boss,
            { ...target, tier: 1 }, // Players default to tier 1
            chosenDamageType
        );
        
        // Apply damage
        target.health = Math.max(0, target.health - damage);
        boss.damageTypeStats[chosenDamageType].dealt += damage;
        
        if (target.health <= 0) {
            target.alive = false;
        }
        
        // Create attack description based on damage type
        const attackDescription = this.generateAttackDescription(boss, chosenDamageType, damage);
        
        // Visual feedback
        const visualFeedback = this.damageSystem.createDamageIndicator(
            damage,
            chosenDamageType,
            boss.tier
        );
        
        // Log damage
        battle.damageLog.push({
            attacker: boss.name,
            target: target.name,
            damage,
            damageType: chosenDamageType,
            timestamp: Date.now(),
            visualFeedback
        });
        
        this.addBattleEvent(battle, 'boss_attack', {
            bossName: boss.name,
            targetName: target.name,
            damage,
            damageType: chosenDamageType,
            message: attackDescription,
            visual: visualFeedback
        });
        
        // Update last action time
        boss.lastAction = Date.now() + (3000 + Math.random() * 2000);
    }
    
    /**
     * Generate attack descriptions based on damage type
     */
    generateAttackDescription(boss, damageType, damage) {
        const descriptions = {
            physical: [
                `${boss.name} strikes with brutal force! (${damage} physical damage)`,
                `${boss.name} delivers a crushing blow! (${damage} physical damage)`
            ],
            ranged: [
                `${boss.name} launches a projectile attack! (${damage} ranged damage)`,
                `${boss.name} fires from a distance! (${damage} ranged damage)`
            ],
            magic: [
                `${boss.name} casts a devastating spell! (${damage} magic damage)`,
                `${boss.name} unleashes magical energy! (${damage} magic damage)`
            ],
            true: [
                `${boss.name} strikes with pure power! (${damage} true damage)`,
                `${boss.name} bypasses all defenses! (${damage} true damage)`
            ],
            chaos: [
                `${boss.name} warps reality itself! (${damage} chaos damage)`,
                `${boss.name} attacks from impossible angles! (${damage} chaos damage)`
            ]
        };
        
        // Special dragon descriptions
        if (boss.isDragon && damageType === 'magic') {
            return `${boss.name} breathes ${boss.element || 'elemental'} destruction! (${damage} magic damage)`;
        } else if (boss.isDragon && damageType === 'physical') {
            const physicalAttacks = ['bites with massive jaws', 'slashes with razor claws', 'sweeps with its tail'];
            const attack = physicalAttacks[Math.floor(Math.random() * physicalAttacks.length)];
            return `${boss.name} ${attack}! (${damage} physical damage)`;
        }
        
        const typeDescriptions = descriptions[damageType] || descriptions.physical;
        return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
    }
    
    /**
     * Enhanced boss defeat with wiki generation
     */
    defeatBossEnhanced(bossId) {
        const battle = this.activeBattles.get(bossId);
        if (!battle) return;
        
        const boss = battle.boss;
        battle.status = 'victory';
        battle.endTime = Date.now();
        
        // Generate battle statistics
        const battleStats = this.generateBattleStatistics(battle);
        
        // Generate wiki entry
        const wikiEntry = this.generateWikiEntry(battle, battleStats);
        this.wikiEntries.set(boss.id, wikiEntry);
        
        // Emit wiki generation event
        this.emit('wiki_generated', {
            bossId: boss.id,
            bossName: boss.name,
            wikiEntry
        });
        
        // Standard rewards and notifications
        this.distributeRewards(battle);
        this.notifyMUDPlayers(boss.roomId, boss.deathMessage);
        this.notifyStreamViewersEnhanced(boss, 'defeated');
        
        console.log(`🏆 Tier ${boss.tier} boss defeated: ${boss.name}`);
        console.log(`📚 Wiki entry generated with ${battleStats.totalDamageEvents} damage events`);
        
        return { wikiEntry, battleStats };
    }
    
    /**
     * Generate battle statistics
     */
    generateBattleStatistics(battle) {
        const stats = {
            duration: battle.endTime - battle.startTime,
            totalDamageEvents: battle.damageLog.length,
            participants: battle.players.size,
            
            // Damage type breakdown
            damageByType: {},
            
            // Most effective damage type
            mostEffectiveType: null,
            leastEffectiveType: null,
            
            // Player performance
            mvp: null,
            totalPlayerDamage: 0,
            totalBossDamage: 0
        };
        
        // Analyze damage log
        battle.damageLog.forEach(event => {
            if (!stats.damageByType[event.damageType]) {
                stats.damageByType[event.damageType] = {
                    total: 0,
                    count: 0,
                    average: 0
                };
            }
            
            stats.damageByType[event.damageType].total += event.damage;
            stats.damageByType[event.damageType].count++;
        });
        
        // Calculate averages and find most/least effective
        let maxAvg = 0, minAvg = Infinity;
        Object.entries(stats.damageByType).forEach(([type, data]) => {
            data.average = data.total / data.count;
            if (data.average > maxAvg) {
                maxAvg = data.average;
                stats.mostEffectiveType = type;
            }
            if (data.average < minAvg) {
                minAvg = data.average;
                stats.leastEffectiveType = type;
            }
        });
        
        // Find MVP
        let maxDamage = 0;
        battle.players.forEach(player => {
            if (player.damageDealt > maxDamage) {
                maxDamage = player.damageDealt;
                stats.mvp = player.name;
            }
            stats.totalPlayerDamage += player.damageDealt || 0;
        });
        
        // Calculate boss damage
        Object.values(battle.boss.damageTypeStats).forEach(typeStats => {
            stats.totalBossDamage += typeStats.dealt;
        });
        
        return stats;
    }
    
    /**
     * Generate wiki entry for defeated boss
     */
    generateWikiEntry(battle, stats) {
        const boss = battle.boss;
        const tierInfo = battle.tierInfo;
        
        const wikiEntry = {
            id: boss.id,
            name: boss.name,
            tier: boss.tier,
            level: boss.level,
            type: boss.baseType || boss.type,
            
            // Basic info
            basicInfo: {
                health: boss.maxHealth,
                tierName: tierInfo.name,
                description: tierInfo.description,
                availableDamageTypes: tierInfo.damageTypes,
                colorCoding: tierInfo.colorCoding
            },
            
            // Battle data
            battleData: {
                duration: `${Math.floor(stats.duration / 1000)} seconds`,
                participants: stats.participants,
                totalDamageDealt: stats.totalPlayerDamage,
                totalDamageTaken: stats.totalBossDamage,
                mvp: stats.mvp
            },
            
            // Damage type effectiveness
            damageAnalysis: {
                mostEffective: stats.mostEffectiveType,
                leastEffective: stats.leastEffectiveType,
                breakdown: stats.damageByType,
                recommendation: this.generateDamageRecommendation(boss, stats)
            },
            
            // Loot information
            lootTable: boss.lootTable || [],
            
            // Strategy guide
            strategy: this.generateStrategyGuide(boss, battle, stats),
            
            // Special notes
            specialNotes: this.generateSpecialNotes(boss),
            
            // Metadata
            metadata: {
                defeatedAt: new Date(battle.endTime).toISOString(),
                spawnedBy: boss.spawnedBy,
                roomId: boss.roomId,
                version: '1.0'
            }
        };
        
        return wikiEntry;
    }
    
    /**
     * Generate damage type recommendation
     */
    generateDamageRecommendation(boss, stats) {
        const recommendations = [];
        
        // Tier-based recommendations
        if (boss.tier <= 2) {
            recommendations.push(`This is a Tier ${boss.tier} boss - bring physical damage dealers`);
        } else if (boss.tier === 3) {
            recommendations.push(`This is a Tier 3 boss - magic damage is highly effective`);
            if (boss.isDragon) {
                recommendations.push(`Dragons alternate between magic and physical attacks - prepare for both`);
            }
        } else {
            recommendations.push(`High tier boss - bring your best damage dealers of all types`);
        }
        
        // Effectiveness-based recommendations
        if (stats.mostEffectiveType) {
            recommendations.push(`${stats.mostEffectiveType} damage proved most effective in this battle`);
        }
        
        return recommendations;
    }
    
    /**
     * Generate strategy guide
     */
    generateStrategyGuide(boss, battle, stats) {
        const guide = {
            preparation: [],
            duringBattle: [],
            teamComposition: []
        };
        
        // Tier-specific preparation
        guide.preparation.push(`Study Tier ${boss.tier} damage restrictions before engaging`);
        if (boss.tier >= 3) {
            guide.preparation.push('Ensure your team has both physical and magic damage dealers');
        }
        
        // Battle tactics
        if (boss.isDragon) {
            guide.duringBattle.push('Watch for breath weapon telegraphs - high magic damage incoming');
            guide.duringBattle.push('Stay mobile to avoid tail sweeps (physical AoE)');
        }
        
        // Team composition
        const damageTypesNeeded = battle.tierInfo.damageTypes;
        guide.teamComposition.push(`Recommended damage types: ${damageTypesNeeded.join(', ')}`);
        guide.teamComposition.push(`Minimum ${Math.ceil(boss.tier * 1.5)} players recommended`);
        
        return guide;
    }
    
    /**
     * Generate special notes
     */
    generateSpecialNotes(boss) {
        const notes = [];
        
        if (boss.isDragon) {
            notes.push('🐉 Dragon Boss: Expect alternating magic/physical attack patterns');
            if (boss.element) {
                notes.push(`Elemental Type: ${boss.element} - prepare appropriate resistances`);
            }
        }
        
        if (boss.tier >= 4) {
            notes.push('⚠️ High Tier Boss: Can use all damage types including True damage');
        }
        
        if (boss.tier === 5) {
            notes.push('🌀 Chaos Boss: Attacks have random multipliers and effects');
        }
        
        return notes;
    }
    
    /**
     * Enhanced stream notification with tier info
     */
    notifyStreamViewersEnhanced(boss, status = 'spawned') {
        if (this.streamLayer) {
            const tierInfo = this.damageSystem.tierDefinitions[boss.tier];
            
            this.streamLayer.broadcastToOverlays({
                type: 'boss_event_enhanced',
                boss: {
                    name: boss.name,
                    health: boss.health,
                    maxHealth: boss.maxHealth,
                    level: boss.level,
                    tier: boss.tier,
                    tierName: tierInfo.name,
                    availableDamageTypes: tierInfo.damageTypes,
                    colorCoding: tierInfo.colorCoding,
                    status: status,
                    isDragon: boss.isDragon,
                    element: boss.element
                },
                message: status === 'spawned' ? boss.spawnMessage : boss.deathMessage,
                visualTheme: boss.visualTheme
            });
        }
    }
    
    /**
     * Start enhanced boss AI with tier-appropriate behavior
     */
    startEnhancedBossAI(bossId) {
        const aiLoop = setInterval(() => {
            const battle = this.activeBattles.get(bossId);
            if (!battle) {
                clearInterval(aiLoop);
                return;
            }
            
            // Tier-based AI speed
            const boss = battle.boss;
            const baseSpeed = 4000; // 4 seconds
            const tierSpeedBonus = (boss.tier - 1) * 500; // Faster at higher tiers
            const phaseSpeedBonus = boss.currentPhase === 'enraged' ? -1000 : 0; // Faster when enraged
            
            const nextActionTime = baseSpeed - tierSpeedBonus + phaseSpeedBonus;
            
            this.bossTakeTurnEnhanced(bossId);
        }, 3500); // Average 3.5 seconds, adjusted by tier
    }
    
    /**
     * Get wiki entry for a boss
     */
    getWikiEntry(bossId) {
        return this.wikiEntries.get(bossId);
    }
    
    /**
     * Get all wiki entries
     */
    getAllWikiEntries() {
        return Array.from(this.wikiEntries.values());
    }
    
    /**
     * Export wiki to markdown
     */
    exportWikiToMarkdown(bossId) {
        const wiki = this.wikiEntries.get(bossId);
        if (!wiki) return null;
        
        let markdown = `# ${wiki.name}\n\n`;
        markdown += `## Basic Information\n`;
        markdown += `- **Tier**: ${wiki.tier} (${wiki.basicInfo.tierName})\n`;
        markdown += `- **Level**: ${wiki.level}\n`;
        markdown += `- **Type**: ${wiki.type}\n`;
        markdown += `- **Health**: ${wiki.basicInfo.health}\n`;
        markdown += `- **Damage Types**: ${wiki.basicInfo.availableDamageTypes.join(', ')}\n\n`;
        
        markdown += `## Battle Statistics\n`;
        markdown += `- **Duration**: ${wiki.battleData.duration}\n`;
        markdown += `- **Participants**: ${wiki.battleData.participants}\n`;
        markdown += `- **Total Damage Dealt**: ${wiki.battleData.totalDamageDealt}\n`;
        markdown += `- **MVP**: ${wiki.battleData.mvp}\n\n`;
        
        markdown += `## Damage Analysis\n`;
        markdown += `- **Most Effective**: ${wiki.damageAnalysis.mostEffective}\n`;
        markdown += `- **Least Effective**: ${wiki.damageAnalysis.leastEffective}\n\n`;
        
        markdown += `### Recommendations\n`;
        wiki.damageAnalysis.recommendation.forEach(rec => {
            markdown += `- ${rec}\n`;
        });
        
        markdown += `\n## Strategy Guide\n`;
        markdown += `### Preparation\n`;
        wiki.strategy.preparation.forEach(prep => {
            markdown += `- ${prep}\n`;
        });
        
        if (wiki.specialNotes.length > 0) {
            markdown += `\n## Special Notes\n`;
            wiki.specialNotes.forEach(note => {
                markdown += `- ${note}\n`;
            });
        }
        
        markdown += `\n---\n`;
        markdown += `*Defeated on ${wiki.metadata.defeatedAt}*\n`;
        
        return markdown;
    }
}

module.exports = BossBattleTierEnhanced;

// CLI testing
if (require.main === module) {
    async function test() {
        console.log('⚔️🐉 Testing Boss Battle Tier Enhanced System\n');
        
        const battleSystem = new BossBattleTierEnhanced(null, null);
        
        // Spawn different tier bosses
        console.log('🎮 SPAWNING TIERED BOSSES:');
        console.log('===========================');
        
        // Spawn a dragon (Tier 3)
        const dragonBattle = await battleSystem.spawnBoss('dragon_lair', 'crimson_dragon', 'test');
        console.log(`\n✅ Spawned ${dragonBattle.boss.name} (Tier ${dragonBattle.boss.tier})`);
        console.log(`   Damage types: ${dragonBattle.availableDamageTypes.map(dt => dt.type).join(', ')}`);
        
        // Add test player
        const testPlayer = {
            id: 'player1',
            name: 'DragonSlayer',
            health: 100,
            maxHealth: 100,
            damage: 20,
            tier: 2 // Can use physical and ranged
        };
        
        dragonBattle.players.set(testPlayer.id, testPlayer);
        
        console.log('\n⚔️ COMBAT SIMULATION:');
        console.log('====================');
        
        // Player tries magic (should fail - tier 2 can't use magic)
        console.log('\nPlayer (Tier 2) tries magic attack:');
        const magicAttempt = battleSystem.attackBoss(dragonBattle.boss.id, testPlayer.id, 'spell', 'magic');
        console.log(magicAttempt.error ? `   ❌ ${magicAttempt.message}` : `   ✅ ${magicAttempt.damage} damage`);
        
        // Player uses physical (should work)
        console.log('\nPlayer uses physical attack:');
        const physicalAttack = battleSystem.attackBoss(dragonBattle.boss.id, testPlayer.id, 'slash', 'physical');
        console.log(`   ✅ ${physicalAttack.damage} ${physicalAttack.damageType} damage`);
        console.log(`   Boss health: ${physicalAttack.bossHealth}/${dragonBattle.boss.maxHealth}`);
        
        // Simulate boss defeat for wiki generation
        dragonBattle.boss.health = 0;
        const defeatResult = battleSystem.defeatBossEnhanced(dragonBattle.boss.id);
        
        console.log('\n📚 WIKI GENERATION:');
        console.log('===================');
        console.log('Wiki entry created with sections:');
        Object.keys(defeatResult.wikiEntry).forEach(section => {
            console.log(`   - ${section}`);
        });
        
        // Export wiki to markdown
        const markdown = battleSystem.exportWikiToMarkdown(dragonBattle.boss.id);
        console.log('\n📝 Sample wiki markdown (first 500 chars):');
        console.log(markdown.substring(0, 500) + '...');
        
        console.log('\n✅ Boss Battle Tier Enhanced System test complete!');
    }
    
    test().catch(console.error);
}