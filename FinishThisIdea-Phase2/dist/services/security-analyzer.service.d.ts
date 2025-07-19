export interface SecurityAnalysisConfig {
    scanTypes: ('owasp' | 'dependencies' | 'secrets' | 'sql-injection' | 'xss')[];
    severityLevel: 'low' | 'medium' | 'high' | 'critical';
    includeCompliance: boolean;
    complianceStandards: ('soc2' | 'hipaa' | 'gdpr' | 'pci-dss')[];
    generateReport: boolean;
    includeRemediation: boolean;
    scanDependencies: boolean;
}
export interface SecurityAnalysisResult {
    outputFileUrl: string;
    vulnerabilities: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    riskScore: number;
    complianceScore?: number;
    processingCost: number;
}
export declare function analyzeSecurityIssues(jobId: string, config: SecurityAnalysisConfig, progressCallback?: (progress: number) => void): Promise<SecurityAnalysisResult>;
//# sourceMappingURL=security-analyzer.service.d.ts.map