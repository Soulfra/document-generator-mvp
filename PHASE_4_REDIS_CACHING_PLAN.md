# Phase 4: Redis Caching & Performance Optimization Plan

## 🎯 Overview

This phase focuses on implementing a comprehensive Redis caching layer to optimize AI response times, reduce API costs, and improve overall system performance. We'll build on the existing Redis infrastructure to create intelligent caching strategies for different data types and use cases.

## 🏗️ Architecture Design

### Cache Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Redis Cache Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  L1: Hot Cache (Memory)                                     │
│  ├── AI Response Cache (5min TTL)                          │
│  ├── Template Score Cache (15min TTL)                      │
│  └── User Session Cache (30min TTL)                        │
│                                                             │
│  L2: Warm Cache (Redis)                                     │
│  ├── AI Response Cache (1hr TTL)                           │
│  ├── Template Matching Cache (6hr TTL)                     │
│  ├── Document Analysis Cache (24hr TTL)                    │
│  └── Feature Extraction Cache (24hr TTL)                   │
│                                                             │
│  L3: Cold Storage (PostgreSQL + S3)                        │
│  ├── Historical AI Responses                               │
│  ├── Template Analytics                                     │
│  └── Document Processing Results                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cache Key Patterns

```typescript
// AI Response Cache Keys
ai:response:{provider}:{model}:{hash(prompt)}
ai:embedding:{model}:{hash(text)}
ai:analysis:{type}:{hash(content)}

// Template Cache Keys
template:score:{templateId}:{hash(context)}
template:match:{category}:{hash(requirements)}
template:render:{templateId}:{hash(data)}

// Document Cache Keys
doc:parse:{format}:{hash(content)}
doc:extract:{type}:{documentId}
doc:analysis:{documentId}:{analysisType}

// Session Cache Keys
session:user:{userId}:{sessionId}
session:ws:{connectionId}
session:rate:{userId}:{endpoint}
```

## 📋 Implementation Tasks

### 1. Core Cache Infrastructure (Week 1)

#### 1.1 Enhanced Redis Client
```typescript
// src/cache/redis-cache-manager.ts
export class RedisCacheManager {
  private memoryCache: LRUCache<string, any>;
  private redis: Redis;
  private compressionEnabled: boolean;
  
  constructor(config: CacheConfig) {
    this.memoryCache = new LRUCache({
      max: config.memoryMaxItems || 1000,
      ttl: config.memoryTTL || 300000, // 5 minutes
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
    
    this.redis = new Redis(config.redis);
    this.compressionEnabled = config.enableCompression ?? true;
  }
  
  // Multi-tier get with fallback
  async get<T>(key: string, options?: GetOptions): Promise<T | null> {
    // L1: Check memory cache
    const memoryHit = this.memoryCache.get(key);
    if (memoryHit) return memoryHit;
    
    // L2: Check Redis
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      const parsed = await this.decompress(redisValue);
      this.memoryCache.set(key, parsed); // Promote to L1
      return parsed;
    }
    
    // L3: Execute fetcher if provided
    if (options?.fetcher) {
      const value = await options.fetcher();
      await this.set(key, value, options.ttl);
      return value;
    }
    
    return null;
  }
  
  // Multi-tier set with compression
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, value);
    
    // Compress and set in Redis
    const compressed = await this.compress(value);
    if (ttl) {
      await this.redis.setex(key, ttl, compressed);
    } else {
      await this.redis.set(key, compressed);
    }
  }
  
  // Batch operations for efficiency
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    const missingKeys: string[] = [];
    const missingIndices: number[] = [];
    
    // Check memory cache first
    keys.forEach((key, index) => {
      const cached = this.memoryCache.get(key);
      if (cached) {
        results[index] = cached;
      } else {
        missingKeys.push(key);
        missingIndices.push(index);
      }
    });
    
    // Fetch missing from Redis
    if (missingKeys.length > 0) {
      const redisValues = await this.redis.mget(...missingKeys);
      for (let i = 0; i < redisValues.length; i++) {
        const value = redisValues[i];
        const originalIndex = missingIndices[i];
        if (value) {
          const parsed = await this.decompress(value);
          results[originalIndex] = parsed;
          this.memoryCache.set(missingKeys[i], parsed);
        } else {
          results[originalIndex] = null;
        }
      }
    }
    
    return results;
  }
  
  // Cache warming
  async warmCache(patterns: WarmingPattern[]): Promise<void> {
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern.keyPattern);
      const values = await this.redis.mget(...keys);
      
      keys.forEach((key, index) => {
        if (values[index]) {
          const parsed = this.decompress(values[index]);
          this.memoryCache.set(key, parsed);
        }
      });
    }
  }
}
```

