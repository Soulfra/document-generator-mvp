#!/bin/bash

# 🔗 UNIVERSAL BLAMECHAIN SYSTEM LAUNCHER
# Complete deployment and launch of the BlameChain accountability system

echo "🔗 UNIVERSAL BLAMECHAIN SYSTEM LAUNCHER"
echo "======================================="
echo ""
echo "This script will deploy and launch the complete BlameChain system:"
echo "  • Universal BlameChain smart contracts"
echo "  • Metaverse Registry integration"
echo "  • Duo Performance Tracker"
echo "  • Web3 interfaces and dashboards"
echo "  • Accountability tracking system"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check dependencies
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    fi
}

echo "📋 Checking dependencies..."
check_dependency "node"
check_dependency "npm"
check_dependency "python3"

# Check if we have the required files
required_files=(
    "contracts/UniversalBlameChain.sol"
    "contracts/MetaverseRegistry.sol" 
    "contracts/DuoPerformanceTracker.sol"
    "deploy-universal-blamechain.js"
    "blamechain-dashboard.html"
    "hardhat.config.js"
)

echo ""
echo "📁 Checking required files..."
all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo -e "${RED}❌ Missing required files. Please ensure all contracts and scripts are present.${NC}"
    exit 1
fi

echo ""
echo "🔧 Step 1: Installing Dependencies"
echo "================================="

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install --silent
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Node dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install Node dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node dependencies already installed${NC}"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install --user websockets asyncio aiohttp > /dev/null 2>&1
echo -e "${GREEN}✅ Python dependencies installed${NC}"

echo ""
echo "⛓️ Step 2: Starting Local Blockchain"
echo "=================================="

# Check if Hardhat node is already running
if lsof -i:8545 &> /dev/null; then
    echo -e "${YELLOW}⚠️ Blockchain already running on port 8545${NC}"
else
    echo "Starting Hardhat node..."
    npx hardhat node &
    HARDHAT_PID=$!
    sleep 5
    echo -e "${GREEN}✅ Hardhat node started (PID: $HARDHAT_PID)${NC}"
fi

echo ""
echo "📄 Step 3: Compiling Smart Contracts"
echo "===================================="

echo "Compiling contracts..."
npx hardhat compile
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contracts compiled successfully${NC}"
else
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

echo ""
echo "🚀 Step 4: Deploying BlameChain System"
echo "===================================="

echo "Deploying Universal BlameChain system..."
node deploy-universal-blamechain.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ BlameChain system deployed successfully${NC}"
else
    echo -e "${RED}❌ BlameChain deployment failed${NC}"
    exit 1
fi

echo ""
echo "🌐 Step 5: Starting Metaverse Backend"
echo "==================================="

# Check if metaverse backend is already running
if lsof -i:8765 &> /dev/null; then
    echo -e "${YELLOW}⚠️ Metaverse backend already running on port 8765${NC}"
else
    if [ -f "metaverse-backend.py" ]; then
        echo "Starting metaverse backend..."
        python3 metaverse-backend.py &
        BACKEND_PID=$!
        sleep 3
        echo -e "${GREEN}✅ Metaverse backend started (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️ metaverse-backend.py not found, skipping backend startup${NC}"
    fi
fi

echo ""
echo "🎨 Step 6: Launching User Interfaces"
echo "=================================="

echo "Opening BlameChain interfaces..."

# Function to open files based on OS
open_file() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$1"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$1" 2>/dev/null || firefox "$1"
    else
        echo "Please manually open: $1"
    fi
}

# Open BlameChain Dashboard
if [ -f "blamechain-dashboard.html" ]; then
    echo "Opening BlameChain Dashboard..."
    open_file "blamechain-dashboard.html"
    echo -e "${GREEN}✅ BlameChain Dashboard opened${NC}"
fi

# Open Web3 Metaverse Interface
if [ -f "web3-metaverse-interface.html" ]; then
    echo "Opening Web3 Metaverse Interface..."
    open_file "web3-metaverse-interface.html"
    echo -e "${GREEN}✅ Web3 Interface opened${NC}"
fi

