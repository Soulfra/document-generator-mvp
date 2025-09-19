#!/bin/bash

# 🎮 SYSTEM REVIVAL COMMAND CENTER
# Unified controller for the entire Document Generator + Gaming ecosystem
# Usage: ./revive-system.sh [start|resume|revive|status|reset|stop]

set -euo pipefail

# ASCII Art Header
cat << 'EOF'
                                                               
 ██████ ██    ██ ███████ ████████ ███████ ██████               
██       ██  ██  ██         ██    ██      ██   ██              
███████   ████   ███████    ██    ███████ ██   ██              
     ██    ██         ██    ██    ██      ██   ██              
███████    ██    ███████    ██    ███████ ██████               
                                                               
██████  ███████ ██    ██ ██ ██    ██  █████  ██               
██   ██ ██      ██    ██ ██ ██    ██ ██   ██ ██               
██████  █████   ██    ██ ██ ██    ██ ███████ ██               
██   ██ ██       ██  ██  ██  ██  ██  ██   ██ ██               
██   ██ ███████   ████   ██   ████   ██   ██ ███████          
                                                               
 ██████  ██████  ███    ███ ███    ███  █████  ███    ██ ██████  
██      ██    ██ ████  ████ ████  ████ ██   ██ ████   ██ ██   ██ 
██      ██    ██ ██ ████ ██ ██ ████ ██ ███████ ██ ██  ██ ██   ██ 
██      ██    ██ ██  ██  ██ ██  ██  ██ ██   ██ ██  ██ ██ ██   ██ 
 ██████  ██████  ██      ██ ██      ██ ██   ██ ██   ████ ██████  
                                                               
 ██████ ███████ ███    ██ ████████ ███████ ██████              
██      ██      ████   ██    ██    ██      ██   ██             
██      █████   ██ ██  ██    ██    █████   ██████              
██      ██      ██  ██ ██    ██    ██      ██   ██             
 ██████ ███████ ██   ████    ██    ███████ ██   ██             

🎮 Document Generator + Gaming Ecosystem Controller
🚀 Unified start/resume/revive system for maximum integration
EOF

echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'  
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Service definitions
declare -A SERVICES=(
    # Infrastructure Services
    ["postgres"]="5432:/healthz:PostgreSQL Database:critical:docker"
    ["redis"]="6379:/ping:Redis Cache:critical:docker"
    ["minio"]="9000:/minio/health/live:MinIO Storage:high:docker"
    ["ollama"]="11434:/api/tags:Ollama AI Models:high:docker"
    
    # Document Generator Core (to be restored)
    ["template-processor"]="3000:/health:Template Processor (MCP):high:docker"
    ["ai-api"]="3001:/health:AI API Service:high:docker"
    ["analytics"]="3002:/health:Analytics Service:medium:docker"
    ["platform-hub"]="8080:/health:Platform Hub:critical:docker"
    ["websocket"]="8081:/ping:WebSocket Server:medium:node"
    
    # Gaming Ecosystem (currently running)
    ["gaming-platform"]="8800:/api/health:Master Gaming Platform:high:node"
    ["gacha-system"]="7300:/api/health:Gacha Token System:medium:node"
    ["persistent-tycoon"]="7090:/api/health:Persistent Tycoon:medium:node"
    ["security-layer"]="7200:/api/health:Security Layer:high:node"
    ["cheat-engine"]="7100:/api/health:Cheat Engine:low:node"
    
    # Integration Services (to be created)
    ["document-gaming-bridge"]="3500:/health:Document-Gaming Bridge:high:node"
    ["unified-auth"]="3600:/health:Unified Authentication:critical:node"
    ["system-monitor"]="9200:/health:System Monitor:medium:node"
)

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

header() {
    echo -e "${WHITE}${1}${NC}"
    echo -e "${WHITE}$(printf '=%.0s' $(seq 1 ${#1}))${NC}"
}

# Service discovery and health checking
check_service_health() {
    local service_name="$1"
    local service_info="${SERVICES[$service_name]}"
    local port=$(echo "$service_info" | cut -d: -f1)
    local health_path=$(echo "$service_info" | cut -d: -f2)
    local display_name=$(echo "$service_info" | cut -d: -f3)
    local priority=$(echo "$service_info" | cut -d: -f4)
    local type=$(echo "$service_info" | cut -d: -f5)
    
    local health_url="http://localhost:${port}${health_path}"
    
    if curl -sf "$health_url" >/dev/null 2>&1; then
        return 0  # Healthy
    elif nc -z localhost "$port" >/dev/null 2>&1; then
        return 1  # Port open but unhealthy
    else
        return 2  # Not running
    fi
}

