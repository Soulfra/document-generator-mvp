#!/usr/bin/env node
// ELECTRON-BOSS-WINDOW.js - Desktop boss management for Electron

const { BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const WebSocket = require('ws');

class ElectronBossManager {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.bossWindow = null;
        this.websocket = null;
        this.activeBattles = new Map();
        
        this.setupIPC();
        this.connectWebSocket();
        
        console.log('🖥️ Electron Boss Manager initialized');
    }

    async createBossWindow() {
        if (this.bossWindow) {
            this.bossWindow.focus();
            return;
        }

        this.bossWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            parent: this.mainWindow,
            modal: false,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'boss-preload.js'),
                sandbox: false
            },
            icon: path.join(__dirname, 'assets', 'boss-icon.png'),
            titleBarStyle: 'hiddenInset',
            backgroundColor: '#1a1a1a'
        });

        // Load boss management interface
        await this.bossWindow.loadFile(path.join(__dirname, 'boss-manager.html'));

        this.bossWindow.once('ready-to-show', () => {
            this.bossWindow.show();
            this.bossWindow.webContents.openDevTools({ mode: 'detach' });
        });

        this.bossWindow.on('closed', () => {
            this.bossWindow = null;
        });

        // Setup window-specific IPC handlers
        this.setupBossWindowIPC();
    }

    setupIPC() {
        // Open boss management window
        ipcMain.handle('open-boss-manager', async () => {
            await this.createBossWindow();
            return { success: true };
        });

        // Get all bosses
        ipcMain.handle('get-all-bosses', async () => {
            try {
                const response = await fetch('http://localhost:4200/api/bosses');
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('❌ Failed to fetch bosses:', error);
                return { success: false, error: error.message };
            }
        });

        // Create new boss
        ipcMain.handle('create-boss', async (event, bossData) => {
            try {
                const response = await fetch('http://localhost:4200/api/bosses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bossData)
                });
                const result = await response.json();
                
                if (result.success) {
                    // Notify all windows of new boss
                    this.broadcastToAllWindows('boss-created', result.boss);
                }
                
                return result;
            } catch (error) {
                console.error('❌ Failed to create boss:', error);
                return { success: false, error: error.message };
            }
        });

        // Start battle
        ipcMain.handle('start-battle', async (event, bossId) => {
            try {
                const response = await fetch(`http://localhost:4200/api/bosses/${bossId}/battle`, {
                    method: 'POST'
                });
                const result = await response.json();
                
                if (result.success) {
                    this.activeBattles.set(bossId, result.battle);
                    this.broadcastToAllWindows('battle-started', result.battle);
                }
                
                return result;
            } catch (error) {
                console.error('❌ Failed to start battle:', error);
                return { success: false, error: error.message };
            }
        });

        // Export boss data
        ipcMain.handle('export-boss-data', async () => {
            try {
                const { filePath } = await dialog.showSaveDialog(this.bossWindow || this.mainWindow, {
                    title: 'Export Boss Data',
                    defaultPath: `boss-export-${new Date().toISOString().split('T')[0]}.json`,
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (!filePath) return { success: false, cancelled: true };

                const response = await fetch('http://localhost:4200/api/bosses/export');
                const data = await response.json();

                await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
                
                // Show in file explorer
                shell.showItemInFolder(filePath);
                
                return { success: true, path: filePath };
            } catch (error) {
                console.error('❌ Export failed:', error);
                return { success: false, error: error.message };
            }
        });

        // Import boss data
        ipcMain.handle('import-boss-data', async () => {
            try {
                const { filePaths } = await dialog.showOpenDialog(this.bossWindow || this.mainWindow, {
                    title: 'Import Boss Data',
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                    properties: ['openFile']
                });

                if (!filePaths || filePaths.length === 0) {
                    return { success: false, cancelled: true };
                }

                const fileContent = await fs.readFile(filePaths[0], 'utf8');
                const importData = JSON.parse(fileContent);

                const response = await fetch('http://localhost:4200/api/bosses/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(importData)
                });

                const result = await response.json();
                
                if (result.success) {
                    this.broadcastToAllWindows('bosses-imported', result);
                }
                
                return result;
            } catch (error) {
                console.error('❌ Import failed:', error);
                return { success: false, error: error.message };
            }
        });
    }

    setupBossWindowIPC() {
        if (!this.bossWindow) return;

        // Handle boss window specific events
        this.bossWindow.webContents.on('did-finish-load', () => {
            // Send initial data to boss window
            this.bossWindow.webContents.send('initial-data', {
                activeBattles: Array.from(this.activeBattles.values()),
                websocketConnected: this.websocket?.readyState === WebSocket.OPEN
            });
        });
    }

    connectWebSocket() {
        try {
            this.websocket = new WebSocket('ws://localhost:8081');
            
            this.websocket.on('open', () => {
                console.log('🌐 Boss WebSocket connected');
                this.broadcastToAllWindows('websocket-connected');
            });

            this.websocket.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('❌ Failed to parse WebSocket message:', error);
                }
            });

            this.websocket.on('close', () => {
                console.log('🔌 Boss WebSocket disconnected');
                this.broadcastToAllWindows('websocket-disconnected');
                
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            });

            this.websocket.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
            });

        } catch (error) {
            console.error('❌ Failed to connect WebSocket:', error);
            setTimeout(() => this.connectWebSocket(), 5000);
        }
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'battle_update':
                this.activeBattles.set(message.bossId, message.battle);
                this.broadcastToAllWindows('battle-update', message);
                break;
                
            case 'battle_ended':
                this.activeBattles.delete(message.bossId);
                this.broadcastToAllWindows('battle-ended', message);
                break;
                
            case 'boss_created':
                this.broadcastToAllWindows('boss-created', message.boss);
                break;
                
            case 'kingdom_update':
                this.broadcastToAllWindows('kingdom-update', message);
                break;
                
            default:
                console.log('📨 Unknown WebSocket message:', message.type);
        }
    }

    broadcastToAllWindows(event, data) {
        // Send to main window
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(event, data);
        }

        // Send to boss window
        if (this.bossWindow && !this.bossWindow.isDestroyed()) {
            this.bossWindow.webContents.send(event, data);
        }

        // Send to other windows if they exist
        const BrowserWindow = require('electron').BrowserWindow;
        BrowserWindow.getAllWindows().forEach(window => {
            if (window !== this.mainWindow && window !== this.bossWindow) {
                window.webContents.send(event, data);
            }
        });
    }

    // Integration with existing character system
    async integrateBossWithCharacterSystem(bossId, characterId) {
        try {
            // Load existing GameCharacterIntegration
            const GameCharacterIntegration = require('./GAME-CHARACTER-INTEGRATION.js');
            
            // Create boss-character bridge
            const characterData = {
                id: characterId,
                name: `Boss Character ${bossId}`,
                type: 'boss',
                bossId: bossId,
                appearance: {
                    colors: {
                        primary: '#FF4444',
                        secondary: '#AA2222'
                    }
                },
                stats: {
                    level: 50,
                    creativity: 80,
                    intelligence: 90
                },
                analysis: {
                    style_category: 'robot'
                },
                position: {
                    world: 'boss_arena',
                    x: 0, y: 0, z: 0
                }
            };

            // Spawn boss character in all game worlds
            const voxelIntegration = new GameCharacterIntegration('voxel', '8892');
            const economicIntegration = new GameCharacterIntegration('economic', '8893');
            const arenaIntegration = new GameCharacterIntegration('arena', '3001');

            // Update character in all systems
            voxelIntegration.updateCharacter(characterData);
            economicIntegration.updateCharacter(characterData);
            arenaIntegration.updateCharacter(characterData);

            console.log('✅ Boss integrated with character system');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Boss-character integration failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Desktop notification system
    showBossNotification(title, body, bossId) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('show-notification', {
                title,
                body,
                icon: path.join(__dirname, 'assets', 'boss-notification.png'),
                tag: `boss-${bossId}`,
                requireInteraction: false,
                silent: false
            });
        }
    }

    // Cleanup on app quit
    cleanup() {
        if (this.websocket) {
            this.websocket.close();
        }
        
        if (this.bossWindow && !this.bossWindow.isDestroyed()) {
            this.bossWindow.close();
        }
    }
}

