interface RevenueOptions {
    source?: 'usage' | 'subscription' | 'tip' | 'referral' | 'platform_share';
    userId?: string;
    metadata?: any;
}
/**
 * Treasury Service - Platform Revenue Sharing & Viral Economics
 * Adapted from Soulfra's CalTreasury for FinishThisIdea viral growth
 */
declare class TreasuryService {
    private dividendRate;
    private minimumPayout;
    private gradeThresholds;
    constructor();
    /**
     * Initialize platform token system if not exists
     */
    private initializePlatformTokens;
    /**
     * Add revenue to platform and trigger dividend distribution
     */
    addRevenue(amount: number, options?: RevenueOptions): Promise<any>;
    /**
     * Award platform tokens based on revenue contribution
     */
    private awardTokensForRevenue;
    /**
     * Calculate tokens to award based on revenue amount
     */
    private calculateTokensForRevenue;
    /**
     * Process referral bonus
     */
    private processReferralBonus;
    /**
     * Queue dividend distribution
     */
    private queueDividendDistribution;
    /**
     * Distribute dividends to token holders
     */
    distributeDividends(totalAmount: number): Promise<any>;
    /**
     * Get user earnings and token information
     */
    getUserEarnings(userId: string): Promise<any>;
    /**
     * Get platform revenue statistics
     */
    getPlatformStats(): Promise<any>;
    /**
     * Get total tokens in circulation
     */
    private getTotalTokensInCirculation;
    /**
     * Award tokens for specific achievements
     */
    awardAchievementTokens(userId: string, achievement: string, tokens: number): Promise<any>;
    /**
     * Process payment and add revenue
     */
    processPayment(amount: number, userId: string, metadata?: any): Promise<any>;
}
export declare const treasuryService: TreasuryService;
export {};
//# sourceMappingURL=treasury.service.d.ts.map