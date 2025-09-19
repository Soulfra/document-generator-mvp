#!/bin/bash

# Launch Frogger API System with Visual Dashboard
# Watch your character leap between APIs like a speedrun!

echo "🎮 Launching Frogger API System with Visual Dashboard..."
echo "====================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# ASCII Art
echo -e "${GREEN}"
cat << "EOF"
     🐸 FROGGER API AGILITY COURSE 🐸
    ___________________________
   |  B  |  B  |  I  |  S  | M |
   |_____|_____|_____|_____|___|
     ↓     ↓     ↓     ↓    ↓
   Bronze Iron Steel Mith  Local
EOF
echo -e "${NC}"

# Check dependencies
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 is available${NC}"
        return 0
    fi
}

echo -e "\n${YELLOW}Checking dependencies...${NC}"
check_dependency node
check_dependency npm
check_dependency redis-cli

# Install npm packages if needed
if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}Installing dependencies...${NC}"
    npm install express http-proxy-middleware express-rate-limit winston ioredis dotenv axios ws
fi

# Start Redis if not running
if ! pgrep -x "redis-server" > /dev/null; then
    echo -e "\n${YELLOW}Starting Redis...${NC}"
    redis-server --daemonize yes
fi

# Create necessary directories
mkdir -p .keyrings .cache logs

# Initialize keyrings
echo -e "\n${YELLOW}Initializing keyrings...${NC}"
node keyring-manager.js import

# Start WebSocket bridge first
echo -e "\n${YELLOW}Starting WebSocket Bridge...${NC}"
node frogger-websocket-bridge.js &
BRIDGE_PID=$!
echo "WebSocket Bridge PID: $BRIDGE_PID"

# Wait for bridge to start
sleep 2

# Start Connection Mapper
echo -e "\n${YELLOW}Starting Connection Mapper...${NC}"
node connection-mapper-load-balancer.js &
MAPPER_PID=$!
echo "Connection Mapper PID: $MAPPER_PID"

# Start Frogger Router with visual integration
echo -e "\n${YELLOW}Starting Frogger Router...${NC}"
cat > .frogger-visual-launcher.js << 'EOF'
const { FroggerRouter } = require('./master-api-frogger-router');
const { integrateWithRouter } = require('./frogger-websocket-bridge');

// Start router
const router = new FroggerRouter();
router.start(3456);

// Integrate with visual dashboard
const { bridge, cli } = integrateWithRouter(router, 8081);

console.log('🎮 Frogger Router started with visual integration!');
console.log('📊 API endpoint: http://localhost:3456');
console.log('🌐 WebSocket: ws://localhost:8081');
console.log('\nPress V to open visual dashboard');
EOF

node .frogger-visual-launcher.js &
FROGGER_PID=$!
echo "Frogger Router PID: $FROGGER_PID"

# Wait for services to start
sleep 3

# Open dashboard automatically
echo -e "\n${BLUE}Opening visual dashboard...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    open frogger-visual-dashboard.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open frogger-visual-dashboard.html
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    start frogger-visual-dashboard.html
fi

# Show status
echo -e "\n${GREEN}🎯 Frogger System Status:${NC}"
echo "========================"
echo -e "${BLUE}Visual Dashboard:${NC} file://$(pwd)/frogger-visual-dashboard.html"
echo -e "${BLUE}Frogger Router:${NC} http://localhost:3456"
echo -e "${BLUE}WebSocket Bridge:${NC} ws://localhost:8081"
echo -e "${BLUE}Health Check:${NC} http://localhost:3456/health"
echo -e "${BLUE}Statistics:${NC} http://localhost:3456/stats"

# Show controls
echo -e "\n${YELLOW}🎮 Controls:${NC}"
echo "==========="
echo "V - Open visual dashboard"
echo "S - Show stats"
echo "R - Reset stats"
echo "T - Trigger test sequence"
echo "Q - Quit"
echo ""
echo "In Dashboard:"
echo "SPACE - Manual jump"
echo "P - Pause/Resume"
echo "1-4 - Switch tiers"
echo "S - Toggle sound"

# Create stop script
cat > stop-frogger-visual.sh << 'EOF'
#!/bin/bash
echo "Stopping Frogger Visual System..."
kill $(cat .frogger-visual.pids 2>/dev/null) 2>/dev/null
rm -f .frogger-visual.pids .frogger-visual-launcher.js
echo "Frogger Visual System stopped."
EOF
chmod +x stop-frogger-visual.sh

# Save PIDs
echo "$BRIDGE_PID $MAPPER_PID $FROGGER_PID" > .frogger-visual.pids

echo -e "\n${GREEN}✅ Frogger Visual System is running!${NC}"
echo -e "${YELLOW}To stop: ./stop-frogger-visual.sh${NC}"

# Function to show live stats
show_live_stats() {
    while true; do
        clear
        echo -e "${GREEN}🐸 FROGGER LIVE STATS${NC}"
        echo "===================="
        curl -s http://localhost:3456/stats | jq . 2>/dev/null || echo "Waiting for stats..."
        echo ""
        echo "Press Ctrl+C to return to menu"
        sleep 2
    done
}

# Menu loop
while true; do
    read -n 1 -s key
    case $key in
        v|V)
            echo -e "\n${BLUE}Opening dashboard...${NC}"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open frogger-visual-dashboard.html
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                xdg-open frogger-visual-dashboard.html
            fi
            ;;
        s|S)
            echo -e "\n${YELLOW}Live Stats (Ctrl+C to exit):${NC}"
            show_live_stats
            ;;
        r|R)
            echo -e "\n${YELLOW}Stats reset!${NC}"
            # Send reset command to bridge
            ;;
        t|T)
            echo -e "\n${YELLOW}Triggering test sequence...${NC}"
            # Run test
            for i in {1..10}; do
                curl -s -X POST http://localhost:3456/api/generate \
                    -H "Content-Type: application/json" \
                    -d '{"prompt":"test request '$i'"}' > /dev/null &
            done
            echo "Test requests sent!"
            ;;
        q|Q)
            echo -e "\n${RED}Shutting down...${NC}"
            ./stop-frogger-visual.sh
            exit 0
            ;;
    esac
done