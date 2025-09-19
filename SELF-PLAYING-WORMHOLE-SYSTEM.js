#!/usr/bin/env node

/**
 * 🌀 SELF-PLAYING WORMHOLE SYSTEM
 * Our system plays itself! Tracks clicks, generates UPC codes, creates PGP encryption,
 * and feeds everything back into the debug game as interactive content.
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const { execSync } = require('child_process');

class SelfPlayingWormholeSystem {
    constructor(port = 9500) {
        this.port = port;
        this.wsPort = port + 1;
        
        // Wormhole state
        this.wormholeState = {
            clickTracker: new Map(),    // Track all user clicks
            interactions: new Map(),    // Track all interactions
            upcCodes: new Map(),        // Generated UPC codes
            pgpKeys: new Map(),         // PGP encryption keys
            nginxLayers: new Map(),     // Nginx routing layers
            tritonSessions: new Map(),  // One Piece/Triton sessions
            dollarClicks: 0,            // One dollar website clicks
            turingTests: new Map()      // Turing test results
        };
        
        // Self-play configuration
        this.selfPlay = {
            enabled: true,
            clickSimulationRate: 1000,  // ms between simulated clicks
            upcGenerationRate: 5000,    // ms between UPC codes
            encryptionCycleRate: 3000,  // ms between encryption cycles
            debugFeedRate: 2000         // ms between feeding debug game
        };
        
        // Click patterns for self-play
        this.clickPatterns = [
            { x: 100, y: 200, action: 'debug_button' },
            { x: 300, y: 150, action: 'gacha_roll' },
            { x: 500, y: 400, action: 'tycoon_build' },
            { x: 200, y: 600, action: 'cheat_input' },
            { x: 750, y: 300, action: 'token_claim' }
        ];
        
        this.setupServer();
        this.startSelfPlayLoop();
        this.startWormholeGeneration();
    }
    
    setupServer() {
        this.app = express();
        this.app.use(express.json());
        
        // Middleware to track ALL clicks and interactions
        this.app.use((req, res, next) => {
            if (req.method === 'POST' && req.url.includes('/api/')) {
                try {
                    // Track interaction without breaking the flow
                    const interactionId = crypto.randomUUID();
                    this.wormholeState.interactions.set(interactionId, {
                        method: req.method,
                        url: req.url,
                        timestamp: Date.now(),
                        headers: req.headers
                    });
                    console.log(`🌪️ Middleware tracked: ${req.method} ${req.url}`);
                } catch (error) {
                    // Ignore errors in tracking
                }
            }
            next();
        });
        
        // WebSocket for real-time wormhole data
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🌀 Wormhole connection established');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.processWormholeMessage(data, ws);
            });
            
            // Send initial wormhole state
            ws.send(JSON.stringify({
                type: 'wormhole_state',
                data: this.getWormholeSnapshot()
            }));
        });
        
        // Routes
        this.app.get('/', (req, res) => res.send(this.generateWormholeInterface()));
        
        // Click tracking endpoints
        this.app.post('/api/track/click', this.trackClick.bind(this));
        this.app.post('/api/track/interaction', this.trackInteraction.bind(this));
        
        // UPC/QR generation
        this.app.post('/api/generate/upc', this.generateUPC.bind(this));
        this.app.post('/api/generate/qr', this.generateQR.bind(this));
        
        // PGP encryption
        this.app.post('/api/encrypt/pgp', this.encryptPGP.bind(this));
        this.app.get('/api/keys/public', this.getPublicKeys.bind(this));
        
        // Nginx layer management
        this.app.post('/api/nginx/layer', this.createNginxLayer.bind(this));
        this.app.get('/api/nginx/layers', (req, res) => res.json(Array.from(this.wormholeState.nginxLayers.values())));
        
        // Triton/One Piece session management
        this.app.post('/api/triton/session', this.createTritonSession.bind(this));
        this.app.get('/api/triton/sessions', (req, res) => res.json(Array.from(this.wormholeState.tritonSessions.values())));
        
        // Turing test integration
        this.app.post('/api/turing/test', this.createTuringTest.bind(this));
        this.app.get('/api/turing/results', (req, res) => res.json(Array.from(this.wormholeState.turingTests.values())));
        
        // Self-play control
        this.app.post('/api/selfplay/start', (req, res) => {
            this.selfPlay.enabled = true;
            res.json({ message: 'Self-play activated' });
        });
        
        this.app.post('/api/selfplay/stop', (req, res) => {
            this.selfPlay.enabled = false;
            res.json({ message: 'Self-play deactivated' });
        });
        
        // Debug game integration
        this.app.get('/api/debug/feed', this.getDebugFeed.bind(this));
        
        this.app.listen(this.port, () => {
            console.log(`🌀 Self-Playing Wormhole System running on http://localhost:${this.port}`);
            console.log(`🎮 Self-Play: ${this.selfPlay.enabled ? 'ACTIVE' : 'INACTIVE'}`);
            console.log(`🔍 Click Tracking: ACTIVE`);
            console.log(`🔐 PGP Encryption: ACTIVE`);
            console.log(`📊 UPC Generation: ACTIVE`);
        });
    }
    
    trackClick(req, res) {
        const { x, y, action, timestamp = Date.now() } = req.body;
        
        const clickId = crypto.randomBytes(8).toString('hex');
        const clickData = {
            id: clickId,
            x, y, action, timestamp,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            encrypted: false
        };
        
        this.wormholeState.clickTracker.set(clickId, clickData);
        
        // Generate UPC code for this click
        const upcCode = this.generateUPCForClick(clickData);
        
        // Create PGP encryption
        const encrypted = this.encryptClickData(clickData);
        
        // Feed to debug game
        this.feedToDebugGame({
            type: 'user_click',
            data: clickData,
            upcCode,
            encrypted
        });
        
        res.json({
            success: true,
            clickId,
            upcCode,
            encrypted: encrypted.slice(0, 50) + '...',
            message: 'Click tracked and wormholed!'
        });
    }
    
    trackInteraction(req, res) {
        const { type, data, timestamp = Date.now() } = req.body;
        
        const interactionId = crypto.randomUUID();
        const interactionData = {
            id: interactionId,
            type,
            data,
            timestamp,
            encrypted: this.encryptClickData({ id: interactionId, type, data })
        };
        
        this.wormholeState.interactions.set(interactionId, interactionData);
        
        console.log(`🌪️ Interaction tracked: ${type} (${interactionId})`);
        
        res.json({ success: true, interactionId, encrypted: interactionData.encrypted.slice(0, 20) + '...' });
    }
    
    generateUPCForClick(clickData) {
        // Create UPC code based on click coordinates and timestamp
        const base = `${clickData.x}${clickData.y}${clickData.timestamp}`;
        const hash = crypto.createHash('md5').update(base).digest('hex');
        
        // Convert to UPC format (12 digits)
        const upcDigits = hash.slice(0, 11);
        const checkDigit = this.calculateUPCCheckDigit(upcDigits);
        const fullUPC = upcDigits + checkDigit;
        
        this.wormholeState.upcCodes.set(clickData.id, fullUPC);
        
        return fullUPC;
    }
    
    calculateUPCCheckDigit(digits) {
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            const digit = parseInt(digits[i], 16) % 10; // Convert hex to decimal
            sum += (i % 2 === 0) ? digit * 3 : digit;
        }
        return (10 - (sum % 10)) % 10;
    }
    
    encryptClickData(clickData) {
        // Simple PGP-style encryption
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', key);
        
        let encrypted = cipher.update(JSON.stringify(clickData), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Store key for later decryption
        this.wormholeState.pgpKeys.set(clickData.id, {
            key: key.toString('hex'),
            iv: iv.toString('hex')
        });
        
        return encrypted;
    }
    
    createNginxLayer(req, res) {
        const { route, upstream, config } = req.body;
        
        const layerId = crypto.randomBytes(8).toString('hex');
        const nginxLayer = {
            id: layerId,
            route,
            upstream,
            config,
            created: Date.now(),
            traffic: 0
        };
        
        this.wormholeState.nginxLayers.set(layerId, nginxLayer);
        
        // Generate nginx config
        const nginxConfig = this.generateNginxConfig(nginxLayer);
        
        res.json({
            success: true,
            layerId,
            nginxConfig,
            message: 'Nginx layer created in wormhole'
        });
    }
    
    generateNginxConfig(layer) {
        return `
# Wormhole Layer: ${layer.id}
location ${layer.route} {
    proxy_pass ${layer.upstream};
    proxy_set_header X-Wormhole-Layer ${layer.id};
    proxy_set_header X-Wormhole-Time ${Date.now()};
    ${layer.config || ''}
}`;
    }
    
    createTritonSession(req, res) {
        const { userId, sessionType = 'one_piece' } = req.body;
        
        const sessionId = crypto.randomBytes(16).toString('hex');
        const tritonSession = {
            id: sessionId,
            userId,
            type: sessionType,
            started: Date.now(),
            clicks: [],
            treasures: this.generateOnePieceTreasures(),
            navigation: this.generateTritonNavigation()
        };
        
        this.wormholeState.tritonSessions.set(sessionId, tritonSession);
        
        res.json({
            success: true,
            sessionId,
            treasures: tritonSession.treasures,
            navigation: tritonSession.navigation,
            message: 'Triton session wormholed!'
        });
    }
    
    generateOnePieceTreasures() {
        const treasures = [
            { name: 'Debug Gold', value: 1000, location: { x: 100, y: 200 } },
            { name: 'Token Chest', value: 5000, location: { x: 300, y: 150 } },
            { name: 'PGP Scroll', value: 2500, location: { x: 500, y: 400 } },
            { name: 'UPC Rune', value: 1500, location: { x: 200, y: 600 } },
            { name: 'Nginx Compass', value: 3000, location: { x: 750, y: 300 } }
        ];
        
        return treasures.slice(0, Math.floor(Math.random() * treasures.length) + 1);
    }
    
    generateTritonNavigation() {
        return {
            currentPosition: { x: 400, y: 300 },
            destination: { x: Math.random() * 800, y: Math.random() * 600 },
            waypoints: Array.from({ length: 5 }, () => ({
                x: Math.random() * 800,
                y: Math.random() * 600,
                action: ['click', 'encrypt', 'debug', 'roll', 'build'][Math.floor(Math.random() * 5)]
            }))
        };
    }
    
    createTuringTest(req, res) {
        const { challenge, response } = req.body;
        
        const testId = crypto.randomBytes(8).toString('hex');
        const turingTest = {
            id: testId,
            challenge,
            response,
            timestamp: Date.now(),
            result: this.evaluateTuringResponse(challenge, response),
            humanProbability: Math.random()
        };
        
        this.wormholeState.turingTests.set(testId, turingTest);
        
        // If it looks human, feed it to debug game
        if (turingTest.humanProbability > 0.7) {
            this.feedToDebugGame({
                type: 'turing_human',
                data: turingTest
            });
        }
        
        res.json({
            success: true,
            testId,
            result: turingTest.result,
            humanProbability: turingTest.humanProbability,
            message: 'Turing test wormholed!'
        });
    }
    
    evaluateTuringResponse(challenge, response) {
        // Simple Turing test evaluation
        const keywords = ['human', 'think', 'feel', 'understand', 'consciousness'];
        const responseWords = response.toLowerCase().split(' ');
        const humanScore = keywords.filter(k => responseWords.includes(k)).length;
        
        return humanScore > 2 ? 'likely_human' : 'likely_bot';
    }
    
    startSelfPlayLoop() {
        if (!this.selfPlay.enabled) return;
        
        setInterval(() => {
            if (!this.selfPlay.enabled) return;
            
            // Simulate clicks on our own system
            this.simulateClick();
            
        }, this.selfPlay.clickSimulationRate);
        
        setInterval(() => {
            if (!this.selfPlay.enabled) return;
            
            // Generate random UPC codes
            this.generateRandomUPC();
            
        }, this.selfPlay.upcGenerationRate);
        
        setInterval(() => {
            if (!this.selfPlay.enabled) return;
            
            // Create encryption cycles
            this.performEncryptionCycle();
            
        }, this.selfPlay.encryptionCycleRate);
        
        setInterval(() => {
            if (!this.selfPlay.enabled) return;
            
            // Feed debug game with wormhole data
            this.feedDebugGameWithWormholeData();
            
        }, this.selfPlay.debugFeedRate);
    }
    
    simulateClick() {
        const pattern = this.clickPatterns[Math.floor(Math.random() * this.clickPatterns.length)];
        
        // Add some randomness
        const click = {
            x: pattern.x + Math.floor(Math.random() * 50) - 25,
            y: pattern.y + Math.floor(Math.random() * 50) - 25,
            action: pattern.action + '_auto',
            timestamp: Date.now(),
            source: 'self_play'
        };
        
        // Track this simulated click
        const clickId = crypto.randomBytes(8).toString('hex');
        this.wormholeState.clickTracker.set(clickId, click);
        
        // Generate UPC and encrypt
        const upcCode = this.generateUPCForClick({ ...click, id: clickId });
        const encrypted = this.encryptClickData({ ...click, id: clickId });
        
        console.log(`🌀 Self-play click: ${click.action} at (${click.x}, ${click.y}) UPC: ${upcCode.slice(0, 8)}...`);
        
        // Broadcast to connected clients
        this.broadcastWormholeUpdate({
            type: 'self_play_click',
            click,
            upcCode,
            encrypted: encrypted.slice(0, 20) + '...'
        });
    }
    
    generateRandomUPC() {
        const randomData = crypto.randomBytes(16).toString('hex');
        const upcDigits = randomData.slice(0, 11);
        const checkDigit = this.calculateUPCCheckDigit(upcDigits);
        const fullUPC = upcDigits + checkDigit;
        
        this.wormholeState.upcCodes.set(`random_${Date.now()}`, fullUPC);
        
        console.log(`🏷️ Generated UPC: ${fullUPC}`);
        
        return fullUPC;
    }
    
    performEncryptionCycle() {
        // Encrypt random data
        const data = {
            cycle: Date.now(),
            randomData: crypto.randomBytes(32).toString('hex'),
            systemState: 'operational',
            wormholeStatus: 'active'
        };
        
        const encrypted = this.encryptClickData({ id: `cycle_${Date.now()}`, ...data });
        
        console.log(`🔐 Encryption cycle: ${encrypted.slice(0, 20)}...`);
    }
    
    feedDebugGameWithWormholeData() {
        const wormholeSnapshot = this.getWormholeSnapshot();
        
        // Create debug game content from wormhole data
        this.feedToDebugGame({
            type: 'wormhole_data',
            data: {
                totalClicks: wormholeSnapshot.clickCount,
                upcCodes: wormholeSnapshot.upcCount,
                encryptionCycles: wormholeSnapshot.encryptionCount,
                nginxLayers: wormholeSnapshot.nginxLayerCount
            }
        });
    }
    
    feedToDebugGame(content) {
        // Send to debug game system
        const http = require('http');
        
        const postData = JSON.stringify({
            type: 'wormhole_spawn_bug',
            bugType: this.wormholeDataToBugType(content),
            context: content
        });
        
        const options = {
            hostname: 'localhost',
            port: 8500,
            path: '/api/bugs/spawn-wormhole',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            // Handle response if needed
        });
        
        req.on('error', (err) => {
            // Ignore errors for now
        });
        
        req.write(postData);
        req.end();
    }
    
    wormholeDataToBugType(content) {
        switch (content.type) {
            case 'user_click':
                return 'css_broken'; // Clicks might indicate UI issues
            case 'turing_human':
                return 'infinite_loop'; // Humans create loops
            case 'wormhole_data':
                return 'memory_leak'; // Data accumulation
            default:
                return 'null_pointer';
        }
    }
    
    getWormholeSnapshot() {
        return {
            clickCount: this.wormholeState.clickTracker.size,
            upcCount: this.wormholeState.upcCodes.size,
            encryptionCount: this.wormholeState.pgpKeys.size,
            nginxLayerCount: this.wormholeState.nginxLayers.size,
            tritonSessionCount: this.wormholeState.tritonSessions.size,
            turingTestCount: this.wormholeState.turingTests.size,
            dollarClicks: this.wormholeState.dollarClicks,
            selfPlayActive: this.selfPlay.enabled
        };
    }
    
    startWormholeGeneration() {
        // One dollar website simulator
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance
                this.wormholeState.dollarClicks++;
                console.log(`💲 One dollar click! Total: ${this.wormholeState.dollarClicks}`);
                
                this.feedToDebugGame({
                    type: 'dollar_click',
                    data: { total: this.wormholeState.dollarClicks }
                });
            }
        }, 10000); // Every 10 seconds
    }
    
    processWormholeMessage(data, ws) {
        switch (data.type) {
            case 'click_request':
                this.simulateClick();
                break;
                
            case 'generate_upc':
                const upc = this.generateRandomUPC();
                ws.send(JSON.stringify({ type: 'upc_generated', upc }));
                break;
                
            case 'encrypt_data':
                const encrypted = this.encryptClickData(data.data);
                ws.send(JSON.stringify({ type: 'data_encrypted', encrypted }));
                break;
        }
    }
    
    broadcastWormholeUpdate(message) {
        const data = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    generateUPC(req, res) {
        const upc = this.generateRandomUPC();
        res.json({ success: true, upc });
    }
    
    generateQR(req, res) {
        const { data } = req.body;
        const qrId = crypto.randomBytes(8).toString('hex');
        // In a real implementation, you'd generate actual QR codes
        res.json({ success: true, qrId, qrData: `QR:${qrId}:${data}` });
    }
    
    encryptPGP(req, res) {
        const { data } = req.body;
        const encrypted = this.encryptClickData({ id: Date.now(), data });
        res.json({ success: true, encrypted });
    }
    
    getPublicKeys(req, res) {
        const keys = Array.from(this.wormholeState.pgpKeys.entries()).map(([id, key]) => ({
            id,
            publicKey: key.key.slice(0, 32) + '...'
        }));
        res.json(keys);
    }
    
    getDebugFeed(req, res) {
        const feed = {
            totalEvents: this.wormholeState.clickTracker.size + this.wormholeState.upcCodes.size,
            recentClicks: Array.from(this.wormholeState.clickTracker.values()).slice(-10),
            recentUPCs: Array.from(this.wormholeState.upcCodes.values()).slice(-5),
            selfPlayActive: this.selfPlay.enabled
        };
        res.json(feed);
    }
    
    generateWormholeInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌀 Self-Playing Wormhole System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: #000;
            color: #00ff00;
            overflow: hidden;
        }
        
        .wormhole-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at center, #001122 0%, #000000 100%);
        }
        
        .wormhole-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: radial-gradient(circle, #00ff00 0%, #003300 70%, #000000 100%);
            animation: pulse 2s infinite, rotate 10s linear infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            box-shadow: 0 0 100px #00ff00;
        }
        
        @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        
        @keyframes rotate {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .click-tracker {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 255, 0, 0.1);
            padding: 20px;
            border: 1px solid #00ff00;
            border-radius: 10px;
            min-width: 300px;
        }
        
        .upc-generator {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 0, 0.1);
            padding: 20px;
            border: 1px solid #ffff00;
            border-radius: 10px;
            min-width: 300px;
            color: #ffff00;
        }
        
        .encryption-panel {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(255, 0, 255, 0.1);
            padding: 20px;
            border: 1px solid #ff00ff;
            border-radius: 10px;
            min-width: 300px;
            color: #ff00ff;
        }
        
        .triton-panel {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 255, 255, 0.1);
            padding: 20px;
            border: 1px solid #00ffff;
            border-radius: 10px;
            min-width: 300px;
            color: #00ffff;
        }
        
        .stats-display {
            font-size: 0.9rem;
            margin: 5px 0;
        }
        
        .btn {
            background: transparent;
            border: 1px solid currentColor;
            color: inherit;
            padding: 10px 15px;
            margin: 5px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            border-radius: 5px;
            transition: all 0.3s;
        }
        
        .btn:hover {
            background: currentColor;
            color: #000;
        }
        
        .floating-clicks {
            position: absolute;
            pointer-events: none;
        }
        
        .click-dot {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #00ff00;
            border-radius: 50%;
            animation: clickFloat 3s linear;
            box-shadow: 0 0 20px #00ff00;
        }
        
        @keyframes clickFloat {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(3) translateY(-100px);
            }
        }
        
        .matrix-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            opacity: 0.1;
        }
        
        .wormhole-title {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1rem;
            text-align: center;
            z-index: 10;
        }
        
        .spiral-data {
            position: absolute;
            font-size: 0.8rem;
            opacity: 0.7;
            animation: spiral 20s linear infinite;
        }
        
        @keyframes spiral {
            from {
                transform: rotate(0deg) translateX(150px) rotate(0deg);
            }
            to {
                transform: rotate(360deg) translateX(150px) rotate(-360deg);
            }
        }
    </style>
</head>
<body>
    <div class="wormhole-container">
        <canvas class="matrix-bg" id="matrixCanvas"></canvas>
        
        <div class="wormhole-center">
            <div class="wormhole-title">
                🌀<br>SELF<br>PLAY
            </div>
        </div>
        
        <div class="spiral-data" style="top: 50%; left: 50%;" id="spiralData"></div>
        
        <div class="click-tracker">
            <h3>🖱️ CLICK TRACKER</h3>
            <div class="stats-display">Total Clicks: <span id="clickCount">0</span></div>
            <div class="stats-display">Self-Play: <span id="selfPlayStatus">ACTIVE</span></div>
            <div class="stats-display">Last Click: <span id="lastClick">None</span></div>
            <button class="btn" onclick="simulateClick()">Simulate Click</button>
            <button class="btn" onclick="toggleSelfPlay()">Toggle Auto</button>
        </div>
        
        <div class="upc-generator">
            <h3>🏷️ UPC GENERATOR</h3>
            <div class="stats-display">UPC Codes: <span id="upcCount">0</span></div>
            <div class="stats-display">Last UPC: <span id="lastUPC">None</span></div>
            <div class="stats-display">Generation Rate: <span id="genRate">5s</span></div>
            <button class="btn" onclick="generateUPC()">Generate UPC</button>
            <button class="btn" onclick="generateQR()">Generate QR</button>
        </div>
        
        <div class="encryption-panel">
            <h3>🔐 PGP ENCRYPTION</h3>
            <div class="stats-display">Keys Generated: <span id="keyCount">0</span></div>
            <div class="stats-display">Encryption Cycles: <span id="cycleCount">0</span></div>
            <div class="stats-display">Security Level: <span id="securityLevel">MAXIMUM</span></div>
            <button class="btn" onclick="encryptData()">Encrypt Data</button>
            <button class="btn" onclick="generateKeys()">Generate Keys</button>
        </div>
        
        <div class="triton-panel">
            <h3>🌊 TRITON/ONE PIECE</h3>
            <div class="stats-display">Active Sessions: <span id="sessionCount">0</span></div>
            <div class="stats-display">Treasures Found: <span id="treasureCount">0</span></div>
            <div class="stats-display">Dollar Clicks: <span id="dollarClicks">0</span></div>
            <button class="btn" onclick="createSession()">New Session</button>
            <button class="btn" onclick="findTreasure()">Find Treasure</button>
        </div>
        
        <div class="floating-clicks" id="floatingClicks"></div>
    </div>
    
    <script>
        let ws = null;
        let wormholeState = {
            clickCount: 0,
            upcCount: 0,
            keyCount: 0,
            sessionCount: 0,
            treasureCount: 0,
            dollarClicks: 0,
            selfPlayActive: true
        };
        
        // Connect to wormhole WebSocket
        function connect() {
            ws = new WebSocket('ws://localhost:9501');
            
            ws.onopen = () => {
                console.log('🌀 Connected to wormhole');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWormholeMessage(data);
            };
            
            ws.onerror = (error) => {
                console.error('Wormhole error:', error);
            };
            
            ws.onclose = () => {
                console.log('Wormhole disconnected, reconnecting...');
                setTimeout(connect, 3000);
            };
        }
        
        function handleWormholeMessage(data) {
            switch (data.type) {
                case 'wormhole_state':
                    updateWormholeState(data.data);
                    break;
                    
                case 'self_play_click':
                    showFloatingClick(data.click);
                    wormholeState.clickCount++;
                    updateDisplay();
                    break;
                    
                case 'upc_generated':
                    wormholeState.upcCount++;
                    document.getElementById('lastUPC').textContent = data.upc.slice(0, 8) + '...';
                    updateDisplay();
                    break;
                    
                case 'data_encrypted':
                    wormholeState.keyCount++;
                    updateDisplay();
                    break;
            }
        }
        
        function updateWormholeState(state) {
            wormholeState = { ...wormholeState, ...state };
            updateDisplay();
        }
        
        function updateDisplay() {
            document.getElementById('clickCount').textContent = wormholeState.clickCount;
            document.getElementById('upcCount').textContent = wormholeState.upcCount;
            document.getElementById('keyCount').textContent = wormholeState.keyCount;
            document.getElementById('sessionCount').textContent = wormholeState.sessionCount;
            document.getElementById('treasureCount').textContent = wormholeState.treasureCount;
            document.getElementById('dollarClicks').textContent = wormholeState.dollarClicks;
            document.getElementById('selfPlayStatus').textContent = wormholeState.selfPlayActive ? 'ACTIVE' : 'INACTIVE';
        }
        
        function showFloatingClick(click) {
            const container = document.getElementById('floatingClicks');
            const dot = document.createElement('div');
            dot.className = 'click-dot';
            dot.style.left = click.x + 'px';
            dot.style.top = click.y + 'px';
            
            container.appendChild(dot);
            
            // Remove after animation
            setTimeout(() => {
                if (dot.parentNode) {
                    dot.parentNode.removeChild(dot);
                }
            }, 3000);
        }
        
        async function simulateClick() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'click_request' }));
            }
        }
        
        async function generateUPC() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'generate_upc' }));
            }
        }
        
        async function generateQR() {
            try {
                const response = await fetch('/api/generate/qr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: 'wormhole_' + Date.now() })
                });
                const result = await response.json();
                console.log('QR Generated:', result.qrData);
            } catch (error) {
                console.error('QR generation failed:', error);
            }
        }
        
        async function encryptData() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'encrypt_data',
                    data: { timestamp: Date.now(), wormhole: 'active' }
                }));
            }
        }
        
        async function generateKeys() {
            try {
                const response = await fetch('/api/encrypt/pgp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: 'key_generation_' + Date.now() })
                });
                const result = await response.json();
                wormholeState.keyCount++;
                updateDisplay();
            } catch (error) {
                console.error('Key generation failed:', error);
            }
        }
        
        async function createSession() {
            try {
                const response = await fetch('/api/triton/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'wormhole_user_' + Date.now() })
                });
                const result = await response.json();
                wormholeState.sessionCount++;
                updateDisplay();
            } catch (error) {
                console.error('Session creation failed:', error);
            }
        }
        
        function findTreasure() {
            wormholeState.treasureCount++;
            wormholeState.dollarClicks++;
            updateDisplay();
            
            // Simulate treasure finding
            showFloatingClick({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight
            });
        }
        
        async function toggleSelfPlay() {
            try {
                const endpoint = wormholeState.selfPlayActive ? '/api/selfplay/stop' : '/api/selfplay/start';
                const response = await fetch(endpoint, { method: 'POST' });
                const result = await response.json();
                wormholeState.selfPlayActive = !wormholeState.selfPlayActive;
                updateDisplay();
            } catch (error) {
                console.error('Self-play toggle failed:', error);
            }
        }
        
        // Matrix background
        function initMatrix() {
            const canvas = document.getElementById('matrixCanvas');
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const matrix = "WORMHOLE0123456789ABCDEF";
            const matrixArray = matrix.split("");
            const fontSize = 10;
            const columns = canvas.width / fontSize;
            const drops = [];
            
            for (let x = 0; x < columns; x++) {
                drops[x] = 1;
            }
            
            function draw() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#00ff00';
                ctx.font = fontSize + 'px monospace';
                
                for (let i = 0; i < drops.length; i++) {
                    const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    
                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            }
            
            setInterval(draw, 35);
        }
        
        // Spiral data animation
        function updateSpiralData() {
            const spiral = document.getElementById('spiralData');
            const data = [
                'UPC:' + (Math.random() * 1000000000000).toFixed(0),
                'ENC:' + Math.random().toString(36).substring(7),
                'CLK:' + wormholeState.clickCount,
                'TRI:' + wormholeState.sessionCount,
                'DOL:$' + wormholeState.dollarClicks
            ];
            
            spiral.innerHTML = data.join('<br>');
        }
        
        // Track real mouse clicks
        document.addEventListener('click', async (e) => {
            try {
                await fetch('/api/track/click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        x: e.clientX,
                        y: e.clientY,
                        action: 'real_click',
                        timestamp: Date.now()
                    })
                });
                
                showFloatingClick({ x: e.clientX, y: e.clientY });
                wormholeState.clickCount++;
                updateDisplay();
            } catch (error) {
                console.error('Click tracking failed:', error);
            }
        });
        
        // Initialize
        connect();
        initMatrix();
        updateDisplay();
        setInterval(updateSpiralData, 1000);
        
        // Auto-refresh wormhole state
        setInterval(async () => {
            try {
                const response = await fetch('/api/debug/feed');
                const data = await response.json();
                wormholeState.clickCount = data.totalEvents || wormholeState.clickCount;
                wormholeState.selfPlayActive = data.selfPlayActive;
                updateDisplay();
            } catch (error) {
                // Ignore errors
            }
        }, 5000);
    </script>
</body>
</html>`;
    }
}

// Start the self-playing wormhole system
if (require.main === module) {
    new SelfPlayingWormholeSystem(9500);
}

module.exports = SelfPlayingWormholeSystem;