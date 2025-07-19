export interface CleanupResult {
    outputFileUrl: string;
    metadata: {
        originalFiles: number;
        cleanedFiles: number;
        linesOfCode: number;
        languages: Record<string, number>;
        improvements: string[];
        processingCost: number;
    };
}
export declare function processCleanupJob(jobId: string, progressCallback?: (progress: number) => void): Promise<CleanupResult>;
//# sourceMappingURL=cleanup.service.d.ts.map