#### 1.2 Cache Decorators
```typescript
// src/cache/decorators.ts
export function Cacheable(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = this.cacheManager || globalCacheManager;
      const key = options.keyGenerator 
        ? options.keyGenerator(propertyName, args)
        : generateCacheKey(target.constructor.name, propertyName, args);
      
      // Try cache first
      const cached = await cache.get(key);
      if (cached !== null && !options.condition?.(args)) {
        return cached;
      }
      
      // Execute method
      const result = await method.apply(this, args);
      
      // Cache result
      if (result !== null && result !== undefined) {
        await cache.set(key, result, options.ttl);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

export function CacheEvict(keyPattern: string | ((args: any[]) => string)) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      const cache = this.cacheManager || globalCacheManager;
      const pattern = typeof keyPattern === 'function' 
        ? keyPattern(args) 
        : keyPattern;
      
      await cache.invalidatePattern(pattern);
      
      return result;
    };
    
    return descriptor;
  };
}
```

### 2. AI Response Caching (Week 1-2)

#### 2.1 AI Response Cache Service
```typescript
// src/cache/ai-response-cache.ts
export class AIResponseCache {
  private cache: RedisCacheManager;
  private metrics: MetricsCollector;
  
  constructor(cache: RedisCacheManager, metrics: MetricsCollector) {
    this.cache = cache;
    this.metrics = metrics;
  }
  
  async getCachedResponse(request: AIRequest): Promise<AIResponse | null> {
    const cacheKey = this.generateCacheKey(request);
    const start = Date.now();
    
    const cached = await this.cache.get<AIResponse>(cacheKey);
    
    this.metrics.recordCacheOperation({
      operation: 'get',
      key: cacheKey,
      hit: !!cached,
      duration: Date.now() - start,
      service: 'ai-response'
    });
    
    if (cached) {
      // Check if response is still valid
      if (this.isResponseValid(cached, request)) {
        return cached;
      } else {
        await this.cache.delete(cacheKey);
      }
    }
    
    return null;
  }
  
  async cacheResponse(request: AIRequest, response: AIResponse): Promise<void> {
    if (!this.shouldCache(request, response)) return;
    
    const cacheKey = this.generateCacheKey(request);
    const ttl = this.calculateTTL(request, response);
    
    await this.cache.set(cacheKey, {
      ...response,
      cachedAt: Date.now(),
      cacheKey,
      requestHash: this.hashRequest(request)
    }, ttl);
    
    // Update cache statistics
    await this.updateCacheStats(request, response);
  }
  
  private generateCacheKey(request: AIRequest): string {
    const normalized = this.normalizeRequest(request);
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .substring(0, 16);
    
    return `ai:response:${request.provider}:${request.model}:${hash}`;
  }
  
  private normalizeRequest(request: AIRequest): any {
    // Remove non-deterministic fields
    const { timestamp, requestId, ...deterministic } = request;
    
    // Sort object keys for consistent hashing
    return sortKeys(deterministic);
  }
  
  private calculateTTL(request: AIRequest, response: AIResponse): number {
    // Dynamic TTL based on response characteristics
    const baseTTL = 3600; // 1 hour
    
    // Adjust based on confidence
    const confidenceMultiplier = response.confidence > 0.9 ? 2 : 1;
    
    // Adjust based on cost
    const costMultiplier = response.cost > 0.1 ? 1.5 : 1;
    
    // Adjust based on request type
    const typeMultiplier = request.type === 'analysis' ? 2 : 1;
    
    return Math.floor(baseTTL * confidenceMultiplier * costMultiplier * typeMultiplier);
  }
  
  private shouldCache(request: AIRequest, response: AIResponse): boolean {
    // Don't cache if explicitly disabled
    if (request.options?.noCache) return false;
    
    // Don't cache low confidence responses
    if (response.confidence < 0.7) return false;
    
    // Don't cache errors
    if (!response.success) return false;
    
    // Don't cache streaming responses
    if (request.options?.stream) return false;
    
    return true;
  }
  
  // Semantic similarity cache
  async findSimilarCached(request: AIRequest, threshold: number = 0.85): Promise<AIResponse | null> {
    // Get request embedding
    const embedding = await this.getEmbedding(request.prompt);
    
    // Search for similar cached responses
    const similar = await this.cache.searchVector(
      'ai:embeddings:*',
      embedding,
      threshold
    );
    
    if (similar.length > 0) {
      const bestMatch = similar[0];
      const response = await this.cache.get<AIResponse>(bestMatch.key);
      
      if (response && this.isResponseValid(response, request)) {
        this.metrics.recordSemanticCacheHit(bestMatch.similarity);
        return response;
      }
    }
    
    return null;
  }
}
```

