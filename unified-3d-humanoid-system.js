#!/usr/bin/env node

/**
 * UNIFIED 3D HUMANOID SYSTEM
 * 
 * Connects:
 * - ADVANCED-MASCOT-PHYSICS.js (skeletal animation, IK)
 * - Three.js rendering (3D meshes)
 * - Character state persistence
 * - Adaptive rendering based on device
 */

const THREE = require('three');
const AdvancedMascotPhysics = require('./ADVANCED-MASCOT-PHYSICS.js');
const UniversalDeviceFingerprinter = require('./universal-device-fingerprinter.js');

class Unified3DHumanoidSystem {
    constructor() {
        this.physics = new AdvancedMascotPhysics();
        this.deviceDetector = new UniversalDeviceFingerprinter();
        this.humanoids = new Map();
        
        // Quality levels based on device
        this.qualityLevels = {
            high: {
                segments: 32,
                bones: 24,
                textureSize: 2048,
                shadows: true,
                physics: 'full'
            },
            medium: {
                segments: 16,
                bones: 16,
                textureSize: 1024,
                shadows: false,
                physics: 'simplified'
            },
            low: {
                segments: 8,
                bones: 8,
                textureSize: 512,
                shadows: false,
                physics: 'basic'
            }
        };
        
        this.currentQuality = 'medium';
        
        console.log('🧍 UNIFIED 3D HUMANOID SYSTEM INITIALIZING');
        console.log('==========================================');
        console.log('Connecting physics → meshes → rendering');
    }
    
    async initialize() {
        // Detect device capabilities
        const deviceInfo = await this.deviceDetector.generateFingerprint();
        this.currentQuality = this.determineQualityLevel(deviceInfo);
        
        console.log(`📱 Device detected, using ${this.currentQuality} quality`);
    }
    
    determineQualityLevel(deviceInfo) {
        const hardware = deviceInfo.components?.hardware || {};
        
        // Check hardware concurrency (CPU cores)
        if (hardware.hardwareConcurrency >= 8 && hardware.deviceMemory >= 8) {
            return 'high';
        } else if (hardware.hardwareConcurrency >= 4 && hardware.deviceMemory >= 4) {
            return 'medium';
        }
        
        return 'low';
    }
    
    /**
     * Create a humanoid with physics-connected mesh
     */
    createHumanoid(options = {}) {
        const id = options.id || crypto.randomUUID();
        const quality = this.qualityLevels[this.currentQuality];
        
        // Create skeletal structure from physics system
        const skeleton = this.createSkeleton(quality);
        
        // Create mesh geometry
        const mesh = this.createHumanoidMesh(skeleton, quality);
        
        // Connect physics to mesh
        const physicsBody = this.physics.createCharacter({
            type: options.type || 'humanoid',
            skeleton: skeleton,
            behaviors: options.behaviors || ['idle', 'walk', 'wave']
        });
        
        // Create humanoid entity
        const humanoid = {
            id,
            mesh,
            skeleton,
            physicsBody,
            state: {
                position: new THREE.Vector3(0, 0, 0),
                rotation: new THREE.Euler(0, 0, 0),
                animation: 'idle',
                health: 100,
                energy: 100
            },
            animations: this.createAnimations(skeleton)
        };
        
        this.humanoids.set(id, humanoid);
        
        console.log(`🧍 Created humanoid: ${id}`);
        return humanoid;
    }
    
