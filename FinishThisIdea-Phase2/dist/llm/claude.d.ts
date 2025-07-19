interface ClaudeResult<T> {
    data: T;
    cost: number;
}
export declare class ClaudeClient {
    private client;
    private model;
    constructor();
    private calculateCost;
    analyzeCode(code: string): Promise<ClaudeResult<any>>;
    cleanupCode(code: string, language: string): Promise<ClaudeResult<string>>;
    suggestFileStructure(files: string[]): Promise<ClaudeResult<any>>;
    generate(prompt: string): Promise<ClaudeResult<string>>;
}
export declare const claude: ClaudeClient;
export {};
//# sourceMappingURL=claude.d.ts.map