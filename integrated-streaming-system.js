// Integrated Color-Coded Streaming System with QR Codes
// Connects Rust/Solidity/Flask/Docker through WebSocket streams

const WebSocket = require('ws');
const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { spawn } = require('child_process');

class IntegratedStreamingSystem {
    constructor(config = {}) {
        this.port = config.port || 8917;
        this.wsPort = config.wsPort || 8918;
        this.app = express();
        this.wss = null;
        this.streams = new Map();
        this.qrCache = new Map();
        
        // Color coding for different data types
        this.colorScheme = {
            rust: '#CE422B',      // Rust orange
            solidity: '#646464',  // Solidity grey
            flask: '#000000',     // Flask black
            docker: '#2496ED',    // Docker blue
            anchor: '#7B3FF2',    // Anchor purple
            data: '#00FF88',      // Data green
            error: '#FF0044',     // Error red
            warning: '#FFAA00',   // Warning yellow
            success: '#00FF00',   // Success green
            qr: '#8B4513'        // QR brown
        };
        
        // Stream types
        this.streamTypes = {
            RUST_COMPILATION: 'rust_compile',
            SOLIDITY_DEPLOY: 'solidity_deploy',
            FLASK_API: 'flask_api',
            DOCKER_BUILD: 'docker_build',
            ANCHOR_PROGRAM: 'anchor_program',
            QR_GENERATION: 'qr_generation'
        };
        
        this.initializeSystem();
    }
    
