import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { performanceService } from '../../services/performance/performance.service';
import { cacheService, apiCache, dbCache, fileCache } from '../../services/cache/cache.service';
import { databaseOptimization } from '../../services/optimization/database.optimization';
import { prometheusMetrics } from '../../services/monitoring/prometheus-metrics.service';
import { logger } from '../../utils/logger';

const router = Router();

// Get comprehensive performance overview
router.get('/overview',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const timeframe = parseInt(req.query.timeframe as string) || 300000; // 5 minutes default
      
      const performanceStats = performanceService.getStats(timeframe);
      const cacheStats = {
        main: cacheService.getStats(),
        api: apiCache.getStats(),
        database: dbCache.getStats(),
        file: fileCache.getStats()
      };
      const dbHealth = await databaseOptimization.healthCheck();
      const recommendations = performanceService.getRecommendations();

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
    } catch (error) {
      logger.error('Failed to get performance overview', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance overview'
      });
    }
  }
);

// Get detailed performance metrics
router.get('/metrics',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const timeframe = parseInt(req.query.timeframe as string) || 300000;
      const includeHistory = req.query.history === 'true';
      
      const stats = performanceService.getStats(timeframe);
      const dbMetrics = databaseOptimization.getPerformanceMetrics();
      
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
            main: cacheService.getStats().memory.hitRate,
            api: apiCache.getStats().memory.hitRate,
            database: dbCache.getStats().memory.hitRate,
            file: fileCache.getStats().memory.hitRate
          }
        }
      };

      if (includeHistory) {
        (metrics as any).history = stats.recent;
      }

      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Failed to get performance metrics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics'
      });
    }
  }
);

// Performance recommendations
router.get('/recommendations',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const systemRecommendations = performanceService.getRecommendations();
      const dbHealth = await databaseOptimization.healthCheck();
      const cacheStats = cacheService.getStats();
      
      const recommendations = {
        system: systemRecommendations,
        database: dbHealth.recommendations,
        cache: [],
        priority: 'medium' as const
      };

      // Add cache-specific recommendations
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
    } catch (error) {
      logger.error('Failed to get performance recommendations', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recommendations'
      });
    }
  }
);

// Cache management endpoints
router.get('/cache/stats',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const stats = {
        main: cacheService.getStats(),
        api: apiCache.getStats(),
        database: dbCache.getStats(),
        file: fileCache.getStats(),
        summary: {
          totalKeys: 0,
          totalHits: 0,
          totalMisses: 0,
          overallHitRate: 0
        }
      };

      // Calculate summary
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
    } catch (error) {
      logger.error('Failed to get cache stats', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cache statistics'
      });
    }
  }
);

router.post('/cache/clear',
  authenticate(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { type } = req.body;
      
      switch (type) {
        case 'all':
          await Promise.all([
            cacheService.clear(),
            apiCache.clear(),
            dbCache.clear(),
            fileCache.clear()
          ]);
          break;
        case 'api':
          await apiCache.clear();
          break;
        case 'database':
          await dbCache.clear();
          break;
        case 'file':
          await fileCache.clear();
          break;
        default:
          await cacheService.clear();
      }

      logger.info('Cache cleared', { type, userId: req.user!.id });

      res.status(200).json({
        success: true,
        message: `${type || 'main'} cache cleared successfully`
      });
    } catch (error) {
      logger.error('Failed to clear cache', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  }
);

router.post('/cache/invalidate',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
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
          cacheService.invalidateByPattern(pattern),
          apiCache.invalidateByPattern(pattern),
          dbCache.invalidateByPattern(pattern),
          fileCache.invalidateByPattern(pattern)
        ]);
        invalidatedCount = counts.reduce((sum, count) => sum + count, 0);
      } else if (tag) {
        const counts = await Promise.all([
          cacheService.invalidateByTag(tag),
          apiCache.invalidateByTag(tag),
          dbCache.invalidateByTag(tag),
          fileCache.invalidateByTag(tag)
        ]);
        invalidatedCount = counts.reduce((sum, count) => sum + count, 0);
      }

      logger.info('Cache invalidated', { pattern, tag, invalidatedCount, userId: req.user!.id });

      res.status(200).json({
        success: true,
        data: {
          invalidatedCount,
          pattern,
          tag
        }
      });
    } catch (error) {
      logger.error('Failed to invalidate cache', error);
      res.status(500).json({
        success: false,
        error: 'Failed to invalidate cache'
      });
    }
  }
);

// Database optimization endpoints
router.get('/database/health',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const health = await databaseOptimization.healthCheck();
      
      res.status(200).json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Failed to get database health', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve database health'
      });
    }
  }
);

router.post('/database/invalidate-cache',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const { model } = req.body;
      
      if (!model) {
        return res.status(400).json({
          success: false,
          error: 'Model name is required'
        });
      }

      await databaseOptimization.invalidateModelCache(model);

      res.status(200).json({
        success: true,
        message: `Cache invalidated for model: ${model}`
      });
    } catch (error) {
      logger.error('Failed to invalidate model cache', error);
      res.status(500).json({
        success: false,
        error: 'Failed to invalidate model cache'
      });
    }
  }
);

// Performance profiling
router.post('/profile/start',
  authenticate(['admin']),
  async (req: Request, res: Response) => {
    try {
      const duration = parseInt(req.body.duration) || 60000; // 1 minute default
      
      // Start profiling (this is a simplified version)
      performanceService.startProfiling(duration);
      
      res.status(200).json({
        success: true,
        message: `Performance profiling started for ${duration}ms`
      });
    } catch (error) {
      logger.error('Failed to start profiling', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start performance profiling'
      });
    }
  }
);

// System information
router.get('/system',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
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
    } catch (error) {
      logger.error('Failed to get system info', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system information'
      });
    }
  }
);

// Health check endpoint
router.get('/health',
  async (req: Request, res: Response) => {
    try {
      const stats = performanceService.getStats(60000); // Last minute
      const dbHealth = await databaseOptimization.healthCheck();
      
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
    } catch (error) {
      logger.error('Performance health check failed', error);
      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          error: 'Health check failed'
        }
      });
    }
  }
);

export { router as performanceRouter };