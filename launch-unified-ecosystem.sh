#!/bin/bash

##############################################################################
# SoulFRA Unified Ecosystem Launcher
# 
# This script launches the complete SoulFRA ecosystem including:
# - JavaScript integration systems (WiseOldMan, Character Movement, Integration Bridge)
# - Character movement and collision detection systems
# - Real-time WebSocket communication
# - Unified API gateway at localhost:4000
##############################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
ECOSYSTEM_NAME="SoulFRA Unified Ecosystem"
LOG_DIR="./logs"
PID_DIR="./pids"
INTEGRATION_PORT=4000
MOVEMENT_PORT=8090
WS_PORT=4001

declare -A SERVICE_PIDS=()

print_header() {
    echo -e "${PURPLE}"
    echo "██████╗ ██████╗  ██╗██████╗  ██████╗ ███████╗"
    echo "██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝"
    echo "██████╔╝██████╔╝██║██║  ██║██║  ███╗█████╗  "
    echo "██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝  "
    echo "██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗"
    echo "╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝"
    echo -e "${NC}"
    echo -e "${WHITE}🌉 ${ECOSYSTEM_NAME}${NC}"
    echo -e "${CYAN}Unified Character Movement • OSRS Integration • AI Orchestration${NC}"
    echo ""
}

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[${timestamp}] ℹ️  ${message}${NC}" ;;
        "WARN")  echo -e "${YELLOW}[${timestamp}] ⚠️  ${message}${NC}" ;;
        "ERROR") echo -e "${RED}[${timestamp}] ❌ ${message}${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] ✅ ${message}${NC}" ;;
        "DEBUG") echo -e "${BLUE}[${timestamp}] 🔍 ${message}${NC}" ;;
    esac
    
    # Also log to file
    mkdir -p "$LOG_DIR"
    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_DIR}/ecosystem.log"
}

start_service() {
    local service_name=$1
    local service_command=$2
    local log_file="${LOG_DIR}/${service_name}.log"
    local pid_file="${PID_DIR}/${service_name}.pid"
    
    log "INFO" "Starting ${service_name}..."
    
    # Create directories
    mkdir -p "$LOG_DIR" "$PID_DIR"
    
    # Remove old PID file if exists
    [ -f "$pid_file" ] && rm "$pid_file"
    
    # Start service in background
    bash -c "$service_command" > "$log_file" 2>&1 &
    local service_pid=$!
    
    # Store PID
    echo $service_pid > "$pid_file"
    SERVICE_PIDS[$service_name]=$service_pid
    
    # Give service time to start
    sleep 2
    
    # Check if service is still running
    if kill -0 $service_pid 2>/dev/null; then
        log "SUCCESS" "${service_name} started (PID: $service_pid)"
        return 0
    else
        log "ERROR" "${service_name} failed to start"
        return 1
    fi
}

show_service_status() {
    echo ""
    echo -e "${WHITE}📊 Service Status${NC}"
    echo "=================================="
    
    # Check JavaScript services
    echo -e "${BLUE}🟨 JavaScript Services:${NC}"
    for service in "${!SERVICE_PIDS[@]}"; do
        local pid=${SERVICE_PIDS[$service]}
        
        if kill -0 $pid 2>/dev/null; then
            echo -e "  ✅ ${service} (PID: ${pid})"
        else
            echo -e "  ❌ ${service} (Not running)"
        fi
    done
    echo ""
    
    # Show key endpoints
    echo -e "${BLUE}🌐 Key Endpoints:${NC}"
    echo "  🌉 Integration Bridge:    http://localhost:${INTEGRATION_PORT}"
    echo "  🎮 Character Movement:    ws://localhost:${MOVEMENT_PORT}/character-movement"
    echo "  🔌 WebSocket Bridge:      ws://localhost:${WS_PORT}/bridge"
    echo "  🏆 WiseOldMan Integration: Running in background"
    echo ""
}

cleanup() {
    log "INFO" "Shutting down SoulFRA Ecosystem..."
    
    # Stop JavaScript services
    for service in "${!SERVICE_PIDS[@]}"; do
        local pid_file="${PID_DIR}/${service}.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if kill -0 $pid 2>/dev/null; then
                log "INFO" "Stopping ${service} (PID: $pid)..."
                kill -TERM $pid
                sleep 2
                if kill -0 $pid 2>/dev/null; then
                    kill -KILL $pid
                fi
            fi
            rm -f "$pid_file"
        fi
    done
    
    log "SUCCESS" "SoulFRA Ecosystem shutdown complete"
}

main() {
    case "${1:-start}" in
        "start")
            print_header
            log "INFO" "Starting SoulFRA Unified Ecosystem..."
            
            # Start core JavaScript services
            start_service "character-movement" "node character-movement-system.js"
            sleep 3
            
            start_service "wiseoldman-integration" "node soulfra-wiseoldman-discord-integration.js"
            sleep 2
            
            # Start integration bridge
            start_service "integration-bridge" "node unified-integration-bridge.js"
            sleep 5
            
            echo ""
            log "SUCCESS" "🎉 SoulFRA Ecosystem is ready!"
            show_service_status
            
            echo -e "${GREEN}✨ Quick Start:${NC}"
            echo "  1. Open browser to http://localhost:4000 for system status"
            echo "  2. Character Movement WebSocket: ws://localhost:8090/character-movement"
            echo "  3. Integration API: http://localhost:4000/api"
            echo ""
            echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
            
            # Wait for shutdown signal
            trap cleanup EXIT SIGINT SIGTERM
            
            # Keep script running and show periodic updates
            while true; do
                sleep 30
                echo -e "${BLUE}[$(date '+%H:%M:%S')] System running... (${#SERVICE_PIDS[@]} services active)${NC}"
            done
            ;;
        
        "stop")
            cleanup
            ;;
        
        "status")
            show_service_status
            ;;
        
        *)
            echo "Usage: $0 {start|stop|status}"
            echo ""
            echo "Commands:"
            echo "  start   - Start the complete SoulFRA ecosystem"
            echo "  stop    - Stop all running services"
            echo "  status  - Show current service status"
            exit 1
            ;;
    esac
}

# Trap cleanup on exit
trap cleanup EXIT SIGINT SIGTERM

# Run main function
main "$@"