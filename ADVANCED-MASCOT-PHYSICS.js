/**
 * Advanced Mascot Physics System
 * Natural movement inspired by birds and mammals
 * Smooth, non-blocky mechanics with high detail
 */

class AdvancedMascotPhysics {
    constructor(character) {
        this.character = character;
        
        // Bird-inspired mechanics
        this.birdMechanics = {
            // Head tracking (like pigeons)
            headTracking: {
                enabled: true,
                leadTime: 0.2, // Head moves before body
                stabilization: true, // Keeps head steady while walking
                range: { horizontal: Math.PI / 3, vertical: Math.PI / 6 }
            },
            
            // Wing/arm flapping for balance
            wingBalance: {
                enabled: true,
                sensitivity: 0.8,
                responseTime: 0.1,
                maxAngle: Math.PI / 4
            },
            
            // Lightweight bone structure
            bodyMass: {
                distribution: [0.3, 0.5, 0.2], // head, body, limbs
                centerOfMass: { x: 0, y: 0.6, z: 0 }
            },
            
            // Quick, darting movements
            locomotion: {
                hopHeight: 0.5,
                glideDistance: 2.0,
                turnRadius: 0.3,
                acceleration: 15
            }
        };
        
        // Mammal-inspired mechanics
        this.mammalMechanics = {
            // Spine flexibility (like cats)
            spineFlexibility: {
                segments: 5,
                maxBend: Math.PI / 6,
                twistRange: Math.PI / 8,
                compression: 0.1
            },
            
            // Four-point balance system
            balanceSystem: {
                footPlacement: 'dynamic',
                gaitPattern: 'diagonal', // Like most mammals
                stabilityThreshold: 0.85,
                recoverSpeed: 0.3
            },
            
            // Muscle tension simulation
            muscleTension: {
                restingTension: 0.3,
                activeTension: 0.8,
                fatigueRate: 0.01,
                recoveryRate: 0.02
            },
            
            // Fur/hair physics
            furDynamics: {
                length: 0.1,
                stiffness: 0.3,
                damping: 0.8,
                windResponse: 0.5
            }
        };
        
        // Advanced physics properties
        this.physics = {
            // Skeletal system
            skeleton: this.createSkeleton(),
            
            // Soft body dynamics
            softBody: {
                enabled: true,
                stiffness: 0.7,
                damping: 0.9,
                pressure: 1.0
            },
            
            // Inverse kinematics
            ik: {
                chains: [],
                constraints: [],
                iterations: 10
            },
            
            // Aerodynamics
            aerodynamics: {
                dragCoefficient: 0.3,
                liftCoefficient: 0.1,
                windResistance: true
            },
            
            // Ground interaction
            groundInteraction: {
                friction: 0.8,
                bounciness: 0.2,
                footprintDepth: 0.02,
                dustGeneration: true
            }
        };
        
        // Behavioral states
        this.behaviorStates = {
            current: 'idle',
            transitions: new Map(),
            emotions: {
                happiness: 0.7,
                energy: 0.8,
                curiosity: 0.6,
                comfort: 0.9
            }
        };
        
        // Animation blending
        this.animationBlender = {
            layers: new Map(),
            weights: new Map(),
            transitions: []
        };
        
        this.initializePhysics();
    }
    
    initializePhysics() {
        // Create physics skeleton
        this.createPhysicsSkeleton();
        
        // Setup IK chains
        this.setupInverseKinematics();
        
        // Initialize soft body
        this.initializeSoftBody();
        
        // Setup behavioral state machine
        this.setupBehaviorStateMachine();
        
        console.log('🦅 Bird mechanics initialized');
        console.log('🐾 Mammal mechanics initialized');
        console.log('✨ Advanced physics ready');
    }
    
    createSkeleton() {
        return {
            spine: {
                bones: [],
                flexibility: 0.3,
                segments: 5
            },
            
            head: {
                bone: null,
                neckBones: 3,
                rotationLimits: {
                    x: [-Math.PI/4, Math.PI/4],
                    y: [-Math.PI/2, Math.PI/2],
                    z: [-Math.PI/6, Math.PI/6]
                }
            },
            
            limbs: {
                leftArm: { upper: null, lower: null, hand: null },
                rightArm: { upper: null, lower: null, hand: null },
                leftLeg: { upper: null, lower: null, foot: null },
                rightLeg: { upper: null, lower: null, foot: null }
            },
            
            tail: {
                bones: [],
                segments: 8,
                flexibility: 0.5
            }
        };
    }
    