    /**
     * Create skeleton structure
     */
    createSkeleton(quality) {
        const bones = [];
        
        // Root/Pelvis
        const root = new THREE.Bone();
        root.name = 'pelvis';
        bones.push(root);
        
        // Spine
        const spine1 = new THREE.Bone();
        spine1.name = 'spine1';
        spine1.position.y = 0.2;
        root.add(spine1);
        bones.push(spine1);
        
        const spine2 = new THREE.Bone();
        spine2.name = 'spine2';
        spine2.position.y = 0.2;
        spine1.add(spine2);
        bones.push(spine2);
        
        const spine3 = new THREE.Bone();
        spine3.name = 'spine3';
        spine3.position.y = 0.2;
        spine2.add(spine3);
        bones.push(spine3);
        
        // Neck and Head
        const neck = new THREE.Bone();
        neck.name = 'neck';
        neck.position.y = 0.15;
        spine3.add(neck);
        bones.push(neck);
        
        const head = new THREE.Bone();
        head.name = 'head';
        head.position.y = 0.2;
        neck.add(head);
        bones.push(head);
        
        // Left Arm
        const leftShoulder = new THREE.Bone();
        leftShoulder.name = 'leftShoulder';
        leftShoulder.position.set(-0.2, 0.1, 0);
        spine3.add(leftShoulder);
        bones.push(leftShoulder);
        
        const leftUpperArm = new THREE.Bone();
        leftUpperArm.name = 'leftUpperArm';
        leftUpperArm.position.x = -0.25;
        leftShoulder.add(leftUpperArm);
        bones.push(leftUpperArm);
        
        const leftLowerArm = new THREE.Bone();
        leftLowerArm.name = 'leftLowerArm';
        leftLowerArm.position.x = -0.25;
        leftUpperArm.add(leftLowerArm);
        bones.push(leftLowerArm);
        
        const leftHand = new THREE.Bone();
        leftHand.name = 'leftHand';
        leftHand.position.x = -0.15;
        leftLowerArm.add(leftHand);
        bones.push(leftHand);
        
        // Right Arm (mirror of left)
        const rightShoulder = new THREE.Bone();
        rightShoulder.name = 'rightShoulder';
        rightShoulder.position.set(0.2, 0.1, 0);
        spine3.add(rightShoulder);
        bones.push(rightShoulder);
        
        const rightUpperArm = new THREE.Bone();
        rightUpperArm.name = 'rightUpperArm';
        rightUpperArm.position.x = 0.25;
        rightShoulder.add(rightUpperArm);
        bones.push(rightUpperArm);
        
        const rightLowerArm = new THREE.Bone();
        rightLowerArm.name = 'rightLowerArm';
        rightLowerArm.position.x = 0.25;
        rightUpperArm.add(rightLowerArm);
        bones.push(rightLowerArm);
        
        const rightHand = new THREE.Bone();
        rightHand.name = 'rightHand';
        rightHand.position.x = 0.15;
        rightLowerArm.add(rightHand);
        bones.push(rightHand);
        
        // Left Leg
        const leftHip = new THREE.Bone();
        leftHip.name = 'leftHip';
        leftHip.position.set(-0.1, -0.05, 0);
        root.add(leftHip);
        bones.push(leftHip);
        
        const leftUpperLeg = new THREE.Bone();
        leftUpperLeg.name = 'leftUpperLeg';
        leftUpperLeg.position.y = -0.4;
        leftHip.add(leftUpperLeg);
        bones.push(leftUpperLeg);
        
        const leftLowerLeg = new THREE.Bone();
        leftLowerLeg.name = 'leftLowerLeg';
        leftLowerLeg.position.y = -0.4;
        leftUpperLeg.add(leftLowerLeg);
        bones.push(leftLowerLeg);
        
        const leftFoot = new THREE.Bone();
        leftFoot.name = 'leftFoot';
        leftFoot.position.y = -0.1;
        leftLowerLeg.add(leftFoot);
        bones.push(leftFoot);
        
        // Right Leg (mirror of left)
        const rightHip = new THREE.Bone();
        rightHip.name = 'rightHip';
        rightHip.position.set(0.1, -0.05, 0);
        root.add(rightHip);
        bones.push(rightHip);
        
        const rightUpperLeg = new THREE.Bone();
        rightUpperLeg.name = 'rightUpperLeg';
        rightUpperLeg.position.y = -0.4;
        rightHip.add(rightUpperLeg);
        bones.push(rightUpperLeg);
        
        const rightLowerLeg = new THREE.Bone();
        rightLowerLeg.name = 'rightLowerLeg';
        rightLowerLeg.position.y = -0.4;
        rightUpperLeg.add(rightLowerLeg);
        bones.push(rightLowerLeg);
        
        const rightFoot = new THREE.Bone();
        rightFoot.name = 'rightFoot';
        rightFoot.position.y = -0.1;
        rightLowerLeg.add(rightFoot);
        bones.push(rightFoot);
        
        // Create skeleton
        const skeleton = new THREE.Skeleton(bones);
        
        // Add IK chains for physics system
        skeleton.ikChains = {
            leftArm: {
                bones: [leftUpperArm, leftLowerArm, leftHand],
                target: new THREE.Vector3(-0.5, 1, 0.5)
            },
            rightArm: {
                bones: [rightUpperArm, rightLowerArm, rightHand],
                target: new THREE.Vector3(0.5, 1, 0.5)
            },
            leftLeg: {
                bones: [leftUpperLeg, leftLowerLeg, leftFoot],
                target: new THREE.Vector3(-0.1, 0, 0)
            },
            rightLeg: {
                bones: [rightUpperLeg, rightLowerLeg, rightFoot],
                target: new THREE.Vector3(0.1, 0, 0)
            }
        };
        
        return skeleton;
    }
    
