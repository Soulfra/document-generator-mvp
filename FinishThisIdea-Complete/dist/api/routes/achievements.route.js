"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementsRouter = void 0;
const express_1 = __importDefault(require("express"));
const async_handler_1 = require("../../utils/async-handler");
const achievement_service_1 = require("../../services/gamification/achievement.service");
const logger_1 = require("../../utils/logger");
const router = express_1.default.Router();
exports.achievementsRouter = router;
router.get('/user/:userId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    try {
        const achievements = await achievement_service_1.achievementService.getUserAchievements(userId);
        const userLevel = await achievement_service_1.achievementService.getUserLevel(userId);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get user achievements', { error, userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'ACHIEVEMENTS_FETCH_FAILED',
                message: 'Failed to retrieve achievements'
            }
        });
    }
}));
router.get('/list', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { category, rarity } = req.query;
    try {
        const achievements = await achievement_service_1.achievementService.getUserAchievements('system');
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
    }
    catch (error) {
        logger_1.logger.error('Failed to list achievements', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'ACHIEVEMENTS_LIST_FAILED',
                message: 'Failed to list achievements'
            }
        });
    }
}));
router.post('/check/:userId', (0, async_handler_1.asyncHandler)(async (req, res) => {
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
        const unlockedAchievements = await achievement_service_1.achievementService.checkAchievements(userId, jobId);
        res.json({
            success: true,
            data: {
                unlocked: unlockedAchievements,
                count: unlockedAchievements.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to check achievements', { error, userId, jobId });
        res.status(500).json({
            success: false,
            error: {
                code: 'ACHIEVEMENT_CHECK_FAILED',
                message: 'Failed to check achievements'
            }
        });
    }
}));
router.get('/leaderboard', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { timeframe = 'all', limit = 10 } = req.query;
    try {
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
                leaderboard: leaderboard.slice(0, parseInt(limit)),
                timeframe,
                updatedAt: new Date()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get leaderboard', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'LEADERBOARD_FAILED',
                message: 'Failed to retrieve leaderboard'
            }
        });
    }
}));
router.get('/rank/:userId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    try {
        const userLevel = await achievement_service_1.achievementService.getUserLevel(userId);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get user rank', { error, userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'RANK_FAILED',
                message: 'Failed to retrieve user rank'
            }
        });
    }
}));
//# sourceMappingURL=achievements.route.js.map