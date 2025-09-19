#!/usr/bin/env node

/**
 * 🌐 UNIVERSAL AI ADAPTER
 * 
 * The final solution to "we have problems with our model selection and other shit nonstop"
 * 
 * A single, unified interface for ALL AI API calls that:
 * - Uses gas tank key management (automatic fallback)
 * - Uses model registry (correct model names)
 * - Handles all providers (Anthropic, OpenAI, DeepSeek, Gemini, etc.)
 * - Provides smart routing based on task type
 * - Tracks costs and usage
 * - Caches responses
 * - Handles errors gracefully
 * 
 * Usage:
 * const ai = require('./universal-ai-adapter.js');
 * const response = await ai.query('What is 2+2?');
 * const response = await ai.query('Write code', { provider: 'anthropic', model: 'claude-3-haiku' });
 */

const GasTankConnector = require('./gas-tank-connector.js');
const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;

class UniversalAIAdapter extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableCache: config.enableCache !== false,
            cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
            enableCostTracking: config.enableCostTracking !== false,
            maxRequestCost: config.maxRequestCost || 1.0,
            preferLocal: config.preferLocal !== false,
            enableSmartRouting: config.enableSmartRouting !== false,
            ...config
        };
        
        // Initialize gas tank connector (handles keys + models)
        this.connector = new GasTankConnector({
            enableGasTankFallback: true,
            enableTestingMode: true
        });
        
        // Response cache
        this.cache = new Map();
        
        // Cost tracking
        this.costTracker = {
            total: 0,
            byProvider: new Map(),
            byModel: new Map(),
            byDomain: new Map()
        };
        
        // Domain mappings for smart routing
        this.domainMappings = {
            code: { providers: ['anthropic', 'deepseek', 'openai'], preferredModel: 'claude-3-opus' },
            general: { providers: ['anthropic', 'openai', 'gemini'], preferredModel: 'claude-3-haiku' },
            analysis: { providers: ['anthropic', 'openai'], preferredModel: 'gpt-4' },
            creative: { providers: ['openai', 'anthropic'], preferredModel: 'gpt-4' },
            chat: { providers: ['anthropic', 'openai', 'gemini'], preferredModel: 'claude-3-haiku' },
            translation: { providers: ['deepseek', 'openai'], preferredModel: 'deepseek-chat' },
            math: { providers: ['anthropic', 'openai'], preferredModel: 'gpt-4' },
            research: { providers: ['perplexity', 'anthropic'], preferredModel: 'perplexity-70b' }
        };
        
        console.log('🌐 Universal AI Adapter initialized');
    }
    
    /**
     * Main query method - the single interface for all AI calls
     */
    async query(prompt, options = {}) {
        const {
            provider = null,
            model = null,
            domain = 'general',
            maxTokens = 2048,
            temperature = 0.7,
            useCache = this.config.enableCache,
            stream = false
        } = options;
        
        // Check cache first
        if (useCache) {
            const cached = this.getCached(prompt, provider, model);
            if (cached) {
                console.log('💾 Returning cached response');
                return cached;
            }
        }
        
        // Smart routing if no provider specified
        let selectedProvider = provider;
        let selectedModel = model;
        
        if (!selectedProvider || !selectedModel) {
            const route = await this.smartRoute(prompt, domain);
            selectedProvider = selectedProvider || route.provider;
            selectedModel = selectedModel || route.model;
        }
        
        console.log(`🎯 Routing to ${selectedProvider}/${selectedModel}`);
        
        try {
            // Make the API call through gas tank connector
            const result = await this.connector.callAPI(
                selectedProvider,
                selectedModel,
                prompt,
                {
                    maxTokens,
                    temperature,
                    stream
                }
            );
            
            // Track costs
            if (this.config.enableCostTracking && result.cost) {
                this.trackCost(selectedProvider, selectedModel, result.cost);
            }
            
            // Cache the response
            if (useCache && !stream) {
                this.cacheResponse(prompt, selectedProvider, selectedModel, result);
            }
            
            // Emit usage event
            this.emit('query_complete', {
                provider: selectedProvider,
                model: selectedModel,
                tokensUsed: result.tokensUsed,
                cost: result.cost,
                cached: false
            });
            
            return result;
            
        } catch (error) {
            console.error(`❌ Query failed: ${error.message}`);
            
            // Try fallback providers
            if (this.config.enableSmartRouting) {
                return this.tryFallbacks(prompt, domain, options, selectedProvider);
            }
            
            throw error;
        }
    }
    
    /**
     * Smart routing based on prompt analysis and domain
     */
    async smartRoute(prompt, domain) {
        const domainConfig = this.domainMappings[domain] || this.domainMappings.general;
        
        // Analyze prompt for better routing
        const promptLower = prompt.toLowerCase();
        
        // Code detection
        if (promptLower.includes('code') || promptLower.includes('function') || 
            promptLower.includes('implement') || promptLower.includes('debug')) {
            domain = 'code';
        }
        
        // Get available models
        const availability = await this.connector.getAvailableModels();
        
        // Find best available provider from domain preferences
        for (const provider of domainConfig.providers) {
            if (availability.providers[provider]?.available) {
                const models = availability.providers[provider].models;
                
                // Try to find preferred model
                const preferredModel = this.findModel(models, domainConfig.preferredModel);
                if (preferredModel) {
                    return { provider, model: preferredModel };
                }
                
                // Use first available model
                if (models.length > 0) {
                    return { provider, model: models[0] };
                }
            }
        }
        
        // Fallback to any available provider
        for (const [provider, info] of Object.entries(availability.providers)) {
            if (info.available && info.models.length > 0) {
                return { provider, model: info.models[0] };
            }
        }
        
        throw new Error('No available AI providers');
    }
    
    /**
     * Find a model by name or partial match
     */
    findModel(models, preferred) {
        // Exact match
        if (models.includes(preferred)) {
            return preferred;
        }
        
        // Partial match
        const partial = models.find(m => m.includes(preferred) || preferred.includes(m));
        if (partial) {
            return partial;
        }
        
        // Model type match (opus, sonnet, haiku)
        const typeMatch = models.find(m => {
            const preferredType = preferred.split('-').pop();
            return m.includes(preferredType);
        });
        
        return typeMatch || null;
    }
    
    /**
     * Try fallback providers when primary fails
     */
    async tryFallbacks(prompt, domain, options, failedProvider) {
        console.log(`🔄 Trying fallback providers after ${failedProvider} failed`);
        
        const domainConfig = this.domainMappings[domain] || this.domainMappings.general;
        const providers = domainConfig.providers.filter(p => p !== failedProvider);
        
        for (const provider of providers) {
            try {
                console.log(`🔄 Trying ${provider}...`);
                const route = await this.smartRoute(prompt, domain);
                
                if (route.provider === failedProvider) {
                    continue; // Skip the failed provider
                }
                
                return await this.query(prompt, {
                    ...options,
                    provider: route.provider,
                    model: route.model,
                    useCache: false // Don't cache fallback attempts
                });
                
            } catch (error) {
                console.log(`❌ ${provider} also failed: ${error.message}`);
                continue;
            }
        }
        
        throw new Error('All providers failed');
    }
    
    /**
     * Cache management
     */
    getCached(prompt, provider, model) {
        const key = this.getCacheKey(prompt, provider, model);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
            return {
                ...cached.result,
                cached: true
            };
        }
        
        return null;
    }
    
    cacheResponse(prompt, provider, model, result) {
        const key = this.getCacheKey(prompt, provider, model);
        this.cache.set(key, {
            result,
            timestamp: Date.now()
        });
        
        // Cleanup old cache entries
        if (this.cache.size > 1000) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }
    
    getCacheKey(prompt, provider, model) {
        const hash = crypto.createHash('sha256')
            .update(`${provider}:${model}:${prompt}`)
            .digest('hex')
            .substring(0, 16);
        return hash;
    }
    
    /**
     * Cost tracking
     */
    trackCost(provider, model, cost) {
        this.costTracker.total += cost;
        
        // By provider
        const providerCost = this.costTracker.byProvider.get(provider) || 0;
        this.costTracker.byProvider.set(provider, providerCost + cost);
        
        // By model
        const modelCost = this.costTracker.byModel.get(model) || 0;
        this.costTracker.byModel.set(model, modelCost + cost);
        
        // Check cost limits
        if (cost > this.config.maxRequestCost) {
            console.warn(`⚠️ High cost query: $${cost.toFixed(4)} for ${provider}/${model}`);
        }
    }
    
    /**
     * Get current status
     */
    async getStatus() {
        const availability = await this.connector.getAvailableModels();
        
        return {
            available: availability.availableModels > 0,
            providers: availability.providers,
            gasTankStatus: availability.gasTankStatus,
            costTracking: {
                total: this.costTracker.total,
                byProvider: Object.fromEntries(this.costTracker.byProvider),
                byModel: Object.fromEntries(this.costTracker.byModel)
            },
            cache: {
                entries: this.cache.size,
                timeout: this.config.cacheTimeout
            }
        };
    }
    
    /**
     * Convenience methods for specific use cases
     */
    async code(prompt, options = {}) {
        return this.query(prompt, { ...options, domain: 'code' });
    }
    
    async chat(prompt, options = {}) {
        return this.query(prompt, { ...options, domain: 'chat' });
    }
    
    async analyze(prompt, options = {}) {
        return this.query(prompt, { ...options, domain: 'analysis' });
    }
    
    async creative(prompt, options = {}) {
        return this.query(prompt, { ...options, domain: 'creative' });
    }
    
    async research(prompt, options = {}) {
        return this.query(prompt, { ...options, domain: 'research' });
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('💾 Cache cleared');
    }
    
    /**
     * Reset cost tracking
     */
    resetCosts() {
        this.costTracker.total = 0;
        this.costTracker.byProvider.clear();
        this.costTracker.byModel.clear();
        this.costTracker.byDomain.clear();
        console.log('💰 Cost tracking reset');
    }
}

