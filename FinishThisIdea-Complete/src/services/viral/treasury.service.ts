import { logger } from '../../utils/logger';
import { prisma } from '../../utils/database';
import { presenceLogger } from '../../monitoring/presence-logger';

interface RevenueOptions {
  source?: 'usage' | 'subscription' | 'tip' | 'referral' | 'platform_share';
  userId?: string;
  metadata?: any;
}

interface TokenHolding {
  userId: string;
  tokens: number;
  acquisitionType: 'initial' | 'earned' | 'referral' | 'upgrade';
  acquiredAt: Date;
}

interface PlatformRevenue {
  id: string;
  totalRevenue: number;
  tokenHolders: TokenHolding[];
  dividendRate: number; // Percentage of revenue shared as dividends
  gradeThresholds: Record<string, number>;
  status: 'active' | 'paused';
}

/**
 * Treasury Service - Platform Revenue Sharing & Viral Economics
 * Adapted from Soulfra's CalTreasury for FinishThisIdea viral growth
 */
class TreasuryService {
  private dividendRate = 0.3; // 30% of revenue shared as dividends
  private minimumPayout = 10; // $10 minimum payout
  private gradeThresholds = {
    'Starter': 0,
    'Bronze': 100,
    'Silver': 1000,
    'Gold': 10000,
    'Platinum': 100000,
    'Diamond': 1000000
  };

  constructor() {
    this.initializePlatformTokens();
  }

  /**
   * Initialize platform token system if not exists
   */
  private async initializePlatformTokens(): Promise<void> {
    try {
      // Check if platform token record exists
      const existingPlatform = await prisma.platformRevenue.findFirst();
      
      if (!existingPlatform) {
        await prisma.platformRevenue.create({
          data: {
            totalRevenue: 0,
            tokenHolders: [],
            dividendRate: this.dividendRate,
            gradeThresholds: this.gradeThresholds,
            status: 'active'
          }
        });
        logger.info('Platform token system initialized');
      }
    } catch (error) {
      logger.warn('Platform token initialization skipped (table may not exist)', { error: error.message });
    }
  }

  /**
   * Add revenue to platform and trigger dividend distribution
   */
  async addRevenue(amount: number, options: RevenueOptions = {}): Promise<any> {
    try {
      const { source = 'usage', userId = 'anonymous', metadata = {} } = options;

      // Log revenue event for analytics
      logger.info('Platform revenue added', {
        userId,
        amount,
        source,
        timestamp: new Date().toISOString()
      });

      // Try to update platform revenue (graceful fallback if table doesn't exist)
      let platform: any;
      try {
        platform = await prisma.platformRevenue.findFirst();
        if (platform) {
          platform = await prisma.platformRevenue.update({
            where: { id: platform.id },
            data: {
              totalRevenue: platform.totalRevenue + amount,
              lastRevenueUpdate: new Date()
            }
          });
        }
      } catch (error) {
        logger.warn('Platform revenue table not found, using in-memory tracking', { error: error.message });
        platform = {
          id: 'platform',
          totalRevenue: amount,
          tokenHolders: [],
          dividendRate: this.dividendRate
        };
      }

      // Calculate dividends (30% of revenue)
      const dividendAmount = amount * this.dividendRate;
      
      // Award platform tokens for revenue generation
      if (userId !== 'anonymous') {
        await this.awardTokensForRevenue(userId, amount);
      }

      // Queue dividend distribution if threshold met
      if (dividendAmount >= this.minimumPayout) {
        await this.queueDividendDistribution(dividendAmount);
      }

      // Award referral bonuses
      if (source === 'referral' && metadata.referrerId) {
        await this.processReferralBonus(metadata.referrerId, amount);
      }

      logger.info('Platform revenue added successfully', {
        amount,
        source,
        totalRevenue: platform.totalRevenue,
        dividendAmount,
        userId
      });

      return {
        success: true,
        revenueAdded: amount,
        totalRevenue: platform.totalRevenue,
        dividendAmount,
        tokensAwarded: userId !== 'anonymous' ? this.calculateTokensForRevenue(amount) : 0
      };

    } catch (error) {
      logger.error('Error adding platform revenue', { error: error.message, amount, options });
      throw error;
    }
  }

