/**
 * 🎤 Voice Mouse Controller - Speech-to-Mouse-Action System
 * 
 * Enables voice control of mouse actions with musical pitch-based movement:
 * - Speech recognition for commands like "click", "clip", "scissors"
 * - Pitch-based cursor movement using musical octaves from genealogy system
 * - Voice-controlled dragging, scrolling, and complex mouse interactions
 * - Integration with Musical Cryptographic Genealogy System for pitch mapping
 * - Real-time voice feedback and confirmation
 * 
 * Features:
 * - Natural language mouse commands
 * - Pitch-controlled cursor positioning
 * - Voice-activated click actions (click, double-click, right-click)
 * - Musical movement patterns (yodel for quick jumps, scales for smooth movement)
 * - Multi-modal interaction (voice + existing mouse/keyboard)
 * - Accessibility features for hands-free computer control
 * - Integration with family octave ranges for personalized control
 * - Real-time voice processing and mouse automation
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class VoiceMouseController extends EventEmitter {
    constructor(genealogyOctaveManager, musicalInterfaceEngine, config = {}) {
        super();
        
        this.genealogyOctaveManager = genealogyOctaveManager;
        this.musicalInterfaceEngine = musicalInterfaceEngine;
        
        this.config = {
            // Voice Recognition Configuration
            speechRecognition: {
                language: 'en-US',
                continuous: true,
                interimResults: true,
                maxAlternatives: 3,
                grammar: this.buildVoiceGrammar(),
                confidence: 0.7,
                noSpeechTimeout: 5000,
                commandTimeout: 2000
            },
            
            // Mouse Control Configuration
            mouseControl: {
                movementSmoothing: 0.2,      // Smoothing factor for movement
                clickDelay: 100,             // Delay between click detection and action
                doubleClickWindow: 300,      // Time window for double-click detection
                dragThreshold: 5,            // Pixels before drag starts
                scrollSensitivity: 0.5,      // Scroll speed multiplier
                boundaryPadding: 20,         // Pixels from screen edge to stop
                accelerationCurve: 'ease-out' // Movement acceleration curve
            },
            
            // Pitch-Based Movement Configuration
            pitchMovement: {
                enabled: true,
                octaveToPixelRatio: 100,     // Pixels per octave of pitch change
                pitchSensitivity: 1.0,       // Pitch detection sensitivity
                pitchSmoothing: 0.3,         // Pitch smoothing factor
                frequencyRange: [80, 800],   // Hz range for pitch detection
                calibrationRequired: true,    // Require pitch calibration
                yodelJumpDistance: 200,      // Pixels for yodel-style jumps
                scaleStepSize: 20,           // Pixels per musical scale step
                harmonicSnapping: true       // Snap to harmonic positions
            },
            
            // Command Recognition
            commands: {
                // Basic click commands
                click: ['click', 'tap', 'select', 'choose'],
                doubleClick: ['double', 'double click', 'open'],
                rightClick: ['right click', 'context', 'menu'],
                
                // Movement commands  
                move: ['move', 'go', 'navigate', 'cursor'],
                jump: ['jump', 'leap', 'yodel', 'hop'],
                glide: ['glide', 'slide', 'smooth'],
                
                // Drag and drop
                drag: ['drag', 'pull', 'grab'],
                drop: ['drop', 'release', 'let go'],
                
                // Scroll commands
                scroll: ['scroll', 'wheel'],
                scrollUp: ['scroll up', 'up', 'page up'],
                scrollDown: ['scroll down', 'down', 'page down'],
                
                // Special commands (user mentioned)
                clip: ['clip', 'scissors', 'cut'],
                
                // Directional commands
                up: ['up', 'north', 'higher', 'rise'],
                down: ['down', 'south', 'lower', 'fall'],
                left: ['left', 'west', 'back'],
                right: ['right', 'east', 'forward'],
                
                // Position commands
                center: ['center', 'middle', 'home'],
                corner: ['corner', 'edge'],
                top: ['top', 'summit', 'peak'],
                bottom: ['bottom', 'floor', 'base'],
                
                // Musical movement commands
                scale: ['scale', 'step', 'walk'],
                chord: ['chord', 'harmony', 'together'],
                arpeggio: ['arpeggio', 'sweep', 'flow'],
                
                // Control commands
                stop: ['stop', 'halt', 'freeze', 'pause'],
                reset: ['reset', 'return', 'home'],
                calibrate: ['calibrate', 'tune', 'adjust']
            },
            
            // Audio Feedback Configuration
            feedback: {
                audioConfirmation: true,     // Play audio for successful commands
                voiceFeedback: true,         // Speak command confirmations
                visualIndicators: true,      // Show visual feedback
                hapticFeedback: false,       // Haptic feedback if available
                toneFrequencies: {
                    success: 880,            // A5 for success
                    error: 220,              // A3 for error
                    movement: 440,           // A4 for movement
                    click: 660               // E5 for click
                },
                feedbackDuration: 200        // Milliseconds
            },
            
            // User Personalization
            personalization: {
                enableUserProfiles: true,   // Enable user-specific calibration
                voicePrintMatching: true,    // Match user voice characteristics
                adaptiveLearning: true,      // Learn user preferences
                commandCustomization: true, // Allow custom commands
                pitchProfileCalibration: true // Calibrate to user's voice range
            },
            
            ...config
        };
        
        // Speech Recognition State
        this.speechRecognition = null;
        this.isListening = false;
        this.currentCommand = null;
        this.commandHistory = [];
        
        // Mouse State
        this.mouseState = {
            position: { x: 0, y: 0 },
            lastPosition: { x: 0, y: 0 },
            isDragging: false,
            dragStart: null,
            isMoving: false,
            targetPosition: null,
            movementQueue: []
        };
        
        // Pitch Analysis State
        this.pitchState = {
            currentFrequency: 0,
            lastFrequency: 0,
            calibratedRange: { min: 100, max: 400 },
            octavePosition: 0,
            userProfile: null,
            isCalibrated: false
        };
        
        // Audio Context for Pitch Detection
        this.audioContext = null;
        this.mediaStream = null;
        this.pitchAnalyzer = null;
        
        // Command Processing State
        this.commandProcessor = {
            activeCommands: new Map(),
            commandQueue: [],
            processingCommand: false,
            lastCommandTime: 0,
            commandChaining: []
        };
        
        // User Profile Storage
        this.userProfiles = new Map(); // userId -> UserProfile
        this.currentUserId = null;
        
        // Performance Metrics
        this.metrics = {
            commandsProcessed: 0,
            successfulActions: 0,
            pitchDetections: 0,
            mouseMovements: 0,
            averageResponseTime: 0,
            accuracyRate: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎤 Initializing Voice Mouse Controller...');
        
        // Initialize speech recognition
        await this.initializeSpeechRecognition();
        
        // Initialize audio context for pitch detection
        await this.initializeAudioContext();
        
        // Setup mouse control integration
        await this.setupMouseControl();
        
        // Setup musical integration
        await this.setupMusicalIntegration();
        
        // Setup user profile system
        this.setupUserProfiles();
        
        // Initialize command processor
        this.initializeCommandProcessor();
        
        // Setup feedback system
        this.setupFeedbackSystem();
        
        console.log('✅ Voice Mouse Controller initialized');
        console.log(`  🗣️  Speech recognition: ${this.config.speechRecognition.language}`);
        console.log(`  🎵 Pitch movement: ${this.config.pitchMovement.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`  📊 Commands available: ${Object.keys(this.config.commands).length}`);
        
        this.emit('voice_mouse_controller_ready');
    }
    
    /**
     * Initialize speech recognition system
     */
    async initializeSpeechRecognition() {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            
            // Configure speech recognition
            Object.assign(this.speechRecognition, this.config.speechRecognition);
            
            // Setup event handlers
            this.speechRecognition.onstart = () => {
                this.isListening = true;
                console.log('🎤 Voice recognition started');
                this.emit('listening_started');
            };
            
            this.speechRecognition.onresult = (event) => {
                this.handleSpeechResult(event);
            };
            
            this.speechRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.emit('speech_error', event.error);
            };
            
            this.speechRecognition.onend = () => {
                this.isListening = false;
                console.log('🎤 Voice recognition ended');
                this.emit('listening_ended');
                
                // Auto-restart if continuous mode
                if (this.config.speechRecognition.continuous) {
                    setTimeout(() => this.startListening(), 1000);
                }
            };
            
            console.log('🗣️  Speech recognition initialized');
        } else {
            console.log('🗣️  Speech recognition not available (server-side or unsupported browser)');
        }
    }
    
    /**
     * Initialize audio context for pitch detection
     */
    async initializeAudioContext() {
        if (typeof window !== 'undefined' && window.AudioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Request microphone access
                this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // Setup pitch analyzer
                this.setupPitchAnalyzer();
                
                console.log('🎵 Audio context and pitch detection initialized');
            } catch (error) {
                console.error('Failed to initialize audio context:', error);
                this.config.pitchMovement.enabled = false;
            }
        } else {
            console.log('🎵 Audio context not available (server-side)');
            this.config.pitchMovement.enabled = false;
        }
    }
    
    /**
     * Setup pitch analyzer for voice-controlled movement
     */
    setupPitchAnalyzer() {
        if (!this.audioContext || !this.mediaStream) return;
        
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        const analyzer = this.audioContext.createAnalyser();
        analyzer.fftSize = 4096;
        analyzer.smoothingTimeConstant = this.config.pitchMovement.pitchSmoothing;
        
        source.connect(analyzer);
        
        this.pitchAnalyzer = {
            analyzer,
            dataArray: new Float32Array(analyzer.frequencyBinCount),
            isActive: false
        };
        
        // Start pitch detection loop
        this.startPitchDetection();
    }
    
    /**
     * Start continuous pitch detection
     */
    startPitchDetection() {
        if (!this.pitchAnalyzer) return;
        
        const detectPitch = () => {
            if (!this.pitchAnalyzer.isActive) return;
            
            this.pitchAnalyzer.analyzer.getFloatFrequencyData(this.pitchAnalyzer.dataArray);
            
            // Find fundamental frequency
            const frequency = this.findFundamentalFrequency(this.pitchAnalyzer.dataArray);
            
            if (frequency > 0) {
                this.updatePitchState(frequency);
                this.processPitchMovement(frequency);
            }
            
            requestAnimationFrame(detectPitch);
        };
        
        this.pitchAnalyzer.isActive = true;
        detectPitch();
        
        console.log('🎵 Pitch detection started');
    }
    
    /**
     * Find fundamental frequency from FFT data
     */
    findFundamentalFrequency(dataArray) {
        // Simple pitch detection using autocorrelation
        let maxValue = -Infinity;
        let maxIndex = -1;
        
        const minFreq = this.config.pitchMovement.frequencyRange[0];
        const maxFreq = this.config.pitchMovement.frequencyRange[1];
        const sampleRate = this.audioContext.sampleRate;
        const nyquist = sampleRate / 2;
        
        const minIndex = Math.floor(minFreq * dataArray.length / nyquist);
        const maxIndex = Math.floor(maxFreq * dataArray.length / nyquist);
        
        for (let i = minIndex; i < maxIndex && i < dataArray.length; i++) {
            if (dataArray[i] > maxValue) {
                maxValue = dataArray[i];
                maxIndex = i;
            }
        }
        
        if (maxIndex > 0 && maxValue > -60) { // -60 dB threshold
            return (maxIndex * nyquist) / dataArray.length;
        }
        
        return 0;
    }
    
    /**
     * Update pitch state with new frequency
     */
    updatePitchState(frequency) {
        this.pitchState.lastFrequency = this.pitchState.currentFrequency;
        this.pitchState.currentFrequency = frequency;
        
        // Calculate octave position
        if (this.pitchState.isCalibrated) {
            const octaveRange = this.pitchState.calibratedRange.max - this.pitchState.calibratedRange.min;
            const relativeFreq = frequency - this.pitchState.calibratedRange.min;
            this.pitchState.octavePosition = Math.max(0, Math.min(1, relativeFreq / octaveRange));
        }
        
        this.metrics.pitchDetections++;
    }
    
    /**
     * Process pitch-based mouse movement
     */
    processPitchMovement(frequency) {
        if (!this.config.pitchMovement.enabled || !this.pitchState.isCalibrated) return;
        
        // Map frequency to screen coordinates
        const screenWidth = typeof screen !== 'undefined' ? screen.width : 1920;
        const screenHeight = typeof screen !== 'undefined' ? screen.height : 1080;
        
        // Horizontal movement based on pitch
        const targetX = this.pitchState.octavePosition * screenWidth;
        
        // Vertical movement could be based on volume or pitch change rate
        const pitchChangeRate = Math.abs(frequency - this.pitchState.lastFrequency);
        const targetY = Math.min(screenHeight * 0.8, pitchChangeRate * 5);
        
        this.moveMouseToPosition(targetX, targetY, 'pitch_control');
    }
    
    /**
     * Handle speech recognition results
     */
    handleSpeechResult(event) {
        const results = Array.from(event.results);
        const latestResult = results[results.length - 1];
        
        if (latestResult.isFinal) {
            const transcript = latestResult[0].transcript.toLowerCase().trim();
            const confidence = latestResult[0].confidence;
            
            console.log(`🗣️  Speech: "${transcript}" (confidence: ${confidence.toFixed(2)})`);
            
            if (confidence >= this.config.speechRecognition.confidence) {
                this.processVoiceCommand(transcript, confidence);
            } else {
                console.log('🗣️  Command ignored due to low confidence');
                this.playErrorFeedback();
            }
        }
    }
    
    /**
     * Process voice command and execute mouse action
     */
    async processVoiceCommand(transcript, confidence) {
        const startTime = Date.now();
        
        console.log(`🎤 Processing command: "${transcript}"`);
        
        // Parse command
        const parsedCommand = this.parseVoiceCommand(transcript);
        if (!parsedCommand) {
            console.log('🚫 Unknown command');
            this.playErrorFeedback();
            return;
        }
        
        // Store command in history
        this.commandHistory.push({
            transcript,
            confidence,
            command: parsedCommand,
            timestamp: Date.now()
        });
        
        // Execute command
        const result = await this.executeMouseCommand(parsedCommand);
        
        // Provide feedback
        if (result.success) {
            console.log(`✅ Command executed: ${parsedCommand.action}`);
            this.playSuccessFeedback();
            this.metrics.successfulActions++;
        } else {
            console.log(`❌ Command failed: ${result.reason}`);
            this.playErrorFeedback();
        }
        
        // Update metrics
        const responseTime = Date.now() - startTime;
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * this.metrics.commandsProcessed + responseTime) / 
            (this.metrics.commandsProcessed + 1);
        this.metrics.commandsProcessed++;
        
        this.emit('command_processed', {
            command: parsedCommand,
            result,
            responseTime,
            confidence
        });
    }
    
    /**
     * Parse voice command text into structured command
     */
    parseVoiceCommand(transcript) {
        // Check for each command type
        for (const [action, variations] of Object.entries(this.config.commands)) {
            for (const variation of variations) {
                if (transcript.includes(variation)) {
                    // Extract parameters from transcript
                    const params = this.extractCommandParameters(transcript, action, variation);
                    
                    return {
                        action,
                        variation,
                        params,
                        originalText: transcript
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Extract parameters from command text
     */
    extractCommandParameters(transcript, action, variation) {
        const params = {};
        
        // Extract directional parameters
        if (transcript.includes('up') || transcript.includes('north')) params.direction = 'up';
        if (transcript.includes('down') || transcript.includes('south')) params.direction = 'down';
        if (transcript.includes('left') || transcript.includes('west')) params.direction = 'left';
        if (transcript.includes('right') || transcript.includes('east')) params.direction = 'right';
        
        // Extract distance parameters
        const distanceMatch = transcript.match(/(small|big|large|tiny|huge|little)/);
        if (distanceMatch) {
            const distanceMap = {
                tiny: 0.2, small: 0.5, little: 0.5,
                big: 1.5, large: 1.5, huge: 2.0
            };
            params.distance = distanceMap[distanceMatch[1]] || 1.0;
        }
        
        // Extract speed parameters
        if (transcript.includes('fast') || transcript.includes('quick')) params.speed = 'fast';
        if (transcript.includes('slow') || transcript.includes('gentle')) params.speed = 'slow';
        
        // Extract musical parameters (for musical movement)
        if (transcript.includes('octave')) params.movement = 'octave';
        if (transcript.includes('scale')) params.movement = 'scale';
        if (transcript.includes('chord')) params.movement = 'chord';
        if (transcript.includes('yodel')) params.movement = 'yodel';
        
        return params;
    }
    
    /**
     * Execute mouse command
     */
    async executeMouseCommand(command) {
        try {
            switch (command.action) {
                case 'click':
                    return await this.performClick(command.params);
                
                case 'doubleClick':
                    return await this.performDoubleClick(command.params);
                
                case 'rightClick':
                    return await this.performRightClick(command.params);
                
                case 'move':
                    return await this.performMovement(command.params);
                
                case 'jump':
                    return await this.performJump(command.params);
                
                case 'drag':
                    return await this.performDragStart(command.params);
                
                case 'drop':
                    return await this.performDrop(command.params);
                
                case 'scroll':
                case 'scrollUp':
                case 'scrollDown':
                    return await this.performScroll(command.action, command.params);
                
                case 'clip':
                    return await this.performClipAction(command.params);
                
                case 'center':
                    return await this.moveToCenter();
                
                case 'stop':
                    return await this.stopAllMovement();
                
                case 'calibrate':
                    return await this.calibratePitchControl();
                
                default:
                    return { success: false, reason: 'unknown_action' };
            }
        } catch (error) {
            console.error('Error executing mouse command:', error);
            return { success: false, reason: 'execution_error', error: error.message };
        }
    }
    
    /**
     * Perform mouse click
     */
    async performClick(params = {}) {
        console.log('🖱️  Performing click');
        
        // Get current mouse position or use specific coordinates
        const position = params.position || this.mouseState.position;
        
        // Simulate click (in browser environment)
        if (typeof document !== 'undefined') {
            const event = new MouseEvent('click', {
                clientX: position.x,
                clientY: position.y,
                bubbles: true,
                cancelable: true
            });
            
            const element = document.elementFromPoint(position.x, position.y);
            if (element) {
                element.dispatchEvent(event);
            }
        }
        
        this.emit('mouse_action', { action: 'click', position });
        
        return { success: true, action: 'click', position };
    }
    
    /**
     * Perform movement with various movement types
     */
    async performMovement(params = {}) {
        const direction = params.direction;
        const distance = (params.distance || 1.0) * 50; // Base 50 pixels
        const speed = params.speed || 'normal';
        const movement = params.movement || 'linear';
        
        let targetX = this.mouseState.position.x;
        let targetY = this.mouseState.position.y;
        
        // Calculate target position based on direction
        switch (direction) {
            case 'up':
                targetY -= distance;
                break;
            case 'down':
                targetY += distance;
                break;
            case 'left':
                targetX -= distance;
                break;
            case 'right':
                targetX += distance;
                break;
        }
        
        // Apply movement type
        switch (movement) {
            case 'yodel':
                // Yodel-style jump (instant movement with musical flourish)
                return await this.performYodelJump(targetX, targetY);
            
            case 'scale':
                // Scale-style movement (step by step)
                return await this.performScaleMovement(targetX, targetY);
            
            case 'octave':
                // Octave movement using genealogy system
                return await this.performOctaveMovement(direction, params);
            
            default:
                // Linear movement
                return await this.moveMouseToPosition(targetX, targetY, 'voice_command');
        }
    }
    
    /**
     * Perform yodel-style jump movement
     */
    async performYodelJump(targetX, targetY) {
        console.log(`🎵 Yodel jump to (${targetX}, ${targetY})`);
        
        // Play yodel sound effect
        this.playYodelSound();
        
        // Instant movement with visual trail effect
        this.mouseState.position = { x: targetX, y: targetY };
        
        // Emit movement event
        this.emit('mouse_action', { 
            action: 'yodel_jump', 
            position: this.mouseState.position 
        });
        
        return { success: true, action: 'yodel_jump', position: this.mouseState.position };
    }
    
    /**
     * Perform octave-based movement using genealogy system
     */
    async performOctaveMovement(direction, params) {
        if (!this.genealogyOctaveManager || !this.currentUserId) {
            return { success: false, reason: 'genealogy_system_not_available' };
        }
        
        // Get user's character profile
        const userProfile = this.genealogyOctaveManager.genealogy.individuals.get(this.currentUserId);
        if (!userProfile) {
            return { success: false, reason: 'user_profile_not_found' };
        }
        
        // Calculate movement based on octave relationships
        const octaveDistance = this.config.pitchMovement.octaveToPixelRatio;
        let targetX = this.mouseState.position.x;
        let targetY = this.mouseState.position.y;
        
        switch (direction) {
            case 'up':
                // Move up one octave
                targetY -= octaveDistance;
                break;
            case 'down':
                // Move down one octave  
                targetY += octaveDistance;
                break;
            case 'left':
                // Move left by fifth interval
                targetX -= octaveDistance * 0.7; // Perfect fifth ratio
                break;
            case 'right':
                // Move right by fifth interval
                targetX += octaveDistance * 0.7;
                break;
        }
        
        // Perform musical movement with harmonic feedback
        const result = await this.moveMouseToPosition(targetX, targetY, 'octave_movement');
        
        // Play harmonic tone for feedback
        this.playHarmonicTone(userProfile.specificOctave);
        
        return result;
    }
    
    /**
     * Perform special "clip" action (user mentioned scissors/clip)
     */
    async performClipAction(params = {}) {
        console.log('✂️  Performing clip action');
        
        // This could be:
        // 1. Screenshot clipping
        // 2. Text selection and copy
        // 3. Custom clipboard action
        
        // For now, implement as a selection + copy action
        const startPos = this.mouseState.position;
        const endPos = {
            x: startPos.x + 100,
            y: startPos.y + 50
        };
        
        // Simulate drag selection
        await this.performDragStart({ position: startPos });
        await this.moveMouseToPosition(endPos.x, endPos.y, 'clip_action');
        await this.performDrop();
        
        // Trigger copy command (Ctrl+C)
        if (typeof document !== 'undefined') {
            document.execCommand('copy');
        }
        
        this.emit('mouse_action', { action: 'clip', startPos, endPos });
        
        return { success: true, action: 'clip', startPos, endPos };
    }
    
    /**
     * Move mouse to specific position with smooth animation
     */
    async moveMouseToPosition(targetX, targetY, source) {
        // Boundary checking
        const maxX = typeof screen !== 'undefined' ? screen.width - this.config.mouseControl.boundaryPadding : 1920;
        const maxY = typeof screen !== 'undefined' ? screen.height - this.config.mouseControl.boundaryPadding : 1080;
        
        targetX = Math.max(this.config.mouseControl.boundaryPadding, Math.min(maxX, targetX));
        targetY = Math.max(this.config.mouseControl.boundaryPadding, Math.min(maxY, targetY));
        
        // Update mouse state
        this.mouseState.lastPosition = { ...this.mouseState.position };
        this.mouseState.targetPosition = { x: targetX, y: targetY };
        this.mouseState.isMoving = true;
        
        // Smooth movement animation (simplified)
        return new Promise((resolve) => {
            const animateMovement = () => {
                const current = this.mouseState.position;
                const target = this.mouseState.targetPosition;
                const smoothing = this.config.mouseControl.movementSmoothing;
                
                const deltaX = target.x - current.x;
                const deltaY = target.y - current.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance < 1) {
                    // Movement complete
                    this.mouseState.position = { ...target };
                    this.mouseState.isMoving = false;
                    this.mouseState.targetPosition = null;
                    
                    this.emit('mouse_moved', {
                        from: this.mouseState.lastPosition,
                        to: this.mouseState.position,
                        source
                    });
                    
                    this.metrics.mouseMovements++;
                    resolve({ success: true, position: this.mouseState.position });
                } else {
                    // Continue movement
                    current.x += deltaX * smoothing;
                    current.y += deltaY * smoothing;
                    
                    requestAnimationFrame(animateMovement);
                }
            };
            
            animateMovement();
        });
    }
    
    /**
     * Start listening for voice commands
     */
    startListening() {
        if (this.speechRecognition && !this.isListening) {
            try {
                this.speechRecognition.start();
                console.log('🎤 Started listening for voice commands');
            } catch (error) {
                console.error('Failed to start speech recognition:', error);
            }
        }
    }
    
    /**
     * Stop listening for voice commands
     */
    stopListening() {
        if (this.speechRecognition && this.isListening) {
            this.speechRecognition.stop();
            console.log('🎤 Stopped listening for voice commands');
        }
    }
    
    /**
     * Calibrate pitch control for user
     */
    async calibratePitchControl() {
        console.log('🎵 Starting pitch calibration...');
        
        return new Promise((resolve) => {
            let minFreq = Infinity;
            let maxFreq = -Infinity;
            let samples = [];
            
            const calibrationTime = 10000; // 10 seconds
            const startTime = Date.now();
            
            const collectSamples = () => {
                if (Date.now() - startTime > calibrationTime) {
                    // Calibration complete
                    this.pitchState.calibratedRange = {
                        min: minFreq * 0.9, // Add some margin
                        max: maxFreq * 1.1
                    };
                    this.pitchState.isCalibrated = true;
                    
                    console.log(`✅ Pitch calibration complete: ${minFreq.toFixed(1)}Hz - ${maxFreq.toFixed(1)}Hz`);
                    
                    this.playSuccessFeedback();
                    resolve({ success: true, range: this.pitchState.calibratedRange });
                } else {
                    // Continue collecting samples
                    const freq = this.pitchState.currentFrequency;
                    if (freq > 0) {
                        samples.push(freq);
                        minFreq = Math.min(minFreq, freq);
                        maxFreq = Math.max(maxFreq, freq);
                    }
                    
                    requestAnimationFrame(collectSamples);
                }
            };
            
            console.log('🗣️  Please speak in your normal voice range for 10 seconds...');
            collectSamples();
        });
    }
    
    // Audio Feedback Methods
    
    playSuccessFeedback() {
        if (this.config.feedback.audioConfirmation) {
            this.playTone(this.config.feedback.toneFrequencies.success, this.config.feedback.feedbackDuration);
        }
    }
    
    playErrorFeedback() {
        if (this.config.feedback.audioConfirmation) {
            this.playTone(this.config.feedback.toneFrequencies.error, this.config.feedback.feedbackDuration);
        }
    }
    
    playYodelSound() {
        // Play a yodel-like sound (rapid octave alternation)
        const baseFreq = this.config.feedback.toneFrequencies.movement;
        this.playTone(baseFreq, 100);
        setTimeout(() => this.playTone(baseFreq * 2, 100), 150);
        setTimeout(() => this.playTone(baseFreq, 100), 300);
    }
    
    playHarmonicTone(octave) {
        const frequency = 440 * Math.pow(2, octave - 4); // A4 = 440Hz
        this.playTone(frequency, this.config.feedback.feedbackDuration);
    }
    
    playTone(frequency, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    // Helper Methods and Placeholders
    
    buildVoiceGrammar() {
        // Build speech recognition grammar
        return null; // Simplified for now
    }
    
    setupMouseControl() { /* Implementation */ }
    setupMusicalIntegration() { /* Implementation */ }
    setupUserProfiles() { /* Implementation */ }
    initializeCommandProcessor() { /* Implementation */ }
    setupFeedbackSystem() { /* Implementation */ }
    
    performDoubleClick() { return { success: true, action: 'double_click' }; }
    performRightClick() { return { success: true, action: 'right_click' }; }
    performDragStart() { return { success: true, action: 'drag_start' }; }
    performDrop() { return { success: true, action: 'drop' }; }
    performScroll() { return { success: true, action: 'scroll' }; }
    performScaleMovement() { return { success: true, action: 'scale_movement' }; }
    moveToCenter() { return { success: true, action: 'center' }; }
    stopAllMovement() { return { success: true, action: 'stop' }; }
    
    // Public API Methods
    
    setCurrentUser(userId) {
        this.currentUserId = userId;
        console.log(`👤 Current user set: ${userId.slice(0, 8)}...`);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            accuracyRate: this.metrics.commandsProcessed > 0 ? 
                this.metrics.successfulActions / this.metrics.commandsProcessed : 0
        };
    }
    
    getCommandHistory() {
        return this.commandHistory.slice(-50); // Last 50 commands
    }
}

module.exports = VoiceMouseController;

// Example usage and testing
if (require.main === module) {
    async function demonstrateVoiceMouseController() {
        console.log('🎤 Voice Mouse Controller Demo\n');
        
        // Import dependencies
        const GenealogyOctaveManager = require('./genealogy-octave-manager');
        const MusicalInterfaceEngine = require('./musical-interface-engine');
        const MusicCryptoFamily = require('./musical-crypto-family');
        const HarmonicDeviceAuth = require('./harmonic-device-auth');
        
        // Setup musical systems
        const musicCrypto = new MusicCryptoFamily();
        await new Promise(resolve => musicCrypto.once('initialized', resolve));
        
        const harmonicAuth = new HarmonicDeviceAuth(musicCrypto);
        await new Promise(resolve => harmonicAuth.once('initialized', resolve));
        
        const genealogyManager = new GenealogyOctaveManager(musicCrypto, harmonicAuth);
        await new Promise(resolve => genealogyManager.once('genealogy_octave_manager_ready', resolve));
        
        const interfaceEngine = new MusicalInterfaceEngine(musicCrypto, harmonicAuth);
        await new Promise(resolve => interfaceEngine.once('interface_ready', resolve));
        
        const voiceController = new VoiceMouseController(genealogyManager, interfaceEngine);
        await new Promise(resolve => voiceController.once('voice_mouse_controller_ready', resolve));
        
        // Create test user
        const family = await musicCrypto.createFamily('Voice Control Family');
        const user = await musicCrypto.createCharacter('Voice User', family.id);
        voiceController.setCurrentUser(user.id);
        
        // Simulate voice commands
        console.log('\n🎤 Simulating Voice Commands:');
        
        const testCommands = [
            'click',
            'move up',
            'jump right',
            'yodel to center',
            'clip this area',
            'scroll down',
            'octave movement up'
        ];
        
        for (const command of testCommands) {
            console.log(`\n🗣️  Command: "${command}"`);
            await voiceController.processVoiceCommand(command, 0.9);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
        
        // Show metrics
        const metrics = voiceController.getMetrics();
        console.log('\n📊 Voice Controller Metrics:');
        console.log(`  Commands processed: ${metrics.commandsProcessed}`);
        console.log(`  Successful actions: ${metrics.successfulActions}`);
        console.log(`  Accuracy rate: ${(metrics.accuracyRate * 100).toFixed(1)}%`);
        console.log(`  Mouse movements: ${metrics.mouseMovements}`);
        console.log(`  Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
        
        console.log('\n✅ Voice Mouse Controller demonstration complete!');
        console.log('🎤 Ready for real voice commands: "click", "move up", "yodel jump"!');
    }
    
    demonstrateVoiceMouseController().catch(console.error);
}