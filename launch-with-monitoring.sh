#!/bin/bash

# 🚀 LAUNCH WITH MONITORING
# Starts any service with real-time monitoring, testing, and suggestions

echo "🚀 LAUNCH WITH MONITORING"
echo "========================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if command provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ No command provided${NC}"
    echo "Usage: $0 <command> [args...]"
    echo "Example: $0 node business-accounting-system.js"
    exit 1
fi

# Get command and args
COMMAND=$1
shift
ARGS="$@"

# Extract service name and port
SERVICE_NAME=$(basename "$COMMAND" .js)
PORT=""

# Try to detect port from args
for arg in $ARGS; do
    if [[ $arg =~ --port[=:]([0-9]+) ]]; then
        PORT="${BASH_REMATCH[1]}"
    elif [[ $arg =~ ^[0-9]+$ ]]; then
        PORT="$arg"
    fi
done

# If no port in args, try to detect from filename
if [ -z "$PORT" ]; then
    case "$SERVICE_NAME" in
        "business-accounting-system") PORT=3013 ;;
        "tax-intelligence-engine") PORT=3014 ;;
        "wallet-address-manager") PORT=3015 ;;
        "unified-ai-debugging-dashboard") PORT=9500 ;;
        "SERVICE-DISCOVERY-ENGINE") PORT=9999 ;;
        *) 
            # Try to find port in file
            if [ -f "$COMMAND" ]; then
                PORT=$(grep -E "port\s*[=:]\s*[0-9]+" "$COMMAND" | head -1 | grep -oE "[0-9]+" | head -1)
            fi
            ;;
    esac
fi

echo -e "${BLUE}📊 Service: ${SERVICE_NAME}${NC}"
echo -e "${BLUE}🔌 Command: ${COMMAND} ${ARGS}${NC}"
[ -n "$PORT" ] && echo -e "${BLUE}🌐 Port: ${PORT}${NC}"
echo ""

# Check dependencies
echo -e "${YELLOW}📦 Checking dependencies...${NC}"

# Ensure monitoring tools exist
if [ ! -f "real-time-test-monitor.js" ]; then
    echo -e "${RED}❌ real-time-test-monitor.js not found${NC}"
    echo -e "${YELLOW}Creating monitoring infrastructure...${NC}"
    
    # Install required packages if missing
    if ! npm list uuid >/dev/null 2>&1; then
        echo "Installing required packages..."
        npm install uuid colors sqlite3 axios
    fi
fi

# Create logs directory
mkdir -p logs

# Start the monitoring wrapper
echo -e "${GREEN}🔍 Starting with real-time monitoring...${NC}"
echo ""

# Build monitoring command
MONITOR_CMD="node real-time-test-monitor.js $COMMAND $ARGS"

# Add port if detected
if [ -n "$PORT" ]; then
    export MONITOR_PORT="$PORT"
fi

# Run with monitoring
exec $MONITOR_CMD