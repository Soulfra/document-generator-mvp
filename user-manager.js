#!/usr/bin/env node

/**
 * USER MANAGER - Multi-User System Management
 * 
 * Manages multiple UserCore instances, handles user creation,
 * authentication, session management, and inter-user interactions.
 */

const EventEmitter = require('events');
const { UserCore } = require('./user-core');
const crypto = require('crypto');

class UserManager extends EventEmitter {
    constructor() {
        super();
        
        // User storage
        this.users = new Map();              // userId -> UserCore
        this.usernameIndex = new Map();      // username -> userId
        this.emailIndex = new Map();         // email -> userId
        this.sessionIndex = new Map();       // sessionId -> userId
        
        // Active users tracking
        this.activeUsers = new Set();
        this.onlineUsers = new Set();
        
        // System stats
        this.stats = {
            totalUsers: 0,
            activeToday: 0,
            sessionsCreated: 0,
            combinationsExecuted: 0
        };
        
        // Energy economy tracking
        this.energyEconomy = {
            totalCardsInCirculation: 0,
            totalEnergyInSystem: 0,
            cardDistribution: new Map(),
            energyFlows: []
        };
        
        // Initialize the manager
        this.initialize();
    }
    
    initialize() {
        console.log('👥 User Manager initialized');
        
        // Start periodic tasks
        this.startPeriodicTasks();
        
        // Set up system-wide listeners
        this.setupSystemListeners();
    }
    
