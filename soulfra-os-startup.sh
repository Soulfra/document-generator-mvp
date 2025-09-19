#!/bin/bash

#################################################################################
# SOULFRA PERSONAL OS STARTUP SCRIPT
# 
# Complete initialization system that:
# - Connects user logins to our system
# - Collects profile information during onboarding
# - Links everything to the login screen
# - Activates all internal authentication and document systems
#################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Banner
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ███████╗ ██████╗ ██╗   ██╗██╗     ███████╗██████╗  █████╗             ║
║   ██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗██╔══██╗            ║
║   ███████╗██║   ██║██║   ██║██║     █████╗  ██████╔╝███████║            ║
║   ╚════██║██║   ██║██║   ██║██║     ██╔══╝  ██╔══██╗██╔══██║            ║
║   ███████║╚██████╔╝╚██████╔╝███████╗██║     ██║  ██║██║  ██║            ║
║   ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝            ║
║                                                                           ║
║                    P E R S O N A L   O S   S T A R T U P                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
SOULFRA_HOME="${SOULFRA_HOME:-$HOME/.soulfra}"
SOULFRA_CONFIG="$SOULFRA_HOME/config"
SOULFRA_PROFILE="$SOULFRA_HOME/profile"
SOULFRA_LOGS="$SOULFRA_HOME/logs"
SOULFRA_VAULT="$SOULFRA_HOME/vault"

# Create directories
mkdir -p "$SOULFRA_CONFIG" "$SOULFRA_PROFILE" "$SOULFRA_LOGS" "$SOULFRA_VAULT"

# Log file for this session
LOG_FILE="$SOULFRA_LOGS/startup-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}[$(date '+%H:%M:%S')] Starting SoulFRA Personal OS...${NC}"

#################################################################################
# PHASE 1: SYSTEM CHECK
#################################################################################

echo -e "\n${YELLOW}▶ Phase 1: System Check${NC}"

check_dependency() {
    local cmd=$1
    local install_cmd=$2
    
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "${RED}  ✗ $cmd not found${NC}"
        if [ -n "$install_cmd" ]; then
            echo -e "${YELLOW}    Install with: $install_cmd${NC}"
        fi
        return 1
    else
        echo -e "${GREEN}  ✓ $cmd found${NC}"
        return 0
    fi
}

# Check required dependencies
MISSING_DEPS=0
check_dependency "node" "brew install node" || MISSING_DEPS=$((MISSING_DEPS + 1))
check_dependency "git" "brew install git" || MISSING_DEPS=$((MISSING_DEPS + 1))
check_dependency "jq" "brew install jq" || MISSING_DEPS=$((MISSING_DEPS + 1))
check_dependency "docker" "Download Docker Desktop" || true  # Optional

if [ $MISSING_DEPS -gt 0 ]; then
    echo -e "\n${RED}Missing $MISSING_DEPS required dependencies. Please install them first.${NC}"
    exit 1
fi

#################################################################################
# PHASE 2: PROFILE CHECK/CREATION
#################################################################################

echo -e "\n${YELLOW}▶ Phase 2: User Profile${NC}"

PROFILE_FILE="$SOULFRA_PROFILE/user.json"

if [ -f "$PROFILE_FILE" ]; then
    echo -e "${GREEN}  ✓ Profile found${NC}"
    USER_NAME=$(jq -r '.name' "$PROFILE_FILE")
    echo -e "${CYAN}    Welcome back, $USER_NAME!${NC}"
else
    echo -e "${YELLOW}  → Creating new profile...${NC}"
    
    # Interactive profile creation
    echo -e "\n${PURPLE}Let's set up your SoulFRA profile:${NC}"
    
    read -p "  Name: " USER_NAME
    read -p "  Email: " USER_EMAIL
    read -p "  Organization (optional): " USER_ORG
    
    # Ask about preferences
    echo -e "\n${PURPLE}Quick preferences:${NC}"
    
    PS3="  Preferred authentication method: "
    select AUTH_METHOD in "GitHub" "Google" "Microsoft" "Anonymous"; do
        break
    done
    
    PS3="  Primary use case: "
    select USE_CASE in "Development" "Research" "Education" "Business" "Personal"; do
        break
    done
    
    PS3="  Experience level: "
    select EXPERIENCE in "Beginner" "Intermediate" "Advanced" "Expert"; do
        break
    done
    
    # Create profile
    cat > "$PROFILE_FILE" << EOF
{
  "name": "$USER_NAME",
  "email": "$USER_EMAIL",
  "organization": "$USER_ORG",
  "preferences": {
    "authMethod": "$AUTH_METHOD",
    "useCase": "$USE_CASE",
    "experience": "$EXPERIENCE"
  },
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "profileId": "soulfra-$(uuidgen | tr '[:upper:]' '[:lower:]')"
}
EOF
    
    echo -e "${GREEN}  ✓ Profile created${NC}"
fi

# Load profile ID
PROFILE_ID=$(jq -r '.profileId' "$PROFILE_FILE")

#################################################################################
# PHASE 3: AUTHENTICATION INITIALIZATION
#################################################################################

echo -e "\n${YELLOW}▶ Phase 3: Authentication System${NC}"

# Check if auth daemon is running
if pgrep -f "soulfra-auth-daemon" > /dev/null; then
    echo -e "${GREEN}  ✓ Auth daemon already running${NC}"
else
    echo -e "${BLUE}  → Starting auth daemon...${NC}"
    
    # Start the auth daemon in background
    if [ -f "./soulfra-auth-daemon.js" ]; then
        node ./soulfra-auth-daemon.js start > "$SOULFRA_LOGS/auth-daemon.log" 2>&1 &
        AUTH_DAEMON_PID=$!
        echo $AUTH_DAEMON_PID > "$SOULFRA_HOME/auth-daemon.pid"
        
        # Wait for daemon to be ready
        sleep 2
        
        if kill -0 $AUTH_DAEMON_PID 2>/dev/null; then
            echo -e "${GREEN}  ✓ Auth daemon started (PID: $AUTH_DAEMON_PID)${NC}"
        else
            echo -e "${RED}  ✗ Auth daemon failed to start${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠ Auth daemon not found, skipping${NC}"
    fi
fi

# Check authentication status
echo -e "${BLUE}  → Checking authentication status...${NC}"

AUTH_STATUS=$(node ./soulfra-auth.js status 2>/dev/null || echo "error")

if echo "$AUTH_STATUS" | grep -q "Connected"; then
    echo -e "${GREEN}  ✓ Already authenticated${NC}"
else
    echo -e "${YELLOW}  → No active authentication found${NC}"
    
    # Get preferred auth method from profile
    PREF_AUTH=$(jq -r '.preferences.authMethod' "$PROFILE_FILE" | tr '[:upper:]' '[:lower:]')
    
    echo -e "${PURPLE}  Would you like to authenticate now? (recommended)${NC}"
    read -p "  [Y/n]: " AUTH_NOW
    
    if [[ "$AUTH_NOW" != "n" && "$AUTH_NOW" != "N" ]]; then
        echo -e "${BLUE}  → Starting OAuth flow for $PREF_AUTH...${NC}"
        node ./soulfra-auth.js login "$PREF_AUTH" || true
    fi
fi

#################################################################################
# PHASE 4: DOCUMENT SYSTEM ACTIVATION
#################################################################################

echo -e "\n${YELLOW}▶ Phase 4: Document System${NC}"

# Check for encryption keys
if [ -f "./.vault/keys/master_key.enc" ]; then
    echo -e "${GREEN}  ✓ Encryption keys found${NC}"
else
    echo -e "${YELLOW}  → Generating encryption keys...${NC}"
    
    # Initialize vault system
    if [ -f "./vault-init.js" ]; then
        node ./vault-init.js init --profile-id "$PROFILE_ID" || true
    fi
fi

# Check for document index
if [ -f "./services/crawling/document-index.json" ]; then
    echo -e "${GREEN}  ✓ Document index found${NC}"
    DOC_COUNT=$(jq '.documents | length' "./services/crawling/document-index.json" 2>/dev/null || echo "0")
    echo -e "${CYAN}    Indexed documents: $DOC_COUNT${NC}"
else
    echo -e "${YELLOW}  → Building document index...${NC}"
    
    # Run document crawler
    if [ -f "./services/crawling/document-web-crawler.js" ]; then
        node ./services/crawling/document-web-crawler.js index || true
    fi
fi

#################################################################################
# PHASE 5: SERVICE INITIALIZATION
#################################################################################

echo -e "\n${YELLOW}▶ Phase 5: Core Services${NC}"

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    local start_cmd=$3
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
        echo -e "${GREEN}  ✓ $name is running${NC}"
        return 0
    else
        echo -e "${YELLOW}  → Starting $name...${NC}"
        if [ -n "$start_cmd" ]; then
            eval "$start_cmd" &
            sleep 2
        fi
        return 1
    fi
}

# Start core services if not running
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo -e "${BLUE}  → Checking Docker services...${NC}"
    
    if docker-compose ps 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}  ✓ Docker services running${NC}"
    else
        echo -e "${YELLOW}  → Starting Docker services...${NC}"
        docker-compose up -d || true
    fi
else
    echo -e "${YELLOW}  ⚠ Docker not available, using local services${NC}"
    
    # Start local services
    check_service "Template Processor" "http://localhost:3000" \
        "cd mcp && npm start > $SOULFRA_LOGS/mcp.log 2>&1"
    
    check_service "AI Service" "http://localhost:3001" \
        "cd FinishThisIdea-Complete && npm run start:ai > $SOULFRA_LOGS/ai.log 2>&1"
fi

#################################################################################
# PHASE 6: LOGIN SCREEN ACTIVATION
#################################################################################

echo -e "\n${YELLOW}▶ Phase 6: Login Interface${NC}"

# Check which interface to launch
INTERFACE_PREF=$(jq -r '.preferences.interface // "web"' "$PROFILE_FILE")

