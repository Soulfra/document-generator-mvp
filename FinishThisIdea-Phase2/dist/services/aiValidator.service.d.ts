export interface AiValidatorConfig {
    [key: string]: any;
}
export interface AiValidatorResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Ai Validator Service
 * Price: $7.0
 * AI DEBATE COLOSSEUM - Where AIs argue and users judge
 */
export declare function processAiValidator(jobId: string, config: AiValidatorConfig, progressCallback?: (progress: number) => void): Promise<AiValidatorResult>;
//# sourceMappingURL=aiValidator.service.d.ts.map