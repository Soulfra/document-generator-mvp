#!/usr/bin/env node

/**
 * 🧠 CAL AI MODEL ROUTER - DOMAIN-BASED CHARACTER SYSTEM
 * 
 * Revolutionary AI routing system that provides character abstraction over optimal model selection
 * - Character personalities as user-facing brand layer (Ship Cal, Trade Cal, etc.)
 * - Domain-based optimal model selection behind the scenes (Claude for ships, DeepSeek for trading)
 * - Training data collection from user interactions with characters
 * - Smart cost optimization with local/cloud model routing
 * - Business model: Users think they're training "characters" but actually improve domain models
 */

const EventEmitter = require('events');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const toml = require('@iarna/toml');
const path = require('path');
const GasTankConnector = require('./gas-tank-connector.js');

class CalAIModelRouter extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = null;
        this.loadConfigFromToml();
        
        // Initialize Gas Tank Connector for transparent key management
        this.gasTankConnector = new GasTankConnector({
            enableGasTankFallback: true,
            enableTestingMode: true
        });
        
        // API clients with new architecture
        this.clients = {
            ollama: {
                baseUrl: process.env.SHARED_OLLAMA_URL || 'http://localhost:11434'
            },
            anthropic: {
                baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
                apiKey: process.env.ANTHROPIC_API_KEY
            },
            openai: {
                baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
                apiKey: process.env.OPENAI_API_KEY
            },
            deepseek: {
                baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
                apiKey: process.env.DEEPSEEK_API_KEY
            }
        };
        
        // Character definitions (user-facing brand layer)
        this.characters = new Map();
        
        // Domain definitions (backend model selection)
        this.domains = new Map();
        
        // Cost tracking system
        this.costTracker = {
            daily: 0,
            total: 0,
            maxDaily: parseFloat(process.env.MAX_DAILY_COST) || 100.0,
            maxRequest: parseFloat(process.env.MAX_REQUEST_COST) || 5.0,
            byModel: new Map(),
            byDomain: new Map(),
            byCharacter: new Map()
        };
        
        // Training data collection system
        this.trainingDataCollector = {
            enabled: process.env.ENABLE_TRAINING_DATA_COLLECTION === 'true',
            collectionRate: 1.0,
            anonymizeUsers: process.env.ANONYMIZE_USER_DATA === 'true',
            interactions: [],
            domainData: new Map()
        };
        
        // Model performance tracking
        this.performanceTracker = {
            modelUsage: new Map(),
            responseTime: new Map(),
            successRate: new Map(),
            domainPerformance: new Map(),
            characterSatisfaction: new Map()
        };
        
        // Model availability cache
        this.modelAvailability = {
            ollama: { available: false, models: [] },
            anthropic: { available: !!this.clients.anthropic.apiKey },
            openai: { available: !!this.clients.openai.apiKey },
            deepseek: { available: !!this.clients.deepseek.apiKey }
        };
        
        // Performance tracking
        this.performanceMetrics = {
            modelUsage: {},
            totalTokens: 0,
            totalCost: 0,
            responseTime: {},
            errorRates: {}
        };
        
        // Response cache
        this.responseCache = new Map();
        
        // Fine-tuned models storage
        this.fineTunedModels = new Map();
        
        console.log('🧠 Cal AI Domain-Based Character Router initialized');
        
        // Initialize after constructor completes
        setImmediate(() => this.initialize());
    }
    
    async loadConfigFromToml() {
        try {
            const configPath = process.env.MODELS_CONFIG_PATH || './models.toml';
            const configContent = await fs.readFile(configPath, 'utf8');
            this.config = toml.parse(configContent);
            
            // Load characters from config
            if (this.config.characters) {
                for (const [charId, charConfig] of Object.entries(this.config.characters)) {
                    this.characters.set(charId, charConfig);
                }
            }
            
            // Load domains from config
            if (this.config.domains) {
                for (const [domainId, domainConfig] of Object.entries(this.config.domains)) {
                    this.domains.set(domainId, domainConfig);
                }
            }
            
            // Initialize model registry from config
            this.modelRegistry = {
                ollama: { available: false, models: {} },
                anthropic: { available: !!this.clients.anthropic.apiKey, models: {} },
                openai: { available: !!this.clients.openai.apiKey, models: {} },
                deepseek: { available: !!this.clients.deepseek.apiKey, models: {} }
            };
            
            // Load model definitions from config
            if (this.config.deployment && this.config.deployment.cloud_apis) {
                for (const [provider, providerConfig] of Object.entries(this.config.deployment.cloud_apis)) {
                    if (this.modelRegistry[provider] && providerConfig.models) {
                        for (const modelName of providerConfig.models) {
                            this.modelRegistry[provider].models[modelName] = {
                                name: modelName,
                                provider: provider,
                                cost: 0.01 // Default cost
                            };
                        }
                    }
                }
            }
            
            console.log(`✅ Loaded config with ${this.characters.size} characters and ${this.domains.size} domains`);
            
        } catch (error) {
            console.warn('⚠️ Could not load models.toml, using defaults:', error.message);
            this.loadDefaultConfiguration();
        }
    }
    
    loadDefaultConfiguration() {
        // Initialize default model registry
        this.modelRegistry = {
            ollama: { available: false, models: {} },
            anthropic: { available: !!this.clients.anthropic.apiKey, models: {} },
            openai: { available: !!this.clients.openai.apiKey, models: {} },
            deepseek: { available: !!this.clients.deepseek.apiKey, models: {} }
        };
        
        // Fallback character definitions
        this.characters.set('cal-master', {
            display_name: 'Cal Master',
            personality: 'analytical and strategic',
            catchphrase: 'Together, we are greater than the sum of our parts!',
            traits: ['analytical', 'strategic', 'helpful'],
            speaking_style: 'professional yet approachable'
        });
        
        this.characters.set('ship-cal', {
            display_name: 'Ship Cal',
            personality: 'nautical and tactical',
            catchphrase: 'Set sail for success, matey!',
            traits: ['nautical', 'tactical', 'creative'],
            speaking_style: 'nautical terminology, tactical thinking'
        });
        
        // Default domain mappings
        this.domains.set('general', {
            name: 'General Coordination',
            character: 'cal-master',
            primary_models: [
                { name: 'mistral:7b', provider: 'ollama', cost: 0.0 }
            ]
        });
        
        this.domains.set('maritime', {
            name: 'Maritime Operations',
            character: 'ship-cal',
            primary_models: [
                { name: 'claude-3-opus-20240229', provider: 'anthropic', cost: 0.015 },
                { name: 'codellama:7b', provider: 'ollama', cost: 0.0 }
            ]
        });
    }
    
    async initialize() {
        // Test Ollama connection
        await this.testOllamaConnection();
        
        // Load any fine-tuned models
        await this.loadFineTunedModels();
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        this.emit('router_ready');
    }
    
    async testOllamaConnection() {
        try {
            const ollamaUrl = this.config?.ollamaUrl || this.clients.ollama.baseUrl || 'http://localhost:11434';
            const response = await axios.get(`${ollamaUrl}/api/tags`);
            const models = response.data.models || [];
            
            console.log(`✅ Ollama connected with ${models.length} models`);
            
            // Update available models
            models.forEach(model => {
                const modelName = model.name.split(':')[0];
                if (!this.modelRegistry.ollama.models[modelName]) {
                    this.modelRegistry.ollama.models[modelName] = {
                        capabilities: ['custom'],
                        contextLength: 4096,
                        speed: 'medium',
                        cost: 0
                    };
                }
            });
            
            this.modelRegistry.ollama.available = true;
            
        } catch (error) {
            console.warn('⚠️ Ollama not available:', error.message);
            this.modelRegistry.ollama.available = false;
        }
    }
    
    async routeCharacterQuery(characterId, query, context = {}) {
        const startTime = Date.now();
        
        // Step 1: Get character definition (user-facing brand layer)
        const character = this.characters.get(characterId) || this.characters.get('cal-master');
        
        // Step 2: Analyze query to determine domain
        const detectedDomain = this.analyzeDomain(query, context);
        
        // Step 3: Get domain configuration for optimal model selection
        const domain = this.domains.get(detectedDomain) || this.domains.get('general');
        
        console.log(`🎭 Character: ${character.display_name} | 🎯 Domain: ${domain.name}`);
        
        // Step 4: Check cache
        const cacheKey = this.getCacheKey(characterId, detectedDomain, query);
        if (this.responseCache.has(cacheKey)) {
            const cached = this.responseCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                return this.applyCharacterStyling(cached.response, character, true);
            }
        }
        
        // Step 5: Select optimal model for domain
        const selectedModel = await this.selectOptimalModel(domain, query, context);
        
        // Step 6: Check cost limits
        if (selectedModel.cost > 0) {
            const estimatedCost = this.estimateQueryCost(query, selectedModel);
            if (estimatedCost > this.costTracker.maxRequest) {
                console.log(`💰 Cost too high (${estimatedCost}), switching to free model`);
                const freeModel = this.getFreeModelForDomain(domain);
                if (freeModel) selectedModel = freeModel;
            }
        }
        
        // Step 7: Execute query
        let response;
        try {
            response = await this.executeModelQuery(selectedModel, query, context, domain);
            
            // Step 8: Apply character styling to response
            response = this.applyCharacterStyling(response, character);
            
            // Step 9: Collect training data
            await this.collectTrainingData(characterId, detectedDomain, query, response, context);
            
            // Step 10: Update metrics and costs
            this.updatePerformanceMetrics(selectedModel, response, Date.now() - startTime, domain, character);
            
            // Step 11: Cache successful response
            this.responseCache.set(cacheKey, {
                response: response,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error(`❌ Model ${selectedModel.model} failed:`, error.message);
            
            // Try fallback models from domain configuration
            response = await this.tryDomainFallbacks(domain, query, context, character, selectedModel);
        }
        
        return response;
    }
    
    analyzeDomain(query, context) {
        const lowerQuery = query.toLowerCase();
        
        // Score each domain based on keyword matching
        let domainScores = new Map();
        
        for (const [domainId, domainConfig] of this.domains.entries()) {
            let score = 0;
            
            // Check against domain keywords
            if (domainConfig.keywords) {
                for (const keyword of domainConfig.keywords) {
                    if (lowerQuery.includes(keyword.toLowerCase())) {
                        score += 1;
                    }
                }
            }
            
            domainScores.set(domainId, score);
        }
        
        // Find highest scoring domain
        let bestDomain = 'general';
        let bestScore = 0;
        
        for (const [domainId, score] of domainScores.entries()) {
            if (score > bestScore) {
                bestScore = score;
                bestDomain = domainId;
            }
        }
        
        // If no keywords match, try semantic analysis for common patterns
        if (bestScore === 0) {
            if (lowerQuery.includes('ship') || lowerQuery.includes('fleet') || lowerQuery.includes('3d')) {
                return 'maritime';
            } else if (lowerQuery.includes('trade') || lowerQuery.includes('price') || lowerQuery.includes('profit')) {
                return 'trading';
            } else if (lowerQuery.includes('security') || lowerQuery.includes('threat') || lowerQuery.includes('protect')) {
                return 'security';
            } else if (lowerQuery.includes('wiki') || lowerQuery.includes('learn') || lowerQuery.includes('explain')) {
                return 'knowledge';
            }
        }
        
        return bestDomain;
    }
    
    async selectOptimalModel(domain, query, context) {
        // Get primary models for this domain
        const primaryModels = domain.primary_models || [];
        
        // Try each primary model in order of preference
        for (const modelConfig of primaryModels) {
            // Check if model is available
            if (await this.isModelAvailable(modelConfig.provider, modelConfig.name)) {
                return {
                    provider: modelConfig.provider,
                    model: modelConfig.name,
                    cost: modelConfig.cost || 0,
                    strengths: modelConfig.strengths || []
                };
            }
        }
        
        // Try fallback models
        const fallbackModels = domain.fallback_models || [];
        for (const modelConfig of fallbackModels) {
            if (await this.isModelAvailable(modelConfig.provider, modelConfig.name)) {
                return {
                    provider: modelConfig.provider,
                    model: modelConfig.name,
                    cost: modelConfig.cost || 0,
                    strengths: modelConfig.strengths || []
                };
            }
        }
        
        // Ultimate fallback - any available model
        return this.getAnyAvailableModel();
    }
    
    applyCharacterStyling(response, character, isCached = false) {
        // Add character personality to the response
        const styledResponse = {
            ...response,
            character: character.display_name,
            personality: character.personality,
            avatar: character.avatar || '🤖',
            cached: isCached
        };
        
        // Apply character-specific styling to the response text
        if (response.response && character.speaking_style) {
            // This is where you could add AI-based response styling
            // For now, we'll just add the character's catchphrase occasionally
            if (Math.random() < 0.1 && character.catchphrase) { // 10% chance
                styledResponse.response += `\n\n${character.catchphrase}`;
            }
        }
        
        return styledResponse;
    }
    
    async collectTrainingData(characterId, domain, query, response, context) {
        if (!this.trainingDataCollector.enabled) return;
        
        // Create training data entry
        const trainingEntry = {
            timestamp: new Date().toISOString(),
            character_id: characterId,
            domain: domain,
            user_query: this.trainingDataCollector.anonymizeUsers ? this.anonymizeQuery(query) : query,
            ai_response: response.response,
            model_used: response.model,
            cost: response.cost || 0,
            tokens_used: response.tokensUsed || 0,
            user_feedback: context.feedback || null,
            complexity: this.assessComplexity(query),
            quality_score: response.qualityScore || null
        };
        
        // Add to in-memory collection
        this.trainingDataCollector.interactions.push(trainingEntry);
        
        // Add to domain-specific data
        if (!this.trainingDataCollector.domainData.has(domain)) {
            this.trainingDataCollector.domainData.set(domain, []);
        }
        this.trainingDataCollector.domainData.get(domain).push(trainingEntry);
        
        // Write to file periodically
        if (this.trainingDataCollector.interactions.length % 100 === 0) {
            await this.flushTrainingDataToDisk();
        }
        
        // Emit event for external listeners
        this.emit('training_data_collected', trainingEntry);
    }
    
    async flushTrainingDataToDisk() {
        try {
            const trainingDir = process.env.TRAINING_DATA_DIR || './training_data';
            await fs.mkdir(trainingDir, { recursive: true });
            
            // Write domain-specific files
            for (const [domain, data] of this.trainingDataCollector.domainData.entries()) {
                const filename = path.join(trainingDir, `${domain}_interactions.jsonl`);
                const jsonlData = data.map(entry => JSON.stringify(entry)).join('\n');
                await fs.appendFile(filename, jsonlData + '\n');
            }
            
            // Clear in-memory data after writing
            this.trainingDataCollector.interactions = [];
            this.trainingDataCollector.domainData.clear();
            
            console.log('📚 Training data flushed to disk');
            
        } catch (error) {
            console.error('❌ Failed to write training data:', error);
        }
    }
    
    async selectModel(agentConfig, taskType, context) {
        // Check for fine-tuned model first
        const fineTunedKey = `${agentConfig.capabilities[0]}_${taskType}`;
        if (this.fineTunedModels.has(fineTunedKey)) {
            return {
                provider: 'fine_tuned',
                model: fineTunedKey,
                ...this.fineTunedModels.get(fineTunedKey)
            };
        }
        
        // Select from preferred models based on availability
        for (const modelName of agentConfig.preferred) {
            const provider = this.findProviderForModel(modelName);
            if (provider && this.modelRegistry[provider].available) {
                return {
                    provider,
                    model: modelName,
                    ...this.modelRegistry[provider].models[modelName]
                };
            }
        }
        
        // Fallback to any available model
        return this.getAnyAvailableModel();
    }
    
    findProviderForModel(modelName) {
        for (const [provider, config] of Object.entries(this.modelRegistry)) {
            if (config.models[modelName]) {
                return provider;
            }
        }
        return null;
    }
    
    getAnyAvailableModel() {
        // Try providers in priority order
        const providers = Object.entries(this.modelRegistry)
            .sort((a, b) => a[1].priority - b[1].priority);
        
        for (const [provider, config] of providers) {
            if (config.available) {
                const modelName = Object.keys(config.models)[0];
                return {
                    provider,
                    model: modelName,
                    ...config.models[modelName]
                };
            }
        }
        
        throw new Error('No AI models available');
    }
    
    async executeQuery(selectedModel, query, context, agentConfig) {
        console.log(`🤖 Routing to ${selectedModel.provider}/${selectedModel.model} for ${agentConfig.personality} agent`);
        
        switch (selectedModel.provider) {
            case 'ollama':
                return await this.queryOllama(selectedModel.model, query, context, agentConfig);
                
            case 'anthropic':
                return await this.queryAnthropic(selectedModel.model, query, context, agentConfig);
                
            case 'openai':
                return await this.queryOpenAI(selectedModel.model, query, context, agentConfig);
                
            case 'fine_tuned':
                return await this.queryFineTuned(selectedModel.model, query, context, agentConfig);
                
            default:
                throw new Error(`Unknown provider: ${selectedModel.provider}`);
        }
    }
    
    async queryOllama(model, query, context, agentConfig) {
        const systemPrompt = this.buildSystemPrompt(agentConfig);
        
        try {
            const response = await axios.post(`${this.config.ollamaUrl}/api/generate`, {
                model: model,
                prompt: `${systemPrompt}\n\nUser: ${query}\nAssistant:`,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: context.maxTokens || 2048
                }
            });
            
            return {
                response: response.data.response,
                model: `ollama/${model}`,
                tokensUsed: response.data.eval_count || 0,
                cost: 0,
                provider: 'ollama'
            };
            
        } catch (error) {
            throw new Error(`Ollama query failed: ${error.message}`);
        }
    }
    
    async queryAnthropic(model, query, context, agentConfig) {
        const systemPrompt = this.buildSystemPrompt(agentConfig);
        const fullPrompt = `${systemPrompt}\n\nUser: ${query}\nAssistant:`;
        
        try {
            // Use gas tank connector for transparent key management and model resolution
            const result = await this.gasTankConnector.callAPI(
                'anthropic',
                model,
                fullPrompt,
                {
                    maxTokens: context.maxTokens || 2048,
                    temperature: 0.7
                }
            );
            
            return {
                response: result.response,
                model: result.model,
                tokensUsed: result.tokensUsed || 0,
                cost: result.cost || 0,
                provider: 'anthropic'
            };
            
        } catch (error) {
            throw new Error(`Anthropic query failed: ${error.message}`);
        }
    }
    
    async queryOpenAI(model, query, context, agentConfig) {
        const systemPrompt = this.buildSystemPrompt(agentConfig);
        const fullPrompt = `System: ${systemPrompt}\n\nUser: ${query}`;
        
        try {
            // Use gas tank connector for transparent key management and model resolution
            const result = await this.gasTankConnector.callAPI(
                'openai',
                model,
                fullPrompt,
                {
                    maxTokens: context.maxTokens || 2048,
                    temperature: 0.7
                }
            );
            
            return {
                response: result.response,
                model: result.model,
                tokensUsed: result.tokensUsed || 0,
                cost: result.cost || 0,
                provider: 'openai'
            };
            
        } catch (error) {
            throw new Error(`OpenAI query failed: ${error.message}`);
        }
    }
    
    async queryFineTuned(modelKey, query, context, agentConfig) {
        const model = this.fineTunedModels.get(modelKey);
        if (!model) {
            throw new Error(`Fine-tuned model not found: ${modelKey}`);
        }
        
        // Route to appropriate provider based on base model
        if (model.provider === 'ollama') {
            return await this.queryOllama(model.name, query, context, agentConfig);
        } else {
            throw new Error(`Fine-tuned model provider not supported: ${model.provider}`);
        }
    }
    
    buildSystemPrompt(agentConfig) {
        return `You are an AI assistant with a ${agentConfig.personality} personality. 
Your capabilities focus on: ${agentConfig.capabilities.join(', ')}.
Respond in a way that reflects your personality while being helpful and accurate.`;
    }
    
    async tryFallbackModels(agentConfig, query, context, failedModel) {
        const remainingModels = agentConfig.preferred.filter(m => m !== failedModel.model);
        
        for (const modelName of remainingModels) {
            try {
                const provider = this.findProviderForModel(modelName);
                if (provider && this.modelRegistry[provider].available) {
                    const fallbackModel = {
                        provider,
                        model: modelName,
                        ...this.modelRegistry[provider].models[modelName]
                    };
                    
                    console.log(`🔄 Trying fallback model: ${modelName}`);
                    return await this.executeQuery(fallbackModel, query, context, agentConfig);
                }
            } catch (error) {
                console.error(`Fallback ${modelName} also failed:`, error.message);
            }
        }
        
        throw new Error('All models failed');
    }
    
    async loadFineTunedModels() {
        // This would load from a configuration file or database
        // For now, we'll add some example fine-tuned models
        
        this.fineTunedModels.set('trading_calculation', {
            name: 'trade-cal-ft-v1',
            provider: 'ollama',
            baseModel: 'mistral',
            specialization: 'OSRS arbitrage calculations',
            contextLength: 8192
        });
        
        this.fineTunedModels.set('ship_templates', {
            name: 'ship-cal-ft-v1',
            provider: 'ollama',
            baseModel: 'codellama',
            specialization: '3D ship template generation',
            contextLength: 16384
        });
        
        console.log(`📚 Loaded ${this.fineTunedModels.size} fine-tuned models`);
    }
    
    updateMetrics(model, response, responseTime) {
        // Update usage counts
        const modelKey = `${model.provider}/${model.model}`;
        this.performanceMetrics.modelUsage[modelKey] = 
            (this.performanceMetrics.modelUsage[modelKey] || 0) + 1;
        
        // Update token usage
        this.performanceMetrics.totalTokens += response.tokensUsed || 0;
        this.performanceMetrics.totalCost += response.cost || 0;
        
        // Update response time
        if (!this.performanceMetrics.responseTime[modelKey]) {
            this.performanceMetrics.responseTime[modelKey] = [];
        }
        this.performanceMetrics.responseTime[modelKey].push(responseTime);
        
        // Keep only last 100 response times
        if (this.performanceMetrics.responseTime[modelKey].length > 100) {
            this.performanceMetrics.responseTime[modelKey] = 
                this.performanceMetrics.responseTime[modelKey].slice(-100);
        }
        
        this.emit('metrics_updated', this.performanceMetrics);
    }
    
    startPerformanceMonitoring() {
        // Clean up old cache entries every hour
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.responseCache.entries()) {
                if (now - value.timestamp > this.config.cacheTimeout) {
                    this.responseCache.delete(key);
                }
            }
        }, 3600000);
        
        // Log performance metrics every 5 minutes
        setInterval(() => {
            console.log('📊 Model Router Performance:');
            console.log(`  Total Tokens: ${this.performanceMetrics.totalTokens}`);
            console.log(`  Total Cost: $${this.performanceMetrics.totalCost.toFixed(4)}`);
            console.log(`  Cache Size: ${this.responseCache.size}`);
            
            // Log model usage
            const sortedUsage = Object.entries(this.performanceMetrics.modelUsage)
                .sort((a, b) => b[1] - a[1]);
            
            console.log('  Model Usage:');
            sortedUsage.forEach(([model, count]) => {
                console.log(`    ${model}: ${count} requests`);
            });
        }, 300000);
    }
    
    getCacheKey(agentId, query) {
        return crypto.createHash('sha256')
            .update(`${agentId}:${query}`)
            .digest('hex');
    }
    
    getPerformanceReport() {
        const report = {
            ...this.performanceMetrics,
            averageResponseTime: {}
        };
        
        // Calculate average response times
        for (const [model, times] of Object.entries(this.performanceMetrics.responseTime)) {
            if (times.length > 0) {
                report.averageResponseTime[model] = 
                    times.reduce((a, b) => a + b, 0) / times.length;
            }
        }
        
        return report;
    }
    
    async registerFineTunedModel(modelConfig) {
        this.fineTunedModels.set(modelConfig.key, modelConfig);
        console.log(`✅ Registered fine-tuned model: ${modelConfig.key}`);
        
        this.emit('model_registered', modelConfig);
    }
    
    // Convenience method for backward compatibility
    async routeQuery(agentId, query, context = {}) {
        return this.routeCharacterQuery(agentId, query, context);
    }
    
    // Check if a model is available
    async isModelAvailable(provider, modelName) {
        // Check provider availability
        if (!this.modelRegistry[provider] || !this.modelRegistry[provider].available) {
            return false;
        }
        
        // For ollama, check if model is loaded
        if (provider === 'ollama') {
            return !!this.modelRegistry.ollama.models[modelName];
        }
        
        // For cloud providers, check if we have API key
        return !!this.clients[provider]?.apiKey || !!this.gasTankConnector;
    }
    
    // Estimate cost for a query
    estimateQueryCost(query, modelConfig) {
        // Rough estimation: ~4 characters per token
        const estimatedTokens = (query.length / 4) + 500; // Include response estimate
        const costPerToken = modelConfig.cost || 0;
        return (estimatedTokens / 1000) * costPerToken;
    }
    
    // Get free model for domain
    getFreeModelForDomain(domain) {
        const domainConfig = this.domains.get(domain);
        if (!domainConfig) return null;
        
        // Look for free models (cost = 0)
        const allModels = [...(domainConfig.primary_models || []), ...(domainConfig.fallback_models || [])];
        return allModels.find(m => m.cost === 0);
    }
}

