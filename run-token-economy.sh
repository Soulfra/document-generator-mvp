#!/bin/bash
# run-token-economy.sh - Start the complete DGAI token economy

echo "🎰 Starting DGAI Token Economy Complete System..."
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:9495,9494,9696,9697 | xargs kill -9 2>/dev/null || true

# Start token economy service
echo -e "\n${GREEN}🎰 Starting Token Economy Service...${NC}"
node unified-token-liquidity-gacha-economy.js &
TOKEN_PID=$!

# Start billing integration
echo -e "${GREEN}💳 Starting Billing Integration...${NC}"
node stripe-monero-mirror-billing-integration.js &
BILLING_PID=$!

# Start retro gaming arena
echo -e "${GREEN}🎮 Starting Retro Gaming Arena...${NC}"
node retro-gaming-dueling-arena-broadcast.js &
GAMING_PID=$!

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to initialize...${NC}"
sleep 5

# Check if services are running
check_service() {
    local port=$1
    local name=$2
    
    if curl -s -o /dev/null "http://localhost:$port"; then
        echo -e "${GREEN}✓ $name is running on port $port${NC}"
    else
        echo -e "${RED}✗ $name failed to start on port $port${NC}"
    fi
}

echo -e "\n📊 Checking service status..."
check_service 9495 "Token Economy"
check_service 9494 "Billing System"
check_service 9697 "Gaming Arena"

# Initialize some test data
echo -e "\n🏗️ Initializing test data..."

# Create test wallets
for user in alice bob charlie diana ralph testuser; do
    curl -s -X POST "http://localhost:9495/faucet/$user" > /dev/null
    echo -e "${GREEN}✓ Wallet created for $user${NC}"
done

# Create test duel
curl -s -X POST "http://localhost:9697/api/duel/create" \
    -H "Content-Type: application/json" \
    -d '{"player1":"alice","player2":"bob","type":"no-rules","stake":500}' > /dev/null
echo -e "${GREEN}✓ Test duel created${NC}"

# Open the retro gaming portal
echo -e "\n🌐 Opening retro gaming portal..."
if command -v open &> /dev/null; then
    open "http://localhost:9697"
    open retro-gaming-portal.html
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:9697"
    xdg-open retro-gaming-portal.html
fi

# Show startup complete message
echo -e "\n${GREEN}🎉 DGAI TOKEN ECONOMY IS LIVE! 🎉${NC}"
echo "=============================================="
echo ""
echo "🎰 Token Economy:    http://localhost:9495/economy/snapshot"
echo "💳 Billing System:   http://localhost:9494/billing/status/testuser"
echo "🎮 Gaming Arena:     http://localhost:9697"
echo "📡 WebSocket Stream: ws://localhost:9696"
echo ""
echo "💰 AVAILABLE FEATURES:"
echo "  🎲 Gacha pulls with luck mechanics"
echo "  💧 Liquidity pools with agent management"
echo "  ⚔️ RuneScape-style dueling arena"
echo "  🗣️ Doctor vs Monero difficulty arguments"
echo "  ⛓️ Blockchain-verified open source ratings"
echo "  📺 Real-time broadcasting layer"
echo ""
echo "📱 NPM COMMANDS:"
echo "  npm run gacha            - Token economy only"
echo "  npm run duel-arena       - Gaming arena only"
echo "  npm run retro-portal     - Open browser portal"
echo "  npm run token-electron   - Electron app"
echo ""
echo "🎮 RETRO GAMES AVAILABLE:"
echo "  💀 Stick Death"
echo "  🔫 Madness Interactive"  
echo "  🐧 Club Penguin PVP"
echo "  ⚔️ RuneScape Duel Arena"
echo "  👽 Alien Hominid"
echo "  🎿 Line Rider"
echo "  🎈 Bloons TD"
echo "  🩸 Happy Wheels"
echo "  💥 Powder Game"
echo "  🤜 Interactive Buddy"
echo ""

# Wait for Ctrl+C
echo "Press Ctrl+C to stop all services..."

cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    kill $TOKEN_PID $BILLING_PID $GAMING_PID 2>/dev/null
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait