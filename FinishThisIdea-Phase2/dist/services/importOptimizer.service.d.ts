export interface ImportOptimizerConfig {
    [key: string]: any;
}
export interface ImportOptimizerResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Import Optimizer Service
 * Price: $1.5
 * FIX IMPORTS - Quick fixes for missing imports
 */
export declare function processImportOptimizer(jobId: string, config: ImportOptimizerConfig, progressCallback?: (progress: number) => void): Promise<ImportOptimizerResult>;
//# sourceMappingURL=importOptimizer.service.d.ts.map