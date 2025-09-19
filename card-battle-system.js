#!/usr/bin/env node

/**
 * CARD BATTLE SYSTEM
 * 
 * Handles combat mechanics, damage calculation, abilities,
 * and special effects for card battles.
 * 
 * Supports multiple battle formats like Pokemon, MTG, and custom rules.
 */

const EventEmitter = require('events');

class CardBattleSystem extends EventEmitter {
    constructor() {
        super();
        
        // Element type chart (Pokemon-style)
        this.typeChart = {
            fire: { strong: ['earth', 'neutral'], weak: ['water'] },
            water: { strong: ['fire'], weak: ['air'] },
            earth: { strong: ['air'], weak: ['fire'] },
            air: { strong: ['water'], weak: ['earth'] },
            neutral: { strong: [], weak: [] }
        };
        
        // Battle modifiers
        this.battleModifiers = {
            typeAdvantage: 1.5,
            typeDisadvantage: 0.5,
            critical: 2.0,
            defend: 0.5
        };
        
        // Status effects
        this.statusEffects = {
            burn: { damage: 10, duration: 3 },
            freeze: { skipTurn: true, duration: 2 },
            poison: { damage: 5, duration: 5 },
            paralyze: { skipAttack: 0.5, duration: 3 },
            sleep: { skipTurn: true, duration: 1 }
        };
        
        // Battle state
        this.activeBattle = null;
    }
    
    /**
     * Create a new battle between two players
     */
    createBattle(player1, player2, battleType = 'standard') {
        const battle = {
            id: `battle_${Date.now()}`,
            type: battleType,
            players: {
                player1: {
                    user: player1,
                    hp: 100,
                    shields: 0,
                    status: [],
                    activePokemon: null, // For Pokemon-style
                    bench: []
                },
                player2: {
                    user: player2,
                    hp: 100,
                    shields: 0,
                    status: [],
                    activePokemon: null,
                    bench: []
                }
            },
            turn: 1,
            currentPlayer: 'player1',
            log: [],
            winner: null
        };
        
        this.activeBattle = battle;
        
        this.emit('battleCreated', battle);
        
        return battle;
    }
    
    /**
     * Execute an attack between cards
     */
    async executeAttack(attacker, defender, move = null) {
        const battleLog = [];
        
        // Base damage calculation
        let damage = attacker.power;
        
        // Apply move modifiers
        if (move) {
            damage = move.basePower || damage;
            
            // Apply move effects
            if (move.effect) {
                await this.applyMoveEffect(move.effect, attacker, defender);
            }
        }
        
        // Type effectiveness
        const effectiveness = this.calculateTypeEffectiveness(
            attacker.element,
            defender.element
        );
        damage *= effectiveness;
        
        if (effectiveness > 1) {
            battleLog.push('💥 Super effective!');
        } else if (effectiveness < 1) {
            battleLog.push('💤 Not very effective...');
        }
        
        // Critical hit chance
        if (Math.random() < 0.1) {
            damage *= this.battleModifiers.critical;
            battleLog.push('⚡ Critical hit!');
        }
        
        // Apply status modifiers
        damage = this.applyStatusModifiers(damage, attacker, defender);
        
        // Apply defense
        const finalDamage = Math.max(1, Math.floor(damage - (defender.defense * 0.2)));
        
        // Deal damage
        defender.damage = (defender.damage || 0) + finalDamage;
        
        battleLog.push(`${attacker.name} deals ${finalDamage} damage to ${defender.name}`);
        
        // Check for knockout
        if (defender.damage >= defender.defense) {
            battleLog.push(`💀 ${defender.name} is knocked out!`);
            defender.knocked_out = true;
        }
        
        this.emit('attackExecuted', {
            attacker,
            defender,
            damage: finalDamage,
            log: battleLog
        });
        
        return {
            damage: finalDamage,
            effectiveness,
            knocked_out: defender.knocked_out,
            log: battleLog
        };
    }
    
    /**
     * Calculate type effectiveness
     */
    calculateTypeEffectiveness(attackType, defenseType) {
        const chart = this.typeChart[attackType];
        if (!chart) return 1;
        
        if (chart.strong.includes(defenseType)) {
            return this.battleModifiers.typeAdvantage;
        }
        
        if (chart.weak.includes(defenseType)) {
            return this.battleModifiers.typeDisadvantage;
        }
        
        return 1;
    }
    
    /**
     * Apply status effect modifiers
     */
    applyStatusModifiers(damage, attacker, defender) {
        // Check attacker status
        if (attacker.status) {
            if (attacker.status.includes('burn')) {
                damage *= 0.8; // Reduced attack when burned
            }
            if (attacker.status.includes('poison')) {
                damage *= 0.9;
            }
        }
        
        // Check defender status
        if (defender.status) {
            if (defender.status.includes('defend')) {
                damage *= this.battleModifiers.defend;
            }
            if (defender.status.includes('shield')) {
                damage *= 0.7;
            }
        }
        
        return damage;
    }
    
