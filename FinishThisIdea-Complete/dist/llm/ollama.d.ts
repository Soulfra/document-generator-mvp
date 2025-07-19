import { ContextProfile } from '../types/context-profile';
interface OllamaOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    profile?: ContextProfile;
}
export declare class OllamaClient {
    private baseUrl;
    private defaultModel;
    constructor();
    private buildCleanupInstructions;
    private getDefaultCleanupInstructions;
    generate(prompt: string, options?: OllamaOptions): Promise<string>;
    analyzeCode(code: string, profile?: ContextProfile): Promise<{
        issues: string[];
        suggestions: string[];
        complexity: number;
    }>;
    cleanupCode(code: string, language: string, profile?: ContextProfile): Promise<string>;
    suggestFileStructure(files: string[]): Promise<{
        structure: Record<string, string[]>;
        renames: Record<string, string>;
    }>;
    isAvailable(): Promise<boolean>;
}
export declare const ollama: OllamaClient;
export {};
//# sourceMappingURL=ollama.d.ts.map