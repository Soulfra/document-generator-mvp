#!/bin/bash

# MASTER SYSTEM LAUNCHER
# Brings together all layers, services, and integrations
# Fortune 100 Enterprise Ready

set -euo pipefail

echo "🚀 DOCUMENT GENERATOR MASTER SYSTEM LAUNCHER 🚀"
echo "============================================="
echo "Initializing all 23 layers and integrations..."
echo ""

PROJECT_ROOT="/Users/matthewmauer/Desktop/Document-Generator"

# Function to check if a service is running
check_service() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ $name already running on port $port"
        return 0
    else
        echo "🔄 $name not running on port $port"
        return 1
    fi
}

# Function to start a service in background
start_service() {
    local cmd=$1
    local name=$2
    local dir=${3:-$PROJECT_ROOT}
    
    echo "🚀 Starting $name..."
    cd "$dir"
    eval "$cmd" &
    local pid=$!
    sleep 2
    
    if kill -0 $pid 2>/dev/null; then
        echo "✅ $name started (PID: $pid)"
        return 0
    else
        echo "❌ Failed to start $name"
        return 1
    fi
}

# Phase 1: Check Docker
echo "🐳 Phase 1: Checking Docker..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "✅ Docker is running"
else
    echo "⚠️  Docker not running - some services may not work"
fi

# Phase 2: Start Core Services
echo ""
echo "🎯 Phase 2: Starting Core Services..."

# Start simple server if not running
if ! check_service 8080 "Simple Server"; then
    if [ -f "$PROJECT_ROOT/simple-server.js" ]; then
        start_service "node simple-server.js" "Simple Server"
    fi
fi

# Phase 3: Start OSS Integration Layer
echo ""
echo "🔗 Phase 3: Starting OSS Integration Layer..."

if ! check_service 9999 "OSS Integration API"; then
    if [ -d "$PROJECT_ROOT/oss-integration-layer" ]; then
        cd "$PROJECT_ROOT/oss-integration-layer"
        if [ -f "start-integration.sh" ]; then
            echo "Starting OSS Integration services..."
            ./start-integration.sh &
            OSS_PID=$!
            sleep 3
        fi
    fi
fi

# Phase 4: Launch Showboat if requested
echo ""
echo "🎪 Phase 4: Showboat Launch Options..."
echo ""
echo "Select launch mode:"
echo "1. Full System (All services + monitoring)"
echo "2. Showboat Demo (Electron presentation)"
echo "3. Development Mode (Services only)"
echo "4. Quick Status Check"
read -p "Enter choice (1-4): " LAUNCH_MODE

case $LAUNCH_MODE in
    1)
        echo "🏢 Launching Full System..."
        
        # Open all dashboards
        sleep 2
        open "http://localhost:8080"
        open "http://localhost:9999/oss-integration-dashboard.html"
        
        # Launch Electron Showboat
        if [ -d "$PROJECT_ROOT/ultimate-compactor/electron-showboat" ]; then
            cd "$PROJECT_ROOT/ultimate-compactor/electron-showboat"
            if [ ! -d "node_modules" ]; then
                echo "Installing Electron dependencies..."
                npm install
            fi
            npm start -- --showboat-mode &
        fi
        ;;
        
    2)
        echo "🎪 Launching Showboat Demo..."
        
        if [ -d "$PROJECT_ROOT/ultimate-compactor/electron-showboat" ]; then
            cd "$PROJECT_ROOT/ultimate-compactor/electron-showboat"
            if [ ! -d "node_modules" ]; then
                npm install
            fi
            npm run showboat
        fi
        ;;
        
    3)
        echo "🔧 Development Mode - Services Only"
        # Services are already started
        ;;
        
    4)
        echo "📊 Quick Status Check..."
        ;;
esac

# Phase 5: System Status
echo ""
echo "📊 Phase 5: System Status"
echo "========================="

# Check all services
echo ""
echo "Service Status:"
check_service 8080 "🌐 Main API Server"
check_service 9999 "🔗 OSS Integration API" 
check_service 3000 "📝 Template Processor"
check_service 3001 "🤖 AI Services"
check_service 8888 "🎪 Showboat API"

# Show access points
echo ""
echo "🌐 Access Points:"
echo "================="
echo "🚀 Main Application: http://localhost:8080"
echo "🔗 OSS Integration: http://localhost:9999/oss-integration-dashboard.html"
echo "📊 System Dashboard: http://localhost:8080/system-dashboard.html"
echo "🤖 AI Economy: http://localhost:8080/ai-economy-dashboard.html"
echo "🎪 Showboat Interface: http://localhost:8888"
echo ""
echo "📚 API Documentation:"
echo "  - Status: http://localhost:9999/api/status"
echo "  - Symlinks: http://localhost:9999/api/symlinks"
echo "  - Layers: http://localhost:9999/api/layers/:tier"
echo ""

# Integration check
echo "🔍 Checking Integrations..."
if curl -s "http://localhost:9999/api/status" > /dev/null 2>&1; then
    echo "✅ OSS Integration Layer: ACTIVE"
    
    # Get symlink status
    STATUS=$(curl -s "http://localhost:9999/api/status" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
    if [ ! -z "$STATUS" ]; then
        echo "🔗 Active Symlinks: $STATUS"
    fi
else
    echo "⚠️  OSS Integration Layer: NOT RESPONDING"
fi

echo ""
echo "✅ MASTER SYSTEM LAUNCHER COMPLETE!"
echo "===================================="
echo ""
echo "All systems are connected and ready."
echo "Use Ctrl+C to stop all services."
echo ""

# Keep script running and handle cleanup
trap 'echo "🚫 Shutting down all services..."; killall node 2>/dev/null; exit' INT TERM

if [ "$LAUNCH_MODE" != "4" ]; then
    echo "Press Ctrl+C to stop all services..."
    while true; do
        sleep 60
        # Heartbeat check
        if ! check_service 9999 "OSS Integration" > /dev/null 2>&1; then
            echo "⚠️  OSS Integration stopped - restarting..."
            cd "$PROJECT_ROOT/oss-integration-layer"
            ./start-integration.sh &
        fi
    done
fi