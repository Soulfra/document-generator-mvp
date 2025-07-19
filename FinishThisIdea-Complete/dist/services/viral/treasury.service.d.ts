interface RevenueOptions {
    source?: 'usage' | 'subscription' | 'tip' | 'referral' | 'platform_share';
    userId?: string;
    metadata?: any;
}
declare class TreasuryService {
    private dividendRate;
    private minimumPayout;
    private gradeThresholds;
    constructor();
    private initializePlatformTokens;
    addRevenue(amount: number, options?: RevenueOptions): Promise<any>;
    private awardTokensForRevenue;
    private calculateTokensForRevenue;
    private processReferralBonus;
    private queueDividendDistribution;
    distributeDividends(totalAmount: number): Promise<any>;
    getUserEarnings(userId: string): Promise<any>;
    getPlatformStats(): Promise<any>;
    private getTotalTokensInCirculation;
    awardAchievementTokens(userId: string, achievement: string, tokens: number): Promise<any>;
    processPayment(amount: number, userId: string, metadata?: any): Promise<any>;
}
export declare const treasuryService: TreasuryService;
export {};
//# sourceMappingURL=treasury.service.d.ts.map