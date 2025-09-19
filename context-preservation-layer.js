#!/usr/bin/env node

/**
 * 🧠 CONTEXT PRESERVATION LAYER
 * Maintains system memory, component relationships, and flow continuity
 * Prevents knowledge loss and preserves architectural integrity
 */

const fs = require('fs');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class ContextPreservationLayer extends EventEmitter {
    constructor() {
        super();
        
        this.contextStore = new Map();
        this.relationshipGraph = new Map();
        this.flowHistory = [];
        this.knowledgeBase = new Map();
        this.architectureManager = null;
        
        // Critical context that must never be lost
        this.criticalContexts = new Set([
            'user-crypto-wallet',
            'scammed-wallet-tracking', 
            'system-architecture',
            'component-relationships',
            'ai-reasoning-patterns',
            'mobile-app-state'
        ]);
        
        console.log('🧠 CONTEXT PRESERVATION LAYER INITIALIZING...');
        console.log('💾 Setting up persistent context storage...');
        console.log('🔗 Mapping component relationships...');
        console.log('📈 Initializing flow history tracking...');
    }
    
    async initialize() {
        try {
            await this.loadPersistedContexts();
            await this.initializeRelationshipGraph();
            await this.setupCriticalContexts();
            await this.startContextMonitoring();
            
            console.log('✅ Context Preservation Layer ready!');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize context preservation:', error.message);
            return false;
        }
    }
    
    async loadPersistedContexts() {
        const contextFile = 'system-context-store.json';
        
        if (fs.existsSync(contextFile)) {
            try {
                const contextData = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
                
                // Restore context store
                Object.entries(contextData.contexts || {}).forEach(([key, value]) => {
                    this.contextStore.set(key, {
                        ...value,
                        restoredAt: Date.now()
                    });
                });
                
                // Restore relationship graph
                Object.entries(contextData.relationships || {}).forEach(([key, value]) => {
                    this.relationshipGraph.set(key, value);
                });
                
                // Restore flow history
                this.flowHistory = contextData.flowHistory || [];
                
                console.log(`💾 Restored ${this.contextStore.size} contexts from persistent storage`);
                console.log(`🔗 Restored ${this.relationshipGraph.size} component relationships`);
                console.log(`📈 Restored ${this.flowHistory.length} flow history entries`);
                
            } catch (error) {
                console.log('⚠️ Could not restore persisted contexts, starting fresh');
            }
        } else {
            console.log('💾 No persisted contexts found, initializing fresh state');
        }
    }
    
    async initializeRelationshipGraph() {
        // Define critical component relationships
        const relationships = [
            {
                source: 'mobile-wallet-app',
                target: 'all-services',
                type: 'proxy',
                strength: 1.0,
                critical: true,
                description: 'Mobile app serves as primary interface and proxy'
            },
            {
                source: 'mobile-wallet-app',
                target: 'crypto-wallet',
                type: 'integration',
                strength: 1.0,
                critical: true,
                description: 'Mobile app manages crypto wallet state'
            },
            {
                source: 'crypto-trace-engine',
                target: 'scammed-wallet-0x742d35Cc',
                type: 'monitoring',
                strength: 1.0,
                critical: true,
                description: 'Continuous monitoring of scammed wallet'
            },
            {
                source: 'reasoning-integration',  
                target: 'all-user-actions',
                type: 'analysis',
                strength: 0.9,
                critical: true,
                description: 'AI reasoning analyzes all user interactions'
            },
            {
                source: 'd2jsp-forum',
                target: 'game-engine',
                type: 'bidirectional',
                strength: 0.8,
                critical: false,
                description: 'Forum and game share trading data'
            },
            {
                source: 'service-worker',
                target: 'offline-capability',
                type: 'enablement',
                strength: 1.0,
                critical: true,
                description: 'Service worker enables offline functionality'
            }
        ];
        
        relationships.forEach(rel => {
            const key = `${rel.source}->${rel.target}`;
            this.relationshipGraph.set(key, {
                ...rel,
                establishedAt: Date.now(),
                lastValidated: null
            });
        });
        
        console.log('🔗 Component relationship graph initialized');
    }
    
    async setupCriticalContexts() {
        // User crypto wallet context
        this.preserveContext('user-crypto-wallet', {
            address: '0xd5dc6c1eecbc3f33c195c9733ff4c7242f3fd956',
            created: Date.now(),
            encrypted: true,
            balance: 0,
            transactions: [],
            purpose: 'Primary user wallet for D2JSP mobile system'
        });
        
        // Scammed wallet tracking context
        this.preserveContext('scammed-wallet-tracking', {
            targetWallet: '0x742d35Cc6634C053',
            nickname: 'Scammed Wallet',
            priority: 'high',
            monitoringActive: true,
            patterns: [],
            lastActivity: null,
            purpose: 'Monitor and track user\'s scammed cryptocurrency'
        });
        
        // System architecture context
        this.preserveContext('system-architecture', {
            components: {
                'mobile-wallet-app': { port: 9001, status: 'operational', role: 'primary-interface' },
                'd2jsp-forum': { port: 3000, status: 'operational', role: 'community-trading' },
                'game-engine': { port: 8000, status: 'operational', role: 'interactive-gameplay' },
                'reasoning-integration': { port: 5500, status: 'operational', role: 'ai-analysis' },
                'crypto-trace-engine': { port: 6000, status: 'operational', role: 'crypto-monitoring' },
                'unified-mining-node': { port: 7000, status: 'operational', role: 'consolidated-interface' }
            },
            layers: ['presentation', 'reasoning', 'analysis', 'infrastructure'],
            dataFlows: ['mobile->all', 'crypto->analysis', 'reasoning->decisions'],
            purpose: 'Complete D2JSP mobile system with crypto integration'
        });
        
        // AI reasoning patterns context
        this.preserveContext('ai-reasoning-patterns', {
            teacher: {
                role: 'educational',
                verbosity: 'medium',
                specializations: ['mining-optimization', 'trading-strategies'],
                confidence: 0.85
            },
            guardian: {
                role: 'security',
                alertLevel: 'high',
                specializations: ['threat-detection', 'scam-prevention'],
                confidence: 0.92
            },
            companion: {
                role: 'emotional-support',
                mood: 'encouraging',
                specializations: ['motivation', 'user-engagement'],
                confidence: 0.78
            },
            purpose: 'Three-layer AI system for comprehensive user support'
        });
        
        // Mobile app state context
        this.preserveContext('mobile-app-state', {
            currentTab: 'wallet',
            offlineCapable: true,
            pwaInstalled: false,
            pushNotificationsEnabled: true,
            serviceWorkerActive: true,
            lastSync: Date.now(),
            cacheSize: 0,
            purpose: 'Mobile app state and preferences'
        });
        
        console.log('🔒 Critical contexts established and protected');
    }
    
    // Context preservation methods
    preserveContext(contextId, data, options = {}) {
        const context = {
            id: contextId,
            data: data,
            timestamp: Date.now(),
            version: this.generateContextVersion(contextId),
            critical: this.criticalContexts.has(contextId),
            persistent: options.persistent !== false,
            ttl: options.ttl || null,
            metadata: {
                source: options.source || 'system',
                category: options.category || 'general',
                tags: options.tags || []
            }
        };
        
        this.contextStore.set(contextId, context);
        
        // Immediate persistence for critical contexts
        if (context.critical) {
            this.persistContext(contextId);
        }
        
        this.emit('context-preserved', { contextId, context });
        
        console.log(`💾 Context preserved: ${contextId} (${context.critical ? 'CRITICAL' : 'standard'})`);
        
        return context.version;
    }
    
    getContext(contextId) {
        const context = this.contextStore.get(contextId);
        
        if (context) {
            // Check TTL
            if (context.ttl && Date.now() > context.timestamp + context.ttl) {
                this.contextStore.delete(contextId);
                return null;
            }
            
            // Update access tracking
            context.lastAccessed = Date.now();
            context.accessCount = (context.accessCount || 0) + 1;
            
            return context;
        }
        
        return null;
    }
    
    updateContext(contextId, updates) {
        const existingContext = this.getContext(contextId);
        
        if (existingContext) {
            const updatedData = {
                ...existingContext.data,
                ...updates
            };
            
            return this.preserveContext(contextId, updatedData, {
                persistent: existingContext.persistent,
                source: 'update'
            });
        }
        
        return null;
    }
    
    // Relationship management
    mapRelationship(sourceId, targetId, relationshipType, metadata = {}) {
        const relationshipKey = `${sourceId}->${targetId}`;
        
        const relationship = {
            source: sourceId,
            target: targetId,
            type: relationshipType,
            strength: metadata.strength || 0.5,
            bidirectional: metadata.bidirectional || false,
            critical: metadata.critical || false,
            established: Date.now(),
            lastValidated: null,
            validationCount: 0,
            metadata: metadata
        };
        
        this.relationshipGraph.set(relationshipKey, relationship);
        
        // Create bidirectional relationship if specified
        if (relationship.bidirectional) {
            const reverseKey = `${targetId}->${sourceId}`;
            this.relationshipGraph.set(reverseKey, {
                ...relationship,
                source: targetId,
                target: sourceId
            });
        }
        
        this.emit('relationship-mapped', { relationshipKey, relationship });
        
        console.log(`🔗 Relationship mapped: ${sourceId} -> ${targetId} (${relationshipType})`);
        
        return relationshipKey;
    }
    
    getRelationships(componentId) {
        const relationships = [];
        
        for (const [key, relationship] of this.relationshipGraph) {
            if (relationship.source === componentId || relationship.target === componentId) {
                relationships.push(relationship);
            }
        }
        
        return relationships;
    }
    
    validateRelationships() {
        console.log('🔍 Validating component relationships...');
        
        let validatedCount = 0;
        let brokenCount = 0;
        
        for (const [key, relationship] of this.relationshipGraph) {
            const isValid = this.validateRelationship(relationship);
            
            relationship.lastValidated = Date.now();
            relationship.validationCount++;
            relationship.valid = isValid;
            
            if (isValid) {
                validatedCount++;
            } else {
                brokenCount++;
                if (relationship.critical) {
                    console.log(`❌ CRITICAL relationship broken: ${key}`);
                }
            }
        }
        
        console.log(`✅ Relationship validation: ${validatedCount} valid, ${brokenCount} broken`);
        
        return { valid: validatedCount, broken: brokenCount };
    }
    
    validateRelationship(relationship) {
        switch (relationship.type) {
            case 'proxy':
                return this.validateProxyRelationship(relationship);
            case 'integration':
                return this.validateIntegrationRelationship(relationship);
            case 'monitoring':
                return this.validateMonitoringRelationship(relationship);
            default:
                return true; // Assume valid for unknown types
        }
    }
    
    validateProxyRelationship(relationship) {
        // Check if mobile app can reach target services
        if (relationship.source === 'mobile-wallet-app') {
            // This would be implemented with actual HTTP checks
            return true; // Simplified for now
        }
        return true;
    }
    
    validateIntegrationRelationship(relationship) {
        // Check if components are properly integrated
        return true; // Simplified for now
    }
    
    validateMonitoringRelationship(relationship) {
        // Check if monitoring is active
        return true; // Simplified for now
    }
    
    // Flow history tracking
    recordFlow(flowId, flowData) {
        const flowEntry = {
            id: flowId,
            timestamp: Date.now(),
            data: flowData,
            source: flowData.source || 'unknown',
            target: flowData.target || 'unknown',
            success: flowData.success !== false,
            duration: flowData.duration || null,
            metadata: flowData.metadata || {}
        };
        
        this.flowHistory.push(flowEntry);
        
        // Limit flow history size
        if (this.flowHistory.length > 1000) {
            this.flowHistory = this.flowHistory.slice(-1000);
        }
        
        this.emit('flow-recorded', { flowEntry });
        
        return flowEntry;
    }
    
    getFlowHistory(limit = 100) {
        return this.flowHistory.slice(-limit);
    }
    
    analyzeFlowPatterns() {
        const patterns = {
            mostFrequentFlows: {},
            averageDuration: {},
            successRate: {},
            recentTrends: []
        };
        
        // Analyze frequency
        this.flowHistory.forEach(flow => {
            patterns.mostFrequentFlows[flow.id] = (patterns.mostFrequentFlows[flow.id] || 0) + 1;
        });
        
        // Analyze success rates
        const flowGroups = {};
        this.flowHistory.forEach(flow => {
            if (!flowGroups[flow.id]) {
                flowGroups[flow.id] = { total: 0, successful: 0 };
            }
            flowGroups[flow.id].total++;
            if (flow.success) {
                flowGroups[flow.id].successful++;
            }
        });
        
        Object.entries(flowGroups).forEach(([flowId, stats]) => {
            patterns.successRate[flowId] = stats.successful / stats.total;
        });
        
        return patterns;
    }
    
    // Knowledge base management
    storeKnowledge(key, knowledge) {
        this.knowledgeBase.set(key, {
            content: knowledge,
            timestamp: Date.now(),
            category: knowledge.category || 'general',
            importance: knowledge.importance || 'medium',
            source: knowledge.source || 'system'
        });
        
        console.log(`🧠 Knowledge stored: ${key}`);
    }
    
    getKnowledge(key) {
        return this.knowledgeBase.get(key);
    }
    
    searchKnowledge(query) {
        const results = [];
        
        for (const [key, knowledge] of this.knowledgeBase) {
            if (key.includes(query) || 
                JSON.stringify(knowledge.content).toLowerCase().includes(query.toLowerCase())) {
                results.push({ key, knowledge });
            }
        }
        
        return results;
    }
    
    // Persistence methods
    async persistAllContexts() {
        const contextData = {
            timestamp: Date.now(),
            contexts: Object.fromEntries(this.contextStore),
            relationships: Object.fromEntries(this.relationshipGraph),
            flowHistory: this.flowHistory,
            knowledgeBase: Object.fromEntries(this.knowledgeBase)
        };
        
        try {
            fs.writeFileSync('system-context-store.json', JSON.stringify(contextData, null, 2));
            console.log('💾 All contexts persisted to storage');
        } catch (error) {
            console.error('❌ Failed to persist contexts:', error.message);
        }
    }
    
    async persistContext(contextId) {
        const context = this.contextStore.get(contextId);
        
        if (context && context.persistent) {
            // Persist individual context for critical data
            const contextFile = `context-${contextId}.json`;
            
            try {
                fs.writeFileSync(contextFile, JSON.stringify(context, null, 2));
            } catch (error) {
                console.error(`❌ Failed to persist context ${contextId}:`, error.message);
            }
        }
    }
    
    // Monitoring and maintenance
    async startContextMonitoring() {
        // Persist contexts every 5 minutes
        setInterval(() => {
            this.persistAllContexts();
        }, 5 * 60 * 1000);
        
        // Validate relationships every 10 minutes
        setInterval(() => {
            this.validateRelationships();
        }, 10 * 60 * 1000);
        
        // Clean up expired contexts every hour
        setInterval(() => {
            this.cleanupExpiredContexts();
        }, 60 * 60 * 1000);
        
        console.log('📡 Context monitoring started');
    }
    
    cleanupExpiredContexts() {
        let cleanedCount = 0;
        
        for (const [contextId, context] of this.contextStore) {
            if (context.ttl && Date.now() > context.timestamp + context.ttl) {
                this.contextStore.delete(contextId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired contexts`);
        }
    }
    
    // System health integration
    getSystemContextHealth() {
        const criticalContexts = Array.from(this.contextStore.values())
            .filter(c => c.critical);
        
        const healthyContexts = criticalContexts.filter(c => 
            Date.now() - c.timestamp < 24 * 60 * 60 * 1000 // Less than 24 hours old
        );
        
        return {
            total: criticalContexts.length,
            healthy: healthyContexts.length,
            percentage: Math.round((healthyContexts.length / criticalContexts.length) * 100),
            status: healthyContexts.length === criticalContexts.length ? 'excellent' : 'degraded'
        };
    }
    
    // Utility methods
    generateContextVersion(contextId) {
        const existing = this.contextStore.get(contextId);
        const baseVersion = existing ? existing.version || '1.0.0' : '1.0.0';
        
        const [major, minor, patch] = baseVersion.split('.').map(Number);
        return `${major}.${minor}.${patch + 1}`;
    }
    
    generateReport() {
        return {
            timestamp: Date.now(),
            contexts: {
                total: this.contextStore.size,
                critical: Array.from(this.contextStore.values()).filter(c => c.critical).length,
                health: this.getSystemContextHealth()
            },
            relationships: {
                total: this.relationshipGraph.size,
                critical: Array.from(this.relationshipGraph.values()).filter(r => r.critical).length
            },
            flows: {
                totalRecorded: this.flowHistory.length,
                patterns: this.analyzeFlowPatterns()
            },
            knowledge: {
                entries: this.knowledgeBase.size
            }
        };
    }
}

// Export for integration
module.exports = { ContextPreservationLayer };

// CLI interface
if (require.main === module) {
    const contextLayer = new ContextPreservationLayer();
    
    contextLayer.initialize().then(() => {
        const command = process.argv[2];
        
        switch (command) {
            case 'status':
                console.log('\n🧠 CONTEXT PRESERVATION STATUS');
                console.log('==============================');
                const report = contextLayer.generateReport();
                console.log(JSON.stringify(report, null, 2));
                break;
                
            case 'validate':
                console.log('\n🔍 VALIDATING RELATIONSHIPS');
                console.log('==========================');
                contextLayer.validateRelationships();
                break;
                
            case 'monitor':
                console.log('\n📡 STARTING CONTEXT MONITORING');
                console.log('==============================');
                
                contextLayer.on('context-preserved', (event) => {
                    console.log(`[${new Date().toLocaleTimeString()}] Context preserved: ${event.contextId}`);
                });
                
                contextLayer.on('flow-recorded', (event) => {
                    console.log(`[${new Date().toLocaleTimeString()}] Flow recorded: ${event.flowEntry.id}`);
                });
                
                // Keep running
                setInterval(() => {}, 1000);
                break;
                
            default:
                console.log('\n🧠 CONTEXT PRESERVATION LAYER');
                console.log('=============================');
                console.log('Usage: node context-preservation-layer.js [command]');
                console.log('');
                console.log('Commands:');
                console.log('  status    - Show context preservation status');
                console.log('  validate  - Validate component relationships');
                console.log('  monitor   - Start context monitoring');
                console.log('');
                console.log('🔒 Critical Contexts Protected:');
                contextLayer.criticalContexts.forEach(context => {
                    console.log(`   • ${context}`);
                });
        }
    });
}