#!/bin/bash

# 🎯 START MARKET AUTOMATION SYSTEM
# 
# Unified startup script for the complete OSRS Market Statistics
# and Non-Developer Interface automation system
#
# This script integrates:
# - Automated Market Stats Engine
# - Market Data Collector 
# - AI Market Analyzer
# - Full Automation Pipeline
# - Non-Developer Web Interface
# - Document-to-MVP automation

echo "🎯 STARTING OSRS MARKET AUTOMATION SYSTEM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/Users/matthewmauer/Desktop/Document-Generator"
LOG_DIR="$PROJECT_DIR/logs/market-automation"
BACKUP_DIR="$PROJECT_DIR/backups/market-automation"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$PROJECT_DIR/data/market-automation"

echo -e "${BLUE}📁 Created directories${NC}"

# Function to check if service is running
check_service() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running on port $port${NC}"
        return 1
    fi
}

# Function to start service with logging
start_service() {
    local script=$1
    local service_name=$2
    local port=$3
    local log_file="$LOG_DIR/${service_name,,}-$(date +%Y%m%d-%H%M%S).log"
    
    echo -e "${YELLOW}🚀 Starting $service_name...${NC}"
    
    if [[ -f "$PROJECT_DIR/$script" ]]; then
        cd "$PROJECT_DIR"
        node "$script" > "$log_file" 2>&1 &
        local pid=$!
        
        # Wait a moment for service to start
        sleep 3
        
        if check_service $port "$service_name"; then
            echo -e "${GREEN}✅ $service_name started successfully (PID: $pid)${NC}"
            echo "$pid" > "$PROJECT_DIR/data/market-automation/${service_name,,}.pid"
            return 0
        else
            echo -e "${RED}❌ $service_name failed to start${NC}"
            echo -e "${YELLOW}📋 Log file: $log_file${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $script not found${NC}"
        return 1
    fi
}

# Function to create required directories and files
setup_environment() {
    echo -e "${BLUE}🔧 Setting up environment...${NC}"
    
    # Create data directories
    mkdir -p "$PROJECT_DIR/generated-strategies"
    mkdir -p "$PROJECT_DIR/generated-reports"
    mkdir -p "$PROJECT_DIR/uploads"
    mkdir -p "$PROJECT_DIR/documents"
    
    # Create example configuration if it doesn't exist
    if [[ ! -f "$PROJECT_DIR/.env.market" ]]; then
        cat > "$PROJECT_DIR/.env.market" << EOF
# OSRS Market Automation Configuration
PORT_MARKET_ENGINE=7000
PORT_MARKET_DATA=8889
PORT_AUTOMATION_PIPELINE=9999
PORT_OSRS_PLATFORM=8888

# AI Services (Optional - will use local Ollama if available)
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Database (Optional - will use SQLite if not specified)
# DATABASE_URL=postgresql://user:pass@localhost/market_db
# REDIS_URL=redis://localhost:6379

# Market Data Sources
GRAND_EXCHANGE_API=https://prices.runescape.wiki/api/v1/osrs/latest
OSRS_WIKI_API=https://oldschool.runescape.wiki/api.php

# Logging
LOG_LEVEL=info
LOG_FILE=$LOG_DIR/market-automation.log
EOF
        echo -e "${GREEN}✅ Created .env.market configuration${NC}"
    fi
    
    # Load environment
    if [[ -f "$PROJECT_DIR/.env.market" ]]; then
        source "$PROJECT_DIR/.env.market"
        echo -e "${GREEN}✅ Loaded environment configuration${NC}"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        node_version=$(node --version)
        echo -e "${GREEN}✅ Node.js: $node_version${NC}"
    else
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check npm packages
    if [[ -f "$PROJECT_DIR/package.json" ]]; then
        cd "$PROJECT_DIR"
        if [[ ! -d "node_modules" ]]; then
            echo -e "${YELLOW}📦 Installing npm packages...${NC}"
            npm install
        fi
        echo -e "${GREEN}✅ NPM packages ready${NC}"
    fi
    
    # Check for Ollama (optional)
    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✅ Ollama available for local AI${NC}"
        
        # Check if models are pulled
        if ollama list | grep -q mistral; then
            echo -e "${GREEN}✅ Mistral model ready${NC}"
        else
            echo -e "${YELLOW}📥 Pulling Mistral model...${NC}"
            ollama pull mistral &
        fi
    else
        echo -e "${YELLOW}⚠️ Ollama not found - will use cloud AI services if configured${NC}"
    fi
    
    # Check for Redis (optional)
    if command -v redis-cli &> /dev/null && redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis available for caching${NC}"
    else
        echo -e "${YELLOW}⚠️ Redis not available - will use in-memory caching${NC}"
    fi
}

