export interface TestGeneratorConfig {
    [key: string]: any;
}
export interface TestGeneratorResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Test Generator Service
 * Price: $4.0
 * TEST MAXED SYSTEM - Simple test without threading
 */
export declare function processTestGenerator(jobId: string, config: TestGeneratorConfig, progressCallback?: (progress: number) => void): Promise<TestGeneratorResult>;
//# sourceMappingURL=testGenerator.service.d.ts.map