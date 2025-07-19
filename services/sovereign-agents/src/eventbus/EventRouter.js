/**
 * Event Router - Intelligent event routing and filtering for Sovereign Agents
 */

const EventBus = require('./EventBus');
const { getEventCategory, getEventPriority, validateEventData } = require('./EventTypes');

class EventRouter {
  constructor(options = {}) {
    this.options = {
      enableFiltering: options.enableFiltering !== false,
      enableTransformation: options.enableTransformation !== false,
      enableRetries: options.enableRetries !== false,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      deadLetterQueue: options.deadLetterQueue || 'dlq',
      ...options
    };

    this.eventBus = new EventBus(options);
    this.routes = new Map();
    this.filters = new Map();
    this.transformers = new Map();
    this.middleware = [];
    this.metrics = {
      routedEvents: 0,
      filteredEvents: 0,
      transformedEvents: 0,
      failedEvents: 0,
      retriedEvents: 0
    };
  }

  /**
   * Initialize the event router
   */
  async initialize() {
    await this.eventBus.initialize();
    
    // Set up default routes for system events
    this.setupDefaultRoutes();
    
    console.log('✅ EventRouter initialized');
  }

  /**
   * Add a route for specific event types
   */
  addRoute(eventTypes, handler, options = {}) {
    const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const eventTypesArray = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    const route = {
      id: routeId,
      eventTypes: eventTypesArray,
      handler,
      options: {
        priority: options.priority || 'normal',
        filter: options.filter,
        transform: options.transform,
        retry: options.retry !== false,
        maxRetries: options.maxRetries || this.options.maxRetries,
        ...options
      },
      createdAt: new Date().toISOString(),
      metrics: {
        eventsHandled: 0,
        errors: 0,
        lastHandled: null
      }
    };

    this.routes.set(routeId, route);

    // Subscribe to events
    this.eventBus.subscribe(eventTypesArray, (event, eventType) => {
      this.routeEvent(routeId, event, eventType);
    });

    console.log(`🛤️ Route added: ${routeId} for events: ${eventTypesArray.join(', ')}`);
    return routeId;
  }

  /**
   * Remove a route
   */
  removeRoute(routeId) {
    const route = this.routes.get(routeId);
    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
    }