    /**
     * Create a new user
     */
    createUser(userData = {}) {
        try {
            // Create new UserCore instance
            const user = new UserCore();
            
            // Set user data
            if (userData.username) {
                if (this.usernameIndex.has(userData.username)) {
                    throw new Error(`Username ${userData.username} already exists`);
                }
                user.profile.username = userData.username;
                this.usernameIndex.set(userData.username, user.id);
            }
            
            if (userData.email) {
                if (this.emailIndex.has(userData.email)) {
                    throw new Error(`Email ${userData.email} already exists`);
                }
                user.profile.email = userData.email;
                this.emailIndex.set(userData.email, user.id);
            }
            
            // Store user
            this.users.set(user.id, user);
            this.stats.totalUsers++;
            
            // Set up user event listeners
            this.setupUserListeners(user);
            
            // Track in energy economy
            this.updateEnergyEconomy();
            
            this.emit('userCreated', {
                userId: user.id,
                username: user.profile.username,
                timestamp: new Date()
            });
            
            console.log(`✅ User created: ${user.id}`);
            return user;
            
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }
    
    /**
     * Get user by ID
     */
    getUser(userId) {
        return this.users.get(userId);
    }
    
    /**
     * Get user by username
     */
    getUserByUsername(username) {
        const userId = this.usernameIndex.get(username);
        return userId ? this.users.get(userId) : null;
    }
    
    /**
     * Get user by email
     */
    getUserByEmail(email) {
        const userId = this.emailIndex.get(email);
        return userId ? this.users.get(userId) : null;
    }
    
    /**
     * Get user by session ID
     */
    getUserBySession(sessionId) {
        const userId = this.sessionIndex.get(sessionId);
        return userId ? this.users.get(userId) : null;
    }
    
    /**
     * Authenticate user
     */
    async authenticateUser(credentials) {
        let user = null;
        
        if (credentials.username) {
            user = this.getUserByUsername(credentials.username);
        } else if (credentials.email) {
            user = this.getUserByEmail(credentials.email);
        } else if (credentials.userId) {
            user = this.getUser(credentials.userId);
        }
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // In a real system, verify password here
        // For now, just create a session
        
        const session = user.createSession({
            type: credentials.type || 'web',
            metadata: credentials.metadata
        });
        
        // Index session
        this.sessionIndex.set(session.id, user.id);
        this.onlineUsers.add(user.id);
        this.stats.sessionsCreated++;
        
        this.emit('userAuthenticated', {
            userId: user.id,
            sessionId: session.id,
            timestamp: new Date()
        });
        
        return {
            user: user.getUserSummary(),
            session
        };
    }
    
    /**
     * End user session
     */
    endUserSession(sessionId) {
        const userId = this.sessionIndex.get(sessionId);
        if (!userId) return false;
        
        const user = this.users.get(userId);
        if (!user) return false;
        
        const ended = user.endSession(sessionId);
        if (ended) {
            this.sessionIndex.delete(sessionId);
            
            // Check if user is still online
            if (!user.state.online) {
                this.onlineUsers.delete(userId);
            }
        }
        
        return ended;
    }
    
    /**
     * Transfer energy cards between users
     */
    async transferCards(fromUserId, toUserId, cardType, quantity = 1) {
        const fromUser = this.users.get(fromUserId);
        const toUser = this.users.get(toUserId);
        
        if (!fromUser || !toUser) {
            throw new Error('Invalid user IDs');
        }
        
        // Get cards from sender
        const availableCards = fromUser.energyCards.getCardsByType(cardType);
        if (availableCards.length < quantity) {
            throw new Error(`Insufficient ${cardType} cards`);
        }
        
        // Transfer cards
        const transferred = [];
        for (let i = 0; i < quantity; i++) {
            const card = availableCards[i];
            
            // Remove from sender
            fromUser.energyCards.removeCard(card.id);
            
            // Add to receiver (create new card with same properties)
            const newCard = toUser.grantCard(cardType, card.currentCharge);
            newCard.level = card.level;
            newCard.experience = card.experience;
            
            transferred.push({
                type: cardType,
                level: card.level,
                charge: card.currentCharge
            });
        }
        
        // Track in energy economy
        this.energyEconomy.energyFlows.push({
            from: fromUserId,
            to: toUserId,
            cards: transferred,
            timestamp: new Date()
        });
        
        this.emit('cardsTransferred', {
            from: fromUserId,
            to: toUserId,
            cardType,
            quantity,
            timestamp: new Date()
        });
        
        return transferred;
    }
    
    /**
     * Setup user event listeners
     */
    setupUserListeners(user) {
        user.on('sessionCreated', (data) => {
            this.activeUsers.add(user.id);
        });
        
        user.on('levelUp', (data) => {
            this.emit('userLevelUp', data);
        });
        
        user.on('achievementUnlocked', (data) => {
            this.emit('achievementUnlocked', data);
        });
        
        user.on('combinationExecuted', (data) => {
            this.stats.combinationsExecuted++;
            this.emit('combinationExecuted', data);
        });
        
        user.on('contextUpdated', (data) => {
            this.emit('userContextUpdated', data);
        });
    }
    
    /**
     * Setup system-wide listeners
     */
    setupSystemListeners() {
        // Could listen to global events here
    }
    
    /**
     * Update energy economy tracking
     */
    updateEnergyEconomy() {
        let totalCards = 0;
        let totalEnergy = 0;
        const distribution = new Map();
        
        for (const user of this.users.values()) {
            const profile = user.energyCards.getEnergyProfile();
            totalCards += profile.totalCards;
            totalEnergy += profile.totalEnergy;
            
            // Track distribution
            for (const [cardType, info] of Object.entries(profile.cardsByType)) {
                const current = distribution.get(cardType) || { count: 0, energy: 0 };
                current.count += info.count;
                current.energy += info.totalEnergy;
                distribution.set(cardType, current);
            }
        }
        
        this.energyEconomy.totalCardsInCirculation = totalCards;
        this.energyEconomy.totalEnergyInSystem = totalEnergy;
        this.energyEconomy.cardDistribution = distribution;
    }
    
    /**
     * Get online users
     */
    getOnlineUsers() {
        return Array.from(this.onlineUsers).map(userId => {
            const user = this.users.get(userId);
            return {
                userId,
                username: user.profile.username,
                level: user.profile.level,
                lastActive: user.state.lastActive
            };
        });
    }
    
    /**
     * Get leaderboard
     */
    getLeaderboard(metric = 'level', limit = 10) {
        const users = Array.from(this.users.values());
        
        switch (metric) {
            case 'level':
                users.sort((a, b) => b.profile.level - a.profile.level);
                break;
            case 'reputation':
                users.sort((a, b) => b.profile.reputation - a.profile.reputation);
                break;
            case 'cards':
                users.sort((a, b) => 
                    b.energyCards.inventory.size - a.energyCards.inventory.size
                );
                break;
            case 'achievements':
                users.sort((a, b) => 
                    b.profile.achievements.length - a.profile.achievements.length
                );
                break;
        }
        
        return users.slice(0, limit).map((user, index) => ({
            rank: index + 1,
            userId: user.id,
            username: user.profile.username || 'Anonymous',
            value: this.getMetricValue(user, metric),
            level: user.profile.level
        }));
    }
    
    /**
     * Get metric value for user
     */
    getMetricValue(user, metric) {
        switch (metric) {
            case 'level':
                return user.profile.level;
            case 'reputation':
                return user.profile.reputation;
            case 'cards':
                return user.energyCards.inventory.size;
            case 'achievements':
                return user.profile.achievements.length;
            default:
                return 0;
        }
    }
    
    /**
     * Start periodic tasks
     */
    startPeriodicTasks() {
        // Update active users daily
        setInterval(() => {
            this.activeUsers.clear();
            this.stats.activeToday = 0;
        }, 86400000); // 24 hours
        
        // Update energy economy every minute
        setInterval(() => {
            this.updateEnergyEconomy();
        }, 60000);
        
        // Clean up old energy flows
        setInterval(() => {
            const oneHourAgo = Date.now() - 3600000;
            this.energyEconomy.energyFlows = this.energyEconomy.energyFlows.filter(
                flow => flow.timestamp.getTime() > oneHourAgo
            );
        }, 300000); // 5 minutes
    }
    
    /**
     * Get system statistics
     */
    getSystemStats() {
        return {
            users: {
                total: this.stats.totalUsers,
                online: this.onlineUsers.size,
                activeToday: this.activeUsers.size
            },
            sessions: {
                active: this.sessionIndex.size,
                created: this.stats.sessionsCreated
            },
            energy: {
                totalCards: this.energyEconomy.totalCardsInCirculation,
                totalEnergy: this.energyEconomy.totalEnergyInSystem,
                recentFlows: this.energyEconomy.energyFlows.length
            },
            activity: {
                combinationsExecuted: this.stats.combinationsExecuted
            }
        };
    }
    
    /**
     * Get energy economy report
     */
    getEnergyEconomyReport() {
        const report = {
            overview: {
                totalCards: this.energyEconomy.totalCardsInCirculation,
                totalEnergy: this.energyEconomy.totalEnergyInSystem,
                averageCardsPerUser: this.stats.totalUsers > 0 ? 
                    Math.round(this.energyEconomy.totalCardsInCirculation / this.stats.totalUsers) : 0
            },
            distribution: {},
            recentFlows: this.energyEconomy.energyFlows.slice(-20)
        };
        
        // Convert card distribution to object
        for (const [cardType, info] of this.energyEconomy.cardDistribution) {
            report.distribution[cardType] = info;
        }
        
        return report;
    }
    
    /**
     * Save all user data
     */
    async saveAllUsers() {
        const userData = [];
        
        for (const user of this.users.values()) {
            userData.push(user.toJSON());
        }
        
        return userData;
    }
    
    /**
     * Load users from data
     */
    async loadUsers(userData) {
        for (const data of userData) {
            const user = UserCore.fromJSON(data);
            
            // Store user
            this.users.set(user.id, user);
            
            // Rebuild indices
            if (user.profile.username) {
                this.usernameIndex.set(user.profile.username, user.id);
            }
            if (user.profile.email) {
                this.emailIndex.set(user.profile.email, user.id);
            }
            
            // Set up listeners
            this.setupUserListeners(user);
        }
        
        this.stats.totalUsers = this.users.size;
        this.updateEnergyEconomy();
        
        console.log(`📥 Loaded ${this.users.size} users`);
    }
}

module.exports = { UserManager };

// Example usage and testing
if (require.main === module) {
    console.log('👥 Testing User Manager System\n');
    
    const manager = new UserManager();
    
    // Create some test users
    const user1 = manager.createUser({
        username: 'alice',
        email: 'alice@example.com'
    });
    
    const user2 = manager.createUser({
        username: 'bob',
        email: 'bob@example.com'
    });
    
    console.log('\n📊 System Stats:');
    console.log(manager.getSystemStats());
    
    // Authenticate users
    (async () => {
        try {
            // Login user 1
            const auth1 = await manager.authenticateUser({
                username: 'alice'
            });
            console.log('\n✅ Alice authenticated:', auth1.session.id);
            
            // Login user 2
            const auth2 = await manager.authenticateUser({
                email: 'bob@example.com'
            });
            console.log('✅ Bob authenticated:', auth2.session.id);
            
            // Try card transfer
            console.log('\n💱 Testing card transfer...');
            const transferred = await manager.transferCards(
                user1.id, 
                user2.id, 
                'cookie', 
                1
            );
            console.log('Transferred:', transferred);
            
            // Show online users
            console.log('\n👥 Online Users:');
            console.log(manager.getOnlineUsers());
            
            // Show leaderboard
            console.log('\n🏆 Leaderboard:');
            console.log(manager.getLeaderboard('level', 5));
            
            // Energy economy report
            console.log('\n⚡ Energy Economy:');
            console.log(JSON.stringify(manager.getEnergyEconomyReport(), null, 2));
            
        } catch (error) {
            console.error('Error:', error.message);
        }
    })();
}