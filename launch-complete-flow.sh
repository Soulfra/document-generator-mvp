#!/bin/bash

# 🚀 COMPLETE DATA FLOW LAUNCHER
# 
# Launches the complete API → Forum → Gaming → Database flow system
# All services work together to process documents through the entire pipeline

echo "🚀 LAUNCHING COMPLETE DATA FLOW SYSTEM"
echo "====================================="
echo ""
echo "Flow: API → Forum → Decrypt → Gaming → Database"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $1 is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $1 is available${NC}"
        return 0
    fi
}

# Function to check if command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
PREREQ_OK=true

# Check required commands
check_command node || PREREQ_OK=false
check_command npm || PREREQ_OK=false
check_command pg_ctl || echo -e "${YELLOW}⚠️  PostgreSQL not found - will use Docker${NC}"
check_command mongod || echo -e "${YELLOW}⚠️  MongoDB not found - will use Docker${NC}"
check_command redis-server || echo -e "${YELLOW}⚠️  Redis not found - will use Docker${NC}"

# Check required ports
echo ""
echo -e "${BLUE}📋 Checking required ports...${NC}"
PORTS_OK=true

# Core services
check_port 5432 || PORTS_OK=false  # PostgreSQL
check_port 27017 || PORTS_OK=false # MongoDB
check_port 6379 || PORTS_OK=false  # Redis

# Flow components
check_port 3000 || PORTS_OK=false  # Template Processor
check_port 3001 || PORTS_OK=false  # AI Service
check_port 8080 || PORTS_OK=false  # Forum System
check_port 8090 || PORTS_OK=false  # MVP API
check_port 8091 || PORTS_OK=false  # Flow Monitor Dashboard
check_port 8092 || PORTS_OK=false  # Flow Monitor WebSocket

# Gaming layers
check_port 7000 || PORTS_OK=false  # 3D Gaming Layer
check_port 7500 || PORTS_OK=false  # 2.5D Gaming Layer
check_port 8000 || PORTS_OK=false  # 2D Gaming Layer

if [ "$PREREQ_OK" = false ] || [ "$PORTS_OK" = false ]; then
    echo ""
    echo -e "${RED}❌ Prerequisites check failed. Please install missing components or free ports.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All prerequisites satisfied${NC}"
echo ""

# Create necessary directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p logs
mkdir -p databases
mkdir -p generated-mvps
mkdir -p uploads
mkdir -p flow-data
echo -e "${GREEN}✅ Directories ready${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install express ws cors pg mongodb sqlite3 crypto uuid multer axios
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Start databases
echo -e "${BLUE}🗄️ Starting databases...${NC}"

# PostgreSQL
if command -v pg_ctl &> /dev/null; then
    echo "Starting PostgreSQL..."
    pg_ctl start -D /usr/local/var/postgres -l logs/postgres.log
else
    echo "Starting PostgreSQL in Docker..."
    docker run -d --name postgres-flow \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=document_generator \
        -p 5432:5432 \
        postgres:latest
fi

# MongoDB
if command -v mongod &> /dev/null; then
    echo "Starting MongoDB..."
    mongod --dbpath ./databases/mongodb --logpath logs/mongodb.log --fork
else
    echo "Starting MongoDB in Docker..."
    docker run -d --name mongodb-flow \
        -p 27017:27017 \
        -v $(pwd)/databases/mongodb:/data/db \
        mongo:latest
fi

# Redis
if command -v redis-server &> /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes --logfile logs/redis.log
else
    echo "Starting Redis in Docker..."
    docker run -d --name redis-flow \
        -p 6379:6379 \
        redis:latest
fi

echo -e "${GREEN}✅ Databases started${NC}"
echo ""

# Function to start a service
start_service() {
    local name=$1
    local script=$2
    local port=$3
    local log_file="logs/${name}.log"
    
    echo -e "${BLUE}Starting ${name}...${NC}"
    
    if [ -f "$script" ]; then
        node "$script" > "$log_file" 2>&1 &
        local pid=$!
        echo "$pid" > "logs/${name}.pid"
        sleep 2
        
        if ps -p $pid > /dev/null; then
            echo -e "${GREEN}✅ ${name} started (PID: $pid, Port: $port)${NC}"
        else
            echo -e "${RED}❌ ${name} failed to start - check $log_file${NC}"
            tail -n 20 "$log_file"
        fi
    else
        echo -e "${YELLOW}⚠️  ${name} script not found at ${script}${NC}"
    fi
}

# Start all flow components
echo -e "${BLUE}🔄 Starting flow components...${NC}"
echo ""

# 1. Forum System (needs to be running first)
start_service "Forum System" "AGENT-ECONOMY-FORUM.js" "8080"
sleep 2

# 2. RL Learning System
start_service "RL System" "real-game-api-rl-system.js" "N/A"

# 3. Gaming Orchestrator
start_service "Gaming Orchestrator" "secure-gaming-orchestrator.js" "7000-8000"

