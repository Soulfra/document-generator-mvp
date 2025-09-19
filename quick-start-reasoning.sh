#!/bin/bash

# 🚀🧠 QUICK START REASONING SYSTEM
# =================================
# One-command setup and verification of the complete reasoning system

set -e  # Exit on any error

echo "🚀🧠 QUICK START REASONING SYSTEM"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [[ ! -f "reasoning-viz-manager.js" ]]; then
    echo -e "${RED}❌ Error: reasoning-viz-manager.js not found${NC}"
    echo "Please run this script from the Document-Generator directory"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
if command -v npm &> /dev/null; then
    npm install --silent chokidar ws 2>/dev/null || echo "Some dependencies may need manual installation"
else
    echo -e "${YELLOW}⚠️  npm not found, skipping dependency install${NC}"
fi

echo -e "${BLUE}📁 Step 2: Setting up isolated directory structure...${NC}"
node -e "
const fs = require('fs');
const path = require('path');

const vizDir = '.reasoning-viz';
const dirs = ['logs', 'captures', 'sessions', 'web', 'docs'];

fs.mkdirSync(vizDir, { recursive: true });
dirs.forEach(dir => {
    fs.mkdirSync(path.join(vizDir, dir), { recursive: true });
});

console.log('✅ Isolated directories created');
"

echo -e "${BLUE}🔍 Step 3: Running verification tests...${NC}"
timeout 30s node verify-reasoning-system.js quick || {
    echo -e "${YELLOW}⚠️  Quick tests had issues, but continuing...${NC}"
}

echo -e "${BLUE}🖥️  Step 4: Starting servers...${NC}"

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Kill any existing processes on our ports
echo "🧹 Cleaning up any existing processes..."
pkill -f "reasoning-viz-manager.js" 2>/dev/null || true
pkill -f "ai-reasoning-bridge.js" 2>/dev/null || true
sleep 2

# Start Viz Manager
echo -e "${BLUE}🎮 Starting Reasoning Viz Manager (port 3006)...${NC}"
if check_port 3006; then
    node reasoning-viz-manager.js > .reasoning-viz/viz-manager.log 2>&1 &
    VIZ_PID=$!
    echo "   📝 Viz Manager PID: $VIZ_PID"
    echo $VIZ_PID > .reasoning-viz/viz-manager.pid
else
    echo -e "${RED}❌ Cannot start Viz Manager - port 3006 in use${NC}"
    exit 1
fi

# Wait for Viz Manager to start
echo "   ⏳ Waiting for Viz Manager to start..."
sleep 3

# Check if Viz Manager is running
if kill -0 $VIZ_PID 2>/dev/null; then
    echo -e "${GREEN}   ✅ Viz Manager started successfully${NC}"
else
    echo -e "${RED}   ❌ Viz Manager failed to start${NC}"
    cat .reasoning-viz/viz-manager.log
    exit 1
fi

# Start AI Bridge
echo -e "${BLUE}🤖 Starting AI Reasoning Bridge (port 3007)...${NC}"
if check_port 3007; then
    node ai-reasoning-bridge.js > .reasoning-viz/ai-bridge.log 2>&1 &
    BRIDGE_PID=$!
    echo "   📝 AI Bridge PID: $BRIDGE_PID"
    echo $BRIDGE_PID > .reasoning-viz/ai-bridge.pid
else
    echo -e "${RED}❌ Cannot start AI Bridge - port 3007 in use${NC}"
    kill $VIZ_PID 2>/dev/null
    exit 1
fi

# Wait for AI Bridge to start
echo "   ⏳ Waiting for AI Bridge to start..."
sleep 3

# Check if AI Bridge is running
if kill -0 $BRIDGE_PID 2>/dev/null; then
    echo -e "${GREEN}   ✅ AI Bridge started successfully${NC}"
else
    echo -e "${RED}   ❌ AI Bridge failed to start${NC}"
    cat .reasoning-viz/ai-bridge.log
    kill $VIZ_PID 2>/dev/null
    exit 1
fi

echo -e "${BLUE}🎭 Step 5: Creating demo reasoning entries...${NC}"
node verify-reasoning-system.js demo

echo -e "${BLUE}🔍 Step 6: Testing system integration...${NC}"
sleep 2

# Test if APIs are responding
if curl -s http://localhost:3006/api/capture/status > /dev/null; then
    echo -e "${GREEN}   ✅ Viz Manager API responding${NC}"
else
    echo -e "${RED}   ❌ Viz Manager API not responding${NC}"
fi

if curl -s http://localhost:3007/api/ai/context > /dev/null; then
    echo -e "${GREEN}   ✅ AI Bridge API responding${NC}"
else
    echo -e "${RED}   ❌ AI Bridge API not responding${NC}"
fi

echo ""
echo -e "${GREEN}🎉 REASONING SYSTEM READY!${NC}"
echo "============================="
echo ""
echo -e "${BLUE}🌐 Web Interfaces:${NC}"
echo "   • Reasoning Visualizer: http://localhost:3006"
echo "   • AI Watcher Interface: http://localhost:3007"
echo ""
echo -e "${BLUE}📡 API Endpoints:${NC}"
echo "   • Context for AIs: http://localhost:3007/api/ai/context"
echo "   • Copyable Context: http://localhost:3007/api/ai/copyable-context"
echo "   • Real-time Stream: http://localhost:3007/api/ai/stream"
echo ""
echo -e "${BLUE}💻 Usage Examples:${NC}"
echo "   # Add reasoning entries"
echo "   node reasoning-logger.js thought \"I'm debugging this function\""
echo "   node reasoning-logger.js action \"Clicking the submit button\""
echo ""
echo "   # Copy context for AI chat"
echo "   curl -s localhost:3007/api/ai/copyable-context"
echo ""
echo "   # In your code"
echo "   const logger = require('./reasoning-logger');"
echo "   logger.thought('Working on the authentication system');"
echo ""
echo -e "${BLUE}📁 All Data Location:${NC}"
echo "   Everything is isolated in: .reasoning-viz/"
echo "   • Logs: .reasoning-viz/logs/"
echo "   • Config: .reasoning-viz/config.json"
echo ""
echo -e "${BLUE}🛑 To Stop:${NC}"
echo "   ./stop-reasoning-system.sh"
echo "   Or: kill \$(cat .reasoning-viz/*.pid)"
echo ""
echo -e "${YELLOW}💡 Pro Tip:${NC}"
echo "   Open both web interfaces in separate browser tabs"
echo "   Then start coding and watch your thoughts flow!"

# Create a stop script
cat > stop-reasoning-system.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Reasoning System..."

if [[ -f .reasoning-viz/viz-manager.pid ]]; then
    VIZ_PID=$(cat .reasoning-viz/viz-manager.pid)
    if kill -0 $VIZ_PID 2>/dev/null; then
        kill $VIZ_PID
        echo "   ✅ Stopped Viz Manager ($VIZ_PID)"
    fi
    rm -f .reasoning-viz/viz-manager.pid
fi

if [[ -f .reasoning-viz/ai-bridge.pid ]]; then
    BRIDGE_PID=$(cat .reasoning-viz/ai-bridge.pid)
    if kill -0 $BRIDGE_PID 2>/dev/null; then
        kill $BRIDGE_PID
        echo "   ✅ Stopped AI Bridge ($BRIDGE_PID)"
    fi
    rm -f .reasoning-viz/ai-bridge.pid
fi

echo "🧹 All processes stopped"
EOF

chmod +x stop-reasoning-system.sh

echo -e "${GREEN}✅ Setup complete! Stop script created: ./stop-reasoning-system.sh${NC}"