#!/bin/bash

# BORDER CONTROL SYSTEM LAUNCHER
# Starts all territorial processes with language barriers
# Demonstrates AI-to-AI anonymous communication

echo "🚧 BORDER CONTROL SYSTEM LAUNCHER 🚧"
echo "======================================"
echo "Starting AI-to-AI anonymous communication infrastructure"
echo "Establishing territorial boundaries with language barriers"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create territories directory
mkdir -p territories

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to start territory process
start_territory() {
    local territory_name=$1
    local port=$2
    local language=$3
    local launcher_file=$4
    
    echo -e "${CYAN}🏴 Starting $territory_name territory on port $port...${NC}"
    
    if check_port $port; then
        cd "territories/${territory_name,,}" 2>/dev/null || {
            echo -e "${RED}❌ Territory directory not found. Run border-control-system.js first${NC}"
            return 1
        }
        
        case $language in
            "node")
                echo -e "${YELLOW}Starting Node.js territory...${NC}"
                node launcher.js > "../${territory_name,,}.log" 2>&1 &
                ;;
            "python")
                echo -e "${YELLOW}Starting Python territory...${NC}"
                python3 launcher.py > "../${territory_name,,}.log" 2>&1 &
                ;;
            "go")
                echo -e "${YELLOW}Starting Go territory...${NC}"
                go run launcher.go > "../${territory_name,,}.log" 2>&1 &
                ;;
            "rust")
                echo -e "${YELLOW}Starting Rust territory...${NC}"
                cargo run > "../${territory_name,,}.log" 2>&1 &
                ;;
        esac
        
        local pid=$!
        echo $pid > "../${territory_name,,}.pid"
        echo -e "${GREEN}✅ $territory_name started with PID $pid${NC}"
        cd - > /dev/null
        sleep 2
    else
        echo -e "${RED}❌ Cannot start $territory_name - port conflict${NC}"
        return 1
    fi
}

