#!/bin/bash
#
# Start GitHub OAuth Authentication System
# This launches your existing OAuth server and handles everything automatically
#

echo "🚀 STARTING GITHUB AUTHENTICATION SYSTEM"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if OAuth server is already running
if lsof -i :8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  OAuth server already running on port 8000${NC}"
else
    echo -e "${CYAN}🚀 Starting OAuth server...${NC}"
    
    # Check if the OAuth system exists
    if [ -f "multi-provider-oauth-system.js" ]; then
        # Start the OAuth server in background
        node multi-provider-oauth-system.js &
        OAUTH_PID=$!
        echo -e "${GREEN}✅ OAuth server started (PID: $OAUTH_PID)${NC}"
        
        # Wait for server to start
        sleep 2
    else
        echo -e "${RED}❌ OAuth system not found. Using direct authentication...${NC}"
    fi
fi

# Check if we have GitHub credentials in .env
if [ -f ".env" ]; then
    source .env
    if [ "$GITHUB_CLIENT_ID" != "your-github-client-id-here" ] && [ -n "$GITHUB_CLIENT_ID" ]; then
        echo -e "${GREEN}✅ GitHub OAuth credentials found${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub OAuth not configured${NC}"
        echo ""
        echo "To set up GitHub OAuth:"
        echo "1. Go to https://github.com/settings/developers"
        echo "2. Create a new OAuth App"
        echo "3. Set callback URL: http://localhost:8000/auth/github/callback"
        echo "4. Add credentials to .env file"
        echo ""
    fi
fi

echo ""
echo -e "${CYAN}📋 Available Options:${NC}"
echo "1. Open GitHub Auth Portal (http://localhost:8000/portal/github-auth.html)"
echo "2. Use Auto Push Script (node auto-github-push.js)"
echo "3. Open Author Studio with GitHub integration"
echo ""

# Ask user what to do
read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo -e "${CYAN}🌐 Opening GitHub Auth Portal...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "http://localhost:8000/portal/github-auth.html"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "http://localhost:8000/portal/github-auth.html"
        else
            echo "Open in browser: http://localhost:8000/portal/github-auth.html"
        fi
        ;;
    2)
        echo -e "${CYAN}🚀 Running Auto Push Script...${NC}"
        node auto-github-push.js
        ;;
    3)
        echo -e "${CYAN}📝 Opening Author Studio...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "author-studio.html"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "author-studio.html"
        else
            echo "Open in browser: author-studio.html"
        fi
        ;;
    *)
        echo -e "${YELLOW}Invalid choice${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}✅ GitHub authentication system ready!${NC}"
echo ""
echo "The system will:"
echo "• Use your existing OAuth cookies if available"
echo "• Automatically configure Git with your credentials"
echo "• Push to GitHub without manual configuration"
echo ""
echo -e "${CYAN}Press Ctrl+C to stop the OAuth server${NC}"

# Keep script running if OAuth server was started
if [ -n "$OAUTH_PID" ]; then
    wait $OAUTH_PID
fi