// api-cerberus-core.js - Centralized API Guardian System
// The three-headed guard dog of API operations

const EventEmitter = require('events');
const Redis = require('redis');
const axios = require('axios');
const crypto = require('crypto');

console.log(`
🐕‍🦺 API CERBERUS CORE 🐕‍🦺
The three heads guard:
1. Rate Limiting & Quotas
2. Error Handling & Recovery  
3. Security & Validation
`);

class APICerberusCore extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            redisUrl: config.redisUrl || 'redis://localhost:6379',
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
            circuitBreakerTimeout: config.circuitBreakerTimeout || 60000,
            defaultRateLimit: config.defaultRateLimit || 100,
            burstAllowance: config.burstAllowance || 20,
            ...config
        };
        
        // Three heads of Cerberus
        this.heads = {
            rateLimiter: new RateLimiterHead(this),
            errorHandler: new ErrorHandlerHead(this),
            securityGuard: new SecurityGuardHead(this)
        };
        
        // Shared state
        this.circuitBreakers = new Map();
        this.errorPatterns = new Map();
        this.apiMetrics = new Map();
        this.securityThreats = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize Redis for distributed state
            this.redis = Redis.createClient({
                url: this.config.redisUrl
            });
            
            await this.redis.connect();
            console.log('✅ Redis connected for distributed state');
            
            // Initialize each head
            await Promise.all([
                this.heads.rateLimiter.initialize(),
                this.heads.errorHandler.initialize(),
                this.heads.securityGuard.initialize()
            ]);
            
            console.log('🐕‍🦺 Cerberus fully initialized - all three heads active');
            
        } catch (error) {
            console.error('❌ Cerberus initialization failed:', error);
            // Can still operate in degraded mode without Redis
        }
    }
    
    // Main API guard function - all requests pass through here
    async guard(requestConfig) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        
        try {
            // Head 1: Security validation
            await this.heads.securityGuard.validate(requestConfig);
            
            // Head 2: Rate limiting check
            await this.heads.rateLimiter.check(requestConfig);
            
            // Head 3: Circuit breaker check
            const circuitState = await this.heads.errorHandler.checkCircuit(requestConfig.url);
            if (circuitState === 'open') {
                throw new Error(`Circuit breaker OPEN for ${requestConfig.url}`);
            }
            
            // Execute the request with error handling
            const response = await this.executeWithRetry(requestConfig, requestId);
            
            // Record success metrics
            this.recordMetrics(requestConfig, {
                success: true,
                duration: Date.now() - startTime,
                requestId
            });
            
            return response;
            
        } catch (error) {
            // Record failure metrics
            this.recordMetrics(requestConfig, {
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
                requestId
            });
            
            // Let error handler head process it
            return this.heads.errorHandler.handle(error, requestConfig, requestId);
        }
    }
    
    async executeWithRetry(config, requestId, attempt = 1) {
        try {
            // Add Cerberus headers
            config.headers = {
                ...config.headers,
                'X-Cerberus-Request-ID': requestId,
                'X-Cerberus-Attempt': attempt
            };
            
            // Make the actual request
            const response = await axios(config);
            
            // Reset circuit breaker on success
            this.heads.errorHandler.recordSuccess(config.url);
            
            return response;
            
        } catch (error) {
            // Check if we should retry
            if (attempt < this.config.maxRetries && this.shouldRetry(error)) {
                const delay = this.calculateRetryDelay(attempt);
                
                console.log(`🔄 Retrying request ${requestId} (attempt ${attempt + 1}) after ${delay}ms`);
                
                await this.sleep(delay);
                return this.executeWithRetry(config, requestId, attempt + 1);
            }
            
            // Record failure for circuit breaker
            this.heads.errorHandler.recordFailure(config.url, error);
            
            throw error;
        }
    }
    
    shouldRetry(error) {
        // Don't retry client errors (4xx)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
            return false;
        }
        
        // Retry network errors and server errors
        return !error.response || error.response.status >= 500;
    }
    
    calculateRetryDelay(attempt) {
        // Exponential backoff with jitter
        const baseDelay = this.config.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.3 * exponentialDelay;
        
        return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
    }
    
    recordMetrics(config, result) {
        const endpoint = this.extractEndpoint(config.url);
        
        if (!this.apiMetrics.has(endpoint)) {
            this.apiMetrics.set(endpoint, {
                requests: 0,
                successes: 0,
                failures: 0,
                totalDuration: 0,
                errors: new Map()
            });
        }
        
        const metrics = this.apiMetrics.get(endpoint);
        metrics.requests++;
        
        if (result.success) {
            metrics.successes++;
        } else {
            metrics.failures++;
            
            // Track error patterns
            const errorCount = metrics.errors.get(result.error) || 0;
            metrics.errors.set(result.error, errorCount + 1);
        }
        
        metrics.totalDuration += result.duration;
        
        // Emit metrics for monitoring
        this.emit('metrics', {
            endpoint,
            ...result
        });
    }
    
    extractEndpoint(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.hostname}${urlObj.pathname}`;
        } catch {
            return url;
        }
    }
    
    generateRequestId() {
        return `cerberus_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public API for getting system status
    getStatus() {
        return {
            heads: {
                rateLimiter: this.heads.rateLimiter.getStatus(),
                errorHandler: this.heads.errorHandler.getStatus(),
                securityGuard: this.heads.securityGuard.getStatus()
            },
            metrics: Object.fromEntries(
                Array.from(this.apiMetrics.entries()).map(([endpoint, metrics]) => [
                    endpoint,
                    {
                        ...metrics,
                        errors: Object.fromEntries(metrics.errors),
                        averageDuration: metrics.totalDuration / metrics.requests
                    }
                ])
            ),
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            uptime: process.uptime()
        };
    }
}

