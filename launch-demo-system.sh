#!/bin/bash
#
# Launch Complete Demo System
# Starts all demo and presentation tools for showcasing system functionality
#

echo "🎬 LAUNCHING COMPLETE DEMO SYSTEM"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start a service
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    local log_file=$4
    
    echo -e "${YELLOW}Starting $service_name...${NC}"
    
    # Check if already running
    if check_port $port; then
        echo -e "${GREEN}✓ $service_name already running on port $port${NC}"
        return
    fi
    
    # Start the service
    nohup $command > "$log_file" 2>&1 &
    local pid=$!
    
    # Wait for service to start
    sleep 3
    
    # Check if started successfully
    if check_port $port; then
        echo -e "${GREEN}✓ $service_name started successfully (PID: $pid)${NC}"
        echo $pid > "${service_name}.pid"
    else
        echo -e "${RED}✗ Failed to start $service_name${NC}"
        echo "Check log file: $log_file"
        return 1
    fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Install Node.js dependencies if needed
echo "📦 Checking Node.js dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/puppeteer/package.json" ]; then
    echo "Installing Node.js dependencies..."
    npm install puppeteer ws axios csv-writer exceljs
fi

# Check Python dependencies
echo "📦 Checking Python dependencies..."
if ! python3 -c "import flask, pandas" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip3 install flask flask-cors pandas xlsxwriter
fi

# Check system dependencies
echo "📦 Checking system dependencies..."
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}⚠️ FFmpeg not found. Install with: brew install ffmpeg${NC}"
fi

if ! command -v convert &> /dev/null; then
    echo -e "${YELLOW}⚠️ ImageMagick not found. Install with: brew install imagemagick${NC}"
fi

echo ""
echo -e "${CYAN}🚀 STARTING CORE SERVICES${NC}"
echo "========================"

# Start Math Meme Time System first
echo -e "${YELLOW}Starting Math Meme Time System...${NC}"
if [ -f "./launch-math-meme-system.sh" ]; then
    ./launch-math-meme-system.sh > logs/math-meme-system.log 2>&1 &
    sleep 5
else
    # Start individual components
    start_service "math-meme-time-engine" \
        "node math-meme-time-engine.js" \
        3017 \
        "logs/math-meme-time-engine.log"
    
    start_service "time-flask-service" \
        "python3 time-flask-service.py" \
        5000 \
        "logs/time-flask-service.log"
    
    start_service "integration-bridge" \
        "node integration-bridge-system.js" \
        3018 \
        "logs/integration-bridge.log"
fi

# Start Performance Monitor if available
if [ -f "performance-monitor-system.js" ]; then
    start_service "performance-monitor" \
        "node performance-monitor-system.js" \
        3010 \
        "logs/performance-monitor.log"
fi

# Start Context Switching Engine if available
if [ -f "context-switching-engine.js" ]; then
    start_service "context-switching" \
        "node context-switching-engine.js" \
        3013 \
        "logs/context-switching.log"
fi

echo ""
echo -e "${CYAN}🎬 STARTING DEMO SERVICES${NC}"
echo "========================"

# Start Demo Capture Studio
start_service "demo-capture-studio" \
    "node demo-capture-studio.js" \
    3020 \
    "logs/demo-capture-studio.log"

# Wait for browser to initialize
sleep 5

# Start Quick Demo Generator
start_service "quick-demo-generator" \
    "node quick-demo-generator.js" \
    3021 \
    "logs/quick-demo-generator.log"

echo ""
echo -e "${CYAN}🎯 DEMO SYSTEM STATUS${NC}"
echo "===================="
echo ""

# Check all services and show URLs
services=(
    "math-meme-time-engine:3017:Math Meme Time Engine"
    "time-flask-service:5000:Flask Time Service"
    "integration-bridge:3018:Integration Bridge"
    "performance-monitor:3010:Performance Monitor"
    "context-switching:3013:Context Switching"
    "demo-capture-studio:3020:Demo Capture Studio"
    "quick-demo-generator:3021:Quick Demo Generator"
)

