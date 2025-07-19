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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedPlatformServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const path_1 = __importDefault(require("path"));
const api_1 = require("@bull-board/api");
const bullAdapter_1 = require("@bull-board/api/bullAdapter");
const express_2 = require("@bull-board/express");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const ws_1 = __importDefault(require("ws"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const health_route_1 = require("./api/routes/health.route");
const upload_route_simple_1 = require("./api/routes/upload.route.simple");
const job_route_simple_1 = require("./api/routes/job.route.simple");
const payment_route_simple_1 = require("./api/routes/payment.route.simple");
const webhook_route_simple_1 = require("./api/routes/webhook.route.simple");
const profile_route_1 = require("./api/routes/profile.route");
const api_keys_route_1 = require("./api/routes/api-keys.route");
const byok_route_1 = require("./api/routes/byok.route");
const orchestration_route_1 = require("./api/routes/orchestration.route");
const qr_route_1 = require("./api/routes/qr.route");
const error_middleware_1 = require("./middleware/error.middleware");
const rate_limit_middleware_1 = require("./middleware/rate-limit.middleware");
const auth_middleware_1 = require("./middleware/auth.middleware");
const logging_middleware_1 = require("./middleware/logging.middleware");
const cleanup_queue_1 = require("./jobs/cleanup.queue");
const logger_1 = require("./utils/logger");
const database_1 = require("./utils/database");
const router_1 = require("./llm/router");
const profile_service_1 = require("./services/profile.service");
const service_registry_1 = require("./services/orchestration/service-registry");
class UnifiedPlatformServer {
    app;
    httpServer;
    io;
    wss;
    port;
    wsPort;
    clients;
    cache;
    integrationServices;
    constructor() {
        this.app = (0, express_1.default)();
        this.port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
        this.wsPort = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8081;
        this.clients = new Set();
        this.cache = new Map();
        this.integrationServices = new Map();
    }
    async startServer() {
        try {
            await database_1.prisma.$connect();
            logger_1.logger.info('✅ Database connected');
            await router_1.llmRouter.initialize();
            logger_1.logger.info('✅ LLM router initialized');
            await profile_service_1.profileService.initialize();
            logger_1.logger.info('✅ Profile service initialized');
            logger_1.logger.info('✅ Service registry initialized');
            await this.initializeIntegrationServices();
            this.setupMiddleware();
            this.setupWebSocket();
            this.setupRoutes();
            this.setupBullDashboard();
            this.httpServer.listen(this.port, () => {
                this.logStartupMessage();
            });
            this.setupGracefulShutdown();
        }
        catch (error) {
            logger_1.logger.error('Failed to start unified server:', error);
            process.exit(1);
        }
    }
    async initializeIntegrationServices() {
        logger_1.logger.info('🔄 Initializing D1-D10 integration services...');
        try {
            const { SoulframemoryIntegration } = await Promise.resolve().then(() => __importStar(require('./services/memory/soulfra-memory.integration')));
            const memoryIntegration = new SoulframemoryIntegration();
            await memoryIntegration.initialize();
            this.integrationServices.set('memory', memoryIntegration);
            const { CalKubernetesIntegration } = await Promise.resolve().then(() => __importStar(require('./services/orchestrator/cal-kubernetes.integration')));
            const orchestrationIntegration = new CalKubernetesIntegration();
            await orchestrationIntegration.initialize();
            this.integrationServices.set('orchestration', orchestrationIntegration);
            const { EnterpriseAuthIntegration } = await Promise.resolve().then(() => __importStar(require('./services/auth/enterprise-auth.integration')));
            const authIntegration = new EnterpriseAuthIntegration();
            await authIntegration.initialize();
            this.integrationServices.set('auth', authIntegration);
            const { EnterpriseConsoleIntegration } = await Promise.resolve().then(() => __importStar(require('./services/console/enterprise-console.integration')));
            const consoleIntegration = new EnterpriseConsoleIntegration();
            await consoleIntegration.initialize();
            this.integrationServices.set('console', consoleIntegration);
            const { LicensingPayoutIntegration } = await Promise.resolve().then(() => __importStar(require('./services/licensing/licensing-payout.integration')));
            const licensingIntegration = new LicensingPayoutIntegration();
            await licensingIntegration.initialize();
            this.integrationServices.set('licensing', licensingIntegration);
            const { EnterpriseDashboardIntegration } = await Promise.resolve().then(() => __importStar(require('./services/dashboard/enterprise-dashboard.integration')));
            const dashboardIntegration = new EnterpriseDashboardIntegration();
            await dashboardIntegration.initialize();
            this.integrationServices.set('dashboard', dashboardIntegration);
            const { AIConductorIntegration } = await Promise.resolve().then(() => __importStar(require('./services/conductor/ai-conductor.integration')));
            const conductorIntegration = new AIConductorIntegration();
            await conductorIntegration.initialize();
            this.integrationServices.set('conductor', conductorIntegration);
            const { ProductionK8sIntegration } = await Promise.resolve().then(() => __importStar(require('./services/kubernetes/production-k8s.integration')));
            const k8sIntegration = new ProductionK8sIntegration();
            await k8sIntegration.initialize();
            this.integrationServices.set('k8s', k8sIntegration);
            const { AgentMarketplaceIntegration } = await Promise.resolve().then(() => __importStar(require('./services/marketplace/agent-marketplace.integration')));
            const marketplaceIntegration = new AgentMarketplaceIntegration();
            await marketplaceIntegration.initialize();
            this.integrationServices.set('marketplace', marketplaceIntegration);
            const { EnterpriseVaultSovereigntyIntegration } = await Promise.resolve().then(() => __importStar(require('./services/vault/enterprise-vault-sovereignty.integration')));
            const vaultIntegration = new EnterpriseVaultSovereigntyIntegration();
            await vaultIntegration.initialize();
            this.integrationServices.set('vault', vaultIntegration);
            logger_1.logger.info('✅ All D1-D10 integration services initialized');
        }
        catch (error) {
            logger_1.logger.error('❌ Error initializing integration services:', error);
            logger_1.logger.warn('⚠️ Running without some integration services');
        }
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        this.app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        }));
        this.app.use((0, compression_1.default)());
        this.app.use('/api/stripe/webhook', express_1.default.raw({ type: 'application/json' }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(logging_middleware_1.requestLogger);
        this.app.use('/api', rate_limit_middleware_1.rateLimiter);
        this.app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    }
    setupWebSocket() {
        this.httpServer = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                credentials: true,
            },
        });
        this.wss = new ws_1.default.Server({ port: this.wsPort });
        this.io.on('connection', (socket) => {
            logger_1.logger.info('Client connected via Socket.io', { socketId: socket.id });
            socket.on('subscribe:job', (jobId) => {
                socket.join(`job:${jobId}`);
                logger_1.logger.info('Client subscribed to job', { socketId: socket.id, jobId });
            });
            socket.on('disconnect', () => {
                logger_1.logger.info('Client disconnected from Socket.io', { socketId: socket.id });
            });
        });
        this.wss.on('connection', (ws, req) => {
            logger_1.logger.info('🔌 WebSocket client connected');
            this.clients.add(ws);
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to FinishThisIdea Platform',
                timestamp: Date.now()
            }));
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleWebSocketMessage(ws, data);
                }
                catch (error) {
                    logger_1.logger.error('WebSocket message error:', error);
                }
            });
            ws.on('close', () => {
                logger_1.logger.info('🔌 WebSocket client disconnected');
                this.clients.delete(ws);
            });
        });
        this.app.set('io', this.io);
    }
    setupRoutes() {
        this.app.use('/health', health_route_1.healthRouter);
        this.app.use('/api/health', health_route_1.healthRouter);
        this.app.use('/api/webhook', webhook_route_simple_1.webhookRouter);
        this.app.use('/api/upload', upload_route_simple_1.uploadRouter);
        this.app.use('/api/jobs', job_route_simple_1.jobRouter);
        this.app.use('/api/payment', payment_route_simple_1.paymentRouter);
        this.app.use('/api/profiles', profile_route_1.profileRouter);
        this.app.use('/api/api-keys', (0, auth_middleware_1.authentication)(), api_keys_route_1.apiKeysRouter);
        this.app.use('/api/byok', (0, auth_middleware_1.authentication)(), byok_route_1.byokRouter);
        this.app.use('/api/qr', qr_route_1.qrRouter);
        this.app.use('/api/orchestration', (0, auth_middleware_1.authentication)({ role: 'admin' }), orchestration_route_1.orchestrationRouter);
        this.setupIntegrationRoutes();
        this.setupPlatformRoutes();
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'The requested resource was not found',
                },
            });
        });
        this.app.use(error_middleware_1.errorHandler);
    }
    setupIntegrationRoutes() {
        this.app.get('/api/memory/status', async (req, res) => {
            try {
                const memoryService = this.integrationServices.get('memory');
                const status = await memoryService.getMemoryStatus();
                res.json({ success: true, data: status });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/orchestration/agents', async (req, res) => {
            try {
                const orchestrationService = this.integrationServices.get('orchestration');
                const agents = await orchestrationService.getRegisteredAgents();
                res.json({ success: true, data: agents });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/k8s/cluster/status', async (req, res) => {
            try {
                const k8sService = this.integrationServices.get('k8s');
                const status = await k8sService.getServiceMeshStatus();
                res.json({ success: true, data: status });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/marketplace/personalities', async (req, res) => {
            try {
                const marketplaceService = this.integrationServices.get('marketplace');
                const personalities = await marketplaceService.getPersonalityStore();
                res.json({ success: true, data: personalities });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/vault/sovereignty/status', async (req, res) => {
            try {
                const vaultService = this.integrationServices.get('vault');
                const status = await vaultService.getSovereigntyStatus();
                res.json({ success: true, data: status });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }
    setupPlatformRoutes() {
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
    setupBullDashboard() {
        const serverAdapter = new express_2.ExpressAdapter();
        serverAdapter.setBasePath('/admin/queues');
        (0, api_1.createBullBoard)({
            queues: [new bullAdapter_1.BullAdapter(cleanup_queue_1.cleanupQueue)],
            serverAdapter,
        });
        this.app.use('/admin/queues', (0, auth_middleware_1.authentication)({ role: 'admin' }), serverAdapter.getRouter());
    }
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'subscribe':
                break;
            default:
                logger_1.logger.info('Unknown WebSocket message type:', data.type);
        }
    }
    broadcastMessage(message) {
        this.clients.forEach(client => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
        this.io.emit('platform_message', message);
    }
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received, starting graceful shutdown...`);
            this.httpServer.close(() => {
                logger_1.logger.info('HTTP server closed');
            });
            this.io.close(() => {
                logger_1.logger.info('Socket.io server closed');
            });
            this.wss.close(() => {
                logger_1.logger.info('WebSocket server closed');
            });
            await cleanup_queue_1.cleanupQueue.close();
            logger_1.logger.info('Queue connections closed');
            await service_registry_1.serviceRegistry.shutdown();
            logger_1.logger.info('Service registry shut down');
            for (const [name, service] of this.integrationServices.entries()) {
                if (service.shutdown) {
                    await service.shutdown();
                    logger_1.logger.info(`${name} integration service shut down`);
                }
            }
            await (0, database_1.disconnectDatabase)();
            process.exit(0);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    logStartupMessage() {
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
        logger_1.logger.info(`🚀 Unified platform running on port ${this.port}`);
        logger_1.logger.info(`📊 Queue dashboard: http://localhost:${this.port}/admin/queues`);
        logger_1.logger.info(`🏥 Health check: http://localhost:${this.port}/health`);
        logger_1.logger.info(`🔌 WebSocket ready on port ${this.wsPort}`);
        logger_1.logger.info(`🔌 Socket.io ready on port ${this.port}`);
        if (process.env.NODE_ENV === 'production') {
            logger_1.logger.info('🏭 Running in PRODUCTION mode');
        }
        else {
            logger_1.logger.info('🚧 Running in DEVELOPMENT mode');
        }
    }
}
exports.UnifiedPlatformServer = UnifiedPlatformServer;
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
const server = new UnifiedPlatformServer();
server.startServer();
//# sourceMappingURL=unified-server.js.map