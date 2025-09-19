#!/usr/bin/env node

/**
 * 🦾🤖 JARVIS HUD ELECTRON APP
 * ============================
 * Ironman-style HUD interface that integrates all reasoning systems
 * - Cross-platform deployment (Chromebook, Chrome, Apple)
 * - Real-time reasoning visualization
 * - Fog of war exploration
 * - Boss room cursor overlay
 * - AI context bridge
 */

const { app, BrowserWindow, ipcMain, screen, globalShortcut, Menu, Tray, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

class JarvisHUD {
    constructor() {
        this.mainWindow = null;
        this.hudOverlay = null;
        this.tray = null;
        this.services = new Map();
        this.isHUDActive = false;
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        
        // HUD Configuration
        this.hudConfig = {
            opacity: 0.85,
            clickThrough: false,
            alwaysOnTop: true,
            frame: false,
            transparent: true,
            webSecurity: false,
            allowRunningInsecureContent: true
        };
        
        this.init();
    }
    
    async init() {
        console.log('🦾🤖 JARVIS HUD INITIALIZING');
        console.log('============================');
        
        await this.ensureDirectories();
        await this.createConfig();
        this.setupElectronEvents();
        
        console.log('🚀 Jarvis HUD ready for activation');
    }
    
    async ensureDirectories() {
        const dirs = [
            this.vizDir,
            path.join(this.vizDir, 'electron'),
            path.join(this.vizDir, 'pwa'),
            path.join(this.vizDir, 'hud-data'),
            path.join(this.vizDir, 'screenshots')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async createConfig() {
        const configPath = path.join(this.vizDir, 'jarvis-config.json');
        
        const defaultConfig = {
            hud: {
                theme: 'ironman',
                opacity: 0.85,
                position: 'overlay',
                hotkey: 'CommandOrControl+J',
                autoStart: false
            },
            reasoning: {
                enabled: true,
                colors: {
                    thought: '#00ffff',
                    action: '#ff0040',
                    exploration: '#ff00ff',
                    discovery: '#00ff00',
                    emotion: '#ffff00'
                }
            },
            platforms: {
                electron: true,
                pwa: true,
                chrome: true,
                chromebook: true,
                apple: true
            },
            services: {
                reasoningViz: 'http://localhost:3006',
                aiBridge: 'http://localhost:3007',
                fogOfWar: true,
                bossRoom: true
            }
        };
        
        try {
            await fs.access(configPath);
        } catch {
            await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
        }
        
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        this.config = { ...defaultConfig, ...config };
    }
    
    setupElectronEvents() {
        app.whenReady().then(() => {
            this.createMainWindow();
            this.createSystemTray();
            this.registerHotkeys();
            this.startBackgroundServices();
            
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow();
                }
            });
        });
        
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                this.cleanup();
                app.quit();
            }
        });
        
        app.on('will-quit', () => {
            this.cleanup();
        });
    }
    
    createMainWindow() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        
        this.mainWindow = new BrowserWindow({
            width: Math.floor(width * 0.8),
            height: Math.floor(height * 0.8),
            x: Math.floor(width * 0.1),
            y: Math.floor(height * 0.1),
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                webSecurity: false
            },
            title: '🦾🤖 Jarvis HUD - Document Generator',
            icon: this.getAppIcon(),
            show: false,
            titleBarStyle: 'hiddenInset',
            backgroundColor: '#000000',
            vibrancy: 'dark'
        });
        
        // Load main interface
        this.mainWindow.loadFile(path.join(__dirname, 'jarvis-main-interface.html'));
        
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            if (this.config.hud.autoStart) {
                setTimeout(() => this.activateHUD(), 2000);
            }
        });
        
        // Development tools
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }
    }
    
    async activateHUD() {
        if (this.isHUDActive) {
            return this.deactivateHUD();
        }
        
        console.log('🦾 Activating Jarvis HUD');
        
        const displays = screen.getAllDisplays();
        
        // Create HUD overlay for each display
        for (const display of displays) {
            const hudWindow = new BrowserWindow({
                ...this.hudConfig,
                x: display.bounds.x,
                y: display.bounds.y,
                width: display.bounds.width,
                height: display.bounds.height,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    webSecurity: false
                },
                skipTaskbar: true,
                resizable: false,
                movable: false,
                minimizable: false,
                maximizable: false,
                closable: false
            });
            
            hudWindow.setIgnoreMouseEvents(this.hudConfig.clickThrough);
            hudWindow.loadFile(path.join(__dirname, 'jarvis-hud-overlay.html'));
            
            this.hudOverlay = hudWindow;
        }
        
        this.isHUDActive = true;
        
        // Start all integrated services
        await this.activateIntegratedServices();
        
        // Notify main window
        if (this.mainWindow) {
            this.mainWindow.webContents.send('hud-activated');
        }
    }
    
    deactivateHUD() {
        console.log('🛑 Deactivating Jarvis HUD');
        
        if (this.hudOverlay) {
            this.hudOverlay.close();
            this.hudOverlay = null;
        }
        
        this.isHUDActive = false;
        
        if (this.mainWindow) {
            this.mainWindow.webContents.send('hud-deactivated');
        }
    }
    
    async activateIntegratedServices() {
        // Start reasoning visualization
        if (this.config.services.reasoningViz) {
            await this.startService('reasoning-viz', [
                'node', 'reasoning-viz-manager.js'
            ]);
        }
        
        // Start AI bridge
        if (this.config.services.aiBridge) {
            await this.startService('ai-bridge', [
                'node', 'ai-reasoning-bridge.js'
            ]);
        }
        
        // Notify HUD of service status
        if (this.hudOverlay) {
            this.hudOverlay.webContents.send('services-ready', {
                reasoningViz: this.services.has('reasoning-viz'),
                aiBridge: this.services.has('ai-bridge')
            });
        }
    }
    
    async startService(name, command) {
        try {
            const process = spawn(command[0], command.slice(1), {
                cwd: process.cwd(),
                stdio: 'pipe'
            });
            
            this.services.set(name, process);
            
            process.stdout.on('data', (data) => {
                console.log(`[${name}] ${data.toString().trim()}`);
            });
            
            process.stderr.on('data', (data) => {
                console.error(`[${name}] ${data.toString().trim()}`);
            });
            
            process.on('close', (code) => {
                console.log(`[${name}] Process exited with code ${code}`);
                this.services.delete(name);
            });
            
            console.log(`✅ Started service: ${name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to start ${name}:`, error);
            return false;
        }
    }
    
    createSystemTray() {
        this.tray = new Tray(this.getAppIcon());
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '🦾 Activate HUD',
                type: 'normal',
                click: () => this.activateHUD()
            },
            {
                label: '🛑 Deactivate HUD',
                type: 'normal',
                click: () => this.deactivateHUD()
            },
            { type: 'separator' },
            {
                label: '🧠 Reasoning Viz',
                type: 'normal',
                click: () => this.openReasoningViz()
            },
            {
                label: '🤖 AI Bridge',
                type: 'normal',
                click: () => this.openAIBridge()
            },
            { type: 'separator' },
            {
                label: '⚙️ Settings',
                type: 'normal',
                click: () => this.openSettings()
            },
            {
                label: '📊 Stats',
                type: 'normal',
                click: () => this.showStats()
            },
            { type: 'separator' },
            {
                label: '🔄 Restart Services',
                type: 'normal',
                click: () => this.restartServices()
            },
            {
                label: '❌ Quit Jarvis',
                type: 'normal',
                click: () => app.quit()
            }
        ]);
        
        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip('🦾🤖 Jarvis HUD - Document Generator');
        
        this.tray.on('double-click', () => {
            if (this.mainWindow) {
                this.mainWindow.show();
                this.mainWindow.focus();
            }
        });
    }
    
    registerHotkeys() {
        // HUD toggle
        globalShortcut.register(this.config.hud.hotkey, () => {
            this.activateHUD();
        });
        
        // Quick reasoning log
        globalShortcut.register('CommandOrControl+Shift+R', () => {
            this.quickReasoningLog();
        });
        
        // Screenshot with reasoning context
        globalShortcut.register('CommandOrControl+Shift+S', () => {
            this.screenshotWithContext();
        });
    }
    
    async quickReasoningLog() {
        const { response } = await dialog.showMessageBox(this.mainWindow, {
            type: 'question',
            title: '🧠 Quick Reasoning Log',
            message: 'What are you thinking about?',
            buttons: ['Thought', 'Action', 'Exploration', 'Cancel'],
            defaultId: 0,
            cancelId: 3
        });
        
        if (response === 3) return;
        
        const types = ['thought', 'action', 'exploration'];
        const type = types[response];
        
        // This would integrate with reasoning-logger.js
        // For now, we'll create a simple entry
        const entry = {
            type,
            text: `Quick ${type} entry from Jarvis HUD`,
            timestamp: new Date().toISOString(),
            source: 'jarvis-hotkey'
        };
        
        console.log('📝 Quick reasoning log:', entry);
    }
    
    async screenshotWithContext() {
        const screenshot = await this.captureScreen();
        const context = await this.getCurrentReasoningContext();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `jarvis-context-${timestamp}.png`;
        const filepath = path.join(this.vizDir, 'screenshots', filename);
        
        await fs.writeFile(filepath, screenshot);
        
        console.log('📸 Screenshot with context saved:', filepath);
        
        // Show notification
        if (this.hudOverlay) {
            this.hudOverlay.webContents.send('screenshot-taken', {
                filepath,
                context
            });
        }
    }
    
    async captureScreen() {
        // This would capture the screen
        // For now, return placeholder
        return Buffer.from('screenshot-placeholder');
    }
    
    async getCurrentReasoningContext() {
        try {
            const response = await fetch('http://localhost:3007/api/ai/context?format=summary');
            const data = await response.json();
            return data.context;
        } catch (error) {
            return 'No reasoning context available';
        }
    }
    
    openReasoningViz() {
        const { shell } = require('electron');
        shell.openExternal('http://localhost:3006');
    }
    
    openAIBridge() {
        const { shell } = require('electron');
        shell.openExternal('http://localhost:3007');
    }
    
    openSettings() {
        // Create settings window
        const settingsWindow = new BrowserWindow({
            width: 800,
            height: 600,
            parent: this.mainWindow,
            modal: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            title: '⚙️ Jarvis HUD Settings'
        });
        
        settingsWindow.loadFile(path.join(__dirname, 'jarvis-settings.html'));
    }
    
    async showStats() {
        try {
            const stats = await this.gatherStats();
            
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: '📊 Jarvis HUD Stats',
                message: 'System Statistics',
                detail: `
HUD Active: ${this.isHUDActive ? 'Yes' : 'No'}
Active Services: ${this.services.size}
Reasoning Entries: ${stats.reasoningEntries || 0}
Uptime: ${stats.uptime}
Memory Usage: ${stats.memoryUsage}
                `.trim()
            });
        } catch (error) {
            dialog.showErrorBox('Stats Error', error.message);
        }
    }
    
    async gatherStats() {
        const uptime = process.uptime();
        const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        
        return {
            uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
            memoryUsage: `${memoryUsage} MB`,
            reasoningEntries: 0 // Would fetch from logger
        };
    }
    
    async restartServices() {
        console.log('🔄 Restarting all services...');
        
        // Stop all services
        for (const [name, process] of this.services) {
            process.kill();
        }
        
        this.services.clear();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Restart services
        await this.activateIntegratedServices();
        
        console.log('✅ Services restarted');
    }
    
    getAppIcon() {
        // Return path to app icon
        return path.join(__dirname, 'assets', 'jarvis-icon.png');
    }
    
    cleanup() {
        console.log('🧹 Cleaning up Jarvis HUD...');
        
        // Unregister hotkeys
        globalShortcut.unregisterAll();
        
        // Stop all services
        for (const [name, process] of this.services) {
            try {
                process.kill();
            } catch (error) {
                console.warn(`Failed to kill ${name}:`, error);
            }
        }
        
        console.log('✅ Cleanup complete');
    }
}