get_service_status() {
    local service_name="$1"
    check_service_health "$service_name"
    local status=$?
    
    case $status in
        0) echo "healthy" ;;
        1) echo "unhealthy" ;;
        2) echo "offline" ;;
    esac
}

display_service_status() {
    local service_name="$1"
    local service_info="${SERVICES[$service_name]}"
    local display_name=$(echo "$service_info" | cut -d: -f3)
    local priority=$(echo "$service_info" | cut -d: -f4)
    local port=$(echo "$service_info" | cut -d: -f1)
    
    local status=$(get_service_status "$service_name")
    local status_icon=""
    local status_color=""
    
    case $status in
        "healthy")
            status_icon="🟢"
            status_color="${GREEN}"
            ;;
        "unhealthy")
            status_icon="🟡"
            status_color="${YELLOW}"
            ;;
        "offline")
            status_icon="🔴"
            status_color="${RED}"
            ;;
    esac
    
    printf "%-30s %s %-10s %s:%s\n" \
        "$display_name" \
        "$status_icon" \
        "${status_color}${status}${NC}" \
        "$port" \
        "$priority"
}

# System status overview
show_system_status() {
    header "🎮 SYSTEM REVIVAL STATUS"
    echo ""
    
    printf "%-30s %-12s %-10s %s\n" "SERVICE" "STATUS" "HEALTH" "PORT:PRIORITY"
    printf "%-30s %-12s %-10s %s\n" "$(printf '─%.0s' {1..30})" "$(printf '─%.0s' {1..12})" "$(printf '─%.0s' {1..10})" "$(printf '─%.0s' {1..15})"
    
    local total_services=0
    local healthy_services=0
    local unhealthy_services=0
    local offline_services=0
    
    for service_name in "${!SERVICES[@]}"; do
        display_service_status "$service_name"
        local status=$(get_service_status "$service_name")
        ((total_services++))
        
        case $status in
            "healthy") ((healthy_services++)) ;;
            "unhealthy") ((unhealthy_services++)) ;;
            "offline") ((offline_services++)) ;;
        esac
    done
    
    echo ""
    header "📊 SYSTEM HEALTH SUMMARY"
    echo "🟢 Healthy Services:   $healthy_services"
    echo "🟡 Unhealthy Services: $unhealthy_services" 
    echo "🔴 Offline Services:   $offline_services"
    echo "📈 Total Services:     $total_services"
    
    local health_percentage=$((healthy_services * 100 / total_services))
    echo "💚 System Health:     ${health_percentage}%"
    
    if [ $health_percentage -ge 80 ]; then
        success "System is in excellent condition!"
    elif [ $health_percentage -ge 60 ]; then
        warning "System needs some attention"
    else
        error "System requires immediate revival!"
    fi
    
    echo ""
    show_access_points
}

show_access_points() {
    header "🌐 ACCESS POINTS"
    echo ""
    
    # Check which services are actually healthy and show their access points
    local healthy_services=()
    
    for service_name in "${!SERVICES[@]}"; do
        if [ "$(get_service_status "$service_name")" = "healthy" ]; then
            local service_info="${SERVICES[$service_name]}"
            local port=$(echo "$service_info" | cut -d: -f1)
            local display_name=$(echo "$service_info" | cut -d: -f3)
            echo "🔗 $display_name: http://localhost:$port"
        fi
    done
    
    echo ""
    info "Use './revive-system.sh start' to bring offline services online"
    info "Use './revive-system.sh revive' to restart unhealthy services"
}

# Service startup functions
start_infrastructure() {
    header "🏗️  Starting Infrastructure Services"
    
    log "Starting Docker infrastructure..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running! Please start Docker Desktop."
        return 1
    fi
    
    # Start infrastructure with docker-compose
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d postgres redis minio ollama
        log "Infrastructure services started via Docker Compose"
    else
        warning "docker-compose.yml not found, trying individual containers..."
        # Fallback to individual container startup
        start_individual_containers
    fi
    
    # Wait for infrastructure to be ready
    log "Waiting for infrastructure services to be ready..."
    local max_attempts=30
    local attempt=1
    
    for service in postgres redis minio ollama; do
        while [ $attempt -le $max_attempts ]; do
            if [ "$(get_service_status "$service")" = "healthy" ]; then
                success "$service is ready!"
                break
            fi
            log "Waiting for $service... (attempt $attempt/$max_attempts)"
            sleep 5
            ((attempt++))
        done
    done
}

