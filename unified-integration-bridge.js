#!/usr/bin/env node

/**
 * SoulFRA Unified Integration Bridge
 * 
 * Connects JavaScript prototypes (WiseOldMan, OSRS, Solana) with Rust services
 * and the Character Movement System into a single, unified ecosystem.
 * 
 * This bridge layer provides:
 * - Service discovery and auto-registration
 * - Real-time communication between JS and Rust services
 * - Unified API endpoint coordination
 * - Character data synchronization across all systems
 * - WebSocket broadcasting for real-time updates
 * - Health monitoring and fault tolerance
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

// Import our existing systems
const SoulFRAWiseOldManIntegration = require('./soulfra-wiseoldman-discord-integration.js');
const CharacterMovementSystem = require('./character-movement-system.js');

class UnifiedIntegrationBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Network Configuration
            bridge: {
                port: config.bridgePort || 4000,
                wsPort: config.wsPort || 4001,
                host: config.host || '0.0.0.0'
            },
            
            // Service Registry
            services: {
                // Rust services
                rustGateway: config.rustGateway || 'http://localhost:3500',
                authService: config.authService || 'http://localhost:3501',
                ipfsService: config.ipfsService || 'http://localhost:3502',
                gamingService: config.gamingService || 'http://localhost:3503',
                aiOrchestrator: config.aiOrchestrator || 'http://localhost:3504',
                wsService: config.wsService || 'ws://localhost:3505',
                
                // Existing JavaScript services
                templateProcessor: config.templateProcessor || 'http://localhost:3000',
                aiApi: config.aiApi || 'http://localhost:3001',
                analytics: config.analytics || 'http://localhost:3002',
                llmOrchestration: config.llmOrchestration || 'http://localhost:3003',
                platformHub: config.platformHub || 'http://localhost:8080',
                
                // Character Movement
                characterMovement: config.characterMovement || 'ws://localhost:8090',
                
                // External APIs
                wiseOldManApi: 'https://api.wiseoldman.net/v2',
                osrsHiscores: 'https://secure.runescape.com/m=hiscore_oldschool',
                solanaRpc: config.solanaRpc || 'https://api.mainnet-beta.solana.com'
            },
            
            // Integration Configuration
            integration: {
                autoDiscovery: true,
                healthCheckInterval: 30000,     // 30 seconds
                retryAttempts: 3,
                timeoutMs: 10000,
                cacheTtl: 300000,               // 5 minutes
                realTimeSync: true
            },
            
            // Data Synchronization
            sync: {
                characterDataInterval: 5000,    // 5 seconds
                osrsDataInterval: 60000,        // 1 minute
                solanaDataInterval: 30000,      // 30 seconds
                immortalProgressionInterval: 10000 // 10 seconds
            },
            
            // Feature Flags
            features: {
                characterMovement: true,
                osrsIntegration: true,
                solanaIntegration: true,
                aiOrchestration: true,
                realTimeUpdates: true,
                immortalProgression: true
            }
        };
        
        this.state = {
            // Service Registry
            services: new Map(),                // serviceName -> ServiceInfo
            serviceHealth: new Map(),           // serviceName -> HealthStatus
            
            // Integration Systems
            wiseOldManIntegration: null,        // WiseOldMan integration instance
            characterMovement: null,            // Character movement system
            
            // WebSocket Connections
            wsServer: null,                     // Our WebSocket server
            wsConnections: new Set(),           // Active WebSocket connections
            serviceConnections: new Map(),      // serviceName -> WebSocket
            
            // Express Server
            expressApp: null,
            httpServer: null,
            
            // Data Cache
            dataCache: new Map(),               // key -> { data, expires }
            
            // Character Data
            characters: new Map(),              // characterId -> UnifiedCharacterData
            immortalProgression: new Map(),     // characterId -> ProgressionData
            
            // Service Discovery
            discoveredServices: new Map(),      // serviceName -> DiscoveredService
            lastDiscovery: 0,
            
            // Statistics
            stats: {
                totalRequests: 0,
                serviceErrors: 0,
                characterUpdates: 0,
                realTimeMessages: 0,
                bridgeUptime: Date.now()
            }
        };
        
        // Initialize the bridge
        this.initializeBridge();
        
        console.log('🌉 SoulFRA Unified Integration Bridge initializing...');
    }
    
    /**
     * Initialize the integration bridge
     */
    async initializeBridge() {
        try {
            console.log('🚀 Starting unified integration bridge...');
            
            // Initialize Express API server
            await this.initializeExpressServer();
            
            // Initialize WebSocket server
            await this.initializeWebSocketServer();
            
            // Initialize service registry
            await this.initializeServiceRegistry();
            
            // Initialize existing systems
            await this.initializeExistingSystems();
            
            // Start service discovery
            if (this.config.integration.autoDiscovery) {
                await this.startServiceDiscovery();
            }
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            // Start data synchronization
            this.startDataSynchronization();
            
            console.log('✅ Unified Integration Bridge ready!');
            console.log(`🌐 API Server: http://localhost:${this.config.bridge.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.config.bridge.wsPort}`);
            
            this.emit('bridge:ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize integration bridge:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Express API server
     */
    async initializeExpressServer() {
        const app = express();
        
        app.use(cors());
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true }));
        
        // Middleware to track requests
        app.use((req, res, next) => {
            this.state.stats.totalRequests++;
            req.bridgeRequestId = crypto.randomUUID();
            req.bridgeStartTime = Date.now();
            next();
        });
        
        // Health endpoint
        app.get('/health', (req, res) => {
            res.json(this.getSystemHealth());
        });
        
        // Service registry endpoints
        app.get('/api/services', (req, res) => {
            res.json(Array.from(this.state.services.values()));
        });
        
        app.post('/api/services/register', async (req, res) => {
            const result = await this.registerService(req.body);
            res.json(result);
        });
        
        // Character management endpoints
        app.get('/api/characters', (req, res) => {
            res.json(Array.from(this.state.characters.values()));
        });
        
        app.post('/api/characters', async (req, res) => {
            const result = await this.createUnifiedCharacter(req.body);
            res.json(result);
        });
        
        app.get('/api/characters/:id', (req, res) => {
            const character = this.state.characters.get(req.params.id);
            if (!character) {
                return res.status(404).json({ error: 'Character not found' });
            }
            res.json(character);
        });
        
        app.post('/api/characters/:id/move', async (req, res) => {
            const result = await this.moveCharacter(req.params.id, req.body.x, req.body.y);
            res.json(result);
        });
        
        // OSRS Integration endpoints
        app.get('/api/osrs/hiscores/:username', async (req, res) => {
            const result = await this.getOSRSHiscores(req.params.username);
            res.json(result);
        });
        
        app.get('/api/osrs/wiseoldman/:username', async (req, res) => {
            const result = await this.getWiseOldManData(req.params.username);
            res.json(result);
        });
        
        // Solana Integration endpoints
        app.post('/api/solana/reasoning', async (req, res) => {
            const result = await this.processSolanaReasoning(req.body);
            res.json(result);
        });
        
        // Service proxy endpoints (unified API gateway)
        app.use('/api/proxy/:service/*', async (req, res) => {
            await this.proxyServiceRequest(req, res);
        });
        
        // Status dashboard
        app.get('/', (req, res) => {
            res.send(this.generateStatusDashboard());
        });
        
        // Error handling
        app.use((error, req, res, next) => {
            this.state.stats.serviceErrors++;
            console.error('🚨 Bridge API Error:', error);
            res.status(500).json({
                error: 'Internal bridge error',
                requestId: req.bridgeRequestId
            });
        });
        
        // Start server
        this.state.httpServer = app.listen(this.config.bridge.port, () => {
            console.log(`🌐 Bridge API server listening on port ${this.config.bridge.port}`);
        });
        
        this.state.expressApp = app;
    }
    
    /**
     * Initialize WebSocket server for real-time updates
     */
    async initializeWebSocketServer() {
        const wss = new WebSocket.Server({
            port: this.config.bridge.wsPort,
            path: '/bridge'
        });
        
        wss.on('connection', (ws) => {
            const connectionId = crypto.randomUUID();
            console.log(`🔌 Bridge WebSocket client connected: ${connectionId}`);
            
            ws.bridgeConnectionId = connectionId;
            this.state.wsConnections.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'bridge:connected',
                connectionId,
                services: Array.from(this.state.services.keys()),
                characters: Array.from(this.state.characters.keys())
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('❌ Invalid WebSocket message:', error);
                }
            });
            
            ws.on('close', () => {
                this.state.wsConnections.delete(ws);
                console.log(`🔌 Bridge WebSocket client disconnected: ${connectionId}`);
            });
            
            ws.on('error', (error) => {
                console.error('🚨 WebSocket error:', error);
                this.state.wsConnections.delete(ws);
            });
        });
        
        this.state.wsServer = wss;
        console.log(`🔌 Bridge WebSocket server listening on port ${this.config.bridge.wsPort}`);
    }
    
    /**
     * Initialize service registry with default services
     */
    async initializeServiceRegistry() {
        const defaultServices = [
            {
                name: 'rust-api-gateway',
                type: 'rust',
                url: this.config.services.rustGateway,
                health: '/health',
                priority: 1
            },
            {
                name: 'character-movement',
                type: 'movement',
                url: this.config.services.characterMovement,
                health: '/health',
                priority: 1
            },
            {
                name: 'template-processor',
                type: 'javascript',
                url: this.config.services.templateProcessor,
                health: '/health',
                priority: 2
            },
            {
                name: 'ai-api',
                type: 'javascript',
                url: this.config.services.aiApi,
                health: '/health',
                priority: 2
            },
            {
                name: 'platform-hub',
                type: 'javascript',
                url: this.config.services.platformHub,
                health: '/health',
                priority: 3
            }
        ];
        
        for (const service of defaultServices) {
            await this.registerService(service);
        }
        
        console.log(`📋 Registered ${defaultServices.length} default services`);
    }
    
    /**
     * Initialize existing systems
     */
    async initializeExistingSystems() {
        // Initialize WiseOldMan integration
        if (this.config.features.osrsIntegration) {
            this.state.wiseOldManIntegration = new SoulFRAWiseOldManIntegration();
            
            // Listen for WiseOldMan events
            this.state.wiseOldManIntegration.on('player:updated', (playerData) => {
                this.handleWiseOldManUpdate(playerData);
            });
            
            this.state.wiseOldManIntegration.on('achievement:unlocked', (achievement) => {
                this.handleWiseOldManAchievement(achievement);
            });
            
            console.log('🏆 WiseOldMan integration initialized');
        }
        
        // Initialize Character Movement System
        if (this.config.features.characterMovement) {
            this.state.characterMovement = new CharacterMovementSystem({
                debug: false,
                gridWidth: 100,
                gridHeight: 100,
                maxSpeed: 3.0
            });
            
            // Listen for character movement events
            this.state.characterMovement.on('character:positionUpdate', (data) => {
                this.handleCharacterMovementUpdate(data);
            });
            
            this.state.characterMovement.on('character:collision', (data) => {
                this.handleCharacterCollision(data);
            });
            
            console.log('🎮 Character Movement System initialized');
        }
    }
    
    /**
     * Register a service in the registry
     */
    async registerService(serviceData) {
        const service = {
            name: serviceData.name,
            type: serviceData.type || 'unknown',
            url: serviceData.url,
            health: serviceData.health || '/health',
            priority: serviceData.priority || 5,
            metadata: serviceData.metadata || {},
            registered: Date.now(),
            lastHealthCheck: null,
            status: 'unknown'
        };
        
        this.state.services.set(service.name, service);
        
        // Perform initial health check
        await this.checkServiceHealth(service.name);
        
        console.log(`✅ Registered service: ${service.name} (${service.type})`);
        
        // Broadcast to WebSocket clients
        this.broadcastToClients({
            type: 'service:registered',
            service
        });
        
        return { success: true, service };
    }
    
    /**
     * Start service discovery
     */
    async startServiceDiscovery() {
        const discoveryLoop = async () => {
            try {
                await this.discoverServices();
                this.state.lastDiscovery = Date.now();
                
                // Continue discovery
                setTimeout(discoveryLoop, 60000); // Every minute
            } catch (error) {
                console.error('❌ Service discovery error:', error);
                setTimeout(discoveryLoop, 30000); // Retry in 30 seconds
            }
        };
        
        discoveryLoop();
        console.log('🔍 Service discovery started');
    }
    
    /**
     * Discover services automatically
     */
    async discoverServices() {
        // Try to discover Rust services
        const rustPorts = [3500, 3501, 3502, 3503, 3504, 3505];
        
        for (const port of rustPorts) {
            try {
                const response = await axios.get(`http://localhost:${port}/health`, {
                    timeout: 2000
                });
                
                if (response.status === 200) {
                    const serviceName = `rust-service-${port}`;
                    
                    if (!this.state.services.has(serviceName)) {
                        await this.registerService({
                            name: serviceName,
                            type: 'rust',
                            url: `http://localhost:${port}`,
                            health: '/health',
                            priority: 1,
                            metadata: { discovered: true, port }
                        });
                    }
                }
            } catch (error) {
                // Service not available, continue
            }
        }
    }
    
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        const healthCheck = async () => {
            for (const serviceName of this.state.services.keys()) {
                await this.checkServiceHealth(serviceName);
            }
            
            // Continue monitoring
            setTimeout(healthCheck, this.config.integration.healthCheckInterval);
        };
        
        healthCheck();
        console.log('💓 Service health monitoring started');
    }
    
    /**
     * Check health of a specific service
     */
    async checkServiceHealth(serviceName) {
        const service = this.state.services.get(serviceName);
        if (!service) return;
        
        try {
            const healthUrl = service.url + service.health;
            const response = await axios.get(healthUrl, {
                timeout: this.config.integration.timeoutMs
            });
            
            const healthStatus = {
                service: serviceName,
                status: response.status === 200 ? 'healthy' : 'unhealthy',
                responseTime: Date.now() - service.lastHealthCheck || 0,
                lastCheck: Date.now(),
                data: response.data
            };
            
            this.state.serviceHealth.set(serviceName, healthStatus);
            service.status = healthStatus.status;
            service.lastHealthCheck = Date.now();
            
        } catch (error) {
            const healthStatus = {
                service: serviceName,
                status: 'unhealthy',
                responseTime: null,
                lastCheck: Date.now(),
                error: error.message
            };
            
            this.state.serviceHealth.set(serviceName, healthStatus);
            service.status = 'unhealthy';
            service.lastHealthCheck = Date.now();
        }
    }
    
    /**
     * Start data synchronization
     */
    startDataSynchronization() {
        // Character data sync
        if (this.config.features.characterMovement) {
            setInterval(() => {
                this.syncCharacterData();
            }, this.config.sync.characterDataInterval);
        }
        
        // OSRS data sync
        if (this.config.features.osrsIntegration) {
            setInterval(() => {
                this.syncOSRSData();
            }, this.config.sync.osrsDataInterval);
        }
        
        // Immortal progression sync
        if (this.config.features.immortalProgression) {
            setInterval(() => {
                this.syncImmortalProgression();
            }, this.config.sync.immortalProgressionInterval);
        }
        
        console.log('🔄 Data synchronization started');
    }
    
    /**
     * Create unified character that exists across all systems
     */
    async createUnifiedCharacter(characterData) {
        const characterId = crypto.randomUUID();
        
        const unifiedCharacter = {
            id: characterId,
            name: characterData.name,
            
            // Movement system data
            movement: null,
            
            // OSRS integration data
            osrs: {
                username: characterData.osrsUsername,
                hiscores: null,
                wiseOldManData: null,
                lastUpdate: null
            },
            
            // Solana integration data
            solana: {
                walletAddress: characterData.walletAddress,
                reasoningVault: null,
                achievements: [],
                lastUpdate: null
            },
            
            // Immortal progression data
            immortal: {
                totalScore: 0,
                progression: {},
                achievements: [],
                lastUpdate: Date.now()
            },
            
            // System integration
            systems: {
                movement: false,
                osrs: false,
                solana: false,
                ai: false
            },
            
            created: Date.now(),
            lastSync: Date.now()
        };
        
        // Create character in movement system
        if (this.config.features.characterMovement && this.state.characterMovement) {
            const movementCharacterId = this.state.characterMovement.createCharacter({
                id: characterId,
                name: characterData.name,
                x: characterData.x || 10,
                y: characterData.y || 10,
                osrsUsername: characterData.osrsUsername
            });
            
            unifiedCharacter.movement = movementCharacterId;
            unifiedCharacter.systems.movement = true;
        }
        
        // Initialize OSRS data if username provided
        if (characterData.osrsUsername && this.config.features.osrsIntegration) {
            try {
                const osrsData = await this.getOSRSHiscores(characterData.osrsUsername);
                unifiedCharacter.osrs.hiscores = osrsData;
                unifiedCharacter.systems.osrs = true;
            } catch (error) {
                console.warn(`⚠️ Could not fetch OSRS data for ${characterData.osrsUsername}:`, error.message);
            }
        }
        
        this.state.characters.set(characterId, unifiedCharacter);
        this.state.stats.characterUpdates++;
        
        console.log(`👤 Created unified character: ${unifiedCharacter.name} (${characterId})`);
        
        // Broadcast to clients
        this.broadcastToClients({
            type: 'character:created',
            character: unifiedCharacter
        });
        
        return unifiedCharacter;
    }
    
    /**
     * Move character using movement system
     */
    async moveCharacter(characterId, x, y) {
        const character = this.state.characters.get(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        
        if (!character.systems.movement || !this.state.characterMovement) {
            throw new Error('Character movement not available');
        }
        
        const result = this.state.characterMovement.moveCharacter(character.movement, x, y);
        
        if (result) {
            // Update immortal progression
            this.updateImmortalProgression(characterId, 'movement', {
                from: character.movement,
                to: { x, y },
                timestamp: Date.now()
            });
        }
        
        return { success: result, characterId, targetX: x, targetY: y };
    }
    
    /**
     * Get OSRS hiscores data
     */
    async getOSRSHiscores(username) {
        const cacheKey = `osrs:${username}`;
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        try {
            // This would normally fetch from OSRS hiscores API
            // For now, returning mock data
            const hiscoresData = {
                username,
                totalLevel: 1500,
                totalXp: 50000000,
                combatLevel: 100,
                skills: {
                    attack: { level: 75, xp: 1200000 },
                    strength: { level: 80, xp: 2000000 },
                    defence: { level: 70, xp: 800000 },
                    // ... other skills
                },
                lastUpdate: Date.now()
            };
            
            this.setCache(cacheKey, hiscoresData);
            return hiscoresData;
            
        } catch (error) {
            console.error(`❌ Failed to fetch OSRS hiscores for ${username}:`, error);
            throw error;
        }
    }
    
    /**
     * Get WiseOldMan data
     */
    async getWiseOldManData(username) {
        if (!this.state.wiseOldManIntegration) {
            throw new Error('WiseOldMan integration not available');
        }
        
        const playerData = await this.state.wiseOldManIntegration.searchPlayer(username);
        
        if (playerData) {
            await this.state.wiseOldManIntegration.updatePlayerData(playerData.id);
        }
        
        return playerData;
    }
    
    /**
     * Process Solana reasoning request
     */
    async processSolanaReasoning(requestData) {
        // This would integrate with the Solana smart contract
        // For now, returning mock response
        return {
            success: true,
            reasoningHash: crypto.randomBytes(32).toString('hex'),
            encryptedSchema: crypto.randomBytes(64).toString('hex'),
            timestamp: Date.now()
        };
    }
    
    /**
     * Proxy requests to other services
     */
    async proxyServiceRequest(req, res) {
        const serviceName = req.params.service;
        const path = req.params[0];
        
        const service = this.state.services.get(serviceName);
        if (!service) {
            return res.status(404).json({ error: `Service ${serviceName} not found` });
        }
        
        if (service.status !== 'healthy') {
            return res.status(503).json({ error: `Service ${serviceName} is unavailable` });
        }
        
        try {
            const targetUrl = `${service.url}/${path}`;
            const response = await axios({
                method: req.method,
                url: targetUrl,
                data: req.body,
                headers: { ...req.headers, host: undefined },
                timeout: this.config.integration.timeoutMs
            });
            
            res.status(response.status).json(response.data);
            
        } catch (error) {
            console.error(`❌ Proxy error for ${serviceName}/${path}:`, error.message);
            res.status(500).json({ error: 'Proxy request failed' });
        }
    }
    
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(ws, data) {
        this.state.stats.realTimeMessages++;
        
        switch (data.type) {
            case 'character:move':
                this.moveCharacter(data.characterId, data.x, data.y)
                    .then(result => {
                        ws.send(JSON.stringify({
                            type: 'character:moveResult',
                            requestId: data.requestId,
                            result
                        }));
                    })
                    .catch(error => {
                        ws.send(JSON.stringify({
                            type: 'error',
                            requestId: data.requestId,
                            error: error.message
                        }));
                    });
                break;
                
            case 'system:status':
                ws.send(JSON.stringify({
                    type: 'system:statusResult',
                    requestId: data.requestId,
                    status: this.getSystemHealth()
                }));
                break;
        }
    }
    
    /**
     * Broadcast message to all WebSocket clients
     */
    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        
        this.state.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }
    
    /**
     * Handle WiseOldMan player update
     */
    handleWiseOldManUpdate(playerData) {
        // Find matching unified character
        for (const [characterId, character] of this.state.characters) {
            if (character.osrs.username === (playerData.displayName || playerData.username)) {
                character.osrs.wiseOldManData = playerData;
                character.osrs.lastUpdate = Date.now();
                character.lastSync = Date.now();
                
                // Update immortal progression
                this.updateImmortalProgression(characterId, 'osrs', playerData);
                
                // Broadcast update
                this.broadcastToClients({
                    type: 'character:osrsUpdate',
                    characterId,
                    data: playerData
                });
                
                break;
            }
        }
    }
    
    /**
     * Handle WiseOldMan achievement
     */
    handleWiseOldManAchievement(achievement) {
        // Find matching unified character and add achievement
        for (const [characterId, character] of this.state.characters) {
            if (character.osrs.username === (achievement.player.displayName || achievement.player.username)) {
                character.immortal.achievements.push(achievement);
                
                // Update immortal score
                this.updateImmortalProgression(characterId, 'achievement', achievement);
                
                // Broadcast achievement
                this.broadcastToClients({
                    type: 'character:achievement',
                    characterId,
                    achievement
                });
                
                break;
            }
        }
    }
    
    /**
     * Handle character movement update
     */
    handleCharacterMovementUpdate(data) {
        // Find matching unified character
        for (const [characterId, character] of this.state.characters) {
            if (character.movement === data.characterId) {
                // Update immortal progression based on movement
                this.updateImmortalProgression(characterId, 'movement', data);
                
                // Broadcast movement update
                this.broadcastToClients({
                    type: 'character:movementUpdate',
                    characterId,
                    movement: data
                });
                
                break;
            }
        }
    }
    
    /**
     * Handle character collision
     */
    handleCharacterCollision(data) {
        this.broadcastToClients({
            type: 'character:collision',
            data
        });
    }
    
    /**
     * Update immortal progression
     */
    updateImmortalProgression(characterId, type, data) {
        const character = this.state.characters.get(characterId);
        if (!character) return;
        
        let scoreIncrease = 0;
        
        switch (type) {
            case 'movement':
                scoreIncrease = 1;
                character.immortal.progression.totalMovements = (character.immortal.progression.totalMovements || 0) + 1;
                break;
                
            case 'osrs':
                scoreIncrease = 10;
                character.immortal.progression.osrsUpdates = (character.immortal.progression.osrsUpdates || 0) + 1;
                break;
                
            case 'achievement':
                scoreIncrease = 100;
                character.immortal.progression.achievements = (character.immortal.progression.achievements || 0) + 1;
                break;
                
            case 'solana':
                scoreIncrease = 50;
                character.immortal.progression.solanaInteractions = (character.immortal.progression.solanaInteractions || 0) + 1;
                break;
        }
        
        character.immortal.totalScore += scoreIncrease;
        character.immortal.lastUpdate = Date.now();
        character.lastSync = Date.now();
        
        this.state.stats.characterUpdates++;
        
        // Broadcast progression update
        this.broadcastToClients({
            type: 'character:progressionUpdate',
            characterId,
            progression: character.immortal
        });
    }
    
    /**
     * Sync character data across systems
     */
    syncCharacterData() {
        for (const character of this.state.characters.values()) {
            // Export character data from movement system
            if (character.systems.movement && this.state.characterMovement) {
                const exportData = this.state.characterMovement.exportCharacterData();
                // Sync with other systems as needed
            }
        }
    }
    
    /**
     * Sync OSRS data
     */
    async syncOSRSData() {
        for (const character of this.state.characters.values()) {
            if (character.systems.osrs && character.osrs.username) {
                try {
                    const updatedData = await this.getOSRSHiscores(character.osrs.username);
                    character.osrs.hiscores = updatedData;
                    character.osrs.lastUpdate = Date.now();
                } catch (error) {
                    console.warn(`⚠️ Failed to sync OSRS data for ${character.osrs.username}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Sync immortal progression
     */
    syncImmortalProgression() {
        // Calculate and update immortal progression across all characters
        for (const character of this.state.characters.values()) {
            // Recalculate immortal score based on all activities
            let totalScore = 0;
            
            if (character.immortal.progression.totalMovements) {
                totalScore += character.immortal.progression.totalMovements * 1;
            }
            
            if (character.immortal.progression.osrsUpdates) {
                totalScore += character.immortal.progression.osrsUpdates * 10;
            }
            
            if (character.immortal.progression.achievements) {
                totalScore += character.immortal.progression.achievements * 100;
            }
            
            if (character.immortal.progression.solanaInteractions) {
                totalScore += character.immortal.progression.solanaInteractions * 50;
            }
            
            character.immortal.totalScore = totalScore;
            character.immortal.lastUpdate = Date.now();
        }
    }
    
    /**
     * Get system health status
     */
    getSystemHealth() {
        const serviceStats = {};
        for (const [name, health] of this.state.serviceHealth) {
            serviceStats[name] = health.status;
        }
        
        return {
            bridge: {
                status: 'healthy',
                uptime: Date.now() - this.state.stats.bridgeUptime,
                port: this.config.bridge.port,
                wsPort: this.config.bridge.wsPort
            },
            services: {
                registered: this.state.services.size,
                healthy: Array.from(this.state.serviceHealth.values()).filter(h => h.status === 'healthy').length,
                statuses: serviceStats
            },
            characters: {
                total: this.state.characters.size,
                withMovement: Array.from(this.state.characters.values()).filter(c => c.systems.movement).length,
                withOSRS: Array.from(this.state.characters.values()).filter(c => c.systems.osrs).length
            },
            connections: {
                websocket: this.state.wsConnections.size
            },
            statistics: { ...this.state.stats },
            features: { ...this.config.features }
        };
    }
    
    /**
     * Generate status dashboard HTML
     */
    generateStatusDashboard() {
        const status = this.getSystemHealth();
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>SoulFRA Integration Bridge Status</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                .status-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
                .healthy { border-color: #4CAF50; background: #f8fff8; }
                .unhealthy { border-color: #f44336; background: #fff8f8; }
                .service { padding: 10px; margin: 5px 0; border-radius: 4px; }
                .service.healthy { background: #e8f5e8; }
                .service.unhealthy { background: #fde8e8; }
            </style>
        </head>
        <body>
            <h1>🌉 SoulFRA Unified Integration Bridge</h1>
            <div class="status-grid">
                <div class="status-card healthy">
                    <h3>🏥 System Health</h3>
                    <p><strong>Status:</strong> ${status.bridge.status}</p>
                    <p><strong>Uptime:</strong> ${Math.floor(status.bridge.uptime / 1000)} seconds</p>
                    <p><strong>API Port:</strong> ${status.bridge.port}</p>
                    <p><strong>WebSocket Port:</strong> ${status.bridge.wsPort}</p>
                </div>
                
                <div class="status-card">
                    <h3>🔧 Services</h3>
                    <p><strong>Registered:</strong> ${status.services.registered}</p>
                    <p><strong>Healthy:</strong> ${status.services.healthy}</p>
                    <div>
                        ${Object.entries(status.services.statuses).map(([name, health]) => 
                            `<div class="service ${health}">${name}: ${health}</div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="status-card">
                    <h3>👥 Characters</h3>
                    <p><strong>Total:</strong> ${status.characters.total}</p>
                    <p><strong>With Movement:</strong> ${status.characters.withMovement}</p>
                    <p><strong>With OSRS:</strong> ${status.characters.withOSRS}</p>
                    <p><strong>WebSocket Connections:</strong> ${status.connections.websocket}</p>
                </div>
                
                <div class="status-card">
                    <h3>📊 Statistics</h3>
                    <p><strong>Total Requests:</strong> ${status.statistics.totalRequests}</p>
                    <p><strong>Character Updates:</strong> ${status.statistics.characterUpdates}</p>
                    <p><strong>Real-time Messages:</strong> ${status.statistics.realTimeMessages}</p>
                    <p><strong>Service Errors:</strong> ${status.statistics.serviceErrors}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
    
    /**
     * Cache utilities
     */
    getFromCache(key) {
        const cached = this.state.dataCache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        return null;
    }
    
    setCache(key, data) {
        this.state.dataCache.set(key, {
            data,
            expires: Date.now() + this.config.integration.cacheTtl
        });
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedIntegrationBridge;
} else if (typeof window !== 'undefined') {
    window.UnifiedIntegrationBridge = UnifiedIntegrationBridge;
}

// Auto-start if run directly
if (require.main === module) {
    const bridge = new UnifiedIntegrationBridge({
        bridgePort: 4000,
        wsPort: 4001,
        debug: true
    });
    
    bridge.on('bridge:ready', () => {
        console.log('🎉 SoulFRA Integration Bridge is ready!');
        console.log('🌐 API: http://localhost:4000');
        console.log('🔌 WebSocket: ws://localhost:4001');
        
        // Create test characters after startup
        setTimeout(async () => {
            try {
                const character1 = await bridge.createUnifiedCharacter({
                    name: 'CarStomper',
                    osrsUsername: 'CarStomper',
                    x: 10, y: 10
                });
                
                const character2 = await bridge.createUnifiedCharacter({
                    name: 'RoughSparks',
                    osrsUsername: 'RoughSparks', 
                    x: 50, y: 50
                });
                
                console.log('👥 Created test characters:', character1.name, character2.name);
                
                // Test movement
                setTimeout(() => {
                    bridge.moveCharacter(character1.id, 25, 25);
                    console.log('🚶 Testing character movement...');
                }, 2000);
                
            } catch (error) {
                console.error('❌ Failed to create test characters:', error);
            }
        }, 3000);
    });
    
    bridge.on('error', (error) => {
        console.error('💥 Bridge error:', error);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Integration Bridge...');
        
        if (bridge.state.httpServer) {
            bridge.state.httpServer.close();
        }
        
        if (bridge.state.wsServer) {
            bridge.state.wsServer.close();
        }
        
        console.log('👋 Integration Bridge stopped');
        process.exit(0);
    });
}