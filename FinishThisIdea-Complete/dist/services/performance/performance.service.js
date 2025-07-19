"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceService = exports.PerformanceService = void 0;
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const cache_service_1 = require("../cache/cache.service");
class PerformanceService {
    metrics = [];
    maxMetricsHistory = 1000;
    monitoringInterval;
    performanceObserver;
    lastCpuUsage = process.cpuUsage();
    defaultThresholds = {
        responseTime: 1000,
        memoryUsage: 512 * 1024 * 1024,
        cpuUsage: 80,
        eventLoopDelay: 100
    };
    constructor() {
        this.startMonitoring();
        this.setupPerformanceObserver();
    }
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 30000);
        setInterval(() => {
            this.cleanupMetrics();
        }, 300000);
    }
    setupPerformanceObserver() {
        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.entryType === 'measure') {
                        prometheus_metrics_service_1.prometheusMetrics.performanceMeasurements.observe({ name: entry.name }, entry.duration);
                    }
                });
            });
            this.performanceObserver.observe({
                entryTypes: ['measure', 'navigation', 'resource']
            });
        }
        catch (error) {
            logger_1.logger.warn('Performance Observer not available', { error });
        }
    }
    collectMetrics() {
        try {
            const now = Date.now();
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage(this.lastCpuUsage);
            this.lastCpuUsage = process.cpuUsage();
            const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) / 30 * 100;
            const start = perf_hooks_1.performance.now();
            setImmediate(() => {
                const eventLoopDelay = perf_hooks_1.performance.now() - start;
                const metrics = {
                    timestamp: now,
                    duration: eventLoopDelay,
                    memoryUsage,
                    cpuUsage,
                    eventLoopDelay,
                    activeHandles: process._getActiveHandles().length,
                    activeRequests: process._getActiveRequests().length
                };
                this.metrics.push(metrics);
                prometheus_metrics_service_1.prometheusMetrics.memoryUsage.set({ type: 'rss' }, memoryUsage.rss);
                prometheus_metrics_service_1.prometheusMetrics.memoryUsage.set({ type: 'heapUsed' }, memoryUsage.heapUsed);
                prometheus_metrics_service_1.prometheusMetrics.memoryUsage.set({ type: 'heapTotal' }, memoryUsage.heapTotal);
                prometheus_metrics_service_1.prometheusMetrics.memoryUsage.set({ type: 'external' }, memoryUsage.external);
                prometheus_metrics_service_1.prometheusMetrics.cpuUsage.set(cpuPercent);
                prometheus_metrics_service_1.prometheusMetrics.eventLoopLag.set(eventLoopDelay);
                this.checkThresholds(metrics, cpuPercent);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to collect performance metrics', { error });
        }
    }
    checkThresholds(metrics, cpuPercent) {
        const alerts = [];
        if (metrics.memoryUsage.heapUsed > this.defaultThresholds.memoryUsage) {
            alerts.push(`High memory usage: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
        }
        if (cpuPercent > this.defaultThresholds.cpuUsage) {
            alerts.push(`High CPU usage: ${cpuPercent.toFixed(1)}%`);
        }
        if (metrics.eventLoopDelay > this.defaultThresholds.eventLoopDelay) {
            alerts.push(`High event loop delay: ${metrics.eventLoopDelay.toFixed(1)}ms`);
        }
        if (alerts.length > 0) {
            logger_1.logger.warn('Performance threshold exceeded', { alerts, metrics });
            prometheus_metrics_service_1.prometheusMetrics.performanceAlerts.inc({ type: 'threshold_exceeded' });
        }
    }
    cleanupMetrics() {
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics = this.metrics.slice(-this.maxMetricsHistory);
        }
    }
    measure(name, fn) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        const measureName = `${name}-duration`;
        perf_hooks_1.performance.mark(startMark);
        const result = fn();
        if (result instanceof Promise) {
            return result.finally(() => {
                perf_hooks_1.performance.mark(endMark);
                perf_hooks_1.performance.measure(measureName, startMark, endMark);
                perf_hooks_1.performance.clearMarks(startMark);
                perf_hooks_1.performance.clearMarks(endMark);
            });
        }
        else {
            perf_hooks_1.performance.mark(endMark);
            perf_hooks_1.performance.measure(measureName, startMark, endMark);
            perf_hooks_1.performance.clearMarks(startMark);
            perf_hooks_1.performance.clearMarks(endMark);
            return result;
        }
    }
    async measureAsync(name, fn, options = {}) {
        const start = perf_hooks_1.performance.now();
        const startMemory = options.includeMemory ? process.memoryUsage() : null;
        try {
            const result = await fn();
            const duration = perf_hooks_1.performance.now() - start;
            if (options.includeMemory && startMemory) {
                const endMemory = process.memoryUsage();
                const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
                logger_1.logger.debug('Function performance', {
                    name,
                    duration: `${duration.toFixed(2)}ms`,
                    memoryDelta: `${Math.round(memoryDelta / 1024)}KB`
                });
            }
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name }, duration);
            if (options.cacheResult && duration > 100) {
                await cache_service_1.cacheService.set(`perf:${name}`, result, { ttl: 300 });
            }
            return result;
        }
        catch (error) {
            const duration = perf_hooks_1.performance.now() - start;
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name });
            logger_1.logger.error('Function performance error', { name, duration: `${duration.toFixed(2)}ms`, error });
            throw error;
        }
    }
    getStats(timeframe = 300000) {
        const now = Date.now();
        const recentMetrics = this.metrics.filter(m => now - m.timestamp <= timeframe);
        if (recentMetrics.length === 0) {
            return {
                summary: {
                    avgResponseTime: 0,
                    maxResponseTime: 0,
                    avgMemoryUsage: 0,
                    maxMemoryUsage: 0,
                    avgCpuUsage: 0,
                    avgEventLoopDelay: 0
                },
                recent: [],
                trends: {
                    memoryTrend: 'stable',
                    responseTrend: 'stable'
                }
            };
        }
        const summary = {
            avgResponseTime: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
            maxResponseTime: Math.max(...recentMetrics.map(m => m.duration)),
            avgMemoryUsage: recentMetrics.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / recentMetrics.length,
            maxMemoryUsage: Math.max(...recentMetrics.map(m => m.memoryUsage.heapUsed)),
            avgCpuUsage: recentMetrics.reduce((sum, m) => sum + ((m.cpuUsage.user + m.cpuUsage.system) / 1000000), 0) / recentMetrics.length,
            avgEventLoopDelay: recentMetrics.reduce((sum, m) => sum + m.eventLoopDelay, 0) / recentMetrics.length
        };
        const halfPoint = Math.floor(recentMetrics.length / 2);
        const firstHalf = recentMetrics.slice(0, halfPoint);
        const secondHalf = recentMetrics.slice(halfPoint);
        const firstHalfMemory = firstHalf.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / firstHalf.length;
        const secondHalfMemory = secondHalf.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / secondHalf.length;
        const memoryDelta = secondHalfMemory - firstHalfMemory;
        const firstHalfResponse = firstHalf.reduce((sum, m) => sum + m.duration, 0) / firstHalf.length;
        const secondHalfResponse = secondHalf.reduce((sum, m) => sum + m.duration, 0) / secondHalf.length;
        const responseDelta = secondHalfResponse - firstHalfResponse;
        const trends = {
            memoryTrend: Math.abs(memoryDelta) < 1024 * 1024 ? 'stable' : memoryDelta > 0 ? 'increasing' : 'decreasing',
            responseTrend: Math.abs(responseDelta) < 10 ? 'stable' : responseDelta > 0 ? 'degrading' : 'improving'
        };
        return {
            summary,
            recent: recentMetrics.slice(-10),
            trends
        };
    }
    getRecommendations() {
        const stats = this.getStats();
        const recommendations = [];
        if (stats.summary.avgMemoryUsage > this.defaultThresholds.memoryUsage * 0.8) {
            recommendations.push('Consider increasing memory allocation or implementing memory optimization');
        }
        if (stats.summary.avgEventLoopDelay > this.defaultThresholds.eventLoopDelay * 0.8) {
            recommendations.push('Event loop delay is high - consider using worker threads for CPU-intensive tasks');
        }
        if (stats.trends.memoryTrend === 'increasing') {
            recommendations.push('Memory usage is trending upward - check for memory leaks');
        }
        if (stats.trends.responseTrend === 'degrading') {
            recommendations.push('Response times are getting slower - investigate performance bottlenecks');
        }
        if (stats.summary.avgResponseTime > this.defaultThresholds.responseTime * 0.8) {
            recommendations.push('Consider implementing caching or optimizing database queries');
        }
        return recommendations;
    }
    startProfiling(duration = 60000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const samples = [];
            const sampleInterval = setInterval(() => {
                this.collectMetrics();
                samples.push(this.metrics[this.metrics.length - 1]);
            }, 1000);
            setTimeout(() => {
                clearInterval(sampleInterval);
                const endTime = Date.now();
                const profilingData = {
                    duration: endTime - startTime,
                    samples: samples.length,
                    averageMemory: samples.reduce((sum, s) => sum + s.memoryUsage.heapUsed, 0) / samples.length,
                    peakMemory: Math.max(...samples.map(s => s.memoryUsage.heapUsed)),
                    averageEventLoopDelay: samples.reduce((sum, s) => sum + s.eventLoopDelay, 0) / samples.length,
                    maxEventLoopDelay: Math.max(...samples.map(s => s.eventLoopDelay))
                };
                logger_1.logger.info('Performance profiling completed', profilingData);
                resolve();
            }, duration);
        });
    }
    shutdown() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        logger_1.logger.info('Performance service shutdown');
    }
}
exports.PerformanceService = PerformanceService;
exports.performanceService = new PerformanceService();
//# sourceMappingURL=performance.service.js.map