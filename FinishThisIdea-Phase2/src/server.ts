import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './utils/logger';
import { prisma } from './utils/database';
import { llmRouter } from './llm/router';

// Import monitoring tools
import { AnalyticsDashboard } from './monitoring/analytics-dashboard';
import { presenceLogger } from './monitoring/presence-logger';

// Import routes
import dashboardRouter from './api/routes/dashboard.route';
import { paymentsRouter } from './api/routes/payments.route';
import uploadRouter from './api/routes/upload.route';
import qrAuthRouter from './api/routes/qr-auth.route';
import treasuryRouter from './api/routes/treasury.route';
import agentsRouter from './api/routes/agents.route';
import showcaseRouter from './api/routes/showcase.route';

// Import job queues - Original Phase 2 services
import './jobs/cleanup.job';
import './jobs/documentation.job';
import './jobs/api-generation.job';
import './jobs/test-generation.job';
import './jobs/security-analysis.job';

// Import job queues - Soulfra services
import './jobs/codeCleanup.job';
import './jobs/codeNavigation.job';
import './jobs/deepCleanup.job';
import './jobs/importOptimizer.job';
import './jobs/documentationGenerator.job';
import './jobs/businessDocs.job';
import './jobs/apiGenerator.job';
import './jobs/chatApi.job';
import './jobs/orchestrationApi.job';
import './jobs/testGenerator.job';
import './jobs/integrationTests.job';
import './jobs/securityFilter.job';
import './jobs/accessControl.job';
import './jobs/securityEncoding.job';
import './jobs/aiConductor.job';
import './jobs/aiValidator.job';
import './jobs/aiVersioning.job';
import './jobs/autonomousAgent.job';
import './jobs/uxOptimizer.job';
import './jobs/aiUx.job';
import './jobs/loadTesting.job';
import './jobs/codeConsolidation.job';
import './jobs/ideaExtraction.job';
import './jobs/serviceChaining.job';
import './jobs/containerization.job';
import './jobs/enterpriseSuite.job';
import './jobs/distributedSystem.job';
import './jobs/workflowAutomation.job';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    // Initialize database
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Initialize LLM router
    await llmRouter.initialize();
    logger.info('✅ LLM router initialized');

    // Middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));
    app.use(compression());
    
    // Session middleware
    app.use(session({
      secret: process.env.SESSION_SECRET || 'finishthisidea-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));
    
    // Special handling for Stripe webhooks (raw body)
    app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
    
    // JSON parsing for all other routes
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Serve static files
    app.use(express.static('public'));

    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'FinishThisIdea Phase2',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API Routes
    app.use('/api/dashboard', dashboardRouter);
    app.use('/api/payments', paymentsRouter);
    app.use('/api/upload', uploadRouter);
    app.use('/api/qr-auth', qrAuthRouter);
    app.use('/api/treasury', treasuryRouter);
    app.use('/api/agents', agentsRouter);
    app.use('/api/showcase', showcaseRouter);

    // WebSocket connection handling
    io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('subscribe-job', (jobId) => {
        socket.join(`job-${jobId}`);
        logger.info('Client subscribed to job updates', { socketId: socket.id, jobId });
      });

      socket.on('subscribe-bundle', (bundleId) => {
        socket.join(`bundle-${bundleId}`);
        logger.info('Client subscribed to bundle updates', { socketId: socket.id, bundleId });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });

    // Job progress updates via WebSocket - Original Phase 2 services
    const { cleanupQueue } = await import('./jobs/cleanup.job');
    const { documentationQueue } = await import('./jobs/documentation.job');
    const { apiGenerationQueue } = await import('./jobs/api-generation.job');
    const { testGenerationQueue } = await import('./jobs/test-generation.job');
    const { securityAnalysisQueue } = await import('./jobs/security-analysis.job');
    
    // Soulfra services
    const { codeCleanupQueue } = await import('./jobs/codeCleanup.job');
    const { codeNavigationQueue } = await import('./jobs/codeNavigation.job');
    const { deepCleanupQueue } = await import('./jobs/deepCleanup.job');
    const { importOptimizerQueue } = await import('./jobs/importOptimizer.job');
    const { documentationGeneratorQueue } = await import('./jobs/documentationGenerator.job');
    const { businessDocsQueue } = await import('./jobs/businessDocs.job');
    const { apiGeneratorQueue } = await import('./jobs/apiGenerator.job');
    const { chatApiQueue } = await import('./jobs/chatApi.job');
    const { orchestrationApiQueue } = await import('./jobs/orchestrationApi.job');
    const { testGeneratorQueue } = await import('./jobs/testGenerator.job');
    const { integrationTestsQueue } = await import('./jobs/integrationTests.job');
    const { securityFilterQueue } = await import('./jobs/securityFilter.job');
    const { accessControlQueue } = await import('./jobs/accessControl.job');
    const { securityEncodingQueue } = await import('./jobs/securityEncoding.job');
    const { aiConductorQueue } = await import('./jobs/aiConductor.job');
    const { aiValidatorQueue } = await import('./jobs/aiValidator.job');
    const { aiVersioningQueue } = await import('./jobs/aiVersioning.job');
    const { autonomousAgentQueue } = await import('./jobs/autonomousAgent.job');
    const { uxOptimizerQueue } = await import('./jobs/uxOptimizer.job');
    const { aiUxQueue } = await import('./jobs/aiUx.job');
    const { loadTestingQueue } = await import('./jobs/loadTesting.job');
    const { codeConsolidationQueue } = await import('./jobs/codeConsolidation.job');
    const { ideaExtractionQueue } = await import('./jobs/ideaExtraction.job');
    const { serviceChainingQueue } = await import('./jobs/serviceChaining.job');
    const { containerizationQueue } = await import('./jobs/containerization.job');
    const { enterpriseSuiteQueue } = await import('./jobs/enterpriseSuite.job');
    const { distributedSystemQueue } = await import('./jobs/distributedSystem.job');
    const { workflowAutomationQueue } = await import('./jobs/workflowAutomation.job');

    // Setup progress tracking for all queues
    const allQueues = [
      cleanupQueue, documentationQueue, apiGenerationQueue, testGenerationQueue, securityAnalysisQueue,
      codeCleanupQueue, codeNavigationQueue, deepCleanupQueue, importOptimizerQueue, documentationGeneratorQueue,
      businessDocsQueue, apiGeneratorQueue, chatApiQueue, orchestrationApiQueue, testGeneratorQueue,
      integrationTestsQueue, securityFilterQueue, accessControlQueue, securityEncodingQueue, aiConductorQueue,
      aiValidatorQueue, aiVersioningQueue, autonomousAgentQueue, uxOptimizerQueue, aiUxQueue,
      loadTestingQueue, codeConsolidationQueue, ideaExtractionQueue, serviceChainingQueue, containerizationQueue,
      enterpriseSuiteQueue, distributedSystemQueue, workflowAutomationQueue
    ];
    
    allQueues.forEach(queue => {
      queue.on('progress', (job, progress) => {
        const jobId = job.data.jobId;
        io.to(`job-${jobId}`).emit('job-progress', {
          jobId,
          progress,
          status: 'PROCESSING'
        });
      });

      queue.on('completed', async (job, result) => {
        const jobId = job.data.jobId;
        
        // Get updated job data
        const jobData = await prisma.job.findUnique({
          where: { id: jobId },
          include: { bundle: true }
        });

        io.to(`job-${jobId}`).emit('job-completed', {
          jobId,
          progress: 100,
          status: 'COMPLETED',
          result
        });

        // If part of bundle, check bundle completion
        if (jobData?.bundle) {
          const bundleJobs = await prisma.job.findMany({
            where: { bundleId: jobData.bundle.id }
          });
          
          const allCompleted = bundleJobs.every(j => j.status === 'COMPLETED');
          if (allCompleted) {
            await prisma.bundle.update({
              where: { id: jobData.bundle.id },
              data: { status: 'COMPLETED' }
            });

            io.to(`bundle-${jobData.bundle.id}`).emit('bundle-completed', {
              bundleId: jobData.bundle.id,
              status: 'COMPLETED',
              jobs: bundleJobs
            });
          }
        }
      });

      queue.on('failed', async (job, error) => {
        const jobId = job.data.jobId;
        
        io.to(`job-${jobId}`).emit('job-failed', {
          jobId,
          status: 'FAILED',
          error: error.message
        });

        // Update bundle status if applicable
        const jobData = await prisma.job.findUnique({
          where: { id: jobId },
          include: { bundle: true }
        });

        if (jobData?.bundle) {
          await prisma.bundle.update({
            where: { id: jobData.bundle.id },
            data: { status: 'FAILED' }
          });

          io.to(`bundle-${jobData.bundle.id}`).emit('bundle-failed', {
            bundleId: jobData.bundle.id,
            status: 'FAILED',
            failedJobId: jobId,
            error: error.message
          });
        }
      });
    });

    // Error handling middleware
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { 
        error: error.message, 
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    });

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 FinishThisIdea Phase2 running on port ${PORT}`);
      logger.info(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/services`);
      logger.info(`💳 Payments: http://localhost:${PORT}/api/payments`);
      logger.info(`💰 Treasury: http://localhost:${PORT}/treasury.html`);
      logger.info(`🤖 Agents: http://localhost:${PORT}/api/agents/templates`);
      logger.info(`🚀 Showcase: http://localhost:${PORT}/showcase.html`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
      
      // Start analytics dashboard
      const analytics = new AnalyticsDashboard(8889);
      analytics.start();
      logger.info(`📈 Analytics Dashboard: http://localhost:8889`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
    
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
    
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

export default app;
export { io };