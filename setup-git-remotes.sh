#!/bin/bash

echo "🔥 SETTING UP GIT REMOTES - OSS/Private Separation"
echo "=================================================="
echo ""

# Get user input for remotes
echo "📋 Setting up git remotes for OSS/private separation..."
echo ""

# Check if we have any existing remotes
EXISTING_REMOTES=$(git remote -v)
if [ -n "$EXISTING_REMOTES" ]; then
    echo "📍 Existing remotes found:"
    echo "$EXISTING_REMOTES"
    echo ""
fi

# Set up GitHub remote for OSS release
echo "🌐 Setting up GitHub remote for OSS release..."
read -p "Enter GitHub repo URL for OSS release (e.g., https://github.com/user/document-generator-oss.git): " OSS_REMOTE

if [ -n "$OSS_REMOTE" ]; then
    git remote add oss-github "$OSS_REMOTE" 2>/dev/null || git remote set-url oss-github "$OSS_REMOTE"
    echo "✅ OSS GitHub remote added: $OSS_REMOTE"
else
    echo "⚠️  No OSS remote provided - you can add later with:"
    echo "   git remote add oss-github https://github.com/user/document-generator-oss.git"
fi

# Set up private remote for user data
echo ""
echo "🔒 Setting up private remote for user data..."
read -p "Enter private repo URL (e.g., https://github.com/user/document-generator-private.git): " PRIVATE_REMOTE

if [ -n "$PRIVATE_REMOTE" ]; then
    git remote add private-repo "$PRIVATE_REMOTE" 2>/dev/null || git remote set-url private-repo "$PRIVATE_REMOTE"
    echo "✅ Private remote added: $PRIVATE_REMOTE"
else
    echo "⚠️  No private remote provided - you can add later with:"
    echo "   git remote add private-repo https://github.com/user/document-generator-private.git"
fi

# Set up production remote if different
echo ""
echo "🚀 Setting up production remote (optional)..."
read -p "Enter production remote URL (leave blank if same as private): " PROD_REMOTE

if [ -n "$PROD_REMOTE" ]; then
    git remote add production "$PROD_REMOTE" 2>/dev/null || git remote set-url production "$PROD_REMOTE"
    echo "✅ Production remote added: $PROD_REMOTE"
fi

echo ""
echo "📝 Current remotes:"
git remote -v

echo ""
echo "🔧 Creating enhanced deployment scripts..."

# Enhanced OSS deployment
cat > deploy-oss-github.sh << 'EOF'
#!/bin/bash
echo "🌐 Deploying to GitHub (OSS Release)"
echo "==================================="

# Switch to OSS branch
git checkout oss-release

# Copy only OSS components
echo "📦 Copying OSS components..."
rm -rf oss-release-temp
mkdir oss-release-temp
cd oss-release-temp

# Copy core OSS files
cp -r ../oss-components .
cp -r ../symlinks .
cp ../flask-backend/Dockerfile ../flask-backend/requirements.txt ../flask-backend/app.py .
cp ../docker-compose.yml .
cp ../package.json .
cp ../README.md .
cp ../LICENSE .
cp ../.gitignore.oss .gitignore

# Create OSS-specific README
cat > README.md << 'OSSEOF'
# 🔥 Document Generator - Open Source

**Transform any document into a working MVP using AI agents and containerized processing.**

## ✨ Features

- **🤖 AI Agent Processing**: kisuke, conductor, tunnel, vibevault agents
- **📦 Containerized**: Docker/Flask backend with data isolation
- **🔒 Privacy First**: User data never touches OSS components
- **💰 Payment Attribution**: Track big tech data usage for user compensation
- **🔗 Template System**: Symlinked agent-based processing

## 🚀 Quick Start

```bash
# Clone and start
git clone [this-repo]
cd document-generator
./start-development.sh
```

## 🏗️ Architecture

```
User Document → Flask API → OSS Agents → Template Matching → MVP Output
    ↓              ↓            ↓             ↓              ↓
 Isolated      Bridge API   kisuke/      Agent-based    Generated
Container                  conductor/   Processing     Application
                          tunnel/
                          vibevault
```

## 🔧 Development

- `./start-development.sh` - Full dev environment
- `./start-production.sh` - Production containers
- `docker-compose up` - All services

