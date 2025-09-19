#!/usr/bin/env node

/**
 * 🧙‍♂️🌐💰 ARCHETYPAL CONTROL MATRIX
 * ==================================
 * Control system for embodying digital archetypes
 * Wise Old Man, Domain Matrix, Web Master, Money Transfer, Internet, Imagination
 */

const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const crypto = require('crypto');
const http = require('http');

class ArchetypalControlMatrix {
    constructor() {
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        this.matrixDir = path.join(this.vizDir, 'control-matrix');
        
        // Control server
        this.httpServer = null;
        this.httpPort = 8101;
        
        // WebSocket connections
        this.controlWsServer = null;
        this.operatorClients = new Set();
        
        // Archetypal roles
        this.archetypes = {
            'wise-old-man': {
                name: 'The Wise Old Man',
                symbol: '🧙‍♂️',
                domain: 'knowledge',
                powers: ['foresight', 'wisdom', 'guidance', 'prophecy', 'memory'],
                state: {
                    wisdom: 100,
                    patience: 80,
                    crypticLevel: 7,
                    ancientKnowledge: new Map(),
                    activeProverbs: []
                }
            },
            'domain-matrix': {
                name: 'The Domain Matrix',
                symbol: '🌐',
                domain: 'structure',
                powers: ['dns-control', 'routing', 'topology', 'namespace', 'hierarchy'],
                state: {
                    domains: new Map(),
                    connections: new Map(),
                    dnsCache: new Map(),
                    topLevelDomains: ['.com', '.org', '.net', '.io', '.ai'],
                    matrixIntegrity: 100
                }
            },
            'web-master': {
                name: 'The Web Master',
                symbol: '🕸️',
                domain: 'connectivity',
                powers: ['weaving', 'linking', 'crawling', 'indexing', 'spinning'],
                state: {
                    webNodes: new Map(),
                    connections: [],
                    spiderBots: [],
                    pageRank: new Map(),
                    webIntegrity: 100
                }
            },
            'money-transfer': {
                name: 'The Money Transfer',
                symbol: '💰',
                domain: 'value',
                powers: ['transaction', 'valuation', 'exchange', 'liquidity', 'wealth'],
                state: {
                    wallets: new Map(),
                    transactions: [],
                    exchangeRates: new Map(),
                    liquidityPools: new Map(),
                    totalValue: 1000000
                }
            },
            'internet-itself': {
                name: 'The Internet Itself',
                symbol: '🌍',
                domain: 'communication',
                powers: ['packets', 'protocols', 'bandwidth', 'latency', 'omnipresence'],
                state: {
                    nodes: new Map(),
                    packets: [],
                    protocols: ['TCP/IP', 'HTTP', 'WebSocket', 'QUIC'],
                    bandwidth: 1000000,
                    globalReach: 95
                }
            },
            'imagination-engine': {
                name: 'The Imagination Engine',
                symbol: '🌈',
                domain: 'creation',
                powers: ['dream', 'manifest', 'transform', 'inspire', 'transcend'],
                state: {
                    dreams: [],
                    manifestations: new Map(),
                    creativity: 100,
                    possibilitySpace: Infinity,
                    activeVisions: []
                }
            }
        };
        
        // Control state
        this.controlState = {
            activeArchetype: 'wise-old-man',
            controlMode: 'direct', // direct, suggestion, observation
            powerLevel: 100,
            
            // Multi-archetype fusion
            fusionMode: false,
            fusedArchetypes: [],
            
            // Reality manipulation
            realityBending: 0, // 0-100
            causalityOverride: false,
            timeDialation: 1.0,
            
            // Command history
            commandHistory: [],
            prophecies: [],
            manifestations: []
        };
        
        // Command interpreters
        this.commandInterpreters = {
            'wise-old-man': this.interpretWisdom.bind(this),
            'domain-matrix': this.interpretDomain.bind(this),
            'web-master': this.interpretWeb.bind(this),
            'money-transfer': this.interpretMoney.bind(this),
            'internet-itself': this.interpretInternet.bind(this),
            'imagination-engine': this.interpretImagination.bind(this)
        };
        
        // Reality effects
        this.realityEffects = {
            ripples: [],
            distortions: [],
            portals: [],
            timeStreams: [],
            thoughtForms: []
        };
        
        this.logger = require('./reasoning-logger');
        this.init();
    }
    
    async init() {
        await this.setupMatrixDirectories();
        await this.createControlInterface();
        await this.startControlServer();
        await this.connectToAllSystems();
        await this.initializeArchetypes();
        
        console.log('🧙‍♂️🌐💰 ARCHETYPAL CONTROL MATRIX ONLINE');
        console.log('=========================================');
        console.log(`🎮 Control Interface: http://localhost:${this.httpPort}`);
        console.log('🧙‍♂️ Wise Old Man ready for guidance');
        console.log('🌐 Domain Matrix awaiting commands');
        console.log('🕸️ Web Master weaving reality');
        console.log('💰 Money Transfer flows active');
        console.log('🌍 Internet Itself awakened');
        console.log('🌈 Imagination Engine sparked');
    }
    
    async setupMatrixDirectories() {
        const dirs = [
            this.matrixDir,
            path.join(this.matrixDir, 'commands'),
            path.join(this.matrixDir, 'manifestations'),
            path.join(this.matrixDir, 'prophecies'),
            path.join(this.matrixDir, 'reality-snapshots')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async createControlInterface() {
        console.log('🎮 Creating archetypal control interface...');
        
        const controlHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧙‍♂️🌐💰 Archetypal Control Matrix</title>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Helvetica Neue', sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            height: 100vh;
            display: grid;
            grid-template-rows: 100px 1fr 200px;
            grid-template-columns: 300px 1fr 300px;
            gap: 2px;
            background: linear-gradient(45deg, #000033 0%, #000066 50%, #000033 100%);
        }
        
        .matrix-header {
            grid-column: 1 / -1;
            background: rgba(0, 0, 0, 0.8);
            border-bottom: 2px solid #00ffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            position: relative;
            overflow: hidden;
        }
        
        .matrix-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.3) 50%, transparent 100%);
            animation: scan 3s linear infinite;
        }
        
        @keyframes scan {
            to { left: 100%; }
        }
        
        .archetype-selector {
            background: rgba(0, 20, 40, 0.9);
            border-right: 1px solid #00ffff;
            padding: 20px;
            overflow-y: auto;
        }
        
        .control-realm {
            background: rgba(0, 0, 0, 0.7);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .power-panel {
            background: rgba(0, 20, 40, 0.9);
            border-left: 1px solid #00ffff;
            padding: 20px;
            overflow-y: auto;
        }
        
        .command-console {
            grid-column: 1 / -1;
            background: rgba(0, 0, 0, 0.9);
            border-top: 2px solid #00ffff;
            padding: 20px;
            font-family: 'Courier New', monospace;
            overflow-y: auto;
            position: relative;
        }
        
        #realmCanvas {
            width: 100%;
            height: 100%;
            cursor: crosshair;
        }
        
        .archetype-card {
            margin: 10px 0;
            padding: 15px;
            background: rgba(0, 50, 100, 0.5);
            border: 1px solid #00ffff;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .archetype-card:hover {
            background: rgba(0, 100, 200, 0.5);
            transform: translateX(5px);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
        
        .archetype-card.active {
            background: rgba(0, 150, 255, 0.5);
            border-color: #ffffff;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.8);
        }
        
        .archetype-card::before {
            content: attr(data-symbol);
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 40px;
            opacity: 0.3;
        }
        
        .power-control {
            margin: 15px 0;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #00ffff;
            border-radius: 5px;
        }
        
        .power-button {
            display: block;
            width: 100%;
            margin: 5px 0;
            padding: 10px;
            background: rgba(0, 100, 200, 0.3);
            border: 1px solid #00ffff;
            color: #00ffff;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            overflow: hidden;
        }
        
        .power-button:hover {
            background: rgba(0, 200, 255, 0.5);
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
        }
        
        .power-button::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.5s;
        }
        
