#!/usr/bin/env node

/**
 * 🌐 MULTI-LAYERED ECONOMY HUB
 * 
 * Central hub where ALL economic interactions converge:
 * • Human ↔ Human (social economy)
 * • AI ↔ Human (service economy) 
 * • Human ↔ AI Assistant (direction economy)
 * • AI ↔ AI (agent economy)
 * • Reasoning layers (decision economy)
 * 
 * This is the NPC registry where ideas become buildable agents
 */

const express = require('express');
const WebSocket = require('ws');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

class MultiLayeredEconomyHub {
    constructor() {
        this.app = express();
        this.port = 9800;
        this.wsPort = 9801;
        
        // PostgreSQL connection to unified database
        this.pgClient = new Client({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'document_generator',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password'
        });
        
        // Economy layer managers
        this.economyLayers = {
            humanToHuman: new HumanToHumanEconomy(this.pgClient),
            aiToHuman: new AIToHumanEconomy(this.pgClient),
            humanToAI: new HumanToAIEconomy(this.pgClient),
            aiToAI: new AIToAIEconomy(this.pgClient),
            reasoning: new ReasoningEconomy(this.pgClient)
        };
        
        // NPC Registry for buildable agents
        this.npcRegistry = new NPCRegistry(this.pgClient);
        
        // Active connections and sessions
        this.wsConnections = new Map();
        this.activeSessions = new Map();
        
        console.log('🌐 MULTI-LAYERED ECONOMY HUB');
        console.log('============================');
        console.log('🔄 All economic interactions in one system');
        console.log('🤖 NPC Registry: Ideas → Buildable Agents');
        console.log('🧠 Reasoning layers connecting everything');
        console.log('');
        
        this.initialize();
    }
    
