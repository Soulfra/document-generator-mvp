#!/bin/bash

# 🏠 PROPTECH VC DEMO LAUNCHER
# 
# Launches the complete PropTech VC demo system with GitBook-style interface
# Based on Chapter 7 Kickapoo Valley methodology with real-time content generation

echo "🏠 PROPTECH VC DEMO LAUNCHER"
echo "============================"
echo ""
echo "🎯 Starting interactive VC demo with orchestrated content generation"
echo "📚 GitBook-style interface with real-time cost tracking"
echo "🤖 Multi-orchestrator AI content generation system"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO:${NC} $1"
}

debug() {
    echo -e "${PURPLE}[$(date '+%H:%M:%S')] DEBUG:${NC} $1"
}

check_port() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
    return $?
}

wait_for_port() {
    local port=$1
    local timeout=${2:-30}
    local count=0
    
    while [ $count -lt $timeout ]; do
        if check_port $port; then
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    return 1
}

create_databases_dir() {
    if [ ! -d "databases" ]; then
        log "Creating databases directory..."
        mkdir -p databases
    fi
}

# Phase 1: Environment Setup
echo ""
echo "🔧 PHASE 1: ENVIRONMENT SETUP"
echo "=============================="

# Create necessary directories
create_databases_dir

log "Creating PropTech VC demo directories..."
mkdir -p proptech-vc-demo/css
mkdir -p proptech-vc-demo/js
mkdir -p proptech-vc-demo/assets
mkdir -p proptech-vc-demo/generated

# Check for required Node.js modules
log "Checking Node.js dependencies..."
if ! npm list sqlite3 >/dev/null 2>&1; then
    warn "sqlite3 module not found, installing..."
    npm install sqlite3 ws
fi

# Phase 2: Start Supporting Services
echo ""
echo "🌊 PHASE 2: STARTING SUPPORTING SERVICES"
echo "======================================="

SERVICE_PIDS=()

# Start Fluid State Manager (if available)
log "Starting Fluid State Manager..."
if [ -f "UNIFIED-FLUID-STATE-MANAGER.js" ]; then
    node UNIFIED-FLUID-STATE-MANAGER.js > /tmp/fluid-state-vc-demo.log 2>&1 &
    FLUID_PID=$!
    SERVICE_PIDS+=($FLUID_PID)
    
    if wait_for_port 8081 10; then
        log "✅ Fluid State Manager running on port 8081"
    else
        warn "⚠️ Fluid State Manager not responding"
    fi
else
    warn "UNIFIED-FLUID-STATE-MANAGER.js not found, continuing without it"
fi

# Start Forum API Server (for research queries)
log "Starting Forum API Server for research..."
if [ -f "PRODUCTION-FORUM-API-SERVER.js" ]; then
    node PRODUCTION-FORUM-API-SERVER.js > /tmp/forum-api-vc-demo.log 2>&1 &
    FORUM_PID=$!
    SERVICE_PIDS+=($FORUM_PID)
    
    if wait_for_port 3334 10; then
        log "✅ Forum API Server running on port 3334"
    else
        warn "⚠️ Forum API Server not responding"
    fi
fi

# Start AI Agent RPG API (for competitive analysis)
log "Starting AI Agent RPG API for analysis..."
if [ -f "AI-AGENT-RPG-API-FIXED.js" ]; then
    node AI-AGENT-RPG-API-FIXED.js > /tmp/rpg-api-vc-demo.log 2>&1 &
    RPG_PID=$!
    SERVICE_PIDS+=($RPG_PID)
    
    if wait_for_port 3335 10; then
        log "✅ AI Agent RPG API running on port 3335"
    else
        warn "⚠️ AI Agent RPG API not responding"
    fi
fi

# Start Universal Display Kernel (for UI generation)
log "Starting Universal Display Kernel..."
if [ -f "UNIVERSAL-DISPLAY-KERNEL.js" ]; then
    node UNIVERSAL-DISPLAY-KERNEL.js > /tmp/display-kernel-vc-demo.log 2>&1 &
    DISPLAY_PID=$!
    SERVICE_PIDS+=($DISPLAY_PID)
    
    if wait_for_port 8888 10; then
        log "✅ Universal Display Kernel running on port 8888"
    else
        warn "⚠️ Universal Display Kernel not responding"
    fi
fi

# Phase 3: Start PropTech VC Content Generator
echo ""
echo "🏠 PHASE 3: STARTING PROPTECH VC CONTENT GENERATOR"
echo "================================================="

log "Starting PropTech VC Content Generator..."
node PROPTECH-VC-CONTENT-GENERATOR.js > /tmp/proptech-vc-generator.log 2>&1 &
MAIN_PID=$!
SERVICE_PIDS+=($MAIN_PID)

# Wait for main service to start
if wait_for_port 3337 20; then
    log "✅ PropTech VC Content Generator running on port 3337"
else
    error "❌ PropTech VC Content Generator failed to start"
    cat /tmp/proptech-vc-generator.log
    exit 1
fi

if wait_for_port 8083 10; then
    log "✅ WebSocket server running on port 8083"
else
    warn "⚠️ WebSocket server not responding"
fi

# Give services time to initialize
log "Allowing services to initialize..."
sleep 5

# Phase 4: Demo Information & Access
echo ""
echo "🎯 PHASE 4: DEMO READY!"
echo "======================"

info "PropTech VC Demo is now running!"
echo ""

