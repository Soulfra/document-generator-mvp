#!/bin/bash

# 🌉 LAUNCH UNIFIED DEBUG SYSTEM
# Starts the complete integrated monitoring system with all components

echo "🌉 LAUNCHING UNIFIED DEBUG SYSTEM"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

# Check dependencies
echo -e "${BLUE}📦 Checking dependencies...${NC}"

# Required packages
REQUIRED_PACKAGES=("uuid" "colors" "sqlite3" "axios")

for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! npm list "$package" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Installing missing package: $package${NC}"
        npm install "$package"
    else
        echo -e "${GREEN}✓ $package${NC}"
    fi
done

# Create necessary directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p logs
mkdir -p databases

# Check if all required files exist
echo -e "${BLUE}🔍 Checking components...${NC}"

REQUIRED_FILES=(
    "unified-color-tagged-logger.js"
    "debug-flow-orchestrator.js" 
    "REAL-PROACTIVE-MONITOR.js"
    "suggestion-engine.js"
    "real-time-test-monitor.js"
    "unified-debug-integration-bridge.js"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required files: ${MISSING_FILES[*]}${NC}"
    echo "Please ensure all components are in the current directory"
    exit 1
fi

echo ""
echo -e "${PURPLE}🚀 Starting Unified Debug System Components...${NC}"
echo ""

# Function to start component in background
start_component() {
    local name="$1"
    local command="$2"
    local port="$3"
    local color="$4"
    
    echo -e "${color}▶️  Starting $name...${NC}"
    
    # Start in background and capture PID
    $command > "logs/${name}.log" 2>&1 &
    local pid=$!
    
    # Store PID for cleanup
    echo $pid > "logs/${name}.pid"
    
    # Wait a moment and check if it's still running
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        echo -e "${GREEN}✅ $name started (PID: $pid)${NC}"
        if [ -n "$port" ]; then
            echo -e "${GREEN}   🌐 Available at: http://localhost:$port${NC}"
        fi
    else
        echo -e "${RED}❌ $name failed to start${NC}"
        echo -e "${RED}   Check logs/${name}.log for details${NC}"
    fi
    
    echo ""
}

# Start Real Proactive Monitor (has web dashboard)
start_component "Real-Proactive-Monitor" "node REAL-PROACTIVE-MONITOR.js" "1505" "$BLUE"

# Start Unified Debug Integration Bridge (main orchestrator)
start_component "Unified-Debug-Bridge" "node unified-debug-integration-bridge.js" "" "$PURPLE"

# Wait for everything to initialize
echo -e "${YELLOW}⏳ Waiting for components to initialize...${NC}"
sleep 5

# Test if components are responding
echo -e "${BLUE}🔍 Testing component health...${NC}"

# Test Real Proactive Monitor
if curl -s http://localhost:1505 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Real Proactive Monitor responding${NC}"
else
    echo -e "${YELLOW}⚠️  Real Proactive Monitor not responding yet${NC}"
fi

echo ""
echo -e "${WHITE}🎯 UNIFIED DEBUG SYSTEM STATUS${NC}"
echo -e "${WHITE}==============================${NC}"
echo ""

# Show running components
echo -e "${GREEN}🟢 Active Components:${NC}"
for file in logs/*.pid; do
    if [ -f "$file" ]; then
        local name=$(basename "$file" .pid)
        local pid=$(cat "$file")
        if kill -0 $pid 2>/dev/null; then
            echo -e "${GREEN}   ✓ $name (PID: $pid)${NC}"
        else
            echo -e "${RED}   ✗ $name (not running)${NC}"
        fi
    fi
done

echo ""
echo -e "${BLUE}🌐 Web Interfaces:${NC}"
echo -e "${BLUE}   Real Proactive Monitor: http://localhost:1505${NC}"
echo ""

echo -e "${YELLOW}📊 Log Files:${NC}"
ls -la logs/*.log 2>/dev/null | while read line; do
    echo -e "${YELLOW}   $line${NC}"
done

echo ""
echo -e "${PURPLE}🎨 Color Coding Legend:${NC}"
echo -e "${GREEN}   🟢 Success/Working${NC}"
echo -e "${YELLOW}   🟡 Warning/Degraded${NC}"
echo -e "${RED}   🔴 Error/Failed${NC}"
echo -e "${BLUE}   🔵 Info/Status${NC}"
echo -e "${PURPLE}   🟣 Debug/Trace${NC}"
echo -e "${WHITE}   ⚪ Suggestion/Fix${NC}"

echo ""
echo -e "${WHITE}📚 Usage Examples:${NC}"
echo ""
echo -e "${BLUE}1. Launch service with monitoring:${NC}"
echo -e "${BLUE}   ./launch-with-monitoring.sh node your-service.js${NC}"
echo ""
echo -e "${BLUE}2. Test the logging system:${NC}"
echo -e "${BLUE}   node unified-color-tagged-logger.js${NC}"
echo ""
echo -e "${BLUE}3. Test suggestion engine:${NC}"
echo -e "${BLUE}   node suggestion-engine.js${NC}"
echo ""
echo -e "${BLUE}4. Verify monitoring system:${NC}"
echo -e "${BLUE}   node verify-monitoring-system.js${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down Unified Debug System...${NC}"
    
    # Kill all components
    for file in logs/*.pid; do
        if [ -f "$file" ]; then
            local name=$(basename "$file" .pid)
            local pid=$(cat "$file")
            if kill -0 $pid 2>/dev/null; then
                echo -e "${YELLOW}   Stopping $name (PID: $pid)...${NC}"
                kill $pid
                
                # Wait a moment, then force kill if needed
                sleep 2
                if kill -0 $pid 2>/dev/null; then
                    echo -e "${RED}   Force killing $name...${NC}"
                    kill -9 $pid
                fi
            fi
            rm -f "$file"
        fi
    done
    
    echo -e "${GREEN}✅ Unified Debug System stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}✅ Unified Debug System is now running!${NC}"
echo -e "${WHITE}Press Ctrl+C to stop all components${NC}"
echo ""

# Keep script running and show live status
while true; do
    sleep 30
    
    # Quick health check
    echo -e "${BLUE}[$(date '+%H:%M:%S')] Health Check:${NC}"
    
    HEALTHY=0
    TOTAL=0
    
    for file in logs/*.pid; do
        if [ -f "$file" ]; then
            local name=$(basename "$file" .pid)
            local pid=$(cat "$file")
            TOTAL=$((TOTAL + 1))
            
            if kill -0 $pid 2>/dev/null; then
                echo -e "${GREEN}   ✓ $name${NC}"
                HEALTHY=$((HEALTHY + 1))
            else
                echo -e "${RED}   ✗ $name${NC}"
                rm -f "$file"  # Remove stale PID file
            fi
        fi
    done
    
    if [ $HEALTHY -eq $TOTAL ] && [ $TOTAL -gt 0 ]; then
        echo -e "${GREEN}   🎯 All $TOTAL components healthy${NC}"
    else
        echo -e "${YELLOW}   ⚠️  $HEALTHY/$TOTAL components healthy${NC}"
    fi
    
    echo ""
done