    /**
     * Create humanoid mesh geometry
     */
    createHumanoidMesh(skeleton, quality) {
        const group = new THREE.Group();
        
        // Material based on quality
        const material = new THREE.MeshStandardMaterial({
            color: 0xffaa88,
            roughness: 0.8,
            metalness: 0.2,
            skinning: true
        });
        
        // Body parts with proper proportions
        const bodyParts = {
            // Torso
            torso: {
                geometry: new THREE.BoxGeometry(0.4, 0.8, 0.2, quality.segments/4, quality.segments/2, quality.segments/4),
                position: [0, 0.6, 0],
                bindToBone: 'spine2'
            },
            
            // Head
            head: {
                geometry: new THREE.SphereGeometry(0.15, quality.segments, quality.segments/2),
                position: [0, 1.7, 0],
                bindToBone: 'head'
            },
            
            // Arms
            leftUpperArm: {
                geometry: new THREE.CylinderGeometry(0.06, 0.08, 0.3, quality.segments/2),
                position: [-0.3, 1.3, 0],
                rotation: [0, 0, Math.PI/4],
                bindToBone: 'leftUpperArm'
            },
            leftLowerArm: {
                geometry: new THREE.CylinderGeometry(0.05, 0.06, 0.25, quality.segments/2),
                position: [-0.5, 1.1, 0],
                rotation: [0, 0, Math.PI/4],
                bindToBone: 'leftLowerArm'
            },
            rightUpperArm: {
                geometry: new THREE.CylinderGeometry(0.06, 0.08, 0.3, quality.segments/2),
                position: [0.3, 1.3, 0],
                rotation: [0, 0, -Math.PI/4],
                bindToBone: 'rightUpperArm'
            },
            rightLowerArm: {
                geometry: new THREE.CylinderGeometry(0.05, 0.06, 0.25, quality.segments/2),
                position: [0.5, 1.1, 0],
                rotation: [0, 0, -Math.PI/4],
                bindToBone: 'rightLowerArm'
            },
            
            // Legs
            leftUpperLeg: {
                geometry: new THREE.CylinderGeometry(0.08, 0.10, 0.4, quality.segments/2),
                position: [-0.1, 0.4, 0],
                bindToBone: 'leftUpperLeg'
            },
            leftLowerLeg: {
                geometry: new THREE.CylinderGeometry(0.06, 0.08, 0.4, quality.segments/2),
                position: [-0.1, 0, 0],
                bindToBone: 'leftLowerLeg'
            },
            rightUpperLeg: {
                geometry: new THREE.CylinderGeometry(0.08, 0.10, 0.4, quality.segments/2),
                position: [0.1, 0.4, 0],
                bindToBone: 'rightUpperLeg'
            },
            rightLowerLeg: {
                geometry: new THREE.CylinderGeometry(0.06, 0.08, 0.4, quality.segments/2),
                position: [0.1, 0, 0],
                bindToBone: 'rightLowerLeg'
            }
        };
        
        // Create meshes for each body part
        const meshes = [];
        
        Object.entries(bodyParts).forEach(([name, part]) => {
            const mesh = new THREE.SkinnedMesh(part.geometry, material);
            mesh.name = name;
            
            if (part.position) {
                mesh.position.set(...part.position);
            }
            
            if (part.rotation) {
                mesh.rotation.set(...part.rotation);
            }
            
            // Bind to skeleton
            mesh.bind(skeleton);
            
            group.add(mesh);
            meshes.push(mesh);
        });
        
        group.skeleton = skeleton;
        return group;
    }
    
