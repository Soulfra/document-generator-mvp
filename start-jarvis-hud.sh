#!/bin/bash

# 🦾🤖 JARVIS HUD STARTUP SCRIPT
# ===============================
# One-command setup and launch of the complete Jarvis HUD system
# Integrates reasoning visualization, AI bridge, and cross-platform deployment

set -e  # Exit on any error

echo "🦾🤖 JARVIS HUD STARTUP"
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REASONING_PORT=3006
AI_BRIDGE_PORT=3007
ELECTRON_ENABLED=true
PWA_ENABLED=true

echo -e "${BLUE}🎯 Initializing Jarvis HUD System...${NC}"

# Check if we're in the right directory
if [[ ! -f "jarvis-hud-electron.js" ]]; then
    echo -e "${RED}❌ Error: jarvis-hud-electron.js not found${NC}"
    echo "Please run this script from the Document-Generator directory"
    exit 1
fi

# Step 1: Setup reasoning system
echo -e "${BLUE}📦 Step 1: Setting up reasoning visualization system...${NC}"
if [[ -f "quick-start-reasoning.sh" ]]; then
    echo "   🔄 Running reasoning system setup..."
    ./quick-start-reasoning.sh
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}   ✅ Reasoning system ready${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Reasoning system had issues, continuing...${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  quick-start-reasoning.sh not found, creating minimal setup...${NC}"
    
    # Create minimal setup
    mkdir -p .reasoning-viz/{logs,captures,sessions,web,docs}
    echo '{"version": "1.0", "created": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > .reasoning-viz/config.json
fi

# Step 2: Check Node.js and dependencies
echo -e "${BLUE}📦 Step 2: Checking Node.js and dependencies...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 16+ to continue.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -c2- | cut -d. -f1)
if [[ $NODE_VERSION -lt 16 ]]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION too old. Please upgrade to 16+.${NC}"
    exit 1
fi

echo -e "${GREEN}   ✅ Node.js $(node -v) detected${NC}"

# Install Electron dependencies if needed
if [[ ! -d "node_modules/electron" ]]; then
    echo "   📦 Installing Electron dependencies..."
    
    # Use package-electron.json for Electron-specific dependencies
    if [[ -f "package-electron.json" ]]; then
        cp package-electron.json package.json.electron-backup
        npm install --silent electron express ws chokidar fs-extra 2>/dev/null || {
            echo -e "${YELLOW}   ⚠️  Some dependencies may need manual installation${NC}"
        }
    else
        npm install --silent electron express ws chokidar 2>/dev/null || {
            echo -e "${YELLOW}   ⚠️  Could not install dependencies automatically${NC}"
        }
    fi
fi

# Step 3: Verify system components
echo -e "${BLUE}🔍 Step 3: Verifying system components...${NC}"

components_verified=0
total_components=5

# Check reasoning logger
if [[ -f "reasoning-logger.js" ]]; then
    echo -e "${GREEN}   ✅ Reasoning logger available${NC}"
    ((components_verified++))
else
    echo -e "${YELLOW}   ⚠️  Reasoning logger missing${NC}"
fi

# Check AI bridge
if [[ -f "ai-reasoning-bridge.js" ]]; then
    echo -e "${GREEN}   ✅ AI reasoning bridge available${NC}"
    ((components_verified++))
else
    echo -e "${YELLOW}   ⚠️  AI reasoning bridge missing${NC}"
fi

# Check fog of war
if [[ -f "fog-of-war-3d-explorer.html" ]]; then
    echo -e "${GREEN}   ✅ Fog of war explorer available${NC}"
    ((components_verified++))
else
    echo -e "${YELLOW}   ⚠️  Fog of war explorer missing${NC}"
fi

# Check boss room
if [[ -f "boss-room-cursor-overlay.html" ]]; then
    echo -e "${GREEN}   ✅ Boss room cursor overlay available${NC}"
    ((components_verified++))
else
    echo -e "${YELLOW}   ⚠️  Boss room cursor overlay missing${NC}"
fi

# Check main interfaces
if [[ -f "jarvis-main-interface.html" ]] && [[ -f "jarvis-hud-overlay.html" ]]; then
    echo -e "${GREEN}   ✅ Jarvis HUD interfaces available${NC}"
    ((components_verified++))
else
    echo -e "${YELLOW}   ⚠️  Jarvis HUD interfaces missing${NC}"
fi

echo "   📊 System readiness: $components_verified/$total_components components verified"

# Step 4: Platform detection and optimization
echo -e "${BLUE}🖥️  Step 4: Detecting platform and optimizing...${NC}"

PLATFORM=$(uname -s)
case $PLATFORM in
    Darwin)
        echo -e "${GREEN}   🍎 macOS detected - optimizing for Apple ecosystem${NC}"
        PLATFORM_OPTIMIZED="macos"
        ;;
    Linux)
        echo -e "${GREEN}   🐧 Linux detected - optimizing for Linux distribution${NC}"
        PLATFORM_OPTIMIZED="linux"
        
        # Check if running on Chromebook (Chrome OS)
        if [[ -f "/etc/lsb-release" ]] && grep -q "Chrome" /etc/lsb-release; then
            echo -e "${GREEN}   📚 Chromebook/Chrome OS detected - enabling touch optimizations${NC}"
            PLATFORM_OPTIMIZED="chromebook"
        fi
        ;;
    MINGW*|CYGWIN*|MSYS*)
        echo -e "${GREEN}   🪟 Windows detected - optimizing for Windows ecosystem${NC}"
        PLATFORM_OPTIMIZED="windows"
        ;;
    *)
        echo -e "${YELLOW}   ❓ Unknown platform: $PLATFORM - using generic optimizations${NC}"
        PLATFORM_OPTIMIZED="generic"
        ;;
