import { Router } from 'express';
import { prisma } from '../database/connection';
import { cleanupQueue } from '../queues/cleanup.queue';
import { logger } from '../utils/logger';
import os from 'os';
import { version } from '../../package.json';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    queue: ServiceHealth;
    storage: ServiceHealth;
    stripe: ServiceHealth;
    ollama?: ServiceHealth;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      load: number[];
      cores: number;
    };
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
}

/**
 * GET /health
 * Basic health check
 */
router.get('/', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    version,
  });
});

/**
 * GET /health/detailed
 * Detailed health check with all services
 */
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date(),
    version,
    uptime: process.uptime(),
    services: {
      database: { status: 'down' },
      redis: { status: 'down' },
      queue: { status: 'down' },
      storage: { status: 'down' },
      stripe: { status: 'down' },
    },
    system: {
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length,
      },
    },
  };

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = {
      status: 'up',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    health.services.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.status = 'unhealthy';
  }

  // Check Redis via Bull queue
  try {
    const redisStart = Date.now();
    const queueHealth = await cleanupQueue.isReady();
    health.services.redis = {
      status: queueHealth ? 'up' : 'down',
      latency: Date.now() - redisStart,
    };
    
    // Also check queue processing
    const [waiting, active, completed, failed] = await Promise.all([
      cleanupQueue.getWaitingCount(),
      cleanupQueue.getActiveCount(),
      cleanupQueue.getCompletedCount(),
      cleanupQueue.getFailedCount(),
    ]);
    
    health.services.queue = {
      status: 'up',
      latency: Date.now() - redisStart,
      metadata: {
        waiting,
        active,
        completed,
        failed,
      },
    } as any;
  } catch (error) {
    health.services.redis = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.services.queue = {
      status: 'down',
      error: 'Redis connection failed',
    };
    health.status = 'unhealthy';
  }

  // Check S3/Storage
  try {
    const storageStart = Date.now();
    // Simple check - just verify environment variables exist
    if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY) {
      health.services.storage = {
        status: 'up',
        latency: Date.now() - storageStart,
      };
    } else {
      health.services.storage = {
        status: 'degraded',
        error: 'S3 configuration missing',
      };
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    }
  } catch (error) {
    health.services.storage = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    if (health.status === 'healthy') {
      health.status = 'degraded';
    }
  }

  // Check Stripe
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      health.services.stripe = {
        status: 'up',
      };
    } else {
      health.services.stripe = {
        status: 'degraded',
        error: 'Stripe configuration missing',
      };
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    }
  } catch (error) {
    health.services.stripe = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    if (health.status === 'healthy') {
      health.status = 'degraded';
    }
  }

  // Check Ollama if configured
  if (process.env.OLLAMA_URL) {
    try {
      const ollamaStart = Date.now();
      const response = await fetch(`${process.env.OLLAMA_URL}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      
      health.services.ollama = {
        status: response.ok ? 'up' : 'down',
        latency: Date.now() - ollamaStart,
      };
    } catch (error) {
      health.services.ollama = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
      // Ollama being down doesn't make the service unhealthy (fallback exists)
    }
  }

  // System memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  health.system.memory = {
    used: Math.round(usedMem / 1024 / 1024), // MB
    total: Math.round(totalMem / 1024 / 1024), // MB
    percentage: Math.round((usedMem / totalMem) * 100),
  };

  // Overall latency
  const totalLatency = Date.now() - startTime;

  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;

  logger.info('Health check completed', {
    status: health.status,
    latency: totalLatency,
    services: Object.entries(health.services).reduce((acc, [key, value]) => {
      acc[key] = value.status;
      return acc;
    }, {} as Record<string, string>),
  });

  res.status(statusCode).json(health);
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', async (req, res) => {
  try {
    // Check critical services
    await prisma.$queryRaw`SELECT 1`;
    const queueReady = await cleanupQueue.isReady();
    
    if (!queueReady) {
      throw new Error('Queue not ready');
    }

    res.json({
      ready: true,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    alive: true,
    timestamp: new Date(),
    pid: process.pid,
  });
});

/**
 * GET /health/metrics
 * Prometheus-compatible metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    // Gather metrics
    const [
      jobCounts,
      paymentMetrics,
      queueMetrics,
    ] = await Promise.all([
      // Job metrics
      prisma.job.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Payment metrics
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'SUCCEEDED' },
      }),
      // Queue metrics
      Promise.all([
        cleanupQueue.getWaitingCount(),
        cleanupQueue.getActiveCount(),
        cleanupQueue.getCompletedCount(),
        cleanupQueue.getFailedCount(),
      ]).then(([waiting, active, completed, failed]) => ({
        waiting, active, completed, failed,
      })),
    ]);

    // Format as Prometheus metrics
    const metrics = [
      '# HELP finishthisidea_jobs_total Total number of jobs by status',
      '# TYPE finishthisidea_jobs_total counter',
      ...jobCounts.map(({ status, _count }) => 
        `finishthisidea_jobs_total{status="${status}"} ${_count}`
      ),
      '',
      '# HELP finishthisidea_payments_total Total successful payments',
      '# TYPE finishthisidea_payments_total counter',
      `finishthisidea_payments_total ${paymentMetrics._count}`,
      '',
      '# HELP finishthisidea_revenue_total Total revenue in cents',
      '# TYPE finishthisidea_revenue_total counter',
      `finishthisidea_revenue_total ${paymentMetrics._sum.amount || 0}`,
      '',
      '# HELP finishthisidea_queue_jobs Number of jobs in queue by state',
      '# TYPE finishthisidea_queue_jobs gauge',
      `finishthisidea_queue_jobs{state="waiting"} ${queueMetrics.waiting}`,
      `finishthisidea_queue_jobs{state="active"} ${queueMetrics.active}`,
      `finishthisidea_queue_jobs{state="completed"} ${queueMetrics.completed}`,
      `finishthisidea_queue_jobs{state="failed"} ${queueMetrics.failed}`,
      '',
      '# HELP finishthisidea_process_uptime_seconds Process uptime in seconds',
      '# TYPE finishthisidea_process_uptime_seconds gauge',
      `finishthisidea_process_uptime_seconds ${process.uptime()}`,
      '',
      '# HELP finishthisidea_nodejs_memory_usage_bytes Memory usage in bytes',
      '# TYPE finishthisidea_nodejs_memory_usage_bytes gauge',
      `finishthisidea_nodejs_memory_usage_bytes ${process.memoryUsage().heapUsed}`,
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to generate metrics', { error });
    res.status(500).send('Failed to generate metrics');
  }
});

export { router as healthRouter };