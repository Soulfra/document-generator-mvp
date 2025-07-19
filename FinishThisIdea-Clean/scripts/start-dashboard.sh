#!/bin/bash
# start-dashboard.sh - Starts the real-time dashboard server

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DASHBOARD_DIR="$PROJECT_ROOT/dashboard"
PORT=${DASHBOARD_PORT:-3333}
PID_FILE="$PROJECT_ROOT/.dashboard.pid"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Dashboard already running on PID $PID${NC}"
        echo -e "${GREEN}Access at: http://localhost:$PORT${NC}"
        exit 0
    else
        # Stale PID file
        rm -f "$PID_FILE"
    fi
fi

# Install dependencies if needed
if [ ! -d "$DASHBOARD_DIR/node_modules" ]; then
    echo -e "${BLUE}Installing dashboard dependencies...${NC}"
    cd "$DASHBOARD_DIR"
    npm install express ws
fi

# Start the server
echo -e "${BLUE}Starting dashboard server on port $PORT...${NC}"
cd "$DASHBOARD_DIR"

# Start in background and capture PID
nohup node server.js > "$PROJECT_ROOT/dashboard.log" 2>&1 &
PID=$!

# Save PID
echo $PID > "$PID_FILE"

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dashboard server started successfully!${NC}"
    echo -e "${GREEN}  PID: $PID${NC}"
    echo -e "${GREEN}  URL: http://localhost:$PORT${NC}"
    echo -e "${GREEN}  Log: $PROJECT_ROOT/dashboard.log${NC}"
    echo
    echo "To stop the dashboard:"
    echo "  ./scripts/stop-dashboard.sh"
    echo
    echo "To view logs:"
    echo "  tail -f dashboard.log"
else
    echo -e "${RED}✗ Failed to start dashboard server${NC}"
    echo "Check dashboard.log for errors"
    rm -f "$PID_FILE"
    exit 1
fi