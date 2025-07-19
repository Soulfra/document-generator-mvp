import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
interface AuthOptions {
    role?: string;
    optional?: boolean;
    platformTokens?: number;
    trustTier?: string[];
}
interface AuthenticatedUser {
    id: string;
    email?: string;
    displayName?: string;
    platformTokens: number;
    totalEarnings: number;
    referralCode?: string;
    metadata?: any;
    userNumber?: number;
    lastActiveAt?: Date;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
            authType?: 'bearer' | 'api-key' | 'session';
        }
    }
}
export declare const generateToken: (payload: any) => never;
export declare const verifyToken: (token: string) => string | jwt.JwtPayload | null;
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireTokens: (requiredTokens: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const tokenBasedRateLimit: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const generateApiKey: (userId: string, name: string, options?: any) => Promise<{
    key: string;
    masked: string;
}>;
export declare const revokeToken: (token: string) => Promise<void>;
export declare function authentication(options?: AuthOptions): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function generateTokenLegacy(userId: string, role?: string): string;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map