import { Server as HttpServer } from 'http';
interface ClientSession {
    id: string;
    userId?: string;
    connectedAt: Date;
    subscriptions: Set<string>;
    permissions: string[];
    lastActivity: Date;
}
export declare class WebSocketService {
    private io;
    private clients;
    private roomSubscriptions;
    private agentStatusCache;
    constructor(httpServer: HttpServer);
    private setupEventHandlers;
    private handleClientConnection;
    private handleAuthentication;
    private sendAgentList;
    private handleTaskAssignment;
    private handleAgentPause;
    private handleAgentResume;
    private handleAgentRestart;
    private sendTeamStats;
    private handleSubscription;
    private handleUnsubscription;
    private sendInitialData;
    private updateClientActivity;
    private handleClientDisconnection;
    private hasPermission;
    private broadcast;
    private broadcastToRoom;
    private startPeriodicUpdates;
    private getTotalTaskCount;
    private getCompletedTaskCount;
    private getAverageResponseTime;
    private getSystemHealth;
    private getCollaborationEventCount;
    emitToUser(userId: string, event: string, data: any): void;
    emitToAll(event: string, data: any): void;
    getConnectedClients(): number;
    getUserSessions(userId: string): ClientSession[];
}
export declare let webSocketService: WebSocketService;
export declare const initializeWebSocketService: (httpServer: HttpServer) => WebSocketService;
export {};
//# sourceMappingURL=websocket.service.d.ts.map