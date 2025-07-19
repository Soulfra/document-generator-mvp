export interface CodeNavigationConfig {
    [key: string]: any;
}
export interface CodeNavigationResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Code Navigation Service
 * Price: $2.0
 * CODE GPS MVP - Visualize and Fix Your Codebase Chaos
 */
export declare function processCodeNavigation(jobId: string, config: CodeNavigationConfig, progressCallback?: (progress: number) => void): Promise<CodeNavigationResult>;
//# sourceMappingURL=codeNavigation.service.d.ts.map