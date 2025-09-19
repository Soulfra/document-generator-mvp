#!/usr/bin/env node

/**
 * 🎮 GAMEPAD COMBO ATTACK SYSTEM
 * Controller-based gameplay for RuneScape-style raids
 * ASIC-optimized pattern matching with live streaming
 */

const EventEmitter = require('events');
const WebSocket = require('ws');

class GamepadComboSystem extends EventEmitter {
    constructor() {
        super();
        
        this.port = 7779;
        this.wsPort = 7780;
        
        // Active gamepads
        this.gamepads = new Map();
        this.activeControllers = [];
        
        // Combo registry
        this.combos = new Map();
        this.activeCombo = null;
        this.comboBuffer = [];
        this.comboTimeout = null;
        
        // ASIC-style optimization
        this.optimizationPatterns = new Map();
        this.executionCache = new Map();
        
        // Live streaming
        this.streamingSessions = new Map();
        this.colorCoding = {
            movement: '#00ff00',
            combat: '#ff0000',
            prayer: '#ffff00',
            magic: '#00ffff',
            special: '#ff00ff',
            inventory: '#ffa500'
        };
        
        // Game state
        this.gameState = {
            player: {
                health: 99,
                prayer: 99,
                specialAttack: 100,
                position: { x: 0, y: 0 },
                target: null
            },
            raid: {
                boss: null,
                phase: 1,
                mechanics: []
            },
            rotation: {
                current: null,
                queue: [],
                effectiveness: 100
            }
        };
        
        // Statistics
        this.stats = {
            combosExecuted: 0,
            perfectTimings: 0,
            dps: 0,
            apm: 0,
            efficiency: 100,
            startTime: Date.now()
        };
        
        console.log('🎮 Gamepad Combo System initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Setup combo patterns
        this.setupCombos();
        
        // Initialize gamepad API
        this.initializeGamepadAPI();
        
        // Start optimization engine
        this.startOptimizationEngine();
        
        // Setup WebSocket for streaming
        this.setupWebSocketServer();
        
        // Start monitoring
        this.startGamepadMonitoring();
        
        console.log('✅ Gamepad Combo System ready!');
    }
    
    setupCombos() {
        // Basic movement combos
        this.registerCombo('dodge-roll', ['A', 'A'], () => {
            this.executeAction('dodge', { direction: this.getStickDirection() });
        });
        
        // RuneScape-style prayer flicking
        this.registerCombo('prayer-flick', ['RB', 'RB'], () => {
            this.executeAction('prayer-toggle', { quick: true });
        });
        
        // DPS rotation for raids
        this.registerCombo('dps-rotation', ['X', 'Y', 'B', 'RT'], () => {
            this.executeRotation('optimal-dps', {
                weapons: ['scythe', 'tbow', 'sang'],
                prayers: ['piety', 'rigour', 'augury']
            });
        });
        
        // Special attack combos
        this.registerCombo('spec-dump', ['LT', 'RT', 'RT'], () => {
            this.executeAction('special-attack', { 
                weapon: this.gameState.player.weapon,
                dump: true 
            });
        });
        
        // Inventory management
        this.registerCombo('quick-eat', ['LB', 'A'], () => {
            this.executeAction('eat-food', { slot: 1 });
        });
        
        this.registerCombo('brew-restore', ['LB', 'X', 'Y'], () => {
            this.executeSequence([
                { action: 'drink', item: 'sara-brew' },
                { action: 'drink', item: 'super-restore' }
            ]);
        });
        
        // Content Generation Combos
        this.registerCombo('content-gacha', ['START', 'A', 'A'], () => {
            this.executeAction('content-generation', { 
                type: 'gacha',
                rarity: 'random',
                category: 'any'
            });
        });
        
        this.registerCombo('quick-content', ['LB', 'RB'], () => {
            this.executeAction('content-generation', { 
                type: 'quick',
                template: 'auto-detect'
            });
        });
        
        this.registerCombo('epic-content', ['START', 'LT', 'RT', 'A'], () => {
            this.executeAction('content-generation', { 
                type: 'gacha',
                rarity: 'epic',
                category: 'premium'
            });
        });
        
        // Advanced raid mechanics
        this.registerCombo('cox-olm-head', ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A'], () => {
            this.executeRaidMechanic('olm-head-phase', {
                pattern: 'mage-hand-control',
                optimization: 'max-efficiency'
            });
        });
        
        // ToB Verzik P2 optimization
        this.registerCombo('verzik-web-dodge', ['LS-ROTATE', 'A', 'A'], () => {
            this.executeRaidMechanic('verzik-web-pattern', {
                dodge: 'optimal-path',
                dps: 'maintain'
            });
        });
        
        // Inferno wave management
        this.registerCombo('inferno-blob-flick', ['RB', 'LB', 'RB', 'LB'], () => {
            this.executeAction('prayer-switch-pattern', {
                pattern: ['protect-ranged', 'protect-magic'],
                timing: 'tick-perfect'
            });
        });
        
        console.log(`📋 Loaded ${this.combos.size} combo patterns`);
    }
    
