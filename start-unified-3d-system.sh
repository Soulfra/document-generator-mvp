#!/bin/bash

# ========================================
# UNIFIED 3D SYSTEM STARTUP SCRIPT
# ========================================
# Launches all integrated services:
# - 3D Game Server (port 9000)
# - 3D Perspective Orchestrator (ports 47010/47011) 
# - Game Arena WebSocket (port 47005)
# - AI Services (port 47007)
# - Web Interface
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/Users/matthewmauer/Desktop/Document-Generator"
LOG_DIR="$PROJECT_DIR/logs"
PID_DIR="$PROJECT_DIR/pids"

# Service ports
GAME_SERVER_PORT=9000
ORCHESTRATOR_WS_PORT=47010
ORCHESTRATOR_HTTP_PORT=47011
GAME_WS_PORT=47005
AI_SERVICE_PORT=47007

echo -e "${WHITE}========================================${NC}"
echo -e "${WHITE}🎮 UNIFIED 3D GAME SYSTEM STARTUP${NC}"
echo -e "${WHITE}========================================${NC}"
echo -e "${CYAN}🎥 All perspectives + AI copilot + multiplayer${NC}"
echo -e "${WHITE}========================================${NC}"

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Function to check if port is available
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port already in use (${service})${NC}"
        echo -e "${WHITE}   Attempting to stop existing process...${NC}"
        
        # Kill existing process
        local pid=$(lsof -ti:$port)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            sleep 2
        fi
    fi
}

# Function to start service
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local log_file="$LOG_DIR/$name.log"
    local pid_file="$PID_DIR/$name.pid"
    
    echo -e "${BLUE}🚀 Starting $name...${NC}"
    
    # Start service in background
    eval "$command" > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    
    # Wait for service to start
    sleep 3
    
    # Check if service is running
    if kill -0 $pid 2>/dev/null; then
        if [ ! -z "$port" ]; then
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                echo -e "${GREEN}✅ $name started (PID: $pid, Port: $port)${NC}"
                return 0
            else
                echo -e "${RED}❌ $name failed to bind to port $port${NC}"
                return 1
            fi
        else
            echo -e "${GREEN}✅ $name started (PID: $pid)${NC}"
            return 0
        fi
    else
        echo -e "${RED}❌ $name failed to start${NC}"
        return 1
    fi
}

