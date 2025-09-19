#!/usr/bin/env node

/**
 * 🎮🔧 HARDWARE ORCHESTRATOR
 * Physical hardware automation bridge for the Revenue MUD
 * Controls real keyboards, custom Arduino boards, and physical devices
 */

const EventEmitter = require('events');

class HardwareOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // Try to load hardware automation libraries
        this.robotjs = this.loadRobotJS();
        this.serialPort = this.loadSerialPort();
        this.johnnyFive = this.loadJohnnyFive();
        
        // Hardware state
        this.devices = new Map(); // deviceId -> DeviceController
        this.activeSequences = new Set(); // Currently running sequences
        
        // Key mapping for game commands
        this.keyMappings = {
            // Movement keys
            'move_north': 'up',
            'move_south': 'down', 
            'move_east': 'right',
            'move_west': 'left',
            'move_w': 'w',
            'move_a': 'a',
            'move_s': 's',
            'move_d': 'd',
            
            // Emacs combinations
            'emacs_save': ['control', 'x', 'control', 's'],
            'emacs_open': ['control', 'x', 'control', 'f'],
            'emacs_quit': ['control', 'x', 'control', 'c'],
            'emacs_search': ['control', 's'],
            'emacs_replace': ['alt', 'shift', '5'],
            'emacs_buffer_list': ['control', 'x', 'control', 'b'],
            'emacs_kill_buffer': ['control', 'x', 'k'],
            'emacs_undo': ['control', 'underscore'],
            
            // Git wrap mechanics (wrong arm reaching)
            'git_commit': ['control', 'x', 'v', 'c'], // Awkward reach
            'git_push': ['control', 'x', 'v', 'p'],   // Cross-body motion
            'git_status': ['control', 'x', 'v', 's'], // Wrong finger positioning
            
            // Boss battle controls
            'attack': 'space',
            'defend': 'shift',
            'special': ['control', 'space'],
            'flee': 'escape',
            
            // Function key combinations
            'f1_combo': ['shift', 'control', 'f1'],
            'f2_combo': ['shift', 'control', 'f2'],
            'f3_combo': ['shift', 'control', 'f3'],
            'debug_combo': ['control', 'shift', 'f12'],
            'developer_tools': ['f12'],
            
            // Custom macros
            'revenue_check': ['control', 'alt', 'r'],
            'stream_toggle': ['control', 'alt', 's'],
            'cal_summon': ['control', 'alt', 'c']
        };
        
        // Arduino command mappings
        this.arduinoCommands = {
            'boss_spawn': { command: 'LED_PULSE', params: { color: 'red', intensity: 255 } },
            'boss_damage': { command: 'LED_FLASH', params: { color: 'orange', count: 3 } },
            'boss_defeat': { command: 'LED_RAINBOW', params: { duration: 5000 } },
            'loot_drop': { command: 'SERVO_MOVE', params: { angle: 90, duration: 1000 } },
            'revenue_gain': { command: 'BUZZER_BEEP', params: { frequency: 1000, duration: 200 } },
            'sonar_ping': { command: 'LED_RING', params: { sweep: true, speed: 500 } }
        };
        
        // Hardware timing constraints
        this.timing = {
            keyDelay: 50,      // Delay between key presses (ms)
            sequenceDelay: 100, // Delay between command sequences (ms)
            arduinoTimeout: 1000, // Arduino command timeout (ms)
            maxConcurrent: 5    // Max concurrent hardware actions
        };
        
        this.initializeHardware();
        console.log('🔧 Hardware Orchestrator initialized');
    }
    
    loadRobotJS() {
        try {
            const robotjs = require('robotjs');
            console.log('✅ RobotJS loaded - keyboard automation available');
            return robotjs;
        } catch (error) {
            console.log('⚠️ RobotJS not available - install with: npm install robotjs');
            return null;
        }
    }
    
    loadSerialPort() {
        try {
            const { SerialPort } = require('serialport');
            console.log('✅ SerialPort loaded - Arduino communication available');
            return SerialPort;
        } catch (error) {
            console.log('⚠️ SerialPort not available - install with: npm install serialport');
            return null;
        }
    }
    
    loadJohnnyFive() {
        try {
            const five = require('johnny-five');
            console.log('✅ Johnny-Five loaded - advanced robotics available');
            return five;
        } catch (error) {
            console.log('⚠️ Johnny-Five not available - install with: npm install johnny-five');
            return null;
        }
    }
    
    async initializeHardware() {
        // Scan for available hardware
        await this.scanForArduinos();
        await this.scanForCustomDevices();
        
        // Initialize discovered devices
        for (const [deviceId, device] of this.devices) {
            try {
                await this.initializeDevice(device);
                console.log(`🔌 Initialized device: ${deviceId}`);
            } catch (error) {
                console.error(`❌ Failed to initialize ${deviceId}:`, error.message);
            }
        }
        
        // Set up hardware monitoring
        this.startHardwareMonitoring();
    }
    
    async scanForArduinos() {
        if (!this.serialPort) return;
        
        try {
            const ports = await this.serialPort.list();
            const arduinoPorts = ports.filter(port => 
                port.manufacturer?.includes('Arduino') ||
                port.manufacturer?.includes('CH340') ||
                port.productId === '7523'
            );
            
            for (const port of arduinoPorts) {
                const deviceId = `arduino_${port.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
                this.devices.set(deviceId, {
                    type: 'arduino',
                    path: port.path,
                    manufacturer: port.manufacturer,
                    connection: null,
                    status: 'discovered'
                });
                
                console.log(`🔍 Found Arduino: ${port.path} (${port.manufacturer})`);
            }
        } catch (error) {
            console.error('Error scanning for Arduinos:', error.message);
        }
    }
    
    async scanForCustomDevices() {
        // Scan for custom USB HID devices, Raspberry Pis, etc.
        // This would be extended based on specific hardware
        
        // Mock custom gaming controller
        this.devices.set('gaming_controller_1', {
            type: 'custom_pcb',
            path: '/dev/ttyUSB1',
            manufacturer: 'Custom Gaming Board',
            connection: null,
            status: 'discovered',
            capabilities: ['led_matrix', 'mechanical_switches', 'servo_control']
        });
        
        console.log('🎮 Mock custom gaming controller discovered');
    }
    
    async initializeDevice(device) {
        switch (device.type) {
            case 'arduino':
                await this.initializeArduino(device);
                break;
            case 'custom_pcb':
                await this.initializeCustomBoard(device);
                break;
        }
    }
    
    async initializeArduino(device) {
        if (!this.serialPort) {
            device.status = 'no_driver';
            return;
        }
        
        try {
            device.connection = new this.serialPort({
                path: device.path,
                baudRate: 9600
            });
            
            await new Promise((resolve, reject) => {
                device.connection.on('open', resolve);
                device.connection.on('error', reject);
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });
            
            device.status = 'connected';
            console.log(`🔌 Arduino connected: ${device.path}`);
            
            // Send initialization command
            await this.sendArduinoCommand(device, 'INIT', { version: '1.0' });
            
        } catch (error) {
            device.status = 'error';
            console.error(`Failed to connect to Arduino ${device.path}:`, error.message);
        }
    }
    
    async initializeCustomBoard(device) {
        // Mock initialization for custom boards
        device.connection = { mockConnection: true };
        device.status = 'connected';
        console.log(`🎮 Custom board initialized: ${device.manufacturer}`);
    }
    
    // Main hardware control methods
    async executePhysicalAction(actionType, params = {}) {
        console.log(`🔧 Executing physical action: ${actionType}`, params);
        
        // Check if we're at max concurrent actions
        if (this.activeSequences.size >= this.timing.maxConcurrent) {
            console.warn('⚠️ Max concurrent actions reached, queuing...');
            await this.waitForSlot();
        }
        
        const sequenceId = `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.activeSequences.add(sequenceId);
        
        try {
            switch (actionType) {
                case 'keyboard_action':
                    await this.executeKeyboardAction(params);
                    break;
                case 'arduino_command':
                    await this.executeArduinoAction(params);
                    break;
                case 'combo_sequence':
                    await this.executeComboSequence(params);
                    break;
                case 'boss_battle_effect':
                    await this.executeBossBattleEffect(params);
                    break;
                default:
                    console.warn(`Unknown action type: ${actionType}`);
            }
        } finally {
            this.activeSequences.delete(sequenceId);
        }
    }
    
    async executeKeyboardAction(params) {
        if (!this.robotjs) {
            console.log('💻 [MOCK] Keyboard action:', params);
            return;
        }
        
        const { keys, action = 'tap' } = params;
        
        if (Array.isArray(keys)) {
            // Key combination
            const modifiers = keys.slice(0, -1);
            const key = keys[keys.length - 1];
            
            console.log(`⌨️ Pressing combination: ${keys.join('+')}`)
            this.robotjs.keyTap(key, modifiers);
        } else {
            // Single key
            console.log(`⌨️ Pressing key: ${keys}`);
            this.robotjs.keyTap(keys);
        }
        
        // Small delay to prevent key spam
        await this.sleep(this.timing.keyDelay);
    }
    
    async executeArduinoAction(params) {
        const { deviceId, command, commandParams } = params;
        const device = this.devices.get(deviceId);
        
        if (!device || device.status !== 'connected') {
            console.log(`🔌 [MOCK] Arduino command to ${deviceId}:`, command, commandParams);
            return;
        }
        
        await this.sendArduinoCommand(device, command, commandParams);
    }
    
    async executeComboSequence(params) {
        const { sequence, timing: customTiming } = params;
        const delay = customTiming?.delay || this.timing.sequenceDelay;
        
        console.log(`🎯 Executing combo sequence: ${sequence.length} actions`);
        
        for (let i = 0; i < sequence.length; i++) {
            const action = sequence[i];
            await this.executePhysicalAction(action.type, action.params);
            
            // Delay between sequence steps (except last)
            if (i < sequence.length - 1) {
                await this.sleep(delay);
            }
        }
    }
    
    async executeBossBattleEffect(params) {
        const { effectType, boss, intensity = 1.0 } = params;
        
        console.log(`⚔️ Boss battle effect: ${effectType} (intensity: ${intensity})`);
        
        // Combine multiple hardware effects for boss battles
        const effects = [];
        
        switch (effectType) {
            case 'spawn':
                effects.push(
                    { type: 'arduino_command', params: { 
                        deviceId: 'arduino_*', 
                        command: 'LED_PULSE', 
                        commandParams: { color: 'red', intensity: Math.floor(255 * intensity) }
                    }},
                    { type: 'keyboard_action', params: { keys: ['control', 'shift', 'f12'] }}
                );
                break;
                
            case 'damage':
                effects.push(
                    { type: 'arduino_command', params: {
                        deviceId: 'gaming_controller_1',
                        command: 'VIBRATE',
                        commandParams: { intensity: intensity * 100, duration: 200 }
                    }},
                    { type: 'keyboard_action', params: { keys: 'space' }}
                );
                break;
                
            case 'victory':
                effects.push(
                    { type: 'arduino_command', params: {
                        deviceId: 'arduino_*',
                        command: 'LED_RAINBOW',
                        commandParams: { duration: 5000, brightness: intensity }
                    }}
                );
                break;
        }
        
        // Execute all effects concurrently
        await Promise.all(effects.map(effect => 
            this.executePhysicalAction(effect.type, effect.params)
        ));
    }
    
    // Game command translation
    async translateGameCommand(gameCommand, gameParams) {
        console.log(`🎮 Translating game command: ${gameCommand}`, gameParams);
        
        switch (gameCommand) {
            case 'move':
                return this.translateMovementCommand(gameParams);
            case 'attack':
                return this.translateCombatCommand('attack', gameParams);
            case 'emacs':
                return this.translateEmacsCommand(gameParams);
            case 'boss_event':
                return this.translateBossEvent(gameParams);
            case 'revenue_change':
                return this.translateRevenueEvent(gameParams);
            default:
                console.warn(`No translation for game command: ${gameCommand}`);
                return null;
        }
    }
    
    async translateMovementCommand(params) {
        const direction = params.direction?.toLowerCase();
        const keyMapping = this.keyMappings[`move_${direction}`];
        
        if (!keyMapping) {
            console.warn(`No key mapping for direction: ${direction}`);
            return null;
        }
        
        return {
            type: 'keyboard_action',
            params: { keys: keyMapping }
        };
    }
    
    async translateEmacsCommand(params) {
        const command = params.command?.toLowerCase().replace(/[^a-z_]/g, '_');
        const keyMapping = this.keyMappings[`emacs_${command}`];
        
        if (!keyMapping) {
            // Try to parse raw emacs command like "C-x C-s"
            const parsedKeys = this.parseEmacsCommand(params.command);
            if (parsedKeys) {
                return { type: 'keyboard_action', params: { keys: parsedKeys } };
            }
            
            console.warn(`No key mapping for emacs command: ${command}`);
            return null;
        }
        
        return {
            type: 'combo_sequence',
            params: {
                sequence: [
                    { type: 'keyboard_action', params: { keys: keyMapping } }
                ]
            }
        };
    }
    
    async translateBossEvent(params) {
        const { eventType, boss } = params;
        
        return {
            type: 'boss_battle_effect',
            params: {
                effectType: eventType,
                boss: boss,
                intensity: boss?.health ? (1 - boss.health / boss.maxHealth) : 1.0
            }
        };
    }
    
    parseEmacsCommand(command) {
        // Parse emacs-style commands like "C-x C-s" into key arrays
        const parts = command.split(/\s+/);
        const keys = [];
        
        for (const part of parts) {
            if (part.startsWith('C-')) {
                keys.push('control', part.substring(2).toLowerCase());
            } else if (part.startsWith('M-')) {
                keys.push('alt', part.substring(2).toLowerCase());
            } else if (part.startsWith('S-')) {
                keys.push('shift', part.substring(2).toLowerCase());
            } else {
                keys.push(part.toLowerCase());
            }
        }
        
        return keys.length > 0 ? keys : null;
    }
    
    // Arduino communication
    async sendArduinoCommand(device, command, params = {}) {
        const message = JSON.stringify({ command, params, timestamp: Date.now() });
        
        if (!device.connection || device.connection.mockConnection) {
            console.log(`🔌 [MOCK] Arduino command:`, message);
            return;
        }
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Arduino command timeout'));
            }, this.timing.arduinoTimeout);
            
            device.connection.write(message + '\n', (error) => {
                clearTimeout(timeout);
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
    
    // Utility methods
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async waitForSlot() {
        while (this.activeSequences.size >= this.timing.maxConcurrent) {
            await this.sleep(50);
        }
    }
    
    startHardwareMonitoring() {
        // Monitor hardware health and status
        setInterval(() => {
            this.checkDeviceHealth();
        }, 5000);
    }
    
    checkDeviceHealth() {
        for (const [deviceId, device] of this.devices) {
            if (device.status === 'connected' && device.connection) {
                // Send ping command to verify connection
                if (!device.connection.mockConnection) {
                    try {
                        this.sendArduinoCommand(device, 'PING');
                    } catch (error) {
                        console.warn(`Device health check failed for ${deviceId}`);
                        device.status = 'error';
                    }
                }
            }
        }
    }
    
    // Public API methods
    getConnectedDevices() {
        return Array.from(this.devices.entries())
            .filter(([id, device]) => device.status === 'connected')
            .map(([id, device]) => ({
                id,
                type: device.type,
                manufacturer: device.manufacturer,
                capabilities: device.capabilities || []
            }));
    }
    
    getHardwareStatus() {
        return {
            totalDevices: this.devices.size,
            connectedDevices: this.getConnectedDevices().length,
            activeSequences: this.activeSequences.size,
            capabilities: {
                keyboardAutomation: !!this.robotjs,
                serialCommunication: !!this.serialPort,
                advancedRobotics: !!this.johnnyFive
            }
        };
    }
    
    // Emergency stop
    async emergencyStop() {
        console.log('🚨 EMERGENCY STOP - Halting all hardware actions');
        
        // Clear all active sequences
        this.activeSequences.clear();
        
        // Send stop commands to all devices
        for (const [deviceId, device] of this.devices) {
            if (device.status === 'connected') {
                try {
                    await this.sendArduinoCommand(device, 'EMERGENCY_STOP');
                } catch (error) {
                    console.error(`Failed to send emergency stop to ${deviceId}`);
                }
            }
        }
        
        this.emit('emergency_stop');
    }
}

module.exports = HardwareOrchestrator;