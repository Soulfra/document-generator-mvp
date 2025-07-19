import { ContextProfile } from '../types/context-profile';
import { CodeAnalysis } from '../types/code-analysis';
export interface DocumentationTemplate {
    id: string;
    name: string;
    description: string;
    sections: TemplateSection[];
    requiredAnalysis: string[];
}
export interface TemplateSection {
    id: string;
    title: string;
    template: string;
    dataMapping: DataMapping[];
    aiPrompt?: string;
}
export interface DataMapping {
    placeholder: string;
    source: string;
    transform?: string;
    default?: string;
}
export interface GeneratedSection {
    id: string;
    title: string;
    content: string;
    dataUsed: string[];
    aiGenerated: boolean;
}
export interface GeneratedTemplate {
    templateId: string;
    templateName: string;
    content: string;
    sections: GeneratedSection[];
}
export interface DocumentationResult {
    templates: GeneratedTemplate[];
    quality: QualityMetrics;
    metadata: {
        tokensUsed: number;
        generationTime: number;
        aiProvider: string;
    };
}
export interface QualityMetrics {
    completeness: number;
    accuracy: number;
    readability: number;
    overallScore: number;
}
export interface SectionGenerationResult {
    content: string;
    dataUsed: string[];
    aiGenerated: boolean;
    tokensUsed?: number;
}
declare class DocumentationService {
    private templates;
    private templatesLoaded;
    constructor();
    private loadDefaultTemplates;
    private loadFallbackTemplates;
    generateDocumentation(jobId: string, codeAnalysis: CodeAnalysis, templateIds: string[], profile?: ContextProfile): Promise<DocumentationResult>;
    private _generateDocumentation;
    private generateSection;
    private extractDataValue;
    private applyTransform;
    private calculateQualityMetrics;
    getAvailableTemplates(): Promise<DocumentationTemplate[]>;
}
export declare const documentationService: DocumentationService;
export {};
//# sourceMappingURL=documentation.service.d.ts.map