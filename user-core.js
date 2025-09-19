#!/usr/bin/env node

/**
 * USER CORE - The Central User Entity
 * 
 * This is the fundamental user object that OWNS energy cards,
 * not just another energy card itself. Each user has their own:
 * - Identity and profile
 * - Energy card collection
 * - Context and state
 * - Sessions and connections
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { ContextEnergyCards } = require('./context-energy-cards');

class UserCore extends EventEmitter {
    constructor(userId = null) {
        super();
        
        // Core identity
        this.id = userId || this.generateUserId();
        this.created = new Date();
        
        // User profile (NOT an energy card)
        this.profile = {
            username: null,
            email: null,
            level: 1,
            experience: 0,
            reputation: 0,
            achievements: [],
            stats: {
                cardsCollected: 0,
                combinationsExecuted: 0,
                contextDeductions: 0,
                profileSwitches: 0
            }
        };
        
        // Each user has their own energy card system
        this.energyCards = new ContextEnergyCards();
        
        // User-specific context
        this.context = {
            current: null,
            history: [],
            patterns: new Map(),
            preferences: new Map()
        };
        
        // Active sessions
        this.sessions = new Map();
        
        // User state
        this.state = {
            online: false,
            lastActive: new Date(),
            currentProfile: 'development',
            activeFeatures: new Set()
        };
        
        // User connections (to other systems/domains)
        this.connections = new Map();
        
        // Initialize user
        this.initialize();
    }
    
    initialize() {
        // Set up energy card listeners specific to this user
        this.setupEnergyListeners();
        
        // Give user starting energy cards
        this.grantStarterPack();
        
        // Initialize default context
        this.initializeContext();
        
        console.log(`👤 User Core initialized: ${this.id}`);
    }
    
    /**
     * Setup energy card event listeners for this user
     */
    setupEnergyListeners() {
        // Track card usage for user stats
        this.energyCards.on('energyUsed', (data) => {
            this.updateUserStats('energyUsed', data);
        });
        
        // Track combinations for achievements
        this.energyCards.on('combinationExecuted', (data) => {
            this.profile.stats.combinationsExecuted++;
            this.checkAchievements('combination', data);
            
            // Special handling for context deduction
            if (data.combination === 'contextDeduction') {
                this.profile.stats.contextDeductions++;
                this.updateContext(data.result.context);
            }
        });
        
        // Track card additions
        this.energyCards.on('cardAdded', (data) => {
            this.profile.stats.cardsCollected++;
            this.emit('cardCollected', {
                userId: this.id,
                card: data
            });
        });
        
        // Track level ups
        this.energyCards.on('cardLevelUp', (data) => {
            this.checkAchievements('levelUp', data);
            this.emit('cardLevelUp', {
                userId: this.id,
                ...data
            });
        });
    }
    
    /**
     * Grant starter pack of energy cards to new user
     */
    grantStarterPack() {
        const starterPack = [
            { type: 'cookie', quantity: 3, initialCharge: 100 },
            { type: 'localStorage', quantity: 2, initialCharge: 100 },
            { type: 'preference', quantity: 2, initialCharge: 100 },
            { type: 'device', quantity: 1, initialCharge: 100 },
            { type: 'history', quantity: 1, initialCharge: 100 },
            { type: 'location', quantity: 1, initialCharge: 100 }
        ];
        
        console.log(`🎁 Granting starter pack to user ${this.id}`);
        
        for (const pack of starterPack) {
            for (let i = 0; i < pack.quantity; i++) {
                this.energyCards.addCard(pack.type, pack.initialCharge);
            }
        }
        
        // Special: Create a bound userProfile card that represents this user
        this.createBoundUserProfileCard();
    }
    
    /**
     * Create a special userProfile card bound to this user
     */
    createBoundUserProfileCard() {
        // This is a special card that represents the user themselves
        const userProfileCard = this.energyCards.addCard('userProfile', 100);
        
        // Bind it to the user
        userProfileCard.boundUserId = this.id;
        userProfileCard.boundData = {
            username: this.profile.username,
            level: this.profile.level
        };
        
        // This card levels up with the user
        this.on('levelUp', () => {
            userProfileCard.level = this.profile.level;
            userProfileCard.maxCharge = 100 + (this.profile.level * 10);
        });
        
        return userProfileCard;
    }
    
    /**
     * Initialize user context
     */
    initializeContext() {
        this.context.current = {
            userId: this.id,
            profile: this.state.currentProfile,
            timestamp: new Date(),
            source: 'initialization'
        };
        
        this.context.history.push({
            ...this.context.current,
            event: 'user_created'
        });
    }
    
    /**
     * Update user context
     */
    updateContext(newContext) {
        // Store previous context in history
        if (this.context.current) {
            this.context.history.push({
                ...this.context.current,
                endTime: new Date()
            });
            
            // Keep only last 100 history items
            if (this.context.history.length > 100) {
                this.context.history.shift();
            }
        }
        
        // Update current context
        this.context.current = {
            ...newContext,
            userId: this.id,
            timestamp: new Date()
        };
        
        // Analyze patterns
        this.analyzeContextPatterns();
        
        this.emit('contextUpdated', {
            userId: this.id,
            context: this.context.current
        });
    }
    
    /**
     * Analyze context patterns for the user
     */
    analyzeContextPatterns() {
        const patterns = this.context.patterns;
        
        // Time-based patterns
        const hour = new Date().getHours();
        const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        
        const timePattern = patterns.get('timePreference') || {};
        timePattern[timeSlot] = (timePattern[timeSlot] || 0) + 1;
        patterns.set('timePreference', timePattern);
        
        // Device patterns
        if (this.context.current.device) {
            const devicePattern = patterns.get('deviceUsage') || {};
            const deviceType = this.context.current.device.type;
            devicePattern[deviceType] = (devicePattern[deviceType] || 0) + 1;
            patterns.set('deviceUsage', devicePattern);
        }
        
        // Activity patterns
        const activityLevel = this.context.current.confidence > 0.7 ? 'high' : 
                            this.context.current.confidence > 0.4 ? 'medium' : 'low';
        const activityPattern = patterns.get('activityLevel') || {};
        activityPattern[activityLevel] = (activityPattern[activityLevel] || 0) + 1;
        patterns.set('activityLevel', activityPattern);
    }
    
    /**
     * Create a new session for the user
     */
    createSession(sessionConfig = {}) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        
        const session = {
            id: sessionId,
            userId: this.id,
            created: new Date(),
            expires: new Date(Date.now() + (sessionConfig.duration || 86400000)), // 24h default
            type: sessionConfig.type || 'web',
            metadata: sessionConfig.metadata || {},
            energySnapshot: this.energyCards.getEnergyProfile()
        };
        
        this.sessions.set(sessionId, session);
        this.state.online = true;
        this.state.lastActive = new Date();
        
        this.emit('sessionCreated', {
            userId: this.id,
            sessionId,
            session
        });
        
        return session;
    }
    
    /**
     * End a session
     */
    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        session.ended = new Date();
        this.sessions.delete(sessionId);
        
        // Check if user still has active sessions
        if (this.sessions.size === 0) {
            this.state.online = false;
        }
        
        this.emit('sessionEnded', {
            userId: this.id,
            sessionId,
            duration: session.ended - session.created
        });
        
        return true;
    }
    
    /**
     * Switch user profile (development, staging, production, etc)
     */
    async switchProfile(profileName, profileManager) {
        try {
            // Use the profile manager with this user's energy cards
            await profileManager.switchProfile(profileName);
            
            this.state.currentProfile = profileName;
            this.profile.stats.profileSwitches++;
            
            // Update context
            this.updateContext({
                ...this.context.current,
                profile: profileName,
                event: 'profile_switch'
            });
            
            this.emit('profileSwitched', {
                userId: this.id,
                profile: profileName
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to switch profile for user ${this.id}:`, error);
            return false;
        }
    }
    
    /**
     * Grant energy card to user
     */
    grantCard(cardType, initialCharge = null) {
        const card = this.energyCards.addCard(cardType, initialCharge);
        
        this.emit('cardGranted', {
            userId: this.id,
            cardType,
            card
        });
        
        return card;
    }
    
    /**
     * Execute energy combination as user
     */
    async executeCombination(combinationName, options = {}) {
        try {
            const result = await this.energyCards.executeCombination(combinationName, {
                ...options,
                userId: this.id
            });
            
            this.emit('combinationExecuted', {
                userId: this.id,
                combination: combinationName,
                result
            });
            
            return result;
        } catch (error) {
            this.emit('combinationFailed', {
                userId: this.id,
                combination: combinationName,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Add experience to user
     */
    addExperience(amount, source = 'unknown') {
        this.profile.experience += amount;
        
        // Check for level up
        const requiredXP = this.profile.level * 100;
        if (this.profile.experience >= requiredXP) {
            this.levelUp();
        }
        
        this.emit('experienceGained', {
            userId: this.id,
            amount,
            source,
            total: this.profile.experience
        });
    }
    
    /**
     * Level up the user
     */
    levelUp() {
        const oldLevel = this.profile.level;
        this.profile.level++;
        this.profile.experience = 0; // Reset XP
        
        // Increase user capabilities
        this.profile.reputation += 10;
        
        // Grant bonus cards on level up
        if (this.profile.level % 5 === 0) {
            // Every 5 levels, grant a rare card
            const rareCards = ['jwt', 'apiKey', 'websocket', 'docker'];
            const randomRare = rareCards[Math.floor(Math.random() * rareCards.length)];
            this.grantCard(randomRare, 100);
        }
        
        this.emit('levelUp', {
            userId: this.id,
            oldLevel,
            newLevel: this.profile.level
        });
        
        this.checkAchievements('levelUp', { level: this.profile.level });
    }
    
    /**
     * Check and award achievements
     */
    checkAchievements(trigger, data) {
        const achievements = {
            firstCombination: {
                trigger: 'combination',
                condition: () => this.profile.stats.combinationsExecuted === 1,
                reward: { experience: 50, card: 'preference' }
            },
            cardCollector: {
                trigger: 'cardCollected',
                condition: () => this.profile.stats.cardsCollected >= 20,
                reward: { experience: 100, reputation: 5 }
            },
            contextMaster: {
                trigger: 'combination',
                condition: () => this.profile.stats.contextDeductions >= 10,
                reward: { experience: 200, card: 'history' }
            },
            levelTen: {
                trigger: 'levelUp',
                condition: () => this.profile.level === 10,
                reward: { experience: 500, card: 'react', reputation: 20 }
            }
        };
        
        for (const [name, achievement] of Object.entries(achievements)) {
            if (achievement.trigger === trigger &&
                !this.profile.achievements.includes(name) &&
                achievement.condition()) {
                
                // Award achievement
                this.profile.achievements.push(name);
                
                // Grant rewards
                if (achievement.reward.experience) {
                    this.addExperience(achievement.reward.experience, `achievement_${name}`);
                }
                if (achievement.reward.card) {
                    this.grantCard(achievement.reward.card, 100);
                }
                if (achievement.reward.reputation) {
                    this.profile.reputation += achievement.reward.reputation;
                }
                
                this.emit('achievementUnlocked', {
                    userId: this.id,
                    achievement: name,
                    reward: achievement.reward
                });
            }
        }
    }
    
    /**
     * Update user stats
     */
    updateUserStats(event, data) {
        // Track various user statistics
        const stats = this.profile.stats;
        
        switch (event) {
            case 'energyUsed':
                if (!stats.totalEnergyUsed) stats.totalEnergyUsed = 0;
                stats.totalEnergyUsed += data.cards.reduce((sum, c) => sum + c.energyUsed, 0);
                break;
                
            case 'cardLevelUp':
                if (!stats.cardsLeveledUp) stats.cardsLeveledUp = 0;
                stats.cardsLeveledUp++;
                break;
        }
    }
    
    /**
     * Get user summary
     */
    getUserSummary() {
        return {
            id: this.id,
            profile: this.profile,
            state: this.state,
            energyProfile: this.energyCards.getEnergyProfile(),
            contextSummary: {
                current: this.context.current,
                patterns: Object.fromEntries(this.context.patterns),
                historyLength: this.context.history.length
            },
            sessions: {
                active: this.sessions.size,
                online: this.state.online
            }
        };
    }
    
    /**
     * Save user data (for persistence)
     */
    toJSON() {
        return {
            id: this.id,
            created: this.created,
            profile: this.profile,
            state: this.state,
            context: {
                current: this.context.current,
                patterns: Object.fromEntries(this.context.patterns),
                preferences: Object.fromEntries(this.context.preferences)
            },
            // Energy cards would need their own serialization
            energySnapshot: this.energyCards.getEnergyProfile()
        };
    }
    
    /**
     * Load user data
     */
    static fromJSON(data) {
        const user = new UserCore(data.id);
        user.created = new Date(data.created);
        user.profile = data.profile;
        user.state = data.state;
        
        // Restore context
        if (data.context) {
            user.context.current = data.context.current;
            user.context.patterns = new Map(Object.entries(data.context.patterns || {}));
            user.context.preferences = new Map(Object.entries(data.context.preferences || {}));
        }
        
        // Energy cards would need to be restored separately
        
        return user;
    }
    
    /**
     * Generate unique user ID
     */
    generateUserId() {
        return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
}

module.exports = { UserCore };

// Example usage and testing
if (require.main === module) {
    console.log('👤 Testing User Core System\n');
    
    // Create a new user
    const user = new UserCore();
    
    console.log('New user created:', user.id);
    console.log('Initial profile:', user.profile);
    console.log('Energy cards:', user.energyCards.inventory.size);
    
    // Create a session
    const session = user.createSession({ type: 'web' });
    console.log('\nSession created:', session.id);
    
    // Try to deduce context
    (async () => {
        try {
            console.log('\n🔮 Attempting context deduction...');
            const result = await user.executeCombination('contextDeduction');
            console.log('Context deduced:', result.context);
            
            // Add some experience
            user.addExperience(150, 'testing');
            console.log('\nUser leveled up:', user.profile.level);
            
            // Show user summary
            console.log('\n📊 User Summary:');
            console.log(JSON.stringify(user.getUserSummary(), null, 2));
            
        } catch (error) {
            console.error('Error:', error.message);
        }
    })();
}