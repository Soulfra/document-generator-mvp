#!/bin/bash

# Start Tip Jar Ark Game Master System
# Noah's Ark with 50 Unix users + 3 non-Unix + 1 game master

echo "🏺 Starting Tip Jar Ark Game Master System..."
echo "⚓ Preparing Noah's Ark vessel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js to run the Tip Jar Ark.${NC}"
    exit 1
fi

# Check if required ports are available
check_port() {
    local port=$1
    local service=$2
    if lsof -i :$port &> /dev/null; then
        echo -e "${YELLOW}⚠️  Port $port ($service) is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port ($service) is available${NC}"
        return 0
    fi
}

echo ""
echo -e "${CYAN}🔍 Checking port availability...${NC}"

check_port 9090 "Game Master"
check_port 8084 "Unix Colors"
check_port 8085 "Guardian/Teacher"
check_port 9091 "Tip Jar"

echo ""

# Check if Unix Color System is running
if ! lsof -i :8084 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Unix Color System not detected on port 8084${NC}"
    echo -e "${YELLOW}   The Ark will run in standalone mode${NC}"
else
    echo -e "${GREEN}✅ Unix Color System detected and ready${NC}"
fi

echo ""
echo -e "${PURPLE}🚢 Launching Noah's Ark vessel...${NC}"

# Start the Tip Jar Ark Game Master
echo -e "${BLUE}👑 Starting Game Master controls...${NC}"
node tip-jar-ark-game-master.js &
GAMEMASTER_PID=$!

# Wait a moment for startup
sleep 2

# Check if it started successfully
if ps -p $GAMEMASTER_PID > /dev/null; then
    echo -e "${GREEN}✅ Tip Jar Ark Game Master is running!${NC}"
    echo ""
    echo -e "${CYAN}🎮 Connection Details:${NC}"
    echo -e "   ${YELLOW}Game Master:${NC}     ws://localhost:9090?gamemaster=true"
    echo -e "   ${YELLOW}Unix Users:${NC}      ws://localhost:9090"
    echo -e "   ${YELLOW}Non-Unix Users:${NC}  ws://localhost:9090"
    echo -e "   ${YELLOW}Unix Colors:${NC}     ws://localhost:8084"
    echo -e "   ${YELLOW}Guardian/Teacher:${NC} ws://localhost:8085"
    echo -e "   ${YELLOW}Tip Jar:${NC}         ws://localhost:9091"
    echo ""
    echo -e "${PURPLE}📊 Ark Capacity:${NC}"
    echo -e "   ${GREEN}Unix Users:${NC}     0/50"
    echo -e "   ${GREEN}Non-Unix Users:${NC} 0/3"
    echo -e "   ${GREEN}Game Master:${NC}    0/1"
    echo -e "   ${GREEN}Total:${NC}          0/54"
    echo ""
    echo -e "${CYAN}🌀 Circular Flow Status:${NC}"
    echo -e "   ${YELLOW}Phase:${NC}      colors → theories → reasoning"
    echo -e "   ${YELLOW}Direction:${NC}  clockwise"
    echo -e "   ${YELLOW}Speed:${NC}      1000ms (normal)"
    echo -e "   ${YELLOW}Status:${NC}     waiting for game master"
    echo ""
    echo -e "${BLUE}💡 Quick Start:${NC}"
    echo -e "   1. Open browser to connect as Game Master:"
    echo -e "      ${CYAN}file://$(pwd)/tip-jar-ark-interface.html${NC}"
    echo -e "   2. Game Master starts circular flow"
    echo -e "   3. Users connect and get forced into circles"
    echo -e "   4. Users try to hack Game Master (and fail)"
    echo -e "   5. Moderators can control the flow"
    echo ""
    echo -e "${RED}🛑 To stop the Ark: ${NC}Ctrl+C or kill $GAMEMASTER_PID"
    echo ""
    echo -e "${PURPLE}⚓ The Tip Jar Ark is ready for boarding!${NC}"
    echo -e "${YELLOW}   Everyone will go in circles between colors, theories, and reasoning...${NC}"
    
    # Keep script running and show logs
    echo ""
    echo -e "${CYAN}📋 Live Ark Status (Ctrl+C to stop):${NC}"
    echo "----------------------------------------"
    
    # Wait for the game master process
    wait $GAMEMASTER_PID
    
else
    echo -e "${RED}❌ Failed to start Tip Jar Ark Game Master${NC}"
    echo -e "${RED}   Check the logs above for error details${NC}"
    exit 1
fi

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🏺 Shutting down Tip Jar Ark...${NC}"
    
    if ps -p $GAMEMASTER_PID > /dev/null; then
        kill $GAMEMASTER_PID
        echo -e "${GREEN}✅ Game Master stopped${NC}"
    fi
    
    echo -e "${PURPLE}⚓ Tip Jar Ark has reached port safely${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# If we get here, the process ended unexpectedly
echo -e "${RED}❌ Tip Jar Ark Game Master stopped unexpectedly${NC}"
cleanup