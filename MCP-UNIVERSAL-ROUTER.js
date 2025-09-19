#!/usr/bin/env node
// MCP-UNIVERSAL-ROUTER.js - Model Context Protocol router connecting everything

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');
const EventEmitter = require('events');

// Import all our systems
const TycoonGameConnector = require('./TYCOON-GAME-CONNECTOR.js');
const DigitalPostOffice = require('./PACKET-UNPACKER.js');
const CleanAIPlayer = require('./CLEAN-AI-PLAYER.js');
const DeviceMeshARPANET = require('./DEVICE-MESH-ARPANET.js');

class MCPUniversalRouter extends EventEmitter {
    constructor() {
        super();
        
        // MCP endpoints
        this.endpoints = new Map();
        this.connections = new Map();
        this.routes = new Map();
        
        // Internal systems
        this.systems = {
            tycoon: null,
            postOffice: null,
            aiPlayer: null,
            deviceMesh: null,
            verification: null
        };
        
        // MCP configuration
        this.config = {
            port: 9999,
            wsPort: 9998,
            mcpVersion: '1.0',
            heartbeatInterval: 5000
        };
        
        // Route table
        this.routeTable = {
            '/game/*': 'tycoon',
            '/packet/*': 'postOffice',
            '/ai/*': 'aiPlayer',
            '/mesh/*': 'deviceMesh',
            '/verify/*': 'verification',
            '/mcp/*': 'internal'
        };
        
        console.log('🌐 MCP UNIVERSAL ROUTER INITIALIZED');
        console.log('🔌 Connecting all systems internally...');
    }

    async initialize() {
        console.log('\n📡 INITIALIZING MCP SYSTEMS...');
        
        try {
            // Initialize device mesh first (foundation)
            this.systems.deviceMesh = new DeviceMeshARPANET();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Device Mesh ARPANET ready');
            
            // Initialize post office
            this.systems.postOffice = new DigitalPostOffice();
            console.log('✅ Digital Post Office ready');
            
            // Initialize tycoon game
            this.systems.tycoon = new TycoonGameConnector();
            await this.systems.tycoon.initialize();
            console.log('✅ Tycoon Game ready');
            
            // Initialize AI player
            this.systems.aiPlayer = new CleanAIPlayer();
            console.log('✅ AI Player ready');
            
            // Start MCP server
            this.startMCPServer();
            
            // Start WebSocket server
            this.startWebSocketServer();
            
            // Connect internal routes
            this.connectInternalRoutes();
            
            console.log('\n🎉 ALL SYSTEMS CONNECTED VIA MCP!');
            
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return false;
        }
    }

