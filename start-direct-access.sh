#!/bin/bash

# 🔑 Direct Access Portal Startup Script
# Simple authentication like GIS property lookup - no OAuth bureaucracy

set -e

echo "🔑 Starting Direct Access Portal System"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}=== $1 ===${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    local node_version=$(node --version)
    print_success "Node.js detected: $node_version"
}

# Check if required packages are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install express crypto-js
    fi
    
    print_success "Dependencies verified"
}

# Check if ports are available
check_ports() {
    print_status "Checking port availability..."
    
    local direct_auth_port=7001
    local portal_port=3333
    
    # Check direct access port
    if lsof -i :$direct_auth_port &> /dev/null; then
        print_warning "Port $direct_auth_port is already in use"
        print_status "Attempting to kill existing process..."
        
        local pid=$(lsof -t -i :$direct_auth_port)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            sleep 2
        fi
    fi
    
    # Check portal port
    if lsof -i :$portal_port &> /dev/null; then
        print_warning "Port $portal_port is already in use"
        print_status "Attempting to kill existing process..."
        
        local pid=$(lsof -t -i :$portal_port)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            sleep 2
        fi
    fi
    
    print_success "Ports are available"
}

# Start the direct access authentication system
start_direct_access() {
    print_header "Starting Direct Access Authentication System"
    
    print_status "Launching direct access system on port 7001..."
    
    # Start direct access system in background
    nohup node direct-access-auth.js > direct-access.log 2>&1 &
    local auth_pid=$!
    
    # Wait for direct access system to start
    sleep 3
    
    # Check if direct access system started successfully
    if ps -p $auth_pid > /dev/null; then
        print_success "Direct access system started successfully (PID: $auth_pid)"
        echo $auth_pid > direct-access.pid
    else
        print_error "Direct access system failed to start"
        cat direct-access.log
        exit 1
    fi
}

# Start the portal server
start_portal() {
    if [ -f "portal-server.js" ]; then
        print_header "Starting Document Generator Portal"
        
        print_status "Launching portal server on port 3333..."
        
        # Start portal in background
        nohup node portal-server.js > portal-direct.log 2>&1 &
        local portal_pid=$!
        
        # Wait for portal to start
        sleep 3
        
        # Check if portal started successfully
        if ps -p $portal_pid > /dev/null; then
            print_success "Portal server started successfully (PID: $portal_pid)"
            echo $portal_pid > portal-direct.pid
        else
            print_warning "Portal server failed to start"
            cat portal-direct.log
        fi
    else
        print_warning "portal-server.js not found - skipping portal startup"
    fi
}

# Health check
health_check() {
    print_header "System Health Check"
    
    sleep 5
    
    # Check direct access system health
    print_status "Checking direct access system health..."
    if curl -s http://localhost:7001/health &> /dev/null; then
        print_success "Direct access system is responding"
    else
        print_error "Direct access system health check failed"
    fi
    
    # Check portal health (if running)
    if [ -f "portal-direct.pid" ]; then
        print_status "Checking portal health..."
        if curl -s http://localhost:3333 &> /dev/null; then
            print_success "Portal is responding"
        else
            print_warning "Portal health check failed"
        fi
    fi
}

# Display access information
show_access_info() {
    print_header "Direct Access Information"
    
    echo ""
    echo "🔑 Direct Access Portal:"
    echo "   http://localhost:7001"
    echo ""
    echo "🗂️ Simple Authentication:"
    echo "   Like GIS property lookup - no OAuth bureaucracy"
    echo ""
    
    if [ -f "portal-direct.pid" ]; then
        echo "🌐 Document Generator Portal:"
        echo "   http://localhost:3333/portal"
        echo ""
        echo "🔗 Portal Direct Login:"
        echo "   http://localhost:3333/portal/auth/direct-login"
        echo ""
    fi
    
    print_header "Available API Keys (Development)"
    echo "admin-key-12345"
    echo "portal-master-key"
    echo "document-generator-key"
    echo "public-records-access-key"
    echo ""
    
    print_header "Authentication Methods"
    echo "🔑 API Key Login - Enter any development key above"
    echo "🚫 Admin Bypass - Skip all authentication"
    echo "⚡ Direct Access - No OAuth flows or providers"
    echo "🗂️ Public Records Style - Simple and direct"
    echo ""
    
    print_header "Log Files"
    echo "Direct Access: direct-access.log"
    if [ -f "portal-direct.pid" ]; then
        echo "Portal Server: portal-direct.log"
    fi
    echo ""
    
    print_success "Direct access system operational!"
}

# Create stop script
create_stop_script() {
    cat > stop-direct-access.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Direct Access Portal System..."

# Stop direct access system
if [ -f "direct-access.pid" ]; then
    kill $(cat direct-access.pid) 2>/dev/null || true
    rm -f direct-access.pid
    echo "✅ Direct access system stopped"
fi

# Stop portal
if [ -f "portal-direct.pid" ]; then
    kill $(cat portal-direct.pid) 2>/dev/null || true
    rm -f portal-direct.pid
    echo "✅ Portal server stopped"
fi

echo "🔑 Direct Access Portal System stopped completely"
EOF
    
    chmod +x stop-direct-access.sh
    print_success "Created stop-direct-access.sh script"
}

# Enable bypass mode if requested
setup_bypass_mode() {
    if [ "$1" == "--bypass" ]; then
        export BYPASS_AUTH=true
        print_warning "BYPASS MODE ENABLED - All authentication disabled"
        echo "BYPASS_AUTH=true" > .env.direct
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --bypass    Enable bypass mode (skip all authentication)"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Start with normal authentication"
    echo "  $0 --bypass       # Start with bypass mode (no auth)"
    echo ""
}

# Trap to handle script interruption
cleanup() {
    echo ""
    print_warning "Received interrupt signal"
    ./stop-direct-access.sh
    exit 0
}

trap cleanup INT TERM

# Main execution
main() {
    # Check for help flag
    if [ "$1" == "--help" ]; then
        show_usage
        exit 0
    fi
    
    print_header "Direct Access Portal System Startup"
    
    # Setup bypass mode if requested
    setup_bypass_mode "$1"
    
    check_nodejs
    check_dependencies
    check_ports
    
    start_direct_access
    start_portal
    
    health_check
    create_stop_script
    show_access_info
    
    print_header "System Started Successfully"
    print_success "Direct Access Portal System is running!"
    print_status "Authentication works like GIS property lookup - simple and direct"
    print_status "Press Ctrl+C to stop all services"
    
    # Keep script running
    while true; do
        sleep 10
        
        # Check if direct access system is still running
        if [ -f "direct-access.pid" ]; then
            local pid=$(cat direct-access.pid)
            if ! ps -p $pid > /dev/null; then
                print_error "Direct access system stopped unexpectedly"
                break
            fi
        fi
    done
}

# Run main function
main "$@"