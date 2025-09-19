#!/usr/bin/env node
/**
 * Quick Demo Generator
 * 
 * Automatically creates showcases by capturing screenshots, assembling GIFs,
 * and generating presentation materials for system demonstrations
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const puppeteer = require('puppeteer');
const EventEmitter = require('events');
const execAsync = promisify(exec);

class QuickDemoGenerator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            outputDir: options.outputDir || path.join(__dirname, 'quick-demos'),
            screenshotDir: options.screenshotDir || path.join(__dirname, 'demo-screenshots'),
            templateDir: options.templateDir || path.join(__dirname, 'demo-templates'),
            browser: null,
            screenshotInterval: options.screenshotInterval || 2000, // 2 seconds
            gifDuration: options.gifDuration || 20, // 20 seconds
            gifQuality: options.gifQuality || 'medium',
            webPort: options.webPort || 3021
        };
        
        this.systemUrls = {
            coordinator: 'http://localhost:3000',
            performance: 'http://localhost:3010',
            mathMeme: 'http://localhost:3017',
            flask: 'http://localhost:5000',
            bridge: 'http://localhost:3018',
            demoStudio: 'http://localhost:3020'
        };
        
        this.activeGenerations = new Map();
        this.generationHistory = [];
        
        console.log('⚡ Quick Demo Generator initialized');
        console.log(`📁 Output: ${this.config.outputDir}`);
        console.log(`🌐 Generator Dashboard: http://localhost:${this.config.webPort}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Create directories
        [this.config.outputDir, this.config.screenshotDir, this.config.templateDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Start browser
        await this.startBrowser();
        
        // Setup web interface
        this.setupWebInterface();
        
        // Load demo scenarios
        this.loadDemoScenarios();
    }
    
    async startBrowser() {
        try {
            this.config.browser = await puppeteer.launch({
                headless: false, // Show browser for demo purposes
                defaultViewport: { width: 1280, height: 720 },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-features=TranslateUI'
                ]
            });
            console.log('🌐 Browser started for screenshot capture');
        } catch (error) {
            console.error('❌ Failed to start browser:', error);
        }
    }
    
    loadDemoScenarios() {
        this.demoScenarios = {
            'system-overview': {
                name: 'Complete System Overview',
                duration: 30,
                steps: [
                    { url: this.systemUrls.coordinator, duration: 5, title: 'System Coordinator' },
                    { url: this.systemUrls.performance, duration: 8, title: 'Performance Monitor' },
                    { url: this.systemUrls.mathMeme, duration: 10, title: 'Math Meme Time Engine' },
                    { url: this.systemUrls.flask, duration: 4, title: 'Flask Time Service' },
                    { url: this.systemUrls.bridge, duration: 3, title: 'Integration Bridge' }
                ]
            },
            'math-meme-focus': {
                name: 'Math Meme Time Demo',
                duration: 25,
                steps: [
                    { url: this.systemUrls.mathMeme, duration: 15, title: 'Time Compression Demo' },
                    { url: this.systemUrls.flask, duration: 6, title: 'Data Storage' },
                    { url: this.systemUrls.bridge, duration: 4, title: 'Export Capabilities' }
                ]
            },
            'performance-focus': {
                name: 'Performance Monitoring',
                duration: 20,
                steps: [
                    { url: this.systemUrls.performance, duration: 20, title: '20x Slowdown Detection' }
                ]
            },
            'quick-tour': {
                name: 'Quick System Tour',
                duration: 15,
                steps: [
                    { url: this.systemUrls.coordinator, duration: 3, title: 'Overview' },
                    { url: this.systemUrls.mathMeme, duration: 6, title: 'Time Engine' },
                    { url: this.systemUrls.performance, duration: 4, title: 'Monitoring' },
                    { url: this.systemUrls.demoStudio, duration: 2, title: 'Demo Tools' }
                ]
            }
        };
        
        console.log(`📋 Loaded ${Object.keys(this.demoScenarios).length} demo scenarios`);
    }
    
    async generateDemo(scenarioId, options = {}) {
        const scenario = this.demoScenarios[scenarioId];
        if (!scenario) {
            throw new Error(`Scenario not found: ${scenarioId}`);
        }
        
        const generationId = `demo_${scenarioId}_${Date.now()}`;
        const outputPath = path.join(this.config.outputDir, generationId);
        
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        
        const generation = {
            id: generationId,
            scenario: scenarioId,
            scenarioData: scenario,
            startTime: Date.now(),
            outputPath,
            screenshots: [],
            status: 'running',
            options
        };
        
        this.activeGenerations.set(generationId, generation);
        this.emit('generationStarted', generation);
        
        try {
            console.log(`🎬 Starting demo generation: ${scenario.name}`);
            
            // Generate screenshots for each step
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];
                await this.captureStep(generation, step, i);
            }
            
            // Create GIF from screenshots
            await this.createGIF(generation);
            
            // Generate presentation HTML
            await this.generatePresentationHTML(generation);
            
            // Create summary
            await this.createSummary(generation);
            
            generation.status = 'completed';
            generation.endTime = Date.now();
            generation.duration = generation.endTime - generation.startTime;
            
            this.generationHistory.push(generation);
            this.activeGenerations.delete(generationId);
            
            console.log(`✅ Demo generation completed: ${generationId}`);
            this.emit('generationCompleted', generation);
            
            return generation;
        } catch (error) {
            generation.status = 'failed';
            generation.error = error.message;
            
            this.activeGenerations.delete(generationId);
            
            console.error(`❌ Demo generation failed: ${error.message}`);
            this.emit('generationFailed', generation);
            
            throw error;
        }
    }
    
    async captureStep(generation, step, stepIndex) {
        if (!this.config.browser) {
            throw new Error('Browser not available');
        }
        
        console.log(`📸 Capturing step ${stepIndex + 1}: ${step.title}`);
        
        const page = await this.config.browser.newPage();
        
        try {
            // Navigate to URL
            await page.goto(step.url, { waitUntil: 'networkidle2' });
            
            // Wait for page to load
            await page.waitForTimeout(2000);
            
            const screenshotsPerStep = Math.max(1, Math.floor(step.duration / 2));
            const interval = step.duration * 1000 / screenshotsPerStep;
            
            for (let i = 0; i < screenshotsPerStep; i++) {
                const screenshotName = `step_${stepIndex}_frame_${i}.png`;
                const screenshotPath = path.join(generation.outputPath, screenshotName);
                
                await page.screenshot({
                    path: screenshotPath,
                    fullPage: false,
                    clip: { x: 0, y: 0, width: 1280, height: 720 }
                });
                
                generation.screenshots.push({
                    step: stepIndex,
                    frame: i,
                    title: step.title,
                    path: screenshotPath,
                    timestamp: Date.now()
                });
                
                if (i < screenshotsPerStep - 1) {
                    await page.waitForTimeout(interval);
                }
            }
        } finally {
            await page.close();
        }
    }
    
    async createGIF(generation) {
        console.log('🎞️ Creating GIF from screenshots...');
        
        const gifPath = path.join(generation.outputPath, 'demo.gif');
        const tempDir = path.join(generation.outputPath, 'temp');
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        try {
            // Resize and prepare images
            for (let i = 0; i < generation.screenshots.length; i++) {
                const screenshot = generation.screenshots[i];
                const tempPath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.png`);
                
                // Resize image for GIF
                await execAsync(`convert "${screenshot.path}" -resize 800x450 "${tempPath}"`);
            }
            
            // Create GIF with ImageMagick
            const delay = 200; // 200ms between frames (5 fps)
            await execAsync(`convert -delay ${delay} -loop 0 "${tempDir}/frame_*.png" "${gifPath}"`);
            
            // Cleanup temp files
            fs.rmSync(tempDir, { recursive: true });
            
            generation.gifPath = gifPath;
            console.log(`✅ GIF created: ${path.basename(gifPath)}`);
        } catch (error) {
            console.error('❌ GIF creation failed:', error);
            // Don't fail the entire generation for GIF issues
        }
    }
    
    async generatePresentationHTML(generation) {
        console.log('📄 Generating presentation HTML...');
        
        const htmlPath = path.join(generation.outputPath, 'presentation.html');
        const scenario = generation.scenarioData;
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>${scenario.name} - Auto-Generated Demo</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            background: #1a1a1a; 
            color: #fff; 
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            text-align: center; 
            padding: 30px 0; 
            border-bottom: 2px solid #4ecca3; 
        }
        .demo-info { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .gif-container { 
            text-align: center; 
            margin: 30px 0; 
        }
        .gif-container img { 
            max-width: 100%; 
            border: 2px solid #4ecca3; 
            border-radius: 8px; 
        }
        .steps { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px; 
        }
        .step { 
            background: #333; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 4px; 
            border-left: 4px solid #4ecca3; 
        }
        .screenshots { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
        }
        .screenshot { 
            text-align: center; 
        }
        .screenshot img { 
            width: 100%; 
            border-radius: 4px; 
            border: 1px solid #444; 
        }
        h1, h2 { 
            color: #4ecca3; 
        }
        .timestamp { 
            color: #888; 
            font-size: 0.9rem; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 ${scenario.name}</h1>
            <p>Auto-generated demo presentation</p>
            <div class="timestamp">Generated: ${new Date(generation.startTime).toLocaleString()}</div>
        </div>
        
        <div class="demo-info">
            <h2>📊 Demo Information</h2>
            <p><strong>Scenario:</strong> ${generation.scenario}</p>
            <p><strong>Duration:</strong> ${scenario.duration} seconds</p>
            <p><strong>Steps:</strong> ${scenario.steps.length}</p>
            <p><strong>Screenshots:</strong> ${generation.screenshots.length}</p>
            <p><strong>Generation Time:</strong> ${Math.round((generation.endTime - generation.startTime) / 1000)}s</p>
        </div>
        
        ${generation.gifPath ? `
        <div class="gif-container">
            <h2>🎞️ Animated Demo</h2>
            <img src="demo.gif" alt="Demo Animation">
        </div>
        ` : ''}
        
        <div class="steps">
            <h2>📋 Demo Steps</h2>
            ${scenario.steps.map((step, i) => `
                <div class="step">
                    <h3>Step ${i + 1}: ${step.title}</h3>
                    <p><strong>URL:</strong> ${step.url}</p>
                    <p><strong>Duration:</strong> ${step.duration} seconds</p>
                </div>
            `).join('')}
        </div>
        
        <div class="screenshots">
            <h2>📸 Screenshots</h2>
            ${generation.screenshots.map((screenshot, i) => `
                <div class="screenshot">
                    <img src="${path.basename(screenshot.path)}" alt="Screenshot ${i + 1}">
                    <p>${screenshot.title}</p>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(htmlPath, html);
        generation.presentationPath = htmlPath;
        
        console.log(`✅ Presentation HTML created: ${path.basename(htmlPath)}`);
    }
    
    async createSummary(generation) {
        const summaryPath = path.join(generation.outputPath, 'summary.json');
        
        const summary = {
            id: generation.id,
            scenario: generation.scenario,
            scenarioName: generation.scenarioData.name,
            startTime: generation.startTime,
            endTime: generation.endTime,
            duration: generation.duration,
            screenshots: generation.screenshots.length,
            steps: generation.scenarioData.steps.length,
            gifCreated: !!generation.gifPath,
            presentationCreated: !!generation.presentationPath,
            outputPath: generation.outputPath,
            files: {
                gif: generation.gifPath ? path.basename(generation.gifPath) : null,
                presentation: generation.presentationPath ? path.basename(generation.presentationPath) : null,
                screenshots: generation.screenshots.map(s => path.basename(s.path))
            }
        };
        
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        generation.summaryPath = summaryPath;
        
        console.log(`✅ Summary created: ${path.basename(summaryPath)}`);
    }
    
    setupWebInterface() {
        const http = require('http');
        
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url, `http://localhost:${this.config.webPort}`);
            
            if (url.pathname === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateDashboardHTML());
            } else if (url.pathname === '/api/generate' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { scenario, options } = JSON.parse(body);
                        const generation = await this.generateDemo(scenario, options);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(generation));
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
            } else if (url.pathname === '/api/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    activeGenerations: Array.from(this.activeGenerations.values()),
                    generationHistory: this.generationHistory.slice(-10),
                    scenarios: this.demoScenarios,
                    systemUrls: this.systemUrls
                }));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.config.webPort, () => {
            console.log(`⚡ Quick Demo Generator Dashboard: http://localhost:${this.config.webPort}`);
        });
    }
    
    generateDashboardHTML() {
        const scenarios = Object.entries(this.demoScenarios);
        const activeGens = Array.from(this.activeGenerations.values());
        const recentGens = this.generationHistory.slice(-5).reverse();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>⚡ Quick Demo Generator</title>
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
        .scenarios { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
            gap: 20px;
            margin-bottom: 30px;
        }
        .scenario-card { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px;
            border: 1px solid #444;
        }
        .scenario-card h3 { 
            color: #4ecca3; 
            margin-top: 0;
        }
        .btn { 
            background: #4ecca3; 
            color: #000; 
            border: none; 
            padding: 10px 20px; 
            margin: 5px; 
            cursor: pointer; 
            border-radius: 4px;
            font-weight: bold;
        }
        .btn:hover { 
            background: #3eb393; 
        }
        .btn:disabled { 
            background: #666; 
            cursor: not-allowed;
        }
        .status-section { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .generation-item { 
            background: #333; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .generation-status { 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 0.8rem;
            font-weight: bold;
        }
        .status-running { background: #ffd700; color: #000; }
        .status-completed { background: #4ecca3; color: #000; }
        .status-failed { background: #e94560; color: #fff; }
        h1, h2 { 
            color: #4ecca3; 
        }
        .step-list { 
            margin: 10px 0; 
            font-size: 0.9rem; 
            color: #ccc;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Quick Demo Generator</h1>
            <p>Automated screenshot capture and demo creation</p>
        </div>
        
        <div class="system-links">
            <h2>🔗 System URLs</h2>
            ${Object.entries(this.systemUrls).map(([name, url]) => 
                `<a href="${url}" target="_blank">${name}: ${url}</a>`
            ).join(' | ')}
        </div>
        
        <div class="scenarios">
            <h2 style="grid-column: 1 / -1;">🎭 Demo Scenarios</h2>
            ${scenarios.map(([id, scenario]) => `
                <div class="scenario-card">
                    <h3>${scenario.name}</h3>
                    <p><strong>Duration:</strong> ${scenario.duration} seconds</p>
                    <p><strong>Steps:</strong> ${scenario.steps.length}</p>
                    <div class="step-list">
                        ${scenario.steps.map((step, i) => 
                            `${i + 1}. ${step.title} (${step.duration}s)`
                        ).join('<br>')}
                    </div>
                    <button class="btn" onclick="generateDemo('${id}')" 
                            ${activeGens.length > 0 ? 'disabled' : ''}>
                        🚀 Generate Demo
                    </button>
                </div>
            `).join('')}
        </div>
        
        ${activeGens.length > 0 ? `
        <div class="status-section">
            <h2>🔄 Active Generations</h2>
            ${activeGens.map(gen => `
                <div class="generation-item">
                    <div>
                        <strong>${gen.scenarioData.name}</strong><br>
                        Started: ${new Date(gen.startTime).toLocaleTimeString()}<br>
                        Screenshots: ${gen.screenshots.length}
                    </div>
                    <div class="generation-status status-running">RUNNING</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="status-section">
            <h2>📼 Recent Generations</h2>
            ${recentGens.length > 0 ? recentGens.map(gen => `
                <div class="generation-item">
                    <div>
                        <strong>${gen.scenarioData.name}</strong><br>
                        Generated: ${new Date(gen.startTime).toLocaleString()}<br>
                        Duration: ${Math.round(gen.duration / 1000)}s | Screenshots: ${gen.screenshots.length}
                        ${gen.gifPath ? ' | GIF ✅' : ''}
                    </div>
                    <div>
                        <div class="generation-status status-${gen.status}">${gen.status.toUpperCase()}</div>
                        ${gen.status === 'completed' ? `
                            <button class="btn" onclick="openGeneration('${gen.id}')">📂 Open</button>
                        ` : ''}
                    </div>
                </div>
            `).join('') : '<p>No generations yet</p>'}
        </div>
    </div>
    
    <script>
        async function generateDemo(scenario) {
            if (confirm('Generate demo for: ' + scenario + '?')) {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    body: JSON.stringify({ scenario }),
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                if (result.error) {
                    alert('Error: ' + result.error);
                } else {
                    alert('Demo generation started! Check status below.');
                    location.reload();
                }
            }
        }
        
        function openGeneration(id) {
            const path = '/Users/matthewmauer/Desktop/Document-Generator/quick-demos/' + id;
            alert('Demo files location: ' + path);
            // In a real implementation, this would open the file explorer
        }
        
        // Auto-refresh every 10 seconds if generations are active
        ${activeGens.length > 0 ? 'setTimeout(() => location.reload(), 10000);' : ''}
    </script>
</body>
</html>`;
    }
    
    async stop() {
        if (this.config.browser) {
            await this.config.browser.close();
        }
        console.log('🛑 Quick Demo Generator stopped');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const generator = new QuickDemoGenerator();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping Quick Demo Generator...');
        await generator.stop();
        process.exit(0);
    });
}

module.exports = QuickDemoGenerator;