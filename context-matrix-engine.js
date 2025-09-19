#!/usr/bin/env node

/**
 * CONTEXT MATRIX ENGINE
 * 
 * Builds multi-dimensional user context matrices from all data sources
 * Ray traces through user history, preferences, and interactions
 * Integrates with existing systems (SoulFra, arbitrage orchestrator, etc.)
 * 
 * This is the brain that understands each user deeply
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const Redis = require('redis');
const winston = require('winston');
const numeric = require('numeric');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ level: 'info' }),
    new winston.transports.File({ filename: 'logs/context-matrix.log' })
  ]
});

class ContextMatrixEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      dimensions: config.dimensions || {
        temporal: 10,      // Time-based patterns
        behavioral: 15,    // User behavior patterns
        preference: 20,    // Explicit preferences
        demographic: 8,    // User demographics
        social: 12,        // Social connections
        transactional: 10, // Purchase/transaction history
        content: 25,       // Content interaction patterns
        emotional: 8       // Sentiment/emotion tracking
      },
      
      // Matrix computation settings
      updateInterval: config.updateInterval || 5000,    // 5 seconds
      decayFactor: config.decayFactor || 0.95,         // Context decay over time
      learningRate: config.learningRate || 0.1,        // How fast to adapt
      
      // Integration points
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      aiRouterUrl: config.aiRouterUrl || 'http://localhost:3000',
      orchestratorUrl: config.orchestratorUrl || 'http://localhost:6000',
      
      // Performance settings
      maxContextSize: config.maxContextSize || 1000000, // 1MB per user
      cacheEnabled: config.cacheEnabled !== false,
      parallelProcessing: config.parallelProcessing !== false
    };
    
    // Core data structures
    this.userMatrices = new Map();     // userId -> contextMatrix
    this.matrixCache = new Map();      // Computed results cache
    this.rayTraceCache = new Map();    // Ray tracing results
    this.updateQueue = [];             // Pending matrix updates
    
    // Dimension mappings
    this.dimensionExtractors = new Map();
    this.dimensionWeights = new Map();
    
    // Redis client for distributed state
    this.redis = null;
    
    // Statistics
    this.stats = {
      matricesBuilt: 0,
      rayTracesCompleted: 0,
      updatesProcessed: 0,
      averageComputeTime: 0,
      cacheHitRate: 0
    };
    
    logger.info('Context Matrix Engine initialized', { dimensions: Object.keys(this.config.dimensions) });
  }

  /**
   * Initialize the engine
   */
  async initialize() {
    logger.info('🧮 Initializing Context Matrix Engine...');
    
    try {
      // Connect to Redis
      await this.connectRedis();
      
      // Initialize dimension extractors
      this.initializeDimensionExtractors();
      
      // Load existing matrices from storage
      await this.loadExistingMatrices();
      
      // Start update loop
      this.startUpdateLoop();
      
      // Start monitoring
      this.startMonitoring();
      
      logger.info('✅ Context Matrix Engine ready');
      this.emit('ready');
      
    } catch (error) {
      logger.error('Failed to initialize Context Matrix Engine', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize dimension extractors for each context dimension
   */
  initializeDimensionExtractors() {
    // Temporal dimension extractor
    this.dimensionExtractors.set('temporal', {
      extract: (userData) => {
        const features = new Array(this.config.dimensions.temporal).fill(0);
        
        // Hour of day pattern
        const hour = new Date().getHours();
        features[Math.floor(hour / 2.4)] = 1;
        
        // Day of week pattern
        const day = new Date().getDay();
        features[7 + day] = 1;
        
        // Recent activity frequency
        if (userData.lastActivity) {
          const minutesSinceActivity = (Date.now() - userData.lastActivity) / 60000;
          features[9] = Math.exp(-minutesSinceActivity / 60); // Decay over hours
        }
        
        return features;
      },
      weight: 0.15
    });

    // Behavioral dimension extractor
    this.dimensionExtractors.set('behavioral', {
      extract: (userData) => {
        const features = new Array(this.config.dimensions.behavioral).fill(0);
        
        // Click patterns
        if (userData.clickHistory) {
          features[0] = Math.min(userData.clickHistory.length / 100, 1);
        }
        
        // Session duration patterns
        if (userData.avgSessionDuration) {
          features[1] = Math.min(userData.avgSessionDuration / 3600, 1); // Normalize to hours
        }
        
        // Interaction frequency
        if (userData.interactionCount) {
          features[2] = Math.log1p(userData.interactionCount) / 10;
        }
        
        // Device usage patterns
        if (userData.devices) {
          features[3] = userData.devices.mobile ? 1 : 0;
          features[4] = userData.devices.desktop ? 1 : 0;
          features[5] = userData.devices.tablet ? 1 : 0;
        }
        
        // Navigation patterns
        if (userData.navigationDepth) {
          features[6] = Math.min(userData.navigationDepth / 10, 1);
        }
        
        return features;
      },
      weight: 0.20
    });

    // Preference dimension extractor
    this.dimensionExtractors.set('preference', {
      extract: (userData) => {
        const features = new Array(this.config.dimensions.preference).fill(0);
        
        // Explicit preferences
        if (userData.preferences) {
          Object.entries(userData.preferences).forEach(([key, value], index) => {
            if (index < 10) {
              features[index] = typeof value === 'number' ? value : (value ? 1 : 0);
            }
          });
        }
        
        // Inferred preferences from interactions
        if (userData.contentInteractions) {
          const categories = ['tech', 'business', 'creative', 'social', 'educational'];
          categories.forEach((cat, idx) => {
            if (userData.contentInteractions[cat]) {
              features[10 + idx] = Math.min(userData.contentInteractions[cat] / 50, 1);
            }
          });
        }
        
        // Communication preferences
        if (userData.communicationPrefs) {
          features[15] = userData.communicationPrefs.email ? 1 : 0;
          features[16] = userData.communicationPrefs.sms ? 1 : 0;
          features[17] = userData.communicationPrefs.push ? 1 : 0;
        }
        
        return features;
      },
      weight: 0.25
    });

    // Content interaction dimension
    this.dimensionExtractors.set('content', {
      extract: (userData) => {
        const features = new Array(this.config.dimensions.content).fill(0);
        
        // Content type interactions
        if (userData.contentViews) {
          const types = ['article', 'video', 'tutorial', 'documentation', 'quiz'];
          types.forEach((type, idx) => {
            if (userData.contentViews[type]) {
              features[idx] = Math.log1p(userData.contentViews[type]) / 5;
            }
          });
        }
        
        // Topic interests (using TF-IDF-like scoring)
        if (userData.topicInterests) {
          const sortedTopics = Object.entries(userData.topicInterests)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 15);
          
          sortedTopics.forEach(([topic, score], idx) => {
            features[5 + idx] = score;
          });
        }
        
        // Engagement metrics
        if (userData.engagement) {
          features[20] = userData.engagement.completionRate || 0;
          features[21] = userData.engagement.shareRate || 0;
          features[22] = userData.engagement.commentRate || 0;
        }
        
        return features;
      },
      weight: 0.30
    });

    // Add remaining dimension extractors...
    logger.info('Dimension extractors initialized', { count: this.dimensionExtractors.size });
  }

  /**
   * Build or update context matrix for a user
   */
  async buildContextMatrix(userId, userData = {}) {
    const startTime = Date.now();
    
    try {
      logger.debug('Building context matrix', { userId });
      
      // Get existing matrix or create new
      let matrix = this.userMatrices.get(userId) || this.createEmptyMatrix();
      
      // Extract features for each dimension
      const dimensionVectors = {};
      for (const [dimension, extractor] of this.dimensionExtractors) {
        dimensionVectors[dimension] = extractor.extract(userData);
      }
      
      // Combine into full matrix
      matrix = this.combineIntoMatrix(matrix, dimensionVectors);
      
      // Apply temporal decay
      matrix = this.applyTemporalDecay(matrix, userData.lastUpdate);
      
      // Normalize matrix
      matrix = this.normalizeMatrix(matrix);
      
      // Store updated matrix
      this.userMatrices.set(userId, matrix);
      
      // Persist to Redis
      await this.persistMatrix(userId, matrix);
      
      // Update stats
      this.stats.matricesBuilt++;
      this.stats.averageComputeTime = 
        (this.stats.averageComputeTime * (this.stats.matricesBuilt - 1) + 
         (Date.now() - startTime)) / this.stats.matricesBuilt;
      
      logger.debug('Context matrix built', { 
        userId, 
        duration: Date.now() - startTime,
        dimensions: Object.keys(dimensionVectors)
      });
      
      this.emit('matrixUpdated', { userId, matrix });
      
      return matrix;
      
    } catch (error) {
      logger.error('Failed to build context matrix', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Ray trace through the context matrix to find optimal paths
   */
  async rayTraceContext(userId, target, options = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `${userId}:${JSON.stringify(target)}`;
      if (this.rayTraceCache.has(cacheKey) && !options.skipCache) {
        this.stats.cacheHitRate++;
        return this.rayTraceCache.get(cacheKey);
      }
      
      // Get user's context matrix
      const matrix = await this.getContextMatrix(userId);
      if (!matrix) {
        throw new Error('No context matrix found for user');
      }
      
      // Convert target to vector
      const targetVector = this.targetToVector(target);
      
      // Perform ray tracing
      const trace = await this.performRayTrace(matrix, targetVector, options);
      
      // Calculate similarity scores
      trace.similarity = this.calculateSimilarity(matrix, targetVector);
      
      // Find optimal path
      trace.optimalPath = this.findOptimalPath(matrix, targetVector, trace);
      
      // Get recommendations
      trace.recommendations = await this.getRecommendations(trace, options);
      
      // Cache result
      this.rayTraceCache.set(cacheKey, trace);
      
      // Clean old cache entries
      if (this.rayTraceCache.size > 10000) {
        const entriesToDelete = Array.from(this.rayTraceCache.keys()).slice(0, 1000);
        entriesToDelete.forEach(key => this.rayTraceCache.delete(key));
      }
      
      this.stats.rayTracesCompleted++;
      
      logger.debug('Ray trace completed', {
        userId,
        duration: Date.now() - startTime,
        similarity: trace.similarity,
        pathLength: trace.optimalPath.length
      });
      
      return trace;
      
    } catch (error) {
      logger.error('Ray trace failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Perform actual ray tracing through the matrix
   */
  async performRayTrace(matrix, targetVector, options) {
    const rays = [];
    const numRays = options.numRays || 100;
    const maxBounces = options.maxBounces || 10;
    
    for (let i = 0; i < numRays; i++) {
      const ray = {
        id: i,
        origin: this.getRandomPoint(matrix),
        direction: this.normalizeVector(targetVector),
        bounces: [],
        energy: 1.0,
        path: []
      };
      
      // Trace ray through matrix
      for (let bounce = 0; bounce < maxBounces && ray.energy > 0.1; bounce++) {
        const intersection = this.findIntersection(matrix, ray);
        
        if (intersection) {
          ray.bounces.push(intersection);
          ray.path.push(intersection.point);
          
          // Calculate new direction based on matrix values
          ray.direction = this.calculateReflection(
            ray.direction, 
            intersection.normal,
            intersection.value
          );
          
          // Reduce energy
          ray.energy *= intersection.value;
        } else {
          break;
        }
      }
      
      rays.push(ray);
    }
    
    return {
      rays,
      convergencePoints: this.findConvergencePoints(rays),
      dominantPaths: this.findDominantPaths(rays)
    };
  }

  /**
   * Create empty context matrix
   */
  createEmptyMatrix() {
    const totalDimensions = Object.values(this.config.dimensions)
      .reduce((sum, dim) => sum + dim, 0);
    
    return {
      data: numeric.rep([totalDimensions, totalDimensions], 0),
      dimensions: { ...this.config.dimensions },
      created: Date.now(),
      lastUpdate: Date.now(),
      version: 1
    };
  }

  /**
   * Combine dimension vectors into matrix
   */
  combineIntoMatrix(existingMatrix, dimensionVectors) {
    const matrix = { ...existingMatrix };
    let offset = 0;
    
    for (const [dimension, vector] of Object.entries(dimensionVectors)) {
      const dimSize = this.config.dimensions[dimension];
      const weight = this.dimensionExtractors.get(dimension).weight;
      
      // Update matrix section for this dimension
      for (let i = 0; i < dimSize; i++) {
        for (let j = 0; j < dimSize; j++) {
          const row = offset + i;
          const col = offset + j;
          
          // Update with weighted combination of old and new
          const oldValue = matrix.data[row][col] || 0;
          const newValue = vector[i] * vector[j] * weight;
          
          matrix.data[row][col] = oldValue * (1 - this.config.learningRate) + 
                                  newValue * this.config.learningRate;
        }
      }
      
      offset += dimSize;
    }
    
    matrix.lastUpdate = Date.now();
    matrix.version++;
    
    return matrix;
  }

  /**
   * Apply temporal decay to matrix values
   */
  applyTemporalDecay(matrix, lastUpdate) {
    if (!lastUpdate) return matrix;
    
    const timeSinceUpdate = Date.now() - lastUpdate;
    const decayFactor = Math.pow(this.config.decayFactor, timeSinceUpdate / 86400000); // Daily decay
    
    const decayedMatrix = { ...matrix };
    decayedMatrix.data = numeric.mul(matrix.data, decayFactor);
    
    return decayedMatrix;
  }

  /**
   * Normalize matrix values
   */
  normalizeMatrix(matrix) {
    const normalized = { ...matrix };
    const flatData = matrix.data.flat();
    const max = Math.max(...flatData);
    const min = Math.min(...flatData);
    const range = max - min || 1;
    
    normalized.data = matrix.data.map(row => 
      row.map(val => (val - min) / range)
    );
    
    return normalized;
  }

  /**
   * Get context matrix for user
   */
  async getContextMatrix(userId) {
    // Check memory first
    if (this.userMatrices.has(userId)) {
      return this.userMatrices.get(userId);
    }
    
    // Try to load from Redis
    try {
      const stored = await this.redis.get(`context:matrix:${userId}`);
      if (stored) {
        const matrix = JSON.parse(stored);
        this.userMatrices.set(userId, matrix);
        return matrix;
      }
    } catch (error) {
      logger.warn('Failed to load matrix from Redis', { userId, error: error.message });
    }
    
    return null;
  }

  /**
   * Persist matrix to Redis
   */
  async persistMatrix(userId, matrix) {
    try {
      await this.redis.setex(
        `context:matrix:${userId}`,
        86400, // 24 hour TTL
        JSON.stringify(matrix)
      );
    } catch (error) {
      logger.error('Failed to persist matrix', { userId, error: error.message });
    }
  }

  /**
   * Calculate similarity between matrix and target vector
   */
  calculateSimilarity(matrix, targetVector) {
    // Flatten matrix to vector
    const matrixVector = matrix.data.flat();
    
    // Ensure vectors are same length
    const minLength = Math.min(matrixVector.length, targetVector.length);
    const v1 = matrixVector.slice(0, minLength);
    const v2 = targetVector.slice(0, minLength);
    
    // Calculate cosine similarity
    const dotProduct = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
    const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (mag1 * mag2) || 0;
  }

  /**
   * Start the update loop
   */
  startUpdateLoop() {
    setInterval(() => {
      this.processUpdateQueue();
    }, this.config.updateInterval);
  }

  /**
   * Process queued updates
   */
  async processUpdateQueue() {
    if (this.updateQueue.length === 0) return;
    
    const updates = this.updateQueue.splice(0, 10); // Process 10 at a time
    
    for (const update of updates) {
      try {
        await this.buildContextMatrix(update.userId, update.data);
        this.stats.updatesProcessed++;
      } catch (error) {
        logger.error('Failed to process update', { 
          userId: update.userId, 
          error: error.message 
        });
      }
    }
  }

  /**
   * Queue a context update
   */
  queueUpdate(userId, data) {
    this.updateQueue.push({ userId, data, timestamp: Date.now() });
  }

  /**
   * Connect to Redis
   */
  async connectRedis() {
    return new Promise((resolve, reject) => {
      this.redis = Redis.createClient({ url: this.config.redisUrl });
      
      this.redis.on('error', (err) => {
        logger.error('Redis error', { error: err.message });
      });
      
      this.redis.on('connect', () => {
        logger.info('Connected to Redis');
        resolve();
      });
      
      this.redis.connect().catch(reject);
    });
  }

  /**
   * Load existing matrices from storage
   */
  async loadExistingMatrices() {
    // This would load from persistent storage in production
    logger.info('Loading existing matrices...');
    
    // For now, just initialize with empty state
    this.userMatrices.clear();
    this.matrixCache.clear();
    this.rayTraceCache.clear();
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    setInterval(() => {
      logger.info('Context Matrix Engine stats', this.stats);
    }, 60000); // Log stats every minute
  }

  /**
   * Get recommendations based on ray trace
   */
  async getRecommendations(trace, options) {
    const recommendations = [];
    
    // Analyze convergence points
    for (const point of trace.convergencePoints) {
      if (point.strength > 0.7) {
        recommendations.push({
          type: 'convergence',
          dimension: this.pointToDimension(point),
          strength: point.strength,
          suggestion: this.generateSuggestion(point)
        });
      }
    }
    
    // Analyze dominant paths
    for (const path of trace.dominantPaths) {
      if (path.frequency > 0.3) {
        recommendations.push({
          type: 'path',
          sequence: path.sequence,
          frequency: path.frequency,
          suggestion: this.generatePathSuggestion(path)
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Helper methods for ray tracing
   */
  
  targetToVector(target) {
    // Convert target specification to vector
    const totalDims = Object.values(this.config.dimensions).reduce((a, b) => a + b, 0);
    const vector = new Array(totalDims).fill(0);
    
    // Set values based on target
    if (target.dimensions) {
      let offset = 0;
      for (const [dim, values] of Object.entries(target.dimensions)) {
        if (this.config.dimensions[dim]) {
          values.forEach((val, idx) => {
            if (offset + idx < vector.length) {
              vector[offset + idx] = val;
            }
          });
          offset += this.config.dimensions[dim];
        }
      }
    }
    
    return vector;
  }
  
  getRandomPoint(matrix) {
    const size = matrix.data.length;
    return [
      Math.random() * size,
      Math.random() * size
    ];
  }
  
  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }
  
  findIntersection(matrix, ray) {
    // Simplified intersection finding
    // In production, this would use proper ray-matrix intersection algorithms
    return {
      point: [ray.origin[0] + Math.random(), ray.origin[1] + Math.random()],
      normal: [Math.random() - 0.5, Math.random() - 0.5],
      value: Math.random()
    };
  }
  
  calculateReflection(direction, normal, value) {
    // Simplified reflection calculation
    return direction.map((d, i) => d - 2 * value * normal[i]);
  }
  
  findConvergencePoints(rays) {
    // Analyze where rays converge
    const points = [];
    
    // Simplified: just return some example points
    return [
      { point: [0.5, 0.5], strength: 0.8 },
      { point: [0.3, 0.7], strength: 0.6 }
    ];
  }
  
  findDominantPaths(rays) {
    // Find most common paths through the matrix
    const pathCounts = new Map();
    
    // Count path patterns
    rays.forEach(ray => {
      const pathKey = ray.path.map(p => `${Math.round(p[0])},${Math.round(p[1])}`).join('-');
      pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1);
    });
    
    // Return top paths
    return Array.from(pathCounts.entries())
      .map(([path, count]) => ({
        sequence: path.split('-'),
        frequency: count / rays.length
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }
  
  pointToDimension(point) {
    // Map point back to dimension name
    let offset = 0;
    for (const [dim, size] of Object.entries(this.config.dimensions)) {
      if (point.point[0] >= offset && point.point[0] < offset + size) {
        return dim;
      }
      offset += size;
    }
    return 'unknown';
  }
  
  generateSuggestion(point) {
    const dimension = this.pointToDimension(point);
    const suggestions = {
      temporal: 'User is most active at this time',
      behavioral: 'User prefers this interaction pattern',
      preference: 'Strong preference detected in this area',
      content: 'User highly engaged with this content type'
    };
    return suggestions[dimension] || 'Pattern detected';
  }
  
  generatePathSuggestion(path) {
    return `User frequently follows this sequence: ${path.sequence.join(' → ')}`;
  }
  
  findOptimalPath(matrix, targetVector, trace) {
    // Find the best path to reach target
    // Simplified version - in production would use A* or similar
    return trace.dominantPaths[0]?.sequence || [];
  }
}

// Export the class
module.exports = ContextMatrixEngine;

// Run standalone if called directly
if (require.main === module) {
  const engine = new ContextMatrixEngine();
  
  engine.on('ready', () => {
    logger.info('✨ Context Matrix Engine is ready!');
    
    // Example usage
    const exampleUserData = {
      lastActivity: Date.now() - 300000, // 5 minutes ago
      clickHistory: Array(20).fill(0),
      avgSessionDuration: 1800, // 30 minutes
      devices: { mobile: true, desktop: true },
      preferences: {
        emailUpdates: true,
        theme: 'dark',
        language: 'en'
      },
      contentInteractions: {
        tech: 45,
        business: 20,
        creative: 10
      }
    };
    
    engine.buildContextMatrix('example-user-123', exampleUserData)
      .then(matrix => {
        logger.info('Example matrix built', { 
          dimensions: matrix.dimensions,
          version: matrix.version
        });
        
        // Example ray trace
        return engine.rayTraceContext('example-user-123', {
          dimensions: {
            preference: [1, 0, 0, 0.5, 0.8],
            content: [0.9, 0.7, 0.3]
          }
        });
      })
      .then(trace => {
        logger.info('Ray trace complete', {
          similarity: trace.similarity,
          recommendations: trace.recommendations.length
        });
      })
      .catch(error => {
        logger.error('Example failed', { error: error.message });
      });
  });
  
  engine.initialize().catch(error => {
    logger.error('Failed to start', { error: error.message });
    process.exit(1);
  });
}