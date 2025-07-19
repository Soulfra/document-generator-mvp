# Local Development Setup

## Prerequisites

### Required Software
- **Node.js**: 18.0+ (20.x recommended)
- **Docker**: 20.10+ with Docker Compose
- **Git**: 2.30+
- **Code Editor**: VS Code recommended

### Optional but Helpful
- **Ollama**: For local AI (saves money)
- **Stripe CLI**: For webhook testing
- **PostgreSQL client**: For database access
- **Redis client**: For cache debugging

## Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/finishthisidea/finishthisidea.git
cd finishthisidea

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env

# 4. Start services with Docker
docker-compose up -d

# 5. Run database migrations
npm run db:migrate

# 6. Seed test data (optional)
npm run db:seed

# 7. Start development servers
npm run dev

# 8. Open in browser
open http://localhost:3000
```

## Detailed Setup

### Step 1: Install Prerequisites

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install node@20 docker git postgresql redis

# Install Ollama (optional but recommended)
brew install ollama

# Start Ollama
ollama serve

# Pull models
ollama pull codellama
ollama pull mistral
```

#### Ubuntu/Debian
```bash
# Update package manager
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install other tools
sudo apt install -y git postgresql-client redis-tools

# Install Ollama (optional)
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Windows (WSL2)
```powershell
# Install WSL2
wsl --install

# Inside WSL2, follow Ubuntu instructions above
```

### Step 2: Clone and Configure

```bash
# Clone with SSH (recommended)
git clone git@github.com:finishthisidea/finishthisidea.git

# Or with HTTPS
git clone https://github.com/finishthisidea/finishthisidea.git

cd finishthisidea
```

### Step 3: Environment Configuration

Edit `.env` file with your values:

```bash
# Core Services (Docker provides these)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finishthisidea
REDIS_URL=redis://localhost:6379

# Storage (MinIO in development)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=uploads
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# AI Providers
OLLAMA_URL=http://localhost:11434
# Optional: Add for better quality
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Step 4: Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all

# Or manually for each service
cd src/mvp-cleanup-service/backend && npm install
cd ../frontend && npm install
cd ../../../
```

### Step 5: Database Setup

```bash
# Ensure PostgreSQL is running
docker-compose up -d postgres

# Run migrations
npm run db:migrate

# Create test user (optional)
npm run db:seed

# Verify database
npm run db:studio  # Opens Prisma Studio
```

### Step 6: Start Development Servers

#### Option 1: Start Everything
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Queue Dashboard: http://localhost:3001/admin/queues
- WebSocket: ws://localhost:3001

#### Option 2: Start Services Individually
```bash
# Terminal 1: Backend
cd src/mvp-cleanup-service/backend
npm run dev

# Terminal 2: Frontend
cd src/mvp-cleanup-service/frontend
npm run dev

# Terminal 3: Worker (for job processing)
cd src/mvp-cleanup-service/backend
npm run worker
```

## Development Workflow

### 1. Making Code Changes

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
code .  # Opens VS Code

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### 2. Testing Your Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.service.test.ts

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

### 3. Testing File Upload

```bash
# Create test file
echo "console.log('messy code')" > test.js
zip test.zip test.js

# Upload via curl
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@test.zip"
```

### 4. Testing Stripe Webhooks

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

### 5. Testing with Ollama

```bash
# Start Ollama
ollama serve

# Test it's working
curl http://localhost:11434/api/generate -d '{
  "model": "codellama",
  "prompt": "Fix this code: console.log(\"test\")"
}'
```

## Common Development Tasks

### Adding a New Service

```bash
# Generate from template
npm run generate:service -- --name "my-service" --price 5

# Install dependencies
cd src/services/my-service && npm install

# Start development
npm run dev
```

### Database Changes

```bash
# Modify schema
code prisma/schema.prisma

# Create migration
npm run db:migrate:create -- --name add_feature

# Apply migration
npm run db:migrate

# Generate types
npm run db:generate
```

### Debugging

#### Backend Debugging (VS Code)
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Backend",
  "port": 9229,
  "restart": true
}
```

Run with: `npm run dev:debug`

#### Frontend Debugging
- Use React DevTools
- Check Network tab for API calls
- Use `console.log` strategically
- Enable source maps

#### Database Debugging
```bash
# Connect to database
npm run db:studio

# Or use psql
psql $DATABASE_URL

# Common queries
SELECT * FROM users;
SELECT * FROM jobs ORDER BY created_at DESC LIMIT 10;
```

## Performance Tips

### 1. Use Ollama for Development
- Free and fast
- No API keys needed
- Good enough for testing

### 2. Cache Aggressively
```typescript
// Example caching
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
```

### 3. Use Docker Volumes
```yaml
# docker-compose.yml
volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 4. Limit Processing
```typescript
// In development, process fewer items
const limit = process.env.NODE_ENV === 'development' ? 10 : 1000;
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Ollama Not Working
```bash
# Check if running
curl http://localhost:11434

# Start manually
ollama serve

# Check models
ollama list
```

### TypeScript Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## VS Code Setup

### Recommended Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag"
  ]
}
```

### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

1. ✅ Environment is set up
2. 📖 Read [Architecture Overview](../02-architecture/)
3. 🏗️ Check [Implementation Guides](../04-implementation/)
4. 🧪 Run the test suite
5. 🚀 Start building!

---

Having issues? Check [Troubleshooting](../09-troubleshooting/) or ask in [Discord](https://discord.gg/finishthisidea).