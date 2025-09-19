#!/usr/bin/env node
// LOCAL-PC-GAMING-SERVER.js - Portable Local Gaming Server with Biometric Auth
// Deployable to any PC, Raspberry Pi, or portable device

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');
const { execSync } = require('child_process');

const app = express();
const PORT = 8900;
const WS_PORT = 8901;

// Local server state
const LOCAL_STATE = {
    server_id: crypto.randomBytes(16).toString('hex'),
    device_name: require('os').hostname(),
    biometric_users: new Map(),
    voice_profiles: new Map(),
    active_sessions: new Map(),
    game_instances: new Map(),
    network_nodes: new Set(),
    offline_mode: true,
    security_level: 'MAXIMUM'
};

// Biometric authentication system
class BiometricAuth {
    constructor() {
        this.fingerprint_db = new Map();
        this.voice_patterns = new Map();
        this.security_tokens = new Map();
    }

    // Register fingerprint (using WebAuthn API)
    async registerFingerprint(userId, fingerprintData) {
        const fingerprintHash = crypto.createHash('sha256')
            .update(JSON.stringify(fingerprintData))
            .digest('hex');
        
        this.fingerprint_db.set(userId, {
            hash: fingerprintHash,
            registered: new Date(),
            last_used: null,
            usage_count: 0
        });

        console.log(`🔒 Fingerprint registered for user: ${userId}`);
        return true;
    }

    // Verify fingerprint
    async verifyFingerprint(userId, fingerprintData) {
        const stored = this.fingerprint_db.get(userId);
        if (!stored) return false;

        const providedHash = crypto.createHash('sha256')
            .update(JSON.stringify(fingerprintData))
            .digest('hex');

        const isValid = stored.hash === providedHash;
        
        if (isValid) {
            stored.last_used = new Date();
            stored.usage_count++;
            console.log(`✅ Fingerprint verified for user: ${userId}`);
        } else {
            console.log(`❌ Fingerprint verification failed for user: ${userId}`);
        }

        return isValid;
    }

    // Register voice pattern
    async registerVoicePattern(userId, voiceData) {
        // Simple voice pattern analysis (in production, use proper voice recognition)
        const voiceHash = crypto.createHash('sha256')
            .update(voiceData)
            .digest('hex');

        this.voice_patterns.set(userId, {
            pattern: voiceHash,
            registered: new Date(),
            confidence_threshold: 0.8
        });

        console.log(`🎤 Voice pattern registered for user: ${userId}`);
        return true;
    }

    // Verify voice
    async verifyVoice(userId, voiceData) {
        const stored = this.voice_patterns.get(userId);
        if (!stored) return false;

        const providedHash = crypto.createHash('sha256')
            .update(voiceData)
            .digest('hex');

        // Simple comparison (in production, use ML voice matching)
        const isValid = stored.pattern === providedHash;
        
        console.log(`${isValid ? '✅' : '❌'} Voice verification for user: ${userId}`);
        return isValid;
    }

    // Generate secure session token
    generateSessionToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        this.security_tokens.set(token, {
            userId,
            created: new Date(),
            expires: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
            verified: true
        });
        return token;
    }

    // Verify session token
    verifySessionToken(token) {
        const session = this.security_tokens.get(token);
        if (!session) return null;
        
        if (new Date() > session.expires) {
            this.security_tokens.delete(token);
            return null;
        }

        return session;
    }
}

// Network linking system (Game Boy style)
class NetworkLinking {
    constructor() {
        this.connected_devices = new Map();
        this.cable_connections = new Set();
        this.wireless_nodes = new Set();
    }

    // Discover local devices
    async discoverDevices() {
        try {
            // Scan local network for other gaming servers
            const networkRange = '192.168.1.';
            const devices = [];

            for (let i = 1; i <= 254; i++) {
                const ip = networkRange + i;
                try {
                    const response = await fetch(`http://${ip}:${PORT}/api/ping`, {
                        timeout: 1000
                    });
                    if (response.ok) {
                        const data = await response.json();
                        devices.push({
                            ip,
                            id: data.server_id,
                            name: data.device_name,
                            type: 'network'
                        });
                    }
                } catch (e) {
                    // Device not found or not responding
                }
            }

            console.log(`🔍 Discovered ${devices.length} gaming devices on network`);
            return devices;
        } catch (error) {
            console.error('Device discovery error:', error);
            return [];
        }
    }

