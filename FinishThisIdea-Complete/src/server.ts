// Initialize Sentry as early as possible
import { initializeSentry, SentryUtils } from './config/sentry';
initializeSentry();

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
import { env } from './utils/env-validation';
import { openTelemetryService } from './services/tracing/opentelemetry.service';
import { elkTransportService } from './services/logging/elk-transport.service';
import { chaosEngineering } from './services/chaos/chaos-engineering.service';
import { createSwaggerMiddleware } from './middleware/swagger.middleware';
import { slaSloService } from './services/monitoring/sla-slo.service';
import { pagerDutyService } from './services/alerting/pagerduty.service';
import { statusPageService } from './services/status-page/status-page.service';

// Import routers
import { healthRouter } from './api/routes/health.route';
import { uploadRouter } from './api/routes/upload.route.simple';
import { jobRouter } from './api/routes/job.route.simple';
import { paymentRouter } from './api/routes/payment.route.simple';
import { webhookRouter } from './api/routes/webhook.route.simple';
import { profileRouter } from './api/routes/profile.route';
import { apiKeysRouter } from './api/routes/api-keys.route';
import { byokRouter } from './api/routes/byok.route';
import { orchestrationRouter } from './api/routes/orchestration.route';
import { cleanupRouter } from './api/routes/cleanup.route';
import { cleanupWebhookRouter } from './api/routes/cleanup-webhook.route';
import { monitoringRouter } from './api/routes/monitoring.route';
import { trustTierRouter } from './api/routes/trust-tier.route';
import { cleanupReportsRouter } from './api/routes/cleanup-reports.route';
import { achievementsRouter } from './api/routes/achievements.route';
import { authRouter } from './api/routes/auth.route';
import { docsRouter } from './api/routes/docs.route';
import { metricsRouter } from './api/routes/metrics.route';
import { agentOrchestrationRouter } from './api/routes/agent-orchestration.route';
import { analyticsRouter } from './api/routes/analytics.route';
import { aiTeamRouter } from './api/routes/ai-team.route';
import { performanceRouter } from './api/routes/performance.route';
import { privacyRouter } from './api/routes/privacy.route';
import { chaosRouter } from './api/routes/chaos.route';
import { statusRouter } from './api/routes/status.route';
import { supportRouter } from './api/routes/support.route';
import { agentMarketplaceRouter } from './api/routes/agent-marketplace.route';

// Import middleware
import { errorHandler } from './utils/error-handler';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { authentication } from './middleware/auth.middleware';
import { requestLogger } from './middleware/logging.middleware';
import sentryMiddleware from './middleware/sentry.middleware';
import { trackingSuite } from './middleware/analytics.middleware';

// Import Prometheus metrics
import { prometheusMetrics } from './services/monitoring/prometheus-metrics.service';

// Import queue
import { cleanupQueue } from './jobs/cleanup.queue';

// Import utils
import { logger } from './utils/logger';
import { prisma, disconnectDatabase } from './utils/database';
import { llmRouter } from './llm/router';
import { profileService } from './services/profile.service';

// Import orchestration
import { serviceRegistry } from './services/orchestration/service-registry';
import { agentManager } from './services/orchestration/agent-manager.service';
import { initializeWebSocketService } from './services/websocket/websocket.service';
import { performanceService } from './services/performance/performance.service';
import { smartCompression } from './middleware/compression.middleware';
import { mediumCache, userSpecificCache } from './middleware/cache.middleware';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

const PORT = env.PORT;

