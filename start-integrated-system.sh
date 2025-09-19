#!/bin/bash

# START INTEGRATED SYSTEM
# Launches all services with S3 integration

echo "🚀 Starting Integrated System with S3 Storage..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p logs

# Store PIDs for cleanup
PIDFILE=".integrated_system_pids"
rm -f $PIDFILE

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Start services in order
echo -e "${BLUE}1. Starting Docker services (PostgreSQL, Redis, MinIO)...${NC}"
docker-compose up -d postgres redis minio
sleep 5

# Initialize databases if needed
echo -e "${BLUE}2. Initializing databases...${NC}"
node init-rl-database.js 2>/dev/null || echo "Database already initialized"

# Start Character Database Integration
echo -e "${BLUE}3. Starting Character Database Integration (port 9902)...${NC}"
if ! check_port 9902; then
    node character-database-integration.js > logs/character-db-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    PID=$!
    echo $PID >> $PIDFILE
    sleep 3
    if kill -0 $PID 2>/dev/null; then
        echo -e "${GREEN}✓ Character Database Integration started (PID: $PID)${NC}"
    else
        echo -e "${RED}✗ Character Database Integration failed to start${NC}"
        echo "Check logs/character-db-*.log for errors"
    fi
else
    echo -e "${YELLOW}⚠ Port 9902 already in use${NC}"
fi

# Start Carrot RL System
echo -e "${BLUE}4. Starting Carrot Reinforcement Learning System (port 9900)...${NC}"
if ! check_port 9900; then
    node carrot-reinforcement-learning-db.js > logs/carrot-rl-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    PID=$!
    echo $PID >> $PIDFILE
    sleep 3
    if kill -0 $PID 2>/dev/null; then
        echo -e "${GREEN}✓ Carrot RL System started (PID: $PID)${NC}"
    else
        echo -e "${RED}✗ Carrot RL System failed to start${NC}"
        echo "Check logs/carrot-rl-*.log for errors"
    fi
else
    echo -e "${YELLOW}⚠ Port 9900 already in use${NC}"
fi

# Start Learning Chain Coordinator
echo -e "${BLUE}5. Starting Learning Chain Coordinator (port 9800)...${NC}"
if ! check_port 9800; then
    node learning-chain-coordinator-db.js > logs/learning-chain-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    PID=$!
    echo $PID >> $PIDFILE
    sleep 3
    if kill -0 $PID 2>/dev/null; then
        echo -e "${GREEN}✓ Learning Chain started (PID: $PID)${NC}"
    else
        echo -e "${RED}✗ Learning Chain failed to start${NC}"
        echo "Check logs/learning-chain-*.log for errors"
    fi
else
    echo -e "${YELLOW}⚠ Port 9800 already in use${NC}"
fi

# Start Bash System Integration
echo -e "${BLUE}6. Starting Bash System Integration (port 3001)...${NC}"
if ! check_port 3001; then
    node bash-system-integration.js > logs/bash-system-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    PID=$!
    echo $PID >> $PIDFILE
    sleep 3
    if kill -0 $PID 2>/dev/null; then
        echo -e "${GREEN}✓ Bash System Integration started (PID: $PID)${NC}"
    else
        echo -e "${RED}✗ Bash System Integration failed to start${NC}"
        echo "Check logs/bash-system-*.log for errors"
    fi
else
    echo -e "${YELLOW}⚠ Port 3001 already in use - likely redwood-broker${NC}"
fi

# Start Unified API Gateway
echo -e "${BLUE}7. Starting Unified API Gateway (port 8888)...${NC}"
if ! check_port 8888; then
    node unified-api-gateway.js > logs/unified-gateway-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    PID=$!
    echo $PID >> $PIDFILE
    sleep 3
    if kill -0 $PID 2>/dev/null; then
        echo -e "${GREEN}✓ Unified API Gateway started (PID: $PID)${NC}"
    else
        echo -e "${RED}✗ Unified API Gateway failed to start${NC}"
        echo "Check logs/unified-gateway-*.log for errors"
    fi
else
    echo -e "${YELLOW}⚠ Port 8888 already in use${NC}"
fi

# Verify services are running
echo ""
echo -e "${BLUE}8. Verifying services...${NC}"
sleep 3

SERVICES_OK=true

# Check each service
if curl -s http://localhost:9902/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Character Database: ONLINE${NC}"
else
    echo -e "${RED}✗ Character Database: OFFLINE${NC}"
    SERVICES_OK=false
fi

if curl -s http://localhost:9900/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Carrot RL System: ONLINE${NC}"
else
    echo -e "${RED}✗ Carrot RL System: OFFLINE${NC}"
    SERVICES_OK=false
fi

if curl -s http://localhost:9800/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Learning Chain: ONLINE${NC}"
else
    echo -e "${RED}✗ Learning Chain: OFFLINE${NC}"
    SERVICES_OK=false
fi

if curl -s http://localhost:8888/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Unified Gateway: ONLINE${NC}"
else
    echo -e "${RED}✗ Unified Gateway: OFFLINE${NC}"
    SERVICES_OK=false
fi

echo ""
if [ "$SERVICES_OK" = true ]; then
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ ALL SERVICES STARTED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}================================================${NC}"
else
    echo -e "${YELLOW}================================================${NC}"
    echo -e "${YELLOW}⚠ SOME SERVICES FAILED TO START${NC}"
    echo -e "${YELLOW}Check the logs directory for errors${NC}"
    echo -e "${YELLOW}================================================${NC}"
fi

echo ""
echo "📡 Available Services:"
echo "  • Character Database: http://localhost:9902/dashboard"
echo "  • Carrot RL System: http://localhost:9900/dashboard"
echo "  • Learning Chain: http://localhost:9800/dashboard"
echo "  • Bash System: http://localhost:3001/api/status"
echo "  • Unified Gateway: http://localhost:8888/dashboard"
echo "  • MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
echo ""
echo "📊 View logs:"
echo "  tail -f logs/*.log"
echo ""
echo "🧪 Test the integration:"
echo "  node test-s3-integration.js"
echo ""
echo "🛑 To stop all services:"
echo "  ./stop-integrated-system.sh"
echo ""

# Create stop script
cat > stop-integrated-system.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping integrated system..."

# Kill processes from PID file
if [ -f .integrated_system_pids ]; then
    while read pid; do
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping process $pid"
            kill $pid
        fi
    done < .integrated_system_pids
    rm -f .integrated_system_pids
fi

# Also kill by name as backup
pkill -f 'node.*character-database'
pkill -f 'node.*carrot-reinforcement'
pkill -f 'node.*learning-chain'
pkill -f 'node.*bash-system'
pkill -f 'node.*unified-api'

# Stop Docker services
echo "Stopping Docker services..."
docker-compose down

echo "✅ All services stopped"
EOF

chmod +x stop-integrated-system.sh