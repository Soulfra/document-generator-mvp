#!/bin/bash

# 🌉 TERMINAL OAUTH BRIDGE SYSTEM LAUNCHER
# Creates "Oathgate" connections between terminal and web OAuth

echo "🌉 STARTING TERMINAL OAUTH BRIDGE SYSTEM"
echo "========================================"
echo ""
echo "Creating port mirrors like Oathgates in Stormlight Archives..."
echo "Terminal ←→ OS Keychain ←→ Web Services"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if system is installed
if [ ! -f soulfra-auth.js ]; then
    echo -e "${YELLOW}⚠️  SoulFra Auth system not found. Installing...${NC}"
    ./install-soulfra-auth.sh
fi

# Start daemon first (background service)
echo "1️⃣ Starting OAuth daemon (background service)..."
node soulfra-auth-daemon.js start
sleep 2

# Check daemon status
if curl -s http://localhost:8463/health >/dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} OAuth daemon running on port 8463"
else
    echo -e "   ${YELLOW}⚠${NC} Daemon may need more time to start"
fi

# Start the GitHub wrapper with OAuth integration
if [ -f github-desktop-wrapper-oauth.js ]; then
    echo ""
    echo "2️⃣ Starting OAuth-enabled GitHub Desktop wrapper..."
    node github-desktop-wrapper-oauth.js &
    GITHUB_PID=$!
    sleep 2
    
    if curl -s http://localhost:3337 >/dev/null 2>&1; then
        echo -e "   ${GREEN}✓${NC} GitHub wrapper running on port 3337"
    else
        echo -e "   ${YELLOW}⚠${NC} GitHub wrapper may need more time"
    fi
fi

echo ""
echo "✨ TERMINAL OAUTH SYSTEM READY!"
echo "=============================="
echo ""
echo -e "${BLUE}🎯 Authentication Methods:${NC}"
echo ""
echo -e "${GREEN}Terminal CLI:${NC}"
echo "   soulfra-auth login github     # Login with GitHub"
echo "   soulfra-auth status          # Check all auth status"
echo "   soulfra-auth token github    # Get GitHub token"
echo ""
echo -e "${GREEN}Terminal TUI (Visual):${NC}"
echo "   node soulfra-auth-tui.js     # Beautiful terminal interface"
echo ""
echo -e "${GREEN}Web Interfaces:${NC}"
echo "   http://localhost:3337        # GitHub Desktop (OAuth-enabled)"
echo "   http://localhost:8463        # OAuth API server"
echo ""
echo -e "${BLUE}🌉 Active Port Mirrors:${NC}"
echo "   • OAuth callbacks: localhost:8462"
echo "   • API server: localhost:8463"
echo "   • Web sync: localhost:8464 → 3340"
echo ""
echo -e "${BLUE}🔐 Security Features:${NC}"
echo "   • Tokens stored in OS keychain"
echo "   • No plain text credentials"
echo "   • Direct terminal authentication"
echo "   • Background daemon management"
echo ""
echo -e "${GREEN}How it works (like Stormlight Oathgates):${NC}"
echo "   1. Terminal initiates OAuth flow"
echo "   2. Browser opens for authentication"
echo "   3. Tokens stored in OS keychain"
echo "   4. Web services use tokens via daemon"
echo "   5. Real-time sync between all components"
echo ""

# Show quick status
echo -e "${BLUE}📊 Current Status:${NC}"
echo ""

# Check GitHub auth status
echo -n "   GitHub: "
if node soulfra-auth.js status 2>/dev/null | grep -q "github.*Connected"; then
    echo -e "${GREEN}✓ Authenticated${NC}"
else
    echo -e "${YELLOW}Not authenticated${NC}"
    echo "      Run: soulfra-auth login github"
fi

# Check Google auth status  
echo -n "   Google: "
if node soulfra-auth.js status 2>/dev/null | grep -q "google.*Connected"; then
    echo -e "${GREEN}✓ Authenticated${NC}"
else
    echo -e "${YELLOW}Not authenticated${NC}"
    echo "      Run: soulfra-auth login google"
fi

echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo "   node soulfra-auth-daemon.js status  # Check daemon"
echo "   node soulfra-auth-daemon.js stop    # Stop daemon"
echo "   soulfra-auth --help                 # Show all commands"
echo ""
echo -e "${GREEN}Ready for OS-level OAuth authentication!${NC}"
echo ""

# Keep script running to show logs
if [ "$1" == "--watch" ]; then
    echo "📝 Watching logs (Ctrl+C to exit)..."
    echo ""
    tail -f ~/.soulfra/auth-daemon.log 2>/dev/null || echo "No logs yet..."
fi