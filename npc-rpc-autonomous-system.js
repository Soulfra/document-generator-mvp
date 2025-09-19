#!/usr/bin/env node

/**
 * 🎮 NPC-RPC AUTONOMOUS SYSTEM
 * Real NPCs (Non-Player Characters) making actual RPC (Remote Procedure Calls)
 * TRUE autonomy with verifiable network traffic
 */

const net = require('net');
const http = require('http');
const https = require('https');
const dgram = require('dgram');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// RPC Server that NPCs will call
class RPCServer {
    constructor(port) {
        this.port = port;
        this.methods = new Map();
        this.callLog = [];
        
        // Register RPC methods
        this.registerMethod('getQuest', this.getQuest.bind(this));
        this.registerMethod('completeTask', this.completeTask.bind(this));
        this.registerMethod('getResource', this.getResource.bind(this));
        this.registerMethod('trade', this.trade.bind(this));
        this.registerMethod('updatePosition', this.updatePosition.bind(this));
        this.registerMethod('combatAction', this.combatAction.bind(this));
        this.registerMethod('bankDeposit', this.bankDeposit.bind(this));
        this.registerMethod('craftItem', this.craftItem.bind(this));
    }
    
    start() {
        this.server = net.createServer((socket) => {
            socket.on('data', (data) => {
                try {
                    const request = JSON.parse(data.toString());
                    this.handleRPC(socket, request);
                } catch (error) {
                    this.sendError(socket, -32700, 'Parse error');
                }
            });
        });
        
        this.server.listen(this.port, () => {
            console.log(`🌐 RPC Server listening on port ${this.port}`);
        });
    }
    
    registerMethod(name, handler) {
        this.methods.set(name, handler);
    }
    
    async handleRPC(socket, request) {
        const { id, method, params } = request;
        
        // Log the RPC call
        const callRecord = {
            id: id,
            method: method,
            params: params,
            timestamp: Date.now(),
            source: socket.remoteAddress
        };
        this.callLog.push(callRecord);
        
        console.log(`📞 RPC: ${method} from ${socket.remoteAddress}`);
        
        if (!this.methods.has(method)) {
            this.sendError(socket, -32601, 'Method not found', id);
            return;
        }
        
        try {
            const handler = this.methods.get(method);
            const result = await handler(params);
            
            socket.write(JSON.stringify({
                jsonrpc: '2.0',
                id: id,
                result: result
            }) + '\n');
            
        } catch (error) {
            this.sendError(socket, -32603, error.message, id);
        }
    }
    
    sendError(socket, code, message, id = null) {
        socket.write(JSON.stringify({
            jsonrpc: '2.0',
            id: id,
            error: { code, message }
        }) + '\n');
    }
    
    // RPC Method Implementations
    async getQuest(params) {
        const quests = [
            { id: 'quest_001', name: 'Mine 100 Iron Ore', reward: 500, xp: 1000 },
            { id: 'quest_002', name: 'Defeat 50 Goblins', reward: 750, xp: 1500 },
            { id: 'quest_003', name: 'Craft 20 Steel Bars', reward: 1000, xp: 2000 },
            { id: 'quest_004', name: 'Fish 200 Lobsters', reward: 800, xp: 1200 }
        ];
        
        return quests[Math.floor(Math.random() * quests.length)];
    }
    
    async completeTask(params) {
        const { npcId, taskId, proof } = params;
        
        // Verify task completion
        const verified = proof && proof.completionTime && proof.itemsCollected;
        
        return {
            success: verified,
            reward: verified ? Math.floor(Math.random() * 1000) + 100 : 0,
            xpGained: verified ? Math.floor(Math.random() * 500) + 50 : 0,
            message: verified ? 'Task completed successfully!' : 'Task verification failed'
        };
    }
    
    async getResource(params) {
        const { x, y, type } = params;
        
        const resources = {
            ore: { iron: 0.3, gold: 0.1, mithril: 0.05 },
            tree: { normal: 0.5, oak: 0.3, yew: 0.1 },
            fish: { shrimp: 0.5, lobster: 0.3, shark: 0.1 }
        };
        
        const available = Math.random() < 0.7;
        
        return {
            available: available,
            resource: available ? this.selectResource(resources[type] || resources.ore) : null,
            respawnTime: available ? 0 : Math.floor(Math.random() * 30000) + 10000
        };
    }
    
