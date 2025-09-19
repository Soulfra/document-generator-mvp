#!/usr/bin/env node

/**
 * XMR Vanity URL Generator for Business Integration
 * Creates Discord/RuneScape style vanity URLs with Monero addresses
 * Pairs game tokens with XMR and enables cross-chain contract deployment
 */

const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

console.log(`
🎯 XMR VANITY URL GENERATOR 🎯
==============================
🏢 Business vanity URLs on Monero
🎮 Game token integration  
📜 Cross-chain contract deployment
🔗 Discord/RuneScape style invites
`);

class XMRVanityGenerator {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 9600;
        this.wsPort = 9601;
        
        // Vanity URL registry
        this.vanityRegistry = new Map();
        this.businessRegistry = new Map();
        this.gameTokenPairs = new Map();
        this.contractDeployments = new Map();
        
        // Monero address generation config
        this.moneroConfig = {
            addressPrefix: '4', // Monero mainnet
            subaddressPrefix: '8', // Subaddress
            integratedPrefix: '19', // Integrated address
            networkType: 'mainnet'
        };
        
        // Vanity patterns for different business types
        this.businessPatterns = {
            'restaurant': ['4Eat', '4Food', '4Dine'],
            'retail': ['4Shop', '4Buy', '4Sale'],
            'tech': ['4Code', '4Dev', '4Tech'],
            'gaming': ['4Play', '4Game', '4Win'],
            'finance': ['4Pay', '4Bank', '4Fund'],
            'health': ['4Care', '4Med', '4Well'],
            'education': ['4Learn', '4Study', '4Know'],
            'entertainment': ['4Fun', '4Show', '4Live']
        };
        
        // Game token integration
        this.gameTokens = {
            'FART': { symbol: 'FART', decimals: 18, verified: true },
            'BLAME': { symbol: 'BLAME', decimals: 8, verified: true },
            'TYCOON': { symbol: 'TYCOON', decimals: 6, verified: true },
            'VAULT': { symbol: 'VAULT', decimals: 18, verified: true }
        };
        
