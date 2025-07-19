import { Router } from 'express';
import { prisma, checkDatabaseConnection } from '../../config/database';
import { cleanupQueue } from '../../jobs/cleanup.queue';
import { logger } from '../../utils/logger';
import { checkRedisConnection } from '../../config/redis';
import { getSentryHealth } from '../../config/sentry';
import { env } from '../../utils/env-validation';
import { withErrorHandling, CircuitBreaker } from '../../utils/error-handler';
import os from 'os';
import { version } from '../../../package.json';

const router = Router();

// Circuit breakers for health checks
const dbHealthBreaker = new CircuitBreaker(3, 30000);
const redisHealthBreaker = new CircuitBreaker(3, 30000);
const externalServiceBreaker = new CircuitBreaker(5, 60000);

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
    sentry: ServiceHealth;
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

  // Check database with circuit breaker
  try {
    const dbStart = Date.now();
    await dbHealthBreaker.execute(async () => {
      return await checkDatabaseConnection();
    }, 'database-health');
    
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

  // Check Redis with circuit breaker
  try {
    const redisStart = Date.now();
    const redisHealthy = await redisHealthBreaker.execute(async () => {
      return await checkRedisConnection();
    }, 'redis-health');
    
    health.services.redis = {
      status: redisHealthy ? 'up' : 'down',
      latency: Date.now() - redisStart,
    };
    
    // Also check queue processing if Redis is healthy
    if (redisHealthy) {
      try {
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
      } catch (queueError) {
        health.services.queue = {
          status: 'degraded',
          error: 'Queue metrics unavailable',
        };
      }
    } else {
      health.services.queue = {
        status: 'down',
        error: 'Redis connection failed',
      };
    }
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
    if (env.S3_BUCKET && env.AWS_ACCESS_KEY_ID) {
      health.services.storage = {
        status: 'up',
        latency: Date.now() - storageStart,
      };
    } else {
      health.services.storage = {
        status: 'degraded',
        error: 'S3 configuration missing or incomplete',
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
    if (env.STRIPE_SECRET_KEY && env.ENABLE_STRIPE) {
      health.services.stripe = {
        status: 'up',
      };
    } else if (env.ENABLE_STRIPE && !env.STRIPE_SECRET_KEY) {
      health.services.stripe = {
        status: 'degraded',
        error: 'Stripe enabled but configuration missing',
      };
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    } else {
      health.services.stripe = {
        status: 'up',
        metadata: { enabled: false }
      } as any;
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
  if (env.ENABLE_OLLAMA && env.OLLAMA_BASE_URL) {
    try {
      const ollamaStart = Date.now();
      const response = await externalServiceBreaker.execute(async () => {
        return await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
      }, 'ollama-health');
      
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
  } else if (env.ENABLE_OLLAMA) {
    health.services.ollama = {
      status: 'degraded',
      error: 'Ollama enabled but base URL not configured',
    };
  }

  // Check Sentry configuration
  const sentryHealth = getSentryHealth();
  health.services.sentry = {
    status: sentryHealth.configured ? 'up' : 'degraded',
    metadata: {
      configured: sentryHealth.configured,
      environment: sentryHealth.environment,
    },
  };

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
router.get('/metrics', withErrorHandling(async (req, res) => {
  try {
    // Gather basic system metrics that don't depend on Prisma models
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Try to get queue metrics if available
    let queueMetrics = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0
    };
    
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        cleanupQueue.getWaitingCount(),
        cleanupQueue.getActiveCount(),
        cleanupQueue.getCompletedCount(),
        cleanupQueue.getFailedCount(),
      ]);
      queueMetrics = { waiting, active, completed, failed };
    } catch (error) {
      logger.warn('Failed to get queue metrics', { error });
    }

    // Format as Prometheus metrics
    const metrics = [
      '# HELP finishthisidea_process_uptime_seconds Process uptime in seconds',
      '# TYPE finishthisidea_process_uptime_seconds gauge',
      `finishthisidea_process_uptime_seconds ${process.uptime()}`,
      '',
      '# HELP finishthisidea_nodejs_memory_usage_bytes Memory usage in bytes',
      '# TYPE finishthisidea_nodejs_memory_usage_bytes gauge',
      `finishthisidea_nodejs_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`,
      `finishthisidea_nodejs_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`,
      `finishthisidea_nodejs_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      `finishthisidea_nodejs_memory_usage_bytes{type="external"} ${memUsage.external}`,
      '',
      '# HELP finishthisidea_nodejs_cpu_usage_microseconds CPU usage in microseconds',
      '# TYPE finishthisidea_nodejs_cpu_usage_microseconds counter',
      `finishthisidea_nodejs_cpu_usage_microseconds{type="user"} ${cpuUsage.user}`,
      `finishthisidea_nodejs_cpu_usage_microseconds{type="system"} ${cpuUsage.system}`,
      '',
      '# HELP finishthisidea_queue_jobs Number of jobs in queue by state',
      '# TYPE finishthisidea_queue_jobs gauge',
      `finishthisidea_queue_jobs{state="waiting"} ${queueMetrics.waiting}`,
      `finishthisidea_queue_jobs{state="active"} ${queueMetrics.active}`,
      `finishthisidea_queue_jobs{state="completed"} ${queueMetrics.completed}`,
      `finishthisidea_queue_jobs{state="failed"} ${queueMetrics.failed}`,
      '',
      '# HELP finishthisidea_nodejs_version_info Node.js version information',
      '# TYPE finishthisidea_nodejs_version_info gauge',
      `finishthisidea_nodejs_version_info{version="${process.version}"} 1`,
      '',
      '# HELP finishthisidea_app_version_info Application version information', 
      '# TYPE finishthisidea_app_version_info gauge',
      `finishthisidea_app_version_info{version="${version}"} 1`,
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to generate metrics', { error });
    res.status(500).send('Failed to generate metrics');
  }
}, 'health-metrics', 10000));

export { router as healthRouter };