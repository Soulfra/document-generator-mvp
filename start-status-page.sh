#!/bin/bash

# Start Status Page Services for Document Generator
# This starts the health check API, monitoring service, and opens the status page

echo "🚀 Starting Document Generator Status Page..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npm dependencies are installed for the services
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express axios ws ioredis
fi

# Start health check API
echo -e "${YELLOW}Starting Health Check API...${NC}"
node api/health-check.js &
HEALTH_PID=$!
echo "✅ Health Check API started (PID: $HEALTH_PID)"

# Wait a moment for health check to start
sleep 2

# Start status monitoring service
echo -e "${YELLOW}Starting Status Monitor...${NC}"
node services/status-monitor.js &
MONITOR_PID=$!
echo "✅ Status Monitor started (PID: $MONITOR_PID)"

# Create a simple HTTP server for the status page
echo -e "${YELLOW}Starting Status Page server...${NC}"
npx http-server -p 8888 --cors -c-1 . &
SERVER_PID=$!
echo "✅ Status Page server started (PID: $SERVER_PID)"

# Wait for services to be ready
sleep 3

# Open status page in browser
echo -e "${GREEN}Opening status page in browser...${NC}"
if command -v open &> /dev/null; then
    open http://localhost:8888/status.html
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8888/status.html
else
    echo "Please open http://localhost:8888/status.html in your browser"
fi

echo ""
echo "📊 Status Page is running!"
echo ""
echo "Services:"
echo "  - Status Page: http://localhost:8888/status.html"
echo "  - Health Check API: http://localhost:3333/health"
echo "  - Status Monitor API: http://localhost:3334/status"
echo "  - WebSocket (real-time): ws://localhost:3335"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $HEALTH_PID $MONITOR_PID $SERVER_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT TERM

# Keep script running
wait