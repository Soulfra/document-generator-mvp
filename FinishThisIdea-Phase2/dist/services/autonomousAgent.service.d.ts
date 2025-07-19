export interface AutonomousAgentConfig {
    [key: string]: any;
}
export interface AutonomousAgentResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Autonomous Agent Service
 * Price: $10.0
 * AUTONOMOUS SIMPLE - Works within 2 minute limit
 */
export declare function processAutonomousAgent(jobId: string, config: AutonomousAgentConfig, progressCallback?: (progress: number) => void): Promise<AutonomousAgentResult>;
//# sourceMappingURL=autonomousAgent.service.d.ts.map