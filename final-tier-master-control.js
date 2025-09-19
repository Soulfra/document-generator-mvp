#!/usr/bin/env node

const express = require('express');
const WebSocket = require('ws');
const http = require('http');

class FinalTierMasterControl {
    constructor() {
        this.app = express();
        this.port = 8000; // Master control port
        this.wsPort = 8001;
        
        // All systems in the ecosystem
        this.systems = {
            tier1_basic: [
                { name: 'Soulfra Multiverse', url: 'http://localhost:7881', status: 'unknown' },
                { name: 'Web3 Game World', url: 'http://localhost:7880', status: 'unknown' }
            ],
            tier2_intelligence: [
                { name: 'Language Dissector', url: 'http://localhost:7900', status: 'unknown' },
                { name: 'Emoji Transformer', url: 'http://localhost:7902', status: 'unknown' },
                { name: 'Whisper-XML Bridge', url: 'http://localhost:7908', status: 'unknown' }
            ],
            tier3_orchestration: [
                { name: 'Dungeon Master', url: 'http://localhost:7904', status: 'unknown' },
                { name: 'Tutorial Island', url: 'http://localhost:7892', status: 'unknown' },
                { name: 'Agent Orchestrator', url: 'http://localhost:7906', status: 'unknown' }
            ]
        };
        
        // Tier progression system
        this.tierRequirements = {
            tier1: { systems_required: 2, description: 'Basic World Building' },
            tier2: { systems_required: 5, description: 'AI Intelligence Layer' },
            tier3: { systems_required: 8, description: 'Full Orchestration' },
            final: { systems_required: 8, description: 'MASTER CONTROL ACHIEVED' }
        };
        
        // User progress
        this.userProgress = {
            current_tier: 0,
            systems_online: 0,
            total_systems: 8,
            achievements: [],
            time_started: Date.now()
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.startSystemMonitoring();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }
    
    setupRoutes() {
        // Master control interface
        this.app.get('/', (req, res) => {
            res.send(this.generateMasterInterface());
        });
        
        // System status API
        this.app.get('/api/status', (req, res) => {
            res.json({
                userProgress: this.userProgress,
                systems: this.systems,
                tierRequirements: this.tierRequirements,
                nextTier: this.getNextTierInfo()
            });
        });
        
        // Start all systems
        this.app.post('/api/start-all', async (req, res) => {
            try {
                const results = await this.startAllSystems();
                res.json({ success: true, results });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Advance to next tier
        this.app.post('/api/advance-tier', (req, res) => {
            const advanced = this.advanceToNextTier();
            res.json({ success: advanced, currentTier: this.userProgress.current_tier });
        });
        
        // Get final deployment package
        this.app.get('/api/deployment-package', (req, res) => {
            res.json(this.generateDeploymentPackage());
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🎮 Master Control client connected');
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'status_update',
                data: {
                    userProgress: this.userProgress,
                    systems: this.systems
                }
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    switch (data.type) {
                        case 'start_system':
                            await this.startSpecificSystem(data.system);
                            break;
                        case 'stop_system':
                            await this.stopSpecificSystem(data.system);
                            break;
                        case 'check_tier_progress':
                            this.broadcastTierProgress();
                            break;
                    }
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', error: error.message }));
                }
            });
        });
    }
    
    async startSystemMonitoring() {
        // Check system status every 5 seconds
        setInterval(async () => {
            await this.checkAllSystems();
            this.updateUserProgress();
            this.broadcastStatus();
        }, 5000);
    }
    
    async checkAllSystems() {
        let totalOnline = 0;
        
        for (const [tier, systems] of Object.entries(this.systems)) {
            for (const system of systems) {
                try {
                    const response = await this.pingSystem(system.url);
                    system.status = response ? 'online' : 'offline';
                    if (system.status === 'online') totalOnline++;
                } catch (error) {
                    system.status = 'offline';
                }
            }
        }
        
        this.userProgress.systems_online = totalOnline;
    }
    
    async pingSystem(url) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 2000);
            