// IPC handlers for communication with renderer processes
ipcMain.handle('get-config', () => {
    return jarvis.config;
});

ipcMain.handle('update-config', async (event, newConfig) => {
    jarvis.config = { ...jarvis.config, ...newConfig };
    const configPath = path.join(jarvis.vizDir, 'jarvis-config.json');
    await fs.writeFile(configPath, JSON.stringify(jarvis.config, null, 2));
    return jarvis.config;
});

ipcMain.handle('toggle-hud', () => {
    return jarvis.activateHUD();
});

ipcMain.handle('get-reasoning-context', async () => {
    return jarvis.getCurrentReasoningContext();
});

ipcMain.handle('log-reasoning', (event, type, text) => {
    // Would integrate with reasoning-logger.js
    console.log(`Reasoning log from renderer: ${type} - ${text}`);
});

// Create and start Jarvis HUD
const jarvis = new JarvisHUD();

// Handle app startup
if (require.main === module) {
    console.log('🦾🤖 JARVIS HUD ELECTRON APP');
    console.log('=============================');
    console.log('🚀 Starting Ironman-style HUD interface...');
    console.log('📱 Cross-platform deployment ready');
    console.log('🧠 Reasoning visualization integrated');
    console.log('🎮 Fog of war exploration available');
    console.log('👁️ AI context bridge active');
}

module.exports = JarvisHUD;