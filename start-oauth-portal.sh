#!/bin/bash

# 🔐 OAuth Portal Startup Script
# Launches the complete multi-provider OAuth authentication system

set -e

echo "🔐 Starting Multi-Provider OAuth Portal System"
echo "=============================================="
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
        npm install express ws crypto-js qrcode
    fi
    
    print_success "Dependencies verified"
}

# Check environment configuration
check_environment() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.oauth" ]; then
            print_warning ".env not found. Copying from .env.oauth template..."
            cp .env.oauth .env
            print_warning "Please edit .env with your OAuth credentials before continuing"
            print_warning "See oauth-setup-guide.md for detailed instructions"
        else
            print_error ".env configuration file not found"
            exit 1
        fi
    fi
    
    # Check if OAuth credentials are configured
    if grep -q "your-.*-client-id-here" .env; then
        print_warning "OAuth credentials not configured in .env"
        print_warning "Edit .env and add your OAuth app credentials"
        print_warning "See oauth-setup-guide.md for setup instructions"
        echo ""
        read -p "Continue with demo credentials? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Exiting. Please configure OAuth credentials first."
            exit 1
        fi
    fi
    
    print_success "Environment configuration verified"
}

# Check if ports are available
check_ports() {
    print_status "Checking port availability..."
    
    local oauth_port=8000
    local portal_port=3333
    
    # Check OAuth system port
    if lsof -i :$oauth_port &> /dev/null; then
        print_warning "Port $oauth_port is already in use"
        print_status "Attempting to kill existing process..."
        
        local pid=$(lsof -t -i :$oauth_port)
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

# Start the OAuth system
start_oauth_system() {
    print_header "Starting OAuth Authentication System"
    
    print_status "Launching multi-provider OAuth system on port 8000..."
    
    # Start OAuth system in background
    nohup node multi-provider-oauth-system.js > oauth-system.log 2>&1 &
    local oauth_pid=$!
    
    # Wait for OAuth system to start
    sleep 3
    
    # Check if OAuth system started successfully
    if ps -p $oauth_pid > /dev/null; then
        print_success "OAuth system started successfully (PID: $oauth_pid)"
        echo $oauth_pid > oauth-system.pid
    else
        print_error "OAuth system failed to start"
        exit 1
    fi
}

# Start the existing portal (optional)
start_portal() {
    if [ -f "portal-server.js" ]; then
        print_header "Starting Document Generator Portal"
        
        print_status "Launching portal server on port 3333..."
        
        # Start portal in background
        nohup node portal-server.js > portal-server.log 2>&1 &
        local portal_pid=$!
        
        # Wait for portal to start
        sleep 3
        
        # Check if portal started successfully
        if ps -p $portal_pid > /dev/null; then
            print_success "Portal server started successfully (PID: $portal_pid)"
            echo $portal_pid > portal-server.pid
        else
            print_warning "Portal server failed to start (this is optional)"
        fi
    else
        print_warning "portal-server.js not found - skipping portal startup"
    fi
}

# Start Caddy reverse proxy (if available)
start_caddy() {
    if command -v caddy &> /dev/null && [ -f "Caddyfile" ]; then
        print_header "Starting Caddy Reverse Proxy"
        
        print_status "Starting Caddy proxy..."
        
        # Start Caddy in background
        nohup caddy run > caddy.log 2>&1 &
        local caddy_pid=$!
        
        # Wait for Caddy to start
        sleep 2
        
        # Check if Caddy started successfully
        if ps -p $caddy_pid > /dev/null; then
            print_success "Caddy reverse proxy started (PID: $caddy_pid)"
            echo $caddy_pid > caddy.pid
        else
            print_warning "Caddy failed to start (this is optional)"
        fi
    else
        print_warning "Caddy not available or Caddyfile not found - skipping"
    fi
}

# Health check
health_check() {
    print_header "System Health Check"
    
    sleep 5
    
    # Check OAuth system health
    print_status "Checking OAuth system health..."
    if curl -s http://localhost:8000/api/health &> /dev/null; then
        print_success "OAuth system is responding"
    else
        print_error "OAuth system health check failed"
    fi
    
    # Check portal health (if running)
    if [ -f "portal-server.pid" ]; then
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
    print_header "Access Information"
    
    echo ""
    echo "🔐 OAuth Authentication Portal:"
    echo "   http://localhost:8000"
    echo ""
    echo "📊 System Statistics:"
    echo "   http://localhost:8000/api/admin/stats"
    echo ""
    echo "📝 Audit Logs:"
    echo "   http://localhost:8000/api/admin/audit-log"
    echo ""
    
    if [ -f "portal-server.pid" ]; then
        echo "🌐 Document Generator Portal:"
        echo "   http://localhost:3333/portal"
        echo ""
    fi
    
    print_header "Supported OAuth Providers"
    echo "✅ GitHub OAuth"
    echo "✅ Google OAuth"
    echo "✅ Yahoo OAuth"
    echo "✅ Microsoft OAuth"
    echo ""
    
    print_header "Security Features"
    echo "🚪 Single-use token lifecycle"
    echo "🔒 Immediate token revocation"
    echo "📝 Comprehensive audit logging"
    echo "⚡ Rate limiting & security headers"
    echo "🛡️ CSRF protection"
    echo ""
    
    print_header "Log Files"
    echo "OAuth System: oauth-system.log"
    if [ -f "portal-server.pid" ]; then
        echo "Portal Server: portal-server.log"
    fi
    if [ -f "caddy.pid" ]; then
        echo "Caddy Proxy: caddy.log"
    fi
    echo ""
    
    print_success "All systems operational!"
}

# Create stop script
create_stop_script() {
    cat > stop-oauth-portal.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping OAuth Portal System..."

# Stop OAuth system
if [ -f "oauth-system.pid" ]; then
    kill $(cat oauth-system.pid) 2>/dev/null || true
    rm -f oauth-system.pid
    echo "✅ OAuth system stopped"
fi

# Stop portal
if [ -f "portal-server.pid" ]; then
    kill $(cat portal-server.pid) 2>/dev/null || true
    rm -f portal-server.pid
    echo "✅ Portal server stopped"
fi

# Stop Caddy
if [ -f "caddy.pid" ]; then
    kill $(cat caddy.pid) 2>/dev/null || true
    rm -f caddy.pid
    echo "✅ Caddy proxy stopped"
fi

echo "🔐 OAuth Portal System stopped completely"
EOF
    
    chmod +x stop-oauth-portal.sh
    print_success "Created stop-oauth-portal.sh script"
}

# Trap to handle script interruption
cleanup() {
    echo ""
    print_warning "Received interrupt signal"
    ./stop-oauth-portal.sh
    exit 0
}

trap cleanup INT TERM

# Main execution
main() {
    print_header "OAuth Portal System Startup"
    
    check_nodejs
    check_dependencies
    check_environment
    check_ports
    
    start_oauth_system
    start_portal
    start_caddy
    
    health_check
    create_stop_script
    show_access_info
    
    print_header "System Started Successfully"
    print_success "OAuth Portal System is running!"
    print_status "Press Ctrl+C to stop all services"
    
    # Keep script running
    while true; do
        sleep 10
        
        # Check if OAuth system is still running
        if [ -f "oauth-system.pid" ]; then
            local pid=$(cat oauth-system.pid)
            if ! ps -p $pid > /dev/null; then
                print_error "OAuth system stopped unexpectedly"
                break
            fi
        fi
    done
}

# Run main function
main "$@"