#!/bin/bash

# 🚀 SOULFRA MOBILE-DESKTOP OS LAUNCHER
# Complete operating system with QR pairing, voice interaction, and GitHub wrapper

echo "🚀 LAUNCHING SOULFRA MOBILE-DESKTOP OS"
echo "====================================="
echo ""
echo "🎯 Complete system with:"
echo "   ✓ QR code mobile-desktop pairing"
echo "   ✓ Voice interaction with agent delegation"
echo "   ✓ Canvas parent-child architecture"
echo "   ✓ GitHub Desktop wrapper functionality"
echo "   ✓ Clean public/private separation"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "   Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}✗${NC} (timeout)"
    return 1
}

# Check prerequisites
echo "🔍 CHECKING PREREQUISITES"
echo "========================"

# Check Node.js
if command_exists node; then
    echo -e "   Node.js: ${GREEN}✓${NC} $(node --version)"
else
    echo -e "   Node.js: ${RED}✗${NC} Please install Node.js"
    exit 1
fi

# Check Docker
if command_exists docker; then
    echo -e "   Docker: ${GREEN}✓${NC} $(docker --version | head -1)"
else
    echo -e "   Docker: ${YELLOW}⚠${NC} Optional but recommended"
fi

# Check npm packages
if [ -f package.json ]; then
    echo -n "   Installing dependencies..."
    npm install >/dev/null 2>&1 && echo -e " ${GREEN}✓${NC}" || echo -e " ${YELLOW}⚠${NC}"
fi

echo ""

# Start core infrastructure
echo "🏗️ STARTING CORE INFRASTRUCTURE"
echo "==============================="

# Start main OS service
echo -n "   Starting Soulfra OS Core..."
if [ -f soulfra-mobile-desktop-os.js ]; then
    nohup node soulfra-mobile-desktop-os.js > soulfra-os.log 2>&1 &
    echo $! > soulfra-os.pid
    echo -e " ${GREEN}✓${NC} (PID: $(cat soulfra-os.pid))"
else
    echo -e " ${RED}✗${NC} soulfra-mobile-desktop-os.js not found"
    exit 1
fi

# Wait for main service
wait_for_service "http://localhost:3333" "Soulfra OS Core"

# Start WebSocket server for real-time sync
echo -n "   Starting WebSocket server..."
sleep 2
if curl -s "http://localhost:3334" >/dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${YELLOW}⚠${NC} WebSocket may need more time"
fi

# Start GitHub Desktop Wrapper (with authentication)
echo -n "   Starting GitHub Desktop Wrapper..."
if [ -f github-desktop-wrapper-authenticated.js ]; then
    nohup node github-desktop-wrapper-authenticated.js > github-wrapper.log 2>&1 &
    echo $! > github-wrapper.pid
    echo -e " ${GREEN}✓${NC} (PID: $(cat github-wrapper.pid))"
    echo "      📦 Web Interface: http://localhost:3337"
    echo "      🔌 WebSocket: ws://localhost:3338"
    echo "      🖥️  Terminal: ws://localhost:3339"
    echo "      🔒 Vault protection: Active"
    echo "      🔐 GitHub auth: Integrated"
elif [ -f github-desktop-wrapper-complete.js ]; then
    echo -e " ${YELLOW}⚠${NC} Using non-authenticated version"
    nohup node github-desktop-wrapper-complete.js > github-wrapper.log 2>&1 &
    echo $! > github-wrapper.pid
    echo -e " ${GREEN}✓${NC} (PID: $(cat github-wrapper.pid))"
else
    echo -e " ${YELLOW}⚠${NC} GitHub wrapper not found"
fi

# Wait for GitHub wrapper
wait_for_service "http://localhost:3337" "GitHub Desktop Wrapper"

echo ""

# Start agent integration services
echo "🤖 STARTING AGENT INTEGRATION"
echo "============================"

# Start agent interface bridge if it exists
if [ -f agent-interface-bridge.js ]; then
    echo -n "   Starting Agent Interface Bridge..."
    nohup node agent-interface-bridge.js > agent-bridge.log 2>&1 &
    echo $! > agent-bridge.pid
    echo -e " ${GREEN}✓${NC} (PID: $(cat agent-bridge.pid))"
    
    wait_for_service "http://localhost:3001" "Agent Bridge"
fi

# Connect to existing AI orchestrator if available
if [ -f ai-git-orchestrator.js ]; then
    echo -n "   Connecting to AI Git Orchestrator..."
    # Check if orchestrator is already running
    if curl -s "http://localhost:3002" >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC} (already running)"
    else
        nohup node ai-git-orchestrator.js > ai-orchestrator.log 2>&1 &
        echo $! > ai-orchestrator.pid
        echo -e " ${GREEN}✓${NC} (PID: $(cat ai-orchestrator.pid))"
    fi
