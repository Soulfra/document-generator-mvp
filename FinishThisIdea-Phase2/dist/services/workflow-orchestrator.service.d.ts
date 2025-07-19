import Bull from 'bull';
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    price: number;
}
export interface WorkflowStep {
    service: string;
    queue: Bull.Queue;
    dependsOn?: string[];
    config?: any;
}
export declare const WORKFLOWS: Record<string, WorkflowDefinition>;
export declare class WorkflowOrchestrator {
    private activeWorkflows;
    executeWorkflow(workflowId: string, bundleId: string, inputFileUrl: string, userId: string): Promise<void>;
    getWorkflowStatus(bundleId: string): WorkflowStatus | null;
}
interface WorkflowStatus {
    bundleId: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    completedSteps: string[];
    currentStep: string | null;
    progress: number;
}
export declare const workflowOrchestrator: WorkflowOrchestrator;
export {};
//# sourceMappingURL=workflow-orchestrator.service.d.ts.map