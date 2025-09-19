#!/bin/bash

# Launch Frogger API System
# The ultimate API limit bypass system

echo "🐸 Launching Frogger API System..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

# Initialize keyrings from environment
echo -e "\n${YELLOW}Initializing keyrings...${NC}"
node keyring-manager.js import

# Start the connection mapper in background
echo -e "\n${YELLOW}Starting Connection Mapper...${NC}"
node connection-mapper-load-balancer.js &
MAPPER_PID=$!
echo "Connection Mapper PID: $MAPPER_PID"

# Start the Frogger Router
echo -e "\n${YELLOW}Starting Frogger Router...${NC}"
node master-api-frogger-router.js &
FROGGER_PID=$!
echo "Frogger Router PID: $FROGGER_PID"

# Wait for services to start
sleep 3

# Show status
echo -e "\n${GREEN}🎯 Frogger System Status:${NC}"
echo "========================"
echo "Frogger Router: http://localhost:3456"
echo "Health Check: http://localhost:3456/health"
echo "Statistics: http://localhost:3456/stats"

# Show available endpoints
echo -e "\n${YELLOW}Available endpoints:${NC}"
curl -s http://localhost:3456/health | jq '.availableEndpoints' 2>/dev/null || echo "Waiting for endpoints..."

# Create stop script
cat > stop-frogger.sh << 'EOF'
#!/bin/bash
echo "Stopping Frogger System..."
kill $(cat .frogger.pids 2>/dev/null) 2>/dev/null
rm -f .frogger.pids
echo "Frogger System stopped."
EOF
chmod +x stop-frogger.sh

# Save PIDs
echo "$MAPPER_PID $FROGGER_PID" > .frogger.pids

echo -e "\n${GREEN}✅ Frogger System is running!${NC}"
echo -e "${YELLOW}To stop: ./stop-frogger.sh${NC}"
echo -e "${YELLOW}To test: node test-frogger-system.js${NC}"

# Keep running and show logs
echo -e "\n${YELLOW}Showing logs (Ctrl+C to exit)...${NC}"
tail -f logs/frogger-combined.log 2>/dev/null || \
    echo "Waiting for logs... The system is initializing."

# Cleanup on exit
trap "kill $MAPPER_PID $FROGGER_PID 2>/dev/null; exit" INT TERM