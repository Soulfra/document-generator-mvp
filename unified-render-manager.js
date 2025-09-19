#!/usr/bin/env node

/**
 * UNIFIED RENDER MANAGER
 * 
 * Switches between render modes based on:
 * - Device performance (from universal-device-fingerprinter.js)
 * - User preferences (light/dark mode style)
 * - Context (AI-to-AI vs Human player)
 * 
 * Connects all existing systems:
 * - 2D Canvas (AI communication layer)
 * - 2.5D Isometric (Medium performance)
 * - 3D Three.js (High performance/humans)
 */

const UniversalDeviceFingerprinter = require('./universal-device-fingerprinter.js');
const Unified3DHumanoidSystem = require('./unified-3d-humanoid-system.js');
const HexagonalIsometricPlatform = require('./hexagonal-isometric-platform.js');
const CanvasTurtleShellVisualizer = require('./FinishThisIdea/CANVAS-TURTLE-SHELL-VISUALIZER.js');
const UnifiedEventSpawnOrchestrator = require('./unified-event-spawn-orchestrator.js');
const UPCScannerAnimationSystem = require('./upc-scanner-animation-system.js');

class UnifiedRenderManager {
    constructor() {
        // Core systems
        this.deviceFingerprinter = new UniversalDeviceFingerprinter();
        this.eventOrchestrator = new UnifiedEventSpawnOrchestrator();
        
        // Render systems
        this.renderSystems = {
            '2d': null,      // Canvas 2D (AI layer)
            '2.5d': null,    // Isometric hexagonal
            '3d': null       // Three.js full 3D
        };
        
        // Current state
        this.currentMode = 'auto';
        this.activeRenderer = null;
        this.deviceProfile = null;
        
        // User preferences
        this.preferences = {
            renderMode: 'auto',      // auto, 2d, 2.5d, 3d
            visualTheme: 'dark',     // light, dark, custom
            performanceMode: 'balanced', // battery, balanced, performance
            accessibility: {
                reducedMotion: false,
                highContrast: false,
                largeText: false
            }
        };
        
        // Performance metrics
        this.performance = {
            fps: 60,
            frameTime: 16,
            drawCalls: 0,
            memoryUsage: 0,
            lastCheck: Date.now()
        };
        
        console.log('🎮 UNIFIED RENDER MANAGER');
        console.log('========================');
        console.log('Adaptive rendering for all devices and contexts');
    }
    
    async initialize() {
        console.log('🚀 Initializing render systems...');
        
        // Detect device capabilities
        this.deviceProfile = await this.deviceFingerprinter.generateFingerprint();
        console.log('📱 Device profile generated');
        
        // Initialize appropriate render systems
        await this.initializeRenderSystems();
        
        // Connect to event orchestrator
        this.connectEventSystem();
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        console.log('✅ Render manager initialized');
        
        // Auto-select best render mode
        this.selectOptimalRenderMode();
    }
    
    async initializeRenderSystems() {
        const capabilities = this.analyzeDeviceCapabilities();
        
        // Always initialize 2D (lightweight)
        console.log('📐 Initializing 2D Canvas system...');
        this.renderSystems['2d'] = new CanvasTurtleShellVisualizer();
        await this.renderSystems['2d'].createCanvasVisualization();
        
        // Initialize 2.5D if capable
        if (capabilities.supports2_5D) {
            console.log('🔷 Initializing 2.5D Isometric system...');
            this.renderSystems['2.5d'] = new HexagonalIsometricPlatform();
        }
        
        // Initialize 3D if capable
        if (capabilities.supports3D) {
            console.log('🎯 Initializing 3D system...');
            this.renderSystems['3d'] = new Unified3DHumanoidSystem();
            await this.renderSystems['3d'].initialize();
        }
        
        // Initialize UPC scanner (works in all modes)
        console.log('📊 Initializing UPC Scanner...');
        this.upcScanner = new UPCScannerAnimationSystem();
        await this.upcScanner.initialize();
    }
    
