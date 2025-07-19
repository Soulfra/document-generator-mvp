import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const commonSchemas: {
    uuid: z.ZodString;
    email: z.ZodString;
    safeString: z.ZodEffects<z.ZodString, string, string>;
    fileName: z.ZodEffects<z.ZodString, string, string>;
    apiKey: z.ZodEffects<z.ZodString, string, string>;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
    }>;
};
export declare const rateLimitConfigs: {
    auth: import("express-rate-limit").RateLimitRequestHandler;
    payment: import("express-rate-limit").RateLimitRequestHandler;
    api: import("express-rate-limit").RateLimitRequestHandler;
    general: import("express-rate-limit").RateLimitRequestHandler;
    upload: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const slowDownConfigs: {
    api: import("express-rate-limit").RateLimitRequestHandler;
};
export declare function threatDetection(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function secretsProtection(): (req: Request, res: Response, next: NextFunction) => void;
export declare const corsOptions: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
};
export declare function validateRequest(schema: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
}): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function securityHeaders(): (req: Request, res: Response, next: NextFunction) => void;
export declare function securityMonitoring(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=security.middleware.d.ts.map