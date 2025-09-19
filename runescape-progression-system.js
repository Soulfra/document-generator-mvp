/**
 * RUNESCAPE-STYLE PROGRESSION SYSTEM
 * Document Generator Lifestyle Platform
 * 
 * Inspired by RuneScape's skill system and legendary players like Suomi
 * Supports infinite tier progression with XP, achievements, and milestones
 * Integrates with legal framework and revenue sharing
 */

const crypto = require('crypto');
const { InfiniteTierSystemArchitecture } = require('./infinite-tier-system-architecture');

class RuneScapeProgressionSystem {
  constructor(config = {}) {
    this.config = {
      maxLevel: Number.MAX_SAFE_INTEGER,
      xpRate: config.xpRate || 1.0, // XP multiplier
      achievementBonus: config.achievementBonus || 0.1,
      ...config
    };
    
    // Integration with infinite tier system
    this.tierSystem = new InfiniteTierSystemArchitecture(config);
    
    // Skill definitions (platform activities that give XP)
    this.skills = {
      // Core platform skills
      documentProcessing: {
        name: 'Document Processing',
        description: 'Transform documents into MVPs',
        maxLevel: 99,
        baseXPRate: 83.33,
        color: '#4CAF50',
        icon: '📄'
      },
      
      aiIntegration: {
        name: 'AI Integration',
        description: 'Master AI service orchestration',
        maxLevel: 99,
        baseXPRate: 75.0,
        color: '#2196F3',
        icon: '🤖'
      },
      
      blockchainMastery: {
        name: 'Blockchain Mastery',
        description: 'Understand and implement blockchain solutions',
        maxLevel: 99,
        baseXPRate: 90.0,
        color: '#FF9800',
        icon: '⛓️'
      },
      
      businessDevelopment: {
        name: 'Business Development',
        description: 'Build and scale business relationships',
        maxLevel: 99,
        baseXPRate: 65.0,
        color: '#9C27B0',
        icon: '💼'
      },
      
      technicalArchitecture: {
        name: 'Technical Architecture',
        description: 'Design and implement complex systems',
        maxLevel: 99,
        baseXPRate: 80.0,
        color: '#607D8B',
        icon: '🏗️'
      },
      
      // Gaming integration skills
      gamingIntegration: {
        name: 'Gaming Integration',
        description: 'Integrate gaming platforms and mechanics',
        maxLevel: 99,
        baseXPRate: 70.0,
        color: '#E91E63',
        icon: '🎮'
      },
      
      communityBuilding: {
        name: 'Community Building',
        description: 'Build and manage communities',
        maxLevel: 99,
        baseXPRate: 55.0,
        color: '#3F51B5',
        icon: '👥'
      },
      
      // Advanced skills (beyond level 99)
      legendaryMastery: {
        name: 'Legendary Mastery',
        description: 'Transcend normal limits (Suomi-level achievement)',
        maxLevel: Number.MAX_SAFE_INTEGER,
        baseXPRate: 120.0,
        color: '#FFD700',
        icon: '👑'
      },
      
      realityShaping: {
        name: 'Reality Shaping',
        description: 'Alter the fabric of digital reality',
        maxLevel: Number.MAX_SAFE_INTEGER,
        baseXPRate: 200.0,
        color: '#E91E63',
        icon: '🌌'
      }
    };
    
    // Achievement system (inspired by RuneScape achievements)
    this.achievements = {
      // Early milestones
      firstStep: {
        id: 'first_step',
        name: 'First Step',
        description: 'Reach tier 10',
        requirement: { type: 'tier', value: 10 },
        reward: { xpBonus: 0.01, revenueBonus: 0.005 },
        icon: '👶',
        rarity: 'common'
      },
      
      professional: {
        id: 'professional',
        name: 'Professional',
        description: 'Reach tier 100 (Professional threshold)',
        requirement: { type: 'tier', value: 100 },
        reward: { xpBonus: 0.05, revenueBonus: 0.01 },
        icon: '💼',
        rarity: 'uncommon'
      },
      
      // RuneScape references
      maxLevel: {
        id: 'max_level',
        name: 'Max Level',
        description: 'Achieve level 99 in any skill',
        requirement: { type: 'skill_level', skill: 'any', value: 99 },
        reward: { xpBonus: 0.10, revenueBonus: 0.02 },
        icon: '🎯',
        rarity: 'rare'
      },
      
      maxTotal: {
        id: 'max_total',
        name: 'Max Total',
        description: 'Achieve level 99 in all skills (2277 total level)',
        requirement: { type: 'total_level', value: 2277 },
        reward: { xpBonus: 0.25, revenueBonus: 0.05 },
        icon: '⭐',
        rarity: 'legendary'
      },
      
      // Suomi tribute achievements
      soumiFollower: {
        id: 'soumi_follower',
        name: 'Suomi Follower',
        description: 'Reach tier 25,000 (Tribute to legendary player Suomi)',
        requirement: { type: 'tier', value: 25000 },
        reward: { xpBonus: 0.30, revenueBonus: 0.10 },
        icon: '👑',
        rarity: 'legendary'
      },
      
      fiveBillionXP: {
        id: 'five_billion_xp',
        name: '5 Billion XP',
        description: 'Achieve 5 billion total XP (Suomi\'s historic achievement)',
        requirement: { type: 'total_xp', value: 5000000000 },
        reward: { xpBonus: 0.50, revenueBonus: 0.15 },
        icon: '🌟',
        rarity: 'mythic'
      },
      
      // Platform-specific achievements
      mvpMaster: {
        id: 'mvp_master',
        name: 'MVP Master',
        description: 'Generate 1000 MVPs',
        requirement: { type: 'mvp_count', value: 1000 },
        reward: { xpBonus: 0.15, revenueBonus: 0.03 },
        icon: '🚀',
        rarity: 'rare'
      },
      
      aiWhisperer: {
        id: 'ai_whisperer',
        name: 'AI Whisperer',
        description: 'Successfully orchestrate 10,000 AI API calls',
        requirement: { type: 'ai_calls', value: 10000 },
        reward: { xpBonus: 0.20, revenueBonus: 0.04 },
        icon: '🤖',
        rarity: 'rare'
      },
      
      // Divine tier achievements
      divineAscension: {
        id: 'divine_ascension',
        name: 'Divine Ascension',
        description: 'Reach tier 100,000 (Divine threshold)',
        requirement: { type: 'tier', value: 100000 },
        reward: { xpBonus: 0.75, revenueBonus: 0.20 },
        icon: '✨',
        rarity: 'divine'
      },
      
      transcendentBeing: {
        id: 'transcendent_being',
        name: 'Transcendent Being',
        description: 'Reach tier 1,000,000 (Transcendent threshold)',
        requirement: { type: 'tier', value: 1000000 },
        reward: { xpBonus: 1.00, revenueBonus: 0.25 },
        icon: '🌌',
        rarity: 'transcendent'
      },
      
      // Ultimate achievement
      beyondInfinity: {
        id: 'beyond_infinity',
        name: 'Beyond Infinity',
        description: 'Reach tier 1,000,000,051+ (User\'s mentioned tier)',
        requirement: { type: 'tier', value: 1000000051 },
        reward: { xpBonus: 2.00, revenueBonus: 0.50 },
        icon: '♾️',
        rarity: 'infinite'
      }
    };
    
    // User progression tracking
    this.userProgressions = new Map();
    
    console.log('🎮 RuneScape Progression System initialized');
    console.log(`⭐ ${Object.keys(this.skills).length} skills available`);
    console.log(`🏆 ${Object.keys(this.achievements).length} achievements defined`);
  }
  
