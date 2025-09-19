/**
 * Arweave-Vercel Integration Bridge
 * 
 * Connects Arweave blockchain storage with Vercel deployment,
 * enabling persistent user data and cross-platform synchronization.
 */

class ArweaveVercelBridge {
    constructor(config = {}) {
        this.config = {
            arweaveConfig: {
                host: 'arweave.net',
                port: 443,
                protocol: 'https'
            },
            vercelAPI: {
                baseURL: config.vercelAPI?.baseURL || 'https://api.vercel.com/v1',
                token: config.vercelAPI?.token || process.env.VERCEL_TOKEN
            },
            cacheSettings: {
                defaultTTL: 3600, // 1 hour
                maxAge: 86400,    // 24 hours
                staleWhileRevalidate: 3600
            },
            syncInterval: 300000, // 5 minutes
            ...config
        };

        // Bridge state
        this.isConnected = false;
        this.syncInProgress = false;
        this.lastSync = null;
        this.arweave = null;
        this.cache = new Map();
        this.syncQueue = [];

        this.init();
    }

    async init() {
        console.log('🌉 Arweave-Vercel Bridge initializing...');

        try {
            // Initialize Arweave client
            if (typeof Arweave !== 'undefined') {
                this.arweave = Arweave.init(this.config.arweaveConfig);
                console.log('✅ Arweave client initialized');
            }

            // Start sync process
            this.startSyncProcess();
            
            // Set up event listeners
            this.setupEventListeners();

            this.isConnected = true;
            console.log('✅ Arweave-Vercel Bridge ready');

        } catch (error) {
            console.error('❌ Bridge initialization failed:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Listen for wallet authentication events
        window.addEventListener('arweave-auth', (event) => {
            this.handleAuthEvent(event.detail);
        });

        // Listen for data sync requests
        window.addEventListener('arweave-sync', (event) => {
            this.handleSyncRequest(event.detail);
        });

        // Page visibility change - sync when user returns
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isConnected) {
                this.queueSync('visibility_change');
            }
        });
    }

    async handleAuthEvent(authDetail) {
        const { type, address, profile } = authDetail;

        switch (type) {
            case 'authenticated':
                // Sync user data from Arweave to Vercel cache
                await this.syncUserData(address, 'arweave_to_vercel');
                break;
                
            case 'profile_updated':
                // Update both Arweave and Vercel
                await this.syncUserData(address, 'bidirectional');
                break;
        }
    }

    async handleSyncRequest(syncDetail) {
        const { type, data, address } = syncDetail;
        
        switch (type) {
            case 'store_user_data':
                await this.storeUserData(address, data);
                break;
                
            case 'retrieve_user_data':
                return await this.retrieveUserData(address);
                
            case 'sync_preferences':
                await this.syncUserPreferences(address, data);
                break;
        }
    }

    async storeUserData(walletAddress, userData) {
        try {
            console.log('💾 Storing user data...');

            // Store to Arweave (permanent)
            const arweaveId = await this.storeToArweave(walletAddress, userData);
            
            // Store to Vercel (fast access)
            await this.storeToVercel(walletAddress, userData, arweaveId);
            
            // Update local cache
            this.updateCache(walletAddress, userData);

            return {
                success: true,
                arweaveId,
                cached: true,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('Failed to store user data:', error);
            throw error;
        }
    }

    async storeToArweave(walletAddress, userData) {
        if (!this.arweave || !window.arweaveWallet) {
            throw new Error('Arweave not available');
        }

        const data = JSON.stringify({
            ...userData,
            walletAddress,
            version: '1.0',
            timestamp: Date.now(),
            bridge: 'arweave-vercel'
        });

        const transaction = await this.arweave.createTransaction({
            data: new TextEncoder().encode(data)
        });

        // Add comprehensive tags for querying
        transaction.addTag('App-Name', 'Soulfra-Document-Generator');
        transaction.addTag('App-Version', '1.0');
        transaction.addTag('Data-Type', 'user-profile');
        transaction.addTag('Wallet-Address', walletAddress);
        transaction.addTag('Timestamp', Date.now().toString());
        transaction.addTag('Bridge-Version', 'arweave-vercel-1.0');

        // Sign and post transaction
        await this.arweave.transactions.sign(transaction);
        const response = await this.arweave.transactions.post(transaction);

        if (response.status !== 200) {
            throw new Error(`Arweave transaction failed: ${response.status}`);
        }

        console.log(`📡 Data stored to Arweave: ${transaction.id}`);
        return transaction.id;
    }

    async storeToVercel(walletAddress, userData, arweaveId) {
        try {
            if (!this.config.vercelAPI.token) {
                console.warn('No Vercel API token - skipping Vercel storage');
                return null;
            }

            const vercelData = {
                address: walletAddress,
                data: userData,
                arweaveId,
                timestamp: Date.now(),
                ttl: Date.now() + (this.config.cacheSettings.defaultTTL * 1000)
            };

            // Store via Vercel Edge Config or similar
            const response = await fetch(`${this.config.vercelAPI.baseURL}/edge-config/soulfra-users/${walletAddress}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.config.vercelAPI.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vercelData)
            });

            if (response.ok) {
                console.log('☁️ Data cached to Vercel');
                return await response.json();
            } else {
                console.warn('Vercel storage failed:', response.status);
            }

        } catch (error) {
            console.warn('Vercel storage error:', error);
            // Don't fail the entire operation if Vercel is unavailable
        }
    }

    async retrieveUserData(walletAddress) {
        try {
            // First try cache
            const cached = this.getCachedData(walletAddress);
            if (cached && !this.isCacheExpired(cached)) {
                console.log('📋 Retrieved from cache');
                return cached.data;
            }

            // Try Vercel for fast access
            const vercelData = await this.retrieveFromVercel(walletAddress);
            if (vercelData && !this.isCacheExpired(vercelData)) {
                this.updateCache(walletAddress, vercelData.data);
                console.log('☁️ Retrieved from Vercel');
                return vercelData.data;
            }

            // Fall back to Arweave
            const arweaveData = await this.retrieveFromArweave(walletAddress);
            if (arweaveData) {
                // Update caches
                this.updateCache(walletAddress, arweaveData);
                await this.storeToVercel(walletAddress, arweaveData, null);
                console.log('📡 Retrieved from Arweave');
                return arweaveData;
            }

            return null;

        } catch (error) {
            console.error('Failed to retrieve user data:', error);
            throw error;
        }
    }

    async retrieveFromVercel(walletAddress) {
        try {
            if (!this.config.vercelAPI.token) return null;

            const response = await fetch(`${this.config.vercelAPI.baseURL}/edge-config/soulfra-users/${walletAddress}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.vercelAPI.token}`
                }
            });

            if (response.ok) {
                return await response.json();
            }

        } catch (error) {
            console.warn('Vercel retrieval error:', error);
        }

        return null;
    }

    async retrieveFromArweave(walletAddress) {
        try {
            if (!this.arweave) return null;

            // Query for user's most recent data
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
                        expr2: 'user-profile'
                    },
                    expr2: {
                        op: 'equals',
                        expr1: 'Wallet-Address',
                        expr2: walletAddress
                    }
                }
            };

            const results = await this.arweave.arql(query);
            
            if (results.length === 0) return null;

            // Get the most recent transaction
            const latestTxId = results[0];
            const transaction = await this.arweave.transactions.get(latestTxId);
            const data = transaction.get('data', { decode: true, string: true });

            const parsedData = JSON.parse(data);
            return parsedData;

        } catch (error) {
            console.error('Arweave retrieval error:', error);
            return null;
        }
    }

    updateCache(walletAddress, data) {
        this.cache.set(walletAddress, {
            data,
            timestamp: Date.now(),
            ttl: Date.now() + (this.config.cacheSettings.defaultTTL * 1000)
        });
    }

    getCachedData(walletAddress) {
        return this.cache.get(walletAddress);
    }

    isCacheExpired(cachedItem) {
        return Date.now() > cachedItem.ttl;
    }

    startSyncProcess() {
        // Periodic sync process
        setInterval(() => {
            this.processSyncQueue();
        }, this.config.syncInterval);

        console.log('🔄 Sync process started');
    }

    queueSync(type, data = {}) {
        this.syncQueue.push({
            type,
            data,
            timestamp: Date.now(),
            retries: 0
        });
    }

    async processSyncQueue() {
        if (this.syncInProgress || this.syncQueue.length === 0) return;

        this.syncInProgress = true;
        console.log(`🔄 Processing ${this.syncQueue.length} sync items`);

        const batch = this.syncQueue.splice(0, 10); // Process 10 items at a time

        for (const item of batch) {
            try {
                await this.processSyncItem(item);
            } catch (error) {
                console.error('Sync item failed:', error);
                
                // Retry logic
                if (item.retries < 3) {
                    item.retries++;
                    this.syncQueue.push(item);
                }
            }
        }

        this.syncInProgress = false;
        this.lastSync = Date.now();
    }

    async processSyncItem(item) {
        switch (item.type) {
            case 'user_preference_update':
                await this.syncUserPreferences(item.data.address, item.data.preferences);
                break;
                
            case 'activity_log':
                await this.syncActivityLog(item.data.address, item.data.activity);
                break;
                
            case 'cross_platform_sync':
                await this.syncAcrossPlatforms(item.data.address, item.data.changes);
                break;
        }
    }

    async syncUserPreferences(walletAddress, preferences) {
        const userData = await this.retrieveUserData(walletAddress);
        
        if (userData) {
            userData.preferences = { ...userData.preferences, ...preferences };
            userData.lastUpdated = Date.now();
            
            await this.storeUserData(walletAddress, userData);
        }
    }

    async syncActivityLog(walletAddress, activity) {
        const userData = await this.retrieveUserData(walletAddress);
        
        if (userData) {
            userData.activityLog = userData.activityLog || [];
            userData.activityLog.push({
                ...activity,
                timestamp: Date.now(),
                synced: true
            });
            
            // Keep only last 1000 activities
            if (userData.activityLog.length > 1000) {
                userData.activityLog = userData.activityLog.slice(-1000);
            }
            
            await this.storeUserData(walletAddress, userData);
        }
    }

    // Cross-platform synchronization
    async syncAcrossPlatforms(walletAddress, changes) {
        try {
            // Sync across different Soulfra platforms
            const platforms = [
                'document-generator-mvp.vercel.app',
                'soulfra.ai',
                'deathtodata.com'
            ];

            for (const platform of platforms) {
                await this.notifyPlatformOfChanges(platform, walletAddress, changes);
            }

        } catch (error) {
            console.error('Cross-platform sync failed:', error);
        }
    }

    async notifyPlatformOfChanges(platform, walletAddress, changes) {
        try {
            const response = await fetch(`https://${platform}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Arweave-Bridge': 'true'
                },
                body: JSON.stringify({
                    walletAddress,
                    changes,
                    timestamp: Date.now(),
                    source: 'arweave-vercel-bridge'
                })
            });

            if (response.ok) {
                console.log(`✅ Synced to ${platform}`);
            }

        } catch (error) {
            console.warn(`Sync to ${platform} failed:`, error);
        }
    }

    // Public API methods
    async getUserProfile(walletAddress) {
        return await this.retrieveUserData(walletAddress);
    }

    async updateUserProfile(walletAddress, profileData) {
        const result = await this.storeUserData(walletAddress, profileData);
        
        // Queue cross-platform sync
        this.queueSync('cross_platform_sync', {
            address: walletAddress,
            changes: { profile: profileData }
        });

        return result;
    }

    async logActivity(walletAddress, activity) {
        this.queueSync('activity_log', {
            address: walletAddress,
            activity
        });
    }

    async updatePreference(walletAddress, key, value) {
        this.queueSync('user_preference_update', {
            address: walletAddress,
            preferences: { [key]: value }
        });
    }

    // Health check
    async healthCheck() {
        const health = {
            arweave: false,
            vercel: false,
            cache: this.cache.size > 0,
            lastSync: this.lastSync,
            queueSize: this.syncQueue.length
        };

        try {
            // Check Arweave connectivity
            if (this.arweave) {
                const info = await this.arweave.network.getInfo();
                health.arweave = !!info.network;
            }

            // Check Vercel API
            if (this.config.vercelAPI.token) {
                const response = await fetch(`${this.config.vercelAPI.baseURL}/user`, {
                    headers: {
                        'Authorization': `Bearer ${this.config.vercelAPI.token}`
                    }
                });
                health.vercel = response.ok;
            }

        } catch (error) {
            console.warn('Health check error:', error);
        }

        return health;
    }

    // Cleanup
    destroy() {
        this.cache.clear();
        this.syncQueue.length = 0;
        this.isConnected = false;
        console.log('🧹 Arweave-Vercel Bridge cleaned up');
    }
}

// Auto-initialize bridge
document.addEventListener('DOMContentLoaded', () => {
    window.arweaveVercelBridge = new ArweaveVercelBridge({
        syncInterval: 300000, // 5 minutes
        cacheSettings: {
            defaultTTL: 3600, // 1 hour
            maxAge: 86400     // 24 hours
        }
    });

    // Make it available to Cal character and wallet auth
    window.addEventListener('arweave-auth', (event) => {
        if (event.detail.type === 'authenticated') {
            window.arweaveVercelBridge.queueSync('user_login', {
                address: event.detail.address,
                timestamp: Date.now()
            });
        }
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArweaveVercelBridge;
}