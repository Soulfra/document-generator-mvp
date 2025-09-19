#!/usr/bin/env node

/**
 * 🔗🤖 FORUM MULTI-LLM INTEGRATION
 * 
 * Integrates the Multi-LLM Engine with the existing Production Forum API Server
 * Replaces local RNG responses with real multi-hop AI responses
 */

const ForumMultiLLMEngine = require('./FORUM-MULTI-LLM-ENGINE');

class ForumMultiLLMIntegration {
    constructor(forumServer) {
        this.forumServer = forumServer;
        this.multiLLMEngine = null;
        this.initialized = false;
        this.stats = {
            multiLLMRequests: 0,
            fallbackRequests: 0,
            totalCost: 0,
            averageHops: 0
        };
        
        console.log('🔗🤖 FORUM MULTI-LLM INTEGRATION');
        console.log('=================================');
        console.log(`Integrating with Forum Server: ${forumServer.serverId}`);
    }
    
    /**
     * Initialize the Multi-LLM integration
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('🚀 Initializing Multi-LLM Engine...');
            
            // Initialize the Multi-LLM Engine
            this.multiLLMEngine = new ForumMultiLLMEngine({
                maxHops: process.env.MAX_HOPS || 8,
                costBudgetPerRequest: parseFloat(process.env.REQUEST_BUDGET_LIMIT) || 0.50,
                enableFallbacks: true,
                parallelMode: process.env.PARALLEL_MODE === 'true'
            });
            
            await this.multiLLMEngine.initialize();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Replace the forum server's reply enhancement method
            this.patchForumServer();
            
            this.initialized = true;
            console.log('✅ Multi-LLM Integration initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Multi-LLM Integration:', error.message);
            console.log('🔄 Forum will continue using local RNG responses');
            this.initialized = false;
        }
    }
    
    /**
     * Setup event listeners for the Multi-LLM Engine
     */
    setupEventListeners() {
        this.multiLLMEngine.on('chain:started', (chain) => {
            console.log(`🚀 Multi-LLM chain started: ${chain.id} (${chain.pattern})`);
            
            // Broadcast to forum clients
            this.forumServer.broadcastToClients({
                type: 'multi_llm_started',
                chainId: chain.id,
                pattern: chain.pattern,
                originalPost: chain.originalPost.content.substring(0, 100) + '...'
            });
        });
        
        this.multiLLMEngine.on('hop:completed', (data) => {
            const { chain, hop } = data;
            console.log(`  ✅ Hop ${hop.hopNumber} completed: ${hop.providerName} (${hop.duration}ms, $${hop.cost.toFixed(4)})`);
            
            // Broadcast hop completion
            this.forumServer.broadcastToClients({
                type: 'hop_completed',
                chainId: chain.id,
                hopNumber: hop.hopNumber,
                providerName: hop.providerName,
                duration: hop.duration,
                cost: hop.cost,
                totalHops: chain.pattern === 'simple' ? 3 : 
                          chain.pattern === 'standard' ? 5 : 
                          chain.pattern === 'legendary' ? 8 : 5
            });
        });
        
        this.multiLLMEngine.on('chain:completed', (chain) => {
            console.log(`🎉 Multi-LLM chain completed: ${chain.id} (${chain.duration}ms, $${chain.totalCost.toFixed(4)})`);
            
            // Update stats
            this.stats.multiLLMRequests++;
            this.stats.totalCost += chain.totalCost;
            this.stats.averageHops = ((this.stats.averageHops * (this.stats.multiLLMRequests - 1)) + chain.hops.length) / this.stats.multiLLMRequests;
            
            // Broadcast completion
            this.forumServer.broadcastToClients({
                type: 'chain_completed',
                chainId: chain.id,
                rarity: chain.metadata.rarity,
                cost: chain.totalCost,
                duration: chain.duration,
                hopsCompleted: chain.hops.length
            });
        });
        
        this.multiLLMEngine.on('chain:failed', (data) => {
            const { chain, error } = data;
            console.error(`💥 Multi-LLM chain failed: ${chain.id} - ${error.message}`);
            
            // Broadcast failure
            this.forumServer.broadcastToClients({
                type: 'chain_failed',
                chainId: chain.id,
                error: error.message,
                fallbackUsed: true
            });
        });
    }
    
