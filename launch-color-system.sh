#!/bin/bash

# Launch Hollowtown Color System
# This script starts all components of the Unix timestamp-based color status system

echo "🎨 Hollowtown Color System Launcher"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql (macOS)"
    echo "  sudo systemctl start postgresql (Linux)"
    exit 1
fi

# Run database migrations
echo -e "\n${BLUE}Running database migrations...${NC}"
if [ -f "migrations/add-color-status-to-users.sql" ]; then
    PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql -h localhost -U postgres -d document_generator -f migrations/add-color-status-to-users.sql > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database migrations complete${NC}"
    else
        echo -e "${YELLOW}⚠ Database migrations may have already been applied${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Migration file not found, skipping...${NC}"
fi

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_file=$2
    local service_port=$3
    
    echo -e "\n${BLUE}Starting $service_name...${NC}"
    
    if [ -f "$service_file" ]; then
        # Check if port is already in use
        if lsof -Pi :$service_port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠ Port $service_port already in use (possibly $service_name already running)${NC}"
        else
            node "$service_file" > "logs/${service_name}.log" 2>&1 &
            local pid=$!
            echo $pid > "pids/${service_name}.pid"
            
            # Wait a moment for service to start
            sleep 2
            
            # Check if service started successfully
            if ps -p $pid > /dev/null; then
                echo -e "${GREEN}✓ $service_name started (PID: $pid)${NC}"
            else
                echo -e "${RED}✗ $service_name failed to start${NC}"
                cat "logs/${service_name}.log"
            fi
        fi
    else
        echo -e "${RED}✗ $service_file not found${NC}"
    fi
}

# Create directories for logs and PIDs
mkdir -p logs pids

# Start services
start_service "User Color Status Service" "user-color-status.service.js" 8084
start_service "Agent Economy Forum" "AGENT-ECONOMY-FORUM.js" 8080
start_service "Forum Color Integration" "agent-forum-color-integration.js" 8085

# Open the dashboard in browser
echo -e "\n${BLUE}Opening Color Verification Dashboard...${NC}"
if command -v open > /dev/null 2>&1; then
    # macOS
    open "user-color-verification-dashboard.html"
elif command -v xdg-open > /dev/null 2>&1; then
    # Linux
    xdg-open "user-color-verification-dashboard.html"
elif command -v start > /dev/null 2>&1; then
    # Windows
    start "user-color-verification-dashboard.html"
else
    echo -e "${YELLOW}Please open user-color-verification-dashboard.html in your browser${NC}"
fi

echo -e "\n${GREEN}✨ Hollowtown Color System is running!${NC}"
echo ""
echo "Services:"
echo "  • Color Status Service: ws://localhost:8084"
echo "  • Agent Economy Forum: http://localhost:8080"
echo "  • Color Dashboard: file://$(pwd)/user-color-verification-dashboard.html"
echo ""
echo "Logs:"
echo "  • tail -f logs/User-Color-Status-Service.log"
echo "  • tail -f logs/Agent-Economy-Forum.log"
echo ""
echo -e "${YELLOW}To stop all services, run: ./stop-color-system.sh${NC}"