# Function to start all services
start_all_services() {
    echo -e "${PURPLE}🚀 Starting all market automation services...${NC}"
    
    # Start Full Automation Pipeline first (other services depend on it)
    start_service "full-automation-pipeline.js" "Automation-Pipeline" 9999
    
    # Start OSRS Merchanting Platform
    start_service "osrs-merchanting-platform.js" "OSRS-Platform" 8888
    
    # Start Market Data Collector
    start_service "market-data-collector.js" "Market-Data-Collector" 8889
    
    # Start AI Market Analyzer (runs as service, no dedicated port)
    echo -e "${YELLOW}🚀 Starting AI Market Analyzer...${NC}"
    cd "$PROJECT_DIR"
    node ai-market-analyzer.js > "$LOG_DIR/ai-market-analyzer-$(date +%Y%m%d-%H%M%S).log" 2>&1 &
    ai_pid=$!
    echo "$ai_pid" > "$PROJECT_DIR/data/market-automation/ai-market-analyzer.pid"
    echo -e "${GREEN}✅ AI Market Analyzer started (PID: $ai_pid)${NC}"
    
    # Start main Market Stats Engine
    start_service "automated-market-stats-engine.js" "Market-Stats-Engine" 7000
    
    # Wait for all services to be ready
    echo -e "${BLUE}⏳ Waiting for services to initialize...${NC}"
    sleep 10
}

# Function to show service status
show_status() {
    echo -e "${CYAN}📊 SERVICE STATUS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    check_service 7000 "Market Stats Engine"
    check_service 7001 "Market Stats WebSocket"
    check_service 8888 "OSRS Merchanting Platform" 
    check_service 8889 "Market Data Collector"
    check_service 9999 "Full Automation Pipeline"
    
    echo ""
    echo -e "${CYAN}🌐 WEB INTERFACES${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}📊 Market Analysis Dashboard:${NC} http://localhost:7000"
    echo -e "${GREEN}🎮 OSRS Platform:${NC} http://localhost:8888"
    echo -e "${GREEN}🔄 Automation Pipeline:${NC} http://localhost:9999"
    echo -e "${GREEN}📡 Real-time Updates:${NC} ws://localhost:7001"
    
    echo ""
    echo -e "${CYAN}📋 QUICK ACTIONS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}• Configure Strategy:${NC} Go to http://localhost:7000 and describe your goals"
    echo -e "${YELLOW}• Upload Document:${NC} Drop a business plan at http://localhost:9999"
    echo -e "${YELLOW}• View Opportunities:${NC} Check http://localhost:7000/opportunities"
    echo -e "${YELLOW}• Monitor Logs:${NC} tail -f $LOG_DIR/*.log"
}

# Function to run system test
run_system_test() {
    echo -e "${BLUE}🧪 Running system integration test...${NC}"
    
    # Test Market Stats Engine
    if curl -s http://localhost:7000/status | grep -q "ACTIVE"; then
        echo -e "${GREEN}✅ Market Stats Engine API responding${NC}"
    else
        echo -e "${RED}❌ Market Stats Engine not responding${NC}"
    fi
    
    # Test configuration endpoint
    test_config='{
        "userInput": "I want to flip items with 10-50k profit margins",
        "userId": "test_user"
    }'
    
    if curl -s -X POST -H "Content-Type: application/json" -d "$test_config" http://localhost:7000/configure | grep -q "success"; then
        echo -e "${GREEN}✅ Natural language configuration working${NC}"
    else
        echo -e "${YELLOW}⚠️ Configuration test inconclusive${NC}"
    fi
    
    # Test automation pipeline
    if curl -s http://localhost:9999/status | grep -q "ACTIVE"; then
        echo -e "${GREEN}✅ Full Automation Pipeline responding${NC}"
    else
        echo -e "${RED}❌ Automation Pipeline not responding${NC}"
    fi
}

