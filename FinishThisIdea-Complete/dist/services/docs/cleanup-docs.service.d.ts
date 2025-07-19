interface DocGenerationOptions {
    format: 'markdown' | 'html' | 'pdf';
    includeAnalysis?: boolean;
    includeChangelog?: boolean;
    includeMetrics?: boolean;
    includeRecommendations?: boolean;
    branding?: boolean;
}
export declare class CleanupDocsService {
    generateCleanupReport(jobId: string, options?: DocGenerationOptions): Promise<{
        reportUrl: string;
        reportId: string;
    }>;
    private buildReport;
    private generateMarkdownReport;
    private generateHTMLReport;
    private generatePDFReport;
    private generateOverviewContent;
    private generateAnalysisContent;
    private generateLanguageDistribution;
    private generateIssuesList;
    private generateChangesContent;
    private generateMetricsContent;
    private generateSummary;
    private generateRecommendations;
    private getLanguageRecommendation;
    private getS3Client;
}
export declare const cleanupDocs: CleanupDocsService;
export {};
//# sourceMappingURL=cleanup-docs.service.d.ts.map