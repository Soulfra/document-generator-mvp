#!/bin/bash

echo "🤝 AI TRUST SYSTEM - PROOF OF CONCEPT"
echo "===================================="
echo ""
echo "This script will prove the AI Trust System works without any complex setup."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

echo "📋 STEP 1: Checking Prerequisites"
echo "---------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found - Please install Node.js first${NC}"
    exit 1
fi

# Check if trust system file exists
if [ -f "anonymous-ai-handshake-trust-system.js" ]; then
    echo -e "${GREEN}✅ Trust system file found${NC}"
else
    echo -e "${RED}❌ Trust system file not found${NC}"
    exit 1
fi

# Check if ports are available
if check_port 6666; then
    echo -e "${YELLOW}⚠️  Port 6666 already in use - killing existing process${NC}"
    kill $(lsof -t -i:6666) 2>/dev/null
    sleep 1
fi

if check_port 6667; then
    echo -e "${YELLOW}⚠️  Port 6667 already in use - killing existing process${NC}"
    kill $(lsof -t -i:6667) 2>/dev/null
    sleep 1
fi

echo ""
echo "🚀 STEP 2: Starting AI Trust System"
echo "-----------------------------------"

# Start the trust system in background
node anonymous-ai-handshake-trust-system.js &
TRUST_PID=$!
echo "Started with PID: $TRUST_PID"

# Wait for system to start
echo "Waiting for system to initialize..."
sleep 3

# Check if process is still running
if kill -0 $TRUST_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Trust system is running${NC}"
else
    echo -e "${RED}❌ Trust system failed to start${NC}"
    exit 1
fi

echo ""
echo "🔍 STEP 3: Testing API Endpoints"
echo "--------------------------------"

# Test HTTP API
echo -n "Testing HTTP API (port 6666)... "
if curl -s http://localhost:6666/trust-status > /dev/null; then
    echo -e "${GREEN}✅ Connected${NC}"
    
    # Show some data
    echo ""
    echo "📊 Current Trust Status:"
    curl -s http://localhost:6666/trust-status | python3 -m json.tool | head -10
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo ""
echo "🤝 STEP 4: Performing Test Handshake"
echo "------------------------------------"

# Perform a handshake
echo "Initiating anonymous handshake..."
HANDSHAKE_RESULT=$(curl -s -X POST http://localhost:6666/initiate-handshake)

if echo "$HANDSHAKE_RESULT" | grep -q "trustEstablished"; then
    echo -e "${GREEN}✅ Handshake successful!${NC}"
    echo ""
    echo "📊 Handshake Result:"
    echo "$HANDSHAKE_RESULT" | python3 -m json.tool
else
    echo -e "${RED}❌ Handshake failed${NC}"
fi

echo ""
echo "💾 STEP 5: Checking Database"
echo "----------------------------"

if [ -f "trust-handshake.db" ]; then
    echo -e "${GREEN}✅ Database file exists${NC}"
    
    # Check database content
    echo ""
    echo "📊 Database Statistics:"
    sqlite3 trust-handshake.db "SELECT 'Total Handshakes: ' || COUNT(*) FROM trust_handshakes;" 2>/dev/null
    sqlite3 trust-handshake.db "SELECT 'Logic Steps Recorded: ' || COUNT(*) FROM logic_traces;" 2>/dev/null
    sqlite3 trust-handshake.db "SELECT 'AI Decisions: ' || COUNT(*) FROM ai_decisions;" 2>/dev/null
else
    echo -e "${YELLOW}⚠️  Database file not found (will be created on first run)${NC}"
fi

echo ""
echo "🌐 STEP 6: Testing Different Access Methods"
echo "-------------------------------------------"

echo ""
echo "1️⃣ BROWSER ACCESS:"
echo "   Open this file in your browser:"
echo "   file://$PWD/test-ai-trust-proof.html"
echo ""
echo "   Or the real-time viewer:"
echo "   file://$PWD/real-time-ai-logic-viewer.html"

echo ""
echo "2️⃣ CHROME EXTENSION:"
echo "   1. Open Chrome"
echo "   2. Go to: chrome://extensions/"
echo "   3. Enable 'Developer mode'"
echo "   4. Click 'Load unpacked'"
echo "   5. Select: $PWD/ai-trust-chrome-extension/"

echo ""
echo "3️⃣ ELECTRON APP:"
echo "   Run: electron . --dev"
echo "   Then check the 'AI Trust' menu"

echo ""
echo "📊 LIVE MONITORING"
echo "-----------------"
echo "The trust system is now running. You can:"
echo ""
echo "- Test handshakes: curl -X POST http://localhost:6666/initiate-handshake"
echo "- Check status: curl http://localhost:6666/trust-status"
echo "- View logs below..."
echo ""
echo "Press Ctrl+C to stop the system"
echo ""
echo "========== LIVE LOGS =========="

# Keep the trust system running and show logs
trap "echo ''; echo 'Stopping trust system...'; kill $TRUST_PID 2>/dev/null; exit" INT

# Tail the process output
wait $TRUST_PID