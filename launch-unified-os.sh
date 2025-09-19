#!/bin/bash

echo "🖥️ Launching Document Generator Operating System..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII art banner
cat << 'EOF'

    ███████████████████████████████████████████████████████████
    █                                                         █
    █  🖥️  DOCUMENT GENERATOR OPERATING SYSTEM  🖥️            █
    █                                                         █
    █  One unified interface for your entire AI ecosystem     █
    █                                                         █
    ███████████████████████████████████████████████████████████

EOF

echo -e "${CYAN}🎯 Unified OS Features:${NC}"
echo "   • Desktop environment with windowing system"
echo "   • All services integrated into one screen"
echo "   • Taskbar with running applications"
echo "   • System tray with service status"
echo "   • Start menu for quick access"
echo "   • Desktop icons for main applications"
echo "   • Real-time notifications"
echo ""

# Check dependencies
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if ! npm list ws qrcode &> /dev/null; then
    echo "Installing required packages..."
    npm install ws qrcode
fi

# Kill any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
kill $(lsof -ti:8082) 2>/dev/null || true  # QR-UPC system
kill $(lsof -ti:8084) 2>/dev/null || true  # Bartering system  
kill $(lsof -ti:8085) 2>/dev/null || true  # Ideas NPC

# Create browser launcher script for the unified OS
cat > open-unified-os.sh << 'EOF'
#!/bin/bash
sleep 3
echo "🌐 Opening Document Generator OS..."
if command -v open &> /dev/null; then
    open "file://$(pwd)/unified-operating-system.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "file://$(pwd)/unified-operating-system.html"
else
    echo "📱 Open this file in your browser:"
    echo "file://$(pwd)/unified-operating-system.html"
fi
EOF

chmod +x open-unified-os.sh

echo ""
echo -e "${GREEN}🚀 Starting backend services...${NC}"
echo ""

# Start all backend services in background
echo -e "${PURPLE}🧠 Starting Ideas NPC (Personal Thought Processor)...${NC}"
node personal-idea-extraction-npc.js > /dev/null 2>&1 &
IDEAS_NPC_PID=$!

echo -e "${BLUE}🎯 Starting QR-UPC Reasoning System...${NC}"
node qr-upc-broadcast-reasoning-system.js > /dev/null 2>&1 &
QR_UPC_PID=$!

echo -e "${GREEN}🏛️ Starting Project Bartering System...${NC}"
node live-project-bartering-system.js > /dev/null 2>&1 &
BARTERING_PID=$!

# Wait a moment for services to start
echo -e "${YELLOW}⏳ Waiting for services to initialize...${NC}"
sleep 5

# Open the unified OS interface
echo -e "${CYAN}🖥️ Launching Document Generator OS Interface...${NC}"
./open-unified-os.sh &

echo ""
echo -e "${GREEN}✅ Document Generator OS is now running!${NC}"
echo "================================================================"
echo ""
echo -e "${CYAN}🖥️ UNIFIED OPERATING SYSTEM INTERFACE${NC}"
echo "   • File: unified-operating-system.html"
echo "   • Features: Desktop, taskbar, system tray, start menu"
echo "   • All services integrated into windowed applications"
echo ""
echo -e "${PURPLE}🧠 Backend Services Running:${NC}"
echo "   • Ideas NPC (ws://localhost:8085) - PID: $IDEAS_NPC_PID"
echo "   • QR-UPC Reasoning (ws://localhost:8082) - PID: $QR_UPC_PID"  
echo "   • Project Bartering (ws://localhost:8084) - PID: $BARTERING_PID"
echo ""
echo -e "${BLUE}🎮 How to Use Your Unified OS:${NC}"
echo "   1. 🖱️  Double-click desktop icons to open applications"
echo "   2. 📋 Use the start menu (bottom-left) for all apps"
echo "   3. 📊 Check system tray (bottom-right) for service status"
echo "   4. 🪟 Drag windows around, resize, minimize, maximize"
echo "   5. 📑 Switch between apps using the taskbar"
echo "   6. 🔔 Watch for notifications in the top-left"
echo ""
echo -e "${GREEN}🌟 Integrated Applications:${NC}"
echo "   • 🧠 Ideas NPC - Process your chat logs and thoughts"
echo "   • 🎯 QR Reasoning - Monitor AI reasoning with QR-UPC"
echo "   • 🏛️ Project Bartering - Trade between project ideas"
echo "   • 📄 Document Generator - Main platform (if running)"
echo "   • 🎮 Gaming Universe - Entertainment layer"
echo "   • ⛓️ Blamechain - Blockchain attribution system"
echo ""
echo -e "${YELLOW}💡 Quick Start Guide:${NC}"
echo "   1. Open Ideas NPC and paste some chat logs"
echo "   2. Watch your ideas get extracted and organized"
echo "   3. See them appear as projects in the Bartering system"
echo "   4. Monitor reasoning quality in the QR system"
echo "   5. Use multiple windows simultaneously!"
echo ""
echo -e "${RED}🎯 One Screen, Everything Integrated!${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down Document Generator OS...${NC}"
    kill $IDEAS_NPC_PID 2>/dev/null || true
    kill $QR_UPC_PID 2>/dev/null || true
    kill $BARTERING_PID 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped${NC}"
    echo "Your data and ideas have been saved!"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Keep script running and show status
echo "Press Ctrl+C to stop all services and close the OS..."
echo ""

# Continuous status monitoring
while true; do
    sleep 30
    
    # Check if processes are still running
    if ! kill -0 $IDEAS_NPC_PID 2>/dev/null; then
        echo -e "${RED}⚠️ Ideas NPC has stopped${NC}"
    fi
    
    if ! kill -0 $QR_UPC_PID 2>/dev/null; then
        echo -e "${RED}⚠️ QR-UPC System has stopped${NC}"
    fi
    
    if ! kill -0 $BARTERING_PID 2>/dev/null; then
        echo -e "${RED}⚠️ Bartering System has stopped${NC}"
    fi
done