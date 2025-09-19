#!/usr/bin/env node

/**
 * 🌉 UNIFIED CHARACTER INTERFACE
 * Single interface showing both 2D pixel art and 3D hex world
 * Selfie → ASCII Pixel Art → 3D Voxel Character → Hex World
 */

const express = require('express');
const http = require('http');

class UnifiedCharacterInterface {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = 42008;
        
        this.selfieService = 'http://localhost:42007';
        this.hexWorldService = 'http://localhost:8300';
        
        console.log('🌉 Unified Character Interface initializing...');
        this.init();
    }
    
    init() {
        this.app.use(express.json());
        
        // Main unified interface
        this.app.get('/', (req, res) => {
            res.send(this.getUnifiedInterface());
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'active',
                services: {
                    selfie: this.selfieService,
                    hexWorld: this.hexWorldService
                }
            });
        });
        
        this.server.listen(this.port, () => {
            console.log(`🌉 UNIFIED CHARACTER INTERFACE: http://localhost:${this.port}`);
            console.log('🎯 Single interface for complete selfie → hex world flow!');
            console.log('📸 Left side: Take selfie & see 2D pixel art');
            console.log('🎮 Right side: Watch your character appear in 3D hex world');
        });
    }
    
    getUnifiedInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌉 Unified Character System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            overflow: hidden;
        }
        
        .unified-container {
            display: flex;
            height: 100vh;
        }
        
        .left-panel {
            width: 50%;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            flex-direction: column;
            position: relative;
        }
        
        .right-panel {
            width: 50%;
            background: #000;
            position: relative;
        }
        
        .panel-header {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 15px 20px;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
        }
        
        .selfie-iframe {
            width: 100%;
            height: calc(100% - 60px);
            border: none;
        }
        
        .hex-iframe {
            width: 100%;
            height: calc(100% - 60px);
            border: none;
        }
        
        .bridge-status {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 136, 0.9);
            color: #000;
            padding: 20px 30px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 16px;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            display: none;
            animation: bridgeAnimation 2s ease-in-out;
        }
        
        @keyframes bridgeAnimation {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        
        .flow-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 999;
            font-size: 24px;
            animation: flowPulse 2s infinite;
        }
        
        @keyframes flowPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }
        
        .connection-line {
            position: absolute;
            top: 50%;
            left: 45%;
            right: 45%;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #00ff88, #764ba2);
            z-index: 500;
            animation: dataFlow 3s infinite;
        }
        
        @keyframes dataFlow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
        
        .status-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            z-index: 1000;
        }
        
        .service-status {
            display: flex;
            gap: 20px;
        }
        
        .service-indicator {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00ff88;
            animation: statusPulse 2s infinite;
        }
        
        .status-dot.error {
            background: #ff4444;
        }
        
        @keyframes statusPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
            .unified-container {
                flex-direction: column;
            }
            
            .left-panel, .right-panel {
                width: 100%;
                height: 50%;
            }
            
            .flow-indicator {
                top: 50%;
                left: 90%;
                transform: translate(-50%, -50%) rotate(90deg);
            }
        }
    </style>
</head>
<body>
    <div class="unified-container">
        <!-- Left Panel: Selfie & Pixel Art -->
        <div class="left-panel">
            <div class="panel-header">📸 Selfie to Pixel Art</div>
            <iframe src="${this.selfieService}" class="selfie-iframe" id="selfieFrame"></iframe>
        </div>
        
        <!-- Connection Bridge -->
        <div class="flow-indicator">🌉</div>
        <div class="connection-line"></div>
        <div class="bridge-status" id="bridgeStatus">
            🎯 Converting pixel art to 3D voxels...
        </div>
        
        <!-- Right Panel: Hex World -->
        <div class="right-panel">
            <div class="panel-header">🎮 3D Hex World</div>
            <iframe src="${this.hexWorldService}" class="hex-iframe" id="hexFrame"></iframe>
        </div>
    </div>
    
    <!-- Status Bar -->
    <div class="status-bar">
        <div class="service-status">
            <div class="service-indicator">
                <div class="status-dot" id="selfieStatus"></div>
                <span>Selfie System</span>
            </div>
            <div class="service-indicator">
                <div class="status-dot" id="hexStatus"></div>
                <span>Hex World</span>
            </div>
            <div class="service-indicator">
                <div class="status-dot" id="bridgeStatusDot"></div>
                <span>Bridge Active</span>
            </div>
        </div>
        <div>
            🎯 Take a selfie → Watch it become a 3D character in hex world!
        </div>
    </div>
    
    <script>
        let bridgeActive = false;
        
        async function checkServiceHealth() {
            const services = [
                { id: 'selfieStatus', url: '${this.selfieService}' },
                { id: 'hexStatus', url: '${this.hexWorldService}' }
            ];
            
            for (const service of services) {
                try {
                    const response = await fetch(service.url, { method: 'HEAD' });
                    const statusDot = document.getElementById(service.id);
                    
                    if (response.ok) {
                        statusDot.classList.remove('error');
                    } else {
                        statusDot.classList.add('error');
                    }
                } catch (error) {
                    document.getElementById(service.id).classList.add('error');
                }
            }
        }
        
        // Monitor for character creation events
        function monitorBridge() {
            // Listen for messages from selfie iframe
            window.addEventListener('message', (event) => {
                if (event.data.type === 'character_created') {
                    showBridgeStatus();
                    
                    // Refresh hex world to show new character
                    setTimeout(() => {
                        document.getElementById('hexFrame').src = 
                            document.getElementById('hexFrame').src;
                        hideBridgeStatus();
                    }, 3000);
                }
            });
        }
        
        function showBridgeStatus() {
            const status = document.getElementById('bridgeStatus');
            const bridgeDot = document.getElementById('bridgeStatusDot');
            
            status.style.display = 'block';
            bridgeDot.classList.remove('error');
            bridgeActive = true;
            
            // Hide after animation
            setTimeout(() => {
                status.style.display = 'none';
                bridgeActive = false;
            }, 4000);
        }
        
        function hideBridgeStatus() {
            document.getElementById('bridgeStatus').style.display = 'none';
        }
        
        // Initialize
        checkServiceHealth();
        setInterval(checkServiceHealth, 10000); // Check every 10 seconds
        monitorBridge();
        
        console.log('🌉 Unified Character Interface loaded!');
        console.log('📸 Left: Selfie system');
        console.log('🎮 Right: Hex world');
        console.log('🌉 Bridge: Automatic pixel → voxel conversion');
    </script>
</body>
</html>`;
    }
}

// Start the unified interface
new UnifiedCharacterInterface();