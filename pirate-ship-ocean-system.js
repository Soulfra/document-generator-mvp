#!/usr/bin/env node

/**
 * 🌊⛵ Pirate Ship Ocean System
 * 
 * Simple wave mechanics for pirate ships without complex physics.
 * Uses existing wave topography mapper and sends data to Unity/Godot.
 * 
 * Features:
 * - Simple sine wave ocean surface
 * - Ship bobbing and tilting
 * - Wave collision detection for splashes
 * - Sonar integration for underwater effects
 * - Direct streaming to game engines
 * 
 * Philosophy: "Let Unity/Godot handle rendering, we just send the math"
 */

const { EventEmitter } = require('events');

// Import existing systems
const WaveTopographyMapper = require('./wave-topography-mapper.js');
const SonarInformationDisplay = require('./SONAR-INFORMATION-DISPLAY.js');

class PirateShipOceanSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Ocean dimensions
            oceanSize: config.oceanSize || { width: 1000, depth: 1000 },
            
            // Wave parameters (kept simple)
            waves: {
                primary: {
                    amplitude: config.primaryAmplitude || 2.0,
                    wavelength: config.primaryWavelength || 50,
                    speed: config.primarySpeed || 1.0,
                    direction: config.primaryDirection || 0 // degrees
                },
                secondary: {
                    amplitude: config.secondaryAmplitude || 1.0,
                    wavelength: config.secondaryWavelength || 25,
                    speed: config.secondarySpeed || 1.5,
                    direction: config.secondaryDirection || 45
                },
                detail: {
                    amplitude: config.detailAmplitude || 0.3,
                    wavelength: config.detailWavelength || 10,
                    speed: config.detailSpeed || 2.0,
                    direction: config.detailDirection || 90
                }
            },
            
            // Ship physics (simplified)
            shipPhysics: {
                bobHeight: config.bobHeight || 0.1,
                bobSpeed: config.bobSpeed || 0.5,
                tiltAmount: config.tiltAmount || 5, // degrees
                splashThreshold: config.splashThreshold || 1.5
            },
            
            // Performance
            updateRate: config.updateRate || 30, // Hz
            gridResolution: config.gridResolution || 50, // points per axis
            
            ...config
        };
        
        // Use existing wave mapper for sound-based features
        this.waveMapper = new WaveTopographyMapper();
        
        // Sonar for underwater detection
        this.sonar = null; // Initialize if needed
        
        // Ocean state
        this.state = {
            time: 0,
            ships: new Map(),
            waveGrid: null,
            lastUpdate: Date.now()
        };
        
        // Pre-calculate wave directions
        this.waveVectors = this.calculateWaveVectors();
        
        console.log('🌊 Pirate Ship Ocean System initialized');
        console.log('⛵ Simple wave mechanics ready');
        console.log('🎯 Direct streaming to game engines');
    }
    
    /**
     * Calculate wave direction vectors
     */
    calculateWaveVectors() {
        const vectors = {};
        
        for (const [name, wave] of Object.entries(this.config.waves)) {
            const radians = (wave.direction * Math.PI) / 180;
            vectors[name] = {
                x: Math.cos(radians),
                z: Math.sin(radians)
            };
        }
        
        return vectors;
    }
    
    /**
     * Add a ship to the ocean
     */
    addShip(shipId, initialPosition = { x: 0, z: 0 }) {
        this.state.ships.set(shipId, {
            id: shipId,
            position: { ...initialPosition, y: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            bobPhase: Math.random() * Math.PI * 2,
            lastWaveHeight: 0,
            splashing: false
        });
        
        console.log(`⛵ Added ship: ${shipId} at (${initialPosition.x}, ${initialPosition.z})`);
        
        return this.state.ships.get(shipId);
    }
    
    /**
     * Update ocean simulation
     */
    update(deltaTime = null) {
        // Calculate delta time if not provided
        const now = Date.now();
        const dt = deltaTime || (now - this.state.lastUpdate) / 1000;
        this.state.lastUpdate = now;
        
        // Update time
        this.state.time += dt;
        
        // Update wave grid (for rendering)
        this.updateWaveGrid();
        
        // Update each ship
        for (const ship of this.state.ships.values()) {
            this.updateShip(ship, dt);
        }
        
        // Return current state for streaming
        return this.getStreamData();
    }
    
    /**
     * Update wave height grid for rendering
     */
    updateWaveGrid() {
        const { width, depth } = this.config.oceanSize;
        const resolution = this.config.gridResolution;
        
        if (!this.state.waveGrid) {
            this.state.waveGrid = new Float32Array(resolution * resolution);
        }
        
        const stepX = width / (resolution - 1);
        const stepZ = depth / (resolution - 1);
        
        let index = 0;
        for (let iz = 0; iz < resolution; iz++) {
            for (let ix = 0; ix < resolution; ix++) {
                const x = (ix * stepX) - (width / 2);
                const z = (iz * stepZ) - (depth / 2);
                
                this.state.waveGrid[index++] = this.getWaveHeight(x, z, this.state.time);
            }
        }
    }
    
    /**
     * Calculate wave height at position
     */
    getWaveHeight(x, z, time) {
        let height = 0;
        
        // Primary wave
        const primary = this.config.waves.primary;
        const primaryPhase = (
            (x * this.waveVectors.primary.x + z * this.waveVectors.primary.z) / 
            primary.wavelength + 
            time * primary.speed
        );
        height += Math.sin(primaryPhase * Math.PI * 2) * primary.amplitude;
        
        // Secondary wave
        const secondary = this.config.waves.secondary;
        const secondaryPhase = (
            (x * this.waveVectors.secondary.x + z * this.waveVectors.secondary.z) / 
            secondary.wavelength + 
            time * secondary.speed
        );
        height += Math.sin(secondaryPhase * Math.PI * 2) * secondary.amplitude;
        
        // Detail wave
        const detail = this.config.waves.detail;
        const detailPhase = (
            (x * this.waveVectors.detail.x + z * this.waveVectors.detail.z) / 
            detail.wavelength + 
            time * detail.speed
        );
        height += Math.sin(detailPhase * Math.PI * 2) * detail.amplitude;
        
        return height;
    }
    
    /**
     * Get wave normal (for ship tilting)
     */
    getWaveNormal(x, z, time) {
        const epsilon = 0.1;
        
        // Calculate heights at nearby points
        const h0 = this.getWaveHeight(x, z, time);
        const hx = this.getWaveHeight(x + epsilon, z, time);
        const hz = this.getWaveHeight(x, z + epsilon, time);
        
        // Calculate normal vector
        const dx = (hx - h0) / epsilon;
        const dz = (hz - h0) / epsilon;
        
        // Return tilt angles
        return {
            tiltX: Math.atan(dz) * (180 / Math.PI), // Pitch
            tiltZ: -Math.atan(dx) * (180 / Math.PI) // Roll
        };
    }
    
    /**
     * Update ship position and rotation
     */
    updateShip(ship, dt) {
        // Get wave height at ship position
        const waveHeight = this.getWaveHeight(ship.position.x, ship.position.z, this.state.time);
        
        // Add bobbing effect
        const bobOffset = Math.sin(this.state.time * this.config.shipPhysics.bobSpeed + ship.bobPhase) * 
                         this.config.shipPhysics.bobHeight;
        
        // Update ship height
        ship.position.y = waveHeight + bobOffset;
        
        // Get wave normal for tilting
        const normal = this.getWaveNormal(ship.position.x, ship.position.z, this.state.time);
        
        // Apply tilt with damping
        const tiltDamping = 0.1;
        ship.rotation.x = this.lerp(ship.rotation.x, normal.tiltX * this.config.shipPhysics.tiltAmount, tiltDamping);
        ship.rotation.z = this.lerp(ship.rotation.z, normal.tiltZ * this.config.shipPhysics.tiltAmount, tiltDamping);
        
        // Check for splashing
        const waveSpeed = Math.abs(waveHeight - ship.lastWaveHeight) / dt;
        ship.splashing = waveSpeed > this.config.shipPhysics.splashThreshold;
        ship.lastWaveHeight = waveHeight;
        
        // Emit splash event
        if (ship.splashing) {
            this.emit('splash', {
                shipId: ship.id,
                position: { ...ship.position },
                intensity: waveSpeed / this.config.shipPhysics.splashThreshold
            });
        }
    }
    
    /**
     * Move ship (for player control or AI)
     */
    moveShip(shipId, direction, speed) {
        const ship = this.state.ships.get(shipId);
        if (!ship) return;
        
        // Simple movement
        const radians = (direction * Math.PI) / 180;
        ship.position.x += Math.cos(radians) * speed;
        ship.position.z += Math.sin(radians) * speed;
        
        // Update rotation to face direction
        ship.rotation.y = direction;
    }
    
    /**
     * Get streaming data for game engine
     */
    getStreamData() {
        const ships = Array.from(this.state.ships.values()).map(ship => ({
            id: ship.id,
            transform: {
                position: ship.position,
                rotation: ship.rotation
            },
            effects: {
                splashing: ship.splashing
            }
        }));
        
        return {
            type: 'ocean_update',
            time: this.state.time,
            ships: ships,
            waveGrid: {
                data: Array.from(this.state.waveGrid || []),
                resolution: this.config.gridResolution,
                size: this.config.oceanSize
            },
            waveParams: this.config.waves
        };
    }
    
    /**
     * Get wave data for specific area (for sonar)
     */
    getAreaWaveData(centerX, centerZ, radius) {
        const samples = [];
        const sampleCount = 16;
        
        for (let i = 0; i < sampleCount; i++) {
            const angle = (i / sampleCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const z = centerZ + Math.sin(angle) * radius;
            
            samples.push({
                position: { x, z },
                height: this.getWaveHeight(x, z, this.state.time),
                normal: this.getWaveNormal(x, z, this.state.time)
            });
        }
        
        return samples;
    }
    
    /**
     * Create splash effect data
     */
    createSplash(position, intensity = 1.0) {
        return {
            type: 'splash_effect',
            position: position,
            intensity: intensity,
            timestamp: this.state.time,
            particles: {
                count: Math.floor(20 * intensity),
                velocity: { min: 1, max: 3 * intensity },
                lifetime: { min: 0.5, max: 1.5 },
                size: { min: 0.1, max: 0.3 * intensity }
            }
        };
    }
    
    /**
     * Get wave height preview for next N seconds
     */
    getWavePreview(x, z, duration, steps) {
        const preview = [];
        const timeStep = duration / steps;
        
        for (let i = 0; i <= steps; i++) {
            const futureTime = this.state.time + (i * timeStep);
            preview.push({
                time: futureTime,
                height: this.getWaveHeight(x, z, futureTime)
            });
        }
        
        return preview;
    }
    
    /**
     * Linear interpolation helper
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Start automatic updates
     */
    startSimulation() {
        if (this.updateInterval) return;
        
        const intervalMs = 1000 / this.config.updateRate;
        this.updateInterval = setInterval(() => {
            const data = this.update();
            this.emit('update', data);
        }, intervalMs);
        
        console.log(`🌊 Ocean simulation started at ${this.config.updateRate}Hz`);
    }
    
    /**
     * Stop automatic updates
     */
    stopSimulation() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('🌊 Ocean simulation stopped');
        }
    }
    
    /**
     * Reset ocean state
     */
    reset() {
        this.state.time = 0;
        this.state.ships.clear();
        this.state.waveGrid = null;
        console.log('🌊 Ocean reset');
    }
}

module.exports = PirateShipOceanSystem;

// Demo if run directly
if (require.main === module) {
    console.log('🌊 PIRATE SHIP OCEAN SYSTEM DEMO');
    console.log('=' .repeat(50));
    
    const ocean = new PirateShipOceanSystem({
        primaryAmplitude: 2.0,
        primaryWavelength: 40,
        primarySpeed: 0.8,
        updateRate: 10 // 10Hz for demo
    });
    
    // Add some ships
    ocean.addShip('black_pearl', { x: 0, z: 0 });
    ocean.addShip('flying_dutchman', { x: 50, z: 50 });
    
    // Listen for splashes
    ocean.on('splash', (data) => {
        console.log(`💦 Splash from ${data.shipId} at (${data.position.x.toFixed(1)}, ${data.position.z.toFixed(1)}) intensity: ${data.intensity.toFixed(2)}`);
    });
    
    // Start simulation
    ocean.startSimulation();
    
    // Move ships around
    let angle = 0;
    setInterval(() => {
        angle += 10;
        ocean.moveShip('black_pearl', angle, 2);
        ocean.moveShip('flying_dutchman', -angle, 1.5);
    }, 1000);
    
    // Show ocean data every 3 seconds
    setInterval(() => {
        const data = ocean.getStreamData();
        console.log('\n📊 Ocean State:');
        console.log(`Time: ${data.time.toFixed(1)}s`);
        data.ships.forEach(ship => {
            console.log(`Ship ${ship.id}: height=${ship.transform.position.y.toFixed(2)}m, tilt=(${ship.transform.rotation.x.toFixed(1)}°, ${ship.transform.rotation.z.toFixed(1)}°)`);
        });
    }, 3000);
    
    console.log('\n🎮 Demo running... Press Ctrl+C to stop');
}