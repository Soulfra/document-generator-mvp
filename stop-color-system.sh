#!/bin/bash

# Stop Hollowtown Color System
# This script stops all components of the color status system

echo "🛑 Stopping Hollowtown Color System"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file="pids/${service_name}.pid"
    
    echo -n "Stopping $service_name... "
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            sleep 1
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid
            fi
            
            echo -e "${GREEN}✓ Stopped${NC}"
        else
            echo -e "${YELLOW}⚠ Not running${NC}"
        fi
        
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠ PID file not found${NC}"
    fi
}

# Stop all services
stop_service "User-Color-Status-Service"
stop_service "Agent-Economy-Forum"
stop_service "Forum-Color-Integration"

# Also try to stop by port if services are running without PID files
echo -e "\nChecking for services on known ports..."

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -n "Found $service on port $port (PID: $pid)... "
        kill $pid
        echo -e "${GREEN}✓ Stopped${NC}"
    fi
}

kill_port 8084 "Color Status Service"
kill_port 8080 "Agent Economy Forum"
kill_port 8085 "Color Integration"

echo -e "\n${GREEN}✓ All services stopped${NC}"
echo ""

# Optionally clean up logs
read -p "Clean up log files? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning up logs..."
    rm -rf logs/*.log
    echo -e "${GREEN}✓ Logs cleaned${NC}"
fi

echo -e "\n${YELLOW}To restart the system, run: ./launch-color-system.sh${NC}"