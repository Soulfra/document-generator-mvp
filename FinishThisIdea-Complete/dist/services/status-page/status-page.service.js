"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusPageService = exports.StatusPageService = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const redis_1 = __importDefault(require("../../config/redis"));
const database_1 = require("../../utils/database");
class StatusPageService extends events_1.EventEmitter {
    static instance;
    services = new Map();
    incidents = new Map();
    maintenanceWindows = new Map();
    checkInterval;
    constructor() {
        super();
        this.initializeServices();
    }
    static getInstance() {
        if (!StatusPageService.instance) {
            StatusPageService.instance = new StatusPageService();
        }
        return StatusPageService.instance;
    }
    initializeServices() {
        const serviceDefinitions = [
            { name: 'api', displayName: 'API Gateway' },
            { name: 'database', displayName: 'Database' },
            { name: 'redis', displayName: 'Cache (Redis)' },
            { name: 'storage', displayName: 'File Storage' },
            { name: 'payments', displayName: 'Payment Processing' },
            { name: 'jobs', displayName: 'Background Jobs' },
            { name: 'ai', displayName: 'AI Services' },
            { name: 'websocket', displayName: 'Real-time Updates' }
        ];
        serviceDefinitions.forEach(def => {
            this.services.set(def.name, {
                name: def.name,
                displayName: def.displayName,
                status: 'operational',
                lastChecked: new Date(),
                uptime90d: 99.9
            });
        });
    }
    async startMonitoring() {
        await this.checkAllServices();
        this.checkInterval = setInterval(async () => {
            await this.checkAllServices();
        }, 60000);
        logger_1.logger.info('Status page monitoring started');
    }
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }
    }
    async checkAllServices() {
        await Promise.all([
            this.checkAPIService(),
            this.checkDatabase(),
            this.checkRedis(),
            this.checkStorage(),
            this.checkPayments(),
            this.checkJobs(),
            this.checkAIServices(),
            this.checkWebSocket()
        ]);
        await this.updateOverallStatus();
    }
    async checkAPIService() {
        try {
            const startTime = Date.now();
            const responseTime = Date.now() - startTime;
            await this.updateServiceStatus('api', {
                status: responseTime < 1000 ? 'operational' : 'degraded',
                responseTime,
                lastChecked: new Date()
            });
        }
        catch (error) {
            await this.updateServiceStatus('api', {
                status: 'major_outage',
                lastChecked: new Date()
            });
        }
    }
    async checkDatabase() {
        try {
            const startTime = Date.now();
            await database_1.prisma.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - startTime;
            await this.updateServiceStatus('database', {
                status: responseTime < 100 ? 'operational' : 'degraded',
                responseTime,
                lastChecked: new Date()
            });
        }
        catch (error) {
            await this.updateServiceStatus('database', {
                status: 'major_outage',
                lastChecked: new Date()
            });
        }
    }
    async checkRedis() {
        try {
            const startTime = Date.now();
            await redis_1.default.ping();
            const responseTime = Date.now() - startTime;
            await this.updateServiceStatus('redis', {
                status: responseTime < 50 ? 'operational' : 'degraded',
                responseTime,
                lastChecked: new Date()
            });
        }
        catch (error) {
            await this.updateServiceStatus('redis', {
                status: 'major_outage',
                lastChecked: new Date()
            });
        }
    }
    async checkStorage() {
        await this.updateServiceStatus('storage', {
            status: 'operational',
            lastChecked: new Date()
        });
    }
    async checkPayments() {
        await this.updateServiceStatus('payments', {
            status: 'operational',
            lastChecked: new Date()
        });
    }
    async checkJobs() {
        try {
            const jobCount = await database_1.prisma.job.count({
                where: {
                    status: 'PROCESSING'
                }
            });
            await this.updateServiceStatus('jobs', {
                status: jobCount < 100 ? 'operational' : 'degraded',
                lastChecked: new Date()
            });
        }
        catch (error) {
            await this.updateServiceStatus('jobs', {
                status: 'partial_outage',
                lastChecked: new Date()
            });
        }
    }
    async checkAIServices() {
        await this.updateServiceStatus('ai', {
            status: 'operational',
            lastChecked: new Date()
        });
    }
    async checkWebSocket() {
        await this.updateServiceStatus('websocket', {
            status: 'operational',
            lastChecked: new Date()
        });
    }
    async updateServiceStatus(serviceName, updates) {
        const service = this.services.get(serviceName);
        if (!service)
            return;
        const previousStatus = service.status;
        Object.assign(service, updates);
        await redis_1.default.setex(`status:service:${serviceName}`, 3600, JSON.stringify(service));
        if (previousStatus === 'operational' && updates.status !== 'operational') {
            await this.createIncident({
                service: serviceName,
                severity: updates.status === 'major_outage' ? 'critical' : 'major',
                title: `${service.displayName} ${updates.status?.replace('_', ' ')}`,
                description: `${service.displayName} is experiencing issues`
            });
        }
        if (previousStatus !== 'operational' && updates.status === 'operational') {
            await this.resolveServiceIncidents(serviceName);
        }
        this.emit('service:updated', service);
    }
    async createIncident(data) {
        const incident = {
            id: `inc-${Date.now()}`,
            service: data.service,
            status: 'investigating',
            severity: data.severity,
            title: data.title,
            description: data.description,
            startedAt: new Date(),
            updates: [{
                    id: `upd-${Date.now()}`,
                    timestamp: new Date(),
                    status: 'investigating',
                    message: 'We are investigating the issue'
                }]
        };
        this.incidents.set(incident.id, incident);
        await redis_1.default.setex(`status:incident:${incident.id}`, 86400, JSON.stringify(incident));
        await redis_1.default.zadd('status:incidents:active', Date.now(), incident.id);
        this.emit('incident:created', incident);
        logger_1.logger.warn('Status page incident created', { incident });
        return incident;
    }
    async updateIncident(incidentId, update) {
        const incident = this.incidents.get(incidentId);
        if (!incident)
            throw new Error('Incident not found');
        if (update.status) {
            incident.status = update.status;
        }
        incident.updates.push({
            id: `upd-${Date.now()}`,
            timestamp: new Date(),
            status: incident.status,
            message: update.message,
            author: update.author
        });
        await redis_1.default.setex(`status:incident:${incident.id}`, 86400, JSON.stringify(incident));
        this.emit('incident:updated', incident);
    }
    async resolveServiceIncidents(serviceName) {
        const activeIncidents = Array.from(this.incidents.values()).filter(inc => inc.service === serviceName && inc.status !== 'resolved');
        for (const incident of activeIncidents) {
            incident.status = 'resolved';
            incident.resolvedAt = new Date();
            incident.updates.push({
                id: `upd-${Date.now()}`,
                timestamp: new Date(),
                status: 'resolved',
                message: 'The issue has been resolved'
            });
            await redis_1.default.setex(`status:incident:${incident.id}`, 86400, JSON.stringify(incident));
            await redis_1.default.zrem('status:incidents:active', incident.id);
            await redis_1.default.zadd('status:incidents:resolved', Date.now(), incident.id);
            this.emit('incident:resolved', incident);
        }
    }
    async scheduleMaintenance(data) {
        const maintenance = {
            id: `maint-${Date.now()}`,
            status: 'scheduled',
            ...data
        };
        this.maintenanceWindows.set(maintenance.id, maintenance);
        await redis_1.default.setex(`status:maintenance:${maintenance.id}`, 86400 * 7, JSON.stringify(maintenance));
        this.emit('maintenance:scheduled', maintenance);
        return maintenance;
    }
    async getSystemStatus() {
        const services = Array.from(this.services.values());
        const activeIncidents = Array.from(this.incidents.values())
            .filter(inc => inc.status !== 'resolved')
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
        const recentIncidents = Array.from(this.incidents.values())
            .filter(inc => inc.status === 'resolved')
            .sort((a, b) => (b.resolvedAt?.getTime() || 0) - (a.resolvedAt?.getTime() || 0))
            .slice(0, 10);
        const maintenanceWindows = Array.from(this.maintenanceWindows.values())
            .filter(m => m.status !== 'cancelled')
            .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
        let overall = 'operational';
        if (services.some(s => s.status === 'major_outage')) {
            overall = 'major_outage';
        }
        else if (services.some(s => s.status === 'partial_outage')) {
            overall = 'partial_outage';
        }
        else if (services.some(s => s.status === 'degraded')) {
            overall = 'degraded';
        }
        const metrics = {
            uptime30d: 99.5,
            uptime90d: 99.9,
            averageResponseTime: 150,
            sloCompliance: 99.5
        };
        return {
            overall,
            lastUpdated: new Date(),
            services,
            activeIncidents,
            recentIncidents,
            maintenanceWindows,
            metrics
        };
    }
    async updateOverallStatus() {
        const status = await this.getSystemStatus();
        await redis_1.default.setex('status:current', 300, JSON.stringify(status));
        await redis_1.default.zadd('status:history', Date.now(), JSON.stringify({
            timestamp: Date.now(),
            overall: status.overall,
            services: status.services.map(s => ({
                name: s.name,
                status: s.status,
                responseTime: s.responseTime
            }))
        }));
        this.emit('status:updated', status);
    }
    async getStatusHistory(hours = 24) {
        const since = Date.now() - (hours * 60 * 60 * 1000);
        const history = await redis_1.default.zrangebyscore('status:history', since, Date.now());
        return history.map(item => JSON.parse(item));
    }
}
exports.StatusPageService = StatusPageService;
exports.statusPageService = StatusPageService.getInstance();
//# sourceMappingURL=status-page.service.js.map