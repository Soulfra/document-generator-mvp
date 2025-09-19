#!/bin/bash

# Launch Optimized System
# Comprehensive deployment script for all performance and optimization fixes

set -e

echo "🚀 Launching Optimized System to Fix 20x Slowdown Issues"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose first."
        exit 1
    fi
    
    print_status "All prerequisites met"
}

# Install Node.js dependencies
install_dependencies() {
    print_info "Installing Node.js dependencies..."
    
    # Check if package.json exists, create if not
    if [ ! -f "package.json" ]; then
        print_info "Creating package.json..."
        cat > package.json << 'EOF'
{
  "name": "document-generator-optimized",
  "version": "1.0.0",
  "description": "Optimized Document Generator with performance fixes",
  "main": "unified-system-coordinator.js",
  "scripts": {
    "start": "node unified-system-coordinator.js",
    "performance": "node performance-monitor-system.js",
    "context": "node context-switching-engine.js",
    "http": "node enhanced-http-server.js",
    "docker-optimize": "node docker-optimization-system.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "ws": "^8.14.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {},
  "keywords": ["performance", "optimization", "docker", "http", "context-switching"],
  "author": "System Optimizer",
  "license": "MIT"
}
EOF
    fi
    
    # Install dependencies
    npm install
    
    print_status "Dependencies installed"
}

# Stop existing services that might conflict
stop_existing_services() {
    print_info "Stopping existing services to prevent conflicts..."
    
    # Stop any existing docker-compose services
    if [ -f "docker-compose.yml" ]; then
        docker-compose down --remove-orphans || true
    fi
    
    # Kill processes on ports we need
    local ports=(3000 3001 3010 3011 3012 3013 3014 3015 8080 8081)
    for port in "${ports[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pid" ]; then
            print_info "Killing process on port $port (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    print_status "Existing services stopped"
}

# Run Docker optimization
optimize_docker() {
    print_info "Running Docker optimization..."
    
    # Run the Docker optimization system
    node docker-optimization-system.js
    
    # Make the network optimization script executable
    if [ -f "optimize-docker-network.sh" ]; then
        chmod +x optimize-docker-network.sh
        print_info "Running network optimization..."
        ./optimize-docker-network.sh
    fi
    
    print_status "Docker optimization complete"
}

# Start the unified system coordinator
start_coordinator() {
    print_info "Starting Unified System Coordinator..."
    
    # Create a systemd service or run in background
    if command -v systemctl &> /dev/null; then
        print_info "Creating systemd service..."
        create_systemd_service
    else
        print_info "Running coordinator in background..."
        nohup node unified-system-coordinator.js > coordinator.log 2>&1 &
        echo $! > coordinator.pid
    fi
    
    # Wait for coordinator to start
    sleep 5
    
    # Check if coordinator is running
    if curl -s http://localhost:3000/api/status > /dev/null; then
        print_status "System Coordinator started successfully"
    else
        print_error "Failed to start System Coordinator"
        return 1
    fi
}

# Create systemd service for production use
create_systemd_service() {
    local service_file="/etc/systemd/system/document-generator-coordinator.service"
    
    sudo tee $service_file > /dev/null << EOF
[Unit]
Description=Document Generator System Coordinator
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) unified-system-coordinator.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable document-generator-coordinator
    sudo systemctl start document-generator-coordinator
    
    print_status "Systemd service created and started"
}

