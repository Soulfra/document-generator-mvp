#!/usr/bin/env node

/**
 * 📚 CENTRAL MODEL REGISTRY
 * 
 * Single source of truth for all AI model configurations
 * - Loads model definitions from models.toml
 * - Provides model name aliasing for backward compatibility
 * - Tracks model capabilities and costs
 * - Manages provider configurations
 * 
 * This solves the "we have problems with our model selection and other shit nonstop" issue
 * by centralizing all model definitions and auto-correcting model names.
 */

const fs = require('fs').promises;
const path = require('path');
const toml = require('@iarna/toml');
const EventEmitter = require('events');

class ModelRegistry extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            configPath: config.configPath || path.join(__dirname, 'models.toml'),
            enableAliases: config.enableAliases !== false,
            enableCaching: config.enableCaching !== false,
            cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
            ...config
        };
        
        // Model data storage
        this.models = new Map();
        this.providers = new Map();
        this.domains = new Map();
        this.aliases = new Map();
        this.characters = new Map();
        
        // Cache for model lookups
        this.cache = new Map();
        this.lastLoad = null;
        
        console.log('📚 Central Model Registry initializing...');
        this.loadConfiguration();
    }
    
    /**
     * Load configuration from models.toml
     */
    async loadConfiguration() {
        try {
            const configContent = await fs.readFile(this.config.configPath, 'utf8');
            const config = toml.parse(configContent);
            
            // Load model aliases first
            if (config.model_aliases && this.config.enableAliases) {
                this.loadAliases(config.model_aliases);
            }
            
            // Load provider configurations
            if (config.deployment && config.deployment.cloud_apis) {
                this.loadProviders(config.deployment.cloud_apis);
            }
            
            // Load domain configurations
            if (config.domains) {
                this.loadDomains(config.domains);
            }
            
            // Load character definitions
            if (config.characters) {
                this.loadCharacters(config.characters);
            }
            
            // Load registry models
            if (config.registry && config.registry.models) {
                this.loadRegistryModels(config.registry.models);
            }
            
            this.lastLoad = Date.now();
            console.log(`✅ Model Registry loaded: ${this.models.size} models, ${this.aliases.size} aliases`);
            
            this.emit('loaded', {
                models: this.models.size,
                providers: this.providers.size,
                domains: this.domains.size,
                aliases: this.aliases.size
            });
            
        } catch (error) {
            console.error('❌ Failed to load model registry:', error.message);
            this.emit('error', error);
        }
    }
    
    /**
     * Load model aliases for backward compatibility
     */
    loadAliases(aliasConfig) {
        for (const [alias, actualModel] of Object.entries(aliasConfig)) {
            this.aliases.set(alias.toLowerCase(), actualModel);
        }
        console.log(`📝 Loaded ${this.aliases.size} model aliases`);
    }
    
    /**
     * Load provider configurations
     */
    loadProviders(providersConfig) {
        for (const [providerName, config] of Object.entries(providersConfig)) {
            const provider = {
                name: providerName,
                baseUrl: config.base_url,
                models: config.models || [],
                rateLimits: config.rate_limits || {},
                headers: this.getProviderHeaders(providerName)
            };
            
            this.providers.set(providerName, provider);
            
            // Register each model under this provider
            for (const modelName of provider.models) {
                this.registerModel(modelName, providerName);
            }
        }
    }
    
    /**
     * Load domain configurations
     */
    loadDomains(domainsConfig) {
        for (const [domainName, config] of Object.entries(domainsConfig)) {
            const domain = {
                name: domainName,
                description: config.description,
                keywords: config.keywords || [],
                character: config.character,
                primaryModels: config.primary_models || [],
                fallbackModels: config.fallback_models || [],
                complexityThreshold: config.complexity_threshold
            };
            
            this.domains.set(domainName, domain);
        }
    }
    
    /**
     * Load character definitions
     */
    loadCharacters(charactersConfig) {
        for (const [characterId, config] of Object.entries(charactersConfig)) {
            this.characters.set(characterId, {
                id: characterId,
                displayName: config.display_name,
                personality: config.personality,
                catchphrase: config.catchphrase,
                avatar: config.avatar,
                traits: config.traits || [],
                speakingStyle: config.speaking_style,
                backstory: config.backstory
            });
        }
    }
    
    /**
     * Load registry models
     */
    loadRegistryModels(modelsConfig) {
        for (const [modelId, config] of Object.entries(modelsConfig)) {
            const model = {
                id: modelId,
                description: config.description,
                size: config.size,
                quantization: config.quantization,
                capabilities: config.capabilities || [],
                lastUpdated: config.last_updated,
                checksum: config.checksum
            };
            
            // Store under the model ID
            this.models.set(modelId, model);
        }
    }
    
    /**
     * Register a model with its provider
     */
    registerModel(modelName, providerName) {
        const existingModel = this.models.get(modelName) || {};
        this.models.set(modelName, {
            ...existingModel,
            name: modelName,
            provider: providerName,
            fullName: `${providerName}/${modelName}`
        });
    }
    
    /**
     * Get the correct model name (resolves aliases)
     */
    getModelName(modelInput, provider = null) {
        const key = modelInput?.toLowerCase() || '';
        
        // Check cache first
        const cacheKey = `${provider || 'any'}:${key}`;
        if (this.config.enableCaching && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.value;
            }
        }
        
        let resolvedName = modelInput;
        
        // Check if it's an alias
        if (this.aliases.has(key)) {
            resolvedName = this.aliases.get(key);
            console.log(`🔄 Resolved alias: ${modelInput} → ${resolvedName}`);
        }
        
        // Verify model exists
        if (!this.models.has(resolvedName)) {
            // Try with provider prefix
            if (provider) {
                const withProvider = `${provider}/${resolvedName}`;
                if (this.models.has(withProvider)) {
                    resolvedName = withProvider;
                }
            }
        }
        
        // Cache the result
        if (this.config.enableCaching) {
            this.cache.set(cacheKey, {
                value: resolvedName,
                timestamp: Date.now()
            });
        }
        
        return resolvedName;
    }
    
    /**
     * Get model information
     */
    getModel(modelName, provider = null) {
        const resolvedName = this.getModelName(modelName, provider);
        
        // Try direct lookup
        if (this.models.has(resolvedName)) {
            return this.models.get(resolvedName);
        }
        
        // Try to find in provider models
        if (provider && this.providers.has(provider)) {
            const providerConfig = this.providers.get(provider);
            if (providerConfig.models.includes(resolvedName)) {
                return {
                    name: resolvedName,
                    provider: provider,
                    fullName: `${provider}/${resolvedName}`
                };
            }
        }
        
        return null;
    }
    
    /**
     * Get provider configuration
     */
    getProvider(providerName) {
        return this.providers.get(providerName);
    }
    
    /**
     * Get all models for a provider
     */
    getProviderModels(providerName) {
        const provider = this.providers.get(providerName);
        if (!provider) return [];
        
        return provider.models.map(modelName => ({
            name: modelName,
            provider: providerName,
            fullName: `${providerName}/${modelName}`,
            ...(this.models.get(modelName) || {})
        }));
    }
    
    /**
     * Get domain configuration
     */
    getDomain(domainName) {
        return this.domains.get(domainName);
    }
    
    /**
     * Get character configuration
     */
    getCharacter(characterId) {
        return this.characters.get(characterId);
    }
    
    /**
     * Find best model for a domain and complexity
     */
    findBestModel(domain, complexity = 'medium', preferLocal = true) {
        const domainConfig = this.domains.get(domain);
        if (!domainConfig) {
            // Default to general domain
            return this.findBestModel('general', complexity, preferLocal);
        }
        
        // Check primary models first
        for (const modelConfig of domainConfig.primaryModels) {
            const provider = this.providers.get(modelConfig.provider);
            if (!provider) continue;
            
            // Skip cloud models if preferLocal is true
            if (preferLocal && modelConfig.provider !== 'ollama') continue;
            
            // Check if model is available
            const model = this.getModel(modelConfig.name, modelConfig.provider);
            if (model) {
                return {
                    ...model,
                    ...modelConfig,
                    domain: domain,
                    tier: 'primary'
                };
            }
        }
        
        // Try fallback models
        for (const modelConfig of domainConfig.fallbackModels) {
            const model = this.getModel(modelConfig.name, modelConfig.provider);
            if (model) {
                return {
                    ...model,
                    ...modelConfig,
                    domain: domain,
                    tier: 'fallback'
                };
            }
        }
        
        // Ultimate fallback
        return {
            name: 'mistral:7b',
            provider: 'ollama',
            fullName: 'ollama/mistral:7b',
            domain: domain,
            tier: 'emergency'
        };
    }
    
    /**
     * Get provider headers configuration
     */
    getProviderHeaders(provider) {
        switch (provider) {
            case 'anthropic':
                return {
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                };
            case 'openai':
            case 'deepseek':
            case 'perplexity':
            case 'kimi':
                return {
                    'Content-Type': 'application/json'
                };
            case 'gemini':
                return {
                    'Content-Type': 'application/json'
                };
            default:
                return {
                    'Content-Type': 'application/json'
                };
        }
    }
    
    /**
     * Reload configuration
     */
    async reload() {
        console.log('🔄 Reloading model registry...');
        this.models.clear();
        this.providers.clear();
        this.domains.clear();
        this.aliases.clear();
        this.characters.clear();
        this.cache.clear();
        
        await this.loadConfiguration();
    }
    
    /**
     * Get registry status
     */
    getStatus() {
        return {
            loaded: !!this.lastLoad,
            lastLoad: this.lastLoad ? new Date(this.lastLoad) : null,
            counts: {
                models: this.models.size,
                providers: this.providers.size,
                domains: this.domains.size,
                aliases: this.aliases.size,
                characters: this.characters.size,
                cached: this.cache.size
            },
            providers: Array.from(this.providers.keys()),
            domains: Array.from(this.domains.keys())
        };
    }
}

// Export singleton instance
let registryInstance = null;

function getRegistry(config = {}) {
    if (!registryInstance) {
        registryInstance = new ModelRegistry(config);
    }
    return registryInstance;
}

module.exports = {
    ModelRegistry,
    getRegistry
};

// CLI testing
if (require.main === module) {
    const registry = getRegistry();
    
    setTimeout(() => {
        console.log('\n📊 Registry Status:', JSON.stringify(registry.getStatus(), null, 2));
        
        // Test alias resolution
        console.log('\n🔍 Testing alias resolution:');
        console.log('claude-3-haiku →', registry.getModelName('claude-3-haiku'));
        console.log('gpt-4 →', registry.getModelName('gpt-4'));
        console.log('claude-3-opus →', registry.getModelName('claude-3-opus'));
        
        // Test domain model selection
        console.log('\n🎯 Testing domain model selection:');
        console.log('Maritime domain:', registry.findBestModel('maritime', 'high', false));
        console.log('Trading domain:', registry.findBestModel('trading', 'low', true));
        
        // Test provider lookup
        console.log('\n🔌 Testing provider lookup:');
        console.log('Anthropic:', registry.getProvider('anthropic'));
        
    }, 1000);
}