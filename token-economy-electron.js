// token-economy-electron.js - Electron app for DGAI Token Economy
// Freemium game market flipped on its head - users earn while they build

const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

console.log(`
🎮 DGAI TOKEN ECONOMY ELECTRON APP 🎮
Freemium gaming meets document generation
Flip the market - users earn while they play
`);

class TokenEconomyElectronApp {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.services = new Map();
        this.gameState = {
            userId: 'electron-player',
            balance: 0,
            level: 1,
            experience: 0,
            achievements: [],
            inventory: []
        };
        
        // Service ports
        this.servicePorts = {
            tokenEconomy: 9495,
            billing: 9494,
            contextManager: 7778,
            cryptoVault: 8888,
            mirrorBreaker: 8090
        };
    }
    
    async createWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                webSecurity: false // For local API calls
            },
            titleBarStyle: 'hiddenInset',
            backgroundColor: '#1a1a1a',
            icon: path.join(__dirname, 'assets', 'dgai-icon.png')
        });
        
        // Create the game menu
        this.createGameMenu();
        
        // Load the game interface
        this.mainWindow.loadFile('token-economy-game.html');
        
        // Open DevTools in development
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }
        
        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
        
        // Start backend services
        await this.startBackendServices();
        
        // Create system tray
        this.createSystemTray();
    }
    
    createGameMenu() {
        const template = [
            {
                label: '🎮 Game',
                submenu: [
                    {
                        label: '🎰 Gacha Pull',
                        accelerator: 'CmdOrCtrl+G',
                        click: () => this.performGachaPull()
                    },
                    {
                        label: '💱 Token Swap',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => this.openSwapInterface()
                    },
                    {
                        label: '📊 Liquidity Pools',
                        accelerator: 'CmdOrCtrl+L',
                        click: () => this.openLiquidityInterface()
                    },
                    { type: 'separator' },
                    {
                        label: '🏆 Leaderboard',
                        click: () => this.showLeaderboard()
                    },
                    {
                        label: '🎯 Achievements',
                        click: () => this.showAchievements()
                    },
                    { type: 'separator' },
                    {
                        label: 'Quit',
                        accelerator: 'CmdOrCtrl+Q',
                        click: () => app.quit()
                    }
                ]
            },
            {
                label: '🛠️ Services',
                submenu: [
                    {
                        label: '📄 Document Generator',
                        click: () => this.openDocumentGenerator()
                    },
                    {
                        label: '🤖 AI Playground',
                        click: () => this.openAIPlayground()
                    },
                    {
                        label: '🔗 Template Market',
                        click: () => this.openTemplateMarket()
                    },
                    { type: 'separator' },
                    {
                        label: '⚡ Spawn All Layers',
                        click: () => this.spawnAllLayers()
                    }
                ]
            },
            {
                label: '💰 Economy',
                submenu: [
                    {
                        label: '👛 My Wallet',
                        click: () => this.showWallet()
                    },
                    {
                        label: '📈 Market Data',
                        click: () => this.showMarketData()
                    },
                    {
                        label: '🎲 Betting Pool',
                        click: () => this.openBettingPool()
                    },
                    { type: 'separator' },
                    {
                        label: '💸 Cash Out',
                        click: () => this.initiateCashOut()
                    }
                ]
            },
            {
                label: '🔧 Debug',
                submenu: [
                    {
                        label: 'Developer Tools',
                        accelerator: 'F12',
                        click: () => this.mainWindow.webContents.openDevTools()
                    },
                    {
                        label: 'Reload',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => this.mainWindow.reload()
                    },
                    {
                        label: 'Service Status',
                        click: () => this.checkServiceStatus()
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
    
    createSystemTray() {
        // Create tray icon
        this.tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: `Balance: ${this.gameState.balance} DGAI`,
                enabled: false
            },
            { type: 'separator' },
            {
                label: '🎰 Quick Gacha',
                click: () => this.performGachaPull()
            },
            {
                label: '📊 Dashboard',
                click: () => this.mainWindow.show()
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => app.quit()
            }
        ]);
        
        this.tray.setToolTip('DGAI Token Economy');
        this.tray.setContextMenu(contextMenu);
    }
    
    async startBackendServices() {
        console.log('🚀 Starting backend services...');
        
        // Start token economy service
        const tokenEconomy = spawn('node', ['unified-token-liquidity-gacha-economy.js'], {
            detached: false,
            stdio: 'inherit'
        });
        this.services.set('tokenEconomy', tokenEconomy);
        
        // Start billing service
        const billing = spawn('node', ['stripe-monero-mirror-billing-integration.js'], {
            detached: false,
            stdio: 'inherit'
        });
        this.services.set('billing', billing);
        
        // Wait for services to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Backend services started');
        
        // Initialize player wallet
        await this.initializePlayerWallet();
    }
    
    async initializePlayerWallet() {
        try {
            const response = await fetch(`http://localhost:${this.servicePorts.tokenEconomy}/faucet/${this.gameState.userId}`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                this.gameState.balance = data.newBalance;
                console.log(`💰 Player wallet initialized with ${data.newBalance} DGAI`);
            }
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
        }
    }
    
    async performGachaPull() {
        // Send gacha pull request to main window
        this.mainWindow.webContents.send('perform-gacha', {
            userId: this.gameState.userId,
            cost: 100
        });
    }
    
    openSwapInterface() {
        this.mainWindow.webContents.send('open-interface', 'swap');
    }
    
    openLiquidityInterface() {
        this.mainWindow.webContents.send('open-interface', 'liquidity');
    }
    
    showLeaderboard() {
        this.mainWindow.webContents.send('open-interface', 'leaderboard');
    }
    
    showAchievements() {
        this.mainWindow.webContents.send('open-interface', 'achievements');
    }
    
    openDocumentGenerator() {
        this.mainWindow.webContents.send('open-interface', 'document-generator');
    }
    
    openAIPlayground() {
        this.mainWindow.webContents.send('open-interface', 'ai-playground');
    }
    
    openTemplateMarket() {
        this.mainWindow.webContents.send('open-interface', 'template-market');
    }
    
    async spawnAllLayers() {
        console.log('⚡ Spawning all 73 layers...');
        
        // This would spawn all layers
        const result = await this.mainWindow.webContents.executeJavaScript(`
            window.spawnAllLayers();
        `);
        
        console.log('✅ All layers spawned');
    }
    
    showWallet() {
        this.mainWindow.webContents.send('open-interface', 'wallet');
    }
    
    showMarketData() {
        this.mainWindow.webContents.send('open-interface', 'market');
    }
    
    openBettingPool() {
        this.mainWindow.webContents.send('open-interface', 'betting');
    }
    
    async initiateCashOut() {
        // Open cash out interface
        const cashOutWindow = new BrowserWindow({
            width: 600,
            height: 400,
            parent: this.mainWindow,
            modal: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        
        cashOutWindow.loadFile('cash-out.html');
    }
    
    async checkServiceStatus() {
        const status = {};
        
        for (const [name, port] of Object.entries(this.servicePorts)) {
            try {
                const response = await fetch(`http://localhost:${port}/status`);
                status[name] = response.ok;
            } catch (error) {
                status[name] = false;
            }
        }
        
        this.mainWindow.webContents.send('service-status', status);
    }
    
    // IPC handlers
    setupIPCHandlers() {
        // Handle balance updates
        ipcMain.on('update-balance', (event, balance) => {
            this.gameState.balance = balance;
            
            // Update tray menu
            this.updateTrayBalance();
        });
        
        // Handle achievements
        ipcMain.on('achievement-unlocked', (event, achievement) => {
            this.gameState.achievements.push(achievement);
            
            // Show notification
            const notification = new Notification({
                title: '🏆 Achievement Unlocked!',
                body: achievement.name,
                icon: path.join(__dirname, 'assets', 'achievement-icon.png')
            });
            
            notification.show();
        });
        
        // Handle level up
        ipcMain.on('level-up', (event, level) => {
            this.gameState.level = level;
            
            const notification = new Notification({
                title: '🎉 Level Up!',
                body: `You reached level ${level}!`,
                icon: path.join(__dirname, 'assets', 'levelup-icon.png')
            });
            
            notification.show();
        });
    }
    
    updateTrayBalance() {
        if (!this.tray) return;
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: `Balance: ${this.gameState.balance} DGAI`,
                enabled: false
            },
            { type: 'separator' },
            {
                label: '🎰 Quick Gacha',
                click: () => this.performGachaPull()
            },
            {
                label: '📊 Dashboard',
                click: () => this.mainWindow.show()
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => app.quit()
            }
        ]);
        
        this.tray.setContextMenu(contextMenu);
    }
    
    async cleanup() {
        console.log('🧹 Cleaning up services...');
        
        // Kill all spawned services
        for (const [name, process] of this.services) {
            console.log(`Stopping ${name}...`);
            process.kill();
        }
        
        // Clear services
        this.services.clear();
    }
}

// App event handlers
app.whenReady().then(async () => {
    const tokenEconomyApp = new TokenEconomyElectronApp();
    await tokenEconomyApp.createWindow();
    tokenEconomyApp.setupIPCHandlers();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            tokenEconomyApp.createWindow();
        }
    });
    
    app.on('before-quit', async () => {
        await tokenEconomyApp.cleanup();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});