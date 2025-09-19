#!/bin/bash

# 🇺🇸 START PATRIOT SYSTEM 🦅
# Launches the complete USA-themed multi-user Document Generator experience

echo "🇺🇸 STARTING PATRIOT DOCUMENT GENERATOR SYSTEM 🦅"
echo "=================================================="
echo ""
echo "🔥 FREEDOM LEVEL: MAXIMUM"
echo "⚡ DEMOCRACY: ACTIVATING"
echo "🎯 MULTI-USER MODE: ENABLED"
echo ""

# Colors for output
RED='\033[0;31m'
WHITE='\033[1;37m'
BLUE='\033[0;34m'
GOLD='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check dependencies
echo -e "${BLUE}📦 Checking patriotic dependencies...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js to serve freedom!${NC}"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Democracy requires package management!${NC}"
    exit 1
fi

# Install required packages if not present
echo -e "${GOLD}📥 Installing required packages for patriotic processing...${NC}"
npm install express ws > /dev/null 2>&1

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo -e "${GOLD}📋 Creating patriotic package.json...${NC}"
    cat > package.json << 'EOF'
{
  "name": "patriot-document-generator",
  "version": "1.0.0",
  "description": "🇺🇸 USA Patriot Document Generator - Multi-user AI-powered freedom machine",
  "main": "patriot-multi-user-server.js",
  "scripts": {
    "start": "node patriot-multi-user-server.js",
    "kafka": "node patriot-kafka-streamer.js",
    "dev": "node patriot-multi-user-server.js"
  },
  "keywords": ["patriot", "document-generator", "ai", "multi-user", "freedom"],
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.13.0"
  }
}
EOF
fi

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        return 1
    else
        return 0
    fi
}

# Kill any existing processes on our ports
echo -e "${GOLD}🧹 Cleaning up existing patriotic processes...${NC}"
pkill -f "patriot-multi-user-server" > /dev/null 2>&1
pkill -f "patriot-kafka-streamer" > /dev/null 2>&1

# Wait a moment for cleanup
sleep 2

# Check if our ports are available
MAIN_PORT=3333
KAFKA_PORT=8765

if ! check_port $MAIN_PORT; then
    echo -e "${RED}❌ Port $MAIN_PORT is occupied! Liberation failed.${NC}"
    echo "Please free port $MAIN_PORT or modify the configuration."
    exit 1
fi

echo -e "${GREEN}✅ All dependencies ready for patriotic service!${NC}"
echo ""

# Start the Kafka streamer in background
echo -e "${BLUE}📡 Starting Patriot Kafka Event Streamer...${NC}"
node patriot-kafka-streamer.js > kafka-streamer.log 2>&1 &
KAFKA_PID=$!
echo -e "${GREEN}✅ Kafka streamer running (PID: $KAFKA_PID)${NC}"

# Wait for Kafka to initialize
sleep 3

# Start the main multi-user server
echo -e "${BLUE}🚀 Starting Patriot Multi-User Server...${NC}"
node patriot-multi-user-server.js &
SERVER_PID=$!
echo -e "${GREEN}✅ Multi-user server starting (PID: $SERVER_PID)${NC}"

# Wait for server to start
echo -e "${GOLD}⏳ Waiting for patriotic systems to initialize...${NC}"
sleep 5

# Check if services are running
if ps -p $KAFKA_PID > /dev/null; then
    echo -e "${GREEN}✅ Kafka Event Streamer: OPERATIONAL${NC}"
else
    echo -e "${RED}❌ Kafka Event Streamer: FAILED${NC}"
fi

if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Multi-User Server: OPERATIONAL${NC}"
else
    echo -e "${RED}❌ Multi-User Server: FAILED${NC}"
    echo "Check the logs for error details."
    exit 1
fi

