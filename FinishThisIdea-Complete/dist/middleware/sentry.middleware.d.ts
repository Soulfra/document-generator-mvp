import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
declare global {
    namespace Express {
        interface Request {
            sentryTransaction?: Sentry.Transaction;
            sentryUser?: {
                id?: string;
                email?: string;
                username?: string;
                tier?: string;
            };
        }
    }
}
export declare const sentryRequestHandler: any;
export declare function sentryEnhancedTracking(req: Request, res: Response, next: NextFunction): void;
export declare function sentryUserContext(req: Request, res: Response, next: NextFunction): void;
export declare function sentryPerformanceMonitoring(req: Request, res: Response, next: NextFunction): void;
export declare function sentryBusinessEvents(req: Request, res: Response, next: NextFunction): void;
export declare function sentrySecurity(req: Request, res: Response, next: NextFunction): void;
export declare const sentryErrorHandler: any;
export declare function sentryEnhancedErrorHandler(error: Error, req: Request, res: Response, next: NextFunction): void;
export declare function sentryCleanup(req: Request, res: Response, next: NextFunction): void;
declare const _default: {
    requestHandler: any;
    enhancedTracking: typeof sentryEnhancedTracking;
    userContext: typeof sentryUserContext;
    performanceMonitoring: typeof sentryPerformanceMonitoring;
    businessEvents: typeof sentryBusinessEvents;
    security: typeof sentrySecurity;
    errorHandler: any;
    enhancedErrorHandler: typeof sentryEnhancedErrorHandler;
    cleanup: typeof sentryCleanup;
};
export default _default;
//# sourceMappingURL=sentry.middleware.d.ts.map