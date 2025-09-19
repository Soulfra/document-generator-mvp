// Unified Electron App - Preserves existing functionality while adding desktop environment
const { app, BrowserWindow, Menu, dialog, ipcMain, shell, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const ElectronStreamingIntegration = require('./electron-streaming-integration');
const DesktopIntegration = require('./desktop-integration');

// Configuration
const SERVER_PORT = 3001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

class UnifiedDocumentGenerator {
    constructor() {
        this.mainWindow = null;
        this.serverProcess = null;
        this.desktopIntegration = null;
        this.streamingIntegration = null;
        this.isServerReady = false;
        this.currentMode = 'desktop'; // 'desktop', 'document', 'wormhole'
        
        console.log('🚀 Unified Document Generator');
        console.log('📱 Desktop + Document Processing + Framework Wormhole');
        
        this.initializeApp();
    }
    
    initializeApp() {
        app.whenReady().then(() => {
            this.setupChromeEnvironment();
            this.startAllServices();
            this.createMainWindow();
            this.setupUnifiedMenu();
        });
        
        app.on('window-all-closed', () => {
            this.cleanup();
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
    }
    
    setupChromeEnvironment() {
        app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar');
        app.commandLine.appendSwitch('disable-renderer-backgrounding');
    }
    
    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1600,
            height: 900,
            minWidth: 1200,
            minHeight: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webviewTag: true,
                preload: path.join(__dirname, 'preload-unified.js')
            },
            titleBarStyle: 'hiddenInset',
            frame: process.platform !== 'darwin',
            backgroundColor: '#0a0a0a',
            show: false
        });
        
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            this.streamingIntegration = new ElectronStreamingIntegration(this.mainWindow);
            
            // Start in desktop mode
            this.loadDesktopEnvironment();
        });
        
        // Handle navigation
        this.mainWindow.webContents.on('will-navigate', (event, url) => {
            console.log('Navigation to:', url);
        });
    }
    
    setupUnifiedMenu() {
        const template = [
            {
                label: 'Document Generator',
                submenu: [
                    {
                        label: 'About',
                        click: () => this.showAbout()
                    },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            },
            {
                label: 'Mode',
                submenu: [
                    {
                        label: '🖥️ Desktop Environment',
                        type: 'radio',
                        checked: true,
                        click: () => this.switchMode('desktop')
                    },
                    {
                        label: '📄 Document Processor',
                        type: 'radio',
                        click: () => this.switchMode('document')
                    },
                    {
                        label: '🌀 Framework Wormhole',
                        type: 'radio',
                        click: () => this.switchMode('wormhole')
                    },
                    {
                        label: '💎 Differential Games',
                        type: 'radio',
                        click: () => this.switchMode('differential')
                    },
                    {
                        label: '💰 Crypto Arbitrage Terminal',
                        type: 'radio',
                        click: () => this.switchMode('crypto')
                    },
                    {
                        label: '🌍 Universal Data Terminal',
                        type: 'radio',
                        click: () => this.switchMode('universal')
                    },
                    { type: 'separator' },
                    {
                        label: '🎮 Original Interface',
                        click: () => this.loadOriginalInterface()
                    }
                ]
            },
            {
                label: 'Services',
                submenu: [
                    {
                        label: 'Verify All Services',
                        click: () => this.verifyServices()
                    },
                    {
                        label: 'View Blamechain',
                        click: () => this.openBlamechain()
                    },
                    { type: 'separator' },
                    {
                        label: 'Start Docker',
                        click: () => this.startDocker()
                    },
                    {
                        label: 'Stop Docker',
                        click: () => this.stopDocker()
                    }
                ]
            },
            {
                label: 'Wormhole',
                submenu: [
                    {
                        label: 'SimpleMachines Forum',
                        click: () => this.wormholeFramework('smf')
                    },
                    {
                        label: 'phpBB',
                        click: () => this.wormholeFramework('phpbb')
                    },
                    {
                        label: 'WordPress',
                        click: () => this.wormholeFramework('wordpress')
                    },
                    {
                        label: 'Discourse',
                        click: () => this.wormholeFramework('discourse')
                    },
                    { type: 'separator' },
                    {
                        label: 'Custom URL...',
                        click: () => this.wormholeCustom()
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
    
    startAllServices() {
        console.log('🚀 Starting all services...');
        
        // Start main server
        this.serverProcess = spawn('node', ['server.js'], {
            cwd: __dirname,
            env: { ...process.env, PORT: SERVER_PORT }
        });
        
        this.serverProcess.stdout.on('data', (data) => {
            console.log(`Server: ${data}`);
            if (data.toString().includes('running on port')) {
                this.isServerReady = true;
            }
        });
        
        // Start desktop integration
        this.desktopIntegration = spawn('node', ['desktop-integration.js'], {
            cwd: __dirname
        });
        
        this.desktopIntegration.stdout.on('data', (data) => {
            console.log(`Desktop: ${data}`);
        });
        
        // Start streaming system
        spawn('node', ['integrated-streaming-system.js'], {
            cwd: __dirname,
            detached: true
        });
        
        // Start differential game extractor
        spawn('node', ['differential-game-extractor.js'], {
            cwd: __dirname,
            detached: true
        });
        
        // Start UNIVERSAL data aggregator (everything, everywhere, all at once)
        spawn('node', ['universal-data-aggregator.js'], {
            cwd: __dirname,
            detached: true
        });
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        switch (mode) {
            case 'desktop':
                this.loadDesktopEnvironment();
                break;
                
            case 'document':
                this.loadDocumentInterface();
                break;
                
            case 'wormhole':
                this.loadWormholeInterface();
                break;
                
            case 'differential':
                this.loadDifferentialInterface();
                break;
                
            case 'crypto':
                this.loadCryptoTerminal();
                break;
                
            case 'universal':
                this.loadUniversalTerminal();
                break;
        }
    }
    
    loadDesktopEnvironment() {
        const verificationPath = path.join(__dirname, 'verification-dashboard.html');
        this.mainWindow.loadFile(verificationPath);
        this.mainWindow.setTitle('Document Generator - System Verification');
    }
    
    loadDocumentInterface() {
        this.mainWindow.loadURL(SERVER_URL);
        this.mainWindow.setTitle('Document Generator - Document Processor');
    }
    
    loadWormholeInterface() {
        const wormholePath = path.join(__dirname, 'wormhole-interface.html');
        
        // Check if wormhole interface exists, otherwise create it
        const fs = require('fs');
        if (!fs.existsSync(wormholePath)) {
            this.createWormholeInterface();
        }
        
        this.mainWindow.loadFile(wormholePath);
        this.mainWindow.setTitle('Document Generator - Framework Wormhole');
    }
    
    loadDifferentialInterface() {
        const differentialPath = path.join(__dirname, 'differential-game-interface.html');
        this.mainWindow.loadFile(differentialPath);
        this.mainWindow.setTitle('Document Generator - Differential Game Extractor');
    }
    
    loadCryptoTerminal() {
        const cryptoPath = path.join(__dirname, 'crypto-differential-terminal.html');
        this.mainWindow.loadFile(cryptoPath);
        this.mainWindow.setTitle('Document Generator - Crypto Arbitrage Terminal');
    }
    
    loadUniversalTerminal() {
        const universalPath = path.join(__dirname, 'universal-terminal.html');
        this.mainWindow.loadFile(universalPath);
        this.mainWindow.setTitle('Document Generator - Universal Data Terminal');
    }
    
    loadOriginalInterface() {
        // Load the original free tier interface
        this.mainWindow.loadURL(`${SERVER_URL}/free`);
        this.mainWindow.setTitle('Document Generator - Original');
    }
    
    wormholeFramework(framework) {
        // Send message to load framework wormhole
        this.mainWindow.webContents.send('wormhole-framework', framework);
        
        // If not in wormhole mode, switch to it
        if (this.currentMode !== 'wormhole') {
            this.switchMode('wormhole');
        }
    }
    
    wormholeCustom() {
        dialog.showInputBox({
            title: 'Custom Framework URL',
            label: 'Enter URL to wormhole:',
            value: 'https://',
            inputType: 'url'
        }).then(result => {
            if (!result.canceled && result.value) {
                this.mainWindow.webContents.send('wormhole-custom', result.value);
                
                if (this.currentMode !== 'wormhole') {
                    this.switchMode('wormhole');
                }
            }
        });
    }
    
    createWormholeInterface() {
        // This will be created in the next step
        console.log('Creating wormhole interface...');
    }
    
    verifyServices() {
        this.mainWindow.webContents.send('verify-services');
    }
    
    openBlamechain() {
        this.mainWindow.webContents.send('open-blamechain');
    }
    
    startDocker() {
        spawn('docker-compose', ['up', '-d'], {
            cwd: __dirname,
            shell: true
        });
    }
    
    stopDocker() {
        spawn('docker-compose', ['down'], {
            cwd: __dirname,
            shell: true
        });
    }
    
    showAbout() {
        dialog.showMessageBox({
            type: 'info',
            title: 'About Document Generator',
            message: 'Document Generator Unified Platform',
            detail: `Version 2.0.0
            
Features:
• Desktop Environment with Winamp-style player
• Document to MVP processor
• Framework Wormhole for integrating open source
• Blamechain verification
• Real-time streaming with QR codes
            
Modes:
• Desktop - Full monitoring environment
• Document - Process documents to MVPs
• Wormhole - Integrate SimpleMachines, phpBB, etc.`,
            buttons: ['OK']
        });
    }
    
    cleanup() {
        if (this.serverProcess) {
            this.serverProcess.kill();
        }
        if (this.desktopIntegration) {
            this.desktopIntegration.kill();
        }
    }
}

// Start the app
new UnifiedDocumentGenerator();