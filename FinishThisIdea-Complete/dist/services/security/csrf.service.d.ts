import { Request, Response, NextFunction } from 'express';
export interface CSRFConfig {
    secret: string;
    tokenLength: number;
    tokenTTL: number;
    cookieName: string;
    headerName: string;
    ignoredMethods: string[];
    trustedOrigins: string[];
}
export declare class CSRFService {
    private static instance;
    private config;
    constructor(config?: Partial<CSRFConfig>);
    static getInstance(config?: Partial<CSRFConfig>): CSRFService;
    generateToken(sessionId?: string): Promise<string>;
    validateToken(token: string, sessionId?: string): Promise<boolean>;
    invalidateToken(token: string): Promise<void>;
    private createSignature;
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    generateTokenHandler(req: Request, res: Response): Promise<void>;
    cleanupExpiredTokens(): Promise<number>;
}
export declare const csrfService: CSRFService;
//# sourceMappingURL=csrf.service.d.ts.map