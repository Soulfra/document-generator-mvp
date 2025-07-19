export interface DocumentationConfig {
    includeReadme: boolean;
    includeApiDocs: boolean;
    includeSetupGuide: boolean;
    includeExamples: boolean;
    includeChangelog: boolean;
    includeContributing: boolean;
    docStyle: 'basic' | 'professional' | 'enterprise';
    targetAudience: 'developers' | 'users' | 'both';
}
export interface DocumentationResult {
    outputFileUrl: string;
    generatedFiles: string[];
    docQualityScore: number;
    processingCost: number;
}
export declare function generateDocumentation(jobId: string, config: DocumentationConfig, progressCallback?: (progress: number) => void): Promise<DocumentationResult>;
//# sourceMappingURL=documentation-generator.service.d.ts.map