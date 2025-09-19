#!/bin/bash

# EMPIRE SYSTEM MANAGER
# Prevents memory leaks and manages the unified platform properly

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PID file locations
BRIDGE_PID_FILE="$SCRIPT_DIR/.bridge.pid"
GATEWAY_PID_FILE="$SCRIPT_DIR/.gateway.pid"

print_header() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}    EMPIRE SYSTEM MANAGER${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo
}

check_docker() {
    echo -e "${YELLOW}Checking Docker services...${NC}"
    
    if docker ps | grep -q "document-generator-postgres"; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "${RED}✗ PostgreSQL is not running${NC}"
        echo -e "${YELLOW}  Run: docker-compose up -d postgres${NC}"
    fi
    
    if docker ps | grep -q "document-generator-redis"; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${RED}✗ Redis is not running${NC}"
        echo -e "${YELLOW}  Run: docker-compose up -d redis${NC}"
    fi
    echo
}

start_services() {
    echo -e "${YELLOW}Starting empire services...${NC}"
    
    # Kill any existing services first
    stop_services
    
    # Start Empire Document Bridge
    echo -e "${BLUE}Starting Empire Document Bridge...${NC}"
    nohup node empire-document-bridge.js > logs/bridge.log 2>&1 &
    echo $! > "$BRIDGE_PID_FILE"
    
    # Wait for bridge to initialize
    echo -e "${YELLOW}Waiting for bridge to discover empire systems...${NC}"
    sleep 5
    
    # Start Unified Empire Gateway
    echo -e "${BLUE}Starting Unified Empire Gateway...${NC}"
    nohup node unified-empire-gateway.js > logs/gateway.log 2>&1 &
    echo $! > "$GATEWAY_PID_FILE"
    
    # Wait for services to be ready
    sleep 3
    
    # Check health
    if curl -s http://localhost:4444/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Services started successfully!${NC}"
        status
    else
        echo -e "${RED}✗ Services failed to start properly${NC}"
        echo -e "${YELLOW}Check logs for details:${NC}"
        echo "  tail -f logs/bridge.log"
        echo "  tail -f logs/gateway.log"
    fi
}

stop_services() {
    echo -e "${YELLOW}Stopping empire services...${NC}"
    
    # Stop gateway
    if [ -f "$GATEWAY_PID_FILE" ]; then
        PID=$(cat "$GATEWAY_PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            echo -e "${GREEN}✓ Stopped gateway (PID: $PID)${NC}"
        fi
        rm -f "$GATEWAY_PID_FILE"
    fi
    
    # Stop bridge
    if [ -f "$BRIDGE_PID_FILE" ]; then
        PID=$(cat "$BRIDGE_PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            echo -e "${GREEN}✓ Stopped bridge (PID: $PID)${NC}"
        fi
        rm -f "$BRIDGE_PID_FILE"
    fi
    
    # Kill any orphaned Node processes running our services
    echo -e "${YELLOW}Cleaning up orphaned processes...${NC}"
    pkill -f "empire-document-bridge.js" 2>/dev/null
    pkill -f "unified-empire-gateway.js" 2>/dev/null
    
    # Count remaining Node processes
    NODE_COUNT=$(ps aux | grep -E "node.*\.js" | grep -v "Visual Studio Code" | grep -v grep | wc -l | tr -d ' ')
    if [ "$NODE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}Warning: $NODE_COUNT Node processes still running${NC}"
        echo -e "${YELLOW}Run './empire-system-manager.sh cleanup' to kill all Node processes${NC}"
    else
        echo -e "${GREEN}✓ All empire services stopped${NC}"
    fi
}

cleanup_all() {
    echo -e "${RED}Killing ALL Node processes (except VS Code)...${NC}"
    ps aux | grep -E "node.*\.js" | grep -v "Visual Studio Code" | grep -v grep | awk '{print $2}' | xargs -I {} kill {} 2>/dev/null
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

status() {
    echo -e "${YELLOW}Empire System Status:${NC}"
    echo
    
    # Check Docker
    check_docker
    
    # Check Bridge
    if [ -f "$BRIDGE_PID_FILE" ] && ps -p $(cat "$BRIDGE_PID_FILE") > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Empire Bridge: Running (PID: $(cat $BRIDGE_PID_FILE))${NC}"
        BRIDGE_STATUS=$(curl -s http://localhost:3333/api/systems 2>/dev/null | jq -r '.totalFiles // "Unknown"')
        echo -e "  ${BLUE}Empire Systems: $BRIDGE_STATUS${NC}"
    else
        echo -e "${RED}✗ Empire Bridge: Not running${NC}"
    fi
    
    # Check Gateway
    if [ -f "$GATEWAY_PID_FILE" ] && ps -p $(cat "$GATEWAY_PID_FILE") > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Unified Gateway: Running (PID: $(cat $GATEWAY_PID_FILE))${NC}"
        HEALTH=$(curl -s http://localhost:4444/api/health 2>/dev/null | jq -r '.status // "Unknown"')
        echo -e "  ${BLUE}Health: $HEALTH${NC}"
    else
        echo -e "${RED}✗ Unified Gateway: Not running${NC}"
    fi
    
    # Show Node processes
    echo
    NODE_COUNT=$(ps aux | grep -E "node.*\.js" | grep -v "Visual Studio Code" | grep -v grep | wc -l | tr -d ' ')
    echo -e "${BLUE}Total Node processes: $NODE_COUNT${NC}"
    
    # Show URLs
    echo
    echo -e "${GREEN}Access URLs:${NC}"
    echo -e "  Dashboard: ${BLUE}http://localhost:4444/${NC}"
    echo -e "  Mobile Games: ${BLUE}http://localhost:4444/real-mobile-game-platform.html${NC}"
    echo -e "  Audit Firm: ${BLUE}http://localhost:4444/real-audit-firm.html${NC}"
    echo -e "  API Health: ${BLUE}http://localhost:4444/api/health${NC}"
    echo -e "  Bridge API: ${BLUE}http://localhost:3333/api/systems${NC}"
}

logs() {
    echo -e "${YELLOW}Viewing logs (Ctrl+C to exit)...${NC}"
    echo
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    case "$1" in
        bridge)
            tail -f logs/bridge.log
            ;;
        gateway)
            tail -f logs/gateway.log
            ;;
        *)
            echo "Tailing both logs..."
            tail -f logs/bridge.log logs/gateway.log
            ;;
    esac
}

# Create logs directory
mkdir -p logs

# Main command handling
print_header

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        echo
        start_services
        ;;
    status)
        status
        ;;
    cleanup)
        cleanup_all
        ;;
    logs)
        logs "$2"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|cleanup|logs [bridge|gateway]}"
        echo
        echo "Commands:"
        echo "  start    - Start empire bridge and gateway services"
        echo "  stop     - Stop all empire services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status and health"
        echo "  cleanup  - Kill ALL Node processes (emergency cleanup)"
        echo "  logs     - View service logs"
        echo
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 status"
        echo "  $0 logs bridge"
        echo "  $0 cleanup"
        ;;
esac

echo