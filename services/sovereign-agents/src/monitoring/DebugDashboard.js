/**
 * Debug Dashboard - Real-time monitoring and debugging for Sovereign Agents
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class DebugDashboard extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      port: options.port || 8086,
      enableWebUI: options.enableWebUI !== false,
      maxConnections: options.maxConnections || 100,
      enableMetrics: options.enableMetrics !== false,
      metricsInterval: options.metricsInterval || 5000,
      enableEventRecording: options.enableEventRecording !== false,
      maxEventHistory: options.maxEventHistory || 10000,
      ...options
    };

    this.wsServer = null;
    this.clients = new Map();
    this.eventHistory = [];
    this.agentStates = new Map();
    this.systemMetrics = {
      startTime: new Date(),
      totalEvents: 0,
      totalAgents: 0,
      totalActions: 0,
      errors: 0,
      connections: 0
    };

    this.metricsInterval = null;
    this.isRunning = false;
  }

  /**
   * Start the debug dashboard server
   */
  async start() {
    try {
      console.log('🔍 Starting Debug Dashboard...');

      // Create WebSocket server
      this.wsServer = new WebSocket.Server({ 
        port: this.options.port,
        maxPayload: 1024 * 1024 // 1MB max payload
      });

      // Set up WebSocket event handlers
      this.setupWebSocketHandlers();

      // Start metrics collection
      if (this.options.enableMetrics) {
        this.startMetricsCollection();
      }

      this.isRunning = true;
      console.log(`✅ Debug Dashboard running on ws://localhost:${this.options.port}`);
      
      if (this.options.enableWebUI) {
        console.log(`🌐 Web UI available at http://localhost:${this.options.port}/debug`);
      }

      this.emit('dashboard:started', { port: this.options.port });

    } catch (error) {
      console.error('❌ Failed to start Debug Dashboard:', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupWebSocketHandlers() {
    this.wsServer.on('connection', (ws, req) => {
      const clientId = uuidv4();
      const client = {
        id: clientId,
        ws,
        connectedAt: new Date(),
        subscriptions: new Set(),
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      this.clients.set(clientId, client);
      this.systemMetrics.connections++;

      console.log(`🔌 Debug client connected: ${clientId} (${this.clients.size} total)`);

      // Send welcome message with current state
      this.sendToClient(clientId, {
        type: 'welcome',
        clientId,
        systemInfo: this.getSystemInfo(),
        agentStates: this.getAgentStatesSummary()
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        this.handleClientMessage(clientId, data);
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(clientId);
        this.systemMetrics.connections--;
        console.log(`🔌 Debug client disconnected: ${clientId} (${this.clients.size} total)`);
      });

      // Handle WebSocket errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
        this.systemMetrics.connections--;
      });
    });

    this.wsServer.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
      this.emit('dashboard:error', error);
    });
  }

  /**
   * Handle messages from debug clients
   */
  handleClientMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);
      
      if (!client) return;

      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(clientId, message.channels || []);
          break;

        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.channels || []);
          break;

        case 'getHistory':
          this.sendEventHistory(clientId, message.filters);
          break;

        case 'getAgentState':
          this.sendAgentState(clientId, message.agentId);
          break;

        case 'getMetrics':
          this.sendMetrics(clientId);
          break;

        case 'executeCommand':
          this.handleDebugCommand(clientId, message.command, message.params);
          break;

        default:
          console.warn(`⚠️ Unknown message type from client ${clientId}:`, message.type);
      }

    } catch (error) {
      console.error(`❌ Error handling client message from ${clientId}:`, error);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  /**
   * Handle client subscriptions
   */
  handleSubscription(clientId, channels) {
    const client = this.clients.get(clientId);
    if (!client) return;

    for (const channel of channels) {
      client.subscriptions.add(channel);
    }

    this.sendToClient(clientId, {
      type: 'subscribed',
      channels,
      totalSubscriptions: client.subscriptions.size
    });

    console.log(`📺 Client ${clientId} subscribed to: ${channels.join(', ')}`);
  }

  /**
   * Handle client unsubscriptions
   */
  handleUnsubscription(clientId, channels) {
    const client = this.clients.get(clientId);
    if (!client) return;

    for (const channel of channels) {
      client.subscriptions.delete(channel);
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      channels,
      totalSubscriptions: client.subscriptions.size
    });
  }

  /**
   * Send event history to client
   */
  sendEventHistory(clientId, filters = {}) {
    let events = [...this.eventHistory];

    // Apply filters
    if (filters.agentId) {
      events = events.filter(event => event.agentId === filters.agentId);
    }
    if (filters.eventType) {
      events = events.filter(event => event.type === filters.eventType);
    }
    if (filters.since) {
      const since = new Date(filters.since);
      events = events.filter(event => new Date(event.timestamp) > since);
    }

    // Limit results
    const limit = Math.min(filters.limit || 1000, 1000);
    events = events.slice(0, limit);

    this.sendToClient(clientId, {
      type: 'eventHistory',
      events,
      totalEvents: this.eventHistory.length,
      filteredEvents: events.length,
      filters
    });
  }

  /**
   * Send agent state to client
   */
  sendAgentState(clientId, agentId) {
    const agentState = this.agentStates.get(agentId);
    
    this.sendToClient(clientId, {
      type: 'agentState',
      agentId,
      state: agentState || null,
      found: !!agentState
    });
  }

  /**
   * Send current metrics to client
   */
  sendMetrics(clientId) {
    this.sendToClient(clientId, {
      type: 'metrics',
      systemMetrics: this.systemMetrics,
      agentMetrics: this.getAgentMetrics(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle debug commands
   */
  async handleDebugCommand(clientId, command, params = {}) {
    try {
      let result;

      switch (command) {
        case 'pauseAgent':
          result = await this.pauseAgent(params.agentId);
          break;

        case 'resumeAgent':
          result = await this.resumeAgent(params.agentId);
          break;

        case 'restartAgent':
          result = await this.restartAgent(params.agentId);
          break;

        case 'clearHistory':
          result = this.clearEventHistory();
          break;

        case 'exportData':
          result = await this.exportDebugData(params.format);
          break;

        default:
          throw new Error(`Unknown debug command: ${command}`);
      }

      this.sendToClient(clientId, {
        type: 'commandResult',
        command,
        params,
        result,
        success: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Debug command failed (${command}):`, error);
      
      this.sendToClient(clientId, {
        type: 'commandResult',
        command,
        params,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Record an event for debugging
   */
  recordEvent(event) {
    if (!this.options.enableEventRecording) return;

    const debugEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...event
    };

    // Add to history
    this.eventHistory.unshift(debugEvent);

    // Trim history if too large
    if (this.eventHistory.length > this.options.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(0, this.options.maxEventHistory);
    }

    // Update metrics
    this.systemMetrics.totalEvents++;

    // Broadcast to subscribed clients
    this.broadcastToSubscribers('events', {
      type: 'event',
      event: debugEvent
    });

    // Emit local event
    this.emit('event:recorded', debugEvent);
  }

  /**
   * Update agent state
   */
  updateAgentState(agentId, state) {
    const existingState = this.agentStates.get(agentId);
    const updatedState = {
      ...existingState,
      ...state,
      lastUpdated: new Date().toISOString()
    };

    this.agentStates.set(agentId, updatedState);

    // Update metrics
    this.systemMetrics.totalAgents = this.agentStates.size;

    // Broadcast state update
    this.broadcastToSubscribers('agent-states', {
      type: 'agentStateUpdate',
      agentId,
      state: updatedState
    });

    // Record as event
    this.recordEvent({
      type: 'agent.state.updated',
      agentId,
      state: updatedState
    });
  }

  /**
   * Record action execution
   */
  recordAction(actionData) {
    this.systemMetrics.totalActions++;

    // Record as event
    this.recordEvent({
      type: 'action.executed',
      ...actionData
    });

    // Broadcast to subscribers
    this.broadcastToSubscribers('actions', {
      type: 'actionExecuted',
      action: actionData
    });
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    this.systemMetrics.errors++;

    const errorEvent = {
      type: 'error',
      message: error.message,
      stack: error.stack,
      context,
      severity: context.severity || 'error'
    };

    // Record as event
    this.recordEvent(errorEvent);

    // Broadcast to subscribers
    this.broadcastToSubscribers('errors', {
      type: 'error',
      error: errorEvent
    });
  }

  /**
   * Broadcast message to subscribed clients
   */
  broadcastToSubscribers(channel, message) {
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(channel) || client.subscriptions.has('all')) {
        this.sendToClient(client.id, message);
      }
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify({
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error(`❌ Error sending message to client ${clientId}:`, error);
      return false;
    }
  }

  /**
   * Send error message to client
   */
  sendError(clientId, errorMessage) {
    this.sendToClient(clientId, {
      type: 'error',
      message: errorMessage
    });
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      const metrics = {
        timestamp: new Date().toISOString(),
        system: this.systemMetrics,
        agents: this.getAgentMetrics(),
        memory: process.memoryUsage(),
        uptime: process.uptime()
      };

      // Broadcast metrics to subscribers
      this.broadcastToSubscribers('metrics', {
        type: 'metricsUpdate',
        metrics
      });

    }, this.options.metricsInterval);
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      startTime: this.systemMetrics.startTime,
      uptime: Date.now() - this.systemMetrics.startTime.getTime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: process.memoryUsage(),
      options: this.options
    };
  }

  /**
   * Get agent states summary
   */
  getAgentStatesSummary() {
    const summary = {};
    for (const [agentId, state] of this.agentStates) {
      summary[agentId] = {
        status: state.status || 'unknown',
        lastUpdated: state.lastUpdated,
        actions: state.totalActions || 0,
        errors: state.totalErrors || 0
      };
    }
    return summary;
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics() {
    const metrics = {
      totalAgents: this.agentStates.size,
      activeAgents: 0,
      idleAgents: 0,
      errorAgents: 0
    };

    for (const state of this.agentStates.values()) {
      switch (state.status) {
        case 'active':
        case 'thinking':
        case 'executing':
          metrics.activeAgents++;
          break;
        case 'idle':
        case 'waiting':
          metrics.idleAgents++;
          break;
        case 'error':
        case 'failed':
          metrics.errorAgents++;
          break;
      }
    }

    return metrics;
  }

  /**
   * Clear event history
   */
  clearEventHistory() {
    const clearedCount = this.eventHistory.length;
    this.eventHistory = [];
    
    console.log(`🧹 Cleared ${clearedCount} events from debug history`);
    
    // Broadcast clear event
    this.broadcastToSubscribers('events', {
      type: 'historyCleared',
      clearedCount
    });

    return { clearedCount };
  }

  /**
   * Export debug data
   */
  async exportDebugData(format = 'json') {
    const data = {
      exportedAt: new Date().toISOString(),
      systemInfo: this.getSystemInfo(),
      systemMetrics: this.systemMetrics,
      agentStates: Object.fromEntries(this.agentStates),
      eventHistory: this.eventHistory.slice(0, 1000), // Last 1000 events
      connections: this.clients.size
    };

    if (format === 'json') {
      return {
        format: 'json',
        data: JSON.stringify(data, null, 2),
        size: JSON.stringify(data).length
      };
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Pause agent (stub - would integrate with actual agent system)
   */
  async pauseAgent(agentId) {
    console.log(`⏸️ Pausing agent: ${agentId}`);
    this.emit('debug:pauseAgent', agentId);
    return { agentId, action: 'paused' };
  }

  /**
   * Resume agent (stub)
   */
  async resumeAgent(agentId) {
    console.log(`▶️ Resuming agent: ${agentId}`);
    this.emit('debug:resumeAgent', agentId);
    return { agentId, action: 'resumed' };
  }

  /**
   * Restart agent (stub)
   */
  async restartAgent(agentId) {
    console.log(`🔄 Restarting agent: ${agentId}`);
    this.emit('debug:restartAgent', agentId);
    return { agentId, action: 'restarted' };
  }

  /**
   * Get dashboard status
   */
  getStatus() {
    return {
      running: this.isRunning,
      port: this.options.port,
      connections: this.clients.size,
      events: this.eventHistory.length,
      agents: this.agentStates.size,
      uptime: this.isRunning ? Date.now() - this.systemMetrics.startTime.getTime() : 0
    };
  }

  /**
   * Get connected clients info
   */
  getClients() {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      connectedAt: client.connectedAt,
      subscriptions: Array.from(client.subscriptions),
      ip: client.ip,
      userAgent: client.userAgent
    }));
  }

  /**
   * Stop the dashboard
   */
  async stop() {
    console.log('🔄 Stopping Debug Dashboard...');

    // Clear metrics interval
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close();
      }
    }
    this.clients.clear();

    // Close WebSocket server
    if (this.wsServer) {
      await new Promise((resolve) => {
        this.wsServer.close(resolve);
      });
      this.wsServer = null;
    }

    this.isRunning = false;
    console.log('✅ Debug Dashboard stopped');
    this.emit('dashboard:stopped');
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      healthy: this.isRunning,
      port: this.options.port,
      connections: this.clients.size,
      metrics: this.systemMetrics,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DebugDashboard;