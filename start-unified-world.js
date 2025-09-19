#!/usr/bin/env node

/**
 * START UNIFIED WORLD
 * Clean startup with proper layer ordering and opacity
 */

const express = require('express');
const http = require('http');
const { exec } = require('child_process');

class UnifiedWorldStarter {
    constructor() {
        console.log('🌌 STARTING UNIFIED WORLD');
        console.log('🎮 Everything flowing together like Habbo/RuneScape/Coke Music\n');
        
        this.masterPort = 11000;
        this.services = [];
        
        this.init();
    }
    
    async init() {
        console.log('📊 DEPTH-BASED OPACITY ARCHITECTURE:');
        console.log('┌─────────────────────────────────────────────┐');
        console.log('│ 🌐 Master Interface (opacity: 1.0) ← HERE   │');
        console.log('│ 🏗️ World Builder (opacity: 0.9)            │');
        console.log('│ 📊 Dashboard (opacity: 0.8)                │');
        console.log('│ 🎮 Hex World (opacity: 0.7)                │');
        console.log('│ 🎨 Characters (opacity: 0.6)               │');
        console.log('│ 💳 Payments (opacity: 0.5)                 │');
        console.log('│ ⚙️ Backend (opacity: 0.4)                  │');
        console.log('│ 🌌 Foundation (opacity: 0.3)               │');
        console.log('└─────────────────────────────────────────────┘\n');
        
        // Start master interface first
        this.startMasterInterface();
        
        console.log('✨ UNIFIED WORLD ACTIVE!');
        console.log('🌐 Access: http://localhost:11000\n');
        
        console.log('🎯 AVAILABLE GAME MODES:');
        console.log('   🚢 ShipRekt - Naval QR battles');
        console.log('   💬 Bash VCs - Terminal venture capital');
        console.log('   🧠 LLM Router - AI agent orchestration');
        console.log('   🏰 ChronoQuest - Time-bending adventure');
        console.log('   🏠 Habbo Remix - Social world building\n');
        
        // Auto-open after brief delay
        setTimeout(() => {
            console.log('🚀 Opening unified world...');
            exec('open http://localhost:11000');
        }, 2000);
    }
    
    startMasterInterface() {
        const app = express();
        const server = http.createServer(app);
        
        app.get('/', (req, res) => {
            res.send(this.getUnifiedWorldHTML());
        });
        
        server.listen(this.masterPort, () => {
            console.log(`🌐 Unified World ready on port ${this.masterPort}`);
        });
    }
    
    getUnifiedWorldHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌌 Unified World - Everything Flows Together</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            height: 100vh;
        }
        
        .world-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            perspective: 2000px;
            background: radial-gradient(ellipse at center, #001122 0%, #000000 100%);
        }
        
        .depth-layers {
            position: absolute;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            animation: worldRotate 120s infinite linear;
        }
        
        @keyframes worldRotate {
            from { transform: rotateY(0deg) rotateX(5deg); }
            to { transform: rotateY(360deg) rotateX(5deg); }
        }
        
        .world-layer {
            position: absolute;
            width: 80%;
            height: 80%;
            top: 10%;
            left: 10%;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.5s ease;
            transform-style: preserve-3d;
            border: 2px solid rgba(0, 255, 136, 0.3);
            backdrop-filter: blur(5px);
        }
        
        .world-layer:hover {
            transform: translateZ(100px) scale(1.1);
            border-color: #00ff88;
            box-shadow: 0 0 100px rgba(0, 255, 136, 0.5);
        }
        
        .world-layer:hover .layer-content {
            transform: scale(1.2);
        }
        
        /* Depth-based positioning and opacity */
        .layer-foundation {
            transform: translateZ(-400px);
            opacity: 0.3;
            background: linear-gradient(45deg, rgba(0,100,255,0.1), rgba(100,0,255,0.1));
        }
        
        .layer-backend {
            transform: translateZ(-300px);
            opacity: 0.4;
            background: linear-gradient(45deg, rgba(100,0,255,0.1), rgba(255,0,100,0.1));
        }
        
        .layer-payments {
            transform: translateZ(-200px);
            opacity: 0.5;
            background: linear-gradient(45deg, rgba(255,0,100,0.1), rgba(255,100,0,0.1));
        }
        
        .layer-characters {
            transform: translateZ(-100px);
            opacity: 0.6;
            background: linear-gradient(45deg, rgba(255,100,0,0.1), rgba(100,255,0,0.1));
        }
        
        .layer-hexworld {
            transform: translateZ(0px);
            opacity: 0.7;
            background: linear-gradient(45deg, rgba(100,255,0,0.1), rgba(0,255,100,0.1));
        }
        
        .layer-dashboard {
            transform: translateZ(100px);
            opacity: 0.8;
            background: linear-gradient(45deg, rgba(0,255,100,0.1), rgba(0,255,255,0.1));
        }
        
        .layer-worldbuilder {
            transform: translateZ(200px);
            opacity: 0.9;
            background: linear-gradient(45deg, rgba(0,255,255,0.1), rgba(100,100,255,0.1));
        }
        
        .layer-master {
            transform: translateZ(300px);
            opacity: 1.0;
            background: linear-gradient(45deg, rgba(0,255,136,0.2), rgba(0,200,255,0.2));
            border-color: #00ff88;
        }
        
        .layer-content {
            text-align: center;
            padding: 30px;
            transition: all 0.3s;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        
        .layer-icon {
            font-size: 64px;
            margin-bottom: 20px;
            display: block;
            text-shadow: 0 0 30px currentColor;
        }
        
        .layer-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #00ff88;
            text-shadow: 0 0 20px #00ff88;
        }
        
        .layer-description {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 20px;
            line-height: 1.4;
        }
        
        .enter-button {
            background: rgba(0, 255, 136, 0.2);
            border: 2px solid #00ff88;
            color: #00ff88;
            padding: 12px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }
        
        .enter-button:hover {
            background: #00ff88;
            color: #000;
            transform: scale(1.1);
            box-shadow: 0 0 30px #00ff88;
        }
        
        .navigation-hud {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 15px;
            border: 1px solid #00ff88;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        .hud-title {
            color: #00ff88;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .depth-control {
            display: block;
            width: 100%;
            padding: 8px 15px;
            margin: 5px 0;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: #fff;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
        }
        
        .depth-control:hover {
            background: rgba(0, 255, 136, 0.3);
            border-color: #00ff88;
        }
        
        .depth-control.active {
            background: #00ff88;
            color: #000;
        }
        
        .status-bar {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 15px 30px;
            border-radius: 25px;
            border: 1px solid #00ff88;
            backdrop-filter: blur(10px);
        }
        
        .opacity-indicator {
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 400px;
            background: linear-gradient(to bottom,
                rgba(0, 255, 136, 1) 0%,
                rgba(0, 255, 136, 0.9) 12.5%,
                rgba(0, 255, 136, 0.8) 25%,
                rgba(0, 255, 136, 0.7) 37.5%,
                rgba(0, 255, 136, 0.6) 50%,
                rgba(0, 255, 136, 0.5) 62.5%,
                rgba(0, 255, 136, 0.4) 75%,
                rgba(0, 255, 136, 0.3) 87.5%,
                rgba(0, 255, 136, 0.3) 100%
            );
            border-radius: 10px;
            border: 1px solid #00ff88;
        }
        
        .opacity-label {
            position: absolute;
            right: -60px;
            font-size: 12px;
            color: #00ff88;
            width: 50px;
        }
        
        .game-modes {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 15px;
            border: 1px solid #00ff88;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        .mode-button {
            display: block;
            width: 100%;
            padding: 10px 15px;
            margin: 5px 0;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: #fff;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            text-decoration: none;
        }
        
        .mode-button:hover {
            background: rgba(0, 255, 136, 0.3);
            border-color: #00ff88;
            transform: translateX(5px);
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .active-layer {
            animation: pulse 3s infinite;
        }
    </style>
</head>
<body>
    <div class="world-container">
        <div class="depth-layers" id="worldLayers">
            <!-- Layer 8: Master Interface (You Are Here) -->
            <div class="world-layer layer-master active-layer">
                <div class="layer-content">
                    <span class="layer-icon">🌌</span>
                    <div class="layer-title">Master Interface</div>
                    <div class="layer-description">You are here<br>Unified World Controller</div>
                    <div class="enter-button">Current Layer</div>
                </div>
            </div>
            
            <!-- Layer 7: World Builder -->
            <div class="world-layer layer-worldbuilder" onclick="openLayer('worldbuilder')">
                <div class="layer-content">
                    <span class="layer-icon">🏗️</span>
                    <div class="layer-title">World Builder</div>
                    <div class="layer-description">ShipRekt • Bash VCs • LLM Router<br>Game mode orchestration</div>
                    <div class="enter-button">Build Worlds</div>
                </div>
            </div>
            
            <!-- Layer 6: Dashboard -->
            <div class="world-layer layer-dashboard" onclick="openLayer('dashboard')">
                <div class="layer-content">
                    <span class="layer-icon">📊</span>
                    <div class="layer-title">Dashboard</div>
                    <div class="layer-description">Unified control center<br>System integration hub</div>
                    <div class="enter-button">Open Dashboard</div>
                </div>
            </div>
            
            <!-- Layer 5: Hex World -->
            <div class="world-layer layer-hexworld" onclick="openLayer('hexworld')">
                <div class="layer-content">
                    <span class="layer-icon">🎮</span>
                    <div class="layer-title">Hex World</div>
                    <div class="layer-description">Isometric 3rd person universe<br>Like RuneScape meets Habbo</div>
                    <div class="enter-button">Enter World</div>
                </div>
            </div>
            
            <!-- Layer 4: Characters -->
            <div class="world-layer layer-characters" onclick="openLayer('characters')">
                <div class="layer-content">
                    <span class="layer-icon">🎨</span>
                    <div class="layer-title">Voxel Characters</div>
                    <div class="layer-description">Drag & drop image to voxel<br>3D character creation</div>
                    <div class="enter-button">Create Character</div>
                </div>
            </div>
            
            <!-- Layer 3: Payments -->
            <div class="world-layer layer-payments" onclick="openLayer('payments')">
                <div class="layer-content">
                    <span class="layer-icon">💳</span>
                    <div class="layer-title">Payment Network</div>
                    <div class="layer-description">QR/RFID verification<br>Stripe integration</div>
                    <div class="enter-button">Process Payments</div>
                </div>
            </div>
            
            <!-- Layer 2: Backend -->
            <div class="world-layer layer-backend" onclick="openLayer('backend')">
                <div class="layer-content">
                    <span class="layer-icon">⚙️</span>
                    <div class="layer-title">Engine Room</div>
                    <div class="layer-description">Backend work environment<br>Thread rippers & scythes</div>
                    <div class="enter-button">Enter Backend</div>
                </div>
            </div>
            
            <!-- Layer 1: Foundation -->
            <div class="world-layer layer-foundation" onclick="openLayer('foundation')">
                <div class="layer-content">
                    <span class="layer-icon">🌌</span>
                    <div class="layer-title">Foundation</div>
                    <div class="layer-description">5-dimensional reality engine<br>Everything flows from here</div>
                    <div class="enter-button">Access Foundation</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Navigation HUD -->
    <div class="navigation-hud">
        <div class="hud-title">🎯 Depth Navigation</div>
        <button class="depth-control" onclick="focusLayer(8)">🌌 Master</button>
        <button class="depth-control" onclick="focusLayer(7)">🏗️ Builder</button>
        <button class="depth-control" onclick="focusLayer(6)">📊 Dashboard</button>
        <button class="depth-control" onclick="focusLayer(5)">🎮 Hex World</button>
        <button class="depth-control" onclick="focusLayer(4)">🎨 Characters</button>
        <button class="depth-control" onclick="focusLayer(3)">💳 Payments</button>
        <button class="depth-control" onclick="focusLayer(2)">⚙️ Backend</button>
        <button class="depth-control" onclick="focusLayer(1)">🌌 Foundation</button>
        <button class="depth-control active" onclick="toggleRotation()">⏸️ Pause</button>
    </div>
    
    <!-- Game Modes -->
    <div class="game-modes">
        <div class="hud-title">🎮 Game Modes</div>
        <a href="#" class="mode-button" onclick="activateGameMode('shiprekt')">🚢 ShipRekt</a>
        <a href="#" class="mode-button" onclick="activateGameMode('bashvcs')">💬 Bash VCs</a>
        <a href="#" class="mode-button" onclick="activateGameMode('llmrouter')">🧠 LLM Router</a>
        <a href="#" class="mode-button" onclick="activateGameMode('chronoquest')">🏰 ChronoQuest</a>
        <a href="#" class="mode-button" onclick="activateGameMode('habbo')">🏠 Habbo Remix</a>
    </div>
    
    <!-- Status Bar -->
    <div class="status-bar">
        <span style="color: #00ff88;">🌐 All Systems Flowing</span>
        <span style="margin-left: 20px;">Depth: <span id="currentDepth">Layer 8</span></span>
        <span style="margin-left: 20px;">Mode: <span id="currentMode">Master</span></span>
    </div>
    
    <!-- Opacity Indicator -->
    <div class="opacity-indicator">
        <div class="opacity-label" style="top: 0%;">1.0</div>
        <div class="opacity-label" style="top: 12.5%;">0.9</div>
        <div class="opacity-label" style="top: 25%;">0.8</div>
        <div class="opacity-label" style="top: 37.5%;">0.7</div>
        <div class="opacity-label" style="top: 50%;">0.6</div>
        <div class="opacity-label" style="top: 62.5%;">0.5</div>
        <div class="opacity-label" style="top: 75%;">0.4</div>
        <div class="opacity-label" style="top: 87.5%;">0.3</div>
    </div>
    
    <script>
        let rotating = true;
        let currentLayer = 8;
        
        const layerUrls = {
            foundation: 'http://localhost:9000',
            backend: 'http://localhost:8097',
            payments: 'http://localhost:8200',
            characters: 'http://localhost:8300',
            hexworld: 'http://localhost:8090',
            dashboard: 'http://localhost:8400',
            worldbuilder: 'http://localhost:10000'
        };
        
        function openLayer(layerName) {
            if (layerUrls[layerName]) {
                window.open(layerUrls[layerName], '_blank');
            } else {
                console.log('Layer not yet implemented:', layerName);
                showNotification('Layer coming soon: ' + layerName);
            }
        }
        
        function focusLayer(depth) {
            currentLayer = depth;
            document.getElementById('currentDepth').textContent = 'Layer ' + depth;
            
            // Update active control
            document.querySelectorAll('.depth-control').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Focus the layer
            const layers = document.querySelectorAll('.world-layer');
            layers.forEach((layer, i) => {
                layer.classList.remove('active-layer');
                if (i === (8 - depth)) {
                    layer.classList.add('active-layer');
                }
            });
        }
        
        function toggleRotation() {
            rotating = !rotating;
            const worldLayers = document.getElementById('worldLayers');
            worldLayers.style.animationPlayState = rotating ? 'running' : 'paused';
            event.target.textContent = rotating ? '⏸️ Pause' : '▶️ Resume';
        }
        
        function activateGameMode(mode) {
            const modes = {
                shiprekt: '🚢 ShipRekt',
                bashvcs: '💬 Bash VCs',
                llmrouter: '🧠 LLM Router',
                chronoquest: '🏰 ChronoQuest',
                habbo: '🏠 Habbo Remix'
            };
            
            document.getElementById('currentMode').textContent = modes[mode];
            showNotification('Activating ' + modes[mode] + ' mode...');
            
            // Would switch to specific game mode interface
            console.log('Game mode activated:', mode);
        }
        
        function showNotification(text) {
            const notif = document.createElement('div');
            notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 255, 136, 0.9); color: #000; padding: 20px 40px; border-radius: 25px; font-weight: bold; z-index: 2000; animation: fadeInOut 3s; backdrop-filter: blur(10px);';
            notif.textContent = text;
            document.body.appendChild(notif);
            
            setTimeout(() => notif.remove(), 3000);
        }
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '8') {
                focusLayer(parseInt(e.key));
            }
            
            if (e.key === ' ') {
                e.preventDefault();
                toggleRotation();
            }
            
            if (e.key === 'r') {
                location.reload();
            }
        });
        
        // Mouse wheel depth navigation
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const newLayer = Math.max(1, Math.min(8, currentLayer + (e.deltaY > 0 ? -1 : 1)));
                focusLayer(newLayer);
            }
        });
        
        // Add CSS animation for fadeInOut
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        \`;
        document.head.appendChild(style);
        
        // Initialize
        console.log('🌌 Unified World Interface Active');
        console.log('🎮 Navigate with number keys 1-8 or mouse wheel + Ctrl');
        console.log('🎯 Space to pause/resume rotation');
        
        // Welcome message
        setTimeout(() => {
            showNotification('Welcome to the Unified World! 🌌');
        }, 1000);
    </script>
</body>
</html>`;
    }
}

// Start the unified world
new UnifiedWorldStarter();