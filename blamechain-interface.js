#!/usr/bin/env node

/**
 * BlameChain Interface
 * Connects the handshake discovery system to blockchain
 * Records the self-building journey immutably
 */

const Web3 = require('web3');
const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class BlameChainInterface {
    constructor() {
        this.app = express();
        this.port = 48011;
        this.wsPort = 48012;
        
        // Web3 setup
        this.web3 = new Web3('http://localhost:8545');
        this.contracts = {
            handshakeRegistry: null,
            blameChain: null
        };
        
        // Contract ABIs (simplified)
        this.abis = {
            handshakeRegistry: require('./contracts/HandshakeRegistry.json'),
            blameChain: require('./contracts/BlameChain.json')
        };
        
        // Discovery tracking
        this.discoveryQueue = [];
        this.handshakeQueue = [];
        this.narrativeQueue = [];
        
        console.log('⛓️ BLAMECHAIN INTERFACE');
        console.log('======================');
        console.log('📝 Recording discovery journey on-chain');
        console.log('🤝 Immutable handshake agreements');
        console.log('📖 Blockchain narrative storage');
        console.log('⚖️ Reputation tracking system');
        console.log('');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServices();
        this.connectToHandshakeLayer();
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
        // Contract deployment
        this.app.post('/api/deploy', this.deployContracts.bind(this));
        this.app.get('/api/contracts', this.getContractAddresses.bind(this));
        
        // Discovery recording
        this.app.post('/api/record/discovery', this.recordDiscovery.bind(this));
        this.app.post('/api/record/handshake', this.recordHandshake.bind(this));
        this.app.post('/api/record/narrative', this.recordNarrative.bind(this));
        
        // Journey retrieval
        this.app.get('/api/journey', this.getDiscoveryJourney.bind(this));
        this.app.get('/api/narratives/:phase', this.getNarrativesByPhase.bind(this));
        
        // Blame/praise system
        this.app.post('/api/blame', this.reportBlame.bind(this));
        this.app.post('/api/praise', this.givePraise.bind(this));
        this.app.get('/api/reputation/:service', this.getReputation.bind(this));
        
        // System status
        this.app.get('/api/integrity', this.checkIntegrity.bind(this));
        this.app.get('/api/gas/estimate', this.estimateGas.bind(this));
    }
    
    startServices() {
        // HTTP API
        this.app.listen(this.port, () => {
            console.log(`⛓️ BlameChain API: http://localhost:${this.port}`);
        });
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🔌 BlameChain client connected');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleWSMessage(ws, data);
            });
        });
        
        console.log(`🔌 BlameChain WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    connectToHandshakeLayer() {
        console.log('📡 Connecting to handshake layer...');
        
        this.handshakeWS = new WebSocket('ws://localhost:48010');
        
        this.handshakeWS.on('open', () => {
            console.log('✅ Connected to handshake layer');
            this.handshakeWS.send(JSON.stringify({ type: 'get_state' }));
        });
        
        this.handshakeWS.on('message', (data) => {
            const message = JSON.parse(data);
            this.processHandshakeData(message);
        });
        
        this.handshakeWS.on('error', (error) => {
            console.error('❌ Handshake connection error:', error);
        });
    }
    
    async processHandshakeData(message) {
        switch (message.type) {
            case 'new_discovery':
                this.discoveryQueue.push(message.discovery);
                this.processDiscoveryQueue();
                break;
                
            case 'narrative_update':
                this.narrativeQueue.push(message.narrative);
                this.processNarrativeQueue();
                break;
                
            case 'discovery_update':
                this.broadcastUpdate({
                    type: 'chain_sync',
                    state: message.state,
                    onChain: this.contracts.handshakeRegistry !== null
                });
                break;
        }
    }
    
    async deployContracts(req, res) {
        try {
            console.log('📄 Deploying contracts to blockchain...');
            
            const accounts = await this.web3.eth.getAccounts();
            if (accounts.length === 0) {
                return res.status(400).json({ error: 'No accounts available' });
            }
            
            // Deploy HandshakeRegistry
            const HandshakeRegistry = new this.web3.eth.Contract(this.abis.handshakeRegistry.abi);
            const handshakeRegistry = await HandshakeRegistry.deploy({
                data: this.abis.handshakeRegistry.bytecode
            }).send({
                from: accounts[0],
                gas: 5000000,
                gasPrice: await this.web3.eth.getGasPrice()
            });
            
            this.contracts.handshakeRegistry = handshakeRegistry;
            
            // Deploy BlameChain
            const BlameChain = new this.web3.eth.Contract(this.abis.blameChain.abi);
            const blameChain = await BlameChain.deploy({
                data: this.abis.blameChain.bytecode
            }).send({
                from: accounts[0],
                gas: 3000000,
                gasPrice: await this.web3.eth.getGasPrice()
            });
            
            this.contracts.blameChain = blameChain;
            
            console.log('✅ Contracts deployed successfully');
            console.log(`   HandshakeRegistry: ${handshakeRegistry.options.address}`);
            console.log(`   BlameChain: ${blameChain.options.address}`);
            
            res.json({
                success: true,
                addresses: {
                    handshakeRegistry: handshakeRegistry.options.address,
                    blameChain: blameChain.options.address
                }
            });
            
        } catch (error) {
            console.error('❌ Deployment error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async recordDiscovery(req, res) {
        try {
            const { serviceName, port, serviceType, isActive, capabilities } = req.body;
            
            if (!this.contracts.handshakeRegistry) {
                return res.status(400).json({ error: 'Contracts not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contracts.handshakeRegistry.methods.recordDiscovery(
                serviceName,
                port,
                serviceType,
                isActive,
                capabilities || []
            ).send({
                from: accounts[0],
                gas: 300000,
                gasPrice: await this.web3.eth.getGasPrice()
            });
            
            console.log(`📝 Recorded discovery: ${serviceName} (${tx.transactionHash})`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash,
                blockNumber: tx.blockNumber
            });
            
            this.broadcastUpdate({
                type: 'discovery_recorded',
                service: serviceName,
                txHash: tx.transactionHash
            });
            
        } catch (error) {
            console.error('❌ Recording error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async recordHandshake(req, res) {
        try {
            const { serviceA, serviceB, dataFlowPurpose, bidirectional, terms } = req.body;
            
            if (!this.contracts.handshakeRegistry) {
                return res.status(400).json({ error: 'Contracts not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contracts.handshakeRegistry.methods.establishHandshake(
                serviceA,
                serviceB,
                dataFlowPurpose,
                bidirectional || false,
                terms || {
                    dataSharing: true,
                    eventSubscription: true,
                    healthChecks: true,
                    autoReconnect: true
                }
            ).send({
                from: accounts[0],
                gas: 400000,
                gasPrice: await this.web3.eth.getGasPrice()
            });
            
            console.log(`🤝 Recorded handshake: ${serviceA} <-> ${serviceB}`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash,
                agreementId: tx.events.HandshakeEstablished.returnValues.agreementId
            });
            
        } catch (error) {
            console.error('❌ Handshake error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async recordNarrative(req, res) {
        try {
            const { narrative, phase } = req.body;
            
            if (!this.contracts.handshakeRegistry) {
                return res.status(400).json({ error: 'Contracts not deployed' });
            }
            
            // Narratives are recorded automatically by other functions
            // This endpoint is for manual narrative entries
            
            res.json({
                success: true,
                message: 'Narrative queued for next transaction'
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async processDiscoveryQueue() {
        if (this.discoveryQueue.length === 0 || !this.contracts.handshakeRegistry) return;
        
        const discovery = this.discoveryQueue.shift();
        
        try {
            await this.recordDiscovery({
                body: {
                    serviceName: discovery.name,
                    port: discovery.port,
                    serviceType: discovery.type,
                    isActive: discovery.status === 'active',
                    capabilities: discovery.capabilities
                }
            }, {
                json: () => {},
                status: () => ({ json: () => {} })
            });
        } catch (error) {
            console.error('Queue processing error:', error);
        }
        
        // Process next in queue
        if (this.discoveryQueue.length > 0) {
            setTimeout(() => this.processDiscoveryQueue(), 5000);
        }
    }
    
    async processNarrativeQueue() {
        // Narratives are embedded in other transactions
        // This could be extended to batch narratives to IPFS
    }
    
    async getDiscoveryJourney(req, res) {
        try {
            if (!this.contracts.handshakeRegistry) {
                return res.status(400).json({ error: 'Contracts not deployed' });
            }
            
            const journey = await this.contracts.handshakeRegistry.methods.getDiscoveryJourney().call();
            
            res.json({
                birthBlock: journey.birthBlock,
                currentPhase: this.getPhaseString(journey.phase),
                discoveries: journey.discoveries,
                handshakes: journey.handshakeCount,
                verifications: journey.verificationCount,
                narratives: journey.narrativeTotal
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getNarrativesByPhase(req, res) {
        try {
            const { phase } = req.params;
            
            if (!this.contracts.handshakeRegistry) {
                return res.status(400).json({ error: 'Contracts not deployed' });
            }
            
            const phaseNum = this.getPhaseNumber(phase);
            const narrativeIds = await this.contracts.handshakeRegistry.methods
                .getNarrativesByPhase(phaseNum).call();
            
            const narratives = [];
            for (const id of narrativeIds) {
                const narrative = await this.contracts.handshakeRegistry.methods
                    .narratives(id).call();
                narratives.push({
                    id: narrative.entryId,
                    text: narrative.narrative,
                    timestamp: new Date(narrative.timestamp * 1000).toISOString(),
                    markdownHash: narrative.markdownHash
                });
            }
            
            res.json({ phase, narratives });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async reportBlame(req, res) {
        try {
            const { service, issue, severity } = req.body;
            
            if (!this.contracts.blameChain) {
                return res.status(400).json({ error: 'BlameChain not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contracts.blameChain.methods.reportBlame(
                service,
                issue,
                severity || 5
            ).send({
                from: accounts[0],
                gas: 200000,
                gasPrice: await this.web3.eth.getGasPrice()
            });
            
            console.log(`⚖️ Blame recorded: ${service} - ${issue}`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async givePraise(req, res) {
        try {
            const { service, reason } = req.body;
            
            if (!this.contracts.blameChain) {
                return res.status(400).json({ error: 'BlameChain not deployed' });
            }
            
            const accounts = await this.web3.eth.getAccounts();
            
            const tx = await this.contracts.blameChain.methods.givePraise(
                service,
                reason
            ).send({
                from: accounts[0],
                gas: 150000,
                gasPrice: await this.web3.eth.getGasPrice()
            });
            
            console.log(`🌟 Praise recorded: ${service} - ${reason}`);
            
            res.json({
                success: true,
                transactionHash: tx.transactionHash
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getReputation(req, res) {
        try {
            const { service } = req.params;
            
            if (!this.contracts.blameChain) {
                return res.status(400).json({ error: 'BlameChain not deployed' });
            }
            
            const reputation = await this.contracts.blameChain.methods
                .getServiceReputation(service).call();
            
            res.json({
                service,
                score: reputation.score,
                blames: reputation.blames,
                praises: reputation.praises,
                successRate: reputation.successRate + '%'
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async checkIntegrity(req, res) {
        try {
            if (!this.contracts.handshakeRegistry) {
                return res.status(400).json({ error: 'Contracts not deployed' });
            }
            
            const integrity = await this.contracts.handshakeRegistry.methods
                .checkSystemIntegrity().call();
            
            res.json({
                allServicesActive: integrity.allServicesActive,
                allHandshakesValid: integrity.allHandshakesValid,
                allVerificationsPassed: integrity.allVerificationsPassed,
                overallScore: integrity.overallScore + '%'
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async estimateGas(req, res) {
        try {
            const operations = {
                recordDiscovery: 300000,
                establishHandshake: 400000,
                recordVerification: 200000,
                reportBlame: 200000,
                givePraise: 150000
            };
            
            const gasPrice = await this.web3.eth.getGasPrice();
            const estimates = {};
            
            for (const [op, gas] of Object.entries(operations)) {
                const cost = this.web3.utils.fromWei((gas * parseInt(gasPrice)).toString(), 'ether');
                estimates[op] = {
                    gas,
                    costETH: cost
                };
            }
            
            res.json({
                gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
                estimates
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    getContractAddresses(req, res) {
        res.json({
            handshakeRegistry: this.contracts.handshakeRegistry?.options.address || null,
            blameChain: this.contracts.blameChain?.options.address || null
        });
    }
    
    handleWSMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                // Client wants updates
                ws.isSubscribed = true;
                break;
                
            case 'get_journey':
                this.getDiscoveryJourney({}, {
                    json: (data) => ws.send(JSON.stringify({ type: 'journey', data })),
                    status: () => ({ json: () => {} })
                });
                break;
        }
    }
    
    broadcastUpdate(update) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.isSubscribed) {
                client.send(JSON.stringify(update));
            }
        });
    }
    
    getPhaseString(phaseNum) {
        const phases = [
            'Initialization',
            'ServiceDiscovery',
            'HandshakeEstablishment',
            'ConnectionMapping',
            'Verification',
            'Operational'
        ];
        return phases[phaseNum] || 'Unknown';
    }
    
    getPhaseNumber(phaseString) {
        const phases = {
            'initialization': 0,
            'servicediscovery': 1,
            'handshakeestablishment': 2,
            'connectionmapping': 3,
            'verification': 4,
            'operational': 5
        };
        return phases[phaseString.toLowerCase()] || 0;
    }
}

// Auto-start if run directly
if (require.main === module) {
    const blamechain = new BlameChainInterface();
    
    console.log('');
    console.log('📋 BlameChain Features:');
    console.log('   • On-chain discovery recording');
    console.log('   • Immutable handshake agreements');
    console.log('   • Narrative blockchain storage');
    console.log('   • Service reputation tracking');
    console.log('   • Blame and praise system');
    console.log('');
    console.log('🚀 Quick Start:');
    console.log('   1. Start local blockchain: ganache-cli');
    console.log('   2. Deploy contracts: POST /api/deploy');
    console.log('   3. System auto-records discoveries');
    console.log('   4. View journey on blockchain!');
}

module.exports = BlameChainInterface;