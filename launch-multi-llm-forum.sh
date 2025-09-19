#!/bin/bash

# 🤖🚀 MULTI-LLM FORUM LAUNCHER
# Complete forum system with 8-hop Multi-LLM routing

echo "🤖 =============================================="
echo "🤖    CAL MULTI-LLM FORUM SYSTEM LAUNCHER     "
echo "🤖 =============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    echo "📁 Loading environment variables from .env..."
    set -a
    source .env
    set +a
    echo -e "${GREEN}✅ Environment loaded${NC}"
else
    echo -e "${YELLOW}⚠️  No .env file found - using system environment only${NC}"
fi

# Check prerequisites
echo ""
echo -e "${BLUE}🔍 SYSTEM PREREQUISITES CHECK${NC}"
echo "=============================="

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js: Not installed${NC}"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check required files
REQUIRED_FILES=(
    "FORUM-MULTI-LLM-ENGINE.js"
    "FORUM-MULTI-LLM-INTEGRATION.js"
    "PRODUCTION-FORUM-API-SERVER.js"
    "REAL-FORUM-INTERFACE.html"
    "MULTI-LLM-CONFIG.json"
)

echo ""
echo -e "${BLUE}📁 REQUIRED FILES CHECK${NC}"
echo "======================="

FILES_MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ ${file}: ${GREEN}Found${NC}"
    else
        echo -e "  ❌ ${file}: ${RED}Missing${NC}"
        FILES_MISSING=$((FILES_MISSING + 1))
    fi
done

if [ $FILES_MISSING -gt 0 ]; then
    echo -e "${RED}❌ Missing required files. Please ensure all components are present.${NC}"
    exit 1
fi

# Check API keys
echo ""
echo -e "${BLUE}🔐 API KEY STATUS${NC}"
echo "================="

API_PROVIDERS=("ANTHROPIC_API_KEY" "OPENAI_API_KEY" "DEEPSEEK_API_KEY" "COHERE_API_KEY")
API_NAMES=("Anthropic Claude" "OpenAI GPT" "DeepSeek" "Cohere")
CONFIGURED_APIS=0

for i in "${!API_PROVIDERS[@]}"; do
    provider=${API_PROVIDERS[$i]}
    name=${API_NAMES[$i]}
    
    if [ -n "${!provider}" ]; then
        echo -e "  ✅ ${name}: ${GREEN}Configured${NC}"
        CONFIGURED_APIS=$((CONFIGURED_APIS + 1))
    else
        echo -e "  ⚠️  ${name}: ${YELLOW}Not configured${NC}"
    fi
done

# Check local Ollama
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "  ✅ Local Ollama: ${GREEN}Running${NC}"
    CONFIGURED_APIS=$((CONFIGURED_APIS + 1))
else
    echo -e "  ⚠️  Local Ollama: ${YELLOW}Not running${NC}"
fi

if [ $CONFIGURED_APIS -eq 0 ]; then
    echo ""
    echo -e "${RED}❌ No AI providers configured!${NC}"
    echo -e "${YELLOW}💡 Run: ./setup-api-keys.sh to configure API keys${NC}"
    echo -e "${YELLOW}💡 Or install Ollama locally for free AI responses${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ${CONFIGURED_APIS} AI provider(s) available${NC}"

# Check if forum API is already running
API_RUNNING=$(lsof -ti:3334 2>/dev/null)

if [ ! -z "$API_RUNNING" ]; then
    echo ""
    echo -e "${GREEN}✅ Forum API already running on port 3334${NC}"
else
    echo ""
    echo -e "${YELLOW}🚀 Starting Multi-LLM Forum API Server...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing Node.js dependencies..."
        npm install express sqlite3 cors ws axios uuid > /dev/null 2>&1
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    fi
    
    # Create integrated startup script
    cat > start-integrated-forum.js << 'EOF'
#!/usr/bin/env node

// Integrated Multi-LLM Forum Startup
const ProductionForumAPIServer = require('./PRODUCTION-FORUM-API-SERVER');
const ForumMultiLLMIntegration = require('./FORUM-MULTI-LLM-INTEGRATION');

