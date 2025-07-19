import { Request, Response, NextFunction } from 'express';
export interface SessionConfig {
    secret: string;
    maxAge: number;
    maxConcurrentSessions: number;
    cookieName: string;
    domain?: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    enableSessionRotation: boolean;
    rotationInterval: number;
}
export interface SessionData {
    userId?: string;
    email?: string;
    role?: string;
    tier?: string;
    loginTime: number;
    lastActivity: number;
    ipAddress: string;
    userAgent: string;
    csrfToken?: string;
    permissions?: string[];
}
export declare class SessionService {
    private static instance;
    private config;
    private redisStore;
    constructor(config?: Partial<SessionConfig>);
    static getInstance(config?: Partial<SessionConfig>): SessionService;
    getSessionMiddleware(): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    createSession(userId: string, userData: Partial<SessionData>, req: Request): Promise<string>;
    getSession(sessionId: string): Promise<SessionData | null>;
    updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void>;
    destroySession(sessionId: string): Promise<void>;
    destroyAllUserSessions(userId: string, exceptSessionId?: string): Promise<void>;
    private enforceSessionLimit;
    private generateSessionId;
    blacklistSession(sessionId: string, reason: string): Promise<void>;
    isSessionBlacklisted(sessionId: string): Promise<boolean>;
    validationMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    private shouldRotateSession;
    getUserActiveSessions(userId: string): Promise<Array<Partial<SessionData>>>;
    cleanupExpiredSessions(): Promise<number>;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=session.service.d.ts.map