    registerCombo(name, pattern, action) {
        this.combos.set(name, {
            pattern,
            action,
            length: pattern.length,
            lastUsed: null,
            useCount: 0,
            efficiency: 100
        });
    }
    
    initializeGamepadAPI() {
        if (typeof window !== 'undefined') {
            // Browser environment
            window.addEventListener('gamepadconnected', (e) => {
                this.onGamepadConnected(e.gamepad);
            });
            
            window.addEventListener('gamepaddisconnected', (e) => {
                this.onGamepadDisconnected(e.gamepad);
            });
        } else {
            // Node.js environment - use node-gamepad or similar
            console.log('🎮 Running in Node.js - WebSocket gamepad bridge required');
        }
    }
    
    onGamepadConnected(gamepad) {
        console.log(`🎮 Gamepad connected: ${gamepad.id}`);
        
        this.gamepads.set(gamepad.index, {
            gamepad,
            state: this.getInitialState(),
            combos: [],
            efficiency: 100
        });
        
        this.activeControllers.push(gamepad.index);
        this.emit('gamepadConnected', gamepad);
        
        // Start monitoring this gamepad
        this.monitorGamepad(gamepad.index);
    }
    
    onGamepadDisconnected(gamepad) {
        console.log(`🎮 Gamepad disconnected: ${gamepad.id}`);
        
        this.gamepads.delete(gamepad.index);
        this.activeControllers = this.activeControllers.filter(i => i !== gamepad.index);
        
        this.emit('gamepadDisconnected', gamepad);
    }
    
    getInitialState() {
        return {
            buttons: new Array(17).fill(false),
            axes: new Array(4).fill(0),
            timestamp: Date.now()
        };
    }
    
    monitorGamepad(index) {
        const monitor = () => {
            if (!this.gamepads.has(index)) return;
            
            const gamepadData = this.gamepads.get(index);
            const gamepad = navigator?.getGamepads?.()?.[index];
            
            if (!gamepad) return;
            
            // Update gamepad reference
            gamepadData.gamepad = gamepad;
            
            // Check for button changes
            this.checkButtonChanges(index, gamepad);
            
            // Check for axis changes (sticks)
            this.checkAxisChanges(index, gamepad);
            
            // Continue monitoring
            requestAnimationFrame(() => monitor());
        };
        
        monitor();
    }
    
    checkButtonChanges(index, gamepad) {
        const gamepadData = this.gamepads.get(index);
        const prevState = gamepadData.state;
        
        gamepad.buttons.forEach((button, i) => {
            const wasPressed = prevState.buttons[i];
            const isPressed = button.pressed;
            
            if (!wasPressed && isPressed) {
                // Button pressed
                this.onButtonPress(index, i);
            } else if (wasPressed && !isPressed) {
                // Button released
                this.onButtonRelease(index, i);
            }
            
            prevState.buttons[i] = isPressed;
        });
    }
    
    checkAxisChanges(index, gamepad) {
        const gamepadData = this.gamepads.get(index);
        const prevState = gamepadData.state;
        const deadzone = 0.15;
        
        gamepad.axes.forEach((value, i) => {
            const prevValue = prevState.axes[i];
            
            // Apply deadzone
            const currentValue = Math.abs(value) < deadzone ? 0 : value;
            const previousValue = Math.abs(prevValue) < deadzone ? 0 : prevValue;
            
            if (currentValue !== previousValue) {
                this.onAxisChange(index, i, currentValue);
            }
            
            prevState.axes[i] = value;
        });
    }
    
