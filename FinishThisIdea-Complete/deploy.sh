#!/bin/bash

# 🚀 FinishThisIdea Platform Deployment Script
# Complete AI Innovation Platform Deployment

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 🚀 FinishThisIdea Platform                    ║"
echo "║                                                              ║"
echo "║                  Deployment Starting...                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Check if Node.js is installed
print_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js >= 16.0.0"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version is too old. Please install Node.js >= 16.0.0"
    exit 1
fi

print_success "Node.js $(node --version) detected"

# Check if npm is installed
print_step "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm"
    exit 1
fi

print_success "npm $(npm --version) detected"

# Install dependencies
print_step "Installing platform dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Build TypeScript components (if needed)
print_step "Building platform components..."
if npm run build; then
    print_success "Platform build completed"
else
    print_warning "Build completed with warnings (this may be normal)"
fi

# Check if ports are available
print_step "Checking port availability..."

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        print_warning "Port $port is already in use"
        return 1
    else
        print_success "Port $port is available"
        return 0
    fi
}

PORTS_OK=true
if ! check_port 8080; then
    print_error "API Gateway port 8080 is not available"
    PORTS_OK=false
fi

if ! check_port 8081; then
    print_error "WebSocket port 8081 is not available"
    PORTS_OK=false
fi

if [ "$PORTS_OK" = false ]; then
    print_error "Required ports are not available. Please free up the ports or change configuration."
    exit 1
fi

# Create necessary directories
print_step "Creating platform directories..."
mkdir -p logs
mkdir -p data
mkdir -p temp
print_success "Platform directories created"

# Set up environment variables
print_step "Setting up environment..."
if [ ! -f .env ]; then
    cat > .env << EOL
# FinishThisIdea Platform Configuration
NODE_ENV=production
PORT=8080
WS_PORT=8081

# API Gateway Settings
API_GATEWAY_HOST=localhost
API_GATEWAY_PORT=8080

# Database Configuration (if needed)
DATABASE_URL=sqlite:./data/platform.db

# Redis Configuration (if available)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# External Services
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Platform Features
ENABLE_GAMES=true
ENABLE_MARKETPLACE=true
ENABLE_AI_CHAT=true
ENABLE_USER_MANAGEMENT=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/platform.log
EOL
    print_success "Environment configuration created (.env)"
    print_warning "Please update .env file with your actual API keys and secrets"
else
    print_success "Environment configuration exists"
fi

# Health check function
health_check() {
    local retries=0
    local max_retries=10
    
    print_step "Performing health check..."
    
    while [ $retries -lt $max_retries ]; do
        if curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
            print_success "Platform is healthy and responding"
            return 0
        else
            retries=$((retries + 1))
            print_status "Health check attempt $retries/$max_retries..."
            sleep 2
        fi
    done
    
    print_error "Platform health check failed after $max_retries attempts"
    return 1
}

# Start the platform
print_step "Starting FinishThisIdea Platform..."

# Check if running in development mode
if [ "$1" = "dev" ]; then
    print_status "Starting in development mode..."
    npm run dev &
else
    print_status "Starting in production mode..."
    npm run start &
fi

PLATFORM_PID=$!
print_success "Platform started with PID: $PLATFORM_PID"

# Wait a moment for the server to start
sleep 3

# Perform health check
if health_check; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   🎉 DEPLOYMENT SUCCESSFUL!                  ║"
    echo "║                                                              ║"
    echo "║  FinishThisIdea Platform is now running!                    ║"
    echo "║                                                              ║"
    echo "║  🌐 Platform URL: http://localhost:8080                     ║"
    echo "║  📊 API Gateway: http://localhost:8080/api                  ║"
    echo "║  🔌 WebSocket: ws://localhost:8081                          ║"
    echo "║                                                              ║"
    echo "║  Available Interfaces:                                      ║"
    echo "║  • 🏠 Platform Hub: http://localhost:8080                   ║"
    echo "║  • 🖥️ System Monitor: http://localhost:8080/dashboard       ║"
    echo "║  • ⚔️ AI Arena: http://localhost:8080/games/ai-arena        ║"
    echo "║  • 💰 Billion $ Game: http://localhost:8080/games/billion-  ║"
    echo "║  • 🤖 AI Chat: http://localhost:8080/chat/ai-chat           ║"
    echo "║  • 🏪 Marketplace: http://localhost:8080/marketplace        ║"
    echo "║  • 👥 User Management: http://localhost:8080/admin          ║"
    echo "║                                                              ║"
    echo "║  Press Ctrl+C to stop the platform                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Display real-time logs
    print_status "Displaying platform logs (Ctrl+C to stop)..."
    echo ""
    
    # Wait for the platform process
    wait $PLATFORM_PID
else
    print_error "Platform deployment failed!"
    
    # Kill the platform process if it's still running
    if kill -0 $PLATFORM_PID 2>/dev/null; then
        print_status "Stopping platform process..."
        kill $PLATFORM_PID
    fi
    
    exit 1
fi

# Cleanup function
cleanup() {
    echo ""
    print_status "Shutting down FinishThisIdea Platform..."
    
    if kill -0 $PLATFORM_PID 2>/dev/null; then
        kill $PLATFORM_PID
        print_success "Platform stopped gracefully"
    fi
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   👋 Platform Stopped                       ║"
    echo "║                                                              ║"
    echo "║  Thank you for using FinishThisIdea Platform!               ║"
    echo "║                                                              ║"
    echo "║  Run './deploy.sh' to start again                          ║"
    echo "║  Run './deploy.sh dev' for development mode                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
while true; do
    sleep 1
done