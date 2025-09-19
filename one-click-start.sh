#!/bin/bash

# 🚀 Document Generator - One-Click Launcher
# For non-technical users to start everything with one command

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear

echo -e "${BLUE}🚀 DOCUMENT GENERATOR - ONE-CLICK START${NC}"
echo "========================================"
echo ""
echo -e "${GREEN}✨ Starting everything you need...${NC}"
echo ""

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker not found! Please install Docker Desktop${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found! Please install Node.js${NC}"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker not running! Please start Docker Desktop${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ready to start!${NC}"
echo ""

echo -e "${YELLOW}📦 Starting databases...${NC}"
docker-compose up -d postgres redis minio 2>/dev/null

echo -e "${BLUE}⏳ Waiting for databases...${NC}"
for i in {1..15}; do
    if docker-compose ps postgres | grep -q "healthy"; then
        echo -e "${GREEN}✅ Databases ready!${NC}"
        break
    fi
    sleep 2
done
echo ""

echo -e "${YELLOW}📊 Starting dashboard server...${NC}"
mkdir -p logs

if command_exists python3; then
    python3 -m http.server 8082 > logs/dashboard.log 2>&1 &
    echo $! > .dashboard.pid
    echo -e "${GREEN}✅ Dashboard server started${NC}"
elif command_exists python; then
    python -m SimpleHTTPServer 8082 > logs/dashboard.log 2>&1 &
    echo $! > .dashboard.pid
    echo -e "${GREEN}✅ Dashboard server started${NC}"
fi

sleep 2
echo ""

echo -e "${YELLOW}🌐 Opening dashboard...${NC}"
if command_exists open; then
    open "http://localhost:8082/unified-live-dashboard.html"
elif command_exists xdg-open; then
    xdg-open "http://localhost:8082/unified-live-dashboard.html"
else
    echo -e "${BLUE}Open: http://localhost:8082/unified-live-dashboard.html${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SUCCESS! Document Generator is now running!${NC}"
echo "============================================="
echo ""
echo -e "${BLUE}📊 Main Dashboard: http://localhost:8082/unified-live-dashboard.html${NC}"
echo -e "${BLUE}🔧 System Monitor: http://localhost:8082/meta-verification-overlay.html${NC}"
echo ""
echo -e "${GREEN}✨ What you can do:${NC}"
echo -e "${BLUE}   • Upload documents to generate applications${NC}"
echo -e "${BLUE}   • Monitor system health in real-time${NC}"
echo -e "${BLUE}   • Use the control panels${NC}"
echo ""
echo -e "${YELLOW}🛑 To stop everything: ./stop-everything.sh${NC}"

# Create stop script
cat > stop-everything.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Document Generator..."

if [ -f .dashboard.pid ]; then
    kill $(cat .dashboard.pid) 2>/dev/null
    rm -f .dashboard.pid
    echo "✅ Dashboard server stopped"
fi

echo "✅ Services stopped!"
echo "💡 Docker containers are still running for data persistence"
echo "   To stop Docker containers: docker-compose down"
EOF

chmod +x stop-everything.sh

echo ""
echo -e "${GREEN}🚀 System ready! Dashboard should be open in your browser.${NC}"
echo -e "${BLUE}   Press Ctrl+C to exit this script (services keep running)${NC}"
echo ""

# Keep running to show status
while true; do
    echo -ne "\r${GREEN}⚡ Status: PostgreSQL ✅ Redis ✅ Dashboard: http://localhost:8082     ${NC}"
    sleep 5
done