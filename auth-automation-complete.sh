#!/bin/bash

# 🔐 AUTH-AUTOMATION COMPLETE SYSTEM
# Everything integrated: auth + automation + workflows + pentest + flagging

echo "🔐 AUTH-INTEGRATED AUTOMATION SYSTEM"
echo "====================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create necessary directories
echo -e "${BLUE}📁 Setting up directories...${NC}"
mkdir -p documents uploads inbox ripped-outputs sessions logs security

# Install dependencies if needed
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install express express-session bcrypt jsonwebtoken cors multer || {
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        echo "Please run: npm install express express-session bcrypt jsonwebtoken cors multer"
        exit 1
    }
fi

# Kill existing processes
echo -e "${BLUE}🔧 Cleaning up existing processes...${NC}"
lsof -ti:8888 | xargs kill -9 2>/dev/null || true
lsof -ti:7777 | xargs kill -9 2>/dev/null || true
lsof -ti:9999 | xargs kill -9 2>/dev/null || true

# Start services in the correct order
echo -e "${GREEN}🚀 Starting auth-integrated automation system...${NC}"

# Start main auth-integrated system
echo -e "${BLUE}🔐 Starting auth-integrated automation (port 8888)...${NC}"
node auth-integrated-automation.js &
AUTH_PID=$!

sleep 3

# Start workflow loops engine
echo -e "${BLUE}🔄 Starting workflow loops engine...${NC}"
node workflow-loops-engine.js &
LOOPS_PID=$!

sleep 2

# Start pen testing verifier
echo -e "${BLUE}🔍 Starting pentest integration verifier...${NC}"
node pentest-integration-verifier.js &
PENTEST_PID=$!

sleep 2

# Start ultimate menu remote (if available)
if [ -f "ultimate-menu-remote.js" ]; then
    echo -e "${BLUE}🎮 Starting ultimate menu remote (port 7777)...${NC}"
    node ultimate-menu-remote.js &
    MENU_PID=$!
fi

sleep 2

# Start automation pipeline (if available)
if [ -f "full-automation-pipeline.js" ]; then
    echo -e "${BLUE}🔥 Starting automation pipeline (port 9999)...${NC}"
    node full-automation-pipeline.js &
    PIPELINE_PID=$!
fi

sleep 3

# Check if services started successfully
check_service() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "   ✅ ${name} is running on port ${port}"
        return 0
    else
        echo -e "   ❌ ${name} failed to start on port ${port}"
        return 1
    fi
}

echo -e "\n${GREEN}📊 Service Status Check:${NC}"
check_service 8888 "Auth-Integrated System"
check_service 7777 "Ultimate Menu Remote" 2>/dev/null || echo -e "   ⏸️ Ultimate Menu Remote (optional)"
check_service 9999 "Automation Pipeline" 2>/dev/null || echo -e "   ⏸️ Automation Pipeline (optional)"

# Success message with usage instructions
echo ""
echo -e "${GREEN}✅ AUTH-INTEGRATED AUTOMATION IS LIVE!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${PURPLE}🔐 PRIMARY INTERFACE:${NC}"
echo -e "   → http://localhost:8888"
echo -e "   → Login: admin / admin123"
echo -e "   → Full auth-protected automation workflows"
echo ""
echo -e "${PURPLE}🎯 WHAT YOU GET:${NC}"
echo -e "   🔐 Secure login/logout with session management"
echo -e "   🔄 Continuous workflow loops waiting for user action"
echo -e "   📄 Document → MVP automation (auth required)"
echo -e "   🔍 Real-time pen testing of all layers"
echo -e "   🚩 Event flagging system for security monitoring"
echo -e "   ⚡ Integration boundary verification"
echo ""
echo -e "${PURPLE}📊 SECONDARY INTERFACES:${NC}"
echo -e "   🎮 Ultimate Control: http://localhost:7777"
echo -e "   🔥 File Upload: http://localhost:9999"
echo ""
echo -e "${PURPLE}🔄 HOW IT WORKS:${NC}"
echo -e "   1. Login to access the system"
echo -e "   2. Upload/process documents through secure workflows"
echo -e "   3. Workflows loop and wait for your approval/input"
echo -e "   4. System continuously pen tests itself"
echo -e "   5. All events are flagged and monitored"
echo -e "   6. Get secure, working MVPs automatically"
echo ""
echo -e "${GREEN}🔥 THIS IS THE COMPLETE AUTOMATION!${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down auth-integrated automation...${NC}"
    
    if [ ! -z "$AUTH_PID" ]; then
        kill $AUTH_PID 2>/dev/null
        echo -e "   ✅ Auth system stopped"
    fi
    
    if [ ! -z "$LOOPS_PID" ]; then
        kill $LOOPS_PID 2>/dev/null
        echo -e "   ✅ Workflow loops stopped"
    fi
    
    if [ ! -z "$PENTEST_PID" ]; then
        kill $PENTEST_PID 2>/dev/null
        echo -e "   ✅ Pen testing stopped"
    fi
    
    if [ ! -z "$MENU_PID" ]; then
        kill $MENU_PID 2>/dev/null
        echo -e "   ✅ Menu remote stopped"
    fi
    
    if [ ! -z "$PIPELINE_PID" ]; then
        kill $PIPELINE_PID 2>/dev/null
        echo -e "   ✅ Pipeline stopped"
    fi
    
    # Clean up any remaining processes
    lsof -ti:8888,7777,9999 | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN}✅ All auth-automation services stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Keep script running and show periodic status
while true; do
    sleep 30
    
    # Show status every 30 seconds
    echo -e "\n${BLUE}📊 System Status ($(date '+%H:%M:%S')):${NC}"
    
    if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "   🔐 Auth System: ✅ ACTIVE"
    else
        echo -e "   🔐 Auth System: ❌ DOWN"
    fi
    
    # Check workflow status by looking for the process
    if ps aux | grep -q "[w]orkflow-loops-engine"; then
        echo -e "   🔄 Workflow Loops: ✅ RUNNING"
    else
        echo -e "   🔄 Workflow Loops: ❌ STOPPED"
    fi
    
    # Check pentest status
    if ps aux | grep -q "[p]entest-integration-verifier"; then
        echo -e "   🔍 Pen Testing: ✅ MONITORING"
    else
        echo -e "   🔍 Pen Testing: ❌ OFFLINE"
    fi
    
    echo -e "   🌐 Primary Access: http://localhost:8888"
done