    createPhysicsSkeleton() {
        // Spine creation with flexible segments
        const spineCount = this.physics.skeleton.spine.segments;
        for (let i = 0; i < spineCount; i++) {
            const bone = {
                position: new THREE.Vector3(0, i * 0.3, 0),
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(1, 1, 1),
                parent: i > 0 ? this.physics.skeleton.spine.bones[i-1] : null,
                constraints: {
                    bendLimit: Math.PI / 8,
                    twistLimit: Math.PI / 12
                }
            };
            this.physics.skeleton.spine.bones.push(bone);
        }
        
        // Create neck and head bones
        for (let i = 0; i < this.physics.skeleton.head.neckBones; i++) {
            const neckBone = {
                position: new THREE.Vector3(0, 0.2 * i, 0),
                parent: i === 0 ? 
                    this.physics.skeleton.spine.bones[spineCount-1] : 
                    this.physics.skeleton.head[`neck${i-1}`],
                flexibility: 0.4
            };
            this.physics.skeleton.head[`neck${i}`] = neckBone;
        }
    }
    
    setupInverseKinematics() {
        // Arm IK chains
        ['left', 'right'].forEach(side => {
            const armChain = {
                name: `${side}Arm`,
                bones: [
                    this.physics.skeleton.limbs[`${side}Arm`].upper,
                    this.physics.skeleton.limbs[`${side}Arm`].lower,
                    this.physics.skeleton.limbs[`${side}Arm`].hand
                ],
                target: new THREE.Vector3(),
                constraints: {
                    elbow: { min: 0, max: Math.PI * 0.8 },
                    wrist: { min: -Math.PI/4, max: Math.PI/4 }
                }
            };
            this.physics.ik.chains.push(armChain);
        });
        
        // Leg IK chains
        ['left', 'right'].forEach(side => {
            const legChain = {
                name: `${side}Leg`,
                bones: [
                    this.physics.skeleton.limbs[`${side}Leg`].upper,
                    this.physics.skeleton.limbs[`${side}Leg`].lower,
                    this.physics.skeleton.limbs[`${side}Leg`].foot
                ],
                target: new THREE.Vector3(),
                constraints: {
                    knee: { min: 0, max: Math.PI * 0.7 },
                    ankle: { min: -Math.PI/6, max: Math.PI/6 }
                }
            };
            this.physics.ik.chains.push(legChain);
        });
    }
    
    initializeSoftBody() {
        // Soft body simulation for natural deformation
        this.physics.softBody.points = [];
        this.physics.softBody.springs = [];
        
        // Create point grid
        const resolution = 10;
        for (let x = 0; x < resolution; x++) {
            for (let y = 0; y < resolution; y++) {
                const point = {
                    position: new THREE.Vector3(
                        (x / resolution - 0.5) * 2,
                        (y / resolution - 0.5) * 3,
                        0
                    ),
                    velocity: new THREE.Vector3(0, 0, 0),
                    mass: 0.1,
                    pinned: false
                };
                this.physics.softBody.points.push(point);
            }
        }
        
        // Create springs between points
        for (let i = 0; i < this.physics.softBody.points.length; i++) {
            const point = this.physics.softBody.points[i];
            
            // Connect to neighboring points
            const neighbors = this.getNeighborIndices(i, resolution);
            neighbors.forEach(neighborIndex => {
                if (neighborIndex > i) { // Avoid duplicate springs
                    const spring = {
                        pointA: i,
                        pointB: neighborIndex,
                        restLength: point.position.distanceTo(
                            this.physics.softBody.points[neighborIndex].position
                        ),
                        stiffness: this.physics.softBody.stiffness
                    };
                    this.physics.softBody.springs.push(spring);
                }
            });
        }
    }
    
    setupBehaviorStateMachine() {
        // Define behavior states
        const states = ['idle', 'walking', 'running', 'jumping', 'resting', 'alert', 'playful'];
        
        // Define transitions
        this.behaviorStates.transitions.set('idle', {
            walking: { probability: 0.3, conditions: ['energy > 0.3'] },
            resting: { probability: 0.2, conditions: ['energy < 0.3'] },
            alert: { probability: 0.1, conditions: ['curiosity > 0.7'] },
            playful: { probability: 0.2, conditions: ['happiness > 0.8'] }
        });
        
        this.behaviorStates.transitions.set('walking', {
            idle: { probability: 0.3, conditions: [] },
            running: { probability: 0.2, conditions: ['energy > 0.6'] },
            alert: { probability: 0.1, conditions: ['curiosity > 0.8'] }
        });
        
        // Add more transitions...
    }
    
