#!/usr/bin/env node

/**
 * CHARACTER QR AUTHENTICATION SYSTEM
 * Handles QR code generation, scanning, and authentication flow
 * Enables quick login via QR scan from mobile devices
 */

const QRCode = require('qrcode');
const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class CharacterQRAuth {
    constructor() {
        this.app = express();
        this.port = 42002;
        this.wsPort = 42003;
        
        // Active QR sessions
        this.qrSessions = new Map();
        this.wsConnections = new Map();
        
        // Configuration
        this.config = {
            qrExpiry: 300000, // 5 minutes
            sessionExpiry: 86400000, // 24 hours
            qrRefreshInterval: 30000, // 30 seconds
            
            jwtSecret: process.env.JWT_SECRET || 'character-qr-auth-secret',
            baseUrl: process.env.BASE_URL || 'http://localhost:42002',
            apiUrl: process.env.API_URL || 'http://localhost:42001'
        };
        
        console.log('🔐 Character QR Auth System initializing...');
        this.initialize();
    }
    
    initialize() {
        // Setup middleware
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Setup routes
        this.setupRoutes();
        
        // Start HTTP server
        this.server = this.app.listen(this.port, () => {
            console.log(`🔐 QR Auth Server running on http://localhost:${this.port}`);
        });
        
        // Start WebSocket server for real-time updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.setupWebSocket();
        
        // Cleanup expired sessions periodically
        setInterval(() => this.cleanupExpiredSessions(), 60000);
        
        console.log(`🔌 WebSocket server on ws://localhost:${this.wsPort}`);
    }
    
    setupRoutes() {
        // Generate QR code for login
        this.app.get('/api/qr/generate', this.generateLoginQR.bind(this));
        
        // Mobile scanning endpoint
        this.app.post('/api/qr/scan', this.handleQRScan.bind(this));
        
        // Check QR session status
        this.app.get('/api/qr/session/:sessionId', this.checkSession.bind(this));
        
        // Serve QR display page
        this.app.get('/qr-login', this.serveQRLoginPage.bind(this));
        
        // Mobile scanner page
        this.app.get('/mobile-scanner', this.serveMobileScannerPage.bind(this));
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const connectionId = uuidv4();
            console.log(`🔌 WebSocket connected: ${connectionId}`);
            
            this.wsConnections.set(connectionId, {
                ws,
                sessionId: null,
                authenticated: false
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(connectionId, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 WebSocket disconnected: ${connectionId}`);
                this.wsConnections.delete(connectionId);
            });
            
            // Send initial connection confirmation
            ws.send(JSON.stringify({
                type: 'connected',
                connectionId
            }));
        });
    }
    
    handleWebSocketMessage(connectionId, data) {
        const connection = this.wsConnections.get(connectionId);
        if (!connection) return;
        
        switch (data.type) {
            case 'subscribe':
                // Subscribe to QR session updates
                if (data.sessionId && this.qrSessions.has(data.sessionId)) {
                    connection.sessionId = data.sessionId;
                    connection.ws.send(JSON.stringify({
                        type: 'subscribed',
                        sessionId: data.sessionId
                    }));
                }
                break;
                
            case 'ping':
                connection.ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    }
    
    async generateLoginQR(req, res) {
        try {
            // Create new QR session
            const sessionId = uuidv4();
            const timestamp = Date.now();
            
            const session = {
                id: sessionId,
                status: 'pending',
                createdAt: timestamp,
                expiresAt: timestamp + this.config.qrExpiry,
                challenge: crypto.randomBytes(32).toString('hex'),
                characterData: null,
                authToken: null
            };
            
            this.qrSessions.set(sessionId, session);
            
            // Generate QR data
            const qrData = {
                v: '1.0',
                type: 'character_login',
                sessionId,
                challenge: session.challenge,
                endpoint: `${this.config.baseUrl}/api/qr/scan`,
                expires: session.expiresAt
            };
            
            const qrDataString = JSON.stringify(qrData);
            
            // Generate QR code image
            const qrCode = await QRCode.toDataURL(qrDataString, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 512
            });
            
            // Also generate a shorter URL-based QR for easier scanning
            const shortUrl = `${this.config.baseUrl}/q/${sessionId}`;
            const shortQR = await QRCode.toDataURL(shortUrl, {
                errorCorrectionLevel: 'L',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                width: 256
            });
            
            res.json({
                sessionId,
                qrCode,
                shortQR,
                shortUrl,
                expiresAt: session.expiresAt,
                expiresIn: this.config.qrExpiry / 1000 // seconds
            });
            
        } catch (error) {
            console.error('QR generation error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleQRScan(req, res) {
        try {
            const { sessionId, challenge, characterToken } = req.body;
            
            // Validate session
            const session = this.qrSessions.get(sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            if (Date.now() > session.expiresAt) {
                return res.status(410).json({ error: 'QR code expired' });
            }
            
            if (session.status !== 'pending') {
                return res.status(409).json({ error: 'Session already processed' });
            }
            
            // Verify challenge
            if (challenge !== session.challenge) {
                return res.status(401).json({ error: 'Invalid challenge' });
            }
            
            // Verify character token (from user's saved login)
            if (!characterToken) {
                return res.status(401).json({ error: 'No character token provided' });
            }
            
            try {
                // Decode and verify the character token
                const decoded = jwt.verify(characterToken, this.config.jwtSecret);
                
                // Update session with character data
                session.status = 'authenticated';
                session.characterData = {
                    characterId: decoded.characterId,
                    characterName: decoded.characterName,
                    lineage: decoded.lineage
                };
                session.authToken = characterToken;
                session.authenticatedAt = Date.now();
                
                // Notify all WebSocket connections watching this session
                this.notifySessionUpdate(sessionId, {
                    status: 'authenticated',
                    character: session.characterData
                });
                
                res.json({
                    success: true,
                    message: 'Authentication successful',
                    character: session.characterData
                });
                
            } catch (error) {
                console.error('Token verification error:', error);
                res.status(401).json({ error: 'Invalid character token' });
            }
            
        } catch (error) {
            console.error('QR scan error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async checkSession(req, res) {
        const { sessionId } = req.params;
        
        const session = this.qrSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        if (Date.now() > session.expiresAt && session.status === 'pending') {
            session.status = 'expired';
        }
        
        const response = {
            status: session.status,
            expiresAt: session.expiresAt,
            expiresIn: Math.max(0, session.expiresAt - Date.now()) / 1000
        };
        
        if (session.status === 'authenticated') {
            response.character = session.characterData;
            response.authToken = session.authToken;
            
            // Clean up session after successful auth
            this.qrSessions.delete(sessionId);
        }
        
        res.json(response);
    }
    
    notifySessionUpdate(sessionId, update) {
        // Notify all WebSocket connections subscribed to this session
        this.wsConnections.forEach((connection) => {
            if (connection.sessionId === sessionId && connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(JSON.stringify({
                    type: 'session_update',
                    sessionId,
                    ...update
                }));
            }
        });
    }
    
    cleanupExpiredSessions() {
        const now = Date.now();
        let cleaned = 0;
        
        this.qrSessions.forEach((session, sessionId) => {
            if (now > session.expiresAt && session.status === 'pending') {
                this.qrSessions.delete(sessionId);
                cleaned++;
                
                // Notify subscribers
                this.notifySessionUpdate(sessionId, {
                    status: 'expired'
                });
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired QR sessions`);
        }
    }
    
    serveQRLoginPage(req, res) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Character QR Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        
        h1 {
            font-size: 28px;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #00ff88, #00bbff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 30px;
        }
        
        .qr-container {
            background: white;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            position: relative;
            overflow: hidden;
        }
        
        .qr-container.expired {
            opacity: 0.5;
        }
        
        #qrCode {
            max-width: 100%;
            height: auto;
        }
        
        .status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 10px;
            font-weight: 500;
        }
        
        .status.pending {
            background: rgba(255, 187, 0, 0.2);
            color: #ffbb00;
        }
        
        .status.authenticated {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
        }
        
        .status.expired {
            background: rgba(255, 68, 68, 0.2);
            color: #ff4444;
        }
        
        .character-info {
            margin-top: 20px;
            padding: 20px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 10px;
        }
        
        .character-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .character-lineage {
            color: rgba(255, 255, 255, 0.7);
        }
        
        button {
            background: linear-gradient(135deg, #00ff88, #00bbff);
            border: none;
            color: #0f0f23;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.5);
        }
        
        .countdown {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 10px;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #00ff88;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .instructions {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .instructions h3 {
            color: #00ff88;
            margin-bottom: 15px;
        }
        
        .instructions ol {
            text-align: left;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Character QR Login</h1>
        <p class="subtitle">Scan with your mobile device to login</p>
        
        <div class="qr-container" id="qrContainer">
            <img id="qrCode" src="" alt="QR Code" />
        </div>
        
        <div id="status" class="status pending">
            <span class="loading"></span> Waiting for scan...
        </div>
        
        <div id="countdown" class="countdown"></div>
        
        <div id="characterInfo" style="display: none;" class="character-info">
            <div class="character-name" id="characterName"></div>
            <div class="character-lineage" id="characterLineage"></div>
        </div>
        
        <button id="refreshBtn" onclick="generateNewQR()">Generate New QR</button>
        
        <div class="instructions">
            <h3>How to Login</h3>
            <ol>
                <li>Open the character app on your mobile device</li>
                <li>Tap the QR scanner icon</li>
                <li>Point your camera at the QR code above</li>
                <li>Confirm login on your device</li>
            </ol>
        </div>
    </div>
    
    <script>
        let sessionId = null;
        let ws = null;
        let countdownInterval = null;
        let expiresAt = null;
        
        async function generateNewQR() {
            try {
                const response = await fetch('/api/qr/generate');
                const data = await response.json();
                
                sessionId = data.sessionId;
                expiresAt = data.expiresAt;
                
                document.getElementById('qrCode').src = data.qrCode;
                document.getElementById('qrContainer').classList.remove('expired');
                document.getElementById('status').className = 'status pending';
                document.getElementById('status').innerHTML = '<span class="loading"></span> Waiting for scan...';
                document.getElementById('characterInfo').style.display = 'none';
                
                // Connect WebSocket for real-time updates
                connectWebSocket();
                
                // Start countdown
                startCountdown();
                
                // Check status periodically as backup
                checkStatus();
                
            } catch (error) {
                console.error('Error generating QR:', error);
                document.getElementById('status').className = 'status expired';
                document.getElementById('status').textContent = 'Error generating QR code';
            }
        }
        
        function connectWebSocket() {
            if (ws) ws.close();
            
            ws = new WebSocket('ws://localhost:42003');
            
            ws.onopen = () => {
                console.log('WebSocket connected');
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    sessionId: sessionId
                }));
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'session_update' && data.sessionId === sessionId) {
                    handleSessionUpdate(data);
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onclose = () => {
                console.log('WebSocket disconnected');
                // Fallback to polling
                setTimeout(checkStatus, 1000);
            };
        }
        
        function handleSessionUpdate(data) {
            if (data.status === 'authenticated') {
                clearInterval(countdownInterval);
                
                document.getElementById('status').className = 'status authenticated';
                document.getElementById('status').textContent = '✅ Login successful!';
                document.getElementById('qrContainer').classList.add('expired');
                document.getElementById('countdown').textContent = '';
                
                if (data.character) {
                    document.getElementById('characterInfo').style.display = 'block';
                    document.getElementById('characterName').textContent = data.character.characterName;
                    document.getElementById('characterLineage').textContent = data.character.lineage + ' Character';
                    
                    // Store auth token
                    if (data.authToken) {
                        localStorage.setItem('characterToken', data.authToken);
                        
                        // Redirect after 2 seconds
                        setTimeout(() => {
                            window.location.href = '/character-dashboard';
                        }, 2000);
                    }
                }
            } else if (data.status === 'expired') {
                handleExpired();
            }
        }
        
        async function checkStatus() {
            if (!sessionId) return;
            
            try {
                const response = await fetch(\`/api/qr/session/\${sessionId}\`);
                const data = await response.json();
                
                if (data.status === 'authenticated') {
                    handleSessionUpdate({
                        status: 'authenticated',
                        character: data.character,
                        authToken: data.authToken
                    });
                } else if (data.status === 'expired') {
                    handleExpired();
                } else {
                    // Check again in 2 seconds
                    setTimeout(checkStatus, 2000);
                }
            } catch (error) {
                console.error('Status check error:', error);
                setTimeout(checkStatus, 5000);
            }
        }
        
        function startCountdown() {
            clearInterval(countdownInterval);
            
            countdownInterval = setInterval(() => {
                if (!expiresAt) return;
                
                const remaining = Math.max(0, expiresAt - Date.now());
                const seconds = Math.floor(remaining / 1000);
                
                if (seconds > 0) {
                    document.getElementById('countdown').textContent = \`Expires in \${seconds} seconds\`;
                } else {
                    handleExpired();
                }
            }, 1000);
        }
        
        function handleExpired() {
            clearInterval(countdownInterval);
            document.getElementById('qrContainer').classList.add('expired');
            document.getElementById('status').className = 'status expired';
            document.getElementById('status').textContent = 'QR code expired';
            document.getElementById('countdown').textContent = 'Click button to generate new QR';
            
            if (ws) ws.close();
        }
        
        // Generate initial QR on load
        generateNewQR();
    </script>
</body>
</html>`;
        
        res.send(html);
    }
    
    serveMobileScannerPage(req, res) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Character QR Scanner</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f23;
            color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        h1 {
            font-size: 24px;
            background: linear-gradient(90deg, #00ff88, #00bbff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .scanner-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        #reader {
            width: 100%;
            max-width: 400px;
            border-radius: 20px;
            overflow: hidden;
        }
        
        .result {
            padding: 20px;
            text-align: center;
        }
        
        .success {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
            padding: 20px;
            border-radius: 10px;
            margin: 20px;
        }
        
        .error {
            background: rgba(255, 68, 68, 0.2);
            color: #ff4444;
            padding: 20px;
            border-radius: 10px;
            margin: 20px;
        }
        
        button {
            background: linear-gradient(135deg, #00ff88, #00bbff);
            border: none;
            color: #0f0f23;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            max-width: 300px;
            margin: 20px auto;
            display: block;
        }
        
        .instructions {
            text-align: center;
            padding: 20px;
            color: rgba(255, 255, 255, 0.7);
        }
    </style>
    <script src="https://unpkg.com/html5-qrcode"></script>
</head>
<body>
    <div class="header">
        <h1>Character QR Scanner</h1>
    </div>
    
    <div class="scanner-container">
        <div id="reader"></div>
    </div>
    
    <div id="result" class="result"></div>
    
    <div class="instructions">
        <p>Point your camera at the QR code on the login screen</p>
    </div>
    
    <script>
        let html5QrcodeScanner = null;
        
        function onScanSuccess(decodedText, decodedResult) {
            console.log('QR Code detected:', decodedText);
            
            try {
                // Parse QR data
                const qrData = JSON.parse(decodedText);
                
                if (qrData.type === 'character_login') {
                    handleLoginQR(qrData);
                } else {
                    showError('Invalid QR code type');
                }
                
            } catch (error) {
                // Check if it's a short URL
                if (decodedText.includes('/q/')) {
                    window.location.href = decodedText;
                } else {
                    showError('Invalid QR code format');
                }
            }
            
            // Stop scanning
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear();
            }
        }
        
        async function handleLoginQR(qrData) {
            // Get stored character token
            const characterToken = localStorage.getItem('characterToken');
            
            if (!characterToken) {
                showError('No character logged in. Please login first.');
                return;
            }
            
            try {
                const response = await fetch(qrData.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: qrData.sessionId,
                        challenge: qrData.challenge,
                        characterToken: characterToken
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showSuccess(\`Logged in as \${result.character.characterName}!\`);
                } else {
                    showError(result.error || 'Login failed');
                }
                
            } catch (error) {
                showError('Network error: ' + error.message);
            }
        }
        
        function showSuccess(message) {
            document.getElementById('result').innerHTML = \`
                <div class="success">
                    <h2>✅ Success!</h2>
                    <p>\${message}</p>
                    <button onclick="startScanning()">Scan Another</button>
                </div>
            \`;
        }
        
        function showError(message) {
            document.getElementById('result').innerHTML = \`
                <div class="error">
                    <h2>❌ Error</h2>
                    <p>\${message}</p>
                    <button onclick="startScanning()">Try Again</button>
                </div>
            \`;
        }
        
        function startScanning() {
            document.getElementById('result').innerHTML = '';
            
            html5QrcodeScanner = new Html5QrcodeScanner(
                "reader",
                { 
                    fps: 10,
                    qrbox: {width: 250, height: 250},
                    aspectRatio: 1.0
                },
                false
            );
            
            html5QrcodeScanner.render(onScanSuccess);
        }
        
        // Check if we have a character token
        if (!localStorage.getItem('characterToken')) {
            document.getElementById('result').innerHTML = \`
                <div class="error">
                    <h2>No Character Found</h2>
                    <p>Please create or login to a character first</p>
                    <button onclick="window.location.href='/character-registration'">Create Character</button>
                </div>
            \`;
        } else {
            // Start scanning
            startScanning();
        }
    </script>
</body>
</html>`;
        
        res.send(html);
    }
}

// Start the service
const qrAuth = new CharacterQRAuth();

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🔐 QR Auth System shutting down...');
    
    if (qrAuth.server) {
        qrAuth.server.close();
    }
    
    if (qrAuth.wss) {
        qrAuth.wss.close();
    }
    
    process.exit(0);
});

module.exports = CharacterQRAuth;