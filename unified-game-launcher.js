#!/usr/bin/env node

/**
 * UNIFIED GAME LAUNCHER
 * Everything flows together with proper depth-based opacity
 * Like Habbo/RuneScape/Coke Music all layered into one
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class UnifiedGameLauncher {
    constructor() {
        console.log('🌌 UNIFIED GAME LAUNCHER');
        console.log('🎮 Building the complete layered experience...\n');
        
        this.services = new Map();
        this.layers = {
            foundation: { port: 9000, opacity: 0.3, service: 'multidimensional-foundation.js' },
            backend: { port: 8097, opacity: 0.4, service: 'backend-work-environment.js' },
            payments: { port: 8200, opacity: 0.5, service: 'clean-payment-system.js' },
            characters: { port: 8300, opacity: 0.6, service: 'image-to-voxel-clean.js' },
            hexworld: { port: 8090, opacity: 0.7, service: 'hexagonal-isometric-platform.js' },
            dashboard: { port: 8400, opacity: 0.8, service: 'unified-integration-dashboard.js' },
            worldbuilder: { port: 10000, opacity: 1.0, service: 'unified-world-builder.js' }
        };
        
        this.init();
    }
    
    async init() {
        console.log('📊 LAYER ARCHITECTURE:');
        console.log('┌─────────────────────────────────────────────┐');
        console.log('│ Layer 7: World Builder (opacity: 1.0)       │ ← You are here');
        console.log('│ Layer 6: Dashboard (opacity: 0.8)           │');
        console.log('│ Layer 5: Hex World (opacity: 0.7)           │');
        console.log('│ Layer 4: Characters (opacity: 0.6)          │');
        console.log('│ Layer 3: Payments (opacity: 0.5)            │');
        console.log('│ Layer 2: Backend (opacity: 0.4)             │');
        console.log('│ Layer 1: Foundation (opacity: 0.3)          │ ← Everything flows from here');
        console.log('└─────────────────────────────────────────────┘\n');
        
        console.log('🚀 Starting all layers in proper order...\n');
        
        // Create master interface HTML
        this.createMasterInterface();
        
        // Start services from foundation up
        for (const [name, config] of Object.entries(this.layers)) {
            await this.startService(name, config);
            await this.sleep(1000); // Give each service time to initialize
        }
        
        console.log('\n✨ ALL SYSTEMS INTEGRATED AND FLOWING!\n');
        console.log('🎮 ACCESS POINTS:');
        console.log('   🌐 Master Interface: http://localhost:11000');
        console.log('   🏗️ World Builder: http://localhost:10000');
        console.log('   📊 Dashboard: http://localhost:8400');
        console.log('   🎮 Hex World: http://localhost:8090\n');
        
        console.log('🎯 GAME MODES AVAILABLE:');
        console.log('   🚢 ShipRekt - Naval battles with QR boarding');
        console.log('   💬 Bash VCs - Command-line venture capital');
        console.log('   🧠 LLM Router - AI agent management');
        console.log('   🏰 ChronoQuest - Time-traveling adventure');
        console.log('   🏠 Habbo Remix - Social world building\n');
        
        // Open master interface
        setTimeout(() => {
            console.log('🌟 Opening master interface...');
            exec('open http://localhost:11000');
        }, 3000);
    }
    
    async startService(name, config) {
        return new Promise((resolve) => {
            const servicePath = path.join(__dirname, config.service);
            
            if (!fs.existsSync(servicePath)) {
                console.log(`⚠️  ${name}: Service not found, skipping...`);
                return resolve();
            }
            
            console.log(`🔧 Starting ${name} layer (opacity: ${config.opacity})...`);
            
            const service = exec(`node "${servicePath}"`, (error) => {
                if (error && !error.killed) {
                    console.error(`❌ ${name} error:`, error.message);
                }
            });
            
            service.stdout.on('data', (data) => {
                if (data.includes('✅') || data.includes('listening') || data.includes('ready')) {
                    console.log(`✅ ${name} layer active on port ${config.port}`);
                    this.services.set(name, { process: service, config });
                    resolve();
                }
            });
            
            service.stderr.on('data', (data) => {
                if (!data.includes('DeprecationWarning')) {
                    console.error(`${name} error:`, data);
                }
            });
        });
    }
    
    createMasterInterface() {
        const express = require('express');
        const app = express();
        const port = 11000;
        
        app.get('/', (req, res) => {
            res.send(this.getMasterInterfaceHTML());
        });
        
        app.listen(port, () => {
            console.log(`🌐 Master Interface ready on port ${port}`);
        });
    }
    
    getMasterInterfaceHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌌 Unified Game World</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            perspective: 1000px;
        }
        
        .universe {
            width: 100vw;
            height: 100vh;
            position: relative;
            transform-style: preserve-3d;
            animation: rotate 60s infinite linear;
        }
        
        @keyframes rotate {
            from { transform: rotateY(0deg); }
            to { transform: rotateY(360deg); }
        }
        
        .layer {
            position: absolute;
            width: 90%;
            height: 90%;
            top: 5%;
            left: 5%;
            border: 2px solid #00ff88;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            transform-style: preserve-3d;
        }
        
        .layer:hover {
            transform: translateZ(50px) scale(1.05);
            border-color: #00ffff;
            box-shadow: 0 0 50px rgba(0, 255, 255, 0.5);
        }
        
        .layer-content {
            text-align: center;
            padding: 40px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 16px;
            backdrop-filter: blur(10px);
        }
        
        .layer-title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 0 0 20px currentColor;
        }
        
        .layer-description {
            font-size: 18px;
            margin-bottom: 30px;
            opacity: 0.8;
        }
        
        .layer-button {
            background: rgba(0, 255, 136, 0.2);
            border: 2px solid #00ff88;
            color: #00ff88;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
        }
        
        .layer-button:hover {
            background: #00ff88;
            color: #000;
            transform: scale(1.1);
        }
        
        /* Layer positioning with depth */
        #foundation { 
            transform: translateZ(-300px);
            opacity: 0.3;
            background: radial-gradient(circle, rgba(0,100,255,0.1), rgba(0,0,0,0.1));
        }
        
        #backend {
            transform: translateZ(-200px);
            opacity: 0.4;
            background: radial-gradient(circle, rgba(100,0,255,0.1), rgba(0,0,0,0.1));
        }
        
        #payments {
            transform: translateZ(-100px);
            opacity: 0.5;
            background: radial-gradient(circle, rgba(255,0,100,0.1), rgba(0,0,0,0.1));
        }
        
        #characters {
            transform: translateZ(0px);
            opacity: 0.6;
            background: radial-gradient(circle, rgba(255,100,0,0.1), rgba(0,0,0,0.1));
        }
        
        #hexworld {
            transform: translateZ(100px);
            opacity: 0.7;
            background: radial-gradient(circle, rgba(100,255,0,0.1), rgba(0,0,0,0.1));
        }
        
        #dashboard {
            transform: translateZ(200px);
            opacity: 0.8;
            background: radial-gradient(circle, rgba(0,255,100,0.1), rgba(0,0,0,0.1));
        }
        
        #worldbuilder {
            transform: translateZ(300px);
            opacity: 1.0;
            background: radial-gradient(circle, rgba(0,255,255,0.2), rgba(0,0,0,0.1));
        }
        
        .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #00ff88;
            z-index: 1000;
        }
        
        .control-button {
            display: block;
            width: 100%;
            padding: 10px;
            margin: 5px 0;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            color: #00ff88;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }
        
        .control-button:hover {
            background: rgba(0, 255, 136, 0.3);
        }
        
        .status {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 15px 25px;
            border-radius: 8px;
            border: 1px solid #00ff88;
            font-size: 14px;
        }
        
        .depth-indicator {
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            width: 10px;
            height: 300px;
            background: linear-gradient(to bottom, 
                rgba(0, 255, 136, 1) 0%,
                rgba(0, 255, 136, 0.3) 100%
            );
            border-radius: 5px;
        }
        
        .depth-marker {
            position: absolute;
            width: 30px;
            height: 2px;
            background: #00ff88;
            left: -10px;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .active-layer {
            animation: pulse 2s infinite;
        }
    </style>
</head>
<body>
    <div class="universe" id="universe">
        <div class="layer" id="foundation" onclick="openLayer('http://localhost:9000')">
            <div class="layer-content">
                <div class="layer-title">🌌 Foundation</div>
                <div class="layer-description">5-Dimensional Reality Engine</div>
                <div class="layer-button">Enter Foundation</div>
            </div>
        </div>
        
        <div class="layer" id="backend" onclick="openLayer('http://localhost:8097')">
            <div class="layer-content">
                <div class="layer-title">⚙️ Backend</div>
                <div class="layer-description">Engine Room & Control Systems</div>
                <div class="layer-button">Enter Backend</div>
            </div>
        </div>
        
        <div class="layer" id="payments" onclick="openLayer('http://localhost:8200')">
            <div class="layer-content">
                <div class="layer-title">💳 Payments</div>
                <div class="layer-description">QR/RFID Verification Network</div>
                <div class="layer-button">Enter Payments</div>
            </div>
        </div>
        
        <div class="layer" id="characters" onclick="openLayer('http://localhost:8300')">
            <div class="layer-content">
                <div class="layer-title">🎨 Characters</div>
                <div class="layer-description">Image to Voxel Converter</div>
                <div class="layer-button">Create Character</div>
            </div>
        </div>
        
        <div class="layer" id="hexworld" onclick="openLayer('http://localhost:8090')">
            <div class="layer-content">
                <div class="layer-title">🎮 Hex World</div>
                <div class="layer-description">Isometric Game Universe</div>
                <div class="layer-button">Enter World</div>
            </div>
        </div>
        
        <div class="layer" id="dashboard" onclick="openLayer('http://localhost:8400')">
            <div class="layer-content">
                <div class="layer-title">📊 Dashboard</div>
                <div class="layer-description">Unified Control Center</div>
                <div class="layer-button">Open Dashboard</div>
            </div>
        </div>
        
        <div class="layer" id="worldbuilder" onclick="openLayer('http://localhost:10000')">
            <div class="layer-content">
                <div class="layer-title">🏗️ World Builder</div>
                <div class="layer-description">ShipRekt • Bash VCs • LLM Router</div>
                <div class="layer-button">Build Worlds</div>
            </div>
        </div>
    </div>
    
    <div class="controls">
        <h3 style="margin-bottom: 15px; color: #00ff88;">Navigation</h3>
        <button class="control-button" onclick="toggleRotation()">⏸️ Pause Rotation</button>
        <button class="control-button" onclick="resetView()">🔄 Reset View</button>
        <button class="control-button" onclick="focusLayer(7)">🎯 Focus Top Layer</button>
        <button class="control-button" onclick="expandAll()">💫 Expand All</button>
    </div>
    
    <div class="status">
        <div>🌐 All Systems Online</div>
        <div style="color: #00ff88;">Depth Navigation Active</div>
    </div>
    
    <div class="depth-indicator">
        <div class="depth-marker" style="top: 0%;"></div>
        <div class="depth-marker" style="top: 14%;"></div>
        <div class="depth-marker" style="top: 28%;"></div>
        <div class="depth-marker" style="top: 42%;"></div>
        <div class="depth-marker" style="top: 57%;"></div>
        <div class="depth-marker" style="top: 71%;"></div>
        <div class="depth-marker" style="top: 85%;"></div>
    </div>
    
    <script>
        let rotating = true;
        let currentFocus = null;
        
        function openLayer(url) {
            window.open(url, '_blank');
        }
        
        function toggleRotation() {
            rotating = !rotating;
            const universe = document.getElementById('universe');
            universe.style.animationPlayState = rotating ? 'running' : 'paused';
            event.target.textContent = rotating ? '⏸️ Pause Rotation' : '▶️ Resume Rotation';
        }
        
        function resetView() {
            document.querySelectorAll('.layer').forEach((layer, i) => {
                layer.style.transform = layer.getAttribute('data-original-transform');
            });
        }
        
        function focusLayer(depth) {
            const layers = ['foundation', 'backend', 'payments', 'characters', 'hexworld', 'dashboard', 'worldbuilder'];
            const targetLayer = layers[depth - 1];
            
            document.querySelectorAll('.layer').forEach(layer => {
                layer.classList.remove('active-layer');
            });
            
            const target = document.getElementById(targetLayer);
            target.classList.add('active-layer');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        function expandAll() {
            const universe = document.getElementById('universe');
            universe.style.transform = 'rotateX(30deg) scale(0.8)';
            
            setTimeout(() => {
                universe.style.transform = '';
            }, 3000);
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const layers = document.querySelectorAll('.layer');
            if (e.key >= '1' && e.key <= '7') {
                focusLayer(parseInt(e.key));
            }
        });
        
        // Save original transforms
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.layer').forEach(layer => {
                layer.setAttribute('data-original-transform', layer.style.transform);
            });
        });
        
        // Mouse wheel depth navigation
        let depthLevel = 0;
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                depthLevel += e.deltaY > 0 ? -50 : 50;
                depthLevel = Math.max(-500, Math.min(500, depthLevel));
                
                document.querySelectorAll('.layer').forEach((layer, i) => {
                    const baseZ = parseInt(layer.style.transform.match(/translateZ\(([-\d]+)px\)/)[1]);
                    layer.style.transform = layer.style.transform.replace(
                        /translateZ\([-\d]+px\)/,
                        \`translateZ(\${baseZ + depthLevel}px)\`
                    );
                });
            }
        });
    </script>
</body>
</html>`;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    cleanup() {
        console.log('\n🛑 Shutting down all services...');
        for (const [name, service] of this.services) {
            console.log(`  Stopping ${name}...`);
            service.process.kill();
        }
        process.exit(0);
    }
}

// Start the unified launcher
const launcher = new UnifiedGameLauncher();

// Handle graceful shutdown
process.on('SIGINT', () => launcher.cleanup());
process.on('SIGTERM', () => launcher.cleanup());