import { EventEmitter } from 'events';
import { AgentCapability, AgentTask } from '../agent-registry.service';
export interface AgentConfig {
    name: string;
    type: string;
    version: string;
    description: string;
    capabilities: AgentCapability[];
    configuration: Record<string, any>;
}
export declare abstract class BaseAgent extends EventEmitter {
    protected id: string;
    protected config: AgentConfig;
    protected isRunning: boolean;
    protected currentTask?: AgentTask;
    constructor(config: AgentConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    canHandle(taskType: string): boolean;
    abstract processTask(task: AgentTask): Promise<any>;
    private startTaskPolling;
    private checkForTasks;
    executeTask(task: AgentTask): Promise<void>;
    protected updateProgress(progress: number, result?: any): Promise<void>;
    getId(): string;
    getConfig(): AgentConfig;
    isAgentRunning(): boolean;
    getCurrentTask(): AgentTask | undefined;
}
//# sourceMappingURL=base-agent.d.ts.map