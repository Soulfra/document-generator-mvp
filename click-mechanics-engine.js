#!/usr/bin/env node

/**
 * 🎯⚡ CLICK MECHANICS ENGINE ⚡🎯
 * 
 * Advanced clicking mechanics with combos, criticals, and special patterns
 * Powers the clicking combat system with precision detection
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class ClickMechanicsEngine extends EventEmitter {
    constructor() {
        super();
        this.engineId = crypto.randomBytes(16).toString('hex');
        this.activeSessions = new Map();
        this.clickPatterns = new Map();
        this.powerUpEffects = new Map();
        
        console.log('🎯⚡ CLICK MECHANICS ENGINE');
        console.log('=========================');
        console.log('Advanced clicking mechanics for combat');
        console.log('');
        
        this.initializeMechanics();
    }
    
    async initializeMechanics() {
        console.log('⚙️ Initializing Click Mechanics Engine...');
        
        try {
            // Initialize click detection system
            await this.initializeClickDetection();
            
            // Setup combo patterns
            await this.setupComboPatterns();
            
            // Initialize critical hit system
            await this.initializeCriticalSystem();
            
            // Create power-up effects
            await this.createPowerUpEffects();
            
            // Setup timing windows
            await this.setupTimingWindows();
            
            // Initialize accuracy tracking
            await this.initializeAccuracyTracking();
            
            // Create special click techniques
            await this.createSpecialTechniques();
            
            console.log('✅ Click Mechanics Engine ready!');
            
        } catch (error) {
            console.error('❌ Mechanics initialization failed:', error);
            throw error;
        }
    }
    
    async initializeClickDetection() {
        console.log('\n🖱️ Initializing click detection system...');
        
        this.clickDetection = {
            // Click type detection
            detectClickType: (clickEvent) => {
                const types = [];
                
                // Button detection
                if (clickEvent.button === 0) types.push('left');
                if (clickEvent.button === 1) types.push('middle');
                if (clickEvent.button === 2) types.push('right');
                
                // Modifier keys
                if (clickEvent.ctrlKey) types.push('ctrl');
                if (clickEvent.shiftKey) types.push('shift');
                if (clickEvent.altKey) types.push('alt');
                
                // Click intensity (based on time held for touch/pressure)
                if (clickEvent.pressure) {
                    if (clickEvent.pressure > 0.8) types.push('heavy');
                    else if (clickEvent.pressure > 0.5) types.push('medium');
                    else types.push('light');
                }
                
                return types;
            },
            
            // Click position analysis
            analyzeClickPosition: (clickPos, targetBounds) => {
                const relativeX = (clickPos.x - targetBounds.left) / targetBounds.width;
                const relativeY = (clickPos.y - targetBounds.top) / targetBounds.height;
                
                // Distance from center
                const centerDistance = Math.sqrt(
                    Math.pow(relativeX - 0.5, 2) + 
                    Math.pow(relativeY - 0.5, 2)
                );
                
                // Quadrant detection
                let quadrant = '';
                if (relativeX < 0.5 && relativeY < 0.5) quadrant = 'top-left';
                else if (relativeX >= 0.5 && relativeY < 0.5) quadrant = 'top-right';
                else if (relativeX < 0.5 && relativeY >= 0.5) quadrant = 'bottom-left';
                else quadrant = 'bottom-right';
                
                return {
                    relativeX,
                    relativeY,
                    centerDistance,
                    quadrant,
                    accuracy: 1 - centerDistance, // Higher accuracy closer to center
                    edge: centerDistance > 0.4
                };
            },
            
            // Click timing analysis
            analyzeClickTiming: (currentTime, lastClickTime, rhythm) => {
                const timeDelta = currentTime - lastClickTime;
                
                // BPM calculation
                const bpm = timeDelta > 0 ? 60000 / timeDelta : 0;
                
                // Rhythm accuracy
                let rhythmAccuracy = 0;
                if (rhythm && rhythm.targetBPM) {
                    const bpmDifference = Math.abs(bpm - rhythm.targetBPM);
                    rhythmAccuracy = Math.max(0, 1 - (bpmDifference / rhythm.targetBPM));
                }
                
                // Speed rating
                let speedRating = 'slow';
                if (timeDelta < 150) speedRating = 'rapid';
                else if (timeDelta < 300) speedRating = 'fast';
                else if (timeDelta < 500) speedRating = 'medium';
                
                return {
                    timeDelta,
                    bpm,
                    rhythmAccuracy,
                    speedRating,
                    isComboWindow: timeDelta < 1000
                };
            }
        };
        
        console.log('✅ Click detection configured');
    }
    
    async setupComboPatterns() {
        console.log('\n🔢 Setting up combo patterns...');
        
        this.comboPatterns = {
            // Basic combos
            'rapid_fire': {
                name: 'Rapid Fire',
                pattern: ['click', 'click', 'click', 'click', 'click'],
                timeWindow: 500, // Must complete in 500ms
                multiplier: 1.5,
                description: '5 rapid clicks'
            },
            
            'double_tap': {
                name: 'Double Tap',
                pattern: ['click', 'click'],
                timeWindow: 200,
                multiplier: 1.2,
                description: '2 quick clicks'
            },
            
            'triple_threat': {
                name: 'Triple Threat',
                pattern: ['click', 'click', 'click'],
                timeWindow: 300,
                multiplier: 1.3,
                description: '3 quick clicks'
            },
            
            // Advanced combos
            'rhythm_master': {
                name: 'Rhythm Master',
                pattern: ['click', 'pause', 'click', 'pause', 'click'],
                timeWindow: 2000,
                requiresRhythm: true,
                targetBPM: 120,
                multiplier: 2.0,
                description: 'Rhythmic clicking at 120 BPM'
            },
            
            'quad_burst': {
                name: 'Quad Burst',
                pattern: ['click', 'click', 'pause', 'click', 'click'],
                timeWindow: 800,
                multiplier: 1.8,
                description: '2 clicks, pause, 2 clicks'
            },
            
            // Position-based combos
            'corner_sweep': {
                name: 'Corner Sweep',
                pattern: ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
                requiresPosition: true,
                timeWindow: 2000,
                multiplier: 2.5,
                description: 'Click all 4 corners'
            },
            
            'center_focus': {
                name: 'Center Focus',
                pattern: ['center', 'center', 'center'],
                requiresPosition: true,
                accuracyThreshold: 0.8,
                timeWindow: 1000,
                multiplier: 2.0,
                description: '3 precise center clicks'
            },
            
            // Special combos
            'machine_gun': {
                name: 'Machine Gun',
                pattern: Array(10).fill('click'),
                timeWindow: 1500,
                multiplier: 3.0,
                description: '10 clicks in 1.5 seconds'
            },
            
            'precision_strike': {
                name: 'Precision Strike',
                pattern: ['critical', 'critical', 'critical'],
                requiresCritical: true,
                timeWindow: 3000,
                multiplier: 4.0,
                description: '3 critical hits in a row'
            },
            
            // Modifier combos
            'power_click': {
                name: 'Power Click',
                pattern: ['shift+click'],
                requiresModifier: true,
                multiplier: 1.5,
                description: 'Shift + Click'
            },
            
            'ultimate_combo': {
                name: 'Ultimate Combo',
                pattern: ['critical', 'click', 'click', 'critical', 'click', 'click', 'critical'],
                timeWindow: 5000,
                multiplier: 5.0,
                description: 'Complex pattern with criticals'
            }
        };
        
        console.log(`✅ Configured ${Object.keys(this.comboPatterns).length} combo patterns`);
    }
    
    async initializeCriticalSystem() {
        console.log('\n💥 Initializing critical hit system...');
        
        this.criticalSystem = {
            // Critical hit calculation
            calculateCritical: (clickData, targetData) => {
                let criticalChance = 0.1; // Base 10% chance
                
                // Accuracy bonus
                if (clickData.accuracy > 0.9) {
                    criticalChance += 0.2; // +20% for high accuracy
                }
                
                // Weak spot bonus
                if (targetData.weakSpots) {
                    for (const weakSpot of targetData.weakSpots) {
                        if (this.isClickInArea(clickData.position, weakSpot)) {
                            criticalChance = 1.0; // Guaranteed critical on weak spot
                            break;
                        }
                    }
                }
                
                // Combo bonus
                if (clickData.comboCount > 10) {
                    criticalChance += 0.05 * Math.floor(clickData.comboCount / 10);
                }
                
                // Power-up bonus
                if (clickData.powerUps && clickData.powerUps.includes('critical_boost')) {
                    criticalChance += 0.3;
                }
                
                // Roll for critical
                const isCritical = Math.random() < Math.min(criticalChance, 1.0);
                
                // Calculate critical multiplier
                let criticalMultiplier = 2.0; // Base 2x damage
                
                if (isCritical && clickData.accuracy > 0.95) {
                    criticalMultiplier = 3.0; // Perfect accuracy = 3x
                }
                
                return {
                    isCritical,
                    chance: criticalChance,
                    multiplier: isCritical ? criticalMultiplier : 1.0,
                    type: this.criticalSystem.getCriticalType(criticalChance)
                };
            },
            
            // Critical types based on chance
            getCriticalType: (chance) => {
                if (chance >= 1.0) return 'guaranteed';
                if (chance >= 0.5) return 'likely';
                if (chance >= 0.3) return 'moderate';
                return 'lucky';
            },
            
            // Visual feedback for criticals
            criticalEffects: {
                'guaranteed': {
                    color: '#FFD700', // Gold
                    size: 2.0,
                    shake: true,
                    sound: 'critical_guaranteed'
                },
                'likely': {
                    color: '#FF0000', // Red
                    size: 1.8,
                    shake: true,
                    sound: 'critical_likely'
                },
                'moderate': {
                    color: '#FF6600', // Orange
                    size: 1.5,
                    shake: false,
                    sound: 'critical_moderate'
                },
                'lucky': {
                    color: '#FFFF00', // Yellow
                    size: 1.3,
                    shake: false,
                    sound: 'critical_lucky'
                }
            }
        };
        
        console.log('✅ Critical system initialized');
    }
    
    async createPowerUpEffects() {
        console.log('\n💊 Creating power-up effects...');
        
        this.powerUpEffects = new Map([
            ['rapid_fire', {
                name: 'Rapid Fire',
                duration: 10000,
                effects: {
                    clickSpeed: 1.5,
                    comboWindow: 1.5,
                    description: 'Clicks register 50% faster'
                }
            }],
            
            ['critical_boost', {
                name: 'Critical Boost',
                duration: 15000,
                effects: {
                    criticalChance: 0.3,
                    criticalDamage: 1.5,
                    description: '+30% critical chance'
                }
            }],
            
            ['precision_mode', {
                name: 'Precision Mode',
                duration: 12000,
                effects: {
                    accuracyBonus: 0.2,
                    weakSpotSize: 1.5,
                    description: 'Larger weak spots, better accuracy'
                }
            }],
            
            ['combo_master', {
                name: 'Combo Master',
                duration: 20000,
                effects: {
                    comboDecayTime: 2.0,
                    comboMultiplier: 1.5,
                    description: 'Combos last longer and hit harder'
                }
            }],
            
            ['berserker', {
                name: 'Berserker Mode',
                duration: 8000,
                effects: {
                    damage: 2.0,
                    accuracy: 0.5,
                    description: 'Double damage but half accuracy'
                }
            }],
            
            ['time_slow', {
                name: 'Time Slow',
                duration: 5000,
                effects: {
                    enemySpeed: 0.5,
                    dodgeWindow: 2.0,
                    description: 'Enemy attacks move slower'
                }
            }],
            
            ['shield', {
                name: 'Shield',
                duration: 10000,
                effects: {
                    damageReduction: 0.5,
                    blockChance: 0.3,
                    description: 'Take 50% less damage'
                }
            }],
            
            ['multi_hit', {
                name: 'Multi Hit',
                duration: 15000,
                effects: {
                    extraHits: 2,
                    spreadDamage: 0.5,
                    description: 'Each click hits 3 times'
                }
            }]
        ]);
        
        console.log(`✅ Created ${this.powerUpEffects.size} power-up effects`);
    }
    
    async setupTimingWindows() {
        console.log('\n⏱️ Setting up timing windows...');
        
        this.timingWindows = {
            // Perfect timing windows
            perfect: {
                window: 50, // 50ms window
                multiplier: 2.0,
                feedback: 'PERFECT!'
            },
            
            great: {
                window: 100,
                multiplier: 1.5,
                feedback: 'GREAT!'
            },
            
            good: {
                window: 200,
                multiplier: 1.2,
                feedback: 'GOOD!'
            },
            
            ok: {
                window: 500,
                multiplier: 1.0,
                feedback: 'OK'
            },
            
            // Rhythm game style timing
            calculateTiming: (clickTime, beatTime) => {
                const difference = Math.abs(clickTime - beatTime);
                
                if (difference <= this.timingWindows.perfect.window) {
                    return this.timingWindows.perfect;
                } else if (difference <= this.timingWindows.great.window) {
                    return this.timingWindows.great;
                } else if (difference <= this.timingWindows.good.window) {
                    return this.timingWindows.good;
                } else {
                    return this.timingWindows.ok;
                }
            }
        };
        
        console.log('✅ Timing windows configured');
    }
    
    async initializeAccuracyTracking() {
        console.log('\n🎯 Initializing accuracy tracking...');
        
        this.accuracyTracking = {
            // Track accuracy per session
            sessionAccuracy: new Map(),
            
            // Update accuracy
            updateAccuracy: (sessionId, clickAccuracy) => {
                if (!this.accuracyTracking.sessionAccuracy.has(sessionId)) {
                    this.accuracyTracking.sessionAccuracy.set(sessionId, {
                        totalClicks: 0,
                        accuracySum: 0,
                        perfectHits: 0,
                        missedClicks: 0,
                        weakSpotHits: 0
                    });
                }
                
                const stats = this.accuracyTracking.sessionAccuracy.get(sessionId);
                stats.totalClicks++;
                stats.accuracySum += clickAccuracy;
                
                if (clickAccuracy > 0.95) stats.perfectHits++;
                if (clickAccuracy < 0.1) stats.missedClicks++;
                
                return {
                    currentAccuracy: clickAccuracy,
                    averageAccuracy: stats.accuracySum / stats.totalClicks,
                    perfectRate: stats.perfectHits / stats.totalClicks
                };
            },
            
            // Get accuracy bonus
            getAccuracyBonus: (averageAccuracy) => {
                if (averageAccuracy > 0.9) return 1.5;
                if (averageAccuracy > 0.8) return 1.3;
                if (averageAccuracy > 0.7) return 1.1;
                return 1.0;
            }
        };
        
        console.log('✅ Accuracy tracking initialized');
    }
    
    async createSpecialTechniques() {
        console.log('\n🥋 Creating special click techniques...');
        
        this.specialTechniques = {
            'charge_shot': {
                name: 'Charge Shot',
                requirement: 'Hold click for 1 second',
                execute: (holdTime) => {
                    const chargeLevel = Math.min(holdTime / 1000, 3); // Max 3 second charge
                    return {
                        damage: 1 + chargeLevel * 2, // Up to 7x damage
                        feedback: `CHARGE LEVEL ${Math.floor(chargeLevel)}!`
                    };
                }
            },
            
            'scatter_shot': {
                name: 'Scatter Shot',
                requirement: 'Click 5 different areas rapidly',
                execute: (clickPositions) => {
                    const spread = this.calculateSpread(clickPositions);
                    return {
                        damage: 0.5 * clickPositions.length,
                        aoe: true,
                        radius: spread * 100,
                        feedback: 'SCATTER SHOT!'
                    };
                }
            },
            
            'focus_beam': {
                name: 'Focus Beam',
                requirement: 'Hold steady on one spot',
                execute: (steadyTime, accuracy) => {
                    const focusLevel = steadyTime / 1000 * accuracy;
                    return {
                        damage: focusLevel * 3,
                        continuous: true,
                        feedback: 'FOCUS BEAM!'
                    };
                }
            },
            
            'lightning_strike': {
                name: 'Lightning Strike',
                requirement: 'Zigzag pattern across screen',
                execute: (pattern) => {
                    const zigzagQuality = this.analyzeZigzag(pattern);
                    return {
                        damage: zigzagQuality * 5,
                        chain: true,
                        targets: Math.floor(zigzagQuality * 3),
                        feedback: 'LIGHTNING STRIKE!'
                    };
                }
            }
        };
        
        console.log(`✅ Created ${Object.keys(this.specialTechniques).length} special techniques`);
    }
    
    // Core mechanics methods
    createSession(playerId, config = {}) {
        const sessionId = crypto.randomBytes(16).toString('hex');
        
        const session = {
            id: sessionId,
            playerId,
            startTime: Date.now(),
            config,
            stats: {
                totalClicks: 0,
                successfulHits: 0,
                criticalHits: 0,
                comboHighest: 0,
                accuracySum: 0,
                damageDealt: 0
            },
            combo: {
                count: 0,
                multiplier: 1.0,
                pattern: [],
                lastClickTime: 0
            },
            powerUps: {
                active: new Map(),
                collected: []
            },
            techniques: {
                available: Object.keys(this.specialTechniques),
                cooldowns: new Map()
            }
        };
        
        this.activeSessions.set(sessionId, session);
        
        console.log(`⚙️ Created click session: ${sessionId}`);
        return session;
    }
    
    processClick(sessionId, clickData) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return null;
        
        const now = Date.now();
        session.stats.totalClicks++;
        
        // Analyze click
        const clickAnalysis = {
            types: this.clickDetection.detectClickType(clickData),
            position: this.clickDetection.analyzeClickPosition(
                clickData.position,
                clickData.targetBounds
            ),
            timing: this.clickDetection.analyzeClickTiming(
                now,
                session.combo.lastClickTime,
                session.config.rhythm
            )
        };
        
        // Update combo
        const comboResult = this.updateCombo(session, clickAnalysis, now);
        
        // Calculate critical
        const criticalResult = this.criticalSystem.calculateCritical(
            {
                ...clickData,
                accuracy: clickAnalysis.position.accuracy,
                comboCount: session.combo.count,
                powerUps: Array.from(session.powerUps.active.keys())
            },
            clickData.targetData || {}
        );
        
        // Apply power-ups
        const powerUpModifiers = this.calculatePowerUpModifiers(session);
        
        // Calculate final damage
        let damage = clickData.baseDamage || 10;
        damage *= comboResult.multiplier;
        damage *= criticalResult.multiplier;
        damage *= powerUpModifiers.damage;
        damage *= this.accuracyTracking.getAccuracyBonus(clickAnalysis.position.accuracy);
        
        // Update stats
        session.stats.successfulHits++;
        session.stats.damageDealt += damage;
        if (criticalResult.isCritical) session.stats.criticalHits++;
        
        // Update accuracy
        this.accuracyTracking.updateAccuracy(sessionId, clickAnalysis.position.accuracy);
        
        // Check for special techniques
        const techniqueResult = this.checkSpecialTechniques(session, clickAnalysis);
        
        // Emit results
        const result = {
            damage: Math.floor(damage),
            critical: criticalResult,
            combo: comboResult,
            accuracy: clickAnalysis.position.accuracy,
            timing: clickAnalysis.timing,
            technique: techniqueResult,
            powerUps: powerUpModifiers,
            feedback: this.generateFeedback(criticalResult, comboResult, clickAnalysis)
        };
        
        this.emit('click_processed', {
            sessionId,
            result
        });
        
        session.combo.lastClickTime = now;
        
        return result;
    }
    
    updateCombo(session, clickAnalysis, currentTime) {
        // Check if combo continues
        if (clickAnalysis.timing.isComboWindow) {
            session.combo.count++;
            session.combo.pattern.push(clickAnalysis.position.quadrant);
            
            // Keep pattern limited
            if (session.combo.pattern.length > 10) {
                session.combo.pattern.shift();
            }
            
            // Check for combo patterns
            const matchedCombo = this.checkComboPatterns(session.combo.pattern);
            
            if (matchedCombo) {
                session.combo.multiplier = matchedCombo.multiplier;
                
                this.emit('combo_achieved', {
                    sessionId: session.id,
                    combo: matchedCombo,
                    count: session.combo.count
                });
            } else {
                // Standard combo multiplier
                session.combo.multiplier = 1 + (session.combo.count * 0.1);
            }
            
            // Update highest combo
            if (session.combo.count > session.stats.comboHighest) {
                session.stats.comboHighest = session.combo.count;
            }
        } else {
            // Combo broken
            session.combo.count = 1;
            session.combo.multiplier = 1.0;
            session.combo.pattern = [clickAnalysis.position.quadrant];
        }
        
        return {
            count: session.combo.count,
            multiplier: session.combo.multiplier,
            pattern: session.combo.pattern
        };
    }
    
    checkComboPatterns(pattern) {
        for (const [key, combo] of Object.entries(this.comboPatterns)) {
            if (combo.requiresPosition) {
                // Check position-based patterns
                const patternString = pattern.slice(-combo.pattern.length).join(',');
                const comboString = combo.pattern.join(',');
                
                if (patternString === comboString) {
                    return combo;
                }
            }
        }
        return null;
    }
    
    calculatePowerUpModifiers(session) {
        const modifiers = {
            damage: 1.0,
            criticalChance: 0,
            accuracy: 0,
            comboWindow: 1.0
        };
        
        session.powerUps.active.forEach((powerUp, key) => {
            const effect = this.powerUpEffects.get(key);
            if (!effect) return;
            
            // Apply effects
            if (effect.effects.damage) modifiers.damage *= effect.effects.damage;
            if (effect.effects.criticalChance) modifiers.criticalChance += effect.effects.criticalChance;
            if (effect.effects.accuracyBonus) modifiers.accuracy += effect.effects.accuracyBonus;
            if (effect.effects.comboWindow) modifiers.comboWindow *= effect.effects.comboWindow;
        });
        
        return modifiers;
    }
    
    checkSpecialTechniques(session, clickAnalysis) {
        // Check for charge shot
        if (clickAnalysis.types.includes('hold')) {
            const technique = this.specialTechniques['charge_shot'];
            return technique.execute(clickAnalysis.holdTime);
        }
        
        // Other technique checks would go here
        
        return null;
    }
    
    generateFeedback(critical, combo, analysis) {
        const feedback = [];
        
        // Critical feedback
        if (critical.isCritical) {
            feedback.push(`CRITICAL! (${critical.type})`);
        }
        
        // Combo feedback
        if (combo.count > 5) {
            feedback.push(`${combo.count}x COMBO!`);
        }
        
        // Accuracy feedback
        if (analysis.position.accuracy > 0.95) {
            feedback.push('PERFECT ACCURACY!');
        }
        
        // Timing feedback
        if (analysis.timing.speedRating === 'rapid') {
            feedback.push('RAPID FIRE!');
        }
        
        return feedback.join(' ');
    }
    
    // Utility methods
    isClickInArea(clickPos, area) {
        const distance = Math.sqrt(
            Math.pow(clickPos.x - area.x, 2) + 
            Math.pow(clickPos.y - area.y, 2)
        );
        return distance <= area.radius;
    }
    
    calculateSpread(positions) {
        if (positions.length < 2) return 0;
        
        let maxDistance = 0;
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(positions[i].x - positions[j].x, 2) +
                    Math.pow(positions[i].y - positions[j].y, 2)
                );
                maxDistance = Math.max(maxDistance, distance);
            }
        }
        
        return maxDistance;
    }
    
    analyzeZigzag(pattern) {
        // Simplified zigzag analysis
        let changes = 0;
        let lastDirection = null;
        
        for (let i = 1; i < pattern.length; i++) {
            const direction = pattern[i].x > pattern[i-1].x ? 'right' : 'left';
            if (lastDirection && direction !== lastDirection) {
                changes++;
            }
            lastDirection = direction;
        }
        
        return Math.min(changes / pattern.length, 1.0);
    }
    
    activatePowerUp(sessionId, powerUpType) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return false;
        
        const powerUp = this.powerUpEffects.get(powerUpType);
        if (!powerUp) return false;
        
        // Activate power-up
        session.powerUps.active.set(powerUpType, {
            startTime: Date.now(),
            duration: powerUp.duration
        });
        
        // Schedule deactivation
        setTimeout(() => {
            session.powerUps.active.delete(powerUpType);
            this.emit('power_up_expired', {
                sessionId,
                powerUpType
            });
        }, powerUp.duration);
        
        session.powerUps.collected.push(powerUpType);
        
        this.emit('power_up_activated', {
            sessionId,
            powerUpType,
            effects: powerUp.effects
        });
        
        return true;
    }
    
    getSessionStats(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return null;
        
        const duration = Date.now() - session.startTime;
        const accuracy = session.stats.accuracySum / session.stats.totalClicks || 0;
        
        return {
            duration,
            totalClicks: session.stats.totalClicks,
            successfulHits: session.stats.successfulHits,
            accuracy: accuracy * 100,
            criticalHits: session.stats.criticalHits,
            criticalRate: (session.stats.criticalHits / session.stats.successfulHits) * 100 || 0,
            highestCombo: session.stats.comboHighest,
            totalDamage: session.stats.damageDealt,
            averageDamage: session.stats.damageDealt / session.stats.successfulHits || 0,
            clicksPerSecond: session.stats.totalClicks / (duration / 1000) || 0,
            powerUpsCollected: session.powerUps.collected.length
        };
    }
    
    displaySystemSummary() {
        console.log('\n🎯⚡ CLICK MECHANICS ENGINE SUMMARY');
        console.log('=================================');
        
        console.log(`\n📊 System Components:`);
        console.log(`  • Combo Patterns: ${Object.keys(this.comboPatterns).length}`);
        console.log(`  • Power-up Effects: ${this.powerUpEffects.size}`);
        console.log(`  • Special Techniques: ${Object.keys(this.specialTechniques).length}`);
        console.log(`  • Active Sessions: ${this.activeSessions.size}`);
        
        console.log('\n🎮 CLICK MECHANICS:');
        console.log('  • Position-based accuracy detection');
        console.log('  • Timing window precision');
        console.log('  • Combo pattern recognition');
        console.log('  • Critical hit calculations');
        console.log('  • Power-up effect stacking');
        console.log('  • Special technique execution');
        
        console.log('\n🔢 COMBO SYSTEM:');
        console.log('  • Rapid Fire: 5 quick clicks');
        console.log('  • Corner Sweep: Click all 4 corners');
        console.log('  • Rhythm Master: BPM-based clicking');
        console.log('  • Ultimate Combo: Complex patterns');
        
        console.log('\n💊 POWER-UPS:');
        console.log('  • Rapid Fire: Faster click registration');
        console.log('  • Critical Boost: Higher critical chance');
        console.log('  • Multi Hit: Each click hits multiple times');
        console.log('  • Berserker: Double damage, half accuracy');
    }
}

// Export for integration
module.exports = ClickMechanicsEngine;

// Run if called directly
if (require.main === module) {
    const clickEngine = new ClickMechanicsEngine();
    
    setTimeout(() => {
        clickEngine.displaySystemSummary();
        
        console.log('\n🎉 CLICK MECHANICS ENGINE ACTIVE!');
        console.log('🎯 Precision clicking with accuracy tracking');
        console.log('🔢 Complex combo patterns for bonus damage');
        console.log('💥 Critical hit zones and timing');
        console.log('💊 Power-ups modify click mechanics');
        console.log('🥋 Special techniques for advanced players');
        
    }, 1000);
}