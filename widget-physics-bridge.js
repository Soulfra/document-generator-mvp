#!/usr/bin/env node

/**
 * Widget Physics Bridge
 * 
 * Bridges the Floating Interactive Widget with the Advanced Mascot Physics system
 * to apply bird/mammal-inspired natural movement to the widget.
 * 
 * Features:
 * - Integration with Advanced Mascot Physics
 * - Bird-like head tracking and stabilization
 * - Mammal spine flexibility and balance
 * - Soft body dynamics for organic feel
 * - Environmental awareness and collision
 * - Natural behavioral state machines
 * - Physics-based animations
 */

const EventEmitter = require('events');

class WidgetPhysicsBridge extends EventEmitter {
    constructor(widget, config = {}) {
        super();
        
        this.widget = widget;
        
        this.config = {
            // Physics integration
            physics: {
                enableAdvancedPhysics: true,
                inheritMascotBehaviors: true,
                physicsIntensity: 0.7,              // Scale physics effects
                environmentalAwareness: true,
                collisionSensitivity: 0.8,
                responseTime: 0.1
            },
            
            // Bird mechanics adaptation
            birdMechanics: {
                headTracking: {
                    enabled: true,
                    leadTime: 0.15,                  // Head moves before body
                    stabilization: true,             // Keep orientation steady
                    trackingIntensity: 0.6,
                    maxRotation: Math.PI / 6         // 30 degrees max
                },
                wingBalance: {
                    enabled: true,
                    sensitivity: 0.5,
                    responseTime: 0.08,
                    visualEffect: true,              // Show wing-like effects
                    balanceThreshold: 0.2
                },
                locomotion: {
                    hopHeight: 0.3,
                    glideDistance: 1.5,
                    turnRadius: 0.2,
                    acceleration: 12,
                    dartingMovement: true
                }
            },
            
            // Mammal mechanics adaptation
            mammalMechanics: {
                spineFlexibility: {
                    enabled: true,
                    segments: 3,                     // Simplified for widget
                    maxBend: Math.PI / 8,
                    twistRange: Math.PI / 12,
                    compression: 0.08
                },
                balanceSystem: {
                    enabled: true,
                    stabilityThreshold: 0.9,
                    recoverSpeed: 0.25,
                    footPlacement: 'dynamic'
                },
                muscleTension: {
                    restingTension: 0.2,
                    activeTension: 0.6,
                    fatigueRate: 0.005,
                    recoveryRate: 0.015
                }
            },
            
            // Soft body simulation
            softBody: {
                enabled: true,
                stiffness: 0.6,
                damping: 0.85,
                pressure: 0.8,
                deformation: true,
                visualFeedback: true
            },
            
            // Behavioral states
            behavior: {
                enableStateMachine: true,
                states: ['idle', 'curious', 'alert', 'playful', 'resting'],
                transitionSmoothness: 0.3,
                emotionalResponse: true,
                contextAwareness: true
            },
            
            // Environmental interaction
            environment: {
                windResponse: true,
                gravityAwareness: true,
                surfaceAdaptation: true,
                obstacleAvoidance: true,
                territorialBehavior: false
            },
            
            // Visual effects
            visual: {
                showPhysicsDebug: config.debug || false,
                animateDeformation: true,
                particleEffects: false,
                trailEffects: false,
                breathingAnimation: true
            }
        };
        
        this.state = {
            // Physics state
            physicsActive: false,
            currentBehavior: 'idle',
            emotionalState: {
                happiness: 0.7,
                energy: 0.8,
                curiosity: 0.6,
                comfort: 0.9
            },
            
            // Bird mechanics state
            birdState: {
                headPosition: { x: 0, y: 0, rotation: 0 },
                wingPosition: { left: 0, right: 0 },
                balance: { x: 0, y: 0 },
                lastMovement: { x: 0, y: 0 }
            },
            
            // Mammal mechanics state  
            mammalState: {
                spineSegments: [],
                muscleTension: 0.2,
                fatigue: 0,
                groundContact: true,
                balanceCenter: { x: 0, y: 0 }
            },
            
            // Soft body state
            softBodyState: {
                deformation: { x: 0, y: 0, scale: 1 },
                pressure: 1.0,
                elasticity: 1.0,
                currentStiffness: 0.6
            },
            
            // Environmental state
            environmentState: {
                windDirection: { x: 0, y: 0 },
                windStrength: 0,
                nearbyObstacles: [],
                surfaceType: 'smooth',
                temperature: 'comfortable'
            },
            
            // Animation timing
            timing: {
                lastUpdate: Date.now(),
                breathingPhase: 0,
                heartbeatPhase: 0,
                idleAnimationPhase: 0
            },
            
            // Performance tracking
            performance: {
                updateCount: 0,
                frameTime: 0,
                physicsTime: 0
            }
        };
        
        // Animation and physics loops
        this.animationFrame = null;
        this.physicsInterval = null;
        
        // Initialize the physics bridge
        this.initializePhysicsBridge();
        
        console.log('🦅 Widget Physics Bridge initialized');
        console.log(`🧬 Advanced physics: ${this.config.physics.enableAdvancedPhysics ? 'enabled' : 'disabled'}`);
        console.log(`🐦 Bird mechanics: ${this.config.birdMechanics.headTracking.enabled ? 'enabled' : 'disabled'}`);
        console.log(`🐾 Mammal mechanics: ${this.config.mammalMechanics.spineFlexibility.enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Initialize the physics bridge system
     */
    async initializePhysicsBridge() {
        try {
            // Initialize physics components
            this.initializePhysicsComponents();
            
            // Setup behavioral state machine
            this.setupBehavioralStateMachine();
            
            // Initialize environmental sensors
            this.initializeEnvironmentalSensors();
            
            // Setup widget event listeners
            this.setupWidgetEventListeners();
            
            // Start physics simulation
            this.startPhysicsSimulation();
            
            // Start animation loop
            this.startAnimationLoop();
            
            console.log('✅ Physics bridge ready');
            this.emit('physics:ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize physics bridge:', error);
            throw error;
        }
    }
    
    /**
     * Initialize physics components
     */
    initializePhysicsComponents() {
        // Initialize spine segments for mammal mechanics
        if (this.config.mammalMechanics.spineFlexibility.enabled) {
            this.initializeSpineSegments();
        }
        
        // Initialize soft body points
        if (this.config.softBody.enabled) {
            this.initializeSoftBody();
        }
        
        // Initialize bird mechanics
        if (this.config.birdMechanics.headTracking.enabled) {
            this.initializeBirdMechanics();
        }
        
        console.log('🔧 Physics components initialized');
    }
    
    /**
     * Initialize spine segments for flexible movement
     */
    initializeSpineSegments() {
        const segmentCount = this.config.mammalMechanics.spineFlexibility.segments;
        this.state.mammalState.spineSegments = [];
        
        for (let i = 0; i < segmentCount; i++) {
            this.state.mammalState.spineSegments.push({
                index: i,
                position: { x: 0, y: i * 0.2 },
                rotation: 0,
                velocity: { x: 0, y: 0 },
                tension: 0.2,
                flexibility: 1.0 - (i / segmentCount) * 0.3  // Base more flexible
            });
        }
    }
    
    /**
     * Initialize soft body simulation
     */
    initializeSoftBody() {
        this.state.softBodyState = {
            deformation: { x: 0, y: 0, scale: 1 },
            pressure: 1.0,
            elasticity: 1.0,
            currentStiffness: this.config.softBody.stiffness,
            restShape: { width: 1, height: 1 },
            currentShape: { width: 1, height: 1 }
        };
    }
    
    /**
     * Initialize bird mechanics
     */
    initializeBirdMechanics() {
        this.state.birdState = {
            headPosition: { x: 0, y: 0, rotation: 0 },
            wingPosition: { left: 0, right: 0 },
            balance: { x: 0, y: 0 },
            lastMovement: { x: 0, y: 0 },
            isStabilizing: false,
            targetDirection: 0
        };
    }
    
    /**
     * Setup behavioral state machine
     */
    setupBehavioralStateMachine() {
        if (!this.config.behavior.enableStateMachine) return;
        
        this.behaviorStates = {
            idle: {
                name: 'idle',
                duration: { min: 5000, max: 15000 },
                transitions: {
                    curious: { probability: 0.3, conditions: ['movement_nearby'] },
                    playful: { probability: 0.2, conditions: ['user_interaction'] },
                    alert: { probability: 0.1, conditions: ['sudden_change'] }
                },
                animations: ['gentle_sway', 'breathing', 'blink'],
                effects: { energy: -0.01, comfort: +0.02 }
            },
            
            curious: {
                name: 'curious',
                duration: { min: 2000, max: 8000 },
                transitions: {
                    idle: { probability: 0.4, conditions: [] },
                    alert: { probability: 0.3, conditions: ['interesting_content'] },
                    playful: { probability: 0.2, conditions: ['user_engagement'] }
                },
                animations: ['head_tilt', 'eye_track', 'slight_lean'],
                effects: { curiosity: +0.1, energy: -0.02 }
            },
            
            playful: {
                name: 'playful',
                duration: { min: 3000, max: 10000 },
                transitions: {
                    idle: { probability: 0.5, conditions: [] },
                    curious: { probability: 0.3, conditions: [] },
                    resting: { probability: 0.2, conditions: ['low_energy'] }
                },
                animations: ['bounce', 'wiggle', 'spin', 'color_shift'],
                effects: { happiness: +0.1, energy: -0.05 }
            },
            
            alert: {
                name: 'alert',
                duration: { min: 1000, max: 5000 },
                transitions: {
                    curious: { probability: 0.4, conditions: [] },
                    idle: { probability: 0.4, conditions: ['no_threat'] },
                    playful: { probability: 0.2, conditions: ['false_alarm'] }
                },
                animations: ['straighten', 'scan', 'heightened_awareness'],
                effects: { energy: +0.03, comfort: -0.05 }
            },
            
            resting: {
                name: 'resting',
                duration: { min: 8000, max: 20000 },
                transitions: {
                    idle: { probability: 0.6, conditions: ['energy_restored'] },
                    curious: { probability: 0.3, conditions: ['interesting_stimulus'] },
                    alert: { probability: 0.1, conditions: ['disturbance'] }
                },
                animations: ['slow_breathing', 'settle', 'dim_glow'],
                effects: { energy: +0.03, comfort: +0.05 }
            }
        };
        
        // Set initial state
        this.currentBehaviorState = this.behaviorStates.idle;
        this.behaviorStartTime = Date.now();
        
        console.log('🧠 Behavioral state machine setup');
    }
    
    /**
     * Initialize environmental sensors
     */
    initializeEnvironmentalSensors() {
        if (!this.config.environment.windResponse) return;
        
        // Setup wind simulation
        this.windSimulation = {
            enabled: true,
            direction: { x: 0, y: 0 },
            strength: 0,
            variation: 0.1,
            lastUpdate: Date.now()
        };
        
        // Simulate gentle environmental changes
        setInterval(() => {
            this.updateEnvironmentalConditions();
        }, 2000);
        
        console.log('🌬️ Environmental sensors initialized');
    }
    
    /**
     * Setup widget event listeners
     */
    setupWidgetEventListeners() {
        // Listen to widget events
        this.widget.on('widget:activated', () => {
            this.state.physicsActive = true;
            this.transitionToBehavior('alert');
        });
        
        this.widget.on('widget:deactivated', () => {
            this.state.physicsActive = false;
        });
        
        this.widget.on('widget:clicked', () => {
            this.transitionToBehavior('playful');
            this.applyClickResponse();
        });
        
        this.widget.on('widget:doubleClicked', () => {
            this.applyDoubleClickResponse();
        });
        
        // Listen to mouse events for head tracking
        if (this.config.birdMechanics.headTracking.enabled) {
            document.addEventListener('mousemove', (e) => {
                this.updateHeadTracking(e.clientX, e.clientY);
            });
        }
        
        console.log('👂 Widget event listeners setup');
    }
    
    /**
     * Start physics simulation loop
     */
    startPhysicsSimulation() {
        const physicsLoop = () => {
            if (!this.state.physicsActive) {
                this.physicsInterval = setTimeout(physicsLoop, 16); // 60 FPS
                return;
            }
            
            const startTime = performance.now();
            const now = Date.now();
            const deltaTime = (now - this.state.timing.lastUpdate) / 1000;
            this.state.timing.lastUpdate = now;
            
            // Update physics systems
            this.updateBirdMechanics(deltaTime);
            this.updateMammalMechanics(deltaTime);
            this.updateSoftBodyPhysics(deltaTime);
            this.updateBehavioralState(deltaTime);
            this.updateEnvironmentalEffects(deltaTime);
            
            // Apply physics to widget
            this.applyPhysicsToWidget();
            
            // Performance tracking
            this.state.performance.physicsTime = performance.now() - startTime;
            this.state.performance.updateCount++;
            
            // Continue loop
            this.physicsInterval = setTimeout(physicsLoop, 16);
        };
        
        physicsLoop();
        console.log('⚡ Physics simulation started');
    }
    
    /**
     * Start animation loop
     */
    startAnimationLoop() {
        const animationLoop = () => {
            if (!this.state.physicsActive) {
                this.animationFrame = requestAnimationFrame(animationLoop);
                return;
            }
            
            const startTime = performance.now();
            
            // Update animation phases
            this.updateAnimationPhases();
            
            // Apply visual effects
            this.applyVisualEffects();
            
            // Performance tracking
            this.state.performance.frameTime = performance.now() - startTime;
            
            // Continue loop
            this.animationFrame = requestAnimationFrame(animationLoop);
        };
        
        animationLoop();
        console.log('🎬 Animation loop started');
    }
    
    /**
     * Update bird mechanics
     */
    updateBirdMechanics(deltaTime) {
        if (!this.config.birdMechanics.headTracking.enabled) return;
        
        const bird = this.state.birdState;
        const widget = this.widget.state;
        
        // Head stabilization during movement
        if (this.config.birdMechanics.headTracking.stabilization) {
            const movement = Math.sqrt(widget.velocity.x ** 2 + widget.velocity.y ** 2);
            if (movement > 0.1) {
                // Counter-rotate head to maintain stability
                const stabilizationForce = -movement * 0.3;
                bird.headPosition.rotation += stabilizationForce * deltaTime;
                bird.isStabilizing = true;
            } else {
                bird.isStabilizing = false;
            }
        }
        
        // Wing balance for stability
        if (this.config.birdMechanics.wingBalance.enabled) {
            const tilt = this.calculateWidgetTilt();
            if (Math.abs(tilt) > this.config.birdMechanics.wingBalance.balanceThreshold) {
                const balanceCorrection = -tilt * this.config.birdMechanics.wingBalance.sensitivity;
                bird.wingPosition.left = Math.max(-1, Math.min(1, balanceCorrection));
                bird.wingPosition.right = Math.max(-1, Math.min(1, -balanceCorrection));
                
                // Apply visual wing effects
                if (this.config.birdMechanics.wingBalance.visualEffect) {
                    this.applyWingBalanceEffect(bird.wingPosition);
                }
            }
        }
        
        // Smooth head position interpolation
        bird.headPosition.rotation *= 0.95; // Damping
        bird.wingPosition.left *= 0.9;
        bird.wingPosition.right *= 0.9;
    }
    
    /**
     * Update mammal mechanics
     */
    updateMammalMechanics(deltaTime) {
        if (!this.config.mammalMechanics.spineFlexibility.enabled) return;
        
        const mammal = this.state.mammalState;
        const widget = this.widget.state;
        
        // Update spine flexibility based on movement
        const movement = widget.velocity;
        const turnRate = this.calculateTurnRate();
        
        mammal.spineSegments.forEach((segment, index) => {
            const bendAmount = Math.sin(index / mammal.spineSegments.length * Math.PI);
            
            // Apply turn-based bending
            const targetRotation = turnRate * bendAmount * this.config.mammalMechanics.spineFlexibility.maxBend;
            segment.rotation += (targetRotation - segment.rotation) * 0.1;
            
            // Apply movement-based compression
            const compression = movement.y * bendAmount * this.config.mammalMechanics.spineFlexibility.compression;
            segment.position.y = index * 0.2 + compression;
        });
        
        // Update muscle tension
        const activity = Math.sqrt(movement.x ** 2 + movement.y ** 2);
        const targetTension = this.config.mammalMechanics.muscleTension.restingTension + 
                            activity * this.config.mammalMechanics.muscleTension.activeTension;
        
        mammal.muscleTension += (targetTension - mammal.muscleTension) * 0.1;
        
        // Apply fatigue
        if (activity > 0.5) {
            mammal.fatigue += this.config.mammalMechanics.muscleTension.fatigueRate * deltaTime;
        } else {
            mammal.fatigue -= this.config.mammalMechanics.muscleTension.recoveryRate * deltaTime;
        }
        
        mammal.fatigue = Math.max(0, Math.min(1, mammal.fatigue));
    }
    
    /**
     * Update soft body physics
     */
    updateSoftBodyPhysics(deltaTime) {
        if (!this.config.softBody.enabled) return;
        
        const softBody = this.state.softBodyState;
        const widget = this.widget.state;
        
        // Calculate deformation based on forces
        const velocity = Math.sqrt(widget.velocity.x ** 2 + widget.velocity.y ** 2);
        const acceleration = widget.forces ? Math.sqrt(widget.forces.x ** 2 + widget.forces.y ** 2) : 0;
        
        // Horizontal deformation from movement
        const stretchX = velocity * 0.1;
        softBody.deformation.x += (stretchX - softBody.deformation.x) * 0.2;
        
        // Vertical deformation from acceleration
        const compressY = acceleration * 0.05;
        softBody.deformation.y += (compressY - softBody.deformation.y) * 0.15;
        
        // Scale deformation
        const targetScale = 1 + Math.sin(this.state.timing.breathingPhase) * 0.02;
        softBody.deformation.scale += (targetScale - softBody.deformation.scale) * 0.1;
        
        // Update pressure based on deformation
        const totalDeformation = Math.abs(softBody.deformation.x) + Math.abs(softBody.deformation.y);
        softBody.pressure = Math.max(0.8, 1.0 - totalDeformation * 0.5);
        
        // Apply visual deformation if enabled
        if (this.config.softBody.visualFeedback) {
            this.applySoftBodyDeformation(softBody);
        }
    }
    
    /**
     * Update behavioral state
     */
    updateBehavioralState(deltaTime) {
        if (!this.config.behavior.enableStateMachine) return;
        
        const now = Date.now();
        const stateTime = now - this.behaviorStartTime;
        const currentState = this.currentBehaviorState;
        
        // Update emotional state
        this.updateEmotionalState(deltaTime);
        
        // Check for state transitions
        if (stateTime > currentState.duration.min) {
            // Random transition chance
            if (Math.random() < 0.02) { // 2% chance per frame
                const possibleTransitions = Object.entries(currentState.transitions);
                
                for (const [stateName, transition] of possibleTransitions) {
                    if (Math.random() < transition.probability) {
                        const conditionsMet = this.checkBehaviorConditions(transition.conditions);
                        if (conditionsMet) {
                            this.transitionToBehavior(stateName);
                            break;
                        }
                    }
                }
            }
        }
        
        // Force transition if state too long
        if (stateTime > currentState.duration.max) {
            this.transitionToBehavior('idle');
        }
    }
    
    /**
     * Update environmental effects
     */
    updateEnvironmentalEffects(deltaTime) {
        // Apply wind effects
        if (this.config.environment.windResponse && this.windSimulation.enabled) {
            const wind = this.state.environmentState.windDirection;
            const strength = this.state.environmentState.windStrength;
            
            // Apply wind force to widget
            if (this.widget.state.forces && strength > 0.1) {
                this.widget.state.forces.x += wind.x * strength * 0.1;
                this.widget.state.forces.y += wind.y * strength * 0.1;
            }
        }
        
        // Apply gravity awareness
        if (this.config.environment.gravityAwareness) {
            this.applyGravityAwareness();
        }
    }
    
    /**
     * Apply physics effects to widget visual
     */
    applyPhysicsToWidget() {
        const widgetElement = this.widget.elements?.widget;
        if (!widgetElement) return;
        
        let transforms = [];
        
        // Apply bird head tracking
        if (this.config.birdMechanics.headTracking.enabled) {
            const headRotation = this.state.birdState.headPosition.rotation;
            if (Math.abs(headRotation) > 0.01) {
                transforms.push(`rotate(${headRotation * 180 / Math.PI}deg)`);
            }
        }
        
        // Apply soft body deformation
        if (this.config.softBody.enabled && this.config.softBody.visualFeedback) {
            const deform = this.state.softBodyState.deformation;
            const scaleX = 1 + deform.x * 0.1;
            const scaleY = 1 + deform.y * 0.1;
            transforms.push(`scaleX(${scaleX}) scaleY(${scaleY})`);
        }
        
        // Apply mammal spine flexibility
        if (this.config.mammalMechanics.spineFlexibility.enabled) {
            const spineRotation = this.calculateSpineRotation();
            if (Math.abs(spineRotation) > 0.01) {
                transforms.push(`skewX(${spineRotation * 180 / Math.PI}deg)`);
            }
        }
        
        // Apply transforms
        if (transforms.length > 0) {
            widgetElement.style.transform = transforms.join(' ');
            widgetElement.style.transformOrigin = 'center center';
            widgetElement.style.transition = 'transform 0.1s ease-out';
        }
    }
    
    /**
     * Update animation phases
     */
    updateAnimationPhases() {
        const now = Date.now();
        const deltaTime = (now - this.state.timing.lastUpdate) / 1000;
        
        // Breathing animation
        this.state.timing.breathingPhase += deltaTime * 2; // 2 Hz breathing
        
        // Heartbeat animation
        this.state.timing.heartbeatPhase += deltaTime * 1.2; // 72 BPM
        
        // Idle animation
        this.state.timing.idleAnimationPhase += deltaTime * 0.5; // Slow idle movement
    }
    
    /**
     * Apply visual effects
     */
    applyVisualEffects() {
        if (!this.config.visual.animateDeformation) return;
        
        const widgetElement = this.widget.elements?.widget;
        if (!widgetElement) return;
        
        // Breathing effect
        if (this.config.visual.breathingAnimation && this.currentBehaviorState.name === 'idle') {
            const breathingScale = 1 + Math.sin(this.state.timing.breathingPhase) * 0.02;
            const breathingOpacity = 0.9 + Math.sin(this.state.timing.breathingPhase) * 0.05;
            
            widgetElement.style.filter = `opacity(${breathingOpacity})`;
        }
    }
    
    /**
     * Update head tracking based on mouse position
     */
    updateHeadTracking(mouseX, mouseY) {
        if (!this.config.birdMechanics.headTracking.enabled) return;
        
        const widget = this.widget.state;
        const widgetCenterX = widget.position.x + this.config.widget?.size?.width / 2 || 60;
        const widgetCenterY = widget.position.y + this.config.widget?.size?.height / 2 || 60;
        
        // Calculate angle to mouse
        const dx = mouseX - widgetCenterX;
        const dy = mouseY - widgetCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only track if mouse is reasonably close
        if (distance < 300) {
            const angle = Math.atan2(dy, dx);
            const intensity = Math.min(1, distance / 200) * this.config.birdMechanics.headTracking.trackingIntensity;
            
            this.state.birdState.targetDirection = angle * intensity;
        }
    }
    
    /**
     * Transition to new behavior state
     */
    transitionToBehavior(stateName) {
        if (!this.behaviorStates[stateName]) return;
        
        const oldState = this.currentBehaviorState.name;
        this.currentBehaviorState = this.behaviorStates[stateName];
        this.behaviorStartTime = Date.now();
        this.state.currentBehavior = stateName;
        
        // Apply state effects
        this.applyBehaviorEffects(this.currentBehaviorState.effects);
        
        if (this.config.debug) {
            console.log(`🧠 Behavior transition: ${oldState} → ${stateName}`);
        }
        
        this.emit('behavior:changed', { from: oldState, to: stateName });
    }
    
    /**
     * Check behavior conditions
     */
    checkBehaviorConditions(conditions) {
        if (!conditions || conditions.length === 0) return true;
        
        return conditions.every(condition => {
            switch (condition) {
                case 'movement_nearby':
                    return this.detectMovementNearby();
                case 'user_interaction':
                    return this.detectUserInteraction();
                case 'sudden_change':
                    return this.detectSuddenChange();
                case 'interesting_content':
                    return this.detectInterestingContent();
                case 'user_engagement':
                    return this.detectUserEngagement();
                case 'low_energy':
                    return this.state.emotionalState.energy < 0.3;
                case 'no_threat':
                    return !this.detectThreat();
                case 'false_alarm':
                    return Math.random() < 0.5;
                case 'energy_restored':
                    return this.state.emotionalState.energy > 0.7;
                case 'interesting_stimulus':
                    return this.detectInterestingStimulus();
                case 'disturbance':
                    return this.detectDisturbance();
                default:
                    return true;
            }
        });
    }
    
    /**
     * Apply behavior effects to emotional state
     */
    applyBehaviorEffects(effects) {
        if (!effects) return;
        
        Object.entries(effects).forEach(([emotion, change]) => {
            if (this.state.emotionalState[emotion] !== undefined) {
                this.state.emotionalState[emotion] = Math.max(0, Math.min(1, 
                    this.state.emotionalState[emotion] + change
                ));
            }
        });
    }
    
    /**
     * Update emotional state over time
     */
    updateEmotionalState(deltaTime) {
        const emotions = this.state.emotionalState;
        
        // Natural decay/recovery
        emotions.energy += deltaTime * 0.01; // Slow energy recovery
        emotions.happiness += deltaTime * 0.005; // Gradual happiness increase
        emotions.curiosity *= 0.999; // Curiosity slowly fades
        emotions.comfort += deltaTime * 0.002; // Comfort slowly increases
        
        // Clamp values
        Object.keys(emotions).forEach(emotion => {
            emotions[emotion] = Math.max(0, Math.min(1, emotions[emotion]));
        });
    }
    
    /**
     * Apply click response
     */
    applyClickResponse() {
        // Happiness boost
        this.state.emotionalState.happiness = Math.min(1, this.state.emotionalState.happiness + 0.2);
        
        // Apply physical response
        if (this.widget.state.forces) {
            this.widget.state.forces.y -= 2; // Small upward impulse
        }
        
        // Wing flap effect
        if (this.config.birdMechanics.wingBalance.enabled) {
            this.state.birdState.wingPosition.left = 0.8;
            this.state.birdState.wingPosition.right = 0.8;
        }
    }
    
    /**
     * Apply double click response
     */
    applyDoubleClickResponse() {
        // Energy boost
        this.state.emotionalState.energy = Math.min(1, this.state.emotionalState.energy + 0.3);
        
        // Playful behavior
        this.transitionToBehavior('playful');
        
        // Stronger physical response
        if (this.widget.state.forces) {
            this.widget.state.forces.y -= 4;
            this.widget.state.forces.x += (Math.random() - 0.5) * 3;
        }
    }
    
    /**
     * Calculate widget tilt based on velocity
     */
    calculateWidgetTilt() {
        const velocity = this.widget.state.velocity;
        if (!velocity) return 0;
        
        return Math.atan2(velocity.y, velocity.x) * 0.3; // Scale factor
    }
    
    /**
     * Calculate turn rate based on angular velocity
     */
    calculateTurnRate() {
        // This would need widget angular velocity, approximating from velocity change
        const velocity = this.widget.state.velocity;
        const lastVelocity = this.state.birdState.lastMovement;
        
        const deltaVx = velocity.x - lastVelocity.x;
        const deltaVy = velocity.y - lastVelocity.y;
        
        this.state.birdState.lastMovement = { ...velocity };
        
        return Math.atan2(deltaVy, deltaVx);
    }
    
    /**
     * Calculate spine rotation from segments
     */
    calculateSpineRotation() {
        if (!this.state.mammalState.spineSegments.length) return 0;
        
        const segments = this.state.mammalState.spineSegments;
        const totalRotation = segments.reduce((sum, segment) => sum + segment.rotation, 0);
        
        return totalRotation / segments.length;
    }
    
    /**
     * Apply wing balance visual effect
     */
    applyWingBalanceEffect(wingPosition) {
        const widgetElement = this.widget.elements?.widget;
        if (!widgetElement) return;
        
        // Create subtle wing shadow effects
        const leftWing = wingPosition.left * 0.5;
        const rightWing = wingPosition.right * 0.5;
        
        widgetElement.style.boxShadow = `
            ${leftWing * 10}px 0 ${Math.abs(leftWing) * 20}px rgba(0, 0, 0, 0.1),
            ${rightWing * -10}px 0 ${Math.abs(rightWing) * 20}px rgba(0, 0, 0, 0.1),
            0 4px 8px rgba(0, 0, 0, 0.2)
        `;
    }
    
    /**
     * Apply soft body deformation
     */
    applySoftBodyDeformation(softBody) {
        // This is handled in applyPhysicsToWidget method
    }
    
    /**
     * Apply gravity awareness
     */
    applyGravityAwareness() {
        // Adjust widget orientation based on perceived gravity
        const widgetElement = this.widget.elements?.widget;
        if (!widgetElement) return;
        
        // Subtle gravitational alignment
        const gravityAlignment = Math.sin(this.state.timing.idleAnimationPhase * 0.1) * 0.02;
        widgetElement.style.transformOrigin = `50% ${50 + gravityAlignment}%`;
    }
    
    /**
     * Update environmental conditions
     */
    updateEnvironmentalConditions() {
        if (!this.windSimulation.enabled) return;
        
        // Simulate gentle wind changes
        const time = Date.now() * 0.001;
        this.state.environmentState.windDirection.x = Math.sin(time * 0.3) * 0.5;
        this.state.environmentState.windDirection.y = Math.cos(time * 0.2) * 0.3;
        this.state.environmentState.windStrength = (Math.sin(time * 0.5) + 1) * 0.3;
    }
    
    // Condition detection methods (simplified)
    detectMovementNearby() { return Math.random() < 0.1; }
    detectUserInteraction() { return Date.now() - (this.widget.state.lastInteraction || 0) < 5000; }
    detectSuddenChange() { return Math.random() < 0.05; }
    detectInterestingContent() { return Math.random() < 0.2; }
    detectUserEngagement() { return this.state.emotionalState.happiness > 0.7; }
    detectThreat() { return false; }
    detectInterestingStimulus() { return Math.random() < 0.3; }
    detectDisturbance() { return Math.random() < 0.1; }
    
    /**
     * Get physics status
     */
    getStatus() {
        return {
            physicsActive: this.state.physicsActive,
            currentBehavior: this.state.currentBehavior,
            emotionalState: { ...this.state.emotionalState },
            birdState: { ...this.state.birdState },
            mammalState: {
                spineSegments: this.state.mammalState.spineSegments.length,
                muscleTension: this.state.mammalState.muscleTension,
                fatigue: this.state.mammalState.fatigue
            },
            softBodyState: { ...this.state.softBodyState },
            performance: { ...this.state.performance }
        };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.physicsInterval) {
            clearTimeout(this.physicsInterval);
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        console.log('🦅 Widget Physics Bridge destroyed');
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetPhysicsBridge;
} else if (typeof window !== 'undefined') {
    window.WidgetPhysicsBridge = WidgetPhysicsBridge;
}

console.log('🦅 Widget Physics Bridge loaded');
console.log('🧬 Advanced mascot physics integration ready');