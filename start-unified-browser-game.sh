#!/bin/bash

# 🎮 UNIFIED BROWSER GAME STARTUP SCRIPT
# Consolidates scattered files and launches Cal Freedom Arena

echo "🚀 Starting Cal Freedom Browser Game - Document Generator Universe"
echo "📂 Consolidating 700+ scattered files..."

# Set script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

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
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

print_success "Node.js found: $(node --version)"

# Check if required files exist
required_files=(
    "browser-game-launcher.html"
    "unified-startup-orchestrator.js"
    "unified-game-framework.css"
    "mud-style-overlays.css"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found required file: $file"
    else
        print_warning "Creating missing file: $file"
        case $file in
            "unified-game-framework.css")
                echo "/* Placeholder for unified game framework CSS */" > "$file"
                ;;
            "mud-style-overlays.css")
                echo "/* Placeholder for MUD style overlays CSS */" > "$file"
                ;;
        esac
    fi
done

# Create consolidated services directory structure
print_status "Creating consolidated directory structure..."

mkdir -p consolidated-services/{core,docker-infrastructure,cal-freedom,animations,experimental,interfaces,scripts,deprecated}

print_success "Directory structure created"

# Check for Docker services (optional)
print_status "Checking Docker services..."

if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        print_success "Docker is running"
        
        # Check if our services are running
        services=("postgres:5432" "redis:6379" "template-processor:3000" "ai-api:3001")
        for service in "${services[@]}"; do
            port="${service#*:}"
            name="${service%:*}"
            
            if nc -z localhost "$port" 2>/dev/null; then
                print_success "$name service is running on port $port"
            else
                print_warning "$name service not running on port $port"
            fi
        done
    else
        print_warning "Docker is installed but not running"
    fi
else
    print_warning "Docker not found - will run in standalone mode"
fi

# Start the unified orchestrator
print_status "Starting Unified Startup Orchestrator..."

# Run the orchestrator in background
node unified-startup-orchestrator.js &
ORCHESTRATOR_PID=$!

# Wait a moment for orchestrator to initialize
sleep 3

# Check if orchestrator is still running
if kill -0 $ORCHESTRATOR_PID 2>/dev/null; then
    print_success "Unified orchestrator started (PID: $ORCHESTRATOR_PID)"
else
    print_error "Failed to start unified orchestrator"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to initialize..."
sleep 5

# Check if browser game interface is accessible
interface_port=8888
if nc -z localhost "$interface_port" 2>/dev/null; then
    print_success "Browser game interface is ready on port $interface_port"
else
    print_warning "Browser game interface not yet ready on port $interface_port"
fi

# Mobile bridge check
mobile_port=9877
if nc -z localhost "$mobile_port" 2>/dev/null; then
    print_success "Mobile bridge is ready on port $mobile_port"
else
    print_warning "Mobile bridge not yet ready on port $mobile_port"
fi

# Print access information
echo ""
echo -e "${PURPLE}🎮 Cal Freedom Browser Game - Ready to Launch!${NC}"
echo ""
echo -e "${CYAN}📱 Access Points:${NC}"
echo -e "   🌐 Browser Game: ${GREEN}http://localhost:$interface_port${NC}"
echo -e "   📱 Mobile Bridge: ${GREEN}http://localhost:$mobile_port${NC}"
echo -e "   📊 Status API: ${GREEN}http://localhost:$interface_port/status${NC}"
echo ""
echo -e "${CYAN}🎯 Features Available:${NC}"
echo -e "   ✅ Cal Freedom Arena (MUD-style interface)"
echo -e "   ✅ File consolidation (700+ files organized)"
echo -e "   ✅ Mobile QR code mirroring to soulfra.github.io"
echo -e "   ✅ Theme switching (Cyberpunk/Matrix/Halo/SoulFRA)"
echo -e "   ✅ Analytics dashboard integration"
echo -e "   ✅ Docker service separation from animations/blackholes"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo -e "   1. Open ${GREEN}http://localhost:$interface_port${NC} in your browser"
echo -e "   2. Click 'Launch Game Arena' to enter Cal Freedom"
echo -e "   3. Scan QR code with iPhone for mobile mirroring"
echo -e "   4. Use 'System Console' to manage file consolidation"
echo ""

# Option to open browser automatically
read -p "🌐 Open browser automatically? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "http://localhost:$interface_port"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:$interface_port"
    elif command -v start &> /dev/null; then
        start "http://localhost:$interface_port"
    else
        print_warning "Could not detect how to open browser automatically"
    fi
fi

# Keep script running and monitor services
print_status "Monitoring services... (Press Ctrl+C to stop)"

# Trap interrupt signal to cleanup
cleanup() {
    print_status "Shutting down services..."
    
    # Kill orchestrator
    if kill -0 $ORCHESTRATOR_PID 2>/dev/null; then
        kill $ORCHESTRATOR_PID
        print_success "Unified orchestrator stopped"
    fi
    
    print_success "Shutdown complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Monitor loop
while true; do
    sleep 10
    
    # Check if orchestrator is still running
    if ! kill -0 $ORCHESTRATOR_PID 2>/dev/null; then
        print_error "Unified orchestrator stopped unexpectedly"
        exit 1
    fi
    
    # Optional: Check service health
    # You can add more sophisticated monitoring here
done