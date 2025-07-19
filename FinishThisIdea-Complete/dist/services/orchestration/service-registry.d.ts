import { EventEmitter } from 'events';
export interface ServiceConfig {
    name: string;
    url: string;
    health: string;
    version: string;
    dependencies: string[];
    metadata?: Record<string, any>;
}
export interface ServiceStatus {
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    responseTime: number;
    uptime: number;
    errors: number;
    dependencies: Record<string, 'healthy' | 'unhealthy' | 'unknown'>;
}
export declare class ServiceRegistry extends EventEmitter {
    private services;
    private statuses;
    private healthCheckInterval;
    private readonly CHECK_INTERVAL;
    constructor();
    private initialize;
    registerService(config: ServiceConfig): void;
    getServiceStatus(serviceName: string): Promise<ServiceStatus | null>;
    getAllServiceStatuses(): Promise<Record<string, ServiceStatus>>;
    getHealthyServices(): Promise<ServiceConfig[]>;
    getServiceUrl(serviceName: string): Promise<string | null>;
    private startHealthChecking;
    private performHealthChecks;
    private checkServiceHealth;
    private checkDependencies;
    waitForService(serviceName: string, timeoutMs?: number): Promise<boolean>;
    waitForDependencies(serviceName: string, timeoutMs?: number): Promise<boolean>;
    getServiceTopology(): Record<string, string[]>;
    shutdown(): Promise<void>;
}
export declare const serviceRegistry: ServiceRegistry;
//# sourceMappingURL=service-registry.d.ts.map