import { Request, Response, NextFunction } from 'express';
export interface CacheMiddlewareOptions {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    condition?: (req: Request, res: Response) => boolean;
    skipHeaders?: string[];
    varyBy?: string[];
    tags?: string[] | ((req: Request) => string[]);
    compress?: boolean;
}
export interface CachedResponse {
    statusCode: number;
    headers: Record<string, string | string[]>;
    body: any;
    timestamp: number;
    etag?: string;
}
export declare function cacheMiddleware(options?: CacheMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const shortCache: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const mediumCache: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const longCache: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const userSpecificCache: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const publicCache: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function invalidateUserCache(userId: string): Promise<void>;
export declare function invalidateRouteCache(route: string): Promise<void>;
export declare function invalidateTaggedCache(tag: string): Promise<void>;
export declare function conditionalCache(options: CacheMiddlewareOptions & {
    maxRequestSize?: number;
    minResponseSize?: number;
}): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function smartCache(baseOptions?: CacheMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=cache.middleware.d.ts.map