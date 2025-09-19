#!/bin/bash

# launch-master.sh - Master launcher for Document Generator
# Detects environment and launches appropriate configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art Header
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    🚀 DOCUMENT GENERATOR - MASTER LAUNCHER 🚀                ║
║                                                               ║
║    Transform documents into MVPs in under 30 minutes          ║
║    Powered by AI, protected by Cerberus                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Default settings
LAUNCH_MODE=""
SKIP_CHECKS=false
VERBOSE=false
PRICING_CONFIRMED=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --docker)
            LAUNCH_MODE="docker"
            shift
            ;;
        --electron)
            LAUNCH_MODE="electron"
            shift
            ;;
        --dev)
            LAUNCH_MODE="dev"
            shift
            ;;
        --cloud)
            LAUNCH_MODE="cloud"
            shift
            ;;
        --existing)
            LAUNCH_MODE="existing"
            shift
            ;;
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --accept-pricing)
            PRICING_CONFIRMED=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --existing       Connect to existing COBOL infrastructure"
            echo "  --docker         Launch using Docker Compose"
            echo "  --electron       Launch as Electron desktop app"
            echo "  --dev            Launch in development mode"
            echo "  --cloud          Deploy to cloud services"
            echo "  --skip-checks    Skip dependency checks"
            echo "  --accept-pricing Auto-accept pricing confirmation"
            echo "  --verbose        Show detailed output"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check dependencies
check_dependencies() {
    echo -e "${YELLOW}🔍 Checking dependencies...${NC}"
    
    local missing_deps=()
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js")
    else
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
    fi
    
    # Check npm/yarn
    if ! command_exists npm && ! command_exists yarn; then
        missing_deps+=("npm or yarn")
    else
        if command_exists npm; then
            NPM_VERSION=$(npm -v)
            echo -e "${GREEN}✓ npm ${NPM_VERSION}${NC}"
        fi
    fi
    
    # Check Docker (optional)
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        echo -e "${GREEN}✓ Docker ${DOCKER_VERSION}${NC}"
        
        if command_exists docker-compose; then
            COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | tr -d ',')
            echo -e "${GREEN}✓ Docker Compose ${COMPOSE_VERSION}${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Docker not found (optional)${NC}"
    fi
    
    # Check Redis (optional)
    if command_exists redis-cli; then
        echo -e "${GREEN}✓ Redis installed${NC}"
    else
        echo -e "${YELLOW}⚠ Redis not found (will use Docker)${NC}"
    fi
    
    # Check for required files
    if [ ! -f "package.json" ]; then
        missing_deps+=("package.json")
    fi
    
    # Report missing dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "${RED}   - $dep${NC}"
        done
        echo ""
        echo "Please install missing dependencies and try again."
        exit 1
    fi
    
    echo -e "${GREEN}✅ All required dependencies found!${NC}"
    echo ""
}

# Function to detect best launch mode
detect_launch_mode() {
    if [ -n "$LAUNCH_MODE" ]; then
        return
    fi
    
    echo -e "${YELLOW}🤖 Auto-detecting best launch mode...${NC}"
    
    # Check if existing infrastructure is running
    if curl -s http://localhost:3003/health >/dev/null 2>&1 || curl -s http://localhost:9999 >/dev/null 2>&1; then
        LAUNCH_MODE="existing"
        echo -e "${GREEN}✓ Existing COBOL infrastructure detected${NC}"
        echo -e "${BLUE}  Found running services - connecting to monolithic system${NC}"
    # Check if Docker is available and docker-compose.yml exists
    elif command_exists docker && [ -f "docker-compose.yml" ]; then
        LAUNCH_MODE="docker"
        echo -e "${GREEN}✓ Docker environment detected${NC}"
    # Check if Electron is configured
    elif [ -f "electron-main.js" ] && grep -q "electron" package.json 2>/dev/null; then
        LAUNCH_MODE="electron"
        echo -e "${GREEN}✓ Electron configuration detected${NC}"
    # Default to development mode
    else
        LAUNCH_MODE="dev"
        echo -e "${GREEN}✓ Using development mode${NC}"
    fi
    
    echo ""
}

