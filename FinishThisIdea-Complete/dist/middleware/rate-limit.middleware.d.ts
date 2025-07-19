import { Request, Response, NextFunction } from 'express';
interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
    slidingWindow?: boolean;
    trustProxy?: boolean;
    whitelist?: string[];
    blacklist?: string[];
    blockDuration?: number;
    skipRateLimitedPaths?: string[];
}
interface IPSecurityOptions {
    maxFailedAttempts: number;
    blockDuration: number;
    keyPrefix: string;
    monitorEndpoints?: string[];
}
export declare function createAdvancedRateLimiter(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function createIPSecurityMiddleware(options: IPSecurityOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function createRateLimiter(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const rateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const strictRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const uploadRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const authRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const apiRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const ipSecurityMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const ddosProtection: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=rate-limit.middleware.d.ts.map