"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.treasuryService = void 0;
const logger_1 = require("../../utils/logger");
const database_1 = require("../../utils/database");
const presence_logger_1 = require("../../monitoring/presence-logger");
class TreasuryService {
    dividendRate = 0.3;
    minimumPayout = 10;
    gradeThresholds = {
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
    async initializePlatformTokens() {
        try {
            const existingPlatform = await database_1.prisma.platformRevenue.findFirst();
            if (!existingPlatform) {
                await database_1.prisma.platformRevenue.create({
                    data: {
                        totalRevenue: 0,
                        tokenHolders: [],
                        dividendRate: this.dividendRate,
                        gradeThresholds: this.gradeThresholds,
                        status: 'active'
                    }
                });
                logger_1.logger.info('Platform token system initialized');
            }
        }
        catch (error) {
            logger_1.logger.warn('Platform token initialization skipped (table may not exist)', { error: error.message });
        }
    }
    async addRevenue(amount, options = {}) {
        try {
            const { source = 'usage', userId = 'anonymous', metadata = {} } = options;
            logger_1.logger.info('Platform revenue added', {
                userId,
                amount,
                source,
                timestamp: new Date().toISOString()
            });
            let platform;
            try {
                platform = await database_1.prisma.platformRevenue.findFirst();
                if (platform) {
                    platform = await database_1.prisma.platformRevenue.update({
                        where: { id: platform.id },
                        data: {
                            totalRevenue: platform.totalRevenue + amount,
                            lastRevenueUpdate: new Date()
                        }
                    });
                }
            }
            catch (error) {
                logger_1.logger.warn('Platform revenue table not found, using in-memory tracking', { error: error.message });
                platform = {
                    id: 'platform',
                    totalRevenue: amount,
                    tokenHolders: [],
                    dividendRate: this.dividendRate
                };
            }
            const dividendAmount = amount * this.dividendRate;
            if (userId !== 'anonymous') {
                await this.awardTokensForRevenue(userId, amount);
            }
            if (dividendAmount >= this.minimumPayout) {
                await this.queueDividendDistribution(dividendAmount);
            }
            if (source === 'referral' && metadata.referrerId) {
                await this.processReferralBonus(metadata.referrerId, amount);
            }
            logger_1.logger.info('Platform revenue added successfully', {
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
        }
        catch (error) {
            logger_1.logger.error('Error adding platform revenue', { error: error.message, amount, options });
            throw error;
        }
    }
    async awardTokensForRevenue(userId, revenueAmount) {
        try {
            const tokensToAward = this.calculateTokensForRevenue(revenueAmount);
            if (tokensToAward > 0) {
                try {
                    const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
                    if (user) {
                        await database_1.prisma.user.update({
                            where: { id: userId },
                            data: {
                                platformTokens: (user.platformTokens || 0) + tokensToAward,
                                lastTokenUpdate: new Date()
                            }
                        });
                    }
                }
                catch (error) {
                    logger_1.logger.warn('User table token update failed, using session tracking', { error: error.message });
                }
                await presence_logger_1.presenceLogger.logUserPresence('tokens_awarded', {
                    userId,
                    sessionId: 'system',
                    metadata: {
                        tokensAwarded: tokensToAward,
                        revenueAmount,
                        reason: 'revenue_contribution'
                    }
                });
                logger_1.logger.info('Platform tokens awarded', { userId, tokensAwarded: tokensToAward, revenueAmount });
            }
            return tokensToAward;
        }
        catch (error) {
            logger_1.logger.error('Error awarding tokens for revenue', { error: error.message, userId, revenueAmount });
            return 0;
        }
    }
    calculateTokensForRevenue(revenueAmount) {
        return Math.floor(revenueAmount);
    }
    async processReferralBonus(referrerId, revenueAmount) {
        try {
            const bonusAmount = revenueAmount * 0.1;
            const bonusTokens = this.calculateTokensForRevenue(bonusAmount);
            try {
                const referrer = await database_1.prisma.user.findUnique({ where: { id: referrerId } });
                if (referrer) {
                    await database_1.prisma.user.update({
                        where: { id: referrerId },
                        data: {
                            platformTokens: (referrer.platformTokens || 0) + bonusTokens,
                            referralEarnings: (referrer.referralEarnings || 0) + bonusAmount
                        }
                    });
                }
            }
            catch (error) {
                logger_1.logger.warn('Referrer bonus update failed, using logging only', { error: error.message });
            }
            await presence_logger_1.presenceLogger.logUserPresence('referral_bonus', {
                userId: referrerId,
                sessionId: 'system',
                metadata: {
                    bonusTokens,
                    bonusAmount,
                    sourceRevenue: revenueAmount
                }
            });
            logger_1.logger.info('Referral bonus processed', { referrerId, bonusTokens, bonusAmount });
        }
        catch (error) {
            logger_1.logger.error('Error processing referral bonus', { error: error.message, referrerId, revenueAmount });
        }
    }
    async queueDividendDistribution(amount) {
        try {
            await presence_logger_1.presenceLogger.logUserPresence('dividend_queued', {
                userId: 'system',
                sessionId: 'system',
                metadata: {
                    dividendAmount: amount,
                    queuedAt: new Date().toISOString()
                }
            });
            logger_1.logger.info('Dividend distribution queued', { amount });
            await this.distributeDividends(amount);
        }
        catch (error) {
            logger_1.logger.error('Error queuing dividend distribution', { error: error.message, amount });
        }
    }
    async distributeDividends(totalAmount) {
        try {
            let tokenHolders = [];
            try {
                tokenHolders = await database_1.prisma.user.findMany({
                    where: {
                        platformTokens: { gt: 0 }
                    },
                    select: {
                        id: true,
                        platformTokens: true,
                        name: true
                    }
                });
            }
            catch (error) {
                logger_1.logger.warn('Cannot fetch token holders from database, skipping distribution', { error: error.message });
                return { success: false, reason: 'No database access' };
            }
            if (tokenHolders.length === 0) {
                logger_1.logger.info('No token holders found for dividend distribution');
                return { success: true, distributed: 0, holders: 0 };
            }
            const totalTokens = tokenHolders.reduce((sum, holder) => sum + (holder.platformTokens || 0), 0);
            const payouts = [];
            for (const holder of tokenHolders) {
                if (holder.platformTokens > 0) {
                    const holderShare = totalAmount * (holder.platformTokens / totalTokens);
                    if (holderShare >= 0.01) {
                        try {
                            await database_1.prisma.user.update({
                                where: { id: holder.id },
                                data: {
                                    totalEarnings: { increment: holderShare },
                                    lastDividendPayout: new Date()
                                }
                            });
                        }
                        catch (error) {
                            logger_1.logger.warn('Failed to update user earnings in database', { error: error.message });
                        }
                        await presence_logger_1.presenceLogger.logUserPresence('dividend_received', {
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
            logger_1.logger.info('Dividends distributed successfully', {
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
        }
        catch (error) {
            logger_1.logger.error('Error distributing dividends', { error: error.message, totalAmount });
            throw error;
        }
    }
    async getUserEarnings(userId) {
        try {
            let user = null;
            try {
                user = await database_1.prisma.user.findUnique({
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
            }
            catch (error) {
                logger_1.logger.warn('Cannot fetch user from database, using defaults', { error: error.message });
            }
            let platform = null;
            try {
                platform = await database_1.prisma.platformRevenue.findFirst();
            }
            catch (error) {
                logger_1.logger.warn('Cannot fetch platform revenue, using defaults', { error: error.message });
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
        }
        catch (error) {
            logger_1.logger.error('Error getting user earnings', { error: error.message, userId });
            return {
                userId,
                tokensHeld: 0,
                ownershipPercentage: 0,
                totalEarnings: 0,
                error: 'Unable to fetch earnings data'
            };
        }
    }
    async getPlatformStats() {
        try {
            let platform = null;
            let userCount = 0;
            let totalTokens = 0;
            try {
                platform = await database_1.prisma.platformRevenue.findFirst();
                const users = await database_1.prisma.user.aggregate({
                    _count: { id: true },
                    _sum: { platformTokens: true }
                });
                userCount = users._count.id || 0;
                totalTokens = users._sum.platformTokens || 0;
            }
            catch (error) {
                logger_1.logger.warn('Cannot fetch platform stats from database', { error: error.message });
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
        }
        catch (error) {
            logger_1.logger.error('Error getting platform stats', { error: error.message });
            return {
                totalRevenue: 0,
                totalDividendsPaid: 0,
                totalTokens: 0,
                tokenHolders: 0,
                error: 'Unable to fetch platform statistics'
            };
        }
    }
    async getTotalTokensInCirculation() {
        try {
            const result = await database_1.prisma.user.aggregate({
                _sum: { platformTokens: true }
            });
            return result._sum.platformTokens || 0;
        }
        catch (error) {
            logger_1.logger.warn('Cannot fetch total tokens from database', { error: error.message });
            return 1;
        }
    }
    async awardAchievementTokens(userId, achievement, tokens) {
        try {
            try {
                const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                    await database_1.prisma.user.update({
                        where: { id: userId },
                        data: {
                            platformTokens: (user.platformTokens || 0) + tokens,
                            lastTokenUpdate: new Date()
                        }
                    });
                }
            }
            catch (error) {
                logger_1.logger.warn('Achievement token update failed, using logging only', { error: error.message });
            }
            await presence_logger_1.presenceLogger.logUserPresence('achievement_tokens', {
                userId,
                sessionId: 'system',
                metadata: {
                    achievement,
                    tokensAwarded: tokens,
                    awardedAt: new Date().toISOString()
                }
            });
            logger_1.logger.info('Achievement tokens awarded', { userId, achievement, tokens });
            return {
                success: true,
                achievement,
                tokensAwarded: tokens
            };
        }
        catch (error) {
            logger_1.logger.error('Error awarding achievement tokens', { error: error.message, userId, achievement });
            throw error;
        }
    }
    async processPayment(amount, userId, metadata = {}) {
        try {
            const result = await this.addRevenue(amount, {
                source: 'usage',
                userId,
                metadata
            });
            if (metadata.isFirstPayment) {
                await this.awardAchievementTokens(userId, 'first_payment', 50);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error processing payment for treasury', { error: error.message, amount, userId });
            throw error;
        }
    }
}
exports.treasuryService = new TreasuryService();
//# sourceMappingURL=treasury.service.js.map