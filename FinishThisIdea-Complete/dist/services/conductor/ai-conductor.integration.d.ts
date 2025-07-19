import { EventEmitter } from 'events';
export interface ConductorConfig {
    pythonPath: string;
    conductorScript: string;
    apiPort: number;
    webSocketPort: number;
    dbPath: string;
}
export interface ConversationRequest {
    content: string;
    source: 'claude' | 'gpt4' | 'gemini' | 'local';
    threadId: string;
    userId?: string;
    metadata?: any;
}
export interface ThoughtChainRequest {
    goal: string;
    context: string;
    maxDepth: number;
    userId?: string;
}
export interface ThoughtNode {
    id: string;
    parentId?: string;
    thought: string;
    reasoning: string;
    confidence: number;
    pathScore: number;
    children?: ThoughtNode[];
}
export interface AIBuilder {
    id: string;
    name: string;
    type: 'claude' | 'gpt4' | 'gemini' | 'local';
    status: 'idle' | 'building' | 'blocked' | 'error';
    currentProject?: string;
    capabilities: string[];
    performance: {
        completedTasks: number;
        successRate: number;
        avgResponseTime: number;
    };
}
export interface ProjectState {
    id: string;
    name: string;
    goal: string;
    currentState: string;
    nextActions: string[];
    blockers: string[];
    aiAssignments: Record<string, string>;
    progress: number;
    updatedAt: string;
}
export interface OrchestrationResult {
    projectId: string;
    assignments: Record<string, string>;
    timeline: string[];
    confidence: number;
    estimatedCompletion: string;
}
export declare class AIConductorIntegration extends EventEmitter {
    private config;
    private conductorProcess;
    private isRunning;
    private apiBaseUrl;
    constructor(config?: Partial<ConductorConfig>);
    startConductor(): Promise<void>;
    stopConductor(): Promise<void>;
    ingestConversation(request: ConversationRequest): Promise<void>;
    generateThoughtChain(request: ThoughtChainRequest): Promise<ThoughtNode[]>;
    getAIBuilders(): Promise<AIBuilder[]>;
    orchestrateProject(projectId: string): Promise<OrchestrationResult>;
    getProjectStates(): Promise<ProjectState[]>;
    getConductorStatus(): Promise<any>;
    private checkScriptExists;
    private waitForReady;
    private formatThoughtNodes;
    isRunning(): boolean;
}
export declare const aiConductorIntegration: AIConductorIntegration;
//# sourceMappingURL=ai-conductor.integration.d.ts.map