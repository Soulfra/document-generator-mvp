"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const sentry_1 = require("./config/sentry");
(0, sentry_1.initializeSentry)();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const api_1 = require("@bull-board/api");
const bullAdapter_1 = require("@bull-board/api/bullAdapter");
const express_2 = require("@bull-board/express");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const env_validation_1 = require("./utils/env-validation");
const opentelemetry_service_1 = require("./services/tracing/opentelemetry.service");
const elk_transport_service_1 = require("./services/logging/elk-transport.service");
const chaos_engineering_service_1 = require("./services/chaos/chaos-engineering.service");
const swagger_middleware_1 = require("./middleware/swagger.middleware");
const sla_slo_service_1 = require("./services/monitoring/sla-slo.service");
const pagerduty_service_1 = require("./services/alerting/pagerduty.service");
const status_page_service_1 = require("./services/status-page/status-page.service");
const health_route_1 = require("./api/routes/health.route");
const upload_route_simple_1 = require("./api/routes/upload.route.simple");
const job_route_simple_1 = require("./api/routes/job.route.simple");
const payment_route_simple_1 = require("./api/routes/payment.route.simple");
const webhook_route_simple_1 = require("./api/routes/webhook.route.simple");
const profile_route_1 = require("./api/routes/profile.route");
const api_keys_route_1 = require("./api/routes/api-keys.route");
const byok_route_1 = require("./api/routes/byok.route");
const orchestration_route_1 = require("./api/routes/orchestration.route");
const cleanup_route_1 = require("./api/routes/cleanup.route");
const cleanup_webhook_route_1 = require("./api/routes/cleanup-webhook.route");
const monitoring_route_1 = require("./api/routes/monitoring.route");
const trust_tier_route_1 = require("./api/routes/trust-tier.route");
const cleanup_reports_route_1 = require("./api/routes/cleanup-reports.route");
const achievements_route_1 = require("./api/routes/achievements.route");
const auth_route_1 = require("./api/routes/auth.route");
const docs_route_1 = require("./api/routes/docs.route");
const metrics_route_1 = require("./api/routes/metrics.route");
const agent_orchestration_route_1 = require("./api/routes/agent-orchestration.route");
const analytics_route_1 = require("./api/routes/analytics.route");
const ai_team_route_1 = require("./api/routes/ai-team.route");
const performance_route_1 = require("./api/routes/performance.route");
const privacy_route_1 = require("./api/routes/privacy.route");
const chaos_route_1 = require("./api/routes/chaos.route");
const status_route_1 = require("./api/routes/status.route");
const support_route_1 = require("./api/routes/support.route");
const error_handler_1 = require("./utils/error-handler");
const rate_limit_middleware_1 = require("./middleware/rate-limit.middleware");
const auth_middleware_1 = require("./middleware/auth.middleware");
const logging_middleware_1 = require("./middleware/logging.middleware");
const sentry_middleware_1 = __importDefault(require("./middleware/sentry.middleware"));
const analytics_middleware_1 = require("./middleware/analytics.middleware");
const prometheus_metrics_service_1 = require("./services/monitoring/prometheus-metrics.service");
const cleanup_queue_1 = require("./jobs/cleanup.queue");
const logger_1 = require("./utils/logger");
const database_1 = require("./utils/database");
const router_1 = require("./llm/router");
const profile_service_1 = require("./services/profile.service");
const service_registry_1 = require("./services/orchestration/service-registry");
const agent_manager_service_1 = require("./services/orchestration/agent-manager.service");
const websocket_service_1 = require("./services/websocket/websocket.service");
const compression_middleware_1 = require("./middleware/compression.middleware");
const cache_middleware_1 = require("./middleware/cache.middleware");
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: env_validation_1.env.FRONTEND_URL,
        credentials: true,
    },
});
exports.io = io;
const PORT = env_validation_1.env.PORT;
async function startServer() {
    try {
        await opentelemetry_service_1.openTelemetryService.initialize();
        logger_1.logger.info('✅ OpenTelemetry initialized');
        await database_1.prisma.$connect();
        logger_1.logger.info('✅ Database connected');
        await router_1.llmRouter.initialize();
        logger_1.logger.info('✅ LLM router initialized');
        await profile_service_1.profileService.initialize();
        logger_1.logger.info('✅ Profile service initialized');
        logger_1.logger.info('✅ Service registry initialized');
        logger_1.logger.info('✅ Agent manager initialized');
        const webSocketService = (0, websocket_service_1.initializeWebSocketService)(httpServer);
        logger_1.logger.info('✅ WebSocket service initialized');
        await elk_transport_service_1.elkTransportService.initialize();
        logger_1.logger.info('✅ ELK transport initialized');
        await sla_slo_service_1.slaSloService.initialize();
        logger_1.logger.info('✅ SLA/SLO monitoring initialized');
        if (env_validation_1.env.PAGERDUTY_INTEGRATION_KEY) {
            await pagerduty_service_1.pagerDutyService.initialize();
            logger_1.logger.info('✅ PagerDuty integration initialized');
        }
        await status_page_service_1.statusPageService.startMonitoring();
        logger_1.logger.info('✅ Status page monitoring started');
        app.use(sentry_middleware_1.default.requestHandler);
        app.use(sentry_middleware_1.default.enhancedTracking);
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        app.use((0, cors_1.default)({
            origin: env_validation_1.env.FRONTEND_URL,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        }));
        app.use((0, compression_middleware_1.smartCompression)());
        app.use('/api/stripe/webhook', express_1.default.raw({ type: 'application/json' }));
        app.use('/api/cleanup/webhook/stripe', express_1.default.raw({ type: 'application/json' }));
        app.use(express_1.default.json({ limit: '10mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        app.use(logging_middleware_1.requestLogger);
        app.use(analytics_middleware_1.trackingSuite.session);
        app.use(analytics_middleware_1.trackingSuite.analytics);
        app.use(analytics_middleware_1.trackingSuite.user);
        app.use(analytics_middleware_1.trackingSuite.businessEvents);
        if (env_validation_1.env.NODE_ENV !== 'production' && env_validation_1.env.CHAOS_ENGINEERING_ENABLED === 'true') {
            app.use(chaos_engineering_service_1.chaosEngineering.middleware());
            logger_1.logger.warn('⚠️  Chaos Engineering enabled - expect controlled failures');
        }
        app.use(prometheus_metrics_service_1.prometheusMetrics.createHttpMetricsMiddleware());
        app.use(sentry_middleware_1.default.userContext);
        app.use(sentry_middleware_1.default.performanceMonitoring);
        app.use(sentry_middleware_1.default.businessEvents);
        app.use(sentry_middleware_1.default.security);
        app.use('/api', rate_limit_middleware_1.rateLimiter);
        app.use('/api/profiles', cache_middleware_1.mediumCache);
        app.use('/api/docs', cache_middleware_1.mediumCache);
        app.use('/api/health', cache_middleware_1.userSpecificCache);
        const serverAdapter = new express_2.ExpressAdapter();
        serverAdapter.setBasePath('/admin/queues');
        (0, api_1.createBullBoard)({
            queues: [new bullAdapter_1.BullAdapter(cleanup_queue_1.cleanupQueue)],
            serverAdapter,
        });
        app.use('/admin/queues', (0, auth_middleware_1.authentication)({ role: 'admin' }), serverAdapter.getRouter());
        app.use('/health', health_route_1.healthRouter);
        app.use('/api/health', health_route_1.healthRouter);
        app.use('/api/auth', auth_route_1.authRouter);
        app.use('/api/webhook', webhook_route_simple_1.webhookRouter);
        app.use('/api/upload', upload_route_simple_1.uploadRouter);
        app.use('/api/jobs', job_route_simple_1.jobRouter);
        app.use('/api/payment', payment_route_simple_1.paymentRouter);
        app.use('/api/profiles', profile_route_1.profileRouter);
        app.use('/api/cleanup', cleanup_route_1.cleanupRouter);
        app.use('/api/cleanup/webhook', cleanup_webhook_route_1.cleanupWebhookRouter);
        app.use('/api/cleanup/reports', cleanup_reports_route_1.cleanupReportsRouter);
        app.use('/api/api-keys', (0, auth_middleware_1.authentication)(), api_keys_route_1.apiKeysRouter);
        app.use('/api/byok', (0, auth_middleware_1.authentication)(), byok_route_1.byokRouter);
        app.use('/api/orchestration', (0, auth_middleware_1.authentication)({ role: 'admin' }), orchestration_route_1.orchestrationRouter);
        app.use('/api/monitoring', monitoring_route_1.monitoringRouter);
        app.use('/api/trust', trust_tier_route_1.trustTierRouter);
        app.use('/api/achievements', achievements_route_1.achievementsRouter);
        app.use('/api/docs', docs_route_1.docsRouter);
        app.use('/api/metrics', metrics_route_1.metricsRouter);
        app.use('/metrics', metrics_route_1.metricsRouter);
        app.use('/api/orchestration', agent_orchestration_route_1.agentOrchestrationRouter);
        app.use('/api/analytics', analytics_route_1.analyticsRouter);
        app.use('/api/ai-team', ai_team_route_1.aiTeamRouter);
        app.use('/api/performance', performance_route_1.performanceRouter);
        app.use('/api/privacy', privacy_route_1.privacyRouter);
        if (env_validation_1.env.NODE_ENV !== 'production') {
            app.use('/api/chaos', chaos_route_1.chaosRouter);
        }
        app.use('/api/status', status_route_1.statusRouter);
        app.use('/api/support', support_route_1.supportRouter);
        const swaggerRouter = (0, swagger_middleware_1.createSwaggerMiddleware)(app, {
            basePath: '/api/docs',
            title: 'FinishThisIdea API',
            version: '1.0.0',
            description: 'Complete API documentation for FinishThisIdea platform'
        });
        app.use('/api/docs', swaggerRouter);
        app.use('/api/swagger', swaggerRouter);
        app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
        io.on('connection', (socket) => {
            logger_1.logger.info('Client connected', { socketId: socket.id });
            socket.on('subscribe:job', (jobId) => {
                socket.join(`job:${jobId}`);
                logger_1.logger.info('Client subscribed to job', { socketId: socket.id, jobId });
            });
            socket.on('disconnect', () => {
                logger_1.logger.info('Client disconnected', { socketId: socket.id });
            });
        });
        app.set('io', io);
        app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'The requested resource was not found',
                },
            });
        });
        app.use(sentry_middleware_1.default.errorHandler);
        app.use(sentry_middleware_1.default.enhancedErrorHandler);
        app.use(error_handler_1.errorHandler);
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`🚀 Cleanup service backend running on port ${PORT}`);
            logger_1.logger.info(`📊 Queue dashboard: http://localhost:${PORT}/admin/queues`);
            logger_1.logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
            logger_1.logger.info(`🔌 WebSocket ready on port ${PORT}`);
            logger_1.logger.info(`📊 Monitoring dashboard: http://localhost:${PORT}/monitoring-dashboard.html`);
            logger_1.logger.info(`🎯 Trust tiers info: http://localhost:${PORT}/trust-tiers.html`);
            logger_1.logger.info(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
            logger_1.logger.info(`🔍 OpenAPI Spec: http://localhost:${PORT}/api/docs/openapi.json`);
            logger_1.logger.info(`🔴 Status Page: http://localhost:${PORT}/status-page.html`);
            if (env_validation_1.env.NODE_ENV === 'production') {
                logger_1.logger.info('🏭 Running in PRODUCTION mode');
            }
            else {
                logger_1.logger.info('🚧 Running in DEVELOPMENT mode');
            }
        });
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received, starting graceful shutdown...`);
            httpServer.close(() => {
                logger_1.logger.info('HTTP server closed');
            });
            io.close(() => {
                logger_1.logger.info('Socket.io server closed');
            });
            await cleanup_queue_1.cleanupQueue.close();
            logger_1.logger.info('Queue connections closed');
            await service_registry_1.serviceRegistry.shutdown();
            logger_1.logger.info('Service registry shut down');
            await agent_manager_service_1.agentManager.shutdown();
            logger_1.logger.info('Agent manager shut down');
            await opentelemetry_service_1.openTelemetryService.shutdown();
            logger_1.logger.info('OpenTelemetry shut down');
            await elk_transport_service_1.elkTransportService.shutdown();
            logger_1.logger.info('ELK transport shut down');
            status_page_service_1.statusPageService.stopMonitoring();
            logger_1.logger.info('Status page monitoring stopped');
            await (0, database_1.disconnectDatabase)();
            process.exit(0);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (env_validation_1.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer();
//# sourceMappingURL=server.js.map