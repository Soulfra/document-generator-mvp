#!/bin/bash

# 🖥️ UNIFIED PERSONAL OS LAUNCHER
# Brings together all components into a working personal operating system
# For backoffice staff and administrators

set -e

echo "🖥️ UNIFIED PERSONAL OS LAUNCHER"
echo "==============================="
echo "Transforming your components into a working personal OS"
echo

# Configuration
BRIDGE_PORT=${BRIDGE_PORT:-9500}
WS_PORT=${WS_PORT:-9501}
STREAMING_PORT=${STREAMING_PORT:-8888}
LOG_DIR="./logs"
PID_DIR="./pids"

# Create necessary directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if process is running
is_running() {
    local pid_file="$1"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Start a service
start_service() {
    local name="$1"
    local script="$2"
    local port="$3"
    local pid_file="$PID_DIR/${name}.pid"
    local log_file="$LOG_DIR/${name}.log"
    
    if is_running "$pid_file"; then
        log_warning "$name is already running"
        return 0
    fi
    
    if [ ! -f "$script" ]; then
        log_warning "$name script not found: $script"
        return 1
    fi
    
    log_info "Starting $name..."
    
    # Start the service
    nohup node "$script" > "$log_file" 2>&1 &
    echo $! > "$pid_file"
    
    # Wait a moment and check if it started
    sleep 2
    
    if is_running "$pid_file"; then
        if [ -n "$port" ]; then
            # Check if port is responding
            if curl -s "http://localhost:$port" > /dev/null 2>&1; then
                log_success "$name started successfully on port $port"
            else
                log_warning "$name started but port $port not responding yet"
            fi
        else
            log_success "$name started successfully"
        fi
        return 0
    else
        log_error "$name failed to start"
        return 1
    fi
}

# Stop a service
stop_service() {
    local name="$1"
    local pid_file="$PID_DIR/${name}.pid"
    
    if is_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        log_info "Stopping $name (PID: $pid)..."
        kill "$pid"
        rm -f "$pid_file"
        log_success "$name stopped"
    else
        log_warning "$name is not running"
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js 16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js version too old. Required: 16+, Found: $NODE_VERSION"
        exit 1
    fi
    
    log_success "Node.js $(node --version) ✓"
    
    # Check available ports
    local ports=("$BRIDGE_PORT" "$WS_PORT" "$STREAMING_PORT")
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep ":$port " > /dev/null; then
            log_warning "Port $port is in use. Some services may conflict."
        fi
    done
    
    # Check disk space
    local available_mb=$(df . | awk 'NR==2 {print int($4/1024)}')
    if [ "$available_mb" -lt 1000 ]; then
        log_warning "Low disk space: ${available_mb}MB available"
    fi
    
    log_success "System requirements check complete"
}

# Detect available components
detect_components() {
    log_info "Detecting available components..."
    
    local components=(
        "unified-personal-os-bridge.js:Personal OS Bridge"
        "AGENTIC-OPERATING-SYSTEM.js:Agentic OS"
        "signature-3d-workspace-integrator.js:3D Workspace Integrator"
        "tier-based-workflow-system.js:Tier-Based Workflow"
        "social-media-profile-scraper.js:Social Media Scraper"
        "template-analysis-repurposing-engine.js:Template Engine"
        "music-integration-layer.js:Music Integration"
        "start-branded-streaming-platform.js:Streaming Platform"
        "SOULFRA-3D-WORLD-ENGINE.html:3D World Engine"
        "ascii-art-signature-generator.js:Signature Generator"
    )
    
    local found=0
    local total=${#components[@]}
    
    for component in "${components[@]}"; do
        IFS=':' read -r file description <<< "$component"
        if [ -f "$file" ]; then
            log_success "$description found"
            ((found++))
        else
            log_warning "$description missing: $file"
        fi
    done
    
    echo
    log_info "Component detection: $found/$total components available"
    
    if [ "$found" -lt 5 ]; then
        log_error "Too few components available. Need at least 5 core components."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        npm install --silent
        log_success "Dependencies installed"
    else
        log_warning "No package.json found, creating minimal dependencies"
        
        # Create minimal package.json
        cat > package.json << EOF
{
  "name": "personal-os-unified",
  "version": "1.0.0",
  "description": "Unified Personal Operating System",
  "main": "unified-personal-os-bridge.js",
  "scripts": {
    "start": "node unified-personal-os-bridge.js",
    "stop": "./launch-unified-personal-os.sh stop"
  },
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.13.0"
  }
}
EOF
        
        npm install --silent
        log_success "Minimal dependencies installed"
    fi
}

# Start all services
start_all() {
    log_info "Starting Unified Personal OS..."
    echo
    
    # Start core bridge system
    start_service "personal-os-bridge" "unified-personal-os-bridge.js" "$BRIDGE_PORT"
    
    # Start streaming platform if available
    if [ -f "start-branded-streaming-platform.js" ]; then
        start_service "streaming-platform" "start-branded-streaming-platform.js" "$STREAMING_PORT"
    fi
    
    # Start signature generator if available
    if [ -f "ascii-art-signature-generator.js" ]; then
        start_service "signature-generator" "ascii-art-signature-generator.js"
    fi
    
    echo
    log_success "Unified Personal OS startup complete!"
    show_status
}

# Stop all services
stop_all() {
    log_info "Stopping Unified Personal OS..."
    
    local services=("personal-os-bridge" "streaming-platform" "signature-generator")
    
    for service in "${services[@]}"; do
        stop_service "$service"
    done
    
    log_success "All services stopped"
}

# Show system status
show_status() {
    echo
    echo "🎯 UNIFIED PERSONAL OS STATUS"
    echo "=============================="
    
    # Check main services
    local services=(
        "personal-os-bridge:Personal OS Bridge:$BRIDGE_PORT"
        "streaming-platform:Streaming Platform:$STREAMING_PORT"
        "signature-generator:Signature Generator:"
    )
    
    echo
    for service_info in "${services[@]}"; do
        IFS=':' read -r service name port <<< "$service_info"
        local pid_file="$PID_DIR/${service}.pid"
        
        if is_running "$pid_file"; then
            local pid=$(cat "$pid_file")
            if [ -n "$port" ]; then
                echo -e "${GREEN}✅ $name: Running (PID: $pid, Port: $port)${NC}"
            else
                echo -e "${GREEN}✅ $name: Running (PID: $pid)${NC}"
            fi
        else
            echo -e "${RED}❌ $name: Not running${NC}"
        fi
    done
    
    echo
    echo "🌐 ACCESS POINTS:"
    if is_running "$PID_DIR/personal-os-bridge.pid"; then
        echo -e "${CYAN}  🖥️  Personal OS: http://localhost:$BRIDGE_PORT${NC}"
        echo -e "${CYAN}  📊 System Status: http://localhost:$BRIDGE_PORT/api/status${NC}"
    fi
    
    if is_running "$PID_DIR/streaming-platform.pid"; then
        echo -e "${CYAN}  📡 Streaming Platform: http://localhost:$STREAMING_PORT${NC}"
    fi
    
    echo
    echo "⌨️  KEYBOARD SHORTCUTS (when in 3D workspace):"
    echo "  • 1-7: Navigate tiers"
    echo "  • WASD: Move in 3D space"  
    echo "  • C/T/P: Call transport (car/train/plane)"
    echo "  • Space: Interact"
    echo "  • Escape: System menu"
    
    echo
    echo "📋 WORKFLOW TIERS:"
    echo "  🚗 Automobile (1-2): Content Discovery & Template Analysis"
    echo "  🚂 Train (3-5): Music Integration, Content Creation & Word Art"  
    echo "  ✈️  Plane (6-7): Publication & Analytics"
    
    echo
    echo "👥 BACKOFFICE FEATURES:"
    echo "  • Signature-based authentication"
    echo "  • Personal 3D workspaces"
    echo "  • Team collaboration rooms"
    echo "  • Cross-platform content creation"
    echo "  • Music-synchronized workflows"
    
    echo
    echo "📖 DOCUMENTATION:"
    echo "  • Getting Started: See installation README"
    echo "  • User Guide: GETTING_STARTED.md"
    echo "  • Admin Guide: Check admin packages"
    echo "  • Logs: $LOG_DIR/"
}

# Show help
show_help() {
    echo "🖥️ Unified Personal OS Launcher"
    echo
    echo "USAGE:"
    echo "  $0 [command]"
    echo
    echo "COMMANDS:"
    echo "  start     Start all Personal OS services"
    echo "  stop      Stop all Personal OS services"
    echo "  restart   Restart all services"
    echo "  status    Show system status"
    echo "  install   Install dependencies and check requirements"
    echo "  demo      Start with demo data"
    echo "  logs      Show recent logs"
    echo "  help      Show this help message"
    echo
    echo "CONFIGURATION:"
    echo "  BRIDGE_PORT=$BRIDGE_PORT (Personal OS web interface)"
    echo "  WS_PORT=$WS_PORT (WebSocket communication)"
    echo "  STREAMING_PORT=$STREAMING_PORT (Streaming platform)"
    echo
    echo "EXAMPLES:"
    echo "  $0 start                    # Start all services"
    echo "  BRIDGE_PORT=8080 $0 start   # Start on custom port"
    echo "  $0 logs                     # View logs"
    echo "  $0 status                   # Check status"
}

# Show logs
show_logs() {
    log_info "Recent logs from all services:"
    echo
    
    for log_file in "$LOG_DIR"/*.log; do
        if [ -f "$log_file" ]; then
            local service=$(basename "$log_file" .log)
            echo -e "${BLUE}=== $service ===${NC}"
            tail -n 5 "$log_file" 2>/dev/null || echo "No logs available"
            echo
        fi
    done
}

# Demo mode with sample data
start_demo() {
    log_info "Starting Personal OS in demo mode..."
    
    # Create demo configuration
    mkdir -p ~/.personalos
    cat > ~/.personalos/demo-config.json << EOF
{
  "demo_mode": true,
  "demo_users": [
    {
      "name": "Demo Executive",
      "signature": "elegant",
      "role": "manager",
      "department": "management"
    },
    {
      "name": "Demo Creator", 
      "signature": "bold",
      "role": "content_creator",
      "department": "content_team"
    },
    {
      "name": "Demo Designer",
      "signature": "artistic", 
      "role": "designer",
      "department": "design_team"
    }
  ],
  "demo_data": {
    "social_media": true,
    "templates": true,
    "music": true,
    "collaboration": true
  }
}
EOF
    
    log_success "Demo configuration created"
    start_all
    
    echo
    log_info "DEMO MODE ACTIVE"
    echo "Try these demo users:"
    echo "  • Demo Executive (elegant signature)"
    echo "  • Demo Creator (bold signature)"  
    echo "  • Demo Designer (artistic signature)"
}

# Main command handler
case "${1:-start}" in
    start)
        check_requirements
        detect_components
        install_dependencies
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        start_all
        ;;
    status)
        show_status
        ;;
    install)
        check_requirements
        detect_components
        install_dependencies
        log_success "Installation complete. Run '$0 start' to launch."
        ;;
    demo)
        check_requirements
        detect_components
        install_dependencies
        start_demo
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac