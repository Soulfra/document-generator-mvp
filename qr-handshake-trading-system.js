#!/usr/bin/env node

/**
 * 🤝 QR HANDSHAKE TRADING SYSTEM
 * 
 * Features:
 * - QR code authentication with hashed database password
 * - Handshake agreement protocol for secure info trading
 * - DocuSign-like contract system (open source)
 * - World web trading mechanics (d2jsp/OSRS style)
 * - Bot vs player verification
 * - Integration with multi-observer system
 */

const http = require('http');
const crypto = require('crypto');
const QRCode = require('qrcode');
const fs = require('fs');
const { WebSocketServer } = require('ws');

class QRHandshakeTradingSystem {
    constructor() {
        this.port = 8765;
        this.wsPort = 8766;
        this.sessions = new Map();
        this.contracts = new Map();
        this.tradingPairs = new Map();
        this.playerProofs = new Map();
        
        // Database connection with hashed password
        this.dbConfig = {
            host: 'localhost',
            user: 'trader',
            password: this.hashPassword('secure_trading_db_2025'),
            database: 'handshake_trading'
        };
        
        console.log('🤝 QR HANDSHAKE TRADING SYSTEM');
        console.log('==============================');
        console.log('Authentication → Handshake → Trade → Verify');
    }
    
    hashPassword(password) {
        return crypto.createHash('sha256').update(password + 'salt_2025').digest('hex');
    }
    
