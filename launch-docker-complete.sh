#!/bin/bash

# launch-docker-complete.sh - Complete Docker launcher with health monitoring
# Handles Docker setup, service orchestration, and health monitoring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.yml"
OVERRIDE_FILE="docker-compose.override.yml"
ENV_FILE=".env"
HEALTH_CHECK_INTERVAL=5
MAX_HEALTH_CHECKS=60
SERVICES_TO_MONITOR=()

# Service definitions
declare -A SERVICE_PORTS=(
    ["document-generator-api"]="3000"
    ["document-generator-ui"]="8080"
    ["document-generator-monitoring"]="3002"
    ["document-generator-cerberus"]="3003"
    ["postgres"]="5432"
    ["redis"]="6379"
    ["ollama"]="11434"
)

# ASCII Art Header
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║    🐳 DOCKER COMPLETE LAUNCHER 🐳                                ║
║                                                                  ║
║    Containerized Document Generator Platform                     ║
║    Full stack deployment with health monitoring                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to check Docker installation
check_docker() {
    echo -e "${YELLOW}🔍 Checking Docker installation...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo ""
        echo "Please install Docker:"
        echo "  - macOS: https://docker.com/products/docker-desktop"
        echo "  - Linux: curl -fsSL https://get.docker.com | sh"
        echo "  - Windows: https://docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo "Please start Docker and try again."
        exit 1
    fi
    
    DOCKER_VERSION=$(docker version --format '{{.Server.Version}}')
    echo -e "${GREEN}✓ Docker ${DOCKER_VERSION} is running${NC}"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}⚠️  docker-compose not found, checking for compose plugin...${NC}"
        
        if ! docker compose version &> /dev/null; then
            echo -e "${RED}❌ Docker Compose is not available${NC}"
            echo "Please install Docker Compose or update Docker Desktop"
            exit 1
        else
            # Use docker compose instead of docker-compose
            alias docker-compose='docker compose'
            COMPOSE_VERSION=$(docker compose version --short)
            echo -e "${GREEN}✓ Docker Compose plugin ${COMPOSE_VERSION}${NC}"
        fi
    else
        COMPOSE_VERSION=$(docker-compose version --short)
        echo -e "${GREEN}✓ Docker Compose ${COMPOSE_VERSION}${NC}"
    fi
    
    echo ""
}

# Function to create Docker Compose file if it doesn't exist
create_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${YELLOW}📄 Creating Docker Compose configuration...${NC}"
        
        cat > "$COMPOSE_FILE" << 'EOF'
version: '3.8'

services:
  # Main API service
  document-generator-api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/document_generator
      - REDIS_URL=redis://redis:6379
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - postgres
      - redis
      - ollama
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Web interface
  document-generator-ui:
    build:
      context: .
      dockerfile: Dockerfile.ui
    ports:
      - "8080:80"
    environment:
      - API_URL=http://document-generator-api:3000
    depends_on:
      - document-generator-api
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring dashboard
  document-generator-monitoring:
    build:
      context: .
      dockerfile: Dockerfile.monitoring
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - API_URL=http://document-generator-api:3000
    depends_on:
      - document-generator-api
    restart: unless-stopped

  # Cerberus security service
  document-generator-cerberus:
    build:
      context: .
      dockerfile: Dockerfile.cerberus
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  # PostgreSQL database
  postgres:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=document_generator
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    command: redis-server --appendonly yes

  # Ollama for local AI
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Nginx reverse proxy (optional)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - document-generator-ui
      - document-generator-api
    restart: unless-stopped
    profiles: ["production"]

volumes:
  postgres_data:
  redis_data:
  ollama_data:

networks:
  default:
    driver: bridge
EOF
        
        echo -e "${GREEN}✓ Docker Compose file created${NC}"
    fi
}

