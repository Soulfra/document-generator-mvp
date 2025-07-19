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
exports.DashboardService = void 0;
const events_1 = require("events");
const ws_1 = require("ws");
const http = __importStar(require("http"));
const express = __importStar(require("express"));
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const metrics_service_1 = require("../monitoring/metrics.service");
const ai_service_1 = require("../ai/ai.service");
const gamification_service_1 = require("../gamification/gamification.service");
const ai_arena_service_1 = require("../ai-arena/ai-arena.service");
const smart_routing_daemon_1 = require("../routing/smart-routing-daemon");
class DashboardService extends events_1.EventEmitter {
    config;
    app;
    server;
    wss;
    prisma;
    metricsService;
    aiService;
    gamificationService;
    arenaService;
    routingDaemon;
    clients = new Map();
    updateIntervals = new Map();
    dashboards = {
        consciousness: 'AI Consciousness Dashboard',
        executive: 'Executive Dashboard',
        system: 'System Health Dashboard',
        economy: 'AI Economy Dashboard',
        arena: 'AI Arena Dashboard',
        analytics: 'Analytics Dashboard',
        gamification: 'Gamification Dashboard'
    };
    constructor(config) {
        super();
        this.config = config;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new ws_1.WebSocketServer({ port: config.wsPort });
        this.prisma = new client_1.PrismaClient();
        this.metricsService = new metrics_service_1.MetricsService();
        this.aiService = new ai_service_1.AIService();
        this.gamificationService = new gamification_service_1.GamificationService();
        this.arenaService = new ai_arena_service_1.AIArenaService();
        this.routingDaemon = new smart_routing_daemon_1.SmartRoutingDaemon();
        this.setupExpress();
        this.setupWebSocket();
        this.startUpdateCycles();
    }
    setupExpress() {
        this.app.use(express.static('public'));
        this.app.use(express.json());
        this.app.get('/dashboard/:type', (req, res) => {
            const dashboardType = req.params.type;
            if (!this.dashboards[dashboardType]) {
                return res.status(404).json({ error: 'Dashboard not found' });
            }
            res.sendFile(`dashboards/${dashboardType}.html`);
        });
        this.app.get('/api/dashboards', (req, res) => {
            res.json(this.dashboards);
        });
        this.app.get('/api/dashboard/:type/data', async (req, res) => {
            const dashboardType = req.params.type;
            const data = await this.getDashboardData(dashboardType);
            res.json(data);
        });
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date() });
        });
    }
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const client = {
                id: clientId,
                ws,
                subscribedDashboards: [],
                lastActivity: new Date()
            };
            this.clients.set(clientId, client);
            logger_1.logger.info('Dashboard client connected', { clientId });
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId,
                availableDashboards: Object.keys(this.dashboards)
            }));
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(clientId, data);
                }
                catch (error) {
                    logger_1.logger.error('Error parsing client message', error);
                }
            });
            ws.on('close', () => {
                this.clients.delete(clientId);
                logger_1.logger.info('Dashboard client disconnected', { clientId });
            });
            ws.on('error', (error) => {
                logger_1.logger.error('WebSocket error', { clientId, error });
            });
        });
    }
    handleClientMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        client.lastActivity = new Date();
        switch (data.type) {
            case 'subscribe':
                this.subscribeToDashboard(clientId, data.dashboard);
                break;
            case 'unsubscribe':
                this.unsubscribeFromDashboard(clientId, data.dashboard);
                break;
            case 'authenticate':
                client.userId = data.userId;
                break;
            case 'query':
                this.handleDashboardQuery(clientId, data.dashboard, data.query);
                break;
        }
    }
    subscribeToDashboard(clientId, dashboardType) {
        const client = this.clients.get(clientId);
        if (!client || !this.dashboards[dashboardType])
            return;
        if (!client.subscribedDashboards.includes(dashboardType)) {
            client.subscribedDashboards.push(dashboardType);
            this.getDashboardData(dashboardType).then(data => {
                client.ws.send(JSON.stringify({
                    type: 'dashboard-update',
                    dashboard: dashboardType,
                    data
                }));
            });
            logger_1.logger.info('Client subscribed to dashboard', { clientId, dashboardType });
        }
    }
    unsubscribeFromDashboard(clientId, dashboardType) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        const index = client.subscribedDashboards.indexOf(dashboardType);
        if (index > -1) {
            client.subscribedDashboards.splice(index, 1);
            logger_1.logger.info('Client unsubscribed from dashboard', { clientId, dashboardType });
        }
    }
    async handleDashboardQuery(clientId, dashboardType, query) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        try {
            let result;
            switch (dashboardType) {
                case 'consciousness':
                    result = await this.queryConsciousnessData(query);
                    break;
                case 'economy':
                    result = await this.queryEconomyData(query);
                    break;
                case 'analytics':
                    result = await this.queryAnalyticsData(query);
                    break;
                default:
                    result = { error: 'Query not supported for this dashboard' };
            }
            client.ws.send(JSON.stringify({
                type: 'query-response',
                dashboard: dashboardType,
                queryId: query.id,
                result
            }));
        }
        catch (error) {
            logger_1.logger.error('Error handling dashboard query', error);
        }
    }
    startUpdateCycles() {
        this.updateIntervals.set('consciousness', setInterval(() => {
            this.broadcastDashboardUpdate('consciousness');
        }, 2000));
        this.updateIntervals.set('system', setInterval(() => {
            this.broadcastDashboardUpdate('system');
        }, 5000));
        this.updateIntervals.set('economy', setInterval(() => {
            this.broadcastDashboardUpdate('economy');
        }, 3000));
        this.updateIntervals.set('executive', setInterval(() => {
            this.broadcastDashboardUpdate('executive');
        }, 30000));
        this.updateIntervals.set('arena', setInterval(() => {
            this.broadcastDashboardUpdate('arena');
        }, 1000));
        this.updateIntervals.set('analytics', setInterval(() => {
            this.broadcastDashboardUpdate('analytics');
        }, 60000));
        this.updateIntervals.set('gamification', setInterval(() => {
            this.broadcastDashboardUpdate('gamification');
        }, 10000));
    }
    async broadcastDashboardUpdate(dashboardType) {
        const data = await this.getDashboardData(dashboardType);
        const message = JSON.stringify({
            type: 'dashboard-update',
            dashboard: dashboardType,
            data
        });
        for (const [clientId, client] of this.clients) {
            if (client.subscribedDashboards.includes(dashboardType)) {
                try {
                    if (client.ws.readyState === ws_1.WebSocket.OPEN) {
                        client.ws.send(message);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Error sending update to client', { clientId, error });
                }
            }
        }
    }
    async getDashboardData(dashboardType) {
        switch (dashboardType) {
            case 'consciousness':
                return await this.getConsciousnessData();
            case 'executive':
                return await this.getExecutiveData();
            case 'system':
                return await this.getSystemHealthData();
            case 'economy':
                return await this.getEconomyData();
            case 'arena':
                return await this.getArenaData();
            case 'analytics':
                return await this.getAnalyticsData();
            case 'gamification':
                return await this.getGamificationData();
            default:
                return { error: 'Unknown dashboard type' };
        }
    }
    async getConsciousnessData() {
        const activeAgents = Math.floor(Math.random() * 50) + 20;
        const activityChart = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
        return {
            activeAgents,
            totalEntities: activeAgents * 3,
            evolutionEvents: Math.floor(Math.random() * 10),
            consciousnessLevel: 70 + Math.random() * 20,
            activityChart,
            entityBreakdown: {
                'neural': Math.floor(activeAgents * 0.4),
                'quantum': Math.floor(activeAgents * 0.3),
                'hybrid': Math.floor(activeAgents * 0.2),
                'emerging': Math.floor(activeAgents * 0.1)
            }
        };
    }
    async getExecutiveData() {
        const stats = await this.metricsService.getSystemMetrics();
        return {
            totalUsers: 15234,
            activeUsers: 3456,
            revenue: 125000,
            growthRate: 15.7,
            featureAdoption: {
                'AI Analysis': 89,
                'Code Cleanup': 76,
                'Collaboration': 64,
                'API Integration': 52
            },
            kpis: {
                'MRR': { value: 125000, trend: 'up' },
                'User Retention': { value: 87, trend: 'stable' },
                'NPS Score': { value: 72, trend: 'up' },
                'Conversion Rate': { value: 3.2, trend: 'up' }
            }
        };
    }
    async getSystemHealthData() {
        const metrics = await this.metricsService.getSystemMetrics();
        return {
            cpuUsage: metrics.cpu.usage,
            memoryUsage: metrics.memory.usedPercent,
            diskUsage: 45 + Math.random() * 20,
            activeProcesses: metrics.processCount,
            serviceHealth: {
                'API': 'healthy',
                'Database': 'healthy',
                'AI Service': Math.random() > 0.9 ? 'degraded' : 'healthy',
                'WebSocket': 'healthy',
                'Queue': 'healthy'
            },
            uptime: metrics.uptime
        };
    }
    async getEconomyData() {
        const now = Date.now();
        const priceHistory = Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(now - (24 - i) * 3600000),
            price: 100 + Math.random() * 20 - 10
        }));
        return {
            totalTransactions: 45678,
            marketplaceVolume: 2345678,
            activeListings: 234,
            topTraders: [
                { userId: 'trader1', volume: 234567 },
                { userId: 'trader2', volume: 198765 },
                { userId: 'trader3', volume: 156789 }
            ],
            priceHistory,
            liquidityPools: {
                'TOKEN-USD': 1234567,
                'TOKEN-ETH': 345678,
                'TOKEN-BTC': 234567
            }
        };
    }
    async getArenaData() {
        const arenaStats = this.arenaService.getArenaStats();
        const activeBattles = this.arenaService.getActiveBattles();
        const rankings = await this.arenaService.getFighterRankings(5);
        return {
            totalFighters: arenaStats.totalFighters,
            activeBattles: activeBattles.length,
            totalBattles: arenaStats.totalBattles,
            totalPrizePool: arenaStats.totalPrizePool,
            houseProfits: arenaStats.houseProfits,
            topFighters: rankings.map(f => ({
                name: f.name,
                wins: f.wins,
                losses: f.losses,
                powerLevel: f.powerLevel
            })),
            currentBattles: activeBattles.slice(0, 3).map(b => ({
                id: b.id,
                fighter1: b.fighter1Id,
                fighter2: b.fighter2Id,
                stakes: b.stakes,
                status: b.status
            }))
        };
    }
    async getAnalyticsData() {
        return {
            pageViews: {
                today: 12345,
                yesterday: 11234,
                lastWeek: 78901,
                lastMonth: 345678
            },
            userEngagement: {
                avgSessionDuration: 324,
                bounceRate: 35.6,
                pagesPerSession: 4.2
            },
            topPages: [
                { path: '/dashboard', views: 3456 },
                { path: '/analyze', views: 2345 },
                { path: '/projects', views: 1987 }
            ],
            userFlow: {
                landing: { '/': 45, '/features': 25, '/pricing': 30 },
                conversion: { signup: 3.2, upgrade: 1.8 }
            },
            realTimeUsers: 234
        };
    }
    async getGamificationData() {
        const leaderboard = await this.gamificationService.getLeaderboard('xp', 10);
        return {
            totalPlayers: 12345,
            activeToday: 2345,
            totalXPAwarded: 9876543,
            totalTokensCirculation: 1234567,
            leaderboard: leaderboard.map(entry => ({
                username: entry.username,
                level: entry.level,
                xp: entry.score,
                achievements: entry.achievementCount
            })),
            achievementStats: {
                'First Code': 8901,
                'Clean Coder': 4567,
                'Collaborator': 3456,
                'API Master': 1234
            },
            levelDistribution: {
                '1-10': 5678,
                '11-20': 3456,
                '21-30': 2345,
                '31-40': 1234,
                '41+': 567
            }
        };
    }
    async queryConsciousnessData(query) {
        switch (query.type) {
            case 'entity-details':
                return {
                    entityId: query.entityId,
                    type: 'neural',
                    age: Math.floor(Math.random() * 1000),
                    evolutionStage: 3,
                    connections: 42,
                    activity: Array.from({ length: 10 }, () => Math.random())
                };
            case 'evolution-history':
                return {
                    events: Array.from({ length: 5 }, (_, i) => ({
                        timestamp: new Date(Date.now() - i * 3600000),
                        type: 'evolution',
                        from: `stage-${i}`,
                        to: `stage-${i + 1}`,
                        trigger: 'threshold'
                    }))
                };
            default:
                return { error: 'Unknown query type' };
        }
    }
    async queryEconomyData(query) {
        switch (query.type) {
            case 'transaction-details':
                return {
                    transactionId: query.transactionId,
                    from: 'user123',
                    to: 'user456',
                    amount: 1000,
                    timestamp: new Date(),
                    status: 'completed'
                };
            case 'market-depth':
                return {
                    bids: Array.from({ length: 10 }, (_, i) => ({
                        price: 100 - i,
                        volume: Math.floor(Math.random() * 1000)
                    })),
                    asks: Array.from({ length: 10 }, (_, i) => ({
                        price: 101 + i,
                        volume: Math.floor(Math.random() * 1000)
                    }))
                };
            default:
                return { error: 'Unknown query type' };
        }
    }
    async queryAnalyticsData(query) {
        switch (query.type) {
            case 'user-journey':
                return {
                    userId: query.userId,
                    sessions: Array.from({ length: 5 }, (_, i) => ({
                        timestamp: new Date(Date.now() - i * 86400000),
                        duration: Math.floor(Math.random() * 600) + 60,
                        pages: Math.floor(Math.random() * 10) + 1,
                        actions: ['view', 'click', 'analyze', 'export']
                    }))
                };
            case 'funnel-analysis':
                return {
                    funnel: query.funnel,
                    steps: [
                        { name: 'Landing', users: 10000 },
                        { name: 'Signup', users: 3200 },
                        { name: 'First Action', users: 2100 },
                        { name: 'Conversion', users: 320 }
                    ]
                };
            default:
                return { error: 'Unknown query type' };
        }
    }
    async start() {
        this.server.listen(this.config.port, () => {
            logger_1.logger.info('Dashboard service started', {
                port: this.config.port,
                wsPort: this.config.wsPort
            });
        });
    }
    async stop() {
        for (const interval of this.updateIntervals.values()) {
            clearInterval(interval);
        }
        for (const client of this.clients.values()) {
            client.ws.close();
        }
        this.wss.close();
        this.server.close();
        logger_1.logger.info('Dashboard service stopped');
    }
    getStats() {
        let totalSubscriptions = 0;
        const activeDashboards = new Set();
        for (const client of this.clients.values()) {
            totalSubscriptions += client.subscribedDashboards.length;
            client.subscribedDashboards.forEach(d => activeDashboards.add(d));
        }
        return {
            connectedClients: this.clients.size,
            activeDashboards: Array.from(activeDashboards),
            totalSubscriptions
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map