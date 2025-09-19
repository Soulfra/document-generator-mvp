#!/usr/bin/env node

/**
 * 📡 CROSS-SYSTEM EVENT BUS
 * 
 * Real-time communication hub that connects all services in the ecosystem:
 * - Gaming ↔ Learning ↔ Tokens ↔ Documents ↔ Voxel Interface
 * - Event routing, transformation, and persistence
 * - Real-time synchronization across all systems
 * - Event replay and recovery capabilities
 * - Maximum integration communication layer
 */

const Redis = require('redis');
const WebSocket = require('ws');
const EventEmitter = require('events');
const { Pool } = require('pg');
const crypto = require('crypto');

class CrossSystemEventBus extends EventEmitter {
    constructor(options = {}) {
        super();
        
        console.log('📡 CROSS-SYSTEM EVENT BUS');
        console.log('=========================');
        console.log('🔗 Real-time communication across all systems');
        console.log('🎮 Gaming ↔ 📚 Learning ↔ 🪙 Tokens ↔ 📄 Documents');
        console.log('📊 Event routing, persistence, and replay');
        console.log('');
        
        // Configuration
        this.config = {
            redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
            dbUrl: options.dbUrl || process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ultimate_ecosystem',
            wsPort: options.wsPort || process.env.EVENT_BUS_WS_PORT || 9999,
            eventTtl: options.eventTtl || 24 * 60 * 60, // 24 hours
            maxEventHistory: options.maxEventHistory || 10000
        };
        
        // Event routing rules
        this.routingRules = new Map([
            // Gaming events routing
            ['gaming:player_action', ['learning-platform', 'token-economy', 'voxel-engine']],
            ['gaming:achievement', ['learning-platform', 'token-economy']],
            ['gaming:level_up', ['token-economy', 'voxel-engine']],
            ['gaming:purchase', ['token-economy']],
            
            // Learning events routing
            ['learning:skill_acquired', ['gaming-platform', 'token-economy', 'voxel-engine']],
            ['learning:milestone_reached', ['gaming-platform', 'token-economy']],
            ['learning:pattern_recognized', ['gaming-platform', 'voxel-engine']],
            ['learning:assessment_complete', ['token-economy']],
            
            // Token events routing
            ['tokens:balance_changed', ['gaming-platform', 'learning-platform', 'voxel-engine']],
            ['tokens:reward_earned', ['gaming-platform', 'learning-platform']],
            ['tokens:gacha_pull', ['gaming-platform', 'voxel-engine']],
            ['tokens:transaction', ['gaming-platform', 'learning-platform']],
            
            // Document events routing
            ['documents:created', ['gaming-platform', 'token-economy', 'voxel-engine']],
            ['documents:processed', ['token-economy', 'voxel-engine']],
            ['documents:mvp_generated', ['gaming-platform', 'token-economy']],
            
            // Voxel events routing
            ['voxel:world_updated', ['gaming-platform', 'learning-platform']],
            ['voxel:user_interaction', ['gaming-platform', 'learning-platform', 'token-economy']],
            ['voxel:visualization_created', ['documents-platform']],
            
            // System events routing (broadcast to all)
            ['system:user_login', ['gaming-platform', 'learning-platform', 'token-economy', 'documents-platform', 'voxel-engine']],
            ['system:user_logout', ['gaming-platform', 'learning-platform', 'token-economy', 'documents-platform', 'voxel-engine']],
            ['system:sync_required', ['gaming-platform', 'learning-platform', 'token-economy', 'documents-platform', 'voxel-engine']]
        ]);
        
        // Event transformations for system compatibility
        this.eventTransformers = new Map([
            ['gaming:achievement', this.transformAchievementEvent.bind(this)],
            ['learning:skill_acquired', this.transformSkillEvent.bind(this)],
            ['tokens:balance_changed', this.transformTokenEvent.bind(this)],
            ['documents:mvp_generated', this.transformDocumentEvent.bind(this)]
        ]);
        
        // Connected systems registry
        this.connectedSystems = new Map();
        
        // Event history and metrics
        this.eventHistory = [];
        this.eventMetrics = {
            totalEvents: 0,
            eventsPerSecond: 0,
            systemConnections: 0,
            routingErrors: 0,
            lastResetTime: Date.now()
        };
        
        // WebSocket connections for real-time updates
        this.wsConnections = new Set();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing cross-system event bus...');
        
        // Connect to Redis for pub/sub
        await this.connectToRedis();
        
        // Connect to database for persistence
        await this.connectToDatabase();
        
        // Initialize event persistence schema
        await this.initializeEventSchema();
        
        // Start WebSocket server for real-time connections
        await this.startWebSocketServer();
        
        // Start event routing and processing
        await this.startEventProcessing();
        
        // Start system health monitoring
        await this.startSystemMonitoring();
        
        // Start metrics collection
        await this.startMetricsCollection();
        
        console.log('✅ Cross-system event bus fully operational!');
        console.log(`📡 WebSocket server: ws://localhost:${this.config.wsPort}`);
        console.log(`🔗 Ready for cross-system communication`);
    }
    
