#!/usr/bin/env node
// VISUAL-SYMPHONY-DASHBOARD.js - See all characters orchestrating with colors/symbols/tones

const http = require('http');
const WebSocket = require('ws');
const MasterAsyncOrchestrator = require('./MASTER-ASYNC-ORCHESTRATOR.js');

class VisualSymphonyDashboard {
    constructor() {
        this.port = 9999;
        this.wsPort = 9998;
        
        // Create and start orchestrator
        this.orchestrator = new MasterAsyncOrchestrator();
        this.wsClients = new Set();
        
        // Visual state
        this.visualState = {
            characters: new Map(),
            messages: [],
            tones: [],
            consensusTopics: [],
            harmonyPattern: 'consensus',
            beatVisualization: Array(8).fill(0)
        };
        
        console.log('🎨 VISUAL SYMPHONY DASHBOARD');
        console.log('============================');
        console.log('🌈 Colors, symbols, and tones');
        console.log('🎼 Real-time orchestration');
    }
    
    async start() {
        // Start the orchestrator
        await this.orchestrator.startOrchestration();
        
        // Hook into orchestrator events
        this.setupOrchestratorListeners();
        
        // Start web server
        this.startWebServer();
        
        // Start WebSocket
        this.startWebSocket();
        
        console.log(`\n🎨 Visual Symphony: http://localhost:${this.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    setupOrchestratorListeners() {
        // Listen for character messages
        this.orchestrator.on('character_message', (message) => {
            this.visualState.messages.unshift({
                ...message,
                id: Date.now() + Math.random()
            });
            
            // Keep only last 50 messages
            if (this.visualState.messages.length > 50) {
                this.visualState.messages = this.visualState.messages.slice(0, 50);
            }
            
            this.broadcast({
                type: 'character_message',
                message: message
            });
        });
        
        // Listen for tone events
        this.orchestrator.on('tone', (toneData) => {
            this.visualState.tones.push(toneData);
            
            // Update beat visualization
            const beatIndex = this.orchestrator.orchestrationState.beatIndex % 8;
            this.visualState.beatVisualization[beatIndex] = 1;
            
            // Decay other beats
            for (let i = 0; i < 8; i++) {
                if (i !== beatIndex) {
                    this.visualState.beatVisualization[i] *= 0.8;
                }
            }
            
            this.broadcast({
                type: 'tone_event',
                tone: toneData,
                beats: this.visualState.beatVisualization
            });
        });
        
        // Update character states
        setInterval(() => {
            const status = this.orchestrator.getOrchestrationStatus();
            
            status.characters.forEach(char => {
                this.visualState.characters.set(char.id, {
                    ...char,
                    ...this.orchestrator.characterRegistry[char.id]
                });
            });
            
            this.visualState.harmonyPattern = status.currentHarmony;
            
            this.broadcast({
                type: 'status_update',
                characters: Array.from(this.visualState.characters.values()),
                harmony: status.currentHarmony,
                queueLength: status.messageQueueLength
            });
        }, 1000);
    }
    
    startWebServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            if (req.url === '/') {
                this.serveDashboard(res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port);
    }
    
    startWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🎨 Visual client connected');
            this.wsClients.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial_state',
                characters: Array.from(this.visualState.characters.values()),
                messages: this.visualState.messages.slice(0, 10),
                harmony: this.visualState.harmonyPattern
            }));
            
            ws.on('close', () => {
                this.wsClients.delete(ws);
            });
        });
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wsClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    serveDashboard(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎨 Visual Symphony Dashboard</title>
    <style>
        body { 
            margin: 0; 
            background: #000; 
            color: #fff; 
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        
        #canvas {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1;
        }
        
        .overlay {
            position: fixed;
            z-index: 2;
            padding: 20px;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .header {
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            font-size: 2em;
            text-shadow: 0 0 20px #fff;
        }
        
        .character-grid {
            top: 100px;
            left: 20px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            max-width: 600px;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .character-node {
            background: rgba(255,255,255,0.1);
            border: 2px solid;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .character-node:hover {
            transform: scale(1.05);
            background: rgba(255,255,255,0.2);
        }
        
        .message-feed {
            top: 100px;
            right: 20px;
            width: 400px;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .message-item {
            background: rgba(255,255,255,0.05);
            border-left: 3px solid;
            padding: 10px;
            margin: 5px 0;
            border-radius: 0 10px 10px 0;
            animation: slideIn 0.5s;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .beat-visualizer {
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        }
        
        .beat {
            width: 40px;
            height: 100px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            overflow: hidden;
            position: relative;
        }
        
        .beat-fill {
            position: absolute;
            bottom: 0;
            width: 100%;
            background: linear-gradient(to top, #00ff88, #00ffff);
            transition: height 0.1s;
        }
        
        .harmony-indicator {
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            font-size: 1.5em;
        }
        
        .symbol-display {
            font-size: 2em;
            margin: 5px 0;
        }
        
        .tone-indicator {
            font-size: 0.8em;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    
    <div class="overlay header">
        🎨 VISUAL SYMPHONY
    </div>
    
    <div class="overlay character-grid" id="characters">
        <!-- Characters will be populated here -->
    </div>
    
    <div class="overlay message-feed" id="messages">
        <h3>💬 Live Communications</h3>
        <!-- Messages will be populated here -->
    </div>
    
    <div class="overlay harmony-indicator" id="harmony">
        <div>🎵 Harmony: <span id="harmony-pattern">consensus</span></div>
        <div>📊 Queue: <span id="queue-length">0</span></div>
    </div>
    
    <div class="overlay beat-visualizer" id="beats">
        <div class="beat"><div class="beat-fill" style="height: 0%"></div></div>
        <div class="beat"><div class="beat-fill" style="height: 0%"></div></div>
        <div class="beat"><div class="beat-fill" style="height: 0%"></div></div>
        <div class="beat"><div class="beat-fill" style="height: 0%"></div></div>
        <div class="beat"><div class="beat-fill" style="height: 0%"></div></div>
        <div class="beat"><div class="beat-fill" style="height: 0%"></div></div>
        <div class="beat"><div class="beat-fill" style="height: 0%"></div></div>
        <div class="beat"><div class="beat-fill" style="height: 0%"></div></div>
    </div>
    
    <script>
        // Canvas setup for background visualization
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Particle system for background
        const particles = [];
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.color = \`hsla(\${Math.random() * 360}, 100%, 50%, 0.5)\`;
            }
            
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
            
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Create particles
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }
        
        // Animation loop
        function animate() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            
            requestAnimationFrame(animate);
        }
        animate();
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        const state = {
            characters: new Map(),
            messages: [],
            beats: Array(8).fill(0)
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        function handleMessage(data) {
            switch (data.type) {
                case 'initial_state':
                    data.characters.forEach(char => {
                        state.characters.set(char.id, char);
                    });
                    updateCharacterDisplay();
                    data.messages.forEach(msg => addMessage(msg));
                    break;
                    
                case 'character_message':
                    addMessage(data.message);
                    highlightCharacter(data.message.character);
                    break;
                    
                case 'tone_event':
                    updateBeats(data.beats);
                    createToneVisual(data.tone);
                    break;
                    
                case 'status_update':
                    updateStatus(data);
                    break;
            }
        }
        
        function updateCharacterDisplay() {
            const container = document.getElementById('characters');
            container.innerHTML = '<h3>🎭 Active Characters</h3>';
            
            state.characters.forEach(char => {
                const node = document.createElement('div');
                node.className = 'character-node';
                node.id = \`char-\${char.id}\`;
                node.style.borderColor = char.colors ? char.colors[0] : '#fff';
                
                node.innerHTML = \`
                    <div class="symbol-display">\${char.symbols ? char.symbols[0] : '?'}</div>
                    <div><strong>\${char.id}</strong></div>
                    <div>\${char.language || 'UNKNOWN'}</div>
                    <div class="tone-indicator">♪ \${char.tone || 0}Hz</div>
                    <div style="color: \${char.colors ? char.colors[0] : '#fff'}">●●●</div>
                \`;
                
                container.appendChild(node);
            });
        }
        
        function addMessage(msg) {
            const container = document.getElementById('messages');
            if (container.children.length === 1) {
                container.innerHTML = '<h3>💬 Live Communications</h3>';
            }
            
            const item = document.createElement('div');
            item.className = 'message-item';
            item.style.borderColor = msg.color || '#fff';
            
            item.innerHTML = \`
                <div style="color: \${msg.color || '#fff'}">
                    <strong>\${msg.symbol || '?'} \${msg.character || 'unknown'}</strong>
                </div>
                <div>\${msg.content || 'no content'}</div>
                <div style="font-size: 0.8em; opacity: 0.7">
                    \${new Date(msg.timestamp).toLocaleTimeString()}
                </div>
            \`;
            
            container.insertBefore(item, container.children[1]);
            
            // Keep only 20 messages
            while (container.children.length > 21) {
                container.removeChild(container.lastChild);
            }
        }
        
        function highlightCharacter(charId) {
            const node = document.getElementById(\`char-\${charId}\`);
            if (node) {
                node.style.animation = 'pulse 0.5s';
                setTimeout(() => {
                    node.style.animation = '';
                }, 500);
            }
        }
        
        function updateBeats(beats) {
            const beatElements = document.querySelectorAll('.beat-fill');
            beats.forEach((value, index) => {
                if (beatElements[index]) {
                    beatElements[index].style.height = \`\${value * 100}%\`;
                }
            });
        }
        
        function createToneVisual(tone) {
            // Create a visual ripple at character position
            const char = state.characters.get(tone.character);
            if (char) {
                const particle = new Particle();
                particle.color = char.colors ? char.colors[0] : '#fff';
                particle.size = 10;
                particles.push(particle);
                
                // Remove oldest particle if too many
                if (particles.length > 200) {
                    particles.shift();
                }
            }
        }
        
        function updateStatus(data) {
            document.getElementById('harmony-pattern').textContent = data.harmony;
            document.getElementById('queue-length').textContent = data.queueLength;
            
            // Update character states
            data.characters.forEach(char => {
                const existing = state.characters.get(char.id);
                if (existing) {
                    Object.assign(existing, char);
                } else {
                    state.characters.set(char.id, char);
                }
            });
            
            updateCharacterDisplay();
        }
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); box-shadow: 0 0 20px currentColor; }
                100% { transform: scale(1); }
            }
        \`;
        document.head.appendChild(style);
        
        // Resize canvas on window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// START THE VISUAL SYMPHONY
if (require.main === module) {
    console.log('🎨 STARTING VISUAL SYMPHONY DASHBOARD');
    console.log('=====================================');
    
    const dashboard = new VisualSymphonyDashboard();
    
    dashboard.start().catch(err => {
        console.error('Failed to start:', err);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n⚠️ Shutting down Visual Symphony...');
        await dashboard.orchestrator.stopOrchestration();
        process.exit(0);
    });
}

module.exports = VisualSymphonyDashboard;