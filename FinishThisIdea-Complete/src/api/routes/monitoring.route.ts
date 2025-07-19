import express from 'express';
import { platformLogger } from '../../services/monitoring/platform-logger.service';
import { cleanupMemory } from '../../services/memory/cleanup-memory.service';
import { asyncHandler } from '../../utils/async-handler';
import { prisma } from '../../utils/database';
import { cleanupQueue } from '../../jobs/cleanup.queue';
import Redis from 'ioredis';

const router = express.Router();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// System health endpoint
router.get('/health', asyncHandler(async (req, res) => {
  const health = await platformLogger.getHealthStatus();
  
  // Add queue health
  const queueHealth = await cleanupQueue.getJobCounts();
  
  // Add database health
  let dbHealth = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbHealth = 'unhealthy';
  }
  
  // Add Redis health
  let redisHealth = 'healthy';
  try {
    await redis.ping();
  } catch (error) {
    redisHealth = 'unhealthy';
  }

  const overallStatus = {
    status: health.status === 'healthy' && dbHealth === 'healthy' && redisHealth === 'healthy' 
      ? 'healthy' 
      : 'degraded',
    timestamp: health.timestamp,
    services: {
      platform: health,
      database: dbHealth,
      redis: redisHealth,
      queue: {
        waiting: queueHealth.waiting,
        active: queueHealth.active,
        completed: queueHealth.completed,
        failed: queueHealth.failed
      }
    },
    uptime: health.resources.uptime,
    version: process.env.npm_package_version || '1.0.0'
  };

  const statusCode = overallStatus.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    success: true,
    data: overallStatus
  });
}));

// Error analytics endpoint
router.get('/errors', asyncHandler(async (req, res) => {
  const { timeRange = '24h' } = req.query;
  
  const analytics = await platformLogger.getErrorAnalytics(timeRange as string);
  
  res.json({
    success: true,
    data: analytics
  });
}));

// Performance metrics endpoint
router.get('/metrics', asyncHandler(async (req, res) => {
  const { service, limit = 100 } = req.query;
  
  const metricsKey = service 
    ? `platform:metrics:${service}` 
    : 'platform:metrics:performance';
    
  const metrics = await redis.lrange(metricsKey, 0, parseInt(limit as string) - 1);
  
  const parsedMetrics = metrics.map(m => JSON.parse(m));
  
  // Calculate aggregates
  const aggregates = {
    averageDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
    totalOperations: parsedMetrics.length,
    operationsByType: {} as Record<string, number>
  };
  
  parsedMetrics.forEach(metric => {
    aggregates.averageDuration += metric.duration;
    aggregates.maxDuration = Math.max(aggregates.maxDuration, metric.duration);
    aggregates.minDuration = Math.min(aggregates.minDuration, metric.duration);
    
    aggregates.operationsByType[metric.operation] = 
      (aggregates.operationsByType[metric.operation] || 0) + 1;
  });
  
  if (parsedMetrics.length > 0) {
    aggregates.averageDuration /= parsedMetrics.length;
  }
  
  res.json({
    success: true,
    data: {
      metrics: parsedMetrics,
      aggregates
    }
  });
}));

// User insights endpoint
router.get('/insights/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const insights = await cleanupMemory.getCleanupInsights(userId);
  
  if (!insights) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NO_INSIGHTS',
        message: 'No insights available for this user'
      }
    });
  }
  
  res.json({
    success: true,
    data: insights
  });
}));

// Real-time monitoring WebSocket endpoint info
router.get('/websocket-info', (req, res) => {
  res.json({
    success: true,
    data: {
      endpoint: '/ws/monitoring',
      channels: [
        'errors:stream',
        'metrics:stream',
        'queue:updates',
        'system:alerts'
      ],
      authentication: 'Bearer token required'
    }
  });
});

// Queue monitoring endpoint
router.get('/queue', asyncHandler(async (req, res) => {
  const counts = await cleanupQueue.getJobCounts();
  const workers = await cleanupQueue.getWorkers();
  
  // Get recent completed jobs
  const completedJobs = await cleanupQueue.getCompleted(0, 10);
  const failedJobs = await cleanupQueue.getFailed(0, 10);
  
  res.json({
    success: true,
    data: {
      counts,
      workers: workers.length,
      recentCompleted: completedJobs.map(job => ({
        id: job.id,
        data: job.data,
        completedAt: new Date(job.finishedOn || 0),
        processingTime: (job.finishedOn || 0) - (job.processedOn || 0)
      })),
      recentFailed: failedJobs.map(job => ({
        id: job.id,
        data: job.data,
        failedAt: new Date(job.finishedOn || 0),
        error: job.failedReason,
        attemptsMade: job.attemptsMade
      }))
    }
  });
}));

// System alerts endpoint
router.get('/alerts', asyncHandler(async (req, res) => {
  const alerts = [];
  
  // Check for high error rate
  const errorAnalytics = await platformLogger.getErrorAnalytics('1h');
  if (errorAnalytics.totalErrors > 50) {
    alerts.push({
      level: 'critical',
      type: 'high_error_rate',
      message: `High error rate detected: ${errorAnalytics.totalErrors} errors in the last hour`,
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for queue backlog
  const queueCounts = await cleanupQueue.getJobCounts();
  if (queueCounts.waiting > 100) {
    alerts.push({
      level: 'warning',
      type: 'queue_backlog',
      message: `Queue backlog detected: ${queueCounts.waiting} jobs waiting`,
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for memory usage
  const health = await platformLogger.getHealthStatus();
  if (health.resources.memory.percentage > 80) {
    alerts.push({
      level: 'warning',
      type: 'high_memory_usage',
      message: `High memory usage: ${health.resources.memory.percentage}%`,
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    data: {
      alerts,
      count: alerts.length,
      hasAlerts: alerts.length > 0
    }
  });
}));

export { router as monitoringRouter };