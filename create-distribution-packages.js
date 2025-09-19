#!/usr/bin/env node
/**
 * Distribution Package Creator
 * 
 * Creates distributable packages for different channels and platforms
 * Handles WebSocket streaming, desktop apps, PWA, and direct downloads
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const archiver = require('archiver');
const execAsync = promisify(exec);

class DistributionPackager {
    constructor(options = {}) {
        this.config = {
            outputDir: options.outputDir || path.join(__dirname, 'distributions'),
            tempDir: options.tempDir || path.join(__dirname, 'temp-package'),
            version: options.version || '1.0.0',
            includeSource: options.includeSource || false,
            platforms: options.platforms || ['web', 'desktop', 'pwa', 'websocket'],
            verbose: options.verbose || false
        };
        
        this.packageInfo = {
            name: 'Document Generator Demo System',
            version: this.config.version,
            description: 'Professional demo and presentation system for Document Generator',
            author: 'Document Generator Team',
            license: 'MIT',
            created: new Date().toISOString()
        };
        
        this.requiredFiles = [
            'unified-demo-hub.html',
            'html5-presentation-engine.html',
            'demo-capture-studio.js',
            'quick-demo-generator.js',
            'context-switching-engine.js',
            'launch-demo-system.sh',
            'terms-of-service.html',
            'age-verification.html',
            'user-onboarding.html',
            'package.json',
            'README.md'
        ];
        
        this.distributionChannels = {
            web: this.createWebPackage.bind(this),
            desktop: this.createDesktopPackage.bind(this),
            pwa: this.createPWAPackage.bind(this),
            websocket: this.createWebSocketPackage.bind(this),
            direct: this.createDirectDownload.bind(this)
        };
        
        console.log('📦 Distribution Packager initialized');
        console.log(`📁 Output: ${this.config.outputDir}`);
        console.log(`🔢 Version: ${this.config.version}`);
    }
    
    async createAllPackages() {
        console.log('\n🚀 Creating all distribution packages...');
        
        // Initialize directories
        await this.initializeDirectories();
        
        // Create packages for each platform
        const results = {};
        
        for (const platform of this.config.platforms) {
            try {
                console.log(`\n📦 Creating ${platform} package...`);
                const result = await this.distributionChannels[platform]();
                results[platform] = result;
                console.log(`✅ ${platform} package created successfully`);
            } catch (error) {
                console.error(`❌ Failed to create ${platform} package:`, error.message);
                results[platform] = { error: error.message };
            }
        }
        
        // Create master distribution index
        await this.createDistributionIndex(results);
        
        // Cleanup
        await this.cleanup();
        
        console.log('\n🎉 All distribution packages created!');
        return results;
    }
    
    async initializeDirectories() {
        // Create output directory
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
        
        // Create temp directory
        if (!fs.existsSync(this.config.tempDir)) {
            fs.mkdirSync(this.config.tempDir, { recursive: true });
        }
        
        // Create platform subdirectories
        for (const platform of this.config.platforms) {
            const platformDir = path.join(this.config.outputDir, platform);
            if (!fs.existsSync(platformDir)) {
                fs.mkdirSync(platformDir, { recursive: true });
            }
        }
    }
    
    async createWebPackage() {
        const webDir = path.join(this.config.outputDir, 'web');
        const packageName = `document-generator-web-v${this.config.version}.zip`;
        const packagePath = path.join(webDir, packageName);
        
        // Copy essential web files
        const webFiles = [
            'unified-demo-hub.html',
            'html5-presentation-engine.html',
            'terms-of-service.html',
            'age-verification.html',
            'user-onboarding.html',
            'DEMO-SYSTEM-COMPLETE.md'
        ];
        
        // Create web-specific manifest
        const webManifest = {
            ...this.packageInfo,
            type: 'web-distribution',
            platform: 'web',
            requirements: ['Modern web browser', 'JavaScript enabled'],
            files: webFiles,
            entryPoint: 'terms-of-service.html',
            instructions: {
                installation: 'Extract files and open terms-of-service.html in a web browser',
                usage: 'Follow the onboarding flow to access the demo system',
                features: ['Self-contained HTML presentations', 'Age verification', 'User agreement system']
            }
        };
        
        // Create ZIP package
        return this.createZipPackage(packagePath, webFiles, webManifest, {
            name: 'Web Distribution',
            description: 'Self-contained web files for browser-based distribution'
        });
    }
    
    async createDesktopPackage() {
        const desktopDir = path.join(this.config.outputDir, 'desktop');
        const packageName = `document-generator-desktop-v${this.config.version}.zip`;
        const packagePath = path.join(desktopDir, packageName);
        
        // Copy desktop application files
        const desktopFiles = [
            ...this.requiredFiles,
            'launch-demo-system.sh',
            'stop-demo-system.sh',
            'open-demo-dashboards.sh'
        ];
        
        // Create desktop launcher script
        const desktopLauncher = this.createDesktopLauncher();
        
        // Create desktop manifest
        const desktopManifest = {
            ...this.packageInfo,
            type: 'desktop-distribution',
            platform: 'desktop',
            requirements: ['Node.js 16+', 'Python 3.8+', 'FFmpeg', 'ImageMagick'],
            files: desktopFiles,
            entryPoint: 'launch-demo-system.sh',
            launcher: 'desktop-launcher.sh',
            instructions: {
                installation: 'Extract files and run install-dependencies.sh',
                usage: 'Run launch-demo-system.sh to start all services',
                features: ['Full demo system', 'Screen recording', 'AI services', 'Professional presentations']
            }
        };
        
        return this.createZipPackage(packagePath, desktopFiles, desktopManifest, {
            name: 'Desktop Application',
            description: 'Full-featured desktop application with all services',
            additionalFiles: {
                'desktop-launcher.sh': desktopLauncher,
                'install-dependencies.sh': this.createDependencyInstaller()
            }
        });
    }
    
    async createPWAPackage() {
        const pwaDir = path.join(this.config.outputDir, 'pwa');
        const packageName = `document-generator-pwa-v${this.config.version}.zip`;
        const packagePath = path.join(pwaDir, packageName);
        
        // Create PWA manifest
        const pwaManifest = {
            name: 'Document Generator Demo System',
            short_name: 'DocGen Demo',
            description: 'Professional demo and presentation system',
            start_url: './terms-of-service.html',
            display: 'standalone',
            background_color: '#1a1a1a',
            theme_color: '#4ecca3',
            orientation: 'portrait-primary',
            icons: [
                {
                    src: 'icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any maskable'
                },
                {
                    src: 'icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any maskable'
                }
            ],
            categories: ['productivity', 'business', 'developer'],
            lang: 'en'
        };
        
        // Create service worker
        const serviceWorker = this.createServiceWorker();
        
        // PWA files
        const pwaFiles = [
            'unified-demo-hub.html',
            'html5-presentation-engine.html',
            'terms-of-service.html',
            'age-verification.html',
            'user-onboarding.html'
        ];
        
        const distributionManifest = {
            ...this.packageInfo,
            type: 'pwa-distribution',
            platform: 'pwa',
            requirements: ['Modern web browser with PWA support'],
            files: pwaFiles,
            entryPoint: 'terms-of-service.html',
            instructions: {
                installation: 'Host files on web server and install as PWA',
                usage: 'Access via browser or install as app',
                features: ['Offline capability', 'App-like experience', 'Home screen installation']
            }
        };
        
        return this.createZipPackage(packagePath, pwaFiles, distributionManifest, {
            name: 'Progressive Web App',
            description: 'Installable PWA with offline capabilities',
            additionalFiles: {
                'manifest.json': JSON.stringify(pwaManifest, null, 2),
                'sw.js': serviceWorker,
                'install-pwa.html': this.createPWAInstaller()
            }
        });
    }
    
    async createWebSocketPackage() {
        const wsDir = path.join(this.config.outputDir, 'websocket');
        const packageName = `document-generator-websocket-v${this.config.version}.zip`;
        const packagePath = path.join(wsDir, packageName);
        
        // Create WebSocket streaming server
        const wsServer = this.createWebSocketServer();
        const wsClient = this.createWebSocketClient();
        
        // WebSocket files
        const wsFiles = [
            'demo-capture-studio.js',
            'quick-demo-generator.js',
            'context-switching-engine.js'
        ];
        
        const wsManifest = {
            ...this.packageInfo,
            type: 'websocket-distribution',
            platform: 'websocket',
            requirements: ['Node.js 16+', 'WebSocket-capable browser'],
            files: wsFiles,
            entryPoint: 'websocket-server.js',
            instructions: {
                installation: 'Run npm install && node websocket-server.js',
                usage: 'Connect clients to WebSocket server for real-time streaming',
                features: ['Real-time demo streaming', 'Multi-client support', 'Live presentation broadcasting']
            }
        };
        
        return this.createZipPackage(packagePath, wsFiles, wsManifest, {
            name: 'WebSocket Distribution',
            description: 'Real-time streaming and broadcasting system',
            additionalFiles: {
                'websocket-server.js': wsServer,
                'websocket-client.html': wsClient,
                'package.json': JSON.stringify({
                    name: 'document-generator-websocket',
                    version: this.config.version,
                    dependencies: {
                        'ws': '^8.14.2',
                        'express': '^4.21.2'
                    }
                }, null, 2)
            }
        });
    }
    
    async createDirectDownload() {
        const directDir = path.join(this.config.outputDir, 'direct');
        const packageName = `document-generator-complete-v${this.config.version}.zip`;
        const packagePath = path.join(directDir, packageName);
        
        // Create complete package with everything
        const allFiles = [
            ...this.requiredFiles,
            'DEMO-SYSTEM-COMPLETE.md',
            'open-demo-dashboards.sh',
            'stop-demo-system.sh'
        ];
        
        const directManifest = {
            ...this.packageInfo,
            type: 'direct-download',
            platform: 'cross-platform',
            requirements: ['See individual component requirements'],
            files: allFiles,
            entryPoint: 'README.md',
            instructions: {
                installation: 'Extract and follow README.md instructions',
                usage: 'Choose appropriate deployment method for your platform',
                features: ['Complete system', 'All distribution methods', 'Full documentation']
            }
        };
        
        return this.createZipPackage(packagePath, allFiles, directManifest, {
            name: 'Complete Download',
            description: 'Full system with all distribution options',
            additionalFiles: {
                'README-DISTRIBUTION.md': this.createDistributionReadme(),
                'quick-start.sh': this.createQuickStartScript()
            }
        });
    }
    
    async createZipPackage(packagePath, files, manifest, options = {}) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(packagePath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => {
                const size = (archive.pointer() / 1024 / 1024).toFixed(2);
                resolve({
                    name: options.name || 'Package',
                    path: packagePath,
                    size: `${size} MB`,
                    files: files.length + Object.keys(options.additionalFiles || {}).length,
                    manifest
                });
            });
            
            archive.on('error', reject);
            archive.pipe(output);
            
            // Add manifest file
            archive.append(JSON.stringify(manifest, null, 2), { name: 'package-manifest.json' });
            
            // Add main files
            for (const file of files) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: file });
                } else if (this.config.verbose) {
                    console.warn(`⚠️  File not found: ${file}`);
                }
            }
            
            // Add additional files
            if (options.additionalFiles) {
                for (const [filename, content] of Object.entries(options.additionalFiles)) {
                    archive.append(content, { name: filename });
                }
            }
            
            archive.finalize();
        });
    }
    
    createDesktopLauncher() {
        return `#!/bin/bash
# Desktop Launcher for Document Generator Demo System
# Auto-generated by Distribution Packager

echo "🚀 Starting Document Generator Demo System..."
echo "======================================"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    ./install-dependencies.sh
fi

# Start the demo system
echo "🎬 Launching demo system..."
./launch-demo-system.sh

# Wait for services to start
sleep 5

# Open main dashboard
echo "🌐 Opening demo hub..."
if command -v open &> /dev/null; then
    open ./unified-demo-hub.html
elif command -v xdg-open &> /dev/null; then
    xdg-open ./unified-demo-hub.html
elif command -v start &> /dev/null; then
    start ./unified-demo-hub.html
else
    echo "Please open ./unified-demo-hub.html in your browser"
fi

echo "✅ Document Generator Demo System started!"
echo "🎯 Main Hub: ./unified-demo-hub.html"
echo "📺 Presentation: ./html5-presentation-engine.html"
`;
    }
    
    createDependencyInstaller() {
        return `#!/bin/bash
# Dependency Installer for Document Generator Demo System

echo "📦 Installing Document Generator Demo System Dependencies"
echo "======================================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+ first."
    echo "Visit: https://python.org/"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js packages..."
npm install puppeteer ws axios csv-writer exceljs

# Install Python dependencies
echo "🐍 Installing Python packages..."
pip3 install flask flask-cors pandas xlsxwriter

# Check optional dependencies
echo "🔍 Checking optional dependencies..."

if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg not found (optional, for screen recording)"
    echo "Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Ubuntu)"
fi

if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found (optional, for image processing)"
    echo "Install with: brew install imagemagick (macOS) or apt install imagemagick (Ubuntu)"
fi

echo "✅ Dependencies installed successfully!"
echo "🚀 Ready to run: ./desktop-launcher.sh"
`;
    }
    
    createServiceWorker() {
        return `// Service Worker for Document Generator PWA
// Auto-generated by Distribution Packager

const CACHE_NAME = 'document-generator-v${this.config.version}';
const urlsToCache = [
    './',
    './terms-of-service.html',
    './age-verification.html',
    './user-onboarding.html',
    './unified-demo-hub.html',
    './html5-presentation-engine.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
`;
    }
    
    createPWAInstaller() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install Document Generator</title>
    <link rel="manifest" href="./manifest.json">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #1a1a1a; 
            color: #fff; 
            text-align: center; 
            padding: 50px 20px; 
        }
        .install-btn { 
            background: #4ecca3; 
            color: #000; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 8px; 
            font-size: 1.1rem; 
            cursor: pointer; 
            margin: 20px; 
        }
    </style>
</head>
<body>
    <h1>📱 Install Document Generator</h1>
    <p>Install as a Progressive Web App for the best experience.</p>
    <button class="install-btn" id="installBtn">📥 Install App</button>
    <p><a href="./terms-of-service.html" style="color: #4ecca3;">Continue in Browser</a></p>
    
    <script>
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'block';
        });
        
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                
                if (outcome === 'accepted') {
                    console.log('PWA installed');
                }
            }
        });
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js');
        }
    </script>
</body>
</html>`;
    }
    
    createWebSocketServer() {
        return `// WebSocket Server for Document Generator Demo Broadcasting
// Auto-generated by Distribution Packager

const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;

// Serve static files
app.use(express.static(__dirname));

// Store connected clients
const clients = new Set();
const presenters = new Set();

wss.on('connection', (ws, req) => {
    console.log('📡 Client connected from', req.socket.remoteAddress);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'register_presenter':
                    presenters.add(ws);
                    ws.isPresenter = true;
                    console.log('🎬 Presenter registered');
                    break;
                    
                case 'register_viewer':
                    clients.add(ws);
                    console.log('👥 Viewer registered');
                    break;
                    
                case 'demo_broadcast':
                    // Broadcast to all viewers
                    clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'demo_update',
                                data: data.data,
                                timestamp: Date.now()
                            }));
                        }
                    });
                    break;
                    
                case 'presentation_control':
                    // Broadcast presentation controls
                    [...clients, ...presenters].forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'presentation_sync',
                                data: data.data
                            }));
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error('❌ WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        clients.delete(ws);
        presenters.delete(ws);
        console.log('📡 Client disconnected');
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'websocket-client.html'));
});

app.get('/presenter', (req, res) => {
    res.sendFile(path.join(__dirname, 'presenter-interface.html'));
});

server.listen(PORT, () => {
    console.log(\`🌐 WebSocket Demo Server running on http://localhost:\${PORT}\`);
    console.log(\`📡 WebSocket connections on ws://localhost:\${PORT}\`);
    console.log(\`🎬 Presenter interface: http://localhost:\${PORT}/presenter\`);
});
`;
    }
    
    createWebSocketClient() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌐 Document Generator - Live Demo</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #1a1a1a; 
            color: #fff; 
            margin: 0; 
            padding: 20px; 
        }
        .status { 
            padding: 10px; 
            border-radius: 4px; 
            margin-bottom: 20px; 
        }
        .connected { background: rgba(78, 204, 163, 0.2); border: 1px solid #4ecca3; }
        .disconnected { background: rgba(233, 69, 96, 0.2); border: 1px solid #e94560; }
        .demo-content { 
            background: #2a2a2a; 
            border-radius: 8px; 
            padding: 20px; 
            margin-top: 20px; 
        }
    </style>
</head>
<body>
    <h1>🌐 Document Generator - Live Demo</h1>
    <div class="status disconnected" id="status">📡 Connecting to demo server...</div>
    <div class="demo-content" id="demoContent">
        <p>Waiting for demo broadcast...</p>
    </div>
    
    <script>
        let ws;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}\`;
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('Connected to demo server');
                document.getElementById('status').textContent = '✅ Connected to live demo';
                document.getElementById('status').className = 'status connected';
                reconnectAttempts = 0;
                
                // Register as viewer
                ws.send(JSON.stringify({ type: 'register_viewer' }));
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleDemoUpdate(data);
                } catch (error) {
                    console.error('Message parsing error:', error);
                }
            };
            
            ws.onclose = () => {
                document.getElementById('status').textContent = '📡 Disconnected from demo server';
                document.getElementById('status').className = 'status disconnected';
                
                if (reconnectAttempts < maxReconnectAttempts) {
                    setTimeout(() => {
                        reconnectAttempts++;
                        connect();
                    }, 3000);
                }
            };
        }
        
        function handleDemoUpdate(data) {
            const content = document.getElementById('demoContent');
            
            switch (data.type) {
                case 'demo_update':
                    content.innerHTML = \`
                        <h3>📊 Live Demo Data</h3>
                        <pre>\${JSON.stringify(data.data, null, 2)}</pre>
                        <small>Updated: \${new Date(data.timestamp).toLocaleTimeString()}</small>
                    \`;
                    break;
                    
                case 'presentation_sync':
                    content.innerHTML = \`
                        <h3>📺 Presentation Sync</h3>
                        <p>Current slide: \${data.data.slide || 'Unknown'}</p>
                        <p>Status: \${data.data.status || 'Unknown'}</p>
                    \`;
                    break;
            }
        }
        
        // Connect on page load
        connect();
    </script>
</body>
</html>`;
    }
    
    createDistributionReadme() {
        return `# 📦 Document Generator Distribution Guide

## Available Distribution Packages

### 🌐 Web Distribution
- **File**: \`document-generator-web-v${this.config.version}.zip\`
- **Platform**: Any modern web browser
- **Features**: Self-contained HTML presentations, age verification, user agreement
- **Installation**: Extract and open \`terms-of-service.html\` in browser

### 🖥️ Desktop Application
- **File**: \`document-generator-desktop-v${this.config.version}.zip\`
- **Platform**: Windows, macOS, Linux
- **Features**: Full demo system with all services
- **Requirements**: Node.js 16+, Python 3.8+, FFmpeg, ImageMagick
- **Installation**: Extract and run \`install-dependencies.sh\`, then \`desktop-launcher.sh\`

### 📱 Progressive Web App (PWA)
- **File**: \`document-generator-pwa-v${this.config.version}.zip\`
- **Platform**: PWA-compatible browsers
- **Features**: Installable app, offline capability
- **Installation**: Host on web server and install as PWA

### 🌐 WebSocket Distribution
- **File**: \`document-generator-websocket-v${this.config.version}.zip\`
- **Platform**: Node.js server environment
- **Features**: Real-time streaming, multi-client support
- **Installation**: \`npm install && node websocket-server.js\`

### 📥 Complete Download
- **File**: \`document-generator-complete-v${this.config.version}.zip\`
- **Platform**: Cross-platform
- **Features**: All distribution methods included
- **Installation**: Extract and choose appropriate method

## Quick Start

1. **For Web Browsers**: Download Web Distribution
2. **For Desktop Use**: Download Desktop Application
3. **For Mobile/Apps**: Download PWA
4. **For Broadcasting**: Download WebSocket Distribution
5. **For Everything**: Download Complete Package

## System Requirements

### Minimum (Web)
- Modern web browser with JavaScript
- No additional software required

### Recommended (Desktop)
- Node.js 16 or higher
- Python 3.8 or higher
- FFmpeg (for screen recording)
- ImageMagick (for image processing)
- 4GB RAM, 1GB disk space

## Support

- **Documentation**: See included README.md files
- **Issues**: GitHub repository issues
- **Community**: Discord server (link in documentation)

---

Generated: ${new Date().toISOString()}
Version: ${this.config.version}
`;
    }
    
    createQuickStartScript() {
        return `#!/bin/bash
# Quick Start Script for Document Generator
# Detects platform and runs appropriate setup

echo "🚀 Document Generator Quick Start"
echo "================================="

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="Linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    PLATFORM="Windows"
else
    PLATFORM="Unknown"
fi

echo "🔍 Detected platform: $PLATFORM"

# Check for web browser option
if command -v open &> /dev/null || command -v xdg-open &> /dev/null; then
    echo ""
    echo "📌 Quick Options:"
    echo "1. 🌐 Web Browser (Recommended for first time)"
    echo "2. 🖥️  Full Desktop Application"
    echo "3. 📱 Progressive Web App"
    echo ""
    read -p "Choose option (1-3): " choice
    
    case $choice in
        1)
            echo "🌐 Opening web browser version..."
            if command -v open &> /dev/null; then
                open ./terms-of-service.html
            else
                xdg-open ./terms-of-service.html
            fi
            ;;
        2)
            echo "🖥️  Starting desktop application..."
            ./desktop-launcher.sh
            ;;
        3)
            echo "📱 Opening PWA installer..."
            if command -v open &> /dev/null; then
                open ./install-pwa.html
            else
                xdg-open ./install-pwa.html
            fi
            ;;
        *)
            echo "🌐 Opening default web version..."
            if command -v open &> /dev/null; then
                open ./terms-of-service.html
            else
                xdg-open ./terms-of-service.html
            fi
            ;;
    esac
else
    echo "🌐 Please open ./terms-of-service.html in your web browser"
fi

echo "✅ Quick start complete!"
`;
    }
    
    async createDistributionIndex(results) {
        const indexPath = path.join(this.config.outputDir, 'distribution-index.html');
        
        const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📦 Document Generator - Distribution Index</title>
    <style>
        body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .package { background: #2a2a2a; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #4ecca3; }
        .download-btn { background: #4ecca3; color: #000; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; }
        .stats { color: #888; font-size: 0.9rem; }
        .created { text-align: center; margin-top: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 Document Generator Distributions</h1>
        <p>Choose the package that best fits your needs</p>
    </div>
    
    ${Object.entries(results).map(([platform, result]) => {
        if (result.error) {
            return `<div class="package">
                <h3>❌ ${platform.charAt(0).toUpperCase() + platform.slice(1)} Package</h3>
                <p style="color: #e94560;">Error: ${result.error}</p>
            </div>`;
        }
        
        return `<div class="package">
            <h3>✅ ${result.name}</h3>
            <p>${result.manifest.instructions.description || 'Professional demo system package'}</p>
            <div class="stats">
                📁 Size: ${result.size} | 📄 Files: ${result.files} | 🔢 Version: ${result.manifest.version}
            </div>
            <p><strong>Platform:</strong> ${result.manifest.platform}</p>
            <p><strong>Features:</strong> ${result.manifest.instructions.features?.join(', ') || 'See documentation'}</p>
            <p><a href="./${platform}/${path.basename(result.path)}" class="download-btn">📥 Download</a></p>
        </div>`;
    }).join('')}
    
    <div class="created">
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Version: ${this.config.version}</p>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(indexPath, indexHTML);
        console.log(`📝 Distribution index created: ${indexPath}`);
    }
    
    async cleanup() {
        // Remove temp directory
        if (fs.existsSync(this.config.tempDir)) {
            fs.rmSync(this.config.tempDir, { recursive: true });
        }
    }
}

// Auto-run if called directly
if (require.main === module) {
    const packager = new DistributionPackager({
        verbose: process.argv.includes('--verbose'),
        platforms: process.argv.includes('--platforms') 
            ? process.argv[process.argv.indexOf('--platforms') + 1].split(',')
            : undefined
    });
    
    packager.createAllPackages()
        .then(results => {
            console.log('\n📊 Distribution Summary:');
            Object.entries(results).forEach(([platform, result]) => {
                if (result.error) {
                    console.log(`❌ ${platform}: ${result.error}`);
                } else {
                    console.log(`✅ ${platform}: ${result.size} (${result.files} files)`);
                }
            });
        })
        .catch(error => {
            console.error('❌ Distribution creation failed:', error);
            process.exit(1);
        });
}

module.exports = DistributionPackager;