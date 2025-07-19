export interface ServiceChainingConfig {
    [key: string]: any;
}
export interface ServiceChainingResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Service Chaining Service
 * Price: $7.0
 * AUTOMATED HANDOFF ENGINE - Maxed Out Version
 */
export declare function processServiceChaining(jobId: string, config: ServiceChainingConfig, progressCallback?: (progress: number) => void): Promise<ServiceChainingResult>;
//# sourceMappingURL=serviceChaining.service.d.ts.map