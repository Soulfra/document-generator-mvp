#!/usr/bin/env node

/**
 * ⚡🌊 RIGID-TO-FLUID CONNECTOR
 * 
 * Connects rigid APIs to the fluid state manager
 * Transforms API calls into state events that flow through the system
 */

const axios = require('axios');
const WebSocket = require('ws');

class RigidToFluidConnector {
    constructor(options = {}) {
        this.stateManagerUrl = options.stateManagerUrl || 'ws://localhost:4001';
        this.apis = new Map();
        this.ws = null;
        this.reconnectInterval = 5000;
        this.eventQueue = [];
        
        console.log('⚡🌊 RIGID-TO-FLUID CONNECTOR');
        console.log('===========================');
        console.log('Bridging rigid APIs to fluid state');
    }
    
    /**
     * Initialize connector
     */
    async initialize() {
        // Connect to fluid state manager
        await this.connectToStateManager();
        
        // Setup API interceptors
        this.setupAPIInterceptors();
        
        console.log('✅ Connector initialized');
    }
    
    /**
     * Connect to fluid state manager via WebSocket
     */
    async connectToStateManager() {
        return new Promise((resolve) => {
            console.log(`🔌 Connecting to state manager at ${this.stateManagerUrl}...`);
            
            this.ws = new WebSocket(this.stateManagerUrl);
            
            this.ws.on('open', () => {
                console.log('✅ Connected to fluid state manager');
                
                // Process queued events
                while (this.eventQueue.length > 0) {
                    const event = this.eventQueue.shift();
                    this.emitToFluidState(event);
                }
                
                resolve();
            });
            
            this.ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleStateUpdate(message);
            });
            
            this.ws.on('close', () => {
                console.log('❌ Disconnected from state manager, reconnecting...');
                setTimeout(() => this.connectToStateManager(), this.reconnectInterval);
            });
            
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }
    
    /**
     * Setup interceptors for each API
     */
    setupAPIInterceptors() {
        // Forum API (3334)
        this.setupForumAPIInterceptor();
        
        // AI Agent RPG API (3335)
        this.setupRPGAPIInterceptor();
        
        // Multi-LLM Engine (8080)
        this.setupLLMAPIInterceptor();
        
        // Add more APIs as needed
    }
    
    /**
     * Setup Forum API interceptor
     */
    setupForumAPIInterceptor() {
        const forumAPI = {
            port: 3334,
            name: 'Forum API',
            baseUrl: 'http://localhost:3334',
            
            // Intercept POST /api/forum/post
            interceptPost: async (postData) => {
                // Call actual API
                const response = await axios.post(`${forumAPI.baseUrl}/api/forum/post`, postData);
                
                // Emit to fluid state
                this.emitToFluidState({
                    type: 'forum.post.created',
                    postId: response.data.id,
                    author: postData.username,
                    content: postData.content,
                    timestamp: Date.now()
                });
                
                // Check for legendary response
                if (response.data.rarity === 'legendary') {
                    this.emitToFluidState({
                        type: 'forum.reply.legendary',
                        postId: response.data.id,
                        content: response.data.reply
                    });
                }
                
                return response;
            },
            
            // Intercept GET /api/forum/posts
            interceptGetPosts: async () => {
                const response = await axios.get(`${forumAPI.baseUrl}/api/forum/posts`);
                
                // No state change for reads
                return response;
            }
        };
        
        this.apis.set(forumAPI.port, forumAPI);
        console.log(`📡 Setup interceptor for ${forumAPI.name} on port ${forumAPI.port}`);
    }
    
