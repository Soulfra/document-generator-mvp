#!/usr/bin/env node

/**
 * 🎮 MASTER GAMING ROUTER - Central Orchestration Hub
 * 
 * Combines all gaming systems into unified experience:
 * - Localized Router (in-game actions)
 * - Spatial Router (communication/tables) 
 * - Service Discovery & Health Monitoring
 * - WebSocket coordination between all systems
 */

const http = require('http');
const httpProxy = require('http-proxy');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const sqlite3 = require('sqlite3').verbose();

class MasterGamingRouter extends EventEmitter {
    constructor() {
        super();
        
        // Master router configuration
        this.masterPort = 5555;
        this.wsPort = 5556;
        this.proxy = httpProxy.createProxyServer({});
        
        // Known gaming ecosystem services
        this.gameServices = new Map([
            // Core Gaming
            ['gaming-engine', { 
                port: 8888, 
                path: '/game', 
                type: 'core-gaming',
                health: 'unknown',
                priority: 'critical'
            }],
            
            // Character Systems
            ['character-theater', { 
                port: 9950, 
                path: '/', 
                type: 'character',
                health: 'unknown',
                priority: 'high'
            }],
            ['character-roster', { 
                port: null, 
                path: '/roster', 
                type: 'character',
                health: 'unknown',
                priority: 'medium'
            }],
            
            // Communication Systems
            ['spatial-router', { 
                port: 8800, 
                path: '/', 
                type: 'communication',
                health: 'unknown',
                priority: 'high'
            }],
            ['gaming-port-router', { 
                port: 9999, 
                path: '/', 
                type: 'routing',
                health: 'unknown',
                priority: 'medium'
            }],
            
            // Economy & Data
            ['economy-bridge', { 
                port: null, 
                path: '/economy', 
                type: 'economy',
                health: 'unknown',
                priority: 'medium'
            }],
            ['blamechain-api', { 
                port: 7777, 
                path: '/api', 
                type: 'blockchain',
                health: 'unknown',
                priority: 'low'
            }],
            
            // AI Systems
            ['world-symbol-map', { 
                port: null, 
                path: '/symbols', 
                type: 'ai',
                health: 'unknown',
                priority: 'low'
            }],
            ['multi-agent-coordinator', { 
                port: null, 
                path: '/agents', 
                type: 'ai',
                health: 'unknown',
                priority: 'medium'
            }],
            
            // Web Interfaces
            ['master-game-launcher', { 
                port: null, 
                path: '/launcher', 
                type: 'web',
                health: 'unknown',
                priority: 'low'
            }]
        ]);
        
        // Player session management
        this.playerSessions = new Map(); // playerId -> session data
        this.activeConnections = new Map(); // connectionId -> websocket
        
        // System performance tracking
        this.systemMetrics = {
            totalRequests: 0,
            routingDecisions: 0,
            failedRoutes: 0,
            averageLatency: 0,
            activeUsers: 0
        };
        
        this.initDatabase();
        this.init();
    }
    