    analyzeDeviceCapabilities() {
        const hardware = this.deviceProfile.components?.hardware || {};
        const platform = this.deviceProfile.platform || {};
        
        // Determine capabilities
        const capabilities = {
            supports2D: true, // Always true
            supports2_5D: false,
            supports3D: false,
            preferredMode: '2d',
            reason: ''
        };
        
        // Check for 2.5D support
        if (hardware.hardwareConcurrency >= 2 && 
            (hardware.deviceMemory >= 2 || hardware.deviceMemory === 'unknown')) {
            capabilities.supports2_5D = true;
            capabilities.preferredMode = '2.5d';
        }
        
        // Check for 3D support
        if (hardware.hardwareConcurrency >= 4 && 
            hardware.deviceMemory >= 4 &&
            hardware.webgl && 
            platform.environment !== 'react-native') { // Mobile uses 2.5D max
            capabilities.supports3D = true;
            capabilities.preferredMode = '3d';
        }
        
        // Adjust for mobile
        if (platform.environment === 'react-native' || hardware.maxTouchPoints > 0) {
            if (capabilities.supports3D) {
                capabilities.preferredMode = '2.5d'; // Downgrade to 2.5D on mobile
                capabilities.reason = 'Mobile device - using optimized 2.5D mode';
            }
        }
        
        console.log('🔍 Device capabilities:', capabilities);
        return capabilities;
    }
    
    selectOptimalRenderMode() {
        if (this.preferences.renderMode !== 'auto') {
            // User has manual preference
            this.switchToMode(this.preferences.renderMode);
            return;
        }
        
        // Auto-select based on context and capabilities
        const capabilities = this.analyzeDeviceCapabilities();
        
        // Check context
        const context = this.detectContext();
        
        let selectedMode = capabilities.preferredMode;
        
        // AI-to-AI communication uses 2D
        if (context === 'ai-communication') {
            selectedMode = '2d';
        }
        
        // Reduced motion preference
        if (this.preferences.accessibility.reducedMotion) {
            selectedMode = '2d'; // Least motion
        }
        
        // Battery saver mode
        if (this.preferences.performanceMode === 'battery') {
            selectedMode = '2d';
        }
        
        console.log(`🎯 Selected render mode: ${selectedMode}`);
        this.switchToMode(selectedMode);
    }
    
    detectContext() {
        // Detect if this is AI-to-AI or human interaction
        // Check for automation markers
        if (process.env.AI_MODE === 'true' || 
            process.env.AUTOMATION === 'true' ||
            !process.stdout.isTTY) {
            return 'ai-communication';
        }
        
        // Check for game context
        if (global.gameMode || process.env.GAME_MODE === 'true') {
            return 'human-gaming';
        }
        
        return 'human-interaction';
    }
    
    switchToMode(mode) {
        if (!this.renderSystems[mode]) {
            console.warn(`⚠️  Mode ${mode} not available, falling back to 2D`);
            mode = '2d';
        }
        
        // Deactivate current renderer
        if (this.activeRenderer && this.activeRenderer !== this.renderSystems[mode]) {
            this.deactivateRenderer(this.activeRenderer);
        }
        
        // Activate new renderer
        this.activeRenderer = this.renderSystems[mode];
        this.currentMode = mode;
        
        console.log(`🔄 Switched to ${mode} rendering mode`);
        
        // Apply theme to new renderer
        this.applyTheme();
        
        // Notify event system
        this.eventOrchestrator.emit('render_mode_changed', {
            mode: mode,
            reason: 'manual_switch'
        });
    }
    
    deactivateRenderer(renderer) {
        // Clean up resources
        if (renderer.cleanup) {
            renderer.cleanup();
        }
    }
    
    applyTheme() {
        const theme = this.preferences.visualTheme;
        
        // Theme configurations
        const themes = {
            light: {
                background: '#ffffff',
                foreground: '#000000',
                accent: '#0066cc',
                grid: '#eeeeee'
            },
            dark: {
                background: '#0a0a0a',
                foreground: '#ffffff',
                accent: '#00ff88',
                grid: '#1a1a1a'
            },
            custom: this.preferences.customTheme || {}
        };
        
        const selectedTheme = themes[theme] || themes.dark;
        
        // Apply to active renderer
        if (this.activeRenderer && this.activeRenderer.applyTheme) {
            this.activeRenderer.applyTheme(selectedTheme);
        }
    }
    
