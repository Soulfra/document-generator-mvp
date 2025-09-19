#!/usr/bin/env node

// 📋🏆 COLLECTION LOG SYSTEM
// Advanced tracking system for achievements, items, and progress
// Integrates with Soul of Soulfra for comprehensive achievement tracking

const fs = require('fs');
const crypto = require('crypto');

class CollectionLogSystem {
    constructor() {
        // Collection log categories and their requirements
        this.collectionCategories = {
            'combat_achievements': {
                name: 'Combat Achievements',
                description: 'Combat-related milestones and boss kills',
                items: [
                    { name: 'First Boss Kill', requirement: 'Kill any boss', tier_bonus: 5 },
                    { name: 'Jad Slayer', requirement: 'Complete Fight Caves', tier_bonus: 15 },
                    { name: 'Dragon Slayer', requirement: 'Complete Dragon Slayer quest', tier_bonus: 10 },
                    { name: 'Barrows Brother', requirement: 'Kill all 6 Barrows brothers', tier_bonus: 20 },
                    { name: 'GWD Master', requirement: 'Kill all God Wars Dungeon bosses', tier_bonus: 25 },
                    { name: 'Slayer Master', requirement: 'Reach 99 Slayer', tier_bonus: 30 },
                    { name: 'Combat Master', requirement: 'Max all combat stats', tier_bonus: 40 }
                ],
                completion_reward: { tier_bonus: 100, soul_power: 500 }
            },
            
            'skilling_achievements': {
                name: 'Skilling Achievements', 
                description: 'Non-combat skill milestones',
                items: [
                    { name: 'First 99', requirement: 'Reach level 99 in any skill', tier_bonus: 20 },
                    { name: 'Skill Pure', requirement: 'Reach 99 in one skill while keeping others low', tier_bonus: 15 },
                    { name: 'Crafting Master', requirement: 'Create high-level items', tier_bonus: 12 },
                    { name: 'Resource Gatherer', requirement: 'Gather rare resources', tier_bonus: 8 },
                    { name: 'Max Total', requirement: 'Reach maximum total level', tier_bonus: 50 },
                    { name: 'Skill Completionist', requirement: 'Complete all skill-related activities', tier_bonus: 60 }
                ],
                completion_reward: { tier_bonus: 120, soul_power: 600 }
            },
            
            'quest_achievements': {
                name: 'Quest Achievements',
                description: 'Quest completion and story milestones',
                items: [
                    { name: 'Quest Beginner', requirement: 'Complete 10 quests', tier_bonus: 5 },
                    { name: 'Quest Adept', requirement: 'Complete 50 quests', tier_bonus: 15 },
                    { name: 'Quest Master', requirement: 'Complete 100 quests', tier_bonus: 25 },
                    { name: 'Grandmaster Quester', requirement: 'Complete all grandmaster quests', tier_bonus: 35 },
                    { name: 'Quest Point Cape', requirement: 'Complete all quests', tier_bonus: 50 },
                    { name: 'Lore Master', requirement: 'Discover all lore books', tier_bonus: 20 }
                ],
                completion_reward: { tier_bonus: 150, soul_power: 750 }
            },
            
            'rare_drops': {
                name: 'Rare Drops',
                description: 'Extremely rare item acquisitions',
                items: [
                    { name: 'Pet Drop', requirement: 'Obtain any boss pet', tier_bonus: 30 },
                    { name: 'Third Age Item', requirement: 'Obtain third age equipment', tier_bonus: 100 },
                    { name: 'Draconic Visage', requirement: 'Obtain draconic visage drop', tier_bonus: 50 },
                    { name: 'Champion Scroll', requirement: 'Obtain champion scroll', tier_bonus: 25 },
                    { name: 'Clue Scroll Master', requirement: 'Complete 1000 clue scrolls', tier_bonus: 40 },
                    { name: 'RNG Carried', requirement: 'Obtain 5+ rare drops in single day', tier_bonus: 75 }
                ],
                completion_reward: { tier_bonus: 300, soul_power: 1500 }
            },
            
            'minigame_achievements': {
                name: 'Minigame Achievements',
                description: 'Minigame and special activity completions',
                items: [
                    { name: 'Castle Wars Veteran', requirement: 'Play 100 Castle Wars games', tier_bonus: 10 },
                    { name: 'Pest Control Hero', requirement: 'Complete 500 Pest Control games', tier_bonus: 15 },
                    { name: 'Barbarian Assault Master', requirement: 'Complete all BA roles', tier_bonus: 20 },
                    { name: 'Minigame Completionist', requirement: 'Master all minigames', tier_bonus: 50 },
                    { name: 'Trouble Brewing', requirement: 'Max Trouble Brewing reputation', tier_bonus: 25 }
                ],
                completion_reward: { tier_bonus: 80, soul_power: 400 }
            },
            
            'economic_achievements': {
                name: 'Economic Achievements',
                description: 'Trading and wealth accumulation milestones',
                items: [
                    { name: 'First Million', requirement: 'Accumulate 1M GP', tier_bonus: 5 },
                    { name: 'Wealthy Trader', requirement: 'Accumulate 100M GP', tier_bonus: 20 },
                    { name: 'Merchant Prince', requirement: 'Accumulate 1B GP', tier_bonus: 50 },
                    { name: 'GE Flipper', requirement: 'Make 10M profit from flipping', tier_bonus: 15 },
                    { name: 'Market Manipulator', requirement: 'Control item prices', tier_bonus: 30 },
                    { name: 'Economic Emperor', requirement: 'Own max cash stack', tier_bonus: 100 }
                ],
                completion_reward: { tier_bonus: 200, soul_power: 1000 }
            },
            
            'social_achievements': {
                name: 'Social Achievements',
                description: 'Community and social interaction milestones',
                items: [
                    { name: 'Clan Member', requirement: 'Join a clan', tier_bonus: 3 },
                    { name: 'Clan Leader', requirement: 'Lead a successful clan', tier_bonus: 20 },
                    { name: 'Helper', requirement: 'Help 100 new players', tier_bonus: 15 },
                    { name: 'Community Figure', requirement: 'Gain community recognition', tier_bonus: 25 },
                    { name: 'Content Creator', requirement: 'Create RuneScape content', tier_bonus: 30 },
                    { name: 'Influencer', requirement: 'Build large following', tier_bonus: 40 }
                ],
                completion_reward: { tier_bonus: 120, soul_power: 600 }
            },
            
            'meta_achievements': {
                name: 'Meta Achievements',
                description: 'Achievements about achievements and system mastery',
                items: [
                    { name: 'Achievement Hunter', requirement: 'Complete 50 achievements', tier_bonus: 25 },
                    { name: 'Completionist', requirement: 'Complete 90% of all achievements', tier_bonus: 75 },
                    { name: 'Collection Log Master', requirement: 'Fill entire collection log', tier_bonus: 100 },
                    { name: 'Soul Pioneer', requirement: 'Create first Soul of Soulfra', tier_bonus: 50 },
                    { name: 'System Master', requirement: 'Master all game systems', tier_bonus: 150 },
                    { name: 'Living Legend', requirement: 'Achieve mythical status', tier_bonus: 200 }
                ],
                completion_reward: { tier_bonus: 500, soul_power: 2500 }
            }
        };
        
        // Achievement rarity levels
        this.rarityLevels = {
            'common': { color: '#cccccc', multiplier: 1.0, description: 'Easy to obtain' },
            'uncommon': { color: '#00ff00', multiplier: 1.5, description: 'Requires some effort' },
            'rare': { color: '#0088ff', multiplier: 2.0, description: 'Difficult to achieve' },
            'epic': { color: '#aa00ff', multiplier: 3.0, description: 'Very challenging' },
            'legendary': { color: '#ff8800', multiplier: 5.0, description: 'Extremely rare' },
            'mythic': { color: '#ff0080', multiplier: 10.0, description: 'Nearly impossible' }
        };
        
        // User collection logs
        this.userCollectionLogs = new Map();
        
        console.log('📋🏆 Collection Log System initialized');
        this.initializeCollectionSystem();
    }
    
