export interface IntegrationTestsConfig {
    [key: string]: any;
}
export interface IntegrationTestsResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Integration Tests Service
 * Price: $3.5
 * CONTAINER MONITOR - Keeps everything alive
 */
export declare function processIntegrationTests(jobId: string, config: IntegrationTestsConfig, progressCallback?: (progress: number) => void): Promise<IntegrationTestsResult>;
//# sourceMappingURL=integrationTests.service.d.ts.map