/**
 * Arweave Wallet Authentication System
 * 
 * Handles Soulfra wallet authentication, user profile management,
 * and secure data storage on Arweave blockchain.
 */

class ArweaveWalletAuth {
    constructor(config = {}) {
        this.config = {
            requiredWallets: config.requiredWallets || [], // Specific Soulfra wallet addresses
            allowDemoMode: config.allowDemoMode !== false,
            arweaveConfig: {
                host: 'arweave.net',
                port: 443,
                protocol: 'https',
                ...config.arweaveConfig
            },
            storagePrefix: config.storagePrefix || 'soulfra_',
            ...config
        };

        // Authentication state
        this.isConnected = false;
        this.isAuthenticated = false;
        this.walletAddress = null;
        this.userProfile = null;
        this.permissions = [];
        this.arweave = null;

        // Soulfra wallet patterns and addresses
        this.soulfraWallets = {
            // Main Soulfra addresses (examples - replace with real ones)
            verified: [
                'soulfra_main_wallet_address_here',
                'deathtodata_wallet_address_here',
                // Add verified Soulfra community wallet addresses
            ],
            patterns: [
                /^soulfra_/i,
                /^deathtodata/i,
                /^soulfra\.ai/i,
                // Add regex patterns for Soulfra wallet identification
            ],
            domains: [
                'soulfra.ai',
                'deathtodata.com',
                // Add associated domains
            ]
        };

        this.init();
    }

    async init() {
        console.log('🔐 Arweave Wallet Auth initializing...');

        try {
            // Initialize Arweave client if available
            if (typeof Arweave !== 'undefined') {
                this.arweave = Arweave.init(this.config.arweaveConfig);
            }

            // Check for existing wallet connection
            await this.checkExistingConnection();
            
            // Set up wallet event listeners
            this.setupWalletListeners();

            console.log('✅ Arweave Wallet Auth ready');
        } catch (error) {
            console.error('❌ Failed to initialize wallet auth:', error);
            if (this.config.allowDemoMode) {
                console.log('📝 Demo mode available as fallback');
            }
        }
    }

    async checkExistingConnection() {
        try {
            if (window.arweaveWallet) {
                // Check if wallet is already connected
                const address = await window.arweaveWallet.getActiveAddress();
                
                if (address) {
                    this.walletAddress = address;
                    this.isConnected = true;
                    
                    // Verify if it's a Soulfra wallet
                    this.isAuthenticated = this.verifySoulfraWallet(address);
                    
                    if (this.isAuthenticated) {
                        await this.loadUserProfile();
                        this.triggerAuthEvent('authenticated', { address, profile: this.userProfile });
                    } else {
                        this.triggerAuthEvent('unauthorized', { address, reason: 'Not a Soulfra wallet' });
                    }
                }
            }
        } catch (error) {
            console.warn('Could not check existing wallet connection:', error);
        }
    }

    setupWalletListeners() {
        // Listen for wallet events
        if (window.arweaveWallet) {
            // ArConnect wallet change events
            window.addEventListener('arweaveWalletLoaded', () => {
                console.log('ArConnect wallet loaded');
                this.checkExistingConnection();
            });

            // Custom wallet change listener (if supported)
            window.addEventListener('walletSwitch', (event) => {
                console.log('Wallet switched:', event.detail);
                this.handleWalletChange(event.detail.address);
            });
        }

        // Periodically check wallet connection
        setInterval(() => {
            if (this.isConnected) {
                this.verifyConnection();
            }
        }, 30000); // Check every 30 seconds
    }

    verifySoulfraWallet(address) {
        if (!address) return false;

        // Check against verified wallet list
        if (this.soulfraWallets.verified.includes(address)) {
            console.log('✅ Verified Soulfra wallet:', address);
            return true;
        }

        // Check against patterns
        const matchesPattern = this.soulfraWallets.patterns.some(pattern => 
            pattern.test(address)
        );

        if (matchesPattern) {
            console.log('✅ Pattern-matched Soulfra wallet:', address);
            return true;
        }

        // For demo purposes, allow certain test patterns
        if (this.config.allowDemoMode && (
            address.toLowerCase().includes('test') ||
            address.toLowerCase().includes('demo') ||
            address.length === 43 // Standard Arweave address length
        )) {
            console.log('✅ Demo mode - allowing wallet:', address);
            return true;
        }

        console.log('❌ Wallet not recognized as Soulfra:', address);
        return false;
    }

