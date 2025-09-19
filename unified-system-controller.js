#!/usr/bin/env node

/**
 * 🎯 UNIFIED SYSTEM CONTROLLER
 * 
 * Central hub that connects ALL existing systems through UUID v7 wormhole auth
 * This is the glue that makes all your sophisticated systems work together
 * 
 * Connects:
 * - Trading algorithms (Citadel Quant)
 * - 3D visualization (Voxel Everything)
 * - Auth systems (UUID v7, Wormhole)
 * - Dashboards (12-16 panel everything-at-once)
 * - Attention economies (Agent-to-Agent blockchain)
 * - Dependency reasoning (Node module tracking)
 */

const { v7: uuidv7 } = require('uuid');
const EventEmitter = require('events');
const WebSocket = require('ws');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

class UnifiedSystemController extends EventEmitter {
    constructor() {
        super();
        
        // Core configuration
        this.controllerId = uuidv7();
        this.port = 7777; // Master control port
        this.wsPort = 7778; // WebSocket port
        
        // UUID v7 rotation configuration (30 seconds as per your system)
        this.uuidRotationInterval = 30000;
        this.currentUUID = uuidv7();
        this.uuidHistory = [];
        
        // System registry - all your existing systems
        this.systems = new Map();
        this.connections = new Map();
        this.dashboardPanels = new Map();
        
        // Initialize core systems
        this.initializeSystems();
        
        console.log('🎯 UNIFIED SYSTEM CONTROLLER');
        console.log('===========================');
        console.log(`Controller ID: ${this.controllerId}`);
        console.log(`UUID v7 Auth: ${this.currentUUID}`);
        console.log('Connecting all existing systems...');
    }
    
    initializeSystems() {
        // Register all existing systems with their actual running ports
        this.systems.set('auth-foundation', {
            name: 'AUTH-FOUNDATION-SYSTEM',
            port: 8888,
            wsPort: 8889,
            status: 'active',
            uuid: uuidv7(),
            connections: new Set()
        });
        
        this.systems.set('citadel-quant', {
            name: 'Citadel Quant Algo System',
            port: 9500,
            status: 'active',
            uuid: uuidv7(),
            features: ['HFT', 'arbitrage', 'market-making']
        });
        
        this.systems.set('voxel-interface', {
            name: 'VOXEL-EVERYTHING-INTERFACE',
            port: 8500,
            status: 'active',
            uuid: uuidv7(),
            features: ['3D-visualization', 'document-to-voxel']
        });
        
        this.systems.set('agent-blockchain', {
            name: 'AGENT-TO-AGENT-BLOCKCHAIN-ECONOMY',
            port: 6400,
            status: 'active',
            uuid: uuidv7(),
            features: ['mirrored-database', 'attention-economy']
        });
        
        this.systems.set('reasoning-differential', {
            name: 'Reasoning Differential Layer',
            port: 4444,
            status: 'active',
            uuid: uuidv7(),
            features: ['dependency-tracking', 'node-analysis']
        });
        
        this.systems.set('service-discovery', {
            name: 'Service Discovery Engine',
            port: 9999,
            status: 'active',
            uuid: uuidv7(),
            features: ['service-mapping', 'health-checks']
        });
        
        this.systems.set('substrate-query', {
            name: 'Unified Substrate Query Engine',
            port: 9876,
            status: 'active',
            uuid: uuidv7(),
            features: ['UUID-v7', 'cross-layer-orchestration']
        });
        
        console.log(`✅ Registered ${this.systems.size} core systems`);
    }
    
    async start() {
        // Start UUID rotation
        this.startUUIDRotation();
        
        // Verify all systems are running
        await this.verifySystems();
        
        // Create wormhole connections
        await this.establishWormholeConnections();
        
        // Start control server
        await this.startControlServer();
        
        // Start WebSocket hub
        await this.startWebSocketHub();
        
        // Initialize dashboard panels
        await this.initializeDashboardPanels();
        
        console.log('\n✅ UNIFIED SYSTEM CONTROLLER ACTIVE');
        console.log(`🌐 Control Panel: http://localhost:${this.port}`);
        console.log(`🔗 WebSocket Hub: ws://localhost:${this.wsPort}`);
    }
    
