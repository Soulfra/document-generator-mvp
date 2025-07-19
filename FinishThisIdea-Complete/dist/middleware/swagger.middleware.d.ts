import express, { Router } from 'express';
export interface SwaggerOptions {
    basePath?: string;
    title?: string;
    version?: string;
    description?: string;
    termsOfService?: string;
    contact?: {
        name?: string;
        email?: string;
        url?: string;
    };
    license?: {
        name: string;
        url?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    authentication?: boolean;
    customCss?: string;
    customJs?: string;
    customFavIcon?: string;
}
export declare function createSwaggerMiddleware(app: express.Application, options?: SwaggerOptions): Router;
export declare function documentRoute(options: {
    summary: string;
    description?: string;
    tags?: string[];
    responses?: Record<number, {
        description: string;
        example?: any;
    }>;
}): (req: any, res: any, next: any) => void;
//# sourceMappingURL=swagger.middleware.d.ts.map