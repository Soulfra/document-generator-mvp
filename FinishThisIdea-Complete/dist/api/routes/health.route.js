"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const database_1 = require("../../config/database");
const cleanup_queue_1 = require("../../jobs/cleanup.queue");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../../config/redis");
const sentry_1 = require("../../config/sentry");
const env_validation_1 = require("../../utils/env-validation");
const error_handler_1 = require("../../utils/error-handler");
const os_1 = __importDefault(require("os"));
const package_json_1 = require("../../../package.json");
const router = (0, express_1.Router)();
exports.healthRouter = router;
const dbHealthBreaker = new error_handler_1.CircuitBreaker(3, 30000);
const redisHealthBreaker = new error_handler_1.CircuitBreaker(3, 30000);
const externalServiceBreaker = new error_handler_1.CircuitBreaker(5, 60000);
router.get('/', async (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        version: package_json_1.version,
    });
});
router.get('/detailed', async (req, res) => {
    const startTime = Date.now();
    const health = {
        status: 'healthy',
        timestamp: new Date(),
        version: package_json_1.version,
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
                load: os_1.default.loadavg(),
                cores: os_1.default.cpus().length,
            },
        },
    };
    try {
        const dbStart = Date.now();
        await dbHealthBreaker.execute(async () => {
            return await (0, database_1.checkDatabaseConnection)();
        }, 'database-health');
        health.services.database = {
            status: 'up',
            latency: Date.now() - dbStart,
        };
    }
    catch (error) {
        health.services.database = {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        health.status = 'unhealthy';
    }
    try {
        const redisStart = Date.now();
        const redisHealthy = await redisHealthBreaker.execute(async () => {
            return await (0, redis_1.checkRedisConnection)();
        }, 'redis-health');
        health.services.redis = {
            status: redisHealthy ? 'up' : 'down',
            latency: Date.now() - redisStart,
        };
        if (redisHealthy) {
            try {
                const [waiting, active, completed, failed] = await Promise.all([
                    cleanup_queue_1.cleanupQueue.getWaitingCount(),
                    cleanup_queue_1.cleanupQueue.getActiveCount(),
                    cleanup_queue_1.cleanupQueue.getCompletedCount(),
                    cleanup_queue_1.cleanupQueue.getFailedCount(),
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
                };
            }
            catch (queueError) {
                health.services.queue = {
                    status: 'degraded',
                    error: 'Queue metrics unavailable',
                };
            }
        }
        else {
            health.services.queue = {
                status: 'down',
                error: 'Redis connection failed',
            };
        }
    }
    catch (error) {
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
    try {
        const storageStart = Date.now();
        if (env_validation_1.env.S3_BUCKET && env_validation_1.env.AWS_ACCESS_KEY_ID) {
            health.services.storage = {
                status: 'up',
                latency: Date.now() - storageStart,
            };
        }
        else {
            health.services.storage = {
                status: 'degraded',
                error: 'S3 configuration missing or incomplete',
            };
            if (health.status === 'healthy') {
                health.status = 'degraded';
            }
        }
    }
    catch (error) {
        health.services.storage = {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        if (health.status === 'healthy') {
            health.status = 'degraded';
        }
    }
    try {
        if (env_validation_1.env.STRIPE_SECRET_KEY && env_validation_1.env.ENABLE_STRIPE) {
            health.services.stripe = {
                status: 'up',
            };
        }
        else if (env_validation_1.env.ENABLE_STRIPE && !env_validation_1.env.STRIPE_SECRET_KEY) {
            health.services.stripe = {
                status: 'degraded',
                error: 'Stripe enabled but configuration missing',
            };
            if (health.status === 'healthy') {
                health.status = 'degraded';
            }
        }
        else {
            health.services.stripe = {
                status: 'up',
                metadata: { enabled: false }
            };
        }
    }
    catch (error) {
        health.services.stripe = {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        if (health.status === 'healthy') {
            health.status = 'degraded';
        }
    }
    if (env_validation_1.env.ENABLE_OLLAMA && env_validation_1.env.OLLAMA_BASE_URL) {
        try {
            const ollamaStart = Date.now();
            const response = await externalServiceBreaker.execute(async () => {
                return await fetch(`${env_validation_1.env.OLLAMA_BASE_URL}/api/tags`, {
                    signal: AbortSignal.timeout(5000),
                });
            }, 'ollama-health');
            health.services.ollama = {
                status: response.ok ? 'up' : 'down',
                latency: Date.now() - ollamaStart,
            };
        }
        catch (error) {
            health.services.ollama = {
                status: 'down',
                error: error instanceof Error ? error.message : 'Connection failed',
            };
        }
    }
    else if (env_validation_1.env.ENABLE_OLLAMA) {
        health.services.ollama = {
            status: 'degraded',
            error: 'Ollama enabled but base URL not configured',
        };
    }
    const sentryHealth = (0, sentry_1.getSentryHealth)();
    health.services.sentry = {
        status: sentryHealth.configured ? 'up' : 'degraded',
        metadata: {
            configured: sentryHealth.configured,
            environment: sentryHealth.environment,
        },
    };
    const totalMem = os_1.default.totalmem();
    const freeMem = os_1.default.freemem();
    const usedMem = totalMem - freeMem;
    health.system.memory = {
        used: Math.round(usedMem / 1024 / 1024),
        total: Math.round(totalMem / 1024 / 1024),
        percentage: Math.round((usedMem / totalMem) * 100),
    };
    const totalLatency = Date.now() - startTime;
    const statusCode = health.status === 'healthy' ? 200 :
        health.status === 'degraded' ? 200 : 503;
    logger_1.logger.info('Health check completed', {
        status: health.status,
        latency: totalLatency,
        services: Object.entries(health.services).reduce((acc, [key, value]) => {
            acc[key] = value.status;
            return acc;
        }, {}),
    });
    res.status(statusCode).json(health);
});
router.get('/ready', async (req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        const queueReady = await cleanup_queue_1.cleanupQueue.isReady();
        if (!queueReady) {
            throw new Error('Queue not ready');
        }
        res.json({
            ready: true,
            timestamp: new Date(),
        });
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed', { error });
        res.status(503).json({
            ready: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
        });
    }
});
router.get('/live', (req, res) => {
    res.json({
        alive: true,
        timestamp: new Date(),
        pid: process.pid,
    });
});
router.get('/metrics', (0, error_handler_1.withErrorHandling)(async (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        let queueMetrics = {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0
        };
        try {
            const [waiting, active, completed, failed] = await Promise.all([
                cleanup_queue_1.cleanupQueue.getWaitingCount(),
                cleanup_queue_1.cleanupQueue.getActiveCount(),
                cleanup_queue_1.cleanupQueue.getCompletedCount(),
                cleanup_queue_1.cleanupQueue.getFailedCount(),
            ]);
            queueMetrics = { waiting, active, completed, failed };
        }
        catch (error) {
            logger_1.logger.warn('Failed to get queue metrics', { error });
        }
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
            `finishthisidea_app_version_info{version="${package_json_1.version}"} 1`,
        ].join('\n');
        res.set('Content-Type', 'text/plain; version=0.0.4');
        res.send(metrics);
    }
    catch (error) {
        logger_1.logger.error('Failed to generate metrics', { error });
        res.status(500).send('Failed to generate metrics');
    }
}, 'health-metrics', 10000));
//# sourceMappingURL=health.route.js.map