#### 2.2 Intelligent Cache Key Generation
```typescript
// src/cache/key-generators.ts
export class CacheKeyGenerator {
  static forAIRequest(request: AIRequest): string {
    const components = [
      request.provider,
      request.model,
      this.hashPrompt(request.prompt),
      this.hashOptions(request.options)
    ];
    
    return `ai:${components.join(':')}`;
  }
  
  static forTemplateScore(templateId: string, context: any): string {
    const contextHash = this.hashObject(context, ['timestamp', 'userId']);
    return `template:score:${templateId}:${contextHash}`;
  }
  
  static forDocumentAnalysis(documentId: string, analysisType: string): string {
    return `doc:analysis:${documentId}:${analysisType}`;
  }
  
  private static hashPrompt(prompt: string): string {
    // Normalize prompt for better cache hits
    const normalized = prompt
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    
    return crypto.createHash('sha256')
      .update(normalized)
      .digest('hex')
      .substring(0, 12);
  }
  
  private static hashObject(obj: any, excludeKeys: string[] = []): string {
    const cleaned = this.removeKeys(obj, excludeKeys);
    const sorted = sortKeys(cleaned);
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(sorted))
      .digest('hex')
      .substring(0, 12);
  }
}
```

### 3. Template Matching Cache (Week 2)

#### 3.1 Template Score Caching
```typescript
// src/cache/template-cache.ts
export class TemplateMatchingCache {
  private cache: RedisCacheManager;
  private scoreCache: Map<string, TemplateScore[]>;
  
  @Cacheable({ ttl: 21600 }) // 6 hours
  async getTemplateScores(
    category: string,
    requirements: Requirements
  ): Promise<TemplateScore[]> {
    const cacheKey = this.generateScoreCacheKey(category, requirements);
    
    // Check in-memory cache first
    if (this.scoreCache.has(cacheKey)) {
      return this.scoreCache.get(cacheKey)!;
    }
    
    // Check Redis
    const cached = await this.cache.get<TemplateScore[]>(cacheKey);
    if (cached) {
      this.scoreCache.set(cacheKey, cached);
      return cached;
    }
    
    // Calculate scores
    const scores = await this.calculateTemplateScores(category, requirements);
    
    // Cache results
    await this.cache.set(cacheKey, scores, 21600); // 6 hours
    this.scoreCache.set(cacheKey, scores);
    
    return scores;
  }
  
  @CacheEvict('template:score:*')
  async invalidateTemplateScores(templateId?: string): Promise<void> {
    if (templateId) {
      await this.cache.invalidatePattern(`template:score:${templateId}:*`);
    } else {
      await this.cache.invalidatePattern('template:score:*');
    }
    this.scoreCache.clear();
  }
  
  // Incremental cache updates
  async updateTemplateScore(
    templateId: string,
    scoreUpdate: Partial<TemplateScore>
  ): Promise<void> {
    const keys = await this.cache.keys(`template:score:*:${templateId}:*`);
    
    for (const key of keys) {
      const scores = await this.cache.get<TemplateScore[]>(key);
      if (scores) {
        const index = scores.findIndex(s => s.templateId === templateId);
        if (index !== -1) {
          scores[index] = { ...scores[index], ...scoreUpdate };
          await this.cache.set(key, scores);
        }
      }
    }
  }
}
```

