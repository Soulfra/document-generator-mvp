export interface IdeaExtractionConfig {
    [key: string]: any;
}
export interface IdeaExtractionResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Idea Extraction Service
 * Price: $6.0
 * EXTRACT BUSINESS IDEAS - Quick extraction from any chat log format
 */
export declare function processIdeaExtraction(jobId: string, config: IdeaExtractionConfig, progressCallback?: (progress: number) => void): Promise<IdeaExtractionResult>;
//# sourceMappingURL=ideaExtraction.service.d.ts.map