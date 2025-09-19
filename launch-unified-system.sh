#!/bin/bash

# 🚀 LAUNCH UNIFIED SYSTEM
# One-command activation of self-contained infrastructure

echo "🔗 LAUNCHING UNIFIED SYSTEM"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m' 
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Make the unified system activator executable
chmod +x unified-system-activator.js

echo -e "${BLUE}🎯 Starting unified system activation...${NC}"
echo ""

# Run the unified system activator
node unified-system-activator.js

# This script will keep running until Ctrl+C is pressed
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all systems${NC}"