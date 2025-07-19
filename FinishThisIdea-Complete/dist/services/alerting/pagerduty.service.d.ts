import { EventEmitter } from 'events';
export interface PagerDutyConfig {
    apiKey: string;
    integrationKey: string;
    serviceId?: string;
    escalationPolicyId?: string;
    baseUrl?: string;
    fromEmail?: string;
}
export interface Incident {
    id?: string;
    incidentKey: string;
    title: string;
    description: string;
    urgency: 'high' | 'low';
    severity: 'critical' | 'error' | 'warning' | 'info';
    service?: string;
    component?: string;
    customDetails?: Record<string, any>;
}
export interface OnCallSchedule {
    id: string;
    name: string;
    users: Array<{
        id: string;
        name: string;
        email: string;
        onCallFrom: Date;
        onCallUntil: Date;
    }>;
}
export declare class PagerDutyService extends EventEmitter {
    private static instance;
    private config;
    private client;
    private incidentCache;
    constructor(config?: Partial<PagerDutyConfig>);
    static getInstance(config?: Partial<PagerDutyConfig>): PagerDutyService;
    private setupEventListeners;
    private createIncidentFromSLO;
    createIncident(incident: Incident): Promise<string>;
    acknowledgeIncident(incidentKey: string): Promise<void>;
    resolveIncident(incidentKey: string): Promise<void>;
    getIncident(incidentId: string): Promise<any>;
    listIncidents(options?: {
        status?: string[];
        urgency?: string[];
        since?: Date;
        until?: Date;
        limit?: number;
    }): Promise<any[]>;
    getOnCallUsers(): Promise<OnCallSchedule[]>;
    addIncidentNote(incidentId: string, note: string, userId?: string): Promise<void>;
    escalateIncident(incidentId: string): Promise<void>;
    createMaintenanceWindow(description: string, startTime: Date, endTime: Date, serviceIds?: string[]): Promise<string>;
    testConnection(): Promise<boolean>;
    getIncidentMetrics(startDate: Date, endDate: Date): Promise<any>;
}
export declare const pagerDuty: PagerDutyService;
//# sourceMappingURL=pagerduty.service.d.ts.map