for service_info in "${services[@]}"; do
    IFS=':' read -r name port desc <<< "$service_info"
    if check_port $port; then
        echo -e "${GREEN}✓ $desc${NC}"
        echo "  Dashboard: http://localhost:$port"
    else
        echo -e "${RED}✗ $desc (not running)${NC}"
    fi
done

echo ""
echo -e "${CYAN}🎭 PRESENTATION TOOLS${NC}"
echo "==================="
echo ""

# Create HTML5 presentation launcher
echo -e "${GREEN}✓ HTML5 Presentation Engine${NC}"
echo "  File: ./html5-presentation-engine.html"
echo "  Usage: Open in browser for self-contained demo"

echo ""
echo -e "${GREEN}✓ Unified Demo Hub Dashboard${NC}"
echo "  File: ./unified-demo-hub.html"
echo "  Usage: Central control for all demo capabilities"

echo ""
echo -e "${CYAN}📋 DEMO SCENARIOS AVAILABLE${NC}"
echo "==========================="
echo ""
echo "• System Overview (30s) - Complete system tour"
echo "• Math Meme Focus (25s) - Time compression demo"
echo "• Performance Focus (20s) - Monitoring showcase"
echo "• Quick Tour (15s) - Fast system overview"

echo ""
echo -e "${CYAN}🎮 QUICK START COMMANDS${NC}"
echo "======================="
echo ""
echo "# Open Demo Capture Studio"
echo "open http://localhost:3020"
echo ""
echo "# Open Quick Demo Generator"
echo "open http://localhost:3021"
echo ""
echo "# Open HTML5 Presentation"
echo "open ./html5-presentation-engine.html"
echo ""
echo "# Open Unified Demo Hub (MAIN DASHBOARD)"
echo "open ./unified-demo-hub.html"
echo ""
echo "# Stage Timer (embedded in Demo Studio)"
echo "open http://localhost:3019"

echo ""
echo -e "${CYAN}🎯 RECOMMENDED DEMO FLOW${NC}"
echo "========================"
echo ""
echo "1. 🎯 Start with Unified Demo Hub Dashboard"
echo "   → Central control for all demo capabilities"
echo ""
echo "2. 🎬 Use HTML5 Presentation Engine for presentations"
echo "   → Self-contained presentation with animations"
echo ""
echo "3. 📹 Use Demo Capture Studio for live recording"
echo "   → Screen capture with stage timer"
echo ""
echo "4. ⚡ Generate automated demos with Quick Demo Generator"
echo "   → Puppeteer-based screenshot sequences"
echo ""
echo "5. 🎭 Switch to Audience Mode for clean presentations"
echo "   → Professional full-screen demo interface"

# Create convenience scripts
cat > open-demo-dashboards.sh << 'EOF'
#!/bin/bash
echo "🌐 Opening all demo dashboards..."
open ./unified-demo-hub.html  # Main Demo Hub (open first)
sleep 2
open http://localhost:3020  # Demo Capture Studio
open http://localhost:3021  # Quick Demo Generator
open ./html5-presentation-engine.html  # HTML5 Presentation
EOF

cat > stop-demo-system.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Demo System..."

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file="${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill $pid 2>/dev/null; then
            echo "✓ Stopped $service_name"
            rm "$pid_file"
        else
            echo "⚠️  $service_name was not running"
            rm "$pid_file"
        fi
    else
        echo "⚠️  No PID file for $service_name"
    fi
}

# Stop demo services
stop_service "demo-capture-studio"
stop_service "quick-demo-generator"

# Stop math meme system
if [ -f "stop-math-meme-system.sh" ]; then
    ./stop-math-meme-system.sh
else
    stop_service "math-meme-time-engine"
    stop_service "time-flask-service"
    stop_service "integration-bridge"
fi

# Stop other services
stop_service "performance-monitor"
stop_service "context-switching"

echo "✓ All demo services stopped"
EOF

chmod +x open-demo-dashboards.sh
chmod +x stop-demo-system.sh

echo ""
echo -e "${CYAN}🎉 DEMO SYSTEM READY!${NC}"
echo "===================="
echo ""
echo "💡 Quick Commands:"
echo "  ./open-demo-dashboards.sh  - Open all dashboards"
echo "  ./stop-demo-system.sh      - Stop all services"
echo ""
echo "🎬 Ready to create amazing demos!"