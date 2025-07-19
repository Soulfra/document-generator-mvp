# Technical Architecture - FinishThisIdea.com

## System Overview

FinishThisIdea is built as a modular, microservices-based platform that can start simple ($1 cleanup) and scale to a comprehensive AI development platform.

## Core Architecture Principles

### 1. **Progressive Enhancement**
- Start with cloud LLMs for reliability
- Add local Ollama for cost optimization
- Scale to multi-model orchestration

### 2. **Template-Driven Development**
- Every service is a template
- New services generated in minutes
- Consistent architecture across all services

### 3. **Cost-Optimized AI Routing**
```
Request → Complexity Analysis → Route Decision
         ↓                      ↓
    Simple (Score < 3)     Complex (Score > 7)
         ↓                      ↓
    Ollama (Free)          Claude/GPT-4
```

## System Components

### Frontend Layer

#### Web Application (Next.js)
```typescript
// Core pages
pages/
├── index.tsx          // Landing page with upload
├── payment.tsx        // Stripe payment flow
├── processing.tsx     // Real-time progress
├── results.tsx        // Download cleaned code
└── dashboard.tsx      // User dashboard

// Tinder UI Components
components/
├── SwipeableCard.tsx  // Swipeable decision cards
├── DecisionQueue.tsx  // Queue management
├── ProgressTracker.tsx // Real-time updates
└── PreferenceModal.tsx // User preferences
```

#### Mobile Application (React Native)
- iOS/Android apps for on-the-go code review
- Swipe interface optimized for mobile
- Push notifications for job completion

### Backend Services

#### API Gateway (Express.js)
```javascript
// Main API routes
POST   /api/upload      // File upload endpoint
POST   /api/payment     // Payment processing
GET    /api/status/:id  // Job status
GET    /api/download/:id // Result download
WS     /ws/progress     // Real-time updates

// Service routes
POST   /api/analyze     // Code analysis
POST   /api/cleanup     // Cleanup execution
POST   /api/generate    // Code generation
```

#### Job Queue System (Bull + Redis)
```javascript
// Queue definitions
const queues = {
  analysis: new Bull('analysis-queue'),
  cleanup: new Bull('cleanup-queue'),
  generation: new Bull('generation-queue'),
  notification: new Bull('notification-queue')
};

// Job processing flow
uploadQueue → analysisQueue → cleanupQueue → notificationQueue
```

### AI Orchestration Layer

#### LLM Router Architecture
```javascript
class LLMRouter {
  constructor() {
    this.providers = {
      local: new OllamaProvider(),
      openai: new OpenAIProvider(),
      anthropic: new ClaudeProvider()
    };
  }

  async route(task) {
    const complexity = await this.analyzeComplexity(task);
    
    if (complexity.score < 3) {
      return this.providers.local.process(task);
    }
    
    if (complexity.requiresReview) {
      const localResult = await this.providers.local.process(task);
      return this.enhanceWithCloud(localResult, task);
    }
    
    return this.providers.anthropic.process(task);
  }
}
```

#### Cost Management
```javascript
// Cost tracking per operation
const costModel = {
  ollama: { perToken: 0, fixedCost: 0 },
  gpt35: { perToken: 0.0001, fixedCost: 0.01 },
  gpt4: { perToken: 0.001, fixedCost: 0.05 },
  claude: { perToken: 0.0008, fixedCost: 0.03 }
};

// Dynamic routing based on budget
if (estimatedCost > userBudget) {
  return this.downgradeModel(task);
}
```

### Data Layer

#### Primary Database (PostgreSQL)
```sql
-- Core schema
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50), -- cleanup, documentation, etc
  status VARCHAR(50), -- pending, processing, completed
  input_file_url TEXT,
  output_file_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE decisions (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  decision_type VARCHAR(100),
  user_choice VARCHAR(20), -- approved, rejected, always, never
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Cache Layer (Redis)
```javascript
// Cache strategies
const cacheKeys = {
  userPreferences: (userId) => `prefs:${userId}`,
  jobStatus: (jobId) => `job:${jobId}`,
  analysisCache: (hash) => `analysis:${hash}`,
  templateCache: (name) => `template:${name}`
};

// Session management
redis.setex(sessionKey, 3600, JSON.stringify(sessionData));
```

### Template Engine

#### Service Template Structure
```yaml
# template.yaml
name: "{{SERVICE_NAME}}"
version: "1.0.0"
type: "{{SERVICE_TYPE}}"

infrastructure:
  frontend:
    framework: "next"
    features: ["upload", "payment", "progress"]
  backend:
    framework: "express"
    database: "postgresql"
    queue: "bull"
  
ai:
  providers: ["ollama", "claude"]
  routing: "complexity-based"
  
deployment:
  platform: "railway"
  scaling: "auto"
```

#### Template Generation
```bash
# Generate new service from template
npm run generate-service -- \
  --name "api-generator" \
  --type "code-generation" \
  --price 5 \
  --ai-model "codellama"
```

## Deployment Architecture

### Container Strategy
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./src/mvp-cleanup-service/frontend
    ports: ["3000:3000"]
    
  backend:
    build: ./src/mvp-cleanup-service/backend
    ports: ["3001:3001"]
    depends_on: [postgres, redis]
    
  ollama:
    image: ollama/ollama
    volumes: ["./models:/models"]
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: finishthisidea
      
  redis:
    image: redis:7-alpine
```

### Production Deployment
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │     │   Railway   │     │    AWS S3   │
│  (Frontend) │────▶│  (Backend)  │────▶│   (Files)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌────▼────┐
              │ PostgreSQL │ │  Redis  │
              └───────────┘ └─────────┘
```

## Security Architecture

### Authentication & Authorization
- JWT tokens with refresh mechanism
- API key management for service access
- Role-based access control (RBAC)

### Data Security
- AES-256 encryption for files at rest
- TLS 1.3 for all communications
- Sandboxed execution environments
- No persistent storage of processed code

### API Security
```javascript
// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true
}));

// Input validation
app.use(validator({
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: ['.zip', '.tar.gz'],
  sanitizeFilenames: true
}));
```

## Scaling Strategy

### Horizontal Scaling
- Stateless API servers
- Queue-based job distribution
- Read replicas for database
- CDN for static assets

### Performance Optimization
- Ollama model preloading
- Result caching for common patterns
- Batch processing for multiple files
- WebSocket for real-time updates

## Monitoring & Observability

### Application Monitoring
- New Relic APM for performance
- Sentry for error tracking
- Custom metrics dashboard
- Real-time alerts

### Business Metrics
```javascript
// Key metrics tracked
const metrics = {
  jobsProcessed: counter('jobs_processed_total'),
  processingTime: histogram('job_processing_seconds'),
  aiCosts: gauge('ai_costs_dollars'),
  userSatisfaction: gauge('user_satisfaction_score')
};
```

## Disaster Recovery

### Backup Strategy
- Automated daily database backups
- File versioning in S3
- Configuration backups
- Disaster recovery runbooks

### Failover Plan
- Multi-region deployment ready
- Database replication
- Queue persistence
- Graceful degradation

This architecture is designed to start simple but scale to handle millions of code transformations while maintaining quality and performance.