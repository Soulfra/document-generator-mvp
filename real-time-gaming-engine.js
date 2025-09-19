#!/usr/bin/env node

/**
 * 🎮 REAL-TIME GAMING ENGINE
 * WebSocket-powered live updates for the empire gaming universe
 * Handles real-time entity updates, action streams, and multiplayer interactions
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const EmpireDatabaseManager = require('./empire-database-manager');

class RealTimeGamingEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.version = '1.0.0';
        this.port = config.port || process.env.GAMING_ENGINE_PORT || 7788;
        
        // Database connection
        this.db = new EmpireDatabaseManager(config.database);
        
        // WebSocket server
        this.wss = null;
        this.connections = new Map(); // connectionId -> connection data
        this.rooms = new Map();       // roomId -> Set of connectionIds
        
        // Gaming state
        this.gameState = {
            entities: new Map(),      // Real-time entity cache
            zones: new Map(),         // Zone populations
            activeActions: new Map(), // Currently executing actions
            leaderboards: new Map(),  // Real-time leaderboards
            globalStats: {},          // Empire-wide statistics
        };
        
        // Performance monitoring
        this.stats = {
            connections: 0,
            messagesPerSecond: 0,
            actionsPerSecond: 0,
            lastUpdate: Date.now(),
            uptime: Date.now()
        };
        
        // Gaming elements
        this.gameElements = {
            engine: '🎮',
            connection: '🔗',
            action: '⚡',
            update: '📡',
            zone: '🗺️',
            player: '👤',
            success: '✅',
            failure: '❌'
        };
        
        console.log(`${this.gameElements.engine} Real-Time Gaming Engine v${this.version} initializing...`);
        this.initialize();
    }
    
    async initialize() {
        try {
            // Setup WebSocket server
            await this.setupWebSocketServer();
            
            // Setup database listeners
            await this.setupDatabaseListeners();
            
            // Start game state synchronization
            this.startGameStateSync();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            console.log(`${this.gameElements.success} Real-Time Gaming Engine ready on port ${this.port}`);
            
        } catch (error) {
            console.error(`${this.gameElements.failure} Gaming Engine initialization failed:`, error);
            throw error;
        }
    }
    
    // ================================================
    // 🔗 WEBSOCKET SERVER SETUP
    // ================================================
    
    async setupWebSocketServer() {
        this.wss = new WebSocket.Server({ 
            port: this.port,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    level: 3
                }
            }
        });
        
        this.wss.on('connection', (ws, request) => {
            this.handleNewConnection(ws, request);
        });
        
        this.wss.on('error', (error) => {
            console.error(`${this.gameElements.failure} WebSocket server error:`, error);
        });
        
        console.log(`${this.gameElements.connection} WebSocket server listening on port ${this.port}`);
    }
    
    handleNewConnection(ws, request) {
        const connectionId = this.generateConnectionId();
        const userAgent = request.headers['user-agent'] || 'unknown';
        const ip = request.socket.remoteAddress;
        
        const connection = {
            id: connectionId,
            ws,
            ip,
            userAgent,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            entityId: null,     // Will be set after authentication
            currentZone: 'spawn',
            subscriptions: new Set(), // What they're subscribed to
            isAuthenticated: false,
            preferences: {
                audioEnabled: true,
                visualEffects: true,
                compression: true
            }
        };
        
        this.connections.set(connectionId, connection);
        this.stats.connections++;
        
        console.log(`${this.gameElements.connection} New connection: ${connectionId} from ${ip}`);
        
        // Setup message handlers
        ws.on('message', (data) => {
            this.handleMessage(connectionId, data);
        });
        
        ws.on('close', () => {
            this.handleDisconnection(connectionId);
        });
        
        ws.on('error', (error) => {
            console.error(`${this.gameElements.failure} Connection ${connectionId} error:`, error);
            this.handleDisconnection(connectionId);
        });
        
        // Send welcome message
        this.sendToConnection(connectionId, {
            type: 'welcome',
            connectionId,
            gameState: this.getPublicGameState(),
            serverInfo: {
                version: this.version,
                uptime: Date.now() - this.stats.uptime,
                activeConnections: this.stats.connections
            }
        });
    }
    
    handleMessage(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        connection.lastActivity = Date.now();
        
        try {
            const message = JSON.parse(data);
            this.processMessage(connectionId, message);
            
        } catch (error) {
            console.error(`${this.gameElements.failure} Invalid message from ${connectionId}:`, error);
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Invalid JSON format'
            });
        }
    }
    
    async processMessage(connectionId, message) {
        const connection = this.connections.get(connectionId);
        const { type, data = {} } = message;
        
        switch (type) {
            case 'authenticate':
                await this.handleAuthentication(connectionId, data);
                break;
                
            case 'subscribe':
                this.handleSubscription(connectionId, data);
                break;
                
            case 'unsubscribe':
                this.handleUnsubscription(connectionId, data);
                break;
                
            case 'action':
                await this.handleClientAction(connectionId, data);
                break;
                
            case 'zone_change':
                await this.handleZoneChange(connectionId, data);
                break;
                
            case 'gamepad_input':
                await this.handleGamepadInput(connectionId, data);
                break;
                
            case 'ping':
                this.sendToConnection(connectionId, { type: 'pong', timestamp: Date.now() });
                break;
                
            default:
                console.warn(`${this.gameElements.failure} Unknown message type: ${type} from ${connectionId}`);
        }
    }
    
    handleDisconnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        // Remove from all rooms
        for (const [roomId, members] of this.rooms) {
            if (members.has(connectionId)) {
                members.delete(connectionId);
                if (members.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
        }
        
        // Update zone population if authenticated
        if (connection.entityId && connection.currentZone) {
            this.updateZonePopulation(connection.currentZone, -1);
        }
        
        this.connections.delete(connectionId);
        this.stats.connections--;
        
        console.log(`${this.gameElements.connection} Connection ${connectionId} disconnected`);
    }
    
    // ================================================
    // 🎮 GAMING MESSAGE HANDLERS
    // ================================================
    
    async handleAuthentication(connectionId, data) {
        const connection = this.connections.get(connectionId);
        const { entityId, authToken } = data;
        
        try {
            // Validate the entity exists
            const entity = await this.db.getEntity(entityId);
            if (!entity) {
                throw new Error('Entity not found');
            }
            
            // TODO: Validate auth token properly
            // For now, we'll accept any entity ID
            
            connection.entityId = entityId;
            connection.isAuthenticated = true;
            connection.currentZone = entity.current_zone || 'spawn';
            
            // Update game state
            this.gameState.entities.set(entityId, entity);
            this.updateZonePopulation(connection.currentZone, 1);
            
            // Log authentication action
            await this.db.logAction({
                actor_entity_id: entityId,
                action_type: 'gaming_engine_connect',
                action_data: { 
                    connectionId,
                    userAgent: connection.userAgent,
                    ip: connection.ip
                },
                success: true,
                trigger_source: 'gaming_engine'
            });
            
            this.sendToConnection(connectionId, {
                type: 'authenticated',
                entity: entity,
                zone: connection.currentZone,
                gameState: this.getEntityGameState(entityId)
            });
            
            // Broadcast to zone
            this.broadcastToZone(connection.currentZone, {
                type: 'entity_joined',
                entity: entity
            }, connectionId);
            
            console.log(`${this.gameElements.player} Entity ${entity.display_name} authenticated on connection ${connectionId}`);
            
        } catch (error) {
            this.sendToConnection(connectionId, {
                type: 'auth_failed',
                error: error.message
            });
        }
    }
    
    handleSubscription(connectionId, data) {
        const connection = this.connections.get(connectionId);
        const { channels = [] } = data;
        
        for (const channel of channels) {
            connection.subscriptions.add(channel);
            
            // Join room if it's a room-based subscription
            if (channel.startsWith('zone:')) {
                const zoneId = channel.split(':')[1];
                this.joinRoom(connectionId, `zone:${zoneId}`);
            }
        }
        
        this.sendToConnection(connectionId, {
            type: 'subscribed',
            channels: Array.from(connection.subscriptions)
        });
    }
    
    handleUnsubscription(connectionId, data) {
        const connection = this.connections.get(connectionId);
        const { channels = [] } = data;
        
        for (const channel of channels) {
            connection.subscriptions.delete(channel);
            
            // Leave room if it's a room-based subscription
            if (channel.startsWith('zone:')) {
                const zoneId = channel.split(':')[1];
                this.leaveRoom(connectionId, `zone:${zoneId}`);
            }
        }
        
        this.sendToConnection(connectionId, {
            type: 'unsubscribed',
            channels
        });
    }
    
    async handleClientAction(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection.isAuthenticated) {
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Not authenticated'
            });
            return;
        }
        
        const { actionType, actionData = {} } = data;
        
        try {
            // Log the action in the database
            const action = await this.db.logAction({
                actor_entity_id: connection.entityId,
                action_type: actionType,
                action_data: actionData,
                success: true,
                trigger_source: 'gaming_client',
                session_id: connectionId
            });
            
            // Broadcast the action to relevant subscribers
            this.broadcastAction(action);
            
            this.sendToConnection(connectionId, {
                type: 'action_confirmed',
                actionId: action.id,
                result: action.result
            });
            
        } catch (error) {
            this.sendToConnection(connectionId, {
                type: 'action_failed',
                error: error.message
            });
        }
    }
    
    async handleZoneChange(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection.isAuthenticated) return;
        
        const { targetZone } = data;
        const previousZone = connection.currentZone;
        
        try {
            // Validate zone exists
            // TODO: Check zone requirements (level, achievements, etc.)
            
            // Update connection
            connection.currentZone = targetZone;
            
            // Update entity in database
            await this.db.updateEntity(connection.entityId, {
                current_zone: targetZone
            });
            
            // Update zone populations
            this.updateZonePopulation(previousZone, -1);
            this.updateZonePopulation(targetZone, 1);
            
            // Leave previous zone room, join new zone room
            this.leaveRoom(connectionId, `zone:${previousZone}`);
            this.joinRoom(connectionId, `zone:${targetZone}`);
            
            // Log zone change action
            await this.db.logAction({
                actor_entity_id: connection.entityId,
                action_type: 'zone_change',
                action_data: { from: previousZone, to: targetZone },
                success: true,
                trigger_source: 'gaming_client'
            });
            
            this.sendToConnection(connectionId, {
                type: 'zone_changed',
                zone: targetZone,
                zoneInfo: this.getZoneInfo(targetZone)
            });
            
            // Broadcast to both zones
            this.broadcastToZone(previousZone, {
                type: 'entity_left',
                entityId: connection.entityId
            }, connectionId);
            
            this.broadcastToZone(targetZone, {
                type: 'entity_joined',
                entityId: connection.entityId
            }, connectionId);
            
        } catch (error) {
            this.sendToConnection(connectionId, {
                type: 'zone_change_failed',
                error: error.message
            });
        }
    }
    
    async handleGamepadInput(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection.isAuthenticated) return;
        
        const { buttonPattern, timing, controllerType = 'xbox' } = data;
        
        try {
            // Process the gamepad input through the database
            const execution = await this.db.executeGamepadCombo({
                combo_name: this.identifyCombo(buttonPattern),
                executor_entity_id: connection.entityId,
                timing_accuracy: this.calculateTimingAccuracy(timing),
                button_timings: timing,
                success: true,
                controller_type: controllerType,
                session_id: connectionId
            });
            
            // Send immediate feedback
            this.sendToConnection(connectionId, {
                type: 'gamepad_combo_executed',
                execution: execution.execution,
                combo: execution.combo,
                rewards: execution.rewards
            });
            
            // Broadcast to zone if it's a visible action
            this.broadcastToZone(connection.currentZone, {
                type: 'entity_combo_executed',
                entityId: connection.entityId,
                comboName: execution.combo.combo_name,
                success: true
            }, connectionId);
            
        } catch (error) {
            this.sendToConnection(connectionId, {
                type: 'gamepad_combo_failed',
                error: error.message
            });
        }
    }
    
    // ================================================
    // 📡 DATABASE EVENT HANDLERS
    // ================================================
    
    async setupDatabaseListeners() {
        // Listen for entity updates
        this.db.on('entity_updated', (entity) => {
            this.handleEntityUpdate(entity);
        });
        
        // Listen for actions
        this.db.on('action_logged', (action) => {
            this.handleActionLogged(action);
        });
        
        // Listen for achievements
        this.db.on('achievement_unlocked', (data) => {
            this.handleAchievementUnlocked(data);
        });
        
        // Listen for content generation
        this.db.on('content_generation_completed', (generation) => {
            this.handleContentGenerationCompleted(generation);
        });
        
        // Listen for gamepad combos
        this.db.on('gamepad_combo_executed', (data) => {
            this.handleGamepadComboExecuted(data);
        });
        
        console.log(`${this.gameElements.update} Database listeners activated`);
    }
    
    handleEntityUpdate(entity) {
        // Update local cache
        this.gameState.entities.set(entity.id, entity);
        
        // Broadcast to all connections following this entity
        this.broadcast({
            type: 'entity_updated',
            entity
        }, (connection) => {
            return connection.subscriptions.has(`entity:${entity.id}`) ||
                   connection.entityId === entity.id;
        });
        
        // Special handling for level ups
        if (entity.level && this.gameState.entities.get(entity.id)?.level < entity.level) {
            this.handleLevelUp(entity);
        }
    }
    
    handleActionLogged(action) {
        this.stats.actionsPerSecond++;
        
        // Broadcast action to zone
        const actorEntity = this.gameState.entities.get(action.actor_entity_id);
        if (actorEntity && actorEntity.current_zone) {
            this.broadcastToZone(actorEntity.current_zone, {
                type: 'action_logged',
                action,
                actor: actorEntity
            });
        }
        
        // Update active actions for real-time display
        if (!action.completed_at) {
            this.gameState.activeActions.set(action.id, action);
        } else {
            this.gameState.activeActions.delete(action.id);
        }
    }
    
    handleAchievementUnlocked(data) {
        const { unlock, achievement, entity_id } = data;
        
        // Send to the achiever
        const connection = this.getConnectionByEntityId(entity_id);
        if (connection) {
            this.sendToConnection(connection.id, {
                type: 'achievement_unlocked',
                achievement,
                unlock,
                celebration: true
            });
        }
        
        // Broadcast to zone for celebration
        const entity = this.gameState.entities.get(entity_id);
        if (entity && entity.current_zone) {
            this.broadcastToZone(entity.current_zone, {
                type: 'entity_achievement',
                entityId: entity_id,
                achievement,
                rarity: achievement.rarity
            });
        }
    }
    
    handleContentGenerationCompleted(generation) {
        // Notify the requester
        const connection = this.getConnectionByEntityId(generation.requester_entity_id);
        if (connection) {
            this.sendToConnection(connection.id, {
                type: 'content_generation_completed',
                generation,
                success: generation.status === 'completed'
            });
        }
    }
    
    handleGamepadComboExecuted(data) {
        const { execution, combo, executor, rewards } = data;
        
        // Send to executor
        const connection = this.getConnectionByEntityId(executor.id);
        if (connection) {
            this.sendToConnection(connection.id, {
                type: 'combo_executed',
                combo,
                execution,
                rewards
            });
        }
    }
    
    handleLevelUp(entity) {
        const connection = this.getConnectionByEntityId(entity.id);
        if (connection) {
            this.sendToConnection(connection.id, {
                type: 'level_up',
                entity,
                newLevel: entity.level,
                celebration: true
            });
        }
        
        // Broadcast to zone
        if (entity.current_zone) {
            this.broadcastToZone(entity.current_zone, {
                type: 'entity_level_up',
                entityId: entity.id,
                newLevel: entity.level,
                displayName: entity.display_name
            });
        }
    }
    
    // ================================================
    // 🔄 GAME STATE SYNCHRONIZATION
    // ================================================
    
    startGameStateSync() {
        // Update global statistics every 30 seconds
        setInterval(async () => {
            await this.updateGlobalStats();
        }, 30000);
        
        // Update zone populations every 10 seconds
        setInterval(() => {
            this.syncZonePopulations();
        }, 10000);
        
        // Cleanup inactive connections every 60 seconds
        setInterval(() => {
            this.cleanupInactiveConnections();
        }, 60000);
    }
    
    async updateGlobalStats() {
        try {
            const stats = await this.db.getEmpireStatistics();
            this.gameState.globalStats = stats;
            
            // Broadcast updated stats to all connections
            this.broadcast({
                type: 'global_stats_updated',
                stats
            });
            
        } catch (error) {
            console.error(`${this.gameElements.failure} Failed to update global stats:`, error);
        }
    }
    
    syncZonePopulations() {
        // Count actual connections per zone
        const zoneCounts = new Map();
        
        for (const connection of this.connections.values()) {
            if (connection.isAuthenticated && connection.currentZone) {
                const current = zoneCounts.get(connection.currentZone) || 0;
                zoneCounts.set(connection.currentZone, current + 1);
            }
        }
        
        // Update zone populations
        for (const [zoneId, count] of zoneCounts) {
            this.gameState.zones.set(zoneId, { population: count });
        }
        
        // Broadcast zone updates
        this.broadcast({
            type: 'zone_populations_updated',
            zones: Object.fromEntries(this.gameState.zones)
        });
    }
    
    cleanupInactiveConnections() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutes
        
        for (const [connectionId, connection] of this.connections) {
            if (now - connection.lastActivity > timeout) {
                console.log(`${this.gameElements.connection} Cleaning up inactive connection: ${connectionId}`);
                connection.ws.terminate();
                this.handleDisconnection(connectionId);
            }
        }
    }
    
    startPerformanceMonitoring() {
        setInterval(() => {
            const now = Date.now();
            const timeDiff = now - this.stats.lastUpdate;
            
            // Calculate rates
            this.stats.messagesPerSecond = Math.round((this.stats.messagesPerSecond * 1000) / timeDiff);
            this.stats.actionsPerSecond = Math.round((this.stats.actionsPerSecond * 1000) / timeDiff);
            
            // Reset counters
            this.stats.lastUpdate = now;
            this.stats.messagesPerSecond = 0;
            this.stats.actionsPerSecond = 0;
            
            // Log performance if high load
            if (this.stats.connections > 100) {
                console.log(`${this.gameElements.engine} Performance: ${this.stats.connections} connections, ${this.stats.messagesPerSecond} msg/s, ${this.stats.actionsPerSecond} actions/s`);
            }
        }, 10000); // Every 10 seconds
    }
    
    // ================================================
    // 📤 BROADCASTING UTILITIES
    // ================================================
    
    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.ws.readyState === WebSocket.OPEN) {
            try {
                connection.ws.send(JSON.stringify(message));
                this.stats.messagesPerSecond++;
            } catch (error) {
                console.error(`${this.gameElements.failure} Failed to send to ${connectionId}:`, error);
            }
        }
    }
    
    broadcast(message, filter = null) {
        for (const [connectionId, connection] of this.connections) {
            if (!filter || filter(connection)) {
                this.sendToConnection(connectionId, message);
            }
        }
    }
    
    broadcastToZone(zoneId, message, excludeConnectionId = null) {
        this.broadcast(message, (connection) => {
            return connection.currentZone === zoneId && 
                   connection.id !== excludeConnectionId &&
                   connection.isAuthenticated;
        });
    }
    
    broadcastToRoom(roomId, message, excludeConnectionId = null) {
        const room = this.rooms.get(roomId);
        if (room) {
            for (const connectionId of room) {
                if (connectionId !== excludeConnectionId) {
                    this.sendToConnection(connectionId, message);
                }
            }
        }
    }
    
    broadcastAction(action) {
        // Determine who should receive this action
        const message = {
            type: 'empire_action',
            action,
            timestamp: Date.now()
        };
        
        // Broadcast to all authenticated connections
        this.broadcast(message, (connection) => connection.isAuthenticated);
    }
    
    // ================================================
    // 🔧 UTILITY METHODS
    // ================================================
    
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    joinRoom(connectionId, roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(connectionId);
    }
    
    leaveRoom(connectionId, roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.delete(connectionId);
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }
    
    getConnectionByEntityId(entityId) {
        for (const connection of this.connections.values()) {
            if (connection.entityId === entityId) {
                return connection;
            }
        }
        return null;
    }
    
    updateZonePopulation(zoneId, delta) {
        const zone = this.gameState.zones.get(zoneId) || { population: 0 };
        zone.population = Math.max(0, zone.population + delta);
        this.gameState.zones.set(zoneId, zone);
    }
    
    getPublicGameState() {
        return {
            zones: Object.fromEntries(this.gameState.zones),
            globalStats: this.gameState.globalStats,
            activeConnections: this.stats.connections,
            serverUptime: Date.now() - this.stats.uptime
        };
    }
    
    getEntityGameState(entityId) {
        const entity = this.gameState.entities.get(entityId);
        if (!entity) return null;
        
        return {
            entity,
            zone: this.getZoneInfo(entity.current_zone),
            nearbyEntities: this.getNearbyEntities(entityId),
            activeActions: Array.from(this.gameState.activeActions.values())
                .filter(action => action.actor_entity_id === entityId)
        };
    }
    
    getZoneInfo(zoneId) {
        return {
            id: zoneId,
            population: this.gameState.zones.get(zoneId)?.population || 0,
            // TODO: Add zone properties from database
        };
    }
    
    getNearbyEntities(entityId) {
        const entity = this.gameState.entities.get(entityId);
        if (!entity) return [];
        
        // Return other entities in the same zone
        return Array.from(this.gameState.entities.values())
            .filter(e => e.id !== entityId && e.current_zone === entity.current_zone)
            .slice(0, 20); // Limit for performance
    }
    
    identifyCombo(buttonPattern) {
        // Simple combo identification - would be more sophisticated in practice
        const patternStr = buttonPattern.join(',');
        
        const comboMap = {
            'START,A,A': 'content_gacha',
            'LB,RB': 'quick_content',
            'START,LT,RT,A': 'epic_content',
            'RB,RB': 'prayer_flick',
            'X,Y,B,RT': 'dps_rotation'
        };
        
        return comboMap[patternStr] || 'unknown_combo';
    }
    
    calculateTimingAccuracy(timing) {
        // Calculate timing accuracy based on button press intervals
        if (!timing || timing.length < 2) return 1.0;
        
        // Simple calculation - real implementation would be more sophisticated
        return Math.max(0.5, Math.min(1.0, 1 - (timing.variance || 0) / 1000));
    }
    
    async healthCheck() {
        const dbHealth = await this.db.healthCheck();
        
        return {
            status: 'healthy',
            version: this.version,
            uptime: Date.now() - this.stats.uptime,
            connections: this.stats.connections,
            rooms: this.rooms.size,
            database: dbHealth,
            performance: {
                messagesPerSecond: this.stats.messagesPerSecond,
                actionsPerSecond: this.stats.actionsPerSecond
            }
        };
    }
    
    async shutdown() {
        console.log(`${this.gameElements.engine} Shutting down Gaming Engine...`);
        
        // Close all WebSocket connections
        for (const connection of this.connections.values()) {
            connection.ws.close(1000, 'Server shutting down');
        }
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close database connection
        await this.db.close();
        
        console.log(`${this.gameElements.success} Gaming Engine shutdown complete`);
    }
}

module.exports = RealTimeGamingEngine;

// CLI usage
if (require.main === module) {
    const engine = new RealTimeGamingEngine();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await engine.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await engine.shutdown();
        process.exit(0);
    });
    
    console.log(`
🎮 REAL-TIME GAMING ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 WebSocket Server: ws://localhost:${engine.port}
📡 Real-time empire updates and multiplayer interactions
🎯 Gamepad combo processing and live feedback
🏆 Achievement notifications and celebrations
📊 Live statistics and zone populations

Ready for gaming connections!
    `);
}