    /**
     * Apply move effects
     */
    async applyMoveEffect(effect, attacker, defender) {
        switch (effect.type) {
            case 'status':
                await this.applyStatus(defender, effect.status);
                break;
                
            case 'heal':
                attacker.damage = Math.max(0, (attacker.damage || 0) - effect.amount);
                break;
                
            case 'boost':
                attacker[effect.stat] = (attacker[effect.stat] || 0) + effect.amount;
                break;
                
            case 'drain':
                const drained = Math.min(defender.defense - defender.damage, effect.amount);
                defender.damage += drained;
                attacker.damage = Math.max(0, (attacker.damage || 0) - drained);
                break;
                
            case 'multi_hit':
                // Handle multi-hit attacks
                for (let i = 0; i < effect.hits; i++) {
                    await this.executeAttack(attacker, defender);
                }
                break;
        }
    }
    
    /**
     * Apply status effect to a card
     */
    async applyStatus(card, status) {
        if (!card.status) card.status = [];
        
        if (!card.status.includes(status)) {
            card.status.push(status);
            
            const effect = this.statusEffects[status];
            if (effect) {
                card.statusDuration = card.statusDuration || {};
                card.statusDuration[status] = effect.duration;
            }
            
            this.emit('statusApplied', {
                card,
                status,
                effect
            });
        }
    }
    
    /**
     * Process status effects at turn start
     */
    processStatusEffects(card) {
        if (!card.status || card.status.length === 0) return;
        
        const toRemove = [];
        
        for (const status of card.status) {
            const effect = this.statusEffects[status];
            if (!effect) continue;
            
            // Apply damage effects
            if (effect.damage) {
                card.damage = (card.damage || 0) + effect.damage;
                console.log(`${status} deals ${effect.damage} damage to ${card.name}`);
            }
            
            // Reduce duration
            if (card.statusDuration && card.statusDuration[status]) {
                card.statusDuration[status]--;
                if (card.statusDuration[status] <= 0) {
                    toRemove.push(status);
                }
            }
        }
        
        // Remove expired statuses
        card.status = card.status.filter(s => !toRemove.includes(s));
    }
    
    /**
     * Special battle modes
     */
    
    // Pokemon-style battle with switching
    async pokemonBattle(player1Team, player2Team) {
        const battle = this.createBattle(player1Team[0].owner, player2Team[0].owner, 'pokemon');
        
        // Set active Pokemon
        battle.players.player1.activePokemon = player1Team[0];
        battle.players.player1.bench = player1Team.slice(1);
        
        battle.players.player2.activePokemon = player2Team[0];
        battle.players.player2.bench = player2Team.slice(1);
        
        return battle;
    }
    
    // Switch Pokemon
    async switchPokemon(playerKey, benchIndex) {
        if (!this.activeBattle) throw new Error('No active battle');
        
        const player = this.activeBattle.players[playerKey];
        if (benchIndex >= player.bench.length) {
            throw new Error('Invalid bench index');
        }
        
        // Swap active with bench
        const newActive = player.bench[benchIndex];
        player.bench[benchIndex] = player.activePokemon;
        player.activePokemon = newActive;
        
        this.emit('pokemonSwitched', {
            player: playerKey,
            newActive: newActive.name
        });
    }
    
    // Speed-based turn order
    determineTurnOrder(cards) {
        return cards.sort((a, b) => {
            // Check for priority moves
            if (a.priority && !b.priority) return -1;
            if (b.priority && !a.priority) return 1;
            
            // Compare speed
            return (b.speed || 0) - (a.speed || 0);
        });
    }
    
    // Area damage
    async executeAreaAttack(attacker, defenders, move) {
        const results = [];
        
        for (const defender of defenders) {
            const result = await this.executeAttack(attacker, defender, move);
            results.push(result);
        }
        
        return results;
    }
    
    // Counter attack mechanics
    async checkCounterAttack(attacker, defender) {
        // Check if defender has counter ability
        if (defender.abilities && defender.abilities.includes('counter')) {
            if (Math.random() < 0.3) { // 30% counter chance
                console.log(`⚔️ ${defender.name} counter attacks!`);
                return await this.executeAttack(defender, attacker);
            }
        }
        
        return null;
    }
    
    // Combo system
    async executeCombo(cards, target) {
        let comboMultiplier = 1;
        const results = [];
        
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            
            // Increase combo multiplier
            comboMultiplier += 0.5;
            
            // Apply combo bonus
            card.power = Math.floor(card.power * comboMultiplier);
            
            const result = await this.executeAttack(card, target);
            results.push(result);
            
            // Reset power
            card.power = Math.floor(card.power / comboMultiplier);
        }
        
        this.emit('comboExecuted', {
            cards: cards.map(c => c.name),
            totalDamage: results.reduce((sum, r) => sum + r.damage, 0),
            comboLength: cards.length
        });
        
