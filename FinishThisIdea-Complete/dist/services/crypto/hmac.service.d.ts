import { Request } from 'express';
export interface SignatureConfig {
    headerName: string;
    timestampHeaderName: string;
    apiKeyHeaderName: string;
    maxAgeSeconds: number;
    replayProtection: boolean;
    requiredHeaders: string[];
}
export interface SignedRequest {
    method: string;
    path: string;
    query?: any;
    body?: any;
    headers: Record<string, string>;
    timestamp: number;
    apiKey: string;
}
export declare class HMACService {
    private static instance;
    private config;
    private nonceCache;
    constructor(config?: Partial<SignatureConfig>);
    static getInstance(config?: Partial<SignatureConfig>): HMACService;
    signRequest(request: SignedRequest, apiSecret: string): Promise<{
        signature: string;
        headers: Record<string, string>;
    }>;
    verifyRequest(req: Request, apiSecret: string): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    private createCanonicalRequest;
    private createCanonicalRequestFromExpress;
    private canonicalizeQuery;
    private canonicalizeHeaders;
    private hashBody;
    private checkReplay;
    private storeNonce;
    private cleanupNonces;
    generateSignedUrl(url: string, expiresIn: number, apiKey: string, apiSecret: string): string;
    verifySignedUrl(url: string, apiSecret: string): {
        valid: boolean;
        reason?: string;
    };
}
export declare const hmacService: HMACService;
//# sourceMappingURL=hmac.service.d.ts.map