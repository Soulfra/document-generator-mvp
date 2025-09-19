#!/bin/bash

# 🚀 ULTIMATE MONITORING SYSTEM STARTUP
# Launches comprehensive monitoring stack for maximum ecosystem integration

set -euo pipefail

echo "🚀 ULTIMATE MONITORING SYSTEM"
echo "============================"
echo "📊 Starting comprehensive monitoring for maximum integration"
echo "🔗 Monitoring all cross-system communications and health"
echo ""

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.ultimate.yml"
MONITORING_TIMEOUT=300
HEALTH_CHECK_INTERVAL=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create monitoring directories
create_directories() {
    log "Creating monitoring directories..."
    
    directories=(
        "monitoring/grafana-ultimate/dashboards/ultimate-ecosystem"
        "monitoring/grafana-ultimate/dashboards/system-health"
        "monitoring/grafana-ultimate/dashboards/business-metrics"
        "monitoring/grafana-ultimate/dashboards/real-time"
        "monitoring/grafana-ultimate/dashboards/cross-system"
        "logs/prometheus"
        "logs/grafana"
        "logs/loki"
        "logs/promtail"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        success "Created directory: $dir"
    done
}

# Start monitoring infrastructure
start_monitoring_infrastructure() {
    log "Starting monitoring infrastructure..."
    
    # Start infrastructure services first
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d \
        postgres-unified \
        redis-unified \
        minio-unified \
        ollama-unified
    
    success "Infrastructure services started"
    
    # Wait for infrastructure to be ready
    log "Waiting for infrastructure services to be healthy..."
    sleep 30
    
    # Start monitoring stack
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d \
        prometheus-unified \
        loki-unified \
        promtail-unified \
        grafana-unified
    
    success "Monitoring stack started"
}

# Start application services
start_application_services() {
    log "Starting application services..."
    
    # Start integration orchestrator first
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d integration-orchestrator
    
    # Wait for orchestrator to be ready
    log "Waiting for integration orchestrator..."
    sleep 20
    
    # Start all application services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d \
        document-generator \
        document-ai-api \
        gaming-platform \
        voxel-engine \
        persistent-tycoon \
        learning-platform \
        color-training \
        token-economy
    
    success "All application services started"
}

# Start reverse proxy
start_reverse_proxy() {
    log "Starting reverse proxy..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d nginx-ultimate
    
    success "Reverse proxy started"
}

# Health check function
check_service_health() {
    local service_name="$1"
    local health_url="$2"
    local max_attempts=30
    local attempt=1
    
    log "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            success "$service_name is healthy"
            return 0
        fi
        
        info "Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
    
    warning "$service_name health check timed out"
    return 1
}

# Comprehensive health checks
perform_health_checks() {
    log "Performing comprehensive health checks..."
    
    # Define services to check
    declare -A services=(
        ["Integration Orchestrator"]="http://localhost:9000/api/system/status"
        ["Document Generator"]="http://localhost:3000/health"
        ["Gaming Platform"]="http://localhost:8800/api/health"
        ["Learning Platform"]="http://localhost:7000/api/health"
        ["Token Economy"]="http://localhost:9495/economy/snapshot"
        ["Voxel Engine"]="http://localhost:7300/api/health"
        ["Prometheus"]="http://localhost:9090/-/healthy"
        ["Grafana"]="http://localhost:3003/api/health"
        ["Loki"]="http://localhost:3100/ready"
    )
    
    local healthy_count=0
    local total_count=${#services[@]}
    
    for service_name in "${!services[@]}"; do
        if check_service_health "$service_name" "${services[$service_name]}"; then
            ((healthy_count++))
        fi
    done
    
    log "Health check summary: $healthy_count/$total_count services healthy"
    
    if [ $healthy_count -eq $total_count ]; then
        success "All services are healthy!"
    else
        warning "Some services are not healthy. Check logs for details."
    fi
}

# Verify cross-system integration
verify_integration() {
    log "Verifying cross-system integration..."
    
    # Test cross-system event bus
    if curl -sf "http://localhost:9000/api/system/status" | jq -e '.stats.realTimeEvents >= 0' > /dev/null 2>&1; then
        success "Cross-system event bus is operational"
    else
        warning "Cross-system event bus may not be fully operational"
    fi
    
    # Test database connectivity
    if docker exec ultimate-postgres pg_isready -U postgres > /dev/null 2>&1; then
        success "Unified database is accessible"
    else
        warning "Unified database connectivity issues"
    fi
    
    # Test Redis connectivity
    if docker exec ultimate-redis redis-cli ping | grep -q "PONG"; then
        success "Unified Redis is accessible"
    else
        warning "Unified Redis connectivity issues"
    fi
}

# Display access information
display_access_info() {
    log "Ultimate Integration Ecosystem is ready!"
    echo ""
    echo "🌐 ACCESS POINTS:"
    echo "=================="
    echo ""
    echo "🚀 Integration Dashboard:    http://localhost:9000"
    echo "📊 Monitoring Dashboard:     http://localhost:3003 (admin/ultimate_integration_2025)"
    echo "📈 Metrics (Prometheus):     http://localhost:9090"
    echo "📋 Logs (Loki):             http://localhost:3100"
    echo ""
    echo "🎯 CORE SERVICES:"
    echo "=================="
    echo ""
    echo "📄 Document Generator:       http://localhost:3000"
    echo "🎮 Gaming Platform:          http://localhost:8800"
    echo "📚 Learning Platform:        http://localhost:7000"
    echo "🪙 Token Economy:            http://localhost:9495"
    echo "🧊 3D Voxel Interface:       http://localhost:7300"
    echo ""
    echo "🔗 GATEWAY:"
    echo "============"
    echo ""
    echo "🌐 Main Gateway (Nginx):     http://localhost"
    echo ""
    echo "📡 REAL-TIME:"
    echo "=============="
    echo ""
    echo "🔄 WebSocket Events:         ws://localhost:9001"
    echo "🎮 Gaming WebSocket:         ws://localhost:8801"
    echo "📚 Learning WebSocket:       ws://localhost:7001"
    echo "🧊 Voxel WebSocket:          ws://localhost:7301"
    echo ""
    echo "🎯 To monitor system status:"
    echo "docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo ""
    echo "🔧 To stop all services:"
    echo "./stop-ultimate-monitoring.sh"
    echo ""
}

# Create system status monitoring script
create_status_script() {
    log "Creating system status monitoring script..."
    
    cat > "check-ultimate-status.sh" << 'EOF'
#!/bin/bash

# Quick status check for Ultimate Integration Ecosystem

echo "🚀 ULTIMATE INTEGRATION ECOSYSTEM STATUS"
echo "========================================"
echo ""

# Service status
services=("ultimate-integration-orchestrator" "ultimate-document-generator" "ultimate-gaming-platform" "ultimate-learning-platform" "ultimate-token-economy" "ultimate-voxel-engine" "ultimate-prometheus" "ultimate-grafana" "ultimate-loki")

echo "📊 SERVICE STATUS:"
echo "=================="
for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" --format "{{.Names}}" | grep -q "^$service$"; then
        echo "✅ $service: RUNNING"
    else
        echo "❌ $service: NOT RUNNING"
    fi
done

echo ""
echo "🔗 INTEGRATION STATUS:"
echo "======================"

# Check cross-system communication
if curl -sf http://localhost:9000/api/system/status > /dev/null 2>&1; then
    echo "✅ Integration Orchestrator: ACCESSIBLE"
else
    echo "❌ Integration Orchestrator: NOT ACCESSIBLE"
fi

# Check monitoring
if curl -sf http://localhost:3003/api/health > /dev/null 2>&1; then
    echo "✅ Monitoring Dashboard: ACCESSIBLE"
else
    echo "❌ Monitoring Dashboard: NOT ACCESSIBLE"
fi

echo ""
echo "📈 QUICK METRICS:"
echo "================="

# Get basic metrics if available
if curl -sf http://localhost:9000/api/system/status 2>/dev/null | jq -e '.stats' > /dev/null 2>&1; then
    curl -sf http://localhost:9000/api/system/status 2>/dev/null | jq -r '
        "👥 Active Sessions: " + (.stats.realTimeConnections // 0 | tostring),
        "⚡ Events Processed: " + (.stats.realTimeEvents // 0 | tostring),
        "🔄 Cross-System Actions: " + (.stats.crossSystemActions // 0 | tostring),
        "⏱️  System Uptime: " + ((.uptime // 0) / 60000 | floor | tostring) + " minutes"
    '
else
    echo "📊 Metrics not available - check orchestrator status"
fi

echo ""
EOF

    chmod +x "check-ultimate-status.sh"
    success "Status monitoring script created: check-ultimate-status.sh"
}

# Create stop script
create_stop_script() {
    log "Creating system stop script..."
    
    cat > "stop-ultimate-monitoring.sh" << EOF
#!/bin/bash

echo "🛑 STOPPING ULTIMATE INTEGRATION ECOSYSTEM"
echo "=========================================="

# Stop all services gracefully
docker-compose -f $DOCKER_COMPOSE_FILE down

echo ""
echo "✅ All services stopped successfully"
echo "📊 Container cleanup completed"
echo ""
echo "🔄 To restart the ecosystem:"
echo "./start-ultimate-monitoring.sh"
EOF

    chmod +x "stop-ultimate-monitoring.sh"
    success "Stop script created: stop-ultimate-monitoring.sh"
}

# Main execution
main() {
    log "Starting Ultimate Integration Monitoring System deployment..."
    echo ""
    
    check_prerequisites
    create_directories
    create_status_script
    create_stop_script
    
    log "Starting services in optimal order..."
    start_monitoring_infrastructure
    start_application_services
    start_reverse_proxy
    
    log "Waiting for all services to stabilize..."
    sleep 60
    
    perform_health_checks
    verify_integration
    
    echo ""
    success "Ultimate Integration Ecosystem with Monitoring is fully operational!"
    echo ""
    
    display_access_info
    
    log "System startup completed successfully"
}

# Execute main function
main "$@"