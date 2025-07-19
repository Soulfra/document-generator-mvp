# FinishThisIdea Cleanup Service

A complete $1 codebase cleanup service that transforms messy code into clean, organized projects using AI.

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+**
2. **PostgreSQL** (for job tracking)
3. **Redis** (for job queues)
4. **AWS S3** (for file storage)
5. **Stripe Account** (for payments)
6. **Ollama** (for local AI - optional)

### Setup

1. **Clone and install dependencies:**
```bash
cd FinishThisIdea-Complete
npm install
```

2. **Setup environment:**
```bash
cp .env.cleanup-example .env
# Edit .env with your configuration
```

3. **Setup database:**
```bash
npm run db:push
npm run db:generate
```

4. **Start services:**
```bash
# Start Redis (in separate terminal)
redis-server

# Start PostgreSQL (in separate terminal)
# Install and configure PostgreSQL

# Start Ollama (optional - for local AI)
ollama serve
ollama pull llama2  # or your preferred model

# Start the cleanup service
npm run dev:cleanup
```

## 📋 Environment Variables

Copy `.env.cleanup-example` to `.env` and configure:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `AWS_ACCESS_KEY_ID` - AWS S3 access key
- `AWS_SECRET_ACCESS_KEY` - AWS S3 secret key
- `S3_BUCKET` - S3 bucket for file storage
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

### Optional
- `OLLAMA_BASE_URL` - Local Ollama instance (default: http://localhost:11434)
- `ANTHROPIC_API_KEY` - Claude API key (fallback when Ollama fails)

## 🎯 How It Works

### User Flow
1. **Upload** - User uploads a ZIP file of messy code
2. **Payment** - User pays $1 via Stripe
3. **Processing** - AI analyzes and cleans the code
4. **Download** - User downloads clean, organized code

### Technical Flow
1. File uploaded to S3, job created in PostgreSQL
2. Stripe payment processed, webhook triggers job start
3. Job added to Redis queue for processing
4. AI analyzes code structure and issues
5. Code cleaned using Ollama (local) or Claude (fallback)
6. Files reorganized into logical structure
7. Results packaged and uploaded to S3
8. User notified and can download results

## 🛠️ API Endpoints

### Upload File
```bash
POST /api/cleanup/upload
Content-Type: multipart/form-data

# Returns job ID and file info
```

### Create Payment
```bash
POST /api/cleanup/payment/checkout
Content-Type: application/json
Body: { "jobId": "uuid" }

# Returns Stripe checkout URL
```

### Check Job Status
```bash
GET /api/cleanup/jobs/{jobId}

# Returns job progress and status
```

### Download Results
```bash
GET /api/cleanup/jobs/{jobId}/download

# Redirects to S3 download URL
```

### Stripe Webhook
```bash
POST /api/cleanup/webhook/stripe
# Handles payment confirmations
```

## 🔧 Development

### Start Development Server
```bash
npm run dev:cleanup
```

### Database Management
```bash
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes
```

### Queue Dashboard
Access Bull dashboard at: `http://localhost:3001/admin/queues`

### Testing
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Queue Status
- Bull dashboard: `http://localhost:3001/admin/queues`
- Real-time job progress via WebSocket

### Database
- Prisma Studio: `npm run db:studio`
- Direct PostgreSQL access for analytics

## 🚀 Deployment

### Docker (Recommended)
```bash
# Build image
docker build -t finishthisidea-cleanup .

# Run with docker-compose
docker-compose up -d
```

### Traditional Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start:cleanup
```

### Environment Setup
1. Configure PostgreSQL database
2. Setup Redis instance
3. Configure AWS S3 bucket
4. Setup Stripe webhooks
5. Configure environment variables
6. Run database migrations

## 🔐 Security

- Helmet.js for security headers
- Rate limiting on API endpoints
- File upload validation (50MB limit, ZIP/TAR only)
- Stripe webhook signature verification
- S3 pre-signed URLs for secure file access

## 💰 Business Model

- **Base Service**: $1 per cleanup
- **Future Add-ons**:
  - Documentation generation (+$3)
  - API generation (+$5)  
  - Test generation (+$4)
  - Custom cleanup rules (enterprise)

## 🔄 Integration with Soulfra

The service integrates with Soulfra-AgentZero for enhanced features:
- Advanced AI agents for specialized cleanup
- Memory system for user preferences
- Documentation generation templates
- Enterprise team management

## 📈 Metrics & Analytics

Track key metrics:
- Upload success rate
- Payment conversion rate
- Processing time and success rate
- User satisfaction and retention
- Revenue and costs

## 🐛 Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check S3 credentials and bucket permissions
   - Verify file size limit (50MB)
   - Ensure CORS is configured

2. **Payment Processing Fails**
   - Verify Stripe keys and webhook endpoint
   - Check webhook secret configuration
   - Test with Stripe test cards

3. **AI Processing Fails**
   - Check Ollama is running and accessible
   - Verify Claude API key if using fallback
   - Check job queue status in Bull dashboard

4. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Run `npm run db:push` to sync schema

## 📞 Support

For issues and questions:
1. Check logs in console/files
2. Use Bull dashboard for queue issues
3. Check Prisma Studio for database state
4. Review Stripe dashboard for payment issues

---

**🎉 Ready to clean some code!** 

Visit `http://localhost:3001` to start using the cleanup service.