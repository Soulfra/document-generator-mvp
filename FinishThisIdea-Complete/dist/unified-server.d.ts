declare class UnifiedPlatformServer {
    private app;
    private httpServer;
    private io;
    private wss;
    private port;
    private wsPort;
    private clients;
    private cache;
    private integrationServices;
    constructor();
    startServer(): Promise<void>;
    private initializeIntegrationServices;
    private setupMiddleware;
    private setupWebSocket;
    private setupRoutes;
    private setupIntegrationRoutes;
    private setupPlatformRoutes;
    private setupBullDashboard;
    private handleWebSocketMessage;
    private broadcastMessage;
    private setupGracefulShutdown;
    private logStartupMessage;
}
export { UnifiedPlatformServer };
//# sourceMappingURL=unified-server.d.ts.map