#!/usr/bin/env node

/**
 * 🎮 3D GAME SERVER - Serve actual 3D games with eye/body structure
 * 
 * Serves the real 3D/WebGL games instead of 2D interfaces
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

class Game3DServer {
    constructor() {
        this.port = 9000;
        
        // Available 3D games
        this.games = new Map([
            ['fog-war', 'fog-of-war-3d-explorer.html'],
            ['api-world', '3D-API-WORLD.html'],
            ['universe', '459-LAYER-3D-GAMING-UNIVERSE.html'],
            ['ai-world', 'AI-GAME-WORLD.html'],
            ['voxel', '3d-voxel-document-processor.html'],
            ['commander', '4.5d-commander-world.html'],
            ['spatial', '3D-AUDIO-SPATIAL-MCAT-SYSTEM.html']
        ]);
        
        // Eye/body structure systems
        this.eyeBodySystems = new Map([
            ['eyeball-monitor', 'agent-eyeball-monitor.js'],
            ['neural-viz', 'full-body-neural-visualization.html'],
            ['minimap-eye', 'minimap-eyeball-system.js'],
            ['omniscient-eye', 'omniscient-eyeball-orchestrator.js'],
            ['body-soul', 'body-soul-binding.xml']
        ]);
        
        this.init();
    }
    
    async init() {
        console.log('🎮 Starting 3D Game Server...');
        console.log('🎯 Serving actual 3D games with eye/body structure');
        
        this.startServer();
        
        console.log(`✅ 3D Game Server running on port ${this.port}`);
        console.log('🎮 Available games:');
        for (const [name, file] of this.games) {
            console.log(`   • ${name}: /${name}`);
        }
    }
    
    startServer() {
        const server = http.createServer(async (req, res) => {
            await this.handleRequest(req, res);
        });
        
        server.listen(this.port);
    }
    
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname.replace('/', '');
        
        try {
            if (!path || path === '') {
                await this.showGameLauncher(res);
            } else if (this.games.has(path)) {
                await this.serveGame(path, res);
            } else if (this.eyeBodySystems.has(path)) {
                await this.serveEyeBodySystem(path, res);
            } else if (path === 'random') {
                await this.serveRandomGame(res);
            } else if (path === 'unified') {
                await this.serveFile('unified-sandbox-game.html', res);
            } else if (path === 'test-ollama') {
                await this.serveFile('test-ollama-integration.html', res);
            } else if (path === 'world-builder') {
                await this.serveFile('unified-sandbox-world-builder.html', res);
            } else {
                await this.show404(res);
            }
        } catch (error) {
            console.error('Server error:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal server error');
        }
    }
    
    async serveGame(gameName, res) {
        const filename = this.games.get(gameName);
        
        try {
            const content = await fs.readFile(filename, 'utf8');
            
            // Inject eye/body structure integration
            const enhancedContent = this.enhanceWithEyeBody(content, gameName);
            
            res.writeHead(200, { 
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
            });
            res.end(enhancedContent);
            
            console.log(`🎮 Served 3D game: ${gameName} (${filename})`);
            
        } catch (error) {
            console.error(`Failed to serve game ${gameName}:`, error);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`Game not found: ${gameName}`);
        }
    }
    
    enhanceWithEyeBody(gameContent, gameName) {
        // Inject eye/body structure monitoring
        const eyeBodyScript = `
            <script>
                // Eye/Body Structure Integration
                class EyeBodyStructure {
                    constructor() {
                        this.eyes = { scanning: true, focus: null };
                        this.body = { connected: true, input: 'gamepad' };
                        this.neural = { active: true, pattern: 'gaming' };
                        
                        this.startMonitoring();
                    }
                    
                    startMonitoring() {
                        // Monitor eye movement/focus
                        document.addEventListener('mousemove', (e) => {
                            this.eyes.focus = { x: e.clientX, y: e.clientY };
                            this.sendEyeData();
                        });
                        
                        // Monitor body input
                        document.addEventListener('keydown', (e) => {
                            this.body.input = 'keyboard';
                            this.sendBodyData();
                        });
                        
                        // Send status every second
                        setInterval(() => {
                            this.sendStatus();
                        }, 1000);
                    }
                    
                    sendEyeData() {
                        // Send to eye monitoring system
                        fetch('/eye-update', {
                            method: 'POST',
                            body: JSON.stringify(this.eyes),
                            headers: { 'Content-Type': 'application/json' }
                        }).catch(() => {}); // Ignore errors
                    }
                    
                    sendBodyData() {
                        // Send to body structure system
                        fetch('/body-update', {
                            method: 'POST',
                            body: JSON.stringify(this.body),
                            headers: { 'Content-Type': 'application/json' }
                        }).catch(() => {}); // Ignore errors
                    }
                    
                    sendStatus() {
                        const status = {
                            game: '${gameName}',
                            eyes: this.eyes,
                            body: this.body,
                            neural: this.neural,
                            timestamp: Date.now()
                        };
                        
                        console.log('👁️ Eye/Body Status:', status);
                    }
                }
                
                // Initialize when page loads
                window.addEventListener('load', () => {
                    window.eyeBodyStructure = new EyeBodyStructure();
                    console.log('👁️ Eye/Body Structure connected to 3D game');
                });
            </script>
        `;
        
        // Insert before closing </head> tag
        return gameContent.replace('</head>', eyeBodyScript + '</head>');
    }
    
    async serveRandomGame(res) {
        const gameNames = Array.from(this.games.keys());
        const randomGame = gameNames[Math.floor(Math.random() * gameNames.length)];
        
        await this.serveGame(randomGame, res);
    }
    
    async showGameLauncher(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🎮 3D Game Launcher</title>
    <style>
        body { 
            background: #000; 
            color: #00ff00; 
            font-family: monospace; 
            padding: 20px; 
        }
        .game-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .game-card {
            border: 1px solid #00ff00;
            padding: 15px;
            background: #001100;
            cursor: pointer;
            transition: all 0.3s;
        }
        .game-card:hover {
            background: #002200;
            border-color: #00ff88;
        }
        .eye-body-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .system-card {
            border: 1px solid #ff4444;
            padding: 10px;
            background: #110000;
        }
    </style>
</head>
<body>
    <h1>🎮 3D GAME LAUNCHER WITH EYE/BODY STRUCTURE</h1>
    
    <h2>🌍 3D WORLDS AVAILABLE:</h2>
    <div class="game-grid">
        ${Array.from(this.games.entries()).map(([name, file]) => `
            <div class="game-card" onclick="launchGame('${name}')">
                <h3>🎯 ${name.toUpperCase()}</h3>
                <p>File: ${file}</p>
                <p>Type: ${file.includes('3D') ? '3D WebGL' : file.includes('voxel') ? 'Voxel Engine' : '3D Experience'}</p>
                <button>LAUNCH 3D GAME</button>
            </div>
        `).join('')}
    </div>
    
    <h2>👁️ EYE/BODY STRUCTURE SYSTEMS:</h2>
    <div class="eye-body-grid">
        ${Array.from(this.eyeBodySystems.entries()).map(([name, file]) => `
            <div class="system-card">
                <h4>👁️ ${name}</h4>
                <p>${file}</p>
            </div>
        `).join('')}
    </div>
    
    <h2>🎮 QUICK ACTIONS:</h2>
    <button onclick="launchGame('random')" style="padding: 15px 30px; background: #00ff00; color: #000; border: none; font-size: 18px;">
        🎲 RANDOM 3D GAME
    </button>
    
    <script>
        function launchGame(gameName) {
            console.log('🎮 Launching 3D game:', gameName);
            window.open('/' + gameName, '_blank');
        }
        
        // Show eye/body structure status
        console.log('👁️ Eye/Body Structure Systems Available:');
        console.log('• Neural Visualization');
        console.log('• Eyeball Monitoring');
        console.log('• Omniscient Eye Orchestrator');
        console.log('• Body-Soul Binding');
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    async serveFile(filename, res) {
        try {
            const content = await fs.readFile(filename, 'utf8');
            res.writeHead(200, { 
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
            });
            res.end(content);
            console.log(`📄 Served file: ${filename}`);
        } catch (error) {
            console.error(`Failed to serve file ${filename}:`, error);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`File not found: ${filename}`);
        }
    }
    
    async show404(res) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('3D Game not found');
    }
}

// Start the 3D game server
if (require.main === module) {
    const gameServer = new Game3DServer();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 3D Game Server shutting down...');
        process.exit(0);
    });
}

module.exports = Game3DServer;