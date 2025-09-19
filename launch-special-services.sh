#!/bin/bash

# Launch Special Services: Guardian Teacher, AI Casino, and Infinity Router
# Usage: ./launch-special-services.sh [all|guardian|casino|infinity|orchestrator]

set -e

echo "🚀 LAUNCHING SPECIAL SERVICES"
echo "============================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    local service=$1
    local port=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service is running on port $port"
        return 0
    else
        echo -e "${RED}✗${NC} $service is not running on port $port"
        return 1
    fi
}

# Function to start a service
start_service() {
    local service=$1
    echo -e "${BLUE}Starting $service...${NC}"
}

# Parse command line arguments
SERVICE=${1:-all}

case $SERVICE in
    all)
        echo "Starting all special services with Docker Compose..."
        
        # Check if main services are running
        echo -e "\n${YELLOW}Checking prerequisites...${NC}"
        if ! docker ps | grep -q "document-generator-postgres"; then
            echo -e "${YELLOW}Starting infrastructure services first...${NC}"
            docker-compose up -d postgres redis ollama
            sleep 5
        fi
        
        # Start special services using profiles
        echo -e "\n${BLUE}Starting special services...${NC}"
        docker-compose --profile special-services up -d
        
        # Wait for services to start
        echo -e "\n${YELLOW}Waiting for services to initialize...${NC}"
        sleep 10
        
        # Check status
        echo -e "\n${GREEN}Service Status:${NC}"
        check_service "Guardian Teacher" 9998
        check_service "AI Agent Casino" 9706
        check_service "Infinity Router" 8001
        check_service "Special Orchestrator" 7001
        
        echo -e "\n${GREEN}✅ All special services launched!${NC}"
        echo -e "\n${BLUE}Access points:${NC}"
        echo "  🛡️  Guardian Teacher: http://localhost:9998"
        echo "  🎰 AI Agent Casino: http://localhost:9706"
        echo "  ♾️  Infinity Router: http://localhost:8001"
        echo "  🎯 Orchestrator Dashboard: http://localhost:7001"
        ;;
        
    guardian)
        start_service "Guardian Teacher System"
        docker-compose up -d guardian-teacher
        echo -e "${GREEN}Guardian Teacher System started on port 9998${NC}"
        ;;
        
    casino)
        start_service "AI Agent Crypto Casino"
        docker-compose up -d ai-casino
        echo -e "${GREEN}AI Agent Crypto Casino started on port 9706${NC}"
        ;;
        
    infinity)
        start_service "Infinity Router System"
        docker-compose up -d infinity-router
        echo -e "${GREEN}Infinity Router System started on port 8001${NC}"
        ;;
        
    orchestrator)
        start_service "Special Services Orchestrator"
        docker-compose up -d special-orchestrator
        echo -e "${GREEN}Special Services Orchestrator started on port 7000${NC}"
        ;;
        
    stop)
        echo "Stopping all special services..."
        docker-compose stop guardian-teacher ai-casino infinity-router special-orchestrator
        echo -e "${GREEN}All special services stopped${NC}"
        ;;
        
    logs)
        echo "Showing logs for special services..."
        docker-compose logs -f guardian-teacher ai-casino infinity-router special-orchestrator
        ;;
        
    status)
        echo "Checking status of special services..."
        echo ""
        check_service "Guardian Teacher" 9998
        check_service "AI Agent Casino" 9706
        check_service "Infinity Router" 8001
        check_service "Special Orchestrator" 7001
        echo ""
        docker-compose ps guardian-teacher ai-casino infinity-router special-orchestrator
        ;;
        
    *)
        echo "Usage: $0 [all|guardian|casino|infinity|orchestrator|stop|logs|status]"
        echo ""
        echo "Commands:"
        echo "  all          - Start all special services"
        echo "  guardian     - Start only Guardian Teacher System"
        echo "  casino       - Start only AI Agent Crypto Casino"
        echo "  infinity     - Start only Infinity Router System"
        echo "  orchestrator - Start only Special Services Orchestrator"
        echo "  stop         - Stop all special services"
        echo "  logs         - Show logs for all special services"
        echo "  status       - Check status of all special services"
        exit 1
        ;;
esac

# Show integration example if all services are running
if [ "$SERVICE" = "all" ]; then
    echo -e "\n${YELLOW}Integration Example:${NC}"
    echo "1. Visit the Orchestrator Dashboard: http://localhost:7000"
    echo "2. Click 'Full Integration Demo' to see all services working together"
    echo "3. Guardian teaches AI agents → Infinity routes them → They gamble in the casino"
    echo ""
    echo -e "${BLUE}To view logs:${NC} ./launch-special-services.sh logs"
    echo -e "${BLUE}To stop all:${NC} ./launch-special-services.sh stop"
fi