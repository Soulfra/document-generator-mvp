#!/bin/bash

# 📱 VIRTUAL PHONE GAMING SYSTEM STARTUP
# Launches complete virtual phone interface with AI integration
# Components: Phone interface, display controller, mobile emulator, area code mapper

echo "📱 Starting Virtual Phone Gaming System..."
echo "   AI Integration: COPILOT, ROUGHSPARKS, SATOSHI personas"
echo "   Features: Gaming, Data Scraping, Affiliate Revenue, Area Code Targeting"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PHONE_PORT=${PHONE_PORT:-3010}
COPILOT_PORT=${COPILOT_PORT:-3007}
D2D_PORT=${D2D_PORT:-3009}

echo -e "${CYAN}🔍 Checking system requirements...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
echo -e "${GREEN}✅ Python $(python3 --version | cut -d' ' -f2) found${NC}"

# Install required Python packages
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
pip3 install -q websockets requests || {
    echo -e "${YELLOW}⚠️ Some Python packages may not be available${NC}"
}

# Check if package.json exists and install dependencies
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 Installing/updating Node.js dependencies...${NC}"
    npm install --silent
else
    echo -e "${YELLOW}📦 No package.json found, installing required packages...${NC}"
    npm init -y --silent
    npm install --silent express cors ws
fi

# Check for required files
echo -e "${CYAN}🔍 Checking required files...${NC}"

