export interface DistributedSystemConfig {
    [key: string]: any;
}
export interface DistributedSystemResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Distributed System Service
 * Price: $20.0
 * SOULFRA DECENTRALIZED PLATFORM
 */
export declare function processDistributedSystem(jobId: string, config: DistributedSystemConfig, progressCallback?: (progress: number) => void): Promise<DistributedSystemResult>;
//# sourceMappingURL=distributedSystem.service.d.ts.map