    updatePhysics(deltaTime) {
        // Update skeleton physics
        this.updateSkeletonPhysics(deltaTime);
        
        // Update soft body
        this.updateSoftBody(deltaTime);
        
        // Update IK
        this.solveInverseKinematics();
        
        // Apply bird mechanics
        this.applyBirdMechanics(deltaTime);
        
        // Apply mammal mechanics
        this.applyMammalMechanics(deltaTime);
        
        // Update behavior
        this.updateBehavior(deltaTime);
        
        // Blend animations
        this.blendAnimations(deltaTime);
    }
    
    applyBirdMechanics(deltaTime) {
        // Head stabilization (like chickens)
        if (this.birdMechanics.headTracking.stabilization) {
            const bodyMovement = this.character.velocity.length();
            if (bodyMovement > 0.1) {
                // Counter-rotate head to maintain stability
                const stabilizationForce = -bodyMovement * 0.5;
                if (this.physics.skeleton.head.bone) {
                    this.physics.skeleton.head.bone.rotation.x += stabilizationForce * deltaTime;
                }
            }
        }
        
        // Wing balance
        if (this.birdMechanics.wingBalance.enabled) {
            const tilt = this.character.rotation.z;
            const balanceCorrection = -tilt * this.birdMechanics.wingBalance.sensitivity;
            
            // Flap wings to maintain balance
            if (Math.abs(tilt) > 0.1) {
                this.flapWings(balanceCorrection);
            }
        }
    }
    
    applyMammalMechanics(deltaTime) {
        // Spine flexibility
        const movement = this.character.velocity;
        const turnRate = this.character.angularVelocity.y;
        
        // Bend spine based on movement
        this.physics.skeleton.spine.bones.forEach((bone, index) => {
            const bendAmount = Math.sin(index / this.physics.skeleton.spine.bones.length * Math.PI);
            bone.rotation.y = turnRate * bendAmount * this.mammalMechanics.spineFlexibility.maxBend;
            bone.rotation.x = movement.z * bendAmount * 0.1;
        });
        
        // Muscle tension
        const activity = movement.length();
        this.mammalMechanics.muscleTension.activeTension = 
            Math.min(1, this.mammalMechanics.muscleTension.restingTension + activity);
        
        // Fatigue
        if (activity > 0.5) {
            this.mammalMechanics.muscleTension.activeTension -= 
                this.mammalMechanics.muscleTension.fatigueRate * deltaTime;
        } else {
            this.mammalMechanics.muscleTension.activeTension += 
                this.mammalMechanics.muscleTension.recoveryRate * deltaTime;
        }
    }
    
    solveInverseKinematics() {
        this.physics.ik.chains.forEach(chain => {
            // FABRIK algorithm
            for (let iteration = 0; iteration < this.physics.ik.iterations; iteration++) {
                // Forward pass
                this.solveIKForward(chain);
                
                // Backward pass
                this.solveIKBackward(chain);
                
                // Apply constraints
                this.applyIKConstraints(chain);
            }
        });
    }
    
    updateSoftBody(deltaTime) {
        if (!this.physics.softBody.enabled) return;
        
        // Update point positions
        this.physics.softBody.points.forEach(point => {
            if (!point.pinned) {
                // Apply gravity
                point.velocity.y -= 9.8 * deltaTime;
                
                // Update position
                point.position.add(point.velocity.clone().multiplyScalar(deltaTime));
                
                // Apply damping
                point.velocity.multiplyScalar(this.physics.softBody.damping);
            }
        });
        
        // Solve spring constraints
        this.physics.softBody.springs.forEach(spring => {
            const pointA = this.physics.softBody.points[spring.pointA];
            const pointB = this.physics.softBody.points[spring.pointB];
            
            const distance = pointA.position.distanceTo(pointB.position);
            const difference = distance - spring.restLength;
            
            const direction = pointB.position.clone().sub(pointA.position).normalize();
            const force = direction.multiplyScalar(difference * spring.stiffness);
            
            if (!pointA.pinned) pointA.velocity.add(force.clone().multiplyScalar(deltaTime));
            if (!pointB.pinned) pointB.velocity.sub(force.clone().multiplyScalar(deltaTime));
        });
    }
    
    updateBehavior(deltaTime) {
        // Update emotional states
        this.behaviorStates.emotions.energy -= 0.01 * deltaTime;
        this.behaviorStates.emotions.energy = Math.max(0, Math.min(1, this.behaviorStates.emotions.energy));
        
        // Check for state transitions
        const currentTransitions = this.behaviorStates.transitions.get(this.behaviorStates.current);
        if (currentTransitions) {
            Object.entries(currentTransitions).forEach(([nextState, transition]) => {
                if (Math.random() < transition.probability * deltaTime) {
                    // Check conditions
                    const conditionsMet = transition.conditions.every(condition => {
                        return this.evaluateCondition(condition);
                    });
                    
                    if (conditionsMet) {
                        this.transitionToState(nextState);
                    }
                }
            });
        }
    }
    
