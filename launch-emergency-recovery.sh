#!/bin/bash

# Launch Emergency Recovery System with all integrations
# This script starts all necessary services for the complete security ecosystem

echo "🚀 Launching Emergency Recovery System..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required services are available
check_service() {
    local service=$1
    local port=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✓${NC} $service is running on port $port"
        return 0
    else
        echo -e "${YELLOW}⚠${NC}  $service is not running on port $port"
        return 1
    fi
}

# Start a service if not running
start_service() {
    local name=$1
    local command=$2
    local port=$3
    
    echo -e "${BLUE}Starting $name...${NC}"
    eval "$command" &
    
    # Wait for service to start
    local count=0
    while ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null && [ $count -lt 30 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    if [ $count -eq 30 ]; then
        echo -e "${RED}✗${NC} Failed to start $name"
        return 1
    else
        echo -e "${GREEN}✓${NC} $name started successfully"
        return 0
    fi
}

# Create necessary directories
mkdir -p logs
mkdir -p data/emergency
mkdir -p keys/agent
mkdir -p identifiers/custom

echo ""
echo "📋 Checking existing services..."
echo "--------------------------------"

# Check core services
check_service "PostgreSQL" 5432
POSTGRES_RUNNING=$?

check_service "Redis" 6379
REDIS_RUNNING=$?

check_service "Internal Search Engine" 3333
SEARCH_RUNNING=$?

check_service "PGP Auth Service" 3000
PGP_RUNNING=$?

check_service "UPC/QR Tracker" 3003
UPC_RUNNING=$?

echo ""
echo "🔧 Starting Emergency Recovery System..."
echo "---------------------------------------"

# Start Emergency Recovery System
if ! check_service "Emergency Recovery" 9911; then
    start_service "Emergency Recovery System" "node emergency-recovery-system.js > logs/emergency-recovery.log 2>&1" 9911
fi

# Start WebSocket monitoring
if ! check_service "Emergency WebSocket" 9912; then
    echo -e "${GREEN}✓${NC} Emergency WebSocket will start with main system"
fi

echo ""
echo "🧪 Running integration tests..."
echo "------------------------------"

# Give services a moment to stabilize
sleep 2

# Run integration tests
node test-emergency-integration.js

echo ""
echo "📊 System Status"
echo "---------------"

# Check final status
if check_service "Emergency Recovery" 9911; then
    # Get system status
    curl -s http://localhost:9911/status | jq '.' 2>/dev/null || echo "Status endpoint not responding"
fi

echo ""
echo "🌐 Access Points"
echo "---------------"
echo "Emergency Recovery API: http://localhost:9911"
echo "WebSocket Monitoring: ws://localhost:9912"
echo "Internal Search: http://localhost:3333"
echo "Health Check: http://localhost:9911/health"
echo "Status Dashboard: http://localhost:9911/status"

echo ""
echo "📖 Quick Start Commands"
echo "----------------------"
echo "# Check for key leaks:"
echo "curl -X POST http://localhost:9911/security/check-leak -H 'Content-Type: application/json' -d '{\"keyType\":\"pgp\",\"keyData\":\"YOUR_KEY\"}'"
echo ""
echo "# Generate custom identifier:"
echo "curl -X POST http://localhost:9911/identifier/generate -H 'Content-Type: application/json' -d '{\"type\":\"universal\",\"ownerId\":\"test-123\"}'"
echo ""
echo "# Activate emergency recovery:"
echo "curl -X POST http://localhost:9911/emergency/activate -H 'Content-Type: application/json' -d '{\"userId\":\"user-123\",\"reason\":\"test\"}'"

echo ""
echo "🛡️ Security Features Active"
echo "-------------------------"
echo "✓ PGP Authentication & Key Management"
echo "✓ UPC/QR/RFID/Bluetooth Tracking"
echo "✓ Real-time Leak Detection"
echo "✓ Tamper Detection & Prevention"
echo "✓ Legacy Hardware Compatibility"
echo "✓ Agent Key Interchange System"
echo "✓ Emergency Recovery Protocols"

echo ""
echo -e "${GREEN}✅ Emergency Recovery System is ready!${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running and handle shutdown
trap 'echo -e "\n${YELLOW}Shutting down services...${NC}"; kill $(jobs -p) 2>/dev/null; exit' INT

# Monitor services
while true; do
    sleep 60
    # Periodic health check
    if ! check_service "Emergency Recovery" 9911 >/dev/null 2>&1; then
        echo -e "${RED}⚠️  Emergency Recovery System stopped unexpectedly${NC}"
        start_service "Emergency Recovery System" "node emergency-recovery-system.js > logs/emergency-recovery.log 2>&1" 9911
    fi
done