#!/usr/bin/env node

/**
 * ⛽🔌 GAS TANK CONNECTOR
 * 
 * Unified AI connector that combines:
 * - Gas tank key management (automatic key rotation)
 * - Model registry (correct model names)
 * - Real API connector (actual API calls)
 * 
 * This is the solution to "we have problems with our model selection and other shit nonstop"
 * Everything just works transparently - old model names, missing keys, etc.
 */

require('dotenv').config();

const RealAIAPIConnector = require('./real-ai-api-connector.js');
const { getRegistry } = require('./model-registry.js');
const EventEmitter = require('events');

class GasTankConnector extends RealAIAPIConnector {
    constructor(config = {}) {
        // Initialize parent with gas tank enabled
        super({
            enableGasTankFallback: true,
            enableTestingMode: true,
            ...config
        });
        
        // Initialize model registry
        this.modelRegistry = getRegistry();
        
        // Wait for registry to load
        this.registryReady = new Promise((resolve) => {
            if (this.modelRegistry.lastLoad) {
                resolve();
            } else {
                this.modelRegistry.once('loaded', resolve);
            }
        });
        
        console.log('⛽🔌 Gas Tank Connector initialized with model registry');
    }
    
    /**
     * Override callAPI to add model name resolution
     */
    async callAPI(service, model, prompt, options = {}) {
        // Wait for registry to be ready
        await this.registryReady;
        
        // Resolve model name using registry
        const resolvedModel = this.modelRegistry.getModelName(model, service);
        
        if (resolvedModel !== model) {
            console.log(`🔄 Model name resolved: ${model} → ${resolvedModel}`);
        }
        
        // Check if we need to update the service based on registry
        const modelInfo = this.modelRegistry.getModel(resolvedModel, service);
        if (modelInfo && modelInfo.provider && modelInfo.provider !== service) {
            console.log(`🔄 Service corrected: ${service} → ${modelInfo.provider}`);
            service = modelInfo.provider;
        }
        
        // Call parent implementation with resolved model
        return super.callAPI(service, resolvedModel, prompt, options);
    }
    
    /**
     * Enhanced model selection based on domain
     */
    async selectModelForDomain(domain, complexity = 'medium', preferLocal = true) {
        await this.registryReady;
        
        const modelConfig = this.modelRegistry.findBestModel(domain, complexity, preferLocal);
        
        console.log(`🎯 Selected model for ${domain} domain:`, modelConfig);
        
        return {
            service: modelConfig.provider,
            model: modelConfig.name,
            cost: modelConfig.cost || 0,
            tier: modelConfig.tier
        };
    }
    
    /**
     * Batch query with automatic model selection
     */
    async smartQuery(prompt, options = {}) {
        const {
            domain = 'general',
            complexity = 'medium',
            preferLocal = true,
            maxCost = null
        } = options;
        
        // Select best model for the task
        const { service, model, cost, tier } = await this.selectModelForDomain(
            domain,
            complexity,
            preferLocal
        );
        
        // Check cost constraints
        if (maxCost && cost > maxCost) {
            console.log(`💰 Model ${model} exceeds cost limit, finding cheaper alternative...`);
            const cheaper = await this.selectModelForDomain(domain, 'low', true);
            return this.callAPI(cheaper.service, cheaper.model, prompt, options);
        }
        
        console.log(`🚀 Smart query using ${service}/${model} (${tier} tier)`);
        
        return this.callAPI(service, model, prompt, options);
    }
    
    /**
     * Get available models with gas tank status
     */
    async getAvailableModels() {
        await this.registryReady;
        
        const status = {
            providers: {},
            gasTankStatus: {},
            totalModels: 0,
            availableModels: 0
        };
        
        // Check each provider
        for (const [providerName, provider] of this.modelRegistry.providers) {
            const hasKey = !!this.apiKeys[providerName];
            const models = this.modelRegistry.getProviderModels(providerName);
            
            status.providers[providerName] = {
                available: hasKey,
                keySource: hasKey ? 'configured' : 'missing',
                models: models.map(m => m.name),
                baseUrl: provider.baseUrl
            };
            
            status.totalModels += models.length;
            if (hasKey) {
                status.availableModels += models.length;
            }
            
            // Check gas tank status
            if (this.gasTank) {
                try {
                    const tankStatus = await this.gasTank.getTankStatus();
                    status.gasTankStatus = tankStatus;
                } catch (error) {
                    // Gas tank not available
                }
            }
        }
        
        return status;
    }
    
    /**
     * Test model name resolution
     */
    async testModelResolution() {
        await this.registryReady;
        
        const testCases = [
            { input: 'claude-3-haiku', expected: 'claude-3-haiku-20240307' },
            { input: 'gpt-4', expected: 'gpt-4-0613' },
            { input: 'claude-3-opus', expected: 'claude-3-opus-20240229' },
            { input: 'gemini', expected: 'gemini-pro' }
        ];
        
        console.log('\n🧪 Testing model name resolution:');
        
        for (const test of testCases) {
            const resolved = this.modelRegistry.getModelName(test.input);
            const passed = resolved === test.expected;
            console.log(`  ${passed ? '✅' : '❌'} ${test.input} → ${resolved} ${passed ? '' : `(expected ${test.expected})`}`);
        }
    }
    
    /**
     * Override to add support for more providers
     */
    buildRequest(service, model, prompt, options, modelConfig) {
        // Add support for Gemini
        if (service === 'gemini') {
            return {
                endpoint: `models/${model}:generateContent`,
                method: 'POST',
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: options.maxTokens || modelConfig.maxTokens
                    }
                })
            };
        }
        
        // Add support for Perplexity
        if (service === 'perplexity') {
            return {
                endpoint: 'chat/completions',
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: options.maxTokens || modelConfig.maxTokens,
                    temperature: options.temperature || 0.7
                })
            };
        }
        
        // Add support for Kimi
        if (service === 'kimi') {
            return {
                endpoint: 'chat/completions',
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: options.maxTokens || modelConfig.maxTokens,
                    temperature: options.temperature || 0.7
                })
            };
        }
        
        // Default to parent implementation
        return super.buildRequest(service, model, prompt, options, modelConfig);
    }
}

module.exports = GasTankConnector;

// CLI interface for testing
if (require.main === module) {
    async function test() {
        console.log('⛽🔌 Testing Gas Tank Connector\n');
        
        const connector = new GasTankConnector({
            enableGasTankFallback: true,
            enableTestingMode: true
        });
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test model resolution
        await connector.testModelResolution();
        
        // Show available models
        console.log('\n📊 Available Models:');
        const availability = await connector.getAvailableModels();
        console.log(JSON.stringify(availability, null, 2));
        
        // Test smart query
        console.log('\n🧪 Testing smart query...');
        try {
            const result = await connector.smartQuery('What is 2+2?', {
                domain: 'general',
                complexity: 'low',
                preferLocal: true
            });
            
            console.log('✅ Smart query successful!');
            console.log('Response:', result.response);
            console.log('Model used:', result.model);
            console.log('Service:', result.service);
        } catch (error) {
            console.error('❌ Smart query failed:', error.message);
        }
        
        // Test with old model name
        console.log('\n🧪 Testing with old model name (claude-3-haiku)...');
        try {
            const result = await connector.callAPI(
                'anthropic',
                'claude-3-haiku', // Old name - should auto-resolve
                'Say hello',
                { maxTokens: 50 }
            );
            
            console.log('✅ Old model name worked!');
            console.log('Response:', result.response);
        } catch (error) {
            console.error('❌ Old model name failed:', error.message);
        }
    }
    
    test().catch(console.error);
}