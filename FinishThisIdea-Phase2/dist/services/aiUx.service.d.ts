export interface AiUxConfig {
    [key: string]: any;
}
export interface AiUxResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Ai Ux Service
 * Price: $7.0
 * SYNTHETIC EMPATHY ENGINE - Cal Riven as Mirror of Self
 */
export declare function processAiUx(jobId: string, config: AiUxConfig, progressCallback?: (progress: number) => void): Promise<AiUxResult>;
//# sourceMappingURL=aiUx.service.d.ts.map