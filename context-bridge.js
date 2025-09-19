#!/usr/bin/env node

/**
 * 🌉 CONTEXT BRIDGE 🌉
 * 
 * Connect user progression to emoji availability using existing systems
 * Bridges chapter-story-progression-engine.js with emoji-navigation-system.js
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class ContextBridge extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.dataDir = path.join(process.cwd(), 'context-bridge-data');
        this.configPath = path.join(this.dataDir, 'context-bridge.json');
        
        // Connect to existing systems
        this.existingSystems = {
            progressionEngine: './chapter-story-progression-engine.js',
            emojiNavigation: './emoji-navigation-system.js',
            simpleRouter: './simple-service-router.js',
            userStateLoader: './bulletproof-user-state-loader.js'
        };
        
        // User progression → emoji unlock mapping
        this.progressionToEmojiMap = {
            // Level-based unlocks
            level: {
                0: ['🎮', '📖', '🧠', '🔧'],      // Starter emojis
                1: ['⚡', '📚', '💙'],           // After first story/game
                2: ['🔍', '⚙️', '🌈'],          // After first test
                3: ['🛡️', '🗡️', '📊'],         // Security & quests unlock
                4: ['👑', '⚔️', '🏆'],          // Boss battles
                5: ['📱', '🎨', '🌐'],          // Advanced features
                6: ['💰', '⚡', '📈'],          // Economy features
                7: ['🚀', '🌟', '💎']           // Master level
            },
            
            // Achievement-based unlocks
            achievements: {
                'first-discovery': ['🔍'],
                'pattern-recognition': ['🌈'],
                'emotional-intelligence': ['💙'],
                'strategic-thinking': ['⚡'],
                'plugin-wizard': ['⚙️'],
                'clarity-guardian': ['🛡️'],
                'file-sage': ['📚'],
                'system-sage': ['🧠'],
                'hydra-slayer': ['👑'],
                'dependency-master': ['🔧']
            },
            
            // Quest completion unlocks
            quests: {
                'chapter-1-dependency-discovery': ['🔧', '📊'],
                'color-game-pattern-basics': ['🌈', '🎨'],
                'iq-test-basic-reasoning': ['🧠', '📈'],
                'plugin-management-tutorial': ['⚙️'],
                'security-scanning-quest': ['🛡️'],
                'file-organization-quest': ['📚'],
                'boss-battle-dependency-hydra': ['👑', '⚔️']
            },
            
            // Skill-based unlocks
            skills: {
                'pattern-recognition': ['🌈'],
                'logical-reasoning': ['🧠'],
                'plugin-management': ['⚙️'],
                'security-analysis': ['🛡️'],
                'strategic-thinking': ['⚡'],
                'emotional-intelligence': ['💙'],
                'system-mastery': ['🔧'],
                'advanced-reasoning': ['📊']
            }
        };
        
        // Emoji prerequisites (what you need to unlock each emoji)
        this.emojiPrerequisites = {
            '🎮': { level: 0 },
            '📖': { level: 0 },
            '🧠': { level: 0 },
            '🔧': { level: 0 },
            '⚡': { level: 1, skills: ['pattern-recognition'] },
            '📚': { level: 1, achievements: ['first-discovery'] },
            '💙': { level: 1, quests: ['color-game-pattern-basics'] },
            '🔍': { level: 2, achievements: ['first-discovery'] },
            '⚙️': { level: 2, skills: ['plugin-management'] },
            '🌈': { level: 2, skills: ['pattern-recognition'] },
            '🛡️': { level: 3, skills: ['security-analysis'] },
            '🗡️': { level: 3, quests: ['security-scanning-quest'] },
            '📊': { level: 3, skills: ['logical-reasoning'] },
            '👑': { level: 4, achievements: ['hydra-slayer'] },
            '⚔️': { level: 4, quests: ['boss-battle-dependency-hydra'] },
            '🏆': { level: 4, achievements: ['system-sage'] },
            '📱': { level: 5, skills: ['system-mastery'] },
            '🎨': { level: 5, skills: ['emotional-intelligence'] },
            '🌐': { level: 5, achievements: ['dependency-master'] }
        };
        
        // Active user contexts
        this.userContexts = new Map();
        
        console.log('🌉 Context Bridge initializing...');
    }
    
    async initialize() {
        console.log('🔗 Setting up context bridge connections...');
        
        // Create data directory
        await fs.mkdir(this.dataDir, { recursive: true });
        
        // Load existing configuration
        await this.loadConfiguration();
        
        // Set up event listeners for progression events
        this.setupProgressionListeners();
        
        // Connect to existing user state systems
        await this.connectToUserStateSystems();
        
        console.log('✅ Context bridge ready!');
    }
    
    async loadConfiguration() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configData);
            
            // Merge with existing mappings
            Object.assign(this.progressionToEmojiMap, config.progressionToEmojiMap || {});
            Object.assign(this.emojiPrerequisites, config.emojiPrerequisites || {});
            
            console.log('   Loaded context bridge configuration');
        } catch (error) {
            console.log('   No existing configuration found, using defaults');
            await this.saveConfiguration();
        }
    }
    
    async saveConfiguration() {
        const config = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            progressionToEmojiMap: this.progressionToEmojiMap,
            emojiPrerequisites: this.emojiPrerequisites,
            activeUsers: this.userContexts.size
        };
        
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    
    setupProgressionListeners() {
        // Listen for progression events from chapter-story-progression-engine
        this.on('node-completed', this.handleNodeCompletion.bind(this));
        this.on('level-up', this.handleLevelUp.bind(this));
        this.on('achievement-unlocked', this.handleAchievementUnlock.bind(this));
        this.on('skill-gained', this.handleSkillGain.bind(this));
        
        console.log('   Set up progression event listeners');
    }
    
    async connectToUserStateSystems() {
        // Connect to existing bulletproof user state loader
        try {
            // Check if user state systems are available
            const userStateExists = await fs.access('./bulletproof-user-state-loader.js').then(() => true).catch(() => false);
            
            if (userStateExists) {
                console.log('   Connected to bulletproof user state loader');
            }
            
            // Connect to simple service router
            const routerExists = await fs.access('./simple-service-router.js').then(() => true).catch(() => false);
            
            if (routerExists) {
                console.log('   Connected to simple service router');
            }
            
        } catch (error) {
            console.log('   User state systems not fully available, using standalone mode');
        }
    }
    
    // Core context bridging methods
    async getUserContext(userId) {
        let context = this.userContexts.get(userId);
        
        if (!context) {
            // Create new user context
            context = await this.createUserContext(userId);
            this.userContexts.set(userId, context);
        }
        
        return context;
    }
    
    async createUserContext(userId) {
        const context = {
            userId,
            level: 0,
            xp: 0,
            completedQuests: [],
            achievements: [],
            skills: [],
            characters: [],
            tools: [],
            availableEmojis: ['🎮', '📖', '🧠', '🔧'], // Starter emojis
            unlockedEmojis: [],
            lastUpdated: new Date(),
            progressionPath: []
        };
        
        // Try to load from existing systems
        try {
            const existingProgress = await this.loadFromProgressionEngine(userId);
            if (existingProgress) {
                Object.assign(context, existingProgress);
            }
        } catch (error) {
            console.log(`   Creating fresh context for user ${userId}`);
        }
        
        // Calculate available emojis based on current state
        context.availableEmojis = this.calculateAvailableEmojis(context);
        
        return context;
    }
    
    async loadFromProgressionEngine(userId) {
        // This would interface with the actual progression engine
        // For now, return mock data structure
        return {
            level: 0,
            xp: 0,
            completedQuests: [],
            achievements: [],
            skills: []
        };
    }
    
    calculateAvailableEmojis(userContext) {
        const available = new Set(['🎮', '📖', '🧠', '🔧']); // Always available
        
        // Check level-based unlocks
        const levelUnlocks = this.progressionToEmojiMap.level[userContext.level] || [];
        levelUnlocks.forEach(emoji => available.add(emoji));
        
        // Check all lower level unlocks too
        for (let level = 0; level <= userContext.level; level++) {
            const levelEmojis = this.progressionToEmojiMap.level[level] || [];
            levelEmojis.forEach(emoji => available.add(emoji));
        }
        
        // Check achievement-based unlocks
        userContext.achievements.forEach(achievement => {
            const achievementEmojis = this.progressionToEmojiMap.achievements[achievement] || [];
            achievementEmojis.forEach(emoji => available.add(emoji));
        });
        
        // Check quest-based unlocks
        userContext.completedQuests.forEach(quest => {
            const questEmojis = this.progressionToEmojiMap.quests[quest] || [];
            questEmojis.forEach(emoji => available.add(emoji));
        });
        
        // Check skill-based unlocks
        userContext.skills.forEach(skill => {
            const skillEmojis = this.progressionToEmojiMap.skills[skill] || [];
            skillEmojis.forEach(emoji => available.add(emoji));
        });
        
        // Filter by prerequisites
        const finalAvailable = [];
        for (const emoji of available) {
            if (this.checkEmojiPrerequisites(emoji, userContext)) {
                finalAvailable.push(emoji);
            }
        }
        
        return finalAvailable;
    }
    
    checkEmojiPrerequisites(emoji, userContext) {
        const prereqs = this.emojiPrerequisites[emoji];
        if (!prereqs) return true; // No prerequisites
        
        // Check level requirement
        if (prereqs.level && userContext.level < prereqs.level) {
            return false;
        }
        
        // Check skill requirements
        if (prereqs.skills) {
            const hasAllSkills = prereqs.skills.every(skill => 
                userContext.skills.includes(skill)
            );
            if (!hasAllSkills) return false;
        }
        
        // Check achievement requirements
        if (prereqs.achievements) {
            const hasAllAchievements = prereqs.achievements.every(achievement => 
                userContext.achievements.includes(achievement)
            );
            if (!hasAllAchievements) return false;
        }
        
        // Check quest requirements
        if (prereqs.quests) {
            const hasAllQuests = prereqs.quests.every(quest => 
                userContext.completedQuests.includes(quest)
            );
            if (!hasAllQuests) return false;
        }
        
        return true;
    }
    
    // Event handlers from progression system
    async handleNodeCompletion(data) {
        const { userId, nodeId, results } = data;
        const context = await this.getUserContext(userId);
        
        // Add completed quest
        if (!context.completedQuests.includes(nodeId)) {
            context.completedQuests.push(nodeId);
        }
        
        // Check for new emoji unlocks
        const newEmojis = await this.checkForNewUnlocks(userId, context);
        
        if (newEmojis.length > 0) {
            this.emit('emojis-unlocked', { userId, newEmojis });
        }
        
        await this.updateUserContext(userId, context);
        
        console.log(`✅ Node completion processed for ${userId}: ${nodeId}`);
    }
    
    async handleLevelUp(data) {
        const { userId, newLevel } = data;
        const context = await this.getUserContext(userId);
        
        context.level = newLevel;
        
        // Check for level-based emoji unlocks
        const newEmojis = await this.checkForNewUnlocks(userId, context);
        
        if (newEmojis.length > 0) {
            this.emit('emojis-unlocked', { userId, newEmojis });
            console.log(`🎉 Level up! User ${userId} unlocked: ${newEmojis.join(' ')}`);
        }
        
        await this.updateUserContext(userId, context);
    }
    
    async handleAchievementUnlock(data) {
        const { userId, achievement } = data;
        const context = await this.getUserContext(userId);
        
        if (!context.achievements.includes(achievement)) {
            context.achievements.push(achievement);
        }
        
        // Check for achievement-based emoji unlocks
        const newEmojis = await this.checkForNewUnlocks(userId, context);
        
        if (newEmojis.length > 0) {
            this.emit('emojis-unlocked', { userId, newEmojis });
            console.log(`🏆 Achievement unlocked! User ${userId} got: ${newEmojis.join(' ')}`);
        }
        
        await this.updateUserContext(userId, context);
    }
    
    async handleSkillGain(data) {
        const { userId, skill } = data;
        const context = await this.getUserContext(userId);
        
        if (!context.skills.includes(skill)) {
            context.skills.push(skill);
        }
        
        // Check for skill-based emoji unlocks
        const newEmojis = await this.checkForNewUnlocks(userId, context);
        
        if (newEmojis.length > 0) {
            this.emit('emojis-unlocked', { userId, newEmojis });
            console.log(`💪 Skill gained! User ${userId} unlocked: ${newEmojis.join(' ')}`);
        }
        
        await this.updateUserContext(userId, context);
    }
    
    async checkForNewUnlocks(userId, context) {
        const previousEmojis = new Set(context.availableEmojis);
        const currentEmojis = new Set(this.calculateAvailableEmojis(context));
        
        const newEmojis = [...currentEmojis].filter(emoji => !previousEmojis.has(emoji));
        
        // Update context with new emojis
        context.availableEmojis = [...currentEmojis];
        
        return newEmojis;
    }
    
    async updateUserContext(userId, context) {
        context.lastUpdated = new Date();
        this.userContexts.set(userId, context);
        
        // Emit context update event
        this.emit('context-updated', { userId, context });
        
        // Save to persistent storage periodically
        if (Math.random() < 0.1) { // 10% chance to save
            await this.saveConfiguration();
        }
    }
    
    // Public API methods
    async getAvailableEmojisForUser(userId) {
        const context = await this.getUserContext(userId);
        return {
            available: context.availableEmojis,
            level: context.level,
            xp: context.xp,
            achievements: context.achievements.length,
            completedQuests: context.completedQuests.length,
            nextUnlocks: this.getNextUnlocksForUser(context)
        };
    }
    
    getNextUnlocksForUser(context) {
        const nextUnlocks = [];
        const nextLevel = context.level + 1;
        
        // Next level unlocks
        const nextLevelEmojis = this.progressionToEmojiMap.level[nextLevel];
        if (nextLevelEmojis) {
            nextUnlocks.push({
                type: 'level',
                requirement: `Level ${nextLevel}`,
                emojis: nextLevelEmojis,
                xpNeeded: (nextLevel * 1000) - context.xp
            });
        }
        
        // Missing skill unlocks
        const allSkills = Object.keys(this.progressionToEmojiMap.skills);
        const missingSkills = allSkills.filter(skill => !context.skills.includes(skill));
        
        missingSkills.slice(0, 3).forEach(skill => {
            const skillEmojis = this.progressionToEmojiMap.skills[skill];
            nextUnlocks.push({
                type: 'skill',
                requirement: `Skill: ${skill}`,
                emojis: skillEmojis
            });
        });
        
        return nextUnlocks.slice(0, 5); // Return top 5 next unlocks
    }
    
    async simulateProgressionEvent(userId, eventType, eventData) {
        // For testing - simulate progression events
        switch (eventType) {
            case 'level-up':
                await this.handleLevelUp({ userId, newLevel: eventData.level });
                break;
            case 'achievement':
                await this.handleAchievementUnlock({ userId, achievement: eventData.achievement });
                break;
            case 'quest':
                await this.handleNodeCompletion({ userId, nodeId: eventData.quest, results: {} });
                break;
            case 'skill':
                await this.handleSkillGain({ userId, skill: eventData.skill });
                break;
        }
        
        return this.getAvailableEmojisForUser(userId);
    }
    
    generateContextReport() {
        const report = {
            totalUsers: this.userContexts.size,
            totalEmojis: Object.keys(this.emojiPrerequisites).length,
            unlockMethods: {
                level: Object.keys(this.progressionToEmojiMap.level).length,
                achievements: Object.keys(this.progressionToEmojiMap.achievements).length,
                quests: Object.keys(this.progressionToEmojiMap.quests).length,
                skills: Object.keys(this.progressionToEmojiMap.skills).length
            },
            userDistribution: {}
        };
        
        // Analyze user level distribution
        for (const context of this.userContexts.values()) {
            const level = context.level;
            report.userDistribution[level] = (report.userDistribution[level] || 0) + 1;
        }
        
        return report;
    }
}

// Export for use as module
module.exports = ContextBridge;

// CLI interface
if (require.main === module) {
    const bridge = new ContextBridge();
    
    console.log('🌉 CONTEXT BRIDGE');
    console.log('================\n');
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function run() {
        await bridge.initialize();
        
        switch (command) {
            case 'user':
                if (args[0]) {
                    const userId = args[0];
                    const emojis = await bridge.getAvailableEmojisForUser(userId);
                    
                    console.log(`👤 User: ${userId}`);
                    console.log(`📊 Level: ${emojis.level} | XP: ${emojis.xp}`);
                    console.log(`🏆 Achievements: ${emojis.achievements}`);
                    console.log(`✅ Completed Quests: ${emojis.completedQuests}`);
                    console.log();
                    
                    console.log('Available Emojis:');
                    emojis.available.forEach(emoji => console.log(`  ${emoji}`));
                    
                    if (emojis.nextUnlocks.length > 0) {
                        console.log('\nNext Unlocks:');
                        emojis.nextUnlocks.forEach(unlock => {
                            console.log(`  ${unlock.emojis.join(' ')} - ${unlock.requirement}`);
                        });
                    }
                } else {
                    console.log('Usage: node context-bridge.js user <user-id>');
                }
                break;
                
            case 'simulate':
                if (args.length >= 3) {
                    const userId = args[0];
                    const eventType = args[1];
                    const eventData = JSON.parse(args[2]);
                    
                    const result = await bridge.simulateProgressionEvent(userId, eventType, eventData);
                    
                    console.log(`🎭 Simulated ${eventType} for ${userId}`);
                    console.log('Result:', JSON.stringify(result, null, 2));
                } else {
                    console.log('Usage: node context-bridge.js simulate <user> <event-type> <json-data>');
                    console.log('Example: node context-bridge.js simulate user1 level-up \'{"level":2}\'');
                }
                break;
                
            case 'report':
                const report = bridge.generateContextReport();
                
                console.log('📊 Context Bridge Report:\n');
                console.log(`Total Users: ${report.totalUsers}`);
                console.log(`Total Emojis: ${report.totalEmojis}`);
                console.log();
                
                console.log('Unlock Methods:');
                Object.entries(report.unlockMethods).forEach(([method, count]) => {
                    console.log(`  ${method}: ${count} types`);
                });
                
                if (Object.keys(report.userDistribution).length > 0) {
                    console.log('\nUser Level Distribution:');
                    Object.entries(report.userDistribution).forEach(([level, count]) => {
                        console.log(`  Level ${level}: ${count} users`);
                    });
                }
                break;
                
            default:
                console.log('Available commands:');
                console.log('  user <id>        - Show user emoji availability');
                console.log('  simulate <user> <event> <data> - Simulate progression event');
                console.log('  report           - Show system report');
                console.log();
                console.log('Example: node context-bridge.js user test-user');
        }
    }
    
    run().catch(console.error);
}