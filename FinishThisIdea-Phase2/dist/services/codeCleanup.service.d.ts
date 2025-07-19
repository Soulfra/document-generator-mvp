export interface CodeCleanupConfig {
    [key: string]: any;
}
export interface CodeCleanupResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Code Cleanup Service
 * Price: $1.0
 * AUTOMATED CODE ASSISTANT - Actually helps you improve code SAFELY
 */
export declare function processCodeCleanup(jobId: string, config: CodeCleanupConfig, progressCallback?: (progress: number) => void): Promise<CodeCleanupResult>;
//# sourceMappingURL=codeCleanup.service.d.ts.map