import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import TypeScript backend routes
import { healthRouter } from './api/routes/health.route';
import { uploadRouter } from './api/routes/upload.route.simple';
import { jobRouter } from './api/routes/job.route.simple';
import { paymentRouter } from './api/routes/payment.route.simple';
import { webhookRouter } from './api/routes/webhook.route.simple';
import { profileRouter } from './api/routes/profile.route';
import { apiKeysRouter } from './api/routes/api-keys.route';
import { byokRouter } from './api/routes/byok.route';
import { orchestrationRouter } from './api/routes/orchestration.route';
import { qrRouter } from './api/routes/qr.route';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { authentication } from './middleware/auth.middleware';
import { requestLogger } from './middleware/logging.middleware';

// Import queue
import { cleanupQueue } from './jobs/cleanup.queue';

// Import utils
import { logger } from './utils/logger';
import { prisma, disconnectDatabase } from './utils/database';
import { llmRouter } from './llm/router';
import { profileService } from './services/profile.service';

// Import orchestration
import { serviceRegistry } from './services/orchestration/service-registry';

// Import all D1-D10 integration services (lazy loaded)
// We'll import these dynamically to avoid initialization issues

class UnifiedPlatformServer {
    private app: express.Application;
    private httpServer: any;
    private io: Server;
    private wss: WebSocket.Server;
    private port: number;
    private wsPort: number;
    private clients: Set<WebSocket>;
    private cache: Map<string, any>;
    
    // Integration services
    private integrationServices: Map<string, any>;

    constructor() {
        this.app = express();
        this.port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
        this.wsPort = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8081;
        this.clients = new Set();
        this.cache = new Map();
        this.integrationServices = new Map();
    }

    async startServer() {
        try {
            // Initialize database
            await prisma.$connect();
            logger.info('✅ Database connected');

            // Initialize LLM router
            await llmRouter.initialize();
            logger.info('✅ LLM router initialized');

            // Initialize profile service
            await profileService.initialize();
            logger.info('✅ Profile service initialized');

            // Initialize service registry
            logger.info('✅ Service registry initialized');

            // Initialize all D1-D10 integration services
            await this.initializeIntegrationServices();

            // Setup Express middleware
            this.setupMiddleware();

            // Setup WebSocket
            this.setupWebSocket();

            // Setup all routes (MVP + D1-D10)
            this.setupRoutes();

            // Setup Bull Dashboard
            this.setupBullDashboard();

            // Start server
            this.httpServer.listen(this.port, () => {
                this.logStartupMessage();
            });

            // Setup graceful shutdown
            this.setupGracefulShutdown();

        } catch (error) {
            logger.error('Failed to start unified server:', error);
            process.exit(1);
        }
    }

    private async initializeIntegrationServices() {
        logger.info('🔄 Initializing D1-D10 integration services...');

        try {
            // D1: SOULFRA-MEMORY
            const { SoulframemoryIntegration } = await import('./services/memory/soulfra-memory.integration');
            const memoryIntegration = new SoulframemoryIntegration();
            await memoryIntegration.initialize();
            this.integrationServices.set('memory', memoryIntegration);

            // D2: Cal-Kubernetes Orchestrator
            const { CalKubernetesIntegration } = await import('./services/orchestrator/cal-kubernetes.integration');
            const orchestrationIntegration = new CalKubernetesIntegration();
            await orchestrationIntegration.initialize();
            this.integrationServices.set('orchestration', orchestrationIntegration);

            // D3: Enterprise Auth
            const { EnterpriseAuthIntegration } = await import('./services/auth/enterprise-auth.integration');
            const authIntegration = new EnterpriseAuthIntegration();
            await authIntegration.initialize();
            this.integrationServices.set('auth', authIntegration);

            // D4: Enterprise Console
            const { EnterpriseConsoleIntegration } = await import('./services/console/enterprise-console.integration');
            const consoleIntegration = new EnterpriseConsoleIntegration();
            await consoleIntegration.initialize();
            this.integrationServices.set('console', consoleIntegration);

            // D5: Licensing & Payout
            const { LicensingPayoutIntegration } = await import('./services/licensing/licensing-payout.integration');
            const licensingIntegration = new LicensingPayoutIntegration();
            await licensingIntegration.initialize();
            this.integrationServices.set('licensing', licensingIntegration);

            // D6: Enterprise Dashboard
            const { EnterpriseDashboardIntegration } = await import('./services/dashboard/enterprise-dashboard.integration');
            const dashboardIntegration = new EnterpriseDashboardIntegration();
            await dashboardIntegration.initialize();
            this.integrationServices.set('dashboard', dashboardIntegration);

            // D7: AI Conductor
            const { AIConductorIntegration } = await import('./services/conductor/ai-conductor.integration');
            const conductorIntegration = new AIConductorIntegration();
            await conductorIntegration.initialize();
            this.integrationServices.set('conductor', conductorIntegration);

            // D8: Production K8s
            const { ProductionK8sIntegration } = await import('./services/kubernetes/production-k8s.integration');
            const k8sIntegration = new ProductionK8sIntegration();
            await k8sIntegration.initialize();
            this.integrationServices.set('k8s', k8sIntegration);

            // D9: Agent Marketplace
            const { AgentMarketplaceIntegration } = await import('./services/marketplace/agent-marketplace.integration');
            const marketplaceIntegration = new AgentMarketplaceIntegration();
            await marketplaceIntegration.initialize();
            this.integrationServices.set('marketplace', marketplaceIntegration);

            // D10: Enterprise Vault Sovereignty
            const { EnterpriseVaultSovereigntyIntegration } = await import('./services/vault/enterprise-vault-sovereignty.integration');
            const vaultIntegration = new EnterpriseVaultSovereigntyIntegration();
            await vaultIntegration.initialize();
            this.integrationServices.set('vault', vaultIntegration);

            logger.info('✅ All D1-D10 integration services initialized');
        } catch (error) {
            logger.error('❌ Error initializing integration services:', error);
            // Continue without integration services for now
            logger.warn('⚠️ Running without some integration services');
        }
    }

