/**
 * WebSocket Manager - Real-time communication with clients
 */

const { Server } = require('socket.io');
const { createServer } = require('http');

class WebSocketManager {
  constructor() {
    this.io = null;
    this.server = null;
    this.connections = new Map(); // jobId -> socket connections
    this.initialized = false;
    
    console.log('🔌 WebSocket Manager initialized');
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer) {
    if (this.initialized) return;

    this.server = httpServer;
    this.io = new Server(httpServer, {
      cors: {
        origin: "*", // Configure this properly in production
        methods: ["GET", "POST"]
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.initialized = true;

    console.log('🔌 WebSocket server initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle job subscription
      socket.on('subscribe:job', (jobId) => {
        this.subscribeToJob(socket, jobId);
      });

      // Handle job unsubscription
      socket.on('unsubscribe:job', (jobId) => {
        this.unsubscribeFromJob(socket, jobId);
      });

      // Handle general app subscription
      socket.on('subscribe:app', () => {
        socket.join('app');
        console.log(`🔌 Client ${socket.id} subscribed to app events`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle client disconnect
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
        this.cleanupClientSubscriptions(socket);
      });

      // Send welcome message
      socket.emit('connected', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        events: [
          'processing:started',
          'parsing:progress',
          'analysis:progress',
          'extraction:progress',
          'generation:progress',
          'processing:completed',
          'processing:failed'
        ]
      });
    });

    console.log('🔌 WebSocket event handlers setup complete');
  }

  /**
   * Subscribe a socket to job updates
   */
  subscribeToJob(socket, jobId) {
    if (!jobId) return;

    const roomName = `job:${jobId}`;
    socket.join(roomName);

    // Track the connection
    if (!this.connections.has(jobId)) {
      this.connections.set(jobId, new Set());
    }
    this.connections.get(jobId).add(socket.id);

    console.log(`🔌 Client ${socket.id} subscribed to job ${jobId}`);

    // Send confirmation
    socket.emit('subscription:confirmed', {
      jobId,
      room: roomName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Unsubscribe a socket from job updates
   */
  unsubscribeFromJob(socket, jobId) {
    if (!jobId) return;

    const roomName = `job:${jobId}`;
    socket.leave(roomName);

    // Remove from tracking
    if (this.connections.has(jobId)) {
      this.connections.get(jobId).delete(socket.id);
      
      // Clean up empty sets
      if (this.connections.get(jobId).size === 0) {
        this.connections.delete(jobId);
      }
    }

    console.log(`🔌 Client ${socket.id} unsubscribed from job ${jobId}`);

    // Send confirmation
    socket.emit('unsubscription:confirmed', {
      jobId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Clean up all subscriptions for a disconnected client
   */
  cleanupClientSubscriptions(socket) {
    for (const [jobId, socketIds] of this.connections.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        
        // Clean up empty sets
        if (socketIds.size === 0) {
          this.connections.delete(jobId);
        }
      }
    }
  }

  /**
   * Emit an event to all clients subscribed to a specific job
   */
  emit(jobId, event, data) {
    if (!this.io || !jobId) return;

    const roomName = `job:${jobId}`;
    
    // Add metadata to the event
    const eventData = {
      ...data,
      jobId,
      event,
      timestamp: new Date().toISOString()
    };

    this.io.to(roomName).emit(event, eventData);

    console.log(`🔌 Emitted ${event} to job ${jobId} (${this.getJobSubscriberCount(jobId)} clients)`);
  }

  /**
   * Emit an event to all connected clients
   */
  broadcast(event, data) {
    if (!this.io) return;

    const eventData = {
      ...data,
      event,
      timestamp: new Date().toISOString()
    };

    this.io.emit(event, eventData);
    console.log(`🔌 Broadcasted ${event} to all clients`);
  }

  /**
   * Emit an event to app subscribers
   */
  emitToApp(event, data) {
    if (!this.io) return;

    const eventData = {
      ...data,
      event,
      timestamp: new Date().toISOString()
    };

    this.io.to('app').emit(event, eventData);
    console.log(`🔌 Emitted ${event} to app subscribers`);
  }

  /**
   * Get the number of clients subscribed to a job
   */
  getJobSubscriberCount(jobId) {
    const roomName = `job:${jobId}`;
    const room = this.io?.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    if (!this.io) {
      return {
        connected: 0,
        jobs: 0,
        rooms: 0
      };
    }

    const totalConnections = this.io.sockets.sockets.size;
    const jobConnections = this.connections.size;
    const totalRooms = this.io.sockets.adapter.rooms.size;

    return {
      connected: totalConnections,
      jobs: jobConnections,
      rooms: totalRooms,
      connectionDetails: Array.from(this.connections.entries()).map(([jobId, socketIds]) => ({
        jobId,
        subscribers: socketIds.size
      }))
    };
  }

  /**
   * Send a progress update for a job
   */
  sendProgress(jobId, stage, progress, message) {
    this.emit(jobId, 'processing:progress', {
      stage,
      progress: Math.round(progress),
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send an error for a job
   */
  sendError(jobId, error, stage = null) {
    this.emit(jobId, 'processing:error', {
      error: error.message || error,
      stage,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send job completion notification
   */
  sendCompletion(jobId, results) {
    this.emit(jobId, 'processing:completed', {
      results,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send system notification to all clients
   */
  sendSystemNotification(type, message, data = {}) {
    this.broadcast('system:notification', {
      type, // 'info', 'warning', 'error', 'success'
      message,
      ...data
    });
  }

  /**
   * Send health check to specific job subscribers
   */
  sendHealthCheck(jobId) {
    this.emit(jobId, 'health:check', {
      status: 'healthy',
      serverTime: new Date().toISOString()
    });
  }

  /**
   * Close WebSocket server
   */
  close() {
    if (this.io) {
      this.io.close();
      console.log('🔌 WebSocket server closed');
    }
    
    this.connections.clear();
    this.initialized = false;
  }

  /**
   * Check if WebSocket server is initialized
   */
  isInitialized() {
    return this.initialized && this.io !== null;
  }

  /**
   * Force disconnect all clients
   */
  disconnectAll() {
    if (this.io) {
      this.io.sockets.sockets.forEach(socket => {
        socket.disconnect(true);
      });
      console.log('🔌 Disconnected all WebSocket clients');
    }
  }

  /**
   * Send custom event to specific job
   */
  sendCustomEvent(jobId, eventName, data) {
    this.emit(jobId, eventName, data);
  }

  /**
   * Get all active job subscriptions
   */
  getActiveJobs() {
    return Array.from(this.connections.keys());
  }

  /**
   * Check if a job has active subscribers
   */
  hasSubscribers(jobId) {
    return this.connections.has(jobId) && this.connections.get(jobId).size > 0;
  }
}

module.exports = WebSocketManager;