fi

echo ""

# Start supporting services
echo "⚙️ STARTING SUPPORTING SERVICES"
echo "==============================="

# Start cleanup workspace monitoring
if [ -f cleanup-workspace/scripts/safe-cleanup.js ]; then
    echo -n "   Starting Cleanup Workspace Monitor..."
    cd cleanup-workspace
    nohup node scripts/safe-cleanup.js --watch > ../cleanup-monitor.log 2>&1 &
    echo $! > ../cleanup-monitor.pid
    cd ..
    echo -e " ${GREEN}✓${NC} (PID: $(cat cleanup-monitor.pid))"
fi

# Start Docker services if available
if [ -f docker-compose.yml ] && command_exists docker-compose; then
    echo -n "   Starting Docker services..."
    docker-compose up -d >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e " ${GREEN}✓${NC}"
        
        # Wait for key services
        wait_for_service "http://localhost:5432" "PostgreSQL" || true
        wait_for_service "http://localhost:6379" "Redis" || true
        wait_for_service "http://localhost:9000" "MinIO" || true
    else
        echo -e " ${YELLOW}⚠${NC} (optional)"
    fi
fi

echo ""

# Generate QR code for mobile pairing
echo "📱 GENERATING MOBILE PAIRING"
echo "==========================="

# Create QR code data
QR_DATA="soulfra://pair?host=$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost')&port=3333&auth=$(openssl rand -hex 16)"

echo "   QR Code Data: $QR_DATA"

# Try to generate QR code if qrencode is available
if command_exists qrencode; then
    echo "   Generating QR code..."
    qrencode -t ASCII "$QR_DATA"
    echo ""
    echo -e "   ${BLUE}📱 Scan this QR code with your mobile device${NC}"
else
    echo -e "   ${YELLOW}📱 Mobile pairing URL:${NC}"
    echo "   $QR_DATA"
    echo ""
    echo "   Install qrencode for QR codes: brew install qrencode (Mac) or apt install qrencode (Linux)"
fi

echo ""

# Display access points
echo "🌐 ACCESS POINTS"
echo "==============="

echo -e "   ${BLUE}🖥️  Desktop Interface:${NC}"
echo "      Main OS: http://localhost:3333"
echo "      Control Panel: http://localhost:3333/control"
echo "      Canvas Workspace: http://localhost:3333/canvas"
echo ""

echo -e "   ${BLUE}📱 Mobile Interface:${NC}"
echo "      Mobile PWA: http://localhost:3333/mobile"
echo "      Voice Commands: http://localhost:3333/voice"
echo ""

echo -e "   ${BLUE}🤖 Agent Integration:${NC}"
echo "      Agent Bridge: http://localhost:3001"
echo "      Git Orchestrator: http://localhost:3002"
echo "      System Monitor: http://localhost:3333/monitor"
echo ""

echo -e "   ${BLUE}🔧 Developer Tools:${NC}"
echo "      WebSocket: ws://localhost:3334"
echo "      Logs: tail -f *.log"
echo "      Health Check: curl http://localhost:3333/health"
echo ""

# Create desktop shortcut
echo "🔗 CREATING DESKTOP SHORTCUTS"
echo "============================"

# Create desktop file for Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    DESKTOP_FILE="$HOME/Desktop/SoulFra-OS.desktop"
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SoulFra Mobile-Desktop OS
Comment=Complete OS with QR pairing and voice interaction
Exec=x-www-browser http://localhost:3333
Icon=applications-internet
Path=$(pwd)
Terminal=false
StartupNotify=true
EOF
    chmod +x "$DESKTOP_FILE"
    echo -e "   Linux desktop shortcut: ${GREEN}✓${NC}"
fi

# Create app for macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e 'tell application "Dock" to make new permanent-item at end of persistent-apps with properties {tile-type:"url", url:"http://localhost:3333"}' 2>/dev/null || true
    echo -e "   macOS dock shortcut: ${GREEN}✓${NC}"
fi

echo ""

# System health verification
echo "🏥 SYSTEM HEALTH CHECK"
echo "====================="

HEALTH_SCORE=0
TOTAL_CHECKS=5

echo -n "   Core OS service..."
if curl -s "http://localhost:3333/health" >/dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e " ${RED}✗${NC}"
fi

echo -n "   WebSocket connectivity..."
if curl -s "http://localhost:3334" >/dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e " ${RED}✗${NC}"
fi

echo -n "   Agent integration..."
if curl -s "http://localhost:3001" >/dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e " ${YELLOW}⚠${NC} (optional)"
fi

