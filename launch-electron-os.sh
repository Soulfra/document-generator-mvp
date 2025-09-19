#!/bin/bash

# 🖥️ Document Generator Electron OS Launcher
# Launches the unified Electron desktop application

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear

echo -e "${BLUE}🖥️ DOCUMENT GENERATOR ELECTRON OS${NC}"
echo "========================================"
echo ""
echo -e "${GREEN}✨ Launching unified desktop application...${NC}"
echo ""

# Check if Electron is installed
if ! command -v electron &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Electron...${NC}"
    npm install -g electron
fi

# Kill any existing Node.js processes to avoid conflicts
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
pkill -f "node.*index.js" || true
pkill -f "node.*ai-reasoning-bridge.js" || true
pkill -f "node.*dashboard-server.js" || true
sleep 2

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found! Please install Docker Desktop${NC}"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker not running! Please start Docker Desktop${NC}"
    exit 1
fi

# Start databases if not running
echo -e "${YELLOW}📦 Starting databases...${NC}"
docker-compose up -d postgres redis minio >/dev/null 2>&1

# Launch Electron OS
echo -e "${GREEN}🚀 Launching Electron OS...${NC}"
echo ""

# Set environment variables
export NODE_ENV=production
export ELECTRON_DEV=false

# Launch Electron app
electron electron-main.js &
ELECTRON_PID=$!

echo -e "${GREEN}🎉 SUCCESS! Document Generator Electron OS is now running!${NC}"
echo "============================================="
echo ""
echo -e "${BLUE}🖥️ Electron OS Features:${NC}"
echo -e "${BLUE}   • Native dashboard windows${NC}"
echo -e "${BLUE}   • Embedded API services${NC}"
echo -e "${BLUE}   • Multi-window support${NC}"
echo -e "${BLUE}   • Real-time data connections${NC}"
echo ""
echo -e "${GREEN}⌨️ Keyboard Shortcuts:${NC}"
echo -e "${BLUE}   • Cmd/Ctrl+1: Main Dashboard${NC}"
echo -e "${BLUE}   • Cmd/Ctrl+2: System Monitor${NC}"
echo -e "${BLUE}   • Cmd/Ctrl+3: Visual Dashboard${NC}"
echo -e "${BLUE}   • Cmd/Ctrl+4: Document Processing${NC}"
echo ""
echo -e "${YELLOW}🛑 To stop: Press Ctrl+C or close the Electron app${NC}"

# Wait for Electron process
wait $ELECTRON_PID
echo -e "${YELLOW}✅ Electron OS stopped${NC}"