  /**
   * Award platform tokens based on revenue contribution
   */
  private async awardTokensForRevenue(userId: string, revenueAmount: number): Promise<number> {
    try {
      const tokensToAward = this.calculateTokensForRevenue(revenueAmount);
      
      if (tokensToAward > 0) {
        // Try to update user tokens (graceful fallback)
        try {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                platformTokens: (user.platformTokens || 0) + tokensToAward,
                lastTokenUpdate: new Date()
              }
            });
          }
        } catch (error) {
          logger.warn('User table token update failed, using session tracking', { error: error.message });
        }

        await presenceLogger.logUserPresence('tokens_awarded', {
          userId,
          sessionId: 'system',
          metadata: {
            tokensAwarded: tokensToAward,
            revenueAmount,
            reason: 'revenue_contribution'
          }
        });

        logger.info('Platform tokens awarded', { userId, tokensAwarded: tokensToAward, revenueAmount });
      }

      return tokensToAward;
    } catch (error) {
      logger.error('Error awarding tokens for revenue', { error: error.message, userId, revenueAmount });
      return 0;
    }
  }

  /**
   * Calculate tokens to award based on revenue amount
   */
  private calculateTokensForRevenue(revenueAmount: number): number {
    // Award 1 token per $1 of revenue contributed
    return Math.floor(revenueAmount);
  }

  /**
   * Process referral bonus
   */
  private async processReferralBonus(referrerId: string, revenueAmount: number): Promise<void> {
    try {
      const bonusAmount = revenueAmount * 0.1; // 10% referral bonus
      const bonusTokens = this.calculateTokensForRevenue(bonusAmount);

      // Award bonus tokens to referrer
      try {
        const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
        if (referrer) {
          await prisma.user.update({
            where: { id: referrerId },
            data: {
              platformTokens: (referrer.platformTokens || 0) + bonusTokens,
              referralEarnings: (referrer.referralEarnings || 0) + bonusAmount
            }
          });
        }
      } catch (error) {
        logger.warn('Referrer bonus update failed, using logging only', { error: error.message });
      }

      await presenceLogger.logUserPresence('referral_bonus', {
        userId: referrerId,
        sessionId: 'system',
        metadata: {
          bonusTokens,
          bonusAmount,
          sourceRevenue: revenueAmount
        }
      });

      logger.info('Referral bonus processed', { referrerId, bonusTokens, bonusAmount });
    } catch (error) {
      logger.error('Error processing referral bonus', { error: error.message, referrerId, revenueAmount });
    }
  }

  /**
   * Queue dividend distribution
   */
  private async queueDividendDistribution(amount: number): Promise<void> {
    try {
      await presenceLogger.logUserPresence('dividend_queued', {
        userId: 'system',
        sessionId: 'system',
        metadata: {
          dividendAmount: amount,
          queuedAt: new Date().toISOString()
        }
      });

      logger.info('Dividend distribution queued', { amount });
      
      // Process immediately for now (could be queued for batch processing)
      await this.distributeDividends(amount);
    } catch (error) {
      logger.error('Error queuing dividend distribution', { error: error.message, amount });
    }
  }

  /**
   * Distribute dividends to token holders
   */
  async distributeDividends(totalAmount: number): Promise<any> {
    try {
      // Get all users with platform tokens
      let tokenHolders: any[] = [];
      
      try {
        tokenHolders = await prisma.user.findMany({
          where: {
            platformTokens: { gt: 0 }
          },
          select: {
            id: true,
            platformTokens: true,
            name: true
          }
        });
      } catch (error) {
        logger.warn('Cannot fetch token holders from database, skipping distribution', { error: error.message });
        return { success: false, reason: 'No database access' };
      }

      if (tokenHolders.length === 0) {
        logger.info('No token holders found for dividend distribution');
        return { success: true, distributed: 0, holders: 0 };
      }

      const totalTokens = tokenHolders.reduce((sum, holder) => sum + (holder.platformTokens || 0), 0);
      const payouts: any[] = [];

      for (const holder of tokenHolders) {
        if (holder.platformTokens > 0) {
          const holderShare = totalAmount * (holder.platformTokens / totalTokens);
          
          if (holderShare >= 0.01) { // Minimum $0.01 payout
            // Update user earnings
            try {
              await prisma.user.update({
                where: { id: holder.id },
                data: {
                  totalEarnings: { increment: holderShare },
                  lastDividendPayout: new Date()
                }
              });
            } catch (error) {
              logger.warn('Failed to update user earnings in database', { error: error.message });
            }

            // Log dividend payout
            await presenceLogger.logUserPresence('dividend_received', {
              userId: holder.id,
              sessionId: 'system',
              metadata: {
                dividendAmount: holderShare,
                tokensHeld: holder.platformTokens,
                totalDistributed: totalAmount
              }
            });

            payouts.push({
              userId: holder.id,
              userName: holder.name,
              tokensHeld: holder.platformTokens,
              dividendAmount: holderShare
            });
          }
        }
      }

      logger.info('Dividends distributed successfully', {
        totalAmount,
        holdersCount: payouts.length,
        averagePayout: payouts.length > 0 ? totalAmount / payouts.length : 0
      });

      return {
        success: true,
        distributed: totalAmount,
        holders: payouts.length,
        payouts
      };

    } catch (error) {
      logger.error('Error distributing dividends', { error: error.message, totalAmount });
      throw error;
    }
  }

  /**
   * Get user earnings and token information
   */
  async getUserEarnings(userId: string): Promise<any> {
    try {
      let user: any = null;
      
      try {
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            platformTokens: true,
            totalEarnings: true,
            referralEarnings: true,
            lastDividendPayout: true,
            lastTokenUpdate: true
          }
        });
      } catch (error) {
        logger.warn('Cannot fetch user from database, using defaults', { error: error.message });
      }

      // Get platform info
      let platform: any = null;
      try {
        platform = await prisma.platformRevenue.findFirst();
      } catch (error) {
        logger.warn('Cannot fetch platform revenue, using defaults', { error: error.message });
      }

      const tokensHeld = user?.platformTokens || 0;
      const totalRevenue = platform?.totalRevenue || 0;
      const totalTokens = platform ? await this.getTotalTokensInCirculation() : 1;
      
      const ownershipPercentage = totalTokens > 0 ? (tokensHeld / totalTokens) * 100 : 0;
      const projectedNextDividend = totalRevenue > 0 ? 
        (totalRevenue * this.dividendRate * ownershipPercentage / 100) : 0;

      return {
        userId,
        userName: user?.name || 'Anonymous',
        tokensHeld,
        ownershipPercentage,
        totalEarnings: user?.totalEarnings || 0,
        referralEarnings: user?.referralEarnings || 0,
        lastDividendPayout: user?.lastDividendPayout,
        projectedNextDividend,
        platformStats: {
          totalRevenue,
          totalTokens,
          dividendRate: this.dividendRate * 100
        }
      };

    } catch (error) {
      logger.error('Error getting user earnings', { error: error.message, userId });
      return {
        userId,
        tokensHeld: 0,
        ownershipPercentage: 0,
        totalEarnings: 0,
        error: 'Unable to fetch earnings data'
      };
    }
  }

  /**
   * Get platform revenue statistics
   */
  async getPlatformStats(): Promise<any> {
    try {
      let platform: any = null;
      let userCount = 0;
      let totalTokens = 0;

      try {
        platform = await prisma.platformRevenue.findFirst();
        const users = await prisma.user.aggregate({
          _count: { id: true },
          _sum: { platformTokens: true }
        });
        userCount = users._count.id || 0;
        totalTokens = users._sum.platformTokens || 0;
      } catch (error) {
        logger.warn('Cannot fetch platform stats from database', { error: error.message });
      }

      const totalRevenue = platform?.totalRevenue || 0;
      const totalDividendsPaid = totalRevenue * this.dividendRate;

      return {
        totalRevenue,
        totalDividendsPaid,
        totalTokens,
        tokenHolders: userCount,
        dividendRate: this.dividendRate * 100,
        nextDividendPool: totalRevenue * this.dividendRate,
        averageTokensPerUser: userCount > 0 ? totalTokens / userCount : 0,
        gradeThresholds: this.gradeThresholds
      };

    } catch (error) {
      logger.error('Error getting platform stats', { error: error.message });
      return {
        totalRevenue: 0,
        totalDividendsPaid: 0,
        totalTokens: 0,
        tokenHolders: 0,
        error: 'Unable to fetch platform statistics'
      };
    }
  }

  /**
   * Get total tokens in circulation
   */
  private async getTotalTokensInCirculation(): Promise<number> {
    try {
      const result = await prisma.user.aggregate({
        _sum: { platformTokens: true }
      });
      return result._sum.platformTokens || 0;
    } catch (error) {
      logger.warn('Cannot fetch total tokens from database', { error: error.message });
      return 1; // Avoid division by zero
    }
  }

  /**
   * Award tokens for specific achievements
   */
  async awardAchievementTokens(userId: string, achievement: string, tokens: number): Promise<any> {
    try {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              platformTokens: (user.platformTokens || 0) + tokens,
              lastTokenUpdate: new Date()
            }
          });
        }
      } catch (error) {
        logger.warn('Achievement token update failed, using logging only', { error: error.message });
      }

      await presenceLogger.logUserPresence('achievement_tokens', {
        userId,
        sessionId: 'system',
        metadata: {
          achievement,
          tokensAwarded: tokens,
          awardedAt: new Date().toISOString()
        }
      });

      logger.info('Achievement tokens awarded', { userId, achievement, tokens });

      return {
        success: true,
        achievement,
        tokensAwarded: tokens
      };

    } catch (error) {
      logger.error('Error awarding achievement tokens', { error: error.message, userId, achievement });
      throw error;
    }
  }

  /**
   * Process payment and add revenue
   */
  async processPayment(amount: number, userId: string, metadata: any = {}): Promise<any> {
    try {
      // Add revenue to platform
      const result = await this.addRevenue(amount, {
        source: 'usage',
        userId,
        metadata
      });

      // Award first-time user bonus
      if (metadata.isFirstPayment) {
        await this.awardAchievementTokens(userId, 'first_payment', 50);
      }

      return result;
    } catch (error) {
      logger.error('Error processing payment for treasury', { error: error.message, amount, userId });
      throw error;
    }
  }
}

export const treasuryService = new TreasuryService();