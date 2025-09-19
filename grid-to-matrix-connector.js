/**
 * Grid to Matrix Connector
 * Provides bidirectional data flow between Interactive Data Grid and Tier Matrix System
 * Implements tier absorption patterns defined in tier-absorption.toml
 */

const fs = require('fs');
const path = require('path');
const toml = require('@iarna/toml');
const EventEmitter = require('events');
const WASMProtectionWrapper = require('./wasm-protection-wrapper');

class GridToMatrixConnector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            configPath: options.configPath || './tier-absorption.toml',
            gridEndpoint: options.gridEndpoint || 'http://localhost:3000',
            wasmProtection: options.wasmProtection !== false,
            bufferSize: options.bufferSize || 4096,
            syncInterval: options.syncInterval || 2000,
            ...options
        };
        
        this.tiers = new Map();
        this.connections = new Map();
        this.dataBuffer = new Map();
        this.syncTimer = null;
        this.wasmProtection = null;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize WASM protection if enabled
            if (this.options.wasmProtection) {
                this.wasmProtection = new WASMProtectionWrapper({
                    safeMode: true,
                    maxMemoryMB: 256,
                    gcInterval: 3000
                });
            }
            
            // Load tier configuration
            await this.loadTierConfig();
            
            // Set up tier connections
            this.setupTierConnections();
            
            // Start sync timer
            this.startSyncTimer();
            
            console.log('[Grid-Matrix Connector] Initialized successfully');
            this.emit('initialized');
        } catch (error) {
            console.error('[Grid-Matrix Connector] Initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    async loadTierConfig() {
        try {
            const configContent = fs.readFileSync(this.options.configPath, 'utf-8');
            const config = toml.parse(configContent);
            
            // Load tier definitions
            for (const [tierName, tierConfig] of Object.entries(config.tiers)) {
                this.tiers.set(tierConfig.level, {
                    name: tierConfig.name,
                    absorbs: tierConfig.absorbs || [],
                    provides: tierConfig.provides || [],
                    connectors: tierConfig.connectors || [],
                    ...tierConfig
                });
            }
            
            // Load matrix connections
            if (config.matrix && config.matrix.connections) {
                config.matrix.connections.forEach(conn => {
                    if (!this.connections.has(conn.from)) {
                        this.connections.set(conn.from, []);
                    }
                    this.connections.get(conn.from).push({
                        to: conn.to,
                        type: conn.type
                    });
                });
            }
            
            console.log(`[Grid-Matrix Connector] Loaded ${this.tiers.size} tiers`);
        } catch (error) {
            console.error('[Grid-Matrix Connector] Failed to load config:', error);
            throw error;
        }
    }
    
    setupTierConnections() {
        // Set up data flow handlers for each tier
        for (const [level, tier] of this.tiers) {
            this.setupTierHandler(level, tier);
        }
    }
    
    setupTierHandler(level, tier) {
        // Create a handler for this tier
        const handler = {
            level,
            tier,
            processData: async (data, source) => {
                if (this.wasmProtection) {
                    return await this.wasmProtection.wrapAsync(
                        () => this.processTierData(level, data, source),
                        `Tier ${level} processing`
                    );
                } else {
                    return await this.processTierData(level, data, source);
                }
            }
        };
        
        // Store handler
        this.tiers.get(level).handler = handler;
    }
    
    async processTierData(level, data, source) {
        const tier = this.tiers.get(level);
        console.log(`[Tier ${level}] Processing data from ${source}`);
        
        try {
            // Apply tier-specific transformations
            let processedData = data;
            
            // Grid tier (0) - Structure raw data
            if (level === 0) {
                processedData = this.structureGridData(data);
            }
            
            // Matrix tier (1) - Transform data
            else if (level === 1) {
                processedData = this.transformMatrixData(data);
            }
            
            // Integration tier (4) - Add API connections
            else if (level === 4) {
                processedData = await this.enrichWithAPIData(data);
            }
            
            // SoulFRA tier (7) - Add user context
            else if (level === 7) {
                processedData = await this.addSoulFRAContext(data);
            }
            
            // Buffer the processed data
            this.bufferData(level, processedData);
            
            // Emit tier-specific event
            this.emit(`tier-${level}-processed`, processedData);
            
            // Propagate to connected tiers
            await this.propagateToConnectedTiers(level, processedData);
            
            return processedData;
        } catch (error) {
            console.error(`[Tier ${level}] Processing error:`, error);
            this.emit('tier-error', { level, error });
            throw error;
        }
    }
    
    structureGridData(data) {
        // Convert grid data to structured format
        if (Array.isArray(data)) {
            return {
                type: 'grid',
                rows: data.length,
                columns: data[0] ? Object.keys(data[0]).length : 0,
                data: data,
                timestamp: new Date().toISOString()
            };
        }
        
        return data;
    }
    
    transformMatrixData(data) {
        // Apply matrix transformations
        const transformed = {
            type: 'matrix',
            original: data,
            transformations: []
        };
        
        // Normalize data
        if (data.data && Array.isArray(data.data)) {
            transformed.normalized = this.normalizeData(data.data);
            transformed.transformations.push('normalization');
        }
        
        // Add aggregations
        if (data.data) {
            transformed.aggregations = this.calculateAggregations(data.data);
            transformed.transformations.push('aggregation');
        }
        
        return transformed;
    }
    
    normalizeData(data) {
        // Simple normalization example
        return data.map(row => {
            const normalized = {};
            for (const [key, value] of Object.entries(row)) {
                // Normalize strings
                if (typeof value === 'string') {
                    normalized[key] = value.trim().toLowerCase();
                }
                // Normalize numbers
                else if (typeof value === 'number') {
                    normalized[key] = value;
                }
                // Handle nulls
                else if (value == null) {
                    normalized[key] = null;
                }
                else {
                    normalized[key] = value;
                }
            }
            return normalized;
        });
    }
    
    calculateAggregations(data) {
        const aggregations = {
            count: data.length,
            fields: {}
        };
        
        if (data.length > 0) {
            // Get field names
            const fields = Object.keys(data[0]);
            
            fields.forEach(field => {
                const values = data.map(row => row[field]).filter(v => v != null);
                
                if (values.length > 0 && typeof values[0] === 'number') {
                    aggregations.fields[field] = {
                        sum: values.reduce((a, b) => a + b, 0),
                        avg: values.reduce((a, b) => a + b, 0) / values.length,
                        min: Math.min(...values),
                        max: Math.max(...values)
                    };
                }
            });
        }
        
        return aggregations;
    }
    
    async enrichWithAPIData(data) {
        // Simulate API enrichment
        return {
            ...data,
            apiEnrichment: {
                timestamp: new Date().toISOString(),
                sources: ['github', 'stripe', 'google'],
                status: 'enriched'
            }
        };
    }
    
    async addSoulFRAContext(data) {
        // Add SoulFRA user context
        return {
            ...data,
            soulfra: {
                user: process.env.USER || 'anonymous',
                session: Date.now(),
                features: {
                    voiceAuth: true,
                    forumAccess: true,
                    aiQueries: true
                }
            }
        };
    }
    
    bufferData(level, data) {
        if (!this.dataBuffer.has(level)) {
            this.dataBuffer.set(level, []);
        }
        
        const buffer = this.dataBuffer.get(level);
        buffer.push({
            data,
            timestamp: Date.now()
        });
        
        // Limit buffer size
        if (buffer.length > this.options.bufferSize) {
            buffer.shift();
        }
    }
    
    async propagateToConnectedTiers(fromLevel, data) {
        const connections = this.connections.get(fromLevel);
        if (!connections) return;
        
        for (const connection of connections) {
            const toTiers = connection.to === '*' ? 
                Array.from(this.tiers.keys()) : 
                (Array.isArray(connection.to) ? connection.to : [connection.to]);
            
            for (const toLevel of toTiers) {
                if (toLevel !== fromLevel && this.tiers.has(toLevel)) {
                    const handler = this.tiers.get(toLevel).handler;
                    if (handler) {
                        await handler.processData(data, `tier-${fromLevel}`);
                    }
                }
            }
        }
    }
    
    startSyncTimer() {
        this.syncTimer = setInterval(() => {
            this.syncTiers();
        }, this.options.syncInterval);
    }
    
    async syncTiers() {
        try {
            // Sync buffered data across tiers
            for (const [level, buffer] of this.dataBuffer) {
                if (buffer.length > 0) {
                    const latestData = buffer[buffer.length - 1];
                    this.emit('tier-sync', {
                        level,
                        data: latestData.data,
                        timestamp: latestData.timestamp
                    });
                }
            }
            
            // Clean old buffer entries
            const cutoffTime = Date.now() - 60000; // 1 minute
            for (const [level, buffer] of this.dataBuffer) {
                const filtered = buffer.filter(entry => entry.timestamp > cutoffTime);
                this.dataBuffer.set(level, filtered);
            }
        } catch (error) {
            console.error('[Grid-Matrix Connector] Sync error:', error);
        }
    }
    
    // Public API methods
    
    async sendToGrid(data) {
        // Send data to grid (tier 0)
        return await this.tiers.get(0).handler.processData(data, 'external');
    }
    
    async sendToTier(level, data) {
        // Send data to specific tier
        if (!this.tiers.has(level)) {
            throw new Error(`Tier ${level} not found`);
        }
        
        return await this.tiers.get(level).handler.processData(data, 'external');
    }
    
    async queryTier(level, query) {
        // Query data from a specific tier
        const buffer = this.dataBuffer.get(level);
        if (!buffer || buffer.length === 0) {
            return null;
        }
        
        // Return latest data by default
        return buffer[buffer.length - 1].data;
    }
    
    getTierStatus(level) {
        const tier = this.tiers.get(level);
        if (!tier) return null;
        
        const buffer = this.dataBuffer.get(level) || [];
        return {
            name: tier.name,
            level: level,
            bufferSize: buffer.length,
            lastUpdate: buffer.length > 0 ? buffer[buffer.length - 1].timestamp : null,
            connections: this.connections.get(level) || []
        };
    }
    
    getAllTierStatuses() {
        const statuses = {};
        for (const level of this.tiers.keys()) {
            statuses[level] = this.getTierStatus(level);
        }
        return statuses;
    }
    
    // Cleanup
    destroy() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        
        if (this.wasmProtection) {
            this.wasmProtection.destroy();
        }
        
        this.removeAllListeners();
        this.tiers.clear();
        this.connections.clear();
        this.dataBuffer.clear();
        
        console.log('[Grid-Matrix Connector] Destroyed');
    }
}

module.exports = GridToMatrixConnector;

// Example usage
if (require.main === module) {
    const connector = new GridToMatrixConnector({
        wasmProtection: true,
        syncInterval: 1000
    });
    
    connector.on('initialized', () => {
        console.log('Connector initialized!');
        
        // Test sending data to grid
        connector.sendToGrid([
            { id: 1, name: 'Test User', email: 'test@example.com' },
            { id: 2, name: 'Another User', email: 'another@example.com' }
        ]);
    });
    
    connector.on('tier-1-processed', (data) => {
        console.log('Matrix tier processed:', data);
    });
    
    connector.on('tier-7-processed', (data) => {
        console.log('SoulFRA tier processed:', data);
    });
    
    // Monitor tier statuses
    setInterval(() => {
        console.log('\nTier Statuses:', connector.getAllTierStatuses());
    }, 5000);
}