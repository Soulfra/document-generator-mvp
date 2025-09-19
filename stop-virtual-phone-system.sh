#!/bin/bash

# 📱 VIRTUAL PHONE GAMING SYSTEM SHUTDOWN
# Cleanly stops all virtual phone system components

echo "📱 Stopping Virtual Phone Gaming System..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check for PID files
if [ -f "phone-logs/controller.pid" ]; then
    CONTROLLER_PID=$(cat phone-logs/controller.pid)
    echo -e "${YELLOW}🛑 Stopping Phone Display Controller (PID: $CONTROLLER_PID)...${NC}"
    
    if ps -p $CONTROLLER_PID > /dev/null; then
        kill $CONTROLLER_PID
        echo -e "${GREEN}✅ Phone Display Controller stopped${NC}"
    else
        echo -e "${YELLOW}⚠️ Phone Display Controller not running${NC}"
    fi
    
    rm -f phone-logs/controller.pid
else
    echo -e "${YELLOW}⚠️ No controller PID file found${NC}"
fi

if [ -f "phone-logs/emulator.pid" ]; then
    EMULATOR_PID=$(cat phone-logs/emulator.pid)
    echo -e "${YELLOW}🛑 Stopping Mobile Emulator Bridge (PID: $EMULATOR_PID)...${NC}"
    
    if ps -p $EMULATOR_PID > /dev/null; then
        kill $EMULATOR_PID
        echo -e "${GREEN}✅ Mobile Emulator Bridge stopped${NC}"
    else
        echo -e "${YELLOW}⚠️ Mobile Emulator Bridge not running${NC}"
    fi
    
    rm -f phone-logs/emulator.pid
else
    echo -e "${YELLOW}⚠️ No emulator PID file found${NC}"
fi

# Kill any remaining processes on phone port
PHONE_PORT=${PHONE_PORT:-3010}
if lsof -i:$PHONE_PORT &> /dev/null; then
    echo -e "${YELLOW}🔍 Found processes still using port $PHONE_PORT${NC}"
    PROCESSES=$(lsof -i:$PHONE_PORT | grep LISTEN | awk '{print $2}')
    
    for PID in $PROCESSES; do
        echo -e "${YELLOW}🛑 Killing process $PID on port $PHONE_PORT${NC}"
        kill $PID
    done
fi

# Clean up any Python processes
PYTHON_PROCESSES=$(pgrep -f "mobile-emulator-bridge.py")
if [ ! -z "$PYTHON_PROCESSES" ]; then
    echo -e "${YELLOW}🛑 Cleaning up Python emulator processes...${NC}"
    for PID in $PYTHON_PROCESSES; do
        kill $PID
    done
    echo -e "${GREEN}✅ Python processes cleaned up${NC}"
fi

# Clean up any Node.js processes
NODE_PROCESSES=$(pgrep -f "phone-display-controller.js")
if [ ! -z "$NODE_PROCESSES" ]; then
    echo -e "${YELLOW}🛑 Cleaning up Node.js controller processes...${NC}"
    for PID in $NODE_PROCESSES; do
        kill $PID
    done
    echo -e "${GREEN}✅ Node.js processes cleaned up${NC}"
fi

echo ""
echo -e "${CYAN}📱 Virtual Phone Gaming System shutdown complete${NC}"
echo -e "${BLUE}📋 Log files preserved in phone-logs/ directory${NC}"
echo -e "${BLUE}📊 Data preserved in area-code-data/ and scraping-data/ directories${NC}"
echo ""
echo -e "${GREEN}✅ All services stopped cleanly${NC}"