"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRouter = void 0;
const express_1 = require("express");
const prometheus_metrics_service_1 = require("../../services/monitoring/prometheus-metrics.service");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
exports.metricsRouter = router;
router.get('/', async (req, res) => {
    try {
        const metrics = await prometheus_metrics_service_1.prometheusMetrics.getMetrics();
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics);
        logger_1.logger.debug('Metrics endpoint accessed', {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            metricsSize: metrics.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get metrics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'METRICS_ERROR',
                message: 'Failed to retrieve metrics',
            },
        });
    }
});
router.get('/health', (req, res) => {
    try {
        const registry = prometheus_metrics_service_1.prometheusMetrics.getRegistry();
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
    }
    catch (error) {
        logger_1.logger.error('Metrics health check failed:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'METRICS_HEALTH_CHECK_FAILED',
                message: 'Metrics service health check failed',
            },
        });
    }
});
router.get('/summary', async (req, res) => {
    try {
        const registry = prometheus_metrics_service_1.prometheusMetrics.getRegistry();
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
                labelNames: metric.labelNames || [],
                values: metric.hashMap ? Object.keys(metric.hashMap).length : 1,
            })),
        };
        metrics.forEach(metric => {
            if (metric.name.startsWith('http_')) {
                summary.categories.http++;
            }
            else if (metric.name.startsWith('finishthisidea_')) {
                summary.categories.business++;
            }
            else if (metric.name.startsWith('process_') || metric.name.startsWith('nodejs_')) {
                summary.categories.system++;
            }
            else {
                summary.categories.custom++;
            }
        });
        res.json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get metrics summary:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'METRICS_SUMMARY_FAILED',
                message: 'Failed to retrieve metrics summary',
            },
        });
    }
});
router.post('/test', (req, res) => {
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
        prometheus_metrics_service_1.prometheusMetrics.recordJobCreated('PREMIUM');
        prometheus_metrics_service_1.prometheusMetrics.recordJobCompleted('COMPLETED', 'FREE');
        prometheus_metrics_service_1.prometheusMetrics.recordUpload('javascript', 'completed');
        prometheus_metrics_service_1.prometheusMetrics.recordPayment('succeeded', 2500);
        prometheus_metrics_service_1.prometheusMetrics.recordAiRequest('anthropic', 'claude-3', 'success');
        prometheus_metrics_service_1.prometheusMetrics.recordQrCodeGenerated('referral');
        prometheus_metrics_service_1.prometheusMetrics.recordSocialShare('twitter', 'achievement');
        prometheus_metrics_service_1.prometheusMetrics.recordAchievementUnlocked('first_upload', 'FREE');
        res.json({
            success: true,
            message: 'Test metrics recorded successfully',
            data: {
                timestamp: new Date().toISOString(),
                metricsGenerated: 8,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate test metrics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'TEST_METRICS_FAILED',
                message: 'Failed to generate test metrics',
            },
        });
    }
});
//# sourceMappingURL=metrics.route.js.map