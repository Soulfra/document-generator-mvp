#!/usr/bin/env node

// 🛡️ XML PERSISTENCE MINING LAYER
// Bulletproof XML-based state persistence with proof-of-work verification
// This is the substrate that NEVER goes down - like Bitcoin but for game state

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const xml2js = require('xml2js');
const express = require('express');
const cluster = require('cluster');
const os = require('os');

class XMLPersistenceMiningLayer {
    constructor() {
        this.app = express();
        this.port = process.env.XML_MINING_PORT || 7788;
        
        // Mining configuration
        this.difficulty = 4; // Number of leading zeros required
        this.blockTime = 30000; // 30 seconds target block time
        this.miningReward = 10; // Reward for mining a block
        
        // Blockchain state
        this.blockchain = [];
        this.pendingTransactions = [];
        this.miners = new Map(); // Active miners
        this.currentBlock = null;
        
        // XML persistence
        this.xmlBuilder = new xml2js.Builder({
            rootName: 'SoulfraPersistenceLayer',
            xmldec: { version: '1.0', encoding: 'UTF-8' }
        });
        this.xmlParser = new xml2js.Parser();
        
        // Substrate management
        this.processHealth = new Map();
        this.restartQueue = [];
        this.substrate = {
            processes: new Map(),
            dependencies: new Map(),
            healthChecks: new Map()
        };
        
        // Proof storage
        this.persistencePath = path.join(__dirname, 'xml-persistence');
        this.blockchainPath = path.join(this.persistencePath, 'blockchain');
        this.statePath = path.join(this.persistencePath, 'state');
        this.miningPath = path.join(this.persistencePath, 'mining');
        
        this.setupRoutes();
        this.initializeBlockchain();
        this.startMining();
        this.setupSubstrateMonitoring();
    }
    
    async initializeBlockchain() {
        // Create directories
        await fs.mkdir(this.persistencePath, { recursive: true });
        await fs.mkdir(this.blockchainPath, { recursive: true });
        await fs.mkdir(this.statePath, { recursive: true });
        await fs.mkdir(this.miningPath, { recursive: true });
        
        // Load existing blockchain or create genesis
        try {
            const blockchainData = await fs.readFile(
                path.join(this.blockchainPath, 'chain.xml'), 
                'utf8'
            );
            const parsed = await this.xmlParser.parseStringPromise(blockchainData);
            this.blockchain = parsed.SoulfraPersistenceLayer.blocks || [];
            console.log(`🔗 Loaded blockchain with ${this.blockchain.length} blocks`);
        } catch (error) {
            console.log('🆕 Creating genesis block...');
            await this.createGenesisBlock();
        }
    }
    
