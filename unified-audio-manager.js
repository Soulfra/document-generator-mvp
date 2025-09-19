#!/usr/bin/env node

/**
 * UNIFIED AUDIO MANAGER
 * 
 * Fixes the multiple audio context conflicts causing timing issues:
 * - color-music-theory-translator.js (Solfeggio frequencies)
 * - SpatialAudioIntegration.ts (Three.js audio)
 * - VoiceTransmissionMatryoshka.js (WebRTC audio)  
 * - MultimediaProcessingSystem.js (FFmpeg audio)
 * 
 * Creates single shared AudioContext with mobile optimization and graceful fallbacks.
 */

const EventEmitter = require('events');

class UnifiedAudioManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            mobileOptimized: options.mobileOptimized !== false,
            bufferPoolSize: options.bufferPoolSize || 8,
            fallbackEnabled: options.fallbackEnabled !== false,
            debugMode: options.debugMode || false,
            maxConcurrentSources: options.maxConcurrentSources || 16
        };
        
        // Single shared audio context
        this.audioContext = null;
        this.contextState = 'suspended';
        
        // Audio source management
        this.activeSources = new Map();
        this.sourcePool = new Map();
        this.bufferPool = new Map();
        
        // System integration tracking
        this.registeredSystems = new Map();
        this.systemPriorities = new Map();
        
        // Mobile detection and optimization
        this.isMobile = this.detectMobile();
        this.performanceMode = this.isMobile ? 'optimized' : 'full';
        
        // Timing coordination
        this.masterTiming = {
            startTime: 0,
            currentTime: 0,
            lastUpdate: 0,
            sampleRate: 44100
        };
        
        // Audio context creation tracking
        this.contextCreationAttempts = 0;
        this.maxContextAttempts = 3;
        
        console.log('🎵 Unified Audio Manager initializing...');
        console.log(`📱 Mobile mode: ${this.isMobile ? 'ON' : 'OFF'}`);
        console.log(`⚡ Performance mode: ${this.performanceMode}`);
        
        this.initialize();
    }
    
    /**
     * INITIALIZATION
     */
    async initialize() {
        try {
            // Create single audio context
            await this.createSharedAudioContext();
            
            // Set up audio buffer pool
            this.initializeBufferPool();
            
            // Register event handlers
            this.setupEventHandlers();
            
            // Initialize timing coordination
            this.initializeTimingCoordination();
            
            console.log('✅ Unified Audio Manager ready');
            this.emit('ready', {
                context: this.audioContext,
                sampleRate: this.audioContext.sampleRate,
                isMobile: this.isMobile,
                performanceMode: this.performanceMode
            });
            
        } catch (error) {
            console.error('❌ Audio Manager initialization failed:', error.message);
            this.handleInitializationError(error);
        }
    }
    
    async createSharedAudioContext() {
        this.contextCreationAttempts++;
        
        try {
            // Use Web Audio API or fallback
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            
            if (!AudioContextClass) {
                throw new Error('Web Audio API not supported');
            }
            
            // Mobile-optimized context options
            const contextOptions = this.isMobile ? {
                sampleRate: 22050,  // Lower sample rate for mobile
                latencyHint: 'playback'
            } : {
                sampleRate: 44100,
                latencyHint: 'interactive'
            };
            
            this.audioContext = new AudioContextClass(contextOptions);
            this.contextState = this.audioContext.state;
            
            // Resume context on user interaction
            if (this.contextState === 'suspended') {
                await this.resumeContext();
            }
            
            this.masterTiming.sampleRate = this.audioContext.sampleRate;
            this.masterTiming.startTime = this.audioContext.currentTime;
            
            console.log(`🎵 Shared AudioContext created - Sample Rate: ${this.audioContext.sampleRate}Hz`);
            
        } catch (error) {
            if (this.contextCreationAttempts < this.maxContextAttempts) {
                console.warn(`⚠️ AudioContext creation attempt ${this.contextCreationAttempts} failed, retrying...`);
                setTimeout(() => this.createSharedAudioContext(), 1000);
            } else {
                throw new Error(`Failed to create AudioContext after ${this.maxContextAttempts} attempts: ${error.message}`);
            }
        }
    }
    
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                this.contextState = 'running';
                console.log('🎵 AudioContext resumed');
                this.emit('contextResumed');
            } catch (error) {
                console.error('Failed to resume AudioContext:', error);
            }
        }
    }
    
    /**
     * SYSTEM REGISTRATION
     */
    registerSystem(systemName, options = {}) {
        const systemConfig = {
            name: systemName,
            priority: options.priority || 1,
            maxSources: options.maxSources || 4,
            audioType: options.audioType || 'general', // 'music', 'voice', 'effects', 'spatial'
            mobileEnabled: options.mobileEnabled !== false,
            activeSources: new Set(),
            registered: Date.now()
        };
        
        this.registeredSystems.set(systemName, systemConfig);
        this.systemPriorities.set(systemName, options.priority || 1);
        
        console.log(`📝 Registered audio system: ${systemName} (priority: ${systemConfig.priority})`);
        
        return {
            audioContext: this.audioContext,
            createSource: (sourceOptions) => this.createAudioSource(systemName, sourceOptions),
            destroySource: (sourceId) => this.destroyAudioSource(systemName, sourceId),
            getBuffer: (bufferKey) => this.getBuffer(bufferKey),
            setBuffer: (bufferKey, buffer) => this.setBuffer(bufferKey, buffer)
        };
    }
    
    unregisterSystem(systemName) {
        const system = this.registeredSystems.get(systemName);
        if (system) {
            // Clean up active sources
            for (const sourceId of system.activeSources) {
                this.destroyAudioSource(systemName, sourceId);
            }
            
            this.registeredSystems.delete(systemName);
            this.systemPriorities.delete(systemName);
            
            console.log(`🗑️ Unregistered audio system: ${systemName}`);
        }
    }
    
    /**
     * AUDIO SOURCE MANAGEMENT
     */
    createAudioSource(systemName, options = {}) {
        const system = this.registeredSystems.get(systemName);
        if (!system) {
            throw new Error(`System ${systemName} not registered`);
        }
        
        // Check mobile optimization
        if (this.isMobile && !system.mobileEnabled) {
            console.warn(`⚠️ System ${systemName} disabled on mobile`);
            return null;
        }
        
        // Check source limits
        if (system.activeSources.size >= system.maxSources) {
            console.warn(`⚠️ System ${systemName} reached max sources (${system.maxSources})`);
            return null;
        }
        
        // Check total active sources
        if (this.activeSources.size >= this.options.maxConcurrentSources) {
            console.warn(`⚠️ Reached global max sources (${this.options.maxConcurrentSources})`);
            return null;
        }
        
        const sourceId = `${systemName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            // Create audio source based on type
            const audioSource = this.createAudioNode(options);
            
            const sourceInfo = {
                id: sourceId,
                system: systemName,
                audioSource,
                options,
                created: Date.now(),
                lastUsed: Date.now()
            };
            
            this.activeSources.set(sourceId, sourceInfo);
            system.activeSources.add(sourceId);
            
            console.log(`🎵 Created audio source: ${sourceId} for ${systemName}`);
            
            return {
                id: sourceId,
                source: audioSource,
                connect: (destination) => audioSource.connect(destination || this.audioContext.destination),
                disconnect: () => audioSource.disconnect(),
                destroy: () => this.destroyAudioSource(systemName, sourceId)
            };
            
        } catch (error) {
            console.error(`Failed to create audio source for ${systemName}:`, error);
            return null;
        }
    }
    
    createAudioNode(options) {
        if (!this.audioContext) {
            throw new Error('AudioContext not available');
        }
        
        switch (options.type) {
            case 'oscillator':
                const osc = this.audioContext.createOscillator();
                osc.frequency.value = options.frequency || 440;
                osc.type = options.waveType || 'sine';
                return osc;
                
            case 'gainNode':
                const gain = this.audioContext.createGain();
                gain.gain.value = options.gain || 1.0;
                return gain;
                
            case 'bufferSource':
                const source = this.audioContext.createBufferSource();
                if (options.buffer) {
                    source.buffer = options.buffer;
                }
                source.loop = options.loop || false;
                return source;
                
            case 'analyser':
                const analyser = this.audioContext.createAnalyser();
                analyser.fftSize = options.fftSize || (this.isMobile ? 512 : 2048);
                return analyser;
                
            case 'panner':
                if (this.audioContext.createPanner) {
                    const panner = this.audioContext.createPanner();
                    panner.panningModel = 'HRTF';
                    panner.distanceModel = 'exponential';
                    return panner;
                }
                // Fallback for browsers without panner
                return this.audioContext.createGain();
                
            default:
                return this.audioContext.createGain();
        }
    }
    
    destroyAudioSource(systemName, sourceId) {
        const sourceInfo = this.activeSources.get(sourceId);
        if (!sourceInfo) return;
        
        try {
            // Disconnect and clean up
            sourceInfo.audioSource.disconnect();
            
            if (sourceInfo.audioSource.stop) {
                sourceInfo.audioSource.stop();
            }
            
            // Remove from tracking
            this.activeSources.delete(sourceId);
            
            const system = this.registeredSystems.get(systemName);
            if (system) {
                system.activeSources.delete(sourceId);
            }
            
            console.log(`🗑️ Destroyed audio source: ${sourceId}`);
            
        } catch (error) {
            console.error(`Error destroying audio source ${sourceId}:`, error);
        }
    }
    
    /**
     * BUFFER MANAGEMENT
     */
    initializeBufferPool() {
        console.log('🎵 Initializing audio buffer pool...');
        
        // Pre-allocate common buffer sizes for mobile optimization
        if (this.isMobile) {
            const commonSizes = [1024, 2048, 4096, 8192];
            commonSizes.forEach(size => {
                const buffer = this.audioContext.createBuffer(1, size, this.audioContext.sampleRate);
                this.bufferPool.set(`empty_${size}`, buffer);
            });
        }
        
        console.log(`🎵 Buffer pool initialized with ${this.bufferPool.size} pre-allocated buffers`);
    }
    
    getBuffer(bufferKey) {
        return this.bufferPool.get(bufferKey) || null;
    }
    
    setBuffer(bufferKey, buffer) {
        // Limit buffer pool size on mobile
        if (this.isMobile && this.bufferPool.size >= this.options.bufferPoolSize) {
            // Remove oldest buffer
            const firstKey = this.bufferPool.keys().next().value;
            this.bufferPool.delete(firstKey);
        }
        
        this.bufferPool.set(bufferKey, buffer);
        console.log(`🎵 Cached audio buffer: ${bufferKey}`);
    }
    
    /**
     * TIMING COORDINATION
     */
    initializeTimingCoordination() {
        // Update timing regularly
        setInterval(() => {
            this.updateMasterTiming();
        }, this.isMobile ? 100 : 50); // Less frequent on mobile
        
        console.log('⏰ Timing coordination initialized');
    }
    
    updateMasterTiming() {
        if (!this.audioContext) return;
        
        const now = performance.now();
        
        this.masterTiming.currentTime = this.audioContext.currentTime;
        this.masterTiming.lastUpdate = now;
        
        // Emit timing updates for systems that need synchronization
        this.emit('timingUpdate', {
            audioTime: this.audioContext.currentTime,
            performanceTime: now,
            sampleRate: this.audioContext.sampleRate
        });
    }
    
    getCurrentTime() {
        return this.audioContext ? this.audioContext.currentTime : 0;
    }
    
    /**
     * MOBILE DETECTION & OPTIMIZATION
     */
    detectMobile() {
        if (typeof navigator === 'undefined') return false;
        
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }
    
    /**
     * EVENT HANDLERS
     */
    setupEventHandlers() {
        // Handle page visibility changes (mobile optimization)
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseAudioProcessing();
                } else {
                    this.resumeAudioProcessing();
                }
            });
            
            // Handle user interaction to resume audio context
            const resumeEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
            const resumeHandler = () => {
                this.resumeContext();
                resumeEvents.forEach(event => {
                    document.removeEventListener(event, resumeHandler);
                });
            };
            
            resumeEvents.forEach(event => {
                document.addEventListener(event, resumeHandler, { once: true });
            });
        }
    }
    
    pauseAudioProcessing() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
            console.log('⏸️ Audio processing paused (page hidden)');
        }
    }
    
    resumeAudioProcessing() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
            console.log('▶️ Audio processing resumed (page visible)');
        }
    }
    
    /**
     * ERROR HANDLING
     */
    handleInitializationError(error) {
        console.error('Audio Manager initialization error:', error);
        
        if (this.options.fallbackEnabled) {
            console.log('🔄 Attempting fallback initialization...');
            this.initializeFallbackMode();
        } else {
            this.emit('error', error);
        }
    }
    
    initializeFallbackMode() {
        console.log('🔄 Initializing fallback audio mode (no Web Audio API)');
        
        // Create mock audio context for systems that need it
        this.audioContext = {
            currentTime: 0,
            sampleRate: 44100,
            state: 'running',
            createGain: () => ({ gain: { value: 1 } }),
            createOscillator: () => ({ frequency: { value: 440 } }),
            createAnalyser: () => ({ fftSize: 2048 }),
            destination: null
        };
        
        this.emit('ready', {
            context: this.audioContext,
            fallbackMode: true,
            isMobile: this.isMobile
        });
    }
    
    /**
     * STATUS & DIAGNOSTICS
     */
    getStatus() {
        return {
            contextState: this.contextState,
            isMobile: this.isMobile,
            performanceMode: this.performanceMode,
            activeSources: this.activeSources.size,
            maxSources: this.options.maxConcurrentSources,
            registeredSystems: Array.from(this.registeredSystems.keys()),
            bufferPoolSize: this.bufferPool.size,
            sampleRate: this.audioContext?.sampleRate || 0,
            currentTime: this.audioContext?.currentTime || 0
        };
    }
    
    cleanup() {
        console.log('🧹 Cleaning up Unified Audio Manager...');
        
        // Destroy all active sources
        for (const [sourceId, sourceInfo] of this.activeSources) {
            this.destroyAudioSource(sourceInfo.system, sourceId);
        }
        
        // Clear buffer pool
        this.bufferPool.clear();
        
        // Close audio context
        if (this.audioContext && this.audioContext.close) {
            this.audioContext.close();
        }
        
        this.registeredSystems.clear();
        this.systemPriorities.clear();
        
        console.log('✅ Audio Manager cleanup complete');
    }
}

// Export for use by other systems
module.exports = UnifiedAudioManager;

// Global instance for immediate use
if (typeof window !== 'undefined') {
    window.UnifiedAudioManager = new UnifiedAudioManager();
}

// Self-test if run directly
if (require.main === module) {
    (async () => {
        console.log('🧪 Testing Unified Audio Manager...');
        
        const audioManager = new UnifiedAudioManager({ debugMode: true });
        
        audioManager.on('ready', (info) => {
            console.log('✅ Audio Manager ready:', info);
            
            // Test system registration
            const musicSystem = audioManager.registerSystem('color-music-theory', {
                priority: 1,
                audioType: 'music',
                maxSources: 4
            });
            
            const spatialSystem = audioManager.registerSystem('spatial-audio', {
                priority: 2,
                audioType: 'spatial',
                maxSources: 8
            });
            
            console.log('🎵 Registered test systems');
            
            // Test audio source creation
            if (musicSystem) {
                const oscillator = musicSystem.createSource({
                    type: 'oscillator',
                    frequency: 440
                });
                
                if (oscillator) {
                    console.log('🎵 Created test oscillator');
                    setTimeout(() => oscillator.destroy(), 2000);
                }
            }
            
            // Show status
            setTimeout(() => {
                console.log('📊 Audio Manager Status:', audioManager.getStatus());
            }, 1000);
        });
        
        audioManager.on('error', (error) => {
            console.error('❌ Audio Manager error:', error);
        });
        
    })().catch(console.error);
}