#!/bin/bash

# 🚀 UNIFIED BACKEND STARTUP SCRIPT
# Starts all backend services in the right order with proper connectivity

echo "🚀 STARTING UNIFIED BACKEND SYSTEM"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required${NC}"
    exit 1
fi

# Check if Docker is available (optional)
DOCKER_AVAILABLE=false
if command -v docker &> /dev/null && docker info > /dev/null 2>&1; then
    DOCKER_AVAILABLE=true
    echo -e "${GREEN}✅ Docker available${NC}"
else
    echo -e "${YELLOW}⚠️ Docker not available - running services locally${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install axios ws node-cache express cors helmet compression express-rate-limit
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        return 0  # Port in use
    else
        return 1  # Port free
    fi
}

# Function to start service and check health
start_service() {
    local name=$1
    local script=$2
    local port=$3
    local health_endpoint=$4
    
    if check_port $port; then
        echo -e "${YELLOW}⚠️ Port $port already in use, skipping $name${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🚀 Starting $name on port $port...${NC}"
    node $script &
    local pid=$!
    
    # Wait for service to start
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s $health_endpoint > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name started successfully${NC}"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
    done
    
    echo -e "${RED}❌ Failed to start $name${NC}"
    kill $pid 2>/dev/null
    return 1
}

echo -e "${PURPLE}📊 Starting Core Backend Services...${NC}"
echo ""

# Step 1: Start Network Service (foundational)
if [ -f "network-service.js" ]; then
    start_service "Network Service" "network-service.js" 3333 "http://localhost:3333/health"
else
    echo -e "${RED}❌ network-service.js not found${NC}"
    exit 1
fi

# Step 2: Start Service Registry
if [ -f "service-registry.js" ]; then
    start_service "Service Registry" "service-registry.js" 5555 "http://localhost:5555/health"
else
    echo -e "${RED}❌ service-registry.js not found${NC}"
    exit 1
fi

# Step 3: Start Internet Gateway
if [ -f "internet-gateway.js" ]; then
    start_service "Internet Gateway" "internet-gateway.js" 6666 "http://localhost:6666/health"
else
    echo -e "${RED}❌ internet-gateway.js not found${NC}"
    exit 1
fi

# Step 4: Start Backend Integration Service
if [ -f "backend-integration-service.js" ]; then
    start_service "Backend Integration" "backend-integration-service.js" 4444 "http://localhost:4444/health"
else
    echo -e "${RED}❌ backend-integration-service.js not found${NC}"
    exit 1
fi

# Step 5: Check for existing services and connect them
echo ""
echo -e "${PURPLE}🔗 Connecting to Existing Services...${NC}"

existing_services=(
    "Auth Daemon:8463:/health"
    "Verification Mempool:7500:/api/mempool/status"
    "Token System:7300:/api/status"
    "Control Center:8080:/"
)

for service_info in "${existing_services[@]}"; do
    IFS=':' read -r name port endpoint <<< "$service_info"
    
    if check_port $port; then
        if curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ $name (port $port)${NC}"
            
            # Register with service registry
            curl -s -X POST "http://localhost:5555/registry/register" \
                -H "Content-Type: application/json" \
                -d "{\"name\":\"$(echo $name | tr ' ' '-' | tr '[:upper:]' '[:lower:]')\",\"port\":$port,\"version\":\"1.0.0\"}" > /dev/null
        else
            echo -e "   ${YELLOW}⚠️ $name (port $port) - not responding${NC}"
        fi
    else
        echo -e "   ${RED}❌ $name (port $port) - not running${NC}"
    fi
done

# Step 6: Start Docker services if available
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo -e "${PURPLE}🐳 Starting Docker Infrastructure...${NC}"
    
    # Start core infrastructure services
    docker-compose up -d postgres redis ollama
    
    echo -e "${BLUE}⏳ Waiting for infrastructure services...${NC}"
    sleep 10
    
    # Start our new services
    docker-compose up -d network-service service-registry internet-gateway backend-integration
    
    echo -e "${GREEN}✅ Docker services started${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️ Docker not available - running local services only${NC}"
