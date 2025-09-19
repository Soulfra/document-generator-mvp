#!/usr/bin/env node
// flash-xml-world-bridge.js - Flash Skeleton to XML World Bridge
// Connects FlashPad browser skeleton system to XML world terrain data

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

console.log(`
🎮→🗺️ FLASH XML WORLD BRIDGE 🗺️←🎮
================================
Connecting Flash skeleton visualizer to XML world terrain
Bridge stealth browser to explorable game worlds
`);

class FlashXMLWorldBridge extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // File paths (existing systems)
            flashPadFile: './FLASHPAD-BROWSER-VISUAL-MOCKUP.html',
            xmlWorldSystem: './xml-world-terrain-system.js',
            flashSummaryFile: './FLASHPAD-BROWSER-SUMMARY.md',
            
            // Bridge server configuration
            bridgePort: 8050,
            wsPort: 8051,
            
            // Flash to XML mapping
            flashToXmlMapping: {
                'flash-skeleton': 'xml-object-skeleton',
                'flash-animation': 'xml-world-animation',
                'flash-navigation': 'xml-terrain-navigation',
                'flash-interaction': 'xml-world-interaction'
            }
        };
        
        // Bridge state
        this.bridgeActive = false;
        this.flashSystemReady = false;
        this.xmlWorldsLoaded = new Map();
        this.activeConnections = new Map();
        
        // Flash skeleton data
        this.flashSkeletons = new Map();
        this.xmlWorldMappings = new Map();
        this.bridgeData = {
            lastUpdate: Date.now(),
            flashElementsTracked: 0,
            xmlWorldsConnected: 0,
            activeAnimations: 0,
            bridgeConnections: 0
        };
        
        console.log('🔌 Flash XML World Bridge initializing...');
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Starting Flash → XML world bridge...');
        
        // 1. Load existing Flash system data
        await this.loadFlashSystemData();
        
        // 2. Initialize XML world interface
        await this.initializeXMLWorldInterface();
        
        // 3. Setup Flash skeleton tracking
        await this.setupFlashSkeletonTracking();
        
        // 4. Create bridge server
        await this.createBridgeServer();
        
        // 5. Start bridge monitoring
        this.startBridgeMonitoring();
        
        console.log('✅ Flash XML World Bridge ready!');
        console.log(`🌐 Bridge server: http://localhost:${this.config.bridgePort}`);
        console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
    }
    
    async loadFlashSystemData() {
        console.log('📱 Loading Flash system data...');
        
        try {
            // Load FlashPad browser HTML
            const flashContent = await fs.readFile(this.config.flashPadFile, 'utf8');
            this.analyzeFlashElements(flashContent);
            
            // Load FlashPad summary
            const summaryContent = await fs.readFile(this.config.flashSummaryFile, 'utf8');
            this.extractFlashCapabilities(summaryContent);
            
            this.flashSystemReady = true;
            console.log('✅ Flash system data loaded');
            
        } catch (error) {
            console.log('⚠️ Flash system files not found, using simulation data');
            this.generateSimulatedFlashData();
        }
    }
    
    analyzeFlashElements(flashContent) {
        console.log('🔍 Analyzing Flash elements for XML world mapping...');
        
        // Extract Flash elements that can map to XML world objects
        const flashElements = {
            skeleton: {
                animations: this.extractAnimations(flashContent),
                interactions: this.extractInteractions(flashContent),
                navigation: this.extractNavigation(flashContent),
                visualEffects: this.extractVisualEffects(flashContent)
            },
            browser: {
                stealthMode: flashContent.includes('Ctrl+Shift+B'),
                rainbow: flashContent.includes('rainbow'),
                bootSequence: flashContent.includes('boot'),
                hiddenBrowser: flashContent.includes('hidden')
            }
        };
        
        // Map Flash skeleton to XML world concepts
        this.mapFlashToXMLWorlds(flashElements);
    }
    
    extractAnimations(flashContent) {
        // Extract CSS animations and keyframes
        const animationMatches = flashContent.match(/@keyframes\s+(\w+)/g) || [];
        return animationMatches.map(match => match.replace('@keyframes ', ''));
    }
    
    extractInteractions(flashContent) {
        // Extract interactive elements
        const interactions = [];
        
        if (flashContent.includes('onclick')) interactions.push('click_interaction');
        if (flashContent.includes('onmouseover')) interactions.push('hover_interaction');
        if (flashContent.includes('keyboard')) interactions.push('keyboard_interaction');
        
        return interactions;
    }
    
    extractNavigation(flashContent) {
        // Extract navigation patterns
        const navigation = [];
        
        if (flashContent.includes('Ctrl+')) navigation.push('keyboard_shortcuts');
        if (flashContent.includes('menu')) navigation.push('menu_navigation');
        if (flashContent.includes('tab')) navigation.push('tab_navigation');
        
        return navigation;
    }
    
    extractVisualEffects(flashContent) {
        // Extract visual effects
        const effects = [];
        
        if (flashContent.includes('gradient')) effects.push('gradient_effects');
        if (flashContent.includes('glow')) effects.push('glow_effects');
        if (flashContent.includes('pulse')) effects.push('pulse_effects');
        if (flashContent.includes('rainbow')) effects.push('rainbow_effects');
        
        return effects;
    }
    
    extractFlashCapabilities(summaryContent) {
        console.log('📊 Extracting Flash capabilities...');
        
        const capabilities = {
            stealthBrowser: summaryContent.includes('stealth browser'),
            authSystem: summaryContent.includes('auth'),
            torIntegration: summaryContent.includes('Tor'),
            multiPort: summaryContent.includes('port'),
            xmlIntegration: summaryContent.includes('XML')
        };
        
        this.flashCapabilities = capabilities;
        
        console.log(`📱 Flash capabilities detected:`, Object.keys(capabilities).filter(k => capabilities[k]));
    }
    
    mapFlashToXMLWorlds(flashElements) {
        console.log('🗺️ Mapping Flash elements to XML worlds...');
        
        // Create mappings between Flash skeleton and XML world objects
        const mappings = new Map();
        
        // Animation mappings
        flashElements.skeleton.animations.forEach(animation => {
            mappings.set(`flash_animation_${animation}`, {
                xmlType: 'world_animation',
                xmlProperties: {
                    animationType: animation,
                    worldApplicable: this.determineWorldApplicability(animation),
                    skeletonBased: true
                }
            });
        });
        
        // Interaction mappings  
        flashElements.skeleton.interactions.forEach(interaction => {
            mappings.set(`flash_interaction_${interaction}`, {
                xmlType: 'world_interaction',
                xmlProperties: {
                    interactionType: interaction,
                    worldObjects: this.getCompatibleXMLObjects(interaction),
                    flashBased: true
                }
            });
        });
        
        // Visual effect mappings
        flashElements.skeleton.visualEffects.forEach(effect => {
            mappings.set(`flash_effect_${effect}`, {
                xmlType: 'world_ambient',
                xmlProperties: {
                    effectType: effect,
                    ambientCapable: true,
                    flashOrigin: true
                }
            });
        });
        
        this.xmlWorldMappings = mappings;
        
        console.log(`🔗 Created ${mappings.size} Flash → XML mappings`);
    }
    
    determineWorldApplicability(animation) {
        const worldTypes = [];
        
        // Map animation types to XML world types
        if (animation.includes('wave') || animation.includes('flow')) {
            worldTypes.push('grandExchange', 'tickerTapeFloor');
        }
        if (animation.includes('glow') || animation.includes('pulse')) {
            worldTypes.push('unifiedVisualization', 'extensionBridge');
        }
        if (animation.includes('shake') || animation.includes('bounce')) {
            worldTypes.push('shipRektArena', 'revenueVerification');
        }
        
        return worldTypes.length > 0 ? worldTypes : ['all'];
    }
    
    getCompatibleXMLObjects(interaction) {
        const objectTypes = [];
        
        // Map interaction types to XML object types
        if (interaction.includes('click')) {
            objectTypes.push('button', 'terminal', 'sign');
        }
        if (interaction.includes('hover')) {
            objectTypes.push('object', 'item', 'information');
        }
        if (interaction.includes('keyboard')) {
            objectTypes.push('terminal', 'input', 'control');
        }
        
        return objectTypes;
    }
    
    async initializeXMLWorldInterface() {
        console.log('🗺️ Initializing XML World interface...');
        
        // Create interface to XML world terrain system
        this.xmlWorldInterface = {
            // Load XML worlds with Flash skeleton data
            loadWorldWithFlash: async (worldId, instanceId, flashData) => {
                console.log(`🗺️ Loading XML world ${worldId} with Flash skeleton integration`);
                
                try {
                    // Simulate XML world loading (would connect to actual xml-world-terrain-system.js)
                    const worldData = await this.loadXMLWorldData(worldId);
                    
                    // Integrate Flash skeleton data
                    const integratedWorld = this.integrateFlashSkeleton(worldData, flashData);
                    
                    // Store integrated world
                    this.xmlWorldsLoaded.set(`${worldId}_${instanceId}`, integratedWorld);
                    
                    console.log(`✅ XML world loaded with Flash integration: ${worldId}`);
                    
                    return integratedWorld;
                    
                } catch (error) {
                    console.error(`❌ Failed to load XML world ${worldId}:`, error.message);
                    throw error;
                }
            },
            
            // Update XML world objects with Flash animations
            updateWorldAnimations: (worldKey, animations) => {
                const world = this.xmlWorldsLoaded.get(worldKey);
                if (world) {
                    world.animations = { ...world.animations, ...animations };
                    world.lastUpdate = Date.now();
                    
                    this.emit('xml_world_updated', { worldKey, animations });
                }
            },
            
            // Apply Flash interactions to XML objects
            applyFlashInteractions: (worldKey, interactions) => {
                const world = this.xmlWorldsLoaded.get(worldKey);
                if (world) {
                    world.interactions = { ...world.interactions, ...interactions };
                    
                    this.emit('xml_world_interactions_updated', { worldKey, interactions });
                }
            }
        };
    }
    
    async loadXMLWorldData(worldId) {
        // Simulate loading XML world data (would connect to xml-world-terrain-system.js)
        console.log(`📊 Loading XML world data for: ${worldId}`);
        
        const simulatedWorldData = {
            id: worldId,
            name: this.getWorldName(worldId),
            terrain: {
                type: this.getWorldTerrain(worldId),
                walkable: true,
                objects: this.generateWorldObjects(worldId)
            },
            spawns: this.generateWorldSpawns(worldId),
            navigation: {
                pathfinding: true,
                teleports: []
            },
            loadedAt: Date.now()
        };
        
        return simulatedWorldData;
    }
    
    integrateFlashSkeleton(worldData, flashData) {
        console.log(`🎮 Integrating Flash skeleton with XML world: ${worldData.id}`);
        
        const integratedWorld = {
            ...worldData,
            flashIntegration: {
                skeletonAnimations: flashData?.animations || [],
                stealthMode: flashData?.stealthMode || false,
                rainbowEffects: flashData?.rainbowEffects || false,
                interactiveElements: flashData?.interactions || []
            },
            
            // Enhanced objects with Flash skeleton capabilities
            enhancedObjects: worldData.terrain.objects.map(obj => ({
                ...obj,
                flashAnimations: this.getApplicableAnimations(obj.type),
                interactionMethods: this.getFlashInteractions(obj.type),
                visualEffects: this.getFlashVisualEffects(obj.type)
            })),
            
            // Flash-specific ambient effects
            flashAmbient: {
                rainbowGradients: flashData?.rainbowEffects || false,
                glowEffects: true,
                pulseAnimations: true,
                stealthTransitions: flashData?.stealthMode || false
            }
        };
        
        return integratedWorld;
    }
    
    getApplicableAnimations(objectType) {
        const animationMap = {
            'trading_post': ['pulse', 'glow'],
            'price_board': ['ticker', 'scroll'],
            'market_stall': ['bounce', 'wave'],
            'arena_wall': ['solid', 'defensive'],
            'scoreboard': ['flash', 'update'],
            'weapon_rack': ['shimmer', 'ready']
        };
        
        return animationMap[objectType] || ['default'];
    }
    
    getFlashInteractions(objectType) {
        const interactionMap = {
            'trading_post': ['click_trade', 'hover_info'],
            'price_board': ['click_details', 'scroll_data'],
            'market_stall': ['click_browse', 'hover_preview'],
            'scoreboard': ['click_expand', 'hover_stats'],
            'terminal': ['keyboard_input', 'click_activate']
        };
        
        return interactionMap[objectType] || ['click_basic'];
    }
    
    getFlashVisualEffects(objectType) {
        const effectMap = {
            'trading_post': ['green_glow', 'success_pulse'],
            'price_board': ['data_stream', 'number_flow'],
            'market_stall': ['warm_glow', 'invite_pulse'],
            'arena_wall': ['warning_glow', 'defensive_pulse'],
            'scoreboard': ['achievement_flash', 'update_glow']
        };
        
        return effectMap[objectType] || ['basic_glow'];
    }
    
    setupFlashSkeletonTracking() {
        console.log('🦴 Setting up Flash skeleton tracking...');
        
        // Track Flash skeleton elements for XML integration
        this.skeletonTracker = {
            trackedElements: new Map(),
            animationStates: new Map(),
            interactionHistory: [],
            
            // Track Flash element
            trackElement: (elementId, elementData) => {
                this.skeletonTracker.trackedElements.set(elementId, {
                    ...elementData,
                    trackedSince: Date.now(),
                    xmlMappings: this.getXMLMappingsForElement(elementId)
                });
                
                this.bridgeData.flashElementsTracked = this.skeletonTracker.trackedElements.size;
            },
            
            // Update animation state
            updateAnimation: (elementId, animationState) => {
                this.skeletonTracker.animationStates.set(elementId, {
                    ...animationState,
                    lastUpdate: Date.now()
                });
                
                this.bridgeData.activeAnimations = this.skeletonTracker.animationStates.size;
                
                // Propagate to XML worlds
                this.propagateAnimationToXMLWorlds(elementId, animationState);
            },
            
            // Record interaction
            recordInteraction: (elementId, interactionType, data) => {
                const interaction = {
                    elementId,
                    interactionType,
                    data,
                    timestamp: Date.now()
                };
                
                this.skeletonTracker.interactionHistory.push(interaction);
                
                // Keep only last 100 interactions
                if (this.skeletonTracker.interactionHistory.length > 100) {
                    this.skeletonTracker.interactionHistory.shift();
                }
                
                // Propagate to XML worlds
                this.propagateInteractionToXMLWorlds(interaction);
            }
        };
    }
    
    getXMLMappingsForElement(elementId) {
        const mappings = [];
        
        // Check if element has XML world mappings
        for (const [flashKey, xmlMapping] of this.xmlWorldMappings) {
            if (flashKey.includes(elementId) || elementId.includes(flashKey.split('_')[2])) {
                mappings.push(xmlMapping);
            }
        }
        
        return mappings;
    }
    
    propagateAnimationToXMLWorlds(elementId, animationState) {
        // Propagate Flash animation to all connected XML worlds
        for (const [worldKey, world] of this.xmlWorldsLoaded) {
            if (world.flashIntegration) {
                this.xmlWorldInterface.updateWorldAnimations(worldKey, {
                    [elementId]: animationState
                });
            }
        }
    }
    
    propagateInteractionToXMLWorlds(interaction) {
        // Propagate Flash interaction to applicable XML worlds
        for (const [worldKey, world] of this.xmlWorldsLoaded) {
            if (world.flashIntegration) {
                this.xmlWorldInterface.applyFlashInteractions(worldKey, {
                    [interaction.elementId]: interaction
                });
            }
        }
    }
    
    async createBridgeServer() {
        console.log('🌐 Creating Flash XML bridge server...');
        
        this.app = express();
        this.server = http.createServer(this.app);
        
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Main bridge interface
        this.app.get('/', (req, res) => {
            res.send(this.generateBridgeInterface());
        });
        
        // Bridge status endpoint
        this.app.get('/api/bridge/status', (req, res) => {
            res.json(this.getBridgeStatus());
        });
        
        // Flash skeleton data endpoint
        this.app.get('/api/flash/skeleton', (req, res) => {
            res.json({
                trackedElements: Object.fromEntries(this.skeletonTracker?.trackedElements || []),
                animationStates: Object.fromEntries(this.skeletonTracker?.animationStates || []),
                mappings: Object.fromEntries(this.xmlWorldMappings)
            });
        });
        
        // XML world data endpoint
        this.app.get('/api/xml/worlds', (req, res) => {
            res.json({
                loadedWorlds: Object.fromEntries(this.xmlWorldsLoaded),
                worldCount: this.xmlWorldsLoaded.size
            });
        });
        
        // Create world with Flash integration
        this.app.post('/api/bridge/create-world', async (req, res) => {
            const { worldId, instanceId, flashData } = req.body;
            
            try {
                const integratedWorld = await this.xmlWorldInterface.loadWorldWithFlash(
                    worldId, 
                    instanceId, 
                    flashData
                );
                
                res.json({ success: true, world: integratedWorld });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // WebSocket server for real-time bridge communication
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            this.activeConnections.set(connectionId, ws);
            this.bridgeData.bridgeConnections = this.activeConnections.size;
            
            console.log(`🔌 Bridge connection established: ${connectionId}`);
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'bridge_connected',
                connectionId,
                bridgeStatus: this.getBridgeStatus(),
                availableMappings: Object.fromEntries(this.xmlWorldMappings)
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleBridgeMessage(connectionId, data);
                } catch (error) {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Invalid message format' 
                    }));
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                this.activeConnections.delete(connectionId);
                this.bridgeData.bridgeConnections = this.activeConnections.size;
                console.log(`🔌 Bridge connection closed: ${connectionId}`);
            });
        });
        
        this.server.listen(this.config.bridgePort, () => {
            console.log(`✅ Bridge server running on port ${this.config.bridgePort}`);
            console.log(`📡 WebSocket server running on port ${this.config.wsPort}`);
        });
    }
    
    handleBridgeMessage(connectionId, data) {
        const ws = this.activeConnections.get(connectionId);
        if (!ws) return;
        
        switch (data.type) {
            case 'track_flash_element':
                this.skeletonTracker?.trackElement(data.elementId, data.elementData);
                ws.send(JSON.stringify({ 
                    type: 'flash_element_tracked', 
                    elementId: data.elementId 
                }));
                break;
                
            case 'update_animation':
                this.skeletonTracker?.updateAnimation(data.elementId, data.animationState);
                this.broadcastToConnections({
                    type: 'animation_updated',
                    elementId: data.elementId,
                    animationState: data.animationState
                });
                break;
                
            case 'record_interaction':
                this.skeletonTracker?.recordInteraction(data.elementId, data.interactionType, data.data);
                this.broadcastToConnections({
                    type: 'interaction_recorded',
                    interaction: {
                        elementId: data.elementId,
                        interactionType: data.interactionType,
                        timestamp: Date.now()
                    }
                });
                break;
                
            case 'get_xml_mapping':
                const mappings = this.getXMLMappingsForElement(data.elementId);
                ws.send(JSON.stringify({
                    type: 'xml_mapping_result',
                    elementId: data.elementId,
                    mappings
                }));
                break;
        }
    }
    
    broadcastToConnections(message) {
        for (const ws of this.activeConnections.values()) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }
    
    startBridgeMonitoring() {
        console.log('👁️ Starting bridge monitoring...');
        
        this.bridgeActive = true;
        
        // Monitor bridge health
        setInterval(() => {
            this.updateBridgeStatus();
        }, 5000); // Every 5 seconds
        
        // Generate Flash skeleton simulation data
        setInterval(() => {
            this.simulateFlashSkeletonActivity();
        }, 8000); // Every 8 seconds
        
        // Sync XML world states
        setInterval(() => {
            this.syncXMLWorldStates();
        }, 12000); // Every 12 seconds
    }
    
    updateBridgeStatus() {
        this.bridgeData.lastUpdate = Date.now();
        
        // Emit status update
        this.emit('bridge_status_update', this.bridgeData);
        
        // Broadcast to WebSocket connections
        this.broadcastToConnections({
            type: 'bridge_status_update',
            status: this.bridgeData
        });
    }
    
    simulateFlashSkeletonActivity() {
        if (!this.skeletonTracker) return;
        
        // Simulate Flash skeleton element tracking
        const elementId = `flash_element_${Date.now()}`;
        const elementData = {
            type: ['button', 'animation', 'effect', 'interaction'][Math.floor(Math.random() * 4)],
            stealthMode: Math.random() > 0.7,
            rainbow: Math.random() > 0.8,
            interactive: Math.random() > 0.5
        };
        
        this.skeletonTracker.trackElement(elementId, elementData);
        
        // Simulate animation update
        if (Math.random() > 0.6) {
            this.skeletonTracker.updateAnimation(elementId, {
                type: ['pulse', 'glow', 'wave', 'bounce'][Math.floor(Math.random() * 4)],
                duration: Math.floor(Math.random() * 3000) + 1000,
                active: true
            });
        }
        
        // Simulate interaction
        if (Math.random() > 0.7) {
            this.skeletonTracker.recordInteraction(elementId, 'click', {
                stealthActivated: Math.random() > 0.8,
                coordinate: { x: Math.floor(Math.random() * 800), y: Math.floor(Math.random() * 600) }
            });
        }
    }
    
    syncXMLWorldStates() {
        // Sync Flash skeleton data with XML worlds
        for (const [worldKey, world] of this.xmlWorldsLoaded) {
            if (world.flashIntegration) {
                // Update world with current Flash skeleton state
                world.flashIntegration.lastSync = Date.now();
                world.flashIntegration.trackedElements = this.skeletonTracker?.trackedElements.size || 0;
                world.flashIntegration.activeAnimations = this.skeletonTracker?.animationStates.size || 0;
                
                this.emit('xml_world_synced', { worldKey, syncTime: Date.now() });
            }
        }
        
        this.bridgeData.xmlWorldsConnected = this.xmlWorldsLoaded.size;
    }
    
    // Utility methods
    getBridgeStatus() {
        return {
            bridgeActive: this.bridgeActive,
            flashSystemReady: this.flashSystemReady,
            lastUpdate: this.bridgeData.lastUpdate,
            
            // Flash skeleton stats
            flashElementsTracked: this.bridgeData.flashElementsTracked,
            activeAnimations: this.bridgeData.activeAnimations,
            
            // XML world stats  
            xmlWorldsConnected: this.bridgeData.xmlWorldsConnected,
            bridgeConnections: this.bridgeData.bridgeConnections,
            
            // Mapping stats
            flashToXmlMappings: this.xmlWorldMappings.size,
            
            // System capabilities
            capabilities: this.flashCapabilities
        };
    }
    
    generateSimulatedFlashData() {
        console.log('🎮 Generating simulated Flash data...');
        
        this.flashSystemReady = true;
        this.flashCapabilities = {
            stealthBrowser: true,
            authSystem: true,  
            torIntegration: true,
            multiPort: true,
            xmlIntegration: true
        };
        
        // Create sample mappings
        const sampleMappings = new Map([
            ['flash_animation_rainbow', { xmlType: 'world_ambient', xmlProperties: { effectType: 'rainbow', ambientCapable: true }}],
            ['flash_interaction_stealth', { xmlType: 'world_interaction', xmlProperties: { interactionType: 'stealth_mode', worldObjects: ['terminal', 'hidden_door'] }}],
            ['flash_effect_glow', { xmlType: 'world_ambient', xmlProperties: { effectType: 'glow', ambientCapable: true }}]
        ]);
        
        this.xmlWorldMappings = sampleMappings;
    }
    
    getWorldName(worldId) {
        const names = {
            grandExchange: 'Grand Exchange Trading Floor',
            shipRektArena: 'ShipRekt Battle Arena', 
            tickerTapeFloor: 'Ticker Tape Social Hub',
            revenueVerification: 'Revenue Verification Chamber',
            unifiedVisualization: 'Unified Visualization Raid',
            extensionBridge: 'Cross-Platform Extension Bridge'
        };
        return names[worldId] || `World ${worldId}`;
    }
    
    getWorldTerrain(worldId) {
        const terrains = {
            grandExchange: 'trading_floor',
            shipRektArena: 'battle_arena',
            tickerTapeFloor: 'social_hub', 
            revenueVerification: 'office_complex',
            unifiedVisualization: 'complex_dungeon',
            extensionBridge: 'mystical_nexus'
        };
        return terrains[worldId] || 'default_terrain';
    }
    
    generateWorldObjects(worldId) {
        // Generate objects based on world type
        const baseObjects = [
            { id: 'obj_1', type: 'generic_object', position: { x: 100, y: 100, z: 0 } },
            { id: 'obj_2', type: 'interactive_terminal', position: { x: 200, y: 150, z: 0 } }
        ];
        
        // Add world-specific objects
        if (worldId === 'grandExchange') {
            baseObjects.push(
                { id: 'trading_post_1', type: 'trading_post', position: { x: 300, y: 200, z: 0 } },
                { id: 'price_board_1', type: 'price_board', position: { x: 400, y: 200, z: 10 } }
            );
        }
        
        return baseObjects;
    }
    
    generateWorldSpawns(worldId) {
        return [
            { id: 'player_spawn', type: 'player', position: { x: 50, y: 50, z: 0 }, enabled: true },
            { id: 'npc_spawn', type: 'npc', position: { x: 150, y: 150, z: 0 }, enabled: true }
        ];
    }
    
    generateBridgeInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎮🗺️ Flash XML World Bridge</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace;
            background: linear-gradient(45deg, #0a0a0a, #1a1a1a);
            color: #00ff00;
            padding: 20px;
        }
        .bridge-header { 
            text-align: center; 
            margin-bottom: 30px;
            padding: 20px;
            border: 2px solid #00ff00;
            border-radius: 10px;
            background: rgba(0,255,0,0.1);
        }
        .status-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .status-panel {
            background: rgba(0,255,0,0.05);
            border: 1px solid #00ff00;
            border-radius: 8px;
            padding: 15px;
        }
        .mapping-list {
            background: rgba(0,255,0,0.05);
            border: 1px solid #00ff00;
            border-radius: 8px;
            padding: 15px;
            max-height: 300px;
            overflow-y: auto;
        }
        .mapping-item {
            background: rgba(255,255,0,0.1);
            margin: 5px 0;
            padding: 8px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px;
            background: rgba(255,255,255,0.05);
            border-radius: 3px;
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
    </style>
</head>
<body>
    <div class="bridge-header">
        <h1>🎮🗺️ Flash XML World Bridge</h1>
        <p>Connecting Flash skeleton visualizer to XML world terrain system</p>
        <div class="pulse" style="color: #ffff00; margin-top: 10px;">
            Bridge Status: <span id="bridge-status">ACTIVE</span>
        </div>
    </div>
    
    <div class="status-grid">
        <div class="status-panel">
            <h3>🎮 Flash Skeleton System</h3>
            <div class="metric">
                <span>Elements Tracked:</span>
                <span id="elements-tracked">${this.bridgeData.flashElementsTracked}</span>
            </div>
            <div class="metric">
                <span>Active Animations:</span>
                <span id="active-animations">${this.bridgeData.activeAnimations}</span>
            </div>
            <div class="metric">
                <span>System Ready:</span>
                <span id="flash-ready">${this.flashSystemReady ? '✅' : '❌'}</span>
            </div>
        </div>
        
        <div class="status-panel">
            <h3>🗺️ XML World System</h3>
            <div class="metric">
                <span>Worlds Connected:</span>
                <span id="worlds-connected">${this.bridgeData.xmlWorldsConnected}</span>
            </div>
            <div class="metric">
                <span>Bridge Connections:</span>
                <span id="bridge-connections">${this.bridgeData.bridgeConnections}</span>
            </div>
            <div class="metric">
                <span>Flash→XML Mappings:</span>
                <span id="mappings-count">${this.xmlWorldMappings.size}</span>
            </div>
        </div>
    </div>
    
    <div class="mapping-list">
        <h3>🔗 Flash → XML Mappings</h3>
        ${Array.from(this.xmlWorldMappings.entries()).map(([flashKey, xmlMapping]) => `
            <div class="mapping-item">
                <strong>${flashKey}</strong> → ${xmlMapping.xmlType}
                <br><small>Properties: ${JSON.stringify(xmlMapping.xmlProperties)}</small>
            </div>
        `).join('')}
    </div>
    
    <script>
        // WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        
        ws.onopen = () => {
            console.log('🔌 Connected to Flash XML Bridge');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleBridgeUpdate(data);
        };
        
        function handleBridgeUpdate(data) {
            switch (data.type) {
                case 'bridge_status_update':
                    updateStatusDisplay(data.status);
                    break;
                case 'animation_updated':
                    console.log('🎬 Animation updated:', data.elementId);
                    break;
                case 'interaction_recorded':
                    console.log('🖱️ Interaction recorded:', data.interaction);
                    break;
            }
        }
        
        function updateStatusDisplay(status) {
            document.getElementById('elements-tracked').textContent = status.flashElementsTracked;
            document.getElementById('active-animations').textContent = status.activeAnimations;
            document.getElementById('worlds-connected').textContent = status.xmlWorldsConnected;
            document.getElementById('bridge-connections').textContent = status.bridgeConnections;
            document.getElementById('mappings-count').textContent = status.flashToXmlMappings;
            
            document.getElementById('bridge-status').textContent = status.bridgeActive ? 'ACTIVE' : 'INACTIVE';
        }
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'get_status' }));
            }
        }, 10000);
    </script>
