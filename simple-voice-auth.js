#!/usr/bin/env node

/**
 * 🎤 SIMPLE VOICE + QR AUTHENTICATION SYSTEM
 * 
 * Simplified version that works without database
 * For demo and testing purposes
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const QRCode = require('qrcode');

class SimpleVoiceQRAuth {
    constructor() {
        this.app = express();
        this.port = 9700;
        this.wsPort = 9701;
        
        // In-memory storage for demo
        this.sessions = new Map();
        this.voiceProfiles = new Map();
        this.singleUseTokens = new Map(); // Single-use tokens with immediate expiry
        
        console.log('🎤 SIMPLE VOICE + QR AUTHENTICATION SYSTEM');
        console.log('==========================================');
        console.log('✅ No database required (in-memory demo)');
        console.log('✅ No face tracking or biometric surveillance');
        console.log('✅ Voice-first authentication');
        console.log('✅ Offline QR verification');
        console.log('🚪 Single-use tokens (proper door manners)');
        
        this.initialize();
    }
    
    async initialize() {
        this.setupExpress();
        this.setupWebSocket();
        
        this.app.listen(this.port, () => {
            console.log(`🌐 Voice + QR Auth running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket on ws://localhost:${this.wsPort}`);
            console.log('');
            console.log('🎯 Ready for portal integration!');
        });
    }
    
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // Main dashboard (same as unified system)
        this.app.get('/', this.serveDashboard.bind(this));
        
        // Voice authentication endpoints
        this.app.post('/api/voice/create-profile', this.createVoiceProfile.bind(this));
        this.app.post('/api/voice/verify', this.verifyVoice.bind(this));
        this.app.get('/api/voice/status/:userId', this.getVoiceStatus.bind(this));
        
        // QR endpoints
        this.app.get('/api/qr/generate-login', this.generateLoginQR.bind(this));
        this.app.post('/api/qr/verify-offline', this.verifyOfflineQR.bind(this));
        this.app.get('/api/qr/session/:sessionId', this.getQRSession.bind(this));
        
        // Combined auth endpoints
        this.app.post('/api/auth/voice-qr-login', this.voiceQRLogin.bind(this));
        this.app.get('/api/auth/status/:sessionId', this.getAuthStatus.bind(this));
        
        // Single-use token endpoints
        this.app.post('/api/auth/generate-single-use-token', this.generateSingleUseToken.bind(this));
        this.app.post('/api/auth/use-token', this.useSingleUseToken.bind(this));
        this.app.post('/api/auth/revoke-token', this.revokeSingleUseToken.bind(this));
        
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                status: 'healthy',
                service: 'Simple Voice + QR Auth',
                timestamp: new Date()
            });
        });
    }
    
    setupWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket disconnected');
            });
        });
    }
    
    async serveDashboard(req, res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🎤 Voice + QR Authentication</title>
    <style>
        body {
            background: #0a0a0a;
            color: #00ff88;
            font-family: 'Courier New', monospace;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        .header {
            margin-bottom: 40px;
            border-bottom: 2px solid #00ff88;
            padding-bottom: 20px;
        }
        .auth-card {
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
        }
        .voice-button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            margin: 10px;
            font-size: 16px;
        }
        .voice-button:hover {
            background: #00cc6a;
        }
        .qr-container img {
            border: 3px solid #00ff88;
            border-radius: 8px;
            padding: 10px;
            background: white;
        }
        .status {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #00ff88;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-size: 14px;
        }
        .portal-info {
            background: rgba(255, 136, 0, 0.1);
            border: 2px solid #ff8800;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎤 Simple Voice + QR Authentication</h1>
            <p>NO FACE TRACKING • NO BIOMETRIC SURVEILLANCE • VOICE-FIRST PRIVACY</p>
            <p style="color: #ff8800;">Ready for Portal Integration</p>
        </div>
        
        <div class="portal-info">
            <h2>🌐 Portal Integration Ready!</h2>
            <p>This auth system is now connected to the portal at:</p>
            <p style="font-size: 18px; color: #00ff88;"><strong>http://localhost:3333/portal</strong></p>
            <p>Click "🎤 Sign in with Voice + QR" in the portal to authenticate here!</p>
        </div>
        
        <div class="auth-card">
            <h3>🎤 Voice Authentication Test</h3>
            <button class="voice-button" onclick="testVoiceAuth()">Test Voice Auth</button>
            <div class="status" id="voiceStatus">Status: Ready for testing</div>
        </div>
        
        <div class="auth-card">
            <h3>📱 QR Code Test</h3>
            <button class="voice-button" onclick="generateQRTest()">Generate Test QR</button>
            <div class="qr-container" id="qrContainer"></div>
            <div class="status" id="qrStatus">Status: Click to generate QR</div>
        </div>
    </div>
    
    <script>
        async function testVoiceAuth() {
            document.getElementById('voiceStatus').textContent = 'Status: Voice authentication simulated ✅';
        }
        
        async function generateQRTest() {
            try {
                const response = await fetch('/api/qr/generate-login');
                const data = await response.json();
                
                document.getElementById('qrContainer').innerHTML = 
                    '<img src="' + data.qrCode + '" alt="Login QR" width="200">';
                document.getElementById('qrStatus').textContent = 
                    'Status: QR generated (valid for ' + data.expiresIn + ')';
            } catch (error) {
                document.getElementById('qrStatus').textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>
        `;
        
        res.send(html);
    }
    
    async generateLoginQR(req, res) {
        try {
            const sessionId = crypto.randomBytes(16).toString('hex');
            const timestamp = Date.now();
            
            const qrData = {
                sessionId,
                timestamp,
                type: 'voice_auth_login',
                offline: true
            };
            
            // Create offline signature
            const signature = crypto.createHash('sha256')
                .update(JSON.stringify(qrData))
                .digest('hex');
            
            qrData.signature = signature;
            
            // Generate QR code
            const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
            
            // Store session in memory
            this.sessions.set(sessionId, {
                ...qrData,
                expiresAt: timestamp + (5 * 60 * 1000), // 5 minutes
                qrValid: true,
                voiceVerified: false
            });
            
            res.json({
                sessionId,
                qrCode: qrDataUrl,
                offlineCapable: true,
                expiresIn: '5 minutes'
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async verifyVoice(req, res) {
        try {
            const { userId, voiceData } = req.body;
            
            // Simulate voice verification (always pass for demo)
            const isValid = true;
            
            if (isValid) {
                res.json({
                    success: true,
                    message: 'Voice verified (demo)',
                    antiAICheck: 'passed'
                });
            } else {
                res.json({
                    success: false,
                    message: 'Voice verification failed'
                });
            }
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async getQRSession(req, res) {
        const sessionId = req.params.sessionId;
        const session = this.sessions.get(sessionId);
        
        if (session && Date.now() < session.expiresAt) {
            res.json({
                qrValid: true,
                voiceVerified: session.voiceVerified || false,
                authenticated: session.voiceVerified || false,
                sessionId
            });
        } else {
            res.json({
                qrValid: false,
                voiceVerified: false,
                authenticated: false,
                error: 'Session not found or expired'
            });
        }
    }
    
    async voiceQRLogin(req, res) {
        try {
            const { sessionId, voiceData, userId } = req.body;
            
            const session = this.sessions.get(sessionId);
            if (!session || Date.now() >= session.expiresAt) {
                return res.json({ success: false, message: 'Invalid or expired session' });
            }
            
            // Mark as voice verified for demo
            session.voiceVerified = true;
            this.sessions.set(sessionId, session);
            
            res.json({
                success: true,
                message: 'Voice + QR authentication successful',
                authToken: crypto.randomBytes(32).toString('hex'),
                sessionId,
                userId: userId || sessionId
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async getAuthStatus(req, res) {
        const sessionId = req.params.sessionId;
        const session = this.sessions.get(sessionId);
        
        if (session && Date.now() < session.expiresAt) {
            res.json({
                authenticated: session.voiceVerified || false,
                qrValid: true,
                voiceVerified: session.voiceVerified || false,
                sessionId
            });
        } else {
            res.json({
                authenticated: false,
                qrValid: false,
                voiceVerified: false
            });
        }
    }
    
    // Placeholder methods for compatibility
    async createVoiceProfile(req, res) {
        res.json({ success: true, message: 'Voice profile created (demo)' });
    }
    
    async getVoiceStatus(req, res) {
        res.json({ hasProfile: true, verified: true });
    }
    
    async verifyOfflineQR(req, res) {
        res.json({ success: true, message: 'QR verified offline (demo)' });
    }
    
    async handleWebSocketMessage(ws, data) {
        // Handle WebSocket messages for real-time auth
        ws.send(JSON.stringify({
            type: 'auth_status',
            data: { message: 'WebSocket connected' }
        }));
    }
    
    // 🚪 SINGLE-USE TOKEN MANAGEMENT (Proper Door Manners)
    
    async generateSingleUseToken(req, res) {
        try {
            const { sessionId, purpose, expiresInSeconds = 60 } = req.body;
            
            // Verify the session is valid before generating token
            const session = this.sessions.get(sessionId);
            if (!session || Date.now() >= session.expiresAt) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid or expired session'
                });
            }
            
            // Generate single-use token
            const token = crypto.randomBytes(32).toString('hex');
            const tokenData = {
                token,
                sessionId,
                purpose: purpose || 'general',
                createdAt: Date.now(),
                expiresAt: Date.now() + (expiresInSeconds * 1000),
                used: false,
                usedAt: null
            };
            
            this.singleUseTokens.set(token, tokenData);
            
            console.log(`🚪 Generated single-use token for ${purpose} (expires in ${expiresInSeconds}s)`);
            
            res.json({
                success: true,
                token,
                purpose: tokenData.purpose,
                expiresIn: expiresInSeconds,
                message: 'Token generated - use once then it self-destructs'
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async useSingleUseToken(req, res) {
        try {
            const { token, action } = req.body;
            
            const tokenData = this.singleUseTokens.get(token);
            if (!tokenData) {
                return res.status(404).json({
                    success: false,
                    error: 'Token not found or already revoked'
                });
            }
            
            // Check if token is expired
            if (Date.now() >= tokenData.expiresAt) {
                this.singleUseTokens.delete(token); // Clean up expired token
                return res.status(401).json({
                    success: false,
                    error: 'Token expired'
                });
            }
            
            // Check if already used
            if (tokenData.used) {
                return res.status(401).json({
                    success: false,
                    error: 'Token already used - single use only!'
                });
            }
            
            // Mark as used
            tokenData.used = true;
            tokenData.usedAt = Date.now();
            tokenData.action = action;
            
            console.log(`🚪 Token used for ${action} - marking for immediate revocation`);
            
            // Schedule immediate revocation (proper manners)
            setTimeout(() => {
                this.singleUseTokens.delete(token);
                console.log(`🚪 Token revoked (proper door manners)`);
            }, 1000); // 1 second grace period
            
            res.json({
                success: true,
                message: 'Token used successfully - now revoking (proper manners)',
                action,
                sessionId: tokenData.sessionId
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    async revokeSingleUseToken(req, res) {
        try {
            const { token } = req.body;
            
            const tokenData = this.singleUseTokens.get(token);
            if (!tokenData) {
                return res.json({
                    success: true,
                    message: 'Token already revoked or never existed'
                });
            }
            
            this.singleUseTokens.delete(token);
            console.log(`🚪 Token manually revoked (${tokenData.purpose})`);
            
            res.json({
                success: true,
                message: 'Token revoked (door closed properly)'
            });
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

// Start the simple auth system
if (require.main === module) {
    new SimpleVoiceQRAuth();
}

module.exports = SimpleVoiceQRAuth;