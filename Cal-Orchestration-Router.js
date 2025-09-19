/**
 * Cal Orchestration Router
 * Enables Cal to orchestrate calls to external platforms, tools, and services
 * Acts as a universal routing layer for Cal's multi-platform capabilities
 */

const EventEmitter = require('events');

class CalOrchestrationRouter extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 30000,
            enableCaching: config.enableCaching !== false,
            enableRateLimiting: config.enableRateLimiting !== false,
            enableCircuitBreaker: config.enableCircuitBreaker !== false
        };
        
        // Service registry
        this.services = new Map();
        this.serviceHealth = new Map();
        
        // Protocol handlers
        this.protocolHandlers = {
            rest: new RESTHandler(),
            graphql: new GraphQLHandler(),
            websocket: new WebSocketHandler(),
            grpc: new GRPCHandler(),
            mqtt: new MQTTHandler(),
            redis: new RedisHandler()
        };
        
        // Routing rules
        this.routingRules = new Map();
        this.intentMappings = new Map();
        
        // Circuit breaker states
        this.circuitBreakers = new Map();
        
        // Rate limiters
        this.rateLimiters = new Map();
        
        // Response cache
        this.responseCache = new Map();
        this.cacheExpiry = new Map();
        
        // Middleware stack
        this.middleware = [];
        
        // Initialize default routes
        this.initializeDefaultRoutes();
        
        console.log('🚀 Cal Orchestration Router initialized with multi-protocol support');
    }

    /**
     * Initialize default service routes
     */
    initializeDefaultRoutes() {
        // Development services
        this.registerService('github', {
            protocol: 'rest',
            baseUrl: 'https://api.github.com',
            auth: { type: 'token', header: 'Authorization' },
            rateLimit: { requests: 5000, window: 3600000 }
        });
        
        this.registerService('npm', {
            protocol: 'rest',
            baseUrl: 'https://registry.npmjs.org',
            auth: { type: 'none' },
            rateLimit: { requests: 1000, window: 60000 }
        });
        
        // AI services
        this.registerService('openai', {
            protocol: 'rest',
            baseUrl: 'https://api.openai.com/v1',
            auth: { type: 'bearer', header: 'Authorization' },
            rateLimit: { requests: 3000, window: 60000 }
        });
        
        this.registerService('anthropic', {
            protocol: 'rest',
            baseUrl: 'https://api.anthropic.com',
            auth: { type: 'api-key', header: 'x-api-key' },
            rateLimit: { requests: 1000, window: 60000 }
        });
        
        // Cloud platforms
        this.registerService('aws', {
            protocol: 'rest',
            baseUrl: 'https://amazonaws.com',
            auth: { type: 'aws-signature' },
            rateLimit: { requests: 10000, window: 60000 }
        });
        
        this.registerService('gcp', {
            protocol: 'rest',
            baseUrl: 'https://googleapis.com',
            auth: { type: 'oauth2' },
            rateLimit: { requests: 10000, window: 60000 }
        });
        
        // Communication platforms
        this.registerService('discord', {
            protocol: 'websocket',
            baseUrl: 'wss://gateway.discord.gg',
            auth: { type: 'bot-token' },
            rateLimit: { requests: 120, window: 60000 }
        });
        
        this.registerService('slack', {
            protocol: 'websocket',
            baseUrl: 'wss://slack.com/api/rtm',
            auth: { type: 'oauth2' },
            rateLimit: { requests: 1000, window: 60000 }
        });
        
        // Intent mappings
        this.registerIntentMapping('deploy', ['github', 'aws', 'vercel']);
        this.registerIntentMapping('chat', ['discord', 'slack', 'telegram']);
        this.registerIntentMapping('generate', ['openai', 'anthropic', 'replicate']);
        this.registerIntentMapping('analyze', ['aws', 'gcp', 'datadog']);
        this.registerIntentMapping('create', ['github', 'figma', 'notion']);
    }

    /**
     * Register a new service
     */
    registerService(serviceName, config) {
        this.services.set(serviceName, {
            ...config,
            name: serviceName,
            registered: new Date(),
            healthy: true
        });
        
        // Initialize circuit breaker
        if (this.config.enableCircuitBreaker) {
            this.circuitBreakers.set(serviceName, {
                state: 'closed',
                failures: 0,
                lastFailure: null,
                nextRetry: null
            });
        }
        
        // Initialize rate limiter
        if (this.config.enableRateLimiting && config.rateLimit) {
            this.rateLimiters.set(serviceName, {
                ...config.rateLimit,
                tokens: config.rateLimit.requests,
                lastRefill: Date.now()
            });
        }
        
        console.log(`📌 Service registered: ${serviceName}`);
    }

    /**
     * Register intent mapping
     */
    registerIntentMapping(intent, services) {
        this.intentMappings.set(intent, services);
    }

    /**
     * Main orchestration method - Cal calls this
     */
    async orchestrate(request) {
        console.log(`🎯 Orchestrating request: ${request.intent || request.service}`);
        
        try {
            // Apply middleware
            for (const mw of this.middleware) {
                request = await mw.process(request);
            }
            
            // Determine target service(s)
            const targetServices = this.determineTargetServices(request);
            
            // Check cache if enabled
            if (this.config.enableCaching) {
                const cached = this.checkCache(request);
                if (cached) {
                    console.log('📦 Returning cached response');
                    return cached;
                }
            }
            
            // Execute request
            let response;
            if (targetServices.length === 1) {
                response = await this.executeRequest(targetServices[0], request);
            } else {
                response = await this.executeMultiServiceRequest(targetServices, request);
            }
            
            // Cache response
            if (this.config.enableCaching && response.success) {
                this.cacheResponse(request, response);
            }
            
            // Emit orchestration event
            this.emit('orchestration', {
                request,
                response,
                services: targetServices,
                timestamp: new Date()
            });
            
            return response;
            
        } catch (error) {
            console.error('❌ Orchestration error:', error);
            return {
                success: false,
                error: error.message,
                request,
                timestamp: new Date()
            };
        }
    }

    /**
     * Determine which services to use
     */
    determineTargetServices(request) {
        // Direct service specification
        if (request.service) {
            return [request.service];
        }
        
        // Intent-based routing
        if (request.intent && this.intentMappings.has(request.intent)) {
            const services = this.intentMappings.get(request.intent);
            return this.filterHealthyServices(services);
        }
        
        // Pattern-based routing
        for (const [pattern, services] of this.routingRules) {
            if (this.matchesPattern(request, pattern)) {
                return this.filterHealthyServices(services);
            }
        }
        
        throw new Error('No suitable service found for request');
    }

    /**
     * Filter healthy services
     */
    filterHealthyServices(services) {
        return services.filter(service => {
            const circuitBreaker = this.circuitBreakers.get(service);
            return !circuitBreaker || circuitBreaker.state !== 'open';
        });
    }

    /**
     * Execute request on single service
     */
    async executeRequest(serviceName, request) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service not found: ${serviceName}`);
        }
        
        // Check circuit breaker
        if (this.config.enableCircuitBreaker) {
            this.checkCircuitBreaker(serviceName);
        }
        
        // Check rate limit
        if (this.config.enableRateLimiting) {
            await this.checkRateLimit(serviceName);
        }
        
        try {
            // Get protocol handler
            const handler = this.protocolHandlers[service.protocol];
            if (!handler) {
                throw new Error(`Unsupported protocol: ${service.protocol}`);
            }
            
            // Execute request
            const response = await handler.execute(service, request);
            
            // Reset circuit breaker on success
            if (this.config.enableCircuitBreaker) {
                this.resetCircuitBreaker(serviceName);
            }
            
            return {
                success: true,
                service: serviceName,
                response,
                timestamp: new Date()
            };
            
        } catch (error) {
            // Handle circuit breaker
            if (this.config.enableCircuitBreaker) {
                this.tripCircuitBreaker(serviceName, error);
            }
            
            throw error;
        }
    }

    /**
     * Execute request across multiple services
     */
    async executeMultiServiceRequest(services, request) {
        const results = [];
        
        // Parallel execution for independent requests
        if (request.parallel) {
            const promises = services.map(service => 
                this.executeRequest(service, request).catch(err => ({
                    success: false,
                    service,
                    error: err.message
                }))
            );
            
            const responses = await Promise.all(promises);
            return {
                success: responses.some(r => r.success),
                services,
                responses,
                timestamp: new Date()
            };
        }
        
        // Sequential execution with fallback
        for (const service of services) {
            try {
                const response = await this.executeRequest(service, request);
                return response;
            } catch (error) {
                results.push({
                    service,
                    error: error.message
                });
                // Continue to next service
            }
        }
        
        // All services failed
        return {
            success: false,
            services,
            errors: results,
            timestamp: new Date()
        };
    }

    /**
     * Circuit breaker management
     */
    checkCircuitBreaker(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) return;
        
        if (breaker.state === 'open') {
            if (Date.now() < breaker.nextRetry) {
                throw new Error(`Circuit breaker open for ${serviceName}`);
            }
            // Try half-open state
            breaker.state = 'half-open';
        }
    }

    tripCircuitBreaker(serviceName, error) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) return;
        
        breaker.failures++;
        breaker.lastFailure = new Date();
        
        if (breaker.failures >= 5) {
            breaker.state = 'open';
            breaker.nextRetry = Date.now() + 60000; // 1 minute
            console.log(`⚡ Circuit breaker opened for ${serviceName}`);
        }
    }

    resetCircuitBreaker(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) return;
        
        breaker.state = 'closed';
        breaker.failures = 0;
        breaker.lastFailure = null;
    }

    /**
     * Rate limiting
     */
    async checkRateLimit(serviceName) {
        const limiter = this.rateLimiters.get(serviceName);
        if (!limiter) return;
        
        // Refill tokens
        const now = Date.now();
        const elapsed = now - limiter.lastRefill;
        if (elapsed >= limiter.window) {
            limiter.tokens = limiter.requests;
            limiter.lastRefill = now;
        }
        
        // Check tokens
        if (limiter.tokens <= 0) {
            const waitTime = limiter.window - elapsed;
            throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
        }
        
        limiter.tokens--;
    }

    /**
     * Cache management
     */
    checkCache(request) {
        const cacheKey = this.getCacheKey(request);
        const cached = this.responseCache.get(cacheKey);
        
        if (cached) {
            const expiry = this.cacheExpiry.get(cacheKey);
            if (expiry && Date.now() < expiry) {
                return cached;
            }
            // Expired
            this.responseCache.delete(cacheKey);
            this.cacheExpiry.delete(cacheKey);
        }
        
        return null;
    }

    cacheResponse(request, response) {
        const cacheKey = this.getCacheKey(request);
        this.responseCache.set(cacheKey, response);
        this.cacheExpiry.set(cacheKey, Date.now() + 300000); // 5 minutes
    }

    getCacheKey(request) {
        return `${request.service || request.intent}:${JSON.stringify(request.params)}`;
    }

    /**
     * Add middleware
     */
    use(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Get service health
     */
    getServiceHealth() {
        const health = {};
        
        for (const [name, service] of this.services) {
            const breaker = this.circuitBreakers.get(name);
            health[name] = {
                healthy: !breaker || breaker.state === 'closed',
                circuitBreaker: breaker?.state || 'closed',
                failures: breaker?.failures || 0,
                lastFailure: breaker?.lastFailure
            };
        }
        
        return health;
    }
}

// Protocol handlers
class RESTHandler {
    async execute(service, request) {
        // Mock REST implementation
        console.log(`🌐 REST call to ${service.name}: ${request.endpoint || '/'}`);
        return {
            status: 200,
            data: `Mock REST response from ${service.name}`
        };
    }
}

class GraphQLHandler {
    async execute(service, request) {
        console.log(`📊 GraphQL query to ${service.name}`);
        return {
            data: `Mock GraphQL response from ${service.name}`
        };
    }
}

class WebSocketHandler {
    async execute(service, request) {
        console.log(`🔌 WebSocket message to ${service.name}`);
        return {
            type: 'message',
            data: `Mock WebSocket response from ${service.name}`
        };
    }
}

class GRPCHandler {
    async execute(service, request) {
        console.log(`⚡ gRPC call to ${service.name}`);
        return {
            response: `Mock gRPC response from ${service.name}`
        };
    }
}

class MQTTHandler {
    async execute(service, request) {
        console.log(`📡 MQTT publish to ${service.name}`);
        return {
            topic: request.topic,
            published: true
        };
    }
}

class RedisHandler {
    async execute(service, request) {
        console.log(`💾 Redis operation on ${service.name}`);
        return {
            operation: request.operation,
            result: `Mock Redis response`
        };
    }
}

// Orchestration middleware example
class LoggingMiddleware {
    async process(request) {
        console.log(`📝 Request logged: ${JSON.stringify(request)}`);
        request.logged = new Date();
        return request;
    }
}

class AuthenticationMiddleware {
    constructor(authProvider) {
        this.authProvider = authProvider;
    }
    
    async process(request) {
        if (request.requiresAuth) {
            request.auth = await this.authProvider.getAuth(request.service);
        }
        return request;
    }
}

// Cal integration helper
class CalOrchestrationHelper {
    constructor(router) {
        this.router = router;
    }
    
    /**
     * Natural language request processing
     */
    async processNaturalRequest(input) {
        console.log(`🗣️ Processing: "${input}"`);
        
        // Simple intent extraction
        const intent = this.extractIntent(input);
        const params = this.extractParams(input);
        
        return await this.router.orchestrate({
            intent,
            params,
            originalInput: input
        });
    }
    
    extractIntent(input) {
        const intents = {
            deploy: /deploy|push|release/i,
            create: /create|make|build|generate/i,
            analyze: /analyze|check|review|audit/i,
            chat: /send|message|notify|tell/i,
            fetch: /get|fetch|retrieve|download/i
        };
        
        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(input)) {
                return intent;
            }
        }
        
        return 'general';
    }
    
    extractParams(input) {
        // Mock parameter extraction
        return {
            raw: input,
            timestamp: new Date()
        };
    }
}

module.exports = { CalOrchestrationRouter, CalOrchestrationHelper };

// Example usage
if (require.main === module) {
    async function demonstrateOrchestration() {
        console.log('🚀 Cal Orchestration Router Demo\n');
        
        // Initialize router
        const router = new CalOrchestrationRouter();
        
        // Add middleware
        router.use(new LoggingMiddleware());
        
        // Test direct service call
        console.log('=== Direct Service Call ===');
        const githubResult = await router.orchestrate({
            service: 'github',
            endpoint: '/user/repos',
            method: 'GET'
        });
        console.log('GitHub Result:', githubResult);
        
        // Test intent-based routing
        console.log('\n=== Intent-based Routing ===');
        const deployResult = await router.orchestrate({
            intent: 'deploy',
            params: {
                project: 'my-app',
                environment: 'production'
            }
        });
        console.log('Deploy Result:', deployResult);
        
        // Test multi-service orchestration
        console.log('\n=== Multi-Service Orchestration ===');
        const generateResult = await router.orchestrate({
            intent: 'generate',
            params: {
                prompt: 'A futuristic city',
                fallback: true
            }
        });
        console.log('Generate Result:', generateResult);
        
        // Test Cal natural language
        console.log('\n=== Cal Natural Language ===');
        const calHelper = new CalOrchestrationHelper(router);
        const nlResult = await calHelper.processNaturalRequest(
            'Deploy my latest changes to production'
        );
        console.log('Natural Language Result:', nlResult);
        
        // Check service health
        console.log('\n=== Service Health ===');
        const health = router.getServiceHealth();
        console.log('Health Status:', JSON.stringify(health, null, 2));
        
        console.log('\n🎉 Orchestration demo complete!');
    }
    
    demonstrateOrchestration();
}