#### 3.2 Semantic Template Matching Cache
```typescript
// src/cache/semantic-template-cache.ts
export class SemanticTemplateCache {
  private vectorStore: VectorStore;
  private cache: RedisCacheManager;
  
  async findSimilarTemplates(
    requirements: string,
    threshold: number = 0.8
  ): Promise<TemplateMatch[]> {
    // Generate cache key for semantic search
    const cacheKey = `template:semantic:${this.hashRequirements(requirements)}:${threshold}`;
    
    // Check cache
    const cached = await this.cache.get<TemplateMatch[]>(cacheKey);
    if (cached) return cached;
    
    // Get embedding for requirements
    const embedding = await this.getEmbedding(requirements);
    
    // Search vector store
    const results = await this.vectorStore.search({
      vector: embedding,
      topK: 10,
      threshold
    });
    
    // Map to template matches
    const matches = results.map(r => ({
      templateId: r.id,
      similarity: r.score,
      template: r.metadata
    }));
    
    // Cache for 2 hours
    await this.cache.set(cacheKey, matches, 7200);
    
    return matches;
  }
  
  // Pre-compute and cache embeddings
  async warmEmbeddingCache(templates: Template[]): Promise<void> {
    const embeddings = await Promise.all(
      templates.map(async (template) => {
        const text = `${template.name} ${template.description} ${template.category}`;
        const embedding = await this.getEmbedding(text);
        
        return {
          id: template.id,
          vector: embedding,
          metadata: template
        };
      })
    );
    
    await this.vectorStore.upsert(embeddings);
  }
}
```

### 4. Document Processing Cache (Week 2-3)

#### 4.1 Document Analysis Cache
```typescript
// src/cache/document-cache.ts
export class DocumentProcessingCache {
  private cache: RedisCacheManager;
  
  @Cacheable({ ttl: 86400 }) // 24 hours
  async getCachedAnalysis(
    documentId: string,
    analysisType: AnalysisType
  ): Promise<DocumentAnalysis | null> {
    const cacheKey = `doc:analysis:${documentId}:${analysisType}`;
    return this.cache.get<DocumentAnalysis>(cacheKey);
  }
  
  async cacheExtraction(
    documentId: string,
    extraction: ExtractedContent,
    ttl: number = 86400 // 24 hours
  ): Promise<void> {
    const cacheKey = `doc:extract:${documentId}`;
    
    // Store main extraction
    await this.cache.set(cacheKey, extraction, ttl);
    
    // Store individual components for partial access
    if (extraction.features) {
      await this.cache.set(
        `${cacheKey}:features`,
        extraction.features,
        ttl
      );
    }
    
    if (extraction.requirements) {
      await this.cache.set(
        `${cacheKey}:requirements`,
        extraction.requirements,
        ttl
      );
    }
    
    if (extraction.metadata) {
      await this.cache.set(
        `${cacheKey}:metadata`,
        extraction.metadata,
        ttl
      );
    }
  }
  
  // Chunked document caching for large files
  async cacheDocumentChunks(
    documentId: string,
    chunks: DocumentChunk[]
  ): Promise<void> {
    const pipeline = this.cache.pipeline();
    
    chunks.forEach((chunk, index) => {
      const chunkKey = `doc:chunk:${documentId}:${index}`;
      pipeline.setex(chunkKey, 3600, JSON.stringify(chunk)); // 1 hour
    });
    
    // Store chunk metadata
    pipeline.setex(
      `doc:chunks:${documentId}:meta`,
      3600,
      JSON.stringify({
        totalChunks: chunks.length,
        documentId,
        createdAt: Date.now()
      })
    );
    
    await pipeline.exec();
  }
}
```