    private setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        }));

        // Compression
        this.app.use(compression());

        // Body parsing - Stripe webhook needs raw body
        this.app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
        
        // Regular body parsing for other routes
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use(requestLogger);

        // Rate limiting
        this.app.use('/api', rateLimiter);

        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    private setupWebSocket() {
        this.httpServer = createServer(this.app);
        
        // Socket.io for real-time updates
        this.io = new Server(this.httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                credentials: true,
            },
        });

        // Raw WebSocket server for legacy support
        this.wss = new WebSocket.Server({ port: this.wsPort });

        // Socket.io connections
        this.io.on('connection', (socket) => {
            logger.info('Client connected via Socket.io', { socketId: socket.id });

            socket.on('subscribe:job', (jobId: string) => {
                socket.join(`job:${jobId}`);
                logger.info('Client subscribed to job', { socketId: socket.id, jobId });
            });

            socket.on('disconnect', () => {
                logger.info('Client disconnected from Socket.io', { socketId: socket.id });
            });
        });

        // Raw WebSocket connections
        this.wss.on('connection', (ws, req) => {
            logger.info('🔌 WebSocket client connected');
            this.clients.add(ws);
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to FinishThisIdea Platform',
                timestamp: Date.now()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    logger.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                logger.info('🔌 WebSocket client disconnected');
                this.clients.delete(ws);
            });
        });

        // Make io accessible to other parts of the app
        this.app.set('io', this.io);
    }

    private setupRoutes() {
        // Health check (no auth)
        this.app.use('/health', healthRouter);
        this.app.use('/api/health', healthRouter);

        // MVP routes
        this.app.use('/api/webhook', webhookRouter);
        this.app.use('/api/upload', uploadRouter);
        this.app.use('/api/jobs', jobRouter);
        this.app.use('/api/payment', paymentRouter);
        this.app.use('/api/profiles', profileRouter);
        
        // API Key Management routes (require authentication)
        this.app.use('/api/api-keys', authentication(), apiKeysRouter);
        this.app.use('/api/byok', authentication(), byokRouter);
        
        // QR Code routes
        this.app.use('/api/qr', qrRouter);
        
        // Service Orchestration routes (admin only)
        this.app.use('/api/orchestration', authentication({ role: 'admin' }), orchestrationRouter);

        // D1-D10 Integration Routes
        this.setupIntegrationRoutes();

        // Platform routes (from API Gateway)
        this.setupPlatformRoutes();

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'The requested resource was not found',
                },
            });
        });

        // Error handling (must be last)
        this.app.use(errorHandler);
    }

    private setupIntegrationRoutes() {
        // D1: Memory routes
        this.app.get('/api/memory/status', async (req, res) => {
            try {
                const memoryService = this.integrationServices.get('memory');
                const status = await memoryService.getMemoryStatus();
                res.json({ success: true, data: status });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // D2: Orchestration routes
        this.app.get('/api/orchestration/agents', async (req, res) => {
            try {
                const orchestrationService = this.integrationServices.get('orchestration');
                const agents = await orchestrationService.getRegisteredAgents();
                res.json({ success: true, data: agents });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // D8: Kubernetes routes
        this.app.get('/api/k8s/cluster/status', async (req, res) => {
            try {
                const k8sService = this.integrationServices.get('k8s');
                const status = await k8sService.getServiceMeshStatus();
                res.json({ success: true, data: status });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // D9: Marketplace routes
        this.app.get('/api/marketplace/personalities', async (req, res) => {
            try {
                const marketplaceService = this.integrationServices.get('marketplace');
                const personalities = await marketplaceService.getPersonalityStore();
                res.json({ success: true, data: personalities });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // D10: Vault routes
        this.app.get('/api/vault/sovereignty/status', async (req, res) => {
            try {
                const vaultService = this.integrationServices.get('vault');
                const status = await vaultService.getSovereigntyStatus();
                res.json({ success: true, data: status });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    private setupPlatformRoutes() {
        // Platform-specific routes (from original API Gateway)
        this.app.get('/api/metrics', (req, res) => {
            res.json({
                success: true,
                data: {
                    timestamp: Date.now(),
                    connectedClients: this.clients.size,
                    cacheSize: this.cache.size,
                    integrationServices: Array.from(this.integrationServices.keys()),
                    uptime: process.uptime()
                }
            });
        });

        this.app.post('/api/ws/broadcast', (req, res) => {
            const { message, type = 'broadcast' } = req.body;
            
            this.broadcastMessage({
                type,
                message,
                timestamp: Date.now()
            });

            res.json({ success: true, message: 'Message broadcasted' });
        });
    }

    private setupBullDashboard() {
        const serverAdapter = new ExpressAdapter();
        serverAdapter.setBasePath('/admin/queues');
        
        createBullBoard({
            queues: [new BullAdapter(cleanupQueue)],
            serverAdapter,
        });
        
        this.app.use('/admin/queues', authentication({ role: 'admin' }), serverAdapter.getRouter());
    }

    private handleWebSocketMessage(ws: WebSocket, data: any) {
        // Handle WebSocket messages
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'subscribe':
                // Handle subscription requests
                break;
            default:
                logger.info('Unknown WebSocket message type:', data.type);
        }
    }

    private broadcastMessage(message: any) {
        // Broadcast to raw WebSocket clients
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });

        // Broadcast to Socket.io clients
        this.io.emit('platform_message', message);
    }

    private setupGracefulShutdown() {
        const gracefulShutdown = async (signal: string) => {
            logger.info(`${signal} received, starting graceful shutdown...`);
            
            // Stop accepting new connections
            this.httpServer.close(() => {
                logger.info('HTTP server closed');
            });

            // Close Socket.io
            this.io.close(() => {
                logger.info('Socket.io server closed');
            });

            // Close WebSocket server
            this.wss.close(() => {
                logger.info('WebSocket server closed');
            });

            // Close queue connections
            await cleanupQueue.close();
            logger.info('Queue connections closed');

            // Shutdown service registry
            await serviceRegistry.shutdown();
            logger.info('Service registry shut down');

            // Shutdown integration services
            for (const [name, service] of this.integrationServices.entries()) {
                if (service.shutdown) {
                    await service.shutdown();
                    logger.info(`${name} integration service shut down`);
                }
            }

            // Close database
            await disconnectDatabase();

            process.exit(0);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }

    private logStartupMessage() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                🚀 FinishThisIdea Platform UNIFIED            ║
║                                                              ║
║  Complete Integration Platform                               ║
║                                                              ║
║  • REST API: http://localhost:${this.port}                           ║
║  • WebSocket: ws://localhost:${this.wsPort}                          ║
║  • Socket.io: http://localhost:${this.port}/socket.io/             ║
║  • Static Files: All frontend interfaces                    ║
║  • D1-D10 Services: All integrated                          ║
║                                                              ║
║  Available Interfaces:                                      ║
║  • 🏠 Platform Hub: http://localhost:${this.port}                   ║
║  • 🖥️ System Monitor: http://localhost:${this.port}/dashboard       ║
║  • ⚔️ AI Arena: http://localhost:${this.port}/games/ai-arena        ║
║  • 💰 Billion $ Game: http://localhost:${this.port}/games/billion-  ║
║  • 🤖 AI Chat: http://localhost:${this.port}/chat/ai-chat           ║
║  • 🏪 Marketplace: http://localhost:${this.port}/marketplace        ║
║  • 👥 User Management: http://localhost:${this.port}/admin          ║
║  • 📊 Queue Dashboard: http://localhost:${this.port}/admin/queues   ║
║                                                              ║
║  🔌 Integration Services Active: ${this.integrationServices.size}                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `);

        logger.info(`🚀 Unified platform running on port ${this.port}`);
        logger.info(`📊 Queue dashboard: http://localhost:${this.port}/admin/queues`);
        logger.info(`🏥 Health check: http://localhost:${this.port}/health`);
        logger.info(`🔌 WebSocket ready on port ${this.wsPort}`);
        logger.info(`🔌 Socket.io ready on port ${this.port}`);
        
        if (process.env.NODE_ENV === 'production') {
            logger.info('🏭 Running in PRODUCTION mode');
        } else {
            logger.info('🚧 Running in DEVELOPMENT mode');
        }
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the unified server
const server = new UnifiedPlatformServer();
server.startServer();

// Export for testing
export { UnifiedPlatformServer };