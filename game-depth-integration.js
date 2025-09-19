#!/usr/bin/env node

/**
 * 🎮 GAME DEPTH INTEGRATION LAYER
 * Connects the Enhanced Game Server with XML Depth Mapping System
 * Sends real-time element positions and layer data for proper rendering
 */

const http = require('http');

class GameDepthIntegration {
    constructor(gamePort, depthMappingPort) {
        this.gamePort = gamePort;
        this.depthMappingPort = depthMappingPort;
        this.gameElements = new Map();
        this.layerUpdates = [];
        
        // Track game entities and their visual properties
        this.entityLayers = {
            players: 'PLAYERS',
            npcs: 'NPCS', 
            items: 'ITEMS',
            terrain: 'WORLD_TERRAIN',
            ui: 'UI_ELEMENTS',
            menus: 'MENUS'
        };
        
        this.initializeIntegration();
    }
    
    async initializeIntegration() {
        console.log('🎨 GAME DEPTH INTEGRATION STARTING');
        console.log('==================================');
        console.log('Connecting game server to depth mapping system');
        console.log('');
        
        // Start monitoring game state changes
        this.startGameStateMonitoring();
        
        // Start sending updates to depth mapper
        this.startDepthUpdates();
        
        console.log('✅ Game depth integration active');
        console.log(`🎮 Monitoring game server on port ${this.gamePort}`);
        console.log(`🎨 Sending depth data to port ${this.depthMappingPort}`);
    }
    
    startGameStateMonitoring() {
        // Simulate real game state monitoring
        // In a real implementation, this would listen to game server events
        setInterval(() => {
            this.simulateGameStateUpdate();
        }, 1000); // Update every second
        
        console.log('👁️ Game state monitoring started');
    }
    
    simulateGameStateUpdate() {
        // Simulate players moving around
        for (let i = 0; i < 3; i++) {
            const playerId = `player_${i}`;
            this.updateGameElement(playerId, {
                type: 'player',
                x: Math.random() * 800,
                y: Math.random() * 600,
                width: 32,
                height: 48,
                layer: this.entityLayers.players,
                visible: true,
                shadow: {
                    enabled: true,
                    offsetX: 5,
                    offsetY: 5,
                    blur: 3,
                    color: 'rgba(0,0,0,0.3)'
                }
            });
        }
        
        // Simulate NPCs
        for (let i = 0; i < 2; i++) {
            const npcId = `npc_${i}`;
            this.updateGameElement(npcId, {
                type: 'npc',
                x: 100 + (i * 200) + Math.sin(Date.now() / 1000) * 50,
                y: 300,
                width: 28,
                height: 40,
                layer: this.entityLayers.npcs,
                visible: true,
                shadow: {
                    enabled: true,
                    offsetX: 3,
                    offsetY: 3,
                    blur: 2,
                    color: 'rgba(0,0,0,0.25)'
                }
            });
        }
        
        // Simulate UI elements
        this.updateGameElement('health_bar', {
            type: 'ui',
            x: 10,
            y: 10,
            width: 200,
            height: 20,
            layer: this.entityLayers.ui,
            visible: true,
            shadow: {
                enabled: false
            }
        });
        
        // Simulate menu if randomly open
        if (Math.random() < 0.1) { // 10% chance menu is open
            this.updateGameElement('main_menu', {
                type: 'menu',
                x: 200,
                y: 150,
                width: 400,
                height: 300,
                layer: this.entityLayers.menus,
                visible: true,
                modal: true,
                shadow: {
                    enabled: true,
                    offsetX: 10,
                    offsetY: 10,
                    blur: 15,
                    color: 'rgba(0,0,0,0.5)'
                }
            });
        } else {
            this.removeGameElement('main_menu');
        }
    }
    
    updateGameElement(elementId, properties) {
        const element = {
            id: elementId,
            timestamp: Date.now(),
            ...properties
        };
        
        this.gameElements.set(elementId, element);
        
        // Queue for sending to depth mapper
        this.layerUpdates.push({
            action: 'update',
            element: element
        });
    }
    
    removeGameElement(elementId) {
        if (this.gameElements.has(elementId)) {
            this.gameElements.delete(elementId);
            
            this.layerUpdates.push({
                action: 'remove',
                elementId: elementId
            });
        }
    }
    
    startDepthUpdates() {
        setInterval(async () => {
            if (this.layerUpdates.length > 0) {
                await this.sendDepthUpdates();
            }
        }, 100); // Send updates every 100ms for smooth rendering
        
        console.log('📡 Depth update transmission started');
    }
    