#### 4.2 OCR Result Caching
```typescript
// src/cache/ocr-cache.ts
export class OCRResultCache {
  private cache: RedisCacheManager;
  private s3: S3Client;
  
  async getCachedOCR(imageHash: string): Promise<OCRResult | null> {
    // Check Redis first
    const cacheKey = `ocr:result:${imageHash}`;
    const cached = await this.cache.get<OCRResult>(cacheKey);
    
    if (cached) return cached;
    
    // Check S3 for older results
    try {
      const s3Key = `ocr-cache/${imageHash}.json`;
      const result = await this.s3.getObject(s3Key);
      
      if (result) {
        // Promote to Redis cache
        await this.cache.set(cacheKey, result, 604800); // 7 days
        return result;
      }
    } catch (error) {
      // Not in S3
    }
    
    return null;
  }
  
  async cacheOCRResult(
    imageHash: string,
    result: OCRResult
  ): Promise<void> {
    const cacheKey = `ocr:result:${imageHash}`;
    
    // Store in Redis with 7 day TTL
    await this.cache.set(cacheKey, result, 604800);
    
    // Also store in S3 for long-term cache
    const s3Key = `ocr-cache/${imageHash}.json`;
    await this.s3.putObject(s3Key, JSON.stringify(result));
  }
}
```

### 5. Cache Invalidation Strategies (Week 3)

#### 5.1 Smart Invalidation
```typescript
// src/cache/invalidation.ts
export class CacheInvalidationService {
  private cache: RedisCacheManager;
  private eventBus: EventBus;
  
  constructor(cache: RedisCacheManager, eventBus: EventBus) {
    this.cache = cache;
    this.eventBus = eventBus;
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Template updates
    this.eventBus.on('template:updated', async (event) => {
      await this.invalidateTemplateCache(event.templateId);
    });
    
    // Model updates
    this.eventBus.on('model:updated', async (event) => {
      await this.invalidateAICache(event.provider, event.model);
    });
    
    // Document updates
    this.eventBus.on('document:processed', async (event) => {
      await this.invalidateDocumentCache(event.documentId);
    });
  }
  
  async invalidateTemplateCache(templateId: string): Promise<void> {
    const patterns = [
      `template:score:${templateId}:*`,
      `template:match:*:${templateId}`,
      `template:render:${templateId}:*`
    ];
    
    await Promise.all(
      patterns.map(pattern => this.cache.invalidatePattern(pattern))
    );
  }
  
  async invalidateAICache(provider: string, model?: string): Promise<void> {
    const pattern = model 
      ? `ai:response:${provider}:${model}:*`
      : `ai:response:${provider}:*`;
    
    await this.cache.invalidatePattern(pattern);
  }
  
  // Cascading invalidation
  async cascadeInvalidation(rootKey: string): Promise<void> {
    const dependencies = await this.getDependencies(rootKey);
    
    for (const dep of dependencies) {
      await this.cache.delete(dep);
      await this.cascadeInvalidation(dep); // Recursive
    }
  }
  
  // Time-based invalidation
  async scheduleInvalidation(key: string, delay: number): Promise<void> {
    setTimeout(async () => {
      await this.cache.delete(key);
    }, delay);
  }
}
```

#### 5.2 Cache Versioning
```typescript
// src/cache/versioning.ts
export class CacheVersioning {
  private cache: RedisCacheManager;
  private versions: Map<string, number>;
  
  async getVersioned<T>(
    key: string,
    version: number,
    fetcher?: () => Promise<T>
  ): Promise<T | null> {
    const versionedKey = `${key}:v${version}`;
    
    const cached = await this.cache.get<T>(versionedKey);
    if (cached) return cached;
    
    if (fetcher) {
      const value = await fetcher();
      await this.setVersioned(key, value, version);
      return value;
    }
    
    return null;
  }
  
  async setVersioned<T>(
    key: string,
    value: T,
    version: number,
    ttl?: number
  ): Promise<void> {
    const versionedKey = `${key}:v${version}`;
    await this.cache.set(versionedKey, value, ttl);
    
    // Update version tracking
    this.versions.set(key, version);
    
    // Clean up old versions
    await this.cleanOldVersions(key, version);
  }
  
  private async cleanOldVersions(
    key: string,
    currentVersion: number,
    keepVersions: number = 2
  ): Promise<void> {
    const oldestToKeep = Math.max(1, currentVersion - keepVersions + 1);
    
    for (let v = 1; v < oldestToKeep; v++) {
      await this.cache.delete(`${key}:v${v}`);
    }
  }
}
```

