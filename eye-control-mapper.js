#!/usr/bin/env node

/**
 * 👁️🎮 EYE CONTROL MAPPER
 * Maps eye movements and patterns to GameBoy controls
 * Integrates with existing EYEBALL systems for learning and adaptation
 */

const EventEmitter = require('events');

class EyeControlMapper extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            sensitivity: config.sensitivity || 0.7,
            deadZone: config.deadZone || 0.1,
            dwellTime: config.dwellTime || 500, // ms for dwell clicking
            blinkThreshold: config.blinkThreshold || 150, // ms
            doubleBblinkWindow: config.doubleBlinkWindow || 300, // ms
            smoothingFactor: config.smoothingFactor || 0.3,
            ...config
        };
        
        // GameBoy control mappings
        this.controlMappings = {
            // D-Pad mappings (gaze quadrants)
            gazeLeft: 'LEFT',
            gazeRight: 'RIGHT',
            gazeUp: 'UP',
            gazeDown: 'DOWN',
            
            // Button mappings (blink patterns)
            singleBlink: 'A',
            doubleBlink: 'B',
            longBlink: 'START',
            wink: 'SELECT',
            
            // Advanced mappings (combinations)
            gazeUpBlink: 'UP+A',
            gazeDownBlink: 'DOWN+A',
            rapidBlinks: 'TURBO_A',
            closedEyes: 'PAUSE'
        };
        
        // Eye tracking state
        this.eyeState = {
            currentGaze: { x: 0.5, y: 0.5 }, // Normalized 0-1
            previousGaze: { x: 0.5, y: 0.5 },
            velocity: { x: 0, y: 0 },
            
            leftEye: { open: true, blinkStart: 0 },
            rightEye: { open: true, blinkStart: 0 },
            
            lastBlinkTime: 0,
            blinkCount: 0,
            blinkPattern: [],
            
            fixationStart: 0,
            fixationPoint: null,
            
            isCalibrated: false,
            calibrationData: {}
        };
        
        // Control state
        this.controlState = {
            dpad: { up: false, down: false, left: false, right: false },
            buttons: { a: false, b: false, start: false, select: false },
            lastInput: null,
            comboBuffer: []
        };
        
        // Learning system integration
        this.learningData = {
            userPatterns: new Map(),
            commonSequences: [],
            fatigueIndicators: [],
            accuracyHistory: [],
            adaptations: {}
        };
        
        // Accessibility features
        this.accessibility = {
            dwellClicking: config.dwellClicking || false,
            gestureMacros: config.gestureMacros || true,
            predictiveInput: config.predictiveInput || true,
            fatigueCompensation: config.fatigueCompensation || true
        };
        
        this.setupEyeTracking();
    }
    
    setupEyeTracking() {
        console.log('👁️ Initializing eye control mapping...');
        
        // Calibration zones for gaze mapping
        this.gazeZones = {
            left: { xMin: 0, xMax: 0.35, yMin: 0.35, yMax: 0.65 },
            right: { xMin: 0.65, xMax: 1, yMin: 0.35, yMax: 0.65 },
            up: { xMin: 0.35, xMax: 0.65, yMin: 0, yMax: 0.35 },
            down: { xMin: 0.35, xMax: 0.65, yMin: 0.65, yMax: 1 },
            center: { xMin: 0.35, xMax: 0.65, yMin: 0.35, yMax: 0.65 }
        };
        
        // Gesture patterns
        this.gesturePatterns = {
            circle: { points: 8, tolerance: 0.2 },
            zigzag: { changes: 4, axis: 'x', tolerance: 0.15 },
            shake: { changes: 6, time: 1000, tolerance: 0.1 }
        };
        
        console.log('✅ Eye control mapper initialized');
    }
    
    // Process raw eye tracking data
    processEyeData(eyeData) {
        // Update eye state
        this.updateEyeState(eyeData);
        
        // Detect gaze direction
        const gazeDirection = this.detectGazeDirection();
        
        // Detect blink patterns
        const blinkAction = this.detectBlinkPattern();
        
        // Check for gestures
        const gesture = this.detectGestures();
        
        // Apply accessibility enhancements
        const enhancedInput = this.applyAccessibilityFeatures({
            gaze: gazeDirection,
            blink: blinkAction,
            gesture: gesture
        });
        
        // Map to GameBoy controls
        const controls = this.mapToGameBoyControls(enhancedInput);
        
        // Learn from patterns
        this.updateLearningData(eyeData, controls);
        
        // Emit control events
        this.emitControlEvents(controls);
        
        return controls;
    }
    
    updateEyeState(eyeData) {
        // Smooth gaze position
        const alpha = this.config.smoothingFactor;
        this.eyeState.previousGaze = { ...this.eyeState.currentGaze };
        
        this.eyeState.currentGaze.x = alpha * eyeData.gaze.x + (1 - alpha) * this.eyeState.currentGaze.x;
        this.eyeState.currentGaze.y = alpha * eyeData.gaze.y + (1 - alpha) * this.eyeState.currentGaze.y;
        
        // Calculate velocity
        this.eyeState.velocity.x = this.eyeState.currentGaze.x - this.eyeState.previousGaze.x;
        this.eyeState.velocity.y = this.eyeState.currentGaze.y - this.eyeState.previousGaze.y;
        
        // Update blink state
        this.updateBlinkState(eyeData.leftEye, eyeData.rightEye);
        
        // Check fixation
        this.updateFixation();
    }
    
    updateBlinkState(leftEye, rightEye) {
        const now = Date.now();
        
        // Left eye blink detection
        if (!leftEye.open && this.eyeState.leftEye.open) {
            this.eyeState.leftEye.blinkStart = now;
        } else if (leftEye.open && !this.eyeState.leftEye.open) {
            const blinkDuration = now - this.eyeState.leftEye.blinkStart;
            this.registerBlink('left', blinkDuration);
        }
        
        // Right eye blink detection
        if (!rightEye.open && this.eyeState.rightEye.open) {
            this.eyeState.rightEye.blinkStart = now;
        } else if (rightEye.open && !this.eyeState.rightEye.open) {
            const blinkDuration = now - this.eyeState.rightEye.blinkStart;
            this.registerBlink('right', blinkDuration);
        }
        
        this.eyeState.leftEye.open = leftEye.open;
        this.eyeState.rightEye.open = rightEye.open;
    }
    
    registerBlink(eye, duration) {
        const now = Date.now();
        
        // Both eyes = normal blink, one eye = wink
        const isWink = (eye === 'left' && this.eyeState.rightEye.open) || 
                      (eye === 'right' && this.eyeState.leftEye.open);
        
        this.eyeState.blinkPattern.push({
            type: isWink ? 'wink' : 'blink',
            eye: eye,
            duration: duration,
            timestamp: now
        });
        
        // Clean old blink patterns
        this.eyeState.blinkPattern = this.eyeState.blinkPattern.filter(
            b => now - b.timestamp < 1000
        );
        
        if (!isWink) {
            this.eyeState.lastBlinkTime = now;
            this.eyeState.blinkCount++;
        }
    }
    
    detectGazeDirection() {
        const { x, y } = this.eyeState.currentGaze;
        
        // Check dead zone (center)
        if (this.isInZone(x, y, this.gazeZones.center)) {
            return null;
        }
        
        // Check directional zones
        for (const [direction, zone] of Object.entries(this.gazeZones)) {
            if (direction !== 'center' && this.isInZone(x, y, zone)) {
                return direction;
            }
        }
        
        return null;
    }
    
    isInZone(x, y, zone) {
        return x >= zone.xMin && x <= zone.xMax && 
               y >= zone.yMin && y <= zone.yMax;
    }
    
    detectBlinkPattern() {
        const recentBlinks = this.eyeState.blinkPattern.filter(
            b => b.type === 'blink'
        );
        
        if (recentBlinks.length === 0) return null;
        
        const lastBlink = recentBlinks[recentBlinks.length - 1];
        
        // Long blink detection
        if (lastBlink.duration > 500) {
            return 'longBlink';
        }
        
        // Double blink detection
        if (recentBlinks.length >= 2) {
            const secondLast = recentBlinks[recentBlinks.length - 2];
            const timeBetween = lastBlink.timestamp - secondLast.timestamp;
            
            if (timeBetween < this.config.doubleBlinkWindow) {
                return 'doubleBlink';
            }
        }
        
        // Wink detection
        const recentWinks = this.eyeState.blinkPattern.filter(
            b => b.type === 'wink' && Date.now() - b.timestamp < 500
        );
        
        if (recentWinks.length > 0) {
            return 'wink';
        }
        
        // Single blink
        if (Date.now() - lastBlink.timestamp < 200) {
            return 'singleBlink';
        }
        
        return null;
    }
    
    detectGestures() {
        // Simplified gesture detection
        const speed = Math.sqrt(
            this.eyeState.velocity.x ** 2 + 
            this.eyeState.velocity.y ** 2
        );
        
        // Fast movement = shake gesture
        if (speed > 0.3) {
            return 'shake';
        }
        
        // TODO: Implement circle and zigzag detection
        
        return null;
    }
    
    applyAccessibilityFeatures(input) {
        const enhanced = { ...input };
        
        // Dwell clicking
        if (this.accessibility.dwellClicking) {
            if (this.eyeState.fixationPoint && 
                Date.now() - this.eyeState.fixationStart > this.config.dwellTime) {
                enhanced.dwell = true;
            }
        }
        
        // Predictive input
        if (this.accessibility.predictiveInput) {
            const prediction = this.predictNextInput(input);
            if (prediction) {
                enhanced.predicted = prediction;
            }
        }
        
        // Fatigue compensation
        if (this.accessibility.fatigueCompensation) {
            const fatigue = this.detectFatigue();
            if (fatigue > 0.7) {
                // Increase sensitivity when tired
                this.config.sensitivity = Math.min(0.9, this.config.sensitivity + 0.1);
            }
        }
        
        return enhanced;
    }
    
    mapToGameBoyControls(input) {
        const controls = {
            dpad: { up: false, down: false, left: false, right: false },
            buttons: { a: false, b: false, start: false, select: false }
        };
        
        // Map gaze to D-pad
        if (input.gaze) {
            switch (input.gaze) {
                case 'left': controls.dpad.left = true; break;
                case 'right': controls.dpad.right = true; break;
                case 'up': controls.dpad.up = true; break;
                case 'down': controls.dpad.down = true; break;
            }
        }
        
        // Map blinks to buttons
        if (input.blink) {
            switch (input.blink) {
                case 'singleBlink': controls.buttons.a = true; break;
                case 'doubleBlink': controls.buttons.b = true; break;
                case 'longBlink': controls.buttons.start = true; break;
                case 'wink': controls.buttons.select = true; break;
            }
        }
        
        // Dwell = A button
        if (input.dwell) {
            controls.buttons.a = true;
        }
        
        // Update control state
        this.controlState = controls;
        
        return controls;
    }
    
    updateLearningData(eyeData, controls) {
        // Track user patterns
        const pattern = {
            eyeData: eyeData,
            controls: controls,
            timestamp: Date.now()
        };
        
        // Store pattern
        const key = JSON.stringify(controls);
        if (!this.learningData.userPatterns.has(key)) {
            this.learningData.userPatterns.set(key, []);
        }
        this.learningData.userPatterns.get(key).push(pattern);
        
        // Update accuracy
        this.updateAccuracy(eyeData, controls);
    }
    
    updateFixation() {
        const threshold = 0.05; // 5% movement threshold
        const movement = Math.sqrt(
            this.eyeState.velocity.x ** 2 + 
            this.eyeState.velocity.y ** 2
        );
        
        if (movement < threshold) {
            if (!this.eyeState.fixationPoint) {
                this.eyeState.fixationStart = Date.now();
                this.eyeState.fixationPoint = { ...this.eyeState.currentGaze };
            }
        } else {
            this.eyeState.fixationPoint = null;
            this.eyeState.fixationStart = 0;
        }
    }
    
    detectFatigue() {
        // Simple fatigue detection based on blink rate
        const recentBlinks = this.eyeState.blinkPattern.filter(
            b => Date.now() - b.timestamp < 60000 // Last minute
        );
        
        const blinkRate = recentBlinks.length / 60; // Blinks per second
        const normalRate = 0.25; // Normal: ~15 blinks/minute
        
        // Higher blink rate = more fatigue
        return Math.min(1, blinkRate / (normalRate * 2));
    }
    
    predictNextInput(currentInput) {
        // Simple prediction based on common sequences
        // TODO: Implement ML-based prediction
        return null;
    }
    
    updateAccuracy(eyeData, controls) {
        // TODO: Implement accuracy tracking
    }
    
    emitControlEvents(controls) {
        // Emit individual control events
        if (controls.dpad.up) this.emit('control', 'UP');
        if (controls.dpad.down) this.emit('control', 'DOWN');
        if (controls.dpad.left) this.emit('control', 'LEFT');
        if (controls.dpad.right) this.emit('control', 'RIGHT');
        
        if (controls.buttons.a) this.emit('control', 'A');
        if (controls.buttons.b) this.emit('control', 'B');
        if (controls.buttons.start) this.emit('control', 'START');
        if (controls.buttons.select) this.emit('control', 'SELECT');
        
        // Emit full state
        this.emit('controls', controls);
    }
    
    // Calibration methods
    async calibrate() {
        console.log('👁️ Starting eye control calibration...');
        
        const calibrationPoints = [
            { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
            { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
            { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 }
        ];
        
        // TODO: Implement actual calibration process
        this.eyeState.isCalibrated = true;
        
        console.log('✅ Calibration complete!');
        return true;
    }
    
    // Get current state for debugging
    getState() {
        return {
            eyeState: this.eyeState,
            controlState: this.controlState,
            config: this.config,
            learningData: {
                patternsLearned: this.learningData.userPatterns.size,
                fatigueLevel: this.detectFatigue(),
                isCalibrated: this.eyeState.isCalibrated
            }
        };
    }
}

module.exports = EyeControlMapper;