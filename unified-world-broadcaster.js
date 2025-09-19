#!/usr/bin/env node

/**
 * 🌐 UNIFIED WORLD BROADCASTER 🌐
 * Broadcast and interact with ALL discovered worlds
 * Connect everything together with real data
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const WorldDiscoveryEngine = require('./world-discovery-engine');

class UnifiedWorldBroadcaster {
    constructor() {
        this.app = express();
        this.port = 8080; // Main broadcast port
        this.wsPort = 8081; // WebSocket port
        
        // Initialize world discovery
        this.worldEngine = new WorldDiscoveryEngine();
        
        // Data bridges
        this.bridges = {
            gaming: 'http://localhost:7777',
            financial: 'http://localhost:8888', 
            universal: 'http://localhost:9999'
        };
        
        // WebSocket clients by world/layer
        this.worldClients = new Map();
        this.layerClients = new Map();
        
        this.setupExpress();
        this.setupWebSocket();
        this.startBroadcasting();
        
        console.log('🌐 UNIFIED WORLD BROADCASTER INITIALIZED');
        console.log(`📡 Main API: http://localhost:${this.port}`);
        console.log(`🔗 WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Main status
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'operational',
                purpose: 'Unified broadcasting for all worlds and layers',
                totalWorlds: this.worldEngine.getAllWorlds().length,
                activeBridges: Object.keys(this.bridges).length,
                connectedClients: this.getTotalClients(),
                lastUpdate: new Date().toISOString()
            });
        });
        
        // All worlds endpoint
        this.app.get('/api/worlds', (req, res) => {
            res.json({
                worlds: this.worldEngine.getAllWorlds(),
                categories: {
                    worlds: this.worldEngine.worlds.size,
                    engines: this.worldEngine.engines.size,
                    games: this.worldEngine.games.size,
                    interfaces: this.worldEngine.interfaces.size
                },
                broadcastable: this.worldEngine.getBroadcastableWorlds(),
                interactive: this.worldEngine.getInteractiveWorlds()
            });
        });
        
        // Start specific world
        this.app.post('/api/worlds/:worldName/start', async (req, res) => {
            const result = await this.worldEngine.startWorld(req.params.worldName);
            
            if (result.success) {
                this.broadcast('world-started', {
                    world: req.params.worldName,
                    type: result.type,
                    timestamp: new Date()
                });
            }
            
            res.json(result);
        });
        
        // Broadcast to all worlds
        this.app.post('/api/broadcast', (req, res) => {
            const { message, layer, target } = req.body;
            
            this.broadcast('universal-message', {
                message,
                layer,
                target,
                timestamp: new Date(),
                source: 'api'
            });
            
            res.json({ 
                success: true, 
                broadcast: true,
                recipients: this.getTotalClients()
            });
        });
        
        // Get data from all bridges
        this.app.get('/api/unified-data', async (req, res) => {
            const data = await this.getAllBridgeData();
            res.json(data);
        });
        
        // Launch specific interface
        this.app.post('/api/interfaces/:interfaceName/launch', (req, res) => {
            const interfaceName = req.params.interfaceName;
            const interfaceItem = this.worldEngine.interfaces.get(interfaceName);
            
            if (interfaceItem) {
                // Open the interface
                const { spawn } = require('child_process');
                if (interfaceItem.extension === '.html') {
                    spawn('open', [interfaceItem.path]);
                }
                
                this.broadcast('interface-launched', {
                    interface: interfaceName,
                    path: interfaceItem.path,
                    timestamp: new Date()
                });
                
                res.json({ success: true, launched: interfaceName });
            } else {
                res.status(404).json({ error: 'Interface not found' });
            }
        });
        
        this.app.listen(this.port, () => {
            console.log(`✅ Unified World Broadcaster API running on port ${this.port}`);
        });
    }
    
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ port: this.wsPort });
        
        this.wsServer.on('connection', (ws, req) => {
            console.log('📡 New client connected to world broadcaster');
            
            // Parse connection params
            const url = new URL(req.url, `ws://localhost:${this.wsPort}`);
            const layer = url.searchParams.get('layer') || 'general';
            const world = url.searchParams.get('world') || 'default';
            
            // Add to appropriate groups
            this.addClientToLayer(ws, layer);
            this.addClientToWorld(ws, world);
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'welcome',
                layer,
                world,
                totalWorlds: this.worldEngine.getAllWorlds().length,
                availableLayers: ['gaming', 'financial', 'universal', 'general'],
                timestamp: new Date()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(data, ws, layer, world);
                } catch (error) {
                    console.error('Invalid WebSocket message:', error);
                }
            });
            
            ws.on('close', () => {
                this.removeClientFromLayer(ws, layer);
                this.removeClientFromWorld(ws, world);
                console.log('📡 Client disconnected from world broadcaster');
            });
        });
        
        console.log(`🔗 WebSocket server running on port ${this.wsPort}`);
    }
    
    async startBroadcasting() {
        console.log('📡 Starting unified broadcasting...');
        
        // Broadcast world discovery results
        setTimeout(() => {
            this.broadcast('world-discovery-complete', {
                totalWorlds: this.worldEngine.getAllWorlds().length,
                categories: {
                    worlds: this.worldEngine.worlds.size,
                    engines: this.worldEngine.engines.size,
                    games: this.worldEngine.games.size,
                    interfaces: this.worldEngine.interfaces.size
                },
                timestamp: new Date()
            });
        }, 2000);
        
        // Start periodic data updates
        setInterval(async () => {
            const unifiedData = await this.getAllBridgeData();
            this.broadcast('unified-data-update', unifiedData);
        }, 30000); // Every 30 seconds
        
        console.log('📡 Unified broadcasting active');
    }
    
    async getAllBridgeData() {
        const data = { timestamp: new Date() };
        
        // Get data from all bridges
        for (const [name, url] of Object.entries(this.bridges)) {
            try {
                const axios = require('axios');
                let response;
                
                switch (name) {
                    case 'gaming':
                        response = await axios.get(`${url}/api/gaming-data`, { timeout: 3000 });
                        data.gaming = response.data;
                        break;
                    case 'financial':
                        response = await axios.get(`${url}/api/real-economy`, { timeout: 3000 });
                        data.financial = response.data;
                        break;
                    case 'universal':
                        response = await axios.get(`${url}/api/real-data`, { timeout: 3000 });
                        data.universal = response.data;
                        break;
                }
            } catch (error) {
                data[name] = { error: error.message, status: 'offline' };
            }
        }
        
        return data;
    }
    
    addClientToLayer(ws, layer) {
        if (!this.layerClients.has(layer)) {
            this.layerClients.set(layer, new Set());
        }
        this.layerClients.get(layer).add(ws);
    }
    
    removeClientFromLayer(ws, layer) {
        if (this.layerClients.has(layer)) {
            this.layerClients.get(layer).delete(ws);
        }
    }
    
    addClientToWorld(ws, world) {
        if (!this.worldClients.has(world)) {
            this.worldClients.set(world, new Set());
        }
        this.worldClients.get(world).add(ws);
    }
    
    removeClientFromWorld(ws, world) {
        if (this.worldClients.has(world)) {
            this.worldClients.get(world).delete(ws);
        }
    }
    
    getTotalClients() {
        let total = 0;
        this.layerClients.forEach(clients => total += clients.size);
        return total;
    }
    
    broadcast(type, data, targetLayer = null, targetWorld = null) {
        const message = JSON.stringify({ type, data, timestamp: new Date() });
        
        if (targetLayer) {
            // Broadcast to specific layer
            const clients = this.layerClients.get(targetLayer);
            if (clients) {
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            }
        } else if (targetWorld) {
            // Broadcast to specific world
            const clients = this.worldClients.get(targetWorld);
            if (clients) {
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            }
        } else {
            // Broadcast to all
            this.layerClients.forEach(clients => {
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            });
        }
    }
    
    handleClientMessage(data, ws, layer, world) {
        switch (data.type) {
            case 'request-worlds':
                ws.send(JSON.stringify({
                    type: 'worlds-response',
                    worlds: this.worldEngine.getAllWorlds(),
                    timestamp: new Date()
                }));
                break;
                
            case 'start-world':
                this.worldEngine.startWorld(data.worldName).then(result => {
                    ws.send(JSON.stringify({
                        type: 'world-start-result',
                        result,
                        worldName: data.worldName,
                        timestamp: new Date()
                    }));
                });
                break;
                
            case 'broadcast-message':
                this.broadcast('client-message', {
                    message: data.message,
                    source: { layer, world },
                    timestamp: new Date()
                }, data.targetLayer, data.targetWorld);
                break;
                
            case 'request-unified-data':
                this.getAllBridgeData().then(unifiedData => {
                    ws.send(JSON.stringify({
                        type: 'unified-data-response',
                        data: unifiedData,
                        timestamp: new Date()
                    }));
                });
                break;
                
            default:
                console.log('Unknown client message type:', data.type);
        }
    }
}

// Start the unified broadcaster
if (require.main === module) {
    console.log(`\n🌐 UNIFIED WORLD BROADCASTER 🌐`);
    console.log(`================================\n`);
    console.log(`Connecting ALL discovered worlds:`);
    console.log(`📍 ${67} Worlds`);
    console.log(`⚙️ ${175} Engines`); 
    console.log(`🎮 ${223} Games`);
    console.log(`🖥️ ${111} Interfaces`);
    console.log(`\nBridge Connections:`);
    console.log(`🎮 Gaming Layer: http://localhost:7777`);
    console.log(`💰 Financial Layer: http://localhost:8888`);
    console.log(`🌐 Universal Data: http://localhost:9999`);
    console.log(`\nMaking everything broadcastable and interactive!\n`);
    
    const broadcaster = new UnifiedWorldBroadcaster();
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Unified World Broadcaster...');
        process.exit(0);
    });
}

module.exports = UnifiedWorldBroadcaster;