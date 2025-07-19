import { Request, Response, NextFunction } from 'express';
interface AuthOptions {
    role?: string;
    optional?: boolean;
}
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role?: string;
            };
        }
    }
}
export declare function authentication(options?: AuthOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function generateToken(userId: string, role?: string): string;
export declare function apiKeyAuth(req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map