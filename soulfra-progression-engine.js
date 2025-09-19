#!/usr/bin/env node

/**
 * 🎮 Soulfra Progressive Tier System
 * 
 * Gamified progression where users literally build their AI SDK through participation:
 * - Bronze → Silver → Gold → Platinum tiers
 * - XP gained through forum posts, competitions, gallery uploads
 * - Each tier unlocks new AI models, tools, and platform features
 * - Story progression that adapts to user journey
 * - Achievement system with real-world value
 * 
 * "Level up by contributing, unlock by participating"
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SoulfraProgressionEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Progression settings
            enableGamification: options.enableGamification !== false,
            enableStoryMode: options.enableStoryMode !== false,
            enableSocialProof: options.enableSocialProof !== false,
            
            // XP calculation
            xpMultiplier: options.xpMultiplier || 1.0,
            bonusXpEvents: options.bonusXpEvents !== false,
            
            // Achievement settings
            enableAchievements: options.enableAchievements !== false,
            enableBadges: options.enableBadges !== false,
            
            ...options
        };
        
        // User progression data
        this.userProfiles = new Map();        // userId → profile data
        this.achievements = new Map();        // achievementId → achievement data
        this.badges = new Map();              // badgeId → badge data
        this.activities = new Map();          // activityId → activity record
        this.leaderboards = new Map();        // category → ranked users
        
        // Tier definitions - each tier unlocks specific AI capabilities
        this.tierDefinitions = {
            bronze: {
                name: 'Bronze Explorer',
                icon: '🥉',
                color: '#CD7F32',
                xpRequired: 0,
                description: 'Welcome to the ecosystem! Basic access to explore and learn.',
                story: 'You\'ve discovered the Soulfra ecosystem. Time to explore and build your foundation.',
                
                // Features unlocked
                features: {
                    forumAccess: 'read',           // Can read forums
                    galleryAccess: 'view',         // Can view gallery
                    competitionsAccess: 'view',    // Can view competitions
                    aiModels: ['basic-chat'],      // Basic AI model access
                    apiCalls: 100,                 // 100 API calls per month
                    storage: '100MB',              // 100MB storage
                    support: 'community'           // Community support only
                },
                
                // Unlocking requirements
                unlockConditions: {
                    accountAge: 0,                 // Immediate
                    emailVerified: true
                }
            },
            
            silver: {
                name: 'Silver Contributor',
                icon: '🥈', 
                color: '#C0C0C0',
                xpRequired: 1000,
                description: 'Active community member with creation privileges and enhanced AI tools.',
                story: 'You\'ve proven your commitment. Now you can contribute and access more powerful tools.',
                
                features: {
                    forumAccess: 'post',           // Can create posts/topics
                    galleryAccess: 'upload',       // Can upload to gallery
                    competitionsAccess: 'submit',  // Can submit to competitions
                    aiModels: ['basic-chat', 'code-helper', 'image-analyzer'],
                    apiCalls: 1000,                // 1,000 API calls per month
                    storage: '1GB',                // 1GB storage
                    support: 'email',              // Email support
                    collections: true,             // Can create collections
                    customization: 'basic'         // Basic theme customization
                },
                
                unlockConditions: {
                    xp: 1000,
                    forumPosts: 10,
                    accountAge: 7 // days
                }
            },
            
            gold: {
                name: 'Gold Creator',
                icon: '🥇',
                color: '#FFD700', 
                xpRequired: 5000,
                description: 'Skilled creator with advanced AI capabilities and monetization options.',
                story: 'Your expertise shines. Advanced tools and monetization opportunities await.',
                
                features: {
                    forumAccess: 'moderate',       // Can moderate discussions
                    galleryAccess: 'premium',      // Premium gallery features
                    competitionsAccess: 'judge',   // Can judge competitions
                    aiModels: ['basic-chat', 'code-helper', 'image-analyzer', 'advanced-writer', 'code-reviewer'],
                    apiCalls: 10000,               // 10,000 API calls per month
                    storage: '10GB',               // 10GB storage
                    support: 'priority',           // Priority support
                    collections: true,
                    customization: 'advanced',     // Advanced themes & layouts
                    monetization: 'enabled',       // Can earn from content
                    analytics: 'detailed',        // Detailed analytics
                    collaboration: 'teams'        // Can create teams
                },
                
                unlockConditions: {
                    xp: 5000,
                    competitions: 3,               // Participated in 3 competitions
                    galleryUploads: 20,
                    communityVotes: 100            // Received 100+ community votes
                }
            },
            
            platinum: {
                name: 'Platinum Innovator',
                icon: '💎',
                color: '#E5E4E2',
                xpRequired: 20000,
                description: 'Elite member with full AI SDK access and platform influence.',
                story: 'You\'ve mastered the ecosystem. Shape the future and mentor others.',
                
                features: {
                    forumAccess: 'admin',          // Admin forum privileges
                    galleryAccess: 'unlimited',    // Unlimited gallery features
                    competitionsAccess: 'host',    // Can host competitions
                    aiModels: '*',                 // All AI models available
                    apiCalls: 100000,             // 100,000 API calls per month
                    storage: '100GB',             // 100GB storage
                    support: 'dedicated',         // Dedicated account manager
                    collections: true,
                    customization: 'unlimited',   // Full customization access
                    monetization: 'premium',      // Premium revenue sharing
                    analytics: 'enterprise',     // Enterprise-level analytics
                    collaboration: 'enterprise', // Enterprise collaboration tools
                    sdk: 'full',                  // Full AI SDK access
                    whiteLabel: true,             // White-label solutions
                    apiAccess: 'unrestricted'    // Unrestricted API access
                },
                
                unlockConditions: {
                    xp: 20000,
                    competitions: 10,
                    galleryUploads: 100,
                    forumRep: 1000,               // 1000+ forum reputation
                    mentoring: 5,                 // Mentored 5+ users
                    contributions: 'significant'   // Significant platform contributions
                }
            }
        };
        
        // XP earning activities
        this.xpActivities = {
            // Forum activities
            'forum.first_post': { xp: 50, description: 'Made your first forum post', oneTime: true },
            'forum.create_topic': { xp: 25, description: 'Created a forum topic' },
            'forum.reply_post': { xp: 10, description: 'Replied to a forum post' },
            'forum.receive_like': { xp: 5, description: 'Received a like on your post' },
            'forum.helpful_answer': { xp: 100, description: 'Marked as helpful answer', oneTime: false },
            
            // Gallery activities
            'gallery.first_upload': { xp: 100, description: 'Uploaded your first artwork', oneTime: true },
            'gallery.upload': { xp: 50, description: 'Uploaded artwork to gallery' },
            'gallery.receive_rating': { xp: 10, description: 'Received a rating on your artwork' },
            'gallery.featured': { xp: 500, description: 'Your artwork was featured', oneTime: false },
            
            // Competition activities
            'competition.first_submission': { xp: 200, description: 'Made your first competition submission', oneTime: true },
            'competition.submit': { xp: 100, description: 'Submitted to a competition' },
            'competition.vote': { xp: 5, description: 'Voted in a competition' },
            'competition.win_first': { xp: 1000, description: 'Won 1st place in competition', oneTime: false },
            'competition.win_second': { xp: 500, description: 'Won 2nd place in competition', oneTime: false },
            'competition.win_third': { xp: 250, description: 'Won 3rd place in competition', oneTime: false },
            
            // Social activities
            'social.invite_friend': { xp: 100, description: 'Invited a friend who joined', oneTime: false },
            'social.mentor_user': { xp: 200, description: 'Mentored a new user', oneTime: false },
            'social.collaboration': { xp: 150, description: 'Collaborated on a project', oneTime: false },
            
            // Platform activities
            'platform.profile_complete': { xp: 75, description: 'Completed your profile', oneTime: true },
            'platform.daily_visit': { xp: 5, description: 'Daily platform visit' },
            'platform.streak_7': { xp: 100, description: '7-day activity streak', oneTime: false },
            'platform.streak_30': { xp: 500, description: '30-day activity streak', oneTime: false }
        };
        
        // Achievement definitions
        this.achievementDefinitions = {
            // Milestone achievements
            'first_steps': {
                name: 'First Steps',
                description: 'Complete your profile and make your first post',
                icon: '👶',
                requirements: ['platform.profile_complete', 'forum.first_post'],
                reward: { xp: 100, badge: 'newcomer' }
            },
            
            'community_builder': {
                name: 'Community Builder', 
                description: 'Help 10 other users with helpful responses',
                icon: '🏗️',
                requirements: { 'forum.helpful_answer': 10 },
                reward: { xp: 500, badge: 'helper', feature: 'mentor_badge' }
            },
            
            'creative_genius': {
                name: 'Creative Genius',
                description: 'Have 5 artworks featured in the gallery',
                icon: '🎨',
                requirements: { 'gallery.featured': 5 },
                reward: { xp: 1000, badge: 'artist', feature: 'custom_gallery_theme' }
            },
            
            'competition_master': {
                name: 'Competition Master',
                description: 'Win competitions in 3 different categories',
                icon: '🏆',
                requirements: { 'competition_categories_won': 3 },
                reward: { xp: 2000, badge: 'champion', feature: 'judge_privileges' }
            }
        };
        
        // Story progression system
        this.storyProgression = {
            bronze: {
                intro: 'Welcome to Soulfra! You\'ve joined a community of creators and innovators.',
                milestones: [
                    { at: 250, message: 'You\'re finding your way around. Keep exploring!' },
                    { at: 500, message: 'People are starting to notice your contributions.' },
                    { at: 750, message: 'You\'re becoming a valued community member.' }
                ],
                promotion: 'Your dedication has earned you Silver status. New tools await!'
            },
            silver: {
                intro: 'As a Silver Contributor, you now have the power to create and share.',
                milestones: [
                    { at: 2000, message: 'Your creations are inspiring others in the community.' },
                    { at: 3500, message: 'You\'re developing a reputation for quality work.' },
                    { at: 4500, message: 'Gold tier is within reach. Keep pushing forward!' }
                ],
                promotion: 'Congratulations! You\'ve achieved Gold Creator status with advanced capabilities.'
            },
            gold: {
                intro: 'Gold Creators shape the community. Your influence grows with each contribution.',
                milestones: [
                    { at: 10000, message: 'You\'re now a community leader, mentoring others.' },
                    { at: 15000, message: 'Your expertise is recognized platform-wide.' },
                    { at: 18000, message: 'Platinum status approaches. Prepare for elite access.' }
                ],
                promotion: 'Welcome to Platinum! You\'ve achieved mastery and unlimited potential.'
            },
            platinum: {
                intro: 'Platinum Innovators define the future. Your journey continues with limitless possibilities.',
                milestones: [
                    { at: 50000, message: 'You\'ve transcended typical user status. You ARE the platform.' },
                    { at: 100000, message: 'Legend status achieved. Your legacy inspires generations.' }
                ]
            }
        };
        
        this.initialize();
    }
    
    /**
     * Initialize progression engine
     */
    async initialize() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                🎮 SOULFRA PROGRESSION ENGINE 🎮                ║
