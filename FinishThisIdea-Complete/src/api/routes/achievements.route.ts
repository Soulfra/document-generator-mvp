import express from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { achievementService } from '../../services/gamification/achievement.service';
import { logger } from '../../utils/logger';

const router = express.Router();

// Get user achievements and progress
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Get achievements with progress
    const achievements = await achievementService.getUserAchievements(userId);
    
    // Get user level info
    const userLevel = await achievementService.getUserLevel(userId);
    
    // Calculate overall stats
    const totalAchievements = achievements.length;
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalXp = achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.xpValue, 0);
    
    res.json({
      success: true,
      data: {
        achievements,
        userLevel,
        stats: {
          total: totalAchievements,
          unlocked: unlockedCount,
          completionPercentage: Math.round((unlockedCount / totalAchievements) * 100),
          totalXpEarned: totalXp
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get user achievements', { error, userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'ACHIEVEMENTS_FETCH_FAILED',
        message: 'Failed to retrieve achievements'
      }
    });
  }
}));

// Get all available achievements
router.get('/list', asyncHandler(async (req, res) => {
  const { category, rarity } = req.query;
  
  try {
    // This would typically come from a database
    // For now, returning the static list from the service
    const achievements = await achievementService.getUserAchievements('system');
    
    let filtered = achievements;
    
    if (category) {
      filtered = filtered.filter(a => a.category === category);
    }
    
    if (rarity) {
      filtered = filtered.filter(a => a.rarity === rarity);
    }
    
    res.json({
      success: true,
      data: {
        achievements: filtered.map(({ progress, unlocked, unlockedAt, ...achievement }) => achievement),
        categories: ['cleanup', 'efficiency', 'social', 'milestone', 'special'],
        rarities: ['common', 'rare', 'epic', 'legendary']
      }
    });
  } catch (error) {
    logger.error('Failed to list achievements', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'ACHIEVEMENTS_LIST_FAILED',
        message: 'Failed to list achievements'
      }
    });
  }
}));

// Check achievements after job completion (internal use)
router.post('/check/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { jobId } = req.body;
  
  if (!jobId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'JOB_ID_REQUIRED',
        message: 'Job ID is required'
      }
    });
  }
  
  try {
    const unlockedAchievements = await achievementService.checkAchievements(userId, jobId);
    
    res.json({
      success: true,
      data: {
        unlocked: unlockedAchievements,
        count: unlockedAchievements.length
      }
    });
  } catch (error) {
    logger.error('Failed to check achievements', { error, userId, jobId });
    res.status(500).json({
      success: false,
      error: {
        code: 'ACHIEVEMENT_CHECK_FAILED',
        message: 'Failed to check achievements'
      }
    });
  }
}));

// Get leaderboard
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { timeframe = 'all', limit = 10 } = req.query;
  
  try {
    // This would query the database for top users by XP
    // For now, returning mock data
    const leaderboard = [
      {
        rank: 1,
        userId: 'user-1',
        username: 'CodeMaster',
        level: 10,
        xp: 15420,
        achievementCount: 25,
        title: 'Code Legend'
      },
      {
        rank: 2,
        userId: 'user-2',
        username: 'CleanupPro',
        level: 9,
        xp: 12300,
        achievementCount: 22,
        title: 'Code Sage'
      },
      {
        rank: 3,
        userId: 'user-3',
        username: 'BugHunter',
        level: 8,
        xp: 9500,
        achievementCount: 20,
        title: 'Code Architect'
      }
    ];
    
    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.slice(0, parseInt(limit as string)),
        timeframe,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Failed to get leaderboard', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'LEADERBOARD_FAILED',
        message: 'Failed to retrieve leaderboard'
      }
    });
  }
}));

// Get user rank
router.get('/rank/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  try {
    const userLevel = await achievementService.getUserLevel(userId);
    
    // This would calculate actual rank from database
    // For now, returning mock data
    const rank = Math.floor(Math.random() * 100) + 1;
    const totalUsers = 1500;
    const percentile = Math.round((1 - rank / totalUsers) * 100);
    
    res.json({
      success: true,
      data: {
        userId,
        rank,
        totalUsers,
        percentile,
        level: userLevel.level,
        xp: userLevel.xp,
        title: userLevel.title
      }
    });
  } catch (error) {
    logger.error('Failed to get user rank', { error, userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'RANK_FAILED',
        message: 'Failed to retrieve user rank'
      }
    });
  }
}));

export { router as achievementsRouter };