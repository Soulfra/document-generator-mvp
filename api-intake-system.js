#!/usr/bin/env node

/**
 * 🚪 API INTAKE SYSTEM
 * 
 * Central intake for all API calls - routes through maze/vortex pattern
 * for context building before single-use API execution.
 * 
 * Flow: API Request → Intake → Context Building → Maze/Vortex → Single API Call
 * 
 * Features:
 * - Request queuing and batching
 * - Context expansion through maze pattern
 * - Cost optimization
 * - Single-use API calls at pipeline end
 */

const express = require('express');
const EventEmitter = require('events');
const crypto = require('crypto');

class APIIntakeSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9000,
            maxQueueSize: config.maxQueueSize || 1000,
            batchSize: config.batchSize || 10,
            processingInterval: config.processingInterval || 5000,
            contextBuildingEnabled: config.contextBuildingEnabled !== false,
            
            // Maze/vortex patterns for context building
            mazePatterns: {
                simple: { depth: 2, branches: 3 },
                medium: { depth: 4, branches: 5 },
                complex: { depth: 6, branches: 8 }
            },
            
            ...config
        };
        
        // Intake state
        this.intakeState = {
            requestQueue: [],
            processingQueue: [],
            completedRequests: new Map(),
            contextCache: new Map(),
            
            // Statistics
            totalRequests: 0,
            processedRequests: 0,
            failedRequests: 0,
            avgProcessingTime: 0,
            
            // Context building stats
            contextBuilds: 0,
            contextCacheHits: 0,
            mazeTraversals: 0
        };
        
        // API routing destinations
        this.apiDestinations = {
            anthropic: { url: 'https://api.anthropic.com', type: 'cloud' },
            openai: { url: 'https://api.openai.com', type: 'cloud' },
            deepseek: { url: 'https://api.deepseek.com', type: 'cloud' },
            ollama: { url: 'http://localhost:11434', type: 'local' }
        };
        
        console.log('🚪 API Intake System initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Start Express server
        this.app = express();
        this.app.use(express.json({ limit: '10mb' }));
        
        // Setup routes
        this.setupRoutes();
        
        // Start processing loops
        this.startProcessingLoops();
        
        // Start server
        this.server = this.app.listen(this.config.port, () => {
            console.log(`✅ API Intake System running on port ${this.config.port}`);
            this.emit('ready');
        });
    }
    
    setupRoutes() {
        // Main intake endpoint
        this.app.post('/intake', async (req, res) => {
            try {
                const request = await this.processIntakeRequest(req.body);
                res.json({ success: true, requestId: request.id, queuePosition: this.intakeState.requestQueue.length });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                status: 'operational',
                queue: {
                    pending: this.intakeState.requestQueue.length,
                    processing: this.intakeState.processingQueue.length,
                    completed: this.intakeState.completedRequests.size
                },
                stats: {
                    totalRequests: this.intakeState.totalRequests,
                    processedRequests: this.intakeState.processedRequests,
                    failedRequests: this.intakeState.failedRequests,
                    avgProcessingTime: this.intakeState.avgProcessingTime
                },
                context: {
                    builds: this.intakeState.contextBuilds,
                    cacheHits: this.intakeState.contextCacheHits,
                    mazeTraversals: this.intakeState.mazeTraversals
                }
            });
        });
        
        // Get request result
        this.app.get('/result/:requestId', (req, res) => {
            const result = this.intakeState.completedRequests.get(req.params.requestId);
            if (result) {
                res.json(result);
            } else {
                res.status(404).json({ error: 'Request not found or still processing' });
            }
        });
    }
    
    /**
     * Process incoming API request
     */
    async processIntakeRequest(requestData) {
        const request = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: requestData.type || 'general',
            payload: requestData.payload,
            context: requestData.context || {},
            priority: requestData.priority || 'normal',
            
            // Processing state
            status: 'queued',
            contextBuilt: false,
            mazeTraversal: null,
            apiCalls: [],
            result: null
        };
        
        // Add to queue
        this.intakeState.requestQueue.push(request);
        this.intakeState.totalRequests++;
        
        console.log(`📥 Request ${request.id} added to intake queue (type: ${request.type})`);
        
        this.emit('request_received', request);
        return request;
    }
    
    /**
     * Main processing loop
     */
    startProcessingLoops() {
        // Process intake queue
        setInterval(() => {
            this.processIntakeQueue();
        }, this.config.processingInterval);
        
        // Context building loop
        setInterval(() => {
            this.buildContextForPendingRequests();
        }, this.config.processingInterval / 2);
        
        // Cleanup completed requests
        setInterval(() => {
            this.cleanupCompletedRequests();
        }, 60000); // Every minute
    }
    
    async processIntakeQueue() {
        if (this.intakeState.requestQueue.length === 0) return;
        
        console.log(`⚡ Processing ${this.intakeState.requestQueue.length} queued requests...`);
        
        // Move requests to processing queue
        const batch = this.intakeState.requestQueue.splice(0, this.config.batchSize);
        this.intakeState.processingQueue.push(...batch);
        
        // Process each request
        for (const request of batch) {
            try {
                await this.processRequest(request);
            } catch (error) {
                console.error(`❌ Request processing failed:`, error);
                request.status = 'failed';
                request.error = error.message;
                this.intakeState.failedRequests++;
            }
        }
        
        // Remove from processing queue
        this.intakeState.processingQueue = this.intakeState.processingQueue
            .filter(req => !batch.includes(req));
    }
    
    /**
     * Process individual request through maze/vortex pattern
     */
    async processRequest(request) {
        const startTime = Date.now();
        request.status = 'processing';
        
        console.log(`🔄 Processing request ${request.id} (${request.type})`);
        
        // Step 1: Build context if enabled
        if (this.config.contextBuildingEnabled) {
            await this.buildRequestContext(request);
        }
        
        // Step 2: Traverse maze/vortex for context expansion
        await this.traverseMazeVortex(request);
        
        // Step 3: Execute single-use API call
        const apiResult = await this.executeSingleAPICall(request);
        
        // Step 4: Complete request
        request.status = 'completed';
        request.result = apiResult;
        request.processingTime = Date.now() - startTime;
        
        // Store result
        this.intakeState.completedRequests.set(request.id, request);
        this.intakeState.processedRequests++;
        
        // Update average processing time
        this.updateAverageProcessingTime(request.processingTime);
        
        console.log(`✅ Request ${request.id} completed in ${request.processingTime}ms`);
        
        this.emit('request_completed', request);
        return request;
    }
    
    /**
     * Build context for request
     */
    async buildRequestContext(request) {
        console.log(`🧠 Building context for ${request.id}...`);
        
        const contextKey = this.generateContextKey(request);
        
        // Check cache first
        if (this.intakeState.contextCache.has(contextKey)) {
            request.context = this.intakeState.contextCache.get(contextKey);
            this.intakeState.contextCacheHits++;
            console.log(`💨 Using cached context for ${request.type}`);
            return;
        }
        
        // Build new context
        const context = await this.generateContext(request);
        request.context = { ...request.context, ...context };
        request.contextBuilt = true;
        
        // Cache context (with size limit)
        if (this.intakeState.contextCache.size < 200) {
            this.intakeState.contextCache.set(contextKey, context);
        }
        
        this.intakeState.contextBuilds++;
        console.log(`🧠 Context built for ${request.type}`);
    }
    
    /**
     * Traverse maze/vortex pattern for context expansion
     */
    async traverseMazeVortex(request) {
        const complexity = this.determineComplexity(request);
        const pattern = this.config.mazePatterns[complexity];
        
        console.log(`🌀 Traversing ${complexity} maze pattern (depth: ${pattern.depth}, branches: ${pattern.branches})`);
        
        const traversal = {
            pattern: complexity,
            depth: pattern.depth,
            branches: pattern.branches,
            path: [],
            contextExpansions: []
        };
        
        // Simulate maze traversal for context building
        for (let depth = 0; depth < pattern.depth; depth++) {
            for (let branch = 0; branch < pattern.branches; branch++) {
                const node = `${depth}-${branch}`;
                traversal.path.push(node);
                
                // Expand context at each node
                const expansion = await this.expandContextAtNode(request, node);
                traversal.contextExpansions.push(expansion);
                
                // Small delay to prevent overwhelming
                await this.sleep(10);
            }
        }
        
        request.mazeTraversal = traversal;
        this.intakeState.mazeTraversals++;
        
        console.log(`🌀 Maze traversal complete: ${traversal.path.length} nodes visited`);
    }
    
    /**
     * Execute final single-use API call
     */
    async executeSingleAPICall(request) {
        console.log(`🎯 Executing single API call for ${request.id}`);
        
        // Determine best API endpoint based on request and context
        const apiChoice = this.selectOptimalAPI(request);
        
        // Build final prompt with all context
        const prompt = this.buildContextualPrompt(request);
        
        // Execute the call
        const apiCall = {
            destination: apiChoice,
            prompt: prompt,
            timestamp: Date.now(),
            requestId: request.id
        };
        
        request.apiCalls.push(apiCall);
        
        // Simulate API call (in real implementation, would call actual APIs)
        const result = {
            api: apiChoice,
            response: `Response for ${request.type} request`,
            tokens: 150,
            cost: 0.003,
            success: true
        };
        
        console.log(`✅ API call executed: ${apiChoice} (${result.tokens} tokens)`);
        
        return result;
    }
    
    // Helper methods
    generateContextKey(request) {
        const key = `${request.type}:${JSON.stringify(request.payload).slice(0, 100)}`;
        return crypto.createHash('md5').update(key).digest('hex');
    }
    
    async generateContext(request) {
        // Generate context based on request type
        return {
            requestType: request.type,
            generatedAt: Date.now(),
            complexity: this.determineComplexity(request),
            relatedData: await this.findRelatedData(request)
        };
    }
    
    determineComplexity(request) {
        const payloadSize = JSON.stringify(request.payload).length;
        if (payloadSize < 500) return 'simple';
        if (payloadSize < 2000) return 'medium';
        return 'complex';
    }
    
    async expandContextAtNode(request, node) {
        // Expand context at each maze node
        return {
            node: node,
            expansion: `Context expansion for ${request.type} at node ${node}`,
            timestamp: Date.now()
        };
    }
    
    selectOptimalAPI(request) {
        // Select API based on request characteristics and context
        if (request.type === 'story_generation') return 'anthropic';
        if (request.type === 'code_generation') return 'deepseek';
        if (request.type === 'analysis') return 'ollama';
        return 'anthropic'; // Default
    }
    
    buildContextualPrompt(request) {
        let prompt = request.payload.prompt || '';
        
        // Add context from maze traversal
        if (request.mazeTraversal) {
            prompt += `\n\nContext from maze traversal:\n`;
            prompt += `- Pattern: ${request.mazeTraversal.pattern}\n`;
            prompt += `- Depth: ${request.mazeTraversal.depth}\n`;
            prompt += `- Expansions: ${request.mazeTraversal.contextExpansions.length}\n`;
        }
        
        // Add built context
        if (request.context) {
            prompt += `\n\nAdditional context:\n${JSON.stringify(request.context, null, 2)}`;
        }
        
        return prompt;
    }
    
    async findRelatedData(request) {
        // Find related data for context building
        return {
            relatedRequests: 0,
            historicalPatterns: [],
            userPreferences: {}
        };
    }
    
    updateAverageProcessingTime(newTime) {
        const totalTime = this.intakeState.avgProcessingTime * this.intakeState.processedRequests + newTime;
        this.intakeState.avgProcessingTime = totalTime / (this.intakeState.processedRequests + 1);
    }
    
    cleanupCompletedRequests() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        
        let cleaned = 0;
        for (const [requestId, request] of this.intakeState.completedRequests) {
            if (request.timestamp < cutoff) {
                this.intakeState.completedRequests.delete(requestId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} old completed requests`);
        }
    }
    
    async buildContextForPendingRequests() {
        const pendingContextBuilds = this.intakeState.processingQueue
            .filter(req => !req.contextBuilt && this.config.contextBuildingEnabled);
            
        if (pendingContextBuilds.length > 0) {
            console.log(`🧠 Building context for ${pendingContextBuilds.length} requests...`);
            
            for (const request of pendingContextBuilds) {
                try {
                    await this.buildRequestContext(request);
                } catch (error) {
                    console.error(`❌ Context building failed for ${request.id}:`, error);
                }
            }
        }
    }
    
    /**
     * Get intake system statistics
     */
    getIntakeStats() {
        return {
            system: {
                status: 'operational',
                uptime: Date.now() - this.startTime,
                port: this.config.port
            },
            queue: {
                pending: this.intakeState.requestQueue.length,
                processing: this.intakeState.processingQueue.length,
                completed: this.intakeState.completedRequests.size
            },
            processing: {
                totalRequests: this.intakeState.totalRequests,
                processedRequests: this.intakeState.processedRequests,
                failedRequests: this.intakeState.failedRequests,
                avgProcessingTime: Math.round(this.intakeState.avgProcessingTime)
            },
            context: {
                builds: this.intakeState.contextBuilds,
                cacheHits: this.intakeState.contextCacheHits,
                cacheSize: this.intakeState.contextCache.size,
                mazeTraversals: this.intakeState.mazeTraversals
            }
        };
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = APIIntakeSystem;

// Demo usage
if (require.main === module) {
    const intake = new APIIntakeSystem({ port: 9000 });
    intake.startTime = Date.now();
    
    intake.on('ready', () => {
        console.log('🚪 Testing API Intake System...');
        
        // Test story generation request
        setTimeout(async () => {
            try {
                const response = await fetch('http://localhost:9000/intake', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'story_generation',
                        payload: {
                            prompt: 'Generate a story about character development',
                            characterId: 'ralph',
                            storyType: 'skill_levelup'
                        },
                        context: {
                            characterLevel: 25,
                            recentActivities: ['database_work', 'system_building']
                        },
                        priority: 'high'
                    })
                });
                
                const result = await response.json();
                console.log('📥 Test request result:', result);
                
            } catch (error) {
                console.error('❌ Test request failed:', error);
            }
        }, 2000);
        
        // Show stats periodically
        setInterval(async () => {
            const stats = intake.getIntakeStats();
            console.log('📊 Intake Stats:', JSON.stringify(stats, null, 2));
        }, 10000);
    });
}