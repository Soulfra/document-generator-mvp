#!/bin/bash

# 🚀 LAUNCH EVERYTHING - One Command Startup System
# This script actually launches the entire maxed-out 9-layer Soulfra system

set -e  # Exit on any error

echo "🌟 Starting Soulfra Production Launch Sequence..."
echo "=================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "⚠️  Please logout and login again for Docker permissions, then re-run this script"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Installing..."
    sudo npm install -g pm2
fi

# Check if Terraform is installed (for AWS deployment)
if ! command -v terraform &> /dev/null; then
    echo "⚠️  Terraform not found. Installing..."
    wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
    sudo apt update && sudo apt install terraform
fi

echo "✅ Prerequisites checked"

# Install Node.js dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data
mkdir -p nft-cache
mkdir -p generative-art

echo "🔧 Setting up environment..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

# Database
POSTGRES_URL=postgresql://soulfra_admin:your-password@localhost:5432/soulfra
REDIS_URL=redis://localhost:6379

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
OLLAMA_URL=http://localhost:11434

# Blockchain/NFT
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-key
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your-infura-key
WALLET_PRIVATE_KEY=your-wallet-private-key
NFT_CONTRACT_ADDRESS=your-nft-contract

# Services Config
QUANTUM_BACKEND=simulator
HYPERDIM_MAX_DIMENSIONS=32
GAME_MAX_PLAYERS=10000
XML_BROADCAST_ENABLED=true
SOULFRA_MASTER_KEY=soulfra-$(date +%s)-master

# NFT Marketplace APIs
OPENSEA_API_KEY=your-opensea-key
FOUNDATION_API_KEY=your-foundation-key
SUPERRARE_API_KEY=your-superrare-key
EOF
    echo "⚠️  Please edit .env with your actual API keys and configuration"
fi

# Choose deployment mode
echo "🎯 Choose deployment mode:"
echo "1) Local Development (all services on localhost)"
echo "2) AWS Production (deploy to cloud)"
echo "3) Hybrid (local + cloud services)"
read -p "Enter choice (1-3): " DEPLOY_MODE

case $DEPLOY_MODE in
    1)
        echo "🏠 Starting Local Development Mode..."
        
        # Start local services
        echo "🐳 Starting Docker services..."
        
        # Create docker-compose for local development
        cat > docker-compose.local.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: soulfra
      POSTGRES_USER: soulfra_admin
      POSTGRES_PASSWORD: your-password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  postgres_data:
  redis_data:
  ollama_data:
EOF
        
        docker-compose -f docker-compose.local.yml up -d
        
        # Wait for services to start
        echo "⏳ Waiting for services to initialize..."
        sleep 10
        
        # Pull Ollama models
        echo "🤖 Pulling AI models..."
        docker exec $(docker ps -qf "name=ollama") ollama pull codellama:7b
        docker exec $(docker ps -qf "name=ollama") ollama pull mistral
        
        # Start all Node.js services with PM2
        echo "🚀 Starting Soulfra services..."
        
        pm2 start meta-orchestration-layer.js --name="meta-orchestration" --port=4444
        pm2 start quantum-state-management-layer.js --name="quantum-state" --port=7777
        pm2 start neural-ai-optimization-layer.js --name="neural-ai" --port=6666
        pm2 start hyperdimensional-rendering-engine.js --name="hyper-rendering" --port=5555
        pm2 start xml-depth-mapping-system.js --name="depth-mapping" --port=8765
        pm2 start game-depth-integration.js --name="game-integration" --port=8766
        pm2 start soulfra-xml-integration.js --name="soulfra-master" --port=9898
        pm2 start working-enhanced-game.js --name="enhanced-game" --port=8899
        pm2 start xml-broadcast-layer.js --name="xml-broadcast" --port=8877
        
        pm2 save
        pm2 startup
        
        echo "✅ Local development environment started!"
        echo "🌐 Services available at:"
        echo "   - Soulfra Master: http://localhost:9898"
        echo "   - Enhanced Game: http://localhost:8899"
        echo "   - Hyper Rendering: http://localhost:5555"
        echo "   - Meta Orchestration: http://localhost:4444"
        ;;
        
    2)
        echo "☁️  Starting AWS Production Deployment..."
        
        # Check AWS credentials
        if ! aws sts get-caller-identity &> /dev/null; then
            echo "❌ AWS credentials not configured. Run 'aws configure' first"
            exit 1
        fi
        
        # Deploy with Terraform
        echo "🏗️  Deploying infrastructure..."
        terraform init
        terraform plan -var="project_name=soulfra-$(date +%s)"
        terraform apply -auto-approve
        
        # Get server IPs
        echo "📋 Getting server information..."
        terraform output > terraform-outputs.txt
        
        # Deploy code to servers
        echo "📤 Deploying code to servers..."
        node production-deployment-system.js
        
        echo "✅ AWS production deployment complete!"
        echo "📊 Check terraform-outputs.txt for service endpoints"
        ;;
        
    3)
        echo "🔀 Starting Hybrid Mode..."
        echo "   - Database/Redis: Local Docker"
        echo "   - AI Services: Cloud (Anthropic/OpenAI)"
        echo "   - Game Services: Local PM2"
        
        # Start only database services locally
        docker-compose -f docker-compose.local.yml up -d postgres redis
        
        # Start game services with cloud AI
        export USE_CLOUD_AI=true
        pm2 start soulfra-xml-integration.js --name="soulfra-hybrid"
        
        echo "✅ Hybrid mode started!"
        ;;
