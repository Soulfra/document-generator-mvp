#!/usr/bin/env node

// 🔥 CONTENT GENERATION PIPELINE
// Generates content → JSONL → XML Broadcast → Live Visualization
// Watch your content flow through the entire system in real-time

const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');

class ContentGenerationPipeline {
    constructor() {
        this.app = express();
        this.port = 5678;
        this.wsPort = 5679;
        
        // Content generation settings
        this.contentTypes = [
            'game_event',
            'player_action', 
            'npc_dialogue',
            'world_update',
            'combat_log',
            'achievement',
            'trade',
            'quest',
            'boss_spawn'
        ];
        
        // JSONL stream
        this.jsonlPath = './content-stream.jsonl';
        this.jsonlStream = null;
        
        // Broadcast channels
        this.broadcastChannels = new Map();
        this.activeGenerators = new Map();
        
        // Live stats
        this.stats = {
            totalGenerated: 0,
            eventsPerSecond: 0,
            broadcastLatency: 0,
            activeViewers: 0
        };
        
        this.setupWebServer();
        this.setupWebSocket();
        this.initializeGenerators();
    }
    
    setupWebServer() {
        this.app.use(express.json());
        
        // Live dashboard
        this.app.get('/', (req, res) => {
            res.send(this.renderLiveDashboard());
        });
        
        // Start content generation
        this.app.post('/api/generate/start', async (req, res) => {
            const { 
                type = 'mixed', 
                rate = 10, // events per second
                duration = 0, // 0 = infinite
                targets = ['jsonl', 'xml', 'websocket']
            } = req.body;
            
            console.log(`🚀 Starting content generation: ${type} @ ${rate}/sec`);
            
            const generatorId = crypto.randomUUID();
            const generator = this.createContentGenerator(type, rate, duration, targets);
            
            this.activeGenerators.set(generatorId, generator);
            
            res.json({
                success: true,
                generatorId,
                type,
                rate,
                duration: duration || 'infinite',
                targets
            });
        });
        
        // Stop generation
        this.app.post('/api/generate/stop/:id', (req, res) => {
            const { id } = req.params;
            
            if (this.activeGenerators.has(id)) {
                const generator = this.activeGenerators.get(id);
                clearInterval(generator.interval);
                this.activeGenerators.delete(id);
                
                console.log(`🛑 Stopped generator: ${id}`);
                res.json({ success: true, stopped: id });
            } else {
                res.status(404).json({ error: 'Generator not found' });
            }
        });
        
        // Get live stats
        this.app.get('/api/stats', (req, res) => {
            res.json({
                ...this.stats,
                activeGenerators: this.activeGenerators.size,
                channels: Array.from(this.broadcastChannels.keys())
            });
        });
        
        // Get JSONL stream
        this.app.get('/api/stream/jsonl', async (req, res) => {
            res.setHeader('Content-Type', 'application/x-ndjson');
            res.setHeader('Transfer-Encoding', 'chunked');
            
            // Stream last 100 lines
            try {
                const content = await fs.readFile(this.jsonlPath, 'utf8');
                const lines = content.split('\n').filter(l => l.trim());
                const recent = lines.slice(-100);
                
                for (const line of recent) {
                    res.write(line + '\n');
                }
                
                res.end();
            } catch (error) {
                res.status(404).json({ error: 'No stream available' });
            }
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('👁️  New viewer connected');
            this.stats.activeViewers++;
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'CONNECTION',
                stats: this.stats,
                message: 'Connected to content generation pipeline'
            }));
            
