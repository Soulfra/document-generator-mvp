/**
 * Cross-Platform Game State Management Service
 * Manages synchronized game state across Discord, Telegram, and Web platforms
 * Provides real-time synchronization and conflict resolution
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { WebSocketServer, WebSocket } from 'ws';
import * as crypto from 'crypto';
import { logger } from '../../utils/logger';
import { RedisClient } from 'redis';
import { MetricsService } from '../monitoring/metrics.service';

interface GameSession {
  id: string;
  userId: string;
  gameType: GameType;
  platform: Platform;
  state: GameState;
  lastActivity: Date;
  expiresAt: Date;
  metadata: Record<string, any>;
}

interface GameState {
  version: number;
  timestamp: Date;
  data: Record<string, any>;
  platform: Platform;
  checksum: string;
  isDirty: boolean;
}

interface StateChange {
  id: string;
  sessionId: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  platform: Platform;
  source: string;
}

interface ConflictResolution {
  strategy: 'latest_wins' | 'merge' | 'platform_priority' | 'user_choice';
  priority: Platform[];
  mergeFields: string[];
  conflictHandlers: Map<string, ConflictHandler>;
}

interface PlatformClient {
  id: string;
  platform: Platform;
  userId: string;
  sessionId?: string;
  ws?: WebSocket;
  lastPing: Date;
  capabilities: PlatformCapabilities;
}

interface PlatformCapabilities {
  realTimeUpdates: boolean;
  richUI: boolean;
  fileTransfer: boolean;
  voiceInput: boolean;
  multimedia: boolean;
  notifications: boolean;
}

type Platform = 'discord' | 'telegram' | 'web' | 'mobile' | 'api';
type GameType = 'arena' | 'billion_dollar' | 'collaboration' | 'analysis' | 'tournament';
type ConflictHandler = (oldValue: any, newValue: any, context: any) => any;

export class GameStateService extends EventEmitter {
  private prisma: PrismaClient;
  private redis: RedisClient;
  private wss: WebSocketServer;
  private metricsService: MetricsService;
  
  private sessions: Map<string, GameSession> = new Map();
  private clients: Map<string, PlatformClient> = new Map();
  private stateChanges: Map<string, StateChange[]> = new Map();
  
  // Game state synchronization
  private syncQueues: Map<string, StateChange[]> = new Map();
  private conflictResolvers: Map<GameType, ConflictResolution> = new Map();
  
  // Platform capabilities
  private platformCapabilities: Map<Platform, PlatformCapabilities> = new Map();
  
  // Configuration
  private config = {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    stateHistoryLimit: 100,
    syncBatchSize: 10,
    syncInterval: 1000,
    conflictWindow: 5000, // 5 seconds for conflict detection
    maxClients: 1000
  };

  constructor(wsPort: number = 8082) {
    super();
    
    this.prisma = new PrismaClient();
    this.redis = new RedisClient({ host: process.env.REDIS_HOST || 'localhost' });
    this.wss = new WebSocketServer({ port: wsPort });
    this.metricsService = new MetricsService();
    
    this.initializePlatformCapabilities();
    this.initializeConflictResolvers();
    this.setupWebSocketServer();
    this.startSyncEngine();
    this.startCleanupTasks();
  }

  /**
   * Initialize platform capabilities
   */
  private initializePlatformCapabilities(): void {
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

  /**
   * Initialize conflict resolution strategies
   */
  private initializeConflictResolvers(): void {
    // Arena game conflicts
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
    
    // Billion Dollar Game conflicts
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
    
    // Collaboration conflicts
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

  /**
   * Setup WebSocket server for real-time communication
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = `client-${crypto.randomBytes(8).toString('hex')}`;
      
      const client: PlatformClient = {
        id: clientId,
        platform: 'web', // Default, will be updated on auth
        userId: '',
        ws,
        lastPing: new Date(),
        capabilities: this.platformCapabilities.get('web')!
      };
      
      this.clients.set(clientId, client);
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(clientId, data);
        } catch (error) {
          logger.error('Error parsing client message', error);
        }
      });
      
      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info('Client disconnected', { clientId });
      });
      
      ws.on('error', (error) => {
        logger.error('WebSocket error', { clientId, error });
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        capabilities: client.capabilities
      }));
      
      logger.info('Client connected', { clientId });
    });
  }

  /**
   * Handle client messages
   */
  private handleClientMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
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

  /**
   * Authenticate client
   */
  private authenticateClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    client.platform = data.platform;
    client.userId = data.userId;
    client.capabilities = this.platformCapabilities.get(data.platform) || client.capabilities;
    
    client.ws?.send(JSON.stringify({
      type: 'auth_success',
      platform: client.platform,
      capabilities: client.capabilities
    }));
    
    logger.info('Client authenticated', {
      clientId,
      platform: client.platform,
      userId: client.userId
    });
  }

  /**
   * Create new game session
   */
  async createGameSession(
    clientId: string,
    data: { gameType: GameType; initialState?: any }
  ): Promise<GameSession> {
    const client = this.clients.get(clientId);
    if (!client) throw new Error('Client not found');
    
    const sessionId = `session-${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date();
    
    const gameSession: GameSession = {
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
    
    // Store session
    this.sessions.set(sessionId, gameSession);
    await this.persistSession(gameSession);
    
    // Associate client with session
    client.sessionId = sessionId;
    
    // Initialize state change tracking
    this.stateChanges.set(sessionId, []);
    
    // Notify client
    client.ws?.send(JSON.stringify({
      type: 'session_created',
      sessionId,
      gameType: data.gameType,
      state: gameSession.state
    }));
    
    // Emit event
    this.emit('session-created', gameSession);
    
    logger.info('Game session created', {
      sessionId,
      gameType: data.gameType,
      platform: client.platform,
      userId: client.userId
    });
    
    return gameSession;
  }

  /**
   * Join existing game session
   */
  async joinGameSession(clientId: string, sessionId: string): Promise<void> {
    const client = this.clients.get(clientId);
    const session = this.sessions.get(sessionId);
    
    if (!client) {
      throw new Error('Client not found');
    }
    
    if (!session) {
      // Try to load from persistent storage
      const loadedSession = await this.loadSession(sessionId);
      if (loadedSession) {
        this.sessions.set(sessionId, loadedSession);
      } else {
        throw new Error('Session not found');
      }
    }
    
    const gameSession = this.sessions.get(sessionId)!;
    
    // Check access permissions
    if (!this.canAccessSession(client, gameSession)) {
      throw new Error('Access denied');
    }
    
    // Associate client with session
    client.sessionId = sessionId;
    
    // Update session activity
    gameSession.lastActivity = new Date();
    
    // Send current state to client
    client.ws?.send(JSON.stringify({
      type: 'session_joined',
      sessionId,
      gameType: gameSession.gameType,
      state: gameSession.state,
      history: this.getRecentStateChanges(sessionId, 10)
    }));
    
    // Notify other clients in session
    this.broadcastToSession(sessionId, {
      type: 'client_joined',
      clientId,
      platform: client.platform,
      userId: client.userId
    }, clientId);
    
    logger.info('Client joined session', {
      clientId,
      sessionId,
      platform: client.platform,
      userId: client.userId
    });
  }

  /**
   * Handle state update from client
   */
  private handleStateUpdate(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;
    
    const session = this.sessions.get(client.sessionId);
    if (!session) return;
    
    try {
      // Create state change record
      const stateChange: StateChange = {
        id: `change-${crypto.randomBytes(8).toString('hex')}`,
        sessionId: client.sessionId,
        field: data.field,
        oldValue: this.getNestedValue(session.state.data, data.field),
        newValue: data.value,
        timestamp: new Date(),
        platform: client.platform,
        source: clientId
      };
      
      // Check for conflicts
      const conflicts = this.detectConflicts(session, stateChange);
      
      if (conflicts.length > 0) {
        // Resolve conflicts
        const resolved = this.resolveConflicts(session, stateChange, conflicts);
        stateChange.newValue = resolved;
      }
      
      // Apply state change
      this.applyStateChange(session, stateChange);
      
      // Record change
      this.recordStateChange(client.sessionId, stateChange);
      
      // Broadcast to other clients
      this.broadcastToSession(client.sessionId, {
        type: 'state_changed',
        change: stateChange,
        newState: session.state
      }, clientId);
      
      // Update metrics
      this.metricsService.recordMetric({
        name: 'game_state.update',
        value: 1,
        tags: {
          gameType: session.gameType,
          platform: client.platform,
          hasConflicts: conflicts.length > 0 ? 'true' : 'false'
        }
      });
    } catch (error) {
      logger.error('Error handling state update', error);
      
      client.ws?.send(JSON.stringify({
        type: 'state_update_error',
        error: 'Failed to update state'
      }));
    }
  }

  /**
   * Detect conflicts in state changes
   */
  private detectConflicts(session: GameSession, newChange: StateChange): StateChange[] {
    const sessionChanges = this.stateChanges.get(session.id) || [];
    const conflictWindow = this.config.conflictWindow;
    const now = newChange.timestamp.getTime();
    
    return sessionChanges.filter(change => 
      change.field === newChange.field &&
      change.source !== newChange.source &&
      (now - change.timestamp.getTime()) < conflictWindow
    );
  }

  /**
   * Resolve conflicts using configured strategy
   */
  private resolveConflicts(
    session: GameSession,
    newChange: StateChange,
    conflicts: StateChange[]
  ): any {
    const resolver = this.conflictResolvers.get(session.gameType);
    if (!resolver) {
      return newChange.newValue; // Default: use new value
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
        } else {
          const priorityConflict = conflicts.find(c => c.platform === highestPriority);
          return priorityConflict ? priorityConflict.newValue : newChange.newValue;
        }
        
      case 'merge':
        if (resolver.mergeFields.includes(newChange.field)) {
          return this.mergeValues(conflicts[0].newValue, newChange.newValue);
        }
        return newChange.newValue;
        
      case 'user_choice':
        // Queue for user resolution
        this.queueUserChoice(session.id, newChange, conflicts);
        return conflicts[0].newValue; // Keep old value until resolved
        
      default:
        return newChange.newValue;
    }
  }

  /**
   * Apply state change to session
   */
  private applyStateChange(session: GameSession, change: StateChange): void {
    // Update the state data
    this.setNestedValue(session.state.data, change.field, change.newValue);
    
    // Update metadata
    session.state.version++;
    session.state.timestamp = new Date();
    session.state.checksum = this.calculateChecksum(session.state.data);
    session.state.isDirty = true;
    session.lastActivity = new Date();
    
    // Schedule persistence
    this.scheduleStatePersistence(session.id);
  }

  /**
   * Broadcast message to all clients in a session
   */
  private broadcastToSession(sessionId: string, message: any, excludeClientId?: string): void {
    for (const [clientId, client] of this.clients) {
      if (client.sessionId === sessionId && clientId !== excludeClientId && client.ws) {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          logger.error('Error broadcasting to client', { clientId, error });
        }
      }
    }
  }

  /**
   * Conflict resolution handlers
   */
  private latestWinsHandler(oldValue: any, newValue: any): any {
    return newValue;
  }

  private maxValueHandler(oldValue: any, newValue: any): any {
    return Math.max(oldValue || 0, newValue || 0);
  }

  private sumValuesHandler(oldValue: any, newValue: any): any {
    return (oldValue || 0) + (newValue || 0);
  }

  private mergeArraysHandler(oldValue: any[], newValue: any[]): any[] {
    const merged = [...(oldValue || [])];
    
    for (const item of newValue || []) {
      if (!merged.find(existing => this.deepEqual(existing, item))) {
        merged.push(item);
      }
    }
    
    return merged;
  }

  private mergeFighterStats(oldStats: any, newStats: any): any {
    return {
      ...oldStats,
      ...newStats,
      // Take maximum for growth stats
      experience: Math.max(oldStats.experience || 0, newStats.experience || 0),
      level: Math.max(oldStats.level || 1, newStats.level || 1)
    };
  }

  private mergeBattleEvents(oldEvents: any[], newEvents: any[]): any[] {
    const merged = [...(oldEvents || [])];
    
    for (const event of newEvents || []) {
      if (!merged.find(e => e.id === event.id)) {
        merged.push(event);
      }
    }
    
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }

  private mergeDocumentContent(oldContent: string, newContent: string): string {
    // Simple merge - in production, use operational transforms
    return newContent; // For now, latest wins
  }

  private mergePermissions(oldPerms: any, newPerms: any): any {
    return {
      ...oldPerms,
      ...newPerms,
      // Union of user arrays
      users: [...new Set([...(oldPerms.users || []), ...(newPerms.users || [])])]
    };
  }

  private mergeValues(oldValue: any, newValue: any): any {
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      return this.mergeArraysHandler(oldValue, newValue);
    }
    
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return { ...oldValue, ...newValue };
    }
    
    return newValue;
  }

  /**
   * Utility methods
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  private calculateChecksum(data: any): string {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  private canAccessSession(client: PlatformClient, session: GameSession): boolean {
    // Basic access control - can be extended
    return client.userId === session.userId || 
           session.metadata.isPublic ||
           session.metadata.collaborators?.includes(client.userId);
  }

  private getHighestPriorityPlatform(platforms: Platform[], priority: Platform[]): Platform {
    for (const platform of priority) {
      if (platforms.includes(platform)) {
        return platform;
      }
    }
    return platforms[0];
  }

  private deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private recordStateChange(sessionId: string, change: StateChange): void {
    const changes = this.stateChanges.get(sessionId) || [];
    changes.push(change);
    
    // Keep only recent changes
    if (changes.length > this.config.stateHistoryLimit) {
      changes.shift();
    }
    
    this.stateChanges.set(sessionId, changes);
  }

  private getRecentStateChanges(sessionId: string, limit: number): StateChange[] {
    const changes = this.stateChanges.get(sessionId) || [];
    return changes.slice(-limit);
  }

  private queueUserChoice(sessionId: string, change: StateChange, conflicts: StateChange[]): void {
    // Implementation for user conflict resolution
    logger.info('Conflict queued for user resolution', { sessionId, field: change.field });
  }

  private scheduleStatePersistence(sessionId: string): void {
    // Debounced persistence to avoid too frequent writes
    setTimeout(async () => {
      const session = this.sessions.get(sessionId);
      if (session && session.state.isDirty) {
        await this.persistSession(session);
        session.state.isDirty = false;
      }
    }, 1000);
  }

  /**
   * Start synchronization engine
   */
  private startSyncEngine(): void {
    setInterval(() => {
      this.processSyncQueues();
      this.cleanupExpiredSessions();
      this.pingClients();
    }, this.config.syncInterval);
  }

  private startCleanupTasks(): void {
    // Clean up every hour
    setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupInactiveClients();
    }, 60 * 60 * 1000);
  }

  private processSyncQueues(): void {
    // Process pending synchronizations
    for (const [sessionId, queue] of this.syncQueues) {
      if (queue.length > 0) {
        const batch = queue.splice(0, this.config.syncBatchSize);
        this.processSyncBatch(sessionId, batch);
      }
    }
  }

  private processSyncBatch(sessionId: string, changes: StateChange[]): void {
    // Process a batch of state changes
    logger.debug('Processing sync batch', { sessionId, changeCount: changes.length });
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    
    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
        this.stateChanges.delete(sessionId);
        this.syncQueues.delete(sessionId);
        
        logger.info('Session expired and cleaned up', { sessionId });
      }
    }
  }

  private cleanupInactiveClients(): void {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [clientId, client] of this.clients) {
      if (now.getTime() - client.lastPing.getTime() > inactiveThreshold) {
        client.ws?.close();
        this.clients.delete(clientId);
        
        logger.info('Inactive client cleaned up', { clientId });
      }
    }
  }

  private pingClients(): void {
    for (const [clientId, client] of this.clients) {
      if (client.ws && client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    }
  }

  /**
   * External API methods
   */
  async createSessionFromAPI(
    userId: string,
    gameType: GameType,
    platform: Platform,
    initialState?: any
  ): Promise<GameSession> {
    const sessionId = `session-${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date();
    
    const gameSession: GameSession = {
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

  async updateSessionState(
    sessionId: string,
    field: string,
    value: any,
    platform: Platform,
    userId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const stateChange: StateChange = {
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
    
    // Broadcast to connected clients
    this.broadcastToSession(sessionId, {
      type: 'state_changed',
      change: stateChange,
      newState: session.state
    });
  }

  getSessionState(sessionId: string): GameState | null {
    const session = this.sessions.get(sessionId);
    return session ? session.state : null;
  }

  async getSessionHistory(sessionId: string, limit: number = 50): Promise<StateChange[]> {
    return this.getRecentStateChanges(sessionId, limit);
  }

  /**
   * Database operations
   */
  private async persistSession(session: GameSession): Promise<void> {
    try {
      // In production, save to database
      await this.redis.setex(
        `session:${session.id}`,
        this.config.sessionTimeout / 1000,
        JSON.stringify(session)
      );
      
      logger.debug('Session persisted', { sessionId: session.id });
    } catch (error) {
      logger.error('Error persisting session', error);
    }
  }

  private async loadSession(sessionId: string): Promise<GameSession | null> {
    try {
      const data = await this.redis.get(`session:${sessionId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Error loading session', error);
    }
    return null;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    activeSessions: number;
    connectedClients: number;
    totalStateChanges: number;
    sessionsByGame: Record<GameType, number>;
    clientsByPlatform: Record<Platform, number>;
  } {
    const sessionsByGame: Record<GameType, number> = {} as any;
    const clientsByPlatform: Record<Platform, number> = {} as any;
    
    // Count sessions by game type
    for (const session of this.sessions.values()) {
      sessionsByGame[session.gameType] = (sessionsByGame[session.gameType] || 0) + 1;
    }
    
    // Count clients by platform
    for (const client of this.clients.values()) {
      clientsByPlatform[client.platform] = (clientsByPlatform[client.platform] || 0) + 1;
    }
    
    // Count total state changes
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

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    // Close all WebSocket connections
    for (const client of this.clients.values()) {
      client.ws?.close();
    }
    
    // Persist all dirty sessions
    for (const session of this.sessions.values()) {
      if (session.state.isDirty) {
        await this.persistSession(session);
      }
    }
    
    // Close servers
    this.wss.close();
    await this.redis.quit();
    
    logger.info('Game state service stopped');
  }
}