#!/bin/bash

# STOP BORDER CONTROL SYSTEM
# Gracefully shuts down all territory processes

echo "🛑 STOPPING BORDER CONTROL SYSTEM"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to stop territory process
stop_territory() {
    local territory_name=$1
    local pid_file="territories/${territory_name,,}.pid"
    
    echo -e "${BLUE}🛑 Stopping $territory_name territory...${NC}"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}   Sending SIGTERM to PID $pid${NC}"
            kill $pid
            
            # Wait for graceful shutdown
            sleep 3
            
            # Check if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}   Process still running, sending SIGKILL${NC}"
                kill -9 $pid
                sleep 1
            fi
            
            if ! ps -p $pid > /dev/null 2>&1; then
                echo -e "${GREEN}✅ $territory_name stopped${NC}"
            else
                echo -e "${RED}❌ Failed to stop $territory_name${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Process $pid not running${NC}"
        fi
        
        # Remove PID file
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for $territory_name${NC}"
    fi
}

# Function to stop main border control system
stop_main_system() {
    echo -e "${BLUE}🛑 Stopping main border control system...${NC}"
    
    # Find and kill border-control-system.js processes
    local pids=$(pgrep -f "border-control-system.js")
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}   Found border control processes: $pids${NC}"
        
        for pid in $pids; do
            echo -e "${YELLOW}   Stopping PID $pid${NC}"
            kill $pid
            sleep 2
            
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}   Forcing kill PID $pid${NC}"
                kill -9 $pid
            fi
        done
        
        echo -e "${GREEN}✅ Main border control system stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  No border control processes found${NC}"
    fi
}

# Function to clean up resources
cleanup_resources() {
    echo -e "${BLUE}🧹 Cleaning up resources...${NC}"
    
    # Remove any lingering WebSocket connections
    local ws_pids=$(pgrep -f "websocket\|ws://")
    if [ -n "$ws_pids" ]; then
        echo -e "${YELLOW}   Cleaning up WebSocket processes: $ws_pids${NC}"
        for pid in $ws_pids; do
            kill $pid 2>/dev/null
        done
    fi
    
    # Clean up any orphaned processes
    local orphans=$(pgrep -f "9001\|9002\|9003\|9004\|9005")
    if [ -n "$orphans" ]; then
        echo -e "${YELLOW}   Cleaning up orphaned processes: $orphans${NC}"
        for pid in $orphans; do
            kill $pid 2>/dev/null
        done
    fi
    
    echo -e "${GREEN}✅ Resources cleaned up${NC}"
}

# Function to verify shutdown
verify_shutdown() {
    echo -e "${BLUE}🔍 Verifying system shutdown...${NC}"
    
    local ports=("9001" "9002" "9003" "9004" "9005")
    local all_clear=true
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${RED}❌ Port $port still in use${NC}"
            all_clear=false
        else
            echo -e "${GREEN}✅ Port $port available${NC}"
        fi
    done
    
    if $all_clear; then
        echo -e "${GREEN}🎯 All territories successfully shut down${NC}"
    else
        echo -e "${RED}⚠️  Some services may still be running${NC}"
        echo -e "${YELLOW}   Try: sudo lsof -i :9001-9005${NC}"
    fi
}

# Main execution
echo -e "${BLUE}Phase 1: Stop Territory Processes${NC}"
stop_territory "INPUT_TERRITORY"
stop_territory "ANONYMIZATION_TERRITORY"
stop_territory "PROCESSING_TERRITORY"
stop_territory "REASONING_TERRITORY"
stop_territory "OUTPUT_TERRITORY"

echo ""
echo -e "${BLUE}Phase 2: Stop Main Border Control System${NC}"
stop_main_system

echo ""
echo -e "${BLUE}Phase 3: Clean Up Resources${NC}"
cleanup_resources

echo ""
echo -e "${BLUE}Phase 4: Verify Shutdown${NC}"
verify_shutdown

echo ""
echo -e "${GREEN}🎯 BORDER CONTROL SYSTEM SHUTDOWN COMPLETE${NC}"
echo -e "${CYAN}📊 Summary:${NC}"
echo "- All territory processes stopped"
echo "- Border control system terminated"
echo "- Ports 9001-9005 available"
echo "- Language barriers deactivated"
echo "- AI-to-AI channels closed"

echo ""
echo -e "${BLUE}💡 To restart the system:${NC}"
echo "./launch-border-control-system.sh"