    async connectToRedis() {
        console.log('🔗 Connecting to Redis event infrastructure...');
        
        try {
            // Publisher client
            this.redisPublisher = Redis.createClient({ url: this.config.redisUrl });
            await this.redisPublisher.connect();
            
            // Subscriber client
            this.redisSubscriber = Redis.createClient({ url: this.config.redisUrl });
            await this.redisSubscriber.connect();
            
            console.log('   ✅ Redis connection established');
        } catch (error) {
            console.error('   ❌ Redis connection failed:', error.message);
            throw error;
        }
    }
    
    async connectToDatabase() {
        console.log('🗄️ Connecting to event persistence database...');
        
        try {
            this.db = new Pool({ connectionString: this.config.dbUrl });
            await this.db.query('SELECT NOW()');
            console.log('   ✅ Database connection established');
        } catch (error) {
            console.error('   ❌ Database connection failed:', error.message);
            throw error;
        }
    }
    
    async initializeEventSchema() {
        console.log('📊 Initializing event persistence schema...');
        
        const schemas = [
            `
            CREATE TABLE IF NOT EXISTS cross_system_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_type VARCHAR(100) NOT NULL,
                source_system VARCHAR(50) NOT NULL,
                target_systems JSONB,
                event_data JSONB NOT NULL,
                user_id UUID,
                session_id VARCHAR(255),
                correlation_id VARCHAR(255),
                timestamp TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP,
                retry_count INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                
                INDEX (event_type),
                INDEX (source_system),
                INDEX (user_id),
                INDEX (timestamp),
                INDEX (status)
            );
            `,
            `
            CREATE TABLE IF NOT EXISTS event_routing_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_id UUID REFERENCES cross_system_events(id),
                target_system VARCHAR(50) NOT NULL,
                routing_status VARCHAR(20) DEFAULT 'pending',
                routed_at TIMESTAMP DEFAULT NOW(),
                response_received_at TIMESTAMP,
                error_message TEXT
            );
            `,
            `
            CREATE TABLE IF NOT EXISTS system_connections (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                system_id VARCHAR(50) UNIQUE NOT NULL,
                system_name VARCHAR(100) NOT NULL,
                endpoint_url VARCHAR(255) NOT NULL,
                connection_status VARCHAR(20) DEFAULT 'disconnected',
                last_heartbeat TIMESTAMP,
                capabilities JSONB,
                connected_at TIMESTAMP DEFAULT NOW(),
                connection_count INTEGER DEFAULT 0
            );
            `,
            `
            CREATE TABLE IF NOT EXISTS event_metrics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                metric_type VARCHAR(50) NOT NULL,
                metric_value DECIMAL,
                metadata JSONB,
                timestamp TIMESTAMP DEFAULT NOW()
            );
            `
        ];
        
        for (const schema of schemas) {
            try {
                await this.db.query(schema);
            } catch (error) {
                console.error('Schema creation error:', error.message);
            }
        }
        
        console.log('   ✅ Event persistence schema initialized');
    }
    
