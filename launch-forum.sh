#!/bin/bash

# 🚀 CAL FORUM LAUNCHER
# Complete forum system startup script

echo "🌟 ==============================================="
echo "🌟        CAL PRODUCTION FORUM LAUNCHER        "
echo "🌟 ==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if API server is already running
API_RUNNING=$(lsof -ti:3334 2>/dev/null)

if [ ! -z "$API_RUNNING" ]; then
    echo -e "${GREEN}✅ API Server already running on port 3334${NC}"
else
    echo -e "${YELLOW}🚀 Starting Production Forum API Server...${NC}"
    
    # Check if the API server file exists
    if [ ! -f "PRODUCTION-FORUM-API-SERVER.js" ]; then
        echo -e "${RED}❌ PRODUCTION-FORUM-API-SERVER.js not found${NC}"
        echo -e "${RED}   Please ensure you're in the correct directory${NC}"
        exit 1
    fi
    
    # Start API server in background
    nohup node PRODUCTION-FORUM-API-SERVER.js > forum-api.log 2>&1 &
    API_PID=$!
    
    echo -e "${GREEN}✅ API Server started (PID: $API_PID)${NC}"
    echo -e "${BLUE}📋 Logs: tail -f forum-api.log${NC}"
    
    # Wait a moment for server to start
    sleep 3
fi

# Check if forum interface exists
if [ ! -f "REAL-FORUM-INTERFACE.html" ]; then
    echo -e "${RED}❌ REAL-FORUM-INTERFACE.html not found${NC}"
    exit 1
fi

echo -e "${PURPLE}🌐 Forum Interface: file://$(pwd)/REAL-FORUM-INTERFACE.html${NC}"
echo -e "${CYAN}📡 API Endpoint: http://localhost:3334/api${NC}"
echo -e "${CYAN}📊 API Dashboard: http://localhost:3334/dashboard${NC}"
echo ""

# System status check
echo -e "${BLUE}🔍 SYSTEM STATUS CHECK${NC}"
echo -e "${BLUE}=====================${NC}"

# Check API health
if curl -s http://localhost:3334/health > /dev/null; then
    echo -e "${GREEN}✅ API Server: Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  API Server: Starting up...${NC}"
    sleep 2
    if curl -s http://localhost:3334/health > /dev/null; then
        echo -e "${GREEN}✅ API Server: Now healthy${NC}"
    else
        echo -e "${RED}❌ API Server: Not responding${NC}"
    fi
fi

# Check database
if [ -f "forum.db" ]; then
    POSTS=$(sqlite3 forum.db "SELECT COUNT(*) FROM forum_posts;" 2>/dev/null || echo "0")
    REPLIES=$(sqlite3 forum.db "SELECT COUNT(*) FROM forum_replies;" 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Database: Connected (${POSTS} posts, ${REPLIES} replies)${NC}"
else
    echo -e "${YELLOW}⚠️  Database: Will be created on first post${NC}"
fi

echo ""
echo -e "${CYAN}🎮 FORUM FEATURES${NC}"
echo -e "${CYAN}=================${NC}"
echo -e "${GREEN}✨ Real-time auto-refresh every 10 seconds${NC}"
echo -e "${GREEN}✨ WebSocket live updates${NC}"
echo -e "${GREEN}✨ RNG Reply System: Normal (70%), Rare (25%), Legendary (5%)${NC}"
echo -e "${GREEN}✨ Visual indicators for reply rarities${NC}"
echo -e "${GREEN}✨ Complete request tracing and observability${NC}"
echo -e "${GREEN}✨ ASCII art support for legendary responses${NC}"
echo ""

# Open forum interface
echo -e "${PURPLE}🌟 Opening Cal Production Forum...${NC}"

# Try different browsers/methods to open the HTML file
if command -v open &> /dev/null; then
    # macOS
    open "REAL-FORUM-INTERFACE.html"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "REAL-FORUM-INTERFACE.html"
elif command -v start &> /dev/null; then
    # Windows
    start "REAL-FORUM-INTERFACE.html"
else
    echo -e "${YELLOW}⚠️  Could not auto-open browser${NC}"
    echo -e "${CYAN}   Manual: Open REAL-FORUM-INTERFACE.html in your browser${NC}"
fi

echo ""
echo -e "${GREEN}🎉 FORUM SYSTEM READY!${NC}"
echo ""
echo -e "${BLUE}💡 QUICK ACTIONS:${NC}"
echo -e "   🔄 Refresh API logs: tail -f forum-api.log"
echo -e "   📊 View API dashboard: open http://localhost:3334/dashboard"
echo -e "   🔧 API health check: curl http://localhost:3334/health"
echo -e "   ⚡ Test post creation: curl -X POST http://localhost:3334/api/forum/post -H 'Content-Type: application/json' -d '{\"username\":\"TestUser\",\"content\":\"Hello Cal Forum!\"}'"
echo ""
echo -e "${PURPLE}🛑 TO STOP: kill \$(lsof -ti:3334)${NC}"
echo ""
echo -e "${CYAN}✨ Have fun with your legendary Cal Forum! ✨${NC}"