## 📋 OSS Components

- **Agent Processing**: AI-powered document analysis
- **Template System**: Reusable MVP templates
- **Container Orchestration**: Docker-based deployment
- **API Layer**: Flask backend for processing

## 🔒 Data Privacy

This OSS release contains **NO USER DATA**. All user documents and personal information are processed in isolated containers that are NOT part of this public repository.

## 💰 Big Tech Data Attribution

When users' data is accessed by big tech services, this system tracks and attributes that usage so users can be compensated for their data.

## 📄 License

MIT License - See LICENSE file

---

🤖 **Agents**: kisuke (analysis) • conductor (orchestration) • tunnel (pipelines) • vibevault (patterns)
OSSEOF

# Remove any private references
sed -i '' 's/private-components\///g' docker-compose.yml 2>/dev/null || true
grep -v "user_uploads\|user_processing\|user_outputs\|private-" docker-compose.yml > docker-compose-clean.yml 2>/dev/null || true
mv docker-compose-clean.yml docker-compose.yml 2>/dev/null || true

# Add all OSS files
git add .

# Commit OSS release
git commit -m "OSS Release: Document Generator with Agent Processing

- AI agents: kisuke, conductor, tunnel, vibevault
- Containerized Flask backend
- Template system with symlinks
- Data isolation and privacy protection
- Payment attribution for big tech data usage

🌐 Public release - no user data included"

cd ..
rm -rf oss-release-temp

echo "✅ OSS branch prepared"

if git remote get-url oss-github >/dev/null 2>&1; then
    echo "🚀 Pushing to GitHub..."
    git push oss-github oss-release
    echo "✅ OSS release deployed to GitHub!"
    echo "🔗 Public repo updated"
else
    echo "⚠️  No GitHub remote configured"
    echo "📋 To push manually: git push [remote] oss-release"
fi

git checkout main
EOF

# Enhanced private deployment
cat > deploy-private-secure.sh << 'EOF'
#!/bin/bash
echo "🔒 Deploying Private Components"
echo "=============================="

# Switch to private branch
git checkout private-data

# Copy private components
echo "📦 Copying private components..."
cp -r private-components/* . 2>/dev/null || true
cp -r flask-backend .
cp docker-compose.yml docker-compose.private.yml

# Add private configurations
cat >> docker-compose.private.yml << 'PRIVATEEOF'

  # Private user data volumes (NEVER in OSS)
volumes:
  user_uploads:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${PWD}/private-components/user-data/uploads
  user_processing:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${PWD}/private-components/user-data/processing
  user_outputs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${PWD}/private-components/user-data/outputs

networks:
  # Private network for user data
  user-data:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.20.0.0/16
PRIVATEEOF

# Commit private components
git add .
git commit -m "Private: User data protection and payment tracking

- Session isolation
- Payment attribution
- Private user data volumes
- Secure container networking

🔒 PRIVATE - Contains user data handling"

echo "✅ Private branch prepared"

if git remote get-url private-repo >/dev/null 2>&1; then
    echo "🚀 Pushing to private remote..."
    git push private-repo private-data
    echo "✅ Private components deployed!"
else
    echo "⚠️  No private remote configured"
    echo "📋 To push manually: git push [private-remote] private-data"
fi

git checkout main
EOF

chmod +x deploy-oss-github.sh deploy-private-secure.sh

echo ""
echo "🎯 REMOTE SETUP COMPLETE"
echo "========================"
echo ""
echo "📁 Git structure:"
echo "   main         → development branch"
echo "   oss-release  → public GitHub release"
echo "   private-data → secure user data"
echo ""
echo "🔗 Remotes configured:"
git remote -v
echo ""
echo "🚀 Deployment commands:"
echo "   ./deploy-oss-github.sh    → Deploy to public GitHub"
echo "   ./deploy-private-secure.sh → Deploy private components"
echo "   ./start-development.sh     → Local development"
echo "   ./start-production.sh      → Production containers"
echo ""
echo "📋 Next steps:"
echo "   1. Test: ./start-development.sh"
echo "   2. Deploy OSS: ./deploy-oss-github.sh"
echo "   3. Deploy private: ./deploy-private-secure.sh"
echo ""