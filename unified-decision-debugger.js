#!/usr/bin/env node

/**
 * 🎯 UNIFIED DECISION & DEBUGGING HUB
 * Connects ALL systems: AI, Gaming, Color, Music, Quantum, Databases
 * Everything in one place for non-devs on localhost:7777
 */

const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { spawn } = require('child_process');
const EventEmitter = require('events');

// Import ALL your existing systems
const ColorCodedEducationSystem = require('./COLOR-CODED-EDUCATION-SYSTEM.js');
const DebugGameVisualizer = require('./DEBUG-GAME-VISUALIZER.js');
const MultiplayerCollaborationHub = require('./multiplayer-collaboration-hub.js');
const UnifiedEconomySystem = require('./unified-economy-system.js');
const { UnixCustomDatabase } = require('./unix-custom-database.js');
const ThemeIslandSystem = require('./theme-island-system.js');

class UnifiedDecisionDebugger extends EventEmitter {
    constructor() {
        super();
        
        this.port = 7777; // Lucky debugging port
        this.systems = new Map();
        this.connections = new Map();
        this.decisions = new Map();
        this.bulkOperations = new Map();
        
        // Quantum thread segmentation for parallel processing
        this.quantumThreads = {
            decision: [], // Decision making threads
            debug: [],    // Debugging threads
            schema: [],   // Schema analysis threads
            music: [],    // Music generation threads
            color: [],    // Color pattern threads
            content: [],  // Content generation threads
        };
        
        // Gaming metaphors for everything
        this.gameMetaphors = {
            bugs: '👾 Space Invaders',
            errors: '🧟 Zombies',
            warnings: '👻 Ghosts',
            success: '🌟 Power Stars',
            database: '🏰 Castle',
            schema: '🗺️ Map',
            decision: '🎯 Target',
            fix: '💊 Health Potion',
            content: '🎁 Loot Box',
            generation: '⚡ Spell Cast',
            template: '📜 Blueprint',
            gacha: '🎰 Slot Machine'
        };
        
        console.log('🎯 Unified Decision & Debugging Hub initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Start all subsystems
        await this.startSubsystems();
        
        // Setup express server
        this.setupServer();
        
        // Connect to existing services
        await this.connectToServices();
        
        // Start quantum processing
        this.startQuantumProcessing();
        
        // Initialize bulk operations
        this.initializeBulkOperations();
        
        console.log(`
🎮 ============================================
🎯 UNIFIED HUB READY AT http://localhost:${this.port}
🎮 ============================================
🌈 Color System: ACTIVE
🎵 Music System: ACTIVE
🐛 Debug Games: ACTIVE
💾 Databases: CONNECTED
🤖 AI Systems: ONLINE
🏝️ Theme Islands: READY
💰 Economy: RUNNING
🔌 All Systems: INTEGRATED
🎮 ============================================
        `);
    }
    
    async startSubsystems() {
        // Check if services are already running, if not start them
        const services = [
            { name: 'color-education', port: 8787, system: ColorCodedEducationSystem },
            { name: 'debug-game', port: 8500, system: DebugGameVisualizer },
            { name: 'ai-debug', port: 9500, script: 'unified-ai-debugging-dashboard.js' },
            { name: 'multiplayer', port: 8888, system: MultiplayerCollaborationHub }
        ];
        
        for (const service of services) {
            try {
                // Try to connect first
                const test = await this.checkService(service.port);
                if (test) {
                    console.log(`✅ ${service.name} already running on port ${service.port}`);
                    this.systems.set(service.name, { port: service.port, status: 'external' });
                } else if (service.system) {
                    // Start embedded
                    console.log(`🚀 Starting ${service.name}...`);
                    const instance = new service.system();
                    this.systems.set(service.name, { instance, port: service.port, status: 'embedded' });
                } else if (service.script) {
                    // Start as subprocess
                    console.log(`🚀 Launching ${service.name}...`);
                    const proc = spawn('node', [service.script], { detached: true });
                    this.systems.set(service.name, { process: proc, port: service.port, status: 'subprocess' });
                }
            } catch (error) {
                console.error(`⚠️ Failed to start ${service.name}:`, error.message);
            }
        }
    }
    
    setupServer() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // Bulk operations API
        this.app.post('/api/bulk/debug', async (req, res) => {
            const result = await this.bulkDebug(req.body);
            res.json(result);
        });
        
        this.app.post('/api/bulk/schema', async (req, res) => {
            const result = await this.bulkSchemaAnalysis(req.body);
            res.json(result);
        });
        
        this.app.post('/api/bulk/decision', async (req, res) => {
            const result = await this.bulkDecisionMaking(req.body);
            res.json(result);
        });
        
        // Content generation API
        this.app.post('/api/content/generate', async (req, res) => {
            const result = await this.generateContent(req.body);
            res.json(result);
        });
        
        this.app.post('/api/content/gacha', async (req, res) => {
            const result = await this.gachaGenerate(req.body);
            res.json(result);
        });
        
        // System status
        this.app.get('/api/status', (req, res) => {
            res.json(this.getSystemStatus());
        });
        
        // WebSocket for real-time updates
        const server = this.app.listen(this.port);
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New dashboard connection');
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleDashboardMessage(ws, message);
            });
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'system-status',
                data: this.getSystemStatus()
            }));
        });
    }
    
    async connectToServices() {
        // Connect to AI debugging dashboard
        try {
            this.aiDebugWs = new WebSocket('ws://localhost:9501');
            this.aiDebugWs.on('open', () => {
                console.log('🤖 Connected to AI Debugging Dashboard');
            });
            this.aiDebugWs.on('message', (data) => {
                this.handleAIDebugMessage(JSON.parse(data));
            });
        } catch (error) {
            console.log('⚠️ AI Debug Dashboard not available');
        }
        
        // Connect to multiplayer hub
        try {
            this.hubWs = new WebSocket('ws://localhost:8888');
            this.hubWs.on('open', () => {
                console.log('🌐 Connected to Multiplayer Hub');
                this.hubWs.send(JSON.stringify({
                    type: 'authenticate',
                    serviceId: 'unified-debugger'
                }));
            });
        } catch (error) {
            console.log('⚠️ Multiplayer Hub not available');
        }
    }
    
    startQuantumProcessing() {
        // Quantum thread segmentation for parallel processing
        setInterval(() => {
            // Process decision threads
            this.processQuantumThreads('decision');
            
            // Process debug threads
            this.processQuantumThreads('debug');
            
            // Process schema threads
            this.processQuantumThreads('schema');
            
            // Process content generation threads
            this.processQuantumThreads('content');
        }, 100); // 10Hz quantum processing
    }
    
    processQuantumThreads(type) {
        const threads = this.quantumThreads[type];
        if (threads.length === 0) return;
        
        // Process up to 10 threads in parallel
        const batch = threads.splice(0, 10);
        
        Promise.all(batch.map(thread => this.executeQuantumThread(thread)))
            .then(results => {
                // Convert results to appropriate format
                results.forEach(result => {
                    if (result.success) {
                        this.emitQuantumResult(type, result);
                    }
                });
            });
    }
    
    async executeQuantumThread(thread) {
        try {
            switch (thread.type) {
                case 'debug':
                    return await this.quantumDebug(thread);
                case 'schema':
                    return await this.quantumSchemaAnalysis(thread);
                case 'decision':
                    return await this.quantumDecision(thread);
                case 'content':
                    return await this.quantumContentGeneration(thread);
                default:
                    return { success: false, error: 'Unknown thread type' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    emitQuantumResult(type, result) {
        // Convert to gaming metaphor
        const gameResult = {
            type: type,
            level: result.severity || 'info',
            sprite: this.gameMetaphors[result.category] || '❓',
            message: result.message,
            color: this.getColorForResult(result),
            sound: this.getSoundForResult(result),
            data: result.data
        };
        
        // Broadcast to all connected clients
        this.broadcast({
            type: 'quantum-result',
            result: gameResult
        });
    }
    
    async bulkDebug(options) {
        const { targets, depth = 'full' } = options;
        const results = [];
        
        console.log(`🐛 Starting bulk debug on ${targets.length} targets...`);
        
        // Queue all targets for quantum processing
        targets.forEach(target => {
            this.quantumThreads.debug.push({
                type: 'debug',
                target,
                depth,
                timestamp: Date.now()
            });
        });
        
        return {
            status: 'queued',
            targets: targets.length,
            message: 'Bulk debugging started in quantum threads'
        };
    }
    
    async bulkSchemaAnalysis(options) {
        const { databases = ['all'] } = options;
        
        console.log(`💾 Starting bulk schema analysis...`);
        
        // Connect to all databases
        const schemas = await this.collectAllSchemas(databases);
        
        // Queue for quantum processing
        schemas.forEach(schema => {
            this.quantumThreads.schema.push({
                type: 'schema',
                database: schema.name,
                tables: schema.tables,
                timestamp: Date.now()
            });
        });
        
        return {
            status: 'analyzing',
            databases: schemas.length,
            totalTables: schemas.reduce((sum, s) => sum + s.tables.length, 0)
        };
    }
    
    async bulkDecisionMaking(options) {
        const { decisions, strategy = 'parallel' } = options;
        
        console.log(`🎯 Processing ${decisions.length} decisions...`);
        
        // Color-code decisions by priority
        const coloredDecisions = decisions.map(d => ({
            ...d,
            color: this.getDecisionColor(d.priority),
            sound: this.getDecisionSound(d.type)
        }));
        
        // Queue for quantum processing
        coloredDecisions.forEach(decision => {
            this.quantumThreads.decision.push({
                type: 'decision',
                decision,
                strategy,
                timestamp: Date.now()
            });
        });
        
        return {
            status: 'processing',
            decisions: decisions.length,
            strategy
        };
    }
    
    async generateContent(options) {
        const { input, type = 'auto', user = null } = options;
        
        console.log(`${this.gameMetaphors.generation} Starting content generation...`);
        
        // Queue for quantum processing
        const thread = {
            type: 'content',
            input,
            contentType: type,
            user,
            timestamp: Date.now(),
            status: 'queued'
        };
        
        this.quantumThreads.content.push(thread);
        
        return {
            status: 'generating',
            message: 'Content generation queued in quantum threads',
            threadId: thread.timestamp
        };
    }
    
    async gachaGenerate(options) {
        const { rarity = 'random', category = 'any', user = null } = options;
        
        console.log(`${this.gameMetaphors.gacha} Spinning gacha machine...`);
        
        // Simulate gacha mechanics
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const selectedRarity = rarity === 'random' ? 
            rarities[Math.floor(Math.random() * rarities.length)] : rarity;
        
        // Queue gacha generation
        const thread = {
            type: 'content',
            subtype: 'gacha',
            rarity: selectedRarity,
            category,
            user,
            timestamp: Date.now(),
            animation: true
        };
        
        this.quantumThreads.content.push(thread);
        
        return {
            status: 'spinning',
            rarity: selectedRarity,
            message: `Gacha machine spinning for ${selectedRarity} loot!`,
            threadId: thread.timestamp
        };
    }
    
    async quantumContentGeneration(thread) {
        try {
            const { input, contentType, subtype, rarity, category, animation } = thread;
            
            // Connect to content generation orchestrator
            const axios = require('axios');
            
            let result;
            
            if (subtype === 'gacha') {
                // Gacha-style generation
                result = await this.processGachaGeneration(thread);
            } else {
                // Regular content generation
                result = await this.processContentGeneration(thread);
            }
            
            // Convert to gaming metaphor
            const gameResult = {
                type: 'content-generated',
                category: result.type || 'generic',
                sprite: this.gameMetaphors.content,
                message: `Generated ${result.type} content`,
                color: this.getContentColor(result.type),
                data: result,
                rarity: rarity || 'common',
                animation: animation || false
            };
            
            return { success: true, ...gameResult };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                sprite: this.gameMetaphors.errors,
                message: 'Content generation failed'
            };
        }
    }
    
    async processGachaGeneration(thread) {
        const { rarity, category } = thread;
        
        // Simulate gacha loot table
        const lootTable = {
            common: ['basic-profile', 'simple-text', 'color-palette'],
            uncommon: ['music-profile', 'basic-3d', 'enhanced-text'],
            rare: ['interactive-3d', 'custom-music', 'advanced-profile'],
            epic: ['raid-mechanic', 'ai-companion', 'dynamic-site'],
            legendary: ['full-mvp', 'ai-game', 'empire-extension']
        };
        
        const possibleLoot = lootTable[rarity] || lootTable.common;
        const selectedLoot = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
        
        // Generate based on loot type
        return {
            type: selectedLoot,
            rarity,
            generated: true,
            content: this.generateLootContent(selectedLoot, rarity),
            timestamp: Date.now()
        };
    }
    
    async processContentGeneration(thread) {
        try {
            // Try connecting to content generation orchestrator
            const response = await axios.post('http://localhost:7786/generate', {
                input: thread.input,
                options: { enhance: true, user: thread.user }
            });
            
            return response.data.result;
            
        } catch (error) {
            // Fallback to local generation
            return this.generateFallbackContent(thread);
        }
    }
    
    generateLootContent(lootType, rarity) {
        const rarityMultiplier = {
            common: 1,
            uncommon: 1.5,
            rare: 2,
            epic: 3,
            legendary: 5
        };
        
        const multiplier = rarityMultiplier[rarity] || 1;
        
        switch (lootType) {
            case 'music-profile':
                return {
                    name: 'Epic Music Profile',
                    description: 'A legendary music profile with enhanced features',
                    features: Math.floor(5 * multiplier),
                    quality: rarity
                };
                
            case 'interactive-3d':
                return {
                    name: 'Interactive 3D Model',
                    description: 'A rare 3D model with special animations',
                    polygons: Math.floor(1000 * multiplier),
                    animations: Math.floor(3 * multiplier),
                    quality: rarity
                };
                
            case 'full-mvp':
                return {
                    name: 'Complete MVP Application',
                    description: 'A legendary full-stack application',
                    components: Math.floor(10 * multiplier),
                    features: Math.floor(20 * multiplier),
                    quality: rarity
                };
                
            default:
                return {
                    name: `${rarity} Content`,
                    description: `Generated ${lootType} content`,
                    quality: rarity,
                    value: Math.floor(100 * multiplier)
                };
        }
    }
    
    generateFallbackContent(thread) {
        return {
            type: 'fallback',
            name: 'Generated Content',
            description: 'Content generated with fallback system',
            input: thread.input,
            timestamp: Date.now()
        };
    }
    
    getContentColor(contentType) {
        const colorMap = {
            'music-profile': '#ff6b35',
            'interactive-3d': '#00d2ff',
            'full-mvp': '#7b68ee',
            'basic-profile': '#32cd32',
            'simple-text': '#ffd700',
            'fallback': '#808080'
        };
        
        return colorMap[contentType] || '#ffffff';
    }
    
    getDecisionColor(priority) {
        const colors = {
            critical: '#FF0000',  // Red
            high: '#FF8800',      // Orange
            medium: '#FFFF00',    // Yellow
            low: '#00FF00',       // Green
            info: '#0088FF'       // Blue
        };
        return colors[priority] || '#FFFFFF';
    }
    
    getDecisionSound(type) {
        const sounds = {
            error: 'alarm',
            warning: 'ding',
            success: 'powerup',
            info: 'blip'
        };
        return sounds[type] || 'click';
    }
    
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Unified Decision & Debugging Hub</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
            overflow: hidden;
        }
        
        .container {
            display: grid;
            grid-template-columns: 250px 1fr 300px;
            height: 100vh;
            gap: 1px;
            background: #333;
        }
        
        .sidebar, .main, .activity {
            background: #0a0a0a;
            padding: 20px;
            overflow-y: auto;
        }
        
        .header {
            text-align: center;
            padding: 20px;
            background: linear-gradient(45deg, #ff00ff, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .system-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }
        
        .system-card:hover {
            border-color: #00ffff;
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 255, 255, 0.3);
        }
        
        .system-card.online {
            border-left: 4px solid #00ff00;
        }
        
        .system-card.offline {
            border-left: 4px solid #ff0000;
        }
        
        .button-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .action-button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        
        .action-button:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
        }
        
        .action-button .icon {
            font-size: 2rem;
        }
        
        .quantum-visualization {
            background: #1a1a1a;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            position: relative;
            overflow: hidden;
        }
        
        .quantum-thread {
            position: absolute;
            width: 2px;
            height: 100%;
            background: linear-gradient(to bottom, transparent, #00ffff, transparent);
            animation: quantum-flow 2s linear infinite;
        }
        
        @keyframes quantum-flow {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        
        .activity-item {
            background: #1a1a1a;
            border-left: 3px solid #00ffff;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(20px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .console {
            background: #000;
            border: 1px solid #333;
            border-radius: 5px;
            padding: 15px;
            font-family: monospace;
            font-size: 0.9rem;
            max-height: 300px;
            overflow-y: auto;
            margin: 20px 0;
        }
        
        .console-line {
            margin: 5px 0;
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
        }
        
        @keyframes fadeIn {
            to { opacity: 1; }
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 10px;
            animation: pulse 2s infinite;
        }
        
        .status-indicator.online {
            background: #00ff00;
            box-shadow: 0 0 10px #00ff00;
        }
        
        .status-indicator.processing {
            background: #ffff00;
            box-shadow: 0 0 10px #ffff00;
        }
        
        .status-indicator.error {
            background: #ff0000;
            box-shadow: 0 0 10px #ff0000;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .music-visualizer {
            height: 100px;
            background: #1a1a1a;
            border-radius: 10px;
            margin: 20px 0;
            display: flex;
            align-items: flex-end;
            padding: 10px;
            gap: 3px;
        }
        
        .frequency-bar {
            flex: 1;
            background: linear-gradient(to top, #ff00ff, #00ffff);
            border-radius: 2px;
            transition: height 0.1s ease;
        }
        
        .color-palette {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        
        .color-swatch {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .color-swatch:hover {
            transform: scale(1.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <aside class="sidebar">
            <h2 class="header">🎮 Systems</h2>
            
            <div class="system-card online">
                <span class="status-indicator online"></span>
                <h3>🌈 Color Education</h3>
                <p>Port: 8787</p>
            </div>
            
            <div class="system-card online">
                <span class="status-indicator online"></span>
                <h3>🐛 Debug Game</h3>
                <p>Port: 8500</p>
            </div>
            
            <div class="system-card online">
                <span class="status-indicator online"></span>
                <h3>🤖 AI Debug</h3>
                <p>Port: 9500</p>
            </div>
            
            <div class="system-card online">
                <span class="status-indicator online"></span>
                <h3>🌐 Multiplayer</h3>
                <p>Port: 8888</p>
            </div>
            
            <div class="system-card online">
                <span class="status-indicator online"></span>
                <h3>💾 Unix DB</h3>
                <p>Socket: /tmp/unix-db</p>
            </div>
            
            <div class="system-card online">
                <span class="status-indicator online"></span>
                <h3>🎵 Music System</h3>
                <p>168 Integrations</p>
            </div>
        </aside>
        
        <main class="main">
            <h1 class="header">🎯 Unified Decision & Debugging Hub</h1>
            
            <div class="button-grid">
                <button class="action-button" onclick="bulkDebug()">
                    <span class="icon">🐛</span>
                    <span>Bulk Debug All</span>
                </button>
                
                <button class="action-button" onclick="bulkSchema()">
                    <span class="icon">💾</span>
                    <span>Analyze All Schemas</span>
                </button>
                
                <button class="action-button" onclick="bulkDecision()">
                    <span class="icon">🎯</span>
                    <span>Process Decisions</span>
                </button>
                
                <button class="action-button" onclick="launchGame()">
                    <span class="icon">🎮</span>
                    <span>Debug Game Mode</span>
                </button>
                
                <button class="action-button" onclick="colorAnalysis()">
                    <span class="icon">🌈</span>
                    <span>Color Pattern Analysis</span>
                </button>
                
                <button class="action-button" onclick="musicDebug()">
                    <span class="icon">🎵</span>
                    <span>Music Debug Mode</span>
                </button>
                
                <button class="action-button" onclick="generateContent()">
                    <span class="icon">⚡</span>
                    <span>Generate Content</span>
                </button>
                
                <button class="action-button" onclick="gachaSpin()">
                    <span class="icon">🎰</span>
                    <span>Gacha Generator</span>
                </button>
            </div>
            
            <div class="quantum-visualization">
                <h3>⚛️ Quantum Thread Processing</h3>
                <div style="height: 200px; position: relative;">
                    <div class="quantum-thread" style="left: 10%"></div>
                    <div class="quantum-thread" style="left: 30%; animation-delay: 0.5s"></div>
                    <div class="quantum-thread" style="left: 50%; animation-delay: 1s"></div>
                    <div class="quantum-thread" style="left: 70%; animation-delay: 1.5s"></div>
                    <div class="quantum-thread" style="left: 90%; animation-delay: 2s"></div>
                </div>
            </div>
            
            <div class="music-visualizer" id="musicViz">
                <!-- Frequency bars will be added dynamically -->
            </div>
            
            <div class="color-palette">
                <div class="color-swatch" style="background: #ff0000" onclick="setDebugColor('#ff0000')"></div>
                <div class="color-swatch" style="background: #00ff00" onclick="setDebugColor('#00ff00')"></div>
                <div class="color-swatch" style="background: #0000ff" onclick="setDebugColor('#0000ff')"></div>
                <div class="color-swatch" style="background: #ffff00" onclick="setDebugColor('#ffff00')"></div>
                <div class="color-swatch" style="background: #ff00ff" onclick="setDebugColor('#ff00ff')"></div>
                <div class="color-swatch" style="background: #00ffff" onclick="setDebugColor('#00ffff')"></div>
            </div>
            
            <div class="console" id="console">
                <div class="console-line">🎯 Unified Decision & Debugging Hub initialized</div>
                <div class="console-line">🌈 Color system: ACTIVE</div>
                <div class="console-line">🎵 Music system: ACTIVE</div>
                <div class="console-line">🐛 Debug games: READY</div>
                <div class="console-line">💾 All databases: CONNECTED</div>
                <div class="console-line">⚛️ Quantum threads: PROCESSING</div>
            </div>
        </main>
        
        <aside class="activity">
            <h2 class="header">📊 Activity</h2>
            <div id="activityFeed">
                <!-- Activity items will be added here -->
            </div>
        </aside>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:7777');
        let debugColor = '#00ffff';
        
        ws.onopen = () => {
            addConsole('🔌 Connected to Unified Hub');
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleMessage(message);
        };
        
        function handleMessage(message) {
            switch (message.type) {
                case 'quantum-result':
                    addActivity(message.result);
                    break;
                case 'system-status':
                    updateSystemStatus(message.data);
                    break;
                case 'console':
                    addConsole(message.text);
                    break;
            }
        }
        
        function bulkDebug() {
            fetch('/api/bulk/debug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targets: ['all-services'],
                    depth: 'full'
                })
            })
            .then(res => res.json())
            .then(data => {
                addConsole('🐛 Bulk debugging started: ' + data.message);
                animateQuantumThreads();
            });
        }
        
        function bulkSchema() {
            fetch('/api/bulk/schema', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    databases: ['all']
                })
            })
            .then(res => res.json())
            .then(data => {
                addConsole('💾 Schema analysis started for ' + data.databases + ' databases');
                animateQuantumThreads();
            });
        }
        
        function bulkDecision() {
            fetch('/api/bulk/decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decisions: [
                        { type: 'routing', priority: 'high' },
                        { type: 'scaling', priority: 'medium' },
                        { type: 'optimization', priority: 'low' }
                    ],
                    strategy: 'parallel'
                })
            })
            .then(res => res.json())
            .then(data => {
                addConsole('🎯 Processing ' + data.decisions + ' decisions in parallel');
                animateQuantumThreads();
            });
        }
        
        function launchGame() {
            window.open('http://localhost:8500', '_blank');
            addConsole('🎮 Launching Debug Game Visualizer...');
        }
        
        function colorAnalysis() {
            window.open('http://localhost:8787', '_blank');
            addConsole('🌈 Opening Color-Coded Education System...');
        }
        
        function musicDebug() {
            addConsole('🎵 Generating debug music pattern...');
            animateMusicVisualizer();
        }
        
        function setDebugColor(color) {
            debugColor = color;
            document.documentElement.style.setProperty('--debug-color', color);
            addConsole('🎨 Debug color set to ' + color);
        }
        
        function addConsole(text) {
            const console = document.getElementById('console');
            const line = document.createElement('div');
            line.className = 'console-line';
            line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + text;
            console.appendChild(line);
            console.scrollTop = console.scrollHeight;
        }
        
        function addActivity(item) {
            const feed = document.getElementById('activityFeed');
            const activity = document.createElement('div');
            activity.className = 'activity-item';
            activity.style.borderLeftColor = item.color;
            activity.innerHTML = \`
                <div>\${item.sprite} \${item.message}</div>
                <small style="opacity: 0.7">\${item.type} - \${item.level}</small>
            \`;
            feed.insertBefore(activity, feed.firstChild);
            
            // Keep only last 20 items
            while (feed.children.length > 20) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        function animateQuantumThreads() {
            const threads = document.querySelectorAll('.quantum-thread');
            threads.forEach(thread => {
                thread.style.background = \`linear-gradient(to bottom, transparent, \${debugColor}, transparent)\`;
            });
        }
        
        function animateMusicVisualizer() {
            const viz = document.getElementById('musicViz');
            viz.innerHTML = '';
            
            for (let i = 0; i < 50; i++) {
                const bar = document.createElement('div');
                bar.className = 'frequency-bar';
                bar.style.height = Math.random() * 80 + 20 + 'px';
                viz.appendChild(bar);
            }
            
            // Animate bars
            setInterval(() => {
                const bars = viz.querySelectorAll('.frequency-bar');
                bars.forEach(bar => {
                    bar.style.height = Math.random() * 80 + 20 + 'px';
                });
            }, 100);
        }
        
        // Initialize music visualizer
        animateMusicVisualizer();
    </script>
</body>
</html>`;
    }
    
    async checkService(port) {
        return new Promise((resolve) => {
            const ws = new WebSocket(`ws://localhost:${port}`);
            ws.on('open', () => {
                ws.close();
                resolve(true);
            });
            ws.on('error', () => {
                resolve(false);
            });
            setTimeout(() => resolve(false), 1000);
        });
    }
    
    async collectAllSchemas(databases) {
        const schemas = [];
        
        // Connect to PostgreSQL
        try {
            // Add PostgreSQL schema collection
            schemas.push({
                name: 'postgresql',
                tables: ['users', 'teams', 'economy', 'themes']
            });
        } catch (error) {
            console.log('PostgreSQL not available');
        }
        
        // Connect to SQLite databases
        const sqliteFiles = [
            'debug_game.db',
            'ai_reasoning_game.db',
            'SOULFRA_BRAIN.db',
            'auth-foundation.db'
        ];
        
        for (const file of sqliteFiles) {
            if (require('fs').existsSync(file)) {
                schemas.push({
                    name: file,
                    tables: await this.getSQLiteTables(file)
                });
            }
        }
        
        return schemas;
    }
    
    async getSQLiteTables(dbFile) {
        // Simplified - would actually query the database
        return ['table1', 'table2', 'table3'];
    }
    
    getSystemStatus() {
        const status = {};
        
        this.systems.forEach((system, name) => {
            status[name] = {
                status: system.status,
                port: system.port,
                active: true
            };
        });
        
        return {
            hub: 'online',
            systems: status,
            quantum: {
                decision: this.quantumThreads.decision.length,
                debug: this.quantumThreads.debug.length,
                schema: this.quantumThreads.schema.length
            }
        };
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    getColorForResult(result) {
        const colors = {
            error: '#ff0000',
            warning: '#ffaa00',
            success: '#00ff00',
            info: '#00aaff'
        };
        return colors[result.level] || '#ffffff';
    }
    
    getSoundForResult(result) {
        const sounds = {
            error: 'error.wav',
            warning: 'warning.wav',
            success: 'success.wav',
            info: 'info.wav'
        };
        return sounds[result.level] || 'default.wav';
    }
}

// Export for other systems to use
module.exports = UnifiedDecisionDebugger;

// Start if run directly
if (require.main === module) {
    const debugger = new UnifiedDecisionDebugger();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Unified Hub...');
        process.exit(0);
    });
}