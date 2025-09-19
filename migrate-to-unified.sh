#!/bin/bash

# Migration script to transition to unified docker-compose configuration

echo "🔄 Migrating to Unified Docker Compose Configuration"
echo "===================================================="

# Check if old services are running
echo "📋 Checking current services..."
docker-compose ps

# Stop old services if running
echo "🛑 Stopping current services..."
docker-compose down

# Backup old docker-compose.yml
echo "💾 Backing up old docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup

# Create symlink to new unified config
echo "🔗 Creating symlink to unified configuration..."
ln -sf docker-compose.unified.yml docker-compose.yml

# Pull required images
echo "📦 Pulling required Docker images..."
docker-compose pull

# Create required directories
echo "📁 Creating required directories..."
mkdir -p services/{websocket,api-gateway,analytics,camel,stripe,agent-clan}
mkdir -p monitoring/{prometheus,grafana/{dashboards,datasources}}
mkdir -p nginx/ssl

# Create placeholder Dockerfiles for missing services
echo "📄 Creating placeholder Dockerfiles..."

# WebSocket Dockerfile
cat > services/websocket/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8081
CMD ["node", "index.js"]
EOF

# API Gateway Dockerfile
cat > services/api-gateway/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "index.js"]
EOF

# Analytics Dockerfile
cat > services/analytics/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3333
CMD ["node", "index.js"]
EOF

# CAMEL Dockerfile
cat > services/camel/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3450
CMD ["node", "index.js"]
EOF

# Stripe Dockerfile
cat > services/stripe/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 9494
CMD ["node", "index.js"]
EOF

# Agent Clan Dockerfile
cat > services/agent-clan/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3456
CMD ["node", "index.js"]
EOF

# Create main Dockerfiles
echo "📄 Creating main service Dockerfiles..."

# Casino Dockerfile
cat > Dockerfile.casino << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY ai-agent-crypto-casino-reasoning-differential.js .
EXPOSE 9707
CMD ["node", "ai-agent-crypto-casino-reasoning-differential.js"]
EOF

# Economy Dockerfile
cat > Dockerfile.economy << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY unified-token-liquidity-gacha-economy.js .
EXPOSE 9495
CMD ["node", "unified-token-liquidity-gacha-economy.js"]
EOF

# Guardian Dockerfile
cat > Dockerfile.guardian << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY guardian-teacher-system.js .
COPY teacher-guided-agent-system.js .
EXPOSE 9999
CMD ["node", "teacher-guided-agent-system.js"]
EOF

# Battle Dockerfile
cat > Dockerfile.battle << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY ai-agent-battle-arena.js .
EXPOSE 8888
CMD ["node", "ai-agent-battle-arena.js"]
EOF

# Launcher Dockerfile
cat > Dockerfile.launcher << 'EOF'
FROM node:18-alpine
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY ONE-BUTTON.html .
COPY one-button-launcher.js .
EXPOSE 7777
CMD ["node", "one-button-launcher.js"]
EOF

# Check environment variables
echo "🔐 Checking environment variables..."
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "📝 Please edit .env and add your API keys"
    else
        echo "❌ No .env.example found. Please create .env with required variables"
    fi
fi

# Validate configuration
echo "✅ Validating service configuration..."
node -e "
const services = require('./config/services.js');
const conflicts = services.checkPortConflicts();
if (conflicts.length > 0) {
    console.error('❌ Port conflicts detected:', conflicts);
    process.exit(1);
} else {
    console.log('✅ No port conflicts detected');
}
"

echo ""
echo "🎉 Migration prepared!"
echo ""
echo "Next steps:"
echo "1. Review the new docker-compose.yml configuration"
echo "2. Ensure all required API keys are in .env"
echo "3. Run: docker-compose up -d"
echo "4. Monitor services: docker-compose logs -f"
echo ""
echo "Service URLs:"
echo "- Unified API: http://localhost:4000"
echo "- Platform Hub: http://localhost:8080"
echo "- Analytics Dashboard: http://localhost:3333"
echo "- One Button Launcher: http://localhost:7777"
echo "- AI Casino: http://localhost:9707"
echo "- Guardian Teacher: http://localhost:9999"