#!/bin/bash

echo "🧠 UNIFIED AI REASONING VISUALIZER LAUNCHER 🧠"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is required but not installed${NC}"
    exit 1
fi

# Kill any existing processes on our ports
echo -e "${YELLOW}🔧 Cleaning up old processes...${NC}"
lsof -ti:7777 | xargs kill -9 2>/dev/null
lsof -ti:6789 | xargs kill -9 2>/dev/null
lsof -ti:8765 | xargs kill -9 2>/dev/null
sleep 2

# Check if package.json exists, if not create a minimal one
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}📦 Creating package.json...${NC}"
    cat > package.json << EOF
{
  "name": "document-generator-unified",
  "version": "1.0.0",
  "description": "Unified AI Reasoning Visualizer for Document Generator",
  "main": "ai-reasoning-connector.js",
  "scripts": {
    "start": "node ai-reasoning-connector.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "cors": "^2.8.5"
  }
}
EOF
fi

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ] || [ ! -d "node_modules/ws" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install express ws cors --save
fi

echo ""
echo -e "${BLUE}🚀 LAUNCHING SERVICES:${NC}"
echo "====================="
echo ""

# Check if we should also start the Flask backend
if [ -f "ai-reasoning-game-backend.py" ]; then
    echo -e "${GREEN}1️⃣ Starting Flask Game Backend (Port 6789)...${NC}"
    python3 ai-reasoning-game-backend.py > flask-game.log 2>&1 &
    FLASK_PID=$!
    echo -e "   ✅ Flask backend started (PID: $FLASK_PID)"
    sleep 3
fi

# Check if we should start the AI Animation Studio
if [ -f "AI-REASONING-ANIMATION-STUDIO.js" ]; then
    echo ""
    echo -e "${GREEN}2️⃣ Starting AI Animation Studio (Port 8765)...${NC}"
    node AI-REASONING-ANIMATION-STUDIO.js > ai-studio.log 2>&1 &
    STUDIO_PID=$!
    echo -e "   ✅ AI Studio started (PID: $STUDIO_PID)"
    sleep 2
fi

# Start the Unified Visualizer
echo ""
echo -e "${GREEN}3️⃣ Starting Unified AI Reasoning Visualizer (Port 7777)...${NC}"
node ai-reasoning-connector.js &
VISUALIZER_PID=$!
echo -e "   ✅ Visualizer started (PID: $VISUALIZER_PID)"

echo ""
echo "=============================================="
echo -e "${GREEN}🎮 UNIFIED SYSTEM READY!${NC}"
echo ""
echo -e "${BLUE}📍 Access Points:${NC}"
echo "   • Unified Visualizer: http://localhost:7777"
if [ ! -z "$FLASK_PID" ]; then
    echo "   • Flask Game Backend: http://localhost:6789"
fi
if [ ! -z "$STUDIO_PID" ]; then
    echo "   • AI Animation Studio: http://localhost:8765"
fi
echo ""
echo -e "${YELLOW}🎯 Key Features:${NC}"
echo "   • Drop documents to spawn AI entities"
echo "   • Watch AI agents process in real-time"
echo "   • Visual reasoning across multiple zones"
echo "   • Template matching as equipment system"
echo "   • Export through dimensional portals"
echo ""
echo -e "${BLUE}🎮 How to Use:${NC}"
echo "   1. Open http://localhost:7777 in your browser"
echo "   2. Drop documents into the portal"
echo "   3. Watch AI agents reason and process"
echo "   4. Switch between zones with top buttons"
echo "   5. Export processed documents"
echo ""
echo -e "${GREEN}🧠 Architecture:${NC}"
echo "   • Service agents are visual AI entities"
echo "   • Documents become game objects"
echo "   • Processing is shown as combat/movement"
echo "   • Templates are equipment/abilities"
echo "   • Results manifest as visual effects"
echo ""
echo -e "${RED}🛑 To stop all services:${NC}"
if [ ! -z "$FLASK_PID" ] && [ ! -z "$STUDIO_PID" ]; then
    echo "   kill $VISUALIZER_PID $FLASK_PID $STUDIO_PID"
elif [ ! -z "$FLASK_PID" ]; then
    echo "   kill $VISUALIZER_PID $FLASK_PID"
elif [ ! -z "$STUDIO_PID" ]; then
    echo "   kill $VISUALIZER_PID $STUDIO_PID"
else
    echo "   kill $VISUALIZER_PID"
fi
echo ""
echo "=============================================="
echo -e "${GREEN}✨ AI Reasoning IS the Interface! ✨${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    if [ ! -z "$VISUALIZER_PID" ]; then
        kill $VISUALIZER_PID 2>/dev/null
    fi
    if [ ! -z "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null
    fi
    if [ ! -z "$STUDIO_PID" ]; then
        kill $STUDIO_PID 2>/dev/null
    fi
    echo -e "${GREEN}Services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Keep script running
echo "Press Ctrl+C to stop all services..."
wait