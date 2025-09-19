#!/bin/bash
# start-unified-dashboard.sh - Launch the unified game data dashboard system

echo "🚀 Starting Unified Game Data Dashboard System..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Start services in order
echo -e "\n${YELLOW}1. Starting Reasoning Differential Layer...${NC}"
node FinishThisIdea/reasoning-differential-layer.js &
REASONING_PID=$!
sleep 2

echo -e "\n${YELLOW}2. Starting Game Data Bridge...${NC}"
node game-data-bridge.js &
BRIDGE_PID=$!
sleep 2

echo -e "\n${YELLOW}3. Testing Dynamic RNG Machine...${NC}"
node differential-rng-machine.js

echo -e "\n${GREEN}✅ All services started!${NC}"
echo "================================================"
echo ""
echo "🎮 Access Points:"
echo "  - Unified Dashboard: file://$PWD/unified-game-data-dashboard.html"
echo "  - Soulfra Admin: file://$PWD/soulfra-admin-dashboard.html"
echo "  - Reasoning Layer: http://localhost:9400"
echo "  - Data Bridge: http://localhost:8082"
echo ""
echo "📊 Features:"
echo "  - Play the game while watching backend data in real-time"
echo "  - Excel-like interface shows all events, items, combat, economy"
echo "  - AI reasoning shows WHY things happen (confidence affects drops)"
echo "  - Dynamic loot tables adjust based on performance"
echo "  - Encrypted/decrypted data shown side-by-side"
echo "  - Export game data to CSV for analysis"
echo ""
echo "🎯 Quick Test:"
echo "  1. Open the Unified Dashboard in your browser"
echo "  2. Use arrow keys or WASD to move the player"
echo "  3. Click to attack (70% chance of loot drop)"
echo "  4. Watch the Excel-like data update in real-time"
echo "  5. Check AI reasoning overlay for decision explanations"
echo ""
echo "Press Ctrl+C to stop all services"

# Open dashboards in browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 1
    open "file://$PWD/unified-game-data-dashboard.html"
    open "file://$PWD/soulfra-admin-dashboard.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "file://$PWD/unified-game-data-dashboard.html"
        xdg-open "file://$PWD/soulfra-admin-dashboard.html"
    fi
fi

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $REASONING_PID 2>/dev/null
    kill $BRIDGE_PID 2>/dev/null
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    sleep 1
done