// Head 1: Rate Limiter
class RateLimiterHead {
    constructor(cerberus) {
        this.cerberus = cerberus;
        this.limits = new Map();
        this.buckets = new Map();
    }
    
    async initialize() {
        console.log('🚦 Rate Limiter head initialized');
    }
    
    async check(config) {
        const key = this.getRateLimitKey(config);
        const limit = this.getLimit(config);
        
        // Token bucket algorithm
        let bucket = this.buckets.get(key);
        
        if (!bucket) {
            bucket = {
                tokens: limit.rate,
                lastRefill: Date.now(),
                limit: limit.rate,
                interval: limit.interval
            };
            this.buckets.set(key, bucket);
        }
        
        // Refill tokens
        const now = Date.now();
        const timePassed = now - bucket.lastRefill;
        const tokensToAdd = (timePassed / bucket.interval) * bucket.limit;
        
        bucket.tokens = Math.min(bucket.limit + this.cerberus.config.burstAllowance, 
                                 bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
        
        // Check if request allowed
        if (bucket.tokens < 1) {
            const waitTime = Math.ceil((1 - bucket.tokens) * bucket.interval / bucket.limit);
            
            const error = new Error(`Rate limit exceeded. Try again in ${waitTime}ms`);
            error.code = 'RATE_LIMIT_EXCEEDED';
            error.retryAfter = waitTime;
            
            throw error;
        }
        
        // Consume token
        bucket.tokens--;
        
        return true;
    }
    
    getRateLimitKey(config) {
        // Can be customized based on API key, user ID, IP, etc.
        return config.apiKey || config.userId || 'default';
    }
    
    getLimit(config) {
        // Can have different limits for different endpoints/users
        return {
            rate: config.rateLimit || this.cerberus.config.defaultRateLimit,
            interval: 60000 // 1 minute
        };
    }
    
    getStatus() {
        return {
            activeBuckets: this.buckets.size,
            limits: Object.fromEntries(this.limits)
        };
    }
}

// Head 2: Error Handler
class ErrorHandlerHead {
    constructor(cerberus) {
        this.cerberus = cerberus;
        this.circuitBreakers = new Map();
        this.errorPatterns = new Map();
    }
    
    async initialize() {
        console.log('🚨 Error Handler head initialized');
    }
    
