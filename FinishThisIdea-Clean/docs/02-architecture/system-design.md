# System Design

## Design Principles

### 1. Start Simple, Scale Smart
Begin with a monolith that's designed to split into microservices when needed.

### 2. Cost-Optimized Architecture
Every architectural decision considers operational cost:
- Local LLMs before cloud
- Caching aggressively  
- Minimize storage duration
- Use serverless where possible

### 3. User Experience First
Technical complexity should never impact user experience:
- Fast response times (< 200ms)
- Simple interactions (swipe-based)
- Clear feedback (progress bars)
- Graceful degradation

## Component Architecture

### Frontend Architecture
```
┌─────────────────────────────────────────────┐
│              Next.js App Router             │
├─────────────────────────────────────────────┤
│                  Pages                      │
├──────────┬──────────┬──────────┬───────────┤
│  Home    │ Upload   │ Review   │ Download  │
│  (SSG)   │ (CSR)    │ (CSR)    │ (SSR)     │
└──────────┴──────────┴──────────┴───────────┘
           │          │          │
           ↓          ↓          ↓
┌─────────────────────────────────────────────┐
│            Shared Components                │
├──────────┬──────────┬──────────┬───────────┤
│SwipeCard │Progress  │FileUpload│Payment    │
└──────────┴──────────┴──────────┴───────────┘
           │          │          │
           ↓          ↓          ↓
┌─────────────────────────────────────────────┐
│              State Management               │
├──────────────────┬──────────────────────────┤
│   React Query    │      Zustand            │
│  (Server State)  │   (Client State)        │
└──────────────────┴──────────────────────────┘
```

### Backend Service Architecture
```
┌─────────────────────────────────────────────┐
│           API Gateway (Express)             │
├─────────────────────────────────────────────┤
│  Middleware Pipeline                        │
│  ├── CORS                                   │
│  ├── Rate Limiting                          │
│  ├── Authentication                         │
│  ├── Request Validation                     │
│  └── Error Handling                         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│              Route Handlers                 │
├──────────┬──────────┬──────────┬───────────┤
│ /upload  │  /jobs   │ /payment │ /download │
└──────────┴──────────┴──────────┴───────────┘
           │          │          │
           ↓          ↓          ↓
┌─────────────────────────────────────────────┐
│            Service Layer                    │
├──────────┬──────────┬──────────┬───────────┤
│ Storage  │ JobMgmt  │ Payment  │ Delivery  │
│ Service  │ Service  │ Service  │ Service   │
└──────────┴──────────┴──────────┴───────────┘
```

### Job Processing Architecture
```
┌──────────────┐     ┌──────────────┐
│   API Call   │────>│  Create Job  │
└──────────────┘     └──────┬───────┘
                            │
                            ↓
                    ┌───────────────┐
                    │  Bull Queue   │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌──────────────┐    ┌──────────────┐   ┌──────────────┐
│   Worker 1   │    │   Worker 2   │   │   Worker N   │
└──────┬───────┘    └──────┬───────┘   └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    ┌──────▼───────┐
                    │ LLM Router   │
                    └──────────────┘
```

## Database Design

### Schema Design Principles
1. **Normalize for consistency** - Avoid data duplication
2. **Index for performance** - Query patterns drive indexes
3. **Audit everything** - Track who did what when
4. **Soft delete** - Never actually delete data

### Core Tables
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(64) UNIQUE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  progress INTEGER DEFAULT 0,
  error JSONB,
  cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  INDEX idx_user_status (user_id, status),
  INDEX idx_created (created_at)
);

