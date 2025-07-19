import { BaseAgent } from './base-agent';
import { AgentTask } from '../agent-registry.service';
export declare class CodeAnalysisAgent extends BaseAgent {
    constructor();
    processTask(task: AgentTask): Promise<any>;
    private analyzeCode;
    private reviewCode;
    private detectBugs;
    private optimizeCode;
    private parseAnalysisResponse;
}
export declare const codeAnalysisAgent: CodeAnalysisAgent;
//# sourceMappingURL=code-analysis-agent.d.ts.map