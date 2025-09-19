#!/usr/bin/env node

/**
 * PRNG API SERVER - Server-side Pseudorandom Number Generator
 * Provides deterministic random numbers via API calls
 * Supports device pairing, authentication, and drag-drop connections
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

class PRNGAPIServer {
    constructor() {
        this.app = express();
        this.port = 42000;
        this.server = null;
        this.wss = null;
        
        // PRNG state management
        this.prngStates = new Map(); // deviceId -> PRNG state
        this.devicePairs = new Map(); // deviceId -> paired devices
        this.activeSessions = new Map(); // sessionId -> session data
        
        // Device registry
        this.registeredDevices = new Map();
        this.pendingPairings = new Map();
        
        // Connection to RNG Layer
        this.rngLayerUrl = 'http://localhost:39000/status';
        
        console.log('🎲 PRNG API Server initializing...');
        this.initializeServer();
    }
    
    initializeServer() {
        // Middleware
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // API Routes
        this.setupAPIRoutes();
        
        // Create HTTP server
        this.server = http.createServer(this.app);
        
        // WebSocket for real-time device pairing
        this.wss = new WebSocket.Server({ server: this.server });
        this.setupWebSocket();
        
        // Start server
        this.server.listen(this.port, () => {
            console.log(`🎲 PRNG API Server running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket available on ws://localhost:${this.port}`);
            console.log(`🖱️ Drag-drop interface at http://localhost:${this.port}/device-pairing`);
        });
    }
    
    setupAPIRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'PRNG_API_SERVER',
                version: '1.0.0',
                uptime: process.uptime(),
                registeredDevices: this.registeredDevices.size,
                activeSessions: this.activeSessions.size
            });
        });
        
        // Register device
        this.app.post('/api/device/register', async (req, res) => {
            const { deviceName, deviceType, capabilities } = req.body;
            
            const deviceId = this.generateDeviceId();
            const deviceKey = this.generateDeviceKey();
            
            const device = {
                id: deviceId,
                name: deviceName || `Device-${deviceId.slice(0, 8)}`,
                type: deviceType || 'generic',
                capabilities: capabilities || ['random', 'pairing'],
                key: deviceKey,
                registeredAt: Date.now(),
                status: 'active',
                pairingCode: this.generatePairingCode()
            };
            
            this.registeredDevices.set(deviceId, device);
            this.initializePRNGState(deviceId);
            
            console.log(`📱 Device registered: ${device.name} (${deviceId})`);
            
            res.json({
                success: true,
                device: {
                    id: deviceId,
                    name: device.name,
                    pairingCode: device.pairingCode,
                    apiKey: deviceKey
                }
            });
        });
        
        // Generate random numbers
        this.app.post('/api/random', async (req, res) => {
            const { deviceId, count = 1, min = 0, max = 1, seed = null } = req.body;
            const apiKey = req.headers['x-api-key'];
            
            // Verify device
            if (!this.verifyDevice(deviceId, apiKey)) {
                return res.status(401).json({ error: 'Unauthorized device' });
            }
            
            // Generate random numbers
            const numbers = await this.generateRandomNumbers(deviceId, count, min, max, seed);
            
            res.json({
                success: true,
                deviceId,
                numbers,
                timestamp: Date.now(),
                deterministic: true,
                seed: seed || 'device-specific'
            });
        });
        
        // Get random bytes
        this.app.post('/api/random/bytes', async (req, res) => {
            const { deviceId, length = 32, encoding = 'hex' } = req.body;
            const apiKey = req.headers['x-api-key'];
            
            if (!this.verifyDevice(deviceId, apiKey)) {
                return res.status(401).json({ error: 'Unauthorized device' });
            }
            
            const bytes = await this.generateRandomBytes(deviceId, length);
            
            res.json({
                success: true,
                deviceId,
                bytes: bytes.toString(encoding),
                length,
                encoding,
                timestamp: Date.now()
            });
        });
        
        // Device pairing endpoints
        this.app.post('/api/device/pair/initiate', async (req, res) => {
            const { deviceId, targetPairingCode } = req.body;
            const apiKey = req.headers['x-api-key'];
            
            if (!this.verifyDevice(deviceId, apiKey)) {
                return res.status(401).json({ error: 'Unauthorized device' });
            }
            
            const pairingId = await this.initiatePairing(deviceId, targetPairingCode);
            
            res.json({
                success: true,
                pairingId,
                status: 'pending',
                message: 'Pairing request sent'
            });
        });
        
        // Accept pairing
        this.app.post('/api/device/pair/accept', async (req, res) => {
            const { deviceId, pairingId } = req.body;
            const apiKey = req.headers['x-api-key'];
            
            if (!this.verifyDevice(deviceId, apiKey)) {
                return res.status(401).json({ error: 'Unauthorized device' });
            }
            
            const result = await this.acceptPairing(deviceId, pairingId);
            
            res.json(result);
        });
        
        // List paired devices
        this.app.get('/api/device/:deviceId/pairs', async (req, res) => {
            const { deviceId } = req.params;
            const apiKey = req.headers['x-api-key'];
            
            if (!this.verifyDevice(deviceId, apiKey)) {
                return res.status(401).json({ error: 'Unauthorized device' });
            }
            
            const pairs = this.devicePairs.get(deviceId) || [];
            
            res.json({
                success: true,
                deviceId,
                pairedDevices: pairs.map(id => {
                    const device = this.registeredDevices.get(id);
                    return {
                        id,
                        name: device?.name,
                        type: device?.type,
                        status: device?.status
                    };
                })
            });
        });
        
        // Shared random generation between paired devices
        this.app.post('/api/random/shared', async (req, res) => {
            const { deviceId, targetDeviceId, count = 1, purpose = 'general' } = req.body;
            const apiKey = req.headers['x-api-key'];
            
            if (!this.verifyDevice(deviceId, apiKey)) {
                return res.status(401).json({ error: 'Unauthorized device' });
            }
            
            // Verify devices are paired
            const pairs = this.devicePairs.get(deviceId) || [];
            if (!pairs.includes(targetDeviceId)) {
                return res.status(403).json({ error: 'Devices not paired' });
            }
            
            // Generate shared deterministic random
            const sharedSeed = this.generateSharedSeed(deviceId, targetDeviceId, purpose);
            const numbers = await this.generateDeterministicNumbers(sharedSeed, count);
            
            res.json({
                success: true,
                sourceDevice: deviceId,
                targetDevice: targetDeviceId,
                numbers,
                purpose,
                timestamp: Date.now()
            });
        });
        
        // Serve drag-drop interface
        this.app.get('/device-pairing', (req, res) => {
            res.send(this.getDevicePairingHTML());
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const sessionId = uuidv4();
            console.log(`🔌 WebSocket connected: ${sessionId}`);
            
            const session = {
                id: sessionId,
                ws,
                deviceId: null,
                authenticated: false
            };
            
            this.activeSessions.set(sessionId, session);
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(session, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 WebSocket disconnected: ${sessionId}`);
                this.activeSessions.delete(sessionId);
            });
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'connected',
                sessionId,
                message: 'WebSocket connected to PRNG API'
            }));
        });
    }
    
    async handleWebSocketMessage(session, data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'authenticate':
                const { deviceId, apiKey } = payload;
                if (this.verifyDevice(deviceId, apiKey)) {
                    session.authenticated = true;
                    session.deviceId = deviceId;
                    session.ws.send(JSON.stringify({
                        type: 'authenticated',
                        deviceId,
                        message: 'Device authenticated'
                    }));
                    this.broadcastDeviceList();
                } else {
                    session.ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Authentication failed'
                    }));
                }
                break;
                
            case 'requestPairing':
                if (!session.authenticated) {
                    return session.ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Not authenticated'
                    }));
                }
                
                const pairingRequest = {
                    id: uuidv4(),
                    sourceDevice: session.deviceId,
                    targetDevice: payload.targetDeviceId,
                    timestamp: Date.now()
                };
                
                // Notify target device
                this.notifyDevice(payload.targetDeviceId, {
                    type: 'pairingRequest',
                    request: pairingRequest
                });
                
                break;
                
            case 'acceptPairing':
                if (!session.authenticated) {
                    return session.ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Not authenticated'
                    }));
                }
                
                const result = await this.completePairing(
                    payload.sourceDevice,
                    session.deviceId
                );
                
                // Notify both devices
                this.notifyDevice(payload.sourceDevice, {
                    type: 'pairingComplete',
                    pairedWith: session.deviceId
                });
                
                this.notifyDevice(session.deviceId, {
                    type: 'pairingComplete',
                    pairedWith: payload.sourceDevice
                });
                
                this.broadcastDeviceList();
                break;
                
            case 'getDeviceList':
                this.sendDeviceList(session);
                break;
        }
    }
    
    // PRNG Functions
    initializePRNGState(deviceId) {
        const device = this.registeredDevices.get(deviceId);
        if (!device) return;
        
        // Create deterministic seed from device ID and key
        const seedData = `${deviceId}:${device.key}:${Date.now()}`;
        const seed = crypto.createHash('sha256').update(seedData).digest();
        
        this.prngStates.set(deviceId, {
            seed,
            counter: 0,
            lastGenerated: null
        });
    }
    
    async generateRandomNumbers(deviceId, count, min, max, customSeed = null) {
        const state = this.prngStates.get(deviceId);
        if (!state) {
            throw new Error('Device PRNG not initialized');
        }
        
        const numbers = [];
        const seed = customSeed ? 
            crypto.createHash('sha256').update(customSeed).digest() : 
            state.seed;
        
        for (let i = 0; i < count; i++) {
            const input = Buffer.concat([
                seed,
                Buffer.from([state.counter >> 24, state.counter >> 16, state.counter >> 8, state.counter])
            ]);
            
            const hash = crypto.createHash('sha256').update(input).digest();
            const value = hash.readUInt32BE(0) / 0xFFFFFFFF; // 0-1
            
            // Scale to min-max range
            const scaled = min + (value * (max - min));
            numbers.push(scaled);
            
            state.counter++;
        }
        
        state.lastGenerated = Date.now();
        return numbers;
    }
    
    async generateRandomBytes(deviceId, length) {
        const state = this.prngStates.get(deviceId);
        if (!state) {
            throw new Error('Device PRNG not initialized');
        }
        
        const bytes = Buffer.alloc(length);
        let offset = 0;
        
        while (offset < length) {
            const input = Buffer.concat([
                state.seed,
                Buffer.from([state.counter >> 24, state.counter >> 16, state.counter >> 8, state.counter])
            ]);
            
            const hash = crypto.createHash('sha256').update(input).digest();
            const copyLength = Math.min(32, length - offset);
            hash.copy(bytes, offset, 0, copyLength);
            
            offset += copyLength;
            state.counter++;
        }
        
        state.lastGenerated = Date.now();
        return bytes;
    }
    
    generateDeterministicNumbers(seed, count) {
        const numbers = [];
        const seedBuffer = Buffer.isBuffer(seed) ? seed : Buffer.from(seed);
        
        for (let i = 0; i < count; i++) {
            const input = Buffer.concat([seedBuffer, Buffer.from([i])]);
            const hash = crypto.createHash('sha256').update(input).digest();
            const value = hash.readUInt32BE(0) / 0xFFFFFFFF;
            numbers.push(value);
        }
        
        return numbers;
    }
    
    // Device Management
    generateDeviceId() {
        return `dev_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
    
    generateDeviceKey() {
        return `dk_${crypto.randomBytes(32).toString('hex')}`;
    }
    
    generatePairingCode() {
        // Generate human-readable pairing code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            if (i === 4) code += '-';
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
    
    verifyDevice(deviceId, apiKey) {
        const device = this.registeredDevices.get(deviceId);
        return device && device.key === apiKey && device.status === 'active';
    }
    
    // Device Pairing
    async initiatePairing(sourceDeviceId, targetPairingCode) {
        // Find target device by pairing code
        let targetDeviceId = null;
        for (const [id, device] of this.registeredDevices) {
            if (device.pairingCode === targetPairingCode) {
                targetDeviceId = id;
                break;
            }
        }
        
        if (!targetDeviceId) {
            throw new Error('Invalid pairing code');
        }
        
        const pairingId = uuidv4();
        this.pendingPairings.set(pairingId, {
            sourceDevice: sourceDeviceId,
            targetDevice: targetDeviceId,
            initiatedAt: Date.now(),
            status: 'pending'
        });
        
        // Notify target device via WebSocket
        this.notifyDevice(targetDeviceId, {
            type: 'pairingRequest',
            pairingId,
            sourceDevice: sourceDeviceId,
            sourceName: this.registeredDevices.get(sourceDeviceId)?.name
        });
        
        return pairingId;
    }
    
    async acceptPairing(deviceId, pairingId) {
        const pairing = this.pendingPairings.get(pairingId);
        if (!pairing) {
            return { success: false, error: 'Invalid pairing ID' };
        }
        
        if (pairing.targetDevice !== deviceId) {
            return { success: false, error: 'Not authorized to accept this pairing' };
        }
        
        // Complete pairing
        await this.completePairing(pairing.sourceDevice, pairing.targetDevice);
        
        // Clean up
        this.pendingPairings.delete(pairingId);
        
        return {
            success: true,
            message: 'Devices paired successfully',
            pairedWith: pairing.sourceDevice
        };
    }
    
    async completePairing(deviceId1, deviceId2) {
        // Add to each device's pair list
        const pairs1 = this.devicePairs.get(deviceId1) || [];
        if (!pairs1.includes(deviceId2)) {
            pairs1.push(deviceId2);
            this.devicePairs.set(deviceId1, pairs1);
        }
        
        const pairs2 = this.devicePairs.get(deviceId2) || [];
        if (!pairs2.includes(deviceId1)) {
            pairs2.push(deviceId1);
            this.devicePairs.set(deviceId2, pairs2);
        }
        
        console.log(`🔗 Devices paired: ${deviceId1} ↔ ${deviceId2}`);
    }
    
    generateSharedSeed(deviceId1, deviceId2, purpose) {
        // Sort device IDs for consistent seed generation
        const [first, second] = [deviceId1, deviceId2].sort();
        const seedData = `${first}:${second}:${purpose}:${Date.now()}`;
        return crypto.createHash('sha256').update(seedData).digest();
    }
    
    // WebSocket helpers
    notifyDevice(deviceId, message) {
        for (const session of this.activeSessions.values()) {
            if (session.deviceId === deviceId && session.authenticated) {
                session.ws.send(JSON.stringify(message));
            }
        }
    }
    
    broadcastDeviceList() {
        for (const session of this.activeSessions.values()) {
            if (session.authenticated) {
                this.sendDeviceList(session);
            }
        }
    }
    
    sendDeviceList(session) {
        const devices = [];
        for (const [id, device] of this.registeredDevices) {
            const pairs = this.devicePairs.get(id) || [];
            devices.push({
                id,
                name: device.name,
                type: device.type,
                status: device.status,
                isPaired: pairs.includes(session.deviceId),
                isCurrentDevice: id === session.deviceId
            });
        }
        
        session.ws.send(JSON.stringify({
            type: 'deviceList',
            devices
        }));
    }
    
    // HTML Interface
    getDevicePairingHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PRNG Device Pairing - Drag & Drop Interface</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        h1 {
            font-size: 28px;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #00ff88, #00bbff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .container {
            flex: 1;
            display: flex;
            gap: 30px;
            padding: 30px;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
        }
        
        .panel {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(5px);
        }
        
        .devices-panel {
            flex: 1;
        }
        
        .pairing-panel {
            flex: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .status-panel {
            flex: 1;
        }
        
        h2 {
            font-size: 20px;
            margin-bottom: 20px;
            color: #00ff88;
        }
        
        .device-card {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            cursor: grab;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .device-card:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: #00ff88;
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
        }
        
        .device-card.dragging {
            opacity: 0.5;
            cursor: grabbing;
        }
        
        .device-card.paired {
            border-color: #00bbff;
            background: rgba(0, 187, 255, 0.1);
        }
        
        .device-card.current {
            border-color: #ff00ff;
            background: rgba(255, 0, 255, 0.1);
        }
        
        .device-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .device-id {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            font-family: monospace;
        }
        
        .device-status {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00ff88;
        }
        
        .pairing-zone {
            width: 300px;
            height: 300px;
            border: 3px dashed rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.3s ease;
        }
        
        .pairing-zone.active {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
            70% { box-shadow: 0 0 0 20px rgba(0, 255, 136, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
        }
        
        .drop-message {
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            pointer-events: none;
        }
        
        .pairing-device {
            position: absolute;
            width: 100px;
            height: 100px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            text-align: center;
            padding: 10px;
        }
        
        .pairing-device.source {
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .pairing-device.target {
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .log-entry {
            font-family: monospace;
            font-size: 12px;
            padding: 8px;
            margin-bottom: 5px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
            border-left: 3px solid #00ff88;
        }
        
        .log-entry.error {
            border-left-color: #ff4444;
            color: #ff6666;
        }
        
        .log-entry.success {
            border-left-color: #00ff88;
            color: #00ff88;
        }
        
        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        button {
            background: linear-gradient(135deg, #00ff88, #00bbff);
            border: none;
            color: #0f0f23;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.5);
        }
        
        input {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            padding: 10px 15px;
            border-radius: 25px;
            outline: none;
            transition: all 0.3s ease;
        }
        
        input:focus {
            border-color: #00ff88;
            background: rgba(255, 255, 255, 0.15);
        }
        
        .connection-line {
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00ff88, transparent);
            transform-origin: left center;
            pointer-events: none;
            animation: flow 2s linear infinite;
        }
        
        @keyframes flow {
            0% { background-position: -100% 0; }
            100% { background-position: 100% 0; }
        }
        
        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 20px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #00ff88;
        }
        
        .stat-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <header>
        <h1>🎲 PRNG Device Pairing Interface</h1>
        <p>Drag devices to the pairing zone to establish secure connections</p>
    </header>
    
    <div class="container">
        <div class="panel devices-panel">
            <h2>Available Devices</h2>
            <div class="controls">
                <input type="text" id="deviceName" placeholder="Device name...">
                <button onclick="registerDevice()">Register</button>
            </div>
            <div id="deviceList"></div>
        </div>
        
        <div class="panel pairing-panel">
            <h2>Pairing Zone</h2>
            <div class="pairing-zone" id="pairingZone">
                <div class="drop-message">Drop devices here to pair</div>
            </div>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value" id="totalDevices">0</div>
                    <div class="stat-label">Total Devices</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalPairs">0</div>
                    <div class="stat-label">Active Pairs</div>
                </div>
            </div>
        </div>
        
        <div class="panel status-panel">
            <h2>Activity Log</h2>
            <div id="activityLog"></div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let currentDevice = null;
        let devices = new Map();
        let draggedDevice = null;
        
        // Initialize WebSocket connection
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:42000');
            
            ws.onopen = () => {
                addLog('Connected to PRNG API Server', 'success');
                
                // Auto-register if we have a saved device
                const savedDevice = localStorage.getItem('prngDevice');
                if (savedDevice) {
                    const device = JSON.parse(savedDevice);
                    currentDevice = device;
                    authenticate(device.id, device.apiKey);
                } else {
                    // Auto-register new device
                    registerDevice();
                }
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onerror = (error) => {
                addLog('WebSocket error: ' + error, 'error');
            };
            
            ws.onclose = () => {
                addLog('Disconnected from server', 'error');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'connected':
                    addLog('Session established: ' + data.sessionId);
                    break;
                    
                case 'authenticated':
                    addLog('Device authenticated: ' + data.deviceId, 'success');
                    break;
                    
                case 'deviceList':
                    updateDeviceList(data.devices);
                    break;
                    
                case 'pairingRequest':
                    handlePairingRequest(data);
                    break;
                    
                case 'pairingComplete':
                    addLog(\`Paired with device: \${data.pairedWith}\`, 'success');
                    ws.send(JSON.stringify({ type: 'getDeviceList' }));
                    break;
                    
                case 'error':
                    addLog('Error: ' + data.message, 'error');
                    break;
            }
        }
        
        async function registerDevice() {
            const name = document.getElementById('deviceName').value || 
                         'Device-' + Math.random().toString(36).substr(2, 9);
            
            try {
                const response = await fetch('/api/device/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceName: name,
                        deviceType: 'browser',
                        capabilities: ['random', 'pairing', 'websocket']
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    currentDevice = result.device;
                    localStorage.setItem('prngDevice', JSON.stringify(currentDevice));
                    addLog(\`Device registered: \${currentDevice.name} (Pairing code: \${currentDevice.pairingCode})\`, 'success');
                    
                    // Authenticate WebSocket
                    authenticate(currentDevice.id, currentDevice.apiKey);
                    
                    document.getElementById('deviceName').value = '';
                }
            } catch (error) {
                addLog('Registration failed: ' + error.message, 'error');
            }
        }
        
        function authenticate(deviceId, apiKey) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'authenticate',
                    payload: { deviceId, apiKey }
                }));
            }
        }
        
        function updateDeviceList(deviceList) {
            devices.clear();
            deviceList.forEach(device => devices.set(device.id, device));
            
            const container = document.getElementById('deviceList');
            container.innerHTML = '';
            
            let pairCount = 0;
            
            deviceList.forEach(device => {
                const card = createDeviceCard(device);
                container.appendChild(card);
                
                if (device.isPaired) pairCount++;
            });
            
            // Update stats
            document.getElementById('totalDevices').textContent = deviceList.length;
            document.getElementById('totalPairs').textContent = Math.floor(pairCount / 2);
        }
        
        function createDeviceCard(device) {
            const card = document.createElement('div');
            card.className = 'device-card';
            if (device.isCurrentDevice) card.classList.add('current');
            if (device.isPaired) card.classList.add('paired');
            
            card.draggable = !device.isCurrentDevice;
            card.dataset.deviceId = device.id;
            
            card.innerHTML = \`
                <div class="device-status"></div>
                <div class="device-name">\${device.name}</div>
                <div class="device-id">\${device.id.slice(0, 16)}...</div>
                <div style="font-size: 11px; margin-top: 5px; color: rgba(255,255,255,0.5)">
                    \${device.isCurrentDevice ? 'This Device' : ''}
                    \${device.isPaired ? '🔗 Paired' : ''}
                </div>
            \`;
            
            // Drag events
            card.addEventListener('dragstart', (e) => {
                if (!device.isCurrentDevice) {
                    draggedDevice = device;
                    e.target.classList.add('dragging');
                }
            });
            
            card.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                draggedDevice = null;
            });
            
            return card;
        }
        
        // Pairing zone drag events
        const pairingZone = document.getElementById('pairingZone');
        
        pairingZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedDevice) {
                pairingZone.classList.add('active');
            }
        });
        
        pairingZone.addEventListener('dragleave', () => {
            pairingZone.classList.remove('active');
        });
        
        pairingZone.addEventListener('drop', (e) => {
            e.preventDefault();
            pairingZone.classList.remove('active');
            
            if (draggedDevice && currentDevice) {
                initiatePairing(draggedDevice);
            }
        });
        
        function initiatePairing(targetDevice) {
            addLog(\`Initiating pairing with \${targetDevice.name}...\`);
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'requestPairing',
                    payload: { targetDeviceId: targetDevice.id }
                }));
                
                // Visual feedback
                showPairingAnimation(currentDevice, targetDevice);
            }
        }
        
        function handlePairingRequest(data) {
            const sourceDevice = devices.get(data.request.sourceDevice);
            if (sourceDevice) {
                addLog(\`Pairing request from \${sourceDevice.name}\`);
                
                // Auto-accept for demo (in real app, show confirmation)
                if (confirm(\`Accept pairing request from \${sourceDevice.name}?\`)) {
                    ws.send(JSON.stringify({
                        type: 'acceptPairing',
                        payload: { sourceDevice: data.request.sourceDevice }
                    }));
                }
            }
        }
        
        function showPairingAnimation(device1, device2) {
            // Clear existing animations
            pairingZone.querySelectorAll('.pairing-device').forEach(el => el.remove());
            
            const sourceEl = document.createElement('div');
            sourceEl.className = 'pairing-device source';
            sourceEl.textContent = device1.name;
            
            const targetEl = document.createElement('div');
            targetEl.className = 'pairing-device target';
            targetEl.textContent = device2.name;
            
            pairingZone.appendChild(sourceEl);
            pairingZone.appendChild(targetEl);
            
            // Remove after animation
            setTimeout(() => {
                sourceEl.remove();
                targetEl.remove();
            }, 3000);
        }
        
        function addLog(message, type = 'info') {
            const log = document.getElementById('activityLog');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            
            const timestamp = new Date().toLocaleTimeString();
            entry.textContent = \`[\${timestamp}] \${message}\`;
            
            log.insertBefore(entry, log.firstChild);
            
            // Keep only last 20 entries
            while (log.children.length > 20) {
                log.removeChild(log.lastChild);
            }
        }
        
        // Test PRNG generation
        async function testRandomGeneration() {
            if (!currentDevice) {
                addLog('No device registered', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/random', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': currentDevice.apiKey
                    },
                    body: JSON.stringify({
                        deviceId: currentDevice.id,
                        count: 5,
                        min: 0,
                        max: 100
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    addLog(\`Generated: \${result.numbers.map(n => n.toFixed(2)).join(', ')}\`, 'success');
                }
            } catch (error) {
                addLog('Random generation failed: ' + error.message, 'error');
            }
        }
        
        // Initialize
        connectWebSocket();
        
        // Add test button
        const header = document.querySelector('header');
        const testBtn = document.createElement('button');
        testBtn.textContent = 'Test PRNG';
        testBtn.onclick = testRandomGeneration;
        testBtn.style.marginTop = '10px';
        header.appendChild(testBtn);
    </script>
</body>
</html>`;
    }
}

// Start the server
const server = new PRNGAPIServer();

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🎲 PRNG API Server shutting down...');
    if (server.server) {
        server.server.close();
    }
    process.exit(0);
});

module.exports = PRNGAPIServer;