  /**
   * Get or create user progression data
   */
  getUserProgression(userId) {
    if (!this.userProgressions.has(userId)) {
      this.userProgressions.set(userId, {
        userId: userId,
        skills: this.initializeSkills(),
        achievements: [],
        totalXP: 0,
        totalLevel: 0,
        currentTier: 1,
        createdAt: new Date(),
        lastActivity: new Date(),
        stats: {
          documentsProcessed: 0,
          aiCallsSuccessful: 0,
          mvpGenerated: 0,
          revenueGenerated: 0,
          daysActive: 0,
          timeSpentMinutes: 0
        }
      });
    }
    
    return this.userProgressions.get(userId);
  }
  
  /**
   * Initialize all skills for a new user
   */
  initializeSkills() {
    const skills = {};
    
    for (const [skillId, skillData] of Object.entries(this.skills)) {
      skills[skillId] = {
        level: 1,
        experience: 0,
        rank: 0, // Will be calculated
        color: skillData.color,
        icon: skillData.icon,
        name: skillData.name,
        description: skillData.description
      };
    }
    
    return skills;
  }
  
  /**
   * Calculate XP required for a level (RuneScape formula)
   */
  calculateXPForLevel(level) {
    if (level <= 1) return 0;
    if (level <= 99) {
      // Standard RuneScape XP table
      let xp = 0;
      for (let i = 2; i <= level; i++) {
        xp += Math.floor(i + 300 * Math.pow(2, i / 7));
      }
      return Math.floor(xp / 4);
    } else {
      // Beyond level 99 - exponential scaling
      const base99XP = this.calculateXPForLevel(99);
      const extraLevels = level - 99;
      const extraXP = extraLevels * extraLevels * 10000;
      return base99XP + extraXP;
    }
  }
  
