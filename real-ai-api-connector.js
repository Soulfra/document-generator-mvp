#!/usr/bin/env node

/**
 * 🔌 REAL AI API CONNECTOR
 * 
 * Connects to actual AI APIs (not simulations)
 * Handles real HTTP requests to Anthropic, OpenAI, DeepSeek, etc.
 * 
 * Features:
 * - Real API key management
 * - Error handling and retries
 * - Rate limiting and cost tracking
 * - Response validation
 * - Audit logging for all calls
 */

// Load environment variables first thing
require('dotenv').config();

const EventEmitter = require('events');
const crypto = require('crypto');
const https = require('https');

class RealAIAPIConnector extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            retryAttempts: config.retryAttempts || 3,
            timeout: config.timeout || 30000,
            enableAuditLog: config.enableAuditLog !== false,
            enableCostTracking: config.enableCostTracking !== false,
            enableGasTankFallback: config.enableGasTankFallback !== false,
            enableTestingMode: config.enableTestingMode !== false,
            ...config
        };
        
        // Initialize gas tank manager for automatic key fallback
        let GasTankKeyManager;
        this.gasTank = null;
        
        try {
            GasTankKeyManager = require('./gas-tank-key-manager.js');
            this.gasTank = new GasTankKeyManager({
                enableDemoMode: this.config.enableTestingMode,
                enableFallbackKeys: this.config.enableGasTankFallback,
                enableTransparentFallback: true
            });
        } catch (error) {
            console.warn('⚠️  Gas tank manager not available, using basic key loading');
        }
        
        // Load API keys from environment (with gas tank fallback)
        this.apiKeys = {
            anthropic: process.env.ANTHROPIC_API_KEY,
            openai: process.env.OPENAI_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY,
            kimi: process.env.KIMI_API_KEY,
            gemini: process.env.GEMINI_API_KEY,
            perplexity: process.env.PERPLEXITY_API_KEY
        };
        
        // Load gas tank fallback keys if needed
        if (this.gasTank) {
            this.loadGasTankKeys();
        }
        
        // API endpoints and configurations (headers built dynamically)
        this.apiConfigs = {
            anthropic: {
                baseUrl: 'https://api.anthropic.com/v1/',
                models: {
                    'claude-3-opus-20240229': { maxTokens: 4096, costPer1k: 0.015 },
                    'claude-3-sonnet-20240229': { maxTokens: 4096, costPer1k: 0.003 },
                    'claude-3-haiku-20240307': { maxTokens: 4096, costPer1k: 0.00025 }
                }
            },
            
            openai: {
                baseUrl: 'https://api.openai.com/v1/',
                models: {
                    'gpt-4-0613': { maxTokens: 8192, costPer1k: 0.03 },
                    'gpt-4-turbo': { maxTokens: 128000, costPer1k: 0.01 },
                    'gpt-3.5-turbo-0125': { maxTokens: 16384, costPer1k: 0.0015 }
                }
            },
            
            deepseek: {
                baseUrl: 'https://api.deepseek.com/v1/',
                models: {
                    'deepseek-chat': { maxTokens: 32768, costPer1k: 0.008 },
                    'deepseek-coder': { maxTokens: 32768, costPer1k: 0.008 }
                }
            },
            
            kimi: {
                baseUrl: 'https://api.moonshot.cn/v1/',
                models: {
                    'moonshot-v1-128k': { maxTokens: 128000, costPer1k: 0.006 }
                }
            },
            
            gemini: {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta/',
                models: {
                    'gemini-pro': { maxTokens: 32768, costPer1k: 0.001 }
                }
            },
            
            perplexity: {
                baseUrl: 'https://api.perplexity.ai/',
                models: {
                    'llama-3.1-sonar-large-128k-online': { maxTokens: 128000, costPer1k: 0.005 }
                }
            }
        };
        
        // Request tracking
        this.requestLog = [];
        this.costTracking = new Map();
        this.rateLimits = new Map();
        
        console.log('🔌 Real AI API Connector initialized');
        console.log(`🔑 API keys loaded: ${Object.entries(this.apiKeys).filter(([k,v]) => v).length}/${Object.keys(this.apiKeys).length}`);
        
        this.initialize();
    }
    
    /**
     * Load API keys from gas tank system
     */
    async loadGasTankKeys() {
        if (!this.gasTank) return;
        
        console.log('⛽ Loading keys from gas tank system...');
        
        for (const service of Object.keys(this.apiKeys)) {
            if (!this.apiKeys[service] || this.isPlaceholderKey(this.apiKeys[service])) {
                try {
                    const keyData = await this.gasTank.getAPIKey(service, 'api_connector');
                    if (keyData && keyData.key && !this.isPlaceholderKey(keyData.key)) {
                        this.apiKeys[service] = keyData.key;
                        console.log(`  ✅ Using ${keyData.source} key for ${service}`);
                    }
                } catch (error) {
                    // Skip missing keys
                }
            }
        }
    }
    
    /**
     * Build headers dynamically with current API keys
     */
    buildHeaders(service) {
        const apiKey = this.apiKeys[service];
        
        if (!apiKey || this.isPlaceholderKey(apiKey)) {
            throw new Error(`No valid API key available for ${service}`);
        }
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        switch (service) {
            case 'anthropic':
                headers['x-api-key'] = apiKey;
                headers['anthropic-version'] = '2023-06-01';
                break;
                
            case 'openai':
            case 'deepseek':
            case 'kimi':
            case 'perplexity':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
                
            case 'gemini':
                // Gemini uses API key in URL, not headers
                break;
                
            default:
                headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        return headers;
    }
    
    /**
     * Check if a key is a placeholder
     */
    isPlaceholderKey(key) {
        if (!key) return true;
        
        const placeholderPatterns = [
            'your_',
            '_here',
            'example',
            'placeholder',
            'sk-your',
            'key_your',
            'demo-key',
            'undefined'
        ];
        
        return placeholderPatterns.some(pattern => key.includes(pattern));
    }
    
    async initialize() {
        // Initialize gas tank if available
        if (this.gasTank) {
            await this.gasTank.initialize();
            
            // Load keys from gas tank
            await this.loadKeysFromGasTank();
        }
        
        // Verify API key availability
        await this.verifyAPIKeys();
        
        console.log('✅ Real API Connector ready');
    }
    
    /**
     * Load keys from gas tank system (fallback keys)
     */
    async loadKeysFromGasTank() {
        if (!this.gasTank) return;
        
        console.log('⛽ Loading keys from gas tank system...');
        
        const services = ['anthropic', 'openai', 'deepseek', 'gemini', 'perplexity', 'kimi'];
        let fallbackKeysLoaded = 0;
        
        for (const service of services) {
            // Only load from gas tank if no user key is present
            if (!this.apiKeys[service] || this.isPlaceholderKey(this.apiKeys[service])) {
                try {
                    const keyData = await this.gasTank.getAPIKey(service, 'api_connector');
                    if (keyData) {
                        this.apiKeys[service] = keyData.key;
                        fallbackKeysLoaded++;
                        console.log(`  ⛽ Loaded ${service} key from ${keyData.source} tank`);
                    }
                } catch (error) {
                    console.log(`  ❌ No fallback key for ${service}: ${error.message}`);
                }
            } else {
                console.log(`  ✅ Using user key for ${service}`);
            }
        }
        
        if (fallbackKeysLoaded > 0) {
            console.log(`⛽ Gas tank provided ${fallbackKeysLoaded} fallback keys`);
        }
    }
    
    /**
     * Check if key is a placeholder
     */
    isPlaceholderKey(key) {
        if (!key) return true;
        
        const placeholderPatterns = [
            'your_',
            '_here',
            'example',
            'placeholder',
            'sk-your',
            'key_your'
        ];
        
        return placeholderPatterns.some(pattern => key.includes(pattern));
    }
    
    /**
     * Make a real API call to an AI service
     */
    async callAPI(service, model, prompt, options = {}) {
        const callId = crypto.randomUUID();
        const startTime = Date.now();
        
        console.log(`\n🔌 Making real API call: ${service}/${model}`);
        console.log(`📝 Prompt length: ${prompt.length} characters`);
        
        if (!this.apiKeys[service]) {
            // Try to get key from gas tank
            if (this.gasTank && this.config.enableGasTankFallback) {
                console.log(`⛽ No user key for ${service}, checking gas tank...`);
                try {
                    const keyData = await this.gasTank.getAPIKey(service, 'api_call_fallback');
                    this.apiKeys[service] = keyData.key;
                    console.log(`  ⛽ Using gas tank key from ${keyData.source}`);
                } catch (gasTankError) {
                    throw new Error(`No API key configured for ${service} and gas tank empty: ${gasTankError.message}`);
                }
            } else {
                throw new Error(`No API key configured for ${service}`);
            }
        }
        
        const config = this.apiConfigs[service];
        if (!config) {
            throw new Error(`No configuration found for ${service}`);
        }
        
        console.log(`  🔧 Config for ${service}:`, JSON.stringify(config, null, 2));
        
        const modelConfig = config.models[model];
        if (!modelConfig) {
            throw new Error(`Model ${model} not supported for ${service}`);
        }
        
        // Check rate limits
        await this.checkRateLimit(service);
        
        // Build request based on service
        const request = this.buildRequest(service, model, prompt, options, modelConfig);
        
        // Log request
        this.logRequest(callId, service, model, prompt, startTime);
        
        try {
            // Build headers dynamically with current API key
            const headers = this.buildHeaders(service);
            
            // Make actual HTTP request
            const response = await this.makeHTTPRequest(config.baseUrl, request, headers, service);
            
            // Parse response
            const parsed = this.parseResponse(service, response);
            
            // Track costs
            if (this.config.enableCostTracking) {
                await this.trackCost(service, model, parsed.usage);
            }
            
            // Log success
            this.logResponse(callId, parsed, Date.now() - startTime, true);
            
            console.log(`  ✅ ${service}/${model} responded (${Date.now() - startTime}ms)`);
            console.log(`  📊 Tokens: ${parsed.usage?.totalTokens || 'unknown'}`);
            console.log(`  💰 Cost: $${parsed.cost?.toFixed(4) || '0.00'}`);
            
            return {
                callId,
                service,
                model,
                response: parsed.content,
                metadata: {
                    usage: parsed.usage,
                    cost: parsed.cost,
                    duration: Date.now() - startTime,
                    timestamp: new Date()
                },
                sources: parsed.sources || [],
                citations: parsed.citations || []
            };
            
        } catch (error) {
            console.error(`  ❌ ${service}/${model} failed: ${error.message}`);
            
            // Record failure in gas tank
            if (this.gasTank) {
                await this.gasTank.handleKeyFailure(service, error);
            }
            
            // Log failure
            this.logResponse(callId, null, Date.now() - startTime, false, error.message);
            
            // Try gas tank fallback on failure
            if (this.gasTank && this.config.enableGasTankFallback && !options.gasTankAttempted) {
                console.log(`⛽ API call failed, trying gas tank fallback...`);
                try {
                    const fallbackKeyData = await this.gasTank.getAPIKey(service, 'failure_fallback');
                    this.apiKeys[service] = fallbackKeyData.key;
                    
                    // Retry with fallback key
                    const fallbackOptions = { ...options, gasTankAttempted: true };
                    return this.callAPI(service, model, prompt, fallbackOptions);
                } catch (fallbackError) {
                    console.error(`  ⛽ Gas tank fallback also failed: ${fallbackError.message}`);
                }
            }
            
            // Retry if configured
            if (options.retry !== false && this.shouldRetry(error)) {
                console.log(`  🔄 Retrying ${service}/${model}...`);
                return this.retryAPICall(service, model, prompt, options, callId);
            }
            
            throw error;
        }
    }
    
    /**
     * Build request payload for specific service
     */
    buildRequest(service, model, prompt, options, modelConfig) {
        switch (service) {
            case 'anthropic':
                return {
                    endpoint: 'messages',
                    method: 'POST',
                    body: JSON.stringify({
                        model: model,
                        max_tokens: options.maxTokens || modelConfig.maxTokens,
                        temperature: options.temperature || 0.7,
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    })
                };
            
            case 'openai':
                return {
                    endpoint: 'chat/completions',
                    method: 'POST',
                    body: JSON.stringify({
                        model: model,
                        max_tokens: options.maxTokens || modelConfig.maxTokens,
                        temperature: options.temperature || 0.7,
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    })
                };
            
            case 'deepseek':
                return {
                    endpoint: 'chat/completions',
                    method: 'POST',
                    body: JSON.stringify({
                        model: model,
                        max_tokens: options.maxTokens || modelConfig.maxTokens,
                        temperature: options.temperature || 0.7,
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    })
                };
            
            case 'kimi':
                return {
                    endpoint: 'chat/completions',
                    method: 'POST',
                    body: JSON.stringify({
                        model: model,
                        max_tokens: options.maxTokens || modelConfig.maxTokens,
                        temperature: options.temperature || 0.7,
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    })
                };
            
            case 'perplexity':
                return {
                    endpoint: 'chat/completions',
                    method: 'POST',
                    body: JSON.stringify({
                        model: model,
                        max_tokens: options.maxTokens || modelConfig.maxTokens,
                        temperature: options.temperature || 0.7,
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    })
                };
            
            case 'gemini':
                return {
                    endpoint: `models/${model}:generateContent`,
                    method: 'POST',
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }]
                            }
                        ],
                        generationConfig: {
                            temperature: options.temperature || 0.7,
                            maxOutputTokens: options.maxTokens || modelConfig.maxTokens
                        }
                    })
                };
            
            default:
                throw new Error(`Unsupported service: ${service}`);
        }
    }
    
    /**
     * Make actual HTTP request
     */
    async makeHTTPRequest(baseUrl, request, headers, service = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(request.endpoint, baseUrl);
            
            // Add API key as query parameter for Gemini
            if (service === 'gemini' && this.apiKeys.gemini && !this.isPlaceholderKey(this.apiKeys.gemini)) {
                url.searchParams.set('key', this.apiKeys.gemini);
            }
            
            // Debug logging
            console.log(`  🌐 URL: ${url.href}`);
            console.log(`  📝 Method: ${request.method}`);
            console.log(`  📋 Headers:`, JSON.stringify(headers, null, 2));
            console.log(`  📦 Body: ${request.body ? request.body.substring(0, 200) + '...' : 'none'}`);
            
            const options = {
                method: request.method,
                headers,
                timeout: this.config.timeout
            };
            
            const req = https.request(url, options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        
                        if (res.statusCode >= 400) {
                            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || data}`));
                        } else {
                            resolve(parsed);
                        }
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${data}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (request.body) {
                req.write(request.body);
            }
            
            req.end();
        });
    }
    
    /**
     * Parse response from different services
     */
    parseResponse(service, response) {
        let content, usage, sources, citations;
        
        switch (service) {
            case 'anthropic':
                content = response.content?.[0]?.text || '';
                usage = response.usage ? {
                    inputTokens: response.usage.input_tokens,
                    outputTokens: response.usage.output_tokens,
                    totalTokens: response.usage.input_tokens + response.usage.output_tokens
                } : null;
                break;
            
            case 'openai':
                content = response.choices?.[0]?.message?.content || '';
                usage = response.usage ? {
                    inputTokens: response.usage.prompt_tokens,
                    outputTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens
                } : null;
                break;
            
            case 'deepseek':
            case 'kimi':
                content = response.choices?.[0]?.message?.content || '';
                usage = response.usage ? {
                    inputTokens: response.usage.prompt_tokens,
                    outputTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens
                } : null;
                break;
            
            case 'perplexity':
                content = response.choices?.[0]?.message?.content || '';
                citations = response.citations || [];
                usage = response.usage;
                break;
            
            case 'gemini':
                content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
                usage = response.usageMetadata ? {
                    inputTokens: response.usageMetadata.promptTokenCount,
                    outputTokens: response.usageMetadata.candidatesTokenCount,
                    totalTokens: response.usageMetadata.totalTokenCount
                } : null;
                break;
            
            default:
                content = JSON.stringify(response);
        }
        
        // Extract sources from content (basic implementation)
        sources = this.extractSourcesFromContent(content);
        if (!citations) {
            citations = this.extractCitationsFromContent(content);
        }
        
        // Calculate cost
        const cost = usage && this.config.enableCostTracking ? 
            this.calculateCost(service, usage) : 0;
        
        return {
            content,
            usage,
            cost,
            sources,
            citations,
            rawResponse: response
        };
    }
    
    /**
     * Calculate API call cost
     */
    calculateCost(service, usage) {
        const config = this.apiConfigs[service];
        if (!config || !usage) return 0;
        
        const model = Object.values(config.models)[0]; // Use first model as default
        return (usage.totalTokens / 1000) * model.costPer1k;
    }
    
    /**
     * Extract sources from content
     */
    extractSourcesFromContent(content) {
        const sources = [];
        
        // Look for URLs
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = content.match(urlRegex) || [];
        
        for (const url of urls) {
            if (url.includes('.gov')) {
                sources.push({
                    type: 'government',
                    url: url.replace(/[.,;)]*$/, ''), // Clean trailing punctuation
                    agency: this.extractAgencyFromURL(url),
                    title: 'Government Resource',
                    confidence: 0.9
                });
            } else if (url.includes('pubmed') || url.includes('ncbi')) {
                sources.push({
                    type: 'journal',
                    url: url.replace(/[.,;)]*$/, ''),
                    title: 'Medical Literature',
                    database: 'PubMed',
                    confidence: 0.95
                });
            } else {
                sources.push({
                    type: 'website',
                    url: url.replace(/[.,;)]*$/, ''),
                    title: 'Web Resource',
                    confidence: 0.7
                });
            }
        }
        
        return sources;
    }
    
    /**
     * Extract citations from content
     */
    extractCitationsFromContent(content) {
        const citations = [];
        
        // Look for citation patterns like (Author, Year) or [1]
        const citationPatterns = [
            /\([A-Za-z\s]+,\s*\d{4}\)/g, // (Author, Year)
            /\[[0-9]+\]/g, // [1]
            /[A-Za-z\s]+ et al\.,? \d{4}/g // Author et al., Year
        ];
        
        for (const pattern of citationPatterns) {
            const matches = content.match(pattern) || [];
            for (const match of matches) {
                citations.push({
                    text: match,
                    type: 'inline',
                    confidence: 0.8
                });
            }
        }
        
        return citations;
    }
    
    /**
     * Extract agency from government URL
     */
    extractAgencyFromURL(url) {
        if (url.includes('fda.gov')) return 'FDA';
        if (url.includes('cdc.gov')) return 'CDC';
        if (url.includes('nih.gov')) return 'NIH';
        if (url.includes('nist.gov')) return 'NIST';
        if (url.includes('sec.gov')) return 'SEC';
        return 'Government Agency';
    }
    
    /**
     * Verify API keys are available
     */
    async verifyAPIKeys() {
        const available = [];
        const missing = [];
        
        for (const [service, key] of Object.entries(this.apiKeys)) {
            if (key && key.length > 10) {
                available.push(service);
            } else {
                missing.push(service);
            }
        }
        
        console.log(`✅ Available APIs: ${available.join(', ')}`);
        if (missing.length > 0) {
            console.log(`⚠️  Missing API keys: ${missing.join(', ')}`);
            
            // If gas tank is available, try to get missing keys
            if (this.gasTank && this.config.enableGasTankFallback) {
                console.log(`⛽ Attempting gas tank fallback for missing keys...`);
                await this.loadKeysFromGasTank();
                
                // Re-verify after gas tank loading
                const newAvailable = [];
                const stillMissing = [];
                
                for (const [service, key] of Object.entries(this.apiKeys)) {
                    if (key && key.length > 10) {
                        newAvailable.push(service);
                    } else {
                        stillMissing.push(service);
                    }
                }
                
                if (newAvailable.length > available.length) {
                    console.log(`⛽ Gas tank provided keys for: ${newAvailable.filter(s => !available.includes(s)).join(', ')}`);
                    available.push(...newAvailable.filter(s => !available.includes(s)));
                    missing.splice(0, missing.length, ...stillMissing);
                }
            }
        }
        
        return { available, missing };
    }
    
    /**
     * Check rate limit for service
     */
    async checkRateLimit(service) {
        const limit = this.rateLimits.get(service);
        if (!limit) return;
        
        const now = Date.now();
        if (limit.resetTime > now) {
            const waitTime = limit.resetTime - now;
            if (waitTime > 0) {
                console.log(`  ⏱️  Rate limit hit, waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    /**
     * Track API costs
     */
    async trackCost(service, model, usage) {
        const cost = this.calculateCost(service, usage);
        
        const current = this.costTracking.get(service) || { totalCost: 0, callCount: 0 };
        current.totalCost += cost;
        current.callCount += 1;
        
        this.costTracking.set(service, current);
        
        return cost;
    }
    
    /**
     * Log API request
     */
    logRequest(callId, service, model, prompt, startTime) {
        if (!this.config.enableAuditLog) return;
        
        const logEntry = {
            callId,
            type: 'request',
            service,
            model,
            promptLength: prompt.length,
            timestamp: new Date(startTime),
            status: 'pending'
        };
        
        this.requestLog.push(logEntry);
    }
    
    /**
     * Log API response
     */
    logResponse(callId, response, duration, success, error = null) {
        if (!this.config.enableAuditLog) return;
        
        const logEntry = {
            callId,
            type: 'response',
            success,
            duration,
            timestamp: new Date(),
            error,
            usage: response?.usage,
            cost: response?.cost
        };
        
        this.requestLog.push(logEntry);
        
        // Emit event for external logging
        this.emit('api_call_complete', {
            callId,
            success,
            duration,
            service: this.requestLog.find(r => r.callId === callId)?.service
        });
    }
    
    /**
     * Determine if error should trigger retry
     */
    shouldRetry(error) {
        const retryableErrors = [
            'timeout',
            'rate_limit',
            'server_error',
            'network_error'
        ];
        
        return retryableErrors.some(type => 
            error.message.toLowerCase().includes(type.replace('_', ' '))
        );
    }
    
    /**
     * Retry API call with backoff
     */
    async retryAPICall(service, model, prompt, options, originalCallId) {
        const retryOptions = {
            ...options,
            retry: false, // Prevent infinite retry
            retryOf: originalCallId
        };
        
        // Exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(2, options.retryAttempt || 0), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        return this.callAPI(service, model, prompt, retryOptions);
    }
    
    /**
     * Batch API calls for consultation
     */
    async batchConsult(consultationPlan) {
        console.log(`\n🔌 Starting batch consultation with ${consultationPlan.length} API calls`);
        
        const results = await Promise.allSettled(
            consultationPlan.map(async (plan) => {
                return this.callAPI(plan.service, plan.model, plan.prompt, plan.options);
            })
        );
        
        const successful = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        
        const failed = results
            .filter(r => r.status === 'rejected')
            .map(r => r.reason);
        
        console.log(`✅ Batch complete: ${successful.length} succeeded, ${failed.length} failed`);
        
        if (failed.length > 0) {
            console.log('❌ Failures:', failed.map(f => f.message).join(', '));
        }
        
        return {
            successful,
            failed,
            totalCost: successful.reduce((sum, r) => sum + (r.metadata.cost || 0), 0),
            totalDuration: Math.max(...successful.map(r => r.metadata.duration))
        };
    }
    
    /**
     * Connect to real Ollama
     */
    async connectOllama() {
        try {
            console.log('🔌 Connecting to real Ollama...');
            
            const response = await this.makeHTTPRequest('http://localhost:11434/', {
                endpoint: 'api/tags',
                method: 'GET'
            }, {}, 'ollama');
            
            const models = response.models || [];
            console.log(`✅ Ollama connected with ${models.length} models`);
            console.log(`🤖 Available: ${models.map(m => m.name).join(', ')}`);
            
            return models;
            
        } catch (error) {
            console.error(`❌ Ollama connection failed: ${error.message}`);
            console.log('💡 Make sure Ollama is running: ollama serve');
            throw error;
        }
    }
    
    /**
     * Call real Ollama model
     */
    async callOllama(model, prompt, options = {}) {
        console.log(`🤖 Calling real Ollama: ${model}`);
        
        try {
            const response = await this.makeHTTPRequest('http://localhost:11434/', {
                endpoint: 'api/generate',
                method: 'POST',
                body: JSON.stringify({
                    model: model.replace('ollama/', ''),
                    prompt,
                    stream: false,
                    options: {
                        temperature: options.temperature || 0.7,
                        top_p: options.top_p || 0.9
                    }
                })
            }, {
                'Content-Type': 'application/json'
            }, 'ollama');
            
            return {
                content: response.response,
                model: response.model,
                duration: response.total_duration,
                tokens: response.eval_count
            };
            
        } catch (error) {
            console.error(`❌ Ollama call failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Get connector status
     */
    getStatus() {
        const available = Object.entries(this.apiKeys).filter(([k,v]) => v).length;
        const totalCost = Array.from(this.costTracking.values())
            .reduce((sum, cost) => sum + cost.totalCost, 0);
        
        return {
            availableAPIs: available,
            totalAPIs: Object.keys(this.apiKeys).length,
            totalRequests: this.requestLog.filter(r => r.type === 'request').length,
            successfulRequests: this.requestLog.filter(r => r.success === true).length,
            totalCost: totalCost,
            costByService: Object.fromEntries(this.costTracking),
            rateLimitStatus: Object.fromEntries(this.rateLimits)
        };
    }
}

module.exports = RealAIAPIConnector;

// CLI interface
if (require.main === module) {
    const connector = new RealAIAPIConnector();
    
    // Test real API connections
    setTimeout(async () => {
        console.log('\n🧪 Testing Real AI API Connections\n');
        
        try {
            // Test Ollama connection
            const ollamaModels = await connector.connectOllama();
            
            // Test a simple call if we have API keys
            const status = connector.getStatus();
            if (status.availableAPIs > 0) {
                console.log('\n🔌 Testing real API call...');
                
                // Find first available API
                const availableAPI = Object.entries(connector.apiKeys)
                    .find(([service, key]) => key)?.[0];
                
                if (availableAPI) {
                    const models = Object.keys(connector.apiConfigs[availableAPI].models);
                    console.log(`📞 Calling ${availableAPI}/${models[0]}...`);
                    
                    const result = await connector.callAPI(
                        availableAPI,
                        models[0],
                        "What is the capital of France? Please cite your source.",
                        { maxTokens: 100 }
                    );
                    
                    console.log('✅ Real API call successful!');
                    console.log(`Response: ${result.response.substring(0, 100)}...`);
                    console.log(`Sources found: ${result.sources.length}`);
                    console.log(`Cost: $${result.metadata.cost.toFixed(4)}`);
                }
            } else {
                console.log('⚠️  No API keys configured - add to .env file');
            }
            
        } catch (error) {
            console.error('❌ API test failed:', error.message);
        }
        
        // Show status
        console.log('\n📊 Connector Status:');
        console.log(JSON.stringify(connector.getStatus(), null, 2));
        
    }, 1000);
}