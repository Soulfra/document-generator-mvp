import { EventEmitter } from 'events';
interface DashboardConfig {
    port: number;
    wsPort: number;
    updateInterval: number;
    enabledDashboards: string[];
}
export declare class DashboardService extends EventEmitter {
    private config;
    private app;
    private server;
    private wss;
    private prisma;
    private metricsService;
    private aiService;
    private gamificationService;
    private arenaService;
    private routingDaemon;
    private clients;
    private updateIntervals;
    private dashboards;
    constructor(config: DashboardConfig);
    private setupExpress;
    private setupWebSocket;
    private handleClientMessage;
    private subscribeToDashboard;
    private unsubscribeFromDashboard;
    private handleDashboardQuery;
    private startUpdateCycles;
    private broadcastDashboardUpdate;
    private getDashboardData;
    private getConsciousnessData;
    private getExecutiveData;
    private getSystemHealthData;
    private getEconomyData;
    private getArenaData;
    private getAnalyticsData;
    private getGamificationData;
    private queryConsciousnessData;
    private queryEconomyData;
    private queryAnalyticsData;
    start(): Promise<void>;
    stop(): Promise<void>;
    getStats(): {
        connectedClients: number;
        activeDashboards: string[];
        totalSubscriptions: number;
    };
}
export {};
//# sourceMappingURL=dashboard.service.d.ts.map