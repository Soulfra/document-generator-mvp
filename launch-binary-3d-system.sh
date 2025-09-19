#!/bin/bash

# 🚀 BINARY LOOP 3D SYSTEM LAUNCHER
# Starts all components including 3D generation

echo "🚀 Starting Binary Loop 3D System..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required dependencies are installed
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}⚠️  PostgreSQL client not found. Make sure PostgreSQL is running.${NC}"
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${YELLOW}Creating package.json...${NC}"
        cat > package.json << 'EOF'
{
  "name": "binary-loop-3d-system",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "./launch-binary-3d-system.sh",
    "test": "node test-3d-integration.js",
    "dev": "node --watch binary-loop-3d-extension.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "pg": "^8.11.3",
    "node-fetch": "^3.3.2",
    "three": "^0.158.0",
    "cors": "^2.8.5"
  }
}
EOF
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
    
    echo -e "${GREEN}✅ Dependencies checked${NC}"
}

# Function to start a service
start_service() {
    local name=$1
    local script=$2
    local port=$3
    
    echo -e "${BLUE}Starting $name on port $port...${NC}"
    
    # Start in background
    node "$script" > "logs/${name}.log" 2>&1 &
    local pid=$!
    
    # Store PID
    echo $pid > "logs/${name}.pid"
    
    # Wait a moment for service to start
    sleep 2
    
    # Check if service started successfully
    if ps -p $pid > /dev/null; then
        echo -e "${GREEN}✅ $name started (PID: $pid)${NC}"
    else
        echo -e "${RED}❌ Failed to start $name${NC}"
        cat "logs/${name}.log"
        return 1
    fi
}

# Create logs directory
mkdir -p logs

# Check dependencies
check_dependencies

# Start PostgreSQL if not running (optional - depends on system)
if command -v pg_ctl &> /dev/null; then
    if ! pg_isready &> /dev/null; then
        echo -e "${YELLOW}Starting PostgreSQL...${NC}"
        pg_ctl start -D /usr/local/var/postgres -l logs/postgresql.log
        sleep 3
    fi
fi

# Start services in order
echo -e "\n${BLUE}Starting core services...${NC}"

# 1. Start Binary Loop Controller
start_service "Binary-Loop-Controller" "binary-anthropic-loop-controller.js" 8110
if [ $? -ne 0 ]; then exit 1; fi

# 2. Start COBOL Orchestrator (if separate)
# start_service "COBOL-Orchestrator" "cobol-mass-batch-orchestrator.js" 8111

# 3. Start AI-to-3D Bridge
start_service "AI-3D-Bridge" "ai-to-3d-bridge.js" 8115
if [ $? -ne 0 ]; then exit 1; fi

# 4. Start Binary Loop 3D Extension (main API)
start_service "3D-Extension-API" "binary-loop-3d-extension.js" 8116
if [ $? -ne 0 ]; then exit 1; fi

# Wait for all services to be ready
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"
sleep 5

# Check service health
echo -e "\n${BLUE}Checking service health...${NC}"

check_service() {
    local name=$1
    local url=$2
    
    if curl -s "$url" > /dev/null; then
        echo -e "${GREEN}✅ $name is healthy${NC}"
    else
        echo -e "${RED}❌ $name is not responding${NC}"
    fi
}

check_service "3D Extension API" "http://localhost:8116/api/status"
check_service "AI-3D Bridge Status" "http://localhost:8115/status"

# Display service URLs
echo -e "\n${GREEN}🎉 Binary Loop 3D System is running!${NC}"
echo -e "\n${BLUE}Service URLs:${NC}"
echo "  📡 3D Generation API: http://localhost:8116"
echo "  🌉 AI-3D Bridge Status: http://localhost:8115/status"
echo "  🔄 Binary Loop WebSocket: ws://localhost:8110"
echo ""
echo -e "${BLUE}API Endpoints:${NC}"
echo "  POST /api/generate-3d - Generate 3D from text"
echo "  POST /api/binary-to-3d - Generate 3D from binary"
echo "  POST /api/symbol-to-3d - Generate 3D from symbols"
echo "  GET  /api/generations - List all generations"
echo "  GET  /api/status - System status"
echo ""
echo -e "${BLUE}Web Interface:${NC}"
echo "  🌐 http://localhost:8116"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo "  Run tests: npm test"
echo "  View logs: tail -f logs/*.log"
echo "  Stop all: ./stop-binary-3d-system.sh"
echo ""

# Function to handle shutdown
shutdown() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    # Read PIDs and stop services
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid
                echo -e "${GREEN}✅ Stopped process $pid${NC}"
            fi
            rm "$pidfile"
        fi
    done
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap shutdown SIGINT SIGTERM

# Keep script running
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"

# Optional: Run tests after startup
if [ "$1" == "--test" ]; then
    echo -e "\n${BLUE}Running integration tests...${NC}"
    sleep 5
    node test-3d-integration.js
fi

# Wait for interrupt
while true; do
    sleep 1
done