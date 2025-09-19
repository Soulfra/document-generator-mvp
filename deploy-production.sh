#!/bin/bash

# PRODUCTION DEPLOYMENT SCRIPT
# Deploy the Document Generator to production

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 DOCUMENT GENERATOR DEPLOYMENT${NC}"
echo -e "${BLUE}================================${NC}"
echo

# Check if services are running and healthy
echo -e "${YELLOW}Checking system health...${NC}"
if ! ./quick-verify.sh > /dev/null 2>&1; then
    echo -e "${RED}❌ System verification failed!${NC}"
    echo "Run ./quick-verify.sh to see issues"
    exit 1
fi
echo -e "${GREEN}✅ System verified and working${NC}"

# Select deployment target
echo
echo -e "${YELLOW}Select deployment target:${NC}"
echo "1) Railway (Recommended for quick deploy)"
echo "2) Docker Hub + Cloud Provider"
echo "3) Direct server deployment"
echo "4) Create deployment package only"
echo
read -p "Choice (1-4): " DEPLOY_TARGET

case $DEPLOY_TARGET in
    1)
        echo -e "\n${BLUE}Deploying to Railway...${NC}"
        
        # Check for Railway CLI
        if ! command -v railway &> /dev/null; then
            echo -e "${YELLOW}Installing Railway CLI...${NC}"
            npm install -g @railway/cli
        fi
        
        # Create railway.toml if not exists
        if [ ! -f railway.toml ]; then
            cat > railway.toml << EOF
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"

[deploy]
numReplicas = 1
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "gateway"
port = 4444

[[services]]
name = "bridge"  
port = 3333
EOF
        fi
        
        # Create minimal Dockerfile
        cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy essential files only
COPY empire-document-bridge.js .
COPY unified-empire-gateway.js .
COPY empire-system-manager.sh .
COPY index.html .
COPY real-*.html .
COPY test-real-functionality.js .
COPY quick-verify.sh .

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 3333 4444

# Start services
CMD ["sh", "-c", "./empire-system-manager.sh start && tail -f logs/*.log"]
EOF
        
        echo -e "${YELLOW}Logging in to Railway...${NC}"
        railway login
        
        echo -e "${YELLOW}Initializing Railway project...${NC}"
        railway init
        
        echo -e "${YELLOW}Setting environment variables...${NC}"
        railway variables set NODE_ENV=production
        railway variables set POSTGRES_HOST=\${{RAILWAY_POSTGRES_HOST}}
        railway variables set POSTGRES_DB=\${{RAILWAY_POSTGRES_DATABASE}}
        railway variables set POSTGRES_USER=\${{RAILWAY_POSTGRES_USER}}
        railway variables set POSTGRES_PASSWORD=\${{RAILWAY_POSTGRES_PASSWORD}}
        railway variables set REDIS_URL=\${{RAILWAY_REDIS_URL}}
        
        echo -e "${YELLOW}Deploying to Railway...${NC}"
        railway up
        
        echo -e "${GREEN}✅ Deployed to Railway!${NC}"
        echo -e "${BLUE}Run 'railway open' to view your deployment${NC}"
        ;;
        
    2)
        echo -e "\n${BLUE}Building Docker image...${NC}"
        
        # Create production Dockerfile
        cat > Dockerfile.production << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application files
COPY . .

# Remove development files
RUN rm -rf test-*.js *.test.js archive/

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 3333 4444

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:4444/api/health || exit 1

