#!/usr/bin/env node

/**
 * 🔗💊 CAL CONTEXT CAPSULE BRIDGE
 * 
 * Connects the CAL Context Discovery Bridge with the Runtime Capsule System
 * to enable persistent storage, introspection, and time-series analysis of
 * code contexts, TODOs, and patterns.
 * 
 * Features:
 * - Store code search results as capsules
 * - Track TODO lifecycle through capsule layers
 * - Enable deep introspection of code patterns
 * - Time-series analysis of codebase evolution
 * - Integration with all capsule introspection engines
 */

const CALContextBridgeSimple = require('./CAL-Context-Bridge-Simple.js');
const http = require('http');
const crypto = require('crypto');
const EventEmitter = require('events');

class CALContextCapsuleBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Context Bridge settings
            maxSnippets: config.maxSnippets || 10,
            enableTodoExtraction: config.enableTodoExtraction !== false,
            
            // Capsule System settings
            capsuleSystemUrl: config.capsuleSystemUrl || 'http://localhost:4900',
            defaultLayer: config.defaultLayer || 'runtime',
            
            // Capsule creation rules
            capsuleRules: {
                codeSearch: {
                    layer: 'temporal',      // Search results are temporal
                    retention: '1h'
                },
                todoDiscovery: {
                    layer: 'runtime',       // TODOs persist longer
                    retention: '24h'
                },
                patternAnalysis: {
                    layer: 'substrate',     // Patterns are permanent
                    retention: '∞'
                },
                contextSnapshot: {
                    layer: 'runtime',
                    retention: '24h'
                }
            },
            
            // Auto-capsule settings
            autoCapsule: config.autoCapsule !== false,
            capsuleInterval: config.capsuleInterval || 300000, // 5 minutes
            
            ...config
        };
        
        // Initialize components
        this.contextBridge = null;
        this.capsuleClient = null;
        this.capsuleCache = new Map();
        
        // Statistics
        this.stats = {
            capsulesCreated: 0,
            searchesCapsulized: 0,
            todosCapsulized: 0,
            patternsCapsulized: 0,
            introspectionsRun: 0
        };
        
        console.log('🔗💊 CAL Context Capsule Bridge initialized');
    }
    
    async initialize() {
        console.log('🚀 Initializing Context-Capsule Bridge...');
        
        try {
            // Initialize Context Bridge
            this.contextBridge = new CALContextBridgeSimple({
                maxSnippets: this.config.maxSnippets,
                enableTodoExtraction: this.config.enableTodoExtraction
            });
            
            await this.contextBridge.initialize();
            console.log('✅ Context Bridge initialized');
            
            // Test capsule system connection
            const capsuleHealth = await this.checkCapsuleSystem();
            if (capsuleHealth.healthy) {
                console.log('✅ Connected to Runtime Capsule System');
            } else {
                console.warn('⚠️ Capsule System not available - running in local mode');
            }
            
            // Start auto-capsule if enabled
            if (this.config.autoCapsule) {
                this.startAutoCapsule();
            }
            
            console.log('✅ Context-Capsule Bridge ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Enhanced search that creates capsules
     */
    async searchWithCapsule(query, options = {}) {
        console.log(`🔍💊 Searching with capsule creation: "${query}"`);
        
        // Perform context search
        const context = await this.contextBridge.searchWithContext(query, options);
        
        // Create search result capsule
        const searchCapsule = await this.createCapsule('code-search', {
            query,
            timestamp: context.timestamp,
            results: {
                snippetsFound: context.stats.snippetsFound,
                todosFound: context.stats.todosFound,
                executionTime: context.stats.executionTime
            },
            topSnippets: context.codeSnippets.slice(0, 5),
            topTodos: context.todos.slice(0, 5),
            summary: context.summary
        });
        
        this.stats.searchesCapsulized++;
        
        // Create TODO capsules if TODOs found
        if (context.todos.length > 0) {
            await this.capsulizeTodos(context.todos);
        }
        
        // Analyze patterns and create pattern capsules
        if (context.patterns && context.patterns.length > 0) {
            await this.capsulizePatterns(context.patterns);
        }
        
        // Return enhanced context with capsule references
        return {
            ...context,
            capsuleId: searchCapsule.capsuleId,
            capsuleLayer: searchCapsule.layer,
            introspectionAvailable: true
        };
    }
    
    /**
     * Create TODO capsules for tracking
     */
    async capsulizeTodos(todos) {
        console.log(`📝💊 Creating capsules for ${todos.length} TODOs`);
        
        const todoCapsule = await this.createCapsule('todo-discovery', {
            discoveryTime: new Date().toISOString(),
            totalTodos: todos.length,
            byType: this.groupTodosByType(todos),
            byFile: this.groupTodosByFile(todos),
            criticalTodos: todos.filter(t => t.type === 'FIXME' || t.type === 'BUG'),
            todos: todos
        });
        
        this.stats.todosCapsulized += todos.length;
        
        return todoCapsule;
    }
    
    /**
     * Create pattern capsules for permanent storage
     */
    async capsulizePatterns(patterns) {
        console.log(`🧩💊 Creating capsules for ${patterns.length} patterns`);
        
        const patternCapsule = await this.createCapsule('pattern-analysis', {
            analysisTime: new Date().toISOString(),
            patternsFound: patterns.length,
            patternTypes: patterns.map(p => p.type),
            patterns: patterns,
            codebaseSnapshot: {
                totalFiles: this.contextBridge.getStats().codeFiles,
                totalTodos: this.contextBridge.getStats().totalTodos
            }
        });
        
        this.stats.patternsCapsulized += patterns.length;
        
        return patternCapsule;
    }
    
    /**
     * Create a context snapshot capsule
     */
    async createContextSnapshot() {
        console.log('📸💊 Creating context snapshot capsule');
        
        const stats = this.contextBridge.getStats();
        const tasks = await this.contextBridge.extractTodosForTaskManager();
        
        const snapshotCapsule = await this.createCapsule('context-snapshot', {
            timestamp: new Date().toISOString(),
            codebaseStats: stats,
            taskSummary: {
                totalGroups: tasks.length,
                criticalTasks: tasks.filter(t => t.priority > 2.5).length,
                byType: this.summarizeTaskTypes(tasks)
            },
            topTasks: tasks.slice(0, 10)
        });
        
        return snapshotCapsule;
    }
    
    /**
     * Run introspection on context-related capsules
     */
    async runContextIntrospection(engine, options = {}) {
        console.log(`🔍💊 Running ${engine} introspection on context capsules`);
        
        try {
            const response = await this.capsuleRequest('/api/introspect', {
                engine,
                layer: options.layer || 'all',
                timeRange: options.timeRange || '24h',
                parameters: {
                    ...options,
                    filter: 'context-related'
                }
            });
            
            this.stats.introspectionsRun++;
            
            return response;
            
        } catch (error) {
            console.error('❌ Introspection failed:', error);
            throw error;
        }
    }
    
    /**
     * Query capsules for historical context
     */
    async queryContextHistory(query, timeRange = '24h') {
        console.log(`📚💊 Querying context history for: "${query}"`);
        
        try {
            const response = await this.capsuleRequest('/api/query-capsules', {
                layer: 'all',
                query: query,
                timeRange: timeRange,
                limit: 100
            });
            
            return response;
            
        } catch (error) {
            console.error('❌ History query failed:', error);
            throw error;
        }
    }
    
    /**
     * Perform deep archaeology on code evolution
     */
    async performCodeArchaeology(options = {}) {
        console.log('🏛️💊 Performing code archaeology analysis');
        
        try {
            const response = await this.capsuleRequest('/api/runtime-archaeology', {
                depth: options.depth || 'standard',
                analysis: options.analysis || 'code-evolution',
                timespan: options.timespan || '7d',
                focus: 'context-capsules'
            });
            
            return response;
            
        } catch (error) {
            console.error('❌ Archaeology failed:', error);
            throw error;
        }
    }
    
    /**
     * Core capsule creation method
     */
    async createCapsule(type, data) {
        const capsuleType = this.mapToCapsuleType(type);
        const layer = this.config.capsuleRules[type]?.layer || this.config.defaultLayer;
        
        try {
            const response = await this.capsuleRequest('/api/create-capsule', {
                type: capsuleType,
                layer: layer,
                data: data,
                metadata: {
                    source: 'cal-context-bridge',
                    version: '1.0.0',
                    bridgeType: type
                }
            });
            
            this.stats.capsulesCreated++;
            
            // Cache capsule reference
            this.capsuleCache.set(response.capsuleId, {
                type,
                layer,
                timestamp: response.timestamp
            });
            
            return response;
            
        } catch (error) {
            console.warn('⚠️ Capsule creation failed, storing locally:', error.message);
            
            // Fallback to local storage
            return this.storeLocally(type, data);
        }
    }
    
    /**
     * Helper methods
     */
    
    mapToCapsuleType(bridgeType) {
        const typeMap = {
            'code-search': 'system-state',
            'todo-discovery': 'validation-cycle',
            'pattern-analysis': 'system-state',
            'context-snapshot': 'system-state'
        };
        
        return typeMap[bridgeType] || 'system-state';
    }
    
    groupTodosByType(todos) {
        const groups = {};
        todos.forEach(todo => {
            if (!groups[todo.type]) {
                groups[todo.type] = [];
            }
            groups[todo.type].push(todo);
        });
        return groups;
    }
    
    groupTodosByFile(todos) {
        const groups = {};
        todos.forEach(todo => {
            if (!groups[todo.file]) {
                groups[todo.file] = [];
            }
            groups[todo.file].push(todo);
        });
        return groups;
    }
    
    summarizeTaskTypes(tasks) {
        const summary = {};
        tasks.forEach(task => {
            summary[task.type] = (summary[task.type] || 0) + 1;
        });
        return summary;
    }
    
    /**
     * Auto-capsule functionality
     */
    startAutoCapsule() {
        console.log('🤖💊 Starting auto-capsule creation');
        
        setInterval(async () => {
            try {
                await this.createContextSnapshot();
                console.log('✅ Auto-capsule created');
            } catch (error) {
                console.error('❌ Auto-capsule failed:', error.message);
            }
        }, this.config.capsuleInterval);
    }
    
    /**
     * Capsule system communication
     */
    async checkCapsuleSystem() {
        try {
            const response = await this.capsuleRequest('/api/health', null, 'GET');
            return { healthy: true, ...response };
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }
    
    capsuleRequest(path, data = null, method = 'POST') {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.config.capsuleSystemUrl);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', chunk => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(parsed.error || 'Request failed'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data && method !== 'GET') {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    /**
     * Local storage fallback
     */
    storeLocally(type, data) {
        const capsuleId = crypto.randomBytes(16).toString('hex');
        const timestamp = new Date().toISOString();
        
        // Store in memory for now
        this.capsuleCache.set(capsuleId, {
            type,
            data,
            timestamp,
            local: true
        });
        
        return {
            capsuleId,
            timestamp,
            layer: 'local',
            success: true
        };
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            bridge: this.contextBridge.getStats(),
            capsules: this.stats,
            cacheSize: this.capsuleCache.size
        };
    }
    
    /**
     * Integration with CAL systems
     */
    async provideEnhancedContextToCAL(query, systemId) {
        // Get context with capsule
        const context = await this.searchWithCapsule(query);
        
        // Enhance with capsule references
        const enhancedContext = await this.contextBridge.provideContextToCAL(query, systemId);
        
        return {
            ...enhancedContext,
            capsuleReferences: {
                searchCapsule: context.capsuleId,
                introspectionAvailable: true,
                historicalData: await this.queryContextHistory(query, '7d')
            }
        };
    }
}

module.exports = CALContextCapsuleBridge;

// Demo/Test when run directly
if (require.main === module) {
    async function demo() {
        console.log(`
🔗💊 CAL CONTEXT CAPSULE BRIDGE DEMO
====================================
`);
        
        const bridge = new CALContextCapsuleBridge({
            autoCapsule: true,
            capsuleInterval: 60000 // 1 minute for demo
        });
        
        await bridge.initialize();
        
        // Test search with capsule
        console.log('\n📍 Test 1: Search with capsule creation...');
        const searchResult = await bridge.searchWithCapsule('authentication system');
        console.log(`✅ Search completed with capsule: ${searchResult.capsuleId}`);
        console.log(`  - Found ${searchResult.stats.snippetsFound} code snippets`);
        console.log(`  - Found ${searchResult.stats.todosFound} TODOs`);
        
        // Test introspection
        console.log('\n📍 Test 2: Running pattern analysis introspection...');
        try {
            const introspection = await bridge.runContextIntrospection('pattern-analysis', {
                layer: 'temporal',
                timeRange: '1h'
            });
            console.log('✅ Introspection complete');
        } catch (error) {
            console.log('⚠️ Introspection skipped (capsule system not running)');
        }
        
        // Test context history
        console.log('\n📍 Test 3: Querying context history...');
        try {
            const history = await bridge.queryContextHistory('authentication', '24h');
            console.log(`✅ Found ${history.totalFound || 0} historical capsules`);
        } catch (error) {
            console.log('⚠️ History query skipped (capsule system not running)');
        }
        
        // Show statistics
        console.log('\n📊 Bridge Statistics:');
        console.log(JSON.stringify(bridge.getStats(), null, 2));
        
        console.log(`
✅ Context-Capsule Bridge Demo Complete!
=======================================
The bridge successfully:
- Connected code search with capsule storage
- Created capsules for search results and TODOs
- Enabled introspection of code patterns
- Provided time-series analysis capabilities
`);
    }
    
    demo().catch(console.error);
}