async function startIntegratedForum() {
    console.log('🚀 Starting Integrated Multi-LLM Forum System...\n');
    
    try {
        // Start the base forum API server
        console.log('1️⃣ Initializing Production Forum API Server...');
        const ProductionForumAPIServerClass = ProductionForumAPIServer;
        const forumServer = new ProductionForumAPIServerClass();
        await forumServer.initialize();
        
        console.log('2️⃣ Initializing Multi-LLM Integration...');
        const integration = new ForumMultiLLMIntegration(forumServer);
        await integration.initialize();
        
        console.log('\n🎉 INTEGRATED MULTI-LLM FORUM SYSTEM READY!');
        console.log('============================================');
        console.log('🌐 Forum Interface: Open REAL-FORUM-INTERFACE.html');
        console.log('📡 API Endpoint: http://localhost:3334/api');
        console.log('📊 Dashboard: http://localhost:3334/dashboard');
        console.log('🔧 Health Check: http://localhost:3334/health');
        
        if (integration.initialized) {
            console.log('🤖 Multi-LLM Engine: ACTIVE');
            const patterns = integration.getHopPatterns();
            console.log(`🔄 Available Patterns: ${patterns.length}`);
            patterns.forEach(p => {
                console.log(`   • ${p.name}: ${p.hops.length} hops`);
            });
        } else {
            console.log('🔄 Multi-LLM Engine: Using fallback (local responses)');
        }
        
        console.log('\n💰 Cost Tracking: Enabled');
        console.log('📈 Real-time Metrics: Enabled');
        console.log('🔄 Auto-fallback: Enabled');
        console.log('\n✨ Forum posts will now route through multiple AI providers! ✨');
        
        // Keep alive
        process.on('SIGINT', async () => {
            console.log('\n\n🛑 Shutting down...');
            await integration.shutdown();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start integrated forum system:', error.message);
        process.exit(1);
    }
}

startIntegratedForum();
EOF
    
    # Start the integrated system
    nohup node start-integrated-forum.js > multi-llm-forum.log 2>&1 &
    SERVER_PID=$!
    
    echo -e "${GREEN}✅ Multi-LLM Forum API started (PID: $SERVER_PID)${NC}"
    echo -e "${BLUE}📋 Logs: tail -f multi-llm-forum.log${NC}"
    
    # Wait for server to start
    echo "⏳ Waiting for server startup..."
    sleep 5
fi

# Check system health
echo ""
echo -e "${BLUE}🔍 SYSTEM HEALTH CHECK${NC}"
echo "====================="

# Check API health
if curl -s http://localhost:3334/health > /dev/null; then
    echo -e "${GREEN}✅ API Server: Healthy${NC}"
    
    # Get server info
    SERVER_INFO=$(curl -s http://localhost:3334/health)
    echo -e "${BLUE}📊 Server Status: ${SERVER_INFO}${NC}"
else
    echo -e "${YELLOW}⚠️  API Server: Starting up...${NC}"
    sleep 3
    if curl -s http://localhost:3334/health > /dev/null; then
        echo -e "${GREEN}✅ API Server: Now healthy${NC}"
    else
        echo -e "${RED}❌ API Server: Not responding${NC}"
        echo "Check logs: tail -f multi-llm-forum.log"
    fi
fi

# Check database
if [ -f "production-forum.db" ]; then
    POSTS=$(sqlite3 production-forum.db "SELECT COUNT(*) FROM forum_posts;" 2>/dev/null || echo "0")
    REPLIES=$(sqlite3 production-forum.db "SELECT COUNT(*) FROM forum_replies;" 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Database: Connected (${POSTS} posts, ${REPLIES} replies)${NC}"
else
    echo -e "${YELLOW}⚠️  Database: Will be created on first post${NC}"
fi

echo ""
echo -e "${CYAN}🤖 MULTI-LLM FEATURES${NC}"
echo "===================="
echo -e "${GREEN}✨ 8-hop routing through multiple AI providers${NC}"
echo -e "${GREEN}✨ Intelligent pattern selection based on complexity${NC}"
echo -e "${GREEN}✨ Real-time hop progress tracking${NC}"
echo -e "${GREEN}✨ Cost optimization and budget limits${NC}"
echo -e "${GREEN}✨ Automatic fallback to local responses${NC}"
echo -e "${GREEN}✨ Visual hop chain display in forum${NC}"

echo ""
echo -e "${CYAN}🔄 HOP PATTERNS AVAILABLE${NC}"
echo "========================"
echo -e "${BLUE}• Simple (3 hops):${NC} Ollama → Claude → GPT-4"
echo -e "${BLUE}• Standard (5 hops):${NC} Ollama → Claude → DeepSeek → Cohere → GPT-4"
echo -e "${BLUE}• Legendary (8 hops):${NC} All providers + synthesis"
echo -e "${BLUE}• Cost Optimized:${NC} Mostly free providers"
echo -e "${BLUE}• Quality Focused:${NC} Premium providers only"

# Open forum interface
echo ""
echo -e "${PURPLE}🌟 Opening Multi-LLM Cal Forum...${NC}"

# Try different methods to open the HTML file
if command -v open &> /dev/null; then
    # macOS
    open "REAL-FORUM-INTERFACE.html"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "REAL-FORUM-INTERFACE.html"
elif command -v start &> /dev/null; then
    # Windows
    start "REAL-FORUM-INTERFACE.html"
else
    echo -e "${YELLOW}⚠️  Could not auto-open browser${NC}"
    echo -e "${CYAN}   Manual: Open REAL-FORUM-INTERFACE.html in your browser${NC}"
fi

echo ""
echo -e "${GREEN}🎉 MULTI-LLM FORUM SYSTEM READY!${NC}"
echo ""
echo -e "${BLUE}💡 QUICK ACTIONS:${NC}"
echo "   🔄 View logs: tail -f multi-llm-forum.log"
echo "   📊 API dashboard: open http://localhost:3334/dashboard"
echo "   🔧 Health check: curl http://localhost:3334/health"
echo "   🧪 Test Multi-LLM: node FORUM-MULTI-LLM-ENGINE.js test"
echo "   ⚙️  Setup API keys: ./setup-api-keys.sh"
echo ""
echo -e "${CYAN}💰 COST TRACKING:${NC}"
echo "   Current budget limit: \$${REQUEST_BUDGET_LIMIT:-0.50} per request"
echo "   Daily limit: \$${DAILY_BUDGET_LIMIT:-50.00}"
echo "   Costs are tracked in real-time and displayed in the forum"
echo ""
echo -e "${PURPLE}🛑 TO STOP: kill \$(lsof -ti:3334)${NC}"
echo ""
echo -e "${CYAN}✨ Your forum posts will now route through multiple AI providers! ✨${NC}"
echo -e "${CYAN}✨ Watch the hop chains in real-time as responses are generated! ✨${NC}"