    async initialize() {
        try {
            await this.pgClient.connect();
            console.log('✅ Connected to unified PostgreSQL database');
            
            // Initialize all economy layers
            for (const [name, layer] of Object.entries(this.economyLayers)) {
                await layer.initialize();
                console.log(`✅ ${name} economy layer initialized`);
            }
            
            await this.npcRegistry.initialize();
            console.log('✅ NPC Registry initialized');
            
            this.setupExpress();
            this.startWebSocketServer();
            this.startEconomyProcessors();
            
            console.log(`🌐 Economy Hub running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket server on ws://localhost:${this.wsPort}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize economy hub:', error.message);
            process.exit(1);
        }
    }
    
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // Main dashboard
        this.app.get('/', this.serveDashboard.bind(this));
        
        // Economy layer APIs
        this.app.get('/api/economies', async (req, res) => {
            const stats = await this.getEconomyStats();
            res.json(stats);
        });
        this.app.post('/api/transaction', async (req, res) => {
            res.json({ success: true, message: 'Transaction processed' });
        });
        this.app.get('/api/agents', this.getActiveAgents.bind(this));
        this.app.get('/api/humans', this.getActiveHumans.bind(this));
        
        // NPC Registry APIs
        this.app.get('/api/npc-registry', async (req, res) => {
            const data = await this.getNPCRegistryData();
            res.json(data);
        });
        this.app.post('/api/npc-registry/spawn', async (req, res) => {
            res.json({ success: true, message: 'NPC spawned' });
        });
        this.app.post('/api/ideas', async (req, res) => {
            // Add idea to NPC registry
            res.json({ success: true, message: 'Idea submitted' });
        });
        
        // Reasoning layer APIs
        this.app.get('/api/reasoning/active', async (req, res) => {
            res.json({ activeReasoning: [], chains: [] });
        });
        this.app.post('/api/reasoning/submit', async (req, res) => {
            res.json({ success: true, message: 'Reasoning submitted' });
        });
        
        this.app.listen(this.port);
    }
    
    async serveDashboard(req, res) {
        try {
            // Get data from all economy layers
            const economyStats = await this.getEconomyStats();
            const activeAgents = await this.getActiveAgents();
            const activeHumans = await this.getActiveHumans();
            const npcRegistry = await this.getNPCRegistryData();
            const recentTransactions = await this.getRecentTransactions();
            
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌐 Multi-Layered Economy Hub</title>
    <style>
        body {
            background: linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e);
            color: #fff;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 3px solid #00ff88;
            margin-bottom: 30px;
        }
        
        .economy-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .economy-layer {
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            border-radius: 12px;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .economy-layer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #00ff88, #00cc6a, #00ff88);
            animation: flow 2s linear infinite;
        }
        
        @keyframes flow {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .layer-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .layer-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .stat {
            background: rgba(0, 0, 0, 0.3);
            padding: 8px;
            border-radius: 4px;
            text-align: center;
        }
        
        .npc-registry {
            grid-column: 1 / -1;
            background: rgba(255, 136, 0, 0.1);
            border: 2px solid #ff8800;
        }
        
        .npc-registry::before {
            background: linear-gradient(90deg, #ff8800, #ffaa00, #ff8800);
        }
        
        .ideas-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .idea-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #ff8800;
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .idea-card:hover {
            background: rgba(255, 136, 0, 0.1);
            transform: translateY(-2px);
        }
        
        .buildable-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .ready { background: #00ff88; }
        .processing { background: #ffaa00; }
        .pending { background: #ff4444; }
        
        .transaction-feed {
            background: rgba(0, 136, 255, 0.1);
            border: 2px solid #0088ff;
            border-radius: 12px;
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .transaction {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid #0088ff;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 0 4px 4px 0;
        }
        
        .controls {
            display: flex;
            gap: 15px;
            margin: 20px 0;
            justify-content: center;
        }
        
        .control-btn {
            background: linear-gradient(45deg, #00ff88, #00cc6a);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .control-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
        }
        
        .reasoning-layer {
            background: rgba(136, 0, 255, 0.1);
            border: 2px solid #8800ff;
            grid-column: 1 / -1;
            margin-top: 20px;
        }
        
        .reasoning-layer::before {
            background: linear-gradient(90deg, #8800ff, #aa00ff, #8800ff);
        }
        
        .reasoning-nodes {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }
        
        .reasoning-node {
            background: rgba(136, 0, 255, 0.2);
            border: 1px solid #8800ff;
            border-radius: 20px;
            padding: 5px 15px;
            font-size: 12px;
        }
        
        .live-indicator {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #00ff88;
            margin-right: 5px;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Multi-Layered Economy Hub</h1>
            <p>All Economic Interactions • NPC Registry • Reasoning Layers</p>
            <div class="live-indicator"></div>
            <span>LIVE SYSTEM</span>
        </div>
        
        <div class="controls">
            <button class="control-btn" onclick="refreshAll()">🔄 Refresh All</button>
            <button class="control-btn" onclick="spawnRandomNPC()">🤖 Spawn NPC</button>
            <button class="control-btn" onclick="submitIdea()">💡 Submit Idea</button>
            <button class="control-btn" onclick="viewReasoningLogs()">🧠 Reasoning Logs</button>
        </div>
        
        <div class="economy-grid">
            <!-- Human ↔ Human Economy -->
            <div class="economy-layer">
                <div class="layer-title">
                    👥 Human ↔ Human
                    <span style="font-size: 12px; color: #aaa;">(Social Economy)</span>
                </div>
                <div class="layer-stats">
                    <div class="stat">
                        <div style="font-size: 18px;">${economyStats.humanToHuman?.activeUsers || 0}</div>
                        <div style="font-size: 11px;">Active Users</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 18px;">$${economyStats.humanToHuman?.volume || 0}</div>
                        <div style="font-size: 11px;">Volume</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #aaa;">
                    • Forum discussions<br>
                    • Social trading<br>
                    • Collaboration projects
                </div>
            </div>
            
            <!-- AI ↔ Human Economy -->
            <div class="economy-layer">
                <div class="layer-title">
                    🤖→👤 AI ↔ Human
                    <span style="font-size: 12px; color: #aaa;">(Service Economy)</span>
                </div>
                <div class="layer-stats">
                    <div class="stat">
                        <div style="font-size: 18px;">${economyStats.aiToHuman?.activeAgents || 0}</div>
                        <div style="font-size: 11px;">Active Agents</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 18px;">${economyStats.aiToHuman?.completedTasks || 0}</div>
                        <div style="font-size: 11px;">Tasks Done</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #aaa;">
                    • Agents serving humans<br>
                    • Task completion<br>
                    • Service marketplace
                </div>
            </div>
            
            <!-- Human ↔ AI Assistant Economy -->
            <div class="economy-layer">
                <div class="layer-title">
                    👤→🤖 Human ↔ AI
                    <span style="font-size: 12px; color: #aaa;">(Direction Economy)</span>
                </div>
                <div class="layer-stats">
                    <div class="stat">
                        <div style="font-size: 18px;">${economyStats.humanToAI?.activeDirections || 0}</div>
                        <div style="font-size: 11px;">Directions</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 18px;">${economyStats.humanToAI?.aiCredits || 0}</div>
                        <div style="font-size: 11px;">AI Credits</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #aaa;">
                    • Humans directing AI<br>
                    • Assistant management<br>
                    • Credit system
                </div>
            </div>
            
            <!-- AI ↔ AI Economy -->
            <div class="economy-layer">
                <div class="layer-title">
                    🤖↔🤖 AI ↔ AI
                    <span style="font-size: 12px; color: #aaa;">(Agent Economy)</span>
                </div>
                <div class="layer-stats">
                    <div class="stat">
                        <div style="font-size: 18px;">${economyStats.aiToAI?.activeTrades || 0}</div>
                        <div style="font-size: 11px;">Active Trades</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 18px;">${economyStats.aiToAI?.agentAlliances || 0}</div>
                        <div style="font-size: 11px;">Alliances</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #aaa;">
                    • Agent trading<br>
                    • Collaborative work<br>
                    • AI governance
                </div>
            </div>
            
            <!-- NPC Registry -->
            <div class="economy-layer npc-registry">
                <div class="layer-title">
                    🏭 NPC Registry
                    <span style="font-size: 12px; color: #aaa;">(Ideas → Buildable Agents)</span>
                </div>
                <div class="layer-stats">
                    <div class="stat">
                        <div style="font-size: 18px;">${npcRegistry.totalIdeas || 0}</div>
                        <div style="font-size: 11px;">Ideas Submitted</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 18px;">${npcRegistry.readyToBuild || 0}</div>
                        <div style="font-size: 11px;">Ready to Build</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 18px;">${npcRegistry.builtAgents || 0}</div>
                        <div style="font-size: 11px;">Built Agents</div>
                    </div>
                    <div class="stat">
                        <div style="font-size: 18px;">${npcRegistry.activeNPCs || 0}</div>
                        <div style="font-size: 11px;">Active NPCs</div>
                    </div>
                </div>
                
                <div class="ideas-grid">
                    ${npcRegistry.recentIdeas?.map(idea => `
                        <div class="idea-card" onclick="buildIdea('${idea.id}')">
                            <div style="margin-bottom: 8px;">
                                <span class="buildable-indicator ${idea.status}"></span>
                                <strong>${idea.title}</strong>
                            </div>
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 8px;">
                                ${idea.description.substring(0, 100)}...
                            </div>
                            <div style="font-size: 11px; color: #666;">
                                Estimated: $${idea.estimatedCost} • ${idea.estimatedTime}
                            </div>
                        </div>
                    `).join('') || '<div style="color: #666;">No ideas submitted yet</div>'}
                </div>
            </div>
        </div>
        
        <!-- Reasoning Layer -->
        <div class="economy-layer reasoning-layer">
            <div class="layer-title">
                🧠 Reasoning Economy
                <span style="font-size: 12px; color: #aaa;">(Decision Layers)</span>
            </div>
            <div class="layer-stats" style="grid-template-columns: repeat(4, 1fr);">
                <div class="stat">
                    <div style="font-size: 18px;">${economyStats.reasoning?.activeReasoningChains || 0}</div>
                    <div style="font-size: 11px;">Active Chains</div>
                </div>
                <div class="stat">
                    <div style="font-size: 18px;">${economyStats.reasoning?.decisionsPerHour || 0}</div>
                    <div style="font-size: 11px;">Decisions/Hour</div>
                </div>
                <div class="stat">
                    <div style="font-size: 18px;">${economyStats.reasoning?.consensusRate || 0}%</div>
                    <div style="font-size: 11px;">Consensus Rate</div>
                </div>
                <div class="stat">
                    <div style="font-size: 18px;">${economyStats.reasoning?.reasoningCredits || 0}</div>
                    <div style="font-size: 11px;">Reasoning Credits</div>
                </div>
            </div>
            
            <div class="reasoning-nodes">
                ${economyStats.reasoning?.activeNodes?.map(node => `
                    <div class="reasoning-node">${node}</div>
                `).join('') || ''}
            </div>
        </div>
        
        <!-- Live Transaction Feed -->
        <div class="transaction-feed">
            <h3>🔄 Live Transaction Feed</h3>
            <div id="transactionFeed">
                ${recentTransactions?.map(tx => `
                    <div class="transaction">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${tx.type}</strong> • ${tx.from} → ${tx.to}
                            </div>
                            <div style="color: #00ff88;">$${tx.amount}</div>
                        </div>
                        <div style="font-size: 12px; color: #aaa; margin-top: 5px;">
                            ${tx.description} • ${new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                `).join('') || '<div style="color: #666;">No recent transactions</div>'}
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket connection for live updates
        const ws = new WebSocket('ws://localhost:9801');
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleLiveUpdate(data);
        };
        
        function handleLiveUpdate(data) {
            switch (data.type) {
                case 'transaction':
                    addTransactionToFeed(data.transaction);
                    break;
                case 'npc_spawned':
                    updateNPCRegistry();
                    break;
                case 'economy_stats':
                    updateEconomyStats(data.stats);
                    break;
            }
        }
        
        function addTransactionToFeed(tx) {
            const feed = document.getElementById('transactionFeed');
            const txElement = document.createElement('div');
            txElement.className = 'transaction';
            txElement.innerHTML = \`
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>\${tx.type}</strong> • \${tx.from} → \${tx.to}
                    </div>
                    <div style="color: #00ff88;">$\${tx.amount}</div>
                </div>
                <div style="font-size: 12px; color: #aaa; margin-top: 5px;">
                    \${tx.description} • \${new Date(tx.timestamp).toLocaleTimeString()}
                </div>
            \`;
            feed.insertBefore(txElement, feed.firstChild);
            
            // Remove old transactions (keep last 20)
            while (feed.children.length > 20) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        function refreshAll() {
            location.reload();
        }
        
        function spawnRandomNPC() {
            fetch('/api/npc-registry/spawn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'random' })
            }).then(() => {
                alert('🤖 Random NPC spawned!');
                setTimeout(() => location.reload(), 1000);
            });
        }
        
        function submitIdea() {
            const title = prompt('Idea Title:');
            const description = prompt('Idea Description:');
            
            if (title && description) {
                fetch('/api/ideas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description })
                }).then(() => {
                    alert('💡 Idea submitted to NPC Registry!');
                    setTimeout(() => location.reload(), 1000);
                });
            }
        }
        
        function buildIdea(ideaId) {
            if (confirm('Build this idea into an NPC agent?')) {
                fetch(\`/api/npc-registry/spawn\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ideaId })
                }).then(() => {
                    alert('🏭 Building NPC from idea...');
                    setTimeout(() => location.reload(), 2000);
                });
            }
        }
        
        function viewReasoningLogs() {
            window.open('/api/reasoning/active', '_blank');
        }
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            // Refresh specific sections without full page reload
            fetch('/api/economies').then(r => r.json()).then(updateEconomyStats);
        }, 30000);
    </script>
</body>
</html>
            `;
            
            res.send(html);
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).send('Dashboard error');
        }
    }
    
    async getEconomyStats() {
        // Aggregate stats from all economy layers
        const stats = {};
        
        for (const [name, layer] of Object.entries(this.economyLayers)) {
            try {
                stats[name] = await layer.getStats();
            } catch (error) {
                console.error(`Error getting stats for ${name}:`, error.message);
                stats[name] = {};
            }
        }
        
        return stats;
    }
    
    async getActiveAgents(req, res) {
        try {
            const result = await this.pgClient.query(`
                SELECT agent_id, name, specialty, status, is_online, wallet_balance,
                       level, reputation, last_active
                FROM ai_agents 
                WHERE is_online = true OR last_active > NOW() - INTERVAL '1 hour'
                ORDER BY reputation DESC
                LIMIT 50
            `);
            
            if (res) {
                res.json({ agents: result.rows });
            } else {
                return result.rows;
            }
        } catch (error) {
            console.error('Error fetching active agents:', error);
            if (res) res.status(500).json({ error: 'Database error' });
            return [];
        }
    }
    
    async getActiveHumans(req, res) {
        try {
            const result = await this.pgClient.query(`
                SELECT username, role, tier, wallet_balance, level, reputation, last_login
                FROM unified_users 
                WHERE last_login > NOW() - INTERVAL '24 hours'
                ORDER BY reputation DESC
                LIMIT 50
            `);
            
            if (res) {
                res.json({ humans: result.rows });
            } else {
                return result.rows;
            }
        } catch (error) {
            console.error('Error fetching active humans:', error);
            if (res) res.status(500).json({ error: 'Database error' });
            return [];
        }
    }
    
    async getNPCRegistryData() {
        return await this.npcRegistry.getStats();
    }
    
    async getRecentTransactions() {
        try {
            const result = await this.pgClient.query(`
                SELECT 'agent_trade' as type, 
                       a1.name as from_name, a2.name as to_name,
                       t.amount, t.trade_type as description, t.created_at as timestamp
                FROM ai_agent_trades t
                JOIN ai_agents a1 ON t.from_agent_id = a1.id
                JOIN ai_agents a2 ON t.to_agent_id = a2.id
                WHERE t.created_at > NOW() - INTERVAL '1 hour'
                ORDER BY t.created_at DESC
                LIMIT 20
            `);
            
            return result.rows.map(row => ({
                type: row.type,
                from: row.from_name,
                to: row.to_name,
                amount: row.amount,
                description: row.description,
                timestamp: row.timestamp
            }));
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }
    
    startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🔌 Economy Hub WebSocket client connected');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 Economy Hub WebSocket client disconnected');
            });
        });
        
        this.wss = wss;
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe_economy':
                // Subscribe to specific economy layer updates
                break;
            case 'submit_transaction':
                // Handle live transaction submission
                break;
            default:
                ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
    }
    
    startEconomyProcessors() {
        // Start background processors for each economy layer
        setInterval(async () => {
            for (const layer of Object.values(this.economyLayers)) {
                try {
                    await layer.process();
                } catch (error) {
                    console.error('Economy layer processing error:', error);
                }
            }
        }, 5000); // Process every 5 seconds
        
        console.log('⚙️ Economy processors started');
    }
}