    this.routes.delete(routeId);
    console.log(`🗑️ Route removed: ${routeId}`);
  }

  /**
   * Add a global filter
   */
  addFilter(name, filterFunction) {
    this.filters.set(name, filterFunction);
    console.log(`🔍 Filter added: ${name}`);
  }

  /**
   * Add a global transformer
   */
  addTransformer(name, transformFunction) {
    this.transformers.set(name, transformFunction);
    console.log(`🔄 Transformer added: ${name}`);
  }

  /**
   * Add middleware for event processing
   */
  use(middleware) {
    this.middleware.push(middleware);
    console.log(`🔧 Middleware added: ${middleware.name || 'anonymous'}`);
  }

  /**
   * Route an event through the system
   */
  async routeEvent(routeId, event, eventType) {
    const route = this.routes.get(routeId);
    if (!route) return;

    try {
      // Apply middleware
      const processedEvent = await this.applyMiddleware(event, eventType);
      if (!processedEvent) return; // Event was filtered out by middleware

      // Apply route-specific filter
      if (route.options.filter && !route.options.filter(processedEvent, eventType)) {
        this.metrics.filteredEvents++;
        return;
      }

      // Apply global filters
      for (const [filterName, filterFunction] of this.filters) {
        if (!filterFunction(processedEvent, eventType)) {
          console.log(`🔍 Event filtered by: ${filterName}`);
          this.metrics.filteredEvents++;
          return;
        }
      }

      // Apply transformations
      let transformedEvent = processedEvent;
      
      // Apply route-specific transform
      if (route.options.transform) {
        transformedEvent = await route.options.transform(transformedEvent, eventType);
        this.metrics.transformedEvents++;
      }

      // Apply global transformers
      for (const [transformerName, transformFunction] of this.transformers) {
        transformedEvent = await transformFunction(transformedEvent, eventType);
        console.log(`🔄 Event transformed by: ${transformerName}`);
        this.metrics.transformedEvents++;
      }

      // Execute handler with retry logic
      await this.executeHandler(route, transformedEvent, eventType);

      // Update metrics
      route.metrics.eventsHandled++;
      route.metrics.lastHandled = new Date().toISOString();
      this.metrics.routedEvents++;

    } catch (error) {
      console.error(`❌ Error routing event in ${routeId}:`, error);
      route.metrics.errors++;
      this.metrics.failedEvents++;

      // Handle retry logic
      if (route.options.retry) {
        await this.retryHandler(route, event, eventType, error);
      } else {
        await this.sendToDeadLetterQueue(event, eventType, error);
      }
    }
  }

  /**
   * Apply middleware to event
   */
  async applyMiddleware(event, eventType) {
    let processedEvent = event;

    for (const middleware of this.middleware) {
      try {
        const result = await middleware(processedEvent, eventType);
        if (result === null || result === false) {
          // Middleware filtered out the event
          return null;
        }
        if (result && typeof result === 'object') {
          processedEvent = result;
        }
      } catch (error) {
        console.error(`❌ Middleware error in ${middleware.name}:`, error);
        // Continue with other middleware
      }
    }

    return processedEvent;
  }

  /**
   * Execute handler with error handling
   */
  async executeHandler(route, event, eventType) {
    try {
      await route.handler(event, eventType, route.id);
    } catch (error) {
      console.error(`❌ Handler error in route ${route.id}:`, error);
      throw error;
    }
  }

  /**
   * Retry handler execution
   */
  async retryHandler(route, event, eventType, originalError) {
    const retryCount = event.metadata?.retryCount || 0;
    
    if (retryCount >= route.options.maxRetries) {
      console.error(`💥 Max retries exceeded for route ${route.id}`);
      await this.sendToDeadLetterQueue(event, eventType, originalError);
      return;
    }

    // Update retry count
    const retryEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        retryCount: retryCount + 1,
        lastError: originalError.message,
        retryTimestamp: new Date().toISOString()
      }
    };

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.options.retryDelay * (retryCount + 1)));

    console.log(`🔄 Retrying route ${route.id}, attempt ${retryCount + 1}`);
    this.metrics.retriedEvents++;

    try {
      await this.executeHandler(route, retryEvent, eventType);
      console.log(`✅ Retry successful for route ${route.id}`);
    } catch (error) {
      await this.retryHandler(route, retryEvent, eventType, error);
    }
  }

  /**
   * Send failed event to dead letter queue
   */
  async sendToDeadLetterQueue(event, eventType, error) {
    const dlqEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        failedAt: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      }
    };

    try {
      await this.eventBus.publish(`${this.options.deadLetterQueue}.${eventType}`, dlqEvent, {
        source: 'EventRouter',
        priority: 'high'
      });
      console.log(`📮 Event sent to dead letter queue: ${eventType}`);
    } catch (dlqError) {
      console.error('❌ Failed to send to dead letter queue:', dlqError);
    }
  }

  /**
   * Set up default system routes
   */
  setupDefaultRoutes() {
    // Route for system errors
    this.addRoute('system.error', async (event) => {
      console.error('🚨 System Error Event:', event.data);
      // Could trigger alerts, notifications, etc.
    }, { priority: 'critical' });

    // Route for performance metrics
    this.addRoute('performance.metric', async (event) => {
      console.log('📊 Performance Metric:', event.data);
      // Could store in time-series database
    }, { priority: 'low' });

    // Route for agent decisions requiring approval
    this.addRoute('human.approval.requested', async (event) => {
      console.log('👤 Human Approval Requested:', event.data);
      // Could trigger UI notification, email, etc.
    }, { priority: 'high' });
  }

  /**
   * Publish event through router
   */
  async publish(eventType, data, options = {}) {
    // Validate event data
    const validation = validateEventData(eventType, data);
    if (!validation.valid) {
      throw new Error(`Invalid event data: ${validation.errors.join(', ')}`);
    }

    // Add category and priority if not specified
    const enrichedOptions = {
      category: getEventCategory(eventType),
      priority: options.priority || getEventPriority(eventType),
      ...options
    };

    return this.eventBus.publish(eventType, data, enrichedOptions);
  }

  /**
   * Get router metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      routes: this.routes.size,
      filters: this.filters.size,
      transformers: this.transformers.size,
      middleware: this.middleware.length,
      eventBusMetrics: this.eventBus.getMetrics()
    };
  }

  /**
   * Get route information
   */
  getRoutes() {
    return Array.from(this.routes.entries()).map(([id, route]) => ({
      id,
      eventTypes: route.eventTypes,
      options: route.options,
      createdAt: route.createdAt,
      metrics: route.metrics
    }));
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const metrics = this.getMetrics();
      return {
        healthy: this.eventBus.isConnected,
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down EventRouter...');
    
    // Clear routes and middleware
    this.routes.clear();
    this.filters.clear();
    this.transformers.clear();
    this.middleware.length = 0;

    // Shutdown event bus
    await this.eventBus.shutdown();
    
    console.log('✅ EventRouter shutdown completed');
  }
}

module.exports = EventRouter;