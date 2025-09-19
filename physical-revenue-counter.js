#!/usr/bin/env node

/**
 * 💰🔧 PHYSICAL REVENUE COUNTER SYSTEM
 * Hardware-driven revenue display with servo counters and LED indicators
 * Shows real-time bits, tokens, coins, and revenue statistics
 */

const HardwareOrchestrator = require('./hardware-orchestrator.js');
const EventEmitter = require('events');

class PhysicalRevenueCounter extends EventEmitter {
    constructor() {
        super();
        
        this.hardware = new HardwareOrchestrator();
        
        // Revenue tracking state
        this.revenueState = {
            totalRevenue: 0,
            bits: 0,
            tokens: 0,
            coins: 0,
            shards: 0,
            lastUpdate: Date.now(),
            displayMode: 'total' // 'total', 'bits', 'tokens', 'coins', 'cycle'
        };
        
        // Physical counter configuration
        this.counters = {
            // Each counter has a servo that can display 0-999
            total_revenue: {
                servo: 'servo_1',
                pin: 9,
                position: 90,      // Current servo position (0-180)
                value: 0,          // Current displayed value
                maxValue: 999,     // Maximum displayable value
                ledPin: 2,         // Status LED pin
                color: 'green'     // LED color for this counter
            },
            currency_display: {
                servo: 'servo_2', 
                pin: 10,
                position: 90,
                value: 0,
                maxValue: 999,
                ledPin: 3,
                color: 'blue'
            },
            rate_display: {
                servo: 'servo_3',
                pin: 11, 
                position: 90,
                value: 0,
                maxValue: 100,    // Revenue per minute
                ledPin: 4,
                color: 'orange'
            }
        };
        
        // Display cycling for currency counter
        this.currencyDisplayCycle = ['bits', 'tokens', 'coins', 'shards'];
        this.currentCurrencyIndex = 0;
        this.cycleDuration = 5000; // 5 seconds per currency
        
        // Animation state
        this.animations = new Map(); // counterId -> animationState
        
        this.initializeCounters();
        console.log('💰 Physical Revenue Counter initialized');
    }
    
    async initializeCounters() {
        console.log('🔧 Initializing physical revenue counters...');
        
        try {
            // Initialize all servos to center position
            for (const [counterId, config] of Object.entries(this.counters)) {
                await this.initializeCounter(counterId, config);
            }
            
            // Start display cycling for currency counter
            this.startCurrencyDisplayCycle();
            
            // Start rate calculation
            this.startRevenueRateCalculation();
            
            // Startup sequence
            await this.performStartupSequence();
            
            console.log('✅ All revenue counters initialized successfully');
            
        } catch (error) {
            console.error('❌ Counter initialization failed:', error.message);
        }
    }
    
