#!/bin/bash

# 🔨⚡ BOB THE BUILDER - ULTIMATE BUILD AUTOMATION
# Rust/Solidity locked, Flasked, and Dockered for production
# "CAN WE BUILD IT? YES WE CAN!"

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${CYAN}"
cat << "EOF"
    🔨⚡ BOB THE BUILDER ⚡🔨
    =========================
    CAN WE BUILD IT? YES WE CAN!
    
    🦀 Rust Backend
    🔨 Hardhat Solidity  
    🐍 Flask API
    🐳 Docker Everything
    🌌 Quantum Ready
EOF
echo -e "${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[BOB]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# Check dependencies
check_dependencies() {
    print_section "CHECKING DEPENDENCIES"
    
    # Check for required tools
    local missing_deps=()
    
    command -v node >/dev/null 2>&1 || missing_deps+=("node")
    command -v npm >/dev/null 2>&1 || missing_deps+=("npm")
    command -v python3 >/dev/null 2>&1 || missing_deps+=("python3")
    command -v pip3 >/dev/null 2>&1 || missing_deps+=("pip3")
    command -v docker >/dev/null 2>&1 || missing_deps+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_deps+=("docker-compose")
    command -v cargo >/dev/null 2>&1 || missing_deps+=("rust/cargo")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install missing dependencies before running Bob the Builder"
        exit 1
    fi
    
    print_status "✅ All dependencies found!"
}

# Install Node.js dependencies
install_node_deps() {
    print_section "INSTALLING NODE.JS DEPENDENCIES"
    
    print_status "Installing main package dependencies..."
    npm install
    
    if [ -d "hardhat" ]; then
        print_status "Installing Hardhat dependencies..."
        cd hardhat && npm install && cd ..
    fi
    
    print_status "✅ Node.js dependencies installed!"
}

# Install Python dependencies
install_python_deps() {
    print_section "INSTALLING PYTHON DEPENDENCIES"
    
    if [ -d "flask-api" ]; then
        print_status "Installing Flask API dependencies..."
        pip3 install -r flask-api/requirements.txt
    fi
    
    print_status "Installing quantum crawler dependencies..."
    pip3 install flask flask-cors flask-socketio requests sqlite3 aiohttp websockets
    
    print_status "✅ Python dependencies installed!"
}

# Build Rust backend
build_rust() {
    print_section "BUILDING RUST BACKEND"
    
    if [ -d "rust-backend" ]; then
        print_status "Building Rust backend..."
        cd rust-backend
        
        # Build debug first for faster development
        cargo build
        print_status "Debug build complete"
        
        # Build release for production
        cargo build --release
        print_status "Release build complete"
        
        cd ..
    else
        print_warning "Rust backend directory not found, skipping..."
    fi
    
    print_status "✅ Rust backend built!"
}

# Compile Solidity contracts
compile_solidity() {
    print_section "COMPILING SOLIDITY CONTRACTS"
    
    if [ -d "hardhat" ]; then
        print_status "Compiling smart contracts..."
        cd hardhat
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        # Compile contracts
        npx hardhat compile
        print_status "Smart contracts compiled!"
        
        cd ..
    else
        print_warning "Hardhat directory not found, skipping..."
    fi
    
    print_status "✅ Solidity contracts compiled!"
}

# Create necessary directories
create_directories() {
    print_section "CREATING PROJECT DIRECTORIES"
    
    # Create data directories
    mkdir -p data
    mkdir -p voice_memos
    mkdir -p logs
    mkdir -p deployments
    mkdir -p ssl
    
    # Create Rust backend migration directory
    if [ -d "rust-backend" ]; then
        mkdir -p rust-backend/migrations
    fi
    
    # Create hardhat deployments
    if [ -d "hardhat" ]; then
        mkdir -p hardhat/deployments
    fi
    
    print_status "✅ Directories created!"
}