# Function to confirm pricing
confirm_pricing() {
    if [ "$PRICING_CONFIRMED" = true ]; then
        return
    fi
    
    echo -e "${YELLOW}💰 PRICING INFORMATION${NC}"
    echo ""
    echo "Document Generator uses AI services that may incur costs:"
    echo ""
    echo "  📊 Free Tier:"
    echo "     - Ollama (local): Unlimited"
    echo "     - Basic templates: Unlimited"
    echo "     - API calls: 60/hour"
    echo ""
    echo "  💎 Premium Services (optional):"
    echo "     - OpenAI GPT-4: ~$0.03/1K tokens"
    echo "     - Anthropic Claude: ~$0.015/1K tokens"
    echo "     - Advanced templates: Pay-per-use"
    echo ""
    echo "The system will use free local AI (Ollama) by default."
    echo "You can add API keys later for premium features."
    echo ""
    
    read -p "Do you accept these terms? (yes/no): " -n 3 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${RED}❌ Pricing not accepted. Exiting...${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Pricing accepted!${NC}"
    echo ""
}

# Function to setup environment
setup_environment() {
    echo -e "${YELLOW}🔧 Setting up environment...${NC}"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            echo "Creating .env from .env.example..."
            cp .env.example .env
            echo -e "${GREEN}✓ Created .env file${NC}"
        else
            echo -e "${YELLOW}⚠ No .env file found, creating default...${NC}"
            cat > .env << EOL
# Document Generator Environment Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/document_generator

# Redis
REDIS_URL=redis://localhost:6379

# AI Services (optional - system works without these)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Security
JWT_SECRET=$(openssl rand -base64 32)
API_KEY_HEADER=x-api-key

# Rate Limiting
DEFAULT_RATE_LIMIT=60
RATE_LIMIT_WINDOW=60000

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOL
            echo -e "${GREEN}✓ Created default .env file${NC}"
        fi
    fi
    
    # Create necessary directories
    mkdir -p uploads logs temp .deployments
    
    echo -e "${GREEN}✅ Environment ready!${NC}"
    echo ""
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    if [ -f "package-lock.json" ]; then
        npm ci --production
    else
        npm install --production
    fi
    
    echo -e "${GREEN}✅ Dependencies installed!${NC}"
    echo ""
}

# Function to launch with Docker
launch_docker() {
    echo -e "${BLUE}🐳 Launching with Docker...${NC}"
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo "Please start Docker and try again."
        exit 1
    fi
    
    # Pull/build images
    echo "Building Docker images..."
    docker-compose build
    
    # Start services
    echo "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 5
    
    # Check health
    if docker-compose ps | grep -q "unhealthy"; then
        echo -e "${RED}⚠️  Some services are unhealthy${NC}"
        docker-compose ps
    else
        echo -e "${GREEN}✅ All services are running!${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🚀 Document Generator is running!${NC}"
    echo ""
    echo "  📊 Main Interface: http://localhost:8080"
    echo "  🔧 API Dashboard: http://localhost:3000"
    echo "  📈 Monitoring: http://localhost:3002"
    echo ""
    echo "To stop: docker-compose down"
}

# Function to connect to existing infrastructure
launch_existing_infrastructure() {
    echo -e "${BLUE}🔗 Connecting to existing COBOL infrastructure...${NC}"
    
    # Start the infrastructure connector
    echo "Starting infrastructure connector..."
    node existing-infrastructure-connector.js &
    CONNECTOR_PID=$!
    
    # Wait for it to initialize
    echo -e "${YELLOW}⏳ Waiting for connector to initialize...${NC}"
    sleep 3
    
    # Check if connector is running
    if kill -0 $CONNECTOR_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Infrastructure connector started successfully!${NC}"
        
        # Test the health endpoint
        if curl -s http://localhost:3010/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ API endpoint accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  API endpoint not yet ready (may take a moment)${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🚀 Connected to existing COBOL system!${NC}"
        echo ""
        echo "  🧠 COBOL Bridge: http://localhost:3003"
        echo "  🌐 Web Interface: http://localhost:8080"
        echo "  🎛️  Master Controller: http://localhost:9999"
        echo "  🔗 Connector API: http://localhost:3010"
        echo ""
        echo "  📊 Health Check: http://localhost:3010/health"
        echo "  📋 Status Report: http://localhost:3010/status"
        echo ""
        echo "To process a document:"
        echo "  curl -X POST http://localhost:3010/process -H 'Content-Type: application/json' -d '{\"filePath\": \"./test-document.md\"}'"
        echo ""
        echo "Press Ctrl+C to disconnect"
        
    else
        echo -e "${RED}❌ Failed to start infrastructure connector${NC}"
        exit 1
    fi
}

# Function to launch with Electron
launch_electron() {
    echo -e "${BLUE}🖥️  Launching Electron app...${NC}"
    
    # Check if Electron is installed
    if ! npm list electron >/dev/null 2>&1; then
        echo "Installing Electron..."
        npm install --save-dev electron
    fi
    
    # Start background services
    echo "Starting background services..."
    
    # Start Redis if not running
    if ! command_exists redis-cli || ! redis-cli ping >/dev/null 2>&1; then
        if command_exists docker; then
            echo "Starting Redis in Docker..."
            docker run -d --name document-generator-redis -p 6379:6379 redis:alpine
        else
            echo -e "${YELLOW}⚠ Redis not running, some features may be limited${NC}"
        fi
    fi
    
    # Start the Electron app
    if [ -f "electron-main.js" ]; then
        npm run electron
    else
        echo -e "${RED}❌ electron-main.js not found${NC}"
        echo "Creating basic Electron wrapper..."
        node create-electron-wrapper.js
        npm run electron
    fi
}

# Function to launch in development mode
launch_dev() {
    echo -e "${BLUE}🛠️  Launching in development mode...${NC}"
    
    # Install dev dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing all dependencies..."
        npm install
    fi
    
    # Start services with pm2 or directly
    if command_exists pm2; then
        echo "Using PM2 for process management..."
        pm2 start ecosystem.config.js
        pm2 logs
    else
        echo "Starting services directly..."
        
        # Start main server
        echo -e "${YELLOW}Starting main server...${NC}"
        npm start &
        
        # Wait for server to start
        sleep 3
        
        echo ""
        echo -e "${GREEN}🚀 Document Generator is running in dev mode!${NC}"
        echo ""
        echo "  📊 Interface: http://localhost:3000"
        echo "  📚 API Docs: http://localhost:3000/docs"
        echo ""
        echo "Press Ctrl+C to stop"
        
        # Keep script running
        wait
    fi
}

# Function to deploy to cloud
launch_cloud() {
    echo -e "${BLUE}☁️  Deploying to cloud...${NC}"
    
    # Detect cloud platform
    if [ -f "vercel.json" ]; then
        echo "Deploying to Vercel..."
        npx vercel --prod
    elif [ -f "netlify.toml" ]; then
        echo "Deploying to Netlify..."
        npx netlify deploy --prod
    elif [ -f "app.yaml" ]; then
        echo "Deploying to Google Cloud..."
        gcloud app deploy
    elif [ -f "Procfile" ]; then
        echo "Deploying to Heroku..."
        git push heroku main
    else
        echo -e "${YELLOW}No cloud configuration detected.${NC}"
        echo "Creating Railway deployment..."
        npx @railway/cli up
    fi
}

# Function to show post-launch instructions
show_instructions() {
    echo ""
    echo -e "${BLUE}📚 QUICK START GUIDE${NC}"
    echo ""
    echo "1. Upload a document:"
    echo "   - Click 'Upload Document' or drag & drop"
    echo "   - Supports: PDF, Word, Markdown, Text"
    echo ""
    echo "2. Choose a template:"
    echo "   - SaaS Application"
    echo "   - E-commerce Platform"
    echo "   - Mobile App"
    echo "   - Custom (AI-generated)"
    echo ""
    echo "3. Generate MVP:"
    echo "   - Review AI suggestions"
    echo "   - Customize as needed"
    echo "   - Click 'Generate MVP'"
    echo ""
    echo "4. Deploy:"
    echo "   - Download source code"
    echo "   - One-click deploy options"
    echo "   - Docker/Kubernetes ready"
    echo ""
    echo -e "${YELLOW}🔑 API Keys (optional):${NC}"
    echo "   Add to .env for premium features:"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo ""
    echo -e "${GREEN}Need help? Check ./docs or visit https://github.com/yourusername/document-generator${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}🚀 Starting Document Generator...${NC}"
    echo ""
    
    # Check dependencies unless skipped
    if [ "$SKIP_CHECKS" = false ]; then
        check_dependencies
    fi
    
    # Detect launch mode
    detect_launch_mode
    
    # Confirm pricing
    confirm_pricing
    
    # Setup environment
    setup_environment
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        install_dependencies
    fi
    
    # Launch based on mode
    case $LAUNCH_MODE in
        existing)
            launch_existing_infrastructure
            ;;
        docker)
            launch_docker
            ;;
        electron)
            launch_electron
            ;;
        cloud)
            launch_cloud
            ;;
        dev|*)
            launch_dev
            ;;
    esac
    
    # Show instructions
    show_instructions
}

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}Shutting down...${NC}"; exit 0' INT TERM

# Run main function
main

# Keep script running for logs
if [ "$LAUNCH_MODE" != "cloud" ]; then
    tail -f /dev/null
fi