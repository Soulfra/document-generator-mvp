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
/**
 * Project Showcase Service - Create shareable before/after transformations
 * Drives viral growth through QR code sharing of impressive code improvements
 */
declare class ShowcaseService {
    private showcases;
    /**
     * Create a new project showcase from transformation results
     */
    createShowcase(userId: string, title: string, description: string, beforeCode: string, afterCode: string, technologies?: string[], metadata?: any): Promise<ProjectShowcase>;
    /**
     * Get showcase by ID (increments view count)
     */
    getShowcase(showcaseId: string, viewerId?: string): Promise<ProjectShowcase | null>;
    /**
     * Share showcase (via QR code scan or direct link)
     */
    shareShowcase(showcaseId: string, sharerId?: string, shareMethod?: 'qr' | 'link' | 'social'): Promise<void>;
    /**
     * Like a showcase
     */
    likeShowcase(showcaseId: string, userId: string): Promise<void>;
    /**
     * Get user's showcases
     */
    getUserShowcases(userId: string): ProjectShowcase[];
    /**
     * Get public showcases (trending/popular)
     */
    getPublicShowcases(limit?: number, sortBy?: 'recent' | 'popular' | 'viral'): ProjectShowcase[];
    /**
     * Get showcase analytics for dashboard
     */
    getShowcaseAnalytics(): Promise<ShowcaseAnalytics>;
    /**
     * Analyze code improvements between before and after
     */
    private analyzeImprovements;
    /**
     * Calculate improvement metrics
     */
    private calculateMetrics;
    private scoreComplexity;
    private scorePerformance;
    private scoreSecurity;
    private scoreMaintainability;
    /**
     * Calculate overall improvement score
     */
    private calculateImprovementScore;
}
export declare const showcaseService: ShowcaseService;
export {};
//# sourceMappingURL=showcase.service.d.ts.map