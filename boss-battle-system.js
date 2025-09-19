#!/usr/bin/env node

/**
 * ⚔️👹 BOSS BATTLE SYSTEM
 * Epic boss encounters with viewer participation
 * Integrated with sonar detection and loot drops
 */

const GamingEconomySystem = require('./gaming-economy-system.js');
const EventEmitter = require('events');

class BossBattleSystem extends EventEmitter {
    constructor(mudEngine, streamLayer) {
        super();
        
        this.mudEngine = mudEngine;
        this.streamLayer = streamLayer;
        this.economy = new GamingEconomySystem();
        
        this.bosses = {
            'cal_nightmare': {
                name: '💀 Cal Nightmare',
                level: 5,
                health: 500,
                maxHealth: 500,
                damage: 25,
                defense: 10,
                abilities: ['roast_beam', 'sarcasm_wave', 'wisdom_bomb'],
                weaknesses: ['compliments', 'genuine_questions'],
                lootTable: ['legendary_keyboard', 'epic_coffee_mug', 'rare_debugging_tool'],
                spawnMessage: 'The air grows thick with sarcasm... Cal Nightmare has awakened!',
                deathMessage: 'Cal Nightmare fades away, muttering "...even in death, your code still sucks..."',
                sonarSignature: {
                    size: 'large',
                    threat: 'extreme',
                    color: '#ff0066'
                }
            },
            'data_dragon': {
                name: '🐉 Data Dragon',
                level: 8,
                health: 800,
                maxHealth: 800,
                damage: 40,
                defense: 15,
                abilities: ['data_breath', 'sql_injection', 'memory_leak'],
                weaknesses: ['proper_indexing', 'clean_queries'],
                lootTable: ['mythic_ssd', 'legendary_ram_stick', 'epic_database'],
                spawnMessage: 'The servers tremble as the Data Dragon emerges from the cloud!',
                deathMessage: 'Data Dragon crashes with a blue screen of death...',
                sonarSignature: {
                    size: 'massive',
                    threat: 'legendary',
                    color: '#00ff00'
                }
            },
            'bug_hydra': {
                name: '🐍 Bug Hydra',
                level: 3,
                health: 300,
                maxHealth: 300,
                damage: 15,
                defense: 5,
                abilities: ['spawn_bug', 'multiply_error', 'stack_overflow'],
                weaknesses: ['unit_tests', 'code_review'],
                lootTable: ['rare_debugger', 'uncommon_test_suite', 'common_bug_spray'],
                spawnMessage: 'A thousand errors crawl forth... the Bug Hydra has appeared!',
                deathMessage: 'All bugs have been squashed... for now.',
                sonarSignature: {
                    size: 'medium',
                    threat: 'high',
                    color: '#ff9900'
                }
            },
            'merge_conflict': {
                name: '⚡ Merge Conflict',
                level: 6,
                health: 400,
                maxHealth: 400,
                damage: 30,
                defense: 8,
                abilities: ['conflict_storm', 'branch_tangle', 'force_push'],
                weaknesses: ['careful_merging', 'communication'],
                lootTable: ['legendary_git_tool', 'epic_merge_master', 'rare_conflict_resolver'],
                spawnMessage: 'Git branches collide violently... Merge Conflict materializes!',
                deathMessage: 'Merge conflict resolved successfully. All changes committed.',
                sonarSignature: {
                    size: 'large',
                    threat: 'extreme',
                    color: '#ffff00'
                }
            }
        };
        
        this.activeBattles = new Map();
        this.battleQueue = [];
        this.globalBattleStats = {
            totalBattles: 0,
            bossesDefeated: 0,
            playersDefeated: 0,
            legendaryDrops: 0
        };
        
        // Viewer participation tracking
        this.viewerActions = new Map(); // viewerId -> { damage, heals, buffs }
        this.battlePhases = ['spawn', 'phase1', 'phase2', 'phase3', 'death'];
    }
    
