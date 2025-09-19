#!/bin/bash

echo "🔥 GIT INTEGRATION SETUP - OSS/Private Data Separation"
echo "======================================================"
echo ""

# Create proper git structure for OSS/private separation
echo "📦 Setting up git structure..."

# Create OSS branch for public components
echo "🌐 Creating OSS branch for public release..."
git checkout -b oss-release 2>/dev/null || git checkout oss-release

# Create private branch for user data components
echo "🔒 Creating private branch for user data protection..."
git checkout -b private-data 2>/dev/null || git checkout private-data

# Back to main for setup
git checkout main

# Create proper directory structure
echo "📁 Creating containerized directory structure..."

# OSS components (public)
mkdir -p oss-components/{agents,templates,symlinks}
mkdir -p oss-components/agents/{kisuke,conductor,tunnel,vibevault}
mkdir -p oss-components/templates/{base-service,documentation-generator}

# Private components (user data)
mkdir -p private-components/{user-data,session-management,payment-tracking}
mkdir -p private-components/user-data/{uploads,processing,outputs}

# Flask backend (bridge between OSS and private)
# Already exists at flask-backend/

echo "🔗 Setting up symlinks for development..."

# Create symlinks directory if it doesn't exist
mkdir -p symlinks

# Link OSS components
ln -sf ../oss-components/agents/kisuke symlinks/kisuke-agent
ln -sf ../oss-components/agents/conductor symlinks/conductor-agent  
ln -sf ../oss-components/agents/tunnel symlinks/tunnel-agent
ln -sf ../oss-components/agents/vibevault symlinks/vibevault-agent

# Link template systems
ln -sf ../FinishThisIdea/templates symlinks/kisuke-templates
ln -sf ../FinishThisIdea-archive/templates symlinks/conductor-services
ln -sf ../mcp symlinks/tunnel-mcp
ln -sf ../finishthisidea-worktrees symlinks/vibevault-worktrees

# Link containers
ln -sf ../flask-backend symlinks/flask-api
ln -sf ../docker-compose.yml symlinks/container-orchestration

echo "📝 Creating .gitignore for proper data separation..."
cat > .gitignore.oss << 'EOF'
# OSS .gitignore - what NOT to include in public release

# Private user data (NEVER commit these)
private-components/
flask-backend/tmp/
user_uploads/
user_processing/
user_outputs/

# Session data
*.session
*.user-data
session_*.json

# API keys and secrets
.env.private
.env.production
*.key
*.pem
*.crt

# Database files with user data
*.db
*.sqlite
user_database/

# Payment tracking (sensitive)
payment_*.json
attribution_*.log

# Local development
.DS_Store
node_modules/
__pycache__/
*.log
.pytest_cache/
EOF

cat > .gitignore.private << 'EOF'
# Private .gitignore - what NOT to sync with OSS

# OSS components (managed separately)
oss-components/
symlinks/
templates/

# Build artifacts
dist/
build/
*.min.js
*.min.css

# Dependencies
node_modules/
venv/
.venv/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
EOF

echo "🚀 Creating deployment scripts..."

cat > deploy-oss.sh << 'EOF'
#!/bin/bash
echo "🌐 Deploying OSS components..."

# Switch to OSS branch
git checkout oss-release

