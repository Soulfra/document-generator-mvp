import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            startTime?: number;
        }
    }
}
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
export declare function skipLogging(paths: string[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=logging.middleware.d.ts.map