    async sendDepthUpdates() {
        const updates = [...this.layerUpdates];
        this.layerUpdates = []; // Clear queue
        
        const updateData = {
            timestamp: Date.now(),
            updates: updates,
            elementCount: this.gameElements.size
        };
        
        try {
            await this.postToDepthMapper('/api/game-elements', updateData);
            
            // Send shadow updates
            const shadowData = this.generateShadowData();
            if (shadowData.shadows.length > 0) {
                await this.postToDepthMapper('/api/shadows', shadowData);
            }
            
        } catch (error) {
            console.error('❌ Failed to send depth updates:', error.message);
        }
    }
    
    generateShadowData() {
        const shadows = [];
        
        for (const [elementId, element] of this.gameElements) {
            if (element.shadow && element.shadow.enabled) {
                shadows.push({
                    elementId: elementId,
                    sourceX: element.x,
                    sourceY: element.y,
                    sourceWidth: element.width,
                    sourceHeight: element.height,
                    shadowX: element.x + element.shadow.offsetX,
                    shadowY: element.y + element.shadow.offsetY,
                    blur: element.shadow.blur,
                    color: element.shadow.color,
                    layer: element.layer
                });
            }
        }
        
        return {
            timestamp: Date.now(),
            lightSource: {
                x: 400, // Center of screen
                y: 100, // Above center
                intensity: 1.0
            },
            shadows: shadows
        };
    }
    
    async postToDepthMapper(endpoint, data) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(data);
            
            const options = {
                hostname: 'localhost',
                port: this.depthMappingPort,
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'X-Game-Integration': 'true'
                }
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', chunk => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(responseData);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
    
