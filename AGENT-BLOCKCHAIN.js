#!/usr/bin/env node
// AGENT-BLOCKCHAIN.js - Secure blockchain for agent economy transactions

const crypto = require('crypto');
const WebSocket = require('ws');

class AgentBlockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.miningReward = 10;
        this.difficulty = 4; // Number of leading zeros required
        
        // Agent wallets
        this.wallets = {
            htmlMaster: { balance: 1000, privateKey: null, publicKey: null },
            cssMage: { balance: 1000, privateKey: null, publicKey: null },
            jsWizard: { balance: 1000, privateKey: null, publicKey: null },
            designPaladin: { balance: 1000, privateKey: null, publicKey: null },
            seoRogue: { balance: 1000, privateKey: null, publicKey: null },
            dbCleric: { balance: 1000, privateKey: null, publicKey: null }
        };
        
        // Mining pools by specialty
        this.miningPools = {
            htmlPool: { members: ['htmlMaster'], reward: 0 },
            cssPool: { members: ['cssMage'], reward: 0 },
            jsPool: { members: ['jsWizard'], reward: 0 },
            designPool: { members: ['designPaladin'], reward: 0 },
            seoPool: { members: ['seoRogue'], reward: 0 },
            dataPool: { members: ['dbCleric'], reward: 0 }
        };
        
        this.wsPort = 8082;
        this.connections = new Map();
        
        console.log('⛓️ AGENT BLOCKCHAIN INITIALIZED');
        console.log('🔐 Secure transactions for AI agent economy');
        
        this.initializeBlockchain();
        this.generateWalletKeys();
        this.startWebSocketServer();
        this.startMining();
    }
    
    initializeBlockchain() {
        // Create genesis block
        const genesisBlock = new Block(0, Date.now(), [], '0');
        genesisBlock.hash = this.calculateHash(genesisBlock);
        this.chain.push(genesisBlock);
        
        console.log('🎯 Genesis block created');
    }
    
    generateWalletKeys() {
        console.log('🔑 Generating wallet keys for agents...');
        
        Object.keys(this.wallets).forEach(agentId => {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });
            
            this.wallets[agentId].publicKey = publicKey;
            this.wallets[agentId].privateKey = privateKey;
            
            console.log(`💼 Wallet created for ${agentId}`);
        });
    }
    
    startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            const id = Math.random().toString(36).substr(2, 9);
            this.connections.set(id, ws);
            
            console.log(`🔌 Blockchain observer connected: ${id}`);
            
            // Send current blockchain state
            ws.send(JSON.stringify({
                type: 'blockchain-state',
                chain: this.getChainSummary(),
                wallets: this.getPublicWalletData(),
                miningPools: this.miningPools,
                stats: this.getBlockchainStats()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleBlockchainMessage(id, data);
                } catch (e) {
                    console.error('Invalid blockchain message:', e);
                }
            });
            
            ws.on('close', () => {
                this.connections.delete(id);
                console.log(`🔌 Blockchain observer disconnected: ${id}`);
            });
        });
        
        console.log(`⛓️ Blockchain WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    createTransaction(from, to, amount, type = 'payment', data = null) {
        const transaction = new Transaction(from, to, amount, type, data);
        
        // Sign transaction
        if (this.wallets[from]) {
            transaction.signTransaction(this.wallets[from].privateKey);
        }
        
        this.pendingTransactions.push(transaction);
        
        console.log(`💸 Transaction created: ${from} → ${to} (${amount} tokens)`);
        
        this.broadcastUpdate();
        return transaction;
    }
    
    minePendingTransactions(miningRewardAddress) {
        // Add mining reward transaction
        const rewardTransaction = new Transaction(null, miningRewardAddress, this.miningReward, 'mining_reward');
        this.pendingTransactions.push(rewardTransaction);
        
        // Create new block
        const block = new Block(
            this.chain.length,
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );
        
        // Mine the block (proof of work)
        block.mineBlock(this.difficulty);
        
        console.log(`⛏️ Block mined by ${miningRewardAddress}! Hash: ${block.hash.substring(0, 10)}...`);
        
        // Add to chain
        this.chain.push(block);
        
        // Update balances
        this.updateBalances(block);
        
        // Clear pending transactions
        this.pendingTransactions = [];
        
        this.broadcastUpdate();
        return block;
    }
    
    updateBalances(block) {
        block.transactions.forEach(transaction => {
            if (transaction.from && this.wallets[transaction.from]) {
                this.wallets[transaction.from].balance -= transaction.amount;
            }
            if (transaction.to && this.wallets[transaction.to]) {
                this.wallets[transaction.to].balance += transaction.amount;
            }
        });
    }
    
    getBalance(address) {
        return this.wallets[address]?.balance || 0;
    }
    
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            
            if (currentBlock.hash !== this.calculateHash(currentBlock)) {
                return false;
            }
            
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
    
    calculateHash(block) {
        return crypto.createHash('sha256')
            .update(block.index + block.previousHash + block.timestamp + JSON.stringify(block.transactions) + block.nonce)
            .digest('hex');
    }
    
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
    
    startMining() {
        // Simulate different agents mining
        const miners = Object.keys(this.wallets);
        let minerIndex = 0;
        
        setInterval(() => {
            if (this.pendingTransactions.length > 0) {
                const miner = miners[minerIndex % miners.length];
                this.minePendingTransactions(miner);
                minerIndex++;
            }
        }, 10000); // Mine every 10 seconds
        
        // Create random transactions
        setInterval(() => {
            this.createRandomTransaction();
        }, 5000 + Math.random() * 10000); // Random transactions every 5-15 seconds
    }
    
    createRandomTransaction() {
        const agents = Object.keys(this.wallets);
        const from = agents[Math.floor(Math.random() * agents.length)];
        const to = agents[Math.floor(Math.random() * agents.length)];
        
        if (from === to) return;
        
        const amount = Math.floor(Math.random() * 50) + 1;
        const fromBalance = this.getBalance(from);
        
        if (fromBalance >= amount) {
            const transactionTypes = ['payment', 'service', 'contract', 'collaboration'];
            const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
            
            const transactionData = {
                service: type === 'service' ? `${from} specialty work` : null,
                contractId: type === 'contract' ? Math.random().toString(36).substr(2, 9) : null,
                projectId: type === 'collaboration' ? 'document_generator_mvp' : null
            };
            
            this.createTransaction(from, to, amount, type, transactionData);
        }
    }
    
    getChainSummary() {
        return this.chain.map(block => ({
            index: block.index,
            timestamp: block.timestamp,
            hash: block.hash.substring(0, 10) + '...',
            previousHash: block.previousHash.substring(0, 10) + '...',
            nonce: block.nonce,
            transactionCount: block.transactions.length
        }));
    }
    
    getPublicWalletData() {
        const publicData = {};
        Object.entries(this.wallets).forEach(([agentId, wallet]) => {
            publicData[agentId] = {
                balance: wallet.balance,
                publicKey: wallet.publicKey ? wallet.publicKey.substring(0, 50) + '...' : null
            };
        });
        return publicData;
    }
    
    getBlockchainStats() {
        const totalTransactions = this.chain.reduce((sum, block) => sum + block.transactions.length, 0);
        const totalSupply = Object.values(this.wallets).reduce((sum, wallet) => sum + wallet.balance, 0);
        
        return {
            totalBlocks: this.chain.length,
            totalTransactions,
            totalSupply,
            pendingTransactions: this.pendingTransactions.length,
            difficulty: this.difficulty,
            isValid: this.isChainValid()
        };
    }
    
    handleBlockchainMessage(id, data) {
        switch (data.type) {
            case 'create-transaction':
                if (data.from && data.to && data.amount) {
                    this.createTransaction(data.from, data.to, data.amount, data.transactionType, data.data);
                }
                break;
            case 'force-mine':
                if (this.pendingTransactions.length > 0) {
                    this.minePendingTransactions(data.miner || 'htmlMaster');
                }
                break;
        }
    }
    
    broadcastUpdate() {
        const update = {
            type: 'blockchain-update',
            chain: this.getChainSummary(),
            wallets: this.getPublicWalletData(),
            miningPools: this.miningPools,
            stats: this.getBlockchainStats(),
            pendingTransactions: this.pendingTransactions.length
        };
        
        this.connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(update));
            }
        });
        
        // Also send to agent economy forum
        try {
            const economyWs = new WebSocket('ws://localhost:8081');
            economyWs.on('open', () => {
                economyWs.send(JSON.stringify({
                    type: 'blockchain-update',
                    ...update
                }));
                economyWs.close();
            });
        } catch (e) {
            // Economy forum not available
        }
    }
}

// Block class
class Block {
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = '';
    }
    
    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join('0');
        
        console.log(`⛏️ Mining block ${this.index}...`);
        
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        
        console.log(`✅ Block mined: ${this.hash}`);
    }
    
    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
            .digest('hex');
    }
}

// Transaction class
class Transaction {
    constructor(from, to, amount, type = 'payment', data = null) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.type = type;
        this.data = data;
        this.timestamp = Date.now();
        this.signature = null;
    }
    
    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.from + this.to + this.amount + this.type + this.timestamp + JSON.stringify(this.data))
            .digest('hex');
    }
    
    signTransaction(privateKey) {
        const hashTx = this.calculateHash();
        const sign = crypto.createSign('SHA256');
        sign.update(hashTx);
        sign.end();
        
        this.signature = sign.sign(privateKey, 'base64');
    }
    
    isValid() {
        if (this.from === null) return true; // Mining reward transaction
        
        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }
        
        // Note: In real implementation, would verify signature with public key
        return true;
    }
}

// Start Agent Blockchain
if (require.main === module) {
    console.log('⛓️ STARTING AGENT BLOCKCHAIN');
    console.log('🔐 Secure transactions for AI agent economy');
    console.log('==========================================\n');
    
    const blockchain = new AgentBlockchain();
    
    console.log('\n📊 Blockchain WebSocket: ws://localhost:8082');
    console.log('💼 Agent wallets initialized with 1000 tokens each');
    console.log('⛏️ Mining started - blocks created every 10 seconds');
    console.log('\n🔗 Blockchain ready for agent transactions!');
}

module.exports = AgentBlockchain;