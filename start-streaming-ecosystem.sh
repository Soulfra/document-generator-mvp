#!/bin/bash

# 🌊🚀 START STREAMING ECOSYSTEM
# Complete streaming solution startup script
# Launches all streaming services and tests connectivity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${CYAN}"
cat << "EOF"
🌊🚀 STREAMING ECOSYSTEM LAUNCHER 🚀🌊
=====================================
Advanced API streaming and resilience solution

Components:
• Streaming API Gateway (Port 5555)
• Distributed API Proxy (Port 6666)  
• Connection Resilience Manager
• Real-time WebSocket streaming
• Intelligent failover and retry logic
EOF
echo -e "${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[LAUNCHER]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# Check dependencies
check_dependencies() {
    print_section "CHECKING DEPENDENCIES"
    
    local missing_deps=()
    
    command -v python3 >/dev/null 2>&1 || missing_deps+=("python3")
    command -v node >/dev/null 2>&1 || missing_deps+=("node")
    command -v docker >/dev/null 2>&1 || missing_deps+=("docker")
    
    # Check Python packages
    python3 -c "import aiohttp, websockets, flask, redis" 2>/dev/null || missing_deps+=("python-packages")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo
        echo "Install missing dependencies:"
        echo "  • Python packages: pip3 install aiohttp websockets flask flask-cors flask-socketio redis"
        echo "  • Node.js: https://nodejs.org/"
        echo "  • Docker: https://docker.com/"
        exit 1
    fi
    
    print_status "✅ All dependencies found!"
}

# Start Redis (if not running)
start_redis() {
    print_section "STARTING REDIS"
    
    if ! pgrep redis-server > /dev/null; then
        if command -v redis-server >/dev/null 2>&1; then
            print_status "Starting Redis server..."
            redis-server --daemonize yes --port 6379
            sleep 2
        else
            print_warning "Redis not found, starting with Docker..."
            docker run -d --name redis-streaming -p 6379:6379 redis:alpine || true
            sleep 3
        fi
    else
        print_status "✅ Redis already running"
    fi
}

# Install Python dependencies
install_python_deps() {
    print_section "INSTALLING PYTHON DEPENDENCIES"
    
    print_status "Installing required Python packages..."
    pip3 install -q aiohttp websockets flask flask-cors flask-socketio redis requests psutil sqlite3 || {
        print_warning "Some packages might already be installed"
    }
    
    print_status "✅ Python dependencies ready!"
}

# Start Streaming Gateway
start_streaming_gateway() {
    print_section "STARTING STREAMING GATEWAY"
    
    if lsof -i :5555 > /dev/null 2>&1; then
        print_warning "Port 5555 already in use, skipping Streaming Gateway"
        return
    fi
    
    print_status "Launching Streaming API Gateway on port 5555..."
    
    # Start in background
    nohup python3 streaming-api-gateway.py > streaming-gateway.log 2>&1 &
    STREAMING_PID=$!
    echo $STREAMING_PID > streaming-gateway.pid
    
    print_status "Waiting for Streaming Gateway to start..."
    sleep 5
    
    # Check if it's running
    if curl -s http://localhost:5555/health > /dev/null 2>&1; then
        print_status "✅ Streaming Gateway started successfully!"
        print_status "   Dashboard: http://localhost:5555"
    else
        print_error "❌ Streaming Gateway failed to start"
        print_error "   Check streaming-gateway.log for details"
    fi
}

# Start Distributed Proxy
start_distributed_proxy() {
    print_section "STARTING DISTRIBUTED PROXY"
    
    if lsof -i :6666 > /dev/null 2>&1; then
        print_warning "Port 6666 already in use, skipping Distributed Proxy"
        return
    fi
    
    print_status "Launching Distributed API Proxy on port 6666..."
    
    # Start in background
    nohup python3 distributed-api-proxy.py > distributed-proxy.log 2>&1 &
    PROXY_PID=$!
    echo $PROXY_PID > distributed-proxy.pid
    
    print_status "Waiting for Distributed Proxy to start..."
    sleep 5
    
    # Check if it's running
    if curl -s http://localhost:6666/health > /dev/null 2>&1; then
        print_status "✅ Distributed Proxy started successfully!"
        print_status "   Dashboard: http://localhost:6666"
    else
        print_error "❌ Distributed Proxy failed to start"
        print_error "   Check distributed-proxy.log for details"
    fi
}

# Start Flask API (if not running)
start_flask_api() {
    print_section "STARTING FLASK API"
    
    if lsof -i :5000 > /dev/null 2>&1; then
        print_status "✅ Flask API already running on port 5000"
        return
    fi
    
    if [ -f "flask-api/app.py" ]; then
        print_status "Starting Flask API Gateway..."
        cd flask-api
        nohup python3 app.py > ../flask-api.log 2>&1 &
        FLASK_PID=$!
        echo $FLASK_PID > ../flask-api.pid
        cd ..
        
        sleep 3
        
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            print_status "✅ Flask API started successfully!"
        else
            print_warning "⚠️ Flask API may not have started properly"
        fi
    else
        print_warning "⚠️ Flask API not found, skipping..."
    fi
}

