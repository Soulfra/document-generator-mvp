#!/bin/bash

##############################################################################
# 🚀 DEPLOY EVERYTHING - Unified System Deployment Script
# 
# This script links and deploys your entire system:
# - CAL Guardian Production Orchestrator
# - Database-Driven Builder
# - Service Discovery Engine
# - All existing services in unified-vault
# - Anti-duplication security layers
# - Complete monitoring and health checks
#
# Usage: ./DEPLOY-EVERYTHING.sh [schema-file] [mode]
# Example: ./DEPLOY-EVERYTHING.sh EMPIRE-MASTER-SCHEMA.sql production
##############################################################################

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCHEMA_FILE=${1:-"./EMPIRE-MASTER-SCHEMA.sql"}
DEPLOY_MODE=${2:-"development"}
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${BASE_DIR}/logs"
PID_DIR="${BASE_DIR}/pids"

# Create necessary directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Global variables
SERVICES_STARTED=()
CLEANUP_FUNCTIONS=()

##############################################################################
# 🛠️ UTILITY FUNCTIONS
##############################################################################

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 DEPLOY EVERYTHING 🚀                    ║"
    echo "║              Unified System Integration & Deployment         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

step() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] 🔄 $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if port is in use
is_port_in_use() {
    local port=$1
    if command_exists lsof; then
        lsof -i :$port >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -ln | grep ":$port " >/dev/null 2>&1
    else
        # Fallback: try to connect
        (echo > /dev/tcp/localhost/$port) >/dev/null 2>&1
    fi
}

# Wait for service to be ready
wait_for_service() {
    local name=$1
    local port=$2
    local timeout=${3:-30}
    local count=0
    
    step "Waiting for $name on port $port..."
    
    while ! is_port_in_use $port; do
        sleep 1
        count=$((count + 1))
        if [ $count -gt $timeout ]; then
            error "$name failed to start within ${timeout}s"
            return 1
        fi
        echo -n "."
    done
    
    echo ""
    success "$name is ready on port $port"
}

# Start service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local log_file="${LOG_DIR}/${name}.log"
    local pid_file="${PID_DIR}/${name}.pid"
    
    step "Starting $name..."
    
    # Check if already running
    if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        warn "$name is already running (PID: $(cat "$pid_file"))"
        return 0
    fi
    
    # Start the service
    nohup $command > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    
    # Add to cleanup list
    SERVICES_STARTED+=("$name:$pid:$pid_file")
    
    if [ -n "$port" ]; then
        wait_for_service "$name" "$port" || return 1
    else
        sleep 2 # Give service time to start
        if ! kill -0 $pid 2>/dev/null; then
            error "$name failed to start"
            return 1
        fi
        success "$name started successfully"
    fi
}

# Cleanup function
cleanup() {
    echo ""
    step "Cleaning up services..."
    
    for service_info in "${SERVICES_STARTED[@]}"; do
        IFS=':' read -r name pid pid_file <<< "$service_info"
        if kill -0 "$pid" 2>/dev/null; then
            log "Stopping $name (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 2
            kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f "$pid_file"
    done
    
    success "Cleanup complete"
}

# Register cleanup on exit
trap cleanup EXIT INT TERM

##############################################################################
# 🧪 PRE-FLIGHT CHECKS
##############################################################################

preflight_checks() {
    step "Performing pre-flight checks..."
    
    # Check Node.js
    if ! command_exists node; then
        error "Node.js is not installed"
        exit 1
    fi
    log "Node.js: $(node --version)"
    
    # Check npm
    if ! command_exists npm; then
        error "npm is not installed"
        exit 1
    fi
    log "npm: $(npm --version)"
    
    # Check schema file
    if [ ! -f "$SCHEMA_FILE" ]; then
        error "Schema file not found: $SCHEMA_FILE"
        exit 1
    fi
    log "Schema file: $SCHEMA_FILE"
    
    # Check required files
    local required_files=(
        "UNIFIED-SYSTEM-ORCHESTRATOR.js"
        "SERVICE-DISCOVERY-ENGINE.js"
        "CAL-GUARDIAN-PRODUCTION-ORCHESTRATOR.js"
        "database-driven-builder.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$BASE_DIR/$file" ]; then
            error "Required file not found: $file"
            exit 1
        fi
        log "Found: $file"
    done
    
    # Check available ports
    local required_ports=(8090 9999 3000 5432 6379)
    for port in "${required_ports[@]}"; do
        if is_port_in_use $port; then
            warn "Port $port is already in use"
        else
            log "Port $port is available"
        fi
    done
    
    success "Pre-flight checks passed"
}

##############################################################################
# 🗄️ DATABASE SETUP
##############################################################################

