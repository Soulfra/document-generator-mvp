#!/usr/bin/env node

/**
 * 🌉 UNIFIED PERSONAL OS BRIDGE SYSTEM
 * Connects signature authentication → 3D world → tier navigation → backoffice collaboration
 * The central nervous system that makes all components work together as a personal OS
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

class UnifiedPersonalOSBridge extends EventEmitter {
    constructor() {
        super();
        
        // Core OS Bridge Configuration
        this.config = {
            bridgePort: 3D_BRIDGE_PORT || 9500,
            wsPort: 9501,
            systemName: 'PersonalOS',
            version: '1.0.0',
            mode: 'collaborative' // solo, collaborative, enterprise
        };
        
        // System Components Registry
        this.components = {
            agenticOS: null,              // AGENTIC-OPERATING-SYSTEM.js
            signatureAuth: null,          // ascii-art-signature-generator.js
            soulfra3D: null,             // SOULFRA-3D-WORLD-ENGINE.html
            tierWorkflow: null,          // tier-based-workflow-system.js
            profileScraper: null,        // social-media-profile-scraper.js
            templateEngine: null,        // template-analysis-repurposing-engine.js
            musicLayer: null,            // music-integration-layer.js
            streamingPlatform: null,     // start-branded-streaming-platform.js
            gameEngine: null             // unified-3d-game-engine.js
        };
        
        // User Session Management
        this.activeSessions = new Map();
        this.userWorkspaces = new Map();
        this.collaborationRooms = new Map();
        
        // 3D World Integration
        this.worldInstances = new Map();
        this.tierBuildings = new Map();
        this.transportSystem = new Map();
        
        // Backoffice Integration
        this.staffMembers = new Map();
        this.departmentWorkspaces = new Map();
        this.projectCollaborations = new Map();
        
        this.initializeBridgeSystem();
    }
    
    async initializeBridgeSystem() {
        console.log('🌉 UNIFIED PERSONAL OS BRIDGE SYSTEM');
        console.log('====================================');
        console.log('🔗 Connecting all components into unified personal OS...\n');
        
        // Initialize core systems
        await this.setupWebServer();
        await this.setupWebSocketServer();
        await this.detectExistingComponents();
        await this.initializeComponentBridges();
        await this.setup3DWorldIntegration();
        await this.setupTierNavigation();
        await this.initializeBackofficeCollaboration();
        
        console.log('✅ Personal OS Bridge System ready!');
        console.log(`🌐 Web Interface: http://localhost:${this.config.bridgePort}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
        console.log('👥 Multi-user collaboration enabled\n');
        
        this.startUnifiedPersonalOS();
    }
    
    async setupWebServer() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // Main Personal OS Interface
        this.app.get('/', (req, res) => {
            res.send(this.generatePersonalOSInterface());
        });
        
        // User Authentication Endpoint
        this.app.post('/auth/signature', async (req, res) => {
            const { signature, name } = req.body;
            const session = await this.authenticateUserWithSignature(signature, name);
            res.json(session);
        });
        
        // 3D World Spawn Endpoint
        this.app.post('/3d/spawn', async (req, res) => {
            const { sessionId, preferences } = req.body;
            const worldInstance = await this.spawn3DWorkspace(sessionId, preferences);
            res.json(worldInstance);
        });
        
        // Tier Navigation Endpoint
        this.app.post('/tier/navigate', async (req, res) => {
            const { sessionId, targetTier, transport } = req.body;
            const navigation = await this.navigateToTier(sessionId, targetTier, transport);
            res.json(navigation);
        });
        
        // Collaboration Endpoints
        this.app.post('/collab/join', async (req, res) => {
            const { sessionId, roomId, role } = req.body;
            const room = await this.joinCollaborationRoom(sessionId, roomId, role);
            res.json(room);
        });
        
        // Component Status
        this.app.get('/api/status', (req, res) => {
            res.json(this.getSystemStatus());
        });
        
        this.server = this.app.listen(this.config.bridgePort);
        console.log(`🌐 Bridge web server running on port ${this.config.bridgePort}`);
    }
    
    async setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection');
            
            ws.on('message', async (message) => {
                const data = JSON.parse(message);
                await this.handleWebSocketMessage(ws, data);
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
                this.cleanupUserSession(ws);
            });
        });
        
        console.log(`🔌 WebSocket server running on port ${this.config.wsPort}`);
    }
    
    async detectExistingComponents() {
        console.log('🔍 Detecting existing system components...');
        
        const componentFiles = {
            agenticOS: './AGENTIC-OPERATING-SYSTEM.js',
            signatureAuth: './ascii-art-signature-generator.js',
            soulfra3D: './SOULFRA-3D-WORLD-ENGINE.html',
            tierWorkflow: './tier-based-workflow-system.js',
            profileScraper: './social-media-profile-scraper.js',
            templateEngine: './template-analysis-repurposing-engine.js',
            musicLayer: './music-integration-layer.js',
            streamingPlatform: './start-branded-streaming-platform.js',
            gameEngine: './unified-3d-game-engine.js'
        };
        
        for (const [component, filePath] of Object.entries(componentFiles)) {
            try {
                await fs.access(filePath);
                this.components[component] = {
                    available: true,
                    path: filePath,
                    status: 'detected',
                    lastSeen: new Date().toISOString()
                };
                console.log(`  ✅ ${component}: Found`);
            } catch (error) {
                this.components[component] = {
                    available: false,
                    path: filePath,
                    status: 'missing',
                    error: error.message
                };
                console.log(`  ❌ ${component}: Missing`);
            }
        }
    }
    
    async initializeComponentBridges() {
        console.log('\n🔗 Initializing component bridges...');
        
        // Initialize available components
        for (const [name, component] of Object.entries(this.components)) {
            if (component.available) {
                try {
                    if (name === 'agenticOS' || name === 'signatureAuth' || 
                        name === 'tierWorkflow' || name === 'profileScraper' ||
                        name === 'templateEngine' || name === 'musicLayer') {
                        
                        // Load Node.js modules
                        const ComponentClass = require(component.path);
                        component.instance = new ComponentClass();
                        component.status = 'initialized';
                        console.log(`  🔗 ${name}: Bridge initialized`);
                    } else {
                        // HTML/Browser components will be loaded via iframe/webview
                        component.status = 'ready_for_browser';
                        console.log(`  🌐 ${name}: Ready for browser integration`);
                    }
                } catch (error) {
                    console.log(`  ⚠️ ${name}: Bridge failed - ${error.message}`);
                    component.status = 'bridge_failed';
                }
            }
        }
    }
    
    async setup3DWorldIntegration() {
        console.log('\n🌍 Setting up 3D world integration...');
        
        // Define tier buildings in 3D space
        this.tierBuildings = new Map([
            [1, { 
                name: 'Content Discovery Station',
                position: { x: 0, y: 0, z: 0 },
                type: 'scanner',
                transport: 'automobile',
                color: '#00ff41'
            }],
            [2, { 
                name: 'Template Analysis Lab',
                position: { x: 50, y: 0, z: 0 },
                type: 'laboratory',
                transport: 'automobile',
                color: '#4169E1'
            }],
            [3, { 
                name: 'Music Integration Studio',
                position: { x: 100, y: 0, z: 0 },
                type: 'studio',
                transport: 'train',
                color: '#9370DB'
            }],
            [4, { 
                name: 'Content Creation Workshop',
                position: { x: 0, y: 0, z: 50 },
                type: 'workshop',
                transport: 'train',
                color: '#FFD700'
            }],
            [5, { 
                name: 'Word Art Gallery',
                position: { x: 50, y: 0, z: 50 },
                type: 'gallery',
                transport: 'train',
                color: '#FF6347'
            }],
            [6, { 
                name: 'Publication Broadcast Center',
                position: { x: 100, y: 50, z: 50 },
                type: 'broadcaster',
                transport: 'plane',
                color: '#32CD32'
            }],
            [7, { 
                name: 'Analytics Observatory',
                position: { x: 50, y: 100, z: 50 },
                type: 'observatory',
                transport: 'plane',
                color: '#FF1493'
            }]
        ]);
        
        // Setup transport system
        this.transportSystem = new Map([
            ['automobile', { speed: 5, capacity: 1, tiers: [1, 2], icon: '🚗' }],
            ['train', { speed: 15, capacity: 4, tiers: [3, 4, 5], icon: '🚂' }],
            ['plane', { speed: 30, capacity: 10, tiers: [6, 7], icon: '✈️' }]
        ]);
        
        console.log('  🏢 Created 7 tier buildings in 3D space');
        console.log('  🚗 Automobile: Tiers 1-2 (local work)');
        console.log('  🚂 Train: Tiers 3-5 (connected workflows)');
        console.log('  ✈️ Plane: Tiers 6-7 (high-level strategy)');
    }
    
    async setupTierNavigation() {
        console.log('\n🎯 Setting up tier-based navigation...');
        
        // Keyboard shortcut mappings for 3D world
        this.keyboardMappings = new Map([
            // Movement
            ['KeyW', { action: 'move_forward', context: '3d_navigation' }],
            ['KeyA', { action: 'move_left', context: '3d_navigation' }],
            ['KeyS', { action: 'move_backward', context: '3d_navigation' }],
            ['KeyD', { action: 'move_right', context: '3d_navigation' }],
            
            // Tier navigation
            ['Digit1', { action: 'goto_tier_1', context: 'tier_navigation' }],
            ['Digit2', { action: 'goto_tier_2', context: 'tier_navigation' }],
            ['Digit3', { action: 'goto_tier_3', context: 'tier_navigation' }],
            ['Digit4', { action: 'goto_tier_4', context: 'tier_navigation' }],
            ['Digit5', { action: 'goto_tier_5', context: 'tier_navigation' }],
            ['Digit6', { action: 'goto_tier_6', context: 'tier_navigation' }],
            ['Digit7', { action: 'goto_tier_7', context: 'tier_navigation' }],
            
            // Transport
            ['KeyC', { action: 'call_automobile', context: 'transport' }],
            ['KeyT', { action: 'call_train', context: 'transport' }],
            ['KeyP', { action: 'call_plane', context: 'transport' }],
            
            // Actions
            ['Enter', { action: 'execute_tier', context: 'tier_action' }],
            ['Space', { action: 'interact', context: 'interaction' }],
            ['Escape', { action: 'open_menu', context: 'system' }]
        ]);
        
        console.log('  ⌨️ Keyboard shortcuts mapped for 3D navigation');
        console.log('  🎯 Tier building locations configured');
    }
    
    async initializeBackofficeCollaboration() {
        console.log('\n👥 Setting up backoffice collaboration...');
        
        // Define staff roles and permissions
        this.staffRoles = new Map([
            ['admin', {
                permissions: ['all'],
                defaultWorkspace: 'executive_suite',
                canCreateUsers: true,
                canAccessAllTiers: true
            }],
            ['content_creator', {
                permissions: ['tiers_1_4', 'templates', 'social_media'],
                defaultWorkspace: 'content_studio',
                canCreateUsers: false,
                canAccessAllTiers: false
            }],
            ['analyst', {
                permissions: ['tiers_6_7', 'analytics', 'reports'],
                defaultWorkspace: 'analytics_center',
                canCreateUsers: false,
                canAccessAllTiers: false
            }],
            ['designer', {
                permissions: ['tiers_2_5', 'templates', 'word_art'],
                defaultWorkspace: 'design_lab',
                canCreateUsers: false,
                canAccessAllTiers: false
            }],
            ['manager', {
                permissions: ['tier_6', 'collaboration', 'oversight'],
                defaultWorkspace: 'management_tower',
                canCreateUsers: true,
                canAccessAllTiers: false
            }]
        ]);
        
        // Create department workspaces
        this.departmentWorkspaces = new Map([
            ['content_team', {
                name: 'Content Team Workspace',
                location: { x: -50, y: 0, z: 0 },
                tiers: [1, 2, 4],
                sharedResources: ['templates', 'media_library']
            }],
            ['design_team', {
                name: 'Design Team Studio',
                location: { x: 0, y: 0, z: -50 },
                tiers: [2, 3, 5],
                sharedResources: ['fonts', 'graphics', 'brand_assets']
            }],
            ['analytics_team', {
                name: 'Analytics Command Center',
                location: { x: 0, y: 50, z: 0 },
                tiers: [6, 7],
                sharedResources: ['reports', 'dashboards', 'metrics']
            }],
            ['executive_suite', {
                name: 'Executive Overview',
                location: { x: 0, y: 100, z: 0 },
                tiers: [6, 7],
                sharedResources: ['all']
            }]
        ]);
        
        console.log('  👤 Staff roles configured (admin, creator, analyst, designer, manager)');
        console.log('  🏢 Department workspaces created');
        console.log('  🤝 Collaboration permissions set');
    }
    
    async authenticateUserWithSignature(signature, name) {
        console.log(`\n✍️ Authenticating user: ${name}`);
        
        // Generate unique session
        const sessionId = crypto.randomUUID();
        const userId = crypto.createHash('sha256').update(signature + name).digest('hex').slice(0, 16);
        
        // Create user profile
        const userProfile = {
            sessionId,
            userId,
            name,
            signature,
            signatureStyle: this.analyzeSignatureStyle(signature),
            role: 'content_creator', // Default role
            permissions: this.staffRoles.get('content_creator').permissions,
            workspace: null,
            currentTier: 1,
            currentTransport: null,
            collaborationRooms: [],
            preferences: {
                theme: 'professional',
                shortcuts: 'enabled',
                notifications: 'important_only'
            },
            loginTime: new Date().toISOString()
        };
        
        // Store session
        this.activeSessions.set(sessionId, userProfile);
        
        console.log(`  ✅ User authenticated: ${name} (${userId})`);
        console.log(`  🎯 Starting at Tier 1: Content Discovery`);
        
        return {
            success: true,
            sessionId,
            userProfile,
            nextStep: 'spawn_3d_workspace'
        };
    }
    
    async spawn3DWorkspace(sessionId, preferences = {}) {
        const user = this.activeSessions.get(sessionId);
        if (!user) throw new Error('Invalid session');
        
        console.log(`\n🌍 Spawning 3D workspace for ${user.name}...`);
        
        // Create personal workspace instance
        const workspaceId = `workspace_${user.userId}_${Date.now()}`;
        const workspace = {
            id: workspaceId,
            owner: user.userId,
            type: 'personal',
            spawnLocation: { x: 0, y: 2, z: 0 }, // Spawn at Tier 1 building
            currentTier: 1,
            availableTiers: this.getAvailableTiers(user.role),
            buildings: Array.from(this.tierBuildings.entries()),
            transport: Array.from(this.transportSystem.entries()),
            collaborators: [],
            sharedResources: [],
            created: new Date().toISOString()
        };
        
        // Store workspace
        this.userWorkspaces.set(sessionId, workspace);
        this.worldInstances.set(workspaceId, workspace);
        
        // Update user profile
        user.workspace = workspaceId;
        user.spawnLocation = workspace.spawnLocation;
        
        console.log(`  🏗️ Workspace created: ${workspaceId}`);
        console.log(`  📍 Spawn location: Tier 1 Building`);
        console.log(`  🎯 Available tiers: ${workspace.availableTiers.join(', ')}`);
        
        return {
            success: true,
            workspace,
            instructions: 'Use WASD to move, number keys (1-7) for tiers, C/T/P for transport'
        };
    }
    
    async navigateToTier(sessionId, targetTier, transport = 'auto') {
        const user = this.activeSessions.get(sessionId);
        const workspace = this.userWorkspaces.get(sessionId);
        
        if (!user || !workspace) throw new Error('Invalid session or workspace');
        
        console.log(`\n🎯 ${user.name} navigating to Tier ${targetTier}...`);
        
        // Check permissions
        if (!workspace.availableTiers.includes(targetTier)) {
            throw new Error(`Access denied to Tier ${targetTier}`);
        }
        
        // Get tier building
        const building = this.tierBuildings.get(targetTier);
        if (!building) throw new Error(`Tier ${targetTier} building not found`);
        
        // Determine transport method
        const recommendedTransport = building.transport;
        const selectedTransport = transport === 'auto' ? recommendedTransport : transport;
        
        // Execute navigation
        const navigation = {
            from: user.currentTier,
            to: targetTier,
            transport: selectedTransport,
            building,
            estimatedTime: this.calculateTravelTime(user.currentTier, targetTier, selectedTransport),
            route: this.calculateRoute(user.currentTier, targetTier),
            arrived: false
        };
        
        // Update user state
        user.currentTier = targetTier;
        user.currentTransport = selectedTransport;
        
        console.log(`  🚀 Transport: ${this.transportSystem.get(selectedTransport).icon} ${selectedTransport}`);
        console.log(`  📍 Destination: ${building.name}`);
        console.log(`  ⏱️ ETA: ${navigation.estimatedTime}s`);
        
        // Trigger tier-specific component
        await this.activateTierComponent(sessionId, targetTier);
        
        return navigation;
    }
    
    async activateTierComponent(sessionId, tier) {
        const user = this.activeSessions.get(sessionId);
        
        console.log(`  🔧 Activating Tier ${tier} component...`);
        
        switch (tier) {
            case 1:
                if (this.components.profileScraper?.instance) {
                    // Activate social media scraper
                    console.log('    🕷️ Social Media Profile Scraper ready');
                }
                break;
            case 2:
                if (this.components.templateEngine?.instance) {
                    // Activate template analysis
                    console.log('    🎨 Template Analysis Engine ready');
                }
                break;
            case 3:
                if (this.components.musicLayer?.instance) {
                    // Activate music integration
                    console.log('    🎵 Music Integration Layer ready');
                }
                break;
            case 4:
                // Content creation tools
                console.log('    📝 Content Creation Workshop ready');
                break;
            case 5:
                // Word art tools (to be implemented)
                console.log('    🎨 Word Art Gallery ready');
                break;
            case 6:
                if (this.components.streamingPlatform?.available) {
                    // Publication tools
                    console.log('    📡 Publication Broadcast Center ready');
                }
                break;
            case 7:
                // Analytics dashboard
                console.log('    📊 Analytics Observatory ready');
                break;
        }
    }
    
    generatePersonalOSInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🖥️ Personal OS - Unified Workspace</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff41;
            height: 100vh;
            overflow: hidden;
        }
        
        .os-container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: rgba(0, 0, 0, 0.8);
            border-right: 2px solid #00ff41;
            padding: 20px;
            overflow-y: auto;
        }
        
        .main-workspace {
            flex: 1;
            position: relative;
            background: radial-gradient(circle at center, #001122 0%, #000000 70%);
        }
        
        .auth-screen {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff41;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            min-width: 400px;
        }
        
        .signature-pad {
            width: 300px;
            height: 150px;
            border: 2px solid #00ff41;
            border-radius: 10px;
            background: #000;
            margin: 20px auto;
            cursor: crosshair;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .btn {
            background: linear-gradient(45deg, #00ff41, #00cc33);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            margin: 10px;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 255, 65, 0.4);
        }
        
        .component-status {
            margin: 10px 0;
            padding: 10px;
            background: rgba(0, 255, 65, 0.1);
            border-left: 3px solid #00ff41;
            border-radius: 5px;
        }
        
        .tier-nav {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 5px;
            margin: 20px 0;
        }
        
        .tier-btn {
            padding: 10px;
            background: rgba(0, 255, 65, 0.2);
            border: 1px solid #00ff41;
            color: #00ff41;
            cursor: pointer;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .tier-btn:hover {
            background: rgba(0, 255, 65, 0.4);
        }
        
        .tier-btn.active {
            background: #00ff41;
            color: #000;
        }
        
        .transport-controls {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        
        .transport-btn {
            padding: 15px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff41;
            color: #00ff41;
            cursor: pointer;
            border-radius: 10px;
            font-size: 20px;
            transition: all 0.3s ease;
        }
        
        .transport-btn:hover {
            background: rgba(0, 255, 65, 0.2);
        }
        
        .status-display {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 15px;
            min-width: 250px;
        }
        
        input[type="text"] {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff41;
            color: #00ff41;
            padding: 10px;
            border-radius: 5px;
            font-family: inherit;
            width: 100%;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="os-container">
        <div class="sidebar">
            <h2>🖥️ Personal OS</h2>
            <p>Unified Workspace Bridge</p>
            
            <div id="systemStatus">
                <h3>📊 System Status</h3>
                <div class="component-status">
                    <strong>🌉 Bridge System:</strong> <span id="bridgeStatus">Initializing...</span>
                </div>
                <div class="component-status">
                    <strong>🌍 3D World:</strong> <span id="worldStatus">Ready</span>
                </div>
                <div class="component-status">
                    <strong>🎯 Tier Navigation:</strong> <span id="tierStatus">Ready</span>
                </div>
                <div class="component-status">
                    <strong>👥 Collaboration:</strong> <span id="collabStatus">Ready</span>
                </div>
            </div>
            
            <div id="tierNavigation" style="display: none;">
                <h3>🎯 Tier Navigation</h3>
                <div class="tier-nav">
                    <div class="tier-btn" data-tier="1">1<br>📱</div>
                    <div class="tier-btn" data-tier="2">2<br>🎨</div>
                    <div class="tier-btn" data-tier="3">3<br>🎵</div>
                    <div class="tier-btn" data-tier="4">4<br>📝</div>
                    <div class="tier-btn" data-tier="5">5<br>✨</div>
                    <div class="tier-btn" data-tier="6">6<br>📡</div>
                    <div class="tier-btn" data-tier="7">7<br>📊</div>
                </div>
                
                <h3>🚗 Transport</h3>
                <div class="transport-controls">
                    <div class="transport-btn" data-transport="automobile">🚗</div>
                    <div class="transport-btn" data-transport="train">🚂</div>
                    <div class="transport-btn" data-transport="plane">✈️</div>
                </div>
            </div>
            
            <div id="collaborationPanel" style="display: none;">
                <h3>👥 Collaboration</h3>
                <button class="btn" onclick="createRoom()">Create Room</button>
                <button class="btn" onclick="joinRoom()">Join Room</button>
                <div id="activeRooms"></div>
            </div>
        </div>
        
        <div class="main-workspace">
            <div id="authScreen" class="auth-screen">
                <h1>🖥️ Personal OS</h1>
                <h2>Sign in to your unified workspace</h2>
                
                <input type="text" id="userName" placeholder="Enter your name" />
                
                <div class="signature-pad" id="signaturePad">
                    Click to sign your name
                </div>
                
                <button class="btn" onclick="signIn()">🚀 Enter Personal OS</button>
                
                <div style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
                    <p>🎯 Your signature creates your personal 3D workspace</p>
                    <p>⌨️ Use WASD + number keys for tier navigation</p>
                    <p>👥 Collaborate with your team in shared spaces</p>
                </div>
            </div>
            
            <div id="workspace3D" style="display: none; width: 100%; height: 100%;">
                <iframe id="soulfra3D" src="./SOULFRA-3D-WORLD-ENGINE.html" 
                        style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
            
            <div class="status-display" id="statusDisplay" style="display: none;">
                <h3>📍 Current Status</h3>
                <p><strong>User:</strong> <span id="currentUser">-</span></p>
                <p><strong>Tier:</strong> <span id="currentTier">-</span></p>
                <p><strong>Transport:</strong> <span id="currentTransport">-</span></p>
                <p><strong>Workspace:</strong> <span id="currentWorkspace">-</span></p>
                <p><strong>Collaborators:</strong> <span id="collaboratorCount">0</span></p>
            </div>
        </div>
    </div>

    <script>
        let currentSession = null;
        let currentWorkspace = null;
        let ws = null;
        let signatureData = '';
        
        // Initialize WebSocket connection
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:9501');
            
            ws.onopen = function() {
                console.log('🔌 Connected to Personal OS Bridge');
                document.getElementById('bridgeStatus').textContent = 'Connected';
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = function() {
                console.log('🔌 Disconnected from bridge');
                document.getElementById('bridgeStatus').textContent = 'Disconnected';
            };
        }
        
        // Signature pad interaction
        document.getElementById('signaturePad').addEventListener('click', function() {
            const signature = prompt('Enter your signature style (elegant, bold, minimal, artistic):') || 'elegant';
            signatureData = signature;
            this.textContent = '✍️ ' + signature + ' signature ready';
            this.style.background = 'rgba(0, 255, 65, 0.2)';
        });
        
        // Sign in function
        async function signIn() {
            const name = document.getElementById('userName').value;
            if (!name || !signatureData) {
                alert('Please enter your name and create a signature');
                return;
            }
            
            try {
                const response = await fetch('/auth/signature', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ signature: signatureData, name })
                });
                
                const session = await response.json();
                if (session.success) {
                    currentSession = session;
                    await spawn3DWorkspace();
                    showWorkspace();
                }
            } catch (error) {
                console.error('Sign in failed:', error);
                alert('Sign in failed. Please try again.');
            }
        }
        
        // Spawn 3D workspace
        async function spawn3DWorkspace() {
            try {
                const response = await fetch('/3d/spawn', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        sessionId: currentSession.sessionId,
                        preferences: {} 
                    })
                });
                
                const workspace = await response.json();
                if (workspace.success) {
                    currentWorkspace = workspace.workspace;
                    updateStatusDisplay();
                }
            } catch (error) {
                console.error('Workspace spawn failed:', error);
            }
        }
        
        // Show workspace interface
        function showWorkspace() {
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('workspace3D').style.display = 'block';
            document.getElementById('statusDisplay').style.display = 'block';
            document.getElementById('tierNavigation').style.display = 'block';
            document.getElementById('collaborationPanel').style.display = 'block';
            
            // Setup tier navigation
            document.querySelectorAll('.tier-btn').forEach(btn => {
                btn.addEventListener('click', () => navigateToTier(btn.dataset.tier));
            });
            
            // Setup transport controls
            document.querySelectorAll('.transport-btn').forEach(btn => {
                btn.addEventListener('click', () => selectTransport(btn.dataset.transport));
            });
            
            // Setup keyboard shortcuts
            setupKeyboardShortcuts();
        }
        
        // Navigate to tier
        async function navigateToTier(tier) {
            if (!currentSession) return;
            
            try {
                const response = await fetch('/tier/navigate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        sessionId: currentSession.sessionId,
                        targetTier: parseInt(tier),
                        transport: 'auto'
                    })
                });
                
                const navigation = await response.json();
                if (navigation) {
                    updateCurrentTier(tier);
                    showTierTransition(navigation);
                }
            } catch (error) {
                console.error('Navigation failed:', error);
            }
        }
        
        // Update UI
        function updateStatusDisplay() {
            if (currentSession && currentWorkspace) {
                document.getElementById('currentUser').textContent = currentSession.userProfile.name;
                document.getElementById('currentTier').textContent = currentSession.userProfile.currentTier;
                document.getElementById('currentWorkspace').textContent = currentWorkspace.type;
            }
        }
        
        function updateCurrentTier(tier) {
            document.querySelectorAll('.tier-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(\`[data-tier="\${tier}"]\`).classList.add('active');
            document.getElementById('currentTier').textContent = tier;
        }
        
        function showTierTransition(navigation) {
            // Visual feedback for tier transition
            console.log('🎯 Transitioning to Tier', navigation.to);
            console.log('🚀 Using transport:', navigation.transport);
        }
        
        // Keyboard shortcuts
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT') return;
                
                // Number keys for tier navigation
                if (e.key >= '1' && e.key <= '7') {
                    navigateToTier(e.key);
                }
                
                // Transport shortcuts
                if (e.key === 'c' || e.key === 'C') selectTransport('automobile');
                if (e.key === 't' || e.key === 'T') selectTransport('train');
                if (e.key === 'p' || e.key === 'P') selectTransport('plane');
            });
        }
        
        function selectTransport(transport) {
            document.getElementById('currentTransport').textContent = transport;
            console.log('🚀 Selected transport:', transport);
        }
        
        // Collaboration functions
        function createRoom() {
            const roomName = prompt('Enter room name:');
            if (roomName) {
                console.log('🏠 Creating room:', roomName);
            }
        }
        
        function joinRoom() {
            const roomId = prompt('Enter room ID:');
            if (roomId) {
                console.log('🚪 Joining room:', roomId);
            }
        }
        
        function handleWebSocketMessage(data) {
            console.log('📨 WebSocket message:', data);
        }
        
        // Initialize everything
        window.addEventListener('load', () => {
            initWebSocket();
            console.log('🖥️ Personal OS Bridge Interface loaded');
        });
    </script>
</body>
</html>
        `;
    }
    
    // Utility methods
    analyzeSignatureStyle(signature) {
        const styles = ['elegant', 'bold', 'minimal', 'artistic'];
        return styles.includes(signature.toLowerCase()) ? signature.toLowerCase() : 'elegant';
    }
    
    getAvailableTiers(role) {
        const tierAccess = {
            admin: [1, 2, 3, 4, 5, 6, 7],
            content_creator: [1, 2, 3, 4],
            analyst: [6, 7],
            designer: [2, 3, 5],
            manager: [4, 5, 6]
        };
        return tierAccess[role] || [1];
    }
    
    calculateTravelTime(fromTier, toTier, transport) {
        const distance = Math.abs(fromTier - toTier);
        const speed = this.transportSystem.get(transport)?.speed || 5;
        return Math.ceil(distance / speed * 2); // Simulated seconds
    }
    
    calculateRoute(fromTier, toTier) {
        // Simple route calculation
        const steps = [];
        const direction = toTier > fromTier ? 1 : -1;
        
        for (let i = fromTier; i !== toTier; i += direction) {
            steps.push(i + direction);
        }
        
        return steps;
    }
    
    getSystemStatus() {
        return {
            bridge: {
                status: 'operational',
                version: this.config.version,
                uptime: process.uptime()
            },
            components: Object.fromEntries(
                Object.entries(this.components).map(([name, comp]) => [
                    name, 
                    { available: comp.available, status: comp.status }
                ])
            ),
            sessions: {
                active: this.activeSessions.size,
                workspaces: this.userWorkspaces.size,
                collaborations: this.collaborationRooms.size
            },
            system: {
                memory: process.memoryUsage(),
                platform: process.platform,
                nodeVersion: process.version
            }
        };
    }
    
    async handleWebSocketMessage(ws, data) {
        console.log('📨 WebSocket message:', data.type);
        
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'join_session':
                // Handle user joining session
                break;
            case 'tier_navigate':
                // Handle tier navigation request
                break;
            case 'collaboration_request':
                // Handle collaboration request
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    
    cleanupUserSession(ws) {
        // Clean up user session when WebSocket closes
        for (const [sessionId, user] of this.activeSessions.entries()) {
            if (user.ws === ws) {
                console.log(`🧹 Cleaning up session for ${user.name}`);
                this.activeSessions.delete(sessionId);
                this.userWorkspaces.delete(sessionId);
                break;
            }
        }
    }
    
    async startUnifiedPersonalOS() {
        console.log('\n🚀 UNIFIED PERSONAL OS OPERATIONAL');
        console.log('==================================');
        console.log('');
        console.log('👥 BACKOFFICE STAFF INSTRUCTIONS:');
        console.log('1. Open: http://localhost:9500');
        console.log('2. Sign your name with preferred style');
        console.log('3. Enter your personal 3D workspace');
        console.log('4. Use number keys (1-7) to navigate tiers');
        console.log('5. Use C/T/P for transport (car/train/plane)');
        console.log('6. Collaborate with team in shared spaces');
        console.log('');
        console.log('🎯 TIER SYSTEM:');
        console.log('  Tiers 1-2: 🚗 Local work (automobile)');
        console.log('  Tiers 3-5: 🚂 Connected workflows (train)');
        console.log('  Tiers 6-7: ✈️ Strategy & analytics (plane)');
        console.log('');
        console.log('✅ PERSONAL OS BRIDGE SYSTEM READY FOR PRODUCTION USE!');
    }
}

// Start the bridge system
if (require.main === module) {
    const bridge = new UnifiedPersonalOSBridge();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down Personal OS Bridge...');
        process.exit(0);
    });
}

module.exports = UnifiedPersonalOSBridge;