    async checkCircuit(url) {
        const endpoint = this.cerberus.extractEndpoint(url);
        const breaker = this.circuitBreakers.get(endpoint);
        
        if (!breaker) {
            return 'closed';
        }
        
        if (breaker.state === 'open') {
            // Check if timeout has passed
            if (Date.now() - breaker.openedAt > this.cerberus.config.circuitBreakerTimeout) {
                breaker.state = 'half-open';
                breaker.failures = 0;
            }
        }
        
        return breaker.state;
    }
    
    recordSuccess(url) {
        const endpoint = this.cerberus.extractEndpoint(url);
        const breaker = this.circuitBreakers.get(endpoint);
        
        if (breaker && breaker.state === 'half-open') {
            breaker.state = 'closed';
            breaker.failures = 0;
            console.log(`✅ Circuit breaker for ${endpoint} closed`);
        }
    }
    
    recordFailure(url, error) {
        const endpoint = this.cerberus.extractEndpoint(url);
        
        let breaker = this.circuitBreakers.get(endpoint);
        if (!breaker) {
            breaker = {
                state: 'closed',
                failures: 0,
                openedAt: null
            };
            this.circuitBreakers.set(endpoint, breaker);
        }
        
        breaker.failures++;
        
        if (breaker.failures >= this.cerberus.config.circuitBreakerThreshold) {
            breaker.state = 'open';
            breaker.openedAt = Date.now();
            console.log(`🚨 Circuit breaker for ${endpoint} opened after ${breaker.failures} failures`);
        }
        
        // Track error patterns
        this.trackErrorPattern(error);
    }
    
    trackErrorPattern(error) {
        const pattern = this.identifyPattern(error);
        const count = this.errorPatterns.get(pattern) || 0;
        this.errorPatterns.set(pattern, count + 1);
    }
    
    identifyPattern(error) {
        if (error.code === 'ECONNREFUSED') return 'connection_refused';
        if (error.code === 'ETIMEDOUT') return 'timeout';
        if (error.response?.status === 429) return 'rate_limited';
        if (error.response?.status >= 500) return 'server_error';
        if (error.response?.status >= 400) return 'client_error';
        return 'unknown';
    }
    
    async handle(error, config, requestId) {
        console.error(`❌ Request ${requestId} failed:`, error.message);
        
        // Check for specific error patterns and apply recovery strategies
        const pattern = this.identifyPattern(error);
        
        switch (pattern) {
            case 'rate_limited':
                // Wait and retry automatically
                const retryAfter = error.response?.headers['retry-after'] || 60;
                console.log(`⏱️ Rate limited, will retry after ${retryAfter}s`);
                
                await this.cerberus.sleep(retryAfter * 1000);
                return this.cerberus.guard(config);
                
            case 'connection_refused':
            case 'timeout':
                // Try alternative endpoint if available
                if (config.alternativeUrls?.length > 0) {
                    const altUrl = config.alternativeUrls[0];
                    console.log(`🔄 Trying alternative endpoint: ${altUrl}`);
                    
                    config.url = altUrl;
                    config.alternativeUrls = config.alternativeUrls.slice(1);
                    
                    return this.cerberus.guard(config);
                }
                break;
                
            case 'server_error':
                // Return cached response if available
                if (config.allowCached) {
                    const cached = await this.getCachedResponse(config);
                    if (cached) {
                        console.log('📦 Returning cached response');
                        return cached;
                    }
                }
                break;
        }
        
        // If no recovery strategy worked, throw the error
        throw error;
    }
    
    async getCachedResponse(config) {
        // Implementation would check Redis or local cache
        return null;
    }
    
    getStatus() {
        return {
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            errorPatterns: Object.fromEntries(this.errorPatterns)
        };
    }
}

// Head 3: Security Guard
class SecurityGuardHead {
    constructor(cerberus) {
        this.cerberus = cerberus;
        this.validationRules = new Map();
        this.threats = new Map();
    }
    
    async initialize() {
        this.setupValidationRules();
        console.log('🛡️ Security Guard head initialized');
    }
    
