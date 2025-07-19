/**
 * Dashboard Service
 * Adapted from Soulfra-AgentZero's various dashboard implementations
 * Provides specialized dashboards for different use cases
 */

import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { MetricsService } from '../monitoring/metrics.service';
import { AIService } from '../ai/ai.service';
import { GamificationService } from '../gamification/gamification.service';
import { AIArenaService } from '../ai-arena/ai-arena.service';
import { SmartRoutingDaemon } from '../routing/smart-routing-daemon';

interface DashboardConfig {
  port: number;
  wsPort: number;
  updateInterval: number;
  enabledDashboards: string[];
}

interface DashboardClient {
  id: string;
  ws: WebSocket;
  subscribedDashboards: string[];
  userId?: string;
  lastActivity: Date;
}

interface DashboardData {
  type: string;
  timestamp: Date;
  data: any;
}

interface ConsciousnessMetrics {
  activeAgents: number;
  totalEntities: number;
  evolutionEvents: number;
  consciousnessLevel: number;
  activityChart: number[];
  entityBreakdown: Record<string, number>;
}

interface SystemHealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeProcesses: number;
  serviceHealth: Record<string, 'healthy' | 'degraded' | 'down'>;
  uptime: number;
}

interface EconomyMetrics {
  totalTransactions: number;
  marketplaceVolume: number;
  activeListings: number;
  topTraders: Array<{ userId: string; volume: number }>;
  priceHistory: Array<{ timestamp: Date; price: number }>;
  liquidityPools: Record<string, number>;
}

interface ExecutiveMetrics {
  totalUsers: number;
  activeUsers: number;
  revenue: number;
  growthRate: number;
  featureAdoption: Record<string, number>;
  kpis: Record<string, { value: number; trend: 'up' | 'down' | 'stable' }>;
}

export class DashboardService extends EventEmitter {
  private config: DashboardConfig;
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private prisma: PrismaClient;
  private metricsService: MetricsService;
  private aiService: AIService;
  private gamificationService: GamificationService;
  private arenaService: AIArenaService;
  private routingDaemon: SmartRoutingDaemon;
  
  private clients: Map<string, DashboardClient> = new Map();
  private updateIntervals: Map<string, NodeJS.Timer> = new Map();
  
  // Dashboard types
  private dashboards = {
    consciousness: 'AI Consciousness Dashboard',
    executive: 'Executive Dashboard',
    system: 'System Health Dashboard',
    economy: 'AI Economy Dashboard',
    arena: 'AI Arena Dashboard',
    analytics: 'Analytics Dashboard',
    gamification: 'Gamification Dashboard'
  };