esac

# Step 5: Create launch configuration
echo -e "${BLUE}⚙️  Step 5: Creating optimized launch configuration...${NC}"

JARVIS_CONFIG=".reasoning-viz/jarvis-launch-config.json"
cat > "$JARVIS_CONFIG" << EOF
{
  "launch_time": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platform": "$PLATFORM_OPTIMIZED",
  "components_verified": $components_verified,
  "total_components": $total_components,
  "readiness_score": $((components_verified * 100 / total_components)),
  "services": {
    "reasoning_viz": {
      "enabled": true,
      "port": $REASONING_PORT,
      "autostart": true
    },
    "ai_bridge": {
      "enabled": true,
      "port": $AI_BRIDGE_PORT,
      "autostart": true
    },
    "electron": {
      "enabled": $ELECTRON_ENABLED,
      "development_mode": true
    },
    "pwa": {
      "enabled": $PWA_ENABLED,
      "manifest": "jarvis-pwa-manifest.json"
    }
  },
  "integrations": {
    "fog_of_war": $([ -f "fog-of-war-3d-explorer.html" ] && echo "true" || echo "false"),
    "boss_room": $([ -f "boss-room-cursor-overlay.html" ] && echo "true" || echo "false"),
    "reasoning_stream": $([ -f "reasoning-stream-visualizer.html" ] && echo "true" || echo "false")
  },
  "deployment": {
    "cross_platform": true,
    "chromebook_ready": $([ "$PLATFORM_OPTIMIZED" = "chromebook" ] && echo "true" || echo "false"),
    "apple_ready": $([ "$PLATFORM_OPTIMIZED" = "macos" ] && echo "true" || echo "false"),
    "windows_ready": $([ "$PLATFORM_OPTIMIZED" = "windows" ] && echo "true" || echo "false")
  }
}
EOF

echo -e "${GREEN}   ✅ Launch configuration created: $JARVIS_CONFIG${NC}"

# Step 6: Start background services
echo -e "${BLUE}🚀 Step 6: Starting background services...${NC}"

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}   ⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Kill any existing processes
echo "   🧹 Cleaning up any existing processes..."
pkill -f "reasoning-viz-manager.js" 2>/dev/null || true
pkill -f "ai-reasoning-bridge.js" 2>/dev/null || true
sleep 2