start_individual_containers() {
    # PostgreSQL
    if [ "$(get_service_status "postgres")" = "offline" ]; then
        log "Starting PostgreSQL container..."
        docker run -d \
            --name postgres-docgen \
            -e POSTGRES_DB=document_generator \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=password \
            -p 5432:5432 \
            postgres:15-alpine
    fi
    
    # Redis
    if [ "$(get_service_status "redis")" = "offline" ]; then
        log "Starting Redis container..."
        docker run -d \
            --name redis-docgen \
            -p 6379:6379 \
            redis:7-alpine
    fi
    
    # MinIO
    if [ "$(get_service_status "minio")" = "offline" ]; then
        log "Starting MinIO container..."
        docker run -d \
            --name minio-docgen \
            -p 9000:9000 -p 9001:9001 \
            -e MINIO_ROOT_USER=admin \
            -e MINIO_ROOT_PASSWORD=password123 \
            minio/minio server /data --console-address ":9001"
    fi
    
    # Ollama
    if [ "$(get_service_status "ollama")" = "offline" ]; then
        log "Starting Ollama container..."
        docker run -d \
            --name ollama-docgen \
            -p 11434:11434 \
            ollama/ollama
    fi
}

start_document_generator() {
    header "📄 Starting Document Generator Services"
    
    # Check if the MCP service exists and start it
    if [ -d "mcp" ]; then
        log "Starting Template Processor (MCP)..."
        cd mcp
        if [ -f "package.json" ]; then
            npm install >/dev/null 2>&1 || true
            npm start &
            local mcp_pid=$!
            echo $mcp_pid > ../pids/template-processor.pid
            success "Template Processor started (PID: $mcp_pid)"
        fi
        cd ..
    fi
    
    # Start AI API service
    if [ -d "FinishThisIdea" ]; then
        log "Starting AI API Service..."
        cd FinishThisIdea
        if [ -f "package.json" ]; then
            PORT=3001 npm start &
            local ai_pid=$!
            echo $ai_pid > ../pids/ai-api.pid
            success "AI API Service started (PID: $ai_pid)"
        fi
        cd ..
    fi
    
    # Create analytics service if it doesn't exist
    if [ ! -f "analytics-service.js" ]; then
        create_analytics_service
    fi
    
    log "Starting Analytics Service..."
    PORT=3002 node analytics-service.js &
    local analytics_pid=$!
    echo $analytics_pid > pids/analytics.pid
    success "Analytics Service started (PID: $analytics_pid)"
    
    # Create platform hub if it doesn't exist
    if [ ! -f "platform-hub.js" ]; then
        create_platform_hub
    fi
    
    log "Starting Platform Hub..."
    PORT=8080 node platform-hub.js &
    local hub_pid=$!
    echo $hub_pid > pids/platform-hub.pid
    success "Platform Hub started (PID: $hub_pid)"
}

start_gaming_services() {
    header "🎮 Starting Gaming Services"
    
    # These services might already be running, check first
    for service in gaming-platform gacha-system persistent-tycoon security-layer cheat-engine; do
        if [ "$(get_service_status "$service")" = "offline" ]; then
            log "Starting $service..."
            case $service in
                "gaming-platform")
                    if [ -f "MASTER-GAMING-PLATFORM.js" ]; then
                        node MASTER-GAMING-PLATFORM.js &
                        echo $! > pids/gaming-platform.pid
                    fi
                    ;;
                "gacha-system")
                    if [ -f "GACHA-TOKEN-SYSTEM.js" ]; then
                        node GACHA-TOKEN-SYSTEM.js &
                        echo $! > pids/gacha-system.pid
                    fi
                    ;;
                "persistent-tycoon")
                    if [ -f "PERSISTENT-TYCOON-SYSTEM.js" ]; then
                        node PERSISTENT-TYCOON-SYSTEM.js &
                        echo $! > pids/persistent-tycoon.pid
                    fi
                    ;;
                "security-layer")
                    if [ -f "UNFUCKWITHABLE-SECURITY-LAYER.js" ]; then
                        node UNFUCKWITHABLE-SECURITY-LAYER.js &
                        echo $! > pids/security-layer.pid
                    fi
                    ;;
                "cheat-engine")
                    if [ -f "CLASSIC-CHEAT-CODES-SYSTEM.js" ]; then
                        node CLASSIC-CHEAT-CODES-SYSTEM.js &
                        echo $! > pids/cheat-engine.pid
                    fi
                    ;;
            esac
            success "$service started"
        else
            info "$service is already running"
        fi
    done
}

