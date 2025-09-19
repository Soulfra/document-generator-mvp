#!/bin/bash

# 🚀 UNIFIED SYSTEM STARTUP SCRIPT
# Launches all 80+ Document Generator services in correct dependency order
# With health checks and failure detection

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_TIMEOUT=30
STARTUP_LOG="./logs/unified-startup-$(date +%Y%m%d-%H%M%S).log"
PID_DIR="./pids"

# Create directories
mkdir -p logs pids

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR")   echo -e "${RED}[ERROR]${NC} $timestamp: $message" | tee -a "$STARTUP_LOG" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $timestamp: $message" | tee -a "$STARTUP_LOG" ;;
        "WARN")    echo -e "${YELLOW}[WARN]${NC} $timestamp: $message" | tee -a "$STARTUP_LOG" ;;
        "INFO")    echo -e "${BLUE}[INFO]${NC} $timestamp: $message" | tee -a "$STARTUP_LOG" ;;
        "STEP")    echo -e "${CYAN}[STEP]${NC} $timestamp: $message" | tee -a "$STARTUP_LOG" ;;
    esac
}

# Health check function
health_check() {
    local service_name=$1
    local port=$2
    local endpoint=${3:-"/health"}
    local max_attempts=${4:-10}
    
    log "INFO" "Health checking $service_name on port $port..."
    
    for attempt in $(seq 1 $max_attempts); do
        if curl -s -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            log "SUCCESS" "$service_name is healthy (attempt $attempt/$max_attempts)"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            log "WARN" "$service_name not ready, waiting... (attempt $attempt/$max_attempts)"
            sleep 3
        fi
    done
    
    log "ERROR" "$service_name failed health check after $max_attempts attempts"
    return 1
}

# Port check function
port_check() {
    local port=$1
    netstat -ln | grep ":$port " > /dev/null 2>&1
}

# Start service function with PID tracking
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    local health_endpoint=${4:-"/health"}
    local working_dir=${5:-"."}
    
    log "STEP" "Starting $service_name..."
    
    # Check if already running
    if port_check $port; then
        log "WARN" "$service_name already running on port $port"
        return 0
    fi
    
    # Start the service
    cd "$working_dir"
    nohup $command > "./logs/${service_name,,}.log" 2>&1 &
    local pid=$!
    echo $pid > "$PID_DIR/${service_name,,}.pid"
    
    # Wait a moment for startup
    sleep 2
    
    # Health check
    if health_check "$service_name" $port "$health_endpoint"; then
        log "SUCCESS" "$service_name started successfully (PID: $pid)"
        return 0
    else
        log "ERROR" "$service_name failed to start properly"
        kill $pid 2>/dev/null || true
        return 1
    fi
}