# Start services only if they exist and ports are available
SERVICES_STARTED=0

if [[ -f "reasoning-viz-manager.js" ]] && check_port $REASONING_PORT; then
    echo -e "${BLUE}   🧠 Starting Reasoning Visualization Manager...${NC}"
    node reasoning-viz-manager.js > .reasoning-viz/reasoning-viz.log 2>&1 &
    REASONING_PID=$!
    echo $REASONING_PID > .reasoning-viz/reasoning-viz.pid
    echo "      📝 PID: $REASONING_PID, Log: .reasoning-viz/reasoning-viz.log"
    ((SERVICES_STARTED++))
    sleep 2
fi

if [[ -f "ai-reasoning-bridge.js" ]] && check_port $AI_BRIDGE_PORT; then
    echo -e "${BLUE}   🤖 Starting AI Reasoning Bridge...${NC}"
    node ai-reasoning-bridge.js > .reasoning-viz/ai-bridge.log 2>&1 &
    AI_BRIDGE_PID=$!
    echo $AI_BRIDGE_PID > .reasoning-viz/ai-bridge.pid
    echo "      📝 PID: $AI_BRIDGE_PID, Log: .reasoning-viz/ai-bridge.log"
    ((SERVICES_STARTED++))
    sleep 2
fi

# Step 7: Launch Jarvis HUD
echo -e "${BLUE}🦾 Step 7: Launching Jarvis HUD...${NC}"

# Choose launch method based on platform and availability
if [[ $ELECTRON_ENABLED == "true" ]] && command -v npx &> /dev/null; then
    echo -e "${GREEN}   🚀 Launching Electron HUD interface...${NC}"
    
    # Set development environment
    export NODE_ENV=development
    export JARVIS_PLATFORM=$PLATFORM_OPTIMIZED
    export JARVIS_CONFIG_PATH=$JARVIS_CONFIG
    
    # Launch Electron
    if command -v electron &> /dev/null; then
        electron jarvis-hud-electron.js &
        ELECTRON_PID=$!
        echo $ELECTRON_PID > .reasoning-viz/electron.pid
        echo "      📝 Electron PID: $ELECTRON_PID"
    else
        npx electron jarvis-hud-electron.js &
        ELECTRON_PID=$!
        echo $ELECTRON_PID > .reasoning-viz/electron.pid
        echo "      📝 Electron PID: $ELECTRON_PID"
    fi
    
    sleep 3
    
    # Check if Electron started successfully
    if kill -0 $ELECTRON_PID 2>/dev/null; then
        echo -e "${GREEN}   ✅ Jarvis HUD Electron app launched successfully${NC}"
    else
        echo -e "${RED}   ❌ Electron failed to start, falling back to web interface...${NC}"
        PWA_ENABLED=true
    fi
fi

# Fallback to PWA if Electron not available
if [[ $PWA_ENABLED == "true" ]] && [[ ! -f ".reasoning-viz/electron.pid" || ! -s ".reasoning-viz/electron.pid" ]]; then
    echo -e "${GREEN}   🌐 Opening PWA interface in default browser...${NC}"
    
    # Create a simple HTTP server for PWA
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8080 > .reasoning-viz/pwa-server.log 2>&1 &
        PWA_SERVER_PID=$!
        echo $PWA_SERVER_PID > .reasoning-viz/pwa-server.pid
        
        sleep 2
        
        # Open in browser
        case $PLATFORM_OPTIMIZED in
            macos)
                open "http://localhost:8080/jarvis-main-interface.html"
                ;;
            linux|chromebook)
                if command -v google-chrome &> /dev/null; then
                    google-chrome "http://localhost:8080/jarvis-main-interface.html" &
                elif command -v chromium-browser &> /dev/null; then
                    chromium-browser "http://localhost:8080/jarvis-main-interface.html" &
                elif command -v firefox &> /dev/null; then
                    firefox "http://localhost:8080/jarvis-main-interface.html" &
                else
                    echo "      🌐 Open http://localhost:8080/jarvis-main-interface.html in your browser"
                fi
                ;;
            windows)
                start "http://localhost:8080/jarvis-main-interface.html"
                ;;
            *)
                echo "      🌐 Open http://localhost:8080/jarvis-main-interface.html in your browser"
                ;;
        esac
        
        echo "      📝 PWA Server PID: $PWA_SERVER_PID, Port: 8080"
    fi
