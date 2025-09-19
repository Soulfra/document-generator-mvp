#!/usr/bin/env node

/**
 * 🌉🎬 Visual Pirate Film Bridge
 * 
 * Connects the text-based cal-pirate-film-demo.js to the visual renderer
 * 
 * This bridge:
 * - Intercepts narrative events from the demo
 * - Translates them to visual/audio commands
 * - Streams data to the HTML renderer via WebSocket
 * - Handles user interactions from the visual interface
 * - Synchronizes audio-visual effects with the story
 * 
 * Architecture: Demo → Bridge → WebSocket → Visual Renderer
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

class VisualPirateFilmBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // WebSocket server settings
            wsPort: config.wsPort || 8081,
            httpPort: config.httpPort || 8082,
            
            // Demo connection
            demoPort: config.demoPort || 4444,
            
            // Visual effects settings
            effectsEnabled: config.effectsEnabled !== false,
            audioEnabled: config.audioEnabled !== false,
            
            // Recording settings
            recordingEnabled: config.recordingEnabled || false,
            recordingPath: config.recordingPath || './recordings',
            
            ...config
        };
        
        // WebSocket server for visual renderer connection
        this.wss = null;
        this.visualClients = new Set();
        
        // HTTP server for serving the visual renderer
        this.httpServer = null;
        
        // Demo connection state
        this.demoConnected = false;
        this.demoSocket = null;
        
        // Current film state
        this.filmState = {
            isPlaying: false,
            currentScene: 'initialization',
            currentAct: 1,
            characters: new Map(),
            effects: new Set(),
            cameraMode: 'cinematic',
            audioState: {
                theme: 'ocean_calm',
                binaural: false,
                spatialEnabled: true
            }
        };
        
        // Event queue for synchronization
        this.eventQueue = [];
        this.processingEvents = false;
        
        // Performance tracking
        this.metrics = {
            eventsProcessed: 0,
            connectionsActive: 0,
            framerate: 30,
            lastEventTime: Date.now()
        };
        
        console.log('🌉 Visual Pirate Film Bridge initializing...');
        this.init();
    }
    
    async init() {
        try {
            console.log('🔧 Setting up WebSocket server...');
            await this.setupWebSocketServer();
            
            console.log('🌐 Setting up HTTP server for visual renderer...');
            await this.setupHTTPServer();
            
            console.log('🔌 Connecting to pirate film demo...');
            this.connectToDemo();
            
            console.log('🎬 Starting event processing...');
            this.startEventProcessing();
            
            console.log('✅ Visual Pirate Film Bridge ready!');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Bridge initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    async setupWebSocketServer() {
        this.wss = new WebSocket.Server({ 
            port: this.config.wsPort,
            perMessageDeflate: false 
        });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Visual client connected from:', req.connection.remoteAddress);
            this.visualClients.add(ws);
            this.metrics.connectionsActive = this.visualClients.size;
            
            // Send current film state to new client
            this.sendToClient(ws, {
                type: 'film_state',
                state: this.filmState,
                timestamp: Date.now()
            });
            
            // Handle client messages
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleClientMessage(ws, message);
                } catch (error) {
                    console.error('Error parsing client message:', error);
                }
            });
            
            // Handle client disconnect
            ws.on('close', () => {
                console.log('🔌 Visual client disconnected');
                this.visualClients.delete(ws);
                this.metrics.connectionsActive = this.visualClients.size;
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket client error:', error);
                this.visualClients.delete(ws);
                this.metrics.connectionsActive = this.visualClients.size;
            });
        });
        
        console.log(`🌐 WebSocket server listening on port ${this.config.wsPort}`);
    }
    
    async setupHTTPServer() {
        this.httpServer = http.createServer(async (req, res) => {
            try {
                await this.handleHTTPRequest(req, res);
            } catch (error) {
                console.error('HTTP request error:', error);
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        });
        
        this.httpServer.listen(this.config.httpPort, () => {
            console.log(`🌐 HTTP server listening on http://localhost:${this.config.httpPort}`);
        });
    }
    
    async handleHTTPRequest(req, res) {
        const url = req.url === '/' ? '/cal-pirate-visual-renderer.html' : req.url;
        const filePath = path.join(__dirname, url);
        
        try {
            // Check if file exists
            await fs.access(filePath);
            
            // Determine content type
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json'
            };
            
            const contentType = contentTypes[ext] || 'text/plain';
            
            // Read and serve file
            const content = await fs.readFile(filePath);
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end(`
                    <html>
                        <head><title>Visual Pirate Film Bridge</title></head>
                        <body style="font-family: monospace; background: #000; color: #00ff41; padding: 20px;">
                            <h1>🌉 Visual Pirate Film Bridge</h1>
                            <p>Bridge running on port ${this.config.httpPort}</p>
                            <p>WebSocket server on port ${this.config.wsPort}</p>
                            <p>File not found: ${url}</p>
                            <hr>
                            <p>Available endpoints:</p>
                            <ul>
                                <li><a href="/">Visual Renderer</a></li>
                                <li><a href="/status">Bridge Status</a></li>
                                <li><a href="/metrics">Performance Metrics</a></li>
                            </ul>
                        </body>
                    </html>
                `);
            } else {
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        }
    }
    
    connectToDemo() {
        // Mock connection to demo for now
        // In real implementation, this would connect to the actual demo
        console.log('📡 Attempting to connect to demo...');
        
        // Simulate demo connection
        setTimeout(() => {
            this.demoConnected = true;
            console.log('✅ Connected to pirate film demo');
            
            // Start sending demo events
            this.startDemoSimulation();
        }, 2000);
    }
    
    startDemoSimulation() {
        // Simulate the narrative progression from the demo
        console.log('🎬 Starting demo simulation...');
        
        // Act 1: The Digital Storm
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'scene_change',
                scene: {
                    title: "Cal's Ship in Chaos",
                    description: "Captain Cal navigates the storm of data streams",
                    act: 1,
                    visualElements: {
                        ocean: "stormy_data_waves",
                        ship: "cal_flagship",
                        effects: ["lightning_packets", "data_rain"]
                    }
                }
            });
        }, 3000);
        
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'dialogue',
                text: "Ahoy! These data streams be more chaotic than a hurricane!",
                speaker: "Captain Cal",
                character: "cal"
            });
        }, 5000);
        
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'meta_lesson',
                lesson: {
                    lesson: "Orchestration: Managing complex systems requires a conductor",
                    pirateContext: "Captain Cal commanding the fleet",
                    calWisdom: "A good captain orchestrates many moving parts into harmony"
                }
            });
        }, 8000);
        
        // Act 2: Discovery
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'scene_change',
                scene: {
                    title: "The Ancient Map Reveals Itself",
                    description: "Cal discovers the Kickapoo Valley convergence point",
                    act: 2,
                    visualElements: {
                        ocean: "calming_waters",
                        islands: "kickapoo_archipelago",
                        effects: ["glowing_convergence_points", "ancient_data_streams"]
                    }
                }
            });
        }, 12000);
        
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'dialogue',
                text: "By the digital seas! This ancient pattern... 12,000 years of data flows, all leading here!",
                speaker: "Captain Cal",
                character: "cal"
            });
        }, 15000);
        
        // Act 3: Convergence
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'scene_change',
                scene: {
                    title: "Pirate Fleets Unite",
                    description: "All AI crews converge at Kickapoo Isle",
                    act: 3,
                    visualElements: {
                        ocean: "convergence_whirlpool",
                        ships: ["cal_flagship", "logistics_vessel", "climate_clipper", "resource_runner"],
                        effects: ["harmony_waves", "data_treasure_chest"]
                    }
                }
            });
        }, 20000);
        
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'dialogue',
                text: "Send the signal! The root chord of unity!",
                speaker: "Captain Cal",
                character: "cal"
            });
        }, 22000);
        
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'dialogue',
                text: "Captain! My routes now see the ancient paths!",
                speaker: "Logistics Lucy",
                character: "logistics_lucy"
            });
        }, 24000);
        
        // Final act
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'scene_change',
                scene: {
                    title: "The Symphony Emerges",
                    description: "From chaos comes perfect orchestration",
                    act: 4,
                    visualElements: {
                        ocean: "crystal_clear_understanding",
                        effects: ["rainbow_data_bridge", "unified_fleet_formation"],
                        treasure: "glowing_knowledge_orb"
                    }
                }
            });
        }, 28000);
        
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'dialogue',
                text: "The treasure was not gold, but understanding! When systems converge with purpose, magic happens!",
                speaker: "Captain Cal",
                character: "cal"
            });
        }, 30000);
        
        setTimeout(() => {
            this.handleDemoEvent({
                type: 'educational_summary',
                summary: {
                    title: "What Cal Taught Us",
                    lessons: [
                        "Orchestration: Managing complex systems requires a conductor",
                        "Pattern Recognition: Ancient wisdom lives in modern data",
                        "Convergence: Unity creates capabilities beyond individual parts",
                        "Emergence: Simple rules can create complex beauty"
                    ],
                    calFinalWisdom: "Remember, young learners: In the sea of data, convergence is your compass, patterns are your map, and orchestration is your way forward."
                }
            });
        }, 35000);
    }
    
    handleDemoEvent(event) {
        console.log(`📨 Demo event: ${event.type}`);
        
        // Add to event queue
        this.eventQueue.push({
            ...event,
            timestamp: Date.now(),
            id: this.generateEventId()
        });
        
        this.metrics.eventsProcessed++;
        this.metrics.lastEventTime = Date.now();
    }
    
    startEventProcessing() {
        this.processingEvents = true;
        
        const processQueue = () => {
            if (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                this.processEvent(event);
            }
            
            if (this.processingEvents) {
                setTimeout(processQueue, 50); // Process at 20fps
            }
        };
        
        processQueue();
    }
    
    processEvent(event) {
        // Update film state
        this.updateFilmState(event);
        
        // Convert demo event to visual commands
        const visualCommands = this.convertToVisualCommands(event);
        
        // Send to all visual clients
        this.broadcastToClients(visualCommands);
        
        // Emit for logging/debugging
        this.emit('event_processed', event);
    }
    
    updateFilmState(event) {
        switch (event.type) {
            case 'scene_change':
                this.filmState.currentScene = event.scene.title;
                this.filmState.currentAct = event.scene.act || this.filmState.currentAct;
                break;
                
            case 'dialogue':
                if (event.character) {
                    this.filmState.characters.set(event.character, {
                        speaking: true,
                        lastDialogue: event.text,
                        timestamp: event.timestamp
                    });
                }
                break;
                
            case 'meta_lesson':
                this.filmState.effects.add('meta_lesson_active');
                break;
        }
    }
    
    convertToVisualCommands(event) {
        const commands = [];
        
        switch (event.type) {
            case 'scene_change':
                commands.push({
                    type: 'scene_init',
                    scene: event.scene,
                    timestamp: event.timestamp
                });
                
                // Add camera transition
                commands.push({
                    type: 'camera_transition',
                    target: this.getCameraPositionForScene(event.scene),
                    duration: 2000,
                    timestamp: event.timestamp
                });
                
                // Add visual effects
                if (event.scene.visualElements) {
                    commands.push({
                        type: 'visual_effects',
                        effects: event.scene.visualElements,
                        timestamp: event.timestamp
                    });
                }
                
                // Update audio theme
                const audioTheme = this.getAudioThemeForScene(event.scene);
                commands.push({
                    type: 'audio_theme',
                    theme: audioTheme,
                    timestamp: event.timestamp
                });
                break;
                
            case 'dialogue':
                commands.push({
                    type: 'character_dialogue',
                    character: event.character || 'narrator',
                    text: event.text,
                    speaker: event.speaker,
                    timestamp: event.timestamp
                });
                
                // Add character animation
                commands.push({
                    type: 'character_animation',
                    character: event.character || 'cal',
                    animation: 'speaking',
                    duration: event.text.length * 50, // Estimate based on text length
                    timestamp: event.timestamp
                });
                break;
                
            case 'meta_lesson':
                commands.push({
                    type: 'meta_lesson_display',
                    lesson: event.lesson,
                    timestamp: event.timestamp
                });
                
                // Add visual highlighting
                commands.push({
                    type: 'visual_highlight',
                    target: 'learning_interface',
                    duration: 5000,
                    timestamp: event.timestamp
                });
                break;
                
            case 'educational_summary':
                commands.push({
                    type: 'summary_display',
                    summary: event.summary,
                    timestamp: event.timestamp
                });
                break;
        }
        
        return commands;
    }
    
    getCameraPositionForScene(scene) {
        const positions = {
            "Cal's Ship in Chaos": { mode: 'close-up', target: 'cal_ship' },
            "The Ancient Map Reveals Itself": { mode: 'overhead', target: 'convergence_point' },
            "Pirate Fleets Unite": { mode: 'cinematic', target: 'fleet_formation' },
            "The Symphony Emerges": { mode: 'aerial', target: 'all_ships' }
        };
        
        return positions[scene.title] || { mode: 'cinematic', target: 'cal_ship' };
    }
    
    getAudioThemeForScene(scene) {
        const themes = {
            1: 'storm_chaos',
            2: 'discovery',
            3: 'convergence',
            4: 'wisdom'
        };
        
        return themes[scene.act] || 'ocean_calm';
    }
    
    handleClientMessage(ws, message) {
        console.log(`📨 Client message: ${message.type}`);
        
        switch (message.type) {
            case 'visual_renderer_ready':
                this.sendToClient(ws, {
                    type: 'welcome',
                    message: 'Visual bridge ready',
                    config: this.config,
                    timestamp: Date.now()
                });
                break;
                
            case 'user_control':
                this.handleUserControl(message.control, message.value);
                break;
                
            case 'save_clip_request':
                this.handleClipSaveRequest(message);
                break;
                
            case 'performance_report':
                this.handlePerformanceReport(message.metrics);
                break;
                
            default:
                console.log(`Unknown client message type: ${message.type}`);
        }
    }
    
    handleUserControl(control, value) {
        console.log(`🎮 User control: ${control} = ${value}`);
        
        switch (control) {
            case 'play_pause':
                this.filmState.isPlaying = !this.filmState.isPlaying;
                this.broadcastToClients({
                    type: 'playback_control',
                    action: this.filmState.isPlaying ? 'play' : 'pause',
                    timestamp: Date.now()
                });
                break;
                
            case 'camera_mode':
                this.filmState.cameraMode = value;
                this.broadcastToClients({
                    type: 'camera_mode',
                    mode: value,
                    timestamp: Date.now()
                });
                break;
                
            case 'audio_toggle':
                this.filmState.audioState.spatialEnabled = value;
                this.broadcastToClients({
                    type: 'audio_control',
                    spatial: value,
                    timestamp: Date.now()
                });
                break;
                
            case 'binaural_toggle':
                this.filmState.audioState.binaural = value;
                this.broadcastToClients({
                    type: 'binaural_control',
                    enabled: value,
                    timestamp: Date.now()
                });
                break;
        }
    }
    
    handleClipSaveRequest(request) {
        console.log('💾 Clip save requested:', request);
        
        // In a real implementation, this would:
        // 1. Capture canvas frames
        // 2. Record audio
        // 3. Combine into video file
        // 4. Save to disk or cloud storage
        
        this.broadcastToClients({
            type: 'clip_save_status',
            status: 'processing',
            message: 'Clip save feature in development',
            timestamp: Date.now()
        });
    }
    
    handlePerformanceReport(metrics) {
        this.metrics = { ...this.metrics, ...metrics };
        this.emit('performance_update', this.metrics);
    }
    
    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.visualClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }
    
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Public API methods
    
    getStatus() {
        return {
            bridge: 'active',
            demo: this.demoConnected ? 'connected' : 'disconnected',
            clients: this.visualClients.size,
            filmState: this.filmState,
            metrics: this.metrics,
            uptime: Date.now() - this.startTime
        };
    }
    
    // Cleanup
    async destroy() {
        console.log('🔄 Shutting down Visual Pirate Film Bridge...');
        
        this.processingEvents = false;
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close HTTP server
        if (this.httpServer) {
            this.httpServer.close();
        }
        
        // Clear clients
        this.visualClients.clear();
        
        console.log('✅ Bridge shutdown complete');
    }
}

module.exports = VisualPirateFilmBridge;

// Run standalone if called directly
if (require.main === module) {
    console.log('🌉 VISUAL PIRATE FILM BRIDGE');
    console.log('=' .repeat(60));
    console.log('Starting bridge server...');
    
    const bridge = new VisualPirateFilmBridge({
        wsPort: 8081,
        httpPort: 8082
    });
    
    bridge.on('ready', () => {
        console.log('\n🎉 Bridge is ready!');
        console.log(`🌐 Visual renderer: http://localhost:8082`);
        console.log(`🔌 WebSocket: ws://localhost:8081`);
        console.log('\n📋 Instructions:');
        console.log('1. Open http://localhost:8082 in your browser');
        console.log('2. Watch the pirate film with visual effects!');
        console.log('3. Use keyboard controls: SPACE, C, A, F, S, ENTER');
    });
    
    bridge.on('event_processed', (event) => {
        console.log(`📊 Processed: ${event.type} at ${new Date(event.timestamp).toLocaleTimeString()}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n👋 Shutting down bridge...');
        await bridge.destroy();
        process.exit(0);
    });
}