### 6. Performance Monitoring (Week 3-4)

#### 6.1 Cache Metrics Collection
```typescript
// src/cache/metrics.ts
export class CacheMetrics {
  private redis: Redis;
  private prometheus: PrometheusClient;
  
  // Prometheus metrics
  private cacheHits = new Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type', 'operation']
  });
  
  private cacheMisses = new Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type', 'operation']
  });
  
  private cacheLatency = new Histogram({
    name: 'cache_operation_duration_seconds',
    help: 'Cache operation duration',
    labelNames: ['cache_type', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  });
  
  private cacheSize = new Gauge({
    name: 'cache_size_bytes',
    help: 'Current cache size in bytes',
    labelNames: ['cache_type']
  });
  
  async recordHit(cacheType: string, operation: string): Promise<void> {
    this.cacheHits.inc({ cache_type: cacheType, operation });
  }
  
  async recordMiss(cacheType: string, operation: string): Promise<void> {
    this.cacheMisses.inc({ cache_type: cacheType, operation });
  }
  
  async recordLatency(
    cacheType: string,
    operation: string,
    duration: number
  ): Promise<void> {
    this.cacheLatency.observe(
      { cache_type: cacheType, operation },
      duration / 1000 // Convert to seconds
    );
  }
  
  // Real-time cache analytics
  async getCacheStats(): Promise<CacheStatistics> {
    const info = await this.redis.info('memory');
    const keyspace = await this.redis.info('keyspace');
    
    const patterns = [
      'ai:response:*',
      'template:*',
      'doc:*',
      'session:*'
    ];
    
    const stats = await Promise.all(
      patterns.map(async (pattern) => {
        const keys = await this.redis.keys(pattern);
        const samples = keys.slice(0, 100); // Sample for size estimation
        
        let totalSize = 0;
        for (const key of samples) {
          const size = await this.redis.memory('USAGE', key);
          totalSize += size || 0;
        }
        
        const avgSize = samples.length > 0 ? totalSize / samples.length : 0;
        const estimatedTotalSize = avgSize * keys.length;
        
        return {
          pattern,
          count: keys.length,
          estimatedSize: estimatedTotalSize,
          hitRate: await this.calculateHitRate(pattern)
        };
      })
    );
    
    return {
      memoryUsage: this.parseMemoryInfo(info),
      keyspaceInfo: this.parseKeyspaceInfo(keyspace),
      patternStats: stats,
      timestamp: Date.now()
    };
  }
  
  private async calculateHitRate(pattern: string): Promise<number> {
    const hits = await this.getMetricValue(`${pattern}:hits`) || 0;
    const misses = await this.getMetricValue(`${pattern}:misses`) || 0;
    const total = hits + misses;
    
    return total > 0 ? (hits / total) * 100 : 0;
  }
}
```

#### 6.2 Performance Dashboard
```typescript
// src/cache/dashboard.ts
export class CacheDashboard {
  private metrics: CacheMetrics;
  private alerts: AlertingService;
  
  async generateReport(): Promise<PerformanceReport> {
    const stats = await this.metrics.getCacheStats();
    const costSavings = await this.calculateCostSavings();
    const recommendations = await this.generateRecommendations(stats);
    
    return {
      summary: {
        totalHits: stats.totalHits,
        totalMisses: stats.totalMisses,
        hitRate: (stats.totalHits / (stats.totalHits + stats.totalMisses)) * 100,
        costSavings: costSavings.total,
        avgLatency: stats.avgLatency
      },
      byService: {
        aiResponses: {
          hits: stats.patternStats.find(p => p.pattern.includes('ai'))?.count || 0,
          savings: costSavings.ai,
          topModels: await this.getTopCachedModels()
        },
        templates: {
          hits: stats.patternStats.find(p => p.pattern.includes('template'))?.count || 0,
          topTemplates: await this.getTopCachedTemplates()
        },
        documents: {
          hits: stats.patternStats.find(p => p.pattern.includes('doc'))?.count || 0,
          avgProcessingTimeSaved: await this.getAvgProcessingTimeSaved()
        }
      },
      recommendations,
      alerts: await this.getActiveAlerts()
    };
  }
  
  private async calculateCostSavings(): Promise<CostSavings> {
    // Calculate API cost savings from cached AI responses
    const aiHits = await this.redis.get('metrics:ai:hits') || 0;
    const avgTokensPerRequest = 1000;
    const costPerToken = 0.00003; // Average across providers
    
    const aiSavings = aiHits * avgTokensPerRequest * costPerToken;
    
    // Calculate compute savings from cached processing
    const docHits = await this.redis.get('metrics:doc:hits') || 0;
    const avgProcessingCost = 0.05; // Estimated cost per document
    
    const docSavings = docHits * avgProcessingCost;
    
    return {
      ai: aiSavings,
      documents: docSavings,
      total: aiSavings + docSavings,
      period: '24h'
    };
  }
}
```

