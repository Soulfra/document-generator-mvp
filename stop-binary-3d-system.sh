#!/bin/bash

# 🛑 STOP BINARY LOOP 3D SYSTEM

echo "🛑 Stopping Binary Loop 3D System..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Stop all services by reading PID files
if [ -d "logs" ]; then
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            service=$(basename "$pidfile" .pid)
            
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid
                echo -e "${GREEN}✅ Stopped $service (PID: $pid)${NC}"
            else
                echo -e "${RED}⚠️  $service was not running${NC}"
            fi
            
            rm "$pidfile"
        fi
    done
else
    echo -e "${RED}No services found to stop${NC}"
fi

echo -e "${GREEN}✅ All services stopped${NC}"