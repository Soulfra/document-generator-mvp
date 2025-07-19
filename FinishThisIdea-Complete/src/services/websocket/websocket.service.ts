import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../../utils/logger';
import { agentManager } from '../orchestration/agent-manager.service';
import { agentRegistry } from '../orchestration/agent-registry.service';
import { analyticsService } from '../analytics/analytics.service';

interface ClientSession {
  id: string;
  userId?: string;
  connectedAt: Date;
  subscriptions: Set<string>;
  permissions: string[];
  lastActivity: Date;
}

export class WebSocketService {
  private io: Server;
  private clients = new Map<string, ClientSession>();
  private roomSubscriptions = new Map<string, Set<string>>(); // room -> set of client IDs
  private agentStatusCache = new Map<string, any>();

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startPeriodicUpdates();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleClientConnection(socket);
    });
  }

  private handleClientConnection(socket: Socket): void {
    const clientId = socket.id;
    const session: ClientSession = {
      id: clientId,
      connectedAt: new Date(),
      subscriptions: new Set(),
      permissions: [],
      lastActivity: new Date()
    };

    this.clients.set(clientId, session);
    logger.info('WebSocket client connected', { clientId });

    // Track connection in analytics
    analyticsService.track({
      event: 'WebSocket Connected',
      properties: {
        clientId,
        timestamp: new Date()
      }
    });

    // Authentication handler
    socket.on('authenticate', (data) => {
      this.handleAuthentication(socket, data);
    });

    // Agent management handlers
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

    // Team statistics request
    socket.on('team:stats_request', () => {
      this.sendTeamStats(socket);
    });

    // Subscription management
    socket.on('subscribe', (data) => {
      this.handleSubscription(socket, data);
    });

    socket.on('unsubscribe', (data) => {
      this.handleUnsubscription(socket, data);
    });

    // Heartbeat
    socket.on('ping', () => {
      this.updateClientActivity(clientId);
      socket.emit('pong');
    });

    // Disconnection handler
    socket.on('disconnect', (reason) => {
      this.handleClientDisconnection(clientId, reason);
    });

    // Send initial data
    this.sendInitialData(socket);
  }

  private handleAuthentication(socket: Socket, data: any): void {
    try {
      const { userId, token, permissions } = data;
      const session = this.clients.get(socket.id);
      
      if (session) {
        session.userId = userId;
        session.permissions = permissions || [];
        this.clients.set(socket.id, session);
        
        socket.emit('authenticated', { success: true });
        logger.info('WebSocket client authenticated', { 
          clientId: socket.id, 
          userId 
        });
      }
    } catch (error) {
      logger.error('WebSocket authentication failed', error);
      socket.emit('authenticated', { success: false, error: 'Authentication failed' });
    }
  }

  private async sendAgentList(socket: Socket): Promise<void> {
    try {
      const agents = await agentRegistry.listAgents();
      const agentStatuses = await Promise.all(
        agents.map(async (agent) => {
          const status = await agentManager.getAgentStatus(agent.id);
          const queueLength = await agentRegistry.getQueueLength(agent.id);
          
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
        })
      );

      socket.emit('agent:list', agentStatuses);
    } catch (error) {
      logger.error('Failed to send agent list', error);
      socket.emit('error', { message: 'Failed to retrieve agent list' });
    }
  }

  private async handleTaskAssignment(socket: Socket, data: any): Promise<void> {
    try {
      const { agentId, task } = data;
      const session = this.clients.get(socket.id);
      
      if (!session || !this.hasPermission(session, 'assign_tasks')) {
        socket.emit('error', { message: 'Insufficient permissions' });
        return;
      }

      const taskId = await agentRegistry.submitTask(
        agentId,
        task.type,
        task.payload,
        task.priority || 'medium',
        task.timeoutMinutes || 30
      );

      socket.emit('task:assigned', {
        taskId,
        agentId,
        assignedAt: new Date()
      });

      // Broadcast to other clients
      this.broadcast('agent:task_update', {
        agentId,
        task: { ...task, id: taskId },
        assignedBy: session.userId
      }, socket.id);

      logger.info('Task assigned to agent', { agentId, taskId, userId: session.userId });
    } catch (error) {
      logger.error('Failed to assign task', error);
      socket.emit('error', { message: 'Failed to assign task' });
    }
  }

  private async handleAgentPause(socket: Socket, data: any): Promise<void> {
    try {
      const { agentId } = data;
      const session = this.clients.get(socket.id);
      
      if (!session || !this.hasPermission(session, 'control_agents')) {
        socket.emit('error', { message: 'Insufficient permissions' });
        return;
      }

      await agentManager.pauseAgent(agentId);
      
      this.broadcast('agent:status', {
        id: agentId,
        status: 'paused',
        pausedBy: session.userId,
        pausedAt: new Date()
      });

      logger.info('Agent paused', { agentId, userId: session.userId });
    } catch (error) {
      logger.error('Failed to pause agent', error);
      socket.emit('error', { message: 'Failed to pause agent' });
    }
  }

  private async handleAgentResume(socket: Socket, data: any): Promise<void> {
    try {
      const { agentId } = data;
      const session = this.clients.get(socket.id);
      
      if (!session || !this.hasPermission(session, 'control_agents')) {
        socket.emit('error', { message: 'Insufficient permissions' });
        return;
      }

      await agentManager.resumeAgent(agentId);
      
      this.broadcast('agent:status', {
        id: agentId,
        status: 'idle',
        resumedBy: session.userId,
        resumedAt: new Date()
      });

      logger.info('Agent resumed', { agentId, userId: session.userId });
    } catch (error) {
      logger.error('Failed to resume agent', error);
      socket.emit('error', { message: 'Failed to resume agent' });
    }
  }

  private async handleAgentRestart(socket: Socket, data: any): Promise<void> {
    try {
      const { agentId } = data;
      const session = this.clients.get(socket.id);
      
      if (!session || !this.hasPermission(session, 'control_agents')) {
        socket.emit('error', { message: 'Insufficient permissions' });
        return;
      }

      await agentManager.restartAgent(agentId);
      
      this.broadcast('agent:status', {
        id: agentId,
        status: 'idle',
        restartedBy: session.userId,
        restartedAt: new Date()
      });

      logger.info('Agent restarted', { agentId, userId: session.userId });
    } catch (error) {
      logger.error('Failed to restart agent', error);
      socket.emit('error', { message: 'Failed to restart agent' });
    }
  }

  private async sendTeamStats(socket: Socket): Promise<void> {
    try {
      const agents = await agentRegistry.listAgents();
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
    } catch (error) {
      logger.error('Failed to send team stats', error);
      socket.emit('error', { message: 'Failed to retrieve team statistics' });
    }
  }

  private handleSubscription(socket: Socket, data: any): void {
    const { channels } = data;
    const session = this.clients.get(socket.id);
    
    if (!session) return;

    channels.forEach((channel: string) => {
      session.subscriptions.add(channel);
      
      // Add to room-based subscriptions
      if (!this.roomSubscriptions.has(channel)) {
        this.roomSubscriptions.set(channel, new Set());
      }
      this.roomSubscriptions.get(channel)!.add(socket.id);
      
      socket.join(channel);
    });

    this.clients.set(socket.id, session);
    socket.emit('subscribed', { channels });
  }

  private handleUnsubscription(socket: Socket, data: any): void {
    const { channels } = data;
    const session = this.clients.get(socket.id);
    
    if (!session) return;

    channels.forEach((channel: string) => {
      session.subscriptions.delete(channel);
      
      // Remove from room-based subscriptions
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

  private sendInitialData(socket: Socket): void {
    // Send initial agent list and team stats
    this.sendAgentList(socket);
    this.sendTeamStats(socket);
  }

  private updateClientActivity(clientId: string): void {
    const session = this.clients.get(clientId);
    if (session) {
      session.lastActivity = new Date();
      this.clients.set(clientId, session);
    }
  }

  private handleClientDisconnection(clientId: string, reason: string): void {
    const session = this.clients.get(clientId);
    
    if (session) {
      // Clean up room subscriptions
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
      
      logger.info('WebSocket client disconnected', { 
        clientId, 
        reason, 
        userId: session.userId,
        duration: Date.now() - session.connectedAt.getTime()
      });

      // Track disconnection in analytics
      analyticsService.track({
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

  private hasPermission(session: ClientSession, permission: string): boolean {
    return session.permissions.includes(permission) || session.permissions.includes('admin');
  }

  private broadcast(event: string, data: any, excludeClientId?: string): void {
    this.io.sockets.sockets.forEach((socket, socketId) => {
      if (socketId !== excludeClientId) {
        socket.emit(event, data);
      }
    });
  }

  private broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  private startPeriodicUpdates(): void {
    // Send periodic agent status updates
    setInterval(async () => {
      try {
        const agents = await agentRegistry.listAgents();
        
        for (const agent of agents) {
          const status = await agentManager.getAgentStatus(agent.id);
          const currentStatus = this.agentStatusCache.get(agent.id);
          
          // Only broadcast if status changed
          if (!currentStatus || JSON.stringify(currentStatus) !== JSON.stringify(status)) {
            this.agentStatusCache.set(agent.id, status);
            this.broadcast('agent:status', {
              id: agent.id,
              ...status
            });
          }
        }
      } catch (error) {
        logger.error('Failed to broadcast periodic agent updates', error);
      }
    }, 5000); // Every 5 seconds

    // Send periodic team stats
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
      } catch (error) {
        logger.error('Failed to broadcast periodic team stats', error);
      }
    }, 10000); // Every 10 seconds
  }

  // Helper methods for statistics
  private async getTotalTaskCount(): Promise<number> {
    // Implementation would query your task database
    return 0; // Placeholder
  }

  private async getCompletedTaskCount(): Promise<number> {
    // Implementation would query your task database
    return 0; // Placeholder
  }

  private async getAverageResponseTime(): Promise<number> {
    // Implementation would calculate from task completion times
    return 0; // Placeholder
  }

  private async getSystemHealth(): Promise<number> {
    // Implementation would calculate based on agent health scores
    return 100; // Placeholder
  }

  private async getCollaborationEventCount(): Promise<number> {
    // Implementation would count collaboration events
    return 0; // Placeholder
  }

  // Public methods for external use
  public emitToUser(userId: string, event: string, data: any): void {
    for (const [socketId, session] of this.clients) {
      if (session.userId === userId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    }
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getUserSessions(userId: string): ClientSession[] {
    return Array.from(this.clients.values()).filter(session => session.userId === userId);
  }
}

export let webSocketService: WebSocketService;

export const initializeWebSocketService = (httpServer: HttpServer): WebSocketService => {
  webSocketService = new WebSocketService(httpServer);
  return webSocketService;
};