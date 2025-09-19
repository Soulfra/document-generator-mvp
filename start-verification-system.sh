#!/bin/bash

# 🚀 START VERIFICATION SYSTEM
# ===========================

echo "🔐 MULTI-LAYER ENCRYPTION VERIFICATION SYSTEM"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        echo "Please install Node.js first: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Install dependencies
install_dependencies() {
    echo ""
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Check if we need to install
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/ws/package.json" ]; then
        echo "Installing required packages..."
        npm install ws sqlite3 --save --legacy-peer-deps
        
        # Install optional packages (won't fail if they can't install)
        echo "Installing optional packages..."
        npm install qrcode canvas natural gif-encoder-2 --save --no-optional || true
    else
        echo -e "${GREEN}✅ Dependencies already installed${NC}"
    fi
}

# Start trust system
start_trust_system() {
    echo ""
    echo -e "${BLUE}🤝 Starting AI Trust System...${NC}"
    
    # Check if already running
    if lsof -i :6666 &> /dev/null; then
        echo -e "${YELLOW}⚠️  Trust system already running on port 6666${NC}"
    else
        echo "Starting anonymous-ai-handshake-trust-system.js..."
        node anonymous-ai-handshake-trust-system.js &
        TRUST_PID=$!
        echo "Started with PID: $TRUST_PID"
        sleep 3
    fi
}

# Start verification server
start_verification_server() {
    echo ""
    echo -e "${BLUE}🔐 Starting Verification Server...${NC}"
    
    # Check if already running
    if lsof -i :6668 &> /dev/null; then
        echo -e "${YELLOW}⚠️  Verification server already running on port 6668${NC}"
    else
        echo "Starting multi-layer-encryption-verification.js..."
        node multi-layer-encryption-verification.js &
        VERIFY_PID=$!
        echo "Started with PID: $VERIFY_PID"
        sleep 2
    fi
}

# Run verification tests
run_verification_tests() {
    echo ""
    echo -e "${BLUE}🧪 Running verification tests...${NC}"
    
    # Run the test suite
    node test-encryption-verification.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All verification tests passed!${NC}"
    else
        echo -e "${RED}❌ Some tests failed${NC}"
    fi
}

# Open dashboard
open_dashboard() {
    echo ""
    echo -e "${BLUE}🌐 Opening verification dashboard...${NC}"
    
    # Create a simple HTTP server for the dashboard
    if ! lsof -i :8080 &> /dev/null; then
        echo "Starting HTTP server for dashboard..."
        python3 -m http.server 8080 --bind 127.0.0.1 &
        HTTP_PID=$!
        sleep 2
    fi
    
    # Open in browser
    if command -v open &> /dev/null; then
        open "http://localhost:8080/encryption-verification-dashboard.html"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8080/encryption-verification-dashboard.html"
    else
        echo "Please open in your browser: http://localhost:8080/encryption-verification-dashboard.html"
    fi
}

# Show status
show_status() {
    echo ""
    echo -e "${GREEN}✅ VERIFICATION SYSTEM RUNNING${NC}"
    echo "================================"
    echo ""
    echo "🔗 Services:"
    echo "  - Trust System: http://localhost:6666/trust-status"
    echo "  - Verification WS: ws://localhost:6668"
    echo "  - Dashboard: http://localhost:8080/encryption-verification-dashboard.html"
    echo ""
    echo "📊 Quick Tests:"
    echo "  - Check trust: curl http://localhost:6666/trust-status"
    echo "  - New handshake: curl -X POST http://localhost:6666/initiate-handshake"
    echo ""
    echo "🛑 To stop: Press Ctrl+C"
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping verification system...${NC}"
    
    # Kill processes
    [ ! -z "$TRUST_PID" ] && kill $TRUST_PID 2>/dev/null
    [ ! -z "$VERIFY_PID" ] && kill $VERIFY_PID 2>/dev/null
    [ ! -z "$HTTP_PID" ] && kill $HTTP_PID 2>/dev/null
    
    # Kill by port if needed
    lsof -ti:6666 | xargs kill 2>/dev/null
    lsof -ti:6668 | xargs kill 2>/dev/null
    lsof -ti:8080 | xargs kill 2>/dev/null
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Main execution
main() {
    check_prerequisites
    install_dependencies
    start_trust_system
    start_verification_server
    run_verification_tests
    open_dashboard
    show_status
    
    # Keep running
    echo ""
    echo "System is running. Monitoring for connections..."
    
    # Monitor loop
    while true; do
        sleep 30
        
        # Check if services are still running
        if ! lsof -i :6666 &> /dev/null; then
            echo -e "${RED}⚠️  Trust system stopped, restarting...${NC}"
            start_trust_system
        fi
        
        if ! lsof -i :6668 &> /dev/null; then
            echo -e "${RED}⚠️  Verification server stopped, restarting...${NC}"
            start_verification_server
        fi
    done
}

# Run main
main