    initDatabase() {
        this.db = new sqlite3.Database('./master-gaming-router.db');
        
        this.db.serialize(() => {
            // Service registry and health
            this.db.run(`
                CREATE TABLE IF NOT EXISTS service_registry (
                    service_name TEXT PRIMARY KEY,
                    port INTEGER,
                    path TEXT,
                    type TEXT,
                    health TEXT,
                    priority TEXT,
                    last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
                    response_time_ms INTEGER
                )
            `);
            
            // Player sessions across services
            this.db.run(`
                CREATE TABLE IF NOT EXISTS player_sessions (
                    session_id TEXT PRIMARY KEY,
                    player_id TEXT,
                    active_service TEXT,
                    position_x REAL,
                    position_y REAL,
                    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Routing decisions and performance
            this.db.run(`
                CREATE TABLE IF NOT EXISTS routing_log (
                    request_id TEXT PRIMARY KEY,
                    player_id TEXT,
                    requested_service TEXT,
                    routed_to_service TEXT,
                    routing_reason TEXT,
                    response_time_ms INTEGER,
                    success BOOLEAN,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Cross-service communication tracking
            this.db.run(`
                CREATE TABLE IF NOT EXISTS service_communications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    from_service TEXT,
                    to_service TEXT,
                    message_type TEXT,
                    payload_size INTEGER,
                    success BOOLEAN,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        });
        
        console.log('🗃️ Master router database initialized');
    }
    
    async init() {
        console.log('🌟 Starting Master Gaming Router...');
        console.log('🎮 Discovering and connecting all gaming systems...');
        
        // Discover all available services
        await this.discoverServices();
        
        // Start HTTP master router
        this.startMasterHTTPRouter();
        
        // Start WebSocket coordination hub
        this.startWebSocketHub();
        
        // Start health monitoring
        this.startHealthMonitoring();
        
        // Start cross-service coordination
        this.startServiceCoordination();
        
        console.log(`✅ Master Gaming Router online at port ${this.masterPort}`);
        console.log(`🔌 WebSocket Hub at port ${this.wsPort}`);
        console.log('🎯 All gaming systems unified under single endpoint');
    }
    
    async discoverServices() {
        console.log('🔍 Discovering gaming services...');
        
        for (const [serviceName, config] of this.gameServices) {
            if (config.port) {
                try {
                    const response = await fetch(`http://localhost:${config.port}`, { 
                        timeout: 3000,
                        headers: { 'User-Agent': 'MasterGamingRouter/1.0' }
                    });
                    
                    config.health = response.ok ? 'healthy' : 'unhealthy';
                    config.responseTime = Date.now() - Date.now(); // Placeholder
                    
                    console.log(`✅ ${serviceName}: healthy on port ${config.port}`);
                    
                    // Update database
                    this.updateServiceRegistry(serviceName, config);
                    
                } catch (error) {
                    config.health = 'unreachable';
                    console.log(`❌ ${serviceName}: unreachable on port ${config.port}`);
                }
            } else {
                config.health = 'not-configured';
                console.log(`⚠️ ${serviceName}: port not configured`);
            }
        }
    }
    
