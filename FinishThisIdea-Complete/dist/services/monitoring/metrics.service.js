"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = exports.metricsService = void 0;
const logger_1 = require("../../utils/logger");
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma = new client_1.PrismaClient();
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
class MetricsService {
    metrics = new Map();
    async recordMetric(name, value, labels) {
        try {
            const metric = {
                name,
                value,
                timestamp: new Date(),
                labels
            };
            if (!this.metrics.has(name)) {
                this.metrics.set(name, []);
            }
            this.metrics.get(name).push(metric);
            const metricArray = this.metrics.get(name);
            if (metricArray.length > 1000) {
                metricArray.splice(0, metricArray.length - 1000);
            }
            const key = `metrics:${name}`;
            await redis.zadd(key, Date.now(), JSON.stringify(metric));
            await redis.expire(key, 86400);
            logger_1.logger.debug('Metric recorded', { name, value, labels });
        }
        catch (error) {
            logger_1.logger.error('Failed to record metric', { error, name, value });
        }
    }
    async incrementCounter(name, labels) {
        await this.recordMetric(name, 1, labels);
    }
    async recordTiming(name, duration, labels) {
        await this.recordMetric(`${name}_duration`, duration, labels);
    }
    async getSystemMetrics() {
        try {
            const [totalRequests, successRequests, errorRequests, dbConnections, memoryUsage] = await Promise.all([
                this.getMetricSum('http_requests_total'),
                this.getMetricSum('http_requests_success'),
                this.getMetricSum('http_requests_error'),
                this.getCurrentValue('db_connections'),
                this.getMemoryUsage()
            ]);
            const cacheHits = await this.getMetricSum('cache_hits');
            const cacheMisses = await this.getMetricSum('cache_misses');
            const hitRate = cacheHits + cacheMisses > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0;
            return {
                requests: {
                    total: totalRequests,
                    success: successRequests,
                    errors: errorRequests,
                    rate: await this.getRequestRate()
                },
                database: {
                    connections: dbConnections,
                    queries: await this.getMetricSum('db_queries'),
                    avgQueryTime: await this.getAverageMetric('db_query_duration')
                },
                cache: {
                    hits: cacheHits,
                    misses: cacheMisses,
                    hitRate
                },
                memory: memoryUsage
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get system metrics', { error });
            return this.getDefaultMetrics();
        }
    }
    async getMetricHistory(name, hours = 24) {
        try {
            const key = `metrics:${name}`;
            const since = Date.now() - (hours * 60 * 60 * 1000);
            const results = await redis.zrangebyscore(key, since, '+inf');
            return results.map(result => JSON.parse(result));
        }
        catch (error) {
            logger_1.logger.error('Failed to get metric history', { error, name });
            return [];
        }
    }
    async getCurrentValue(name) {
        try {
            const key = `metrics:${name}`;
            const latest = await redis.zrevrange(key, 0, 0);
            if (latest.length > 0) {
                const metric = JSON.parse(latest[0]);
                return metric.value;
            }
            return 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to get current value', { error, name });
            return 0;
        }
    }
    async getMetricSum(name, hours = 1) {
        try {
            const history = await this.getMetricHistory(name, hours);
            return history.reduce((sum, metric) => sum + metric.value, 0);
        }
        catch (error) {
            logger_1.logger.error('Failed to get metric sum', { error, name });
            return 0;
        }
    }
    async getAverageMetric(name, hours = 1) {
        try {
            const history = await this.getMetricHistory(name, hours);
            if (history.length === 0)
                return 0;
            const sum = history.reduce((sum, metric) => sum + metric.value, 0);
            return sum / history.length;
        }
        catch (error) {
            logger_1.logger.error('Failed to get metric average', { error, name });
            return 0;
        }
    }
    async getRequestRate() {
        try {
            const history = await this.getMetricHistory('http_requests_total', 1);
            return history.length;
        }
        catch (error) {
            return 0;
        }
    }
    getMemoryUsage() {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;
        return {
            used: usedMemory,
            total: totalMemory,
            usage: (usedMemory / totalMemory) * 100
        };
    }
    getDefaultMetrics() {
        return {
            requests: { total: 0, success: 0, errors: 0, rate: 0 },
            database: { connections: 0, queries: 0, avgQueryTime: 0 },
            cache: { hits: 0, misses: 0, hitRate: 0 },
            memory: { used: 0, total: 0, usage: 0 }
        };
    }
    async cleanupOldMetrics() {
        try {
            const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const keys = await redis.keys('metrics:*');
            for (const key of keys) {
                await redis.zremrangebyscore(key, 0, cutoff);
            }
            logger_1.logger.info('Cleaned up old metrics', { keys: keys.length });
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup old metrics', { error });
        }
    }
    async exportPrometheusMetrics() {
        try {
            const metrics = await this.getSystemMetrics();
            const lines = [
                `# HELP http_requests_total Total HTTP requests`,
                `# TYPE http_requests_total counter`,
                `http_requests_total ${metrics.requests.total}`,
                ``,
                `# HELP http_requests_success Successful HTTP requests`,
                `# TYPE http_requests_success counter`,
                `http_requests_success ${metrics.requests.success}`,
                ``,
                `# HELP http_requests_error Failed HTTP requests`,
                `# TYPE http_requests_error counter`,
                `http_requests_error ${metrics.requests.errors}`,
                ``,
                `# HELP memory_usage_bytes Memory usage in bytes`,
                `# TYPE memory_usage_bytes gauge`,
                `memory_usage_bytes ${metrics.memory.used}`,
                ``,
                `# HELP cache_hit_rate Cache hit rate percentage`,
                `# TYPE cache_hit_rate gauge`,
                `cache_hit_rate ${metrics.cache.hitRate}`,
                ``
            ];
            return lines.join('\n');
        }
        catch (error) {
            logger_1.logger.error('Failed to export Prometheus metrics', { error });
            return '';
        }
    }
}
exports.metricsService = new MetricsService();
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    exports.metricsService.incrementCounter('http_requests_total', {
        method: req.method,
        path: req.path
    });
    res.on('finish', () => {
        const duration = Date.now() - start;
        exports.metricsService.recordTiming('http_request_duration', duration, {
            method: req.method,
            path: req.path,
            status: res.statusCode.toString()
        });
        if (res.statusCode >= 200 && res.statusCode < 400) {
            exports.metricsService.incrementCounter('http_requests_success', {
                method: req.method,
                path: req.path
            });
        }
        else {
            exports.metricsService.incrementCounter('http_requests_error', {
                method: req.method,
                path: req.path,
                status: res.statusCode.toString()
            });
        }
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
exports.default = exports.metricsService;
//# sourceMappingURL=metrics.service.js.map