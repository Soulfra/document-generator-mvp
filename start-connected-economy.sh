#!/bin/bash

# 🚀 START CONNECTED ECONOMY SYSTEM
# 
# Launches all the connected systems in the correct order:
# 1. Token Billing System (foundation)
# 2. Federation Bulletin Board (community)  
# 3. Domingo Orchestrator (exports)
# 4. Master Integration Dashboard (unified interface)

echo "🚀 Starting Document Generator Connected Economy..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s $url/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start within 60 seconds${NC}"
    return 1
}

# Check if required ports are available
echo -e "${CYAN}🔍 Checking port availability...${NC}"

declare -A PORTS=(
    ["7302"]="Token Billing System"
    ["8700"]="Federation Bulletin Board" 
    ["8701"]="Federation WebSocket"
    ["7777"]="Domingo Orchestrator"
    ["7778"]="Domingo WebSocket"
    ["9500"]="Master Dashboard"
    ["9501"]="Master WebSocket"
)

for port in "${!PORTS[@]}"; do
    if check_port $port; then
        echo -e "${GREEN}✅ Port $port available for ${PORTS[$port]}${NC}"
    else
        echo -e "${RED}❌ Port $port in use (needed for ${PORTS[$port]})${NC}"
        echo -e "${YELLOW}   Kill the process with: lsof -ti:$port | xargs kill${NC}"
    fi
done

echo

# Create data directories if they don't exist
echo -e "${CYAN}📁 Creating data directories...${NC}"
mkdir -p data
mkdir -p logs
mkdir -p exports

echo -e "${GREEN}✅ Directories ready${NC}"
echo

# Start services in order
echo -e "${PURPLE}🏦 Starting Token Billing System (port 7302)...${NC}"
node automated-token-billing-system.js > logs/token-billing.log 2>&1 &
TOKEN_PID=$!
echo -e "${BLUE}Process ID: $TOKEN_PID${NC}"

# Wait for token billing to be ready
if wait_for_service "http://localhost:7302" "Token Billing System"; then
    echo
else
    echo -e "${RED}Failed to start Token Billing System${NC}"
    exit 1
fi

echo -e "${PURPLE}📢 Starting Federation Bulletin Board (port 8700)...${NC}"
node federation-bulletin-board.js > logs/federation-board.log 2>&1 &
FEDERATION_PID=$!
echo -e "${BLUE}Process ID: $FEDERATION_PID${NC}"

# Wait for federation board to be ready
if wait_for_service "http://localhost:8700" "Federation Bulletin Board"; then
    echo
else
    echo -e "${RED}Failed to start Federation Bulletin Board${NC}"
    kill $TOKEN_PID 2>/dev/null
    exit 1
fi

echo -e "${PURPLE}🎭 Starting Domingo Orchestrator (port 7777)...${NC}"
node domingo-package.js > logs/domingo.log 2>&1 &
DOMINGO_PID=$!
echo -e "${BLUE}Process ID: $DOMINGO_PID${NC}"

# Wait for domingo to be ready
if wait_for_service "http://localhost:7777" "Domingo Orchestrator"; then
    echo
else
    echo -e "${YELLOW}⚠️ Domingo Orchestrator failed to start (exports will use fallback)${NC}"
    echo
fi

echo -e "${PURPLE}🎯 Starting Master Integration Dashboard (port 9500)...${NC}"
node master-integration-dashboard.js > logs/master-dashboard.log 2>&1 &
DASHBOARD_PID=$!
echo -e "${BLUE}Process ID: $DASHBOARD_PID${NC}"

# Wait for dashboard to be ready
if wait_for_service "http://localhost:9500" "Master Integration Dashboard"; then
    echo
else
    echo -e "${RED}Failed to start Master Integration Dashboard${NC}"
    kill $TOKEN_PID $FEDERATION_PID $DOMINGO_PID 2>/dev/null
    exit 1
fi

# Run integration tests
echo -e "${CYAN}🧪 Running integration tests...${NC}"
node test-economy-integration.js

echo -e "${GREEN}🎉 CONNECTED ECONOMY SYSTEM READY!${NC}"
echo -e "${GREEN}=================================${NC}"
echo
echo -e "${CYAN}🌐 Access Points:${NC}"
echo -e "   Master Dashboard:     ${BLUE}http://localhost:9500${NC}"
echo -e "   Token Billing:        ${BLUE}http://localhost:7302${NC}" 
echo -e "   Federation Board:     ${BLUE}http://localhost:8700${NC}"
echo -e "   Domingo Orchestrator: ${BLUE}http://localhost:7777${NC}"
echo
echo -e "${CYAN}📊 System Status:${NC}"
echo -e "   View logs:            ${BLUE}tail -f logs/*.log${NC}"
echo -e "   System health:        ${BLUE}curl http://localhost:9500/api/status${NC}"
echo
echo -e "${CYAN}💡 Usage:${NC}"
echo -e "   1. Open the Master Dashboard in your browser"
echo -e "   2. Click 'Start Document Processing Flow' to test"
echo -e "   3. Visit Federation Board to earn tokens"
echo -e "   4. Use tokens for API calls and processing"
echo
echo -e "${YELLOW}Process IDs (for stopping):${NC}"
echo -e "   Token Billing:    $TOKEN_PID"
echo -e "   Federation Board: $FEDERATION_PID"
echo -e "   Domingo:          $DOMINGO_PID"  
echo -e "   Master Dashboard: $DASHBOARD_PID"
echo
echo -e "${YELLOW}To stop all services:${NC}"
echo -e "   kill $TOKEN_PID $FEDERATION_PID $DOMINGO_PID $DASHBOARD_PID"
echo -e "   Or run: ${BLUE}./stop-connected-economy.sh${NC}"

# Create stop script
cat > stop-connected-economy.sh << EOF
#!/bin/bash
echo "🛑 Stopping Connected Economy System..."
kill $TOKEN_PID $FEDERATION_PID $DOMINGO_PID $DASHBOARD_PID 2>/dev/null
echo "✅ All services stopped"
EOF

chmod +x stop-connected-economy.sh

echo
echo -e "${GREEN}🚀 Connected economy is now running!${NC}"
echo -e "${GREEN}   Use 'curl http://localhost:9500/health' to check status${NC}"

# Keep the script running to show process status
echo -e "${CYAN}Press Ctrl+C to view process status and stop options...${NC}"

trap 'echo -e "\n${YELLOW}📊 Process Status:${NC}"; ps -p $TOKEN_PID $FEDERATION_PID $DOMINGO_PID $DASHBOARD_PID 2>/dev/null || echo "Some processes may have stopped"; echo -e "\n${YELLOW}To stop all: ./stop-connected-economy.sh${NC}"; exit' INT

# Wait indefinitely 
while true; do
    sleep 10
done