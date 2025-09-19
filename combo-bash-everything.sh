#!/bin/bash
# 🚀 COMBO BASH - Everything In One Command
# Initializes database, starts all services, runs tests, prepares for deployment

echo "🎯 ECONOMIC ENGINE - COMBO BASH EVERYTHING"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
export NODE_ENV=${NODE_ENV:-development}
export PORT=3000
export SLAM_PORT=9999

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill existing processes
kill_existing() {
    echo -e "${YELLOW}🔪 Killing existing Node processes...${NC}"
    pkill -f "node.*server.js" || true
    pkill -f "node.*slam-it-all-together.js" || true
    sleep 2
}

# Function to check dependencies
check_dependencies() {
    echo -e "${BLUE}📦 Checking dependencies...${NC}"
    
    if ! command_exists node; then
        echo -e "${RED}❌ Node.js not installed${NC}"
        exit 1
    fi
    
    if ! command_exists npm; then
        echo -e "${RED}❌ npm not installed${NC}"
        exit 1
    fi
    
    if ! command_exists mysql && ! command_exists psql; then
        echo -e "${YELLOW}⚠️  Neither MySQL nor PostgreSQL found${NC}"
        echo "   Database initialization will be skipped"
    fi
    
    echo -e "${GREEN}✅ Dependencies check passed${NC}"
}

# Function to setup environment
setup_environment() {
    echo -e "${BLUE}🔧 Setting up environment...${NC}"
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ Created .env from .env.example${NC}"
        else
            echo -e "${YELLOW}⚠️  No .env file found, using defaults${NC}"
        fi
    fi
    
    # Source .env if it exists
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
}

# Function to install npm packages
install_packages() {
    echo -e "${BLUE}📦 Installing npm packages...${NC}"
    
    if [ ! -d node_modules ]; then
        npm install
        echo -e "${GREEN}✅ npm packages installed${NC}"
    else
        echo -e "${GREEN}✅ npm packages already installed${NC}"
    fi
}

# Function to initialize database
init_database() {
    echo -e "${BLUE}🗄️  Initializing database...${NC}"
    
    # Check if database tools exist
    if command_exists mysql || command_exists psql; then
        node init-database.js
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Database initialized successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Database initialization failed, continuing anyway${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping database initialization (no database found)${NC}"
    fi
}

# Function to start Economic Engine
start_economic_engine() {
    echo -e "${BLUE}🚀 Starting Economic Engine (port 3000)...${NC}"
    
    # Start in background and redirect output
    node server.js > economic-engine.log 2>&1 &
    ENGINE_PID=$!
    
    # Wait for it to start
    sleep 5
    
    # Check if it's running
    if curl -s http://localhost:3000/api/status > /dev/null; then
        echo -e "${GREEN}✅ Economic Engine started (PID: $ENGINE_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start Economic Engine${NC}"
        cat economic-engine.log
        exit 1
    fi
}

# Function to start Slam layer
start_slam_layer() {
    echo -e "${BLUE}🔨 Starting Slam layer (port 9999)...${NC}"
    
    # Start in background and redirect output
    node slam-it-all-together.js > slam-layer.log 2>&1 &
    SLAM_PID=$!
    
    # Wait for it to start
    sleep 5
    
    # Check if it's running
    if curl -s http://localhost:9999/slam/status > /dev/null; then
        echo -e "${GREEN}✅ Slam layer started (PID: $SLAM_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start Slam layer${NC}"
        cat slam-layer.log
        exit 1
    fi
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}🧪 Running comprehensive tests...${NC}"
    echo ""
    
    # Make test script executable
    chmod +x run-all-tests.sh
    
    # Run tests
    ./run-all-tests.sh
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
        return 1
    fi
}

