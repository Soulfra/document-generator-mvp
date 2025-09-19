#!/bin/bash

# Complete Document Generator System Startup
# Integrates AI, Vault, Auth, and Document Processing

echo "🚀 Starting Complete Document Generator System"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check if a service is running
check_service() {
    local name=$1
    local url=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not running${NC}"
        return 1
    fi
}

# Function to start a service
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local check_url=$4
    
    echo -e "${YELLOW}Starting $name on port $port...${NC}"
    
    # Start in background
    eval "$command" &
    local pid=$!
    
    # Wait for service to be ready
    local count=0
    while [ $count -lt 30 ]; do
        if curl -s "$check_url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name started (PID: $pid)${NC}"
            echo $pid > ".${name}_pid"
            return 0
        fi
        sleep 1
        ((count++))
    done
    
    echo -e "${RED}❌ Failed to start $name${NC}"
    return 1
}

# Check prerequisites
echo -e "\n${BLUE}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama is not installed${NC}"
    echo "   Install from: https://ollama.ai"
    exit 1
fi
echo -e "${GREEN}✅ Ollama installed${NC}"

# Create necessary directories
echo -e "\n${BLUE}Creating directories...${NC}"
mkdir -p data uploads logs .vault/keys
echo -e "${GREEN}✅ Directories created${NC}"

# Start Ollama if not running
echo -e "\n${BLUE}Checking Ollama service...${NC}"
if ! check_service "Ollama" "http://localhost:11434/api/tags"; then
    echo -e "${YELLOW}Starting Ollama...${NC}"
    ollama serve > logs/ollama.log 2>&1 &
    echo $! > .ollama_pid
    sleep 5
    
    if check_service "Ollama" "http://localhost:11434/api/tags"; then
        echo -e "${GREEN}✅ Ollama started${NC}"
    else
        echo -e "${RED}❌ Failed to start Ollama${NC}"
        echo "   Check logs/ollama.log for details"
        exit 1
    fi
fi

# Install Ollama models if needed
echo -e "\n${BLUE}Checking Ollama models...${NC}"
MODELS=$(curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "")
if [ -z "$MODELS" ]; then
    echo -e "${YELLOW}No models found. Installing required models...${NC}"
    if [ -f "scripts/install-ollama-models.sh" ]; then
        bash scripts/install-ollama-models.sh
    else
        echo -e "${YELLOW}Pulling essential model...${NC}"
        ollama pull mistral:7b
    fi
else
    echo -e "${GREEN}✅ Found $(echo "$MODELS" | wc -l) Ollama models${NC}"
fi

# Start Crypto Vault
echo -e "\n${BLUE}Starting services...${NC}"
if ! check_service "Crypto Vault" "http://localhost:8888/health"; then
    if [ -f "crypto-key-vault-layer.js" ]; then
        start_service "crypto-vault" "node crypto-key-vault-layer.js" 8888 "http://localhost:8888/health"
    else
        echo -e "${YELLOW}⚠️ Crypto vault not found (optional)${NC}"
    fi
fi

# Start AI Service
if ! check_service "AI Service" "http://localhost:3001/health"; then
    start_service "ai-service" "node start-ai-services.js" 3001 "http://localhost:3001/health"
fi

# Start Document Generator (if exists)
if [ -f "server.js" ] && ! check_service "Document Generator" "http://localhost:8080/health"; then
    start_service "docgen-server" "node server.js" 8080 "http://localhost:8080/health"
elif [ -f "FinishThisIdea/server.js" ] && ! check_service "Document Generator" "http://localhost:8080/health"; then
    start_service "docgen-server" "node FinishThisIdea/server.js" 8080 "http://localhost:8080/health"
fi

# Wait a moment for services to stabilize
sleep 2

# Service Status
echo -e "\n${BLUE}Service Status:${NC}"
echo "========================"

# Check all services
SERVICES=(
    "Ollama|http://localhost:11434/api/tags"
    "AI Service|http://localhost:3001/health"
    "Crypto Vault|http://localhost:8888/health"
    "Document Generator|http://localhost:8080/health"
)

ALL_RUNNING=true
for service in "${SERVICES[@]}"; do
    IFS='|' read -r name url <<< "$service"
    if ! check_service "$name" "$url"; then
        ALL_RUNNING=false
    fi
done

# Display endpoints
echo -e "\n${BLUE}Available Endpoints:${NC}"
echo "========================"
echo "🤖 AI Service: http://localhost:3001"
echo "   - Docs: http://localhost:3001/docs"
echo "   - Test: http://localhost:3001/ai/test"
echo ""
echo "🔐 Crypto Vault: http://localhost:8888"
echo "   - Health: http://localhost:8888/health"
echo ""
echo "📄 Document Generator: http://localhost:8080"
echo ""
echo "🦙 Ollama: http://localhost:11434"
echo "   - Models: http://localhost:11434/api/tags"

# Test AI integration
echo -e "\n${BLUE}Testing AI Integration...${NC}"
TEST_RESPONSE=$(curl -s -X GET http://localhost:3001/ai/test 2>/dev/null)
if echo "$TEST_RESPONSE" | grep -q "passed"; then
    echo -e "${GREEN}✅ AI integration test passed!${NC}"
else
    echo -e "${YELLOW}⚠️ AI integration test failed${NC}"
fi

# Usage instructions
if [ "$ALL_RUNNING" = true ]; then
    echo -e "\n${GREEN}🎉 All services are running!${NC}"
    echo -e "\n${BLUE}Quick Start:${NC}"
    echo "1. Process text: curl -X POST http://localhost:3001/ai/process -H 'Content-Type: application/json' -d '{\"prompt\":\"Hello AI\"}''"
    echo "2. Upload document: curl -X POST http://localhost:3001/ai/document -F 'document=@your-file.txt' -F 'generateSummary=true'"
    echo "3. View conversation: curl http://localhost:3001/ai/conversation/{id}"
else
    echo -e "\n${YELLOW}⚠️ Some services failed to start. Check the logs for details.${NC}"
fi

# Shutdown instructions
echo -e "\n${BLUE}To stop all services:${NC}"
echo "./stop-complete-system.sh"
echo ""
echo "Or manually:"
echo "kill $(cat .ai-service_pid 2>/dev/null) $(cat .crypto-vault_pid 2>/dev/null) $(cat .ollama_pid 2>/dev/null) $(cat .docgen-server_pid 2>/dev/null) 2>/dev/null"

# Save service info
cat > .system-status.json << EOF
{
  "started": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "services": {
    "ollama": {
      "pid": $(cat .ollama_pid 2>/dev/null || echo null),
      "port": 11434,
      "status": "$(check_service 'Ollama' 'http://localhost:11434/api/tags' && echo 'running' || echo 'stopped')"
    },
    "ai-service": {
      "pid": $(cat .ai-service_pid 2>/dev/null || echo null),
      "port": 3001,
      "status": "$(check_service 'AI Service' 'http://localhost:3001/health' && echo 'running' || echo 'stopped')"
    },
    "crypto-vault": {
      "pid": $(cat .crypto-vault_pid 2>/dev/null || echo null),
      "port": 8888,
      "status": "$(check_service 'Crypto Vault' 'http://localhost:8888/health' && echo 'running' || echo 'stopped')"
    },
    "document-generator": {
      "pid": $(cat .docgen-server_pid 2>/dev/null || echo null),
      "port": 8080,
      "status": "$(check_service 'Document Generator' 'http://localhost:8080/health' && echo 'running' || echo 'stopped')"
    }
  }
}
EOF

echo -e "\n${GREEN}System status saved to .system-status.json${NC}"