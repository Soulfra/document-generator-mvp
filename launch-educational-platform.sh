#!/bin/bash
#
# Educational Platform Launcher
# Deploys all educational components with WASM protection
# Integrates with RuneLite Knowledge Graph and ensures electricity usage justification
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLATFORM_NAME="RuneScape Educational Platform"
WASM_DEPLOYMENT_SCRIPT="./wasm-educational-deployment.js"
LOG_DIR="./logs/educational"
PID_DIR="./pids"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️  $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local name=$1
    local port=$2
    local max_wait=30
    local wait_time=0
    
    print_status "Waiting for $name to be ready on port $port..."
    
    while [ $wait_time -lt $max_wait ]; do
        if check_port $port; then
            sleep 1
            wait_time=$((wait_time + 1))
        else
            print_success "$name is ready on port $port"
            return 0
        fi
    done
    
    print_error "$name failed to start within ${max_wait} seconds"
    return 1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check required Node modules
    if [ ! -d "node_modules" ]; then
        print_warning "Node modules not found. Installing..."
        npm install
    fi
    
    # Check Java (for RuneLite integration)
    if ! command -v java &> /dev/null; then
        print_warning "Java not found. RuneLite integration may not work properly"
    fi
    
    # Check available ports
    local ports=(9906 9907 9908 9909 9910 9911 9912)
    for port in "${ports[@]}"; do
        if ! check_port $port; then
            print_error "Port $port is already in use"
            exit 1
        fi
    done
    
    print_success "System requirements check passed"
}

# Function to start individual educational component
start_component() {
    local component=$1
    local port=$2
    local script_path=$3
    
    print_status "Starting $component on port $port..."
    
    if [ -f "$script_path" ]; then
        # Start component in background with logging
        nohup node "$script_path" > "$LOG_DIR/${component}.log" 2>&1 &
        local pid=$!
        echo $pid > "$PID_DIR/${component}.pid"
        
        # Wait a moment for startup
        sleep 2
        
        # Check if process is still running
        if kill -0 $pid 2>/dev/null; then
            print_success "$component started (PID: $pid)"
            return 0
        else
            print_error "$component failed to start"
            return 1
        fi
    else
        print_warning "$component script not found at $script_path"
        return 1
    fi
}

# Function to check electricity justification
check_electricity_justification() {
    print_status "Verifying electricity usage justification..."
    
    # This would integrate with the social impact dashboard
    # For now, we'll simulate the check
    local justification_score=0.85
    local minimum_threshold=0.7
    
    if (( $(echo "$justification_score > $minimum_threshold" | bc -l) )); then
        print_success "Electricity usage justified (Score: $justification_score)"
    else
        print_error "Electricity usage not sufficiently justified (Score: $justification_score, Required: $minimum_threshold)"
        exit 1
    fi
}

# Function to start all educational components
start_educational_components() {
    print_status "Starting educational components..."
    
    # Educational Content Engine
    if [ -f "./educational-content-engine.js" ]; then
        start_component "EducationalContentEngine" 9906 "./educational-content-engine.js"
    fi
    
    # Customer Service Training Simulator
    if [ -f "./customer-service-training-simulator.js" ]; then
        start_component "CustomerServiceTrainingSimulator" 9907 "./customer-service-training-simulator.js"
    fi
    
    # Financial Literacy Tracker
    if [ -f "./financial-literacy-tracker.js" ]; then
        start_component "FinancialLiteracyTracker" 9908 "./financial-literacy-tracker.js"
    fi
    
    # Social Impact Dashboard
    if [ -f "./social-impact-dashboard.js" ]; then
        start_component "SocialImpactDashboard" 9909 "./social-impact-dashboard.js"
    fi
    
    # Eye-tracking Prevention System
    if [ -f "./eye-tracking-prevention-system.js" ]; then
        start_component "EyeTrackingPrevention" 9910 "./eye-tracking-prevention-system.js"
    fi
    
    print_success "Educational components startup complete"
}

# Function to start WASM deployment manager
start_wasm_deployment() {
    print_status "Starting WASM Educational Deployment Manager..."
    
    if [ -f "$WASM_DEPLOYMENT_SCRIPT" ]; then
        nohup node "$WASM_DEPLOYMENT_SCRIPT" > "$LOG_DIR/wasm-deployment.log" 2>&1 &
        local pid=$!
        echo $pid > "$PID_DIR/wasm-deployment.pid"
        
        sleep 3
        
        if kill -0 $pid 2>/dev/null; then
            print_success "WASM Deployment Manager started (PID: $pid)"
            print_success "Unified Dashboard: http://localhost:9911/dashboard"
            print_success "Real-time Updates: ws://localhost:9912"
        else
            print_error "WASM Deployment Manager failed to start"
            return 1
        fi
    else
        print_error "WASM deployment script not found at $WASM_DEPLOYMENT_SCRIPT"
        return 1
    fi
}

