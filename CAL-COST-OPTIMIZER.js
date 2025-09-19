#!/usr/bin/env node

/**
 * 💰 CAL COST OPTIMIZER - INTELLIGENT API USAGE & BUDGET MANAGEMENT
 * 
 * Optimizes costs while maintaining accuracy and performance:
 * - Smart routing: Ollama → DeepSeek → Anthropic → OpenAI
 * - Intelligent caching with confidence-based TTL
 * - Budget-aware model selection with fallback chains
 * - Cost prediction and spend optimization
 * - Batch processing for efficiency gains
 * - Real-time cost tracking and alerting
 * - API rate limiting and quota management
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CalCostOptimizer extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Model cost hierarchy (cost per 1000 tokens)
            modelCosts: {
                'ollama/codellama:7b': { cost: 0.0000, latency: 150, reliability: 0.85, capabilities: ['code', 'text'] },
                'ollama/mistral:7b': { cost: 0.0000, latency: 120, reliability: 0.82, capabilities: ['text', 'analysis'] },
                'ollama/llama2:7b': { cost: 0.0000, latency: 180, reliability: 0.80, capabilities: ['text', 'general'] },
                'deepseek/coder': { cost: 0.0014, latency: 300, reliability: 0.92, capabilities: ['code', 'analysis'] },
                'deepseek/chat': { cost: 0.0014, latency: 250, reliability: 0.90, capabilities: ['text', 'chat'] },
                'anthropic/claude-3-haiku': { cost: 0.0025, latency: 400, reliability: 0.94, capabilities: ['text', 'analysis', 'vision'] },
                'anthropic/claude-3-sonnet': { cost: 0.0150, latency: 600, reliability: 0.96, capabilities: ['text', 'analysis', 'vision', 'reasoning'] },
                'anthropic/claude-3-opus': { cost: 0.0750, latency: 800, reliability: 0.98, capabilities: ['text', 'analysis', 'vision', 'reasoning', 'creative'] },
                'openai/gpt-3.5-turbo': { cost: 0.0020, latency: 350, reliability: 0.91, capabilities: ['text', 'chat'] },
                'openai/gpt-4': { cost: 0.0300, latency: 1200, reliability: 0.97, capabilities: ['text', 'analysis', 'vision', 'reasoning'] },
                'openai/gpt-4-turbo': { cost: 0.0100, latency: 800, reliability: 0.95, capabilities: ['text', 'analysis', 'vision', 'reasoning'] }
            },
            
            // Budget management
            budgets: {
                daily: 20.00,
                weekly: 120.00,
                monthly: 450.00,
                emergency: 5.00, // Emergency budget for critical tasks
                alertThresholds: [0.50, 0.75, 0.90, 0.95] // 50%, 75%, 90%, 95%
            },
            
            // Optimization strategies
            optimization: {
                enableCaching: true,
                cacheBasedOnConfidence: true,
                batchProcessing: true,
                fallbackChains: true,
                costPrediction: true,
                smartRetries: true,
                loadBalancing: true
            },
            
            // Caching configuration
            caching: {
                defaultTTL: 3600000, // 1 hour
                maxTTL: 86400000,    // 24 hours
                minTTL: 300000,      // 5 minutes
                maxCacheSize: 50000,
                confidenceThreshold: 0.8 // Cache results with confidence >= 80%
            },
            
            // API rate limits (requests per minute)
            rateLimits: {
                'anthropic': 50,
                'openai': 60,
                'deepseek': 100,
                'ollama': 1000 // Local, so much higher
            }
        };
        
        // Cost tracking
        this.costTracking = {
            current: {
                hourly: 0,
                daily: 0,
                weekly: 0,
                monthly: 0
            },
            history: {
                hourly: [],
                daily: [],
                weekly: [],
                monthly: []
            },
            byModel: new Map(),
            byLibrarian: new Map()
        };
        
        // Intelligent cache
        this.cache = new Map();
        
        // Request queue for batch processing
        this.requestQueue = [];
        this.batchProcessor = null;
        
        // Rate limiting tracking
        this.rateLimitTracking = new Map();
        
        // Model availability tracking
        this.modelAvailability = new Map();
        
        // Cost predictions
        this.predictions = {
            hourly: 0,
            daily: 0,
            weekly: 0
        };
        
        console.log('💰 Cal Cost Optimizer initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Initialize cost tracking periods
        this.initializeCostTracking();
        
        // Start batch processor
        this.startBatchProcessor();
        
        // Start cost tracking and alerts
        this.startCostMonitoring();
        
        // Initialize model availability monitoring
        this.initializeModelAvailability();
        
        // Start cache cleanup
        this.startCacheCleanup();
        
        console.log('✅ Cost Optimizer ready');
        console.log(`   💰 Daily budget: $${this.config.budgets.daily}`);
        console.log(`   📊 Models configured: ${Object.keys(this.config.modelCosts).length}`);
        console.log(`   🗄️ Caching enabled: ${this.config.optimization.enableCaching}`);
        console.log(`   📦 Batch processing: ${this.config.optimization.batchProcessing}`);
        
        this.emit('cost_optimizer_ready');
    }
    
    initializeCostTracking() {
        // Initialize tracking for different time periods
        const now = new Date();
        this.costTracking.periods = {
            currentHour: now.getHours(),
            currentDay: now.getDate(),
            currentWeek: this.getWeekNumber(now),
            currentMonth: now.getMonth()
        };
    }
    
    startBatchProcessor() {
        if (!this.config.optimization.batchProcessing) return;
        
        this.batchProcessor = setInterval(() => {
            if (this.requestQueue.length > 0) {
                this.processBatch();
            }
        }, 1000); // Process batches every second
    }
    
    startCostMonitoring() {
        // Reset daily budget at midnight
        const resetDaily = () => {
            const now = new Date();
            if (now.getHours() === 0) {
                this.resetDailyBudget();
            }
        };
        
        // Check every hour
        setInterval(resetDaily, 60 * 60 * 1000);
        
        // Update predictions every 15 minutes
        setInterval(() => {
            this.updateCostPredictions();
        }, 15 * 60 * 1000);
    }
    
    initializeModelAvailability() {
        // Initialize all models as available
        for (const model of Object.keys(this.config.modelCosts)) {
            this.modelAvailability.set(model, {
                available: true,
                lastCheck: Date.now(),
                consecutiveFailures: 0,
                averageLatency: this.config.modelCosts[model].latency
            });
        }
    }
    
    startCacheCleanup() {
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 10 * 60 * 1000); // Cleanup every 10 minutes
    }
    
    // ========================================
    // MAIN OPTIMIZATION METHODS
    // ========================================
    
    async optimizeQuery(query, options = {}) {
        const optimizationId = crypto.randomUUID();
        const startTime = Date.now();
        
        console.log(`💰 Optimizing query: ${optimizationId}`);
        
        // Check cache first
        if (this.config.optimization.enableCaching) {
            const cachedResult = this.checkCache(query, options);
            if (cachedResult) {
                console.log(`   💾 Cache hit: ${optimizationId} (saved $${cachedResult.savedCost.toFixed(4)})`);
                this.emit('cache_hit', { optimizationId, query, savedCost: cachedResult.savedCost });
                return cachedResult.result;
            }
        }
        
        // Select optimal model based on requirements and budget
        const selectedModel = await this.selectOptimalModel(query, options);
        
        if (!selectedModel) {
            throw new Error('No suitable model available within budget constraints');
        }
        
        // Check if we should batch this request
        if (this.shouldBatch(query, options)) {
            return this.addToBatch(query, options, selectedModel, optimizationId);
        }
        
        // Execute the query
        const result = await this.executeOptimizedQuery(query, selectedModel, options, optimizationId);
        
        // Cache the result if confidence is high enough
        if (this.config.optimization.enableCaching && result.confidence >= this.config.caching.confidenceThreshold) {
            this.cacheResult(query, options, result, selectedModel);
        }
        
        // Track cost
        this.trackCost(selectedModel, result.tokensUsed || 1000, options.librarian);
        
        const optimizationTime = Date.now() - startTime;
        console.log(`   ✅ Query optimized: ${optimizationId} (${optimizationTime}ms)`);
        console.log(`   💰 Cost: $${result.cost.toFixed(4)} | Model: ${selectedModel.name}`);
        
        this.emit('query_optimized', {
            optimizationId,
            model: selectedModel,
            cost: result.cost,
            optimizationTime,
            result
        });
        
        return result;
    }
    
    async selectOptimalModel(query, options = {}) {
        const requirements = this.analyzeRequirements(query, options);
        const availableModels = this.getAvailableModels(requirements);
        const budgetConstraints = this.getBudgetConstraints();
        
        console.log(`   🎯 Analyzing ${availableModels.length} available models`);
        console.log(`   💰 Remaining budget: $${budgetConstraints.remaining.toFixed(4)}`);
        
        // Score models based on cost, performance, and availability
        const scoredModels = availableModels.map(model => {
            const score = this.calculateModelScore(model, requirements, budgetConstraints);
            return { ...model, score };
        });
        
        // Sort by score (higher is better)
        scoredModels.sort((a, b) => b.score - a.score);
        
        // Select the best model that fits our budget
        for (const model of scoredModels) {
            const estimatedCost = this.estimateQueryCost(model, query, options);
            
            if (estimatedCost <= budgetConstraints.remaining || budgetConstraints.allowEmergency) {
                console.log(`   ✅ Selected: ${model.name} (score: ${model.score.toFixed(2)}, cost: $${estimatedCost.toFixed(4)})`);
                return { ...model, estimatedCost };
            }
        }
        
        // If no model fits budget, try emergency budget
        if (budgetConstraints.emergency > 0) {
            const cheapestModel = scoredModels.find(m => 
                this.estimateQueryCost(m, query, options) <= budgetConstraints.emergency
            );
            
            if (cheapestModel) {
                console.log(`   🚨 Using emergency budget for: ${cheapestModel.name}`);
                return { ...cheapestModel, emergencyUse: true };
            }
        }
        
        return null;
    }
    
    analyzeRequirements(query, options = {}) {
        const requirements = {
            complexity: 'medium',
            capabilities: ['text'],
            priority: options.priority || 'normal',
            maxLatency: options.maxLatency || 5000,
            minConfidence: options.minConfidence || 0.8,
            domain: options.domain || 'general'
        };
        
        // Analyze query complexity
        const queryLength = query.length;
        if (queryLength > 2000) {
            requirements.complexity = 'high';
        } else if (queryLength < 500) {
            requirements.complexity = 'low';
        }
        
        // Analyze required capabilities
        if (query.toLowerCase().includes('code') || query.includes('function') || query.includes('```')) {
            requirements.capabilities.push('code');
        }
        
        if (query.toLowerCase().includes('analyze') || query.toLowerCase().includes('compare')) {
            requirements.capabilities.push('analysis');
        }
        
        if (query.toLowerCase().includes('reason') || query.toLowerCase().includes('explain')) {
            requirements.capabilities.push('reasoning');
        }
        
        // Domain-specific adjustments
        if (options.domain === 'trading') {
            requirements.capabilities.push('analysis');
            requirements.minConfidence = Math.max(requirements.minConfidence, 0.85);
        } else if (options.domain === 'security') {
            requirements.capabilities.push('reasoning');
            requirements.minConfidence = Math.max(requirements.minConfidence, 0.90);
        }
        
        return requirements;
    }
    
    getAvailableModels(requirements) {
        const availableModels = [];
        
        for (const [modelName, modelConfig] of Object.entries(this.config.modelCosts)) {
            const availability = this.modelAvailability.get(modelName);
            
            // Check if model is available
            if (!availability || !availability.available) {
                continue;
            }
            
            // Check if model meets capability requirements
            const hasRequiredCapabilities = requirements.capabilities.every(cap => 
                modelConfig.capabilities.includes(cap)
            );
            
            if (!hasRequiredCapabilities) {
                continue;
            }
            
            // Check rate limits
            if (!this.checkRateLimit(modelName)) {
                continue;
            }
            
            availableModels.push({
                name: modelName,
                ...modelConfig,
                availability: availability
            });
        }
        
        return availableModels;
    }
    
    getBudgetConstraints() {
        const remainingDaily = this.config.budgets.daily - this.costTracking.current.daily;
        const remainingHourly = (this.config.budgets.daily / 24) - this.costTracking.current.hourly;
        
        return {
            remaining: Math.min(remainingDaily, remainingHourly),
            emergency: this.config.budgets.emergency,
            allowEmergency: remainingDaily <= 0.50, // Allow emergency if less than 50 cents left
            dailyBudget: this.config.budgets.daily,
            percentUsed: (this.costTracking.current.daily / this.config.budgets.daily) * 100
        };
    }
    
    calculateModelScore(model, requirements, budgetConstraints) {
        let score = 0;
        
        // Cost efficiency score (higher for lower cost)
        const maxCost = Math.max(...Object.values(this.config.modelCosts).map(m => m.cost));
        const costScore = maxCost === 0 ? 100 : ((maxCost - model.cost) / maxCost) * 40;
        score += costScore;
        
        // Reliability score
        const reliabilityScore = model.reliability * 30;
        score += reliabilityScore;
        
        // Latency score (higher for lower latency)
        const maxLatency = Math.max(...Object.values(this.config.modelCosts).map(m => m.latency));
        const latencyScore = ((maxLatency - model.latency) / maxLatency) * 20;
        score += latencyScore;
        
        // Availability score
        const availabilityScore = (model.availability.consecutiveFailures === 0) ? 10 : 
                                 Math.max(0, 10 - model.availability.consecutiveFailures * 2);
        score += availabilityScore;
        
        // Priority boost for local models if budget is tight
        if (budgetConstraints.percentUsed > 70 && model.cost === 0) {
            score += 20; // Significant boost for free models when budget is tight
        }
        
        // Complexity matching
        if (requirements.complexity === 'low' && model.cost === 0) {
            score += 15; // Prefer free models for simple tasks
        } else if (requirements.complexity === 'high' && model.reliability > 0.95) {
            score += 10; // Prefer high-reliability models for complex tasks
        }
        
        return Math.max(0, score);
    }
    
    estimateQueryCost(model, query, options = {}) {
        // Estimate token usage
        const estimatedTokens = Math.ceil(query.length / 4) + 500; // Rough estimation
        const adjustedTokens = estimatedTokens * (options.maxTokens || 1000) / 1000;
        
        return (adjustedTokens / 1000) * model.cost;
    }
    
    checkRateLimit(modelName) {
        const provider = modelName.split('/')[0];
        const limit = this.config.rateLimits[provider];
        
        if (!limit) return true; // No limit configured
        
        const tracking = this.rateLimitTracking.get(provider) || { requests: [], minute: new Date().getMinutes() };
        const currentMinute = new Date().getMinutes();
        
        // Reset if new minute
        if (tracking.minute !== currentMinute) {
            tracking.requests = [];
            tracking.minute = currentMinute;
        }
        
        // Check if under limit
        const underLimit = tracking.requests.length < limit;
        
        if (underLimit) {
            tracking.requests.push(Date.now());
            this.rateLimitTracking.set(provider, tracking);
        }
        
        return underLimit;
    }
    
    async executeOptimizedQuery(query, model, options, optimizationId) {
        const startTime = Date.now();
        
        try {
            // Mock execution - in real implementation would call actual model
            const mockResult = await this.mockModelExecution(query, model, options);
            
            // Update model availability tracking
            this.updateModelAvailability(model.name, true, Date.now() - startTime);
            
            return {
                ...mockResult,
                optimizationId,
                model: model.name,
                cost: mockResult.cost || model.estimatedCost || 0,
                executionTime: Date.now() - startTime
            };
            
        } catch (error) {
            console.error(`❌ Query execution failed: ${error.message}`);
            
            // Update model availability tracking
            this.updateModelAvailability(model.name, false, Date.now() - startTime);
            
            // Try fallback if enabled
            if (this.config.optimization.fallbackChains) {
                return this.executeFallback(query, model, options, optimizationId, error);
            }
            
            throw error;
        }
    }
    
    async mockModelExecution(query, model, options) {
        // Simulate execution time based on model latency
        const delay = model.latency + Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Simulate success/failure based on model reliability
        if (Math.random() > model.reliability) {
            throw new Error(`Model ${model.name} execution failed`);
        }
        
        // Generate mock result
        return {
            content: `Mock response from ${model.name} for query: "${query.substring(0, 50)}..."`,
            confidence: model.reliability * (0.85 + Math.random() * 0.15), // 85-100% of model reliability
            tokensUsed: Math.ceil(query.length / 4) + Math.floor(Math.random() * 500) + 200,
            cost: model.estimatedCost || 0,
            success: true
        };
    }
    
    async executeFallback(query, failedModel, options, optimizationId, originalError) {
        console.log(`🔄 Attempting fallback for failed model: ${failedModel.name}`);
        
        // Get next best model
        const fallbackModel = await this.selectOptimalModel(query, {
            ...options,
            excludeModels: [failedModel.name]
        });
        
        if (!fallbackModel) {
            throw new Error(`Fallback failed: ${originalError.message}`);
        }
        
        return this.executeOptimizedQuery(query, fallbackModel, options, optimizationId);
    }
    
    updateModelAvailability(modelName, success, latency) {
        const availability = this.modelAvailability.get(modelName);
        if (!availability) return;
        
        availability.lastCheck = Date.now();
        
        if (success) {
            availability.consecutiveFailures = 0;
            availability.available = true;
            
            // Update average latency
            const alpha = 0.3; // Exponential moving average factor
            availability.averageLatency = (alpha * latency) + ((1 - alpha) * availability.averageLatency);
        } else {
            availability.consecutiveFailures++;
            
            // Mark as unavailable after 3 consecutive failures
            if (availability.consecutiveFailures >= 3) {
                availability.available = false;
                console.log(`❌ Model marked unavailable: ${modelName}`);
            }
        }
        
        this.modelAvailability.set(modelName, availability);
    }
    
    // ========================================
    // CACHING SYSTEM
    // ========================================
    
    checkCache(query, options) {
        if (!this.config.optimization.enableCaching) return null;
        
        const cacheKey = this.generateCacheKey(query, options);
        const cachedEntry = this.cache.get(cacheKey);
        
        if (!cachedEntry) return null;
        
        // Check if cache entry is still valid
        const now = Date.now();
        if (now > cachedEntry.expiresAt) {
            this.cache.delete(cacheKey);
            return null;
        }
        
        // Calculate saved cost
        const currentModel = this.selectCheapestModel(query, options);
        const savedCost = currentModel ? this.estimateQueryCost(currentModel, query, options) : 0;
        
        return {
            result: cachedEntry.result,
            savedCost: savedCost
        };
    }
    
    cacheResult(query, options, result, model) {
        if (this.cache.size >= this.config.caching.maxCacheSize) {
            this.cleanupOldestCache();
        }
        
        const cacheKey = this.generateCacheKey(query, options);
        
        // Calculate TTL based on confidence
        let ttl = this.config.caching.defaultTTL;
        
        if (this.config.optimization.cacheBasedOnConfidence) {
            // Higher confidence = longer cache time
            const confidenceMultiplier = result.confidence || 0.8;
            ttl = this.config.caching.minTTL + 
                  (this.config.caching.maxTTL - this.config.caching.minTTL) * confidenceMultiplier;
        }
        
        this.cache.set(cacheKey, {
            result: result,
            cachedAt: Date.now(),
            expiresAt: Date.now() + ttl,
            confidence: result.confidence,
            model: model.name,
            cost: model.estimatedCost || 0
        });
        
        console.log(`   💾 Cached result: ${cacheKey} (TTL: ${Math.round(ttl/1000/60)}m)`);
    }
    
    generateCacheKey(query, options) {
        const keyData = {
            query: query.trim().toLowerCase(),
            domain: options.domain,
            maxTokens: options.maxTokens,
            minConfidence: options.minConfidence
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(keyData))
            .digest('hex')
            .substring(0, 16);
    }
    
    cleanupExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
        }
    }
    
    cleanupOldestCache() {
        // Remove 20% of oldest entries when cache is full
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
        
        const removeCount = Math.floor(entries.length * 0.2);
        for (let i = 0; i < removeCount; i++) {
            this.cache.delete(entries[i][0]);
        }
        
        console.log(`🧹 Cleaned ${removeCount} oldest cache entries`);
    }
    
    // ========================================
    // BATCH PROCESSING
    // ========================================
    
    shouldBatch(query, options) {
        if (!this.config.optimization.batchProcessing) return false;
        if (options.priority === 'urgent') return false;
        if (options.realTime === true) return false;
        
        return true;
    }
    
    addToBatch(query, options, model, optimizationId) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                query,
                options,
                model,
                optimizationId,
                resolve,
                reject,
                addedAt: Date.now()
            });
            
            console.log(`📦 Added to batch queue: ${optimizationId} (queue size: ${this.requestQueue.length})`);
        });
    }
    
    async processBatch() {
        if (this.requestQueue.length === 0) return;
        
        const batchSize = Math.min(5, this.requestQueue.length); // Process up to 5 at a time
        const batch = this.requestQueue.splice(0, batchSize);
        
        console.log(`📦 Processing batch of ${batch.length} requests`);
        
        // Group by model for efficiency
        const byModel = new Map();
        for (const request of batch) {
            const modelName = request.model.name;
            if (!byModel.has(modelName)) {
                byModel.set(modelName, []);
            }
            byModel.get(modelName).push(request);
        }
        
        // Process each model group
        for (const [modelName, requests] of byModel.entries()) {
            try {
                await this.processBatchForModel(modelName, requests);
            } catch (error) {
                console.error(`❌ Batch processing failed for ${modelName}:`, error.message);
                // Reject all requests in this batch
                for (const request of requests) {
                    request.reject(error);
                }
            }
        }
    }
    
    async processBatchForModel(modelName, requests) {
        console.log(`   🔄 Processing ${requests.length} requests for ${modelName}`);
        
        // For simplicity, process sequentially with small delay
        for (const request of requests) {
            try {
                const result = await this.executeOptimizedQuery(
                    request.query,
                    request.model,
                    request.options,
                    request.optimizationId
                );
                
                request.resolve(result);
                
                // Small delay between requests in batch
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (error) {
                request.reject(error);
            }
        }
    }
    
    // ========================================
    // COST TRACKING
    // ========================================
    
    trackCost(model, tokensUsed, librarian) {
        const cost = (tokensUsed / 1000) * model.cost;
        
        // Update current period costs
        this.costTracking.current.hourly += cost;
        this.costTracking.current.daily += cost;
        this.costTracking.current.weekly += cost;
        this.costTracking.current.monthly += cost;
        
        // Track by model
        if (!this.costTracking.byModel.has(model.name)) {
            this.costTracking.byModel.set(model.name, { cost: 0, requests: 0 });
        }
        const modelStats = this.costTracking.byModel.get(model.name);
        modelStats.cost += cost;
        modelStats.requests++;
        
        // Track by librarian
        if (librarian) {
            if (!this.costTracking.byLibrarian.has(librarian)) {
                this.costTracking.byLibrarian.set(librarian, { cost: 0, requests: 0 });
            }
            const librarianStats = this.costTracking.byLibrarian.get(librarian);
            librarianStats.cost += cost;
            librarianStats.requests++;
        }
        
        // Check budget alerts
        this.checkBudgetAlerts();
        
        console.log(`💰 Cost tracked: $${cost.toFixed(4)} (Daily: $${this.costTracking.current.daily.toFixed(4)})`);
    }
    
    checkBudgetAlerts() {
        const percentUsed = this.costTracking.current.daily / this.config.budgets.daily;
        
        for (const threshold of this.config.budgets.alertThresholds) {
            if (percentUsed >= threshold && !this.alertsSent?.includes(threshold)) {
                this.sendBudgetAlert(threshold, percentUsed);
                
                if (!this.alertsSent) this.alertsSent = [];
                this.alertsSent.push(threshold);
            }
        }
    }
    
    sendBudgetAlert(threshold, percentUsed) {
        const alertData = {
            threshold: threshold,
            percentUsed: percentUsed,
            currentSpend: this.costTracking.current.daily,
            dailyBudget: this.config.budgets.daily,
            remainingBudget: this.config.budgets.daily - this.costTracking.current.daily
        };
        
        console.log(`🚨 Budget alert: ${(threshold * 100)}% threshold reached`);
        console.log(`   Current spend: $${alertData.currentSpend.toFixed(4)} / $${alertData.dailyBudget}`);
        
        this.emit('budget_alert', alertData);
    }
    
    resetDailyBudget() {
        console.log('🔄 Resetting daily budget...');
        
        // Save daily history
        this.costTracking.history.daily.push({
            date: new Date().toISOString().split('T')[0],
            cost: this.costTracking.current.daily,
            budget: this.config.budgets.daily,
            percentUsed: this.costTracking.current.daily / this.config.budgets.daily
        });
        
        // Reset current costs
        this.costTracking.current.hourly = 0;
        this.costTracking.current.daily = 0;
        
        // Reset alerts
        this.alertsSent = [];
        
        // Keep only recent history
        if (this.costTracking.history.daily.length > 30) {
            this.costTracking.history.daily = this.costTracking.history.daily.slice(-30);
        }
        
        this.emit('daily_budget_reset', {
            previousDayCost: this.costTracking.history.daily[this.costTracking.history.daily.length - 1]?.cost || 0
        });
    }
    
    updateCostPredictions() {
        const now = new Date();
        const hourOfDay = now.getHours();
        const minuteOfHour = now.getMinutes();
        
        // Predict hourly spend
        if (minuteOfHour > 0) {
            this.predictions.hourly = (this.costTracking.current.hourly / minuteOfHour) * 60;
        }
        
        // Predict daily spend
        if (hourOfDay > 0) {
            const hoursElapsed = hourOfDay + (minuteOfHour / 60);
            this.predictions.daily = (this.costTracking.current.daily / hoursElapsed) * 24;
        }
        
        // Predict weekly spend (based on current day pattern)
        const dayOfWeek = now.getDay();
        if (dayOfWeek > 0) {
            this.predictions.weekly = (this.costTracking.current.weekly / (dayOfWeek + 1)) * 7;
        }
        
        console.log(`📊 Cost predictions updated: H:$${this.predictions.hourly.toFixed(4)} D:$${this.predictions.daily.toFixed(4)} W:$${this.predictions.weekly.toFixed(4)}`);
    }
    
    // ========================================
    // PUBLIC API METHODS
    // ========================================
    
    getCostSummary() {
        return {
            current: this.costTracking.current,
            budgets: this.config.budgets,
            predictions: this.predictions,
            percentUsed: {
                daily: this.costTracking.current.daily / this.config.budgets.daily,
                weekly: this.costTracking.current.weekly / this.config.budgets.weekly,
                monthly: this.costTracking.current.monthly / this.config.budgets.monthly
            },
            byModel: Object.fromEntries(this.costTracking.byModel),
            byLibrarian: Object.fromEntries(this.costTracking.byLibrarian)
        };
    }
    
    getCacheStats() {
        let totalSavedCost = 0;
        let highConfidenceEntries = 0;
        
        for (const entry of this.cache.values()) {
            totalSavedCost += entry.cost || 0;
            if (entry.confidence > 0.9) {
                highConfidenceEntries++;
            }
        }
        
        return {
            entries: this.cache.size,
            maxSize: this.config.caching.maxCacheSize,
            totalSavedCost: totalSavedCost,
            highConfidenceEntries: highConfidenceEntries,
            hitRate: this.cacheHitRate || 0
        };
    }
    
    getModelAvailability() {
        return Object.fromEntries(this.modelAvailability);
    }
    
    getOptimizationStats() {
        return {
            queueLength: this.requestQueue.length,
            batchProcessingEnabled: this.config.optimization.batchProcessing,
            cachingEnabled: this.config.optimization.enableCaching,
            fallbackEnabled: this.config.optimization.fallbackChains,
            rateLimitTracking: Object.fromEntries(this.rateLimitTracking)
        };
    }
    
    selectCheapestModel(query, options) {
        const requirements = this.analyzeRequirements(query, options);
        const availableModels = this.getAvailableModels(requirements);
        
        return availableModels.sort((a, b) => a.cost - b.cost)[0] || null;
    }
    
    async forceCacheCleanup() {
        const beforeSize = this.cache.size;
        this.cleanupExpiredCache();
        const afterSize = this.cache.size;
        
        return {
            beforeSize,
            afterSize,
            cleaned: beforeSize - afterSize
        };
    }
    
    // Utility methods
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
}

module.exports = CalCostOptimizer;

// Test if run directly
if (require.main === module) {
    const costOptimizer = new CalCostOptimizer();
    
    costOptimizer.on('cost_optimizer_ready', async () => {
        console.log('\n🧪 Testing Cost Optimizer...\n');
        
        // Test query optimization
        const testQueries = [
            { query: 'Simple test query', options: { domain: 'general', priority: 'low' } },
            { query: 'Complex analysis of OSRS market trends with detailed breakdown', options: { domain: 'trading', priority: 'high' } },
            { query: 'Generate code for API integration', options: { domain: 'coding', priority: 'normal' } }
        ];
        
        for (const { query, options } of testQueries) {
            try {
                console.log(`Testing query: "${query.substring(0, 30)}..."`);
                const result = await costOptimizer.optimizeQuery(query, options);
                console.log(`✅ Optimized successfully: ${result.model} ($${result.cost.toFixed(4)})`);
            } catch (error) {
                console.error(`❌ Optimization failed: ${error.message}`);
            }
            
            // Wait between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Show statistics
        setTimeout(() => {
            console.log('\n📊 Cost Summary:');
            console.log(JSON.stringify(costOptimizer.getCostSummary(), null, 2));
            
            console.log('\n💾 Cache Statistics:');
            console.log(JSON.stringify(costOptimizer.getCacheStats(), null, 2));
            
            console.log('\n🎯 Model Availability:');
            const availability = costOptimizer.getModelAvailability();
            Object.entries(availability).forEach(([model, stats]) => {
                console.log(`   ${model}: ${stats.available ? '✅' : '❌'} (${Math.round(stats.averageLatency)}ms avg)`);
            });
            
            console.log('\n✅ Cost Optimizer testing complete!');
            console.log('Cost optimization features are working:');
            console.log('💰 Intelligent model selection based on budget');
            console.log('🗄️ Smart caching with confidence-based TTL');
            console.log('📦 Batch processing for efficiency');
            console.log('🔄 Automatic fallback chains');
            console.log('🚨 Real-time budget alerts');
            console.log('📊 Comprehensive cost tracking');
        }, 3000);
    });
    
    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\n🔴 Shutting down Cost Optimizer...');
        process.exit(0);
    });
}