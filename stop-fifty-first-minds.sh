#!/bin/bash

# 🧠 FIFTY FIRST MINDS SHUTDOWN SCRIPT
# Stop all related services safely

echo "🛑 Stopping Fifty First Minds Domain Intelligence System..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop service by port
stop_by_port() {
    local port=$1
    local name=$2
    
    echo -e "${YELLOW}🔍 Checking for service on port $port ($name)...${NC}"
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${BLUE}🛑 Stopping $name on port $port...${NC}"
        kill $(lsof -ti:$port) 2>/dev/null || true
        sleep 2
        
        # Check if still running
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${RED}⚠️  Force killing $name on port $port...${NC}"
            kill -9 $(lsof -ti:$port) 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ $name stopped${NC}"
    else
        echo -e "${GREEN}✅ $name already stopped${NC}"
    fi
}

# Stop services by port
stop_by_port 7777 "Fifty First Minds Search Engine"
stop_by_port 3002 "Template Processor"  
stop_by_port 9999 "CAL-RIVEN-ASSISTANT"
stop_by_port 8888 "Domain Aggregator"
stop_by_port 8080 "Dashboard Server"

# Stop processes from PID file if it exists
if [ -f ".pids" ]; then
    echo -e "\n${BLUE}🔍 Stopping tracked processes...${NC}"
    
    while read -r line; do
        if [[ $line == *"PID:"* ]]; then
            pid=$(echo $line | awk '{print $NF}')
            service=$(echo $line | awk '{print $1,$2}')
            
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${BLUE}🛑 Stopping $service (PID: $pid)...${NC}"
                kill $pid 2>/dev/null || true
                
                # Wait a moment and force kill if needed
                sleep 1
                if ps -p $pid > /dev/null 2>&1; then
                    kill -9 $pid 2>/dev/null || true
                fi
            fi
        fi
    done < .pids
    
    # Clean up PID file
    rm .pids
    echo -e "${GREEN}✅ PID file cleaned up${NC}"
fi

# Stop any remaining Node.js processes that might be related
echo -e "\n${YELLOW}🔍 Checking for remaining related processes...${NC}"

# Look for our specific scripts
pkill -f "fifty-first-minds-search-engine.js" 2>/dev/null || true
pkill -f "template-processor" 2>/dev/null || true
pkill -f "cal-riven-assistant.js" 2>/dev/null || true
pkill -f "CAL-DOMAIN-AGGREGATOR.js" 2>/dev/null || true

# Clean up log files if they exist
echo -e "\n${BLUE}🧹 Cleaning up log files...${NC}"
if [ -d "logs" ]; then
    ls logs/ 2>/dev/null | while read -r logfile; do
        if [[ $logfile == *"fifty-first"* ]] || [[ $logfile == *"template"* ]] || [[ $logfile == *"cal"* ]]; then
            echo -e "${CYAN}📄 Archived: logs/$logfile${NC}"
        fi
    done
fi

# Final port check
echo -e "\n${BLUE}🔍 Final port verification:${NC}"
ports=(7777 3002 9999 8888 8080)

for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port still in use${NC}"
    else
        echo -e "${GREEN}✅ Port $port is free${NC}"
    fi
done

echo -e "\n${GREEN}🎉 Fifty First Minds Domain Intelligence System shutdown complete!${NC}"
echo -e "${BLUE}💡 To restart: ./launch-fifty-first-minds.sh${NC}"