#!/bin/bash
# stop-dashboard.sh - Stops the dashboard server

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.dashboard.pid"

# Check if running
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}Dashboard is not running${NC}"
    exit 0
fi

PID=$(cat "$PID_FILE")

# Check if process exists
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${YELLOW}Dashboard process not found (stale PID file)${NC}"
    rm -f "$PID_FILE"
    exit 0
fi

# Stop the process
echo -e "${BLUE}Stopping dashboard server (PID: $PID)...${NC}"
kill "$PID"

# Wait for process to stop
count=0
while ps -p "$PID" > /dev/null 2>&1; do
    sleep 1
    count=$((count + 1))
    if [ $count -gt 10 ]; then
        echo -e "${YELLOW}Process not stopping, forcing...${NC}"
        kill -9 "$PID"
        break
    fi
done

# Clean up
rm -f "$PID_FILE"

echo -e "${GREEN}✓ Dashboard server stopped${NC}"