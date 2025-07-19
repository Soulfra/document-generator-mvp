"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocketService = exports.webSocketService = exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("../../utils/logger");
const agent_manager_service_1 = require("../orchestration/agent-manager.service");
const agent_registry_service_1 = require("../orchestration/agent-registry.service");
const analytics_service_1 = require("../analytics/analytics.service");
class WebSocketService {
    io;
    clients = new Map();
    roomSubscriptions = new Map();
    agentStatusCache = new Map();
    constructor(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.setupEventHandlers();
        this.startPeriodicUpdates();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleClientConnection(socket);
        });
    }
    handleClientConnection(socket) {
        const clientId = socket.id;
        const session = {
            id: clientId,
            connectedAt: new Date(),
            subscriptions: new Set(),
            permissions: [],
            lastActivity: new Date()
        };
        this.clients.set(clientId, session);
        logger_1.logger.info('WebSocket client connected', { clientId });
        analytics_service_1.analyticsService.track({
            event: 'WebSocket Connected',
            properties: {
                clientId,
                timestamp: new Date()
            }
        });
        socket.on('authenticate', (data) => {
            this.handleAuthentication(socket, data);
        });
        socket.on('agent:list_request', () => {
            this.sendAgentList(socket);
        });
        socket.on('agent:assign_task', (data) => {
            this.handleTaskAssignment(socket, data);
        });
        socket.on('agent:pause', (data) => {
            this.handleAgentPause(socket, data);
        });
        socket.on('agent:resume', (data) => {
            this.handleAgentResume(socket, data);
        });
        socket.on('agent:restart', (data) => {
            this.handleAgentRestart(socket, data);
        });
        socket.on('team:stats_request', () => {
            this.sendTeamStats(socket);
        });
        socket.on('subscribe', (data) => {
            this.handleSubscription(socket, data);
        });
        socket.on('unsubscribe', (data) => {
            this.handleUnsubscription(socket, data);
        });
        socket.on('ping', () => {
            this.updateClientActivity(clientId);
            socket.emit('pong');
        });
        socket.on('disconnect', (reason) => {
            this.handleClientDisconnection(clientId, reason);
        });
        this.sendInitialData(socket);
    }
    handleAuthentication(socket, data) {
        try {
            const { userId, token, permissions } = data;
            const session = this.clients.get(socket.id);
            if (session) {
                session.userId = userId;
                session.permissions = permissions || [];
                this.clients.set(socket.id, session);
                socket.emit('authenticated', { success: true });
                logger_1.logger.info('WebSocket client authenticated', {
                    clientId: socket.id,
                    userId
                });
            }
        }
        catch (error) {
            logger_1.logger.error('WebSocket authentication failed', error);
            socket.emit('authenticated', { success: false, error: 'Authentication failed' });
        }
    }
    async sendAgentList(socket) {
        try {
            const agents = await agent_registry_service_1.agentRegistry.listAgents();
            const agentStatuses = await Promise.all(agents.map(async (agent) => {
                const status = await agent_manager_service_1.agentManager.getAgentStatus(agent.id);
                const queueLength = await agent_registry_service_1.agentRegistry.getQueueLength(agent.id);
                return {
                    id: agent.id,
                    name: agent.name,
                    type: agent.type,
                    status: status.status,
                    currentTask: status.currentTask,
                    performance: status.performance,
                    capabilities: agent.capabilities,
                    queueLength,
                    healthScore: status.healthScore
                };
            }));
            socket.emit('agent:list', agentStatuses);
        }
        catch (error) {
            logger_1.logger.error('Failed to send agent list', error);
            socket.emit('error', { message: 'Failed to retrieve agent list' });
        }
    }
    async handleTaskAssignment(socket, data) {
        try {
            const { agentId, task } = data;
            const session = this.clients.get(socket.id);
            if (!session || !this.hasPermission(session, 'assign_tasks')) {
                socket.emit('error', { message: 'Insufficient permissions' });
                return;
            }
            const taskId = await agent_registry_service_1.agentRegistry.submitTask(agentId, task.type, task.payload, task.priority || 'medium', task.timeoutMinutes || 30);
            socket.emit('task:assigned', {
                taskId,
                agentId,
                assignedAt: new Date()
            });
            this.broadcast('agent:task_update', {
                agentId,
                task: { ...task, id: taskId },
                assignedBy: session.userId
            }, socket.id);
            logger_1.logger.info('Task assigned to agent', { agentId, taskId, userId: session.userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to assign task', error);
            socket.emit('error', { message: 'Failed to assign task' });
        }
    }
    async handleAgentPause(socket, data) {
        try {
            const { agentId } = data;
            const session = this.clients.get(socket.id);
            if (!session || !this.hasPermission(session, 'control_agents')) {
                socket.emit('error', { message: 'Insufficient permissions' });
                return;
            }
            await agent_manager_service_1.agentManager.pauseAgent(agentId);
            this.broadcast('agent:status', {
                id: agentId,
                status: 'paused',
                pausedBy: session.userId,
                pausedAt: new Date()
            });
            logger_1.logger.info('Agent paused', { agentId, userId: session.userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to pause agent', error);
            socket.emit('error', { message: 'Failed to pause agent' });
        }
    }
    async handleAgentResume(socket, data) {
        try {
            const { agentId } = data;
            const session = this.clients.get(socket.id);
            if (!session || !this.hasPermission(session, 'control_agents')) {
                socket.emit('error', { message: 'Insufficient permissions' });
                return;
            }
            await agent_manager_service_1.agentManager.resumeAgent(agentId);
            this.broadcast('agent:status', {
                id: agentId,
                status: 'idle',
                resumedBy: session.userId,
                resumedAt: new Date()
            });
            logger_1.logger.info('Agent resumed', { agentId, userId: session.userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to resume agent', error);
            socket.emit('error', { message: 'Failed to resume agent' });
        }
    }
    async handleAgentRestart(socket, data) {
        try {
            const { agentId } = data;
            const session = this.clients.get(socket.id);
            if (!session || !this.hasPermission(session, 'control_agents')) {
                socket.emit('error', { message: 'Insufficient permissions' });
                return;
            }
            await agent_manager_service_1.agentManager.restartAgent(agentId);
            this.broadcast('agent:status', {
                id: agentId,
                status: 'idle',
                restartedBy: session.userId,
                restartedAt: new Date()
            });
            logger_1.logger.info('Agent restarted', { agentId, userId: session.userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to restart agent', error);
            socket.emit('error', { message: 'Failed to restart agent' });
        }
    }
    async sendTeamStats(socket) {
        try {
            const agents = await agent_registry_service_1.agentRegistry.listAgents();
            const activeAgents = agents.filter(agent => agent.status === 'idle' || agent.status === 'working');
            const stats = {
                totalAgents: agents.length,
                activeAgents: activeAgents.length,
                totalTasks: await this.getTotalTaskCount(),
                completedTasks: await this.getCompletedTaskCount(),
                avgResponseTime: await this.getAverageResponseTime(),
                systemHealth: await this.getSystemHealth(),
                collaborationEvents: await this.getCollaborationEventCount()
            };
            socket.emit('team:stats', stats);
        }
        catch (error) {
            logger_1.logger.error('Failed to send team stats', error);
            socket.emit('error', { message: 'Failed to retrieve team statistics' });
        }
    }
    handleSubscription(socket, data) {
        const { channels } = data;
        const session = this.clients.get(socket.id);
        if (!session)
            return;
        channels.forEach((channel) => {
            session.subscriptions.add(channel);
            if (!this.roomSubscriptions.has(channel)) {
                this.roomSubscriptions.set(channel, new Set());
            }
            this.roomSubscriptions.get(channel).add(socket.id);
            socket.join(channel);
        });
        this.clients.set(socket.id, session);
        socket.emit('subscribed', { channels });
    }
    handleUnsubscription(socket, data) {
        const { channels } = data;
        const session = this.clients.get(socket.id);
        if (!session)
            return;
        channels.forEach((channel) => {
            session.subscriptions.delete(channel);
            const roomClients = this.roomSubscriptions.get(channel);
            if (roomClients) {
                roomClients.delete(socket.id);
                if (roomClients.size === 0) {
                    this.roomSubscriptions.delete(channel);
                }
            }
            socket.leave(channel);
        });
        this.clients.set(socket.id, session);
        socket.emit('unsubscribed', { channels });
    }
    sendInitialData(socket) {
        this.sendAgentList(socket);
        this.sendTeamStats(socket);
    }
    updateClientActivity(clientId) {
        const session = this.clients.get(clientId);
        if (session) {
            session.lastActivity = new Date();
            this.clients.set(clientId, session);
        }
    }
    handleClientDisconnection(clientId, reason) {
        const session = this.clients.get(clientId);
        if (session) {
            session.subscriptions.forEach(channel => {
                const roomClients = this.roomSubscriptions.get(channel);
                if (roomClients) {
                    roomClients.delete(clientId);
                    if (roomClients.size === 0) {
                        this.roomSubscriptions.delete(channel);
                    }
                }
            });
            this.clients.delete(clientId);
            logger_1.logger.info('WebSocket client disconnected', {
                clientId,
                reason,
                userId: session.userId,
                duration: Date.now() - session.connectedAt.getTime()
            });
            analytics_service_1.analyticsService.track({
                event: 'WebSocket Disconnected',
                userId: session.userId,
                properties: {
                    clientId,
                    reason,
                    duration: Date.now() - session.connectedAt.getTime()
                }
            });
        }
    }
    hasPermission(session, permission) {
        return session.permissions.includes(permission) || session.permissions.includes('admin');
    }
    broadcast(event, data, excludeClientId) {
        this.io.sockets.sockets.forEach((socket, socketId) => {
            if (socketId !== excludeClientId) {
                socket.emit(event, data);
            }
        });
    }
    broadcastToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
    startPeriodicUpdates() {
        setInterval(async () => {
            try {
                const agents = await agent_registry_service_1.agentRegistry.listAgents();
                for (const agent of agents) {
                    const status = await agent_manager_service_1.agentManager.getAgentStatus(agent.id);
                    const currentStatus = this.agentStatusCache.get(agent.id);
                    if (!currentStatus || JSON.stringify(currentStatus) !== JSON.stringify(status)) {
                        this.agentStatusCache.set(agent.id, status);
                        this.broadcast('agent:status', {
                            id: agent.id,
                            ...status
                        });
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to broadcast periodic agent updates', error);
            }
        }, 5000);
        setInterval(async () => {
            try {
                const clients = Array.from(this.clients.values());
                if (clients.length > 0) {
                    for (const [socketId] of this.clients) {
                        const socket = this.io.sockets.sockets.get(socketId);
                        if (socket) {
                            await this.sendTeamStats(socket);
                        }
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to broadcast periodic team stats', error);
            }
        }, 10000);
    }
    async getTotalTaskCount() {
        return 0;
    }
    async getCompletedTaskCount() {
        return 0;
    }
    async getAverageResponseTime() {
        return 0;
    }
    async getSystemHealth() {
        return 100;
    }
    async getCollaborationEventCount() {
        return 0;
    }
    emitToUser(userId, event, data) {
        for (const [socketId, session] of this.clients) {
            if (session.userId === userId) {
                const socket = this.io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.emit(event, data);
                }
            }
        }
    }
    emitToAll(event, data) {
        this.io.emit(event, data);
    }
    getConnectedClients() {
        return this.clients.size;
    }
    getUserSessions(userId) {
        return Array.from(this.clients.values()).filter(session => session.userId === userId);
    }
}
exports.WebSocketService = WebSocketService;
const initializeWebSocketService = (httpServer) => {
    exports.webSocketService = new WebSocketService(httpServer);
    return exports.webSocketService;
};
exports.initializeWebSocketService = initializeWebSocketService;
//# sourceMappingURL=websocket.service.js.map