            try {
                const req = http.get(url, (res) => {
                    clearTimeout(timeout);
                    resolve(res.statusCode === 200);
                });
                
                req.on('error', () => {
                    clearTimeout(timeout);
                    resolve(false);
                });
            } catch (error) {
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }
    
    updateUserProgress() {
        const online = this.userProgress.systems_online;
        let newTier = 0;
        
        if (online >= 2) newTier = 1;
        if (online >= 5) newTier = 2;
        if (online >= 8) newTier = 3;
        
        if (newTier > this.userProgress.current_tier) {
            this.userProgress.current_tier = newTier;
            this.userProgress.achievements.push({
                tier: newTier,
                timestamp: Date.now(),
                description: this.tierRequirements[`tier${newTier}`]?.description || 'Unknown'
            });
        }
    }
    
    getNextTierInfo() {
        const current = this.userProgress.current_tier;
        const next = current + 1;
        
        if (next <= 3) {
            const req = this.tierRequirements[`tier${next}`];
            return {
                tier: next,
                systems_needed: req.systems_required - this.userProgress.systems_online,
                description: req.description
            };
        }
        
        return { tier: 'FINAL', systems_needed: 0, description: 'MASTER CONTROL ACHIEVED' };
    }
    
    advanceToNextTier() {
        const nextTier = this.getNextTierInfo();
        if (nextTier.systems_needed <= 0) {
            this.userProgress.current_tier = nextTier.tier;
            return true;
        }
        return false;
    }
    
    generateDeploymentPackage() {
        return {
            name: 'Document Generator Ecosystem',
            version: '1.0.0',
            tier: this.userProgress.current_tier,
            systems_included: this.userProgress.systems_online,
            deployment_commands: [
                'npm install',
                'node start-ecosystem.js',
                'open http://localhost:8000'
            ],
            ports_used: [7880, 7881, 7892, 7900, 7902, 7904, 7906, 7908, 8000],
            achievements: this.userProgress.achievements,
            ready_for_production: this.userProgress.current_tier >= 3
        };
    }
    
