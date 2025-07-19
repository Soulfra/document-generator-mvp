"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagerDuty = exports.PagerDutyService = void 0;
const axios_1 = __importDefault(require("axios"));
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const sla_slo_service_1 = require("../monitoring/sla-slo.service");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
class PagerDutyService extends events_1.EventEmitter {
    static instance;
    config;
    client;
    incidentCache = new Map();
    constructor(config) {
        super();
        this.config = {
            apiKey: process.env.PAGERDUTY_API_KEY || '',
            integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || '',
            serviceId: process.env.PAGERDUTY_SERVICE_ID,
            escalationPolicyId: process.env.PAGERDUTY_ESCALATION_POLICY_ID,
            baseUrl: 'https://api.pagerduty.com',
            fromEmail: process.env.PAGERDUTY_FROM_EMAIL || 'alerts@finishthisidea.com',
            ...config
        };
        this.setupEventListeners();
    }
    static getInstance(config) {
        if (!PagerDutyService.instance) {
            PagerDutyService.instance = new PagerDutyService(config);
        }
        return PagerDutyService.instance;
    }
    setupEventListeners() {
        sla_slo_service_1.slaSloService.on('slo:critical', (data) => {
            this.createIncidentFromSLO(data, 'critical');
        });
        sla_slo_service_1.slaSloService.on('slo:warning', (data) => {
            this.createIncidentFromSLO(data, 'warning');
        });
    }
    async createIncidentFromSLO(data, severity) {
        const incident = {
            incidentKey: `slo-${data.slo.id}-${Date.now()}`,
            title: `SLO Violation: ${data.slo.name}`,
            description: `SLO ${data.slo.name} is at ${data.score.toFixed(2)}% (target: ${data.slo.target}%)`,
            urgency: severity === 'critical' ? 'high' : 'low',
            severity: severity,
            service: 'finishthisidea',
            component: 'slo-monitoring',
            customDetails: {
                sloId: data.slo.id,
                score: data.score,
                target: data.slo.target,
                metrics: data.metrics
            }
        };
        await this.createIncident(incident);
    }
    async createIncident(incident) {
        try {
            if (!this.config.integrationKey) {
                logger_1.logger.warn('PagerDuty integration key not configured');
                return '';
            }
            const payload = {
                routing_key: this.config.integrationKey,
                event_action: 'trigger',
                dedup_key: incident.incidentKey,
                payload: {
                    summary: incident.title,
                    source: 'finishthisidea',
                    severity: incident.severity,
                    component: incident.component,
                    group: incident.service,
                    custom_details: incident.customDetails || {}
                }
            };
            const response = await axios_1.default.post('https://events.pagerduty.com/v2/enqueue', payload);
            if (response.data.status === 'success') {
                incident.id = response.data.dedup_key;
                this.incidentCache.set(incident.incidentKey, incident);
                logger_1.logger.info('PagerDuty incident created', {
                    incidentKey: incident.incidentKey,
                    severity: incident.severity
                });
                prometheus_metrics_service_1.prometheusMetrics.incidentsCreated.inc({
                    severity: incident.severity,
                    service: incident.service || 'unknown'
                });
                this.emit('incident:created', incident);
                return incident.id || '';
            }
            throw new Error('Failed to create incident');
        }
        catch (error) {
            logger_1.logger.error('Failed to create PagerDuty incident', { incident, error });
            prometheus_metrics_service_1.prometheusMetrics.incidentErrors.inc();
            throw error;
        }
    }
    async acknowledgeIncident(incidentKey) {
        try {
            const payload = {
                routing_key: this.config.integrationKey,
                event_action: 'acknowledge',
                dedup_key: incidentKey
            };
            await axios_1.default.post('https://events.pagerduty.com/v2/enqueue', payload);
            logger_1.logger.info('PagerDuty incident acknowledged', { incidentKey });
            this.emit('incident:acknowledged', incidentKey);
        }
        catch (error) {
            logger_1.logger.error('Failed to acknowledge incident', { incidentKey, error });
            throw error;
        }
    }
    async resolveIncident(incidentKey) {
        try {
            const payload = {
                routing_key: this.config.integrationKey,
                event_action: 'resolve',
                dedup_key: incidentKey
            };
            await axios_1.default.post('https://events.pagerduty.com/v2/enqueue', payload);
            this.incidentCache.delete(incidentKey);
            logger_1.logger.info('PagerDuty incident resolved', { incidentKey });
            prometheus_metrics_service_1.prometheusMetrics.incidentsResolved.inc();
            this.emit('incident:resolved', incidentKey);
        }
        catch (error) {
            logger_1.logger.error('Failed to resolve incident', { incidentKey, error });
            throw error;
        }
    }
    async getIncident(incidentId) {
        try {
            const response = await axios_1.default.get(`${this.config.baseUrl}/incidents/${incidentId}`, {
                headers: {
                    'Authorization': `Token token=${this.config.apiKey}`,
                    'Accept': 'application/vnd.pagerduty+json;version=2'
                }
            });
            return response.data.incident;
        }
        catch (error) {
            logger_1.logger.error('Failed to get incident', { incidentId, error });
            throw error;
        }
    }
    async listIncidents(options = {}) {
        try {
            const params = {
                limit: options.limit || 100,
                statuses: options.status || ['triggered', 'acknowledged'],
                urgencies: options.urgency
            };
            if (options.since) {
                params.since = options.since.toISOString();
            }
            if (options.until) {
                params.until = options.until.toISOString();
            }
            if (this.config.serviceId) {
                params.service_ids = [this.config.serviceId];
            }
            const response = await axios_1.default.get(`${this.config.baseUrl}/incidents`, {
                params,
                headers: {
                    'Authorization': `Token token=${this.config.apiKey}`,
                    'Accept': 'application/vnd.pagerduty+json;version=2'
                }
            });
            return response.data.incidents;
        }
        catch (error) {
            logger_1.logger.error('Failed to list incidents', error);
            throw error;
        }
    }
    async getOnCallUsers() {
        try {
            const response = await axios_1.default.get(`${this.config.baseUrl}/oncalls`, {
                params: {
                    include: ['users'],
                    escalation_policy_ids: this.config.escalationPolicyId ? [this.config.escalationPolicyId] : undefined
                },
                headers: {
                    'Authorization': `Token token=${this.config.apiKey}`,
                    'Accept': 'application/vnd.pagerduty+json;version=2'
                }
            });
            const schedules = [];
            const oncallsBySchedule = new Map();
            response.data.oncalls.forEach((oncall) => {
                const scheduleId = oncall.schedule?.id;
                if (scheduleId) {
                    if (!oncallsBySchedule.has(scheduleId)) {
                        oncallsBySchedule.set(scheduleId, []);
                    }
                    oncallsBySchedule.get(scheduleId).push(oncall);
                }
            });
            oncallsBySchedule.forEach((oncalls, scheduleId) => {
                const firstOncall = oncalls[0];
                schedules.push({
                    id: scheduleId,
                    name: firstOncall.schedule?.summary || 'Unknown Schedule',
                    users: oncalls.map(oncall => ({
                        id: oncall.user.id,
                        name: oncall.user.summary,
                        email: oncall.user.email,
                        onCallFrom: new Date(oncall.start),
                        onCallUntil: new Date(oncall.end)
                    }))
                });
            });
            return schedules;
        }
        catch (error) {
            logger_1.logger.error('Failed to get on-call users', error);
            throw error;
        }
    }
    async addIncidentNote(incidentId, note, userId) {
        try {
            const payload = {
                note: {
                    content: note
                }
            };
            await axios_1.default.post(`${this.config.baseUrl}/incidents/${incidentId}/notes`, payload, {
                headers: {
                    'Authorization': `Token token=${this.config.apiKey}`,
                    'Accept': 'application/vnd.pagerduty+json;version=2',
                    'From': userId || this.config.fromEmail
                }
            });
            logger_1.logger.info('Added note to incident', { incidentId });
        }
        catch (error) {
            logger_1.logger.error('Failed to add incident note', { incidentId, error });
            throw error;
        }
    }
    async escalateIncident(incidentId) {
        try {
            await axios_1.default.put(`${this.config.baseUrl}/incidents/${incidentId}/escalate`, {}, {
                headers: {
                    'Authorization': `Token token=${this.config.apiKey}`,
                    'Accept': 'application/vnd.pagerduty+json;version=2',
                    'From': this.config.fromEmail
                }
            });
            logger_1.logger.info('Incident escalated', { incidentId });
            this.emit('incident:escalated', incidentId);
        }
        catch (error) {
            logger_1.logger.error('Failed to escalate incident', { incidentId, error });
            throw error;
        }
    }
    async createMaintenanceWindow(description, startTime, endTime, serviceIds) {
        try {
            const payload = {
                maintenance_window: {
                    type: 'maintenance_window',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    description,
                    services: serviceIds?.map(id => ({
                        id,
                        type: 'service_reference'
                    })) || (this.config.serviceId ? [{
                            id: this.config.serviceId,
                            type: 'service_reference'
                        }] : [])
                }
            };
            const response = await axios_1.default.post(`${this.config.baseUrl}/maintenance_windows`, payload, {
                headers: {
                    'Authorization': `Token token=${this.config.apiKey}`,
                    'Accept': 'application/vnd.pagerduty+json;version=2',
                    'From': this.config.fromEmail
                }
            });
            logger_1.logger.info('Maintenance window created', {
                id: response.data.maintenance_window.id,
                start: startTime,
                end: endTime
            });
            return response.data.maintenance_window.id;
        }
        catch (error) {
            logger_1.logger.error('Failed to create maintenance window', error);
            throw error;
        }
    }
    async testConnection() {
        try {
            const response = await axios_1.default.get(`${this.config.baseUrl}/abilities`, {
                headers: {
                    'Authorization': `Token token=${this.config.apiKey}`,
                    'Accept': 'application/vnd.pagerduty+json;version=2'
                }
            });
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('PagerDuty connection test failed', error);
            return false;
        }
    }
    async getIncidentMetrics(startDate, endDate) {
        const incidents = await this.listIncidents({
            since: startDate,
            until: endDate,
            status: ['triggered', 'acknowledged', 'resolved']
        });
        const metrics = {
            total: incidents.length,
            byUrgency: {
                high: 0,
                low: 0
            },
            bySeverity: {
                critical: 0,
                error: 0,
                warning: 0,
                info: 0
            },
            byStatus: {
                triggered: 0,
                acknowledged: 0,
                resolved: 0
            },
            averageResolutionTime: 0,
            totalResolutionTime: 0
        };
        incidents.forEach(incident => {
            if (incident.urgency === 'high')
                metrics.byUrgency.high++;
            else
                metrics.byUrgency.low++;
            metrics.byStatus[incident.status]++;
            if (incident.status === 'resolved' && incident.created_at && incident.resolved_at) {
                const created = new Date(incident.created_at);
                const resolved = new Date(incident.resolved_at);
                const resolutionTime = resolved.getTime() - created.getTime();
                metrics.totalResolutionTime += resolutionTime;
            }
        });
        const resolvedCount = metrics.byStatus.resolved;
        if (resolvedCount > 0) {
            metrics.averageResolutionTime = metrics.totalResolutionTime / resolvedCount;
        }
        return metrics;
    }
}
exports.PagerDutyService = PagerDutyService;
exports.pagerDuty = PagerDutyService.getInstance();
//# sourceMappingURL=pagerduty.service.js.map