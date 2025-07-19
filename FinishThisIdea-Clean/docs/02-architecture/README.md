# Architecture Overview

## System Design Philosophy

FinishThisIdea follows these architectural principles:

1. **Simple Over Complex** - Start with the minimum viable architecture
2. **Cost-Conscious** - Optimize for low operational costs
3. **User-Centric** - Every decision improves user experience
4. **Progressive Enhancement** - Basic features work everywhere, advanced features when available
5. **Learn & Adapt** - System improves with usage

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    Next.js + Tailwind                        │
│                   Tinder UI Components                       │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
                  │ HTTPS                 │ WebSocket
                  ↓                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                   (Cloudflare / Nginx)                       │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
                  ↓                       ↓
┌─────────────────────────┐     ┌─────────────────────────────┐
│      API Gateway        │     │    Real-time Updates        │
│   Express + TypeScript  │     │      Socket.io              │
├─────────────────────────┤     ├─────────────────────────────┤
│ • Authentication        │     │ • Progress updates          │
│ • Rate Limiting         │     │ • Live notifications        │
│ • Request Validation    │     │ • Swipe sync                │
└──────────┬──────────────┘     └─────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Cleanup Service │ Doc Generator   │ API Generator   │ More  │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         ↓                 ↓                 ↓
┌─────────────────────────────────────────────────────────────┐
│                    LLM Router                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│    Ollama       │   OpenAI API    │   Anthropic API         │
│   (Local)       │  (GPT-3.5/4)    │    (Claude)             │
└─────────────────┴─────────────────┴─────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ PostgreSQL   │    Redis     │   MinIO/S3   │   Stripe      │
│ (Primary DB) │   (Cache)    │  (Storage)   │  (Payments)   │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

## Core Components

### 1. Frontend Layer
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query + Zustand
- **Animations**: Framer Motion
- **Key Feature**: Tinder-style swipe interface

### 2. API Gateway
- **Framework**: Express.js + TypeScript
- **Authentication**: JWT + API Keys
- **Rate Limiting**: Per-user and per-IP
- **Validation**: Zod schemas
- **Documentation**: OpenAPI 3.0

### 3. Service Layer
- **Pattern**: Microservice-ready monolith
- **Queue**: Bull (Redis-backed)
- **Processing**: Async job processing
- **Scaling**: Horizontal pod scaling

### 4. LLM Router
- **Primary**: Ollama (local, free)
- **Fallback 1**: OpenAI GPT-3.5 (cheap)
- **Fallback 2**: GPT-4/Claude (quality)
- **Strategy**: Progressive enhancement

### 5. Data Layer
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions & queues
- **Storage**: MinIO (S3-compatible)
- **Search**: PostgreSQL full-text

## Request Flow

### 1. Code Cleanup Request
```
User uploads ZIP
    ↓
Cloudflare CDN
    ↓
API Gateway
    ├── Validate file
    ├── Create job record
    └── Return job ID
    ↓
Bull Queue
    ├── Download from S3
    ├── Process with LLM Router
    ├── Generate changes
    └── Upload results
    ↓
WebSocket notification
    ↓
User reviews changes (Tinder UI)
    ↓
Apply approved changes
    ↓
Download cleaned code
```

### 2. LLM Routing Decision
```
Analyze code complexity
    ↓
Complexity < 0.3?
    → Use Ollama (free)
    
Complexity < 0.7?
    → Try Ollama first
    → If confidence < 80%, use GPT-3.5
    
Complexity >= 0.7?
    → Try GPT-3.5 first
    → If confidence < 80%, use GPT-4/Claude
    
Hybrid mode?
    → Combine results from multiple models
```

## Data Models

### Core Entities
```typescript
User {
  id: UUID
  email: string
  apiKey?: string
  stripeCustomerId?: string
  preferences: JSON
  createdAt: DateTime
}

Job {
  id: UUID
  userId: UUID
  type: ServiceType
  status: JobStatus
  input: JSON
  output?: JSON
  progress: number
  cost: number
  createdAt: DateTime
  completedAt?: DateTime
}

SwipeDecision {
  id: UUID
  userId: UUID
  jobId: UUID
  changeId: UUID
  action: SwipeAction
  pattern?: string
  timestamp: DateTime
}
```

## Security Architecture

