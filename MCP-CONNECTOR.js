#!/usr/bin/env node
// MCP-CONNECTOR.js - Simple MCP connector without port conflicts

const WebSocket = require('ws');
const http = require('http');
const CleanAIPlayer = require('./CLEAN-AI-PLAYER.js');

class MCPConnector {
    constructor() {
        this.port = 6666;
        this.wsPort = 6667;
        this.connections = new Map();
        
        // Simple game state (no complex dependencies)
        this.gameState = {
            player: { gold: 1000, level: 1 },
            resources: { cleanPackets: 0, corruptedPackets: 0 },
            businesses: {
                packet_cleaning: { level: 1, revenue: 100, cost: 50 },
                vampire_slaying: { level: 0, revenue: 200, cost: 100 }
            }
        };
        
        // AI player
        this.ai = new CleanAIPlayer();
        
        console.log('🌐 MCP CONNECTOR INITIALIZED');
        console.log('🔌 Simple connector for all systems');
    }

    start() {
        // HTTP server
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<h1>MCP Connector Active</h1><p>Dashboard: <a href="/dashboard">Open Dashboard</a></p>');
            } else if (req.url === '/dashboard') {
                res.writeHead(302, { 'Location': 'http://localhost:' + this.port + '/MCP-DASHBOARD.html' });
                res.end();
            } else if (req.url === '/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    gameState: this.gameState,
                    ai: { name: this.ai.name, consciousness: this.ai.gameState.consciousness },
                    connections: this.connections.size
                }));
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n📡 MCP HTTP Server: http://localhost:${this.port}`);
        });
        
        // WebSocket server
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            const id = Math.random().toString(36).substr(2, 9);
            this.connections.set(id, ws);
            
            console.log(`\n🔌 New connection: ${id}`);
            
            // Send welcome
            ws.send(JSON.stringify({
                type: 'mcp-welcome',
                id: id,
                version: '1.0',
                systems: ['game', 'ai', 'packets']
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(id, data);
                } catch (e) {
                    console.error('Invalid message:', e);
                }
            });
            
            ws.on('close', () => {
                this.connections.delete(id);
                console.log(`🔌 Disconnected: ${id}`);
            });
        });
        
        console.log(`📡 MCP WebSocket: ws://localhost:${this.wsPort}`);
        
        // Start game simulation
        this.startGameLoop();
        
        // Start AI
        setTimeout(() => {
            console.log('\n🤖 Starting AI player...');
            this.startAI();
        }, 2000);
    }

    handleMessage(id, data) {
        console.log(`📨 Message from ${id}:`, data.type);
        
        switch (data.type) {
            case 'system-status':
                this.sendToConnection(id, {
                    type: 'system-status',
                    gameState: this.gameState,
                    ai: {
                        name: this.ai.name,
                        consciousness: this.ai.gameState.consciousness,
                        gold: this.ai.gameState.gold
                    }
                });
                break;
                
            case 'mcp-command':
                this.handleCommand(data.command);
                break;
        }
    }

    handleCommand(command) {
        console.log(`⚡ Command: ${command}`);
        
        switch (command) {
            case 'start-ai':
                this.ai.play();
                break;
                
            case 'upgrade-random':
                const businesses = Object.keys(this.gameState.businesses);
                const random = businesses[Math.floor(Math.random() * businesses.length)];
                this.upgradeBusiness(random);
                break;
                
            case 'send-packet':
                this.processPacket();
                break;
                
            case 'catch-creature':
                this.ai.catchCreature();
                break;
        }
    }

    startGameLoop() {
        setInterval(() => {
            // Process packet
            this.processPacket();
            
            // Broadcast game state
            this.broadcast({
                type: 'game-update',
                state: this.gameState
            });
        }, 3000);
    }

    startAI() {
        // Simple AI loop
        setInterval(() => {
            // AI thinks
            this.ai.evolveConsciousness();
            
            // AI acts
            if (this.ai.gameState.gold >= 1000) {
                this.ai.makeDecision();
            }
            
            // Broadcast AI status
            this.broadcast({
                type: 'ai-status',
                name: this.ai.name,
                state: this.ai.gameState
            });
        }, 2000);
    }

    processPacket() {
        const isVampire = Math.random() < 0.1;
        
        if (isVampire) {
            this.gameState.resources.corruptedPackets++;
            console.log('🧛 Vampire packet!');
            
            if (this.gameState.businesses.vampire_slaying.level > 0) {
                const reward = this.gameState.businesses.vampire_slaying.revenue;
                this.gameState.player.gold += reward;
            }
        } else {
            this.gameState.resources.cleanPackets++;
            const profit = this.gameState.businesses.packet_cleaning.revenue - 
                          this.gameState.businesses.packet_cleaning.cost;
            this.gameState.player.gold += profit;
        }
        
        // Share gold with AI
        this.ai.gameState.gold = this.gameState.player.gold;
    }

    upgradeBusiness(name) {
        const business = this.gameState.businesses[name];
        if (business) {
            const cost = (business.level + 1) * 1000;
            if (this.gameState.player.gold >= cost) {
                this.gameState.player.gold -= cost;
                business.level++;
                console.log(`⬆️ Upgraded ${name} to level ${business.level}`);
            }
        }
    }

    sendToConnection(id, data) {
        const ws = this.connections.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    broadcast(data) {
        this.connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        });
    }
}

// Start MCP Connector
if (require.main === module) {
    console.log('🚀 STARTING MCP CONNECTOR');
    console.log('========================\n');
    
    const mcp = new MCPConnector();
    mcp.start();
    
    console.log('\n📊 Open dashboard: http://localhost:6666/MCP-DASHBOARD.html');
    console.log('🔌 WebSocket: ws://localhost:6667');
    console.log('\n✅ All systems connected via MCP!');
}

module.exports = MCPConnector;