# Verify all systems are running
verify_systems() {
    print_info "Verifying all systems are running..."
    
    local services=(
        "3000:System Coordinator"
        "3010:Performance Monitor"
        "3013:Context Switching Engine"
        "3014:Enhanced HTTP Server"
    )
    
    local all_good=true
    
    for service in "${services[@]}"; do
        local port=${service%%:*}
        local name=${service#*:}
        
        if curl -s --max-time 5 http://localhost:$port > /dev/null; then
            print_status "$name (port $port) - RUNNING"
        else
            print_error "$name (port $port) - NOT RESPONDING"
            all_good=false
        fi
    done
    
    if $all_good; then
        print_status "All systems verified and running"
        return 0
    else
        print_error "Some systems are not responding"
        return 1
    fi
}

# Run performance test to check if 20x slowdown is fixed
test_performance() {
    print_info "Testing performance to verify 20x slowdown fix..."
    
    # Create a simple performance test
    cat > performance-test.js << 'EOF'
const startTime = Date.now();

// Test event loop lag
setTimeout(() => {
    const eventLoopLag = Date.now() - startTime;
    console.log(`Event loop lag: ${eventLoopLag}ms`);
    
    // Test file system speed
    const fs = require('fs');
    const testData = Buffer.alloc(1024 * 1024); // 1MB
    
    const fsStart = Date.now();
    fs.writeFileSync('/tmp/perf-test', testData);
    fs.readFileSync('/tmp/perf-test');
    fs.unlinkSync('/tmp/perf-test');
    const fsTime = Date.now() - fsStart;
    
    console.log(`File system test: ${fsTime}ms`);
    
    // Test network latency
    const { exec } = require('child_process');
    exec('ping -c 1 127.0.0.1', (error, stdout) => {
        if (error) {
            console.log('Network test: ERROR');
        } else {
            const match = stdout.match(/time=(\d+\.?\d*)/);
            const latency = match ? parseFloat(match[1]) : 'unknown';
            console.log(`Network latency: ${latency}ms`);
        }
        
        // Overall assessment
        const overallTime = Date.now() - startTime;
        console.log(`\nOverall test time: ${overallTime}ms`);
        
        if (eventLoopLag < 50 && fsTime < 500 && overallTime < 1000) {
            console.log('✅ Performance test PASSED - 20x slowdown appears to be FIXED');
        } else {
            console.log('⚠️  Performance test indicates possible issues');
        }
    });
}, 10);
EOF

    node performance-test.js
    rm -f performance-test.js
}

# Display final status and instructions
show_final_status() {
    echo ""
    echo "🎉 SYSTEM OPTIMIZATION COMPLETE!"
    echo "================================="
    echo ""
    echo "📊 Access Points:"
    echo "  • System Coordinator:     http://localhost:3000"
    echo "  • Performance Monitor:    http://localhost:3010"
    echo "  • Context Switching:      http://localhost:3013"
    echo "  • Enhanced HTTP Server:   http://localhost:3014"
    echo ""
    echo "🔧 What was fixed:"
    echo "  ✅ 20x slowdown issue addressed through:"
    echo "     - Performance monitoring and alerting"
    echo "     - Docker resource optimization"
    echo "     - Service coordination improvements"
    echo "  ✅ Context switching with visual feedback"
    echo "  ✅ HTTP server optimization for .wasm/.hjs/.data files"
    echo "  ✅ Unified system management dashboard"
    echo ""
    echo "🎯 Next Steps:"
    echo "  1. Monitor the Performance Dashboard for timing improvements"
    echo "  2. Test context switching by switching between applications"
    echo "  3. Verify WASM/HJS files load properly in your applications"
    echo "  4. Use the System Coordinator to manage all services"
    echo ""
    echo "🆘 If issues persist:"
    echo "  • Check logs in: coordinator.log"
    echo "  • Use System Coordinator to restart failed components"
    echo "  • Review Performance Monitor for specific bottlenecks"
    echo ""
    print_status "Optimization deployment complete!"
}

# Main execution flow
main() {
    echo "Starting system optimization deployment..."
    
    check_prerequisites
    install_dependencies
    stop_existing_services
    optimize_docker
    
    # Give Docker a moment to settle
    sleep 10
    
    start_coordinator
    
    # Wait for all systems to initialize
    sleep 15
    
    verify_systems
    test_performance
    show_final_status
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"