"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slaSloService = exports.SLASLOService = void 0;
const prometheus_metrics_service_1 = require("./prometheus-metrics.service");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../../config/redis");
const events_1 = require("events");
class SLASLOService extends events_1.EventEmitter {
    static instance;
    slos = new Map();
    checkInterval = null;
    defaultSLOs = [
        {
            id: 'api-availability',
            name: 'API Availability',
            description: 'Overall API uptime and availability',
            slis: [
                {
                    name: 'uptime',
                    description: 'Service uptime percentage',
                    measurement: 'availability',
                    target: 99.9,
                    unit: 'percent'
                }
            ],
            target: 99.9,
            window: 'monthly',
            alertThresholds: {
                warning: 99.5,
                critical: 99.0
            }
        },
        {
            id: 'api-performance',
            name: 'API Performance',
            description: 'API response time and throughput',
            slis: [
                {
                    name: 'p95_latency',
                    description: '95th percentile response time',
                    measurement: 'latency',
                    target: 500,
                    unit: 'ms'
                },
                {
                    name: 'p99_latency',
                    description: '99th percentile response time',
                    measurement: 'latency',
                    target: 1000,
                    unit: 'ms'
                },
                {
                    name: 'throughput',
                    description: 'Requests per second',
                    measurement: 'throughput',
                    target: 100,
                    unit: 'rps'
                }
            ],
            target: 95,
            window: 'daily',
            alertThresholds: {
                warning: 90,
                critical: 85
            }
        },
        {
            id: 'job-processing',
            name: 'Job Processing',
            description: 'Document processing job performance',
            slis: [
                {
                    name: 'success_rate',
                    description: 'Job success rate',
                    measurement: 'error_rate',
                    target: 99,
                    unit: 'percent'
                },
                {
                    name: 'processing_time',
                    description: 'Average job processing time',
                    measurement: 'latency',
                    target: 30000,
                    unit: 'ms'
                }
            ],
            target: 98,
            window: 'weekly',
            alertThresholds: {
                warning: 95,
                critical: 90
            }
        },
        {
            id: 'data-integrity',
            name: 'Data Integrity',
            description: 'Data accuracy and consistency',
            slis: [
                {
                    name: 'backup_success',
                    description: 'Backup success rate',
                    measurement: 'error_rate',
                    target: 100,
                    unit: 'percent'
                },
                {
                    name: 'data_corruption',
                    description: 'Data corruption incidents',
                    measurement: 'custom',
                    target: 0,
                    unit: 'count'
                }
            ],
            target: 99.99,
            window: 'monthly',
            alertThresholds: {
                warning: 99.95,
                critical: 99.9
            }
        }
    ];
    constructor() {
        super();
        this.initializeSLOs();
    }
    static getInstance() {
        if (!SLASLOService.instance) {
            SLASLOService.instance = new SLASLOService();
        }
        return SLASLOService.instance;
    }
    initializeSLOs() {
        this.defaultSLOs.forEach(slo => {
            this.slos.set(slo.id, slo);
        });
        this.startMonitoring();
    }
    startMonitoring() {
        this.checkInterval = setInterval(() => {
            this.checkAllSLOs();
        }, 60000);
        this.checkAllSLOs();
    }
    async checkAllSLOs() {
        for (const [id, slo] of this.slos) {
            try {
                await this.checkSLO(slo);
            }
            catch (error) {
                logger_1.logger.error('Failed to check SLO', { sloId: id, error });
            }
        }
    }
    async checkSLO(slo) {
        const metrics = [];
        let totalScore = 0;
        let violations = 0;
        for (const sli of slo.slis) {
            const metric = await this.measureSLI(sli, slo);
            metrics.push(metric);
            if (metric.isViolation) {
                violations++;
            }
            else {
                totalScore += 100;
            }
        }
        const sloScore = totalScore / slo.slis.length;
        const errorBudgetRemaining = this.calculateErrorBudget(sloScore, slo.target);
        await this.storeMetrics(slo, metrics, sloScore, errorBudgetRemaining);
        if (sloScore <= slo.alertThresholds.critical) {
            this.emit('slo:critical', { slo, score: sloScore, metrics });
            logger_1.logger.error('SLO critical violation', { sloId: slo.id, score: sloScore });
        }
        else if (sloScore <= slo.alertThresholds.warning) {
            this.emit('slo:warning', { slo, score: sloScore, metrics });
            logger_1.logger.warn('SLO warning threshold', { sloId: slo.id, score: sloScore });
        }
        prometheus_metrics_service_1.prometheusMetrics.sloCompliance.set({ slo: slo.id }, sloScore);
        prometheus_metrics_service_1.prometheusMetrics.errorBudgetRemaining.set({ slo: slo.id }, errorBudgetRemaining);
    }
    async measureSLI(sli, slo) {
        let value;
        let isViolation = false;
        switch (sli.measurement) {
            case 'availability':
                value = await this.measureAvailability();
                isViolation = value < sli.target;
                break;
            case 'latency':
                value = await this.measureLatency(sli.name);
                isViolation = value > sli.target;
                break;
            case 'error_rate':
                value = await this.measureErrorRate(sli.name);
                isViolation = sli.name.includes('success') ? value < sli.target : value > sli.target;
                break;
            case 'throughput':
                value = await this.measureThroughput();
                isViolation = value < sli.target;
                break;
            case 'custom':
                value = await this.measureCustom(sli.name);
                isViolation = value > sli.target;
                break;
            default:
                value = 0;
        }
        return {
            timestamp: new Date(),
            sloId: slo.id,
            sliName: sli.name,
            value,
            target: sli.target,
            isViolation
        };
    }
    async measureAvailability() {
        const uptimeKey = 'monitoring:uptime:current';
        const uptime = await redis_1.redis.get(uptimeKey);
        return uptime ? parseFloat(uptime) : 100;
    }
    async measureLatency(type) {
        const latencyKey = `monitoring:latency:${type}`;
        const latency = await redis_1.redis.get(latencyKey);
        return latency ? parseFloat(latency) : 0;
    }
    async measureErrorRate(type) {
        if (type === 'success_rate') {
            const stats = await redis_1.redis.hgetall('job:stats:daily');
            const total = parseInt(stats.total || '0');
            const failed = parseInt(stats.failed || '0');
            return total > 0 ? ((total - failed) / total) * 100 : 100;
        }
        const errorKey = 'monitoring:errors:rate';
        const errorRate = await redis_1.redis.get(errorKey);
        return errorRate ? parseFloat(errorRate) : 0;
    }
    async measureThroughput() {
        const throughputKey = 'monitoring:throughput:current';
        const throughput = await redis_1.redis.get(throughputKey);
        return throughput ? parseFloat(throughput) : 0;
    }
    async measureCustom(name) {
        const customKey = `monitoring:custom:${name}`;
        const value = await redis_1.redis.get(customKey);
        return value ? parseFloat(value) : 0;
    }
    calculateErrorBudget(currentScore, target) {
        const budgetUsed = (100 - currentScore) / (100 - target);
        return Math.max(0, 100 - (budgetUsed * 100));
    }
    async storeMetrics(slo, metrics, score, errorBudget) {
        const timestamp = Date.now();
        const key = `slo:metrics:${slo.id}:${timestamp}`;
        const data = {
            timestamp: new Date(timestamp),
            sloId: slo.id,
            score,
            errorBudget,
            metrics,
            window: slo.window
        };
        const ttl = this.getRetentionTTL(slo.window);
        await redis_1.redis.setex(key, ttl, JSON.stringify(data));
        await redis_1.redis.zadd(`slo:history:${slo.id}`, timestamp, key);
        const cutoff = timestamp - (ttl * 1000);
        await redis_1.redis.zremrangebyscore(`slo:history:${slo.id}`, 0, cutoff);
    }
    getRetentionTTL(window) {
        const ttlMap = {
            daily: 7 * 24 * 60 * 60,
            weekly: 30 * 24 * 60 * 60,
            monthly: 90 * 24 * 60 * 60,
            quarterly: 365 * 24 * 60 * 60
        };
        return ttlMap[window] || ttlMap.daily;
    }
    async getSLOStatus(sloId) {
        if (sloId) {
            const slo = this.slos.get(sloId);
            if (!slo) {
                throw new Error(`SLO ${sloId} not found`);
            }
            return this.getSingleSLOStatus(slo);
        }
        const statuses = [];
        for (const [id, slo] of this.slos) {
            const status = await this.getSingleSLOStatus(slo);
            statuses.push(status);
        }
        return statuses;
    }
    async getSingleSLOStatus(slo) {
        const latestKey = await redis_1.redis.zrevrange(`slo:history:${slo.id}`, 0, 0);
        let currentMetrics = null;
        if (latestKey.length > 0) {
            const data = await redis_1.redis.get(latestKey[0]);
            if (data) {
                currentMetrics = JSON.parse(data);
            }
        }
        const history = await this.getSLOHistory(slo.id, slo.window);
        return {
            slo,
            current: currentMetrics,
            history,
            status: this.calculateStatus(currentMetrics, slo)
        };
    }
    async getSLOHistory(sloId, window) {
        const windowMs = this.getWindowMilliseconds(window);
        const cutoff = Date.now() - windowMs;
        const keys = await redis_1.redis.zrangebyscore(`slo:history:${sloId}`, cutoff, Date.now());
        const history = [];
        for (const key of keys) {
            const data = await redis_1.redis.get(key);
            if (data) {
                history.push(JSON.parse(data));
            }
        }
        return history;
    }
    getWindowMilliseconds(window) {
        const windowMap = {
            daily: 24 * 60 * 60 * 1000,
            weekly: 7 * 24 * 60 * 60 * 1000,
            monthly: 30 * 24 * 60 * 60 * 1000,
            quarterly: 90 * 24 * 60 * 60 * 1000
        };
        return windowMap[window] || windowMap.daily;
    }
    calculateStatus(metrics, slo) {
        if (!metrics)
            return 'unknown';
        if (metrics.score >= slo.target) {
            return 'healthy';
        }
        else if (metrics.score >= slo.alertThresholds.warning) {
            return 'warning';
        }
        else {
            return 'critical';
        }
    }
    createSLO(slo) {
        this.slos.set(slo.id, slo);
        logger_1.logger.info('Created custom SLO', { sloId: slo.id });
    }
    updateSLO(sloId, updates) {
        const slo = this.slos.get(sloId);
        if (!slo) {
            throw new Error(`SLO ${sloId} not found`);
        }
        Object.assign(slo, updates);
        this.slos.set(sloId, slo);
        logger_1.logger.info('Updated SLO', { sloId });
    }
    async deleteSLO(sloId) {
        this.slos.delete(sloId);
        await redis_1.redis.del(`slo:history:${sloId}`);
        logger_1.logger.info('Deleted SLO', { sloId });
    }
    async generateReport(sloId, startDate, endDate) {
        const slo = this.slos.get(sloId);
        if (!slo) {
            throw new Error(`SLO ${sloId} not found`);
        }
        const history = await this.getSLOHistory(sloId, slo.window);
        const filtered = history.filter(h => {
            const timestamp = new Date(h.timestamp);
            return timestamp >= startDate && timestamp <= endDate;
        });
        const scores = filtered.map(h => h.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const violations = filtered.filter(h => h.score < slo.target).length;
        const violationRate = (violations / filtered.length) * 100;
        return {
            slo,
            period: {
                start: startDate,
                end: endDate
            },
            statistics: {
                averageScore: avgScore,
                minScore,
                maxScore,
                violations,
                violationRate,
                totalMeasurements: filtered.length
            },
            history: filtered
        };
    }
    shutdown() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}
exports.SLASLOService = SLASLOService;
exports.slaSloService = SLASLOService.getInstance();
//# sourceMappingURL=sla-slo.service.js.map