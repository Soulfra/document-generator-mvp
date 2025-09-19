/**
 * Integration module for Mobile Idle Tycoon
 * Connects with existing wallet, QR, and authentication systems
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class MobileIdleIntegration extends EventEmitter {
    constructor(gameEngine) {
        super();
        this.gameEngine = gameEngine;
        this.connections = {
            wallet: null,
            qrAuth: null,
            vault: null,
            sovereign: null
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔌 Initializing integrations...');
        
        // Connect to existing services
        await this.connectWalletService();
        await this.connectQRAuth();
        await this.connectVaultService();
        await this.connectSovereignGateway();
        
        console.log('✅ All integrations connected');
    }
    
    // Connect to existing wallet service
    async connectWalletService() {
        try {
            // Check if wallet service is running
            const walletUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:8085';
            const response = await fetch(`${walletUrl}/api/health`);
            
            if (response.ok) {
                this.connections.wallet = {
                    url: walletUrl,
                    connected: true
                };
                console.log('✅ Connected to wallet service');
                
                // Setup wallet integration
                this.setupWalletIntegration();
            }
        } catch (error) {
            console.log('⚠️  Wallet service not available - using local storage');
            this.connections.wallet = { connected: false };
        }
    }
    
    // Connect to QR authentication system
    async connectQRAuth() {
        try {
            const qrAuthUrl = process.env.QR_AUTH_URL || 'http://localhost:3001';
            const response = await fetch(`${qrAuthUrl}/api/health`);
            
            if (response.ok) {
                this.connections.qrAuth = {
                    url: qrAuthUrl,
                    connected: true
                };
                console.log('✅ Connected to QR auth service');
                
                // Setup QR auth integration
                this.setupQRAuth();
            }
        } catch (error) {
            console.log('⚠️  QR auth service not available');
            this.connections.qrAuth = { connected: false };
        }
    }
    
    // Connect to vault storage service
    async connectVaultService() {
        try {
            const vaultUrl = process.env.VAULT_SERVICE_URL || 'http://localhost:8000';
            const response = await fetch(`${vaultUrl}/api/health`);
            
            if (response.ok) {
                this.connections.vault = {
                    url: vaultUrl,
                    connected: true
                };
                console.log('✅ Connected to vault service');
                
                // Use vault for secure game saves
                this.setupVaultStorage();
            }
        } catch (error) {
            console.log('⚠️  Vault service not available - using local storage');
            this.connections.vault = { connected: false };
        }
    }
    
    // Connect to sovereign gateway (from One Piece economy)
    async connectSovereignGateway() {
        if (this.gameEngine.onePieceEconomy && this.gameEngine.onePieceEconomy.gateway) {
            this.connections.sovereign = {
                gateway: this.gameEngine.onePieceEconomy.gateway,
                connected: true
            };
            console.log('✅ Connected to Sovereign Gateway');
        }
    }
    
    // Setup wallet integration
    setupWalletIntegration() {
        // Override game's payment methods to use wallet
        const originalPay = this.gameEngine.onePieceEconomy.contracts.pay;
        
        this.gameEngine.onePieceEconomy.contracts.pay = async (amount) => {
            // First check wallet balance
            const walletBalance = await this.getWalletBalance();
            
            if (walletBalance < amount) {
                throw new Error('Insufficient wallet balance');
            }
            
            // Process payment through wallet
            const txResult = await this.processWalletPayment(amount);
            
            // Then process in game
            return originalPay.call(this.gameEngine.onePieceEconomy.contracts, amount);
        };
    }
    
    // Get wallet balance
    async getWalletBalance() {
        if (!this.connections.wallet.connected) {
            return this.gameEngine.gameState.resources.gold;
        }
        
        try {
            const response = await fetch(`${this.connections.wallet.url}/api/balance`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            return data.balance;
        } catch (error) {
            console.error('Failed to get wallet balance:', error);
            return 0;
        }
    }
    
    // Process wallet payment
    async processWalletPayment(amount) {
        if (!this.connections.wallet.connected) {
            // Fallback to local resources
            this.gameEngine.gameState.resources.gold -= amount;
            return { success: true, txHash: crypto.randomBytes(32).toString('hex') };
        }
        
        try {
            const response = await fetch(`${this.connections.wallet.url}/api/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    amount,
                    recipient: 'pirate-islands-clash',
                    memo: 'Game progression payment'
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Wallet payment failed:', error);
            throw error;
        }
    }
    
    // Setup QR authentication
    setupQRAuth() {
        // Generate QR code for mobile login
        this.generateLoginQR = async () => {
            const sessionId = crypto.randomBytes(16).toString('hex');
            const loginUrl = `${this.connections.qrAuth.url}/auth/mobile/${sessionId}`;
            
            try {
                const response = await fetch(`${this.connections.qrAuth.url}/api/qr/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: loginUrl,
                        sessionId,
                        type: 'mobile-game-login'
                    })
                });
                
                const { qrCode } = await response.json();
                
                // Listen for scan completion
                this.waitForQRScan(sessionId);
                
                return qrCode;
            } catch (error) {
                console.error('Failed to generate QR code:', error);
                return null;
            }
        };
    }
    
    // Wait for QR scan completion
    async waitForQRScan(sessionId) {
        const checkInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.connections.qrAuth.url}/api/qr/status/${sessionId}`);
                const { status, userData } = await response.json();
                
                if (status === 'completed') {
                    clearInterval(checkInterval);
                    
                    // Load user's game data
                    await this.loadUserGameData(userData);
                    
                    this.emit('qr_auth_success', userData);
                }
            } catch (error) {
                console.error('QR scan check failed:', error);
            }
        }, 2000);
        
        // Timeout after 5 minutes
        setTimeout(() => clearInterval(checkInterval), 300000);
    }
    
    // Setup vault storage for secure saves
    setupVaultStorage() {
        // Override game's save/load methods
        const originalSave = this.gameEngine.saveGame.bind(this.gameEngine);
        const originalLoad = this.gameEngine.loadGame.bind(this.gameEngine);
        
        this.gameEngine.saveGame = async () => {
            const saveData = await originalSave();
            
            // Also save to vault
            if (this.connections.vault.connected) {
                try {
                    await fetch(`${this.connections.vault.url}/api/vault/store`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.getAuthToken()}`
                        },
                        body: JSON.stringify({
                            key: `game-save-${this.gameEngine.gameState.player.id}`,
                            data: saveData,
                            encrypted: true
                        })
                    });
                    
                    console.log('💾 Game saved to vault');
                } catch (error) {
                    console.error('Vault save failed:', error);
                }
            }
            
            return saveData;
        };
        
        this.gameEngine.loadGame = async () => {
            // Try vault first
            if (this.connections.vault.connected) {
                try {
                    const response = await fetch(
                        `${this.connections.vault.url}/api/vault/retrieve/game-save-${this.gameEngine.gameState.player.id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${this.getAuthToken()}`
                            }
                        }
                    );
                    
                    if (response.ok) {
                        const { data } = await response.json();
                        console.log('💾 Game loaded from vault');
                        return data;
                    }
                } catch (error) {
                    console.error('Vault load failed:', error);
                }
            }
            
            // Fallback to local
            return originalLoad();
        };
    }
    
    // Load user's game data after authentication
    async loadUserGameData(userData) {
        // Check if user has existing game data
        const saveKey = `game-save-${userData.id}`;
        
        if (this.connections.vault.connected) {
            try {
                const response = await fetch(
                    `${this.connections.vault.url}/api/vault/retrieve/${saveKey}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${userData.token}`
                        }
                    }
                );
                
                if (response.ok) {
                    const { data } = await response.json();
                    this.gameEngine.gameState = data;
                    this.gameEngine.calculateOfflineProgress();
                    this.gameEngine.emit('game_loaded', data);
                    return;
                }
            } catch (error) {
                console.error('Failed to load user game data:', error);
            }
        }
        
        // Create new game for user
        await this.gameEngine.createNewGame();
        this.gameEngine.gameState.player.id = userData.id;
        this.gameEngine.gameState.player.name = userData.name || `Pirate_${userData.id}`;
    }
    
    // Get auth token (from session or local storage)
    getAuthToken() {
        // In a real implementation, this would get the JWT token
        return process.env.AUTH_TOKEN || 'demo-token';
    }
    
    // API endpoints for integration
    getIntegrationStatus() {
        return {
            wallet: this.connections.wallet,
            qrAuth: this.connections.qrAuth,
            vault: this.connections.vault,
            sovereign: this.connections.sovereign ? { connected: true } : { connected: false }
        };
    }
    
    // Generate shareable game link
    async generateShareLink() {
        const gameState = this.gameEngine.getGameState();
        const shareData = {
            playerId: gameState.player.id,
            playerName: gameState.player.name,
            level: gameState.player.level,
            islands: gameState.islands.length,
            timestamp: Date.now()
        };
        
        // Encrypt share data
        const encrypted = Buffer.from(JSON.stringify(shareData)).toString('base64');
        const shareLink = `${process.env.GAME_URL || 'http://localhost:7778'}/join?data=${encrypted}`;
        
        return shareLink;
    }
    
    // Process referral/share link
    async processShareLink(encryptedData) {
        try {
            const decrypted = Buffer.from(encryptedData, 'base64').toString();
            const shareData = JSON.parse(decrypted);
            
            // Give referral bonus
            this.gameEngine.gameState.resources.gold += 1000;
            this.gameEngine.gameState.resources.berries += 100;
            
            this.emit('referral_processed', shareData);
            
            return shareData;
        } catch (error) {
            console.error('Invalid share link:', error);
            return null;
        }
    }
}

module.exports = MobileIdleIntegration;