    initializeCollectionSystem() {
        console.log('🚀 Setting up collection log categories...');
        
        let totalAchievements = 0;
        let totalTierBonus = 0;
        
        for (const [categoryId, category] of Object.entries(this.collectionCategories)) {
            totalAchievements += category.items.length;
            totalTierBonus += category.items.reduce((sum, item) => sum + item.tier_bonus, 0);
            totalTierBonus += category.completion_reward.tier_bonus;
            
            console.log(`  📂 ${category.name}: ${category.items.length} achievements`);
        }
        
        console.log(`✅ Collection Log System ready:`);
        console.log(`  📊 Total achievements: ${totalAchievements}`);
        console.log(`  🎯 Total tier bonus available: ${totalTierBonus}`);
        console.log(`  📂 Categories: ${Object.keys(this.collectionCategories).length}`);
    }
    
    createUserCollectionLog(userId, userName = null) {
        if (this.userCollectionLogs.has(userId)) {
            return this.userCollectionLogs.get(userId);
        }
        
        const collectionLog = {
            userId,
            userName: userName || `Player_${userId}`,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            
            // Progress tracking
            progress: {
                totalAchievements: 0,
                totalTierBonus: 0,
                totalSoulPower: 0,
                completedCategories: 0,
                overallCompletion: 0
            },
            
            // Category progress
            categories: new Map(),
            
            // Recent achievements
            recentAchievements: [],
            
            // Milestones
            milestones: [],
            
            // Statistics
            stats: {
                firstAchievement: null,
                rarest: null,
                favoriteCategory: null,
                streaks: {
                    current: 0,
                    longest: 0
                }
            }
        };
        
        // Initialize all categories
        for (const [categoryId, category] of Object.entries(this.collectionCategories)) {
            collectionLog.categories.set(categoryId, {
                name: category.name,
                description: category.description,
                completed: [],
                progress: 0,
                isComplete: false,
                completedAt: null
            });
        }
        
        this.userCollectionLogs.set(userId, collectionLog);
        
        console.log(`📋 Collection log created for user: ${userId}`);
        return collectionLog;
    }
    
