/**
 * 🖥️ Terminal MUD Interface - The Unified Command Environment
 * Like a MUD but for our distributed computing architecture
 * Single terminal interface to control the entire ecosystem
 */

const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TerminalMUDInterface {
    constructor() {
        this.app = express();
        this.port = 7887;
        this.server = null;
        this.wsServer = null;
        
        // MUD-style World Map
        this.worldMap = {
            'spawn': {
                name: 'Terminal Hub',
                description: 'The central command hub where all systems converge',
                exits: ['blamechain', 'soulfra', 'web3', 'clarity', 'crawler', 'architecture'],
                commands: ['help', 'look', 'systems', 'status', 'map'],
                service: null
            },
            'blamechain': {
                name: 'BlameChain Archive Vault',
                description: 'A crystalline archive where every digital action is eternally recorded',
                exits: ['spawn', 'soulfra'],
                commands: ['archive', 'blame', 'history', 'register'],
                service: 'http://localhost:7877'
            },
            'soulfra': {
                name: 'Soulfra Trading Multiverse',
                description: 'Six trading outposts floating in dimensional space, each with its own cultural vibe',
                exits: ['spawn', 'blamechain', 'web3'],
                commands: ['trade', 'outposts', 'cringe', 'easter'],
                service: 'http://localhost:7881'
            },
            'web3': {
                name: 'Web3 Playable Gameworld',
                description: 'A living 3D world where AI builds structures and players can interact',
                exits: ['spawn', 'soulfra', 'clarity'],
                commands: ['build', 'cast', 'harvest', 'wallet'],
                service: 'http://localhost:7880'
            },
            'clarity': {
                name: 'Clarity Engine Reasoning Chamber',
                description: 'The brain of the operation - where all reasoning and decisions happen',
                exits: ['spawn', 'web3', 'crawler'],
                commands: ['reason', 'analyze', 'frameworks', 'handshake'],
                service: 'http://localhost:7882'
            },
            'crawler': {
                name: 'Onion Layer Crawler Network',
                description: 'Dark tunnels leading to the deep web, crawling with reasoning spiders',
                exits: ['spawn', 'clarity', 'architecture'],
                commands: ['crawl', 'layers', 'onion', 'workflow'],
                service: 'http://localhost:7884'
            },
            'architecture': {
                name: 'Architecture Control Tower',
                description: 'The master control system overseeing all limits and boundaries',
                exits: ['spawn', 'crawler'],
                commands: ['limits', 'monitor', 'enforce', 'optimize'],
                service: 'http://localhost:7886'
            }
        };
        
        // Active Sessions (like MUD players)
        this.activeSessions = new Map();
        
        // Command Processor
        this.commandProcessor = {
            // Global commands (work everywhere)
            global: {
                'help': this.cmdHelp.bind(this),
                'look': this.cmdLook.bind(this),
                'go': this.cmdGo.bind(this),
                'map': this.cmdMap.bind(this),
                'systems': this.cmdSystems.bind(this),
                'status': this.cmdStatus.bind(this),
                'who': this.cmdWho.bind(this),
                'say': this.cmdSay.bind(this),
                'broadcast': this.cmdBroadcast.bind(this),
                'sudo': this.cmdSudo.bind(this)
            },
            
            // Location-specific commands
            'blamechain': {
                'archive': this.cmdArchive.bind(this),
                'history': this.cmdHistory.bind(this),
                'register': this.cmdRegister.bind(this)
            },
            
            'soulfra': {
                'trade': this.cmdTrade.bind(this),
                'outposts': this.cmdOutposts.bind(this)
            },
            
            'web3': {
                'build': this.cmdBuild.bind(this),
                'cast': this.cmdCast.bind(this),
                'harvest': this.cmdHarvest.bind(this),
                'wallet': this.cmdWallet.bind(this)
            },
            
            'clarity': {
                'reason': this.cmdReason.bind(this),
                'analyze': this.cmdAnalyze.bind(this),
                'frameworks': this.cmdFrameworks.bind(this),
                'handshake': this.cmdHandshake.bind(this)
            },
            
            'crawler': {
                'crawl': this.cmdCrawl.bind(this),
                'layers': this.cmdLayers.bind(this),
                'onion': this.cmdOnion.bind(this),
                'workflow': this.cmdWorkflow.bind(this)
            },
            
            'architecture': {
                'limits': this.cmdLimits.bind(this),
                'monitor': this.cmdMonitor.bind(this),
                'enforce': this.cmdEnforce.bind(this),
                'optimize': this.cmdOptimize.bind(this)
            }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeMUD();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(this.generateTerminalInterface());
        });
        
        this.app.post('/command', async (req, res) => {
            try {
                const result = await this.processCommand(req.body);
                res.json(result);
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
    }
    
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ port: 7888 });
        
        this.wsServer.on('connection', (ws, req) => {
            const sessionId = this.generateSessionId();
            const session = {
                id: sessionId,
                ws: ws,
                location: 'spawn',
                username: `User${sessionId.substring(0, 4)}`,
                connected_at: Date.now(),
                last_activity: Date.now()
            };
            
            this.activeSessions.set(sessionId, session);
            
            // Send welcome message
            this.sendToSession(sessionId, {
                type: 'welcome',
                message: this.getWelcomeMessage(),
                location: session.location,
                prompt: this.getPrompt(session)
            });
            
            // Broadcast new user
            this.broadcastToAll({
                type: 'system',
                message: `${session.username} has connected to the Terminal MUD`,
                timestamp: Date.now()
            }, sessionId);
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketCommand(sessionId, data);
                } catch (error) {
                    this.sendToSession(sessionId, {
                        type: 'error',
                        message: `Error: ${error.message}`
                    });
                }
            });
            
            ws.on('close', () => {
                const session = this.activeSessions.get(sessionId);
                if (session) {
                    this.broadcastToAll({
                        type: 'system',
                        message: `${session.username} has disconnected`,
                        timestamp: Date.now()
                    }, sessionId);
                    this.activeSessions.delete(sessionId);
                }
            });
        });
    }
    
    initializeMUD() {
        console.log('🖥️ Initializing Terminal MUD Interface...');
        console.log('🗺️ World map loaded with', Object.keys(this.worldMap).length, 'locations');
        console.log('⌨️ Command processor ready');
    }
    
    async handleWebSocketCommand(sessionId, data) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;
        
        session.last_activity = Date.now();
        
        if (data.type === 'command') {
            const result = await this.processCommand({
                sessionId,
                command: data.command,
                location: session.location
            });
            
            this.sendToSession(sessionId, {
                type: 'command_result',
                result: result.output,
                success: result.success,
                location: session.location,
                prompt: this.getPrompt(session)
            });
            
            // Update session location if command moved user
            if (result.new_location) {
                session.location = result.new_location;
            }
        }
    }
    
    async processCommand(input) {
        const { sessionId, command, location } = input;
        const session = this.activeSessions.get(sessionId);
        
        if (!command || !command.trim()) {
            return { success: false, output: 'Please enter a command' };
        }
        
        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Check global commands first
        if (this.commandProcessor.global[cmd]) {
            return await this.commandProcessor.global[cmd](session, args);
        }
        
        // Check location-specific commands
        const currentLocation = session ? session.location : location;
        if (this.commandProcessor[currentLocation] && this.commandProcessor[currentLocation][cmd]) {
            return await this.commandProcessor[currentLocation][cmd](session, args);
        }
        
        // Try to proxy command to service
        const locationData = this.worldMap[currentLocation];
        if (locationData && locationData.service) {
            try {
                const serviceResult = await this.proxyToService(locationData.service, cmd, args);
                return { success: true, output: serviceResult };
            } catch (error) {
                return { success: false, output: `Service error: ${error.message}` };
            }
        }
        
        return { 
            success: false, 
            output: `Unknown command: ${cmd}. Type 'help' for available commands.` 
        };
    }
    
    // Global Commands
    async cmdHelp(session, args) {
        const location = this.worldMap[session.location];
        const globalCmds = Object.keys(this.commandProcessor.global).join(', ');
        const localCmds = this.commandProcessor[session.location] ? 
            Object.keys(this.commandProcessor[session.location]).join(', ') : 'none';
        
        const output = `
=== Terminal MUD Help ===

Location: ${location.name}
${location.description}

Global Commands: ${globalCmds}
Local Commands: ${localCmds}
Available Exits: ${location.exits.join(', ')}

Examples:
  help - show this help
  look - examine current location  
  go <location> - travel to another system
  map - show the world map
  systems - show all system status
  who - show connected users
        `;
        
        return { success: true, output };
    }
    
    async cmdLook(session, args) {
        const location = this.worldMap[session.location];
        let output = `
${location.name}
${location.description}

Available exits: ${location.exits.join(', ')}
Available commands: ${location.commands.join(', ')}
        `;
        
        // Show other users in the same location
        const othersHere = Array.from(this.activeSessions.values())
            .filter(s => s.location === session.location && s.id !== session.id)
            .map(s => s.username);
        
        if (othersHere.length > 0) {
            output += `\nOther users here: ${othersHere.join(', ')}`;
        }
        
        // Show service status if available
        if (location.service) {
            try {
                const status = await this.checkServiceStatus(location.service);
                output += `\nService Status: ${status.online ? '🟢 ONLINE' : '🔴 OFFLINE'}`;
            } catch (error) {
                output += `\nService Status: 🔴 OFFLINE`;
            }
        }
        
        return { success: true, output };
    }
    
    async cmdGo(session, args) {
        if (!args[0]) {
            return { success: false, output: 'Go where? Available exits: ' + this.worldMap[session.location].exits.join(', ') };
        }
        
        const destination = args[0].toLowerCase();
        const currentLocation = this.worldMap[session.location];
        
        if (!currentLocation.exits.includes(destination)) {
            return { success: false, output: `You can't go to '${destination}' from here. Available exits: ${currentLocation.exits.join(', ')}` };
        }
        
        if (!this.worldMap[destination]) {
            return { success: false, output: `Location '${destination}' does not exist.` };
        }
        
        // Move the user
        session.location = destination;
        
        // Announce departure
        this.broadcastToLocation(session.location, {
            type: 'movement',
            message: `${session.username} has arrived from ${currentLocation.name}`,
            timestamp: Date.now()
        }, session.id);
        
        // Show new location
        const lookResult = await this.cmdLook(session, []);
        return { 
            success: true, 
            output: `You travel to ${this.worldMap[destination].name}.\n\n${lookResult.output}`,
            new_location: destination
        };
    }
    
    async cmdMap(session, args) {
        const map = `
=== Terminal MUD World Map ===

    [spawn] ← Terminal Hub (You are ${session.location === 'spawn' ? 'HERE' : 'not here'})
        ↓
    [blamechain] ← Archive Vault (${session.location === 'blamechain' ? 'HERE' : 'Port 7877'})
        ↓
    [soulfra] ← Trading Multiverse (${session.location === 'soulfra' ? 'HERE' : 'Port 7881'})
        ↓
    [web3] ← Playable Gameworld (${session.location === 'web3' ? 'HERE' : 'Port 7880'})
        ↓
    [clarity] ← Reasoning Chamber (${session.location === 'clarity' ? 'HERE' : 'Port 7882'})
        ↓
    [crawler] ← Onion Network (${session.location === 'crawler' ? 'HERE' : 'Port 7884'})
        ↓
    [architecture] ← Control Tower (${session.location === 'architecture' ? 'HERE' : 'Port 7886'})

Use 'go <location>' to travel between systems.
        `;
        
        return { success: true, output: map };
    }
    
    async cmdSystems(session, args) {
        let output = '=== System Status ===\n\n';
        
        for (const [locationName, locationData] of Object.entries(this.worldMap)) {
            if (locationData.service) {
                try {
                    const status = await this.checkServiceStatus(locationData.service);
                    const icon = status.online ? '🟢' : '🔴';
                    output += `${icon} ${locationData.name} (${locationData.service})\n`;
                } catch (error) {
                    output += `🔴 ${locationData.name} (${locationData.service}) - ERROR\n`;
                }
            }
        }
        
        return { success: true, output };
    }
    
    async cmdStatus(session, args) {
        const totalSessions = this.activeSessions.size;
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();
        
        const output = `
=== Terminal MUD Status ===

Active Sessions: ${totalSessions}
Uptime: ${Math.floor(uptime / 60)} minutes
Memory Usage: ${Math.round(memUsage.rss / 1024 / 1024)}MB
Current Location: ${this.worldMap[session.location].name}
Your Session ID: ${session.id}
Connected At: ${new Date(session.connected_at).toLocaleTimeString()}
        `;
        
        return { success: true, output };
    }
    
    async cmdWho(session, args) {
        const users = Array.from(this.activeSessions.values())
            .map(s => `${s.username} (${this.worldMap[s.location].name})`)
            .join('\n');
        
        const output = `
=== Connected Users ===

${users || 'No users connected'}

Total: ${this.activeSessions.size} users
        `;
        
        return { success: true, output };
    }
    
    async cmdSay(session, args) {
        if (!args.length) {
            return { success: false, output: 'Say what?' };
        }
        
        const message = args.join(' ');
        this.broadcastToLocation(session.location, {
            type: 'chat',
            username: session.username,
            message: message,
            timestamp: Date.now()
        });
        
        return { success: true, output: `You say: "${message}"` };
    }
    
    async cmdBroadcast(session, args) {
        if (!args.length) {
            return { success: false, output: 'Broadcast what?' };
        }
        
        const message = args.join(' ');
        this.broadcastToAll({
            type: 'broadcast',
            username: session.username,
            message: message,
            timestamp: Date.now()
        });
        
        return { success: true, output: `You broadcast: "${message}"` };
    }
    
    async cmdSudo(session, args) {
        if (!args.length) {
            return { success: false, output: 'sudo: missing command' };
        }
        
        // Simulate admin access
        const command = args.join(' ');
        
        if (command === 'restart all') {
            this.broadcastToAll({
                type: 'system',
                message: '⚠️ SYSTEM RESTART INITIATED BY ADMIN',
                timestamp: Date.now()
            });
            return { success: true, output: 'All systems restart initiated...' };
        }
        
        if (command === 'status all') {
            const systemsResult = await this.cmdSystems(session, []);
            return { success: true, output: 'ADMIN STATUS:\n' + systemsResult.output };
        }
        
        return { success: true, output: `sudo: executed '${command}' with admin privileges` };
    }
    
    // Location-specific commands (examples)
    async cmdArchive(session, args) {
        return { success: true, output: 'Accessing BlameChain archives... Every action is recorded forever.' };
    }
    
    async cmdHistory(session, args) {
        return { success: true, output: 'Displaying BlameChain history... All actions traceable through blockchain.' };
    }
    
    async cmdRegister(session, args) {
        return { success: true, output: 'Registering new entry in BlameChain... Immutable record created.' };
    }
    
    async cmdTrade(session, args) {
        return { success: true, output: 'Opening Soulfra trading interface... Cultural exchanges happening across 6 outposts.' };
    }
    
    async cmdOutposts(session, args) {
        return { success: true, output: 'Available outposts: Earth-Classic, Nippon-Station, European-Hub, Russian-Zone, Scandinavian-Port, Korean-District' };
    }
    
    async cmdBuild(session, args) {
        return { success: true, output: 'AI swarm building structures in the Web3 world... 4 AI players active.' };
    }
    
    async cmdCast(session, args) {
        return { success: true, output: 'Casting spell in Web3 world... Magic crystals consumed.' };
    }
    
    async cmdHarvest(session, args) {
        return { success: true, output: 'Harvesting resources... Materials, energy, and crystals collected.' };
    }
    
    async cmdWallet(session, args) {
        return { success: true, output: 'MetaMask wallet integration... GameCoin and Crystal tokens available.' };
    }
    
    async cmdReason(session, args) {
        return { success: true, output: 'Engaging Clarity Engine... Cross-framework reasoning in progress.' };
    }
    
    async cmdAnalyze(session, args) {
        return { success: true, output: 'Analyzing with Clarity Engine... Processing patterns and contexts.' };
    }
    
    async cmdFrameworks(session, args) {
        return { success: true, output: 'Active frameworks: BlameChain, Soulfra, Web3, Chat Processor - All handshakes verified.' };
    }
    
    async cmdHandshake(session, args) {
        return { success: true, output: 'Performing framework handshake... Formal agreements established.' };
    }
    
    async cmdCrawl(session, args) {
        if (!args[0]) {
            return { success: false, output: 'Crawl what? Usage: crawl <url>' };
        }
        return { success: true, output: `Initiating onion layer crawl of ${args[0]}... Reasoning differentials active.` };
    }
    
    async cmdLayers(session, args) {
        return { success: true, output: 'Layer analysis: Surface Web, Deep Web, Dark Web, Onion Layer - All reasoning engines active.' };
    }
    
    async cmdOnion(session, args) {
        return { success: true, output: 'Onion network status: Tor proxy available, .onion domains supported with paranoid verification.' };
    }
    
    async cmdWorkflow(session, args) {
        return { success: true, output: 'Workflow memory: Learning patterns, automating tasks, preserving context across layers.' };
    }
    
    async cmdLimits(session, args) {
        return { success: true, output: 'Architecture limits: Memory 2048MB, Crawl depth 10, Network 1000 req/min, 5 boundaries enforced.' };
    }
    
    async cmdMonitor(session, args) {
        return { success: true, output: 'Monitoring all systems... Resource usage tracked, violations detected, health metrics active.' };
    }
    
    async cmdEnforce(session, args) {
        return { success: true, output: 'Enforcement actions: Throttle, Scale Down, Circuit Break, Emergency Stop - All available.' };
    }
    
    async cmdOptimize(session, args) {
        return { success: true, output: 'Optimizing architecture... Memory reallocation, connection pooling, cache optimization in progress.' };
    }
    
    // Utility methods
    generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }
    
    getWelcomeMessage() {
        return `
🖥️ Welcome to the Terminal MUD Interface
=====================================

You are now connected to a distributed computing environment
where each location represents a different service in our architecture.

Type 'help' for commands or 'look' to examine your surroundings.
Type 'map' to see the full world layout.

You start in the Terminal Hub - the central command center.
        `;
    }
    
    getPrompt(session) {
        const location = session.location;
        const locationData = this.worldMap[location];
        return `[${session.username}@${location}]$ `;
    }
    
    sendToSession(sessionId, data) {
        const session = this.activeSessions.get(sessionId);
        if (session && session.ws.readyState === WebSocket.OPEN) {
            session.ws.send(JSON.stringify(data));
        }
    }
    
    broadcastToAll(data, excludeSessionId = null) {
        this.activeSessions.forEach((session, sessionId) => {
            if (sessionId !== excludeSessionId && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify(data));
            }
        });
    }
    
    broadcastToLocation(location, data, excludeSessionId = null) {
        this.activeSessions.forEach((session, sessionId) => {
            if (session.location === location && sessionId !== excludeSessionId && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify(data));
            }
        });
    }
    
    async checkServiceStatus(serviceUrl) {
        try {
            const response = await axios.get(serviceUrl, { timeout: 5000 });
            return { online: true, status: response.status };
        } catch (error) {
            return { online: false, error: error.message };
        }
    }
    
    async proxyToService(serviceUrl, command, args) {
        // This would proxy commands to the actual services
        return `Proxied command '${command}' to ${serviceUrl}`;
    }
    
    generateTerminalInterface() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🖥️ Terminal MUD Interface</title>
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    background: #000;
                    color: #00ff00;
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    overflow: hidden;
                }
                .terminal {
                    height: 100vh;
                    padding: 20px;
                    box-sizing: border-box;
                    overflow-y: auto;
                    white-space: pre-wrap;
                }
                .output {
                    height: calc(100vh - 100px);
                    overflow-y: auto;
                    border: 1px solid #00ff00;
                    padding: 10px;
                    margin-bottom: 10px;
                    background: rgba(0, 255, 0, 0.02);
                }
                .input-line {
                    display: flex;
                    align-items: center;
                }
                .prompt {
                    color: #00ffff;
                    margin-right: 5px;
                }
                .input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    font-size: 16px;
                    outline: none;
                }
                .message {
                    margin: 2px 0;
                }
                .error { color: #ff4444; }
                .system { color: #ffff00; }
                .chat { color: #ff8800; }
                .broadcast { color: #ff00ff; }
                .cursor {
                    animation: blink 1s infinite;
                }
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                .status-bar {
                    position: fixed;
                    top: 0;
                    right: 0;
                    background: rgba(0, 255, 0, 0.1);
                    border: 1px solid #00ff00;
                    padding: 5px 10px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="status-bar" id="statusBar">
                🔌 Connecting...
            </div>
            
            <div class="terminal">
                <div class="output" id="output"></div>
                <div class="input-line">
                    <span class="prompt" id="prompt">[user@spawn]$ </span>
                    <input type="text" class="input" id="commandInput" autocomplete="off" />
                    <span class="cursor">_</span>
                </div>
            </div>
            
            <script>
                let ws;
                let currentPrompt = '[user@spawn]$ ';
                
                function connectWebSocket() {
                    ws = new WebSocket('ws://localhost:7888');
                    
                    ws.onopen = () => {
                        updateStatus('🟢 Connected');
                    };
                    
                    ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        handleMessage(data);
                    };
                    
                    ws.onclose = () => {
                        updateStatus('🔴 Disconnected');
                        setTimeout(connectWebSocket, 5000);
                    };
                    
                    ws.onerror = (error) => {
                        updateStatus('❌ Error');
                    };
                }
                
                function handleMessage(data) {
                    const output = document.getElementById('output');
                    
                    switch(data.type) {
                        case 'welcome':
                            addToOutput(data.message, 'system');
                            updatePrompt(data.prompt);
                            break;
                            
                        case 'command_result':
                            addToOutput(data.result, data.success ? '' : 'error');
                            if (data.prompt) updatePrompt(data.prompt);
                            break;
                            
                        case 'chat':
                            addToOutput(\`\${data.username} says: "\${data.message}"\`, 'chat');
                            break;
                            
                        case 'broadcast':
                            addToOutput(\`[BROADCAST] \${data.username}: \${data.message}\`, 'broadcast');
                            break;
                            
                        case 'system':
                            addToOutput(\`[SYSTEM] \${data.message}\`, 'system');
                            break;
                            
                        case 'movement':
                            addToOutput(data.message, 'system');
                            break;
                    }
                    
                    output.scrollTop = output.scrollHeight;
                }
                
                function addToOutput(message, className = '') {
                    const output = document.getElementById('output');
                    const div = document.createElement('div');
                    div.className = \`message \${className}\`;
                    div.textContent = message;
                    output.appendChild(div);
                }
                
                function updatePrompt(prompt) {
                    currentPrompt = prompt;
                    document.getElementById('prompt').textContent = prompt;
                }
                
                function updateStatus(status) {
                    document.getElementById('statusBar').textContent = status;
                }
                
                function sendCommand(command) {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'command',
                            command: command
                        }));
                        
                        // Echo the command
                        addToOutput(currentPrompt + command);
                    }
                }
                
                // Input handling
                document.getElementById('commandInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const command = e.target.value.trim();
                        if (command) {
                            sendCommand(command);
                            e.target.value = '';
                        }
                    }
                });
                
                // Focus on input
                document.getElementById('commandInput').focus();
                
                // Auto-focus when clicking anywhere
                document.addEventListener('click', () => {
                    document.getElementById('commandInput').focus();
                });
                
                // Connect on load
                connectWebSocket();
                
                // Add some helpful initial commands
                setTimeout(() => {
                    addToOutput('Try these commands to explore:', 'system');
                    addToOutput('  help - show all commands', 'system');
                    addToOutput('  look - examine your surroundings', 'system');
                    addToOutput('  map - see the world map', 'system');
                    addToOutput('  go <location> - travel to another system', 'system');
                    addToOutput('  systems - check all service status', 'system');
                    addToOutput('  who - see other connected users', 'system');
                    addToOutput('', 'system');
                }, 1000);
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🖥️ Terminal MUD Interface running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket server running on ws://localhost:7888`);
            console.log(`🗺️ World contains ${Object.keys(this.worldMap).length} locations`);
            console.log(`⌨️ ${Object.keys(this.commandProcessor.global).length} global commands available`);
            console.log('🎮 Ready for users to connect!');
        });
    }
}

// Initialize and start the Terminal MUD
const terminalMUD = new TerminalMUDInterface();
terminalMUD.start();

module.exports = TerminalMUDInterface;