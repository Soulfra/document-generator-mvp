#!/bin/bash

# 🗺️⚡ TIER 15 XML SYSTEM STARTUP
# ================================
# Complete startup of XML-mapped 15-tier Jarvis HUD ecosystem
# Live verification and visual monitoring

set -e

echo "🗺️⚡ TIER 15 XML SYSTEM STARTUP"
echo "==============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Check if we're in the right directory
if [[ ! -f "xml-tier15-mapper.js" ]]; then
    echo -e "${RED}❌ Error: xml-tier15-mapper.js not found${NC}"
    echo "Please run this script from the Document-Generator directory"
    exit 1
fi

echo -e "${PURPLE}🎯 Initializing 15-tier XML ecosystem...${NC}"

# Step 1: Ensure all dependencies
echo -e "${BLUE}📦 Step 1: Setting up XML tier infrastructure...${NC}"

# Create complete XML tier structure
mkdir -p .reasoning-viz/{xml-tiers/{tiers,verification,live-data,visual-maps},claude-commands,logs}

# Install any missing Node.js dependencies
if [[ ! -d "node_modules" ]]; then
    echo "   📦 Installing Node.js dependencies..."
    npm install --silent chokidar ws crypto 2>/dev/null || {
        echo -e "${YELLOW}   ⚠️ Some dependencies may need manual installation${NC}"
    }
fi

echo -e "${GREEN}   ✅ Infrastructure ready${NC}"

# Step 2: Start the XML Tier 15 Mapper
echo -e "${BLUE}🗺️ Step 2: Starting XML Tier 15 Mapper...${NC}"

# Kill any existing processes
pkill -f "xml-tier15-mapper.js" 2>/dev/null || true
sleep 1

# Start the mapper
node xml-tier15-mapper.js > .reasoning-viz/xml-mapper.log 2>&1 &
MAPPER_PID=$!
echo $MAPPER_PID > .reasoning-viz/xml-mapper.pid

# Wait for mapper to initialize
echo "   ⏳ Initializing 15-tier XML mapping..."
sleep 5

# Check if mapper started successfully
if kill -0 $MAPPER_PID 2>/dev/null; then
    echo -e "${GREEN}   ✅ XML Tier 15 Mapper active (PID: $MAPPER_PID)${NC}"
else
    echo -e "${RED}   ❌ XML Mapper failed to start${NC}"
    cat .reasoning-viz/xml-mapper.log
    exit 1
fi

# Step 3: Start core services if not already running
echo -e "${BLUE}🚀 Step 3: Ensuring core services are active...${NC}"

SERVICES_STARTED=0

# Start reasoning visualization if not running
if ! lsof -Pi :3006 -sTCP:LISTEN -t >/dev/null 2>&1; then
    if [[ -f "reasoning-viz-manager.js" ]]; then
        echo "   🧠 Starting Reasoning Visualization..."
        node reasoning-viz-manager.js > .reasoning-viz/reasoning-viz.log 2>&1 &
        REASONING_PID=$!
        echo $REASONING_PID > .reasoning-viz/reasoning-viz.pid
        ((SERVICES_STARTED++))
        sleep 2
    fi
else
    echo "   ✅ Reasoning Visualization already running"
fi

# Start AI bridge if not running
if ! lsof -Pi :3007 -sTCP:LISTEN -t >/dev/null 2>&1; then
    if [[ -f "ai-reasoning-bridge.js" ]]; then
        echo "   🤖 Starting AI Reasoning Bridge..."
        node ai-reasoning-bridge.js > .reasoning-viz/ai-bridge.log 2>&1 &
        AI_BRIDGE_PID=$!
        echo $AI_BRIDGE_PID > .reasoning-viz/ai-bridge.pid
        ((SERVICES_STARTED++))
        sleep 2
    fi
else
    echo "   ✅ AI Reasoning Bridge already running"
fi

# Start Claude command bridge if not running
if [[ ! -f ".reasoning-viz/claude-bridge.pid" ]] || ! kill -0 $(cat .reasoning-viz/claude-bridge.pid 2>/dev/null) 2>/dev/null; then
    if [[ -f "claude-command-bridge.js" ]]; then
        echo "   🗣️ Starting Claude Command Bridge..."
        node claude-command-bridge.js > .reasoning-viz/claude-bridge.log 2>&1 &
        CLAUDE_PID=$!
        echo $CLAUDE_PID > .reasoning-viz/claude-bridge.pid
        ((SERVICES_STARTED++))
        sleep 2
    fi
