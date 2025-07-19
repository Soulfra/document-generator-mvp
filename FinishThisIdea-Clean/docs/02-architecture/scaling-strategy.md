# Scaling Strategy

## Overview

FinishThisIdea is designed to scale from a single $1 cleanup to processing millions of code transformations. This document outlines our scaling strategy across all dimensions: traffic, data, compute, and cost.

## Table of Contents

- [Scaling Principles](#scaling-principles)
- [Current Scale](#current-scale)
- [Horizontal Scaling](#horizontal-scaling)
- [Vertical Scaling](#vertical-scaling)
- [Database Scaling](#database-scaling)
- [Storage Scaling](#storage-scaling)
- [Queue Scaling](#queue-scaling)
- [LLM Scaling](#llm-scaling)
- [Cost Optimization](#cost-optimization)
- [Performance Targets](#performance-targets)
- [Scaling Playbook](#scaling-playbook)

## Scaling Principles

### 1. Scale Horizontally First
- Add more instances before bigger instances
- Stateless services enable easy scaling
- Load balance across availability zones

### 2. Progressive Enhancement
- Start with Ollama (free, local)
- Scale to cloud LLMs as needed
- Cache aggressively at every layer

### 3. Cost-Aware Scaling
- Monitor cost per request
- Optimize before scaling up
- Use spot instances for workers

### 4. Predictable Performance
- Consistent response times
- Graceful degradation
- Circuit breakers for dependencies

## Current Scale

### MVP Targets (Month 1)
```yaml
Traffic:
  Daily Active Users: 1,000
  Concurrent Users: 50
  Jobs per Day: 500
  Peak Jobs/Hour: 100

Infrastructure:
  API Servers: 2
  Workers: 4
  Database: 1 primary + 1 replica
  Redis: 1 instance
  
Performance:
  API Response: <200ms p95
  Job Completion: <5min p95
  Availability: 99.5%
```

### Growth Targets (Year 1)
```yaml
Traffic:
  Daily Active Users: 100,000
  Concurrent Users: 5,000
  Jobs per Day: 50,000
  Peak Jobs/Hour: 10,000

Infrastructure:
  API Servers: 20-50 (auto-scaling)
  Workers: 100-500 (auto-scaling)
  Database: Multi-region clusters
  Redis: Cluster mode
  
Performance:
  API Response: <100ms p95
  Job Completion: <3min p95
  Availability: 99.95%
```

## Horizontal Scaling

### API Layer

```typescript
// Kubernetes HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100  # Double pods
        periodSeconds: 60
      - type: Pods
        value: 5    # Add 5 pods
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # 5 minutes
      policies:
      - type: Percent
        value: 10   # Remove 10%
        periodSeconds: 60
```

### Worker Scaling

```typescript
class WorkerScaler {
  private metrics: MetricsCollector;
  
  async getDesiredWorkerCount(): Promise<number> {
    const queueDepth = await this.metrics.getQueueDepth();
    const processingRate = await this.metrics.getProcessingRate();
    const averageJobTime = await this.metrics.getAverageJobTime();
    
    // Calculate required workers
    const targetQueueTime = 60; // Process queue in 60 seconds
    const requiredRate = queueDepth / targetQueueTime;
    const workersNeeded = Math.ceil(requiredRate * averageJobTime);
    
    // Apply limits
    const minWorkers = 2;
    const maxWorkers = 500;
    
    return Math.max(minWorkers, Math.min(maxWorkers, workersNeeded));
  }
  
  async scaleWorkers() {
    const current = await this.getCurrentWorkerCount();
    const desired = await this.getDesiredWorkerCount();
    
    if (desired > current) {
      // Scale up quickly
      await this.addWorkers(desired - current);
    } else if (desired < current * 0.7) {
      // Scale down slowly
      await this.removeWorkers((current - desired) * 0.1);
    }
  }
}
```

### Load Balancing

```nginx
# Nginx configuration for API load balancing
upstream api_backend {
    least_conn;  # Least connections algorithm
    
    # Health checks
    health_check interval=5s fails=3 passes=2;
    
    # Servers with weights
    server api-1:3000 weight=100;
    server api-2:3000 weight=100;
    server api-3:3000 weight=100;
    
    # Backup servers
    server api-backup-1:3000 backup;
    server api-backup-2:3000 backup;
    
    # Connection limits
    keepalive 100;
    keepalive_timeout 65s;
    keepalive_requests 100;
}

server {
    location /api {
        proxy_pass http://api_backend;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_connect_timeout 1s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Circuit breaker
        proxy_intercept_errors on;
        error_page 502 503 504 = @fallback;
    }
    
    location @fallback {
        # Degraded mode response
        return 503 '{"error": "Service temporarily unavailable", "retry_after": 30}';
    }
}
```

## Vertical Scaling

### Instance Types Strategy

```yaml
# Progressive instance upgrades
Scaling Tiers:
  MVP:
    API: t3.medium (2 vCPU, 4GB)
    Workers: t3.large (2 vCPU, 8GB)
    Database: db.t3.medium
    
  Growth:
    API: c5.xlarge (4 vCPU, 8GB)
    Workers: c5.2xlarge (8 vCPU, 16GB)
    Database: db.r5.xlarge
    
  Scale:
    API: c5.2xlarge (8 vCPU, 16GB)
    Workers: c5.4xlarge (16 vCPU, 32GB)
    Database: db.r5.4xlarge
    
  Enterprise:
    API: c5.4xlarge (16 vCPU, 32GB)
    Workers: m5.8xlarge (32 vCPU, 128GB)
    Database: db.r5.16xlarge
```

### Resource Optimization

```typescript
// Memory optimization for workers
class MemoryOptimizedWorker {
  private readonly MAX_MEMORY = 1024 * 1024 * 1024; // 1GB per job
  
  async processJob(job: Job) {
    // Monitor memory usage
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      // Process with memory limit
      const result = await this.processWithLimit(job, this.MAX_MEMORY);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      return result;
    } finally {
      // Log memory usage
      const endMemory = process.memoryUsage().heapUsed;
      const usedMemory = endMemory - startMemory;
      
      metrics.recordMemoryUsage({
        jobId: job.id,
        memoryUsed: usedMemory,
        duration: Date.now() - job.startTime
      });
    }
  }
}
```

## Database Scaling

### Read Replicas

```typescript
// Multi-region read replica configuration
class DatabaseRouter {
  private primary: PrismaClient;
  private replicas: Map<string, PrismaClient>;
  
  constructor() {
    this.primary = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } }
    });
    
    this.replicas = new Map([
      ['us-east', new PrismaClient({ 
        datasources: { db: { url: process.env.DATABASE_REPLICA_US_EAST } }
      })],
      ['us-west', new PrismaClient({ 
        datasources: { db: { url: process.env.DATABASE_REPLICA_US_WEST } }
      })],
      ['eu-west', new PrismaClient({ 
        datasources: { db: { url: process.env.DATABASE_REPLICA_EU_WEST } }
      })]
    ]);
  }
  
  // Route reads to nearest replica
  async read(region: string) {
    const replica = this.replicas.get(region) || this.replicas.get('us-east');
    return replica || this.primary;
  }
  
  // Always write to primary
  async write() {
    return this.primary;
  }
}
```

### Sharding Strategy

```typescript
// User-based sharding
class ShardedDatabase {
  private shards: Map<number, PrismaClient>;
  private shardCount = 16;
  
  getShardKey(userId: string): number {
    // Consistent hashing
    const hash = crypto.createHash('md5').update(userId).digest();
    return hash.readUInt32BE(0) % this.shardCount;
  }
  
  async getClient(userId: string): Promise<PrismaClient> {
    const shardKey = this.getShardKey(userId);
    return this.shards.get(shardKey)!;
  }
  
  // Cross-shard queries
  async globalQuery<T>(query: (client: PrismaClient) => Promise<T[]>): Promise<T[]> {
    const results = await Promise.all(
      Array.from(this.shards.values()).map(client => query(client))
    );
    return results.flat();
  }
}
```

### Connection Pooling

```typescript
// PgBouncer configuration
const pgBouncerConfig = `
[databases]
finishthisidea = host=postgres-primary port=5432 dbname=finishthisidea

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 1
log_disconnections = 1
stats_period = 60
`;
```

## Storage Scaling

### S3 Multi-Region

```typescript
class MultiRegionStorage {
  private regions = {
    'us-east-1': new S3({ region: 'us-east-1' }),
    'us-west-2': new S3({ region: 'us-west-2' }),
    'eu-west-1': new S3({ region: 'eu-west-1' }),
    'ap-southeast-1': new S3({ region: 'ap-southeast-1' })
  };
  
  async upload(file: Buffer, key: string, userRegion: string) {
    // Upload to user's region
    const primaryRegion = this.getNearestRegion(userRegion);
    await this.regions[primaryRegion].putObject({
      Bucket: `finishthisidea-${primaryRegion}`,
      Key: key,
      Body: file,
      StorageClass: 'INTELLIGENT_TIERING'
    }).promise();
    
    // Replicate to other regions async
    this.replicateAsync(key, primaryRegion);
  }
  
  private async replicateAsync(key: string, sourceRegion: string) {
    const replicationJobs = Object.entries(this.regions)
      .filter(([region]) => region !== sourceRegion)
      .map(([region, s3]) => 
        this.replicateToRegion(key, sourceRegion, region)
      );
    
    // Fire and forget
    Promise.all(replicationJobs).catch(err => 
      logger.error('Replication failed', err)
    );
  }
}
```

### CDN Configuration

```typescript
// CloudFront distribution
const cdnConfig = {
  origins: [{
    domainName: 'api.finishthisidea.com',
    originPath: '/api',
    customOriginConfig: {
      originProtocolPolicy: 'https-only',
      originSslProtocols: ['TLSv1.2'],
      originReadTimeout: 30,
      originKeepaliveTimeout: 5
    }
  }],
  
  defaultCacheBehavior: {
    targetOriginId: 'api',
    viewerProtocolPolicy: 'redirect-to-https',
    allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
    cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
    compress: true,
    
    // Cache based on headers
    forwardedValues: {
      queryString: true,
      headers: ['Authorization', 'Accept', 'Content-Type'],
      cookies: { forward: 'none' }
    },
    
    // TTLs
    minTtl: 0,
    defaultTtl: 0,      // No caching by default
    maxTtl: 31536000    // 1 year max
  },
  
  // Cache static assets
  cacheBehaviors: [{
    pathPattern: '/static/*',
    targetOriginId: 's3-static',
    viewerProtocolPolicy: 'redirect-to-https',
    compress: true,
    minTtl: 86400,      // 1 day
    defaultTtl: 604800, // 1 week
    maxTtl: 31536000    // 1 year
  }],
  
  // Geographic distribution
  priceClass: 'PriceClass_All',
  
  // Custom error pages
  customErrorResponses: [{
    errorCode: 503,
    responseCode: 503,
    responsePagePath: '/maintenance.html',
    errorCachingMinTtl: 0
  }]
};
```

## Queue Scaling

### Redis Cluster

```typescript
// Redis Cluster configuration
class RedisClusterQueue {
  private cluster: Redis.Cluster;
  
  constructor() {
    this.cluster = new Redis.Cluster([
      { host: 'redis-1', port: 6379 },
      { host: 'redis-2', port: 6379 },
      { host: 'redis-3', port: 6379 },
      { host: 'redis-4', port: 6379 },
      { host: 'redis-5', port: 6379 },
      { host: 'redis-6', port: 6379 }
    ], {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3
      },
      clusterRetryStrategy: (times) => {
        return Math.min(100 * Math.pow(2, times), 3000);
      },
      enableOfflineQueue: true,
      scaleReads: 'slave'
    });
  }
  
  // Partition queues by priority
  getQueueName(priority: 'high' | 'normal' | 'low'): string {
    return `jobs:${priority}:{${priority}}`; // Hash tag for same slot
  }
}
```

### Queue Partitioning

```typescript
class PartitionedJobQueue {
  private queues: Map<string, Queue>;
  
  constructor() {
    // Create separate queues by job type
    this.queues = new Map([
      ['cleanup', new Queue('cleanup', { connection: redisCluster })],
      ['template', new Queue('template', { connection: redisCluster })],
      ['enterprise', new Queue('enterprise', { connection: redisCluster })],
      ['priority', new Queue('priority', { connection: redisCluster })]
    ]);
  }
  
  async addJob(type: string, data: any, options: JobOptions = {}) {
    const queue = this.queues.get(type) || this.queues.get('cleanup');
    
    // Add with exponential backoff
    return queue!.add(type, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false,
      ...options
    });
  }
  
  // Dynamic worker allocation
  async allocateWorkers() {
    const queueMetrics = await this.getQueueMetrics();
    const totalWorkers = await this.getTotalWorkers();
    
    // Allocate proportionally to queue depth
    const allocations = new Map<string, number>();
    const totalJobs = Array.from(queueMetrics.values())
      .reduce((sum, m) => sum + m.waiting, 0);
    
    for (const [queue, metrics] of queueMetrics) {
      const allocation = Math.ceil(
        (metrics.waiting / totalJobs) * totalWorkers
      );
      allocations.set(queue, Math.max(1, allocation));
    }
    
    return allocations;
  }
}
```

## LLM Scaling

### Ollama Cluster

```yaml
# Kubernetes StatefulSet for Ollama
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ollama
spec:
  serviceName: ollama
  replicas: 10
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      containers:
      - name: ollama
        image: ollama/ollama:latest
        resources:
          requests:
            memory: "16Gi"
            cpu: "4"
            nvidia.com/gpu: 1  # GPU support
          limits:
            memory: "32Gi"
            cpu: "8"
            nvidia.com/gpu: 1
        volumeMounts:
        - name: models
          mountPath: /root/.ollama
  volumeClaimTemplates:
  - metadata:
      name: models
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 100Gi
```

### LLM Request Router

```typescript
class LLMLoadBalancer {
  private ollmaInstances: string[] = [];
  private currentIndex = 0;
  
  async routeRequest(request: LLMRequest): Promise<LLMResponse> {
    // Try Ollama cluster first
    const ollamaResult = await this.tryOllama(request);
    if (ollamaResult.success && ollamaResult.confidence > 0.8) {
      return ollamaResult;
    }
    
    // Fallback to cloud based on complexity
    const complexity = this.estimateComplexity(request);
    
    if (complexity < 0.3) {
      return this.tryOpenAI(request, 'gpt-3.5-turbo');
    } else if (complexity < 0.7) {
      return this.tryOpenAI(request, 'gpt-4');
    } else {
      return this.tryClaude(request, 'claude-3-opus');
    }
  }
  
  private async tryOllama(request: LLMRequest): Promise<LLMResponse> {
    // Round-robin load balancing
    const instance = this.getNextOllamaInstance();
    
    try {
      const response = await fetch(`${instance}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: 'codellama',
          prompt: request.prompt,
          stream: false
        })
      });
      
      return response.json();
    } catch (error) {
      // Mark instance as unhealthy
      this.markUnhealthy(instance);
      throw error;
    }
  }
  
  private getNextOllamaInstance(): string {
    const healthy = this.ollmaInstances.filter(i => this.isHealthy(i));
    const instance = healthy[this.currentIndex % healthy.length];
    this.currentIndex++;
    return instance;
  }
}
```

## Cost Optimization

### Spot Instance Strategy

```typescript
// AWS Spot Fleet configuration
const spotFleetConfig = {
  SpotFleetRequestConfig: {
    IamFleetRole: 'arn:aws:iam::123456789012:role/fleet-role',
    AllocationStrategy: 'diversified',
    TargetCapacity: 100,
    SpotPrice: '0.10', // Max price per hour
    
    LaunchSpecifications: [
      {
        ImageId: 'ami-12345678',
        InstanceType: 'c5.xlarge',
        KeyName: 'workers',
        SecurityGroups: [{ GroupId: 'sg-workers' }],
        UserData: Buffer.from(workerInitScript).toString('base64'),
        
        // Spot instance configuration
        SpotPrice: '0.05',
        InstanceInterruptionBehavior: 'terminate',
        
        TagSpecifications: [{
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: 'worker-spot' },
            { Key: 'Type', Value: 'spot' }
          ]
        }]
      },
      // Multiple instance types for better availability
      {
        InstanceType: 'c5.large',
        SpotPrice: '0.03'
      },
      {
        InstanceType: 'c5a.xlarge',
        SpotPrice: '0.045'
      }
    ],
    
    // Replace unhealthy instances
    ReplaceUnhealthyInstances: true,
    InstanceInterruptionBehavior: 'terminate',
    Type: 'maintain'
  }
};
```

### Resource Optimization

```typescript
class CostOptimizer {
  async optimizeResources() {
    const metrics = await this.collectMetrics();
    
    // Right-size instances
    for (const instance of metrics.instances) {
      if (instance.cpuUtilization < 20 && instance.memoryUtilization < 30) {
        await this.downgradeInstance(instance);
      } else if (instance.cpuUtilization > 80 || instance.memoryUtilization > 80) {
        await this.upgradeInstance(instance);
      }
    }
    
    // Clean up unused resources
    await this.cleanupUnusedVolumes();
    await this.cleanupOldSnapshots();
    await this.cleanupUnattachedIPs();
    
    // Optimize S3 storage
    await this.moveOldFilesToGlacier();
    await this.enableIntelligentTiering();
  }
  
  async generateCostReport(): Promise<CostReport> {
    return {
      compute: {
        onDemand: await this.getOnDemandCosts(),
        spot: await this.getSpotCosts(),
        savings: await this.getSpotSavings()
      },
      storage: {
        s3: await this.getS3Costs(),
        ebs: await this.getEBSCosts(),
        glacier: await this.getGlacierCosts()
      },
      network: {
        dataTransfer: await this.getDataTransferCosts(),
        loadBalancer: await this.getLoadBalancerCosts()
      },
      llm: {
        ollama: 0, // Free
        openai: await this.getOpenAICosts(),
        anthropic: await this.getAnthropicCosts()
      },
      recommendations: await this.getCostRecommendations()
    };
  }
}
```

## Performance Targets

### SLA Definitions

```typescript
interface SLA {
  availability: number;      // Percentage
  responseTime: {           // Milliseconds
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {             // Requests per second
    sustained: number;
    peak: number;
  };
  errorRate: number;        // Percentage
}

const serviceSLAs: Record<string, SLA> = {
  'api': {
    availability: 99.95,
    responseTime: { p50: 50, p95: 200, p99: 500 },
    throughput: { sustained: 1000, peak: 5000 },
    errorRate: 0.1
  },
  'cleanup': {
    availability: 99.9,
    responseTime: { p50: 60000, p95: 180000, p99: 300000 }, // 1-5 min
    throughput: { sustained: 100, peak: 500 },
    errorRate: 1
  },
  'websocket': {
    availability: 99.9,
    responseTime: { p50: 10, p95: 50, p99: 100 },
    throughput: { sustained: 10000, peak: 50000 },
    errorRate: 0.1
  }
};
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  async checkSLACompliance(): Promise<SLAReport> {
    const metrics = await this.getMetrics();
    const violations: SLAViolation[] = [];
    
    for (const [service, sla] of Object.entries(serviceSLAs)) {
      const serviceMetrics = metrics[service];
      
      // Check availability
      if (serviceMetrics.availability < sla.availability) {
        violations.push({
          service,
          metric: 'availability',
          expected: sla.availability,
          actual: serviceMetrics.availability
        });
      }
      
      // Check response times
      if (serviceMetrics.p95ResponseTime > sla.responseTime.p95) {
        violations.push({
          service,
          metric: 'p95ResponseTime',
          expected: sla.responseTime.p95,
          actual: serviceMetrics.p95ResponseTime
        });
      }
      
      // Auto-scale if needed
      if (violations.length > 0) {
        await this.triggerAutoScale(service, violations);
      }
    }
    
    return { compliant: violations.length === 0, violations };
  }
}
```

## Scaling Playbook

### Traffic Surge Response

```typescript
class TrafficSurgeHandler {
  async handleSurge(metrics: TrafficMetrics) {
    // 1. Immediate response
    if (metrics.requestRate > metrics.baseline * 2) {
      await this.enableSurgeMode();
    }
    
    // 2. Scale API servers
    const apiScaling = {
      current: metrics.apiInstances,
      target: Math.ceil(metrics.requestRate / 1000), // 1k RPS per instance
      max: 100
    };
    await this.scaleService('api', apiScaling);
    
    // 3. Pre-warm workers
    const workerScaling = {
      current: metrics.workerInstances,
      target: Math.ceil(metrics.queueDepth / 100), // 100 jobs per worker
      max: 500
    };
    await this.scaleService('worker', workerScaling);
    
    // 4. Increase cache capacity
    await this.scaleCacheCluster(metrics.cacheHitRate);
    
    // 5. Enable read replicas
    if (metrics.dbCpuUtilization > 70) {
      await this.activateReadReplicas();
    }
    
    // 6. Alert team
    await this.notifyOncall({
      type: 'traffic_surge',
      metrics,
      actions: ['surge_mode', 'auto_scaled']
    });
  }
  
  private async enableSurgeMode() {
    // Disable non-essential features
    await featureFlags.disable(['analytics', 'recommendations']);
    
    // Increase cache TTLs
    await redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
    
    // Enable aggressive caching
    await this.setCachingHeaders({
      'Cache-Control': 'public, max-age=300',
      'Vary': 'Accept-Encoding'
    });
    
    // Reduce LLM quality for speed
    await llmRouter.setQualityMode('fast');
  }
}
```

### Database Overload Response

```bash
#!/bin/bash
# Database overload response playbook

# 1. Check current connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 2. Kill long-running queries
psql -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE state = 'active' 
    AND query_start < now() - interval '5 minutes'
    AND query NOT LIKE '%pg_stat_activity%';
"

# 3. Increase connection pool
kubectl scale deployment pgbouncer --replicas=4

# 4. Enable read replica routing
kubectl set env deployment/api READ_REPLICA_ENABLED=true

# 5. Clear prepared statements
psql -c "DEALLOCATE ALL;"

# 6. Analyze tables
psql -c "ANALYZE;"

# 7. Monitor recovery
watch -n 1 'psql -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"'
```

## Related Documentation

- [System Design](system-design.md) - Architecture overview
- [Performance Tuning](../08-operations/performance-tuning.md) - Optimization guide
- [Cost Optimization](../08-operations/cost-optimization.md) - Cost management
- [Monitoring Setup](../05-deployment/monitoring-setup.md) - Metrics and alerts

---

*Last Updated: 2024-01-20*