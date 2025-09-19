#!/bin/bash

# 🧠 FIFTY FIRST MINDS LAUNCHER
# Launch the complete domain intelligence system

set -e

echo "🧠 Launching Fifty First Minds Domain Intelligence System..."
echo "================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}⏳ Waiting for $name to be ready at $url...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -ne "${YELLOW}   Attempt $attempt/$max_attempts...${NC}\r"
        sleep 2
    done
    
    echo -e "${RED}❌ $name failed to start within $(($max_attempts * 2)) seconds${NC}"
    return 1
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 System Requirements Check${NC}"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check for required dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install express cors node-fetch > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  Installing basic dependencies...${NC}"
        npm init -y > /dev/null 2>&1
        npm install express cors > /dev/null 2>&1
        
        # Try to install node-fetch, fallback if needed
        npm install node-fetch > /dev/null 2>&1 || {
            echo -e "${YELLOW}⚠️  Using built-in fetch (Node 18+)${NC}"
        }
    }
fi

# Start core services in background
echo -e "\n${PURPLE}🚀 Starting Core Services...${NC}"

# 1. Template Processor Service (Port 3002)
if ! check_port 3002; then
    echo -e "${CYAN}📝 Starting Template Processor Service on port 3002...${NC}"
    if [ -f "docgen-starter-kit/services/template-processor/index.js" ]; then
        cd docgen-starter-kit/services/template-processor
        node index.js > ../../../logs/template-processor.log 2>&1 &
        TEMPLATE_PID=$!
        cd ../../..
        echo "Template Processor PID: $TEMPLATE_PID" >> .pids
    else
        echo -e "${YELLOW}⚠️  Template processor not found, using fallback mode${NC}"
    fi
else
    echo -e "${GREEN}✅ Template Processor already running on port 3002${NC}"
fi

# 2. CAL-RIVEN-ASSISTANT (Port 9999)  
if ! check_port 9999; then
    echo -e "${CYAN}🤖 Starting CAL-RIVEN-ASSISTANT on port 9999...${NC}"
    if [ -f "cal-riven-assistant.js" ]; then
        node cal-riven-assistant.js > logs/cal-riven.log 2>&1 &
        CAL_PID=$!
        echo "CAL-RIVEN PID: $CAL_PID" >> .pids
    else
        echo -e "${YELLOW}⚠️  CAL-RIVEN-ASSISTANT not found, using fallback mode${NC}"
    fi
else
    echo -e "${GREEN}✅ CAL-RIVEN-ASSISTANT already running on port 9999${NC}"
fi

# 3. Domain Aggregator (Port 8888)
if ! check_port 8888; then
    echo -e "${CYAN}🌐 Starting Domain Aggregator on port 8888...${NC}"
    if [ -f "CAL-DOMAIN-AGGREGATOR.js" ]; then
        PORT=8888 node CAL-DOMAIN-AGGREGATOR.js > logs/domain-aggregator.log 2>&1 &
        DOMAIN_PID=$!
        echo "Domain Aggregator PID: $DOMAIN_PID" >> .pids
    else
        echo -e "${YELLOW}⚠️  Domain Aggregator not found, using fallback mode${NC}"
    fi
else
    echo -e "${GREEN}✅ Domain Aggregator already running on port 8888${NC}"
fi

# 4. Start Fifty First Minds Search Engine (Port 7777)
echo -e "\n${PURPLE}🧠 Starting Fifty First Minds Search Engine...${NC}"

if check_port 7777; then
    echo -e "${YELLOW}⚠️  Port 7777 is already in use. Stopping existing service...${NC}"
    # Try to stop existing service
    kill $(lsof -ti:7777) 2>/dev/null || true
    sleep 2
fi

# Create logs directory
mkdir -p logs

echo -e "${CYAN}🧠 Starting Fifty First Minds on port 7777...${NC}"
node fifty-first-minds-search-engine.js > logs/fifty-first-minds.log 2>&1 &
FIFTY_FIRST_PID=$!
echo "Fifty First Minds PID: $FIFTY_FIRST_PID" >> .pids

# Wait for main service to be ready
sleep 3

if check_port 7777; then
    echo -e "${GREEN}✅ Fifty First Minds Search Engine started successfully!${NC}"
else
    echo -e "${RED}❌ Failed to start Fifty First Minds Search Engine${NC}"
    echo "Check logs/fifty-first-minds.log for details"
    exit 1
fi

# Display service status
echo -e "\n${PURPLE}📊 Service Status:${NC}"
echo "=================================="

services=(
    "7777:Fifty First Minds Search Engine"
    "3002:Template Processor"
    "9999:CAL-RIVEN-ASSISTANT"
    "8888:Domain Aggregator"
)

for service in "${services[@]}"; do
    IFS=':' read -r port name <<< "$service"
    if check_port $port; then
        echo -e "${GREEN}✅ $name - http://localhost:$port${NC}"
    else
        echo -e "${YELLOW}⚠️  $name - Not running on port $port${NC}"
    fi
done

# Open the dashboard
echo -e "\n${PURPLE}🌐 Opening Dashboard...${NC}"
echo "=================================="

# Copy dashboard to a web-accessible location
if command -v python3 &> /dev/null; then
    echo -e "${CYAN}🖥️  Starting local web server for dashboard...${NC}"
    
    # Start simple HTTP server for the dashboard
    python3 -m http.server 8080 > logs/dashboard-server.log 2>&1 &
    DASHBOARD_PID=$!
    echo "Dashboard Server PID: $DASHBOARD_PID" >> .pids
    
    sleep 2
    echo -e "${GREEN}✅ Dashboard available at: http://localhost:8080/fifty-first-minds-dashboard.html${NC}"
    
    # Try to open in default browser
    if command -v open &> /dev/null; then
        open "http://localhost:8080/fifty-first-minds-dashboard.html"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8080/fifty-first-minds-dashboard.html"
    fi
else
    echo -e "${CYAN}📂 Open fifty-first-minds-dashboard.html in your browser${NC}"
fi

# Display usage instructions
echo -e "\n${BLUE}📚 Usage Instructions:${NC}"
echo "================================================="
echo -e "${CYAN}1. Open Dashboard:${NC} http://localhost:8080/fifty-first-minds-dashboard.html"
echo -e "${CYAN}2. Enter Domain Idea:${NC} Describe your business concept"
echo -e "${CYAN}3. Get Analysis:${NC} AI will analyze and provide recommendations"
echo -e "${CYAN}4. Follow Next Steps:${NC} Implement using suggested templates"

echo -e "\n${BLUE}🔧 API Endpoints:${NC}"
echo "POST http://localhost:7777/analyze-domain - Analyze domain ideas"
echo "POST http://localhost:7777/suggest-domains - Get domain suggestions"
echo "POST http://localhost:7777/implementation-roadmap - Get roadmap"
echo "GET  http://localhost:7777/health - System health check"

echo -e "\n${BLUE}📋 Management Commands:${NC}"
echo "View logs: tail -f logs/fifty-first-minds.log"
echo "Stop all services: ./stop-fifty-first-minds.sh"
echo "Service status: curl http://localhost:7777/health"

echo -e "\n${GREEN}🎉 Fifty First Minds Domain Intelligence System is running!${NC}"
echo -e "${PURPLE}Transform your domain ideas into actionable plans${NC}"

# Keep track of main process
wait $FIFTY_FIRST_PID