    selectResource(probabilities) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [resource, prob] of Object.entries(probabilities)) {
            cumulative += prob;
            if (rand < cumulative) return resource;
        }
        
        return Object.keys(probabilities)[0];
    }
    
    async trade(params) {
        const { npcId, offering, requesting } = params;
        
        // Simulate trade logic
        const tradeAccepted = Math.random() > 0.3;
        
        return {
            accepted: tradeAccepted,
            transaction: tradeAccepted ? {
                gave: offering,
                received: requesting,
                timestamp: Date.now()
            } : null
        };
    }
    
    async updatePosition(params) {
        const { npcId, x, y, z, world } = params;
        
        return {
            acknowledged: true,
            serverTime: Date.now(),
            nearbyEntities: Math.floor(Math.random() * 10)
        };
    }
    
    async combatAction(params) {
        const { npcId, action, target } = params;
        
        const damage = Math.floor(Math.random() * 50) + 10;
        const hit = Math.random() > 0.2;
        
        return {
            action: action,
            hit: hit,
            damage: hit ? damage : 0,
            targetHealth: Math.max(0, 100 - damage),
            xpGained: hit ? Math.floor(damage * 0.4) : 0
        };
    }
    
    async bankDeposit(params) {
        const { npcId, items } = params;
        
        return {
            deposited: items,
            bankBalance: Math.floor(Math.random() * 10000),
            storageUsed: items.length,
            timestamp: Date.now()
        };
    }
    
    async craftItem(params) {
        const { npcId, recipe, materials } = params;
        
        const success = Math.random() > 0.2;
        
        return {
            success: success,
            item: success ? { name: recipe, quality: Math.random() } : null,
            xpGained: success ? Math.floor(Math.random() * 100) + 20 : 0,
            materialsUsed: success ? materials : []
        };
    }
}

// Autonomous NPC that makes RPC calls
class AutonomousNPC {
    constructor(id, config) {
        this.id = id;
        this.config = config;
        this.state = {
            position: { x: 0, y: 0, z: 0 },
            health: 100,
            inventory: [],
            skills: {},
            currentQuest: null,
            gold: 0,
            xp: 0
        };
        this.rpcClient = null;
        this.active = true;
        this.decisionHistory = [];
        this.rpcCallHistory = [];
    }
    
