import { EventEmitter } from 'events';
export interface SLI {
    name: string;
    description: string;
    measurement: 'availability' | 'latency' | 'error_rate' | 'throughput' | 'custom';
    target: number;
    unit: string;
}
export interface SLO {
    id: string;
    name: string;
    description: string;
    slis: SLI[];
    target: number;
    window: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    alertThresholds: {
        warning: number;
        critical: number;
    };
}
export interface SLAMetric {
    timestamp: Date;
    sloId: string;
    sliName: string;
    value: number;
    target: number;
    isViolation: boolean;
}
export declare class SLASLOService extends EventEmitter {
    private static instance;
    private slos;
    private checkInterval;
    private defaultSLOs;
    constructor();
    static getInstance(): SLASLOService;
    private initializeSLOs;
    private startMonitoring;
    private checkAllSLOs;
    private checkSLO;
    private measureSLI;
    private measureAvailability;
    private measureLatency;
    private measureErrorRate;
    private measureThroughput;
    private measureCustom;
    private calculateErrorBudget;
    private storeMetrics;
    private getRetentionTTL;
    getSLOStatus(sloId?: string): Promise<any>;
    private getSingleSLOStatus;
    getSLOHistory(sloId: string, window: string): Promise<any[]>;
    private getWindowMilliseconds;
    private calculateStatus;
    createSLO(slo: SLO): void;
    updateSLO(sloId: string, updates: Partial<SLO>): void;
    deleteSLO(sloId: string): Promise<void>;
    generateReport(sloId: string, startDate: Date, endDate: Date): Promise<any>;
    shutdown(): void;
}
export declare const slaSloService: SLASLOService;
//# sourceMappingURL=sla-slo.service.d.ts.map