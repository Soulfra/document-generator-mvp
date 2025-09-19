#!/bin/bash

# SOULFRA UNIFIED SYSTEM STARTUP
# Launches all components with proper integration

echo "🚀 Starting SoulFRA Unified System..."
echo "One login, every device, all your gear"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}⚠️  Port $1 is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $1 is available${NC}"
        return 0
    fi
}

# Function to start a service in the background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    
    echo -e "${BLUE}Starting $name on port $port...${NC}"
    
    if check_port $port; then
        # Start in background and save PID
        nohup $command > logs/${name}.log 2>&1 &
        echo $! > pids/${name}.pid
        echo -e "${GREEN}✅ $name started (PID: $(cat pids/${name}.pid))${NC}"
    else
        echo -e "${RED}❌ Failed to start $name - port $port in use${NC}"
    fi
}

# Create necessary directories
mkdir -p logs pids

# Check all required ports
echo -e "${YELLOW}Checking ports...${NC}"
PORTS=(7777 7778 8888 8080 8081 3333 9999)
ALL_CLEAR=true

for port in "${PORTS[@]}"; do
    if ! check_port $port; then
        ALL_CLEAR=false
    fi
done

if [ "$ALL_CLEAR" = false ]; then
    echo -e "${RED}Some ports are in use. Please stop conflicting services or use 'npm stop' first.${NC}"
    echo "Run: ./stop-unified-soulfra.sh"
    exit 1
fi

echo -e "${GREEN}All ports clear!${NC}"
echo ""

# Start core services
echo -e "${YELLOW}Starting core services...${NC}"

# 1. Start CAL MMORPG (the game server)
start_service "cal-mmorpg" "node cal-mmorpg-unified-system.js" 7777

# Wait for CAL to initialize
sleep 2

# 2. Start SoulFRA Unified Launcher (biometric auth & sync)
start_service "soulfra-launcher" "node soulfra-unified-launcher.js" 8888

# 3. Start Integration Bridge (connects everything)
start_service "soulfra-bridge" "node soulfra-cal-integration-bridge.js" 0

# 4. Start other integrated services if they exist
if [ -f "deathtodata-server.js" ]; then
    start_service "deathtodata" "node deathtodata-server.js" 8080
fi

if [ -f "blamechain-server.js" ]; then
    start_service "blamechain" "node blamechain-server.js" 9999
fi

if [ -f "gaming-platform.js" ]; then
    start_service "gaming-platform" "node gaming-platform.js" 3333
fi

# Wait for services to start
echo ""
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 3

# Check service status
echo ""
echo -e "${BLUE}Service Status:${NC}"
echo "================================="

# Function to check if service is running
check_service() {
    local name=$1
    local port=$2
    local url=$3
    
    if [ -f "pids/${name}.pid" ] && kill -0 $(cat pids/${name}.pid) 2>/dev/null; then
        echo -e "${GREEN}✅ $name: Running (PID: $(cat pids/${name}.pid))${NC}"
        
        # Try to connect to service
        if curl -s -o /dev/null -w "%{http_code}" $url | grep -q "200\|101"; then
            echo -e "   ${GREEN}Connection: OK${NC}"
        else
            echo -e "   ${YELLOW}Connection: Initializing...${NC}"
        fi
    else
        echo -e "${RED}❌ $name: Not running${NC}"
    fi
}

# Check each service
check_service "cal-mmorpg" 7777 "http://localhost:7777"
check_service "soulfra-launcher" 8888 "http://localhost:8888"
check_service "soulfra-bridge" 0 "http://localhost:8888/api/sync/status"

echo ""
echo "================================="
echo -e "${GREEN}🎮 SoulFRA Unified System Started!${NC}"
echo ""
echo "Access points:"
echo -e "${BLUE}  • SoulFRA Launcher: ${NC}http://localhost:8888"
echo -e "${BLUE}  • CAL MMORPG Game: ${NC}http://localhost:7777"
echo -e "${BLUE}  • CAL MMORPG Launcher: ${NC}file://$(pwd)/cal-mmorpg-launcher.html"
echo ""
echo "Features:"
echo "  ✅ Biometric authentication (voice, face, fingerprint)"
echo "  ✅ Cross-device synchronization"
echo "  ✅ Unified inventory across all games"
echo "  ✅ One-time login for all systems"
echo "  ✅ Data diffusion for security"
echo ""
echo -e "${YELLOW}To stop all services, run: ./stop-unified-soulfra.sh${NC}"
echo ""

# Create stop script if it doesn't exist
if [ ! -f "stop-unified-soulfra.sh" ]; then
    cat > stop-unified-soulfra.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping SoulFRA Unified System..."

# Function to stop a service
stop_service() {
    local name=$1
    if [ -f "pids/${name}.pid" ]; then
        PID=$(cat pids/${name}.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            echo "✅ Stopped $name (PID: $PID)"
        else
            echo "⚠️  $name was not running"
        fi
        rm -f pids/${name}.pid
    else
        echo "⚠️  No PID file for $name"
    fi
}

# Stop all services
stop_service "cal-mmorpg"
stop_service "soulfra-launcher"
stop_service "soulfra-bridge"
stop_service "deathtodata"
stop_service "blamechain"
stop_service "gaming-platform"

echo "✅ All services stopped"
EOF
    chmod +x stop-unified-soulfra.sh
fi

# Monitor logs (optional)
echo -e "${YELLOW}Monitoring logs (press Ctrl+C to exit monitoring):${NC}"
echo ""

# Tail logs from all services
tail -f logs/*.log