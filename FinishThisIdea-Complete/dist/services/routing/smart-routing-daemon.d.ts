import { EventEmitter } from 'events';
interface RoutingRequest {
    id: string;
    type: 'code_analysis' | 'ai_query' | 'code_cleanup' | 'document_generation' | 'custom';
    userId: string;
    tenantId?: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    payload: any;
    constraints?: {
        maxResponseTime?: number;
        preferredModel?: string;
        requiredFeatures?: string[];
        budget?: number;
    };
    metadata?: Record<string, any>;
}
interface RoutingDecision {
    requestId: string;
    timestamp: Date;
    scores: {
        internal: number;
        hybrid: number;
        external: number;
        delay: number;
    };
    chosenPath: 'internal' | 'hybrid' | 'external' | 'delay';
    reasoning: string[];
    executionPlan: ExecutionPlan;
    estimatedCost: number;
    estimatedTime: number;
    confidence: number;
}
interface ExecutionPlan {
    path: string;
    phases: ExecutionPhase[];
    timeline: string;
    checkpoints: Checkpoint[];
    fallbackStrategy?: string;
}
interface ExecutionPhase {
    name: string;
    duration: string;
    tasks: string[];
    resources: {
        service: string;
        allocation: number;
    }[];
}
interface Checkpoint {
    name: string;
    condition: string;
    action: string;
}
export declare class SmartRoutingDaemon extends EventEmitter {
    private name;
    private metricsService;
    private aiService;
    private multiTenantService;
    private routingHistory;
    private serviceHealth;
    private systemMetrics;
    private config;
    constructor();
    makeRoutingDecision(request: RoutingRequest): Promise<RoutingDecision>;
    executeRouting(request: RoutingRequest, decision: RoutingDecision): Promise<any>;
    private analyzeRequestComplexity;
    private calculateFeasibilityScores;
    private scoreInternalPath;
    private scoreHybridPath;
    private scoreExternalPath;
    private scoreDelayPath;
    private selectOptimalPath;
    private generateExecutionPlan;
    private generateReasoning;
    private executeInternal;
    private executeHybrid;
    private executeExternal;
    private executeDelayed;
    private executeFallback;
    private getCodeSize;
    private getLanguageComplexity;
    private getSystemLoad;
    private getTenantLimits;
    private calculateTimeline;
    private estimateCostAndTime;
    private calculateConfidence;
    private selectExternalModel;
    private mergeResults;
    private initializeHealthMonitoring;
    private startMetricsCollection;
    private updateServiceHealth;
    getRoutingStats(): {
        totalDecisions: number;
        pathDistribution: Record<string, number>;
        avgConfidence: number;
        avgResponseTime: number;
    };
}
export {};
//# sourceMappingURL=smart-routing-daemon.d.ts.map