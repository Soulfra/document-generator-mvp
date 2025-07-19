import { EventEmitter } from 'events';
import { Request, Response, NextFunction } from 'express';
export interface ChaosExperiment {
    id: string;
    name: string;
    description: string;
    type: 'latency' | 'error' | 'resource' | 'network' | 'database';
    target?: string;
    probability: number;
    duration?: number;
    config?: any;
    enabled: boolean;
    schedule?: string;
    tags?: string[];
}
export interface ChaosResult {
    experimentId: string;
    timestamp: Date;
    triggered: boolean;
    affectedRequests: number;
    impact?: string;
    metrics?: any;
}
export declare class ChaosEngineeringService extends EventEmitter {
    private static instance;
    private experiments;
    private activeExperiments;
    private circuitBreakers;
    private isEnabled;
    constructor();
    static getInstance(): ChaosEngineeringService;
    private initializeDefaultExperiments;
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private shouldTrigger;
    private executeExperiment;
    private injectLatency;
    private injectError;
    private injectResourcePressure;
    private injectNetworkFailure;
    private injectDatabaseError;
    private recordResult;
    enableExperiment(experimentId: string): void;
    disableExperiment(experimentId: string): void;
    createExperiment(experiment: ChaosExperiment): void;
    getExperimentResults(experimentId: string, limit?: number): Promise<ChaosResult[]>;
    getExperiments(): ChaosExperiment[];
    getCircuitBreaker(serviceName: string): CircuitBreaker;
}
export declare class CircuitBreaker {
    private serviceName;
    private state;
    private failures;
    private successes;
    private lastFailureTime?;
    private readonly threshold;
    private readonly timeout;
    private readonly successThreshold;
    constructor(serviceName: string);
    execute<T>(operation: () => Promise<T>, fallback?: () => T): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): string;
    reset(): void;
}
export declare const chaosEngineering: ChaosEngineeringService;
//# sourceMappingURL=chaos-engineering.service.d.ts.map