    onButtonPress(controllerIndex, buttonIndex) {
        const buttonName = this.getButtonName(buttonIndex);
        console.log(`🎮 [${controllerIndex}] Button pressed: ${buttonName}`);
        
        // Add to combo buffer
        this.addToComboBuffer(buttonName);
        
        // Check for combo matches
        this.checkCombos();
        
        // Update stats
        this.updateAPM();
        
        // Emit event
        this.emit('buttonPress', {
            controller: controllerIndex,
            button: buttonIndex,
            name: buttonName,
            timestamp: Date.now()
        });
    }
    
    onButtonRelease(controllerIndex, buttonIndex) {
        const buttonName = this.getButtonName(buttonIndex);
        
        this.emit('buttonRelease', {
            controller: controllerIndex,
            button: buttonIndex,
            name: buttonName,
            timestamp: Date.now()
        });
    }
    
    onAxisChange(controllerIndex, axisIndex, value) {
        const axisName = this.getAxisName(axisIndex);
        
        // Check for directional inputs
        if (Math.abs(value) > 0.5) {
            const direction = this.getDirectionFromAxis(axisIndex, value);
            if (direction) {
                this.addToComboBuffer(direction);
                this.checkCombos();
            }
        }
        
        this.emit('axisChange', {
            controller: controllerIndex,
            axis: axisIndex,
            name: axisName,
            value,
            timestamp: Date.now()
        });
    }
    
    getButtonName(index) {
        const buttonMap = {
            0: 'A', 1: 'B', 2: 'X', 3: 'Y',
            4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
            8: 'BACK', 9: 'START',
            10: 'LS', 11: 'RS',
            12: '↑', 13: '↓', 14: '←', 15: '→',
            16: 'HOME'
        };
        return buttonMap[index] || `BTN${index}`;
    }
    
    getAxisName(index) {
        const axisMap = {
            0: 'LS-X', 1: 'LS-Y',
            2: 'RS-X', 3: 'RS-Y'
        };
        return axisMap[index] || `AXIS${index}`;
    }
    
    getDirectionFromAxis(axisIndex, value) {
        if (axisIndex === 0) { // Left stick X
            return value > 0 ? '→' : '←';
        } else if (axisIndex === 1) { // Left stick Y
            return value > 0 ? '↓' : '↑';
        }
        return null;
    }
    
    addToComboBuffer(input) {
        this.comboBuffer.push({
            input,
            timestamp: Date.now()
        });
        
        // Keep buffer size limited
        if (this.comboBuffer.length > 20) {
            this.comboBuffer.shift();
        }
        
        // Reset combo timeout
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
        
        this.comboTimeout = setTimeout(() => {
            this.comboBuffer = [];
        }, 1000); // 1 second timeout
    }
    
    checkCombos() {
        const bufferInputs = this.comboBuffer.map(b => b.input);
        
        // Check each registered combo
        for (const [name, combo] of this.combos) {
            if (this.matchesPattern(bufferInputs, combo.pattern)) {
                this.executeCombo(name, combo);
                
                // Clear the matched inputs from buffer
                this.comboBuffer = this.comboBuffer.slice(combo.length);
                break;
            }
        }
    }
    
