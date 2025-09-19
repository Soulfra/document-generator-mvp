#!/usr/bin/env node

/**
 * 🌉🎮 HTTP BRIDGE: GAME WORLD → OBSIDIAN PLUGINS
 * 
 * Connects the polygon companion game world to Obsidian productivity plugins
 * Routes in-game events to Document-to-MVP, Character Mirror, Universal Compactor
 * Enables real productivity actions triggered by companion AI behavior
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

console.log(`
🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉
🎮 HTTP BRIDGE: GAME ↔ OBSIDIAN 🎮
🌉 Polygon Companions → Real Productivity 🌉
🎮 In-Game Events → Document Generation 🎮
🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉🎮🌉
`);

class GameToObsidianBridge {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 9997; // Unique bridge port

        // System connections
        this.gameConnections = {
            polygonalCompanion: 'ws://localhost:9999',
            luaEngine: 'ws://localhost:9998', 
            voxelWorld: 'ws://localhost:9996'
        };

        this.obsidianPlugins = {
            documentToMVP: { port: 3001, status: 'unknown' },
            characterMirror: { port: 7777, status: 'unknown' },
            universalCompactor: { port: 8080, status: 'unknown' }
        };

        // Bridge state
        this.activeBridges = new Map();
        this.eventQueue = [];
        this.actionLog = [];
        this.connectedClients = new Set();
        
        // Statistics
        this.stats = {
            eventsProcessed: 0,
            actionsTriggered: 0,
            documentsGenerated: 0,
            mirrorsCreated: 0,
            packagesCompacted: 0,
            uptime: Date.now()
        };

        this.initialize();
    }

    async initialize() {
        console.log('🔗 Initializing Game-to-Obsidian Bridge...');

        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));

        this.setupRoutes();
        this.setupWebSocket();
        await this.connectToGameSystems();
        await this.verifyObsidianPlugins();

        this.server.listen(this.port, () => {
            console.log(`🌉 Game-to-Obsidian Bridge running on http://localhost:${this.port}`);
            console.log(`🎮 Ready to translate game events into productivity actions`);
        });
    }

    setupRoutes() {
        // Main bridge dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getBridgeDashboard());
        });

        // Bridge status and health
        this.app.get('/api/status', (req, res) => {
            res.json({
                bridge: 'active',
                gameConnections: this.gameConnections,
                obsidianPlugins: this.obsidianPlugins,
                stats: this.stats,
                activeBridges: this.activeBridges.size,
                queueLength: this.eventQueue.length
            });
        });

        // Manual event injection (for testing)
        this.app.post('/api/inject-event', (req, res) => {
            const event = req.body;
            this.processGameEvent(event);
            res.json({ success: true, event });
        });

        // Action history
        this.app.get('/api/actions', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            res.json(this.actionLog.slice(-limit));
        });

        // Bridge a specific game event to Obsidian action
        this.app.post('/api/bridge/:plugin', async (req, res) => {
            const plugin = req.params.plugin;
            const action = req.body;
            
            try {
                const result = await this.bridgeToObsidian(plugin, action);
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Get active companions from game world
        this.app.get('/api/companions', async (req, res) => {
            try {
                const companions = await this.fetchGameData('polygonalCompanion', '/api/companions');
                res.json(companions);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 Bridge client connected');
            this.connectedClients.add(ws);

            // Send current bridge state
            ws.send(JSON.stringify({
                type: 'bridge_state',
                data: {
                    stats: this.stats,
                    activeBridges: this.activeBridges.size,
                    gameConnections: this.gameConnections,
                    obsidianPlugins: this.obsidianPlugins
                }
            }));

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });

            ws.on('close', () => {
                this.connectedClients.delete(ws);
                console.log('🔌 Bridge client disconnected');
            });
        });
    }

    async connectToGameSystems() {
        console.log('🎮 Connecting to game systems...');

        // Connect to Polygonal Companion System
        try {
            const companionWS = new WebSocket('ws://localhost:9999');
            companionWS.on('open', () => {
                console.log('  ✅ Connected to Polygonal Companion System');
                this.setupGameEventListener('polygonalCompanion', companionWS);
            });
            companionWS.on('error', () => {
                console.log('  ⚠️ Polygonal Companion System not available');
            });
        } catch (error) {
            console.log('  ⚠️ Could not connect to Polygonal Companion System');
        }

        // Connect to Lua Engine
        try {
            const luaWS = new WebSocket('ws://localhost:9998');
            luaWS.on('open', () => {
                console.log('  ✅ Connected to Lua Engine');
                this.setupGameEventListener('luaEngine', luaWS);
            });
            luaWS.on('error', () => {
                console.log('  ⚠️ Lua Engine not available');
            });
        } catch (error) {
            console.log('  ⚠️ Could not connect to Lua Engine');
        }
    }

    setupGameEventListener(systemName, ws) {
        ws.on('message', (data) => {
            try {
                const event = JSON.parse(data);
                // Tag event with source system
                event.sourceSystem = systemName;
                this.processGameEvent(event);
            } catch (error) {
                console.error(`Error processing event from ${systemName}:`, error);
            }
        });
    }

    async verifyObsidianPlugins() {
        console.log('🔍 Verifying Obsidian plugin connections...');

        for (const [pluginName, config] of Object.entries(this.obsidianPlugins)) {
            try {
                const response = await fetch(`http://localhost:${config.port}/ping`);
                if (response.ok) {
                    config.status = 'active';
                    console.log(`  ✅ ${pluginName} active on port ${config.port}`);
                } else {
                    config.status = 'error';
                    console.log(`  ❌ ${pluginName} responded with error`);
                }
            } catch (error) {
                config.status = 'offline';
                console.log(`  ⚠️ ${pluginName} offline (port ${config.port})`);
            }
        }
    }

    processGameEvent(event) {
        console.log(`🎯 Processing game event: ${event.type} from ${event.sourceSystem}`);
        
        this.stats.eventsProcessed++;
        
        // Add to event queue
        this.eventQueue.push({
            ...event,
            bridgeTimestamp: Date.now(),
            id: crypto.randomBytes(4).toString('hex')
        });

        // Process event based on type
        this.routeEventToObsidian(event);

        // Broadcast to connected clients
        this.broadcast({
            type: 'game_event_processed',
            event: event,
            stats: this.stats
        });
    }

    async routeEventToObsidian(event) {
        const routingRules = {
            // Voxel building → Document generation
            'voxel_placed': async (event) => {
                const structure = this.analyzeVoxelStructure(event);
                await this.bridgeToObsidian('documentToMVP', {
                    action: 'generate_from_structure',
                    structure: structure,
                    prompt: `Create documentation for this ${structure.type} structure`,
                    companion: event.companion
                });
            },

            // Companion movement → Character mirror
            'companion_moved': async (event) => {
                await this.bridgeToObsidian('characterMirror', {
                    action: 'update_position',
                    characterId: event.companion?.id,
                    position: event.companion?.position,
                    timestamp: Date.now()
                });
            },

            // Companion analysis → Document generation
            'companion_analysis': async (event) => {
                await this.bridgeToObsidian('documentToMVP', {
                    action: 'process_analysis',
                    analysis: event.analysis,
                    context: 'companion_generated',
                    priority: 'high'
                });
            },

            // Lua script execution → Universal compactor
            'lua_command': async (event) => {
                if (event.command === 'bridge_to_system') {
                    const targetSystem = event.data.systemName;
                    if (targetSystem === 'universalCompactor') {
                        await this.bridgeToObsidian('universalCompactor', {
                            action: 'compact_lua_execution',
                            script: event.data.script,
                            result: event.data.result
                        });
                    }
                }
            },

            // Companion discovery → Multiple systems
            'companion_discovery': async (event) => {
                // Generate documentation
                await this.bridgeToObsidian('documentToMVP', {
                    action: 'document_discovery',
                    discovery: event.discovery,
                    companion: event.companion?.name
                });

                // Create mirrors
                await this.bridgeToObsidian('characterMirror', {
                    action: 'mirror_discovery',
                    discovery: event.discovery
                });
            },

            // Zone conversations → Character mirror
            'zone_conversation': async (event) => {
                await this.bridgeToObsidian('characterMirror', {
                    action: 'log_conversation',
                    conversationId: event.conversationId,
                    message: event.message,
                    worldId: event.worldId,
                    zoneId: event.zoneId
                });
            }
        };

        const handler = routingRules[event.type];
        if (handler) {
            try {
                await handler(event);
                this.stats.actionsTriggered++;
            } catch (error) {
                console.error(`Error routing event ${event.type}:`, error);
            }
        }
    }

    analyzeVoxelStructure(event) {
        // Simple structure analysis based on voxel placement
        const voxel = event.voxel || event.data?.voxel;
        if (!voxel) return { type: 'unknown', analysis: 'No voxel data' };

        const structures = {
            'house': { minBlocks: 20, materials: ['wood', 'stone'] },
            'tower': { minBlocks: 15, heightRatio: 2.0 },
            'bridge': { minBlocks: 10, lengthRatio: 3.0 },
            'sculpture': { minBlocks: 5, materials: ['gold', 'diamond'] }
        };

        // This would be more sophisticated in a real implementation
        return {
            type: voxel.type === 'gold' ? 'sculpture' : 'building',
            materials: [voxel.type],
            position: voxel.position || { x: voxel.x, y: voxel.y, z: voxel.z },
            analysis: `${voxel.type} structure detected at coordinates`
        };
    }

    async bridgeToObsidian(pluginName, action) {
        const plugin = this.obsidianPlugins[pluginName];
        if (!plugin || plugin.status !== 'active') {
            throw new Error(`Plugin ${pluginName} is not active`);
        }

        const bridgeId = crypto.randomBytes(4).toString('hex');
        console.log(`🌉 Bridging to ${pluginName}: ${action.action} [${bridgeId}]`);

        this.activeBridges.set(bridgeId, {
            plugin: pluginName,
            action: action.action,
            startTime: Date.now(),
            status: 'in_progress'
        });

        try {
            // Route to appropriate endpoint based on plugin
            let endpoint;
            switch (pluginName) {
                case 'documentToMVP':
                    endpoint = '/api/process';
                    this.stats.documentsGenerated++;
                    break;
                case 'characterMirror':
                    endpoint = '/mirror-action';
                    this.stats.mirrorsCreated++;
                    break;
                case 'universalCompactor':
                    endpoint = '/compact';
                    this.stats.packagesCompacted++;
                    break;
                default:
                    endpoint = '/api/action';
            }

            const response = await fetch(`http://localhost:${plugin.port}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...action,
                    bridgeId,
                    gameSource: true,
                    timestamp: Date.now()
                })
            });

            const result = await response.json();
            
            // Update bridge status
            this.activeBridges.get(bridgeId).status = 'completed';
            this.activeBridges.get(bridgeId).result = result;
            this.activeBridges.get(bridgeId).endTime = Date.now();

            // Log action
            this.actionLog.push({
                id: bridgeId,
                plugin: pluginName,
                action: action.action,
                timestamp: Date.now(),
                success: response.ok,
                result: result
            });

            // Broadcast success
            this.broadcast({
                type: 'obsidian_action_completed',
                bridgeId,
                plugin: pluginName,
                result: result,
                stats: this.stats
            });

            console.log(`  ✅ Bridge completed: ${pluginName} ${action.action}`);
            return result;

        } catch (error) {
            // Update bridge status
            this.activeBridges.get(bridgeId).status = 'failed';
            this.activeBridges.get(bridgeId).error = error.message;
            this.activeBridges.get(bridgeId).endTime = Date.now();

            console.error(`  ❌ Bridge failed: ${pluginName} ${action.action} - ${error.message}`);
            throw error;
        }
    }

    async fetchGameData(system, endpoint) {
        const baseUrls = {
            'polygonalCompanion': 'http://localhost:9999',
            'luaEngine': 'http://localhost:9998'
        };

        const response = await fetch(`${baseUrls[system]}${endpoint}`);
        return await response.json();
    }

    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'request_stats':
                ws.send(JSON.stringify({
                    type: 'stats_update',
                    stats: this.stats,
                    activeBridges: this.activeBridges.size
                }));
                break;

            case 'manual_bridge':
                this.bridgeToObsidian(message.plugin, message.action)
                    .then(result => {
                        ws.send(JSON.stringify({
                            type: 'bridge_result',
                            success: true,
                            result
                        }));
                    })
                    .catch(error => {
                        ws.send(JSON.stringify({
                            type: 'bridge_result',
                            success: false,
                            error: error.message
                        }));
                    });
                break;
        }
    }

    broadcast(message) {
        this.connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    getBridgeDashboard() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌉🎮 Game-to-Obsidian Bridge</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Courier New', monospace;
            color: #fff;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        
        .connections-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .connection-panel {
            background: rgba(0, 0, 0, 0.2);
            padding: 20px;
            border-radius: 8px;
        }
        
        .status-active { color: #00ff88; }
        .status-offline { color: #ff6b6b; }
        .status-error { color: #ffa500; }
        
        .event-log {
            background: rgba(0, 0, 0, 0.4);
            padding: 20px;
            border-radius: 8px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .log-entry {
            margin: 5px 0;
            padding: 5px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            font-size: 12px;
        }
        
        button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
            font-weight: bold;
        }
        
        button:hover {
            background: #00cc66;
        }
        
        .bridge-controls {
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌉🎮 Game-to-Obsidian Bridge</h1>
            <p>Translating polygon companion actions into real productivity</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Bridge Statistics</h3>
                <div id="stats">Loading...</div>
            </div>
            
            <div class="stat-card">
                <h3>⚡ Active Operations</h3>
                <div id="active-bridges">Loading...</div>
            </div>
        </div>
        
        <div class="connections-grid">
            <div class="connection-panel">
                <h3>🎮 Game Systems</h3>
                <div id="game-connections">Loading...</div>
            </div>
            
            <div class="connection-panel">
                <h3>📝 Obsidian Plugins</h3>
                <div id="obsidian-plugins">Loading...</div>
            </div>
        </div>
        
        <div class="bridge-controls">
            <h3>🔧 Manual Bridge Controls</h3>
            <button onclick="testDocumentGeneration()">📄 Test Document Generation</button>
            <button onclick="testCharacterMirror()">🪞 Test Character Mirror</button>
            <button onclick="testUniversalCompactor()">📦 Test Universal Compactor</button>
            <button onclick="refreshStatus()">🔄 Refresh Status</button>
        </div>
        
        <div class="event-log">
            <h3>📋 Recent Actions</h3>
            <div id="action-log">Loading action history...</div>
        </div>
    </div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:9997');
        
        ws.onopen = () => {
            console.log('🔌 Connected to bridge');
            loadStatus();
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };
        
        function handleServerMessage(message) {
            switch (message.type) {
                case 'bridge_state':
                    updateStats(message.data.stats);
                    updateConnections(message.data.gameConnections, message.data.obsidianPlugins);
                    break;
                    
                case 'stats_update':
                    updateStats(message.stats);
                    updateActiveBridges(message.activeBridges);
                    break;
                    
                case 'obsidian_action_completed':
                    addToActionLog(\`✅ \${message.plugin}: \${message.result.success ? 'Success' : 'Failed'}\`);
                    updateStats(message.stats);
                    break;
                    
                case 'game_event_processed':
                    addToActionLog(\`🎯 Game event: \${message.event.type}\`);
                    break;
            }
        }
        
        function updateStats(stats) {
            const statsDiv = document.getElementById('stats');
            const uptime = Math.floor((Date.now() - stats.uptime) / 1000 / 60);
            
            statsDiv.innerHTML = \`
                <div>Events Processed: <strong>\${stats.eventsProcessed}</strong></div>
                <div>Actions Triggered: <strong>\${stats.actionsTriggered}</strong></div>
                <div>Documents Generated: <strong>\${stats.documentsGenerated}</strong></div>
                <div>Mirrors Created: <strong>\${stats.mirrorsCreated}</strong></div>
                <div>Packages Compacted: <strong>\${stats.packagesCompacted}</strong></div>
                <div>Uptime: <strong>\${uptime} minutes</strong></div>
            \`;
        }
        
        function updateActiveBridges(count) {
            document.getElementById('active-bridges').innerHTML = 
                \`<div>Active Bridges: <strong>\${count}</strong></div>\`;
        }
        
        function updateConnections(gameConnections, obsidianPlugins) {
            const gameDiv = document.getElementById('game-connections');
            gameDiv.innerHTML = Object.entries(gameConnections).map(([name, url]) => 
                \`<div>• \${name}: \${url}</div>\`
            ).join('');
            
            const obsidianDiv = document.getElementById('obsidian-plugins');
            obsidianDiv.innerHTML = Object.entries(obsidianPlugins).map(([name, config]) => 
                \`<div>• \${name}: <span class="status-\${config.status}">Port \${config.port} (\${config.status})</span></div>\`
            ).join('');
        }
        
        function addToActionLog(message) {
            const logDiv = document.getElementById('action-log');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            
            logDiv.insertBefore(entry, logDiv.firstChild);
            
            // Keep only last 50 entries
            while (logDiv.children.length > 50) {
                logDiv.removeChild(logDiv.lastChild);
            }
        }
        
        async function loadStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                
                updateStats(status.stats);
                updateConnections(status.gameConnections, status.obsidianPlugins);
                updateActiveBridges(status.activeBridges);
                
                loadActionLog();
            } catch (error) {
                console.error('Failed to load status:', error);
            }
        }
        
        async function loadActionLog() {
            try {
                const response = await fetch('/api/actions');
                const actions = await response.json();
                
                const logDiv = document.getElementById('action-log');
                logDiv.innerHTML = '';
                
                actions.reverse().forEach(action => {
                    const status = action.success ? '✅' : '❌';
                    addToActionLog(\`\${status} \${action.plugin}: \${action.action}\`);
                });
            } catch (error) {
                console.error('Failed to load action log:', error);
            }
        }
        
        async function testDocumentGeneration() {
            try {
                const response = await fetch('/api/inject-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'companion_analysis',
                        sourceSystem: 'manual_test',
                        analysis: {
                            type: 'test_structure',
                            findings: 'Manual bridge test - generating test document',
                            complexity: 'low'
                        },
                        companion: { name: 'Test Companion' }
                    })
                });
                
                const result = await response.json();
                addToActionLog('🧪 Manual test: Document generation triggered');
            } catch (error) {
                addToActionLog('❌ Test failed: ' + error.message);
            }
        }
        
        async function testCharacterMirror() {
            try {
                const response = await fetch('/api/inject-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'companion_moved',
                        sourceSystem: 'manual_test',
                        companion: {
                            id: 'test_companion',
                            position: { x: 10, y: 5, z: 15 },
                            name: 'Test Companion'
                        }
                    })
                });
                
                addToActionLog('🧪 Manual test: Character mirror triggered');
            } catch (error) {
                addToActionLog('❌ Test failed: ' + error.message);
            }
        }
        
        async function testUniversalCompactor() {
            try {
                const response = await fetch('/api/inject-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'lua_command',
                        sourceSystem: 'manual_test',
                        command: 'bridge_to_system',
                        data: {
                            systemName: 'universalCompactor',
                            script: 'test_script.lua',
                            result: 'Test compaction request'
                        }
                    })
                });
                
                addToActionLog('🧪 Manual test: Universal compactor triggered');
            } catch (error) {
                addToActionLog('❌ Test failed: ' + error.message);
            }
        }
        
        function refreshStatus() {
            loadStatus();
            addToActionLog('🔄 Status refreshed');
        }
        
        // Auto-refresh every 30 seconds
        setInterval(loadStatus, 30000);
    </script>
</body>
</html>`;
    }
}

// Start the bridge
if (require.main === module) {
    new GameToObsidianBridge();
}

module.exports = GameToObsidianBridge;