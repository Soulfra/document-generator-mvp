export interface AiConductorConfig {
    [key: string]: any;
}
export interface AiConductorResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Ai Conductor Service
 * Price: $8.0
 * AI CONDUCTOR SYSTEM - The intelligent layer between users and AI builders
 */
export declare function processAiConductor(jobId: string, config: AiConductorConfig, progressCallback?: (progress: number) => void): Promise<AiConductorResult>;
//# sourceMappingURL=aiConductor.service.d.ts.map