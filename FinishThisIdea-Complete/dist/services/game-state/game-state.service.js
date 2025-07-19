"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateService = void 0;
const events_1 = require("events");
const client_1 = require("@prisma/client");
const ws_1 = require("ws");
const crypto = __importStar(require("crypto"));
const logger_1 = require("../../utils/logger");
const redis_1 = require("redis");
const metrics_service_1 = require("../monitoring/metrics.service");
class GameStateService extends events_1.EventEmitter {
    prisma;
    redis;
    wss;
    metricsService;
    sessions = new Map();
    clients = new Map();
    stateChanges = new Map();
    syncQueues = new Map();
    conflictResolvers = new Map();
    platformCapabilities = new Map();
    config = {
        sessionTimeout: 24 * 60 * 60 * 1000,
        stateHistoryLimit: 100,
        syncBatchSize: 10,
        syncInterval: 1000,
        conflictWindow: 5000,
        maxClients: 1000
    };
    constructor(wsPort = 8082) {
        super();
        this.prisma = new client_1.PrismaClient();
        this.redis = new redis_1.RedisClient({ host: process.env.REDIS_HOST || 'localhost' });
        this.wss = new ws_1.WebSocketServer({ port: wsPort });
        this.metricsService = new metrics_service_1.MetricsService();
        this.initializePlatformCapabilities();
        this.initializeConflictResolvers();
        this.setupWebSocketServer();
        this.startSyncEngine();
        this.startCleanupTasks();
    }
    initializePlatformCapabilities() {
        this.platformCapabilities.set('discord', {
            realTimeUpdates: true,
            richUI: true,
            fileTransfer: true,
            voiceInput: true,
            multimedia: true,
            notifications: true
        });
        this.platformCapabilities.set('telegram', {
            realTimeUpdates: true,
            richUI: true,
            fileTransfer: true,
            voiceInput: true,
            multimedia: true,
            notifications: true
        });
        this.platformCapabilities.set('web', {
            realTimeUpdates: true,
            richUI: true,
            fileTransfer: true,
            voiceInput: true,
            multimedia: true,
            notifications: true
        });
        this.platformCapabilities.set('mobile', {
            realTimeUpdates: true,
            richUI: true,
            fileTransfer: true,
            voiceInput: true,
            multimedia: true,
            notifications: true
        });
        this.platformCapabilities.set('api', {
            realTimeUpdates: false,
            richUI: false,
            fileTransfer: false,
            voiceInput: false,
            multimedia: false,
            notifications: false
        });
    }
    initializeConflictResolvers() {
        this.conflictResolvers.set('arena', {
            strategy: 'platform_priority',
            priority: ['web', 'discord', 'telegram', 'mobile', 'api'],
            mergeFields: ['spectatorBets', 'battleLog'],
            conflictHandlers: new Map([
                ['fighterStats', this.mergeFighterStats.bind(this)],
                ['battleEvents', this.mergeBattleEvents.bind(this)],
                ['userInput', this.latestWinsHandler.bind(this)]
            ])
        });
        this.conflictResolvers.set('billion_dollar', {
            strategy: 'merge',
            priority: ['web', 'discord', 'telegram'],
            mergeFields: ['agentActions', 'earnings', 'mysteryProgress'],
            conflictHandlers: new Map([
                ['agentLevel', this.maxValueHandler.bind(this)],
                ['earnings', this.sumValuesHandler.bind(this)],
                ['achievements', this.mergeArraysHandler.bind(this)]
            ])
        });
        this.conflictResolvers.set('collaboration', {
            strategy: 'latest_wins',
            priority: ['web', 'discord', 'telegram'],
            mergeFields: ['edits', 'comments', 'participants'],
            conflictHandlers: new Map([
                ['documentContent', this.mergeDocumentContent.bind(this)],
                ['permissions', this.mergePermissions.bind(this)]
            ])
        });
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            const clientId = `client-${crypto.randomBytes(8).toString('hex')}`;
            const client = {
                id: clientId,
                platform: 'web',
                userId: '',
                ws,
                lastPing: new Date(),
                capabilities: this.platformCapabilities.get('web')
            };
            this.clients.set(clientId, client);
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(clientId, data);
                }
                catch (error) {
                    logger_1.logger.error('Error parsing client message', error);
                }
            });
            ws.on('close', () => {
                this.clients.delete(clientId);
                logger_1.logger.info('Client disconnected', { clientId });
            });
            ws.on('error', (error) => {
                logger_1.logger.error('WebSocket error', { clientId, error });
            });
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId,
                capabilities: client.capabilities
            }));
            logger_1.logger.info('Client connected', { clientId });
        });
    }
    handleClientMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        client.lastPing = new Date();
        switch (data.type) {
            case 'auth':
                this.authenticateClient(clientId, data);
                break;
            case 'join_session':
                this.joinGameSession(clientId, data.sessionId);
                break;
            case 'create_session':
                this.createGameSession(clientId, data);
                break;
            case 'state_update':
                this.handleStateUpdate(clientId, data);
                break;
            case 'sync_request':
                this.handleSyncRequest(clientId, data);
                break;
            case 'ping':
                client.ws?.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    }
    authenticateClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        client.platform = data.platform;
        client.userId = data.userId;
        client.capabilities = this.platformCapabilities.get(data.platform) || client.capabilities;
        client.ws?.send(JSON.stringify({
            type: 'auth_success',
            platform: client.platform,
            capabilities: client.capabilities
        }));
        logger_1.logger.info('Client authenticated', {
            clientId,
            platform: client.platform,
            userId: client.userId
        });
    }
    async createGameSession(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            throw new Error('Client not found');
        const sessionId = `session-${crypto.randomBytes(8).toString('hex')}`;
        const now = new Date();
        const gameSession = {
            id: sessionId,
            userId: client.userId,
            gameType: data.gameType,
            platform: client.platform,
            state: {
                version: 1,
                timestamp: now,
                data: data.initialState || {},
                platform: client.platform,
                checksum: this.calculateChecksum(data.initialState || {}),
                isDirty: false
            },
            lastActivity: now,
            expiresAt: new Date(now.getTime() + this.config.sessionTimeout),
            metadata: {
                createdBy: client.platform,
                createdAt: now
            }
        };
        this.sessions.set(sessionId, gameSession);
        await this.persistSession(gameSession);
        client.sessionId = sessionId;
        this.stateChanges.set(sessionId, []);
        client.ws?.send(JSON.stringify({
            type: 'session_created',
            sessionId,
            gameType: data.gameType,
            state: gameSession.state
        }));
        this.emit('session-created', gameSession);
        logger_1.logger.info('Game session created', {
            sessionId,
            gameType: data.gameType,
            platform: client.platform,
            userId: client.userId
        });
        return gameSession;
    }
    async joinGameSession(clientId, sessionId) {
        const client = this.clients.get(clientId);
        const session = this.sessions.get(sessionId);
        if (!client) {
            throw new Error('Client not found');
        }
        if (!session) {
            const loadedSession = await this.loadSession(sessionId);
            if (loadedSession) {
                this.sessions.set(sessionId, loadedSession);
            }
            else {
                throw new Error('Session not found');
            }
        }
        const gameSession = this.sessions.get(sessionId);
        if (!this.canAccessSession(client, gameSession)) {
            throw new Error('Access denied');
        }
        client.sessionId = sessionId;
        gameSession.lastActivity = new Date();
        client.ws?.send(JSON.stringify({
            type: 'session_joined',
            sessionId,
            gameType: gameSession.gameType,
            state: gameSession.state,
            history: this.getRecentStateChanges(sessionId, 10)
        }));
        this.broadcastToSession(sessionId, {
            type: 'client_joined',
            clientId,
            platform: client.platform,
            userId: client.userId
        }, clientId);
        logger_1.logger.info('Client joined session', {
            clientId,
            sessionId,
            platform: client.platform,
            userId: client.userId
        });
    }
    handleStateUpdate(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client || !client.sessionId)
            return;
        const session = this.sessions.get(client.sessionId);
        if (!session)
            return;
        try {
            const stateChange = {
                id: `change-${crypto.randomBytes(8).toString('hex')}`,
                sessionId: client.sessionId,
                field: data.field,
                oldValue: this.getNestedValue(session.state.data, data.field),
                newValue: data.value,
                timestamp: new Date(),
                platform: client.platform,
                source: clientId
            };
            const conflicts = this.detectConflicts(session, stateChange);
            if (conflicts.length > 0) {
                const resolved = this.resolveConflicts(session, stateChange, conflicts);
                stateChange.newValue = resolved;
            }
            this.applyStateChange(session, stateChange);
            this.recordStateChange(client.sessionId, stateChange);
            this.broadcastToSession(client.sessionId, {
                type: 'state_changed',
                change: stateChange,
                newState: session.state
            }, clientId);
            this.metricsService.recordMetric({
                name: 'game_state.update',
                value: 1,
                tags: {
                    gameType: session.gameType,
                    platform: client.platform,
                    hasConflicts: conflicts.length > 0 ? 'true' : 'false'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling state update', error);
            client.ws?.send(JSON.stringify({
                type: 'state_update_error',
                error: 'Failed to update state'
            }));
        }
    }
    detectConflicts(session, newChange) {
        const sessionChanges = this.stateChanges.get(session.id) || [];
        const conflictWindow = this.config.conflictWindow;
        const now = newChange.timestamp.getTime();
        return sessionChanges.filter(change => change.field === newChange.field &&
            change.source !== newChange.source &&
            (now - change.timestamp.getTime()) < conflictWindow);
    }
    resolveConflicts(session, newChange, conflicts) {
        const resolver = this.conflictResolvers.get(session.gameType);
        if (!resolver) {
            return newChange.newValue;
        }
        const handler = resolver.conflictHandlers.get(newChange.field);
        if (handler) {
            return handler(conflicts[0].newValue, newChange.newValue, { session, conflicts });
        }
        switch (resolver.strategy) {
            case 'latest_wins':
                return newChange.newValue;
            case 'platform_priority':
                const platforms = [newChange.platform, ...conflicts.map(c => c.platform)];
                const highestPriority = this.getHighestPriorityPlatform(platforms, resolver.priority);
                if (highestPriority === newChange.platform) {
                    return newChange.newValue;
                }
                else {
                    const priorityConflict = conflicts.find(c => c.platform === highestPriority);
                    return priorityConflict ? priorityConflict.newValue : newChange.newValue;
                }
            case 'merge':
                if (resolver.mergeFields.includes(newChange.field)) {
                    return this.mergeValues(conflicts[0].newValue, newChange.newValue);
                }
                return newChange.newValue;
            case 'user_choice':
                this.queueUserChoice(session.id, newChange, conflicts);
                return conflicts[0].newValue;
            default:
                return newChange.newValue;
        }
    }
    applyStateChange(session, change) {
        this.setNestedValue(session.state.data, change.field, change.newValue);
        session.state.version++;
        session.state.timestamp = new Date();
        session.state.checksum = this.calculateChecksum(session.state.data);
        session.state.isDirty = true;
        session.lastActivity = new Date();
        this.scheduleStatePersistence(session.id);
    }
    broadcastToSession(sessionId, message, excludeClientId) {
        for (const [clientId, client] of this.clients) {
            if (client.sessionId === sessionId && clientId !== excludeClientId && client.ws) {
                try {
                    client.ws.send(JSON.stringify(message));
                }
                catch (error) {
                    logger_1.logger.error('Error broadcasting to client', { clientId, error });
                }
            }
        }
    }
    latestWinsHandler(oldValue, newValue) {
        return newValue;
    }
    maxValueHandler(oldValue, newValue) {
        return Math.max(oldValue || 0, newValue || 0);
    }
    sumValuesHandler(oldValue, newValue) {
        return (oldValue || 0) + (newValue || 0);
    }
    mergeArraysHandler(oldValue, newValue) {
        const merged = [...(oldValue || [])];
        for (const item of newValue || []) {
            if (!merged.find(existing => this.deepEqual(existing, item))) {
                merged.push(item);
            }
        }
        return merged;
    }
    mergeFighterStats(oldStats, newStats) {
        return {
            ...oldStats,
            ...newStats,
            experience: Math.max(oldStats.experience || 0, newStats.experience || 0),
            level: Math.max(oldStats.level || 1, newStats.level || 1)
        };
    }
    mergeBattleEvents(oldEvents, newEvents) {
        const merged = [...(oldEvents || [])];
        for (const event of newEvents || []) {
            if (!merged.find(e => e.id === event.id)) {
                merged.push(event);
            }
        }
        return merged.sort((a, b) => a.timestamp - b.timestamp);
    }
    mergeDocumentContent(oldContent, newContent) {
        return newContent;
    }
    mergePermissions(oldPerms, newPerms) {
        return {
            ...oldPerms,
            ...newPerms,
            users: [...new Set([...(oldPerms.users || []), ...(newPerms.users || [])])]
        };
    }
    mergeValues(oldValue, newValue) {
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
            return this.mergeArraysHandler(oldValue, newValue);
        }
        if (typeof oldValue === 'object' && typeof newValue === 'object') {
            return { ...oldValue, ...newValue };
        }
        return newValue;
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key])
                current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    calculateChecksum(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    canAccessSession(client, session) {
        return client.userId === session.userId ||
            session.metadata.isPublic ||
            session.metadata.collaborators?.includes(client.userId);
    }
    getHighestPriorityPlatform(platforms, priority) {
        for (const platform of priority) {
            if (platforms.includes(platform)) {
                return platform;
            }
        }
        return platforms[0];
    }
    deepEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    recordStateChange(sessionId, change) {
        const changes = this.stateChanges.get(sessionId) || [];
        changes.push(change);
        if (changes.length > this.config.stateHistoryLimit) {
            changes.shift();
        }
        this.stateChanges.set(sessionId, changes);
    }
    getRecentStateChanges(sessionId, limit) {
        const changes = this.stateChanges.get(sessionId) || [];
        return changes.slice(-limit);
    }
    queueUserChoice(sessionId, change, conflicts) {
        logger_1.logger.info('Conflict queued for user resolution', { sessionId, field: change.field });
    }
    scheduleStatePersistence(sessionId) {
        setTimeout(async () => {
            const session = this.sessions.get(sessionId);
            if (session && session.state.isDirty) {
                await this.persistSession(session);
                session.state.isDirty = false;
            }
        }, 1000);
    }
    startSyncEngine() {
        setInterval(() => {
            this.processSyncQueues();
            this.cleanupExpiredSessions();
            this.pingClients();
        }, this.config.syncInterval);
    }
    startCleanupTasks() {
        setInterval(() => {
            this.cleanupExpiredSessions();
            this.cleanupInactiveClients();
        }, 60 * 60 * 1000);
    }
    processSyncQueues() {
        for (const [sessionId, queue] of this.syncQueues) {
            if (queue.length > 0) {
                const batch = queue.splice(0, this.config.syncBatchSize);
                this.processSyncBatch(sessionId, batch);
            }
        }
    }
    processSyncBatch(sessionId, changes) {
        logger_1.logger.debug('Processing sync batch', { sessionId, changeCount: changes.length });
    }
    cleanupExpiredSessions() {
        const now = new Date();
        for (const [sessionId, session] of this.sessions) {
            if (session.expiresAt < now) {
                this.sessions.delete(sessionId);
                this.stateChanges.delete(sessionId);
                this.syncQueues.delete(sessionId);
                logger_1.logger.info('Session expired and cleaned up', { sessionId });
            }
        }
    }
    cleanupInactiveClients() {
        const now = new Date();
        const inactiveThreshold = 5 * 60 * 1000;
        for (const [clientId, client] of this.clients) {
            if (now.getTime() - client.lastPing.getTime() > inactiveThreshold) {
                client.ws?.close();
                this.clients.delete(clientId);
                logger_1.logger.info('Inactive client cleaned up', { clientId });
            }
        }
    }
    pingClients() {
        for (const [clientId, client] of this.clients) {
            if (client.ws && client.ws.readyState === ws_1.WebSocket.OPEN) {
                client.ws.ping();
            }
        }
    }
    async createSessionFromAPI(userId, gameType, platform, initialState) {
        const sessionId = `session-${crypto.randomBytes(8).toString('hex')}`;
        const now = new Date();
        const gameSession = {
            id: sessionId,
            userId,
            gameType,
            platform,
            state: {
                version: 1,
                timestamp: now,
                data: initialState || {},
                platform,
                checksum: this.calculateChecksum(initialState || {}),
                isDirty: false
            },
            lastActivity: now,
            expiresAt: new Date(now.getTime() + this.config.sessionTimeout),
            metadata: {
                createdBy: platform,
                createdAt: now,
                apiCreated: true
            }
        };
        this.sessions.set(sessionId, gameSession);
        await this.persistSession(gameSession);
        this.emit('session-created', gameSession);
        return gameSession;
    }
    async updateSessionState(sessionId, field, value, platform, userId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        const stateChange = {
            id: `change-${crypto.randomBytes(8).toString('hex')}`,
            sessionId,
            field,
            oldValue: this.getNestedValue(session.state.data, field),
            newValue: value,
            timestamp: new Date(),
            platform,
            source: 'api'
        };
        this.applyStateChange(session, stateChange);
        this.recordStateChange(sessionId, stateChange);
        this.broadcastToSession(sessionId, {
            type: 'state_changed',
            change: stateChange,
            newState: session.state
        });
    }
    getSessionState(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? session.state : null;
    }
    async getSessionHistory(sessionId, limit = 50) {
        return this.getRecentStateChanges(sessionId, limit);
    }
    async persistSession(session) {
        try {
            await this.redis.setex(`session:${session.id}`, this.config.sessionTimeout / 1000, JSON.stringify(session));
            logger_1.logger.debug('Session persisted', { sessionId: session.id });
        }
        catch (error) {
            logger_1.logger.error('Error persisting session', error);
        }
    }
    async loadSession(sessionId) {
        try {
            const data = await this.redis.get(`session:${sessionId}`);
            if (data) {
                return JSON.parse(data);
            }
        }
        catch (error) {
            logger_1.logger.error('Error loading session', error);
        }
        return null;
    }
    getStats() {
        const sessionsByGame = {};
        const clientsByPlatform = {};
        for (const session of this.sessions.values()) {
            sessionsByGame[session.gameType] = (sessionsByGame[session.gameType] || 0) + 1;
        }
        for (const client of this.clients.values()) {
            clientsByPlatform[client.platform] = (clientsByPlatform[client.platform] || 0) + 1;
        }
        let totalStateChanges = 0;
        for (const changes of this.stateChanges.values()) {
            totalStateChanges += changes.length;
        }
        return {
            activeSessions: this.sessions.size,
            connectedClients: this.clients.size,
            totalStateChanges,
            sessionsByGame,
            clientsByPlatform
        };
    }
    async stop() {
        for (const client of this.clients.values()) {
            client.ws?.close();
        }
        for (const session of this.sessions.values()) {
            if (session.state.isDirty) {
                await this.persistSession(session);
            }
        }
        this.wss.close();
        await this.redis.quit();
        logger_1.logger.info('Game state service stopped');
    }
}
exports.GameStateService = GameStateService;
//# sourceMappingURL=game-state.service.js.map