    /**
     * Patch the forum server to use Multi-LLM responses
     */
    patchForumServer() {
        console.log('🔧 Patching forum server methods...');
        
        // Store original methods
        const originalEnhanceReplyWithRarity = this.forumServer.enhanceReplyWithRarity.bind(this.forumServer);
        const originalDetermineReplyRarity = this.forumServer.determineReplyRarity.bind(this.forumServer);
        
        // Replace with Multi-LLM version
        this.forumServer.enhanceReplyWithRarity = async (postData, rarity) => {
            if (!this.initialized || !this.multiLLMEngine) {
                console.log('⚠️  Multi-LLM not available, using fallback');
                this.stats.fallbackRequests++;
                return originalEnhanceReplyWithRarity(postData, rarity);
            }
            
            try {
                console.log('🤖 Processing with Multi-LLM Engine...');
                
                // Determine hop pattern based on rarity
                const pattern = this.selectPatternByRarity(rarity);
                
                // Process through Multi-LLM Engine
                const result = await this.multiLLMEngine.processForumPost(postData, {
                    pattern: pattern,
                    originalContent: postData.content
                });
                
                if (result.success) {
                    console.log(`✅ Multi-LLM processing successful: ${result.rarity} (${result.hops.length} hops)`);
                    
                    return {
                        content: result.response,
                        rarity: result.rarity,
                        multiLLM: true,
                        hops: result.hops,
                        cost: result.cost,
                        chainId: result.chainId
                    };
                } else {
                    throw new Error(result.error || 'Multi-LLM processing failed');
                }
                
            } catch (error) {
                console.error(`❌ Multi-LLM processing failed: ${error.message}`);
                console.log('🔄 Falling back to local RNG response...');
                
                this.stats.fallbackRequests++;
                return originalEnhanceReplyWithRarity(postData, rarity);
            }
        };
        
        // Enhance rarity determination to consider Multi-LLM results
        this.forumServer.determineReplyRarity = () => {
            if (!this.initialized) {
                return originalDetermineReplyRarity();
            }
            
            // Use original RNG to determine intended complexity level
            const originalRarity = originalDetermineReplyRarity();
            
            // Multi-LLM will determine final rarity based on actual result quality
            return originalRarity;
        };
        
        console.log('✅ Forum server patched successfully');
    }
    
    /**
     * Select hop pattern based on intended rarity
     */
    selectPatternByRarity(rarity) {
        switch (rarity) {
            case 'legendary':
                return Math.random() < 0.5 ? 'legendary' : 'quality_focused';
            case 'rare':
                return Math.random() < 0.5 ? 'standard' : 'cost_optimized';
            case 'normal':
            default:
                return 'simple';
        }
    }
    
    /**
     * Get integration statistics
     */
    getStats() {
        const engineStats = this.multiLLMEngine ? this.multiLLMEngine.getStats() : null;
        
        return {
            integration: {
                initialized: this.initialized,
                multiLLMRequests: this.stats.multiLLMRequests,
                fallbackRequests: this.stats.fallbackRequests,
                totalCost: this.stats.totalCost.toFixed(4),
                averageHops: this.stats.averageHops.toFixed(1),
                successRate: this.stats.multiLLMRequests > 0 ? 
                    ((this.stats.multiLLMRequests / (this.stats.multiLLMRequests + this.stats.fallbackRequests)) * 100).toFixed(1) + '%' : '0%'
            },
            engine: engineStats
        };
    }
    
    /**
     * Get available hop patterns
     */
    getHopPatterns() {
        return this.multiLLMEngine ? this.multiLLMEngine.getHopPatterns() : [];
    }
    
