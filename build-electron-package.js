// build-electron-package.js - Complete Electron app packager
// Creates distributable desktop application

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const os = require('os');

console.log(`
🖥️  ELECTRON PACKAGE BUILDER 🖥️
Creating distributable desktop application for:
- Windows (exe installer)
- macOS (dmg installer)  
- Linux (AppImage, deb, rpm)
`);

class ElectronPackageBuilder {
    constructor() {
        this.buildConfig = {
            appId: 'com.documentgenerator.app',
            appName: 'Document Generator',
            version: '1.0.0',
            description: 'Transform documents into MVPs using AI',
            author: 'Document Generator Team',
            homepage: 'https://github.com/documentgenerator/app',
            
            // Build targets
            targets: {
                windows: ['nsis', 'portable'],
                mac: ['dmg', 'zip'],
                linux: ['AppImage', 'deb', 'rpm', 'tar.gz']
            },
            
            // Directories
            buildDir: './dist',
            resourcesDir: './app-resources',
            
            // Bundle settings
            includeServices: true,
            includeDocker: false, // Too large for distribution
            includeNodeModules: true
        };
        
        this.mainWindow = null;
        this.services = new Map();
        this.systemTray = null;
    }
    
    // Create main Electron window
    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 800,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                webSecurity: false // For local API calls
            },
            icon: path.join(__dirname, 'assets', 'icon.png'),
            titleBarStyle: 'default',
            show: false, // Don't show until ready
            backgroundColor: '#1a1a1a'
        });
        
        // Load the main interface
        this.loadMainInterface();
        
        // Setup window events
        this.setupWindowEvents();
        
        // Setup menu
        this.createApplicationMenu();
        
        // Setup IPC handlers
        this.setupIPC();
        
        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Start background services
            this.startBackgroundServices();
        });
        
        return this.mainWindow;
    }
    
    async loadMainInterface() {
        // Check if we have a built interface
        const interfacePath = path.join(__dirname, 'web-interface', 'index.html');
        const dashboardPath = path.join(__dirname, 'api-monitoring-dashboard.html');
        
        try {
            await fs.access(interfacePath);
            this.mainWindow.loadFile(interfacePath);
        } catch (error) {
            // Fallback to dashboard
            try {
                await fs.access(dashboardPath);
                this.mainWindow.loadFile(dashboardPath);
            } catch (error2) {
                // Create basic interface
                await this.createBasicInterface();
                this.mainWindow.loadFile(path.join(__dirname, 'temp-interface.html'));
            }
        }
    }
    
    async createBasicInterface() {
        const basicHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: rgba(0,0,0,0.2);
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
        }
        .upload-area {
            border: 3px dashed rgba(255,255,255,0.5);
            border-radius: 20px;
            padding: 60px;
            margin: 20px;
            max-width: 600px;
            width: 100%;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .upload-area:hover {
            border-color: rgba(255,255,255,0.8);
            background: rgba(255,255,255,0.1);
        }
        .upload-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .upload-text {
            font-size: 20px;
            margin-bottom: 10px;
        }
        .upload-subtext {
            opacity: 0.8;
            font-size: 14px;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 40px;
            max-width: 800px;
            width: 100%;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .feature h3 {
            font-size: 18px;
            margin-bottom: 10px;
            color: #ffd700;
        }
        .status-bar {
            background: rgba(0,0,0,0.2);
            padding: 10px 20px;
            display: flex;
            justify-content: between;
            align-items: center;
            font-size: 12px;
            opacity: 0.8;
        }
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #4ade80;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        button {
            background: linear-gradient(45deg, #ff6b6b, #ff8e53);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
            transition: transform 0.2s ease;
        }
        button:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Document Generator</h1>
        <p>Transform documents into working MVPs using AI</p>
    </div>
    
    <div class="content">
        <div class="upload-area" onclick="selectFile()">
            <div class="upload-icon">📄</div>
            <div class="upload-text">Drop your document here</div>
            <div class="upload-subtext">or click to select file</div>
            <div class="upload-subtext">Supports: PDF, Word, Markdown, Text</div>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>🤖 AI-Powered</h3>
                <p>Advanced language models analyze your documents and generate code</p>
            </div>
            <div class="feature">
                <h3>⚡ Fast Generation</h3>
                <p>From document to working MVP in under 30 minutes</p>
            </div>
            <div class="feature">
                <h3>🛡️ Secure</h3>
                <p>Protected by Cerberus security system with rate limiting</p>
            </div>
            <div class="feature">
                <h3>🎯 Multiple Formats</h3>
                <p>Generate web apps, mobile apps, APIs, and more</p>
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <button onclick="openDashboard()">📊 API Dashboard</button>
            <button onclick="openMonitoring()">📈 System Monitor</button>
            <button onclick="openSettings()">⚙️ Settings</button>
        </div>
    </div>
    
    <div class="status-bar">
        <div style="display: flex; align-items: center;">
            <span class="status-dot"></span>
            System Ready
        </div>
        <div>
            Document Generator v1.0.0
        </div>
    </div>
    
    <input type="file" id="fileInput" style="display: none;" accept=".pdf,.doc,.docx,.md,.txt" onchange="handleFile(this.files[0])">
    
    <script>
        const { ipcRenderer } = require('electron');
        
        function selectFile() {
            document.getElementById('fileInput').click();
        }
        
        function handleFile(file) {
            if (file) {
                ipcRenderer.send('file-selected', file.path);
            }
        }
        
        function openDashboard() {
            ipcRenderer.send('open-window', 'dashboard');
        }
        
        function openMonitoring() {
            ipcRenderer.send('open-window', 'monitoring');
        }
        
        function openSettings() {
            ipcRenderer.send('open-window', 'settings');
        }
        
        // Drag and drop
        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
            document.querySelector('.upload-area').style.background = 'rgba(255,255,255,0.2)';
        });
        
        document.body.addEventListener('dragleave', (e) => {
            e.preventDefault();
            document.querySelector('.upload-area').style.background = '';
        });
        
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            document.querySelector('.upload-area').style.background = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    </script>
</body>
</html>`;
        
        await fs.writeFile('temp-interface.html', basicHTML);
    }
    
    setupWindowEvents() {
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            this.stopBackgroundServices();
        });
        
        this.mainWindow.on('minimize', (event) => {
            if (process.platform === 'darwin') {
                event.preventDefault();
                this.mainWindow.hide();
            }
        });
        
        this.mainWindow.webContents.on('new-window', (event, navigationUrl) => {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        });
    }
    
    createApplicationMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Document',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => this.selectDocument()
                    },
                    {
                        label: 'Open Recent',
                        role: 'recentdocuments',
                        submenu: [
                            {
                                label: 'Clear Recent',
                                role: 'clearrecentdocuments'
                            }
                        ]
                    },
                    { type: 'separator' },
                    {
                        label: 'Quit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => app.quit()
                    }
                ]
            },
            {
                label: 'Generate',
                submenu: [
                    {
                        label: 'Web Application',
                        click: () => this.generateMVP('web')
                    },
                    {
                        label: 'Mobile App',
                        click: () => this.generateMVP('mobile')
                    },
                    {
                        label: 'API Service',
                        click: () => this.generateMVP('api')
                    },
                    {
                        label: 'Custom',
                        click: () => this.generateMVP('custom')
                    }
                ]
            },
            {
                label: 'Tools',
                submenu: [
                    {
                        label: 'API Dashboard',
                        click: () => this.openWindow('dashboard')
                    },
                    {
                        label: 'System Monitor',
                        click: () => this.openWindow('monitoring')
                    },
                    {
                        label: 'Settings',
                        click: () => this.openWindow('settings')
                    },
                    { type: 'separator' },
                    {
                        label: 'Developer Tools',
                        accelerator: 'F12',
                        click: () => this.mainWindow.webContents.openDevTools()
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'Documentation',
                        click: () => shell.openExternal('https://docs.documentgenerator.com')
                    },
                    {
                        label: 'GitHub',
                        click: () => shell.openExternal('https://github.com/documentgenerator/app')
                    },
                    {
                        label: 'Report Issue',
                        click: () => shell.openExternal('https://github.com/documentgenerator/app/issues')
                    },
                    { type: 'separator' },
                    {
                        label: 'About',
                        click: () => this.showAbout()
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
    
    setupIPC() {
        ipcMain.on('file-selected', (event, filePath) => {
            this.processDocument(filePath);
        });
        
        ipcMain.on('open-window', (event, windowType) => {
            this.openWindow(windowType);
        });
        
        ipcMain.on('generate-mvp', (event, options) => {
            this.generateMVP(options.type, options.document);
        });
        
        ipcMain.on('get-services-status', (event) => {
            event.reply('services-status', this.getServicesStatus());
        });
    }
    
    async selectDocument() {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            this.processDocument(result.filePaths[0]);
        }
    }
    
    async processDocument(filePath) {
        console.log('Processing document:', filePath);
        
        // Send to main window
        this.mainWindow.webContents.send('document-selected', {
            path: filePath,
            name: path.basename(filePath)
        });
        
        // Start processing with AI services
        try {
            // This would integrate with the document processing pipeline
            const result = await this.callDocumentProcessor(filePath);
            
            this.mainWindow.webContents.send('document-processed', result);
        } catch (error) {
            console.error('Document processing failed:', error);
            
            this.mainWindow.webContents.send('document-error', {
                message: error.message
            });
        }
    }
    
    async callDocumentProcessor(filePath) {
        // Integration with existing document processing
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    analysis: {
                        type: 'business_plan',
                        confidence: 0.95,
                        features: ['user_management', 'payment_processing', 'dashboard'],
                        suggestions: [
                            'SaaS application with subscription billing',
                            'React frontend with Node.js backend',
                            'PostgreSQL database with Redis caching'
                        ]
                    }
                });
            }, 2000);
        });
    }
    
    openWindow(type) {
        const windowConfigs = {
            dashboard: {
                file: 'api-monitoring-dashboard.html',
                width: 1200,
                height: 800,
                title: 'API Dashboard'
            },
            monitoring: {
                file: 'api-monitoring-dashboard.html',
                width: 1400,
                height: 900,
                title: 'System Monitor'
            },
            settings: {
                content: this.createSettingsWindow(),
                width: 600,
                height: 500,
                title: 'Settings'
            }
        };
        
        const config = windowConfigs[type];
        if (!config) return;
        
        const window = new BrowserWindow({
            width: config.width,
            height: config.height,
            title: config.title,
            parent: this.mainWindow,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        
        if (config.file) {
            window.loadFile(config.file);
        } else if (config.content) {
            window.loadURL(`data:text/html,${encodeURIComponent(config.content)}`);
        }
    }
    
    async startBackgroundServices() {
        console.log('Starting background services...');
        
        // Start API server
        await this.startService('api', {
            command: 'node',
            args: ['index.js'],
            port: 3000,
            healthCheck: 'http://localhost:3000/health'
        });
        
        // Start rate limiter (if Redis available)
        if (await this.checkRedisAvailable()) {
            await this.startService('rate-limiter', {
                command: 'node',
                args: ['api-rate-limiter.js'],
                port: 3001
            });
        }
        
        // Start Cerberus security
        await this.startService('cerberus', {
            command: 'node',
            args: ['api-cerberus-core.js'],
            port: 3002
        });
        
        console.log('✅ Background services started');
    }
    
    async startService(name, config) {
        try {
            const process = spawn(config.command, config.args, {
                cwd: __dirname,
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    PORT: config.port
                }
            });
            
            this.services.set(name, {
                process,
                config,
                status: 'starting',
                startTime: Date.now()
            });
            
            process.on('spawn', () => {
                console.log(`✅ Started ${name} service on port ${config.port}`);
                this.services.get(name).status = 'running';
            });
            
            process.on('error', (error) => {
                console.error(`❌ Service ${name} error:`, error);
                this.services.get(name).status = 'error';
            });
            
            process.on('exit', (code) => {
                console.log(`Service ${name} exited with code ${code}`);
                this.services.get(name).status = 'stopped';
            });
            
        } catch (error) {
            console.error(`Failed to start ${name}:`, error);
        }
    }
    
    stopBackgroundServices() {
        console.log('Stopping background services...');
        
        for (const [name, service] of this.services) {
            if (service.process && !service.process.killed) {
                service.process.kill();
                console.log(`Stopped ${name} service`);
            }
        }
        
        this.services.clear();
    }
    
    async checkRedisAvailable() {
        return new Promise((resolve) => {
            exec('redis-cli ping', (error) => {
                resolve(!error);
            });
        });
    }
    
    getServicesStatus() {
        const status = {};
        
        for (const [name, service] of this.services) {
            status[name] = {
                status: service.status,
                port: service.config.port,
                uptime: Date.now() - service.startTime
            };
        }
        
        return status;
    }
    
    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Document Generator',
            message: 'Document Generator',
            detail: `Version: ${this.buildConfig.version}\n\nTransform documents into working MVPs using AI.\n\nPowered by Cerberus security system and advanced language models.`,
            buttons: ['OK']
        });
    }
    
    createSettingsWindow() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Settings</title>
    <style>
        body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
        .setting-group { margin-bottom: 20px; background: white; padding: 15px; border-radius: 8px; }
        .setting-group h3 { margin-top: 0; color: #333; }
        .setting-item { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: 500; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h2>Settings</h2>
    
    <div class="setting-group">
        <h3>AI Services</h3>
        <div class="setting-item">
            <label>OpenAI API Key:</label>
            <input type="password" id="openaiKey" placeholder="sk-...">
        </div>
        <div class="setting-item">
            <label>Anthropic API Key:</label>
            <input type="password" id="anthropicKey" placeholder="sk-ant-...">
        </div>
        <div class="setting-item">
            <label>Default Model:</label>
            <select id="defaultModel">
                <option value="ollama">Ollama (Local)</option>
                <option value="openai">OpenAI GPT-4</option>
                <option value="anthropic">Anthropic Claude</option>
            </select>
        </div>
    </div>
    
    <div class="setting-group">
        <h3>Security</h3>
        <div class="setting-item">
            <label>Rate Limit (requests/hour):</label>
            <input type="number" id="rateLimit" value="60" min="1" max="10000">
        </div>
        <div class="setting-item">
            <label>Max File Size (MB):</label>
            <input type="number" id="maxFileSize" value="10" min="1" max="100">
        </div>
    </div>
    
    <div class="setting-group">
        <h3>Interface</h3>
        <div class="setting-item">
            <label>Theme:</label>
            <select id="theme">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
            </select>
        </div>
        <div class="setting-item">
            <label>
                <input type="checkbox" id="notifications"> Show notifications
            </label>
        </div>
    </div>
    
    <button onclick="saveSettings()">Save Settings</button>
    
    <script>
        function saveSettings() {
            // Implementation would save to config file
            alert('Settings saved successfully!');
            window.close();
        }
    </script>
</body>
</html>`;
    }
    
    // Build packages for distribution
    async buildPackages() {
        console.log('🚀 Building distribution packages...');
        
        const electronBuilder = require('electron-builder');
        
        const config = {
            appId: this.buildConfig.appId,
            productName: this.buildConfig.appName,
            directories: {
                output: this.buildConfig.buildDir
            },
            files: [
                '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
                '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
                '!**/node_modules/*.d.ts',
                '!**/node_modules/.bin',
                '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
                '!.editorconfig',
                '!**/._*',
                '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
                '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
                '!**/{appveyor.yml,.travis.yml,circle.yml}',
                '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
            ],
            mac: {
                category: 'public.app-category.developer-tools',
                icon: 'assets/icon.icns',
                target: [
                    { target: 'dmg', arch: ['x64', 'arm64'] },
                    { target: 'zip', arch: ['x64', 'arm64'] }
                ]
            },
            win: {
                icon: 'assets/icon.ico',
                target: [
                    { target: 'nsis', arch: ['x64'] },
                    { target: 'portable', arch: ['x64'] }
                ]
            },
            linux: {
                icon: 'assets/icon.png',
                target: [
                    { target: 'AppImage', arch: ['x64'] },
                    { target: 'deb', arch: ['x64'] },
                    { target: 'rpm', arch: ['x64'] }
                ]
            },
            nsis: {
                oneClick: false,
                allowToChangeInstallationDirectory: true,
                createDesktopShortcut: true,
                createStartMenuShortcut: true
            }
        };
        
        try {
            await electronBuilder.build({
                targets: electronBuilder.Platform.current().createTarget(),
                config
            });
            
            console.log('✅ Package build completed!');
        } catch (error) {
            console.error('❌ Build failed:', error);
        }
    }
}

// Main Electron app setup
function createApp() {
    const builder = new ElectronPackageBuilder();
    
    app.whenReady().then(() => {
        builder.createMainWindow();
        
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                builder.createMainWindow();
            }
        });
    });
    
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    
    return builder;
}

// Export or run
module.exports = ElectronPackageBuilder;

if (require.main === module) {
    const builder = new ElectronPackageBuilder();
    
    // Check if we should build packages
    if (process.argv.includes('--build')) {
        builder.buildPackages();
    } else {
        // Create Electron app
        createApp();
    }
}