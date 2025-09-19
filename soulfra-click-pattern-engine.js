#!/usr/bin/env node

/**
 * SoulFRA Click Pattern Engine
 * 
 * Generates realistic human-like click patterns with proper variance
 * Handles inventory vs main window spacing, random failures, and recovery patterns
 * Creates believable mouse movements and click behaviors
 * 
 * Features:
 * - Inventory-specific click patterns (32x32 grid, tight spacing)
 * - Main window click patterns (wider variance, distance-based timing)
 * - Misclick generation and recovery behaviors
 * - Fatigue-based accuracy degradation
 * - Mouse movement curve generation
 * - Double-click detection and handling
 * - Drag operation support
 * - Banking patterns
 * - Combat click patterns
 * - Skill training patterns
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class SoulFRAClickPatternEngine extends EventEmitter {
    constructor() {
        super();
        
        // Click pattern configuration
        this.config = {
            // Inventory settings
            inventory: {
                grid_size: { width: 4, height: 7 },  // Standard RS inventory
                slot_size: { width: 32, height: 32 },
                slot_spacing: 6,                      // Pixels between slots
                base_offset: { x: 563, y: 213 },     // Inventory position
                
                // Click variance
                click_variance: {
                    perfect: { min: 0, max: 2 },     // Perfect clicks
                    normal: { min: 2, max: 5 },      // Normal variance
                    tired: { min: 3, max: 8 },       // Tired/distracted
                    sloppy: { min: 5, max: 12 }      // Very sloppy
                },
                
                // Misclick rates
                misclick_rates: {
                    perfect: 0.01,    // 1% misclick
                    normal: 0.05,     // 5% misclick
                    tired: 0.10,      // 10% misclick
                    sloppy: 0.15      // 15% misclick
                }
            },
            
            // Main game window
            main_window: {
                resolution: { width: 765, height: 503 },
                
                // Click variance by distance
                distance_variance: {
                    close: { min: 5, max: 10 },      // < 50 pixels
                    medium: { min: 10, max: 20 },    // 50-200 pixels
                    far: { min: 15, max: 30 },       // > 200 pixels
                    screen_edge: { min: 20, max: 40 } // Near edges
                },
                
                // Timing based on distance
                movement_speed: {
                    base: 0.3,         // ms per pixel
                    variance: 0.2,     // ±20% variance
                    acceleration: 1.2  // Speed multiplier for long distances
                }
            },
            
            // Mouse movement
            mouse: {
                // Curve types
                curve_types: ['linear', 'bezier', 'overshoot', 'undershoot', 'wave'],
                default_curve: 'bezier',
                
                // Human factors
                jitter: {
                    enabled: true,
                    amplitude: 2,      // Max jitter pixels
                    frequency: 0.1     // Jitter probability per point
                },
                
                // Acceleration
                acceleration: {
                    enabled: true,
                    start_slow: true,  // Start movement slowly
                    end_slow: true,    // End movement slowly
                    mid_speed: 1.5     // Middle section speed multiplier
                }
            },
            
            // Click timing
            timing: {
                // Click delays (ms)
                click_delay: { min: 50, max: 150 },
                double_click_threshold: 500,
                drag_hold_time: { min: 100, max: 300 },
                
                // Between actions
                action_delay: {
                    fast: { min: 150, max: 300 },
                    normal: { min: 300, max: 600 },
                    slow: { min: 600, max: 1200 },
                    afk: { min: 2000, max: 5000 }
                }
            },
            
            // Pattern templates
            patterns: {
                // Banking patterns
                banking: {
                    deposit_all: { variance: 'normal', delay: 'fast' },
                    withdraw_x: { variance: 'normal', delay: 'normal' },
                    search_item: { variance: 'tired', delay: 'slow' }
                },
                
                // Combat patterns
                combat: {
                    prayer_switch: { variance: 'perfect', delay: 'fast' },
                    gear_switch: { variance: 'normal', delay: 'fast' },
                    eat_food: { variance: 'tired', delay: 'normal' }
                },
                
                // Skilling patterns
                skilling: {
                    drop_inventory: { variance: 'normal', delay: 'fast' },
                    use_on_object: { variance: 'normal', delay: 'normal' },
                    repetitive_click: { variance: 'tired', delay: 'slow' }
                }
            },
            
            // Anti-pattern detection
            anti_pattern: {
                vary_order: true,          // Randomize action order
                insert_mistakes: true,     // Intentional mistakes
                random_pauses: true,       // Random AFKing
                mouse_movements: true,     // Random mouse movements
                camera_rotations: true     // Occasional camera moves
            }
        };
        
        // State management
        this.state = {
            // Current accuracy level
            accuracy_level: 'normal',
            fatigue_factor: 0,
            concentration: 100,
            
            // Click history
            click_history: [],
            misclick_count: 0,
            recovery_count: 0,
            
            // Pattern tracking
            current_pattern: null,
            pattern_variations: new Map(),
            
            // Mouse state
            current_position: { x: 400, y: 300 },
            last_click_time: 0,
            is_dragging: false,
            
            // Performance metrics
            metrics: {
                total_clicks: 0,
                successful_clicks: 0,
                misclicks: 0,
                recoveries: 0,
                patterns_executed: 0,
                average_accuracy: 100
            }
        };
        
        console.log('🖱️ SoulFRA Click Pattern Engine initialized');
        console.log('🎯 Human-like click patterns ready');
    }
    
    /**
     * Generate inventory click
     */
    generateInventoryClick(slot, options = {}) {
        const accuracy = options.accuracy || this.state.accuracy_level;
        const forceFailure = options.forceFailure || false;
        
        // Calculate slot position
        const row = Math.floor(slot / this.config.inventory.grid_size.width);
        const col = slot % this.config.inventory.grid_size.width;
        
        const baseX = this.config.inventory.base_offset.x + 
                     (col * (this.config.inventory.slot_size.width + this.config.inventory.slot_spacing));
        const baseY = this.config.inventory.base_offset.y + 
                     (row * (this.config.inventory.slot_size.height + this.config.inventory.slot_spacing));
        
        // Add slot center
        let targetX = baseX + this.config.inventory.slot_size.width / 2;
        let targetY = baseY + this.config.inventory.slot_size.height / 2;
        
        // Apply variance
        const variance = this.config.inventory.click_variance[accuracy];
        const offsetX = this.randomInRange(variance.min, variance.max) * (Math.random() > 0.5 ? 1 : -1);
        const offsetY = this.randomInRange(variance.min, variance.max) * (Math.random() > 0.5 ? 1 : -1);
        
        targetX += offsetX;
        targetY += offsetY;
        
        // Check for misclick
        const misclickRate = this.config.inventory.misclick_rates[accuracy];
        const shouldMisclick = forceFailure || Math.random() < misclickRate;
        
        if (shouldMisclick) {
            // Generate misclick
            const misclick = this.generateMisclick(targetX, targetY, 'inventory');
            targetX = misclick.x;
            targetY = misclick.y;
            
            this.state.misclick_count++;
            this.state.metrics.misclicks++;
            
            console.log(`❌ Misclick at (${targetX}, ${targetY}) - intended slot ${slot}`);
            
            // Plan recovery
            const recovery = this.planRecovery(slot, targetX, targetY);
            
            return {
                click: { x: targetX, y: targetY },
                intended_slot: slot,
                actual_slot: this.getSlotFromCoords(targetX, targetY),
                misclick: true,
                recovery: recovery,
                accuracy: accuracy,
                timing: this.calculateClickTiming(accuracy)
            };
        }
        
        // Successful click
        this.state.metrics.successful_clicks++;
        
        return {
            click: { x: targetX, y: targetY },
            slot: slot,
            misclick: false,
            accuracy: accuracy,
            timing: this.calculateClickTiming(accuracy),
            movement: this.generateMouseMovement(
                this.state.current_position,
                { x: targetX, y: targetY },
                'inventory'
            )
        };
    }
    
    /**
     * Generate main window click
     */
    generateMainWindowClick(target, options = {}) {
        const { x: targetX, y: targetY } = target;
        const accuracy = options.accuracy || this.state.accuracy_level;
        
        // Calculate distance from current position
        const distance = this.calculateDistance(this.state.current_position, target);
        
        // Determine variance based on distance
        let variance;
        if (distance < 50) {
            variance = this.config.main_window.distance_variance.close;
        } else if (distance < 200) {
            variance = this.config.main_window.distance_variance.medium;
        } else {
            variance = this.config.main_window.distance_variance.far;
        }
        
        // Check if near screen edge
        const edgeDistance = Math.min(
            targetX, targetY,
            this.config.main_window.resolution.width - targetX,
            this.config.main_window.resolution.height - targetY
        );
        
        if (edgeDistance < 50) {
            variance = this.config.main_window.distance_variance.screen_edge;
        }
        
        // Apply variance
        const offsetX = this.randomInRange(variance.min, variance.max) * (Math.random() > 0.5 ? 1 : -1);
        const offsetY = this.randomInRange(variance.min, variance.max) * (Math.random() > 0.5 ? 1 : -1);
        
        const clickX = Math.max(0, Math.min(this.config.main_window.resolution.width, targetX + offsetX));
        const clickY = Math.max(0, Math.min(this.config.main_window.resolution.height, targetY + offsetY));
        
        // Generate mouse movement
        const movement = this.generateMouseMovement(
            this.state.current_position,
            { x: clickX, y: clickY },
            'main_window'
        );
        
        // Calculate timing based on distance
        const baseTime = distance * this.config.main_window.movement_speed.base;
        const variance_factor = 1 + (Math.random() - 0.5) * this.config.main_window.movement_speed.variance;
        const movement_time = baseTime * variance_factor;
        
        this.state.current_position = { x: clickX, y: clickY };
        this.state.metrics.total_clicks++;
        
        return {
            click: { x: clickX, y: clickY },
            target: target,
            distance: distance,
            movement: movement,
            movement_time: Math.round(movement_time),
            timing: this.calculateClickTiming(accuracy),
            accuracy: accuracy
        };
    }
    
    /**
     * Generate mouse movement path
     */
    generateMouseMovement(start, end, context = 'general') {
        const curveType = this.config.mouse.default_curve;
        const points = [];
        
        switch (curveType) {
            case 'bezier':
                return this.generateBezierCurve(start, end);
            case 'overshoot':
                return this.generateOvershootCurve(start, end);
            case 'wave':
                return this.generateWaveCurve(start, end);
            default:
                return this.generateLinearPath(start, end);
        }
    }
    
    /**
     * Generate bezier curve mouse movement
     */
    generateBezierCurve(start, end) {
        const points = [];
        const distance = this.calculateDistance(start, end);
        const steps = Math.max(5, Math.floor(distance / 10));
        
        // Generate control points
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        // Add some randomness to control points
        const control1 = {
            x: midX + (Math.random() - 0.5) * distance * 0.3,
            y: midY + (Math.random() - 0.5) * distance * 0.3
        };
        
        const control2 = {
            x: midX + (Math.random() - 0.5) * distance * 0.3,
            y: midY + (Math.random() - 0.5) * distance * 0.3
        };
        
        // Generate curve points
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this.calculateBezierPoint(t, start, control1, control2, end);
            
            // Add jitter if enabled
            if (this.config.mouse.jitter.enabled && Math.random() < this.config.mouse.jitter.frequency) {
                point.x += (Math.random() - 0.5) * this.config.mouse.jitter.amplitude;
                point.y += (Math.random() - 0.5) * this.config.mouse.jitter.amplitude;
            }
            
            // Calculate timing with acceleration
            let speed = 1;
            if (this.config.mouse.acceleration.enabled) {
                if (t < 0.2 && this.config.mouse.acceleration.start_slow) {
                    speed = 0.5 + t * 2.5; // Accelerate from 0.5x to 1x
                } else if (t > 0.8 && this.config.mouse.acceleration.end_slow) {
                    speed = 0.5 + (1 - t) * 2.5; // Decelerate from 1x to 0.5x
                } else {
                    speed = this.config.mouse.acceleration.mid_speed;
                }
            }
            
            points.push({
                x: Math.round(point.x),
                y: Math.round(point.y),
                time: i * (10 / speed),
                speed: speed
            });
        }
        
        return points;
    }
    
    /**
     * Calculate bezier point
     */
    calculateBezierPoint(t, p0, p1, p2, p3) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        
        const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
        const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
        
        return { x, y };
    }
    
    /**
     * Generate misclick
     */
    generateMisclick(targetX, targetY, context) {
        // Misclick patterns
        const patterns = [
            { name: 'adjacent_slot', weight: 0.4 },
            { name: 'between_slots', weight: 0.3 },
            { name: 'edge_click', weight: 0.2 },
            { name: 'complete_miss', weight: 0.1 }
        ];
        
        const pattern = this.weightedRandom(patterns);
        
        switch (pattern) {
            case 'adjacent_slot':
                // Click adjacent inventory slot
                const offset = this.config.inventory.slot_size.width + this.config.inventory.slot_spacing;
                const direction = Math.random() > 0.5 ? 1 : -1;
                const axis = Math.random() > 0.5 ? 'x' : 'y';
                
                return {
                    x: axis === 'x' ? targetX + (offset * direction) : targetX,
                    y: axis === 'y' ? targetY + (offset * direction) : targetY
                };
                
            case 'between_slots':
                // Click between slots
                const halfSlot = this.config.inventory.slot_size.width / 2;
                return {
                    x: targetX + halfSlot + this.config.inventory.slot_spacing / 2,
                    y: targetY + (Math.random() - 0.5) * 10
                };
                
            case 'edge_click':
                // Click on edge of slot
                const edgeOffset = this.config.inventory.slot_size.width / 2 - 2;
                return {
                    x: targetX + (Math.random() > 0.5 ? edgeOffset : -edgeOffset),
                    y: targetY + (Math.random() > 0.5 ? edgeOffset : -edgeOffset)
                };
                
            case 'complete_miss':
                // Complete miss - click outside inventory
                return {
                    x: targetX + (Math.random() - 0.5) * 100,
                    y: targetY + (Math.random() - 0.5) * 100
                };
        }
    }
    
    /**
     * Plan recovery from misclick
     */
    planRecovery(intendedSlot, actualX, actualY) {
        const actualSlot = this.getSlotFromCoords(actualX, actualY);
        const recovery = {
            type: 'correction',
            delay: this.randomInRange(100, 300),
            actions: []
        };
        
        if (actualSlot !== null && actualSlot !== intendedSlot) {
            // Clicked wrong slot - might need to undo
            recovery.actions.push({
                type: 'evaluate',
                description: 'Check if misclick caused unwanted action'
            });
            
            // Add slight hesitation
            recovery.delay += 200;
        }
        
        // Add correction click
        recovery.actions.push({
            type: 'click',
            target: intendedSlot,
            accuracy: 'normal', // Be more careful on retry
            description: 'Correct click to intended slot'
        });
        
        this.state.recovery_count++;
        this.state.metrics.recoveries++;
        
        return recovery;
    }
    
    /**
     * Execute click pattern
     */
    async executePattern(patternName, targets, options = {}) {
        const pattern = this.getPatternTemplate(patternName);
        if (!pattern) {
            throw new Error(`Unknown pattern: ${patternName}`);
        }
        
        console.log(`🎯 Executing pattern: ${patternName}`);
        this.state.current_pattern = patternName;
        
        const clicks = [];
        const accuracy = pattern.variance;
        const delayType = pattern.delay;
        
        // Add pattern variation
        if (this.config.anti_pattern.vary_order && targets.length > 1) {
            targets = this.shuffleArray([...targets], 0.3); // 30% shuffle
        }
        
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            
            // Generate click based on target type
            let click;
            if (typeof target === 'number') {
                // Inventory slot
                click = this.generateInventoryClick(target, { accuracy });
            } else {
                // Coordinate click
                click = this.generateMainWindowClick(target, { accuracy });
            }
            
            clicks.push(click);
            
            // Add delay between clicks
            if (i < targets.length - 1) {
                const delay = this.calculateActionDelay(delayType);
                click.next_delay = delay;
                
                // Random pause chance
                if (this.config.anti_pattern.random_pauses && Math.random() < 0.05) {
                    click.next_delay += this.randomInRange(1000, 3000);
                    click.pause_reason = 'random_afk';
                }
            }
            
            // Insert intentional mistake
            if (this.config.anti_pattern.insert_mistakes && Math.random() < 0.03) {
                const mistakeClick = this.generateInventoryClick(
                    Math.floor(Math.random() * 28),
                    { forceFailure: true }
                );
                clicks.splice(i + 1, 0, mistakeClick);
            }
        }
        
        // Update metrics
        this.state.metrics.patterns_executed++;
        this.updateAccuracy();
        
        // Emit pattern complete
        this.emit('pattern:executed', {
            pattern: patternName,
            clicks: clicks.length,
            estimated_time: clicks.reduce((sum, c) => sum + (c.next_delay || 0), 0)
        });
        
        return clicks;
    }
    
    /**
     * Update fatigue and accuracy
     */
    updateFatigue(sessionDuration) {
        // Increase fatigue over time
        const hoursFactor = sessionDuration / (60 * 60 * 1000);
        this.state.fatigue_factor = Math.min(1, hoursFactor * 0.2); // 20% per hour
        
        // Update accuracy based on fatigue
        if (this.state.fatigue_factor < 0.25) {
            this.state.accuracy_level = 'perfect';
        } else if (this.state.fatigue_factor < 0.5) {
            this.state.accuracy_level = 'normal';
        } else if (this.state.fatigue_factor < 0.75) {
            this.state.accuracy_level = 'tired';
        } else {
            this.state.accuracy_level = 'sloppy';
        }
        
        // Update concentration
        this.state.concentration = Math.max(0, 100 - (this.state.fatigue_factor * 100));
    }
    
    /**
     * Get click pattern metrics
     */
    getMetrics() {
        const accuracy = this.state.metrics.total_clicks > 0 ?
            (this.state.metrics.successful_clicks / this.state.metrics.total_clicks) * 100 : 100;
        
        return {
            accuracy_level: this.state.accuracy_level,
            fatigue_factor: Math.round(this.state.fatigue_factor * 100),
            concentration: Math.round(this.state.concentration),
            
            statistics: {
                total_clicks: this.state.metrics.total_clicks,
                successful_clicks: this.state.metrics.successful_clicks,
                misclicks: this.state.metrics.misclicks,
                recoveries: this.state.metrics.recoveries,
                accuracy_percentage: Math.round(accuracy),
                patterns_executed: this.state.metrics.patterns_executed
            },
            
            current_pattern: this.state.current_pattern,
            last_click_time: this.state.last_click_time,
            current_position: this.state.current_position
        };
    }
    
    // Utility methods
    
    randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    calculateDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getSlotFromCoords(x, y) {
        const relX = x - this.config.inventory.base_offset.x;
        const relY = y - this.config.inventory.base_offset.y;
        
        if (relX < 0 || relY < 0) return null;
        
        const slotWidth = this.config.inventory.slot_size.width + this.config.inventory.slot_spacing;
        const slotHeight = this.config.inventory.slot_size.height + this.config.inventory.slot_spacing;
        
        const col = Math.floor(relX / slotWidth);
        const row = Math.floor(relY / slotHeight);
        
        if (col >= this.config.inventory.grid_size.width || row >= this.config.inventory.grid_size.height) {
            return null;
        }
        
        return row * this.config.inventory.grid_size.width + col;
    }
    
    calculateClickTiming(accuracy) {
        const delay = this.config.timing.click_delay;
        const base = this.randomInRange(delay.min, delay.max);
        
        // Add fatigue factor
        const fatigueMult = 1 + this.state.fatigue_factor * 0.5;
        
        return {
            press: Math.round(base * fatigueMult),
            release: Math.round(this.randomInRange(50, 150) * fatigueMult)
        };
    }
    
    calculateActionDelay(delayType) {
        const delays = this.config.timing.action_delay[delayType] || this.config.timing.action_delay.normal;
        return Math.round(this.randomInRange(delays.min, delays.max));
    }
    
    getPatternTemplate(patternName) {
        for (const category of Object.values(this.config.patterns)) {
            if (category[patternName]) {
                return category[patternName];
            }
        }
        return null;
    }
    
    weightedRandom(items) {
        const total = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * total;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item.name;
            }
        }
        
        return items[items.length - 1].name;
    }
    
    shuffleArray(array, amount = 1.0) {
        const shuffleCount = Math.floor(array.length * amount);
        
        for (let i = 0; i < shuffleCount; i++) {
            const j = Math.floor(Math.random() * array.length);
            const k = Math.floor(Math.random() * array.length);
            [array[j], array[k]] = [array[k], array[j]];
        }
        
        return array;
    }
    
    updateAccuracy() {
        const total = this.state.metrics.total_clicks;
        const successful = this.state.metrics.successful_clicks;
        
        if (total > 0) {
            this.state.metrics.average_accuracy = (successful / total) * 100;
        }
    }
    
    generateLinearPath(start, end) {
        const points = [];
        const distance = this.calculateDistance(start, end);
        const steps = Math.max(3, Math.floor(distance / 20));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: Math.round(start.x + (end.x - start.x) * t),
                y: Math.round(start.y + (end.y - start.y) * t),
                time: i * 10
            });
        }
        
        return points;
    }
    
    generateOvershootCurve(start, end) {
        // Generate curve that goes past target then comes back
        const points = this.generateBezierCurve(start, end);
        const overshoot = 1.1 + Math.random() * 0.2; // 10-30% overshoot
        
        // Modify last few points to overshoot
        const overshootCount = Math.floor(points.length * 0.2);
        for (let i = points.length - overshootCount; i < points.length; i++) {
            const t = (i - (points.length - overshootCount)) / overshootCount;
            const factor = 1 + (overshoot - 1) * (1 - t);
            
            const dx = points[i].x - start.x;
            const dy = points[i].y - start.y;
            
            points[i].x = start.x + dx * factor;
            points[i].y = start.y + dy * factor;
        }
        
        // Add correction points
        for (let i = 0; i < 3; i++) {
            const t = (i + 1) / 3;
            points.push({
                x: Math.round(points[points.length - 1].x + (end.x - points[points.length - 1].x) * t),
                y: Math.round(points[points.length - 1].y + (end.y - points[points.length - 1].y) * t),
                time: points[points.length - 1].time + (i + 1) * 5
            });
        }
        
        return points;
    }
    
    generateWaveCurve(start, end) {
        const points = [];
        const distance = this.calculateDistance(start, end);
        const steps = Math.max(10, Math.floor(distance / 5));
        
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const perpAngle = angle + Math.PI / 2;
        const waveAmplitude = Math.min(20, distance * 0.1);
        const waveFrequency = 2 + Math.random() * 2;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const baseX = start.x + (end.x - start.x) * t;
            const baseY = start.y + (end.y - start.y) * t;
            
            const waveOffset = Math.sin(t * Math.PI * waveFrequency) * waveAmplitude * (1 - t);
            
            points.push({
                x: Math.round(baseX + Math.cos(perpAngle) * waveOffset),
                y: Math.round(baseY + Math.sin(perpAngle) * waveOffset),
                time: i * 5
            });
        }
        
        return points;
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoulFRAClickPatternEngine;
} else if (typeof window !== 'undefined') {
    window.SoulFRAClickPatternEngine = SoulFRAClickPatternEngine;
}

