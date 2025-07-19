import { Router } from 'express';
export interface APIEndpoint {
    method: string;
    path: string;
    summary: string;
    description?: string;
    tags?: string[];
    parameters?: OpenAPIParameter[];
    requestBody?: OpenAPIRequestBody;
    responses: Record<string, OpenAPIResponse>;
    security?: OpenAPISecurity[];
}
export interface OpenAPIParameter {
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    description?: string;
    required?: boolean;
    schema: OpenAPISchema;
    example?: any;
}
export interface OpenAPIRequestBody {
    description?: string;
    required?: boolean;
    content: Record<string, {
        schema: OpenAPISchema;
        example?: any;
    }>;
}
export interface OpenAPIResponse {
    description: string;
    content?: Record<string, {
        schema: OpenAPISchema;
        example?: any;
    }>;
    headers?: Record<string, OpenAPIHeader>;
}
export interface OpenAPIHeader {
    description?: string;
    schema: OpenAPISchema;
}
export interface OpenAPISchema {
    type?: string;
    format?: string;
    items?: OpenAPISchema;
    properties?: Record<string, OpenAPISchema>;
    required?: string[];
    example?: any;
    enum?: any[];
    $ref?: string;
}
export interface OpenAPISecurity {
    [key: string]: string[];
}
export interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
        contact?: {
            name: string;
            url: string;
            email: string;
        };
        license?: {
            name: string;
            url: string;
        };
    };
    servers: Array<{
        url: string;
        description: string;
    }>;
    paths: Record<string, Record<string, any>>;
    components: {
        schemas: Record<string, OpenAPISchema>;
        securitySchemes: Record<string, any>;
        responses?: Record<string, OpenAPIResponse>;
        parameters?: Record<string, OpenAPIParameter>;
    };
    security: OpenAPISecurity[];
    tags: Array<{
        name: string;
        description: string;
    }>;
}
export declare class OpenAPIGeneratorService {
    private spec;
    private routes;
    constructor();
    private createBaseSpec;
    private createBaseSchemas;
    private createCommonResponses;
    private createCommonParameters;
    registerEndpoint(endpoint: APIEndpoint): void;
    private normalizePath;
    private addPathToSpec;
    discoverEndpoints(router: Router, basePath?: string): void;
    private inferTags;
    private capitalizeFirst;
    generateSpec(): OpenAPISpec;
    generateJSON(): string;
    generateYAML(): string;
    saveToFile(filePath: string, format?: 'json' | 'yaml'): Promise<void>;
    importExistingDocs(docsData: any): void;
    private convertParameters;
    private convertRequestBody;
    private convertResponses;
    addSchema(name: string, schema: OpenAPISchema): void;
    getEndpointsCount(): number;
    getStats(): {
        paths: number;
        endpoints: number;
        schemas: number;
        tags: number;
    };
}
export declare const openApiGenerator: OpenAPIGeneratorService;
//# sourceMappingURL=openapi-generator.service.d.ts.map