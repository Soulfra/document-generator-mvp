#!/bin/bash
#
# Start Socket-Based Document Generator Platform
# Simple launcher for the WebSocket-first experience
#

echo "🚀 STARTING DOCUMENT GENERATOR SOCKET PLATFORM"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SOCKET_PORT=${SOCKET_PORT:-8081}
HTTP_PORT=${HTTP_PORT:-8080}
HOST=${HOST:-localhost}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    ! nc -z localhost "$1" 2>/dev/null
}

# Check Node.js
echo -e "${CYAN}🔍 Checking dependencies...${NC}"
if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 16+ first.${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"

# Check if WebSocket package is available
if ! node -e "require('ws')" 2>/dev/null; then
    echo -e "${YELLOW}📦 Installing WebSocket dependency...${NC}"
    npm install ws
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install WebSocket dependency${NC}"
        exit 1
    fi
fi

# Check ports
echo -e "${CYAN}🔍 Checking ports...${NC}"

if ! port_available $HTTP_PORT; then
    echo -e "${YELLOW}⚠️ Port $HTTP_PORT is in use. Trying alternative...${NC}"
    HTTP_PORT=$((HTTP_PORT + 10))
fi

if ! port_available $SOCKET_PORT; then
    echo -e "${YELLOW}⚠️ Port $SOCKET_PORT is in use. Trying alternative...${NC}"
    SOCKET_PORT=$((SOCKET_PORT + 10))
fi

echo -e "${GREEN}✅ Using HTTP port: $HTTP_PORT${NC}"
echo -e "${GREEN}✅ Using WebSocket port: $SOCKET_PORT${NC}"

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}📦 Creating package.json...${NC}"
    cat > package.json << EOF
{
  "name": "document-generator-socket",
  "version": "1.0.0",
  "description": "Socket-based Document Generator Platform",
  "main": "socket-server.js",
  "scripts": {
    "start": "node socket-server.js",
    "dev": "node socket-server.js"
  },
  "dependencies": {
    "ws": "^8.14.2"
  }
}
EOF
fi

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo ""
echo -e "${CYAN}🚀 STARTING SOCKET PLATFORM${NC}"
echo "============================="
echo ""

# Set environment variables
export HTTP_PORT=$HTTP_PORT
export WS_PORT=$SOCKET_PORT
export HOST=$HOST

# Start the socket server
echo -e "${GREEN}🌐 Starting server...${NC}"
echo -e "${CYAN}📡 WebSocket: ws://$HOST:$SOCKET_PORT${NC}"
echo -e "${CYAN}🌐 HTTP: http://$HOST:$HTTP_PORT${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Check if socket-server.js exists
if [ ! -f "socket-server.js" ]; then
    echo -e "${RED}❌ socket-server.js not found in current directory${NC}"
    echo "Please ensure you're in the Document Generator directory"
    exit 1
fi

# Start the server
node socket-server.js

# If we get here, the server has stopped
echo ""
echo -e "${YELLOW}📡 Socket platform stopped${NC}"
echo -e "${CYAN}Thank you for using Document Generator!${NC}"