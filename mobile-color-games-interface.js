#!/usr/bin/env node

/**
 * 📱 MOBILE COLOR GAMES INTERFACE 📱
 * 
 * Mobile-optimized interface for color-coded education games
 * Integrates with chapter-story progression system and emoji navigation
 * Features touch controls, haptic feedback, and native mobile optimization
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class MobileColorGamesInterface extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.dataDir = path.join(process.cwd(), 'mobile-games-data');
        this.configPath = path.join(this.dataDir, 'mobile-color-games-config.json');
        
        // Connect to existing systems
        this.services = {
            progressionEngine: './chapter-story-progression-engine.js',
            emojiNavigation: './emoji-navigation-system.js',
            colorEducation: './color-coded-education-system.js',
            unifiedContainer: './mobile-app-unified-container.js'
        };
        
        // Mobile-optimized color games with touch controls
        this.mobileGames = {
            'pattern_pursuit': {
                id: 'pattern_pursuit',
                name: '🌈 Pattern Pursuit',
                description: 'Swipe to match color patterns',
                category: 'pattern-recognition',
                difficulty: 'easy',
                estimatedTime: '3-5 minutes',
                controls: {
                    primary: 'swipe',
                    secondary: 'tap',
                    gestures: ['swipe-left', 'swipe-right', 'tap', 'long-press']
                },
                haptics: {
                    success: 'light',
                    error: 'heavy',
                    progress: 'selection'
                },
                mobileFeatures: {
                    accelerometer: false,
                    gyroscope: false,
                    vibration: true,
                    orientation: 'portrait'
                }
            },
            
            'emotion_explorer': {
                id: 'emotion_explorer',
                name: '💙 Emotion Explorer',
                description: 'Touch and drag to match emotions with colors',
                category: 'emotional-intelligence',
                difficulty: 'medium',
                estimatedTime: '5-8 minutes',
                controls: {
                    primary: 'drag',
                    secondary: 'pinch',
                    gestures: ['drag', 'pinch', 'rotate', 'double-tap']
                },
                haptics: {
                    success: 'medium',
                    error: 'heavy',
                    progress: 'light',
                    connection: 'selection'
                },
                mobileFeatures: {
                    accelerometer: true,
                    gyroscope: false,
                    vibration: true,
                    orientation: 'any'
                }
            },
            
            'color_clash': {
                id: 'color_clash',
                name: '⚡ Color Clash Arena',
                description: 'Real-time multiplayer color battles',
                category: 'strategic-thinking',
                difficulty: 'hard',
                estimatedTime: '8-12 minutes',
                controls: {
                    primary: 'multi-touch',
                    secondary: 'swipe',
                    gestures: ['multi-touch', 'swipe-fast', 'tap-rapid', 'hold']
                },
                haptics: {
                    success: 'heavy',
                    error: 'warning',
                    progress: 'light',
                    battle: 'impact'
                },
                mobileFeatures: {
                    accelerometer: true,
                    gyroscope: true,
                    vibration: true,
                    orientation: 'landscape'
                }
            },
            
            'memory_spectrum': {
                id: 'memory_spectrum',
                name: '🧠 Memory Spectrum',
                description: 'Remember and recreate color sequences',
                category: 'memory-training',
                difficulty: 'medium',
                estimatedTime: '4-7 minutes',
                controls: {
                    primary: 'tap',
                    secondary: 'hold',
                    gestures: ['tap-sequence', 'hold-timing', 'release-precise']
                },
                haptics: {
                    success: 'light',
                    error: 'medium',
                    progress: 'tick',
                    sequence: 'rhythm'
                },
                mobileFeatures: {
                    accelerometer: false,
                    gyroscope: false,
                    vibration: true,
                    orientation: 'portrait'
                }
            },
            
            'harmony_builder': {
                id: 'harmony_builder',
                name: '🎵 Harmony Builder',
                description: 'Create color harmonies with musical feedback',
                category: 'creative-expression',
                difficulty: 'easy',
                estimatedTime: '5-10 minutes',
                controls: {
                    primary: 'draw',
                    secondary: 'erase',
                    gestures: ['draw-smooth', 'erase-gesture', 'undo-shake']
                },
                haptics: {
                    success: 'light',
                    error: 'soft',
                    progress: 'gentle',
                    harmony: 'musical'
                },
                mobileFeatures: {
                    accelerometer: true,
                    gyroscope: false,
                    vibration: true,
                    orientation: 'portrait'
                }
            },
            
            'speed_spectrum': {
                id: 'speed_spectrum',
                name: '⚡ Speed Spectrum',
                description: 'Fast-paced color matching under time pressure',
                category: 'reaction-time',
                difficulty: 'hard',
                estimatedTime: '2-4 minutes',
                controls: {
                    primary: 'rapid-tap',
                    secondary: 'swipe-fast',
                    gestures: ['rapid-tap', 'swipe-combo', 'multi-finger']
                },
                haptics: {
                    success: 'sharp',
                    error: 'buzz',
                    progress: 'pulse',
                    speed: 'rapid'
                },
                mobileFeatures: {
                    accelerometer: false,
                    gyroscope: false,
                    vibration: true,
                    orientation: 'portrait'
                }
            }
        };
        
        // Mobile UI components and layouts
        this.mobileUI = {
            gameHeader: {
                height: '80px',
                background: 'gradient',
                elements: ['back-button', 'title', 'progress-bar', 'score']
            },
            gameArea: {
                flex: 1,
                background: 'adaptive',
                safeArea: true,
                elements: ['game-canvas', 'touch-zones', 'feedback-area']
            },
            gameFooter: {
                height: '120px',
                background: 'transparent',
                elements: ['controls-hint', 'pause-button', 'help-button']
            }
        };
        
        // Progressive Web App features
        this.pwaFeatures = {
            installPrompt: true,
            offlineSupport: true,
            pushNotifications: true,
            backgroundSync: true,
            caching: 'aggressive'
        };
        
        // Game session tracking
        this.activeSessions = new Map();
        this.sessionStats = new Map();
        
        console.log('📱 Mobile Color Games Interface initializing...');
    }
    
    async initialize() {
        console.log('\n🎮 Setting up mobile game interface...');
        
        // Create data directory
        await fs.mkdir(this.dataDir, { recursive: true });
        
        // Load existing configuration
        await this.loadConfiguration();
        
        // Initialize mobile features
        await this.initializeMobileFeatures();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Register with progression system
        await this.registerWithProgressionSystem();
        
        console.log('✅ Mobile color games interface ready!');
    }
    
    async loadConfiguration() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configData);
            
            // Merge with defaults
            Object.assign(this.mobileGames, config.games || {});
            Object.assign(this.mobileUI, config.ui || {});
            Object.assign(this.pwaFeatures, config.pwa || {});
            
            console.log('   Loaded mobile game configuration');
        } catch (error) {
            console.log('   No existing configuration found, using defaults');
            await this.saveConfiguration();
        }
    }
    
    async saveConfiguration() {
        const config = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            games: this.mobileGames,
            ui: this.mobileUI,
            pwa: this.pwaFeatures
        };
        
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    
    async initializeMobileFeatures() {
        console.log('   Setting up mobile-specific features...');
        
        // Set up haptic feedback patterns
        this.setupHapticPatterns();
        
        // Configure touch gesture recognition
        this.setupTouchGestures();
        
        // Initialize PWA features
        this.setupPWAFeatures();
        
        // Set up offline game modes
        this.setupOfflineSupport();
    }
    
    setupHapticPatterns() {
        this.hapticPatterns = {
            light: { duration: 50, intensity: 0.3 },
            medium: { duration: 100, intensity: 0.6 },
            heavy: { duration: 150, intensity: 1.0 },
            selection: { duration: 25, intensity: 0.4 },
            success: { duration: 200, pattern: [100, 50, 100] },
            error: { duration: 300, pattern: [150, 100, 150] },
            warning: { duration: 250, pattern: [50, 50, 50, 50, 50] },
            impact: { duration: 80, intensity: 0.8 },
            gentle: { duration: 75, intensity: 0.2 },
            musical: { duration: 120, pattern: [30, 20, 30, 20, 40] },
            sharp: { duration: 30, intensity: 0.9 },
            buzz: { duration: 200, pattern: [25, 25, 25, 25, 25, 25] },
            pulse: { duration: 500, pattern: [100, 100, 100, 100, 100] },
            rapid: { duration: 150, pattern: [20, 10, 20, 10, 20, 10] },
            tick: { duration: 15, intensity: 0.3 },
            rhythm: { duration: 400, pattern: [60, 40, 80, 40, 60] }
        };
    }
    
    setupTouchGestures() {
        this.touchGestures = {
            tap: { maxDuration: 200, maxMovement: 10 },
            'long-press': { minDuration: 500, maxMovement: 10 },
            'double-tap': { maxInterval: 300, maxMovement: 20 },
            'swipe-left': { minDistance: 50, direction: 'left', maxTime: 300 },
            'swipe-right': { minDistance: 50, direction: 'right', maxTime: 300 },
            'swipe-up': { minDistance: 50, direction: 'up', maxTime: 300 },
            'swipe-down': { minDistance: 50, direction: 'down', maxTime: 300 },
            'swipe-fast': { minDistance: 100, maxTime: 150 },
            'drag': { minDistance: 20, continuous: true },
            'pinch': { minScale: 0.5, maxScale: 2.0 },
            'rotate': { minAngle: 15 },
            'multi-touch': { minFingers: 2, maxFingers: 5 },
            'tap-rapid': { maxInterval: 100, minCount: 3 },
            'tap-sequence': { maxInterval: 500, ordered: true },
            'hold-timing': { variableHold: true, precisionRequired: true },
            'release-precise': { timingCritical: true },
            'draw-smooth': { smoothness: 'high', continuous: true },
            'erase-gesture': { zigzag: true, rapid: true },
            'undo-shake': { accelerometer: true, shakeIntensity: 'medium' },
            'swipe-combo': { multiDirection: true, rapid: true },
            'multi-finger': { simultaneousTaps: true, coordination: 'high' }
        };
    }
    
    setupPWAFeatures() {
        this.pwaConfig = {
            serviceWorker: '/sw-color-games.js',
            manifest: '/manifest-color-games.json',
            cacheStrategy: {
                gameAssets: 'cache-first',
                gameData: 'network-first',
                scores: 'network-only'
            },
            offlinePages: [
                '/games/pattern-pursuit/offline',
                '/games/memory-spectrum/offline',
                '/games/harmony-builder/offline'
            ]
        };
    }
    
    setupOfflineSupport() {
        this.offlineFeatures = {
            playableGames: ['pattern_pursuit', 'memory_spectrum', 'harmony_builder'],
            localStorage: {
                progress: true,
                scores: true,
                achievements: true,
                settings: true
            },
            syncOnReconnect: {
                progress: true,
                achievements: true,
                leaderboard: false // Only sync when explicitly requested
            }
        };
    }
    
    setupEventListeners() {
        // Listen for game events
        this.on('game-started', this.handleGameStart.bind(this));
        this.on('game-completed', this.handleGameCompletion.bind(this));
        this.on('game-paused', this.handleGamePause.bind(this));
        this.on('achievement-unlocked', this.handleAchievement.bind(this));
        
        // Listen for mobile-specific events
        this.on('orientation-change', this.handleOrientationChange.bind(this));
        this.on('haptic-feedback', this.triggerHapticFeedback.bind(this));
        this.on('gesture-detected', this.handleGesture.bind(this));
    }
    
    async registerWithProgressionSystem() {
        try {
            // Register games with the progression engine
            for (const [gameId, game] of Object.entries(this.mobileGames)) {
                this.emit('register-mobile-game', {
                    gameId,
                    game,
                    mobileOptimized: true
                });
            }
            
            console.log('   Registered with progression system');
        } catch (error) {
            console.error('   Failed to register with progression system:', error);
        }
    }
    
    // Core game interface methods
    async startGame(userId, gameId, options = {}) {
        const game = this.mobileGames[gameId];
        if (!game) {
            throw new Error(`Game not found: ${gameId}`);
        }
        
        console.log(`🎮 Starting mobile game: ${game.name} for user ${userId}`);
        
        // Create game session
        const sessionId = `${userId}-${gameId}-${Date.now()}`;
        const session = {
            id: sessionId,
            userId,
            gameId,
            game,
            startTime: new Date().toISOString(),
            status: 'active',
            score: 0,
            progress: 0,
            lives: 3,
            level: 1,
            touches: 0,
            gestures: [],
            hapticEvents: [],
            mobileFeatures: {
                orientation: options.orientation || game.mobileFeatures.orientation,
                hapticEnabled: options.hapticEnabled !== false,
                accelerometerEnabled: game.mobileFeatures.accelerometer && options.accelerometer !== false
            }
        };
        
        this.activeSessions.set(sessionId, session);
        
        // Set up device features for this game
        await this.configureDeviceFeatures(session);
        
        // Emit game start event
        this.emit('game-started', {
            sessionId,
            userId,
            gameId,
            game,
            mobileOptimized: true
        });
        
        return {
            sessionId,
            gameConfig: this.generateMobileGameConfig(game),
            controls: this.generateControlsConfig(game),
            ui: this.generateMobileUI(game)
        };
    }
    
    async configureDeviceFeatures(session) {
        const { game, mobileFeatures } = session;
        
        // Configure screen orientation
        if (game.mobileFeatures.orientation !== 'any') {
            session.requiredOrientation = game.mobileFeatures.orientation;
        }
        
        // Set up haptic feedback
        if (mobileFeatures.hapticEnabled) {
            session.hapticPatterns = this.getGameHapticPatterns(game);
        }
        
        // Configure accelerometer/gyroscope
        if (game.mobileFeatures.accelerometer && mobileFeatures.accelerometerEnabled) {
            session.accelerometerConfig = {
                sensitivity: 'medium',
                updateInterval: 100
            };
        }
        
        console.log(`   Configured device features for ${game.name}`);
    }
    
    getGameHapticPatterns(game) {
        const patterns = {};
        
        for (const [event, patternName] of Object.entries(game.haptics)) {
            if (this.hapticPatterns[patternName]) {
                patterns[event] = this.hapticPatterns[patternName];
            }
        }
        
        return patterns;
    }
    
    generateMobileGameConfig(game) {
        return {
            id: game.id,
            name: game.name,
            description: game.description,
            category: game.category,
            difficulty: game.difficulty,
            estimatedTime: game.estimatedTime,
            mobileOptimized: true,
            touchControls: game.controls,
            gestures: game.controls.gestures,
            haptics: game.haptics,
            orientation: game.mobileFeatures.orientation,
            pwa: {
                installable: true,
                offline: this.offlineFeatures.playableGames.includes(game.id)
            }
        };
    }
    
    generateControlsConfig(game) {
        const controls = {
            primary: game.controls.primary,
            secondary: game.controls.secondary,
            gestures: {}
        };
        
        // Map gestures to their configurations
        for (const gesture of game.controls.gestures) {
            if (this.touchGestures[gesture]) {
                controls.gestures[gesture] = this.touchGestures[gesture];
            }
        }
        
        return controls;
    }
    
    generateMobileUI(game) {
        return {
            layout: 'mobile-game',
            header: {
                ...this.mobileUI.gameHeader,
                title: game.name,
                backButton: true,
                progressBar: true
            },
            gameArea: {
                ...this.mobileUI.gameArea,
                touchZones: this.generateTouchZones(game),
                feedbackArea: {
                    haptic: game.haptics,
                    visual: true,
                    audio: true
                }
            },
            footer: {
                ...this.mobileUI.gameFooter,
                controlsHint: this.generateControlsHint(game),
                gameSpecific: true
            },
            safeArea: {
                top: true,
                bottom: true,
                left: game.mobileFeatures.orientation === 'landscape',
                right: game.mobileFeatures.orientation === 'landscape'
            }
        };
    }
    
    generateTouchZones(game) {
        const zones = [];
        
        switch (game.controls.primary) {
            case 'tap':
                zones.push({
                    id: 'tap-zone',
                    type: 'full-screen',
                    gestures: ['tap', 'double-tap']
                });
                break;
                
            case 'swipe':
                zones.push({
                    id: 'swipe-zone',
                    type: 'full-screen',
                    gestures: ['swipe-left', 'swipe-right', 'swipe-up', 'swipe-down']
                });
                break;
                
            case 'drag':
                zones.push({
                    id: 'drag-zone',
                    type: 'interactive-area',
                    gestures: ['drag', 'pinch', 'rotate']
                });
                break;
                
            case 'multi-touch':
                zones.push({
                    id: 'multi-touch-zone',
                    type: 'full-screen',
                    gestures: ['multi-touch', 'rapid-tap', 'swipe-combo']
                });
                break;
                
            case 'draw':
                zones.push({
                    id: 'canvas-zone',
                    type: 'drawing-area',
                    gestures: ['draw-smooth', 'erase-gesture', 'undo-shake']
                });
                break;
        }
        
        return zones;
    }
    
    generateControlsHint(game) {
        const hints = {
            'pattern_pursuit': 'Swipe left or right to match patterns',
            'emotion_explorer': 'Drag colors to emotions, pinch to zoom',
            'color_clash': 'Use multiple fingers for combos!',
            'memory_spectrum': 'Tap the sequence in order',
            'harmony_builder': 'Draw smooth lines, shake to undo',
            'speed_spectrum': 'Tap as fast as you can!'
        };
        
        return hints[game.id] || 'Follow the on-screen instructions';
    }
    
    // Game event handlers
    async handleGameStart(data) {
        const { sessionId, userId, gameId } = data;
        
        // Track session stats
        this.sessionStats.set(sessionId, {
            startTime: Date.now(),
            touches: 0,
            gestures: 0,
            hapticEvents: 0,
            achievements: []
        });
        
        // Notify progression system
        this.emit('mobile-game-started', {
            sessionId,
            userId,
            gameId,
            timestamp: new Date().toISOString()
        });
        
        console.log(`🎮 Mobile game session started: ${sessionId}`);
    }
    
    async handleGameCompletion(data) {
        const { sessionId, userId, gameId, results } = data;
        const session = this.activeSessions.get(sessionId);
        const stats = this.sessionStats.get(sessionId);
        
        if (!session) return;
        
        // Calculate final results
        const finalResults = {
            ...results,
            sessionDuration: Date.now() - stats.startTime,
            totalTouches: stats.touches,
            totalGestures: stats.gestures,
            hapticEvents: stats.hapticEvents,
            mobileOptimized: true,
            deviceFeatures: {
                orientation: session.mobileFeatures.orientation,
                hapticUsed: session.mobileFeatures.hapticEnabled,
                accelerometerUsed: session.mobileFeatures.accelerometerEnabled
            }
        };
        
        // Clean up session
        this.activeSessions.delete(sessionId);
        this.sessionStats.delete(sessionId);
        
        // Emit completion event for progression system
        this.emit('mobile-game-completed', {
            sessionId,
            userId,
            gameId,
            results: finalResults,
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Mobile game completed: ${gameId} by ${userId}`);
        console.log(`   Score: ${finalResults.score}, Duration: ${Math.round(finalResults.sessionDuration / 1000)}s`);
    }
    
    async handleGesture(data) {
        const { sessionId, gesture, details } = data;
        const session = this.activeSessions.get(sessionId);
        const stats = this.sessionStats.get(sessionId);
        
        if (!session || !stats) return;
        
        // Track gesture
        stats.gestures++;
        session.gestures.push({
            type: gesture,
            timestamp: Date.now(),
            details
        });
        
        // Trigger haptic feedback if configured
        const game = session.game;
        if (game.haptics && session.mobileFeatures.hapticEnabled) {
            await this.triggerHapticForGesture(sessionId, gesture, details);
        }
    }
    
    async triggerHapticForGesture(sessionId, gesture, details) {
        // Map gestures to haptic events
        const gestureHapticMap = {
            'tap': 'selection',
            'swipe': 'progress',
            'drag': 'progress',
            'pinch': 'selection',
            'success': 'success',
            'error': 'error',
            'combo': 'impact'
        };
        
        const hapticType = gestureHapticMap[gesture] || gestureHapticMap[details.result] || 'light';
        
        this.emit('haptic-feedback', {
            sessionId,
            type: hapticType,
            gesture,
            details
        });
    }
    
    async triggerHapticFeedback(data) {
        const { sessionId, type, gesture, details } = data;
        const session = this.activeSessions.get(sessionId);
        const stats = this.sessionStats.get(sessionId);
        
        if (!session || !stats || !session.mobileFeatures.hapticEnabled) return;
        
        // Track haptic event
        stats.hapticEvents++;
        session.hapticEvents.push({
            type,
            gesture,
            timestamp: Date.now(),
            details
        });
        
        // Get haptic pattern
        const pattern = session.hapticPatterns?.[type] || this.hapticPatterns[type];
        
        if (pattern) {
            // In a real implementation, this would trigger device haptic feedback
            console.log(`📳 Haptic feedback: ${type} for ${gesture} (${sessionId})`);
        }
    }
    
    async handleOrientationChange(data) {
        const { sessionId, newOrientation } = data;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) return;
        
        const game = session.game;
        
        // Check if orientation change is allowed for this game
        if (game.mobileFeatures.orientation !== 'any' && 
            game.mobileFeatures.orientation !== newOrientation) {
            
            // Notify user to rotate device
            this.emit('orientation-prompt', {
                sessionId,
                required: game.mobileFeatures.orientation,
                current: newOrientation
            });
        } else {
            // Update UI layout for new orientation
            session.currentOrientation = newOrientation;
            
            this.emit('ui-layout-update', {
                sessionId,
                orientation: newOrientation,
                layout: this.generateMobileUI(game)
            });
        }
    }
    
    // API methods for mobile app integration
    getMobileGamesList() {
        return Object.values(this.mobileGames).map(game => ({
            id: game.id,
            name: game.name,
            description: game.description,
            category: game.category,
            difficulty: game.difficulty,
            estimatedTime: game.estimatedTime,
            emoji: this.getCategoryEmoji(game.category),
            mobileOptimized: true,
            offline: this.offlineFeatures.playableGames.includes(game.id)
        }));
    }
    
    getCategoryEmoji(category) {
        const categoryEmojis = {
            'pattern-recognition': '🌈',
            'emotional-intelligence': '💙',
            'strategic-thinking': '⚡',
            'memory-training': '🧠',
            'creative-expression': '🎵',
            'reaction-time': '⚡'
        };
        
        return categoryEmojis[category] || '🎮';
    }
    
    getGameProgress(userId, gameId) {
        // This would typically fetch from database
        return {
            userId,
            gameId,
            bestScore: 0,
            gamesPlayed: 0,
            averageScore: 0,
            achievements: [],
            lastPlayed: null,
            skillLevel: 'Beginner'
        };
    }
    
    getMobileCapabilities() {
        return {
            touchGestures: Object.keys(this.touchGestures),
            hapticPatterns: Object.keys(this.hapticPatterns),
            orientations: ['portrait', 'landscape', 'any'],
            deviceFeatures: ['accelerometer', 'gyroscope', 'vibration'],
            pwaFeatures: Object.keys(this.pwaFeatures),
            offlineGames: this.offlineFeatures.playableGames
        };
    }
    
    generateProgressionReport() {
        const report = {
            totalGames: Object.keys(this.mobileGames).length,
            activeSessions: this.activeSessions.size,
            categories: {},
            difficulties: {},
            mobileFeatures: {
                touchOptimized: true,
                hapticFeedback: true,
                offlineSupport: true,
                progressiveWebApp: true
            }
        };
        
        // Categorize games
        for (const game of Object.values(this.mobileGames)) {
            report.categories[game.category] = (report.categories[game.category] || 0) + 1;
            report.difficulties[game.difficulty] = (report.difficulties[game.difficulty] || 0) + 1;
        }
        
        return report;
    }
}

// Export for use as module
module.exports = MobileColorGamesInterface;

// CLI interface
if (require.main === module) {
    const mobileGames = new MobileColorGamesInterface();
    
    console.log('📱 MOBILE COLOR GAMES INTERFACE');
    console.log('===============================\n');
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function run() {
        await mobileGames.initialize();
        
        switch (command) {
            case 'games':
                console.log('🎮 Available Mobile Games:\n');
                const gamesList = mobileGames.getMobileGamesList();
                
                gamesList.forEach((game, index) => {
                    console.log(`${index + 1}. ${game.emoji} ${game.name}`);
                    console.log(`   ${game.description}`);
                    console.log(`   Category: ${game.category} | Difficulty: ${game.difficulty}`);
                    console.log(`   Time: ${game.estimatedTime} | Offline: ${game.offline ? 'Yes' : 'No'}`);
                    console.log();
                });
                break;
                
            case 'capabilities':
                console.log('📱 Mobile Capabilities:\n');
                const caps = mobileGames.getMobileCapabilities();
                
                console.log('Touch Gestures:');
                caps.touchGestures.forEach(gesture => console.log(`  • ${gesture}`));
                
                console.log('\nHaptic Patterns:');
                caps.hapticPatterns.forEach(pattern => console.log(`  • ${pattern}`));
                
                console.log('\nDevice Features:');
                caps.deviceFeatures.forEach(feature => console.log(`  • ${feature}`));
                break;
                
            case 'start':
                if (args.length >= 2) {
                    const userId = args[0];
                    const gameId = args[1];
                    
                    try {
                        const result = await mobileGames.startGame(userId, gameId, {
                            hapticEnabled: true,
                            accelerometer: true
                        });
                        
                        console.log(`🎮 Started ${gameId} for ${userId}`);
                        console.log(`Session ID: ${result.sessionId}`);
                        console.log('\nGame Config:');
                        console.log(JSON.stringify(result.gameConfig, null, 2));
                        
                    } catch (error) {
                        console.error('Error:', error.message);
                    }
                } else {
                    console.log('Usage: node mobile-color-games-interface.js start <user> <game-id>');
                }
                break;
                
            case 'report':
                console.log('📊 Progression Report:\n');
                const report = mobileGames.generateProgressionReport();
                
                console.log(`Total Games: ${report.totalGames}`);
                console.log(`Active Sessions: ${report.activeSessions}`);
                console.log();
                
                console.log('Games by Category:');
                Object.entries(report.categories).forEach(([cat, count]) => {
                    console.log(`  ${cat}: ${count}`);
                });
                
                console.log('\nGames by Difficulty:');
                Object.entries(report.difficulties).forEach(([diff, count]) => {
                    console.log(`  ${diff}: ${count}`);
                });
                break;
                
            default:
                console.log('Available commands:');
                console.log('  games         - List all mobile games');
                console.log('  capabilities  - Show mobile capabilities');
                console.log('  start <user> <game> - Start a game session');
                console.log('  report        - Show progression report');
                console.log();
                console.log('Example: node mobile-color-games-interface.js games');
        }
    }
    
    run().catch(console.error);
}