    // Spawn a boss in a specific room
    spawnBoss(roomId, bossType, spawnedBy = 'system') {
        if (!this.bosses[bossType]) {
            throw new Error(`Unknown boss type: ${bossType}`);
        }
        
        const boss = { ...this.bosses[bossType] };
        boss.id = `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        boss.roomId = roomId;
        boss.spawnTime = Date.now();
        boss.spawnedBy = spawnedBy;
        boss.currentPhase = 'spawn';
        boss.participants = new Set();
        boss.viewerActions = new Map();
        boss.damageDealt = 0;
        boss.lastAction = Date.now();
        
        // Create battle instance
        const battle = {
            boss: boss,
            players: new Map(),
            status: 'active',
            phase: 'spawn',
            startTime: Date.now(),
            events: [],
            sonarContact: this.createSonarContact(boss)
        };
        
        this.activeBattles.set(boss.id, battle);
        this.globalBattleStats.totalBattles++;
        
        // Notify all systems
        this.emit('boss_spawned', battle);
        this.notifyMUDPlayers(roomId, boss.spawnMessage);
        this.notifyStreamViewers(boss);
        this.updateSonarDisplay(battle);
        
        // Start boss AI loop
        this.startBossAI(boss.id);
        
        console.log(`⚔️ Boss spawned: ${boss.name} in ${roomId} (spawned by ${spawnedBy})`);
        
        return battle;
    }
    
    createSonarContact(boss) {
        return {
            id: boss.id,
            type: 'boss',
            name: boss.name,
            position: { x: Math.random() * 100, y: Math.random() * 100 },
            signature: boss.sonarSignature,
            detected: Date.now(),
            threat: boss.sonarSignature.threat,
            health: boss.health / boss.maxHealth,
            status: 'active'
        };
    }
    
    // Player joins battle
    joinBattle(bossId, playerId, playerData) {
        const battle = this.activeBattles.get(bossId);
        if (!battle || battle.status !== 'active') {
            throw new Error('Battle not available');
        }
        
        // Add player to battle
        battle.players.set(playerId, {
            id: playerId,
            name: playerData.name || `Player_${playerId.slice(-4)}`,
            health: playerData.health || 100,
            maxHealth: playerData.maxHealth || 100,
            damage: playerData.damage || 10,
            joinTime: Date.now(),
            damageDealt: 0,
            healsGiven: 0,
            alive: true
        });
        
        battle.boss.participants.add(playerId);
        
        this.addBattleEvent(battle, 'player_join', {
            playerId,
            playerName: playerData.name,
            message: `${playerData.name} joins the battle!`
        });
        
        console.log(`⚔️ Player ${playerData.name} joined battle against ${battle.boss.name}`);
        
        return battle;
    }
    
    // Player attacks boss
    attackBoss(bossId, playerId, attackType = 'basic') {
        const battle = this.activeBattles.get(bossId);
        if (!battle || battle.status !== 'active') {
            throw new Error('Battle not available');
        }
        
        const player = battle.players.get(playerId);
        if (!player || !player.alive) {
            throw new Error('Player not in battle or deceased');
        }
        
        // Calculate damage
        let damage = player.damage + Math.floor(Math.random() * 10);
        
        // Attack type modifiers
        switch (attackType) {
            case 'critical':
                damage *= 2;
                break;
            case 'power':
                damage *= 1.5;
                break;
            case 'weak':
                damage *= 0.5;
                break;
        }
        
        // Apply boss defense
        const finalDamage = Math.max(1, damage - battle.boss.defense);
        battle.boss.health -= finalDamage;
        battle.boss.damageDealt += finalDamage;
        player.damageDealt += finalDamage;
        
        this.addBattleEvent(battle, 'player_attack', {
            playerId,
            playerName: player.name,
            damage: finalDamage,
            attackType,
            message: `${player.name} deals ${finalDamage} damage with ${attackType} attack!`
        });
        
        // Check for boss death
        if (battle.boss.health <= 0) {
            this.defeatBoss(bossId);
            return { result: 'boss_defeated', damage: finalDamage };
        }
        
        // Update sonar
        this.updateSonarDisplay(battle);
        
        // Trigger boss counterattack
        setTimeout(() => this.bossTakeTurn(bossId), 1000);
        
        return { result: 'hit', damage: finalDamage, bossHealth: battle.boss.health };
    }
    
    // Viewer participates via chat
    viewerParticipate(bossId, viewerId, viewerName, action, parameter = null) {
        const battle = this.activeBattles.get(bossId);
        if (!battle || battle.status !== 'active') {
            return { error: 'Battle not available' };
        }
        
        // Track viewer participation
        if (!battle.boss.viewerActions.has(viewerId)) {
            battle.boss.viewerActions.set(viewerId, {
                name: viewerName,
                totalDamage: 0,
                totalHeals: 0,
                actionsUsed: []
            });
        }
        
        const viewerData = battle.boss.viewerActions.get(viewerId);
        let result = {};
        
        switch (action) {
            case 'cheer':
                // Viewers can cheer to boost player damage
                const cheerPower = parameter || 100; // Bits amount
                const damageBoost = Math.floor(cheerPower / 10);
                
                // Apply to random player
                const players = Array.from(battle.players.values()).filter(p => p.alive);
                if (players.length > 0) {
                    const randomPlayer = players[Math.floor(Math.random() * players.length)];
                    randomPlayer.damage += damageBoost;
                    
                    result = {
                        action: 'cheer_boost',
                        message: `${viewerName} cheered ${cheerPower} bits! ${randomPlayer.name} gains +${damageBoost} damage!`,
                        effect: `+${damageBoost} damage to ${randomPlayer.name}`
                    };
                }
                break;
                
            case 'heal':
                // Heal random injured player
                const injuredPlayers = Array.from(battle.players.values())
                    .filter(p => p.alive && p.health < p.maxHealth);
                
                if (injuredPlayers.length > 0) {
                    const targetPlayer = injuredPlayers[Math.floor(Math.random() * injuredPlayers.length)];
                    const healAmount = 20 + Math.floor(Math.random() * 20);
                    targetPlayer.health = Math.min(targetPlayer.maxHealth, targetPlayer.health + healAmount);
                    viewerData.totalHeals += healAmount;
                    
                    result = {
                        action: 'heal',
                        message: `${viewerName} casts heal! ${targetPlayer.name} recovers ${healAmount} HP!`,
                        effect: `+${healAmount} HP to ${targetPlayer.name}`
                    };
                }
                break;
                
            case 'sabotage':
                // Viewers can sabotage boss
                const sabotage = ['slow', 'weaken', 'distract'][Math.floor(Math.random() * 3)];
                const sabotageEffect = Math.floor(Math.random() * 10) + 5;
                
                switch (sabotage) {
                    case 'slow':
                        // Boss takes longer between attacks
                        battle.boss.slowEffect = Date.now() + 10000; // 10 seconds
                        result.message = `${viewerName} hacks the boss! Boss is slowed for 10 seconds!`;
                        break;
                    case 'weaken':
                        battle.boss.damage -= sabotageEffect;
                        result.message = `${viewerName} weakens the boss! Boss damage reduced by ${sabotageEffect}!`;
                        break;
                    case 'distract':
                        battle.boss.lastAction = Date.now() + 3000; // Skip next turn
                        result.message = `${viewerName} distracts the boss! Boss skips next attack!`;
                        break;
                }
                result.action = 'sabotage';
                result.effect = `${sabotage} applied to boss`;
                break;
                
            case 'buff':
                // Buff all players
                const buffType = ['damage', 'defense', 'healing'][Math.floor(Math.random() * 3)];
                const buffAmount = Math.floor(Math.random() * 5) + 3;
                
                battle.players.forEach(player => {
                    if (player.alive) {
                        switch (buffType) {
                            case 'damage':
                                player.damage += buffAmount;
                                break;
                            case 'defense':
                                player.defense = (player.defense || 0) + buffAmount;
                                break;
                            case 'healing':
                                player.health = Math.min(player.maxHealth, player.health + buffAmount);
                                break;
                        }
                    }
                });
                
                result = {
                    action: 'buff',
                    message: `${viewerName} casts group ${buffType} buff! All players gain +${buffAmount} ${buffType}!`,
                    effect: `+${buffAmount} ${buffType} to all players`
                };
                break;
        }
        
        viewerData.actionsUsed.push({ action, timestamp: Date.now(), result });
        
        this.addBattleEvent(battle, 'viewer_action', {
            viewerId,
            viewerName,
            action,
            parameter,
            result: result.message
        });
        
        // Notify stream
        if (this.streamLayer) {
            this.streamLayer.broadcastToOverlays({
                type: 'viewer_battle_action',
                viewer: viewerName,
                action,
                result: result.message
            });
        }
        
        return result;
    }
    
    // Boss takes a turn
    bossTakeTurn(bossId) {
        const battle = this.activeBattles.get(bossId);
        if (!battle || battle.status !== 'active') {
            return;
        }
        
        const boss = battle.boss;
        
        // Check for slow effect
        if (boss.slowEffect && Date.now() < boss.slowEffect) {
            return; // Skip turn due to slow
        }
        
        // Check if boss should skip turn
        if (Date.now() < boss.lastAction) {
            return;
        }
        
        const alivePlayers = Array.from(battle.players.values()).filter(p => p.alive);
        if (alivePlayers.length === 0) {
            this.defeatPlayers(bossId);
            return;
        }
        
        // Choose boss ability based on health percentage
        const healthPercent = boss.health / boss.maxHealth;
        let ability = boss.abilities[Math.floor(Math.random() * boss.abilities.length)];
        
        // Use stronger abilities at lower health
        if (healthPercent < 0.3 && boss.abilities.includes('ultimate')) {
            ability = 'ultimate';
        } else if (healthPercent < 0.5 && boss.abilities.includes('enrage')) {
            ability = 'enrage';
        }
        
        // Execute ability
        const abilityResult = this.executeBossAbility(battle, ability);
        
        this.addBattleEvent(battle, 'boss_attack', {
            bossName: boss.name,
            ability,
            result: abilityResult.message,
            damage: abilityResult.totalDamage
        });
        
        // Update boss last action time
        boss.lastAction = Date.now() + (3000 + Math.random() * 2000); // 3-5 second cooldown
    }
    
    executeBossAbility(battle, ability) {
        const boss = battle.boss;
        const players = Array.from(battle.players.values()).filter(p => p.alive);
        let totalDamage = 0;
        let message = '';
        
        switch (ability) {
            case 'roast_beam':
                // Single target high damage
                if (players.length > 0) {
                    const target = players[Math.floor(Math.random() * players.length)];
                    const damage = boss.damage + Math.floor(Math.random() * 15);
                    target.health -= damage;
                    totalDamage = damage;
                    
                    if (target.health <= 0) {
                        target.alive = false;
                        message = `${boss.name} roasts ${target.name} to death with a devastating beam! (-${damage} HP)`;
                    } else {
                        message = `${boss.name} roasts ${target.name} with a sarcastic beam! (-${damage} HP)`;
                    }
                }
                break;
                
            case 'sarcasm_wave':
                // AoE moderate damage
                const waveDamage = Math.floor(boss.damage * 0.7);
                players.forEach(player => {
                    player.health -= waveDamage;
                    if (player.health <= 0) {
                        player.alive = false;
                    }
                });
                totalDamage = waveDamage * players.length;
                message = `${boss.name} unleashes a wave of pure sarcasm! All players take ${waveDamage} damage!`;
                break;
                
            case 'wisdom_bomb':
                // Confuses players (reduces their damage temporarily)
                players.forEach(player => {
                    player.damage = Math.max(1, player.damage - 5);
                    player.confused = Date.now() + 10000; // 10 seconds
                });
                message = `${boss.name} drops a wisdom bomb! All players are confused and deal less damage!`;
                break;
                
            case 'data_breath':
                // Corrupts random player's "data" (high damage)
                if (players.length > 0) {
                    const target = players[Math.floor(Math.random() * players.length)];
                    const damage = boss.damage * 1.5;
                    target.health -= damage;
                    totalDamage = damage;
                    
                    if (target.health <= 0) {
                        target.alive = false;
                        message = `${boss.name} breathes corrupted data on ${target.name}, deleting them! (-${damage} HP)`;
                    } else {
                        message = `${boss.name} corrupts ${target.name}'s data! (-${damage} HP)`;
                    }
                }
                break;
                
            default:
                // Generic attack
                if (players.length > 0) {
                    const target = players[Math.floor(Math.random() * players.length)];
                    const damage = boss.damage;
                    target.health -= damage;
                    totalDamage = damage;
                    message = `${boss.name} attacks ${target.name}! (-${damage} HP)`;
                    
                    if (target.health <= 0) {
                        target.alive = false;
                    }
                }
        }
        
        return { message, totalDamage };
    }
    
    // Boss is defeated
    defeatBoss(bossId) {
        const battle = this.activeBattles.get(bossId);
        if (!battle) return;
        
        const boss = battle.boss;
        battle.status = 'victory';
        battle.endTime = Date.now();
        
        this.globalBattleStats.bossesDefeated++;
        
        // Generate loot for all participants
        const loot = this.generateBossLoot(boss, battle.players.size);
        
        // Distribute rewards
        battle.players.forEach((player, playerId) => {
            const contribution = player.damageDealt / boss.maxHealth;
            const rewards = this.calculateVictoryRewards(boss, contribution);
            
            this.emit('player_rewards', {
                playerId,
                playerName: player.name,
                rewards,
                loot: loot.filter(item => Math.random() < contribution) // Higher contribution = more loot
            });
        });
        
        // Viewer rewards
        boss.viewerActions.forEach((viewerData, viewerId) => {
            const viewerRewards = this.economy.generateViewerReward('boss_victory', viewerData.name);
            
            this.emit('viewer_rewards', {
                viewerId,
                viewerName: viewerData.name,
                rewards: viewerRewards
            });
        });
        
        this.addBattleEvent(battle, 'boss_defeated', {
            bossName: boss.name,
            duration: battle.endTime - battle.startTime,
            participants: battle.players.size,
            viewerActions: boss.viewerActions.size,
            loot: loot.length
        });
        
        // Notify all systems
        this.notifyMUDPlayers(boss.roomId, boss.deathMessage);
        this.notifyStreamViewers(boss, 'defeated');
        this.updateSonarDisplay(battle, 'defeated');
        
        // Clean up battle
        setTimeout(() => {
            this.activeBattles.delete(bossId);
        }, 60000); // Keep battle data for 1 minute for viewing
        
        console.log(`🏆 Boss defeated: ${boss.name} (${battle.endTime - battle.startTime}ms battle)`);
        
        return { loot, rewards: 'distributed' };
    }
    
    generateBossLoot(boss, playerCount) {
        const loot = [];
        const lootCount = Math.min(5, Math.max(1, Math.floor(playerCount / 2))); // 1-5 items based on participants
        
        for (let i = 0; i < lootCount; i++) {
            // Boss-specific loot has higher rarity chance
            const luckBonus = 0.1 + (boss.level * 0.02);
            const item = this.economy.generateLootDrop(boss.level, luckBonus);
            
            // Override with boss-specific loot table if available
            if (boss.lootTable && Math.random() < 0.3) {
                const bossItem = boss.lootTable[Math.floor(Math.random() * boss.lootTable.length)];
                item.name = bossItem;
                item.bossSpecific = true;
            }
            
            loot.push(item);
        }
        
        return loot;
    }
    
    calculateVictoryRewards(boss, contribution) {
        const baseReward = this.economy.generateCurrencyReward('boss_kill', boss.level);
        
        // Scale rewards by contribution
        Object.keys(baseReward).forEach(currency => {
            baseReward[currency] = Math.floor(baseReward[currency] * (0.5 + contribution));
        });
        
        return baseReward;
    }
    
    // Utility methods
    startBossAI(bossId) {
        const aiLoop = setInterval(() => {
            if (!this.activeBattles.has(bossId)) {
                clearInterval(aiLoop);
                return;
            }
            
            this.bossTakeTurn(bossId);
        }, 4000); // Boss acts every 4 seconds
    }
    
    addBattleEvent(battle, eventType, data) {
        battle.events.push({
            type: eventType,
            timestamp: Date.now(),
            data
        });
        
        // Emit to all listeners
        this.emit('battle_event', {
            bossId: battle.boss.id,
            event: { type: eventType, data, timestamp: Date.now() }
        });
    }
    
    notifyMUDPlayers(roomId, message) {
        // Send to MUD engine
        if (this.mudEngine) {
            this.mudEngine.broadcastToRoom(roomId, {
                type: 'boss_event',
                message: message
            });
        }
    }
    
    notifyStreamViewers(boss, status = 'spawned') {
        // Send to streaming layer
        if (this.streamLayer) {
            this.streamLayer.broadcastToOverlays({
                type: 'boss_event',
                boss: {
                    name: boss.name,
                    health: boss.health,
                    maxHealth: boss.maxHealth,
                    level: boss.level,
                    status: status
                },
                message: status === 'spawned' ? boss.spawnMessage : boss.deathMessage
            });
        }
    }
    
    updateSonarDisplay(battle, status = 'active') {
        const sonarData = {
            contact: battle.sonarContact,
            status: status,
            health: battle.boss.health / battle.boss.maxHealth,
            participants: battle.players.size,
            threat: battle.boss.sonarSignature.threat,
            lastSeen: Date.now()
        };
        
        this.emit('sonar_update', sonarData);
    }
    
    // Admin/Debug methods
    getBattleStatus(bossId) {
        const battle = this.activeBattles.get(bossId);
        if (!battle) return null;
        
        return {
            boss: {
                name: battle.boss.name,
                health: battle.boss.health,
                maxHealth: battle.boss.maxHealth,
                level: battle.boss.level
            },
            players: Array.from(battle.players.values()),
            events: battle.events,
            status: battle.status,
            duration: Date.now() - battle.startTime
        };
    }
    
    getGlobalStats() {
        return {
            ...this.globalBattleStats,
            activeBattles: this.activeBattles.size,
            averageBattleTime: this.calculateAverageBattleTime(),
            economyStats: this.economy.getEconomyStats()
        };
    }
    
    calculateAverageBattleTime() {
        // Would calculate from completed battles
        return 180000; // 3 minutes average (mock)
    }
}

module.exports = BossBattleSystem;