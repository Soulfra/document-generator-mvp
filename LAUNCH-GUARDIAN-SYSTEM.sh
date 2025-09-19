#!/bin/bash

# 🛡️ LAUNCH COMPLETE CAL GUARDIAN SYSTEM
# 
# This script launches the complete Guardian Approval System with:
# - Human-in-the-loop verification
# - Multi-channel notifications (Twilio, email, webhooks)
# - Multi-source price verification 
# - Cost optimization and budget management
# - Real-time monitoring and reporting
# - Human verification interface

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
  "name": "cal-guardian-system",
  "version": "1.0.0",
  "description": "Complete Cal Guardian System with Human-in-the-Loop Verification",
  "main": "CAL-GUARDIAN-APPROVAL-SYSTEM.js",
  "scripts": {
    "start": "node CAL-GUARDIAN-APPROVAL-SYSTEM.js",
    "guardian": "node CAL-GUARDIAN-APPROVAL-SYSTEM.js",
    "notifications": "node CAL-NOTIFICATION-HUB.js",
    "pricing": "node CAL-PRICING-GUARDIAN.js",
    "optimizer": "node CAL-COST-OPTIMIZER.js",
    "interface": "python3 -m http.server 9400",
    "monitoring": "node CAL-UNIFIED-MONITORING-SYSTEM.js",
    "test-all": "npm run guardian & npm run notifications & npm run pricing & npm run optimizer"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "nodemailer": "^6.9.7",
    "twilio": "^4.19.0",
    "ws": "^8.14.0",
    "sqlite3": "^5.1.6",
    "pdfkit": "^0.13.0",
    "node-cron": "^3.0.3"
  },
  "keywords": ["guardian", "approval", "verification", "pricing", "cost-optimization"],
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
    mkdir -p approval_history
    mkdir -p price_verification_cache
    
    print_success "Directories created"
}

# Check environment variables
check_environment() {
    print_status "Checking environment configuration..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning "Creating .env template file..."
        cat > .env << EOL
# Guardian System Configuration
GUARDIAN_PHONE=+1234567890
GUARDIAN_EMAIL=guardian@example.com
GUARDIAN_PHONE_2=+1234567891

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Cal Guardian System <noreply@calsystem.com>
FINANCE_EMAIL=finance@example.com

# Webhook Configuration
INBOX_WEBHOOK=https://your-inbox-webhook.com/endpoint
INBOX_TOKEN=your_inbox_token
OOFBOX_WEBHOOK=https://your-oofbox-webhook.com/endpoint
OOFBOX_API_KEY=your_oofbox_api_key
NICELEAK_WEBHOOK=https://your-niceleak-webhook.com/endpoint
NICELEAK_USER=your_username
NICELEAK_PASS=your_password

# Slack/Discord Integration
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK

# API Keys for Price Verification
ALPHA_VANTAGE_KEY=your_alpha_vantage_key
COINMARKETCAP_API_KEY=your_coinmarketcap_key
IEX_API_KEY=your_iex_key

# System Configuration
LOG_LEVEL=info
NODE_ENV=development
AUTO_DEMO=false
DAILY_BUDGET=20.00
WEEKLY_BUDGET=120.00
MONTHLY_BUDGET=450.00
EOL
        print_success "Created .env template - please configure your API keys"
        print_warning "Update .env file with your actual credentials before starting the system"
    else
        print_success "Environment file exists"
    fi
}

