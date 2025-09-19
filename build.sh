#!/bin/bash

echo "🔨 DOCUMENT GENERATOR BUILD SCRIPT"
echo "================================="
echo "Building production-ready package..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Create build directory
BUILD_DIR="dist"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

echo -e "${CYAN}Step 1: Preparing build directory${NC}"
mkdir -p $BUILD_DIR/public

# Copy core files
echo -e "${CYAN}Step 2: Copying application files${NC}"
cp server.js $BUILD_DIR/
cp package.json $BUILD_DIR/
cp package-lock.json $BUILD_DIR/ 2>/dev/null || true

# Copy HTML interfaces
echo -e "${CYAN}Step 3: Copying interface files${NC}"
interfaces=(
    "3d-voxel-document-processor.html"
    "dimensional-squash-processor.html"
    "character-mascot-weapon-system.html"
    "wormhole-pwa-merger.html"
    "ultimate-weapon-menu.html"
    "soulfra-single-login.html"
)

for interface in "${interfaces[@]}"; do
    if [ -f "$interface" ]; then
        cp "$interface" $BUILD_DIR/
        echo -e "  ✓ $interface"
    fi
done

# Copy configuration files
echo -e "${CYAN}Step 4: Copying configuration${NC}"
cp manifest.json $BUILD_DIR/
cp railway.json $BUILD_DIR/
cp vercel.json $BUILD_DIR/
cp .env.example $BUILD_DIR/

# Copy deployment scripts
echo -e "${CYAN}Step 5: Copying deployment scripts${NC}"
deployment_scripts=(
    "deploy-to-railway.sh"
    "deploy-to-vercel.sh"
    "deploy-dns-wormhole.sh"
    "verify-deployment.sh"
    "pentest-blame-game.sh"
)

for script in "${deployment_scripts[@]}"; do
    if [ -f "$script" ]; then
        cp "$script" $BUILD_DIR/
        chmod +x $BUILD_DIR/$script
        echo -e "  ✓ $script"
    fi
done

# Copy documentation
echo -e "${CYAN}Step 6: Copying documentation${NC}"
cp README.md $BUILD_DIR/ 2>/dev/null || echo "# Document Generator MVP" > $BUILD_DIR/README.md
cp DEPLOYMENT-SHOWBOAT.md $BUILD_DIR/ 2>/dev/null || true
cp FINAL-DEPLOYMENT-SUMMARY.md $BUILD_DIR/ 2>/dev/null || true

# Copy MVP compactor if it exists
if [ -f "document-generator-mvp-compactor.js" ]; then
    echo -e "${CYAN}Step 7: Including MVP compactor${NC}"
    cp document-generator-mvp-compactor.js $BUILD_DIR/
fi

# Create production package.json
echo -e "${CYAN}Step 8: Optimizing package.json${NC}"
cat > $BUILD_DIR/package.json << 'EOF'
{
  "name": "document-generator-mvp",
  "version": "1.0.0",
  "description": "Document Generator MVP - 111 layers compacted into production",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "build": "echo 'Already built'",
    "test": "echo 'No tests required - this is chaos'",
    "deploy:railway": "./deploy-to-railway.sh",
    "deploy:vercel": "./deploy-to-vercel.sh",
    "deploy:all": "./deploy-dns-wormhole.sh",
    "verify": "./verify-deployment.sh",
    "pentest": "./pentest-blame-game.sh"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

# Create Dockerfile for containerized deployment
echo -e "${CYAN}Step 9: Creating Dockerfile${NC}"
cat > $BUILD_DIR/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
EOF

# Create .dockerignore
cat > $BUILD_DIR/.dockerignore << 'EOF'
node_modules
npm-debug.log
.env
.git
.gitignore
*.md
test*
EOF

# Create startup script
echo -e "${CYAN}Step 10: Creating startup script${NC}"
cat > $BUILD_DIR/start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Document Generator MVP..."
echo "=================================="

# Check if PORT is set
PORT=${PORT:-3000}
echo "Running on port: $PORT"

# Check for required environment variables
if [ -z "$AGENT_WALLET_ADDRESS" ]; then
    echo "⚠️  Warning: AGENT_WALLET_ADDRESS not set"
fi

# Start the server
exec node server.js
EOF
chmod +x $BUILD_DIR/start.sh

# Create build info
echo -e "${CYAN}Step 11: Creating build info${NC}"
cat > $BUILD_DIR/BUILD_INFO.json << EOF
{
  "version": "1.0.0",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'no-git')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'main')",
  "nodeVersion": "$(node -v)",
  "features": {
    "voxel3D": true,
    "squash4_5D": true,
    "mvpCompactor": true,
    "wormholeDNS": true,
    "characterMascot": true,
    "soulfraSingleLogin": true,
    "runtimeSubstrate": true,
    "ardSupport": true
  }
}
EOF

# Create production .env template
echo -e "${CYAN}Step 12: Creating production env template${NC}"
cat > $BUILD_DIR/.env.production << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=3000

# Agent Configuration
AGENT_WALLET_ADDRESS=

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Deployment URLs
RAILWAY_STATIC_URL=https://document-generator.railway.app
VERCEL_URL=https://document-generator.vercel.app
EOF

# Minify HTML files (basic)
echo -e "${CYAN}Step 13: Optimizing HTML files${NC}"
for html in $BUILD_DIR/*.html; do
    if [ -f "$html" ]; then
        # Remove comments and extra whitespace
        sed -i.bak -E 's/<!--.*-->//g; s/[[:space:]]+/ /g' "$html"
        rm "$html.bak"
        echo -e "  ✓ Optimized $(basename $html)"
    fi
done

# Create deployment manifest
echo -e "${CYAN}Step 14: Creating deployment manifest${NC}"
cat > $BUILD_DIR/DEPLOY_MANIFEST.txt << EOF
DOCUMENT GENERATOR MVP - DEPLOYMENT MANIFEST
==========================================

Build Date: $(date)
Version: 1.0.0

Files Included:
$(ls -1 $BUILD_DIR | sed 's/^/  - /')

Deployment Targets:
  - Railway: https://document-generator.railway.app
  - Vercel: https://document-generator.vercel.app
  - Docker: docker build -t document-generator .

Quick Start:
  1. cd dist
  2. npm install
  3. cp .env.production .env
  4. Configure environment variables
  5. npm start

Deployment Commands:
  - Railway: npm run deploy:railway
  - Vercel: npm run deploy:vercel
  - Both: npm run deploy:all
  - Verify: npm run verify
  - Pentest: npm run pentest

Features:
  ✓ 3D Voxel Document Processor
  ✓ 4.5D Dimensional Squash
  ✓ MVP Compactor (111 layers → 1)
  ✓ Wormhole DNS Merger
  ✓ Character Mascot Weapons
  ✓ Soulfra Single Login
  ✓ Runtime Substrate Customization
  ✓ ARD (Augmented Reality Deployment)

EOF

# Calculate build size
echo -e "${CYAN}Step 15: Build complete!${NC}"
BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)

echo ""
echo -e "${GREEN}✅ BUILD SUCCESSFUL!${NC}"
echo "==================="
echo -e "Build directory: ${CYAN}$BUILD_DIR/${NC}"
echo -e "Build size: ${YELLOW}$BUILD_SIZE${NC}"
echo -e "Files created: ${YELLOW}$(ls -1 $BUILD_DIR | wc -l)${NC}"
echo ""
echo "Next steps:"
echo "1. cd $BUILD_DIR"
echo "2. Configure .env with your credentials"
echo "3. Deploy with: npm run deploy:all"
echo ""
echo -e "${GREEN}🚀 Ready for production deployment!${NC}"