# Function to create Dockerfiles
create_dockerfiles() {
    echo -e "${YELLOW}🏗️  Creating Dockerfiles...${NC}"
    
    # API Dockerfile
    if [ ! -f "Dockerfile.api" ]; then
        cat > "Dockerfile.api" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs temp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
EOF
    fi
    
    # UI Dockerfile
    if [ ! -f "Dockerfile.ui" ]; then
        cat > "Dockerfile.ui" << 'EOF'
FROM nginx:alpine

# Copy web interface files
COPY web-interface/ /usr/share/nginx/html/
COPY api-monitoring-dashboard.html /usr/share/nginx/html/dashboard.html

# Custom nginx config
COPY nginx-ui.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
EOF
    fi
    
    # Monitoring Dockerfile
    if [ ! -f "Dockerfile.monitoring" ]; then
        cat > "Dockerfile.monitoring" << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY api-monitoring-dashboard.html ./
COPY api-cerberus-core.js ./
COPY api-rate-limiter.js ./

EXPOSE 3002

CMD ["node", "-e", "require('http').createServer((req,res)=>{require('fs').createReadStream('./api-monitoring-dashboard.html').pipe(res)}).listen(3002)"]
EOF
    fi
    
    # Cerberus Dockerfile
    if [ ! -f "Dockerfile.cerberus" ]; then
        cat > "Dockerfile.cerberus" << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY api-cerberus-core.js ./
COPY api-rate-limiter.js ./
COPY api-error-patterns.js ./
COPY api-security-gateway.js ./

EXPOSE 3003

CMD ["node", "api-cerberus-core.js"]
EOF
    fi
    
    echo -e "${GREEN}✓ Dockerfiles created${NC}"
}

# Function to create nginx config
create_nginx_config() {
    if [ ! -f "nginx-ui.conf" ]; then
        cat > "nginx-ui.conf" << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Main interface
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Dashboard
    location /dashboard {
        try_files $uri /dashboard.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://document-generator-api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    fi
}

# Function to build images
build_images() {
    echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
    
    # Build with progress
    docker-compose build --progress=plain
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Images built successfully${NC}"
    else
        echo -e "${RED}❌ Image build failed${NC}"
        exit 1
    fi
    
    echo ""
}

# Function to start services
start_services() {
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    
    # Start in detached mode
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Services started${NC}"
    else
        echo -e "${RED}❌ Service start failed${NC}"
        docker-compose logs
        exit 1
    fi
    
    echo ""
}

# Function to wait for service to be healthy
wait_for_service() {
    local service_name="$1"
    local port="$2"
    local max_attempts="${3:-30}"
    
    echo -e "${YELLOW}⏳ Waiting for ${service_name} to be healthy...${NC}"
    
    local attempts=0
    while [ $attempts -lt $max_attempts ]; do
        if check_service_health "$service_name" "$port"; then
            echo -e "${GREEN}✅ ${service_name} is healthy${NC}"
            return 0
        fi
        
        ((attempts++))
        echo -n "."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    echo -e "${RED}❌ ${service_name} failed to become healthy${NC}"
    return 1
}

# Function to check individual service health
check_service_health() {
    local service_name="$1"
    local port="$2"
    
    # Check if container is running
    if ! docker-compose ps "$service_name" | grep -q "Up"; then
        return 1
    fi
    
    # Check port accessibility
    case "$service_name" in
        "document-generator-api"|"document-generator-ui"|"document-generator-monitoring")
            curl -f -s "http://localhost:$port" > /dev/null 2>&1
            ;;
        "postgres")
            docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1
            ;;
        "redis")
            docker-compose exec -T redis redis-cli ping > /dev/null 2>&1
            ;;
        "ollama")
            curl -f -s "http://localhost:$port/api/tags" > /dev/null 2>&1
            ;;
        *)
            # Default: check if port is responding
            nc -z localhost "$port" 2>/dev/null
            ;;
    esac
}

# Function to monitor all services
monitor_services() {
    echo -e "${BLUE}📊 Starting health monitoring...${NC}"
    echo ""
    
    local all_healthy=true
    
    for service in "${!SERVICE_PORTS[@]}"; do
        local port="${SERVICE_PORTS[$service]}"
        
        if ! wait_for_service "$service" "$port" 20; then
            all_healthy=false
            echo -e "${RED}⚠️  Service $service is unhealthy${NC}"
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        echo -e "${GREEN}🎉 All services are healthy and ready!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some services are not healthy${NC}"
        return 1
    fi
}

