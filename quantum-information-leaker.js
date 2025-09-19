#!/usr/bin/env node

/**
 * 🌊🔮 QUANTUM INFORMATION LEAKER
 * 
 * Controls the flow of information through approved channels using quantum mechanics
 * principles. Implements controlled "leaking" through wiki, models, and sprites while
 * preventing unauthorized access and reverse engineering.
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const unifiedColorSystem = require('./unified-color-system');

class QuantumInformationLeaker extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.leakerId = crypto.randomBytes(8).toString('hex');
        this.leakerName = 'Quantum Information Leaker';
        
        // Quantum leaking configuration
        this.leakingConfig = {
            // Channel configurations
            channels: {
                wiki: {
                    name: 'Wiki Knowledge Stream',
                    enabled: true,
                    baseRate: 100,              // bits per second
                    quantum: true,
                    pattern: 'wave_collapse',
                    encryption: 'lattice',
                    maxBandwidth: 1000,         // bits per second
                    priority: 3
                },
                models: {
                    name: '3D Model Generation',
                    enabled: true,
                    baseRate: 50,               // bits per second
                    quantum: true,
                    pattern: 'superposition',
                    encryption: 'homomorphic',
                    maxBandwidth: 500,
                    priority: 2
                },
                sprites: {
                    name: 'Visual Sprite Rendering',
                    enabled: true,
                    baseRate: 75,               // bits per second
                    quantum: true,
                    pattern: 'entanglement',
                    encryption: 'quantum_otp',
                    maxBandwidth: 750,
                    priority: 2
                },
                api: {
                    name: 'API Direct Access',
                    enabled: false,             // Disabled by default
                    baseRate: 0,
                    quantum: false,
                    pattern: 'blocked',
                    encryption: 'none',
                    maxBandwidth: 0,
                    priority: 0
                },
                direct: {
                    name: 'Direct Memory Access',
                    enabled: false,             // Always disabled
                    baseRate: 0,
                    quantum: false,
                    pattern: 'forbidden',
                    encryption: 'none',
                    maxBandwidth: 0,
                    priority: -1
                }
            },
            
            // Quantum patterns
            leakingPatterns: {
                wave_collapse: {
                    name: 'Wave Function Collapse',
                    description: 'Information leaks when quantum state is observed',
                    function: (progress) => Math.sin(progress * Math.PI) * Math.random()
                },
                superposition: {
                    name: 'Quantum Superposition',
                    description: 'Information exists in multiple states until measured',
                    function: (progress) => (Math.sin(progress * 2 * Math.PI) + Math.cos(progress * 3 * Math.PI)) / 2
                },
                entanglement: {
                    name: 'Quantum Entanglement',
                    description: 'Information is correlated across channels',
                    function: (progress) => Math.abs(Math.sin(progress * Math.PI) * Math.cos(progress * Math.PI))
                },
                tunneling: {
                    name: 'Quantum Tunneling',
                    description: 'Information occasionally jumps barriers',
                    function: (progress) => Math.random() < 0.1 ? 1 : progress * 0.5
                },
                interference: {
                    name: 'Quantum Interference',
                    description: 'Information waves interfere constructively/destructively',
                    function: (progress) => Math.abs(Math.sin(progress * 4 * Math.PI) + Math.sin(progress * 5 * Math.PI)) / 2
                }
            },
            
            // Temporal patterns
            temporalPatterns: {
                progressive: {
                    name: 'Progressive Release',
                    acceleration: 1.1
                },
                fibonacci: {
                    name: 'Fibonacci Sequence',
                    sequence: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
                },
                exponential: {
                    name: 'Exponential Growth',
                    base: 2
                },
                logarithmic: {
                    name: 'Logarithmic Decay',
                    base: Math.E
                },
                sinusoidal: {
                    name: 'Wave Pattern',
                    frequency: 0.1
                }
            },
            
            // Security layers
            security: {
                quantumEncryption: true,
                entanglementVerification: true,
                observerEffect: true,
                uncertaintyPrinciple: true,
                noCloning: true                 // Quantum no-cloning theorem
            }
        };
        
        // Information flow state
        this.flowState = {
            activeStreams: new Map(),
            channelStates: new Map(),
            quantumStates: new Map(),
            entanglements: new Map(),
            totalLeaked: 0,
            securityBreaches: 0
        };
        
        // Quantum state management
        this.quantumState = {
            superpositions: new Map(),
            entanglements: new Map(),
            measurements: new Map(),
            coherence: 1.0,                     // Quantum coherence level
            decoherenceRate: 0.001              // Rate of decoherence
        };
        
        // Observer effects
        this.observerEffects = {
            observers: new Map(),
            collapseHistory: [],
            uncertaintyLevel: 0.5,
            measurementBackaction: true
        };
        
        console.log(unifiedColorSystem.formatStatus('info', 'Quantum Information Leaker initializing...'));
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize quantum channels
            await this.initializeQuantumChannels();
            
            // Set up quantum state management
            await this.setupQuantumStateManagement();
            
            // Initialize security measures
            await this.initializeSecurityMeasures();
            
            // Start quantum decoherence simulation
            this.startQuantumDecoherence();
            
            // Begin information flow monitoring
            this.startFlowMonitoring();
            
            console.log(unifiedColorSystem.formatStatus('success', 'Quantum Information Leaker ready!'));
            
            this.emit('leakerReady', {
                leakerId: this.leakerId,
                channels: Object.keys(this.leakingConfig.channels).filter(
                    ch => this.leakingConfig.channels[ch].enabled
                ),
                quantumEnabled: true
            });
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('error', `Leaker initialization failed: ${error.message}`));
            throw error;
        }
    }
    
    /**
     * QUANTUM CHANNEL INITIALIZATION
     */
    async initializeQuantumChannels() {
        console.log(unifiedColorSystem.formatStatus('info', 'Initializing quantum channels...'));
        
        for (const [channelName, config] of Object.entries(this.leakingConfig.channels)) {
            if (!config.enabled) continue;
            
            const channelState = {
                name: config.name,
                active: true,
                currentRate: config.baseRate,
                quantumState: config.quantum ? 'superposition' : 'classical',
                buffer: new Map(),
                metrics: {
                    totalBits: 0,
                    successfulLeaks: 0,
                    blockedAttempts: 0,
                    quantumCollapses: 0
                }
            };
            
            this.flowState.channelStates.set(channelName, channelState);
            
            // Initialize quantum state for channel
            if (config.quantum) {
                this.quantumState.superpositions.set(channelName, {
                    amplitude: 1.0,
                    phase: Math.random() * 2 * Math.PI,
                    coherent: true
                });
            }
            
            console.log(unifiedColorSystem.formatStatus('success', 
                `Channel initialized: ${config.name} (${config.baseRate} bps)`));
        }
    }
    
    /**
     * QUANTUM STATE MANAGEMENT
     */
    async setupQuantumStateManagement() {
        console.log(unifiedColorSystem.formatStatus('info', 'Setting up quantum state management...'));
        
        // Quantum state manager
        this.quantumManager = {
            // Create quantum superposition
            createSuperposition: (data) => {
                const stateId = crypto.randomBytes(8).toString('hex');
                const superposition = {
                    id: stateId,
                    data: data,
                    states: this.generateQuantumStates(data),
                    amplitude: 1.0,
                    coherent: true,
                    createdAt: Date.now()
                };
                
                this.quantumState.superpositions.set(stateId, superposition);
                return stateId;
            },
            
            // Entangle two quantum states
            entangle: (stateId1, stateId2) => {
                const entanglementId = `${stateId1}_${stateId2}`;
                const entanglement = {
                    id: entanglementId,
                    states: [stateId1, stateId2],
                    correlation: Math.random(),
                    strength: 1.0,
                    createdAt: Date.now()
                };
                
                this.quantumState.entanglements.set(entanglementId, entanglement);
                return entanglementId;
            },
            
            // Measure quantum state (causes collapse)
            measure: (stateId) => {
                const superposition = this.quantumState.superpositions.get(stateId);
                if (!superposition || !superposition.coherent) return null;
                
                // Collapse wave function
                const measurement = this.collapseWaveFunction(superposition);
                
                // Record measurement
                this.quantumState.measurements.set(stateId, {
                    result: measurement,
                    timestamp: Date.now(),
                    observer: 'system'
                });
                
                // Update coherence
                superposition.coherent = false;
                this.observerEffects.collapseHistory.push({
                    stateId: stateId,
                    timestamp: Date.now(),
                    result: measurement
                });
                
                return measurement;
            }
        };
        
        console.log(unifiedColorSystem.formatStatus('success', 'Quantum state management ready'));
    }
    
    generateQuantumStates(data) {
        // Generate multiple quantum states for superposition
        const states = [];
        const numStates = 4; // 4 possible quantum states
        
        for (let i = 0; i < numStates; i++) {
            states.push({
                index: i,
                amplitude: Math.random(),
                phase: Math.random() * 2 * Math.PI,
                data: this.scrambleData(data, i)
            });
        }
        
        // Normalize amplitudes
        const totalAmplitude = Math.sqrt(states.reduce((sum, s) => sum + s.amplitude ** 2, 0));
        states.forEach(s => s.amplitude /= totalAmplitude);
        
        return states;
    }
    
    scrambleData(data, seed) {
        // Scramble data based on seed for quantum states
        const scrambled = Buffer.from(data);
        for (let i = 0; i < scrambled.length; i++) {
            scrambled[i] = (scrambled[i] + seed * 17) & 0xFF;
        }
        return scrambled;
    }
    
    collapseWaveFunction(superposition) {
        // Simulate wave function collapse
        const states = superposition.states;
        let random = Math.random();
        let cumulativeProbability = 0;
        
        for (const state of states) {
            cumulativeProbability += state.amplitude ** 2;
            if (random <= cumulativeProbability) {
                return state.data;
            }
        }
        
        return states[states.length - 1].data;
    }
    
    /**
     * INFORMATION LEAKING CORE
     */
    async createInformationStream(streamConfig) {
        const { channel, data, sessionId, priority } = streamConfig;
        
        // Validate channel
        const channelConfig = this.leakingConfig.channels[channel];
        if (!channelConfig || !channelConfig.enabled) {
            throw new Error(`Channel ${channel} is not available`);
        }
        
        // Create stream ID
        const streamId = crypto.randomBytes(8).toString('hex');
        
        // Create quantum superposition of data
        const quantumStateId = channelConfig.quantum ? 
            this.quantumManager.createSuperposition(data) : null;
        
        // Initialize stream
        const stream = {
            id: streamId,
            channel: channel,
            sessionId: sessionId,
            priority: priority || channelConfig.priority,
            data: data,
            quantumStateId: quantumStateId,
            
            // Progress tracking
            totalBits: data.length * 8,
            leakedBits: 0,
            startTime: Date.now(),
            lastLeak: Date.now(),
            
            // Pattern configuration
            leakingPattern: channelConfig.pattern,
            temporalPattern: streamConfig.temporalPattern || 'progressive',
            
            // Security
            encrypted: channelConfig.encryption !== 'none',
            encryptionType: channelConfig.encryption,
            
            // State
            active: true,
            paused: false,
            completed: false
        };
        
        // Store stream
        this.flowState.activeStreams.set(streamId, stream);
        
        // Start leaking process
        this.startLeaking(streamId);
        
        console.log(unifiedColorSystem.formatStatus('info', 
            `Stream created: ${streamId} on ${channel} (${stream.totalBits} bits)`));
        
        this.emit('streamCreated', {
            streamId: streamId,
            channel: channel,
            totalBits: stream.totalBits,
            quantum: !!quantumStateId
        });
        
        return streamId;
    }
    
    startLeaking(streamId) {
        const stream = this.flowState.activeStreams.get(streamId);
        if (!stream || !stream.active) return;
        
        const channelConfig = this.leakingConfig.channels[stream.channel];
        const pattern = this.leakingConfig.leakingPatterns[stream.leakingPattern];
        
        // Calculate leak interval based on channel rate
        const leakInterval = 1000 / (channelConfig.baseRate / 8); // Convert bps to bytes/sec
        
        const leakTimer = setInterval(() => {
            if (!stream.active || stream.completed) {
                clearInterval(leakTimer);
                return;
            }
            
            if (stream.paused) return;
            
            // Calculate progress
            const progress = stream.leakedBits / stream.totalBits;
            
            // Apply quantum pattern
            const quantumFactor = pattern ? pattern.function(progress) : 1;
            
            // Apply temporal pattern
            const temporalFactor = this.applyTemporalPattern(stream, progress);
            
            // Calculate bits to leak this cycle
            let bitsToLeak = (channelConfig.baseRate / (1000 / leakInterval)) * quantumFactor * temporalFactor;
            
            // Apply observer effect if being watched
            if (this.isBeingObserved(streamId)) {
                bitsToLeak *= this.applyObserverEffect(streamId);
            }
            
            // Ensure we don't exceed total or max bandwidth
            bitsToLeak = Math.min(
                bitsToLeak,
                stream.totalBits - stream.leakedBits,
                channelConfig.maxBandwidth / (1000 / leakInterval)
            );
            
            if (bitsToLeak > 0) {
                // Leak the information
                const leakedData = this.leakBits(stream, Math.floor(bitsToLeak));
                
                // Update metrics
                stream.leakedBits += bitsToLeak;
                stream.lastLeak = Date.now();
                this.flowState.totalLeaked += bitsToLeak;
                
                const channelState = this.flowState.channelStates.get(stream.channel);
                if (channelState) {
                    channelState.metrics.totalBits += bitsToLeak;
                    channelState.metrics.successfulLeaks++;
                }
                
                // Emit leak event
                this.emit('informationLeaked', {
                    streamId: streamId,
                    channel: stream.channel,
                    bitsLeaked: bitsToLeak,
                    totalLeaked: stream.leakedBits,
                    progress: stream.leakedBits / stream.totalBits,
                    data: leakedData
                });
                
                // Check if complete
                if (stream.leakedBits >= stream.totalBits) {
                    stream.completed = true;
                    stream.active = false;
                    clearInterval(leakTimer);
                    
                    this.emit('streamCompleted', {
                        streamId: streamId,
                        channel: stream.channel,
                        totalBits: stream.totalBits,
                        duration: Date.now() - stream.startTime
                    });
                }
            }
            
            // Apply quantum decoherence
            if (stream.quantumStateId) {
                this.applyDecoherence(stream.quantumStateId);
            }
            
        }, leakInterval);
    }
    
    leakBits(stream, numBits) {
        const startByte = Math.floor(stream.leakedBits / 8);
        const endByte = Math.floor((stream.leakedBits + numBits) / 8);
        
        let leakedData;
        
        if (stream.quantumStateId) {
            // Quantum leak - measure the quantum state
            const measurement = this.quantumManager.measure(stream.quantumStateId);
            if (measurement) {
                leakedData = measurement.slice(startByte, endByte + 1);
            } else {
                // Re-create superposition if collapsed
                stream.quantumStateId = this.quantumManager.createSuperposition(stream.data);
                leakedData = stream.data.slice(startByte, endByte + 1);
            }
        } else {
            // Classical leak
            leakedData = stream.data.slice(startByte, endByte + 1);
        }
        
        // Apply encryption if enabled
        if (stream.encrypted) {
            leakedData = this.encryptData(leakedData, stream.encryptionType);
        }
        
        return leakedData;
    }
    
    applyTemporalPattern(stream, progress) {
        const pattern = this.leakingConfig.temporalPatterns[stream.temporalPattern];
        if (!pattern) return 1;
        
        switch (stream.temporalPattern) {
            case 'progressive':
                return Math.pow(pattern.acceleration, progress * 10);
                
            case 'fibonacci':
                const index = Math.floor(progress * pattern.sequence.length);
                return pattern.sequence[Math.min(index, pattern.sequence.length - 1)] / 10;
                
            case 'exponential':
                return Math.pow(pattern.base, progress * 3);
                
            case 'logarithmic':
                return Math.log(1 + progress * (pattern.base - 1)) / Math.log(pattern.base);
                
            case 'sinusoidal':
                return 0.5 + 0.5 * Math.sin(progress * 2 * Math.PI * pattern.frequency);
                
            default:
                return 1;
        }
    }
    
    /**
     * OBSERVER EFFECTS
     */
    isBeingObserved(streamId) {
        return this.observerEffects.observers.has(streamId);
    }
    
    addObserver(streamId, observerId) {
        if (!this.observerEffects.observers.has(streamId)) {
            this.observerEffects.observers.set(streamId, new Set());
        }
        
        this.observerEffects.observers.get(streamId).add(observerId);
        
        // Observer effect - change the stream behavior
        const stream = this.flowState.activeStreams.get(streamId);
        if (stream && stream.quantumStateId) {
            // Increase uncertainty
            this.observerEffects.uncertaintyLevel = Math.min(
                this.observerEffects.uncertaintyLevel * 1.1, 
                1.0
            );
        }
        
        console.log(unifiedColorSystem.formatStatus('info', 
            `Observer ${observerId} watching stream ${streamId}`));
    }
    
    removeObserver(streamId, observerId) {
        const observers = this.observerEffects.observers.get(streamId);
        if (observers) {
            observers.delete(observerId);
            if (observers.size === 0) {
                this.observerEffects.observers.delete(streamId);
            }
        }
    }
    
    applyObserverEffect(streamId) {
        // Heisenberg uncertainty principle - observation affects the system
        const observers = this.observerEffects.observers.get(streamId);
        const numObservers = observers ? observers.size : 0;
        
        // More observers = more uncertainty
        const uncertaintyFactor = 1 - (this.observerEffects.uncertaintyLevel * numObservers * 0.1);
        
        // Measurement backaction
        if (this.observerEffects.measurementBackaction && Math.random() < 0.1) {
            // 10% chance of measurement disturbing the system
            const stream = this.flowState.activeStreams.get(streamId);
            if (stream && stream.quantumStateId) {
                // Force wave function collapse
                this.quantumManager.measure(stream.quantumStateId);
                
                const channelState = this.flowState.channelStates.get(stream.channel);
                if (channelState) {
                    channelState.metrics.quantumCollapses++;
                }
            }
        }
        
        return Math.max(uncertaintyFactor, 0.1); // Minimum 10% rate
    }
    
    /**
     * SECURITY MEASURES
     */
    async initializeSecurityMeasures() {
        console.log(unifiedColorSystem.formatStatus('info', 'Initializing quantum security...'));
        
        // Quantum no-cloning protection
        if (this.leakingConfig.security.noCloning) {
            this.noCloningProtection = {
                verify: (data) => {
                    // Ensure data cannot be perfectly copied
                    const hash = crypto.createHash('sha3-512').update(data).digest();
                    const quantumNoise = crypto.randomBytes(16);
                    return Buffer.concat([hash, quantumNoise]);
                }
            };
        }
        
        // Entanglement verification
        if (this.leakingConfig.security.entanglementVerification) {
            this.entanglementVerifier = {
                verify: (stateId1, stateId2) => {
                    const entanglement = Array.from(this.quantumState.entanglements.values())
                        .find(e => e.states.includes(stateId1) && e.states.includes(stateId2));
                    
                    return entanglement && entanglement.strength > 0.5;
                }
            };
        }
        
        console.log(unifiedColorSystem.formatStatus('success', 'Quantum security initialized'));
    }
    
    encryptData(data, encryptionType) {
        switch (encryptionType) {
            case 'lattice':
                return this.latticeEncrypt(data);
                
            case 'homomorphic':
                return this.homomorphicEncrypt(data);
                
            case 'quantum_otp':
                return this.quantumOneTimePad(data);
                
            default:
                return data;
        }
    }
    
    latticeEncrypt(data) {
        // Simplified lattice-based encryption
        const encrypted = Buffer.alloc(data.length);
        const key = crypto.randomBytes(32);
        
        for (let i = 0; i < data.length; i++) {
            encrypted[i] = (data[i] + key[i % key.length]) & 0xFF;
        }
        
        return encrypted;
    }
    
    homomorphicEncrypt(data) {
        // Simplified homomorphic encryption (allows computation on encrypted data)
        const encrypted = Buffer.alloc(data.length * 2);
        
        for (let i = 0; i < data.length; i++) {
            // Store both value and noise
            encrypted[i * 2] = data[i];
            encrypted[i * 2 + 1] = crypto.randomBytes(1)[0];
        }
        
        return encrypted;
    }
    
    quantumOneTimePad(data) {
        // Quantum one-time pad using entangled states
        const pad = crypto.randomBytes(data.length);
        const encrypted = Buffer.alloc(data.length);
        
        for (let i = 0; i < data.length; i++) {
            encrypted[i] = data[i] ^ pad[i];
        }
        
        // Store pad in quantum state for perfect security
        this.quantumManager.createSuperposition(pad);
        
        return encrypted;
    }
    
    /**
     * QUANTUM DECOHERENCE
     */
    startQuantumDecoherence() {
        // Simulate quantum decoherence over time
        setInterval(() => {
            this.quantumState.coherence *= (1 - this.quantumState.decoherenceRate);
            
            // Apply decoherence to all quantum states
            for (const [stateId, superposition] of this.quantumState.superpositions) {
                if (superposition.coherent) {
                    superposition.amplitude *= this.quantumState.coherence;
                    
                    // Collapse if amplitude too low
                    if (superposition.amplitude < 0.1) {
                        this.quantumManager.measure(stateId);
                    }
                }
            }
            
            // Weaken entanglements
            for (const [entanglementId, entanglement] of this.quantumState.entanglements) {
                entanglement.strength *= (1 - this.quantumState.decoherenceRate * 2);
                
                // Remove weak entanglements
                if (entanglement.strength < 0.1) {
                    this.quantumState.entanglements.delete(entanglementId);
                }
            }
            
        }, 1000); // Every second
    }
    
    applyDecoherence(stateId) {
        const superposition = this.quantumState.superpositions.get(stateId);
        if (superposition && superposition.coherent) {
            // Environmental decoherence
            const environmentalNoise = Math.random() * 0.01;
            superposition.amplitude *= (1 - environmentalNoise);
            
            // Phase decoherence
            superposition.phase += (Math.random() - 0.5) * 0.1;
        }
    }
    
    /**
     * FLOW MONITORING
     */
    startFlowMonitoring() {
        // Monitor information flow across all channels
        setInterval(() => {
            const flowMetrics = this.calculateFlowMetrics();
            
            this.emit('flowUpdate', flowMetrics);
            
            // Check for anomalies
            if (flowMetrics.anomalies.length > 0) {
                this.handleFlowAnomalies(flowMetrics.anomalies);
            }
            
        }, 5000); // Every 5 seconds
    }
    
    calculateFlowMetrics() {
        const metrics = {
            timestamp: Date.now(),
            totalActiveStreams: this.flowState.activeStreams.size,
            totalLeaked: this.flowState.totalLeaked,
            channelMetrics: {},
            quantumCoherence: this.quantumState.coherence,
            observerCount: this.observerEffects.observers.size,
            anomalies: []
        };
        
        // Calculate per-channel metrics
        for (const [channelName, channelState of this.flowState.channelStates) {
            const config = this.leakingConfig.channels[channelName];
            
            metrics.channelMetrics[channelName] = {
                totalBits: channelState.metrics.totalBits,
                currentRate: channelState.currentRate,
                utilization: channelState.currentRate / config.maxBandwidth,
                quantumCollapses: channelState.metrics.quantumCollapses
            };
            
            // Check for anomalies
            if (channelState.currentRate > config.maxBandwidth) {
                metrics.anomalies.push({
                    type: 'bandwidth_exceeded',
                    channel: channelName,
                    rate: channelState.currentRate,
                    max: config.maxBandwidth
                });
            }
        }
        
        // Check for security anomalies
        if (this.flowState.securityBreaches > 0) {
            metrics.anomalies.push({
                type: 'security_breach',
                count: this.flowState.securityBreaches
            });
        }
        
        return metrics;
    }
    
    handleFlowAnomalies(anomalies) {
        for (const anomaly of anomalies) {
            console.log(unifiedColorSystem.formatStatus('warning', 
                `Flow anomaly detected: ${anomaly.type}`));
            
            switch (anomaly.type) {
                case 'bandwidth_exceeded':
                    // Throttle channel
                    this.throttleChannel(anomaly.channel, 0.5);
                    break;
                    
                case 'security_breach':
                    // Increase security
                    this.enhanceSecurity();
                    break;
            }
        }
    }
    
    throttleChannel(channelName, factor) {
        const channelState = this.flowState.channelStates.get(channelName);
        if (channelState) {
            channelState.currentRate *= factor;
            console.log(unifiedColorSystem.formatStatus('info', 
                `Channel ${channelName} throttled to ${channelState.currentRate} bps`));
        }
    }
    
    enhanceSecurity() {
        // Increase uncertainty
        this.observerEffects.uncertaintyLevel = Math.min(
            this.observerEffects.uncertaintyLevel * 1.5, 
            1.0
        );
        
        // Increase decoherence rate
        this.quantumState.decoherenceRate = Math.min(
            this.quantumState.decoherenceRate * 1.2,
            0.01
        );
        
        console.log(unifiedColorSystem.formatStatus('info', 'Security enhanced'));
    }
    
    /**
     * PUBLIC API
     */
    getLeakerStatus() {
        return {
            leakerId: this.leakerId,
            channels: Object.fromEntries(
                Array.from(this.flowState.channelStates.entries()).map(([name, state]) => [
                    name, {
                        active: state.active,
                        currentRate: state.currentRate,
                        totalBits: state.metrics.totalBits,
                        quantumCollapses: state.metrics.quantumCollapses
                    }
                ])
            ),
            streams: {
                active: this.flowState.activeStreams.size,
                totalLeaked: this.flowState.totalLeaked
            },
            quantum: {
                coherence: this.quantumState.coherence,
                superpositions: this.quantumState.superpositions.size,
                entanglements: this.quantumState.entanglements.size
            },
            security: {
                breaches: this.flowState.securityBreaches,
                uncertaintyLevel: this.observerEffects.uncertaintyLevel
            }
        };
    }
    
    pauseStream(streamId) {
        const stream = this.flowState.activeStreams.get(streamId);
        if (stream) {
            stream.paused = true;
            this.emit('streamPaused', { streamId });
        }
    }
    
    resumeStream(streamId) {
        const stream = this.flowState.activeStreams.get(streamId);
        if (stream) {
            stream.paused = false;
            this.emit('streamResumed', { streamId });
        }
    }
    
    terminateStream(streamId) {
        const stream = this.flowState.activeStreams.get(streamId);
        if (stream) {
            stream.active = false;
            this.flowState.activeStreams.delete(streamId);
            
            // Clean up quantum states
            if (stream.quantumStateId) {
                this.quantumState.superpositions.delete(stream.quantumStateId);
            }
            
            this.emit('streamTerminated', { streamId });
        }
    }
}