// Boss Manager HTML Interface
const createBossManagerHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boss Manager - Desktop</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            height: 100vh;
            overflow: hidden;
        }
        
        .app-container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .main-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ff4444;
            animation: pulse 2s infinite;
        }
        
        .status-dot.connected {
            background: #44ff44;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .boss-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .boss-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .boss-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .boss-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4ecdc4;
        }
        
        .boss-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .stat {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
            font-size: 12px;
        }
        
        .battle-log {
            height: 200px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin-top: 20px;
        }
        
        .log-entry {
            margin-bottom: 5px;
            opacity: 0.8;
        }
        
        .log-entry.combat {
            color: #ff6b6b;
        }
        
        .log-entry.system {
            color: #4ecdc4;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
        }
        
        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1a1a2e;
            padding: 30px;
            border-radius: 10px;
            width: 500px;
            max-width: 90vw;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #4ecdc4;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 14px;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #4ecdc4;
            box-shadow: 0 0 10px rgba(78, 205, 196, 0.3);
        }
        
        .form-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .battle-arena {
            width: 100%;
            height: 300px;
            border: 2px solid #4ecdc4;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.8);
            position: relative;
            margin-top: 20px;
        }
        
        .arena-grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 30px 30px;
        }
        
        .boss-sprite, .player-sprite {
            position: absolute;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .boss-sprite {
            background: radial-gradient(circle, #ff4444, #aa2222);
            border: 2px solid #ffffff;
        }
        
        .player-sprite {
            background: radial-gradient(circle, #4444ff, #2222aa);
            border: 2px solid #ffffff;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="sidebar">
            <div class="title">Boss Manager</div>
            <div class="status-indicator">
                <div class="status-dot" id="websocket-status"></div>
                <span id="connection-status">Connecting...</span>
            </div>
            
            <div class="action-buttons" style="flex-direction: column;">
                <button onclick="createNewBoss()">➕ Create Boss</button>
                <button onclick="exportBossData()">📤 Export Data</button>
                <button onclick="importBossData()">📥 Import Data</button>
                <button onclick="refreshBosses()">🔄 Refresh</button>
            </div>
            
            <div class="battle-log" id="battle-log">
                <div class="log-entry system">🖥️ Desktop Boss Manager loaded</div>
                <div class="log-entry system">🌐 Connecting to battle stream...</div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="header">
                <h2>Active Bosses & Battles</h2>
                <div class="status-indicator">
                    <span id="boss-count">Loading...</span>
                </div>
            </div>
            
            <div class="boss-grid" id="boss-grid">
                <!-- Bosses will be populated here -->
            </div>
            
            <div class="battle-arena" id="battle-arena" style="display: none;">
                <div class="arena-grid"></div>
            </div>
        </div>
    </div>
    
    <!-- Create Boss Modal -->
    <div class="modal" id="create-boss-modal">
        <div class="modal-content">
            <h3>Create New Boss</h3>
            <form id="create-boss-form">
                <div class="form-group">
                    <label>Boss Name</label>
                    <input type="text" id="boss-name" required>
                </div>
                <div class="form-group">
                    <label>Boss Type</label>
                    <select id="boss-type">
                        <option value="combat">Combat Boss ⚔️</option>
                        <option value="economic">Economic Boss 💰</option>
                        <option value="guardian">Guardian Boss 🛡️</option>
                        <option value="legendary">Legendary Boss 👑</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Health</label>
                    <input type="number" id="boss-health" value="1000" min="100" max="10000">
                </div>
                <div class="form-group">
                    <label>Damage</label>
                    <input type="number" id="boss-damage" value="50" min="10" max="500">
                </div>
                <div class="form-group">
                    <label>Speed</label>
                    <input type="number" id="boss-speed" value="5" min="1" max="20">
                </div>
                <div class="form-group">
                    <label>Special Ability</label>
                    <input type="text" id="boss-ability" placeholder="e.g., Lightning Strike">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="boss-description" rows="3" placeholder="Describe your boss..."></textarea>
                </div>
                <div class="form-buttons">
                    <button type="button" onclick="closeModal()">Cancel</button>
                    <button type="submit">Create Boss</button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let websocketConnected = false;
        let bosses = [];
        let activeBattles = [];
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadBosses();
            setupEventListeners();
        });
        
        function setupEventListeners() {
            // Form submission
            document.getElementById('create-boss-form').addEventListener('submit', handleCreateBoss);
            
            // Close modal on outside click
            document.getElementById('create-boss-modal').addEventListener('click', (e) => {
                if (e.target.id === 'create-boss-modal') {
                    closeModal();
                }
            });
        }
        
        async function loadBosses() {
            try {
                const result = await window.electronAPI.getAllBosses();
                if (result.success) {
                    bosses = result.bosses || [];
                    renderBosses();
                    updateBossCount();
                }
            } catch (error) {
                logMessage('❌ Failed to load bosses: ' + error.message, 'system');
            }
        }
        
        function renderBosses() {
            const grid = document.getElementById('boss-grid');
            
            if (bosses.length === 0) {
                grid.innerHTML = '<div class="boss-card"><h3>No bosses created yet</h3><p>Click "Create Boss" to get started!</p></div>';
                return;
            }
            
            grid.innerHTML = bosses.map(boss => \`
                <div class="boss-card">
                    <div class="boss-name">\${boss.name}</div>
                    <div class="boss-stats">
                        <div class="stat">
                            <span>Health:</span>
                            <span>\${boss.health}</span>
                        </div>
                        <div class="stat">
                            <span>Damage:</span>
                            <span>\${boss.damage}</span>
                        </div>
                        <div class="stat">
                            <span>Speed:</span>
                            <span>\${boss.speed}</span>
                        </div>
                        <div class="stat">
                            <span>Type:</span>
                            <span>\${boss.type || 'Combat'}</span>
                        </div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>Creator:</strong> \${boss.creator || 'Unknown'}
                    </div>
                    <div style="margin-bottom: 15px; font-size: 14px; opacity: 0.8;">
                        \${boss.description || 'No description provided.'}
                    </div>
                    <div class="action-buttons">
                        <button onclick="startBattle('\${boss.id}')">⚔️ Battle</button>
                        <button onclick="integrateBoss('\${boss.id}')">🎮 Integrate</button>
                        <button onclick="deleteBoss('\${boss.id}')" style="background: linear-gradient(45deg, #ff6b6b, #ee5a6f);">🗑️ Delete</button>
                    </div>
                </div>
            \`).join('');
        }
        
        function createNewBoss() {
            document.getElementById('create-boss-modal').style.display = 'block';
        }
        
        function closeModal() {
            document.getElementById('create-boss-modal').style.display = 'none';
        }
        
        async function handleCreateBoss(e) {
            e.preventDefault();
            
            const bossData = {
                name: document.getElementById('boss-name').value,
                type: document.getElementById('boss-type').value,
                health: parseInt(document.getElementById('boss-health').value),
                damage: parseInt(document.getElementById('boss-damage').value),
                speed: parseInt(document.getElementById('boss-speed').value),
                specialAbility: document.getElementById('boss-ability').value,
                description: document.getElementById('boss-description').value,
                creator: 'Desktop User'
            };
            
            try {
                const result = await window.electronAPI.createBoss(bossData);
                if (result.success) {
                    logMessage(\`✅ Boss "\${bossData.name}" created successfully!\`, 'system');
                    closeModal();
                    document.getElementById('create-boss-form').reset();
                    loadBosses();
                } else {
                    logMessage('❌ Failed to create boss: ' + result.error, 'system');
                }
            } catch (error) {
                logMessage('❌ Error creating boss: ' + error.message, 'system');
            }
        }
        
        async function startBattle(bossId) {
            try {
                const result = await window.electronAPI.startBattle(bossId);
                if (result.success) {
                    logMessage(\`⚔️ Battle started for boss \${bossId}\`, 'combat');
                    showBattleArena(result.battle);
                } else {
                    logMessage('❌ Failed to start battle: ' + result.error, 'combat');
                }
            } catch (error) {
                logMessage('❌ Error starting battle: ' + error.message, 'combat');
            }
        }
        
        async function integrateBoss(bossId) {
            try {
                // This would call the boss-character integration
                logMessage(\`🎮 Integrating boss \${bossId} with character system...\`, 'system');
                // Implementation would call the integration method
            } catch (error) {
                logMessage('❌ Integration failed: ' + error.message, 'system');
            }
        }
        
        function showBattleArena(battle) {
            const arena = document.getElementById('battle-arena');
            arena.style.display = 'block';
            
            // Render battle participants
            arena.innerHTML = \`
                <div class="arena-grid"></div>
                <div class="boss-sprite" style="top: 50px; left: 50px;"></div>
                <div class="player-sprite" style="top: 200px; left: 200px;"></div>
            \`;
        }
        
        async function exportBossData() {
            try {
                const result = await window.electronAPI.exportBossData();
                if (result.success && !result.cancelled) {
                    logMessage(\`📤 Boss data exported to \${result.path}\`, 'system');
                }
            } catch (error) {
                logMessage('❌ Export failed: ' + error.message, 'system');
            }
        }
        
        async function importBossData() {
            try {
                const result = await window.electronAPI.importBossData();
                if (result.success && !result.cancelled) {
                    logMessage(\`📥 Imported \${result.imported} bosses\`, 'system');
                    loadBosses();
                }
            } catch (error) {
                logMessage('❌ Import failed: ' + error.message, 'system');
            }
        }
        
        function refreshBosses() {
            logMessage('🔄 Refreshing boss list...', 'system');
            loadBosses();
        }
        
        function updateBossCount() {
            document.getElementById('boss-count').textContent = \`\${bosses.length} Bosses\`;
        }
        
        function logMessage(message, type = 'system') {
            const log = document.getElementById('battle-log');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
        
        function updateConnectionStatus(connected) {
            const statusDot = document.getElementById('websocket-status');
            const statusText = document.getElementById('connection-status');
            
            if (connected) {
                statusDot.classList.add('connected');
                statusText.textContent = 'Connected';
                logMessage('🌐 WebSocket connected', 'system');
            } else {
                statusDot.classList.remove('connected');
                statusText.textContent = 'Disconnected';
                logMessage('🔌 WebSocket disconnected', 'system');
            }
        }
        
        // Handle messages from Electron main process
        if (window.electronAPI) {
            window.electronAPI.onWebsocketConnected(() => {
                updateConnectionStatus(true);
            });
            
            window.electronAPI.onWebsocketDisconnected(() => {
                updateConnectionStatus(false);
            });
            
            window.electronAPI.onBattleUpdate((battle) => {
                logMessage(\`⚔️ Battle update: \${battle.status}\`, 'combat');
            });
            
            window.electronAPI.onBossCreated((boss) => {
                logMessage(\`👑 New boss created: \${boss.name}\`, 'system');
                loadBosses();
            });
        }
    </script>
</body>
</html>
`;

// Boss Preload Script
const createBossPreload = () => `
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Boss management
    getAllBosses: () => ipcRenderer.invoke('get-all-bosses'),
    createBoss: (bossData) => ipcRenderer.invoke('create-boss', bossData),
    startBattle: (bossId) => ipcRenderer.invoke('start-battle', bossId),
    
    // Data management
    exportBossData: () => ipcRenderer.invoke('export-boss-data'),
    importBossData: () => ipcRenderer.invoke('import-boss-data'),
    
    // Event listeners
    onWebsocketConnected: (callback) => ipcRenderer.on('websocket-connected', callback),
    onWebsocketDisconnected: (callback) => ipcRenderer.on('websocket-disconnected', callback),
    onBattleUpdate: (callback) => ipcRenderer.on('battle-update', (event, battle) => callback(battle)),
    onBossCreated: (callback) => ipcRenderer.on('boss-created', (event, boss) => callback(boss)),
    onKingdomUpdate: (callback) => ipcRenderer.on('kingdom-update', (event, kingdom) => callback(kingdom)),
    
    // Notifications
    onShowNotification: (callback) => ipcRenderer.on('show-notification', (event, notification) => {
        if (Notification.permission === 'granted') {
            new Notification(notification.title, notification);
        }
        callback(notification);
    })
});
`;

// Auto-generate required files
async function createRequiredFiles() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
        // Create boss-manager.html
        await fs.writeFile(
            path.join(__dirname, 'boss-manager.html'), 
            createBossManagerHTML(), 
            'utf8'
        );
        
        // Create boss-preload.js
        await fs.writeFile(
            path.join(__dirname, 'boss-preload.js'), 
            createBossPreload(), 
            'utf8'
        );
        
        console.log('✅ Boss Manager files created');
    } catch (error) {
        console.error('❌ Failed to create files:', error);
    }
}

// Create files on module load
createRequiredFiles();

// Export the manager class
module.exports = ElectronBossManager;

console.log('🖥️ Electron Boss Manager loaded');
console.log('Features:');
console.log('  ✅ Desktop boss creation and management');
console.log('  ✅ Real-time battle monitoring');
console.log('  ✅ WebSocket integration with battle system');
console.log('  ✅ Boss data import/export');
console.log('  ✅ Integration with existing character system');
console.log('  ✅ Native desktop notifications');
console.log('  ✅ Multi-window synchronization');
console.log('  ✅ Modal dialogs and file operations');