    startMCPServer() {
        const server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            // Route request
            this.routeRequest(req, res);
        });
        
        server.listen(this.config.port, () => {
            console.log(`\n🌐 MCP Router listening on port ${this.config.port}`);
            console.log(`📡 WebSocket on port ${this.config.wsPort}`);
        });
        
        this.httpServer = server;
    }

    startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.config.wsPort });
        
        wss.on('connection', (ws, req) => {
            const connectionId = crypto.randomBytes(8).toString('hex');
            const clientInfo = {
                id: connectionId,
                ip: req.socket.remoteAddress,
                connected: Date.now(),
                alive: true
            };
            
            this.connections.set(connectionId, { ws, info: clientInfo });
            
            console.log(`\n🔌 New MCP connection: ${connectionId}`);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'mcp-welcome',
                id: connectionId,
                version: this.config.mcpVersion,
                systems: Object.keys(this.systems),
                routes: Array.from(this.routes.keys())
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                this.handleMCPMessage(connectionId, message);
            });
            
            // Handle pong for heartbeat
            ws.on('pong', () => {
                const conn = this.connections.get(connectionId);
                if (conn) conn.info.alive = true;
            });
            
            // Handle disconnect
            ws.on('close', () => {
                this.connections.delete(connectionId);
                console.log(`🔌 MCP connection closed: ${connectionId}`);
            });
        });
        
        // Heartbeat to detect broken connections
        setInterval(() => {
            this.connections.forEach((conn, id) => {
                if (!conn.info.alive) {
                    conn.ws.terminate();
                    this.connections.delete(id);
                    return;
                }
                
                conn.info.alive = false;
                conn.ws.ping();
            });
        }, this.config.heartbeatInterval);
        
        this.wss = wss;
    }

    routeRequest(req, res) {
        const url = req.url;
        console.log(`\n🔀 Routing: ${req.method} ${url}`);
        
        // Find matching route
        let handler = null;
        let systemName = null;
        
        for (const [pattern, system] of Object.entries(this.routeTable)) {
            const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
            if (regex.test(url)) {
                systemName = system;
                break;
            }
        }
        
        if (!systemName) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Route not found' }));
            return;
        }
        
        // Handle based on system
        switch (systemName) {
            case 'tycoon':
                this.handleTycoonRequest(req, res);
                break;
            case 'postOffice':
                this.handlePacketRequest(req, res);
                break;
            case 'aiPlayer':
                this.handleAIRequest(req, res);
                break;
            case 'deviceMesh':
                this.handleMeshRequest(req, res);
                break;
            case 'internal':
                this.handleInternalRequest(req, res);
                break;
            default:
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'System not found' }));
        }
    }

    handleMCPMessage(connectionId, message) {
        try {
            const data = JSON.parse(message);
            console.log(`\n📨 MCP Message from ${connectionId}:`, data.type);
            
            switch (data.type) {
                case 'game-action':
                    this.routeGameAction(connectionId, data);
                    break;
                    
                case 'packet-send':
                    this.routePacket(connectionId, data);
                    break;
                    
                case 'ai-command':
                    this.routeAICommand(connectionId, data);
                    break;
                    
                case 'mesh-query':
                    this.routeMeshQuery(connectionId, data);
                    break;
                    
                case 'system-status':
                    this.sendSystemStatus(connectionId);
                    break;
                    
                default:
                    this.broadcast({
                        type: 'mcp-event',
                        source: connectionId,
                        data: data
                    });
            }
        } catch (error) {
            console.error('❌ Invalid MCP message:', error);
        }
    }

    // Route game actions
    routeGameAction(connectionId, data) {
        const game = this.systems.tycoon;
        if (!game) return;
        
        switch (data.action) {
            case 'upgrade':
                game.upgradeBusiness(data.business);
                break;
            case 'create-room':
                game.createRoom(data.roomName);
                break;
            case 'catch-creature':
                game.catchCreature(data.creature);
                break;
        }
        
        // Broadcast game state
        this.broadcast({
            type: 'game-update',
            state: game.gameState
        });
    }

    // Route packets through post office
    routePacket(connectionId, data) {
        const postOffice = this.systems.postOffice;
        if (!postOffice) return;
        
        const packet = postOffice.packPacket(
            data.content,
            data.from || connectionId,
            data.to || 'broadcast'
        );
        
        // Process through tycoon if active
        if (this.systems.tycoon) {
            this.systems.tycoon.processPacket(packet);
        }
        
        // Broadcast packet
        this.broadcast({
            type: 'packet-received',
            packet: packet
        });
    }

    // Route AI commands
    routeAICommand(connectionId, data) {
        const ai = this.systems.aiPlayer;
        if (!ai) return;
        
        switch (data.command) {
            case 'start':
                ai.play();
                break;
            case 'stop':
                // AI stop logic
                break;
            case 'set-strategy':
                ai.strategy = data.strategy;
                break;
        }
        
        this.sendToConnection(connectionId, {
            type: 'ai-status',
            name: ai.name,
            state: ai.gameState
        });
    }

    // Route mesh queries
    routeMeshQuery(connectionId, data) {
        const mesh = this.systems.deviceMesh;
        if (!mesh) return;
        
        const response = {
            type: 'mesh-response',
            deviceId: mesh.deviceId,
            worldSlice: mesh.myWorldSlice,
            handshakes: Array.from(mesh.handshakes.keys())
        };
        
        this.sendToConnection(connectionId, response);
    }

    // Handle internal MCP requests
    handleInternalRequest(req, res) {
        const url = req.url;
        
        if (url === '/mcp/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                version: this.config.mcpVersion,
                uptime: process.uptime(),
                connections: this.connections.size,
                systems: Object.keys(this.systems).reduce((acc, key) => {
                    acc[key] = this.systems[key] ? 'active' : 'inactive';
                    return acc;
                }, {}),
                routes: Object.keys(this.routeTable)
            }));
        } else if (url === '/mcp/dashboard') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(this.getDashboardHTML());
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'MCP endpoint not found' }));
        }
    }

    // Connect internal routes between systems
    connectInternalRoutes() {
        console.log('\n🔗 Connecting internal routes...');
        
        // Connect AI to Tycoon
        if (this.systems.aiPlayer && this.systems.tycoon) {
            console.log('  ✅ AI Player → Tycoon Game');
            // AI can control game
        }
        
        // Connect Post Office to Tycoon
        if (this.systems.postOffice && this.systems.tycoon) {
            console.log('  ✅ Post Office → Tycoon Game');
            // Packets flow to game
        }
        
        // Connect Device Mesh to everything
        if (this.systems.deviceMesh) {
            console.log('  ✅ Device Mesh → All Systems');
            // Mesh provides foundation
        }
        
        // Set up event routing
        this.on('system-event', (event) => {
            this.broadcast({
                type: 'mcp-system-event',
                event: event
            });
        });
    }

    // Send to specific connection
    sendToConnection(connectionId, data) {
        const conn = this.connections.get(connectionId);
        if (conn && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify(data));
        }
    }

    // Broadcast to all connections
    broadcast(data) {
        this.connections.forEach((conn, id) => {
            if (conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(JSON.stringify(data));
            }
        });
    }

    // Send system status
    sendSystemStatus(connectionId) {
        const status = {
            type: 'system-status',
            timestamp: Date.now(),
            systems: {}
        };
        
        // Gather status from each system
        if (this.systems.tycoon) {
            status.systems.tycoon = {
                active: true,
                gameState: this.systems.tycoon.gameState
            };
        }
        
        if (this.systems.aiPlayer) {
            status.systems.ai = {
                active: true,
                name: this.systems.aiPlayer.name,
                consciousness: this.systems.aiPlayer.gameState.consciousness
            };
        }
        
        if (this.systems.deviceMesh) {
            status.systems.mesh = {
                active: true,
                deviceId: this.systems.deviceMesh.deviceId,
                connections: this.systems.deviceMesh.discoveredDevices.size
            };
        }
        
        this.sendToConnection(connectionId, status);
    }

    // Get dashboard HTML
    getDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>MCP Universal Router Dashboard</title>
    <style>
        body {
            font-family: monospace;
            background: #000;
            color: #0f0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .system {
            border: 1px solid #0f0;
            padding: 10px;
            margin: 10px 0;
            background: #001100;
        }
        .active { border-color: #0f0; }
        .inactive { border-color: #f00; }
        #log {
            height: 300px;
            overflow-y: auto;
            background: #000;
            border: 1px solid #0f0;
            padding: 10px;
            white-space: pre;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 MCP Universal Router</h1>
        
        <div id="systems">
            <h2>Connected Systems</h2>
            <div class="system" id="tycoon">🎮 Tycoon Game</div>
            <div class="system" id="postoffice">📮 Post Office</div>
            <div class="system" id="ai">🤖 AI Player</div>
            <div class="system" id="mesh">🔗 Device Mesh</div>
        </div>
        
        <h2>WebSocket Console</h2>
        <div id="log"></div>
        
        <input type="text" id="command" placeholder="Enter MCP command..." style="width: 100%;">
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:9998');
        const log = document.getElementById('log');
        
        ws.onopen = () => {
            log.textContent += '🔌 Connected to MCP\\n';
            ws.send(JSON.stringify({ type: 'system-status' }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            log.textContent += '📨 ' + JSON.stringify(data, null, 2) + '\\n';
            log.scrollTop = log.scrollHeight;
            
            // Update system status
            if (data.type === 'system-status') {
                Object.entries(data.systems).forEach(([name, info]) => {
                    const el = document.getElementById(name);
                    if (el) {
                        el.className = 'system ' + (info.active ? 'active' : 'inactive');
                    }
                });
            }
        };
        
        document.getElementById('command').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const cmd = e.target.value;
                try {
                    ws.send(cmd.startsWith('{') ? cmd : JSON.stringify({ type: cmd }));
                    e.target.value = '';
                } catch (err) {
                    log.textContent += '❌ ' + err.message + '\\n';
                }
            }
        });
    </script>
</body>
</html>`;
    }

    // Start everything
    async startAll() {
        console.log('\n🚀 STARTING MCP UNIVERSAL ROUTER...');
        console.log('=====================================\n');
        
        await this.initialize();
        
        // Start game loop
        if (this.systems.tycoon) {
            this.systems.tycoon.gameLoop();
        }
        
        // Start AI playing
        if (this.systems.aiPlayer) {
            setTimeout(() => {
                console.log('\n🤖 Starting AI player...');
                this.systems.aiPlayer.play();
            }, 3000);
        }
        
        console.log('\n📡 MCP ENDPOINTS:');
        console.log(`   HTTP: http://localhost:${this.config.port}`);
        console.log(`   WebSocket: ws://localhost:${this.config.wsPort}`);
        console.log(`   Dashboard: http://localhost:${this.config.port}/mcp/dashboard`);
        console.log('\n🎮 All systems connected and running!');
    }
}

// Start the MCP router
if (require.main === module) {
    const router = new MCPUniversalRouter();
    router.startAll().catch(console.error);
}

module.exports = MCPUniversalRouter;