# 4. Template Processor (if exists)
if [ -f "services/real-template-processor.js" ]; then
    start_service "Template Processor" "services/real-template-processor.js" "3000"
elif [ -f "mcp/server.js" ]; then
    start_service "MCP Server" "mcp/server.js" "3000"
fi

# 5. AI Services (if exist)
if [ -f "FinishThisIdea/ai-services/server.js" ]; then
    start_service "AI Services" "FinishThisIdea/ai-services/server.js" "3001"
fi

# 6. MVP API
start_service "MVP API" "mvp-api.js" "8090"

# 7. Flow Components
start_service "API-Forum Bridge" "api-to-forum-bridge.js" "N/A"
start_service "Forum-Game Transformer" "forum-to-game-transformer.js" "N/A"
start_service "Game-DB Persistor" "game-to-database-persistor.js" "N/A"

# 8. Flow Orchestrator
start_service "Flow Orchestrator" "unified-flow-orchestrator.js" "N/A"

# 9. Flow Monitor Dashboard
start_service "Flow Monitor" "flow-monitor-dashboard.js" "8091"

echo ""
echo -e "${GREEN}✨ COMPLETE FLOW SYSTEM STARTED!${NC}"
echo ""
echo "📍 Service URLs:"
echo "  • Flow Monitor:     http://localhost:8091"
echo "  • MVP API:          http://localhost:8090"
echo "  • Forum System:     http://localhost:8080"
echo "  • Template Service: http://localhost:3000"
echo ""
echo "🎮 Gaming Layers:"
echo "  • 3D Layer:  Port 7000 (Building/Construction)"
echo "  • 2.5D Layer: Port 7500 (Dungeon Exploration)"
echo "  • 2D Layer:   Port 8000 (Portal Connections)"
echo ""
echo "📊 Databases:"
echo "  • PostgreSQL: localhost:5432"
echo "  • MongoDB:    localhost:27017"
echo "  • Redis:      localhost:6379"
echo ""
echo "🔄 Flow Path:"
echo "  1. Send document to MVP API"
echo "  2. MVP generates and posts to Forum"
echo "  3. Forum post transforms to Game Event"
echo "  4. Game processes through appropriate layer"
echo "  5. Results persist to databases"
echo "  6. Monitor everything at http://localhost:8091"
echo ""
echo "📝 Example Usage:"
echo '  curl -X POST http://localhost:8090/api/mvp/generate \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '"'"'{"document": {"content": "Build a task management SaaS", "type": "business-plan"}}'"'"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    
    # Kill all services using PID files
    for pid_file in logs/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid 2>/dev/null
                echo -e "${GREEN}✅ Stopped process $pid${NC}"
            fi
            rm "$pid_file"
        fi
    done
    
    # Stop databases
    if command -v pg_ctl &> /dev/null; then
        pg_ctl stop -D /usr/local/var/postgres
    else
        docker stop postgres-flow 2>/dev/null
        docker rm postgres-flow 2>/dev/null
    fi
    
    if command -v mongod &> /dev/null; then
        mongod --shutdown
    else
        docker stop mongodb-flow 2>/dev/null
        docker rm mongodb-flow 2>/dev/null
    fi
    
    if command -v redis-cli &> /dev/null; then
        redis-cli shutdown
    else
        docker stop redis-flow 2>/dev/null
        docker rm redis-flow 2>/dev/null
    fi
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up cleanup on Ctrl+C
trap cleanup INT

# Demo mode - create a test flow after 5 seconds
if [ "$1" = "--demo" ]; then
    echo -e "${BLUE}🎯 Demo mode - will create test flow in 5 seconds...${NC}"
    
    (sleep 5 && \
    echo -e "${BLUE}📝 Creating demo flow...${NC}" && \
    curl -X POST http://localhost:8090/api/mvp/generate \
        -H "Content-Type: application/json" \
        -d '{"document": {"content": "Build a collaborative project management platform with real-time updates, task assignments, and team analytics.", "type": "business-plan"}, "options": {"name": "TaskFlow Demo"}}' \
        -s | jq '.' || echo "Demo request sent - check http://localhost:8091") &
fi

# Health check loop
health_check() {
    while true; do
        sleep 30
        
        # Check if key services are running
        all_healthy=true
        
        # Check MVP API
        if ! curl -s http://localhost:8090/health > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  MVP API not responding${NC}"
            all_healthy=false
        fi
        
        # Check Forum
        if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Forum System not responding${NC}"
            all_healthy=false
        fi
        
        # Check Monitor
        if ! curl -s http://localhost:8091 > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Flow Monitor not responding${NC}"
            all_healthy=false
        fi
        
        if [ "$all_healthy" = true ]; then
            echo -e "${GREEN}💚 All services healthy${NC}"
        fi
    done
}

# Start health check in background
health_check &
HEALTH_PID=$!

# Wait for interrupt
wait

# Cleanup
kill $HEALTH_PID 2>/dev/null
cleanup