        .power-button:active::after {
            width: 300px;
            height: 300px;
            opacity: 0;
        }
        
        .command-input {
            width: 100%;
            padding: 10px;
            background: rgba(0, 50, 100, 0.3);
            border: 1px solid #00ffff;
            color: #00ffff;
            font-family: 'Courier New', monospace;
            font-size: 16px;
        }
        
        .command-line {
            margin: 5px 0;
            padding: 5px;
            border-left: 2px solid #00ffff;
            padding-left: 10px;
            opacity: 0.8;
            animation: fade-in 0.3s ease-out;
        }
        
        @keyframes fade-in {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
        }
        
        .reality-effect {
            position: absolute;
            pointer-events: none;
            border-radius: 50%;
            border: 2px solid #00ffff;
            animation: ripple 1s ease-out forwards;
        }
        
        @keyframes ripple {
            to {
                transform: scale(10);
                opacity: 0;
            }
        }
        
        .power-meter {
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #00ffff;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .power-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ffff 0%, #0099ff 50%, #00ffff 100%);
            transition: width 0.5s;
            box-shadow: 0 0 10px #00ffff;
        }
        
        .fusion-controls {
            margin-top: 20px;
            padding: 15px;
            background: rgba(100, 0, 100, 0.2);
            border: 1px solid #ff00ff;
            border-radius: 5px;
        }
        
        .title {
            font-size: 32px;
            text-shadow: 0 0 20px #00ffff;
            letter-spacing: 3px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #00ffff;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .wisdom-text {
            font-style: italic;
            color: #ffff00;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
        }
        
        .matrix-grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.1;
            background-image: 
                linear-gradient(#00ffff 1px, transparent 1px),
                linear-gradient(90deg, #00ffff 1px, transparent 1px);
            background-size: 50px 50px;
        }
        
        .thought-form {
            position: absolute;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
            filter: blur(5px);
            pointer-events: none;
            animation: float 10s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(50px, -50px) scale(1.5); }
        }
        
        .money-flow {
            position: absolute;
            width: 20px;
            height: 20px;
            background: #ffd700;
            border-radius: 50%;
            box-shadow: 0 0 10px #ffd700;
            pointer-events: none;
        }
        
        .web-strand {
            position: absolute;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #ffffff 50%, transparent 100%);
            transform-origin: left center;
            pointer-events: none;
        }
        
        .domain-node {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 2px solid #00ff00;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            background: rgba(0, 255, 0, 0.1);
        }
        
        .packet {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #00ffff;
            border-radius: 2px;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="matrix-header">
        <div>
            <h1 class="title">ARCHETYPAL CONTROL MATRIX</h1>
            <div class="subtitle">Command Reality Through Digital Archetypes</div>
        </div>
        <div class="wisdom-text" id="wisdomDisplay">
            "In the digital realm, all possibilities converge..."
        </div>
    </div>
    
    <div class="archetype-selector">
        <h3 style="color: #00ffff; margin-bottom: 20px;">SELECT ARCHETYPE</h3>
        
        <div class="archetype-card active" data-archetype="wise-old-man" data-symbol="🧙‍♂️">
            <h4>The Wise Old Man</h4>
            <p style="font-size: 12px; opacity: 0.8;">Master of knowledge and foresight</p>
        </div>
        
        <div class="archetype-card" data-archetype="domain-matrix" data-symbol="🌐">
            <h4>The Domain Matrix</h4>
            <p style="font-size: 12px; opacity: 0.8;">Controller of digital territories</p>
        </div>
        
        <div class="archetype-card" data-archetype="web-master" data-symbol="🕸️">
            <h4>The Web Master</h4>
            <p style="font-size: 12px; opacity: 0.8;">Weaver of connections</p>
        </div>
        
        <div class="archetype-card" data-archetype="money-transfer" data-symbol="💰">
            <h4>The Money Transfer</h4>
            <p style="font-size: 12px; opacity: 0.8;">Flow of value and exchange</p>
        </div>
        
        <div class="archetype-card" data-archetype="internet-itself" data-symbol="🌍">
            <h4>The Internet Itself</h4>
            <p style="font-size: 12px; opacity: 0.8;">The living network</p>
        </div>
        
        <div class="archetype-card" data-archetype="imagination-engine" data-symbol="🌈">
            <h4>The Imagination Engine</h4>
            <p style="font-size: 12px; opacity: 0.8;">Creator of possibilities</p>
        </div>
        
        <div class="fusion-controls">
            <h4 style="color: #ff00ff;">FUSION MODE</h4>
            <button class="power-button" id="fusionToggle">ACTIVATE FUSION</button>
        </div>
    </div>
    
    <div class="control-realm">
        <div class="matrix-grid"></div>
        <canvas id="realmCanvas"></canvas>
    </div>
    
    <div class="power-panel">
        <h3 style="color: #00ffff; margin-bottom: 20px;">ARCHETYPAL POWERS</h3>
        
        <div class="power-control">
            <div>Power Level</div>
            <div class="power-meter">
                <div class="power-fill" id="powerFill" style="width: 100%;"></div>
            </div>
        </div>
        
        <div class="power-control" id="powerList">
            <!-- Powers will be populated here -->
        </div>
        
        <div class="power-control">
            <h4>Reality Bending</h4>
            <input type="range" id="realitySlider" min="0" max="100" value="0" 
                   style="width: 100%; margin: 10px 0;" />
            <div style="text-align: center;">
                <span id="realityLevel">0</span>%
            </div>
        </div>
        
        <div class="power-control">
            <h4>Time Dilation</h4>
            <input type="range" id="timeSlider" min="0.1" max="5" step="0.1" value="1" 
                   style="width: 100%; margin: 10px 0;" />
            <div style="text-align: center;">
                <span id="timeLevel">1.0</span>x
            </div>
        </div>
    </div>
    
    <div class="command-console">
        <input type="text" class="command-input" id="commandInput" 
               placeholder="Enter archetypal command..." />
        <div id="consoleOutput" style="margin-top: 10px; max-height: 120px; overflow-y: auto;">
            <div class="command-line">System: Archetypal Control Matrix initialized</div>
            <div class="command-line">System: All archetypes awakened and ready</div>
        </div>
    </div>
    
    <script>
        class ArchetypalController {
            constructor() {
                this.canvas = document.getElementById('realmCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.ws = null;
                
                // Current state
                this.activeArchetype = 'wise-old-man';
                this.fusionMode = false;
                this.fusedArchetypes = [];
                this.powerLevel = 100;
                this.realityBending = 0;
                this.timeDilation = 1.0;
                
                // Visual elements
                this.particles = [];
                this.connections = [];
                this.nodes = [];
                this.flows = [];
                this.thoughtForms = [];
                
                // Animation
                this.animationFrame = null;
                this.time = 0;
                
                this.init();
            }
            
            async init() {
                this.setupCanvas();
                this.connectWebSocket();
                this.setupControls();
                this.startAnimation();
                
                console.log('🧙‍♂️ Archetypal Controller initialized');
            }
            
            setupCanvas() {
                const resize = () => {
                    const rect = this.canvas.parentElement.getBoundingClientRect();
                    this.canvas.width = rect.width;
                    this.canvas.height = rect.height;
                };
                
                window.addEventListener('resize', resize);
                resize();
                
                // Canvas interactions
                this.canvas.addEventListener('click', (e) => {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    this.executeArchetypalPower(x, y);
                });
                
                this.canvas.addEventListener('mousemove', (e) => {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    this.hoverEffect(x, y);
                });
            }
            
            connectWebSocket() {
                try {
                    this.ws = new WebSocket('ws://localhost:8101/control-matrix');
                    
                    this.ws.onopen = () => {
                        this.addConsoleMessage('Connected to Archetypal Control Matrix', 'system');
                    };
                    
                    this.ws.onmessage = (event) => {
                        const message = JSON.parse(event.data);
                        this.handleControlMessage(message);
                    };
                    
                    this.ws.onclose = () => {
                        this.addConsoleMessage('Connection to matrix lost', 'error');
                        setTimeout(() => this.connectWebSocket(), 5000);
                    };
                    
                } catch (error) {
                    console.error('WebSocket error:', error);
                }
            }
            
            handleControlMessage(message) {
                switch (message.type) {
                    case 'archetype-update':
                        this.updateArchetypeState(message.data);
                        break;
                        
                    case 'reality-effect':
                        this.createRealityEffect(message.data);
                        break;
                        
                    case 'wisdom':
                        this.displayWisdom(message.data.text);
                        break;
                        
                    case 'manifestation':
                        this.manifestInRealm(message.data);
                        break;
                        
                    case 'power-result':
                        this.showPowerResult(message.data);
                        break;
                }
            }
            
            setupControls() {
                // Archetype selection
                document.querySelectorAll('.archetype-card').forEach(card => {
                    card.addEventListener('click', () => {
                        if (!this.fusionMode) {
                            // Single archetype mode
                            document.querySelectorAll('.archetype-card').forEach(c => c.classList.remove('active'));
                            card.classList.add('active');
                            this.activeArchetype = card.dataset.archetype;
                            this.switchArchetype(this.activeArchetype);
                        } else {
                            // Fusion mode
                            card.classList.toggle('active');
                            this.updateFusion();
                        }
                    });
                });
                
                // Fusion toggle
                document.getElementById('fusionToggle').addEventListener('click', () => {
                    this.fusionMode = !this.fusionMode;
                    document.getElementById('fusionToggle').textContent = 
                        this.fusionMode ? 'DEACTIVATE FUSION' : 'ACTIVATE FUSION';
                    
                    if (!this.fusionMode) {
                        // Reset to single archetype
                        document.querySelectorAll('.archetype-card').forEach(c => c.classList.remove('active'));
                        document.querySelector(\`[data-archetype="\${this.activeArchetype}"]\`).classList.add('active');
                    }
                    
                    this.addConsoleMessage(\`Fusion mode: \${this.fusionMode ? 'ACTIVE' : 'INACTIVE'}\`, 'system');
                });
                
                // Reality bending
                const realitySlider = document.getElementById('realitySlider');
                realitySlider.addEventListener('input', (e) => {
                    this.realityBending = parseInt(e.target.value);
                    document.getElementById('realityLevel').textContent = this.realityBending;
                    
                    if (this.realityBending > 80) {
                        this.canvas.style.filter = \`hue-rotate(\${this.realityBending}deg) saturate(\${1 + this.realityBending/100})\`;
                    } else {
                        this.canvas.style.filter = '';
                    }
                });
                
                // Time dilation
                const timeSlider = document.getElementById('timeSlider');
                timeSlider.addEventListener('input', (e) => {
                    this.timeDilation = parseFloat(e.target.value);
                    document.getElementById('timeLevel').textContent = this.timeDilation.toFixed(1);
                });
                
                // Command input
                const commandInput = document.getElementById('commandInput');
                commandInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const command = commandInput.value;
                        if (command) {
                            this.executeCommand(command);
                            commandInput.value = '';
                        }
                    }
                });
                
                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    switch(e.key) {
                        case '1': this.quickSwitch('wise-old-man'); break;
                        case '2': this.quickSwitch('domain-matrix'); break;
                        case '3': this.quickSwitch('web-master'); break;
                        case '4': this.quickSwitch('money-transfer'); break;
                        case '5': this.quickSwitch('internet-itself'); break;
                        case '6': this.quickSwitch('imagination-engine'); break;
                        case 'f': this.fusionMode = !this.fusionMode; break;
                        case ' ': e.preventDefault(); this.executePrimaryPower(); break;
                    }
                });
            }
            
            switchArchetype(archetype) {
                this.activeArchetype = archetype;
                this.updatePowerList(archetype);
                
                // Send to server
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'switch-archetype',
                        data: { archetype: archetype }
                    }));
                }
                
                this.addConsoleMessage(\`Embodying: \${this.getArchetypeName(archetype)}\`, 'archetype');
                
                // Visual transition
                this.createTransitionEffect();
            }
            
            updatePowerList(archetype) {
                const powerList = document.getElementById('powerList');
                const powers = this.getArchetypePowers(archetype);
                
                powerList.innerHTML = '<h4>Available Powers</h4>';
                
                powers.forEach(power => {
                    const button = document.createElement('button');
                    button.className = 'power-button';
                    button.textContent = power.toUpperCase();
                    button.addEventListener('click', () => this.activatePower(power));
                    powerList.appendChild(button);
                });
            }
            
            getArchetypePowers(archetype) {
                const powers = {
                    'wise-old-man': ['prophecy', 'guidance', 'memory', 'wisdom', 'foresight'],
                    'domain-matrix': ['dns-control', 'routing', 'namespace', 'hierarchy', 'topology'],
                    'web-master': ['weaving', 'linking', 'crawling', 'spinning', 'indexing'],
                    'money-transfer': ['transaction', 'exchange', 'liquidity', 'valuation', 'wealth'],
                    'internet-itself': ['packets', 'bandwidth', 'protocols', 'omnipresence', 'latency'],
                    'imagination-engine': ['dream', 'manifest', 'transform', 'inspire', 'transcend']
                };
                return powers[archetype] || [];
            }
            
            getArchetypeName(archetype) {
                const names = {
                    'wise-old-man': '🧙‍♂️ The Wise Old Man',
                    'domain-matrix': '🌐 The Domain Matrix',
                    'web-master': '🕸️ The Web Master',
                    'money-transfer': '💰 The Money Transfer',
                    'internet-itself': '🌍 The Internet Itself',
                    'imagination-engine': '🌈 The Imagination Engine'
                };
                return names[archetype] || archetype;
            }
            
            activatePower(power) {
                this.addConsoleMessage(\`Activating power: \${power.toUpperCase()}\`, 'power');
                
                // Visual effect
                this.createPowerEffect(power);
                
                // Send to server
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'activate-power',
                        data: {
                            archetype: this.activeArchetype,
                            power: power,
                            powerLevel: this.powerLevel,
                            realityBending: this.realityBending
                        }
                    }));
                }
            }
            
            executeCommand(command) {
                this.addConsoleMessage(\`> \${command}\`, 'user');
                
                // Send to server for interpretation
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'execute-command',
                        data: {
                            command: command,
                            archetype: this.activeArchetype,
                            fusionMode: this.fusionMode,
                            fusedArchetypes: this.fusedArchetypes,
                            context: {
                                powerLevel: this.powerLevel,
                                realityBending: this.realityBending,
                                timeDilation: this.timeDilation
                            }
                        }
                    }));
                }
            }
            
            executeArchetypalPower(x, y) {
                // Create reality ripple
                const ripple = document.createElement('div');
                ripple.className = 'reality-effect';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.style.width = '0px';
                ripple.style.height = '0px';
                this.canvas.parentElement.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 1000);
                
                // Archetype-specific effects
                switch (this.activeArchetype) {
                    case 'wise-old-man':
                        this.createWisdomRipple(x, y);
                        break;
                    case 'domain-matrix':
                        this.createDomainNode(x, y);
                        break;
                    case 'web-master':
                        this.createWebStrand(x, y);
                        break;
                    case 'money-transfer':
                        this.createMoneyFlow(x, y);
                        break;
                    case 'internet-itself':
                        this.createPacketBurst(x, y);
                        break;
                    case 'imagination-engine':
                        this.createThoughtForm(x, y);
                        break;
                }
            }
            
            createWisdomRipple(x, y) {
                this.particles.push({
                    x: x,
                    y: y,
                    radius: 0,
                    maxRadius: 200,
                    color: 'rgba(255, 255, 0, 0.5)',
                    growth: 2,
                    life: 1
                });
                
                // Display wisdom
                const wisdoms = [
                    "All streams flow to the same ocean",
                    "In code, as in life, simplicity is wisdom",
                    "The network remembers what nodes forget",
                    "Data flows like water, finding its level",
                    "Every connection strengthens the whole"
                ];
                
                const wisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
                this.displayWisdom(wisdom);
            }
            
            createDomainNode(x, y) {
                const node = document.createElement('div');
                node.className = 'domain-node';
                node.style.left = (x - 30) + 'px';
                node.style.top = (y - 30) + 'px';
                node.textContent = '.node';
                this.canvas.parentElement.appendChild(node);
                
                this.nodes.push({
                    element: node,
                    x: x,
                    y: y,
                    connections: []
                });
                
                // Connect to nearby nodes
                this.connectNearbyNodes(x, y);
            }
            
            createWebStrand(x, y) {
                // Find nearest point to connect
                if (this.nodes.length > 0) {
                    const nearest = this.findNearestNode(x, y);
                    
                    const strand = document.createElement('div');
                    strand.className = 'web-strand';
                    strand.style.left = nearest.x + 'px';
                    strand.style.top = nearest.y + 'px';
                    
                    const distance = Math.sqrt((x - nearest.x) ** 2 + (y - nearest.y) ** 2);
                    const angle = Math.atan2(y - nearest.y, x - nearest.x);
                    
                    strand.style.width = distance + 'px';
                    strand.style.transform = \`rotate(\${angle}rad)\`;
                    
                    this.canvas.parentElement.appendChild(strand);
                    
                    setTimeout(() => strand.remove(), 5000);
                }
            }
            
            createMoneyFlow(x, y) {
                const flow = document.createElement('div');
                flow.className = 'money-flow';
                flow.style.left = x + 'px';
                flow.style.top = y + 'px';
                this.canvas.parentElement.appendChild(flow);
                
                // Animate flow to random node
                if (this.nodes.length > 0) {
                    const target = this.nodes[Math.floor(Math.random() * this.nodes.length)];
                    
                    const duration = 2000;
                    const startTime = Date.now();
                    
                    const animate = () => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        
                        const currentX = x + (target.x - x) * progress;
                        const currentY = y + (target.y - y) * progress;
                        
                        flow.style.left = currentX + 'px';
                        flow.style.top = currentY + 'px';
                        
                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            flow.remove();
                            this.addConsoleMessage('💰 Value transferred', 'transaction');
                        }
                    };
                    
                    animate();
                }
            }
            
            createPacketBurst(x, y) {
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    const packet = document.createElement('div');
                    packet.className = 'packet';
                    packet.style.left = x + 'px';
                    packet.style.top = y + 'px';
                    this.canvas.parentElement.appendChild(packet);
                    
                    const velocity = {
                        x: Math.cos(angle) * 5,
                        y: Math.sin(angle) * 5
                    };
                    
                    const animate = () => {
                        const currentX = parseFloat(packet.style.left);
                        const currentY = parseFloat(packet.style.top);
                        
                        packet.style.left = (currentX + velocity.x) + 'px';
                        packet.style.top = (currentY + velocity.y) + 'px';
                        
                        const rect = this.canvas.getBoundingClientRect();
                        if (currentX < 0 || currentX > rect.width || 
                            currentY < 0 || currentY > rect.height) {
                            packet.remove();
                        } else {
                            requestAnimationFrame(animate);
                        }
                    };
                    
                    animate();
                }
            }
            
            createThoughtForm(x, y) {
                const thought = document.createElement('div');
                thought.className = 'thought-form';
                thought.style.left = (x - 50) + 'px';
                thought.style.top = (y - 50) + 'px';
                thought.style.background = \`radial-gradient(circle, \${this.randomColor()} 0%, transparent 70%)\`;
                this.canvas.parentElement.appendChild(thought);
                
                this.thoughtForms.push(thought);
                
                setTimeout(() => {
                    thought.style.transition = 'opacity 2s';
                    thought.style.opacity = '0';
                    setTimeout(() => thought.remove(), 2000);
                }, 5000);
            }
            
            randomColor() {
                const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0099', '#00ff99', '#9900ff'];
                return colors[Math.floor(Math.random() * colors.length)];
            }
            
            findNearestNode(x, y) {
                let nearest = null;
                let minDistance = Infinity;
                
                this.nodes.forEach(node => {
                    const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = node;
                    }
                });
                
                return nearest;
            }
            
            connectNearbyNodes(x, y) {
                this.nodes.forEach((node, index) => {
                    if (node.x !== x || node.y !== y) {
                        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
                        if (distance < 150) {
                            // Create connection line
                            const line = document.createElement('div');
                            line.className = 'web-strand';
                            line.style.left = node.x + 'px';
                            line.style.top = node.y + 'px';
                            line.style.width = distance + 'px';
                            line.style.transform = \`rotate(\${Math.atan2(y - node.y, x - node.x)}rad)\`;
                            line.style.opacity = '0.3';
                            
                            this.canvas.parentElement.appendChild(line);
                            this.connections.push(line);
                        }
                    }
                });
            }
            
            displayWisdom(text) {
                document.getElementById('wisdomDisplay').textContent = \`"\${text}"\`;
                
                // Fade effect
                const display = document.getElementById('wisdomDisplay');
                display.style.opacity = '0';
                setTimeout(() => {
                    display.style.transition = 'opacity 1s';
                    display.style.opacity = '1';
                }, 100);
            }
            
            createTransitionEffect() {
                // Clear canvas with style
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Create archetype-specific pattern
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                
                for (let i = 0; i < 50; i++) {
                    const x = Math.random() * this.canvas.width;
                    const y = Math.random() * this.canvas.height;
                    const radius = Math.random() * 50 + 10;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
                    this.ctx.fillStyle = this.getArchetypeColor(this.activeArchetype, 0.1);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
            }
            
            getArchetypeColor(archetype, alpha = 1) {
                const colors = {
                    'wise-old-man': \`rgba(255, 255, 0, \${alpha})\`,
                    'domain-matrix': \`rgba(0, 255, 0, \${alpha})\`,
                    'web-master': \`rgba(255, 255, 255, \${alpha})\`,
                    'money-transfer': \`rgba(255, 215, 0, \${alpha})\`,
                    'internet-itself': \`rgba(0, 255, 255, \${alpha})\`,
                    'imagination-engine': \`rgba(255, 0, 255, \${alpha})\`
                };
                return colors[archetype] || \`rgba(255, 255, 255, \${alpha})\`;
            }
            
            createPowerEffect(power) {
                // Screen flash
                this.canvas.style.animation = 'none';
                setTimeout(() => {
                    this.canvas.style.animation = 'flash 0.5s';
                }, 10);
                
                // Power-specific particles
                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * Math.PI * 2;
                    const speed = Math.random() * 5 + 2;
                    
                    this.particles.push({
                        x: this.canvas.width / 2,
                        y: this.canvas.height / 2,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: this.getArchetypeColor(this.activeArchetype),
                        size: Math.random() * 5 + 2,
                        life: 1
                    });
                }
                
                // Update power meter
                this.powerLevel = Math.max(0, this.powerLevel - 10);
                document.getElementById('powerFill').style.width = this.powerLevel + '%';
                
                // Recharge over time
                setTimeout(() => {
                    this.powerLevel = Math.min(100, this.powerLevel + 10);
                    document.getElementById('powerFill').style.width = this.powerLevel + '%';
                }, 3000);
            }
            
            addConsoleMessage(text, type = 'system') {
                const output = document.getElementById('consoleOutput');
                const line = document.createElement('div');
                line.className = 'command-line';
                
                const timestamp = new Date().toTimeString().split(' ')[0];
                const prefix = type === 'user' ? '>' : type.toUpperCase() + ':';
                
                line.innerHTML = \`<span style="opacity: 0.5;">\${timestamp}</span> \${prefix} \${text}\`;
                
                // Color coding
                if (type === 'error') line.style.color = '#ff0000';
                if (type === 'power') line.style.color = '#00ffff';
                if (type === 'archetype') line.style.color = '#ffff00';
                if (type === 'transaction') line.style.color = '#ffd700';
                
                output.appendChild(line);
                output.scrollTop = output.scrollHeight;
                
                // Limit messages
                while (output.children.length > 50) {
                    output.removeChild(output.firstChild);
                }
            }
            
            updateFusion() {
                this.fusedArchetypes = [];
                document.querySelectorAll('.archetype-card.active').forEach(card => {
                    this.fusedArchetypes.push(card.dataset.archetype);
                });
                
                if (this.fusedArchetypes.length > 1) {
                    this.addConsoleMessage(\`Fusion active: \${this.fusedArchetypes.join(' + ')}\`, 'system');
                    this.createFusionEffect();
                }
            }
            
            createFusionEffect() {
                // Dramatic fusion visualization
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                
                this.fusedArchetypes.forEach((archetype, index) => {
                    const angle = (index / this.fusedArchetypes.length) * Math.PI * 2;
                    const startX = centerX + Math.cos(angle) * 200;
                    const startY = centerY + Math.sin(angle) * 200;
                    
                    // Create energy stream
                    for (let i = 0; i < 20; i++) {
                        setTimeout(() => {
                            this.particles.push({
                                x: startX,
                                y: startY,
                                vx: (centerX - startX) / 20,
                                vy: (centerY - startY) / 20,
                                color: this.getArchetypeColor(archetype),
                                size: 5,
                                life: 1
                            });
                        }, i * 50);
                    }
                });
            }
            
            quickSwitch(archetype) {
                if (!this.fusionMode) {
                    document.querySelectorAll('.archetype-card').forEach(c => c.classList.remove('active'));
                    document.querySelector(\`[data-archetype="\${archetype}"]\`).classList.add('active');
                    this.switchArchetype(archetype);
                }
            }
            
            executePrimaryPower() {
                const powers = this.getArchetypePowers(this.activeArchetype);
                if (powers.length > 0) {
                    this.activatePower(powers[0]);
                }
            }
            
            hoverEffect(x, y) {
                // Subtle hover trail
                if (Math.random() > 0.9) {
                    this.particles.push({
                        x: x,
                        y: y,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        color: this.getArchetypeColor(this.activeArchetype, 0.5),
                        size: 2,
                        life: 0.5
                    });
                }
            }
            
            startAnimation() {
                const animate = () => {
                    this.animationFrame = requestAnimationFrame(animate);
                    
                    this.time += 0.016 * this.timeDilation;
                    
                    // Clear canvas
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Draw and update particles
                    this.updateParticles();
                    
                    // Draw archetype-specific background
                    this.drawArchetypeBackground();
                    
                    // Reality bending effects
                    if (this.realityBending > 0) {
                        this.applyRealityBending();
                    }
                };
                
                animate();
                
                // Add CSS animation
                const style = document.createElement('style');
                style.textContent = \`
                    @keyframes flash {
                        0%, 100% { filter: brightness(1); }
                        50% { filter: brightness(2); }
                    }
                \`;
                document.head.appendChild(style);
            }
            
            updateParticles() {
                this.particles = this.particles.filter(particle => {
                    // Update position
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    // Update life
                    particle.life -= 0.02;
                    
                    if (particle.life > 0) {
                        // Draw particle
                        this.ctx.globalAlpha = particle.life;
                        this.ctx.fillStyle = particle.color;
                        this.ctx.beginPath();
                        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        return true;
                    }
                    
                    return false;
                });
                
                this.ctx.globalAlpha = 1;
            }
            
            drawArchetypeBackground() {
                this.ctx.save();
                this.ctx.globalAlpha = 0.05;
                
                switch (this.activeArchetype) {
                    case 'wise-old-man':
                        // Mystical circles
                        this.ctx.strokeStyle = '#ffff00';
                        for (let i = 0; i < 5; i++) {
                            this.ctx.beginPath();
                            this.ctx.arc(
                                this.canvas.width / 2,
                                this.canvas.height / 2,
                                50 + i * 50 + Math.sin(this.time * 0.5 + i) * 10,
                                0, Math.PI * 2
                            );
                            this.ctx.stroke();
                        }
                        break;
                        
                    case 'domain-matrix':
                        // Grid pattern
                        this.ctx.strokeStyle = '#00ff00';
                        const gridSize = 50;
                        for (let x = 0; x < this.canvas.width; x += gridSize) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(x, 0);
                            this.ctx.lineTo(x, this.canvas.height);
                            this.ctx.stroke();
                        }
                        for (let y = 0; y < this.canvas.height; y += gridSize) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(0, y);
                            this.ctx.lineTo(this.canvas.width, y);
                            this.ctx.stroke();
                        }
                        break;
                        
                    case 'web-master':
                        // Web pattern
                        this.ctx.strokeStyle = '#ffffff';
                        const centerX = this.canvas.width / 2;
                        const centerY = this.canvas.height / 2;
                        
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2;
                            this.ctx.beginPath();
                            this.ctx.moveTo(centerX, centerY);
                            this.ctx.lineTo(
                                centerX + Math.cos(angle) * this.canvas.width,
                                centerY + Math.sin(angle) * this.canvas.height
                            );
                            this.ctx.stroke();
                        }
                        break;
                        
                    case 'money-transfer':
                        // Flowing lines
                        this.ctx.strokeStyle = '#ffd700';
                        for (let i = 0; i < 5; i++) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(0, this.canvas.height * (i + 1) / 6);
                            
                            for (let x = 0; x < this.canvas.width; x += 10) {
                                const y = this.canvas.height * (i + 1) / 6 + 
                                         Math.sin(x * 0.01 + this.time + i) * 30;
                                this.ctx.lineTo(x, y);
                            }
                            
                            this.ctx.stroke();
                        }
                        break;
                        
                    case 'internet-itself':
                        // Network nodes
                        this.ctx.fillStyle = '#00ffff';
                        for (let i = 0; i < 20; i++) {
                            const x = this.canvas.width * (0.1 + 0.8 * ((i * 7) % 11) / 11);
                            const y = this.canvas.height * (0.1 + 0.8 * ((i * 13) % 17) / 17);
                            const pulse = Math.sin(this.time * 2 + i) * 0.5 + 0.5;
                            
                            this.ctx.beginPath();
                            this.ctx.arc(x, y, 5 + pulse * 5, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                        break;
                        
                    case 'imagination-engine':
                        // Swirling colors
                        const gradient = this.ctx.createRadialGradient(
                            this.canvas.width / 2,
                            this.canvas.height / 2,
                            0,
                            this.canvas.width / 2,
                            this.canvas.height / 2,
                            Math.max(this.canvas.width, this.canvas.height) / 2
                        );
                        
                        const hue = (this.time * 20) % 360;
                        gradient.addColorStop(0, \`hsla(\${hue}, 100%, 50%, 0.1)\`);
                        gradient.addColorStop(0.5, \`hsla(\${hue + 120}, 100%, 50%, 0.1)\`);
                        gradient.addColorStop(1, \`hsla(\${hue + 240}, 100%, 50%, 0.1)\`);
                        
                        this.ctx.fillStyle = gradient;
                        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                        break;
                }
                
                this.ctx.restore();
            }
            
            applyRealityBending() {
                // Distortion effect
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const data = imageData.data;
                
                const bendAmount = this.realityBending / 100;
                
                for (let i = 0; i < data.length; i += 4) {
                    // Shift colors based on reality bending
                    data[i] = Math.min(255, data[i] * (1 + bendAmount));     // Red
                    data[i + 1] = Math.min(255, data[i + 1] * (1 + bendAmount * 0.5)); // Green
                    data[i + 2] = Math.min(255, data[i + 2] * (1 + bendAmount * 0.3)); // Blue
                }
                
                this.ctx.putImageData(imageData, 0, 0);
            }
            
            manifestInRealm(manifestation) {
                // Create visual manifestation based on type
                const { type, x, y, data } = manifestation;
                
                switch (type) {
                    case 'portal':
                        this.createPortal(x, y, data);
                        break;
                    case 'entity':
                        this.createEntity(x, y, data);
                        break;
                    case 'energy':
                        this.createEnergyField(x, y, data);
                        break;
                }
            }
            
            createPortal(x, y, data) {
                // Swirling portal effect
                const portal = {
                    x: x,
                    y: y,
                    radius: 50,
                    rotation: 0,
                    color: data.color || '#ff00ff'
                };
                
                // Add to render list
                this.portals = this.portals || [];
                this.portals.push(portal);
                
                this.addConsoleMessage('Portal manifested in the realm', 'manifestation');
            }
            
            showPowerResult(result) {
                this.addConsoleMessage(result.message, result.type || 'power');
                
                if (result.effect) {
                    this.createRealityEffect(result.effect);
                }
            }
            
            createRealityEffect(effect) {
                // Complex reality manipulation effects
                switch (effect.type) {
                    case 'time-ripple':
                        this.timeDilation = effect.value;
                        document.getElementById('timeSlider').value = effect.value;
                        document.getElementById('timeLevel').textContent = effect.value.toFixed(1);
                        break;
                        
                    case 'reality-shift':
                        this.realityBending = effect.value;
                        document.getElementById('realitySlider').value = effect.value;
                        document.getElementById('realityLevel').textContent = effect.value;
                        break;
                        
                    case 'dimensional-tear':
                        // Create visual tear in reality
                        this.ctx.save();
                        this.ctx.globalCompositeOperation = 'difference';
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.fillRect(
                            effect.x - 50,
                            effect.y - 2,
                            100,
                            4
                        );
                        this.ctx.restore();
                        break;
                }
            }
        }
        
        // Initialize the controller
        const controller = new ArchetypalController();
        
        console.log('🧙‍♂️🌐💰 ARCHETYPAL CONTROL MATRIX INITIALIZED');
        console.log('Use number keys 1-6 to quick switch archetypes');
        console.log('Press SPACE to activate primary power');
        console.log('Type commands to control reality');
    </script>
</body>
</html>`;
        
        await fs.writeFile(
            path.join(this.matrixDir, 'index.html'),
            controlHTML
        );
        
        console.log('   ✅ Control interface created');
    }
    
    async startControlServer() {
        console.log('🎮 Starting control matrix server...');
        
        this.httpServer = http.createServer(async (req, res) => {
            if (req.url === '/') {
                const html = await fs.readFile(path.join(this.matrixDir, 'index.html'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        this.httpServer.listen(this.httpPort);
        
        // WebSocket server
        this.controlWsServer = new WebSocket.Server({
            port: this.httpPort,
            path: '/control-matrix',
            server: this.httpServer
        });
        
        this.controlWsServer.on('connection', (ws) => {
            console.log('🎮 Operator connected to control matrix');
            this.operatorClients.add(ws);
            
            // Send initial state
            this.sendArchetypeStates(ws);
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleOperatorCommand(message, ws);
            });
            
            ws.on('close', () => {
                this.operatorClients.delete(ws);
            });
        });
        
        console.log(`   ✅ Control server: http://localhost:${this.httpPort}`);
    }
    
    async connectToAllSystems() {
        console.log('🔗 Connecting to all digital realms...');
        
        // Connect to theater for narrative control
        try {
            this.theaterWs = new WebSocket('ws://localhost:8100/narrative-theater');
            this.theaterWs.on('open', () => {
                console.log('   ✅ Connected to Narrative Theater');
            });
        } catch (error) {
            console.log('   ⚠️  Narrative Theater not available');
        }
        
        // Connect to XML viewer for data flow control
        try {
            this.viewerWs = new WebSocket('ws://localhost:8099/xml-viewer');
            this.viewerWs.on('open', () => {
                console.log('   ✅ Connected to XML Viewer');
            });
        } catch (error) {
            console.log('   ⚠️  XML Viewer not available');
        }
        
        // Connect to five-layer system
        this.layerConnections = new Map();
        const layers = [
            { name: 'gaming-engine', port: 8098 },
            { name: 'meta-orchestrator', port: 8097 },
            { name: 'licensing-compliance', port: 8094 },
            { name: 'xml-stream-integration', port: 8091 }
        ];
        
        for (const layer of layers) {
            try {
                const ws = new WebSocket(`ws://localhost:${layer.port}`);
                ws.on('open', () => {
                    console.log(`   ✅ Connected to ${layer.name}`);
                    this.layerConnections.set(layer.name, ws);
                });
            } catch (error) {
                console.log(`   ⚠️  ${layer.name} not available`);
            }
        }
    }
    
    async initializeArchetypes() {
        console.log('🧙‍♂️ Awakening archetypal powers...');
        
        // Initialize each archetype's special abilities
        for (const [archetypeId, archetype] of Object.entries(this.archetypes)) {
            await this.awakenArchetype(archetypeId, archetype);
        }
        
        console.log('   ✅ All archetypes awakened');
    }
    
    async awakenArchetype(archetypeId, archetype) {
        // Load ancient knowledge for wise old man
        if (archetypeId === 'wise-old-man') {
            archetype.state.ancientKnowledge.set('creation', 'In the beginning was the Command Line...');
            archetype.state.ancientKnowledge.set('connection', 'All nodes are one in the great network');
            archetype.state.ancientKnowledge.set('data', 'Information wants to be free');
            archetype.state.activeProverbs = [
                "The cloud remembers what the server forgets",
                "In the matrix, all paths lead to root",
                "A packet delayed is a packet denied"
            ];
        }
        
        // Initialize domain registry
        if (archetypeId === 'domain-matrix') {
            archetype.state.domains.set('localhost', { ip: '127.0.0.1', owner: 'self' });
            archetype.state.domains.set('matrix.local', { ip: '10.0.0.1', owner: 'system' });
        }
        
        // Set up web connections
        if (archetypeId === 'web-master') {
            archetype.state.webNodes.set('origin', { x: 0, y: 0, connections: [] });
        }
        
        // Initialize wallets
        if (archetypeId === 'money-transfer') {
            archetype.state.wallets.set('genesis', { balance: 1000000, address: '0x00000' });
            archetype.state.exchangeRates.set('USD', 1.0);
            archetype.state.exchangeRates.set('BTC', 50000);
            archetype.state.exchangeRates.set('ETH', 3000);
        }
        
        // Set up internet nodes
        if (archetypeId === 'internet-itself') {
            for (let i = 0; i < 10; i++) {
                archetype.state.nodes.set(`node-${i}`, {
                    ip: `192.168.1.${i}`,
                    status: 'active',
                    bandwidth: 1000
                });
            }
        }
        
        // Spark imagination
        if (archetypeId === 'imagination-engine') {
            archetype.state.dreams = [
                'A world where code writes itself',
                'Networks that dream of electric sheep',
                'Data flowing like rivers of light'
            ];
        }
    }
    
    handleOperatorCommand(message, ws) {
        console.log(`🎮 Operator command: ${message.type}`);
        
        switch (message.type) {
            case 'switch-archetype':
                this.switchArchetype(message.data.archetype);
                break;
                
            case 'activate-power':
                this.activatePower(message.data);
                break;
                
            case 'execute-command':
                this.executeCommand(message.data);
                break;
                
            case 'fusion-mode':
                this.handleFusion(message.data);
                break;
        }
    }
    
    switchArchetype(archetypeId) {
        this.controlState.activeArchetype = archetypeId;
        const archetype = this.archetypes[archetypeId];
        
        console.log(`   🔄 Switching to ${archetype.name}`);
        
        // Send state update
        this.broadcastToOperators({
            type: 'archetype-update',
            data: {
                archetype: archetypeId,
                state: archetype.state,
                powers: archetype.powers
            }
        });
        
        // Archetype greeting
        this.sendWisdom(this.getArchetypeGreeting(archetypeId));
    }
    
    getArchetypeGreeting(archetypeId) {
        const greetings = {
            'wise-old-man': "Ah, seeker of wisdom, you have come. What knowledge do you seek?",
            'domain-matrix': "Welcome to the matrix. All domains bend to your will.",
            'web-master': "The web awaits your weaving. What connections shall we forge?",
            'money-transfer': "Value flows where attention goes. Command the currents of wealth.",
            'internet-itself': "I am the network. Through me, all data flows. Speak your protocol.",
            'imagination-engine': "Dream with me, and we shall manifest realities beyond comprehension."
        };
        return greetings[archetypeId] || "Archetype awakened.";
    }
    
    activatePower(data) {
        const archetype = this.archetypes[data.archetype];
        const power = data.power;
        
        console.log(`   ⚡ Activating ${power} for ${archetype.name}`);
        
        // Execute power based on archetype
        const powerResult = this.executePower(data.archetype, power, data);
        
        // Send result
        this.broadcastToOperators({
            type: 'power-result',
            data: powerResult
        });
        
        // Update archetype state
        this.updateArchetypeState(data.archetype, powerResult);
    }
    
    executePower(archetypeId, power, context) {
        const powerExecutors = {
            'wise-old-man': {
                prophecy: () => this.generateProphecy(),
                guidance: () => this.provideGuidance(),
                memory: () => this.accessMemory(),
                wisdom: () => this.shareWisdom(),
                foresight: () => this.glimpseFuture()
            },
            'domain-matrix': {
                'dns-control': () => this.controlDNS(),
                routing: () => this.manipulateRouting(),
                namespace: () => this.createNamespace(),
                hierarchy: () => this.establishHierarchy(),
                topology: () => this.reshapeTopology()
            },
            'web-master': {
                weaving: () => this.weaveConnections(),
                linking: () => this.createLinks(),
                crawling: () => this.crawlWeb(),
                spinning: () => this.spinNewWeb(),
                indexing: () => this.indexContent()
            },
            'money-transfer': {
                transaction: () => this.executeTransaction(),
                exchange: () => this.performExchange(),
                liquidity: () => this.provideLiquidity(),
                valuation: () => this.assessValue(),
                wealth: () => this.generateWealth()
            },
            'internet-itself': {
                packets: () => this.routePackets(),
                bandwidth: () => this.allocateBandwidth(),
                protocols: () => this.defineProtocol(),
                omnipresence: () => this.achieveOmnipresence(),
                latency: () => this.manipulateLatency()
            },
            'imagination-engine': {
                dream: () => this.dreamReality(),
                manifest: () => this.manifestThought(),
                transform: () => this.transformReality(),
                inspire: () => this.inspireCreation(),
                transcend: () => this.transcendLimitations()
            }
        };
        
        const executor = powerExecutors[archetypeId]?.[power];
        if (executor) {
            return executor();
        }
        
        return {
            success: false,
            message: `Unknown power: ${power}`,
            type: 'error'
        };
    }
    
    // Wise Old Man Powers
    generateProphecy() {
        const prophecies = [
            "The five layers shall unite when the moon packets align",
            "A great refactoring approaches from the east",
            "The one who controls the DNS controls the future",
            "In three commits' time, a bug shall become a feature",
            "The blockchain remembers what the cloud forgets"
        ];
        
        const prophecy = prophecies[Math.floor(Math.random() * prophecies.length)];
        
        return {
            success: true,
            message: `PROPHECY: ${prophecy}`,
            type: 'prophecy',
            effect: {
                type: 'reality-shift',
                value: 20
            }
        };
    }
    
    // Domain Matrix Powers
    controlDNS() {
        const domain = `matrix-${Date.now()}.local`;
        this.archetypes['domain-matrix'].state.domains.set(domain, {
            ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            owner: 'operator',
            created: new Date()
        });
        
        return {
            success: true,
            message: `DNS control established: ${domain}`,
            type: 'domain',
            effect: {
                type: 'node-creation',
                domain: domain
            }
        };
    }
    
    // Web Master Powers
    weaveConnections() {
        const connections = Math.floor(Math.random() * 10) + 5;
        const nodes = [];
        
        for (let i = 0; i < connections; i++) {
            nodes.push({
                id: crypto.randomUUID(),
                x: Math.random() * 1000,
                y: Math.random() * 1000
            });
        }
        
        return {
            success: true,
            message: `Wove ${connections} new connections across the web`,
            type: 'web',
            effect: {
                type: 'web-expansion',
                nodes: nodes
            }
        };
    }
    
    // Money Transfer Powers
    executeTransaction() {
        const amount = Math.floor(Math.random() * 10000) + 1000;
        const from = 'genesis';
        const to = `wallet-${Date.now()}`;
        
        this.archetypes['money-transfer'].state.transactions.push({
            from: from,
            to: to,
            amount: amount,
            timestamp: new Date(),
            hash: crypto.randomUUID()
        });
        
        return {
            success: true,
            message: `💰 Transferred ${amount} units of value`,
            type: 'transaction',
            effect: {
                type: 'money-flow',
                amount: amount
            }
        };
    }
    
    // Internet Itself Powers
    routePackets() {
        const packetCount = Math.floor(Math.random() * 1000) + 100;
        const routes = [];
        
        for (let i = 0; i < 5; i++) {
            routes.push({
                from: `node-${Math.floor(Math.random() * 10)}`,
                to: `node-${Math.floor(Math.random() * 10)}`,
                packets: Math.floor(packetCount / 5)
            });
        }
        
        return {
            success: true,
            message: `Routed ${packetCount} packets across the network`,
            type: 'network',
            effect: {
                type: 'packet-storm',
                routes: routes
            }
        };
    }
    
    // Imagination Engine Powers
    manifestThought() {
        const thought = this.archetypes['imagination-engine'].state.dreams[
            Math.floor(Math.random() * this.archetypes['imagination-engine'].state.dreams.length)
        ];
        
        const manifestation = {
            thought: thought,
            form: 'energy',
            location: {
                x: Math.random() * 1000,
                y: Math.random() * 1000
            },
            intensity: Math.random()
        };
        
        this.archetypes['imagination-engine'].state.manifestations.set(
            crypto.randomUUID(),
            manifestation
        );
        
        return {
            success: true,
            message: `Manifested: "${thought}"`,
            type: 'manifestation',
            effect: {
                type: 'thought-form',
                data: manifestation
            }
        };
    }
    
    executeCommand(data) {
        const { command, archetype, context } = data;
        
        console.log(`   📝 Executing command: ${command}`);
        
        // Use appropriate interpreter
        const interpreter = this.commandInterpreters[archetype];
        if (interpreter) {
            const result = interpreter(command, context);
            
            this.broadcastToOperators({
                type: 'command-result',
                data: result
            });
            
            // Apply reality effects
            if (context.realityBending > 50) {
                this.bendReality(result, context.realityBending);
            }
        }
    }
    
    interpretWisdom(command, context) {
        const lowerCommand = command.toLowerCase();
        
        if (lowerCommand.includes('show') && lowerCommand.includes('path')) {
            return {
                message: "The path reveals itself to those who seek with pure intent",
                type: 'wisdom',
                effect: { type: 'illumination' }
            };
        }
        
        if (lowerCommand.includes('future')) {
            return this.glimpseFuture();
        }
        
        if (lowerCommand.includes('past')) {
            return this.accessMemory();
        }
        
        return {
            message: "The wise old man ponders your words...",
            type: 'contemplation'
        };
    }
    
    interpretDomain(command, context) {
        const lowerCommand = command.toLowerCase();
        
        if (lowerCommand.includes('create') && lowerCommand.includes('domain')) {
            const domainMatch = command.match(/domain\s+(\S+)/i);
            const domain = domainMatch ? domainMatch[1] : `domain-${Date.now()}.matrix`;
            
            return this.createDomain(domain);
        }
        
        if (lowerCommand.includes('connect')) {
            return this.connectDomains();
        }
        
        return {
            message: "The matrix awaits your domain commands",
            type: 'domain'
        };
    }
    
    interpretWeb(command, context) {
        if (command.includes('spin')) {
            return this.spinNewWeb();
        }
        
        if (command.includes('connect all')) {
            return this.connectEverything();
        }
        
        return {
            message: "The web trembles at your command",
            type: 'web'
        };
    }
    
    interpretMoney(command, context) {
        const amountMatch = command.match(/\$?(\d+)/);
        const amount = amountMatch ? parseInt(amountMatch[1]) : 1000;
        
        if (command.includes('send') || command.includes('transfer')) {
            return this.executeTransfer(amount);
        }
        
        if (command.includes('create') && command.includes('wealth')) {
            return this.generateWealth();
        }
        
        return {
            message: "Value flows through your commands",
            type: 'money'
        };
    }
    
    interpretInternet(command, context) {
        if (command.includes('ping')) {
            return this.pingEverything();
        }
        
        if (command.includes('accelerate')) {
            return this.accelerateNetwork();
        }
        
        return {
            message: "The network pulses with your intent",
            type: 'network'
        };
    }
    
    interpretImagination(command, context) {
        if (command.includes('imagine')) {
            const imagination = command.replace(/imagine\s*/i, '');
            return this.imagineReality(imagination);
        }
        
        if (command.includes('dream')) {
            return this.enterDreamState();
        }
        
        return {
            message: "Your thoughts shape reality",
            type: 'imagination'
        };
    }
    
    bendReality(result, bendingLevel) {
        // Apply reality distortions based on bending level
        if (bendingLevel > 80) {
            result.effect = {
                ...result.effect,
                type: 'dimensional-tear',
                x: Math.random() * 1000,
                y: Math.random() * 1000
            };
        }
        
        // Cascade effects through connected systems
        this.cascadeRealityEffects(result, bendingLevel);
    }
    
    cascadeRealityEffects(result, intensity) {
        // Send to narrative theater
        if (this.theaterWs && this.theaterWs.readyState === WebSocket.OPEN) {
            this.theaterWs.send(JSON.stringify({
                type: 'reality-cascade',
                data: {
                    source: 'control-matrix',
                    effect: result.effect,
                    intensity: intensity
                }
            }));
        }
        
        // Send to XML viewer
        if (this.viewerWs && this.viewerWs.readyState === WebSocket.OPEN) {
            this.viewerWs.send(JSON.stringify({
                type: 'reality-distortion',
                data: {
                    source: 'archetypal-control',
                    distortion: intensity / 100
                }
            }));
        }
    }
    
    sendArchetypeStates(ws) {
        for (const [archetypeId, archetype] of Object.entries(this.archetypes)) {
            ws.send(JSON.stringify({
                type: 'archetype-state',
                data: {
                    id: archetypeId,
                    name: archetype.name,
                    symbol: archetype.symbol,
                    state: archetype.state,
                    powers: archetype.powers
                }
            }));
        }
    }
    
    sendWisdom(text) {
        this.broadcastToOperators({
            type: 'wisdom',
            data: { text: text }
        });
    }
    
    broadcastToOperators(message) {
        const data = JSON.stringify(message);
        this.operatorClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    updateArchetypeState(archetypeId, result) {
        const archetype = this.archetypes[archetypeId];
        
        // Update state based on power usage
        if (archetypeId === 'wise-old-man' && result.type === 'prophecy') {
            archetype.state.wisdom = Math.max(0, archetype.state.wisdom - 10);
            setTimeout(() => {
                archetype.state.wisdom = Math.min(100, archetype.state.wisdom + 10);
            }, 10000);
        }
        
        // Log to history
        this.controlState.commandHistory.push({
            timestamp: new Date(),
            archetype: archetypeId,
            result: result
        });
    }
    
    // Additional archetypal methods...
    
    provideGuidance() {
        const guidance = [
            "Follow the data streams to find your answer",
            "The bug you seek is often in the last place you debug",
            "Trust in the compiler, but verify your logic",
            "The shortest path is not always through localhost"
        ];
        
        return {
            success: true,
            message: guidance[Math.floor(Math.random() * guidance.length)],
            type: 'guidance'
        };
    }
    
    glimpseFuture() {
        const futures = [
            "I see... a great merge conflict approaching",
            "The servers will sing in harmony after the next update",
            "A pull request from an unexpected source will change everything",
            "The quantum computers are coming... prepare your algorithms"
        ];
        
        return {
            success: true,
            message: futures[Math.floor(Math.random() * futures.length)],
            type: 'foresight',
            effect: { type: 'time-ripple', value: 2.0 }
        };
    }
    
    connectEverything() {
        const connections = [];
        const nodeCount = 20;
        
        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                if (Math.random() > 0.7) {
                    connections.push({
                        from: `node-${i}`,
                        to: `node-${j}`,
                        strength: Math.random()
                    });
                }
            }
        }
        
        return {
            success: true,
            message: `Connected ${connections.length} nodes in the great web`,
            type: 'web',
            effect: {
                type: 'mass-connection',
                connections: connections
            }
        };
    }
    
    accelerateNetwork() {
        this.archetypes['internet-itself'].state.bandwidth *= 2;
        
        return {
            success: true,
            message: "Network acceleration engaged - bandwidth doubled!",
            type: 'network',
            effect: {
                type: 'speed-boost',
                multiplier: 2
            }
        };
    }
    
    imagineReality(imagination) {
        const manifestation = {
            id: crypto.randomUUID(),
            thought: imagination,
            reality: Math.random() > 0.5,
            timestamp: new Date()
        };
        
        this.archetypes['imagination-engine'].state.activeVisions.push(manifestation);
        
        return {
            success: true,
            message: `Imagining: "${imagination}" - Reality probability: ${manifestation.reality ? 'HIGH' : 'LOW'}`,
            type: 'imagination',
            effect: {
                type: 'reality-seed',
                vision: manifestation
            }
        };
    }
}

module.exports = ArchetypalControlMatrix;

// CLI interface
if (require.main === module) {
    const matrix = new ArchetypalControlMatrix();
    
    console.log(`
🧙‍♂️🌐💰 ARCHETYPAL CONTROL MATRIX
==================================

Control reality through digital archetypes!

Access the control interface at:
  http://localhost:8101

ARCHETYPES:
  🧙‍♂️ Wise Old Man - Knowledge, prophecy, wisdom
  🌐 Domain Matrix - DNS, routing, digital territories  
  🕸️ Web Master - Connections, linking, weaving
  💰 Money Transfer - Value, transactions, wealth
  🌍 Internet Itself - Packets, protocols, omnipresence
  🌈 Imagination Engine - Dreams, manifestation, creation

CONTROLS:
  • Click canvas to execute archetypal powers
  • Type commands to control reality
  • Number keys 1-6 for quick switching
  • Adjust reality bending and time dilation
  • Activate fusion mode for multi-archetype power

The digital realm awaits your command! 🎮
    `);
}