        return results;
    }
    
    // Win condition checks
    checkWinConditions(battle) {
        // Check HP depletion
        for (const [key, player] of Object.entries(battle.players)) {
            if (player.hp <= 0) {
                battle.winner = key === 'player1' ? 'player2' : 'player1';
                return true;
            }
        }
        
        // Check Pokemon knockout (all fainted)
        if (battle.type === 'pokemon') {
            for (const [key, player] of Object.entries(battle.players)) {
                const allFainted = !player.activePokemon || 
                    (player.activePokemon.knocked_out && 
                     player.bench.every(p => p.knocked_out));
                
                if (allFainted) {
                    battle.winner = key === 'player1' ? 'player2' : 'player1';
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Get battle statistics
    getBattleStats(battle) {
        return {
            battleId: battle.id,
            type: battle.type,
            turn: battle.turn,
            players: Object.entries(battle.players).map(([key, player]) => ({
                id: key,
                hp: player.hp,
                cardsRemaining: player.activePokemon ? 
                    1 + player.bench.filter(p => !p.knocked_out).length : 0,
                status: player.status
            })),
            winner: battle.winner,
            duration: battle.log.length
        };
    }
}

// Card ability definitions
const cardAbilities = {
    // Passive abilities
    sturdy: {
        type: 'passive',
        description: 'Survive one hit KO with 1 HP',
        trigger: 'beforeDamage'
    },
    
    regeneration: {
        type: 'passive',
        description: 'Heal 5 HP at turn start',
        trigger: 'turnStart',
        effect: { heal: 5 }
    },
    
    intimidate: {
        type: 'passive',
        description: 'Lower opponent attack on entry',
        trigger: 'onEntry',
        effect: { stat: 'power', amount: -10 }
    },
    
    // Active abilities
    doubleStrike: {
        type: 'active',
        description: 'Attack twice',
        cost: 2,
        effect: { type: 'multi_hit', hits: 2 }
    },
    
    healingWave: {
        type: 'active',
        description: 'Restore 30 HP',
        cost: 3,
        effect: { type: 'heal', amount: 30 }
    },
    
    elementalBurst: {
        type: 'active',
        description: 'Deal damage based on energy cards',
        cost: 5,
        effect: { type: 'special', calculation: 'energyCount' }
    }
};

// Move definitions
const moves = {
    // Basic attacks
    tackle: {
        name: 'Tackle',
        basePower: 20,
        accuracy: 100,
        pp: 35,
        type: 'neutral'
    },
    
    ember: {
        name: 'Ember',
        basePower: 30,
        accuracy: 95,
        pp: 25,
        type: 'fire',
        effect: { type: 'status', status: 'burn', chance: 0.1 }
    },
    
    waterGun: {
        name: 'Water Gun',
        basePower: 35,
        accuracy: 100,
        pp: 25,
        type: 'water'
    },
    
    // Status moves
    protect: {
        name: 'Protect',
        basePower: 0,
        accuracy: 100,
        pp: 10,
        priority: true,
        effect: { type: 'status', status: 'shield', self: true }
    },
    
    poisonPowder: {
        name: 'Poison Powder',
        basePower: 0,
        accuracy: 75,
        pp: 35,
        effect: { type: 'status', status: 'poison' }
    },
    
    // Powerful moves
    hyperBeam: {
        name: 'Hyper Beam',
        basePower: 120,
        accuracy: 90,
        pp: 5,
        type: 'neutral',
        recharge: true
    },
    
    drainLife: {
        name: 'Drain Life',
        basePower: 50,
        accuracy: 100,
        pp: 15,
        effect: { type: 'drain', amount: 25 }
    }
};

module.exports = { CardBattleSystem, cardAbilities, moves };

// Testing
if (require.main === module) {
    const battleSystem = new CardBattleSystem();
    
    console.log('⚔️ Testing Card Battle System\n');
    
    // Create test cards
    const fireCard = {
        name: 'Fire Dragon',
        power: 50,
        defense: 40,
        speed: 30,
        element: 'fire',
        damage: 0
    };
    
    const waterCard = {
        name: 'Water Serpent',
        power: 40,
        defense: 50,
        speed: 35,
        element: 'water',
        damage: 0
    };
    
    // Test basic attack
    (async () => {
        console.log('🎯 Testing basic attack...');
        const result = await battleSystem.executeAttack(fireCard, waterCard);
        console.log(result.log.join('\n'));
        console.log(`Water Serpent HP: ${waterCard.defense - waterCard.damage}/${waterCard.defense}`);
        
        console.log('\n🎯 Testing type advantage...');
        const result2 = await battleSystem.executeAttack(waterCard, fireCard);
        console.log(result2.log.join('\n'));
        console.log(`Fire Dragon HP: ${fireCard.defense - fireCard.damage}/${fireCard.defense}`);
        
        console.log('\n🎯 Testing move with effect...');
        const result3 = await battleSystem.executeAttack(fireCard, waterCard, moves.ember);
        console.log(result3.log.join('\n'));
    })();
}