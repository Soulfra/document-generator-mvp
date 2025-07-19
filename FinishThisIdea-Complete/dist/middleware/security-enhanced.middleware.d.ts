import { Request, Response, NextFunction, Express } from 'express';
import cors from 'cors';
export interface SecurityConfig {
    enableCORS: boolean;
    enableRateLimit: boolean;
    enableCSRF: boolean;
    enableInputValidation: boolean;
    enableAttackPrevention: boolean;
    enableAPIVersioning: boolean;
    trustedOrigins: string[];
    rateLimitOptions: {
        windowMs: number;
        max: number;
        skipSuccessfulRequests: boolean;
    };
}
export declare class SecurityMiddleware {
    private static instance;
    private config;
    constructor(config?: Partial<SecurityConfig>);
    static getInstance(config?: Partial<SecurityConfig>): SecurityMiddleware;
    getCORSMiddleware(): ((req: Request, res: Response, next: NextFunction) => void) | ((req: cors.CorsRequest, res: {
        statusCode?: number | undefined;
        setHeader(key: string, value: string): any;
        end(): any;
    }, next: (err?: any) => any) => void);
    getSecurityHeaders(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    getRateLimitMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    getSlowDownMiddleware(): import("express-rate-limit").RateLimitRequestHandler;
    getAttackPreventionMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    getAPIVersioningMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    getRequestTrackingMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    applySecurityMiddleware(app: Express): void;
    createEndpointLimiters(): {
        auth: import("express-rate-limit").RateLimitRequestHandler;
        api: import("express-rate-limit").RateLimitRequestHandler;
        upload: import("express-rate-limit").RateLimitRequestHandler;
        payment: import("express-rate-limit").RateLimitRequestHandler;
    };
}
export declare const securityMiddleware: SecurityMiddleware;
//# sourceMappingURL=security-enhanced.middleware.d.ts.map