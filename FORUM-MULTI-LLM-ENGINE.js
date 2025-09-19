#!/usr/bin/env node

/**
 * 🤖🔄 FORUM MULTI-LLM ENGINE
 * 
 * Routes forum posts through multiple external LLM APIs (8 hops)
 * Each hop adds perspective and builds on previous responses
 * Integrates with existing forum system and AI router infrastructure
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const axios = require('axios');

class ForumMultiLLMEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.engineId = `multi-llm-${Date.now()}`;
        this.version = '1.0.0';
        
        // Core configuration
        this.config = {
            maxHops: options.maxHops || 8,
            hopTimeout: options.hopTimeout || 30000, // 30s per hop
            totalTimeout: options.totalTimeout || 300000, // 5 minutes total
            enableCaching: options.enableCaching !== false,
            costBudgetPerRequest: options.costBudgetPerRequest || 0.50, // $0.50 max
            enableFallbacks: options.enableFallbacks !== false,
            parallelMode: options.parallelMode || false
        };
        
        // Provider configurations with API endpoints
        this.providers = {
            'claude-3.5-sonnet': {
                name: 'Claude 3.5 Sonnet',
                provider: 'anthropic',
                endpoint: 'https://api.anthropic.com/v1/messages',
                costPerToken: 0.003,
                maxTokens: 4096,
                quality: 0.95,
                specialty: 'reasoning',
                icon: '🧠',
                color: '#FF6B35'
            },
            'gpt-4': {
                name: 'GPT-4',
                provider: 'openai',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                costPerToken: 0.03,
                maxTokens: 4096,
                quality: 0.95,
                specialty: 'general',
                icon: '🤖',
                color: '#00A67E'
            },
            'deepseek-chat': {
                name: 'DeepSeek Chat',
                provider: 'deepseek',
                endpoint: 'https://api.deepseek.com/v1/chat/completions',
                costPerToken: 0.0014,
                maxTokens: 4096,
                quality: 0.88,
                specialty: 'reasoning',
                icon: '🧮',
                color: '#1E3A8A'
            },
            'cohere-command': {
                name: 'Cohere Command',
                provider: 'cohere',
                endpoint: 'https://api.cohere.ai/v1/chat',
                costPerToken: 0.002,
                maxTokens: 4096,
                quality: 0.85,
                specialty: 'conversation',
                icon: '💬',
                color: '#D946EF'
            },
            'local-ollama': {
                name: 'Local Ollama',
                provider: 'local',
                endpoint: 'http://localhost:11434/api/generate',
                costPerToken: 0,
                maxTokens: 4096,
                quality: 0.80,
                specialty: 'local',
                icon: '🏠',
                color: '#059669'
            },
            'claude-opus': {
                name: 'Claude Opus',
                provider: 'anthropic',
                endpoint: 'https://api.anthropic.com/v1/messages',
                costPerToken: 0.015,
                maxTokens: 4096,
                quality: 0.96,
                specialty: 'deep-analysis',
                icon: '🎭',
                color: '#DC2626'
            },
            'gpt-4-turbo': {
                name: 'GPT-4 Turbo',
                provider: 'openai',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                costPerToken: 0.01,
                maxTokens: 4096,
                quality: 0.93,
                specialty: 'fast-reasoning',
                icon: '⚡',
                color: '#7C3AED'
            },
            'local-codellama': {
                name: 'Local CodeLlama',
                provider: 'local',
                endpoint: 'http://localhost:11434/api/generate',
                costPerToken: 0,
                maxTokens: 4096,
                quality: 0.85,
                specialty: 'code',
                icon: '🦙',
                color: '#F59E0B'
            }
        };
        
        // Predefined hop patterns
        this.hopPatterns = {
            simple: {
                name: 'Simple Chain (3 hops)',
                hops: ['local-ollama', 'claude-3.5-sonnet', 'gpt-4'],
                description: 'Fast, cost-effective chain'
            },
            standard: {
                name: 'Standard Chain (5 hops)',
                hops: ['local-ollama', 'claude-3.5-sonnet', 'deepseek-chat', 'cohere-command', 'gpt-4'],
                description: 'Balanced quality and cost'
            },
            legendary: {
                name: 'Legendary Chain (8 hops)',
                hops: [
                    'local-ollama', 'claude-3.5-sonnet', 'gpt-4', 
                    'deepseek-chat', 'cohere-command', 'claude-opus', 
                    'gpt-4-turbo', 'local-codellama'
                ],
                description: 'Maximum diversity and insight'
            },
            cost_optimized: {
                name: 'Cost Optimized (4 hops)',
                hops: ['local-ollama', 'deepseek-chat', 'cohere-command', 'local-codellama'],
                description: 'Mostly free/cheap providers'
            },
            quality_focused: {
                name: 'Quality Focused (6 hops)',
                hops: ['claude-3.5-sonnet', 'gpt-4', 'claude-opus', 'deepseek-chat', 'gpt-4-turbo', 'cohere-command'],
                description: 'High-quality models only'
            }
        };
        
        // State tracking
        this.activeChains = new Map();
        this.completedChains = new Map();
        this.stats = {
            totalChains: 0,
            successfulChains: 0,
            failedChains: 0,
            totalCost: 0,
            averageHops: 0
        };
        
        // API key storage (encrypted)
        this.apiKeys = new Map();
        this.encryptionKey = crypto.scryptSync(process.env.ENCRYPTION_PASSWORD || 'default-password', 'salt', 32);
        
        console.log('🤖🔄 FORUM MULTI-LLM ENGINE');
        console.log('============================');
        console.log(`Engine ID: ${this.engineId}`);
        console.log(`Max Hops: ${this.config.maxHops}`);
        console.log(`Available Patterns: ${Object.keys(this.hopPatterns).length}`);
        console.log(`Providers: ${Object.keys(this.providers).length}`);
    }
    
    /**
     * Initialize the engine
     */
    async initialize() {
        console.log('🔧 Initializing Multi-LLM Engine...');
        
        try {
            // Load encrypted API keys
            await this.loadAPIKeys();
            
            // Test provider connections
            await this.testProviderConnections();
            
            console.log('✅ Multi-LLM Engine initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Failed to initialize Multi-LLM Engine:', error.message);
            throw error;
        }
    }
    
    /**
     * Process a forum post through multi-hop LLM chain
     */
    async processForumPost(postData, options = {}) {
        const chainId = `chain-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        console.log(`🚀 Starting multi-hop chain: ${chainId}`);
        console.log(`📝 Post: "${postData.content.substring(0, 50)}..."`);
        
        // Determine hop pattern based on options or random selection
        const pattern = this.selectHopPattern(options);
        console.log(`🔄 Using pattern: ${pattern.name} (${pattern.hops.length} hops)`);
        
        // Initialize chain state
        const chain = {
            id: chainId,
            startTime: Date.now(),
            pattern: pattern.name,
            originalPost: postData,
            hops: [],
            currentHop: 0,
            totalCost: 0,
            status: 'running',
            responses: [],
            finalResponse: null,
            metadata: {
                rarity: 'normal',
                qualityScore: 0,
                diversityScore: 0
            }
        };
        
        this.activeChains.set(chainId, chain);
        this.emit('chain:started', chain);
        
        try {
            // Execute hop chain
            if (this.config.parallelMode) {
                chain.finalResponse = await this.executeParallelChain(chain, pattern);
            } else {
                chain.finalResponse = await this.executeSequentialChain(chain, pattern);
            }
            
            // Calculate final metrics
            this.calculateChainMetrics(chain);
            
            // Mark chain as completed
            chain.status = 'completed';
            chain.endTime = Date.now();
            chain.duration = chain.endTime - chain.startTime;
            
            this.activeChains.delete(chainId);
            this.completedChains.set(chainId, chain);
            
            // Update stats
            this.updateStats(chain);
            
            console.log(`✅ Chain completed: ${chainId} (${chain.duration}ms, $${chain.totalCost.toFixed(4)})`);
            console.log(`🎯 Final rarity: ${chain.metadata.rarity}`);
            
            this.emit('chain:completed', chain);
            
            return {
                success: true,
                chainId,
                response: chain.finalResponse,
                metadata: chain.metadata,
                hops: chain.hops,
                cost: chain.totalCost,
                duration: chain.duration,
                rarity: chain.metadata.rarity
            };
            
        } catch (error) {
            console.error(`❌ Chain failed: ${chainId}`, error.message);
            
            chain.status = 'failed';
            chain.error = error.message;
            chain.endTime = Date.now();
            
            this.activeChains.delete(chainId);
            this.stats.failedChains++;
            
            this.emit('chain:failed', { chain, error });
            
            // Return fallback response
            return this.generateFallbackResponse(postData, error);
        }
    }
    
    /**
     * Execute sequential hop chain
     */
    async executeSequentialChain(chain, pattern) {
        let currentResponse = chain.originalPost.content;
        let conversationHistory = [];
        
        for (let i = 0; i < pattern.hops.length; i++) {
            const providerKey = pattern.hops[i];
            const provider = this.providers[providerKey];
            
            console.log(`  🔗 Hop ${i + 1}/${pattern.hops.length}: ${provider.name}`);
            
            const hopStart = Date.now();
            
            try {
                // Build prompt for this hop
                const prompt = this.buildHopPrompt(chain.originalPost, conversationHistory, i, pattern.hops.length);
                
                // Execute hop
                const hopResponse = await this.executeHop(providerKey, prompt);
                
                // Record hop results
                const hopData = {
                    hopNumber: i + 1,
                    provider: providerKey,
                    providerName: provider.name,
                    prompt,
                    response: hopResponse.content,
                    cost: hopResponse.cost || 0,
                    duration: Date.now() - hopStart,
                    tokensUsed: hopResponse.tokensUsed || 0,
                    timestamp: new Date().toISOString()
                };
                
                chain.hops.push(hopData);
                chain.totalCost += hopResponse.cost || 0;
                
                // Update conversation history
                conversationHistory.push({
                    provider: provider.name,
                    response: hopResponse.content
                });
                
                currentResponse = hopResponse.content;
                
                console.log(`    ✅ Hop ${i + 1} completed (${hopData.duration}ms, $${hopData.cost.toFixed(4)})`);
                
                // Emit hop completion
                this.emit('hop:completed', { chain, hop: hopData });
                
                // Check budget limits
                if (chain.totalCost > this.config.costBudgetPerRequest) {
                    console.warn(`⚠️  Budget exceeded, stopping at hop ${i + 1}`);
                    break;
                }
                
            } catch (error) {
                console.error(`❌ Hop ${i + 1} failed:`, error.message);
                
                if (this.config.enableFallbacks) {
                    // Try fallback provider or continue with previous response
                    console.log(`🔄 Continuing with previous response...`);
                    continue;
                } else {
                    throw error;
                }
            }
        }
        
        // Generate final synthesized response
        return this.synthesizeFinalResponse(chain, conversationHistory);
    }
    
    /**
     * Execute parallel hop chain
     */
    async executeParallelChain(chain, pattern) {
        console.log(`⚡ Executing parallel chain with ${pattern.hops.length} hops`);
        
        // Execute all hops in parallel
        const hopPromises = pattern.hops.map(async (providerKey, index) => {
            const provider = this.providers[providerKey];
            
            try {
                const prompt = this.buildHopPrompt(chain.originalPost, [], index, pattern.hops.length);
                const hopStart = Date.now();
                
                const response = await this.executeHop(providerKey, prompt);
                
                return {
                    hopNumber: index + 1,
                    provider: providerKey,
                    providerName: provider.name,
                    prompt,
                    response: response.content,
                    cost: response.cost || 0,
                    duration: Date.now() - hopStart,
                    tokensUsed: response.tokensUsed || 0,
                    timestamp: new Date().toISOString(),
                    success: true
                };
                
            } catch (error) {
                console.error(`❌ Parallel hop ${index + 1} failed:`, error.message);
                return {
                    hopNumber: index + 1,
                    provider: providerKey,
                    error: error.message,
                    success: false
                };
            }
        });
        
        const hopResults = await Promise.allSettled(hopPromises);
        
        // Process results
        const successfulHops = [];
        let totalCost = 0;
        
        hopResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                const hop = result.value;
                successfulHops.push(hop);
                totalCost += hop.cost;
                
                console.log(`  ✅ Parallel hop ${hop.hopNumber} completed: ${hop.providerName}`);
            } else {
                console.warn(`  ⚠️  Parallel hop ${index + 1} failed`);
            }
        });
        
        chain.hops = successfulHops.sort((a, b) => a.hopNumber - b.hopNumber);
        chain.totalCost = totalCost;
        
        if (successfulHops.length === 0) {
            throw new Error('All parallel hops failed');
        }
        
        // Synthesize final response from all successful hops
        return this.synthesizeParallelResponse(chain, successfulHops);
    }
    
    /**
     * Execute individual hop with specific provider
     */
    async executeHop(providerKey, prompt) {
        const provider = this.providers[providerKey];
        
        if (!provider) {
            throw new Error(`Unknown provider: ${providerKey}`);
        }
        
        // Check if we have API key for this provider (except local)
        if (provider.provider !== 'local' && !this.apiKeys.has(provider.provider)) {
            throw new Error(`No API key configured for ${provider.provider}`);
        }
        
        // Route to appropriate provider handler
        switch (provider.provider) {
            case 'anthropic':
                return this.callAnthropicAPI(provider, prompt);
            case 'openai':
                return this.callOpenAIAPI(provider, prompt);
            case 'deepseek':
                return this.callDeepSeekAPI(provider, prompt);
            case 'cohere':
                return this.callCohereAPI(provider, prompt);
            case 'local':
                return this.callLocalOllama(provider, prompt);
            default:
                throw new Error(`Unsupported provider: ${provider.provider}`);
        }
    }
    
    /**
     * Call Anthropic Claude API
     */
    async callAnthropicAPI(provider, prompt) {
        const apiKey = this.getDecryptedAPIKey('anthropic');
        
        const response = await axios.post(provider.endpoint, {
            model: provider.name.includes('Opus') ? 'claude-3-opus-20240229' : 'claude-3-5-sonnet-20241022',
            max_tokens: provider.maxTokens,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            timeout: this.config.hopTimeout
        });
        
        const tokens = response.data.usage?.input_tokens + response.data.usage?.output_tokens || 1000;
        const cost = (tokens / 1000) * provider.costPerToken;
        
        return {
            content: response.data.content[0].text,
            tokensUsed: tokens,
            cost: cost
        };
    }
    
    /**
     * Call OpenAI GPT API
     */
    async callOpenAIAPI(provider, prompt) {
        const apiKey = this.getDecryptedAPIKey('openai');
        
        const model = provider.name.includes('Turbo') ? 'gpt-4-1106-preview' : 
                     provider.name.includes('GPT-4') ? 'gpt-4' : 'gpt-3.5-turbo';
        
        const response = await axios.post(provider.endpoint, {
            model: model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: provider.maxTokens,
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: this.config.hopTimeout
        });
        
        const tokens = response.data.usage.prompt_tokens + response.data.usage.completion_tokens;
        const cost = (tokens / 1000) * provider.costPerToken;
        
        return {
            content: response.data.choices[0].message.content,
            tokensUsed: tokens,
            cost: cost
        };
    }
    
    /**
     * Call DeepSeek API
     */
    async callDeepSeekAPI(provider, prompt) {
        const apiKey = this.getDecryptedAPIKey('deepseek');
        
        const response = await axios.post(provider.endpoint, {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: provider.maxTokens,
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: this.config.hopTimeout
        });
        
        const tokens = response.data.usage?.prompt_tokens + response.data.usage?.completion_tokens || 1000;
        const cost = (tokens / 1000) * provider.costPerToken;
        
        return {
            content: response.data.choices[0].message.content,
            tokensUsed: tokens,
            cost: cost
        };
    }
    
    /**
     * Call Cohere API
     */
    async callCohereAPI(provider, prompt) {
        const apiKey = this.getDecryptedAPIKey('cohere');
        
        const response = await axios.post(provider.endpoint, {
            model: 'command',
            message: prompt,
            max_tokens: provider.maxTokens,
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: this.config.hopTimeout
        });
        
        const tokens = response.data.meta?.billed_units?.input_tokens + response.data.meta?.billed_units?.output_tokens || 1000;
        const cost = (tokens / 1000) * provider.costPerToken;
        
        return {
            content: response.data.text,
            tokensUsed: tokens,
            cost: cost
        };
    }
    
    /**
     * Call Local Ollama API
     */
    async callLocalOllama(provider, prompt) {
        try {
            const model = provider.name.includes('CodeLlama') ? 'codellama:7b' : 'mistral:7b';
            
            const response = await axios.post(provider.endpoint, {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    num_predict: provider.maxTokens,
                    temperature: 0.7
                }
            }, {
                timeout: this.config.hopTimeout
            });
            
            return {
                content: response.data.response,
                tokensUsed: response.data.eval_count || 500,
                cost: 0 // Local is free
            };
            
        } catch (error) {
            // Fallback response if Ollama is not available
            console.warn('⚠️  Local Ollama not available, using fallback');
            return {
                content: this.generateLocalFallback(prompt),
                tokensUsed: 100,
                cost: 0
            };
        }
    }
    
    /**
     * Build prompt for specific hop
     */
    buildHopPrompt(originalPost, conversationHistory, hopIndex, totalHops) {
        const isFirstHop = hopIndex === 0;
        const isLastHop = hopIndex === totalHops - 1;
        
        let prompt = '';
        
        if (isFirstHop) {
            prompt = `You are participating in a multi-AI conversation chain. This is hop 1 of ${totalHops}.

Original forum post by ${originalPost.username}:
"${originalPost.content}"

Please provide a thoughtful, helpful response. Your response will be passed to the next AI in the chain, so be comprehensive but concise. Focus on addressing the user's question directly.`;
        } else if (isLastHop) {
            prompt = `You are the final AI in a ${totalHops}-hop conversation chain. Your job is to synthesize the previous responses and provide the best final answer.

Original question: "${originalPost.content}"

Previous AI responses:
${conversationHistory.map((h, i) => `${i + 1}. ${h.provider}: ${h.response}`).join('\n\n')}

Please provide a final, synthesized response that incorporates the best insights from all previous responses. Be helpful, accurate, and engaging.`;
        } else {
            prompt = `You are AI #${hopIndex + 1} in a ${totalHops}-hop conversation chain.

Original question: "${originalPost.content}"

Previous AI responses:
${conversationHistory.map((h, i) => `${i + 1}. ${h.provider}: ${h.response}`).join('\n\n')}

Build upon the previous responses while adding your own unique perspective. Your response will be passed to the next AI, so be helpful and comprehensive.`;
        }
        
        return prompt;
    }
    
    /**
     * Synthesize final response from conversation history
     */
    async synthesizeFinalResponse(chain, conversationHistory) {
        if (conversationHistory.length === 0) {
            return "I apologize, but I wasn't able to generate a response to your question.";
        }
        
        // If only one response, return it directly
        if (conversationHistory.length === 1) {
            return conversationHistory[0].response;
        }
        
        // For multiple responses, return the last one (which should be synthesized)
        return conversationHistory[conversationHistory.length - 1].response;
    }
    
    /**
     * Synthesize response from parallel hops
     */
    async synthesizeParallelResponse(chain, hops) {
        if (hops.length === 0) {
            return "I apologize, but I wasn't able to generate a response to your question.";
        }
        
        if (hops.length === 1) {
            return hops[0].response;
        }
        
        // Create a synthesis of all responses
        const responses = hops.map((hop, i) => `**${hop.providerName}:** ${hop.response}`).join('\n\n');
        
        return `Here are perspectives from ${hops.length} different AI systems:\n\n${responses}`;
    }
    
    /**
     * Calculate chain quality and rarity metrics
     */
    calculateChainMetrics(chain) {
        const hops = chain.hops.filter(h => h.response);
        
        if (hops.length === 0) {
            chain.metadata.qualityScore = 0;
            chain.metadata.rarity = 'normal';
            return;
        }
        
        // Quality score based on successful hops and providers used
        const qualityScore = hops.reduce((sum, hop) => {
            const provider = this.providers[hop.provider];
            return sum + (provider?.quality || 0.5);
        }, 0) / hops.length;
        
        // Diversity score based on provider variety
        const uniqueProviders = new Set(hops.map(h => h.provider)).size;
        const diversityScore = uniqueProviders / hops.length;
        
        chain.metadata.qualityScore = qualityScore;
        chain.metadata.diversityScore = diversityScore;
        
        // Determine rarity based on metrics
        if (hops.length >= 6 && qualityScore > 0.9 && diversityScore > 0.7) {
            chain.metadata.rarity = 'legendary';
        } else if (hops.length >= 4 && qualityScore > 0.8 && diversityScore > 0.5) {
            chain.metadata.rarity = 'rare';
        } else {
            chain.metadata.rarity = 'normal';
        }
    }
    
    /**
     * Select hop pattern based on options
     */
    selectHopPattern(options = {}) {
        if (options.pattern && this.hopPatterns[options.pattern]) {
            return this.hopPatterns[options.pattern];
        }
        
        // Smart pattern selection based on post complexity
        const contentLength = options.originalContent?.length || 100;
        
        if (contentLength > 500) {
            return this.hopPatterns.legendary;
        } else if (contentLength > 200) {
            return this.hopPatterns.standard;
        } else {
            return this.hopPatterns.simple;
        }
    }
    
    /**
     * Generate fallback response when chain fails
     */
    generateFallbackResponse(postData, error) {
        return {
            success: false,
            response: "I apologize, but I'm having trouble connecting to external AI services right now. Please try again later.",
            metadata: {
                rarity: 'normal',
                qualityScore: 0.3,
                diversityScore: 0
            },
            hops: [],
            cost: 0,
            duration: 0,
            error: error.message,
            fallback: true
        };
    }
    
    /**
     * Generate local fallback when Ollama is unavailable
     */
    generateLocalFallback(prompt) {
        const responses = [
            "That's an interesting question. Let me think about this...",
            "I'd be happy to help you with that. Here's what I think...",
            "Based on your question, here are some thoughts...",
            "That's a great point you've raised. Consider this perspective..."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    /**
     * Load encrypted API keys
     */
    async loadAPIKeys() {
        // In production, these would be loaded from encrypted storage
        // For now, check environment variables
        
        const providers = ['anthropic', 'openai', 'deepseek', 'cohere'];
        
        providers.forEach(provider => {
            const envKey = `${provider.toUpperCase()}_API_KEY`;
            const apiKey = process.env[envKey];
            
            if (apiKey) {
                // Encrypt and store
                this.setAPIKey(provider, apiKey);
                console.log(`✅ Loaded API key for ${provider}`);
            } else {
                console.warn(`⚠️  No API key found for ${provider} (${envKey})`);
            }
        });
    }
    
    /**
     * Set encrypted API key
     */
    setAPIKey(provider, apiKey) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(apiKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        this.apiKeys.set(provider, encrypted);
    }
    
    /**
     * Get decrypted API key
     */
    getDecryptedAPIKey(provider) {
        const encrypted = this.apiKeys.get(provider);
        if (!encrypted) {
            throw new Error(`No API key found for ${provider}`);
        }
        
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    /**
     * Test provider connections
     */
    async testProviderConnections() {
        console.log('🔍 Testing provider connections...');
        
        // Test local Ollama
        try {
            await axios.get('http://localhost:11434/api/tags', { timeout: 5000 });
            console.log('  ✅ Local Ollama: Connected');
        } catch (error) {
            console.log('  ⚠️  Local Ollama: Not available');
        }
        
        // Note: We don't test external APIs here to avoid costs
        // They will be tested on first actual use
    }
    
    /**
     * Update engine statistics
     */
    updateStats(chain) {
        this.stats.totalChains++;
        
        if (chain.status === 'completed') {
            this.stats.successfulChains++;
        } else {
            this.stats.failedChains++;
        }
        
        this.stats.totalCost += chain.totalCost;
        this.stats.averageHops = (this.stats.averageHops * (this.stats.totalChains - 1) + chain.hops.length) / this.stats.totalChains;
    }
    
    /**
     * Get engine statistics
     */
    getStats() {
        return {
            ...this.stats,
            activeChains: this.activeChains.size,
            completedChains: this.completedChains.size,
            successRate: this.stats.totalChains > 0 ? (this.stats.successfulChains / this.stats.totalChains * 100).toFixed(1) + '%' : '0%',
            averageCost: this.stats.totalChains > 0 ? (this.stats.totalCost / this.stats.totalChains).toFixed(4) : '0.0000'
        };
    }
    
    /**
     * Get available hop patterns
     */
    getHopPatterns() {
        return Object.entries(this.hopPatterns).map(([key, pattern]) => ({
            key,
            ...pattern
        }));
    }
    
    /**
     * Get provider information
     */
    getProviders() {
        return Object.entries(this.providers).map(([key, provider]) => ({
            key,
            ...provider,
            hasApiKey: provider.provider === 'local' || this.apiKeys.has(provider.provider)
        }));
    }
}

module.exports = ForumMultiLLMEngine;

// CLI interface
if (require.main === module) {
    const engine = new ForumMultiLLMEngine();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'test':
            console.log('🧪 Testing Multi-LLM Engine...\n');
            
            engine.initialize().then(async () => {
                const testPost = {
                    username: 'TestUser',
                    content: 'What are the best practices for optimizing website performance?'
                };
                
                console.log('📝 Test post:', testPost.content);
                console.log('🔄 Processing through simple chain...\n');
                
                const result = await engine.processForumPost(testPost, { pattern: 'simple' });
                
                console.log('\n📊 RESULT:');
                console.log('==========');
                console.log(`Success: ${result.success}`);
                console.log(`Rarity: ${result.rarity}`);
                console.log(`Cost: $${result.cost?.toFixed(4) || '0.0000'}`);
                console.log(`Duration: ${result.duration}ms`);
                console.log(`Hops: ${result.hops?.length || 0}`);
                console.log(`\nFinal Response:\n${result.response}`);
                
                if (result.hops) {
                    console.log('\n🔗 Hop Details:');
                    result.hops.forEach(hop => {
                        console.log(`  ${hop.hopNumber}. ${hop.providerName} (${hop.duration}ms, $${hop.cost.toFixed(4)})`);
                    });
                }
                
            }).catch(console.error);
            break;
            
        case 'stats':
            engine.initialize().then(() => {
                console.log('\n📊 Engine Statistics:');
                console.log('====================');
                const stats = engine.getStats();
                Object.entries(stats).forEach(([key, value]) => {
                    console.log(`${key}: ${value}`);
                });
            });
            break;
            
        case 'patterns':
            console.log('\n🔄 Available Hop Patterns:');
            console.log('==========================');
            Object.entries(engine.hopPatterns).forEach(([key, pattern]) => {
                console.log(`${key}: ${pattern.name}`);
                console.log(`  Hops: ${pattern.hops.length}`);
                console.log(`  Description: ${pattern.description}`);
                console.log(`  Chain: ${pattern.hops.join(' → ')}`);
                console.log('');
            });
            break;
            
        case 'providers':
            console.log('\n🤖 Available Providers:');
            console.log('=======================');
            Object.entries(engine.providers).forEach(([key, provider]) => {
                console.log(`${provider.icon} ${provider.name} (${key})`);
                console.log(`  Provider: ${provider.provider}`);
                console.log(`  Cost/Token: $${provider.costPerToken}`);
                console.log(`  Quality: ${provider.quality}`);
                console.log(`  Specialty: ${provider.specialty}`);
                console.log('');
            });
            break;
            
        default:
            console.log(`
🤖🔄 FORUM MULTI-LLM ENGINE

Usage:
  node FORUM-MULTI-LLM-ENGINE.js test      - Run test with sample post
  node FORUM-MULTI-LLM-ENGINE.js stats     - Show engine statistics
  node FORUM-MULTI-LLM-ENGINE.js patterns  - List available hop patterns
  node FORUM-MULTI-LLM-ENGINE.js providers - List available providers

Environment Variables:
  ANTHROPIC_API_KEY - Claude API key
  OPENAI_API_KEY    - OpenAI API key
  DEEPSEEK_API_KEY  - DeepSeek API key
  COHERE_API_KEY    - Cohere API key
  
The engine will route forum posts through multiple AI providers
for diverse, high-quality responses with proper cost tracking.
            `);
    }
}