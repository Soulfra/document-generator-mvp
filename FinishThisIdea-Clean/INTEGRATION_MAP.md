# FinishThisIdea Integration Map

## System Component Connections

This document maps how all components of the FinishThisIdea system connect and interact with each other.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Tinder UI     │   Web Portal    │      Claude Code/MCP       │
│  (Swipe Review) │  (Upload/Pay)   │   (Development Assistant)   │
└────────┬────────┴────────┬────────┴──────────┬─────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                    (Express + Auth + Rate Limit)                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Service    │   │   Service    │   │   Service    │
│   Router     │   │  Processor   │   │  Generator   │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                   │
       ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LLM Router                                │
│           (Progressive Enhancement: Ollama → GPT → Claude)       │
└────┬──────────────────┬─────────────────────┬───────────────────┘
     ▼                  ▼                     ▼
┌─────────┐      ┌─────────────┐      ┌──────────────┐
│ Ollama  │      │   OpenAI    │      │  Anthropic   │
│ (Local) │      │ (GPT-3.5/4) │      │   (Claude)   │
└─────────┘      └─────────────┘      └──────────────┘
```

## Component Details

### 1. User Interface Layer

#### Tinder UI (Swipe Interface)
- **Location**: `src/tinder-ui/`
- **Purpose**: Review and approve/reject AI-generated changes
- **Connects To**: 
  - API Gateway (REST endpoints)
  - WebSocket for real-time updates
  - File storage for diffs
- **Key Files**:
  - `SwipeableCard.tsx`: Core swipe component
  - `CodeDiff.tsx`: Side-by-side diff viewer
  - `PreferenceEngine.ts`: Learn user preferences

#### Web Portal
- **Location**: `src/web-portal/`
- **Purpose**: Upload files, process payments, download results
- **Connects To**:
  - API Gateway
  - Stripe for payments
  - S3/Storage for file handling
- **Key Files**:
  - `FileUploader.tsx`: Drag-drop upload
  - `PaymentFlow.tsx`: Stripe integration
  - `ProgressTracker.tsx`: Job status

#### Claude Code Integration (MCP)
- **Location**: `.mcp/`
- **Purpose**: AI assistant for developers using the platform
- **Connects To**:
  - Memory system (`.claude/`)
  - Source code for context
  - Documentation for guidance
- **Key Files**:
  - `server.js`: MCP server implementation
  - `config.json`: Integration configuration
  - `prompts/`: Custom prompt templates

### 2. API Layer

#### API Gateway
- **Location**: `src/api/`
- **Purpose**: Central request routing and middleware
- **Connects To**:
  - All services
  - Authentication system
  - Rate limiter
  - Job queue
- **Key Endpoints**:
  ```
  POST /api/upload       - Upload codebase
  POST /api/services/:id - Start service processing
  GET  /api/jobs/:id     - Check job status
  GET  /api/results/:id  - Download results
  POST /api/swipe        - Submit review decision
  ```

### 3. Service Layer

#### Service Router
- **Location**: `src/services/router/`
- **Purpose**: Route requests to appropriate service
- **Connects To**:
  - Service registry
  - Job queue
  - LLM Router
- **Logic**:
  ```typescript
  // Routing logic
  if (request.service === 'cleanup') {
    return CleanupService.process(request);
  } else if (request.service === 'documentation') {
    return DocumentationService.process(request);
  }
  // ... etc
  ```

#### Individual Services
- **Location**: `src/services/*/`
- **Each Service Has**:
  - `service.ts`: Main processing logic
  - `types.ts`: Input/output types
  - `prompts.ts`: LLM prompt templates
  - `tests/`: Comprehensive tests

### 4. LLM Integration Layer

#### LLM Router
- **Location**: `src/llm-router/`
- **Purpose**: Progressive LLM enhancement
- **Connects To**:
  - Ollama (local)
  - OpenAI API
  - Anthropic API
- **Decision Flow**:
  ```
  1. Try Ollama first (free, fast)
  2. If confidence < 0.8, try GPT-3.5
  3. If still low confidence, try GPT-4/Claude
  4. Return best result
  ```

### 5. Infrastructure Layer

#### Job Queue
- **Technology**: Bull/Redis
- **Purpose**: Async job processing
- **Connects To**:
  - API Gateway (job creation)
  - Services (job processing)
  - Storage (results)

#### Storage System
- **Local Dev**: `uploads/`, `processed/`
- **Production**: S3-compatible storage
- **Purpose**: File upload/download
- **Connects To**:
  - API Gateway
  - Services
  - Cleanup cron jobs

#### Database
- **Technology**: PostgreSQL
- **Schema**:
  - Users
  - Jobs
  - Services
  - Payments
  - Preferences
- **Connects To**:
  - All services for persistence

### 6. Development Infrastructure

#### Memory System
- **Location**: `.claude/`
- **Purpose**: Maintain context across sessions
- **Components**:
  - `memory.md`: Long-term memory
  - `context.md`: Current context
  - `decisions.md`: Architecture log
  - `patterns.md`: Code patterns
  - `todo.md`: Task tracking
- **Updated By**:
  - `memory-update.sh` script
  - Manual edits
  - Git hooks

#### Git Worktrees
- **Location**: `../finishthisidea-worktrees/`
- **Purpose**: Parallel development
- **Managed By**: `worktree-manager.sh`
- **Structure**:
  ```
  feature-ollama/     # Feature development
  docs-api/          # Documentation work
  fix-bug-123/       # Bug fixes
  ```

#### Quality Scripts
- **Location**: `scripts/`
- **Scripts**:
  - `cleanup.sh`: Enforce standards
  - `validate-mcp.sh`: Test MCP
  - `memory-update.sh`: Update memory
  - `worktree-manager.sh`: Manage worktrees

## Data Flow Examples

### Example 1: Code Cleanup Service

```
1. User uploads code via Web Portal
   ↓
2. API Gateway creates job, charges payment
   ↓
3. Job Queue picks up cleanup job
   ↓
4. Cleanup Service processes:
   - Analyzes code structure
   - Sends to LLM Router
   - Ollama formats and cleans
   - Generates changes
   ↓
5. Results saved to storage
   ↓
6. User reviews via Tinder UI
   ↓
7. Approved changes compiled
   ↓
8. Final download available
```

### Example 2: Documentation Generation

```
1. Developer uses Claude Code
   ↓
2. MCP reads project context
   ↓
3. Triggers documentation service
   ↓
4. Service analyzes codebase
   ↓
5. LLM Router generates docs:
   - Ollama for basic structure
   - GPT-3.5 for detailed content
   - Claude for complex explanations
   ↓
6. Markdown files created
   ↓
7. Committed to repository
```

## Integration Points

### External Services

1. **Payment Processing**
   - Service: Stripe
   - Integration: `src/payments/`
   - Webhooks: Payment confirmation

2. **Email Notifications**
   - Service: SendGrid/Resend
   - Integration: `src/notifications/`
   - Triggers: Job complete, errors

3. **Monitoring**
   - Service: Sentry
   - Integration: Error tracking
   - Alerts: Critical failures

4. **Analytics**
   - Service: PostHog/Mixpanel
   - Integration: User behavior
   - Metrics: Service usage, success rates

### Security Layers

1. **Authentication**
   - JWT tokens
   - Session management
   - API key validation

2. **Authorization**
   - Role-based access
   - Service permissions
   - Rate limiting

3. **Data Protection**
   - Encryption at rest
   - Secure file transfer
   - Code sanitization

## Configuration Management

### Environment Variables
```env
# LLM Providers
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Services
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
S3_ENDPOINT=https://...

# External Services
STRIPE_SECRET_KEY=sk_...
SENDGRID_API_KEY=SG...
SENTRY_DSN=https://...
```

### Feature Flags
```json
{
  "enable_ollama": true,
  "enable_openai": false,
  "enable_anthropic": false,
  "swipe_interface": true,
  "auto_approve_threshold": 0.95
}
```

## Deployment Architecture

### Development
- Local Ollama
- SQLite database
- File system storage
- Hot reload enabled

### Staging
- Dockerized services
- PostgreSQL
- MinIO for S3
- Feature flags for testing

### Production
- Kubernetes cluster
- Managed PostgreSQL
- S3 storage
- CDN for static assets
- Auto-scaling workers

## Troubleshooting Connections

### Common Issues

1. **MCP Not Connecting**
   - Check `.mcp/config.json`
   - Validate with `validate-mcp.sh`
   - Ensure Claude Code configured

2. **LLM Router Failures**
   - Check Ollama running: `curl http://localhost:11434`
   - Verify API keys set
   - Review fallback logic

3. **Storage Issues**
   - Check permissions on directories
   - Verify S3 credentials
   - Test with small files first

4. **Memory Sync Problems**
   - Run `memory-update.sh`
   - Check git status
   - Verify `.claude/` tracked

## Performance Optimization

### Caching Strategy
- Redis for job status
- CDN for static assets
- LLM response caching
- Preference caching

### Scaling Points
- Horizontal scaling for API
- Queue workers auto-scale
- Database read replicas
- CDN for global distribution

---

*Last Updated: 2024-01-20*
*Version: 1.0.0*