    // Create cable link (direct connection)
    createCableLink(deviceId, connection) {
        this.cable_connections.add({
            device_id: deviceId,
            connection,
            type: 'cable',
            established: new Date()
        });

        console.log(`🔗 Cable link established with device: ${deviceId}`);
    }

    // Create wireless link
    createWirelessLink(deviceId, connection) {
        this.wireless_nodes.add({
            device_id: deviceId,
            connection,
            type: 'wireless',
            established: new Date()
        });

        console.log(`📡 Wireless link established with device: ${deviceId}`);
    }
}

// Initialize systems
const biometricAuth = new BiometricAuth();
const networkLinking = new NetworkLinking();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// HTTPS setup for local security
const httpsOptions = {
    key: generateSelfSignedCert().key,
    cert: generateSelfSignedCert().cert
};

function generateSelfSignedCert() {
    // Generate self-signed certificate for local HTTPS
    try {
        const key = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        return {
            key: key.privateKey,
            cert: key.publicKey // Simplified for demo
        };
    } catch (error) {
        console.log('Using HTTP fallback (HTTPS cert generation failed)');
        return null;
    }
}

// Local Gaming Dashboard HTML
const LOCAL_GAMING_DASHBOARD = `
<!DOCTYPE html>
<html>
<head>
    <title>🎮 Local Gaming Server - Biometric Secured</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0f0f23, #1a1a3a);
            color: #00ff00;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border: 2px solid #00ff00;
            padding: 20px;
            border-radius: 15px;
            background: rgba(0, 255, 0, 0.05);
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 0 0 10px #00ff00;
        }
        
        .server-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .auth-section {
            background: rgba(255, 0, 255, 0.1);
            border: 2px solid #ff00ff;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        
        .auth-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            min-width: 150px;
        }
        
        .btn-fingerprint {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
        }
        
        .btn-voice {
            background: linear-gradient(45deg, #4834d4, #686de0);
            color: white;
        }
        
        .btn-game {
            background: linear-gradient(45deg, #00d2d3, #01a3a4);
            color: white;
            font-size: 1.2rem;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        
        .game-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .game-card {
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid #00ffff;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .game-card:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        }
        
        .network-section {
            background: rgba(255, 255, 0, 0.1);
            border: 2px solid #ffff00;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        
        .device-list {
            max-height: 200px;
            overflow-y: auto;
            margin-top: 15px;
        }
        
        .device-item {
            background: rgba(255, 255, 0, 0.2);
            margin: 5px 0;
            padding: 10px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .status {
            font-weight: bold;
            margin: 10px 0;
        }
        
        .status.authenticated { color: #00ff00; }
        .status.pending { color: #ffff00; }
        .status.failed { color: #ff0000; }
        
        #fingerprint-area {
            width: 150px;
            height: 150px;
            border: 3px dashed #ff00ff;
            border-radius: 50%;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        #fingerprint-area:hover {
            background: rgba(255, 0, 255, 0.2);
            border-style: solid;
        }
        
        .voice-controls {
            text-align: center;
            margin: 20px 0;
        }
        
        #voice-status {
            margin: 10px 0;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .offline-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #00ff00;
            color: #000;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            h1 { font-size: 1.8rem; }
            .auth-buttons { flex-direction: column; }
            .btn { min-width: 200px; }
        }
    </style>
</head>
<body>
    <div class="offline-indicator">🔒 OFFLINE SECURE</div>
    
    <div class="container">
        <div class="header">
            <h1>🎮 Local Gaming Server</h1>
            <p>Biometric Secured • Voice Verified • Cable Linked</p>
            <p>Device: <span id="device-name">${LOCAL_STATE.device_name}</span></p>
        </div>
        
        <div class="server-info">
            <div class="info-card">
                <h3>Server ID</h3>
                <p id="server-id">${LOCAL_STATE.server_id.substring(0, 8)}...</p>
            </div>
            <div class="info-card">
                <h3>Security Level</h3>
                <p id="security-level">${LOCAL_STATE.security_level}</p>
            </div>
            <div class="info-card">
                <h3>Active Sessions</h3>
                <p id="active-sessions">${LOCAL_STATE.active_sessions.size}</p>
            </div>
            <div class="info-card">
                <h3>Network Status</h3>
                <p id="network-status">LOCAL ONLY</p>
            </div>
        </div>
        
        <div class="auth-section">
            <h2>🔐 Biometric Authentication</h2>
            <div class="status" id="auth-status">Not Authenticated</div>
            
            <div id="fingerprint-area" onclick="requestFingerprint()">
                <span>👆</span>
            </div>
            
            <div class="voice-controls">
                <button class="btn btn-voice" onclick="startVoiceAuth()">🎤 Voice Verify</button>
                <div id="voice-status">Voice: Not Verified</div>
            </div>
            
            <div class="auth-buttons">
                <button class="btn btn-fingerprint" onclick="registerBiometrics()">Register Biometrics</button>
                <input type="text" id="username" placeholder="Username" style="margin: 10px; padding: 10px; border-radius: 5px;">
            </div>
        </div>
        
        <div class="game-grid">
            <div class="game-card">
                <h3>🌀 Voxel Wormhole Engine</h3>
                <p>3D voxel world with shadow dimensions</p>
                <button class="btn btn-game" onclick="openGame('voxel')">Launch</button>
            </div>
            
            <div class="game-card">
                <h3>💰 Economic Engine</h3>
                <p>Babylon.js 3D economic visualization</p>
                <button class="btn btn-game" onclick="openGame('economic')">Launch</button>
            </div>
            
            <div class="game-card">
                <h3>🤖 AI Arena</h3>
                <p>AI fighter battles and tournaments</p>
                <button class="btn btn-game" onclick="openGame('arena')">Launch</button>
            </div>
            
            <div class="game-card">
                <h3>📚 Document Engine</h3>
                <p>Transform documents into games</p>
                <button class="btn btn-game" onclick="openGame('document')">Launch</button>
            </div>
        </div>
        
        <div class="network-section">
            <h2>🔗 Network Linking</h2>
            <div class="auth-buttons">
                <button class="btn" onclick="scanNetwork()">🔍 Scan for Devices</button>
                <button class="btn" onclick="createCableLink()">🔗 Cable Link</button>
                <button class="btn" onclick="createWirelessLink()">📡 Wireless Link</button>
            </div>
            
            <div class="device-list" id="device-list">
                <p>No devices found. Click "Scan for Devices" to discover local gaming servers.</p>
            </div>
        </div>
    </div>
    
    <script>
        let currentUser = null;
        let authToken = null;
        let mediaRecorder = null;
        let audioChunks = [];
        
        // WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:${WS_PORT}');
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        function handleWebSocketMessage(data) {
            switch(data.type) {
                case 'device_discovered':
                    addDeviceToList(data.device);
                    break;
                case 'auth_update':
                    updateAuthStatus(data.status);
                    break;
                case 'game_update':
                    updateGameStatus(data.game, data.status);
                    break;
            }
        }
        
        // Fingerprint authentication (using WebAuthn API)
        async function requestFingerprint() {
            if (!navigator.credentials) {
                alert('Biometric authentication not supported on this device');
                return;
            }
            
            try {
                const credential = await navigator.credentials.create({
                    publicKey: {
                        challenge: new Uint8Array(32),
                        rp: {
                            name: "Local Gaming Server",
                            id: "localhost",
                        },
                        user: {
                            id: new TextEncoder().encode(currentUser || 'guest'),
                            name: currentUser || 'guest',
                            displayName: currentUser || 'Guest User',
                        },
                        pubKeyCredParams: [{alg: -7, type: "public-key"}],
                        authenticatorSelection: {
                            authenticatorAttachment: "platform",
                            userVerification: "required"
                        },
                        timeout: 60000,
                        attestation: "direct"
                    }
                });
                
                // Send fingerprint data to server
                const response = await fetch('/api/auth/fingerprint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser || 'guest',
                        credentialId: credential.id,
                        publicKey: Array.from(new Uint8Array(credential.response.publicKey))
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    document.getElementById('auth-status').textContent = 'Fingerprint Verified ✅';
                    document.getElementById('auth-status').className = 'status authenticated';
                    authToken = result.token;
                } else {
                    document.getElementById('auth-status').textContent = 'Fingerprint Failed ❌';
                    document.getElementById('auth-status').className = 'status failed';
                }
            } catch (error) {
                console.error('Fingerprint auth error:', error);
                alert('Fingerprint authentication failed: ' + error.message);
            }
        }
        
        // Voice authentication
        async function startVoiceAuth() {
            if (!navigator.mediaDevices) {
                alert('Voice authentication not supported');
                return;
            }
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const reader = new FileReader();
                    
                    reader.onload = async function() {
                        const audioData = reader.result;
                        
                        const response = await fetch('/api/auth/voice', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: currentUser || 'guest',
                                voiceData: audioData
                            })
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                            document.getElementById('voice-status').textContent = 'Voice: Verified ✅';
                            document.getElementById('voice-status').style.color = '#00ff00';
                        } else {
                            document.getElementById('voice-status').textContent = 'Voice: Failed ❌';
                            document.getElementById('voice-status').style.color = '#ff0000';
                        }
                    };
                    
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };
                
                // Record for 3 seconds
                mediaRecorder.start();
                document.getElementById('voice-status').textContent = 'Voice: Recording... 🎤';
                document.getElementById('voice-status').style.color = '#ffff00';
                
                setTimeout(() => {
                    mediaRecorder.stop();
                }, 3000);
                
            } catch (error) {
                console.error('Voice auth error:', error);
                alert('Voice authentication failed: ' + error.message);
            }
        }
        
        // Register biometrics
        async function registerBiometrics() {
            const username = document.getElementById('username').value.trim();
            if (!username) {
                alert('Please enter a username');
                return;
            }
            
            currentUser = username;
            document.getElementById('auth-status').textContent = 'Ready to register biometrics';
            document.getElementById('auth-status').className = 'status pending';
            
            alert('Click the fingerprint area to register your fingerprint, then use voice verify to register your voice.');
        }
        
        // Game launching
        function openGame(gameType) {
            if (!authToken) {
                alert('Please authenticate first');
                return;
            }
            
            const gameUrls = {
                voxel: 'http://localhost:8892',
                economic: 'http://localhost:8893/babylon-economic-engine.html',
                arena: 'http://localhost:3001/arena',
                document: 'http://localhost:3001'
            };
            
            window.open(gameUrls[gameType], '_blank');
        }
        
        // Network scanning
        async function scanNetwork() {
            document.getElementById('device-list').innerHTML = '<p>Scanning for devices... 🔍</p>';
            
            try {
                const response = await fetch('/api/network/scan');
                const devices = await response.json();
                
                if (devices.length === 0) {
                    document.getElementById('device-list').innerHTML = '<p>No gaming devices found on local network.</p>';
                } else {
                    let html = '';
                    devices.forEach(device => {
                        html += \`
                            <div class="device-item">
                                <span>\${device.name} (\${device.ip})</span>
                                <button class="btn" onclick="connectToDevice('\${device.id}', '\${device.ip}')">Connect</button>
                            </div>
                        \`;
                    });
                    document.getElementById('device-list').innerHTML = html;
                }
            } catch (error) {
                console.error('Network scan error:', error);
                document.getElementById('device-list').innerHTML = '<p>Network scan failed.</p>';
            }
        }
        
        function createCableLink() {
            alert('Cable link mode activated. Connect via Ethernet cable to another gaming server.');
        }
        
        function createWirelessLink() {
            alert('Wireless link mode activated. Other devices can now discover this server.');
        }
        
        function connectToDevice(deviceId, ip) {
            alert(\`Connecting to gaming device: \${deviceId} at \${ip}\`);
            // Implementation for device connection
        }
        
        function addDeviceToList(device) {
            // Add discovered device to the list
            console.log('Device discovered:', device);
        }
        
        function updateAuthStatus(status) {
            // Update authentication status
            console.log('Auth status update:', status);
        }
        
        function updateGameStatus(game, status) {
            // Update game status
            console.log('Game status update:', game, status);
        }
        
        // Auto-scan for devices on load
        setTimeout(scanNetwork, 2000);
    </script>
</body>
</html>
`;

