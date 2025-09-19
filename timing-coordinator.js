#!/usr/bin/env node

/**
 * TIMING COORDINATOR
 * 
 * Fixes prime number timing drift in neural conductor equations and coordinates
 * all animation loops across the mobile gaming system.
 * 
 * Solves the timing issues in:
 * - Neural conductor formula: R(t) = S(t) × C(t) × P(t) × (1 - A(t))
 * - Multiple requestAnimationFrame loops competing
 * - Mobile vs desktop timing synchronization
 * - Game server to mobile app timing coordination
 */

const EventEmitter = require('events');

class TimingCoordinator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            targetFPS: options.targetFPS || 60,
            mobileFPS: options.mobileFPS || 30,
            errorCorrectionEnabled: options.errorCorrectionEnabled !== false,
            primeNumberSync: options.primeNumberSync !== false,
            debugMode: options.debugMode || false,
            maxTimingDrift: options.maxTimingDrift || 50, // milliseconds
            synchronizationInterval: options.synchronizationInterval || 1000
        };
        
        // Master timing state
        this.masterTiming = {
            startTime: performance.now(),
            currentTime: 0,
            frameCount: 0,
            actualFPS: 0,
            targetFrameTime: 1000 / this.options.targetFPS,
            lastFrameTime: 0,
            deltaTime: 0,
            lag: 0
        };
        
        // Animation loop management
        this.animationSystems = new Map();
        this.masterLoop = null;
        this.isRunning = false;
        
        // Prime number timing synchronization
        this.primeSync = {
            primes: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
            currentPrimeIndex: 0,
            primeMultiplier: 1.0,
            basePeriod: 1000, // 1 second base period
            lastPrimeSync: 0,
            errorAccumulator: 0
        };
        
        // Neural conductor equation state
        this.neuralConductor = {
            S_t: 1.0, // System state
            C_t: 1.0, // Context factor
            P_t: 1.0, // Prime number component
            A_t: 0.0, // Adaptation factor
            R_t: 1.0, // Resulting timing
            lastCalculation: 0,
            history: [],
            maxHistory: 100
        };
        
        // Mobile optimization
        this.isMobile = this.detectMobile();
        this.currentFPS = this.isMobile ? this.options.mobileFPS : this.options.targetFPS;
        this.currentFrameTime = 1000 / this.currentFPS;
        
        // Performance monitoring
        this.performance = {
            frameTimeHistory: [],
            maxHistorySize: 60,
            averageFrameTime: 0,
            timingDrift: 0,
            synchronizationErrors: 0,
            adaptations: 0
        };
        
        // System synchronization
        this.synchronizedSystems = new Map();
        this.lastSynchronization = 0;
        
        console.log('⏰ Timing Coordinator initializing...');
        console.log(`📱 Mobile mode: ${this.isMobile ? 'ON' : 'OFF'}`);
        console.log(`🎯 Target FPS: ${this.currentFPS}`);
        console.log(`🔢 Prime number sync: ${this.options.primeNumberSync ? 'ENABLED' : 'DISABLED'}`);
        
        this.initialize();
    }
    
    /**
     * INITIALIZATION
     */
    initialize() {
        // Set up prime number synchronization
        if (this.options.primeNumberSync) {
            this.initializePrimeSync();
        }
        
        // Initialize neural conductor
        this.initializeNeuralConductor();
        
        // Set up performance monitoring
        this.initializePerformanceMonitoring();
        
        // Start master timing loop
        this.startMasterLoop();
        
        console.log('✅ Timing Coordinator ready');
        this.emit('ready', {
            targetFPS: this.currentFPS,
            frameTime: this.currentFrameTime,
            isMobile: this.isMobile,
            primeSync: this.options.primeNumberSync
        });
    }
    
    /**
     * PRIME NUMBER SYNCHRONIZATION
     */
    initializePrimeSync() {
        console.log('🔢 Initializing prime number synchronization...');
        
        this.primeSync.lastPrimeSync = performance.now();
        
        // Set up prime synchronization interval
        setInterval(() => {
            this.updatePrimeSync();
        }, this.options.synchronizationInterval);
        
        console.log('🔢 Prime sync initialized with error correction');
    }
    
    updatePrimeSync() {
        const now = performance.now();
        const timeSinceLastSync = now - this.primeSync.lastPrimeSync;
        
        // Move to next prime number
        this.primeSync.currentPrimeIndex = (this.primeSync.currentPrimeIndex + 1) % this.primeSync.primes.length;
        const currentPrime = this.primeSync.primes[this.primeSync.currentPrimeIndex];
        
        // Calculate prime-based timing multiplier with error correction
        const expectedPeriod = this.primeSync.basePeriod;
        const actualPeriod = timeSinceLastSync;
        const timingError = actualPeriod - expectedPeriod;
        
        // Accumulate error for correction
        this.primeSync.errorAccumulator += timingError * 0.1; // 10% error feedback
        
        // Calculate corrected prime multiplier
        const baseMultiplier = currentPrime / 7.0; // Normalize around prime 7
        const errorCorrection = this.primeSync.errorAccumulator / 1000; // Convert to seconds
        this.primeSync.primeMultiplier = Math.max(0.5, Math.min(2.0, baseMultiplier - errorCorrection));
        
        this.primeSync.lastPrimeSync = now;
        
        if (this.options.debugMode) {
            console.log(`🔢 Prime sync: ${currentPrime}, multiplier: ${this.primeSync.primeMultiplier.toFixed(3)}, error: ${timingError.toFixed(2)}ms`);
        }
        
        // Update neural conductor P(t) component
        this.neuralConductor.P_t = this.primeSync.primeMultiplier;
        
        this.emit('primeSync', {
            prime: currentPrime,
            multiplier: this.primeSync.primeMultiplier,
            error: timingError,
            errorAccumulator: this.primeSync.errorAccumulator
        });
    }
    
    /**
     * NEURAL CONDUCTOR EQUATION
     */
    initializeNeuralConductor() {
        console.log('🧠 Initializing neural conductor equation...');
        
        // Initialize components
        this.neuralConductor.lastCalculation = performance.now();
        
        // Set up regular equation updates
        setInterval(() => {
            this.updateNeuralConductor();
        }, 100); // Update every 100ms
        
        console.log('🧠 Neural conductor initialized');
    }
    
    updateNeuralConductor() {
        const now = performance.now();
        const deltaTime = now - this.neuralConductor.lastCalculation;
        
        // Update system state S(t) based on performance
        this.neuralConductor.S_t = Math.max(0.1, 1.0 - (this.performance.timingDrift / this.options.maxTimingDrift));
        
        // Update context factor C(t) based on system load
        const systemLoad = this.calculateSystemLoad();
        this.neuralConductor.C_t = Math.max(0.1, 1.0 - systemLoad);
        
        // P(t) is updated by prime sync
        
        // Update adaptation factor A(t) based on error history
        const recentErrors = this.performance.frameTimeHistory.slice(-10);
        const errorVariance = this.calculateVariance(recentErrors);
        this.neuralConductor.A_t = Math.min(0.9, errorVariance / 100); // Normalize to 0-0.9
        
        // Calculate resulting timing: R(t) = S(t) × C(t) × P(t) × (1 - A(t))
        const newR_t = this.neuralConductor.S_t * 
                       this.neuralConductor.C_t * 
                       this.neuralConductor.P_t * 
                       (1 - this.neuralConductor.A_t);
        
        // Apply smoothing to prevent jitter
        this.neuralConductor.R_t = this.neuralConductor.R_t * 0.9 + newR_t * 0.1;
        
        // Store in history
        this.neuralConductor.history.push({
            timestamp: now,
            S_t: this.neuralConductor.S_t,
            C_t: this.neuralConductor.C_t,
            P_t: this.neuralConductor.P_t,
            A_t: this.neuralConductor.A_t,
            R_t: this.neuralConductor.R_t
        });
        
        // Limit history size
        if (this.neuralConductor.history.length > this.neuralConductor.maxHistory) {
            this.neuralConductor.history.shift();
        }
        
        this.neuralConductor.lastCalculation = now;
        
        if (this.options.debugMode && this.masterTiming.frameCount % 60 === 0) {
            console.log(`🧠 Neural: S=${this.neuralConductor.S_t.toFixed(3)}, C=${this.neuralConductor.C_t.toFixed(3)}, P=${this.neuralConductor.P_t.toFixed(3)}, A=${this.neuralConductor.A_t.toFixed(3)}, R=${this.neuralConductor.R_t.toFixed(3)}`);
        }
        
        this.emit('neuralUpdate', {
            S_t: this.neuralConductor.S_t,
            C_t: this.neuralConductor.C_t,
            P_t: this.neuralConductor.P_t,
            A_t: this.neuralConductor.A_t,
            R_t: this.neuralConductor.R_t
        });
    }
    
    /**
     * MASTER ANIMATION LOOP
     */
    startMasterLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.masterTiming.startTime = performance.now();
        this.masterTiming.lastFrameTime = this.masterTiming.startTime;
        
        console.log('🎬 Starting master animation loop...');
        
        const loop = (currentTime) => {
            if (!this.isRunning) return;
            
            this.processMasterFrame(currentTime);
            this.masterLoop = requestAnimationFrame(loop);
        };
        
        this.masterLoop = requestAnimationFrame(loop);
    }
    
    processMasterFrame(currentTime) {
        // Calculate timing
        this.masterTiming.currentTime = currentTime;
        this.masterTiming.deltaTime = currentTime - this.masterTiming.lastFrameTime;
        this.masterTiming.frameCount++;
        
        // Skip frame if too early (FPS limiting)
        if (this.masterTiming.deltaTime < this.currentFrameTime * 0.95) {
            return;
        }
        
        // Calculate actual FPS
        this.calculateActualFPS();
        
        // Apply neural conductor timing adjustment
        const adjustedDeltaTime = this.masterTiming.deltaTime * this.neuralConductor.R_t;
        
        // Update performance metrics
        this.updatePerformanceMetrics(this.masterTiming.deltaTime);
        
        // Process all registered animation systems
        this.processAnimationSystems(currentTime, adjustedDeltaTime);
        
        // Emit timing update
        this.emit('frame', {
            currentTime,
            deltaTime: adjustedDeltaTime,
            frameCount: this.masterTiming.frameCount,
            fps: this.masterTiming.actualFPS,
            neuralTiming: this.neuralConductor.R_t
        });
        
        this.masterTiming.lastFrameTime = currentTime;
    }
    
    /**
     * ANIMATION SYSTEM REGISTRATION
     */
    registerAnimationSystem(systemName, callback, options = {}) {
        const system = {
            name: systemName,
            callback,
            priority: options.priority || 1,
            enabled: true,
            lastUpdate: 0,
            updateInterval: options.updateInterval || 0, // 0 = every frame
            skipFrames: options.skipFrames || 0,
            frameSkipCounter: 0,
            executionTime: 0,
            registered: performance.now()
        };
        
        this.animationSystems.set(systemName, system);
        
        console.log(`🎬 Registered animation system: ${systemName} (priority: ${system.priority})`);
        
        // Sort systems by priority
        this.sortAnimationSystems();
        
        return {
            enable: () => this.enableAnimationSystem(systemName),
            disable: () => this.disableAnimationSystem(systemName),
            setPriority: (priority) => this.setAnimationSystemPriority(systemName, priority),
            unregister: () => this.unregisterAnimationSystem(systemName)
        };
    }
    
    processAnimationSystems(currentTime, deltaTime) {
        for (const [systemName, system] of this.animationSystems) {
            if (!system.enabled) continue;
            
            // Check update interval
            if (system.updateInterval > 0 && 
                currentTime - system.lastUpdate < system.updateInterval) {
                continue;
            }
            
            // Check frame skipping
            if (system.skipFrames > 0) {
                system.frameSkipCounter++;
                if (system.frameSkipCounter <= system.skipFrames) {
                    continue;
                }
                system.frameSkipCounter = 0;
            }
            
            // Execute system callback
            const startTime = performance.now();
            
            try {
                system.callback({
                    currentTime,
                    deltaTime,
                    frameCount: this.masterTiming.frameCount,
                    neuralTiming: this.neuralConductor.R_t,
                    primeMultiplier: this.primeSync.primeMultiplier
                });
                
                system.lastUpdate = currentTime;
                
            } catch (error) {
                console.error(`Error in animation system ${systemName}:`, error);
                system.enabled = false; // Disable problematic system
            }
            
            system.executionTime = performance.now() - startTime;
        }
    }
    
    sortAnimationSystems() {
        const sortedEntries = Array.from(this.animationSystems.entries())
            .sort((a, b) => b[1].priority - a[1].priority);
        
        this.animationSystems.clear();
        sortedEntries.forEach(([name, system]) => {
            this.animationSystems.set(name, system);
        });
    }
    
    /**
     * PERFORMANCE MONITORING
     */
    initializePerformanceMonitoring() {
        setInterval(() => {
            this.analyzePerformance();
            this.adaptToPerformance();
        }, 5000); // Every 5 seconds
    }
    
    updatePerformanceMetrics(frameTime) {
        this.performance.frameTimeHistory.push(frameTime);
        
        if (this.performance.frameTimeHistory.length > this.performance.maxHistorySize) {
            this.performance.frameTimeHistory.shift();
        }
        
        // Calculate average frame time
        this.performance.averageFrameTime = this.performance.frameTimeHistory
            .reduce((sum, time) => sum + time, 0) / this.performance.frameTimeHistory.length;
        
        // Calculate timing drift
        const expectedFrameTime = this.currentFrameTime;
        this.performance.timingDrift = Math.abs(this.performance.averageFrameTime - expectedFrameTime);
    }
    
    analyzePerformance() {
        const avgFPS = 1000 / this.performance.averageFrameTime;
        const targetFPS = this.currentFPS;
        const fpsRatio = avgFPS / targetFPS;
        
        if (this.options.debugMode) {
            console.log(`📊 Performance: ${avgFPS.toFixed(1)} FPS (target: ${targetFPS}), drift: ${this.performance.timingDrift.toFixed(2)}ms`);
        }
        
        this.emit('performanceUpdate', {
            averageFPS: avgFPS,
            targetFPS: targetFPS,
            fpsRatio,
            timingDrift: this.performance.timingDrift,
            systemLoad: this.calculateSystemLoad()
        });
    }
    
    adaptToPerformance() {
        const avgFPS = 1000 / this.performance.averageFrameTime;
        const targetFPS = this.currentFPS;
        
        // Adaptive FPS adjustment on mobile
        if (this.isMobile && this.options.errorCorrectionEnabled) {
            if (avgFPS < targetFPS * 0.8) {
                // Performance too low, reduce target FPS
                this.currentFPS = Math.max(15, this.currentFPS - 5);
                this.currentFrameTime = 1000 / this.currentFPS;
                this.performance.adaptations++;
                
                console.log(`📱 Adapted to performance: reduced FPS to ${this.currentFPS}`);
            } else if (avgFPS > targetFPS * 1.2 && this.currentFPS < this.options.targetFPS) {
                // Performance good, increase target FPS
                this.currentFPS = Math.min(this.options.targetFPS, this.currentFPS + 5);
                this.currentFrameTime = 1000 / this.currentFPS;
                this.performance.adaptations++;
                
                console.log(`📱 Adapted to performance: increased FPS to ${this.currentFPS}`);
            }
        }
    }
    
    calculateSystemLoad() {
        let totalExecutionTime = 0;
        let systemCount = 0;
        
        for (const system of this.animationSystems.values()) {
            if (system.enabled) {
                totalExecutionTime += system.executionTime;
                systemCount++;
            }
        }
        
        const frameTime = this.currentFrameTime;
        return Math.min(1.0, totalExecutionTime / frameTime);
    }
    
    calculateActualFPS() {
        if (this.masterTiming.frameCount % 60 === 0) { // Calculate every 60 frames
            const currentTime = this.masterTiming.currentTime;
            const timeSpan = currentTime - this.masterTiming.startTime;
            this.masterTiming.actualFPS = (this.masterTiming.frameCount / timeSpan) * 1000;
        }
    }
    
    /**
     * UTILITIES
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }
    
    detectMobile() {
        if (typeof navigator === 'undefined') return false;
        
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }
    
    /**
     * PUBLIC API
     */
    enableAnimationSystem(systemName) {
        const system = this.animationSystems.get(systemName);
        if (system) {
            system.enabled = true;
            console.log(`✅ Enabled animation system: ${systemName}`);
        }
    }
    
    disableAnimationSystem(systemName) {
        const system = this.animationSystems.get(systemName);
        if (system) {
            system.enabled = false;
            console.log(`⏸️ Disabled animation system: ${systemName}`);
        }
    }
    
    unregisterAnimationSystem(systemName) {
        if (this.animationSystems.delete(systemName)) {
            console.log(`🗑️ Unregistered animation system: ${systemName}`);
        }
    }
    
    getCurrentTiming() {
        return {
            currentTime: this.masterTiming.currentTime,
            deltaTime: this.masterTiming.deltaTime,
            frameCount: this.masterTiming.frameCount,
            fps: this.masterTiming.actualFPS,
            neuralTiming: this.neuralConductor.R_t,
            primeMultiplier: this.primeSync.primeMultiplier
        };
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            isMobile: this.isMobile,
            currentFPS: this.currentFPS,
            targetFPS: this.options.targetFPS,
            actualFPS: this.masterTiming.actualFPS,
            timingDrift: this.performance.timingDrift,
            systemLoad: this.calculateSystemLoad(),
            animationSystems: this.animationSystems.size,
            neuralConductor: this.neuralConductor,
            primeSync: this.primeSync,
            performance: this.performance
        };
    }
    
    stop() {
        this.isRunning = false;
        if (this.masterLoop) {
            cancelAnimationFrame(this.masterLoop);
            this.masterLoop = null;
        }
        console.log('⏹️ Timing Coordinator stopped');
    }
}

