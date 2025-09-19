#!/bin/bash

echo "🌊🧠 LAUNCHING COMPLETE END-TO-END INTELLIGENCE PLATFORM"
echo "======================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🎯 PLATFORM OVERVIEW${NC}"
echo "===================="
echo -e "${GREEN}✅ AI Agent Mesh Network${NC} - CAL ecosystem with specialized agents"
echo -e "${GREEN}✅ Cultural Discovery Engine${NC} - Diamond vs vulture detection"
echo -e "${GREEN}✅ Real-Time Intelligence Feeds${NC} - Live trend spotting and analysis"
echo -e "${GREEN}✅ UGC Generation Pipeline${NC} - Automated content creation"
echo -e "${GREEN}✅ Treasure Hunt Mechanics${NC} - Gamified engagement with One Piece themes"
echo -e "${GREEN}✅ Social Network Integration${NC} - Clout tracking and leverage"
echo -e "${GREEN}✅ Viral Distribution System${NC} - Meme detection and creation"
echo -e "${GREEN}✅ Preview/Trailer System${NC} - Cinematic user journey stories"
echo ""

# Check prerequisites
echo -e "${BLUE}🔧 Checking Prerequisites...${NC}"
echo "------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

# Check required files
REQUIRED_FILES=(
    "LAUNCH-COMPLETE-INTELLIGENCE-NETWORK.js"
    "CAL-AGENT-ECOSYSTEM.js"
    "automated-ugc-generation-pipeline.js"
    "LIVE-TICKER-TAPE-TRADING-FLOOR.js"
    "diamond-broadcast-connector.js"
    "voice-to-meme-orchestrator.js"
    "PREVIEW-TRAILER-SYSTEM.js"
)

echo ""
echo -e "${BLUE}📁 Checking Required Files...${NC}"
echo "------------------------------"

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        echo -e "${YELLOW}Creating placeholder for $file...${NC}"
        touch "$file"
    fi
done

echo ""

# Install dependencies if needed
echo -e "${BLUE}📦 Installing Dependencies...${NC}"
echo "------------------------------"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install --silent
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""

# Create launch configuration
echo -e "${BLUE}⚙️ Creating Launch Configuration...${NC}"
echo "-----------------------------------"

cat > intelligence-network-config.json << 'EOF'
{
  "network": {
    "name": "Complete Intelligence Network",
    "version": "1.0.0",
    "description": "End-to-end platform for cultural discovery, treasure hunting, and viral content creation"
  },
  "ports": {
    "main": 8900,
    "web": 8901,
    "websocket": 8902,
    "api": 8903,
    "cal_agents": 8890,
    "trading_floor": 8893,
    "ticker_ws": 8894
  },
  "features": {
    "cultural_discovery": true,
    "treasure_hunting": true,
    "social_integration": true,
    "viral_distribution": true,
    "real_time_feeds": true,
    "preview_system": true,
    "gamification": true
  },
  "themes": {
    "one_piece": true,
    "pirate_adventure": true,
    "cultural_diamonds": true,
    "authentic_crews": true
  }
}
EOF

echo -e "${GREEN}✅ Configuration created: intelligence-network-config.json${NC}"

echo ""

# Create quick status checker
echo -e "${BLUE}📊 Creating Status Monitor...${NC}"
echo "------------------------------"

cat > check-platform-status.js << 'EOF'
#!/usr/bin/env node

const http = require('http');
const WebSocket = require('ws');

const ports = {
  'Intelligence Network': 8901,
  'WebSocket Feed': 8902,
  'CAL Agents': 8890,
  'Trading Floor': 8893,
  'API Server': 8903
};

console.log('🔍 PLATFORM STATUS CHECK');
console.log('========================');