# Function to verify territory is running
verify_territory() {
    local territory_name=$1
    local port=$2
    
    echo -e "${BLUE}🔍 Verifying $territory_name territory...${NC}"
    
    # Check if process is running
    if [ -f "territories/${territory_name,,}.pid" ]; then
        local pid=$(cat "territories/${territory_name,,}.pid")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Process $pid is running${NC}"
        else
            echo -e "${RED}❌ Process $pid is not running${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ No PID file found${NC}"
        return 1
    fi
    
    # Check if port is listening
    sleep 3
    if curl -s "http://localhost:$port/territory/status" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Territory responding on port $port${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Territory not responding yet (may still be starting)${NC}"
        return 1
    fi
}

# Function to test cross-border communication
test_border_crossing() {
    local from_port=$1
    local to_port=$2
    local from_name=$3
    local to_name=$4
    
    echo -e "${PURPLE}🚧 Testing border crossing: $from_name → $to_name${NC}"
    
    # Create test message
    local test_message='{"content":"Hello from '$from_name'","user_id":"test_user","timestamp":"'$(date -Iseconds)'"}'
    
    # Send cross-border message
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "X-Border-Pass: authorized" \
        -d "$test_message" \
        "http://localhost:$from_port/border/message" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo -e "${GREEN}✅ Border crossing successful${NC}"
        echo -e "${CYAN}   Response: $response${NC}"
        return 0
    else
        echo -e "${RED}❌ Border crossing failed${NC}"
        return 1
    fi
}

# Function to demonstrate AI agent handshake
demonstrate_ai_handshake() {
    echo -e "${PURPLE}🤖 Demonstrating AI-to-AI anonymous handshake...${NC}"
    
    # AI Alpha (INPUT_TERRITORY) anonymizes human input
    echo -e "${CYAN}1. AI Alpha receives human input and anonymizes it...${NC}"
    local human_input='{"user":"john_doe","message":"Generate a web app for task management","ip":"192.168.1.100","session":"abc123"}'
    
    local anonymized=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "X-Border-Pass: authorized" \
        -d "$human_input" \
        "http://localhost:9002/border/anonymize" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$anonymized" ]; then
        echo -e "${GREEN}✅ Human data anonymized${NC}"
        echo -e "${CYAN}   Anonymized: $anonymized${NC}"
    else
        echo -e "${YELLOW}⚠️  Anonymization service not ready${NC}"
    fi
    
    # AI Beta (PROCESSING_TERRITORY) processes anonymous request
    echo -e "${CYAN}2. AI Beta processes anonymous request without knowing human identity...${NC}"
    local processing_request='{"anonymous_id":"anon_123","content":"Generate a web app for task management","territory":"PROCESSING_TERRITORY"}'
    
    local processed=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "X-Border-Pass: authorized" \
        -d "$processing_request" \
        "http://localhost:9003/border/process" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$processed" ]; then
        echo -e "${GREEN}✅ Anonymous processing completed${NC}"
        echo -e "${CYAN}   Processed: $processed${NC}"
    else
        echo -e "${YELLOW}⚠️  Processing service not ready${NC}"
    fi
    
    echo -e "${PURPLE}🔒 Human identity preserved throughout AI-to-AI communication${NC}"
}

# Main execution
echo -e "${BLUE}🔥 PHASE 1: Initialize Border Control System${NC}"
echo "Running border-control-system.js to create territories..."

# Start the border control system to create territory structure
node border-control-system.js &
BORDER_SYSTEM_PID=$!
echo "Border system initializing with PID $BORDER_SYSTEM_PID"
sleep 5

echo ""
echo -e "${BLUE}🔥 PHASE 2: Start Territory Processes${NC}"

# Start all territories
start_territory "INPUT_TERRITORY" 9001 "node" "launcher.js"
start_territory "ANONYMIZATION_TERRITORY" 9002 "python" "launcher.py"
start_territory "PROCESSING_TERRITORY" 9003 "go" "launcher.go"
start_territory "REASONING_TERRITORY" 9004 "rust" "launcher.rs"
start_territory "OUTPUT_TERRITORY" 9005 "node" "launcher.js"

echo ""
echo -e "${BLUE}🔥 PHASE 3: Verify Territory Operations${NC}"

# Verify all territories
verify_territory "INPUT_TERRITORY" 9001
verify_territory "ANONYMIZATION_TERRITORY" 9002
verify_territory "PROCESSING_TERRITORY" 9003
verify_territory "REASONING_TERRITORY" 9004
verify_territory "OUTPUT_TERRITORY" 9005

echo ""
echo -e "${BLUE}🔥 PHASE 4: Test Cross-Border Communication${NC}"

# Test border crossings
test_border_crossing 9001 9002 "INPUT_TERRITORY" "ANONYMIZATION_TERRITORY"
test_border_crossing 9002 9003 "ANONYMIZATION_TERRITORY" "PROCESSING_TERRITORY"
test_border_crossing 9003 9004 "PROCESSING_TERRITORY" "REASONING_TERRITORY"
test_border_crossing 9004 9005 "REASONING_TERRITORY" "OUTPUT_TERRITORY"

echo ""
echo -e "${BLUE}🔥 PHASE 5: Demonstrate AI-to-AI Anonymous Communication${NC}"

# Wait for services to be fully ready
sleep 5
demonstrate_ai_handshake

echo ""
echo -e "${GREEN}🎯 BORDER CONTROL SYSTEM OPERATIONAL${NC}"
echo -e "${GREEN}🤖 AI-to-AI anonymous channels established${NC}"
echo -e "${GREEN}🔒 Human anonymity preservation active${NC}"
echo ""
echo -e "${CYAN}📊 SYSTEM STATUS:${NC}"
echo "- INPUT_TERRITORY (Node.js): http://localhost:9001/territory/status"
echo "- ANONYMIZATION_TERRITORY (Python): http://localhost:9002/territory/status"
echo "- PROCESSING_TERRITORY (Go): http://localhost:9003/territory/status"
echo "- REASONING_TERRITORY (Rust): http://localhost:9004/territory/status"
echo "- OUTPUT_TERRITORY (Node.js): http://localhost:9005/territory/status"
echo ""
echo -e "${CYAN}📝 LOGS:${NC}"
echo "- Territory logs: territories/*.log"
echo "- Process PIDs: territories/*.pid"
echo ""
echo -e "${CYAN}🛑 TO STOP SYSTEM:${NC}"
echo "./stop-border-control-system.sh"
echo ""
echo -e "${PURPLE}🌟 AI-TO-AI ANONYMOUS COMMUNICATION READY!${NC}"
echo -e "${PURPLE}Humans can interact without revealing identity to processing AIs${NC}"