#!/usr/bin/env node

/**
 * RAY TRACING ROUTER
 * 
 * Implements actual ray tracing algorithm for request routing
 * Traces optimal path through 500+ engines using matrix transformations
 * Provides real-time visualization of request paths
 * 
 * Like light bouncing through a crystal, finding the perfect path
 */

const express = require('express');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const numeric = require('numeric');
const winston = require('winston');

// Import context matrix engine
const ContextMatrixEngine = require('./context-matrix-engine');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ level: 'info' }),
    new winston.transports.File({ filename: 'logs/ray-tracing-router.log' })
  ]
});

class RayTracingRouter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Ray tracing parameters
      maxBounces: config.maxBounces || 15,
      energyThreshold: config.energyThreshold || 0.01,
      rayCount: config.rayCount || 100,
      convergenceThreshold: config.convergenceThreshold || 0.95,
      
      // Engine mapping
      engineGridSize: config.engineGridSize || { x: 50, y: 10, z: 1 }, // 500 engines in 3D grid
      engineTypes: config.engineTypes || [
        'ai', 'arbitrage', 'document', 'verification', 'notification',
        'personalization', 'authentication', 'analytics', 'trading', 'optimization'
      ],
      
      // Visualization settings
      visualizationPort: config.visualizationPort || 8888,
      enableRealTimeViz: config.enableRealTimeViz !== false,
      traceHistorySize: config.traceHistorySize || 1000,
      
      // Performance settings
      parallelRays: config.parallelRays !== false,
      cacheTraces: config.cacheTraces !== false,
      adaptiveRouting: config.adaptiveRouting !== false
    };
    
    // Core components
    this.contextMatrix = new ContextMatrixEngine();
    this.engineGrid = new Map();         // engineId -> position & properties
    this.activeTraces = new Map();       // traceId -> trace data
    this.routingCache = new Map();       // cacheKey -> optimal route
    this.engineHealth = new Map();       // engineId -> health metrics
    
    // Visualization data
    this.vizServer = null;
    this.vizClients = new Set();
    this.traceHistory = [];
    
    // Statistics
    this.stats = {
      totalTraces: 0,
      successfulRoutes: 0,
      averageBounces: 0,
      cacheHits: 0,
      visualizedTraces: 0,
      engineUtilization: new Map()
    };
    
    logger.info('Ray Tracing Router initialized', { 
      engineCount: this.config.engineGridSize.x * this.config.engineGridSize.y * this.config.engineGridSize.z 
    });
  }

  /**
   * Initialize the ray tracing router
   */
  async initialize() {
    logger.info('🌟 Initializing Ray Tracing Router...');
    
    try {
      // Initialize context matrix engine
      await this.contextMatrix.initialize();
      
      // Build engine grid
      this.buildEngineGrid();
      
      // Start visualization server
      if (this.config.enableRealTimeViz) {
        await this.startVisualizationServer();
      }
      
      // Load engine health data
      await this.loadEngineHealth();
      
      // Start monitoring
      this.startMonitoring();
      
      logger.info('✅ Ray Tracing Router ready');
      this.emit('ready');
      
    } catch (error) {
      logger.error('Failed to initialize Ray Tracing Router', { error: error.message });
      throw error;
    }
  }

  /**
   * Build 3D grid of engines
   */
  buildEngineGrid() {
    logger.info('Building engine grid...');
    
    const { x: maxX, y: maxY, z: maxZ } = this.config.engineGridSize;
    let engineId = 0;
    
    for (let z = 0; z < maxZ; z++) {
      for (let y = 0; y < maxY; y++) {
        for (let x = 0; x < maxX; x++) {
          const engine = {
            id: `engine-${engineId++}`,
            position: { x, y, z },
            type: this.config.engineTypes[engineId % this.config.engineTypes.length],
            properties: this.generateEngineProperties(x, y, z),
            connections: [],
            health: 1.0,
            load: 0.0
          };
          
          this.engineGrid.set(engine.id, engine);
        }
      }
    }
    
    // Build connections between engines
    this.buildEngineConnections();
    
    logger.info('Engine grid built', { totalEngines: this.engineGrid.size });
  }

  /**
   * Generate engine properties based on position
   */
  generateEngineProperties(x, y, z) {
    // Properties influence how rays interact with engines
    return {
      // Refractive index - how much the engine bends rays
      refractiveIndex: 1 + (x / this.config.engineGridSize.x) * 0.5,
      
      // Absorption coefficient - how much energy the engine absorbs
      absorption: 0.1 + (y / this.config.engineGridSize.y) * 0.2,
      
      // Reflection coefficient - how reflective the engine is
      reflection: 0.3 + Math.sin(x * 0.1) * 0.2,
      
      // Specialization - what the engine is good at
      specialization: {
        ai: Math.random() * (x < 10 ? 0.9 : 0.3),
        data: Math.random() * (y < 5 ? 0.8 : 0.4),
        compute: Math.random() * (z === 0 ? 0.7 : 0.5)
      },
      
      // Cost factor
      cost: 0.1 + (x + y + z) / 100
    };
  }

  /**
   * Build connections between adjacent engines
   */
  buildEngineConnections() {
    for (const [engineId, engine] of this.engineGrid) {
      const { x, y, z } = engine.position;
      
      // Connect to adjacent engines (6-connected in 3D)
      const neighbors = [
        { x: x + 1, y, z },
        { x: x - 1, y, z },
        { x, y: y + 1, z },
        { x, y: y - 1, z },
        { x, y, z: z + 1 },
        { x, y, z: z - 1 }
      ];
      
      for (const neighbor of neighbors) {
        const neighborEngine = this.findEngineAtPosition(neighbor);
        if (neighborEngine) {
          engine.connections.push({
            engineId: neighborEngine.id,
            weight: 1 / (1 + Math.abs(engine.properties.cost - neighborEngine.properties.cost))
          });
        }
      }
    }
  }

  /**
   * Find engine at specific position
   */
  findEngineAtPosition(pos) {
    for (const [id, engine] of this.engineGrid) {
      if (engine.position.x === pos.x &&
          engine.position.y === pos.y &&
          engine.position.z === pos.z) {
        return engine;
      }
    }
    return null;
  }

  /**
   * Route a request using ray tracing
   */
  async routeRequest(userId, request, options = {}) {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();
    
    logger.info('Starting ray trace routing', { traceId, userId });
    
    try {
      // Get user context from matrix
      const userContext = await this.contextMatrix.rayTraceContext(userId, request.target);
      
      // Check cache
      const cacheKey = this.generateCacheKey(userContext, request);
      if (this.routingCache.has(cacheKey) && !options.skipCache) {
        this.stats.cacheHits++;
        const cached = this.routingCache.get(cacheKey);
        return { ...cached, fromCache: true };
      }
      
      // Initialize ray trace
      const trace = {
        id: traceId,
        userId,
        request,
        userContext,
        rays: [],
        convergence: null,
        optimalPath: null,
        startTime,
        visualization: []
      };
      
      this.activeTraces.set(traceId, trace);
      
      // Cast rays
      const rays = await this.castRays(trace, options);
      trace.rays = rays;
      
      // Find convergence
      trace.convergence = this.findConvergence(rays);
      
      // Determine optimal path
      trace.optimalPath = this.determineOptimalPath(rays, trace.convergence);
      
      // Generate routing decision
      const routing = this.generateRouting(trace);
      
      // Cache result
      this.routingCache.set(cacheKey, routing);
      
      // Update stats
      this.updateStats(trace);
      
      // Send to visualization
      if (this.config.enableRealTimeViz) {
        this.visualizeTrace(trace);
      }
      
      // Cleanup
      this.activeTraces.delete(traceId);
      
      logger.info('Ray trace routing complete', {
        traceId,
        duration: Date.now() - startTime,
        engines: trace.optimalPath.length,
        convergence: trace.convergence.strength
      });
      
      return routing;
      
    } catch (error) {
      logger.error('Ray trace routing failed', { traceId, error: error.message });
      this.activeTraces.delete(traceId);
      throw error;
    }
  }

  /**
   * Cast rays through the engine grid
   */
  async castRays(trace, options) {
    const rays = [];
    const numRays = options.rayCount || this.config.rayCount;
    
    // Parallel ray casting if enabled
    const rayPromises = [];
    
    for (let i = 0; i < numRays; i++) {
      const rayPromise = this.castSingleRay(trace, i);
      
      if (this.config.parallelRays) {
        rayPromises.push(rayPromise);
      } else {
        rays.push(await rayPromise);
      }
    }
    
    if (this.config.parallelRays) {
      const results = await Promise.all(rayPromises);
      rays.push(...results);
    }
    
    return rays;
  }

  /**
   * Cast a single ray through the engine grid
   */
  async castSingleRay(trace, rayIndex) {
    const ray = {
      id: `${trace.id}-ray-${rayIndex}`,
      origin: this.selectRayOrigin(trace),
      direction: this.selectRayDirection(trace, rayIndex),
      energy: 1.0,
      path: [],
      bounces: 0,
      properties: {}
    };
    
    // Trace ray through grid
    let currentEngine = this.findEngineAtPosition(ray.origin);
    let remainingBounces = this.config.maxBounces;
    
    while (currentEngine && ray.energy > this.config.energyThreshold && remainingBounces > 0) {
      // Record path
      ray.path.push({
        engineId: currentEngine.id,
        position: { ...currentEngine.position },
        energy: ray.energy,
        timestamp: Date.now()
      });
      
      // Interact with engine
      const interaction = this.calculateInteraction(ray, currentEngine, trace.userContext);
      
      // Update ray properties
      ray.energy *= (1 - interaction.absorption);
      ray.direction = interaction.newDirection;
      ray.properties = { ...ray.properties, ...interaction.properties };
      
      // Find next engine
      const nextEngine = this.findNextEngine(currentEngine, ray.direction);
      
      if (!nextEngine) {
        // Ray escaped the grid
        break;
      }
      
      currentEngine = nextEngine;
      ray.bounces++;
      remainingBounces--;
      
      // Visualization point
      if (this.config.enableRealTimeViz) {
        trace.visualization.push({
          rayId: ray.id,
          position: { ...currentEngine.position },
          energy: ray.energy,
          timestamp: Date.now()
        });
      }
    }
    
    return ray;
  }

  /**
   * Select ray origin based on user context
   */
  selectRayOrigin(trace) {
    // Start rays from edges of grid, biased by user context
    const context = trace.userContext;
    
    // Determine preferred starting edge based on context
    const preference = context.similarity > 0.7 ? 'left' : 'bottom';
    
    if (preference === 'left') {
      return {
        x: 0,
        y: Math.floor(Math.random() * this.config.engineGridSize.y),
        z: 0
      };
    } else {
      return {
        x: Math.floor(Math.random() * this.config.engineGridSize.x),
        y: 0,
        z: 0
      };
    }
  }

  /**
   * Select ray direction with some randomness
   */
  selectRayDirection(trace, rayIndex) {
    // Base direction toward target
    const targetDirection = this.calculateTargetDirection(trace.request.target);
    
    // Add controlled randomness
    const spread = 0.3;
    const randomOffset = {
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread * 0.1 // Less variation in z
    };
    
    // Normalize
    const direction = {
      x: targetDirection.x + randomOffset.x,
      y: targetDirection.y + randomOffset.y,
      z: targetDirection.z + randomOffset.z
    };
    
    const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    
    return {
      x: direction.x / magnitude,
      y: direction.y / magnitude,
      z: direction.z / magnitude
    };
  }

  /**
   * Calculate interaction between ray and engine
   */
  calculateInteraction(ray, engine, userContext) {
    const props = engine.properties;
    
    // Snell's law for refraction
    const n1 = 1.0; // Air
    const n2 = props.refractiveIndex;
    const cosTheta1 = ray.direction.y; // Simplified
    const sinTheta2 = (n1 / n2) * Math.sqrt(1 - cosTheta1 ** 2);
    
    // Calculate new direction
    let newDirection;
    
    if (sinTheta2 > 1) {
      // Total internal reflection
      newDirection = {
        x: ray.direction.x,
        y: -ray.direction.y,
        z: ray.direction.z
      };
    } else {
      // Refraction
      const cosTheta2 = Math.sqrt(1 - sinTheta2 ** 2);
      const factor = (n1 / n2);
      
      newDirection = {
        x: factor * ray.direction.x,
        y: factor * ray.direction.y - (cosTheta2 - factor * cosTheta1),
        z: factor * ray.direction.z
      };
    }
    
    // Apply user context influence
    const contextInfluence = userContext.similarity;
    newDirection.x += contextInfluence * 0.1;
    newDirection.y += contextInfluence * 0.05;
    
    // Normalize
    const mag = Math.sqrt(newDirection.x ** 2 + newDirection.y ** 2 + newDirection.z ** 2);
    newDirection.x /= mag;
    newDirection.y /= mag;
    newDirection.z /= mag;
    
    return {
      absorption: props.absorption * (1 - engine.health * 0.5),
      reflection: props.reflection,
      newDirection,
      properties: {
        engineType: engine.type,
        specialization: props.specialization,
        cost: props.cost * (1 + engine.load)
      }
    };
  }

  /**
   * Find next engine based on direction
   */
  findNextEngine(currentEngine, direction) {
    // Simple grid traversal
    const nextPos = {
      x: Math.round(currentEngine.position.x + direction.x),
      y: Math.round(currentEngine.position.y + direction.y),
      z: Math.round(currentEngine.position.z + direction.z)
    };
    
    // Check bounds
    if (nextPos.x < 0 || nextPos.x >= this.config.engineGridSize.x ||
        nextPos.y < 0 || nextPos.y >= this.config.engineGridSize.y ||
        nextPos.z < 0 || nextPos.z >= this.config.engineGridSize.z) {
      return null;
    }
    
    return this.findEngineAtPosition(nextPos);
  }

  /**
   * Find convergence point of rays
   */
  findConvergence(rays) {
    // Analyze ray endpoints to find convergence
    const endpoints = rays.map(ray => {
      const lastPoint = ray.path[ray.path.length - 1];
      return lastPoint ? lastPoint.position : null;
    }).filter(p => p !== null);
    
    if (endpoints.length === 0) {
      return { position: null, strength: 0 };
    }
    
    // Calculate centroid
    const centroid = {
      x: endpoints.reduce((sum, p) => sum + p.x, 0) / endpoints.length,
      y: endpoints.reduce((sum, p) => sum + p.y, 0) / endpoints.length,
      z: endpoints.reduce((sum, p) => sum + p.z, 0) / endpoints.length
    };
    
    // Calculate convergence strength (how close endpoints are to centroid)
    const avgDistance = endpoints.reduce((sum, p) => {
      const dist = Math.sqrt(
        (p.x - centroid.x) ** 2 + 
        (p.y - centroid.y) ** 2 + 
        (p.z - centroid.z) ** 2
      );
      return sum + dist;
    }, 0) / endpoints.length;
    
    const maxDistance = Math.sqrt(
      this.config.engineGridSize.x ** 2 + 
      this.config.engineGridSize.y ** 2 + 
      this.config.engineGridSize.z ** 2
    );
    
    const strength = 1 - (avgDistance / maxDistance);
    
    return {
      position: centroid,
      strength: Math.max(0, Math.min(1, strength)),
      endpointCount: endpoints.length
    };
  }

  /**
   * Determine optimal path from ray traces
   */
  determineOptimalPath(rays, convergence) {
    // Score all paths
    const scoredPaths = rays.map(ray => {
      const score = this.scorePath(ray, convergence);
      return { ray, score };
    }).sort((a, b) => b.score - a.score);
    
    // Take best path
    const bestPath = scoredPaths[0];
    
    if (!bestPath) {
      return [];
    }
    
    // Extract engine sequence
    return bestPath.ray.path.map(p => p.engineId);
  }

  /**
   * Score a ray path
   */
  scorePath(ray, convergence) {
    let score = 0;
    
    // Energy retention (higher is better)
    score += ray.energy * 10;
    
    // Path length (shorter is better)
    score -= ray.path.length * 0.5;
    
    // Convergence proximity
    if (convergence.position && ray.path.length > 0) {
      const lastPos = ray.path[ray.path.length - 1].position;
      const dist = Math.sqrt(
        (lastPos.x - convergence.position.x) ** 2 +
        (lastPos.y - convergence.position.y) ** 2 +
        (lastPos.z - convergence.position.z) ** 2
      );
      score += (10 - dist) * 2;
    }
    
    // Engine specialization match
    const specializationScore = ray.path.reduce((sum, point) => {
      const engine = this.engineGrid.get(point.engineId);
      if (engine && engine.properties.specialization) {
        return sum + Object.values(engine.properties.specialization).reduce((a, b) => a + b, 0);
      }
      return sum;
    }, 0);
    score += specializationScore;
    
    return score;
  }

  /**
   * Generate final routing decision
   */
  generateRouting(trace) {
    const engines = trace.optimalPath.map(engineId => {
      const engine = this.engineGrid.get(engineId);
      return {
        id: engineId,
        type: engine.type,
        position: engine.position,
        properties: engine.properties
      };
    });
    
    return {
      traceId: trace.id,
      userId: trace.userId,
      engines,
      convergence: trace.convergence,
      confidence: this.calculateConfidence(trace),
      estimatedLatency: this.estimateLatency(engines),
      estimatedCost: this.estimateCost(engines),
      visualization: this.config.enableRealTimeViz ? trace.visualization : null
    };
  }

  /**
   * Calculate routing confidence
   */
  calculateConfidence(trace) {
    const factors = [
      trace.convergence.strength * 0.4,
      (trace.rays.filter(r => r.energy > 0.5).length / trace.rays.length) * 0.3,
      (1 - (trace.rays[0].bounces / this.config.maxBounces)) * 0.3
    ];
    
    return factors.reduce((a, b) => a + b, 0);
  }

  /**
   * Estimate latency through engines
   */
  estimateLatency(engines) {
    return engines.reduce((sum, engine) => {
      const baseLatency = 10; // 10ms base
      const loadLatency = engine.properties.cost * 50; // Up to 50ms for load
      return sum + baseLatency + loadLatency;
    }, 0);
  }

  /**
   * Estimate cost through engines
   */
  estimateCost(engines) {
    return engines.reduce((sum, engine) => {
      return sum + engine.properties.cost;
    }, 0);
  }

  /**
   * Generate cache key
   */
  generateCacheKey(userContext, request) {
    const contextHash = crypto.createHash('md5')
      .update(JSON.stringify(userContext.similarity))
      .digest('hex');
    
    const requestHash = crypto.createHash('md5')
      .update(JSON.stringify(request))
      .digest('hex');
    
    return `${contextHash}:${requestHash}`;
  }

  /**
   * Calculate target direction
   */
  calculateTargetDirection(target) {
    // Map target to grid position
    let targetX = this.config.engineGridSize.x - 1;
    let targetY = this.config.engineGridSize.y - 1;
    
    if (target.engineType) {
      // Find engines of this type
      for (const [id, engine] of this.engineGrid) {
        if (engine.type === target.engineType) {
          targetX = engine.position.x;
          targetY = engine.position.y;
          break;
        }
      }
    }
    
    // Direction toward target
    return {
      x: targetX / this.config.engineGridSize.x,
      y: targetY / this.config.engineGridSize.y,
      z: 0
    };
  }

  /**
   * Update statistics
   */
  updateStats(trace) {
    this.stats.totalTraces++;
    
    if (trace.convergence.strength > this.config.convergenceThreshold) {
      this.stats.successfulRoutes++;
    }
    
    const avgBounces = trace.rays.reduce((sum, ray) => sum + ray.bounces, 0) / trace.rays.length;
    this.stats.averageBounces = (
      this.stats.averageBounces * (this.stats.totalTraces - 1) + avgBounces
    ) / this.stats.totalTraces;
    
    // Update engine utilization
    for (const engineId of trace.optimalPath) {
      const count = this.stats.engineUtilization.get(engineId) || 0;
      this.stats.engineUtilization.set(engineId, count + 1);
    }
  }

  /**
   * Start visualization server
   */
  async startVisualizationServer() {
    const app = express();
    app.use(express.static('public'));
    
    const server = app.listen(this.config.visualizationPort, () => {
      logger.info('Visualization server started', { port: this.config.visualizationPort });
    });
    
    // WebSocket for real-time updates
    const wss = new WebSocket.Server({ server });
    
    wss.on('connection', (ws) => {
      this.vizClients.add(ws);
      logger.info('Visualization client connected');
      
      // Send initial grid data
      ws.send(JSON.stringify({
        type: 'grid',
        data: this.serializeGrid()
      }));
      
      ws.on('close', () => {
        this.vizClients.delete(ws);
        logger.info('Visualization client disconnected');
      });
    });
    
    this.vizServer = server;
  }

  /**
   * Serialize grid for visualization
   */
  serializeGrid() {
    const engines = [];
    
    for (const [id, engine] of this.engineGrid) {
      engines.push({
        id,
        position: engine.position,
        type: engine.type,
        health: engine.health,
        load: engine.load,
        connections: engine.connections.map(c => c.engineId)
      });
    }
    
    return {
      dimensions: this.config.engineGridSize,
      engines,
      stats: this.stats
    };
  }

  /**
   * Visualize a trace in real-time
   */
  visualizeTrace(trace) {
    if (this.vizClients.size === 0) return;
    
    const vizData = {
      type: 'trace',
      data: {
        traceId: trace.id,
        rays: trace.rays.map(ray => ({
          id: ray.id,
          path: ray.path.map(p => p.position),
          energy: ray.energy,
          bounces: ray.bounces
        })),
        convergence: trace.convergence,
        optimalPath: trace.optimalPath
      }
    };
    
    const message = JSON.stringify(vizData);
    
    for (const client of this.vizClients) {
      try {
        client.send(message);
      } catch (error) {
        logger.warn('Failed to send to viz client', { error: error.message });
      }
    }
    
    this.stats.visualizedTraces++;
    
    // Store in history
    this.traceHistory.push(vizData);
    if (this.traceHistory.length > this.config.traceHistorySize) {
      this.traceHistory.shift();
    }
  }

  /**
   * Load engine health data
   */
  async loadEngineHealth() {
    // In production, this would load from monitoring systems
    for (const [id, engine] of this.engineGrid) {
      engine.health = 0.8 + Math.random() * 0.2; // 80-100% health
      engine.load = Math.random() * 0.7; // 0-70% load
    }
  }

  /**
   * Start monitoring loop
   */
  startMonitoring() {
    setInterval(() => {
      // Update engine health
      for (const [id, engine] of this.engineGrid) {
        // Simulate health changes
        engine.health = Math.max(0.5, Math.min(1, engine.health + (Math.random() - 0.5) * 0.1));
        engine.load = Math.max(0, Math.min(1, engine.load + (Math.random() - 0.5) * 0.2));
      }
      
      // Clean old cache entries
      if (this.routingCache.size > 10000) {
        const entriesToDelete = Array.from(this.routingCache.keys()).slice(0, 1000);
        entriesToDelete.forEach(key => this.routingCache.delete(key));
      }
      
      // Log stats
      logger.info('Ray Tracing Router stats', {
        totalTraces: this.stats.totalTraces,
        successRate: this.stats.successfulRoutes / this.stats.totalTraces,
        cacheHitRate: this.stats.cacheHits / this.stats.totalTraces,
        activeTraces: this.activeTraces.size
      });
      
    }, 30000); // Every 30 seconds
  }
}

// Export the class
module.exports = RayTracingRouter;

// Run standalone if called directly
if (require.main === module) {
  const router = new RayTracingRouter();
  
  router.on('ready', async () => {
    logger.info('✨ Ray Tracing Router is ready!');
    logger.info(`🎯 Visualization: http://localhost:${router.config.visualizationPort}`);
    
    // Example routing
    const exampleRequest = {
      target: {
        engineType: 'ai',
        requirements: {
          performance: 0.8,
          cost: 0.3
        }
      },
      priority: 'high'
    };
    
    router.routeRequest('example-user-123', exampleRequest)
      .then(routing => {
        logger.info('Example routing complete', {
          engines: routing.engines.length,
          confidence: routing.confidence,
          estimatedLatency: `${routing.estimatedLatency}ms`,
          estimatedCost: routing.estimatedCost.toFixed(4)
        });
      })
      .catch(error => {
        logger.error('Example routing failed', { error: error.message });
      });
  });
  
  router.initialize().catch(error => {
    logger.error('Failed to start', { error: error.message });
    process.exit(1);
  });
}