    async startWebSocketServer() {
        console.log('🌐 Starting WebSocket server for real-time updates...');
        
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            console.log('   🔗 New WebSocket connection established');
            this.wsConnections.add(ws);
            
            // Send welcome message with current stats
            ws.send(JSON.stringify({
                type: 'connection_established',
                data: {
                    connectedSystems: Array.from(this.connectedSystems.keys()),
                    metrics: this.eventMetrics,
                    timestamp: Date.now()
                }
            }));
            
            // Handle incoming messages
            ws.on('message', (data) => {
                this.handleWebSocketMessage(ws, JSON.parse(data));
            });
            
            // Handle disconnection
            ws.on('close', () => {
                this.wsConnections.delete(ws);
                console.log('   📡 WebSocket connection closed');
            });
            
            // Handle errors
            ws.on('error', (error) => {
                console.error('WebSocket error:', error.message);
                this.wsConnections.delete(ws);
            });
        });
        
        console.log(`   ✅ WebSocket server running on port ${this.config.wsPort}`);
    }
    
    async startEventProcessing() {
        console.log('⚡ Starting event processing and routing...');
        
        // Subscribe to all event patterns
        const eventPatterns = [
            'gaming:*',
            'learning:*',
            'tokens:*',
            'documents:*',
            'voxel:*',
            'system:*'
        ];
        
        for (const pattern of eventPatterns) {
            await this.redisSubscriber.pSubscribe(pattern, (message, channel) => {
                this.processIncomingEvent(channel, JSON.parse(message));
            });
        }
        
        console.log('   ✅ Event processing active for all system patterns');
    }
    
    async processIncomingEvent(channel, eventData) {
        const eventId = crypto.randomUUID();
        const timestamp = Date.now();
        
        console.log(`📨 Processing event: ${channel}`);
        
        try {
            // Persist event to database
            const persistedEvent = await this.persistEvent(eventId, channel, eventData);
            
            // Get routing targets
            const targets = this.getRoutingTargets(channel);
            
            // Transform event if needed
            const transformedEvent = await this.transformEvent(channel, eventData);
            
            // Route to target systems
            await this.routeEventToSystems(eventId, channel, transformedEvent, targets);
            
            // Broadcast to WebSocket connections
            this.broadcastToWebSocket('event_routed', {
                eventId,
                channel,
                targets,
                timestamp
            });
            
            // Update metrics
            this.updateEventMetrics(channel, targets.length);
            
            // Add to event history
            this.addToEventHistory(eventId, channel, eventData, targets);
            
        } catch (error) {
            console.error(`Event processing error for ${channel}:`, error.message);
            this.eventMetrics.routingErrors++;
            
            // Broadcast error to monitoring systems
            this.broadcastToWebSocket('event_error', {
                channel,
                error: error.message,
                timestamp
            });
        }
    }
    
    async persistEvent(eventId, channel, eventData) {
        const [sourceSystem, eventType] = channel.split(':', 2);
        
        const result = await this.db.query(`
            INSERT INTO cross_system_events 
            (id, event_type, source_system, event_data, user_id, session_id, correlation_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            eventId,
            eventType,
            sourceSystem,
            eventData,
            eventData.userId || null,
            eventData.sessionId || null,
            eventData.correlationId || null
        ]);
        
        return result.rows[0];
    }
    
    getRoutingTargets(channel) {
        const targets = this.routingRules.get(channel) || [];
        
        // Filter to only connected systems
        return targets.filter(systemId => {
            const system = this.connectedSystems.get(systemId);
            return system && system.status === 'connected';
        });
    }
    
    async transformEvent(channel, eventData) {
        const transformer = this.eventTransformers.get(channel);
        
        if (transformer) {
            return await transformer(eventData);
        }
        
        return eventData;
    }
    
    async routeEventToSystems(eventId, channel, eventData, targets) {
        const routingPromises = targets.map(async (systemId) => {
            try {
                await this.routeEventToSystem(eventId, systemId, channel, eventData);
                
                // Log successful routing
                await this.logEventRouting(eventId, systemId, 'success');
                
            } catch (error) {
                console.error(`Routing error to ${systemId}:`, error.message);
                
                // Log failed routing
                await this.logEventRouting(eventId, systemId, 'failed', error.message);
                
                // Schedule retry if appropriate
                await this.scheduleEventRetry(eventId, systemId, channel, eventData);
            }
        });
        
        await Promise.allSettled(routingPromises);
    }
    
    async routeEventToSystem(eventId, systemId, channel, eventData) {
        const system = this.connectedSystems.get(systemId);
        if (!system) {
            throw new Error(`System ${systemId} not connected`);
        }
        
        // Send HTTP request to system's event endpoint
        const response = await this.sendHttpRequest(`${system.endpointUrl}/api/external-event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Event-Bus-ID': eventId,
                'X-Event-Source': 'cross-system-event-bus'
            },
            body: JSON.stringify({
                eventId,
                channel,
                data: eventData,
                timestamp: Date.now()
            })
        });
        
        if (!response.ok) {
            throw new Error(`System ${systemId} returned status ${response.status}`);
        }
    }
    
    async sendHttpRequest(url, options) {
        // Use the same HTTP client as the orchestrator
        const http = require('http');
        const https = require('https');
        
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const httpModule = isHttps ? https : http;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = httpModule.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }
    
    async logEventRouting(eventId, systemId, status, errorMessage = null) {
        await this.db.query(`
            INSERT INTO event_routing_log (event_id, target_system, routing_status, error_message)
            VALUES ($1, $2, $3, $4)
        `, [eventId, systemId, status, errorMessage]);
    }
    
    // Event transformers for system compatibility
    
    transformAchievementEvent(eventData) {
        return {
            ...eventData,
            // Add learning-specific fields
            learningValue: this.calculateLearningValue(eventData.achievement),
            tokenReward: this.calculateTokenReward(eventData.achievement),
            voxelVisualization: this.generateVoxelData(eventData.achievement)
        };
    }
    
    transformSkillEvent(eventData) {
        return {
            ...eventData,
            // Add gaming-specific fields
            gamingXP: this.calculateGamingXP(eventData.skill),
            gamingLevel: this.calculateGamingLevel(eventData.skill),
            tokenBonus: this.calculateSkillTokenBonus(eventData.skill)
        };
    }
    
    transformTokenEvent(eventData) {
        return {
            ...eventData,
            // Add cross-system implications
            gamingPowerIncrease: this.calculateGamingPower(eventData.balance),
            learningAccessLevel: this.calculateLearningAccess(eventData.balance),
            voxelBuildingCapacity: this.calculateVoxelCapacity(eventData.balance)
        };
    }
    
    transformDocumentEvent(eventData) {
        return {
            ...eventData,
            // Add integration fields
            gamingReward: this.calculateDocumentGamingReward(eventData.document),
            learningOpportunities: this.identifyLearningOpportunities(eventData.document),
            tokenEarnings: this.calculateDocumentTokens(eventData.document)
        };
    }
    
    // Helper methods for transformations
    
    calculateLearningValue(achievement) {
        const learningValues = {
            'first_win': 10,
            'streak_master': 25,
            'puzzle_solver': 15,
            'speed_demon': 20
        };
        return learningValues[achievement.type] || 5;
    }
    
    calculateTokenReward(achievement) {
        const tokenRewards = {
            'first_win': 100,
            'streak_master': 500,
            'puzzle_solver': 250,
            'speed_demon': 300
        };
        return tokenRewards[achievement.type] || 50;
    }
    
    calculateGamingXP(skill) {
        const xpValues = {
            'pattern_recognition': 100,
            'problem_solving': 150,
            'strategic_thinking': 200,
            'creative_application': 175
        };
        return xpValues[skill.name] || 75;
    }
    
    // System connection management
    
    async registerSystem(systemId, systemInfo) {
        console.log(`🔗 Registering system: ${systemId}`);
        
        const system = {
            id: systemId,
            name: systemInfo.name,
            endpointUrl: systemInfo.endpointUrl,
            capabilities: systemInfo.capabilities || [],
            status: 'connected',
            connectedAt: Date.now(),
            lastHeartbeat: Date.now()
        };
        
        this.connectedSystems.set(systemId, system);
        
        // Persist to database
        await this.db.query(`
            INSERT INTO system_connections 
            (system_id, system_name, endpoint_url, capabilities, connection_status)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (system_id) 
            DO UPDATE SET 
                connection_status = $5,
                last_heartbeat = NOW(),
                connection_count = system_connections.connection_count + 1
        `, [systemId, system.name, system.endpointUrl, JSON.stringify(system.capabilities), 'connected']);
        
        // Broadcast connection event
        this.broadcastToWebSocket('system_connected', {
            systemId,
            systemInfo: system,
            timestamp: Date.now()
        });
        
        console.log(`   ✅ System ${systemId} registered successfully`);
    }
    
    async unregisterSystem(systemId) {
        console.log(`📡 Unregistering system: ${systemId}`);
        
        this.connectedSystems.delete(systemId);
        
        // Update database
        await this.db.query(`
            UPDATE system_connections 
            SET connection_status = 'disconnected'
            WHERE system_id = $1
        `, [systemId]);
        
        // Broadcast disconnection event
        this.broadcastToWebSocket('system_disconnected', {
            systemId,
            timestamp: Date.now()
        });
        
        console.log(`   📡 System ${systemId} unregistered`);
    }
    
    // WebSocket message handling
    
    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'subscribe_to_events':
                this.subscribeWebSocketToEvents(ws, message.eventTypes);
                break;
                
            case 'publish_event':
                this.publishEventFromWebSocket(message.channel, message.data);
                break;
                
            case 'get_event_history':
                this.sendEventHistoryToWebSocket(ws, message.filters);
                break;
                
            case 'get_system_status':
                this.sendSystemStatusToWebSocket(ws);
                break;
        }
    }
    
    broadcastToWebSocket(type, data) {
        const message = JSON.stringify({ type, data, timestamp: Date.now() });
        
        this.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    // Metrics and monitoring
    
    async startMetricsCollection() {
        console.log('📊 Starting metrics collection...');
        
        // Collect metrics every minute
        setInterval(() => {
            this.collectMetrics();
        }, 60000);
        
        // Reset per-second metrics every second
        setInterval(() => {
            this.eventMetrics.eventsPerSecond = 0;
        }, 1000);
        
        console.log('   ✅ Metrics collection active');
    }
    
    updateEventMetrics(channel, targetCount) {
        this.eventMetrics.totalEvents++;
        this.eventMetrics.eventsPerSecond++;
        this.eventMetrics.systemConnections = this.connectedSystems.size;
    }
    
    addToEventHistory(eventId, channel, eventData, targets) {
        this.eventHistory.unshift({
            id: eventId,
            channel,
            data: eventData,
            targets,
            timestamp: Date.now()
        });
        
        // Keep only recent events
        if (this.eventHistory.length > this.config.maxEventHistory) {
            this.eventHistory = this.eventHistory.slice(0, this.config.maxEventHistory);
        }
    }
    
    async collectMetrics() {
        const metrics = [
            ['events', 'total_processed', this.eventMetrics.totalEvents],
            ['events', 'events_per_second', this.eventMetrics.eventsPerSecond],
            ['systems', 'connected_count', this.eventMetrics.systemConnections],
            ['routing', 'errors', this.eventMetrics.routingErrors]
        ];
        
        for (const [type, metric, value] of metrics) {
            await this.db.query(
                'INSERT INTO event_metrics (metric_type, metric_value, metadata) VALUES ($1, $2, $3)',
                [type, value, { metric }]
            );
        }
    }
    
    // Public API methods
    
    async publishEvent(channel, eventData) {
        console.log(`📤 Publishing event: ${channel}`);
        
        // Add correlation ID if not present
        if (!eventData.correlationId) {
            eventData.correlationId = crypto.randomUUID();
        }
        
        // Publish to Redis
        await this.redisPublisher.publish(channel, JSON.stringify(eventData));
        
        return eventData.correlationId;
    }
    
    getEventHistory(filters = {}) {
        let history = [...this.eventHistory];
        
        if (filters.channel) {
            history = history.filter(event => event.channel.includes(filters.channel));
        }
        
        if (filters.limit) {
            history = history.slice(0, filters.limit);
        }
        
        return history;
    }
    
    getConnectedSystems() {
        return Array.from(this.connectedSystems.entries()).map(([id, system]) => ({
            id,
            ...system
        }));
    }
    
    getMetrics() {
        return {
            ...this.eventMetrics,
            connectedSystems: this.connectedSystems.size,
            websocketConnections: this.wsConnections.size,
            eventHistorySize: this.eventHistory.length
        };
    }
}

// Export for use
module.exports = CrossSystemEventBus;

// If run directly, start the event bus
if (require.main === module) {
    console.log('📡 Starting Cross-System Event Bus...');
    
    const eventBus = new CrossSystemEventBus();
    
    // Example system registration (for testing)
    setTimeout(() => {
        eventBus.registerSystem('gaming-platform', {
            name: 'Master Gaming Platform',
            endpointUrl: 'http://localhost:8800',
            capabilities: ['player_actions', 'achievements', 'cheat_codes']
        });
        
        eventBus.registerSystem('learning-platform', {
            name: 'Gamified Learning Platform',
            endpointUrl: 'http://localhost:7000',
            capabilities: ['skill_tracking', 'behavioral_assessment', 'stealth_learning']
        });
        
        eventBus.registerSystem('token-economy', {
            name: 'Unified Token Economy',
            endpointUrl: 'http://localhost:9495',
            capabilities: ['token_management', 'gacha_mechanics', 'rewards']
        });
    }, 5000);
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Cross-System Event Bus...');
        process.exit(0);
    });
}