  /**
   * Calculate level from XP
   */
  calculateLevelFromXP(xp) {
    if (xp < 83) return 1;
    
    // Binary search for efficiency
    let low = 1;
    let high = Math.min(200, Math.floor(Math.sqrt(xp / 1000)) + 100);
    
    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      if (this.calculateXPForLevel(mid) <= xp) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    
    return low;
  }
  
  /**
   * Award XP to a user's skill
   */
  awardXP(userId, skillId, xpAmount, activity = null) {
    const progression = this.getUserProgression(userId);
    
    if (!progression.skills[skillId]) {
      throw new Error(`Unknown skill: ${skillId}`);
    }
    
    const skill = progression.skills[skillId];
    const oldLevel = skill.level;
    
    // Apply XP rate multipliers
    const multipliedXP = Math.floor(xpAmount * this.config.xpRate);
    
    // Award XP
    skill.experience += multipliedXP;
    progression.totalXP += multipliedXP;
    progression.lastActivity = new Date();
    
    // Recalculate level
    const newLevel = this.calculateLevelFromXP(skill.experience);
    skill.level = newLevel;
    
    // Update total level
    progression.totalLevel = Object.values(progression.skills)
      .reduce((total, s) => total + s.level, 0);
    
    // Update tier based on total level and XP
    const newTier = this.calculateTierFromProgression(progression);
    const oldTier = progression.currentTier;
    progression.currentTier = newTier;
    
    // Check for level up
    const levelUp = newLevel > oldLevel;
    
    // Check for tier up
    const tierUp = newTier > oldTier;
    
    // Check for achievements
    const newAchievements = this.checkAchievements(progression);
    
    // Log activity
    console.log(`🎮 XP Award: User ${userId} gained ${multipliedXP} ${skillId} XP`);
    if (levelUp) {
      console.log(`🎯 Level Up: ${skillId} level ${oldLevel} → ${newLevel}`);
    }
    if (tierUp) {
      console.log(`⭐ Tier Up: Tier ${oldTier} → ${newTier}`);
    }
    if (newAchievements.length > 0) {
      console.log(`🏆 Achievements: ${newAchievements.map(a => a.name).join(', ')}`);
    }
    
    return {
      xpAwarded: multipliedXP,
      skill: skillId,
      oldLevel,
      newLevel,
      levelUp,
      oldTier,
      newTier,
      tierUp,
      achievements: newAchievements,
      totalXP: progression.totalXP,
      totalLevel: progression.totalLevel
    };
  }
  
