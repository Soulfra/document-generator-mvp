/**
 * Gamification Service
 * Adapted from Soulfra-AgentZero's AI_ECONOMY_DASHBOARD
 * Provides achievements, levels, badges, and rewards system
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { MetricsService } from '../monitoring/metrics.service';

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
    timeActive: number; // in hours
    streak: number; // daily streak
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

export class GamificationService extends EventEmitter {
  private prisma: PrismaClient;
  private metricsService: MetricsService;
  private achievements: Map<string, Achievement> = new Map();
  private levels: UserLevel[] = [];
  
  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.metricsService = new MetricsService();
    
    this.initializeAchievements();
    this.initializeLevels();
  }

  /**
   * Initialize achievements system
   */
  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Code achievements
      {
        id: 'first-cleanup',
        name: 'Clean Start',
        description: 'Complete your first code cleanup',
        icon: '🧹',
        category: 'code',
        points: 10,
        requirements: [
          { type: 'codeImproved', value: 1, comparison: 'gte' }
        ],
        rewards: { tokens: 5, badge: 'cleaner' },
        rarity: 'common'
      },
      {
        id: 'code-master',
        name: 'Code Master',
        description: 'Analyze 1000 files',
        icon: '🎯',
        category: 'code',
        points: 100,
        requirements: [
          { type: 'codeAnalyzed', value: 1000, comparison: 'gte' }
        ],
        rewards: { tokens: 100, badge: 'master', title: 'Code Master' },
        rarity: 'epic'
      },
      {
        id: 'quality-guardian',
        name: 'Quality Guardian',
        description: 'Improve code quality score by 50% or more',
        icon: '⚔️',
        category: 'code',
        points: 50,
        requirements: [
          { type: 'qualityImprovement', value: 50, comparison: 'gte' }
        ],
        rewards: { tokens: 50, badge: 'guardian' },
        rarity: 'rare'
      },
      
      // Social achievements
      {
        id: 'team-player',
        name: 'Team Player',
        description: 'Collaborate on 10 projects',
        icon: '🤝',
        category: 'social',
        points: 30,
        requirements: [
          { type: 'collaborations', value: 10, comparison: 'gte' }
        ],
        rewards: { tokens: 30, badge: 'team-player' },
        rarity: 'uncommon'
      },
      {
        id: 'influencer',
        name: 'Influencer',
        description: 'Refer 25 users to the platform',
        icon: '📢',
        category: 'social',
        points: 75,
        requirements: [
          { type: 'referrals', value: 25, comparison: 'gte' }
        ],
        rewards: { tokens: 150, badge: 'influencer', feature: 'custom-referral-code' },
        rarity: 'rare'
      },
      
      // Milestone achievements
      {
        id: 'early-adopter',
        name: 'Early Adopter',
        description: 'Join during the first month',
        icon: '🌟',
        category: 'milestone',
        points: 25,
        requirements: [
          { type: 'joinDate', value: 30, comparison: 'lte' }
        ],
        rewards: { tokens: 50, badge: 'early-adopter', title: 'Pioneer' },
        rarity: 'rare'
      },
      {
        id: 'streak-master',
        name: 'Streak Master',
        description: 'Maintain a 30-day activity streak',
        icon: '🔥',
        category: 'milestone',
        points: 40,
        requirements: [
          { type: 'streak', value: 30, comparison: 'gte' }
        ],
        rewards: { tokens: 60, badge: 'streak-master' },
        rarity: 'uncommon'
      },
      {
        id: 'api-warrior',
        name: 'API Warrior',
        description: 'Make 10,000 API calls',
        icon: '⚡',
        category: 'milestone',
        points: 60,
        requirements: [
          { type: 'apiCallsMade', value: 10000, comparison: 'gte' }
        ],
        rewards: { tokens: 80, badge: 'api-warrior' },
        rarity: 'rare'
      },
      
      // Special achievements
      {
        id: 'bug-hunter',
        name: 'Bug Hunter',
        description: 'Report a critical bug that gets fixed',
        icon: '🐛',
        category: 'special',
        points: 100,
        requirements: [
          { type: 'bugsReported', value: 1, comparison: 'gte' }
        ],
        rewards: { tokens: 200, badge: 'bug-hunter', title: 'Bug Hunter' },
        rarity: 'epic'
      },
      {
        id: 'legendary-contributor',
        name: 'Legendary Contributor',
        description: 'Have your code improvement merged into the platform',
        icon: '👑',
        category: 'special',
        points: 500,
        requirements: [
          { type: 'platformContribution', value: 1, comparison: 'gte' }
        ],
        rewards: { tokens: 1000, badge: 'legendary', title: 'Legendary Contributor' },
        rarity: 'legendary'
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * Initialize leveling system
   */
  private initializeLevels(): void {
    this.levels = [
      {
        level: 1,
        title: 'Code Novice',
        minXP: 0,
        maxXP: 100,
        perks: ['Basic code analysis'],
        tokenMultiplier: 1.0
      },
      {
        level: 2,
        title: 'Code Apprentice',
        minXP: 100,
        maxXP: 250,
        perks: ['Priority support'],
        tokenMultiplier: 1.1
      },
      {
        level: 3,
        title: 'Code Adept',
        minXP: 250,
        maxXP: 500,
        perks: ['Advanced AI models'],
        tokenMultiplier: 1.2
      },
      {
        level: 4,
        title: 'Code Expert',
        minXP: 500,
        maxXP: 1000,
        perks: ['Custom profiles'],
        tokenMultiplier: 1.3
      },
      {
        level: 5,
        title: 'Code Master',
        minXP: 1000,
        maxXP: 2000,
        perks: ['Team features'],
        tokenMultiplier: 1.4
      },
      {
        level: 6,
        title: 'Code Sage',
        minXP: 2000,
        maxXP: 4000,
        perks: ['API priority'],
        tokenMultiplier: 1.5
      },
      {
        level: 7,
        title: 'Code Oracle',
        minXP: 4000,
        maxXP: 8000,
        perks: ['Beta features'],
        tokenMultiplier: 1.6
      },
      {
        level: 8,
        title: 'Code Architect',
        minXP: 8000,
        maxXP: 16000,
        perks: ['Architecture consulting'],
        tokenMultiplier: 1.7
      },
      {
        level: 9,
        title: 'Code Virtuoso',
        minXP: 16000,
        maxXP: 32000,
        perks: ['White-label options'],
        tokenMultiplier: 1.8
      },
      {
        level: 10,
        title: 'Code Legend',
        minXP: 32000,
        maxXP: 999999,
        perks: ['All features', 'Custom integrations', 'Direct support'],
        tokenMultiplier: 2.0
      }
    ];
  }

  /**
   * Track user action and award XP/achievements
   */
  async trackAction(userId: string, action: string, value: number = 1): Promise<{
    xpGained: number;
    newAchievements: Achievement[];
    levelUp?: UserLevel;
    tokensEarned: number;
  }> {
    try {
      // Get or create user progress
      let progress = await this.getUserProgress(userId);
      
      // Award XP based on action
      const xpGained = this.calculateXP(action, value);
      progress.xp += xpGained;
      
      // Update stats
      this.updateStats(progress, action, value);
      
      // Check for level up
      const levelUp = this.checkLevelUp(progress);
      
      // Check for new achievements
      const newAchievements = await this.checkAchievements(progress);
      
      // Calculate tokens earned
      let tokensEarned = Math.floor(xpGained * 0.1); // Base token rate
      
      // Apply level multiplier
      const currentLevel = this.levels.find(l => l.level === progress.level);
      if (currentLevel) {
        tokensEarned = Math.floor(tokensEarned * currentLevel.tokenMultiplier);
      }
      
      // Add achievement rewards
      for (const achievement of newAchievements) {
        if (achievement.rewards.tokens) {
          tokensEarned += achievement.rewards.tokens;
        }
        progress.achievements.push(achievement.id);
        if (achievement.rewards.badge) {
          progress.badges.push(achievement.rewards.badge);
        }
        if (achievement.rewards.title) {
          progress.titles.push(achievement.rewards.title);
        }
      }
      
      // Update tokens
      progress.tokens += tokensEarned;
      
      // Save progress
      await this.saveUserProgress(progress);
      
      // Emit events
      if (newAchievements.length > 0) {
        this.emit('achievements-unlocked', {
          userId,
          achievements: newAchievements
        });
      }
      
      if (levelUp) {
        this.emit('level-up', {
          userId,
          newLevel: levelUp
        });
      }
      
      // Record metrics
      this.metricsService.recordMetric({
        name: 'gamification.action',
        value: 1,
        tags: {
          userId,
          action,
          xpGained: xpGained.toString(),
          tokensEarned: tokensEarned.toString()
        }
      });
      
      return {
        xpGained,
        newAchievements,
        levelUp,
        tokensEarned
      };
    } catch (error) {
      logger.error('Error tracking action', error);
      throw error;
    }
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    // In production, load from database
    // For now, return default progress
    return {
      userId,
      xp: 0,
      level: 1,
      tokens: 100, // Starting tokens
      achievements: [],
      badges: [],
      titles: ['Code Novice'],
      stats: {
        codeAnalyzed: 0,
        codeImproved: 0,
        projectsCreated: 0,
        collaborations: 0,
        referrals: 0,
        apiCallsMade: 0,
        timeActive: 0,
        streak: 0
      }
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: 'xp' | 'tokens' | 'achievements' | 'streak' = 'xp',
    limit: number = 10,
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all'
  ): Promise<LeaderboardEntry[]> {
    try {
      // In production, query from database with proper filtering
      // For now, return mock data
      const mockEntries: LeaderboardEntry[] = [
        {
          userId: 'user-1',
          username: 'CodeMaster',
          score: 5420,
          level: 8,
          achievements: 15,
          rank: 1
        },
        {
          userId: 'user-2',
          username: 'BugHunter',
          score: 4850,
          level: 7,
          achievements: 12,
          rank: 2
        },
        {
          userId: 'user-3',
          username: 'QualityGuardian',
          score: 3920,
          level: 6,
          achievements: 10,
          rank: 3
        }
      ];
      
      return mockEntries.slice(0, limit);
    } catch (error) {
      logger.error('Error getting leaderboard', error);
      throw error;
    }
  }

  /**
   * Get user rank
   */
  async getUserRank(userId: string, type: 'xp' | 'tokens' | 'achievements' = 'xp'): Promise<number> {
    // In production, calculate from database
    return 42; // Mock rank
  }

  /**
   * Award custom achievement
   */
  async awardCustomAchievement(userId: string, achievementId: string): Promise<void> {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }
    
    const progress = await this.getUserProgress(userId);
    
    if (!progress.achievements.includes(achievementId)) {
      progress.achievements.push(achievementId);
      progress.xp += achievement.points;
      
      if (achievement.rewards.tokens) {
        progress.tokens += achievement.rewards.tokens;
      }
      
      await this.saveUserProgress(progress);
      
      this.emit('achievement-awarded', {
        userId,
        achievement
      });
    }
  }

  /**
   * Get achievement progress
   */
  async getAchievementProgress(userId: string): Promise<{
    unlocked: Achievement[];
    locked: Achievement[];
    progress: Map<string, number>;
  }> {
    const progress = await this.getUserProgress(userId);
    const unlocked: Achievement[] = [];
    const locked: Achievement[] = [];
    const progressMap = new Map<string, number>();
    
    this.achievements.forEach(achievement => {
      if (progress.achievements.includes(achievement.id)) {
        unlocked.push(achievement);
      } else {
        locked.push(achievement);
        
        // Calculate progress for locked achievements
        const progressPercent = this.calculateAchievementProgress(
          achievement,
          progress
        );
        progressMap.set(achievement.id, progressPercent);
      }
    });
    
    return {
      unlocked,
      locked,
      progress: progressMap
    };
  }

  /**
   * Private helper methods
   */
  private calculateXP(action: string, value: number): number {
    const xpRates: Record<string, number> = {
      'code.analyze': 5,
      'code.improve': 10,
      'code.cleanup': 15,
      'project.create': 20,
      'collaboration.join': 25,
      'referral.successful': 50,
      'api.call': 1,
      'daily.login': 10,
      'bug.report': 100,
      'contribution.merged': 500
    };
    
    return (xpRates[action] || 1) * value;
  }

  private updateStats(progress: UserProgress, action: string, value: number): void {
    switch (action) {
      case 'code.analyze':
        progress.stats.codeAnalyzed += value;
        break;
      case 'code.improve':
      case 'code.cleanup':
        progress.stats.codeImproved += value;
        break;
      case 'project.create':
        progress.stats.projectsCreated += value;
        break;
      case 'collaboration.join':
        progress.stats.collaborations += value;
        break;
      case 'referral.successful':
        progress.stats.referrals += value;
        break;
      case 'api.call':
        progress.stats.apiCallsMade += value;
        break;
      case 'daily.login':
        progress.stats.streak = value; // Value is the current streak
        break;
    }
  }

  private checkLevelUp(progress: UserProgress): UserLevel | undefined {
    const currentLevel = this.levels.find(l => l.level === progress.level);
    const nextLevel = this.levels.find(l => l.level === progress.level + 1);
    
    if (currentLevel && nextLevel && progress.xp >= nextLevel.minXP) {
      progress.level = nextLevel.level;
      progress.titles.push(nextLevel.title);
      return nextLevel;
    }
    
    return undefined;
  }

  private async checkAchievements(progress: UserProgress): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    
    this.achievements.forEach(achievement => {
      if (!progress.achievements.includes(achievement.id)) {
        const isUnlocked = this.checkAchievementRequirements(
          achievement,
          progress
        );
        
        if (isUnlocked) {
          newAchievements.push(achievement);
        }
      }
    });
    
    return newAchievements;
  }

  private checkAchievementRequirements(
    achievement: Achievement,
    progress: UserProgress
  ): boolean {
    for (const req of achievement.requirements) {
      const value = this.getStatValue(req.type, progress);
      
      switch (req.comparison) {
        case 'gte':
          if (value < req.value) return false;
          break;
        case 'lte':
          if (value > req.value) return false;
          break;
        case 'eq':
          if (value !== req.value) return false;
          break;
      }
    }
    
    return true;
  }

  private calculateAchievementProgress(
    achievement: Achievement,
    progress: UserProgress
  ): number {
    let totalProgress = 0;
    
    for (const req of achievement.requirements) {
      const value = this.getStatValue(req.type, progress);
      const reqProgress = Math.min((value / req.value) * 100, 100);
      totalProgress += reqProgress;
    }
    
    return totalProgress / achievement.requirements.length;
  }

  private getStatValue(statType: string, progress: UserProgress): number {
    const statMap: Record<string, number> = {
      codeAnalyzed: progress.stats.codeAnalyzed,
      codeImproved: progress.stats.codeImproved,
      projectsCreated: progress.stats.projectsCreated,
      collaborations: progress.stats.collaborations,
      referrals: progress.stats.referrals,
      apiCallsMade: progress.stats.apiCallsMade,
      streak: progress.stats.streak,
      level: progress.level,
      tokens: progress.tokens
    };
    
    return statMap[statType] || 0;
  }

  private async saveUserProgress(progress: UserProgress): Promise<void> {
    // In production, save to database
    logger.info('Saving user progress', { userId: progress.userId });
  }
}