            ws.on('close', () => {
                this.stats.activeViewers--;
                console.log('👋 Viewer disconnected');
            });
        });
        
        console.log(`🔌 WebSocket server on port ${this.wsPort}`);
    }
    
    createContentGenerator(type, rate, duration, targets) {
        const generator = {
            id: crypto.randomUUID(),
            type,
            rate,
            duration,
            targets,
            startTime: Date.now(),
            eventsGenerated: 0
        };
        
        // Calculate interval based on rate
        const intervalMs = Math.floor(1000 / rate);
        
        generator.interval = setInterval(async () => {
            const content = this.generateContent(type);
            
            // Process through targets
            for (const target of targets) {
                await this.processContent(content, target);
            }
            
            generator.eventsGenerated++;
            this.stats.totalGenerated++;
            
            // Update events per second
            const elapsed = (Date.now() - generator.startTime) / 1000;
            this.stats.eventsPerSecond = generator.eventsGenerated / elapsed;
            
            // Check duration
            if (duration > 0 && elapsed >= duration) {
                clearInterval(generator.interval);
                this.activeGenerators.delete(generator.id);
                console.log(`⏱️  Generator ${generator.id} completed (${duration}s)`);
            }
            
        }, intervalMs);
        
        return generator;
    }
    
    generateContent(type) {
        const timestamp = Date.now();
        const id = crypto.randomUUID();
        
        // Generate different content based on type
        let content;
        
        switch (type) {
            case 'game_event':
                content = this.generateGameEvent();
                break;
            case 'player_action':
                content = this.generatePlayerAction();
                break;
            case 'npc_dialogue':
                content = this.generateNPCDialogue();
                break;
            case 'combat_log':
                content = this.generateCombatLog();
                break;
            case 'mixed':
                // Random type
                const randomType = this.contentTypes[Math.floor(Math.random() * this.contentTypes.length)];
                return this.generateContent(randomType);
            default:
                content = { type: 'generic', data: 'Generic content' };
        }
        
        return {
            id,
            timestamp,
            type,
            ...content
        };
    }
    
    generateGameEvent() {
        const events = [
            { event: 'BOSS_SPAWN', boss: 'Dragon Lord', location: 'Fire Mountain', level: 99 },
            { event: 'TREASURE_FOUND', item: 'Legendary Sword', rarity: 'Epic', value: 50000 },
            { event: 'PORTAL_OPENED', destination: 'Shadow Realm', duration: 300 },
            { event: 'GUILD_WAR', attacker: 'Knights', defender: 'Mages', stakes: 1000000 },
            { event: 'MARKET_CRASH', item: 'Gold Ore', oldPrice: 100, newPrice: 50 }
        ];
        
        return events[Math.floor(Math.random() * events.length)];
    }
    
    generatePlayerAction() {
        const actions = [
            { action: 'ATTACK', target: 'Goblin', damage: Math.floor(Math.random() * 100), critical: Math.random() > 0.8 },
            { action: 'CRAFT', item: 'Iron Sword', materials: ['Iron Bar', 'Wood'], success: true },
            { action: 'TRADE', with: 'Player_' + Math.floor(Math.random() * 1000), gave: 'Gold', received: 'Potion' },
            { action: 'LEVEL_UP', newLevel: Math.floor(Math.random() * 100) + 1, skill: 'Strength' },
            { action: 'QUEST_COMPLETE', quest: 'Dragon Slayer', reward: { xp: 10000, gold: 5000 } }
        ];
        
        const player = `Player_${Math.floor(Math.random() * 10000)}`;
        return { player, ...actions[Math.floor(Math.random() * actions.length)] };
    }
    
    generateNPCDialogue() {
        const dialogues = [
            { npc: 'Wise Sage', text: 'The ancient prophecy speaks of a chosen one...', quest: true },
            { npc: 'Merchant', text: 'Best prices in the kingdom! Come see my wares!', shop: true },
            { npc: 'Guard', text: 'Move along, citizen. Nothing to see here.', hostile: false },
            { npc: 'Mysterious Stranger', text: 'I know what you seek... but it will cost you.', secret: true },
            { npc: 'Tavern Keeper', text: 'Heard any rumors lately? The dragon has been spotted!', rumor: true }
        ];
        
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    generateCombatLog() {
        const attacker = `Player_${Math.floor(Math.random() * 1000)}`;
        const defender = Math.random() > 0.5 ? `Player_${Math.floor(Math.random() * 1000)}` : `NPC_${Math.floor(Math.random() * 100)}`;
        
        return {
            combat: {
                attacker,
                defender,
                damage: Math.floor(Math.random() * 500),
                ability: ['Fireball', 'Sword Strike', 'Arrow Shot', 'Lightning Bolt'][Math.floor(Math.random() * 4)],
                result: Math.random() > 0.1 ? 'HIT' : 'MISS',
                remaining_hp: Math.floor(Math.random() * 1000)
            }
        };
    }
    
    async processContent(content, target) {
        const startTime = Date.now();
        
        switch (target) {
            case 'jsonl':
                await this.writeToJSONL(content);
                break;
            case 'xml':
                await this.broadcastToXML(content);
                break;
            case 'websocket':
                await this.broadcastToWebSocket(content);
                break;
        }
        
        this.stats.broadcastLatency = Date.now() - startTime;
    }
    
    async writeToJSONL(content) {
        if (!this.jsonlStream) {
            this.jsonlStream = createWriteStream(this.jsonlPath, { flags: 'a' });
        }
        
        this.jsonlStream.write(JSON.stringify(content) + '\n');
    }
    
    async broadcastToXML(content) {
        // Send to XML broadcast layer if it's running
        try {
            const response = await fetch('http://localhost:8877/api/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'GENERATED_CONTENT',
                    data: content
                })
            });
            
            if (!response.ok) {
                console.warn('XML broadcast failed:', response.status);
            }
        } catch (error) {
            // XML broadcast not available
        }
    }
    
    async broadcastToWebSocket(content) {
        // Broadcast to all connected clients
        const message = JSON.stringify({
            type: 'CONTENT',
            data: content,
            stats: {
                totalGenerated: this.stats.totalGenerated,
                eventsPerSecond: this.stats.eventsPerSecond.toFixed(2)
            }
        });
        
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    renderLiveDashboard() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Content Generation Pipeline - LIVE</title>
    <style>
        body { 
            background: #0a0a0a; 
            color: #0f0; 
            font-family: 'Courier New', monospace; 
            margin: 0;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #0f0; 
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-box {
            background: #1a1a1a;
            border: 1px solid #0f0;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            color: #00ff88;
        }
        .controls {
            background: #1a1a1a;
            border: 1px solid #0f0;
            padding: 20px;
            margin-bottom: 20px;
        }
        .stream {
            background: #0a0a0a;
            border: 1px solid #0f0;
            padding: 10px;
            height: 400px;
            overflow-y: auto;
            font-size: 0.9em;
            white-space: pre-wrap;
        }
        .event {
            border-bottom: 1px solid #333;
            padding: 5px 0;
            animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        button:hover { background: #00ff88; }
        input, select {
            background: #1a1a1a;
            color: #0f0;
            border: 1px solid #0f0;
            padding: 5px;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔥 CONTENT GENERATION PIPELINE</h1>
        <p>Real-time content generation → JSONL → XML Broadcast → Live Stream</p>
    </div>
    
    <div class="stats">
        <div class="stat-box">
            <div>Total Generated</div>
            <div class="stat-value" id="total">0</div>
        </div>
        <div class="stat-box">
            <div>Events/Second</div>
            <div class="stat-value" id="eps">0</div>
        </div>
        <div class="stat-box">
            <div>Active Generators</div>
            <div class="stat-value" id="generators">0</div>
        </div>
        <div class="stat-box">
            <div>Live Viewers</div>
            <div class="stat-value" id="viewers">0</div>
        </div>
    </div>
    
    <div class="controls">
        <h3>🎮 Generator Controls</h3>
        <div>
            <select id="contentType">
                <option value="mixed">Mixed Content</option>
                <option value="game_event">Game Events</option>
                <option value="player_action">Player Actions</option>
                <option value="npc_dialogue">NPC Dialogue</option>
                <option value="combat_log">Combat Log</option>
            </select>
            
            <label>Rate:</label>
            <input type="number" id="rate" value="10" min="1" max="100" style="width: 50px;"> /sec
            
            <label>Duration:</label>
            <input type="number" id="duration" value="0" min="0" style="width: 50px;"> sec (0=∞)
            
            <button onclick="startGeneration()">🚀 START</button>
            <button onclick="stopAll()" style="background: #ff3333;">🛑 STOP ALL</button>
        </div>
    </div>
    
    <div>
        <h3>📡 Live Content Stream</h3>
        <div class="stream" id="stream">
            Connecting to live stream...
        </div>
    </div>
    
    <script>
        let ws;
        let stats = { total: 0, eps: 0, generators: 0, viewers: 0 };
        let activeGenerators = [];
        
        function connect() {
            ws = new WebSocket('ws://localhost:5679');
            
            ws.onopen = () => {
                console.log('Connected to pipeline');
                document.getElementById('stream').innerHTML = '✅ Connected to live stream\\n';
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'CONTENT') {
                    addEvent(data.data);
                    if (data.stats) {
                        updateStats(data.stats);
                    }
                }
            };
            
            ws.onerror = () => {
                document.getElementById('stream').innerHTML = '❌ Connection error\\n';
            };
            
            ws.onclose = () => {
                document.getElementById('stream').innerHTML = '🔄 Reconnecting...\\n';
                setTimeout(connect, 2000);
            };
        }
        
        function addEvent(event) {
            const stream = document.getElementById('stream');
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.textContent = JSON.stringify(event, null, 2);
            
            stream.appendChild(eventDiv);
            
            // Keep only last 50 events
            if (stream.children.length > 50) {
                stream.removeChild(stream.firstChild);
            }
            
            // Auto-scroll
            stream.scrollTop = stream.scrollHeight;
        }
        
        function updateStats(newStats) {
            stats = { ...stats, ...newStats };
            document.getElementById('total').textContent = stats.totalGenerated || 0;
            document.getElementById('eps').textContent = parseFloat(stats.eventsPerSecond || 0).toFixed(1);
        }
        
        async function fetchStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                stats = data;
                document.getElementById('total').textContent = data.totalGenerated;
                document.getElementById('eps').textContent = data.eventsPerSecond.toFixed(1);
                document.getElementById('generators').textContent = data.activeGenerators;
                document.getElementById('viewers').textContent = data.activeViewers;
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        }
        
        async function startGeneration() {
            const type = document.getElementById('contentType').value;
            const rate = parseInt(document.getElementById('rate').value);
            const duration = parseInt(document.getElementById('duration').value);
            
            try {
                const response = await fetch('/api/generate/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type,
                        rate,
                        duration,
                        targets: ['jsonl', 'xml', 'websocket']
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    activeGenerators.push(result.generatorId);
                    console.log('Started generator:', result.generatorId);
                }
            } catch (error) {
                console.error('Failed to start generation:', error);
            }
        }
        
        async function stopAll() {
            for (const id of activeGenerators) {
                try {
                    await fetch(\`/api/generate/stop/\${id}\`, { method: 'POST' });
                } catch (error) {
                    console.error('Failed to stop generator:', error);
                }
            }
            activeGenerators = [];
        }
        
        // Connect and start monitoring
        connect();
        setInterval(fetchStats, 1000);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                startGeneration();
            } else if (e.key === 'Escape') {
                stopAll();
            }
        });
    </script>
</body>
</html>`;
    }
    
    async initializeGenerators() {
        // Create JSONL file if it doesn't exist
        try {
            await fs.access(this.jsonlPath);
        } catch {
            await fs.writeFile(this.jsonlPath, '');
        }
        
        console.log('🚀 Content Generation Pipeline initialized');
        console.log(`📊 Dashboard: http://localhost:${this.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log(`🔥 Content Generation Pipeline running on port ${this.port}`);
        });
        
        // Start a default generator for demo
        setTimeout(() => {
            this.createContentGenerator('mixed', 2, 0, ['jsonl', 'websocket']);
            console.log('🎯 Demo generator started (2 events/sec)');
        }, 2000);
    }
}

// Start the content generation pipeline
if (require.main === module) {
    const pipeline = new ContentGenerationPipeline();
    pipeline.start().catch(console.error);
}

module.exports = ContentGenerationPipeline;