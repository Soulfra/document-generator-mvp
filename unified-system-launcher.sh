#\!/bin/bash

# unified-system-launcher.sh - Complete Document Generator System Launcher
# Starts all systems in the correct order with health checks

echo "🚀 DOCUMENT GENERATOR UNIFIED SYSTEM LAUNCHER 🚀"
echo "Bringing together the complete ecosystem..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "⏳ Waiting for $name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✅ Ready\!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    echo -e " ${RED}❌ Timeout${NC}"
    return 1
}

# Create logs directory
mkdir -p logs

echo ""
echo "🔍 SYSTEM HEALTH CHECK"
echo "======================"

# Check Docker
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo -e "${GREEN}✅ Docker is running${NC}"
    DOCKER_OK=true
else
    echo -e "${YELLOW}⚠️ Docker not available - some services may not work${NC}"
    DOCKER_OK=false
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm packages
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ Package.json found${NC}"
else
    echo -e "${RED}❌ Package.json not found${NC}"
    exit 1
fi

echo ""
echo "🔐 STEP 1: CRYPTO KEY VAULT"
echo "============================"

# Start Crypto Key Vault
if check_port 8888; then
    echo -e "${GREEN}✅ Crypto vault already running on port 8888${NC}"
else
    echo "🔐 Starting crypto key vault..."
    node crypto-key-vault-layer.js > logs/crypto-vault.log 2>&1 &
    VAULT_PID=$\!
    echo "Vault PID: $VAULT_PID"
    
    if wait_for_service "http://localhost:8888/status" "Crypto Vault"; then
        echo -e "${GREEN}✅ Crypto vault ready with encrypted API keys${NC}"
    else
        echo -e "${RED}❌ Crypto vault failed to start${NC}"
        exit 1
    fi
fi

echo ""
echo "📊 STEP 2: CORE SERVICES"
echo "========================"

# Start Docker services if available
if [ "$DOCKER_OK" = true ]; then
    echo "🐳 Starting Docker services..."
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d postgres redis minio ollama > logs/docker.log 2>&1
        echo -e "${GREEN}✅ Docker services starting in background${NC}"
    else
        echo -e "${YELLOW}⚠️ No docker-compose.yml found${NC}"
    fi
fi

echo ""
echo "🤖 STEP 3: AI ORCHESTRATION"
echo "==========================="

# Start AI Reasoning Orchestrator if it exists
if [ -f "unified-system-integration.js" ]; then
    if check_port 9801; then
        echo -e "${GREEN}✅ AI orchestrator already running${NC}"
    else
        echo "🤖 Starting AI reasoning orchestrator..."
        node unified-system-integration.js > logs/ai-orchestrator.log 2>&1 &
        AI_PID=$\!
        echo "AI Orchestrator PID: $AI_PID"
        
        sleep 3
        if check_port 9801; then
            echo -e "${GREEN}✅ AI orchestrator ready${NC}"
        else
            echo -e "${YELLOW}⚠️ AI orchestrator may still be starting${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ AI orchestrator not found${NC}"
fi

echo ""
echo "📱 STEP 4: QR AUTHENTICATION"
echo "============================"

# QR Auth system (best effort)
if [ -f "FinishThisIdea/complete-auth-qr-server.js" ]; then
    if check_port 3001; then
        echo -e "${GREEN}✅ QR auth already running${NC}"
    else
        echo "📱 Starting QR authentication system..."
        NODE_ENV=development node FinishThisIdea/complete-auth-qr-server.js > logs/qr-auth.log 2>&1 &
        QR_PID=$\!
        echo "QR Auth PID: $QR_PID"
        
        sleep 3
        if check_port 3001; then
            echo -e "${GREEN}✅ QR authentication ready${NC}"
        else
            echo -e "${YELLOW}⚠️ QR auth may have dependency issues${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ QR auth system not found${NC}"
fi

echo ""
echo "🖥️ STEP 5: ELECTRON DESKTOP APP"
echo "==============================="

# Start Electron app (non-blocking)
if command -v electron &> /dev/null && [ -f "electron-main.js" ]; then
    echo "🖥️ Starting Electron desktop application..."
    electron electron-main.js > logs/electron.log 2>&1 &
    ELECTRON_PID=$\!
    echo "Electron PID: $ELECTRON_PID"
    echo -e "${GREEN}✅ Electron app starting (this opens a window)${NC}"
else
    echo -e "${YELLOW}⚠️ Electron not available${NC}"
fi

echo ""
echo "🌐 STEP 6: WEB SERVICES"
echo "======================"

# Start web services on different ports
services=(
    "3000:Template Processor (MCP)"
    "8080:Document Generator Platform"
    "3002:Analytics Service"
)

for service in "${services[@]}"; do
    port="${service%%:*}"
    name="${service#*:}"
    
    if check_port "$port"; then
        echo -e "${GREEN}✅ $name already running on port $port${NC}"
    else
        echo -e "${YELLOW}⚠️ $name not running on port $port${NC}"
    fi
done

echo ""
echo "📊 SYSTEM DASHBOARD"
echo "=================="

# Display system summary
echo "🔗 Active Services:"
echo "  🔐 Crypto Vault:     http://localhost:8888/status"
echo "  📱 QR Auth:          http://localhost:3001 (if running)"
echo "  🤖 AI Orchestrator:  http://localhost:9801 (if running)"
echo "  📄 Template Proc:    http://localhost:3000 (if running)"
echo "  🌐 Platform Hub:     http://localhost:8080 (if running)"
echo "  📊 Analytics:        http://localhost:3002 (if running)"

echo ""
echo "💻 Process IDs:"
[ \! -z "${VAULT_PID}" ] && echo "  Crypto Vault: $VAULT_PID"
[ \! -z "${AI_PID}" ] && echo "  AI Orchestrator: $AI_PID"
[ \! -z "${QR_PID}" ] && echo "  QR Auth: $QR_PID"
[ \! -z "${ELECTRON_PID}" ] && echo "  Electron: $ELECTRON_PID"

echo ""
echo "📁 Log Files:"
echo "  logs/crypto-vault.log  - Crypto vault logs"
echo "  logs/ai-orchestrator.log - AI orchestrator logs"
echo "  logs/qr-auth.log - QR authentication logs"
echo "  logs/electron.log - Electron app logs"
echo "  logs/docker.log - Docker services logs"

echo ""
echo "🎯 QUICK TESTS"
echo "============="

echo "Testing core services..."

# Test crypto vault
if curl -s "http://localhost:8888/status" > /dev/null; then
    VAULT_KEYS=$(curl -s "http://localhost:8888/status" | grep -o '"totalKeys":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ Crypto Vault: $VAULT_KEYS keys available${NC}"
else
    echo -e "${RED}❌ Crypto Vault: Not responding${NC}"
fi

# Test AI orchestrator
if curl -s "http://localhost:9801/api/status" > /dev/null; then
    echo -e "${GREEN}✅ AI Orchestrator: Responding${NC}"
else
    echo -e "${YELLOW}⚠️ AI Orchestrator: Not responding${NC}"
fi

echo ""
echo "🚀 SYSTEM READY\!"
echo "================"
echo "The Document Generator ecosystem is now running."
echo ""
echo "Next steps:"
echo "1. Open http://localhost:8888/status to verify the crypto vault"
echo "2. Check the Electron app window that should have opened"
echo "3. Upload a document to test the complete pipeline"
echo ""
echo "To stop all services, run:"
echo "  ./stop-all-services.sh"
echo ""
echo "To monitor logs:"
echo "  tail -f logs/*.log"
echo ""
echo "🎉 Happy document processing\!"
EOF < /dev/null