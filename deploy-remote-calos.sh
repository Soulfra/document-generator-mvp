#!/bin/bash

# DEPLOY REMOTE CALOs SYSTEM
# Sets up remote access via ngrok and creates sharable world-building interface
# Integrates with chat log processor and MCP crawler

echo "🌐 DEPLOY REMOTE CALOs SYSTEM"
echo "============================="
echo "Setting up remote access for world building..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}Installing ngrok...${NC}"
    
    # Try different installation methods
    if command -v brew &> /dev/null; then
        brew install ngrok/ngrok/ngrok
    elif command -v snap &> /dev/null; then
        sudo snap install ngrok
    else
        echo -e "${RED}Please install ngrok manually:${NC}"
        echo "1. Go to https://ngrok.com/download"
        echo "2. Download and install ngrok"
        echo "3. Run: ngrok authtoken YOUR_TOKEN"
        echo "4. Re-run this script"
        exit 1
    fi
fi

# Start services if not running
echo -e "${BLUE}Starting required services...${NC}"

# Start chat log processor
if ! curl -s http://localhost:7879 > /dev/null; then
    echo -e "${YELLOW}Starting CAL Chat Log Processor...${NC}"
    nohup node cal-chat-log-processor.js > logs/chat-processor.log 2>&1 &
    echo $! > pids/chat-processor.pid
    sleep 3
fi

# Start MCP crawler if not running
if ! curl -s http://localhost:7878 > /dev/null; then
    echo -e "${YELLOW}Starting MCP Crawler...${NC}"
    nohup node google-drive-mcp-crawler.js > logs/mcp-crawler.log 2>&1 &
    echo $! > pids/mcp-crawler.pid
    sleep 3
fi

# Create web server for CALOs interface
echo -e "${BLUE}Setting up CALOs web server...${NC}"

cat > calos-server.js << 'EOF'
const express = require('express');
const path = require('path');
const proxy = require('http-proxy-middleware');

const app = express();
const port = 8892;

// Serve static files
app.use(express.static('.'));

// Proxy to chat processor
app.use('/api/chat', proxy.createProxyMiddleware({
    target: 'http://localhost:7879',
    changeOrigin: true,
    pathRewrite: {
        '^/api/chat': '/api'
    }
}));

// Proxy to MCP crawler
app.use('/api/mcp', proxy.createProxyMiddleware({
    target: 'http://localhost:7878',
    changeOrigin: true,
    pathRewrite: {
        '^/api/mcp': '/api'
    }
}));

// Main CALOs interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'calos-remote-world-builder.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            chat_processor: 'http://localhost:7879',
            mcp_crawler: 'http://localhost:7878',
            calos_interface: `http://localhost:${port}`
        }
    });
});

app.listen(port, () => {
    console.log(`🌐 CALOs Remote Interface: http://localhost:${port}`);
    console.log('🔗 Ready for remote access via ngrok');
});
EOF

# Start CALOs server
echo -e "${YELLOW}Starting CALOs server...${NC}"
nohup node calos-server.js > logs/calos-server.log 2>&1 &
echo $! > pids/calos-server.pid
sleep 3

# Create ngrok configuration
echo -e "${BLUE}Setting up ngrok tunnels...${NC}"

cat > ngrok.yml << 'EOF'
version: "2"
authtoken: YOUR_NGROK_TOKEN_HERE
tunnels:
  calos:
    addr: 8892
    proto: http
    subdomain: calos-world-builder
    inspect: false
  chat-processor:
    addr: 7879
    proto: http
    subdomain: cal-chat-processor
    inspect: false
  mcp-crawler:
    addr: 7878
    proto: http
    subdomain: mcp-voxel-crawler
    inspect: false
EOF

# Check for existing ngrok auth token
if [ ! -f ~/.ngrok2/ngrok.yml ]; then
    echo -e "${YELLOW}Please set up ngrok authentication:${NC}"
    echo "1. Go to https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "2. Copy your authtoken"
    echo "3. Run: ngrok authtoken YOUR_TOKEN"
    echo ""
    read -p "Press Enter after setting up ngrok auth token..."
