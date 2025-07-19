export interface ApiGenerationConfig {
    apiType: 'rest' | 'graphql' | 'both';
    authentication: 'none' | 'jwt' | 'api-key' | 'oauth';
    includeValidation: boolean;
    includePagination: boolean;
    includeErrorHandling: boolean;
    includeOpenApiSpec: boolean;
    includeTests: boolean;
    framework: 'express' | 'fastify' | 'nestjs' | 'auto';
    database: 'postgresql' | 'mysql' | 'mongodb' | 'auto';
    generateSDK: boolean;
}
export interface ApiGenerationResult {
    outputFileUrl: string;
    endpointCount: number;
    modelCount: number;
    openApiSpec?: any;
    processingCost: number;
}
export declare function generateAPI(jobId: string, config: ApiGenerationConfig, progressCallback?: (progress: number) => void): Promise<ApiGenerationResult>;
//# sourceMappingURL=api-generator.service.d.ts.map