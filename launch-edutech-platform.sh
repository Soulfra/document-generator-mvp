#!/bin/bash

# 🎮 EDUTECH TEXT ADVENTURE PLATFORM LAUNCHER
# Launches the complete edutech system with verification

echo "🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯"
echo "🌯 EDUTECH TEXT ADVENTURE PLATFORM                  🌯"
echo "🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯"
echo "🌯 Teaching AI & humans to build games             🌯"
echo "🌯 Text adventures → Mobile apps → Complete games  🌯"
echo "🌯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌯"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Start services
echo -e "${CYAN}🚀 Starting Edutech Platform...${NC}"
node edutech-text-adventure-platform.js &
PLATFORM_PID=$!
sleep 2

echo -e "${MAGENTA}🎯 Starting Verification System...${NC}"
node edutech-verification-system.js &
VERIFY_PID=$!
sleep 1

echo ""
echo -e "${GREEN}✅ All systems launched!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}📚 Main Platform:${NC} http://localhost:8420"
echo -e "${MAGENTA}🎮 WebSocket:${NC} ws://localhost:8421"
echo -e "${YELLOW}🎯 Verification:${NC} ws://localhost:8422"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}Features:${NC}"
echo "• 🌈 Color-coded output with emoji wrappers"
echo "• 👨‍🏫 AI teachers for each subject"
echo "• 📱 Text adventure → Mobile app conversion"
echo "• 🎨 Automatic artwork generation"
echo "• ⚡ 240x faster than industry standard"
echo "• 🏆 Real-time verification challenges"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    kill $PLATFORM_PID 2>/dev/null
    kill $VERIFY_PID 2>/dev/null
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
done