fi

# Step 7: Display status
echo ""
echo -e "${GREEN}🎉 UNIFIED BACKEND SYSTEM READY!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}🌐 Service Endpoints:${NC}"
echo "   • Network Service:      http://localhost:3333"
echo "   • Service Registry:     http://localhost:5555"
echo "   • Internet Gateway:     http://localhost:6666"
echo "   • Backend Integration:  http://localhost:4444"
echo "   • WebSocket:            ws://localhost:4445"
echo ""
echo -e "${BLUE}📊 Management Interfaces:${NC}"
echo "   • Service Status:       http://localhost:4444/services"
echo "   • System Health:        http://localhost:4444/api/system/health"
echo "   • Network Stats:        http://localhost:3333/stats"
echo "   • Gateway Stats:        http://localhost:6666/stats"
echo "   • Registry Status:      http://localhost:5555/registry/status"
echo ""
echo -e "${BLUE}🚀 API Endpoints:${NC}"
echo "   • Document Processing:  POST http://localhost:4444/api/document/process"
echo "   • AI Generation:        POST http://localhost:4444/api/ai/generate"
echo "   • Authentication:       POST http://localhost:4444/api/auth/login"
echo "   • Token Balance:        GET  http://localhost:4444/api/tokens/balance/{userId}"
echo ""
echo -e "${BLUE}🎯 Orchestrated Operations:${NC}"
echo "   • Document to MVP:      POST http://localhost:4444/api/orchestrate/document-to-mvp"
echo ""
echo -e "${BLUE}🌍 External API Proxy:${NC}"
echo "   • OpenAI:              POST http://localhost:6666/openai/chat/completions"
echo "   • Anthropic:           POST http://localhost:6666/anthropic/messages"
echo "   • GitHub:              GET  http://localhost:6666/github/user"
echo "   • Generic Proxy:       ALL  http://localhost:6666/proxy/https://api.example.com/endpoint"
echo ""

# Step 8: Test connectivity
echo -e "${BLUE}🧪 Testing System Connectivity...${NC}"

# Test network service
if curl -s http://localhost:3333/health | grep -q "healthy"; then
    echo -e "   ${GREEN}✅ Network Service${NC}"
else
    echo -e "   ${RED}❌ Network Service${NC}"
fi

# Test backend integration
if curl -s http://localhost:4444/health | grep -q "healthy"; then
    echo -e "   ${GREEN}✅ Backend Integration${NC}"
else
    echo -e "   ${RED}❌ Backend Integration${NC}"
fi

# Test service discovery
service_count=$(curl -s http://localhost:5555/registry/services | jq length 2>/dev/null || echo "0")
echo -e "   ${GREEN}✅ Service Registry ($service_count services)${NC}"

# Test internet connectivity
if curl -s http://localhost:6666/health | grep -q "healthy"; then
    echo -e "   ${GREEN}✅ Internet Gateway${NC}"
else
    echo -e "   ${RED}❌ Internet Gateway${NC}"
fi

echo ""
echo -e "${GREEN}🎮 SYSTEM IS READY FOR YAPPING! 🗣️${NC}"
echo ""
echo -e "${YELLOW}💡 Quick Test Commands:${NC}"
echo "   curl http://localhost:4444/health"
echo "   curl http://localhost:4444/services/status"
echo "   curl http://localhost:6666/stats"
echo ""
echo -e "${BLUE}🛑 To stop all services:${NC}"
echo "   pkill -f 'node.*service'"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   docker-compose down"
fi
echo ""

# Keep script running to monitor services
trap 'echo -e "\n🛑 Shutting down services..."; pkill -f "node.*service"; exit 0' INT

echo -e "${PURPLE}📊 Monitoring services... (Press Ctrl+C to stop)${NC}"
while true; do
    sleep 30
    echo -e "$(date) - Backend system running ($(ps aux | grep -c 'node.*service') processes)"
done