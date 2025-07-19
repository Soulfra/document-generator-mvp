import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { {{camelCase name}}Queue } from './queues/{{kebabCase name}}.queue';
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { authentication } from './middleware/auth.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { healthRouter } from './routes/health.route';
import { uploadRouter } from './routes/upload.route';
import { jobRouter } from './routes/job.route';
import { webhookRouter } from './routes/webhook.route';
import { logger } from './utils/logger';
import { initializeDatabase } from './database/connection';
import { initializeServices } from './services';

const app = express();
const PORT = process.env.PORT || {{defaultPort}};

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('✅ Database connected');
    
    // Initialize services
    await initializeServices();
    logger.info('✅ Services initialized');
    
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
    
    // CORS configuration
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));
    
    // Compression
    app.use(compression());
    
    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    app.use(requestLogger);
    
    // Rate limiting
    app.use('/api', rateLimiter);
    
    // Queue monitoring dashboard
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    
    createBullBoard({
      queues: [new BullAdapter({{camelCase name}}Queue)],
      serverAdapter,
    });
    
    app.use('/admin/queues', authentication({ role: 'admin' }), serverAdapter.getRouter());
    
    // API routes
    app.use('/api/health', healthRouter);
    app.use('/api/upload', authentication(), uploadRouter);
    app.use('/api/jobs', authentication(), jobRouter);
    app.use('/api/webhook', webhookRouter);
    
    // Service-specific routes
    app.use('/api/{{kebabCase name}}', authentication(), require('./routes/{{kebabCase name}}.route').default);
    
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
    
    // Error handling
    app.use(errorHandler);
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 {{pascalCase name}} service running on port ${PORT}`);
      logger.info(`📊 Queue dashboard: http://localhost:${PORT}/admin/queues`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Close queue connections
      await {{camelCase name}}Queue.close();
      
      // Close database connections
      await closeDatabase();
      
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Exit the process for uncaught exceptions
  process.exit(1);
});

// Start the server
startServer();

export { app };