# 🚀 FinishThisIdea Platform Setup Guide

Welcome to FinishThisIdea! This guide will help you set up the complete platform with all advanced features.

## 📋 Prerequisites

- **Node.js** 18+ 
- **Docker & Docker Compose**
- **Git**
- **PostgreSQL** (or use Docker)
- **Redis** (or use Docker)

## 🔧 Quick Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository>
cd FinishThisIdea-Complete
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/finishthisidea

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-change-in-production
SESSION_SECRET=your-session-secret-change-in-production

# AI Services (at least one required)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
OPENAI_API_KEY=sk-your-openai-key-here

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your-stripe-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key-or-minioadmin
AWS_SECRET_ACCESS_KEY=your-aws-secret-or-minioadmin123
S3_BUCKET=finishthisidea-uploads
```

### 3. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, MinIO, and Ollama
docker-compose up -d postgres redis minio ollama

# Wait for services to be ready
sleep 10
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create database schema
npx prisma db push

# Seed with initial data
npx prisma db seed
```

### 5. Start the Application

```bash
# Development mode
npm run dev

# Or production mode
npm run build && npm start
```

## 🌐 Access Points

Once running, you can access:

- **Main Application**: http://localhost:8080
- **Frontend**: http://localhost:3000 (if using separate frontend)
- **API Documentation**: http://localhost:8080/api-docs
- **Bull Queue Dashboard**: http://localhost:8080/admin/queues
- **Monitoring Dashboard**: http://localhost:8080/monitoring-dashboard.html
- **Achievements Page**: http://localhost:8080/achievements.html
- **Trust Tiers Info**: http://localhost:8080/trust-tiers.html

## 🎯 Core Features

### ✅ Implemented Features

1. **🤖 AI-Powered Code Cleanup**
   - Multi-provider AI routing (Claude, OpenAI, Ollama)
   - Context-aware cleaning with profiles
   - Smart file analysis and optimization

2. **🧠 Memory & Learning System**
   - CalThought Memory for AI learning
   - User preference tracking
   - Pattern recognition and adaptation

3. **🎮 Gamification System**
   - 10 achievements across 5 categories
   - XP and level progression
   - Leaderboards and progress tracking

4. **🔐 Trust Tier System**
   - Bronze → Silver → Gold → Platinum tiers
   - Progressive feature access
   - Usage-based tier advancement

5. **📊 Monitoring & Analytics**
   - Platform-wide logging and metrics
   - Service-specific performance tracking
   - Real-time error monitoring

6. **💾 Backup System**
   - Pre-cleanup backups with S3 storage
   - Configurable retention policies
   - Metadata-rich backup records

7. **📄 Documentation Generation**
   - Auto-generated cleanup reports
   - Multiple formats (Markdown, HTML, PDF)
   - Comprehensive change tracking

8. **🔗 QR Code System**
   - Quick access for sharing sessions
   - Authentication and file sharing
   - Viral referral system

9. **🔒 Authentication System**
   - JWT-based authentication
   - User registration and login
   - Password reset functionality

10. **💳 Payment Processing**
    - Stripe integration
    - Webhook handling
    - Payment tracking

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 🐳 Docker Deployment

### Full Stack Deployment

```bash
# Deploy everything
docker-compose up -d

# Scale specific services
docker-compose up -d --scale app=3
```

### Production Configuration

1. **Environment Setup**:
   ```bash
   cp .env.example .env.production
   # Edit production values
   ```

2. **SSL/TLS Configuration**:
   - Update nginx configuration
   - Add SSL certificates
   - Enable HTTPS redirects

3. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```

## 📚 API Documentation

### Authentication Endpoints

```bash
POST /api/auth/register    # User registration
POST /api/auth/login       # User login  
POST /api/auth/logout      # User logout
GET  /api/auth/me          # Get current user
POST /api/auth/forgot-password  # Request password reset
POST /api/auth/reset-password   # Reset password
```

### Cleanup Endpoints

```bash
POST /api/cleanup/upload   # Upload files for cleaning
GET  /api/cleanup/job/:id  # Get job status
POST /api/cleanup/webhook  # Stripe webhook
```

### Gamification Endpoints

```bash
GET  /api/achievements/user/:userId  # Get user achievements
GET  /api/achievements/leaderboard   # Get leaderboard
POST /api/achievements/check/:userId # Check for new achievements
```

## 🔧 Configuration

### Feature Flags

Enable/disable features in `.env`:

```env
ENABLE_GAMIFICATION=true
ENABLE_TRUST_TIERS=true
ENABLE_BACKUPS=true
ENABLE_MONITORING=true
ENABLE_VIRAL_FEATURES=true
```

### AI Provider Configuration

```env
# Primary provider priority
AI_PROVIDER_PRIORITY=claude,openai,ollama

# Cost limits
MAX_CLEANUP_COST_USD=1.00
FALLBACK_TO_LOCAL=true
```

### Security Settings

```env
# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# File upload limits
MAX_UPLOAD_SIZE=50MB
ALLOWED_FILE_TYPES=.zip,.tar.gz,.rar
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   docker-compose ps postgres
   
   # Reset database
   docker-compose down postgres
   docker volume rm finishthisidea-complete_postgres_data
   docker-compose up -d postgres
   ```

2. **AI Provider Errors**
   ```bash
   # Check API keys are valid
   # Verify provider endpoints are accessible
   # Check rate limits and quotas
   ```

3. **File Upload Issues**
   ```bash
   # Check S3/MinIO configuration
   # Verify storage permissions
   # Check file size limits
   ```

### Logs and Debugging

```bash
# Application logs
tail -f logs/platform.log

# Docker service logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs
- **Features**: Submit feature requests with detailed descriptions

## 🎉 You're Ready!

Your FinishThisIdea platform is now set up with:

- ✅ AI-powered code cleanup
- ✅ Gamification and achievements  
- ✅ Trust tier progression
- ✅ Memory and learning systems
- ✅ Monitoring and analytics
- ✅ Payment processing
- ✅ Authentication system
- ✅ Backup and recovery
- ✅ QR code sharing
- ✅ Documentation generation

Start by uploading a codebase at http://localhost:8080 and experience the power of AI-enhanced development!