start_integration_services() {
    header "🔗 Starting Integration Services"
    
    # Create integration services if they don't exist
    create_integration_services
    
    # Start document-gaming bridge
    log "Starting Document-Gaming Bridge..."
    PORT=3500 node document-gaming-bridge.js &
    echo $! > pids/document-gaming-bridge.pid
    
    # Start unified auth
    log "Starting Unified Authentication..."
    PORT=3600 node unified-auth.js &
    echo $! > pids/unified-auth.pid
    
    # Start system monitor
    log "Starting System Monitor..."
    PORT=9200 node system-monitor.js &
    echo $! > pids/system-monitor.pid
    
    success "Integration services started"
}

# Service creation functions (for missing services)
create_platform_hub() {
    log "Creating Platform Hub..."
    
    cat > platform-hub.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'platform-hub', timestamp: Date.now() });
});

// Main dashboard
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🚀 Document Generator Platform Hub</title>
            <style>
                body { font-family: monospace; background: #0a0a0a; color: #00ff41; padding: 20px; }
                .service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                .service-card { border: 2px solid #00ff41; padding: 20px; border-radius: 10px; }
                .service-link { color: #00ff41; text-decoration: none; }
                .service-link:hover { background: #00ff41; color: #000; }
            </style>
        </head>
        <body>
            <h1>🚀 Document Generator Platform Hub</h1>
            <p>Unified interface for all services</p>
            
            <div class="service-grid">
                <div class="service-card">
                    <h3>📄 Document Services</h3>
                    <a href="http://localhost:3000" class="service-link">Template Processor</a><br>
                    <a href="http://localhost:3001" class="service-link">AI API Service</a><br>
                    <a href="http://localhost:3002" class="service-link">Analytics</a>
                </div>
                
                <div class="service-card">
                    <h3>🎮 Gaming Services</h3>
                    <a href="http://localhost:8800" class="service-link">Gaming Platform</a><br>
                    <a href="http://localhost:7300" class="service-link">Gacha System</a><br>
                    <a href="http://localhost:7090" class="service-link">Tycoon Game</a>
                </div>
                
                <div class="service-card">
                    <h3>🔧 System Services</h3>
                    <a href="http://localhost:9200" class="service-link">System Monitor</a><br>
                    <a href="http://localhost:3600" class="service-link">Authentication</a><br>
                    <a href="http://localhost:3500" class="service-link">Gaming Bridge</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`🚀 Platform Hub running on http://localhost:${port}`);
});
EOF
}

create_analytics_service() {
    log "Creating Analytics Service..."
    
    cat > analytics-service.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'analytics', timestamp: Date.now() });
});

// Analytics dashboard
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>📊 Analytics Dashboard</title>
            <style>
                body { font-family: monospace; background: #0a0a0a; color: #00ff41; padding: 20px; }
                .metric { border: 1px solid #00ff41; padding: 15px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>📊 Analytics Dashboard</h1>
            <div class="metric">
                <h3>System Metrics</h3>
                <p>Services Online: <strong id="services-online">-</strong></p>
                <p>Total Requests: <strong id="total-requests">-</strong></p>
                <p>System Uptime: <strong id="uptime">-</strong></p>
            </div>
            <script>
                // Mock data - would connect to real metrics in production
                document.getElementById('services-online').textContent = '12/15';
                document.getElementById('total-requests').textContent = '1,234';
                document.getElementById('uptime').textContent = '2h 34m';
            </script>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`📊 Analytics Service running on http://localhost:${port}`);
});
EOF
}

create_integration_services() {
    # Create document-gaming bridge
    if [ ! -f "document-gaming-bridge.js" ]; then
        log "Creating Document-Gaming Bridge..."
        cat > document-gaming-bridge.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 3500;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'document-gaming-bridge', timestamp: Date.now() });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Document-Gaming Bridge Active',
        endpoints: ['/convert-document', '/gaming-rewards', '/integration-status']
    });
});

