interface CleanupPreference {
    userId?: string;
    sessionId: string;
    preferences: {
        keepPatterns: string[];
        removePatterns: string[];
        organizationStyle: 'minimal' | 'standard' | 'detailed';
        indentationPreference: 'spaces' | 'tabs';
        indentSize: number;
        lineEnding: 'lf' | 'crlf' | 'auto';
        preserveComments: boolean;
        generateDocs: boolean;
    };
    confidence: number;
}
interface CleanupThought {
    id: string;
    timestamp: string;
    jobId: string;
    sessionId: string;
    userId?: string;
    eventType: 'upload' | 'analysis' | 'decision' | 'cleanup' | 'error' | 'completion';
    reasoning: {
        intent: string;
        confidence: number;
        decisionPath: string[];
        alternativesConsidered: string[];
    };
    analysis: {
        detectedPatterns: string[];
        codeStyle: Record<string, any>;
        problemsFound: string[];
        suggestedFixes: string[];
    };
    userContext: {
        previousJobs: number;
        preferredStyle?: Record<string, any>;
        successRate: number;
        trustLevel: number;
    };
    systemState: {
        processingTimeMs: number;
        filesAnalyzed: number;
        aiProvider: 'ollama' | 'claude';
        memoryUsageMb: number;
    };
    learning: {
        newPatterns: string[];
        userFeedback?: 'positive' | 'negative' | 'neutral';
        improvementNotes: string[];
    };
}
export declare class CleanupMemoryService {
    private thoughtLogPath;
    private maxThoughtsInMemory;
    private preferencesCacheTime;
    constructor();
    private initializeThoughtLog;
    logThought(thought: Partial<CleanupThought>): Promise<CleanupThought>;
    logAnalysisThought(jobId: string, sessionId: string, analysis: any): Promise<CleanupThought>;
    logCleanupDecision(jobId: string, sessionId: string, decision: any): Promise<CleanupThought>;
    saveUserPreferences(jobId: string, sessionId: string, userId?: string): Promise<void>;
    getUserPreferences(sessionId: string, userId?: string): Promise<CleanupPreference | null>;
    getCleanupInsights(userId: string): Promise<any>;
    private persistThought;
    private cacheThought;
    private getRecentThoughts;
    private detectCodePatterns;
    private extractPreferredPatterns;
    private extractCommonIssues;
    private calculateAverageConfidence;
    private calculateSuccessRate;
    private generateRecommendations;
}
export declare const cleanupMemory: CleanupMemoryService;
export {};
//# sourceMappingURL=cleanup-memory.service.d.ts.map