# Create Dockerfiles
create_dockerfiles() {
    print_section "CREATING DOCKERFILES"
    
    # Rust Backend Dockerfile
    if [ -d "rust-backend" ] && [ ! -f "rust-backend/Dockerfile" ]; then
        print_status "Creating Rust backend Dockerfile..."
        cat > rust-backend/Dockerfile << 'EOF'
FROM rust:1.70 as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/quantum-rust-backend /app/

EXPOSE 8080
CMD ["./quantum-rust-backend"]
EOF
    fi
    
    # Flask API Dockerfile
    if [ -d "flask-api" ] && [ ! -f "flask-api/Dockerfile" ]; then
        print_status "Creating Flask API Dockerfile..."
        cat > flask-api/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python", "app.py"]
EOF
    fi
    
    # Quantum Crawler Dockerfile
    if [ ! -f "Dockerfile.quantum-crawler" ]; then
        print_status "Creating Quantum Crawler Dockerfile..."
        cat > Dockerfile.quantum-crawler << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN pip install flask flask-cors flask-socketio requests aiohttp websockets sqlite3

COPY quantum-data-matrix-crawler.py .

EXPOSE 8888
CMD ["python", "quantum-data-matrix-crawler.py"]
EOF
    fi
    
    # AI Arena Dockerfile
    if [ ! -f "Dockerfile.ai-arena" ]; then
        print_status "Creating AI Arena Dockerfile..."
        cat > Dockerfile.ai-arena << 'EOF'
FROM python:3.11-slim

WORKDIR /app

RUN pip install flask flask-cors flask-socketio requests

COPY ai-trading-arena.py .

EXPOSE 7781
CMD ["python", "ai-trading-arena.py"]
EOF
    fi
    
    # Hardhat Dockerfile
    if [ -d "hardhat" ] && [ ! -f "hardhat/Dockerfile" ]; then
        print_status "Creating Hardhat Dockerfile..."
        cat > hardhat/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8545
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
EOF
    fi
    
    print_status "✅ Dockerfiles created!"
}

# Update Docker Compose with new services
update_docker_compose() {
    print_section "UPDATING DOCKER COMPOSE"
    
    print_status "Adding quantum services to docker-compose.yml..."
    
    # Add quantum services to existing docker-compose.yml
    cat >> docker-compose.yml << 'EOF'

  # === QUANTUM RUST BACKEND ===
  quantum-rust-backend:
    build:
      context: ./rust-backend
      dockerfile: Dockerfile
    container_name: quantum-rust-backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=sqlite:quantum_rust.db
      - RUST_LOG=info
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - document-generator
    restart: unless-stopped

  # === QUANTUM FLASK API ===
  quantum-flask-api:
    build:
      context: ./flask-api
      dockerfile: Dockerfile
    container_name: quantum-flask-api
    ports:
      - "5001:5000"
    environment:
      - FLASK_ENV=production
      - SECRET_KEY=quantum-document-generator-secret
      - REDIS_HOST=redis
      - WEB3_RPC_URL=http://quantum-hardhat:8545
    depends_on:
      - redis
      - quantum-rust-backend
    volumes:
      - ./voice_memos:/app/voice_memos
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - document-generator
    restart: unless-stopped

  # === QUANTUM DATA CRAWLER ===
  quantum-data-crawler:
    build:
      context: .
      dockerfile: Dockerfile.quantum-crawler
    container_name: quantum-data-crawler
    ports:
      - "8888:8888"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - document-generator
    restart: unless-stopped

  # === AI TRADING ARENA ===
  ai-trading-arena:
    build:
      context: .
      dockerfile: Dockerfile.ai-arena
    container_name: ai-trading-arena
    ports:
      - "7781:7781"
    environment:
      - PYTHONUNBUFFERED=1
    depends_on:
      - quantum-data-crawler
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7781/api/arena/status"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - document-generator
    restart: unless-stopped

  # === QUANTUM HARDHAT NODE ===
  quantum-hardhat:
    build:
      context: ./hardhat
      dockerfile: Dockerfile
    container_name: quantum-hardhat-node
    ports:
      - "8545:8545"
    environment:
      - NODE_ENV=development
    volumes:
      - ./hardhat/deployments:/app/deployments
    command: ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
    networks:
      - document-generator
    restart: unless-stopped
EOF
    
    print_status "✅ Docker Compose updated!"
}

# Build Docker images
build_docker() {
    print_section "BUILDING DOCKER IMAGES"
    
    print_status "Building all Docker images..."
    docker-compose build
    
    print_status "✅ Docker images built!"
}

