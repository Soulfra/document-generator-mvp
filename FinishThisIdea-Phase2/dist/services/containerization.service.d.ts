export interface ContainerizationConfig {
    [key: string]: any;
}
export interface ContainerizationResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Containerization Service
 * Price: $5.0
 * DOCKER SOLUTION - No more timeouts, no more silent errors
 */
export declare function processContainerization(jobId: string, config: ContainerizationConfig, progressCallback?: (progress: number) => void): Promise<ContainerizationResult>;
//# sourceMappingURL=containerization.service.d.ts.map