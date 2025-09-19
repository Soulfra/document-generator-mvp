#!/usr/bin/env node

/**
 * 🔍 DATA SIEVE MIDDLEWARE
 * 
 * Filters and processes data streams between character controller and databases.
 * Different parties get different levels of information - no centralized data.
 * 
 * Flow: Redis Streams → Data Sieve → Filtered Outputs → Multiple Databases
 * 
 * Features:
 * - Permission-based data filtering
 * - Context expansion through streaming
 * - Multi-database routing
 * - Memory-efficient processing
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class DataSieveMiddleware extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Sieve configuration
            filterLevels: ['public', 'internal', 'private', 'admin'],
            batchSize: config.batchSize || 50,
            processingDelay: config.processingDelay || 100,
            
            // Database routing
            databases: {
                public: { type: 'postgres', table: 'public_stories' },
                internal: { type: 'postgres', table: 'internal_analytics' },
                private: { type: 'sqlite', path: './databases/private-data.db' },
                admin: { type: 'sqlite', path: './databases/admin-logs.db' }
            },
            
            // Context expansion rules
            expandContextFor: ['story_generation', 'character_development'],
            maxContextDepth: 5,
            
            ...config
        };
        
        // Sieve state
        this.sieveState = {
            processedCount: 0,
            filteredCount: 0,
            routedCount: 0,
            errorCount: 0,
            lastProcessed: null,
            activeFilters: new Set(),
            contextCache: new Map()
        };
        
        // Filter definitions for different data types
        this.filterRules = {
            story_data: {
                public: ['title', 'theme', 'wordCount', 'publishedAt'],
                internal: ['title', 'theme', 'wordCount', 'publishedAt', 'aiModel', 'processingTime'],
                private: ['*'], // All fields
                admin: ['*', 'systemLogs', 'debugInfo']
            },
            
            character_data: {
                public: ['name', 'type', 'level', 'achievements'],
                internal: ['name', 'type', 'level', 'achievements', 'experience', 'skills'],
                private: ['*'], // All fields
                admin: ['*', 'internalState', 'debugLogs']
            },
            
            easter_egg_data: {
                public: ['type', 'location', 'timestamp'],
                internal: ['type', 'location', 'timestamp', 'metadata', 'ring'],
                private: ['*'],
                admin: ['*', 'systemContext']
            },
            
            interaction_data: {
                public: ['timestamp', 'type', 'characterId'],
                internal: ['timestamp', 'type', 'characterId', 'duration', 'outcome'],
                private: ['*'],
                admin: ['*', 'userAnalytics', 'behaviorData']
            }
        };
        
        // Context expansion patterns
        this.contextExpansionRules = {
            story_generation: {
                lookback: 3, // Look at last 3 related events
                related_streams: ['character:development', 'character:interaction'],
                expansion_fields: ['character_history', 'related_skills', 'user_preferences']
            },
            
            character_development: {
                lookback: 5,
                related_streams: ['character:story', 'character:interaction'],
                expansion_fields: ['story_context', 'interaction_patterns', 'learning_trajectory']
            }
        };
        
        console.log('🔍 Data Sieve Middleware initialized');
        console.log(`📊 Filter levels: ${this.config.filterLevels.join(', ')}`);
        console.log(`🗄️ Database routes: ${Object.keys(this.config.databases).join(', ')}`);
    }
    
    /**
     * Main sieve processing function
     */
    async sieveData(rawData, dataType, requestedLevel = 'public') {
        console.log(`🔍 Sieving ${dataType} data for ${requestedLevel} level`);
        
        try {
            // Increment processing counter
            this.sieveState.processedCount++;
            
            // Get filter rules for this data type
            const rules = this.filterRules[dataType];
            if (!rules) {
                throw new Error(`No filter rules defined for data type: ${dataType}`);
            }
            
            // Apply filtering
            const filteredData = this.applyFilter(rawData, rules[requestedLevel]);
            this.sieveState.filteredCount++;
            
            // Expand context if needed
            const expandedData = await this.expandContext(filteredData, dataType, requestedLevel);
            
            // Route to appropriate database
            const routingResult = await this.routeToDatabase(expandedData, requestedLevel);
            this.sieveState.routedCount++;
            
            // Update state
            this.sieveState.lastProcessed = Date.now();
            
            // Emit sieve event
            this.emit('data_sieved', {
                dataType,
                requestedLevel,
                originalSize: JSON.stringify(rawData).length,
                filteredSize: JSON.stringify(filteredData).length,
                routed: routingResult
            });
            
            return {
                filtered: filteredData,
                expanded: expandedData,
                routed: routingResult
            };
            
        } catch (error) {
            this.sieveState.errorCount++;
            console.error(`❌ Sieve error for ${dataType}:`, error);
            throw error;
        }
    }
    
    /**
     * Apply filter rules to data
     */
    applyFilter(data, allowedFields) {
        if (allowedFields.includes('*')) {
            return data; // All fields allowed
        }
        
        const filtered = {};
        for (const field of allowedFields) {
            if (data.hasOwnProperty(field)) {
                filtered[field] = data[field];
            }
        }
        
        return filtered;
    }
    
    /**
     * Expand context for enriched data
     */
    async expandContext(data, dataType, level) {
        const expansionRule = this.contextExpansionRules[dataType];
        if (!expansionRule || level === 'public') {
            return data; // No expansion for public data
        }
        
        console.log(`🔄 Expanding context for ${dataType}`);
        
        try {
            // Check context cache first
            const cacheKey = this.generateContextCacheKey(data, dataType);
            if (this.sieveState.contextCache.has(cacheKey)) {
                console.log('💨 Using cached context');
                return this.sieveState.contextCache.get(cacheKey);
            }
            
            const expandedData = { ...data };
            
            // Add context fields based on expansion rules
            for (const field of expansionRule.expansion_fields) {
                expandedData[field] = await this.generateContextField(field, data, expansionRule);
            }
            
            // Cache the result (with size limit)
            if (this.sieveState.contextCache.size < 100) {
                this.sieveState.contextCache.set(cacheKey, expandedData);
            }
            
            return expandedData;
            
        } catch (error) {
            console.error(`❌ Context expansion error:`, error);
            return data; // Return original data on error
        }
    }
    
    /**
     * Generate context field based on rules
     */
    async generateContextField(fieldName, data, expansionRule) {
        switch (fieldName) {
            case 'character_history':
                return await this.getCharacterHistory(data.character_id, expansionRule.lookback);
                
            case 'related_skills':
                return await this.getRelatedSkills(data.character_id);
                
            case 'story_context':
                return await this.getStoryContext(data.character_id, expansionRule.lookback);
                
            case 'interaction_patterns':
                return await this.getInteractionPatterns(data.character_id);
                
            default:
                return null;
        }
    }
    
    /**
     * Route data to appropriate database
     */
    async routeToDatabase(data, level) {
        const dbConfig = this.config.databases[level];
        if (!dbConfig) {
            throw new Error(`No database configuration for level: ${level}`);
        }
        
        console.log(`🗄️ Routing to ${dbConfig.type} database (${level} level)`);
        
        // In a real implementation, this would connect to actual databases
        // For now, we'll simulate the routing
        const routingResult = {
            database: dbConfig.type,
            level: level,
            timestamp: Date.now(),
            dataSize: JSON.stringify(data).length,
            success: true
        };
        
        // Emit routing event
        this.emit('data_routed', routingResult);
        
        return routingResult;
    }
    
    /**
     * Batch process multiple data items
     */
    async batchSieve(dataItems, dataType, level = 'public') {
        console.log(`🔍 Batch sieving ${dataItems.length} items`);
        
        const results = [];
        
        // Process in batches to prevent memory overload
        for (let i = 0; i < dataItems.length; i += this.config.batchSize) {
            const batch = dataItems.slice(i, i + this.config.batchSize);
            
            const batchPromises = batch.map(item => 
                this.sieveData(item, dataType, level)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults);
            
            // Small delay to prevent overwhelming
            if (i + this.config.batchSize < dataItems.length) {
                await this.sleep(this.config.processingDelay);
            }
        }
        
        console.log(`✅ Batch processing complete: ${results.length} items`);
        return results;
    }
    
    /**
     * Get sieve statistics
     */
    getSieveStats() {
        return {
            processed: this.sieveState.processedCount,
            filtered: this.sieveState.filteredCount,
            routed: this.sieveState.routedCount,
            errors: this.sieveState.errorCount,
            lastProcessed: this.sieveState.lastProcessed,
            activeFilters: Array.from(this.sieveState.activeFilters),
            contextCacheSize: this.sieveState.contextCache.size,
            uptime: Date.now() - this.startTime
        };
    }
    
    // Helper methods for context generation (placeholder implementations)
    async getCharacterHistory(characterId, lookback) {
        return { characterId, recentEvents: lookback, simulated: true };
    }
    
    async getRelatedSkills(characterId) {
        return { characterId, skills: ['pattern_recognition', 'analysis'], simulated: true };
    }
    
    async getStoryContext(characterId, lookback) {
        return { characterId, recentStories: lookback, simulated: true };
    }
    
    async getInteractionPatterns(characterId) {
        return { characterId, patterns: ['frequent_user', 'long_sessions'], simulated: true };
    }
    
    generateContextCacheKey(data, dataType) {
        const key = `${dataType}:${data.character_id || data.id}:${JSON.stringify(data).slice(0, 50)}`;
        return crypto.createHash('md5').update(key).digest('hex');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = DataSieveMiddleware;

// Demo usage
if (require.main === module) {
    const sieve = new DataSieveMiddleware();
    sieve.startTime = Date.now();
    
    console.log('🔍 Testing Data Sieve Middleware...');
    
    // Test story data sieving
    const testStoryData = {
        id: 'story_123',
        character_id: 'ralph',
        title: 'The Database Adventure',
        theme: 'learning',
        content: 'Full story content here...',
        wordCount: 500,
        aiModel: 'claude-3',
        processingTime: 1500,
        userAnalytics: { userId: 'user_456', behavior: 'engaged' },
        systemLogs: ['debug info', 'performance metrics']
    };
    
    // Test different filter levels
    async function testFiltering() {
        console.log('\n📊 Testing different filter levels...');
        
        for (const level of ['public', 'internal', 'private', 'admin']) {
            console.log(`\n🔍 Filtering for ${level} level:`);
            const result = await sieve.sieveData(testStoryData, 'story_data', level);
            console.log(`   Filtered data:`, Object.keys(result.filtered));
            console.log(`   Original size: ${JSON.stringify(testStoryData).length} chars`);
            console.log(`   Filtered size: ${JSON.stringify(result.filtered).length} chars`);
        }
        
        console.log('\n📈 Sieve Statistics:');
        console.log(JSON.stringify(sieve.getSieveStats(), null, 2));
    }
    
    testFiltering().catch(console.error);
}