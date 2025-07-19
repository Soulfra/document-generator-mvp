export interface AIRequest {
    keyInfo: any;
    options?: {
        preferLocal?: boolean;
        maxCost?: number;
        minConfidence?: number;
        timeout?: number;
        model?: string;
    };
}
export interface CodeAnalysisRequest extends AIRequest {
    code: string;
    language?: string;
    profile?: any;
}
export interface CodeCleanupRequest extends AIRequest {
    code: string;
    language?: string;
    profile?: any;
}
export interface StructureRequest extends AIRequest {
    files: string[];
    projectType?: string;
}
export interface GenerationRequest extends AIRequest {
    prompt: string;
    type?: 'code' | 'docs' | 'tests' | 'comments';
}
export interface AIResult {
    success: boolean;
    data: any;
    provider: 'ollama' | 'claude' | 'openai' | 'byok';
    model?: string;
    confidence: number;
    cost: number;
    tokens?: {
        input: number;
        output: number;
    };
    reasoning?: string;
}
export interface ModelInfo {
    id: string;
    name: string;
    provider: 'ollama' | 'claude' | 'openai' | 'byok';
    cost_per_token: number;
    capabilities: string[];
    context_length: number;
    available: boolean;
}
export declare class AIRouter {
    private ollamaAvailable;
    private claudeAvailable;
    private openaiAvailable;
    private availableModels;
    initialize(): Promise<void>;
    private checkOllamaAvailability;
    refreshAvailableModels(): Promise<void>;
    getAvailableModels(keyInfo: any): Promise<ModelInfo[]>;
    analyzeCode(request: CodeAnalysisRequest): Promise<AIResult>;
    cleanupCode(request: CodeCleanupRequest): Promise<AIResult>;
    suggestStructure(request: StructureRequest): Promise<AIResult>;
    generate(request: GenerationRequest): Promise<AIResult>;
    estimateCost(params: any): Promise<any>;
    private selectModel;
    private calculateCost;
    private calculateCleanupConfidence;
    private processWithOllama;
    private processWithClaude;
    private processWithOpenAI;
    isOllamaAvailable(): boolean;
}
//# sourceMappingURL=ai-router.d.ts.map