# Start services
CMD ["sh", "-c", "./empire-system-manager.sh start && tail -f logs/*.log"]
EOF
        
        echo -e "${YELLOW}Building Docker image...${NC}"
        docker build -f Dockerfile.production -t document-generator:latest .
        
        echo -e "${YELLOW}Tagging for Docker Hub...${NC}"
        read -p "Docker Hub username: " DOCKER_USER
        docker tag document-generator:latest $DOCKER_USER/document-generator:latest
        
        echo -e "${YELLOW}Pushing to Docker Hub...${NC}"
        docker push $DOCKER_USER/document-generator:latest
        
        echo -e "${GREEN}✅ Docker image pushed!${NC}"
        echo
        echo "Deploy with:"
        echo -e "${BLUE}docker run -d \\"
        echo "  -p 4444:4444 -p 3333:3333 \\"
        echo "  -e DATABASE_URL=your_postgres_url \\"
        echo "  -e REDIS_URL=your_redis_url \\"
        echo "  $DOCKER_USER/document-generator:latest${NC}"
        ;;
        
    3)
        echo -e "\n${BLUE}Creating deployment package...${NC}"
        
        # Create deployment directory
        DEPLOY_DIR="document-generator-deploy-$(date +%Y%m%d-%H%M%S)"
        mkdir -p $DEPLOY_DIR
        
        # Copy essential files
        cp package*.json $DEPLOY_DIR/
        cp empire-document-bridge.js $DEPLOY_DIR/
        cp unified-empire-gateway.js $DEPLOY_DIR/
        cp empire-system-manager.sh $DEPLOY_DIR/
        cp quick-verify.sh $DEPLOY_DIR/
        cp index.html $DEPLOY_DIR/
        cp real-*.html $DEPLOY_DIR/
        cp docker-compose.yml $DEPLOY_DIR/
        
        # Create setup script
        cat > $DEPLOY_DIR/setup-production.sh << 'EOF'
#!/bin/bash
echo "Setting up Document Generator..."

# Install dependencies
npm ci --production

# Create directories
mkdir -p logs

# Create systemd service
sudo tee /etc/systemd/system/document-generator.service << EOL
[Unit]
Description=Document Generator Platform
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/empire-system-manager.sh start
ExecStop=$(pwd)/empire-system-manager.sh stop
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOL

# Enable service
sudo systemctl enable document-generator
sudo systemctl start document-generator

echo "✅ Setup complete! Check status with: sudo systemctl status document-generator"
EOF
        
        chmod +x $DEPLOY_DIR/setup-production.sh
        
        # Create deployment archive
        tar -czf $DEPLOY_DIR.tar.gz $DEPLOY_DIR
        
        echo -e "${GREEN}✅ Deployment package created: $DEPLOY_DIR.tar.gz${NC}"
        echo
        echo "To deploy:"
        echo "1. Copy to server: scp $DEPLOY_DIR.tar.gz user@server:~/"
        echo "2. Extract: tar -xzf $DEPLOY_DIR.tar.gz"
        echo "3. Run: cd $DEPLOY_DIR && ./setup-production.sh"
        ;;
        
    4)
        echo -e "\n${BLUE}Creating minimal deployment package...${NC}"
        
        PACKAGE_DIR="production-package"
        rm -rf $PACKAGE_DIR
        mkdir -p $PACKAGE_DIR
        
        # Copy only essential files
        cp package.json $PACKAGE_DIR/
        cp package-lock.json $PACKAGE_DIR/ 2>/dev/null || true
        cp empire-document-bridge.js $PACKAGE_DIR/
        cp unified-empire-gateway.js $PACKAGE_DIR/
        cp empire-system-manager.sh $PACKAGE_DIR/
        cp index.html $PACKAGE_DIR/
        cp real-*.html $PACKAGE_DIR/
        
        # Create minimal package.json
        cat > $PACKAGE_DIR/package.json << 'EOF'
{
  "name": "document-generator-production",
  "version": "1.0.0",
  "description": "Document to MVP Generator Platform",
  "scripts": {
    "start": "./empire-system-manager.sh start",
    "stop": "./empire-system-manager.sh stop",
    "status": "./empire-system-manager.sh status"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
        
        # Create README
        cat > $PACKAGE_DIR/README.md << EOF
# Document Generator - Production Package

## Quick Start
\`\`\`bash
npm install
npm start
\`\`\`

## Access
- Dashboard: http://localhost:4444
- API: http://localhost:4444/api/health

## Environment Variables
- DATABASE_URL: PostgreSQL connection string
- REDIS_URL: Redis connection string
- NODE_ENV: production
EOF
        
        echo -e "${GREEN}✅ Production package ready in: $PACKAGE_DIR/${NC}"
        echo -e "${YELLOW}Total size: $(du -sh $PACKAGE_DIR | cut -f1)${NC}"
        ;;
esac

echo
echo -e "${GREEN}🎉 Deployment preparation complete!${NC}"
echo
echo -e "${YELLOW}Post-deployment checklist:${NC}"
echo "1. Test all endpoints"
echo "2. Monitor logs for errors"
echo "3. Set up SSL/HTTPS"
echo "4. Configure domain name"
echo "5. Enable backups"
echo "6. Share with users!"