export interface UxOptimizerConfig {
    [key: string]: any;
}
export interface UxOptimizerResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Ux Optimizer Service
 * Price: $6.0
 * EMPATHY GAME ENGINE - Turning Gamers into Support Heroes
 */
export declare function processUxOptimizer(jobId: string, config: UxOptimizerConfig, progressCallback?: (progress: number) => void): Promise<UxOptimizerResult>;
//# sourceMappingURL=uxOptimizer.service.d.ts.map