#!/bin/bash

# 🤝🔏📄 LAUNCH XML HANDSHAKE SYSTEM
# Complete launcher for Soul of Soulfra with XML attestation and handshake agreements
# Brings online the full second half of the handshake system

echo "🤝🔏📄 LAUNCHING COMPLETE XML HANDSHAKE SYSTEM"
echo "═══════════════════════════════════════════════════════════"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting the complete Soul of Soulfra XML handshake ecosystem...${NC}"
echo

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install xmldom ws
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"
echo

# Create logs directory
mkdir -p logs

echo -e "${BLUE}🔧 SYSTEM COMPONENTS:${NC}"
echo -e "  👤 Soul of Soulfra System (soul-of-soulfra.js)"
echo -e "  📋 Collection Log System (collection-log-system.js)" 
echo -e "  🤝 Soul Handshake Integration (soul-handshake-integration.js)"
echo -e "  🔏 XML Attestation Service (soul-xml-attestation-service.js)"
echo -e "  📄 XML Mapping Configuration (soul-of-soulfra-xml-mapping.xml)"
echo -e "  🌐 Unified XML Handshake Interface (unified-xml-handshake-interface.js)"
echo

echo -e "${BLUE}🌐 SERVICE ENDPOINTS:${NC}"
echo -e "  🔏 XML Attestation Service:    http://localhost:9600"
echo -e "  📡 Attestation WebSocket:      ws://localhost:9601"
echo -e "  🤝 Unified Handshake Interface: http://localhost:9700"
echo -e "  📡 Unified WebSocket:          ws://localhost:9701"
echo

# Start the unified XML handshake interface (it manages all the other components)
echo -e "${GREEN}🚀 Starting Unified XML Handshake Interface...${NC}"
echo -e "${CYAN}   This will initialize all Soul of Soulfra components automatically${NC}"
echo

# Run the unified interface
node unified-xml-handshake-interface.js

echo
echo -e "${GREEN}✅ XML HANDSHAKE SYSTEM COMPLETE!${NC}"
echo "═══════════════════════════════════════════════════════════"