async function startServer() {
  try {
    // Initialize OpenTelemetry first for distributed tracing
    await openTelemetryService.initialize();
    logger.info('✅ OpenTelemetry initialized');

    // Initialize database
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Initialize LLM router
    await llmRouter.initialize();
    logger.info('✅ LLM router initialized');

    // Initialize profile service
    await profileService.initialize();
    logger.info('✅ Profile service initialized');

    // Initialize service registry (already auto-initializes)
    logger.info('✅ Service registry initialized');

    // Initialize agent manager (auto-starts default agents)
    logger.info('✅ Agent manager initialized');

    // Initialize WebSocket service for real-time updates
    const webSocketService = initializeWebSocketService(httpServer);
    logger.info('✅ WebSocket service initialized');

    // Initialize ELK transport for centralized logging
    await elkTransportService.initialize();
    logger.info('✅ ELK transport initialized');

    // Initialize SLA/SLO monitoring
    await slaSloService.initialize();
    logger.info('✅ SLA/SLO monitoring initialized');

    // Initialize PagerDuty integration
    if (env.PAGERDUTY_INTEGRATION_KEY) {
      await pagerDutyService.initialize();
      logger.info('✅ PagerDuty integration initialized');
    }

    // Initialize status page monitoring
    await statusPageService.startMonitoring();
    logger.info('✅ Status page monitoring started');

    // Sentry middleware - must be first
    app.use(sentryMiddleware.requestHandler);
    app.use(sentryMiddleware.enhancedTracking);

    // Security middleware
    app.use(helmet({
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
    app.use(cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Smart compression with performance monitoring
    app.use(smartCompression());

    // Body parsing - Stripe webhook needs raw body
    app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
    app.use('/api/cleanup/webhook/stripe', express.raw({ type: 'application/json' }));
    
    // Regular body parsing for other routes
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    app.use(requestLogger);
    
    // Analytics tracking
    app.use(trackingSuite.session);
    app.use(trackingSuite.analytics);
    app.use(trackingSuite.user);
    app.use(trackingSuite.businessEvents);
    
    // Chaos engineering middleware (only in non-production)
    if (env.NODE_ENV !== 'production' && env.CHAOS_ENGINEERING_ENABLED === 'true') {
      app.use(chaosEngineering.middleware());
      logger.warn('⚠️  Chaos Engineering enabled - expect controlled failures');
    }
    
    // Prometheus metrics collection
    app.use(prometheusMetrics.createHttpMetricsMiddleware());

    // Sentry additional middleware
    app.use(sentryMiddleware.userContext);
    app.use(sentryMiddleware.performanceMonitoring);
    app.use(sentryMiddleware.businessEvents);
    app.use(sentryMiddleware.security);

    // Rate limiting
    app.use('/api', rateLimiter);
    
    // Performance caching for API routes
    app.use('/api/profiles', mediumCache);
    app.use('/api/docs', mediumCache);
    app.use('/api/health', userSpecificCache);

    // Bull Dashboard
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    
    createBullBoard({
      queues: [new BullAdapter(cleanupQueue)],
      serverAdapter,
    });
    
    app.use('/admin/queues', authentication({ role: 'admin' }), serverAdapter.getRouter());

    // Health check (no auth)
    app.use('/health', healthRouter);
    app.use('/api/health', healthRouter);
    
    // Authentication routes (no auth required)
    app.use('/api/auth', authRouter);

    // Public routes (no auth needed for MVP)
    app.use('/api/webhook', webhookRouter);
    app.use('/api/upload', uploadRouter);
    app.use('/api/jobs', jobRouter);
    app.use('/api/payment', paymentRouter);
    app.use('/api/profiles', profileRouter);
    
    // Cleanup service routes (public for MVP)
    app.use('/api/cleanup', cleanupRouter);
    app.use('/api/cleanup/webhook', cleanupWebhookRouter);
    app.use('/api/cleanup/reports', cleanupReportsRouter);
    
    // API Key Management routes (require authentication)
    app.use('/api/api-keys', authentication(), apiKeysRouter);
    app.use('/api/byok', authentication(), byokRouter);
    
    // Service Orchestration routes (admin only)
    app.use('/api/orchestration', authentication({ role: 'admin' }), orchestrationRouter);
    
    // Monitoring routes (public for MVP, should be secured in production)
    app.use('/api/monitoring', monitoringRouter);
    
    // Trust tier routes (public for MVP)
    app.use('/api/trust', trustTierRouter);
    
    // Achievement routes (public for MVP)
    app.use('/api/achievements', achievementsRouter);
    
    // Documentation routes (OpenAPI/Swagger integration)
    app.use('/api/docs', docsRouter);
    
    // Metrics routes (Prometheus integration)
    app.use('/api/metrics', metricsRouter);
    app.use('/metrics', metricsRouter); // Standard Prometheus endpoint
    
    // Agent Orchestration routes (Multi-agent coordination)
    app.use('/api/orchestration', agentOrchestrationRouter);
    
    // Analytics routes (User behavior tracking)
    app.use('/api/analytics', analyticsRouter);
    
    // AI Team routes (Real-time agent management)
    app.use('/api/ai-team', aiTeamRouter);
    
    // Performance monitoring routes
    app.use('/api/performance', performanceRouter);
    
    // Privacy & GDPR compliance routes
    app.use('/api/privacy', privacyRouter);
    
    // Chaos engineering routes (admin only, non-production)
    if (env.NODE_ENV !== 'production') {
      app.use('/api/chaos', chaosRouter);
    }
    
    // Status page routes (public health monitoring)
    app.use('/api/status', statusRouter);
    
    // Support/help desk routes
    app.use('/api/support', supportRouter);
    
    // Agent Marketplace routes (core feature)
    app.use('/api/marketplace', agentMarketplaceRouter);

    // Swagger API documentation
    const swaggerRouter = createSwaggerMiddleware(app, {
      basePath: '/api/docs',
      title: 'FinishThisIdea API',
      version: '1.0.0',
      description: 'Complete API documentation for FinishThisIdea platform'
    });
    app.use('/api/docs', swaggerRouter);
    app.use('/api/swagger', swaggerRouter);

    // Serve static files
    app.use(express.static(path.join(__dirname, '../public')));

    // Socket.io for real-time updates
    io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('subscribe:job', (jobId: string) => {
        socket.join(`job:${jobId}`);
        logger.info('Client subscribed to job', { socketId: socket.id, jobId });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });

    // Make io accessible to other parts of the app
    app.set('io', io);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
        },
      });
    });

    // Sentry error handling (must be before other error handlers)
    app.use(sentryMiddleware.errorHandler);
    app.use(sentryMiddleware.enhancedErrorHandler);

    // Error handling (must be last)
    app.use(errorHandler);

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Cleanup service backend running on port ${PORT}`);
      logger.info(`📊 Queue dashboard: http://localhost:${PORT}/admin/queues`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket ready on port ${PORT}`);
      logger.info(`📊 Monitoring dashboard: http://localhost:${PORT}/monitoring-dashboard.html`);
      logger.info(`🎯 Trust tiers info: http://localhost:${PORT}/trust-tiers.html`);
      logger.info(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`🔍 OpenAPI Spec: http://localhost:${PORT}/api/docs/openapi.json`);
      logger.info(`🔴 Status Page: http://localhost:${PORT}/status-page.html`);
      
      if (env.NODE_ENV === 'production') {
        logger.info('🏭 Running in PRODUCTION mode');
      } else {
        logger.info('🚧 Running in DEVELOPMENT mode');
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      // Stop accepting new connections
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      // Close Socket.io
      io.close(() => {
        logger.info('Socket.io server closed');
      });

      // Close queue connections
      await cleanupQueue.close();
      logger.info('Queue connections closed');

      // Shutdown service registry
      await serviceRegistry.shutdown();
      logger.info('Service registry shut down');

      // Shutdown agent manager
      await agentManager.shutdown();
      logger.info('Agent manager shut down');

      // Shutdown monitoring services
      await openTelemetryService.shutdown();
      logger.info('OpenTelemetry shut down');
      
      await elkTransportService.shutdown();
      logger.info('ELK transport shut down');
      
      // Stop status page monitoring
      statusPageService.stopMonitoring();
      logger.info('Status page monitoring stopped');

      // Close database
      await disconnectDatabase();

      process.exit(0);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log
  if (env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Always exit on uncaught exception
  process.exit(1);
});

// Start the server
startServer();

// Export for testing
export { app, httpServer, io };