    initializeSystem() {
        // Set up Express routes
        this.setupRoutes();
        
        // Initialize WebSocket server
        this.setupWebSocket();
        
        // Start containers if needed
        this.checkContainers();
        
        console.log('🌈 Integrated Streaming System initialized');
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Stream endpoint
        this.app.get('/stream/:type', (req, res) => {
            const { type } = req.params;
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });
            
            const streamId = crypto.randomBytes(16).toString('hex');
            this.streams.set(streamId, { res, type });
            
            req.on('close', () => {
                this.streams.delete(streamId);
            });
        });
        
        // QR Code generation
        this.app.post('/qr/generate', async (req, res) => {
            const { data, type = 'data' } = req.body;
            const qrData = await this.generateQRCode(data, type);
            res.json({ qr: qrData });
        });
        
        // Rust compilation endpoint
        this.app.post('/rust/compile', async (req, res) => {
            const { code } = req.body;
            const result = await this.compileRust(code);
            res.json(result);
        });
        
        // Solidity deployment
        this.app.post('/solidity/deploy', async (req, res) => {
            const { contract, network = 'localhost' } = req.body;
            const result = await this.deploySolidity(contract, network);
            res.json(result);
        });
        
        // Flask API proxy
        this.app.use('/flask', (req, res) => {
            // Proxy to Flask backend
            this.proxyToFlask(req, res);
        });
        
        // Docker operations
        this.app.post('/docker/:action', async (req, res) => {
            const { action } = req.params;
            const result = await this.dockerOperation(action, req.body);
            res.json(result);
        });
        
        this.app.listen(this.port, () => {
            console.log(`📡 Streaming server running on port ${this.port}`);
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    this.sendColoredMessage(ws, 'error', error.message, this.colorScheme.error);
                }
            });
            
            // Send initial connection message
            this.sendColoredMessage(ws, 'connected', 'Integrated Streaming System Ready', this.colorScheme.success);
        });
        
        console.log(`🌐 WebSocket server running on port ${this.wsPort}`);
    }
    
    async handleWebSocketMessage(ws, data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'stream':
                this.streamColoredData(ws, payload);
                break;
                
            case 'compile_rust':
                await this.streamRustCompilation(ws, payload);
                break;
                
            case 'deploy_solidity':
                await this.streamSolidityDeployment(ws, payload);
                break;
                
            case 'build_docker':
                await this.streamDockerBuild(ws, payload);
                break;
                
            case 'generate_qr':
                await this.streamQRGeneration(ws, payload);
                break;
                
            default:
                this.sendColoredMessage(ws, 'unknown', `Unknown message type: ${type}`, this.colorScheme.warning);
        }
    }
    
    streamColoredData(ws, data) {
        const { content, type = 'data' } = data;
        const color = this.colorScheme[type] || this.colorScheme.data;
        
        // Create colored frame
        const frame = {
            timestamp: Date.now(),
            type,
            color,
            content,
            spectrum: this.generateColorSpectrum(content)
        };
        
        ws.send(JSON.stringify(frame));
        
        // Broadcast to SSE streams
        this.broadcastToStreams(type, frame);
    }
    
    generateColorSpectrum(content) {
        // Generate color spectrum based on content
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        const spectrum = [];
        
        for (let i = 0; i < 8; i++) {
            const colorValue = parseInt(hash.substr(i * 8, 6), 16);
            spectrum.push(`#${hash.substr(i * 8, 6)}`);
        }
        
        return spectrum;
    }
    
    async streamRustCompilation(ws, payload) {
        const { code, target = 'wasm32-unknown-unknown' } = payload;
        
        this.sendColoredMessage(ws, 'rust_start', 'Starting Rust compilation...', this.colorScheme.rust);
        
        // Write code to temp file
        const tempFile = `/tmp/rust_${Date.now()}.rs`;
        require('fs').writeFileSync(tempFile, code);
        
        // Compile with rustc
        const rustc = spawn('rustc', ['--target', target, tempFile, '-o', `${tempFile}.wasm`]);
        
        rustc.stdout.on('data', (data) => {
            this.sendColoredMessage(ws, 'rust_output', data.toString(), this.colorScheme.rust);
        });
        
        rustc.stderr.on('data', (data) => {
            this.sendColoredMessage(ws, 'rust_error', data.toString(), this.colorScheme.error);
        });
        
        rustc.on('close', async (code) => {
            if (code === 0) {
                this.sendColoredMessage(ws, 'rust_success', 'Compilation successful!', this.colorScheme.success);
                
                // Generate QR code for compiled WASM
                const wasmData = require('fs').readFileSync(`${tempFile}.wasm`);
                const qr = await this.generateQRCode(wasmData.toString('base64'), 'rust_wasm');
                
                ws.send(JSON.stringify({
                    type: 'rust_complete',
                    color: this.colorScheme.success,
                    qrCode: qr,
                    wasmSize: wasmData.length
                }));
            } else {
                this.sendColoredMessage(ws, 'rust_failed', `Compilation failed with code ${code}`, this.colorScheme.error);
            }
        });
    }
    
    async streamSolidityDeployment(ws, payload) {
        const { contract, network } = payload;
        
        this.sendColoredMessage(ws, 'solidity_start', `Deploying to ${network}...`, this.colorScheme.solidity);
        
        // Here you would integrate with actual Solidity deployment
        // For now, simulate the process
        const steps = [
            'Compiling contract...',
            'Estimating gas...',
            'Signing transaction...',
            'Broadcasting to network...',
            'Waiting for confirmation...'
        ];
        
        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.sendColoredMessage(ws, 'solidity_step', step, this.colorScheme.solidity);
        }
        
        // Generate deployment QR
        const deploymentData = {
            contract: contract.name,
            address: '0x' + crypto.randomBytes(20).toString('hex'),
            network,
            timestamp: Date.now()
        };
        
        const qr = await this.generateQRCode(JSON.stringify(deploymentData), 'solidity_deploy');
        
        ws.send(JSON.stringify({
            type: 'solidity_deployed',
            color: this.colorScheme.success,
            deployment: deploymentData,
            qrCode: qr
        }));
    }
    
    async streamDockerBuild(ws, payload) {
        const { dockerfile, tag = 'document-generator:latest' } = payload;
        
        this.sendColoredMessage(ws, 'docker_start', `Building Docker image ${tag}...`, this.colorScheme.docker);
        
        const docker = spawn('docker', ['build', '-t', tag, '-']);
        
        // Send dockerfile to stdin
        docker.stdin.write(dockerfile);
        docker.stdin.end();
        
        docker.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    const color = line.includes('Successfully') ? this.colorScheme.success : this.colorScheme.docker;
                    this.sendColoredMessage(ws, 'docker_output', line, color);
                }
            });
        });
        
        docker.on('close', async (code) => {
            if (code === 0) {
                // Generate QR for docker run command
                const runCommand = `docker run -p 8080:8080 ${tag}`;
                const qr = await this.generateQRCode(runCommand, 'docker_run');
                
                ws.send(JSON.stringify({
                    type: 'docker_built',
                    color: this.colorScheme.success,
                    image: tag,
                    qrCode: qr,
                    runCommand
                }));
            }
        });
    }
    
    async generateQRCode(data, type) {
        const cacheKey = `${type}:${crypto.createHash('md5').update(data).digest('hex')}`;
        
        if (this.qrCache.has(cacheKey)) {
            return this.qrCache.get(cacheKey);
        }
        
        const qrData = await QRCode.toDataURL(data, {
            color: {
                dark: this.colorScheme[type] || '#000000',
                light: '#FFFFFF'
            },
            width: 512,
            margin: 2
        });
        
        this.qrCache.set(cacheKey, qrData);
        return qrData;
    }
    
    sendColoredMessage(ws, type, content, color) {
        ws.send(JSON.stringify({
            type,
            color,
            content,
            timestamp: Date.now()
        }));
    }
    
    broadcastToStreams(type, data) {
        this.streams.forEach((stream, id) => {
            if (stream.type === type || stream.type === 'all') {
                stream.res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
        });
    }
    
    async checkContainers() {
        // Check if required containers are running
        const containers = ['postgres', 'redis', 'minio'];
        
        for (const container of containers) {
            const isRunning = await this.isContainerRunning(container);
            console.log(`📦 ${container}: ${isRunning ? '✅ Running' : '❌ Not running'}`);
        }
    }
    
    async isContainerRunning(name) {
        return new Promise((resolve) => {
            const docker = spawn('docker', ['ps', '--filter', `name=${name}`, '--format', '{{.Names}}']);
            let output = '';
            
            docker.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            docker.on('close', () => {
                resolve(output.includes(name));
            });
        });
    }
    
    async proxyToFlask(req, res) {
        // Proxy requests to Flask backend
        const flaskUrl = `http://localhost:5000${req.url.replace('/flask', '')}`;
        
        try {
            const fetch = require('node-fetch');
            const response = await fetch(flaskUrl, {
                method: req.method,
                headers: req.headers,
                body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
            });
            
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Flask backend not available' });
        }
    }
    
    async dockerOperation(action, params) {
        switch (action) {
            case 'build':
                return { status: 'building', tag: params.tag };
                
            case 'run':
                return { status: 'running', container: params.container };
                
            case 'stop':
                return { status: 'stopped', container: params.container };
                
            default:
                return { error: 'Unknown action' };
        }
    }
}

// Export for use in Electron
module.exports = IntegratedStreamingSystem;

// Start if run directly
if (require.main === module) {
    new IntegratedStreamingSystem();
}