// Export for use by other systems
module.exports = TimingCoordinator;

// Self-test if run directly
if (require.main === module) {
    console.log('🧪 Testing Timing Coordinator...');
    
    const coordinator = new TimingCoordinator({ debugMode: true });
    
    coordinator.on('ready', () => {
        console.log('✅ Timing Coordinator ready');
        
        // Register test animation systems
        coordinator.registerAnimationSystem('test-system-1', (timing) => {
            // Simulate work
            const work = Math.random() * 5;
            for (let i = 0; i < work * 1000; i++) { /* busy work */ }
        }, { priority: 1 });
        
        coordinator.registerAnimationSystem('test-system-2', (timing) => {
            // Lighter work
            Math.random();
        }, { priority: 2, skipFrames: 1 });
        
        console.log('🎬 Registered test animation systems');
    });
    
    // Show status every 5 seconds
    setInterval(() => {
        const status = coordinator.getStatus();
        console.log(`📊 Status: ${status.actualFPS?.toFixed(1)} FPS, drift: ${status.timingDrift?.toFixed(2)}ms, load: ${(status.systemLoad * 100).toFixed(1)}%`);
    }, 5000);
    
    // Stop after 30 seconds
    setTimeout(() => {
        coordinator.stop();
        process.exit(0);
    }, 30000);
}