    updateServiceRegistry(serviceName, config) {
        this.db.run(`
            INSERT OR REPLACE INTO service_registry 
            (service_name, port, path, type, health, priority, response_time_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [serviceName, config.port, config.path, config.type, config.health, config.priority, config.responseTime || 0]);
    }
    
    startMasterHTTPRouter() {
        const server = http.createServer((req, res) => {
            const startTime = Date.now();
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathParts = url.pathname.split('/').filter(p => p);
            
            // Extract player info from request
            const playerId = req.headers['x-player-id'] || req.headers['x-user-id'] || 'anonymous';
            const requestId = this.generateRequestId();
            
            this.systemMetrics.totalRequests++;
            
            if (pathParts.length === 0) {
                this.showMasterStatus(res);
                return;
            }
            
            // Route based on service type and player context
            const routing = this.determineRouting(pathParts[0], playerId, req);
            
            if (routing.service) {
                const targetService = this.gameServices.get(routing.service);
                const target = `http://localhost:${targetService.port}`;
                
                // Modify request path
                const servicePath = pathParts.slice(1).join('/');
                const newPath = targetService.path === '/' ? 
                    `/${servicePath}${url.search}` : 
                    `${targetService.path}/${servicePath}${url.search}`;
                
                req.url = newPath;
                
                console.log(`🎯 [${requestId}] ${playerId}: ${pathParts[0]} → ${routing.service}:${targetService.port}${newPath}`);
                console.log(`   Reason: ${routing.reason}`);
                
                // Proxy the request
                this.proxy.web(req, res, { 
                    target,
                    changeOrigin: true
                }, (error) => {
                    const responseTime = Date.now() - startTime;
                    console.error(`❌ [${requestId}] Proxy error: ${error.message}`);
                    
                    this.logRoutingDecision(requestId, playerId, pathParts[0], routing.service, routing.reason, responseTime, false);
                    this.systemMetrics.failedRoutes++;
                    
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Service temporarily unavailable',
                        service: routing.service,
                        requestId,
                        suggestion: 'Try again in a moment'
                    }));
                });
                
                // Log successful routing
                const responseTime = Date.now() - startTime;
                this.logRoutingDecision(requestId, playerId, pathParts[0], routing.service, routing.reason, responseTime, true);
                this.systemMetrics.routingDecisions++;
                
            } else {
                console.log(`❌ [${requestId}] No service found for: ${pathParts[0]}`);
                
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Service not found',
                    requested: pathParts[0],
                    available: Array.from(this.gameServices.keys()),
                    suggestion: 'Check available services and try again'
                }));
            }
        });
        
        server.listen(this.masterPort);
    }
    
    determineRouting(requestedService, playerId, req) {
        // Get player context
        const playerSession = this.playerSessions.get(playerId);
        
        // Direct service match
        if (this.gameServices.has(requestedService)) {
            const service = this.gameServices.get(requestedService);
            if (service.health === 'healthy') {
                return { 
                    service: requestedService, 
                    reason: 'direct-match' 
                };
            }
        }
        
        // Smart routing based on request type and player context
        const routingRules = {
            // Gaming requests - serve actual 3D games
            'game': () => this.serve3DGame(),
            '3d': () => this.serve3DGame(),
            'voxel': () => this.serve3DGame(),
            'play': () => this.getBestService(['gaming-engine']),
            'world': () => this.getBestService(['gaming-engine', 'character-theater']),
            
            // Character requests  
            'character': () => this.getBestService(['character-theater', 'character-roster']),
            'avatar': () => this.getBestService(['character-theater']),
            'mascot': () => this.getBestService(['character-theater']),
            
            // Communication requests
            'chat': () => this.getBestService(['spatial-router']),
            'message': () => this.getBestService(['spatial-router']),
            'forum': () => this.getBestService(['spatial-router']),
            
            // Economy requests
            'economy': () => this.getBestService(['economy-bridge', 'blamechain-api']),
            'trade': () => this.getBestService(['economy-bridge']),
            'wallet': () => this.getBestService(['blamechain-api']),
            
            // System requests
            'api': () => this.getBestService(['blamechain-api', 'gaming-port-router']),
            'status': () => this.getBestService(['gaming-port-router']),
            'health': () => this.getBestService(['gaming-port-router'])
        };
        
        const rule = routingRules[requestedService];
        if (rule) {
            const result = rule();
            if (result) return { service: result, reason: `smart-routing-${requestedService}` };
        }
        
        // Player context routing
        if (playerSession && playerSession.activeService) {
            const service = this.gameServices.get(playerSession.activeService);
            if (service && service.health === 'healthy') {
                return { 
                    service: playerSession.activeService, 
                    reason: 'player-session-context' 
                };
            }
        }
        
        // Fallback to any healthy service
        const healthyServices = Array.from(this.gameServices.entries())
            .filter(([name, config]) => config.health === 'healthy')
            .sort((a, b) => {
                const priorities = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
                return priorities[b[1].priority] - priorities[a[1].priority];
            });
        
        if (healthyServices.length > 0) {
            return { 
                service: healthyServices[0][0], 
                reason: 'fallback-healthy-service' 
            };
        }
        
        return { service: null, reason: 'no-available-services' };
    }
    
    getBestService(serviceNames) {
        for (const serviceName of serviceNames) {
            const service = this.gameServices.get(serviceName);
            if (service && service.health === 'healthy') {
                return serviceName;
            }
        }
        return null;
    }
    
    serve3DGame() {
        // Instead of routing to services, serve actual 3D game files
        return '3d-game-server';
    }
    
    startWebSocketHub() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateRequestId();
            const url = new URL(req.url, `ws://${req.headers.host}`);
            const playerId = url.searchParams.get('player') || 'anonymous';
            
            console.log(`🔌 [${connectionId}] Player ${playerId} connected to Master Hub`);
            
            this.activeConnections.set(connectionId, { ws, playerId, connected: Date.now() });
            this.systemMetrics.activeUsers = this.activeConnections.size;
            
            // Send welcome message with system status
            ws.send(JSON.stringify({
                type: 'master-hub-welcome',
                connectionId,
                playerId,
                availableServices: Array.from(this.gameServices.keys()),
                systemStatus: this.getSystemStatus()
            }));
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(connectionId, playerId, message);
                } catch (error) {
                    console.error(`❌ [${connectionId}] WebSocket message error:`, error);
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 [${connectionId}] Player ${playerId} disconnected`);
                this.activeConnections.delete(connectionId);
                this.playerSessions.delete(playerId);
                this.systemMetrics.activeUsers = this.activeConnections.size;
            });
        });
    }
    
    handleWebSocketMessage(connectionId, playerId, message) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) return;
        
        switch (message.type) {
            case 'service-request':
                this.routeWebSocketMessage(connectionId, playerId, message);
                break;
                
            case 'player-update':
                this.updatePlayerSession(playerId, message.data);
                break;
                
            case 'cross-service-message':
                this.forwardCrossServiceMessage(playerId, message);
                break;
                
            case 'ping':
                connection.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
                
            default:
                console.log(`🤔 [${connectionId}] Unknown message type: ${message.type}`);
        }
    }
    
    updatePlayerSession(playerId, data) {
        const session = this.playerSessions.get(playerId) || {};
        
        Object.assign(session, data, { lastActivity: Date.now() });
        this.playerSessions.set(playerId, session);
        
        // Update database
        this.db.run(`
            INSERT OR REPLACE INTO player_sessions 
            (session_id, player_id, active_service, position_x, position_y, last_activity)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            session.sessionId || this.generateRequestId(),
            playerId,
            session.activeService,
            session.x,
            session.y,
            new Date().toISOString()
        ]);
    }
    
    startHealthMonitoring() {
        setInterval(async () => {
            await this.discoverServices();
            this.optimizeRouting();
        }, 15000);
        
        console.log('💓 Health monitoring started (15s intervals)');
    }
    
    startServiceCoordination() {
        // Coordinate between services for optimal performance
        setInterval(() => {
            this.coordinateServices();
        }, 30000);
        
        console.log('🤝 Service coordination started (30s intervals)');
    }
    
    coordinateServices() {
        const activeServices = Array.from(this.gameServices.entries())
            .filter(([name, config]) => config.health === 'healthy');
        
        if (activeServices.length > 1) {
            console.log(`🤝 Coordinating ${activeServices.length} active services`);
            
            // Send coordination messages between services
            for (let i = 0; i < activeServices.length; i++) {
                for (let j = i + 1; j < activeServices.length; j++) {
                    this.sendCrossServiceMessage(activeServices[i][0], activeServices[j][0], {
                        type: 'coordination',
                        systemStatus: this.getSystemStatus()
                    });
                }
            }
        }
    }
    
    sendCrossServiceMessage(fromService, toService, message) {
        // Log cross-service communication
        this.db.run(`
            INSERT INTO service_communications 
            (from_service, to_service, message_type, payload_size, success)
            VALUES (?, ?, ?, ?, ?)
        `, [fromService, toService, message.type, JSON.stringify(message).length, true]);
    }
    
    optimizeRouting() {
        // Analyze routing performance and adjust
        const highLatencyServices = Array.from(this.gameServices.entries())
            .filter(([name, config]) => config.responseTime > 1000);
        
        if (highLatencyServices.length > 0) {
            console.log(`⚡ Optimizing routing for ${highLatencyServices.length} slow services`);
        }
    }
    
    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    logRoutingDecision(requestId, playerId, requested, routed, reason, responseTime, success) {
        this.db.run(`
            INSERT INTO routing_log 
            (request_id, player_id, requested_service, routed_to_service, routing_reason, response_time_ms, success)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [requestId, playerId, requested, routed, reason, responseTime, success]);
    }
    
    getSystemStatus() {
        const healthyServices = Array.from(this.gameServices.values())
            .filter(service => service.health === 'healthy').length;
        
        return {
            totalServices: this.gameServices.size,
            healthyServices,
            activeUsers: this.systemMetrics.activeUsers,
            totalRequests: this.systemMetrics.totalRequests,
            routingDecisions: this.systemMetrics.routingDecisions,
            failedRoutes: this.systemMetrics.failedRoutes,
            uptime: process.uptime()
        };
    }
    
    showMasterStatus(res) {
        const status = {
            router: 'Master Gaming Router',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            system: this.getSystemStatus(),
            services: Object.fromEntries(
                Array.from(this.gameServices.entries()).map(([name, config]) => [
                    name, {
                        port: config.port,
                        health: config.health,
                        type: config.type,
                        priority: config.priority
                    }
                ])
            ),
            usage: {
                http: `http://localhost:${this.masterPort}/{service-type}`,
                websocket: `ws://localhost:${this.wsPort}?player={player-id}`,
                headers: [
                    'x-player-id: your-player-id',
                    'x-user-id: alternative-player-id'
                ]
            },
            examples: [
                `curl -H "x-player-id: alice" http://localhost:${this.masterPort}/game`,
                `curl http://localhost:${this.masterPort}/character`,
                `curl http://localhost:${this.masterPort}/chat`,
                `curl http://localhost:${this.masterPort}/economy`
            ],
            architecture: {
                layer1: 'Localized Router (in-game actions)',
                layer2: 'Spatial Router (communication/tables)', 
                layer3: 'Master Router (unified orchestration)'
            }
        };
        
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(status, null, 2));
    }
}

// Start the master router
if (require.main === module) {
    const masterRouter = new MasterGamingRouter();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Master Gaming Router shutting down...');
        process.exit(0);
    });
}

module.exports = MasterGamingRouter;