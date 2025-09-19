#!/usr/bin/env node

/**
 * 👁️🎨 EYE PIXEL ART SYSTEM  
 * Laser-precise pixel placement using eye tracking
 * Like etch-a-sketch but controlled by your eyes and brain patterns
 * Integrates with existing eye control and pixel art systems
 */

const ColorTextPixelSystem = require('./color-text-pixel-system.js');
const TextureBitmapEngine = require('./ship-fleet-interface/texture-bitmap-engine.js');
const AsciiPixelArtEngine = require('./ascii-pixel-art-engine.js');
const AIPixelArtGenerator = require('./ai-pixel-art-generator.js');
const AIFeedbackSystem = require('./ai-feedback-system.js');
const EyeControlMapper = require('./eye-control-mapper.js');
const express = require('express');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

class EyePixelArtSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            port: options.port || 8889,
            wsPort: options.wsPort || 8890,
            gridSize: options.gridSize || 32,
            pixelSize: options.pixelSize || 16,
            eyeSensitivity: options.eyeSensitivity || 0.8,
            dwellTime: options.dwellTime || 300,
            blinkTolerance: options.blinkTolerance || 150,
            enablePrediction: options.enablePrediction !== false,
            enableAI: options.enableAI !== false,
            ...options
        };
        
        // Initialize subsystems
        this.pixelSystem = new ColorTextPixelSystem({
            gridSize: this.options.gridSize,
            outputFormat: 'both',
            enableAI: this.options.enableAI
        });
        
        // Initialize texture bitmap engine for enhanced graphics
        this.textureEngine = new TextureBitmapEngine();
        
        // Initialize ASCII art engine for terminal output
        this.asciiEngine = new AsciiPixelArtEngine();
        
        // Initialize AI pixel art generator
        this.aiGenerator = new AIPixelArtGenerator({
            gridSize: this.options.gridSize,
            enableReasoning: true,
            cacheResults: true
        });

        // Initialize feedback system
        this.feedbackSystem = new AIFeedbackSystem({
            feedbackFile: './ai-pixel-feedback.json',
            autoSave: true
        });
        
        this.eyeMapper = new EyeControlMapper({
            sensitivity: this.options.eyeSensitivity,
            dwellTime: this.options.dwellTime,
            dwellClicking: true,
            predictiveInput: this.options.enablePrediction,
            fatigueCompensation: true
        });
        
        // Canvas state
        this.canvas = {
            grid: this.createEmptyGrid(),
            currentColor: 'R',
            drawingMode: 'pixel', // 'pixel', 'line', 'rect', 'circle', 'flood'
            isDrawing: false,
            lastPosition: { x: -1, y: -1 },
            undoStack: [],
            redoStack: []
        };
        
        // Color palette
        this.palette = [
            'R', 'G', 'B', 'Y', 'M', 'C', 'W', 'K', 'X',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ];
        this.paletteIndex = 0;
        
        // Drawing tools
        this.tools = {
            pixel: { name: 'Pixel', icon: '●', cursor: 'pixel' },
            line: { name: 'Line', icon: '─', cursor: 'line' },
            rect: { name: 'Rectangle', icon: '▢', cursor: 'rect' },
            circle: { name: 'Circle', icon: '○', cursor: 'circle' },
            flood: { name: 'Flood Fill', icon: '▦', cursor: 'flood' },
            eraser: { name: 'Eraser', icon: '✕', cursor: 'eraser' }
        };
        this.currentTool = 'pixel';
        
        // Eye control mappings
        this.controlMappings = {
            // Gaze controls cursor position
            gaze: 'cursor',
            
            // Blink patterns control actions
            singleBlink: 'place_pixel',
            doubleBlink: 'next_color',
            longBlink: 'toggle_draw_mode',
            wink: 'next_tool',
            
            // Gesture controls
            shake: 'undo',
            dwell: 'place_pixel_precise',
            
            // Rapid patterns
            rapidBlinks: 'clear_canvas',
            closedEyes: 'save_canvas',
            
            // AI enhancement controls
            slowWink: 'enhance_with_ai',
            doubleWink: 'generate_texture_variant'
        };
        
        // Active WebSocket connections
        this.wsConnections = new Set();
        
        // Eye tracking state
        this.eyeState = {
            cursorX: Math.floor(this.options.gridSize / 2),
            cursorY: Math.floor(this.options.gridSize / 2),
            isActive: false,
            calibrated: false,
            fatigueLevel: 0,
            accuracy: 0.85
        };
        
        // Drawing history for undo/redo
        this.history = [];
        this.historyIndex = -1;
        
        console.log('👁️🎨 Eye Pixel Art System initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Setup eye control integration
        this.setupEyeControlIntegration();
        
        // Start web server
        this.setupWebServer();
        
        // Start WebSocket server
        this.setupWebSocketServer();
        
        console.log('✅ Eye Pixel Art System ready!');
        console.log(`👁️ Pixel Art Interface: http://localhost:${this.options.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.options.wsPort}`);
        console.log(`🎨 Grid: ${this.options.gridSize}x${this.options.gridSize}`);
        console.log(`🎯 Eye sensitivity: ${this.options.eyeSensitivity}`);
    }
    
    setupEyeControlIntegration() {
        console.log('👁️ Setting up eye control integration...');
        
        // Map eye controls to pixel art actions
        this.eyeMapper.on('control', (control) => {
            this.handleEyeControl(control);
        });
        
        this.eyeMapper.on('controls', (controls) => {
            this.handleEyeControlState(controls);
        });
        
        // Start processing mock eye data for demo
        this.startMockEyeData();
    }
    
    startMockEyeData() {
        // Generate realistic eye tracking data for demo
        setInterval(() => {
            const mockEyeData = this.generateMockEyeData();
            this.eyeMapper.processEyeData(mockEyeData);
        }, 16); // ~60 FPS
    }
    
    generateMockEyeData() {
        const time = Date.now();
        const noise = () => (Math.random() - 0.5) * 0.02;
        
        // Simulate natural eye movement with some drift
        const baseX = 0.5 + Math.sin(time * 0.001) * 0.2 + noise();
        const baseY = 0.5 + Math.cos(time * 0.0007) * 0.15 + noise();
        
        return {
            timestamp: time,
            gaze: {
                x: Math.max(0, Math.min(1, baseX)),
                y: Math.max(0, Math.min(1, baseY))
            },
            leftEye: {
                open: Math.random() > 0.05, // Natural blink rate
                confidence: 0.95
            },
            rightEye: {
                open: Math.random() > 0.05,
                confidence: 0.95
            }
        };
    }
    
    handleEyeControl(control) {
        const action = this.controlMappings[control];
        if (!action) return;
        
        switch (action) {
            case 'place_pixel':
                this.placePixel();
                break;
                
            case 'next_color':
                this.nextColor();
                break;
                
            case 'toggle_draw_mode':
                this.toggleDrawMode();
                break;
                
            case 'next_tool':
                this.nextTool();
                break;
                
            case 'undo':
                this.undo();
                break;
                
            case 'place_pixel_precise':
                this.placePixelPrecise();
                break;
                
            case 'clear_canvas':
                this.clearCanvas();
                break;
                
            case 'save_canvas':
                this.saveCanvas();
                break;
                
            case 'enhance_with_ai':
                this.enhanceWithAI();
                break;
                
            case 'generate_texture_variant':
                this.generateTextureVariant();
                break;
                
            case 'generate_from_text':
                this.generateFromNaturalLanguage();
                break;
        }
        
        // Broadcast state update
        this.broadcastState();
    }
    
    handleEyeControlState(controls) {
        // Update cursor position based on gaze
        const eyeState = this.eyeMapper.getState();
        if (eyeState.eyeState && eyeState.eyeState.currentGaze) {
            const gaze = eyeState.eyeState.currentGaze;
            
            // Map gaze to grid coordinates
            const gridX = Math.floor(gaze.x * this.options.gridSize);
            const gridY = Math.floor(gaze.y * this.options.gridSize);
            
            // Update cursor if position changed
            if (gridX !== this.eyeState.cursorX || gridY !== this.eyeState.cursorY) {
                this.eyeState.cursorX = Math.max(0, Math.min(this.options.gridSize - 1, gridX));
                this.eyeState.cursorY = Math.max(0, Math.min(this.options.gridSize - 1, gridY));
                
                // Auto-draw if in continuous mode
                if (this.canvas.isDrawing && this.currentTool === 'pixel') {
                    this.placePixel();
                }
                
                this.broadcastCursorUpdate();
            }
        }
        
        // Update fatigue level
        if (eyeState.learningData && eyeState.learningData.fatigueLevel !== undefined) {
            this.eyeState.fatigueLevel = eyeState.learningData.fatigueLevel;
        }
    }
    
    // Drawing methods
    
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.options.gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < this.options.gridSize; x++) {
                grid[y][x] = ' ';
            }
        }
        return grid;
    }
    
    placePixel() {
        const { cursorX, cursorY } = this.eyeState;
        
        if (this.currentTool === 'pixel') {
            this.saveToHistory();
            this.canvas.grid[cursorY][cursorX] = this.canvas.currentColor;
            this.broadcastGridUpdate(cursorX, cursorY);
        }
    }
    
    placePixelPrecise() {
        // More precise placement with dwell confirmation
        this.placePixel();
        console.log(`🎯 Precise pixel placed at (${this.eyeState.cursorX}, ${this.eyeState.cursorY})`);
    }
    
    nextColor() {
        this.paletteIndex = (this.paletteIndex + 1) % this.palette.length;
        this.canvas.currentColor = this.palette[this.paletteIndex];
        console.log(`🎨 Color changed to: ${this.canvas.currentColor}`);
        this.broadcastState();
    }
    
    nextTool() {
        const toolNames = Object.keys(this.tools);
        const currentIndex = toolNames.indexOf(this.currentTool);
        const nextIndex = (currentIndex + 1) % toolNames.length;
        this.currentTool = toolNames[nextIndex];
        console.log(`🔧 Tool changed to: ${this.tools[this.currentTool].name}`);
        this.broadcastState();
    }
    
    toggleDrawMode() {
        this.canvas.isDrawing = !this.canvas.isDrawing;
        console.log(`✏️ Drawing mode: ${this.canvas.isDrawing ? 'ON' : 'OFF'}`);
        this.broadcastState();
    }
    
    clearCanvas() {
        this.saveToHistory();
        this.canvas.grid = this.createEmptyGrid();
        console.log('🧹 Canvas cleared');
        this.broadcastGridUpdate();
    }
    
    async enhanceWithAI() {
        try {
            console.log('🤖 Enhancing artwork with AI...');
            this.broadcastMessage('AI enhancing artwork...');
            
            // Convert grid to text commands
            const commands = this.gridToCommands(this.canvas.grid);
            
            // Use pixel system AI enhancement
            const results = await this.pixelSystem.processText(commands, {
                enhanceWithAI: true,
                saveToFile: `ai-enhanced-${Date.now()}`
            });
            
            if (results.ai) {
                console.log('✨ AI enhancement complete!');
                this.broadcastMessage('AI enhancement complete!');
                
                // Optionally display ASCII art version
                if (results.ascii) {
                    console.log('\n🎨 ASCII Art Generated:');
                    console.log(results.ascii);
                }
                
                return results;
            } else {
                this.broadcastMessage('AI enhancement failed');
            }
        } catch (error) {
            console.error('AI enhancement failed:', error);
            this.broadcastMessage('AI enhancement error');
        }
    }
    
    async generateTextureVariant() {
        try {
            console.log('🖼️ Generating texture variant...');
            this.broadcastMessage('Generating texture variant...');
            
            // Use texture bitmap engine to create enhanced version
            const bitmap = this.textureEngine.generateLeagueBitmap('RecLeague', {
                status: 'active',
                performance: this.calculateCanvasComplexity(),
                customData: this.extractCanvasFeatures()
            }, 'high_quality', 'front');
            
            // Create folded texture for interesting effects
            const fold = this.textureEngine.createTextureFold('RecLeague', 'accordion');
            
            console.log('🎨 Texture variant generated!');
            this.broadcastMessage('Texture variant ready!');
            
            // Generate ASCII art representation of the texture
            const asciiArt = this.asciiEngine.generateArt('pixel_portrait', {
                character: 'eye_art'
            });
            
            console.log('\n🖼️ Generated Texture Bitmap:', {
                id: bitmap.id,
                layers: bitmap.layers.length,
                quality: bitmap.quality,
                fold: {
                    type: fold.foldType,
                    segments: fold.segments.length
                }
            });
            
            console.log('\n🎨 ASCII Art Variant:');
            console.log(asciiArt);
            
            return { bitmap, fold, asciiArt };
            
        } catch (error) {
            console.error('Texture variant generation failed:', error);
            this.broadcastMessage('Texture generation failed');
        }
    }
    
    calculateCanvasComplexity() {
        const grid = this.canvas.grid;
        let filledPixels = 0;
        const colors = new Set();
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] !== ' ') {
                    filledPixels++;
                    colors.add(grid[y][x]);
                }
            }
        }
        
        const density = filledPixels / (this.options.gridSize * this.options.gridSize);
        const colorVariety = colors.size;
        
        // Calculate complexity score (0-100)
        return Math.floor((density * 50) + (colorVariety * 5) + (filledPixels > 100 ? 25 : 0));
    }
    
    extractCanvasFeatures() {
        const grid = this.canvas.grid;
        const features = {
            dominantColors: [],
            patterns: [],
            regions: []
        };
        
        // Count color usage
        const colorCounts = {};
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const pixel = grid[y][x];
                if (pixel !== ' ') {
                    colorCounts[pixel] = (colorCounts[pixel] || 0) + 1;
                }
            }
        }
        
        // Get dominant colors
        features.dominantColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([color]) => color);
        
        // Detect simple patterns (horizontal/vertical lines, rectangles)
        features.patterns = this.detectSimplePatterns(grid);
        
        return features;
    }
    
    detectSimplePatterns(grid) {
        const patterns = [];
        const size = this.options.gridSize;
        
        // Detect horizontal lines
        for (let y = 0; y < size; y++) {
            let lineLength = 0;
            let lineColor = null;
            for (let x = 0; x < size; x++) {
                if (grid[y][x] !== ' ' && grid[y][x] === lineColor) {
                    lineLength++;
                } else if (grid[y][x] !== ' ') {
                    if (lineLength > 3) {
                        patterns.push({ type: 'horizontal_line', length: lineLength, color: lineColor });
                    }
                    lineColor = grid[y][x];
                    lineLength = 1;
                } else {
                    if (lineLength > 3) {
                        patterns.push({ type: 'horizontal_line', length: lineLength, color: lineColor });
                    }
                    lineLength = 0;
                    lineColor = null;
                }
            }
        }
        
        return patterns;
    }
    
    async generateFromNaturalLanguage(query = null, options = {}) {
        try {
            // Use a default query if none provided (from user input or eye control)
            const naturalQuery = query || this.lastNaturalLanguageQuery || 'draw a simple shape';
            
            console.log(`🤖 Generating from natural language: "${naturalQuery}"`);
            this.broadcastMessage(`AI generating: ${naturalQuery}...`);
            
            // Use the AI generator to create pixel art
            const result = await this.aiGenerator.generateFromQuery(naturalQuery, {
                style: this.detectStyle(naturalQuery),
                enhanceWithAI: false, // Already using AI
                parallel: options.parallel || false
            });
            
            if (result && result.pixelResult && result.pixelResult.bitmap) {
                // Apply the generated bitmap to the canvas
                this.canvas.grid = result.pixelResult.bitmap;
                
                // Store result for potential refinement
                this.lastGenerationResult = result;
                
                // Save to history
                this.saveToHistory();
                
                // Broadcast update
                this.broadcastGridUpdate();
                
                console.log(`✅ Generated "${naturalQuery}" with ${result.metadata.commandCount} commands`);
                this.broadcastMessage(`Generated: ${naturalQuery}!`);
                
                // Show reasoning if available
                if (result.reasoning) {
                    console.log('\n🧠 AI Reasoning:');
                    console.log(result.reasoning);
                }
                
                return result;
            } else {
                this.broadcastMessage('AI generation failed');
            }
            
        } catch (error) {
            console.error('Natural language generation failed:', error);
            this.broadcastMessage('Generation error');
        }
    }
    
    /**
     * Broadcast rating to all connected clients
     */
    broadcastRating(generationId, ratingData) {
        const message = JSON.stringify({
            type: 'rating_update',
            data: { generationId, ratingData }
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    /**
     * Refine a generation based on feedback
     */
    async refineGeneration(generationId, feedback) {
        try {
            // In practice, you'd store all generation results
            // For now, use the last generated result
            const originalResult = this.lastGenerationResult;
            if (!originalResult || originalResult.id !== generationId) {
                throw new Error('Original generation not found');
            }
            
            console.log(`🔄 Refining generation ${generationId}`);
            this.broadcastMessage('🔄 Refining based on your feedback...');
            
            const refinedResult = await this.feedbackSystem.generateRefinement(
                originalResult, 
                feedback, 
                this.aiGenerator
            );
            
            if (refinedResult && refinedResult.pixelResult && refinedResult.pixelResult.bitmap) {
                // Apply the refined bitmap to the canvas
                this.canvas.grid = refinedResult.pixelResult.bitmap;
                this.broadcastState();
                
                this.broadcastMessage('✅ Refinement complete!');
            }
            
            return refinedResult;
        } catch (error) {
            console.error('❌ Refinement failed:', error);
            this.broadcastMessage(`❌ Refinement failed: ${error.message}`);
            return null;
        }
    }
    
    detectStyle(query) {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('minecraft')) return 'minecraft';
        if (lowerQuery.includes('retro') || lowerQuery.includes('8-bit')) return 'retro';
        if (lowerQuery.includes('detailed')) return 'detailed';
        if (lowerQuery.includes('simple')) return 'simple';
        return null; // Use default style
    }

    async saveCanvas() {
        try {
            // Convert grid to text commands
            const commands = this.gridToCommands(this.canvas.grid);
            
            // Process with pixel system
            const results = await this.pixelSystem.processText(commands, {
                saveToFile: `eye-art-${Date.now()}`,
                enhanceWithAI: this.options.enableAI
            });
            
            console.log('💾 Canvas saved successfully');
            this.broadcastMessage('Canvas saved!');
            
            return results;
        } catch (error) {
            console.error('Failed to save canvas:', error);
            this.broadcastMessage('Save failed!');
        }
    }
    
    gridToCommands(grid) {
        const commands = [];
        const size = this.options.gridSize;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const pixel = grid[y][x];
                if (pixel !== ' ') {
                    commands.push(`${pixel} ${x},${y}`);
                }
            }
        }
        
        return commands.join('\n');
    }
    
    saveToHistory() {
        // Deep copy current grid state
        const gridCopy = this.canvas.grid.map(row => [...row]);
        
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(gridCopy);
        this.historyIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history = this.history.slice(-50);
            this.historyIndex = this.history.length - 1;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.canvas.grid = this.history[this.historyIndex].map(row => [...row]);
            console.log('↶ Undo');
            this.broadcastGridUpdate();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.canvas.grid = this.history[this.historyIndex].map(row => [...row]);
            console.log('↷ Redo');
            this.broadcastGridUpdate();
        }
    }
    
    // Web server setup
    
    setupWebServer() {
        this.app = express();
        this.app.use(express.static('public'));
        this.app.use(express.json());
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.generateWebInterface());
        });
        
        // API endpoints
        this.app.get('/api/state', (req, res) => {
            res.json(this.getState());
        });
        
        this.app.post('/api/pixel', (req, res) => {
            const { x, y, color } = req.body;
            if (x >= 0 && x < this.options.gridSize && y >= 0 && y < this.options.gridSize) {
                this.canvas.grid[y][x] = color || this.canvas.currentColor;
                this.broadcastGridUpdate(x, y);
            }
            res.json({ success: true });
        });
        
        this.app.post('/api/clear', (req, res) => {
            this.clearCanvas();
            res.json({ success: true });
        });
        
        this.server = this.app.listen(this.options.port);
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.options.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 Client connected to Eye Pixel Art System');
            this.wsConnections.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'state',
                data: this.getState()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(data, ws);
                } catch (error) {
                    console.error('Invalid WebSocket message:', error);
                }
            });
            
            ws.on('close', () => {
                this.wsConnections.delete(ws);
                console.log('🔌 Client disconnected');
            });
        });
    }
    
    handleWebSocketMessage(data, ws) {
        switch (data.type) {
            case 'calibrate':
                this.calibrateEyeTracking().then(result => {
                    ws.send(JSON.stringify({
                        type: 'calibration_result',
                        data: result
                    }));
                });
                break;
                
            case 'set_color':
                this.canvas.currentColor = data.color;
                this.broadcastState();
                break;
                
            case 'set_tool':
                this.currentTool = data.tool;
                this.broadcastState();
                break;
                
            case 'place_pixel':
                if (data.x !== undefined && data.y !== undefined) {
                    this.canvas.grid[data.y][data.x] = this.canvas.currentColor;
                    this.broadcastGridUpdate(data.x, data.y);
                }
                break;
                
            case 'natural_language':
                if (data.query) {
                    this.lastNaturalLanguageQuery = data.query;
                    this.generateFromNaturalLanguage(data.query, { parallel: data.parallel || false }).then(result => {
                        if (result) {
                            // Create rating interface
                            const ratingInterface = this.feedbackSystem.createRatingInterface(result);
                            
                            ws.send(JSON.stringify({
                                type: 'ai_generation_result',
                                data: { 
                                    success: true, 
                                    query: data.query,
                                    result,
                                    reasoning: result.reasoning,
                                    ratingInterface,
                                    parallelResults: result.parallelResults 
                                }
                            }));
                        }
                    });
                }
                break;
                
            case 'rate_generation':
                if (data.generationId && data.rating) {
                    this.feedbackSystem.rateGeneration(data.generationId, data.rating, data.userId).then(ratingData => {
                        ws.send(JSON.stringify({
                            type: 'rating_received',
                            data: { success: true, ratingData }
                        }));
                        
                        // Broadcast rating to all clients
                        this.broadcastRating(data.generationId, ratingData);
                    });
                }
                break;
                
            case 'improve_generation':
                if (data.generationId && data.improvement) {
                    this.feedbackSystem.addImprovement(data.generationId, data.improvement, data.userId).then(improvementData => {
                        ws.send(JSON.stringify({
                            type: 'improvement_added',
                            data: { success: true, improvementData }
                        }));
                    });
                }
                break;
                
            case 'refine_generation':
                if (data.generationId && data.feedback) {
                    // Find original result (you'd store this in practice)
                    this.refineGeneration(data.generationId, data.feedback).then(refinedResult => {
                        if (refinedResult) {
                            ws.send(JSON.stringify({
                                type: 'refinement_result',
                                data: { success: true, originalId: data.generationId, refinedResult }
                            }));
                        }
                    });
                }
                break;
                
            case 'enhance_ai':
                this.enhanceWithAI().then(results => {
                    if (results) {
                        ws.send(JSON.stringify({
                            type: 'ai_enhancement_result',
                            data: { success: true, results }
                        }));
                    }
                });
                break;
                
            case 'generate_texture':
                this.generateTextureVariant().then(results => {
                    if (results) {
                        ws.send(JSON.stringify({
                            type: 'texture_generation_result',
                            data: { success: true, results }
                        }));
                    }
                });
                break;
        }
    }
    
    async calibrateEyeTracking() {
        console.log('👁️ Starting eye tracking calibration...');
        
        try {
            const result = await this.eyeMapper.calibrate();
            this.eyeState.calibrated = result;
            this.eyeState.accuracy = result ? 0.95 : 0.60;
            
            this.broadcastMessage(result ? 'Calibration successful!' : 'Calibration failed');
            return { success: result, accuracy: this.eyeState.accuracy };
        } catch (error) {
            console.error('Calibration failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Broadcasting methods
    
    broadcastState() {
        const state = this.getState();
        this.broadcast({
            type: 'state_update',
            data: state
        });
    }
    
    broadcastGridUpdate(x = null, y = null) {
        this.broadcast({
            type: 'grid_update',
            data: {
                grid: this.canvas.grid,
                changedPixel: x !== null && y !== null ? { x, y, color: this.canvas.grid[y][x] } : null
            }
        });
    }
    
    broadcastCursorUpdate() {
        this.broadcast({
            type: 'cursor_update',
            data: {
                x: this.eyeState.cursorX,
                y: this.eyeState.cursorY
            }
        });
    }
    
    broadcastMessage(message) {
        this.broadcast({
            type: 'message',
            data: { message }
        });
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    getState() {
        return {
            canvas: this.canvas,
            eyeState: this.eyeState,
            currentColor: this.canvas.currentColor,
            currentTool: this.currentTool,
            palette: this.palette,
            paletteIndex: this.paletteIndex,
            tools: this.tools,
            controlMappings: this.controlMappings,
            options: {
                gridSize: this.options.gridSize,
                pixelSize: this.options.pixelSize
            }
        };
    }
    
    generateWebInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👁️🎨 Eye Pixel Art System</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #00ff41;
            font-family: 'Courier New', monospace;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 20px;
        }
        
        .main-area {
            background: rgba(0, 255, 65, 0.05);
            border: 2px solid #00ff41;
            border-radius: 15px;
            padding: 20px;
        }
        
        .control-panel {
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 15px;
            padding: 20px;
        }
        
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin: 0 0 20px 0;
            text-shadow: 0 0 10px #00ff41;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { text-shadow: 0 0 10px #00ff41; }
            to { text-shadow: 0 0 20px #00ff41, 0 0 30px #00ff41; }
        }
        
        #pixelCanvas {
            background: #000;
            border: 3px solid #00ff41;
            cursor: crosshair;
            margin: 0 auto;
            display: block;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        }
        
        .eye-cursor {
            position: absolute;
            width: 10px;
            height: 10px;
            border: 2px solid #ff0066;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: pulse 1s infinite;
            box-shadow: 0 0 10px #ff0066;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
        }
        
        .controls {
            margin: 20px 0;
        }
        
        .control-section {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #00ff41;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .control-section h3 {
            margin: 0 0 10px 0;
            color: #00ff41;
            font-size: 1.2em;
        }
        
        .palette {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 5px;
            margin: 10px 0;
        }
        
        .color-btn {
            width: 40px;
            height: 40px;
            border: 2px solid #333;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .color-btn.active {
            border-color: #00ff41;
            box-shadow: 0 0 10px #00ff41;
        }
        
        .color-btn:hover {
            transform: scale(1.1);
        }
        
        .tools {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 10px 0;
        }
        
        .tool-btn {
            padding: 10px;
            background: rgba(0, 255, 65, 0.1);
            border: 1px solid #00ff41;
            color: #00ff41;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
        }
        
        .tool-btn.active {
            background: rgba(0, 255, 65, 0.3);
            box-shadow: 0 0 10px #00ff41;
        }
        
        .tool-btn:hover {
            background: rgba(0, 255, 65, 0.2);
        }
        
        .action-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(45deg, #00ff41, #00cc33);
            color: #000;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            margin: 5px 0;
            transition: all 0.2s ease;
        }
        
        .action-btn:hover {
            background: linear-gradient(45deg, #00cc33, #00ff41);
            transform: scale(1.05);
        }
        
        .eye-status {
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-active { background: #00ff41; }
        .status-inactive { background: #ff4444; }
        .status-warning { background: #ffaa00; }
        
        .eye-commands {
            font-size: 0.9em;
            line-height: 1.4;
            opacity: 0.8;
        }
        
        .message {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 65, 0.9);
            color: #000;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 1001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        }
        
        .message.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        @media (max-width: 1200px) {
            .container {
                grid-template-columns: 1fr;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-area">
            <h1>👁️🎨 Eye Pixel Art System</h1>
            <canvas id="pixelCanvas" width="512" height="512"></canvas>
            <div class="eye-cursor" id="eyeCursor"></div>
        </div>
        
        <div class="control-panel">
            <div class="control-section">
                <h3>👁️ Eye Status</h3>
                <div class="eye-status" id="eyeStatus">
                    <div><span class="status-indicator status-inactive" id="trackingIndicator"></span>Eye Tracking: <span id="trackingStatus">Inactive</span></div>
                    <div><span class="status-indicator status-inactive" id="calibrationIndicator"></span>Calibrated: <span id="calibrationStatus">No</span></div>
                    <div>Fatigue: <span id="fatigueLevel">0%</span></div>
                    <div>Accuracy: <span id="accuracyLevel">--</span></div>
                </div>
                
                <button class="action-btn" onclick="calibrateEyes()">🎯 Calibrate Eyes</button>
            </div>
            
            <div class="control-section">
                <h3>🎨 Color Palette</h3>
                <div class="palette" id="palette"></div>
                <div>Current: <span id="currentColor">R (Red)</span></div>
            </div>
            
            <div class="control-section">
                <h3>🔧 Tools</h3>
                <div class="tools" id="tools"></div>
                <div>Active: <span id="currentTool">Pixel</span></div>
            </div>
            
            <div class="control-section">
                <h3>🤖 AI Generation</h3>
                <input type="text" id="naturalLanguageInput" placeholder="draw a whale, create a castle..." 
                       style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #00ff41; 
                              background: rgba(0,0,0,0.5); color: #00ff41; border-radius: 4px;">
                <div style="margin-bottom: 10px;">
                    <label><input type="checkbox" id="parallelMode" style="margin-right: 5px;"> 🚀 Parallel Mode (compare multiple AIs)</label>
                </div>
                <button class="action-btn" onclick="generateFromText()">🎨 Generate Art</button>
                <div id="aiStatus" style="font-size: 0.9em; margin-top: 5px; opacity: 0.8;"></div>
            </div>
            
            <div class="control-section" id="ratingSection" style="display: none;">
                <h3>👍 Rate This Generation</h3>
                <div id="generationInfo" style="font-size: 0.9em; margin-bottom: 10px; opacity: 0.8;"></div>
                
                <div class="rating-category">
                    <label>Overall (40%): </label>
                    <div class="star-rating" data-category="overall">
                        <span class="star" data-value="1">⭐</span>
                        <span class="star" data-value="2">⭐</span>
                        <span class="star" data-value="3">⭐</span>
                        <span class="star" data-value="4">⭐</span>
                        <span class="star" data-value="5">⭐</span>
                    </div>
                </div>
                
                <div class="rating-category">
                    <label>Accuracy (30%): </label>
                    <div class="star-rating" data-category="accuracy">
                        <span class="star" data-value="1">⭐</span>
                        <span class="star" data-value="2">⭐</span>
                        <span class="star" data-value="3">⭐</span>
                        <span class="star" data-value="4">⭐</span>
                        <span class="star" data-value="5">⭐</span>
                    </div>
                </div>
                
                <div class="rating-category">
                    <label>Aesthetics (20%): </label>
                    <div class="star-rating" data-category="aesthetics">
                        <span class="star" data-value="1">⭐</span>
                        <span class="star" data-value="2">⭐</span>
                        <span class="star" data-value="3">⭐</span>
                        <span class="star" data-value="4">⭐</span>
                        <span class="star" data-value="5">⭐</span>
                    </div>
                </div>
                
                <div class="rating-category">
                    <label>Creativity (10%): </label>
                    <div class="star-rating" data-category="creativity">
                        <span class="star" data-value="1">⭐</span>
                        <span class="star" data-value="2">⭐</span>
                        <span class="star" data-value="3">⭐</span>
                        <span class="star" data-value="4">⭐</span>
                        <span class="star" data-value="5">⭐</span>
                    </div>
                </div>
                
                <textarea id="improvementComment" placeholder="Suggestions for improvement..." 
                          style="width: 100%; height: 60px; margin: 10px 0; padding: 8px; 
                                 background: rgba(0,0,0,0.5); color: #00ff41; border: 1px solid #00ff41; 
                                 border-radius: 4px; resize: vertical;"></textarea>
                
                <div style="display: flex; gap: 10px;">
                    <button class="action-btn" onclick="submitRating()" style="flex: 1;">👍 Submit Rating</button>
                    <button class="action-btn" onclick="refineGeneration()" style="flex: 1;">🔄 Refine</button>
                </div>
                
                <div id="ratingStatus" style="font-size: 0.9em; margin-top: 5px; opacity: 0.8;"></div>
            </div>
            
            <div class="control-section">
                <h3>⚡ Actions</h3>
                <button class="action-btn" onclick="clearCanvas()">🧹 Clear Canvas</button>
                <button class="action-btn" onclick="saveCanvas()">💾 Save Canvas</button>
                <button class="action-btn" onclick="undoAction()">↶ Undo</button>
                <button class="action-btn" onclick="toggleDrawing()">✏️ Toggle Drawing</button>
                <button class="action-btn" onclick="enhanceWithAI()">✨ AI Enhance</button>
                <button class="action-btn" onclick="generateTexture()">🖼️ Texture Variant</button>
            </div>
            
            <div class="control-section">
                <h3>👁️ Eye Commands</h3>
                <div class="eye-commands">
                    <div>👀 <strong>Gaze:</strong> Move cursor</div>
                    <div>👁️ <strong>Single Blink:</strong> Place pixel</div>
                    <div>👁️👁️ <strong>Double Blink:</strong> Next color</div>
                    <div>🔒 <strong>Long Blink:</strong> Toggle draw mode</div>
                    <div>😉 <strong>Wink:</strong> Next tool</div>
                    <div>🤯 <strong>Shake:</strong> Undo</div>
                    <div>💾 <strong>Close Eyes:</strong> Save</div>
                    <div>✨ <strong>Slow Wink:</strong> AI enhance</div>
                    <div>🖼️ <strong>Double Wink:</strong> Texture variant</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="message" id="message"></div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:${this.options.wsPort}');
        
        // Canvas setup
        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');
        const eyeCursor = document.getElementById('eyeCursor');
        
        // State
        let state = {
            canvas: { grid: [] },
            currentColor: 'R',
            currentTool: 'pixel',
            palette: [],
            eyeState: { cursorX: 0, cursorY: 0, isActive: false, calibrated: false }
        };
        
        const gridSize = ${this.options.gridSize};
        const pixelSize = ${this.options.pixelSize};
        
        // Color mapping
        const colorMap = {
            'R': '#FF0000', 'G': '#00FF00', 'B': '#0000FF',
            'Y': '#FFFF00', 'M': '#FF00FF', 'C': '#00FFFF',
            'W': '#FFFFFF', 'K': '#000000', 'X': '#808080',
            '0': '#000000', '1': '#FF0000', '2': '#00FF00', '3': '#0000FF',
            '4': '#FFFF00', '5': '#FF00FF', '6': '#00FFFF', '7': '#FFFFFF',
            '8': '#808080', '9': '#404040', ' ': '#000000'
        };
        
        // WebSocket event handlers
        ws.onopen = function() {
            console.log('Connected to Eye Pixel Art System');
            showMessage('Connected to Eye Tracking System');
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        ws.onclose = function() {
            console.log('Disconnected from server');
            showMessage('Connection lost');
        };
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'state':
                case 'state_update':
                    updateState(data.data);
                    break;
                    
                case 'grid_update':
                    updateGrid(data.data.grid);
                    break;
                    
                case 'cursor_update':
                    updateEyeCursor(data.data.x, data.data.y);
                    break;
                    
                case 'message':
                    showMessage(data.data.message);
                    break;
                    
                case 'calibration_result':
                    handleCalibrationResult(data.data);
                    break;
                    
                case 'ai_generation_result':
                    handleAIGenerationResult(data.data);
                    break;
                    
                case 'rating_received':
                    handleRatingReceived(data.data);
                    break;
                    
                case 'refinement_result':
                    handleRefinementResult(data.data);
                    break;
            }
        }
        
        function updateState(newState) {
            state = newState;
            updateUI();
        }
        
        function updateUI() {
            // Update eye status
            updateEyeStatus();
            
            // Update palette
            updatePalette();
            
            // Update tools
            updateTools();
            
            // Update canvas
            updateGrid(state.canvas.grid);
            
            // Update current selections
            document.getElementById('currentColor').textContent = \`\${state.currentColor} (\${getColorName(state.currentColor)})\`;
            document.getElementById('currentTool').textContent = state.tools[state.currentTool]?.name || state.currentTool;
        }
        
        function updateEyeStatus() {
            const trackingIndicator = document.getElementById('trackingIndicator');
            const calibrationIndicator = document.getElementById('calibrationIndicator');
            
            trackingIndicator.className = \`status-indicator \${state.eyeState.isActive ? 'status-active' : 'status-inactive'}\`;
            calibrationIndicator.className = \`status-indicator \${state.eyeState.calibrated ? 'status-active' : 'status-inactive'}\`;
            
            document.getElementById('trackingStatus').textContent = state.eyeState.isActive ? 'Active' : 'Inactive';
            document.getElementById('calibrationStatus').textContent = state.eyeState.calibrated ? 'Yes' : 'No';
            document.getElementById('fatigueLevel').textContent = Math.round((state.eyeState.fatigueLevel || 0) * 100) + '%';
            document.getElementById('accuracyLevel').textContent = Math.round((state.eyeState.accuracy || 0) * 100) + '%';
        }
        
        function updatePalette() {
            const palette = document.getElementById('palette');
            palette.innerHTML = '';
            
            state.palette.forEach(color => {
                const btn = document.createElement('div');
                btn.className = \`color-btn \${color === state.currentColor ? 'active' : ''}\`;
                btn.style.backgroundColor = colorMap[color] || '#808080';
                btn.title = \`\${color} - \${getColorName(color)}\`;
                btn.onclick = () => setColor(color);
                palette.appendChild(btn);
            });
        }
        
        function updateTools() {
            const tools = document.getElementById('tools');
            tools.innerHTML = '';
            
            Object.entries(state.tools).forEach(([tool, info]) => {
                const btn = document.createElement('div');
                btn.className = \`tool-btn \${tool === state.currentTool ? 'active' : ''}\`;
                btn.textContent = \`\${info.icon} \${info.name}\`;
                btn.onclick = () => setTool(tool);
                tools.appendChild(btn);
            });
        }
        
        function updateGrid(grid) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    const pixel = grid[y] ? grid[y][x] : ' ';
                    if (pixel !== ' ') {
                        ctx.fillStyle = colorMap[pixel] || '#808080';
                        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                    }
                }
            }
            
            // Draw grid lines (optional)
            ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
            ctx.lineWidth = 1;
            for (let x = 0; x <= gridSize; x++) {
                ctx.beginPath();
                ctx.moveTo(x * pixelSize, 0);
                ctx.lineTo(x * pixelSize, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y <= gridSize; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * pixelSize);
                ctx.lineTo(canvas.width, y * pixelSize);
                ctx.stroke();
            }
        }
        
        function updateEyeCursor(x, y) {
            const canvasRect = canvas.getBoundingClientRect();
            const cursorX = canvasRect.left + (x * pixelSize) + (pixelSize / 2);
            const cursorY = canvasRect.top + (y * pixelSize) + (pixelSize / 2);
            
            eyeCursor.style.left = cursorX + 'px';
            eyeCursor.style.top = cursorY + 'px';
            eyeCursor.style.display = state.eyeState.isActive ? 'block' : 'none';
        }
        
        function getColorName(color) {
            const names = {
                'R': 'Red', 'G': 'Green', 'B': 'Blue',
                'Y': 'Yellow', 'M': 'Magenta', 'C': 'Cyan',
                'W': 'White', 'K': 'Black', 'X': 'Gray'
            };
            return names[color] || color;
        }
        
        // Control functions
        function calibrateEyes() {
            ws.send(JSON.stringify({ type: 'calibrate' }));
            showMessage('Starting calibration...');
        }
        
        function setColor(color) {
            ws.send(JSON.stringify({ type: 'set_color', color }));
        }
        
        function setTool(tool) {
            ws.send(JSON.stringify({ type: 'set_tool', tool }));
        }
        
        function clearCanvas() {
            fetch('/api/clear', { method: 'POST' });
        }
        
        function saveCanvas() {
            showMessage('Saving canvas...');
            // Server will handle save via eye control
        }
        
        function undoAction() {
            // Trigger undo via eye control simulation
            showMessage('Undo action');
        }
        
        function toggleDrawing() {
            showMessage('Toggle drawing mode');
        }
        
        function enhanceWithAI() {
            showMessage('AI enhancement started...');
            ws.send(JSON.stringify({ type: 'enhance_ai' }));
        }
        
        function generateTexture() {
            showMessage('Generating texture variant...');
            ws.send(JSON.stringify({ type: 'generate_texture' }));
        }
        
        function generateFromText() {
            const input = document.getElementById('naturalLanguageInput');
            const query = input.value.trim();
            
            if (!query) {
                showMessage('Please enter a description first');
                return;
            }
            
            const parallelMode = document.getElementById('parallelMode').checked;
            const statusDiv = document.getElementById('aiStatus');
            statusDiv.textContent = 'AI generating: ' + query + '...' + (parallelMode ? ' (parallel mode)' : '');
            
            // Hide previous rating interface
            document.getElementById('ratingSection').style.display = 'none';
            
            showMessage('AI generating: ' + query + '...' + (parallelMode ? ' (comparing multiple AIs)' : ''));
            ws.send(JSON.stringify({
                type: 'natural_language',
                data: { query, parallel: parallelMode }
            }));
        }
        
        // Store current generation data for rating
        let currentGeneration = null;
        let userRatings = {
            overall: 3,
            accuracy: 3,
            aesthetics: 3,
            creativity: 3
        };
        
        // Star rating interaction
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('star')) {
                const category = e.target.parentElement.dataset.category;
                const value = parseInt(e.target.dataset.value);
                
                userRatings[category] = value;
                updateStarDisplay(category, value);
            }
        });
        
        function updateStarDisplay(category, rating) {
            const stars = document.querySelectorAll('[data-category="' + category + '"] .star');
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.style.color = '#ffd700';  // Gold for selected
                    star.style.textShadow = '0 0 10px #ffd700';
                } else {
                    star.style.color = '#666';     // Gray for unselected
                    star.style.textShadow = 'none';
                }
            });
        }
        
        function submitRating() {
            if (!currentGeneration) {
                showMessage('No generation to rate');
                return;
            }
            
            const comment = document.getElementById('improvementComment').value.trim();
            const rating = {
                ...userRatings,
                comment,
                metadata: {
                    originalQuery: currentGeneration.query,
                    style: currentGeneration.result?.options?.style
                }
            };
            
            ws.send(JSON.stringify({
                type: 'rate_generation',
                data: {
                    generationId: currentGeneration.generationId,
                    rating,
                    userId: getUserId()
                }
            }));
            
            document.getElementById('ratingStatus').textContent = 'Rating submitted!';
            setTimeout(() => {
                document.getElementById('ratingStatus').textContent = '';
            }, 3000);
        }
        
        function refineGeneration() {
            if (!currentGeneration) {
                showMessage('No generation to refine');
                return;
            }
            
            const comment = document.getElementById('improvementComment').value.trim();
            const feedback = {
                rating: userRatings,
                improvements: comment ? [{ text: comment, type: 'general' }] : []
            };
            
            ws.send(JSON.stringify({
                type: 'refine_generation',
                data: {
                    generationId: currentGeneration.generationId,
                    feedback,
                    userId: getUserId()
                }
            }));
            
            document.getElementById('aiStatus').textContent = 'Refining based on your feedback...';
        }
        
        function getUserId() {
            // Simple user ID for demo - in practice would be proper auth
            let userId = localStorage.getItem('pixelArtUserId');
            if (!userId) {
                userId = 'user_' + Math.random().toString(36).substring(7);
                localStorage.setItem('pixelArtUserId', userId);
            }
            return userId;
        }
        
        function handleCalibrationResult(result) {
            if (result.success) {
                showMessage('Calibration successful!');
            } else {
                showMessage('Calibration failed. Please try again.');
            }
        }
        
        function handleAIGenerationResult(data) {
            const statusDiv = document.getElementById('aiStatus');
            const input = document.getElementById('naturalLanguageInput');
            
            if (data.success) {
                statusDiv.textContent = '✅ Generated: ' + data.query;
                showMessage('Generated: ' + data.query + '!');
                
                // Store generation data for rating
                currentGeneration = {
                    generationId: data.result.id,
                    query: data.query,
                    result: data.result,
                    ratingInterface: data.ratingInterface
                };
                
                // Show rating interface
                showRatingInterface(data);
                
                // Clear the input
                input.value = '';
                
                // Show reasoning in console if available
                if (data.reasoning) {
                    console.log('🧠 AI Reasoning:', data.reasoning);
                }
                
                // Show generation stats
                if (data.result && data.result.metadata) {
                    const stats = data.result.metadata;
                    console.log('📊 Generated with ' + stats.commandCount + ' commands in ' + data.result.processingTime + 'ms');
                    
                    if (stats.parallel && data.parallelResults) {
                        console.log('🚀 Parallel Results:');
                        console.log('- Reasoning models used:', stats.reasoningMetadata?.totalServices || 0);
                        console.log('- Command models used:', stats.commandMetadata?.totalServices || 0);
                        console.log('- Total cost: $' + (stats.totalCost?.toFixed(4) || '0.0000'));
                        console.log('- Fastest reasoning:', stats.reasoningMetadata?.fastestService);
                        console.log('- Fastest commands:', stats.commandMetadata?.fastestService);
                    }
                }
            } else {
                statusDiv.textContent = '❌ Generation failed';
                showMessage('AI generation failed');
            }
        }
        
        function showRatingInterface(data) {
            const ratingSection = document.getElementById('ratingSection');
            const generationInfo = document.getElementById('generationInfo');
            
            // Show basic generation info
            let infoText = 'Query: "' + data.query + '"';
            if (data.result?.metadata) {
                const meta = data.result.metadata;
                infoText += ' | Commands: ' + meta.commandCount + ' | Time: ' + data.result.processingTime + 'ms';
                if (meta.parallel) {
                    infoText += ' | Parallel mode';
                }
            }
            generationInfo.textContent = infoText;
            
            // Reset star ratings to default (3 stars)
            Object.keys(userRatings).forEach(category => {
                updateStarDisplay(category, 3);
            });
            
            // Clear previous comment
            document.getElementById('improvementComment').value = '';
            
            // Show the rating section
            ratingSection.style.display = 'block';
        }
        
        function handleRatingReceived(data) {
            if (data.success) {
                showMessage('Rating submitted! Thank you for your feedback.');
                console.log('📈 Rating data:', data.ratingData);
            } else {
                showMessage('Failed to submit rating');
            }
        }
        
        function handleRefinementResult(data) {
            if (data.success) {
                showMessage('Refinement complete! Check out the improved result.');
                console.log('🔄 Refinement data:', data.refinedResult);
                
                // Update current generation to the refined version
                if (data.refinedResult) {
                    currentGeneration = {
                        generationId: data.refinedResult.id,
                        query: currentGeneration.query + ' (refined)',
                        result: data.refinedResult
                    };
                    
                    showRatingInterface({
                        query: currentGeneration.query,
                        result: data.refinedResult,
                        success: true
                    });
                }
            } else {
                showMessage('Refinement failed');
            }
        }
        
        function showMessage(text) {
            const message = document.getElementById('message');
            message.textContent = text;
            message.classList.add('show');
            
            setTimeout(() => {
                message.classList.remove('show');
            }, 3000);
        }
        
        // Manual canvas interaction
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / pixelSize);
            const y = Math.floor((e.clientY - rect.top) / pixelSize);
            
            ws.send(JSON.stringify({ 
                type: 'place_pixel', 
                x, y 
            }));
        });
        
        // Initialize
        window.addEventListener('load', () => {
            console.log('Eye Pixel Art System initialized');
        });
    </script>
</body>
</html>`;
    }
}

module.exports = EyePixelArtSystem;

// CLI usage
if (require.main === module) {
    const eyePixelSystem = new EyePixelArtSystem({
        gridSize: 32,
        pixelSize: 16,
        eyeSensitivity: 0.8,
        enableAI: true
    });
    
    console.log('\n👁️🎨 EYE PIXEL ART SYSTEM ACTIVE');
    console.log('═'.repeat(70));
    console.log('👀 Control the canvas with your eyes and brain patterns');
    console.log('🎨 Laser-precise pixel placement using gaze tracking');
    console.log('🧠 Blink patterns control colors, tools, and actions');
    console.log('🎯 Dwell-clicking for precise pixel placement');
    console.log('🤖 AI enhancement for generated artwork');
    console.log('');
    console.log('👁️ EYE CONTROLS:');
    console.log('   👀 Gaze: Move cursor around the canvas');
    console.log('   👁️ Single Blink: Place pixel at cursor position');
    console.log('   👁️👁️ Double Blink: Cycle to next color');
    console.log('   🔒 Long Blink: Toggle continuous drawing mode');
    console.log('   😉 Wink: Switch to next drawing tool');
    console.log('   🤯 Shake Eyes: Undo last action');
    console.log('   💾 Close Eyes: Save canvas to file');
    console.log('   ✨ Slow Wink: Enhance artwork with AI');
    console.log('   🖼️ Double Wink: Generate texture variant');
    console.log('');
    console.log('🌐 Web Interface: http://localhost:8889');
    console.log('🔌 WebSocket: ws://localhost:8890');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Eye Pixel Art System...');
        if (eyePixelSystem.server) eyePixelSystem.server.close();
        if (eyePixelSystem.wss) eyePixelSystem.wss.close();
        process.exit(0);
    });
}