# Function to check deployment readiness
check_deployment_ready() {
    echo ""
    echo -e "${BLUE}🚢 Checking deployment readiness...${NC}"
    
    READY=true
    
    # Check for required files
    FILES_TO_CHECK=(
        "package.json"
        "server.js"
        "slam-it-all-together.js"
        "manifest.json"
        "sw.js"
        "electron-app/package.json"
        "chrome-extension/manifest.json"
    )
    
    for file in "${FILES_TO_CHECK[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ $file exists${NC}"
        else
            echo -e "${RED}❌ $file missing${NC}"
            READY=false
        fi
    done
    
    # Check for .env configuration
    if [ -f .env ]; then
        # Check for API keys
        if grep -q "OPENAI_API_KEY=sk-" .env && grep -q "ANTHROPIC_API_KEY=sk-ant-" .env; then
            echo -e "${GREEN}✅ API keys configured${NC}"
        else
            echo -e "${YELLOW}⚠️  API keys not configured (using placeholders)${NC}"
        fi
        
        # Check for Stripe keys
        if grep -q "STRIPE_PUBLIC_KEY=pk_" .env && grep -q "STRIPE_SECRET_KEY=sk_" .env; then
            echo -e "${GREEN}✅ Stripe keys configured${NC}"
        else
            echo -e "${YELLOW}⚠️  Stripe keys not configured${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No .env file found${NC}"
    fi
    
    # Check git status
    if [ -d .git ]; then
        if git status --porcelain | grep -q "^"; then
            echo -e "${YELLOW}⚠️  Uncommitted changes in git${NC}"
        else
            echo -e "${GREEN}✅ Git repository clean${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Not a git repository${NC}"
    fi
    
    if [ "$READY" = true ]; then
        echo -e "${GREEN}✅ Deployment ready!${NC}"
    else
        echo -e "${YELLOW}⚠️  Some deployment requirements missing${NC}"
    fi
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo -e "${BLUE}📋 NEXT STEPS${NC}"
    echo "============="
    echo ""
    echo "1. Configure real API keys in .env:"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - STRIPE_PUBLIC_KEY / STRIPE_SECRET_KEY"
    echo ""
    echo "2. Initialize git repository:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit: Economic Engine platform'"
    echo ""
    echo "3. Push to GitHub:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/economic-engine.git"
    echo "   git push -u origin main"
    echo ""
    echo "4. Configure GitHub Secrets for deployment:"
    echo "   - RAILWAY_TOKEN"
    echo "   - VERCEL_TOKEN"
    echo "   - NPM_TOKEN (if publishing packages)"
    echo ""
    echo "5. Deploy to production:"
    echo "   - Railway: railway up"
    echo "   - Vercel: vercel --prod"
    echo "   - Docker: docker-compose up -d"
    echo ""
    echo "6. Access your platform:"
    echo "   - Local: http://localhost:9999"
    echo "   - PWA: Install from browser"
    echo "   - Desktop: Run electron app"
    echo "   - Extension: Load in Chrome"
}

# Function to create quick access script
create_quick_access() {
    echo -e "${BLUE}🎯 Creating quick access scripts...${NC}"
    
    # Start script
    cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Economic Engine..."
node server.js &
sleep 5
node slam-it-all-together.js &
sleep 5
echo "✅ Everything started!"
echo "Access at: http://localhost:9999"
EOF
    chmod +x start.sh
    
    # Stop script
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "Stopping Economic Engine..."
pkill -f "node.*server.js"
pkill -f "node.*slam-it-all-together.js"
echo "✅ Everything stopped!"
EOF
    chmod +x stop.sh
    
    # Test script
    cat > test.sh << 'EOF'
#!/bin/bash
./run-all-tests.sh
EOF
    chmod +x test.sh
    
    echo -e "${GREEN}✅ Quick access scripts created${NC}"
    echo "   - ./start.sh - Start everything"
    echo "   - ./stop.sh  - Stop everything"
    echo "   - ./test.sh  - Run all tests"
}

# Main execution flow
main() {
    echo -e "${YELLOW}🎬 Starting COMBO BASH sequence...${NC}"
    echo ""
    
    # Step 1: Environment checks
    check_dependencies
    setup_environment
    
    # Step 2: Kill existing processes
    kill_existing
    
    # Step 3: Install packages
    install_packages
    
    # Step 4: Initialize database
    init_database
    
    # Step 5: Start services
    start_economic_engine
    start_slam_layer
    
    # Step 6: Run tests
    echo ""
    TEST_RESULT=0
    run_tests || TEST_RESULT=$?
    
    # Step 7: Check deployment readiness
    check_deployment_ready
    
    # Step 8: Create quick access scripts
    create_quick_access
    
    # Step 9: Show summary
    echo ""
    echo -e "${BLUE}📊 SUMMARY${NC}"
    echo "=========="
    echo -e "${GREEN}✅ Economic Engine running on: http://localhost:3000${NC}"
    echo -e "${GREEN}✅ Slam layer running on: http://localhost:9999${NC}"
    echo -e "${GREEN}✅ Access the platform at: http://localhost:9999${NC}"
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    fi
    
    # Step 10: Show next steps
    show_next_steps
    
    echo ""
    echo -e "${GREEN}🎉 COMBO BASH COMPLETE!${NC}"
    echo ""
    echo "Platform is running in the background."
    echo "Use ./stop.sh to stop all services."
    echo ""
}

# Handle Ctrl+C
trap 'echo -e "\n${RED}Interrupted. Stopping services...${NC}"; pkill -f node; exit 1' INT

# Run main function
main

# Keep script running to show logs
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""
echo "📝 Showing live logs (Ctrl+C to stop):"
echo "======================================"

# Tail logs
tail -f economic-engine.log slam-layer.log 2>/dev/null || true