    unlockAchievement(userId, categoryId, achievementName, evidence = null) {
        // Get or create user collection log
        const collectionLog = this.getUserCollectionLog(userId) || this.createUserCollectionLog(userId);
        
        // Find the achievement
        const category = this.collectionCategories[categoryId];
        if (!category) {
            throw new Error(`Category ${categoryId} not found`);
        }
        
        const achievement = category.items.find(item => item.name === achievementName);
        if (!achievement) {
            throw new Error(`Achievement ${achievementName} not found in category ${categoryId}`);
        }
        
        // Check if already unlocked
        const userCategory = collectionLog.categories.get(categoryId);
        if (userCategory.completed.find(a => a.name === achievementName)) {
            console.log(`⚠️ Achievement ${achievementName} already unlocked for user ${userId}`);
            return null;
        }
        
        // Create achievement unlock record
        const unlockedAchievement = {
            ...achievement,
            categoryId,
            categoryName: category.name,
            unlockedAt: Date.now(),
            evidence,
            rarity: this.calculateAchievementRarity(achievement),
            uniqueId: crypto.randomUUID()
        };
        
        // Add to user's completed achievements
        userCategory.completed.push(unlockedAchievement);
        userCategory.progress = (userCategory.completed.length / category.items.length) * 100;
        
        // Check if category is complete
        if (userCategory.completed.length === category.items.length && !userCategory.isComplete) {
            userCategory.isComplete = true;
            userCategory.completedAt = Date.now();
            this.awardCategoryCompletion(userId, categoryId, category);
        }
        
        // Update overall progress
        this.updateOverallProgress(userId);
        
        // Add to recent achievements
        collectionLog.recentAchievements.unshift(unlockedAchievement);
        if (collectionLog.recentAchievements.length > 20) {
            collectionLog.recentAchievements = collectionLog.recentAchievements.slice(0, 20);
        }
        
        // Update stats
        this.updateCollectionStats(userId, unlockedAchievement);
        
        // Update timestamps
        collectionLog.lastUpdated = Date.now();
        
        console.log(`🏆 Achievement unlocked: ${achievementName} for user ${userId}`);
        console.log(`  📂 Category: ${category.name}`);
        console.log(`  🎯 Tier bonus: +${achievement.tier_bonus}`);
        console.log(`  ⭐ Rarity: ${unlockedAchievement.rarity}`);
        
        return unlockedAchievement;
    }
    