    /**
     * Create animations
     */
    createAnimations(skeleton) {
        const animations = new Map();
        
        // Idle animation (breathing, slight sway)
        animations.set('idle', {
            duration: 3000,
            loop: true,
            keyframes: {
                spine2: [
                    { time: 0, rotation: [0, 0, 0] },
                    { time: 1500, rotation: [0.02, 0, 0] },
                    { time: 3000, rotation: [0, 0, 0] }
                ],
                head: [
                    { time: 0, rotation: [0, 0, 0] },
                    { time: 1000, rotation: [0, 0.1, 0] },
                    { time: 2000, rotation: [0, -0.1, 0] },
                    { time: 3000, rotation: [0, 0, 0] }
                ]
            }
        });
        
        // Walk animation
        animations.set('walk', {
            duration: 1000,
            loop: true,
            keyframes: {
                leftUpperLeg: [
                    { time: 0, rotation: [-0.3, 0, 0] },
                    { time: 500, rotation: [0.3, 0, 0] },
                    { time: 1000, rotation: [-0.3, 0, 0] }
                ],
                rightUpperLeg: [
                    { time: 0, rotation: [0.3, 0, 0] },
                    { time: 500, rotation: [-0.3, 0, 0] },
                    { time: 1000, rotation: [0.3, 0, 0] }
                ],
                leftUpperArm: [
                    { time: 0, rotation: [0.2, 0, 0] },
                    { time: 500, rotation: [-0.2, 0, 0] },
                    { time: 1000, rotation: [0.2, 0, 0] }
                ],
                rightUpperArm: [
                    { time: 0, rotation: [-0.2, 0, 0] },
                    { time: 500, rotation: [0.2, 0, 0] },
                    { time: 1000, rotation: [-0.2, 0, 0] }
                ]
            }
        });
        
        // Wave animation
        animations.set('wave', {
            duration: 2000,
            loop: false,
            keyframes: {
                rightUpperArm: [
                    { time: 0, rotation: [0, 0, 0] },
                    { time: 500, rotation: [0, 0, -2.5] },
                    { time: 1500, rotation: [0, 0, -2.5] },
                    { time: 2000, rotation: [0, 0, 0] }
                ],
                rightLowerArm: [
                    { time: 0, rotation: [0, 0, 0] },
                    { time: 500, rotation: [0, 0, 0] },
                    { time: 750, rotation: [0, 0, -0.5] },
                    { time: 1000, rotation: [0, 0, 0.5] },
                    { time: 1250, rotation: [0, 0, -0.5] },
                    { time: 1500, rotation: [0, 0, 0] },
                    { time: 2000, rotation: [0, 0, 0] }
                ]
            }
        });
        
        return animations;
    }
    
    /**
     * Update humanoid animation
     */
    updateHumanoid(id, deltaTime) {
        const humanoid = this.humanoids.get(id);
        if (!humanoid) return;
        
        // Update physics
        const physicsUpdate = this.physics.updateCharacter(humanoid.physicsBody, deltaTime);
        
        // Apply physics to skeleton
        this.applyPhysicsToSkeleton(humanoid.skeleton, physicsUpdate);
        
        // Update current animation
        this.updateAnimation(humanoid, deltaTime);
    }
    
    applyPhysicsToSkeleton(skeleton, physicsUpdate) {
        // Apply physics-calculated positions to bones
        if (physicsUpdate.bones) {
            physicsUpdate.bones.forEach(boneUpdate => {
                const bone = skeleton.getBoneByName(boneUpdate.name);
                if (bone) {
                    bone.position.copy(boneUpdate.position);
                    bone.quaternion.copy(boneUpdate.quaternion);
                }
            });
        }
        
        // Apply IK solutions
        if (physicsUpdate.ikSolutions) {
            Object.entries(physicsUpdate.ikSolutions).forEach(([chainName, solution]) => {
                const chain = skeleton.ikChains[chainName];
                if (chain) {
                    solution.forEach((jointRotation, index) => {
                        if (chain.bones[index]) {
                            chain.bones[index].rotation.copy(jointRotation);
                        }
                    });
                }
            });
        }
    }
    
