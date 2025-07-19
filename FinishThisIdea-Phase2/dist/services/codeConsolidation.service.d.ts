export interface CodeConsolidationConfig {
    [key: string]: any;
}
export interface CodeConsolidationResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Code Consolidation Service
 * Price: $8.0
 * CONSOLIDATE USING AI ECONOMY
 */
export declare function processCodeConsolidation(jobId: string, config: CodeConsolidationConfig, progressCallback?: (progress: number) => void): Promise<CodeConsolidationResult>;
//# sourceMappingURL=codeConsolidation.service.d.ts.map