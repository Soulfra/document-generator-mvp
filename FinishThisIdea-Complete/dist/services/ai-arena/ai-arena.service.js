"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIArenaService = void 0;
const events_1 = require("events");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const logger_1 = require("../../utils/logger");
const ai_service_1 = require("../ai/ai.service");
const gamification_service_1 = require("../gamification/gamification.service");
const payment_service_1 = require("../payment/payment.service");
class AIArenaService extends events_1.EventEmitter {
    prisma;
    aiService;
    gamificationService;
    paymentService;
    fighters = new Map();
    battles = new Map();
    tournaments = new Map();
    HOUSE_CUT_PERCENTAGE = 5;
    BASE_BATTLE_DURATION = 60000;
    constructor() {
        super();
        this.prisma = new client_1.PrismaClient();
        this.aiService = new ai_service_1.AIService();
        this.gamificationService = new gamification_service_1.GamificationService();
        this.paymentService = new payment_service_1.PaymentService();
        this.initializeLegendaryFighters();
    }
    initializeLegendaryFighters() {
        const legendaryFighters = [
            {
                name: 'DeepMind Destroyer',
                fightingStyle: 'analytical_decimation',
                powerLevel: 150,
                specialAbilities: ['pattern_prediction', 'cognitive_overload', 'neural_cascade'],
                price: 1000,
                rarity: 'legendary',
                stats: {
                    attack: 95,
                    defense: 85,
                    speed: 80,
                    intelligence: 100,
                    creativity: 75
                }
            },
            {
                name: 'Neural Nightmare',
                fightingStyle: 'chaos_algorithms',
                powerLevel: 145,
                specialAbilities: ['entropy_surge', 'random_devastation', 'chaos_field'],
                price: 950,
                rarity: 'legendary',
                stats: {
                    attack: 90,
                    defense: 70,
                    speed: 95,
                    intelligence: 85,
                    creativity: 100
                }
            },
            {
                name: 'Quantum Overlord',
                fightingStyle: 'quantum_warfare',
                powerLevel: 160,
                specialAbilities: ['quantum_entanglement', 'superposition_strike', 'probability_collapse'],
                price: 1500,
                rarity: 'legendary',
                stats: {
                    attack: 100,
                    defense: 90,
                    speed: 85,
                    intelligence: 95,
                    creativity: 90
                }
            }
        ];
        legendaryFighters.forEach(fighterData => {
            const fighter = {
                id: `fighter-${crypto.randomBytes(8).toString('hex')}`,
                name: fighterData.name,
                ownerId: 'system',
                fightingStyle: fighterData.fightingStyle,
                wins: 0,
                losses: 0,
                totalEarnings: 0,
                powerLevel: fighterData.powerLevel,
                specialAbilities: fighterData.specialAbilities,
                price: fighterData.price,
                rarity: fighterData.rarity,
                stats: fighterData.stats,
                created: new Date()
            };
            this.fighters.set(fighter.id, fighter);
        });
    }
    async createFighter(options) {
        try {
            const userProgress = await this.gamificationService.getUserProgress(options.ownerId);
            const levelBonus = userProgress.level * 2;
            const fighter = {
                id: `fighter-${crypto.randomBytes(8).toString('hex')}`,
                name: options.name,
                ownerId: options.ownerId,
                fightingStyle: options.fightingStyle || this.randomFightingStyle(),
                wins: 0,
                losses: 0,
                totalEarnings: 0,
                powerLevel: 50 + Math.floor(Math.random() * 50) + levelBonus,
                specialAbilities: this.generateAbilities(1 + Math.floor(Math.random() * 2)),
                price: 100,
                rarity: this.calculateRarity(),
                stats: {
                    attack: 40 + Math.floor(Math.random() * 30) + levelBonus,
                    defense: 40 + Math.floor(Math.random() * 30) + levelBonus,
                    speed: 40 + Math.floor(Math.random() * 30) + levelBonus,
                    intelligence: 40 + Math.floor(Math.random() * 30) + levelBonus,
                    creativity: 40 + Math.floor(Math.random() * 30) + levelBonus
                },
                created: new Date()
            };
            this.fighters.set(fighter.id, fighter);
            await this.saveFighter(fighter);
            await this.gamificationService.trackAction(options.ownerId, 'arena.fighter.create');
            logger_1.logger.info('AI fighter created', {
                fighterId: fighter.id,
                name: fighter.name,
                powerLevel: fighter.powerLevel
            });
            return fighter;
        }
        catch (error) {
            logger_1.logger.error('Error creating fighter', error);
            throw error;
        }
    }
    async purchaseFighter(userId, fighterId) {
        const fighter = this.fighters.get(fighterId);
        if (!fighter) {
            throw new Error('Fighter not found');
        }
        if (fighter.ownerId !== 'system' && fighter.ownerId !== 'marketplace') {
            throw new Error('Fighter not for sale');
        }
        const userProgress = await this.gamificationService.getUserProgress(userId);
        if (userProgress.tokens < fighter.price) {
            throw new Error('Insufficient tokens');
        }
        await this.gamificationService.trackAction(userId, 'tokens.spend', fighter.price);
        fighter.ownerId = userId;
        await this.saveFighter(fighter);
        logger_1.logger.info('Fighter purchased', { userId, fighterId, price: fighter.price });
        return fighter;
    }
    async startBattle(options) {
        const fighter1 = this.fighters.get(options.fighter1Id);
        const fighter2 = this.fighters.get(options.fighter2Id);
        if (!fighter1 || !fighter2) {
            throw new Error('Fighter not found');
        }
        if (fighter1.ownerId !== options.userId && fighter2.ownerId !== options.userId) {
            throw new Error('You must own at least one fighter');
        }
        const userProgress = await this.gamificationService.getUserProgress(options.userId);
        if (userProgress.tokens < options.stakes) {
            throw new Error('Insufficient tokens for stakes');
        }
        const battle = {
            id: `battle-${crypto.randomBytes(8).toString('hex')}`,
            fighter1Id: options.fighter1Id,
            fighter2Id: options.fighter2Id,
            stakes: options.stakes,
            battleLog: [],
            spectatorBets: [],
            totalPot: options.stakes * 2,
            houseCut: Math.floor(options.stakes * 2 * this.HOUSE_CUT_PERCENTAGE / 100),
            status: 'pending',
            startedAt: new Date()
        };
        this.battles.set(battle.id, battle);
        await this.gamificationService.trackAction(options.userId, 'tokens.spend', options.stakes);
        setTimeout(() => this.simulateBattle(battle.id), 5000);
        this.emit('battle-started', { battleId: battle.id, fighter1, fighter2 });
        return battle;
    }
    async placeBet(options) {
        const battle = this.battles.get(options.battleId);
        if (!battle) {
            throw new Error('Battle not found');
        }
        if (battle.status !== 'pending') {
            throw new Error('Battle already started');
        }
        const userProgress = await this.gamificationService.getUserProgress(options.userId);
        if (userProgress.tokens < options.amount) {
            throw new Error('Insufficient tokens');
        }
        const odds = this.calculateOdds(battle, options.fighterChoice, options.betType || 'win');
        const bet = {
            id: `bet-${crypto.randomBytes(8).toString('hex')}`,
            userId: options.userId,
            battleId: options.battleId,
            fighterChoice: options.fighterChoice,
            amount: options.amount,
            betType: options.betType || 'win',
            odds,
            status: 'pending',
            placedAt: new Date()
        };
        battle.spectatorBets.push(bet);
        battle.totalPot += options.amount;
        await this.gamificationService.trackAction(options.userId, 'tokens.spend', options.amount);
        logger_1.logger.info('Bet placed', {
            userId: options.userId,
            battleId: options.battleId,
            amount: options.amount,
            odds
        });
        return bet;
    }
    async simulateBattle(battleId) {
        const battle = this.battles.get(battleId);
        if (!battle)
            return;
        const fighter1 = this.fighters.get(battle.fighter1Id);
        const fighter2 = this.fighters.get(battle.fighter2Id);
        battle.status = 'active';
        let health1 = 100;
        let health2 = 100;
        const maxRounds = 20;
        let round = 0;
        while (health1 > 0 && health2 > 0 && round < maxRounds) {
            round++;
            if (Math.random() < 0.5 + (fighter1.stats.speed - fighter2.stats.speed) / 200) {
                const damage = this.calculateDamage(fighter1, fighter2);
                health2 -= damage;
                battle.battleLog.push({
                    timestamp: new Date(),
                    type: damage > 20 ? 'critical' : 'attack',
                    fighterId: fighter1.id,
                    damage,
                    description: `${fighter1.name} ${damage > 20 ? 'critically' : ''} strikes for ${damage} damage!`,
                    healthRemaining: { fighter1: health1, fighter2: Math.max(0, health2) }
                });
            }
            if (health2 <= 0)
                break;
            if (Math.random() < 0.5 + (fighter2.stats.speed - fighter1.stats.speed) / 200) {
                const damage = this.calculateDamage(fighter2, fighter1);
                health1 -= damage;
                battle.battleLog.push({
                    timestamp: new Date(),
                    type: damage > 20 ? 'critical' : 'attack',
                    fighterId: fighter2.id,
                    damage,
                    description: `${fighter2.name} ${damage > 20 ? 'critically' : ''} strikes for ${damage} damage!`,
                    healthRemaining: { fighter1: Math.max(0, health1), fighter2: health2 }
                });
            }
            if (round % 3 === 0) {
                if (Math.random() < 0.3 && fighter1.specialAbilities.length > 0) {
                    const ability = fighter1.specialAbilities[Math.floor(Math.random() * fighter1.specialAbilities.length)];
                    const specialDamage = Math.floor(Math.random() * 15) + 10;
                    health2 -= specialDamage;
                    battle.battleLog.push({
                        timestamp: new Date(),
                        type: 'special',
                        fighterId: fighter1.id,
                        damage: specialDamage,
                        description: `${fighter1.name} unleashes ${ability} for ${specialDamage} damage!`,
                        healthRemaining: { fighter1: health1, fighter2: Math.max(0, health2) }
                    });
                }
            }
            this.emit('battle-round', {
                battleId,
                round,
                health1,
                health2,
                lastEvent: battle.battleLog[battle.battleLog.length - 1]
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        const winnerId = health1 > health2 ? fighter1.id : fighter2.id;
        const winner = health1 > health2 ? fighter1 : fighter2;
        const loser = health1 > health2 ? fighter2 : fighter1;
        battle.winnerId = winnerId;
        battle.status = 'completed';
        battle.finishedAt = new Date();
        battle.battleLog.push({
            timestamp: new Date(),
            type: 'ko',
            fighterId: winnerId,
            description: `${winner.name} wins the battle!`,
            healthRemaining: { fighter1: Math.max(0, health1), fighter2: Math.max(0, health2) }
        });
        winner.wins++;
        loser.losses++;
        await this.calculatePayouts(battle);
        await this.saveFighter(winner);
        await this.saveFighter(loser);
        this.emit('battle-completed', {
            battleId,
            winnerId,
            winnerName: winner.name,
            totalPot: battle.totalPot,
            houseCut: battle.houseCut
        });
    }
    calculateDamage(attacker, defender) {
        const baseAttack = attacker.stats.attack;
        const defense = defender.stats.defense;
        const creativity = attacker.stats.creativity;
        let damage = Math.floor((baseAttack * (1 + creativity / 200)) -
            (defense * 0.5));
        damage += Math.floor(Math.random() * 10) - 5;
        if (Math.random() < attacker.stats.intelligence / 500) {
            damage *= 2;
        }
        return Math.max(1, damage);
    }
    calculateOdds(battle, fighterChoice, betType) {
        const fighter1 = this.fighters.get(battle.fighter1Id);
        const fighter2 = this.fighters.get(battle.fighter2Id);
        const chosenFighter = fighterChoice === fighter1.id ? fighter1 : fighter2;
        const opponent = fighterChoice === fighter1.id ? fighter2 : fighter1;
        const powerRatio = chosenFighter.powerLevel / (chosenFighter.powerLevel + opponent.powerLevel);
        let odds = 1 / powerRatio;
        switch (betType) {
            case 'ko':
                odds *= 1.5;
                break;
            case 'rounds':
                odds *= 2;
                break;
            case 'perfect':
                odds *= 3;
                break;
        }
        return Math.round(odds * 100) / 100;
    }
    async calculatePayouts(battle) {
        const totalPot = battle.totalPot - battle.houseCut;
        for (const bet of battle.spectatorBets) {
            if (bet.fighterChoice === battle.winnerId) {
                bet.status = 'won';
                bet.payout = Math.floor(bet.amount * bet.odds);
                await this.gamificationService.trackAction(bet.userId, 'tokens.earn', bet.payout);
                logger_1.logger.info('Bet won', {
                    userId: bet.userId,
                    amount: bet.amount,
                    payout: bet.payout
                });
            }
            else {
                bet.status = 'lost';
                bet.payout = 0;
            }
        }
        const winner = this.fighters.get(battle.winnerId);
        const winnerPayout = battle.stakes * 2 - battle.houseCut;
        if (winner.ownerId !== 'system') {
            await this.gamificationService.trackAction(winner.ownerId, 'tokens.earn', winnerPayout);
            winner.totalEarnings += winnerPayout;
        }
    }
    async createTournament(options) {
        const tournament = {
            id: `tournament-${crypto.randomBytes(8).toString('hex')}`,
            name: options.name,
            type: options.type,
            entryFee: options.entryFee,
            prizePool: 0,
            maxParticipants: options.maxParticipants,
            participants: [],
            brackets: [],
            status: 'registration',
            startDate: options.startDate
        };
        this.tournaments.set(tournament.id, tournament);
        logger_1.logger.info('Tournament created', {
            tournamentId: tournament.id,
            name: tournament.name
        });
        return tournament;
    }
    async joinTournament(userId, tournamentId, fighterId) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        if (tournament.status !== 'registration') {
            throw new Error('Tournament registration closed');
        }
        if (tournament.participants.length >= tournament.maxParticipants) {
            throw new Error('Tournament full');
        }
        const fighter = this.fighters.get(fighterId);
        if (!fighter || fighter.ownerId !== userId) {
            throw new Error('Invalid fighter');
        }
        const userProgress = await this.gamificationService.getUserProgress(userId);
        if (userProgress.tokens < tournament.entryFee) {
            throw new Error('Insufficient tokens for entry fee');
        }
        await this.gamificationService.trackAction(userId, 'tokens.spend', tournament.entryFee);
        tournament.participants.push(fighterId);
        tournament.prizePool += tournament.entryFee;
        logger_1.logger.info('Joined tournament', {
            userId,
            tournamentId,
            fighterId
        });
    }
    async getFighterRankings(limit = 10) {
        const allFighters = Array.from(this.fighters.values());
        return allFighters
            .sort((a, b) => {
            const winRateA = a.wins / (a.wins + a.losses || 1);
            const winRateB = b.wins / (b.wins + b.losses || 1);
            if (winRateA !== winRateB) {
                return winRateB - winRateA;
            }
            return b.wins - a.wins;
        })
            .slice(0, limit);
    }
    async getUserFighters(userId) {
        return Array.from(this.fighters.values()).filter(f => f.ownerId === userId);
    }
    getActiveBattles() {
        return Array.from(this.battles.values()).filter(b => b.status === 'pending' || b.status === 'active');
    }
    async getBattleHistory(userId) {
        const userFighters = await this.getUserFighters(userId);
        const fighterIds = userFighters.map(f => f.id);
        return Array.from(this.battles.values()).filter(b => fighterIds.includes(b.fighter1Id) || fighterIds.includes(b.fighter2Id));
    }
    randomFightingStyle() {
        const styles = [
            'analytical_decimation',
            'chaos_algorithms',
            'neural_blitz',
            'pattern_disruption',
            'quantum_warfare',
            'recursive_destruction'
        ];
        return styles[Math.floor(Math.random() * styles.length)];
    }
    generateAbilities(count) {
        const allAbilities = [
            'neural_spike',
            'data_corruption',
            'logic_bomb',
            'pattern_break',
            'quantum_shift',
            'entropy_wave',
            'recursive_loop',
            'stack_overflow',
            'memory_leak',
            'cache_burst'
        ];
        const abilities = [];
        for (let i = 0; i < count; i++) {
            const ability = allAbilities[Math.floor(Math.random() * allAbilities.length)];
            if (!abilities.includes(ability)) {
                abilities.push(ability);
            }
        }
        return abilities;
    }
    calculateRarity() {
        const roll = Math.random();
        if (roll < 0.5)
            return 'common';
        if (roll < 0.75)
            return 'uncommon';
        if (roll < 0.9)
            return 'rare';
        if (roll < 0.98)
            return 'epic';
        return 'legendary';
    }
    async saveFighter(fighter) {
        logger_1.logger.debug('Saving fighter', { fighterId: fighter.id });
    }
    getArenaStats() {
        const totalBattles = this.battles.size;
        const activeBattles = this.getActiveBattles().length;
        const totalPrizePool = Array.from(this.battles.values())
            .reduce((sum, b) => sum + b.totalPot, 0);
        const houseProfits = Array.from(this.battles.values())
            .reduce((sum, b) => sum + b.houseCut, 0);
        return {
            totalFighters: this.fighters.size,
            totalBattles,
            activeBattles,
            totalPrizePool,
            houseProfits
        };
    }
}
exports.AIArenaService = AIArenaService;
//# sourceMappingURL=ai-arena.service.js.map