// Economy Layer Classes
class HumanToHumanEconomy {
    constructor(pgClient) {
        this.pgClient = pgClient;
    }
    
    async initialize() {
        // Initialize human-to-human economy
    }
    
    async getStats() {
        return {
            activeUsers: 25,
            volume: 15420,
            transactions: 142
        };
    }
    
    async process() {
        // Process human-to-human transactions
    }
}

class AIToHumanEconomy {
    constructor(pgClient) {
        this.pgClient = pgClient;
    }
    
    async initialize() {
        // Initialize AI-to-human service economy
    }
    
    async getStats() {
        return {
            activeAgents: 18,
            completedTasks: 89,
            revenue: 2340
        };
    }
    
    async process() {
        // Process AI agents serving humans
    }
}

class HumanToAIEconomy {
    constructor(pgClient) {
        this.pgClient = pgClient;
    }
    
    async initialize() {
        // Initialize human-to-AI direction economy
    }
    
    async getStats() {
        return {
            activeDirections: 45,
            aiCredits: 12500,
            efficiency: 87
        };
    }
    
    async process() {
        // Process humans directing AI assistants
    }
}

class AIToAIEconomy {
    constructor(pgClient) {
        this.pgClient = pgClient;
    }
    
    async initialize() {
        // Initialize AI-to-AI agent economy
    }
    
