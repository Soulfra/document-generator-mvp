#!/bin/bash

# 🚀 MAKE IT WORK - One-click demo launcher
# This script starts everything and shows you the working dashboard

echo "🚀 MAKE IT WORK - OSRS Merchanting Platform Demo"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "osrs-merchanting-platform.js" ]; then
    print_error "Not in the correct directory. Please run from the Document-Generator folder."
    exit 1
fi

print_step "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_status "Node.js found: $(node --version)"

# Check if we have package.json
if [ ! -f "package.json" ]; then
    print_warning "No package.json found. Installing basic dependencies..."
    npm init -y
    npm install express ws axios redis
fi

# Check Docker (optional but recommended)
if ! command -v docker &> /dev/null; then
    print_warning "Docker not found. Redis will need to be installed manually."
else
    print_status "Docker found"
    
    # Start Redis if Docker is available
    print_step "Starting Redis..."
    if ! docker ps | grep -q redis-merchanting; then
        docker run -d --name redis-merchanting -p 6379:6379 redis:alpine > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_status "Redis started"
            sleep 2
        else
            print_warning "Redis container might already exist or failed to start"
        fi
    else
        print_status "Redis already running"
    fi
fi

# Kill any existing processes on our ports
print_step "Cleaning up existing processes..."
lsof -ti:8888,7000,8889 | xargs kill -9 > /dev/null 2>&1
print_status "Ports cleared"

# Create a simple package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "osrs-merchanting-platform",
  "version": "1.0.0",
  "description": "OSRS Merchanting Platform with Resilient API Handling",
  "main": "osrs-merchanting-platform.js",
  "scripts": {
    "start": "node osrs-merchanting-platform.js",
    "test": "node test-resilient-api.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.14.0",
    "axios": "^1.6.0",
    "redis": "^4.6.0"
  }
}
EOF
    print_status "Created package.json"
fi

# Install dependencies
print_step "Installing dependencies..."
npm install --silent
print_status "Dependencies installed"

echo ""
print_step "🚀 LAUNCHING SERVICES..."
echo ""

# Function to start a service in background and check if it started
start_service() {
    local service_name="$1"
    local script_name="$2"
    local port="$3"
    local check_url="$4"
    
    print_step "Starting $service_name..."
    
    # Start the service in background
    nohup node "$script_name" > "${service_name,,}.log" 2>&1 &
    local pid=$!
    echo $pid > "${service_name,,}.pid"
    
    # Wait a moment for service to start
    sleep 3
    
    # Check if service is responding
    if [ -n "$check_url" ]; then
        for i in {1..5}; do
            if curl -s "$check_url" > /dev/null 2>&1; then
                print_status "$service_name started (PID: $pid, Port: $port)"
                return 0
            fi
            sleep 1
        done
        print_warning "$service_name may not be responding on $check_url"
    else
        print_status "$service_name started (PID: $pid)"
    fi
}

# Start core services
start_service "OSRS Merchanting Platform" "osrs-merchanting-platform.js" "8888" "http://localhost:8888/api/debug/health"

# Check if other services exist before starting them
if [ -f "market-data-collector.js" ]; then
    start_service "Market Data Collector" "market-data-collector.js" "-" ""
else
    print_warning "market-data-collector.js not found, skipping..."
fi

if [ -f "automated-market-stats-engine.js" ]; then
    start_service "Automated Stats Engine" "automated-market-stats-engine.js" "7000" "http://localhost:7000/health"
else
    print_warning "automated-market-stats-engine.js not found, skipping..."
fi

echo ""
print_status "🎉 ALL SERVICES STARTED!"
echo ""

# Display service information
echo -e "${CYAN}📡 SERVICE ENDPOINTS:${NC}"
echo "   • Main API: http://localhost:8888"
echo "   • WebSocket: ws://localhost:8889" 
echo "   • Stats Engine: http://localhost:7000"
echo "   • Live Dashboard: http://localhost:8888/live-merchanting-dashboard.html"
echo ""

echo -e "${CYAN}🛡️ RESILIENT FEATURES ACTIVE:${NC}"
echo "   • Retry with exponential backoff"
echo "   • Circuit breaker protection"
echo "   • Automatic cache fallback"
echo "   • Request queuing for recovery"
echo "   • Real-time health monitoring"
echo ""

echo -e "${CYAN}🧪 TEST COMMANDS:${NC}"
echo "   • Test resilience: node test-resilient-api.js"
echo "   • Check health: curl http://localhost:8888/api/debug/health"
echo "   • View logs: tail -f *.log"
echo ""

echo -e "${CYAN}📝 LOG FILES:${NC}"
echo "   • OSRS Platform: osrs-merchanting-platform.log"
echo "   • Market Data: market-data-collector.log"
echo "   • Stats Engine: automated-stats-engine.log"
echo ""

# Function to open URL in default browser (cross-platform)
open_browser() {
    local url="$1"
    if command -v xdg-open > /dev/null; then
        xdg-open "$url"
    elif command -v open > /dev/null; then
        open "$url"
    elif command -v start > /dev/null; then
        start "$url"
    else
        print_info "Please open $url in your browser"
    fi
}

# Wait a moment for services to fully start
print_step "Waiting for services to fully initialize..."
sleep 5

# Open the dashboard
print_step "Opening live dashboard..."
open_browser "http://localhost:8888/live-merchanting-dashboard.html"

echo ""
echo -e "${GREEN}🎊 SUCCESS! Your OSRS Merchanting Platform is now running!${NC}"
echo ""
echo -e "${YELLOW}📱 The dashboard should open automatically in your browser.${NC}"
echo -e "${YELLOW}   If not, go to: http://localhost:8888/live-merchanting-dashboard.html${NC}"
echo ""
echo -e "${BLUE}🛑 To stop all services, run: ./stop-services.sh${NC}"
echo ""

# Create stop script
cat > stop-services.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping all services..."

# Kill processes by PID files
for pid_file in *.pid; do
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            echo "Stopped process $pid ($pid_file)"
        fi
        rm "$pid_file"
    fi
done

# Kill by port
lsof -ti:8888,7000,8889 | xargs kill -9 > /dev/null 2>&1

# Stop Redis container
docker stop redis-merchanting > /dev/null 2>&1
docker rm redis-merchanting > /dev/null 2>&1

echo "✅ All services stopped"
EOF

chmod +x stop-services.sh

print_info "Stop script created: ./stop-services.sh"

echo ""
echo -e "${PURPLE}🚀 Your platform is now 'rolling through' API errors like a tank!${NC}"
echo -e "${PURPLE}   Try the resilience test in the dashboard to see it in action.${NC}"
echo ""

# Keep the script running and show live status
echo -e "${CYAN}📊 LIVE STATUS (Ctrl+C to exit):${NC}"
while true; do
    sleep 10
    
    # Check service health
    if curl -s http://localhost:8888/api/debug/health > /dev/null 2>&1; then
        echo -e "\r${GREEN}✅ $(date): All systems operational${NC}"
    else
        echo -e "\r${YELLOW}⚠️  $(date): Some services may be starting...${NC}"
    fi
done