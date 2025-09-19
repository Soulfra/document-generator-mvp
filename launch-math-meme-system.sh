#!/bin/bash
#
# Launch Math Meme Time System
# Starts all components: Time Engine, Flask Service, and Integration Bridge
#

echo "🎮 LAUNCHING MATH MEME TIME SYSTEM"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start a service
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    local log_file=$4
    
    echo -e "${YELLOW}Starting $service_name...${NC}"
    
    # Check if already running
    if check_port $port; then
        echo -e "${GREEN}✓ $service_name already running on port $port${NC}"
        return
    fi
    
    # Start the service
    nohup $command > "$log_file" 2>&1 &
    local pid=$!
    
    # Wait for service to start
    sleep 3
    
    # Check if started successfully
    if check_port $port; then
        echo -e "${GREEN}✓ $service_name started successfully (PID: $pid)${NC}"
        echo $pid > "${service_name}.pid"
    else
        echo -e "${RED}✗ Failed to start $service_name${NC}"
        echo "Check log file: $log_file"
        return 1
    fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Install dependencies if needed
echo "📦 Checking dependencies..."

# Check Node.js dependencies
if [ ! -d "node_modules" ] || [ ! -f "node_modules/ws/package.json" ]; then
    echo "Installing Node.js dependencies..."
    npm install ws axios csv-writer exceljs
fi

# Check Python dependencies
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip3 install flask flask-cors pandas xlsxwriter
fi

echo ""

# Start Math Meme Time Engine
start_service "math-meme-time-engine" \
    "node math-meme-time-engine.js" \
    3017 \
    "logs/math-meme-time-engine.log"

# Start Flask Time Service
start_service "time-flask-service" \
    "python3 time-flask-service.py" \
    5000 \
    "logs/time-flask-service.log"

# Wait a bit for services to be ready
sleep 3

# Start Integration Bridge
start_service "integration-bridge" \
    "node integration-bridge-system.js" \
    3018 \
    "logs/integration-bridge.log"

echo ""
echo "🎯 MATH MEME TIME SYSTEM STATUS"
echo "==============================="
echo ""

# Show service URLs
if check_port 3017; then
    echo -e "${GREEN}✓ Math Meme Time Engine${NC}"
    echo "  Dashboard: http://localhost:3017"
    echo "  WebSocket: ws://localhost:3016"
fi

if check_port 5000; then
    echo -e "${GREEN}✓ Flask Time Service${NC}"
    echo "  Dashboard: http://localhost:5000"
    echo "  API Docs: http://localhost:5000/api/health"
fi

if check_port 3018; then
    echo -e "${GREEN}✓ Integration Bridge${NC}"
    echo "  Dashboard: http://localhost:3018"
    echo "  Auto-sync: Every 30 seconds"
fi

echo ""
echo "📊 Time Compression: 24:1"
echo "⏱️  20 real minutes = 8 simulated hours"
echo "📦 Message bottles created every 20 minutes"
echo ""

# Create stop script
cat > stop-math-meme-system.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Math Meme Time System..."

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file="${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill $pid 2>/dev/null; then
            echo "✓ Stopped $service_name"
            rm "$pid_file"
        else
            echo "⚠️  $service_name was not running"
            rm "$pid_file"
        fi
    else
        echo "⚠️  No PID file for $service_name"
    fi
}

stop_service "math-meme-time-engine"
stop_service "time-flask-service"
stop_service "integration-bridge"

echo "✓ All services stopped"
EOF

chmod +x stop-math-meme-system.sh

echo "💡 Commands:"
echo "  !math_meme          - Show time status"
echo "  !math_meme bottle   - Create message bottle"
echo "  !math_meme export csv - Export to CSV"
echo "  !math_meme help     - Show all commands"
echo ""
echo "🛑 To stop all services: ./stop-math-meme-system.sh"
echo ""
echo "✨ Math Meme Time System is ready!"