module.exports = CalAIModelRouter;

// Test if run directly
if (require.main === module) {
    const router = new CalAIModelRouter();
    
    router.on('router_ready', async () => {
        console.log('\n🧪 Testing AI Model Router...\n');
        
        // Test different agent queries
        const testQueries = [
            { agentId: 'cal-master', query: 'What is the best strategy for managing multiple agents?' },
            { agentId: 'ship-cal', query: 'Generate a template for a pirate frigate with custom flags' },
            { agentId: 'trade-cal', query: 'Calculate arbitrage opportunity for dragon bones in OSRS' },
            { agentId: 'wiki-cal', query: 'Find information about agent coordination patterns' },
            { agentId: 'combat-cal', query: 'Analyze security threats in the current system' }
        ];
        
        for (const test of testQueries) {
            try {
                console.log(`\n📨 ${test.agentId}: "${test.query}"`);
                const result = await router.routeQuery(test.agentId, test.query);
                console.log(`✅ Model: ${result.model}`);
                console.log(`💬 Response: ${result.response.substring(0, 100)}...`);
                console.log(`🪙 Tokens: ${result.tokensUsed}, Cost: $${result.cost.toFixed(4)}`);
            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
            }
        }
        
        // Show performance report
        console.log('\n📊 Performance Report:');
        console.log(JSON.stringify(router.getPerformanceReport(), null, 2));
    });
}