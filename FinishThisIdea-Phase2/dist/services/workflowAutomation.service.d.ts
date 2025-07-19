export interface WorkflowAutomationConfig {
    [key: string]: any;
}
export interface WorkflowAutomationResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Workflow Automation Service
 * Price: $15.0
 * Department Automation System
 */
export declare function processWorkflowAutomation(jobId: string, config: WorkflowAutomationConfig, progressCallback?: (progress: number) => void): Promise<WorkflowAutomationResult>;
//# sourceMappingURL=workflowAutomation.service.d.ts.map