/**
 * 🌍 UNIFIED WORLD BUILDER
 * Everything layered like Habbo + RuneScape + Coke Music + ChronoQuest
 * Proper depth-based rendering with all systems integrated
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

class UnifiedWorldBuilder {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 10000;
        
        // World layers (depth-ordered)
        this.worldLayers = {
            foundation: {    // Layer 0 - Infrastructure
                depth: 0,
                opacity: 0.3,
                systems: ['blockchain', 'payments', 'databases', 'networking']
            },
            backend: {       // Layer 1 - Services  
                depth: 1,
                opacity: 0.4,
                systems: ['qr-bridge', 'device-verify', 'stripe-api', 'llm-router']
            },
            platform: {      // Layer 2 - Platform layer
                depth: 2,
                opacity: 0.5,
                systems: ['auth', 'user-management', 'inventory', 'economy']
            },
            world: {         // Layer 3 - Game world
                depth: 3,
                opacity: 0.7,
                systems: ['hex-grid', 'rooms', 'navigation', 'physics']
            },
            entities: {      // Layer 4 - Characters/NPCs
                depth: 4,
                opacity: 0.8,
                systems: ['avatars', 'npcs', 'pets', 'voxel-models']
            },
            gameplay: {      // Layer 5 - Game mechanics
                depth: 5,
                opacity: 0.9,
                systems: ['combat', 'trading', 'crafting', 'minigames']
            },
            interface: {     // Layer 6 - UI/UX
                depth: 6,
                opacity: 1.0,
                systems: ['hud', 'menus', 'chat', 'inventory-ui']
            }
        };
        
        // Game modes built on top
        this.gameModes = {
            shiprekt: {
                name: 'ShipRekt',
                description: 'Naval combat with crypto stakes',
                layers: ['world', 'entities', 'gameplay', 'interface']
            },
            bashVCs: {
                name: 'Bash VCs', 
                description: 'Venture Capital simulator',
                layers: ['platform', 'world', 'gameplay', 'interface']
            },
            chronoQuest: {
                name: 'ChronoQuest Revival',
                description: 'Time-traveling adventure',
                layers: ['backend', 'world', 'entities', 'gameplay']
            },
            habboRemix: {
                name: 'Habbo Remix',
                description: 'Social room builder',
                layers: ['world', 'entities', 'interface']
            },
            runescapeVoxel: {
                name: 'RuneScape Voxel',
                description: '3D skill-based MMO',
                layers: ['platform', 'world', 'entities', 'gameplay']
            }
        };
        
        console.log('🌍 UNIFIED WORLD BUILDER');
        console.log('🏗️ Constructing layered reality...');
        this.init();
    }
    
    init() {
        this.app.use(express.json({ limit: '50mb' }));
        
        this.app.get('/', (req, res) => {
            res.send(this.getUnifiedWorldInterface());
        });
        
        this.app.get('/api/sitemap', (req, res) => {
            res.json(this.generateCompleteSitemap());
        });
        
        this.app.get('/api/layers', (req, res) => {
            res.json(this.worldLayers);
        });
        
        this.app.post('/api/world/:layer/interact', (req, res) => {
            const result = this.interactWithLayer(req.params.layer, req.body);
            res.json(result);
        });
        
        this.setupWebSocket();
        
        this.server.listen(this.port, () => {
            console.log(`\n🌍 UNIFIED WORLD: http://localhost:${this.port}\n`);
            console.log('🏗️ WORLD LAYERS:');
            Object.entries(this.worldLayers).forEach(([name, layer]) => {
                console.log(`   ${layer.depth}. ${name.toUpperCase()} (opacity: ${layer.opacity})`);
                console.log(`      └─ ${layer.systems.join(', ')}`);
            });
            console.log('\n🎮 GAME MODES:');
            Object.entries(this.gameModes).forEach(([key, mode]) => {
                console.log(`   • ${mode.name}: ${mode.description}`);
            });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🌍 Player entered unified world');
            
            ws.send(JSON.stringify({
                type: 'world_init',
                layers: this.worldLayers,
                gameModes: this.gameModes,
                sitemap: this.generateCompleteSitemap()
            }));
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleWorldEvent(data, ws);
            });
        });
    }
    
    handleWorldEvent(event, ws) {
        switch (event.type) {
            case 'navigate_layer':
                this.navigateToLayer(event.layer, ws);
                break;
            case 'switch_game':
                this.switchGameMode(event.gameMode, ws);
                break;
            case 'world_action':
                this.processWorldAction(event.action, event.layer, ws);
                break;
        }
    }
    
    generateCompleteSitemap() {
        return {
            name: 'Unified World',
            url: 'http://localhost:10000',
            children: [
                {
                    name: 'Foundation Layer',
                    depth: 0,
                    children: [
                        { name: 'Blockchain', url: '/foundation/blockchain' },
                        { name: 'Payment Systems', url: 'http://localhost:8101' },
                        { name: 'Database Layer', url: '/foundation/database' },
                        { name: 'Network Mesh', url: '/foundation/network' }
                    ]
                },
                {
                    name: 'Backend Services',
                    depth: 1,
                    children: [
                        { name: 'QR-UPC Bridge', url: 'http://localhost:8099' },
                        { name: 'Device Verification', url: 'http://localhost:8100' },
                        { name: 'Stripe Integration', url: 'http://localhost:8101' },
                        { name: 'LLM Multi-Router', url: '/backend/llm-router' }
                    ]
                },
                {
                    name: 'Platform Systems',
                    depth: 2,
                    children: [
                        { name: 'Authentication', url: '/platform/auth' },
                        { name: 'User Management', url: '/platform/users' },
                        { name: 'Inventory System', url: '/platform/inventory' },
                        { name: 'Economy Engine', url: '/platform/economy' }
                    ]
                },
                {
                    name: 'Game World',
                    depth: 3,
                    children: [
                        { name: 'Hex Grid System', url: 'http://localhost:8095' },
                        { name: 'Room Builder', url: '/world/rooms' },
                        { name: 'Navigation Mesh', url: '/world/navigation' },
                        { name: 'Physics Engine', url: '/world/physics' }
                    ]
                },
                {
                    name: 'Entities',
                    depth: 4,
                    children: [
                        { name: 'Avatar Creator', url: 'http://localhost:8300' },
                        { name: 'NPC System', url: '/entities/npcs' },
                        { name: 'Pet System', url: '/entities/pets' },
                        { name: 'Voxel Models', url: '/entities/voxels' }
                    ]
                },
                {
                    name: 'Gameplay',
                    depth: 5,
                    children: [
                        { name: 'Combat System', url: '/gameplay/combat' },
                        { name: 'Trading Post', url: '/gameplay/trading' },
                        { name: 'Crafting Bench', url: '/gameplay/crafting' },
                        { name: 'Mini-Games', url: '/gameplay/minigames' }
                    ]
                },
                {
                    name: 'Interface',
                    depth: 6,
                    children: [
                        { name: 'HUD System', url: '/interface/hud' },
                        { name: 'Menu System', url: '/interface/menus' },
                        { name: 'Chat System', url: '/interface/chat' },
                        { name: 'Inventory UI', url: '/interface/inventory' }
                    ]
                },
                {
                    name: 'Game Modes',
                    depth: 7,
                    children: [
                        { name: 'ShipRekt', url: '/games/shiprekt' },
                        { name: 'Bash VCs', url: '/games/bash-vcs' },
                        { name: 'ChronoQuest', url: '/games/chronoquest' },
                        { name: 'Habbo Remix', url: '/games/habbo-remix' },
                        { name: 'RuneScape Voxel', url: '/games/runescape-voxel' }
                    ]
                }
            ]
        };
    }
    
    interactWithLayer(layerName, interaction) {
        const layer = this.worldLayers[layerName];
        if (!layer) return { error: 'Layer not found' };
        
        // Process interaction based on layer depth
        const result = {
            layer: layerName,
            depth: layer.depth,
            interaction: interaction,
            effects: []
        };
        
        // Deeper layers can affect shallower ones
        for (let depth = layer.depth; depth >= 0; depth--) {
            const affectedLayer = Object.entries(this.worldLayers)
                .find(([_, l]) => l.depth === depth);
            
            if (affectedLayer) {
                result.effects.push({
                    layer: affectedLayer[0],
                    opacity: affectedLayer[1].opacity,
                    impact: this.calculateLayerImpact(layer.depth, depth)
                });
            }
        }
        
        return result;
    }
    
    calculateLayerImpact(sourceDepth, targetDepth) {
        // Deeper layers have stronger impact on shallower ones
        const depthDifference = sourceDepth - targetDepth;
        return Math.max(0, 1 - (depthDifference * 0.2));
    }
    
    navigateToLayer(layerName, ws) {
        const layer = this.worldLayers[layerName];
        if (!layer) return;
        
        ws.send(JSON.stringify({
            type: 'layer_focus',
            layer: layerName,
            depth: layer.depth,
            opacity: layer.opacity,
            systems: layer.systems
        }));
    }
    
    switchGameMode(gameMode, ws) {
        const mode = this.gameModes[gameMode];
        if (!mode) return;
        
        // Activate required layers for this game mode
        const activeLayers = mode.layers.map(layerName => ({
            name: layerName,
            ...this.worldLayers[layerName]
        }));
        
        ws.send(JSON.stringify({
            type: 'game_mode_switch',
            mode: mode,
            activeLayers: activeLayers
        }));
    }
    
    processWorldAction(action, layer, ws) {
        // Actions propagate through layers based on depth
        const effects = this.propagateAction(action, layer);
        
        ws.send(JSON.stringify({
            type: 'action_result',
            action: action,
            layer: layer,
            effects: effects
        }));
    }
    
    propagateAction(action, startLayer) {
        const effects = [];
        const startDepth = this.worldLayers[startLayer]?.depth || 0;
        
        // Actions ripple outward from the starting layer
        Object.entries(this.worldLayers).forEach(([name, layer]) => {
            const distance = Math.abs(layer.depth - startDepth);
            const strength = Math.max(0, 1 - (distance * 0.3));
            
            if (strength > 0) {
                effects.push({
                    layer: name,
                    strength: strength,
                    delayed: distance * 100 // ms delay based on distance
                });
            }
        });
        
        return effects;
    }
    
    getUnifiedWorldInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌍 Unified World Builder</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            height: 100vh;
        }
        
        #world-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            perspective: 2000px;
            overflow: hidden;
        }
        
        .world-layer {
            position: absolute;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Layer positioning based on depth */
        .layer-foundation {
            transform: translateZ(-600px) scale(1.6);
            opacity: 0.3;
        }
        
        .layer-backend {
            transform: translateZ(-400px) scale(1.4);
            opacity: 0.4;
        }
        
        .layer-platform {
            transform: translateZ(-200px) scale(1.2);
            opacity: 0.5;
        }
        
        .layer-world {
            transform: translateZ(0px) scale(1);
            opacity: 0.7;
        }
        
        .layer-entities {
            transform: translateZ(200px) scale(0.9);
            opacity: 0.8;
        }
        
        .layer-gameplay {
            transform: translateZ(400px) scale(0.8);
            opacity: 0.9;
        }
        
        .layer-interface {
            transform: translateZ(600px) scale(0.7);
            opacity: 1;
        }
        
        /* Focus states */
        .world-layer.focused {
            transform: translateZ(0) scale(1) !important;
            opacity: 1 !important;
        }
        
        .world-layer.above {
            transform: translateZ(800px) scale(0.5);
            opacity: 0.2;
        }
        
        .world-layer.below {
            transform: translateZ(-800px) scale(2);
            opacity: 0.2;
        }
        
        .layer-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 20px;
            padding: 40px;
        }
        
        .layer-title {
            font-size: clamp(24px, 4vw, 48px);
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 0 0 20px currentColor;
        }
        
        /* Layer-specific colors */
        .layer-foundation .layer-title { color: #ff4444; }
        .layer-backend .layer-title { color: #ff8844; }
        .layer-platform .layer-title { color: #ffdd44; }
        .layer-world .layer-title { color: #44ff44; }
        .layer-entities .layer-title { color: #44ddff; }
        .layer-gameplay .layer-title { color: #4488ff; }
        .layer-interface .layer-title { color: #dd44ff; }
        
        .system-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            width: 100%;
            max-width: 800px;
            margin-top: 20px;
        }
        
        .system-node {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        }
        
        .system-node:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 10px 30px rgba(255,255,255,0.3);
        }
        
        .layer-navigator {
            position: fixed;
            right: 30px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
        }
        
        .nav-layer {
            width: 60px;
            height: 60px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
            font-size: 24px;
            border: 2px solid transparent;
        }
        
        .nav-layer:hover {
            transform: translateX(-10px) scale(1.1);
        }
        
        .nav-layer.active {
            border-color: #fff;
            box-shadow: 0 0 20px currentColor;
        }
        
        .nav-foundation { background: rgba(255,68,68,0.3); }
        .nav-backend { background: rgba(255,136,68,0.3); }
        .nav-platform { background: rgba(255,221,68,0.3); }
        .nav-world { background: rgba(68,255,68,0.3); }
        .nav-entities { background: rgba(68,221,255,0.3); }
        .nav-gameplay { background: rgba(68,136,255,0.3); }
        .nav-interface { background: rgba(221,68,255,0.3); }
        
        .game-selector {
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 1000;
            background: rgba(0,0,0,0.8);
            padding: 15px 25px;
            border-radius: 50px;
            border: 1px solid rgba(255,255,255,0.3);
            backdrop-filter: blur(10px);
        }
        
        .game-btn {
            padding: 10px 20px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
            font-weight: 500;
        }
        
        .game-btn:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-2px);
        }
        
        .game-btn.active {
            background: #00ff88;
            color: #000;
            border-color: #00ff88;
        }
        
        .sitemap-toggle {
            position: fixed;
            bottom: 30px;
            left: 30px;
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 24px;
            backdrop-filter: blur(10px);
        }
        
        .sitemap-toggle:hover {
            background: rgba(255,255,255,0.2);
            transform: scale(1.1);
        }
        
        .sitemap-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: none;
            z-index: 2000;
            overflow-y: auto;
            padding: 50px;
        }
        
        .sitemap-overlay.active {
            display: block;
        }
        
        .sitemap-close {
            position: fixed;
            top: 20px;
            right: 20px;
            font-size: 36px;
            cursor: pointer;
            color: #fff;
        }
        
        .sitemap-content {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .sitemap-title {
            font-size: 36px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .sitemap-tree {
            font-family: monospace;
            font-size: 14px;
            line-height: 1.8;
        }
        
        .tree-item {
            margin-left: 20px;
            position: relative;
        }
        
        .tree-item::before {
            content: '├─ ';
            position: absolute;
            left: -20px;
        }
        
        .tree-item.last::before {
            content: '└─ ';
        }
        
        .tree-link {
            color: #00ff88;
            text-decoration: none;
        }
        
        .tree-link:hover {
            text-decoration: underline;
        }
        
        /* Isometric room view for Habbo-style */
        .room-view {
            width: 600px;
            height: 400px;
            position: relative;
            transform: rotateX(30deg) rotateY(45deg);
            transform-style: preserve-3d;
        }
        
        .room-tile {
            position: absolute;
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            transform-style: preserve-3d;
        }
        
        /* Ship combat view for ShipRekt */
        .ocean-view {
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, #001122 0%, #003366 100%);
            position: relative;
            overflow: hidden;
        }
        
        .ship {
            position: absolute;
            width: 80px;
            height: 120px;
            background: rgba(139,69,19,0.8);
            border: 2px solid #8B4513;
            border-radius: 20px 20px 60px 60px;
            transform-style: preserve-3d;
        }
        
        .wave {
            position: absolute;
            width: 200%;
            height: 100px;
            background: repeating-linear-gradient(
                90deg,
                transparent,
                transparent 50px,
                rgba(255,255,255,0.1) 50px,
                rgba(255,255,255,0.1) 100px
            );
            animation: wave-motion 5s linear infinite;
        }
        
        @keyframes wave-motion {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100px); }
        }
        
        /* VC office for Bash VCs */
        .office-view {
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 100%);
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 40px;
        }
        
        .startup-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .startup-name {
            font-size: 18px;
            font-weight: bold;
        }
        
        .startup-valuation {
            color: #00ff88;
            font-size: 24px;
        }
        
        /* RuneScape-style skill interface */
        .skills-panel {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            background: rgba(0,0,0,0.8);
            border: 2px solid #8B7355;
            border-radius: 10px;
            padding: 20px;
        }
        
        .skill-icon {
            width: 60px;
            height: 60px;
            background: rgba(139,115,85,0.3);
            border: 1px solid #8B7355;
            border-radius: 5px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .skill-icon:hover {
            background: rgba(139,115,85,0.5);
            transform: scale(1.05);
        }
        
        .skill-level {
            font-size: 20px;
            font-weight: bold;
            color: #ffdd44;
        }
        
        .skill-name {
            font-size: 10px;
            color: #888;
        }
        
        /* Depth indicator */
        .depth-indicator {
            position: fixed;
            left: 30px;
            top: 50%;
            transform: translateY(-50%);
            width: 10px;
            height: 300px;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
            overflow: hidden;
        }
        
        .depth-marker {
            position: absolute;
            width: 100%;
            height: 20px;
            background: #00ff88;
            border-radius: 5px;
            transition: all 0.5s;
        }
        
        /* Particle effects */
        .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255,255,255,0.8);
            border-radius: 50%;
            pointer-events: none;
            animation: float-up 3s linear infinite;
        }
        
        @keyframes float-up {
            0% {
                transform: translateY(100vh) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) translateX(100px);
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <div id="world-container">
        <!-- Foundation Layer -->
        <div class="world-layer layer-foundation" id="layer-foundation">
            <div class="layer-content">
                <h1 class="layer-title">🏗️ Foundation</h1>
                <div class="system-grid">
                    <div class="system-node">Blockchain</div>
                    <div class="system-node">Payments</div>
                    <div class="system-node">Database</div>
                    <div class="system-node">Network</div>
                </div>
            </div>
        </div>
        
        <!-- Backend Layer -->
        <div class="world-layer layer-backend" id="layer-backend">
            <div class="layer-content">
                <h1 class="layer-title">⚙️ Backend Services</h1>
                <div class="system-grid">
                    <div class="system-node">QR Bridge</div>
                    <div class="system-node">Device Verify</div>
                    <div class="system-node">Stripe API</div>
                    <div class="system-node">LLM Router</div>
                </div>
            </div>
        </div>
        
        <!-- Platform Layer -->
        <div class="world-layer layer-platform" id="layer-platform">
            <div class="layer-content">
                <h1 class="layer-title">🎯 Platform</h1>
                <div class="system-grid">
                    <div class="system-node">Auth System</div>
                    <div class="system-node">User Mgmt</div>
                    <div class="system-node">Inventory</div>
                    <div class="system-node">Economy</div>
                </div>
            </div>
        </div>
        
        <!-- World Layer -->
        <div class="world-layer layer-world focused" id="layer-world">
            <div class="layer-content">
                <h1 class="layer-title">🌍 Game World</h1>
                <div id="world-content">
                    <!-- Dynamic content based on game mode -->
                    <div class="system-grid">
                        <div class="system-node">Hex Grid</div>
                        <div class="system-node">Rooms</div>
                        <div class="system-node">Navigation</div>
                        <div class="system-node">Physics</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Entities Layer -->
        <div class="world-layer layer-entities" id="layer-entities">
            <div class="layer-content">
                <h1 class="layer-title">👥 Entities</h1>
                <div class="system-grid">
                    <div class="system-node">Avatars</div>
                    <div class="system-node">NPCs</div>
                    <div class="system-node">Pets</div>
                    <div class="system-node">Voxels</div>
                </div>
            </div>
        </div>
        
        <!-- Gameplay Layer -->
        <div class="world-layer layer-gameplay" id="layer-gameplay">
            <div class="layer-content">
                <h1 class="layer-title">🎮 Gameplay</h1>
                <div class="system-grid">
                    <div class="system-node">Combat</div>
                    <div class="system-node">Trading</div>
                    <div class="system-node">Crafting</div>
                    <div class="system-node">Minigames</div>
                </div>
            </div>
        </div>
        
        <!-- Interface Layer -->
        <div class="world-layer layer-interface" id="layer-interface">
            <div class="layer-content">
                <h1 class="layer-title">🖥️ Interface</h1>
                <div class="system-grid">
                    <div class="system-node">HUD</div>
                    <div class="system-node">Menus</div>
                    <div class="system-node">Chat</div>
                    <div class="system-node">Inventory UI</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Navigation -->
    <div class="layer-navigator">
        <div class="nav-layer nav-foundation" onclick="focusLayer('foundation')" title="Foundation">🏗️</div>
        <div class="nav-layer nav-backend" onclick="focusLayer('backend')" title="Backend">⚙️</div>
        <div class="nav-layer nav-platform" onclick="focusLayer('platform')" title="Platform">🎯</div>
        <div class="nav-layer nav-world active" onclick="focusLayer('world')" title="World">🌍</div>
        <div class="nav-layer nav-entities" onclick="focusLayer('entities')" title="Entities">👥</div>
        <div class="nav-layer nav-gameplay" onclick="focusLayer('gameplay')" title="Gameplay">🎮</div>
        <div class="nav-layer nav-interface" onclick="focusLayer('interface')" title="Interface">🖥️</div>
    </div>
    
    <!-- Game Mode Selector -->
    <div class="game-selector">
        <button class="game-btn" onclick="switchGame('shiprekt')">ShipRekt</button>
        <button class="game-btn" onclick="switchGame('bashVCs')">Bash VCs</button>
        <button class="game-btn" onclick="switchGame('chronoQuest')">ChronoQuest</button>
        <button class="game-btn" onclick="switchGame('habboRemix')">Habbo Remix</button>
        <button class="game-btn" onclick="switchGame('runescapeVoxel')">RuneScape</button>
    </div>
    
    <!-- Sitemap Toggle -->
    <div class="sitemap-toggle" onclick="toggleSitemap()">🗺️</div>
    
    <!-- Sitemap Overlay -->
    <div class="sitemap-overlay" id="sitemap-overlay">
        <div class="sitemap-close" onclick="toggleSitemap()">✕</div>
        <div class="sitemap-content">
            <h1 class="sitemap-title">🗺️ Complete System Map</h1>
            <div class="sitemap-tree" id="sitemap-tree">
                <!-- Generated sitemap will go here -->
            </div>
        </div>
    </div>
    
    <!-- Depth Indicator -->
    <div class="depth-indicator">
        <div class="depth-marker" id="depth-marker"></div>
    </div>
    
    <script>
        let ws;
        let currentLayer = 'world';
        let currentGame = null;
        let worldState = {};
        
        // Layer configuration
        const layers = ['foundation', 'backend', 'platform', 'world', 'entities', 'gameplay', 'interface'];
        const layerDepths = {
            foundation: 0,
            backend: 1,
            platform: 2,
            world: 3,
            entities: 4,
            gameplay: 5,
            interface: 6
        };
        
        // Initialize WebSocket
        function initConnection() {
            ws = new WebSocket('ws://' + window.location.host);
            
            ws.onopen = () => {
                console.log('Connected to Unified World');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWorldMessage(data);
            };
            
            ws.onclose = () => {
                setTimeout(initConnection, 2000);
            };
        }
        
        function handleWorldMessage(data) {
            switch (data.type) {
                case 'world_init':
                    worldState = data;
                    updateSitemap(data.sitemap);
                    break;
                case 'layer_focus':
                    updateLayerFocus(data);
                    break;
                case 'game_mode_switch':
                    updateGameMode(data);
                    break;
                case 'action_result':
                    processActionResult(data);
                    break;
            }
        }
        
        function focusLayer(layerName) {
            currentLayer = layerName;
            
            // Update layer positions
            layers.forEach(layer => {
                const element = document.getElementById('layer-' + layer);
                const navElement = document.querySelector('.nav-' + layer);
                
                element.classList.remove('focused', 'above', 'below');
                navElement.classList.remove('active');
                
                if (layer === layerName) {
                    element.classList.add('focused');
                    navElement.classList.add('active');
                } else {
                    const currentDepth = layerDepths[layerName];
                    const layerDepth = layerDepths[layer];
                    
                    if (layerDepth < currentDepth) {
                        element.classList.add('below');
                    } else {
                        element.classList.add('above');
                    }
                }
            });
            
            // Update depth indicator
            updateDepthIndicator(layerDepths[layerName]);
            
            // Send to server
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'navigate_layer',
                    layer: layerName
                }));
            }
        }
        
        function updateDepthIndicator(depth) {
            const marker = document.getElementById('depth-marker');
            const percentage = (depth / 6) * 100;
            marker.style.top = percentage + '%';
        }
        
        function switchGame(gameMode) {
            currentGame = gameMode;
            
            // Update buttons
            document.querySelectorAll('.game-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.toLowerCase().includes(gameMode.toLowerCase().substring(0, 4))) {
                    btn.classList.add('active');
                }
            });
            
            // Update world content based on game
            updateWorldContent(gameMode);
            
            // Send to server
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'switch_game',
                    gameMode: gameMode
                }));
            }
        }
        
        function updateWorldContent(gameMode) {
            const worldContent = document.getElementById('world-content');
            
            switch (gameMode) {
                case 'shiprekt':
                    worldContent.innerHTML = \`
                        <div class="ocean-view">
                            <div class="wave" style="bottom: 20%;"></div>
                            <div class="wave" style="bottom: 40%; animation-delay: -2.5s;"></div>
                            <div class="ship" style="left: 20%; top: 30%;"></div>
                            <div class="ship" style="right: 20%; top: 40%; transform: scaleX(-1);"></div>
                        </div>
                    \`;
                    break;
                    
                case 'bashVCs':
                    worldContent.innerHTML = \`
                        <div class="office-view">
                            <div class="startup-card">
                                <div class="startup-name">AI Blockchain Inc</div>
                                <div class="startup-valuation">$10M</div>
                                <button class="system-node">Invest</button>
                            </div>
                            <div class="startup-card">
                                <div class="startup-name">Quantum Social</div>
                                <div class="startup-valuation">$5M</div>
                                <button class="system-node">Invest</button>
                            </div>
                            <div class="startup-card">
                                <div class="startup-name">Meta Voxel Labs</div>
                                <div class="startup-valuation">$25M</div>
                                <button class="system-node">Invest</button>
                            </div>
                        </div>
                    \`;
                    break;
                    
                case 'habboRemix':
                    worldContent.innerHTML = '<div class="room-view" id="room-view"></div>';
                    createIsometricRoom();
                    break;
                    
                case 'runescapeVoxel':
                    worldContent.innerHTML = \`
                        <div class="skills-panel">
                            <div class="skill-icon">
                                <div class="skill-level">99</div>
                                <div class="skill-name">Mining</div>
                            </div>
                            <div class="skill-icon">
                                <div class="skill-level">75</div>
                                <div class="skill-name">Smithing</div>
                            </div>
                            <div class="skill-icon">
                                <div class="skill-level">60</div>
                                <div class="skill-name">Combat</div>
                            </div>
                            <div class="skill-icon">
                                <div class="skill-level">50</div>
                                <div class="skill-name">Magic</div>
                            </div>
                        </div>
                    \`;
                    break;
                    
                default:
                    // Default hex grid
                    worldContent.innerHTML = \`
                        <div class="system-grid">
                            <div class="system-node">Hex Grid</div>
                            <div class="system-node">Rooms</div>
                            <div class="system-node">Navigation</div>
                            <div class="system-node">Physics</div>
                        </div>
                    \`;
            }
        }
        
        function createIsometricRoom() {
            const roomView = document.getElementById('room-view');
            if (!roomView) return;
            
            // Create isometric floor tiles
            for (let x = 0; x < 10; x++) {
                for (let y = 0; y < 10; y++) {
                    const tile = document.createElement('div');
                    tile.className = 'room-tile';
                    tile.style.left = (x * 40 + y * 40) + 'px';
                    tile.style.top = (y * 20 - x * 20 + 200) + 'px';
                    roomView.appendChild(tile);
                }
            }
        }
        
        function toggleSitemap() {
            const overlay = document.getElementById('sitemap-overlay');
            overlay.classList.toggle('active');
        }
        
        function updateSitemap(sitemap) {
            const treeContainer = document.getElementById('sitemap-tree');
            treeContainer.innerHTML = renderSitemapTree(sitemap, 0);
        }
        
        function renderSitemapTree(node, depth) {
            let html = '<div style="margin-left: ' + (depth * 30) + 'px;">';
            
            if (node.url) {
                html += '<div class="tree-item">';
                html += '<a href="' + node.url + '" class="tree-link" target="_blank">' + node.name + '</a>';
                html += '</div>';
            } else {
                html += '<div class="tree-item"><strong>' + node.name + '</strong></div>';
            }
            
            if (node.children) {
                node.children.forEach((child, index) => {
                    html += renderSitemapTree(child, depth + 1);
                });
            }
            
            html += '</div>';
            return html;
        }
        
        function processActionResult(data) {
            // Create visual effects for action propagation
            data.effects.forEach((effect, index) => {
                setTimeout(() => {
                    createActionRipple(effect.layer, effect.strength);
                }, effect.delayed || index * 100);
            });
        }
        
        function createActionRipple(layerName, strength) {
            const layer = document.getElementById('layer-' + layerName);
            if (!layer) return;
            
            const ripple = document.createElement('div');
            ripple.style.cssText = \`
                position: absolute;
                width: 100px;
                height: 100px;
                border: 2px solid rgba(255,255,255,\${strength});
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: ripple-out 1s ease-out forwards;
                pointer-events: none;
            \`;
            
            layer.appendChild(ripple);
            setTimeout(() => ripple.remove(), 1000);
        }
        
        // Add ripple animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes ripple-out {
                0% {
                    width: 100px;
                    height: 100px;
                    opacity: 1;
                }
                100% {
                    width: 500px;
                    height: 500px;
                    opacity: 0;
                }
            }
        \`;
        document.head.appendChild(style);
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const currentIndex = layers.indexOf(currentLayer);
            
            if (e.key === 'ArrowUp' && currentIndex < layers.length - 1) {
                focusLayer(layers[currentIndex + 1]);
            } else if (e.key === 'ArrowDown' && currentIndex > 0) {
                focusLayer(layers[currentIndex - 1]);
            } else if (e.key >= '1' && e.key <= '7') {
                const index = parseInt(e.key) - 1;
                if (index < layers.length) {
                    focusLayer(layers[index]);
                }
            }
        });
        
        // Create floating particles
        function createParticles() {
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.animationDelay = Math.random() * 3 + 's';
                particle.style.animationDuration = (3 + Math.random() * 2) + 's';
                document.getElementById('world-container').appendChild(particle);
            }
        }
        
        // System node interactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('system-node')) {
                const action = e.target.textContent;
                
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'world_action',
                        action: action,
                        layer: currentLayer
                    }));
                }
                
                // Local feedback
                e.target.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 200);
            }
        });
        
        // Load initial sitemap
        fetch('/api/sitemap')
            .then(res => res.json())
            .then(sitemap => updateSitemap(sitemap))
            .catch(err => console.error('Failed to load sitemap:', err));
        
        // Initialize
        initConnection();
        createParticles();
        updateDepthIndicator(layerDepths[currentLayer]);
    </script>
</body>
</html>`;
    }
}

// Start the unified world
new UnifiedWorldBuilder();