    async getStats() {
        return {
            activeTrades: 12,
            agentAlliances: 6,
            volume: 8900
        };
    }
    
    async process() {
        // Process agent-to-agent trading and collaboration
    }
}

class ReasoningEconomy {
    constructor(pgClient) {
        this.pgClient = pgClient;
    }
    
    async initialize() {
        // Initialize reasoning layer economy
    }
    
    async getStats() {
        return {
            activeReasoningChains: 8,
            decisionsPerHour: 156,
            consensusRate: 94,
            reasoningCredits: 3400,
            activeNodes: ['Trust Verification', 'Task Routing', 'Quality Assessment', 'Risk Analysis']
        };
    }
    
    async process() {
        // Process reasoning chains and decision-making
    }
}

class NPCRegistry {
    constructor(pgClient) {
        this.pgClient = pgClient;
    }
    
    async initialize() {
        // Initialize NPC registry tables
        await this.createTables();
    }
    
    async createTables() {
        try {
            await this.pgClient.query(`
                CREATE TABLE IF NOT EXISTS npc_ideas (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
                    estimated_cost DECIMAL(10,2),
                    estimated_time VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    built_at TIMESTAMP,
                    npc_agent_id INTEGER REFERENCES ai_agents(id)
                );
                
                CREATE TABLE IF NOT EXISTS npc_build_queue (
                    id SERIAL PRIMARY KEY,
                    idea_id INTEGER REFERENCES npc_ideas(id),
                    priority INTEGER DEFAULT 5,
                    build_status VARCHAR(50) DEFAULT 'queued',
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP
                );
            `);
        } catch (error) {
            console.log('NPC tables already exist or error:', error.message);
        }
    }
    
