export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    category: 'cleanup' | 'efficiency' | 'social' | 'milestone' | 'special';
    requirement: {
        type: 'count' | 'threshold' | 'streak' | 'special';
        metric: string;
        target: number;
        comparison?: 'gte' | 'lte' | 'eq';
    };
    reward: {
        type: 'credit' | 'badge' | 'title' | 'feature' | 'xp';
        value: string | number;
    };
    xpValue: number;
}
export interface UserLevel {
    level: number;
    xp: number;
    xpToNext: number;
    title: string;
    perks: string[];
}
export declare class AchievementService {
    checkAchievements(userId: string, jobId: string): Promise<Achievement[]>;
    private getUserStats;
    private updateUserStats;
    private checkAchievementProgress;
    private hasAchievement;
    private unlockAchievement;
    private applyReward;
    private updateUserLevel;
    getUserLevel(userId: string): Promise<UserLevel>;
    private getLevelPerks;
    getUserAchievements(userId: string): Promise<Array<Achievement & {
        unlocked: boolean;
        unlockedAt?: Date;
        progress: {
            current: number;
            target: number;
        };
    }>>;
}
export declare const achievementService: AchievementService;
//# sourceMappingURL=achievement.service.d.ts.map