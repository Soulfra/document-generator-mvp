"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const performance_service_1 = require("../../services/performance/performance.service");
const cache_service_1 = require("../../services/cache/cache.service");
const database_optimization_1 = require("../../services/optimization/database.optimization");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
exports.performanceRouter = router;
router.get('/overview', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const timeframe = parseInt(req.query.timeframe) || 300000;
        const performanceStats = performance_service_1.performanceService.getStats(timeframe);
        const cacheStats = {
            main: cache_service_1.cacheService.getStats(),
            api: cache_service_1.apiCache.getStats(),
            database: cache_service_1.dbCache.getStats(),
            file: cache_service_1.fileCache.getStats()
        };
        const dbHealth = await database_optimization_1.databaseOptimization.healthCheck();
        const recommendations = performance_service_1.performanceService.getRecommendations();
        const overview = {
            system: {
                status: dbHealth.status,
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            performance: performanceStats,
            cache: cacheStats,
            database: dbHealth,
            recommendations,
            timestamp: new Date()
        };
        res.status(200).json({
            success: true,
            data: overview
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get performance overview', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve performance overview'
        });
    }
});
router.get('/metrics', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const timeframe = parseInt(req.query.timeframe) || 300000;
        const includeHistory = req.query.history === 'true';
        const stats = performance_service_1.performanceService.getStats(timeframe);
        const dbMetrics = database_optimization_1.databaseOptimization.getPerformanceMetrics();
        const metrics = {
            response: {
                average: stats.summary.avgResponseTime,
                max: stats.summary.maxResponseTime,
                trend: stats.trends.responseTrend
            },
            memory: {
                current: process.memoryUsage(),
                average: stats.summary.avgMemoryUsage,
                max: stats.summary.maxMemoryUsage,
                trend: stats.trends.memoryTrend
            },
            cpu: {
                average: stats.summary.avgCpuUsage,
                usage: process.cpuUsage()
            },
            eventLoop: {
                average: stats.summary.avgEventLoopDelay
            },
            database: dbMetrics,
            cache: {
                hitRates: {
                    main: cache_service_1.cacheService.getStats().memory.hitRate,
                    api: cache_service_1.apiCache.getStats().memory.hitRate,
                    database: cache_service_1.dbCache.getStats().memory.hitRate,
                    file: cache_service_1.fileCache.getStats().memory.hitRate
                }
            }
        };
        if (includeHistory) {
            metrics.history = stats.recent;
        }
        res.status(200).json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get performance metrics', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve performance metrics'
        });
    }
});
router.get('/recommendations', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const systemRecommendations = performance_service_1.performanceService.getRecommendations();
        const dbHealth = await database_optimization_1.databaseOptimization.healthCheck();
        const cacheStats = cache_service_1.cacheService.getStats();
        const recommendations = {
            system: systemRecommendations,
            database: dbHealth.recommendations,
            cache: [],
            priority: 'medium'
        };
        if (cacheStats.memory.hitRate < 70) {
            recommendations.cache.push('Cache hit rate is low - consider optimizing cache keys and TTL');
            recommendations.priority = 'high';
        }
        if (cacheStats.memory.keys > 10000) {
            recommendations.cache.push('High number of cached items - consider cache cleanup');
        }
        res.status(200).json({
            success: true,
            data: recommendations
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get performance recommendations', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve recommendations'
        });
    }
});
router.get('/cache/stats', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const stats = {
            main: cache_service_1.cacheService.getStats(),
            api: cache_service_1.apiCache.getStats(),
            database: cache_service_1.dbCache.getStats(),
            file: cache_service_1.fileCache.getStats(),
            summary: {
                totalKeys: 0,
                totalHits: 0,
                totalMisses: 0,
                overallHitRate: 0
            }
        };
        const caches = [stats.main, stats.api, stats.database, stats.file];
        stats.summary.totalKeys = caches.reduce((sum, cache) => sum + cache.memory.keys, 0);
        stats.summary.totalHits = caches.reduce((sum, cache) => sum + cache.memory.hits, 0);
        stats.summary.totalMisses = caches.reduce((sum, cache) => sum + cache.memory.misses, 0);
        const totalRequests = stats.summary.totalHits + stats.summary.totalMisses;
        stats.summary.overallHitRate = totalRequests > 0
            ? (stats.summary.totalHits / totalRequests) * 100
            : 0;
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get cache stats', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve cache statistics'
        });
    }
});
router.post('/cache/clear', (0, auth_middleware_1.authenticate)(['admin']), async (req, res) => {
    try {
        const { type } = req.body;
        switch (type) {
            case 'all':
                await Promise.all([
                    cache_service_1.cacheService.clear(),
                    cache_service_1.apiCache.clear(),
                    cache_service_1.dbCache.clear(),
                    cache_service_1.fileCache.clear()
                ]);
                break;
            case 'api':
                await cache_service_1.apiCache.clear();
                break;
            case 'database':
                await cache_service_1.dbCache.clear();
                break;
            case 'file':
                await cache_service_1.fileCache.clear();
                break;
            default:
                await cache_service_1.cacheService.clear();
        }
        logger_1.logger.info('Cache cleared', { type, userId: req.user.id });
        res.status(200).json({
            success: true,
            message: `${type || 'main'} cache cleared successfully`
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to clear cache', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cache'
        });
    }
});
router.post('/cache/invalidate', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const { pattern, tag } = req.body;
        if (!pattern && !tag) {
            return res.status(400).json({
                success: false,
                error: 'Either pattern or tag must be provided'
            });
        }
        let invalidatedCount = 0;
        if (pattern) {
            const counts = await Promise.all([
                cache_service_1.cacheService.invalidateByPattern(pattern),
                cache_service_1.apiCache.invalidateByPattern(pattern),
                cache_service_1.dbCache.invalidateByPattern(pattern),
                cache_service_1.fileCache.invalidateByPattern(pattern)
            ]);
            invalidatedCount = counts.reduce((sum, count) => sum + count, 0);
        }
        else if (tag) {
            const counts = await Promise.all([
                cache_service_1.cacheService.invalidateByTag(tag),
                cache_service_1.apiCache.invalidateByTag(tag),
                cache_service_1.dbCache.invalidateByTag(tag),
                cache_service_1.fileCache.invalidateByTag(tag)
            ]);
            invalidatedCount = counts.reduce((sum, count) => sum + count, 0);
        }
        logger_1.logger.info('Cache invalidated', { pattern, tag, invalidatedCount, userId: req.user.id });
        res.status(200).json({
            success: true,
            data: {
                invalidatedCount,
                pattern,
                tag
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to invalidate cache', error);
        res.status(500).json({
            success: false,
            error: 'Failed to invalidate cache'
        });
    }
});
router.get('/database/health', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const health = await database_optimization_1.databaseOptimization.healthCheck();
        res.status(200).json({
            success: true,
            data: health
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get database health', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve database health'
        });
    }
});
router.post('/database/invalidate-cache', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const { model } = req.body;
        if (!model) {
            return res.status(400).json({
                success: false,
                error: 'Model name is required'
            });
        }
        await database_optimization_1.databaseOptimization.invalidateModelCache(model);
        res.status(200).json({
            success: true,
            message: `Cache invalidated for model: ${model}`
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to invalidate model cache', error);
        res.status(500).json({
            success: false,
            error: 'Failed to invalidate model cache'
        });
    }
});
router.post('/profile/start', (0, auth_middleware_1.authenticate)(['admin']), async (req, res) => {
    try {
        const duration = parseInt(req.body.duration) || 60000;
        performance_service_1.performanceService.startProfiling(duration);
        res.status(200).json({
            success: true,
            message: `Performance profiling started for ${duration}ms`
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start profiling', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start performance profiling'
        });
    }
});
router.get('/system', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const systemInfo = {
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                version: process.version,
                platform: process.platform,
                arch: process.arch
            },
            memory: {
                ...memoryUsage,
                usage: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
                }
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            env: {
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        res.status(200).json({
            success: true,
            data: systemInfo
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get system info', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system information'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const stats = performance_service_1.performanceService.getStats(60000);
        const dbHealth = await database_optimization_1.databaseOptimization.healthCheck();
        const status = dbHealth.status === 'healthy' &&
            stats.summary.avgResponseTime < 1000 &&
            stats.summary.avgMemoryUsage < 512 * 1024 * 1024
            ? 'healthy' : 'degraded';
        res.status(status === 'healthy' ? 200 : 503).json({
            success: true,
            data: {
                status,
                timestamp: new Date(),
                uptime: process.uptime(),
                database: dbHealth.status,
                performance: {
                    responseTime: stats.summary.avgResponseTime,
                    memoryUsage: stats.summary.avgMemoryUsage,
                    eventLoopDelay: stats.summary.avgEventLoopDelay
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Performance health check failed', error);
        res.status(503).json({
            success: false,
            data: {
                status: 'unhealthy',
                error: 'Health check failed'
            }
        });
    }
});
//# sourceMappingURL=performance.route.js.map