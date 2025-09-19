#!/bin/bash

# 🚀 ZERO-TOUCH AUTOMATION
# Just run this and everything works automatically

echo "🚀 ZERO-TOUCH DOCUMENT → MVP AUTOMATION"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create necessary directories
echo -e "${BLUE}📁 Creating automation directories...${NC}"
mkdir -p documents uploads inbox ripped-outputs templates

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install express multer cors
fi

# Kill any existing processes on our ports
echo -e "${BLUE}🔧 Cleaning up old processes...${NC}"
lsof -ti:7777 | xargs kill -9 2>/dev/null || true
lsof -ti:9999 | xargs kill -9 2>/dev/null || true

# Start all services
echo -e "${GREEN}🚀 Starting all automation services...${NC}"

# Start Ultimate Menu Remote
echo -e "${BLUE}🎮 Starting Ultimate Menu Remote (port 7777)...${NC}"
node ultimate-menu-remote.js &
MENU_PID=$!

sleep 2

# Start Full Automation Pipeline
echo -e "${BLUE}🔥 Starting Full Automation Pipeline (port 9999)...${NC}"
node full-automation-pipeline.js &
PIPELINE_PID=$!

sleep 2

# Success message
echo ""
echo -e "${GREEN}✅ ZERO-TOUCH AUTOMATION ACTIVE!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "🎯 Quick Start Options:"
echo ""
echo "1. ${YELLOW}Drop documents here:${NC}"
echo "   → http://localhost:9999"
echo "   → Drag & drop any document to get a live MVP"
echo ""
echo "2. ${YELLOW}Ultimate control panel:${NC}"
echo "   → http://localhost:7777"
echo "   → Single button controls everything"
echo ""
echo "3. ${YELLOW}File system automation:${NC}"
echo "   → Drop files in ./documents folder"
echo "   → They'll be automatically processed"
echo ""
echo "4. ${YELLOW}Command line:${NC}"
echo "   → node automatic-ripping-engine.js <file>"
echo ""
echo -e "${GREEN}🔥 THE AUTOMATION IS LIVE!${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down automation...${NC}"
    kill $MENU_PID 2>/dev/null
    kill $PIPELINE_PID 2>/dev/null
    echo -e "${GREEN}✅ Automation stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Keep script running
wait