fi

# Step 8: Final system status
echo ""
echo -e "${GREEN}🎉 JARVIS HUD SYSTEM ACTIVE!${NC}"
echo "================================="
echo ""
echo -e "${CYAN}🖥️  Platform:${NC} $PLATFORM_OPTIMIZED"
echo -e "${CYAN}📊 Readiness:${NC} $components_verified/$total_components components ($((components_verified * 100 / total_components))%)"
echo -e "${CYAN}🔧 Services:${NC} $SERVICES_STARTED background services running"
echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
if [[ -f ".reasoning-viz/reasoning-viz.pid" ]]; then
    echo "   • Reasoning Visualizer: http://localhost:$REASONING_PORT"
fi
if [[ -f ".reasoning-viz/ai-bridge.pid" ]]; then
    echo "   • AI Context Bridge: http://localhost:$AI_BRIDGE_PORT"
fi
if [[ -f ".reasoning-viz/pwa-server.pid" ]]; then
    echo "   • PWA Interface: http://localhost:8080/jarvis-main-interface.html"
fi
echo ""
echo -e "${BLUE}🦾 HUD Features:${NC}"
echo "   • Real-time reasoning visualization"
echo "   • AI context bridge integration"
echo "   • Cross-platform deployment (Chromebook, Chrome, Apple)"
[[ -f "fog-of-war-3d-explorer.html" ]] && echo "   • Fog of war 3D exploration"
[[ -f "boss-room-cursor-overlay.html" ]] && echo "   • Boss room cursor overlay"
echo "   • Holographic HUD interface"
echo "   • Screenshot with context capture"
echo ""
echo -e "${BLUE}⌨️  Quick Commands:${NC}"
echo "   • Activate HUD: Ctrl/Cmd + J (in Electron app)"
echo "   • Quick reasoning log: Ctrl/Cmd + Shift + R"
echo "   • Screenshot with context: Ctrl/Cmd + Shift + S"
echo ""
echo -e "${BLUE}📁 Data Location:${NC}"
echo "   • All data: .reasoning-viz/"
echo "   • Logs: .reasoning-viz/logs/"
echo "   • Config: .reasoning-viz/jarvis-launch-config.json"
echo ""
echo -e "${BLUE}🛑 To Stop System:${NC}"
echo "   • Run: ./stop-jarvis-hud.sh"
echo "   • Or: kill \$(cat .reasoning-viz/*.pid)"

# Create stop script
cat > stop-jarvis-hud.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Jarvis HUD System..."

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
pkill -f "jarvis-hud-electron.js" 2>/dev/null || true
pkill -f "reasoning-viz-manager.js" 2>/dev/null || true
pkill -f "ai-reasoning-bridge.js" 2>/dev/null || true

echo "🧹 All Jarvis HUD processes stopped"
EOF

chmod +x stop-jarvis-hud.sh

echo -e "${GREEN}✅ Stop script created: ./stop-jarvis-hud.sh${NC}"
echo ""
echo -e "${YELLOW}💡 Pro Tip:${NC}"
echo "   Try activating the HUD overlay with Ctrl/Cmd + J for the full Iron Man experience!"

# Wait a moment for services to fully start
echo ""
echo -e "${BLUE}⏳ System initialization complete. Services are starting up...${NC}"
sleep 5

echo -e "${GREEN}🦾🤖 Welcome to J.A.R.V.I.S. HUD - Your AI-powered reasoning interface is ready!${NC}"