    calculateAchievementRarity(achievement) {
        // Calculate rarity based on tier bonus and estimated difficulty
        const tierBonus = achievement.tier_bonus;
        
        if (tierBonus >= 100) return 'mythic';
        if (tierBonus >= 50) return 'legendary';
        if (tierBonus >= 25) return 'epic';
        if (tierBonus >= 15) return 'rare';
        if (tierBonus >= 5) return 'uncommon';
        return 'common';
    }
    
    awardCategoryCompletion(userId, categoryId, category) {
        const collectionLog = this.getUserCollectionLog(userId);
        
        // Award category completion bonus
        const completionAchievement = {
            name: `${category.name} Master`,
            description: `Completed all achievements in ${category.name}`,
            categoryId: 'meta_achievements',
            categoryName: 'Meta Achievements',
            tier_bonus: category.completion_reward.tier_bonus,
            soul_power: category.completion_reward.soul_power,
            unlockedAt: Date.now(),
            rarity: 'legendary',
            isCompletion: true,
            uniqueId: crypto.randomUUID()
        };
        
        // Add to milestones
        collectionLog.milestones.push({
            type: 'category_completion',
            categoryId,
            categoryName: category.name,
            achievement: completionAchievement,
            timestamp: Date.now()
        });
        
        // Update progress
        collectionLog.progress.completedCategories++;
        collectionLog.progress.totalTierBonus += category.completion_reward.tier_bonus;
        collectionLog.progress.totalSoulPower += category.completion_reward.soul_power;
        
        console.log(`🎊 Category completed: ${category.name} by user ${userId}`);
        console.log(`  🏆 Completion bonus: +${category.completion_reward.tier_bonus} tier, +${category.completion_reward.soul_power} soul power`);
    }
    
    updateOverallProgress(userId) {
        const collectionLog = this.getUserCollectionLog(userId);
        
        let totalAchievements = 0;
        let completedAchievements = 0;
        let totalTierBonus = 0;
        let totalSoulPower = 0;
        
        // Calculate totals across all categories
        for (const [categoryId, userCategory] of collectionLog.categories) {
            const systemCategory = this.collectionCategories[categoryId];
            if (!systemCategory) continue;
            
            totalAchievements += systemCategory.items.length;
            completedAchievements += userCategory.completed.length;
            
            // Sum tier bonuses and soul power from completed achievements
            for (const achievement of userCategory.completed) {
                totalTierBonus += achievement.tier_bonus;
                if (achievement.soul_power) {
                    totalSoulPower += achievement.soul_power;
                }
            }
        }
        
        // Add milestone bonuses
        for (const milestone of collectionLog.milestones) {
            if (milestone.achievement) {
                totalTierBonus += milestone.achievement.tier_bonus || 0;
                totalSoulPower += milestone.achievement.soul_power || 0;
            }
        }
        
        // Update progress
        collectionLog.progress.totalAchievements = completedAchievements;
        collectionLog.progress.totalTierBonus = totalTierBonus;
        collectionLog.progress.totalSoulPower = totalSoulPower;
        collectionLog.progress.overallCompletion = (completedAchievements / totalAchievements) * 100;
        
        console.log(`📊 Progress updated for user ${userId}:`);
        console.log(`  🏆 Achievements: ${completedAchievements}/${totalAchievements} (${collectionLog.progress.overallCompletion.toFixed(1)}%)`);
        console.log(`  🎯 Total tier bonus: ${totalTierBonus}`);
        console.log(`  ⚡ Total soul power: ${totalSoulPower}`);
    }
    
