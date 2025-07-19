import { EventEmitter } from 'events';
interface GameSession {
    id: string;
    userId: string;
    gameType: GameType;
    platform: Platform;
    state: GameState;
    lastActivity: Date;
    expiresAt: Date;
    metadata: Record<string, any>;
}
interface GameState {
    version: number;
    timestamp: Date;
    data: Record<string, any>;
    platform: Platform;
    checksum: string;
    isDirty: boolean;
}
interface StateChange {
    id: string;
    sessionId: string;
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: Date;
    platform: Platform;
    source: string;
}
type Platform = 'discord' | 'telegram' | 'web' | 'mobile' | 'api';
type GameType = 'arena' | 'billion_dollar' | 'collaboration' | 'analysis' | 'tournament';
export declare class GameStateService extends EventEmitter {
    private prisma;
    private redis;
    private wss;
    private metricsService;
    private sessions;
    private clients;
    private stateChanges;
    private syncQueues;
    private conflictResolvers;
    private platformCapabilities;
    private config;
    constructor(wsPort?: number);
    private initializePlatformCapabilities;
    private initializeConflictResolvers;
    private setupWebSocketServer;
    private handleClientMessage;
    private authenticateClient;
    createGameSession(clientId: string, data: {
        gameType: GameType;
        initialState?: any;
    }): Promise<GameSession>;
    joinGameSession(clientId: string, sessionId: string): Promise<void>;
    private handleStateUpdate;
    private detectConflicts;
    private resolveConflicts;
    private applyStateChange;
    private broadcastToSession;
    private latestWinsHandler;
    private maxValueHandler;
    private sumValuesHandler;
    private mergeArraysHandler;
    private mergeFighterStats;
    private mergeBattleEvents;
    private mergeDocumentContent;
    private mergePermissions;
    private mergeValues;
    private getNestedValue;
    private setNestedValue;
    private calculateChecksum;
    private canAccessSession;
    private getHighestPriorityPlatform;
    private deepEqual;
    private recordStateChange;
    private getRecentStateChanges;
    private queueUserChoice;
    private scheduleStatePersistence;
    private startSyncEngine;
    private startCleanupTasks;
    private processSyncQueues;
    private processSyncBatch;
    private cleanupExpiredSessions;
    private cleanupInactiveClients;
    private pingClients;
    createSessionFromAPI(userId: string, gameType: GameType, platform: Platform, initialState?: any): Promise<GameSession>;
    updateSessionState(sessionId: string, field: string, value: any, platform: Platform, userId: string): Promise<void>;
    getSessionState(sessionId: string): GameState | null;
    getSessionHistory(sessionId: string, limit?: number): Promise<StateChange[]>;
    private persistSession;
    private loadSession;
    getStats(): {
        activeSessions: number;
        connectedClients: number;
        totalStateChanges: number;
        sessionsByGame: Record<GameType, number>;
        clientsByPlatform: Record<Platform, number>;
    };
    stop(): Promise<void>;
}
export {};
//# sourceMappingURL=game-state.service.d.ts.map