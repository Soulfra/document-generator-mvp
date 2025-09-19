#!/bin/bash

# Stop Complete Document Generator System

echo "🛑 Stopping Document Generator System"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to stop a service
stop_service() {
    local name=$1
    local pidfile=$2
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
            kill "$pid"
            sleep 1
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${YELLOW}Force stopping $name...${NC}"
                kill -9 "$pid"
            fi
            
            rm -f "$pidfile"
            echo -e "${GREEN}✅ $name stopped${NC}"
        else
            echo -e "${YELLOW}$name was not running (stale PID file)${NC}"
            rm -f "$pidfile"
        fi
    else
        echo -e "${YELLOW}$name PID file not found${NC}"
    fi
}

# Stop all services
echo -e "\n${YELLOW}Stopping services...${NC}"

stop_service "AI Service" ".ai-service_pid"
stop_service "Crypto Vault" ".crypto-vault_pid"
stop_service "Document Generator" ".docgen-server_pid"
stop_service "Ollama" ".ollama_pid"

# Clean up any orphaned Node processes
echo -e "\n${YELLOW}Checking for orphaned processes...${NC}"

# Find processes on our ports
PORTS=(3001 8888 8080 11434)
for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}Found process on port $port (PID: $PID)${NC}"
        kill $PID 2>/dev/null
        echo -e "${GREEN}✅ Killed process on port $port${NC}"
    fi
done

# Update system status
if [ -f ".system-status.json" ]; then
    echo -e "\n${YELLOW}Updating system status...${NC}"
    cat > .system-status.json << EOF
{
  "stopped": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "services": {
    "ollama": {"status": "stopped"},
    "ai-service": {"status": "stopped"},
    "crypto-vault": {"status": "stopped"},
    "document-generator": {"status": "stopped"}
  }
}
EOF
    echo -e "${GREEN}✅ System status updated${NC}"
fi

echo -e "\n${GREEN}🎉 All services stopped!${NC}"
echo -e "\nTo restart the system, run:"
echo "./start-complete-system.sh"