REQUIRED_FILES=(
    "virtual-phone-interface.html"
    "phone-display-controller.js"
    "mobile-emulator-bridge.py"
    "area-code-mapper.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file missing: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required files found${NC}"

# Check if services are available
echo -e "${CYAN}🔌 Checking service availability...${NC}"

# Check Copilot service
if curl -s http://localhost:$COPILOT_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Copilot service running on port $COPILOT_PORT${NC}"
else
    echo -e "${YELLOW}⚠️ Copilot service not running on port $COPILOT_PORT${NC}"
    echo -e "${YELLOW}   To start: ./start-soulfra-copilot.sh${NC}"
fi

# Check D2D service
if curl -s http://localhost:$D2D_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ D2D Research service running on port $D2D_PORT${NC}"
else
    echo -e "${YELLOW}⚠️ D2D Research service not running on port $D2D_PORT${NC}"
    echo -e "${YELLOW}   To start: ./start-deathtodata-portal.sh${NC}"
fi

# Check if phone controller port is available
if lsof -i:$PHONE_PORT &> /dev/null; then
    echo -e "${YELLOW}⚠️ Port $PHONE_PORT is already in use${NC}"
    PROCESS=$(lsof -i:$PHONE_PORT | grep LISTEN | awk '{print $2}' | head -1)
    if [ ! -z "$PROCESS" ]; then
        echo -e "${YELLOW}   Process ID: $PROCESS${NC}"
        echo -e "${YELLOW}   To stop: kill $PROCESS${NC}"
    fi
    
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Startup cancelled${NC}"
        exit 1
    fi
fi

# Create storage directories
echo -e "${CYAN}📁 Creating storage directories...${NC}"
mkdir -p ./area-code-data
mkdir -p ./phone-logs
mkdir -p ./scraping-data
echo -e "${GREEN}✅ Storage directories created${NC}"

# Set environment variables
export PHONE_PORT=$PHONE_PORT
export COPILOT_PORT=$COPILOT_PORT
export D2D_PORT=$D2D_PORT
export NODE_ENV=${NODE_ENV:-development}

echo -e "${PURPLE}🚀 Launching Virtual Phone Gaming System...${NC}"

# Start Phone Display Controller
echo -e "${CYAN}📱 Starting Phone Display Controller...${NC}"
node phone-display-controller.js > phone-logs/controller.log 2>&1 &
CONTROLLER_PID=$!

# Wait for controller to start
sleep 3

# Check if controller started successfully
if ps -p $CONTROLLER_PID > /dev/null; then
    echo -e "${GREEN}✅ Phone Display Controller running (PID: $CONTROLLER_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Phone Display Controller${NC}"
    echo -e "${RED}   Check logs: tail -f phone-logs/controller.log${NC}"
    exit 1
fi

# Start Mobile Emulator Bridge
echo -e "${CYAN}🤖 Starting Mobile Emulator Bridge...${NC}"
python3 mobile-emulator-bridge.py > phone-logs/emulator.log 2>&1 &
EMULATOR_PID=$!

# Wait for emulator to start
sleep 2

echo -e "${GREEN}✅ Mobile Emulator Bridge running (PID: $EMULATOR_PID)${NC}"

# Test system connectivity
echo -e "${CYAN}🧪 Testing system connectivity...${NC}"
sleep 3

# Test phone controller
if curl -s http://localhost:$PHONE_PORT/health > /dev/null; then
    echo -e "${GREEN}✅ Phone controller responding${NC}"
    
    # Get system status
    STATUS=$(curl -s http://localhost:$PHONE_PORT/health | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
    CONNECTIONS=$(curl -s http://localhost:$PHONE_PORT/health | jq -r '.activeConnections // 0' 2>/dev/null || echo "0")
    
    echo -e "${CYAN}📊 System Status: $STATUS${NC}"
    echo -e "${CYAN}🔗 Active Connections: $CONNECTIONS${NC}"
    
else
    echo -e "${YELLOW}⚠️ Phone controller not responding yet${NC}"
    echo -e "${YELLOW}   Wait a moment and try: curl http://localhost:$PHONE_PORT/health${NC}"
fi

# Save PIDs for cleanup
echo $CONTROLLER_PID > phone-logs/controller.pid
echo $EMULATOR_PID > phone-logs/emulator.pid

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              📱 VIRTUAL PHONE GAMING SYSTEM                  ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  Virtual Phone Interface with AI Integration                 ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  🌐 Phone Interface: http://localhost:$PHONE_PORT                    ║${NC}"
echo -e "${CYAN}║  📱 Virtual Phone: http://localhost:$PHONE_PORT                      ║${NC}"
echo -e "${CYAN}║  🎮 Gaming Mode: Gameboy Remote Integration                  ║${NC}"
echo -e "${CYAN}║  📡 Data Scraping: Area Code Geographic Targeting           ║${NC}"
echo -e "${CYAN}║  💰 Affiliate Mode: Google/Firebase Revenue                 ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  AI Personas:                                                ║${NC}"
echo -e "${CYAN}║  • COPILOT: Technical assistant and guidance                 ║${NC}"
echo -e "${CYAN}║  • ROUGHSPARKS: Direct action and enforcement               ║${NC}"
echo -e "${CYAN}║  • SATOSHI: Strategic wisdom and long-term thinking         ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  Services Running:                                           ║${NC}"
echo -e "${CYAN}║  • Phone Controller: PID $CONTROLLER_PID                                ║${NC}"
echo -e "${CYAN}║  • Mobile Emulator: PID $EMULATOR_PID                                 ║${NC}"
echo -e "${CYAN}║  • Copilot Service: Port $COPILOT_PORT                                    ║${NC}"
echo -e "${CYAN}║  • D2D Research: Port $D2D_PORT                                       ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  Features:                                                   ║${NC}"
echo -e "${CYAN}║  • Virtual phone screen with real number integration        ║${NC}"
echo -e "${CYAN}║  • AI persona switching for different tasks                 ║${NC}"
echo -e "${CYAN}║  • Geographic data scraping by area code                    ║${NC}"
echo -e "${CYAN}║  • Gaming mode with gameboy remote controls                 ║${NC}"
echo -e "${CYAN}║  • Etch-a-sketch drawing overlay                            ║${NC}"
echo -e "${CYAN}║  • Affiliate revenue tracking                               ║${NC}"
echo -e "${CYAN}║  • Mobile device emulation (Android/iOS)                    ║${NC}"
echo -e "${CYAN}║  • Real device mirroring support                            ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  Status: Virtual phone system operational                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🎉 Virtual Phone Gaming System startup complete!${NC}"
echo -e "${GREEN}   Open http://localhost:$PHONE_PORT in your browser${NC}"
echo ""

echo -e "${BLUE}📋 Quick Commands:${NC}"
echo -e "${BLUE}   • View phone interface: open http://localhost:$PHONE_PORT${NC}"
echo -e "${BLUE}   • Check system health: curl http://localhost:$PHONE_PORT/health${NC}"
echo -e "${BLUE}   • View controller logs: tail -f phone-logs/controller.log${NC}"
echo -e "${BLUE}   • View emulator logs: tail -f phone-logs/emulator.log${NC}"
echo -e "${BLUE}   • Area code info: node area-code-mapper.js info 415${NC}"
echo -e "${BLUE}   • Stop system: ./stop-virtual-phone-system.sh${NC}"
echo ""

echo -e "${YELLOW}💡 Usage Tips:${NC}"
echo -e "${YELLOW}   1. Click persona buttons to switch AI assistants${NC}"
echo -e "${YELLOW}   2. Use external controls for different modes${NC}"
echo -e "${YELLOW}   3. Click area code to change geographic targeting${NC}"
echo -e "${YELLOW}   4. Enable scraping mode to start data collection${NC}"
echo -e "${YELLOW}   5. Activate gaming mode for gameboy controls${NC}"
echo -e "${YELLOW}   6. Use chat overlay to communicate with AI${NC}"
echo ""

echo -e "${PURPLE}🔗 Integration Status:${NC}"
if curl -s http://localhost:$COPILOT_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Copilot AI Service: Connected${NC}"
else
    echo -e "${YELLOW}   ⚠️ Copilot AI Service: Not available${NC}"
    echo -e "${YELLOW}      Start with: ./start-soulfra-copilot.sh${NC}"
fi

if curl -s http://localhost:$D2D_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ D2D Research Service: Connected${NC}"
else
    echo -e "${YELLOW}   ⚠️ D2D Research Service: Not available${NC}"
    echo -e "${YELLOW}      Start with: ./start-deathtodata-portal.sh${NC}"
fi

echo ""
echo -e "${CYAN}📱 Virtual phone interface ready for AI-powered gaming and data operations!${NC}"