    /**
     * Setup RPG API interceptor  
     */
    setupRPGAPIInterceptor() {
        const rpgAPI = {
            port: 3335,
            name: 'AI Agent RPG API',
            baseUrl: 'http://localhost:3335',
            
            // Intercept agent actions
            interceptAgentAction: async (actionData) => {
                const response = await axios.post(`${rpgAPI.baseUrl}/api/agent/action`, actionData);
                
                // Emit movement events
                if (actionData.action === 'move') {
                    this.emitToFluidState({
                        type: 'agent.moved',
                        agentId: actionData.agentId,
                        toRoom: actionData.target
                    });
                }
                
                // Emit trade events
                if (actionData.action === 'trade') {
                    this.emitToFluidState({
                        type: 'agent.traded',
                        agentId: actionData.agentId,
                        computeSpent: actionData.computeSpent || 50,
                        creditsGained: (actionData.computeSpent || 50) * 10
                    });
                }
                
                return response;
            },
            
            // Intercept combat
            interceptCombat: async (combatData) => {
                const response = await axios.post(`${rpgAPI.baseUrl}/api/combat/simulate`, combatData);
                
                this.emitToFluidState({
                    type: 'combat.started',
                    combatId: response.data.battleId,
                    participants: combatData.agentIds,
                    battleType: combatData.battleType
                });
                
                // Simulate combat completion
                setTimeout(() => {
                    this.emitToFluidState({
                        type: 'combat.finished',
                        combatId: response.data.battleId,
                        winner: response.data.winner,
                        rewards: response.data.rewards
                    });
                }, response.data.duration);
                
                return response;
            }
        };
        
        this.apis.set(rpgAPI.port, rpgAPI);
        console.log(`📡 Setup interceptor for ${rpgAPI.name} on port ${rpgAPI.port}`);
    }
    
    /**
     * Setup Multi-LLM Engine interceptor
     */
    setupLLMAPIInterceptor() {
        const llmAPI = {
            port: 8080,
            name: 'Multi-LLM Engine',
            baseUrl: 'http://localhost:8080',
            
            // Intercept LLM queries
            interceptQuery: async (queryData) => {
                const startTime = Date.now();
                
                // Emit query start
                this.emitToFluidState({
                    type: 'llm.query.started',
                    queryId: queryData.id,
                    agentId: queryData.agentId,
                    hopCount: 8
                });
                
                // Call actual API
                const response = await axios.post(`${llmAPI.baseUrl}/api/llm/query`, queryData);
                
                // Emit hop events
                response.data.hops?.forEach((hop, index) => {
                    this.emitToFluidState({
                        type: 'combat.hop.completed',
                        queryId: queryData.id,
                        hopNumber: index + 1,
                        provider: hop.provider,
                        tokens: hop.tokens,
                        cost: hop.cost,
                        latency: hop.latency
                    });
                });
                
                // Calculate total compute consumed
                const totalCompute = response.data.hops?.reduce((sum, hop) => sum + hop.tokens, 0) || 0;
                
                this.emitToFluidState({
                    type: 'economy.compute.consumed',
                    agentId: queryData.agentId,
                    compute: totalCompute,
                    cost: response.data.totalCost,
                    duration: Date.now() - startTime
                });
                
                return response;
            }
        };
        
        this.apis.set(llmAPI.port, llmAPI);
        console.log(`📡 Setup interceptor for ${llmAPI.name} on port ${llmAPI.port}`);
    }
    
