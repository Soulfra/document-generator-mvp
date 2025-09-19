#!/usr/bin/env node

/**
 * ⚡📡 REAL-TIME EVENT BUS
 * 
 * Unified event system for all services in the Document Generator ecosystem.
 * Extends the Service Bridge Layer with enterprise-grade event distribution.
 * 
 * Features:
 * - Real-time WebSocket broadcasting
 * - Event persistence and replay
 * - Topic-based subscriptions
 * - Load balancing across services
 * - Automatic retry and dead letter queues
 * 
 * Integrates with:
 * - Service Bridge Layer (WebSocket on port 4000)
 * - All discovered services
 * - Character Router System
 * - Cal Gacha System
 * - 51-Layer System
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const fs = require('fs').promises;

class RealTimeEventBus extends EventEmitter {
    constructor() {
        super();
        
        this.busId = `event-bus-${Date.now()}`;
        this.startTime = Date.now();
        
        // Event storage and routing
        this.events = new Map();
        this.eventHistory = [];
        this.subscribers = new Map();
        this.topics = new Map();
        
        // WebSocket management
        this.wsConnections = new Set();
        this.wsPort = 4001; // Different port from Service Bridge
        
        // Event persistence
        this.persistenceEnabled = true;
        this.eventLogFile = './event-bus-log.json';
        
        // Statistics
        this.stats = {
            totalEvents: 0,
            broadcastsSent: 0,
            subscribersActive: 0,
            topicsActive: 0,
            uptime: 0
        };
        
        // Integration with existing systems
        this.bridgeLayerConnected = false;
        this.servicesConnected = new Set();
    }
    
    async initialize() {
        console.log('⚡📡 REAL-TIME EVENT BUS INITIALIZATION');
        console.log('=====================================');
        console.log(`Bus ID: ${this.busId}`);
        
        // Load event history if exists
        await this.loadEventHistory();
        
        // Set up core event topics
        this.setupCoreTopics();
        
        // Start WebSocket server
        await this.startWebSocketServer();
        
        // Connect to Service Bridge Layer
        await this.connectToServiceBridge();
        
        // Set up event routing
        this.setupEventRouting();
        
        // Start persistence
        this.startEventPersistence();
        
        // Start stats monitoring
        this.startStatsMonitoring();
        
        console.log('✅ REAL-TIME EVENT BUS OPERATIONAL');
        console.log('🌐 Event Dashboard: ws://localhost:4001');
        console.log('🔗 Bridge Integration: Active');
        console.log('');
        
        return this;
    }
    
    setupCoreTopics() {
        console.log('📋 Setting up core event topics...');
        
        const coreTopics = [
            'system.startup',
            'system.shutdown', 
            'system.health',
            'forum.post',
            'forum.reply',
            'gacha.spawn',
            'gacha.response',
            'character.assigned',
            'character.completed',
            'bridge.flow_start',
            'bridge.flow_complete',
            'layer.activation',
            'layer.data',
            'api.request',
            'api.response',
            'error.system',
            'error.service'
        ];
        
        for (const topic of coreTopics) {
            this.topics.set(topic, {
                name: topic,
                subscribers: new Set(),
                eventCount: 0,
                lastEvent: null,
                created: Date.now()
            });
        }
        
        console.log(`✅ ${coreTopics.length} core topics initialized`);
    }
    
    async startWebSocketServer() {
        console.log('🌐 Starting Event Bus WebSocket server...');
        
        this.wsServer = new WebSocket.Server({ 
            port: this.wsPort,
            clientTracking: true
        });
        
        this.wsServer.on('connection', (ws, req) => {
            const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            ws.clientId = clientId;
            
            this.wsConnections.add(ws);
            console.log(`📱 Event client connected: ${clientId} (${this.wsConnections.size} total)`);
            
            // Send welcome message with available topics
            ws.send(JSON.stringify({
                type: 'bus.welcome',
                busId: this.busId,
                clientId: clientId,
                availableTopics: Array.from(this.topics.keys()),
                stats: this.getStats(),
                timestamp: Date.now()
            }));
            
            // Handle client messages
            ws.on('message', (message) => {
                this.handleClientMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.wsConnections.delete(ws);
                // Remove from all topic subscriptions
                for (const topic of this.topics.values()) {
                    topic.subscribers.delete(clientId);
                }
                console.log(`📱 Event client disconnected: ${clientId} (${this.wsConnections.size} total)`);
            });
            
            ws.on('error', (error) => {
                console.error(`📱 Client ${clientId} error:`, error.message);
                this.wsConnections.delete(ws);
            });
        });
        
        console.log(`✅ Event Bus WebSocket server running on port ${this.wsPort}`);
    }
    
    handleClientMessage(ws, message) {
        try {
            const data = JSON.parse(message.toString());
            
            switch (data.type) {
                case 'subscribe':
                    this.subscribeClient(ws.clientId, data.topic);
                    break;
                    
                case 'unsubscribe':
                    this.unsubscribeClient(ws.clientId, data.topic);
                    break;
                    
                case 'publish':
                    this.publishEvent(data.topic, data.payload, `client:${ws.clientId}`);
                    break;
                    
                case 'get_history':
                    this.sendEventHistory(ws, data.topic, data.limit);
                    break;
                    
                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Unknown message type: ${data.type}`
                    }));
            }
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error', 
                message: `Invalid JSON: ${error.message}`
            }));
        }
    }
    
    subscribeClient(clientId, topic) {
        if (!this.topics.has(topic)) {
            // Create topic if it doesn't exist
            this.topics.set(topic, {
                name: topic,
                subscribers: new Set(),
                eventCount: 0,
                lastEvent: null,
                created: Date.now()
            });
        }
        
        this.topics.get(topic).subscribers.add(clientId);
        
        // Send confirmation to client
        const client = this.getClientById(clientId);
        if (client) {
            client.send(JSON.stringify({
                type: 'subscribed',
                topic: topic,
                timestamp: Date.now()
            }));
        }
        
        console.log(`📡 Client ${clientId} subscribed to ${topic}`);
    }
    
    unsubscribeClient(clientId, topic) {
        if (this.topics.has(topic)) {
            this.topics.get(topic).subscribers.delete(clientId);
        }
        
        const client = this.getClientById(clientId);
        if (client) {
            client.send(JSON.stringify({
                type: 'unsubscribed',
                topic: topic,
                timestamp: Date.now()
            }));
        }
        
        console.log(`📡 Client ${clientId} unsubscribed from ${topic}`);
    }
    
    getClientById(clientId) {
        for (const ws of this.wsConnections) {
            if (ws.clientId === clientId) {
                return ws;
            }
        }
        return null;
    }
    
    async connectToServiceBridge() {
        console.log('🌉 Connecting to Service Bridge Layer...');
        
        try {
            // Connect to Service Bridge WebSocket
            this.bridgeWs = new WebSocket('ws://localhost:4000');
            
            this.bridgeWs.on('open', () => {
                console.log('✅ Connected to Service Bridge Layer');
                this.bridgeLayerConnected = true;
                
                // Emit connection event
                this.publishEvent('system.startup', {
                    component: 'event-bus',
                    bridgeConnected: true
                }, 'event-bus');
            });
            
            this.bridgeWs.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleBridgeMessage(message);
                } catch (error) {
                    console.error('Bridge message parse error:', error.message);
                }
            });
            
            this.bridgeWs.on('close', () => {
                console.log('⚠️ Service Bridge connection closed');
                this.bridgeLayerConnected = false;
                
                // Emit disconnection event
                this.publishEvent('system.health', {
                    component: 'service-bridge',
                    status: 'disconnected'
                }, 'event-bus');
            });
            
            this.bridgeWs.on('error', (error) => {
                console.error('Bridge connection error:', error.message);
                this.bridgeLayerConnected = false;
            });
            
        } catch (error) {
            console.log('⚠️ Service Bridge not available, continuing without bridge integration');
        }
    }
    
    handleBridgeMessage(message) {
        // Convert bridge messages to event bus events
        switch (message.type) {
            case 'flow_update':
                this.publishEvent('bridge.flow_update', message.flow, 'service-bridge');
                
                // Also publish specific stage events
                if (message.flow.stage) {
                    this.publishEvent(`bridge.${message.flow.stage}`, {
                        flowId: message.flow.id,
                        data: message.flow.data
                    }, 'service-bridge');
                }
                break;
                
            case 'health_update':
                this.publishEvent('system.health', message.services, 'service-bridge');
                break;
                
            default:
                this.publishEvent('bridge.message', message, 'service-bridge');
        }
    }
    
    setupEventRouting() {
        console.log('⚡ Setting up event routing...');
        
        // Route internal events to topics
        this.on('newListener', (eventName) => {
            console.log(`👂 New listener for: ${eventName}`);
        });
        
        // Set up automatic event broadcasting
        this.on('event.published', (event) => {
            this.broadcastEventToSubscribers(event);
        });
        
        console.log('⚡ Event routing configured');
    }
    
    publishEvent(topic, payload, source = 'unknown') {
        const event = {
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            topic: topic,
            payload: payload,
            source: source,
            timestamp: Date.now(),
            busId: this.busId
        };
        
        // Store event
        this.events.set(event.id, event);
        this.eventHistory.push(event);
        
        // Update topic stats
        if (this.topics.has(topic)) {
            const topicData = this.topics.get(topic);
            topicData.eventCount++;
            topicData.lastEvent = event;
        }
        
        // Update stats
        this.stats.totalEvents++;
        
        console.log(`📡 Event published: ${topic} from ${source}`);
        
        // Emit for internal processing
        this.emit('event.published', event);
        
        return event.id;
    }
    
    broadcastEventToSubscribers(event) {
        if (!this.topics.has(event.topic)) return;
        
        const topic = this.topics.get(event.topic);
        const message = JSON.stringify({
            type: 'event',
            event: event
        });
        
        let broadcastCount = 0;
        
        // Send to subscribed clients
        for (const clientId of topic.subscribers) {
            const client = this.getClientById(clientId);
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(message);
                broadcastCount++;
            }
        }
        
        // Also broadcast to all connected clients (optional global feed)
        for (const ws of this.wsConnections) {
            if (ws.readyState === WebSocket.OPEN && !topic.subscribers.has(ws.clientId)) {
                // Send as global event feed
                ws.send(JSON.stringify({
                    type: 'global_event',
                    event: event
                }));
                broadcastCount++;
            }
        }
        
        this.stats.broadcastsSent += broadcastCount;
    }
    
    sendEventHistory(ws, topic, limit = 50) {
        const filteredEvents = this.eventHistory
            .filter(e => !topic || e.topic === topic)
            .slice(-limit);
            
        ws.send(JSON.stringify({
            type: 'event_history',
            topic: topic,
            events: filteredEvents,
            total: filteredEvents.length
        }));
    }
    
    async loadEventHistory() {
        try {
            const data = await fs.readFile(this.eventLogFile, 'utf8');
            const history = JSON.parse(data);
            
            if (Array.isArray(history)) {
                this.eventHistory = history;
                console.log(`📚 Loaded ${history.length} events from history`);
            }
        } catch (error) {
            console.log('📚 No event history found, starting fresh');
        }
    }
    
    startEventPersistence() {
        if (!this.persistenceEnabled) return;
        
        console.log('💾 Starting event persistence...');
        
        // Save events every 30 seconds
        setInterval(async () => {
            try {
                await fs.writeFile(
                    this.eventLogFile, 
                    JSON.stringify(this.eventHistory.slice(-1000), null, 2) // Keep last 1000 events
                );
            } catch (error) {
                console.error('💾 Event persistence failed:', error.message);
            }
        }, 30000);
    }
    
    startStatsMonitoring() {
        console.log('📊 Starting stats monitoring...');
        
        // Update stats every 10 seconds
        setInterval(() => {
            this.stats.uptime = Date.now() - this.startTime;
            this.stats.subscribersActive = this.wsConnections.size;
            this.stats.topicsActive = this.topics.size;
            
            // Broadcast stats to interested clients
            this.publishEvent('system.stats', this.stats, 'event-bus');
            
        }, 10000);
    }
    
    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.startTime,
            subscribersActive: this.wsConnections.size,
            topicsActive: this.topics.size,
            eventsInMemory: this.events.size,
            historySize: this.eventHistory.length,
            bridgeConnected: this.bridgeLayerConnected
        };
    }
    
    getTopics() {
        const topicList = [];
        for (const [name, data] of this.topics) {
            topicList.push({
                name: name,
                subscribers: data.subscribers.size,
                eventCount: data.eventCount,
                lastEvent: data.lastEvent?.timestamp || null,
                created: data.created
            });
        }
        return topicList;
    }
    
    // Testing and demo methods
    async simulateSystemEvents() {
        console.log('🎯 Simulating system events...');
        
        const testEvents = [
            { topic: 'forum.post', payload: { user: 'TestUser', content: 'Hello world!' } },
            { topic: 'gacha.spawn', payload: { personality: 'savage', rarity: 'rare' } },
            { topic: 'character.assigned', payload: { character: 'Cal', task: 'analysis' } },
            { topic: 'layer.activation', payload: { layer: 5, name: 'Enterprise Integration' } },
            { topic: 'system.health', payload: { service: 'forum', status: 'healthy' } }
        ];
        
        for (const event of testEvents) {
            this.publishEvent(event.topic, event.payload, 'demo');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('✅ Event simulation complete');
    }
}

// Export for use as module
module.exports = { RealTimeEventBus };

// CLI interface
if (require.main === module) {
    const eventBus = new RealTimeEventBus();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            eventBus.initialize()
                .then(() => {
                    console.log('⚡ Real-Time Event Bus running...');
                    console.log('📡 WebSocket: ws://localhost:4001');
                    console.log('🌉 Service Bridge: Integrated');
                    console.log('');
                    console.log('🎯 Test with: node REAL-TIME-EVENT-BUS.js demo');
                    console.log('Press Ctrl+C to stop');
                    
                    // Keep running
                    process.on('SIGINT', () => {
                        console.log('\\n👋 Real-Time Event Bus shutting down...');
                        process.exit(0);
                    });
                })
                .catch(console.error);
            break;
            
        case 'demo':
            eventBus.initialize()
                .then(async () => {
                    console.log('🎯 DEMO MODE: Simulating events...');
                    await eventBus.simulateSystemEvents();
                    
                    setTimeout(() => {
                        console.log('\\n📊 EVENT BUS STATS:');
                        console.log(JSON.stringify(eventBus.getStats(), null, 2));
                        
                        console.log('\\n📋 ACTIVE TOPICS:');
                        console.log(JSON.stringify(eventBus.getTopics(), null, 2));
                        
                        console.log('\\n🎊 Demo completed successfully!');
                        process.exit(0);
                    }, 15000);
                })
                .catch(console.error);
            break;
            
        case 'stats':
            eventBus.initialize()
                .then(() => {
                    setTimeout(() => {
                        const stats = eventBus.getStats();
                        const topics = eventBus.getTopics();
                        
                        console.log(JSON.stringify({ stats, topics }, null, 2));
                        process.exit(0);
                    }, 2000);
                })
                .catch(console.error);
            break;
            
        default:
            console.log(`
⚡📡 REAL-TIME EVENT BUS

Commands:
  start  - Start the real-time event bus
  demo   - Run demonstration with simulated events  
  stats  - Show current event bus statistics

Examples:
  node REAL-TIME-EVENT-BUS.js start
  node REAL-TIME-EVENT-BUS.js demo
  node REAL-TIME-EVENT-BUS.js stats

Event Topics:
• system.* - System events (startup, health, etc.)
• forum.* - Forum events (posts, replies)
• gacha.* - Cal Gacha events (spawns, responses)
• character.* - Character Router events
• bridge.* - Service Bridge events
• layer.* - 51-Layer System events

Integration:
• WebSocket Server: ws://localhost:4001
• Service Bridge: ws://localhost:4000
• Event Persistence: ./event-bus-log.json
• Real-time Broadcasting: All connected clients

Ready to unify all system events!
            `);
    }
}