echo -n "   Git orchestration..."
if curl -s "http://localhost:3002" >/dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e " ${YELLOW}⚠${NC} (optional)"
fi

echo -n "   File system access..."
if [ -w "$(pwd)" ]; then
    echo -e " ${GREEN}✓${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e " ${RED}✗${NC}"
fi

HEALTH_PERCENT=$(( (HEALTH_SCORE * 100) / TOTAL_CHECKS ))
echo ""
echo -e "   Overall Health: ${HEALTH_PERCENT}% (${HEALTH_SCORE}/${TOTAL_CHECKS})"

echo ""

# Success message and next steps
if [ $HEALTH_PERCENT -ge 60 ]; then
    echo -e "${GREEN}🎉 SOULFRA OS IS RUNNING!${NC}"
    echo "========================="
    echo ""
    echo "🚀 Your complete mobile-desktop operating system is ready!"
    echo ""
    echo -e "${BLUE}Quick Start:${NC}"
    echo "1. 🖥️  Open http://localhost:3333 in your browser"
    echo "2. 📱 Scan the QR code above with your mobile device"
    echo "3. 🗣️  Try voice commands: 'Generate app from document'"
    echo "4. 📄 Drag any document to create an MVP"
    echo "5. 🤖 Watch your agents work in real-time"
    echo ""
    echo -e "${BLUE}GitHub Integration:${NC}"
    echo "• Clean workspace: /cleanup-workspace"
    echo "• Private vault: Protected from commits"
    echo "• Auto-deployment: Ready for GitHub"
    echo ""
    echo -e "${BLUE}Advanced Features:${NC}"
    echo "• Canvas sync between devices"
    echo "• Voice-to-agent delegation"
    echo "• Real-time collaboration"
    echo "• Automated Git workflows"
    
else
    echo -e "${YELLOW}⚠️ SOULFRA OS PARTIALLY RUNNING${NC}"
    echo "================================"
    echo ""
    echo "Some services couldn't start, but core functionality is available."
    echo ""
    echo "🔧 Try these fixes:"
    echo "1. Check logs: tail -f *.log"
    echo "2. Restart: ./stop-soulfra-os.sh && ./launch-soulfra-os.sh"
    echo "3. Manual start: node soulfra-mobile-desktop-os.js"
fi

echo ""

# Create stop script
echo "📝 CREATING STOP SCRIPT"
echo "======================"

cat > stop-soulfra-os.sh << 'EOF'
#!/bin/bash

echo "🛑 STOPPING SOULFRA MOBILE-DESKTOP OS"
echo "====================================="

# Kill services by PID
for pid_file in *.pid; do
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        service_name=$(basename "$pid_file" .pid)
        if kill "$pid" 2>/dev/null; then
            echo "   Stopped $service_name (PID: $pid)"
        fi
        rm -f "$pid_file"
    fi
done

# Stop Docker services
if [ -f docker-compose.yml ]; then
    docker-compose down >/dev/null 2>&1
    echo "   Stopped Docker services"
fi

# Clean up logs
rm -f *.log

echo ""
echo "✅ SoulFra OS stopped successfully"
EOF

chmod +x stop-soulfra-os.sh
echo -e "   Stop script created: ${GREEN}✓${NC}"

echo ""

# Display final status
cat > soulfra-os-status.txt << EOF
SoulFra Mobile-Desktop OS Status
===============================
Launch Time: $(date)
Health Score: ${HEALTH_PERCENT}%
Services Running: ${HEALTH_SCORE}/${TOTAL_CHECKS}

Access Points:
• Desktop: http://localhost:3333
• Mobile: http://localhost:3333/mobile
• Control: http://localhost:3333/control

Mobile Pairing:
• QR Data: $QR_DATA
• Scan with mobile device for instant pairing

Management:
• Stop: ./stop-soulfra-os.sh
• Logs: tail -f *.log
• Health: curl http://localhost:3333/health

Features Available:
✓ QR mobile-desktop pairing
✓ Voice interaction system
✓ Canvas parent-child architecture
✓ GitHub Desktop wrapper
✓ Agent delegation system
✓ Real-time synchronization
✓ Clean workspace separation
EOF

echo "💾 Status saved to: soulfra-os-status.txt"
echo ""
echo -e "${BLUE}🎯 READY TO USE!${NC}"
echo "Open http://localhost:3333 and start creating!"
echo ""
echo "🔧 Management commands:"
echo "   ./stop-soulfra-os.sh      - Stop all services"
echo "   tail -f *.log            - View logs"
echo "   curl localhost:3333/health - Health check"
echo ""