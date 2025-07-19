export interface DocumentationGeneratorConfig {
    [key: string]: any;
}
export interface DocumentationGeneratorResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Documentation Generator Service
 * Price: $3.0
 * DEV DOC GENERATOR - Turns debugging pain into AI-readable documentation
 */
export declare function processDocumentationGenerator(jobId: string, config: DocumentationGeneratorConfig, progressCallback?: (progress: number) => void): Promise<DocumentationGeneratorResult>;
//# sourceMappingURL=documentationGenerator.service.d.ts.map