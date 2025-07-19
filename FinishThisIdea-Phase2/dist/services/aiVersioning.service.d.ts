export interface AiVersioningConfig {
    [key: string]: any;
}
export interface AiVersioningResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Ai Versioning Service
 * Price: $9.0
 * AI ECONOMY GITHUB AUTOMATION - Automated PR creation for AI collaboration
 */
export declare function processAiVersioning(jobId: string, config: AiVersioningConfig, progressCallback?: (progress: number) => void): Promise<AiVersioningResult>;
//# sourceMappingURL=aiVersioning.service.d.ts.map