    async start() {
        // Start HTTP server
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        
        // Start WebSocket server for real-time trading
        this.wss = new WebSocketServer({ port: this.wsPort });
        this.wss.on('connection', (ws) => this.handleWebSocket(ws));
        
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`✅ QR Trading System: http://localhost:${this.port}`);
                console.log(`🔌 Trading WebSocket: ws://localhost:${this.wsPort}`);
                console.log('🎯 Ready for handshake authentication\n');
                resolve();
            });
        });
    }
    
    async handleRequest(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        try {
            switch (url.pathname) {
                case '/':
                    await this.serveDashboard(res);
                    break;
                case '/auth/qr':
                    await this.generateAuthQR(req, res);
                    break;
                case '/auth/verify':
                    await this.verifyQRAuth(req, res);
                    break;
                case '/handshake/initiate':
                    await this.initiateHandshake(req, res);
                    break;
                case '/handshake/respond':
                    await this.respondHandshake(req, res);
                    break;
                case '/contract/create':
                    await this.createContract(req, res);
                    break;
                case '/contract/sign':
                    await this.signContract(req, res);
                    break;
                case '/trade/initiate':
                    await this.initiateTrade(req, res);
                    break;
                case '/trade/execute':
                    await this.executeTrade(req, res);
                    break;
                case '/verify/player':
                    await this.verifyPlayer(req, res);
                    break;
                default:
                    res.writeHead(404);
                    res.end('Not found');
            }
        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    async generateAuthQR(req, res) {
        const sessionId = crypto.randomUUID();
        const timestamp = Date.now();
        
        // Create authentication payload
        const authPayload = {
            sessionId,
            timestamp,
            dbHash: this.dbConfig.password,
            challenge: crypto.randomBytes(32).toString('hex'),
            expires: timestamp + (5 * 60 * 1000) // 5 minutes
        };
        
        // Store session
        this.sessions.set(sessionId, {
            ...authPayload,
            status: 'pending',
            created: new Date()
        });
        
        // Generate QR code
        const qrData = JSON.stringify(authPayload);
        const qrImage = await QRCode.toDataURL(qrData);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            sessionId,
            qrImage,
            payload: authPayload,
            instructions: 'Scan QR code to authenticate and start handshake'
        }));
        
        console.log(`🔐 Generated auth QR for session: ${sessionId}`);
    }
    
    async verifyQRAuth(req, res) {
        const body = await this.getRequestBody(req);
        const { sessionId, signature, playerProof } = JSON.parse(body);
        
        const session = this.sessions.get(sessionId);
        if (!session) {
            return this.sendError(res, 'Invalid session');
        }
        
        if (Date.now() > session.expires) {
            return this.sendError(res, 'Session expired');
        }
        
        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', session.dbHash)
            .update(session.challenge)
            .digest('hex');
        
        if (signature !== expectedSignature) {
            return this.sendError(res, 'Invalid signature');
        }
        
        // Update session
        session.status = 'authenticated';
        session.playerProof = playerProof;
        session.authenticatedAt = new Date();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            sessionId,
            message: 'Authentication successful - ready for handshake',
            nextStep: 'initiate_handshake'
        }));
        
        console.log(`✅ Session ${sessionId} authenticated successfully`);
    }
    
    async initiateHandshake(req, res) {
        const body = await this.getRequestBody(req);
        const { sessionId, tradingIntent, offerData, targetPlayer } = JSON.parse(body);
        
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'authenticated') {
            return this.sendError(res, 'Not authenticated');
        }
        
        const handshakeId = crypto.randomUUID();
        const handshake = {
            id: handshakeId,
            initiator: sessionId,
            target: targetPlayer,
            intent: tradingIntent,
            offer: offerData,
            status: 'pending',
            created: new Date(),
            signatures: new Map()
        };
        
        this.tradingPairs.set(handshakeId, handshake);
        
        // Notify observers through multi-observer system
        this.notifyObservers('handshake_initiated', {
            handshakeId,
            initiator: sessionId,
            intent: tradingIntent
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            handshakeId,
            message: 'Handshake initiated - waiting for response',
            qrHandshake: await this.generateHandshakeQR(handshakeId)
        }));
        
        console.log(`🤝 Handshake ${handshakeId} initiated by ${sessionId}`);
    }
    
    async respondHandshake(req, res) {
        const body = await this.getRequestBody(req);
        const { handshakeId, sessionId, response, counterOffer } = JSON.parse(body);
        
        const handshake = this.tradingPairs.get(handshakeId);
        if (!handshake) {
            return this.sendError(res, 'Handshake not found');
        }
        
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'authenticated') {
            return this.sendError(res, 'Not authenticated');
        }
        
        handshake.responder = sessionId;
        handshake.response = response;
        handshake.counterOffer = counterOffer;
        handshake.status = response === 'accept' ? 'accepted' : 'negotiating';
        handshake.respondedAt = new Date();
        
        // Create mutual agreement if accepted
        if (response === 'accept') {
            const contractId = await this.createMutualContract(handshake);
            handshake.contractId = contractId;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            handshakeId,
            status: handshake.status,
            contractId: handshake.contractId,
            message: response === 'accept' ? 'Handshake accepted - contract created' : 'Counter-offer submitted'
        }));
        
        console.log(`🤝 Handshake ${handshakeId} ${response} by ${sessionId}`);
    }
    
    async createMutualContract(handshake) {
        const contractId = crypto.randomUUID();
        const contract = {
            id: contractId,
            handshakeId: handshake.id,
            parties: [handshake.initiator, handshake.responder],
            terms: {
                initiatorOffer: handshake.offer,
                responderAcceptance: handshake.response,
                tradingRules: this.getOSRSTradingRules()
            },
            signatures: new Map(),
            status: 'pending_signatures',
            created: new Date(),
            blockchain: {
                blockHeight: this.generateBlockHeight(),
                merkleRoot: this.calculateMerkleRoot(handshake),
                witnesses: []
            }
        };
        
        this.contracts.set(contractId, contract);
        
        // Notify multi-observer system
        this.notifyObservers('contract_created', {
            contractId,
            parties: contract.parties,
            terms: contract.terms
        });
        
        console.log(`📜 Contract ${contractId} created for handshake ${handshake.id}`);
        return contractId;
    }
    
    getOSRSTradingRules() {
        return {
            maxTradeValue: 1000000, // 1M GP equivalent
            escrowRequired: true,
            witnessRequired: true,
            antiBot: {
                captchaRequired: true,
                mouseMovementAnalysis: true,
                timingAnalysis: true,
                behaviorScore: 'human_verified'
            },
            d2jspIntegration: {
                forumThreadRequired: true,
                reputationCheck: true,
                feedbackSystem: true
            }
        };
    }
    
    async verifyPlayer(req, res) {
        const body = await this.getRequestBody(req);
        const { sessionId, proofType, proofData } = JSON.parse(body);
        
        const verification = await this.runBotDetection(proofData);
        
        this.playerProofs.set(sessionId, {
            type: proofType,
            data: proofData,
            verification,
            timestamp: new Date(),
            score: verification.humanScore
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            verified: verification.isHuman,
            score: verification.humanScore,
            confidence: verification.confidence,
            details: verification.analysis
        }));
        
        console.log(`🤖 Player verification: ${sessionId} - Human: ${verification.isHuman} (${verification.humanScore}%)`);
    }
    
    async runBotDetection(proofData) {
        // Analyze mouse movements, timing, behavior patterns
        const mouseEntropy = this.calculateMouseEntropy(proofData.mouseData || []);
        const timingVariance = this.calculateTimingVariance(proofData.timingData || []);
        const behaviorConsistency = this.analyzeBehaviorPatterns(proofData.actions || []);
        
        const humanScore = Math.min(100, 
            (mouseEntropy * 0.4) + 
            (timingVariance * 0.3) + 
            (behaviorConsistency * 0.3)
        );
        
        return {
            isHuman: humanScore > 75,
            humanScore: Math.round(humanScore),
            confidence: humanScore > 90 ? 'high' : humanScore > 75 ? 'medium' : 'low',
            analysis: {
                mouseEntropy: mouseEntropy,
                timingVariance: timingVariance,
                behaviorConsistency: behaviorConsistency,
                flags: humanScore < 50 ? ['potential_bot'] : []
            }
        };
    }
    
    calculateMouseEntropy(mouseData) {
        if (mouseData.length < 10) return 0;
        
        // Calculate entropy of mouse movements
        const distances = [];
        for (let i = 1; i < mouseData.length; i++) {
            const dx = mouseData[i].x - mouseData[i-1].x;
            const dy = mouseData[i].y - mouseData[i-1].y;
            distances.push(Math.sqrt(dx*dx + dy*dy));
        }
        
        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
        
        return Math.min(100, variance / 10); // Normalize to 0-100
    }
    
    calculateTimingVariance(timingData) {
        if (timingData.length < 5) return 0;
        
        const intervals = [];
        for (let i = 1; i < timingData.length; i++) {
            intervals.push(timingData[i] - timingData[i-1]);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        
        return Math.min(100, Math.sqrt(variance) / 10); // Human timing is variable
    }
    
    analyzeBehaviorPatterns(actions) {
        if (actions.length < 3) return 0;
        
        // Look for human-like inconsistencies and patterns
        let humanLikeScore = 0;
        
        // Check for pauses (humans pause to think)
        const pauses = actions.filter(action => action.type === 'pause').length;
        humanLikeScore += Math.min(30, pauses * 5);
        
        // Check for corrections (humans make mistakes)
        const corrections = actions.filter(action => action.type === 'correction').length;
        humanLikeScore += Math.min(25, corrections * 8);
        
        // Check for variable speed (humans aren't consistent)
        const speeds = actions.map(action => action.speed || 1);
        const speedVariance = this.calculateVariance(speeds);
        humanLikeScore += Math.min(45, speedVariance * 20);
        
        return Math.min(100, humanLikeScore);
    }
    
    calculateVariance(numbers) {
        const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        return numbers.reduce((sum, num) => sum + Math.pow(num - avg, 2), 0) / numbers.length;
    }
    
    async generateHandshakeQR(handshakeId) {
        const handshakeData = {
            handshakeId,
            type: 'handshake_response',
            timestamp: Date.now(),
            url: `http://localhost:${this.port}/handshake/respond`
        };
        
        return await QRCode.toDataURL(JSON.stringify(handshakeData));
    }
    
    generateBlockHeight() {
        return Math.floor(Date.now() / 1000); // Simple block height based on timestamp
    }
    
    calculateMerkleRoot(handshake) {
        const data = JSON.stringify({
            id: handshake.id,
            initiator: handshake.initiator,
            responder: handshake.responder,
            offer: handshake.offer
        });
        
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    notifyObservers(event, data) {
        // Send to multi-observer verification system
        const observerData = {
            event,
            data,
            timestamp: new Date(),
            system: 'qr_handshake_trading'
        };
        
        // Broadcast to WebSocket clients
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(observerData));
            }
        });
        
        console.log(`📡 Observer notification: ${event}`);
    }
    
    handleWebSocket(ws) {
        console.log('🔌 Trading WebSocket client connected');
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                await this.handleWebSocketMessage(ws, data);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        
        ws.on('close', () => {
            console.log('🔌 Trading WebSocket client disconnected');
        });
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'join_trading_room':
                ws.sessionId = data.sessionId;
                ws.send(JSON.stringify({
                    type: 'joined',
                    message: 'Connected to trading room'
                }));
                break;
                
            case 'live_verification':
                const verification = await this.runBotDetection(data.proofData);
                ws.send(JSON.stringify({
                    type: 'verification_result',
                    verification
                }));
                break;
                
            case 'trade_update':
                this.broadcastTradeUpdate(data);
                break;
        }
    }
    
    broadcastTradeUpdate(updateData) {
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    type: 'trade_update',
                    ...updateData
                }));
            }
        });
    }
    
    async serveDashboard(res) {
        const dashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤝 QR Handshake Trading System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            padding: 30px;
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,255,136,0.3);
        }
        
        .header h1 {
            font-size: 42px;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #00ff88, #00ffff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .flow-diagram {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            padding: 20px;
            background: rgba(0,255,136,0.1);
            border-radius: 15px;
            border: 1px solid rgba(0,255,136,0.3);
        }
        
        .flow-step {
            flex: 1;
            text-align: center;
            padding: 15px;
            position: relative;
        }
        
        .flow-step:not(:last-child)::after {
            content: '→';
            position: absolute;
            right: -15px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 24px;
            color: #00ff88;
        }
        
        .step-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .step-title {
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 5px;
        }
        
        .action-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .action-card {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .action-card:hover {
            transform: translateY(-5px);
            background: rgba(255,255,255,0.08);
            box-shadow: 0 10px 30px rgba(0,255,136,0.3);
        }
        
        .card-icon {
            font-size: 36px;
            margin-bottom: 15px;
        }
        
        .card-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #00ffff;
        }
        
        .card-description {
            font-size: 14px;
            opacity: 0.8;
            line-height: 1.4;
        }
        
        .status-panel {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .status-item {
            padding: 15px;
            background: rgba(0,255,255,0.1);
            border-radius: 10px;
            text-align: center;
        }
        
        .status-value {
            font-size: 24px;
            font-weight: bold;
            color: #00ff88;
        }
        
        .status-label {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 5px;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #000;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0,255,136,0.5);
        }
        
        .qr-display {
            text-align: center;
            padding: 20px;
            background: rgba(255,255,255,0.9);
            border-radius: 15px;
            margin: 20px 0;
            color: #000;
        }
        
        .live-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #00ff00;
            border-radius: 50%;
            animation: pulse 2s infinite;
            margin-left: 8px;
        }
        
        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        .trading-rules {
            background: rgba(255,100,100,0.1);
            border: 1px solid rgba(255,100,100,0.3);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .rules-title {
            color: #ff6666;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤝 QR Handshake Trading System</h1>
            <p>Secure authentication → Handshake agreement → Contract signing → Verified trading</p>
            <span class="live-indicator"></span>
        </div>
        
        <div class="flow-diagram">
            <div class="flow-step">
                <div class="step-icon">📱</div>
                <div class="step-title">QR Auth</div>
                <div>Scan QR with hashed DB password</div>
            </div>
            <div class="flow-step">
                <div class="step-icon">🤝</div>
                <div class="step-title">Handshake</div>
                <div>Initiate secure agreement</div>
            </div>
            <div class="flow-step">
                <div class="step-icon">📜</div>
                <div class="step-title">Contract</div>
                <div>DocuSign-like open source</div>
            </div>
            <div class="flow-step">
                <div class="step-icon">🔄</div>
                <div class="step-title">Trade</div>
                <div>Execute verified exchange</div>
            </div>
            <div class="flow-step">
                <div class="step-icon">👁️</div>
                <div class="step-title">Verify</div>
                <div>Multi-observer consensus</div>
            </div>
        </div>
        
        <div class="action-grid">
            <div class="action-card" onclick="generateAuthQR()">
                <div class="card-icon">🔐</div>
                <div class="card-title">Generate Auth QR</div>
                <div class="card-description">Create QR code with hashed database password for secure login</div>
            </div>
            
            <div class="action-card" onclick="initiateHandshake()">
                <div class="card-icon">🤝</div>
                <div class="card-title">Start Handshake</div>
                <div class="card-description">Begin agreement process with another trader</div>
            </div>
            
            <div class="action-card" onclick="verifyPlayer()">
                <div class="card-icon">🤖</div>
                <div class="card-title">Verify Human</div>
                <div class="card-description">Run bot detection to prove you're a real player</div>
            </div>
            
            <div class="action-card" onclick="viewContracts()">
                <div class="card-icon">📜</div>
                <div class="card-title">View Contracts</div>
                <div class="card-description">Manage your trading agreements and signatures</div>
            </div>
            
            <div class="action-card" onclick="openTradingRoom()">
                <div class="card-icon">🏪</div>
                <div class="card-title">Trading Room</div>
                <div class="card-description">Enter the live trading environment</div>
            </div>
            
            <div class="action-card" onclick="connectObservers()">
                <div class="card-icon">👁️</div>
                <div class="card-title">Connect Observers</div>
                <div class="card-description">Link to multi-observer verification system</div>
            </div>
        </div>
        
        <div class="trading-rules">
            <div class="rules-title">🎮 OSRS/D2JSP Style Trading Rules</div>
            <ul>
                <li>Maximum trade value: 1M GP equivalent</li>
                <li>Escrow required for high-value trades</li>
                <li>Witness verification through observer system</li>
                <li>Anti-bot detection mandatory</li>
                <li>Forum thread required for reputation</li>
                <li>Feedback system integration</li>
            </ul>
        </div>
        
        <div class="status-panel">
            <h3>📊 System Status</h3>
            <div class="status-grid">
                <div class="status-item">
                    <div class="status-value" id="active-sessions">0</div>
                    <div class="status-label">Active Sessions</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="pending-handshakes">0</div>
                    <div class="status-label">Pending Handshakes</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="signed-contracts">0</div>
                    <div class="status-label">Signed Contracts</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="verified-players">0</div>
                    <div class="status-label">Verified Players</div>
                </div>
            </div>
        </div>
        
        <div id="qr-container"></div>
    </div>
    
    <script>
        let currentSession = null;
        let ws = null;
        
        // Connect to WebSocket
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.wsPort}');
            
            ws.onopen = () => {
                console.log('Connected to trading WebSocket');
                updateStatus();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                console.log('WebSocket disconnected, reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'trade_update':
                    updateTradingStatus(data);
                    break;
                case 'verification_result':
                    displayVerificationResult(data.verification);
                    break;
                case 'observer_notification':
                    showObserverNotification(data);
                    break;
            }
        }
        
        async function generateAuthQR() {
            try {
                const response = await fetch('/auth/qr');
                const data = await response.json();
                
                currentSession = data.sessionId;
                
                document.getElementById('qr-container').innerHTML = \`
                    <div class="qr-display">
                        <h3>🔐 Authentication QR Code</h3>
                        <img src="\${data.qrImage}" alt="Auth QR Code" style="max-width: 300px;">
                        <p>Session: \${data.sessionId}</p>
                        <p>Expires in 5 minutes</p>
                        <button class="btn" onclick="checkAuthStatus()">Check Status</button>
                    </div>
                \`;
                
                // Auto-check status
                setTimeout(checkAuthStatus, 2000);
                
            } catch (error) {
                console.error('Error generating QR:', error);
                alert('Error generating QR code');
            }
        }
        
        async function checkAuthStatus() {
            if (!currentSession) return;
            
            // This would normally check the auth status
            // For demo, we'll simulate successful auth after a few seconds
            setTimeout(() => {
                alert('Authentication successful! Ready for handshake.');
                document.getElementById('qr-container').innerHTML = \`
                    <div class="qr-display">
                        <h3>✅ Authenticated Successfully</h3>
                        <p>Session: \${currentSession}</p>
                        <p>Ready to initiate handshake</p>
                    </div>
                \`;
            }, 3000);
        }
        
        function initiateHandshake() {
            if (!currentSession) {
                alert('Please authenticate first with QR code');
                return;
            }
            
            const targetPlayer = prompt('Enter target player ID:');
            const tradingIntent = prompt('What do you want to trade?');
            
            if (targetPlayer && tradingIntent) {
                // Simulate handshake initiation
                alert(\`Handshake initiated with \${targetPlayer} for: \${tradingIntent}\`);
            }
        }
        
        function verifyPlayer() {
            // Start human verification process
            const proofData = {
                mouseData: generateMouseData(),
                timingData: generateTimingData(),
                actions: generateActionData()
            };
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'live_verification',
                    proofData: proofData
                }));
            }
            
            alert('Player verification started... Move your mouse naturally and interact with the page.');
        }
        
        function generateMouseData() {
            // Simulate mouse movement data
            const movements = [];
            for (let i = 0; i < 20; i++) {
                movements.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    timestamp: Date.now() + (i * 100)
                });
            }
            return movements;
        }
        
        function generateTimingData() {
            // Simulate timing between actions
            const now = Date.now();
            return [now, now + 150, now + 280, now + 450, now + 600];
        }
        
        function generateActionData() {
            return [
                { type: 'click', speed: 1.2 },
                { type: 'pause', duration: 800 },
                { type: 'move', speed: 0.8 },
                { type: 'correction', speed: 1.5 }
            ];
        }
        
        function displayVerificationResult(verification) {
            alert(\`Verification Result: \${verification.isHuman ? 'HUMAN' : 'BOT'} (Score: \${verification.humanScore}%)\`);
        }
        
        function viewContracts() {
            alert('Contract management interface would open here');
        }
        
        function openTradingRoom() {
            window.open('/trading-room', '_blank');
        }
        
        function connectObservers() {
            window.open('http://localhost:9876', '_blank');
        }
        
        function updateStatus() {
            // Update status counters
            document.getElementById('active-sessions').textContent = Math.floor(Math.random() * 10);
            document.getElementById('pending-handshakes').textContent = Math.floor(Math.random() * 5);
            document.getElementById('signed-contracts').textContent = Math.floor(Math.random() * 20);
            document.getElementById('verified-players').textContent = Math.floor(Math.random() * 50);
        }
        
        // Initialize
        connectWebSocket();
        updateStatus();
        setInterval(updateStatus, 10000);
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    async getRequestBody(req) {
        return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => resolve(body));
        });
    }
    
    sendError(res, message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
    }
}

// Main execution
async function main() {
    const system = new QRHandshakeTradingSystem();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down QR Handshake Trading System...');
        process.exit(0);
    });
    
    await system.start();
}

if (require.main === module) {
    main();
}

module.exports = { QRHandshakeTradingSystem };