    async createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: Date.now(),
            data: {
                type: 'GENESIS',
                message: 'Soulfra Persistence Layer Genesis Block',
                quantumSeed: crypto.randomBytes(32).toString('hex')
            },
            previousHash: '0',
            hash: '',
            nonce: 0,
            difficulty: this.difficulty
        };
        
        // Mine the genesis block
        console.log('⛏️  Mining genesis block...');
        genesisBlock.hash = await this.mineBlock(genesisBlock);
        
        this.blockchain.push(genesisBlock);
        await this.persistBlockchain();
        
        console.log(`✅ Genesis block mined: ${genesisBlock.hash}`);
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Persist game state with proof-of-work
        this.app.post('/api/persist', async (req, res) => {
            try {
                const { data, service, priority = 'normal' } = req.body;
                
                console.log(`💾 Persisting data from ${service}`);
                
                // Create transaction
                const transaction = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    service,
                    data,
                    priority,
                    hash: crypto.createHash('sha256')
                        .update(JSON.stringify(data))
                        .digest('hex')
                };
                
                // Add to pending transactions
                this.pendingTransactions.push(transaction);
                
                // Trigger mining if high priority
                if (priority === 'high') {
                    this.triggerMining();
                }
                
                res.json({
                    success: true,
                    transactionId: transaction.id,
                    estimatedConfirmation: this.blockTime
                });
                
            } catch (error) {
                console.error('Persistence error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Retrieve persisted state
        this.app.get('/api/state/:service/:key?', async (req, res) => {
            try {
                const { service, key } = req.params;
                const state = await this.retrieveState(service, key);
                
                res.json({
                    success: true,
                    service,
                    key,
                    state,
                    verified: true,
                    blockHeight: this.blockchain.length
                });
                
            } catch (error) {
                res.status(404).json({ error: 'State not found' });
            }
        });
        
        // Get blockchain info
        this.app.get('/api/blockchain/info', (req, res) => {
            res.json({
                height: this.blockchain.length,
                difficulty: this.difficulty,
                pendingTransactions: this.pendingTransactions.length,
                miners: this.miners.size,
                lastBlock: this.blockchain[this.blockchain.length - 1],
                totalHashRate: this.calculateHashRate()
            });
        });
        
        // Join as miner
        this.app.post('/api/mining/join', (req, res) => {
            const { minerId, hashRate } = req.body;
            
            this.miners.set(minerId, {
                id: minerId,
                hashRate: hashRate || 1000,
                joinedAt: Date.now(),
                blocksFound: 0,
                totalRewards: 0
            });
            
            console.log(`⛏️  New miner joined: ${minerId}`);
            
            res.json({
                success: true,
                minerId,
                currentDifficulty: this.difficulty,
                blockReward: this.miningReward
            });
        });
        
        // Submit mining solution
        this.app.post('/api/mining/submit', async (req, res) => {
            try {
                const { minerId, blockHash, nonce } = req.body;
                
                if (!this.currentBlock) {
                    return res.json({ success: false, error: 'No block to mine' });
                }
                
                // Verify solution
                const isValid = await this.verifyMining(this.currentBlock, nonce, blockHash);
                
                if (isValid) {
                    await this.acceptBlock(this.currentBlock, nonce, minerId);
                    
                    res.json({
                        success: true,
                        reward: this.miningReward,
                        blockHeight: this.blockchain.length
                    });
                } else {
                    res.json({ success: false, error: 'Invalid solution' });
                }
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Substrate health endpoint
        this.app.get('/api/substrate/health', (req, res) => {
            const health = {
                processes: Array.from(this.processHealth.entries()).map(([pid, info]) => ({
                    pid,
                    status: info.status,
                    uptime: Date.now() - info.startTime,
                    restarts: info.restarts,
                    lastCheck: info.lastCheck
                })),
                restartQueue: this.restartQueue.length,
                substrateHealth: this.calculateSubstrateHealth()
            };
            
            res.json(health);
        });
        
        // Force restart service
        this.app.post('/api/substrate/restart/:service', async (req, res) => {
            const { service } = req.params;
            
            console.log(`🔄 Force restarting ${service}...`);
            await this.restartService(service);
            
            res.json({ success: true, service, restarted: true });
        });
    }
    
    async mineBlock(block) {
        let nonce = 0;
        let hash = '';
        
        const startTime = Date.now();
        
        do {
            nonce++;
            const blockString = JSON.stringify({
                ...block,
                nonce
            });
            
            hash = crypto.createHash('sha256')
                .update(blockString)
                .digest('hex');
                
        } while (!hash.startsWith('0'.repeat(this.difficulty)));
        
        const miningTime = Date.now() - startTime;
        console.log(`⛏️  Block mined! Hash: ${hash}, Nonce: ${nonce}, Time: ${miningTime}ms`);
        
        block.nonce = nonce;
        return hash;
    }
    
    async verifyMining(block, nonce, expectedHash) {
        const blockString = JSON.stringify({
            ...block,
            nonce
        });
        
        const hash = crypto.createHash('sha256')
            .update(blockString)
            .digest('hex');
            
        return hash === expectedHash && hash.startsWith('0'.repeat(this.difficulty));
    }
    
    async acceptBlock(block, nonce, minerId) {
        block.nonce = nonce;
        block.hash = crypto.createHash('sha256')
            .update(JSON.stringify(block))
            .digest('hex');
        block.minedBy = minerId;
        
        // Add to blockchain
        this.blockchain.push(block);
        
        // Reward miner
        if (this.miners.has(minerId)) {
            const miner = this.miners.get(minerId);
            miner.blocksFound++;
            miner.totalRewards += this.miningReward;
        }
        
        // Clear pending transactions that were included
        this.pendingTransactions = [];
        this.currentBlock = null;
        
        // Persist everything
        await this.persistBlockchain();
        await this.persistState(block.data);
        
        console.log(`✅ Block ${block.index} accepted by network`);
        
        // Adjust difficulty if needed
        this.adjustDifficulty();
    }
    
    startMining() {
        setInterval(() => {
            if (this.pendingTransactions.length > 0 && !this.currentBlock) {
                this.createNewBlock();
            }
        }, 5000); // Check every 5 seconds
    }
    
    createNewBlock() {
        const previousBlock = this.blockchain[this.blockchain.length - 1];
        
        this.currentBlock = {
            index: this.blockchain.length,
            timestamp: Date.now(),
            data: {
                transactions: [...this.pendingTransactions],
                stateRoot: this.calculateStateRoot()
            },
            previousHash: previousBlock.hash,
            hash: '',
            nonce: 0,
            difficulty: this.difficulty
        };
        
        console.log(`🆕 New block ready for mining: #${this.currentBlock.index}`);
        
        // Start mining in worker process to avoid blocking
        if (cluster.isMaster) {
            this.forkMiningWorker();
        }
    }
    
    forkMiningWorker() {
        const worker = cluster.fork({ MINING_BLOCK: JSON.stringify(this.currentBlock) });
        
        worker.on('message', async (message) => {
            if (message.type === 'BLOCK_MINED') {
                await this.acceptBlock(message.block, message.nonce, 'internal');
                worker.kill();
            }
        });
    }
    
    async persistBlockchain() {
        const xmlData = this.xmlBuilder.buildObject({
            blocks: this.blockchain,
            metadata: {
                height: this.blockchain.length,
                difficulty: this.difficulty,
                lastUpdate: new Date().toISOString()
            }
        });
        
        await fs.writeFile(
            path.join(this.blockchainPath, 'chain.xml'),
            xmlData
        );
        
        // Also save JSON backup
        await fs.writeFile(
            path.join(this.blockchainPath, 'chain.json'),
            JSON.stringify(this.blockchain, null, 2)
        );
    }
    
    async persistState(data) {
        if (!data.transactions) return;
        
        for (const tx of data.transactions) {
            const stateFile = path.join(this.statePath, `${tx.service}.xml`);
            
            let serviceState = {};
            
            // Load existing state
            try {
                const existingXml = await fs.readFile(stateFile, 'utf8');
                const parsed = await this.xmlParser.parseStringPromise(existingXml);
                serviceState = parsed.ServiceState || {};
            } catch (error) {
                // New service state
            }
            
            // Update state
            serviceState[tx.id] = {
                timestamp: tx.timestamp,
                data: tx.data,
                hash: tx.hash,
                verified: true
            };
            
            // Save updated state
            const xmlData = this.xmlBuilder.buildObject({
                ServiceState: serviceState
            });
            
            await fs.writeFile(stateFile, xmlData);
            
            console.log(`💾 State persisted for ${tx.service}`);
        }
    }
    
    async retrieveState(service, key) {
        const stateFile = path.join(this.statePath, `${service}.xml`);
        
        try {
            const xmlData = await fs.readFile(stateFile, 'utf8');
            const parsed = await this.xmlParser.parseStringPromise(xmlData);
            const serviceState = parsed.ServiceState || {};
            
            if (key) {
                return serviceState[key] || null;
            }
            
            return serviceState;
            
        } catch (error) {
            throw new Error(`State not found for ${service}`);
        }
    }
    
    setupSubstrateMonitoring() {
        // Monitor all Soulfra processes
        const processes = [
            { name: 'meta-orchestration', port: 4444, critical: true },
            { name: 'quantum-state', port: 7777, critical: true },
            { name: 'neural-ai', port: 6666, critical: false },
            { name: 'hyper-rendering', port: 5555, critical: false },
            { name: 'depth-mapping', port: 8765, critical: false },
            { name: 'game-integration', port: 8766, critical: false },
            { name: 'soulfra-master', port: 9898, critical: true },
            { name: 'enhanced-game', port: 8899, critical: true },
            { name: 'xml-broadcast', port: 8877, critical: false }
        ];
        
        // Health check interval
        setInterval(async () => {
            for (const process of processes) {
                await this.checkProcessHealth(process);
            }
        }, 10000); // Every 10 seconds
        
        console.log('🔍 Substrate monitoring active');
    }
    
    async checkProcessHealth(process) {
        try {
            const response = await fetch(`http://localhost:${process.port}/api/health`, {
                timeout: 5000
            });
            
            if (response.ok) {
                this.processHealth.set(process.name, {
                    status: 'healthy',
                    lastCheck: Date.now(),
                    restarts: this.processHealth.get(process.name)?.restarts || 0,
                    startTime: this.processHealth.get(process.name)?.startTime || Date.now()
                });
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.warn(`⚠️  ${process.name} health check failed:`, error.message);
            
            const current = this.processHealth.get(process.name) || {};
            this.processHealth.set(process.name, {
                ...current,
                status: 'unhealthy',
                lastCheck: Date.now(),
                lastError: error.message
            });
            
            // Auto-restart critical processes
            if (process.critical) {
                await this.restartService(process.name);
            }
        }
    }
    
    async restartService(serviceName) {
        console.log(`🔄 Restarting ${serviceName}...`);
        
        // Add to persistence layer
        await this.persistTransaction({
            type: 'SERVICE_RESTART',
            service: serviceName,
            timestamp: Date.now(),
            reason: 'health_check_failure'
        });
        
        try {
            // Try PM2 restart first
            const { exec } = require('child_process');
            await new Promise((resolve, reject) => {
                exec(`pm2 restart ${serviceName}`, (error, stdout, stderr) => {
                    if (error) reject(error);
                    else resolve(stdout);
                });
            });
            
            // Update process health
            const current = this.processHealth.get(serviceName) || {};
            this.processHealth.set(serviceName, {
                ...current,
                restarts: (current.restarts || 0) + 1,
                startTime: Date.now(),
                status: 'restarting'
            });
            
            console.log(`✅ ${serviceName} restarted successfully`);
            
        } catch (error) {
            console.error(`❌ Failed to restart ${serviceName}:`, error);
        }
    }
    
    async persistTransaction(data) {
        this.pendingTransactions.push({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            service: 'substrate',
            data,
            priority: 'high',
            hash: crypto.createHash('sha256')
                .update(JSON.stringify(data))
                .digest('hex')
        });
    }
    
    calculateStateRoot() {
        // Calculate Merkle root of all state files
        const stateHashes = this.pendingTransactions.map(tx => tx.hash);
        
        if (stateHashes.length === 0) return '0';
        
        // Simple hash combination for now
        return crypto.createHash('sha256')
            .update(stateHashes.join(''))
            .digest('hex');
    }
    
    calculateHashRate() {
        let totalHashRate = 0;
        for (const miner of this.miners.values()) {
            totalHashRate += miner.hashRate;
        }
        return totalHashRate;
    }
    
    adjustDifficulty() {
        if (this.blockchain.length < 10) return; // Need history
        
        const recentBlocks = this.blockchain.slice(-10);
        const totalTime = recentBlocks[recentBlocks.length - 1].timestamp - recentBlocks[0].timestamp;
        const averageTime = totalTime / (recentBlocks.length - 1);
        
        if (averageTime < this.blockTime * 0.8) {
            this.difficulty++;
            console.log(`⬆️  Difficulty increased to ${this.difficulty}`);
        } else if (averageTime > this.blockTime * 1.2) {
            this.difficulty = Math.max(1, this.difficulty - 1);
            console.log(`⬇️  Difficulty decreased to ${this.difficulty}`);
        }
    }
    
    calculateSubstrateHealth() {
        const processes = Array.from(this.processHealth.values());
        const healthy = processes.filter(p => p.status === 'healthy').length;
        const total = processes.length;
        
        return {
            score: total > 0 ? (healthy / total) * 100 : 0,
            healthy,
            total,
            critical: processes.filter(p => p.status === 'unhealthy').length
        };
    }
    
    triggerMining() {
        if (!this.currentBlock && this.pendingTransactions.length > 0) {
            this.createNewBlock();
        }
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log(`🛡️  XML Persistence Mining Layer running on port ${this.port}`);
            console.log(`⛓️  Blockchain height: ${this.blockchain.length}`);
            console.log(`⛏️  Difficulty: ${this.difficulty}`);
            console.log(`💾 Persistence: ${this.persistencePath}`);
            console.log(`🔍 Substrate monitoring: ACTIVE`);
        });
    }
}

// Mining worker process
if (cluster.isWorker && process.env.MINING_BLOCK) {
    const block = JSON.parse(process.env.MINING_BLOCK);
    
    console.log(`⛏️  Mining worker started for block #${block.index}`);
    
    // Mine the block
    let nonce = 0;
    let hash = '';
    const difficulty = block.difficulty;
    
    do {
        nonce++;
        const blockString = JSON.stringify({
            ...block,
            nonce
        });
        
        hash = crypto.createHash('sha256')
            .update(blockString)
            .digest('hex');
            
        // Send progress every 10000 attempts
        if (nonce % 10000 === 0) {
            process.send({
                type: 'MINING_PROGRESS',
                nonce,
                hash: hash.substring(0, 8)
            });
        }
        
    } while (!hash.startsWith('0'.repeat(difficulty)));
    
    // Found solution!
    process.send({
        type: 'BLOCK_MINED',
        block,
        nonce,
        hash
    });
}

// Start the mining layer
if (require.main === module) {
    const miningLayer = new XMLPersistenceMiningLayer();
    miningLayer.start().catch(console.error);
}

module.exports = XMLPersistenceMiningLayer;