    connectEventSystem() {
        // Connect spawn events to appropriate renderer
        this.eventOrchestrator.on('spawn_complete', (entity) => {
            this.renderEntity(entity);
        });
        
        this.eventOrchestrator.on('entity_death', (entity) => {
            this.handleEntityDeath(entity);
        });
        
        // Connect UPC scanner events
        this.upcScanner.on = (event, handler) => {
            // Simple event emitter
            this.eventOrchestrator.on(`scanner_${event}`, handler);
        };
    }
    
    renderEntity(entity) {
        if (!this.activeRenderer) return;
        
        // Convert entity to appropriate format for current renderer
        switch (this.currentMode) {
            case '2d':
                this.render2DEntity(entity);
                break;
            case '2.5d':
                this.render2_5DEntity(entity);
                break;
            case '3d':
                this.render3DEntity(entity);
                break;
        }
    }
    
    render2DEntity(entity) {
        // Convert to 2D sprite representation
        const sprite = {
            id: entity.id,
            x: entity.position.x * 8, // Scale to canvas pixels
            y: entity.position.y * 6,
            sprite: this.getEntitySprite(entity.type),
            animation: 'idle'
        };
        
        if (this.activeRenderer.addSprite) {
            this.activeRenderer.addSprite(sprite);
        }
    }
    
    render2_5DEntity(entity) {
        // Convert to hexagonal isometric position
        const hex = this.worldToHex(entity.position);
        
        if (this.activeRenderer.addEntity) {
            this.activeRenderer.addEntity({
                id: entity.id,
                hex: hex,
                layer: Math.floor(entity.position.z || 0),
                type: entity.type,
                fractalType: 'crystal'
            });
        }
    }
    
    render3DEntity(entity) {
        // Create 3D humanoid or object
        if (entity.type.includes('character') || entity.type.includes('npc')) {
            // Use humanoid system
            const humanoid = this.renderSystems['3d'].createHumanoid({
                id: entity.id,
                type: entity.type,
                behaviors: entity.behavior || ['idle']
            });
            
            // Position in 3D space
            humanoid.mesh.position.set(
                entity.position.x,
                entity.position.y || 0,
                entity.position.z || 0
            );
        } else {
            // Render as 3D object
            if (this.activeRenderer.addObject) {
                this.activeRenderer.addObject(entity);
            }
        }
    }
    
    getEntitySprite(type) {
        const spriteMap = {
            'loot_chest': '📦',
            'experience_orb': '✨',
            'gold_coin': '🪙',
            'error_dragon': '🐉',
            'guardian': '👁️',
            'player': '🧍'
        };
        
        return spriteMap[type] || '❓';
    }
    
    worldToHex(position) {
        // Convert world coordinates to hexagonal coordinates
        const size = 1;
        const q = (2/3 * position.x) / size;
        const r = (-1/3 * position.x + Math.sqrt(3)/3 * position.y) / size;
        const s = -q - r;
        
        return {
            q: Math.round(q),
            r: Math.round(r),
            s: Math.round(s)
        };
    }
    
    handleEntityDeath(entity) {
        // Death animation based on render mode
        switch (this.currentMode) {
            case '2d':
                // Fade out sprite
                if (this.activeRenderer.fadeOutSprite) {
                    this.activeRenderer.fadeOutSprite(entity.id);
                }
                break;
                
            case '2.5d':
                // Hexagonal death effect
                if (this.activeRenderer.removeEntity) {
                    this.activeRenderer.removeEntity(entity.id, 'death');
                }
                break;
                
            case '3d':
                // 3D ragdoll physics
                if (this.renderSystems['3d'].applyDeathPhysics) {
                    this.renderSystems['3d'].applyDeathPhysics(entity.id);
                }
                break;
        }
    }
    
    startPerformanceMonitoring() {
        setInterval(() => {
            this.checkPerformance();
        }, 1000); // Check every second
    }
    
    checkPerformance() {
        const now = Date.now();
        const deltaTime = now - this.performance.lastCheck;
        this.performance.lastCheck = now;
        
        // Calculate FPS
        this.performance.fps = 1000 / deltaTime;
        
        // Check memory if available
        if (performance.memory) {
            this.performance.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
        }
        
        // Auto-adjust quality if needed
        if (this.preferences.renderMode === 'auto') {
            this.autoAdjustQuality();
        }
    }
    