  constructor(config: DashboardConfig) {
    super();
    this.config = config;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ port: config.wsPort });
    
    this.prisma = new PrismaClient();
    this.metricsService = new MetricsService();
    this.aiService = new AIService();
    this.gamificationService = new GamificationService();
    this.arenaService = new AIArenaService();
    this.routingDaemon = new SmartRoutingDaemon();
    
    this.setupExpress();
    this.setupWebSocket();
    this.startUpdateCycles();
  }

  /**
   * Setup Express routes
   */
  private setupExpress(): void {
    this.app.use(express.static('public'));
    this.app.use(express.json());
    
    // Dashboard routes
    this.app.get('/dashboard/:type', (req, res) => {
      const dashboardType = req.params.type;
      if (!this.dashboards[dashboardType]) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      
      // Serve dashboard HTML
      res.sendFile(`dashboards/${dashboardType}.html`);
    });
    
    // API routes
    this.app.get('/api/dashboards', (req, res) => {
      res.json(this.dashboards);
    });
    
    this.app.get('/api/dashboard/:type/data', async (req, res) => {
      const dashboardType = req.params.type;
      const data = await this.getDashboardData(dashboardType);
      res.json(data);
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date() });
    });
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const client: DashboardClient = {
        id: clientId,
        ws,
        subscribedDashboards: [],
        lastActivity: new Date()
      };
      
      this.clients.set(clientId, client);
      logger.info('Dashboard client connected', { clientId });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        availableDashboards: Object.keys(this.dashboards)
      }));
      
      // Handle messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(clientId, data);
        } catch (error) {
          logger.error('Error parsing client message', error);
        }
      });
      
      // Handle disconnect
      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info('Dashboard client disconnected', { clientId });
      });
      
      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', { clientId, error });
      });
    });
  }

  /**
   * Handle client messages
   */
  private handleClientMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
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

  /**
   * Subscribe client to dashboard updates
   */
  private subscribeToDashboard(clientId: string, dashboardType: string): void {
    const client = this.clients.get(clientId);
    if (!client || !this.dashboards[dashboardType]) return;
    
    if (!client.subscribedDashboards.includes(dashboardType)) {
      client.subscribedDashboards.push(dashboardType);
      
      // Send initial data
      this.getDashboardData(dashboardType).then(data => {
        client.ws.send(JSON.stringify({
          type: 'dashboard-update',
          dashboard: dashboardType,
          data
        }));
      });
      
      logger.info('Client subscribed to dashboard', { clientId, dashboardType });
    }
  }

  /**
   * Unsubscribe client from dashboard
   */
  private unsubscribeFromDashboard(clientId: string, dashboardType: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const index = client.subscribedDashboards.indexOf(dashboardType);
    if (index > -1) {
      client.subscribedDashboards.splice(index, 1);
      logger.info('Client unsubscribed from dashboard', { clientId, dashboardType });
    }
  }

  /**
   * Handle dashboard-specific queries
   */
  private async handleDashboardQuery(clientId: string, dashboardType: string, query: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      let result: any;
      
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
    } catch (error) {
      logger.error('Error handling dashboard query', error);
    }
  }

  /**
   * Start update cycles for all dashboards
   */
  private startUpdateCycles(): void {
    // Consciousness dashboard - high frequency
    this.updateIntervals.set('consciousness', setInterval(() => {
      this.broadcastDashboardUpdate('consciousness');
    }, 2000));
    
    // System health - medium frequency
    this.updateIntervals.set('system', setInterval(() => {
      this.broadcastDashboardUpdate('system');
    }, 5000));
    
    // Economy dashboard - medium frequency
    this.updateIntervals.set('economy', setInterval(() => {
      this.broadcastDashboardUpdate('economy');
    }, 3000));
    
    // Executive dashboard - low frequency
    this.updateIntervals.set('executive', setInterval(() => {
      this.broadcastDashboardUpdate('executive');
    }, 30000));
    
    // Arena dashboard - high frequency during battles
    this.updateIntervals.set('arena', setInterval(() => {
      this.broadcastDashboardUpdate('arena');
    }, 1000));
    
    // Analytics dashboard - low frequency
    this.updateIntervals.set('analytics', setInterval(() => {
      this.broadcastDashboardUpdate('analytics');
    }, 60000));
    
    // Gamification dashboard - medium frequency
    this.updateIntervals.set('gamification', setInterval(() => {
      this.broadcastDashboardUpdate('gamification');
    }, 10000));
  }

  /**
   * Broadcast dashboard update to subscribed clients
   */
  private async broadcastDashboardUpdate(dashboardType: string): Promise<void> {
    const data = await this.getDashboardData(dashboardType);
    const message = JSON.stringify({
      type: 'dashboard-update',
      dashboard: dashboardType,
      data
    });
    
    // Send to all subscribed clients
    for (const [clientId, client] of this.clients) {
      if (client.subscribedDashboards.includes(dashboardType)) {
        try {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
          }
        } catch (error) {
          logger.error('Error sending update to client', { clientId, error });
        }
      }
    }
  }

  /**
   * Get dashboard data
   */
  private async getDashboardData(dashboardType: string): Promise<any> {
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

  /**
   * Get consciousness dashboard data
   */
  private async getConsciousnessData(): Promise<ConsciousnessMetrics> {
    // Simulate consciousness metrics
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

  /**
   * Get executive dashboard data
   */
  private async getExecutiveData(): Promise<ExecutiveMetrics> {
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

  /**
   * Get system health data
   */
  private async getSystemHealthData(): Promise<SystemHealthMetrics> {
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

  /**
   * Get economy dashboard data
   */
  private async getEconomyData(): Promise<EconomyMetrics> {
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

  /**
   * Get arena dashboard data
   */
  private async getArenaData(): Promise<any> {
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

  /**
   * Get analytics dashboard data
   */
  private async getAnalyticsData(): Promise<any> {
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

  /**
   * Get gamification dashboard data
   */
  private async getGamificationData(): Promise<any> {
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

  /**
   * Query handlers for specific dashboards
   */
  private async queryConsciousnessData(query: any): Promise<any> {
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

  private async queryEconomyData(query: any): Promise<any> {
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

  private async queryAnalyticsData(query: any): Promise<any> {
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

  /**
   * Start the dashboard service
   */
  async start(): Promise<void> {
    this.server.listen(this.config.port, () => {
      logger.info('Dashboard service started', { 
        port: this.config.port, 
        wsPort: this.config.wsPort 
      });
    });
  }

  /**
   * Stop the dashboard service
   */
  async stop(): Promise<void> {
    // Clear update intervals
    for (const interval of this.updateIntervals.values()) {
      clearInterval(interval);
    }
    
    // Close WebSocket connections
    for (const client of this.clients.values()) {
      client.ws.close();
    }
    
    // Close servers
    this.wss.close();
    this.server.close();
    
    logger.info('Dashboard service stopped');
  }

  /**
   * Get service statistics
   */
  getStats(): {
    connectedClients: number;
    activeDashboards: string[];
    totalSubscriptions: number;
  } {
    let totalSubscriptions = 0;
    const activeDashboards = new Set<string>();
    
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