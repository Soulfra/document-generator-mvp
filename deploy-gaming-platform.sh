#!/bin/bash

# 🚀 ONE-BUTTON GAMING PLATFORM DEPLOYMENT
# Deploy everything with a single command

set -e

echo "🎮 GAMING PLATFORM DEPLOYMENT SYSTEM"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose.${NC}"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git not found. Please install Git.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met!${NC}"
}

# Initialize git repository
init_git() {
    echo -e "${BLUE}🔧 Initializing Git repository...${NC}"
    
    if [ ! -d .git ]; then
        git init
        echo -e "${GREEN}✅ Git repository initialized${NC}"
    else
        echo -e "${YELLOW}⚠️  Git repository already exists${NC}"
    fi
    
    # Create .gitignore if not exists
    if [ ! -f .gitignore ]; then
        cat > .gitignore << EOF
node_modules/
*.log
.env
*.db
.DS_Store
logs/
*.pid
EOF
        echo -e "${GREEN}✅ Created .gitignore${NC}"
    fi
}

# Create environment file
create_env() {
    echo -e "${BLUE}🔐 Creating environment configuration...${NC}"
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Gaming Platform Environment Variables
NODE_ENV=production
POSTGRES_PASSWORD=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# API Keys (add your own)
STRIPE_API_KEY=sk_test_your_key_here
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Database URLs
DATABASE_URL=postgresql://gaming_admin:password@postgres:5432/gaming_platform
REDIS_URL=redis://redis:6379

# Service URLs
MASTER_GAMING_URL=http://master-gaming:8800
PERSISTENT_TYCOON_URL=http://persistent-tycoon:7090
SECURITY_LAYER_URL=http://security-layer:7200
CHEAT_SYSTEM_URL=http://cheat-system:7100
GACHA_TOKENS_URL=http://gacha-tokens:7300
EOF
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    fi
}

# Build containers
build_containers() {
    echo -e "${BLUE}🏗️  Building Docker containers...${NC}"
    docker-compose -f docker-compose.gaming.yml build
    echo -e "${GREEN}✅ Containers built successfully${NC}"
}

# Start services
start_services() {
    echo -e "${BLUE}🚀 Starting all services...${NC}"
    docker-compose -f docker-compose.gaming.yml up -d
    echo -e "${GREEN}✅ Services started${NC}"
}

# Wait for services to be ready
wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
    
    services=(
        "master-gaming:8800"
        "persistent-tycoon:7090"
        "security-layer:7200"
        "cheat-system:7100"
        "gacha-tokens:7300"
    )
    
    for service in "${services[@]}"; do
        name=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)
        
        echo -n "  Waiting for $name... "
        while ! docker-compose -f docker-compose.gaming.yml exec -T $name wget -q --spider http://localhost:$port/; do
            sleep 1
        done
        echo -e "${GREEN}Ready!${NC}"
    done
}

# Run database migrations
run_migrations() {
    echo -e "${BLUE}📊 Running database migrations...${NC}"
    # Add migration commands here if needed
    echo -e "${GREEN}✅ Migrations complete${NC}"
}

# Display status
display_status() {
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
    echo "========================"
    echo ""
    echo "🌐 Access Points:"
    echo "  • Master Platform: http://localhost:8800"
    echo "  • Tycoon Game: http://localhost:7090/game"
    echo "  • Gacha System: http://localhost:7300"
    echo "  • Cheat Codes: http://localhost:7100"
    echo ""
    echo "📱 Mobile Access:"
    echo "  • Main URL: http://localhost"
    echo "  • Tycoon: http://localhost/tycoon"
    echo "  • Gacha: http://localhost/gacha"
    echo ""
    echo "🎮 Classic Cheat Codes:"
    echo "  • IDDQD - God Mode"
    echo "  • showmethemoney - +$10,000"
    echo "  • ↑↑↓↓←→←→BA - Konami Code"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "  • View logs: docker-compose -f docker-compose.gaming.yml logs -f"
    echo "  • Stop all: docker-compose -f docker-compose.gaming.yml down"
    echo "  • Restart: docker-compose -f docker-compose.gaming.yml restart"
    echo ""
}

# Git remote setup
setup_git_remote() {
    echo -e "${BLUE}🔗 Setting up Git remote...${NC}"
    
    read -p "Enter Git remote URL (or press Enter to skip): " remote_url
    
    if [ ! -z "$remote_url" ]; then
        git remote add origin "$remote_url" 2>/dev/null || git remote set-url origin "$remote_url"
        echo -e "${GREEN}✅ Git remote configured${NC}"
        
        # Initial commit
        git add -A
        git commit -m "🎮 Initial gaming platform deployment" || true
        
        read -p "Push to remote? (y/n): " push_confirm
        if [ "$push_confirm" = "y" ]; then
            git push -u origin main || git push -u origin master
            echo -e "${GREEN}✅ Pushed to remote${NC}"
        fi
    fi
}

# Main deployment flow
main() {
    echo ""
    echo "This will deploy the entire gaming platform stack."
    echo "Including: Tycoon Game, Gacha System, Cheat Codes, Security Layer"
    echo ""
    read -p "Continue? (y/n): " confirm
    
    if [ "$confirm" != "y" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    check_prerequisites
    init_git
    create_env
    build_containers
    start_services
    wait_for_services
    run_migrations
    setup_git_remote
    display_status
}

# Run main function
main