    updateCollectionStats(userId, achievement) {
        const collectionLog = this.getUserCollectionLog(userId);
        
        // Update first achievement
        if (!collectionLog.stats.firstAchievement) {
            collectionLog.stats.firstAchievement = {
                name: achievement.name,
                category: achievement.categoryName,
                timestamp: achievement.unlockedAt
            };
        }
        
        // Update rarest achievement
        if (!collectionLog.stats.rarest || 
            this.rarityLevels[achievement.rarity].multiplier > 
            this.rarityLevels[collectionLog.stats.rarest.rarity].multiplier) {
            collectionLog.stats.rarest = {
                name: achievement.name,
                category: achievement.categoryName,
                rarity: achievement.rarity,
                timestamp: achievement.unlockedAt
            };
        }
        
        // Update favorite category (most achievements)
        let maxAchievements = 0;
        let favoriteCategory = null;
        
        for (const [categoryId, userCategory] of collectionLog.categories) {
            if (userCategory.completed.length > maxAchievements) {
                maxAchievements = userCategory.completed.length;
                favoriteCategory = userCategory.name;
            }
        }
        
        collectionLog.stats.favoriteCategory = favoriteCategory;
        
        // Update achievement streaks
        const lastAchievement = collectionLog.recentAchievements[1]; // Previous achievement
        if (lastAchievement) {
            const timeDiff = achievement.unlockedAt - lastAchievement.unlockedAt;
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            
            if (daysDiff <= 7) { // Within a week
                collectionLog.stats.streaks.current++;
            } else {
                collectionLog.stats.streaks.current = 1;
            }
            
            if (collectionLog.stats.streaks.current > collectionLog.stats.streaks.longest) {
                collectionLog.stats.streaks.longest = collectionLog.stats.streaks.current;
            }
        } else {
            collectionLog.stats.streaks.current = 1;
            collectionLog.stats.streaks.longest = 1;
        }
    }
    
    getUserCollectionLog(userId) {
        return this.userCollectionLogs.get(userId);
    }
    
    getCollectionLogSummary(userId) {
        const collectionLog = this.getUserCollectionLog(userId);
        if (!collectionLog) return null;
        
        return {
            userId: collectionLog.userId,
            userName: collectionLog.userName,
            progress: collectionLog.progress,
            stats: collectionLog.stats,
            recentAchievements: collectionLog.recentAchievements.slice(0, 5),
            milestones: collectionLog.milestones.length,
            categories: Array.from(collectionLog.categories.entries()).map(([id, category]) => ({
                id,
                name: category.name,
                progress: category.progress,
                isComplete: category.isComplete,
                completed: category.completed.length
            }))
        };
    }
    
    getLeaderboard(sortBy = 'totalTierBonus', limit = 50) {
        const users = Array.from(this.userCollectionLogs.values())
            .map(log => ({
                userId: log.userId,
                userName: log.userName,
                totalAchievements: log.progress.totalAchievements,
                totalTierBonus: log.progress.totalTierBonus,
                totalSoulPower: log.progress.totalSoulPower,
                overallCompletion: log.progress.overallCompletion,
                completedCategories: log.progress.completedCategories
            }));
        
        // Sort by specified criteria
        users.sort((a, b) => b[sortBy] - a[sortBy]);
        
        return users.slice(0, limit);
    }
    
