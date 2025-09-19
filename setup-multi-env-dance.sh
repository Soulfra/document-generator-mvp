#!/bin/bash

# 🎭 Multi-Environment Dance Setup
# Sets up King and Queen to dance across different encrypted environments

set -e

echo "🎭 Setting up Multi-Environment Dance System"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Create environment files if they don't exist
echo -e "${BLUE}📁 Setting up environment files...${NC}"

if [ ! -f .env.king ]; then
    cp .env.king.example .env.king
    echo -e "${GREEN}✅ Created .env.king${NC}"
fi

if [ ! -f .env.queen ]; then
    cp .env.queen.example .env.queen
    echo -e "${GREEN}✅ Created .env.queen${NC}"
fi

if [ ! -f .env.bridge ]; then
    cp .env.bridge.example .env.bridge
    echo -e "${GREEN}✅ Created .env.bridge${NC}"
fi

# Install dotenvx for secure environment management
echo -e "\n${BLUE}📦 Installing dotenvx...${NC}"
if ! command -v dotenvx &> /dev/null; then
    npm install -g @dotenvx/dotenvx
    echo -e "${GREEN}✅ Installed dotenvx${NC}"
else
    echo -e "${GREEN}✅ dotenvx already installed${NC}"
fi

# Generate encryption keys
echo -e "\n${BLUE}🔐 Generating encryption keys...${NC}"
node -e "
const crypto = require('crypto');
const fs = require('fs');

// Generate keys if they don't exist
const keys = ['.env.king.key', '.env.queen.key', '.env.bridge.key', '.env.vault.key'];

keys.forEach(keyFile => {
    if (!fs.existsSync(keyFile)) {
        const key = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(keyFile, key);
        console.log('✅ Generated ' + keyFile);
    } else {
        console.log('✅ ' + keyFile + ' already exists');
    }
});
"

# Create dance vault directory
echo -e "\n${BLUE}💾 Creating dance vault...${NC}"
mkdir -p dance-vault/{choreographies,memories,history,versions}
echo -e "${GREEN}✅ Dance vault directories created${NC}"

# Start the Multi-Environment Orchestrator
echo -e "\n${PURPLE}🎭 Starting Multi-Environment Orchestrator...${NC}"
node multi-env-orchestrator.js &
ORCHESTRATOR_PID=$!
sleep 2

# Start the Secure Memory Bridge
echo -e "\n${PURPLE}🌉 Starting Secure Memory Bridge...${NC}"
node secure-memory-bridge.js &
BRIDGE_PID=$!
sleep 2

# Initialize the Dance Memory Vault
echo -e "\n${PURPLE}💾 Initializing Dance Memory Vault...${NC}"
node dance-memory-vault.js &
VAULT_PID=$!
sleep 2

# Display status
echo -e "\n${GREEN}✨ Multi-Environment Dance System Ready!${NC}"
echo -e "${YELLOW}=======================================${NC}"
echo ""
echo "🎭 Components Running:"
echo "  📂 Multi-Environment Orchestrator (PID: $ORCHESTRATOR_PID)"
echo "  🌉 Secure Memory Bridge (PID: $BRIDGE_PID)"
echo "  💾 Dance Memory Vault (PID: $VAULT_PID)"
echo ""
echo "🔐 Encryption Keys Generated:"
echo "  👑 King: .env.king.key"
echo "  👸 Queen: .env.queen.key"
echo "  🌉 Bridge: .env.bridge.key"
echo "  💾 Vault: .env.vault.key"
echo ""
echo "🌐 Access Points:"
echo "  Bridge API: http://localhost:9996"
echo "  Bridge WebSocket: ws://localhost:9995"
echo "  King Dashboard: http://localhost:9999"
echo "  Queen Dashboard: queen-dashboard.html"
echo ""
echo "💃 Ready to Dance!"
echo ""
echo "Try these commands:"
echo "  - Open King Dashboard: open http://localhost:9999"
echo "  - Open Queen Dashboard: open queen-dashboard.html"
echo "  - Open Unified Dashboard: open unified-debug-dashboard.html"
echo "  - Check Bridge Status: curl http://localhost:9996/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    kill $ORCHESTRATOR_PID 2>/dev/null || true
    kill $BRIDGE_PID 2>/dev/null || true
    kill $VAULT_PID 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

trap cleanup INT TERM

# Keep script running
wait