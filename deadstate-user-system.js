#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

/**
 * ⚰️ DEADSTATE USER SYSTEM
 * 
 * Revolutionary approach: Everyone is DEAD by default!
 * 
 * Concept:
 * - Default state = DEAD (offline, minimal processing, never crashes)
 * - Users "resurrect" when they engage (login, action, etc.)
 * - 25-hour auto-decay back to dead state
 * - Shadow layer for dead users to participate in background
 * - Family layer for live/resurrected users
 * 
 * Benefits:
 * - No system crashes (dead users can't break anything)
 * - Natural memory cleanup every 25 hours
 * - Engaging UX (users wake up the system)
 * - Steam Deck compatible (no persistent processes)
 */

class DeadstateUserSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Core deadstate configuration
            defaultState: 'dead',
            resurrectionTimeoutHours: 25,
            shadowLayerEnabled: true,
            familyLayerEnabled: true,
            
            // Cleanup and refresh
            cleanupInterval: options.cleanupInterval || 60 * 60 * 1000, // 1 hour
            deathCheckInterval: options.deathCheckInterval || 5 * 60 * 1000, // 5 minutes
            
            // Storage paths
            deadstateDir: options.deadstateDir || path.join(__dirname, 'deadstate-cache'),
            shadowDir: options.shadowDir || path.join(__dirname, 'shadow-layer'),
            familyDir: options.familyDir || path.join(__dirname, 'family-layer'),
            
            // Performance limits
            maxDeadUsers: options.maxDeadUsers || 100000,
            maxLiveUsers: options.maxLiveUsers || 1000,
            maxShadowUsers: options.maxShadowUsers || 10000,
            
            // System protection
            crashProtection: true,
            memoryLimit: options.memoryLimit || 100 * 1024 * 1024, // 100MB
            
            ...options
        };
        
        // User state tracking
        this.deadUsers = new Map(); // Minimal dead state cache
        this.liveUsers = new Map(); // Active resurrected users
        this.shadowUsers = new Map(); // Background participants
        
        // System statistics
        this.stats = {
            totalDeaths: 0,
            totalResurrections: 0,
            shadowActions: 0,
            familyActions: 0,
            systemCrashes: 0,
            cleanupCycles: 0
        };
        
        // Resurrection timers
        this.resurrectionTimers = new Map();
        
        this.init();
    }
    
    async init() {
        try {
            console.log('⚰️ Initializing Deadstate User System...');
            
            // Create storage directories
            await this.createDirectories();
            
            // Load existing dead states
            await this.loadDeadStates();
            
            // Start cleanup cycles
            this.startCleanupCycles();
            
            // Start death monitoring
            this.startDeathMonitoring();
            
            console.log('✅ Deadstate User System ready');
            console.log(`💀 ${this.deadUsers.size} users in dead state`);
            console.log(`👻 ${this.shadowUsers.size} users in shadow layer`);
            console.log(`👨‍👩‍👧‍👦 ${this.liveUsers.size} users in family layer`);
            
            this.emit('system_ready');
        } catch (error) {
            console.error('❌ Deadstate system init error:', error.message);
            // Continue in degraded mode
            this.emit('system_degraded');
        }
    }
    
    /**
     * Main API: Get user state (defaults to dead)
     */
    async getUserState(identifier) {
        if (!identifier) {
            return this.createDeadState();
        }
        
        try {
            // Check family layer first (live users)
            if (this.liveUsers.has(identifier)) {
                const liveUser = this.liveUsers.get(identifier);
                return this.enhanceLiveState(liveUser);
            }
            
            // Check shadow layer (background participants)
            if (this.shadowUsers.has(identifier)) {
                const shadowUser = this.shadowUsers.get(identifier);
                return this.enhanceShadowState(shadowUser);
            }
            
            // Default to dead state (most users most of the time)
            const deadUser = this.deadUsers.get(identifier) || this.createDeadState(identifier);
            return deadUser;
            
        } catch (error) {
            console.warn('⚠️ Error getting user state, returning dead state:', error.message);
            this.stats.systemCrashes++;
            return this.createDeadState(identifier);
        }
    }
    
    /**
     * Resurrect a user (move from dead to live)
     */
    async resurrectUser(identifier, trigger = 'login') {
        try {
            console.log(`🧟 Resurrecting user: ${identifier} (trigger: ${trigger})`);
            
            // Get current dead/shadow state
            const currentState = await this.getUserState(identifier);
            
            // Create live state from dead state
            const liveState = this.createLiveState(currentState, trigger);
            
            // Move to family layer
            this.liveUsers.set(identifier, liveState);
            
            // Remove from dead/shadow layers
            this.deadUsers.delete(identifier);
            this.shadowUsers.delete(identifier);
            
            // Set resurrection timer (25 hours)
            this.setResurrectionTimer(identifier);
            
            // Update statistics
            this.stats.totalResurrections++;
            
            // Emit resurrection event
            this.emit('user_resurrected', {
                identifier,
                trigger,
                timestamp: Date.now(),
                previousState: currentState.layer
            });
            
            // Notify shadow layer of resurrection
            if (this.config.shadowLayerEnabled) {
                this.emit('shadow_notification', {
                    type: 'resurrection',
                    user: identifier,
                    message: `${identifier} has awakened from the shadow realm`
                });
            }
            
            return liveState;
            
        } catch (error) {
            console.error('❌ Resurrection error:', error.message);
            return this.createDeadState(identifier);
        }
    }
    
    /**
     * Kill a user (move from live to dead)
     */
    async killUser(identifier, reason = '25_hour_timeout') {
        try {
            console.log(`💀 Killing user: ${identifier} (reason: ${reason})`);
            
            // Get current live state
            const liveState = this.liveUsers.get(identifier);
            if (!liveState) return; // Already dead
            
            // Create dead state preserving important data
            const deadState = this.createDeadState(identifier, liveState);
            
            // Store in dead cache
            this.deadUsers.set(identifier, deadState);
            
            // Remove from live layer
            this.liveUsers.delete(identifier);
            
            // Cancel resurrection timer
            this.clearResurrectionTimer(identifier);
            
            // Update statistics
            this.stats.totalDeaths++;
            
            // Emit death event
            this.emit('user_died', {
                identifier,
                reason,
                timestamp: Date.now(),
                survivalTime: Date.now() - liveState.resurrectedAt
            });
            
            // Move to shadow layer if they have ongoing activities
            if (this.hasOngoingActivities(liveState)) {
                await this.moveToShadowLayer(identifier, deadState);
            }
            
            return deadState;
            
        } catch (error) {
            console.error('❌ Death processing error:', error.message);
            // Ensure user is dead even if processing fails
            this.liveUsers.delete(identifier);
            this.deadUsers.set(identifier, this.createDeadState(identifier));
        }
    }
    
    /**
     * Move user to shadow layer (background participation)
     */
    async moveToShadowLayer(identifier, deadState = null) {
        try {
            if (!this.config.shadowLayerEnabled) return;
            
            const userState = deadState || await this.getUserState(identifier);
            
            // Create shadow state
            const shadowState = {
                ...userState,
                layer: 'shadow',
                shadowActivatedAt: Date.now(),
                shadowLevel: userState.shadowLevel || 1,
                backgroundActivities: userState.backgroundActivities || [],
                passiveProgress: true,
                canReceiveNotifications: true,
                shadowMotivation: 'Keep the dream alive while you sleep'
            };
            
            this.shadowUsers.set(identifier, shadowState);
            this.deadUsers.delete(identifier);
            
            console.log(`👻 ${identifier} moved to shadow layer`);
            
            this.emit('shadow_layer_join', {
                identifier,
                shadowLevel: shadowState.shadowLevel,
                activities: shadowState.backgroundActivities.length
            });
            
        } catch (error) {
            console.warn('⚠️ Shadow layer movement error:', error.message);
        }
    }
    
    // State creation methods
    createDeadState(identifier = null, previousState = null) {
        return {
            identifier,
            layer: 'dead',
            status: 'offline',
            level: previousState?.level || 1,
            username: previousState?.username || identifier || 'ghost_user',
            
            // Minimal dead state data
            lastActivity: previousState?.lastActivity || null,
            deathTime: Date.now(),
            deathReason: 'default_dead_state',
            
            // Preserved from life
            achievements: previousState?.achievements || [],
            totalScore: previousState?.totalScore || 0,
            shadowLevel: previousState?.shadowLevel || 1,
            
            // Dead state capabilities
            canResurrect: true,
            shadowEligible: true,
            memoryFootprint: 'minimal',
            processingRequired: false,
            
            // System info
            _state: 'dead',
            _loadTime: 1, // Dead states load instantly
            _memoryUsage: 'ultra-low',
            _systemImpact: 'none'
        };
    }
    
    createLiveState(deadState, trigger) {
        return {
            ...deadState,
            layer: 'family',
            status: 'online',
            
            // Life state properties
            resurrectedAt: Date.now(),
            resurrectionTrigger: trigger,
            sessionTimeout: Date.now() + (this.config.resurrectionTimeoutHours * 60 * 60 * 1000),
            
            // Enhanced capabilities
            canInteract: true,
            realTimeUpdates: true,
            fullGameAccess: true,
            dashboardActive: true,
            
            // System resources
            processingRequired: true,
            memoryFootprint: 'standard',
            _state: 'alive',
            _systemImpact: 'active'
        };
    }
    
    enhanceShadowState(shadowState) {
        return {
            ...shadowState,
            // Shadow layer enhancements
            backgroundProgress: this.calculateBackgroundProgress(shadowState),
            shadowMessages: this.getShadowMessages(shadowState.identifier),
            passiveGains: this.calculatePassiveGains(shadowState),
            
            // Limited interactions
            canViewProgress: true,
            canReceiveUpdates: true,
            canMakeLimitedActions: true,
            
            _state: 'shadow',
            _systemImpact: 'minimal'
        };
    }
    
    enhanceLiveState(liveState) {
        return {
            ...liveState,
            // Real-time enhancements
            currentActions: this.getCurrentActions(liveState.identifier),
            liveNotifications: this.getLiveNotifications(liveState.identifier),
            activeQuests: this.getActiveQuests(liveState.identifier),
            
            // Full capabilities
            systemAccess: 'full',
            interactionLevel: 'complete',
            
            _state: 'family',
            _systemImpact: 'full'
        };
    }
    
    // Helper methods
    hasOngoingActivities(userState) {
        return (
            userState.activeQuests?.length > 0 ||
            userState.pendingActions?.length > 0 ||
            userState.totalScore > 100 ||
            userState.level > 3
        );
    }
    
    calculateBackgroundProgress(shadowState) {
        const timeSinceShadow = Date.now() - shadowState.shadowActivatedAt;
        const hoursInShadow = timeSinceShadow / (60 * 60 * 1000);
        
        return {
            shadowExperience: Math.floor(hoursInShadow * shadowState.shadowLevel),
            passiveResources: Math.floor(hoursInShadow * 10),
            dreamProgress: Math.min(100, hoursInShadow * 2),
            timeInShadow: hoursInShadow
        };
    }
    
    calculatePassiveGains(shadowState) {
        const progress = this.calculateBackgroundProgress(shadowState);
        return {
            experience: progress.shadowExperience,
            coins: progress.passiveResources,
            items: Math.floor(progress.timeInShadow / 12), // 1 item per 12 hours
            memories: Math.floor(progress.dreamProgress / 10)
        };
    }
    
    getShadowMessages(identifier) {
        return [
            `The shadow realm whispers of your deeds, ${identifier}...`,
            `Your legend grows even in death...`,
            `The family remembers your contributions...`,
            `Your shadow continues the quest...`
        ];
    }
    
    getCurrentActions(identifier) {
        // Placeholder for real-time actions
        return [];
    }
    
    getLiveNotifications(identifier) {
        // Placeholder for live notifications
        return [];
    }
    
    getActiveQuests(identifier) {
        // Placeholder for active quests
        return [];
    }
    
    // Timer management
    setResurrectionTimer(identifier) {
        // Clear existing timer
        this.clearResurrectionTimer(identifier);
        
        // Set 25-hour death timer
        const timer = setTimeout(() => {
            this.killUser(identifier, '25_hour_timeout');
        }, this.config.resurrectionTimeoutHours * 60 * 60 * 1000);
        
        this.resurrectionTimers.set(identifier, timer);
    }
    
    clearResurrectionTimer(identifier) {
        const timer = this.resurrectionTimers.get(identifier);
        if (timer) {
            clearTimeout(timer);
            this.resurrectionTimers.delete(identifier);
        }
    }
    
    // System maintenance
    async createDirectories() {
        await fs.mkdir(this.config.deadstateDir, { recursive: true });
        if (this.config.shadowLayerEnabled) {
            await fs.mkdir(this.config.shadowDir, { recursive: true });
        }
        if (this.config.familyLayerEnabled) {
            await fs.mkdir(this.config.familyDir, { recursive: true });
        }
    }
    
    async loadDeadStates() {
        try {
            // Load minimal dead state cache if it exists
            const cacheFile = path.join(this.config.deadstateDir, 'dead-cache.json');
            
            try {
                const cacheData = await fs.readFile(cacheFile, 'utf8');
                const deadStates = JSON.parse(cacheData);
                
                for (const [identifier, state] of Object.entries(deadStates)) {
                    this.deadUsers.set(identifier, state);
                }
                
                console.log(`💀 Loaded ${this.deadUsers.size} dead states from cache`);
            } catch {
                // No cache file exists, start fresh
                console.log('💀 Starting with empty dead state cache');
            }
        } catch (error) {
            console.warn('⚠️ Error loading dead states:', error.message);
        }
    }
    
    async saveDeadStates() {
        try {
            const cacheFile = path.join(this.config.deadstateDir, 'dead-cache.json');
            const deadStates = Object.fromEntries(this.deadUsers.entries());
            
            await fs.writeFile(cacheFile, JSON.stringify(deadStates, null, 2));
            console.log(`💾 Saved ${this.deadUsers.size} dead states to cache`);
        } catch (error) {
            console.warn('⚠️ Error saving dead states:', error.message);
        }
    }
    
    startCleanupCycles() {
        setInterval(async () => {
            console.log('🧹 Starting 25-hour cleanup cycle...');
            
            // Kill all live users (force everyone back to dead)
            const liveUserIds = Array.from(this.liveUsers.keys());
            for (const userId of liveUserIds) {
                await this.killUser(userId, '25_hour_cleanup_cycle');
            }
            
            // Clean up shadow layer
            this.shadowUsers.clear();
            
            // Save dead states
            await this.saveDeadStates();
            
            // Memory cleanup
            if (global.gc) global.gc();
            
            this.stats.cleanupCycles++;
            
            console.log('✅ Cleanup cycle complete - all users returned to dead state');
            this.emit('cleanup_cycle_complete');
            
        }, this.config.resurrectionTimeoutHours * 60 * 60 * 1000); // 25 hours
    }
    
    startDeathMonitoring() {
        setInterval(() => {
            // Check for users who should be dead but aren't
            const now = Date.now();
            
            for (const [identifier, liveState] of this.liveUsers.entries()) {
                if (now > liveState.sessionTimeout) {
                    this.killUser(identifier, 'session_timeout');
                }
            }
        }, this.config.deathCheckInterval);
    }
    
    // Statistics and health
    getSystemStats() {
        const memUsage = process.memoryUsage();
        
        return {
            ...this.stats,
            users: {
                dead: this.deadUsers.size,
                shadow: this.shadowUsers.size,
                family: this.liveUsers.size,
                total: this.deadUsers.size + this.shadowUsers.size + this.liveUsers.size
            },
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
                limit: Math.round(this.config.memoryLimit / 1024 / 1024) + 'MB',
                deadStateFootprint: 'minimal'
            },
            system: {
                crashProtection: this.config.crashProtection,
                defaultState: this.config.defaultState,
                uptime: process.uptime()
            }
        };
    }
    
    // Cleanup and shutdown
    async shutdown() {
        console.log('⚰️ Shutting down Deadstate User System...');
        
        // Clear all timers
        for (const timer of this.resurrectionTimers.values()) {
            clearTimeout(timer);
        }
        this.resurrectionTimers.clear();
        
        // Save dead states
        await this.saveDeadStates();
        
        // Clear memory
        this.deadUsers.clear();
        this.liveUsers.clear();
        this.shadowUsers.clear();
        
        console.log('💀 All users returned to eternal rest');
        this.emit('system_shutdown');
    }
}

