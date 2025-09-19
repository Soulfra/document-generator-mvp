#!/bin/bash

# 🚀 LAUNCH COMPLETE CAL MONITORING SYSTEM
# 
# This script launches the complete Cal system monitoring infrastructure
# with all components integrated and running

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}=================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}=================================${NC}"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    print_success "Node.js is available: $(node --version)"
}

# Check if required packages are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if package.json exists, if not create basic one
    if [ ! -f "package.json" ]; then
        print_warning "package.json not found, creating basic one..."
        cat > package.json << EOL
{
  "name": "cal-monitoring-system",
  "version": "1.0.0",
  "description": "Complete Cal System Monitoring and Visibility",
  "main": "CAL-UNIFIED-MONITORING-SYSTEM.js",
  "scripts": {
    "start": "node CAL-UNIFIED-MONITORING-SYSTEM.js",
    "demo": "AUTO_DEMO=true node CAL-UNIFIED-MONITORING-SYSTEM.js",
    "dashboard": "node CAL-LIVE-MONITOR-DASHBOARD.js",
    "market-hub": "node CROSS-MARKET-DATA-HUB.js",
    "tracer": "node CAL-SYSTEM-TRACER.js",
    "reports": "node CAL-REPORT-GENERATOR.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "ws": "^8.14.0",
    "sqlite3": "^5.1.6",
    "pdfkit": "^0.13.0",
    "nodemailer": "^6.9.7",
    "node-cron": "^3.0.3"
  },
  "keywords": ["monitoring", "cal-system", "dashboard", "reporting"],
  "author": "Cal Team",
  "license": "MIT"
}
EOL
        print_success "Created package.json"
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating required directories..."
    
    mkdir -p trace_logs
    mkdir -p reports/{daily,weekly,monthly}
    mkdir -p librarian_databases
    mkdir -p market_data
    
    print_success "Directories created"
}

# Check if ports are available
check_ports() {
    print_status "Checking port availability..."
    
    PORTS=(9300 9301 11434)
    for port in "${PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            print_warning "Port $port is already in use"
        else
            print_success "Port $port is available"
        fi
    done
}

# Show system information
show_system_info() {
    print_header "SYSTEM INFORMATION"
    echo -e "${CYAN}Operating System:${NC} $(uname -s)"
    echo -e "${CYAN}Architecture:${NC} $(uname -m)"
    echo -e "${CYAN}Node.js Version:${NC} $(node --version)"
    echo -e "${CYAN}NPM Version:${NC} $(npm --version)"
    echo -e "${CYAN}Current Directory:${NC} $(pwd)"
    echo -e "${CYAN}Available Memory:${NC} $(free -h 2>/dev/null | grep '^Mem:' | awk '{print $7}' || echo 'N/A')"
    echo ""
}

# Launch the monitoring system
launch_monitoring_system() {
    print_header "LAUNCHING CAL UNIFIED MONITORING SYSTEM"
    
    print_status "Starting all monitoring components..."
    echo ""
    
    # Set environment variables for demo mode
    export AUTO_DEMO=true
    export NODE_ENV=development
    export LOG_LEVEL=info
    
    # Launch the unified system
    print_status "🚀 Starting Cal Unified Monitoring System..."
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    CAL SYSTEM MONITORING LAUNCH                       ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🔍 Live Dashboard:${NC}     http://localhost:9300"
    echo -e "${CYAN}🔌 WebSocket Monitor:${NC}  ws://localhost:9301"
    echo -e "${CYAN}📊 System Metrics:${NC}    Available via API"
    echo -e "${CYAN}🌐 Market Data:${NC}       Cross-market integration active"
    echo -e "${CYAN}📋 Event Tracing:${NC}     Complete system visibility"
    echo -e "${CYAN}📄 Auto Reports:${NC}      Daily/Weekly/Monthly generation"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the system${NC}"
    echo ""
    
    # Start the main system
    node CAL-UNIFIED-MONITORING-SYSTEM.js
}

# Show usage instructions
show_usage() {
    print_header "CAL MONITORING SYSTEM USAGE"
    echo ""
    echo -e "${CYAN}Available Commands:${NC}"
    echo -e "  ${GREEN}./LAUNCH-COMPLETE-MONITORING.sh${NC}           - Launch complete system"
    echo -e "  ${GREEN}npm run demo${NC}                              - Launch with demo data"
    echo -e "  ${GREEN}npm run dashboard${NC}                         - Launch dashboard only"
    echo -e "  ${GREEN}npm run market-hub${NC}                        - Launch market hub only"
    echo -e "  ${GREEN}npm run tracer${NC}                            - Launch tracer only"
    echo -e "  ${GREEN}npm run reports${NC}                           - Launch report generator only"
    echo ""
    echo -e "${CYAN}System Endpoints:${NC}"
    echo -e "  ${GREEN}Dashboard:${NC}      http://localhost:9300"
    echo -e "  ${GREEN}WebSocket:${NC}      ws://localhost:9301"
    echo -e "  ${GREEN}API Status:${NC}     http://localhost:9300/api/performance"
    echo -e "  ${GREEN}Market Data:${NC}    http://localhost:9300/api/market"
    echo ""
    echo -e "${CYAN}Log Files:${NC}"
    echo -e "  ${GREEN}Event Traces:${NC}   ./trace_logs/"
    echo -e "  ${GREEN}Reports:${NC}        ./reports/"
    echo -e "  ${GREEN}Databases:${NC}      ./librarian_databases/"
    echo ""
    echo -e "${CYAN}Environment Variables:${NC}"
    echo -e "  ${GREEN}AUTO_DEMO=true${NC}                           - Enable demo mode"
    echo -e "  ${GREEN}SMTP_USER=your@email.com${NC}                - Email reports"
    echo -e "  ${GREEN}ALPHA_VANTAGE_KEY=your_key${NC}               - Stock market data"
    echo ""
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill any running processes
    pkill -f "CAL-.*\.js" 2>/dev/null || true
    
    print_success "Cleanup complete"
}

# Main execution
main() {
    # Handle command line arguments
    case "${1:-launch}" in
        "help"|"-h"|"--help")
            show_usage
            exit 0
            ;;
        "clean"|"cleanup")
            cleanup
            exit 0
            ;;
        "launch"|"")
            # Default launch behavior
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
    
    # Show header
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║        🔍 CAL COMPLETE MONITORING SYSTEM LAUNCHER 🔍                ║"
    echo "║                                                                      ║"
    echo "║  🚀 Complete System Visibility                                      ║"
    echo "║  📊 Real-time Monitoring Dashboard                                  ║"
    echo "║  🌐 Cross-market Data Integration                                   ║"
    echo "║  📋 Full Event Tracing & Logging                                   ║"
    echo "║  📄 Automated PDF Reports & Email                                  ║"
    echo "║  💰 Cost Tracking & Optimization                                   ║"
    echo "║  🔔 Real-time Alerts & Notifications                               ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    # Run pre-flight checks
    print_status "Running pre-flight checks..."
    check_node
    check_dependencies
    create_directories
    check_ports
    show_system_info
    
    # Launch the system
    launch_monitoring_system
}

# Handle script interruption
trap cleanup EXIT INT TERM

# Run main function
main "$@"