import { EventEmitter } from 'events';
export interface ServiceStatus {
    name: string;
    displayName: string;
    status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
    description?: string;
    lastChecked: Date;
    uptime90d: number;
    responseTime?: number;
    incidents?: StatusIncident[];
}
export interface StatusIncident {
    id: string;
    service: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    severity: 'minor' | 'major' | 'critical';
    title: string;
    description: string;
    startedAt: Date;
    resolvedAt?: Date;
    updates: IncidentUpdate[];
}
export interface IncidentUpdate {
    id: string;
    timestamp: Date;
    status: string;
    message: string;
    author?: string;
}
export interface SystemStatus {
    overall: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
    lastUpdated: Date;
    services: ServiceStatus[];
    activeIncidents: StatusIncident[];
    recentIncidents: StatusIncident[];
    maintenanceWindows: MaintenanceWindow[];
    metrics: {
        uptime30d: number;
        uptime90d: number;
        averageResponseTime: number;
        sloCompliance: number;
    };
}
export interface MaintenanceWindow {
    id: string;
    title: string;
    description: string;
    affectedServices: string[];
    scheduledFor: Date;
    duration: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
export declare class StatusPageService extends EventEmitter {
    private static instance;
    private services;
    private incidents;
    private maintenanceWindows;
    private checkInterval?;
    constructor();
    static getInstance(): StatusPageService;
    private initializeServices;
    startMonitoring(): Promise<void>;
    stopMonitoring(): void;
    private checkAllServices;
    private checkAPIService;
    private checkDatabase;
    private checkRedis;
    private checkStorage;
    private checkPayments;
    private checkJobs;
    private checkAIServices;
    private checkWebSocket;
    private updateServiceStatus;
    createIncident(data: {
        service: string;
        severity: 'minor' | 'major' | 'critical';
        title: string;
        description: string;
    }): Promise<StatusIncident>;
    updateIncident(incidentId: string, update: {
        status?: StatusIncident['status'];
        message: string;
        author?: string;
    }): Promise<void>;
    private resolveServiceIncidents;
    scheduleMaintenance(data: {
        title: string;
        description: string;
        affectedServices: string[];
        scheduledFor: Date;
        duration: number;
    }): Promise<MaintenanceWindow>;
    getSystemStatus(): Promise<SystemStatus>;
    private updateOverallStatus;
    getStatusHistory(hours?: number): Promise<any[]>;
}
export declare const statusPageService: StatusPageService;
//# sourceMappingURL=status-page.service.d.ts.map