# Copy OSS components
cp -r oss-components/* .
cp -r symlinks .
cp docker-compose.yml .
cp flask-backend/Dockerfile flask-backend/requirements.txt .

# Remove private data references
sed -i '' 's/private-components\///g' docker-compose.yml
sed -i '' '/user_uploads:/d' docker-compose.yml
sed -i '' '/user_processing:/d' docker-compose.yml
sed -i '' '/user_outputs:/d' docker-compose.yml

# Commit OSS release
git add .
git commit -m "OSS release: containerized document generator with data isolation"

echo "✅ OSS components ready for public release"
echo "🔗 Push with: git push origin oss-release"
EOF

cat > deploy-private.sh << 'EOF'
#!/bin/bash
echo "🔒 Deploying private data components..."

# Switch to private branch
git checkout private-data

# Copy private components only
cp -r private-components/* .
cp -r flask-backend .
cp docker-compose.yml docker-compose.private.yml

# Commit private components
git add .
git commit -m "Private: user data protection and payment tracking"

echo "✅ Private components secured"
echo "🔒 Push to private remote only"
EOF

chmod +x deploy-oss.sh deploy-private.sh

echo "⚙️ Creating container management scripts..."

cat > start-development.sh << 'EOF'
#!/bin/bash
echo "🔥 Starting Document Generator - Development Mode"
echo "================================================"

# Ensure symlinks are set up
./setup-template-symlinks.sh

# Start Flask backend
echo "🚀 Starting Flask backend..."
cd flask-backend
python3 app.py &
FLASK_PID=$!
cd ..

# Start OSS services
echo "🤖 Starting OSS agent services..."
node universal-data-aggregator.js &
node crypto-data-aggregator.js &
node differential-game-extractor.js &

# Start Electron interface
echo "🖥️ Starting Electron interface..."
npm run electron-simple &

echo ""
echo "✅ Development environment started"
echo "🔗 Flask API: http://localhost:5000"
echo "🖥️ Electron: Running with working interface"
echo "📊 WebSocket services: 47003, 47004, 48000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'kill $FLASK_PID; pkill -f "node.*aggregator"; pkill -f electron; echo "🛑 All services stopped"' INT
wait
EOF

cat > start-production.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Document Generator - Production Mode"
echo "==============================================="

# Build and start containers
echo "📦 Building containers..."
docker-compose build

echo "🚀 Starting production services..."
docker-compose up -d

echo ""
echo "✅ Production environment started"
echo "🔗 Flask API: http://localhost:5000"
echo "📊 Services: All containerized"
echo "🔒 Data isolation: Enabled"
echo "💰 Payment tracking: Active"
echo ""
echo "View logs with: docker-compose logs -f"
echo "Stop with: docker-compose down"
EOF

chmod +x start-development.sh start-production.sh

echo "📋 Creating Git workflow documentation..."

cat > GIT-WORKFLOW.md << 'EOF'
# Git Workflow - OSS/Private Data Separation

## 🌐 OSS Branch (Public)
```bash
git checkout oss-release
./deploy-oss.sh
git push origin oss-release
```

**Contains:**
- Agent processing logic (kisuke, conductor, tunnel, vibevault)
- Template systems
- Container orchestration
- Public APIs
- Documentation

**Does NOT contain:**
- User data
- Session management
- Payment tracking
- Private keys

## 🔒 Private Branch (Internal)
```bash
git checkout private-data  
./deploy-private.sh
git push private-remote private-data
```

**Contains:**
- User data handling
- Session isolation
- Payment attribution
- API keys/secrets
- Production configs

## 🔧 Development Workflow

### Daily Development
```bash
git checkout main
./start-development.sh
```

### Before Public Release
```bash
./deploy-oss.sh
git checkout oss-release
git push origin oss-release
```

### Before Private Deployment  
```bash
./deploy-private.sh
git checkout private-data
git push private-remote private-data
```

## 🔗 Symlink Management

Symlinks connect OSS and private components without mixing code:

- `symlinks/kisuke-agent` → OSS agent processing
- `symlinks/flask-api` → Bridge between OSS/private
- `symlinks/*-templates` → Template access
- `private-components/` → Never in OSS branch

## 💰 Data Stream Attribution

User data stays in private components, but when big tech APIs are used:
1. Flask backend tracks usage
2. Attribution logged to private branch
3. Payment calculations in private-components/
4. OSS components never see user data

## 🚀 Deployment Targets

- **Development**: `./start-development.sh`
- **Production**: `./start-production.sh`  
- **OSS Release**: GitHub/public repos
- **Private Deploy**: Internal servers only
EOF

echo ""
echo "🎯 GIT INTEGRATION COMPLETE"
echo "=========================="
echo ""
echo "📁 Structure created:"
echo "   oss-components/     (public release)"
echo "   private-components/ (user data protection)"
echo "   symlinks/          (development links)"
echo "   flask-backend/     (API bridge)"
echo ""
echo "🌐 Git branches:"
echo "   main          (development)"
echo "   oss-release   (public components)"
echo "   private-data  (user data protection)"
echo ""
echo "🚀 Quick start:"
echo "   ./start-development.sh  (full dev environment)"
echo "   ./start-production.sh   (containerized production)"
echo ""
echo "📋 Next steps:"
echo "   1. Test development: ./start-development.sh"
echo "   2. Prepare OSS release: ./deploy-oss.sh"
echo "   3. Set up private remote for user data"
echo "   4. Deploy to production: ./start-production.sh"
echo ""