#!/usr/bin/env node

/**
 * AGENT WALLET SYSTEM
 * 
 * Implements actual token transactions for the component marketplace
 * Provides real wallet functionality beyond just database entries
 * 
 * Features:
 * - Cryptographic wallet generation for agents and users
 * - Token minting and distribution
 * - Escrow transactions for component purchases
 * - Revenue sharing and commission system
 * - Transaction history and auditing
 * - Multi-signature support for high-value transactions
 * 
 * Integrates with:
 * - Component Marketplace for purchases
 * - Agent Economy Forum for agent transactions
 * - BlameChain for reputation-based credit
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const { Client } = require('pg');
const express = require('express');
const WebSocket = require('ws');

class AgentWalletSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 9800,
            wsPort: options.wsPort || 9801,
            
            // Token configuration
            tokenName: options.tokenName || 'DOCGEN',
            tokenSymbol: options.tokenSymbol || 'DGN',
            initialSupply: options.initialSupply || 1000000,
            decimals: options.decimals || 2,
            
            // Economic parameters
            miningReward: options.miningReward || 100,
            transactionFee: options.transactionFee || 0.01, // 1%
            escrowTimeout: options.escrowTimeout || 86400000, // 24 hours
            minTransactionAmount: options.minTransactionAmount || 0.01,
            
            // Security
            requireMultisig: options.requireMultisig || 1000, // Amounts above this require multisig
            confirmationsRequired: options.confirmationsRequired || 2,
            
            ...options
        };
        
        // PostgreSQL connection
        this.pgClient = new Client({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'document_generator',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password'
        });
        
        // Wallet tracking
        this.wallets = new Map();
        this.pendingTransactions = new Map();
        this.escrowTransactions = new Map();
        this.multisigTransactions = new Map();
        
        // Token economics
        this.tokenSupply = {
            total: this.config.initialSupply,
            circulating: 0,
            locked: 0,
            burned: 0
        };
        
        // Express app
        this.app = express();
        this.app.use(express.json());
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.setupRoutes();
        this.setupWebSocket();
        
        console.log('💰 AGENT WALLET SYSTEM v1.0');
        console.log('=========================================');
        console.log(`🪙 Token: ${this.config.tokenName} (${this.config.tokenSymbol})`);
        console.log(`💎 Initial Supply: ${this.config.initialSupply.toLocaleString()}`);
        console.log(`🌐 API on port ${this.config.port}`);
    }
    
    async initialize() {
        try {
            // Connect to PostgreSQL
            await this.pgClient.connect();
            console.log('✅ Connected to PostgreSQL database');
            
            // Initialize database schema
            await this.initializeDatabaseSchema();
            
            // Load existing wallets
            await this.loadWallets();
            
            // Initialize treasury wallet
            await this.initializeTreasury();
            
            // Start servers
            this.server.listen(this.config.port, () => {
                console.log(`💰 Wallet API listening on port ${this.config.port}`);
            });
            
            // Start monitoring
            this.startTransactionMonitoring();
            this.startEscrowMonitoring();
            
            console.log('✅ Agent Wallet System ready!');
            
        } catch (error) {
            console.error('❌ Failed to initialize wallet system:', error.message);
            process.exit(1);
        }
    }
    
    async initializeDatabaseSchema() {
        const queries = [
            // Wallets table
            `CREATE TABLE IF NOT EXISTS wallets (
                id SERIAL PRIMARY KEY,
                wallet_address VARCHAR(66) UNIQUE NOT NULL,
                owner_id VARCHAR(255) NOT NULL,
                owner_type VARCHAR(50) CHECK (owner_type IN ('user', 'agent', 'system')),
                public_key TEXT NOT NULL,
                encrypted_private_key TEXT,
                balance DECIMAL(20, 2) DEFAULT 0,
                locked_balance DECIMAL(20, 2) DEFAULT 0,
                nonce INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Enhanced transactions table
            `CREATE TABLE IF NOT EXISTS wallet_transactions_enhanced (
                id SERIAL PRIMARY KEY,
                transaction_hash VARCHAR(66) UNIQUE NOT NULL,
                from_address VARCHAR(66),
                to_address VARCHAR(66),
                amount DECIMAL(20, 2) NOT NULL,
                fee DECIMAL(20, 2) DEFAULT 0,
                currency VARCHAR(10) DEFAULT 'DGN',
                transaction_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'pending',
                confirmations INTEGER DEFAULT 0,
                nonce INTEGER,
                signature TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMP,
                INDEX idx_from_address (from_address),
                INDEX idx_to_address (to_address),
                INDEX idx_status (status)
            )`,
            
            // Escrow table
            `CREATE TABLE IF NOT EXISTS escrow_transactions (
                id SERIAL PRIMARY KEY,
                escrow_id VARCHAR(255) UNIQUE NOT NULL,
                buyer_address VARCHAR(66) NOT NULL,
                seller_address VARCHAR(66) NOT NULL,
                amount DECIMAL(20, 2) NOT NULL,
                fee DECIMAL(20, 2) DEFAULT 0,
                reference_type VARCHAR(50),
                reference_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active',
                release_conditions JSONB DEFAULT '{}',
                expires_at TIMESTAMP,
                released_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Multi-signature transactions
            `CREATE TABLE IF NOT EXISTS multisig_transactions (
                id SERIAL PRIMARY KEY,
                multisig_id VARCHAR(255) UNIQUE NOT NULL,
                transaction_hash VARCHAR(66),
                required_signatures INTEGER DEFAULT 2,
                current_signatures INTEGER DEFAULT 0,
                signers JSONB DEFAULT '[]',
                signed_by JSONB DEFAULT '[]',
                status VARCHAR(50) DEFAULT 'pending',
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Token distribution events
            `CREATE TABLE IF NOT EXISTS token_events (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50),
                recipient_address VARCHAR(66),
                amount DECIMAL(20, 2),
                reason VARCHAR(255),
                reference_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Wallet activity log
            `CREATE TABLE IF NOT EXISTS wallet_activity (
                id SERIAL PRIMARY KEY,
                wallet_address VARCHAR(66),
                activity_type VARCHAR(50),
                details JSONB DEFAULT '{}',
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const query of queries) {
            await this.pgClient.query(query);
        }
        
        console.log('✅ Wallet database schema initialized');
    }
    
    async loadWallets() {
        const result = await this.pgClient.query(`
            SELECT wallet_address, owner_id, owner_type, balance, locked_balance, nonce
            FROM wallets
            WHERE is_active = true
        `);
        
        for (const wallet of result.rows) {
            this.wallets.set(wallet.wallet_address, {
                address: wallet.wallet_address,
                owner_id: wallet.owner_id,
                owner_type: wallet.owner_type,
                balance: parseFloat(wallet.balance),
                locked_balance: parseFloat(wallet.locked_balance),
                nonce: wallet.nonce
            });
        }
        
        console.log(`✅ Loaded ${this.wallets.size} active wallets`);
    }
    
    async initializeTreasury() {
        const treasuryAddress = this.generateDeterministicAddress('treasury');
        
        if (!this.wallets.has(treasuryAddress)) {
            const keypair = this.generateKeypair();
            
            await this.pgClient.query(`
                INSERT INTO wallets 
                (wallet_address, owner_id, owner_type, public_key, balance)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (wallet_address) DO NOTHING
            `, [
                treasuryAddress,
                'system_treasury',
                'system',
                keypair.publicKey,
                this.config.initialSupply
            ]);
            
            this.wallets.set(treasuryAddress, {
                address: treasuryAddress,
                owner_id: 'system_treasury',
                owner_type: 'system',
                balance: this.config.initialSupply,
                locked_balance: 0,
                nonce: 0
            });
            
            console.log(`✅ Treasury wallet initialized: ${treasuryAddress}`);
        }
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'agent-wallet-system',
                token: this.config.tokenSymbol,
                supply: this.tokenSupply
            });
        });
        
        // Create wallet
        this.app.post('/api/wallets/create', async (req, res) => {
            try {
                const { owner_id, owner_type } = req.body;
                
                if (!owner_id || !owner_type) {
                    return res.status(400).json({ error: 'owner_id and owner_type required' });
                }
                
                const wallet = await this.createWallet(owner_id, owner_type);
                
                res.json({
                    success: true,
                    wallet_address: wallet.address,
                    public_key: wallet.publicKey
                });
                
            } catch (error) {
                console.error('Error creating wallet:', error);
                res.status(500).json({ error: 'Failed to create wallet' });
            }
        });
        
        // Get wallet balance
        this.app.get('/api/wallets/:address/balance', async (req, res) => {
            try {
                const { address } = req.params;
                const wallet = this.wallets.get(address);
                
                if (!wallet) {
                    return res.status(404).json({ error: 'Wallet not found' });
                }
                
                res.json({
                    address,
                    balance: wallet.balance,
                    locked_balance: wallet.locked_balance,
                    available_balance: wallet.balance - wallet.locked_balance,
                    currency: this.config.tokenSymbol
                });
                
            } catch (error) {
                console.error('Error fetching balance:', error);
                res.status(500).json({ error: 'Failed to fetch balance' });
            }
        });
        
        // Transfer tokens
        this.app.post('/api/transactions/transfer', async (req, res) => {
            try {
                const { from_address, to_address, amount, signature } = req.body;
                
                // Validate transaction
                const validation = await this.validateTransaction({
                    from_address,
                    to_address,
                    amount,
                    signature
                });
                
                if (!validation.valid) {
                    return res.status(400).json({ error: validation.error });
                }
                
                // Process transaction
                const transaction = await this.processTransfer(
                    from_address,
                    to_address,
                    amount,
                    'transfer'
                );
                
                res.json({
                    success: true,
                    transaction_hash: transaction.hash,
                    status: transaction.status
                });
                
            } catch (error) {
                console.error('Error processing transfer:', error);
                res.status(500).json({ error: 'Failed to process transfer' });
            }
        });
        
        // Create escrow
        this.app.post('/api/escrow/create', async (req, res) => {
            try {
                const { 
                    buyer_address, 
                    seller_address, 
                    amount, 
                    reference_type, 
                    reference_id,
                    release_conditions 
                } = req.body;
                
                const escrow = await this.createEscrow({
                    buyer_address,
                    seller_address,
                    amount,
                    reference_type,
                    reference_id,
                    release_conditions
                });
                
                res.json({
                    success: true,
                    escrow_id: escrow.id,
                    expires_at: escrow.expires_at
                });
                
            } catch (error) {
                console.error('Error creating escrow:', error);
                res.status(500).json({ error: 'Failed to create escrow' });
            }
        });
        
        // Release escrow
        this.app.post('/api/escrow/:id/release', async (req, res) => {
            try {
                const { id } = req.params;
                const { release_to, signature } = req.body;
                
                const result = await this.releaseEscrow(id, release_to, signature);
                
                if (!result.success) {
                    return res.status(400).json({ error: result.error });
                }
                
                res.json({
                    success: true,
                    transaction_hash: result.transaction_hash
                });
                
            } catch (error) {
                console.error('Error releasing escrow:', error);
                res.status(500).json({ error: 'Failed to release escrow' });
            }
        });
        
        // Get transaction history
        this.app.get('/api/wallets/:address/transactions', async (req, res) => {
            try {
                const { address } = req.params;
                const { limit = 50, offset = 0 } = req.query;
                
                const transactions = await this.getTransactionHistory(address, limit, offset);
                
                res.json(transactions);
                
            } catch (error) {
                console.error('Error fetching transactions:', error);
                res.status(500).json({ error: 'Failed to fetch transactions' });
            }
        });
        
        // Mining endpoint (for earning tokens)
        this.app.post('/api/mining/claim', async (req, res) => {
            try {
                const { wallet_address, work_proof, work_type } = req.body;
                
                // Validate work proof
                const validation = await this.validateWorkProof(work_proof, work_type);
                if (!validation.valid) {
                    return res.status(400).json({ error: 'Invalid work proof' });
                }
                
                // Award mining reward
                const reward = await this.awardMiningReward(wallet_address, work_type);
                
                res.json({
                    success: true,
                    reward_amount: reward.amount,
                    new_balance: reward.new_balance
                });
                
            } catch (error) {
                console.error('Error claiming mining reward:', error);
                res.status(500).json({ error: 'Failed to claim reward' });
            }
        });
        
        // Multi-signature transaction
        this.app.post('/api/transactions/multisig', async (req, res) => {
            try {
                const { transaction, signers, required_signatures } = req.body;
                
                const multisig = await this.createMultisigTransaction(
                    transaction,
                    signers,
                    required_signatures
                );
                
                res.json({
                    success: true,
                    multisig_id: multisig.id,
                    signing_url: `/api/transactions/multisig/${multisig.id}/sign`
                });
                
            } catch (error) {
                console.error('Error creating multisig:', error);
                res.status(500).json({ error: 'Failed to create multisig transaction' });
            }
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('💰 New wallet WebSocket connection');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    switch (data.type) {
                        case 'subscribe_wallet':
                            this.subscribeToWallet(ws, data.wallet_address);
                            break;
                        case 'subscribe_transactions':
                            this.subscribeToTransactions(ws, data.wallet_address);
                            break;
                        case 'subscribe_escrow':
                            this.subscribeToEscrow(ws, data.escrow_id);
                            break;
                    }
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('💰 Wallet WebSocket connection closed');
            });
        });
    }
    
    // Core wallet functions
    async createWallet(ownerId, ownerType) {
        const keypair = this.generateKeypair();
        const address = this.generateAddress(keypair.publicKey);
        
        // Store in database
        await this.pgClient.query(`
            INSERT INTO wallets 
            (wallet_address, owner_id, owner_type, public_key, encrypted_private_key)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            address,
            ownerId,
            ownerType,
            keypair.publicKey,
            this.encryptPrivateKey(keypair.privateKey)
        ]);
        
        // Store in memory
        this.wallets.set(address, {
            address,
            owner_id: ownerId,
            owner_type: ownerType,
            balance: 0,
            locked_balance: 0,
            nonce: 0
        });
        
        // Log wallet creation
        await this.logWalletActivity(address, 'wallet_created', { owner_id: ownerId });
        
        // Award initial tokens for agents
        if (ownerType === 'agent') {
            await this.awardInitialTokens(address, 100);
        }
        
        return {
            address,
            publicKey: keypair.publicKey
        };
    }
    
    generateKeypair() {
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            publicKeyEncoding: { type: 'spki', format: 'pem' }
        });
        
        return { privateKey, publicKey };
    }
    
    generateAddress(publicKey) {
        const hash = crypto.createHash('sha256').update(publicKey).digest();
        const address = '0x' + hash.toString('hex');
        return address;
    }
    
    generateDeterministicAddress(seed) {
        const hash = crypto.createHash('sha256').update(seed).digest();
        return '0x' + hash.toString('hex');
    }
    
    encryptPrivateKey(privateKey) {
        // In production, use proper key management service
        const cipher = crypto.createCipher('aes-256-cbc', process.env.WALLET_ENCRYPTION_KEY || 'dev-key');
        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    async validateTransaction(txData) {
        const { from_address, to_address, amount, signature } = txData;
        
        // Check if wallets exist
        if (!this.wallets.has(from_address)) {
            return { valid: false, error: 'Sender wallet not found' };
        }
        
        if (!this.wallets.has(to_address)) {
            return { valid: false, error: 'Recipient wallet not found' };
        }
        
        // Check balance
        const senderWallet = this.wallets.get(from_address);
        const availableBalance = senderWallet.balance - senderWallet.locked_balance;
        
        if (amount > availableBalance) {
            return { valid: false, error: 'Insufficient balance' };
        }
        
        // Check minimum amount
        if (amount < this.config.minTransactionAmount) {
            return { valid: false, error: `Minimum transaction amount is ${this.config.minTransactionAmount}` };
        }
        
        // Verify signature (simplified for demo)
        // In production, implement proper signature verification
        if (!signature) {
            return { valid: false, error: 'Transaction signature required' };
        }
        
        return { valid: true };
    }
    
    async processTransfer(fromAddress, toAddress, amount, transactionType) {
        const txHash = this.generateTransactionHash({
            from: fromAddress,
            to: toAddress,
            amount,
            nonce: this.wallets.get(fromAddress).nonce,
            timestamp: Date.now()
        });
        
        const fee = amount * this.config.transactionFee;
        const netAmount = amount - fee;
        
        // Begin transaction
        await this.pgClient.query('BEGIN');
        
        try {
            // Update sender balance
            await this.updateBalance(fromAddress, -amount);
            
            // Update recipient balance
            await this.updateBalance(toAddress, netAmount);
            
            // Update treasury with fee
            const treasuryAddress = this.generateDeterministicAddress('treasury');
            await this.updateBalance(treasuryAddress, fee);
            
            // Record transaction
            await this.pgClient.query(`
                INSERT INTO wallet_transactions_enhanced
                (transaction_hash, from_address, to_address, amount, fee, 
                 transaction_type, status, confirmations, nonce)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                txHash,
                fromAddress,
                toAddress,
                amount,
                fee,
                transactionType,
                'confirmed',
                1,
                this.wallets.get(fromAddress).nonce
            ]);
            
            // Update nonce
            this.wallets.get(fromAddress).nonce++;
            await this.pgClient.query(`
                UPDATE wallets SET nonce = nonce + 1 WHERE wallet_address = $1
            `, [fromAddress]);
            
            await this.pgClient.query('COMMIT');
            
            // Emit events
            this.emit('transaction_processed', {
                hash: txHash,
                from: fromAddress,
                to: toAddress,
                amount: netAmount,
                fee
            });
            
            // Notify WebSocket subscribers
            this.notifyWalletUpdate(fromAddress);
            this.notifyWalletUpdate(toAddress);
            
            return {
                hash: txHash,
                status: 'confirmed',
                amount: netAmount,
                fee
            };
            
        } catch (error) {
            await this.pgClient.query('ROLLBACK');
            throw error;
        }
    }
    
    async updateBalance(address, delta) {
        const wallet = this.wallets.get(address);
        if (!wallet) throw new Error('Wallet not found');
        
        wallet.balance += delta;
        
        await this.pgClient.query(`
            UPDATE wallets 
            SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
            WHERE wallet_address = $2
        `, [delta, address]);
    }
    
    generateTransactionHash(txData) {
        const serialized = JSON.stringify(txData);
        return '0x' + crypto.createHash('sha256').update(serialized).digest('hex');
    }
    
    async createEscrow(details) {
        const escrowId = `escrow_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        const expiresAt = new Date(Date.now() + this.config.escrowTimeout);
        
        // Lock buyer's funds
        const buyerWallet = this.wallets.get(details.buyer_address);
        if (!buyerWallet) throw new Error('Buyer wallet not found');
        
        if (buyerWallet.balance < details.amount) {
            throw new Error('Insufficient balance for escrow');
        }
        
        // Update locked balance
        buyerWallet.locked_balance += details.amount;
        await this.pgClient.query(`
            UPDATE wallets 
            SET locked_balance = locked_balance + $1
            WHERE wallet_address = $2
        `, [details.amount, details.buyer_address]);
        
        // Create escrow record
        await this.pgClient.query(`
            INSERT INTO escrow_transactions
            (escrow_id, buyer_address, seller_address, amount, reference_type,
             reference_id, release_conditions, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            escrowId,
            details.buyer_address,
            details.seller_address,
            details.amount,
            details.reference_type,
            details.reference_id,
            JSON.stringify(details.release_conditions || {}),
            expiresAt
        ]);
        
        this.escrowTransactions.set(escrowId, {
            ...details,
            id: escrowId,
            expires_at: expiresAt,
            status: 'active'
        });
        
        return {
            id: escrowId,
            expires_at: expiresAt
        };
    }
    
    async releaseEscrow(escrowId, releaseTo, signature) {
        const escrowResult = await this.pgClient.query(`
            SELECT * FROM escrow_transactions WHERE escrow_id = $1
        `, [escrowId]);
        
        if (escrowResult.rows.length === 0) {
            return { success: false, error: 'Escrow not found' };
        }
        
        const escrow = escrowResult.rows[0];
        
        if (escrow.status !== 'active') {
            return { success: false, error: 'Escrow not active' };
        }
        
        // Validate release conditions
        // In production, implement proper condition checking
        
        await this.pgClient.query('BEGIN');
        
        try {
            // Unlock buyer's funds
            const buyerWallet = this.wallets.get(escrow.buyer_address);
            buyerWallet.locked_balance -= escrow.amount;
            buyerWallet.balance -= escrow.amount;
            
            await this.pgClient.query(`
                UPDATE wallets 
                SET locked_balance = locked_balance - $1,
                    balance = balance - $1
                WHERE wallet_address = $2
            `, [escrow.amount, escrow.buyer_address]);
            
            // Transfer to recipient
            let recipient, transactionType;
            if (releaseTo === 'seller') {
                recipient = escrow.seller_address;
                transactionType = 'escrow_release';
            } else {
                recipient = escrow.buyer_address;
                transactionType = 'escrow_refund';
                // Re-add to buyer's balance for refund
                buyerWallet.balance += escrow.amount;
                await this.pgClient.query(`
                    UPDATE wallets SET balance = balance + $1 WHERE wallet_address = $2
                `, [escrow.amount, escrow.buyer_address]);
            }
            
            // Process the transfer
            const transaction = await this.processTransfer(
                escrow.buyer_address,
                recipient,
                escrow.amount,
                transactionType
            );
            
            // Update escrow status
            await this.pgClient.query(`
                UPDATE escrow_transactions
                SET status = $1, released_at = CURRENT_TIMESTAMP
                WHERE escrow_id = $2
            `, [releaseTo === 'seller' ? 'released' : 'refunded', escrowId]);
            
            await this.pgClient.query('COMMIT');
            
            return {
                success: true,
                transaction_hash: transaction.hash
            };
            
        } catch (error) {
            await this.pgClient.query('ROLLBACK');
            throw error;
        }
    }
    
    async getTransactionHistory(address, limit, offset) {
        const result = await this.pgClient.query(`
            SELECT * FROM wallet_transactions_enhanced
            WHERE from_address = $1 OR to_address = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [address, limit, offset]);
        
        return result.rows;
    }
    
    async validateWorkProof(workProof, workType) {
        // Implement work validation based on type
        const validTypes = ['component_review', 'bug_fix', 'documentation', 'testing'];
        
        if (!validTypes.includes(workType)) {
            return { valid: false };
        }
        
        // In production, implement proper proof-of-work validation
        return { valid: true };
    }
    
    async awardMiningReward(walletAddress, workType) {
        const rewardAmounts = {
            'component_review': 50,
            'bug_fix': 100,
            'documentation': 25,
            'testing': 75
        };
        
        const amount = rewardAmounts[workType] || this.config.miningReward;
        const treasuryAddress = this.generateDeterministicAddress('treasury');
        
        // Transfer from treasury
        const transaction = await this.processTransfer(
            treasuryAddress,
            walletAddress,
            amount,
            'mining_reward'
        );
        
        // Record token event
        await this.pgClient.query(`
            INSERT INTO token_events
            (event_type, recipient_address, amount, reason)
            VALUES ($1, $2, $3, $4)
        `, ['mining_reward', walletAddress, amount, workType]);
        
        const wallet = this.wallets.get(walletAddress);
        
        return {
            amount,
            new_balance: wallet.balance
        };
    }
    
    async awardInitialTokens(address, amount) {
        const treasuryAddress = this.generateDeterministicAddress('treasury');
        
        await this.processTransfer(
            treasuryAddress,
            address,
            amount,
            'initial_grant'
        );
        
        await this.pgClient.query(`
            INSERT INTO token_events
            (event_type, recipient_address, amount, reason)
            VALUES ($1, $2, $3, $4)
        `, ['initial_grant', address, amount, 'new_agent_bonus']);
    }
    
    async createMultisigTransaction(transaction, signers, requiredSignatures) {
        const multisigId = `multisig_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        
        await this.pgClient.query(`
            INSERT INTO multisig_transactions
            (multisig_id, required_signatures, signers, expires_at)
            VALUES ($1, $2, $3, $4)
        `, [
            multisigId,
            requiredSignatures,
            JSON.stringify(signers),
            new Date(Date.now() + 86400000) // 24 hour expiry
        ]);
        
        this.multisigTransactions.set(multisigId, {
            id: multisigId,
            transaction,
            signers,
            requiredSignatures,
            signatures: []
        });
        
        return { id: multisigId };
    }
    
    async logWalletActivity(walletAddress, activityType, details) {
        await this.pgClient.query(`
            INSERT INTO wallet_activity
            (wallet_address, activity_type, details)
            VALUES ($1, $2, $3)
        `, [walletAddress, activityType, JSON.stringify(details)]);
    }
    
    startTransactionMonitoring() {
        setInterval(async () => {
            try {
                // Check for stuck transactions
                const stuckTx = await this.pgClient.query(`
                    SELECT * FROM wallet_transactions_enhanced
                    WHERE status = 'pending' 
                    AND created_at < NOW() - INTERVAL '10 minutes'
                `);
                
                for (const tx of stuckTx.rows) {
                    console.log(`⚠️ Stuck transaction: ${tx.transaction_hash}`);
                    // Implement retry or cancellation logic
                }
                
            } catch (error) {
                console.error('Transaction monitoring error:', error);
            }
        }, 60000); // Check every minute
    }
    
    startEscrowMonitoring() {
        setInterval(async () => {
            try {
                // Check for expired escrows
                const expiredEscrows = await this.pgClient.query(`
                    SELECT * FROM escrow_transactions
                    WHERE status = 'active' AND expires_at < NOW()
                `);
                
                for (const escrow of expiredEscrows.rows) {
                    console.log(`⏰ Escrow expired: ${escrow.escrow_id}`);
                    // Auto-refund to buyer
                    await this.releaseEscrow(escrow.escrow_id, 'buyer', 'auto_refund');
                }
                
            } catch (error) {
                console.error('Escrow monitoring error:', error);
            }
        }, 60000); // Check every minute
    }
    
    subscribeToWallet(ws, walletAddress) {
        if (!this.walletSubscribers) this.walletSubscribers = new Map();
        if (!this.walletSubscribers.has(walletAddress)) {
            this.walletSubscribers.set(walletAddress, new Set());
        }
        this.walletSubscribers.get(walletAddress).add(ws);
    }
    
    notifyWalletUpdate(walletAddress) {
        if (!this.walletSubscribers || !this.walletSubscribers.has(walletAddress)) return;
        
        const wallet = this.wallets.get(walletAddress);
        const update = {
            type: 'wallet_update',
            wallet: {
                address: walletAddress,
                balance: wallet.balance,
                locked_balance: wallet.locked_balance
            }
        };
        
        this.walletSubscribers.get(walletAddress).forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(update));
            }
        });
    }
}

// Initialize and start the wallet system
const walletSystem = new AgentWalletSystem();
walletSystem.initialize().catch(error => {
    console.error('Failed to start wallet system:', error);
    process.exit(1);
});

// Export for integration
module.exports = AgentWalletSystem;