# Function to show service status
show_status() {
    echo -e "${BLUE}📋 Service Status:${NC}"
    echo ""
    
    # Get service status
    docker-compose ps --format="table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo -e "${BLUE}🔗 Available Endpoints:${NC}"
    echo ""
    
    local endpoints=(
        "📊 Main Interface|http://localhost:8080"
        "🔧 API Server|http://localhost:3000"
        "📈 Monitoring Dashboard|http://localhost:3002"
        "🛡️  Cerberus Security|http://localhost:3003"
        "🤖 Ollama AI|http://localhost:11434"
    )
    
    for endpoint in "${endpoints[@]}"; do
        IFS='|' read -r label url <<< "$endpoint"
        printf "  %-25s %s\n" "$label" "$url"
    done
    
    echo ""
}

# Function to setup Ollama models
setup_ollama_models() {
    echo -e "${YELLOW}🤖 Setting up Ollama AI models...${NC}"
    
    # Wait for Ollama to be ready
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if curl -f -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            break
        fi
        ((attempts++))
        echo -n "."
        sleep 2
    done
    
    echo ""
    
    # Pull recommended models
    local models=("codellama:7b" "mistral" "phi")
    
    for model in "${models[@]}"; do
        echo -e "${YELLOW}Pulling $model...${NC}"
        docker-compose exec -T ollama ollama pull "$model" || {
            echo -e "${YELLOW}⚠️  Failed to pull $model (continuing...)${NC}"
        }
    done
    
    echo -e "${GREEN}✅ Ollama setup complete${NC}"
    echo ""
}

# Function to show logs
show_logs() {
    local service="$1"
    
    if [ -z "$service" ]; then
        echo -e "${BLUE}📜 Recent logs from all services:${NC}"
        docker-compose logs --tail=50
    else
        echo -e "${BLUE}📜 Logs from $service:${NC}"
        docker-compose logs --tail=100 -f "$service"
    fi
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}⏹️  Stopping services...${NC}"
    
    docker-compose down
    
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to cleanup
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    
    # Remove containers, networks, and anonymous volumes
    docker-compose down -v
    
    # Optionally remove images
    read -p "Remove Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down --rmi all
        echo -e "${GREEN}✅ Cleanup complete${NC}"
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services (default)"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Show service status"
    echo "  logs      Show service logs"
    echo "  logs <service>  Show logs for specific service"
    echo "  cleanup   Stop services and clean up"
    echo "  models    Setup Ollama AI models"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Start all services"
    echo "  $0 logs api       # Show API service logs"
    echo "  $0 models         # Setup AI models"
}

# Main execution
main() {
    local command="${1:-start}"
    
    case "$command" in
        "start")
            check_docker
            create_compose_file
            create_dockerfiles
            create_nginx_config
            
            # Stop any running services first
            docker-compose down 2>/dev/null || true
            
            build_images
            start_services
            monitor_services
            
            if [ $? -eq 0 ]; then
                setup_ollama_models
                show_status
                
                echo ""
                echo -e "${GREEN}🎉 Document Generator is running successfully!${NC}"
                echo ""
                echo "To stop: $0 stop"
                echo "To view logs: $0 logs"
                echo "To check status: $0 status"
            else
                echo -e "${RED}❌ Some services failed to start properly${NC}"
                echo "Check logs with: $0 logs"
                exit 1
            fi
            ;;
            
        "stop")
            stop_services
            ;;
            
        "restart")
            stop_services
            sleep 2
            main start
            ;;
            
        "status")
            show_status
            ;;
            
        "logs")
            show_logs "$2"
            ;;
            
        "cleanup")
            cleanup
            ;;
            
        "models")
            setup_ollama_models
            ;;
            
        "help"|"-h"|"--help")
            show_help
            ;;
            
        *)
            echo -e "${RED}Unknown command: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Trap signals
trap 'echo -e "\n${YELLOW}Interrupted${NC}"; exit 0' INT TERM

# Run main function
main "$@"