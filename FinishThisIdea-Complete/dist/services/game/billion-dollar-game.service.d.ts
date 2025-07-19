import { EventEmitter } from 'events';
interface GamePlayer {
    id: string;
    userId: string;
    username: string;
    voiceBiometricHash?: string;
    agentId: string;
    contributionAmount: number;
    equityPercentage: number;
    dailyEarnings: number;
    totalEarnings: number;
    joinedAt: Date;
    lastActive: Date;
    multiplier: number;
    mysteryLayer: number;
    achievements: string[];
}
interface AIAgent {
    id: string;
    playerId: string;
    name: string;
    type: AgentType;
    level: number;
    experience: number;
    skills: AgentSkills;
    dailyOutput: number;
    totalOutput: number;
    efficiency: number;
    specialAbilities: string[];
    createdAt: Date;
}
type AgentType = 'worker' | 'trader' | 'creator' | 'gamer' | 'social' | 'educator' | 'quantum';
interface AgentSkills {
    work: number;
    trading: number;
    creativity: number;
    gaming: number;
    social: number;
    education: number;
    quantum: number;
}
export declare class BillionDollarGameService extends EventEmitter {
    private prisma;
    private aiService;
    private gamificationService;
    private paymentService;
    private webhookService;
    private players;
    private agents;
    private gameState;
    private collectiveGoals;
    private readonly ENTRY_FEE;
    private readonly TARGET_AMOUNT;
    private readonly SERVICE_FEE_PERCENTAGE;
    private readonly MYSTERY_LAYERS;
    private readonly QUANTUM_VARIANCE;
    private dailyCycleTimer?;
    constructor();
    private initializeGame;
    joinGame(userId: string, username: string, voiceBiometric?: string): Promise<{
        player: GamePlayer;
        agent: AIAgent;
        entryFee: number;
    }>;
    private createAIAgent;
    private runDailyCycle;
    private processPlayerDaily;
    private levelUpAgent;
    private checkMysteryLayers;
    private completeGame;
    private initializeCollectiveGoals;
    private checkCollectiveGoals;
    private completeCollectiveGoal;
    private generateAgentName;
    private generateInitialSkills;
    private calculateInitialOutput;
    private generateSpecialAbilities;
    private generateNewAbility;
    private getPrimarySkill;
    private isPlayerActive;
    private getExperienceRequired;
    private updateGamePhase;
    private hashVoiceBiometric;
    private recalculateEquity;
    private getTopPlayers;
    private startDailyCycle;
    private initializeQuantumSystem;
    private triggerQuantumEvent;
    private loadGameState;
    private saveGameState;
    getGameStats(): {
        totalCollected: number;
        targetAmount: number;
        progressPercentage: number;
        playerCount: number;
        activePlayerCount: number;
        topPlayers: any[];
        currentPhase: number;
        mysteryLayersUnlocked: number;
        collectiveGoals: any[];
    };
    getPlayerData(userId: string): Promise<{
        player: GamePlayer | null;
        agent: AIAgent | null;
        rank: number;
    }>;
    stop(): void;
}
export {};
//# sourceMappingURL=billion-dollar-game.service.d.ts.map