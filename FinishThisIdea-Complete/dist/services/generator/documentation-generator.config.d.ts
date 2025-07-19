import { ServiceConfig } from './service-generator';
export declare const documentationGeneratorConfig: ServiceConfig;
export declare class DocumentationGeneratorService {
    generateDocumentation(options: {
        sourceCode: string;
        language: string;
        format?: 'markdown' | 'html' | 'pdf';
        includePrivate?: boolean;
        includeExamples?: boolean;
        theme?: string;
    }): Promise<{
        documentation: string;
        metadata: {
            functions: number;
            classes: number;
            interfaces: number;
            lines: number;
            complexity: number;
        };
        diagrams?: string[];
    }>;
    analyzeCodebase(options: {
        files: {
            path: string;
            content: string;
        }[];
        generateDependencyGraph?: boolean;
        generateArchitectureDiagram?: boolean;
    }): Promise<{
        structure: any;
        dependencies: any;
        suggestions: string[];
    }>;
    getTemplates(): Promise<{
        templates: {
            id: string;
            name: string;
            description: string;
            preview: string;
        }[];
    }>;
}
//# sourceMappingURL=documentation-generator.config.d.ts.map