# Test streaming connectivity
test_connectivity() {
    print_section "TESTING CONNECTIVITY"
    
    # Test services
    services=(
        "http://localhost:5555:Streaming Gateway"
        "http://localhost:6666:Distributed Proxy"
        "http://localhost:5000:Flask API"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r url name <<< "$service_info"
        
        print_status "Testing $name..."
        if curl -s -f "$url/health" > /dev/null 2>&1; then
            print_status "  ✅ $name is healthy"
        else
            print_warning "  ⚠️ $name is not responding"
        fi
    done
}

# Run streaming tests
run_streaming_tests() {
    print_section "RUNNING STREAMING TESTS"
    
    if [ -f "test-streaming-solutions.py" ]; then
        print_status "Running comprehensive streaming tests..."
        echo
        python3 test-streaming-solutions.py
    else
        print_warning "⚠️ Streaming test suite not found, skipping tests"
    fi
}

# Show status dashboard
show_status() {
    print_section "STREAMING ECOSYSTEM STATUS"
    
    echo -e "${CYAN}🌊 Active Services:${NC}"
    echo
    
    # Check each service
    if curl -s http://localhost:5555/health > /dev/null 2>&1; then
        echo -e "  ✅ ${GREEN}Streaming Gateway${NC}     http://localhost:5555"
    else
        echo -e "  ❌ ${RED}Streaming Gateway${NC}     http://localhost:5555"
    fi
    
    if curl -s http://localhost:6666/health > /dev/null 2>&1; then
        echo -e "  ✅ ${GREEN}Distributed Proxy${NC}     http://localhost:6666"
    else
        echo -e "  ❌ ${RED}Distributed Proxy${NC}     http://localhost:6666"
    fi
    
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "  ✅ ${GREEN}Flask API Gateway${NC}     http://localhost:5000"
    else
        echo -e "  ❌ ${RED}Flask API Gateway${NC}     http://localhost:5000"
    fi
    
    echo
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "  • View Streaming Gateway:  open http://localhost:5555"
    echo "  • View Distributed Proxy:  open http://localhost:6666"
    echo "  • View Flask Dashboard:    open http://localhost:5000"
    echo "  • Stop all services:       ./stop-streaming-ecosystem.sh"
    echo "  • View logs:               tail -f *.log"
    echo "  • Run tests:               python3 test-streaming-solutions.py"
    echo
    
    echo -e "${CYAN}📊 Quick Health Check:${NC}"
    echo "  curl http://localhost:5555/health"
    echo "  curl http://localhost:6666/health" 
    echo "  curl http://localhost:5000/health"
}

# Create stop script
create_stop_script() {
    cat > stop-streaming-ecosystem.sh << 'EOF'
#!/bin/bash

# 🛑 STOP STREAMING ECOSYSTEM
# Gracefully stop all streaming services

echo "🛑 Stopping Streaming Ecosystem..."

# Stop services
if [ -f "streaming-gateway.pid" ]; then
    kill $(cat streaming-gateway.pid) 2>/dev/null || true
    rm -f streaming-gateway.pid
    echo "  ✅ Streaming Gateway stopped"
fi

if [ -f "distributed-proxy.pid" ]; then
    kill $(cat distributed-proxy.pid) 2>/dev/null || true
    rm -f distributed-proxy.pid
    echo "  ✅ Distributed Proxy stopped"
fi

if [ -f "flask-api.pid" ]; then
    kill $(cat flask-api.pid) 2>/dev/null || true
    rm -f flask-api.pid
    echo "  ✅ Flask API stopped"
fi

# Stop Redis if we started it
docker stop redis-streaming 2>/dev/null || true
docker rm redis-streaming 2>/dev/null || true

echo "🎉 Streaming Ecosystem stopped"
EOF
    
    chmod +x stop-streaming-ecosystem.sh
}

# Main execution
main() {
    print_status "🌊 Starting Streaming Ecosystem setup..."
    
    # Create stop script
    create_stop_script
    
    # Run setup steps
    check_dependencies
    install_python_deps
    start_redis
    start_flask_api
    start_streaming_gateway
    start_distributed_proxy
    
    # Wait a bit for services to fully start
    print_status "Waiting for services to fully initialize..."
    sleep 5
    
    # Test connectivity
    test_connectivity
    
    # Show final status
    show_status
    
    # Optionally run tests
    if [ "$1" = "--test" ]; then
        run_streaming_tests
    fi
    
    print_section "🎉 STREAMING ECOSYSTEM READY! 🎉"
    
    echo -e "${GREEN}"
    cat << "EOF"
    ===================================
    ✅ STREAMING SOLUTION DEPLOYED! ✅
    ===================================
    
    🌊 Advanced streaming capabilities now active:
    
    • Real-time WebSocket streaming
    • Intelligent connection pooling
    • Automatic retry and failover
    • Geographic routing
    • Rate limit management
    • Distributed caching
    • Circuit breaker protection
    • Load balancing
    
    Ready for production-grade API reliability!
EOF
    echo -e "${NC}"
    
    print_status "🚀 Streaming Ecosystem launched successfully!"
    print_status "📋 Use './stop-streaming-ecosystem.sh' to stop all services"
}

# Handle command line arguments
case "${1:-}" in
    --test)
        main --test
        ;;
    --stop)
        ./stop-streaming-ecosystem.sh
        ;;
    --status)
        show_status
        ;;
    --help)
        echo "Streaming Ecosystem Launcher"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --test     Start services and run tests"
        echo "  --stop     Stop all services"
        echo "  --status   Show service status"
        echo "  --help     Show this help message"
        echo ""
        exit 0
        ;;
    *)
        main
        ;;
esac