    /**
     * Get provider status
     */
    getProviders() {
        return this.multiLLMEngine ? this.multiLLMEngine.getProviders() : [];
    }
    
    /**
     * Force a specific pattern for testing
     */
    async testPattern(postData, patternName) {
        if (!this.initialized || !this.multiLLMEngine) {
            throw new Error('Multi-LLM Integration not initialized');
        }
        
        console.log(`🧪 Testing pattern: ${patternName}`);
        
        return await this.multiLLMEngine.processForumPost(postData, {
            pattern: patternName,
            originalContent: postData.content
        });
    }
    
    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Multi-LLM Integration...');
        
        if (this.multiLLMEngine) {
            // The engine doesn't have a shutdown method, but we can clean up
            this.multiLLMEngine.removeAllListeners();
        }
        
        this.initialized = false;
        console.log('✅ Multi-LLM Integration shutdown complete');
    }
}

module.exports = ForumMultiLLMIntegration;

// CLI interface for testing
if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'test':
            console.log('🧪 Testing Multi-LLM Integration...\n');
            
            // Mock forum server
            const mockForumServer = {
                serverId: 'mock-forum-server',
                broadcastToClients: (data) => {
                    console.log('📡 Broadcasting:', data.type);
                },
                enhanceReplyWithRarity: (content, rarity) => {
                    return {
                        content: `Mock ${rarity} reply to: ${content}`,
                        rarity: rarity
                    };
                },
                determineReplyRarity: () => {
                    const roll = Math.random();
                    return roll < 0.05 ? 'legendary' : roll < 0.25 ? 'rare' : 'normal';
                }
            };
            
            const integration = new ForumMultiLLMIntegration(mockForumServer);
            
            integration.initialize().then(async () => {
                if (!integration.initialized) {
                    console.log('❌ Integration failed to initialize');
                    process.exit(1);
                }
                
                const testPost = {
                    username: 'TestUser',
                    content: 'How can I optimize my React application for better performance?'
                };
                
                console.log('📝 Test post:', testPost.content);
                console.log('🔄 Processing with patched forum server...\n');
                
                try {
                    const result = await mockForumServer.enhanceReplyWithRarity(testPost, 'rare');
                    
                    console.log('\n📊 RESULT:');
                    console.log('==========');
                    console.log(`Rarity: ${result.rarity}`);
                    console.log(`Multi-LLM: ${result.multiLLM || false}`);
                    console.log(`Cost: $${result.cost?.toFixed(4) || '0.0000'}`);
                    console.log(`Hops: ${result.hops?.length || 0}`);
                    console.log(`Chain ID: ${result.chainId || 'N/A'}`);
                    console.log(`\nResponse:\n${result.content}`);
                    
                    if (result.hops) {
                        console.log('\n🔗 Hop Chain:');
                        result.hops.forEach(hop => {
                            console.log(`  ${hop.hopNumber}. ${hop.providerName} (${hop.duration}ms, $${hop.cost.toFixed(4)})`);
                        });
                    }
                    
                } catch (error) {
                    console.error('❌ Test failed:', error.message);
                }
                
            }).catch(console.error);
            break;
            
        case 'stats':
            console.log('📊 Integration Statistics:');
            console.log('=========================');
            // Would need actual integration instance
            console.log('Run this command after integration is running');
            break;
            
        default:
            console.log(`
🔗🤖 FORUM MULTI-LLM INTEGRATION

Usage:
  node FORUM-MULTI-LLM-INTEGRATION.js test   - Test integration
  node FORUM-MULTI-LLM-INTEGRATION.js stats  - Show statistics

Integration Features:
✨ Replaces local RNG responses with real multi-hop AI chains
✨ Maintains existing forum API compatibility
✨ Automatic fallback to local responses if Multi-LLM fails
✨ Real-time hop progress broadcasting
✨ Cost tracking and budget management
✨ Pattern selection based on intended rarity

The integration seamlessly upgrades your forum to use external
AI providers while maintaining all existing functionality.
            `);
    }
}