#!/bin/bash

echo "🛑 SHUTTING DOWN UNIFIED INTEGRATION"
echo "===================================="

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Read PIDs from files
if [ -f .orchestrator_pid ]; then
    ORCHESTRATOR_PID=$(cat .orchestrator_pid)
    echo -e "${YELLOW}Stopping Event Orchestrator (PID: $ORCHESTRATOR_PID)...${NC}"
    kill $ORCHESTRATOR_PID 2>/dev/null
    rm .orchestrator_pid
fi

if [ -f .port_manager_pid ]; then
    PORT_MANAGER_PID=$(cat .port_manager_pid)
    echo -e "${YELLOW}Stopping Port Manager (PID: $PORT_MANAGER_PID)...${NC}"
    kill $PORT_MANAGER_PID 2>/dev/null
    rm .port_manager_pid
fi

if [ -f .hooks_pid ]; then
    HOOKS_PID=$(cat .hooks_pid)
    echo -e "${YELLOW}Stopping Flag Hooks (PID: $HOOKS_PID)...${NC}"
    kill $HOOKS_PID 2>/dev/null
    rm .hooks_pid
fi

if [ -f .hex_pid ]; then
    HEX_PID=$(cat .hex_pid)
    echo -e "${YELLOW}Stopping Hexagonal Platform (PID: $HEX_PID)...${NC}"
    kill $HEX_PID 2>/dev/null
    rm .hex_pid
fi

if [ -f .humanoid_pid ]; then
    HUMANOID_PID=$(cat .humanoid_pid)
    echo -e "${YELLOW}Stopping 3D Humanoid System (PID: $HUMANOID_PID)...${NC}"
    kill $HUMANOID_PID 2>/dev/null
    rm .humanoid_pid
fi

if [ -f .scanner_pid ]; then
    SCANNER_PID=$(cat .scanner_pid)
    echo -e "${YELLOW}Stopping UPC Scanner (PID: $SCANNER_PID)...${NC}"
    kill $SCANNER_PID 2>/dev/null
    rm .scanner_pid
fi

if [ -f .render_pid ]; then
    RENDER_PID=$(cat .render_pid)
    echo -e "${YELLOW}Stopping Render Manager (PID: $RENDER_PID)...${NC}"
    kill $RENDER_PID 2>/dev/null
    rm .render_pid
fi

if [ -f .test_pid ]; then
    TEST_PID=$(cat .test_pid)
    echo -e "${YELLOW}Stopping Integration Test Server (PID: $TEST_PID)...${NC}"
    kill $TEST_PID 2>/dev/null
    rm .test_pid
fi

# Clean up any remaining processes on our ports
echo -e "\n${YELLOW}Cleaning up ports...${NC}"
for port in 3000 3333 4444 5555 7777 8080 8081 8082 8095; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "  Killing remaining process on port $port"
        lsof -ti :$port | xargs kill -9 2>/dev/null
    fi
done

echo -e "\n${GREEN}✅ All services stopped!${NC}"
echo ""
echo "Log files are preserved in ./logs/"
echo ""