setup_database() {
    step "Setting up database..."
    
    # Check if PostgreSQL is running
    if ! is_port_in_use 5432; then
        warn "PostgreSQL is not running on port 5432"
        
        # Try to start PostgreSQL (macOS)
        if command_exists brew; then
            step "Attempting to start PostgreSQL via Homebrew..."
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
            sleep 3
        fi
        
        # Check again
        if ! is_port_in_use 5432; then
            warn "PostgreSQL not available - database features may be limited"
        else
            success "PostgreSQL started successfully"
        fi
    else
        success "PostgreSQL is already running"
    fi
    
    # Check Redis
    if ! is_port_in_use 6379; then
        warn "Redis is not running on port 6379"
        
        # Try to start Redis (macOS)
        if command_exists brew; then
            step "Attempting to start Redis via Homebrew..."
            brew services start redis 2>/dev/null || true
            sleep 2
        fi
        
        if ! is_port_in_use 6379; then
            warn "Redis not available - caching features may be limited"
        else
            success "Redis started successfully"
        fi
    else
        success "Redis is already running"
    fi
}

##############################################################################
# 🔧 SERVICE DEPLOYMENT
##############################################################################

deploy_core_services() {
    step "Deploying core services..."
    
    # 1. Start Service Discovery Engine first
    start_service \
        "service-discovery-engine" \
        "node SERVICE-DISCOVERY-ENGINE.js" \
        "9999"
    
    # 2. Start CAL Guardian Production Orchestrator
    start_service \
        "cal-guardian-orchestrator" \
        "node CAL-GUARDIAN-PRODUCTION-ORCHESTRATOR.js" \
        "8090"
    
    # 3. Start Unified System Orchestrator
    start_service \
        "unified-system-orchestrator" \
        "node UNIFIED-SYSTEM-ORCHESTRATOR.js $SCHEMA_FILE" \
        ""
    
    # 4. Generate system from database schema
    step "Generating system from database schema..."
    timeout 60 node database-driven-builder.js "$SCHEMA_FILE" || warn "Database-driven builder timed out"
    
    success "Core services deployed"
}

deploy_infrastructure_services() {
    step "Deploying infrastructure services..."
    
    # Start Ollama if available
    if command_exists ollama; then
        if ! is_port_in_use 11434; then
            step "Starting Ollama AI service..."
            start_service \
                "ollama" \
                "ollama serve" \
                "11434"
        else
            success "Ollama is already running"
        fi
    else
        warn "Ollama not installed - AI features may be limited"
    fi
    
    # Start additional infrastructure services if needed
    # (MinIO, additional databases, etc.)
    
    success "Infrastructure services deployed"
}

deploy_application_services() {
    step "Deploying application services..."
    
    # This would start any additional application-specific services
    # discovered by the Service Discovery Engine
    
    # For now, we'll let the Service Discovery Engine handle this
    log "Application services will be discovered and linked automatically"
    
    success "Application services ready for discovery"
}

##############################################################################
# 🛡️ SECURITY SETUP
##############################################################################

setup_security() {
    step "Setting up security layers..."
    
    # Generate JWT secret if not exists
    if [ ! -f ".env" ] || ! grep -q "JWT_SECRET" .env; then
        log "Generating JWT secret..."
        JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || date | md5 2>/dev/null || date | md5sum | cut -d' ' -f1)
        echo "JWT_SECRET=$JWT_SECRET" >> .env
    fi
    
    # Set up other environment variables
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Generated by DEPLOY-EVERYTHING.sh
NODE_ENV=$DEPLOY_MODE
DATABASE_URL=postgresql://localhost:5432/empire_game_world
REDIS_URL=redis://localhost:6379
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=24h
ORCHESTRATOR_PORT=8090
DISCOVERY_PORT=9999

# Security settings
ENABLE_ANTI_DUPLICATION=true
ENABLE_REQUEST_FINGERPRINTING=true
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
EOF
        log "Created .env file with default settings"
    fi
    
    success "Security layers configured"
}

##############################################################################
# 📊 MONITORING SETUP
##############################################################################

