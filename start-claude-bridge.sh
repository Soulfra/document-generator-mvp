#!/bin/bash

# 🗣️🤖 CLAUDE COMMAND BRIDGE STARTUP
# ===================================
# Starts the bridge that lets Claude execute commands when you ask

set -e

echo "🗣️🤖 CLAUDE COMMAND BRIDGE STARTUP"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if we're in the right directory
if [[ ! -f "claude-command-bridge.js" ]]; then
    echo -e "${RED}❌ Error: claude-command-bridge.js not found${NC}"
    echo "Please run this script from the Document-Generator directory"
    exit 1
fi

echo -e "${BLUE}🔧 Step 1: Setting up Claude command bridge...${NC}"

# Ensure directories exist
mkdir -p .reasoning-viz/{claude-commands,claude-logs,command-history}

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install --silent chokidar ws 2>/dev/null || {
        echo -e "${YELLOW}⚠️ Some dependencies may need manual installation${NC}"
    }
fi

echo -e "${BLUE}🚀 Step 2: Starting command bridge...${NC}"

# Kill any existing bridge processes
pkill -f "claude-command-bridge.js" 2>/dev/null || true
sleep 1

# Start the command bridge
node claude-command-bridge.js > .reasoning-viz/claude-bridge.log 2>&1 &
BRIDGE_PID=$!
echo $BRIDGE_PID > .reasoning-viz/claude-bridge.pid

# Wait for bridge to start
sleep 3

# Check if bridge started successfully
if kill -0 $BRIDGE_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Claude Command Bridge started (PID: $BRIDGE_PID)${NC}"
else
    echo -e "${RED}❌ Bridge failed to start${NC}"
    cat .reasoning-viz/claude-bridge.log
    exit 1
fi

echo -e "${BLUE}🗣️ Step 3: Starting interaction helper...${NC}"

# Start the interaction helper in background for monitoring
node claude-interaction-helper.js > .reasoning-viz/interaction-helper.log 2>&1 &
HELPER_PID=$!
echo $HELPER_PID > .reasoning-viz/interaction-helper.pid

sleep 2

if kill -0 $HELPER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Interaction Helper started (PID: $HELPER_PID)${NC}"
else
    echo -e "${YELLOW}⚠️ Interaction Helper had issues, but bridge is still active${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CLAUDE COMMAND BRIDGE IS ACTIVE!${NC}"
echo "===================================="
echo ""
echo -e "${CYAN}🤖 Now you can ask Claude to execute commands naturally!${NC}"
echo ""
echo -e "${BLUE}📝 Example phrases you can use:${NC}"
echo "   • \"Hey Claude, start Jarvis for me\""
echo "   • \"Can you activate the HUD overlay?\""
echo "   • \"Show me the fog of war explorer\""
echo "   • \"Open the boss room cursor\""
echo "   • \"Check system status\""
echo "   • \"Get my reasoning stats\""
echo "   • \"Verify the system is working\""
echo ""
echo -e "${BLUE}🔧 Available Commands:${NC}"
node claude-command-bridge.js list
echo ""
echo -e "${BLUE}📁 Logs and Data:${NC}"
echo "   • Bridge log: .reasoning-viz/claude-bridge.log"
echo "   • Commands: .reasoning-viz/claude-commands/"
echo "   • Conversations: .reasoning-viz/claude-conversations.jsonl"
echo ""
echo -e "${BLUE}🧪 Test the System:${NC}"
echo "   • Interactive test: node claude-interaction-helper.js interactive"
echo "   • Command test: node claude-interaction-helper.js test \"start jarvis\""
echo "   • Check history: node claude-interaction-helper.js history"
echo ""
echo -e "${BLUE}🛑 To Stop:${NC}"
echo "   • Kill processes: kill \$(cat .reasoning-viz/claude-*.pid)"
echo "   • Or use: pkill -f claude-"

# Create a test command file
echo -e "${YELLOW}💡 Creating a test to show how it works...${NC}"

# Simulate Claude requesting a command
cat > .reasoning-viz/claude-commands/claude-requests.jsonl << EOF
{"id":"test-$(date +%s)","type":"reasoning-stats","args":[],"status":"pending","timestamp":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","source":"startup-test"}
EOF

echo "   📝 Test command added - watch the logs to see it execute!"
echo ""
echo -e "${GREEN}🗣️ Ready! Just ask Claude naturally and watch the magic happen!${NC}"

# Show live log monitoring option
echo ""
echo -e "${CYAN}👁️ To watch commands in real-time:${NC}"
echo "   tail -f .reasoning-viz/claude-bridge.log"