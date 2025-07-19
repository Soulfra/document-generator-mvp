/**
 * AI Arena Service
 * Adapted from Soulfra-AgentZero's AI_VS_AI_ARENA.py and related systems
 * Provides AI battles, tournaments, and betting functionality
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { logger } from '../../utils/logger';
import { AIService } from '../ai/ai.service';
import { GamificationService } from '../gamification/gamification.service';
import { PaymentService } from '../payment/payment.service';

interface AIFighter {
  id: string;
  name: string;
  ownerId: string;
  fightingStyle: FightingStyle;
  wins: number;
  losses: number;
  totalEarnings: number;
  powerLevel: number;
  specialAbilities: string[];
  price: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: {
    attack: number;
    defense: number;
    speed: number;
    intelligence: number;
    creativity: number;
  };
  created: Date;
}

type FightingStyle = 
  | 'analytical_decimation'
  | 'chaos_algorithms'
  | 'neural_blitz'
  | 'pattern_disruption'
  | 'quantum_warfare'
  | 'recursive_destruction';

interface Battle {
  id: string;
  fighter1Id: string;
  fighter2Id: string;
  stakes: number;
  winnerId?: string;
  battleLog: BattleEvent[];
  spectatorBets: Bet[];
  totalPot: number;
  houseCut: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startedAt?: Date;
  finishedAt?: Date;
  tournamentId?: string;
}

interface BattleEvent {
  timestamp: Date;
  type: 'attack' | 'defend' | 'special' | 'critical' | 'ko';
  fighterId: string;
  damage?: number;
  description: string;
  healthRemaining: {
    fighter1: number;
    fighter2: number;
  };
}

interface Bet {
  id: string;
  userId: string;
  battleId: string;
  fighterChoice: string;
  amount: number;
  betType: 'win' | 'ko' | 'rounds' | 'perfect';
  odds: number;
  payout?: number;
  status: 'pending' | 'won' | 'lost';
  placedAt: Date;
}

interface Tournament {
  id: string;
  name: string;
  type: 'single_elimination' | 'round_robin' | 'swiss';
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  participants: string[];
  brackets: TournamentBracket[];
  status: 'registration' | 'active' | 'completed';
  startDate: Date;
}

interface TournamentBracket {
  round: number;
  matches: {
    fighter1Id: string;
    fighter2Id: string;
    winnerId?: string;
    battleId?: string;
  }[];
}

export class AIArenaService extends EventEmitter {
  private prisma: PrismaClient;
  private aiService: AIService;
  private gamificationService: GamificationService;
  private paymentService: PaymentService;
  
  private fighters: Map<string, AIFighter> = new Map();
  private battles: Map<string, Battle> = new Map();
  private tournaments: Map<string, Tournament> = new Map();
  
  private readonly HOUSE_CUT_PERCENTAGE = 5; // 5% house cut
  private readonly BASE_BATTLE_DURATION = 60000; // 60 seconds

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.aiService = new AIService();
    this.gamificationService = new GamificationService();
    this.paymentService = new PaymentService();
    
    this.initializeLegendaryFighters();
  }

  /**
   * Initialize legendary AI fighters
   */
  private initializeLegendaryFighters(): void {
    const legendaryFighters = [
      {
        name: 'DeepMind Destroyer',
        fightingStyle: 'analytical_decimation' as FightingStyle,
        powerLevel: 150,
        specialAbilities: ['pattern_prediction', 'cognitive_overload', 'neural_cascade'],
        price: 1000,
        rarity: 'legendary' as const,
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
        fightingStyle: 'chaos_algorithms' as FightingStyle,
        powerLevel: 145,
        specialAbilities: ['entropy_surge', 'random_devastation', 'chaos_field'],
        price: 950,
        rarity: 'legendary' as const,
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
        fightingStyle: 'quantum_warfare' as FightingStyle,
        powerLevel: 160,
        specialAbilities: ['quantum_entanglement', 'superposition_strike', 'probability_collapse'],
        price: 1500,
        rarity: 'legendary' as const,
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
      const fighter: AIFighter = {
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

  /**
   * Create a new AI fighter
   */
  async createFighter(options: {
    name: string;
    ownerId: string;
    fightingStyle?: FightingStyle;
  }): Promise<AIFighter> {
    try {
      // Generate fighter stats based on randomness and user level
      const userProgress = await this.gamificationService.getUserProgress(options.ownerId);
      const levelBonus = userProgress.level * 2;
      
      const fighter: AIFighter = {
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
      
      // Store fighter
      this.fighters.set(fighter.id, fighter);
      await this.saveFighter(fighter);
      
      // Track creation
      await this.gamificationService.trackAction(options.ownerId, 'arena.fighter.create');
      
      logger.info('AI fighter created', { 
        fighterId: fighter.id,
        name: fighter.name,
        powerLevel: fighter.powerLevel 
      });
      
      return fighter;
    } catch (error) {
      logger.error('Error creating fighter', error);
      throw error;
    }
  }

  /**
   * Purchase a fighter from marketplace
   */
  async purchaseFighter(userId: string, fighterId: string): Promise<AIFighter> {
    const fighter = this.fighters.get(fighterId);
    if (!fighter) {
      throw new Error('Fighter not found');
    }
    
    if (fighter.ownerId !== 'system' && fighter.ownerId !== 'marketplace') {
      throw new Error('Fighter not for sale');
    }
    
    // Check user balance
    const userProgress = await this.gamificationService.getUserProgress(userId);
    if (userProgress.tokens < fighter.price) {
      throw new Error('Insufficient tokens');
    }
    
    // Process purchase
    await this.gamificationService.trackAction(userId, 'tokens.spend', fighter.price);
    
    // Transfer ownership
    fighter.ownerId = userId;
    await this.saveFighter(fighter);
    
    logger.info('Fighter purchased', { userId, fighterId, price: fighter.price });
    
    return fighter;
  }

  /**
   * Start a battle between two fighters
   */
  async startBattle(options: {
    fighter1Id: string;
    fighter2Id: string;
    stakes: number;
    userId: string;
  }): Promise<Battle> {
    const fighter1 = this.fighters.get(options.fighter1Id);
    const fighter2 = this.fighters.get(options.fighter2Id);
    
    if (!fighter1 || !fighter2) {
      throw new Error('Fighter not found');
    }
    
    // Verify ownership
    if (fighter1.ownerId !== options.userId && fighter2.ownerId !== options.userId) {
      throw new Error('You must own at least one fighter');
    }
    
    // Check stakes
    const userProgress = await this.gamificationService.getUserProgress(options.userId);
    if (userProgress.tokens < options.stakes) {
      throw new Error('Insufficient tokens for stakes');
    }
    
    // Create battle
    const battle: Battle = {
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
    
    // Deduct stakes
    await this.gamificationService.trackAction(options.userId, 'tokens.spend', options.stakes);
    
    // Start battle simulation
    setTimeout(() => this.simulateBattle(battle.id), 5000); // 5 second delay
    
    this.emit('battle-started', { battleId: battle.id, fighter1, fighter2 });
    
    return battle;
  }

  /**
   * Place a bet on a battle
   */
  async placeBet(options: {
    userId: string;
    battleId: string;
    fighterChoice: string;
    amount: number;
    betType?: 'win' | 'ko' | 'rounds' | 'perfect';
  }): Promise<Bet> {
    const battle = this.battles.get(options.battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }
    
    if (battle.status !== 'pending') {
      throw new Error('Battle already started');
    }
    
    // Check user balance
    const userProgress = await this.gamificationService.getUserProgress(options.userId);
    if (userProgress.tokens < options.amount) {
      throw new Error('Insufficient tokens');
    }
    
    // Calculate odds
    const odds = this.calculateOdds(battle, options.fighterChoice, options.betType || 'win');
    
    // Create bet
    const bet: Bet = {
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
    
    // Add to battle
    battle.spectatorBets.push(bet);
    battle.totalPot += options.amount;
    
    // Deduct tokens
    await this.gamificationService.trackAction(options.userId, 'tokens.spend', options.amount);
    
    logger.info('Bet placed', { 
      userId: options.userId,
      battleId: options.battleId,
      amount: options.amount,
      odds 
    });
    
    return bet;
  }

  /**
   * Simulate a battle
   */
  private async simulateBattle(battleId: string): Promise<void> {
    const battle = this.battles.get(battleId);
    if (!battle) return;
    
    const fighter1 = this.fighters.get(battle.fighter1Id)!;
    const fighter2 = this.fighters.get(battle.fighter2Id)!;
    
    battle.status = 'active';
    
    // Initialize health
    let health1 = 100;
    let health2 = 100;
    
    // Battle simulation
    const maxRounds = 20;
    let round = 0;
    
    while (health1 > 0 && health2 > 0 && round < maxRounds) {
      round++;
      
      // Fighter 1 attack
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
      
      if (health2 <= 0) break;
      
      // Fighter 2 attack
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
      
      // Special ability chance
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
      
      // Emit round update
      this.emit('battle-round', {
        battleId,
        round,
        health1,
        health2,
        lastEvent: battle.battleLog[battle.battleLog.length - 1]
      });
      
      // Delay between rounds
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Determine winner
    const winnerId = health1 > health2 ? fighter1.id : fighter2.id;
    const winner = health1 > health2 ? fighter1 : fighter2;
    const loser = health1 > health2 ? fighter2 : fighter1;
    
    battle.winnerId = winnerId;
    battle.status = 'completed';
    battle.finishedAt = new Date();
    
    // Final event
    battle.battleLog.push({
      timestamp: new Date(),
      type: 'ko',
      fighterId: winnerId,
      description: `${winner.name} wins the battle!`,
      healthRemaining: { fighter1: Math.max(0, health1), fighter2: Math.max(0, health2) }
    });
    
    // Update fighter stats
    winner.wins++;
    loser.losses++;
    
    // Calculate payouts
    await this.calculatePayouts(battle);
    
    // Update fighters
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

  /**
   * Calculate damage
   */
  private calculateDamage(attacker: AIFighter, defender: AIFighter): number {
    const baseAttack = attacker.stats.attack;
    const defense = defender.stats.defense;
    const creativity = attacker.stats.creativity;
    
    // Base damage calculation
    let damage = Math.floor(
      (baseAttack * (1 + creativity / 200)) - 
      (defense * 0.5)
    );
    
    // Add randomness
    damage += Math.floor(Math.random() * 10) - 5;
    
    // Critical chance based on intelligence
    if (Math.random() < attacker.stats.intelligence / 500) {
      damage *= 2;
    }
    
    return Math.max(1, damage);
  }

  /**
   * Calculate betting odds
   */
  private calculateOdds(battle: Battle, fighterChoice: string, betType: string): number {
    const fighter1 = this.fighters.get(battle.fighter1Id)!;
    const fighter2 = this.fighters.get(battle.fighter2Id)!;
    
    const chosenFighter = fighterChoice === fighter1.id ? fighter1 : fighter2;
    const opponent = fighterChoice === fighter1.id ? fighter2 : fighter1;
    
    // Base odds on power level difference
    const powerRatio = chosenFighter.powerLevel / (chosenFighter.powerLevel + opponent.powerLevel);
    
    let odds = 1 / powerRatio;
    
    // Adjust for bet type
    switch (betType) {
      case 'ko':
        odds *= 1.5; // Harder to predict KO
        break;
      case 'rounds':
        odds *= 2; // Even harder to predict exact rounds
        break;
      case 'perfect':
        odds *= 3; // Perfect victory is rare
        break;
    }
    
    return Math.round(odds * 100) / 100;
  }

  /**
   * Calculate and distribute payouts
   */
  private async calculatePayouts(battle: Battle): Promise<void> {
    const totalPot = battle.totalPot - battle.houseCut;
    
    for (const bet of battle.spectatorBets) {
      if (bet.fighterChoice === battle.winnerId) {
        // Winner!
        bet.status = 'won';
        bet.payout = Math.floor(bet.amount * bet.odds);
        
        // Award tokens
        await this.gamificationService.trackAction(bet.userId, 'tokens.earn', bet.payout);
        
        logger.info('Bet won', {
          userId: bet.userId,
          amount: bet.amount,
          payout: bet.payout
        });
      } else {
        bet.status = 'lost';
        bet.payout = 0;
      }
    }
    
    // Award winner their share (stakes minus house cut)
    const winner = this.fighters.get(battle.winnerId!)!;
    const winnerPayout = battle.stakes * 2 - battle.houseCut;
    
    if (winner.ownerId !== 'system') {
      await this.gamificationService.trackAction(winner.ownerId, 'tokens.earn', winnerPayout);
      winner.totalEarnings += winnerPayout;
    }
  }

  /**
   * Create a tournament
   */
  async createTournament(options: {
    name: string;
    type: 'single_elimination' | 'round_robin' | 'swiss';
    entryFee: number;
    maxParticipants: number;
    startDate: Date;
  }): Promise<Tournament> {
    const tournament: Tournament = {
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
    
    logger.info('Tournament created', {
      tournamentId: tournament.id,
      name: tournament.name
    });
    
    return tournament;
  }

  /**
   * Join a tournament
   */
  async joinTournament(userId: string, tournamentId: string, fighterId: string): Promise<void> {
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
    
    // Check entry fee
    const userProgress = await this.gamificationService.getUserProgress(userId);
    if (userProgress.tokens < tournament.entryFee) {
      throw new Error('Insufficient tokens for entry fee');
    }
    
    // Deduct entry fee
    await this.gamificationService.trackAction(userId, 'tokens.spend', tournament.entryFee);
    
    // Add to tournament
    tournament.participants.push(fighterId);
    tournament.prizePool += tournament.entryFee;
    
    logger.info('Joined tournament', {
      userId,
      tournamentId,
      fighterId
    });
  }

  /**
   * Get fighter rankings
   */
  async getFighterRankings(limit: number = 10): Promise<AIFighter[]> {
    const allFighters = Array.from(this.fighters.values());
    
    return allFighters
      .sort((a, b) => {
        // Sort by win rate and total wins
        const winRateA = a.wins / (a.wins + a.losses || 1);
        const winRateB = b.wins / (b.wins + b.losses || 1);
        
        if (winRateA !== winRateB) {
          return winRateB - winRateA;
        }
        
        return b.wins - a.wins;
      })
      .slice(0, limit);
  }

  /**
   * Get user's fighters
   */
  async getUserFighters(userId: string): Promise<AIFighter[]> {
    return Array.from(this.fighters.values()).filter(f => f.ownerId === userId);
  }

  /**
   * Get active battles
   */
  getActiveBattles(): Battle[] {
    return Array.from(this.battles.values()).filter(b => 
      b.status === 'pending' || b.status === 'active'
    );
  }

  /**
   * Get battle history
   */
  async getBattleHistory(userId: string): Promise<Battle[]> {
    const userFighters = await this.getUserFighters(userId);
    const fighterIds = userFighters.map(f => f.id);
    
    return Array.from(this.battles.values()).filter(b =>
      fighterIds.includes(b.fighter1Id) || fighterIds.includes(b.fighter2Id)
    );
  }

  /**
   * Helper methods
   */
  private randomFightingStyle(): FightingStyle {
    const styles: FightingStyle[] = [
      'analytical_decimation',
      'chaos_algorithms',
      'neural_blitz',
      'pattern_disruption',
      'quantum_warfare',
      'recursive_destruction'
    ];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private generateAbilities(count: number): string[] {
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
    
    const abilities: string[] = [];
    for (let i = 0; i < count; i++) {
      const ability = allAbilities[Math.floor(Math.random() * allAbilities.length)];
      if (!abilities.includes(ability)) {
        abilities.push(ability);
      }
    }
    
    return abilities;
  }

  private calculateRarity(): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    const roll = Math.random();
    if (roll < 0.5) return 'common';
    if (roll < 0.75) return 'uncommon';
    if (roll < 0.9) return 'rare';
    if (roll < 0.98) return 'epic';
    return 'legendary';
  }

  private async saveFighter(fighter: AIFighter): Promise<void> {
    // In production, save to database
    logger.debug('Saving fighter', { fighterId: fighter.id });
  }

  /**
   * Get arena statistics
   */
  getArenaStats(): {
    totalFighters: number;
    totalBattles: number;
    activeBattles: number;
    totalPrizePool: number;
    houseProfits: number;
  } {
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