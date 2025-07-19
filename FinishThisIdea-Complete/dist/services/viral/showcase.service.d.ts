interface ProjectShowcase {
    id: string;
    userId: string;
    title: string;
    description: string;
    beforeCode: string;
    afterCode: string;
    improvements: string[];
    technologies: string[];
    metrics: {
        linesReduced: number;
        complexity: number;
        performance: number;
        security: number;
        maintainability: number;
    };
    shareMetrics: {
        views: number;
        likes: number;
        shares: number;
        forks: number;
    };
    qrCode: string;
    shareUrl: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface ShowcaseAnalytics {
    totalShowcases: number;
    totalViews: number;
    totalShares: number;
    avgImprovementScore: number;
    topTechnologies: {
        name: string;
        count: number;
    }[];
    viralityScore: number;
}
declare class ShowcaseService {
    private showcases;
    createShowcase(userId: string, title: string, description: string, beforeCode: string, afterCode: string, technologies?: string[], metadata?: any): Promise<ProjectShowcase>;
    getShowcase(showcaseId: string, viewerId?: string): Promise<ProjectShowcase | null>;
    shareShowcase(showcaseId: string, sharerId?: string, shareMethod?: 'qr' | 'link' | 'social'): Promise<void>;
    likeShowcase(showcaseId: string, userId: string): Promise<void>;
    getUserShowcases(userId: string): ProjectShowcase[];
    getPublicShowcases(limit?: number, sortBy?: 'recent' | 'popular' | 'viral'): ProjectShowcase[];
    getShowcaseAnalytics(): Promise<ShowcaseAnalytics>;
    private analyzeImprovements;
    private calculateMetrics;
    private scoreComplexity;
    private scorePerformance;
    private scoreSecurity;
    private scoreMaintainability;
    private calculateImprovementScore;
}
export declare const showcaseService: ShowcaseService;
export {};
//# sourceMappingURL=showcase.service.d.ts.map