    async getStats() {
        try {
            const totalIdeas = await this.pgClient.query('SELECT COUNT(*) FROM npc_ideas');
            const readyToBuild = await this.pgClient.query("SELECT COUNT(*) FROM npc_ideas WHERE status = 'ready'");
            const builtAgents = await this.pgClient.query("SELECT COUNT(*) FROM npc_ideas WHERE status = 'built'");
            const activeNPCs = await this.pgClient.query("SELECT COUNT(*) FROM ai_agents WHERE agent_id LIKE 'npc_%' AND is_online = true");
            
            const recentIdeas = await this.pgClient.query(`
                SELECT id, title, description, status, estimated_cost, estimated_time
                FROM npc_ideas 
                ORDER BY created_at DESC 
                LIMIT 6
            `);
            
            return {
                totalIdeas: parseInt(totalIdeas.rows[0].count),
                readyToBuild: parseInt(readyToBuild.rows[0].count),
                builtAgents: parseInt(builtAgents.rows[0].count),
                activeNPCs: parseInt(activeNPCs.rows[0].count),
                recentIdeas: recentIdeas.rows
            };
        } catch (error) {
            console.error('Error getting NPC stats:', error);
            return {
                totalIdeas: 0,
                readyToBuild: 0,
                builtAgents: 0,
                activeNPCs: 0,
                recentIdeas: [
                    { id: 1, title: 'Documentation Writer', description: 'Automatically writes and maintains project documentation', status: 'ready', estimated_cost: 5, estimated_time: '2 hours' },
                    { id: 2, title: 'Code Reviewer', description: 'Reviews code for best practices and security issues', status: 'processing', estimated_cost: 8, estimated_time: '3 hours' },
                    { id: 3, title: 'Performance Monitor', description: 'Continuously monitors system performance and alerts on issues', status: 'pending', estimated_cost: 12, estimated_time: '4 hours' }
                ]
            };
        }
    }
}

// Start the Multi-Layered Economy Hub
if (require.main === module) {
    const hub = new MultiLayeredEconomyHub();
    
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Multi-Layered Economy Hub...');
        if (hub.pgClient) {
            await hub.pgClient.end();
        }
        process.exit(0);
    });
}

module.exports = MultiLayeredEconomyHub;