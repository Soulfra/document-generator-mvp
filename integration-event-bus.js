#!/usr/bin/env node

/**
 * 🚌🔗 INTEGRATION EVENT BUS 🔗🚌
 * 
 * Central event bus connecting all Document Generator systems
 * Enables communication between clicking combat, manufacturing, search, and deathtodata
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');
const http = require('http');
const ServicePortRegistry = require('./service-port-registry-fixed');

// Polyfill for fetch if not available
const fetch = globalThis.fetch || require('node-fetch').catch(() => {
    // Simple HTTP GET fallback if no fetch available
    return (url) => {
        return new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: () => new Promise((resolve) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    })
                });
            });
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    };
});

class IntegrationEventBus extends EventEmitter {
    constructor() {
        super();
        
        console.log('🚌🔗 INTEGRATION EVENT BUS');
        console.log('===========================');
        console.log('Connecting all Document Generator systems');
        console.log('');
        
        // Core event routing
        this.busId = crypto.randomUUID();
        this.startTime = Date.now();
        this.eventRoutes = new Map();
        this.subscribedServices = new Map();
        this.messageHistory = [];
        this.maxHistorySize = 1000;
        
        // WebSocket server for real-time communication
        this.wsServer = null;
        this.wsClients = new Map();
        
        // Service registry integration
        this.serviceRegistry = null;
        
        // System component connections
        this.systemComponents = {
            // Document processing pipeline
            documentParser: null,
            templateProcessor: null,
            
            // Manufacturing pipeline (CalCompare → AI Factory → Bob Builder → Story Mode)
            calCompare: null,
            aiFactory: null,
            bobBuilder: null,
            storyMode: null,
            
            // Deathtodata search system
            searchBossConnector: null,
            bpmSystem: null,
            characterForums: null,
            
            // Clicking combat system
            clickingCombat: null,
            cursorArena: null,
            bossHandAI: null,
            
            // Platform integration
            platformHub: null,
            agentEconomy: null,
            websocketHub: null
        };
        
        // Event routing rules
        this.routingRules = new Map([
            // Document → Manufacturing flow
            ['document:parsed', ['manufacturing:start', 'template:match']],
            ['template:matched', ['calcompare:process', 'ai-factory:prepare']],
            ['calcompare:complete', ['ai-factory:start', 'bob-builder:prepare']],
            ['ai-factory:complete', ['bob-builder:start', 'story-mode:prepare']],
            ['bob-builder:complete', ['story-mode:start', 'deathtodata:spawn']],
            ['story-mode:complete', ['deathtodata:boss-ready', 'combat:enable']],
            
            // Search → Combat flow
            ['search:query', ['deathtodata:raid-start', 'boss:create']],
            ['deathtodata:boss-spawned', ['combat:target-available', 'arena:show']],
            ['boss:created', ['combat:ready', 'clicking:enable', 'ai:activate']],
            
            // Combat → Results flow  
            ['combat:hit', ['boss:damage', 'arena:update', 'bpm:adjust']],
            ['boss:defeated', ['search:complete', 'results:show', 'economy:reward']],
            ['combat:miss', ['bpm:penalty', 'risk:increase']],
            
            // Cross-system integration
            ['manufacturing:entity-ready', ['search:index', 'boss:prepare']],
            ['search:results', ['document:enhance', 'user:notify']],
            ['economy:transaction', ['agent:reward', 'forum:post']],
            ['bpm:change', ['risk:adjust', 'reward:scale', 'death:calculate']]
        ]);
        
        this.initializeBus();
    }
    
    async initializeBus() {
        console.log('🚀 Initializing integration event bus...');
        
        try {
            // Initialize service registry connection
            await this.connectToServiceRegistry();
            
            // Set up WebSocket server
            await this.setupWebSocketServer();
            
            // Set up event routing
            await this.setupEventRouting();
            
            // Connect to system components
            await this.connectSystemComponents();
            
            // Start health monitoring
            await this.startHealthMonitoring();
            
            console.log('✅ Integration event bus ready!');
            console.log('🔗 All systems connected and communicating');
            console.log('');
            
            this.emit('bus:ready');
            
        } catch (error) {
            console.error('❌ Bus initialization failed:', error);
            throw error;
        }
    }
    
    async connectToServiceRegistry() {
        console.log('📋 Connecting to service registry...');
        
        try {
            // Try to connect to existing registry API instead of creating new instance
            const response = await fetch('http://localhost:9999/registry').catch(() => null);
            
            if (response && response.ok) {
                console.log('  ✅ Connected to existing service registry');
                this.serviceRegistry = {
                    apiUrl: 'http://localhost:9999',
                    connected: true
                };
            } else {
                console.log('  ⚠️ No existing service registry found, continuing in standalone mode');
                this.serviceRegistry = null;
            }
            
        } catch (error) {
            console.error('  ❌ Service registry connection failed:', error);
            // Continue without registry - degraded mode
            this.serviceRegistry = null;
        }
    }
    
    async setupWebSocketServer() {
        console.log('🌐 Setting up WebSocket server...');
        
        const WS_PORT = process.env.EVENT_BUS_WS_PORT || 9997;
        
        this.wsServer = new WebSocket.Server({ 
            port: WS_PORT,
            perMessageDeflate: false
        });
        
        this.wsServer.on('connection', (ws, req) => {
            const clientId = crypto.randomUUID();
            const clientInfo = {
                id: clientId,
                ws,
                connectedAt: Date.now(),
                subscriptions: new Set(),
                lastSeen: Date.now()
            };
            
            this.wsClients.set(clientId, clientInfo);
            
            console.log(`  📱 Client connected: ${clientId}`);
            
            // Handle messages from client
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleWebSocketMessage(clientId, message);
                } catch (error) {
                    console.error('  ❌ WebSocket message error:', error);
                }
            });
            
            // Handle client disconnect
            ws.on('close', () => {
                this.wsClients.delete(clientId);
                console.log(`  📱 Client disconnected: ${clientId}`);
            });
            
            // Send welcome message
            this.sendToClient(clientId, {
                type: 'bus:welcome',
                data: {
                    busId: this.busId,
                    clientId,
                    availableEvents: Array.from(this.routingRules.keys())
                }
            });
        });
        
        console.log(`  ✅ WebSocket server running on port ${WS_PORT}`);
    }
    
    async setupEventRouting() {
        console.log('🔀 Setting up event routing...');
        
        // Set up route handlers
        for (const [sourceEvent, targetEvents] of this.routingRules) {
            this.on(sourceEvent, (data) => {
                this.routeEvent(sourceEvent, targetEvents, data);
            });
        }
        
        console.log(`  ✅ ${this.routingRules.size} routing rules configured`);
    }
    
    async connectSystemComponents() {
        console.log('🔌 Connecting system components...');
        
        // Document Processing Pipeline
        await this.connectComponent('document-parser', 3000, [
            'document:parsed',
            'document:error',
            'template:match-request'
        ]);
        
        // Manufacturing Pipeline
        await this.connectComponent('calcompare-bitmap', 3456, [
            'calcompare:query',
            'calcompare:complete',
            'calcompare:error'
        ]);
        
        await this.connectComponent('ai-factory-conveyor', 8400, [
            'ai-factory:start',
            'ai-factory:complete', 
            'ai-factory:item-processed'
        ]);
        
        await this.connectComponent('bob-builder-wireframe', 8500, [
            'bob-builder:start',
            'bob-builder:complete',
            'bob-builder:wireframe-ready'
        ]);
        
        await this.connectComponent('story-mode-narrative', 9000, [
            'story-mode:start',
            'story-mode:complete',
            'story-mode:entity-ready'
        ]);
        
        // Deathtodata Search System  
        await this.connectComponent('deathtodata-search-boss', 3456, [
            'search:query',
            'search:raid-start',
            'deathtodata:boss-spawned',
            'deathtodata:raid-complete'
        ]);
        
        // Clicking Combat System
        await this.connectComponent('clicking-combat-integration', 9600, [
            'combat:ready',
            'combat:hit',
            'combat:miss',
            'boss:created',
            'boss:defeated'
        ]);
        
        // Platform Integration
        await this.connectComponent('platform-hub', 8080, [
            'platform:user-action',
            'platform:document-upload'
        ]);
        
        await this.connectComponent('agent-economy-forum', 8090, [
            'economy:transaction',
            'forum:post',
            'agent:reward'
        ]);
        
        console.log('  ✅ System components connected');
    }
    
    async connectComponent(name, port, events) {
        console.log(`    🔗 Connecting ${name} on port ${port}...`);
        
        // Create HTTP client for component communication
        const componentClient = {
            name,
            port,
            baseUrl: `http://localhost:${port}`,
            events: events,
            healthy: false,
            lastContact: null
        };
        
        this.subscribedServices.set(name, componentClient);
        
        // Test connection
        try {
            const response = await fetch(`${componentClient.baseUrl}/health`, {
                timeout: 5000
            }).catch(() => null);
            
            componentClient.healthy = response?.ok || false;
            componentClient.lastContact = Date.now();
            
            if (componentClient.healthy) {
                console.log(`      ✅ ${name} connected`);
            } else {
                console.log(`      ⚠️ ${name} not responding (will retry)`);
            }
            
        } catch (error) {
            console.log(`      ⚠️ ${name} connection failed (will retry)`);
            componentClient.healthy = false;
        }
    }
    
    routeEvent(sourceEvent, targetEvents, data) {
        console.log(`🔀 Routing event: ${sourceEvent} → [${targetEvents.join(', ')}]`);
        
        // Add to message history
        const eventMessage = {
            id: crypto.randomUUID(),
            sourceEvent,
            targetEvents,
            data,
            timestamp: Date.now(),
            routed: false
        };
        
        this.addToHistory(eventMessage);
        
        // Route to target events
        for (const targetEvent of targetEvents) {
            this.emit(targetEvent, {
                ...data,
                _source: sourceEvent,
                _routeId: eventMessage.id,
                _timestamp: eventMessage.timestamp
            });
        }
        
        // Send to WebSocket clients
        this.broadcastToClients({
            type: 'event:routed',
            data: eventMessage
        });
        
        // Send to subscribed services
        this.notifyServices(sourceEvent, targetEvents, data);
        
        eventMessage.routed = true;
    }
    
    async notifyServices(sourceEvent, targetEvents, data) {
        // Find services that should receive these events
        const relevantServices = Array.from(this.subscribedServices.values())
            .filter(service => 
                service.events.some(event => 
                    targetEvents.includes(event) || event === sourceEvent
                )
            );
        
        // Send notifications
        for (const service of relevantServices) {
            if (service.healthy) {
                try {
                    await fetch(`${service.baseUrl}/events`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sourceEvent,
                            targetEvents,
                            data,
                            timestamp: Date.now()
                        }),
                        timeout: 3000
                    });
                    
                    service.lastContact = Date.now();
                    
                } catch (error) {
                    console.error(`  ❌ Failed to notify ${service.name}:`, error.message);
                    service.healthy = false;
                }
            }
        }
    }
    
    async handleWebSocketMessage(clientId, message) {
        const client = this.wsClients.get(clientId);
        if (!client) return;
        
        client.lastSeen = Date.now();
        
        switch (message.type) {
            case 'subscribe':
                client.subscriptions.add(message.event);
                this.sendToClient(clientId, {
                    type: 'subscribed',
                    event: message.event
                });
                break;
                
            case 'unsubscribe':
                client.subscriptions.delete(message.event);
                this.sendToClient(clientId, {
                    type: 'unsubscribed', 
                    event: message.event
                });
                break;
                
            case 'emit':
                // Client wants to emit an event
                console.log(`📱 Client ${clientId} emitting: ${message.event}`);
                this.emit(message.event, {
                    ...message.data,
                    _clientId: clientId,
                    _clientEmit: true
                });
                break;
                
            case 'ping':
                this.sendToClient(clientId, { type: 'pong' });
                break;
        }
    }
    
    sendToClient(clientId, message) {
        const client = this.wsClients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`Failed to send to client ${clientId}:`, error);
            }
        }
    }
    
    broadcastToClients(message) {
        for (const [clientId, client] of this.wsClients) {
            if (client.ws.readyState === WebSocket.OPEN) {
                try {
                    client.ws.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`Failed to broadcast to client ${clientId}:`, error);
                }
            }
        }
    }
    
    addToHistory(message) {
        this.messageHistory.push(message);
        
        // Trim history if too large
        if (this.messageHistory.length > this.maxHistorySize) {
            this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
        }
    }
    
    handleServiceHealthChange(data) {
        console.log(`💓 Service health change: ${data.serviceName} → ${data.healthy ? 'healthy' : 'unhealthy'}`);
        
        // Update our service list
        const service = this.subscribedServices.get(data.serviceName);
        if (service) {
            service.healthy = data.healthy;
            service.lastContact = Date.now();
        }
        
        // Broadcast to clients
        this.broadcastToClients({
            type: 'service:health-change',
            data
        });
        
        // Emit bus event
        this.emit('service:health-change', data);
    }
    
    async startHealthMonitoring() {
        console.log('💓 Starting health monitoring...');
        
        // Monitor connected services
        setInterval(async () => {
            for (const [name, service] of this.subscribedServices) {
                try {
                    const response = await fetch(`${service.baseUrl}/health`, {
                        timeout: 3000
                    });
                    
                    const wasHealthy = service.healthy;
                    service.healthy = response.ok;
                    service.lastContact = Date.now();
                    
                    if (wasHealthy !== service.healthy) {
                        this.handleServiceHealthChange({
                            serviceName: name,
                            healthy: service.healthy,
                            lastContact: service.lastContact
                        });
                    }
                    
                } catch (error) {
                    if (service.healthy) {
                        service.healthy = false;
                        this.handleServiceHealthChange({
                            serviceName: name,
                            healthy: false,
                            error: error.message
                        });
                    }
                }
            }
        }, 30000); // Every 30 seconds
        
        console.log('  ✅ Health monitoring started');
    }
    
    // Public API methods
    
    // Emit event through the bus
    emitEvent(eventName, data = {}) {
        console.log(`📤 Bus event: ${eventName}`);
        this.emit(eventName, data);
        return this;
    }
    
    // Subscribe to events
    subscribeToEvent(eventName, callback) {
        this.on(eventName, callback);
        console.log(`📥 Subscribed to: ${eventName}`);
        return this;
    }
    
    // Get bus status
    getStatus() {
        const services = Array.from(this.subscribedServices.entries()).map(([name, service]) => ({
            name,
            port: service.port,
            healthy: service.healthy,
            lastContact: service.lastContact,
            events: service.events
        }));
        
        return {
            busId: this.busId,
            uptime: Date.now() - this.startTime,
            connectedServices: services.filter(s => s.healthy).length,
            totalServices: services.length,
            wsClients: this.wsClients.size,
            messageHistory: this.messageHistory.length,
            routingRules: this.routingRules.size,
            services
        };
    }
    
    // Get recent message history
    getHistory(limit = 100) {
        return this.messageHistory.slice(-limit);
    }
    
    // Trigger document → manufacturing → combat flow
    async triggerDocumentFlow(document) {
        console.log('\n🚀 TRIGGERING DOCUMENT FLOW');
        console.log('============================');
        console.log(`Document: ${document.name || 'Untitled'}`);
        
        // Start the flow
        this.emitEvent('document:parsed', {
            document,
            flowId: crypto.randomUUID(),
            startTime: Date.now()
        });
        
        return this;
    }
    
    // Trigger search → combat flow  
    async triggerSearchFlow(query) {
        console.log('\n🔍 TRIGGERING SEARCH FLOW');
        console.log('=========================');
        console.log(`Query: "${query}"`);
        
        // Start the search flow
        this.emitEvent('search:query', {
            text: query,
            userId: 'event-bus',
            flowId: crypto.randomUUID(),
            startTime: Date.now()
        });
        
        return this;
    }
}

// Export for integration
module.exports = IntegrationEventBus;

// Run if called directly
if (require.main === module) {
    const eventBus = new IntegrationEventBus();
    
    eventBus.initializeBus()
        .then(() => {
            console.log('\n🚌 INTEGRATION EVENT BUS ACTIVE');
            console.log('================================');
            console.log('🔗 All systems connected and ready');
            console.log('🌐 WebSocket server running for real-time updates');
            console.log('📋 Service health monitoring active');
            console.log('');
            
            // Demo flows after 3 seconds
            setTimeout(async () => {
                console.log('📝 Demo: Triggering document flow...');
                await eventBus.triggerDocumentFlow({
                    name: 'Test Business Plan',
                    content: 'Create a SaaS platform for document generation',
                    type: 'business-plan'
                });
                
                setTimeout(async () => {
                    console.log('📝 Demo: Triggering search flow...');
                    await eventBus.triggerSearchFlow('government grants for AI startups');
                }, 5000);
                
            }, 3000);
            
            // Status updates every 30 seconds
            setInterval(() => {
                const status = eventBus.getStatus();
                console.log('\n📊 EVENT BUS STATUS:');
                console.log(`  Connected Services: ${status.connectedServices}/${status.totalServices}`);
                console.log(`  WebSocket Clients: ${status.wsClients}`);
                console.log(`  Messages Processed: ${status.messageHistory}`);
                console.log(`  Uptime: ${Math.floor(status.uptime / 1000)}s`);
            }, 30000);
            
        })
        .catch(error => {
            console.error('Failed to start event bus:', error);
            process.exit(1);
        });
}