</body>
</html>`;
    }
}

// Export for use as module
module.exports = FlashXMLWorldBridge;

// CLI interface
if (require.main === module) {
    const bridge = new FlashXMLWorldBridge();
    
    // Handle bridge events
    bridge.on('bridge_status_update', (status) => {
        console.log(`📊 Bridge Status: Elements ${status.flashElementsTracked} | Worlds ${status.xmlWorldsConnected} | Connections ${status.bridgeConnections}`);
    });
    
    bridge.on('xml_world_updated', (data) => {
        console.log(`🗺️ XML World updated: ${data.worldKey}`);
    });
    
    bridge.on('xml_world_synced', (data) => {
        console.log(`🔄 XML World synced: ${data.worldKey}`);
    });
    
    // Status reporting
    setInterval(() => {
        const status = bridge.getBridgeStatus();
        console.log(`🔗 Flash XML Bridge | Active: ${status.bridgeActive} | Flash: ${status.flashElementsTracked} | XML: ${status.xmlWorldsConnected} | Mappings: ${status.flashToXmlMappings}`);
    }, 20000); // Every 20 seconds
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Flash XML World Bridge...');
        console.log('🎮🗺️ Bridge disconnected');
        process.exit(0);
    });
    
    console.log('\n🔗 Flash XML World Bridge is running!');
    console.log('🎮 Flash skeleton → 🗺️ XML world terrain');
    console.log('Press Ctrl+C to shutdown gracefully');
}