#!/usr/bin/env node

/**
 * BlameChain Interface Lite
 * Connects all layers to write results to the blamechain
 * Simplified version without Web3 dependency
 */

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class BlameChainInterfaceLite extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 48011;
        this.wsPort = 48012;
        
        // Local storage instead of blockchain
        this.discoveryJourney = [];
        this.handshakeAgreements = [];
        this.narratives = [];
        this.blameRecords = [];
        this.observerConnections = new Map();
        
        console.log('⛓️ BLAMECHAIN INTERFACE LITE');
        console.log('==========================');
        console.log('📝 Recording layer observations');
        console.log('🤝 Tracking handshake agreements');
        console.log('📖 Storing narrative history');
        console.log('👁️ Connecting observer layers');
        console.log('');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServices();
        this.connectToObservers();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }
    
    setupRoutes() {
        // Observer registration
        this.app.post('/api/register/observer', this.registerObserver.bind(this));
        this.app.get('/api/observers', this.getObservers.bind(this));
        
        // Recording endpoints
        this.app.post('/api/record/observation', this.recordObservation.bind(this));
        this.app.post('/api/record/discovery', this.recordDiscovery.bind(this));
        this.app.post('/api/record/handshake', this.recordHandshake.bind(this));
        this.app.post('/api/record/narrative', this.recordNarrative.bind(this));
        this.app.post('/api/record/blame', this.recordBlame.bind(this));
        
        // Query endpoints
        this.app.get('/api/journey', this.getDiscoveryJourney.bind(this));
        this.app.get('/api/observations/:layer', this.getLayerObservations.bind(this));
        this.app.get('/api/handshakes', this.getHandshakes.bind(this));
        this.app.get('/api/narratives', this.getNarratives.bind(this));
        this.app.get('/api/blame/report', this.getBlameReport.bind(this));
        
        // System status
        this.app.get('/api/status', this.getSystemStatus.bind(this));
        this.app.get('/api/layer-connections', this.getLayerConnections.bind(this));
    }
    
    startServices() {
        // HTTP API
        this.app.listen(this.port, () => {
            console.log(`⛓️ BlameChain API: http://localhost:${this.port}`);
        });
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🔌 Observer connected');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWSMessage(ws, data);
                } catch (error) {
                    console.error('Invalid message:', error);
                }
            });
            
            ws.on('close', () => {
                // Remove from observer connections
                this.observerConnections.forEach((connection, id) => {
                    if (connection.ws === ws) {
                        this.observerConnections.delete(id);
                        console.log(`👁️ Observer ${id} disconnected`);
                    }
                });
            });
        });
        
        console.log(`🔌 BlameChain WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    connectToObservers() {
        console.log('📡 Connecting to observer systems...');
        
        // Connect to Multi-Observer Verification System
        this.connectToObserver('multi-observer', 'ws://localhost:9877');
        
        // Connect to core BlameChain
        this.connectToObserver('blamechain-core', 'ws://localhost:48000');
        
        // Connect to other layers if available
        this.connectToObserver('dashboard-layer', 'ws://localhost:8081');
        this.connectToObserver('gaming-layer', 'ws://localhost:8501');
    }
    
    connectToObserver(id, url) {
        try {
            const ws = new WebSocket(url);
            
            ws.on('open', () => {
                console.log(`✅ Connected to ${id}`);
                this.observerConnections.set(id, {
                    ws,
                    url,
                    connected: true,
                    lastSeen: new Date()
                });
                
                // Register as observer
                ws.send(JSON.stringify({
                    type: 'register',
                    observer: 'blamechain-interface',
                    capabilities: ['record', 'query', 'broadcast']
                }));
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.processObserverMessage(id, message);
                } catch (error) {
                    console.error(`Error processing message from ${id}:`, error);
                }
            });
            
            ws.on('error', (error) => {
                console.warn(`⚠️ ${id} connection error:`, error.code);
                if (this.observerConnections.has(id)) {
                    this.observerConnections.get(id).connected = false;
                }
            });
            
            ws.on('close', () => {
                console.log(`❌ ${id} disconnected`);
                if (this.observerConnections.has(id)) {
                    this.observerConnections.get(id).connected = false;
                }
                // Retry connection after 5 seconds
                setTimeout(() => this.connectToObserver(id, url), 5000);
            });
        } catch (error) {
            console.error(`Failed to connect to ${id}:`, error);
            // Retry after 5 seconds
            setTimeout(() => this.connectToObserver(id, url), 5000);
        }
    }
    
    processObserverMessage(observerId, message) {
        switch (message.type) {
            case 'observation':
                this.recordObservation({
                    body: {
                        observer: observerId,
                        ...message.data
                    }
                }, { json: () => {}, status: () => ({ json: () => {} }) });
                break;
                
            case 'verification':
                this.recordHandshake({
                    body: {
                        observer: observerId,
                        verified: message.verified,
                        ...message.data
                    }
                }, { json: () => {}, status: () => ({ json: () => {} }) });
                break;
                
            case 'blame':
                this.recordBlame({
                    body: {
                        blamer: observerId,
                        ...message.data
                    }
                }, { json: () => {}, status: () => ({ json: () => {} }) });
                break;
        }
    }
    
    registerObserver(req, res) {
        const { observerId, capabilities, endpoint } = req.body;
        
        this.observerConnections.set(observerId, {
            id: observerId,
            capabilities,
            endpoint,
            registeredAt: new Date(),
            connected: false
        });
        
        console.log(`📋 Registered observer: ${observerId}`);
        
        res.json({
            success: true,
            observerId,
            message: 'Observer registered successfully'
        });
    }
    
    getObservers(req, res) {
        const observers = [];
        
        this.observerConnections.forEach((connection, id) => {
            observers.push({
                id,
                connected: connection.connected,
                lastSeen: connection.lastSeen,
                capabilities: connection.capabilities
            });
        });
        
        res.json({ observers });
    }
    
    recordObservation(req, res) {
        const observation = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...req.body
        };
        
        this.discoveryJourney.push(observation);
        
        // Broadcast to all connected observers
        this.broadcastUpdate({
            type: 'new_observation',
            observation
        });
        
        console.log(`👁️ Recorded observation from ${observation.observer || 'unknown'}`);
        
        res.json({
            success: true,
            observationId: observation.id
        });
    }
    
    recordDiscovery(req, res) {
        const discovery = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...req.body
        };
        
        this.discoveryJourney.push(discovery);
        
        this.broadcastUpdate({
            type: 'new_discovery',
            discovery
        });
        
        console.log(`🔍 Recorded discovery: ${discovery.serviceName || discovery.component}`);
        
        res.json({
            success: true,
            discoveryId: discovery.id
        });
    }
    
    recordHandshake(req, res) {
        const handshake = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...req.body
        };
        
        this.handshakeAgreements.push(handshake);
        
        this.broadcastUpdate({
            type: 'new_handshake',
            handshake
        });
        
        console.log(`🤝 Recorded handshake: ${handshake.serviceA} <-> ${handshake.serviceB}`);
        
        res.json({
            success: true,
            handshakeId: handshake.id
        });
    }
    
    recordNarrative(req, res) {
        const narrative = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...req.body
        };
        
        this.narratives.push(narrative);
        
        this.broadcastUpdate({
            type: 'new_narrative',
            narrative
        });
        
        console.log(`📖 Recorded narrative: ${narrative.phase || 'general'}`);
        
        res.json({
            success: true,
            narrativeId: narrative.id
        });
    }
    
    recordBlame(req, res) {
        const blame = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...req.body
        };
        
        this.blameRecords.push(blame);
        
        this.broadcastUpdate({
            type: 'new_blame',
            blame
        });
        
        console.log(`🎯 Recorded blame: ${blame.blamer} → ${blame.blamed}`);
        
        res.json({
            success: true,
            blameId: blame.id
        });
    }
    
    getDiscoveryJourney(req, res) {
        res.json({
            totalDiscoveries: this.discoveryJourney.length,
            journey: this.discoveryJourney.slice(-100) // Last 100 entries
        });
    }
    
    getLayerObservations(req, res) {
        const { layer } = req.params;
        
        const observations = this.discoveryJourney.filter(obs => 
            obs.layer === layer || obs.observer === layer
        );
        
        res.json({
            layer,
            totalObservations: observations.length,
            observations: observations.slice(-50) // Last 50
        });
    }
    
    getHandshakes(req, res) {
        res.json({
            totalHandshakes: this.handshakeAgreements.length,
            handshakes: this.handshakeAgreements.slice(-50)
        });
    }
    
    getNarratives(req, res) {
        res.json({
            totalNarratives: this.narratives.length,
            narratives: this.narratives.slice(-50)
        });
    }
    
    getBlameReport(req, res) {
        const blameStats = {};
        
        this.blameRecords.forEach(blame => {
            if (!blameStats[blame.blamed]) {
                blameStats[blame.blamed] = {
                    totalBlames: 0,
                    blamers: new Set(),
                    reasons: []
                };
            }
            
            blameStats[blame.blamed].totalBlames++;
            blameStats[blame.blamed].blamers.add(blame.blamer);
            blameStats[blame.blamed].reasons.push(blame.reason);
        });
        
        // Convert Sets to arrays for JSON
        Object.keys(blameStats).forEach(blamed => {
            blameStats[blamed].blamers = Array.from(blameStats[blamed].blamers);
        });
        
        res.json({
            totalBlames: this.blameRecords.length,
            blameStats,
            recentBlames: this.blameRecords.slice(-20)
        });
    }
    
    getSystemStatus(req, res) {
        const connectedObservers = Array.from(this.observerConnections.values())
            .filter(conn => conn.connected).length;
        
        res.json({
            status: 'operational',
            uptime: process.uptime(),
            connections: {
                total: this.observerConnections.size,
                connected: connectedObservers,
                disconnected: this.observerConnections.size - connectedObservers
            },
            records: {
                discoveries: this.discoveryJourney.length,
                handshakes: this.handshakeAgreements.length,
                narratives: this.narratives.length,
                blames: this.blameRecords.length
            },
            websocketClients: this.wss.clients.size
        });
    }
    
    getLayerConnections(req, res) {
        const connections = [];
        
        this.observerConnections.forEach((connection, id) => {
            connections.push({
                id,
                connected: connection.connected,
                lastSeen: connection.lastSeen,
                url: connection.url,
                capabilities: connection.capabilities
            });
        });
        
        res.json({ connections });
    }
    
    handleWSMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                ws.isSubscribed = true;
                ws.subscribedTopics = data.topics || ['all'];
                break;
                
            case 'register_observer':
                ws.observerId = data.observerId;
                this.observerConnections.set(data.observerId, {
                    ws,
                    id: data.observerId,
                    connected: true,
                    lastSeen: new Date()
                });
                console.log(`👁️ WebSocket observer registered: ${data.observerId}`);
                break;
                
            case 'get_status':
                this.getSystemStatus({}, {
                    json: (data) => ws.send(JSON.stringify({ type: 'status', data })),
                    status: () => ({ json: () => {} })
                });
                break;
        }
    }
    
    broadcastUpdate(update) {
        // Broadcast to WebSocket clients
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.isSubscribed) {
                client.send(JSON.stringify(update));
            }
        });
        
        // Also emit as event
        this.emit('update', update);
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Save state periodically
    saveState() {
        const state = {
            discoveryJourney: this.discoveryJourney,
            handshakeAgreements: this.handshakeAgreements,
            narratives: this.narratives,
            blameRecords: this.blameRecords,
            lastSaved: new Date().toISOString()
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'blamechain-interface-state.json'),
            JSON.stringify(state, null, 2)
        );
    }
    
    loadState() {
        try {
            const stateFile = path.join(__dirname, 'blamechain-interface-state.json');
            if (fs.existsSync(stateFile)) {
                const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                this.discoveryJourney = state.discoveryJourney || [];
                this.handshakeAgreements = state.handshakeAgreements || [];
                this.narratives = state.narratives || [];
                this.blameRecords = state.blameRecords || [];
                console.log('📂 Loaded previous state');
            }
        } catch (error) {
            console.warn('⚠️ Could not load state:', error.message);
        }
    }
}

// Auto-start if run directly
if (require.main === module) {
    const blamechain = new BlameChainInterfaceLite();
    
    // Load previous state
    blamechain.loadState();
    
    // Save state every 30 seconds
    setInterval(() => blamechain.saveState(), 30000);
    
    console.log('');
    console.log('📋 BlameChain Interface Features:');
    console.log('   • Records observations from all layers');
    console.log('   • Tracks handshake agreements');
    console.log('   • Stores narrative history');
    console.log('   • Manages blame/praise records');
    console.log('   • Connects multiple observer systems');
    console.log('');
    console.log('🔗 Connected Systems:');
    console.log('   • Multi-Observer Verification (port 9877)');
    console.log('   • BlameChain Core (port 48000)');
    console.log('   • Dashboard Layer (port 8081)');
    console.log('   • Gaming Layer (port 8501)');
    console.log('');
    console.log('📡 API Endpoints:');
    console.log('   • POST /api/record/observation');
    console.log('   • POST /api/record/discovery');
    console.log('   • POST /api/record/handshake');
    console.log('   • POST /api/record/blame');
    console.log('   • GET /api/journey');
    console.log('   • GET /api/status');
}

module.exports = BlameChainInterfaceLite;