  /**
   * Calculate tier from overall progression
   */
  calculateTierFromProgression(progression) {
    const { totalLevel, totalXP } = progression;
    
    // Base tier from total level
    let tier = Math.max(1, Math.floor(totalLevel / 10));
    
    // Bonus from total XP
    const xpBonus = Math.floor(totalXP / 1000000); // 1 tier per million XP
    
    // Bonus from achievements
    const achievementBonus = progression.achievements.length * 5;
    
    // Special milestones
    let milestoneBonus = 0;
    if (totalLevel >= 2277) milestoneBonus += 1000; // Max total level
    if (totalXP >= 5000000000) milestoneBonus += 10000; // 5B XP (Suomi tribute)
    
    return tier + xpBonus + achievementBonus + milestoneBonus;
  }
  
  /**
   * Check for new achievements
   */
  checkAchievements(progression) {
    const newAchievements = [];
    const earnedAchievementIds = progression.achievements.map(a => a.id);
    
    for (const [achievementId, achievement] of Object.entries(this.achievements)) {
      if (earnedAchievementIds.includes(achievementId)) continue;
      
      if (this.isAchievementUnlocked(progression, achievement)) {
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date(),
          tier: progression.currentTier
        };
        
        progression.achievements.push(unlockedAchievement);
        newAchievements.push(unlockedAchievement);
      }
    }
    