-- Swipe decisions table
CREATE TABLE swipe_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  job_id UUID REFERENCES jobs(id),
  change_id VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL,
  pattern VARCHAR(255),
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_pattern (user_id, pattern),
  UNIQUE (job_id, change_id)
);
```

## Queue Architecture

### Bull Queue Configuration
```javascript
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: 3,
  },
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 100,     // Keep last 100
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};
```

### Job Priority System
```
Priority 1 (Highest): Enterprise customers
Priority 5 (Normal): Regular paid jobs  
Priority 10 (Low): Free tier / retry jobs
```

## Caching Strategy

### Cache Layers
1. **CDN Cache** (Cloudflare)
   - Static assets: 1 year
   - API responses: 5 minutes
   - HTML pages: 1 hour

2. **Application Cache** (Redis)
   ```
   user:preferences:{userId} - 1 hour
   job:status:{jobId} - 5 minutes
   llm:result:{hash} - 24 hours
   rate:limit:{userId} - 1 minute
   ```

3. **Database Cache** (PostgreSQL)
   - Query result cache
   - Prepared statements
   - Connection pooling

### Cache Invalidation
```javascript
// Pattern: Cache-aside with TTL
async function getJobStatus(jobId: string) {
  // Try cache first
  const cached = await redis.get(`job:status:${jobId}`);
  if (cached) return JSON.parse(cached);
  
  // Cache miss - get from DB
  const job = await db.job.findUnique({ where: { id: jobId } });
  
  // Cache for 5 minutes
  await redis.setex(
    `job:status:${jobId}`,
    300,
    JSON.stringify(job)
  );
  
  return job;
}
```

## Error Handling Strategy

### Error Categories
1. **User Errors** (4xx)
   - Validation failures
   - Authentication errors
   - Rate limit exceeded
   - Not found

2. **System Errors** (5xx)
   - Database connection lost
   - Redis unavailable
   - S3 upload failed
   - LLM timeout

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File size exceeds 50MB limit",
    "details": {
      "field": "file",
      "maxSize": 52428800,
      "actualSize": 75000000
    }
  },
  "requestId": "req_abc123",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Monitoring & Alerting

### Key Metrics
```yaml
Business Metrics:
  - jobs_processed_total
  - job_success_rate
  - average_processing_time
  - revenue_per_job
  - user_retention_rate

Technical Metrics:
  - http_request_duration_seconds
  - http_requests_total
  - queue_job_duration_seconds
  - llm_request_duration_seconds
  - database_query_duration_seconds

Resource Metrics:
  - cpu_usage_percent
  - memory_usage_bytes
  - disk_usage_percent
  - redis_memory_usage_bytes
```

### Alert Thresholds
```yaml
Critical:
  - Error rate > 5% for 5 minutes
  - Response time > 1s (p95) for 5 minutes
  - Queue depth > 1000 jobs
  - Disk usage > 90%

Warning:
  - Error rate > 2% for 10 minutes
  - Response time > 500ms (p95) for 10 minutes
  - Queue depth > 500 jobs
  - Disk usage > 80%
```

## Security Considerations

### API Security
1. **Rate Limiting**: Per-user and per-IP
2. **Authentication**: JWT with short expiry
3. **Authorization**: Role-based access
4. **Input Validation**: Strict schema validation
5. **Output Encoding**: Prevent XSS

### Data Security
1. **Encryption at Rest**: AES-256
2. **Encryption in Transit**: TLS 1.3
3. **Key Management**: AWS KMS or similar
4. **Data Retention**: 24-hour auto-delete
5. **PII Handling**: Minimal collection

### Infrastructure Security
1. **Network**: Private VPC, security groups
2. **Secrets**: Environment variables, not in code
3. **Dependencies**: Regular updates, vulnerability scanning
4. **Containers**: Minimal base images, non-root user
5. **Monitoring**: Intrusion detection, anomaly alerts

## Deployment Strategy

### Blue-Green Deployment
```
┌─────────────┐     ┌─────────────┐
│   Blue      │     │   Green     │
│  (Current)  │     │   (New)     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────┬─────────────┘
             │
      ┌──────▼──────┐
      │ Load Balancer│
      └─────────────┘
```

### Rollback Strategy
1. **Database Migrations**: Always backward compatible
2. **API Versions**: Support n-1 version
3. **Feature Flags**: Gradual rollout
4. **Canary Releases**: 5% → 25% → 50% → 100%

## Scaling Triggers

### Horizontal Scaling
- CPU > 70% for 5 minutes → Add instance
- Queue depth > 100 jobs/instance → Add worker
- Response time > 500ms (p95) → Add API server

### Vertical Scaling
- Memory usage > 80% consistently → Increase RAM
- Database CPU > 80% → Upgrade instance
- Redis memory > 80% → Increase allocation

---

This system design prioritizes simplicity, cost-efficiency, and user experience while maintaining the flexibility to scale as the platform grows.