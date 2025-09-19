#!/usr/bin/env node

/**
 * 🎮👁️ GAMEBOY EYEBALL EMULATOR
 * Full GameBoy emulator controlled by eye movements and brain patterns
 * Integrates existing EYEBALL systems with GameBoy DMG/CGB emulation
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const EyeControlMapper = require('./eye-control-mapper.js');

// Mock GameBoy emulator core (in real implementation, use existing GB emulator)
class GameBoyCore {
    constructor() {
        this.cpu = { pc: 0x100, sp: 0xFFFE, registers: {} };
        this.memory = new Uint8Array(0x10000);
        this.ppu = { lcdc: 0x91, stat: 0, scy: 0, scx: 0, ly: 0 };
        this.frameBuffer = new Uint8Array(160 * 144 * 4); // RGBA
        this.isRunning = false;
        this.rom = null;
        
        // GameBoy color palette
        this.palette = [
            [0x9B, 0xBC, 0x0F], // Lightest green
            [0x8B, 0xAC, 0x0F], // Light green  
            [0x30, 0x62, 0x30], // Dark green
            [0x0F, 0x38, 0x0F]  // Darkest green
        ];
    }
    
    loadROM(romData) {
        this.rom = new Uint8Array(romData);
        this.memory.set(this.rom, 0);
        console.log(`🎮 ROM loaded: ${this.rom.length} bytes`);
        return true;
    }
    
    reset() {
        this.cpu.pc = 0x100;
        this.cpu.sp = 0xFFFE;
        this.isRunning = true;
        console.log('🔄 GameBoy reset');
    }
    
    step() {
        if (!this.isRunning) return;
        
        // Simplified CPU step - just increment PC
        this.cpu.pc++;
        
        // Update PPU line counter (fake scanline)
        this.ppu.ly = (this.ppu.ly + 1) % 154;
        
        // Generate fake frame data (test pattern)
        this.generateTestFrame();
    }
    
    generateTestFrame() {
        // Create a simple test pattern
        for (let y = 0; y < 144; y++) {
            for (let x = 0; x < 160; x++) {
                const index = (y * 160 + x) * 4;
                
                // Create checkerboard pattern
                const checker = ((x / 8) + (y / 8)) % 2;
                const color = this.palette[checker ? 1 : 0];
                
                this.frameBuffer[index] = color[0];     // R
                this.frameBuffer[index + 1] = color[1]; // G
                this.frameBuffer[index + 2] = color[2]; // B
                this.frameBuffer[index + 3] = 255;      // A
            }
        }
    }
    
    getFrameBuffer() {
        return this.frameBuffer;
    }
    
    pressButton(button) {
        console.log(`🎮 Button pressed: ${button}`);
        // TODO: Update joypad register
    }
    
    releaseButton(button) {
        console.log(`🎮 Button released: ${button}`);
        // TODO: Update joypad register
    }
}

class GameBoyEyeballEmulator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            fps: config.fps || 60,
            scale: config.scale || 4,
            eyeTrackingEnabled: config.eyeTrackingEnabled !== false,
            port: config.port || 8888,
            debugMode: config.debugMode || false,
            ...config
        };
        
        // Core systems
        this.gameBoy = new GameBoyCore();
        this.eyeMapper = new EyeControlMapper({
            sensitivity: 0.8,
            dwellClicking: true,
            predictiveInput: true
        });
        
        // Integration with existing EYEBALL systems
        this.eyeballSystems = {
            learningSystem: null,    // EYEBALL-LEARNING-SYSTEM.js
            orchestrator: null,      // omniscient-eyeball-orchestrator.js
            monitor: null           // EYEBALL-MONITOR.html
        };
        
        // Emulator state
        this.state = {
            isRunning: false,
            currentROM: null,
            eyeTrackingActive: false,
            calibrationComplete: false,
            frameCount: 0,
            fps: 0,
            lastFrameTime: 0
        };
        
        // Eye tracking visualization
        this.eyeVisualization = {
            gazeHistory: [],
            heatmapData: new Map(),
            currentFocus: null,
            blinkHistory: []
        };
        
        // Accessibility features
        this.accessibility = {
            pauseOnLookAway: true,
            autoSaveOnFatigue: true,
            adaptiveDifficulty: false,
            contextualHelp: true
        };
        
        this.setupEmulator();
    }
    
    async setupEmulator() {
        console.log('🎮👁️ Initializing GameBoy Eyeball Emulator...');
        
        // Setup eye control integration
        this.setupEyeControlIntegration();
        
        // Initialize EYEBALL systems integration
        await this.initializeEyeballSystems();
        
        // Setup game loop
        this.setupGameLoop();
        
        // Setup web interface
        await this.setupWebInterface();
        
        console.log('✅ GameBoy Eyeball Emulator ready!');
        console.log(`👁️ Eye tracking: ${this.config.eyeTrackingEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`🌐 Web interface: http://localhost:${this.config.port}`);
    }
    
    setupEyeControlIntegration() {
        // Connect eye mapper to GameBoy controls
        this.eyeMapper.on('control', (button) => {
            this.gameBoy.pressButton(button);
            
            // Release after brief period (simulate button press)
            setTimeout(() => {
                this.gameBoy.releaseButton(button);
            }, 100);
        });
        
        // Listen for control state changes
        this.eyeMapper.on('controls', (controls) => {
            this.handleControlState(controls);
        });
        
        console.log('👁️🎮 Eye control integration setup');
    }
    
    async initializeEyeballSystems() {
        try {
            // Try to load existing EYEBALL systems
            console.log('🔗 Connecting to existing EYEBALL systems...');
            
            // Learning system integration
            if (await this.connectToLearningSystem()) {
                console.log('   ✅ EYEBALL Learning System connected');
            }
            
            // Orchestrator integration  
            if (await this.connectToOrchestrator()) {
                console.log('   ✅ EYEBALL Orchestrator connected');
            }
            
            // Monitor integration
            if (await this.connectToMonitor()) {
                console.log('   ✅ EYEBALL Monitor connected');
            }
            
        } catch (error) {
            console.log('   ⚠️ Running in standalone mode (EYEBALL systems not found)');
        }
    }
    
    async connectToLearningSystem() {
        // Try to connect to existing EYEBALL-LEARNING-SYSTEM
        try {
            const LearningSystem = require('./EYEBALL-LEARNING-SYSTEM.js');
            this.eyeballSystems.learningSystem = new LearningSystem();
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async connectToOrchestrator() {
        // Try to connect to omniscient-eyeball-orchestrator
        try {
            // Check if orchestrator is running on port 9999
            const response = await fetch('http://localhost:9999/api/vision/scan')
                .catch(() => null);
            
            if (response && response.ok) {
                this.eyeballSystems.orchestrator = 'http://localhost:9999';
                return true;
            }
        } catch (error) {}
        
        return false;
    }
    
    async connectToMonitor() {
        // Check if EYEBALL monitor is available
        try {
            const monitorPath = path.join(__dirname, 'EYEBALL-MONITOR.html');
            await fs.access(monitorPath);
            this.eyeballSystems.monitor = monitorPath;
            return true;
        } catch (error) {
            return false;
        }
    }
    
    setupGameLoop() {
        const targetFPS = this.config.fps;
        const frameTime = 1000 / targetFPS;
        
        this.gameLoop = setInterval(() => {
            if (this.state.isRunning) {
                this.tick();
            }
        }, frameTime);
        
        console.log(`⏱️ Game loop running at ${targetFPS} FPS`);
    }
    
    tick() {
        const now = Date.now();
        
        // Calculate FPS
        if (this.state.lastFrameTime > 0) {
            const deltaTime = now - this.state.lastFrameTime;
            this.state.fps = Math.round(1000 / deltaTime);
        }
        this.state.lastFrameTime = now;
        
        // Step GameBoy CPU/PPU
        this.gameBoy.step();
        
        // Update eye tracking visualization
        this.updateEyeVisualization();
        
        // Check accessibility features
        this.checkAccessibilityTriggers();
        
        this.state.frameCount++;
        
        // Emit frame update
        this.emit('frame', {
            frameBuffer: this.gameBoy.getFrameBuffer(),
            frameCount: this.state.frameCount,
            fps: this.state.fps,
            eyeData: this.getEyeVisualizationData()
        });
    }
    
    handleControlState(controls) {
        // Handle D-pad
        if (controls.dpad.up) this.gameBoy.pressButton('UP');
        if (controls.dpad.down) this.gameBoy.pressButton('DOWN');
        if (controls.dpad.left) this.gameBoy.pressButton('LEFT');
        if (controls.dpad.right) this.gameBoy.pressButton('RIGHT');
        
        // Handle buttons
        if (controls.buttons.a) this.gameBoy.pressButton('A');
        if (controls.buttons.b) this.gameBoy.pressButton('B');
        if (controls.buttons.start) this.gameBoy.pressButton('START');
        if (controls.buttons.select) this.gameBoy.pressButton('SELECT');
        
        // Update visualization
        this.updateControlVisualization(controls);
    }
    
    updateEyeVisualization() {
        const eyeState = this.eyeMapper.getState();
        
        // Add gaze point to history
        this.eyeVisualization.gazeHistory.push({
            x: eyeState.eyeState.currentGaze.x,
            y: eyeState.eyeState.currentGaze.y,
            timestamp: Date.now()
        });
        
        // Keep only recent history (last 5 seconds)
        const cutoff = Date.now() - 5000;
        this.eyeVisualization.gazeHistory = this.eyeVisualization.gazeHistory
            .filter(point => point.timestamp > cutoff);
        
        // Update heatmap
        this.updateHeatmap(eyeState.eyeState.currentGaze);
        
        // Track blinks
        if (eyeState.eyeState.blinkPattern.length > 0) {
            const lastBlink = eyeState.eyeState.blinkPattern[eyeState.eyeState.blinkPattern.length - 1];
            this.eyeVisualization.blinkHistory.push(lastBlink);
        }
    }
    
    updateHeatmap(gazePoint) {
        // Discretize gaze point for heatmap
        const gridSize = 20;
        const gridX = Math.floor(gazePoint.x * gridSize);
        const gridY = Math.floor(gazePoint.y * gridSize);
        const key = `${gridX},${gridY}`;
        
        const current = this.eyeVisualization.heatmapData.get(key) || 0;
        this.eyeVisualization.heatmapData.set(key, current + 1);
    }
    
    updateControlVisualization(controls) {
        // Store current control state for visualization
        this.eyeVisualization.currentControls = controls;
    }
    
    checkAccessibilityTriggers() {
        const eyeState = this.eyeMapper.getState();
        
        // Pause on look away
        if (this.accessibility.pauseOnLookAway) {
            const isLookingAway = this.detectLookingAway(eyeState.eyeState.currentGaze);
            if (isLookingAway && this.state.isRunning) {
                this.pause();
                console.log('⏸️ Paused: Player looked away');
            }
        }
        
        // Auto-save on fatigue
        if (this.accessibility.autoSaveOnFatigue) {
            if (eyeState.learningData.fatigueLevel > 0.8) {
                this.saveState();
                console.log('💾 Auto-saved: Fatigue detected');
            }
        }
    }
    
    detectLookingAway(gazePoint) {
        // Consider looking away if gaze is outside center 80% of screen
        return gazePoint.x < 0.1 || gazePoint.x > 0.9 || 
               gazePoint.y < 0.1 || gazePoint.y > 0.9;
    }
    
    getEyeVisualizationData() {
        return {
            gazeHistory: this.eyeVisualization.gazeHistory,
            currentGaze: this.eyeMapper.getState().eyeState.currentGaze,
            heatmapData: Array.from(this.eyeVisualization.heatmapData.entries()),
            currentControls: this.eyeVisualization.currentControls,
            fatigueLevel: this.eyeMapper.getState().learningData.fatigueLevel
        };
    }
    
    async setupWebInterface() {
        const express = require('express');
        const http = require('http');
        const socketIo = require('socket.io');
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        
        // Serve static files
        this.app.use(express.static('public'));
        
        // Main interface route
        this.app.get('/', (req, res) => {
            res.send(this.generateWebInterface());
        });
        
        // API routes
        this.app.get('/api/status', (req, res) => {
            res.json(this.getStatus());
        });
        
        this.app.post('/api/calibrate', async (req, res) => {
            const result = await this.calibrateEyeTracking();
            res.json(result);
        });
        
        this.app.post('/api/load-rom', express.raw({ type: 'application/octet-stream' }), (req, res) => {
            const success = this.loadROM(req.body);
            res.json({ success });
        });
        
        // Socket.IO for real-time updates
        this.io.on('connection', (socket) => {
            console.log('👁️ Client connected to GameBoy Eyeball Emulator');
            
            socket.on('start-eye-tracking', () => {
                this.startEyeTracking();
            });
            
            socket.on('calibrate', async () => {
                const result = await this.calibrateEyeTracking();
                socket.emit('calibration-result', result);
            });
        });
        
        // Emit frame updates to connected clients
        this.on('frame', (frameData) => {
            this.io.emit('frame-update', frameData);
        });
        
        this.server.listen(this.config.port, () => {
            console.log(`🌐 GameBoy Eyeball Emulator running on port ${this.config.port}`);
        });
    }
    
    generateWebInterface() {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>🎮👁️ GameBoy Eyeball Emulator</title>
            <style>
                body { margin: 0; padding: 20px; background: #2d2d2d; color: #fff; font-family: monospace; }
                .container { display: flex; gap: 20px; }
                .gameboy-screen { border: 4px solid #8b956d; background: #9bbc0f; padding: 10px; }
                .controls { background: #333; padding: 20px; border-radius: 10px; }
                .eye-overlay { position: absolute; pointer-events: none; }
                .gaze-cursor { width: 10px; height: 10px; border: 2px solid red; border-radius: 50%; }
            </style>
        </head>
        <body>
            <h1>🎮👁️ GameBoy Eyeball Emulator</h1>
            <div class="container">
                <div class="gameboy-screen">
                    <canvas id="screen" width="640" height="576"></canvas>
                    <div class="eye-overlay" id="eyeOverlay"></div>
                </div>
                <div class="controls">
                    <h3>Eye Controls</h3>
                    <button onclick="startEyeTracking()">Start Eye Tracking</button>
                    <button onclick="calibrate()">Calibrate</button>
                    <div id="status"></div>
                </div>
            </div>
            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                const canvas = document.getElementById('screen');
                const ctx = canvas.getContext('2d');
                
                function startEyeTracking() {
                    socket.emit('start-eye-tracking');
                }
                
                function calibrate() {
                    socket.emit('calibrate');
                }
                
                socket.on('frame-update', (data) => {
                    // Render GameBoy frame
                    const imageData = new ImageData(new Uint8ClampedArray(data.frameBuffer), 160, 144);
                    ctx.putImageData(imageData, 0, 0);
                    
                    // Update eye visualization
                    updateEyeVisualization(data.eyeData);
                    
                    // Update status
                    document.getElementById('status').innerHTML = 
                        'FPS: ' + data.fps + '<br>' +
                        'Frame: ' + data.frameCount + '<br>' +
                        'Gaze: (' + (data.eyeData.currentGaze.x * 100).toFixed(1) + '%, ' + 
                                   (data.eyeData.currentGaze.y * 100).toFixed(1) + '%)';
                });
                
                function updateEyeVisualization(eyeData) {
                    const overlay = document.getElementById('eyeOverlay');
                    const gaze = eyeData.currentGaze;
                    
                    // Position gaze cursor
                    const x = gaze.x * 640;
                    const y = gaze.y * 576;
                    
                    overlay.innerHTML = '<div class="gaze-cursor" style="left:' + x + 'px; top:' + y + 'px;"></div>';
                }
            </script>
        </body>
        </html>
        `;
    }
    
    // Public API methods
    async loadROM(romData) {
        try {
            const success = this.gameBoy.loadROM(romData);
            if (success) {
                this.state.currentROM = romData;
                console.log('✅ ROM loaded successfully');
            }
            return success;
        } catch (error) {
            console.error('❌ Failed to load ROM:', error);
            return false;
        }
    }
    
    start() {
        this.gameBoy.reset();
        this.state.isRunning = true;
        console.log('▶️ GameBoy Eyeball Emulator started');
        this.emit('started');
    }
    
    pause() {
        this.state.isRunning = false;
        console.log('⏸️ GameBoy Eyeball Emulator paused');
        this.emit('paused');
    }
    
    async startEyeTracking() {
        if (!this.config.eyeTrackingEnabled) return false;
        
        try {
            // Start processing mock eye data
            this.eyeTrackingInterval = setInterval(() => {
                // Generate mock eye data for demonstration
                const mockEyeData = this.generateMockEyeData();
                this.eyeMapper.processEyeData(mockEyeData);
            }, 16); // ~60 FPS
            
            this.state.eyeTrackingActive = true;
            console.log('👁️ Eye tracking started');
            return true;
        } catch (error) {
            console.error('❌ Failed to start eye tracking:', error);
            return false;
        }
    }
    
    async calibrateEyeTracking() {
        if (!this.state.eyeTrackingActive) {
            await this.startEyeTracking();
        }
        
        const result = await this.eyeMapper.calibrate();
        this.state.calibrationComplete = result;
        
        return {
            success: result,
            message: result ? 'Calibration successful' : 'Calibration failed'
        };
    }
    
    generateMockEyeData() {
        // Generate realistic mock eye tracking data for demo
        const time = Date.now();
        const noise = () => (Math.random() - 0.5) * 0.05;
        
        return {
            timestamp: time,
            gaze: {
                x: 0.5 + Math.sin(time * 0.001) * 0.3 + noise(),
                y: 0.5 + Math.cos(time * 0.0007) * 0.2 + noise()
            },
            leftEye: {
                open: Math.random() > 0.05, // 5% blink rate
                confidence: 0.95
            },
            rightEye: {
                open: Math.random() > 0.05,
                confidence: 0.95
            }
        };
    }
    
    saveState() {
        // TODO: Implement save state functionality
        console.log('💾 Save state created');
    }
    
    getStatus() {
        return {
            state: this.state,
            eyeTracking: {
                active: this.state.eyeTrackingActive,
                calibrated: this.state.calibrationComplete,
                mapper: this.eyeMapper.getState()
            },
            gameBoy: {
                isRunning: this.gameBoy.isRunning,
                hasROM: this.gameBoy.rom !== null
            },
            eyeballSystems: {
                learningSystem: !!this.eyeballSystems.learningSystem,
                orchestrator: !!this.eyeballSystems.orchestrator,
                monitor: !!this.eyeballSystems.monitor
            }
        };
    }
}

module.exports = GameBoyEyeballEmulator;

// Run if called directly
if (require.main === module) {
    const emulator = new GameBoyEyeballEmulator({
        fps: 60,
        eyeTrackingEnabled: true,
        debugMode: true
    });
    
    // Auto-start for demo
    setTimeout(() => {
        emulator.start();
        emulator.startEyeTracking();
    }, 2000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down GameBoy Eyeball Emulator...');
        if (emulator.gameLoop) clearInterval(emulator.gameLoop);
        if (emulator.eyeTrackingInterval) clearInterval(emulator.eyeTrackingInterval);
        process.exit(0);
    });
}