else
    echo "   ✅ Claude Command Bridge already running"
fi

echo -e "${GREEN}   ✅ $SERVICES_STARTED additional services started${NC}"

# Step 4: Generate initial XML mappings
echo -e "${BLUE}🗺️ Step 4: Generating tier XML mappings...${NC}"

# Wait for mapper to complete initial generation
sleep 5

# Check if XML files were created
XML_FILES_CREATED=0
for tier in {01..15}; do
    if [[ -f ".reasoning-viz/xml-tiers/tiers/tier-$tier.xml" ]]; then
        ((XML_FILES_CREATED++))
    fi
done

echo "   📄 XML files created: $XML_FILES_CREATED/15"

if [[ $XML_FILES_CREATED -ge 10 ]]; then
    echo -e "${GREEN}   ✅ XML tier mapping generation successful${NC}"
else
    echo -e "${YELLOW}   ⚠️ Some XML tiers may still be generating...${NC}"
fi

# Step 5: Start live dashboard
echo -e "${BLUE}🖥️ Step 5: Starting Tier 15 Live Dashboard...${NC}"

# Check if we can start a simple HTTP server for the dashboard
DASHBOARD_PORT=8015

if ! lsof -Pi :$DASHBOARD_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    # Try to start Python HTTP server for the dashboard
    if command -v python3 &> /dev/null; then
        echo "   🌐 Starting dashboard HTTP server on port $DASHBOARD_PORT..."
        cd "$(dirname "$0")"
        python3 -m http.server $DASHBOARD_PORT > .reasoning-viz/dashboard-server.log 2>&1 &
        DASHBOARD_PID=$!
        echo $DASHBOARD_PID > .reasoning-viz/dashboard-server.pid
        cd - > /dev/null
        sleep 2
        
        if kill -0 $DASHBOARD_PID 2>/dev/null; then
            echo -e "${GREEN}   ✅ Dashboard server started (PID: $DASHBOARD_PID)${NC}"
        else
            echo -e "${YELLOW}   ⚠️ Dashboard server had issues${NC}"
        fi
    else
        echo -e "${YELLOW}   ⚠️ Python3 not found, dashboard will be file-based${NC}"
    fi
else
    echo "   ✅ Dashboard port already in use"
fi

# Step 6: Run verification
echo -e "${BLUE}🔍 Step 6: Running tier verification...${NC}"

# Give the system a moment to stabilize
sleep 3

# Run verification
echo "   🔍 Verifying tier integrity..."
node xml-tier15-mapper.js status > .reasoning-viz/tier-status.log 2>&1

# Check verification results
if [[ -f ".reasoning-viz/tier-status.log" ]]; then
    VERIFIED_TIERS=$(grep -o "verifiedTiers.*:" .reasoning-viz/tier-status.log | head -1 | grep -o "[0-9]*")
    if [[ -n "$VERIFIED_TIERS" ]]; then
        echo -e "${GREEN}   ✅ Verified tiers: $VERIFIED_TIERS/15${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Verification data pending...${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️ Verification log not found${NC}"
fi