# Check if ports are available
check_ports() {
    print_status "Checking port availability..."
    
    PORTS=(9300 9301 9400 9500 9501)
    for port in "${PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
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

# Launch the complete Guardian system
launch_guardian_system() {
    print_header "LAUNCHING CAL GUARDIAN SYSTEM"
    
    print_status "Starting all Guardian components..."
    echo ""
    
    # Set environment variables for the session
    export NODE_ENV=development
    export LOG_LEVEL=info
    
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🛡️ CAL GUARDIAN SYSTEM LAUNCH 🛡️                   ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🛡️ Guardian Approval System:${NC}    Starting main approval workflow"
    echo -e "${CYAN}📡 Notification Hub:${NC}            Multi-channel notifications active"
    echo -e "${CYAN}🎯 Pricing Guardian:${NC}           Multi-source price verification"
    echo -e "${CYAN}💰 Cost Optimizer:${NC}             Budget management and optimization"
    echo -e "${CYAN}🖥️ Human Interface:${NC}            http://localhost:9400"
    echo -e "${CYAN}📊 System Monitor:${NC}             http://localhost:9300"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
    
    # Function to handle cleanup
    cleanup() {
        echo ""
        print_status "Shutting down all Guardian services..."
        
        # Kill all background processes
        jobs -p | xargs -r kill 2>/dev/null || true
        
        # Kill specific Guardian processes
        pkill -f "CAL-GUARDIAN" 2>/dev/null || true
        pkill -f "CAL-NOTIFICATION" 2>/dev/null || true
        pkill -f "CAL-PRICING" 2>/dev/null || true
        pkill -f "CAL-COST" 2>/dev/null || true
        
        print_success "Guardian system shutdown complete"
        exit 0
    }
    
    # Set trap for cleanup
    trap cleanup EXIT INT TERM
    
    # Start all Guardian components in background
    print_status "🛡️ Starting Guardian Approval System..."
    node CAL-GUARDIAN-APPROVAL-SYSTEM.js &
    GUARDIAN_PID=$!
    
    sleep 2
    
    print_status "📡 Starting Notification Hub..."
    node CAL-NOTIFICATION-HUB.js &
    NOTIFICATION_PID=$!
    
    sleep 2
    
    print_status "🎯 Starting Pricing Guardian..."
    node CAL-PRICING-GUARDIAN.js &
    PRICING_PID=$!
    
    sleep 2
    
    print_status "💰 Starting Cost Optimizer..."
    node CAL-COST-OPTIMIZER.js &
    OPTIMIZER_PID=$!
    
    sleep 2
    
    print_status "📊 Starting Monitoring System..."
    node CAL-UNIFIED-MONITORING-SYSTEM.js &
    MONITOR_PID=$!
    
    sleep 3
    
    print_status "🖥️ Starting Human Verification Interface..."
    # Start simple HTTP server for the interface
    if command -v python3 &> /dev/null; then
        cd "$(dirname "$0")"
        python3 -m http.server 9400 --bind 0.0.0.0 > /dev/null 2>&1 &
        INTERFACE_PID=$!
        cd - > /dev/null
        print_success "Human interface available at: http://localhost:9400/CAL-HUMAN-VERIFICATION-INTERFACE.html"
    else
        print_warning "Python3 not available, human interface not started"
    fi
    
    sleep 3
    
    print_success "🎉 All Guardian components are now running!"
    echo ""
    print_header "GUARDIAN SYSTEM ENDPOINTS"
    echo ""
    echo -e "${GREEN}🖥️ Human Verification Interface:${NC}"
    echo -e "   http://localhost:9400/CAL-HUMAN-VERIFICATION-INTERFACE.html"
    echo ""
    echo -e "${GREEN}📊 System Monitoring Dashboard:${NC}"
    echo -e "   http://localhost:9300"
    echo ""
    echo -e "${GREEN}🔌 WebSocket Monitor:${NC}"
    echo -e "   ws://localhost:9301"
    echo ""
    echo -e "${GREEN}💰 Cost & Budget Tracking:${NC}"
    echo -e "   Available via API endpoints"
    echo ""
    echo -e "${GREEN}🎯 Price Verification:${NC}"
    echo -e "   Multi-source verification active"
    echo ""
    echo -e "${GREEN}📡 Notification Channels:${NC}"
    echo -e "   SMS, Email, Webhooks (inbox, oofbox, niceleak)"
    echo ""
    print_header "SYSTEM CAPABILITIES"
    echo ""
    echo -e "${CYAN}✅ Human-in-the-loop verification${NC}"
    echo -e "${CYAN}✅ Multi-channel notifications (SMS, email, webhooks)${NC}"
    echo -e "${CYAN}✅ Multi-source price verification${NC}"
    echo -e "${CYAN}✅ Intelligent cost optimization${NC}"
    echo -e "${CYAN}✅ Real-time budget tracking and alerts${NC}"
    echo -e "${CYAN}✅ Automated approval workflows${NC}"
    echo -e "${CYAN}✅ Price correction and manual override${NC}"
    echo -e "${CYAN}✅ Complete audit trail and reporting${NC}"
    echo -e "${CYAN}✅ Emergency budget management${NC}"
    echo -e "${CYAN}✅ Timeout handling and fallbacks${NC}"
    echo ""
    print_status "🛡️ Guardian system is protecting your pricing accuracy!"
    echo ""
    
    # Wait for all background processes
    wait
}

# Show usage instructions
show_usage() {
    print_header "CAL GUARDIAN SYSTEM USAGE"
    echo ""
    echo -e "${CYAN}Available Commands:${NC}"
    echo -e "  ${GREEN}./LAUNCH-GUARDIAN-SYSTEM.sh${NC}               - Launch complete Guardian system"
    echo -e "  ${GREEN}./LAUNCH-GUARDIAN-SYSTEM.sh test${NC}          - Run Guardian system tests"
    echo -e "  ${GREEN}./LAUNCH-GUARDIAN-SYSTEM.sh status${NC}        - Show system status"
    echo -e "  ${GREEN}./LAUNCH-GUARDIAN-SYSTEM.sh stop${NC}          - Stop all Guardian services"
    echo -e "  ${GREEN}./LAUNCH-GUARDIAN-SYSTEM.sh clean${NC}         - Clean logs and temp files"
    echo ""
    echo -e "${CYAN}System Components:${NC}"
    echo -e "  ${GREEN}Guardian Approval System:${NC}    Core approval workflow engine"
    echo -e "  ${GREEN}Notification Hub:${NC}            Multi-channel notification delivery"
    echo -e "  ${GREEN}Pricing Guardian:${NC}            Multi-source price verification"
    echo -e "  ${GREEN}Cost Optimizer:${NC}              Budget management and cost optimization"
    echo -e "  ${GREEN}Human Interface:${NC}             Web-based verification interface"
    echo -e "  ${GREEN}Monitoring System:${NC}           Real-time system monitoring"
    echo ""
    echo -e "${CYAN}Key Features:${NC}"
    echo -e "  ${GREEN}📱 SMS Notifications:${NC}        Instant alerts via Twilio"
    echo -e "  ${GREEN}📧 Email Notifications:${NC}      HTML email with approval links"
    echo -e "  ${GREEN}🔗 Webhook Integration:${NC}      inbox, oofbox, niceleak support"
    echo -e "  ${GREEN}🎯 Price Verification:${NC}       Multiple API sources for accuracy"
    echo -e "  ${GREEN}💰 Cost Management:${NC}          Budget tracking and optimization"
    echo -e "  ${GREEN}🛡️ Human Verification:${NC}       Web interface for manual approval"
    echo ""
    echo -e "${CYAN}Environment Configuration:${NC}"
    echo -e "  ${GREEN}Configure .env file:${NC}         Set API keys and notification settings"
    echo -e "  ${GREEN}Twilio SMS:${NC}                  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN"
    echo -e "  ${GREEN}Email SMTP:${NC}                  SMTP_USER, SMTP_PASS"
    echo -e "  ${GREEN}Webhook URLs:${NC}                INBOX_WEBHOOK, OOFBOX_WEBHOOK, NICELEAK_WEBHOOK"
    echo -e "  ${GREEN}API Keys:${NC}                    ALPHA_VANTAGE_KEY, COINMARKETCAP_API_KEY"
    echo ""
}

# Test Guardian system
test_guardian_system() {
    print_header "TESTING GUARDIAN SYSTEM"
    
    print_status "Running Guardian system tests..."
    
    # Test each component
    echo ""
    print_status "Testing Guardian Approval System..."
    timeout 10 node CAL-GUARDIAN-APPROVAL-SYSTEM.js &
    sleep 3
    
    print_status "Testing Notification Hub..."
    timeout 10 node CAL-NOTIFICATION-HUB.js &
    sleep 3
    
    print_status "Testing Pricing Guardian..."
    timeout 10 node CAL-PRICING-GUARDIAN.js &
    sleep 3
    
    print_status "Testing Cost Optimizer..."
    timeout 10 node CAL-COST-OPTIMIZER.js &
    sleep 3
    
    # Wait for tests to complete
    wait
    
    print_success "Guardian system tests completed!"
}

# Show system status
show_status() {
    print_header "GUARDIAN SYSTEM STATUS"
    
    echo -e "${CYAN}Process Status:${NC}"
    
    # Check Guardian processes
    if pgrep -f "CAL-GUARDIAN" > /dev/null; then
        print_success "Guardian Approval System: RUNNING"
    else
        print_warning "Guardian Approval System: STOPPED"
    fi
    
    if pgrep -f "CAL-NOTIFICATION" > /dev/null; then
        print_success "Notification Hub: RUNNING"
    else
        print_warning "Notification Hub: STOPPED"
    fi
    
    if pgrep -f "CAL-PRICING" > /dev/null; then
        print_success "Pricing Guardian: RUNNING"
    else
        print_warning "Pricing Guardian: STOPPED"
    fi
    
    if pgrep -f "CAL-COST" > /dev/null; then
        print_success "Cost Optimizer: RUNNING"
    else
        print_warning "Cost Optimizer: STOPPED"
    fi
    
    echo ""
    echo -e "${CYAN}Port Status:${NC}"
    PORTS=(9300 9301 9400 9500 9501)
    for port in "${PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_success "Port $port: IN USE"
        else
            print_warning "Port $port: FREE"
        fi
    done
    
    echo ""
    echo -e "${CYAN}System Resources:${NC}"
    echo -e "  CPU Usage: $(top -l1 | grep "CPU usage" | awk '{print $3}' || echo 'N/A')"
    echo -e "  Memory Usage: $(free -h 2>/dev/null | grep '^Mem:' | awk '{print $3"/"$2}' || echo 'N/A')"
    echo -e "  Disk Usage: $(df -h . | tail -1 | awk '{print $3"/"$2" ("$5")"}')"
}

# Stop all Guardian services
stop_guardian_system() {
    print_header "STOPPING GUARDIAN SYSTEM"
    
    print_status "Stopping all Guardian services..."
    
    # Kill Guardian processes
    pkill -f "CAL-GUARDIAN" 2>/dev/null || true
    pkill -f "CAL-NOTIFICATION" 2>/dev/null || true
    pkill -f "CAL-PRICING" 2>/dev/null || true
    pkill -f "CAL-COST" 2>/dev/null || true
    pkill -f "python3 -m http.server 9400" 2>/dev/null || true
    
    sleep 2
    
    print_success "All Guardian services stopped"
}

# Clean logs and temporary files
clean_system() {
    print_header "CLEANING GUARDIAN SYSTEM"
    
    print_status "Cleaning logs and temporary files..."
    
    # Clean log directories
    rm -rf trace_logs/*.log 2>/dev/null || true
    rm -rf approval_history/*.tmp 2>/dev/null || true
    rm -rf price_verification_cache/*.cache 2>/dev/null || true
    
    # Clean old reports (keep recent ones)
    find reports/ -name "*.pdf" -mtime +30 -delete 2>/dev/null || true
    
    print_success "System cleanup completed"
}

# Main execution
main() {
    # Handle command line arguments
    case "${1:-launch}" in
        "help"|"-h"|"--help")
            show_usage
            exit 0
            ;;
        "test"|"tests")
            test_guardian_system
            exit 0
            ;;
        "status")
            show_status
            exit 0
            ;;
        "stop"|"kill")
            stop_guardian_system
            exit 0
            ;;
        "clean"|"cleanup")
            clean_system
            exit 0
            ;;
        "launch"|"start"|"")
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
    echo "║           🛡️ CAL GUARDIAN SYSTEM LAUNCHER 🛡️                        ║"
    echo "║                                                                      ║"
    echo "║  🛡️ Human-in-the-loop verification                                  ║"
    echo "║  📱 Multi-channel notifications (SMS, email, webhooks)              ║"
    echo "║  🎯 Multi-source price verification                                 ║"
    echo "║  💰 Intelligent cost optimization                                   ║"
    echo "║  🖥️ Web-based verification interface                                ║"
    echo "║  📊 Real-time monitoring and reporting                              ║"
    echo "║  🚨 Budget alerts and emergency management                          ║"
    echo "║  ⏰ Timeout handling and automatic fallbacks                        ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    # Run pre-flight checks
    print_status "Running pre-flight checks..."
    check_node
    check_dependencies
    create_directories
    check_environment
    check_ports
    show_system_info
    
    # Launch the Guardian system
    launch_guardian_system
}

# Handle script interruption
trap 'stop_guardian_system' EXIT INT TERM

# Run main function
main "$@"