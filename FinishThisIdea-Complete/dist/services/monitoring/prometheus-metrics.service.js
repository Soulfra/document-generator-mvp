"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prometheusMetrics = exports.PrometheusMetricsService = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const response_time_1 = __importDefault(require("response-time"));
const database_1 = require("../../utils/database");
const logger_1 = require("../../utils/logger");
class PrometheusMetricsService {
    static instance;
    httpRequestDuration;
    httpRequestTotal;
    httpRequestSizeBytes;
    httpResponseSizeBytes;
    jobsTotal;
    jobsCurrentlyProcessing;
    uploadsTotal;
    apiKeysUsage;
    paymentsTotal;
    usersRegistered;
    nodeVersion;
    processStartTime;
    processUptime;
    databaseConnections;
    redisConnections;
    memoryUsage;
    cpuUsage;
    eventLoopLag;
    aiRequestsTotal;
    qrCodesGenerated;
    socialSharesTotal;
    achievementsUnlocked;
    sloCompliance;
    errorBudgetRemaining;
    incidentsCreated;
    incidentsResolved;
    incidentErrors;
    backupsScheduled;
    backupsCompleted;
    backupErrors;
    registry;
    constructor() {
        this.registry = prom_client_1.default.register;
        this.registry.clear();
        this.initializeMetrics();
        this.setupDefaultMetrics();
        this.startPeriodicCollection();
    }
    static getInstance() {
        if (!PrometheusMetricsService.instance) {
            PrometheusMetricsService.instance = new PrometheusMetricsService();
        }
        return PrometheusMetricsService.instance;
    }
    initializeMetrics() {
        this.httpRequestDuration = new prom_client_1.default.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
            registers: [this.registry],
        });
        this.httpRequestTotal = new prom_client_1.default.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });
        this.httpRequestSizeBytes = new prom_client_1.default.Histogram({
            name: 'http_request_size_bytes',
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route'],
            buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
            registers: [this.registry],
        });
        this.httpResponseSizeBytes = new prom_client_1.default.Histogram({
            name: 'http_response_size_bytes',
            help: 'Size of HTTP responses in bytes',
            labelNames: ['method', 'route'],
            buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
            registers: [this.registry],
        });
        this.jobsTotal = new prom_client_1.default.Counter({
            name: 'finishthisidea_jobs_total',
            help: 'Total number of cleanup jobs processed',
            labelNames: ['status', 'tier'],
            registers: [this.registry],
        });
        this.jobsCurrentlyProcessing = new prom_client_1.default.Gauge({
            name: 'finishthisidea_jobs_processing_current',
            help: 'Number of jobs currently being processed',
            labelNames: ['tier'],
            registers: [this.registry],
        });
        this.uploadsTotal = new prom_client_1.default.Counter({
            name: 'finishthisidea_uploads_total',
            help: 'Total number of file uploads',
            labelNames: ['file_type', 'status'],
            registers: [this.registry],
        });
        this.apiKeysUsage = new prom_client_1.default.Counter({
            name: 'finishthisidea_api_keys_usage_total',
            help: 'Total API key usage',
            labelNames: ['key_id', 'tier', 'endpoint'],
            registers: [this.registry],
        });
        this.paymentsTotal = new prom_client_1.default.Counter({
            name: 'finishthisidea_payments_total',
            help: 'Total payments processed',
            labelNames: ['status', 'amount_range'],
            registers: [this.registry],
        });
        this.usersRegistered = new prom_client_1.default.Gauge({
            name: 'finishthisidea_users_registered_total',
            help: 'Total number of registered users',
            labelNames: ['tier'],
            registers: [this.registry],
        });
        this.nodeVersion = new prom_client_1.default.Gauge({
            name: 'nodejs_version_info',
            help: 'Node.js version info',
            labelNames: ['version'],
            registers: [this.registry],
        });
        this.processStartTime = new prom_client_1.default.Gauge({
            name: 'process_start_time_seconds',
            help: 'Start time of the process since unix epoch in seconds',
            registers: [this.registry],
        });
        this.processUptime = new prom_client_1.default.Gauge({
            name: 'process_uptime_seconds',
            help: 'Process uptime in seconds',
            registers: [this.registry],
        });
        this.databaseConnections = new prom_client_1.default.Gauge({
            name: 'finishthisidea_database_connections_active',
            help: 'Number of active database connections',
            registers: [this.registry],
        });
        this.redisConnections = new prom_client_1.default.Gauge({
            name: 'finishthisidea_redis_connections_active',
            help: 'Number of active Redis connections',
            registers: [this.registry],
        });
        this.memoryUsage = new prom_client_1.default.Gauge({
            name: 'process_memory_usage_bytes',
            help: 'Process memory usage in bytes',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.cpuUsage = new prom_client_1.default.Gauge({
            name: 'process_cpu_usage_percent',
            help: 'Process CPU usage percentage',
            registers: [this.registry],
        });
        this.eventLoopLag = new prom_client_1.default.Histogram({
            name: 'nodejs_eventloop_lag_seconds',
            help: 'Lag of event loop in seconds',
            buckets: [0.001, 0.01, 0.1, 1, 10],
            registers: [this.registry],
        });
        this.cacheOperations = new prom_client_1.default.Counter({
            name: 'finishthisidea_cache_operations_total',
            help: 'Total cache operations',
            labelNames: ['operation', 'cache'],
            registers: [this.registry],
        });
        this.cacheHits = new prom_client_1.default.Counter({
            name: 'finishthisidea_cache_hits_total',
            help: 'Total cache hits',
            labelNames: ['cache'],
            registers: [this.registry],
        });
        this.cacheMisses = new prom_client_1.default.Counter({
            name: 'finishthisidea_cache_misses_total',
            help: 'Total cache misses',
            labelNames: ['cache'],
            registers: [this.registry],
        });
        this.cacheErrors = new prom_client_1.default.Counter({
            name: 'finishthisidea_cache_errors_total',
            help: 'Total cache errors',
            labelNames: ['operation'],
            registers: [this.registry],
        });
        this.compressionAttempts = new prom_client_1.default.Counter({
            name: 'finishthisidea_compression_attempts_total',
            help: 'Total compression attempts',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.compressionRatio = new prom_client_1.default.Histogram({
            name: 'finishthisidea_compression_ratio_percent',
            help: 'Compression ratio percentage',
            buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
            registers: [this.registry],
        });
        this.compressionSavings = new prom_client_1.default.Counter({
            name: 'finishthisidea_compression_savings_bytes',
            help: 'Total bytes saved through compression',
            registers: [this.registry],
        });
        this.databaseQueryDuration = new prom_client_1.default.Histogram({
            name: 'finishthisidea_database_query_duration_ms',
            help: 'Database query duration in milliseconds',
            labelNames: ['query'],
            buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
            registers: [this.registry],
        });
        this.databaseErrors = new prom_client_1.default.Counter({
            name: 'finishthisidea_database_errors_total',
            help: 'Total database errors',
            labelNames: ['operation', 'model'],
            registers: [this.registry],
        });
        this.performanceMeasurements = new prom_client_1.default.Histogram({
            name: 'finishthisidea_performance_measurements_ms',
            help: 'Performance measurements in milliseconds',
            labelNames: ['name'],
            buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
            registers: [this.registry],
        });
        this.performanceAlerts = new prom_client_1.default.Counter({
            name: 'finishthisidea_performance_alerts_total',
            help: 'Total performance alerts triggered',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.functionDuration = new prom_client_1.default.Histogram({
            name: 'finishthisidea_function_duration_ms',
            help: 'Function execution duration in milliseconds',
            labelNames: ['name'],
            buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
            registers: [this.registry],
        });
        this.functionErrors = new prom_client_1.default.Counter({
            name: 'finishthisidea_function_errors_total',
            help: 'Total function execution errors',
            labelNames: ['name'],
            registers: [this.registry],
        });
        this.sloCompliance = new prom_client_1.default.Gauge({
            name: 'finishthisidea_slo_compliance_percent',
            help: 'SLO compliance percentage',
            labelNames: ['slo'],
            registers: [this.registry],
        });
        this.errorBudgetRemaining = new prom_client_1.default.Gauge({
            name: 'finishthisidea_error_budget_remaining_percent',
            help: 'Error budget remaining percentage',
            labelNames: ['slo'],
            registers: [this.registry],
        });
        this.incidentsCreated = new prom_client_1.default.Counter({
            name: 'finishthisidea_incidents_created_total',
            help: 'Total incidents created',
            labelNames: ['severity', 'service'],
            registers: [this.registry],
        });
        this.incidentsResolved = new prom_client_1.default.Counter({
            name: 'finishthisidea_incidents_resolved_total',
            help: 'Total incidents resolved',
            registers: [this.registry],
        });
        this.incidentErrors = new prom_client_1.default.Counter({
            name: 'finishthisidea_incident_errors_total',
            help: 'Total incident management errors',
            registers: [this.registry],
        });
        this.backupsScheduled = new prom_client_1.default.Counter({
            name: 'finishthisidea_backups_scheduled_total',
            help: 'Total backups scheduled',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.backupsCompleted = new prom_client_1.default.Counter({
            name: 'finishthisidea_backups_completed_total',
            help: 'Total backups completed successfully',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.backupErrors = new prom_client_1.default.Counter({
            name: 'finishthisidea_backup_errors_total',
            help: 'Total backup errors',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.aiRequestsTotal = new prom_client_1.default.Counter({
            name: 'finishthisidea_ai_requests_total',
            help: 'Total AI API requests',
            labelNames: ['provider', 'model', 'status'],
            registers: [this.registry],
        });
        this.qrCodesGenerated = new prom_client_1.default.Counter({
            name: 'finishthisidea_qr_codes_generated_total',
            help: 'Total QR codes generated',
            labelNames: ['type'],
            registers: [this.registry],
        });
        this.socialSharesTotal = new prom_client_1.default.Counter({
            name: 'finishthisidea_social_shares_total',
            help: 'Total social media shares',
            labelNames: ['platform', 'content_type'],
            registers: [this.registry],
        });
        this.achievementsUnlocked = new prom_client_1.default.Counter({
            name: 'finishthisidea_achievements_unlocked_total',
            help: 'Total achievements unlocked by users',
            labelNames: ['achievement_type', 'tier'],
            registers: [this.registry],
        });
    }
    setupDefaultMetrics() {
        prom_client_1.default.collectDefaultMetrics({
            register: this.registry,
            gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
        });
        this.nodeVersion.set({ version: process.version }, 1);
        this.processStartTime.set(Date.now() / 1000 - process.uptime());
    }
    startPeriodicCollection() {
        setInterval(() => {
            this.processUptime.set(process.uptime());
            this.updateMemoryMetrics();
            this.updateSystemMetrics();
        }, 30000);
        setInterval(() => {
            this.updateBusinessMetrics();
        }, 60000);
    }
    updateMemoryMetrics() {
        const memUsage = process.memoryUsage();
        this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
        this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
        this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
        this.memoryUsage.set({ type: 'external' }, memUsage.external);
    }
    updateSystemMetrics() {
        const cpuUsage = process.cpuUsage();
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000;
        this.cpuUsage.set(cpuPercent);
    }
    async updateBusinessMetrics() {
        try {
            const userCounts = await database_1.prisma.user.groupBy({
                by: ['tier'],
                _count: { id: true },
            });
            userCounts.forEach(({ tier, _count }) => {
                this.usersRegistered.set({ tier }, _count.id);
            });
            const jobCounts = await database_1.prisma.job.groupBy({
                by: ['status'],
                _count: { id: true },
            });
            jobCounts.forEach(({ status, _count }) => {
                this.jobsCurrentlyProcessing.set({ tier: 'all' }, _count.id);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update business metrics:', error);
        }
    }
    createHttpMetricsMiddleware() {
        return (0, response_time_1.default)((req, res, time) => {
            const route = this.normalizeRoute(req.route?.path || req.path);
            const method = req.method;
            const statusCode = res.statusCode.toString();
            this.httpRequestDuration.observe({ method, route, status_code: statusCode }, time / 1000);
            this.httpRequestTotal.inc({ method, route, status_code: statusCode });
            const reqSize = parseInt(req.get('content-length') || '0', 10);
            const resSize = parseInt(res.get('content-length') || '0', 10);
            if (reqSize > 0) {
                this.httpRequestSizeBytes.observe({ method, route }, reqSize);
            }
            if (resSize > 0) {
                this.httpResponseSizeBytes.observe({ method, route }, resSize);
            }
        });
    }
    normalizeRoute(path) {
        return path
            .replace(/\/\d+/g, '/:id')
            .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '/:uuid')
            .replace(/\/[a-zA-Z0-9]{10,}/g, '/:token')
            || '/unknown';
    }
    recordJobCreated(tier) {
        this.jobsTotal.inc({ status: 'created', tier });
    }
    recordJobCompleted(status, tier) {
        this.jobsTotal.inc({ status, tier });
    }
    recordUpload(fileType, status) {
        this.uploadsTotal.inc({ file_type: fileType, status });
    }
    recordApiKeyUsage(keyId, tier, endpoint) {
        this.apiKeysUsage.inc({ key_id: keyId, tier, endpoint });
    }
    recordPayment(status, amount) {
        const amountRange = this.getAmountRange(amount);
        this.paymentsTotal.inc({ status, amount_range: amountRange });
    }
    recordAiRequest(provider, model, status) {
        this.aiRequestsTotal.inc({ provider, model, status });
    }
    recordQrCodeGenerated(type) {
        this.qrCodesGenerated.inc({ type });
    }
    recordSocialShare(platform, contentType) {
        this.socialSharesTotal.inc({ platform, content_type: contentType });
    }
    recordAchievementUnlocked(achievementType, tier) {
        this.achievementsUnlocked.inc({ achievement_type: achievementType, tier });
    }
    getAmountRange(amount) {
        if (amount < 100)
            return '0-99';
        if (amount < 500)
            return '100-499';
        if (amount < 1000)
            return '500-999';
        if (amount < 5000)
            return '1000-4999';
        if (amount < 10000)
            return '5000-9999';
        return '10000+';
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    getRegistry() {
        return this.registry;
    }
    reset() {
        this.registry.resetMetrics();
    }
}
exports.PrometheusMetricsService = PrometheusMetricsService;
exports.prometheusMetrics = PrometheusMetricsService.getInstance();
//# sourceMappingURL=prometheus-metrics.service.js.map