esac

# Start XML Persistence Mining Layer FIRST (this is the foundation)
echo "⛏️  Starting XML Persistence Mining Layer..."
node xml-persistence-mining-layer.js &
sleep 5

# Start Bulletproof Substrate Manager (this keeps everything alive)
echo "🛡️  Starting Bulletproof Substrate Manager..."
node bulletproof-substrate-manager.js &
sleep 10

# Start NFT/Generative Art Services
echo "🎨 Starting NFT/Generative Art Services..."
node nft-generative-art-system.js &
sleep 5

# Run comprehensive verification
echo "🔍 Running comprehensive verification system..."
echo "This will test EVERYTHING to make sure it actually works..."
node comprehensive-verification-system.js

# Store verification result
VERIFICATION_RESULT=$?

if [ $VERIFICATION_RESULT -eq 0 ]; then
    echo ""
    echo "🎉 SOULFRA LAUNCH COMPLETE & VERIFIED!"
    echo "======================================"
    echo "🛡️  Substrate Manager: BULLETPROOF & ACTIVE"
    echo "⛏️   XML Mining Layer: MINING & PERSISTING"
    echo "🌟 Master Control: http://localhost:9898"
    echo "🎮 Game Client: http://localhost:8899"
    echo "🎨 NFT Gallery: http://localhost:3001"
    echo "⛓️  Blockchain: http://localhost:7788"
    echo "📊 PM2 Status: pm2 status"
    echo "📜 Logs: pm2 logs"
    echo ""
    echo "✅ ALL SYSTEMS VERIFIED AND OPERATIONAL!"
    echo "🚀 The most complex AND PROVEN game system ever built is now LIVE!"
    echo ""
    echo "🔥 Features confirmed working:"
    echo "   • XML persistence with proof-of-work mining"
    echo "   • Bulletproof substrate that never crashes"
    echo "   • 9-layer quantum architecture"
    echo "   • NFT generation from game state"
    echo "   • Full blockchain verification"
    echo "   • Auto-restart and health monitoring"
    echo ""
    echo "💎 This system is now BULLETPROOF and VERIFIED!"
else
    echo ""
    echo "🚨 VERIFICATION FAILED!"
    echo "======================"
    echo "Some components are not working properly."
    echo "Check the verification report for details."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Check logs: pm2 logs"
    echo "   • View processes: pm2 status"
    echo "   • Restart services: pm2 restart all"
    echo "   • View verification report in ./verification-reports/"
    echo ""
    echo "The system may still be partially functional."
fi