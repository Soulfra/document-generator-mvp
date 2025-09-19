#!/usr/bin/env node

/**
 * 🌈 Color-State Proof Engine
 * 
 * Manages color-based state transitions with music theory harmonics.
 * Proves the King/Queen dance works through visual and audio validation.
 * 
 * Color States:
 * 🟢 Green: Unproven/Testing (cycling until validated)
 * 🟪 Purple: Proven/Chill phase (stable, validated)
 * 🟡 Gold: Achievement (major milestone)
 * 🟡 Yellow: Warning (approaching limits)
 * 🔴 Red: Critical (bash everything mode)
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class ColorStateProofEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            cycleInterval: config.cycleInterval || 5000, // 5 seconds
            proofThreshold: config.proofThreshold || 85, // 85% success rate
            maxCycles: config.maxCycles || 10, // Max green cycles before timeout
            ...config
        };
        
        // Color State Machine
        this.states = {
            green: {
                name: 'Green',
                emoji: '🟢',
                description: 'Unproven/Testing',
                frequency: 528, // Hz - Love frequency
                rgb: [0, 255, 0],
                duration: 5000, // ms
                transitions: ['purple', 'yellow', 'red']
            },
            purple: {
                name: 'Purple',
                emoji: '🟪',
                description: 'Proven/Chill',
                frequency: 432, // Hz - Healing frequency
                rgb: [128, 0, 128],
                duration: 30000,
                transitions: ['gold', 'green']
            },
            gold: {
                name: 'Gold',
                emoji: '🟡',
                description: 'Achievement',
                frequency: 741, // Hz - Expression frequency
                rgb: [255, 215, 0],
                duration: 10000,
                transitions: ['purple', 'green']
            },
            yellow: {
                name: 'Yellow',
                emoji: '🟡',
                description: 'Warning',
                frequency: 396, // Hz - Liberation frequency
                rgb: [255, 255, 0],
                duration: 15000,
                transitions: ['green', 'red']
            },
            red: {
                name: 'Red',
                emoji: '🔴',
                description: 'Critical/Bash Everything',
                frequency: 963, // Hz - God frequency
                rgb: [255, 0, 0],
                duration: 60000,
                transitions: ['green']
            }
        };
        
        // Current state
        this.currentState = 'green';
        this.stateStartTime = Date.now();
        this.cycleCount = 0;
        this.proofScore = 0;
        
        // Proof tracking
        this.proofAttempts = [];
        this.validatedProofs = [];
        this.danceEvents = [];
        
        // Music harmony tracking
        this.harmonicFrequencies = [];
        this.currentHarmony = null;
        
        // State transition history
        this.transitionHistory = [];
        
        this.running = false;
        this.stateTimer = null;
    }
    
    /**
     * Start the color state engine
     */
    start() {
        console.log('🌈 Starting Color-State Proof Engine...');
        this.running = true;
        this.enterState('green');
        this.startStateMonitoring();
        console.log(`${this.states[this.currentState].emoji} Initial state: ${this.states[this.currentState].name}`);
    }
    
    /**
     * Stop the engine
     */
    stop() {
        console.log('⏹️ Stopping Color-State Proof Engine...');
        this.running = false;
        if (this.stateTimer) {
            clearTimeout(this.stateTimer);
        }
    }
    
    /**
     * Enter a specific state
     */
    enterState(stateName, reason = 'automatic') {
        const previousState = this.currentState;
        const state = this.states[stateName];
        
        if (!state) {
            console.error(`❌ Invalid state: ${stateName}`);
            return false;
        }
        
        // Record transition
        const transition = {
            from: previousState,
            to: stateName,
            reason,
            timestamp: new Date(),
            frequency: state.frequency,
            duration: state.duration
        };
        
        this.transitionHistory.push(transition);
        this.currentState = stateName;
        this.stateStartTime = Date.now();
        
        // Calculate harmonic frequency
        this.currentHarmony = this.calculateHarmonic(state.frequency);
        
        console.log(`${state.emoji} Entered state: ${state.name} (${state.description})`);
        console.log(`♪ Frequency: ${state.frequency}Hz, Harmony: ${this.currentHarmony}Hz`);
        
        // Emit state change event
        this.emit('state_change', {
            state: stateName,
            emoji: state.emoji,
            frequency: state.frequency,
            harmony: this.currentHarmony,
            reason,
            timestamp: new Date()
        });
        
        // Start state timer for automatic transitions
        this.scheduleStateTransition(state);
        
        return true;
    }
    
    /**
     * Schedule automatic state transition
     */
    scheduleStateTransition(state) {
        if (this.stateTimer) {
            clearTimeout(this.stateTimer);
        }
        
        this.stateTimer = setTimeout(() => {
            if (this.running) {
                this.evaluateStateTransition();
            }
        }, state.duration);
    }
    
    /**
     * Evaluate what state to transition to next
     */
    evaluateStateTransition() {
        const currentStateData = this.states[this.currentState];
        let nextState = this.determineNextState();
        
        console.log(`⏰ State timer expired for ${currentStateData.name}, evaluating transition...`);
        
        // Special logic for green state (cycling until proven)
        if (this.currentState === 'green') {
            this.cycleCount++;
            
            if (this.proofScore >= this.config.proofThreshold) {
                nextState = 'purple'; // Proven!
                console.log(`✅ Proof threshold reached! ${this.proofScore}% >= ${this.config.proofThreshold}%`);
            } else if (this.cycleCount >= this.config.maxCycles) {
                nextState = 'yellow'; // Warning: too many cycles
                console.log(`⚠️ Max cycles reached (${this.cycleCount}), entering warning state`);
            } else {
                // Stay in green, keep cycling
                console.log(`🔄 Cycling green state (${this.cycleCount}/${this.config.maxCycles}), proof: ${this.proofScore}%`);
            }
        }
        
        this.enterState(nextState, 'timer_expired');
    }
    
    /**
     * Determine next state based on current state and conditions
     */
    determineNextState() {
        const currentStateData = this.states[this.currentState];
        const possibleTransitions = currentStateData.transitions;
        
        // Default transition logic
        switch (this.currentState) {
            case 'green':
                return 'green'; // Keep cycling until proven
            
            case 'purple':
                // Stay in purple unless triggered to change
                return Math.random() > 0.8 ? 'gold' : 'purple';
            
            case 'gold':
                return 'purple'; // Return to stable state
            
            case 'yellow':
                return this.proofScore > 50 ? 'green' : 'red';
            
            case 'red':
                return 'green'; // Always try to recover
            
            default:
                return 'green';
        }
    }
    
    /**
     * Record a proof attempt
     */
    recordProofAttempt(attempt) {
        const proofRecord = {
            id: crypto.randomBytes(8).toString('hex'),
            type: attempt.type || 'unknown',
            success: attempt.success,
            score: attempt.score || 0,
            kingData: attempt.kingData,
            queenData: attempt.queenData,
            timestamp: new Date(),
            state: this.currentState,
            cycleCount: this.cycleCount
        };
        
        this.proofAttempts.push(proofRecord);
        
        if (attempt.success) {
            this.validatedProofs.push(proofRecord);
        }
        
        // Update proof score (rolling average of last 10 attempts)
        this.updateProofScore();
        
        console.log(`📊 Proof attempt: ${attempt.success ? '✅' : '❌'} Score: ${attempt.score}%, Overall: ${this.proofScore}%`);
        
        this.emit('proof_attempt', proofRecord);
        
        return proofRecord;
    }
    
    /**
     * Record a King/Queen dance event
     */
    recordDanceEvent(danceData) {
        const danceEvent = {
            id: crypto.randomBytes(8).toString('hex'),
            dance: danceData.dance || 'unknown',
            kingMetrics: danceData.kingMetrics,
            queenMetrics: danceData.queenMetrics,
            synchronization: danceData.synchronization || 0,
            success: danceData.success,
            timestamp: new Date(),
            state: this.currentState,
            frequency: this.states[this.currentState].frequency
        };
        
        this.danceEvents.push(danceEvent);
        
        // Convert dance success to proof attempt
        if (danceData.success !== undefined) {
            this.recordProofAttempt({
                type: 'dance',
                success: danceData.success,
                score: danceData.synchronization,
                kingData: danceData.kingMetrics,
                queenData: danceData.queenMetrics
            });
        }
        
        console.log(`💃 Dance event: ${danceData.dance} - ${danceData.success ? '✅' : '❌'} (sync: ${danceData.synchronization}%)`);
        
        this.emit('dance_event', danceEvent);
        
        return danceEvent;
    }
    
    /**
     * Update the overall proof score
     */
    updateProofScore() {
        const recentAttempts = this.proofAttempts.slice(-10); // Last 10 attempts
        
        if (recentAttempts.length === 0) {
            this.proofScore = 0;
            return;
        }
        
        const successfulAttempts = recentAttempts.filter(a => a.success);
        const successRate = (successfulAttempts.length / recentAttempts.length) * 100;
        
        // Weight by scores if available
        const avgScore = recentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / recentAttempts.length;
        
        this.proofScore = Math.round((successRate + avgScore) / 2);
        
        this.emit('proof_score_updated', {
            score: this.proofScore,
            attempts: recentAttempts.length,
            successes: successfulAttempts.length
        });
    }
    
    /**
     * Calculate harmonic frequency based on base frequency
     */
    calculateHarmonic(baseFrequency) {
        // Musical harmony ratios
        const harmonicRatios = [1, 1.2, 1.5, 2, 2.5, 3]; // Perfect fifths, octaves, etc.
        const ratio = harmonicRatios[Math.floor(Math.random() * harmonicRatios.length)];
        return Math.round(baseFrequency * ratio);
    }
    
    /**
     * Force a state transition
     */
    forceStateTransition(stateName, reason = 'manual') {
        const state = this.states[stateName];
        
        if (!state) {
            console.error(`❌ Cannot force transition to invalid state: ${stateName}`);
            return false;
        }
        
        console.log(`🎯 Forcing state transition to ${stateName}: ${reason}`);
        
        // Reset cycle count if entering green
        if (stateName === 'green') {
            this.cycleCount = 0;
        }
        
        return this.enterState(stateName, reason);
    }
    
    /**
     * Start monitoring state changes
     */
    startStateMonitoring() {
        // Monitor proof score and automatically transition
        setInterval(() => {
            if (!this.running) return;
            
            // Auto-transition from green to purple if proof threshold reached
            if (this.currentState === 'green' && this.proofScore >= this.config.proofThreshold) {
                this.forceStateTransition('purple', 'proof_threshold_reached');
            }
            
            // Auto-transition to red if critical issues detected
            const recentFailures = this.proofAttempts.slice(-5).filter(a => !a.success).length;
            if (recentFailures >= 4 && this.currentState !== 'red') {
                this.forceStateTransition('red', 'critical_failures_detected');
            }
            
        }, this.config.cycleInterval);
    }
    
    /**
     * Get current state information
     */
    getCurrentState() {
        const state = this.states[this.currentState];
        const timeInState = Date.now() - this.stateStartTime;
        
        return {
            name: this.currentState,
            emoji: state.emoji,
            description: state.description,
            frequency: state.frequency,
            harmony: this.currentHarmony,
            timeInState,
            cycleCount: this.cycleCount,
            proofScore: this.proofScore,
            rgb: state.rgb
        };
    }
    
    /**
     * Get engine statistics
     */
    getStats() {
        return {
            currentState: this.getCurrentState(),
            proofAttempts: this.proofAttempts.length,
            validatedProofs: this.validatedProofs.length,
            danceEvents: this.danceEvents.length,
            transitions: this.transitionHistory.length,
            successRate: this.proofScore,
            uptime: Date.now() - this.stateStartTime,
            running: this.running
        };
    }
    
    /**
     * Get recent transition history
     */
    getTransitionHistory(limit = 10) {
        return this.transitionHistory.slice(-limit);
    }
    
    /**
     * Export color palette for UI
     */
    getColorPalette() {
        const palette = {};
        for (const [name, state] of Object.entries(this.states)) {
            palette[name] = {
                name: state.name,
                emoji: state.emoji,
                rgb: state.rgb,
                hex: `#${state.rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`,
                frequency: state.frequency
            };
        }
        return palette;
    }
}

