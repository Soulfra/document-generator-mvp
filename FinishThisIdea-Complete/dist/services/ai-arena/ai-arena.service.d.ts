import { EventEmitter } from 'events';
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
type FightingStyle = 'analytical_decimation' | 'chaos_algorithms' | 'neural_blitz' | 'pattern_disruption' | 'quantum_warfare' | 'recursive_destruction';
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
export declare class AIArenaService extends EventEmitter {
    private prisma;
    private aiService;
    private gamificationService;
    private paymentService;
    private fighters;
    private battles;
    private tournaments;
    private readonly HOUSE_CUT_PERCENTAGE;
    private readonly BASE_BATTLE_DURATION;
    constructor();
    private initializeLegendaryFighters;
    createFighter(options: {
        name: string;
        ownerId: string;
        fightingStyle?: FightingStyle;
    }): Promise<AIFighter>;
    purchaseFighter(userId: string, fighterId: string): Promise<AIFighter>;
    startBattle(options: {
        fighter1Id: string;
        fighter2Id: string;
        stakes: number;
        userId: string;
    }): Promise<Battle>;
    placeBet(options: {
        userId: string;
        battleId: string;
        fighterChoice: string;
        amount: number;
        betType?: 'win' | 'ko' | 'rounds' | 'perfect';
    }): Promise<Bet>;
    private simulateBattle;
    private calculateDamage;
    private calculateOdds;
    private calculatePayouts;
    createTournament(options: {
        name: string;
        type: 'single_elimination' | 'round_robin' | 'swiss';
        entryFee: number;
        maxParticipants: number;
        startDate: Date;
    }): Promise<Tournament>;
    joinTournament(userId: string, tournamentId: string, fighterId: string): Promise<void>;
    getFighterRankings(limit?: number): Promise<AIFighter[]>;
    getUserFighters(userId: string): Promise<AIFighter[]>;
    getActiveBattles(): Battle[];
    getBattleHistory(userId: string): Promise<Battle[]>;
    private randomFightingStyle;
    private generateAbilities;
    private calculateRarity;
    private saveFighter;
    getArenaStats(): {
        totalFighters: number;
        totalBattles: number;
        activeBattles: number;
        totalPrizePool: number;
        houseProfits: number;
    };
}
export {};
//# sourceMappingURL=ai-arena.service.d.ts.map