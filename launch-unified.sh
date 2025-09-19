#!/bin/bash

# 🚀 UNIFIED DOCUMENT GENERATOR LAUNCHER
# Starts all services in the correct order

echo "🚀 UNIFIED DOCUMENT GENERATOR LAUNCHER"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if services are already running
echo "🔍 Checking existing services..."

# Kill existing services if requested
if [ "$1" == "--restart" ]; then
    echo "🛑 Stopping existing services..."
    pkill -f "marketplace-integration|real-ai-api|notification-service|empire-api-bridge" 2>/dev/null
    sleep 2
fi

# Create logs directory
mkdir -p logs

echo ""
echo "📦 Starting core services..."

# 1. Start AI API Service (port 3001)
if ! lsof -i :3001 &> /dev/null; then
    echo "Starting AI API Service..."
    node services/real-ai-api.js > logs/ai-api.log 2>&1 &
    echo -e "${GREEN}✓ AI API Service started${NC}"
else
    echo -e "${YELLOW}⚠ AI API Service already running${NC}"
fi

# 2. Start Notification Service (port 8081)
if ! lsof -i :8081 &> /dev/null; then
    echo "Starting Notification Service..."
    node notification-service.js > logs/notification.log 2>&1 &
    echo -e "${GREEN}✓ Notification Service started${NC}"
else
    echo -e "${YELLOW}⚠ Notification Service already running${NC}"
fi

# 3. Start Marketplace (port 8080)
if ! lsof -i :8080 &> /dev/null; then
    echo "Starting AI Agent Marketplace..."
    node marketplace-integration.js > logs/marketplace.log 2>&1 &
    echo -e "${GREEN}✓ Marketplace started${NC}"
else
    echo -e "${YELLOW}⚠ Marketplace already running${NC}"
fi

# 4. Start Empire API Bridge (port 8090)
if ! lsof -i :8090 &> /dev/null; then
    echo "Starting Empire API Bridge..."
    node empire-api-bridge.js > logs/empire-api.log 2>&1 &
    echo -e "${GREEN}✓ Empire API Bridge started${NC}"
else
    echo -e "${YELLOW}⚠ Empire API Bridge already running${NC}"
fi

# Wait for services to initialize
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check service health
echo ""
echo "🔍 Verifying services..."

SERVICES_OK=true

# Check each service
if curl -s http://localhost:3001/health &> /dev/null; then
    echo -e "${GREEN}✓ AI API Service: Online${NC}"
else
    echo -e "${RED}✗ AI API Service: Offline${NC}"
    SERVICES_OK=false
fi

if curl -s http://localhost:8080/health &> /dev/null; then
    echo -e "${GREEN}✓ Marketplace: Online${NC}"
else
    echo -e "${RED}✗ Marketplace: Offline${NC}"
    SERVICES_OK=false
fi

if curl -s http://localhost:8090/api/systems &> /dev/null; then
    echo -e "${GREEN}✓ Empire API: Online${NC}"
else
    echo -e "${RED}✗ Empire API: Offline${NC}"
    SERVICES_OK=false
fi

# Summary
echo ""
echo "===================================="
echo ""

if [ "$SERVICES_OK" = true ]; then
    echo -e "${GREEN}🎉 ALL SERVICES RUNNING!${NC}"
    echo ""
    echo "🌐 Access Points:"
    echo "   📋 Unified Launcher: http://localhost:8080/launcher.html"
    echo "   🏰 Empire Platform: http://localhost:8080"
    echo "   🤖 AI Marketplace: http://localhost:8080/agent-working.html"
    echo "   📄 Templates: http://localhost:3000"
    echo "   ⚙️ Setup Wizard: http://localhost:8080/setup-wizard.html"
    echo ""
    echo "📊 Service Endpoints:"
    echo "   AI API: http://localhost:3001"
    echo "   Empire API: http://localhost:8090"
    echo "   Notifications: ws://localhost:8081"
    echo ""
    echo "📝 Logs:"
    echo "   tail -f logs/*.log"
    echo ""
    echo "🛑 To stop all services:"
    echo "   pkill -f 'marketplace-integration|real-ai-api|notification-service|empire-api-bridge'"
    echo ""
    
    # Open launcher if requested
    if [ "$2" == "--open" ]; then
        sleep 2
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open http://localhost:8080/launcher.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:8080/launcher.html
        fi
    fi
else
    echo -e "${RED}⚠️ SOME SERVICES FAILED TO START${NC}"
    echo ""
    echo "Check logs for errors:"
    echo "  tail -f logs/*.log"
    echo ""
    echo "Try restarting with:"
    echo "  ./launch-unified.sh --restart"
fi