    updateAnimation(humanoid, deltaTime) {
        const animation = humanoid.animations.get(humanoid.state.animation);
        if (!animation) return;
        
        // Update animation time
        humanoid.animationTime = (humanoid.animationTime || 0) + deltaTime;
        
        if (animation.loop) {
            humanoid.animationTime %= animation.duration;
        }
        
        // Apply keyframes
        Object.entries(animation.keyframes).forEach(([boneName, keyframes]) => {
            const bone = humanoid.skeleton.getBoneByName(boneName);
            if (!bone) return;
            
            // Find current keyframe
            const time = humanoid.animationTime;
            let prevKey = keyframes[0];
            let nextKey = keyframes[1];
            
            for (let i = 0; i < keyframes.length - 1; i++) {
                if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
                    prevKey = keyframes[i];
                    nextKey = keyframes[i + 1];
                    break;
                }
            }
            
            // Interpolate between keyframes
            const t = (time - prevKey.time) / (nextKey.time - prevKey.time);
            
            if (prevKey.rotation && nextKey.rotation) {
                bone.rotation.x = THREE.MathUtils.lerp(prevKey.rotation[0], nextKey.rotation[0], t);
                bone.rotation.y = THREE.MathUtils.lerp(prevKey.rotation[1], nextKey.rotation[1], t);
                bone.rotation.z = THREE.MathUtils.lerp(prevKey.rotation[2], nextKey.rotation[2], t);
            }
        });
    }
    
    /**
     * Switch rendering quality based on performance
     */
    async adaptQuality(performanceMetrics) {
        const fps = performanceMetrics.fps || 60;
        const frameTime = performanceMetrics.frameTime || 16;
        
        // Downgrade if performance is poor
        if (fps < 30 || frameTime > 33) {
            if (this.currentQuality === 'high') {
                this.currentQuality = 'medium';
            } else if (this.currentQuality === 'medium') {
                this.currentQuality = 'low';
            }
            
            console.log(`📉 Downgrading to ${this.currentQuality} quality`);
            await this.rebuildHumanoids();
        }
        
        // Upgrade if performance is good
        else if (fps > 55 && frameTime < 18) {
            if (this.currentQuality === 'low') {
                this.currentQuality = 'medium';
            } else if (this.currentQuality === 'medium') {
                this.currentQuality = 'high';
            }
            
            console.log(`📈 Upgrading to ${this.currentQuality} quality`);
            await this.rebuildHumanoids();
        }
    }
    
    async rebuildHumanoids() {
        // Rebuild all humanoids with new quality settings
        const humanoidData = Array.from(this.humanoids.values()).map(h => ({
            id: h.id,
            state: h.state,
            type: h.physicsBody.type
        }));
        
        // Clear existing
        this.humanoids.clear();
        
        // Recreate with new quality
        for (const data of humanoidData) {
            const humanoid = this.createHumanoid({
                id: data.id,
                type: data.type
            });
            
            // Restore state
            humanoid.state = data.state;
        }
    }
    
    /**
     * Export for use in different render modes
     */
    exportForRenderMode(id, mode) {
        const humanoid = this.humanoids.get(id);
        if (!humanoid) return null;
        
        switch (mode) {
            case '2d':
                // Export as sprite sheet data
                return {
                    sprite: this.generateSpriteFromModel(humanoid),
                    animations: this.convert3DAnimationsTo2D(humanoid.animations),
                    state: humanoid.state
                };
                
            case '2.5d':
                // Export as isometric data
                return {
                    isometricMesh: this.convertToIsometric(humanoid.mesh),
                    skeleton: humanoid.skeleton,
                    state: humanoid.state
                };
                
            case '3d':
                // Export full 3D data
                return {
                    mesh: humanoid.mesh,
                    skeleton: humanoid.skeleton,
                    animations: humanoid.animations,
                    physics: humanoid.physicsBody,
                    state: humanoid.state
                };
        }
    }
    
    generateSpriteFromModel(humanoid) {
        // Render 3D model to 2D sprite
        // This would use Three.js render-to-texture
        return {
            texture: 'generated-sprite-texture',
            frames: {
                idle: [0, 0, 64, 64],
                walk: [64, 0, 64, 64],
                wave: [128, 0, 64, 64]
            }
        };
    }
    
    convert3DAnimationsTo2D(animations3D) {
        // Convert 3D animations to 2D sprite animations
        const animations2D = new Map();
        
        animations3D.forEach((anim, name) => {
            animations2D.set(name, {
                frames: this.calculateSpriteFrames(anim),
                duration: anim.duration,
                loop: anim.loop
            });
        });
        
        return animations2D;
    }
    
    calculateSpriteFrames(animation3D) {
        // Calculate sprite frames from 3D animation
        const frameCount = Math.ceil(animation3D.duration / 100); // 10 FPS
        return Array.from({ length: frameCount }, (_, i) => i);
    }
    
    convertToIsometric(mesh3D) {
        // Convert 3D mesh to isometric projection
        const isometricMesh = mesh3D.clone();
        
        // Apply isometric transformation
        isometricMesh.rotation.set(-Math.PI / 6, Math.PI / 4, 0);
        isometricMesh.scale.set(1, 0.8, 1); // Slight vertical compression
        
        return isometricMesh;
    }
}

// Export for use
if (require.main === module) {
    const humanoidSystem = new Unified3DHumanoidSystem();
    
    humanoidSystem.initialize().then(() => {
        // Create a test humanoid
        const testHumanoid = humanoidSystem.createHumanoid({
            type: 'player',
            behaviors: ['idle', 'walk', 'wave', 'dance']
        });
        
        console.log('\n✅ Humanoid system ready!');
        console.log('📊 Current quality:', humanoidSystem.currentQuality);
        console.log('🧍 Test humanoid created:', testHumanoid.id);
        
        // Simulate animation loop
        let lastTime = Date.now();
        setInterval(() => {
            const now = Date.now();
            const deltaTime = now - lastTime;
            lastTime = now;
            
            humanoidSystem.updateHumanoid(testHumanoid.id, deltaTime);
        }, 16); // 60 FPS
    });
}

module.exports = Unified3DHumanoidSystem;