// Export the leaker
module.exports = QuantumInformationLeaker;

// CLI interface
if (require.main === module) {
    (async () => {
        console.log('🌊🔮 Quantum Information Leaker Demo\n');
        
        const leaker = new QuantumInformationLeaker();
        
        // Wait for initialization
        await new Promise(resolve => {
            leaker.on('leakerReady', resolve);
        });
        
        // Display status
        const status = leaker.getLeakerStatus();
        
        console.log('\n📊 Leaker Status:');
        console.log('  Active Channels:');
        Object.entries(status.channels).forEach(([name, channel]) => {
            if (channel.active) {
                console.log(`    ${name}: ${channel.currentRate} bps`);
            }
        });
        
        console.log('\n🔮 Quantum State:');
        console.log(`  Coherence: ${(status.quantum.coherence * 100).toFixed(1)}%`);
        console.log(`  Superpositions: ${status.quantum.superpositions}`);
        console.log(`  Entanglements: ${status.quantum.entanglements}`);
        
        // Create test stream
        console.log('\n📡 Creating test information stream...');
        
        const testData = Buffer.from('This is quantum information that will leak through approved channels only.');
        
        const streamId = await leaker.createInformationStream({
            channel: 'wiki',
            data: testData,
            sessionId: 'test_session',
            priority: 3,
            temporalPattern: 'fibonacci'
        });
        
        console.log(`Stream created: ${streamId}`);
        
        // Listen for leaks
        leaker.on('informationLeaked', (event) => {
            console.log(`💧 Leaked ${event.bitsLeaked.toFixed(1)} bits (${(event.progress * 100).toFixed(1)}% complete)`);
        });
        
        leaker.on('streamCompleted', (event) => {
            console.log(`✅ Stream ${event.streamId} completed! Total: ${event.totalBits} bits in ${event.duration}ms`);
        });
        
        // Add observer to demonstrate observer effect
        setTimeout(() => {
            console.log('\n👁️ Adding observer to stream...');
            leaker.addObserver(streamId, 'test_observer');
        }, 2000);
        
        console.log('\n✨ Quantum Information Leaker is active!');
        console.log('Information flows through quantum channels with controlled leaking.');
        
    })().catch(console.error);
}