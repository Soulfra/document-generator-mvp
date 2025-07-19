export interface AgentStatus {
    id: string;
    name: string;
    type: string;
    status: 'idle' | 'working' | 'error' | 'paused';
    currentTask?: {
        id: string;
        type: string;
        progress: number;
        startedAt: Date;
        estimatedCompletion?: Date;
    };
    performance: {
        tasksCompleted: number;
        avgCompletionTime: number;
        successRate: number;
        lastActive: Date;
    };
    capabilities: string[];
    queueLength: number;
    healthScore: number;
}
export interface AgentMessage {
    id: string;
    agentId: string;
    type: 'status' | 'task_update' | 'error' | 'completion' | 'collaboration';
    content: any;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}
export interface AgentTeamStats {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    avgResponseTime: number;
    systemHealth: number;
    collaborationEvents: number;
}
export interface UseRealtimeAgentsReturn {
    agents: AgentStatus[];
    teamStats: AgentTeamStats;
    messages: AgentMessage[];
    isConnected: boolean;
    error: string | null;
    getAgent: (id: string) => AgentStatus | undefined;
    getAgentsByType: (type: string) => AgentStatus[];
    getActiveAgents: () => AgentStatus[];
    sendTaskToAgent: (agentId: string, task: any) => void;
    pauseAgent: (agentId: string) => void;
    resumeAgent: (agentId: string) => void;
    restartAgent: (agentId: string) => void;
    subscribeToAgent: (agentId: string, callback: (update: any) => void) => () => void;
    clearMessages: () => void;
}
export declare const useRealtimeAgents: () => UseRealtimeAgentsReturn;
export default useRealtimeAgents;
//# sourceMappingURL=useRealtimeAgents.d.ts.map