# 🚀 Document Generator - Complete Quick Start Guide

Transform any document into a working MVP in under 30 minutes using AI.

## 📋 Table of Contents
- [One-Command Launch](#-one-command-launch)
- [Installation Options](FinishThisIdea/docs/INSTALLATION.md)
- [First Run Setup](FinishThisIdea-Complete/SETUP.md)
- [Basic Usage](#-basic-usage)
- [Advanced Features](#-advanced-features)
- [Troubleshooting](#-troubleshooting)
- [Next Steps](#-next-steps)

---

## 🎯 One-Command Launch

Get started instantly with our master launcher:

```bash
# Download and launch (Unix/Mac)
curl -fsSL https://raw.githubusercontent.com/documentgenerator/app/main/install.sh | bash

# Or clone and run
git clone https://github.com/documentgenerator/document-generator.git
cd document-generator
./launch-master.sh
```

**Windows users:**
```powershell
# Using PowerShell
iwr -useb https://raw.githubusercontent.com/documentgenerator/app/main/install.ps1 | iex

# Or download and run launch-master.bat
```

The launcher will:
- ✅ Check your system dependencies
- ✅ Confirm pricing (free tier available)
- ✅ Setup environment automatically
- ✅ Start all services
- ✅ Open your browser to the interface

---

## 📦 Installation Options

### Option 1: Docker (Recommended)
**Requirements:** Docker Desktop

```bash
./launch-master.sh --docker
```

**Pros:**
- ✅ Zero dependency management
- ✅ Isolated environment
- ✅ Same behavior everywhere
- ✅ Includes all services (AI, database, monitoring)

**Cons:**
- ❌ Requires Docker (2GB+ download)
- ❌ Slower startup time

### Option 2: Native Installation
**Requirements:** Node.js 16+, npm

```bash
./launch-master.sh --dev
```

**Pros:**
- ✅ Faster startup
- ✅ Direct file access
- ✅ Easy debugging

**Cons:**
- ❌ Need to install dependencies
- ❌ Platform-specific issues

### Option 3: Desktop App (Electron)
**Requirements:** None (self-contained)

```bash
# Build desktop app
npm run build:electron

# Or download pre-built installer
# Windows: DocumentGenerator-Setup-1.0.0.exe
# Mac: DocumentGenerator-1.0.0.dmg
# Linux: DocumentGenerator-1.0.0.AppImage
```

**Pros:**
- ✅ No technical setup required
- ✅ Native OS integration
- ✅ Auto-updates
- ✅ Offline capable

**Cons:**
- ❌ Larger download size
- ❌ Limited customization

### Option 4: Cloud Deployment
Deploy to your cloud provider:

```bash
# Vercel
./launch-master.sh --cloud --provider vercel

# Railway
./launch-master.sh --cloud --provider railway

# Google Cloud
./launch-master.sh --cloud --provider gcp

# AWS
./launch-master.sh --cloud --provider aws
```

---

## 🔧 First Run Setup

### 1. System Verification
Run the system verifier to ensure everything is working:

```bash
node verify-complete-system.js
```

**Expected output:**
```
✅ Dependencies: PASSED (100%)
✅ Configuration: PASSED (90%)
✅ Services: PASSED (85%)
✅ Security: PASSED (95%)
✅ Performance: PASSED (80%)
✅ Integration: PASSED (75%)

Overall Status: GOOD (87%)
```

### 2. Initial Configuration

#### Environment Variables (.env)
The launcher creates a `.env` file automatically. You can customize:

```env
# Basic Configuration
NODE_ENV=production
PORT=3000

# AI Services (Optional - Free tier uses local Ollama)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Database (Auto-configured for Docker)
DATABASE_URL=postgresql://postgres:password@localhost:5432/document_generator

# Security
JWT_SECRET=your_random_secret_here
DEFAULT_RATE_LIMIT=60

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,md
```

#### API Keys Setup (Optional)

**Free Tier:** Uses local Ollama AI (no keys needed)

**Premium Features:** Add API keys for advanced AI models:

1. **OpenAI (GPT-4)**
   - Go to https://platform.openai.com/api-keys
   - Create new API key
   - Add to `.env`: `OPENAI_API_KEY=sk-...`

2. **Anthropic (Claude)**
   - Go to https://console.anthropic.com/
   - Create API key
   - Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

### 3. Pricing Confirmation

**Free Tier Includes:**
- ✅ Unlimited local AI processing (Ollama)
- ✅ Basic document templates
- ✅ API rate limit: 60 requests/hour
- ✅ File uploads up to 10MB
- ✅ Local data processing

**Premium Services (Pay-per-use):**
- 🔥 OpenAI GPT-4: ~$0.03/1K tokens
- 🔥 Anthropic Claude: ~$0.015/1K tokens
- 🔥 Advanced templates and features
- 🔥 Higher rate limits
- 🔥 Priority support

**The system defaults to free tier and only uses paid services if you add API keys.**

---

## 🎯 Basic Usage

### Step 1: Upload Your Document

**Supported formats:**
- 📄 PDF files
- 📝 Word documents (.doc, .docx)
- 📋 Markdown files (.md)
- 📄 Plain text files (.txt)
- 💬 Chat logs (WhatsApp, Slack exports)

**Upload methods:**
1. **Web Interface:** Drag & drop or click to select
2. **API:** `POST /api/documents` with file
3. **CLI:** `node upload-document.js path/to/file.pdf`

### Step 2: AI Analysis

The system analyzes your document and identifies:

- 📊 **Document Type:** Business plan, technical spec, product design, etc.
- 🎯 **Key Features:** User management, payments, dashboard, etc.
- 🏗️ **Architecture:** Recommended tech stack
- 💡 **Suggestions:** Implementation approach

**Example analysis result:**
```json
{
  "type": "saas_business_plan",
  "confidence": 0.95,
  "features": [
    "user_authentication",
    "subscription_billing",
    "admin_dashboard",
    "api_integration"
  ],
  "tech_stack": {
    "frontend": "React",
    "backend": "Node.js",
    "database": "PostgreSQL",
    "deployment": "Docker"
  },
  "mvp_readiness": 0.87
}
```

### Step 3: Select Template

Choose from available templates:

1. **🌐 Web Application**
   - React + Node.js + PostgreSQL
   - Authentication, dashboard, API
   - Deployment ready

2. **📱 Mobile App**
   - React Native + Express
   - Push notifications, offline sync
   - iOS/Android builds

3. **🔌 API Service**
   - Express + OpenAPI docs
   - Rate limiting, monitoring
   - Docker containerized

4. **🛍️ E-commerce Platform**
   - Next.js + Stripe
   - Product catalog, cart, checkout
   - Admin panel

5. **🎨 Custom Template**
   - AI generates from scratch
   - Based on document analysis
   - Unique to your needs

### Step 4: Generate MVP

Click **"Generate MVP"** and watch the magic happen:

```
🔍 Analyzing document...     ✅ Complete (2s)
🎯 Selecting template...     ✅ Complete (1s)
🏗️ Generating code...        ✅ Complete (15s)
🧪 Running tests...          ✅ Complete (8s)
📦 Packaging app...          ✅ Complete (4s)

🎉 MVP Generated Successfully!
```

### Step 5: Deploy Your MVP

Multiple deployment options:

**One-Click Deploy:**
- 🚀 **Vercel:** Perfect for Next.js apps
- 🚀 **Railway:** Great for full-stack apps
- 🚀 **Netlify:** Ideal for static sites
- 🚀 **Heroku:** Classic PaaS option

**Container Deploy:**
- 🐳 **Docker:** Included Dockerfile
- ☁️ **Google Cloud Run:** Serverless containers
- ☁️ **AWS ECS:** Container orchestration
- ☁️ **Azure Container Instances:** Simple containers

**Download & Self-Host:**
- 📁 Download complete source code
- 🔧 Run locally or on your servers
- 🔄 Full customization available

---

## 🚀 Advanced Features

### AI Service Configuration

**Local AI (Ollama):**
```bash
# Check available models
curl http://localhost:11434/api/tags

# Pull new models
docker exec document-generator-ollama ollama pull codellama:13b

# Use specific model
export DEFAULT_AI_MODEL=codellama:13b
```

**Custom Prompts:**
Create custom prompts in `/prompts/` directory:

```javascript
// prompts/my-custom-prompt.js
module.exports = {
  name: 'Custom Business Analysis',
  template: `
    Analyze this document and focus on:
    1. Business model viability
    2. Technical complexity assessment
    3. Market opportunity size
    4. Implementation timeline
    
    Document: {document}
  `,
  parameters: ['document'],
  type: 'business_analysis'
};
```

### Template Customization

**Create Custom Templates:**
```bash
# Create template directory
mkdir templates/my-template

# Template structure
templates/my-template/
├── template.json          # Configuration
├── files/                 # Template files
│   ├── package.json
│   ├── src/
│   └── public/
├── prompts/               # AI prompts
└── tests/                 # Template tests
```

**Template Configuration:**
```json
{
  "name": "My Custom Template",
  "description": "Custom template for XYZ apps",
  "tags": ["web", "api", "custom"],
  "tech_stack": {
    "frontend": "Svelte",
    "backend": "FastAPI",
    "database": "MongoDB"
  },
  "features": ["auth", "api", "dashboard"],
  "variables": {
    "app_name": "string",
    "database_url": "string",
    "api_version": "string"
  }
}
```

### API Integration

**RESTful API:**
```bash
# Upload document
curl -X POST http://localhost:3000/api/documents \
  -F "file=@document.pdf" \
  -H "Authorization: Bearer your-api-key"

# Get analysis
curl http://localhost:3000/api/documents/123/analysis \
  -H "Authorization: Bearer your-api-key"

# Generate MVP
curl -X POST http://localhost:3000/api/mvp/generate \
  -H "Content-Type: application/json" \
  -d '{"document_id": 123, "template": "web-app"}' \
  -H "Authorization: Bearer your-api-key"

# Check generation status
curl http://localhost:3000/api/mvp/status/456 \
  -H "Authorization: Bearer your-api-key"

# Download generated code
curl http://localhost:3000/api/mvp/download/456 \
  -H "Authorization: Bearer your-api-key" \
  -o mvp-code.zip
```

**WebSocket Real-time Updates:**
```javascript
const socket = new WebSocket('ws://localhost:8081');

socket.on('document_uploaded', (data) => {
  console.log('Document uploaded:', data);
});

socket.on('analysis_complete', (data) => {
  console.log('Analysis complete:', data.analysis);
});

socket.on('generation_progress', (data) => {
  console.log('Generation progress:', data.percentage + '%');
});

socket.on('mvp_complete', (data) => {
  console.log('MVP ready for download:', data.download_url);
});
```

### Monitoring & Analytics

**Access Monitoring Dashboard:**
```
📊 Real-time Dashboard: http://localhost:3002
🔧 API Health Check:   http://localhost:3000/health
🛡️ Security Monitor:   http://localhost:3003/status
```

**Key Metrics Tracked:**
- 📈 Request volume and success rates
- ⚡ Response times and performance
- 🛡️ Security threats blocked
- 🤖 AI model usage and costs
- 📊 User activity and popular features

**Custom Metrics:**
```javascript
// Add custom metric tracking
const metrics = require('./lib/metrics');

metrics.track('custom_event', {
  user_id: 'user123',
  action: 'template_selected',
  template: 'web-app',
  timestamp: Date.now()
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Docker daemon not running"
**Problem:** Docker Desktop not started
**Solution:**
```bash
# Mac/Windows: Start Docker Desktop app
# Linux:
sudo systemctl start docker
```

#### 2. "Port already in use"
**Problem:** Another service using port 3000/8080
**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 ./launch-master.sh
```

#### 3. "Node.js version too old"
**Problem:** Node.js < 16.x
**Solution:**
```bash
# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install latest Node.js
nvm install node
nvm use node
```

#### 4. "API key invalid"
**Problem:** Incorrect API key format
**Solution:**
```bash
# Check API key format
# OpenAI: sk-...
# Anthropic: sk-ant-...

# Test API key
curl -H "Authorization: Bearer sk-..." https://api.openai.com/v1/models
```

#### 5. "File upload failed"
**Problem:** File too large or unsupported format
**Solution:**
```bash
# Check file size (max 10MB by default)
ls -lh document.pdf

# Check supported formats
echo $ALLOWED_FILE_TYPES  # pdf,doc,docx,txt,md

# Increase limit in .env
MAX_FILE_SIZE=52428800  # 50MB
```

#### 6. "Generation stuck"
**Problem:** AI service not responding
**Solution:**
```bash
# Check service status
curl http://localhost:11434/api/tags  # Ollama
curl http://localhost:3000/health     # API

# Restart services
./launch-master.sh restart

# Check logs
./launch-docker-complete.sh logs
```

### Debug Mode

Enable verbose logging:
```bash
# Debug mode
DEBUG=* ./launch-master.sh --verbose

# Or set environment
export NODE_ENV=development
export DEBUG=document-generator:*
npm start
```

### System Diagnostics

**Run full system check:**
```bash
node verify-complete-system.js
```

**Check specific components:**
```bash
# Check dependencies
node -e "console.log('Node:', process.version)"
docker --version
redis-cli --version

# Check services
curl http://localhost:3000/health
curl http://localhost:11434/api/tags
redis-cli ping

# Check logs
tail -f logs/app.log
docker-compose logs -f
```

### Getting Help

**Community Support:**
- 💬 GitHub Discussions: [Ask questions](https://github.com/documentgenerator/app/discussions)
- 🐛 Bug Reports: [Report issues](INTEGRATION-ISSUES-SUMMARY.md)
- 📚 Documentation: [Full docs](https://docs.documentgenerator.com)

**Premium Support:**
- 🎫 Priority support tickets
- 📞 1-on-1 setup assistance
- 🔧 Custom template development
- 🚀 Enterprise deployment help

---

## 🎯 Next Steps

### 1. Explore Templates
Browse the template gallery to see what's possible:
```bash
curl http://localhost:3000/api/templates
```

### 2. Join the Community
- ⭐ Star the repository
- 🍴 Fork and contribute
- 💬 Join discussions
- 📢 Share your MVPs

### 3. Build Your First MVP
- 📄 Upload a business plan
- 🎯 Select a template
- 🚀 Deploy to the web
- 📈 Share your success story

### 4. Advanced Usage
- 🤖 Train custom AI models
- 🎨 Create custom templates
- 🔌 Build API integrations
- 📊 Set up analytics

### 5. Scale Up
- ☁️ Deploy to production
- 👥 Add team members
- 💳 Upgrade to premium features
- 🏢 Enterprise deployment

---

## 📚 Additional Resources

- 📖 **Full Documentation:** https://docs.documentgenerator.com
- 🎥 **Video Tutorials:** https://youtube.com/@documentgenerator
- 💬 **Community Discord:** https://discord.gg/documentgenerator
- 🐦 **Follow Updates:** https://twitter.com/docgenerator
- 📧 **Newsletter:** https://newsletter.documentgenerator.com

---

## ❤️ Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🎨 Create templates
- 🧪 Write tests
- 🔧 Fix issues

---

**Ready to transform your documents into MVPs? Let's get started! 🚀**

```bash
./launch-master.sh
```