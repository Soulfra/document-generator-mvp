#!/usr/bin/env node

/**
 * 🏪 ZUSTAND-STYLE LIFE STORE
 * 
 * Reactive state management for complete life/identity system
 * Unifies cross-platform window management, personal life tracking, and community evolution
 * Provides offline-first storage with cloud synchronization
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ZustandStyleLifeStore extends EventEmitter {
    constructor() {
        super();
        
        this.storeId = `life-store-${Date.now()}`;
        this.subscribers = new Map();
        this.middlewares = [];
        
        // Core life data store
        this.state = {
            // Personal identity and lifecycle
            identity: {
                economicSignature: null,
                digitalAge: 0,
                lifeStage: 'birth',
                lastUpdate: Date.now(),
                creationDate: Date.now()
            },
            
            // Cross-platform window states
            windows: {
                active: new Map(),
                layouts: new Map(),
                preferences: {},
                platformConfig: {}
            },
            
            // Educational world progress
            worlds: {
                discovered: new Map(),
                progress: new Map(),
                achievements: new Map(),
                currentWorld: null
            },
            
            // Community and social
            community: {
                forumParticipation: new Map(),
                wikiContributions: new Map(),
                socialConnections: new Map(),
                reputation: 0
            },
            
            // Economic identity
            economic: {
                stripeVerified: false,
                paymentPatterns: [],
                subscriptions: new Map(),
                taxDocuments: []
            },
            
            // AI and reasoning
            ai: {
                lifeMirror: null,
                reasoningPatterns: [],
                decisionHistory: [],
                personalityProfile: {}
            },
            
            // Meta-system state
            meta: {
                version: '1.0.0',
                syncStatus: 'offline',
                lastSync: null,
                deviceId: this.generateDeviceId(),
                platform: process.platform
            }
        };
        
        // Persistence paths
        this.persistencePath = path.join(os.homedir(), '.document-generator', 'life-store');
        this.statePath = path.join(this.persistencePath, 'state.json');
        this.backupPath = path.join(this.persistencePath, 'backups');
        
        // Reactive subscriptions
        this.selectors = new Map();
        this.computedValues = new Map();
        
        console.log('🏪 Zustand-style Life Store initialized');
    }
    
    /**
     * Initialize the life store
     */
    async initialize() {
        console.log('🚀 Initializing life store...');
        
        // Ensure directories exist
        await this.ensureDirectories();
        
        // Load persisted state
        await this.loadPersistedState();
        
        // Setup middleware
        this.setupDefaultMiddleware();
        
        // Start auto-save
        this.startAutoSave();
        
        // Initialize reactive computations
        this.initializeComputedValues();
        
        console.log('✅ Life store ready');
        
        this.emit('store:initialized', this.state);
    }
    
    /**
     * Core Zustand-style API: get current state
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    
    /**
     * Core Zustand-style API: set state with partial updates
     */
    setState(partial, replace = false) {
        const prevState = this.getState();
        
        if (replace) {
            this.state = { ...partial };
        } else {
            this.state = this.deepMerge(this.state, partial);
        }
        
        // Run middleware
        this.runMiddleware(prevState, this.state, partial);
        
        // Notify subscribers
        this.notifySubscribers(prevState, this.state, partial);
        
        // Update computed values
        this.updateComputedValues();
        
        // Auto-persist critical changes
        this.queuePersistence();
        
        this.emit('state:changed', { prevState, newState: this.state, partial });
    }
    
    /**
     * Core Zustand-style API: subscribe to state changes
     */
    subscribe(selector, callback, options = {}) {
        const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const subscription = {
            id: subscriptionId,
            selector: selector || ((state) => state),
            callback,
            options: {
                immediate: true,
                deep: true,
                ...options
            },
            lastValue: undefined
        };
        
        // Store subscription
        this.subscribers.set(subscriptionId, subscription);
        
        // Call immediately if requested
        if (subscription.options.immediate) {
            const currentValue = subscription.selector(this.state);
            subscription.lastValue = currentValue;
            callback(currentValue, this.state);
        }
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(subscriptionId);
        };
    }
    
    /**
     * Life-specific API: Update digital age and life stage
     */
    updateLifeStage() {
        const identity = this.state.identity;
        const daysPassed = Math.floor((Date.now() - identity.creationDate) / (1000 * 60 * 60 * 24));
        const digitalAge = daysPassed; // 1 day = 1 year digital age
        
        // Determine life stage based on digital age
        let lifeStage;
        if (digitalAge <= 2) lifeStage = 'birth';
        else if (digitalAge <= 12) lifeStage = 'childhood';
        else if (digitalAge <= 17) lifeStage = 'adolescence';
        else if (digitalAge <= 25) lifeStage = 'youngAdult';
        else if (digitalAge <= 45) lifeStage = 'adult';
        else if (digitalAge <= 65) lifeStage = 'midlife';
        else if (digitalAge <= 85) lifeStage = 'senior';
        else if (digitalAge <= 120) lifeStage = 'elder';
        else lifeStage = 'legacy';
        
        this.setState({
            identity: {
                ...identity,
                digitalAge,
                lifeStage,
                lastUpdate: Date.now()
            }
        });
    }
    
    /**
     * Window management integration
     */
    updateWindowState(windowId, windowData) {
        const newActive = new Map(this.state.windows.active);
        newActive.set(windowId, {
            ...windowData,
            lastUpdate: Date.now()
        });
        
        this.setState({
            windows: {
                ...this.state.windows,
                active: newActive
            }
        });
    }
    
    setWindowLayout(layoutName, layoutData) {
        const newLayouts = new Map(this.state.windows.layouts);
        newLayouts.set(layoutName, layoutData);
        
        this.setState({
            windows: {
                ...this.state.windows,
                layouts: newLayouts
            }
        });
    }
    
    /**
     * Educational world progress
     */
    discoverWorld(worldPort, worldInfo) {
        // Ensure discovered is a Map
        const currentDiscovered = this.state.worlds.discovered instanceof Map 
            ? this.state.worlds.discovered 
            : new Map();
            
        const newDiscovered = new Map(currentDiscovered);
        newDiscovered.set(worldPort, {
            ...worldInfo,
            discoveredAt: Date.now()
        });
        
        this.setState({
            worlds: {
                ...this.state.worlds,
                discovered: newDiscovered
            }
        });
    }
    
    updateWorldProgress(worldPort, progress) {
        // Ensure progress is a Map
        const currentProgress = this.state.worlds.progress instanceof Map 
            ? this.state.worlds.progress 
            : new Map();
            
        const existingProgress = currentProgress.get(worldPort) || {};
        const newProgress = new Map(currentProgress);
        newProgress.set(worldPort, {
            ...existingProgress,
            ...progress,
            lastUpdate: Date.now()
        });
        
        this.setState({
            worlds: {
                ...this.state.worlds,
                progress: newProgress
            }
        });
    }
    
    /**
     * Economic identity management
     */
    setStripeVerification(verified, accountData = {}) {
        this.setState({
            economic: {
                ...this.state.economic,
                stripeVerified: verified,
                accountData: verified ? accountData : undefined,
                verifiedAt: verified ? Date.now() : undefined
            }
        });
        
        if (verified) {
            this.generateEconomicSignature(accountData);
        }
    }
    
    addPaymentPattern(paymentData) {
        const patterns = [...this.state.economic.paymentPatterns, {
            ...paymentData,
            timestamp: Date.now()
        }];
        
        // Keep only last 100 patterns for privacy
        const limitedPatterns = patterns.slice(-100);
        
        this.setState({
            economic: {
                ...this.state.economic,
                paymentPatterns: limitedPatterns
            }
        });
    }
    
    /**
     * AI life mirror integration
     */
    updateAILifeMirror(mirrorData) {
        this.setState({
            ai: {
                ...this.state.ai,
                lifeMirror: {
                    ...this.state.ai.lifeMirror,
                    ...mirrorData,
                    lastUpdate: Date.now()
                }
            }
        });
    }
    
    addReasoningPattern(reasoning) {
        const patterns = [...this.state.ai.reasoningPatterns, {
            ...reasoning,
            timestamp: Date.now(),
            id: `reasoning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }];
        
        this.setState({
            ai: {
                ...this.state.ai,
                reasoningPatterns: patterns.slice(-50) // Keep last 50
            }
        });
    }
    
    /**
     * Community evolution integration
     */
    recordForumParticipation(forumId, participation) {
        const newParticipation = new Map(this.state.community.forumParticipation);
        newParticipation.set(forumId, {
            ...participation,
            lastActivity: Date.now()
        });
        
        this.setState({
            community: {
                ...this.state.community,
                forumParticipation: newParticipation
            }
        });
    }
    
    /**
     * Computed values (like Zustand's computed)
     */
    initializeComputedValues() {
        // Life stage information
        this.addComputed('lifeStageInfo', (state) => {
            const stage = state.identity.lifeStage;
            const age = state.identity.digitalAge;
            
            const stageInfo = {
                birth: { description: 'First digital interactions', color: '#FFB6C1' },
                childhood: { description: 'Basic learning and exploration', color: '#98FB98' },
                adolescence: { description: 'Skill development and identity formation', color: '#87CEEB' },
                youngAdult: { description: 'Education and early career', color: '#DDA0DD' },
                adult: { description: 'Career building and mastery', color: '#F0E68C' },
                midlife: { description: 'Leadership and mentoring', color: '#FFA500' },
                senior: { description: 'Wisdom sharing and legacy', color: '#CD853F' },
                elder: { description: 'Historical perspective and archival', color: '#D2691E' },
                legacy: { description: 'Post-death digital presence', color: '#696969' }
            };
            
            return {
                stage,
                age,
                daysAlive: age,
                ...stageInfo[stage]
            };
        });
        
        // Window management summary
        this.addComputed('windowSummary', (state) => ({
            totalWindows: state.windows.active.size,
            activeWorlds: Array.from(state.worlds.discovered.keys()),
            currentLayout: state.windows.preferences.layout || 'grid',
            platform: state.meta.platform
        }));
        
        // Learning progress
        this.addComputed('learningProgress', (state) => {
            const totalWorlds = state.worlds.discovered.size;
            const worldsWithProgress = Array.from(state.worlds.progress.values())
                .filter(progress => progress.completion > 0).length;
            
            return {
                totalWorlds,
                worldsWithProgress,
                completionRate: totalWorlds > 0 ? worldsWithProgress / totalWorlds : 0,
                achievements: state.worlds.achievements.size
            };
        });
        
        // Economic identity strength
        this.addComputed('economicIdentityStrength', (state) => {
            let score = 0;
            
            if (state.economic.stripeVerified) score += 40;
            if (state.economic.paymentPatterns.length > 10) score += 20;
            if (state.economic.subscriptions.size > 0) score += 15;
            if (state.economic.taxDocuments.length > 0) score += 25;
            
            return {
                score: Math.min(score, 100),
                level: score >= 80 ? 'strong' : score >= 50 ? 'medium' : 'weak',
                verified: state.economic.stripeVerified
            };
        });
    }
    
    addComputed(name, computeFn) {
        this.computedValues.set(name, {
            compute: computeFn,
            lastValue: undefined,
            subscribers: new Set()
        });
    }
    
    getComputed(name) {
        const computed = this.computedValues.get(name);
        if (!computed) return undefined;
        
        const newValue = computed.compute(this.state);
        
        // Check if value changed
        if (JSON.stringify(newValue) !== JSON.stringify(computed.lastValue)) {
            computed.lastValue = newValue;
            // Notify computed subscribers
            computed.subscribers.forEach(callback => callback(newValue));
        }
        
        return newValue;
    }
    
    subscribeToComputed(name, callback) {
        const computed = this.computedValues.get(name);
        if (!computed) throw new Error(`Computed value '${name}' not found`);
        
        computed.subscribers.add(callback);
        
        // Call immediately
        const currentValue = this.getComputed(name);
        callback(currentValue);
        
        return () => computed.subscribers.delete(callback);
    }
    
    /**
     * Middleware system
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }
    
    setupDefaultMiddleware() {
        // Logging middleware
        this.use((prevState, newState, partial) => {
            console.log('🔄 State change:', Object.keys(partial));
        });
        
        // Life stage auto-update middleware
        this.use((prevState, newState, partial) => {
            // Auto-update life stage daily
            const lastUpdate = newState.identity.lastUpdate;
            const daysSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
            
            if (daysSinceUpdate >= 1) {
                // Schedule life stage update
                setTimeout(() => this.updateLifeStage(), 100);
            }
        });
        
        // Persistence middleware
        this.use((prevState, newState, partial) => {
            const criticalKeys = ['identity', 'economic', 'worlds'];
            const hasCriticalChange = criticalKeys.some(key => key in partial);
            
            if (hasCriticalChange) {
                this.queuePersistence();
            }
        });
    }
    
    runMiddleware(prevState, newState, partial) {
        this.middlewares.forEach(middleware => {
            try {
                middleware(prevState, newState, partial);
            } catch (error) {
                console.error('Middleware error:', error);
            }
        });
    }
    
    /**
     * Subscribers notification
     */
    notifySubscribers(prevState, newState, partial) {
        this.subscribers.forEach((subscription) => {
            try {
                const newValue = subscription.selector(newState);
                const hasChanged = subscription.options.deep 
                    ? JSON.stringify(newValue) !== JSON.stringify(subscription.lastValue)
                    : newValue !== subscription.lastValue;
                
                if (hasChanged) {
                    subscription.lastValue = newValue;
                    subscription.callback(newValue, newState, prevState);
                }
            } catch (error) {
                console.error('Subscriber error:', error);
            }
        });
    }
    
    updateComputedValues() {
        this.computedValues.forEach((computed, name) => {
            this.getComputed(name); // This will trigger updates if needed
        });
    }
    
    /**
     * Persistence layer
     */
    async ensureDirectories() {
        await fs.mkdir(this.persistencePath, { recursive: true });
        await fs.mkdir(this.backupPath, { recursive: true });
    }
    
    async loadPersistedState() {
        try {
            const data = await fs.readFile(this.statePath, 'utf8');
            const persistedState = JSON.parse(data);
            
            // Merge with default state (handle version upgrades)
            this.state = this.deepMerge(this.state, persistedState);
            
            console.log('📂 Loaded persisted life state');
        } catch (error) {
            console.log('📂 No existing life state found, starting fresh');
        }
    }
    
    async persistState() {
        try {
            // Create backup first
            await this.createBackup();
            
            // Serialize state
            const serializedState = this.serializeState();
            
            // Write to file
            await fs.writeFile(this.statePath, JSON.stringify(serializedState, null, 2));
            
            // Update meta information
            this.setState({
                meta: {
                    ...this.state.meta,
                    lastPersist: Date.now()
                }
            }, false); // Don't trigger another persist
            
            console.log('💾 Life state persisted');
        } catch (error) {
            console.error('Error persisting state:', error);
        }
    }
    
    serializeState() {
        // Convert Maps to objects for JSON serialization
        const serializable = JSON.parse(JSON.stringify(this.state));
        
        // Handle Maps manually
        serializable.windows.active = Object.fromEntries(this.state.windows.active);
        serializable.windows.layouts = Object.fromEntries(this.state.windows.layouts);
        serializable.worlds.discovered = Object.fromEntries(this.state.worlds.discovered);
        serializable.worlds.progress = Object.fromEntries(this.state.worlds.progress);
        serializable.worlds.achievements = Object.fromEntries(this.state.worlds.achievements);
        serializable.community.forumParticipation = Object.fromEntries(this.state.community.forumParticipation);
        serializable.community.wikiContributions = Object.fromEntries(this.state.community.wikiContributions);
        serializable.community.socialConnections = Object.fromEntries(this.state.community.socialConnections);
        serializable.economic.subscriptions = Object.fromEntries(this.state.economic.subscriptions);
        
        return serializable;
    }
    
    async createBackup() {
        const backupFileName = `life-state-backup-${Date.now()}.json`;
        const backupFilePath = path.join(this.backupPath, backupFileName);
        
        try {
            const serializedState = this.serializeState();
            await fs.writeFile(backupFilePath, JSON.stringify(serializedState, null, 2));
            
            // Keep only last 10 backups
            const backupFiles = await fs.readdir(this.backupPath);
            const sortedBackups = backupFiles
                .filter(f => f.startsWith('life-state-backup-'))
                .sort()
                .reverse();
            
            for (const oldBackup of sortedBackups.slice(10)) {
                await fs.unlink(path.join(this.backupPath, oldBackup));
            }
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    }
    
    startAutoSave() {
        // Auto-save every 60 seconds
        setInterval(async () => {
            await this.persistState();
        }, 60000);
    }
    
    queuePersistence() {
        // Debounced persistence (avoid too frequent saves)
        clearTimeout(this.persistenceTimeout);
        this.persistenceTimeout = setTimeout(() => {
            this.persistState();
        }, 5000);
    }
    
    /**
     * Utility methods
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] instanceof Map) {
                // Handle Map merging properly
                const targetMap = target[key] instanceof Map ? target[key] : new Map();
                result[key] = new Map([...targetMap, ...source[key]]);
            } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    generateDeviceId() {
        return `device-${os.platform()}-${os.hostname()}-${Date.now()}`;
    }
    
    generateEconomicSignature(accountData) {
        const crypto = require('crypto');
        
        const signatureData = [
            accountData.accountId || '',
            accountData.bankHash || '',
            accountData.taxId || '',
            this.state.identity.digitalAge
        ].join('::');
        
        const signature = crypto.createHash('sha256').update(signatureData).digest('hex');
        
        this.setState({
            identity: {
                ...this.state.identity,
                economicSignature: signature
            }
        });
        
        console.log('🔐 Economic signature generated');
    }
    
    /**
     * Public API methods
     */
    getLifeStage() {
        return this.getComputed('lifeStageInfo');
    }
    
    getEconomicIdentityStrength() {
        return this.getComputed('economicIdentityStrength');
    }
    
    getLearningProgress() {
        return this.getComputed('learningProgress');
    }
    
    getWindowSummary() {
        return this.getComputed('windowSummary');
    }
    
    // Export state for debugging
    exportState() {
        return {
            state: this.getState(),
            computed: {
                lifeStage: this.getComputed('lifeStageInfo'),
                windows: this.getComputed('windowSummary'),
                learning: this.getComputed('learningProgress'),
                economic: this.getComputed('economicIdentityStrength')
            },
            meta: {
                subscribers: this.subscribers.size,
                computedValues: this.computedValues.size,
                middlewares: this.middlewares.length
            }
        };
    }
    
    // Integration helpers
    connectWindowManager(windowManager) {
        windowManager.on('window:created', ({ window, worldPort }) => {
            this.updateWindowState(window.id, window);
            if (worldPort) {
                this.discoverWorld(worldPort, { port: worldPort });
            }
        });
        
        windowManager.on('window:moved', ({ window }) => {
            this.updateWindowState(window.id, window);
        });
    }
    
    connectPersonalLifeDatabase(lifeDatabase) {
        lifeDatabase.on('stage:changed', (stageInfo) => {
            this.setState({
                identity: {
                    ...this.state.identity,
                    lifeStage: stageInfo.stage,
                    digitalAge: stageInfo.age
                }
            });
        });
        
        lifeDatabase.on('preference:updated', (preferences) => {
            this.setState({
                identity: {
                    ...this.state.identity,
                    preferences
                }
            });
        });
    }
    
    connectCommunityEvolution(communityEngine) {
        communityEngine.on('forum:participation', ({ forumId, participation }) => {
            this.recordForumParticipation(forumId, participation);
        });
        
        communityEngine.on('reputation:changed', (reputation) => {
            this.setState({
                community: {
                    ...this.state.community,
                    reputation
                }
            });
        });
    }
}

module.exports = ZustandStyleLifeStore;

// CLI Demo
if (require.main === module) {
    async function demo() {
        console.log('\n🏪 ZUSTAND-STYLE LIFE STORE DEMO\n');
        
        const lifeStore = new ZustandStyleLifeStore();
        
        try {
            await lifeStore.initialize();
            
            console.log('📊 Initial State:');
            console.log('Life Stage:', lifeStore.getLifeStage());
            console.log('Economic Strength:', lifeStore.getEconomicIdentityStrength());
            
            console.log('\n🔄 Testing reactive subscriptions...');
            
            // Subscribe to life stage changes
            const unsubscribeLife = lifeStore.subscribeToComputed('lifeStageInfo', (lifeInfo) => {
                console.log(`🎂 Life Stage Update: ${lifeInfo.stage} (Age: ${lifeInfo.age})`);
            });
            
            // Subscribe to economic changes
            const unsubscribeEconomic = lifeStore.subscribe(
                (state) => state.economic.stripeVerified,
                (verified) => {
                    console.log(`💳 Economic Verification: ${verified ? 'VERIFIED' : 'PENDING'}`);
                }
            );
            
            console.log('📈 Simulating life events...');
            
            // Simulate Stripe verification
            setTimeout(() => {
                lifeStore.setStripeVerification(true, {
                    accountId: 'acct_demo123',
                    bankHash: 'bank_hash_demo',
                    taxId: 'tax_demo'
                });
            }, 1000);
            
            // Simulate world discovery
            setTimeout(() => {
                lifeStore.discoverWorld(1000, {
                    name: 'Hello World Haven',
                    difficulty: 1,
                    skills: ['programming']
                });
            }, 2000);
            
            // Simulate learning progress
            setTimeout(() => {
                lifeStore.updateWorldProgress(1000, {
                    completion: 0.3,
                    skillsLearned: ['basic-programming'],
                    timeSpent: 1800000 // 30 minutes
                });
            }, 3000);
            
            console.log('\n⏳ Waiting for reactive updates...');
            
            // Show final state after 5 seconds
            setTimeout(() => {
                console.log('\n📊 Final State Export:');
                const exported = lifeStore.exportState();
                console.log(JSON.stringify(exported, null, 2));
                
                // Cleanup
                unsubscribeLife();
                unsubscribeEconomic();
                
                console.log('\n🎉 Life Store demo completed!');
            }, 5000);
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo().catch(console.error);
}