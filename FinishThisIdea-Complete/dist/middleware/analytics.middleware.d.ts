import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            sessionId?: string;
            analytics?: {
                track: (event: string, properties?: Record<string, any>) => Promise<void>;
                identify: (userId: string, traits?: Record<string, any>) => Promise<void>;
                pageView: (page: string, properties?: Record<string, any>) => Promise<void>;
            };
        }
    }
}
export interface AnalyticsMiddlewareOptions {
    trackPageViews?: boolean;
    trackApiCalls?: boolean;
    excludePaths?: string[];
    includeRequestData?: boolean;
    sessionTimeout?: number;
}
export declare class AnalyticsMiddleware {
    private options;
    constructor(options?: AnalyticsMiddlewareOptions);
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    sessionMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    userMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    businessEventsMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private shouldExcludePath;
    private initializeSession;
    private attachAnalyticsHelpers;
    private trackPageView;
    private trackApiCall;
    private addResponseTracking;
    private createNewSession;
    private trackBusinessEvent;
    private getClientIP;
    private extractBrowser;
    private extractOS;
}
export declare const analyticsMiddleware: AnalyticsMiddleware;
export declare const trackingSuite: {
    analytics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    session: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    user: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    businessEvents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
//# sourceMappingURL=analytics.middleware.d.ts.map