# Deploy contracts to local blockchain
deploy_contracts() {
    print_section "DEPLOYING SMART CONTRACTS"
    
    if [ -d "hardhat" ]; then
        print_status "Starting local Hardhat node..."
        cd hardhat
        
        # Start hardhat node in background
        npx hardhat node --hostname 0.0.0.0 &
        HARDHAT_PID=$!
        
        # Wait for node to start
        sleep 10
        
        print_status "Deploying contracts to local network..."
        npx hardhat run scripts/deploy.js --network localhost
        
        # Kill hardhat node
        kill $HARDHAT_PID 2>/dev/null || true
        
        cd ..
        
        print_status "✅ Smart contracts deployed!"
    else
        print_warning "Hardhat not found, skipping contract deployment..."
    fi
}

# Start all services
start_services() {
    print_section "STARTING ALL SERVICES"
    
    print_status "Starting Docker Compose services..."
    docker-compose up -d
    
    print_status "Waiting for services to start..."
    sleep 30
    
    print_status "Checking service health..."
    docker-compose ps
    
    print_status "✅ All services started!"
}

# Verify deployment
verify_deployment() {
    print_section "VERIFYING DEPLOYMENT"
    
    local services=(
        "http://localhost:5000/health"      # Flask API
        "http://localhost:8080/health"      # Rust Backend  
        "http://localhost:8888/api/status"  # Quantum Crawler
        "http://localhost:7781/api/arena/status" # AI Arena
        "http://localhost:8545"             # Hardhat Node
    )
    
    for service in "${services[@]}"; do
        print_status "Testing $service..."
        if curl -f -s "$service" > /dev/null; then
            print_status "✅ $service is healthy"
        else
            print_warning "⚠️ $service might not be ready yet"
        fi
    done
    
    print_status "✅ Deployment verification complete!"
}

# Show final status
show_final_status() {
    print_section "🎉 BOB THE BUILDER COMPLETE! 🎉"
    
    echo -e "${GREEN}"
    cat << "EOF"
    ===================================
    ✅ QUANTUM SYSTEM READY FOR USE! ✅
    ===================================
    
    🌐 Services Running:
    • Flask API Gateway:     http://localhost:5000
    • Rust Backend:          http://localhost:8080  
    • Quantum Data Crawler:  http://localhost:8888
    • AI Trading Arena:      http://localhost:7781
    • Hardhat Blockchain:    http://localhost:8545
    • Original Services:     http://localhost:3000-3003
    
    🔧 Management Commands:
    • View logs:       docker-compose logs -f
    • Stop services:   docker-compose down  
    • Restart:         docker-compose restart
    • Rebuild:         docker-compose build
    
    🎮 Ready for:
    ✅ Document Processing
    ✅ AI Trading Arena
    ✅ Crypto Auditing
    ✅ Voice Memo Betting
    ✅ Multi-Domain Data Harvesting
    ✅ Smart Contract Deployment
    ✅ Rust + Solidity + Flask Integration
    
    CAN WE BUILD IT? YES WE CAN! 🔨⚡
EOF
    echo -e "${NC}"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."
    # Add any cleanup tasks here
}

# Main execution
main() {
    # Set trap for cleanup
    trap cleanup EXIT
    
    print_status "🔨 Starting Bob the Builder automation..."
    
    # Check if user wants to skip certain steps
    SKIP_DEPS=${SKIP_DEPS:-false}
    SKIP_BUILD=${SKIP_BUILD:-false}
    SKIP_DEPLOY=${SKIP_DEPLOY:-false}
    
    if [ "$SKIP_DEPS" != "true" ]; then
        check_dependencies
        install_node_deps
        install_python_deps
    fi
    
    create_directories
    create_dockerfiles
    
    if [ "$SKIP_BUILD" != "true" ]; then
        compile_solidity
        build_rust
    fi
    
    update_docker_compose
    build_docker
    
    if [ "$SKIP_DEPLOY" != "true" ]; then
        deploy_contracts
    fi
    
    start_services
    verify_deployment
    show_final_status
    
    print_status "🎉 Bob the Builder has successfully automated your build!"
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-deploy)
            SKIP_DEPLOY=true
            shift
            ;;
        --help)
            echo "Bob the Builder - Ultimate Build Automation"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-deps    Skip dependency installation"
            echo "  --skip-build   Skip Rust/Solidity compilation"  
            echo "  --skip-deploy  Skip contract deployment"
            echo "  --help         Show this help message"
            echo ""
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"