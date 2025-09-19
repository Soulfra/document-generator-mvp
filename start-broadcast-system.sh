#!/bin/bash

# 🎭 BlameChain Broadcast System Launcher
# Starts all broadcast services in the correct order

echo "🚀 Starting BlameChain Broadcast System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo -e "${YELLOW}   Attempt $attempt/$max_attempts - waiting for $service_name...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Kill any existing processes on our ports
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
pkill -f "flask-broadcast-api" 2>/dev/null || true
pkill -f "blamechain-broadcast" 2>/dev/null || true
pkill -f "broadcast-orchestrator" 2>/dev/null || true
sleep 2

# Check required ports
echo -e "${BLUE}🔍 Checking ports...${NC}"
if ! check_port 5000; then
    echo -e "${RED}❌ Port 5000 (Flask) is busy. Please free it first.${NC}"
    exit 1
fi

if ! check_port 8080; then
    echo -e "${RED}❌ Port 8080 (Rust) is busy. Please free it first.${NC}"
    exit 1
fi

if ! check_port 3001; then
    echo -e "${RED}❌ Port 3001 (Orchestrator) is busy. Please free it first.${NC}"
    exit 1
fi

# Start Flask API first
echo -e "${BLUE}1️⃣ Starting Flask Broadcast API...${NC}"
cd flask-broadcast-api
if [ ! -f "app.py" ]; then
    echo -e "${RED}❌ Flask app.py not found. Please run from the Document-Generator directory.${NC}"
    exit 1
fi

# Check if Python virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -q flask flask-socketio flask-cors redis web3 eth-account requests

# Start Flask in background
echo -e "${GREEN}🔄 Launching Flask API on http://localhost:5000${NC}"
python3 app.py > flask.log 2>&1 &
FLASK_PID=$!
cd ..

# Wait for Flask to be ready
if ! wait_for_service "http://localhost:5000/api/health" "Flask API"; then
    kill $FLASK_PID 2>/dev/null || true
    exit 1
fi

# Start Rust Engine
echo -e "${BLUE}2️⃣ Starting Rust Broadcast Engine...${NC}"
cd rust-broadcast-engine

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust/Cargo not found. Please install Rust first:${NC}"
    echo -e "${YELLOW}   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh${NC}"
    kill $FLASK_PID 2>/dev/null || true
    exit 1
fi

# Build and run Rust service
echo -e "${GREEN}🔄 Building and launching Rust engine on http://localhost:8080${NC}"
cargo build --release > rust-build.log 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Rust build failed. Check rust-build.log for details.${NC}"
    kill $FLASK_PID 2>/dev/null || true
    exit 1
fi

cargo run --release > rust.log 2>&1 &
RUST_PID=$!
cd ..

# Wait for Rust to be ready
if ! wait_for_service "http://localhost:8080/health" "Rust Engine"; then
    kill $FLASK_PID $RUST_PID 2>/dev/null || true
    exit 1
fi

# Start JavaScript Orchestrator
echo -e "${BLUE}3️⃣ Starting JavaScript Orchestrator...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    kill $FLASK_PID $RUST_PID 2>/dev/null || true
    exit 1
fi

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    npm install --silent ethers ws axios express > npm-install.log 2>&1
fi

# Start orchestrator
echo -e "${GREEN}🔄 Launching Orchestrator on http://localhost:3001${NC}"
node broadcast-orchestrator.js > orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!

# Wait for Orchestrator to be ready
if ! wait_for_service "http://localhost:3001/status" "Orchestrator"; then
    kill $FLASK_PID $RUST_PID $ORCHESTRATOR_PID 2>/dev/null || true
    exit 1
fi

# All services are running!
echo -e "${GREEN}🎉 All services are running successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Service Dashboard URLs:${NC}"
echo -e "${GREEN}   Flask API Dashboard:    http://localhost:5000${NC}"
echo -e "${GREEN}   Rust Engine Dashboard:  http://localhost:8080/dashboard${NC}"
echo -e "${GREEN}   Orchestrator Status:    http://localhost:3001/status${NC}"
echo ""
echo -e "${BLUE}🔧 API Endpoints:${NC}"
echo -e "${YELLOW}   Flask API:    http://localhost:5000/api/*${NC}"
echo -e "${YELLOW}   Rust Engine:  http://localhost:8080/*${NC}"
echo -e "${YELLOW}   Orchestrator: http://localhost:3001/*${NC}"
echo ""
echo -e "${BLUE}📡 WebSocket Connections:${NC}"
echo -e "${YELLOW}   Flask SocketIO: ws://localhost:5000${NC}"
echo -e "${YELLOW}   Rust WebSocket: ws://localhost:8080/ws${NC}"
echo ""

# Save PIDs for cleanup
echo "$FLASK_PID $RUST_PID $ORCHESTRATOR_PID" > .broadcast-pids

echo -e "${BLUE}💡 Tips:${NC}"
echo -e "${YELLOW}   • Press Ctrl+C to stop all services${NC}"
echo -e "${YELLOW}   • Run './stop-broadcast-system.sh' to stop services later${NC}"
echo -e "${YELLOW}   • Check *.log files if any service fails${NC}"
echo ""
echo -e "${GREEN}✨ Ready to broadcast BlameChain events!${NC}"

# Wait for Ctrl+C
trap 'echo -e "\n${BLUE}🛑 Stopping all services...${NC}"; kill $FLASK_PID $RUST_PID $ORCHESTRATOR_PID 2>/dev/null || true; rm -f .broadcast-pids; echo -e "${GREEN}✅ All services stopped.${NC}"; exit 0' INT

# Keep script running
echo -e "${BLUE}🔄 Services running... Press Ctrl+C to stop.${NC}"
wait