    return newAchievements;
  }
  
  /**
   * Check if an achievement is unlocked
   */
  isAchievementUnlocked(progression, achievement) {
    const { requirement } = achievement;
    
    switch (requirement.type) {
      case 'tier':
        return progression.currentTier >= requirement.value;
      
      case 'total_level':
        return progression.totalLevel >= requirement.value;
      
      case 'total_xp':
        return progression.totalXP >= requirement.value;
      
      case 'skill_level':
        if (requirement.skill === 'any') {
          return Object.values(progression.skills).some(s => s.level >= requirement.value);
        } else {
          return progression.skills[requirement.skill]?.level >= requirement.value;
        }
      
      case 'mvp_count':
        return progression.stats.mvpGenerated >= requirement.value;
      
      case 'ai_calls':
        return progression.stats.aiCallsSuccessful >= requirement.value;
      
      default:
        return false;
    }
  }
  
  /**
   * Get user's current bonuses from achievements
   */
  getUserBonuses(userId) {
    const progression = this.getUserProgression(userId);
    let xpBonus = 1.0;
    let revenueBonus = 1.0;
    
    for (const achievement of progression.achievements) {
      if (achievement.reward.xpBonus) {
        xpBonus += achievement.reward.xpBonus;
      }
      if (achievement.reward.revenueBonus) {
        revenueBonus += achievement.reward.revenueBonus;
      }
    }
    
    return { xpBonus, revenueBonus };
  }
  
  /**
   * Generate leaderboard
   */
  generateLeaderboard(category = 'tier', limit = 100) {
    const users = Array.from(this.userProgressions.values());
    
    users.sort((a, b) => {
      switch (category) {
        case 'tier':
          return b.currentTier - a.currentTier;
        case 'totalXP':
          return b.totalXP - a.totalXP;
        case 'totalLevel':
          return b.totalLevel - a.totalLevel;
        default:
          return b.currentTier - a.currentTier;
      }
    });
    
    return users.slice(0, limit).map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      tier: user.currentTier,
      totalXP: user.totalXP,
      totalLevel: user.totalLevel,
      achievements: user.achievements.length,
      lastActivity: user.lastActivity
    }));
  }
  
  /**
   * Simulate activity for testing
   */
  simulateActivity(userId, activityType, amount = 1) {
    const activities = {
      'document_processing': { skill: 'documentProcessing', xp: 150 },
      'ai_integration': { skill: 'aiIntegration', xp: 200 },
      'mvp_generation': { skill: 'technicalArchitecture', xp: 500 },
      'business_development': { skill: 'businessDevelopment', xp: 100 },
      'community_engagement': { skill: 'communityBuilding', xp: 75 }
    };
    
    if (!activities[activityType]) {
      throw new Error(`Unknown activity type: ${activityType}`);
    }
    
    const activity = activities[activityType];
    const totalXP = activity.xp * amount;
    
    return this.awardXP(userId, activity.skill, totalXP, activityType);
  }
  
  /**
   * Export progression data
   */
  exportProgression(userId) {
    const progression = this.getUserProgression(userId);
    const tierInfo = this.tierSystem.getTierInfo(progression.currentTier);
    const bonuses = this.getUserBonuses(userId);
    
    return {
      user: {
        userId: progression.userId,
        tier: progression.currentTier,
        totalXP: progression.totalXP,
        totalLevel: progression.totalLevel,
        createdAt: progression.createdAt,
        lastActivity: progression.lastActivity
      },
      skills: progression.skills,
      achievements: progression.achievements,
      tierInfo: tierInfo,
      bonuses: bonuses,
      stats: progression.stats,
      leaderboardRank: this.getLeaderboardRank(userId),
      exportedAt: new Date()
    };
  }
  
  /**
   * Get user's leaderboard rank
   */
  getLeaderboardRank(userId) {
    const leaderboard = this.generateLeaderboard('tier', 1000000);
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    return userEntry ? userEntry.rank : null;
  }
  
  /**
   * Generate summary statistics
   */
  generateSummaryStats() {
    const users = Array.from(this.userProgressions.values());
    
    if (users.length === 0) {
      return {
        totalUsers: 0,
        message: 'No user data available'
      };
    }
    
    return {
      totalUsers: users.length,
      totalXPAwarded: users.reduce((sum, u) => sum + u.totalXP, 0),
      averageTier: users.reduce((sum, u) => sum + u.currentTier, 0) / users.length,
      highestTier: Math.max(...users.map(u => u.currentTier)),
      totalAchievements: users.reduce((sum, u) => sum + u.achievements.length, 0),
      skillDistribution: this.getSkillDistribution(users),
      tierDistribution: this.getTierDistribution(users)
    };
  }
  
  getSkillDistribution(users) {
    const distribution = {};
    
    for (const skillId of Object.keys(this.skills)) {
      const levels = users.map(u => u.skills[skillId]?.level || 1);
      distribution[skillId] = {
        averageLevel: levels.reduce((a, b) => a + b, 0) / levels.length,
        maxLevel: Math.max(...levels),
        usersAtMax: levels.filter(l => l >= 99).length
      };
    }
    
    return distribution;
  }
  
  getTierDistribution(users) {
    const tiers = users.map(u => u.currentTier);
    const distribution = {};
    
    const ranges = [
      { name: 'Consumer', min: 1, max: 99 },
      { name: 'Professional', min: 100, max: 999 },
      { name: 'Enterprise', min: 1000, max: 9999 },
      { name: 'Legendary', min: 10000, max: 99999 },
      { name: 'Divine', min: 100000, max: 999999 },
      { name: 'Transcendent', min: 1000000, max: Number.MAX_SAFE_INTEGER }
    ];
    
    for (const range of ranges) {
      const count = tiers.filter(t => t >= range.min && t <= range.max).length;
      distribution[range.name] = {
        count,
        percentage: (count / tiers.length * 100).toFixed(1)
      };
    }
    
    return distribution;
  }
}

module.exports = RuneScapeProgressionSystem;