# Main startup sequence
main() {
    log "INFO" "🚀 UNIFIED SYSTEM STARTUP INITIATED"
    log "INFO" "Log file: $STARTUP_LOG"
    echo ""
    
    # PHASE 1: Infrastructure (Databases already running via Docker)
    log "STEP" "=== PHASE 1: INFRASTRUCTURE VERIFICATION ==="
    
    # Verify Docker services
    if ! docker ps | grep -q "document-generator-postgres"; then
        log "ERROR" "PostgreSQL container not running. Start with: docker-compose up -d"
        exit 1
    fi
    
    if ! docker ps | grep -q "document-generator-redis"; then
        log "ERROR" "Redis container not running. Start with: docker-compose up -d"
        exit 1
    fi
    
    if ! docker ps | grep -q "document-generator-minio"; then
        log "ERROR" "MinIO container not running. Start with: docker-compose up -d"
        exit 1
    fi
    
    log "SUCCESS" "All database infrastructure verified"
    echo ""
    
    # PHASE 2: Core Services
    log "STEP" "=== PHASE 2: CORE SERVICES ==="
    
    # System Monitor (must start first for monitoring)
    if [ -f "system-monitor-service.js" ]; then
        start_service "SystemMonitor" "node system-monitor-service.js" 9200 "/" || true
    fi
    
    # Unified Auth Service
    if [ -f "unified-auth-service.js" ]; then
        start_service "UnifiedAuth" "node unified-auth-service.js 3600" 3600 "/health" || true
    fi
    
    # Security Layer
    if [ -f "UNFUCKWITHABLE-SECURITY-LAYER.js" ]; then
        start_service "SecurityLayer" "node UNFUCKWITHABLE-SECURITY-LAYER.js 7200" 7200 "/" || true
    fi
    
    echo ""
    
    # PHASE 3: AI Services
    log "STEP" "=== PHASE 3: AI & AGENT SERVICES ==="
    
    # AI API Service
    if [ -f "ai-api-service.js" ]; then
        start_service "AIAPIService" "node ai-api-service.js" 3001 "/health" || true
    fi
    
    # Sovereign Agents Service
    if [ -f "sovereign-agents-service.js" ]; then
        start_service "SovereignAgents" "node sovereign-agents-service.js" 8085 "/health" || true
    fi
    
    # Agent Employment System
    if [ -f "agent-employment-commission-orchestrator.js" ]; then
        start_service "AgentEmployment" "node agent-employment-commission-orchestrator.js" 8086 "/status" || true
    fi
    
    echo ""
    
    # PHASE 4: Real-time & Communication
    log "STEP" "=== PHASE 4: REAL-TIME SYSTEMS ==="
    
    # WebSocket Services
    if [ -f "websocket-server.js" ]; then
        start_service "WebSocketServer" "node websocket-server.js" 8081 "/" || true
    fi
    
    # Unified Notification Router
    if [ -f "unified-notification-router.js" ]; then
        start_service "NotificationRouter" "node unified-notification-router.js" 8091 "/" || true
    fi
    
    # Event Bus
    if [ -f "event-bus.js" ]; then
        start_service "EventBus" "node event-bus.js" 8082 "/health" || true
    fi
    
    echo ""
    
    # PHASE 5: Document Processing
    log "STEP" "=== PHASE 5: DOCUMENT PROCESSING ==="
    
    # Template Processor (MCP Service)
    if [ -d "mcp" ]; then
        cd mcp
        start_service "TemplateProcessor" "npm start" 3000 "/health" "mcp" || true
        cd ..
    fi
    
    # Platform Hub
    if [ -f "platform-hub.js" ]; then
        start_service "PlatformHub" "node platform-hub.js" 8080 "/" || true
    fi
    
    # Analytics Service
    if [ -f "analytics-service.js" ]; then
        start_service "AnalyticsService" "node analytics-service.js" 3002 "/health" || true
    fi
    
    echo ""
    
    # PHASE 6: Gaming & Economy
    log "STEP" "=== PHASE 6: GAMING & ECONOMY SYSTEMS ==="
    
    # Gaming Platform
    if [ -f "gaming-platform.js" ]; then
        start_service "GamingPlatform" "node gaming-platform.js" 8800 "/health" || true
    fi
    
    # Persistent Tycoon
    if [ -f "working-persistent-tycoon.js" ]; then
        start_service "PersistentTycoon" "node working-persistent-tycoon.js" 7090 "/" || true
    fi
    
    # Gacha System
    if [ -f "gacha-token-system.js" ]; then
        start_service "GachaSystem" "node gacha-token-system.js" 7300 "/health" || true
    fi
    
    # Cheat Engine
    if [ -f "cheat-code-gaming-system.js" ]; then
        start_service "CheatEngine" "node cheat-code-gaming-system.js" 7100 "/status" || true
    fi
    
    echo ""
    
    # PHASE 7: External Integrations
    log "STEP" "=== PHASE 7: EXTERNAL INTEGRATIONS ==="
    
    # Discord Bot (if FinishThisIdea-Complete exists)
    if [ -d "FinishThisIdea-Complete" ]; then
        cd FinishThisIdea-Complete
        if [ -f "package.json" ]; then
            start_service "DiscordBot" "npm run start:discord" 3610 "/health" "FinishThisIdea-Complete" || true
        fi
        cd ..
    fi
    
    # Telegram Bot
    if [ -d "FinishThisIdea-Complete" ]; then
        cd FinishThisIdea-Complete
        if [ -f "package.json" ]; then
            start_service "TelegramBot" "npm run start:telegram" 3611 "/health" "FinishThisIdea-Complete" || true
        fi
        cd ..
    fi
    
    echo ""
    
    # PHASE 8: Monitoring & Visualization
    log "STEP" "=== PHASE 8: MONITORING & VISUALIZATION ==="
    
    # Prometheus (if available)
    if [ -f "prometheus.yml" ]; then
        start_service "Prometheus" "prometheus --config.file=prometheus.yml" 9090 "/-/healthy" || true
    fi
    
    # Grafana (if available)
    if [ -d "grafana" ]; then
        start_service "Grafana" "grafana-server --homepath=./grafana" 3003 "/api/health" || true
    fi
    
    echo ""
    
    # FINAL VERIFICATION
    log "STEP" "=== SYSTEM VERIFICATION ==="
    
    # Count running services
    running_services=0
    total_services=0
    
    # Check each expected port
    ports=(3000 3001 3002 3600 7090 7200 8080 8081 8085 8800 9200 11434)
    
    for port in "${ports[@]}"; do
        total_services=$((total_services + 1))
        if port_check $port; then
            running_services=$((running_services + 1))
            log "SUCCESS" "✅ Service running on port $port"
        else
            log "WARN" "❌ No service on port $port"
        fi
    done
    
    echo ""
    log "INFO" "=== STARTUP SUMMARY ==="
    log "INFO" "Services Running: $running_services/$total_services"
    log "INFO" "Health Dashboard: http://localhost:9200"
    log "INFO" "System Health Dashboard: file://$(pwd)/system-health-dashboard.html"
    log "INFO" "Integration Dashboard: file://$(pwd)/integration-management-dashboard.html"
    log "INFO" "Platform Hub: http://localhost:8080"
    log "INFO" "Template Processor: http://localhost:3000"
    log "INFO" "Ollama AI: http://localhost:11434"
    
    if [ $running_services -gt $((total_services / 2)) ]; then
        log "SUCCESS" "🎉 SYSTEM STARTUP SUCCESSFUL - Most services operational"
        return 0
    else
        log "ERROR" "⚠️  SYSTEM STARTUP PARTIAL - Some services failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log "INFO" "Cleaning up startup script..."
}

