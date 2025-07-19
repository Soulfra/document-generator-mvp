"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementService = exports.AchievementService = void 0;
const database_1 = require("../../utils/database");
const platform_logger_service_1 = require("../monitoring/platform-logger.service");
const cleanup_memory_service_1 = require("../memory/cleanup-memory.service");
const serviceLogger = platform_logger_service_1.platformLogger.createServiceLogger('achievement-service');
const ACHIEVEMENTS = [
    {
        id: 'first-cleanup',
        title: 'First Steps',
        description: 'Complete your first code cleanup',
        icon: 'star',
        rarity: 'common',
        category: 'milestone',
        requirement: { type: 'count', metric: 'cleanups_completed', target: 1 },
        reward: { type: 'credit', value: '0.50' },
        xpValue: 100
    },
    {
        id: 'speed-demon',
        title: 'Speed Demon',
        description: 'Complete a cleanup in under 30 seconds',
        icon: 'zap',
        rarity: 'rare',
        category: 'efficiency',
        requirement: { type: 'threshold', metric: 'processing_time', target: 30, comparison: 'lte' },
        reward: { type: 'badge', value: 'Lightning Badge' },
        xpValue: 250
    },
    {
        id: 'clean-sweep',
        title: 'Clean Sweep',
        description: 'Process 100,000 lines of code',
        icon: 'code',
        rarity: 'epic',
        category: 'cleanup',
        requirement: { type: 'count', metric: 'lines_processed', target: 100000 },
        reward: { type: 'title', value: 'Code Surgeon' },
        xpValue: 500
    },
    {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Achieve 100% cleanup on 10 projects',
        icon: 'trophy',
        rarity: 'epic',
        category: 'cleanup',
        requirement: { type: 'count', metric: 'perfect_cleanups', target: 10 },
        reward: { type: 'feature', value: 'advanced-analytics' },
        xpValue: 750
    },
    {
        id: 'social-butterfly',
        title: 'Social Butterfly',
        description: 'Refer 5 successful users',
        icon: 'users',
        rarity: 'rare',
        category: 'social',
        requirement: { type: 'count', metric: 'successful_referrals', target: 5 },
        reward: { type: 'credit', value: '5.00' },
        xpValue: 300
    },
    {
        id: 'garbage-collector',
        title: 'Garbage Collector',
        description: 'Remove 10,000 lines of dead code',
        icon: 'trash',
        rarity: 'rare',
        category: 'cleanup',
        requirement: { type: 'count', metric: 'dead_code_removed', target: 10000 },
        reward: { type: 'badge', value: 'Cleaner Badge' },
        xpValue: 200
    },
    {
        id: 'consistency-king',
        title: 'Consistency King',
        description: 'Clean code for 7 days straight',
        icon: 'flame',
        rarity: 'legendary',
        category: 'milestone',
        requirement: { type: 'streak', metric: 'daily_cleanups', target: 7 },
        reward: { type: 'title', value: 'Code Master' },
        xpValue: 1000
    },
    {
        id: 'polyglot',
        title: 'Polyglot Programmer',
        description: 'Clean code in 5 different languages',
        icon: 'globe',
        rarity: 'rare',
        category: 'milestone',
        requirement: { type: 'count', metric: 'languages_cleaned', target: 5 },
        reward: { type: 'badge', value: 'Language Master' },
        xpValue: 400
    },
    {
        id: 'early-adopter',
        title: 'Early Adopter',
        description: 'Be among the first 1000 users',
        icon: 'crown',
        rarity: 'legendary',
        category: 'special',
        requirement: { type: 'special', metric: 'user_number', target: 1000 },
        reward: { type: 'badge', value: 'Founder Badge' },
        xpValue: 1500
    },
    {
        id: 'bug-hunter',
        title: 'Bug Hunter',
        description: 'Fix 1000 code issues',
        icon: 'bug',
        rarity: 'epic',
        category: 'cleanup',
        requirement: { type: 'count', metric: 'issues_fixed', target: 1000 },
        reward: { type: 'xp', value: 1000 },
        xpValue: 600
    }
];
const LEVEL_TITLES = [
    { level: 1, title: 'Code Novice', xpRequired: 0 },
    { level: 2, title: 'Code Apprentice', xpRequired: 100 },
    { level: 3, title: 'Code Journeyman', xpRequired: 300 },
    { level: 4, title: 'Code Craftsman', xpRequired: 600 },
    { level: 5, title: 'Code Artisan', xpRequired: 1000 },
    { level: 6, title: 'Code Expert', xpRequired: 1500 },
    { level: 7, title: 'Code Master', xpRequired: 2500 },
    { level: 8, title: 'Code Architect', xpRequired: 4000 },
    { level: 9, title: 'Code Sage', xpRequired: 6000 },
    { level: 10, title: 'Code Legend', xpRequired: 10000 }
];
class AchievementService {
    async checkAchievements(userId, jobId) {
        try {
            const startTime = Date.now();
            const unlockedAchievements = [];
            const userStats = await this.getUserStats(userId);
            const job = await database_1.prisma.job.findUnique({
                where: { id: jobId },
                include: { analysisResult: true }
            });
            if (!job)
                return [];
            await this.updateUserStats(userId, job);
            for (const achievement of ACHIEVEMENTS) {
                const isUnlocked = await this.checkAchievementProgress(userId, achievement, userStats);
                if (isUnlocked) {
                    const alreadyUnlocked = await this.hasAchievement(userId, achievement.id);
                    if (!alreadyUnlocked) {
                        await this.unlockAchievement(userId, achievement);
                        unlockedAchievements.push(achievement);
                    }
                }
            }
            if (unlockedAchievements.length > 0) {
                await this.updateUserLevel(userId);
            }
            if (unlockedAchievements.length > 0) {
                await cleanup_memory_service_1.cleanupMemory.logThought({
                    userId,
                    jobId,
                    eventType: 'achievement-unlock',
                    reasoning: {
                        intent: 'User achievements unlocked',
                        confidence: 1.0,
                        decisionPath: ['Job completed', 'Stats updated', 'Achievements checked'],
                        alternativesConsidered: []
                    },
                    learning: {
                        newPatterns: unlockedAchievements.map(a => a.id),
                        improvementNotes: [`Unlocked ${unlockedAchievements.length} achievements`]
                    }
                });
            }
            const duration = Date.now() - startTime;
            await serviceLogger.track('achievements-checked', duration, {
                userId,
                jobId,
                unlocked: unlockedAchievements.length
            });
            return unlockedAchievements;
        }
        catch (error) {
            serviceLogger.error(error, { userId, jobId, operation: 'check-achievements' });
            return [];
        }
    }
    async getUserStats(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                jobs: {
                    include: {
                        analysisResult: true
                    }
                }
            }
        });
        if (!user)
            return {};
        const stats = {
            cleanups_completed: 0,
            lines_processed: 0,
            perfect_cleanups: 0,
            dead_code_removed: 0,
            issues_fixed: 0,
            languages_cleaned: new Set().size,
            user_number: user.userNumber || 999999
        };
        for (const job of user.jobs) {
            if (job.status === 'COMPLETED') {
                stats.cleanups_completed++;
                if (job.analysisResult) {
                    stats.lines_processed += job.analysisResult.linesOfCode || 0;
                    stats.issues_fixed += job.analysisResult.issues?.length || 0;
                    if (job.analysisResult.languages) {
                        Object.keys(job.analysisResult.languages).forEach(lang => {
                        });
                    }
                    if (job.analysisResult.issues?.length === job.analysisResult.improvements?.length) {
                        stats.perfect_cleanups++;
                    }
                }
            }
        }
        const metadata = user.metadata || {};
        stats.successful_referrals = metadata.referralStats?.successful || 0;
        stats.daily_cleanups = metadata.streakStats?.current || 0;
        return stats;
    }
    async updateUserStats(userId, job) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return;
        const metadata = user.metadata || {};
        const stats = metadata.stats || {};
        if (job.processingStartedAt && job.processingEndedAt) {
            const processingTime = (job.processingEndedAt.getTime() - job.processingStartedAt.getTime()) / 1000;
            stats.fastestCleanup = Math.min(stats.fastestCleanup || 999999, processingTime);
        }
        const today = new Date().toDateString();
        const lastCleanup = metadata.lastCleanupDate;
        if (lastCleanup !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastCleanup === yesterday.toDateString()) {
                stats.currentStreak = (stats.currentStreak || 0) + 1;
            }
            else {
                stats.currentStreak = 1;
            }
            metadata.lastCleanupDate = today;
        }
        await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                metadata: {
                    ...metadata,
                    stats
                }
            }
        });
    }
    async checkAchievementProgress(userId, achievement, stats) {
        const { requirement } = achievement;
        const currentValue = stats[requirement.metric] || 0;
        switch (requirement.type) {
            case 'count':
                return currentValue >= requirement.target;
            case 'threshold':
                if (requirement.comparison === 'lte') {
                    return currentValue <= requirement.target && currentValue > 0;
                }
                else if (requirement.comparison === 'gte') {
                    return currentValue >= requirement.target;
                }
                return currentValue === requirement.target;
            case 'streak':
                return currentValue >= requirement.target;
            case 'special':
                if (achievement.id === 'early-adopter') {
                    return stats.user_number <= requirement.target;
                }
                return false;
            default:
                return false;
        }
    }
    async hasAchievement(userId, achievementId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user)
            return false;
        const achievements = user.metadata?.achievements || [];
        return achievements.some((a) => a.id === achievementId);
    }
    async unlockAchievement(userId, achievement) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user)
            return;
        const metadata = user.metadata || {};
        const achievements = metadata.achievements || [];
        const unlockedAt = new Date();
        achievements.push({
            id: achievement.id,
            unlockedAt
        });
        const currentXp = metadata.xp || 0;
        const newXp = currentXp + achievement.xpValue;
        await this.applyReward(userId, achievement.reward);
        await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                metadata: {
                    ...metadata,
                    achievements,
                    xp: newXp
                }
            }
        });
        serviceLogger.info('Achievement unlocked', {
            userId,
            achievementId: achievement.id,
            xpGained: achievement.xpValue
        });
    }
    async applyReward(userId, reward) {
        switch (reward.type) {
            case 'credit':
                const creditAmount = parseFloat(reward.value) * 100;
                await database_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        metadata: {
                            credits: {
                                increment: creditAmount
                            }
                        }
                    }
                });
                break;
            case 'badge':
            case 'title':
                break;
            case 'feature':
                const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                    const features = user.metadata?.enabledFeatures || [];
                    features.push(reward.value);
                    await database_1.prisma.user.update({
                        where: { id: userId },
                        data: {
                            metadata: {
                                ...(user.metadata || {}),
                                enabledFeatures: features
                            }
                        }
                    });
                }
                break;
            case 'xp':
                break;
        }
    }
    async updateUserLevel(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user)
            return;
        const metadata = user.metadata || {};
        const currentXp = metadata.xp || 0;
        const currentLevel = metadata.level || 1;
        let newLevel = 1;
        for (const levelData of LEVEL_TITLES) {
            if (currentXp >= levelData.xpRequired) {
                newLevel = levelData.level;
            }
            else {
                break;
            }
        }
        if (newLevel > currentLevel) {
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    metadata: {
                        ...metadata,
                        level: newLevel
                    }
                }
            });
            serviceLogger.info('User leveled up', {
                userId,
                oldLevel: currentLevel,
                newLevel,
                xp: currentXp
            });
        }
    }
    async getUserLevel(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return {
                level: 1,
                xp: 0,
                xpToNext: 100,
                title: 'Code Novice',
                perks: []
            };
        }
        const metadata = user.metadata || {};
        const currentXp = metadata.xp || 0;
        const currentLevel = metadata.level || 1;
        const currentLevelData = LEVEL_TITLES.find(l => l.level === currentLevel) || LEVEL_TITLES[0];
        const nextLevelData = LEVEL_TITLES.find(l => l.level === currentLevel + 1);
        const xpToNext = nextLevelData
            ? nextLevelData.xpRequired - currentXp
            : 0;
        const perks = this.getLevelPerks(currentLevel);
        return {
            level: currentLevel,
            xp: currentXp,
            xpToNext,
            title: currentLevelData.title,
            perks
        };
    }
    getLevelPerks(level) {
        const perks = [];
        if (level >= 2)
            perks.push('5% faster processing');
        if (level >= 3)
            perks.push('Custom profiles');
        if (level >= 4)
            perks.push('Priority queue');
        if (level >= 5)
            perks.push('Extended history');
        if (level >= 6)
            perks.push('Advanced analytics');
        if (level >= 7)
            perks.push('Team features');
        if (level >= 8)
            perks.push('API access');
        if (level >= 9)
            perks.push('White-label options');
        if (level >= 10)
            perks.push('Lifetime premium');
        return perks;
    }
    async getUserAchievements(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user)
            return [];
        const unlockedAchievements = user.metadata?.achievements || [];
        const stats = await this.getUserStats(userId);
        return ACHIEVEMENTS.map(achievement => {
            const unlocked = unlockedAchievements.find((a) => a.id === achievement.id);
            const currentValue = stats[achievement.requirement.metric] || 0;
            return {
                ...achievement,
                unlocked: !!unlocked,
                unlockedAt: unlocked?.unlockedAt,
                progress: {
                    current: Math.min(currentValue, achievement.requirement.target),
                    target: achievement.requirement.target
                }
            };
        });
    }
}
exports.AchievementService = AchievementService;
exports.achievementService = new AchievementService();
//# sourceMappingURL=achievement.service.js.map