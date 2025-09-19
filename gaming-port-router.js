#!/usr/bin/env node

/**
 * 🎮 GAMING PORT ROUTER - Dynamic ARPANET-Style Port Mapping
 * 
 * Routes gaming services dynamically based on player position/world area
 * Eliminates port conflicts and reduces latency by intelligent routing
 */

const http = require('http');
const httpProxy = require('http-proxy');
const WebSocket = require('ws');
const EventEmitter = require('events');

class GamingPortRouter extends EventEmitter {
    constructor() {
        super();
        
        // Router configuration
        this.routerPort = 9999;
        this.proxy = httpProxy.createProxyServer({});
        
        // Service registry with current ports
        this.services = new Map([
            ['gaming-engine', { port: 8888, health: 'unknown', area: 'central' }],
            ['character-theater', { port: 9950, health: 'unknown', area: 'north' }],
            ['ai-game-world', { port: null, health: 'unknown', area: 'south' }],
            ['blamechain-api', { port: 7777, health: 'unknown', area: 'east' }]
        ]);
        
        // Player position to service mapping
        this.playerAreas = new Map();
        this.areaRoutes = new Map([
            ['central', ['gaming-engine', 'character-theater']],
            ['north', ['character-theater', 'gaming-engine']],
            ['south', ['ai-game-world', 'gaming-engine']],
            ['east', ['blamechain-api', 'gaming-engine']]
        ]);
        
        // Dynamic port pool
        this.portPool = this.generatePortPool(10000, 10100);
        this.allocatedPorts = new Map();
        
        this.init();
    }
    
    generatePortPool(start, end) {
        const ports = [];
        for (let i = start; i <= end; i++) {
            ports.push(i);
        }
        return ports;
    }
    
    async init() {
        console.log('🌐 Starting Gaming Port Router...');
        
        // Health check all services
        await this.healthCheckAll();
        
        // Start router server
        this.startRouter();
        
        // Start area monitoring
        this.startAreaMonitoring();
        
        console.log(`✅ Gaming Port Router running on port ${this.routerPort}`);
        console.log('🎮 Route requests to: http://localhost:9999/{service-name}');
    }
    
    async healthCheckAll() {
        console.log('🔍 Health checking all services...');
        
        for (const [serviceName, config] of this.services) {
            try {
                if (config.port) {
                    const response = await fetch(`http://localhost:${config.port}`, { timeout: 2000 });
                    config.health = response.ok ? 'healthy' : 'unhealthy';
                    console.log(`✅ ${serviceName}: healthy on port ${config.port}`);
                } else {
                    config.health = 'not-running';
                    console.log(`⚠️ ${serviceName}: not running`);
                }
            } catch (error) {
                config.health = 'unhealthy';
                console.log(`❌ ${serviceName}: unhealthy on port ${config.port}`);
            }
        }
    }
    
    startRouter() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathParts = url.pathname.split('/').filter(p => p);
            
            if (pathParts.length === 0) {
                // Show router status
                this.showRouterStatus(res);
                return;
            }
            
            const serviceName = pathParts[0];
            const playerArea = this.getPlayerArea(req);
            
            // Route to appropriate service based on player area
            const targetService = this.routeRequest(serviceName, playerArea);
            