### 7. Advanced Caching Features (Week 4)

#### 7.1 Predictive Cache Warming
```typescript
// src/cache/predictive-warming.ts
export class PredictiveCacheWarming {
  private cache: RedisCacheManager;
  private ml: MLService;
  
  async warmCachePredictively(): Promise<void> {
    // Analyze access patterns
    const patterns = await this.analyzeAccessPatterns();
    
    // Predict likely requests
    const predictions = await this.ml.predictNextRequests(patterns);
    
    // Warm cache with predicted data
    for (const prediction of predictions) {
      if (prediction.probability > 0.7) {
        await this.warmCacheEntry(prediction);
      }
    }
  }
  
  private async analyzeAccessPatterns(): Promise<AccessPattern[]> {
    const logs = await this.getAccessLogs(24); // Last 24 hours
    
    return this.ml.analyzePatterns(logs, {
      features: ['time_of_day', 'day_of_week', 'user_type', 'request_type'],
      clustering: 'kmeans',
      clusters: 10
    });
  }
  
  private async warmCacheEntry(prediction: CachePrediction): Promise<void> {
    switch (prediction.type) {
      case 'ai_response':
        await this.warmAIResponse(prediction.data);
        break;
      case 'template_score':
        await this.warmTemplateScore(prediction.data);
        break;
      case 'document_analysis':
        await this.warmDocumentAnalysis(prediction.data);
        break;
    }
  }
}
```

#### 7.2 Distributed Cache Synchronization
```typescript
// src/cache/distributed-sync.ts
export class DistributedCacheSync {
  private redis: Redis;
  private cluster: RedisCluster;
  
  async syncAcrossNodes(): Promise<void> {
    const nodes = await this.cluster.getNodes();
    
    // Subscribe to cache updates
    this.redis.subscribe('cache:sync:*');
    
    this.redis.on('message', async (channel, message) => {
      if (channel.startsWith('cache:sync:')) {
        const update = JSON.parse(message);
        await this.propagateUpdate(update, nodes);
      }
    });
  }
  
  private async propagateUpdate(
    update: CacheUpdate,
    nodes: RedisNode[]
  ): Promise<void> {
    const promises = nodes.map(node => 
      this.sendUpdate(node, update).catch(err => 
        logger.error('Failed to sync to node', { node: node.id, error: err })
      )
    );
    
    await Promise.allSettled(promises);
  }
  
  // Conflict resolution
  private async resolveConflict(
    key: string,
    localValue: any,
    remoteValue: any
  ): Promise<any> {
    // Use timestamp-based last-write-wins
    if (localValue.updatedAt > remoteValue.updatedAt) {
      return localValue;
    }
    return remoteValue;
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// src/cache/__tests__/cache-manager.test.ts
describe('RedisCacheManager', () => {
  let cache: RedisCacheManager;
  
  beforeEach(() => {
    cache = new RedisCacheManager({
      redis: mockRedis,
      memoryMaxItems: 100,
      enableCompression: true
    });
  });
  
  describe('Multi-tier caching', () => {
    it('should check memory cache first', async () => {
      // Test L1 cache hit
    });
    
    it('should fall back to Redis on memory miss', async () => {
      // Test L2 cache hit
    });
    
    it('should execute fetcher on full miss', async () => {
      // Test cache miss with fetcher
    });
  });
  
  describe('Compression', () => {
    it('should compress large values', async () => {
      // Test compression for values > 1KB
    });
    
    it('should handle compression errors gracefully', async () => {
      // Test compression failure handling
    });
  });
});
```

