export interface SecurityEncodingConfig {
    [key: string]: any;
}
export interface SecurityEncodingResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Security Encoding Service
 * Price: $2.0
 * Database UTF-8 Encoding Fix
 */
export declare function processSecurityEncoding(jobId: string, config: SecurityEncodingConfig, progressCallback?: (progress: number) => void): Promise<SecurityEncodingResult>;
//# sourceMappingURL=securityEncoding.service.d.ts.map