#!/usr/bin/env node

/**
 * 🎨 XML DEPTH MAPPING SYSTEM
 * Handles visual layers, shadows, menus, and Z-index coordination through XML
 * Solves the depth mapping issues for proper UI layering
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

class XMLDepthMappingSystem {
    constructor(port) {
        this.port = port;
        this.depthLayers = new Map();
        this.shadowMaps = new Map();
        this.menuStack = [];
        this.zIndexRegistry = new Map();
        this.renderQueue = [];
        
        // Define depth layers (like game engines)
        this.DEPTH_LAYERS = {
            BACKGROUND: { z: 0, name: 'Background', opacity: 1.0 },
            WORLD_TERRAIN: { z: 100, name: 'World Terrain', opacity: 1.0 },
            WORLD_OBJECTS: { z: 200, name: 'World Objects', opacity: 1.0 },
            NPCS: { z: 300, name: 'NPCs', opacity: 1.0 },
            PLAYERS: { z: 400, name: 'Players', opacity: 1.0 },
            PARTICLES: { z: 500, name: 'Particles', opacity: 0.8 },
            UI_BACKGROUND: { z: 1000, name: 'UI Background', opacity: 0.9 },
            UI_ELEMENTS: { z: 1100, name: 'UI Elements', opacity: 1.0 },
            MENUS: { z: 1200, name: 'Menus', opacity: 1.0 },
            TOOLTIPS: { z: 1300, name: 'Tooltips', opacity: 0.95 },
            MODALS: { z: 1400, name: 'Modals', opacity: 1.0 },
            NOTIFICATIONS: { z: 1500, name: 'Notifications', opacity: 0.9 },
            DEBUG_OVERLAY: { z: 9999, name: 'Debug Overlay', opacity: 0.8 }
        };
        
        // Shadow mapping configuration
        this.SHADOW_CONFIG = {
            AMBIENT_LIGHT: 0.3,
            DIRECTIONAL_LIGHT: { x: -1, y: -1, z: -1, intensity: 0.7 },
            SHADOW_DISTANCE: 50,
            SHADOW_OPACITY: 0.4,
            SHADOW_BLUR: 3
        };
        
        this.initializeDepthSystem();
    }
    
    async start() {
        console.log('🎨 STARTING XML DEPTH MAPPING SYSTEM');
        console.log('====================================');
        console.log('Visual layer management with XML coordination');
        console.log('');
        
        this.startDepthServer();
        this.initializeRenderEngine();
        this.startDepthMonitoring();
        
        console.log('✅ XML Depth Mapping System running!');
        console.log('');
        console.log(`🎨 Depth Management: http://localhost:${this.port}`);
        console.log('🌊 Visual layers, shadows, and menus coordinated via XML');
    }
    
    initializeDepthSystem() {
        // Initialize all depth layers
        Object.entries(this.DEPTH_LAYERS).forEach(([key, config]) => {
            this.depthLayers.set(key, {
                ...config,
                elements: [],
                visible: true,
                transform: { x: 0, y: 0, scale: 1.0, rotation: 0 },
                lastUpdate: Date.now()
            });
        });
        
        // Create shadow maps for each layer that needs shadows
        ['NPCS', 'PLAYERS', 'WORLD_OBJECTS', 'UI_ELEMENTS'].forEach(layerKey => {
            this.shadowMaps.set(layerKey, {
                enabled: true,
                elements: [],
                lightSources: [this.SHADOW_CONFIG.DIRECTIONAL_LIGHT]
            });
        });
        
        console.log('🎨 Depth system initialized with', this.depthLayers.size, 'layers');
    }
    
    startDepthServer() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${this.port}`);
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Depth-Layer');
            
            console.log(`🎨 Depth Request: ${req.method} ${url.pathname}`);
            
            switch (url.pathname) {
                case '/api/game-elements':
                    this.handleGameElements(req, res);
                    break;
                case '/api/shadows':
                    this.handleShadowData(req, res);
                    break;
                case '/':
                    this.serveDepthDashboard(res);
                    break;
                case '/xml/depth-map':
                    this.serveDepthMapXML(res);
                    break;
                case '/xml/shadow-map':
                    this.serveShadowMapXML(res);
                    break;
                case '/xml/menu-stack':
                    this.serveMenuStackXML(res);
                    break;
                case '/xml/render-queue':
                    this.serveRenderQueueXML(res);
                    break;
                case '/api/depth/add-element':
                    this.handleAddElement(req, res);
                    break;
                case '/api/depth/update-layer':
                    this.handleUpdateLayer(req, res);
                    break;
                case '/api/depth/push-menu':
                    this.handlePushMenu(req, res);
                    break;
                case '/api/depth/pop-menu':
                    this.handlePopMenu(req, res);
                    break;
                case '/api/depth/calculate-shadows':
                    this.handleCalculateShadows(req, res);
                    break;
                case '/api/depth/render-frame':
                    this.handleRenderFrame(req, res);
                    break;
                default:
                    res.writeHead(404);
                    res.end('Depth endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🎨 Depth mapping server running on port ${this.port}`);
        });
    }
    
    initializeRenderEngine() {
        // Add sample elements to demonstrate the system
        this.addElementToLayer('BACKGROUND', {
            id: 'bg_gradient',
            type: 'gradient',
            bounds: { x: 0, y: 0, width: 800, height: 600 },
            style: { colors: ['#1a1a2e', '#16213e'] }
        });
        
        this.addElementToLayer('WORLD_TERRAIN', {
            id: 'ground_tiles',
            type: 'tilemap',
            bounds: { x: 0, y: 400, width: 800, height: 200 },
            style: { texture: 'grass', tileSize: 32 }
        });
        
        this.addElementToLayer('NPCS', {
            id: 'npc_goblin_1',
            type: 'sprite',
            bounds: { x: 150, y: 350, width: 32, height: 32 },
            style: { texture: 'goblin', animation: 'idle' },
            castShadow: true
        });
        
        this.addElementToLayer('PLAYERS', {
            id: 'player_main',
            type: 'sprite',
            bounds: { x: 400, y: 300, width: 32, height: 48 },
            style: { texture: 'warrior', animation: 'walk' },
            castShadow: true
        });
        
        this.addElementToLayer('UI_BACKGROUND', {
            id: 'hud_background',
            type: 'panel',
            bounds: { x: 10, y: 10, width: 200, height: 100 },
            style: { background: 'rgba(0,0,0,0.7)', border: '1px solid #0f0' }
        });
        
        this.addElementToLayer('UI_ELEMENTS', {
            id: 'health_bar',
            type: 'progressbar',
            bounds: { x: 20, y: 30, width: 180, height: 20 },
            style: { fill: '#0f0', background: '#333' },
            value: 0.75
        });
        
        console.log('🎮 Sample render elements created');
    }
    
    addElementToLayer(layerKey, element) {
        const layer = this.depthLayers.get(layerKey);
        if (!layer) {
            console.error(`❌ Layer not found: ${layerKey}`);
            return false;
        }
        
        // Add unique ID if not provided
        if (!element.id) {
            element.id = crypto.randomUUID();
        }
        
        // Add metadata
        element.layerKey = layerKey;
        element.zIndex = layer.z;
        element.created = Date.now();
        element.lastUpdate = Date.now();
        
        layer.elements.push(element);
        layer.lastUpdate = Date.now();
        
        // Register Z-index
        this.zIndexRegistry.set(element.id, layer.z);
        
        // Add to shadow map if element casts shadows
        if (element.castShadow && this.shadowMaps.has(layerKey)) {
            this.calculateElementShadow(layerKey, element);
        }
        
        console.log(`🎨 Added element ${element.id} to layer ${layerKey} (z: ${layer.z})`);
        return true;
    }
    
    calculateElementShadow(layerKey, element) {
        const shadowMap = this.shadowMaps.get(layerKey);
        if (!shadowMap || !shadowMap.enabled) return;
        
        const light = this.SHADOW_CONFIG.DIRECTIONAL_LIGHT;
        
        // Calculate shadow position based on light direction
        const shadowOffset = {
            x: element.bounds.x + (light.x * this.SHADOW_CONFIG.SHADOW_DISTANCE),
            y: element.bounds.y + (light.y * this.SHADOW_CONFIG.SHADOW_DISTANCE)
        };
        
        const shadow = {
            elementId: element.id,
            type: 'drop_shadow',
            bounds: {
                x: shadowOffset.x,
                y: shadowOffset.y,
                width: element.bounds.width,
                height: element.bounds.height
            },
            style: {
                opacity: this.SHADOW_CONFIG.SHADOW_OPACITY,
                blur: this.SHADOW_CONFIG.SHADOW_BLUR,
                color: '#000'
            },
            lightSource: light,
            zIndex: element.zIndex - 1 // Shadows render just behind their casters
        };
        
        shadowMap.elements.push(shadow);
        console.log(`🌫️ Shadow calculated for ${element.id}`);
    }
    
    pushMenu(menuConfig) {
        const menu = {
            id: menuConfig.id || crypto.randomUUID(),
            type: menuConfig.type || 'generic',
            title: menuConfig.title || 'Menu',
            bounds: menuConfig.bounds || { x: 100, y: 100, width: 300, height: 200 },
            elements: menuConfig.elements || [],
            visible: true,
            modal: menuConfig.modal || false,
            closeable: menuConfig.closeable !== false,
            zIndex: this.DEPTH_LAYERS.MENUS.z + this.menuStack.length,
            created: Date.now()
        };
        
        this.menuStack.push(menu);
        
        // Add menu to render queue
        this.addElementToLayer('MENUS', {
            id: menu.id,
            type: 'menu',
            bounds: menu.bounds,
            menuConfig: menu,
            interactive: true
        });
        
        console.log(`📋 Menu pushed: ${menu.title} (${menu.id})`);
        return menu.id;
    }
    
    popMenu() {
        if (this.menuStack.length === 0) {
            console.log('⚠️ No menus to pop');
            return null;
        }
        
        const menu = this.menuStack.pop();
        
        // Remove from render layer
        const menuLayer = this.depthLayers.get('MENUS');
        if (menuLayer) {
            menuLayer.elements = menuLayer.elements.filter(el => el.id !== menu.id);
            menuLayer.lastUpdate = Date.now();
        }
        
        console.log(`📋 Menu popped: ${menu.title} (${menu.id})`);
        return menu;
    }
    
    generateRenderQueue() {
        this.renderQueue = [];
        
        // Collect all elements from all layers
        const allElements = [];
        
        this.depthLayers.forEach((layer, layerKey) => {
            if (!layer.visible) return;
            
            layer.elements.forEach(element => {
                allElements.push({
                    ...element,
                    layerKey: layerKey,
                    layerZ: layer.z,
                    layerOpacity: layer.opacity,
                    layerTransform: layer.transform
                });
            });
        });
        
        // Add shadows (render behind their casters)
        this.shadowMaps.forEach((shadowMap, layerKey) => {
            if (!shadowMap.enabled) return;
            
            shadowMap.elements.forEach(shadow => {
                allElements.push({
                    ...shadow,
                    layerKey: layerKey + '_SHADOWS',
                    layerZ: shadow.zIndex,
                    layerOpacity: 1.0,
                    isShadow: true
                });
            });
        });
        
        // Sort by Z-index (back to front)
        allElements.sort((a, b) => a.layerZ - b.layerZ);
        
        this.renderQueue = allElements;
        
        console.log(`🎬 Render queue generated: ${this.renderQueue.length} elements`);
        return this.renderQueue;
    }
    
    startDepthMonitoring() {
        setInterval(() => {
            this.generateRenderQueue();
            this.updateDepthMetrics();
        }, 1000 / 60); // 60 FPS update rate
        
        console.log('📊 Depth monitoring started at 60 FPS');
    }
    
    updateDepthMetrics() {
        // Simulate some dynamic updates
        const playerElement = this.findElementById('player_main');
        if (playerElement) {
            // Simulate player movement
            playerElement.bounds.x += (Math.random() - 0.5) * 2;
            playerElement.bounds.y += (Math.random() - 0.5) * 2;
            playerElement.lastUpdate = Date.now();
            
            // Update shadow
            this.updateElementShadow('PLAYERS', playerElement);
        }
        
        // Update UI element values
        const healthBar = this.findElementById('health_bar');
        if (healthBar) {
            healthBar.value = 0.5 + Math.sin(Date.now() / 1000) * 0.3;
            healthBar.lastUpdate = Date.now();
        }
    }
    
    findElementById(elementId) {
        for (const [layerKey, layer] of this.depthLayers) {
            const element = layer.elements.find(el => el.id === elementId);
            if (element) return element;
        }
        return null;
    }
    
    updateElementShadow(layerKey, element) {
        const shadowMap = this.shadowMaps.get(layerKey);
        if (!shadowMap) return;
        
        // Find existing shadow
        const shadowIndex = shadowMap.elements.findIndex(s => s.elementId === element.id);
        if (shadowIndex === -1) return;
        
        // Recalculate shadow position
        const light = this.SHADOW_CONFIG.DIRECTIONAL_LIGHT;
        const shadowOffset = {
            x: element.bounds.x + (light.x * this.SHADOW_CONFIG.SHADOW_DISTANCE),
            y: element.bounds.y + (light.y * this.SHADOW_CONFIG.SHADOW_DISTANCE)
        };
        
        shadowMap.elements[shadowIndex].bounds.x = shadowOffset.x;
        shadowMap.elements[shadowIndex].bounds.y = shadowOffset.y;
    }
    
    serveDepthDashboard(res) {
        const layers = Array.from(this.depthLayers.entries());
        const shadows = Array.from(this.shadowMaps.entries());
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🎨 XML Depth Mapping Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 20px; background: linear-gradient(135deg, #2C1810, #1a1a2e); color: #fff; font-family: monospace; }
        .container { max-width: 1600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; padding: 25px; background: rgba(255, 165, 0, 0.1); border: 2px solid #FFA500; border-radius: 15px; }
        
        .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .depth-visualizer { background: rgba(0,0,0,0.8); border: 2px solid #0f0; padding: 20px; border-radius: 10px; height: 600px; overflow: hidden; position: relative; }
        .layers-panel { background: rgba(0,0,0,0.8); border: 2px solid #0ff; padding: 20px; border-radius: 10px; overflow-y: auto; max-height: 600px; }
        
        .layer-item { background: rgba(255,255,255,0.1); margin: 8px 0; padding: 12px; border-radius: 8px; border-left: 4px solid #0f0; }
        .layer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .layer-name { font-weight: bold; color: #0f0; }
        .layer-z { background: #333; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .layer-elements { font-size: 11px; opacity: 0.8; }
        
        .render-preview { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .render-element { position: absolute; border: 1px solid rgba(255,255,255,0.3); background: rgba(100,200,100,0.2); }
        .render-shadow { background: rgba(0,0,0,0.4); border: 1px dashed rgba(255,255,255,0.2); }
        .render-ui { background: rgba(0,100,255,0.3); border: 1px solid #0ff; }
        .render-menu { background: rgba(255,100,0,0.4); border: 2px solid #FFA500; }
        
        .controls-panel { display: flex; gap: 15px; justify-content: center; margin: 20px 0; }
        .btn { background: linear-gradient(45deg, #0f0, #00ff00); color: #000; border: none; padding: 10px 20px; cursor: pointer; border-radius: 6px; font-weight: bold; }
        .btn:hover { opacity: 0.8; }
        .btn-secondary { background: linear-gradient(45deg, #0ff, #00ffff); }
        .btn-danger { background: linear-gradient(45deg, #f00, #ff6666); color: #fff; }
        
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .info-card { background: rgba(0,0,0,0.6); border: 1px solid #666; padding: 15px; border-radius: 8px; }
        .info-title { color: #0f0; font-weight: bold; margin-bottom: 10px; }
        .info-value { color: #fff; font-size: 18px; }
        
        .xml-section { background: rgba(128, 0, 128, 0.2); border: 2px solid #8A2BE2; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .xml-preview { background: #000; color: #0f0; padding: 15px; border-radius: 5px; font-size: 12px; max-height: 200px; overflow-y: auto; }
        
        .menu-stack { background: rgba(255, 165, 0, 0.1); border: 1px solid #FFA500; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .menu-item { background: rgba(255,255,255,0.1); padding: 8px; margin: 5px 0; border-radius: 4px; font-size: 12px; }
        
        .live-indicator { animation: pulse 2s infinite; color: #0f0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 XML DEPTH MAPPING SYSTEM</h1>
            <p>Visual layer management with shadows, menus, and Z-index coordination</p>
            <div class="live-indicator">● DEPTH MAPPING ACTIVE</div>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <div class="info-title">📊 Depth Layers</div>
                <div class="info-value">${this.depthLayers.size}</div>
                <div style="font-size: 12px; opacity: 0.8;">Total rendering layers</div>
            </div>
            <div class="info-card">
                <div class="info-title">🌫️ Shadow Maps</div>
                <div class="info-value">${this.shadowMaps.size}</div>
                <div style="font-size: 12px; opacity: 0.8;">Active shadow layers</div>
            </div>
            <div class="info-card">
                <div class="info-title">📋 Menu Stack</div>
                <div class="info-value">${this.menuStack.length}</div>
                <div style="font-size: 12px; opacity: 0.8;">Open menus</div>
            </div>
            <div class="info-card">
                <div class="info-title">🎬 Render Queue</div>
                <div class="info-value">${this.renderQueue.length}</div>
                <div style="font-size: 12px; opacity: 0.8;">Elements to render</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="depth-visualizer">
                <h3 style="margin-top: 0;">🎬 Real-time Render Preview</h3>
                <div class="render-preview" id="renderPreview">
                    ${this.renderQueue.map(element => {
                        const typeClass = element.isShadow ? 'render-shadow' : 
                                         element.layerKey.includes('UI') ? 'render-ui' :
                                         element.layerKey === 'MENUS' ? 'render-menu' : 'render-element';
                        
                        return `<div class="render-element ${typeClass}" 
                                    style="left: ${element.bounds?.x || 0}px; 
                                           top: ${element.bounds?.y || 0}px; 
                                           width: ${element.bounds?.width || 20}px; 
                                           height: ${element.bounds?.height || 20}px;
                                           z-index: ${element.layerZ};
                                           opacity: ${element.layerOpacity || 1};"
                                    title="${element.id} (Z: ${element.layerZ})">
                                    ${element.id.substring(0, 8)}
                                </div>`;
                    }).join('')}
                </div>
            </div>
            
            <div class="layers-panel">
                <h3 style="margin-top: 0;">📚 Depth Layers</h3>
                ${layers.sort((a, b) => b[1].z - a[1].z).map(([key, layer]) => `
                    <div class="layer-item">
                        <div class="layer-header">
                            <span class="layer-name">${layer.name}</span>
                            <span class="layer-z">Z: ${layer.z}</span>
                        </div>
                        <div class="layer-elements">
                            ${layer.elements.length} element(s) • 
                            Visible: ${layer.visible ? '✅' : '❌'} • 
                            Opacity: ${layer.opacity}
                        </div>
                        ${layer.elements.length > 0 ? `
                            <div style="margin-top: 8px; font-size: 10px;">
                                ${layer.elements.map(el => `<div>• ${el.id} (${el.type})</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="controls-panel">
            <button class="btn" onclick="addTestElement()">➕ Add Element</button>
            <button class="btn btn-secondary" onclick="pushTestMenu()">📋 Push Menu</button>
            <button class="btn btn-secondary" onclick="popMenu()">📋 Pop Menu</button>
            <button class="btn" onclick="toggleShadows()">🌫️ Toggle Shadows</button>
            <button class="btn" onclick="regenerateQueue()">🎬 Regenerate Queue</button>
            <button class="btn-danger" onclick="clearAllLayers()">🗑️ Clear All</button>
        </div>
        
        <div class="xml-section">
            <h2>🌐 XML Depth Mapping</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h3>📄 Depth Map XML</h3>
                    <div class="xml-preview" id="depthXmlPreview">
                        Loading depth map XML...
                    </div>
                    <button class="btn" onclick="loadDepthXML()">🔄 Refresh XML</button>
                </div>
                <div>
                    <h3>🌫️ Shadow Map XML</h3>
                    <div class="xml-preview" id="shadowXmlPreview">
                        Loading shadow map XML...
                    </div>
                    <button class="btn" onclick="loadShadowXML()">🔄 Refresh XML</button>
                </div>
            </div>
        </div>
        
        ${this.menuStack.length > 0 ? `
            <div class="menu-stack">
                <h3>📋 Active Menu Stack</h3>
                ${this.menuStack.map((menu, index) => `
                    <div class="menu-item">
                        <strong>${menu.title}</strong> (${menu.id}) - Z: ${menu.zIndex}
                        <br><small>Type: ${menu.type} • Modal: ${menu.modal ? 'Yes' : 'No'} • Elements: ${menu.elements.length}</small>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="xml-section">
            <h2>🔗 XML Endpoints</h2>
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-title">📄 Depth Map</div>
                    <a href="/xml/depth-map" target="_blank" style="color: #0ff;">/xml/depth-map</a>
                </div>
                <div class="info-card">
                    <div class="info-title">🌫️ Shadow Map</div>
                    <a href="/xml/shadow-map" target="_blank" style="color: #0ff;">/xml/shadow-map</a>
                </div>
                <div class="info-card">
                    <div class="info-title">📋 Menu Stack</div>
                    <a href="/xml/menu-stack" target="_blank" style="color: #0ff;">/xml/menu-stack</a>
                </div>
                <div class="info-card">
                    <div class="info-title">🎬 Render Queue</div>
                    <a href="/xml/render-queue" target="_blank" style="color: #0ff;">/xml/render-queue</a>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        async function addTestElement() {
            const layers = ['WORLD_OBJECTS', 'NPCS', 'PLAYERS', 'UI_ELEMENTS'];
            const randomLayer = layers[Math.floor(Math.random() * layers.length)];
            
            const element = {
                type: 'test_sprite',
                bounds: {
                    x: Math.floor(Math.random() * 700),
                    y: Math.floor(Math.random() * 500),
                    width: 32,
                    height: 32
                },
                style: { color: '#' + Math.floor(Math.random()*16777215).toString(16) },
                castShadow: Math.random() > 0.5
            };
            
            try {
                const response = await fetch('/api/depth/add-element', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ layer: randomLayer, element: element })
                });
                
                const result = await response.json();
                console.log('Element added:', result);
                
                setTimeout(() => window.location.reload(), 1000);
                
            } catch (error) {
                console.error('Failed to add element:', error);
            }
        }
        
        async function pushTestMenu() {
            const menu = {
                title: 'Test Menu ' + Date.now(),
                type: 'dialog',
                bounds: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200, width: 250, height: 180 },
                elements: ['OK', 'Cancel'],
                modal: Math.random() > 0.5
            };
            
            try {
                const response = await fetch('/api/depth/push-menu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(menu)
                });
                
                const result = await response.json();
                console.log('Menu pushed:', result);
                
                setTimeout(() => window.location.reload(), 1000);
                
            } catch (error) {
                console.error('Failed to push menu:', error);
            }
        }
        
        async function popMenu() {
            try {
                const response = await fetch('/api/depth/pop-menu', { method: 'POST' });
                const result = await response.json();
                console.log('Menu popped:', result);
                
                setTimeout(() => window.location.reload(), 1000);
                
            } catch (error) {
                console.error('Failed to pop menu:', error);
            }
        }
        
        async function toggleShadows() {
            console.log('Toggle shadows requested');
            // In a real implementation, this would toggle shadow rendering
            alert('Shadow toggling would be implemented here');
        }
        
        async function regenerateQueue() {
            try {
                const response = await fetch('/api/depth/render-frame', { method: 'POST' });
                const result = await response.json();
                console.log('Render queue regenerated:', result);
                
                setTimeout(() => window.location.reload(), 1000);
                
            } catch (error) {
                console.error('Failed to regenerate queue:', error);
            }
        }
        
        async function clearAllLayers() {
            if (confirm('Clear all elements from all layers?')) {
                console.log('Clear all layers requested');
                alert('Layer clearing would be implemented here');
            }
        }
        
        async function loadDepthXML() {
            try {
                const response = await fetch('/xml/depth-map');
                const xmlText = await response.text();
                const formatted = xmlText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                document.getElementById('depthXmlPreview').innerHTML = '<pre>' + formatted + '</pre>';
            } catch (error) {
                document.getElementById('depthXmlPreview').textContent = 'Error loading XML: ' + error.message;
            }
        }
        
        async function loadShadowXML() {
            try {
                const response = await fetch('/xml/shadow-map');
                const xmlText = await response.text();
                const formatted = xmlText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                document.getElementById('shadowXmlPreview').innerHTML = '<pre>' + formatted + '</pre>';
            } catch (error) {
                document.getElementById('shadowXmlPreview').textContent = 'Error loading XML: ' + error.message;
            }
        }
        
        // Auto-refresh render preview
        setInterval(() => {
            const preview = document.getElementById('renderPreview');
            if (preview) {
                // Simulate element movement
                const elements = preview.querySelectorAll('.render-element:not(.render-shadow):not(.render-ui)');
                elements.forEach(el => {
                    if (Math.random() > 0.95) {
                        const currentLeft = parseInt(el.style.left) || 0;
                        const currentTop = parseInt(el.style.top) || 0;
                        
                        el.style.left = Math.max(0, Math.min(760, currentLeft + (Math.random() - 0.5) * 10)) + 'px';
                        el.style.top = Math.max(0, Math.min(560, currentTop + (Math.random() - 0.5) * 10)) + 'px';
                    }
                });
            }
        }, 100);
        
        // Load XML previews on page load
        setTimeout(() => {
            loadDepthXML();
            loadShadowXML();
        }, 1000);
        
        console.log('🎨 Depth Mapping Dashboard loaded');
        console.log('📊 ' + ${this.depthLayers.size} + ' layers, ' + ${this.renderQueue.length} + ' render elements');
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveDepthMapXML(res) {
        const layers = Array.from(this.depthLayers.entries());
        
        const depthMapData = {
            '@': {
                xmlns: 'http://depth.local/mapping',
                timestamp: new Date().toISOString(),
                version: '1.0'
            },
            configuration: {
                renderMode: '3D_LAYERS',
                sortingMode: 'Z_INDEX',
                shadowsEnabled: true,
                maxLayers: Object.keys(this.DEPTH_LAYERS).length
            },
            layers: {
                layer: layers.map(([key, config]) => ({
                    '@': {
                        id: key,
                        zIndex: config.z,
                        visible: config.visible
                    },
                    name: config.name,
                    opacity: config.opacity,
                    transform: {
                        x: config.transform.x,
                        y: config.transform.y,
                        scale: config.transform.scale,
                        rotation: config.transform.rotation
                    },
                    elements: {
                        '@': { count: config.elements.length },
                        element: config.elements.map(el => ({
                            '@': { id: el.id, type: el.type },
                            bounds: {
                                x: el.bounds?.x || 0,
                                y: el.bounds?.y || 0,
                                width: el.bounds?.width || 0,
                                height: el.bounds?.height || 0
                            },
                            style: el.style || {},
                            castShadow: el.castShadow || false,
                            interactive: el.interactive || false,
                            zIndex: el.zIndex || config.z,
                            lastUpdate: el.lastUpdate
                        }))
                    },
                    lastUpdate: config.lastUpdate
                }))
            },
            renderQueue: {
                '@': { length: this.renderQueue.length },
                element: this.renderQueue.slice(0, 20).map(el => ({ // Limit to first 20 for XML size
                    '@': { 
                        id: el.id, 
                        layer: el.layerKey,
                        zIndex: el.layerZ,
                        isShadow: el.isShadow || false
                    },
                    bounds: el.bounds || {},
                    opacity: el.layerOpacity || 1.0
                }))
            }
        };
        
        // Convert to XML (simplified conversion)
        const xml = this.buildXMLFromObject(depthMapData, 'DepthMap');
        
        res.writeHead(200, { 
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-cache'
        });
        res.end(xml);
    }
    
    serveShadowMapXML(res) {
        const shadows = Array.from(this.shadowMaps.entries());
        
        const shadowMapData = {
            '@': {
                xmlns: 'http://depth.local/shadows',
                timestamp: new Date().toISOString()
            },
            configuration: this.SHADOW_CONFIG,
            shadowLayers: {
                layer: shadows.map(([layerKey, shadowMap]) => ({
                    '@': { 
                        id: layerKey,
                        enabled: shadowMap.enabled
                    },
                    lightSources: {
                        light: shadowMap.lightSources.map(light => ({
                            '@': { type: 'directional' },
                            direction: {
                                x: light.x,
                                y: light.y,
                                z: light.z
                            },
                            intensity: light.intensity
                        }))
                    },
                    shadows: {
                        '@': { count: shadowMap.elements.length },
                        shadow: shadowMap.elements.map(shadow => ({
                            '@': { 
                                id: shadow.elementId + '_shadow',
                                elementId: shadow.elementId
                            },
                            bounds: shadow.bounds,
                            style: shadow.style,
                            zIndex: shadow.zIndex
                        }))
                    }
                }))
            }
        };
        
        const xml = this.buildXMLFromObject(shadowMapData, 'ShadowMap');
        
        res.writeHead(200, { 
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-cache'
        });
        res.end(xml);
    }
    
    serveMenuStackXML(res) {
        const menuStackData = {
            '@': {
                xmlns: 'http://depth.local/menus',
                timestamp: new Date().toISOString(),
                depth: this.menuStack.length
            },
            configuration: {
                maxMenus: 10,
                modalBlocking: true,
                zIndexBase: this.DEPTH_LAYERS.MENUS.z
            },
            menuStack: {
                '@': { count: this.menuStack.length },
                menu: this.menuStack.map((menu, index) => ({
                    '@': {
                        id: menu.id,
                        index: index,
                        modal: menu.modal,
                        closeable: menu.closeable
                    },
                    title: menu.title,
                    type: menu.type,
                    bounds: menu.bounds,
                    zIndex: menu.zIndex,
                    visible: menu.visible,
                    elements: {
                        '@': { count: menu.elements.length },
                        element: menu.elements.map(el => (typeof el === 'string' ? { text: el } : el))
                    },
                    created: menu.created
                }))
            }
        };
        
        const xml = this.buildXMLFromObject(menuStackData, 'MenuStack');
        
        res.writeHead(200, { 
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-cache'
        });
        res.end(xml);
    }
    
    serveRenderQueueXML(res) {
        this.generateRenderQueue();
        
        const renderQueueData = {
            '@': {
                xmlns: 'http://depth.local/render',
                timestamp: new Date().toISOString(),
                frameId: crypto.randomUUID()
            },
            renderQueue: {
                '@': { 
                    length: this.renderQueue.length,
                    sorted: true,
                    sortMode: 'Z_INDEX_ASCENDING'
                },
                element: this.renderQueue.map((el, index) => ({
                    '@': {
                        id: el.id,
                        renderOrder: index,
                        layer: el.layerKey,
                        zIndex: el.layerZ,
                        isShadow: el.isShadow || false,
                        interactive: el.interactive || false
                    },
                    bounds: el.bounds || { x: 0, y: 0, width: 0, height: 0 },
                    style: el.style || {},
                    opacity: el.layerOpacity || 1.0,
                    transform: el.layerTransform || { x: 0, y: 0, scale: 1, rotation: 0 },
                    lastUpdate: el.lastUpdate || Date.now()
                }))
            },
            renderStats: {
                totalElements: this.renderQueue.length,
                shadowElements: this.renderQueue.filter(el => el.isShadow).length,
                uiElements: this.renderQueue.filter(el => el.layerKey?.includes('UI')).length,
                gameElements: this.renderQueue.filter(el => !el.layerKey?.includes('UI') && !el.isShadow).length
            }
        };
        
        const xml = this.buildXMLFromObject(renderQueueData, 'RenderQueue');
        
        res.writeHead(200, { 
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-cache'
        });
        res.end(xml);
    }
    
    buildXMLFromObject(obj, rootName) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += this.objectToXML(obj, rootName);
        return xml;
    }
    
    objectToXML(obj, tagName) {
        if (obj === null || obj === undefined) {
            return `<${tagName}></${tagName}>`;
        }
        
        if (typeof obj !== 'object') {
            return `<${tagName}>${this.escapeXML(obj.toString())}</${tagName}>`;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.objectToXML(item, tagName)).join('');
        }
        
        let attributes = '';
        let content = '';
        
        for (const [key, value] of Object.entries(obj)) {
            if (key === '@') {
                // Handle attributes
                if (typeof value === 'object') {
                    attributes = Object.entries(value)
                        .map(([attrKey, attrValue]) => ` ${attrKey}="${this.escapeXML(attrValue)}"`)
                        .join('');
                }
            } else {
                // Handle child elements
                content += this.objectToXML(value, key);
            }
        }
        
        return `<${tagName}${attributes}>${content}</${tagName}>`;
    }
    
    escapeXML(str) {
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    async handleAddElement(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { layer, element } = JSON.parse(body);
                const success = this.addElementToLayer(layer, element);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: success,
                    elementId: element.id,
                    layer: layer,
                    zIndex: this.zIndexRegistry.get(element.id)
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    async handleUpdateLayer(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { layer, updates } = JSON.parse(body);
                const layerConfig = this.depthLayers.get(layer);
                
                if (!layerConfig) {
                    throw new Error('Layer not found: ' + layer);
                }
                
                Object.assign(layerConfig, updates);
                layerConfig.lastUpdate = Date.now();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true,
                    layer: layer,
                    updates: updates
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    async handlePushMenu(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const menuConfig = JSON.parse(body);
                const menuId = this.pushMenu(menuConfig);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true,
                    menuId: menuId,
                    stackDepth: this.menuStack.length
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    async handlePopMenu(req, res) {
        try {
            const poppedMenu = this.popMenu();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true,
                poppedMenu: poppedMenu,
                stackDepth: this.menuStack.length
            }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
    }
    
    async handleCalculateShadows(req, res) {
        try {
            let shadowsCalculated = 0;
            
            this.shadowMaps.forEach((shadowMap, layerKey) => {
                if (!shadowMap.enabled) return;
                
                const layer = this.depthLayers.get(layerKey);
                if (!layer) return;
                
                layer.elements.forEach(element => {
                    if (element.castShadow) {
                        this.calculateElementShadow(layerKey, element);
                        shadowsCalculated++;
                    }
                });
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true,
                shadowsCalculated: shadowsCalculated
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
    }
    
    async handleGameElements(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                let processedElements = 0;
                
                // Process each update
                if (data.updates && Array.isArray(data.updates)) {
                    data.updates.forEach(update => {
                        if (update.action === 'update' && update.element) {
                            const element = update.element;
                            
                            // Convert game element format to depth system format
                            const depthElement = {
                                id: element.id,
                                type: element.type,
                                bounds: {
                                    x: element.x,
                                    y: element.y,
                                    width: element.width,
                                    height: element.height
                                },
                                castShadow: element.shadow && element.shadow.enabled,
                                shadowConfig: element.shadow,
                                visible: element.visible !== false,
                                interactive: element.type === 'ui' || element.type === 'menu',
                                modal: element.modal || false,
                                style: {
                                    opacity: element.opacity || 1.0,
                                    rotation: element.rotation || 0,
                                    scale: element.scale || 1.0
                                }
                            };
                            
                            // Find existing element and update, or add new
                            const layer = this.depthLayers.get(element.layer);
                            if (layer) {
                                const existingIndex = layer.elements.findIndex(el => el.id === element.id);
                                if (existingIndex >= 0) {
                                    // Update existing element
                                    layer.elements[existingIndex] = { ...layer.elements[existingIndex], ...depthElement };
                                } else {
                                    // Add new element
                                    this.addElementToLayer(element.layer, depthElement);
                                }
                                processedElements++;
                            }
                            
                        } else if (update.action === 'remove' && update.elementId) {
                            // Remove element from all layers
                            this.depthLayers.forEach(layer => {
                                const index = layer.elements.findIndex(el => el.id === update.elementId);
                                if (index >= 0) {
                                    layer.elements.splice(index, 1);
                                    processedElements++;
                                }
                            });
                            
                            // Remove from Z-index registry
                            this.zIndexRegistry.delete(update.elementId);
                        }
                    });
                }
                
                // Regenerate render queue
                this.generateRenderQueue();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true,
                    processedElements: processedElements,
                    totalElements: data.elementCount || 0,
                    renderQueueLength: this.renderQueue.length
                }));
                
                console.log(`🎨 Processed ${processedElements} game element updates`);
                
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    async handleShadowData(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                let processedShadows = 0;
                
                // Update light source if provided
                if (data.lightSource) {
                    this.SHADOW_CONFIG.DIRECTIONAL_LIGHT = {
                        ...this.SHADOW_CONFIG.DIRECTIONAL_LIGHT,
                        ...data.lightSource
                    };
                }
                
                // Process shadow updates
                if (data.shadows && Array.isArray(data.shadows)) {
                    data.shadows.forEach(shadowData => {
                        const layerKey = shadowData.layer;
                        const shadowMap = this.shadowMaps.get(layerKey);
                        
                        if (shadowMap) {
                            // Find or create shadow element
                            let shadowElement = shadowMap.elements.find(s => s.elementId === shadowData.elementId);
                            
                            if (!shadowElement) {
                                shadowElement = {
                                    elementId: shadowData.elementId,
                                    type: 'drop_shadow',
                                    layerKey: layerKey,
                                    bounds: {},
                                    style: {}
                                };
                                shadowMap.elements.push(shadowElement);
                            }
                            
                            // Update shadow properties
                            shadowElement.bounds = {
                                x: shadowData.shadowX,
                                y: shadowData.shadowY,
                                width: shadowData.sourceWidth,
                                height: shadowData.sourceHeight
                            };
                            
                            shadowElement.style = {
                                color: shadowData.color,
                                blur: shadowData.blur,
                                opacity: this.SHADOW_CONFIG.SHADOW_OPACITY
                            };
                            
                            processedShadows++;
                        }
                    });
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true,
                    processedShadows: processedShadows,
                    lightSource: this.SHADOW_CONFIG.DIRECTIONAL_LIGHT
                }));
                
                console.log(`🌫️ Processed ${processedShadows} shadow updates`);
                
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }

    async handleRenderFrame(req, res) {
        try {
            const renderQueue = this.generateRenderQueue();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true,
                renderQueueLength: renderQueue.length,
                frameId: crypto.randomUUID(),
                timestamp: Date.now()
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
    }
}

// Start the XML Depth Mapping System
async function startXMLDepthMappingSystem() {
    console.log('🎨 STARTING XML DEPTH MAPPING SYSTEM');
    console.log('====================================');
    console.log('Visual layer management solution for depth mapping issues');
    console.log('');
    
    const depthSystem = new XMLDepthMappingSystem(8765);
    await depthSystem.start();
    
    console.log('');
    console.log('🎯 Depth Mapping Features:');
    console.log('  📚 Hierarchical layer management with Z-index');
    console.log('  🌫️ Real-time shadow calculation and mapping');
    console.log('  📋 Menu stack management with modal support');
    console.log('  🎬 Automatic render queue generation');
    console.log('  🌐 Complete XML serialization of visual state');
    console.log('  ⚡ 60 FPS depth monitoring and updates');
    console.log('');
    console.log('🎨 DEPTH MAPPING SYSTEM OPERATIONAL');
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down XML Depth Mapping System...');
    process.exit(0);
});

// Start the system
startXMLDepthMappingSystem().catch(console.error);