// Export the class
module.exports = ColorStateProofEngine;

// Demo if run directly
if (require.main === module) {
    const engine = new ColorStateProofEngine({
        cycleInterval: 3000,
        proofThreshold: 80,
        maxCycles: 5
    });
    
    // Event listeners
    engine.on('state_change', (data) => {
        console.log(`🌈 State changed: ${data.emoji} ${data.state} (${data.reason})`);
    });
    
    engine.on('proof_attempt', (proof) => {
        console.log(`📊 Proof: ${proof.success ? '✅' : '❌'} (${proof.score}%)`);
    });
    
    engine.on('dance_event', (dance) => {
        console.log(`💃 Dance: ${dance.dance} - sync: ${dance.synchronization}%`);
    });
    
    // Start the engine
    engine.start();
    
    // Simulate some proof attempts
    setTimeout(() => {
        engine.recordProofAttempt({
            type: 'database_sync',
            success: true,
            score: 85,
            kingData: { latency: 120, errors: 0 },
            queenData: { satisfaction: 92, confusion: 5 }
        });
    }, 2000);
    
    setTimeout(() => {
        engine.recordDanceEvent({
            dance: 'waltz',
            kingMetrics: { precision: 95, timing: 98 },
            queenMetrics: { grace: 88, enjoyment: 94 },
            synchronization: 91,
            success: true
        });
    }, 4000);
    
    setTimeout(() => {
        engine.recordProofAttempt({
            type: 'cross_environment',
            success: true,
            score: 92,
            kingData: { encryption: 'valid', speed: 'fast' },
            queenData: { experience: 'smooth', trust: 'high' }
        });
    }, 6000);
    
    // Show stats after 10 seconds
    setTimeout(() => {
        console.log('\n📊 Engine Statistics:');
        console.log(JSON.stringify(engine.getStats(), null, 2));
        console.log('\n🎨 Color Palette:');
        console.log(JSON.stringify(engine.getColorPalette(), null, 2));
        
        // Stop the engine
        setTimeout(() => engine.stop(), 2000);
    }, 10000);
}