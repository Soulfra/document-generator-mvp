/**
 * Prometheus Metrics API Route
 * Exposes metrics in Prometheus format
 */

import { Router, Request, Response } from 'express';
import { prometheusMetrics } from '../../services/monitoring/prometheus-metrics.service';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const metrics = await prometheusMetrics.getMetrics();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
    
    logger.debug('Metrics endpoint accessed', {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      metricsSize: metrics.length,
    });
    
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to retrieve metrics',
      },
    });
  }
});

/**
 * GET /metrics/health
 * Health check for metrics service
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const registry = prometheusMetrics.getRegistry();
    const metricNames = registry.getMetricsAsArray().map(metric => metric.name);
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        metricsCount: metricNames.length,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        metrics: {
          httpMetrics: metricNames.filter(name => name.startsWith('http_')).length,
          businessMetrics: metricNames.filter(name => name.startsWith('finishthisidea_')).length,
          systemMetrics: metricNames.filter(name => name.startsWith('process_') || name.startsWith('nodejs_')).length,
        },
      },
    });
    
  } catch (error) {
    logger.error('Metrics health check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_HEALTH_CHECK_FAILED',
        message: 'Metrics service health check failed',
      },
    });
  }
});

/**
 * GET /metrics/summary
 * Metrics summary for debugging
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const registry = prometheusMetrics.getRegistry();
    const metrics = registry.getMetricsAsArray();
    
    const summary = {
      totalMetrics: metrics.length,
      categories: {
        http: 0,
        business: 0,
        system: 0,
        custom: 0,
      },
      metrics: metrics.map(metric => ({
        name: metric.name,
        help: metric.help,
        type: metric.type,
        labelNames: (metric as any).labelNames || [],
        values: (metric as any).hashMap ? Object.keys((metric as any).hashMap).length : 1,
      })),
    };
    
    // Categorize metrics
    metrics.forEach(metric => {
      if (metric.name.startsWith('http_')) {
        summary.categories.http++;
      } else if (metric.name.startsWith('finishthisidea_')) {
        summary.categories.business++;
      } else if (metric.name.startsWith('process_') || metric.name.startsWith('nodejs_')) {
        summary.categories.system++;
      } else {
        summary.categories.custom++;
      }
    });
    
    res.json({
      success: true,
      data: summary,
    });
    
  } catch (error) {
    logger.error('Failed to get metrics summary:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_SUMMARY_FAILED',
        message: 'Failed to retrieve metrics summary',
      },
    });
  }
});

/**
 * POST /metrics/test
 * Test endpoint for triggering sample metrics (development only)
 */
router.post('/test', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Test endpoints not available in production',
      },
    });
  }
  
  try {
    // Generate some test metrics
    prometheusMetrics.recordJobCreated('PREMIUM');
    prometheusMetrics.recordJobCompleted('COMPLETED', 'FREE');
    prometheusMetrics.recordUpload('javascript', 'completed');
    prometheusMetrics.recordPayment('succeeded', 2500);
    prometheusMetrics.recordAiRequest('anthropic', 'claude-3', 'success');
    prometheusMetrics.recordQrCodeGenerated('referral');
    prometheusMetrics.recordSocialShare('twitter', 'achievement');
    prometheusMetrics.recordAchievementUnlocked('first_upload', 'FREE');
    
    res.json({
      success: true,
      message: 'Test metrics recorded successfully',
      data: {
        timestamp: new Date().toISOString(),
        metricsGenerated: 8,
      },
    });
    
  } catch (error) {
    logger.error('Failed to generate test metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TEST_METRICS_FAILED',
        message: 'Failed to generate test metrics',
      },
    });
  }
});

export { router as metricsRouter };