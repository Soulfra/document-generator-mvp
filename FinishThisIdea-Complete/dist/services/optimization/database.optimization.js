"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseOptimization = exports.DatabaseOptimizationService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const cache_service_1 = require("../cache/cache.service");
const performance_service_1 = require("../performance/performance.service");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
class DatabaseOptimizationService {
    prisma;
    slowQueryThreshold = 1000;
    slowQueries = [];
    queryStats = new Map();
    constructor(prisma) {
        this.prisma = prisma;
        this.setupQueryMonitoring();
    }
    setupQueryMonitoring() {
        this.prisma.$on('query', (e) => {
            const duration = e.duration;
            const query = e.query;
            prometheus_metrics_service_1.prometheusMetrics.databaseQueryDuration.observe({ query: this.sanitizeQuery(query) }, duration);
            if (duration > this.slowQueryThreshold) {
                this.slowQueries.push({
                    query: this.sanitizeQuery(query),
                    duration,
                    timestamp: new Date()
                });
                if (this.slowQueries.length > 100) {
                    this.slowQueries = this.slowQueries.slice(-100);
                }
                logger_1.logger.warn('Slow query detected', {
                    query: this.sanitizeQuery(query),
                    duration: `${duration}ms`,
                    threshold: `${this.slowQueryThreshold}ms`
                });
            }
            const queryKey = this.sanitizeQuery(query);
            const stats = this.queryStats.get(queryKey) || { count: 0, totalTime: 0, avgTime: 0 };
            stats.count++;
            stats.totalTime += duration;
            stats.avgTime = stats.totalTime / stats.count;
            this.queryStats.set(queryKey, stats);
        });
    }
    sanitizeQuery(query) {
        return query
            .replace(/\$\d+/g, '$?')
            .replace(/\d+/g, '?')
            .replace(/'[^']*'/g, '?')
            .substring(0, 100);
    }
    async optimizedFindMany(model, args = {}, options = {}) {
        const cacheKey = `findMany:${model}:${JSON.stringify(args)}`;
        const config = {
            cache: options.cache ?? true,
            cacheTtl: options.cacheTtl ?? 300,
            maxRetries: options.maxRetries ?? 3,
            timeout: options.timeout ?? 10000,
            batchSize: options.batchSize ?? 1000,
            ...options
        };
        if (config.cache) {
            const cached = await cache_service_1.dbCache.get(cacheKey);
            if (cached) {
                prometheus_metrics_service_1.prometheusMetrics.cacheHits.inc({ cache: 'database' });
                return cached;
            }
            prometheus_metrics_service_1.prometheusMetrics.cacheMisses.inc({ cache: 'database' });
        }
        return performance_service_1.performanceService.measureAsync(`db:findMany:${model}`, async () => {
            try {
                if (!args.take && !args.skip) {
                    args.take = config.batchSize;
                }
                const result = await this.executeWithTimeout(() => this.prisma[model].findMany(args), config.timeout);
                if (config.cache && result) {
                    await cache_service_1.dbCache.set(cacheKey, result, {
                        ttl: config.cacheTtl,
                        tags: [`model:${model}`]
                    });
                }
                return result;
            }
            catch (error) {
                logger_1.logger.error('Optimized findMany failed', { model, args, error });
                prometheus_metrics_service_1.prometheusMetrics.databaseErrors.inc({ operation: 'findMany', model });
                throw error;
            }
        });
    }
    async optimizedFindUnique(model, args, options = {}) {
        const cacheKey = `findUnique:${model}:${JSON.stringify(args)}`;
        const config = {
            cache: options.cache ?? true,
            cacheTtl: options.cacheTtl ?? 600,
            ...options
        };
        if (config.cache) {
            const cached = await cache_service_1.dbCache.get(cacheKey);
            if (cached) {
                prometheus_metrics_service_1.prometheusMetrics.cacheHits.inc({ cache: 'database' });
                return cached;
            }
            prometheus_metrics_service_1.prometheusMetrics.cacheMisses.inc({ cache: 'database' });
        }
        return performance_service_1.performanceService.measureAsync(`db:findUnique:${model}`, async () => {
            try {
                const result = await this.executeWithTimeout(() => this.prisma[model].findUnique(args), config.timeout || 5000);
                if (config.cache && result) {
                    await cache_service_1.dbCache.set(cacheKey, result, {
                        ttl: config.cacheTtl,
                        tags: [`model:${model}`, `record:${model}:${JSON.stringify(args.where)}`]
                    });
                }
                return result;
            }
            catch (error) {
                logger_1.logger.error('Optimized findUnique failed', { model, args, error });
                prometheus_metrics_service_1.prometheusMetrics.databaseErrors.inc({ operation: 'findUnique', model });
                throw error;
            }
        });
    }
    async batchCreate(model, data, options = {}) {
        const config = {
            batchSize: options.batchSize ?? 100,
            maxRetries: options.maxRetries ?? 3,
            ...options
        };
        return performance_service_1.performanceService.measureAsync(`db:batchCreate:${model}`, async () => {
            const results = [];
            try {
                for (let i = 0; i < data.length; i += config.batchSize) {
                    const batch = data.slice(i, i + config.batchSize);
                    const batchResult = await this.executeWithRetry(() => this.prisma[model].createMany({
                        data: batch,
                        skipDuplicates: true
                    }), config.maxRetries);
                    results.push(...batchResult);
                    await cache_service_1.dbCache.invalidateByTag(`model:${model}`);
                }
                return results;
            }
            catch (error) {
                logger_1.logger.error('Batch create failed', { model, batchCount: data.length, error });
                prometheus_metrics_service_1.prometheusMetrics.databaseErrors.inc({ operation: 'batchCreate', model });
                throw error;
            }
        });
    }
    async optimizedAggregate(model, args, options = {}) {
        const cacheKey = `aggregate:${model}:${JSON.stringify(args)}`;
        const config = {
            cache: options.cache ?? true,
            cacheTtl: options.cacheTtl ?? 180,
            ...options
        };
        if (config.cache) {
            const cached = await cache_service_1.dbCache.get(cacheKey);
            if (cached) {
                prometheus_metrics_service_1.prometheusMetrics.cacheHits.inc({ cache: 'database' });
                return cached;
            }
            prometheus_metrics_service_1.prometheusMetrics.cacheMisses.inc({ cache: 'database' });
        }
        return performance_service_1.performanceService.measureAsync(`db:aggregate:${model}`, async () => {
            try {
                const result = await this.executeWithTimeout(() => this.prisma[model].aggregate(args), config.timeout || 15000);
                if (config.cache && result) {
                    await cache_service_1.dbCache.set(cacheKey, result, {
                        ttl: config.cacheTtl,
                        tags: [`model:${model}`, 'aggregation']
                    });
                }
                return result;
            }
            catch (error) {
                logger_1.logger.error('Optimized aggregate failed', { model, args, error });
                prometheus_metrics_service_1.prometheusMetrics.databaseErrors.inc({ operation: 'aggregate', model });
                throw error;
            }
        });
    }
    async optimizedTransaction(fn, options = {}) {
        const config = {
            maxRetries: options.maxRetries ?? 3,
            timeout: options.timeout ?? 30000,
            ...options
        };
        return performance_service_1.performanceService.measureAsync('db:transaction', async () => {
            return this.executeWithRetry(() => this.prisma.$transaction(fn, {
                timeout: config.timeout,
                isolationLevel: 'ReadCommitted'
            }), config.maxRetries);
        });
    }
    async executeWithTimeout(query, timeout) {
        return Promise.race([
            query(),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout);
            })
        ]);
    }
    async executeWithRetry(operation, maxRetries) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (this.isNonRetryableError(error)) {
                    throw error;
                }
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    logger_1.logger.warn(`Database operation failed, retrying in ${delay}ms`, {
                        attempt,
                        maxRetries,
                        error: error instanceof Error ? error.message : error
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
    isNonRetryableError(error) {
        const nonRetryableErrors = [
            'P2002',
            'P2003',
            'P2025',
            'P2016',
        ];
        return nonRetryableErrors.some(code => error.code === code || error.message?.includes(code));
    }
    async invalidateModelCache(model) {
        await cache_service_1.dbCache.invalidateByTag(`model:${model}`);
        logger_1.logger.info('Model cache invalidated', { model });
    }
    getPerformanceMetrics() {
        const totalQueries = Array.from(this.queryStats.values()).reduce((sum, stats) => sum + stats.count, 0);
        const totalTime = Array.from(this.queryStats.values()).reduce((sum, stats) => sum + stats.totalTime, 0);
        const avgQueryTime = totalQueries > 0 ? totalTime / totalQueries : 0;
        return {
            queryCount: totalQueries,
            avgQueryTime: Math.round(avgQueryTime * 100) / 100,
            slowQueries: this.slowQueries.slice(-10),
            cacheHitRate: 0,
            connectionPoolStats: {
                active: 0,
                idle: 0,
                total: 0
            }
        };
    }
    async optimizeQueryPlan(model, query) {
        const recommendations = [];
        if (query.where && !query.orderBy) {
            recommendations.push('Consider adding an index for the WHERE clause columns');
        }
        if (query.include && !query.select) {
            recommendations.push('Consider using select to limit the fields returned');
        }
        if (!query.take && !query.skip) {
            recommendations.push('Consider adding pagination (take/skip) for large result sets');
        }
        if (query.include && Object.keys(query.include).length > 3) {
            recommendations.push('Complex joins detected - consider breaking into multiple queries');
        }
        return recommendations;
    }
    async healthCheck() {
        try {
            const startTime = Date.now();
            await this.prisma.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - startTime;
            const metrics = this.getPerformanceMetrics();
            const recommendations = [];
            let status = 'healthy';
            if (responseTime > 100) {
                status = 'degraded';
                recommendations.push('Database response time is elevated');
            }
            if (metrics.slowQueries.length > 5) {
                status = 'degraded';
                recommendations.push('Multiple slow queries detected');
            }
            if (responseTime > 1000) {
                status = 'unhealthy';
                recommendations.push('Database response time is critically high');
            }
            return { status, metrics, recommendations };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed', { error });
            return {
                status: 'unhealthy',
                metrics: this.getPerformanceMetrics(),
                recommendations: ['Database connection failed']
            };
        }
    }
}
exports.DatabaseOptimizationService = DatabaseOptimizationService;
exports.databaseOptimization = new DatabaseOptimizationService(new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
}));
//# sourceMappingURL=database.optimization.js.map