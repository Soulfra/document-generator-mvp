export declare function generateReferralCode(userId: string, displayName?: string): string;
export declare function isValidReferralCode(code: string): boolean;
export declare function calculateTokenReward(actionType: 'signup' | 'referral' | 'showcase' | 'collaboration' | 'upload', metadata?: {
    userTier?: string;
    revenueGenerated?: number;
    collaborators?: number;
    showcaseViews?: number;
    uploadValue?: number;
}): number;
export declare function calculateDividendPayout(userTokens: number, totalTokens: number, totalDividendPool: number): number;
export declare function validateShowcaseData(showcase: {
    title: string;
    description: string;
    beforeCode: string;
    afterCode: string;
    technologies: string[];
}): {
    valid: boolean;
    errors: string[];
};
export declare function calculateShowcaseMetrics(beforeCode: string, afterCode: string): {
    complexity: number;
    performance: number;
    security: number;
    maintainability: number;
    linesReduced: number;
};
export declare function generateShareUrl(showcaseId: string, baseUrl?: string): string;
export declare function generateQRCodeDataURL(url: string): string;
export declare function calculateViralityScore(shareMetrics: {
    views: number;
    likes: number;
    shares: number;
    forks: number;
}): number;
export declare function calculateUserViralityScore(userStats: {
    showcasesCreated: number;
    totalViews: number;
    totalShares: number;
    referralsGenerated: number;
    collaborationsCompleted: number;
}): number;
export declare function formatCurrency(amount: number, currency?: string): string;
export declare function formatNumber(num: number): string;
export declare function logViralEvent(eventType: string, userId: string, metadata?: Record<string, any>): void;
//# sourceMappingURL=viral-utils.d.ts.map