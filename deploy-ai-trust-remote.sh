#!/bin/bash

echo "🚀 AI TRUST SYSTEM - REMOTE DEPLOYMENT PACKAGE"
echo "============================================="
echo ""
echo "This script will package and deploy the AI Trust System for remote viewing"
echo ""

# Configuration
REMOTE_HOST=${1:-"your-server.com"}
REMOTE_USER=${2:-"root"}
REMOTE_PORT=${3:-"22"}
REMOTE_PATH=${4:-"/var/www/ai-trust"}
PACKAGE_NAME="ai-trust-system-$(date +%Y%m%d-%H%M%S).tar.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 STEP 1: Creating deployment package${NC}"
echo "----------------------------------------"

# Create temporary deployment directory
DEPLOY_DIR="ai-trust-deployment"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy core files
echo "Copying core trust system files..."
cp anonymous-ai-handshake-trust-system.js $DEPLOY_DIR/
cp real-time-ai-logic-viewer.html $DEPLOY_DIR/
cp ai-trust-visual-proof.html $DEPLOY_DIR/
cp test-ai-trust-proof.html $DEPLOY_DIR/
cp electron-ai-trust-integration.js $DEPLOY_DIR/ 2>/dev/null || true
cp trust-preload.js $DEPLOY_DIR/ 2>/dev/null || true

# Copy Chrome extension
echo "Copying Chrome extension..."
cp -r ai-trust-chrome-extension $DEPLOY_DIR/

# Create package.json for deployment
cat > $DEPLOY_DIR/package.json << 'EOF'
{
  "name": "ai-trust-system-remote",
  "version": "1.0.0",
  "description": "Anonymous AI Handshake Trust System - Remote Deployment",
  "main": "anonymous-ai-handshake-trust-system.js",
  "scripts": {
    "start": "node anonymous-ai-handshake-trust-system.js",
    "start:pm2": "pm2 start ecosystem.config.js",
    "stop:pm2": "pm2 stop ai-trust-system",
    "logs": "pm2 logs ai-trust-system",
    "monitor": "pm2 monit"
  },
  "dependencies": {
    "sqlite3": "^5.1.7",
    "ws": "^8.18.0"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF

# Create PM2 ecosystem file for process management
cat > $DEPLOY_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ai-trust-system',
    script: './anonymous-ai-handshake-trust-system.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 6666,
      WS_PORT: 6667
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create nginx configuration
cat > $DEPLOY_DIR/nginx-ai-trust.conf << 'EOF'
# AI Trust System Nginx Configuration
server {
    listen 80;
    server_name _;  # Replace with your domain
    
    # Main dashboard
    location / {
        root /var/www/ai-trust;
        index ai-trust-visual-proof.html;
        try_files $uri $uri/ =404;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:6666/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:6667;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# SSL configuration (uncomment and modify for HTTPS)
# server {
#     listen 443 ssl;
#     server_name your-domain.com;
#     
#     ssl_certificate /path/to/cert.pem;
#     ssl_certificate_key /path/to/key.pem;
#     
#     # ... same location blocks as above ...
# }
EOF

# Create modified HTML files for remote access
echo "Creating remote-ready HTML files..."

# Modify visual proof for remote
sed 's|http://localhost:6666|/api|g' ai-trust-visual-proof.html > $DEPLOY_DIR/ai-trust-visual-proof-remote.html
sed -i '' 's|ws://localhost:6667|ws://"+window.location.host+"/ws|g' $DEPLOY_DIR/ai-trust-visual-proof-remote.html 2>/dev/null || true

# Create setup script for remote server
cat > $DEPLOY_DIR/setup-remote.sh << 'EOF'
#!/bin/bash

echo "🔧 Setting up AI Trust System on remote server..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Start with PM2
echo "Starting AI Trust System with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup nginx if installed
if command -v nginx &> /dev/null; then
    echo "Setting up Nginx configuration..."
    sudo cp nginx-ai-trust.conf /etc/nginx/sites-available/ai-trust
    sudo ln -sf /etc/nginx/sites-available/ai-trust /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configured"
else
    echo "⚠️  Nginx not found - please install nginx for web access"
fi

echo "✅ Setup complete!"
echo ""
echo "Access your AI Trust System at:"
echo "  http://your-server-ip/"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check process status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart ai-trust-system - Restart service"
EOF

chmod +x $DEPLOY_DIR/setup-remote.sh

# Create Docker option
cat > $DEPLOY_DIR/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 6666 6667

# Start the application
CMD ["node", "anonymous-ai-handshake-trust-system.js"]
EOF

# Create docker-compose
cat > $DEPLOY_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  ai-trust:
    build: .
    container_name: ai-trust-system
    ports:
      - "6666:6666"
      - "6667:6667"
    volumes:
      - ./logs:/app/logs
      - ./trust-handshake.db:/app/trust-handshake.db
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    container_name: ai-trust-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx-docker.conf:/etc/nginx/conf.d/default.conf
      - ./:/usr/share/nginx/html
    depends_on:
      - ai-trust
    restart: unless-stopped
EOF

# Create nginx config for Docker
cat > $DEPLOY_DIR/nginx-docker.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index ai-trust-visual-proof.html;
    }
    
    location /api/ {
        proxy_pass http://ai-trust:6666/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://ai-trust:6667;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

echo -e "${GREEN}✅ Deployment package created${NC}"

echo ""
echo -e "${BLUE}📦 STEP 2: Creating compressed package${NC}"
echo "----------------------------------------"

# Create tarball
tar -czf $PACKAGE_NAME $DEPLOY_DIR
echo -e "${GREEN}✅ Package created: $PACKAGE_NAME${NC}"

echo ""
echo -e "${YELLOW}📤 DEPLOYMENT OPTIONS:${NC}"
echo ""
echo "1. 🖥️  MANUAL DEPLOYMENT:"
echo "   scp $PACKAGE_NAME $REMOTE_USER@$REMOTE_HOST:~/"
echo "   ssh $REMOTE_USER@$REMOTE_HOST"
echo "   tar -xzf $PACKAGE_NAME"
echo "   cd $DEPLOY_DIR"
echo "   ./setup-remote.sh"
echo ""
echo "2. 🐳 DOCKER DEPLOYMENT:"
echo "   scp $PACKAGE_NAME $REMOTE_USER@$REMOTE_HOST:~/"
echo "   ssh $REMOTE_USER@$REMOTE_HOST"
echo "   tar -xzf $PACKAGE_NAME"
echo "   cd $DEPLOY_DIR"
echo "   docker-compose up -d"
echo ""
echo "3. 🚀 ONE-LINE DEPLOYMENT:"
echo "   scp $PACKAGE_NAME $REMOTE_USER@$REMOTE_HOST:~/ && \\"
echo "   ssh $REMOTE_USER@$REMOTE_HOST 'tar -xzf $PACKAGE_NAME && cd $DEPLOY_DIR && ./setup-remote.sh'"
echo ""
echo "4. 🌐 QUICK LOCAL TEST:"
echo "   cd $DEPLOY_DIR"
echo "   npm install"
echo "   npm start"
echo ""
echo -e "${GREEN}Package ready for deployment!${NC}"