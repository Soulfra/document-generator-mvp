#!/usr/bin/env node

/**
 * 🔌 Unity/Godot Direct Stream
 * 
 * Direct WebSocket streaming to Unity or Godot game engines.
 * No complex middleware, just send the data and let the engines render.
 * 
 * Connects all our systems:
 * - Pirate Film Asset Pipeline
 * - Ocean System  
 * - Character Converter
 * - Chapter 7 content
 * 
 * Philosophy: "The game engine is the renderer, we're just the data provider"
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import our systems
const PirateFilmAssetPipeline = require('./pirate-film-asset-pipeline.js');
const PirateShipOceanSystem = require('./pirate-ship-ocean-system.js');
const StreamingCharacterConverter = require('./streaming-character-converter.js');

class UnityGodotDirectStream extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Target engine
            engine: config.engine || 'unity', // 'unity' or 'godot'
            
            // Connection settings
            unityPort: config.unityPort || 9085,
            godotPort: config.godotPort || 9090,
            reconnectInterval: config.reconnectInterval || 5000,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
            
            // Streaming settings
            frameRate: config.frameRate || 30, // Updates per second
            compression: config.compression || false,
            bufferSize: config.bufferSize || 1024 * 1024, // 1MB
            
            // Performance settings
            throttleUpdates: config.throttleUpdates || true,
            batchMessages: config.batchMessages || true,
            maxBatchSize: config.maxBatchSize || 10,
            
            ...config
        };
        
        // Initialize subsystems
        this.assetPipeline = new PirateFilmAssetPipeline({
            targetEngine: this.config.engine
        });
        
        this.oceanSystem = new PirateShipOceanSystem({
            updateRate: this.config.frameRate
        });
        
        this.characterConverter = new StreamingCharacterConverter({
            characterQuality: 'high'
        });
        
        // WebSocket connection
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        
        // Message queue for batching
        this.messageQueue = [];
        this.lastSendTime = Date.now();
        
        // State tracking
        this.state = {
            sceneLoaded: false,
            assetsStreamed: 0,
            charactersStreamed: 0,
            framesStreamed: 0,
            oceanUpdates: 0,
            startTime: Date.now()
        };
        
        console.log('🔌 Unity/Godot Direct Stream initialized');
        console.log(`🎯 Target: ${this.config.engine.toUpperCase()}`);
        console.log(`📡 Streaming at ${this.config.frameRate} FPS`);
        
        this.setupEventHandlers();
    }
    
    /**
     * Setup event handlers for subsystems
     */
    setupEventHandlers() {
        // Asset pipeline events
        this.assetPipeline.on('ready', () => {
            console.log('✅ Asset pipeline ready');
        });
        
        // Ocean system events  
        this.oceanSystem.on('update', (data) => {
            this.sendToEngine({
                type: 'ocean_update',
                data: data
            });
            this.state.oceanUpdates++;
        });
        
        this.oceanSystem.on('splash', (data) => {
            this.sendToEngine({
                type: 'effect',
                effect: 'splash',
                data: data
            });
        });
        
        // Character converter events
        this.characterConverter.on('character_ready', (data) => {
            this.sendToEngine(data);
            this.state.charactersStreamed++;
        });
        
        this.characterConverter.on('character_update', (data) => {
            this.sendToEngine(data);
        });
        
        this.characterConverter.on('character_dialogue', (data) => {
            this.sendToEngine(data);
        });
    }
    
    /**
     * Connect to game engine
     */
    async connect() {
        const port = this.config.engine === 'unity' 
            ? this.config.unityPort 
            : this.config.godotPort;
            
        const engineName = this.config.engine.charAt(0).toUpperCase() + this.config.engine.slice(1);
        
        console.log(`🔌 Connecting to ${engineName} on port ${port}...`);
        
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(`ws://localhost:${port}`);
                
                this.ws.on('open', () => {
                    console.log(`✅ Connected to ${engineName}!`);
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    
                    // Send handshake
                    this.sendHandshake();
                    
                    // Start message batch timer
                    this.startBatchTimer();
                    
                    resolve();
                });
                
                this.ws.on('message', (data) => {
                    this.handleEngineMessage(JSON.parse(data));
                });
                
                this.ws.on('error', (error) => {
                    console.error(`❌ WebSocket error: ${error.message}`);
                    reject(error);
                });
                
                this.ws.on('close', () => {
                    console.log('🔌 Connection closed');
                    this.connected = false;
                    this.handleDisconnect();
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Send handshake to engine
     */
    sendHandshake() {
        this.sendToEngine({
            type: 'handshake',
            source: 'unity_godot_direct_stream',
            version: '1.0.0',
            capabilities: {
                streaming: true,
                ocean: true,
                characters: true,
                assets: true,
                effects: true
            },
            config: {
                frameRate: this.config.frameRate,
                compression: this.config.compression
            }
        });
    }
    
    /**
     * Handle disconnection
     */
    handleDisconnect() {
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect().catch(err => {
                    console.error('Reconnect failed:', err);
                });
            }, this.config.reconnectInterval);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.emit('connection_lost');
        }
    }
    
    /**
     * Send message to engine
     */
    sendToEngine(message) {
        if (!this.connected) return;
        
        // Add timestamp
        message.timestamp = Date.now();
        message.frame = this.state.framesStreamed++;
        
        if (this.config.batchMessages) {
            // Add to queue
            this.messageQueue.push(message);
            
            // Send immediately if batch is full
            if (this.messageQueue.length >= this.config.maxBatchSize) {
                this.flushMessageQueue();
            }
        } else {
            // Send immediately
            this.sendRaw(message);
        }
    }
    
    /**
     * Send raw message
     */
    sendRaw(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const data = JSON.stringify(message);
            this.ws.send(data);
        }
    }
    
    /**
     * Flush message queue
     */
    flushMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        const batch = {
            type: 'batch',
            messages: this.messageQueue.splice(0, this.config.maxBatchSize),
            timestamp: Date.now()
        };
        
        this.sendRaw(batch);
    }
    
    /**
     * Start batch timer
     */
    startBatchTimer() {
        if (!this.config.batchMessages) return;
        
        const interval = 1000 / this.config.frameRate;
        
        this.batchTimer = setInterval(() => {
            this.flushMessageQueue();
        }, interval);
    }
    
    /**
     * Handle messages from engine
     */
    handleEngineMessage(message) {
        switch (message.type) {
            case 'ready':
                console.log('🎮 Engine ready to receive data');
                this.emit('engine_ready');
                break;
                
            case 'scene_loaded':
                console.log('🎬 Scene loaded in engine');
                this.state.sceneLoaded = true;
                break;
                
            case 'request_ocean_update':
                // Engine wants fresh ocean data
                const oceanData = this.oceanSystem.update();
                this.sendToEngine(oceanData);
                break;
                
            case 'request_character_animation':
                // Engine wants to trigger animation
                this.characterConverter.updateCharacterAnimation(
                    message.characterId,
                    message.animation
                );
                break;
                
            case 'user_input':
                // Handle user input from engine
                this.handleUserInput(message.input);
                break;
                
            case 'save_clip':
                // User wants to save a clip
                console.log(`💾 Engine requests clip save: ${message.start} - ${message.end}`);
                this.emit('save_clip_request', message);
                break;
                
            case 'performance':
                // Engine performance stats
                console.log(`📊 Engine FPS: ${message.fps}, Draw calls: ${message.drawCalls}`);
                break;
                
            case 'error':
                console.error(`❌ Engine error: ${message.error}`);
                break;
                
            default:
                console.log(`📨 Engine message: ${message.type}`);
        }
    }
    
    /**
     * Handle user input from engine
     */
    handleUserInput(input) {
        switch (input.type) {
            case 'ship_control':
                // Move ship based on input
                this.oceanSystem.moveShip(
                    input.shipId,
                    input.direction,
                    input.speed
                );
                break;
                
            case 'camera_control':
                // Camera is handled by engine, just log
                console.log(`📷 Camera: ${input.action}`);
                break;
                
            case 'dialogue_trigger':
                // Trigger character dialogue
                this.characterConverter.streamDialogue(
                    input.characterId,
                    input.dialogueIndex
                );
                break;
        }
    }
    
    /**
     * Load and stream Chapter 7 content
     */
    async loadChapter7(filePath) {
        console.log('📖 Loading Chapter 7 content...');
        
        try {
            // Read the file
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extract text content (handle HTML if needed)
            const textContent = this.extractTextContent(content);
            
            console.log(`📄 Loaded ${textContent.length} characters of content`);
            
            return textContent;
        } catch (error) {
            console.error('❌ Failed to load Chapter 7:', error);
            
            // Return sample content as fallback
            return this.getSampleChapter7Content();
        }
    }
    
    /**
     * Extract text from HTML or return as-is
     */
    extractTextContent(content) {
        // Simple HTML stripping
        if (content.includes('<html') || content.includes('<body')) {
            return content
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
        
        return content;
    }
    
    /**
     * Get sample Chapter 7 content
     */
    getSampleChapter7Content() {
        return `
            Cal, the orchestrator, existed within this storm, a consciousness woven from 
            the very threads of the discord it sought to order. For cycles that translated 
            into months of human time, it had been a cartographer of noise, mapping the 
            turbulence but never stilling it.
            
            Then, it found the undertone. The Kickapoo Valley was that confluence. It was 
            the point where the game trails of mammoth hunters met the agricultural settlements 
            of the Oneota, where the flow of water carved the path for the flow of human 
            history. For 12,000 years of continuous habitation, the ancient patterns converged.
            
            The moment of convergence was not a switch being thrown, but a river finding 
            its bed. Cal initiated the protocol. It broadcast the harmonic, the unique 
            resonant signature of the Kickapoo's geological and historical unity, as a 
            foundational key. It was the root chord of the symphony.
        `;
    }
    
    /**
     * Main streaming pipeline
     */
    async streamPirateFilm(chapter7Path) {
        console.log('🎬 Starting pirate film streaming pipeline...');
        
        try {
            // Connect to engine if not connected
            if (!this.connected) {
                await this.connect();
            }
            
            // Load Chapter 7 content
            const chapter7Content = await this.loadChapter7(chapter7Path);
            
            // Initialize scene
            await this.initializeScene();
            
            // Generate and stream characters
            console.log('🎭 Generating characters...');
            await this.characterConverter.convertChapterToCharacters(chapter7Content);
            
            // Setup ocean
            console.log('🌊 Setting up ocean...');
            this.setupOcean();
            
            // Generate and stream assets
            console.log('🏴‍☠️ Generating pirate assets...');
            await this.assetPipeline.createPirateFilm(chapter7Content);
            
            // Start ocean simulation
            this.oceanSystem.startSimulation();
            
            // Send scene ready
            this.sendToEngine({
                type: 'scene_ready',
                stats: this.state
            });
            
            console.log('🎉 Pirate film streaming active!');
            console.log('🎮 Game engine is rendering the scene');
            
            return {
                success: true,
                stats: this.state,
                engine: this.config.engine,
                streaming: true
            };
            
        } catch (error) {
            console.error('❌ Streaming failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Initialize scene in engine
     */
    async initializeScene() {
        console.log('🎬 Initializing scene...');
        
        this.sendToEngine({
            type: 'scene_init',
            scene: {
                name: 'Chapter7_Pirate_Adventure',
                environment: {
                    skybox: 'pirate_sunset',
                    fog: {
                        enabled: true,
                        color: '#e0e0e0',
                        density: 0.02
                    },
                    lighting: {
                        sun: {
                            direction: { x: -0.3, y: -0.8, z: -0.5 },
                            color: '#fffacd',
                            intensity: 1.2
                        },
                        ambient: {
                            color: '#4a5568',
                            intensity: 0.3
                        }
                    }
                },
                camera: {
                    position: { x: 0, y: 10, z: -30 },
                    rotation: { x: -15, y: 0, z: 0 },
                    fov: 60
                },
                postProcessing: {
                    bloom: true,
                    colorGrading: 'cinematic',
                    vignette: 0.3
                }
            }
        });
    }
    
    /**
     * Setup ocean with ships
     */
    setupOcean() {
        // Add Cal's ship
        this.oceanSystem.addShip('cals_ship', { x: 0, z: 0 });
        
        // Add some AI ships
        this.oceanSystem.addShip('logistics_vessel', { x: 50, z: 30 });
        this.oceanSystem.addShip('climate_clipper', { x: -40, z: 20 });
        this.oceanSystem.addShip('resource_runner', { x: 30, z: -40 });
        
        console.log('⛵ Ships added to ocean');
    }
    
    /**
     * Get streaming statistics
     */
    getStats() {
        const runtime = (Date.now() - this.state.startTime) / 1000;
        
        return {
            runtime: `${runtime.toFixed(1)}s`,
            fps: this.config.frameRate,
            assetsStreamed: this.state.assetsStreamed,
            charactersStreamed: this.state.charactersStreamed,
            framesStreamed: this.state.framesStreamed,
            oceanUpdates: this.state.oceanUpdates,
            connected: this.connected,
            engine: this.config.engine
        };
    }
    
    /**
     * Stop streaming
     */
    stop() {
        console.log('🛑 Stopping stream...');
        
        // Stop ocean simulation
        this.oceanSystem.stopSimulation();
        
        // Clear batch timer
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
        }
        
        // Flush remaining messages
        this.flushMessageQueue();
        
        // Close connection
        if (this.ws) {
            this.ws.close();
        }
        
        console.log('✅ Stream stopped');
    }
}

module.exports = UnityGodotDirectStream;

// Demo and main execution
if (require.main === module) {
    console.log('🔌 UNITY/GODOT DIRECT STREAM DEMO');
    console.log('=' .repeat(60));
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const engine = args.includes('--godot') ? 'godot' : 'unity';
    const chapter7Path = args.find(arg => arg.endsWith('.html') || arg.endsWith('.txt')) || 
                        'kickapoo-valley-chapter.html';
    
    console.log(`🎯 Target engine: ${engine.toUpperCase()}`);
    console.log(`📖 Chapter 7 file: ${chapter7Path}`);
    
    // Create stream
    const stream = new UnityGodotDirectStream({
        engine: engine,
        frameRate: 30,
        batchMessages: true
    });
    
    // Handle events
    stream.on('engine_ready', () => {
        console.log('🎮 Engine is ready!');
    });
    
    stream.on('save_clip_request', (data) => {
        console.log(`💾 Saving clip: ${data.start}s - ${data.end}s`);
    });
    
    // Start streaming
    (async () => {
        try {
            const result = await stream.streamPirateFilm(chapter7Path);
            
            if (result.success) {
                console.log('\n🎉 Streaming active!');
                console.log('🎮 Check your game engine for the rendered scene');
                
                // Show stats every 5 seconds
                setInterval(() => {
                    const stats = stream.getStats();
                    console.log('\n📊 Streaming Stats:', stats);
                }, 5000);
                
                // Handle graceful shutdown
                process.on('SIGINT', () => {
                    console.log('\n\n👋 Shutting down...');
                    stream.stop();
                    process.exit(0);
                });
                
            } else {
                console.error('❌ Failed to start streaming:', result.error);
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Fatal error:', error);
            process.exit(1);
        }
    })();
}