    matchesPattern(buffer, pattern) {
        if (buffer.length < pattern.length) return false;
        
        // Check if the end of buffer matches the pattern
        const startIndex = buffer.length - pattern.length;
        for (let i = 0; i < pattern.length; i++) {
            if (buffer[startIndex + i] !== pattern[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    executeCombo(name, combo) {
        console.log(`🎯 Executing combo: ${name}`);
        
        // Update stats
        combo.useCount++;
        combo.lastUsed = Date.now();
        this.stats.combosExecuted++;
        
        // Execute the combo action
        combo.action();
        
        // Stream the combo execution
        this.streamComboExecution(name, combo);
        
        // Emit combo event
        this.emit('comboExecuted', {
            name,
            pattern: combo.pattern,
            timestamp: Date.now()
        });
    }
    
    executeAction(action, params = {}) {
        console.log(`⚡ Action: ${action}`, params);
        
        // ASIC-style optimized execution
        const optimized = this.optimizeAction(action, params);
        
        // Update game state
        this.updateGameState(action, optimized);
        
        // Stream the action
        this.streamAction(action, optimized);
        
        // Emit action event
        this.emit('actionExecuted', {
            action,
            params: optimized,
            timestamp: Date.now()
        });
    }
    
    executeRotation(rotationType, params) {
        console.log(`🔄 Starting rotation: ${rotationType}`);
        
        // Get optimal rotation based on current state
        const rotation = this.getOptimalRotation(rotationType, params);
        
        // Queue the rotation
        this.gameState.rotation.current = rotationType;
        this.gameState.rotation.queue = rotation.actions;
        
        // Execute rotation
        this.processRotation();
    }
    
    executeSequence(actions) {
        console.log(`📋 Executing sequence of ${actions.length} actions`);
        
        let delay = 0;
        actions.forEach(action => {
            setTimeout(() => {
                this.executeAction(action.action, action);
            }, delay);
            delay += 600; // Game tick timing
        });
    }
    
    executeRaidMechanic(mechanic, params) {
        console.log(`⚔️ Raid mechanic: ${mechanic}`);
        
        // Get optimized strategy for mechanic
        const strategy = this.getRaidStrategy(mechanic, params);
        
        // Execute the strategy
        this.implementStrategy(strategy);
    }
    
    // ASIC-style optimization
    startOptimizationEngine() {
        // Pre-calculate common patterns
        this.optimizationPatterns.set('prayer-switch', {
            overhead: ['protect-magic', 'protect-ranged', 'protect-melee'],
            offensive: ['piety', 'rigour', 'augury'],
            timing: 600 // 1 game tick
        });
        
        this.optimizationPatterns.set('gear-switch', {
            melee: ['scythe', 'avernic', 'infernal'],
            range: ['tbow', 'anguish', 'assembler'],
            mage: ['sang', 'occult', 'ancestral'],
            timing: 1200 // 2 game ticks
        });
        
        // Start optimization loop
        setInterval(() => {
            this.optimizeCurrentRotation();
        }, 100);
    }
    
    optimizeAction(action, params) {
        // Check cache first
        const cacheKey = `${action}:${JSON.stringify(params)}`;
        if (this.executionCache.has(cacheKey)) {
            return this.executionCache.get(cacheKey);
        }
        
        // Optimize based on action type
        const optimized = { ...params };
        
        switch (action) {
            case 'prayer-toggle':
                optimized.nextPrayer = this.getOptimalPrayer();
                optimized.timing = 'tick-perfect';
                break;
                
            case 'special-attack':
                optimized.target = this.getBestTarget();
                optimized.timing = this.getSpecTiming();
                break;
                
            case 'eat-food':
                optimized.combo = this.getFoodCombo();
                break;
        }
        
        // Cache the result
        this.executionCache.set(cacheKey, optimized);
        
        return optimized;
    }
    
    getOptimalRotation(type, params) {
        // This would connect to your game knowledge base
        const rotations = {
            'optimal-dps': {
                actions: [
                    { action: 'prayer', name: 'piety' },
                    { action: 'attack', style: 'slash' },
                    { action: 'attack', style: 'slash' },
                    { action: 'special', weapon: 'scythe' },
                    { action: 'attack', style: 'slash' }
                ]
            }
        };
        
        return rotations[type] || { actions: [] };
    }
    
    // WebSocket streaming
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            const sessionId = this.generateSessionId();
            console.log(`📡 Streaming client connected: ${sessionId}`);
            
            this.streamingSessions.set(sessionId, {
                ws,
                startTime: Date.now(),
                filters: []
            });
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'init',
                gameState: this.gameState,
                stats: this.stats
            }));
            
            ws.on('close', () => {
                this.streamingSessions.delete(sessionId);
                console.log(`📡 Streaming client disconnected: ${sessionId}`);
            });
        });
        
        console.log(`📡 WebSocket streaming on port ${this.wsPort}`);
    }
    
    streamComboExecution(name, combo) {
        const message = {
            type: 'combo',
            name,
            pattern: combo.pattern,
            stats: {
                useCount: combo.useCount,
                efficiency: combo.efficiency
            },
            color: this.getComboColor(name),
            timestamp: Date.now()
        };
        
        this.broadcast(message);
    }
    
    streamAction(action, params) {
        const message = {
            type: 'action',
            action,
            params,
            gameState: this.gameState,
            color: this.getActionColor(action),
            timestamp: Date.now()
        };
        
        this.broadcast(message);
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        
        this.streamingSessions.forEach((session) => {
            if (session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(data);
            }
        });
    }
    
    getComboColor(comboName) {
        if (comboName.includes('prayer')) return this.colorCoding.prayer;
        if (comboName.includes('spec')) return this.colorCoding.special;
        if (comboName.includes('dps')) return this.colorCoding.combat;
        return this.colorCoding.movement;
    }
    
    getActionColor(action) {
        if (action.includes('prayer')) return this.colorCoding.prayer;
        if (action.includes('attack') || action.includes('special')) return this.colorCoding.combat;
        if (action.includes('eat') || action.includes('drink')) return this.colorCoding.inventory;
        return this.colorCoding.movement;
    }
    
    // Monitoring and stats
    updateAPM() {
        const now = Date.now();
        const minutesElapsed = (now - this.stats.startTime) / 60000;
        
        if (minutesElapsed > 0) {
            this.stats.apm = Math.floor(this.stats.combosExecuted / minutesElapsed);
        }
    }
    
    getStickDirection() {
        // Get current left stick direction
        const gamepad = this.gamepads.values().next().value?.gamepad;
        if (!gamepad) return 'north';
        
        const x = gamepad.axes[0];
        const y = gamepad.axes[1];
        
        // Convert to 8-directional
        const angle = Math.atan2(y, x) * 180 / Math.PI;
        
        if (angle >= -22.5 && angle < 22.5) return 'east';
        if (angle >= 22.5 && angle < 67.5) return 'southeast';
        if (angle >= 67.5 && angle < 112.5) return 'south';
        if (angle >= 112.5 && angle < 157.5) return 'southwest';
        if (angle >= 157.5 || angle < -157.5) return 'west';
        if (angle >= -157.5 && angle < -112.5) return 'northwest';
        if (angle >= -112.5 && angle < -67.5) return 'north';
        if (angle >= -67.5 && angle < -22.5) return 'northeast';
        
        return 'north';
    }
    
    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }
    
    // For Node.js testing
    startGamepadMonitoring() {
        if (typeof window === 'undefined') {
            console.log('🎮 Starting virtual gamepad monitoring...');
            
            // Simulate gamepad inputs for testing
            this.simulateGamepad();
        }
    }
    
    simulateGamepad() {
        // Simulate a connected gamepad
        const virtualGamepad = {
            id: 'Xbox Controller (Virtual)',
            index: 0,
            buttons: new Array(17).fill({ pressed: false, value: 0 }),
            axes: [0, 0, 0, 0],
            connected: true
        };
        
        this.onGamepadConnected(virtualGamepad);
        
        // Simulate some test inputs
        setTimeout(() => {
            console.log('🎮 Simulating DPS rotation combo...');
            this.simulateCombo(['X', 'Y', 'B', 'RT']);
        }, 2000);
        
        setTimeout(() => {
            console.log('🎮 Simulating prayer flick...');
            this.simulateCombo(['RB', 'RB']);
        }, 4000);
    }
    
    simulateCombo(pattern) {
        pattern.forEach((button, index) => {
            setTimeout(() => {
                this.onButtonPress(0, this.getButtonIndex(button));
                setTimeout(() => {
                    this.onButtonRelease(0, this.getButtonIndex(button));
                }, 50);
            }, index * 150);
        });
    }
    
    getButtonIndex(name) {
        const reverseMap = {
            'A': 0, 'B': 1, 'X': 2, 'Y': 3,
            'LB': 4, 'RB': 5, 'LT': 6, 'RT': 7
        };
        return reverseMap[name] || 0;
    }
    
    // Game state management
    updateGameState(action, params) {
        switch (action) {
            case 'prayer-toggle':
                // Toggle prayer logic
                break;
                
            case 'special-attack':
                this.gameState.player.specialAttack = Math.max(0, this.gameState.player.specialAttack - 50);
                break;
                
            case 'eat-food':
                this.gameState.player.health = Math.min(99, this.gameState.player.health + 20);
                break;
                
            case 'content-generation':
                this.executeContentGeneration(params);
                break;
        }
    }
    
    processRotation() {
        if (this.gameState.rotation.queue.length === 0) {
            this.gameState.rotation.current = null;
            return;
        }
        
        const nextAction = this.gameState.rotation.queue.shift();
        this.executeAction(nextAction.action, nextAction);
        
        // Continue rotation
        setTimeout(() => {
            this.processRotation();
        }, 600); // 1 game tick
    }
    
    optimizeCurrentRotation() {
        if (!this.gameState.rotation.current) return;
        
        // Analyze current effectiveness
        const efficiency = this.calculateRotationEfficiency();
        this.gameState.rotation.effectiveness = efficiency;
        
        // Adjust if needed
        if (efficiency < 80) {
            console.log('⚡ Optimizing rotation for better efficiency...');
            // Implement rotation adjustments
        }
    }
    
    calculateRotationEfficiency() {
        // Simplified efficiency calculation
        return Math.floor(Math.random() * 20 + 80);
    }
    
    getOptimalPrayer() {
        // Simplified prayer selection
        return 'piety';
    }
    
    getBestTarget() {
        // Target selection logic
        return this.gameState.raid.boss || 'nearest-enemy';
    }
    
    getSpecTiming() {
        // Calculate optimal special attack timing
        return 'next-tick';
    }
    
    getFoodCombo() {
        // Optimal food combination
        return ['shark', 'karambwan'];
    }
    
    getRaidStrategy(mechanic, params) {
        // Raid-specific strategies
        return {
            mechanic,
            actions: [],
            timing: 'precise'
        };
    }
    
    implementStrategy(strategy) {
        console.log(`📋 Implementing strategy for ${strategy.mechanic}`);
        // Execute the strategy
    }
    
    // Content Generation Integration
    async executeContentGeneration(params) {
        console.log(`🎁 Content Generation triggered via gamepad combo!`);
        console.log(`   Type: ${params.type}`);
        console.log(`   Rarity: ${params.rarity || 'default'}`);
        console.log(`   Category: ${params.category || 'general'}`);
        
        try {
            // Send request to unified debugger for content generation
            const response = await fetch('http://localhost:7777/api/content/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: params.type,
                    rarity: params.rarity,
                    category: params.category,
                    source: 'gamepad-combo'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`🎉 Content generation successful!`);
                console.log(`   Thread ID: ${result.threadId}`);
                
                // Stream the content generation event
                this.streamContentGeneration(params, result);
                
                // Achievement unlocking for content generation
                if (params.rarity === 'epic' || params.rarity === 'legendary') {
                    console.log(`🏆 Achievement unlocked: Epic Content Creator!`);
                }
                
            } else {
                console.error(`❌ Content generation failed: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error(`❌ Content generation error:`, error.message);
        }
    }
    
    streamContentGeneration(params, result) {
        const message = {
            type: 'content-generation',
            params,
            result,
            timestamp: Date.now(),
            color: this.getContentColor(params.type),
            animation: 'sparkle'
        };
        
        this.broadcast(message);
    }
    
    getContentColor(type) {
        switch (type) {
            case 'gacha': return '#ff6b6b';
            case 'quick': return '#4ecdc4';
            case 'epic': return '#feca57';
            default: return '#48dbfb';
        }
    }
}

// Export for use
module.exports = GamepadComboSystem;

// Run if called directly
if (require.main === module) {
    const comboSystem = new GamepadComboSystem();
    
    console.log(`
🎮 GAMEPAD COMBO ATTACK SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Controller-based RuneScape gameplay
⚡ ASIC-optimized combo execution
📡 Live streaming with color coding
🔄 Automated DPS rotations

WebSocket Stream: ws://localhost:7780

Example Combos:
  • Prayer Flick: RB, RB
  • DPS Rotation: X, Y, B, RT
  • Special Attack: LT, RT, RT
  • Dodge Roll: A, A
  • Content Gacha: START, A, A
  • Quick Content: LB, RB
  • Epic Content: START, LT, RT, A

Ready for controller input!
    `);
}