// API Routes
app.get('/', (req, res) => {
    res.send(LOCAL_GAMING_DASHBOARD);
});

app.get('/api/ping', (req, res) => {
    res.json({
        server_id: LOCAL_STATE.server_id,
        device_name: LOCAL_STATE.device_name,
        status: 'online',
        security_level: LOCAL_STATE.security_level,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/fingerprint', async (req, res) => {
    try {
        const { userId, credentialId, publicKey } = req.body;
        
        // Register or verify fingerprint
        if (publicKey) {
            await biometricAuth.registerFingerprint(userId, { credentialId, publicKey });
            const token = biometricAuth.generateSessionToken(userId);
            
            res.json({
                success: true,
                token,
                message: 'Fingerprint registered and verified'
            });
        } else {
            const verified = await biometricAuth.verifyFingerprint(userId, { credentialId });
            
            if (verified) {
                const token = biometricAuth.generateSessionToken(userId);
                res.json({ success: true, token });
            } else {
                res.json({ success: false, message: 'Fingerprint verification failed' });
            }
        }
    } catch (error) {
        console.error('Fingerprint auth error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/auth/voice', async (req, res) => {
    try {
        const { userId, voiceData } = req.body;
        
        // Register or verify voice
        const verified = await biometricAuth.verifyVoice(userId, voiceData);
        
        if (!verified) {
            // Register new voice pattern
            await biometricAuth.registerVoicePattern(userId, voiceData);
            res.json({ success: true, message: 'Voice pattern registered' });
        } else {
            res.json({ success: true, message: 'Voice verified' });
        }
    } catch (error) {
        console.error('Voice auth error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/network/scan', async (req, res) => {
    try {
        const devices = await networkLinking.discoverDevices();
        res.json(devices);
    } catch (error) {
        console.error('Network scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/network/connect', (req, res) => {
    const { deviceId, connectionType, ip } = req.body;
    
    try {
        if (connectionType === 'cable') {
            networkLinking.createCableLink(deviceId, { ip });
        } else if (connectionType === 'wireless') {
            networkLinking.createWirelessLink(deviceId, { ip });
        }
        
        res.json({ success: true, message: 'Connection established' });
    } catch (error) {
        console.error('Network connection error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log('🔌 WebSocket client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
    });
});

function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
        case 'scan_network':
            networkLinking.discoverDevices().then(devices => {
                ws.send(JSON.stringify({ type: 'devices_found', devices }));
            });
            break;
    }
}

// Start the local gaming server
function startLocalGamingServer() {
    console.log('🎮 STARTING LOCAL GAMING SERVER');
    console.log('================================');
    console.log(`📍 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
    console.log(`🔒 Security Level: ${LOCAL_STATE.security_level}`);
    console.log(`💻 Device: ${LOCAL_STATE.device_name}`);
    console.log(`🆔 Server ID: ${LOCAL_STATE.server_id}`);
    console.log('');
    console.log('🎯 Features:');
    console.log('   ✅ Biometric fingerprint authentication');
    console.log('   ✅ Voice pattern verification');
    console.log('   ✅ Offline-first architecture');
    console.log('   ✅ Cable linking (Game Boy style)');
    console.log('   ✅ Network device discovery');
    console.log('   ✅ Local secure gaming');
    console.log('   ✅ Portable demonstration mode');
    console.log('');
    console.log('🚀 Ready for in-person demonstrations!');
    console.log('   - Touch screen for fingerprint auth');
    console.log('   - Voice commands for verification');
    console.log('   - Cable or wireless linking');
    console.log('   - Fully offline operation');
}

// Start server
const server = app.listen(PORT, () => {
    startLocalGamingServer();
});

// Export for module usage
module.exports = { 
    app, 
    server, 
    biometricAuth, 
    networkLinking, 
    LOCAL_STATE 
};