    setupValidationRules() {
        // SQL Injection patterns
        this.validationRules.set('sql_injection', [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
            /(-{2}|\/\*|\*\/)/,
            /(';|";|`)/
        ]);
        
        // XSS patterns
        this.validationRules.set('xss', [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ]);
        
        // Path traversal
        this.validationRules.set('path_traversal', [
            /\.\.\//g,
            /\.\.%2[fF]/g
        ]);
    }
    
    async validate(config) {
        // Validate URL
        this.validateUrl(config.url);
        
        // Validate headers
        if (config.headers) {
            this.validateHeaders(config.headers);
        }
        
        // Validate body/params
        if (config.data) {
            this.validateData(config.data);
        }
        
        if (config.params) {
            this.validateData(config.params);
        }
        
        // Check for authentication
        if (!config.skipAuth && !this.hasAuthentication(config)) {
            throw new Error('Authentication required');
        }
        
        return true;
    }
    
    validateUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Check for suspicious patterns
            if (urlObj.hostname === 'localhost' && !this.cerberus.config.allowLocalhost) {
                this.recordThreat('localhost_access', url);
                throw new Error('Localhost access not allowed');
            }
            
            // Check for private IPs
            if (this.isPrivateIP(urlObj.hostname)) {
                this.recordThreat('private_ip_access', url);
                throw new Error('Private IP access not allowed');
            }
            
        } catch (error) {
            if (error.message.includes('Invalid URL')) {
                throw new Error('Invalid URL format');
            }
            throw error;
        }
    }
    
    validateHeaders(headers) {
        for (const [key, value] of Object.entries(headers)) {
            this.validateString(value, `Header ${key}`);
        }
    }
    
    validateData(data) {
        if (typeof data === 'string') {
            this.validateString(data, 'Request data');
        } else if (typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'string') {
                    this.validateString(value, `Field ${key}`);
                }
            }
        }
    }
    
    validateString(str, context) {
        for (const [threatType, patterns] of this.validationRules) {
            for (const pattern of patterns) {
                if (pattern.test(str)) {
                    this.recordThreat(threatType, str);
                    throw new Error(`Security threat detected: ${threatType} in ${context}`);
                }
            }
        }
    }
    
    hasAuthentication(config) {
        return !!(
            config.headers?.authorization ||
            config.headers?.['x-api-key'] ||
            config.apiKey ||
            config.auth
        );
    }
    
    isPrivateIP(hostname) {
        const privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./
        ];
        
        return privateRanges.some(range => range.test(hostname));
    }
    
    recordThreat(type, data) {
        const count = this.threats.get(type) || 0;
        this.threats.set(type, count + 1);
        
        console.warn(`⚠️ Security threat detected: ${type}`);
        
        this.cerberus.emit('security-threat', {
            type,
            data: data.substring(0, 100), // Truncate for safety
            timestamp: new Date()
        });
    }
    
    getStatus() {
        return {
            threats: Object.fromEntries(this.threats),
            rulesActive: this.validationRules.size
        };
    }
}

// Export the Cerberus
module.exports = APICerberusCore;

// Example usage
if (require.main === module) {
    const cerberus = new APICerberusCore({
        defaultRateLimit: 60,
        maxRetries: 3,
        circuitBreakerThreshold: 5
    });
    
    // Example guarded request
    async function makeGuardedRequest() {
        try {
            const response = await cerberus.guard({
                url: 'https://api.example.com/data',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer token123'
                },
                alternativeUrls: [
                    'https://api-backup.example.com/data'
                ],
                allowCached: true,
                rateLimit: 100
            });
            
            console.log('✅ Request successful:', response.data);
            
        } catch (error) {
            console.error('❌ Request failed after all attempts:', error.message);
        }
    }
    
    // Monitor metrics
    cerberus.on('metrics', (metrics) => {
        console.log('📊 Metrics:', metrics);
    });
    
    cerberus.on('security-threat', (threat) => {
        console.log('🚨 Security threat:', threat);
    });
    
    // Status endpoint for monitoring
    setInterval(() => {
        console.log('📈 Cerberus Status:', JSON.stringify(cerberus.getStatus(), null, 2));
    }, 30000);
}