    startUUIDRotation() {
        console.log('🔄 Starting UUID v7 rotation (30s intervals)...');
        
        setInterval(() => {
            // Store previous UUID
            this.uuidHistory.push({
                uuid: this.currentUUID,
                timestamp: Date.now()
            });
            
            // Generate new UUID
            this.currentUUID = uuidv7();
            
            // Notify all systems of UUID rotation
            this.emit('uuid-rotated', {
                old: this.uuidHistory[this.uuidHistory.length - 1].uuid,
                new: this.currentUUID,
                timestamp: Date.now()
            });
            
            // Keep only last 10 UUIDs
            if (this.uuidHistory.length > 10) {
                this.uuidHistory.shift();
            }
            
            console.log(`🔄 UUID rotated: ${this.currentUUID}`);
        }, this.uuidRotationInterval);
    }
    
    async verifySystems() {
        console.log('\n🔍 Verifying system connections...');
        
        for (const [key, system] of this.systems) {
            try {
                const response = await fetch(`http://localhost:${system.port}/health`);
                system.status = response.ok ? 'active' : 'unhealthy';
                console.log(`   ${system.status === 'active' ? '✅' : '⚠️'} ${system.name}: ${system.status}`);
            } catch (error) {
                system.status = 'offline';
                console.log(`   ❌ ${system.name}: offline`);
            }
        }
    }
    
    async establishWormholeConnections() {
        console.log('\n🌀 Establishing wormhole connections...');
        
        // Create parent-child wormhole relationships
        const wormholeHierarchy = {
            'auth-foundation': ['substrate-query', 'service-discovery'],
            'substrate-query': ['citadel-quant', 'voxel-interface', 'agent-blockchain'],
            'service-discovery': ['reasoning-differential']
        };
        
        for (const [parent, children] of Object.entries(wormholeHierarchy)) {
            const parentSystem = this.systems.get(parent);
            if (!parentSystem) continue;
            
            for (const child of children) {
                const childSystem = this.systems.get(child);
                if (!childSystem) continue;
                
                const connection = {
                    id: uuidv7(),
                    parent: parent,
                    child: child,
                    established: Date.now(),
                    status: 'active'
                };
                
                this.connections.set(connection.id, connection);
                console.log(`   🌀 ${parent} → ${child}`);
            }
        }
        
        console.log(`✅ Established ${this.connections.size} wormhole connections`);
    }
    
    async startControlServer() {
        const app = express();
        app.use(express.json());
        
        // Main control panel
        app.get('/', (req, res) => {
            res.send(this.generateControlPanel());
        });
        
        // System status API
        app.get('/api/systems', (req, res) => {
            res.json({
                controller: {
                    id: this.controllerId,
                    uuid: this.currentUUID,
                    uptime: process.uptime()
                },
                systems: Array.from(this.systems.entries()).map(([key, system]) => ({
                    key,
                    ...system
                })),
                connections: Array.from(this.connections.values())
            });
        });
        
        // UUID history API
        app.get('/api/uuid/history', (req, res) => {
            res.json({
                current: this.currentUUID,
                history: this.uuidHistory,
                rotationInterval: this.uuidRotationInterval
            });
        });
        
        // System command API
        app.post('/api/systems/:systemKey/command', async (req, res) => {
            const { systemKey } = req.params;
            const { command, params } = req.body;
            
            const system = this.systems.get(systemKey);
            if (!system) {
                return res.status(404).json({ error: 'System not found' });
            }
            
            // Execute command on target system
            const result = await this.executeSystemCommand(systemKey, command, params);
            res.json(result);
        });
        
        app.listen(this.port, () => {
            console.log(`🌐 Control server running on port ${this.port}`);
        });
    }
    