    broadcastStatus() {
        const status = {
            type: 'status_update',
            data: {
                userProgress: this.userProgress,
                systems: this.systems,
                nextTier: this.getNextTierInfo()
            }
        };
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(status));
            }
        });
    }
    
    broadcastTierProgress() {
        const progress = {
            type: 'tier_progress',
            data: {
                current_tier: this.userProgress.current_tier,
                next_tier: this.getNextTierInfo(),
                achievements: this.userProgress.achievements
            }
        };
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(progress));
            }
        });
    }
    
    generateMasterInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>👑 FINAL TIER MASTER CONTROL 👑</title>
    <style>
        body { 
            font-family: monospace; 
            background: linear-gradient(135deg, #000000, #001122, #000000);
            color: #00ff00; 
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .master-container { 
            max-width: 1400px; 
            margin: 0 auto; 
            background: rgba(0, 20, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 30px;
        }
        .tier-header {
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(90deg, #001100, #002200, #001100);
            border: 1px solid #00ff00;
            border-radius: 5px;
        }
        .tier-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .tier-section {
            border: 1px solid #00ff00;
            padding: 20px;
            background: rgba(0, 50, 0, 0.3);
            border-radius: 5px;
        }
        .tier-section.active {
            background: rgba(0, 100, 0, 0.5);
            box-shadow: 0 0 20px #00ff00;
        }
        .tier-section.complete {
            background: rgba(0, 150, 0, 0.7);
            border-color: #ffff00;
        }
        .system-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 3px;
        }
        .status-online { color: #00ff00; }
        .status-offline { color: #ff4444; }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #333;
            border: 1px solid #00ff00;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff00, #ffff00);
            transition: width 0.5s ease;
        }
        .master-controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        .control-button {
            background: linear-gradient(135deg, #00aa00, #00ff00);
            color: #000;
            border: none;
            padding: 15px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: monospace;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .control-button:hover {
            background: linear-gradient(135deg, #00ff00, #ffff00);
            transform: scale(1.05);
        }
        .control-button:disabled {
            background: #444;
            color: #888;
            cursor: not-allowed;
            transform: none;
        }
        .achievement-list {
            max-height: 200px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #00ff00;
        }
        .achievement {
            padding: 8px;
            margin: 5px 0;
            background: rgba(255, 255, 0, 0.1);
            border-left: 3px solid #ffff00;
            border-radius: 3px;
        }
        .final-deployment {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #002200, #004400, #002200);
            border: 2px solid #ffff00;
            border-radius: 10px;
            margin: 30px 0;
        }
        .final-deployment.ready {
            background: linear-gradient(135deg, #004400, #008800, #004400);
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { box-shadow: 0 0 20px #00ff00; }
            to { box-shadow: 0 0 40px #ffff00; }
        }
        .ascii-art {
            font-family: monospace;
            font-size: 10px;
            white-space: pre;
            text-align: center;
            color: #00ff00;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="master-container">
        <div class="tier-header">
            <div class="ascii-art">
╔═══════════════════════════════════════════════════════════════════╗
║                    👑 FINAL TIER MASTER CONTROL 👑                ║
║                     Document Generator Ecosystem                  ║
║                         TIER <span id="currentTier">0</span> / 3 ACTIVE                         ║
╚═══════════════════════════════════════════════════════════════════╝
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" id="overallProgress" style="width: 0%"></div>
        </div>
        <div style="text-align: center; margin: 10px 0;">
            <span id="progressText">0/8 Systems Online</span>
        </div>
        
        <div class="tier-grid">
            <div class="tier-section" id="tier1">
                <h3>🏗️ TIER 1: Basic World Building</h3>
                <div id="tier1Systems"></div>
                <div style="margin-top: 15px; text-align: center;">
                    <strong>Requirements:</strong> 2+ systems
                </div>
            </div>
            
            <div class="tier-section" id="tier2">
                <h3>🧠 TIER 2: AI Intelligence Layer</h3>
                <div id="tier2Systems"></div>
                <div style="margin-top: 15px; text-align: center;">
                    <strong>Requirements:</strong> 5+ systems
                </div>
            </div>
            
            <div class="tier-section" id="tier3">
                <h3>🚀 TIER 3: Full Orchestration</h3>
                <div id="tier3Systems"></div>
                <div style="margin-top: 15px; text-align: center;">
                    <strong>Requirements:</strong> 8+ systems
                </div>
            </div>
        </div>
        
        <div class="master-controls">
            <button class="control-button" onclick="startAllSystems()">🚀 START ALL SYSTEMS</button>
            <button class="control-button" onclick="checkSystemStatus()">🔍 CHECK STATUS</button>
            <button class="control-button" onclick="advanceToNextTier()" id="advanceBtn">⬆️ ADVANCE TIER</button>
            <button class="control-button" onclick="openSystemDashboards()">📊 OPEN DASHBOARDS</button>
            <button class="control-button" onclick="generateDeploymentPackage()">📦 DEPLOYMENT PACKAGE</button>
            <button class="control-button" onclick="exportConfiguration()">💾 EXPORT CONFIG</button>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h3>🏆 Achievements</h3>
                <div class="achievement-list" id="achievementList">
                    <div style="text-align: center; color: #888;">No achievements yet...</div>
                </div>
            </div>
            
            <div>
                <h3>🎯 Next Tier Requirements</h3>
                <div id="nextTierInfo" style="padding: 15px; background: rgba(0,0,0,0.7); border-radius: 5px;">
                    Loading...
                </div>
            </div>
        </div>
        
        <div class="final-deployment" id="finalDeployment">
            <h2>🎯 FINAL DEPLOYMENT STATUS</h2>
            <div id="deploymentStatus">
                <p>Complete all tiers to unlock final deployment package</p>
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <h3>📊 Real-Time System Monitor</h3>
            <div id="systemMonitor" style="background: #000; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 300px; overflow-y: auto;">
                <div style="color: #00ff00;">System monitor initializing...</div>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let currentStatus = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:8001');
            
            ws.onopen = () => {
                console.log('Connected to Master Control');
                addToMonitor('🔌 Connected to Master Control WebSocket');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                addToMonitor('❌ Lost connection to Master Control');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'status_update':
                    updateInterface(data.data);
                    break;
                case 'tier_progress':
                    updateTierProgress(data.data);
                    break;
                case 'error':
                    addToMonitor('❌ Error: ' + data.error);
                    break;
            }
        }
        
        function updateInterface(status) {
            currentStatus = status;
            
            // Update overall progress
            const progress = (status.userProgress.systems_online / status.userProgress.total_systems) * 100;
            document.getElementById('overallProgress').style.width = progress + '%';
            document.getElementById('progressText').textContent = 
                \`\${status.userProgress.systems_online}/\${status.userProgress.total_systems} Systems Online\`;
            
            // Update current tier
            document.getElementById('currentTier').textContent = status.userProgress.current_tier;
            
            // Update tier sections
            updateTierSections(status);
            
            // Update next tier info
            updateNextTierInfo(status.nextTier);
            
            // Update achievements
            updateAchievements(status.userProgress.achievements);
            
            // Update deployment status
            updateDeploymentStatus(status.userProgress);
        }
        
        function updateTierSections(status) {
            const tiers = ['tier1_basic', 'tier2_intelligence', 'tier3_orchestration'];
            
            tiers.forEach((tierKey, index) => {
                const tierNum = index + 1;
                const tierElement = document.getElementById(\`tier\${tierNum}\`);
                const systemsElement = document.getElementById(\`tier\${tierNum}Systems\`);
                
                // Update tier status
                tierElement.className = 'tier-section';
                if (status.userProgress.current_tier >= tierNum) {
                    tierElement.classList.add('complete');
                } else if (status.userProgress.current_tier === tierNum - 1) {
                    tierElement.classList.add('active');
                }
                
                // Update systems in tier
                let systemsHTML = '';
                status.systems[tierKey].forEach(system => {
                    const statusClass = system.status === 'online' ? 'status-online' : 'status-offline';
                    const statusIcon = system.status === 'online' ? '✅' : '❌';
                    
                    systemsHTML += \`
                        <div class="system-item">
                            <span>\${system.name}</span>
                            <span class="\${statusClass}">\${statusIcon} \${system.status}</span>
                        </div>
                    \`;
                });
                
                systemsElement.innerHTML = systemsHTML;
            });
        }
        
        function updateNextTierInfo(nextTier) {
            const element = document.getElementById('nextTierInfo');
            
            if (nextTier.tier === 'FINAL') {
                element.innerHTML = \`
                    <div style="text-align: center; color: #ffff00;">
                        🎉 <strong>MASTER CONTROL ACHIEVED!</strong> 🎉<br>
                        All tiers completed successfully!
                    </div>
                \`;
            } else {
                element.innerHTML = \`
                    <strong>Target:</strong> Tier \${nextTier.tier}<br>
                    <strong>Description:</strong> \${nextTier.description}<br>
                    <strong>Systems Needed:</strong> \${nextTier.systems_needed} more<br>
                    <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,0,0.1); border-radius: 3px;">
                        💡 Start more systems to advance to the next tier
                    </div>
                \`;
            }
        }
        
        function updateAchievements(achievements) {
            const element = document.getElementById('achievementList');
            
            if (achievements.length === 0) {
                element.innerHTML = '<div style="text-align: center; color: #888;">No achievements yet...</div>';
                return;
            }
            
            let html = '';
            achievements.forEach(achievement => {
                const date = new Date(achievement.timestamp).toLocaleString();
                html += \`
                    <div class="achievement">
                        🏆 <strong>Tier \${achievement.tier} Unlocked!</strong><br>
                        \${achievement.description}<br>
                        <small>\${date}</small>
                    </div>
                \`;
            });
            
            element.innerHTML = html;
        }
        
        function updateDeploymentStatus(userProgress) {
            const element = document.getElementById('finalDeployment');
            const statusElement = document.getElementById('deploymentStatus');
            
            if (userProgress.current_tier >= 3) {
                element.classList.add('ready');
                statusElement.innerHTML = \`
                    <h3 style="color: #ffff00;">🎉 READY FOR FINAL DEPLOYMENT! 🎉</h3>
                    <p>All tiers completed successfully!</p>
                    <button class="control-button" onclick="downloadDeploymentPackage()" style="margin: 10px;">
                        📦 DOWNLOAD FINAL PACKAGE
                    </button>
                \`;
            } else {
                element.classList.remove('ready');
                statusElement.innerHTML = \`
                    <p>Complete Tier 3 (8 systems) to unlock final deployment</p>
                    <p>Current: Tier \${userProgress.current_tier} (\${userProgress.systems_online}/8 systems)</p>
                \`;
            }
        }
        
        async function startAllSystems() {
            addToMonitor('🚀 Starting all systems...');
            
            try {
                const response = await fetch('/api/start-all', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addToMonitor('✅ All systems startup initiated');
                } else {
                    addToMonitor('❌ Failed to start systems');
                }
            } catch (error) {
                addToMonitor('❌ Error starting systems: ' + error.message);
            }
        }
        
        async function checkSystemStatus() {
            addToMonitor('🔍 Checking system status...');
            
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                updateInterface(status);
                addToMonitor('✅ Status updated');
            } catch (error) {
                addToMonitor('❌ Error checking status: ' + error.message);
            }
        }
        
        async function advanceToNextTier() {
            addToMonitor('⬆️ Attempting to advance tier...');
            
            try {
                const response = await fetch('/api/advance-tier', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addToMonitor(\`🎉 Advanced to Tier \${result.currentTier}!\`);
                } else {
                    addToMonitor('❌ Cannot advance - requirements not met');
                }
            } catch (error) {
                addToMonitor('❌ Error advancing tier: ' + error.message);
            }
        }
        
        function openSystemDashboards() {
            const urls = [
                'http://localhost:7881', // Soulfra
                'http://localhost:7892', // Tutorial Island
                'http://localhost:7904', // Dungeon Master
                'http://localhost:7906', // Agent Orchestrator
                'http://localhost:7908'  // Whisper Bridge
            ];
            
            urls.forEach(url => window.open(url, '_blank'));
            addToMonitor('📊 Opened system dashboards');
        }
        
        async function generateDeploymentPackage() {
            addToMonitor('📦 Generating deployment package...');
            
            try {
                const response = await fetch('/api/deployment-package');
                const pkg = await response.json();
                
                const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'document-generator-deployment.json';
                a.click();
                URL.revokeObjectURL(url);
                
                addToMonitor('✅ Deployment package downloaded');
            } catch (error) {
                addToMonitor('❌ Error generating package: ' + error.message);
            }
        }
        
        function exportConfiguration() {
            const config = {
                timestamp: new Date().toISOString(),
                userProgress: currentStatus?.userProgress,
                systems: currentStatus?.systems,
                achievements: currentStatus?.userProgress?.achievements || []
            };
            
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'master-control-config.json';
            a.click();
            URL.revokeObjectURL(url);
            
            addToMonitor('💾 Configuration exported');
        }
        
        function addToMonitor(message) {
            const monitor = document.getElementById('systemMonitor');
            const timestamp = new Date().toLocaleTimeString();
            const line = \`[\${timestamp}] \${message}\`;
            
            monitor.innerHTML = line + '\\n' + monitor.innerHTML;
            
            // Keep only last 50 lines
            const lines = monitor.innerHTML.split('\\n');
            if (lines.length > 50) {
                monitor.innerHTML = lines.slice(0, 50).join('\\n');
            }
        }
        
        // Initialize
        connectWebSocket();
        
        // Auto-refresh status every 10 seconds
        setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'check_tier_progress' }));
            }
        }, 10000);
    </script>
</body>
</html>
        `;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('👑 Final Tier Master Control running on http://localhost:' + this.port);
            console.log('🔌 WebSocket server running on ws://localhost:' + this.wsPort);
            console.log('🎯 MASTER CONTROL INTERFACE READY');
            console.log('🚀 Monitor all tiers and advance to final deployment');
        });
    }
}

// Start Master Control
const masterControl = new FinalTierMasterControl();
masterControl.start();