    async connectWallet(requestedPermissions = ['ACCESS_ADDRESS', 'SIGN_TRANSACTION']) {
        try {
            if (!window.arweaveWallet) {
                throw new Error('ArConnect extension not found. Please install ArConnect.');
            }

            this.triggerAuthEvent('connecting');

            // Request wallet connection
            await window.arweaveWallet.connect(requestedPermissions);
            
            // Get wallet address
            const address = await window.arweaveWallet.getActiveAddress();
            
            if (!address) {
                throw new Error('Failed to get wallet address');
            }

            this.walletAddress = address;
            this.isConnected = true;
            this.permissions = requestedPermissions;

            // Verify Soulfra wallet
            this.isAuthenticated = this.verifySoulfraWallet(address);

            if (this.isAuthenticated) {
                await this.loadUserProfile();
                await this.saveConnectionData();
                
                this.triggerAuthEvent('authenticated', { 
                    address, 
                    profile: this.userProfile,
                    permissions: this.permissions 
                });

                console.log('🔓 Soulfra wallet authenticated:', address);
                return {
                    success: true,
                    address,
                    profile: this.userProfile
                };
            } else {
                this.triggerAuthEvent('unauthorized', { 
                    address, 
                    reason: 'Wallet not recognized as Soulfra community member' 
                });
                
                return {
                    success: false,
                    error: 'Access restricted to Soulfra community wallets',
                    address
                };
            }

        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.triggerAuthEvent('error', { error: error.message });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    async loadUserProfile() {
        try {
            if (!this.walletAddress) return;

            // Try to load profile from Arweave
            const profileData = await this.loadFromArweave('profile');
            
            if (profileData) {
                this.userProfile = {
                    ...profileData,
                    walletAddress: this.walletAddress,
                    lastAccess: Date.now()
                };
            } else {
                // Create new profile
                this.userProfile = {
                    walletAddress: this.walletAddress,
                    createdAt: Date.now(),
                    lastAccess: Date.now(),
                    preferences: {},
                    history: [],
                    tier: 'standard' // Can be 'standard', 'premium', 'founder'
                };
                
                // Save new profile
                await this.saveUserProfile();
            }

            // Load from localStorage as backup
            const localProfile = this.loadFromLocalStorage('profile');
            if (localProfile && !profileData) {
                this.userProfile = { ...this.userProfile, ...localProfile };
            }

        } catch (error) {
            console.error('Failed to load user profile:', error);
            
            // Fallback to basic profile
            this.userProfile = {
                walletAddress: this.walletAddress,
                createdAt: Date.now(),
                lastAccess: Date.now(),
                preferences: {},
                history: [],
                tier: 'standard'
            };
        }
    }

    async saveUserProfile() {
        if (!this.userProfile || !this.isAuthenticated) return;

        try {
            this.userProfile.lastAccess = Date.now();

            // Save to Arweave (permanent storage)
            await this.saveToArweave('profile', this.userProfile);
            
            // Save to localStorage (quick access)
            this.saveToLocalStorage('profile', this.userProfile);

            console.log('💾 User profile saved');
        } catch (error) {
            console.error('Failed to save user profile:', error);
        }
    }

    async saveToArweave(key, data) {
        try {
            if (!this.arweave || !window.arweaveWallet) {
                throw new Error('Arweave not available');
            }

            const dataString = JSON.stringify(data);
            const dataBuffer = new TextEncoder().encode(dataString);

            const transaction = await this.arweave.createTransaction({
                data: dataBuffer
            });

            // Add tags for easy retrieval
            transaction.addTag('App-Name', 'Soulfra-Document-Generator');
            transaction.addTag('Data-Type', key);
            transaction.addTag('Wallet-Address', this.walletAddress);
            transaction.addTag('Timestamp', Date.now().toString());

            // Sign and post transaction
            await this.arweave.transactions.sign(transaction);
            const response = await this.arweave.transactions.post(transaction);

            if (response.status === 200) {
                console.log(`📡 Data saved to Arweave: ${transaction.id}`);
                return transaction.id;
            } else {
                throw new Error(`Arweave transaction failed: ${response.status}`);
            }

        } catch (error) {
            console.error('Arweave save failed:', error);
            throw error;
        }
    }

    async loadFromArweave(key) {
        try {
            if (!this.arweave) return null;

            // Query for user's data
            const query = {
                op: 'and',
                expr1: {
                    op: 'equals',
                    expr1: 'App-Name',
                    expr2: 'Soulfra-Document-Generator'
                },
                expr2: {
                    op: 'and',
                    expr1: {
                        op: 'equals',
                        expr1: 'Data-Type',
                        expr2: key
                    },
                    expr2: {
                        op: 'equals',
                        expr1: 'Wallet-Address',
                        expr2: this.walletAddress
                    }
                }
            };

            const results = await this.arweave.arql(query);
            
            if (results.length === 0) return null;

            // Get the most recent transaction
            const latestTxId = results[0]; // Results are ordered by timestamp
            const transaction = await this.arweave.transactions.get(latestTxId);
            const data = transaction.get('data', { decode: true, string: true });

            return JSON.parse(data);

        } catch (error) {
            console.error('Failed to load from Arweave:', error);
            return null;
        }
    }

    saveToLocalStorage(key, data) {
        try {
            const fullKey = `${this.config.storagePrefix}${this.walletAddress}_${key}`;
            localStorage.setItem(fullKey, JSON.stringify(data));
        } catch (error) {
            console.error('LocalStorage save failed:', error);
        }
    }

    loadFromLocalStorage(key) {
        try {
            const fullKey = `${this.config.storagePrefix}${this.walletAddress}_${key}`;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('LocalStorage load failed:', error);
            return null;
        }
    }

    async saveConnectionData() {
        const connectionData = {
            address: this.walletAddress,
            connectedAt: Date.now(),
            permissions: this.permissions,
            verified: this.isAuthenticated
        };

        this.saveToLocalStorage('connection', connectionData);
    }

    async disconnect() {
        try {
            if (window.arweaveWallet) {
                await window.arweaveWallet.disconnect();
            }

            // Clear state
            this.isConnected = false;
            this.isAuthenticated = false;
            this.walletAddress = null;
            this.userProfile = null;
            this.permissions = [];

            // Clear localStorage
            if (this.walletAddress) {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(`${this.config.storagePrefix}${this.walletAddress}`))
                    .forEach(key => localStorage.removeItem(key));
            }

            this.triggerAuthEvent('disconnected');
            console.log('🔒 Wallet disconnected');

        } catch (error) {
            console.error('Disconnect failed:', error);
        }
    }

    async verifyConnection() {
        try {
            if (!this.isConnected) return false;

            const currentAddress = await window.arweaveWallet.getActiveAddress();
            
            if (currentAddress !== this.walletAddress) {
                console.log('🔄 Wallet address changed');
                await this.handleWalletChange(currentAddress);
            }

            return this.isAuthenticated;
        } catch (error) {
            console.error('Connection verification failed:', error);
            return false;
        }
    }

    async handleWalletChange(newAddress) {
        if (newAddress !== this.walletAddress) {
            // Save current profile if authenticated
            if (this.isAuthenticated && this.userProfile) {
                await this.saveUserProfile();
            }

            // Switch to new wallet
            this.walletAddress = newAddress;
            this.isAuthenticated = this.verifySoulfraWallet(newAddress);

            if (this.isAuthenticated) {
                await this.loadUserProfile();
                this.triggerAuthEvent('wallet-changed', { 
                    address: newAddress, 
                    profile: this.userProfile 
                });
            } else {
                this.userProfile = null;
                this.triggerAuthEvent('unauthorized', { 
                    address: newAddress, 
                    reason: 'New wallet not recognized as Soulfra' 
                });
            }
        }
    }

    // Event system for authentication state changes
    triggerAuthEvent(eventType, data = {}) {
        const event = new CustomEvent('arweave-auth', {
            detail: {
                type: eventType,
                timestamp: Date.now(),
                address: this.walletAddress,
                authenticated: this.isAuthenticated,
                ...data
            }
        });

        window.dispatchEvent(event);
        console.log(`🎯 Auth event: ${eventType}`, data);
    }

    // Utility methods for external use
    getAuthStatus() {
        return {
            isConnected: this.isConnected,
            isAuthenticated: this.isAuthenticated,
            walletAddress: this.walletAddress,
            profile: this.userProfile,
            permissions: this.permissions
        };
    }

    async updateUserPreference(key, value) {
        if (!this.isAuthenticated || !this.userProfile) return false;

        this.userProfile.preferences[key] = value;
        await this.saveUserProfile();
        return true;
    }

    async addToHistory(action, data = {}) {
        if (!this.isAuthenticated || !this.userProfile) return false;

        this.userProfile.history.push({
            action,
            data,
            timestamp: Date.now()
        });

        // Keep only last 100 history items
        if (this.userProfile.history.length > 100) {
            this.userProfile.history = this.userProfile.history.slice(-100);
        }

        await this.saveUserProfile();
        return true;
    }

    // Premium feature access control
    hasPremiumAccess() {
        return this.isAuthenticated && 
               this.userProfile && 
               ['premium', 'founder'].includes(this.userProfile.tier);
    }

    hasFounderAccess() {
        return this.isAuthenticated && 
               this.userProfile && 
               this.userProfile.tier === 'founder';
    }
}

// Auto-initialize wallet auth
document.addEventListener('DOMContentLoaded', () => {
    window.arweaveAuth = new ArweaveWalletAuth({
        allowDemoMode: true,
        requiredWallets: [] // Add specific wallet addresses here
    });

    // Listen for auth events
    window.addEventListener('arweave-auth', (event) => {
        const { type, address, authenticated } = event.detail;
        
        // Notify Cal character about auth changes
        if (window.calCharacter && typeof window.calCharacter.handleAuthChange === 'function') {
            window.calCharacter.handleAuthChange(type, { address, authenticated });
        }

        // Update UI based on auth state
        document.body.classList.toggle('wallet-authenticated', authenticated);
        document.body.classList.toggle('wallet-connected', event.detail.isConnected);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArweaveWalletAuth;
}