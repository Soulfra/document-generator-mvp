export interface SecurityFilterConfig {
    [key: string]: any;
}
export interface SecurityFilterResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Security Filter Service
 * Price: $3.0
 * CRINGEPROOF FILTER + CLARITY ENGINE
 */
export declare function processSecurityFilter(jobId: string, config: SecurityFilterConfig, progressCallback?: (progress: number) => void): Promise<SecurityFilterResult>;
//# sourceMappingURL=securityFilter.service.d.ts.map