### Integration Tests
```typescript
// src/cache/__tests__/integration.test.ts
describe('Cache Integration', () => {
  let app: Application;
  let redis: Redis;
  
  beforeAll(async () => {
    app = await createTestApp();
    redis = new Redis(testRedisUrl);
  });
  
  describe('AI Response Caching', () => {
    it('should cache AI responses correctly', async () => {
      // Test end-to-end AI response caching
    });
    
    it('should respect cache invalidation', async () => {
      // Test cache invalidation
    });
  });
  
  describe('Performance', () => {
    it('should meet latency requirements', async () => {
      // Test cache latency < 10ms for memory, < 50ms for Redis
    });
    
    it('should handle high concurrency', async () => {
      // Test with 1000 concurrent requests
    });
  });
});
```

### Load Tests
```yaml
# k6/cache-load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests under 100ms
    'cache_hit_rate': ['rate>0.8'], // 80% cache hit rate
  },
};

export default function () {
  // Test cache performance under load
  let response = http.get('http://localhost:3000/api/ai/complete', {
    headers: { 'X-Cache-Test': 'true' },
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'has cache header': (r) => r.headers['X-Cache-Hit'] !== undefined,
    'response time OK': (r) => r.timings.duration < 100,
  });
}
```

## 📊 Success Metrics

### Performance Metrics
- **Cache Hit Rate**: > 80% for AI responses, > 90% for templates
- **Latency**: < 10ms for memory cache, < 50ms for Redis cache
- **Cost Savings**: > 60% reduction in AI API costs
- **Throughput**: Support 10,000+ concurrent cached requests

### Business Metrics
- **Response Time**: 90% reduction for cached requests
- **API Cost**: 60-70% reduction through intelligent caching
- **User Experience**: < 100ms average response time
- **Scalability**: Linear scaling with Redis cluster

## 🚀 Deployment Plan

### Week 1: Foundation
- [ ] Implement core cache infrastructure
- [ ] Set up Redis cluster configuration
- [ ] Deploy cache decorators
- [ ] Basic monitoring setup

### Week 2: AI & Template Caching
- [ ] Implement AI response caching
- [ ] Deploy template matching cache
- [ ] Semantic similarity caching
- [ ] Integration testing

### Week 3: Document & Advanced Features
- [ ] Document processing cache
- [ ] Cache invalidation strategies
- [ ] Performance monitoring
- [ ] Load testing

### Week 4: Optimization & Rollout
- [ ] Predictive cache warming
- [ ] Distributed synchronization
- [ ] Performance tuning
- [ ] Production deployment

## 🔧 Configuration

### Redis Configuration
```yaml
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
appendonly yes
appendfsync everysec

# Optimize for caching
tcp-keepalive 60
timeout 300
databases 16

# Enable keyspace notifications
notify-keyspace-events Ex
```

### Application Configuration
```typescript
// config/cache.ts
export const cacheConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'docgen:',
  },
  
  ttl: {
    aiResponse: 3600,        // 1 hour
    templateScore: 21600,    // 6 hours
    documentAnalysis: 86400, // 24 hours
    session: 1800,          // 30 minutes
  },
  
  memory: {
    maxItems: 1000,
    ttl: 300000, // 5 minutes
  },
  
  features: {
    compression: true,
    encryption: process.env.NODE_ENV === 'production',
    clustering: true,
    monitoring: true,
  }
};
```

## 📝 Documentation

### API Documentation
- Cache-aware endpoint documentation
- Cache header explanations
- Performance guidelines

### Developer Guide
- Cache key patterns
- Decorator usage
- Invalidation strategies
- Best practices

### Operations Manual
- Monitoring setup
- Alert configurations
- Maintenance procedures
- Troubleshooting guide

## 🎯 Summary

This comprehensive caching implementation will provide:
1. **Dramatic performance improvements** with multi-tier caching
2. **Significant cost savings** through intelligent AI response caching
3. **Better user experience** with sub-100ms response times
4. **Scalable architecture** supporting millions of cached entries
5. **Advanced features** like predictive warming and semantic similarity

The phased approach ensures smooth rollout with continuous monitoring and optimization opportunities.