fi

# Start ngrok tunnels
echo -e "${BLUE}Starting ngrok tunnels...${NC}"

# Start main CALOs tunnel
nohup ngrok http 8892 --log=stdout > logs/ngrok-calos.log 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > pids/ngrok-calos.pid

# Wait for ngrok to start
sleep 5

# Get public URLs
echo -e "${GREEN}🎉 Remote CALOs System Deployed!${NC}"
echo ""

# Try to get ngrok URLs
CALOS_URL=""
if command -v curl &> /dev/null && command -v jq &> /dev/null; then
    CALOS_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
fi

if [ -z "$CALOS_URL" ] || [ "$CALOS_URL" = "null" ]; then
    echo -e "${YELLOW}Getting ngrok URL...${NC}"
    sleep 5
    CALOS_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
fi

if [ ! -z "$CALOS_URL" ] && [ "$CALOS_URL" != "null" ]; then
    echo -e "${GREEN}🌐 Remote CALOs Interface: ${CALOS_URL}${NC}"
    echo -e "${GREEN}🧠 Share this URL to let others build your world!${NC}"
    
    # Copy to clipboard if possible
    if command -v pbcopy &> /dev/null; then
        echo "$CALOS_URL" | pbcopy
        echo -e "${BLUE}✅ URL copied to clipboard${NC}"
    elif command -v xclip &> /dev/null; then
        echo "$CALOS_URL" | xclip -selection clipboard
        echo -e "${BLUE}✅ URL copied to clipboard${NC}"
    fi
else
    echo -e "${YELLOW}Manual URL Check:${NC}"
    echo "1. Open http://localhost:4040 in your browser"
    echo "2. Copy the HTTPS URL from ngrok dashboard"
    echo "3. Share that URL for remote access"
fi

echo ""
echo -e "${BLUE}📊 System Status:${NC}"
echo "  - CALOs Interface: http://localhost:8892"
echo "  - Chat Processor: http://localhost:7879"
echo "  - MCP Crawler: http://localhost:7878"
echo "  - Ngrok Dashboard: http://localhost:4040"
echo ""

echo -e "${BLUE}📁 Log Files:${NC}"
echo "  - CALOs Server: ./logs/calos-server.log"
echo "  - Chat Processor: ./logs/chat-processor.log"
echo "  - MCP Crawler: ./logs/mcp-crawler.log"
echo "  - Ngrok: ./logs/ngrok-calos.log"
echo ""

echo -e "${BLUE}🎮 Features Available:${NC}"
echo "  ✅ Remote world building interface"
echo "  ✅ Chat log processing and analysis"
echo "  ✅ Real-time typing pattern detection"
echo "  ✅ Voice and music context analysis"
echo "  ✅ Voxelized memory crawling"
echo "  ✅ Salmoneus-style world viewer"
echo "  ✅ CAL-powered context learning"
echo ""

echo -e "${GREEN}🚀 Your CALOs world is now accessible remotely!${NC}"
echo -e "${YELLOW}Start typing, talking, or playing music to help CAL build your world.${NC}"

# Create easy stop script
cat > stop-remote-calos.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Remote CALOs System..."

# Kill services
if [ -f pids/calos-server.pid ]; then
    kill $(cat pids/calos-server.pid) 2>/dev/null
    rm pids/calos-server.pid
fi

if [ -f pids/chat-processor.pid ]; then
    kill $(cat pids/chat-processor.pid) 2>/dev/null
    rm pids/chat-processor.pid
fi

if [ -f pids/ngrok-calos.pid ]; then
    kill $(cat pids/ngrok-calos.pid) 2>/dev/null
    rm pids/ngrok-calos.pid
fi

# Kill any remaining ngrok processes
pkill -f "ngrok http 8892" 2>/dev/null

echo "✅ Remote CALOs System stopped"
EOF

chmod +x stop-remote-calos.sh

echo -e "${BLUE}To stop the remote system: ./stop-remote-calos.sh${NC}"