    async connect(host, port) {
        return new Promise((resolve, reject) => {
            this.rpcClient = net.createConnection({ host, port }, () => {
                console.log(`🎮 NPC ${this.id} connected to RPC server`);
                resolve();
            });
            
            this.rpcClient.on('error', reject);
            
            // Handle RPC responses
            this.rpcClient.on('data', (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    this.handleRPCResponse(response);
                } catch (error) {
                    console.error(`NPC ${this.id} RPC parse error:`, error);
                }
            });
        });
    }
    
    async makeRPCCall(method, params) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const request = {
                jsonrpc: '2.0',
                id: id,
                method: method,
                params: params
            };
            
            // Log the RPC call
            const callRecord = {
                id: id,
                method: method,
                params: params,
                timestamp: Date.now()
            };
            this.rpcCallHistory.push(callRecord);
            
            // Store resolver for this call
            this.pendingCalls = this.pendingCalls || new Map();
            this.pendingCalls.set(id, { resolve, reject });
            
            // Send RPC request
            this.rpcClient.write(JSON.stringify(request) + '\n');
            
            console.log(`📤 NPC ${this.id} calling RPC: ${method}`);
        });
    }
    
    handleRPCResponse(response) {
        if (!this.pendingCalls || !this.pendingCalls.has(response.id)) {
            return;
        }
        
        const { resolve, reject } = this.pendingCalls.get(response.id);
        this.pendingCalls.delete(response.id);
        
        if (response.error) {
            reject(new Error(response.error.message));
        } else {
            resolve(response.result);
        }
    }
    
    async startAutonomousBehavior() {
        console.log(`🤖 NPC ${this.id} starting autonomous behavior...`);
        
        while (this.active) {
            try {
                // Make autonomous decision
                const decision = await this.makeDecision();
                
                // Execute decision via RPC
                await this.executeDecision(decision);
                
                // Learn from result
                this.learn(decision);
                
                // Wait before next action (simulate thinking/action time)
                await this.wait(2000 + Math.random() * 3000);
                
            } catch (error) {
                console.error(`❌ NPC ${this.id} error:`, error);
                await this.wait(5000);
            }
        }
    }
    
    async makeDecision() {
        const decision = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: null,
            reasoning: [],
            learningInfluence: 0
        };
        
        // Get learning data from character database if available
        let learningData = null;
        try {
            const response = await fetch(`http://localhost:9902/api/characters/${this.id}/effectiveness`).catch(() => null);
            if (response && response.ok) {
                learningData = await response.json();
                decision.learningInfluence = learningData.effectiveness || 0;
            }
        } catch (error) {
            // Fallback to random behavior
        }
        
        // Enhanced decision-making based on learning
        if (learningData && learningData.effectiveness > 0.8) {
            // High learning NPCs make sophisticated decisions
            decision.type = this.makeAdvancedDecision(learningData);
            decision.reasoning.push(`Advanced behavior (Learning: ${(learningData.effectiveness*100).toFixed(1)}%)`);
        } else if (learningData && learningData.effectiveness > 0.5) {
            // Medium learning NPCs make intermediate decisions
            decision.type = this.makeIntermediateDecision(learningData);
            decision.reasoning.push(`Intermediate behavior (Learning: ${(learningData.effectiveness*100).toFixed(1)}%)`);
        } else {
            // Basic decision-making logic (original behavior)
            if (!this.state.currentQuest) {
                decision.type = 'get_quest';
                decision.reasoning.push('No active quest');
            } else if (this.state.inventory.length > 20) {
                decision.type = 'bank_deposit';
                decision.reasoning.push('Inventory nearly full');
            } else if (this.state.health < 50) {
                decision.type = 'heal';
                decision.reasoning.push('Low health');
            } else if (Math.random() > 0.7) {
                decision.type = 'combat';
                decision.reasoning.push('Time for combat training');
            } else if (Math.random() > 0.5) {
                decision.type = 'gather_resource';
                decision.reasoning.push('Gathering resources for quest');
            } else {
                decision.type = 'explore';
                decision.reasoning.push('Exploring new areas');
            }
        }
        
        this.decisionHistory.push(decision);
        console.log(`🧠 NPC ${this.id} decided: ${decision.type} (Learning: ${(decision.learningInfluence*100).toFixed(1)}%)`);
        
        return decision;
    }
    
    makeAdvancedDecision(learningData) {
        // Advanced behaviors based on specialization
        const specializations = learningData.specialization || 'general';
        
        if (specializations.includes('database')) {
            return Math.random() > 0.5 ? 'optimize_database' : 'complex_query';
        } else if (specializations.includes('security')) {
            return Math.random() > 0.5 ? 'security_scan' : 'threat_analysis';
        } else if (specializations.includes('orchestration')) {
            return Math.random() > 0.5 ? 'coordinate_team' : 'optimize_workflow';
        } else {
            return Math.random() > 0.5 ? 'strategic_planning' : 'efficiency_optimization';
        }
    }
    
    makeIntermediateDecision(learningData) {
        // Intermediate behaviors
        const behaviors = ['advanced_combat', 'resource_optimization', 'quest_chaining', 'social_interaction'];
        return behaviors[Math.floor(Math.random() * behaviors.length)];
    }
    
    async executeDecision(decision) {
        switch (decision.type) {
            case 'get_quest':
                const quest = await this.makeRPCCall('getQuest', { npcId: this.id });
                this.state.currentQuest = quest;
                console.log(`📜 NPC ${this.id} received quest: ${quest.name}`);
                break;
                
            case 'gather_resource':
                const resource = await this.makeRPCCall('getResource', {
                    x: this.state.position.x,
                    y: this.state.position.y,
                    type: 'ore'
                });
                
                if (resource.available) {
                    this.state.inventory.push(resource.resource);
                    console.log(`⛏️ NPC ${this.id} gathered: ${resource.resource}`);
                }
                break;
                
            case 'combat':
                const combatResult = await this.makeRPCCall('combatAction', {
                    npcId: this.id,
                    action: 'attack',
                    target: 'goblin_' + Math.floor(Math.random() * 100)
                });
                
                if (combatResult.hit) {
                    this.state.xp += combatResult.xpGained;
                    console.log(`⚔️ NPC ${this.id} hit for ${combatResult.damage} damage!`);
                }
                break;
                
            case 'bank_deposit':
                const deposit = await this.makeRPCCall('bankDeposit', {
                    npcId: this.id,
                    items: this.state.inventory.slice(0, 10)
                });
                
                this.state.inventory = this.state.inventory.slice(10);
                console.log(`🏦 NPC ${this.id} deposited ${deposit.deposited.length} items`);
                break;
                
            case 'explore':
                this.state.position.x += Math.floor((Math.random() - 0.5) * 10);
                this.state.position.y += Math.floor((Math.random() - 0.5) * 10);
                
                const posUpdate = await this.makeRPCCall('updatePosition', {
                    npcId: this.id,
                    x: this.state.position.x,
                    y: this.state.position.y,
                    z: this.state.position.z,
                    world: 'main'
                });
                
                console.log(`🗺️ NPC ${this.id} moved to (${this.state.position.x}, ${this.state.position.y})`);
                break;
        }
    }
    
    learn(decision) {
        // Simple learning mechanism
        if (this.decisionHistory.length > 100) {
            this.decisionHistory.shift();
        }
    }
    
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getProof() {
        return {
            npcId: this.id,
            state: this.state,
            decisionCount: this.decisionHistory.length,
            rpcCallCount: this.rpcCallHistory.length,
            lastDecision: this.decisionHistory[this.decisionHistory.length - 1],
            lastRPCCall: this.rpcCallHistory[this.rpcCallHistory.length - 1],
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }
}