            if (targetService) {
                const target = `http://localhost:${targetService.port}`;
                
                // Rewrite URL to remove service prefix
                const newPath = '/' + pathParts.slice(1).join('/') + url.search;
                req.url = newPath;
                
                console.log(`🎯 Routing ${serviceName} → ${target}${newPath} (area: ${playerArea})`);
                
                this.proxy.web(req, res, { 
                    target,
                    changeOrigin: true
                }, (error) => {
                    console.error(`❌ Proxy error for ${serviceName}:`, error.message);
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Service unavailable',
                        service: serviceName,
                        area: playerArea
                    }));
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Service not found',
                    service: serviceName,
                    available: Array.from(this.services.keys())
                }));
            }
        });
        
        server.listen(this.routerPort);
        
        // Handle WebSocket upgrades
        server.on('upgrade', (request, socket, head) => {
            const url = new URL(request.url, `http://${request.headers.host}`);
            const pathParts = url.pathname.split('/').filter(p => p);
            const serviceName = pathParts[0];
            const playerArea = this.getPlayerArea(request);
            
            const targetService = this.routeRequest(serviceName, playerArea);
            
            if (targetService) {
                const target = `http://localhost:${targetService.port}`;
                console.log(`🔌 WebSocket routing ${serviceName} → ${target} (area: ${playerArea})`);
                
                this.proxy.ws(request, socket, head, { 
                    target,
                    changeOrigin: true
                });
            } else {
                socket.destroy();
            }
        });
    }
    
    getPlayerArea(req) {
        // Extract player area from headers, cookies, or IP
        const playerArea = req.headers['x-player-area'] || 
                          req.headers['x-game-area'] || 
                          this.getAreaFromIP(req.connection.remoteAddress) ||
                          'central';
        
        return playerArea;
    }
    
    getAreaFromIP(ip) {
        // Simple IP-based area mapping (you can make this more sophisticated)
        const hash = require('crypto').createHash('md5').update(ip).digest('hex');
        const areaIndex = parseInt(hash.substring(0, 2), 16) % 4;
        const areas = ['central', 'north', 'south', 'east'];
        return areas[areaIndex];
    }
    
    routeRequest(serviceName, playerArea) {
        // Direct service request
        if (this.services.has(serviceName)) {
            const service = this.services.get(serviceName);
            if (service.health === 'healthy') {
                return service;
            }
        }
        
        // Area-based routing - find best service for area
        const areaServices = this.areaRoutes.get(playerArea) || ['gaming-engine'];
        
        for (const areaService of areaServices) {
            const service = this.services.get(areaService);
            if (service && service.health === 'healthy') {
                return service;
            }
        }
        
        // Fallback to any healthy service
        for (const [name, service] of this.services) {
            if (service.health === 'healthy') {
                return service;
            }
        }
        
        return null;
    }
    
    startAreaMonitoring() {
        // Monitor player movement and adjust routing
        setInterval(() => {
            this.optimizeRouting();
        }, 5000);
        
        console.log('📊 Area monitoring started');
    }
    
    optimizeRouting() {
        // Reallocate ports based on player density
        // This is where you'd implement dynamic port allocation
        
        for (const [area, services] of this.areaRoutes) {
            const playerCount = this.getPlayerCountInArea(area);
            
            if (playerCount > 10) {
                // High load area - consider spinning up additional instances
                this.scaleServices(area, services);
            }
        }
    }
    
    getPlayerCountInArea(area) {
        // Mock player count - replace with real player tracking
        return Math.floor(Math.random() * 20);
    }
    
    async scaleServices(area, services) {
        console.log(`🔄 Scaling services for high-load area: ${area}`);
        
        for (const serviceName of services) {
            const service = this.services.get(serviceName);
            if (service && !service.scaled) {
                // Allocate new port for scaled instance
                const newPort = this.allocatePort();
                if (newPort) {
                    console.log(`🚀 Would scale ${serviceName} to port ${newPort} for area ${area}`);
                    // Here you'd actually start a new service instance
                }
            }
        }
    }
    
    allocatePort() {
        if (this.portPool.length > 0) {
            return this.portPool.shift();
        }
        return null;
    }
    
    showRouterStatus(res) {
        const status = {
            router: 'Gaming Port Router',
            port: this.routerPort,
            timestamp: new Date().toISOString(),
            services: Object.fromEntries(this.services),
            areas: Object.fromEntries(this.areaRoutes),
            usage: `http://localhost:${this.routerPort}/{service-name}`,
            examples: [
                `http://localhost:${this.routerPort}/gaming-engine/game`,
                `http://localhost:${this.routerPort}/character-theater`,
                `http://localhost:${this.routerPort}/blamechain-api/status`
            ]
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
}

// Start the router
if (require.main === module) {
    const router = new GamingPortRouter();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Gaming Port Router shutting down...');
        process.exit(0);
    });
}

module.exports = GamingPortRouter;