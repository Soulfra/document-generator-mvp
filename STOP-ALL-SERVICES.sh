#!/bin/bash

# STOP-ALL-SERVICES.sh
# Stops all running blockchain game services

echo "🛑 STOPPING ALL BLOCKCHAIN GAME SERVICES"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            print_status "Stopped $service_name (PID: $pid)"
        else
            print_warning "$service_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_warning "No PID file for $service_name"
    fi
}

# Function to kill process by port
kill_by_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        kill $pid
        print_status "Stopped $service_name on port $port (PID: $pid)"
    else
        print_warning "No process found on port $port for $service_name"
    fi
}

echo ""
echo "Stopping all services..."
echo ""

# Stop services by PID files
kill_by_pid_file "meta-handshake-agreement-layer.pid" "Meta Handshake Layer"
kill_by_pid_file "monero-genesis-explorer.pid" "Monero Genesis Explorer"
kill_by_pid_file "blamechain-interface.pid" "BlameChain Interface"
kill_by_pid_file "game-broadcast-bridge.pid" "Game Broadcast Bridge"
kill_by_pid_file "multi-chain-reasoning-interface.pid" "Multi-Chain Reasoning"
kill_by_pid_file "sumokoin-vault-viewer.pid" "Sumokoin Vault Viewer"
kill_by_pid_file "ganache.pid" "Ganache (Ethereum Node)"

# Also try to kill by known ports (backup method)
echo ""
echo "Checking for any remaining processes on known ports..."
kill_by_port 48015 "Meta Layer"
kill_by_port 48016 "Meta Layer WebSocket"
kill_by_port 48013 "Monero Explorer"
kill_by_port 48014 "Monero Explorer WebSocket"
kill_by_port 48011 "BlameChain"
kill_by_port 48012 "BlameChain WebSocket"
kill_by_port 48017 "Game Bridge"
kill_by_port 48018 "Game Bridge WebSocket"
kill_by_port 48019 "Multi-Chain Reasoning"
kill_by_port 48020 "Multi-Chain Reasoning WebSocket"
kill_by_port 48021 "Sumokoin Vault Viewer"
kill_by_port 8545 "Ethereum Node"

# Clean up log files if they exist
echo ""
echo "Cleaning up log files..."
log_files=(
    "meta-handshake-agreement-layer.log"
    "monero-genesis-explorer.log"
    "blamechain-interface.log"
    "game-broadcast-bridge.log"
    "multi-chain-reasoning-interface.log"
    "sumokoin-vault-viewer.log"
    "ganache.log"
    "verification.log"
)

for log_file in "${log_files[@]}"; do
    if [ -f "$log_file" ]; then
        rm -f "$log_file"
        print_status "Removed $log_file"
    fi
done

# Clean up PID files
pid_files=(
    "meta-handshake-agreement-layer.pid"
    "monero-genesis-explorer.pid"
    "blamechain-interface.pid"
    "game-broadcast-bridge.pid"
    "multi-chain-reasoning-interface.pid"
    "sumokoin-vault-viewer.pid"
    "ganache.pid"
)

for pid_file in "${pid_files[@]}"; do
    if [ -f "$pid_file" ]; then
        rm -f "$pid_file"
        print_status "Removed $pid_file"
    fi
done

echo ""
print_status "✅ All services stopped and cleaned up!"
echo ""
echo "To restart the system, run:"
echo "   ./PROVE-IT-WORKS.sh"
echo ""

exit 0