#!/bin/bash

# Stop Unified Integration Hub
# Gracefully shuts down all connected systems

echo "🛑 Stopping Unified Integration Hub"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file="pids/${service_name}.pid"
    
    echo -n "Stopping $service_name... "
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        
        if ps -p $pid > /dev/null 2>&1; then
            # Send SIGTERM first (graceful shutdown)
            kill $pid
            
            # Wait up to 10 seconds for graceful shutdown
            local count=0
            while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid
                echo -e "${YELLOW}✓ Force stopped${NC}"
            else
                echo -e "${GREEN}✓ Gracefully stopped${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ Not running${NC}"
        fi
        
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠ PID file not found${NC}"
    fi
}

# Stop main hub service
stop_service "unified-hub"

# Also try to stop any processes running on known ports
echo -e "\n${BLUE}Checking for remaining processes...${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -n "Found $service on port $port (PID: $pid)... "
        kill $pid 2>/dev/null
        sleep 1
        
        # Check if it's still running
        if ps -p $pid > /dev/null 2>&1; then
            kill -9 $pid 2>/dev/null
            echo -e "${YELLOW}✓ Force stopped${NC}"
        else
            echo -e "${GREEN}✓ Stopped${NC}"
        fi
    fi
}

# Kill processes on known ports
PORTS_SERVICES=(
    "5000:Billing Engine"
    "5001:Billing WebSocket"
    "8080:Agent Forum"
    "8081:Forum WebSocket"
    "8084:Color Status"
    "9090:Main Dashboard"
    "9091:Hub WebSocket"
)

for port_service in "${PORTS_SERVICES[@]}"; do
    IFS=':' read -r port service <<< "$port_service"
    kill_port "$port" "$service"
done

echo -e "\n${GREEN}✓ All systems stopped${NC}"

# Show final status
echo -e "\n${BLUE}Final system check...${NC}"
FINAL_CHECK_PORTS=(5000 5001 8080 8081 8084 9090 9091)
any_running=false

for port in "${FINAL_CHECK_PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}⚠ Port $port still in use${NC}"
        any_running=true
    fi
done

if [ "$any_running" = false ]; then
    echo -e "${GREEN}✓ All ports are now free${NC}"
fi

# Cleanup options
echo ""
read -p "Clean up log files? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning up logs..."
    rm -rf logs/*.log
    echo -e "${GREEN}✓ Logs cleaned${NC}"
fi

read -p "Clean up PID files? (y/N) " -n 1 -r  
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning up PIDs..."
    rm -rf pids/*.pid
    echo -e "${GREEN}✓ PIDs cleaned${NC}"
fi

echo -e "\n${GREEN}🌐 Unified Integration Hub shut down complete${NC}"
echo -e "${YELLOW}To restart: ./launch-unified-hub.sh${NC}"