case "$INTERFACE_PREF" in
    "terminal"|"tui")
        echo -e "${BLUE}  → Launching terminal interface...${NC}"
        if [ -f "./soulfra-auth-tui.js" ]; then
            # Launch in new terminal window
            if [[ "$OSTYPE" == "darwin"* ]]; then
                osascript -e "tell app \"Terminal\" to do script \"cd '$PWD' && node soulfra-auth-tui.js\""
            else
                gnome-terminal -- bash -c "cd '$PWD' && node soulfra-auth-tui.js; exec bash"
            fi
        fi
        ;;
    *)
        echo -e "${BLUE}  → Launching web interface...${NC}"
        
        # Start web server if not running
        if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
            if [ -f "./soulfra-control-center.html" ]; then
                # Simple Python server
                python3 -m http.server 8080 --directory . > "$SOULFRA_LOGS/web-server.log" 2>&1 &
                WEB_PID=$!
                echo $WEB_PID > "$SOULFRA_HOME/web-server.pid"
                sleep 1
            fi
        fi
        
        # Open browser
        echo -e "${GREEN}  ✓ Opening control center...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "http://localhost:8080/soulfra-control-center.html"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:8080/soulfra-control-center.html"
        fi
        ;;
esac

#################################################################################
# PHASE 7: INTEGRATION VERIFICATION
#################################################################################

echo -e "\n${YELLOW}▶ Phase 7: System Integration${NC}"

# Create integration status file
INTEGRATION_STATUS="$SOULFRA_CONFIG/integration-status.json"

cat > "$INTEGRATION_STATUS" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "profileId": "$PROFILE_ID",
  "status": {
    "auth": $(pgrep -f "soulfra-auth-daemon" > /dev/null && echo "true" || echo "false"),
    "documents": $([ -f "./services/crawling/document-index.json" ] && echo "true" || echo "false"),
    "vault": $([ -f "./.vault/keys/master_key.enc" ] && echo "true" || echo "false"),
    "services": $(curl -s http://localhost:3000 > /dev/null 2>&1 && echo "true" || echo "false"),
    "interface": $(curl -s http://localhost:8080 > /dev/null 2>&1 && echo "true" || echo "false")
  },
  "connections": []
}
EOF

# Test connections
echo -e "${BLUE}  → Testing system connections...${NC}"

# Test auth bridge
if curl -s http://localhost:8463/api/status > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Auth bridge connected${NC}"
    jq '.connections += ["auth-bridge"]' "$INTEGRATION_STATUS" > "$INTEGRATION_STATUS.tmp" && mv "$INTEGRATION_STATUS.tmp" "$INTEGRATION_STATUS"
fi

# Test document system
if [ -f "./services/crawling/link-analysis-engine.js" ]; then
    echo -e "${GREEN}  ✓ Document analysis ready${NC}"
    jq '.connections += ["document-analysis"]' "$INTEGRATION_STATUS" > "$INTEGRATION_STATUS.tmp" && mv "$INTEGRATION_STATUS.tmp" "$INTEGRATION_STATUS"
fi

# Test reasoning layer
if [ -f "./reasoning-differential-engine.js" ]; then
    echo -e "${GREEN}  ✓ Reasoning engine ready${NC}"
    jq '.connections += ["reasoning-engine"]' "$INTEGRATION_STATUS" > "$INTEGRATION_STATUS.tmp" && mv "$INTEGRATION_STATUS.tmp" "$INTEGRATION_STATUS"
fi

#################################################################################
# PHASE 8: FINAL STATUS
#################################################################################

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ SoulFRA Personal OS Started Successfully!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${PURPLE}System Status:${NC}"
echo -e "  Profile ID: ${CYAN}$PROFILE_ID${NC}"
echo -e "  User: ${CYAN}$USER_NAME${NC}"
echo -e "  Auth Status: $(pgrep -f "soulfra-auth-daemon" > /dev/null && echo -e "${GREEN}Active${NC}" || echo -e "${YELLOW}Inactive${NC}")"
echo -e "  Documents: ${CYAN}$DOC_COUNT indexed${NC}"
echo -e "  Interface: ${CYAN}http://localhost:8080${NC}"

echo -e "\n${PURPLE}Quick Commands:${NC}"
echo -e "  ${CYAN}soulfra-auth status${NC} - Check authentication"
echo -e "  ${CYAN}soulfra-auth login github${NC} - Login with GitHub"
echo -e "  ${CYAN}node soulfra-auth-tui.js${NC} - Terminal interface"
echo -e "  ${CYAN}./soulfra-os-startup.sh${NC} - Run this script again"

echo -e "\n${PURPLE}Voice Commands (say 'SoulFra' first):${NC}"
echo -e "  'Login to GitHub' - OAuth authentication"
echo -e "  'What is connected?' - System status"
echo -e "  'Show my profile' - Profile information"

# Save startup completion marker
date > "$SOULFRA_HOME/.startup-complete"

echo -e "\n${GREEN}Ready to go! Your personal OS is now active.${NC}"
echo -e "${CYAN}Check the browser window or terminal interface to continue.${NC}\n"

# Keep script running if in background mode
if [[ "$1" == "--daemon" ]]; then
    echo -e "${YELLOW}Running in daemon mode. Press Ctrl+C to stop.${NC}"
    tail -f /dev/null
fi