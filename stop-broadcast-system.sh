#!/bin/bash

# 🛑 BlameChain Broadcast System Stopper
# Stops all broadcast services gracefully

echo "🛑 Stopping BlameChain Broadcast System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Read PIDs if available
if [ -f ".broadcast-pids" ]; then
    PIDS=$(cat .broadcast-pids)
    echo -e "${BLUE}📝 Found PID file with processes: $PIDS${NC}"
    
    for pid in $PIDS; do
        if kill -0 $pid 2>/dev/null; then
            echo -e "${YELLOW}⏹️  Stopping process $pid...${NC}"
            kill $pid 2>/dev/null || true
        else
            echo -e "${YELLOW}   Process $pid already stopped${NC}"
        fi
    done
    
    # Wait a moment for graceful shutdown
    sleep 3
    
    # Force kill if still running
    for pid in $PIDS; do
        if kill -0 $pid 2>/dev/null; then
            echo -e "${RED}🔨 Force killing process $pid...${NC}"
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    rm -f .broadcast-pids
else
    echo -e "${YELLOW}⚠️  No PID file found, trying to stop by process name...${NC}"
fi

# Kill processes by name as backup
echo -e "${BLUE}🧹 Cleaning up any remaining processes...${NC}"
pkill -f "flask-broadcast-api" 2>/dev/null && echo -e "${GREEN}   ✅ Stopped Flask API${NC}" || true
pkill -f "blamechain-broadcast" 2>/dev/null && echo -e "${GREEN}   ✅ Stopped Rust Engine${NC}" || true  
pkill -f "broadcast-orchestrator" 2>/dev/null && echo -e "${GREEN}   ✅ Stopped Orchestrator${NC}" || true

# Check if ports are now free
echo -e "${BLUE}🔍 Checking if ports are free...${NC}"

if ! lsof -i :5000 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Port 5000 (Flask) is free${NC}"
else
    echo -e "${YELLOW}   ⚠️  Port 5000 still in use${NC}"
fi

if ! lsof -i :8080 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Port 8080 (Rust) is free${NC}"
else
    echo -e "${YELLOW}   ⚠️  Port 8080 still in use${NC}"
fi

if ! lsof -i :3001 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Port 3001 (Orchestrator) is free${NC}"
else
    echo -e "${YELLOW}   ⚠️  Port 3001 still in use${NC}"
fi

echo -e "${GREEN}✅ Broadcast system shutdown complete!${NC}"