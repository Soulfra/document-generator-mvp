import { EventEmitter } from 'events';
interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'code' | 'social' | 'contribution' | 'milestone' | 'special';
    points: number;
    requirements: {
        type: string;
        value: number;
        comparison: 'gte' | 'lte' | 'eq';
    }[];
    rewards: {
        tokens?: number;
        badge?: string;
        title?: string;
        feature?: string;
    };
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}
interface UserLevel {
    level: number;
    title: string;
    minXP: number;
    maxXP: number;
    perks: string[];
    tokenMultiplier: number;
}
interface UserProgress {
    userId: string;
    xp: number;
    level: number;
    tokens: number;
    achievements: string[];
    badges: string[];
    titles: string[];
    stats: {
        codeAnalyzed: number;
        codeImproved: number;
        projectsCreated: number;
        collaborations: number;
        referrals: number;
        apiCallsMade: number;
        timeActive: number;
        streak: number;
    };
}
interface LeaderboardEntry {
    userId: string;
    username: string;
    score: number;
    level: number;
    achievements: number;
    rank: number;
}
export declare class GamificationService extends EventEmitter {
    private prisma;
    private metricsService;
    private achievements;
    private levels;
    constructor();
    private initializeAchievements;
    private initializeLevels;
    trackAction(userId: string, action: string, value?: number): Promise<{
        xpGained: number;
        newAchievements: Achievement[];
        levelUp?: UserLevel;
        tokensEarned: number;
    }>;
    getUserProgress(userId: string): Promise<UserProgress>;
    getLeaderboard(type?: 'xp' | 'tokens' | 'achievements' | 'streak', limit?: number, timeframe?: 'daily' | 'weekly' | 'monthly' | 'all'): Promise<LeaderboardEntry[]>;
    getUserRank(userId: string, type?: 'xp' | 'tokens' | 'achievements'): Promise<number>;
    awardCustomAchievement(userId: string, achievementId: string): Promise<void>;
    getAchievementProgress(userId: string): Promise<{
        unlocked: Achievement[];
        locked: Achievement[];
        progress: Map<string, number>;
    }>;
    private calculateXP;
    private updateStats;
    private checkLevelUp;
    private checkAchievements;
    private checkAchievementRequirements;
    private calculateAchievementProgress;
    private getStatValue;
    private saveUserProgress;
}
export {};
//# sourceMappingURL=gamification.service.d.ts.map