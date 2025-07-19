"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringRouter = void 0;
const express_1 = __importDefault(require("express"));
const platform_logger_service_1 = require("../../services/monitoring/platform-logger.service");
const cleanup_memory_service_1 = require("../../services/memory/cleanup-memory.service");
const async_handler_1 = require("../../utils/async-handler");
const database_1 = require("../../utils/database");
const cleanup_queue_1 = require("../../jobs/cleanup.queue");
const ioredis_1 = __importDefault(require("ioredis"));
const router = express_1.default.Router();
exports.monitoringRouter = router;
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
router.get('/health', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const health = await platform_logger_service_1.platformLogger.getHealthStatus();
    const queueHealth = await cleanup_queue_1.cleanupQueue.getJobCounts();
    let dbHealth = 'healthy';
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
    }
    catch (error) {
        dbHealth = 'unhealthy';
    }
    let redisHealth = 'healthy';
    try {
        await redis.ping();
    }
    catch (error) {
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
router.get('/errors', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { timeRange = '24h' } = req.query;
    const analytics = await platform_logger_service_1.platformLogger.getErrorAnalytics(timeRange);
    res.json({
        success: true,
        data: analytics
    });
}));
router.get('/metrics', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { service, limit = 100 } = req.query;
    const metricsKey = service
        ? `platform:metrics:${service}`
        : 'platform:metrics:performance';
    const metrics = await redis.lrange(metricsKey, 0, parseInt(limit) - 1);
    const parsedMetrics = metrics.map(m => JSON.parse(m));
    const aggregates = {
        averageDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        totalOperations: parsedMetrics.length,
        operationsByType: {}
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
router.get('/insights/:userId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const insights = await cleanup_memory_service_1.cleanupMemory.getCleanupInsights(userId);
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
router.get('/queue', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const counts = await cleanup_queue_1.cleanupQueue.getJobCounts();
    const workers = await cleanup_queue_1.cleanupQueue.getWorkers();
    const completedJobs = await cleanup_queue_1.cleanupQueue.getCompleted(0, 10);
    const failedJobs = await cleanup_queue_1.cleanupQueue.getFailed(0, 10);
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
router.get('/alerts', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const alerts = [];
    const errorAnalytics = await platform_logger_service_1.platformLogger.getErrorAnalytics('1h');
    if (errorAnalytics.totalErrors > 50) {
        alerts.push({
            level: 'critical',
            type: 'high_error_rate',
            message: `High error rate detected: ${errorAnalytics.totalErrors} errors in the last hour`,
            timestamp: new Date().toISOString()
        });
    }
    const queueCounts = await cleanup_queue_1.cleanupQueue.getJobCounts();
    if (queueCounts.waiting > 100) {
        alerts.push({
            level: 'warning',
            type: 'queue_backlog',
            message: `Queue backlog detected: ${queueCounts.waiting} jobs waiting`,
            timestamp: new Date().toISOString()
        });
    }
    const health = await platform_logger_service_1.platformLogger.getHealthStatus();
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
//# sourceMappingURL=monitoring.route.js.map