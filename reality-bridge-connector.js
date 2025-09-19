#!/usr/bin/env node

/**
 * REALITY BRIDGE CONNECTOR
 * Integrates the REALITY-SHADOW-MAP-ENGINE.js with centipede ecosystem
 * Creates dual-layer reality with lag between god view and player view
 * Connects: Centipede → Ships → Brain → Body → Reality Engine
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const RealityShadowMapEngine = require('./REALITY-SHADOW-MAP-ENGINE.js');

class RealityBridgeConnector extends EventEmitter {
    constructor() {
        super();
        
        // Core systems
        this.realityEngine = null;
        this.connectedSystems = new Map();
        this.lagProcessor = null;
        
        // Dual reality state
        this.godView = {
            entities: new Map(),
            timestamp: Date.now(),
            truths: new Map()
        };
        
        this.playerView = {
            entities: new Map(),
            timestamp: Date.now(),
            illusions: new Map()
        };
        
        // Lag configuration
        this.lagSettings = {
            baseDelay: 850,          // 850ms lag between realities
            oscillationRange: 200,   // ±200ms oscillation
            blackScreenBuffer: 100,  // 100ms black screen processing
            realitySwingRate: 2000   // 2 second swing cycles
        };
        
        // System registry
        this.systemComponents = {
            centipede: null,
            ships: null,
            brain: null,
            bodyEcosystem: null,
            steganography: null,
            economics: null,
            physics: null
        };
        
        // Reality oscillation state
        this.oscillationState = {
            phase: 0,
            direction: 1,
            lastSwing: Date.now(),
            isBlackScreen: false
        };
        
        this.init();
    }
    
    async init() {
        console.log('🌉 REALITY BRIDGE CONNECTOR INITIALIZING...');
        
        // Initialize Reality Shadow Map Engine
        await this.initializeRealityEngine();
        
        // Start lag processor
        this.startLagProcessor();
        
        // Start reality oscillation
        this.startRealityOscillation();
        
        // Connect to existing systems
        await this.connectExistingSystems();
        
        // Start bridge services
        this.startBridgeServices();
        
        console.log('✅ Reality Bridge online - dual reality active!');
    }
    
    async initializeRealityEngine() {
        try {
            this.realityEngine = new RealityShadowMapEngine();
            
            // Listen for reality engine events
            this.realityEngine.on('layer-change', (data) => {
                this.handleLayerChange(data);
            });
            
            // Register centipede ecosystem as entities
            await this.registerCentipedeEcosystem();
            
            console.log('✅ Reality Engine connected');
        } catch (error) {
            console.warn('⚠️ Reality Engine not available, using fallback mode');
            this.createFallbackRealityEngine();
        }
    }
    
    createFallbackRealityEngine() {
        // Minimal fallback if main engine fails
        this.realityEngine = {
            entities: new Map(),
            shadows: new Map(),
            trackEntity: async (id, type) => {
                this.realityEngine.entities.set(id, {
                    id, type,
                    realPosition: { x: 0, y: 0, z: 0 },
                    shadowPosition: { x: 0, y: 0, z: 0 }
                });
            },
            updateEntityPosition: (id, pos) => {
                if (this.realityEngine.entities.has(id)) {
                    this.realityEngine.entities.get(id).realPosition = pos;
                }
            }
        };
    }
    
    async registerCentipedeEcosystem() {
        // Register centipede as primary entity
        await this.realityEngine.trackEntity('centipede_main', 'centipede');
        
        // Register centipede segments
        for (let i = 0; i < 10; i++) {
            await this.realityEngine.trackEntity(`centipede_segment_${i}`, 'segment');
        }
        
        // Register fishing line
        await this.realityEngine.trackEntity('fishing_line', 'line');
        
        // Register brain
        await this.realityEngine.trackEntity('autonomous_brain', 'brain');
        
        // Register body systems
        const bodySystems = ['heart', 'lungs', 'liver', 'brain', 'stomach'];
        for (const system of bodySystems) {
            await this.realityEngine.trackEntity(`body_${system}`, 'organ');
        }
        
        // Register ships
        await this.realityEngine.trackEntity('main_ship', 'ship');
        await this.realityEngine.trackEntity('blueprint_ship', 'blueprint');
    }
    
    startLagProcessor() {
        // Main lag processing loop
        setInterval(() => {
            this.processRealityLag();
        }, 16); // 60fps processing
        
        // Black screen buffer processing
        setInterval(() => {
            this.processBlackScreenBuffer();
        }, this.lagSettings.blackScreenBuffer);
    }
    
    processRealityLag() {
        const now = Date.now();
        const currentLag = this.calculateCurrentLag();
        
        // Process god view (real-time)
        this.updateGodView(now);
        
        // Process player view (delayed)
        this.updatePlayerView(now - currentLag);
        
        // Handle oscillation
        this.updateOscillation(now);
        
        // Broadcast state
        this.broadcastDualReality();
    }
    
    calculateCurrentLag() {
        const { baseDelay, oscillationRange } = this.lagSettings;
        const oscillation = Math.sin(this.oscillationState.phase) * oscillationRange;
        return baseDelay + oscillation;
    }
    
    updateGodView(timestamp) {
        // God view sees true state immediately
        this.realityEngine.entities.forEach((entity, id) => {
            this.godView.entities.set(id, {
                ...entity,
                timestamp,
                truth: true,
                realityLayer: 'god'
            });
        });
        
        this.godView.timestamp = timestamp;
    }
    
    updatePlayerView(laggedTimestamp) {
        // Player view sees delayed/modified state
        this.realityEngine.entities.forEach((entity, id) => {
            const shadow = this.realityEngine.shadows.get(id);
            
            if (shadow) {
                this.playerView.entities.set(id, {
                    ...entity,
                    position: shadow.position, // Show shadow position
                    timestamp: laggedTimestamp,
                    truth: false,
                    realityLayer: 'player',
                    lagAmount: Date.now() - laggedTimestamp
                });
            }
        });
        
        this.playerView.timestamp = laggedTimestamp;
    }
    
    startRealityOscillation() {
        setInterval(() => {
            this.oscillationState.phase += 0.1 * this.oscillationState.direction;
            
            // Swing direction every 2 seconds
            if (Date.now() - this.oscillationState.lastSwing > this.lagSettings.realitySwingRate) {
                this.oscillationState.direction *= -1;
                this.oscillationState.lastSwing = Date.now();
                
                // Trigger brief black screen
                this.triggerBlackScreen();
            }
        }, 50);
    }
    
    triggerBlackScreen() {
        this.oscillationState.isBlackScreen = true;
        
        // Emit black screen event
        this.emit('black-screen-start');
        
        setTimeout(() => {
            this.oscillationState.isBlackScreen = false;
            this.emit('black-screen-end');
        }, this.lagSettings.blackScreenBuffer);
    }
    
    processBlackScreenBuffer() {
        if (this.oscillationState.isBlackScreen) {
            // During black screen, process reality swaps
            this.processRealitySwap();
        }
    }
    
    processRealitySwap() {
        // Temporarily swap some god/player view elements
        const swapIds = Array.from(this.godView.entities.keys()).slice(0, 3);
        
        swapIds.forEach(id => {
            const godEntity = this.godView.entities.get(id);
            const playerEntity = this.playerView.entities.get(id);
            
            if (godEntity && playerEntity) {
                // Briefly show player what god sees
                const temp = { ...playerEntity.position };
                playerEntity.position = { ...godEntity.realPosition };
                // Then snap back on black screen end
                setTimeout(() => {
                    if (this.playerView.entities.has(id)) {
                        this.playerView.entities.get(id).position = temp;
                    }
                }, this.lagSettings.blackScreenBuffer - 10);
            }
        });
    }
    
    async connectExistingSystems() {
        console.log('🔗 Connecting to existing systems...');
        
        // Try to connect to centipede system
        try {
            const centipedeSystem = await this.loadSystemComponent('visual-centipede-authentication-system.html');
            this.systemComponents.centipede = centipedeSystem;
            console.log('✅ Centipede system connected');
        } catch (error) {
            console.warn('⚠️ Centipede system not found');
        }
        
        // Try to connect to ships
        try {
            const shipSystem = await this.loadSystemComponent('cal-vehicle-ship-system.js');
            this.systemComponents.ships = shipSystem;
            console.log('✅ Ship system connected');
        } catch (error) {
            console.warn('⚠️ Ship system not found');
        }
        
        // Try to connect to brain
        try {
            const brainSystem = await this.loadSystemComponent('autonomous-game-player-brain.js');
            this.systemComponents.brain = brainSystem;
            console.log('✅ Brain system connected');
        } catch (error) {
            console.warn('⚠️ Brain system not found');
        }
        
        // Connect other components...
        await this.connectRemainingComponents();
    }
    
    async loadSystemComponent(filename) {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            const filepath = path.join(__dirname, filename);
            const content = await fs.readFile(filepath, 'utf-8');
            
            // Return a mock component interface
            return {
                filename,
                loaded: true,
                content: content.length,
                interface: this.createComponentInterface(filename)
            };
        } catch (error) {
            throw new Error(`Component ${filename} not found`);
        }
    }
    
    createComponentInterface(filename) {
        // Create standard interface for each component
        return {
            updatePosition: (position) => {
                this.updateComponentPosition(filename, position);
            },
            sendCommand: (command, data) => {
                this.sendComponentCommand(filename, command, data);
            },
            getState: () => {
                return this.getComponentState(filename);
            }
        };
    }
    
    updateComponentPosition(component, position) {
        // Update position in reality engine
        const entityId = this.componentToEntityId(component);
        if (this.realityEngine && this.realityEngine.updateEntityPosition) {
            this.realityEngine.updateEntityPosition(entityId, position);
        }
        
        // Emit position update
        this.emit('component-position-update', {
            component,
            position,
            timestamp: Date.now()
        });
    }
    
    componentToEntityId(component) {
        // Map component filenames to entity IDs
        const mapping = {
            'visual-centipede-authentication-system.html': 'centipede_main',
            'cal-vehicle-ship-system.js': 'main_ship',
            'autonomous-game-player-brain.js': 'autonomous_brain',
            'human-body-ecosystem-mapper.js': 'body_heart'
        };
        
        return mapping[component] || 'unknown_entity';
    }
    
    async connectRemainingComponents() {
        const remainingComponents = [
            'human-body-ecosystem-mapper.js',
            'steganography-bitmap-encoder.js',
            'fishing-line-physics-engine.js',
            'economic-decision-engine.js'
        ];
        
        for (const component of remainingComponents) {
            try {
                const system = await this.loadSystemComponent(component);
                const componentKey = component.split('-')[0]; // 'human' from 'human-body-...'
                this.systemComponents[componentKey] = system;
                console.log(`✅ ${componentKey} system connected`);
            } catch (error) {
                console.warn(`⚠️ ${component} not found`);
            }
        }
    }
    
    startBridgeServices() {
        // WebSocket server for real-time dual reality
        this.wss = new WebSocket.Server({ port: 9101 });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 Reality bridge client connected');
            
            // Send initial dual reality state
            this.sendInitialRealityState(ws);
            
            ws.on('message', (message) => {
                this.handleBridgeMessage(ws, message);
            });
            
            ws.on('close', () => {
                console.log('🔌 Reality bridge client disconnected');
            });
        });
        
        // HTTP endpoints for reality inspection
        this.startHTTPEndpoints();
    }
    
    startHTTPEndpoints() {
        const http = require('http');
        const url = require('url');
        
        const server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            switch (parsedUrl.pathname) {
                case '/reality/status':
                    res.end(JSON.stringify(this.getRealityStatus()));
                    break;
                    
                case '/reality/god-view':
                    res.end(JSON.stringify(this.godView));
                    break;
                    
                case '/reality/player-view':
                    res.end(JSON.stringify(this.playerView));
                    break;
                    
                case '/reality/lag-info':
                    res.end(JSON.stringify({
                        currentLag: this.calculateCurrentLag(),
                        oscillationPhase: this.oscillationState.phase,
                        isBlackScreen: this.oscillationState.isBlackScreen,
                        settings: this.lagSettings
                    }));
                    break;
                    
                case '/reality/systems':
                    res.end(JSON.stringify(this.getSystemsStatus()));
                    break;
                    
                default:
                    res.statusCode = 404;
                    res.end('{"error":"Endpoint not found"}');
            }
        });
        
        server.listen(9102, () => {
            console.log('🌐 Reality Bridge HTTP API listening on port 9102');
        });
    }
    
    getRealityStatus() {
        return {
            status: 'active',
            realityEngine: this.realityEngine ? 'connected' : 'fallback',
            godViewEntities: this.godView.entities.size,
            playerViewEntities: this.playerView.entities.size,
            currentLag: this.calculateCurrentLag(),
            oscillationActive: true,
            blackScreen: this.oscillationState.isBlackScreen,
            connectedSystems: Object.keys(this.systemComponents).filter(
                key => this.systemComponents[key] !== null
            ).length,
            timestamp: Date.now()
        };
    }
    
    getSystemsStatus() {
        const status = {};
        
        Object.entries(this.systemComponents).forEach(([key, component]) => {
            status[key] = {
                connected: component !== null,
                filename: component?.filename || null,
                loaded: component?.loaded || false,
                contentSize: component?.content || 0
            };
        });
        
        return status;
    }
    
    broadcastDualReality() {
        if (!this.wss) return;
        
        const broadcastData = {
            type: 'dual-reality-update',
            timestamp: Date.now(),
            godView: {
                entityCount: this.godView.entities.size,
                timestamp: this.godView.timestamp,
                sample: Array.from(this.godView.entities.entries()).slice(0, 3)
            },
            playerView: {
                entityCount: this.playerView.entities.size,
                timestamp: this.playerView.timestamp,
                lagAmount: Date.now() - this.playerView.timestamp,
                sample: Array.from(this.playerView.entities.entries()).slice(0, 3)
            },
            oscillation: {
                phase: this.oscillationState.phase,
                isBlackScreen: this.oscillationState.isBlackScreen,
                currentLag: this.calculateCurrentLag()
            }
        };
        
        const message = JSON.stringify(broadcastData);
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    sendInitialRealityState(ws) {
        const initialState = {
            type: 'reality-bridge-init',
            systems: this.getSystemsStatus(),
            reality: this.getRealityStatus(),
            lagSettings: this.lagSettings,
            endpoints: [
                'ws://localhost:9101 - Real-time dual reality stream',
                'http://localhost:9102/reality/status - Reality status',
                'http://localhost:9102/reality/god-view - God view state',
                'http://localhost:9102/reality/player-view - Player view state',
                'http://localhost:9102/reality/lag-info - Lag information',
                'http://localhost:9102/reality/systems - Connected systems'
            ]
        };
        
        ws.send(JSON.stringify(initialState));
    }
    
    handleBridgeMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'component-command':
                    this.sendComponentCommand(data.component, data.command, data.data);
                    break;
                    
                case 'reality-adjust':
                    this.adjustRealitySettings(data.settings);
                    break;
                    
                case 'force-black-screen':
                    this.triggerBlackScreen();
                    break;
                    
                case 'reality-swap':
                    this.processRealitySwap();
                    break;
            }
        } catch (error) {
            console.error('Bridge message error:', error);
        }
    }
    
    sendComponentCommand(component, command, data) {
        const comp = this.systemComponents[component];
        if (comp && comp.interface) {
            comp.interface.sendCommand(command, data);
        }
        
        this.emit('component-command', { component, command, data });
    }
    
    adjustRealitySettings(newSettings) {
        Object.assign(this.lagSettings, newSettings);
        console.log('⚙️ Reality settings adjusted:', newSettings);
    }
    
    handleLayerChange(data) {
        console.log(`🌍 Layer change: Entity ${data.entityId} moved from ${data.fromLayer} to ${data.toLayer}`);
        
        // Trigger reality adjustment based on layer changes
        if (data.toLayer > data.fromLayer) {
            // Moving to deeper layer - increase lag
            this.lagSettings.baseDelay += 50;
        } else {
            // Moving to shallower layer - decrease lag
            this.lagSettings.baseDelay = Math.max(200, this.lagSettings.baseDelay - 50);
        }
    }
}

// ============================================
// INTEGRATION HELPERS
// ============================================

class CentipedeIntegration {
    constructor(bridge) {
        this.bridge = bridge;
    }
    
    updateCentipedePosition(segments) {
        segments.forEach((segment, index) => {
            this.bridge.updateComponentPosition('centipede', {
                x: segment.x,
                y: segment.y,
                z: segment.depth || 0,
                segmentIndex: index
            });
        });
    }
    
    castFishingLine(target) {
        this.bridge.emit('fishing-line-cast', {
            target,
            timestamp: Date.now(),
            caster: 'centipede_main'
        });
    }
}

class ShipIntegration {
    constructor(bridge) {
        this.bridge = bridge;
    }
    
    updateShipPosition(shipId, position, blueprintData) {
        this.bridge.updateComponentPosition('ship', position);
        
        if (blueprintData) {
            this.bridge.emit('blueprint-update', {
                shipId,
                blueprintData,
                timestamp: Date.now()
            });
        }
    }
}

// ============================================
// RUN THE BRIDGE
// ============================================

if (require.main === module) {
    const bridge = new RealityBridgeConnector();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Reality Bridge Connector...');
        
        if (bridge.realityEngine && bridge.realityEngine.db) {
            await bridge.realityEngine.db.end();
        }
        
        process.exit(0);
    });
    
    // Export for use in other modules
    module.exports = {
        RealityBridgeConnector,
        CentipedeIntegration,
        ShipIntegration
    };
} else {
    module.exports = {
        RealityBridgeConnector,
        CentipedeIntegration,
        ShipIntegration
    };
}