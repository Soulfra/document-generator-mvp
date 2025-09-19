#!/bin/bash

# 🚀 SOULFRA AUTH INSTALLATION SCRIPT
# Sets up terminal OAuth system with OS integration

echo "🚀 INSTALLING SOULFRA AUTH SYSTEM"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js first: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install commander chalk ora cli-table3 open blessed blessed-contrib 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Some packages may need manual installation${NC}"
}

# Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x soulfra-auth.js
chmod +x soulfra-auth-tui.js
chmod +x soulfra-auth-daemon.js
chmod +x oauth-system-bridge.js

# Create symlinks for global commands
echo ""
echo "🔗 Creating command symlinks..."

# Get npm global bin directory
NPM_BIN=$(npm bin -g 2>/dev/null || echo "/usr/local/bin")

# Create symlinks
sudo ln -sf "$(pwd)/soulfra-auth.js" "$NPM_BIN/soulfra-auth" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Cannot create global symlink. Use with 'node soulfra-auth.js'${NC}"
}

# Create configuration directory
echo ""
echo "📁 Creating configuration directory..."
mkdir -p ~/.soulfra/oauth

# Check platform-specific features
echo ""
echo "🖥️  Checking platform features..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}✓${NC} macOS Keychain support available"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v secret-tool &> /dev/null; then
        echo -e "${GREEN}✓${NC} GNOME Keyring support available"
    else
        echo -e "${YELLOW}⚠️  Using encrypted file storage (install gnome-keyring for better security)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Using encrypted file storage${NC}"
fi

# Create example OAuth app instructions
cat > ~/.soulfra/OAUTH_SETUP_GUIDE.txt << 'EOF'
SOULFRA AUTH - OAUTH SETUP GUIDE
================================

1. GITHUB OAUTH SETUP
   - Go to: https://github.com/settings/developers
   - Click "New OAuth App"
   - Application name: SoulFra Auth
   - Homepage URL: http://localhost:8463
   - Authorization callback URL: http://localhost:8462/callback
   - Click "Register application"
   - Copy Client ID and Client Secret

2. GOOGLE OAUTH SETUP
   - Go to: https://console.cloud.google.com
   - Create new project or select existing
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Add authorized redirect URI: http://localhost:8462/callback
   - Copy Client ID and Client Secret

3. CONFIGURE SOULFRA AUTH
   Run: soulfra-auth configure github
   Run: soulfra-auth configure google

4. START USING
   Terminal CLI: soulfra-auth login github
   Terminal TUI: node soulfra-auth-tui.js
   Background daemon: node soulfra-auth-daemon.js start

FEATURES:
- Tokens stored in OS keychain (secure)
- Terminal-based authentication
- No web server required for daily use
- Direct OS integration
EOF

echo ""
echo "✅ INSTALLATION COMPLETE!"
echo "========================"
echo ""
echo -e "${BLUE}🎯 Quick Start:${NC}"
echo "   1. Configure OAuth provider:"
echo "      ${GREEN}soulfra-auth configure github${NC}"
echo ""
echo "   2. Login via terminal:"
echo "      ${GREEN}soulfra-auth login github${NC}"
echo ""
echo "   3. Or use the TUI:"
echo "      ${GREEN}node soulfra-auth-tui.js${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   Setup guide: ~/.soulfra/OAUTH_SETUP_GUIDE.txt"
echo "   Commands: soulfra-auth --help"
echo ""
echo -e "${BLUE}🌉 Port Mirrors (Stormlight-style Oathgates):${NC}"
echo "   • OAuth callback: localhost:8462"
echo "   • API server: localhost:8463"
echo "   • Port mirror: localhost:8464 → 3340"
echo ""
echo -e "${GREEN}Ready to authenticate directly from your terminal!${NC}"