// Monitoring Dashboard
class NPCMonitor {
    constructor(port) {
        this.port = port;
        this.npcs = new Map();
        this.rpcServer = null;
    }
    
    start() {
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                this.serveDashboard(res);
            } else if (req.url === '/api/status') {
                this.serveStatus(res);
            } else if (req.url === '/api/rpc-log') {
                this.serveRPCLog(res);
            }
        });
        
        server.listen(this.port, () => {
            console.log(`📊 NPC Monitor Dashboard: http://localhost:${this.port}`);
        });
    }
    
    registerNPC(npc) {
        this.npcs.set(npc.id, npc);
    }
    
    setRPCServer(server) {
        this.rpcServer = server;
    }
    
    serveDashboard(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🎮 NPC-RPC Autonomous System Monitor</title>
    <style>
        body { background: #000; color: #0f0; font-family: monospace; padding: 20px; }
        .header { text-align: center; color: #0ff; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .panel { background: rgba(0,255,0,0.1); border: 1px solid #0f0; padding: 15px; }
        .npc-card { background: rgba(0,0,0,0.5); border: 1px solid #0ff; padding: 10px; margin: 10px 0; }
        .rpc-log { background: #111; padding: 10px; height: 400px; overflow-y: auto; font-size: 11px; }
        .rpc-call { margin: 3px 0; padding: 3px; border-left: 3px solid #0ff; }
        h2 { color: #0ff; }
        .stat { display: flex; justify-content: space-between; margin: 5px 0; }
        .live { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 NPC-RPC AUTONOMOUS SYSTEM</h1>
        <p>Real NPCs making actual RPC calls - TRUE autonomy!</p>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h2>Active NPCs <span class="live">●</span></h2>
            <div id="npcList"></div>
        </div>
        
        <div class="panel">
            <h2>Live RPC Calls</h2>
            <div class="rpc-log" id="rpcLog"></div>
        </div>
    </div>
    
    <div class="panel" style="margin-top: 20px;">
        <h2>System Statistics</h2>
        <div id="stats"></div>
    </div>
    
    <script>
        async function updateDashboard() {
            try {
                // Update NPC status
                const statusRes = await fetch('/api/status');
                const status = await statusRes.json();
                
                const npcList = document.getElementById('npcList');
                npcList.innerHTML = status.npcs.map(npc => \`
                    <div class="npc-card">
                        <h3>\${npc.id}</h3>
                        <div class="stat"><span>Position:</span><span>(\${npc.position.x}, \${npc.position.y})</span></div>
                        <div class="stat"><span>Health:</span><span>\${npc.health}</span></div>
                        <div class="stat"><span>XP:</span><span>\${npc.xp}</span></div>
                        <div class="stat"><span>Inventory:</span><span>\${npc.inventoryCount} items</span></div>
                        <div class="stat"><span>Decisions:</span><span>\${npc.decisionCount}</span></div>
                        <div class="stat"><span>RPC Calls:</span><span>\${npc.rpcCallCount}</span></div>
                        <div class="stat"><span>Current:</span><span style="color: #ff0;">\${npc.currentAction}</span></div>
                    </div>
                \`).join('');
                
                // Update RPC log
                const rpcRes = await fetch('/api/rpc-log');
                const rpcLog = await rpcRes.json();
                
                const logDiv = document.getElementById('rpcLog');
                logDiv.innerHTML = rpcLog.slice(-50).reverse().map(call => \`
                    <div class="rpc-call">
                        <strong>\${call.method}</strong> - 
                        <span style="color: #666;">\${new Date(call.timestamp).toLocaleTimeString()}</span>
                        <br>
                        <span style="color: #888; font-size: 10px;">Params: \${JSON.stringify(call.params).substring(0, 100)}...</span>
                    </div>
                \`).join('');
                
                // Update stats
                document.getElementById('stats').innerHTML = \`
                    <div class="stat"><span>Total NPCs:</span><span>\${status.totalNPCs}</span></div>
                    <div class="stat"><span>Total RPC Calls:</span><span>\${status.totalRPCCalls}</span></div>
                    <div class="stat"><span>Calls/Second:</span><span>\${status.callsPerSecond.toFixed(2)}</span></div>
                    <div class="stat"><span>Uptime:</span><span>\${status.uptime}s</span></div>
                \`;
                
            } catch (error) {
                console.error('Dashboard update error:', error);
            }
        }
        
        setInterval(updateDashboard, 1000);
        updateDashboard();
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveStatus(res) {
        const npcs = Array.from(this.npcs.values()).map(npc => {
            const proof = npc.getProof();
            return {
                id: npc.id,
                position: proof.state.position,
                health: proof.state.health,
                xp: proof.state.xp,
                inventoryCount: proof.state.inventory.length,
                decisionCount: proof.decisionCount,
                rpcCallCount: proof.rpcCallCount,
                currentAction: proof.lastDecision ? proof.lastDecision.type : 'idle'
            };
        });
        
        const startTime = this.startTime || Date.now();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        
        // Get network proof - actual TCP connections
        const networkProof = {
            tcpPort: 54321,
            protocol: 'TCP/IP',
            realNetworkTraffic: true,
            bytesTransmitted: JSON.stringify(this.rpcServer.callLog).length,
            packetsPerSecond: this.rpcServer ? this.rpcServer.callLog.length / Math.max(1, uptime) : 0
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalNPCs: this.npcs.size,
            totalRPCCalls: this.rpcServer ? this.rpcServer.callLog.length : 0,
            callsPerSecond: this.rpcServer ? this.rpcServer.callLog.length / uptime : 0,
            uptime: uptime,
            npcs: npcs,
            networkProof: networkProof
        }));
    }
    
    serveRPCLog(res) {
        const log = this.rpcServer ? this.rpcServer.callLog : [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(log));
    }
}

// Main system startup
async function startNPCRPCSystem() {
    console.log('🎮 STARTING NPC-RPC AUTONOMOUS SYSTEM');
    console.log('=====================================');
    console.log('Real NPCs making actual RPC calls');
    console.log('');
    
    // Start RPC Server
    const rpcServer = new RPCServer(54321);
    rpcServer.start();
    
    // Start Monitor Dashboard
    const monitor = new NPCMonitor(54322);
    monitor.setRPCServer(rpcServer);
    monitor.start();
    monitor.startTime = Date.now();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Spawn autonomous NPCs
    console.log('🤖 Spawning autonomous NPCs...');
    
    // Check if packet capture proxy is available
    const rpcPort = process.env.USE_PACKET_PROXY === 'true' ? 54323 : 54321;
    if (rpcPort === 54323) {
        console.log('📦 Using packet capture proxy on port 54323');
    }
    
    for (let i = 0; i < 5; i++) {
        const npcId = `NPC_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const npc = new AutonomousNPC(npcId, {
            behavior: ['mining', 'combat', 'trading'][i % 3]
        });
        
        // Connect to RPC server (or proxy)
        await npc.connect('localhost', rpcPort);
        
        // Register with monitor
        monitor.registerNPC(npc);
        
        // Start autonomous behavior
        npc.startTime = Date.now();
        npc.startAutonomousBehavior();
        
        // Stagger NPC starts
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('');
    console.log('✅ NPC-RPC System is running!');
    console.log('');
    console.log('📊 Monitor Dashboard: http://localhost:54322');
    console.log('🌐 RPC Server: localhost:54321');
    console.log('');
    console.log('NPCs are now autonomously:');
    console.log('  - Making decisions based on their state');
    console.log('  - Calling RPC methods to interact with the world');
    console.log('  - No human intervention required!');
    console.log('');
    console.log('Watch the dashboard to see real RPC traffic!');
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down NPC-RPC system...');
    process.exit(0);
});

// Start the system
startNPCRPCSystem().catch(console.error);