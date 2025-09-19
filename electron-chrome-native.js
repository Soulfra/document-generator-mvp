// Electron Chrome Native - Document Generator
// Runs localhost in embedded Chrome for native desktop feel

const { app, BrowserWindow, Menu, dialog, ipcMain, shell, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const ElectronStreamingIntegration = require('./electron-streaming-integration');

// Configuration
const SERVER_PORT = 3001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

class DocumentGeneratorNative {
    constructor() {
        this.mainWindow = null;
        this.serverProcess = null;
        this.isServerReady = false;
        this.humanVerificationPending = false;
        this.streamingIntegration = null;
        
        console.log('🚀 Document Generator Native Chrome');
        console.log('📱 Desktop app with embedded Chrome running localhost');
        
        this.initializeApp();
    }
    
    initializeApp() {
        // Single instance lock
        const gotTheLock = app.requestSingleInstanceLock();
        
        if (!gotTheLock) {
            app.quit();
            return;
        }
        
        app.on('second-instance', () => {
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized()) this.mainWindow.restore();
                this.mainWindow.focus();
            }
        });
        
        app.whenReady().then(() => {
            this.setupChromeEnvironment();
            this.startLocalServer();
            this.createMainWindow();
            this.setupMenu();
        });
        
        app.on('window-all-closed', () => {
            this.cleanup();
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
        
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });
    }
    
    setupChromeEnvironment() {
        // Set Chrome flags for better performance
        app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar');
        app.commandLine.appendSwitch('disable-renderer-backgrounding');
        
        // Enable Chrome DevTools features
        app.commandLine.appendSwitch('remote-debugging-port', '9222');
        
        // Set user agent to Chrome
        const chromeVersion = process.versions.chrome || '120.0.0.0';
        session.defaultSession.setUserAgent(
            `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
        );
    }
    
    createMainWindow() {
        // Create native Chrome-like window
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webviewTag: true,
                preload: path.join(__dirname, 'preload-chrome.js')
            },
            titleBarStyle: 'hiddenInset', // macOS native feel
            frame: process.platform !== 'darwin', // Native frame on Windows/Linux
            backgroundColor: '#1a1a1a',
            show: false
        });
        
        // Set window title
        this.mainWindow.setTitle('Document Generator - Chrome');
        
        // Show when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Initialize streaming integration
            this.streamingIntegration = new ElectronStreamingIntegration(this.mainWindow);
            
            // Open DevTools in development
            if (process.env.NODE_ENV === 'development') {
                this.mainWindow.webContents.openDevTools();
            }
        });
        
        // Handle new window requests (open in same window)
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
                this.mainWindow.loadURL(url);
                return { action: 'deny' };
            }
            // External links open in system browser
            shell.openExternal(url);
            return { action: 'deny' };
        });
        
        // Load the app when server is ready
        this.loadAppWhenReady();
    }
    
    startLocalServer() {
        console.log('🚀 Starting local server...');
        
        // Start the Document Generator server
        this.serverProcess = spawn('node', ['server.js'], {
            cwd: __dirname,
            env: { ...process.env, PORT: SERVER_PORT }
        });
        
        this.serverProcess.stdout.on('data', (data) => {
            console.log(`Server: ${data}`);
            if (data.toString().includes('running on port') || 
                data.toString().includes('Agent platform running')) {
                this.isServerReady = true;
            }
        });
        
        this.serverProcess.stderr.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });
        
        this.serverProcess.on('close', (code) => {
            console.log(`Server exited with code ${code}`);
            this.isServerReady = false;
        });
    }
    
    loadAppWhenReady() {
        const checkServer = setInterval(() => {
            if (this.isServerReady && this.mainWindow) {
                clearInterval(checkServer);
                console.log('✅ Server ready, loading app...');
                
                // Load with human verification
                this.loadWithVerification();
            }
        }, 500);
        
        // Timeout after 30 seconds
        setTimeout(() => {
            clearInterval(checkServer);
            if (!this.isServerReady) {
                dialog.showErrorBox('Server Error', 'Failed to start local server');
                app.quit();
            }
        }, 30000);
    }
    
    loadWithVerification() {
        // Load the desktop environment directly
        const desktopPath = path.join(__dirname, 'desktop-streaming-environment.html');
        this.mainWindow.loadFile(desktopPath);
        
        // Inject the server URL for API calls
        this.mainWindow.webContents.on('did-finish-load', () => {
            this.mainWindow.webContents.executeJavaScript(`
                window.SERVER_URL = '${SERVER_URL}';
                console.log('Desktop environment loaded with server at:', window.SERVER_URL);
            `);
        });
        
        return;
        
        // Original verification HTML (kept for reference)
        const verificationHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Document Generator - Verification</title>
    <style>
        body {
            background: #0a0a0a;
            color: #00ff88;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 0 40px rgba(0, 255, 136, 0.2);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #00ff88, #00aaff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .status {
            font-size: 1.2em;
            margin: 20px 0;
        }
        button {
            background: linear-gradient(45deg, #00ff88, #00aaff);
            color: #0a0a0a;
            border: none;
            padding: 15px 40px;
            font-size: 1.1em;
            border-radius: 30px;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.2s;
            margin: 10px;
        }
        button:hover {
            transform: scale(1.05);
        }
        .info {
            margin-top: 30px;
            font-size: 0.9em;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Document Generator</h1>
        <div class="status">✅ Server is running on localhost:${SERVER_PORT}</div>
        <p>Transform any document into a working MVP in < 30 minutes</p>
        
        <h3>Human Verification Required</h3>
        <p>Please confirm you want to proceed with the Document Generator</p>
        
        <button onclick="proceed()">✓ Proceed to App</button>
        <button onclick="openDevTools()">🔧 Open DevTools</button>
        
        <div class="info">
            <p>Running in Chrome: ${process.versions.chrome}</p>
            <p>Electron: ${process.versions.electron}</p>
            <p>Node: ${process.versions.node}</p>
        </div>
    </div>
    
    <script>
        function proceed() {
            window.location.href = '${SERVER_URL}';
        }
        
        function openDevTools() {
            if (window.electronAPI) {
                window.electronAPI.openDevTools();
            }
        }
    </script>
</body>
</html>`;
        
        // Load verification page
        this.mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(verificationHTML)}`);
        
        // Listen for navigation to actual app
        this.mainWindow.webContents.on('did-navigate', (event, url) => {
            if (url.startsWith(SERVER_URL)) {
                console.log('✅ Human verified, app loaded');
                this.humanVerificationPending = false;
            }
        });
    }
    
    setupMenu() {
        const template = [
            {
                label: 'Document Generator',
                submenu: [
                    {
                        label: 'About',
                        click: () => {
                            dialog.showMessageBox({
                                type: 'info',
                                title: 'About Document Generator',
                                message: 'Document Generator Native',
                                detail: 'Transform any document into a working MVP in < 30 minutes\n\nRunning on localhost with embedded Chrome',
                                buttons: ['OK']
                            });
                        }
                    },
                    { type: 'separator' },
                    { role: 'quit' }
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
            },
            {
                label: 'Navigate',
                submenu: [
                    {
                        label: 'Home',
                        click: () => this.mainWindow.loadURL(SERVER_URL)
                    },
                    {
                        label: 'Master Menu',
                        click: () => this.mainWindow.loadURL(`${SERVER_URL}/master`)
                    },
                    {
                        label: 'Economy Dashboard',
                        click: () => this.mainWindow.loadURL(`${SERVER_URL}/economy`)
                    },
                    {
                        label: 'Claude Chat',
                        click: () => this.mainWindow.loadFile('claude-chat.html')
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
    
    cleanup() {
        if (this.serverProcess) {
            console.log('🛑 Stopping server...');
            this.serverProcess.kill();
        }
    }
}

// Start the app
new DocumentGeneratorNative();

// IPC handlers
ipcMain.handle('open-devtools', () => {
    BrowserWindow.getFocusedWindow()?.webContents.openDevTools();
});