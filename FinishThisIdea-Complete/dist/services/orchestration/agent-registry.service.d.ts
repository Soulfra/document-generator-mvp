export interface AgentCapability {
    name: string;
    description: string;
    inputTypes: string[];
    outputTypes: string[];
    complexity: 'low' | 'medium' | 'high';
    estimatedCost: number;
}
export interface AgentDefinition {
    id: string;
    name: string;
    type: string;
    version: string;
    description: string;
    capabilities: AgentCapability[];
    configuration: Record<string, any>;
    status: 'idle' | 'working' | 'failed' | 'maintenance';
    performance: {
        successRate: number;
        averageResponseTime: number;
        totalTasks: number;
        lastSeen: Date;
    };
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        tags: string[];
    };
}
export interface AgentTask {
    id: string;
    agentId: string;
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    payload: Record<string, any>;
    status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
    progress: number;
    result?: Record<string, any>;
    error?: string;
    createdAt: Date;
    assignedAt?: Date;
    completedAt?: Date;
    timeoutAt: Date;
}
export declare class AgentRegistryService {
    private agents;
    private tasks;
    private taskQueue;
    private readonly REDIS_PREFIX;
    constructor();
    registerAgent(definition: Omit<AgentDefinition, 'id' | 'metadata'>): Promise<string>;
    unregisterAgent(agentId: string): Promise<boolean>;
    submitTask(type: string, payload: Record<string, any>, priority?: AgentTask['priority'], timeoutMinutes?: number): Promise<string>;
    getTask(taskId: string): AgentTask | undefined;
    getAgentTasks(agentId: string): AgentTask[];
    getAgent(agentId: string): AgentDefinition | undefined;
    listAgents(filter?: {
        type?: string;
        status?: AgentDefinition['status'];
        capabilities?: string[];
    }): AgentDefinition[];
    updateAgentStatus(agentId: string, status: AgentDefinition['status']): Promise<boolean>;
    updateTaskProgress(taskId: string, progress: number, result?: Record<string, any>): Promise<boolean>;
    failTask(taskId: string, error: string): Promise<boolean>;
    getStats(): {
        agents: {
            total: number;
            byStatus: Record<string, number>;
            byType: Record<string, number>;
        };
        tasks: {
            total: number;
            byStatus: Record<string, number>;
            byType: Record<string, number>;
            queueLength: number;
        };
    };
    private findBestAgent;
    private processTaskQueue;
    private simulateTaskProcessing;
    private startTaskProcessor;
    private startHealthChecker;
    private checkAgentHealth;
    private checkTaskTimeouts;
    private updateAgentPerformance;
    private sortTaskQueue;
    private groupBy;
    private persistAgent;
    private persistTask;
    private removeFromPersistence;
    private loadFromPersistence;
}
export declare const agentRegistry: AgentRegistryService;
//# sourceMappingURL=agent-registry.service.d.ts.map