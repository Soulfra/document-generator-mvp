#!/bin/bash

# LAUNCH UNIFIED GAME
# Single server, single client - like RuneScape!

echo "🎮 LAUNCHING UNIFIED GAME SYSTEM"
echo "================================"
echo "One server, one client, proper architecture!"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    
    # Check if database exists, create if not
    echo "🔍 Checking database..."
    if psql -h localhost -p 5432 -U postgres -lqt | cut -d \| -f 1 | grep -qw document_generator_game; then
        echo -e "${GREEN}✅ Database 'document_generator_game' exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Database doesn't exist, creating it...${NC}"
        createdb -h localhost -p 5432 -U postgres document_generator_game 2>/dev/null || {
            echo -e "${RED}❌ Failed to create database${NC}"
            echo "Try creating it manually:"
            echo "  createdb document_generator_game"
            echo "  OR"
            echo "  psql -U postgres -c 'CREATE DATABASE document_generator_game;'"
            exit 1
        }
        echo -e "${GREEN}✅ Database created successfully${NC}"
    fi
else
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql (macOS)"
    echo "  sudo systemctl start postgresql (Linux)"
    exit 1
fi

# Kill any existing game processes
echo ""
echo "🧹 Cleaning up old processes..."

# Kill old game server
pkill -f "unified-game-server.js" 2>/dev/null

# Kill other Node processes that might interfere
pkill -f "guardian-teacher-system.js" 2>/dev/null
pkill -f "ai-agent-crypto-casino" 2>/dev/null
pkill -f "special-services-orchestrator.js" 2>/dev/null
pkill -f "infinity-router-system.js" 2>/dev/null

echo "✅ Old processes cleaned up"

# Create logs directory
mkdir -p logs

# Start the game server with logging
echo ""
echo "🚀 Starting unified game server..."
node unified-game-server.js > logs/game-server.log 2>&1 &
SERVER_PID=$!

# Check if process started
sleep 1
if ! ps -p $SERVER_PID > /dev/null; then
    echo -e "${RED}❌ Server failed to start!${NC}"
    echo "Check logs/game-server.log for errors:"
    tail -n 20 logs/game-server.log
    exit 1
fi

echo "✅ Game server process started (PID: $SERVER_PID)"

# Wait for server to be ready with proper health check
echo ""
echo "⏳ Waiting for server to initialize..."
RETRIES=0
MAX_RETRIES=10

while [ $RETRIES -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8080/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Game server is healthy!${NC}"
        break
    else
        if ! ps -p $SERVER_PID > /dev/null; then
            echo -e "${RED}❌ Server crashed during startup!${NC}"
            echo "Recent logs:"
            tail -n 20 logs/game-server.log
            exit 1
        fi
        echo -e "${YELLOW}⏳ Still waiting... ($((RETRIES + 1))/$MAX_RETRIES)${NC}"
        sleep 2
        RETRIES=$((RETRIES + 1))
    fi
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Server failed to become healthy${NC}"
    echo "Check logs/game-server.log for errors"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Open the game client
echo ""
echo "🌐 Opening game client..."
if command -v open >/dev/null 2>&1; then
    # macOS
    open unified-game-client.html
elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    xdg-open unified-game-client.html
else
    echo "Please open unified-game-client.html in your browser"
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎮 UNIFIED GAME IS RUNNING!${NC}"
echo ""
echo "Server: http://localhost:8080"
echo "Client: Open unified-game-client.html"
echo ""
echo "Game Controls:"
echo "  • WASD or Arrow Keys - Move"
echo "  • Left Click - Interact/Move to location"
echo "  • Right Click - More options"
echo "  • Enter - Chat"
echo ""
echo "To stop the game: Press Ctrl+C"
echo "================================================"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down game..."
    kill $SERVER_PID 2>/dev/null
    echo "✅ Game stopped"
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
done