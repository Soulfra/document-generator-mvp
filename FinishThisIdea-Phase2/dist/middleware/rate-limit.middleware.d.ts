import { Request, Response, NextFunction } from 'express';
interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
}
export declare function createRateLimiter(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const strictRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=rate-limit.middleware.d.ts.map