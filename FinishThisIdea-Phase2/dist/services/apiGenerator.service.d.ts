export interface ApiGeneratorConfig {
    [key: string]: any;
}
export interface ApiGeneratorResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Api Generator Service
 * Price: $5.0
 * API ROUTER - Central routing layer for the platform
 */
export declare function processApiGenerator(jobId: string, config: ApiGeneratorConfig, progressCallback?: (progress: number) => void): Promise<ApiGeneratorResult>;
//# sourceMappingURL=apiGenerator.service.d.ts.map