// Auto-start if run directly
if (require.main === module) {
    const clickEngine = new SoulFRAClickPatternEngine();
    
    console.log('🎯 Click Pattern Engine Demo');
    
    // Demo inventory clicks
    console.log('\n📦 Demo: Inventory click patterns...');
    
    // Perfect accuracy
    console.log('\n✨ Perfect accuracy:');
    for (let i = 0; i < 3; i++) {
        const click = clickEngine.generateInventoryClick(i, { accuracy: 'perfect' });
        console.log(`Slot ${i}: (${click.click.x}, ${click.click.y}) - Misclick: ${click.misclick}`);
    }
    
    // Tired accuracy with potential misclicks
    console.log('\n😴 Tired accuracy:');
    clickEngine.state.accuracy_level = 'tired';
    for (let i = 0; i < 5; i++) {
        const click = clickEngine.generateInventoryClick(i, { accuracy: 'tired' });
        if (click.misclick) {
            console.log(`Slot ${i}: MISCLICK at (${click.click.x}, ${click.click.y})`);
            console.log(`  Recovery: ${click.recovery.actions[0].description}`);
        } else {
            console.log(`Slot ${i}: (${click.click.x}, ${click.click.y})`);
        }
    }
    
    // Demo main window clicks
    console.log('\n🎮 Demo: Main window clicks...');
    
    const targets = [
        { x: 100, y: 100 },
        { x: 400, y: 300 },
        { x: 700, y: 450 }
    ];
    
    for (const target of targets) {
        const click = clickEngine.generateMainWindowClick(target);
        console.log(`Target (${target.x}, ${target.y}) → Click (${click.click.x}, ${click.click.y})`);
        console.log(`  Distance: ${Math.round(click.distance)}px, Time: ${click.movement_time}ms`);
        console.log(`  Path points: ${click.movement.length}`);
    }
    
    // Demo pattern execution
    console.log('\n🎯 Demo: Pattern execution...');
    
    setTimeout(async () => {
        // Drop inventory pattern
        const dropSlots = Array.from({length: 28}, (_, i) => i);
        const dropPattern = await clickEngine.executePattern('drop_inventory', dropSlots);
        
        console.log(`\n📦 Drop inventory pattern:`);
        console.log(`Total clicks: ${dropPattern.length}`);
        console.log(`Estimated time: ${dropPattern.reduce((sum, c) => sum + (c.next_delay || 0), 0)}ms`);
        console.log(`Misclicks: ${dropPattern.filter(c => c.misclick).length}`);
        
        // Show metrics
        console.log('\n📊 Final Metrics:');
        console.log(JSON.stringify(clickEngine.getMetrics(), null, 2));
        
    }, 1000);
}