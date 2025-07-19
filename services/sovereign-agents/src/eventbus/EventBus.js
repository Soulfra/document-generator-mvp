/**
 * Event Bus - Central event-driven communication hub for Sovereign Agents
 */

const Redis = require('redis');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      namespace: options.namespace || 'sovereign-agents',
      enablePersistence: options.enablePersistence !== false,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };

    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
    this.eventStore = new Map(); // In-memory event store for debugging
    this.subscriptions = new Map();
    this.metrics = {
      eventsPublished: 0,
      eventsReceived: 0,
      errors: 0,
      reconnections: 0
    };
  }

  /**
   * Initialize Redis connections and event handling
   */
  async initialize() {
    try {
      console.log('🔄 Initializing EventBus...');

      // Create Redis clients
      this.publisher = Redis.createClient({ url: this.options.redisUrl });
      this.subscriber = Redis.createClient({ url: this.options.redisUrl });

      // Set up error handling
      this.publisher.on('error', (err) => this.handleRedisError('publisher', err));
      this.subscriber.on('error', (err) => this.handleRedisError('subscriber', err));

      // Set up reconnection handling
      this.publisher.on('reconnecting', () => this.handleReconnection('publisher'));
      this.subscriber.on('reconnecting', () => this.handleReconnection('subscriber'));

      // Connect both clients
      await Promise.all([
        this.publisher.connect(),
        this.subscriber.connect()
      ]);

      // Set up message handling
      this.subscriber.on('message', (channel, message) => {
        this.handleIncomingMessage(channel, message);
      });

      this.isConnected = true;
      console.log('✅ EventBus initialized successfully');

      this.emit('connected');
      return true;

    } catch (error) {
      console.error('❌ EventBus initialization failed:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Publish an event to the event bus
   */
  async publish(eventType, data, options = {}) {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }

    const event = {
      id: uuidv4(),
      type: eventType,
      data: data || {},
      timestamp: new Date().toISOString(),
      source: options.source || 'unknown',
      correlationId: options.correlationId || uuidv4(),
      metadata: {
        version: '1.0.0',
        retryCount: 0,
        priority: options.priority || 'normal',
        ttl: options.ttl || 3600000, // 1 hour default
        ...options.metadata
      }
    };

    try {
      const channel = this.getChannelName(eventType);
      const message = JSON.stringify(event);

      // Store in event store if persistence enabled
      if (this.options.enablePersistence) {
        this.eventStore.set(event.id, event);
      }

      // Publish to Redis
      await this.publisher.publish(channel, message);

      this.metrics.eventsPublished++;
      console.log(`📡 Event published: ${eventType}`, {
        id: event.id,
        correlationId: event.correlationId,
        source: event.source
      });

      // Emit local event for debugging
      this.emit('event:published', event);

      return event.id;

    } catch (error) {
      console.error('❌ Failed to publish event:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Subscribe to specific event types
   */
  async subscribe(eventTypes, handler, options = {}) {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }

    const subscriptionId = uuidv4();
    const eventTypesArray = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    try {
      // Subscribe to Redis channels
      for (const eventType of eventTypesArray) {
        const channel = this.getChannelName(eventType);
        await this.subscriber.subscribe(channel);
        console.log(`🔔 Subscribed to: ${eventType}`);
      }

      // Store subscription info
      this.subscriptions.set(subscriptionId, {
        eventTypes: eventTypesArray,
        handler,
        options,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Subscription created: ${subscriptionId}`);
      return subscriptionId;

    } catch (error) {
      console.error('❌ Failed to subscribe to events:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    try {
      // Unsubscribe from Redis channels
      for (const eventType of subscription.eventTypes) {
        const channel = this.getChannelName(eventType);
        await this.subscriber.unsubscribe(channel);
      }

      // Remove subscription
      this.subscriptions.delete(subscriptionId);
      console.log(`🔕 Unsubscribed: ${subscriptionId}`);

    } catch (error) {
      console.error('❌ Failed to unsubscribe:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Handle incoming Redis messages
   */
  handleIncomingMessage(channel, message) {
    try {
      const event = JSON.parse(message);
      const eventType = this.getEventTypeFromChannel(channel);

      this.metrics.eventsReceived++;
      console.log(`📨 Event received: ${eventType}`, {
        id: event.id,
        correlationId: event.correlationId,
        source: event.source
      });

      // Store in event store if persistence enabled
      if (this.options.enablePersistence && !this.eventStore.has(event.id)) {
        this.eventStore.set(event.id, event);
      }

      // Call handlers for matching subscriptions
      for (const [subscriptionId, subscription] of this.subscriptions) {
        if (subscription.eventTypes.includes(eventType)) {
          try {
            subscription.handler(event, eventType, subscriptionId);
          } catch (handlerError) {
            console.error(`❌ Handler error for ${subscriptionId}:`, handlerError);
            this.metrics.errors++;
          }
        }
      }

      // Emit local event for debugging
      this.emit('event:received', event);

    } catch (error) {
      console.error('❌ Failed to handle incoming message:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Get Redis channel name for event type
   */
  getChannelName(eventType) {
    return `${this.options.namespace}:events:${eventType}`;
  }

  /**
   * Extract event type from Redis channel name
   */
  getEventTypeFromChannel(channel) {
    const prefix = `${this.options.namespace}:events:`;
    return channel.startsWith(prefix) ? channel.slice(prefix.length) : channel;
  }

  /**
   * Handle Redis connection errors
   */
  handleRedisError(clientType, error) {
    console.error(`❌ Redis ${clientType} error:`, error);
    this.metrics.errors++;
    this.emit('error', { clientType, error });
  }

  /**
   * Handle Redis reconnections
   */
  handleReconnection(clientType) {
    console.log(`🔄 Redis ${clientType} reconnecting...`);
    this.metrics.reconnections++;
    this.emit('reconnecting', { clientType });
  }

  /**
   * Get event by ID from store
   */
  getEvent(eventId) {
    return this.eventStore.get(eventId);
  }

  /**
   * Get events by correlation ID
   */
  getEventsByCorrelation(correlationId) {
    return Array.from(this.eventStore.values())
      .filter(event => event.correlationId === correlationId);
  }

  /**
   * Get all events of a specific type
   */
  getEventsByType(eventType) {
    return Array.from(this.eventStore.values())
      .filter(event => event.type === eventType);
  }

  /**
   * Get EventBus metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      subscriptions: this.subscriptions.size,
      storedEvents: this.eventStore.size,
      uptime: process.uptime()
    };
  }

  /**
   * Get current subscriptions
   */
  getSubscriptions() {
    return Array.from(this.subscriptions.entries()).map(([id, sub]) => ({
      id,
      eventTypes: sub.eventTypes,
      createdAt: sub.createdAt,
      options: sub.options
    }));
  }

  /**
   * Clear event store (for memory management)
   */
  clearEventStore(olderThan = 3600000) { // 1 hour default
    const cutoff = new Date(Date.now() - olderThan);
    let cleared = 0;

    for (const [id, event] of this.eventStore) {
      if (new Date(event.timestamp) < cutoff) {
        this.eventStore.delete(id);
        cleared++;
      }
    }

    console.log(`🧹 Cleared ${cleared} old events from store`);
    return cleared;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down EventBus...');

    try {
      // Clear subscriptions
      this.subscriptions.clear();

      // Close Redis connections
      if (this.publisher) {
        await this.publisher.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }

      this.isConnected = false;
      console.log('✅ EventBus shutdown completed');

    } catch (error) {
      console.error('❌ EventBus shutdown error:', error);
      throw error;
    }
  }
}

module.exports = EventBus;