echo -e "${CYAN}📊 DEMO ACCESS INFORMATION${NC}"
echo "=========================="
echo ""
echo -e "🌐 GitBook Interface:     ${GREEN}http://localhost:3337${NC}"
echo -e "📡 WebSocket Updates:      ${GREEN}ws://localhost:8083${NC}"
echo -e "🔄 Real-time Generation:   ${GREEN}Click sections to see live content creation${NC}"
echo ""

echo -e "${CYAN}🎭 DEMO FEATURES${NC}"
echo "==============="
echo "✅ Interactive GitBook-style navigation"
echo "✅ Real-time AI content generation"
echo "✅ Transparent cost tracking"
echo "✅ Multi-orchestrator system integration"
echo "✅ PropTech-specific VC frameworks:"
echo "   📊 Market Analysis (TAM/SAM/SOM)"
echo "   💰 Financial Projections"
echo "   ⚔️ Competitive Analysis"  
echo "   🏗️ Technical Architecture"
echo "   🚀 Go-to-Market Strategy"
echo ""

echo -e "${CYAN}💰 COST TRACKING${NC}"
echo "================"
echo "• Real-time compute unit tracking"
echo "• Cost breakdown per section"
echo "• Orchestrator query analytics"
echo "• Transparent AI usage metrics"
echo ""

echo -e "${CYAN}🔧 SERVICE STATUS${NC}"
echo "================"
log "Main VC Generator:         http://localhost:3337"
log "WebSocket Updates:         ws://localhost:8083"

if check_port 8081; then
    log "Fluid State Manager:       ws://localhost:8081"
else
    warn "Fluid State Manager:       Not running"
fi

if check_port 3334; then
    log "Forum API Server:          http://localhost:3334" 
else
    warn "Forum API Server:          Not running"
fi

if check_port 3335; then
    log "AI Agent RPG API:          http://localhost:3335"
else
    warn "AI Agent RPG API:          Not running"
fi

if check_port 8888; then
    log "Universal Display Kernel:  http://localhost:8888"
else
    warn "Universal Display Kernel:  Not running"
fi

echo ""
echo -e "${CYAN}📁 LOG FILES${NC}"
echo "============="
echo "• Main Generator:     /tmp/proptech-vc-generator.log"
echo "• Fluid State:        /tmp/fluid-state-vc-demo.log"
echo "• Forum API:          /tmp/forum-api-vc-demo.log"
echo "• RPG API:            /tmp/rpg-api-vc-demo.log"
echo "• Display Kernel:     /tmp/display-kernel-vc-demo.log"
echo ""

echo -e "${CYAN}🎮 HOW TO USE THE DEMO${NC}"
echo "======================"
echo "1. 🌐 Open http://localhost:3337 in your browser"
echo "2. 📋 Click any framework in the sidebar to explore"
echo "3. 🚀 Click 'Generate Complete VC Package' for full demo"
echo "4. 📊 Watch real-time cost tracking and generation progress"
echo "5. 💰 See transparent AI usage and orchestrator queries"
echo ""

echo -e "${CYAN}🎯 FOR VCs & INVESTORS${NC}"
echo "======================"
echo "• This demo showcases our technical capabilities"
echo "• Real-time cost transparency demonstrates efficiency"
echo "• Multi-orchestrator system shows scalability"
echo "• Generated content quality proves market readiness"
echo "• Architecture supports thousands of concurrent users"
echo ""

# Phase 5: Monitor and Wait
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Setup cleanup trap
cleanup() {
    echo ""
    echo "🛑 Stopping PropTech VC Demo services..."
    
    for pid in "${SERVICE_PIDS[@]}"; do
        if [ ! -z "$pid" ]; then
            kill -TERM "$pid" 2>/dev/null
        fi
    done
    
    sleep 3
    
    # Force kill if needed
    for pid in "${SERVICE_PIDS[@]}"; do
        if [ ! -z "$pid" ]; then
            kill -KILL "$pid" 2>/dev/null
        fi
    done
    
    echo "✅ All services stopped"
    echo ""
    echo -e "${GREEN}🎉 PropTech VC Demo Complete!${NC}"
    echo "Thank you for exploring our interactive investment materials generator!"
    echo ""
    echo "📋 Demo showcased:"
    echo "• Real-time AI content generation"
    echo "• Transparent cost tracking"
    echo "• Multi-orchestrator system integration"
    echo "• PropTech-specific VC frameworks"
    echo "• GitBook-style interactive navigation"
    echo ""
    echo "🚀 Ready for Series A discussions!"
}

trap cleanup INT TERM

# Live monitoring
echo -e "${PURPLE}🔍 LIVE MONITORING${NC}"
echo "=================="
echo "Monitoring services... (Ctrl+C to stop)"

# Monitor loop
while true; do
    sleep 30
    
    # Check if main service is still running
    if ! check_port 3337; then
        error "Main service died, restarting..."
        node PROPTECH-VC-CONTENT-GENERATOR.js > /tmp/proptech-vc-generator.log 2>&1 &
        MAIN_PID=$!
        SERVICE_PIDS+=($MAIN_PID)
    fi
    
    # Log activity
    if [ -f "/tmp/proptech-vc-generator.log" ]; then
        ACTIVITY=$(tail -n 1 /tmp/proptech-vc-generator.log)
        if [ ! -z "$ACTIVITY" ]; then
            debug "Activity: $ACTIVITY"
        fi
    fi
done