║                                                                ║
║            "Level up by contributing, unlock by participating" ║
║                                                                ║
║  Tiers: Bronze → Silver → Gold → Platinum                     ║
║  XP Activities: ${Object.keys(this.xpActivities).length} configured                           ║
║  Achievements: ${Object.keys(this.achievementDefinitions).length} available                             ║
║  Story Mode: ${this.config.enableStoryMode ? 'Enabled' : 'Disabled'}                                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);
        
        try {
            // Load user progression data
            await this.loadProgressionData();
            
            // Initialize leaderboards
            await this.initializeLeaderboards();
            
            // Set up achievement tracking
            if (this.config.enableAchievements) {
                await this.initializeAchievements();
            }
            
            // Start background processes
            this.startProgressionTracking();
            
            console.log('✅ Progression Engine initialized!');
            this.emit('progression-initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize progression engine:', error);
            throw error;
        }
    }
    
    /**
     * Create or update user profile
     */
    async createUserProfile(userId, userData = {}) {
        const profileId = `profile_${userId}`;
        
        const profile = {
            userId,
            username: userData.username || `User_${userId}`,
            email: userData.email || '',
            avatar: userData.avatar || '/avatars/default.png',
            
            // Progression data
            currentTier: 'bronze',
            xp: 0,
            level: 1,
            
            // Statistics
            stats: {
                totalActivities: 0,
                streakDays: 0,
                lastActivity: new Date(),
                joinDate: new Date(),
                forumPosts: 0,
                galleryUploads: 0,
                competitionSubmissions: 0,
                competitionWins: 0,
                helpfulAnswers: 0,
                communityVotes: 0
            },
            
            // Achievements and badges
            achievements: [],
            badges: [],
            completedActivities: new Set(),
            
            // Story progression
            story: {
                currentChapter: 'bronze.intro',
                unlockedFeatures: [...this.tierDefinitions.bronze.features],
                milestonesSeen: []
            },
            
            // Settings
            preferences: {
                publicProfile: userData.publicProfile !== false,
                showProgress: userData.showProgress !== false,
                enableNotifications: userData.enableNotifications !== false,
                storyMode: userData.storyMode !== false
            },
            
            // Timestamps
            createdAt: new Date(),
            lastUpdated: new Date()
        };
        
        this.userProfiles.set(userId, profile);
        
        console.log(`👤 Created user profile: ${profile.username}`);
        console.log(`   Tier: ${profile.currentTier} | XP: ${profile.xp}`);
        
        this.emit('profile-created', { userId, profile });
        
        return profile;
    }
    
    /**
     * Award XP for activity
     */
    async awardXP(userId, activityType, context = {}) {
        const profile = this.userProfiles.get(userId);
        if (!profile) {
            throw new Error(`User profile not found: ${userId}`);
        }
        
        const activity = this.xpActivities[activityType];
        if (!activity) {
            throw new Error(`Activity type not found: ${activityType}`);
        }
        
        // Check if one-time activity already completed
        if (activity.oneTime && profile.completedActivities.has(activityType)) {
            console.log(`⚠️ One-time activity already completed: ${activityType}`);
            return profile;
        }
        
        const activityId = `act_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        // Calculate XP (with potential multipliers)
        let xpGained = activity.xp * this.config.xpMultiplier;
        
        // Bonus XP for streaks, events, etc.
        if (this.config.bonusXpEvents) {
            xpGained = this.applyBonusXP(xpGained, context, profile);
        }
        
        // Award XP
        profile.xp += xpGained;
        profile.stats.totalActivities++;
        profile.stats.lastActivity = new Date();
        
        // Mark as completed if one-time
        if (activity.oneTime) {
            profile.completedActivities.add(activityType);
        }
        
        // Record activity
        this.activities.set(activityId, {
            id: activityId,
            userId,
            type: activityType,
            xpGained,
            context,
            timestamp: new Date()
        });
        
        console.log(`⭐ XP awarded: ${xpGained} for ${activityType}`);
        console.log(`   User: ${profile.username} | Total XP: ${profile.xp}`);
        
        // Check for tier promotion
        await this.checkTierPromotion(userId);
        
        // Check for achievements
        if (this.config.enableAchievements) {
            await this.checkAchievements(userId, activityType);
        }
        
        // Update story progression
        if (this.config.enableStoryMode) {
            await this.updateStoryProgression(userId);
        }
        
        this.emit('xp-awarded', {
            userId,
            activityType,
            xpGained,
            totalXP: profile.xp,
            tier: profile.currentTier
        });
        
        return profile;
    }
    
    /**
     * Check for tier promotion
     */
    async checkTierPromotion(userId) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return;
        
        const currentTier = this.tierDefinitions[profile.currentTier];
        const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
        const currentIndex = tierOrder.indexOf(profile.currentTier);
        
        // Check if eligible for next tier
        if (currentIndex < tierOrder.length - 1) {
            const nextTierName = tierOrder[currentIndex + 1];
            const nextTier = this.tierDefinitions[nextTierName];
            
            if (this.checkTierRequirements(profile, nextTier)) {
                await this.promoteTier(userId, nextTierName);
            }
        }
    }
    
    /**
     * Check tier requirements
     */
    checkTierRequirements(profile, tier) {
        const conditions = tier.unlockConditions;
        
        // Check XP requirement
        if (conditions.xp && profile.xp < conditions.xp) return false;
        
        // Check forum posts
        if (conditions.forumPosts && profile.stats.forumPosts < conditions.forumPosts) return false;
        
        // Check account age
        if (conditions.accountAge) {
            const daysSinceJoin = (Date.now() - profile.stats.joinDate) / (1000 * 60 * 60 * 24);
            if (daysSinceJoin < conditions.accountAge) return false;
        }
        
        // Check competitions
        if (conditions.competitions && profile.stats.competitionSubmissions < conditions.competitions) return false;
        
        // Check gallery uploads
        if (conditions.galleryUploads && profile.stats.galleryUploads < conditions.galleryUploads) return false;
        
        // Check community votes
        if (conditions.communityVotes && profile.stats.communityVotes < conditions.communityVotes) return false;
        
        return true;
    }
    
    /**
     * Promote user to next tier
     */
    async promoteTier(userId, newTier) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return;
        
        const oldTier = profile.currentTier;
        const tierData = this.tierDefinitions[newTier];
        
        profile.currentTier = newTier;
        profile.lastUpdated = new Date();
        
        // Update story progression
        if (this.config.enableStoryMode) {
            const storyData = this.storyProgression[newTier];
            profile.story.currentChapter = `${newTier}.intro`;
            
            console.log('\n🎭 TIER PROMOTION STORY:');
            console.log(`"${storyData.intro}"`);
        }
        
        console.log(`\n🎉 TIER PROMOTION! ${oldTier.toUpperCase()} → ${newTier.toUpperCase()}`);
        console.log(`   User: ${profile.username}`);
        console.log(`   ${tierData.icon} ${tierData.name}`);
        console.log(`   New Features Unlocked:`);
        
        // Show unlocked features
        for (const [feature, access] of Object.entries(tierData.features)) {
            if (typeof access === 'boolean' && access) {
                console.log(`     ✓ ${feature}`);
            } else if (typeof access === 'string' && access !== 'false') {
                console.log(`     ✓ ${feature}: ${access}`);
            } else if (typeof access === 'number') {
                console.log(`     ✓ ${feature}: ${access.toLocaleString()}`);
            }
        }
        
        this.emit('tier-promoted', {
            userId,
            oldTier,
            newTier,
            tierData,
            profile
        });
        
        return profile;
    }
    
    /**
     * Generate user progression dashboard
     */
    generateProgressionDashboard(userId) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return null;
        
        const currentTier = this.tierDefinitions[profile.currentTier];
        const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
        const currentIndex = tierOrder.indexOf(profile.currentTier);
        const nextTier = currentIndex < tierOrder.length - 1 ? 
            this.tierDefinitions[tierOrder[currentIndex + 1]] : null;
        
        // Calculate progress to next tier
        let progressPercent = 100;
        if (nextTier) {
            const xpNeeded = nextTier.xpRequired - profile.xp;
            const xpRange = nextTier.xpRequired - currentTier.xpRequired;
            progressPercent = ((profile.xp - currentTier.xpRequired) / xpRange) * 100;
        }
        
        return `
<div class="progression-dashboard" style="
    background: linear-gradient(135deg, ${currentTier.color} 0%, ${this.adjustColor(currentTier.color, -30)} 100%);
    border-radius: 20px;
    padding: 40px;
    color: white;
    position: relative;
    overflow: hidden;
    margin: 20px 0;
">
    <!-- Background pattern -->
    <div style="
        position: absolute;
        top: 0;
        right: 0;
        font-size: 200px;
        opacity: 0.1;
        line-height: 1;
    ">${currentTier.icon}</div>
    
    <div style="position: relative; z-index: 10;">
        <!-- Current tier info -->
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px;">
            <div style="font-size: 80px;">${currentTier.icon}</div>
            <div>
                <h2 style="margin: 0; font-size: 36px; font-weight: 300;">
                    ${currentTier.name}
                </h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 18px;">
                    ${currentTier.description}
                </p>
            </div>
        </div>
        
        <!-- XP and Progress -->
        <div style="margin: 30px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-size: 18px; font-weight: bold;">
                    ${profile.xp.toLocaleString()} XP
                </span>
                ${nextTier ? `
                    <span style="opacity: 0.8;">
                        ${(nextTier.xpRequired - profile.xp).toLocaleString()} XP to ${nextTier.name}
                    </span>
                ` : `
                    <span style="opacity: 0.8; font-weight: bold;">
                        🎉 MAX TIER ACHIEVED!
                    </span>
                `}
            </div>
            
            <div style="
                width: 100%;
                height: 20px;
                background: rgba(255,255,255,0.2);
                border-radius: 10px;
                overflow: hidden;
            ">
                <div style="
                    width: ${Math.min(progressPercent, 100)}%;
                    height: 100%;
                    background: linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6));
                    border-radius: 10px;
                    transition: width 0.5s ease;
                "></div>
            </div>
        </div>
        
        <!-- Stats -->
        <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 20px;
            margin: 30px 0;
        ">
            <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">
                    ${profile.stats.forumPosts}
                </div>
                <div style="opacity: 0.8; font-size: 14px;">Forum Posts</div>
            </div>
            
            <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">
                    ${profile.stats.galleryUploads}
                </div>
                <div style="opacity: 0.8; font-size: 14px;">Gallery Uploads</div>
            </div>
            
            <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">
                    ${profile.stats.competitionWins}
                </div>
                <div style="opacity: 0.8; font-size: 14px;">Competition Wins</div>
            </div>
            
            <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">
                    ${profile.achievements.length}
                </div>
                <div style="opacity: 0.8; font-size: 14px;">Achievements</div>
            </div>
        </div>
        
        <!-- Current tier features -->
        <div style="
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            margin-top: 30px;
        ">
            <h3 style="margin: 0 0 20px 0; font-size: 24px;">Your Current Benefits</h3>
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            ">
                ${Object.entries(currentTier.features).map(([feature, value]) => `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #4CAF50; font-size: 18px;">✓</span>
                        <span style="text-transform: capitalize;">
                            ${feature.replace(/([A-Z])/g, ' $1')}: 
                            <strong>${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</strong>
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${nextTier ? `
            <div style="
                background: rgba(255,255,255,0.05);
                border: 2px dashed rgba(255,255,255,0.3);
                border-radius: 15px;
                padding: 25px;
                margin-top: 20px;
            ">
                <h3 style="margin: 0 0 15px 0; font-size: 20px; opacity: 0.9;">
                    🎯 Unlock ${nextTier.name} at ${nextTier.xpRequired.toLocaleString()} XP
                </h3>
                <p style="opacity: 0.8; margin: 0 0 15px 0;">
                    ${nextTier.description}
                </p>
                <div style="font-size: 14px; opacity: 0.7;">
                    Additional features coming: Enhanced AI models, more storage, priority support
                </div>
            </div>
        ` : ''}
    </div>
</div>

<style>
.progression-dashboard {
    animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>`;
    }
    
    /**
     * Get user's available AI models based on tier
     */
    getUserAIModels(userId) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return [];
        
        const tier = this.tierDefinitions[profile.currentTier];
        const models = tier.features.aiModels;
        
        if (models === '*') {
            // Platinum users get all models
            return [
                'basic-chat',
                'code-helper', 
                'image-analyzer',
                'advanced-writer',
                'code-reviewer',
                'ai-artist',
                'data-scientist',
                'product-manager',
                'architect'
            ];
        }
        
        return Array.isArray(models) ? models : [];
    }
    
    /**
     * Check if user can access feature
     */
    canUserAccessFeature(userId, feature) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return false;
        
        const tier = this.tierDefinitions[profile.currentTier];
        return tier.features[feature] !== undefined && tier.features[feature] !== false;
    }
    
    /**
     * Apply bonus XP based on context
     */
    applyBonusXP(baseXP, context, profile) {
        let multiplier = 1;
        
        // Weekend bonus
        const now = new Date();
        if (now.getDay() === 0 || now.getDay() === 6) {
            multiplier += 0.2; // 20% weekend bonus
        }
        
        // Streak bonus
        if (profile.stats.streakDays >= 7) {
            multiplier += 0.1; // 10% streak bonus
        }
        if (profile.stats.streakDays >= 30) {
            multiplier += 0.2; // Additional 20% for 30-day streak
        }
        
        // Competition event bonus
        if (context.isCompetitionEvent) {
            multiplier += 0.5; // 50% bonus during competitions
        }
        
        return Math.floor(baseXP * multiplier);
    }
    
    /**
     * Update story progression
     */
    async updateStoryProgression(userId) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return;
        
        const storyData = this.storyProgression[profile.currentTier];
        if (!storyData) return;
        
        // Check for milestone messages
        for (const milestone of storyData.milestones || []) {
            if (profile.xp >= milestone.at && !profile.story.milestonesSeen.includes(milestone.at)) {
                console.log(`\n📖 STORY UPDATE:`);
                console.log(`"${milestone.message}"`);
                
                profile.story.milestonesSeen.push(milestone.at);
                
                this.emit('story-milestone', {
                    userId,
                    milestone,
                    xp: profile.xp
                });
            }
        }
    }
    
    /**
     * Initialize achievements
     */
    async initializeAchievements() {
        console.log('🏆 Initializing achievement system...');
        
        for (const [achievementId, achievement] of Object.entries(this.achievementDefinitions)) {
            this.achievements.set(achievementId, {
                id: achievementId,
                ...achievement,
                unlockedBy: []
            });
        }
        
        console.log(`✓ ${this.achievements.size} achievements loaded`);
    }
    
    /**
     * Check achievements after activity
     */
    async checkAchievements(userId, activityType) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return;
        
        for (const [achievementId, achievement] of this.achievements) {
            // Skip if already unlocked
            if (profile.achievements.includes(achievementId)) continue;
            
            // Check requirements
            if (this.checkAchievementRequirements(profile, achievement, activityType)) {
                await this.unlockAchievement(userId, achievementId);
            }
        }
    }
    
    /**
     * Check achievement requirements
     */
    checkAchievementRequirements(profile, achievement, activityType) {
        const reqs = achievement.requirements;
        
        if (Array.isArray(reqs)) {
            // Multiple specific activities required
            return reqs.every(req => profile.completedActivities.has(req));
        }
        
        if (typeof reqs === 'object') {
            // Activity count requirements
            for (const [activity, count] of Object.entries(reqs)) {
                const userCount = this.getUserActivityCount(profile, activity);
                if (userCount < count) return false;
            }
            return true;
        }
        
        return false;
    }
    
    /**
     * Get user's activity count
     */
    getUserActivityCount(profile, activity) {
        // Map activity types to profile stats
        const activityMap = {
            'forum.helpful_answer': profile.stats.helpfulAnswers,
            'gallery.featured': profile.stats.galleryUploads, // Simplified
            'competition_categories_won': profile.stats.competitionWins
        };
        
        return activityMap[activity] || 0;
    }
    
    /**
     * Unlock achievement
     */
    async unlockAchievement(userId, achievementId) {
        const profile = this.userProfiles.get(userId);
        const achievement = this.achievements.get(achievementId);
        
        if (!profile || !achievement) return;
        
        profile.achievements.push(achievementId);
        
        // Award rewards
        if (achievement.reward.xp) {
            profile.xp += achievement.reward.xp;
        }
        
        if (achievement.reward.badge) {
            profile.badges.push(achievement.reward.badge);
        }
        
        console.log(`🏆 ACHIEVEMENT UNLOCKED: ${achievement.name}`);
        console.log(`   User: ${profile.username}`);
        console.log(`   Reward: +${achievement.reward.xp || 0} XP`);
        
        this.emit('achievement-unlocked', {
            userId,
            achievementId,
            achievement,
            profile
        });
    }
    
    /**
     * Adjust color brightness
     */
    adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    /**
     * Initialize leaderboards
     */
    async initializeLeaderboards() {
        const categories = ['xp', 'forum_posts', 'gallery_uploads', 'competition_wins'];
        
        for (const category of categories) {
            this.leaderboards.set(category, []);
        }
        
        console.log('📊 Leaderboards initialized');
    }
    
    /**
     * Load progression data
     */
    async loadProgressionData() {
        console.log('📂 Loading progression data...');
        
        // In production, load from database
        // Create sample user for demo
        await this.createUserProfile('demo-user', {
            username: 'DemoUser',
            email: 'demo@soulfra.com'
        });
        
        // Award some sample XP
        await this.awardXP('demo-user', 'platform.profile_complete');
        await this.awardXP('demo-user', 'forum.first_post');
    }
    
    /**
     * Start progression tracking
     */
    startProgressionTracking() {
        // Update leaderboards every 5 minutes
        setInterval(() => {
            this.updateLeaderboards();
        }, 300000);
        
        console.log('⏰ Progression tracking started');
    }
    
    /**
     * Update leaderboards
     */
    updateLeaderboards() {
        const users = Array.from(this.userProfiles.values());
        
        // XP leaderboard
        this.leaderboards.set('xp', 
            users.sort((a, b) => b.xp - a.xp).slice(0, 100)
        );
        
        // Forum posts leaderboard
        this.leaderboards.set('forum_posts',
            users.sort((a, b) => b.stats.forumPosts - a.stats.forumPosts).slice(0, 100)
        );
        
        this.emit('leaderboards-updated');
    }
    
    /**
     * Generate status report
     */
    generateStatusReport() {
        const report = {
            totalUsers: this.userProfiles.size,
            totalActivities: this.activities.size,
            totalAchievements: this.achievements.size,
            tierDistribution: {}
        };
        
        // Count users by tier
        for (const profile of this.userProfiles.values()) {
            report.tierDistribution[profile.currentTier] = 
                (report.tierDistribution[profile.currentTier] || 0) + 1;
        }
        
        console.log('\n📊 Progression Engine Status');
        console.log('═══════════════════════════════');
        console.log(`👥 Total Users: ${report.totalUsers}`);
        console.log(`⚡ Activities Tracked: ${report.totalActivities}`);
        console.log(`🏆 Achievements Available: ${report.totalAchievements}`);
        
        console.log('\n🎖️ Tier Distribution:');
        for (const [tier, count] of Object.entries(report.tierDistribution)) {
            const tierData = this.tierDefinitions[tier];
            console.log(`  ${tierData.icon} ${tierData.name}: ${count} users`);
        }
        
        return report;
    }
    
    /**
     * Demo mode
     */
    static async demo() {
        console.log('🎮 Progression Engine Demo');
        console.log('══════════════════════════');
        
        const engine = new SoulfraProgressionEngine({
            enableStoryMode: true,
            enableAchievements: true,
            bonusXpEvents: true
        });
        
        // Wait for initialization
        await new Promise(resolve => {
            engine.once('progression-initialized', resolve);
        });
        
        // Show tier structure
        console.log('\n🎖️ Tier Structure:');
        for (const [tierName, tier] of Object.entries(engine.tierDefinitions)) {
            console.log(`${tier.icon} ${tier.name} (${tier.xpRequired.toLocaleString()} XP)`);
            console.log(`   ${tier.description}`);
            console.log(`   AI Models: ${Array.isArray(tier.features.aiModels) ? 
                tier.features.aiModels.join(', ') : tier.features.aiModels}`);
        }
        
        // Simulate user progression
        const userId = 'demo-user';
        console.log('\n🚀 Simulating User Progression:');
        
        // Award various activities
        await engine.awardXP(userId, 'forum.create_topic');
        await engine.awardXP(userId, 'gallery.first_upload');
        await engine.awardXP(userId, 'competition.first_submission');
        
        // Show progression dashboard
        console.log('\n📊 User Dashboard:');
        const dashboard = engine.generateProgressionDashboard(userId);
        console.log(dashboard.substring(0, 1000) + '...\n');
        
        // Show available AI models
        const aiModels = engine.getUserAIModels(userId);
        console.log(`🤖 Available AI Models: ${aiModels.join(', ')}`);
        
        // Show status
        engine.generateStatusReport();
        
        console.log('\n✅ Demo complete! Key features:');
        console.log('  • Progressive tier system with real benefits');
        console.log('  • XP earned through platform participation');
        console.log('  • AI model access tied to user level');
        console.log('  • Story progression that adapts to journey');
        console.log('  • Achievement system with rewards');
        console.log('  • Visual dashboards showing progress');
    }
}

// Run demo if called directly
if (require.main === module) {
    SoulfraProgressionEngine.demo().catch(console.error);
}

module.exports = SoulfraProgressionEngine;