# Display startup information
echo ""
echo -e "${WHITE}🎆 PATRIOT SYSTEM ACTIVATED! 🎆${NC}"
echo "=================================="
echo ""
echo -e "${GOLD}🌐 Access Points:${NC}"
echo -e "   ${BLUE}Main Dashboard:${NC} http://localhost:$MAIN_PORT"
echo -e "   ${BLUE}WebSocket API:${NC}  ws://localhost:$MAIN_PORT/patriot-ws"
echo -e "   ${BLUE}REST API:${NC}      http://localhost:$MAIN_PORT/api/"
echo ""
echo -e "${GOLD}🤖 AI Characters Active:${NC}"
echo -e "   ${RED}🤖 Ralph${NC}   - Code Analysis Patriot"
echo -e "   ${WHITE}🧠 Cal${NC}     - Learning Liberty Agent"
echo -e "   ${BLUE}🎨 Arty${NC}    - Creative Freedom Fighter"
echo -e "   ${GOLD}⚡ Charlie${NC} - Scanning Democracy Bot"
echo ""
echo -e "${GOLD}🎯 Features Enabled:${NC}"
echo -e "   ${GREEN}✅${NC} Multi-user real-time collaboration"
echo -e "   ${GREEN}✅${NC} AI character interactions"
echo -e "   ${GREEN}✅${NC} File drag & drop processing"
echo -e "   ${GREEN}✅${NC} Token reward system"
echo -e "   ${GREEN}✅${NC} Patriotic theme with animations"
echo -e "   ${GREEN}✅${NC} Kafka event streaming"
echo -e "   ${GREEN}✅${NC} WebSocket real-time updates"
echo ""

# Check if we can open browser automatically
if command -v open &> /dev/null; then
    echo -e "${GOLD}🌐 Opening patriotic dashboard in browser...${NC}"
    sleep 2
    open "http://localhost:$MAIN_PORT" > /dev/null 2>&1
elif command -v xdg-open &> /dev/null; then
    echo -e "${GOLD}🌐 Opening patriotic dashboard in browser...${NC}"
    sleep 2
    xdg-open "http://localhost:$MAIN_PORT" > /dev/null 2>&1
else
    echo -e "${GOLD}🌐 Please open http://localhost:$MAIN_PORT in your browser${NC}"
fi

echo ""
echo -e "${RED}🔥 FREEDOM LEVEL: MAXIMUM 🔥${NC}"
echo -e "${WHITE}⭐ DEMOCRACY: ACTIVE ⭐${NC}"
echo -e "${BLUE}🦅 LIBERTY: OPERATIONAL 🦅${NC}"
echo ""
echo -e "${GOLD}Press Ctrl+C to stop all patriotic services${NC}"

# Create cleanup function
cleanup() {
    echo ""
    echo -e "${GOLD}🛑 Stopping patriotic services...${NC}"
    
    if ps -p $SERVER_PID > /dev/null; then
        kill $SERVER_PID
        echo -e "${GREEN}✅ Multi-user server stopped${NC}"
    fi
    
    if ps -p $KAFKA_PID > /dev/null; then
        kill $KAFKA_PID
        echo -e "${GREEN}✅ Kafka streamer stopped${NC}"
    fi
    
    echo -e "${WHITE}🇺🇸 Thank you for serving freedom! 🇺🇸${NC}"
    echo -e "${GOLD}🦅 LIBERTY PRESERVED 🦅${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
while true; do
    sleep 5
    
    # Check if processes are still running
    if ! ps -p $SERVER_PID > /dev/null; then
        echo -e "${RED}❌ Multi-user server crashed! Restarting...${NC}"
        node patriot-multi-user-server.js &
        SERVER_PID=$!
    fi
    
    if ! ps -p $KAFKA_PID > /dev/null; then
        echo -e "${RED}❌ Kafka streamer crashed! Restarting...${NC}"
        node patriot-kafka-streamer.js > kafka-streamer.log 2>&1 &
        KAFKA_PID=$!
    fi
done