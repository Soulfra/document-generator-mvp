export interface TestGenerationConfig {
    testTypes: ('unit' | 'integration' | 'e2e' | 'performance')[];
    framework: 'jest' | 'mocha' | 'vitest' | 'playwright' | 'cypress' | 'auto';
    coverageTarget: number;
    includeSnapshots: boolean;
    includeMocks: boolean;
    includePerformance: boolean;
    testDataGeneration: boolean;
    mutationTesting: boolean;
}
export interface TestGenerationResult {
    outputFileUrl: string;
    generatedTests: {
        unit: number;
        integration: number;
        e2e: number;
        performance: number;
    };
    estimatedCoverage: number;
    testFramework: string;
    processingCost: number;
}
export declare function generateTests(jobId: string, config: TestGenerationConfig, progressCallback?: (progress: number) => void): Promise<TestGenerationResult>;
//# sourceMappingURL=test-generator.service.d.ts.map