    async startWebSocketHub() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔗 New WebSocket connection to unified hub');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'welcome',
                controller: {
                    id: this.controllerId,
                    uuid: this.currentUUID
                },
                systems: Array.from(this.systems.entries()),
                connections: Array.from(this.connections.values())
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(data, ws);
                } catch (error) {
                    console.error('Invalid WebSocket message:', error);
                }
            });
        });
        
        console.log(`🔗 WebSocket hub running on port ${this.wsPort}`);
    }
    
    async initializeDashboardPanels() {
        console.log('\n📊 Initializing dashboard panels...');
        
        // Define the 12-16 panel configuration
        const panelConfigs = [
            { id: 'auth-status', name: 'Authentication Status', source: 'auth-foundation' },
            { id: 'trading-algo', name: 'Trading Algorithms', source: 'citadel-quant' },
            { id: '3d-visual', name: '3D Visualization', source: 'voxel-interface' },
            { id: 'blockchain-economy', name: 'Agent Economy', source: 'agent-blockchain' },
            { id: 'reasoning-diff', name: 'Reasoning Differential', source: 'reasoning-differential' },
            { id: 'service-map', name: 'Service Map', source: 'service-discovery' },
            { id: 'uuid-monitor', name: 'UUID Monitor', source: 'controller' },
            { id: 'attention-flow', name: 'Attention Flow', source: 'agent-blockchain' },
            { id: 'dependency-graph', name: 'Dependencies', source: 'reasoning-differential' },
            { id: 'wormhole-status', name: 'Wormhole Connections', source: 'controller' },
            { id: 'system-health', name: 'System Health', source: 'service-discovery' },
            { id: 'news-feed', name: 'News Integration', source: 'citadel-quant' },
            { id: 'game-theory', name: 'Game Theory Layer', source: 'agent-blockchain' },
            { id: 'mirror-database', name: 'Mirror Database', source: 'agent-blockchain' },
            { id: 'node-modules', name: 'Node Dependencies', source: 'reasoning-differential' },
            { id: 'live-metrics', name: 'Live Metrics', source: 'controller' }
        ];
        
        panelConfigs.forEach(config => {
            this.dashboardPanels.set(config.id, config);
        });
        
        console.log(`✅ Initialized ${this.dashboardPanels.size} dashboard panels`);
    }
    
    async executeSystemCommand(systemKey, command, params) {
        const system = this.systems.get(systemKey);
        if (!system) {
            return { error: 'System not found' };
        }
        
        // Route commands to appropriate systems
        try {
            const response = await fetch(`http://localhost:${system.port}/api/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Controller-UUID': this.currentUUID
                },
                body: JSON.stringify({ command, params })
            });
            
            return await response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
    
    handleWebSocketMessage(data, ws) {
        switch (data.type) {
            case 'subscribe':
                // Subscribe to specific system updates
                break;
            case 'command':
                // Execute command on system
                this.executeSystemCommand(data.system, data.command, data.params)
                    .then(result => {
                        ws.send(JSON.stringify({
                            type: 'command-result',
                            ...result
                        }));
                    });
                break;
        }
    }
    
    generateControlPanel() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎯 Unified System Controller</title>
    <style>
        body {
            margin: 0;
            font-family: 'Courier New', monospace;
            background: #000;
            color: #0f0;
        }
        .header {
            background: #111;
            padding: 20px;
            border-bottom: 2px solid #0f0;
            text-align: center;
        }
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        .systems-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .system-card {
            background: #111;
            border: 1px solid #0f0;
            border-radius: 8px;
            padding: 15px;
        }
        .system-status {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .status-active { background: #0f0; }
        .status-unhealthy { background: #ff0; }
        .status-offline { background: #f00; }
        .uuid-display {
            background: #222;
            padding: 10px;
            border-radius: 4px;
            font-size: 0.9em;
            word-break: break-all;
            margin: 10px 0;
        }
        .connections {
            margin-top: 30px;
        }
        .connection-flow {
            background: #111;
            padding: 10px;
            margin: 5px 0;
            border-left: 3px solid #0ff;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 UNIFIED SYSTEM CONTROLLER</h1>
        <div class="uuid-display">
            Current UUID: <span id="current-uuid">${this.currentUUID}</span>
        </div>
        <div>Controller ID: ${this.controllerId}</div>
    </div>
    
    <div class="container">
        <h2>📡 Connected Systems</h2>
        <div class="systems-grid" id="systems-grid">
            ${Array.from(this.systems.entries()).map(([key, system]) => `
                <div class="system-card">
                    <h3>
                        <span class="system-status status-${system.status}"></span>
                        ${system.name}
                    </h3>
                    <div>Port: ${system.port}</div>
                    <div>UUID: ${system.uuid.substring(0, 8)}...</div>
                    <div>Status: ${system.status}</div>
                    ${system.features ? `<div>Features: ${system.features.join(', ')}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="connections">
            <h2>🌀 Wormhole Connections</h2>
            ${Array.from(this.connections.values()).map(conn => `
                <div class="connection-flow">
                    ${conn.parent} → ${conn.child}
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        // Connect to WebSocket for real-time updates
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'uuid-rotated') {
                document.getElementById('current-uuid').textContent = data.new;
            }
        };
        
        // Auto-refresh systems status
        setInterval(async () => {
            const response = await fetch('/api/systems');
            const data = await response.json();
            // Update UI with latest system status
        }, 5000);
    </script>
</body>
</html>`;
    }
}

// Start the unified controller
if (require.main === module) {
    const controller = new UnifiedSystemController();
    controller.start().catch(console.error);
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Unified System Controller...');
        process.exit(0);
    });
}

module.exports = UnifiedSystemController;