### Authentication Layers
1. **Public API**: API key authentication
2. **Web App**: JWT with refresh tokens
3. **Admin**: OAuth2 + 2FA
4. **Webhooks**: HMAC signature verification

### Data Security
- **Encryption at Rest**: AES-256
- **Encryption in Transit**: TLS 1.3
- **File Storage**: Temporary, auto-delete after 24h
- **PII Handling**: Minimal collection, GDPR compliant

### Infrastructure Security
- **WAF**: Cloudflare protection
- **DDoS**: Rate limiting + Cloudflare
- **Secrets**: Environment variables + KMS
- **Monitoring**: Sentry + custom alerts

## Scalability Design

### Horizontal Scaling
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Worker 1 │ │ Worker 2 │ │ Worker N │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┴────────────┘
                  │
            Redis Queue
```

### Caching Strategy
1. **CDN**: Static assets (Cloudflare)
2. **API**: Response caching (Redis)
3. **Database**: Query caching (Redis)
4. **LLM**: Result caching by hash

### Performance Targets
- **API Response**: < 200ms (p95)
- **File Upload**: < 5s for 50MB
- **Job Processing**: < 5min average
- **Swipe Interface**: 60 FPS

## Deployment Architecture

### Development
```yaml
Local Development:
  - Frontend: localhost:3000
  - Backend: localhost:3001
  - Ollama: localhost:11434
  - PostgreSQL: localhost:5432
  - Redis: localhost:6379
  - MinIO: localhost:9000
```

### Production
```yaml
Production (Railway/Vercel):
  - Frontend: Vercel Edge Network
  - Backend: Railway containers
  - Database: Railway PostgreSQL
  - Redis: Railway Redis
  - Storage: AWS S3 / Cloudflare R2
  - LLM: Local Ollama + Cloud APIs
```

## Monitoring & Observability

### Metrics Collection
- **APM**: Sentry Performance
- **Logs**: Structured JSON logging
- **Metrics**: Prometheus format
- **Traces**: OpenTelemetry

### Key Metrics
```
Business Metrics:
- Jobs processed/hour
- Success rate
- Average processing time
- Cost per job
- User retention

Technical Metrics:
- API latency (p50, p95, p99)
- Error rate
- Queue depth
- LLM usage by provider
- Storage usage
```

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups
- **Code**: Git with protected branches
- **Configs**: Version controlled
- **User Files**: 24h retention only

### Failure Scenarios
1. **LLM Provider Down**: Automatic fallback
2. **Database Failure**: Read replica promotion
3. **Queue Failure**: Redis persistence + replay
4. **Storage Failure**: Multi-region replication

## Technology Decisions

### Why These Choices?

**Next.js over Create React App**
- Built-in SSR/SSG for SEO
- API routes for simple endpoints
- Image optimization
- Better performance

**PostgreSQL over MongoDB**
- Strong consistency requirements
- Complex queries needed
- Proven scalability
- Better for financial data

**Bull over Celery/RabbitMQ**
- Simpler setup
- Built for Node.js
- Good enough for our scale
- Nice dashboard

**Ollama over OpenAI-only**
- 70% of requests can be free
- User data stays local
- Predictable costs
- Good enough quality

## Future Architecture Evolution

### Phase 1 (Current): Monolith
All services in one codebase, easy to develop and deploy.

### Phase 2 (10k users): Service Separation
Split heavy services into separate deployments.

### Phase 3 (100k users): Full Microservices
Each service gets its own repo, team, and deployment.

### Phase 4 (1M users): Global Distribution
Multi-region deployment with edge computing.

## Development Guidelines

### Code Organization
```
src/
├── services/          # Business logic
├── routes/           # API endpoints
├── queues/           # Async processors
├── utils/            # Shared utilities
└── types/            # TypeScript types
```

### Testing Strategy
- **Unit Tests**: Each function
- **Integration Tests**: API endpoints
- **E2E Tests**: Critical user flows
- **Load Tests**: Before major releases

### Performance Budget
- **Bundle Size**: < 200KB gzipped
- **Time to Interactive**: < 3s
- **API Response**: < 200ms
- **Database Query**: < 50ms

---

## Quick Links

- [System Design Details](system-design.md)
- [Data Flow](data-flow.md)
- [Security Architecture](security.md)
- [Scalability Plan](scalability.md)
- [LLM Routing Logic](llm-routing-architecture.md)
- [Database Schema](../03-services/service-catalog.md)