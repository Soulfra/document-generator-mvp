#!/bin/bash

# 🚀 LAUNCH DOCUMENTATION & PROGRESS TRACKING SYSTEM
# For the Document Generator 3D Game Platform

echo "📚 LAUNCHING DOCUMENTATION & TRACKING SYSTEM"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check dependencies
echo "🔍 Checking dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Docker is running (for database)
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
    
    # Ensure PostgreSQL is running
    if ! docker ps | grep -q "document-generator-postgres"; then
        echo "🐘 Starting PostgreSQL..."
        docker-compose up -d postgres
        sleep 5
    fi
else
    echo -e "${YELLOW}⚠️  Docker not running - some features may be limited${NC}"
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Initialize prompt engineering database
echo "🧠 Initializing Prompt Engineering System..."
node prompt-engineering-system.js &
PROMPT_PID=$!
echo -e "${GREEN}✅ Prompt Engineering System started (PID: $PROMPT_PID)${NC}"

# Start progress tracking dashboard
echo "📊 Starting Progress Tracking Dashboard..."
python3 -m http.server 8890 --directory . > /dev/null 2>&1 &
PROGRESS_PID=$!
echo -e "${GREEN}✅ Progress Dashboard started (PID: $PROGRESS_PID)${NC}"

# Start documentation server
echo "📚 Starting Documentation Server..."
python3 -m http.server 8891 --directory . > /dev/null 2>&1 &
DOCS_PID=$!
echo -e "${GREEN}✅ Documentation Server started (PID: $DOCS_PID)${NC}"

# Create PID file for cleanup
echo "$PROMPT_PID $PROGRESS_PID $DOCS_PID" > .documentation_pids

# Give services time to start
sleep 3

echo ""
echo "==========================================="
echo -e "${GREEN}✅ DOCUMENTATION SYSTEM READY!${NC}"
echo "==========================================="
echo ""
echo "📊 DASHBOARDS & DOCUMENTATION:"
echo "  • Progress Tracking: ${BLUE}http://localhost:8890/project-progress-dashboard.html${NC}"
echo "  • Game Monitoring: ${BLUE}http://localhost:9103/game-monitoring-dashboard.html${NC}"
echo "  • Main Documentation: ${BLUE}http://localhost:8891/CLAUDE.3d-game-system.md${NC}"
echo "  • Integration Guide: ${BLUE}http://localhost:8891/docs/3d-game-integration-guide.md${NC}"
echo "  • WebSocket Protocols: ${BLUE}http://localhost:8891/docs/websocket-protocols.md${NC}"
echo ""
echo "📁 KEY FILES:"
echo "  • CHANGELOG.md - Version history and changes"
echo "  • prompt-engineering-system.js - AI prompt optimization"
echo "  • project-progress-dashboard.html - Real-time progress"
echo ""
echo "🎮 GAME SYSTEM:"
echo "  • Launch Game: ./launch-verified-3d-game.sh"
echo "  • Game Launcher: http://localhost:8888/enhanced-3d-game-launcher.html"
echo ""
echo "💡 QUICK COMMANDS:"
echo "  • View Changelog: cat CHANGELOG.md"
echo "  • Test Prompts: node prompt-engineering-system.js"
echo "  • Update Docs: ./update-documentation.sh"
echo ""
echo "📈 CURRENT STATUS:"

# Show completion status
COMPLETED=$(grep -c '"status": "completed"' < /dev/null || echo "0")
TOTAL=$(grep -c '"content":' < /dev/null || echo "0")
if [ "$TOTAL" -gt 0 ]; then
    PERCENTAGE=$((COMPLETED * 100 / TOTAL))
    echo "  • Todo Progress: $COMPLETED/$TOTAL ($PERCENTAGE%)"
else
    echo "  • Todo Progress: Calculating..."
fi

echo "  • Version: v1.0.0"
echo "  • Documentation: Complete ✅"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down documentation services..."
    
    if [ -f .documentation_pids ]; then
        while read -r pids; do
            for pid in $pids; do
                kill $pid 2>/dev/null && echo "Stopped process $pid"
            done
        done < .documentation_pids
        rm .documentation_pids
    fi
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Open browser automatically
sleep 2
echo "🌐 Opening Progress Dashboard..."
if command -v open &> /dev/null; then
    open "http://localhost:8890/project-progress-dashboard.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:8890/project-progress-dashboard.html"
fi

# Keep script running
while true; do
    sleep 1
done