    async initializeCounter(counterId, config) {
        console.log(`🔧 Initializing counter: ${counterId}`);
        
        // Set servo to center position
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'SERVO_MOVE',
            commandParams: {
                pin: config.pin,
                angle: 90,
                duration: 1000
            }
        });
        
        // Initialize status LED
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*', 
            command: 'LED_SET',
            commandParams: {
                pin: config.ledPin,
                color: config.color,
                brightness: 100
            }
        });
        
        config.position = 90;
        config.value = 0;
    }
    
    async performStartupSequence() {
        console.log('🚀 Performing counter startup sequence...');
        
        // Sweep all counters from 0 to max to 0
        const sweepPromises = Object.entries(this.counters).map(async ([counterId, config]) => {
            // Sweep to maximum
            await this.animateCounterTo(counterId, config.maxValue, 2000);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Sweep back to zero  
            await this.animateCounterTo(counterId, 0, 2000);
        });
        
        await Promise.all(sweepPromises);
        
        // Flash all LEDs
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_FLASH',
            commandParams: {
                color: 'white',
                count: 3,
                duration: 200
            }
        });
        
        console.log('✨ Counter startup sequence completed');
    }
    
    // Main update methods
    async updateRevenue(revenueData) {
        const previousState = { ...this.revenueState };
        
        // Update internal state
        if (revenueData.totalRevenue !== undefined) {
            this.revenueState.totalRevenue = revenueData.totalRevenue;
        }
        if (revenueData.bits !== undefined) {
            this.revenueState.bits = revenueData.bits;
        }
        if (revenueData.tokens !== undefined) {
            this.revenueState.tokens = revenueData.tokens;
        }
        if (revenueData.coins !== undefined) {
            this.revenueState.coins = revenueData.coins;
        }
        if (revenueData.shards !== undefined) {
            this.revenueState.shards = revenueData.shards;
        }
        
        this.revenueState.lastUpdate = Date.now();
        
        // Update physical displays
        await this.updatePhysicalDisplays(previousState);
        
        // Emit update event
        this.emit('revenue_updated', {
            previous: previousState,
            current: this.revenueState,
            changes: this.calculateChanges(previousState, this.revenueState)
        });
        
        console.log(`💰 Revenue updated: $${this.revenueState.totalRevenue}`)
    }
    
    async updatePhysicalDisplays(previousState) {
        const promises = [];
        
        // Update total revenue counter
        if (previousState.totalRevenue !== this.revenueState.totalRevenue) {
            promises.push(
                this.updateTotalRevenueDisplay()
            );
        }
        
        // Update currency display (if it's showing the changed currency)
        const currentCurrency = this.currencyDisplayCycle[this.currentCurrencyIndex];
        if (previousState[currentCurrency] !== this.revenueState[currentCurrency]) {
            promises.push(
                this.updateCurrencyDisplay()
            );
        }
        
        // Update rate display
        promises.push(
            this.updateRevenueRateDisplay()
        );
        
        await Promise.all(promises);
    }
    
    async updateTotalRevenueDisplay() {
        const counter = this.counters.total_revenue;
        const displayValue = Math.min(this.revenueState.totalRevenue, counter.maxValue);
        
        // Animate to new value
        await this.animateCounterTo('total_revenue', displayValue, 1000);
        
        // Flash green LED for revenue increase
        if (displayValue > counter.value) {
            await this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'LED_FLASH',
                commandParams: {
                    pin: counter.ledPin,
                    color: 'green',
                    count: 2,
                    duration: 150
                }
            });
        }
    }
    
    async updateCurrencyDisplay() {
        const currentCurrency = this.currencyDisplayCycle[this.currentCurrencyIndex];
        const value = this.revenueState[currentCurrency];
        const counter = this.counters.currency_display;
        
        const displayValue = Math.min(value, counter.maxValue);
        
        // Animate to new value
        await this.animateCounterTo('currency_display', displayValue, 800);
        
        // Set LED color based on currency type
        const currencyColors = {
            'bits': 'blue',
            'tokens': 'gold', 
            'coins': 'orange',
            'shards': 'purple'
        };
        
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_SET', 
            commandParams: {
                pin: counter.ledPin,
                color: currencyColors[currentCurrency] || 'white',
                brightness: 150
            }
        });
    }
    
    async updateRevenueRateDisplay() {
        const rate = this.calculateRevenueRate();
        const counter = this.counters.rate_display;
        
        const displayValue = Math.min(rate, counter.maxValue);
        
        // Animate to new rate
        await this.animateCounterTo('rate_display', displayValue, 600);
        
        // LED intensity based on rate
        const intensity = Math.min(255, rate * 5);
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_SET',
            commandParams: {
                pin: counter.ledPin,
                color: 'orange',
                brightness: intensity
            }
        });
    }
    
    async animateCounterTo(counterId, targetValue, duration) {
        const counter = this.counters[counterId];
        const startValue = counter.value;
        const valueChange = targetValue - startValue;
        
        if (valueChange === 0) return; // No change needed
        
        // Cancel any existing animation
        if (this.animations.has(counterId)) {
            clearInterval(this.animations.get(counterId));
        }
        
        console.log(`📊 Animating ${counterId}: ${startValue} → ${targetValue} over ${duration}ms`);
        
        const startTime = Date.now();
        const steps = Math.min(Math.abs(valueChange), 20); // Max 20 animation steps
        const stepDuration = duration / steps;
        
        return new Promise((resolve) => {
            let currentStep = 0;
            
            const animationInterval = setInterval(async () => {
                currentStep++;
                const progress = Math.min(currentStep / steps, 1);
                
                // Eased animation (ease-out)
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.round(startValue + (valueChange * easedProgress));
                
                // Convert value to servo angle (0-999 maps to 0-180 degrees)
                const angle = this.valueToServoAngle(currentValue, counter.maxValue);
                
                // Move servo
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: 'SERVO_MOVE',
                    commandParams: {
                        pin: counter.pin,
                        angle: angle,
                        duration: stepDuration * 0.8 // Slightly faster than step duration
                    }
                });
                
                counter.value = currentValue;
                counter.position = angle;
                
                if (progress >= 1) {
                    clearInterval(animationInterval);
                    this.animations.delete(counterId);
                    resolve();
                }
            }, stepDuration);
            
            this.animations.set(counterId, animationInterval);
        });
    }
    
    valueToServoAngle(value, maxValue) {
        // Map value (0 to maxValue) to servo angle (0 to 180 degrees)
        return Math.round((value / maxValue) * 180);
    }
    
    // Display cycling and rate calculation
    startCurrencyDisplayCycle() {
        setInterval(async () => {
            // Move to next currency in cycle
            this.currentCurrencyIndex = (this.currentCurrencyIndex + 1) % this.currencyDisplayCycle.length;
            
            // Update display
            await this.updateCurrencyDisplay();
            
            console.log(`🔄 Currency display cycled to: ${this.currencyDisplayCycle[this.currentCurrencyIndex]}`);
            
        }, this.cycleDuration);
    }
    
    startRevenueRateCalculation() {
        let previousRevenue = this.revenueState.totalRevenue;
        let previousTime = Date.now();
        
        setInterval(() => {
            const currentRevenue = this.revenueState.totalRevenue;
            const currentTime = Date.now();
            
            const timeDelta = currentTime - previousTime;
            const revenueDelta = currentRevenue - previousRevenue;
            
            if (timeDelta > 0) {
                // Calculate revenue per minute
                const rate = (revenueDelta / timeDelta) * 60000;
                this.revenueState.revenueRate = Math.max(0, rate);
            }
            
            previousRevenue = currentRevenue;
            previousTime = currentTime;
            
        }, 10000); // Update every 10 seconds
    }
    
    calculateRevenueRate() {
        return Math.round(this.revenueState.revenueRate || 0);
    }
    
    calculateChanges(previous, current) {
        const changes = {};
        
        for (const key of ['totalRevenue', 'bits', 'tokens', 'coins', 'shards']) {
            if (previous[key] !== current[key]) {
                changes[key] = {
                    from: previous[key],
                    to: current[key],
                    delta: current[key] - previous[key]
                };
            }
        }
        
        return changes;
    }
    
    // Special effect methods
    async triggerRevenueBonus(amount, currency = 'totalRevenue') {
        console.log(`🎉 Revenue bonus triggered: +${amount} ${currency}`);
        
        // Flash all LEDs
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_FLASH',
            commandParams: {
                color: 'gold',
                count: 5,
                duration: 100
            }
        });
        
        // Play bonus sound
        const bonusTones = [1000, 1200, 1500, 2000];
        for (let i = 0; i < bonusTones.length; i++) {
            setTimeout(async () => {
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: 'BUZZER_BEEP',
                    commandParams: {
                        frequency: bonusTones[i],
                        duration: 200
                    }
                });
            }, i * 150);
        }
        
        // Update revenue
        const updateData = { [currency]: this.revenueState[currency] + amount };
        if (currency !== 'totalRevenue') {
            updateData.totalRevenue = this.revenueState.totalRevenue + (amount * this.getCurrencyValue(currency));
        }
        
        await this.updateRevenue(updateData);
    }
    
    async triggerMilestone(milestone) {
        console.log(`🏆 Milestone reached: ${milestone}`);
        
        // Epic milestone sequence
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_RAINBOW',
            commandParams: {
                duration: 8000,
                brightness: 1.0
            }
        });
        
        // Victory fanfare
        const fanfare = [523, 659, 784, 1047, 1319]; // C major scale
        for (let i = 0; i < fanfare.length; i++) {
            setTimeout(async () => {
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: 'BUZZER_BEEP',
                    commandParams: {
                        frequency: fanfare[i],
                        duration: 400
                    }
                });
            }, i * 200);
        }
        
        // Animate all counters to their values dramatically
        const animationPromises = Object.keys(this.counters).map(counterId => {
            const counter = this.counters[counterId];
            return this.animateCounterTo(counterId, counter.value, 3000);
        });
        
        await Promise.all(animationPromises);
    }
    
    getCurrencyValue(currency) {
        // Exchange rates to convert currency to revenue value
        const exchangeRates = {
            'bits': 0.01,     // 1 bit = $0.01
            'tokens': 1.0,    // 1 token = $1.00
            'coins': 0.001,   // 1 coin = $0.001
            'shards': 10.0    // 1 shard = $10.00
        };
        
        return exchangeRates[currency] || 1.0;
    }
    
    // Manual control methods
    async setDisplayMode(mode) {
        if (['total', 'bits', 'tokens', 'coins', 'cycle'].includes(mode)) {
            this.revenueState.displayMode = mode;
            
            if (mode !== 'cycle') {
                // Stop cycling and show specific currency
                this.currentCurrencyIndex = this.currencyDisplayCycle.indexOf(mode);
                if (this.currentCurrencyIndex === -1) {
                    this.currentCurrencyIndex = 0; // Default to bits
                }
                
                await this.updateCurrencyDisplay();
            }
            
            console.log(`🖥️ Display mode set to: ${mode}`);
        }
    }
    
    async calibrateCounters() {
        console.log('🔧 Calibrating all counters...');
        
        for (const [counterId, config] of Object.entries(this.counters)) {
            // Move to minimum position
            await this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'SERVO_MOVE',
                commandParams: {
                    pin: config.pin,
                    angle: 0,
                    duration: 2000
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            // Move to maximum position
            await this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'SERVO_MOVE',
                commandParams: {
                    pin: config.pin,
                    angle: 180,
                    duration: 2000
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            // Return to center
            await this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'SERVO_MOVE',
                commandParams: {
                    pin: config.pin,
                    angle: 90,
                    duration: 1000
                }
            });
            
            config.position = 90;
            config.value = config.maxValue / 2;
        }
        
        console.log('✅ Counter calibration completed');
    }
    
    // Status and debugging
    getCounterStatus() {
        return {
            revenueState: this.revenueState,
            counters: Object.fromEntries(
                Object.entries(this.counters).map(([id, config]) => [
                    id, 
                    {
                        value: config.value,
                        position: config.position,
                        maxValue: config.maxValue
                    }
                ])
            ),
            currentCurrency: this.currencyDisplayCycle[this.currentCurrencyIndex],
            activeAnimations: this.animations.size,
            hardwareStatus: this.hardware.getHardwareStatus()
        };
    }
    
    async emergencyStop() {
        console.log('🚨 Emergency stop - halting all counter animations');
        
        // Clear all animations
        for (const [counterId, interval] of this.animations) {
            clearInterval(interval);
        }
        this.animations.clear();
        
        // Center all servos
        const centerPromises = Object.entries(this.counters).map(([counterId, config]) =>
            this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'SERVO_MOVE', 
                commandParams: {
                    pin: config.pin,
                    angle: 90,
                    duration: 500
                }
            })
        );
        
        await Promise.all(centerPromises);
        
        // Turn off all LEDs
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_OFF',
            commandParams: { all: true }
        });
        
        this.emit('emergency_stop');
    }
}

module.exports = PhysicalRevenueCounter;