# Function to create example configuration
create_example_config() {
    echo -e "${BLUE}📝 Creating example configuration...${NC}"
    
    cat > "$PROJECT_DIR/example-market-config.md" << 'EOF'
# Example OSRS Market Configuration

## Simple Natural Language Examples

### For Beginners
"I'm new to OSRS trading and want to start with safe, small profit flips under 100k investment"

### For Intermediate Traders  
"I have 5M GP to invest and want to focus on consumables with 15-30% profit margins"

### For Advanced Traders
"I'm looking for high-volume arbitrage opportunities in the 1-10M range with social media confirmation"

### For Specific Items
"Alert me when Dragon bones drop below 2000 GP or when Barrows items show unusual volume"

### For Risk Management
"Only show me opportunities with medium or low risk and at least 80% confidence"

## Generated Strategy Examples

The system will automatically:
1. Parse your natural language input
2. Create a trading strategy document
3. Generate a working dashboard
4. Deploy as a live web application
5. Start monitoring and alerting

## Next Steps

1. Visit http://localhost:7000
2. Describe your trading goals in plain English  
3. Click "Set Up My Market Analyzer"
4. Your custom dashboard will be generated automatically!

EOF

    echo -e "${GREEN}✅ Created example-market-config.md${NC}"
}

# Function to stop all services
stop_services() {
    echo -e "${RED}🛑 Stopping all market automation services...${NC}"
    
    # Kill services by PID files
    for pid_file in "$PROJECT_DIR/data/market-automation"/*.pid; do
        if [[ -f "$pid_file" ]]; then
            pid=$(cat "$pid_file")
            service_name=$(basename "$pid_file" .pid)
            
            if kill "$pid" 2>/dev/null; then
                echo -e "${YELLOW}🛑 Stopped $service_name (PID: $pid)${NC}"
            fi
            
            rm -f "$pid_file"
        fi
    done
    
    # Kill by port (backup method)
    for port in 7000 7001 8888 8889 9999; do
        pid=$(lsof -ti:$port)
        if [[ -n "$pid" ]]; then
            kill "$pid" 2>/dev/null
            echo -e "${YELLOW}🛑 Stopped service on port $port${NC}"
        fi
    done
}

# Function to show help
show_help() {
    echo -e "${CYAN}🎯 OSRS Market Automation System${NC}"
    echo ""
    echo "Usage: ./start-market-automation.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all market automation services (default)"
    echo "  stop      Stop all running services"
    echo "  restart   Stop and start all services"  
    echo "  status    Show status of all services"
    echo "  test      Run system integration test"
    echo "  setup     Setup environment and dependencies"
    echo "  logs      Show recent logs from all services"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./start-market-automation.sh           # Start everything"
    echo "  ./start-market-automation.sh status    # Check service status"
    echo "  ./start-market-automation.sh logs      # View logs"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Recent logs from all services:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    for log_file in "$LOG_DIR"/*.log; do
        if [[ -f "$log_file" ]]; then
            echo -e "${YELLOW}$(basename "$log_file"):${NC}"
            tail -n 5 "$log_file"
            echo ""
        fi
    done
}

# Main execution
main() {
    local command=${1:-start}
    
    case $command in
        "start")
            setup_environment
            check_prerequisites
            start_all_services
            show_status
            create_example_config
            
            echo ""
            echo -e "${GREEN}🎉 OSRS Market Automation System is now running!${NC}"
            echo -e "${CYAN}📖 Check example-market-config.md for usage examples${NC}"
            echo -e "${CYAN}🌐 Visit http://localhost:7000 to get started${NC}"
            ;;
            
        "stop")
            stop_services
            echo -e "${GREEN}✅ All services stopped${NC}"
            ;;
            
        "restart")
            stop_services
            sleep 2
            setup_environment
            check_prerequisites
            start_all_services
            show_status
            ;;
            
        "status")
            show_status
            ;;
            
        "test")
            run_system_test
            ;;
            
        "setup")
            setup_environment
            check_prerequisites
            echo -e "${GREEN}✅ Environment setup complete${NC}"
            ;;
            
        "logs")
            show_logs
            ;;
            
        "help"|"--help"|"-h")
            show_help
            ;;
            
        *)
            echo -e "${RED}❌ Unknown command: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}🛑 Shutting down...${NC}"; stop_services; exit 0' INT

# Run main function with all arguments
main "$@"