    // API for game server to call directly
    startAPIServer(port = 8766) {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${port}`);
            
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            console.log(`🎮 Game Integration Request: ${req.method} ${url.pathname}`);
            
            switch (url.pathname) {
                case '/api/element/update':
                    this.handleElementUpdate(req, res);
                    break;
                case '/api/element/remove':
                    this.handleElementRemove(req, res);
                    break;
                case '/api/status':
                    this.handleStatus(req, res);
                    break;
                case '/':
                    this.serveIntegrationDashboard(res);
                    break;
                default:
                    res.writeHead(404);
                    res.end('Endpoint not found');
            }
        });
        
        server.listen(port, () => {
            console.log(`🎨 Game depth integration API running on port ${port}`);
        });
    }
    
    async handleElementUpdate(req, res) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    this.updateGameElement(data.id, data);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, updated: data.id }));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
        } else {
            res.writeHead(405);
            res.end('Method not allowed');
        }
    }
    
    async handleElementRemove(req, res) {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    this.removeGameElement(data.id);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, removed: data.id }));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
        } else {
            res.writeHead(405);
            res.end('Method not allowed');
        }
    }
    
    async handleStatus(req, res) {
        const status = {
            elementsTracked: this.gameElements.size,
            pendingUpdates: this.layerUpdates.length,
            gameServerPort: this.gamePort,
            depthMappingPort: this.depthMappingPort,
            lastUpdate: Date.now(),
            integration: 'ACTIVE'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    }
    
    serveIntegrationDashboard(res) {
        const elements = Array.from(this.gameElements.entries());
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🎮 Game Depth Integration Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e); color: #fff; font-family: monospace; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: rgba(0,255,255,0.1); border: 2px solid #0ff; border-radius: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: rgba(0,0,0,0.7); border: 2px solid #0f0; padding: 20px; border-radius: 10px; text-align: center; }
        .stat-value { font-size: 36px; font-weight: bold; color: #0f0; margin: 10px 0; }
        
        .elements-section { background: rgba(0,0,0,0.5); border: 2px solid #ff0; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .element-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .element-card { background: rgba(255,255,255,0.1); border: 1px solid #ccc; padding: 15px; border-radius: 8px; font-size: 12px; }
        .element-header { font-weight: bold; color: #0ff; margin-bottom: 10px; }
        .element-details { line-height: 1.4; }
        .element-details div { margin: 3px 0; }
        
        .visual-preview { background: rgba(0,0,0,0.8); border: 2px solid #f0f; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .canvas-container { position: relative; background: #333; border: 1px solid #666; margin: 10px 0; }
        canvas { display: block; }
        
        .live-indicator { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 GAME DEPTH INTEGRATION</h1>
            <p>Real-time element tracking and layer coordination</p>
            <div class="live-indicator">📡 INTEGRATION ACTIVE</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div>Elements Tracked</div>
                <div class="stat-value">${this.gameElements.size}</div>
            </div>
            <div class="stat-card">
                <div>Pending Updates</div>
                <div class="stat-value">${this.layerUpdates.length}</div>
            </div>
            <div class="stat-card">
                <div>Game Server</div>
                <div class="stat-value">:${this.gamePort}</div>
            </div>
            <div class="stat-card">
                <div>Depth Mapper</div>
                <div class="stat-value">:${this.depthMappingPort}</div>
            </div>
        </div>
        
        <div class="elements-section">
            <h2>🎯 Tracked Game Elements</h2>
            <div class="element-grid">
                ${elements.map(([id, element]) => `
                    <div class="element-card">
                        <div class="element-header">${id} (${element.type})</div>
                        <div class="element-details">
                            <div><strong>Position:</strong> (${Math.round(element.x)}, ${Math.round(element.y)})</div>
                            <div><strong>Size:</strong> ${element.width}×${element.height}</div>
                            <div><strong>Layer:</strong> ${element.layer}</div>
                            <div><strong>Visible:</strong> ${element.visible ? '✅' : '❌'}</div>
                            ${element.shadow && element.shadow.enabled ? `
                                <div><strong>Shadow:</strong> ✅ (${element.shadow.offsetX}, ${element.shadow.offsetY})</div>
                            ` : '<div><strong>Shadow:</strong> ❌</div>'}
                            ${element.modal ? '<div><strong>Modal:</strong> ✅</div>' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="visual-preview">
            <h2>🎨 Visual Preview</h2>
            <div class="canvas-container">
                <canvas id="previewCanvas" width="800" height="600"></canvas>
            </div>
            <p>Real-time visualization of tracked elements and their layers</p>
        </div>
        
        <div class="elements-section">
            <h2>📊 Layer Distribution</h2>
            <div class="element-details">
                ${Object.values(this.entityLayers).map(layer => {
                    const count = elements.filter(([id, element]) => element.layer === layer).length;
                    return `<div><strong>${layer}:</strong> ${count} elements</div>`;
                }).join('')}
            </div>
        </div>
    </div>
    
    <script>
        const canvas = document.getElementById('previewCanvas');
        const ctx = canvas.getContext('2d');
        
        function drawElements() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw background
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const elements = ${JSON.stringify(elements)};
            
            // Sort by layer depth (background first)
            const layerOrder = ['BACKGROUND', 'WORLD_TERRAIN', 'ITEMS', 'NPCS', 'PLAYERS', 'UI_ELEMENTS', 'MENUS'];
            elements.sort((a, b) => {
                const aIndex = layerOrder.indexOf(a[1].layer);
                const bIndex = layerOrder.indexOf(b[1].layer);
                return aIndex - bIndex;
            });
            
            // Draw shadows first
            elements.forEach(([id, element]) => {
                if (element.shadow && element.shadow.enabled) {
                    ctx.fillStyle = element.shadow.color;
                    ctx.filter = \`blur(\${element.shadow.blur}px)\`;
                    ctx.fillRect(
                        element.x + element.shadow.offsetX,
                        element.y + element.shadow.offsetY,
                        element.width,
                        element.height
                    );
                    ctx.filter = 'none';
                }
            });
            
            // Draw elements
            elements.forEach(([id, element]) => {
                if (!element.visible) return;
                
                // Different colors for different types
                const colors = {
                    player: '#0f0',
                    npc: '#ff0',
                    ui: '#0ff',
                    menu: '#f0f',
                    item: '#f80'
                };
                
                ctx.fillStyle = colors[element.type] || '#fff';
                ctx.fillRect(element.x, element.y, element.width, element.height);
                
                // Draw border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(element.x, element.y, element.width, element.height);
                
                // Draw label
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.fillText(id, element.x + 2, element.y - 2);
            });
        }
        
        // Update preview every second
        setInterval(drawElements, 1000);
        drawElements(); // Initial draw
        
        // Auto-refresh page every 10 seconds
        setInterval(() => {
            window.location.reload();
        }, 10000);
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// Start the integration system
async function startGameDepthIntegration() {
    console.log('🎮 STARTING GAME DEPTH INTEGRATION');
    console.log('==================================');
    console.log('Bridging game server and depth mapping system');
    console.log('');
    
    const integration = new GameDepthIntegration(43594, 8765);
    
    // Start API server for game server to communicate
    integration.startAPIServer(8766);
    
    console.log('');
    console.log('🎯 Integration Features:');
    console.log('  📡 Real-time element position tracking');
    console.log('  🎨 Layer coordination with depth mapper');
    console.log('  👥 Player and NPC shadow generation');
    console.log('  📋 Menu and UI layer management');
    console.log('  🔄 Automatic update transmission');
    console.log('');
    console.log('🎮 GAME DEPTH INTEGRATION ACTIVE');
    console.log('');
    console.log('🌐 Dashboard: http://localhost:8766');
    console.log('📡 API: http://localhost:8766/api/status');
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down game depth integration...');
    process.exit(0);
});

// Start the system
startGameDepthIntegration().catch(console.error);