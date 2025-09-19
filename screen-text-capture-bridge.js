#!/usr/bin/env node

/**
 * 🖥️💭 SCREEN TEXT CAPTURE BRIDGE
 * ================================
 * Captures text from your screen (AI conversations) and streams to visualizer
 * Works with Claude, ChatGPT, or any AI interface
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class ScreenTextCaptureBridge {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 3005;
        
        // Capture state
        this.capturing = false;
        this.captureRegion = null;
        this.ocrProcess = null;
        this.lastText = '';
        
        // Connected visualizers
        this.visualizers = new Set();
        
        // AI detection patterns
        this.aiPatterns = {
            claude: /Claude|Anthropic|Human:|Assistant:/i,
            chatgpt: /ChatGPT|OpenAI|You:|GPT:/i,
            cal: /Cal:|🔥/i,
            ralph: /Ralph:|🎨/i,
            generic: /AI:|Bot:|Assistant:/i
        };
        
        this.initializeServer();
        this.setupRoutes();
        this.setupWebSocket();
        this.checkDependencies();
        
        console.log('🖥️💭 SCREEN TEXT CAPTURE BRIDGE');
        console.log('===============================');
        console.log('📸 Captures AI conversations from screen');
        console.log('🔍 OCR text recognition');
        console.log('📡 Streams to visualization');
    }
    
    initializeServer() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // CORS for localhost
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }
    
    setupRoutes() {
        // Serve the visualizer
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'ai-conversation-visualizer.html'));
        });
        
        // Start screen capture
        this.app.post('/api/capture/start', async (req, res) => {
            try {
                const { region, interval } = req.body;
                
                this.captureRegion = region || { x: 0, y: 0, width: 800, height: 600 };
                this.captureInterval = interval || 1000; // Default 1 second
                
                await this.startCapture();
                
                res.json({
                    success: true,
                    message: 'Screen capture started',
                    region: this.captureRegion
                });
                
            } catch (error) {
                console.error('Capture start failed:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Stop screen capture
        this.app.post('/api/capture/stop', (req, res) => {
            this.stopCapture();
            res.json({ success: true, message: 'Screen capture stopped' });
        });
        
        // Get capture status
        this.app.get('/api/capture/status', (req, res) => {
            res.json({
                capturing: this.capturing,
                region: this.captureRegion,
                interval: this.captureInterval,
                lastCapture: this.lastCaptureTime,
                connectedVisualizers: this.visualizers.size
            });
        });
        
        // Manual text injection (for testing)
        this.app.post('/api/inject', (req, res) => {
            const { text, role, ai } = req.body;
            
            this.broadcastToVisualizers({
                type: 'conversation',
                text,
                role: role || this.detectRole(text),
                ai: ai || this.detectAI(text),
                timestamp: new Date(),
                source: 'manual'
            });
            
            res.json({ success: true });
        });
        
        // macOS specific: Use accessibility API
        this.app.get('/api/macos/setup', (req, res) => {
            res.json({
                instructions: [
                    '1. Open System Preferences > Security & Privacy > Privacy',
                    '2. Click Accessibility',
                    '3. Add Terminal/Node to allowed apps',
                    '4. This allows reading screen text',
                    '',
                    'Alternative: Use screenshot + OCR method'
                ]
            });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🖥️ Visualizer connected');
            this.visualizers.add(ws);
            
            // Send current status
            ws.send(JSON.stringify({
                type: 'status',
                capturing: this.capturing,
                region: this.captureRegion
            }));
            
            ws.on('close', () => {
                this.visualizers.delete(ws);
                console.log('👋 Visualizer disconnected');
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleVisualizerMessage(ws, data);
                } catch (error) {
                    console.error('Invalid message:', error);
                }
            });
        });
    }
    
    async startCapture() {
        if (this.capturing) return;
        
        this.capturing = true;
        console.log('📸 Starting screen capture...');
        
        // Method 1: Screenshot + OCR (cross-platform)
        this.captureLoop = setInterval(async () => {
            await this.captureScreen();
        }, this.captureInterval);
        
        // Method 2: macOS Accessibility API (if available)
        if (process.platform === 'darwin') {
            this.tryMacOSAccessibility();
        }
        
        // Method 3: Clipboard monitoring
        this.startClipboardMonitor();
    }
    
    stopCapture() {
        this.capturing = false;
        
        if (this.captureLoop) {
            clearInterval(this.captureLoop);
            this.captureLoop = null;
        }
        
        if (this.clipboardInterval) {
            clearInterval(this.clipboardInterval);
            this.clipboardInterval = null;
        }
        
        console.log('🛑 Screen capture stopped');
    }
    
    async captureScreen() {
        try {
            const { x, y, width, height } = this.captureRegion;
            
            // Take screenshot using system tools
            let screenshotCmd;
            const tempFile = `/tmp/screen-capture-${Date.now()}.png`;
            
            if (process.platform === 'darwin') {
                // macOS screencapture
                screenshotCmd = `screencapture -x -R${x},${y},${width},${height} ${tempFile}`;
            } else if (process.platform === 'linux') {
                // Linux with scrot or gnome-screenshot
                screenshotCmd = `scrot -a ${x},${y},${width},${height} ${tempFile}`;
            } else if (process.platform === 'win32') {
                // Windows with nircmd or powershell
                screenshotCmd = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds"`;
            }
            
            if (screenshotCmd) {
                await this.execCommand(screenshotCmd);
                
                // OCR the screenshot
                const text = await this.performOCR(tempFile);
                
                // Process extracted text
                if (text && text !== this.lastText) {
                    this.processExtractedText(text);
                    this.lastText = text;
                }
                
                // Clean up
                await fs.unlink(tempFile).catch(() => {});
            }
            
            this.lastCaptureTime = new Date();
            
        } catch (error) {
            console.error('Screen capture error:', error);
        }
    }
    
    async performOCR(imagePath) {
        try {
            // Try Tesseract OCR
            const { stdout } = await this.execCommand(`tesseract ${imagePath} stdout`);
            return stdout.trim();
        } catch (error) {
            // Fallback to other OCR methods
            console.warn('Tesseract OCR failed, trying alternatives...');
            
            // Try macOS Vision framework
            if (process.platform === 'darwin') {
                return this.macOSVisionOCR(imagePath);
            }
            
            return null;
        }
    }
    
    async macOSVisionOCR(imagePath) {
        // Use macOS Vision framework via Swift script
        const swiftScript = `
import Vision
import AppKit

let image = NSImage(contentsOfFile: "${imagePath}")!
let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)!

let request = VNRecognizeTextRequest { request, error in
    guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
    let text = observations.compactMap { $0.topCandidates(1).first?.string }.joined(separator: " ")
    print(text)
}

try! VNImageRequestHandler(cgImage: cgImage).perform([request])
        `;
        
        try {
            await fs.writeFile('/tmp/ocr.swift', swiftScript);
            const { stdout } = await this.execCommand('swift /tmp/ocr.swift');
            return stdout.trim();
        } catch (error) {
            return null;
        }
    }
    
    processExtractedText(text) {
        // Split into messages based on patterns
        const messages = this.splitIntoMessages(text);
        
        messages.forEach(message => {
            const role = this.detectRole(message);
            const ai = this.detectAI(message);
            
            this.broadcastToVisualizers({
                type: 'conversation',
                text: message,
                role,
                ai,
                timestamp: new Date(),
                source: 'screen'
            });
        });
    }
    
    splitIntoMessages(text) {
        // Split by common message separators
        const patterns = [
            /\n(?=Human:|You:|User:)/g,
            /\n(?=Assistant:|AI:|Claude:|GPT:)/g,
            /\n\n+/g
        ];
        
        let messages = [text];
        
        patterns.forEach(pattern => {
            const newMessages = [];
            messages.forEach(msg => {
                const parts = msg.split(pattern);
                newMessages.push(...parts);
            });
            messages = newMessages;
        });
        
        return messages.filter(m => m.trim().length > 0);
    }
    
    detectRole(text) {
        if (text.match(/^(Human:|You:|User:|Me:)/i)) return 'user';
        if (text.match(/^(Assistant:|AI:|Claude:|GPT:|Cal:|Ralph:)/i)) return 'assistant';
        
        // Heuristic: questions are usually from user
        if (text.match(/\?$/)) return 'user';
        
        return 'assistant'; // Default to assistant
    }
    
    detectAI(text) {
        for (const [ai, pattern] of Object.entries(this.aiPatterns)) {
            if (pattern.test(text)) {
                return ai;
            }
        }
        return 'assistant';
    }
    
    tryMacOSAccessibility() {
        // Try to use macOS accessibility API
        try {
            const appleScript = `
tell application "System Events"
    tell process "Claude" -- or "Safari" or "Chrome"
        get value of text area 1 of window 1
    end tell
end tell
            `;
            
            exec(`osascript -e '${appleScript}'`, (error, stdout) => {
                if (!error && stdout) {
                    this.processExtractedText(stdout);
                }
            });
        } catch (error) {
            console.log('Accessibility API not available');
        }
    }
    
    startClipboardMonitor() {
        this.clipboardInterval = setInterval(async () => {
            if (!this.capturing) return;
            
            try {
                let clipboardCmd;
                
                if (process.platform === 'darwin') {
                    clipboardCmd = 'pbpaste';
                } else if (process.platform === 'linux') {
                    clipboardCmd = 'xclip -selection clipboard -o';
                } else if (process.platform === 'win32') {
                    clipboardCmd = 'powershell Get-Clipboard';
                }
                
                if (clipboardCmd) {
                    const { stdout } = await this.execCommand(clipboardCmd);
                    const text = stdout.trim();
                    
                    if (text && text !== this.lastClipboard) {
                        this.lastClipboard = text;
                        this.processExtractedText(text);
                    }
                }
            } catch (error) {
                // Clipboard access failed
            }
        }, 1000);
    }
    
    broadcastToVisualizers(data) {
        const message = JSON.stringify(data);
        
        this.visualizers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
        
        console.log(`📡 Broadcast: ${data.role} - ${data.text.slice(0, 50)}...`);
    }
    
    handleVisualizerMessage(ws, data) {
        switch (data.type) {
            case 'set-region':
                this.captureRegion = data.region;
                break;
            
            case 'set-interval':
                this.captureInterval = data.interval;
                if (this.capturing) {
                    this.stopCapture();
                    this.startCapture();
                }
                break;
        }
    }
    
    execCommand(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
    
    async checkDependencies() {
        const deps = {
            tesseract: 'tesseract --version',
            screencapture: process.platform === 'darwin' ? 'which screencapture' : null,
            scrot: process.platform === 'linux' ? 'which scrot' : null
        };
        
        for (const [name, cmd] of Object.entries(deps)) {
            if (cmd) {
                try {
                    await this.execCommand(cmd);
                    console.log(`✅ ${name} available`);
                } catch (error) {
                    console.warn(`⚠️ ${name} not found - some features may not work`);
                    
                    if (name === 'tesseract') {
                        console.log('💡 Install with: brew install tesseract (macOS) or apt-get install tesseract-ocr (Linux)');
                    }
                }
            }
        }
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log('\n🖥️💭 SCREEN TEXT CAPTURE BRIDGE');
            console.log('================================');
            console.log(`🌐 Visualizer: http://localhost:${this.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.port}`);
            console.log('');
            console.log('📸 Capture Methods:');
            console.log('   1. Screenshot + OCR (automatic)');
            console.log('   2. Clipboard monitoring');
            console.log('   3. Accessibility API (macOS)');
            console.log('');
            console.log('🚀 Open visualizer and start screen capture!');
        });
    }
}

// Start the bridge
const bridge = new ScreenTextCaptureBridge();
bridge.start();