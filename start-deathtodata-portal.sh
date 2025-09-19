#!/bin/bash

# 🔬 DEATHTODATA RESEARCH PORTAL STARTUP SCRIPT
# Launches the D2D/cringeproof/clarity-engine research arm
# Integration: Soulfra ecosystem research division

echo "🔬 Starting DeathToData Research Portal..."
echo "   Aliases: d2d, cringeproof, clarity-engine"
echo "   Mission: Advanced data analysis and research insights"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
D2D_PORT=${D2D_PORT:-3009}
D2D_HOST=${D2D_HOST:-localhost}

echo -e "${CYAN}🔍 Checking dependencies...${NC}"

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

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
echo -e "${GREEN}✅ npm $(npm --version) found${NC}"

# Check if package.json exists and install dependencies
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"
    npm install
else
    echo -e "${YELLOW}📦 No package.json found, installing required packages...${NC}"
    npm init -y
    npm install express cors ws
fi

# Check if the research portal file exists
if [ ! -f "deathtodata-research-portal.js" ]; then
    echo -e "${RED}❌ deathtodata-research-portal.js not found${NC}"
    echo -e "${RED}   Make sure you're in the correct directory${NC}"
    exit 1
fi

# Create storage directory if it doesn't exist
mkdir -p ./deathtodata-storage/{projects,datasets,insights,reports}
echo -e "${GREEN}✅ Research data storage directories created${NC}"

# Check if port is available
if lsof -i:$D2D_PORT &> /dev/null; then
    echo -e "${YELLOW}⚠️ Port $D2D_PORT is already in use${NC}"
    echo -e "${YELLOW}   The research portal might already be running${NC}"
    echo -e "${YELLOW}   Or another service is using this port${NC}"
    
    # Try to find what's using the port
    PROCESS=$(lsof -i:$D2D_PORT | grep LISTEN | awk '{print $2}' | head -1)
    if [ ! -z "$PROCESS" ]; then
        echo -e "${YELLOW}   Process ID: $PROCESS${NC}"
        echo -e "${YELLOW}   To stop it: kill $PROCESS${NC}"
    fi
    
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Startup cancelled${NC}"
        exit 1
    fi
fi

echo -e "${PURPLE}🚀 Launching DeathToData Research Portal...${NC}"

# Set environment variables
export D2D_PORT=$D2D_PORT
export D2D_HOST=$D2D_HOST
export NODE_ENV=${NODE_ENV:-development}

# Start the research portal service
echo -e "${CYAN}Starting research analysis engine...${NC}"

# Run in background with output to log file
node deathtodata-research-portal.js > deathtodata-portal.log 2>&1 &
PORTAL_PID=$!

# Wait a moment for startup
sleep 3

# Check if the process is still running
if ps -p $PORTAL_PID > /dev/null; then
    echo -e "${GREEN}✅ DeathToData Research Portal is running!${NC}"
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║               🔬 DEATHTODATA RESEARCH PORTAL                ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  Advanced Research & Data Analysis Platform                  ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  🌐 Portal: http://$D2D_HOST:$D2D_PORT                              ║${NC}"
    echo -e "${CYAN}║  🔍 Aliases: d2d, cringeproof, clarity-engine              ║${NC}"
    echo -e "${CYAN}║  🧠 Engine: Clarity Analysis System                         ║${NC}"
    echo -e "${CYAN}║  💾 Storage: ./deathtodata-storage/                         ║${NC}"
    echo -e "${CYAN}║  📋 PID: $PORTAL_PID                                               ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  Research Capabilities:                                      ║${NC}"
    echo -e "${CYAN}║  • Pattern Recognition & Data Mining                        ║${NC}"
    echo -e "${CYAN}║  • Statistical Analysis & Modeling                          ║${NC}"
    echo -e "${CYAN}║  • AI/ML Research & Evaluation                              ║${NC}"
    echo -e "${CYAN}║  • Market Intelligence & Behavioral Analysis                ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  API Endpoints:                                              ║${NC}"
    echo -e "${CYAN}║  • GET  /api/projects - List research projects             ║${NC}"
    echo -e "${CYAN}║  • POST /api/analyze  - Run data analysis                  ║${NC}"
    echo -e "${CYAN}║  • GET  /api/insights - Retrieve insights                  ║${NC}"
    echo -e "${CYAN}║  • GET  /health       - Service health check               ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  Integration: Soulfra Ecosystem Research Division           ║${NC}"
    echo -e "${CYAN}║  Status: Research protocols active                          ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📊 Research portal is ready for data analysis!${NC}"
    echo -e "${YELLOW}📝 View logs: tail -f deathtodata-portal.log${NC}"
    echo -e "${YELLOW}🛑 Stop service: kill $PORTAL_PID${NC}"
    echo ""
    echo -e "${PURPLE}🔬 DeathToData Research Division operational${NC}"
    echo -e "${PURPLE}   Ready to analyze patterns and extract insights${NC}"
    
    # Save PID to file for easy management
    echo $PORTAL_PID > deathtodata-portal.pid
    echo -e "${BLUE}💾 PID saved to deathtodata-portal.pid${NC}"
    
else
    echo -e "${RED}❌ Failed to start DeathToData Research Portal${NC}"
    echo -e "${RED}   Check the logs for errors:${NC}"
    echo -e "${RED}   tail -f deathtodata-portal.log${NC}"
    exit 1
fi

# Test the service
echo -e "${CYAN}🧪 Testing research portal...${NC}"
sleep 2

if curl -s http://$D2D_HOST:$D2D_PORT/health > /dev/null; then
    echo -e "${GREEN}✅ Health check passed - Research portal is responding${NC}"
    
    # Show quick stats
    echo -e "${CYAN}📈 Quick Research Stats:${NC}"
    STATS=$(curl -s http://$D2D_HOST:$D2D_PORT/api/projects | jq -r '.total // "N/A"' 2>/dev/null || echo "N/A")
    echo -e "${CYAN}   Active Projects: $STATS${NC}"
    
else
    echo -e "${YELLOW}⚠️ Health check failed, but service might still be starting${NC}"
    echo -e "${YELLOW}   Wait a moment and try: curl http://$D2D_HOST:$D2D_PORT/health${NC}"
fi

echo ""
echo -e "${GREEN}🎉 DeathToData Research Portal startup complete!${NC}"
echo -e "${GREEN}   Visit http://$D2D_HOST:$D2D_PORT to begin research${NC}"