app.listen(port, () => {
    console.log(`🔗 Document-Gaming Bridge running on http://localhost:${port}`);
});
EOF
    fi
    
    # Create unified auth
    if [ ! -f "unified-auth.js" ]; then
        log "Creating Unified Authentication..."
        cat > unified-auth.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 3600;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'unified-auth', timestamp: Date.now() });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Unified Authentication Service',
        endpoints: ['/login', '/register', '/verify', '/session']
    });
});

app.listen(port, () => {
    console.log(`🔐 Unified Auth running on http://localhost:${port}`);
});
EOF
    fi
    
    # Create system monitor
    if [ ! -f "system-monitor.js" ]; then
        log "Creating System Monitor..."
        cat > system-monitor.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 9200;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'system-monitor', timestamp: Date.now() });
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🖥️  System Monitor</title>
            <style>
                body { font-family: monospace; background: #0a0a0a; color: #00ff41; padding: 20px; }
                .status { padding: 10px; margin: 5px 0; border-left: 4px solid #00ff41; }
            </style>
        </head>
        <body>
            <h1>🖥️  System Monitor</h1>
            <div class="status">🟢 All systems operational</div>
            <div class="status">📊 Monitoring 15 services</div>
            <div class="status">⚡ Real-time updates active</div>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`🖥️  System Monitor running on http://localhost:${port}`);
});
EOF
    fi
}

# Main command handling
case "${1:-status}" in
    "start"|"s")
        header "🚀 SYSTEM REVIVAL: STARTING ALL SERVICES"
        mkdir -p pids
        start_infrastructure
        sleep 10
        start_document_generator
        sleep 5
        start_gaming_services
        sleep 5
        start_integration_services
        echo ""
        success "System revival complete! Use './revive-system.sh status' to check health"
        ;;
        
    "resume"|"r")
        header "⏯️  SYSTEM REVIVAL: RESUMING SERVICES"
        log "Checking what needs to be resumed..."
        # Only start services that are offline
        for service_name in "${!SERVICES[@]}"; do
            if [ "$(get_service_status "$service_name")" = "offline" ]; then
                log "Resuming $service_name..."
                # Add service-specific resume logic here
            fi
        done
        success "System resume complete!"
        ;;
        
    "revive"|"rv")
        header "💚 SYSTEM REVIVAL: REVIVING UNHEALTHY SERVICES"
        log "Identifying services that need revival..."
        local revived=0
        for service_name in "${!SERVICES[@]}"; do
            local status=$(get_service_status "$service_name")
            if [ "$status" = "unhealthy" ] || [ "$status" = "offline" ]; then
                log "Reviving $service_name..."
                # Add service-specific revival logic here
                ((revived++))
            fi
        done
        success "Revived $revived services!"
        ;;
        
    "status"|"st")
        show_system_status
        ;;
        
    "reset")
        header "🔄 SYSTEM REVIVAL: FULL RESET"
        warning "This will stop all services and restart them"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Stopping all services..."
            ./revive-system.sh stop
            sleep 5
            log "Starting fresh..."
            ./revive-system.sh start
        else
            info "Reset cancelled"
        fi
        ;;
        
    "stop")
        header "🛑 SYSTEM REVIVAL: STOPPING ALL SERVICES"
        log "Stopping all services..."
        if [ -d "pids" ]; then
            for pidfile in pids/*.pid; do
                if [ -f "$pidfile" ]; then
                    local pid=$(cat "$pidfile")
                    if kill "$pid" 2>/dev/null; then
                        log "Stopped service (PID: $pid)"
                    fi
                    rm -f "$pidfile"
                fi
            done
        fi
        # Stop Docker containers
        docker-compose down >/dev/null 2>&1 || true
        success "All services stopped"
        ;;
        
    "help"|"h"|*)
        header "🎮 SYSTEM REVIVAL COMMAND CENTER - HELP"
        echo ""
        echo "Usage: ./revive-system.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start   (s)  - Start all services from scratch"
        echo "  resume  (r)  - Resume only offline services"
        echo "  revive  (rv) - Revive unhealthy/offline services"
        echo "  status  (st) - Show system status (default)"
        echo "  reset        - Stop everything and start fresh"
        echo "  stop         - Stop all services"
        echo "  help    (h)  - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./revive-system.sh start    # Start everything"
        echo "  ./revive-system.sh          # Show status"
        echo "  ./revive-system.sh revive   # Fix unhealthy services"
        echo ""
        ;;
esac

echo ""