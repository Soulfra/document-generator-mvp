#!/bin/bash

echo "🎭 DOMINGO ORCHESTRATOR STARTUP"
echo "==============================="
echo

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_service() {
    echo -e "${BLUE}[SERVICE]${NC} $1"
}

print_domingo() {
    echo -e "${PURPLE}[DOMINGO]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if PostgreSQL is running (optional)
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        print_status "PostgreSQL is running"
    else
        print_warning "PostgreSQL is not running. Starting with default connection..."
    fi
else
    print_warning "PostgreSQL tools not found. Using default connection..."
fi

# Install dependencies if package.json exists
if [ -f "package-orchestrator.json" ]; then
    print_status "Installing dependencies..."
    cp package-orchestrator.json package.json
    npm install --silent
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_warning "No package-orchestrator.json found. Installing basic dependencies..."
    npm install express ws pg --silent
fi

# Start the orchestrator server
print_domingo "Starting Domingo Orchestrator Server..."
echo

# Check if the server file exists
if [ ! -f "domingo-orchestrator-server.js" ]; then
    print_error "domingo-orchestrator-server.js not found!"
    exit 1
fi

# Start the server in the background and capture the PID
node domingo-orchestrator-server.js &
SERVER_PID=$!

# Give the server time to start
sleep 2

# Check if the server is still running
if kill -0 $SERVER_PID 2>/dev/null; then
    print_service "Orchestrator Server started successfully (PID: $SERVER_PID)"
    print_service "Orchestrator Interface: http://localhost:7777"
    print_service "Testing Interface: http://localhost:7779"
    print_service "WebSocket: ws://localhost:7777/ws"
    echo
    print_domingo "🎭 Domingo is now orchestrating your backend systems!"
    print_domingo "💜 Purple eyes are glowing - ready for commands"
    echo
    print_status "Available commands:"
    echo "  • Chat with Domingo at http://localhost:7777"
    echo "  • Create tasks via chat: 'create task: Your task title'"
    echo "  • Assign tasks: 'assign [task] to [character]'"
    echo "  • Check status: 'status' or 'health'"
    echo "  • Forum integration: 'forum post: Your message'"
    echo
    print_status "Press Ctrl+C to stop the orchestrator"
    
    # Wait for the server process
    wait $SERVER_PID
    
else
    print_error "Failed to start orchestrator server"
    exit 1
fi

# Cleanup function
cleanup() {
    echo
    print_status "Shutting down Domingo Orchestrator..."
    kill $SERVER_PID 2>/dev/null
    print_domingo "👋 Domingo has left the building. Backend orchestration stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM