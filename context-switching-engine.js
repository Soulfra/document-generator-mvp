#!/usr/bin/env node
/**
 * Context Switching Engine
 * 
 * Provides visual feedback and state preservation when switching screens/tabs
 * Captures screenshots, maintains session state, and provides smooth transitions
 * Addresses the user's need for "screensaver or screenshot when we tab to a new screen"
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const EventEmitter = require('events');
const execAsync = promisify(exec);

class ContextSwitchingEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            screenshotDir: options.screenshotDir || path.join(__dirname, 'context-screenshots'),
            stateDir: options.stateDir || path.join(__dirname, 'context-states'),
            webSocketPort: options.webSocketPort || 3012,
            httpPort: options.httpPort || 3013,
            screenshotQuality: options.screenshotQuality || 80,
            maxStoredStates: options.maxStoredStates || 50,
            autoCapture: options.autoCapture !== false,
            captureInterval: options.captureInterval || 5000, // 5 seconds
            transitionDuration: options.transitionDuration || 300 // ms
        };
        
        this.activeContexts = new Map();
        this.contextHistory = [];
        this.currentContext = null;
        this.isCapturing = false;
        this.windowFocusTracker = null;
        
        this.initializeDirectories();
        this.setupWindowTracking();
        this.setupWebInterface();
        
        console.log('🖼️  Context Switching Engine initialized');
        console.log(`📸 Screenshots: ${this.config.screenshotDir}`);
        console.log(`💾 State Storage: ${this.config.stateDir}`);
        console.log(`🌐 Dashboard: http://localhost:${this.config.httpPort}`);
    }
    
    initializeDirectories() {
        [this.config.screenshotDir, this.config.stateDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Clean old screenshots (keep only last 100)
        this.cleanupOldFiles();
    }
    
    cleanupOldFiles() {
        try {
            const screenshots = fs.readdirSync(this.config.screenshotDir)
                .filter(f => f.endsWith('.png'))
                .map(f => ({
                    name: f,
                    path: path.join(this.config.screenshotDir, f),
                    mtime: fs.statSync(path.join(this.config.screenshotDir, f)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);
            
            // Remove old screenshots beyond limit
            if (screenshots.length > this.config.maxStoredStates) {
                const toDelete = screenshots.slice(this.config.maxStoredStates);
                toDelete.forEach(file => {
                    fs.unlinkSync(file.path);
                    // Also delete associated state file
                    const stateFile = path.join(this.config.stateDir, file.name.replace('.png', '.json'));
                    if (fs.existsSync(stateFile)) {
                        fs.unlinkSync(stateFile);
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ Error cleaning old files:', error.message);
        }
    }
    
    async setupWindowTracking() {
        if (process.platform === 'darwin') {
            await this.setupMacOSTracking();
        } else if (process.platform === 'linux') {
            await this.setupLinuxTracking();
        } else if (process.platform === 'win32') {
            await this.setupWindowsTracking();
        }
        
        // Start automatic context switching detection
        if (this.config.autoCapture) {
            this.startAutomaticCapture();
        }
    }
    
    async setupMacOSTracking() {
        // Use AppleScript to track window changes
        this.windowFocusTracker = setInterval(async () => {
            try {
                const { stdout } = await execAsync(`
                    osascript -e '
                        tell application "System Events"
                            set frontApp to name of first application process whose frontmost is true
                            set frontWindow to name of front window of first application process whose frontmost is true
                        end tell
                        return frontApp & " | " & frontWindow
                    '
                `);
                
                const [appName, windowName] = stdout.trim().split(' | ');
                const newContext = {
                    app: appName,
                    window: windowName,
                    timestamp: Date.now(),
                    platform: 'macOS'
                };
                
                await this.handleContextChange(newContext);
                
            } catch (error) {
                // Silent fail - window tracking can be flaky
            }
        }, 1000); // Check every second
    }
    
    async setupLinuxTracking() {
        // Use xprop and xwininfo for Linux window tracking
        this.windowFocusTracker = setInterval(async () => {
            try {
                const { stdout } = await execAsync('xprop -root _NET_ACTIVE_WINDOW');
                const windowId = stdout.match(/0x[0-9a-f]+/i)?.[0];
                
                if (windowId) {
                    const { stdout: winInfo } = await execAsync(`xwininfo -id ${windowId}`);
                    const windowName = winInfo.match(/xwininfo: Window id: .* "(.*)"/)?.[1] || 'Unknown';
                    
                    const newContext = {
                        app: 'X11 Application',
                        window: windowName,
                        windowId,
                        timestamp: Date.now(),
                        platform: 'Linux'
                    };
                    
                    await this.handleContextChange(newContext);
                }
            } catch (error) {
                // Silent fail - X11 commands might not be available
            }
        }, 1000);
    }
    
    async setupWindowsTracking() {
        // Use PowerShell for Windows window tracking
        this.windowFocusTracker = setInterval(async () => {
            try {
                const { stdout } = await execAsync(`
                    powershell -Command "
                        Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\", CharSet = CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount); }'
                        \\$hwnd = [Win32]::GetForegroundWindow()
                        \\$sb = New-Object System.Text.StringBuilder 256
                        [Win32]::GetWindowText(\\$hwnd, \\$sb, \\$sb.Capacity)
                        \\$sb.ToString()
                    "
                `);
                
                const windowName = stdout.trim();
                const newContext = {
                    app: 'Windows Application',
                    window: windowName,
                    timestamp: Date.now(),
                    platform: 'Windows'
                };
                
                await this.handleContextChange(newContext);
                
            } catch (error) {
                // Silent fail
            }
        }, 1000);
    }
    
    async handleContextChange(newContext) {
        // Check if context actually changed
        if (this.currentContext && 
            this.currentContext.app === newContext.app && 
            this.currentContext.window === newContext.window) {
            return;
        }
        
        // Capture screenshot of previous context before switching
        if (this.currentContext && !this.isCapturing) {
            await this.captureContextState(this.currentContext);
        }
        
        // Update current context
        const previousContext = this.currentContext;
        this.currentContext = newContext;
        
        // Store in history
        this.contextHistory.unshift(newContext);
        if (this.contextHistory.length > 20) {
            this.contextHistory = this.contextHistory.slice(0, 20);
        }
        
        // Emit context change event
        this.emit('contextChange', {
            previous: previousContext,
            current: newContext,
            timestamp: Date.now()
        });
        
        console.log(`🔄 Context switched: ${newContext.app} - ${newContext.window}`);
    }
    
    async captureContextState(context) {
        if (this.isCapturing) return;
        this.isCapturing = true;
        
        try {
            const timestamp = Date.now();
            const filename = `context-${timestamp}-${this.sanitizeFilename(context.app)}.png`;
            const screenshotPath = path.join(this.config.screenshotDir, filename);
            const statePath = path.join(this.config.stateDir, filename.replace('.png', '.json'));
            
            // Capture screenshot
            await this.captureScreenshot(screenshotPath);
            
            // Capture additional state information
            const stateData = {
                context,
                timestamp,
                screenshotPath,
                browserTabs: await this.captureBrowserState(),
                systemInfo: await this.captureSystemState(),
                environmentVars: this.captureEnvironmentState()
            };
            
            // Save state data
            fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));
            
            // Store in memory
            this.activeContexts.set(context.app + context.window, {
                ...stateData,
                thumbnail: await this.generateThumbnail(screenshotPath)
            });
            
            this.emit('stateCaptured', stateData);
            
            console.log(`📸 Captured state: ${filename}`);
            
        } catch (error) {
            console.error('❌ Error capturing context state:', error.message);
        } finally {
            this.isCapturing = false;
        }
    }
    
    async captureScreenshot(outputPath) {
        const platform = process.platform;
        
        try {
            if (platform === 'darwin') {
                // macOS: Use screencapture
                await execAsync(`screencapture -x -t png "${outputPath}"`);
            } else if (platform === 'linux') {
                // Linux: Use gnome-screenshot or scrot
                try {
                    await execAsync(`gnome-screenshot -f "${outputPath}"`);
                } catch {
                    await execAsync(`scrot "${outputPath}"`);
                }
            } else if (platform === 'win32') {
                // Windows: Use PowerShell
                await execAsync(`
                    powershell -Command "
                        Add-Type -AssemblyName System.Windows.Forms
                        Add-Type -AssemblyName System.Drawing
                        \\$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
                        \\$bitmap = New-Object System.Drawing.Bitmap \\$screen.Width, \\$screen.Height
                        \\$graphics = [System.Drawing.Graphics]::FromImage(\\$bitmap)
                        \\$graphics.CopyFromScreen(0, 0, 0, 0, \\$bitmap.Size)
                        \\$bitmap.Save('${outputPath}', [System.Drawing.Imaging.ImageFormat]::Png)
                        \\$graphics.Dispose()
                        \\$bitmap.Dispose()
                    "
                `);
            }
        } catch (error) {
            console.warn(`⚠️ Screenshot capture failed: ${error.message}`);
            // Create placeholder image
            await this.createPlaceholderImage(outputPath);
        }
    }
    
    async createPlaceholderImage(outputPath) {
        // Create a simple placeholder image using ImageMagick or similar
        try {
            await execAsync(`convert -size 800x600 xc:lightgray -pointsize 36 -gravity center -annotate +0+0 "Screenshot Unavailable\\n${new Date().toLocaleString()}" "${outputPath}"`);
        } catch {
            // If ImageMagick not available, create empty file
            fs.writeFileSync(outputPath, '');
        }
    }
    
    async generateThumbnail(screenshotPath) {
        const thumbnailPath = screenshotPath.replace('.png', '_thumb.png');
        
        try {
            // Generate 200x150 thumbnail
            await execAsync(`convert "${screenshotPath}" -resize 200x150 "${thumbnailPath}"`);
            return thumbnailPath;
        } catch {
            return screenshotPath; // Return original if thumbnail generation fails
        }
    }
    
    async captureBrowserState() {
        // Attempt to capture browser tab information
        try {
            if (process.platform === 'darwin') {
                // macOS: Try to get Chrome/Safari tabs
                const { stdout } = await execAsync(`
                    osascript -e '
                        tell application "Google Chrome"
                            set tabList to {}
                            repeat with w in windows
                                repeat with t in tabs of w
                                    set end of tabList to (title of t & " | " & URL of t)
                                end repeat
                            end repeat
                            return tabList as string
                        end tell
                    ' 2>/dev/null || echo "Browser not accessible"
                `);
                
                return stdout.trim().split('\n').filter(line => line && line !== 'Browser not accessible');
            }
        } catch {
            return [];
        }
        
        return [];
    }
    
    async captureSystemState() {
        return {
            platform: process.platform,
            nodeVersion: process.version,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            cwd: process.cwd(),
            pid: process.pid
        };
    }
    
    captureEnvironmentState() {
        // Capture relevant environment variables (filter sensitive ones)
        const env = {};
        const allowedEnvVars = [
            'NODE_ENV', 'PORT', 'NODE_OPTIONS', 'PATH',
            'DISPLAY', 'TERM', 'SHELL', 'USER', 'HOME'
        ];
        
        allowedEnvVars.forEach(key => {
            if (process.env[key]) {
                env[key] = process.env[key];
            }
        });
        
        return env;
    }
    
    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    }
    
    startAutomaticCapture() {
        // Periodic screenshot capture regardless of window changes
        setInterval(async () => {
            if (this.currentContext && !this.isCapturing) {
                await this.captureContextState(this.currentContext);
            }
        }, this.config.captureInterval);
        
        console.log(`🔄 Automatic capture started (${this.config.captureInterval}ms intervals)`);
    }
    
    setupWebInterface() {
        const http = require('http');
        const WebSocket = require('ws');
        
        // HTTP Server for dashboard
        const httpServer = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateDashboardHTML());
            } else if (req.url === '/api/contexts') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    current: this.currentContext,
                    history: this.contextHistory,
                    active: Array.from(this.activeContexts.values())
                }));
            } else if (req.url.startsWith('/screenshots/')) {
                const filename = req.url.replace('/screenshots/', '');
                const filepath = path.join(this.config.screenshotDir, filename);
                
                if (fs.existsSync(filepath)) {
                    res.writeHead(200, { 'Content-Type': 'image/png' });
                    fs.createReadStream(filepath).pipe(res);
                } else {
                    res.writeHead(404);
                    res.end('Screenshot not found');
                }
            } else if (req.url === '/api/capture') {
                // Manual capture trigger
                if (this.currentContext) {
                    this.captureContextState(this.currentContext);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Capture triggered' }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'No active context' }));
                }
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        httpServer.listen(this.config.httpPort, () => {
            console.log(`🌐 Context dashboard: http://localhost:${this.config.httpPort}`);
        });
        
        // WebSocket Server for real-time updates
        const wss = new WebSocket.Server({ port: this.config.webSocketPort });
        
        wss.on('connection', (ws) => {
            console.log('📡 WebSocket client connected');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'current_state',
                data: {
                    current: this.currentContext,
                    history: this.contextHistory.slice(0, 10)
                }
            }));
            
            // Listen for context changes
            const contextChangeListener = (data) => {
                ws.send(JSON.stringify({
                    type: 'context_change',
                    data
                }));
            };
            
            const stateCapturedListener = (data) => {
                ws.send(JSON.stringify({
                    type: 'state_captured',
                    data
                }));
            };
            
            this.on('contextChange', contextChangeListener);
            this.on('stateCaptured', stateCapturedListener);
            
            ws.on('close', () => {
                this.off('contextChange', contextChangeListener);
                this.off('stateCaptured', stateCapturedListener);
            });
        });
        
        console.log(`📡 WebSocket server: ws://localhost:${this.config.webSocketPort}`);
    }
    
    generateDashboardHTML() {
        const contexts = Array.from(this.activeContexts.values()).slice(0, 12);
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Context Switching Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #1a1a1a; color: #fff; }
        .header { background: #2a2a2a; padding: 20px; text-align: center; border-bottom: 2px solid #4ecca3; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .current-context { background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 2px solid #4ecca3; }
        .context-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .context-card { background: #2a2a2a; border-radius: 8px; padding: 15px; border: 1px solid #444; transition: transform 0.2s; }
        .context-card:hover { transform: scale(1.02); border-color: #4ecca3; }
        .context-screenshot { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 10px; }
        .context-info { font-size: 14px; }
        .context-app { font-weight: bold; color: #4ecca3; margin-bottom: 5px; }
        .context-window { color: #ccc; margin-bottom: 5px; }
        .context-time { color: #888; font-size: 12px; }
        .capture-btn { background: #4ecca3; color: #000; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .capture-btn:hover { background: #3eb393; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 10px; }
        .status.active { background: #4ecca3; color: #000; }
        .status.inactive { background: #666; color: #fff; }
        .websocket-status { position: fixed; top: 10px; right: 10px; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
        .websocket-status.connected { background: #4ecca3; color: #000; }
        .websocket-status.disconnected { background: #e94560; color: #fff; }
    </style>
</head>
<body>
    <div class="websocket-status" id="wsStatus">Connecting...</div>
    
    <div class="header">
        <h1>🖼️ Context Switching Dashboard</h1>
        <p>Visual state preservation and screen switching management</p>
        <button class="capture-btn" onclick="triggerCapture()">📸 Capture Current Context</button>
    </div>
    
    <div class="container">
        <div class="current-context">
            <h2>🎯 Current Context</h2>
            <div id="currentContext">
                ${this.currentContext ? `
                    <div class="context-app">${this.currentContext.app}</div>
                    <div class="context-window">${this.currentContext.window}</div>
                    <div class="context-time">${new Date(this.currentContext.timestamp).toLocaleString()}</div>
                    <span class="status active">ACTIVE</span>
                ` : '<div>No active context detected</div>'}
            </div>
        </div>
        
        <h2>📚 Context History</h2>
        <div class="context-grid" id="contextGrid">
            ${contexts.map(context => `
                <div class="context-card">
                    ${context.thumbnail ? `
                        <img src="/screenshots/${path.basename(context.thumbnail)}" class="context-screenshot" alt="Context Screenshot">
                    ` : ''}
                    <div class="context-info">
                        <div class="context-app">${context.context.app}</div>
                        <div class="context-window">${context.context.window}</div>
                        <div class="context-time">${new Date(context.timestamp).toLocaleString()}</div>
                        <span class="status inactive">STORED</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        let ws;
        let wsStatus = document.getElementById('wsStatus');
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.webSocketPort}');
            
            ws.onopen = function() {
                wsStatus.textContent = 'Connected';
                wsStatus.className = 'websocket-status connected';
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                
                if (message.type === 'context_change') {
                    updateCurrentContext(message.data.current);
                } else if (message.type === 'state_captured') {
                    // Refresh the page to show new capture
                    setTimeout(() => location.reload(), 1000);
                }
            };
            
            ws.onclose = function() {
                wsStatus.textContent = 'Disconnected';
                wsStatus.className = 'websocket-status disconnected';
                
                // Reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
            };
            
            ws.onerror = function() {
                wsStatus.textContent = 'Error';
                wsStatus.className = 'websocket-status disconnected';
            };
        }
        
        function updateCurrentContext(context) {
            const currentDiv = document.getElementById('currentContext');
            if (context) {
                currentDiv.innerHTML = \`
                    <div class="context-app">\${context.app}</div>
                    <div class="context-window">\${context.window}</div>
                    <div class="context-time">\${new Date(context.timestamp).toLocaleString()}</div>
                    <span class="status active">ACTIVE</span>
                \`;
            }
        }
        
        function triggerCapture() {
            fetch('/api/capture', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('📸 Context captured!');
                    } else {
                        alert('❌ Capture failed: ' + data.message);
                    }
                })
                .catch(error => {
                    alert('❌ Error: ' + error.message);
                });
        }
        
        // Auto-refresh every 30 seconds
        setInterval(() => location.reload(), 30000);
        
        // Connect WebSocket
        connectWebSocket();
    </script>
</body>
</html>`;
    }
    
    async getContextState(contextId) {
        return this.activeContexts.get(contextId);
    }
    
    async restoreContext(contextId) {
        const context = this.activeContexts.get(contextId);
        if (!context) {
            throw new Error('Context not found');
        }
        
        // Emit restore event
        this.emit('contextRestore', context);
        
        console.log(`🔄 Restoring context: ${context.context.app} - ${context.context.window}`);
        return context;
    }
    
    stop() {
        if (this.windowFocusTracker) {
            clearInterval(this.windowFocusTracker);
        }
        
        console.log('🛑 Context switching engine stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const engine = new ContextSwitchingEngine();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping context switching engine...');
        engine.stop();
        process.exit(0);
    });
    
    console.log('✅ Context Switching Engine running');
    console.log('📊 Dashboard: http://localhost:3013');
    console.log('📡 WebSocket: ws://localhost:3012');
}

module.exports = ContextSwitchingEngine;