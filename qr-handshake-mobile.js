#!/usr/bin/env node

/**
 * 📱 QR HANDSHAKE MOBILE AUTHENTICATION SYSTEM
 * Enables mobile device authentication via QR code scanning
 * Integrates with anonymous AI handshake trust system
 */

const http = require('http');
const crypto = require('crypto');
const WebSocket = require('ws');

class QRHandshakeMobile {
    constructor() {
        this.port = 6668; // QR handshake port
        this.wsPort = 6669; // WebSocket for real-time QR updates
        this.handshakeSystemPort = 6666; // Anonymous handshake system
        
        this.pendingQRSessions = new Map(); // QR code sessions
        this.mobileConnections = new Map(); // Active mobile connections
        
        console.log('📱 QR HANDSHAKE MOBILE AUTHENTICATION SYSTEM');
        console.log('===========================================');
        console.log(`🔗 QR Server: http://localhost:${this.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.wsPort}`);
        console.log('');
        
        this.startQRServer();
        this.startWebSocketServer();
    }
    
    startQRServer() {
        const server = http.createServer(async (req, res) => {
            await this.handleQRRequest(req, res);
        });
        
        server.listen(this.port, () => {
            console.log(`📱 QR Handshake server running on port ${this.port}`);
        });
    }
    
    startWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            console.log('📱 Mobile device connected via WebSocket');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMobileMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('📱 Mobile device disconnected');
                // Remove from active connections
                for (const [sessionId, connection] of this.mobileConnections) {
                    if (connection.ws === ws) {
                        this.mobileConnections.delete(sessionId);
                        break;
                    }
                }
            });
        });
        
        console.log(`📡 WebSocket server running on port ${this.wsPort}`);
    }
    
    async handleQRRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            switch (url.pathname) {
                case '/':
                    await this.serveQRInterface(res);
                    break;
                    
                case '/api/qr/generate':
                    await this.generateQRCode(req, res);
                    break;
                    
                case '/api/qr/scan':
                    await this.handleQRScan(req, res);
                    break;
                    
                case '/api/qr/status':
                    await this.checkQRStatus(req, res);
                    break;
                    
                case '/api/mobile/verify':
                    await this.verifyMobileDevice(req, res);
                    break;
                    
                default:
                    res.writeHead(404);
                    res.end('Not found');
            }
        } catch (error) {
            console.error('QR request error:', error);
            res.writeHead(500);
            res.end('Internal server error');
        }
    }
    
    async serveQRInterface(res) {
        const qrInterface = this.generateQRInterfaceHTML();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(qrInterface);
    }
    
    generateQRInterfaceHTML() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>📱 QR Mobile Authentication</title>
            <style>
                body { 
                    font-family: monospace; 
                    background: #000; 
                    color: #0f0; 
                    padding: 20px;
                    text-align: center;
                }
                .qr-container { 
                    margin: 20px auto; 
                    padding: 20px; 
                    border: 2px solid #0f0; 
                    max-width: 500px;
                    background: #111;
                }
                .qr-code { 
                    font-size: 40px;
                    line-height: 1;
                    font-family: monospace;
                    white-space: pre;
                    margin: 20px 0;
                    padding: 20px;
                    background: #fff;
                    color: #000;
                    border: 1px solid #0f0;
                }
                .status { 
                    margin: 10px 0; 
                    padding: 10px; 
                    border: 1px solid #ff0;
                    background: #111;
                }
                .connected { border-color: #0f0; }
                .pending { border-color: #ff0; }
                .failed { border-color: #f00; color: #f00; }
                button {
                    background: #0f0;
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    margin: 10px;
                    cursor: pointer;
                    font-family: monospace;
                }
                button:hover { background: #fff; }
            </style>
        </head>
        <body>
            <h1>📱 QR MOBILE AUTHENTICATION</h1>
            
            <div class="qr-container">
                <h2>🔗 Desktop → Mobile Handshake</h2>
                <button onclick="generateQR()">Generate QR Code</button>
                
                <div id="qr-display" class="qr-code" style="display:none;"></div>
                <div id="qr-status" class="status pending">
                    📋 Status: Ready to generate QR code
                </div>
            </div>
            
            <div class="qr-container">
                <h2>📱 Mobile Instructions</h2>
                <p>1. Scan QR code with mobile device</p>
                <p>2. Mobile device connects to authentication system</p>
                <p>3. Cryptographic handshake established</p>
                <p>4. Mobile device gains trusted access</p>
            </div>
            
            <div class="qr-container">
                <h2>🔧 System Status</h2>
                <div id="system-status">
                    🔍 Checking system status...
                </div>
            </div>
            
            <script>
                let currentSession = null;
                let statusInterval = null;
                
                async function generateQR() {
                    try {
                        const response = await fetch('/api/qr/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            document.getElementById('qr-display').style.display = 'block';
                            document.getElementById('qr-display').textContent = data.qrCode;
                            document.getElementById('qr-status').innerHTML = 
                                '📋 Status: QR Code ready - scan with mobile device';
                            document.getElementById('qr-status').className = 'status pending';
                            
                            currentSession = data.sessionId;
                            startStatusUpdates();
                        } else {
                            document.getElementById('qr-status').innerHTML = 
                                '❌ Failed to generate QR code: ' + data.error;
                            document.getElementById('qr-status').className = 'status failed';
                        }
                    } catch (error) {
                        document.getElementById('qr-status').innerHTML = 
                            '❌ Error generating QR code: ' + error.message;
                        document.getElementById('qr-status').className = 'status failed';
                    }
                }
                
                function startStatusUpdates() {
                    if (statusInterval) clearInterval(statusInterval);
                    
                    statusInterval = setInterval(async () => {
                        if (!currentSession) return;
                        
                        try {
                            const response = await fetch('/api/qr/status?session=' + currentSession);
                            const status = await response.json();
                            
                            if (status.connected) {
                                document.getElementById('qr-status').innerHTML = 
                                    '✅ Mobile device connected! Trust level: ' + status.trustLevel;
                                document.getElementById('qr-status').className = 'status connected';
                                clearInterval(statusInterval);
                            } else if (status.expired) {
                                document.getElementById('qr-status').innerHTML = 
                                    '⏰ QR code expired - generate new one';
                                document.getElementById('qr-status').className = 'status failed';
                                clearInterval(statusInterval);
                            }
                            
                        } catch (error) {
                            console.error('Status update error:', error);
                        }
                    }, 2000);
                }
                
                // Check system status on load
                async function checkSystemStatus() {
                    try {
                        const response = await fetch('/api/qr/status');
                        const status = await response.json();
                        
                        document.getElementById('system-status').innerHTML = 
                            '✅ QR System: ' + status.status + '<br>' +
                            '🤝 Handshake System: ' + (status.handshakeSystem ? 'Connected' : 'Disconnected') + '<br>' +
                            '📱 Mobile Connections: ' + status.mobileConnections;
                            
                    } catch (error) {
                        document.getElementById('system-status').innerHTML = 
                            '❌ System status check failed';
                    }
                }
                
                // Initialize
                checkSystemStatus();
                setInterval(checkSystemStatus, 10000);
            </script>
        </body>
        </html>
        `;
    }
    
    async generateQRCode(req, res) {
        console.log('📱 Generating QR code for mobile authentication...');
        
        const sessionId = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        
        // Create QR data
        const qrData = {
            sessionId: sessionId,
            authEndpoint: `http://localhost:${this.port}/api/qr/scan`,
            wsEndpoint: `ws://localhost:${this.wsPort}`,
            handshakeEndpoint: `http://localhost:${this.handshakeSystemPort}`,
            timestamp: timestamp,
            expires: timestamp + 300000 // 5 minutes
        };
        
        // Store pending session
        this.pendingQRSessions.set(sessionId, {
            qrData: qrData,
            created: timestamp,
            status: 'pending',
            mobileConnected: false
        });
        
        // Generate text-based QR code (simplified)
        const qrCode = this.generateTextQR(JSON.stringify(qrData));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            sessionId: sessionId,
            qrCode: qrCode,
            expires: new Date(qrData.expires).toISOString()
        }));
        
        // Auto-cleanup expired session
        setTimeout(() => {
            if (this.pendingQRSessions.has(sessionId)) {
                const session = this.pendingQRSessions.get(sessionId);
                if (session.status === 'pending') {
                    session.status = 'expired';
                    console.log(`📱 QR session ${sessionId} expired`);
                }
            }
        }, 300000);
    }
    
    generateTextQR(data) {
        // Simplified text-based QR code representation
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const qrSize = 13;
        let qr = '';
        
        for (let i = 0; i < qrSize; i++) {
            for (let j = 0; j < qrSize; j++) {
                const index = (i * qrSize + j) % hash.length;
                const char = hash[index];
                qr += (parseInt(char, 16) % 2 === 0) ? '██' : '  ';
            }
            qr += '\n';
        }
        
        return `QR Code (Scan with mobile):\n${qr}\nData: ${data.slice(0, 50)}...`;
    }
    
    async handleQRScan(req, res) {
        const body = await this.readRequestBody(req);
        const scanData = JSON.parse(body);
        
        console.log('📱 Mobile device scanned QR code:', scanData.sessionId);
        
        const session = this.pendingQRSessions.get(scanData.sessionId);
        
        if (!session) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Session not found' }));
            return;
        }
        
        if (session.status !== 'pending') {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Session expired or already used' }));
            return;
        }
        
        // Initiate handshake with anonymous system
        try {
            const handshakeResult = await this.initiateHandshakeForMobile(scanData.sessionId);
            
            if (handshakeResult.trustEstablished) {
                session.status = 'connected';
                session.mobileConnected = true;
                session.trustLevel = handshakeResult.trustLevel;
                
                // Store mobile connection
                this.mobileConnections.set(scanData.sessionId, {
                    sessionId: scanData.sessionId,
                    trustLevel: handshakeResult.trustLevel,
                    connected: Date.now(),
                    ws: null // Will be set when WebSocket connects
                });
                
                console.log(`✅ Mobile device authenticated: ${scanData.sessionId}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Mobile device authenticated',
                    sessionId: scanData.sessionId,
                    trustLevel: handshakeResult.trustLevel,
                    wsEndpoint: `ws://localhost:${this.wsPort}`
                }));
            } else {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Handshake failed'
                }));
            }
        } catch (error) {
            console.error('Mobile handshake error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({
                success: false,
                error: 'Authentication system unavailable'
            }));
        }
    }
    
    async checkQRStatus(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const sessionId = url.searchParams.get('session');
        
        if (sessionId) {
            // Check specific session status
            const session = this.pendingQRSessions.get(sessionId);
            
            if (!session) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Session not found' }));
                return;
            }
            
            const expired = Date.now() > session.qrData.expires;
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                sessionId: sessionId,
                connected: session.mobileConnected,
                status: session.status,
                expired: expired,
                trustLevel: session.trustLevel || 0
            }));
        } else {
            // General system status
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'operational',
                handshakeSystem: await this.checkHandshakeSystem(),
                mobileConnections: this.mobileConnections.size,
                pendingSessions: this.pendingQRSessions.size
            }));
        }
    }
    
    async handleMobileMessage(ws, data) {
        console.log('📱 Mobile message:', data.type);
        
        switch (data.type) {
            case 'mobile_connect':
                await this.handleMobileConnect(ws, data);
                break;
                
            case 'mobile_heartbeat':
                ws.send(JSON.stringify({
                    type: 'heartbeat_response',
                    timestamp: Date.now()
                }));
                break;
                
            case 'mobile_ai_request':
                await this.handleMobileAIRequest(ws, data);
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown message type'
                }));
        }
    }
    
    async handleMobileConnect(ws, data) {
        const connection = this.mobileConnections.get(data.sessionId);
        
        if (connection) {
            connection.ws = ws;
            
            ws.send(JSON.stringify({
                type: 'mobile_connected',
                sessionId: data.sessionId,
                trustLevel: connection.trustLevel,
                message: 'Mobile device connected to anonymous AI system'
            }));
            
            console.log(`📱 Mobile WebSocket connected: ${data.sessionId}`);
        } else {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid session ID'
            }));
        }
    }
    
    async handleMobileAIRequest(ws, data) {
        const connection = this.mobileConnections.get(data.sessionId);
        
        if (!connection) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid session'
            }));
            return;
        }
        
        // Route through anonymous handshake system and unified API router
        try {
            const aiResponse = await this.routeToUnifiedAPI(data.request, connection.trustLevel);
            
            ws.send(JSON.stringify({
                type: 'ai_response',
                sessionId: data.sessionId,
                response: aiResponse,
                timestamp: Date.now()
            }));
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'AI request failed: ' + error.message
            }));
        }
    }
    
    async initiateHandshakeForMobile(sessionId) {
        // Connect to anonymous handshake system
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({ mobileSession: sessionId });
            const options = {
                hostname: 'localhost',
                port: this.handshakeSystemPort,
                path: '/initiate-handshake',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
    
    async checkHandshakeSystem() {
        try {
            const response = await this.httpRequest(`http://localhost:${this.handshakeSystemPort}/trust-status`);
            return response.statusCode === 200;
        } catch (error) {
            return false;
        }
    }
    
    async routeToUnifiedAPI(request, trustLevel) {
        // Route mobile requests through unified API router
        const apiRouter = 'http://localhost:3001'; // Unified system API router
        
        const response = await this.httpRequest(`${apiRouter}/api/ai/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer mobile-trust-${trustLevel}`
            },
            data: JSON.stringify(request)
        });
        
        return JSON.parse(response.data);
    }
    
    async readRequestBody(req) {
        return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => resolve(body));
        });
    }
    
    httpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: 5000
            };
            
            const req = http.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            
            if (options.data) {
                req.write(options.data);
            }
            
            req.end();
        });
    }
}

// Main execution
if (require.main === module) {
    console.log('📱 LAUNCHING QR HANDSHAKE MOBILE AUTHENTICATION');
    console.log('============================================\n');
    
    const qrSystem = new QRHandshakeMobile();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down QR mobile system...');
        process.exit(0);
    });
    
    console.log('\n🎯 QR Mobile Authentication System Ready!');
    console.log('==========================================');
    console.log('📱 Mobile devices can now authenticate via QR codes');
    console.log('🔗 Integrated with anonymous handshake trust system');
    console.log('🌐 Web interface available for QR code generation');
    console.log('\n🛑 Press Ctrl+C to stop');
}

module.exports = { QRHandshakeMobile };