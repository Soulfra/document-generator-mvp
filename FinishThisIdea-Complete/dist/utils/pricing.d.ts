interface CostCalculationInput {
    fileSize: number;
    type: 'cleanup' | 'refactor' | 'format' | 'full';
    options: {
        removeComments?: boolean;
        removeConsoleLog?: boolean;
        formatCode?: boolean;
        optimizeImports?: boolean;
        removeDeadCode?: boolean;
        convertToTypeScript?: boolean;
        addTests?: boolean;
        llmProvider?: 'ollama' | 'openai' | 'anthropic' | 'auto';
    };
}
export declare function calculateCost(input: CostCalculationInput): number;
export {};
//# sourceMappingURL=pricing.d.ts.map