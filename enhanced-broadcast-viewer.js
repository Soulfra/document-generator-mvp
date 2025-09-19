#!/usr/bin/env node

/**
 * 📺🎮 ENHANCED BROADCAST VIEWER
 * 
 * Enhanced viewer system for AI Influencer Broadcasting with:
 * - Drone camera views (multiple angles and perspectives)
 * - First-person debugging mode ("drop into the TV")
 * - Header/Middle/Footer diamond pattern structure
 * - Twitch/YouTube style interaction (charades-like user input)
 * - Frame recording and playback system
 * - Granular debugging capabilities
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const fs = require('fs').promises;

class EnhancedBroadcastViewer extends EventEmitter {
    constructor() {
        super();
        
        console.log('📺🎮 ENHANCED BROADCAST VIEWER');
        console.log('==============================');
        console.log('Drone views, first-person debugging, diamond pattern');
        console.log('');
        
        // Camera system with multiple view modes
        this.cameraSystem = {
            current: 'drone-overview',
            modes: {
                'drone-overview': {
                    name: '🚁 Drone Overview',
                    description: 'Bird\'s eye view of entire zone',
                    controls: { zoom: true, pan: true, rotate: true },
                    perspective: 'top-down',
                    height: 100
                },
                'drone-follow': {
                    name: '📹 Drone Follow',
                    description: 'Drone that follows selected agent',
                    controls: { distance: true, height: true, angle: true },
                    perspective: 'third-person',
                    target: null
                },
                'security-cam': {
                    name: '📷 Security Cam',
                    description: 'Fixed security camera views',
                    controls: { switch: true },
                    perspective: 'fixed',
                    positions: ['corner1', 'corner2', 'center', 'entrance']
                },
                'first-person': {
                    name: '👁️ First Person',
                    description: 'See through AI agent\'s eyes',
                    controls: { look: true, move: true },
                    perspective: 'first-person',
                    target: null,
                    debugging: true
                },
                'debug-matrix': {
                    name: '🔍 Debug Matrix',
                    description: 'Matrix-style data visualization',
                    controls: { layer: true, filter: true },
                    perspective: 'data',
                    showData: true
                },
                'cinematic': {
                    name: '🎬 Cinematic',
                    description: 'Movie-style dramatic angles',
                    controls: { preset: true },
                    perspective: 'cinematic',
                    presets: ['hero-shot', 'wide-shot', 'close-up', 'dutch-angle']
                }
            }
        };
        
        // Diamond pattern structure (reverse funnel)
        this.diamondStructure = {
            header: {
                name: 'Standard View Layer',
                components: ['zone-selector', 'viewer-count', 'stream-info'],
                height: '15%',
                purpose: 'Navigation and status'
            },
            middle: {
                name: 'Interactive Components Layer', 
                components: ['main-view', 'agent-panels', 'chat-interactions'],
                height: '70%',
                purpose: 'Main interaction and content'
            },
            footer: {
                name: 'Summary/Indexing Layer',
                components: ['action-timeline', 'data-summaries', 'search-index'],
                height: '15%',
                purpose: 'Context and navigation'
            }
        };
        
        // Frame recording system
        this.frameRecorder = {
            recording: false,
            frames: [],
            maxFrames: 1000,
            playbackMode: false,
            currentFrame: 0,
            bookmarks: new Map()
        };
        
        // User input system (charades-style)
        this.userInputSystem = {
            mode: 'observer', // observer, participant, director
            interactions: new Map(),
            commands: new Map(),
            gestures: new Map()
        };
        
        // Debugging system
        this.debugSystem = {
            active: false,
            breakpoints: new Map(),
            watchVariables: new Set(),
            stepMode: false,
            currentAgent: null,
            debugLayers: ['reasoning', 'decisions', 'data-flow', 'state-changes']
        };
        
        // Connection to broadcast layer
        this.broadcastConnection = null;
        this.viewers = new Map();
        this.currentScene = null;
        
        // Enhanced viewer data
        this.viewerData = {
            totalViewTime: 0,
            interactionCount: 0,
            favoriteAgents: new Set(),
            bookmarks: [],
            preferences: {
                defaultCamera: 'drone-overview',
                autoFollow: true,
                debugMode: false,
                showDataLayers: false
            }
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing Enhanced Broadcast Viewer...\n');
        
        // Connect to broadcast layer
        await this.connectToBroadcastLayer();
        
        // Initialize camera system
        this.initializeCameraSystem();
        
        // Setup user input handlers
        this.setupUserInputSystem();
        
        // Initialize debug system
        this.initializeDebugSystem();
        
        // Start frame recorder
        this.initializeFrameRecorder();
        
        // Create enhanced viewer server
        await this.createEnhancedViewerServer();
        
        console.log('✅ Enhanced Broadcast Viewer ready!');
        console.log('🎮 Enhanced viewer: http://localhost:8889');
        console.log('📺 Supports drone views, debugging, and interactive features\n');
    }
    
    async connectToBroadcastLayer() {
        console.log('📡 Connecting to AI Influencer Broadcast Layer...');
        
        try {
            this.broadcastConnection = new WebSocket('ws://localhost:8888');
            
            this.broadcastConnection.on('open', () => {
                console.log('✅ Connected to broadcast layer');
            });
            
            this.broadcastConnection.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleBroadcastMessage(message);
            });
            
            this.broadcastConnection.on('error', (error) => {
                console.warn('Broadcast layer connection failed, using mock data');
                this.initializeMockData();
            });
        } catch (error) {
            console.warn('Could not connect to broadcast layer, using mock data');
            this.initializeMockData();
        }
    }
    
    initializeCameraSystem() {
        console.log('📹 Initializing advanced camera system...');
        
        // Set up camera controls
        this.cameraControls = {
            // Drone controls
            dronePosition: { x: 0, y: 0, z: 50 },
            droneTarget: { x: 0, y: 0, z: 0 },
            droneSpeed: 5,
            
            // First-person controls
            fpPosition: { x: 0, y: 0, z: 1.8 }, // Eye level
            fpDirection: { x: 0, y: 1, z: 0 },
            fpSensitivity: 0.002,
            
            // Cinematic presets
            cinematicPresets: {
                'hero-shot': { 
                    position: { x: 0, y: -20, z: 10 },
                    target: { x: 0, y: 0, z: 0 },
                    fov: 45
                },
                'wide-shot': {
                    position: { x: 0, y: -50, z: 25 },
                    target: { x: 0, y: 0, z: 0 },
                    fov: 60
                },
                'close-up': {
                    position: { x: 2, y: -5, z: 2 },
                    target: { x: 0, y: 0, z: 1.8 },
                    fov: 30
                }
            }
        };
        
        console.log('✅ Camera system initialized with 6 view modes');
    }
    
    setupUserInputSystem() {
        console.log('🎮 Setting up user input system (charades-style)...');
        
        // Register interaction commands
        this.userInputSystem.commands.set('follow', {
            description: 'Follow an AI agent',
            syntax: '/follow [agent-name]',
            handler: this.handleFollowCommand.bind(this)
        });
        
        this.userInputSystem.commands.set('debug', {
            description: 'Enter debug mode for agent',
            syntax: '/debug [agent-name]',
            handler: this.handleDebugCommand.bind(this)
        });
        
        this.userInputSystem.commands.set('camera', {
            description: 'Switch camera mode',
            syntax: '/camera [mode]',
            handler: this.handleCameraCommand.bind(this)
        });
        
        this.userInputSystem.commands.set('record', {
            description: 'Start/stop recording',
            syntax: '/record [start|stop|bookmark]',
            handler: this.handleRecordCommand.bind(this)
        });
        
        this.userInputSystem.commands.set('teleport', {
            description: 'Teleport camera to location',
            syntax: '/teleport [x] [y] [z]',
            handler: this.handleTeleportCommand.bind(this)
        });
        
        // Register gesture interactions (for future touch/motion controls)
        this.userInputSystem.gestures.set('swipe-left', 'switch-zone-left');
        this.userInputSystem.gestures.set('swipe-right', 'switch-zone-right');
        this.userInputSystem.gestures.set('pinch', 'zoom-camera');
        this.userInputSystem.gestures.set('double-tap', 'follow-agent');
        this.userInputSystem.gestures.set('long-press', 'enter-debug-mode');
        
        console.log('✅ User input system ready with commands and gestures');
    }
    
    initializeDebugSystem() {
        console.log('🔍 Initializing first-person debugging system...');
        
        this.debugSystem = {
            ...this.debugSystem,
            layers: {
                'reasoning': {
                    name: 'AI Reasoning',
                    color: '#00ff88',
                    data: [],
                    visible: false
                },
                'decisions': {
                    name: 'Decision Points', 
                    color: '#ffff00',
                    data: [],
                    visible: false
                },
                'data-flow': {
                    name: 'Data Flow',
                    color: '#0099ff',
                    data: [],
                    visible: false
                },
                'state-changes': {
                    name: 'State Changes',
                    color: '#ff9900', 
                    data: [],
                    visible: false
                },
                'performance': {
                    name: 'Performance Metrics',
                    color: '#ff00ff',
                    data: [],
                    visible: false
                }
            }
        };
        
        console.log('✅ Debug system initialized with 5 debug layers');
    }
    
    initializeFrameRecorder() {
        console.log('📹 Initializing frame recording system...');
        
        // Record frames every 100ms when recording
        this.recordingInterval = setInterval(() => {
            if (this.frameRecorder.recording && this.currentScene) {
                this.recordFrame();
            }
        }, 100);
        
        console.log('✅ Frame recorder ready (10 FPS recording)');
    }
    
    async createEnhancedViewerServer() {
        console.log('🖥️ Creating enhanced viewer server...');
        
        this.viewerServer = new WebSocket.Server({ port: 8889 });
        
        this.viewerServer.on('connection', (ws, req) => {
            const viewerId = `enhanced-viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            console.log(`👁️ Enhanced viewer connected: ${viewerId}`);
            this.viewers.set(viewerId, {
                ws,
                id: viewerId,
                camera: 'drone-overview',
                debugMode: false,
                permissions: ['view', 'interact'],
                preferences: { ...this.viewerData.preferences }
            });
            
            // Send initial enhanced scene data
            ws.send(JSON.stringify({
                type: 'enhanced_init',
                viewerId,
                cameraSystem: this.cameraSystem,
                diamondStructure: this.diamondStructure,
                currentScene: this.currentScene,
                debugLayers: this.debugSystem.layers,
                commands: Array.from(this.userInputSystem.commands.keys())
            }));
            
            ws.on('message', (data) => {
                this.handleViewerMessage(viewerId, JSON.parse(data));
            });
            
            ws.on('close', () => {
                console.log(`👋 Enhanced viewer disconnected: ${viewerId}`);
                this.viewers.delete(viewerId);
            });
        });
        
        console.log('✅ Enhanced viewer server running on ws://localhost:8889');
    }
    
    handleBroadcastMessage(message) {
        // Handle messages from broadcast layer and enhance them
        switch (message.type) {
            case 'scene_init':
            case 'scene_update':
                this.currentScene = message;
                this.enhanceSceneData(message);
                break;
                
            case 'agent_action':
                this.trackAgentAction(message);
                break;
                
            case 'zone_change':
                this.handleZoneChange(message);
                break;
        }
        
        // Forward enhanced message to viewers
        this.broadcastToViewers({
            ...message,
            enhanced: true,
            timestamp: Date.now()
        });
    }
    
    enhanceSceneData(sceneData) {
        // Add enhanced data layers to scene
        if (sceneData.agents) {
            sceneData.agents = sceneData.agents.map(agent => ({
                ...agent,
                debugData: this.getAgentDebugData(agent.id),
                reasoningTrace: this.getReasoningTrace(agent.id),
                performanceMetrics: this.getPerformanceMetrics(agent.id),
                interactionHistory: this.getInteractionHistory(agent.id)
            }));
        }
        
        // Add camera recommendations
        sceneData.cameraRecommendations = this.generateCameraRecommendations(sceneData);
        
        // Add diamond structure data
        sceneData.diamondLayers = {
            header: this.generateHeaderData(sceneData),
            middle: this.generateMiddleData(sceneData), 
            footer: this.generateFooterData(sceneData)
        };
    }
    
    handleViewerMessage(viewerId, message) {
        const viewer = this.viewers.get(viewerId);
        if (!viewer) return;
        
        switch (message.type) {
            case 'camera_change':
                this.handleCameraChange(viewerId, message);
                break;
                
            case 'debug_request':
                this.handleDebugRequest(viewerId, message);
                break;
                
            case 'user_command':
                this.handleUserCommand(viewerId, message);
                break;
                
            case 'teleport_request':
                this.handleTeleportRequest(viewerId, message);
                break;
                
            case 'record_control':
                this.handleRecordControl(viewerId, message);
                break;
                
            case 'interaction':
                this.handleViewerInteraction(viewerId, message);
                break;
        }
    }
    
    handleCameraChange(viewerId, message) {
        const viewer = this.viewers.get(viewerId);
        if (!viewer) return;
        
        const cameraMode = message.mode;
        if (!this.cameraSystem.modes[cameraMode]) return;
        
        viewer.camera = cameraMode;
        
        // Send camera-specific data
        viewer.ws.send(JSON.stringify({
            type: 'camera_changed',
            mode: cameraMode,
            config: this.cameraSystem.modes[cameraMode],
            controls: this.getCameraControls(cameraMode),
            view: this.generateCameraView(cameraMode, message.target)
        }));
    }
    
    handleDebugRequest(viewerId, message) {
        const viewer = this.viewers.get(viewerId);
        if (!viewer) return;
        
        if (message.action === 'enter') {
            viewer.debugMode = true;
            this.debugSystem.active = true;
            this.debugSystem.currentAgent = message.agentId;
            
            // Send debug interface
            viewer.ws.send(JSON.stringify({
                type: 'debug_mode_entered',
                agentId: message.agentId,
                debugLayers: this.debugSystem.layers,
                agentState: this.getAgentState(message.agentId),
                breakpoints: Array.from(this.debugSystem.breakpoints.keys()),
                watchVariables: Array.from(this.debugSystem.watchVariables)
            }));
        } else if (message.action === 'exit') {
            viewer.debugMode = false;
            this.debugSystem.active = false;
            
            viewer.ws.send(JSON.stringify({
                type: 'debug_mode_exited'
            }));
        }
    }
    
    handleUserCommand(viewerId, message) {
        const command = this.userInputSystem.commands.get(message.command);
        if (command) {
            command.handler(viewerId, message.args);
        }
    }
    
    // Command handlers
    handleFollowCommand(viewerId, args) {
        const agentName = args[0];
        const viewer = this.viewers.get(viewerId);
        if (!viewer) return;
        
        // Switch to drone-follow mode
        viewer.camera = 'drone-follow';
        this.cameraSystem.modes['drone-follow'].target = agentName;
        
        viewer.ws.send(JSON.stringify({
            type: 'following_agent',
            agent: agentName,
            camera: 'drone-follow'
        }));
    }
    
    handleDebugCommand(viewerId, args) {
        const agentName = args[0];
        this.handleDebugRequest(viewerId, {
            action: 'enter',
            agentId: agentName
        });
    }
    
    handleCameraCommand(viewerId, args) {
        const cameraMode = args[0];
        this.handleCameraChange(viewerId, { mode: cameraMode });
    }
    
    handleRecordCommand(viewerId, args) {
        const action = args[0];
        
        switch (action) {
            case 'start':
                this.frameRecorder.recording = true;
                this.frameRecorder.frames = [];
                break;
                
            case 'stop':
                this.frameRecorder.recording = false;
                break;
                
            case 'bookmark':
                const bookmark = {
                    frame: this.frameRecorder.frames.length,
                    timestamp: Date.now(),
                    note: args.slice(1).join(' ') || 'Bookmark'
                };
                this.frameRecorder.bookmarks.set(bookmark.timestamp, bookmark);
                break;
        }
        
        const viewer = this.viewers.get(viewerId);
        if (viewer) {
            viewer.ws.send(JSON.stringify({
                type: 'recording_status',
                recording: this.frameRecorder.recording,
                frames: this.frameRecorder.frames.length,
                bookmarks: Array.from(this.frameRecorder.bookmarks.values())
            }));
        }
    }
    
    handleTeleportCommand(viewerId, args) {
        const [x, y, z] = args.map(parseFloat);
        const viewer = this.viewers.get(viewerId);
        if (!viewer) return;
        
        // Update camera position
        this.cameraControls.dronePosition = { x, y, z };
        
        viewer.ws.send(JSON.stringify({
            type: 'camera_teleported',
            position: { x, y, z },
            view: this.generateCameraView(viewer.camera)
        }));
    }
    
    recordFrame() {
        const frame = {
            timestamp: Date.now(),
            scene: JSON.parse(JSON.stringify(this.currentScene)),
            camera: {
                ...this.cameraControls,
                currentMode: this.cameraSystem.current
            },
            debugData: this.debugSystem.active ? this.captureDebugFrame() : null
        };
        
        this.frameRecorder.frames.push(frame);
        
        // Keep only last N frames
        if (this.frameRecorder.frames.length > this.frameRecorder.maxFrames) {
            this.frameRecorder.frames.shift();
        }
    }
    
    // Helper methods for generating views and data
    generateCameraView(mode, target = null) {
        // Generate camera-specific view data
        return {
            mode,
            position: this.cameraControls.dronePosition,
            target: target || this.cameraControls.droneTarget,
            renderData: this.generateRenderData(mode)
        };
    }
    
    generateRenderData(mode) {
        // Generate rendering instructions for different camera modes
        const baseData = {
            agents: this.currentScene?.agents || [],
            environment: this.currentScene?.zone || 'trading-floor'
        };
        
        switch (mode) {
            case 'debug-matrix':
                return {
                    ...baseData,
                    debugLayers: this.debugSystem.layers,
                    dataVisualization: true
                };
                
            case 'first-person':
                return {
                    ...baseData,
                    perspective: 'first-person',
                    ui: 'debug-hud',
                    interactionPrompts: true
                };
                
            default:
                return baseData;
        }
    }
    
    generateHeaderData(sceneData) {
        return {
            zones: Object.keys(sceneData.zones || {}),
            currentZone: sceneData.zone,
            viewerCount: this.viewers.size,
            streamStatus: 'live',
            cameraMode: this.cameraSystem.current
        };
    }
    
    generateMiddleData(sceneData) {
        return {
            mainView: this.generateCameraView(this.cameraSystem.current),
            agentPanels: (sceneData.agents || []).map(agent => ({
                id: agent.id,
                name: agent.name,
                activity: agent.activity,
                debugging: this.debugSystem.currentAgent === agent.id
            })),
            interactions: Array.from(this.userInputSystem.interactions.values())
        };
    }
    
    generateFooterData(sceneData) {
        return {
            timeline: this.frameRecorder.frames.slice(-10),
            summaries: this.generateDataSummaries(),
            searchIndex: this.generateSearchIndex(),
            bookmarks: Array.from(this.frameRecorder.bookmarks.values())
        };
    }
    
    broadcastToViewers(message) {
        const messageStr = JSON.stringify(message);
        
        for (const [viewerId, viewer] of this.viewers) {
            if (viewer.ws.readyState === WebSocket.OPEN) {
                viewer.ws.send(messageStr);
            }
        }
    }
    
    // Mock data for testing
    initializeMockData() {
        console.log('🎭 Initializing mock data for testing...');
        
        this.currentScene = {
            type: 'scene_update',
            agents: [
                {
                    id: 'trader-alpha',
                    name: 'TraderBot Alpha',
                    position: { x: 10, y: 5, z: 0 },
                    activity: 'analyzing_market',
                    zone: 'trading-floor'
                },
                {
                    id: 'explorer-beta',
                    name: 'ExplorerAI Beta',
                    position: { x: -15, y: 8, z: 0 },
                    activity: 'exploring_area',
                    zone: 'exploration-zone'
                }
            ],
            zone: 'trading-floor'
        };
        
        // Simulate scene updates
        setInterval(() => {
            if (this.currentScene) {
                this.enhanceSceneData(this.currentScene);
                this.broadcastToViewers({
                    ...this.currentScene,
                    type: 'enhanced_scene_update'
                });
            }
        }, 1000);
    }
    
    // Placeholder methods for future integration
    getAgentDebugData(agentId) { return {}; }
    getReasoningTrace(agentId) { return []; }
    getPerformanceMetrics(agentId) { return {}; }
    getInteractionHistory(agentId) { return []; }
    generateCameraRecommendations(sceneData) { return []; }
    captureDebugFrame() { return {}; }
    getAgentState(agentId) { return {}; }
    generateDataSummaries() { return []; }
    generateSearchIndex() { return []; }
    getCameraControls(mode) { return {}; }
    trackAgentAction(message) {}
    handleZoneChange(message) {}
    handleTeleportRequest(viewerId, message) {}
    handleRecordControl(viewerId, message) {}
    handleViewerInteraction(viewerId, message) {}
    
    // Generate enhanced viewer HTML
    getEnhancedViewerHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Enhanced AI Broadcast Viewer - Drone Views & Debug Mode</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: #0a0a0a;
            color: #00ff88;
            font-family: 'Courier New', monospace;
            overflow: hidden;
            height: 100vh;
        }
        
        /* Diamond Pattern Layout */
        .diamond-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
        }
        
        /* Header Layer (15%) */
        .header-layer {
            height: 15%;
            background: rgba(0, 255, 136, 0.1);
            border-bottom: 2px solid #00ff88;
            display: flex;
            align-items: center;
            padding: 10px;
            position: relative;
        }
        
        .zone-tabs {
            display: flex;
            gap: 10px;
        }
        
        .zone-tab {
            padding: 8px 15px;
            background: rgba(0, 255, 136, 0.2);
            border: 1px solid #00ff88;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .zone-tab:hover, .zone-tab.active {
            background: #00ff88;
            color: #000;
        }
        
        .stream-status {
            margin-left: auto;
            display: flex;
            gap: 20px;
            align-items: center;
        }
        
        .live-indicator {
            background: #ff0000;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        /* Middle Layer (70%) */
        .middle-layer {
            height: 70%;
            display: flex;
            position: relative;
        }
        
        .main-view {
            flex: 1;
            background: #111;
            position: relative;
            overflow: hidden;
        }
        
        .camera-canvas {
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, #1a1a2e 0%, #000 100%);
        }
        
        .camera-controls {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #00ff88;
        }
        
        .camera-mode {
            margin: 5px 0;
            padding: 8px 12px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 12px;
        }
        
        .camera-mode:hover, .camera-mode.active {
            background: #00ff88;
            color: #000;
        }
        
        .debug-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 300px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ff9900;
            border-radius: 10px;
            padding: 15px;
            display: none;
        }
        
        .debug-panel.active {
            display: block;
        }
        
        .debug-layer {
            margin: 8px 0;
            padding: 6px;
            border-left: 3px solid;
            font-size: 11px;
        }
        
        .side-panel {
            width: 320px;
            background: #0f0f0f;
            border-left: 2px solid #00ff88;
            display: flex;
            flex-direction: column;
        }
        
        .agent-list {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
        }
        
        .agent-card {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 8px;
            padding: 10px;
            margin: 8px 0;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .agent-card:hover {
            background: rgba(0, 255, 136, 0.2);
            transform: translateX(5px);
        }
        
        .agent-name {
            font-weight: bold;
            font-size: 14px;
        }
        
        .agent-activity {
            font-size: 11px;
            color: #888;
            margin-top: 4px;
        }
        
        .chat-section {
            height: 200px;
            border-top: 1px solid #333;
            display: flex;
            flex-direction: column;
        }
        
        .chat-messages {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            font-size: 12px;
        }
        
        .chat-input {
            padding: 10px;
            border-top: 1px solid #333;
        }
        
        .command-input {
            width: 100%;
            padding: 8px;
            background: #222;
            border: 1px solid #00ff88;
            color: #00ff88;
            border-radius: 5px;
            font-family: inherit;
        }
        
        /* Footer Layer (15%) */
        .footer-layer {
            height: 15%;
            background: rgba(0, 255, 136, 0.05);
            border-top: 2px solid #00ff88;
            display: flex;
            padding: 10px;
            gap: 10px;
        }
        
        .timeline-section {
            flex: 1;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 8px;
            padding: 10px;
        }
        
        .timeline-frames {
            display: flex;
            gap: 5px;
            overflow-x: auto;
        }
        
        .timeline-frame {
            width: 60px;
            height: 40px;
            background: #333;
            border: 1px solid #666;
            border-radius: 4px;
            cursor: pointer;
            position: relative;
            flex-shrink: 0;
        }
        
        .timeline-frame.bookmark {
            border-color: #ffff00;
            background: rgba(255, 255, 0, 0.2);
        }
        
        .summary-section {
            flex: 1;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 8px;
            padding: 10px;
        }
        
        .data-summary {
            font-size: 11px;
            margin: 2px 0;
        }
        
        /* First-person debug mode overlay */
        .first-person-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            display: none;
            z-index: 1000;
        }
        
        .first-person-overlay.active {
            display: block;
        }
        
        .debug-hud {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            height: 100px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ff9900;
            border-radius: 10px;
            padding: 10px;
            display: flex;
            gap: 20px;
        }
        
        .hud-section {
            flex: 1;
        }
        
        .hud-title {
            color: #ff9900;
            font-size: 12px;
            margin-bottom: 5px;
        }
        
        .hud-data {
            font-size: 10px;
            line-height: 1.3;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .middle-layer {
                flex-direction: column;
            }
            
            .side-panel {
                width: 100%;
                height: 200px;
            }
            
            .camera-controls {
                width: calc(100% - 20px);
                height: 60px;
                overflow-x: auto;
                display: flex;
                gap: 10px;
            }
            
            .camera-mode {
                flex-shrink: 0;
            }
        }
        
        /* Utility classes */
        .hidden { display: none !important; }
        .recording { border: 2px solid #ff0000 !important; }
        .following { border: 2px solid #ffff00 !important; }
        .debugging { border: 2px solid #ff9900 !important; }
    </style>
</head>
<body>
    <div class="diamond-container">
        <!-- Header Layer -->
        <div class="header-layer">
            <div class="zone-tabs" id="zone-tabs">
                <!-- Zone tabs will be populated here -->
            </div>
            
            <div class="stream-status">
                <div class="live-indicator">🔴 LIVE</div>
                <div id="viewer-count">👀 0 viewers</div>
                <div id="camera-indicator">📹 Drone Overview</div>
            </div>
        </div>
        
        <!-- Middle Layer -->
        <div class="middle-layer">
            <div class="main-view">
                <canvas id="camera-canvas" class="camera-canvas"></canvas>
                
                <!-- Camera Controls -->
                <div class="camera-controls">
                    <div class="camera-mode active" data-mode="drone-overview">🚁 Drone Overview</div>
                    <div class="camera-mode" data-mode="drone-follow">📹 Drone Follow</div>
                    <div class="camera-mode" data-mode="security-cam">📷 Security Cam</div>
                    <div class="camera-mode" data-mode="first-person">👁️ First Person</div>
                    <div class="camera-mode" data-mode="debug-matrix">🔍 Debug Matrix</div>
                    <div class="camera-mode" data-mode="cinematic">🎬 Cinematic</div>
                </div>
                
                <!-- Debug Panel -->
                <div class="debug-panel" id="debug-panel">
                    <h3 style="color: #ff9900; margin-bottom: 10px;">🔍 Debug Mode</h3>
                    <div id="debug-layers">
                        <!-- Debug layers will be populated here -->
                    </div>
                    <button onclick="exitDebugMode()" style="width: 100%; margin-top: 10px; padding: 8px; background: #ff9900; border: none; color: #000; border-radius: 5px; cursor: pointer;">Exit Debug</button>
                </div>
                
                <!-- First-person overlay -->
                <div class="first-person-overlay" id="fp-overlay">
                    <div class="debug-hud">
                        <div class="hud-section">
                            <div class="hud-title">Agent State</div>
                            <div class="hud-data" id="hud-state">Loading...</div>
                        </div>
                        <div class="hud-section">
                            <div class="hud-title">Reasoning</div>
                            <div class="hud-data" id="hud-reasoning">Initializing...</div>
                        </div>
                        <div class="hud-section">
                            <div class="hud-title">Performance</div>
                            <div class="hud-data" id="hud-performance">Monitoring...</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Side Panel -->
            <div class="side-panel">
                <div class="agent-list" id="agent-list">
                    <h3 style="margin-bottom: 10px;">🤖 AI Agents</h3>
                    <!-- Agent cards will be populated here -->
                </div>
                
                <div class="chat-section">
                    <div class="chat-messages" id="chat-messages">
                        <div style="color: #666; font-size: 11px;">💬 Use commands like /follow, /debug, /camera, /record, /teleport</div>
                    </div>
                    <div class="chat-input">
                        <input type="text" class="command-input" id="command-input" 
                               placeholder="Type command or chat message..." 
                               onkeypress="handleCommandInput(event)">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer Layer -->
        <div class="footer-layer">
            <div class="timeline-section">
                <h4 style="margin-bottom: 5px; font-size: 12px;">📹 Timeline</h4>
                <div class="timeline-frames" id="timeline-frames">
                    <!-- Timeline frames will be populated here -->
                </div>
            </div>
            
            <div class="summary-section">
                <h4 style="margin-bottom: 5px; font-size: 12px;">📊 Live Data</h4>
                <div id="data-summaries">
                    <div class="data-summary">🎯 Active Agents: <span id="active-agents">0</span></div>
                    <div class="data-summary">💰 Transactions: <span id="transactions">0</span></div>
                    <div class="data-summary">🔍 Debug Sessions: <span id="debug-sessions">0</span></div>
                    <div class="data-summary">📹 Recording: <span id="recording-status">Off</span></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Enhanced Viewer JavaScript
        const ws = new WebSocket('ws://localhost:8889');
        let currentCamera = 'drone-overview';
        let debugMode = false;
        let recording = false;
        let agents = new Map();
        let frameCount = 0;
        
        ws.onopen = () => {
            console.log('🎮 Connected to Enhanced Broadcast Viewer!');
            addChatMessage('system', '✅ Connected to enhanced viewer');
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleEnhancedMessage(message);
        };
        
        function handleEnhancedMessage(message) {
            switch (message.type) {
                case 'enhanced_init':
                    initializeEnhancedViewer(message);
                    break;
                    
                case 'enhanced_scene_update':
                    updateEnhancedScene(message);
                    break;
                    
                case 'camera_changed':
                    updateCameraView(message);
                    break;
                    
                case 'debug_mode_entered':
                    enterDebugMode(message);
                    break;
                    
                case 'debug_mode_exited':
                    exitDebugMode();
                    break;
                    
                case 'recording_status':
                    updateRecordingStatus(message);
                    break;
            }
        }
        
        function initializeEnhancedViewer(data) {
            console.log('🚀 Initializing enhanced viewer with', data.cameraSystem);
            
            // Setup camera controls
            setupCameraControls(data.cameraSystem);
            
            // Initialize canvas
            initializeCanvas();
            
            addChatMessage('system', '🎮 Enhanced viewer ready! Try /help for commands');
        }
        
        function setupCameraControls(cameraSystem) {
            const controls = document.querySelectorAll('.camera-mode');
            controls.forEach(control => {
                control.addEventListener('click', () => {
                    const mode = control.getAttribute('data-mode');
                    switchCamera(mode);
                });
            });
        }
        
        function initializeCanvas() {
            const canvas = document.getElementById('camera-canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            // Start render loop
            requestAnimationFrame(renderLoop);
        }
        
        function renderLoop() {
            const canvas = document.getElementById('camera-canvas');
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Render based on current camera mode
            renderCameraView(ctx, currentCamera);
            
            frameCount++;
            requestAnimationFrame(renderLoop);
        }
        
        function renderCameraView(ctx, cameraMode) {
            // Draw background grid
            drawGrid(ctx);
            
            // Draw agents
            for (const agent of agents.values()) {
                drawAgent(ctx, agent, cameraMode);
            }
            
            // Draw debug data if in debug mode
            if (debugMode) {
                drawDebugData(ctx);
            }
            
            // Draw camera-specific overlays
            drawCameraOverlay(ctx, cameraMode);
        }
        
        function drawGrid(ctx) {
            const canvas = ctx.canvas;
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            
            const gridSize = 50;
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }
        
        function drawAgent(ctx, agent, cameraMode) {
            const x = (agent.position.x + 100) * 3; // Scale and offset
            const y = (agent.position.y + 100) * 3;
            
            // Agent circle
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Agent name
            ctx.fillStyle = 'white';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(agent.name, x, y - 25);
            
            // Activity
            ctx.fillStyle = '#ffff00';
            ctx.font = '10px monospace';
            ctx.fillText(agent.activity.replace('_', ' '), x, y + 35);
            
            // Debug info if debugging this agent
            if (debugMode && agent.debugging) {
                ctx.strokeStyle = '#ff9900';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.stroke();
                
                // Debug text
                ctx.fillStyle = '#ff9900';
                ctx.font = '10px monospace';
                ctx.fillText('DEBUG', x, y + 50);
            }
        }
        
        function drawDebugData(ctx) {
            // Draw debug overlay
            ctx.fillStyle = 'rgba(255, 153, 0, 0.1)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Debug info
            ctx.fillStyle = '#ff9900';
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('🔍 DEBUG MODE ACTIVE', 10, 30);
            ctx.fillText(\`Frame: \${frameCount}\`, 10, 50);
            ctx.fillText(\`Agents: \${agents.size}\`, 10, 70);
        }
        
        function drawCameraOverlay(ctx, cameraMode) {
            // Draw camera-specific UI elements
            switch (cameraMode) {
                case 'first-person':
                    drawFirstPersonHUD(ctx);
                    break;
                    
                case 'debug-matrix':
                    drawMatrixOverlay(ctx);
                    break;
                    
                case 'security-cam':
                    drawSecurityCamOverlay(ctx);
                    break;
            }
        }
        
        function drawFirstPersonHUD(ctx) {
            // Crosshair
            const centerX = ctx.canvas.width / 2;
            const centerY = ctx.canvas.height / 2;
            
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - 10, centerY);
            ctx.lineTo(centerX + 10, centerY);
            ctx.moveTo(centerX, centerY - 10);
            ctx.lineTo(centerX, centerY + 10);
            ctx.stroke();
        }
        
        function drawMatrixOverlay(ctx) {
            // Matrix-style data stream
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.font = '10px monospace';
            
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * ctx.canvas.width;
                const y = Math.random() * ctx.canvas.height;
                ctx.fillText(Math.random().toString(36).substr(2, 5), x, y);
            }
        }
        
        function drawSecurityCamOverlay(ctx) {
            // Security camera UI
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(10, 10, ctx.canvas.width - 20, ctx.canvas.height - 20);
            ctx.stroke();
            
            // REC indicator
            ctx.fillStyle = '#ff0000';
            ctx.font = '16px monospace';
            ctx.fillText('REC ●', ctx.canvas.width - 80, 30);
        }
        
        function switchCamera(mode) {
            currentCamera = mode;
            
            // Update UI
            document.querySelectorAll('.camera-mode').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(\`[data-mode="\${mode}"]\`).classList.add('active');
            
            // Update indicator
            const modeNames = {
                'drone-overview': '🚁 Drone Overview',
                'drone-follow': '📹 Drone Follow',
                'security-cam': '📷 Security Cam',
                'first-person': '👁️ First Person',
                'debug-matrix': '🔍 Debug Matrix',
                'cinematic': '🎬 Cinematic'
            };
            
            document.getElementById('camera-indicator').textContent = \`📹 \${modeNames[mode] || mode}\`;
            
            // Send to server
            ws.send(JSON.stringify({
                type: 'camera_change',
                mode: mode
            }));
            
            // Handle first-person mode
            if (mode === 'first-person') {
                document.getElementById('fp-overlay').classList.add('active');
            } else {
                document.getElementById('fp-overlay').classList.remove('active');
            }
        }
        
        function handleCommandInput(event) {
            if (event.key === 'Enter') {
                const input = event.target.value.trim();
                if (!input) return;
                
                if (input.startsWith('/')) {
                    handleCommand(input);
                } else {
                    handleChatMessage(input);
                }
                
                event.target.value = '';
            }
        }
        
        function handleCommand(command) {
            const parts = command.substr(1).split(' ');
            const cmd = parts[0];
            const args = parts.slice(1);
            
            addChatMessage('user', command);
            
            switch (cmd) {
                case 'help':
                    showHelp();
                    break;
                    
                case 'camera':
                    if (args[0]) {
                        switchCamera(args[0]);
                    }
                    break;
                    
                case 'debug':
                    if (args[0]) {
                        enterDebugModeForAgent(args[0]);
                    }
                    break;
                    
                case 'record':
                    handleRecordCommand(args[0]);
                    break;
                    
                default:
                    ws.send(JSON.stringify({
                        type: 'user_command',
                        command: cmd,
                        args: args
                    }));
            }
        }
        
        function showHelp() {
            const commands = [
                '/camera [mode] - Switch camera mode',
                '/debug [agent] - Enter debug mode for agent',
                '/follow [agent] - Follow an agent',
                '/record [start|stop|bookmark] - Recording controls',
                '/teleport [x] [y] [z] - Teleport camera',
                '/help - Show this help'
            ];
            
            commands.forEach(cmd => {
                addChatMessage('system', cmd);
            });
        }
        
        function handleRecordCommand(action) {
            recording = (action === 'start');
            document.getElementById('recording-status').textContent = recording ? 'On' : 'Off';
            
            if (recording) {
                document.querySelector('.main-view').classList.add('recording');
                addChatMessage('system', '🔴 Recording started');
            } else {
                document.querySelector('.main-view').classList.remove('recording');
                addChatMessage('system', '⏹️ Recording stopped');
            }
        }
        
        function enterDebugModeForAgent(agentName) {
            ws.send(JSON.stringify({
                type: 'debug_request',
                action: 'enter',
                agentId: agentName
            }));
        }
        
        function enterDebugMode(data) {
            debugMode = true;
            document.getElementById('debug-panel').classList.add('active');
            document.querySelector('.main-view').classList.add('debugging');
            
            addChatMessage('system', \`🔍 Entered debug mode for \${data.agentId}\`);
        }
        
        function exitDebugMode() {
            debugMode = false;
            document.getElementById('debug-panel').classList.remove('active');
            document.querySelector('.main-view').classList.remove('debugging');
            document.getElementById('fp-overlay').classList.remove('active');
            
            ws.send(JSON.stringify({
                type: 'debug_request',
                action: 'exit'
            }));
            
            addChatMessage('system', '👁️ Exited debug mode');
        }
        
        function handleChatMessage(message) {
            addChatMessage('user', message);
            // Send to other viewers
        }
        
        function addChatMessage(sender, message) {
            const messages = document.getElementById('chat-messages');
            const div = document.createElement('div');
            div.style.marginBottom = '5px';
            
            const senderColor = {
                'system': '#00ff88',
                'user': '#ffff00',
                'debug': '#ff9900'
            }[sender] || '#fff';
            
            div.innerHTML = \`<span style="color: \${senderColor};">\${sender}:</span> \${message}\`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function updateEnhancedScene(sceneData) {
            // Update agents
            if (sceneData.agents) {
                agents.clear();
                sceneData.agents.forEach(agent => {
                    agents.set(agent.id, agent);
                });
                
                updateAgentList();
            }
            
            // Update stats
            document.getElementById('active-agents').textContent = agents.size;
        }
        
        function updateAgentList() {
            const agentList = document.getElementById('agent-list');
            const existingCards = agentList.querySelectorAll('.agent-card');
            existingCards.forEach(card => card.remove());
            
            for (const agent of agents.values()) {
                const card = document.createElement('div');
                card.className = 'agent-card';
                card.innerHTML = \`
                    <div class="agent-name">\${agent.avatar || '🤖'} \${agent.name}</div>
                    <div class="agent-activity">\${agent.activity.replace('_', ' ')}</div>
                \`;
                
                card.addEventListener('click', () => {
                    enterDebugModeForAgent(agent.id);
                });
                
                agentList.appendChild(card);
            }
        }
        
        // Window resize handling
        window.addEventListener('resize', () => {
            const canvas = document.getElementById('camera-canvas');
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        });
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🎮 Enhanced Broadcast Viewer loading...');
        });
    </script>
</body>
</html>`;
    }
}

// Export for use
module.exports = EnhancedBroadcastViewer;

// Run if called directly
if (require.main === module) {
    const viewer = new EnhancedBroadcastViewer();
    
    viewer.initialize().then(async () => {
        console.log('\n🎮 ENHANCED BROADCAST VIEWER IS LIVE!');
        console.log('=====================================');
        console.log('🚁 Multiple drone camera modes');
        console.log('👁️ First-person debugging ("drop into the TV")');
        console.log('💎 Diamond pattern layout (header/middle/footer)');
        console.log('🎮 Charades-style user interaction');
        console.log('📹 Frame recording and playback');
        console.log('🔍 Granular debugging capabilities');
        console.log('');
        console.log('🌐 Enhanced Viewer: http://localhost:8889');
        console.log('📺 Camera Modes:');
        
        for (const [mode, config] of Object.entries(viewer.cameraSystem.modes)) {
            console.log(`   ${config.name} - ${config.description}`);
        }
        
        // Create enhanced viewer HTML file
        await fs.writeFile('enhanced-broadcast-viewer.html', viewer.getEnhancedViewerHTML());
        console.log('\n📄 Enhanced viewer interface saved: enhanced-broadcast-viewer.html');
        
        console.log('\n🎮 Available Commands:');
        console.log('- /camera [mode] - Switch camera view');
        console.log('- /debug [agent] - Enter first-person debug mode');
        console.log('- /follow [agent] - Drone follows agent');
        console.log('- /record [start|stop|bookmark] - Recording controls');
        console.log('- /teleport [x] [y] [z] - Teleport camera position');
        
        console.log('\n💎 Diamond Structure:');
        console.log('- Header (15%): Zone navigation, stream status');
        console.log('- Middle (70%): Main view, agent panels, interactions');
        console.log('- Footer (15%): Timeline, summaries, search index');
        
        // Keep running
        process.on('SIGINT', () => {
            console.log('\n🎮 Enhanced viewer stopped!');
            process.exit();
        });
    });
}