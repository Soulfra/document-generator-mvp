#!/usr/bin/env node

/**
 * Perplexity MCP Connector
 * 
 * Integrates with Perplexity's Model Context Protocol to create a
 * bi-directional context sharing system. This allows our Matrix to
 * tap into Perplexity's knowledge while contributing our own context
 * back to the ecosystem.
 * 
 * Features:
 * - Connect to Perplexity's MCP servers
 * - Share context between platforms
 * - Encrypted memory snapshots
 * - API credit arbitrage
 * - Context resurrection
 * - Memory trading marketplace
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const WebSocket = require('ws');

class PerplexityMCPConnector extends EventEmitter {
    constructor(matrixEngine) {
        super();
        
        this.matrix = matrixEngine;
        this.name = 'Perplexity MCP Bridge';
        this.version = '1.0.0';
        
        // Connection configuration
        this.config = {
            perplexityEndpoint: process.env.PERPLEXITY_MCP_ENDPOINT || 'wss://api.perplexity.ai/mcp/v1',
            apiKey: process.env.PERPLEXITY_API_KEY,
            maxContextSize: 128000, // tokens
            syncInterval: 60000, // 1 minute
            encryptionEnabled: true,
            compressionEnabled: true
        };
        
        // Connection state
        this.connection = {
            socket: null,
            status: 'disconnected',
            lastSync: null,
            reconnectAttempts: 0,
            maxReconnects: 5
        };
        
        // Context management
        this.context = {
            local: new Map(), // Our context
            remote: new Map(), // Perplexity's context
            shared: new Map(), // Bi-directional shared context
            memory: new Map() // Encrypted memories
        };
        
        // Credit arbitrage system
        this.arbitrage = {
            rates: new Map(),
            opportunities: [],
            autoTrade: false,
            profitThreshold: 0.1 // 10% minimum profit
        };
        
        // Memory marketplace
        this.marketplace = {
            listings: new Map(),
            trades: [],
            reputation: new Map()
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   PERPLEXITY MCP CONNECTOR                     ║
║                                                               ║
║         "Bridging minds across the digital divide"            ║
╚═══════════════════════════════════════════════════════════════╝
        `);
        
        // Connect to Perplexity MCP
        await this.connect();
        
        // Start sync processes
        this.startSyncProcesses();
        
        // Initialize arbitrage system
        this.initializeArbitrage();
        
        // Setup marketplace
        this.setupMarketplace();
        
        this.emit('connector-initialized');
    }
    
    /**
     * Connect to Perplexity's MCP server
     */
    async connect() {
        try {
            console.log('🔌 Connecting to Perplexity MCP...');
            
            this.connection.socket = new WebSocket(this.config.perplexityEndpoint, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'X-MCP-Version': '1.0',
                    'X-Client-ID': this.generateClientId()
                }
            });
            
            this.setupSocketHandlers();
            
            // Wait for connection
            await new Promise((resolve, reject) => {
                this.connection.socket.once('open', resolve);
                this.connection.socket.once('error', reject);
                
                setTimeout(() => reject(new Error('Connection timeout')), 30000);
            });
            
            this.connection.status = 'connected';
            console.log('✅ Connected to Perplexity MCP');
            
            // Perform initial handshake
            await this.performHandshake();
            
        } catch (error) {
            console.error('❌ Failed to connect:', error);
            this.scheduleReconnect();
        }
    }
    
    /**
     * Setup WebSocket event handlers
     */
    setupSocketHandlers() {
        const socket = this.connection.socket;
        
        socket.on('open', () => {
            this.connection.status = 'connected';
            this.connection.reconnectAttempts = 0;
            this.emit('connected');
        });
        
        socket.on('message', (data) => {
            this.handleMessage(JSON.parse(data));
        });
        
        socket.on('close', (code, reason) => {
            console.log(`📡 Disconnected: ${code} - ${reason}`);
            this.connection.status = 'disconnected';
            this.emit('disconnected', { code, reason });
            this.scheduleReconnect();
        });
        
        socket.on('error', (error) => {
            console.error('🔌 Socket error:', error);
            this.emit('error', error);
        });
        
        socket.on('ping', () => {
            socket.pong();
        });
    }
    
    /**
     * Handle incoming MCP messages
     */
    async handleMessage(message) {
        const { type, payload, id } = message;
        
        switch (type) {
            case 'context-update':
                await this.handleContextUpdate(payload);
                break;
                
            case 'memory-request':
                await this.handleMemoryRequest(payload);
                break;
                
            case 'rate-update':
                await this.handleRateUpdate(payload);
                break;
                
            case 'marketplace-event':
                await this.handleMarketplaceEvent(payload);
                break;
                
            case 'sync-request':
                await this.handleSyncRequest(payload);
                break;
                
            case 'capability-query':
                await this.handleCapabilityQuery(payload);
                break;
                
            default:
                console.warn('Unknown message type:', type);
        }
        
        // Send acknowledgment if requested
        if (message.ack) {
            this.send('ack', { messageId: id });
        }
    }
    
    /**
     * Perform initial handshake with Perplexity
     */
    async performHandshake() {
        const handshake = {
            client: 'matrix-generation-engine',
            version: this.matrix.version,
            capabilities: [
                'context-sharing',
                'memory-trading',
                'credit-arbitrage',
                'encrypted-storage',
                'pattern-recognition',
                'cross-platform-generation'
            ],
            contextSize: this.config.maxContextSize,
            encryption: this.config.encryptionEnabled
        };
        
        const response = await this.sendAndWait('handshake', handshake);
        
        if (response.accepted) {
            console.log('🤝 Handshake successful');
            this.connection.perplexityCapabilities = response.capabilities;
            this.connection.sessionId = response.sessionId;
        } else {
            throw new Error('Handshake rejected: ' + response.reason);
        }
    }
    
    /**
     * Share context with Perplexity
     */
    async shareContext(contextData, options = {}) {
        try {
            // Prepare context for sharing
            const context = {
                id: `ctx-${crypto.randomBytes(8).toString('hex')}`,
                timestamp: new Date(),
                source: 'matrix',
                data: contextData,
                metadata: {
                    user: options.userId,
                    industry: options.industry,
                    quality: options.quality,
                    tags: options.tags || []
                }
            };
            
            // Encrypt if enabled
            if (this.config.encryptionEnabled && options.encrypt !== false) {
                context.data = await this.encryptContext(context.data);
                context.encrypted = true;
            }
            
            // Compress if large
            if (JSON.stringify(context).length > 10000 && this.config.compressionEnabled) {
                context.data = await this.compressContext(context.data);
                context.compressed = true;
            }
            
            // Share with Perplexity
            const response = await this.sendAndWait('share-context', context);
            
            if (response.success) {
                // Store in shared context
                this.context.shared.set(context.id, context);
                
                // Track for potential arbitrage
                if (response.credits) {
                    this.trackCredits('earned', response.credits, 'context-sharing');
                }
                
                this.emit('context-shared', {
                    contextId: context.id,
                    credits: response.credits
                });
                
                return {
                    success: true,
                    contextId: context.id,
                    credits: response.credits
                };
            }
            
            return { success: false, error: response.error };
            
        } catch (error) {
            console.error('Failed to share context:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Retrieve context from Perplexity
     */
    async retrieveContext(query, options = {}) {
        try {
            const request = {
                query,
                filters: options.filters || {},
                maxResults: options.maxResults || 10,
                includeMetadata: options.includeMetadata !== false,
                decrypt: this.config.encryptionEnabled
            };
            
            const response = await this.sendAndWait('retrieve-context', request);
            
            if (response.success) {
                const contexts = response.contexts;
                
                // Decrypt if needed
                for (const ctx of contexts) {
                    if (ctx.encrypted && options.decrypt !== false) {
                        ctx.data = await this.decryptContext(ctx.data);
                    }
                    
                    // Decompress if needed
                    if (ctx.compressed) {
                        ctx.data = await this.decompressContext(ctx.data);
                    }
                    
                    // Store in remote context
                    this.context.remote.set(ctx.id, ctx);
                }
                
                // Track credits used
                if (response.creditsUsed) {
                    this.trackCredits('spent', response.creditsUsed, 'context-retrieval');
                }
                
                return {
                    success: true,
                    contexts,
                    creditsUsed: response.creditsUsed
                };
            }
            
            return { success: false, error: response.error };
            
        } catch (error) {
            console.error('Failed to retrieve context:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Create encrypted memory snapshot
     */
    async createMemorySnapshot(userId, memoryData) {
        try {
            const snapshot = {
                id: `snap-${crypto.randomBytes(8).toString('hex')}`,
                userId,
                timestamp: new Date(),
                data: memoryData,
                checksum: this.calculateChecksum(memoryData),
                version: this.matrix.version
            };
            
            // Encrypt the snapshot
            const encrypted = await this.encryptMemory(snapshot);
            
            // Store locally
            this.context.memory.set(snapshot.id, encrypted);
            
            // Optionally share with Perplexity for backup
            if (this.config.perplexityBackup) {
                await this.send('memory-backup', {
                    snapshotId: snapshot.id,
                    encrypted,
                    metadata: {
                        userId,
                        size: encrypted.length,
                        timestamp: snapshot.timestamp
                    }
                });
            }
            
            this.emit('memory-snapshot-created', {
                snapshotId: snapshot.id,
                size: encrypted.length
            });
            
            return {
                success: true,
                snapshotId: snapshot.id,
                checksum: snapshot.checksum
            };
            
        } catch (error) {
            console.error('Failed to create memory snapshot:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Resurrect context from memory
     */
    async resurrectContext(snapshotId, targetPlatform) {
        try {
            // Retrieve snapshot
            const encrypted = this.context.memory.get(snapshotId);
            if (!encrypted) {
                // Try to retrieve from Perplexity backup
                const backup = await this.retrieveBackup(snapshotId);
                if (!backup.success) {
                    throw new Error('Snapshot not found');
                }
                encrypted = backup.data;
            }
            
            // Decrypt snapshot
            const snapshot = await this.decryptMemory(encrypted);
            
            // Verify checksum
            if (!this.verifyChecksum(snapshot.data, snapshot.checksum)) {
                throw new Error('Memory corruption detected');
            }
            
            // Transform for target platform
            const transformed = await this.transformForPlatform(
                snapshot.data,
                targetPlatform
            );
            
            this.emit('context-resurrected', {
                snapshotId,
                targetPlatform,
                success: true
            });
            
            return {
                success: true,
                context: transformed,
                metadata: {
                    originalTime: snapshot.timestamp,
                    resurrectedAt: new Date(),
                    platform: targetPlatform
                }
            };
            
        } catch (error) {
            console.error('Failed to resurrect context:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Credit arbitrage system
     */
    async checkArbitrageOpportunities() {
        try {
            // Get current rates from various platforms
            const rates = await this.fetchCurrentRates();
            
            // Find profitable arbitrage opportunities
            const opportunities = [];
            
            for (const [fromPlatform, fromRates] of rates) {
                for (const [toPlatform, toRates] of rates) {
                    if (fromPlatform === toPlatform) continue;
                    
                    const profit = this.calculateArbitrage(fromRates, toRates);
                    
                    if (profit > this.arbitrage.profitThreshold) {
                        opportunities.push({
                            from: fromPlatform,
                            to: toPlatform,
                            profit,
                            amount: this.calculateOptimalAmount(fromRates, toRates),
                            risk: this.assessRisk(fromPlatform, toPlatform)
                        });
                    }
                }
            }
            
            // Sort by profit potential
            opportunities.sort((a, b) => b.profit - a.profit);
            
            this.arbitrage.opportunities = opportunities;
            
            // Execute if auto-trade is enabled
            if (this.arbitrage.autoTrade && opportunities.length > 0) {
                await this.executeArbitrage(opportunities[0]);
            }
            
            this.emit('arbitrage-opportunities', opportunities);
            
            return opportunities;
            
        } catch (error) {
            console.error('Arbitrage check failed:', error);
            return [];
        }
    }
    
    /**
     * Memory marketplace operations
     */
    async listMemoryForSale(snapshotId, price, description) {
        try {
            const snapshot = this.context.memory.get(snapshotId);
            if (!snapshot) {
                throw new Error('Snapshot not found');
            }
            
            const listing = {
                id: `list-${crypto.randomBytes(8).toString('hex')}`,
                snapshotId,
                seller: this.matrix.userId,
                price,
                description,
                metadata: {
                    size: snapshot.length,
                    created: new Date(),
                    tags: this.extractMemoryTags(snapshot)
                },
                active: true
            };
            
            // Add to marketplace
            this.marketplace.listings.set(listing.id, listing);
            
            // Broadcast to Perplexity network
            await this.send('marketplace-listing', listing);
            
            this.emit('memory-listed', listing);
            
            return {
                success: true,
                listingId: listing.id
            };
            
        } catch (error) {
            console.error('Failed to list memory:', error);
            return { success: false, error: error.message };
        }
    }
    
    async purchaseMemory(listingId) {
        try {
            const listing = this.marketplace.listings.get(listingId);
            if (!listing || !listing.active) {
                throw new Error('Listing not found or inactive');
            }
            
            // Check if we have enough credits
            const balance = await this.getcreditBalance();
            if (balance < listing.price) {
                throw new Error('Insufficient credits');
            }
            
            // Execute purchase
            const transaction = {
                id: `tx-${crypto.randomBytes(8).toString('hex')}`,
                buyer: this.matrix.userId,
                seller: listing.seller,
                listingId,
                price: listing.price,
                timestamp: new Date()
            };
            
            // Process payment through Perplexity
            const payment = await this.sendAndWait('process-payment', transaction);
            
            if (payment.success) {
                // Receive encrypted memory
                const memory = await this.receiveMemory(listing.snapshotId);
                
                // Store in our memory bank
                this.context.memory.set(listing.snapshotId, memory);
                
                // Mark listing as sold
                listing.active = false;
                listing.soldTo = this.matrix.userId;
                listing.soldAt = new Date();
                
                // Update reputation
                await this.updateReputation(listing.seller, 'positive');
                
                this.emit('memory-purchased', {
                    listingId,
                    snapshotId: listing.snapshotId,
                    price: listing.price
                });
                
                return {
                    success: true,
                    snapshotId: listing.snapshotId,
                    transactionId: transaction.id
                };
            }
            
            return { success: false, error: payment.error };
            
        } catch (error) {
            console.error('Failed to purchase memory:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * SuperMemory operations
     */
    async createSuperMemory(userId) {
        try {
            // Gather all user context
            const userContext = await this.gatherUserContext(userId);
            
            // Create comprehensive memory structure
            const superMemory = {
                id: `super-${crypto.randomBytes(8).toString('hex')}`,
                userId,
                created: new Date(),
                version: 1,
                components: {
                    interactions: userContext.interactions,
                    generations: userContext.generations,
                    preferences: userContext.preferences,
                    skills: userContext.skills,
                    connections: userContext.connections,
                    achievements: userContext.achievements,
                    customPatterns: await this.extractPatterns(userContext)
                },
                indexes: {
                    temporal: this.createTemporalIndex(userContext),
                    semantic: await this.createSemanticIndex(userContext),
                    relational: this.createRelationalIndex(userContext)
                }
            };
            
            // Encrypt and compress
            const encrypted = await this.encryptSuperMemory(superMemory);
            
            // Store with redundancy
            await this.storeSuperMemory(userId, encrypted);
            
            // Create access token
            const accessToken = this.generateAccessToken(superMemory.id);
            
            this.emit('super-memory-created', {
                userId,
                memoryId: superMemory.id,
                size: encrypted.length
            });
            
            return {
                success: true,
                memoryId: superMemory.id,
                accessToken,
                stats: {
                    interactions: userContext.interactions.length,
                    generations: userContext.generations.length,
                    totalSize: encrypted.length
                }
            };
            
        } catch (error) {
            console.error('Failed to create SuperMemory:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Sync processes
     */
    startSyncProcesses() {
        // Regular context sync
        setInterval(() => {
            this.syncContexts();
        }, this.config.syncInterval);
        
        // Arbitrage opportunity check
        setInterval(() => {
            this.checkArbitrageOpportunities();
        }, 30000); // Every 30 seconds
        
        // Memory marketplace update
        setInterval(() => {
            this.updateMarketplace();
        }, 60000); // Every minute
        
        // Health check
        setInterval(() => {
            this.performHealthCheck();
        }, 300000); // Every 5 minutes
    }
    
    async syncContexts() {
        if (this.connection.status !== 'connected') return;
        
        try {
            // Gather local changes since last sync
            const changes = this.gatherLocalChanges();
            
            if (changes.length > 0) {
                // Send changes to Perplexity
                const response = await this.sendAndWait('sync-contexts', {
                    changes,
                    lastSync: this.connection.lastSync,
                    checksum: this.calculateSyncChecksum(changes)
                });
                
                if (response.success) {
                    // Apply remote changes
                    await this.applyRemoteChanges(response.remoteChanges);
                    
                    this.connection.lastSync = new Date();
                    
                    this.emit('sync-completed', {
                        sent: changes.length,
                        received: response.remoteChanges.length
                    });
                }
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
    
    /**
     * Helper methods
     */
    generateClientId() {
        return `matrix-${this.matrix.version}-${crypto.randomBytes(8).toString('hex')}`;
    }
    
    async send(type, payload) {
        if (this.connection.status !== 'connected') {
            throw new Error('Not connected to Perplexity MCP');
        }
        
        const message = {
            id: crypto.randomBytes(16).toString('hex'),
            type,
            payload,
            timestamp: new Date()
        };
        
        this.connection.socket.send(JSON.stringify(message));
    }
    
    async sendAndWait(type, payload, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const messageId = crypto.randomBytes(16).toString('hex');
            
            const timer = setTimeout(() => {
                this.removeListener(messageId, handler);
                reject(new Error('Request timeout'));
            }, timeout);
            
            const handler = (response) => {
                clearTimeout(timer);
                resolve(response);
            };
            
            this.once(messageId, handler);
            
            this.send(type, { ...payload, responseId: messageId });
        });
    }
    
    async encryptContext(data) {
        const key = Buffer.from(this.config.encryptionKey || crypto.randomBytes(32));
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(data), 'utf8'),
            cipher.final()
        ]);
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64')
        };
    }
    
    async decryptContext(encryptedData) {
        const key = Buffer.from(this.config.encryptionKey || crypto.randomBytes(32));
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(encryptedData.iv, 'base64')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
        
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
            decipher.final()
        ]);
        
        return JSON.parse(decrypted.toString('utf8'));
    }
    
    async compressContext(data) {
        // Implement compression (using zlib in production)
        return data; // Simplified for now
    }
    
    async decompressContext(data) {
        // Implement decompression
        return data; // Simplified for now
    }
    
    calculateChecksum(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    
    verifyChecksum(data, checksum) {
        return this.calculateChecksum(data) === checksum;
    }
    
    async encryptMemory(snapshot) {
        // Enhanced encryption for memory snapshots
        return this.encryptContext(snapshot);
    }
    
    async decryptMemory(encrypted) {
        return this.decryptContext(encrypted);
    }
    
    async transformForPlatform(data, platform) {
        // Use matrix transformer service
        return this.matrix.transformer.transform(
            'memory',
            platform,
            data
        );
    }
    
    trackCredits(type, amount, reason) {
        console.log(`💰 Credits ${type}: ${amount} (${reason})`);
        this.emit('credits-changed', { type, amount, reason });
    }
    
    async fetchCurrentRates() {
        // Fetch rates from various platforms
        const rates = new Map();
        
        // Simulated rates (would fetch from actual APIs)
        rates.set('perplexity', { buy: 1.0, sell: 0.95 });
        rates.set('openai', { buy: 1.2, sell: 1.15 });
        rates.set('anthropic', { buy: 1.1, sell: 1.05 });
        rates.set('matrix', { buy: 0.8, sell: 0.75 });
        
        return rates;
    }
    
    calculateArbitrage(fromRates, toRates) {
        const buyPrice = fromRates.sell;
        const sellPrice = toRates.buy;
        return (sellPrice - buyPrice) / buyPrice;
    }
    
    calculateOptimalAmount(fromRates, toRates) {
        // Calculate optimal trade amount based on liquidity and limits
        return 1000; // Simplified
    }
    
    assessRisk(fromPlatform, toPlatform) {
        // Assess risk based on platform reliability and history
        return 'low'; // Simplified
    }
    
    async executeArbitrage(opportunity) {
        console.log(`💱 Executing arbitrage: ${opportunity.from} → ${opportunity.to}`);
        // Execute the arbitrage trade
    }
    
    extractMemoryTags(memory) {
        // Extract semantic tags from memory
        return ['context', 'encrypted'];
    }
    
    async getCreditBalance() {
        // Get current credit balance
        return 10000; // Simplified
    }
    
    async receiveMemory(snapshotId) {
        // Receive purchased memory from seller
        return this.context.memory.get(snapshotId);
    }
    
    async updateReputation(userId, type) {
        const current = this.marketplace.reputation.get(userId) || 0;
        const change = type === 'positive' ? 1 : -1;
        this.marketplace.reputation.set(userId, current + change);
    }
    
    async gatherUserContext(userId) {
        // Gather all context for a user
        return {
            interactions: [],
            generations: [],
            preferences: {},
            skills: {},
            connections: [],
            achievements: []
        };
    }
    
    async extractPatterns(context) {
        // Extract behavioral patterns from context
        return {};
    }
    
    createTemporalIndex(context) {
        // Create time-based index
        return {};
    }
    
    async createSemanticIndex(context) {
        // Create meaning-based index
        return {};
    }
    
    createRelationalIndex(context) {
        // Create relationship-based index
        return {};
    }
    
    async encryptSuperMemory(superMemory) {
        // Enhanced encryption for SuperMemory
        return this.encryptContext(superMemory);
    }
    
    async storeSuperMemory(userId, encrypted) {
        // Store with redundancy across multiple locations
        this.context.memory.set(`super-${userId}`, encrypted);
    }
    
    generateAccessToken(memoryId) {
        return jwt.sign(
            { memoryId, type: 'super-memory' },
            this.config.jwtSecret || 'secret',
            { expiresIn: '30d' }
        );
    }
    
    gatherLocalChanges() {
        // Gather changes since last sync
        return [];
    }
    
    calculateSyncChecksum(changes) {
        return this.calculateChecksum(changes);
    }
    
    async applyRemoteChanges(changes) {
        // Apply changes from Perplexity
        for (const change of changes) {
            console.log('Applying remote change:', change.type);
        }
    }
    
    scheduleReconnect() {
        if (this.connection.reconnectAttempts >= this.config.maxReconnects) {
            console.error('Max reconnection attempts reached');
            return;
        }
        
        const delay = Math.min(1000 * Math.pow(2, this.connection.reconnectAttempts), 30000);
        this.connection.reconnectAttempts++;
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.connection.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    
    async performHealthCheck() {
        if (this.connection.status !== 'connected') return;
        
        try {
            const response = await this.sendAndWait('health-check', {}, 5000);
            
            if (!response.healthy) {
                console.warn('Perplexity MCP unhealthy:', response.issues);
            }
        } catch (error) {
            console.error('Health check failed:', error);
        }
    }
    
    async updateMarketplace() {
        // Update marketplace listings
        const activeListings = Array.from(this.marketplace.listings.values())
            .filter(l => l.active);
        
        console.log(`📦 Marketplace: ${activeListings.length} active listings`);
    }
    
    /**
     * Handle specific message types
     */
    async handleContextUpdate(payload) {
        // Handle context updates from Perplexity
        this.emit('remote-context-update', payload);
    }
    
    async handleMemoryRequest(payload) {
        // Handle memory access requests
        if (payload.type === 'read') {
            const memory = this.context.memory.get(payload.snapshotId);
            if (memory && payload.authorized) {
                this.send('memory-response', {
                    snapshotId: payload.snapshotId,
                    encrypted: memory
                });
            }
        }
    }
    
    async handleRateUpdate(payload) {
        // Update arbitrage rates
        this.arbitrage.rates.set(payload.platform, payload.rates);
    }
    
    async handleMarketplaceEvent(payload) {
        // Handle marketplace events
        if (payload.type === 'new-listing') {
            this.marketplace.listings.set(payload.listing.id, payload.listing);
        }
    }
    
    async handleSyncRequest(payload) {
        // Handle sync requests from Perplexity
        const changes = this.gatherLocalChanges();
        this.send('sync-response', { changes });
    }
    
    async handleCapabilityQuery(payload) {
        // Respond with our capabilities
        this.send('capability-response', {
            capabilities: [
                'context-sharing',
                'memory-trading',
                'credit-arbitrage',
                'encrypted-storage',
                'pattern-recognition',
                'cross-platform-generation'
            ],
            version: this.version
        });
    }
}

// Simplified JWT implementation for demo
const jwt = {
    sign: (payload, secret, options) => {
        return Buffer.from(JSON.stringify({ payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64');
    },
    verify: (token, secret) => {
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            if (decoded.exp < Date.now()) throw new Error('Token expired');
            return decoded.payload;
        } catch {
            throw new Error('Invalid token');
        }
    }
};

module.exports = PerplexityMCPConnector;