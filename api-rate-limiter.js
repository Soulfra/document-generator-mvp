// api-rate-limiter.js - Intelligent Rate Limiting System
// Adaptive throttling based on system resources and user tiers

const Redis = require('redis');
const EventEmitter = require('events');

console.log(`
🚦 API RATE LIMITER 🚦
Smart rate limiting with:
- Token bucket algorithm
- Sliding window counters
- Adaptive throttling
- Burst protection
- User tier management
`);

class APIRateLimiter extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            redisUrl: config.redisUrl || 'redis://localhost:6379',
            
            // Default limits
            defaultLimit: config.defaultLimit || 60,
            defaultWindow: config.defaultWindow || 60000, // 1 minute
            defaultBurst: config.defaultBurst || 10,
            
            // Tier configurations
            tiers: config.tiers || {
                free: {
                    limit: 60,
                    window: 60000,
                    burst: 10,
                    priority: 1
                },
                basic: {
                    limit: 300,
                    window: 60000,
                    burst: 50,
                    priority: 2
                },
                pro: {
                    limit: 1000,
                    window: 60000,
                    burst: 200,
                    priority: 3
                },
                enterprise: {
                    limit: 10000,
                    window: 60000,
                    burst: 1000,
                    priority: 4
                },
                unlimited: {
                    limit: -1, // No limit
                    window: 60000,
                    burst: -1,
                    priority: 5
                }
            },
            
            // Adaptive settings
            adaptiveEnabled: config.adaptiveEnabled !== false,
            loadThresholds: config.loadThresholds || {
                low: 0.3,
                medium: 0.6,
                high: 0.8,
                critical: 0.95
            },
            
            // Endpoint-specific limits
            endpointLimits: config.endpointLimits || {},
            
            ...config
        };
        
        // Rate limiting algorithms
        this.algorithms = {
            tokenBucket: new TokenBucketAlgorithm(this),
            slidingWindow: new SlidingWindowAlgorithm(this),
            fixedWindow: new FixedWindowAlgorithm(this),
            leakyBucket: new LeakyBucketAlgorithm(this)
        };
        
        // Active rate limits
        this.activeLimits = new Map();
        
        // System metrics for adaptive throttling
        this.systemMetrics = {
            cpu: 0,
            memory: 0,
            activeConnections: 0,
            requestQueue: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Connect to Redis
            this.redis = Redis.createClient({
                url: this.config.redisUrl
            });
            
            await this.redis.connect();
            console.log('✅ Redis connected for rate limiting');
            
            // Start monitoring system metrics
            if (this.config.adaptiveEnabled) {
                this.startMetricsMonitoring();
            }
            
            // Clean up expired entries periodically
            setInterval(() => this.cleanupExpiredEntries(), 60000);
            
        } catch (error) {
            console.error('❌ Rate limiter initialization failed:', error);
            // Can still work with in-memory limits
        }
    }
    
    // Main rate limiting check
    async checkLimit(options) {
        const {
            key,           // User ID, API key, IP, etc.
            endpoint,      // Specific endpoint being accessed
            tier = 'free', // User tier
            cost = 1,      // Request cost (some endpoints might cost more)
            algorithm = 'tokenBucket' // Algorithm to use
        } = options;
        
        try {
            // Get the appropriate limits
            const limits = this.getLimits(tier, endpoint);
            
            // Apply adaptive throttling if enabled
            const adjustedLimits = this.config.adaptiveEnabled ? 
                await this.applyAdaptiveThrottling(limits) : limits;
            
            // Check rate limit using specified algorithm
            const result = await this.algorithms[algorithm].check(
                key,
                adjustedLimits,
                cost
            );
            
            // Record metrics
            this.recordLimitCheck(key, endpoint, result);
            
            // If limit exceeded, calculate retry time
            if (!result.allowed) {
                result.retryAfter = await this.calculateRetryAfter(key, adjustedLimits);
                
                this.emit('rate-limit-exceeded', {
                    key,
                    endpoint,
                    tier,
                    limits: adjustedLimits,
                    retryAfter: result.retryAfter
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('Rate limit check error:', error);
            
            // Fail open - allow request if rate limiter fails
            return {
                allowed: true,
                remaining: -1,
                reset: Date.now() + 60000,
                error: error.message
            };
        }
    }
    
    // Get limits for a specific tier and endpoint
    getLimits(tier, endpoint) {
        // Check for endpoint-specific limits first
        if (endpoint && this.config.endpointLimits[endpoint]) {
            const endpointLimit = this.config.endpointLimits[endpoint];
            
            // Merge with tier limits
            const tierLimits = this.config.tiers[tier] || this.config.tiers.free;
            
            return {
                limit: endpointLimit.limit !== undefined ? 
                    endpointLimit.limit : tierLimits.limit,
                window: endpointLimit.window || tierLimits.window,
                burst: endpointLimit.burst !== undefined ? 
                    endpointLimit.burst : tierLimits.burst,
                priority: tierLimits.priority
            };
        }
        
        // Return tier limits
        return this.config.tiers[tier] || this.config.tiers.free;
    }
    
    // Apply adaptive throttling based on system load
    async applyAdaptiveThrottling(limits) {
        const load = this.calculateSystemLoad();
        
        // Don't throttle unlimited tier
        if (limits.limit === -1) {
            return limits;
        }
        
        let multiplier = 1;
        
        if (load >= this.config.loadThresholds.critical) {
            multiplier = 0.1; // 10% of normal limit
            console.warn('🚨 Critical load - heavy throttling applied');
        } else if (load >= this.config.loadThresholds.high) {
            multiplier = 0.5; // 50% of normal limit
        } else if (load >= this.config.loadThresholds.medium) {
            multiplier = 0.8; // 80% of normal limit
        }
        
        return {
            ...limits,
            limit: Math.ceil(limits.limit * multiplier),
            burst: Math.ceil(limits.burst * multiplier),
            adaptive: true,
            loadLevel: load
        };
    }
    
    calculateSystemLoad() {
        // Weighted average of system metrics
        const weights = {
            cpu: 0.4,
            memory: 0.3,
            activeConnections: 0.2,
            requestQueue: 0.1
        };
        
        return Object.entries(weights).reduce((load, [metric, weight]) => {
            return load + (this.systemMetrics[metric] * weight);
        }, 0);
    }
    
    async calculateRetryAfter(key, limits) {
        // Get current usage
        const usage = await this.algorithms.tokenBucket.getUsage(key);
        
        if (!usage) {
            return limits.window / 1000; // Return window in seconds
        }
        
        // Calculate when enough tokens will be available
        const tokensNeeded = 1;
        const tokensAvailable = limits.limit - usage.used;
        
        if (tokensAvailable >= tokensNeeded) {
            return 0; // Tokens available now
        }
        
        // Calculate refill rate (tokens per second)
        const refillRate = limits.limit / (limits.window / 1000);
        const secondsToWait = (tokensNeeded - tokensAvailable) / refillRate;
        
        return Math.ceil(secondsToWait);
    }
    
    // Update rate limits dynamically
    async updateLimits(tier, newLimits) {
        this.config.tiers[tier] = {
            ...this.config.tiers[tier],
            ...newLimits
        };
        
        console.log(`📝 Updated limits for tier ${tier}:`, newLimits);
        
        this.emit('limits-updated', {
            tier,
            limits: this.config.tiers[tier]
        });
    }
    
    // Get current usage for a key
    async getUsage(key) {
        const usage = {};
        
        for (const [name, algorithm] of Object.entries(this.algorithms)) {
            usage[name] = await algorithm.getUsage(key);
        }
        
        return usage;
    }
    
    // Reset limits for a specific key
    async resetLimit(key) {
        for (const algorithm of Object.values(this.algorithms)) {
            await algorithm.reset(key);
        }
        
        console.log(`🔄 Reset rate limits for ${key}`);
        
        this.emit('limit-reset', { key });
    }
    
    // Monitor system metrics for adaptive throttling
    startMetricsMonitoring() {
        setInterval(() => {
            // In real implementation, would get actual system metrics
            // For now, simulate with random values
            this.systemMetrics = {
                cpu: Math.random() * 0.9, // 0-90% CPU
                memory: Math.random() * 0.8, // 0-80% memory
                activeConnections: Math.random() * 0.7,
                requestQueue: Math.random() * 0.5
            };
            
            const load = this.calculateSystemLoad();
            
            if (load > this.config.loadThresholds.high) {
                console.warn(`⚠️ High system load detected: ${(load * 100).toFixed(1)}%`);
            }
            
        }, 5000); // Check every 5 seconds
    }
    
    // Clean up expired rate limit entries
    async cleanupExpiredEntries() {
        if (!this.redis) return;
        
        try {
            // Implementation would scan and remove expired keys
            const cleaned = await this.redis.eval(`
                local keys = redis.call('keys', 'ratelimit:*')
                local deleted = 0
                for i=1,#keys do
                    local ttl = redis.call('ttl', keys[i])
                    if ttl == -1 then
                        redis.call('expire', keys[i], 3600)
                        deleted = deleted + 1
                    end
                end
                return deleted
            `, 0);
            
            if (cleaned > 0) {
                console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
            }
            
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
    
    recordLimitCheck(key, endpoint, result) {
        // Record metrics for monitoring
        if (!this.activeLimits.has(key)) {
            this.activeLimits.set(key, {
                checks: 0,
                allowed: 0,
                blocked: 0,
                endpoints: new Map()
            });
        }
        
        const stats = this.activeLimits.get(key);
        stats.checks++;
        
        if (result.allowed) {
            stats.allowed++;
        } else {
            stats.blocked++;
        }
        
        // Track per-endpoint stats
        const endpointStats = stats.endpoints.get(endpoint) || { checks: 0, blocked: 0 };
        endpointStats.checks++;
        if (!result.allowed) endpointStats.blocked++;
        stats.endpoints.set(endpoint, endpointStats);
    }
    
    // Get rate limiting statistics
    getStatistics() {
        const stats = {
            activeKeys: this.activeLimits.size,
            totalChecks: 0,
            totalAllowed: 0,
            totalBlocked: 0,
            blockRate: 0,
            topBlockedKeys: [],
            topBlockedEndpoints: new Map(),
            systemLoad: this.calculateSystemLoad(),
            adaptiveThrottling: this.config.adaptiveEnabled
        };
        
        // Aggregate statistics
        for (const [key, keyStats] of this.activeLimits) {
            stats.totalChecks += keyStats.checks;
            stats.totalAllowed += keyStats.allowed;
            stats.totalBlocked += keyStats.blocked;
            
            // Track top blocked keys
            if (keyStats.blocked > 0) {
                stats.topBlockedKeys.push({
                    key,
                    blocked: keyStats.blocked,
                    rate: keyStats.blocked / keyStats.checks
                });
            }
            
            // Aggregate endpoint stats
            for (const [endpoint, endpointStats] of keyStats.endpoints) {
                const existing = stats.topBlockedEndpoints.get(endpoint) || { checks: 0, blocked: 0 };
                existing.checks += endpointStats.checks;
                existing.blocked += endpointStats.blocked;
                stats.topBlockedEndpoints.set(endpoint, existing);
            }
        }
        
        // Calculate block rate
        stats.blockRate = stats.totalChecks > 0 ? 
            stats.totalBlocked / stats.totalChecks : 0;
        
        // Sort top blocked
        stats.topBlockedKeys.sort((a, b) => b.blocked - a.blocked);
        stats.topBlockedKeys = stats.topBlockedKeys.slice(0, 10);
        
        // Convert endpoint map to sorted array
        stats.topBlockedEndpoints = Array.from(stats.topBlockedEndpoints.entries())
            .map(([endpoint, stats]) => ({ endpoint, ...stats }))
            .sort((a, b) => b.blocked - a.blocked)
            .slice(0, 10);
        
        return stats;
    }
}

// Token Bucket Algorithm
class TokenBucketAlgorithm {
    constructor(limiter) {
        this.limiter = limiter;
    }
    
    async check(key, limits, cost = 1) {
        const bucketKey = `ratelimit:token:${key}`;
        const now = Date.now();
        
        try {
            // Get current bucket state
            let bucket = await this.getBucket(bucketKey);
            
            if (!bucket) {
                // Initialize new bucket
                bucket = {
                    tokens: limits.limit,
                    lastRefill: now,
                    limit: limits.limit,
                    window: limits.window
                };
            }
            
            // Calculate tokens to add based on time passed
            const timePassed = now - bucket.lastRefill;
            const tokensToAdd = (timePassed / bucket.window) * bucket.limit;
            
            // Refill bucket (with burst allowance)
            bucket.tokens = Math.min(
                bucket.limit + (limits.burst || 0),
                bucket.tokens + tokensToAdd
            );
            bucket.lastRefill = now;
            
            // Check if enough tokens
            if (bucket.tokens >= cost) {
                bucket.tokens -= cost;
                await this.saveBucket(bucketKey, bucket);
                
                return {
                    allowed: true,
                    remaining: Math.floor(bucket.tokens),
                    reset: now + bucket.window,
                    limit: bucket.limit
                };
            }
            
            // Not enough tokens
            await this.saveBucket(bucketKey, bucket);
            
            return {
                allowed: false,
                remaining: Math.floor(bucket.tokens),
                reset: now + bucket.window,
                limit: bucket.limit
            };
            
        } catch (error) {
            console.error('Token bucket error:', error);
            return { allowed: true, error: error.message };
        }
    }
    
    async getBucket(key) {
        if (!this.limiter.redis) {
            // Use in-memory storage
            return this.limiter.activeLimits.get(key);
        }
        
        const data = await this.limiter.redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    
    async saveBucket(key, bucket) {
        if (!this.limiter.redis) {
            // Use in-memory storage
            this.limiter.activeLimits.set(key, bucket);
            return;
        }
        
        await this.limiter.redis.setex(
            key,
            Math.ceil(bucket.window / 1000),
            JSON.stringify(bucket)
        );
    }
    
    async getUsage(key) {
        const bucket = await this.getBucket(`ratelimit:token:${key}`);
        
        if (!bucket) {
            return { used: 0, limit: 0, available: 0 };
        }
        
        return {
            used: bucket.limit - bucket.tokens,
            limit: bucket.limit,
            available: bucket.tokens
        };
    }
    
    async reset(key) {
        const bucketKey = `ratelimit:token:${key}`;
        
        if (!this.limiter.redis) {
            this.limiter.activeLimits.delete(bucketKey);
            return;
        }
        
        await this.limiter.redis.del(bucketKey);
    }
}

// Sliding Window Algorithm
class SlidingWindowAlgorithm {
    constructor(limiter) {
        this.limiter = limiter;
    }
    
    async check(key, limits, cost = 1) {
        const windowKey = `ratelimit:sliding:${key}`;
        const now = Date.now();
        const windowStart = now - limits.window;
        
        try {
            if (!this.limiter.redis) {
                // Simplified in-memory version
                return this.checkInMemory(key, limits, cost);
            }
            
            // Remove old entries
            await this.limiter.redis.zremrangebyscore(windowKey, 0, windowStart);
            
            // Count current entries
            const count = await this.limiter.redis.zcard(windowKey);
            
            if (count < limits.limit) {
                // Add new entry
                await this.limiter.redis.zadd(windowKey, now, `${now}-${Math.random()}`);
                await this.limiter.redis.expire(windowKey, Math.ceil(limits.window / 1000));
                
                return {
                    allowed: true,
                    remaining: limits.limit - count - 1,
                    reset: now + limits.window,
                    limit: limits.limit
                };
            }
            
            return {
                allowed: false,
                remaining: 0,
                reset: now + limits.window,
                limit: limits.limit
            };
            
        } catch (error) {
            console.error('Sliding window error:', error);
            return { allowed: true, error: error.message };
        }
    }
    
    async checkInMemory(key, limits, cost) {
        // Simplified implementation for in-memory
        const bucket = this.limiter.activeLimits.get(key) || { count: 0, window: Date.now() };
        
        if (Date.now() - bucket.window > limits.window) {
            bucket.count = 0;
            bucket.window = Date.now();
        }
        
        if (bucket.count < limits.limit) {
            bucket.count += cost;
            this.limiter.activeLimits.set(key, bucket);
            
            return {
                allowed: true,
                remaining: limits.limit - bucket.count,
                reset: bucket.window + limits.window,
                limit: limits.limit
            };
        }
        
        return {
            allowed: false,
            remaining: 0,
            reset: bucket.window + limits.window,
            limit: limits.limit
        };
    }
    
    async getUsage(key) {
        if (!this.limiter.redis) {
            const bucket = this.limiter.activeLimits.get(key);
            return bucket ? { used: bucket.count, limit: 0 } : { used: 0, limit: 0 };
        }
        
        const windowKey = `ratelimit:sliding:${key}`;
        const count = await this.limiter.redis.zcard(windowKey);
        
        return { used: count, limit: 0 };
    }
    
    async reset(key) {
        if (!this.limiter.redis) {
            this.limiter.activeLimits.delete(key);
            return;
        }
        
        await this.limiter.redis.del(`ratelimit:sliding:${key}`);
    }
}

// Fixed Window Algorithm
class FixedWindowAlgorithm {
    constructor(limiter) {
        this.limiter = limiter;
    }
    
    async check(key, limits, cost = 1) {
        const now = Date.now();
        const window = Math.floor(now / limits.window);
        const windowKey = `ratelimit:fixed:${key}:${window}`;
        
        try {
            let count = 0;
            
            if (this.limiter.redis) {
                count = await this.limiter.redis.incr(windowKey);
                
                if (count === 1) {
                    await this.limiter.redis.expire(windowKey, Math.ceil(limits.window / 1000));
                }
            } else {
                // In-memory fallback
                count = (this.limiter.activeLimits.get(windowKey) || 0) + cost;
                this.limiter.activeLimits.set(windowKey, count);
            }
            
            if (count <= limits.limit) {
                return {
                    allowed: true,
                    remaining: limits.limit - count,
                    reset: (window + 1) * limits.window,
                    limit: limits.limit
                };
            }
            
            return {
                allowed: false,
                remaining: 0,
                reset: (window + 1) * limits.window,
                limit: limits.limit
            };
            
        } catch (error) {
            console.error('Fixed window error:', error);
            return { allowed: true, error: error.message };
        }
    }
    
    async getUsage(key) {
        const now = Date.now();
        const window = Math.floor(now / 60000); // Assuming 1 minute window
        const windowKey = `ratelimit:fixed:${key}:${window}`;
        
        if (!this.limiter.redis) {
            return { used: this.limiter.activeLimits.get(windowKey) || 0, limit: 0 };
        }
        
        const count = await this.limiter.redis.get(windowKey);
        return { used: parseInt(count) || 0, limit: 0 };
    }
    
    async reset(key) {
        // Would need to clear all windows for this key
        if (!this.limiter.redis) {
            // Clear matching keys from memory
            for (const [k] of this.limiter.activeLimits) {
                if (k.startsWith(`ratelimit:fixed:${key}:`)) {
                    this.limiter.activeLimits.delete(k);
                }
            }
            return;
        }
        
        // In Redis, would use SCAN to find and delete all windows
    }
}

// Leaky Bucket Algorithm
class LeakyBucketAlgorithm {
    constructor(limiter) {
        this.limiter = limiter;
    }
    
    async check(key, limits, cost = 1) {
        const bucketKey = `ratelimit:leaky:${key}`;
        const now = Date.now();
        const leakRate = limits.limit / limits.window; // Requests per millisecond
        
        try {
            let bucket = await this.getBucket(bucketKey);
            
            if (!bucket) {
                bucket = {
                    level: 0,
                    lastLeak: now,
                    capacity: limits.limit
                };
            }
            
            // Calculate how much has leaked out
            const timePassed = now - bucket.lastLeak;
            const leaked = timePassed * leakRate;
            
            // Update bucket level
            bucket.level = Math.max(0, bucket.level - leaked);
            bucket.lastLeak = now;
            
            // Check if request fits
            if (bucket.level + cost <= bucket.capacity) {
                bucket.level += cost;
                await this.saveBucket(bucketKey, bucket);
                
                return {
                    allowed: true,
                    remaining: Math.floor(bucket.capacity - bucket.level),
                    reset: now + (bucket.level / leakRate),
                    limit: bucket.capacity
                };
            }
            
            // Bucket is full
            await this.saveBucket(bucketKey, bucket);
            
            return {
                allowed: false,
                remaining: 0,
                reset: now + (bucket.level / leakRate),
                limit: bucket.capacity
            };
            
        } catch (error) {
            console.error('Leaky bucket error:', error);
            return { allowed: true, error: error.message };
        }
    }
    
    async getBucket(key) {
        if (!this.limiter.redis) {
            return this.limiter.activeLimits.get(key);
        }
        
        const data = await this.limiter.redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    
    async saveBucket(key, bucket) {
        if (!this.limiter.redis) {
            this.limiter.activeLimits.set(key, bucket);
            return;
        }
        
        await this.limiter.redis.setex(
            key,
            3600, // 1 hour TTL
            JSON.stringify(bucket)
        );
    }
    
    async getUsage(key) {
        const bucket = await this.getBucket(`ratelimit:leaky:${key}`);
        
        if (!bucket) {
            return { used: 0, limit: 0, level: 0 };
        }
        
        return {
            used: bucket.level,
            limit: bucket.capacity,
            level: bucket.level
        };
    }
    
    async reset(key) {
        const bucketKey = `ratelimit:leaky:${key}`;
        
        if (!this.limiter.redis) {
            this.limiter.activeLimits.delete(bucketKey);
            return;
        }
        
        await this.limiter.redis.del(bucketKey);
    }
}

// Export the rate limiter
module.exports = APIRateLimiter;

// Example usage
if (require.main === module) {
    const limiter = new APIRateLimiter({
        tiers: {
            free: { limit: 10, window: 60000, burst: 5 },
            pro: { limit: 100, window: 60000, burst: 20 }
        },
        endpointLimits: {
            '/api/generate': { limit: 5, window: 60000 }, // Expensive endpoint
            '/api/health': { limit: 1000, window: 60000 } // Cheap endpoint
        }
    });
    
    // Test rate limiting
    async function testRateLimit() {
        const userId = 'user123';
        const endpoint = '/api/generate';
        
        console.log('\n🧪 Testing rate limits...\n');
        
        // Make multiple requests
        for (let i = 0; i < 15; i++) {
            const result = await limiter.checkLimit({
                key: userId,
                endpoint: endpoint,
                tier: 'free',
                algorithm: 'tokenBucket'
            });
            
            console.log(`Request ${i + 1}: ${result.allowed ? '✅' : '❌'} ` +
                       `(remaining: ${result.remaining})`);
            
            if (!result.allowed) {
                console.log(`  Retry after: ${result.retryAfter}s`);
            }
            
            // Simulate some delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Show statistics
        console.log('\n📊 Rate Limiting Statistics:');
        console.log(JSON.stringify(limiter.getStatistics(), null, 2));
    }
    
    // Monitor events
    limiter.on('rate-limit-exceeded', (data) => {
        console.log('🚫 Rate limit exceeded:', data);
    });
    
    limiter.on('limits-updated', (data) => {
        console.log('📝 Limits updated:', data);
    });
    
    // Run test
    testRateLimit().catch(console.error);
}