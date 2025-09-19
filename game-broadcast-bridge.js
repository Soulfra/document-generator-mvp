#!/usr/bin/env node

/**
 * Game Broadcast Bridge
 * Connects the blockchain analysis game to Solidity smart contracts
 * Records all game events and broadcasts immutably on-chain
 */

const Web3 = require('web3');
const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');

class GameBroadcastBridge {
    constructor() {
        this.app = express();
        this.port = 48017;
        this.wsPort = 48018;
        
        // Web3 setup
        this.web3 = new Web3('http://localhost:8545');
        this.contract = null;
        this.contractAddress = null;
        
        // Game session tracking
        this.activeSessions = new Map();
        this.broadcastQueue = [];
        this.isRecording = false;
        
        // WebSocket connections to game systems
        this.gameConnections = new Map();
        
        console.log('🎮 GAME BROADCAST BRIDGE');
        console.log('========================');
        console.log('🎯 Recording game events on blockchain');
        console.log('⛓️ Wrapping broadcasts in Solidity');
        console.log('📊 Immutable game state storage');
        console.log('🔗 Real-time blockchain integration');
        console.log('');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServices();
        this.connectToGameSystems();
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            next();
        });
    }
    
    setupRoutes() {
        // Contract management
        this.app.post('/api/deploy-game-contract', this.deployGameContract.bind(this));
        this.app.get('/api/contract-status', this.getContractStatus.bind(this));
        
        // Game session management
        this.app.post('/api/start-game-session', this.startGameSession.bind(this));
        this.app.post('/api/end-game-session', this.endGameSession.bind(this));
        this.app.get('/api/game-session/:sessionId', this.getGameSession.bind(this));
        
        // Event recording
        this.app.post('/api/record-interaction', this.recordInteraction.bind(this));
        this.app.post('/api/record-data-packet', this.recordDataPacket.bind(this));
        this.app.post('/api/record-discovery', this.recordDiscovery.bind(this));
        this.app.post('/api/record-narrative', this.recordNarrative.bind(this));
        this.app.post('/api/snapshot-state', this.snapshotGameState.bind(this));
        
        // Batch operations
        this.app.post('/api/batch-record', this.batchRecord.bind(this));
        
        // Analytics
        this.app.get('/api/session-broadcasts/:sessionId', this.getSessionBroadcasts.bind(this));
        this.app.get('/api/player-sessions/:address', this.getPlayerSessions.bind(this));
        this.app.get('/api/broadcast-stats', this.getBroadcastStats.bind(this));
    }
    
    startServices() {
        // HTTP API
        this.app.listen(this.port, () => {
            console.log(`🎮 Game Broadcast API: http://localhost:${this.port}`);
        });
        
        // WebSocket for real-time game events
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🔌 Game client connected');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleGameMessage(ws, data);
            });
        });
        
        console.log(`🔌 Game Broadcast WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    async connectToGameSystems() {
        console.log('🔗 Connecting to game systems...');
        
        // Connect to Meta Layer
        this.connectToSystem('meta-layer', 'ws://localhost:48016');
        
        // Connect to Monero Explorer  
        this.connectToSystem('monero-explorer', 'ws://localhost:48014');
        
        // Connect to BlameChain
        this.connectToSystem('blamechain-interface', 'ws://localhost:48012');
        
        // Connect to Handshake Layer
        this.connectToSystem('handshake-layer', 'ws://localhost:48010');
    }
    
    connectToSystem(systemName, wsUrl) {
        try {
            const ws = new WebSocket(wsUrl);
            
            ws.on('open', () => {
                console.log(`✅ Connected to ${systemName}`);
                this.gameConnections.set(systemName, ws);
                
                // Request to monitor all events
                ws.send(JSON.stringify({
                    type: 'register_game_monitor',
                    source: 'game_broadcast_bridge'
                }));
            });
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.processSystemEvent(systemName, message);
            });
            
            ws.on('error', (error) => {
                console.error(`❌ ${systemName} connection error:`, error.message);
            });
            
            ws.on('close', () => {
                console.log(`🔌 ${systemName} connection closed`);
                this.gameConnections.delete(systemName);
                
                // Attempt to reconnect
                setTimeout(() => {
                    this.connectToSystem(systemName, wsUrl);
                }, 5000);
            });
            
        } catch (error) {
            console.error(`Failed to connect to ${systemName}:`, error);
        }
    }
    
    async deployGameContract(req, res) {
        try {
            console.log('📄 Deploying GameBroadcastRegistry contract...');
            
            const accounts = await this.web3.eth.getAccounts();
            if (accounts.length === 0) {
                return res.status(400).json({ error: 'No accounts available' });
            }
            
            // Load contract ABI and bytecode
            const contractData = JSON.parse(fs.readFileSync('./contracts/GameBroadcastRegistry.json', 'utf8'));
            
            const GameBroadcastRegistry = new this.web3.eth.Contract(contractData.abi);
            
            const deployedContract = await GameBroadcastRegistry.deploy({
                data: contractData.bytecode
            }).send({
                from: accounts[0],
                gas: 6000000,
                gasPrice: await this.web3.eth.getGasPrice()
            });
            
            this.contract = deployedContract;
            this.contractAddress = deployedContract.options.address;
            
            console.log(`✅ Contract deployed: ${this.contractAddress}`);
            
            res.json({
                success: true,
                contractAddress: this.contractAddress,
                deployedBy: accounts[0]
            });
            
        } catch (error) {
            console.error('❌ Deployment error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async startGameSession(req, res) {
        try {
            const { playerAddress } = req.body;
            
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contract.methods.startGameSession(
                playerAddress || accounts[0]
            ).send({
                from: accounts[0],
                gas: 500000
            });
            
            // Extract session ID from event
            const sessionId = tx.events.GameSessionStarted.returnValues.sessionId;
            
            // Track session locally
            this.activeSessions.set(sessionId, {
                playerAddress: playerAddress || accounts[0],
                startTime: Date.now(),
                interactions: 0,
                broadcasts: 0
            });
            
            console.log(`🎮 Game session started: ${sessionId}`);
            
            res.json({
                success: true,
                sessionId: sessionId,
                transactionHash: tx.transactionHash,
                playerAddress: playerAddress || accounts[0]
            });
            
        } catch (error) {
            console.error('❌ Session start error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async recordInteraction(req, res) {
        try {
            const { 
                sessionId, 
                playerAddress, 
                serviceName, 
                interactionType, 
                scoreGained, 
                additionalData 
            } = req.body;
            
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contract.methods.recordServiceInteraction(
                sessionId,
                playerAddress || accounts[0],
                serviceName,
                interactionType,
                scoreGained || 0,
                this.web3.utils.asciiToHex(additionalData || '')
            ).send({
                from: accounts[0],
                gas: 300000
            });
            
            // Update local tracking
            if (this.activeSessions.has(sessionId)) {
                this.activeSessions.get(sessionId).interactions++;
            }
            
            console.log(`🎯 Interaction recorded: ${serviceName} - ${interactionType}`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash
            });
            
            // Broadcast to connected game clients
            this.broadcastToClients({
                type: 'interaction_recorded',
                sessionId: sessionId,
                serviceName: serviceName,
                interactionType: interactionType,
                scoreGained: scoreGained
            });
            
        } catch (error) {
            console.error('❌ Interaction recording error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async recordDataPacket(req, res) {
        try {
            const { sessionId, fromService, toService, packetType, packetData } = req.body;
            
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contract.methods.recordDataPacket(
                sessionId,
                fromService,
                toService,
                packetType,
                this.web3.utils.asciiToHex(packetData || '')
            ).send({
                from: accounts[0],
                gas: 300000
            });
            
            console.log(`📦 Data packet recorded: ${fromService} → ${toService}`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash
            });
            
            // Broadcast to game clients
            this.broadcastToClients({
                type: 'data_packet_recorded',
                sessionId: sessionId,
                fromService: fromService,
                toService: toService,
                packetType: packetType
            });
            
        } catch (error) {
            console.error('❌ Data packet recording error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async recordDiscovery(req, res) {
        try {
            const { sessionId, playerAddress, servicesDiscovered, totalScore } = req.body;
            
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contract.methods.recordDiscovery(
                sessionId,
                playerAddress || accounts[0],
                servicesDiscovered || [],
                totalScore || 0
            ).send({
                from: accounts[0],
                gas: 400000
            });
            
            console.log(`🔍 Discovery recorded: ${servicesDiscovered.length} services`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash
            });
            
        } catch (error) {
            console.error('❌ Discovery recording error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async recordNarrative(req, res) {
        try {
            const { sessionId, serviceType, narrative } = req.body;
            
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contract.methods.recordNarrative(
                sessionId,
                serviceType,
                narrative
            ).send({
                from: accounts[0],
                gas: 200000
            });
            
            console.log(`📖 Narrative recorded: ${serviceType}`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash
            });
            
            // Broadcast to game clients
            this.broadcastToClients({
                type: 'narrative_recorded',
                sessionId: sessionId,
                serviceType: serviceType,
                narrative: narrative
            });
            
        } catch (error) {
            console.error('❌ Narrative recording error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async snapshotGameState(req, res) {
        try {
            const { 
                sessionId, 
                level, 
                score, 
                discoveries, 
                agreements, 
                dataPackets, 
                consciousnessLevel, 
                systemIntegrity 
            } = req.body;
            
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contract.methods.snapshotGameState(
                sessionId,
                level || 0,
                score || 0,
                discoveries || 0,
                agreements || 0,
                dataPackets || 0,
                consciousnessLevel || 'Awakening',
                systemIntegrity || 0
            ).send({
                from: accounts[0],
                gas: 300000
            });
            
            console.log(`📸 Game state snapshot: Level ${level}, Score ${score}`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash
            });
            
        } catch (error) {
            console.error('❌ State snapshot error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async processSystemEvent(systemName, event) {
        // Queue events for batch processing
        this.broadcastQueue.push({
            timestamp: Date.now(),
            systemName: systemName,
            event: event
        });
        
        // Process queue every 5 seconds
        if (!this.isRecording) {
            this.isRecording = true;
            setTimeout(() => {
                this.processBroadcastQueue();
            }, 5000);
        }
    }
    
    async processBroadcastQueue() {
        if (this.broadcastQueue.length === 0) {
            this.isRecording = false;
            return;
        }
        
        console.log(`📊 Processing ${this.broadcastQueue.length} queued broadcasts...`);
        
        // Group broadcasts by session
        const sessionGroups = new Map();
        
        this.broadcastQueue.forEach(broadcast => {
            // Find active session for this event
            for (const [sessionId, session] of this.activeSessions) {
                if (!sessionGroups.has(sessionId)) {
                    sessionGroups.set(sessionId, []);
                }
                sessionGroups.get(sessionId).push(broadcast);
                break; // Use first active session for now
            }
        });
        
        // Record each group
        for (const [sessionId, broadcasts] of sessionGroups) {
            try {
                await this.batchRecordBroadcasts(sessionId, broadcasts);
            } catch (error) {
                console.error(`❌ Batch recording error for session ${sessionId}:`, error);
            }
        }
        
        // Clear queue
        this.broadcastQueue = [];
        this.isRecording = false;
    }
    
    async batchRecordBroadcasts(sessionId, broadcasts) {
        if (!this.contract || broadcasts.length === 0) return;
        
        const accounts = await this.web3.eth.getAccounts();
        
        // Convert broadcasts to contract format
        const contractBroadcasts = broadcasts.map(b => ({
            sessionId: sessionId,
            eventType: b.event.type || 'system_event',
            sourceService: b.systemName,
            targetService: b.event.target || 'game',
            payload: JSON.stringify(b.event),
            timestamp: Math.floor(b.timestamp / 1000),
            player: this.activeSessions.get(sessionId)?.playerAddress || accounts[0]
        }));
        
        try {
            const tx = await this.contract.methods.batchRecordBroadcasts(
                sessionId,
                contractBroadcasts
            ).send({
                from: accounts[0],
                gas: 1000000
            });
            
            console.log(`✅ Batch recorded ${broadcasts.length} broadcasts`);
            
        } catch (error) {
            console.error('❌ Batch recording failed:', error);
        }
    }
    
    // API endpoints for data retrieval
    
    async getContractStatus(req, res) {
        res.json({
            contractDeployed: !!this.contract,
            contractAddress: this.contractAddress,
            activeSessions: this.activeSessions.size,
            queuedBroadcasts: this.broadcastQueue.length,
            connectedSystems: Array.from(this.gameConnections.keys())
        });
    }
    
    async getGameSession(req, res) {
        try {
            const { sessionId } = req.params;
            
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const session = await this.contract.methods.getGameSession(sessionId).call();
            
            res.json({
                sessionId: sessionId,
                player: session.player,
                startTime: session.startTime,
                endTime: session.endTime,
                finalScore: session.finalScore,
                maxLevel: session.maxLevel,
                totalInteractions: session.totalInteractions,
                isActive: session.isActive
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getSessionBroadcasts(req, res) {
        try {
            const { sessionId } = req.params;
            
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const broadcasts = await this.contract.methods.getSessionBroadcasts(sessionId).call();
            
            res.json({ sessionId: sessionId, broadcasts: broadcasts });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getBroadcastStats(req, res) {
        try {
            if (!this.contract) {
                return res.status(400).json({ error: 'Contract not deployed' });
            }
            
            const stats = await this.contract.methods.getBroadcastStats().call();
            
            res.json({
                totalSessions: stats._totalSessions,
                totalBroadcasts: stats._totalBroadcasts,
                registeredServices: stats._registeredServices,
                broadcastingEnabled: stats._broadcastingEnabled,
                queuedBroadcasts: this.broadcastQueue.length,
                activeSessions: this.activeSessions.size
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // WebSocket message handling
    
    handleGameMessage(ws, data) {
        switch (data.type) {
            case 'subscribe_to_broadcasts':
                ws.subscribedToBroadcasts = true;
                break;
                
            case 'get_active_sessions':
                ws.send(JSON.stringify({
                    type: 'active_sessions',
                    sessions: Array.from(this.activeSessions.entries())
                }));
                break;
        }
    }
    
    broadcastToClients(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.subscribedToBroadcasts) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

// Auto-start if run directly
if (require.main === module) {
    const bridge = new GameBroadcastBridge();
    
    console.log('');
    console.log('📋 Game Broadcast Bridge Features:');
    console.log('   • Records all game events on blockchain');
    console.log('   • Wraps real-time broadcasts in Solidity');
    console.log('   • Immutable game session storage');
    console.log('   • Batch broadcast processing');
    console.log('   • Real-time game-to-blockchain bridge');
    console.log('');
    console.log('🎮 Game Integration:');
    console.log('   1. Deploy GameBroadcastRegistry contract');
    console.log('   2. Start game session');
    console.log('   3. Play game - all events auto-recorded!');
    console.log('   4. View immutable game history on-chain');
}

module.exports = GameBroadcastBridge;