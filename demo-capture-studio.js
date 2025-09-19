#!/usr/bin/env node
/**
 * Demo Capture Studio
 * 
 * Creates screen captures, GIFs, and presentation materials for showcasing system functionality
 * Addresses the need for quick demos, stage timers, and professional presentation materials
 * Integrates with existing systems to create compelling showcases
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const EventEmitter = require('events');
const execAsync = promisify(exec);

class DemoCaptureStudio extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            captureDir: options.captureDir || path.join(__dirname, 'demo-captures'),
            templateDir: options.templateDir || path.join(__dirname, 'demo-templates'),
            outputDir: options.outputDir || path.join(__dirname, 'demo-outputs'),
            stageTimerPort: options.stageTimerPort || 3019,
            webPort: options.webPort || 3020,
            gifQuality: options.gifQuality || 'medium', // low, medium, high
            framerate: options.framerate || 15,
            maxDuration: options.maxDuration || 60, // seconds
            autoCapture: options.autoCapture !== false
        };
        
        this.currentCapture = null;
        this.captureProcess = null;
        this.stageTimer = {
            isRunning: false,
            startTime: null,
            duration: 0,
            phases: [],
            currentPhase: 0
        };
        
        this.demoTemplates = new Map();
        this.captureHistory = [];
        
        console.log('🎬 Demo Capture Studio initialized');
        console.log(`📁 Captures: ${this.config.captureDir}`);
        console.log(`🌐 Studio Dashboard: http://localhost:${this.config.webPort}`);
        console.log(`⏱️ Stage Timer: http://localhost:${this.config.stageTimerPort}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Create directories
        [this.config.captureDir, this.config.templateDir, this.config.outputDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Check dependencies
        await this.checkDependencies();
        
        // Load demo templates
        this.loadDemoTemplates();
        
        // Setup web interfaces
        this.setupWebInterfaces();
        
        // Setup system integrations
        this.setupSystemIntegrations();
    }
    
    async checkDependencies() {
        const dependencies = [
            { cmd: 'ffmpeg -version', name: 'FFmpeg' },
            { cmd: 'convert -version', name: 'ImageMagick' }
        ];
        
        for (const dep of dependencies) {
            try {
                await execAsync(dep.cmd);
                console.log(`✅ ${dep.name} available`);
            } catch (error) {
                console.warn(`⚠️ ${dep.name} not found - some features may be limited`);
            }
        }
    }
    
    loadDemoTemplates() {
        // Define built-in demo templates
        this.demoTemplates.set('system-overview', {
            name: 'System Overview Demo',
            duration: 120, // 2 minutes
            phases: [
                { name: 'Introduction', duration: 20, url: 'http://localhost:3000' },
                { name: 'Performance Monitor', duration: 30, url: 'http://localhost:3010' },
                { name: 'Math Meme Time', duration: 40, url: 'http://localhost:3017' },
                { name: 'Integration Bridge', duration: 30, url: 'http://localhost:3018' }
            ],
            description: 'Complete system demonstration showing all major components'
        });
        
        this.demoTemplates.set('math-meme', {
            name: 'Math Meme Time Demo',
            duration: 90,
            phases: [
                { name: 'Time Compression Concept', duration: 20, url: 'http://localhost:3017' },
                { name: 'Creating Bottles', duration: 30, commands: ['!math_meme bottle'] },
                { name: 'Export Demo', duration: 25, url: 'http://localhost:5000' },
                { name: 'Integration Bridge', duration: 15, url: 'http://localhost:3018' }
            ],
            description: 'Showcase the 24:1 time compression system'
        });
        
        this.demoTemplates.set('performance', {
            name: 'Performance Monitoring Demo',
            duration: 60,
            phases: [
                { name: 'System Health', duration: 20, url: 'http://localhost:3010' },
                { name: '20x Slowdown Detection', duration: 25, simulate: 'slowdown' },
                { name: 'Recovery Process', duration: 15, simulate: 'recovery' }
            ],
            description: 'Demonstrate performance monitoring and issue detection'
        });
        
        console.log(`📋 Loaded ${this.demoTemplates.size} demo templates`);
    }
    
    async startScreenCapture(options = {}) {
        if (this.captureProcess) {
            throw new Error('Capture already in progress');
        }
        
        const timestamp = Date.now();
        const filename = options.filename || `demo-capture-${timestamp}`;
        const outputPath = path.join(this.config.captureDir, `${filename}.mov`);
        
        this.currentCapture = {
            id: timestamp,
            filename,
            outputPath,
            startTime: Date.now(),
            options
        };
        
        try {
            // macOS screen capture
            const captureArgs = [
                '-f', 'avfoundation',
                '-framerate', this.config.framerate.toString(),
                '-i', '1:0', // Screen and audio
                '-t', (options.duration || this.config.maxDuration).toString(),
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-crf', '23',
                outputPath
            ];
            
            this.captureProcess = spawn('ffmpeg', captureArgs);
            
            this.captureProcess.on('close', (code) => {
                console.log(`📹 Capture completed: ${filename}`);
                this.finalizeCaptureSession(code === 0);
            });
            
            this.captureProcess.on('error', (error) => {
                console.error('❌ Capture error:', error);
                this.finalizeCaptureSession(false);
            });
            
            console.log(`🎥 Started screen capture: ${filename}`);
            this.emit('captureStarted', this.currentCapture);
            
            return this.currentCapture;
        } catch (error) {
            this.captureProcess = null;
            this.currentCapture = null;
            throw error;
        }
    }
    
    async stopScreenCapture() {
        if (!this.captureProcess) {
            throw new Error('No capture in progress');
        }
        
        this.captureProcess.kill('SIGINT');
        // finalizeCaptureSession will be called by the close event
    }
    
    async finalizeCaptureSession(success) {
        if (!this.currentCapture) return;
        
        const capture = this.currentCapture;
        capture.endTime = Date.now();
        capture.duration = capture.endTime - capture.startTime;
        capture.success = success;
        
        if (success) {
            // Add to history
            this.captureHistory.push(capture);
            
            // Generate GIF if requested
            if (capture.options.createGIF !== false) {
                await this.convertToGIF(capture);
            }
            
            // Generate thumbnail
            await this.generateThumbnail(capture);
        }
        
        this.emit('captureCompleted', capture);
        
        this.captureProcess = null;
        this.currentCapture = null;
    }
    
    async convertToGIF(capture) {
        const gifPath = capture.outputPath.replace('.mov', '.gif');
        
        try {
            const quality = this.config.gifQuality;
            let scale = '640:-1'; // Default scale
            let fps = '10';
            
            switch (quality) {
                case 'low':
                    scale = '480:-1';
                    fps = '8';
                    break;
                case 'medium':
                    scale = '640:-1';
                    fps = '10';
                    break;
                case 'high':
                    scale = '800:-1';
                    fps = '15';
                    break;
            }
            
            const ffmpegCmd = [
                'ffmpeg', '-i', capture.outputPath,
                '-vf', `fps=${fps},scale=${scale}:flags=lanczos,palettegen`,
                '-y', `${capture.outputPath}.palette.png`
            ].join(' ');
            
            await execAsync(ffmpegCmd);
            
            const gifCmd = [
                'ffmpeg', '-i', capture.outputPath,
                '-i', `${capture.outputPath}.palette.png`,
                '-filter_complex', `fps=${fps},scale=${scale}:flags=lanczos[x];[x][1:v]paletteuse`,
                '-y', gifPath
            ].join(' ');
            
            await execAsync(gifCmd);
            
            // Cleanup palette
            fs.unlinkSync(`${capture.outputPath}.palette.png`);
            
            capture.gifPath = gifPath;
            console.log(`🎞️ GIF created: ${path.basename(gifPath)}`);
        } catch (error) {
            console.error('❌ GIF conversion failed:', error);
        }
    }
    
    async generateThumbnail(capture) {
        const thumbnailPath = capture.outputPath.replace('.mov', '_thumb.jpg');
        
        try {
            const cmd = `ffmpeg -i "${capture.outputPath}" -vf "thumbnail,scale=320:240" -frames:v 1 -y "${thumbnailPath}"`;
            await execAsync(cmd);
            
            capture.thumbnailPath = thumbnailPath;
            console.log(`🖼️ Thumbnail created: ${path.basename(thumbnailPath)}`);
        } catch (error) {
            console.error('❌ Thumbnail generation failed:', error);
        }
    }
    
    // Stage Timer Functions
    startStageTimer(template, customDuration) {
        if (this.stageTimer.isRunning) {
            throw new Error('Stage timer already running');
        }
        
        const demoTemplate = this.demoTemplates.get(template);
        if (!demoTemplate && !customDuration) {
            throw new Error('Invalid template or duration required');
        }
        
        this.stageTimer = {
            isRunning: true,
            startTime: Date.now(),
            duration: customDuration || demoTemplate.duration,
            phases: demoTemplate ? demoTemplate.phases : [],
            currentPhase: 0,
            template: template || 'custom'
        };
        
        console.log(`⏰ Stage timer started: ${this.stageTimer.duration}s`);
        this.emit('timerStarted', this.stageTimer);
        
        // Start phase tracking
        this.trackPhases();
        
        return this.stageTimer;
    }
    
    stopStageTimer() {
        if (!this.stageTimer.isRunning) {
            throw new Error('No timer running');
        }
        
        this.stageTimer.isRunning = false;
        this.stageTimer.endTime = Date.now();
        
        console.log('⏰ Stage timer stopped');
        this.emit('timerStopped', this.stageTimer);
        
        return this.stageTimer;
    }
    
    trackPhases() {
        if (!this.stageTimer.isRunning || !this.stageTimer.phases.length) return;
        
        let elapsedPhaseTime = 0;
        
        const checkPhase = () => {
            if (!this.stageTimer.isRunning) return;
            
            const totalElapsed = (Date.now() - this.stageTimer.startTime) / 1000;
            const currentPhase = this.stageTimer.phases[this.stageTimer.currentPhase];
            
            if (currentPhase && totalElapsed >= elapsedPhaseTime + currentPhase.duration) {
                elapsedPhaseTime += currentPhase.duration;
                this.stageTimer.currentPhase++;
                
                if (this.stageTimer.currentPhase < this.stageTimer.phases.length) {
                    const nextPhase = this.stageTimer.phases[this.stageTimer.currentPhase];
                    console.log(`🎬 Phase transition: ${nextPhase.name}`);
                    this.emit('phaseTransition', {
                        phase: nextPhase,
                        phaseIndex: this.stageTimer.currentPhase,
                        totalElapsed
                    });
                } else {
                    console.log('🎬 Demo completed');
                    this.stopStageTimer();
                }
            }
            
            if (this.stageTimer.isRunning) {
                setTimeout(checkPhase, 1000);
            }
        };
        
        checkPhase();
    }
    
    async runAutomatedDemo(templateName) {
        const template = this.demoTemplates.get(templateName);
        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }
        
        console.log(`🎬 Starting automated demo: ${template.name}`);
        
        // Start stage timer
        this.startStageTimer(templateName);
        
        // Start screen capture
        const capture = await this.startScreenCapture({
            filename: `demo-${templateName}-${Date.now()}`,
            duration: template.duration,
            createGIF: true
        });
        
        // Listen for phase transitions
        this.on('phaseTransition', async (event) => {
            const phase = event.phase;
            
            if (phase.url) {
                console.log(`🌐 Opening: ${phase.url}`);
                await execAsync(`open "${phase.url}"`);
            }
            
            if (phase.commands) {
                for (const command of phase.commands) {
                    console.log(`⌨️ Executing: ${command}`);
                    // This would integrate with the Math Meme engine or other systems
                }
            }
            
            if (phase.simulate) {
                console.log(`🎭 Simulating: ${phase.simulate}`);
                // Trigger system events for demonstration
            }
        });
        
        return {
            template,
            capture,
            timer: this.stageTimer
        };
    }
    
    setupSystemIntegrations() {
        // Integration with existing systems
        this.systemIntegrations = {
            mathMeme: { url: 'http://localhost:3017', ws: 'ws://localhost:3016' },
            flask: { url: 'http://localhost:5000' },
            performance: { url: 'http://localhost:3010' },
            bridge: { url: 'http://localhost:3018' },
            contextSwitching: { url: 'http://localhost:3013' }
        };
        
        console.log('🔗 System integrations configured');
    }
    
    setupWebInterfaces() {
        this.setupStudioDashboard();
        this.setupStageTimer();
    }
    
    setupStudioDashboard() {
        const http = require('http');
        
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url, `http://localhost:${this.config.webPort}`);
            
            if (url.pathname === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateStudioDashboard());
            } else if (url.pathname === '/api/start-capture' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const options = JSON.parse(body);
                        const capture = await this.startScreenCapture(options);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(capture));
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
            } else if (url.pathname === '/api/stop-capture' && req.method === 'POST') {
                try {
                    await this.stopScreenCapture();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            } else if (url.pathname === '/api/run-demo' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { template } = JSON.parse(body);
                        const demo = await this.runAutomatedDemo(template);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(demo));
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
            } else if (url.pathname === '/api/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    currentCapture: this.currentCapture,
                    stageTimer: this.stageTimer,
                    templates: Array.from(this.demoTemplates.entries()).map(([id, template]) => ({ id, ...template })),
                    captureHistory: this.captureHistory.slice(-10)
                }));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.config.webPort, () => {
            console.log(`🎬 Demo Studio Dashboard: http://localhost:${this.config.webPort}`);
        });
    }
    
    setupStageTimer() {
        const http = require('http');
        const WebSocket = require('ws');
        
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateStageTimerHTML());
            } else if (req.url === '/api/timer/start' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { template, duration } = JSON.parse(body);
                        const timer = this.startStageTimer(template, duration);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(timer));
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
            } else if (req.url === '/api/timer/stop' && req.method === 'POST') {
                try {
                    const timer = this.stopStageTimer();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(timer));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.config.stageTimerPort);
        
        // WebSocket for real-time timer updates
        const wss = new WebSocket.Server({ port: this.config.stageTimerPort + 1 });
        
        wss.on('connection', (ws) => {
            console.log('📡 Stage timer client connected');
            
            // Send current timer state
            ws.send(JSON.stringify({
                type: 'timerState',
                data: this.stageTimer
            }));
            
            // Listen for timer events
            const timerListener = (data) => {
                ws.send(JSON.stringify({
                    type: 'timerUpdate',
                    data
                }));
            };
            
            const phaseListener = (data) => {
                ws.send(JSON.stringify({
                    type: 'phaseTransition',
                    data
                }));
            };
            
            this.on('timerStarted', timerListener);
            this.on('timerStopped', timerListener);
            this.on('phaseTransition', phaseListener);
            
            ws.on('close', () => {
                this.off('timerStarted', timerListener);
                this.off('timerStopped', timerListener);
                this.off('phaseTransition', phaseListener);
            });
        });
    }
    
    generateStudioDashboard() {
        const templates = Array.from(this.demoTemplates.entries());
        const recentCaptures = this.captureHistory.slice(-5).reverse();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎬 Demo Capture Studio</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #1a1a1a; 
            color: #fff; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
        }
        .header { 
            text-align: center; 
            padding: 20px; 
            background: #2a2a2a; 
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .controls-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px;
            margin-bottom: 30px;
        }
        .control-section { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px;
        }
        .demo-templates { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .template-card { 
            background: #333; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 4px;
            border-left: 4px solid #4ecca3;
        }
        .btn { 
            background: #4ecca3; 
            color: #000; 
            border: none; 
            padding: 10px 20px; 
            margin: 5px; 
            cursor: pointer; 
            border-radius: 4px;
            font-size: 16px;
        }
        .btn:hover { 
            background: #3eb393; 
        }
        .btn-danger { 
            background: #e94560; 
            color: #fff;
        }
        .status { 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 4px;
            background: #333;
        }
        .timer-display { 
            font-size: 48px; 
            text-align: center; 
            color: #4ecca3;
            background: #000;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .capture-history { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px;
        }
        .capture-item { 
            background: #333; 
            padding: 10px; 
            margin: 5px 0; 
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        h1, h2 { 
            color: #4ecca3; 
        }
        .system-links { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .system-links a { 
            color: #4ecca3; 
            text-decoration: none; 
            margin: 0 15px;
        }
        .phase-indicator { 
            background: #333; 
            padding: 10px; 
            margin: 5px 0; 
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 Demo Capture Studio</h1>
            <p>Create professional demos, screen captures, and presentation materials</p>
        </div>
        
        <div class="system-links">
            <h2>🔗 System Links</h2>
            <a href="http://localhost:3000" target="_blank">System Coordinator</a>
            <a href="http://localhost:3010" target="_blank">Performance Monitor</a>
            <a href="http://localhost:3017" target="_blank">Math Meme Engine</a>
            <a href="http://localhost:5000" target="_blank">Flask Service</a>
            <a href="http://localhost:3018" target="_blank">Integration Bridge</a>
            <a href="http://localhost:${this.config.stageTimerPort}" target="_blank">Stage Timer</a>
        </div>
        
        <div class="controls-grid">
            <div class="control-section">
                <h2>📹 Screen Capture</h2>
                <div class="status" id="captureStatus">
                    ${this.currentCapture ? `Recording: ${this.currentCapture.filename}` : 'Ready to capture'}
                </div>
                <button class="btn" onclick="startCapture()" ${this.currentCapture ? 'disabled' : ''}>
                    🎥 Start Capture
                </button>
                <button class="btn btn-danger" onclick="stopCapture()" ${!this.currentCapture ? 'disabled' : ''}>
                    ⏹️ Stop Capture
                </button>
                <div>
                    <label>Duration (seconds):</label>
                    <input type="number" id="captureLength" value="60" min="5" max="300">
                </div>
            </div>
            
            <div class="control-section">
                <h2>⏰ Stage Timer</h2>
                <div class="timer-display" id="timerDisplay">
                    ${this.stageTimer.isRunning ? 'RUNNING' : '00:00'}
                </div>
                <div class="status" id="timerStatus">
                    ${this.stageTimer.isRunning ? `Phase: ${this.stageTimer.currentPhase + 1}/${this.stageTimer.phases.length}` : 'Timer ready'}
                </div>
                <button class="btn" onclick="startTimer()" ${this.stageTimer.isRunning ? 'disabled' : ''}>
                    ⏰ Start Timer
                </button>
                <button class="btn btn-danger" onclick="stopTimer()" ${!this.stageTimer.isRunning ? 'disabled' : ''}>
                    ⏹️ Stop Timer
                </button>
            </div>
        </div>
        
        <div class="demo-templates">
            <h2>🎭 Demo Templates</h2>
            ${templates.map(([id, template]) => `
                <div class="template-card">
                    <h3>${template.name}</h3>
                    <p>${template.description}</p>
                    <p><strong>Duration:</strong> ${template.duration}s | <strong>Phases:</strong> ${template.phases.length}</p>
                    <button class="btn" onclick="runDemo('${id}')">🚀 Run Demo</button>
                    <div class="phases" style="margin-top: 10px;">
                        ${template.phases.map((phase, i) => `
                            <div class="phase-indicator">
                                ${i + 1}. ${phase.name} (${phase.duration}s)
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="capture-history">
            <h2>📼 Recent Captures</h2>
            ${recentCaptures.length > 0 ? recentCaptures.map(capture => `
                <div class="capture-item">
                    <div>
                        <strong>${capture.filename}</strong><br>
                        Duration: ${Math.round(capture.duration / 1000)}s
                        ${capture.gifPath ? ' | GIF ✅' : ''}
                    </div>
                    <div>
                        ${capture.success ? '✅' : '❌'}
                    </div>
                </div>
            `).join('') : '<p>No captures yet</p>'}
        </div>
    </div>
    
    <script>
        async function startCapture() {
            const duration = parseInt(document.getElementById('captureLength').value);
            const response = await fetch('/api/start-capture', {
                method: 'POST',
                body: JSON.stringify({ duration }),
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                location.reload();
            }
        }
        
        async function stopCapture() {
            const response = await fetch('/api/stop-capture', { method: 'POST' });
            const result = await response.json();
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                location.reload();
            }
        }
        
        async function runDemo(template) {
            if (confirm('Run automated demo: ' + template + '?')) {
                const response = await fetch('/api/run-demo', {
                    method: 'POST',
                    body: JSON.stringify({ template }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await response.json();
                if (result.error) {
                    alert('Error: ' + result.error);
                } else {
                    alert('Demo started! Check Stage Timer for progress.');
                }
            }
        }
        
        async function startTimer() {
            // For now, start with custom duration
            const duration = parseInt(prompt('Timer duration (seconds):', '60'));
            if (duration) {
                const response = await fetch('/api/timer/start', {
                    method: 'POST',
                    body: JSON.stringify({ duration }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await response.json();
                if (result.error) {
                    alert('Error: ' + result.error);
                } else {
                    location.reload();
                }
            }
        }
        
        async function stopTimer() {
            const response = await fetch('/api/timer/stop', { method: 'POST' });
            const result = await response.json();
            if (result.error) {
                alert('Error: ' + result.error);
            } else {
                location.reload();
            }
        }
        
        // Auto-refresh every 5 seconds if capturing or timing
        ${this.currentCapture || this.stageTimer.isRunning ? 'setTimeout(() => location.reload(), 5000);' : ''}
    </script>
</body>
</html>`;
    }
    
    generateStageTimerHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>⏰ Stage Timer</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            background: #000; 
            color: #fff; 
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .timer-main { 
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        .timer-display { 
            font-size: 180px; 
            font-weight: bold;
            color: #4ecca3;
            margin: 20px 0;
            text-shadow: 0 0 50px #4ecca3;
        }
        .timer-warning { color: #ffd700; }
        .timer-critical { color: #e94560; animation: pulse 1s infinite; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .phase-info { 
            font-size: 36px; 
            margin: 20px 0;
            color: #ccc;
        }
        .progress-bar { 
            width: 80%;
            height: 20px;
            background: #333;
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-fill { 
            height: 100%;
            background: linear-gradient(90deg, #4ecca3, #45b393);
            transition: width 1s ease;
        }
        .controls { 
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
        }
        .btn { 
            background: #4ecca3; 
            color: #000; 
            border: none; 
            padding: 15px 25px; 
            cursor: pointer; 
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
        }
        .btn:hover { 
            background: #3eb393; 
        }
        .status { 
            position: fixed;
            top: 20px;
            left: 20px;
            font-size: 24px;
            padding: 15px;
            background: rgba(0,0,0,0.8);
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="status" id="status">Ready</div>
    
    <div class="timer-main">
        <div class="timer-display" id="timerDisplay">00:00</div>
        <div class="phase-info" id="phaseInfo">Waiting to start...</div>
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
        </div>
    </div>
    
    <div class="controls">
        <button class="btn" onclick="toggleFullscreen()">🔳 Fullscreen</button>
    </div>
    
    <script>
        let timer = null;
        let ws = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.stageTimerPort + 1}');
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                
                if (message.type === 'timerState' || message.type === 'timerUpdate') {
                    updateTimerDisplay(message.data);
                } else if (message.type === 'phaseTransition') {
                    updatePhase(message.data);
                }
            };
            
            ws.onclose = function() {
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function updateTimerDisplay(timerData) {
            timer = timerData;
            
            if (timer.isRunning) {
                const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
                const remaining = Math.max(0, timer.duration - elapsed);
                
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                const timeStr = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
                
                document.getElementById('timerDisplay').textContent = timeStr;
                
                // Color coding
                const display = document.getElementById('timerDisplay');
                display.className = '';
                if (remaining <= 10) {
                    display.classList.add('timer-critical');
                } else if (remaining <= 30) {
                    display.classList.add('timer-warning');
                }
                
                // Progress bar
                const progress = ((timer.duration - remaining) / timer.duration) * 100;
                document.getElementById('progressFill').style.width = progress + '%';
                
                // Status
                document.getElementById('status').textContent = 'Running: ' + timer.template;
            } else {
                document.getElementById('timerDisplay').textContent = '00:00';
                document.getElementById('progressFill').style.width = '0%';
                document.getElementById('status').textContent = 'Timer stopped';
            }
        }
        
        function updatePhase(phaseData) {
            if (phaseData.phase) {
                document.getElementById('phaseInfo').textContent = 
                    'Phase ' + (phaseData.phaseIndex + 1) + ': ' + phaseData.phase.name;
            }
        }
        
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
        
        // Connect to WebSocket
        connectWebSocket();
        
        // Update timer every second
        setInterval(() => {
            if (timer && timer.isRunning) {
                updateTimerDisplay(timer);
            }
        }, 1000);
    </script>
</body>
</html>`;
    }
    
    stop() {
        if (this.captureProcess) {
            this.captureProcess.kill();
        }
        if (this.stageTimer.isRunning) {
            this.stopStageTimer();
        }
        console.log('🛑 Demo Capture Studio stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const studio = new DemoCaptureStudio();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping Demo Capture Studio...');
        studio.stop();
        process.exit(0);
    });
}

module.exports = DemoCaptureStudio;