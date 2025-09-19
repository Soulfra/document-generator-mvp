#!/usr/bin/env node

/**
 * SOULFRA CROSS-DEVICE QR AUTHENTICATION SYSTEM
 * 
 * Enables seamless authentication across devices using QR codes and WebSocket sync
 * - Desktop app shows QR code
 * - Mobile device scans and approves
 * - Real-time WebSocket synchronization
 * - Secure session transfer
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

class SoulfraGrossDeviceAuth {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3334;
        this.wsPort = process.env.WS_PORT || 3335;
        
        // Device pairing state
        this.pairingSessions = new Map();
        this.devicePairs = new Map();
        this.wsRooms = new Map(); // sessionId -> Set of WebSocket clients
        
        // Security configuration
        this.security = {
            pairingTimeout: 5 * 60 * 1000, // 5 minutes
            sessionSecret: process.env.SESSION_SECRET || 'soulfra-device-pairing-secret',
            maxDevicesPerUser: 5,
            requireVoiceForHighSecurity: false
        };
        
        // Database client
        this.db = null;
        
        // Initialize system
        this.initialize();
    }
    
    async initialize() {
        console.log('🔐 SOULFRA CROSS-DEVICE QR AUTHENTICATION');
        console.log('========================================');
        
        try {
            // Setup database
            await this.setupDatabase();
            
            // Setup Express
            this.setupExpress();
            
            // Setup WebSocket
            this.setupWebSocket();
            
            // Start cleanup interval
            this.startCleanupInterval();
            
            console.log(`\n✅ Cross-device auth running on:`);
            console.log(`   HTTP: http://localhost:${this.port}`);
            console.log(`   WebSocket: ws://localhost:${this.wsPort}`);
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            process.exit(1);
        }
    }
    
    async setupDatabase() {
        this.db = new Client({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'document_generator',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres'
        });
        
        await this.db.connect();
        
        // Create device pairing tables
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS device_pairs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                device_id VARCHAR(255) UNIQUE NOT NULL,
                device_name VARCHAR(255),
                device_type VARCHAR(50),
                device_fingerprint TEXT,
                trust_score INTEGER DEFAULT 50,
                is_primary BOOLEAN DEFAULT false,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS pairing_sessions (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                initiator_device_id VARCHAR(255),
                target_device_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                qr_data TEXT,
                expires_at TIMESTAMP NOT NULL,
                approved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS device_auth_logs (
                id SERIAL PRIMARY KEY,
                device_id VARCHAR(255) NOT NULL,
                action VARCHAR(50) NOT NULL,
                success BOOLEAN DEFAULT true,
                ip_address VARCHAR(45),
                user_agent TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_device_pairs_user_id ON device_pairs(user_id);
            CREATE INDEX IF NOT EXISTS idx_pairing_sessions_status ON pairing_sessions(status);
        `);
        
        console.log('✅ Database tables created/verified');
    }
    
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
        
        // Routes
        this.setupRoutes();
        
        this.app.listen(this.port);
    }
    
    setupRoutes() {
        // Device pairing endpoints
        this.app.post('/api/device/generate-qr', this.generatePairingQR.bind(this));
        this.app.post('/api/device/scan', this.processScanedQR.bind(this));
        this.app.get('/api/device/status/:sessionId', this.getPairingStatus.bind(this));
        this.app.post('/api/device/approve', this.approvePairing.bind(this));
        this.app.post('/api/device/reject', this.rejectPairing.bind(this));
        
        // Device management
        this.app.get('/api/devices', this.getUserDevices.bind(this));
        this.app.delete('/api/device/:deviceId', this.removeDevice.bind(this));
        this.app.put('/api/device/:deviceId/trust', this.updateDeviceTrust.bind(this));
        
        // Session transfer
        this.app.post('/api/session/transfer', this.transferSession.bind(this));
        
        // Main UI
        this.app.get('/', this.serveDashboard.bind(this));
    }
    
    setupWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws, req) => {
            const deviceId = this.extractDeviceId(req);
            console.log(`🔌 Device connected: ${deviceId}`);
            
            // Store device connection
            ws.deviceId = deviceId;
            ws.rooms = new Set();
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 Device disconnected: ${deviceId}`);
                this.removeFromAllRooms(ws);
            });
            
            // Send initial connection confirmation
            ws.send(JSON.stringify({
                type: 'connected',
                deviceId: deviceId
            }));
        });
        
        this.wss = wss;
    }
    
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'join_pairing':
                this.joinPairingRoom(ws, data.sessionId);
                break;
                
            case 'pairing_status':
                await this.sendPairingStatus(ws, data.sessionId);
                break;
                
            case 'device_ready':
                await this.markDeviceReady(ws, data);
                break;
                
            case 'heartbeat':
                ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
                break;
                
            default:
                console.warn('Unknown WebSocket message type:', data.type);
        }
    }
    
    joinPairingRoom(ws, sessionId) {
        // Leave other rooms
        this.removeFromAllRooms(ws);
        
        // Join new room
        if (!this.wsRooms.has(sessionId)) {
            this.wsRooms.set(sessionId, new Set());
        }
        
        this.wsRooms.get(sessionId).add(ws);
        ws.rooms.add(sessionId);
        
        // Notify room members
        this.broadcastToRoom(sessionId, {
            type: 'device_joined',
            deviceId: ws.deviceId,
            totalDevices: this.wsRooms.get(sessionId).size
        });
    }
    
    removeFromAllRooms(ws) {
        for (const roomId of ws.rooms) {
            const room = this.wsRooms.get(roomId);
            if (room) {
                room.delete(ws);
                if (room.size === 0) {
                    this.wsRooms.delete(roomId);
                }
            }
        }
        ws.rooms.clear();
    }
    
    broadcastToRoom(roomId, message, excludeWs = null) {
        const room = this.wsRooms.get(roomId);
        if (!room) return;
        
        const messageStr = JSON.stringify(message);
        for (const client of room) {
            if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        }
    }
    
    async generatePairingQR(req, res) {
        try {
            const { deviceId, deviceName, deviceType, userId } = req.body;
            
            // Generate pairing session
            const sessionId = crypto.randomBytes(32).toString('hex');
            const pairingData = {
                sessionId,
                deviceId,
                timestamp: Date.now(),
                action: 'pair_device'
            };
            
            // Sign the data
            const token = jwt.sign(pairingData, this.security.sessionSecret, {
                expiresIn: '5m'
            });
            
            // Create QR data
            const qrData = {
                v: 1, // version
                t: token,
                u: `http://localhost:${this.port}/pair/${sessionId}`
            };
            
            // Generate QR code
            const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            // Store pairing session
            const expiresAt = new Date(Date.now() + this.security.pairingTimeout);
            await this.db.query(`
                INSERT INTO pairing_sessions 
                (session_id, initiator_device_id, qr_data, expires_at)
                VALUES ($1, $2, $3, $4)
            `, [sessionId, deviceId, JSON.stringify(qrData), expiresAt]);
            
            this.pairingSessions.set(sessionId, {
                sessionId,
                initiatorDeviceId: deviceId,
                deviceName,
                deviceType,
                userId,
                status: 'pending',
                createdAt: Date.now(),
                expiresAt: expiresAt.getTime()
            });
            
            res.json({
                success: true,
                sessionId,
                qrCode: qrDataUrl,
                expiresIn: 300, // 5 minutes in seconds
                pairingUrl: qrData.u
            });
            
        } catch (error) {
            console.error('Generate QR error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async processScanedQR(req, res) {
        try {
            const { qrData, scannerDeviceId, scannerDeviceName } = req.body;
            
            // Parse QR data
            let parsed;
            try {
                parsed = JSON.parse(qrData);
            } catch {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid QR code format'
                });
            }
            
            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(parsed.t, this.security.sessionSecret);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid or expired QR code'
                });
            }
            
            const { sessionId } = decoded;
            const session = this.pairingSessions.get(sessionId);
            
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Pairing session not found'
                });
            }
            
            if (session.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: `Session already ${session.status}`
                });
            }
            
            // Update session with scanner info
            session.targetDeviceId = scannerDeviceId;
            session.targetDeviceName = scannerDeviceName;
            session.status = 'awaiting_approval';
            
            await this.db.query(`
                UPDATE pairing_sessions 
                SET target_device_id = $1, status = $2
                WHERE session_id = $3
            `, [scannerDeviceId, 'awaiting_approval', sessionId]);
            
            // Notify initiator device via WebSocket
            this.broadcastToRoom(sessionId, {
                type: 'pairing_request',
                sessionId,
                scannerDevice: {
                    id: scannerDeviceId,
                    name: scannerDeviceName
                }
            });
            
            res.json({
                success: true,
                sessionId,
                initiatorDevice: {
                    name: session.deviceName,
                    type: session.deviceType
                },
                message: 'Waiting for approval from initiator device'
            });
            
        } catch (error) {
            console.error('Process scan error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async approvePairing(req, res) {
        try {
            const { sessionId, approverDeviceId } = req.body;
            
            const session = this.pairingSessions.get(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Pairing session not found'
                });
            }
            
            // Verify approver is the initiator
            if (session.initiatorDeviceId !== approverDeviceId) {
                return res.status(403).json({
                    success: false,
                    error: 'Only initiator can approve pairing'
                });
            }
            
            // Create device pairs
            await this.db.query(`
                INSERT INTO device_pairs 
                (user_id, device_id, device_name, device_type, is_primary)
                VALUES 
                ($1, $2, $3, $4, true),
                ($1, $5, $6, 'mobile', false)
                ON CONFLICT (device_id) DO UPDATE
                SET last_seen = CURRENT_TIMESTAMP
            `, [
                session.userId,
                session.initiatorDeviceId,
                session.deviceName,
                session.deviceType,
                session.targetDeviceId,
                session.targetDeviceName || 'Mobile Device'
            ]);
            
            // Update session
            session.status = 'approved';
            await this.db.query(`
                UPDATE pairing_sessions 
                SET status = 'approved', approved_at = CURRENT_TIMESTAMP
                WHERE session_id = $1
            `, [sessionId]);
            
            // Generate auth token for target device
            const authToken = jwt.sign({
                userId: session.userId,
                deviceId: session.targetDeviceId,
                pairedWith: session.initiatorDeviceId
            }, this.security.sessionSecret, {
                expiresIn: '30d'
            });
            
            // Notify both devices
            this.broadcastToRoom(sessionId, {
                type: 'pairing_approved',
                sessionId,
                authToken,
                devices: {
                    primary: {
                        id: session.initiatorDeviceId,
                        name: session.deviceName
                    },
                    paired: {
                        id: session.targetDeviceId,
                        name: session.targetDeviceName
                    }
                }
            });
            
            res.json({
                success: true,
                message: 'Device pairing approved',
                authToken
            });
            
            // Clean up session after a delay
            setTimeout(() => {
                this.pairingSessions.delete(sessionId);
            }, 5000);
            
        } catch (error) {
            console.error('Approve pairing error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async rejectPairing(req, res) {
        try {
            const { sessionId, reason } = req.body;
            
            const session = this.pairingSessions.get(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Pairing session not found'
                });
            }
            
            session.status = 'rejected';
            
            await this.db.query(`
                UPDATE pairing_sessions 
                SET status = 'rejected'
                WHERE session_id = $1
            `, [sessionId]);
            
            // Notify devices
            this.broadcastToRoom(sessionId, {
                type: 'pairing_rejected',
                sessionId,
                reason: reason || 'User rejected pairing'
            });
            
            res.json({
                success: true,
                message: 'Device pairing rejected'
            });
            
            // Clean up
            this.pairingSessions.delete(sessionId);
            
        } catch (error) {
            console.error('Reject pairing error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async getPairingStatus(req, res) {
        try {
            const { sessionId } = req.params;
            
            const session = this.pairingSessions.get(sessionId);
            if (!session) {
                // Check database
                const result = await this.db.query(`
                    SELECT * FROM pairing_sessions WHERE session_id = $1
                `, [sessionId]);
                
                if (result.rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: 'Session not found'
                    });
                }
                
                return res.json({
                    success: true,
                    status: result.rows[0].status,
                    expired: new Date(result.rows[0].expires_at) < new Date()
                });
            }
            
            const now = Date.now();
            const expired = now > session.expiresAt;
            
            res.json({
                success: true,
                status: session.status,
                expired,
                timeRemaining: expired ? 0 : Math.floor((session.expiresAt - now) / 1000),
                devices: {
                    initiator: {
                        name: session.deviceName,
                        type: session.deviceType
                    },
                    target: session.targetDeviceId ? {
                        id: session.targetDeviceId,
                        name: session.targetDeviceName
                    } : null
                }
            });
            
        } catch (error) {
            console.error('Get status error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async getUserDevices(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User ID required'
                });
            }
            
            const result = await this.db.query(`
                SELECT device_id, device_name, device_type, trust_score, 
                       is_primary, last_seen, created_at
                FROM device_pairs
                WHERE user_id = $1
                ORDER BY is_primary DESC, last_seen DESC
            `, [userId]);
            
            res.json({
                success: true,
                devices: result.rows
            });
            
        } catch (error) {
            console.error('Get devices error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async removeDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.headers['x-user-id'];
            
            await this.db.query(`
                DELETE FROM device_pairs
                WHERE device_id = $1 AND user_id = $2
            `, [deviceId, userId]);
            
            res.json({
                success: true,
                message: 'Device removed'
            });
            
        } catch (error) {
            console.error('Remove device error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async updateDeviceTrust(req, res) {
        try {
            const { deviceId } = req.params;
            const { trustScore } = req.body;
            const userId = req.headers['x-user-id'];
            
            await this.db.query(`
                UPDATE device_pairs
                SET trust_score = $1
                WHERE device_id = $2 AND user_id = $3
            `, [trustScore, deviceId, userId]);
            
            res.json({
                success: true,
                message: 'Trust score updated'
            });
            
        } catch (error) {
            console.error('Update trust error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async transferSession(req, res) {
        try {
            const { fromDeviceId, toDeviceId, sessionData } = req.body;
            
            // Verify devices are paired
            const result = await this.db.query(`
                SELECT COUNT(*) as count
                FROM device_pairs p1
                JOIN device_pairs p2 ON p1.user_id = p2.user_id
                WHERE p1.device_id = $1 AND p2.device_id = $2
            `, [fromDeviceId, toDeviceId]);
            
            if (result.rows[0].count === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Devices are not paired'
                });
            }
            
            // Create transfer token
            const transferToken = jwt.sign({
                sessionData,
                fromDevice: fromDeviceId,
                toDevice: toDeviceId,
                timestamp: Date.now()
            }, this.security.sessionSecret, {
                expiresIn: '1m'
            });
            
            // Notify target device
            this.broadcastToRoom(`device:${toDeviceId}`, {
                type: 'session_transfer',
                fromDevice: fromDeviceId,
                transferToken
            });
            
            res.json({
                success: true,
                message: 'Session transfer initiated'
            });
            
        } catch (error) {
            console.error('Transfer session error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    extractDeviceId(req) {
        // Extract device ID from headers or generate new one
        return req.headers['x-device-id'] || crypto.randomBytes(16).toString('hex');
    }
    
    async sendPairingStatus(ws, sessionId) {
        const session = this.pairingSessions.get(sessionId);
        if (!session) {
            ws.send(JSON.stringify({
                type: 'pairing_status',
                status: 'not_found'
            }));
            return;
        }
        
        ws.send(JSON.stringify({
            type: 'pairing_status',
            status: session.status,
            session: {
                sessionId,
                timeRemaining: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000))
            }
        }));
    }
    
    startCleanupInterval() {
        // Clean up expired sessions every minute
        setInterval(async () => {
            try {
                // Clean memory
                const now = Date.now();
                for (const [sessionId, session] of this.pairingSessions) {
                    if (now > session.expiresAt) {
                        this.pairingSessions.delete(sessionId);
                        
                        // Notify connected devices
                        this.broadcastToRoom(sessionId, {
                            type: 'session_expired',
                            sessionId
                        });
                    }
                }
                
                // Clean database
                await this.db.query(`
                    DELETE FROM pairing_sessions
                    WHERE expires_at < CURRENT_TIMESTAMP
                    AND status = 'pending'
                `);
                
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        }, 60000);
    }
    
    async serveDashboard(req, res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Cross-Device Authentication</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        :root {
            --primary: #4CAF50;
            --primary-dark: #388E3C;
            --secondary: #2196F3;
            --danger: #f44336;
            --background: #121212;
            --surface: #1E1E1E;
            --text: #FFFFFF;
            --text-secondary: #B0B0B0;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--background);
            color: var(--text);
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            margin-bottom: 40px;
            font-size: 2.5em;
            background: linear-gradient(45deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .card {
            background: var(--surface);
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s;
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }
        
        .card h2 {
            margin-bottom: 20px;
            color: var(--primary);
        }
        
        .qr-container {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            margin: 20px 0;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .qr-container img {
            max-width: 100%;
            height: auto;
        }
        
        .button {
            background: var(--primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
            width: 100%;
            margin-top: 10px;
        }
        
        .button:hover {
            background: var(--primary-dark);
        }
        
        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .button.secondary {
            background: var(--secondary);
        }
        
        .button.danger {
            background: var(--danger);
        }
        
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
            font-weight: 500;
        }
        
        .status.pending {
            background: rgba(255, 193, 7, 0.2);
            color: #FFC107;
            border: 1px solid #FFC107;
        }
        
        .status.success {
            background: rgba(76, 175, 80, 0.2);
            color: #4CAF50;
            border: 1px solid #4CAF50;
        }
        
        .status.error {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
            border: 1px solid #f44336;
        }
        
        .device-list {
            list-style: none;
            margin-top: 20px;
        }
        
        .device-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .device-info {
            flex: 1;
        }
        
        .device-name {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .device-meta {
            color: var(--text-secondary);
            font-size: 14px;
        }
        
        .countdown {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: var(--secondary);
        }
        
        .scanner-preview {
            background: #000;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
        }
        
        .approval-dialog {
            background: var(--surface);
            border: 2px solid var(--primary);
            border-radius: 12px;
            padding: 30px;
            margin: 20px 0;
            text-align: center;
        }
        
        .approval-dialog h3 {
            color: var(--primary);
            margin-bottom: 15px;
        }
        
        .approval-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 2em;
            }
        }
        
        .hidden {
            display: none;
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Soulfra Cross-Device Authentication</h1>
        
        <div class="grid">
            <!-- Desktop/Primary Device Card -->
            <div class="card">
                <h2>📱 Primary Device (Desktop)</h2>
                <p>Generate a QR code to pair with your mobile device</p>
                
                <div class="qr-container" id="qrContainer">
                    <div class="scanner-preview">
                        Click below to generate QR code
                    </div>
                </div>
                
                <div id="qrStatus" class="status hidden"></div>
                <div id="countdown" class="countdown hidden"></div>
                
                <button class="button" id="generateBtn" onclick="generateQR()">
                    Generate Pairing QR Code
                </button>
                
                <div id="approvalDialog" class="approval-dialog hidden">
                    <h3>Device Pairing Request</h3>
                    <p id="approvalDevice"></p>
                    <div class="approval-buttons">
                        <button class="button" onclick="approvePairing()">✅ Approve</button>
                        <button class="button danger" onclick="rejectPairing()">❌ Reject</button>
                    </div>
                </div>
            </div>
            
            <!-- Mobile/Scanner Device Card -->
            <div class="card">
                <h2>📱 Mobile Device (Scanner)</h2>
                <p>Scan QR code from your desktop to pair devices</p>
                
                <div class="scanner-preview" id="scannerPreview">
                    <p>Camera preview will appear here</p>
                    <small>Make sure to allow camera permissions</small>
                </div>
                
                <div id="scanStatus" class="status hidden"></div>
                
                <button class="button secondary" onclick="startScanner()">
                    📷 Start QR Scanner
                </button>
                
                <input type="text" id="manualCode" placeholder="Or enter code manually" 
                       style="width: 100%; padding: 10px; margin-top: 10px; 
                              background: rgba(255,255,255,0.1); border: 1px solid #444; 
                              border-radius: 4px; color: white;">
                <button class="button secondary" onclick="submitManualCode()">
                    Submit Code
                </button>
            </div>
            
            <!-- Device Management Card -->
            <div class="card">
                <h2>🔧 Paired Devices</h2>
                <p>Manage your trusted devices</p>
                
                <ul class="device-list" id="deviceList">
                    <li class="device-item">
                        <div class="device-info">
                            <div class="device-name">This Device</div>
                            <div class="device-meta">Primary • Trust: 100</div>
                        </div>
                        <button class="button danger" style="width: auto; padding: 8px 16px;" disabled>
                            Primary
                        </button>
                    </li>
                </ul>
                
                <button class="button secondary" onclick="refreshDevices()">
                    🔄 Refresh Device List
                </button>
            </div>
        </div>
        
        <!-- Connection Status -->
        <div class="card">
            <h2>🌐 Connection Status</h2>
            <div id="connectionStatus" class="status">
                <span id="wsStatus">Connecting to WebSocket...</span>
            </div>
            <p style="color: var(--text-secondary); margin-top: 10px;">
                WebSocket: ws://localhost:${this.wsPort}<br>
                API: http://localhost:${this.port}
            </p>
        </div>
    </div>
    
    <script>
        // Global variables
        let ws = null;
        let currentSessionId = null;
        let deviceId = localStorage.getItem('soulfra_device_id') || generateDeviceId();
        let countdownInterval = null;
        
        // Save device ID
        localStorage.setItem('soulfra_device_id', deviceId);
        
        // Generate device ID
        function generateDeviceId() {
            return 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        
        // Initialize WebSocket connection
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:${this.wsPort}');
            
            ws.onopen = () => {
                console.log('WebSocket connected');
                updateConnectionStatus('Connected', 'success');
                
                // Send device ready
                ws.send(JSON.stringify({
                    type: 'device_ready',
                    deviceId: deviceId
                }));
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                updateConnectionStatus('Connection error', 'error');
            };
            
            ws.onclose = () => {
                console.log('WebSocket disconnected');
                updateConnectionStatus('Disconnected - Retrying...', 'error');
                // Reconnect after 3 seconds
                setTimeout(initWebSocket, 3000);
            };
        }
        
        // Handle WebSocket messages
        function handleWebSocketMessage(data) {
            console.log('WebSocket message:', data);
            
            switch (data.type) {
                case 'connected':
                    console.log('Device registered:', data.deviceId);
                    break;
                    
                case 'pairing_request':
                    showApprovalDialog(data.scannerDevice);
                    break;
                    
                case 'pairing_approved':
                    handlePairingApproved(data);
                    break;
                    
                case 'pairing_rejected':
                    handlePairingRejected(data);
                    break;
                    
                case 'session_expired':
                    handleSessionExpired();
                    break;
                    
                case 'device_joined':
                    console.log('Device joined room:', data.deviceId);
                    break;
            }
        }
        
        // Generate QR code
        async function generateQR() {
            try {
                const btn = document.getElementById('generateBtn');
                btn.disabled = true;
                btn.textContent = 'Generating...';
                
                const response = await fetch('/api/device/generate-qr', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        deviceId: deviceId,
                        deviceName: getDeviceName(),
                        deviceType: 'desktop',
                        userId: getUserId()
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentSessionId = data.sessionId;
                    displayQR(data.qrCode);
                    startCountdown(data.expiresIn);
                    
                    // Join WebSocket room
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'join_pairing',
                            sessionId: currentSessionId
                        }));
                    }
                    
                    updateStatus('qrStatus', 'Waiting for device to scan...', 'pending');
                } else {
                    updateStatus('qrStatus', 'Error: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Generate QR error:', error);
                updateStatus('qrStatus', 'Error generating QR code', 'error');
            } finally {
                const btn = document.getElementById('generateBtn');
                btn.disabled = false;
                btn.textContent = 'Generate Pairing QR Code';
            }
        }
        
        // Display QR code
        function displayQR(qrDataUrl) {
            const container = document.getElementById('qrContainer');
            container.innerHTML = '<img src="' + qrDataUrl + '" alt="Pairing QR Code">';
            container.classList.add('fade-in');
        }
        
        // Start countdown timer
        function startCountdown(seconds) {
            const countdownEl = document.getElementById('countdown');
            countdownEl.classList.remove('hidden');
            
            clearInterval(countdownInterval);
            
            countdownInterval = setInterval(() => {
                if (seconds <= 0) {
                    clearInterval(countdownInterval);
                    countdownEl.textContent = 'Expired';
                    handleSessionExpired();
                    return;
                }
                
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                countdownEl.textContent = mins + ':' + secs.toString().padStart(2, '0');
                seconds--;
            }, 1000);
        }
        
        // Show approval dialog
        function showApprovalDialog(scannerDevice) {
            const dialog = document.getElementById('approvalDialog');
            const deviceInfo = document.getElementById('approvalDevice');
            
            deviceInfo.textContent = 'Device "' + (scannerDevice.name || 'Unknown Device') + 
                                   '" wants to pair with this device';
            
            dialog.classList.remove('hidden');
            dialog.classList.add('fade-in');
        }
        
        // Approve pairing
        async function approvePairing() {
            try {
                const response = await fetch('/api/device/approve', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: currentSessionId,
                        approverDeviceId: deviceId
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    updateStatus('qrStatus', 'Device paired successfully!', 'success');
                    document.getElementById('approvalDialog').classList.add('hidden');
                    refreshDevices();
                } else {
                    updateStatus('qrStatus', 'Error: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Approve error:', error);
                updateStatus('qrStatus', 'Error approving device', 'error');
            }
        }
        
        // Reject pairing
        async function rejectPairing() {
            try {
                const response = await fetch('/api/device/reject', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: currentSessionId,
                        reason: 'User rejected'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    updateStatus('qrStatus', 'Pairing rejected', 'error');
                    document.getElementById('approvalDialog').classList.add('hidden');
                }
            } catch (error) {
                console.error('Reject error:', error);
            }
        }
        
        // Handle pairing approved
        function handlePairingApproved(data) {
            updateStatus('scanStatus', 'Pairing approved! You are now connected.', 'success');
            if (data.authToken) {
                // Store auth token
                localStorage.setItem('soulfra_auth_token', data.authToken);
            }
            refreshDevices();
        }
        
        // Handle pairing rejected
        function handlePairingRejected(data) {
            updateStatus('scanStatus', 'Pairing rejected: ' + data.reason, 'error');
        }
        
        // Handle session expired
        function handleSessionExpired() {
            clearInterval(countdownInterval);
            updateStatus('qrStatus', 'Session expired. Please generate a new QR code.', 'error');
            document.getElementById('qrContainer').innerHTML = 
                '<div class="scanner-preview">Session expired</div>';
            document.getElementById('countdown').classList.add('hidden');
            currentSessionId = null;
        }
        
        // Update status display
        function updateStatus(elementId, message, type) {
            const statusEl = document.getElementById(elementId);
            statusEl.textContent = message;
            statusEl.className = 'status ' + type + ' fade-in';
            statusEl.classList.remove('hidden');
        }
        
        // Update connection status
        function updateConnectionStatus(message, type) {
            const statusEl = document.getElementById('wsStatus');
            statusEl.textContent = message;
            statusEl.parentElement.className = 'status ' + type;
        }
        
        // Get device name
        function getDeviceName() {
            const userAgent = navigator.userAgent;
            if (userAgent.includes('Windows')) return 'Windows PC';
            if (userAgent.includes('Mac')) return 'Mac';
            if (userAgent.includes('Linux')) return 'Linux PC';
            if (userAgent.includes('iPhone')) return 'iPhone';
            if (userAgent.includes('Android')) return 'Android';
            return 'Unknown Device';
        }
        
        // Get user ID (mock)
        function getUserId() {
            return localStorage.getItem('soulfra_user_id') || '1';
        }
        
        // Refresh device list
        async function refreshDevices() {
            try {
                const response = await fetch('/api/devices', {
                    headers: {
                        'X-User-ID': getUserId()
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displayDevices(data.devices);
                }
            } catch (error) {
                console.error('Refresh devices error:', error);
            }
        }
        
        // Display devices
        function displayDevices(devices) {
            const list = document.getElementById('deviceList');
            list.innerHTML = '';
            
            devices.forEach(device => {
                const item = document.createElement('li');
                item.className = 'device-item fade-in';
                
                const lastSeen = new Date(device.last_seen);
                const isOnline = (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;
                
                item.innerHTML = \`
                    <div class="device-info">
                        <div class="device-name">\${device.device_name}</div>
                        <div class="device-meta">
                            \${device.device_type} • Trust: \${device.trust_score} • 
                            \${isOnline ? '🟢 Online' : '🔴 Offline'}
                        </div>
                    </div>
                    <button class="button danger" style="width: auto; padding: 8px 16px;" 
                            onclick="removeDevice('\${device.device_id}')"
                            \${device.is_primary ? 'disabled' : ''}>
                        \${device.is_primary ? 'Primary' : 'Remove'}
                    </button>
                \`;
                
                list.appendChild(item);
            });
        }
        
        // Remove device
        async function removeDevice(deviceId) {
            if (!confirm('Are you sure you want to remove this device?')) return;
            
            try {
                const response = await fetch('/api/device/' + deviceId, {
                    method: 'DELETE',
                    headers: {
                        'X-User-ID': getUserId()
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    refreshDevices();
                }
            } catch (error) {
                console.error('Remove device error:', error);
            }
        }
        
        // Start QR scanner (mock for demo)
        function startScanner() {
            updateStatus('scanStatus', 'Scanner would open here on mobile device', 'pending');
            
            // Simulate scanning after 2 seconds
            setTimeout(() => {
                const mockQR = {
                    v: 1,
                    t: 'mock_token',
                    u: 'http://localhost:3334/pair/mock_session'
                };
                processScannedQR(JSON.stringify(mockQR));
            }, 2000);
        }
        
        // Process scanned QR
        async function processScannedQR(qrData) {
            try {
                const response = await fetch('/api/device/scan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        qrData: qrData,
                        scannerDeviceId: deviceId,
                        scannerDeviceName: getDeviceName()
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    updateStatus('scanStatus', data.message, 'pending');
                    
                    // Join pairing room
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'join_pairing',
                            sessionId: data.sessionId
                        }));
                    }
                } else {
                    updateStatus('scanStatus', 'Error: ' + data.error, 'error');
                }
            } catch (error) {
                console.error('Process scan error:', error);
                updateStatus('scanStatus', 'Error processing QR code', 'error');
            }
        }
        
        // Submit manual code
        function submitManualCode() {
            const code = document.getElementById('manualCode').value.trim();
            if (!code) {
                alert('Please enter a code');
                return;
            }
            
            // Process as QR data
            try {
                const qrData = JSON.parse(atob(code));
                processScannedQR(JSON.stringify(qrData));
            } catch (error) {
                updateStatus('scanStatus', 'Invalid code format', 'error');
            }
        }
        
        // Initialize on load
        window.onload = () => {
            initWebSocket();
            refreshDevices();
        };
    </script>
</body>
</html>
        `;
        
        res.send(html);
    }
}

// Start the service
if (require.main === module) {
    const auth = new SoulfraCrossDeviceAuth();
    
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        if (auth.db) {
            await auth.db.end();
        }
        process.exit(0);
    });
}

module.exports = SoulfraCrossDeviceAuth;