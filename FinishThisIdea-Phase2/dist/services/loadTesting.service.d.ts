export interface LoadTestingConfig {
    [key: string]: any;
}
export interface LoadTestingResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Load Testing Service
 * Price: $5.0
 * ECONOMY STRESS TEST - Actually test if our economy works under load
 */
export declare function processLoadTesting(jobId: string, config: LoadTestingConfig, progressCallback?: (progress: number) => void): Promise<LoadTestingResult>;
//# sourceMappingURL=loadTesting.service.d.ts.map