trap cleanup EXIT

# Help function
show_help() {
    echo "🚀 Unified System Startup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -s, --status    Show system status"
    echo "  -k, --kill      Kill all managed services"
    echo "  -r, --restart   Restart all services"
    echo ""
    echo "This script starts all Document Generator services in dependency order:"
    echo "  1. Infrastructure verification"
    echo "  2. Core services (Auth, Security, Monitor)"
    echo "  3. AI & Agent systems"
    echo "  4. Real-time communication"
    echo "  5. Document processing"
    echo "  6. Gaming & Economy"
    echo "  7. External integrations"
    echo "  8. Monitoring & Visualization"
    echo ""
}

# Status function
show_status() {
    echo "📊 System Status Report"
    echo "======================"
    
    ports=(3000 3001 3002 3600 7090 7200 8080 8081 8085 8800 9200 11434)
    services=("TemplateProcessor" "AIAPIService" "AnalyticsService" "UnifiedAuth" "PersistentTycoon" "SecurityLayer" "PlatformHub" "WebSocketServer" "SovereignAgents" "GamingPlatform" "SystemMonitor" "Ollama")
    
    running=0
    for i in "${!ports[@]}"; do
        port=${ports[$i]}
        service=${services[$i]}
        
        if port_check $port; then
            echo -e "${GREEN}✅ $service${NC} - Port $port"
            running=$((running + 1))
        else
            echo -e "${RED}❌ $service${NC} - Port $port"
        fi
    done
    
    echo ""
    echo "Running: $running/${#ports[@]} services"
    
    # Docker services
    echo ""
    echo "Database Infrastructure:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep document-generator || echo "No database containers running"
}

# Kill function
kill_services() {
    log "WARN" "Killing all managed services..."
    
    if [ -d "$PID_DIR" ]; then
        for pidfile in "$PID_DIR"/*.pid; do
            if [ -f "$pidfile" ]; then
                pid=$(cat "$pidfile")
                service_name=$(basename "$pidfile" .pid)
                
                if kill -0 $pid 2>/dev/null; then
                    log "INFO" "Killing $service_name (PID: $pid)"
                    kill $pid
                    rm "$pidfile"
                else
                    log "WARN" "$service_name PID file stale, removing"
                    rm "$pidfile"
                fi
            fi
        done
    fi
    
    log "SUCCESS" "All managed services killed"
}

# Main script logic
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -s|--status)
        show_status
        exit 0
        ;;
    -k|--kill)
        kill_services
        exit 0
        ;;
    -r|--restart)
        kill_services
        sleep 3
        main
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac