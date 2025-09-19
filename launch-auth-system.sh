#!/bin/bash

# 🚀 AUTHENTICATION SYSTEM LAUNCHER
# Starts the multi-path authentication backend and serves the QR interface

echo "🔐 Starting Multi-Path Authentication System..."
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

echo -e "\n${BLUE}Checking ports...${NC}"
check_port 9100 || { echo "Please free up port 9100 for auth API"; exit 1; }
check_port 9101 || { echo "Please free up port 9101 for WebSocket"; exit 1; }
check_port 9102 || { echo "Please free up port 9102 for web interface"; exit 1; }

# Start authentication backend
echo -e "\n${GREEN}✅ Starting authentication backend on port 9100...${NC}"
node multi-path-authentication-system.js start &
AUTH_PID=$!

# Give backend time to start
sleep 2

# Start simple HTTP server for the interface
echo -e "\n${GREEN}✅ Starting web interface on port 9102...${NC}"
python3 -m http.server 9102 --bind 127.0.0.1 &
WEB_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $AUTH_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Display access information
echo -e "\n${GREEN}🎉 Authentication System Ready!${NC}"
echo "================================"
echo -e "${BLUE}📱 QR Auth Interface:${NC} http://localhost:9102/qr-auth-interface.html"
echo -e "${BLUE}🔐 Auth API:${NC} http://localhost:9100/health"
echo -e "${BLUE}🔌 WebSocket:${NC} ws://localhost:9101"
echo ""
echo "Features available:"
echo "  • QR Code authentication with device pairing"
echo "  • Touch/NFC authentication simulation"
echo "  • Social login (Google, Discord, Steam)"
echo "  • Traditional username/password"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Test the health endpoint
sleep 1
echo -e "${BLUE}Testing health endpoint...${NC}"
curl -s http://localhost:9100/health | python3 -m json.tool || echo -e "${YELLOW}Health check pending...${NC}"

# Keep script running
while true; do
    sleep 1
done