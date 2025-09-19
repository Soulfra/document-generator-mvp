#!/usr/bin/env node

/**
 * 🛡️ RESILIENT API WRAPPER
 * 
 * A comprehensive API wrapper that gracefully handles errors and continues operating
 * - Implements retry logic with exponential backoff
 * - Circuit breaker pattern for failing endpoints
 * - Automatic fallback to cached data
 * - Request queuing for failed operations
 * - Integration with existing error handling systems
 * 
 * "Rolling through" API errors like a tank!
 */

const EventEmitter = require('events');
const axios = require('axios');
const RedisPriceCache = require('./redis-price-cache');
const APIErrorPatterns = require('./api-error-patterns');
const ProactiveErrorPrevention = require('./proactive-error-prevention');

class ResilientAPIWrapper extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Configuration
        this.config = {
            maxRetries: options.maxRetries || 3,
            initialRetryDelay: options.initialRetryDelay || 1000,
            maxRetryDelay: options.maxRetryDelay || 30000,
            backoffMultiplier: options.backoffMultiplier || 2,
            jitterFactor: options.jitterFactor || 0.1,
            circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
            circuitBreakerTimeout: options.circuitBreakerTimeout || 60000,
            requestTimeout: options.requestTimeout || 10000,
            cacheEnabled: options.cacheEnabled !== false,
            queueEnabled: options.queueEnabled !== false,
            maxQueueSize: options.maxQueueSize || 1000,
            ...options
        };
        
        // Core components
        this.cache = options.cache || new RedisPriceCache();
        this.errorPatterns = new APIErrorPatterns();
        this.proactiveErrorPrevention = new ProactiveErrorPrevention();
        
        // Circuit breakers per endpoint
        this.circuitBreakers = new Map();
        
        // Request queue for failed operations
        this.requestQueue = [];
        this.isProcessingQueue = false;
        
        // Metrics tracking
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            retriedRequests: 0,
            cachedResponses: 0,
            queuedRequests: 0,
            circuitBreakerTrips: 0
        };
        
        // Endpoint health tracking
        this.endpointHealth = new Map();
        
        console.log('🛡️ RESILIENT API WRAPPER');
        console.log(`⚡ Max retries: ${this.config.maxRetries}`);
        console.log(`🔄 Circuit breaker threshold: ${this.config.circuitBreakerThreshold}`);
        console.log(`💾 Cache enabled: ${this.config.cacheEnabled}`);
        console.log(`📋 Queue enabled: ${this.config.queueEnabled}`);
        
        this.initialize();
    }
    
    /**
     * 🚀 Initialize the wrapper
     */
    async initialize() {
        try {
            // Initialize cache if enabled
            if (this.config.cacheEnabled) {
                await this.cache.connect();
                console.log('✅ Cache connected');
            }
            
            // Start queue processor
            if (this.config.queueEnabled) {
                this.startQueueProcessor();
                console.log('✅ Queue processor started');
            }
            
            // Setup error pattern monitoring
            this.setupErrorMonitoring();
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            console.log('✅ Resilient API Wrapper initialized');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Resilient API Wrapper:', error);
            // Continue anyway - we're resilient!
            this.emit('ready');
        }
    }
    
    /**
     * 🎯 Main fetch method with resilience
     */
    async fetch(options) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        
        // Normalize options
        const config = {
            url: options.url || options,
            method: options.method || 'GET',
            headers: options.headers || {},
            data: options.data,
            params: options.params,
            timeout: options.timeout || this.config.requestTimeout,
            maxRetries: options.maxRetries ?? this.config.maxRetries,
            fallbackToCache: options.fallbackToCache ?? true,
            queueOnFailure: options.queueOnFailure ?? true,
            priority: options.priority || 'normal',
            cacheKey: options.cacheKey || this.generateCacheKey(options),
            ...options
        };
        
        this.metrics.totalRequests++;
        
        console.log(`🔄 [${requestId}] Fetching: ${config.url}`);
        
        try {
            // Check circuit breaker
            const breaker = this.getCircuitBreaker(config.url);
            if (breaker.isOpen()) {
                console.log(`🚫 [${requestId}] Circuit breaker OPEN for ${config.url}`);
                return this.handleCircuitBreakerOpen(config);
            }
            
            // Try to fetch with retries
            const response = await this.fetchWithRetry(config, requestId);
            
            // Success - record metrics
            this.metrics.successfulRequests++;
            breaker.recordSuccess();
            this.recordEndpointHealth(config.url, true, Date.now() - startTime);
            
            // Cache successful response
            if (this.config.cacheEnabled && config.method === 'GET') {
                await this.cacheResponse(config.cacheKey, response.data);
            }
            
            return {
                success: true,
                data: response.data,
                confidence: 100,
                fromCache: false,
                latency: Date.now() - startTime,
                requestId
            };
            
        } catch (error) {
            console.error(`❌ [${requestId}] Failed after all attempts:`, error.message);
            
            // Record failure
            this.metrics.failedRequests++;
            const breaker = this.getCircuitBreaker(config.url);
            breaker.recordFailure();
            this.recordEndpointHealth(config.url, false, Date.now() - startTime);
            
            // Analyze error
            const errorAnalysis = await this.errorPatterns.analyzeError(error, {
                endpoint: config.url,
                method: config.method,
                attempts: config.maxRetries
            });
            
            // Try recovery strategies
            return this.handleFailure(config, error, errorAnalysis, requestId);
        }
    }
    
    /**
     * 🔄 Fetch with retry logic
     */
    async fetchWithRetry(config, requestId, attempt = 1) {
        try {
            console.log(`📡 [${requestId}] Attempt ${attempt}/${config.maxRetries + 1}`);
            
            // Make the actual request
            const response = await axios({
                url: config.url,
                method: config.method,
                headers: config.headers,
                data: config.data,
                params: config.params,
                timeout: config.timeout,
                validateStatus: (status) => status >= 200 && status < 500 // Don't throw on 4xx
            });
            
            // Check for rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers['retry-after'];
                throw new Error(`Rate limited. Retry after: ${retryAfter || 'unknown'}`);
            }
            
            // Check for server errors
            if (response.status >= 500) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            // Enhance error with response data if available
            if (error.response) {
                error.status = error.response.status;
                error.headers = error.response.headers;
            }
            
            // Check if we should retry
            if (attempt <= config.maxRetries && this.shouldRetry(error)) {
                const delay = this.calculateRetryDelay(attempt, error);
                console.log(`⏱️ [${requestId}] Retrying in ${delay}ms...`);
                
                this.metrics.retriedRequests++;
                await this.sleep(delay);
                
                return this.fetchWithRetry(config, requestId, attempt + 1);
            }
            
            throw error;
        }
    }
    
    /**
     * ⚡ Handle circuit breaker open state
     */
    async handleCircuitBreakerOpen(config) {
        this.metrics.circuitBreakerTrips++;
        
        // Try cache first
        if (this.config.cacheEnabled && config.fallbackToCache) {
            const cached = await this.getCachedResponse(config.cacheKey);
            if (cached) {
                console.log('💾 Using cached response (circuit breaker open)');
                return {
                    success: true,
                    data: cached,
                    confidence: 70,
                    fromCache: true,
                    reason: 'circuit_breaker_open'
                };
            }
        }
        
        // Queue for later if enabled
        if (this.config.queueEnabled && config.queueOnFailure) {
            this.queueRequest(config);
            return {
                success: false,
                queued: true,
                reason: 'circuit_breaker_open',
                confidence: 0
            };
        }
        
        // No fallback available
        return {
            success: false,
            error: 'Circuit breaker open - endpoint temporarily unavailable',
            confidence: 0
        };
    }
    
    /**
     * 🛡️ Handle failure with fallback strategies
     */
    async handleFailure(config, error, errorAnalysis, requestId) {
        console.log(`🛡️ [${requestId}] Executing fallback strategies...`);
        
        // Try cache if available
        if (this.config.cacheEnabled && config.fallbackToCache) {
            const cached = await this.getCachedResponse(config.cacheKey);
            if (cached) {
                console.log('💾 Using cached response as fallback');
                this.metrics.cachedResponses++;
                
                return {
                    success: true,
                    data: cached,
                    confidence: this.calculateCacheConfidence(config.cacheKey),
                    fromCache: true,
                    error: error.message,
                    errorAnalysis
                };
            }
        }
        
        // Queue for later retry if enabled
        if (this.config.queueEnabled && config.queueOnFailure) {
            const queued = this.queueRequest(config);
            if (queued) {
                console.log(`📋 [${requestId}] Request queued for retry`);
                return {
                    success: false,
                    queued: true,
                    error: error.message,
                    errorAnalysis,
                    confidence: 0
                };
            }
        }
        
        // Complete failure
        return {
            success: false,
            error: error.message,
            errorAnalysis,
            confidence: 0
        };
    }
    
    /**
     * 🎯 Determine if error is retryable
     */
    shouldRetry(error) {
        // Network errors - always retry
        if (error.code && ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(error.code)) {
            return true;
        }
        
        // HTTP status codes
        if (error.status) {
            // Rate limiting - retry with backoff
            if (error.status === 429) return true;
            
            // Server errors - retry
            if (error.status >= 500) return true;
            
            // Client errors - don't retry (except timeouts)
            if (error.status >= 400 && error.status < 500) {
                return error.status === 408; // Request timeout
            }
        }
        
        // Timeout errors
        if (error.message && error.message.includes('timeout')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * ⏱️ Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(attempt, error) {
        // Honor Retry-After header if present
        if (error.headers && error.headers['retry-after']) {
            const retryAfter = error.headers['retry-after'];
            if (!isNaN(retryAfter)) {
                return parseInt(retryAfter) * 1000;
            }
            // Parse date
            const retryDate = new Date(retryAfter).getTime();
            if (!isNaN(retryDate)) {
                return Math.max(0, retryDate - Date.now());
            }
        }
        
        // Exponential backoff with jitter
        const baseDelay = this.config.initialRetryDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
        const maxDelay = Math.min(baseDelay, this.config.maxRetryDelay);
        
        // Add jitter to prevent thundering herd
        const jitter = maxDelay * this.config.jitterFactor * (Math.random() * 2 - 1);
        
        return Math.max(0, Math.floor(maxDelay + jitter));
    }
    
    /**
     * 🔌 Get or create circuit breaker for endpoint
     */
    getCircuitBreaker(url) {
        const endpoint = this.getEndpointKey(url);
        
        if (!this.circuitBreakers.has(endpoint)) {
            this.circuitBreakers.set(endpoint, new CircuitBreaker({
                threshold: this.config.circuitBreakerThreshold,
                timeout: this.config.circuitBreakerTimeout,
                endpoint
            }));
        }
        
        return this.circuitBreakers.get(endpoint);
    }
    
    /**
     * 📋 Queue request for later retry
     */
    queueRequest(config) {
        if (this.requestQueue.length >= this.config.maxQueueSize) {
            console.warn('⚠️ Request queue full, dropping request');
            return false;
        }
        
        this.requestQueue.push({
            config,
            queuedAt: Date.now(),
            attempts: 0
        });
        
        this.metrics.queuedRequests++;
        this.emit('request:queued', config);
        
        return true;
    }
    
    /**
     * 🔄 Process queued requests
     */
    startQueueProcessor() {
        setInterval(async () => {
            if (this.isProcessingQueue || this.requestQueue.length === 0) {
                return;
            }
            
            this.isProcessingQueue = true;
            
            try {
                // Process up to 10 requests per batch
                const batch = this.requestQueue.splice(0, 10);
                
                for (const item of batch) {
                    // Skip if too old (> 5 minutes)
                    if (Date.now() - item.queuedAt > 300000) {
                        console.log('🗑️ Dropping stale queued request');
                        continue;
                    }
                    
                    console.log('📤 Processing queued request:', item.config.url);
                    
                    try {
                        // Try to fetch again
                        const result = await this.fetch({
                            ...item.config,
                            queueOnFailure: false // Don't re-queue
                        });
                        
                        this.emit('queued:success', { config: item.config, result });
                    } catch (error) {
                        console.error('Failed to process queued request:', error.message);
                        
                        // Re-queue if not too many attempts
                        if (item.attempts < 3) {
                            item.attempts++;
                            this.requestQueue.push(item);
                        }
                    }
                }
            } finally {
                this.isProcessingQueue = false;
            }
        }, 10000); // Process queue every 10 seconds
    }
    
    /**
     * 💾 Cache operations
     */
    async cacheResponse(key, data) {
        try {
            await this.cache.setPriceData(key, {
                data,
                timestamp: Date.now(),
                ttl: 300 // 5 minutes default
            });
        } catch (error) {
            console.warn('Failed to cache response:', error.message);
        }
    }
    
    async getCachedResponse(key) {
        try {
            const cached = await this.cache.getPriceData(key);
            if (cached && cached.data) {
                return cached.data;
            }
        } catch (error) {
            console.warn('Failed to get cached response:', error.message);
        }
        return null;
    }
    
    calculateCacheConfidence(key) {
        // In real implementation, calculate based on age of cached data
        // For now, return a reasonable default
        return 75;
    }
    
    /**
     * 📊 Health monitoring
     */
    recordEndpointHealth(url, success, latency) {
        const endpoint = this.getEndpointKey(url);
        
        if (!this.endpointHealth.has(endpoint)) {
            this.endpointHealth.set(endpoint, {
                successCount: 0,
                failureCount: 0,
                totalLatency: 0,
                samples: []
            });
        }
        
        const health = this.endpointHealth.get(endpoint);
        
        if (success) {
            health.successCount++;
        } else {
            health.failureCount++;
        }
        
        health.totalLatency += latency;
        health.samples.push({ success, latency, timestamp: Date.now() });
        
        // Keep only last 100 samples
        if (health.samples.length > 100) {
            health.samples = health.samples.slice(-100);
        }
    }
    
    startHealthMonitoring() {
        setInterval(() => {
            const summary = this.getHealthSummary();
            this.emit('health:update', summary);
            
            // Log if any endpoints are unhealthy
            for (const [endpoint, health] of Object.entries(summary.endpoints)) {
                if (health.successRate < 0.5) {
                    console.warn(`⚠️ Endpoint unhealthy: ${endpoint} (${(health.successRate * 100).toFixed(1)}% success rate)`);
                }
            }
        }, 60000); // Every minute
    }
    
    /**
     * 🔧 Setup error monitoring integration
     */
    setupErrorMonitoring() {
        // Listen to error pattern events
        this.errorPatterns.on('error-storm', (event) => {
            console.log('⚡ Error storm detected, increasing circuit breaker sensitivity');
            // Temporarily reduce circuit breaker threshold
            for (const breaker of this.circuitBreakers.values()) {
                breaker.threshold = Math.max(1, breaker.threshold - 2);
            }
        });
        
        // Listen to proactive prevention events
        this.proactiveErrorPrevention.on('threshold:exceeded', (event) => {
            if (event.type === 'response_time') {
                console.log('⏱️ Response times increasing, adjusting timeouts');
                this.config.requestTimeout = Math.min(30000, this.config.requestTimeout * 1.5);
            }
        });
    }
    
    /**
     * 📊 Get metrics and health status
     */
    getMetrics() {
        const totalRequests = this.metrics.totalRequests || 1; // Avoid division by zero
        
        return {
            ...this.metrics,
            successRate: this.metrics.successfulRequests / totalRequests,
            cacheHitRate: this.metrics.cachedResponses / totalRequests,
            retryRate: this.metrics.retriedRequests / totalRequests,
            queuedRate: this.metrics.queuedRequests / totalRequests,
            circuitBreakerTripRate: this.metrics.circuitBreakerTrips / totalRequests
        };
    }
    
    getHealthSummary() {
        const endpoints = {};
        
        for (const [endpoint, health] of this.endpointHealth) {
            const totalRequests = health.successCount + health.failureCount;
            
            endpoints[endpoint] = {
                successRate: totalRequests > 0 ? health.successCount / totalRequests : 0,
                avgLatency: totalRequests > 0 ? health.totalLatency / totalRequests : 0,
                totalRequests,
                circuitBreakerStatus: this.circuitBreakers.get(endpoint)?.getState() || 'closed'
            };
        }
        
        return {
            metrics: this.getMetrics(),
            endpoints,
            queueLength: this.requestQueue.length,
            timestamp: new Date()
        };
    }
    
    /**
     * 🛠️ Utility methods
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateCacheKey(config) {
        const url = typeof config === 'string' ? config : config.url;
        const method = config.method || 'GET';
        const params = config.params ? JSON.stringify(config.params) : '';
        
        return `${method}:${url}:${params}`;
    }
    
    getEndpointKey(url) {
        try {
            const parsed = new URL(url);
            return `${parsed.hostname}${parsed.pathname}`;
        } catch {
            return url;
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 🧹 Cleanup
     */
    async cleanup() {
        console.log('🧹 Cleaning up Resilient API Wrapper...');
        
        // Disconnect cache
        if (this.config.cacheEnabled) {
            await this.cache.disconnect();
        }
        
        // Clear queues
        this.requestQueue = [];
        
        console.log('✅ Cleanup complete');
    }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
    constructor(config) {
        this.threshold = config.threshold || 5;
        this.timeout = config.timeout || 60000;
        this.endpoint = config.endpoint;
        
        this.state = 'closed'; // closed, open, half-open
        this.failures = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
    }
    
    recordSuccess() {
        this.failures = 0;
        this.successCount++;
        
        if (this.state === 'half-open') {
            console.log(`✅ Circuit breaker closing for ${this.endpoint}`);
            this.state = 'closed';
        }
    }
    
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.threshold) {
            console.log(`🚫 Circuit breaker opening for ${this.endpoint}`);
            this.state = 'open';
            this.nextAttemptTime = Date.now() + this.timeout;
        }
    }
    
    isOpen() {
        if (this.state === 'closed') {
            return false;
        }
        
        if (this.state === 'open' && Date.now() >= this.nextAttemptTime) {
            console.log(`🔄 Circuit breaker half-opening for ${this.endpoint}`);
            this.state = 'half-open';
            return false;
        }
        
        return this.state === 'open';
    }
    
    getState() {
        return this.state;
    }
    
    reset() {
        this.state = 'closed';
        this.failures = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
    }
}

module.exports = ResilientAPIWrapper;