    blendAnimations(deltaTime) {
        // Smooth animation blending
        this.animationBlender.transitions.forEach((transition, index) => {
            transition.progress += deltaTime / transition.duration;
            
            if (transition.progress >= 1) {
                // Transition complete
                this.animationBlender.weights.set(transition.to, 1);
                this.animationBlender.weights.set(transition.from, 0);
                this.animationBlender.transitions.splice(index, 1);
            } else {
                // Blend weights
                const t = this.smoothstep(0, 1, transition.progress);
                this.animationBlender.weights.set(transition.from, 1 - t);
                this.animationBlender.weights.set(transition.to, t);
            }
        });
    }
    
    // Helper methods
    getNeighborIndices(index, resolution) {
        const neighbors = [];
        const x = index % resolution;
        const y = Math.floor(index / resolution);
        
        // 8-way connectivity
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < resolution && ny >= 0 && ny < resolution) {
                    neighbors.push(ny * resolution + nx);
                }
            }
        }
        
        return neighbors;
    }
    
    flapWings(intensity) {
        // Simulate wing flapping for balance
        const flapSpeed = 10;
        const flapAngle = Math.sin(Date.now() * 0.001 * flapSpeed) * intensity;
        
        if (this.character.leftArm) {
            this.character.leftArm.rotation.z = Math.PI / 6 + flapAngle;
        }
        if (this.character.rightArm) {
            this.character.rightArm.rotation.z = -Math.PI / 6 - flapAngle;
        }
    }
    
    evaluateCondition(condition) {
        // Parse and evaluate behavior conditions
        const parts = condition.split(' ');
        const emotion = parts[0];
        const operator = parts[1];
        const value = parseFloat(parts[2]);
        
        const currentValue = this.behaviorStates.emotions[emotion];
        
        switch (operator) {
            case '>': return currentValue > value;
            case '<': return currentValue < value;
            case '>=': return currentValue >= value;
            case '<=': return currentValue <= value;
            case '==': return currentValue === value;
            default: return false;
        }
    }
    
    transitionToState(newState) {
        console.log(`Behavior transition: ${this.behaviorStates.current} → ${newState}`);
        this.behaviorStates.current = newState;
        
        // Trigger state-specific behaviors
        this.onStateEnter(newState);
    }
    
    onStateEnter(state) {
        switch (state) {
            case 'playful':
                this.behaviorStates.emotions.happiness = Math.min(1, this.behaviorStates.emotions.happiness + 0.2);
                break;
            case 'resting':
                this.behaviorStates.emotions.energy += 0.01; // Slow energy recovery
                break;
            case 'alert':
                this.behaviorStates.emotions.curiosity = Math.min(1, this.behaviorStates.emotions.curiosity + 0.1);
                break;
        }
    }
    
    smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }
    
    solveIKForward(chain) {
        // FABRIK forward pass implementation
        for (let i = chain.bones.length - 2; i >= 0; i--) {
            const currentBone = chain.bones[i];
            const childBone = chain.bones[i + 1];
            
            const boneLength = currentBone.length || 1;
            const direction = childBone.position.clone().sub(currentBone.position).normalize();
            
            currentBone.position = childBone.position.clone().sub(
                direction.multiplyScalar(boneLength)
            );
        }
    }
    
    solveIKBackward(chain) {
        // FABRIK backward pass implementation
        for (let i = 1; i < chain.bones.length; i++) {
            const currentBone = chain.bones[i];
            const parentBone = chain.bones[i - 1];
            
            const boneLength = parentBone.length || 1;
            const direction = currentBone.position.clone().sub(parentBone.position).normalize();
            
            currentBone.position = parentBone.position.clone().add(
                direction.multiplyScalar(boneLength)
            );
        }
    }
    
    applyIKConstraints(chain) {
        // Apply joint constraints
        chain.constraints.forEach((constraint, index) => {
            const bone = chain.bones[index];
            if (bone && constraint) {
                // Clamp rotations to limits
                Object.keys(constraint).forEach(axis => {
                    const limits = constraint[axis];
                    if (bone.rotation[axis] < limits.min) {
                        bone.rotation[axis] = limits.min;
                    } else if (bone.rotation[axis] > limits.max) {
                        bone.rotation[axis] = limits.max;
                    }
                });
            }
        });
    }
}

// Export for use with character
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedMascotPhysics;
} else if (typeof window !== 'undefined') {
    window.AdvancedMascotPhysics = AdvancedMascotPhysics;
}

console.log('🦅 Advanced Mascot Physics loaded');
console.log('🐾 Bird and mammal mechanics ready');
console.log('✨ Natural movement system initialized');