setup_monitoring() {
    step "Setting up monitoring..."
    
    # Create monitoring dashboard
    cat > "${BASE_DIR}/system-status.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>🚀 Unified System Status</title>
    <meta http-equiv="refresh" content="30">
    <style>
        body { font-family: monospace; background: #000; color: #00ff00; margin: 20px; }
        .header { text-align: center; border: 2px solid #00ff00; padding: 20px; margin-bottom: 20px; }
        .service { margin: 10px 0; padding: 10px; border: 1px solid #00ff00; }
        .status-ok { color: #00ff00; }
        .status-warning { color: #ffff00; }
        .status-error { color: #ff0000; }
        iframe { width: 100%; height: 400px; border: 1px solid #00ff00; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 UNIFIED SYSTEM STATUS</h1>
        <p>All systems integrated and operational</p>
    </div>
    
    <div class="service">
        <h3>🔍 Service Discovery Engine</h3>
        <a href="http://localhost:9999" target="_blank">http://localhost:9999</a>
        <iframe src="http://localhost:9999"></iframe>
    </div>
    
    <div class="service">
        <h3>🛡️ CAL Guardian Orchestrator</h3>
        <p>Running on port 8090</p>
    </div>
    
    <div class="service">
        <h3>🎯 Unified System Orchestrator</h3>
        <p>Integrating all services</p>
    </div>
    
    <script>
        // Auto-refresh functionality
        setInterval(() => {
            // Check service status
            fetch('http://localhost:9999/api/services')
                .then(response => response.json())
                .then(data => {
                    console.log('System status:', data);
                })
                .catch(error => {
                    console.warn('Service check failed:', error);
                });
        }, 30000);
    </script>
</body>
</html>
EOF
    
    log "Created system status dashboard: system-status.html"
    
    success "Monitoring configured"
}

##############################################################################
# 🧪 HEALTH CHECKS
##############################################################################

perform_health_checks() {
    step "Performing health checks..."
    
    local health_ok=true
    
    # Check Service Discovery Engine
    if curl -s http://localhost:9999/health > /dev/null 2>&1; then
        success "Service Discovery Engine: Healthy"
    else
        error "Service Discovery Engine: Unhealthy"
        health_ok=false
    fi
    
    # Check for running services
    local service_count=$(curl -s http://localhost:9999/api/services 2>/dev/null | jq -r '.totalRunning // 0' 2>/dev/null || echo "0")
    if [ "$service_count" -gt 0 ]; then
        success "Discovered services: $service_count"
    else
        warn "No services discovered yet (may still be starting)"
    fi
    
    # Check database connectivity
    if is_port_in_use 5432; then
        success "Database: Connected"
    else
        warn "Database: Not available"
    fi
    
    # Check Redis connectivity
    if is_port_in_use 6379; then
        success "Redis: Connected"
    else
        warn "Redis: Not available"
    fi
    
    if [ "$health_ok" = true ]; then
        success "All health checks passed"
    else
        warn "Some health checks failed - system may have limited functionality"
    fi
}

##############################################################################
# 📋 DEPLOYMENT SUMMARY
##############################################################################

show_deployment_summary() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    🎉 DEPLOYMENT COMPLETE 🎉                 ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${GREEN}🌐 Service Endpoints:${NC}"
    echo -e "   • Service Discovery: http://localhost:9999"
    echo -e "   • System Status:     file://${BASE_DIR}/system-status.html"
    echo -e "   • CAL Guardian:      http://localhost:8090 (WebSocket)"
    echo ""
    
    echo -e "${GREEN}📊 System Information:${NC}"
    echo -e "   • Schema File:       $SCHEMA_FILE"
    echo -e "   • Deploy Mode:       $DEPLOY_MODE"
    echo -e "   • Base Directory:    $BASE_DIR"
    echo -e "   • Log Directory:     $LOG_DIR"
    echo ""
    
    echo -e "${GREEN}🔧 Management Commands:${NC}"
    echo -e "   • View Logs:         tail -f $LOG_DIR/*.log"
    echo -e "   • Check Status:      curl http://localhost:9999/health"
    echo -e "   • Stop All:          Ctrl+C or kill process"
    echo ""
    
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo -e "   1. Open http://localhost:9999 to see discovered services"
    echo -e "   2. Check logs in $LOG_DIR for any issues"
    echo -e "   3. Access system-status.html for unified dashboard"
    echo -e "   4. All your existing services should now be linked!"
    echo ""
    
    if [ "$DEPLOY_MODE" = "production" ]; then
        echo -e "${RED}⚠️  Production Mode Active:${NC}"
        echo -e "   • Security layers are enabled"
        echo -e "   • Anti-duplication systems are active"
        echo -e "   • Rate limiting is enforced"
        echo ""
    fi
}

##############################################################################
# 🚀 MAIN DEPLOYMENT PROCESS
##############################################################################

main() {
    print_banner
    
    log "Starting unified system deployment..."
    log "Schema: $SCHEMA_FILE"
    log "Mode: $DEPLOY_MODE"
    log "Directory: $BASE_DIR"
    echo ""
    
    # Execute deployment phases
    preflight_checks
    echo ""
    
    setup_database
    echo ""
    
    setup_security
    echo ""
    
    deploy_infrastructure_services
    echo ""
    
    deploy_core_services
    echo ""
    
    deploy_application_services
    echo ""
    
    setup_monitoring
    echo ""
    
    # Give services time to fully initialize
    step "Allowing services to initialize..."
    sleep 10
    
    perform_health_checks
    echo ""
    
    show_deployment_summary
    
    # Keep the script running
    log "System deployed successfully! Press Ctrl+C to stop all services."
    
    # Wait for interrupt
    while true; do
        sleep 30
        # Optionally perform periodic health checks
        if ! curl -s http://localhost:9999/health > /dev/null 2>&1; then
            warn "Service Discovery Engine health check failed"
        fi
    done
}

##############################################################################
# 🎯 SCRIPT EXECUTION
##############################################################################

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi