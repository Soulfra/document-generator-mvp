#!/usr/bin/env node

/**
 * MATHEMATICAL GEAR ENGINE
 * 
 * Powers the entire system with π-based gear ratios and mathematical harmony
 * Where π in full rotation = 4 quarters, creating perfect gear train mechanics
 * Connects Ring 0-5 systems, COBOL bridges, and all rotating components
 */

const EventEmitter = require('events');
const Ring0MathematicalCore = require('./ring-0-mathematical-core');
const COBOLGameEconomyWrapper = require('./token-economy-feed/src/cobol/COBOLGameEconomyWrapper');

class MathematicalGearEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Core mathematical constants
            PI: Math.PI,
            TWO_PI: 2 * Math.PI,
            HALF_PI: Math.PI / 2,
            QUARTER_PI: Math.PI / 4,
            
            // Gear system configuration
            masterGearRPM: 60, // Base rotation speed (1 rotation per second)
            tickRate: 100, // Update rate in milliseconds
            enableHarmonicResonance: true,
            enableCOBOLGearTrains: true,
            enableVisualSync: true,
            
            // Mathematical harmony settings
            goldenRatio: (1 + Math.sqrt(5)) / 2, // φ (phi)
            eulerConstant: Math.E,
            sqrt2: Math.sqrt(2),
            
            ...options
        };
        
        // Initialize core systems
        this.ring0Core = null;
        this.cobolWrapper = null;
        this.initializeCoreConnections();
        
        // Gear system state
        this.gearSystem = {
            // Ring 0-5 gear configurations
            rings: new Map(),
            
            // COBOL gear trains
            cobolGearTrains: new Map(),
            
            // Master timing
            masterRotation: 0, // Current rotation in radians
            systemStartTime: Date.now(),
            
            // Gear relationships
            gearRatios: new Map(),
            gearConnections: new Map(),
            
            // Performance metrics
            rotationSpeed: 0,
            harmonicFrequency: 0,
            systemEfficiency: 1.0,
            
            // Synchronization state
            synchronized: false,
            lastSyncTime: 0,
            syncTolerance: 0.01 // Radians tolerance for synchronization
        };
        
        // Initialize gear configurations
        this.initializeRingGears();
        this.initializeCOBOLGearTrains();
        this.setupGearRelationships();
        
        console.log('⚙️ Mathematical Gear Engine initializing...');
        this.startGearSystem();
    }
    
    async initializeCoreConnections() {
        try {
            // Connect to Ring 0 Mathematical Core
            this.ring0Core = new Ring0MathematicalCore();
            console.log('🔗 Connected to Ring 0 Mathematical Core');
            
            // Connect to COBOL wrapper
            this.cobolWrapper = new COBOLGameEconomyWrapper();
            console.log('🔗 Connected to COBOL Economy Wrapper');
            
        } catch (error) {
            console.warn('⚠️ Some core connections failed:', error.message);
        }
    }
    
    initializeRingGears() {
        // Define each Ring (0-5) as a gear with π-based ratios
        const ringConfigs = [
            {
                id: 0,
                name: 'Mathematical Core',
                baseRadius: 50,
                gearRatio: 1.0, // Master gear
                rotationDirection: 1, // Clockwise
                color: '#FF0000',
                mathConstant: this.config.PI,
                purpose: 'Mathematical foundations and RNG'
            },
            {
                id: 1,
                name: 'User Data Layer',
                baseRadius: 40,
                gearRatio: this.config.PI / 2, // π/2 ratio
                rotationDirection: -1, // Counter-clockwise
                color: '#FF8800',
                mathConstant: this.config.HALF_PI,
                purpose: 'User profiles and data processing'
            },
            {
                id: 2,
                name: 'Game Mechanics',
                baseRadius: 60,
                gearRatio: this.config.PI / 4, // π/4 ratio
                rotationDirection: 1,
                color: '#FFFF00',
                mathConstant: this.config.QUARTER_PI,
                purpose: 'Game logic and mechanics'
            },
            {
                id: 3,
                name: 'Visual Systems',
                baseRadius: 35,
                gearRatio: this.config.TWO_PI / 3, // 2π/3 ratio
                rotationDirection: -1,
                color: '#00FF00',
                mathConstant: (2 * this.config.PI) / 3,
                purpose: 'Rendering and visual processing'
            },
            {
                id: 4,
                name: 'Extraction Layer',
                baseRadius: 45,
                gearRatio: this.config.goldenRatio, // φ (golden ratio)
                rotationDirection: 1,
                color: '#0088FF',
                mathConstant: this.config.goldenRatio,
                purpose: 'Data extraction and modular systems'
            },
            {
                id: 5,
                name: 'Broadcast Layer',
                baseRadius: 55,
                gearRatio: this.config.eulerConstant / this.config.PI, // e/π ratio
                rotationDirection: -1,
                color: '#8800FF',
                mathConstant: this.config.eulerConstant,
                purpose: 'Broadcasting and distribution'
            }
        ];
        
        ringConfigs.forEach(config => {
            const gear = this.createGear(config);
            this.gearSystem.rings.set(config.id, gear);
            console.log(`⚙️ Ring ${config.id} gear initialized: ${config.name}`);
        });
    }
    
    createGear(config) {
        return {
            ...config,
            
            // Current state
            currentRotation: 0, // Current rotation in radians
            angularVelocity: 0, // Radians per second
            lastUpdateTime: Date.now(),
            
            // Calculated properties
            circumference: 2 * this.config.PI * config.baseRadius,
            teethCount: Math.floor(config.baseRadius * this.config.PI / 2), // Teeth based on radius
            
            // Performance metrics
            efficiency: 1.0,
            load: 0.0, // Current computational load
            temperature: 20.0, // Simulated temperature in Celsius
            
            // Visual properties for rendering
            position: { x: 0, y: 0 }, // Will be calculated based on layout
            connections: [], // Connected gears
            
            // Mathematical properties
            harmonicFrequency: this.calculateHarmonicFrequency(config.gearRatio),
            resonancePoint: config.mathConstant,
            
            // Status
            active: true,
            synchronized: false,
            lastSync: 0
        };
    }
    
    calculateHarmonicFrequency(gearRatio) {
        // Calculate harmonic frequency based on gear ratio and π
        const baseFrequency = this.config.masterGearRPM / 60; // Hz
        return baseFrequency * gearRatio * this.config.PI;
    }
    
    initializeCOBOLGearTrains() {
        // COBOL gear trains for system bridging
        const cobolTrains = [
            {
                id: 'legacy-bridge',
                name: 'Legacy System Bridge',
                inputGear: 0, // Ring 0
                outputGear: 5, // Ring 5
                gearRatio: this.config.PI, // π:1 ratio
                purpose: 'Bridge mathematical core to broadcast layer',
                efficiency: 0.95,
                active: true
            },
            {
                id: 'data-processing-train',
                name: 'Data Processing Train',
                inputGear: 1, // Ring 1
                outputGear: 3, // Ring 3
                gearRatio: this.config.sqrt2, // √2:1 ratio
                purpose: 'Process user data into visual systems',
                efficiency: 0.98,
                active: true
            },
            {
                id: 'game-extraction-train',
                name: 'Game Extraction Train',
                inputGear: 2, // Ring 2
                outputGear: 4, // Ring 4
                gearRatio: this.config.goldenRatio, // φ:1 ratio
                purpose: 'Extract game mechanics for modular use',
                efficiency: 0.92,
                active: true
            }
        ];
        
        cobolTrains.forEach(train => {
            this.gearSystem.cobolGearTrains.set(train.id, train);
            console.log(`🔗 COBOL gear train initialized: ${train.name}`);
        });
    }
    
    setupGearRelationships() {
        // Setup gear-to-gear relationships based on mathematical harmony
        
        // Ring 0 (master) connects to all other rings
        const masterGear = this.gearSystem.rings.get(0);
        for (let i = 1; i <= 5; i++) {
            const gear = this.gearSystem.rings.get(i);
            this.connectGears(masterGear, gear, gear.gearRatio);
        }
        
        // Setup harmonic relationships
        this.setupHarmonicRelationships();
        
        // Calculate gear positions for visual layout
        this.calculateGearPositions();
        
        console.log('🔗 Gear relationships established');
    }
    
    connectGears(gearA, gearB, ratio) {
        const connection = {
            targetGear: gearB.id,
            ratio: ratio,
            type: 'direct',
            efficiency: 0.98
        };
        
        gearA.connections.push(connection);
        
        // Store relationship for bidirectional access
        this.gearSystem.gearConnections.set(`${gearA.id}-${gearB.id}`, {
            gearA: gearA.id,
            gearB: gearB.id,
            ratio: ratio,
            reverseRatio: 1 / ratio
        });
    }
    
    setupHarmonicRelationships() {
        // Create harmonic relationships based on mathematical constants
        
        // π-based harmonics (Rings 0, 1, 2)
        this.gearSystem.gearRatios.set('pi-harmonic', {
            gears: [0, 1, 2],
            baseRatio: this.config.PI,
            harmonicMultipliers: [1, 1/2, 1/4], // π, π/2, π/4
            resonanceFrequency: this.config.PI * 2
        });
        
        // Golden ratio harmonics (Rings 3, 4)
        this.gearSystem.gearRatios.set('golden-harmonic', {
            gears: [3, 4],
            baseRatio: this.config.goldenRatio,
            harmonicMultipliers: [1, this.config.goldenRatio],
            resonanceFrequency: this.config.goldenRatio * this.config.PI
        });
        
        // Euler harmonics (Ring 5)
        this.gearSystem.gearRatios.set('euler-harmonic', {
            gears: [5],
            baseRatio: this.config.eulerConstant,
            harmonicMultipliers: [1],
            resonanceFrequency: this.config.eulerConstant * this.config.PI
        });
    }
    
    calculateGearPositions() {
        // Arrange gears in a hexagonal pattern with Ring 0 at center
        const centerX = 0;
        const centerY = 0;
        const radius = 150; // Distance from center
        
        // Ring 0 at center
        const centerGear = this.gearSystem.rings.get(0);
        centerGear.position = { x: centerX, y: centerY };
        
        // Arrange other rings in a circle
        for (let i = 1; i <= 5; i++) {
            const angle = ((i - 1) * 2 * this.config.PI) / 5; // Pentagon arrangement
            const gear = this.gearSystem.rings.get(i);
            
            gear.position = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        }
    }
    
    startGearSystem() {
        console.log('⚙️ Starting gear system...');
        
        // Start main gear rotation loop
        this.gearInterval = setInterval(() => {
            this.updateGearRotations();
        }, this.config.tickRate);
        
        // Start harmonic resonance monitoring
        if (this.config.enableHarmonicResonance) {
            this.startHarmonicResonance();
        }
        
        // Start COBOL gear train monitoring
        if (this.config.enableCOBOLGearTrains) {
            this.startCOBOLGearTrains();
        }
        
        // Start synchronization monitoring
        this.startSynchronizationMonitoring();
        
        this.emit('gear_system_started');
        console.log('✅ Mathematical Gear Engine active');
    }
    
    updateGearRotations() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.gearSystem.systemStartTime) / 1000; // Seconds
        
        // Update master rotation
        const oldMasterRotation = this.gearSystem.masterRotation;
        this.gearSystem.masterRotation = (deltaTime * this.config.masterGearRPM * this.config.TWO_PI) / 60;
        
        // Normalize rotation to 0-2π range
        this.gearSystem.masterRotation = this.gearSystem.masterRotation % this.config.TWO_PI;
        
        // Calculate rotation speed
        const rotationDelta = this.gearSystem.masterRotation - oldMasterRotation;
        this.gearSystem.rotationSpeed = rotationDelta / (this.config.tickRate / 1000);
        
        // Update each ring gear
        this.gearSystem.rings.forEach((gear, ringId) => {
            this.updateGearRotation(gear, currentTime);
        });
        
        // Update COBOL gear trains
        this.updateCOBOLGearTrains();
        
        // Check synchronization
        this.checkSynchronization();
        
        // Emit rotation update
        this.emit('rotation_update', {
            masterRotation: this.gearSystem.masterRotation,
            rotationSpeed: this.gearSystem.rotationSpeed,
            timestamp: currentTime
        });
    }
    
    updateGearRotation(gear, currentTime) {
        const deltaTime = (currentTime - gear.lastUpdateTime) / 1000;
        
        // Calculate rotation based on gear ratio and master rotation
        const targetRotation = (this.gearSystem.masterRotation * gear.gearRatio * gear.rotationDirection) % this.config.TWO_PI;
        
        // Smooth rotation interpolation
        const rotationDiff = targetRotation - gear.currentRotation;
        gear.angularVelocity = rotationDiff / deltaTime;
        gear.currentRotation = targetRotation;
        
        // Update performance metrics
        gear.load = Math.abs(gear.angularVelocity) / (2 * this.config.PI); // Normalized load
        gear.temperature = 20 + (gear.load * 10); // Temperature based on load
        gear.efficiency = Math.max(0.8, 1.0 - (gear.load * 0.1)); // Efficiency decreases with load
        
        gear.lastUpdateTime = currentTime;
    }
    
    updateCOBOLGearTrains() {
        this.gearSystem.cobolGearTrains.forEach((train, trainId) => {
            if (!train.active) return;
            
            const inputGear = this.gearSystem.rings.get(train.inputGear);
            const outputGear = this.gearSystem.rings.get(train.outputGear);
            
            if (inputGear && outputGear) {
                // Calculate gear train transmission
                const transmittedRotation = inputGear.currentRotation * train.gearRatio * train.efficiency;
                const expectedOutputRotation = transmittedRotation % this.config.TWO_PI;
                
                // Apply COBOL processing delay (simulated)
                const processingDelay = 0.1; // 100ms delay
                setTimeout(() => {
                    this.emit('cobol_gear_train_update', {
                        trainId,
                        inputRotation: inputGear.currentRotation,
                        outputRotation: expectedOutputRotation,
                        efficiency: train.efficiency
                    });
                }, processingDelay * 1000);
            }
        });
    }
    
    checkSynchronization() {
        let allSynchronized = true;
        const masterRotation = this.gearSystem.masterRotation;
        
        this.gearSystem.rings.forEach((gear, ringId) => {
            const expectedRotation = (masterRotation * gear.gearRatio) % this.config.TWO_PI;
            const rotationDiff = Math.abs(gear.currentRotation - expectedRotation);
            
            gear.synchronized = rotationDiff < this.gearSystem.syncTolerance;
            
            if (!gear.synchronized) {
                allSynchronized = false;
            }
        });
        
        const wassynchronized = this.gearSystem.synchronized;
        this.gearSystem.synchronized = allSynchronized;
        
        if (!wasynchronized && allSynchronized) {
            this.gearSystem.lastSyncTime = Date.now();
            this.emit('system_synchronized');
            console.log('🔗 Gear system synchronized');
        }
    }
    
    startHarmonicResonance() {
        console.log('🎵 Starting harmonic resonance monitoring...');
        
        setInterval(() => {
            this.gearSystem.gearRatios.forEach((harmonic, harmonicId) => {
                const harmonicFrequency = this.calculateHarmonicFrequency(harmonic.baseRatio);
                const resonance = this.checkResonance(harmonic);
                
                if (resonance > 0.9) {
                    this.emit('harmonic_resonance', {
                        harmonicId,
                        frequency: harmonicFrequency,
                        resonance,
                        gears: harmonic.gears
                    });
                }
            });
        }, 1000);
    }
    
    checkResonance(harmonic) {
        let totalResonance = 0;
        let gearCount = 0;
        
        harmonic.gears.forEach((gearId, index) => {
            const gear = this.gearSystem.rings.get(gearId);
            if (gear) {
                const expectedFrequency = harmonic.resonanceFrequency * harmonic.harmonicMultipliers[index];
                const actualFrequency = gear.harmonicFrequency;
                const resonance = 1 - Math.abs(expectedFrequency - actualFrequency) / expectedFrequency;
                
                totalResonance += Math.max(0, resonance);
                gearCount++;
            }
        });
        
        return gearCount > 0 ? totalResonance / gearCount : 0;
    }
    
    startCOBOLGearTrains() {
        console.log('🔗 Starting COBOL gear train monitoring...');
        
        // Monitor COBOL processing efficiency
        setInterval(() => {
            this.gearSystem.cobolGearTrains.forEach((train, trainId) => {
                // Simulate COBOL processing load
                const processingLoad = Math.random() * 0.3 + 0.7; // 70-100% efficiency
                train.efficiency = processingLoad;
                
                this.emit('cobol_processing_update', {
                    trainId,
                    efficiency: train.efficiency,
                    load: 1 - processingLoad
                });
            });
        }, 2000);
    }
    
    startSynchronizationMonitoring() {
        console.log('🔄 Starting synchronization monitoring...');
        
        setInterval(() => {
            this.emit('synchronization_status', {
                synchronized: this.gearSystem.synchronized,
                lastSyncTime: this.gearSystem.lastSyncTime,
                syncTolerance: this.gearSystem.syncTolerance,
                masterRotation: this.gearSystem.masterRotation
            });
        }, 500);
    }
    
    // Public API methods
    
    getGearStatus(ringId = null) {
        if (ringId !== null) {
            return this.gearSystem.rings.get(ringId);
        }
        
        return {
            masterRotation: this.gearSystem.masterRotation,
            rotationSpeed: this.gearSystem.rotationSpeed,
            synchronized: this.gearSystem.synchronized,
            rings: Array.from(this.gearSystem.rings.values()),
            cobolTrains: Array.from(this.gearSystem.cobolGearTrains.values())
        };
    }
    
    setGearSpeed(speedMultiplier) {
        this.config.masterGearRPM *= speedMultiplier;
        console.log(`⚡ Gear speed adjusted: ${this.config.masterGearRPM} RPM`);
        
        this.emit('speed_changed', {
            newRPM: this.config.masterGearRPM,
            multiplier: speedMultiplier
        });
    }
    
    triggerManualSync() {
        console.log('🔄 Manual synchronization triggered');
        
        // Reset all gear rotations to synchronized state
        const masterRotation = this.gearSystem.masterRotation;
        
        this.gearSystem.rings.forEach((gear, ringId) => {
            gear.currentRotation = (masterRotation * gear.gearRatio) % this.config.TWO_PI;
            gear.synchronized = true;
        });
        
        this.gearSystem.synchronized = true;
        this.gearSystem.lastSyncTime = Date.now();
        
        this.emit('manual_sync_completed');
    }
    
    getMathematicalConstants() {
        return {
            PI: this.config.PI,
            TWO_PI: this.config.TWO_PI,
            HALF_PI: this.config.HALF_PI,
            QUARTER_PI: this.config.QUARTER_PI,
            goldenRatio: this.config.goldenRatio,
            eulerConstant: this.config.eulerConstant,
            sqrt2: this.config.sqrt2
        };
    }
    
    shutdown() {
        console.log('⚙️ Shutting down Mathematical Gear Engine...');
        
        if (this.gearInterval) {
            clearInterval(this.gearInterval);
        }
        
        this.emit('gear_system_stopped');
        console.log('✅ Gear system stopped');
    }
}

module.exports = MathematicalGearEngine;

// CLI functionality when run directly
if (require.main === module) {
    const gearEngine = new MathematicalGearEngine({
        masterGearRPM: 30, // Slower for demo
        enableVisualSync: true
    });
    
    console.log('\n⚙️ MATHEMATICAL GEAR ENGINE Demo');
    console.log('==================================\n');
    
    // Show gear status every 2 seconds
    setInterval(() => {
        const status = gearEngine.getGearStatus();
        console.log(`🔄 Master Rotation: ${(status.masterRotation * 180 / Math.PI).toFixed(1)}° | Speed: ${status.rotationSpeed.toFixed(2)} rad/s | Sync: ${status.synchronized ? '✅' : '❌'}`);
        
        // Show ring statuses
        status.rings.forEach(gear => {
            const degrees = (gear.currentRotation * 180 / Math.PI).toFixed(1);
            const syncStatus = gear.synchronized ? '✅' : '❌';
            console.log(`  Ring ${gear.id}: ${degrees}° ${syncStatus} (${gear.name})`);
        });
        
        console.log(''); // Blank line for readability
    }, 2000);
    
    // Listen for harmonic resonance
    gearEngine.on('harmonic_resonance', (data) => {
        console.log(`🎵 Harmonic resonance detected: ${data.harmonicId} (${data.resonance.toFixed(3)})`);
    });
    
    // Listen for synchronization events
    gearEngine.on('system_synchronized', () => {
        console.log('🔗 🎉 SYSTEM FULLY SYNCHRONIZED! All gears turning in perfect harmony! 🎉');
    });
    
    // Trigger manual sync after 10 seconds
    setTimeout(() => {
        console.log('🔄 Triggering manual synchronization...');
        gearEngine.triggerManualSync();
    }, 10000);
    
    // Speed adjustment demo after 15 seconds
    setTimeout(() => {
        console.log('⚡ Increasing gear speed by 1.5x...');
        gearEngine.setGearSpeed(1.5);
    }, 15000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n⚙️ Gear system shutting down...');
        gearEngine.shutdown();
        process.exit(0);
    });
}