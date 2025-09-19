// api-error-patterns.js - Error Pattern Recognition and Recovery
// Intelligent error handling with pattern matching and automatic recovery

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

console.log(`
🔍 API ERROR PATTERNS 🔍
Pattern recognition system:
- Common error detection
- Automatic retry strategies
- Circuit breaker patterns
- Fallback mechanisms
- Error aggregation
`);

class APIErrorPatterns extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            patternHistorySize: config.patternHistorySize || 1000,
            patternThreshold: config.patternThreshold || 5,
            recoveryStrategies: config.recoveryStrategies || 'default',
            aggregationWindow: config.aggregationWindow || 300000, // 5 minutes
            ...config
        };
        
        // Error pattern definitions
        this.patterns = this.defineErrorPatterns();
        
        // Pattern history for learning
        this.patternHistory = [];
        this.patternCounts = new Map();
        
        // Recovery strategies
        this.recoveryStrategies = this.defineRecoveryStrategies();
        
        // Circuit breaker states
        this.circuitBreakers = new Map();
        
        // Error aggregation
        this.errorAggregates = new Map();
        
        // Start pattern analysis
        this.startPatternAnalysis();
    }
    
    defineErrorPatterns() {
        return {
            // Network errors
            connectionRefused: {
                matches: [
                    { code: 'ECONNREFUSED' },
                    { message: /connection refused/i }
                ],
                category: 'network',
                severity: 'high',
                recovery: ['retry', 'fallback', 'circuit-breaker']
            },
            
            timeout: {
                matches: [
                    { code: 'ETIMEDOUT' },
                    { code: 'ESOCKETTIMEDOUT' },
                    { message: /timeout/i }
                ],
                category: 'network',
                severity: 'medium',
                recovery: ['retry-exponential', 'increase-timeout', 'fallback']
            },
            
            dnsFailure: {
                matches: [
                    { code: 'ENOTFOUND' },
                    { code: 'ENODATA' },
                    { message: /getaddrinfo/i }
                ],
                category: 'network',
                severity: 'high',
                recovery: ['dns-cache', 'fallback-ip', 'wait-retry']
            },
            
            // Rate limiting
            rateLimited: {
                matches: [
                    { status: 429 },
                    { message: /rate limit/i },
                    { message: /too many requests/i }
                ],
                category: 'rate-limit',
                severity: 'low',
                recovery: ['honor-retry-after', 'backoff', 'queue']
            },
            
            quotaExceeded: {
                matches: [
                    { status: 402 },
                    { message: /quota exceeded/i },
                    { message: /payment required/i }
                ],
                category: 'quota',
                severity: 'medium',
                recovery: ['notify-user', 'use-cache', 'degrade-gracefully']
            },
            
            // Authentication errors
            unauthorized: {
                matches: [
                    { status: 401 },
                    { message: /unauthorized/i },
                    { message: /invalid token/i }
                ],
                category: 'auth',
                severity: 'high',
                recovery: ['refresh-token', 'reauth', 'notify-user']
            },
            
            forbidden: {
                matches: [
                    { status: 403 },
                    { message: /forbidden/i },
                    { message: /access denied/i }
                ],
                category: 'auth',
                severity: 'high',
                recovery: ['check-permissions', 'notify-user', 'log-security']
            },
            
            // Server errors
            internalServerError: {
                matches: [
                    { status: 500 },
                    { message: /internal server error/i }
                ],
                category: 'server',
                severity: 'high',
                recovery: ['retry-once', 'fallback', 'circuit-breaker']
            },
            
            serviceUnavailable: {
                matches: [
                    { status: 503 },
                    { message: /service unavailable/i },
                    { message: /maintenance/i }
                ],
                category: 'server',
                severity: 'medium',
                recovery: ['wait-retry', 'fallback', 'use-cache']
            },
            
            badGateway: {
                matches: [
                    { status: 502 },
                    { message: /bad gateway/i }
                ],
                category: 'server',
                severity: 'high',
                recovery: ['retry', 'different-route', 'circuit-breaker']
            },
            
            // Data errors
            invalidJson: {
                matches: [
                    { message: /unexpected token/i },
                    { message: /json parse error/i },
                    { name: 'SyntaxError' }
                ],
                category: 'data',
                severity: 'medium',
                recovery: ['validate-response', 'request-retry', 'log-corrupt']
            },
            
            schemaValidation: {
                matches: [
                    { status: 422 },
                    { message: /validation error/i },
                    { message: /invalid schema/i }
                ],
                category: 'data',
                severity: 'low',
                recovery: ['fix-data', 'notify-user', 'log-validation']
            },
            
            // Resource errors
            notFound: {
                matches: [
                    { status: 404 },
                    { message: /not found/i }
                ],
                category: 'resource',
                severity: 'low',
                recovery: ['check-url', 'use-default', 'notify-user']
            },
            
            conflict: {
                matches: [
                    { status: 409 },
                    { message: /conflict/i },
                    { message: /already exists/i }
                ],
                category: 'resource',
                severity: 'medium',
                recovery: ['resolve-conflict', 'retry-modified', 'notify-user']
            },
            
            // System errors
            outOfMemory: {
                matches: [
                    { message: /out of memory/i },
                    { code: 'ENOMEM' }
                ],
                category: 'system',
                severity: 'critical',
                recovery: ['reduce-load', 'garbage-collect', 'restart-service']
            },
            
            diskFull: {
                matches: [
                    { code: 'ENOSPC' },
                    { message: /no space left/i }
                ],
                category: 'system',
                severity: 'critical',
                recovery: ['cleanup-disk', 'notify-ops', 'degrade-service']
            }
        };
    }
    
    defineRecoveryStrategies() {
        return {
            // Retry strategies
            'retry': {
                action: async (error, context) => {
                    console.log('♻️ Retrying request...');
                    return { retry: true, delay: 1000 };
                }
            },
            
            'retry-once': {
                action: async (error, context) => {
                    if ((context.attempts || 0) >= 1) {
                        return { retry: false };
                    }
                    return { retry: true, delay: 2000 };
                }
            },
            
            'retry-exponential': {
                action: async (error, context) => {
                    const attempt = context.attempts || 0;
                    if (attempt >= 5) {
                        return { retry: false };
                    }
                    
                    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
                    console.log(`♻️ Exponential backoff: ${delay}ms`);
                    
                    return { retry: true, delay };
                }
            },
            
            'honor-retry-after': {
                action: async (error, context) => {
                    const retryAfter = error.response?.headers?.['retry-after'];
                    
                    if (retryAfter) {
                        const delay = isNaN(retryAfter) ? 
                            new Date(retryAfter).getTime() - Date.now() :
                            parseInt(retryAfter) * 1000;
                        
                        console.log(`⏱️ Honoring Retry-After: ${delay}ms`);
                        return { retry: true, delay };
                    }
                    
                    return { retry: true, delay: 60000 };
                }
            },
            
            // Fallback strategies
            'fallback': {
                action: async (error, context) => {
                    if (context.fallbackUrl) {
                        console.log('🔄 Using fallback URL');
                        return { 
                            fallback: true, 
                            url: context.fallbackUrl 
                        };
                    }
                    
                    return { fallback: false };
                }
            },
            
            'use-cache': {
                action: async (error, context) => {
                    if (context.cache && context.cacheKey) {
                        const cached = await context.cache.get(context.cacheKey);
                        
                        if (cached) {
                            console.log('📦 Using cached response');
                            return { 
                                useCache: true, 
                                data: cached,
                                warning: 'Using cached data due to error'
                            };
                        }
                    }
                    
                    return { useCache: false };
                }
            },
            
            // Circuit breaker strategies
            'circuit-breaker': {
                action: async (error, context) => {
                    const endpoint = context.endpoint || context.url;
                    const breaker = this.getCircuitBreaker(endpoint);
                    
                    breaker.recordFailure();
                    
                    if (breaker.isOpen()) {
                        console.log('🚫 Circuit breaker OPEN');
                        return { 
                            circuitOpen: true,
                            waitTime: breaker.getRemainingTimeout()
                        };
                    }
                    
                    return { circuitOpen: false };
                }
            },
            
            // Auth strategies
            'refresh-token': {
                action: async (error, context) => {
                    if (context.refreshToken && context.tokenRefresher) {
                        try {
                            console.log('🔐 Refreshing authentication token');
                            const newToken = await context.tokenRefresher(context.refreshToken);
                            
                            return {
                                tokenRefreshed: true,
                                newToken,
                                retry: true
                            };
                        } catch (refreshError) {
                            console.error('Token refresh failed:', refreshError);
                        }
                    }
                    
                    return { tokenRefreshed: false };
                }
            },
            
            // Notification strategies
            'notify-user': {
                action: async (error, context) => {
                    this.emit('user-notification', {
                        type: 'error',
                        error: error.message,
                        context
                    });
                    
                    return { notified: true };
                }
            },
            
            'notify-ops': {
                action: async (error, context) => {
                    this.emit('ops-alert', {
                        severity: 'critical',
                        error: error.message,
                        context,
                        timestamp: new Date()
                    });
                    
                    return { opsNotified: true };
                }
            },
            
            // Data strategies
            'fix-data': {
                action: async (error, context) => {
                    if (context.data && context.dataFixer) {
                        try {
                            const fixedData = await context.dataFixer(context.data, error);
                            
                            return {
                                dataFixed: true,
                                data: fixedData,
                                retry: true
                            };
                        } catch (fixError) {
                            console.error('Data fix failed:', fixError);
                        }
                    }
                    
                    return { dataFixed: false };
                }
            },
            
            // Degradation strategies
            'degrade-gracefully': {
                action: async (error, context) => {
                    console.log('⬇️ Degrading service gracefully');
                    
                    return {
                        degraded: true,
                        features: context.degradedFeatures || ['advanced-processing'],
                        message: 'Service running with reduced functionality'
                    };
                }
            }
        };
    }
    
    // Analyze error and identify pattern
    async analyzeError(error, context = {}) {
        const analysis = {
            error,
            context,
            timestamp: new Date(),
            pattern: null,
            recovery: [],
            aggregateId: null
        };
        
        // Find matching pattern
        for (const [patternName, pattern] of Object.entries(this.patterns)) {
            if (this.matchesPattern(error, pattern)) {
                analysis.pattern = {
                    name: patternName,
                    ...pattern
                };
                break;
            }
        }
        
        // Record pattern occurrence
        if (analysis.pattern) {
            this.recordPattern(analysis.pattern.name);
            
            // Get recovery strategies
            analysis.recovery = await this.getRecoveryStrategies(
                analysis.pattern,
                error,
                context
            );
        }
        
        // Aggregate similar errors
        analysis.aggregateId = this.aggregateError(error, analysis.pattern);
        
        // Check for error storms
        this.checkErrorStorm(analysis);
        
        // Emit analysis event
        this.emit('error-analyzed', analysis);
        
        return analysis;
    }
    
    matchesPattern(error, pattern) {
        for (const match of pattern.matches) {
            let isMatch = true;
            
            for (const [key, value] of Object.entries(match)) {
                if (key === 'status' && error.response?.status !== value) {
                    isMatch = false;
                    break;
                }
                
                if (key === 'code' && error.code !== value) {
                    isMatch = false;
                    break;
                }
                
                if (key === 'message' && !value.test(error.message)) {
                    isMatch = false;
                    break;
                }
                
                if (key === 'name' && error.name !== value) {
                    isMatch = false;
                    break;
                }
            }
            
            if (isMatch) return true;
        }
        
        return false;
    }
    
    recordPattern(patternName) {
        // Add to history
        this.patternHistory.push({
            pattern: patternName,
            timestamp: Date.now()
        });
        
        // Trim history
        if (this.patternHistory.length > this.config.patternHistorySize) {
            this.patternHistory.shift();
        }
        
        // Update counts
        const count = (this.patternCounts.get(patternName) || 0) + 1;
        this.patternCounts.set(patternName, count);
    }
    
    async getRecoveryStrategies(pattern, error, context) {
        const strategies = [];
        
        for (const strategyName of pattern.recovery) {
            const strategy = this.recoveryStrategies[strategyName];
            
            if (strategy) {
                try {
                    const result = await strategy.action.call(this, error, context);
                    strategies.push({
                        name: strategyName,
                        result
                    });
                } catch (strategyError) {
                    console.error(`Recovery strategy ${strategyName} failed:`, strategyError);
                }
            }
        }
        
        return strategies;
    }
    
    aggregateError(error, pattern) {
        const key = pattern ? 
            `pattern:${pattern.name}` : 
            `error:${error.code || error.message?.substring(0, 50)}`;
        
        const aggregate = this.errorAggregates.get(key) || {
            key,
            count: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            pattern: pattern?.name,
            samples: []
        };
        
        aggregate.count++;
        aggregate.lastSeen = Date.now();
        
        // Keep sample errors
        if (aggregate.samples.length < 5) {
            aggregate.samples.push({
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n'),
                timestamp: Date.now()
            });
        }
        
        this.errorAggregates.set(key, aggregate);
        
        return key;
    }
    
    checkErrorStorm(analysis) {
        const recentErrors = this.patternHistory.filter(
            h => Date.now() - h.timestamp < 60000 // Last minute
        );
        
        if (recentErrors.length > 100) {
            console.warn('⚡ Error storm detected!', {
                errorsPerMinute: recentErrors.length,
                pattern: analysis.pattern?.name
            });
            
            this.emit('error-storm', {
                rate: recentErrors.length,
                pattern: analysis.pattern,
                timestamp: new Date()
            });
        }
    }
    
    getCircuitBreaker(endpoint) {
        if (!this.circuitBreakers.has(endpoint)) {
            this.circuitBreakers.set(endpoint, new CircuitBreaker({
                endpoint,
                threshold: 5,
                timeout: 60000
            }));
        }
        
        return this.circuitBreakers.get(endpoint);
    }
    
    // Execute recovery plan
    async executeRecovery(analysis) {
        const results = {
            attempted: [],
            successful: [],
            failed: []
        };
        
        for (const strategy of analysis.recovery) {
            results.attempted.push(strategy.name);
            
            try {
                const result = strategy.result;
                
                // Handle different recovery actions
                if (result.retry) {
                    results.successful.push({
                        strategy: strategy.name,
                        action: 'retry',
                        delay: result.delay
                    });
                    
                    // Wait before retry
                    await this.sleep(result.delay);
                    return { action: 'retry', delay: result.delay };
                }
                
                if (result.fallback) {
                    results.successful.push({
                        strategy: strategy.name,
                        action: 'fallback',
                        url: result.url
                    });
                    
                    return { action: 'fallback', url: result.url };
                }
                
                if (result.useCache) {
                    results.successful.push({
                        strategy: strategy.name,
                        action: 'cache',
                        data: result.data
                    });
                    
                    return { action: 'cache', data: result.data };
                }
                
                if (result.tokenRefreshed) {
                    results.successful.push({
                        strategy: strategy.name,
                        action: 'token-refresh',
                        retry: true
                    });
                    
                    return { action: 'token-refresh', token: result.newToken };
                }
                
            } catch (error) {
                results.failed.push({
                    strategy: strategy.name,
                    error: error.message
                });
            }
        }
        
        // No recovery strategy succeeded
        return { action: 'none', results };
    }
    
    startPatternAnalysis() {
        // Periodic cleanup of old aggregates
        setInterval(() => {
            const cutoff = Date.now() - this.config.aggregationWindow;
            
            for (const [key, aggregate] of this.errorAggregates) {
                if (aggregate.lastSeen < cutoff) {
                    this.errorAggregates.delete(key);
                }
            }
        }, 60000); // Every minute
        
        // Periodic pattern analysis
        setInterval(() => {
            this.analyzePatternTrends();
        }, 300000); // Every 5 minutes
    }
    
    analyzePatternTrends() {
        const trends = {
            timestamp: new Date(),
            patterns: {},
            aggregates: {},
            recommendations: []
        };
        
        // Analyze pattern frequencies
        for (const [pattern, count] of this.patternCounts) {
            trends.patterns[pattern] = {
                count,
                percentage: (count / this.patternHistory.length) * 100
            };
        }
        
        // Analyze aggregates
        for (const [key, aggregate] of this.errorAggregates) {
            if (aggregate.count > this.config.patternThreshold) {
                trends.aggregates[key] = {
                    count: aggregate.count,
                    duration: aggregate.lastSeen - aggregate.firstSeen,
                    rate: aggregate.count / ((aggregate.lastSeen - aggregate.firstSeen) / 1000)
                };
                
                // Generate recommendations
                if (aggregate.pattern === 'timeout') {
                    trends.recommendations.push('Consider increasing timeout values');
                } else if (aggregate.pattern === 'rateLimited') {
                    trends.recommendations.push('Implement request queuing or upgrade API tier');
                } else if (aggregate.pattern === 'connectionRefused') {
                    trends.recommendations.push('Check service health and network connectivity');
                }
            }
        }
        
        this.emit('pattern-trends', trends);
        
        return trends;
    }
    
    // Get error statistics
    getStatistics() {
        const stats = {
            totalErrors: this.patternHistory.length,
            patterns: {},
            aggregates: [],
            circuitBreakers: {},
            trends: {
                last5Minutes: 0,
                last1Hour: 0,
                last24Hours: 0
            }
        };
        
        // Pattern statistics
        for (const [pattern, count] of this.patternCounts) {
            stats.patterns[pattern] = {
                count,
                percentage: (count / this.patternHistory.length) * 100
            };
        }
        
        // Active aggregates
        for (const [key, aggregate] of this.errorAggregates) {
            stats.aggregates.push({
                key,
                count: aggregate.count,
                pattern: aggregate.pattern,
                firstSeen: new Date(aggregate.firstSeen),
                lastSeen: new Date(aggregate.lastSeen)
            });
        }
        
        // Sort aggregates by count
        stats.aggregates.sort((a, b) => b.count - a.count);
        
        // Circuit breaker states
        for (const [endpoint, breaker] of this.circuitBreakers) {
            stats.circuitBreakers[endpoint] = {
                state: breaker.getState(),
                failures: breaker.failures,
                lastFailure: breaker.lastFailure
            };
        }
        
        // Time-based trends
        const now = Date.now();
        stats.trends.last5Minutes = this.patternHistory.filter(
            h => now - h.timestamp < 300000
        ).length;
        
        stats.trends.last1Hour = this.patternHistory.filter(
            h => now - h.timestamp < 3600000
        ).length;
        
        stats.trends.last24Hours = this.patternHistory.filter(
            h => now - h.timestamp < 86400000
        ).length;
        
        return stats;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Simple Circuit Breaker implementation
class CircuitBreaker {
    constructor(config) {
        this.endpoint = config.endpoint;
        this.threshold = config.threshold || 5;
        this.timeout = config.timeout || 60000;
        
        this.state = 'closed'; // closed, open, half-open
        this.failures = 0;
        this.lastFailure = null;
        this.openedAt = null;
    }
    
    recordFailure() {
        this.failures++;
        this.lastFailure = Date.now();
        
        if (this.failures >= this.threshold && this.state === 'closed') {
            this.state = 'open';
            this.openedAt = Date.now();
            console.log(`🚫 Circuit breaker opened for ${this.endpoint}`);
        }
    }
    
    recordSuccess() {
        if (this.state === 'half-open') {
            this.state = 'closed';
            this.failures = 0;
            console.log(`✅ Circuit breaker closed for ${this.endpoint}`);
        }
    }
    
    isOpen() {
        if (this.state === 'open') {
            // Check if timeout has passed
            if (Date.now() - this.openedAt > this.timeout) {
                this.state = 'half-open';
                console.log(`🔄 Circuit breaker half-open for ${this.endpoint}`);
                return false;
            }
            return true;
        }
        
        return false;
    }
    
    getState() {
        return this.state;
    }
    
    getRemainingTimeout() {
        if (this.state === 'open') {
            const remaining = this.timeout - (Date.now() - this.openedAt);
            return Math.max(0, remaining);
        }
        return 0;
    }
}

// Export the error patterns system
module.exports = APIErrorPatterns;

// Example usage
if (require.main === module) {
    const errorPatterns = new APIErrorPatterns();
    
    // Example error analysis
    async function testErrorAnalysis() {
        console.log('\n🧪 Testing error pattern analysis...\n');
        
        // Test different error types
        const errors = [
            { code: 'ECONNREFUSED', message: 'Connection refused' },
            { response: { status: 429 }, message: 'Too many requests' },
            { response: { status: 500 }, message: 'Internal server error' },
            { code: 'ETIMEDOUT', message: 'Request timeout' },
            { response: { status: 401 }, message: 'Invalid token' }
        ];
        
        for (const error of errors) {
            const analysis = await errorPatterns.analyzeError(error, {
                endpoint: '/api/test',
                attempts: 1,
                fallbackUrl: 'https://backup.example.com/api/test'
            });
            
            console.log(`\nError: ${error.message}`);
            console.log(`Pattern: ${analysis.pattern?.name || 'unknown'}`);
            console.log(`Category: ${analysis.pattern?.category || 'unknown'}`);
            console.log(`Recovery strategies: ${analysis.recovery.map(r => r.name).join(', ')}`);
            
            // Execute recovery
            const recovery = await errorPatterns.executeRecovery(analysis);
            console.log(`Recovery action: ${recovery.action}`);
        }
        
        // Show statistics
        console.log('\n📊 Error Pattern Statistics:');
        console.log(JSON.stringify(errorPatterns.getStatistics(), null, 2));
    }
    
    // Monitor events
    errorPatterns.on('error-analyzed', (analysis) => {
        console.log('🔍 Error analyzed:', {
            pattern: analysis.pattern?.name,
            recovery: analysis.recovery.length
        });
    });
    
    errorPatterns.on('error-storm', (storm) => {
        console.log('⚡ ERROR STORM DETECTED!', storm);
    });
    
    errorPatterns.on('pattern-trends', (trends) => {
        console.log('📈 Pattern trends:', trends);
    });
    
    // Run test
    testErrorAnalysis().catch(console.error);
}