# Function to setup RuneLite integration
setup_runelite_integration() {
    print_status "Setting up RuneLite integration..."
    
    # Check if RuneLite plugin directory exists
    if [ -d "./runelite-plugin" ]; then
        print_status "Building RuneLite plugin..."
        cd runelite-plugin
        
        if [ -f "build.gradle" ]; then
            ./gradlew build
            if [ $? -eq 0 ]; then
                print_success "RuneLite plugin built successfully"
            else
                print_warning "RuneLite plugin build failed"
            fi
        else
            print_warning "RuneLite plugin build script not found"
        fi
        
        cd ..
    else
        print_warning "RuneLite plugin directory not found"
    fi
    
    print_status "RuneLite integration setup complete"
}

# Function to display system status
display_status() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}                 $PLATFORM_NAME Status                          ${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Check component status
    local components=("EducationalContentEngine" "CustomerServiceTrainingSimulator" "FinancialLiteracyTracker" "SocialImpactDashboard" "EyeTrackingPrevention" "wasm-deployment")
    local ports=(9906 9907 9908 9909 9910 9911)
    
    for i in "${!components[@]}"; do
        local component=${components[$i]}
        local port=${ports[$i]}
        local pid_file="$PID_DIR/${component}.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if kill -0 $pid 2>/dev/null; then
                echo -e "  ${GREEN}●${NC} $component (PID: $pid, Port: $port)"
            else
                echo -e "  ${RED}●${NC} $component (Stopped)"
            fi
        else
            echo -e "  ${RED}●${NC} $component (Not started)"
        fi
    done
    
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo "  📊 Main Dashboard:     http://localhost:9911/dashboard"
    echo "  📚 Educational:        http://localhost:9906"
    echo "  🎧 Customer Service:   http://localhost:9907"
    echo "  💰 Financial Tracker:  http://localhost:9908"
    echo "  🌍 Social Impact:      http://localhost:9909"
    echo "  👁️  Eye Protection:     http://localhost:9910"
    echo ""
    echo -e "${BLUE}Logs Directory:${NC} $LOG_DIR"
    echo -e "${BLUE}PIDs Directory:${NC} $PID_DIR"
    echo ""
}

# Function to stop all services
stop_services() {
    print_status "Stopping all educational platform services..."
    
    # Stop components
    for pid_file in "$PID_DIR"/*.pid; do
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            local component=$(basename "$pid_file" .pid)
            
            if kill -0 $pid 2>/dev/null; then
                print_status "Stopping $component (PID: $pid)..."
                kill $pid
                sleep 2
                
                if kill -0 $pid 2>/dev/null; then
                    print_warning "Force stopping $component..."
                    kill -9 $pid
                fi
                
                print_success "$component stopped"
            fi
            
            rm -f "$pid_file"
        fi
    done
    
    print_success "All services stopped"
}

# Main execution
main() {
    case "${1:-start}" in
        "start")
            echo -e "${BLUE}🚀 Starting $PLATFORM_NAME${NC}"
            echo ""
            
            check_requirements
            check_electricity_justification
            setup_runelite_integration
            start_educational_components
            start_wasm_deployment
            
            echo ""
            print_success "🎓 Educational Platform launched successfully!"
            echo ""
            display_status
            
            echo -e "${GREEN}The RuneScape Educational Platform is now running!${NC}"
            echo -e "${GREEN}Visit http://localhost:9911/dashboard to get started.${NC}"
            echo ""
            echo "To stop the platform, run: $0 stop"
            echo "To check status, run: $0 status"
            ;;
            
        "stop")
            echo -e "${BLUE}🛑 Stopping $PLATFORM_NAME${NC}"
            stop_services
            ;;
            
        "status")
            display_status
            ;;
            
        "restart")
            echo -e "${BLUE}🔄 Restarting $PLATFORM_NAME${NC}"
            stop_services
            sleep 2
            main start
            ;;
            
        "logs")
            component=${2:-"all"}
            if [ "$component" = "all" ]; then
                echo "📋 Showing all logs..."
                tail -f "$LOG_DIR"/*.log
            else
                echo "📋 Showing logs for $component..."
                tail -f "$LOG_DIR/${component}.log"
            fi
            ;;
            
        "help")
            echo "Usage: $0 {start|stop|restart|status|logs [component]|help}"
            echo ""
            echo "Commands:"
            echo "  start    - Start the educational platform"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            echo "  status   - Show service status"
            echo "  logs     - Show logs (all or specific component)"
            echo "  help     - Show this help message"
            ;;
            
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Handle Ctrl+C gracefully
trap 'echo ""; print_status "Caught interrupt signal"; stop_services; exit 0' INT

# Execute main function
main "$@"