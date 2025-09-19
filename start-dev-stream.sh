#!/bin/bash

# START DEV STREAM - Launch script for the complete dev streaming system

echo "🎬 Starting Dev Stream System..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for required dependencies
echo "📋 Checking dependencies..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git is not installed${NC}"
    exit 1
fi

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install tmi.js express ws chokidar xmlbuilder2 axios
fi

# Create feeds directory if it doesn't exist
mkdir -p feeds

# Load environment variables if .env exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Loading environment variables${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo "Create a .env file with:"
    echo "  TWITCH_CHANNEL=yourchannel"
    echo "  TWITCH_BOT_USERNAME=yourbotname"
    echo "  TWITCH_OAUTH=oauth:yourtoken"
    echo "  DISCORD_WEBHOOK=https://discord.com/api/webhooks/..."
    echo "  SLACK_WEBHOOK=https://hooks.slack.com/services/..."
    echo ""
fi

# Get project name and path
PROJECT_NAME=${1:-$(basename "$PWD")}
REPO_PATH=${2:-$PWD}

echo ""
echo "🚀 Launching Dev Stream Orchestrator"
echo "====================================="
echo "📁 Project: $PROJECT_NAME"
echo "📂 Repository: $REPO_PATH"
echo ""

# Check if Twitch is configured
if [ -n "$TWITCH_CHANNEL" ]; then
    echo -e "${GREEN}✅ Twitch integration enabled${NC}"
    echo "   Channel: $TWITCH_CHANNEL"
else
    echo -e "${YELLOW}⚠️  Twitch integration disabled (no channel configured)${NC}"
fi

# Check if webhooks are configured
if [ -n "$DISCORD_WEBHOOK" ]; then
    echo -e "${GREEN}✅ Discord webhook configured${NC}"
fi

if [ -n "$SLACK_WEBHOOK" ]; then
    echo -e "${GREEN}✅ Slack webhook configured${NC}"
fi

echo ""
echo "Starting services..."
echo ""

# Start the orchestrator
node dev-stream-orchestrator.js "$PROJECT_NAME" "$REPO_PATH"

# The script will continue running until Ctrl+C is pressed