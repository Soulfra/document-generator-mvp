export interface LLMTask {
    type: 'analyze' | 'cleanup' | 'structure' | 'generate';
    input: any;
    options?: {
        preferLocal?: boolean;
        maxCost?: number;
        minConfidence?: number;
    };
}
export interface LLMResult {
    success: boolean;
    data: any;
    provider: 'ollama' | 'claude' | 'openai';
    confidence: number;
    cost: number;
    duration: number;
}
export declare class LLMRouter {
    private ollamaAvailable;
    initialize(): Promise<void>;
    route(task: LLMTask): Promise<LLMResult>;
    private processWithOllama;
    private processWithClaude;
    private calculateAnalysisConfidence;
    private calculateCleanupConfidence;
    private calculateStructureConfidence;
    estimateCost(task: LLMTask): Promise<{
        ollama: number;
        claude: number;
        recommended: 'ollama' | 'claude';
    }>;
}
export declare const llmRouter: LLMRouter;
//# sourceMappingURL=router.d.ts.map