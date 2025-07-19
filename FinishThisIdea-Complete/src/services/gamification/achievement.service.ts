import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { platformLogger } from '../monitoring/platform-logger.service';
import { cleanupMemory } from '../memory/cleanup-memory.service';

const serviceLogger = platformLogger.createServiceLogger('achievement-service');

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

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
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

// Level progression
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

export class AchievementService {
  /**
   * Check and unlock achievements for a user after a cleanup job
   */
  async checkAchievements(userId: string, jobId: string): Promise<Achievement[]> {
    try {
      const startTime = Date.now();
      const unlockedAchievements: Achievement[] = [];

      // Get user stats
      const userStats = await this.getUserStats(userId);
      
      // Get job details for specific achievements
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { analysisResult: true }
      });

      if (!job) return [];

      // Update stats based on job
      await this.updateUserStats(userId, job);

      // Check each achievement
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

      // Update user level if XP gained
      if (unlockedAchievements.length > 0) {
        await this.updateUserLevel(userId);
      }

      // Log to memory system
      if (unlockedAchievements.length > 0) {
        await cleanupMemory.logThought({
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

      // Track performance
      const duration = Date.now() - startTime;
      await serviceLogger.track('achievements-checked', duration, { 
        userId, 
        jobId,
        unlocked: unlockedAchievements.length 
      });

      return unlockedAchievements;

    } catch (error) {
      serviceLogger.error(error, { userId, jobId, operation: 'check-achievements' });
      return [];
    }
  }

  /**
   * Get user statistics for achievement checking
   */
  private async getUserStats(userId: string): Promise<Record<string, number>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobs: {
          include: {
            analysisResult: true
          }
        }
      }
    });

    if (!user) return {};

    const stats: Record<string, number> = {
      cleanups_completed: 0,
      lines_processed: 0,
      perfect_cleanups: 0,
      dead_code_removed: 0,
      issues_fixed: 0,
      languages_cleaned: new Set<string>().size,
      user_number: user.userNumber || 999999
    };

    // Calculate stats from jobs
    for (const job of user.jobs) {
      if (job.status === 'COMPLETED') {
        stats.cleanups_completed++;
        
        if (job.analysisResult) {
          stats.lines_processed += job.analysisResult.linesOfCode || 0;
          stats.issues_fixed += job.analysisResult.issues?.length || 0;
          
          // Track languages
          if (job.analysisResult.languages) {
            Object.keys(job.analysisResult.languages).forEach(lang => {
              // This would need proper tracking in the database
            });
          }
          
          // Check for perfect cleanup (all issues fixed)
          if (job.analysisResult.issues?.length === job.analysisResult.improvements?.length) {
            stats.perfect_cleanups++;
          }
        }
      }
    }

    // Get additional stats from user metadata
    const metadata = user.metadata as any || {};
    stats.successful_referrals = metadata.referralStats?.successful || 0;
    stats.daily_cleanups = metadata.streakStats?.current || 0;

    return stats;
  }

  /**
   * Update user stats after a job
   */
  private async updateUserStats(userId: string, job: any): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const metadata = user.metadata as any || {};
    const stats = metadata.stats || {};

    // Update processing time stats
    if (job.processingStartedAt && job.processingEndedAt) {
      const processingTime = (job.processingEndedAt.getTime() - job.processingStartedAt.getTime()) / 1000;
      stats.fastestCleanup = Math.min(stats.fastestCleanup || 999999, processingTime);
    }

    // Update streak
    const today = new Date().toDateString();
    const lastCleanup = metadata.lastCleanupDate;
    
    if (lastCleanup !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCleanup === yesterday.toDateString()) {
        stats.currentStreak = (stats.currentStreak || 0) + 1;
      } else {
        stats.currentStreak = 1;
      }
      
      metadata.lastCleanupDate = today;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          stats
        }
      }
    });
  }

  /**
   * Check if an achievement requirement is met
   */
  private async checkAchievementProgress(
    userId: string, 
    achievement: Achievement, 
    stats: Record<string, number>
  ): Promise<boolean> {
    const { requirement } = achievement;
    const currentValue = stats[requirement.metric] || 0;

    switch (requirement.type) {
      case 'count':
        return currentValue >= requirement.target;
      
      case 'threshold':
        if (requirement.comparison === 'lte') {
          return currentValue <= requirement.target && currentValue > 0;
        } else if (requirement.comparison === 'gte') {
          return currentValue >= requirement.target;
        }
        return currentValue === requirement.target;
      
      case 'streak':
        return currentValue >= requirement.target;
      
      case 'special':
        // Special achievements have custom logic
        if (achievement.id === 'early-adopter') {
          return stats.user_number <= requirement.target;
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Check if user already has an achievement
   */
  private async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return false;

    const achievements = (user.metadata as any)?.achievements || [];
    return achievements.some((a: any) => a.id === achievementId);
  }

  /**
   * Unlock an achievement for a user
   */
  private async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    const metadata = user.metadata as any || {};
    const achievements = metadata.achievements || [];
    const unlockedAt = new Date();

    // Add achievement
    achievements.push({
      id: achievement.id,
      unlockedAt
    });

    // Add XP
    const currentXp = metadata.xp || 0;
    const newXp = currentXp + achievement.xpValue;

    // Apply reward
    await this.applyReward(userId, achievement.reward);

    // Update user
    await prisma.user.update({
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

  /**
   * Apply achievement reward
   */
  private async applyReward(userId: string, reward: Achievement['reward']): Promise<void> {
    switch (reward.type) {
      case 'credit':
        // Add credit to user account
        const creditAmount = parseFloat(reward.value as string) * 100; // Convert to cents
        await prisma.user.update({
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
        // These are stored with the achievement
        break;
      
      case 'feature':
        // Enable feature flag
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const features = (user.metadata as any)?.enabledFeatures || [];
          features.push(reward.value);
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              metadata: {
                ...(user.metadata as any || {}),
                enabledFeatures: features
              }
            }
          });
        }
        break;
      
      case 'xp':
        // XP is already handled in unlockAchievement
        break;
    }
  }

  /**
   * Update user level based on XP
   */
  private async updateUserLevel(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    const metadata = user.metadata as any || {};
    const currentXp = metadata.xp || 0;
    const currentLevel = metadata.level || 1;

    // Find new level
    let newLevel = 1;
    for (const levelData of LEVEL_TITLES) {
      if (currentXp >= levelData.xpRequired) {
        newLevel = levelData.level;
      } else {
        break;
      }
    }

    // Update if level changed
    if (newLevel > currentLevel) {
      await prisma.user.update({
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

  /**
   * Get user level and progress
   */
  async getUserLevel(userId: string): Promise<UserLevel> {
    const user = await prisma.user.findUnique({
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

    const metadata = user.metadata as any || {};
    const currentXp = metadata.xp || 0;
    const currentLevel = metadata.level || 1;

    // Find current and next level data
    const currentLevelData = LEVEL_TITLES.find(l => l.level === currentLevel) || LEVEL_TITLES[0];
    const nextLevelData = LEVEL_TITLES.find(l => l.level === currentLevel + 1);

    const xpToNext = nextLevelData 
      ? nextLevelData.xpRequired - currentXp
      : 0;

    // Define perks based on level
    const perks = this.getLevelPerks(currentLevel);

    return {
      level: currentLevel,
      xp: currentXp,
      xpToNext,
      title: currentLevelData.title,
      perks
    };
  }

  /**
   * Get perks for a level
   */
  private getLevelPerks(level: number): string[] {
    const perks: string[] = [];

    if (level >= 2) perks.push('5% faster processing');
    if (level >= 3) perks.push('Custom profiles');
    if (level >= 4) perks.push('Priority queue');
    if (level >= 5) perks.push('Extended history');
    if (level >= 6) perks.push('Advanced analytics');
    if (level >= 7) perks.push('Team features');
    if (level >= 8) perks.push('API access');
    if (level >= 9) perks.push('White-label options');
    if (level >= 10) perks.push('Lifetime premium');

    return perks;
  }

  /**
   * Get all achievements with progress for a user
   */
  async getUserAchievements(userId: string): Promise<Array<Achievement & { 
    unlocked: boolean; 
    unlockedAt?: Date;
    progress: { current: number; target: number; };
  }>> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return [];

    const unlockedAchievements = (user.metadata as any)?.achievements || [];
    const stats = await this.getUserStats(userId);

    return ACHIEVEMENTS.map(achievement => {
      const unlocked = unlockedAchievements.find((a: any) => a.id === achievement.id);
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

// Export singleton instance
export const achievementService = new AchievementService();