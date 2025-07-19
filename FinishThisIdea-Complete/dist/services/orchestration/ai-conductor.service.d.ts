export interface ThoughtNode {
    id: string;
    content: string;
    reasoning: string;
    confidence: number;
    children: ThoughtNode[];
    parent?: string;
    depth: number;
    evaluation?: {
        feasibility: number;
        impact: number;
        effort: number;
        risk: number;
    };
}
export interface OrchestrationPlan {
    id: string;
    goal: string;
    steps: OrchestrationStep[];
    thoughtTree: ThoughtNode;
    estimatedDuration: number;
    confidence: number;
    fallbackPlan?: OrchestrationPlan;
}
export interface OrchestrationStep {
    id: string;
    type: 'analysis' | 'generation' | 'validation' | 'coordination' | 'synthesis';
    description: string;
    requiredCapabilities: string[];
    dependencies: string[];
    agentId?: string;
    taskId?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    estimatedDuration: number;
}
export interface SemanticCluster {
    id: string;
    centroid: number[];
    tasks: string[];
    theme: string;
    confidence: number;
    lastUpdated: Date;
}
export declare class AIConductorService {
    private activePlans;
    private semanticClusters;
    private performanceHistory;
    private readonly REDIS_PREFIX;
    constructor();
    createOrchestrationPlan(goal: string, context?: Record<string, any>, constraints?: Record<string, any>): Promise<OrchestrationPlan>;
    executePlan(planId: string): Promise<any>;
    private generateThoughtTree;
    private buildThoughtPrompt;
    private parseThoughtResponse;
    private extractBestPath;
    private calculateNodeScore;
    private thoughtsToSteps;
    private inferStepType;
    private inferCapabilities;
    private estimateStepDuration;
    private executeSteps;
    private waitForTaskCompletion;
    private calculatePlanConfidence;
    private calculateAgentAvailability;
    private generateFallbackPlan;
    private recordPlanPerformance;
    private startPatternLearning;
    private analyzePatterns;
    getStats(): {
        activePlans: number;
        totalPlans: number;
        averageConfidence: number;
        successRate: number;
    };
    private persistPlan;
    private persistPerformanceHistory;
    private loadPerformanceHistory;
}
export declare const aiConductor: AIConductorService;
//# sourceMappingURL=ai-conductor.service.d.ts.map