// Express.js middleware for deadstate system
function createDeadstateMiddleware(deadstateSystem) {
    return async (req, res, next) => {
        try {
            // Get user identifier from request
            const identifier = req.headers.authorization || 
                             req.session?.userId || 
                             req.query.user || 
                             req.ip;
            
            // Get user state (defaults to dead)
            req.user = await deadstateSystem.getUserState(identifier);
            
            // Auto-resurrect on API usage
            if (req.user.layer === 'dead' && req.method !== 'GET') {
                req.user = await deadstateSystem.resurrectUser(identifier, 'api_action');
            }
            
            next();
        } catch (error) {
            // Even on error, provide dead state
            req.user = deadstateSystem.createDeadState();
            next();
        }
    };
}

// CLI interface
if (require.main === module) {
    const command = process.argv[2];
    const identifier = process.argv[3];
    
    const system = new DeadstateUserSystem();
    
    switch (command) {
        case 'status':
            system.on('system_ready', () => {
                console.log('System Statistics:');
                console.log(JSON.stringify(system.getSystemStats(), null, 2));
                process.exit(0);
            });
            break;
            
        case 'resurrect':
            if (!identifier) {
                console.log('Usage: node deadstate-user-system.js resurrect <identifier>');
                process.exit(1);
            }
            system.on('system_ready', async () => {
                const liveUser = await system.resurrectUser(identifier, 'cli');
                console.log('Resurrected user:', JSON.stringify(liveUser, null, 2));
                process.exit(0);
            });
            break;
            
        case 'kill':
            if (!identifier) {
                console.log('Usage: node deadstate-user-system.js kill <identifier>');
                process.exit(1);
            }
            system.on('system_ready', async () => {
                const deadUser = await system.killUser(identifier, 'cli');
                console.log('Killed user:', JSON.stringify(deadUser, null, 2));
                process.exit(0);
            });
            break;
            
        default:
            console.log('Deadstate User System Commands:');
            console.log('  status                    - Show system statistics');
            console.log('  resurrect <identifier>    - Resurrect a user');
            console.log('  kill <identifier>         - Kill a user');
    }
}

module.exports = {
    DeadstateUserSystem,
    createDeadstateMiddleware
};