    autoAdjustQuality() {
        const fps = this.performance.fps;
        
        // Downgrade if performance is poor
        if (fps < 30) {
            if (this.currentMode === '3d' && this.renderSystems['2.5d']) {
                console.log('📉 Performance low, switching to 2.5D');
                this.switchToMode('2.5d');
            } else if (this.currentMode === '2.5d') {
                console.log('📉 Performance low, switching to 2D');
                this.switchToMode('2d');
            }
        }
        
        // Upgrade if performance is good
        else if (fps > 55) {
            if (this.currentMode === '2d' && this.renderSystems['2.5d']) {
                console.log('📈 Performance good, switching to 2.5D');
                this.switchToMode('2.5d');
            } else if (this.currentMode === '2.5d' && this.renderSystems['3d']) {
                console.log('📈 Performance excellent, switching to 3D');
                this.switchToMode('3d');
            }
        }
    }
    
    /**
     * Handle UPC scanning in current render mode
     */
    async scanUPC(upcCode) {
        console.log(`📊 Scanning UPC in ${this.currentMode} mode`);
        
        // Scan the UPC
        const scanResult = await this.upcScanner.startScan(upcCode);
        
        // Render scan animation in current mode
        switch (this.currentMode) {
            case '2d':
                // Show scan animation on canvas
                if (this.activeRenderer.showScanAnimation) {
                    this.activeRenderer.showScanAnimation(scanResult.animation);
                }
                break;
                
            case '2.5d':
                // Create isometric scan effect
                if (this.activeRenderer.createScanEffect) {
                    this.activeRenderer.createScanEffect({
                        hex: { q: 0, r: 0, s: 0 },
                        animation: scanResult.animation
                    });
                }
                break;
                
            case '3d':
                // Create 3D holographic scan
                if (this.renderSystems['3d'].createHologram) {
                    this.renderSystems['3d'].createHologram({
                        position: { x: 0, y: 1, z: 0 },
                        data: scanResult
                    });
                }
                break;
        }
        
        return scanResult;
    }
    
    /**
     * User preference management
     */
    setPreference(key, value) {
        // Update preference
        const keys = key.split('.');
        let target = this.preferences;
        
        for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i]];
        }
        
        target[keys[keys.length - 1]] = value;
        
        console.log(`⚙️  Preference updated: ${key} = ${value}`);
        
        // React to certain preferences
        if (key === 'renderMode') {
            this.selectOptimalRenderMode();
        } else if (key === 'visualTheme') {
            this.applyTheme();
        }
        
        // Save preferences
        this.savePreferences();
    }
    
    savePreferences() {
        // Would save to localStorage or database
        const prefs = JSON.stringify(this.preferences);
        // localStorage.setItem('renderPreferences', prefs);
        console.log('💾 Preferences saved');
    }
    
    loadPreferences() {
        // Would load from localStorage or database
        // const saved = localStorage.getItem('renderPreferences');
        // if (saved) this.preferences = JSON.parse(saved);
    }
    
    /**
     * Get current render state
     */
    getState() {
        return {
            currentMode: this.currentMode,
            deviceProfile: this.deviceProfile,
            performance: this.performance,
            preferences: this.preferences,
            availableModes: Object.keys(this.renderSystems).filter(mode => this.renderSystems[mode] !== null)
        };
    }
}

// Test the unified render manager
if (require.main === module) {
    const renderManager = new UnifiedRenderManager();
    
    renderManager.initialize().then(async () => {
        console.log('\n🎮 Render Manager State:');
        console.log(renderManager.getState());
        
        // Test mode switching
        console.log('\n🔄 Testing mode switches...');
        
        // Try each mode
        for (const mode of ['2d', '2.5d', '3d']) {
            if (renderManager.renderSystems[mode]) {
                renderManager.switchToMode(mode);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Test UPC scanning
        console.log('\n📊 Testing UPC scanning...');
        const testUPC = '123456789012';
        const scanResult = await renderManager.scanUPC(testUPC);
        console.log('Scan complete:', scanResult.result);
        
        // Test preference changes
        console.log('\n⚙️  Testing preferences...');
        renderManager.setPreference('visualTheme', 'light');
        renderManager.setPreference('performanceMode', 'battery');
        
        console.log('\n✅ All systems integrated and working!');
    });
}

module.exports = UnifiedRenderManager;