    /**
     * Emit event to fluid state manager
     */
    emitToFluidState(eventData) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'process_event',
                event: eventData,
                source: 'rigid-api-connector',
                timestamp: Date.now()
            }));
            
            console.log(`🌊 Emitted ${eventData.type} to fluid state`);
        } else {
            // Queue if not connected
            this.eventQueue.push(eventData);
            console.log(`📋 Queued ${eventData.type} (not connected)`);
        }
    }
    
    /**
     * Handle state updates from fluid manager
     */
    handleStateUpdate(message) {
        switch (message.type) {
            case 'state_summary':
                console.log('📊 State summary received:', {
                    events: message.data.eventCount,
                    agents: message.data.agents,
                    battles: message.data.activeBattles
                });
                break;
                
            case 'state_change':
                // Could trigger API updates based on state changes
                this.handleStateChange(message.event);
                break;
        }
    }
    
    /**
     * React to state changes
     */
    handleStateChange(event) {
        // Example: Update API caches based on state changes
        switch (event.type) {
            case 'zone.overloaded':
                console.log(`⚠️  Zone overloaded: ${event.data.zone}`);
                // Could trigger load balancing
                break;
                
            case 'economy.velocity.high':
                console.log(`📈 High economic velocity detected`);
                // Could adjust rates
                break;
        }
    }
    
    /**
     * Create proxy server for transparent interception
     */
    createProxyServer(api) {
        const express = require('express');
        const app = express();
        app.use(express.json());
        
        // Proxy all requests
        app.all('*', async (req, res) => {
            try {
                // Forward to actual API
                const response = await axios({
                    method: req.method,
                    url: `${api.baseUrl}${req.path}`,
                    data: req.body,
                    params: req.query,
                    headers: req.headers
                });
                
                // Intercept specific endpoints
                if (req.path === '/api/forum/post' && req.method === 'POST') {
                    await api.interceptPost(req.body);
                } else if (req.path === '/api/agent/action' && req.method === 'POST') {
                    await api.interceptAgentAction(req.body);
                } else if (req.path === '/api/combat/simulate' && req.method === 'POST') {
                    await api.interceptCombat(req.body);
                }
                
                res.status(response.status).json(response.data);
            } catch (error) {
                res.status(error.response?.status || 500).json({
                    error: error.message
                });
            }
        });
        
        // Start proxy on different port
        const proxyPort = api.port + 10000; // e.g., 3334 -> 13334
        app.listen(proxyPort, () => {
            console.log(`🔀 Proxy for ${api.name} running on port ${proxyPort}`);
            console.log(`   Forwarding to ${api.baseUrl}`);
        });
    }
}

// Example usage functions
class RigidAPIClient {
    constructor(connector) {
        this.connector = connector;
    }
    
    /**
     * Example: Create forum post
     */
    async createForumPost(username, content) {
        const api = this.connector.apis.get(3334);
        if (!api) throw new Error('Forum API not configured');
        
        return await api.interceptPost({
            username,
            content,
            timestamp: Date.now()
        });
    }
    
    /**
     * Example: Move agent
     */
    async moveAgent(agentId, toRoom) {
        const api = this.connector.apis.get(3335);
        if (!api) throw new Error('RPG API not configured');
        
        return await api.interceptAgentAction({
            agentId,
            action: 'move',
            target: toRoom
        });
    }
    
    /**
     * Example: Execute LLM query
     */
    async executeLLMQuery(agentId, prompt) {
        const api = this.connector.apis.get(8080);
        if (!api) throw new Error('LLM API not configured');
        
        return await api.interceptQuery({
            id: `query_${Date.now()}`,
            agentId,
            prompt,
            maxHops: 8
        });
    }
}

// CLI interface
if (require.main === module) {
    const connector = new RigidToFluidConnector();
    const client = new RigidAPIClient(connector);
    
    connector.initialize()
        .then(async () => {
            console.log('\n🌉 RIGID-TO-FLUID CONNECTOR READY');
            console.log('=================================');
            console.log('Rigid APIs now emit to fluid state');
            console.log('');
            
            // Demo sequence
            setTimeout(async () => {
                console.log('📋 Demo: Creating forum post...');
                try {
                    await client.createForumPost('test_user', 'Hello from rigid API!');
                    
                    console.log('📋 Demo: Moving agent...');
                    await client.moveAgent('agent_001', 'tradingPost');
                    
                    console.log('📋 Demo: Executing LLM query...');
                    await client.executeLLMQuery('agent_001', 'How do I get stronger?');
                } catch (error) {
                    console.log('ℹ️  Demo API calls failed (APIs may not be running)');
                    console.log('   The connector is ready to intercept when APIs are live');
                }
            }, 2000);
            
            console.log('Press Ctrl+C to stop');
        })
        .catch(error => {
            console.error('❌ Failed to initialize:', error);
            process.exit(1);
        });
}

module.exports = { RigidToFluidConnector, RigidAPIClient };