import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routers
import { healthRouter } from './routes/health.route';
import { uploadRouter } from './routes/upload.route';
import { jobRouter } from './routes/job.route';
import { paymentRouter } from './routes/payment.route';
import { webhookRouter } from './routes/webhook.route';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { authentication } from './middleware/auth.middleware';
import { requestLogger } from './middleware/logging.middleware';

// Import queue
import { cleanupQueue } from './queues/cleanup.queue';

// Import utils
import { logger } from './utils/logger';
import { initializeDatabase } from './database/connection';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('✅ Database connected');

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
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Compression
    app.use(compression());

    // Body parsing - Stripe webhook needs raw body
    app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
    
    // Regular body parsing for other routes
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    app.use(requestLogger);

    // Rate limiting
    app.use('/api', rateLimiter);

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

    // Public routes (no auth)
    app.use('/api/stripe/webhook', webhookRouter);

    // Protected routes
    app.use('/api/upload', authentication(), uploadRouter);
    app.use('/api/jobs', authentication(), jobRouter);
    app.use('/api/payment', authentication(), paymentRouter);

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

    // Error handling (must be last)
    app.use(errorHandler);

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Cleanup service backend running on port ${PORT}`);
      logger.info(`📊 Queue dashboard: http://localhost:${PORT}/admin/queues`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket ready on port ${PORT}`);
      
      if (process.env.NODE_ENV === 'production') {
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

      // Close database
      await prisma.$disconnect();
      logger.info('Database disconnected');

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
  if (process.env.NODE_ENV !== 'production') {
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