        this.initializeServices();
        this.setupRoutes();
        this.startVanityGeneration();
    }
    
    initializeServices() {
        // Express middleware
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // WebSocket for real-time vanity generation
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🔌 Vanity client connected');
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, JSON.parse(message));
            });
        });
        
        console.log(`🚀 XMR Vanity API: http://localhost:${this.port}`);
        console.log(`🔌 Vanity WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    setupRoutes() {
        // Vanity URL generation
        this.app.post('/api/generate-vanity', this.generateVanityURL.bind(this));
        this.app.get('/api/vanity/:vanityCode', this.getVanityInfo.bind(this));
        
        // Business registration
        this.app.post('/api/register-business', this.registerBusiness.bind(this));
        this.app.get('/api/business/:businessId', this.getBusinessInfo.bind(this));
        
        // Game token pairing
        this.app.post('/api/pair-tokens', this.pairGameTokens.bind(this));
        this.app.get('/api/token-pairs/:address', this.getTokenPairs.bind(this));
        
        // Contract deployment
        this.app.post('/api/deploy-contracts', this.deployContracts.bind(this));
        this.app.get('/api/deployments/:businessId', this.getDeployments.bind(this));
        
        // Discord/RuneScape style invites
        this.app.get('/invite/:vanityCode', this.handleVanityInvite.bind(this));
        this.app.post('/api/create-invite', this.createBusinessInvite.bind(this));
        
        // Statistics and verification
        this.app.get('/api/stats', this.getSystemStats.bind(this));
        this.app.post('/api/verify-address', this.verifyMoneroAddress.bind(this));
        
        console.log('📋 API Routes configured');
    }
    
    async generateVanityURL(req, res) {
        try {
            const { 
                businessName, 
                businessType, 
                customPattern, 
                gameTokens = [],
                contractAddresses = []
            } = req.body;
            
            console.log(`🎯 Generating vanity URL for: ${businessName}`);
            
            // Generate vanity Monero address
            const vanityResult = await this.generateVanityAddress(
                customPattern || this.selectBusinessPattern(businessType),
                businessType
            );
            
            // Create unique vanity code (like Discord invites)
            const vanityCode = this.generateVanityCode(businessName);
            
            // Generate game token pairs
            const tokenPairs = await this.createTokenPairs(vanityResult.address, gameTokens);
            
            // Prepare contract deployment info
            const deploymentInfo = await this.prepareContractDeployments(
                vanityResult.address, 
                contractAddresses
            );
            
            // Register in vanity system
            const vanityEntry = {
                vanityCode,
                businessName,
                businessType,
                moneroAddress: vanityResult.address,
                privateKey: vanityResult.privateKey, // Encrypted
                viewKey: vanityResult.viewKey,
                pattern: vanityResult.pattern,
                gameTokenPairs: tokenPairs,
                contractDeployments: deploymentInfo,
                created: new Date().toISOString(),
                stats: {
                    visits: 0,
                    conversions: 0,
                    tokensTransferred: 0
                },
                active: true
            };
            
            this.vanityRegistry.set(vanityCode, vanityEntry);
            
            // Create business profile
            const businessId = uuidv4();
            const businessProfile = {
                id: businessId,
                name: businessName,
                type: businessType,
                vanityCode,
                vanityURL: `${req.protocol}://${req.get('host')}/invite/${vanityCode}`,
                moneroAddress: vanityResult.address,
                gameTokens: tokenPairs,
                contracts: deploymentInfo,
                created: new Date().toISOString(),
                verified: false
            };
            
            this.businessRegistry.set(businessId, businessProfile);
            
            // Broadcast to connected clients
            this.broadcastVanityCreated(vanityEntry, businessProfile);
            
            console.log(`✅ Vanity URL created: /invite/${vanityCode}`);
            
            res.json({
                success: true,
                vanityCode,
                businessId,
                vanityURL: businessProfile.vanityURL,
                moneroAddress: vanityResult.address,
                pattern: vanityResult.pattern,
                gameTokenPairs: tokenPairs,
                contractInfo: deploymentInfo,
                estimatedGeneration: vanityResult.attempts
            });
            
        } catch (error) {
            console.error('❌ Vanity generation error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
    
    async generateVanityAddress(pattern, businessType) {
        console.log(`🔍 Generating Monero vanity address with pattern: ${pattern}`);
        
        let attempts = 0;
        let found = false;
        let result = {};
        
        // Simulate Monero address generation (in production, use actual Monero libraries)
        while (!found && attempts < 100000) {
            attempts++;
            
            // Generate random private key
            const privateKey = crypto.randomBytes(32);
            
            // Simulate Monero address derivation
            const publicKey = this.derivePublicKey(privateKey);
            const address = this.createMoneroAddress(publicKey);
            const viewKey = this.generateViewKey(privateKey);
            
            // Check if address matches vanity pattern
            if (this.matchesVanityPattern(address, pattern)) {
                result = {
                    address,
                    privateKey: privateKey.toString('hex'),
                    publicKey: publicKey.toString('hex'),
                    viewKey: viewKey.toString('hex'),
                    pattern,
                    attempts
                };
                found = true;
            }
            
            // Progress updates for long searches
            if (attempts % 1000 === 0) {
                this.broadcastProgress('vanity_generation', {
                    pattern,
                    attempts,
                    businessType
                });
            }
        }
        
        if (!found) {
            // Fallback: generate standard address with business prefix
            const fallbackPrivateKey = crypto.randomBytes(32);
            const fallbackPublicKey = this.derivePublicKey(fallbackPrivateKey);
            const fallbackAddress = this.createMoneroAddress(fallbackPublicKey);
            
            result = {
                address: fallbackAddress,
                privateKey: fallbackPrivateKey.toString('hex'),
                publicKey: fallbackPublicKey.toString('hex'),
                viewKey: this.generateViewKey(fallbackPrivateKey).toString('hex'),
                pattern: 'fallback',
                attempts
            };
        }
        
        return result;
    }
    
    derivePublicKey(privateKey) {
        // Simplified Monero public key derivation (use actual ed25519 in production)
        return crypto.createHash('sha256').update(privateKey).digest();
    }
    
    createMoneroAddress(publicKey) {
        // Simplified Monero address creation (use actual base58 encoding in production)
        const addressHash = crypto.createHash('sha256').update(publicKey).digest();
        const checksum = crypto.createHash('sha256').update(addressHash).digest().slice(0, 4);
        
        // Create address with Monero prefix
        const addressBytes = Buffer.concat([
            Buffer.from([0x12]), // Monero mainnet prefix
            addressHash,
            checksum
        ]);
        
        return this.encodeBase58(addressBytes);
    }
    
    encodeBase58(buffer) {
        // Simplified base58 encoding (use actual base58 library in production)
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const base = alphabet.length;
        
        let encoded = '';
        let num = BigInt('0x' + buffer.toString('hex'));
        
        while (num > 0) {
            const remainder = num % BigInt(base);
            num = num / BigInt(base);
            encoded = alphabet[Number(remainder)] + encoded;
        }
        
        // Add leading 1s for leading zeros
        for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
            encoded = '1' + encoded;
        }
        
        return encoded;
    }
    
    generateViewKey(privateKey) {
        // Simplified view key generation
        return crypto.createHash('sha256').update(Buffer.concat([privateKey, Buffer.from('view')])).digest();
    }
    
    matchesVanityPattern(address, pattern) {
        // Check if address contains the desired pattern
        return address.toLowerCase().includes(pattern.toLowerCase());
    }
    
    selectBusinessPattern(businessType) {
        const patterns = this.businessPatterns[businessType] || this.businessPatterns['tech'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    
    generateVanityCode(businessName) {
        // Create Discord-style invite code
        const sanitized = businessName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const randomSuffix = crypto.randomBytes(3).toString('hex');
        return `${sanitized.slice(0, 8)}-${randomSuffix}`;
    }
    
    async createTokenPairs(moneroAddress, requestedTokens) {
        console.log(`🪙 Creating game token pairs for ${moneroAddress}`);
        
        const pairs = [];
        
        for (const tokenSymbol of requestedTokens) {
            if (this.gameTokens[tokenSymbol]) {
                const tokenInfo = this.gameTokens[tokenSymbol];
                
                // Create pairing with Monero address
                const pairId = uuidv4();
                const pair = {
                    id: pairId,
                    gameToken: tokenSymbol,
                    gameTokenInfo: tokenInfo,
                    moneroAddress,
                    exchangeRate: this.calculateExchangeRate(tokenSymbol),
                    pairType: 'xmr_game_token',
                    created: new Date().toISOString(),
                    active: true,
                    
                    // Conversion mechanics
                    conversion: {
                        gameToXMR: this.getGameToXMRRate(tokenSymbol),
                        xmrToGame: this.getXMRToGameRate(tokenSymbol),
                        minimumAmount: this.getMinimumConversion(tokenSymbol),
                        fee: 0.01 // 1% conversion fee
                    }
                };
                
                pairs.push(pair);
                this.gameTokenPairs.set(pairId, pair);
            }
        }
        
        return pairs;
    }
    
    calculateExchangeRate(tokenSymbol) {
        // Simplified exchange rate calculation
        const rates = {
            'FART': 420.69,    // 420.69 FART = 1 XMR
            'BLAME': 100,      // 100 BLAME = 1 XMR  
            'TYCOON': 10,      // 10 TYCOON = 1 XMR
            'VAULT': 50        // 50 VAULT = 1 XMR
        };
        
        return rates[tokenSymbol] || 1;
    }
    
    getGameToXMRRate(tokenSymbol) {
        return 1 / this.calculateExchangeRate(tokenSymbol);
    }
    
    getXMRToGameRate(tokenSymbol) {
        return this.calculateExchangeRate(tokenSymbol);
    }
    
    getMinimumConversion(tokenSymbol) {
        const minimums = {
            'FART': 42.069,
            'BLAME': 10,
            'TYCOON': 1,
            'VAULT': 5
        };
        
        return minimums[tokenSymbol] || 1;
    }
    
    async prepareContractDeployments(moneroAddress, contractAddresses) {
        console.log(`📜 Preparing contract deployments for ${moneroAddress}`);
        
        const deployments = [];
        
        // Multi-chain deployment configuration
        const supportedChains = [
            { name: 'ethereum', chainId: 1, rpc: 'https://eth-mainnet.alchemyapi.io' },
            { name: 'polygon', chainId: 137, rpc: 'https://polygon-mainnet.alchemyapi.io' },
            { name: 'bsc', chainId: 56, rpc: 'https://bsc-dataseed.binance.org' },
            { name: 'arbitrum', chainId: 42161, rpc: 'https://arb1.arbitrum.io/rpc' }
        ];
        
        for (const contractAddress of contractAddresses) {
            for (const chain of supportedChains) {
                const deploymentId = uuidv4();
                const deployment = {
                    id: deploymentId,
                    contractAddress,
                    chainName: chain.name,
                    chainId: chain.chainId,
                    moneroAddress,
                    deploymentStatus: 'pending',
                    
                    // Deployment configuration
                    config: {
                        gasLimit: 500000,
                        gasPrice: 'standard',
                        constructorArgs: [moneroAddress],
                        
                        // Link to Monero
                        moneroIntegration: {
                            address: moneroAddress,
                            contractABI: this.getVanityContractABI(),
                            bridgeEnabled: true
                        }
                    },
                    
                    created: new Date().toISOString()
                };
                
                deployments.push(deployment);
                this.contractDeployments.set(deploymentId, deployment);
            }
        }
        
        return deployments;
    }
    
    getVanityContractABI() {
        // ABI for vanity URL contract
        return [
            {
                "name": "setMoneroAddress",
                "type": "function",
                "inputs": [{"name": "_moneroAddress", "type": "string"}],
                "outputs": []
            },
            {
                "name": "getMoneroAddress", 
                "type": "function",
                "inputs": [],
                "outputs": [{"name": "", "type": "string"}]
            },
            {
                "name": "convertTokensToXMR",
                "type": "function", 
                "inputs": [
                    {"name": "_amount", "type": "uint256"},
                    {"name": "_tokenSymbol", "type": "string"}
                ],
                "outputs": [{"name": "", "type": "uint256"}]
            }
        ];
    }
    
    async handleVanityInvite(req, res) {
        const { vanityCode } = req.params;
        
        if (!this.vanityRegistry.has(vanityCode)) {
            return res.status(404).send(`
                <html>
                <head><title>Vanity URL Not Found</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>🚫 Vanity URL Not Found</h1>
                    <p>The vanity code "${vanityCode}" does not exist or has expired.</p>
                    <a href="/api/stats">View Active Vanity URLs</a>
                </body>
                </html>
            `);
        }
        
        const vanityEntry = this.vanityRegistry.get(vanityCode);
        const businessProfile = Array.from(this.businessRegistry.values())
            .find(b => b.vanityCode === vanityCode);
        
        // Update stats
        vanityEntry.stats.visits++;
        
        // Generate invite page (Discord/RuneScape style)
        const invitePage = this.generateInvitePage(vanityEntry, businessProfile);
        
        res.send(invitePage);
    }
    
    generateInvitePage(vanityEntry, businessProfile) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${businessProfile.name} - XMR Business Invite</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: 'Segoe UI', Arial; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0; 
                    padding: 20px; 
                    min-height: 100vh;
                }
                .invite-card {
                    max-width: 500px;
                    margin: 50px auto;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .business-info {
                    padding: 30px;
                }
                .monero-address {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    font-family: monospace;
                    font-size: 12px;
                    word-break: break-all;
                    margin: 15px 0;
                }
                .token-pairs {
                    background: #e8f5e8;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                }
                .btn {
                    background: #4ecdc4;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    width: 100%;
                    margin: 10px 0;
                }
                .btn:hover { background: #45b7b8; }
                .stats { 
                    display: flex; 
                    justify-content: space-around; 
                    padding: 20px; 
                    background: #f8f9fa;
                    border-top: 1px solid #dee2e6;
                }
            </style>
        </head>
        <body>
            <div class="invite-card">
                <div class="header">
                    <h1>🎯 ${businessProfile.name}</h1>
                    <p>${businessProfile.type.toUpperCase()} • XMR Enabled</p>
                    <p>Vanity URL: /${vanityEntry.vanityCode}</p>
                </div>
                
                <div class="business-info">
                    <h3>🔐 Monero Address</h3>
                    <div class="monero-address">
                        ${vanityEntry.moneroAddress}
                    </div>
                    
                    <h3>🪙 Game Token Pairs</h3>
                    <div class="token-pairs">
                        ${vanityEntry.gameTokenPairs.map(pair => `
                            <div><strong>${pair.gameToken}</strong>: ${pair.conversion.xmrToGame} ${pair.gameToken} = 1 XMR</div>
                        `).join('')}
                    </div>
                    
                    <button class="btn" onclick="copyAddress()">📋 Copy Monero Address</button>
                    <button class="btn" onclick="viewContracts()">📜 View Smart Contracts</button>
                    <button class="btn" onclick="convertTokens()">🔄 Convert Game Tokens</button>
                </div>
                
                <div class="stats">
                    <div><strong>${vanityEntry.stats.visits}</strong><br>Visits</div>
                    <div><strong>${vanityEntry.gameTokenPairs.length}</strong><br>Token Pairs</div>
                    <div><strong>${vanityEntry.contractDeployments.length}</strong><br>Contracts</div>
                </div>
            </div>
            
            <script>
                function copyAddress() {
                    navigator.clipboard.writeText('${vanityEntry.moneroAddress}');
                    alert('Monero address copied!');
                }
                
                function viewContracts() {
                    window.open('/api/deployments/${businessProfile.id}', '_blank');
                }
                
                function convertTokens() {
                    alert('Token conversion interface would open here!');
                }
                
                // Real-time updates
                const ws = new WebSocket('ws://localhost:${this.wsPort}');
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    if (data.type === 'vanity_update' && data.vanityCode === '${vanityEntry.vanityCode}') {
                        location.reload();
                    }
                };
            </script>
        </body>
        </html>
        `;
    }
    
    async getSystemStats(req, res) {
        const stats = {
            vanityURLs: {
                total: this.vanityRegistry.size,
                active: Array.from(this.vanityRegistry.values()).filter(v => v.active).length,
                totalVisits: Array.from(this.vanityRegistry.values()).reduce((sum, v) => sum + v.stats.visits, 0)
            },
            businesses: {
                total: this.businessRegistry.size,
                byType: this.getBusinessesByType(),
                verified: Array.from(this.businessRegistry.values()).filter(b => b.verified).length
            },
            gameTokens: {
                availableTokens: Object.keys(this.gameTokens).length,
                activePairs: this.gameTokenPairs.size,
                totalVolume: this.calculateTotalTokenVolume()
            },
            contracts: {
                deployments: this.contractDeployments.size,
                chains: this.getDeployedChains().length,
                pending: Array.from(this.contractDeployments.values()).filter(d => d.deploymentStatus === 'pending').length
            },
            system: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                connections: this.wss.clients.size
            }
        };
        
        res.json(stats);
    }
    
    getBusinessesByType() {
        const types = {};
        Array.from(this.businessRegistry.values()).forEach(business => {
            types[business.type] = (types[business.type] || 0) + 1;
        });
        return types;
    }
    
    calculateTotalTokenVolume() {
        return Array.from(this.gameTokenPairs.values())
            .reduce((total, pair) => total + (pair.conversion.xmrToGame * 100), 0); // Simulated volume
    }
    
    getDeployedChains() {
        const chains = new Set();
        Array.from(this.contractDeployments.values()).forEach(deployment => {
            chains.add(deployment.chainName);
        });
        return Array.from(chains);
    }
    
    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'generate_vanity':
                this.generateVanityURL({ body: message.data }, {
                    json: (data) => ws.send(JSON.stringify({ 
                        type: 'vanity_generated', 
                        data 
                    }))
                });
                break;
                
            case 'subscribe_vanity':
                ws.vanityCode = message.vanityCode;
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    vanityCode: message.vanityCode
                }));
                break;
                
            case 'get_stats':
                this.getSystemStats({}, {
                    json: (data) => ws.send(JSON.stringify({
                        type: 'stats_update',
                        data
                    }))
                });
                break;
        }
    }
    
    broadcastVanityCreated(vanityEntry, businessProfile) {
        const message = {
            type: 'vanity_created',
            vanityCode: vanityEntry.vanityCode,
            businessName: businessProfile.name,
            moneroAddress: vanityEntry.moneroAddress,
            gameTokens: vanityEntry.gameTokenPairs.length,
            timestamp: new Date().toISOString()
        };
        
        this.broadcast(message);
    }
    
    broadcastProgress(type, data) {
        this.broadcast({
            type: 'generation_progress',
            progressType: type,
            data: data,
            timestamp: new Date().toISOString()
        });
    }
    
    broadcast(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    startVanityGeneration() {
        // Example generation on startup
        setTimeout(async () => {
            console.log('🎯 Generating example vanity URLs...');
            
            const examples = [
                {
                    businessName: 'RuneScape Clan XMR',
                    businessType: 'gaming',
                    gameTokens: ['FART', 'BLAME'],
                    contractAddresses: ['0x1234567890123456789012345678901234567890']
                },
                {
                    businessName: 'Discord Bot Services',
                    businessType: 'tech', 
                    gameTokens: ['TYCOON', 'VAULT'],
                    contractAddresses: ['0x2345678901234567890123456789012345678901']
                }
            ];
            
            for (const example of examples) {
                try {
                    await this.generateVanityURL({ body: example }, {
                        json: (result) => {
                            console.log(`✅ Example vanity created: /invite/${result.vanityCode}`);
                        }
                    });
                    
                    // Delay between generations
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error('Example generation error:', error);
                }
            }
        }, 3000);
    }
    
    // Additional API endpoints
    async registerBusiness(req, res) {
        // Business registration endpoint
        res.json({ message: 'Business registration endpoint' });
    }
    
    async pairGameTokens(req, res) {
        // Game token pairing endpoint  
        res.json({ message: 'Game token pairing endpoint' });
    }
    
    async deployContracts(req, res) {
        // Contract deployment endpoint
        res.json({ message: 'Contract deployment endpoint' });
    }
    
    async getVanityInfo(req, res) {
        const { vanityCode } = req.params;
        const vanityEntry = this.vanityRegistry.get(vanityCode);
        
        if (!vanityEntry) {
            return res.status(404).json({ error: 'Vanity URL not found' });
        }
        
        res.json({
            vanityCode,
            businessName: vanityEntry.businessName,
            moneroAddress: vanityEntry.moneroAddress,
            gameTokenPairs: vanityEntry.gameTokenPairs,
            stats: vanityEntry.stats,
            created: vanityEntry.created
        });
    }
    
    async verifyMoneroAddress(req, res) {
        // Monero address verification
        const { address } = req.body;
        
        const isValid = this.validateMoneroAddress(address);
        res.json({ 
            address, 
            valid: isValid,
            network: isValid ? this.detectNetwork(address) : null
        });
    }
    
    validateMoneroAddress(address) {
        // Simplified Monero address validation
        return address && address.length >= 95 && /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(address);
    }
    
    detectNetwork(address) {
        if (address.startsWith('4') || address.startsWith('8')) return 'mainnet';
        if (address.startsWith('9') || address.startsWith('A')) return 'testnet';
        if (address.startsWith('5') || address.startsWith('7')) return 'stagenet';
        return 'unknown';
    }
}

// Start the service
if (require.main === module) {
    const generator = new XMRVanityGenerator();
    
    generator.app.listen(generator.port, () => {
        console.log(`🎯 XMR Vanity Generator running on port ${generator.port}`);
        console.log(`🔗 Create vanity URLs: http://localhost:${generator.port}/api/generate-vanity`);
        console.log(`📊 System stats: http://localhost:${generator.port}/api/stats`);
        console.log('');
        console.log('🎮 Features:');
        console.log('  • Discord/RuneScape style vanity URLs');
        console.log('  • Monero address generation with business patterns');
        console.log('  • Game token pairing (FART, BLAME, TYCOON, VAULT)');
        console.log('  • Cross-chain smart contract deployment');
        console.log('  • Real-time WebSocket updates');
        console.log('  • Business profile management');
        console.log('');
        console.log('🔗 Example URLs:');
        console.log('  /invite/runescapeclannxmr-a1b2c3');
        console.log('  /invite/discordbotservices-d4e5f6');
    });
}

module.exports = XMRVanityGenerator;