# Function to stop all services
stop_services() {
    echo -e "\n${YELLOW}🛑 Stopping all services...${NC}"
    
    # Stop services by PID files
    for pid_file in "$PID_DIR"/*.pid; do
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            local service=$(basename "$pid_file" .pid)
            
            if kill -0 $pid 2>/dev/null; then
                echo -e "${BLUE}🛑 Stopping $service (PID: $pid)${NC}"
                kill -TERM $pid 2>/dev/null || true
                
                # Wait for graceful shutdown
                sleep 2
                
                # Force kill if still running
                if kill -0 $pid 2>/dev/null; then
                    kill -9 $pid 2>/dev/null || true
                fi
            fi
            
            rm -f "$pid_file"
        fi
    done
    
    # Kill any remaining processes on our ports
    for port in $GAME_SERVER_PORT $ORCHESTRATOR_WS_PORT $ORCHESTRATOR_HTTP_PORT $GAME_WS_PORT $AI_SERVICE_PORT; do
        local pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pids" ]; then
            echo -e "${YELLOW}🔪 Force killing processes on port $port${NC}"
            echo $pids | xargs kill -9 2>/dev/null || true
        fi
    done
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Function to show status
show_status() {
    echo -e "\n${WHITE}========================================${NC}"
    echo -e "${WHITE}📊 SERVICE STATUS${NC}"
    echo -e "${WHITE}========================================${NC}"
    
    local services=(
        "3d-game-server:$GAME_SERVER_PORT"
        "orchestrator:$ORCHESTRATOR_WS_PORT"
        "orchestrator-http:$ORCHESTRATOR_HTTP_PORT"
        "game-websocket:$GAME_WS_PORT"
        "ai-service:$AI_SERVICE_PORT"
    )
    
    for service_port in "${services[@]}"; do
        local service="${service_port%%:*}"
        local port="${service_port##*:}"
        
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local pid=$(lsof -ti:$port)
            echo -e "${GREEN}✅ $service${NC} - Running on port $port (PID: $pid)"
        else
            echo -e "${RED}❌ $service${NC} - Not running on port $port"
        fi
    done
}

# Function to open web interfaces
open_interfaces() {
    echo -e "\n${WHITE}========================================${NC}"
    echo -e "${WHITE}🌐 OPENING WEB INTERFACES${NC}"
    echo -e "${WHITE}========================================${NC}"
    
    sleep 3  # Wait for services to be ready
    
    # URLs to open
    local urls=(
        "http://localhost:$GAME_SERVER_PORT"
        "http://localhost:$GAME_SERVER_PORT/unified"
        "file://$PROJECT_DIR/unified-3d-game-experience.html"
    )
    
    for url in "${urls[@]}"; do
        echo -e "${CYAN}🌐 Opening: $url${NC}"
        
        # Cross-platform open command
        if command -v open >/dev/null 2>&1; then
            open "$url" 2>/dev/null &
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "$url" 2>/dev/null &
        elif command -v start >/dev/null 2>&1; then
            start "$url" 2>/dev/null &
        else
            echo -e "${YELLOW}   Please manually open: $url${NC}"
        fi
        
        sleep 1
    done
}

# Function to show help
show_help() {
    echo -e "${WHITE}Usage: $0 [COMMAND]${NC}"
    echo
    echo -e "${WHITE}Commands:${NC}"
    echo -e "  ${GREEN}start${NC}     Start all services"
    echo -e "  ${RED}stop${NC}      Stop all services" 
    echo -e "  ${BLUE}restart${NC}   Restart all services"
    echo -e "  ${CYAN}status${NC}    Show service status"
    echo -e "  ${YELLOW}logs${NC}      Show service logs"
    echo -e "  ${PURPLE}clean${NC}     Clean logs and PID files"
    echo
    echo -e "${WHITE}Services:${NC}"
    echo -e "  • 3D Game Server (port $GAME_SERVER_PORT)"
    echo -e "  • 3D Perspective Orchestrator (ports $ORCHESTRATOR_WS_PORT/$ORCHESTRATOR_HTTP_PORT)"
    echo -e "  • Game WebSocket Server (port $GAME_WS_PORT)" 
    echo -e "  • AI Service (port $AI_SERVICE_PORT)"
    echo
    echo -e "${WHITE}Web Interfaces:${NC}"
    echo -e "  • Game Launcher: http://localhost:$GAME_SERVER_PORT"
    echo -e "  • Unified Experience: file://$PROJECT_DIR/unified-3d-game-experience.html"
    echo -e "  • API Status: http://localhost:$ORCHESTRATOR_HTTP_PORT/api/view/current"
}

# Function to show logs
show_logs() {
    echo -e "${WHITE}========================================${NC}"
    echo -e "${WHITE}📝 SERVICE LOGS${NC}"
    echo -e "${WHITE}========================================${NC}"
    
    for log_file in "$LOG_DIR"/*.log; do
        if [ -f "$log_file" ]; then
            local service=$(basename "$log_file" .log)
            echo -e "\n${CYAN}📝 $service logs (last 10 lines):${NC}"
            tail -n 10 "$log_file" 2>/dev/null || echo "No logs yet"
        fi
    done
}

# Function to clean logs and PIDs
clean_files() {
    echo -e "${YELLOW}🧹 Cleaning logs and PID files...${NC}"
    rm -f "$LOG_DIR"/*.log
    rm -f "$PID_DIR"/*.pid
    echo -e "${GREEN}✅ Cleaned${NC}"
}

# Trap to handle script interruption
trap 'stop_services; exit 0' INT TERM

# Main execution
cd "$PROJECT_DIR"

case "${1:-start}" in
    "start")
        echo -e "${GREEN}🚀 Starting Unified 3D System...${NC}"
        
        # Check Node.js
        if ! command -v node >/dev/null 2>&1; then
            echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
            exit 1
        fi
        
        # Check required files
        required_files=(
            "3d-game-server.js"
            "unified-3d-perspective-orchestrator.js"
            "unified-3d-game-experience.html"
        )
        
        for file in "${required_files[@]}"; do
            if [ ! -f "$file" ]; then
                echo -e "${RED}❌ Required file not found: $file${NC}"
                exit 1
            fi
        done
        
        # Check and clear ports
        echo -e "${BLUE}🔍 Checking ports...${NC}"
        check_port $GAME_SERVER_PORT "3D Game Server"
        check_port $ORCHESTRATOR_WS_PORT "Orchestrator WebSocket"
        check_port $ORCHESTRATOR_HTTP_PORT "Orchestrator HTTP"
        check_port $GAME_WS_PORT "Game WebSocket"
        check_port $AI_SERVICE_PORT "AI Service"
        
        # Start services
        echo -e "\n${GREEN}🚀 Starting all services...${NC}"
        
        # Start 3D Game Server
        start_service "3d-game-server" "node 3d-game-server.js" $GAME_SERVER_PORT
        
        # Start 3D Perspective Orchestrator
        start_service "orchestrator" "node unified-3d-perspective-orchestrator.js" $ORCHESTRATOR_WS_PORT
        
        # Start AI Service (mock for now)
        start_service "ai-service" "node -e \"
            const WebSocket = require('ws');
            const wss = new WebSocket.Server({ port: $AI_SERVICE_PORT });
            console.log('🤖 AI Service listening on port $AI_SERVICE_PORT');
            wss.on('connection', (ws) => {
                ws.on('message', (data) => {
                    const msg = JSON.parse(data);
                    ws.send(JSON.stringify({ type: 'ai-response', result: { success: true, message: 'AI command processed' } }));
                });
            });
        \"" $AI_SERVICE_PORT
        
        # Start Game WebSocket Server (mock for now)
        start_service "game-websocket" "node -e \"
            const WebSocket = require('ws');
            const wss = new WebSocket.Server({ port: $GAME_WS_PORT });
            console.log('🎮 Game WebSocket listening on port $GAME_WS_PORT');
            const rooms = new Map();
            wss.on('connection', (ws) => {
                ws.on('message', (data) => {
                    const msg = JSON.parse(data);
                    wss.clients.forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(data);
                        }
                    });
                });
            });
        \"" $GAME_WS_PORT
        
        # Show status
        show_status
        
        # Open web interfaces
        open_interfaces
        
        echo -e "\n${WHITE}========================================${NC}"
        echo -e "${GREEN}✅ UNIFIED 3D SYSTEM READY!${NC}"
        echo -e "${WHITE}========================================${NC}"
        echo -e "${CYAN}🎮 Game Launcher: ${WHITE}http://localhost:$GAME_SERVER_PORT${NC}"
        echo -e "${PURPLE}🎥 3D Experience: ${WHITE}file://$PROJECT_DIR/unified-3d-game-experience.html${NC}"
        echo -e "${BLUE}🤖 AI Copilot: ${WHITE}Available in game interface${NC}"
        echo -e "${YELLOW}📱 All Perspectives: ${WHITE}Sonar, Aerial, FPV, TPV, Cinematic...${NC}"
        echo -e "${WHITE}========================================${NC}"
        echo -e "${GREEN}💡 Try these commands:${NC}"
        echo -e "   • Switch perspectives with perspective buttons"
        echo -e "   • AI commands: 'follow closest entity', 'suggest best view'"
        echo -e "   • Multiplayer: Share room link with friends"
        echo -e "   • Recording: Click record button for HyperCam-style capture"
        echo -e "${WHITE}========================================${NC}"
        echo -e "${CYAN}Press Ctrl+C to stop all services${NC}"
        
        # Keep script running
        echo -e "\n${BLUE}🔄 System running... (Press Ctrl+C to stop)${NC}"
        while true; do
            sleep 10
            
            # Check if all services are still running
            local failed_services=()
            
            for service_port in "3d-game-server:$GAME_SERVER_PORT" "orchestrator:$ORCHESTRATOR_WS_PORT" "ai-service:$AI_SERVICE_PORT" "game-websocket:$GAME_WS_PORT"; do
                local service="${service_port%%:*}"
                local port="${service_port##*:}"
                
                if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                    failed_services+=("$service")
                fi
            done
            
            if [ ${#failed_services[@]} -gt 0 ]; then
                echo -e "\n${RED}⚠️  Service failure detected: ${failed_services[*]}${NC}"
                echo -e "${YELLOW}Run '$0 restart' to restart all services${NC}"
            fi
        done
        ;;
        
    "stop")
        stop_services
        ;;
        
    "restart")
        echo -e "${YELLOW}🔄 Restarting Unified 3D System...${NC}"
        stop_services
        sleep 3
        exec "$0" start
        ;;
        
    "status")
        show_status
        ;;
        
    "logs")
        show_logs
        ;;
        
    "clean")
        stop_services
        clean_files
        ;;
        
    "help"|"-h"|"--help")
        show_help
        ;;
        
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac

exit 0