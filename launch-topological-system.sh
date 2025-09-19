#!/bin/bash

# 🎭 LAUNCH TOPOLOGICAL ENCODING SYSTEM
# Starts all topological services for data encoding

echo "🎭 Starting Topological Encoding System..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Check all required ports
echo -e "${BLUE}Checking ports...${NC}"
PORTS_OK=true

if ! check_port 3013; then
    echo "Knot Theory Engine port 3013 is busy"
    PORTS_OK=false
fi

if ! check_port 3014; then
    echo "Type II Topoisomerase port 3014 is busy"
    PORTS_OK=false
fi

if ! check_port 3015; then
    echo "Topological Encoding System port 3015 is busy"
    PORTS_OK=false
fi

if ! check_port 3016; then
    echo "WebSocket port 3016 is busy"
    PORTS_OK=false
fi

if [ "$PORTS_OK" = false ]; then
    echo -e "${YELLOW}Some ports are busy. Kill existing services? (y/n)${NC}"
    read -r response
    if [ "$response" = "y" ]; then
        echo "Killing existing services..."
        pkill -f "knot-theory-engine.js" 2>/dev/null
        pkill -f "type-ii-topoisomerase-engine.js" 2>/dev/null
        pkill -f "topological-encoding-system.js" 2>/dev/null
        sleep 2
    else
        echo "Exiting..."
        exit 1
    fi
fi

# Start services
echo -e "${GREEN}Starting services...${NC}"

# Start Knot Theory Engine
echo "🪢 Starting Knot Theory Engine..."
node knot-theory-engine.js > logs/knot-theory.log 2>&1 &
KNOT_PID=$!
sleep 2

# Start Type II Topoisomerase Engine
echo "🧬 Starting Type II Topoisomerase Engine..."
node type-ii-topoisomerase-engine.js > logs/topoisomerase.log 2>&1 &
TOPO_PID=$!
sleep 2

# Start Topological Encoding System
echo "🎭 Starting Topological Encoding System..."
node topological-encoding-system.js > logs/encoding-system.log 2>&1 &
ENCODE_PID=$!
sleep 2

# Create logs directory if it doesn't exist
mkdir -p logs

# Save PIDs to file for easy shutdown
echo $KNOT_PID > logs/knot-theory.pid
echo $TOPO_PID > logs/topoisomerase.pid
echo $ENCODE_PID > logs/encoding-system.pid

# Function to check if service is running
check_service() {
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$1/health | grep -q "200"; then
        return 0
    fi
    return 1
}

# Wait for services to be ready
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 3

# Check services
echo -e "${BLUE}Checking service health...${NC}"

if check_service 3013; then
    echo -e "${GREEN}✓ Knot Theory Engine is running${NC}"
else
    echo -e "${YELLOW}⚠ Knot Theory Engine may not be ready${NC}"
fi

if check_service 3014; then
    echo -e "${GREEN}✓ Type II Topoisomerase is running${NC}"
else
    echo -e "${YELLOW}⚠ Type II Topoisomerase may not be ready${NC}"
fi

if check_service 3015; then
    echo -e "${GREEN}✓ Topological Encoding System is running${NC}"
else
    echo -e "${YELLOW}⚠ Topological Encoding System may not be ready${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Topological System Started!${NC}"
echo ""
echo "Access the dashboards at:"
echo "  🪢 Knot Theory:        http://localhost:3013"
echo "  🧬 Topoisomerase:      http://localhost:3014"
echo "  🎭 Encoding System:    http://localhost:3015"
echo "  🔌 WebSocket:          ws://localhost:3016"
echo ""
echo "Logs are available in the logs/ directory"
echo ""
echo "To stop all services, run: ./stop-topological-system.sh"
echo "================================================"

# Create stop script
cat > stop-topological-system.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Topological System..."

# Read PIDs
if [ -f logs/knot-theory.pid ]; then
    kill $(cat logs/knot-theory.pid) 2>/dev/null
    rm logs/knot-theory.pid
fi

if [ -f logs/topoisomerase.pid ]; then
    kill $(cat logs/topoisomerase.pid) 2>/dev/null
    rm logs/topoisomerase.pid
fi

if [ -f logs/encoding-system.pid ]; then
    kill $(cat logs/encoding-system.pid) 2>/dev/null
    rm logs/encoding-system.pid
fi

# Also kill by name in case PIDs are stale
pkill -f "knot-theory-engine.js" 2>/dev/null
pkill -f "type-ii-topoisomerase-engine.js" 2>/dev/null
pkill -f "topological-encoding-system.js" 2>/dev/null

echo "✓ All services stopped"
EOF

chmod +x stop-topological-system.sh

# Trap to handle Ctrl+C
trap 'echo ""; echo "Shutting down..."; ./stop-topological-system.sh; exit' INT

# Keep script running and show logs
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Optional: tail logs
if command -v multitail &> /dev/null; then
    multitail logs/knot-theory.log logs/topoisomerase.log logs/encoding-system.log
else
    # Simple log monitoring
    tail -f logs/encoding-system.log
fi