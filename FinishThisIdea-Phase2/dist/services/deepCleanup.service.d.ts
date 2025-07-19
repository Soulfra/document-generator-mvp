export interface DeepCleanupConfig {
    [key: string]: any;
}
export interface DeepCleanupResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Deep Cleanup Service
 * Price: $5.0
 * CLEAN MASTER CONTROL - Actually connects to real services
 */
export declare function processDeepCleanup(jobId: string, config: DeepCleanupConfig, progressCallback?: (progress: number) => void): Promise<DeepCleanupResult>;
//# sourceMappingURL=deepCleanup.service.d.ts.map