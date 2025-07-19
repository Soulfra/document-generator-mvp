# FinishThisIdea MVP - $1 Codebase Cleanup

## What We're Building

A dead-simple service that takes messy code and returns clean, organized code for $1.

### Core Flow
1. **Upload**: User uploads a zip file of their messy codebase
2. **Pay**: User pays $1 via Stripe
3. **Process**: We clean the code using Ollama (local AI)
4. **Download**: User downloads the cleaned, organized codebase

## Technical Stack

### Backend
- **Express.js**: REST API server
- **Bull Queue**: Async job processing
- **Redis**: Queue backend
- **PostgreSQL**: Job tracking and user data
- **Ollama**: Local AI for code analysis
- **S3**: File storage

### AI Strategy
- Start with Ollama (free, local)
- If Ollama can't handle it, escalate to Claude
- Track costs and optimize over time

## MVP Features

### Must Have
- [x] File upload (zip files up to 50MB)
- [x] Stripe payment ($1)
- [x] Basic code cleanup:
  - Remove dead code
  - Organize imports
  - Fix indentation
  - Structure files logically
- [x] Download cleaned code
- [x] Job status tracking

### Nice to Have (Post-MVP)
- [ ] Documentation generation (+$3)
- [ ] API generation (+$5)
- [ ] Test generation (+$4)
- [ ] Custom cleanup rules
- [ ] Before/after preview

## File Structure

```
src/
├── server.ts           # Express server setup
├── api/               # API routes
│   ├── upload.ts      # File upload endpoint
│   ├── payment.ts     # Stripe checkout
│   ├── jobs.ts        # Job status
│   └── download.ts    # Result download
├── services/          # Business logic
│   ├── cleanup.ts     # Main cleanup service
│   ├── analyzer.ts    # Code analysis
│   └── organizer.ts   # File organization
├── llm/              # AI integrations
│   ├── ollama.ts     # Ollama client
│   └── router.ts     # LLM routing logic
├── jobs/             # Queue processors
│   └── cleanup.job.ts # Cleanup job processor
└── utils/            # Helpers
    ├── logger.ts     # Winston logger
    ├── storage.ts    # S3 operations
    └── errors.ts     # Error handling
```

## Database Schema

```sql
-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  input_file_url TEXT NOT NULL,
  output_file_url TEXT,
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error TEXT,
  metadata JSONB
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  stripe_payment_intent_id VARCHAR(255),
  amount INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### POST /api/upload
Upload a zip file for cleaning.

**Request:**
- Body: multipart/form-data with `file` field
- Max size: 50MB

**Response:**
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "uploadUrl": "https://s3.../uploads/123e4567.zip",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

### POST /api/webhook/stripe
Stripe webhook to confirm payment and start processing.

### GET /api/jobs/:id
Check job status.

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing", // pending, processing, completed, failed
  "progress": 45,
  "createdAt": "2024-01-20T10:00:00Z",
  "completedAt": null,
  "downloadUrl": null
}
```

### GET /api/download/:jobId
Download cleaned codebase (when job is completed).

## Ollama Prompts

### Code Analysis
```
Analyze this codebase and identify:
1. Dead code that can be removed
2. Duplicate functions
3. Unused imports
4. File organization issues
5. Naming inconsistencies

Return a structured JSON report.
```

### Code Cleanup
```
Clean up this code file:
1. Remove unused imports
2. Fix indentation (use 2 spaces)
3. Order imports logically
4. Remove commented-out code
5. Fix obvious syntax issues

Preserve all functionality. Only clean, don't change logic.
```

## Deployment

### Local Development
```bash
# Start services
docker-compose up -d

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Production (Railway)
```bash
# Deploy with Railway CLI
railway up

# Set environment variables
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set DATABASE_URL=postgresql://...
railway variables set REDIS_URL=redis://...
```

## Success Metrics

### Week 1
- [ ] 50 cleanups processed
- [ ] 90% success rate
- [ ] <5 minute average processing time

### Month 1
- [ ] 500 cleanups
- [ ] 95% success rate
- [ ] 50% returning users
- [ ] First upsell to documentation service

## Next Steps After MVP

1. **Add Documentation Generation**: Use cleaned code to generate README, API docs
2. **Template Extraction**: Identify patterns and create reusable templates
3. **Batch Processing**: Allow multiple projects at once
4. **Enterprise Features**: Custom rules, team accounts, API access