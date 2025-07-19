export interface BusinessDocsConfig {
    [key: string]: any;
}
export interface BusinessDocsResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Business Docs Service
 * Price: $4.0
 * DOMAIN BUSINESS MATCHER - Match your 100 GoDaddy domains to business ideas
 */
export declare function processBusinessDocs(jobId: string, config: BusinessDocsConfig, progressCallback?: (progress: number) => void): Promise<BusinessDocsResult>;
//# sourceMappingURL=businessDocs.service.d.ts.map