    exportCollectionLog(userId, format = 'json') {
        const collectionLog = this.getUserCollectionLog(userId);
        if (!collectionLog) return null;
        
        const exportData = {
            userId: collectionLog.userId,
            userName: collectionLog.userName,
            exportedAt: Date.now(),
            progress: collectionLog.progress,
            categories: {},
            achievements: [],
            milestones: collectionLog.milestones,
            stats: collectionLog.stats
        };
        
        // Export all categories and achievements
        for (const [categoryId, userCategory] of collectionLog.categories) {
            exportData.categories[categoryId] = {
                name: userCategory.name,
                progress: userCategory.progress,
                isComplete: userCategory.isComplete,
                completedAt: userCategory.completedAt,
                achievements: userCategory.completed
            };
            
            exportData.achievements.push(...userCategory.completed);
        }
        
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(exportData.achievements);
        }
        
        return exportData;
    }
    
    convertToCSV(achievements) {
        const headers = ['Name', 'Category', 'Tier Bonus', 'Rarity', 'Unlocked Date'];
        const rows = achievements.map(achievement => [
            achievement.name,
            achievement.categoryName,
            achievement.tier_bonus,
            achievement.rarity,
            new Date(achievement.unlockedAt).toISOString()
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    // Integration with Soul of Soulfra system
    getSoulContribution(userId) {
        const collectionLog = this.getUserCollectionLog(userId);
        if (!collectionLog) return { tierBonus: 0, soulPower: 0 };
        
        return {
            tierBonus: collectionLog.progress.totalTierBonus,
            soulPower: collectionLog.progress.totalSoulPower,
            achievements: collectionLog.progress.totalAchievements,
            completion: collectionLog.progress.overallCompletion
        };
    }
    
    // Mock some achievements for demonstration
    simulateAchievementProgress(userId) {
        console.log(`🎯 Simulating achievement progress for user: ${userId}`);
        
        // Create collection log if doesn't exist
        this.createUserCollectionLog(userId, `TestUser_${userId}`);
        
        // Simulate some achievements
        const simulatedAchievements = [
            { category: 'combat_achievements', name: 'First Boss Kill' },
            { category: 'economic_achievements', name: 'First Million' },
            { category: 'quest_achievements', name: 'Quest Beginner' },
            { category: 'skilling_achievements', name: 'First 99' },
            { category: 'social_achievements', name: 'Clan Member' }
        ];
        
        for (const achievement of simulatedAchievements) {
            try {
                this.unlockAchievement(userId, achievement.category, achievement.name, 'simulated');
            } catch (error) {
                console.log(`⚠️ Failed to unlock ${achievement.name}: ${error.message}`);
            }
        }
        
        return this.getCollectionLogSummary(userId);
    }
}

if (require.main === module) {
    // Demo the collection log system
    const collectionSystem = new CollectionLogSystem();
    
    console.log('\n📋 COLLECTION LOG SYSTEM DEMO\n');
    
    // Simulate achievement progress for a test user
    const testUserId = 'demo_user_001';
    const summary = collectionSystem.simulateAchievementProgress(testUserId);
    
    console.log('\n📊 USER COLLECTION LOG SUMMARY:');
    console.log(`User: ${summary.userName}`);
    console.log(`Total Achievements: ${summary.progress.totalAchievements}`);
    console.log(`Total Tier Bonus: ${summary.progress.totalTierBonus}`);
    console.log(`Total Soul Power: ${summary.progress.totalSoulPower}`);
    console.log(`Overall Completion: ${summary.progress.overallCompletion.toFixed(1)}%`);
    
    console.log('\n🏆 RECENT ACHIEVEMENTS:');
    for (const achievement of summary.recentAchievements) {
        console.log(`  ${achievement.name} (${achievement.categoryName}) - Tier: +${achievement.tier_bonus}`);
    }
    
    console.log('\n📂 CATEGORY PROGRESS:');
    for (const category of summary.categories) {
        console.log(`  ${category.name}: ${category.completed} achievements (${category.progress.toFixed(1)}%)`);
    }
    
    // Export collection log
    console.log('\n📤 EXPORTING COLLECTION LOG...');
    const exportedLog = collectionSystem.exportCollectionLog(testUserId, 'json');
    fs.writeFileSync('demo_collection_log.json', exportedLog);
    console.log('✅ Collection log exported to demo_collection_log.json');
}

module.exports = CollectionLogSystem;