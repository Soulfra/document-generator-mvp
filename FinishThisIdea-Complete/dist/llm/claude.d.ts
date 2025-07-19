import { ContextProfile } from '../types/context-profile';
interface ClaudeResult<T> {
    data: T;
    cost: number;
}
export declare class ClaudeClient {
    private client;
    private model;
    constructor();
    private buildCleanupInstructions;
    private getDefaultCleanupInstructions;
    private calculateCost;
    analyzeCode(code: string, profile?: ContextProfile): Promise<ClaudeResult<any>>;
    cleanupCode(code: string, language: string, profile?: ContextProfile): Promise<ClaudeResult<string>>;
    suggestFileStructure(files: string[]): Promise<ClaudeResult<any>>;
    generate(prompt: string): Promise<ClaudeResult<string>>;
}
export declare const claude: ClaudeClient;
export {};
//# sourceMappingURL=claude.d.ts.map