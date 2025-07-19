export interface OrchestrationApiConfig {
    [key: string]: any;
}
export interface OrchestrationApiResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Orchestration Api Service
 * Price: $6.0
 * CREATE AI ORCHESTRATOR - Set up the structure for controlling everything from your phone
 */
export declare function processOrchestrationApi(jobId: string, config: OrchestrationApiConfig, progressCallback?: (progress: number) => void): Promise<OrchestrationApiResult>;
//# sourceMappingURL=orchestrationApi.service.d.ts.map