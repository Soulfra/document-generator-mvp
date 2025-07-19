import { EventEmitter } from 'events';
import { BaseAgent } from './agents/base-agent';
export interface AgentManagerConfig {
    autoStart: boolean;
    autoScale: boolean;
    maxAgents: number;
    scaleThreshold: number;
    healthCheckInterval: number;
}
export declare class AgentManagerService extends EventEmitter {
    private agents;
    private config;
    private healthCheckTimer?;
    constructor(config?: Partial<AgentManagerConfig>);
    registerAgent(agent: BaseAgent): Promise<string>;
    unregisterAgent(agentId: string): Promise<boolean>;
    getAgent(agentId: string): BaseAgent | undefined;
    listAgents(): BaseAgent[];
    getAgentsByType(type: string): BaseAgent[];
    getStats(): {
        totalAgents: number;
        agentsByType: Record<string, number>;
        activeAgents: number;
        idleAgents: number;
    };
    private autoStartAgents;
    private startHealthMonitoring;
    private performHealthCheck;
    private checkAutoScaling;
    shutdown(): Promise<void>;
    getHealthStatus(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        totalAgents: number;
        healthyAgents: number;
        issues: string[];
    };
}
export declare const agentManager: AgentManagerService;
//# sourceMappingURL=agent-manager.service.d.ts.map