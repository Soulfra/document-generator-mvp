import { EventEmitter } from 'events';
interface GitHubConfig {
    token?: string;
    owner?: string;
    repo?: string;
    baseUrl?: string;
}
interface ImprovementProposal {
    id: string;
    agentId: string;
    type: 'refactor' | 'security_fix' | 'feature' | 'optimization' | 'bug_fix';
    targetFiles: string[];
    description: string;
    implementationPlan: string;
    estimatedImpact: number;
    bountyAmount?: number;
    status: 'proposed' | 'pr_created' | 'under_review' | 'merged' | 'rejected';
    githubPrUrl?: string;
    githubPrNumber?: number;
    createdAt: Date;
}
export declare class GitHubAutomationService extends EventEmitter {
    private octokit;
    private prisma;
    private aiService;
    private queue;
    private config;
    private consensusThreshold;
    constructor(config?: GitHubConfig);
    private setupQueueProcessors;
    analyzeCodebase(targetPath?: string): Promise<ImprovementProposal[]>;
    createPullRequest(proposal: ImprovementProposal): Promise<string>;
    private performAIReview;
    private getAIReview;
    private checkConsensus;
    private mergePullRequest;
    private generatePRBody;
    private shouldAnalyzeFile;
    private detectLanguage;
    private getRepositoryFiles;
    private getFileContent;
    private createBranch;
    private updateFile;
    private postReviewComment;
    private getPRDiff;
    private storeProposal;
    private storeReview;
    private getProposal;
    private getProposalReviews;
    private updateProposalStatus;
    private generateProposal;
    private determineProposalType;
    private calculateBounty;
    private applyImprovements;
    private distributeBounty;
    private parseReviewType;
    private parseConfidenceScore;
    private parseReviewComment;
    private parseQualityScore;
    private parseSecurityScore;
    private parsePerformanceImpact;
}
export {};
//# sourceMappingURL=github-automation.service.d.ts.map