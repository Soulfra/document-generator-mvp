export interface EnterpriseSuiteConfig {
    [key: string]: any;
}
export interface EnterpriseSuiteResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Enterprise Suite Service
 * Price: $25.0
 * SOULFRA ENTERPRISE PLATFORM - MAXED OUT
 */
export declare function processEnterpriseSuite(jobId: string, config: EnterpriseSuiteConfig, progressCallback?: (progress: number) => void): Promise<EnterpriseSuiteResult>;
//# sourceMappingURL=enterpriseSuite.service.d.ts.map