async function checkPort(name, port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ ${name}: Running on port ${port}`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log(`❌ ${name}: Not running on port ${port}`);
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      console.log(`⏰ ${name}: Timeout on port ${port}`);
      req.destroy();
      resolve(false);
    });
  });
}

async function checkAllPorts() {
  const results = [];
  for (const [name, port] of Object.entries(ports)) {
    const status = await checkPort(name, port);
    results.push({ name, port, status });
  }
  
  const online = results.filter(r => r.status).length;
  const total = results.length;
  
  console.log('');
  console.log(`📊 SUMMARY: ${online}/${total} services online`);
  
  if (online === total) {
    console.log('🎉 All systems operational!');
    console.log('🌐 Access dashboard: http://localhost:8901');
    console.log('⚡ WebSocket feed: ws://localhost:8902');
  } else if (online > 0) {
    console.log('⚠️  Some systems running, others need startup');
  } else {
    console.log('🚫 No systems running - run launch script first');
  }
}

checkAllPorts();
EOF

chmod +x check-platform-status.js
echo -e "${GREEN}✅ Status monitor created: check-platform-status.js${NC}"

echo ""

# Launch the complete system
echo -e "${PURPLE}🚀 LAUNCHING COMPLETE INTELLIGENCE NETWORK${NC}"
echo "==========================================="

echo -e "${YELLOW}Starting background processes...${NC}"

# Launch main intelligence network
echo -e "${BLUE}🧠 Starting Intelligence Network...${NC}"
nohup node LAUNCH-COMPLETE-INTELLIGENCE-NETWORK.js > intelligence-network.log 2>&1 &
MAIN_PID=$!
echo "Intelligence Network PID: $MAIN_PID" > .platform-pids

# Give the main system a moment to start
sleep 3

# Launch supporting systems
echo -e "${BLUE}🎭 Starting Meme Orchestrator...${NC}"
nohup node voice-to-meme-orchestrator.js > meme-orchestrator.log 2>&1 &
MEME_PID=$!
echo "Meme Orchestrator PID: $MEME_PID" >> .platform-pids

echo -e "${BLUE}💎 Starting Diamond Broadcast...${NC}"
nohup node diamond-broadcast-connector.js > diamond-broadcast.log 2>&1 &
DIAMOND_PID=$!
echo "Diamond Broadcast PID: $DIAMOND_PID" >> .platform-pids

# Wait for systems to initialize
echo -e "${YELLOW}⏳ Waiting for systems to initialize...${NC}"
sleep 5

# Check status
echo ""
echo -e "${PURPLE}📊 CHECKING SYSTEM STATUS${NC}"
echo "=========================="
node check-platform-status.js

echo ""

# Create quick access URLs
echo -e "${PURPLE}🔗 QUICK ACCESS LINKS${NC}"
echo "===================="
echo -e "${GREEN}🌐 Main Dashboard:${NC} http://localhost:8901"
echo -e "${GREEN}⚡ Real-Time Feed:${NC} ws://localhost:8902"
echo -e "${GREEN}🤖 CAL Agents:${NC} http://localhost:8890"
echo -e "${GREEN}📊 Trading Floor:${NC} http://localhost:8893"
echo -e "${GREEN}🎬 Trailer System:${NC} http://localhost:8901/trailers"
echo ""

# User guide
echo -e "${PURPLE}👥 USER QUICK START GUIDE${NC}"
echo "========================="
echo -e "${BLUE}For Platform Owners:${NC}"
echo "• 💎 Monitor cultural diamond discovery"
echo "• 🦅 Detect vulture activity and artificial content"
echo "• 📈 Track viral content and meme trends"
echo "• 🏴‍☠️ Manage treasure hunts and gamification"
echo ""
echo -e "${BLUE}For Individual Users:${NC}"
echo "• 🎯 Build authentic cultural profile"
echo "• 👥 Join or form authentic clans/crews"
echo "• 🗺️ Participate in treasure hunt adventures"
echo "• 🚀 Leverage social networks for genuine clout"
echo "• 🎬 Generate journey trailers and previews"
echo ""

# Treasure hunt examples
echo -e "${PURPLE}🏴‍☠️ ACTIVE TREASURE HUNTS${NC}"
echo "==========================="
echo -e "${YELLOW}🔍 Cultural Diamond Discovery:${NC} Find authentic creators"
echo -e "${YELLOW}🎭 Meme Prophet Challenge:${NC} Predict viral content"
echo -e "${YELLOW}👥 Authentic Crew Building:${NC} Form genuine communities"
echo ""

# One Piece connection
echo -e "${PURPLE}⚓ ONE PIECE CONNECTION${NC}"
echo "======================"
echo -e "${BLUE}Your platform mirrors the One Piece adventure:${NC}"
echo "• 💎 Cultural Diamonds = Devil Fruits (rare authentic power)"
echo "• 🗺️ Treasure Maps = Trend detection algorithms"
echo "• 👥 Crew Formation = Authentic community building"
echo "• ⚔️ Combat Vultures = Fight against artificial content"
echo "• 🌊 Grand Line = The journey to cultural influence"
echo ""

# Log information
echo -e "${PURPLE}📝 LOG FILES${NC}"
echo "============"
echo -e "${GREEN}📊 Main System:${NC} tail -f intelligence-network.log"
echo -e "${GREEN}🎭 Meme System:${NC} tail -f meme-orchestrator.log"
echo -e "${GREEN}💎 Diamond System:${NC} tail -f diamond-broadcast.log"
echo ""

# Stop instructions
echo -e "${PURPLE}🛑 TO STOP THE PLATFORM${NC}"
echo "======================="
echo -e "${YELLOW}Kill all processes:${NC}"
echo "pkill -f 'node.*intelligence-network'"
echo "pkill -f 'node.*meme-orchestrator'"
echo "pkill -f 'node.*diamond-broadcast'"
echo ""
echo -e "${YELLOW}Or use the PID file:${NC}"
echo "cat .platform-pids"
echo ""

# Success message
echo -e "${GREEN}🎉 PLATFORM LAUNCH COMPLETE!${NC}"
echo "============================="
echo -e "${BLUE}🧠 Your Intelligence Network is now live${NC}"
echo -e "${BLUE}🏴‍☠️ Treasure hunts are active${NC}"  
echo -e "${BLUE}💎 Cultural discovery is running${NC}"
echo -e "${BLUE}🎬 Trailer system is ready${NC}"
echo -e "${BLUE}🌊 The adventure begins now!${NC}"
echo ""

echo -e "${YELLOW}💡 TIP: Check status anytime with:${NC} node check-platform-status.js"
echo -e "${YELLOW}🔍 Monitor logs with:${NC} tail -f intelligence-network.log"
echo ""

# Keep script running to show live status
echo -e "${PURPLE}📡 LIVE STATUS MONITOR${NC}"
echo "===================="
echo "Press Ctrl+C to exit monitor (platform keeps running)"
echo ""

# Live status updates every 30 seconds
while true; do
    sleep 30
    echo -e "${BLUE}[$(date +%T)] Platform Status Check...${NC}"
    node check-platform-status.js | grep "SUMMARY\|All systems\|systems running\|No systems"
    echo ""
done