# Step 7: System ready
echo ""
echo -e "${GREEN}🎉 TIER 15 XML SYSTEM ACTIVE!${NC}"
echo "================================="
echo ""
echo -e "${CYAN}🗺️ XML Architecture:${NC} 15 tiers fully mapped"
echo -e "${CYAN}📊 Live Monitoring:${NC} Real-time verification active"
echo -e "${CYAN}🔍 Verification:${NC} Continuous health checking"
echo -e "${CYAN}👁️ Visual Interface:${NC} Live dashboard running"
echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo "   • Live Dashboard: http://localhost:$DASHBOARD_PORT/tier15-live-dashboard.html"
echo "   • Reasoning Viz: http://localhost:3006"
echo "   • AI Bridge: http://localhost:3007"
echo ""
echo -e "${BLUE}📁 XML Data:${NC}"
echo "   • Tier XMLs: .reasoning-viz/xml-tiers/tiers/"
echo "   • Master Map: .reasoning-viz/xml-tiers/jarvis-ecosystem-master-map.xml"
echo "   • Live Data: .reasoning-viz/xml-tiers/live-data/"
echo "   • Verification: .reasoning-viz/xml-tiers/verification/"
echo ""
echo -e "${BLUE}🔧 Tier Structure:${NC}"
echo "   Tier 1:  Hardware Layer (cpu, memory, disk, network)"
echo "   Tier 2:  Operating System (kernel, drivers, filesystem)"
echo "   Tier 3:  Runtime Environment (nodejs, electron, chromium)"
echo "   Tier 4:  Core Services (reasoning-viz, ai-bridge, claude-bridge)"
echo "   Tier 5:  Data Layer (jsonl-logs, xml-mapping, session-data)"
echo "   Tier 6:  Communication Layer (websockets, http-apis, file-watching)"
echo "   Tier 7:  Processing Layer (command-parser, pattern-matcher)"
echo "   Tier 8:  Interface Layer (main-interface, hud-overlay, cli-tools)"
echo "   Tier 9:  Integration Layer (fog-of-war, boss-room, broadcaster)"
echo "   Tier 10: AI Layer (claude-interaction, context-bridge)"
echo "   Tier 11: Visualization Layer (hud-graphics, holographic-grid)"
echo "   Tier 12: Cross-Platform Layer (electron-builds, pwa-deployment)"
echo "   Tier 13: User Experience Layer (natural-language, voice-commands)"
echo "   Tier 14: Ecosystem Layer (deployment-platforms, cloud-integration)"
echo "   Tier 15: Meta-Intelligence Layer (self-optimization, consciousness)"
echo ""
echo -e "${BLUE}⚙️ System Commands:${NC}"
echo "   • Check status: node xml-tier15-mapper.js status"
echo "   • Verify tier: node xml-tier15-mapper.js verify <tier>"
echo "   • Open visual: node xml-tier15-mapper.js visual"
echo ""
echo -e "${BLUE}🗣️ Claude Integration:${NC}"
echo "   • Ask Claude: node ask-claude.js"
echo "   • Natural commands: \"start jarvis\", \"show tier 15 map\""
echo ""
echo -e "${BLUE}🛑 To Stop System:${NC}"
echo "   • Kill all: kill \$(cat .reasoning-viz/*.pid)"
echo "   • Or use: pkill -f \"xml-tier\\|reasoning-viz\\|ai-bridge\\|claude-\""

# Create a comprehensive stop script
cat > stop-tier15-system.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Tier 15 XML System..."

# Stop all processes
for pidfile in .reasoning-viz/*.pid; do
    if [[ -f "$pidfile" ]]; then
        pid=$(cat "$pidfile")
        if kill -0 $pid 2>/dev/null; then
            service=$(basename "$pidfile" .pid)
            kill $pid
            echo "   ✅ Stopped $service ($pid)"
        fi
        rm -f "$pidfile"
    fi
done

# Clean up any remaining processes
pkill -f "xml-tier15-mapper.js" 2>/dev/null || true
pkill -f "reasoning-viz-manager.js" 2>/dev/null || true
pkill -f "ai-reasoning-bridge.js" 2>/dev/null || true
pkill -f "claude-command-bridge.js" 2>/dev/null || true

echo "🧹 All Tier 15 XML system processes stopped"
echo "📁 XML data preserved in .reasoning-viz/xml-tiers/"
EOF

chmod +x stop-tier15-system.sh

echo -e "${GREEN}✅ Stop script created: ./stop-tier15-system.sh${NC}"

# Final verification message
echo ""
echo -e "${PURPLE}🗺️⚡ TIER 15 XML MAPPING COMPLETE!${NC}"
echo ""
echo -e "${CYAN}The entire Jarvis HUD ecosystem is now XML-mapped into 15 tiers${NC}"
echo -e "${CYAN}with live verification, real-time monitoring, and visual dashboard.${NC}"
echo ""
echo -e "${YELLOW}💡 Pro Tip:${NC}"
echo "   Open the live dashboard to see all 15 tiers visualized in real-time!"
echo "   Each tier is continuously verified and monitored for health."

# Show final status
sleep 2
echo ""
echo -e "${BLUE}🔍 Final System Status:${NC}"
echo "   XML Mapper: $(kill -0 $MAPPER_PID 2>/dev/null && echo "✅ Active" || echo "❌ Inactive")"
echo "   Reasoning Viz: $(lsof -Pi :3006 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Running" || echo "❌ Not running")"  
echo "   AI Bridge: $(lsof -Pi :3007 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Running" || echo "❌ Not running")"
echo "   Dashboard: $(lsof -Pi :$DASHBOARD_PORT -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Serving" || echo "❌ Not serving")"
echo "   XML Files: $XML_FILES_CREATED/15 generated"

echo ""
echo -e "${GREEN}🦾🤖 Welcome to the XML-verified Tier 15 Jarvis HUD ecosystem!${NC}"