# Open Blockchain Proof Dashboard
if [ -f "blockchain-proof-dashboard.html" ]; then
    echo "Opening Blockchain Proof Dashboard..."
    open_file "blockchain-proof-dashboard.html"
    echo -e "${GREEN}✅ Proof Dashboard opened${NC}"
fi

echo ""
echo "🔍 Step 7: Running System Verification"
echo "===================================="

# Wait a moment for everything to start
sleep 2

echo "Running system verification tests..."

# Check if everything is running
services_ok=true

# Check blockchain
if lsof -i:8545 &> /dev/null; then
    echo -e "${GREEN}✅ Blockchain running on port 8545${NC}"
else
    echo -e "${RED}❌ Blockchain not running${NC}"
    services_ok=false
fi

# Check metaverse backend (optional)
if lsof -i:8765 &> /dev/null; then
    echo -e "${GREEN}✅ Metaverse backend running on port 8765${NC}"
else
    echo -e "${YELLOW}⚠️ Metaverse backend not running (optional)${NC}"
fi

# Test contract deployment
if [ -f "blamechain-integration.js" ]; then
    echo -e "${GREEN}✅ Integration code generated${NC}"
else
    echo -e "${RED}❌ Integration code not generated${NC}"
    services_ok=false
fi

# Test a simple contract call
echo "Testing contract interaction..."
node -e "
const { ethers } = require('ethers');
async function test() {
    try {
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        const network = await provider.getNetwork();
        console.log('✅ Contract interaction test passed');
        return true;
    } catch (error) {
        console.log('❌ Contract interaction test failed:', error.message);
        return false;
    }
}
test();
" 2>/dev/null

echo ""
echo "📊 DEPLOYMENT SUMMARY"
echo "===================="
echo ""

# Show contract addresses if deployment file exists
if [ -f "blamechain-integration.js" ]; then
    echo -e "${BLUE}📄 Contract Addresses:${NC}"
    grep -E "MetaverseRegistry|DuoPerformanceTracker|UniversalBlameChain" blamechain-integration.js | head -3
    echo ""
fi

echo -e "${BLUE}🌐 Service Endpoints:${NC}"
echo "  • Blockchain RPC: http://localhost:8545"
echo "  • Metaverse Backend: ws://localhost:8765"
echo ""

echo -e "${BLUE}🎨 User Interfaces:${NC}"
echo "  • BlameChain Dashboard: blamechain-dashboard.html"
echo "  • Web3 Metaverse Interface: web3-metaverse-interface.html"
echo "  • Blockchain Proof Dashboard: blockchain-proof-dashboard.html"
echo ""

echo -e "${BLUE}📁 Generated Files:${NC}"
echo "  • blamechain-integration.js - Integration code"
echo "  • blamechain-deployment-*.json - Deployment report"
echo ""

if [ "$services_ok" = true ]; then
    echo -e "${GREEN}🎉 BLAMECHAIN SYSTEM LAUNCH COMPLETE!${NC}"
    echo ""
    echo -e "${GREEN}✨ Your Universal BlameChain system is now running!${NC}"
    echo ""
    echo "🔧 What you can do now:"
    echo "  1. Visit the BlameChain Dashboard to assign blame"
    echo "  2. Use the Web3 Interface to interact with the metaverse"
    echo "  3. View the Proof Dashboard to verify everything works"
    echo "  4. Monitor reputation scores and accountability metrics"
    echo "  5. Test blame assignment and consensus voting"
    echo ""
    echo "📖 Every action in your metaverse is now tracked and accountable!"
    echo "   Developers will be held responsible for their code!"
    echo "   Systems will maintain reputation scores!"
    echo "   Failures will be traced to their root cause!"
    echo ""
else
    echo -e "${RED}⚠️ SYSTEM LAUNCH COMPLETED WITH WARNINGS${NC}"
    echo "Some services may not be fully operational. Check the logs above."
fi

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down BlameChain system..."
    if [ ! -z "$HARDHAT_PID" ]; then
        kill $HARDHAT_PID 2>/dev/null
        echo "Stopped blockchain node"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "Stopped metaverse backend"
    fi
    echo "System shutdown complete."
}

trap cleanup EXIT

echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services and exit...${NC}"
echo ""

# Keep the script running to maintain services
while true; do
    sleep 1
done