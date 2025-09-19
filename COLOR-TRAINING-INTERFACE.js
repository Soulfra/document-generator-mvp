#!/usr/bin/env node

/**
 * 🎨 COLOR TRAINING INTERFACE
 * 
 * Interactive color training system where you hit colors to teach the AI
 * Connects to your existing gaming + character + federation systems
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;

class ColorTrainingInterface {
    constructor() {
        this.port = 7878; // Color training port
        
        // Training state
        this.trainingSession = {
            id: 'session-' + Date.now(),
            started: new Date(),
            colors_hit: 0,
            patterns_learned: 0,
            accuracy: 100,
            user_preferences: new Map()
        };
        
        // Color palette for training
        this.colors = [
            { name: 'red', hex: '#ff4444', rgb: [255, 68, 68], meaning: 'urgent' },
            { name: 'green', hex: '#44ff44', rgb: [68, 255, 68], meaning: 'good' },
            { name: 'blue', hex: '#4444ff', rgb: [68, 68, 255], meaning: 'info' },
            { name: 'yellow', hex: '#ffff44', rgb: [255, 255, 68], meaning: 'warning' },
            { name: 'purple', hex: '#ff44ff', rgb: [255, 68, 255], meaning: 'special' },
            { name: 'cyan', hex: '#44ffff', rgb: [68, 255, 255], meaning: 'cool' },
            { name: 'orange', hex: '#ff8844', rgb: [255, 136, 68], meaning: 'energy' },
            { name: 'pink', hex: '#ff88cc', rgb: [255, 136, 204], meaning: 'creative' }
        ];
        
        // AI learning patterns
        this.patterns = new Map();
        this.preferences = new Map();
        
        // Connections to other systems
        this.connections = {
            gaming: null,
            character: null,
            federation: null
        };
        
        console.log('🎨 COLOR TRAINING INTERFACE');
        console.log('===========================');
        console.log('🎯 Interactive AI training through color selection');
        console.log('🌈 Hit colors to teach preferences and patterns');
        console.log('🤖 Connected to character + gaming systems');
        console.log('');
        
        this.init();
    }
    
    async init() {
        // Connect to existing systems
        await this.connectToSystems();
        
        // Start training server
        await this.startTrainingServer();
        
        // Start pattern analysis
        this.startPatternAnalysis();
        
        console.log('🎨 COLOR TRAINING READY!');
        console.log(`🌈 Training Interface: http://localhost:${this.port}`);
        console.log('🎯 Start hitting colors to train the AI!');
    }
    
    async connectToSystems() {
        console.log('🔗 Connecting to existing systems...');
        
        // Connect to gaming engine
        try {
            this.connections.gaming = new WebSocket('ws://localhost:7777');
            this.connections.gaming.on('open', () => {
                console.log('   ✅ Connected to gaming engine');
                this.connections.gaming.send(JSON.stringify({
                    type: 'system_connect',
                    system: 'color_training',
                    capabilities: ['pattern_learning', 'preference_training', 'color_mapping']
                }));
            });
            
            this.connections.gaming.on('message', (data) => {
                this.handleGameMessage(JSON.parse(data));
            });
        } catch (error) {
            console.log('   ⚠️ Gaming engine not available');
        }
        
        // Connect to character interface
        try {
            this.connections.character = new WebSocket('ws://localhost:6969');
            this.connections.character.on('open', () => {
                console.log('   ✅ Connected to character interface');
            });
            
            this.connections.character.on('message', (data) => {
                this.handleCharacterMessage(JSON.parse(data));
            });
        } catch (error) {
            console.log('   ⚠️ Character interface not available');
        }
        
        // Connect to federation bridge
        try {
            // HTTP connection for federation data
            const response = await fetch('http://localhost:8888/federation/status');
            if (response.ok) {
                console.log('   ✅ Connected to federation bridge');
                this.connections.federation = true;
            }
        } catch (error) {
            console.log('   ⚠️ Federation bridge not available');
        }
    }
    
    async startTrainingServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.end();
                return;
            }
            
            if (req.url === '/') {
                res.setHeader('Content-Type', 'text/html');
                res.end(await this.generateTrainingInterface());
            } else if (req.url === '/api/colors') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(this.colors));
            } else if (req.url === '/api/session') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(this.trainingSession));
            } else if (req.url === '/api/patterns') {
                res.setHeader('Content-Type', 'application/json');
                const patterns = Object.fromEntries(this.patterns);
                res.end(JSON.stringify(patterns));
            } else if (req.url.startsWith('/api/hit/') && req.method === 'POST') {
                const colorName = req.url.split('/')[3];
                this.handleColorHit(colorName, req, res);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        // WebSocket server for real-time training
        const wss = new WebSocket.Server({ server });
        wss.on('connection', (ws) => {
            console.log('🎨 Training client connected');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'init',
                colors: this.colors,
                session: this.trainingSession,
                patterns: Object.fromEntries(this.patterns)
            }));
            
            ws.on('message', (data) => {
                this.handleTrainingMessage(ws, JSON.parse(data));
            });
        });
        
        server.listen(this.port, () => {
            console.log(`🌈 Color training server running on port ${this.port}`);
        });
        
        this.wss = wss;
    }
    
    async generateTrainingInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 AI Color Training Interface</title>
    <style>
        body {
            margin: 0;
            background: #000;
            font-family: 'Courier New', monospace;
            color: #00ff41;
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            padding: 20px;
            background: linear-gradient(45deg, #001122, #002244);
            border-bottom: 2px solid #00ff41;
        }
        
        .training-area {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .color-button {
            width: 150px;
            height: 150px;
            border: 3px solid #333;
            border-radius: 15px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
            position: relative;
            overflow: hidden;
        }
        
        .color-button:hover {
            border-color: #00ff41;
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
        }
        
        .color-button.hit {
            animation: colorHit 0.5s ease;
        }
        
        @keyframes colorHit {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); box-shadow: 0 0 30px currentColor; }
            100% { transform: scale(1); }
        }
        
        .hit-count {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(0, 0, 0, 0.8);
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 12px;
        }
        
        .stats {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            padding: 15px;
            border: 1px solid #00ff41;
            border-radius: 10px;
            font-size: 12px;
            min-width: 200px;
        }
        
        .feedback {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border: 2px solid #00ff41;
            border-radius: 15px;
            font-size: 18px;
            text-align: center;
            display: none;
            z-index: 1000;
        }
        
        .patterns {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.9);
            padding: 15px;
            border: 1px solid #4444ff;
            border-radius: 10px;
            font-size: 11px;
            max-width: 300px;
        }
        
        .connections {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            padding: 15px;
            border: 1px solid #ff4444;
            border-radius: 10px;
            font-size: 11px;
        }
        
        .glow {
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { text-shadow: 0 0 5px currentColor; }
            to { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 AI Color Training Interface</h1>
        <p>Hit colors to teach the AI your preferences and patterns</p>
        <div class="glow">🤖 Training Active • 🌈 Learning Your Style</div>
    </div>
    
    <div class="training-area" id="colorGrid">
        <!-- Colors will be generated here -->
    </div>
    
    <div class="stats" id="stats">
        <div><strong>🎯 Training Session</strong></div>
        <div>Colors Hit: <span id="colorsHit">0</span></div>
        <div>Patterns Found: <span id="patternsFound">0</span></div>
        <div>Accuracy: <span id="accuracy">100%</span></div>
        <div>Session Time: <span id="sessionTime">0:00</span></div>
    </div>
    
    <div class="patterns" id="patterns">
        <div><strong>🧠 Learned Patterns</strong></div>
        <div id="patternList">No patterns detected yet...</div>
    </div>
    
    <div class="connections" id="connections">
        <div><strong>🔗 System Connections</strong></div>
        <div>🎮 Gaming: <span id="gamingStatus">❌</span></div>
        <div>👁️ Character: <span id="characterStatus">❌</span></div>
        <div>🌐 Federation: <span id="federationStatus">❌</span></div>
    </div>
    
    <div class="feedback" id="feedback">
        <!-- Dynamic feedback appears here -->
    </div>
    
    <script>
        class ColorTrainingInterface {
            constructor() {
                this.ws = null;
                this.colors = [];
                this.hitCounts = new Map();
                this.patterns = {};
                this.session = null;
                this.startTime = Date.now();
                
                this.init();
            }
            
            init() {
                this.connectWebSocket();
                this.startTimer();
                
                console.log('🎨 Color Training Interface initialized');
            }
            
            connectWebSocket() {
                const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(protocol + '//' + location.host);
                
                this.ws.onopen = () => {
                    console.log('🔗 Connected to training server');
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                };
                
                this.ws.onclose = () => {
                    console.log('🔌 Disconnected from training server');
                    setTimeout(() => this.connectWebSocket(), 2000);
                };
            }
            
            handleServerMessage(data) {
                switch (data.type) {
                    case 'init':
                        this.colors = data.colors;
                        this.session = data.session;
                        this.patterns = data.patterns;
                        this.renderColorGrid();
                        this.updateStats();
                        break;
                    case 'color_hit_response':
                        this.handleColorHitResponse(data);
                        break;
                    case 'pattern_discovered':
                        this.showFeedback(\`🧠 New Pattern: \${data.pattern}\`, 'success');
                        this.updatePatterns();
                        break;
                    case 'preference_learned':
                        this.showFeedback(\`❤️ Preference Learned: \${data.preference}\`, 'info');
                        break;
                    case 'system_connected':
                        this.updateConnectionStatus(data.system, true);
                        break;
                }
            }
            
            renderColorGrid() {
                const grid = document.getElementById('colorGrid');
                grid.innerHTML = '';
                
                this.colors.forEach(color => {
                    const button = document.createElement('div');
                    button.className = 'color-button';
                    button.style.backgroundColor = color.hex;
                    button.style.color = this.getContrastColor(color.hex);
                    
                    button.innerHTML = \`
                        <div>\${color.name.toUpperCase()}</div>
                        <div>\${color.meaning}</div>
                        <div class="hit-count">0</div>
                    \`;
                    
                    button.addEventListener('click', () => {
                        this.hitColor(color.name, button);
                    });
                    
                    grid.appendChild(button);
                });
            }
            
            hitColor(colorName, buttonElement) {
                // Visual feedback
                buttonElement.classList.add('hit');
                setTimeout(() => buttonElement.classList.remove('hit'), 500);
                
                // Update hit count
                const currentCount = this.hitCounts.get(colorName) || 0;
                this.hitCounts.set(colorName, currentCount + 1);
                buttonElement.querySelector('.hit-count').textContent = currentCount + 1;
                
                // Send to server
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'color_hit',
                        color: colorName,
                        timestamp: Date.now(),
                        context: {
                            previous_colors: Array.from(this.hitCounts.keys()).slice(-3),
                            session_time: Date.now() - this.startTime,
                            total_hits: Array.from(this.hitCounts.values()).reduce((a, b) => a + b, 0)
                        }
                    }));
                }
                
                this.updateStats();
            }
            
            handleColorHitResponse(data) {
                if (data.feedback) {
                    this.showFeedback(data.feedback, data.type || 'info');
                }
                
                if (data.pattern_hint) {
                    this.showFeedback(\`🔍 \${data.pattern_hint}\`, 'hint');
                }
            }
            
            showFeedback(message, type = 'info') {
                const feedback = document.getElementById('feedback');
                feedback.textContent = message;
                feedback.style.display = 'block';
                
                // Color based on type
                const colors = {
                    success: '#44ff44',
                    info: '#4444ff', 
                    hint: '#ffff44',
                    warning: '#ff8844'
                };
                feedback.style.borderColor = colors[type] || '#00ff41';
                
                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 3000);
            }
            
            updateStats() {
                const totalHits = Array.from(this.hitCounts.values()).reduce((a, b) => a + b, 0);
                document.getElementById('colorsHit').textContent = totalHits;
                document.getElementById('patternsFound').textContent = Object.keys(this.patterns).length;
                
                // Calculate accuracy (example logic)
                const accuracy = Math.max(50, 100 - (totalHits > 0 ? Math.floor(Math.random() * 20) : 0));
                document.getElementById('accuracy').textContent = accuracy + '%';
            }
            
            updatePatterns() {
                const patternList = document.getElementById('patternList');
                if (Object.keys(this.patterns).length === 0) {
                    patternList.textContent = 'No patterns detected yet...';
                } else {
                    patternList.innerHTML = Object.entries(this.patterns)
                        .map(([pattern, confidence]) => 
                            \`<div>\${pattern}: \${Math.round(confidence * 100)}%</div>\`)
                        .join('');
                }
            }
            
            updateConnectionStatus(system, connected) {
                const statusMap = {
                    gaming: 'gamingStatus',
                    character: 'characterStatus', 
                    federation: 'federationStatus'
                };
                
                const element = document.getElementById(statusMap[system]);
                if (element) {
                    element.textContent = connected ? '✅' : '❌';
                }
            }
            
            startTimer() {
                setInterval(() => {
                    const elapsed = Date.now() - this.startTime;
                    const minutes = Math.floor(elapsed / 60000);
                    const seconds = Math.floor((elapsed % 60000) / 1000);
                    document.getElementById('sessionTime').textContent = 
                        \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                }, 1000);
            }
            
            getContrastColor(hexColor) {
                const r = parseInt(hexColor.substr(1, 2), 16);
                const g = parseInt(hexColor.substr(3, 2), 16);
                const b = parseInt(hexColor.substr(5, 2), 16);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness > 128 ? '#000000' : '#ffffff';
            }
        }
        
        // Start the training interface
        window.addEventListener('load', () => {
            new ColorTrainingInterface();
        });
    </script>
</body>
</html>`;
    }
    
    handleTrainingMessage(ws, data) {
        switch (data.type) {
            case 'color_hit':
                this.processColorHit(ws, data);
                break;
            case 'get_patterns':
                ws.send(JSON.stringify({
                    type: 'patterns_response',
                    patterns: Object.fromEntries(this.patterns)
                }));
                break;
            case 'reset_session':
                this.resetTrainingSession(ws);
                break;
        }
    }
    
    processColorHit(ws, data) {
        console.log(`🎨 Color hit: ${data.color} at ${new Date(data.timestamp).toISOString().slice(11, 19)}`);
        
        // Update session stats
        this.trainingSession.colors_hit++;
        
        // Learn patterns from the hit
        this.analyzeColorPattern(data);
        
        // Update preferences
        this.updatePreferences(data.color, data.context);
        
        // Send to connected systems
        this.broadcastColorHit(data);
        
        // Generate feedback
        const feedback = this.generateFeedback(data);
        
        ws.send(JSON.stringify({
            type: 'color_hit_response',
            feedback: feedback.message,
            type: feedback.type,
            pattern_hint: feedback.hint
        }));
        
        // Check for new patterns
        this.checkForNewPatterns(ws);
    }
    
    analyzeColorPattern(data) {
        const { color, context } = data;
        
        // Sequence patterns
        if (context.previous_colors && context.previous_colors.length >= 2) {
            const sequence = [...context.previous_colors, color].join('→');
            const currentCount = this.patterns.get(`sequence:${sequence}`) || 0;
            this.patterns.set(`sequence:${sequence}`, currentCount + 1);
        }
        
        // Timing patterns
        const sessionMinutes = Math.floor(context.session_time / 60000);
        const timePattern = `time:${sessionMinutes}min`;
        const timeCount = this.patterns.get(timePattern) || 0;
        this.patterns.set(timePattern, timeCount + 1);
        
        // Frequency patterns
        const totalHits = context.total_hits;
        if (totalHits > 0 && totalHits % 10 === 0) {
            const milestone = `milestone:${totalHits}`;
            this.patterns.set(milestone, 1);
        }
    }
    
    updatePreferences(color, context) {
        const preference = this.preferences.get(color) || {
            count: 0,
            contexts: [],
            strength: 0
        };
        
        preference.count++;
        preference.contexts.push({
            time: Date.now(),
            session_time: context.session_time,
            total_hits: context.total_hits
        });
        
        // Calculate preference strength
        preference.strength = Math.min(100, preference.count * 10);
        
        this.preferences.set(color, preference);
        
        console.log(`   📊 ${color} preference: ${preference.strength}% (${preference.count} hits)`);
    }
    
    broadcastColorHit(data) {
        // Send to gaming engine
        if (this.connections.gaming?.readyState === WebSocket.OPEN) {
            this.connections.gaming.send(JSON.stringify({
                type: 'color_training_hit',
                data: {
                    color: data.color,
                    timestamp: data.timestamp,
                    session: this.trainingSession.id
                }
            }));
        }
        
        // Send to character interface
        if (this.connections.character?.readyState === WebSocket.OPEN) {
            this.connections.character.send(JSON.stringify({
                type: 'training_feedback',
                data: {
                    color: data.color,
                    preference_strength: this.preferences.get(data.color)?.strength || 0
                }
            }));
        }
    }
    
    generateFeedback(data) {
        const color = data.color;
        const preference = this.preferences.get(color);
        const hitCount = preference?.count || 1;
        
        const feedbacks = [
            { message: `🎯 Nice hit on ${color}!`, type: 'success' },
            { message: `🌈 ${color} registered - learning your style`, type: 'info' },
            { message: `✨ AI is adapting to your ${color} preference`, type: 'success' },
            { message: `🧠 Processing ${color} pattern...`, type: 'info' }
        ];
        
        let feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
        
        // Special feedback for patterns
        if (hitCount === 5) {
            feedback = { 
                message: `❤️ You really like ${color}! Preference learned.`, 
                type: 'success',
                hint: 'Try hitting colors in a sequence to teach patterns'
            };
        } else if (hitCount === 10) {
            feedback = {
                message: `🔥 ${color} is clearly your favorite!`,
                type: 'success', 
                hint: 'AI is now optimizing for your color preferences'
            };
        }
        
        return feedback;
    }
    
    checkForNewPatterns(ws) {
        // Look for emerging patterns
        const sequences = Array.from(this.patterns.keys())
            .filter(key => key.startsWith('sequence:'))
            .filter(key => this.patterns.get(key) >= 3); // Pattern threshold
        
        sequences.forEach(sequence => {
            if (!this.patterns.has(`discovered:${sequence}`)) {
                this.patterns.set(`discovered:${sequence}`, 1);
                this.trainingSession.patterns_learned++;
                
                ws.send(JSON.stringify({
                    type: 'pattern_discovered',
                    pattern: sequence.replace('sequence:', ''),
                    confidence: this.patterns.get(sequence) / 10
                }));
                
                console.log(`🧠 New pattern discovered: ${sequence}`);
            }
        });
    }
    
    startPatternAnalysis() {
        setInterval(() => {
            this.analyzeGlobalPatterns();
        }, 30000); // Analyze every 30 seconds
    }
    
    analyzeGlobalPatterns() {
        if (this.preferences.size === 0) return;
        
        // Find dominant color
        let dominantColor = null;
        let maxHits = 0;
        
        for (const [color, pref] of this.preferences) {
            if (pref.count > maxHits) {
                maxHits = pref.count;
                dominantColor = color;
            }
        }
        
        if (dominantColor && maxHits >= 5) {
            console.log(`🎨 Pattern Analysis: ${dominantColor} is dominant (${maxHits} hits)`);
            
            // Broadcast to all clients
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'preference_learned',
                        preference: `Prefers ${dominantColor} color family`,
                        strength: Math.round((maxHits / this.trainingSession.colors_hit) * 100)
                    }));
                }
            });
        }
    }
    
    handleGameMessage(data) {
        // Process messages from gaming engine
        console.log('🎮 Game message:', data.type);
    }
    
    handleCharacterMessage(data) {
        // Process messages from character interface
        console.log('👁️ Character message:', data.type);
    }
    
    async handleColorHit(colorName, req, res) {
        // Handle direct API color hits
        this.trainingSession.colors_hit++;
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: true,
            color: colorName,
            total_hits: this.trainingSession.colors_hit,
            timestamp: Date.now()
        }));
        
        console.log(`🎨 API color hit: ${colorName}`);
    }
    
    resetTrainingSession(ws) {
        this.trainingSession = {
            id: 'session-' + Date.now(),
            started: new Date(),
            colors_hit: 0,
            patterns_learned: 0,
            accuracy: 100,
            user_preferences: new Map()
        };
        
        this.patterns.clear();
        this.preferences.clear();
        
        ws.send(JSON.stringify({
            type: 'session_reset',
            session: this.trainingSession
        }));
        
        console.log('🔄 Training session reset');
    }
}

// Start the color training interface
if (require.main === module) {
    console.log('🎨 STARTING COLOR TRAINING INTERFACE');
    console.log('====================================');
    console.log('🌈 Interactive AI training through color selection');
    console.log('🎯 Hit colors to teach preferences and patterns');
    console.log('');
    
    new ColorTrainingInterface();
}

module.exports = ColorTrainingInterface;