#!/bin/bash

# 🎮 START UNIFIED GAME ENGINE
# ===========================

echo "🎮 AI TRUST - UNIFIED GAME ENGINE"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Process IDs for cleanup
TRUST_PID=""
MAPPING_PID=""
HTTP_PID=""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down game engine...${NC}"
    
    # Kill processes
    [ ! -z "$TRUST_PID" ] && kill $TRUST_PID 2>/dev/null
    [ ! -z "$MAPPING_PID" ] && kill $MAPPING_PID 2>/dev/null
    [ ! -z "$HTTP_PID" ] && kill $HTTP_PID 2>/dev/null
    
    # Kill by port if needed
    lsof -ti:6666 | xargs kill 2>/dev/null
    lsof -ti:7777 | xargs kill 2>/dev/null
    lsof -ti:8080 | xargs kill 2>/dev/null
    
    echo -e "${GREEN}✅ Game engine shutdown complete${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

echo -e "${BLUE}📋 Step 1: Checking Prerequisites${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

# Check required dependencies
if [ ! -d "node_modules" ] || [ ! -f "node_modules/ws/package.json" ]; then
    echo "Installing required dependencies..."
    npm install ws sqlite3 --save --legacy-peer-deps
fi

echo -e "${GREEN}✅ Prerequisites ready${NC}"

echo ""
echo -e "${BLUE}📋 Step 2: Starting AI Trust System${NC}"

# Check if trust system is already running
if lsof -i :6666 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Trust system already running on port 6666${NC}"
else
    echo "Starting anonymous-ai-handshake-trust-system.js..."
    node anonymous-ai-handshake-trust-system.js &
    TRUST_PID=$!
    echo "Trust system started with PID: $TRUST_PID"
    sleep 3
    
    # Verify it's running
    if ! lsof -i :6666 &> /dev/null; then
        echo -e "${RED}❌ Failed to start trust system${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ AI Trust System online${NC}"

echo ""
echo -e "${BLUE}📋 Step 3: Starting Unified Mapping Engine${NC}"

# Check if mapping engine is already running
if lsof -i :7777 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Mapping engine already running on port 7777${NC}"
else
    echo "Starting unified-mapping-engine.js..."
    node unified-mapping-engine.js &
    MAPPING_PID=$!
    echo "Mapping engine started with PID: $MAPPING_PID"
    sleep 3
    
    # Verify it's running
    if ! lsof -i :7777 &> /dev/null; then
        echo -e "${RED}❌ Failed to start mapping engine${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Unified Mapping Engine online${NC}"

echo ""
echo -e "${BLUE}📋 Step 4: Starting HTTP Server for Game${NC}"

# Check if HTTP server is already running
if lsof -i :8080 &> /dev/null; then
    echo -e "${YELLOW}⚠️  HTTP server already running on port 8080${NC}"
else
    echo "Starting HTTP server for game visualization..."
    python3 -m http.server 8080 --bind 127.0.0.1 > /dev/null 2>&1 &
    HTTP_PID=$!
    echo "HTTP server started with PID: $HTTP_PID"
    sleep 2
fi

echo -e "${GREEN}✅ HTTP Server online${NC}"

echo ""
echo -e "${BLUE}📋 Step 5: Testing System Integration${NC}"

# Test trust system
echo -n "Testing trust system... "
if curl -s http://localhost:6666/trust-status > /dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Test mapping engine WebSocket
echo -n "Testing mapping engine... "
if nc -z localhost 7777 2>/dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Test HTTP server
echo -n "Testing HTTP server... "
if curl -s http://localhost:8080/ > /dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 6: Initializing Game World${NC}"

# Create some initial handshakes for demonstration
echo "Creating demonstration trust relationships..."
for i in {1..3}; do
    curl -s -X POST http://localhost:6666/initiate-handshake > /dev/null
    sleep 1
done

echo -e "${GREEN}✅ Game world initialized with sample data${NC}"

echo ""
echo -e "${PURPLE}🎮 UNIFIED GAME ENGINE LAUNCHED!${NC}"
echo "======================================"
echo ""
echo -e "${GREEN}🌐 Game Visualization: http://localhost:8080/unified-game-visualization.html${NC}"
echo ""
echo "📊 System Status:"
echo "  🤝 Trust System: http://localhost:6666/trust-status"
echo "  🗺️  Mapping Engine: ws://localhost:7777"
echo "  🎯 Game Interface: http://localhost:8080/unified-game-visualization.html"
echo ""
echo -e "${BLUE}🎮 Game Controls:${NC}"
echo "  • WASD or Arrow Keys: Move camera"
echo "  • Mouse Drag: Pan view"
echo "  • Mouse Wheel: Zoom in/out"
echo "  • Spacebar: Trigger new handshake"
echo "  • Control Panel: Right side of screen"
echo ""
echo -e "${YELLOW}🤖 What You'll See:${NC}"
echo "  • Trust nodes (green hexagons) appearing as handshakes occur"
echo "  • Verification bots (various symbols) swarming around trust nodes"
echo "  • AI reasoning stream at the top showing real-time logic"
echo "  • Bot swarm panel at bottom showing active agents"
echo "  • Verification paths connecting related trust relationships"
echo ""

# Open the game in browser
if command -v open &> /dev/null; then
    echo "Opening game in browser..."
    open "http://localhost:8080/unified-game-visualization.html"
elif command -v xdg-open &> /dev/null; then
    echo "Opening game in browser..."
    xdg-open "http://localhost:8080/unified-game-visualization.html"
else
    echo "Please open in your browser: http://localhost:8080/unified-game-visualization.html"
fi

echo ""
echo -e "${GREEN}🎯 The game is now running! Watch as:${NC}"
echo "  1. Trust handshakes create glowing nodes in the game world"
echo "  2. AI reasoning appears explaining why each action is good"
echo "  3. Bot swarms deploy to verify and analyze each trust relationship"
echo "  4. The entire trust network becomes visible as a living game world"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all systems${NC}"

# Keep running and monitoring
echo ""
echo "🔄 Monitoring system activity..."

while true; do
    sleep 30
    
    # Check if services are still running
    if ! lsof -i :6666 &> /dev/null; then
        echo -e "${RED}⚠️  Trust system stopped, restarting...${NC}"
        node anonymous-ai-handshake-trust-system.js &
        TRUST_PID=$!
    fi
    
    if ! lsof -i :7777 &> /dev/null; then
        echo -e "${RED}⚠️  Mapping engine stopped, restarting...${NC}"
        node unified-mapping-engine.js &
        MAPPING_PID=$!
    fi
    
    if ! lsof -i :8080 &> /dev/null; then
        echo -e "${RED}⚠️  HTTP server stopped, restarting...${NC}"
        python3 -m http.server 8080 --bind 127.0.0.1 > /dev/null 2>&1 &
        HTTP_PID=$!
    fi
done