// Export singleton instance by default
let instance = null;

function getAdapter(config = {}) {
    if (!instance) {
        instance = new UniversalAIAdapter(config);
    }
    return instance;
}

module.exports = getAdapter();
module.exports.UniversalAIAdapter = UniversalAIAdapter;
module.exports.getAdapter = getAdapter;

// CLI testing
if (require.main === module) {
    async function test() {
        console.log('\n🧪 Testing Universal AI Adapter\n');
        
        const ai = getAdapter();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show status
        console.log('📊 System Status:');
        const status = await ai.getStatus();
        console.log(JSON.stringify(status, null, 2));
        
        // Test queries
        const tests = [
            { prompt: 'What is 2+2?', domain: 'math' },
            { prompt: 'Write a hello world function', domain: 'code' },
            { prompt: 'Tell me a joke', domain: 'creative' },
            { prompt: 'Explain quantum computing', domain: 'analysis' }
        ];
        
        console.log('\n🧪 Running test queries:\n');
        
        for (const test of tests) {
            try {
                console.log(`📝 Query: "${test.prompt}" (domain: ${test.domain})`);
                const result = await ai.query(test.prompt, { domain: test.domain });
                console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
                console.log(`📊 Model: ${result.model}, Cost: $${(result.cost || 0).toFixed(4)}\n`);
            } catch (error) {
                console.error(`❌ Failed: ${error.message}\n`);
            }
        }
        
        // Show cost summary
        console.log('💰 Cost Summary:');
        console.log(`Total: $${ai.costTracker.total.toFixed(4)}`);
        console.log('By Provider:', Object.fromEntries(ai.costTracker.byProvider));
    }
    
    test().catch(console.error);
}