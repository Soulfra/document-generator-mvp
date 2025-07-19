import { Request, Response, NextFunction } from 'express';
export interface RequestSigningOptions {
    required?: boolean;
    endpoints?: string[];
    methods?: string[];
    skipPaths?: string[];
    allowUnsigned?: boolean;
}
export declare function createRequestSigningMiddleware(options?: RequestSigningOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireSignature: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalSignature: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function signWebhookRequest(url: string, payload: any, webhookSecret: string): Promise<{
    headers: Record<string, string>;
    signature: string;
}>;
export declare function RequireSignature(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
export declare function validateWebhookSignature(secretKey: string): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=request-signing.middleware.d.ts.map