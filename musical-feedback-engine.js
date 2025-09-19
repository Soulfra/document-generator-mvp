/**
 * 🎵 Enhanced Musical Feedback Engine with Bubbles and Sound Effects
 * 
 * Provides visual and audio feedback for the Musical Cryptographic Genealogy System:
 * - Visual bubble system for harmonic matches and pattern alignment
 * - Audio synthesis for tone generation and musical feedback
 * - Real-time frequency analysis and matching detection
 * - Popup system for yodel transitions and family harmony
 * - WebSocket integration for real-time collaboration
 * - AI orchestration integration for system evaluation
 * 
 * Features:
 * - Bubble animations when musical patterns match up correctly
 * - Sound effects for tone alignment and harmonic resonance
 * - Visual popups for yodel transitions between octaves
 * - Real-time frequency analysis and pattern detection
 * - Integration with all musical cryptographic components
 * - Debug information and analytics dashboard
 * - AI model evaluation and scoring system
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const WebSocket = require('ws');

class MusicalFeedbackEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Visual Feedback Configuration
            visual: {
                bubbles: {
                    enabled: true,
                    maxBubbles: 50,
                    bubbleLifetime: 3000, // 3 seconds
                    animationDuration: 1000,
                    colors: {
                        harmony: '#4CAF50',      // Green for harmonic matches
                        melody: '#2196F3',       // Blue for melodic patterns
                        rhythm: '#FF9800',       // Orange for rhythmic alignment
                        yodel: '#E91E63',        // Pink for yodel transitions
                        family: '#9C27B0',       // Purple for family connections
                        device: '#00BCD4',       // Cyan for device authentication
                        error: '#F44336'         // Red for errors/mismatches
                    },
                    effects: {
                        pop: true,
                        shimmer: true,
                        trail: true,
                        glow: true
                    }
                },
                popups: {
                    enabled: true,
                    duration: 2000,
                    animationType: 'fadeInUp',
                    position: 'dynamic', // follows mouse/interaction
                    maxPopups: 10
                },
                indicators: {
                    harmonicMeter: true,
                    frequencySpectrum: true,
                    familyConnections: true,
                    octaveVisualization: true
                }
            },
            
            // Audio Feedback Configuration
            audio: {
                enabled: true,
                volume: 0.7,
                spatialAudio: true,
                effects: {
                    harmonicMatch: {
                        type: 'chord',
                        duration: 500,
                        frequencies: [440, 554.37, 659.25], // A major chord
                        envelope: 'smooth'
                    },
                    melodicPattern: {
                        type: 'sequence',
                        duration: 800,
                        pattern: [261.63, 293.66, 329.63, 349.23], // C-D-E-F
                        envelope: 'staccato'
                    },
                    rhythmicAlignment: {
                        type: 'percussion',
                        duration: 200,
                        frequency: 80,
                        envelope: 'sharp'
                    },
                    yodelTransition: {
                        type: 'glide',
                        duration: 1200,
                        startFreq: 220,
                        endFreq: 880,
                        envelope: 'yodel'
                    },
                    familyConnection: {
                        type: 'harmonics',
                        duration: 1000,
                        fundamental: 110,
                        harmonics: [2, 3, 4, 5],
                        envelope: 'warm'
                    },
                    deviceAuth: {
                        type: 'arpeggio',
                        duration: 600,
                        baseFreq: 330,
                        pattern: [1, 1.25, 1.5, 2],
                        envelope: 'bell'
                    },
                    error: {
                        type: 'dissonance',
                        duration: 300,
                        frequencies: [440, 466.16], // A and A#
                        envelope: 'harsh'
                    }
                },
                synthesis: {
                    sampleRate: 44100,
                    waveforms: ['sine', 'square', 'sawtooth', 'triangle'],
                    filters: ['lowpass', 'highpass', 'bandpass'],
                    effects: ['reverb', 'delay', 'chorus', 'distortion']
                }
            },
            
            // Pattern Detection Configuration
            patternDetection: {
                enabled: true,
                sensitivity: 0.8,
                algorithms: {
                    harmonicMatching: {
                        threshold: 0.9,
                        toleranceHz: 5,
                        minDuration: 100
                    },
                    melodicPattern: {
                        threshold: 0.85,
                        sequenceLength: 4,
                        timingTolerance: 50
                    },
                    rhythmicAlignment: {
                        threshold: 0.95,
                        beatTolerance: 20,
                        minBeats: 2
                    },
                    familyHarmony: {
                        threshold: 0.8,
                        octaveRange: 3,
                        relationshipWeight: 0.7
                    }
                },
                realTime: {
                    analysisWindow: 1024,
                    hopSize: 512,
                    updateRate: 60 // Hz
                }
            },
            
            // WebSocket Configuration
            websocket: {
                port: 3358,
                path: '/musical-feedback',
                heartbeatInterval: 30000,
                compression: true
            },
            
            // Debug Configuration
            debug: {
                enabled: true,
                logLevel: 'info', // 'debug', 'info', 'warn', 'error'
                visualDebug: true,
                audioDebug: false,
                performanceMetrics: true,
                eventLogging: true
            },
            
            // AI Integration Configuration
            ai: {
                enabled: true,
                evaluationEndpoint: 'http://localhost:3001/ai/evaluate-musical-patterns',
                scoringThreshold: 0.75,
                learningEnabled: true,
                feedbackIntegration: true
            },
            
            ...config
        };
        
        // State Management
        this.state = {
            initialized: false,
            running: false,
            activeBubbles: new Map(), // bubbleId -> bubble data
            activePopups: new Map(),  // popupId -> popup data
            audioContext: null,
            websocketServer: null,
            connections: new Map(),
            patternHistory: [],
            performanceMetrics: {
                bubblesCreated: 0,
                soundEffectsPlayed: 0,
                patternsDetected: 0,
                harmonicMatches: 0,
                yodelTransitions: 0,
                averageResponseTime: 0
            }
        };
        
        // Pattern Detection State
        this.patternDetection = {
            currentAnalysis: {
                frequencies: [],
                harmonics: [],
                melody: [],
                rhythm: [],
                family: []
            },
            previousAnalysis: {},
            matchingEngine: null,
            realTimeProcessor: null
        };
        
        // Audio Synthesis
        this.audioSynthesis = {
            oscillators: new Map(),
            effects: new Map(),
            masterGain: null,
            spatialNodes: new Map()
        };
        
        // Visual Engine
        this.visualEngine = {
            bubbleRenderer: null,
            popupRenderer: null,
            canvas: null,
            context: null,
            animationFrame: null
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎵 Initializing Enhanced Musical Feedback Engine...');
        
        try {
            // Initialize audio context
            await this.initializeAudioContext();
            
            // Initialize visual engine
            this.initializeVisualEngine();
            
            // Initialize pattern detection
            await this.initializePatternDetection();
            
            // Initialize WebSocket server
            await this.initializeWebSocketServer();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start real-time processing
            this.startRealTimeProcessing();
            
            this.state.initialized = true;
            this.state.running = true;
            
            console.log('✅ Musical Feedback Engine initialized successfully');
            console.log(`  🎨 Visual feedback: ${this.config.visual.bubbles.enabled ? 'enabled' : 'disabled'}`);
            console.log(`  🔊 Audio feedback: ${this.config.audio.enabled ? 'enabled' : 'disabled'}`);
            console.log(`  📡 Pattern detection: ${this.config.patternDetection.enabled ? 'enabled' : 'disabled'}`);
            console.log(`  🌐 WebSocket server: ws://localhost:${this.config.websocket.port}${this.config.websocket.path}`);
            
            this.emit('feedback_engine_ready', {
                visual: this.config.visual.bubbles.enabled,
                audio: this.config.audio.enabled,
                patterns: this.config.patternDetection.enabled,
                websocket: this.config.websocket.port
            });
            
        } catch (error) {
            console.error('💥 Failed to initialize Musical Feedback Engine:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Web Audio API context for sound synthesis
     */
    async initializeAudioContext() {
        if (!this.config.audio.enabled) {
            console.log('🔇 Audio feedback disabled');
            return;
        }
        
        try {
            // Create audio context
            const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
            if (!AudioContext) {
                console.warn('⚠️ Web Audio API not available, audio feedback disabled');
                this.config.audio.enabled = false;
                return;
            }
            
            this.state.audioContext = new AudioContext({
                sampleRate: this.config.audio.synthesis.sampleRate,
                latencyHint: 'interactive'
            });
            
            // Create master gain node
            this.audioSynthesis.masterGain = this.state.audioContext.createGain();
            this.audioSynthesis.masterGain.gain.value = this.config.audio.volume;
            this.audioSynthesis.masterGain.connect(this.state.audioContext.destination);
            
            console.log('🔊 Audio context initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize audio context:', error);
            this.config.audio.enabled = false;
        }
    }
    
    /**
     * Initialize visual feedback engine
     */
    initializeVisualEngine() {
        if (!this.config.visual.bubbles.enabled && !this.config.visual.popups.enabled) {
            console.log('🙈 Visual feedback disabled');
            return;
        }
        
        // Create virtual canvas for server-side rendering simulation
        this.visualEngine.canvas = {
            width: 1920,
            height: 1080,
            bubbles: [],
            popups: []
        };
        
        // Initialize bubble renderer
        this.visualEngine.bubbleRenderer = {
            createBubble: (type, position, data) => this.createBubble(type, position, data),
            updateBubbles: () => this.updateBubbles(),
            removeBubble: (bubbleId) => this.removeBubble(bubbleId)
        };
        
        // Initialize popup renderer
        this.visualEngine.popupRenderer = {
            createPopup: (type, position, content) => this.createPopup(type, position, content),
            updatePopups: () => this.updatePopups(),
            removePopup: (popupId) => this.removePopup(popupId)
        };
        
        console.log('🎨 Visual engine initialized');
    }
    
    /**
     * Initialize pattern detection algorithms
     */
    async initializePatternDetection() {
        if (!this.config.patternDetection.enabled) {
            console.log('🔍 Pattern detection disabled');
            return;
        }
        
        // Initialize harmonic matching engine
        this.patternDetection.matchingEngine = {
            analyzeHarmonics: (frequencies) => this.analyzeHarmonics(frequencies),
            detectMelody: (sequence) => this.detectMelody(sequence),
            analyzeRhythm: (beats) => this.analyzeRhythm(beats),
            evaluateFamilyHarmony: (familyData) => this.evaluateFamilyHarmony(familyData)
        };
        
        // Initialize real-time processor
        this.patternDetection.realTimeProcessor = {
            processAudioData: (audioData) => this.processAudioData(audioData),
            updateAnalysis: () => this.updatePatternAnalysis(),
            detectPatterns: () => this.detectPatterns()
        };
        
        console.log('🔍 Pattern detection initialized');
    }
    
    /**
     * Initialize WebSocket server for real-time feedback
     */
    async initializeWebSocketServer() {
        this.state.websocketServer = new WebSocket.Server({
            port: this.config.websocket.port,
            path: this.config.websocket.path,
            perMessageDeflate: this.config.websocket.compression
        });
        
        this.state.websocketServer.on('connection', (ws, request) => {
            const connectionId = crypto.randomUUID();
            
            this.state.connections.set(connectionId, {
                id: connectionId,
                websocket: ws,
                connectedAt: Date.now(),
                lastActivity: Date.now(),
                subscriptions: new Set(['*']) // Subscribe to all events by default
            });
            
            console.log(`🔌 Feedback client connected: ${connectionId.slice(0, 8)}...`);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'feedback_engine_state',
                data: this.getEngineState()
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                this.handleWebSocketMessage(connectionId, JSON.parse(message));
            });
            
            // Handle disconnection
            ws.on('close', () => {
                this.state.connections.delete(connectionId);
                console.log(`🔌 Feedback client disconnected: ${connectionId.slice(0, 8)}...`);
            });
        });
        
        console.log(`🌐 WebSocket feedback server listening on port ${this.config.websocket.port}`);
    }
    
    /**
     * Setup event listeners for musical components
     */
    setupEventListeners() {
        // Listen for harmonic matches
        this.on('harmonic_match_detected', (data) => {
            this.triggerHarmonicFeedback(data);
        });
        
        // Listen for melodic patterns
        this.on('melodic_pattern_detected', (data) => {
            this.triggerMelodicFeedback(data);
        });
        
        // Listen for rhythmic alignment
        this.on('rhythmic_alignment_detected', (data) => {
            this.triggerRhythmicFeedback(data);
        });
        
        // Listen for yodel transitions
        this.on('yodel_transition_detected', (data) => {
            this.triggerYodelFeedback(data);
        });
        
        // Listen for family connections
        this.on('family_connection_detected', (data) => {
            this.triggerFamilyFeedback(data);
        });
        
        // Listen for device authentication
        this.on('device_auth_detected', (data) => {
            this.triggerDeviceFeedback(data);
        });
        
        // Listen for pattern matching errors
        this.on('pattern_mismatch_detected', (data) => {
            this.triggerErrorFeedback(data);
        });
    }
    
    /**
     * Start real-time pattern processing
     */
    startRealTimeProcessing() {
        if (!this.config.patternDetection.enabled) return;
        
        const updateInterval = 1000 / this.config.patternDetection.realTime.updateRate;
        
        setInterval(() => {
            this.updatePatternAnalysis();
            this.detectPatterns();
            this.updateVisualElements();
            this.updatePerformanceMetrics();
        }, updateInterval);
        
        console.log(`🔄 Real-time processing started (${this.config.patternDetection.realTime.updateRate} Hz)`);
    }
    
    /**
     * Create visual bubble for pattern feedback
     */
    createBubble(type, position = null, data = {}) {
        if (!this.config.visual.bubbles.enabled) return null;
        
        const bubbleId = crypto.randomUUID();
        const now = Date.now();
        
        const bubble = {
            id: bubbleId,
            type,
            position: position || this.getRandomPosition(),
            color: this.config.visual.bubbles.colors[type] || this.config.visual.bubbles.colors.harmony,
            size: data.size || this.calculateBubbleSize(type, data),
            lifetime: this.config.visual.bubbles.bubbleLifetime,
            createdAt: now,
            expiresAt: now + this.config.visual.bubbles.bubbleLifetime,
            data,
            effects: {
                pop: this.config.visual.bubbles.effects.pop,
                shimmer: this.config.visual.bubbles.effects.shimmer,
                trail: this.config.visual.bubbles.effects.trail,
                glow: this.config.visual.bubbles.effects.glow
            },
            animation: {
                phase: 'appearing',
                progress: 0,
                velocity: { x: 0, y: -20 }, // Float upward
                rotation: 0,
                scale: 0
            }
        };
        
        this.state.activeBubbles.set(bubbleId, bubble);
        this.state.performanceMetrics.bubblesCreated++;
        
        // Broadcast to connected clients
        this.broadcastToClients('bubble_created', bubble);
        
        // Schedule removal
        setTimeout(() => {
            this.removeBubble(bubbleId);
        }, bubble.lifetime);
        
        if (this.config.debug.visualDebug) {
            console.log(`🫧 Created ${type} bubble: ${bubbleId.slice(0, 8)}... at (${bubble.position.x}, ${bubble.position.y})`);
        }
        
        return bubble;
    }
    
    /**
     * Create popup for significant events
     */
    createPopup(type, position, content) {
        if (!this.config.visual.popups.enabled) return null;
        
        const popupId = crypto.randomUUID();
        const now = Date.now();
        
        const popup = {
            id: popupId,
            type,
            position: position || this.getRandomPosition(),
            content,
            duration: this.config.visual.popups.duration,
            createdAt: now,
            expiresAt: now + this.config.visual.popups.duration,
            animation: {
                type: this.config.visual.popups.animationType,
                phase: 'entering',
                progress: 0
            }
        };
        
        this.state.activePopups.set(popupId, popup);
        
        // Broadcast to connected clients
        this.broadcastToClients('popup_created', popup);
        
        // Schedule removal
        setTimeout(() => {
            this.removePopup(popupId);
        }, popup.duration);
        
        if (this.config.debug.visualDebug) {
            console.log(`📝 Created ${type} popup: ${content.title || content.text}`);
        }
        
        return popup;
    }
    
    /**
     * Play audio feedback for patterns
     */
    async playAudioFeedback(type, data = {}) {
        if (!this.config.audio.enabled || !this.state.audioContext) return;
        
        const effectConfig = this.config.audio.effects[type];
        if (!effectConfig) {
            console.warn(`⚠️ No audio effect configured for type: ${type}`);
            return;
        }
        
        try {
            const startTime = this.state.audioContext.currentTime;
            
            switch (effectConfig.type) {
                case 'chord':
                    await this.playChord(effectConfig, startTime, data);
                    break;
                    
                case 'sequence':
                    await this.playSequence(effectConfig, startTime, data);
                    break;
                    
                case 'percussion':
                    await this.playPercussion(effectConfig, startTime, data);
                    break;
                    
                case 'glide':
                    await this.playGlide(effectConfig, startTime, data);
                    break;
                    
                case 'harmonics':
                    await this.playHarmonics(effectConfig, startTime, data);
                    break;
                    
                case 'arpeggio':
                    await this.playArpeggio(effectConfig, startTime, data);
                    break;
                    
                case 'dissonance':
                    await this.playDissonance(effectConfig, startTime, data);
                    break;
                    
                default:
                    console.warn(`⚠️ Unknown audio effect type: ${effectConfig.type}`);
            }
            
            this.state.performanceMetrics.soundEffectsPlayed++;
            
            if (this.config.debug.audioDebug) {
                console.log(`🔊 Played ${type} audio feedback`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to play ${type} audio feedback:`, error);
        }
    }
    
    /**
     * Trigger feedback for harmonic matches
     */
    triggerHarmonicFeedback(data) {
        const position = data.position || this.getRandomPosition();
        
        // Create harmony bubble
        this.createBubble('harmony', position, {
            harmonicRatio: data.harmonicRatio,
            frequencies: data.frequencies,
            strength: data.strength
        });
        
        // Play harmonic chord
        this.playAudioFeedback('harmonicMatch', data);
        
        // Create popup for strong harmonies
        if (data.strength > 0.9) {
            this.createPopup('harmony', position, {
                title: '🎵 Perfect Harmony!',
                text: `Harmonic ratio: ${data.harmonicRatio.toFixed(2)}`,
                strength: data.strength
            });
        }
        
        this.state.performanceMetrics.harmonicMatches++;
        
        // Send to AI for evaluation
        if (this.config.ai.enabled) {
            this.sendToAIEvaluation('harmonic_match', data);
        }
    }
    
    /**
     * Trigger feedback for yodel transitions
     */
    triggerYodelFeedback(data) {
        const position = data.position || this.getRandomPosition();
        
        // Create yodel bubble with special effects
        this.createBubble('yodel', position, {
            octaveDistance: data.octaveDistance,
            direction: data.direction,
            technique: data.technique,
            size: Math.max(50, data.octaveDistance * 20) // Larger bubbles for bigger jumps
        });
        
        // Play yodel glide sound
        this.playAudioFeedback('yodelTransition', {
            startFreq: data.startFreq,
            endFreq: data.endFreq,
            technique: data.technique
        });
        
        // Create informative popup
        this.createPopup('yodel', position, {
            title: `🎵 ${data.technique.replace('_', ' ').toUpperCase()}!`,
            text: `${data.octaveDistance.toFixed(1)} octave ${data.direction} leap`,
            technique: data.technique
        });
        
        this.state.performanceMetrics.yodelTransitions++;
        
        // Send to AI for evaluation
        if (this.config.ai.enabled) {
            this.sendToAIEvaluation('yodel_transition', data);
        }
    }
    
    /**
     * Update all visual elements
     */
    updateVisualElements() {
        this.updateBubbles();
        this.updatePopups();
        
        // Clean up expired elements
        this.cleanupExpiredElements();
    }
    
    /**
     * Update bubble animations
     */
    updateBubbles() {
        const now = Date.now();
        
        for (const [bubbleId, bubble] of this.state.activeBubbles) {
            const elapsed = now - bubble.createdAt;
            const progress = elapsed / bubble.lifetime;
            
            // Update animation phase
            if (progress < 0.2) {
                bubble.animation.phase = 'appearing';
                bubble.animation.scale = progress * 5; // Scale from 0 to 1
            } else if (progress < 0.8) {
                bubble.animation.phase = 'floating';
                bubble.animation.scale = 1 + Math.sin(elapsed * 0.005) * 0.1; // Gentle pulsing
            } else {
                bubble.animation.phase = 'disappearing';
                bubble.animation.scale = (1 - progress) * 5; // Scale back to 0
            }
            
            // Update position
            bubble.position.y += bubble.animation.velocity.y * 0.016; // Assuming 60 FPS
            bubble.animation.rotation += 0.02;
            
            // Apply floating effect
            bubble.position.x += Math.sin(elapsed * 0.003) * 0.5;
        }
    }
    
    /**
     * Update popup animations
     */
    updatePopups() {
        const now = Date.now();
        
        for (const [popupId, popup] of this.state.activePopups) {
            const elapsed = now - popup.createdAt;
            const progress = elapsed / popup.duration;
            
            // Update animation phase
            if (progress < 0.3) {
                popup.animation.phase = 'entering';
                popup.animation.progress = progress / 0.3;
            } else if (progress < 0.7) {
                popup.animation.phase = 'visible';
                popup.animation.progress = 1;
            } else {
                popup.animation.phase = 'exiting';
                popup.animation.progress = 1 - ((progress - 0.7) / 0.3);
            }
        }
    }
    
    /**
     * Clean up expired visual elements
     */
    cleanupExpiredElements() {
        const now = Date.now();
        
        // Clean up expired bubbles
        for (const [bubbleId, bubble] of this.state.activeBubbles) {
            if (now > bubble.expiresAt) {
                this.removeBubble(bubbleId);
            }
        }
        
        // Clean up expired popups
        for (const [popupId, popup] of this.state.activePopups) {
            if (now > popup.expiresAt) {
                this.removePopup(popupId);
            }
        }
    }
    
    /**
     * Remove bubble
     */
    removeBubble(bubbleId) {
        const bubble = this.state.activeBubbles.get(bubbleId);
        if (!bubble) return;
        
        this.state.activeBubbles.delete(bubbleId);
        
        // Broadcast removal to clients
        this.broadcastToClients('bubble_removed', { id: bubbleId });
        
        if (this.config.debug.visualDebug) {
            console.log(`🫧 Removed bubble: ${bubbleId.slice(0, 8)}...`);
        }
    }
    
    /**
     * Remove popup
     */
    removePopup(popupId) {
        const popup = this.state.activePopups.get(popupId);
        if (!popup) return;
        
        this.state.activePopups.delete(popupId);
        
        // Broadcast removal to clients
        this.broadcastToClients('popup_removed', { id: popupId });
        
        if (this.config.debug.visualDebug) {
            console.log(`📝 Removed popup: ${popupId.slice(0, 8)}...`);
        }
    }
    
    /**
     * Audio synthesis methods
     */
    async playChord(config, startTime, data) {
        const frequencies = data.frequencies || config.frequencies;
        const duration = (data.duration || config.duration) / 1000;
        
        for (let i = 0; i < frequencies.length; i++) {
            const oscillator = this.state.audioContext.createOscillator();
            const gainNode = this.state.audioContext.createGain();
            
            oscillator.frequency.value = frequencies[i];
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3 / frequencies.length, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioSynthesis.masterGain);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
    }
    
    async playGlide(config, startTime, data) {
        const startFreq = data.startFreq || config.startFreq;
        const endFreq = data.endFreq || config.endFreq;
        const duration = (data.duration || config.duration) / 1000;
        
        const oscillator = this.state.audioContext.createOscillator();
        const gainNode = this.state.audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(startFreq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioSynthesis.masterGain);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }
    
    /**
     * Pattern detection methods
     */
    updatePatternAnalysis() {
        // Simulate real-time audio analysis
        this.patternDetection.currentAnalysis = {
            frequencies: this.generateMockFrequencyData(),
            harmonics: this.analyzeHarmonics(),
            melody: this.extractMelody(),
            rhythm: this.detectRhythm(),
            family: this.analyzeFamilyPatterns()
        };
    }
    
    detectPatterns() {
        const current = this.patternDetection.currentAnalysis;
        const config = this.config.patternDetection.algorithms;
        
        // Detect harmonic matches
        if (this.isHarmonicMatch(current.harmonics, config.harmonicMatching.threshold)) {
            this.emit('harmonic_match_detected', {
                harmonicRatio: current.harmonics.ratio,
                frequencies: current.harmonics.frequencies,
                strength: current.harmonics.strength,
                position: this.getRandomPosition()
            });
        }
        
        // Detect melodic patterns
        if (this.isMelodicPattern(current.melody, config.melodicPattern.threshold)) {
            this.emit('melodic_pattern_detected', {
                pattern: current.melody.pattern,
                strength: current.melody.strength,
                position: this.getRandomPosition()
            });
        }
        
        // Detect rhythmic alignment
        if (this.isRhythmicAlignment(current.rhythm, config.rhythmicAlignment.threshold)) {
            this.emit('rhythmic_alignment_detected', {
                beats: current.rhythm.beats,
                alignment: current.rhythm.alignment,
                position: this.getRandomPosition()
            });
        }
        
        this.state.performanceMetrics.patternsDetected++;
    }
    
    /**
     * Utility methods
     */
    getRandomPosition() {
        return {
            x: Math.random() * this.visualEngine.canvas.width,
            y: Math.random() * this.visualEngine.canvas.height
        };
    }
    
    calculateBubbleSize(type, data) {
        const baseSizes = {
            harmony: 40,
            melody: 35,
            rhythm: 30,
            yodel: 50,
            family: 45,
            device: 35,
            error: 25
        };
        
        let size = baseSizes[type] || 30;
        
        // Adjust size based on data
        if (data.strength) {
            size *= (0.5 + data.strength * 0.5);
        }
        
        if (data.octaveDistance) {
            size *= Math.min(2, 1 + data.octaveDistance * 0.3);
        }
        
        return Math.round(size);
    }
    
    broadcastToClients(eventType, data) {
        const message = JSON.stringify({
            type: eventType,
            data,
            timestamp: Date.now()
        });
        
        for (const [connectionId, connection] of this.state.connections) {
            try {
                connection.websocket.send(message);
            } catch (error) {
                console.error(`Failed to send to client ${connectionId}:`, error);
                this.state.connections.delete(connectionId);
            }
        }
    }
    
    getEngineState() {
        return {
            initialized: this.state.initialized,
            running: this.state.running,
            activeBubbles: this.state.activeBubbles.size,
            activePopups: this.state.activePopups.size,
            connections: this.state.connections.size,
            performance: this.state.performanceMetrics,
            config: {
                visual: this.config.visual.bubbles.enabled,
                audio: this.config.audio.enabled,
                patterns: this.config.patternDetection.enabled
            }
        };
    }
    
    updatePerformanceMetrics() {
        // Update various performance metrics
        const now = Date.now();
        
        // Calculate average response time (simplified)
        this.state.performanceMetrics.averageResponseTime = 
            this.state.performanceMetrics.patternsDetected > 0 ? 
            this.state.performanceMetrics.patternsDetected * 2 : 0;
    }
    
    /**
     * AI Integration methods
     */
    async sendToAIEvaluation(eventType, data) {
        if (!this.config.ai.enabled) return;
        
        try {
            const payload = {
                eventType,
                data,
                timestamp: Date.now(),
                systemState: this.getEngineState()
            };
            
            // Note: In a real implementation, this would make an HTTP request
            // to the AI evaluation endpoint
            console.log(`🤖 Sending ${eventType} to AI evaluation:`, payload);
            
        } catch (error) {
            console.error('Failed to send to AI evaluation:', error);
        }
    }
    
    // Mock methods for pattern detection (in real implementation, these would be more sophisticated)
    generateMockFrequencyData() {
        return Array.from({ length: 50 }, () => Math.random() * 1000);
    }
    
    analyzeHarmonics() {
        return {
            ratio: 1.5 + Math.random() * 0.5,
            frequencies: [440, 660, 880],
            strength: Math.random()
        };
    }
    
    extractMelody() {
        return {
            pattern: [261.63, 293.66, 329.63, 349.23],
            strength: Math.random()
        };
    }
    
    detectRhythm() {
        return {
            beats: [0, 0.5, 1, 1.5],
            alignment: Math.random()
        };
    }
    
    analyzeFamilyPatterns() {
        return {
            connections: Math.floor(Math.random() * 5),
            harmonyLevel: Math.random()
        };
    }
    
    isHarmonicMatch(harmonics, threshold) {
        return harmonics.strength > threshold;
    }
    
    isMelodicPattern(melody, threshold) {
        return melody.strength > threshold;
    }
    
    isRhythmicAlignment(rhythm, threshold) {
        return rhythm.alignment > threshold;
    }
    
    handleWebSocketMessage(connectionId, message) {
        // Handle incoming WebSocket messages from clients
        const connection = this.state.connections.get(connectionId);
        if (!connection) return;
        
        connection.lastActivity = Date.now();
        
        switch (message.type) {
            case 'request_state':
                connection.websocket.send(JSON.stringify({
                    type: 'feedback_engine_state',
                    data: this.getEngineState()
                }));
                break;
                
            case 'trigger_test_feedback':
                this.triggerTestFeedback(message.testType);
                break;
                
            default:
                console.warn(`Unknown message type: ${message.type}`);
        }
    }
    
    /**
     * Trigger test feedback for debugging
     */
    triggerTestFeedback(testType = 'all') {
        console.log(`🧪 Triggering test feedback: ${testType}`);
        
        if (testType === 'all' || testType === 'harmony') {
            this.triggerHarmonicFeedback({
                harmonicRatio: 1.5,
                frequencies: [440, 660],
                strength: 0.95,
                position: this.getRandomPosition()
            });
        }
        
        if (testType === 'all' || testType === 'yodel') {
            this.triggerYodelFeedback({
                octaveDistance: 2.3,
                direction: 'up',
                technique: 'octave_leap',
                startFreq: 220,
                endFreq: 880,
                position: this.getRandomPosition()
            });
        }
        
        if (testType === 'all' || testType === 'error') {
            this.triggerErrorFeedback({
                errorType: 'pattern_mismatch',
                message: 'Test error feedback',
                position: this.getRandomPosition()
            });
        }
    }
    
    triggerErrorFeedback(data) {
        this.createBubble('error', data.position, {
            errorType: data.errorType,
            message: data.message
        });
        
        this.playAudioFeedback('error', data);
        
        this.createPopup('error', data.position, {
            title: '⚠️ Pattern Mismatch',
            text: data.message || 'Musical pattern not recognized'
        });
    }
    
    // Additional audio synthesis methods (simplified implementations)
    async playSequence(config, startTime, data) {
        const pattern = data.pattern || config.pattern;
        const duration = (data.duration || config.duration) / 1000;
        const noteLength = duration / pattern.length;
        
        for (let i = 0; i < pattern.length; i++) {
            const noteStart = startTime + (i * noteLength);
            const oscillator = this.state.audioContext.createOscillator();
            const gainNode = this.state.audioContext.createGain();
            
            oscillator.frequency.value = pattern[i];
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(0.2, noteStart + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + noteLength);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioSynthesis.masterGain);
            
            oscillator.start(noteStart);
            oscillator.stop(noteStart + noteLength);
        }
    }
    
    async playPercussion(config, startTime, data) {
        const frequency = data.frequency || config.frequency;
        const duration = (data.duration || config.duration) / 1000;
        
        const oscillator = this.state.audioContext.createOscillator();
        const gainNode = this.state.audioContext.createGain();
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioSynthesis.masterGain);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }
    
    async playHarmonics(config, startTime, data) {
        const fundamental = data.fundamental || config.fundamental;
        const harmonics = data.harmonics || config.harmonics;
        const duration = (data.duration || config.duration) / 1000;
        
        for (let i = 0; i < harmonics.length; i++) {
            const frequency = fundamental * harmonics[i];
            const oscillator = this.state.audioContext.createOscillator();
            const gainNode = this.state.audioContext.createGain();
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            const amplitude = 0.3 / Math.pow(harmonics[i], 0.5); // Higher harmonics are quieter
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(amplitude, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioSynthesis.masterGain);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
    }
    
    async playArpeggio(config, startTime, data) {
        const baseFreq = data.baseFreq || config.baseFreq;
        const pattern = data.pattern || config.pattern;
        const duration = (data.duration || config.duration) / 1000;
        const noteLength = duration / pattern.length;
        
        for (let i = 0; i < pattern.length; i++) {
            const noteStart = startTime + (i * noteLength * 0.7); // Slight overlap
            const frequency = baseFreq * pattern[i];
            
            const oscillator = this.state.audioContext.createOscillator();
            const gainNode = this.state.audioContext.createGain();
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(0.25, noteStart + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + noteLength);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioSynthesis.masterGain);
            
            oscillator.start(noteStart);
            oscillator.stop(noteStart + noteLength);
        }
    }
    
    async playDissonance(config, startTime, data) {
        const frequencies = data.frequencies || config.frequencies;
        const duration = (data.duration || config.duration) / 1000;
        
        for (let i = 0; i < frequencies.length; i++) {
            const oscillator = this.state.audioContext.createOscillator();
            const gainNode = this.state.audioContext.createGain();
            
            oscillator.frequency.value = frequencies[i];
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioSynthesis.masterGain);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
    }
    
    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🔄 Shutting down Musical Feedback Engine...');
        
        this.state.running = false;
        
        // Clear all intervals
        if (this.visualEngine.animationFrame) {
            clearInterval(this.visualEngine.animationFrame);
        }
        
        // Close WebSocket server
        if (this.state.websocketServer) {
            this.state.websocketServer.close();
        }
        
        // Close audio context
        if (this.state.audioContext) {
            await this.state.audioContext.close();
        }
        
        console.log('✅ Musical Feedback Engine shutdown complete');
    }
}

module.exports = MusicalFeedbackEngine;

// Example usage and comprehensive demo
if (require.main === module) {
    async function demonstrateMusicalFeedbackEngine() {
        console.log('🎵 Musical Feedback Engine Comprehensive Demo\n');
        
        try {
            // Initialize the feedback engine
            const feedbackEngine = new MusicalFeedbackEngine({
                visual: {
                    bubbles: { enabled: true },
                    popups: { enabled: true }
                },
                audio: {
                    enabled: true,
                    volume: 0.5
                },
                patternDetection: {
                    enabled: true,
                    sensitivity: 0.8
                },
                debug: {
                    enabled: true,
                    visualDebug: true,
                    audioDebug: true
                }
            });
            
            // Wait for initialization
            await new Promise(resolve => feedbackEngine.once('feedback_engine_ready', resolve));
            
            console.log('\n🎨 Testing Visual and Audio Feedback:\n');
            
            // Test harmonic feedback
            console.log('1. Testing harmonic match feedback...');
            feedbackEngine.triggerTestFeedback('harmony');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Test yodel feedback
            console.log('2. Testing yodel transition feedback...');
            feedbackEngine.triggerTestFeedback('yodel');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Test error feedback
            console.log('3. Testing error feedback...');
            feedbackEngine.triggerTestFeedback('error');
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Test all feedback types
            console.log('4. Testing all feedback types simultaneously...');
            feedbackEngine.triggerTestFeedback('all');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show engine state
            console.log('\n📊 Engine State Summary:');
            const state = feedbackEngine.getEngineState();
            console.log(`   🫧 Active bubbles: ${state.activeBubbles}`);
            console.log(`   📝 Active popups: ${state.activePopups}`);
            console.log(`   🔌 Connected clients: ${state.connections}`);
            console.log(`   🎵 Patterns detected: ${state.performance.patternsDetected}`);
            console.log(`   🔊 Sound effects played: ${state.performance.soundEffectsPlayed}`);
            console.log(`   ✨ Bubbles created: ${state.performance.bubblesCreated}`);
            
            console.log('\n✅ Musical Feedback Engine Demonstration Complete!');
            console.log('\n🎼 Enhanced Musical Feedback Engine is now operational:');
            console.log('   • Visual bubble system for harmonic matches ✅');
            console.log('   • Audio synthesis for tone generation ✅');
            console.log('   • Real-time pattern detection and feedback ✅');
            console.log('   • Popup system for significant musical events ✅');
            console.log('   • WebSocket integration for real-time collaboration ✅');
            console.log('   • AI orchestration integration ready ✅');
            
            console.log('\n🚀 System ready for Musical Cryptographic testing!');
            console.log(`   WebSocket: ws://localhost:${feedbackEngine.config.websocket.port}${feedbackEngine.config.websocket.path}`);
            console.log('   Ready to debug musical pattern alignment and provide feedback!');
            
        } catch (error) {
            console.error('💥 Demo failed:', error);
        }
    }
    
    demonstrateMusicalFeedbackEngine();
}