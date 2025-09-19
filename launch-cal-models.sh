#!/bin/bash

# launch-cal-models.sh - Docker + Poetry style Cal Agent Model Orchestrator
# Unified launcher for the complete Cal Agent Ecosystem with dedicated model services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/models.toml"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.cal-agents.yml"
MAIN_COMPOSE="$SCRIPT_DIR/docker-compose.yml"
LOG_FILE="$SCRIPT_DIR/logs/cal-models-$(date +%Y%m%d-%H%M%S).log"
MODELS_DIR="$SCRIPT_DIR/models"
TRAINING_DATA_DIR="$SCRIPT_DIR/training_data"

# Ensure directories exist
mkdir -p "$SCRIPT_DIR/logs" "$MODELS_DIR" "$TRAINING_DATA_DIR"

# Logging functions
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# Header
print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                CAL AGENT MODEL ORCHESTRATOR             ║"
    echo "║          Poetry/LoRAX-style Model Management            ║"
    echo "║                                                          ║"
    echo "║  🤖 Cal Master    | 🚢 Ship Cal    | 📈 Trade Cal      ║"
    echo "║  📚 Wiki Cal      | ⚔️  Combat Cal  | 🔧 Model Mgr     ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker ps &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check configuration file
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "Configuration file not found: $CONFIG_FILE"
        exit 1
    fi
    
    # Check compose files
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Cal Agents compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [[ ! -f "$MAIN_COMPOSE" ]]; then
        log_error "Main compose file not found: $MAIN_COMPOSE"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Parse models.toml and extract model requirements
parse_model_requirements() {
    log "Parsing model requirements from models.toml..."
    
    # Create a simple model list for pulling
    cat > "$SCRIPT_DIR/required-models.txt" << EOF
# Required models for Cal Agent Ecosystem
mistral:7b
codellama:7b  
llama2:7b
phi:latest
EOF
    
    log_success "Model requirements parsed"
}

# Validate environment
validate_environment() {
    log "Validating environment..."
    
    # Check available resources
    AVAILABLE_MEMORY=$(docker system df --format "table {{.Size}}" | tail -n +2 | head -1 | cut -d'B' -f1 | tr -d ' ')
    AVAILABLE_DISK=$(df -h . | tail -1 | awk '{print $4}')
    
    log_info "Available disk space: $AVAILABLE_DISK"
    
    # Check for GPU support
    if command -v nvidia-smi &> /dev/null; then
        GPU_COUNT=$(nvidia-smi --list-gpus | wc -l)
        log_info "NVIDIA GPUs detected: $GPU_COUNT"
        export GPU_ENABLED=true
    else
        log_warn "No NVIDIA GPU detected - using CPU only"
        export GPU_ENABLED=false
    fi
    
    # Check port availability
    PORTS=(5432 6379 11434 11435 11436 11437 11438 8891 8892 3004 3005)
    for port in "${PORTS[@]}"; do
        if netstat -ln 2>/dev/null | grep ":$port " &> /dev/null; then
            log_warn "Port $port is already in use"
        fi
    done
    
    log_success "Environment validation complete"
}

# Create training data structure
setup_training_data() {
    log "Setting up training data structure..."
    
    # Create training data directories
    mkdir -p "$TRAINING_DATA_DIR/ship_templates"
    mkdir -p "$TRAINING_DATA_DIR/osrs_market"
    mkdir -p "$TRAINING_DATA_DIR/wiki_knowledge"
    mkdir -p "$TRAINING_DATA_DIR/security_analysis"
    
    # Create sample training data files if they don't exist
    if [[ ! -f "$TRAINING_DATA_DIR/ship_templates.jsonl" ]]; then
        cat > "$TRAINING_DATA_DIR/ship_templates.jsonl" << EOF
{"prompt": "Create a pirate sloop template with speed optimization", "completion": "// Pirate Sloop - Speed Optimized\\nconst sloopTemplate = {\\n  type: 'sloop',\\n  stats: { speed: 9, armor: 3, firepower: 4 },\\n  optimization: 'speed',\\n  features: ['lightweight_hull', 'speed_sails', 'minimal_armor']\\n};"}
{"prompt": "Design a heavy galleon for combat", "completion": "// Heavy Galleon - Combat Focused\\nconst galleonTemplate = {\\n  type: 'galleon',\\n  stats: { speed: 4, armor: 9, firepower: 8 },\\n  optimization: 'combat',\\n  features: ['reinforced_hull', 'heavy_cannons', 'armor_plating']\\n};"}
EOF
    fi
    
    if [[ ! -f "$TRAINING_DATA_DIR/osrs_market_data.jsonl" ]]; then
        cat > "$TRAINING_DATA_DIR/osrs_market_data.jsonl" << EOF
{"prompt": "Analyze Grand Exchange arbitrage for Dragon bones", "completion": "Dragon bones arbitrage analysis:\\n- Buy price: 2,800 GP\\n- High alch value: 0 GP\\n- Profit margin: Check crafting uses\\n- Volume: High (good liquidity)\\n- Recommendation: Monitor Prayer training demand"}
{"prompt": "Find profitable flipping opportunities", "completion": "Current profitable flips:\\n1. Rune scimitars: 15k buy, 17k sell (2k profit)\\n2. Dragon hide bodies: Variable margins\\n3. Potions during peak hours\\n4. Raw materials before updates"}
EOF
    fi
    
    log_success "Training data structure created"
}

# Start infrastructure services first
start_infrastructure() {
    log "Starting core infrastructure services..."
    
    # Start main services (PostgreSQL, Redis, etc.)
    docker-compose -f "$MAIN_COMPOSE" up -d postgres redis minio
    
    # Wait for services to be ready
    log "Waiting for infrastructure to be ready..."
    
    # Wait for PostgreSQL
    for i in {1..30}; do
        if docker-compose -f "$MAIN_COMPOSE" exec -T postgres pg_isready -U postgres &> /dev/null; then
            break
        fi
        sleep 2
    done
    
    # Wait for Redis
    for i in {1..30}; do
        if docker-compose -f "$MAIN_COMPOSE" exec -T redis redis-cli ping &> /dev/null; then
            break
        fi
        sleep 2
    done
    
    log_success "Infrastructure services ready"
}

# Deploy Ollama instances with models
deploy_ollama_instances() {
    log "Deploying specialized Ollama instances..."
    
    # Start Cal Agent Ollama services
    docker-compose -f "$COMPOSE_FILE" up -d cal-master-ollama ship-cal-ollama trade-cal-ollama wiki-cal-ollama combat-cal-ollama
    
    # Wait for Ollama instances to be ready
    log "Waiting for Ollama instances..."
    sleep 10
    
    # Pull required models for each instance
    OLLAMA_INSTANCES=(
        "11434:mistral:7b:cal-master"
        "11435:codellama:7b:ship-cal"  
        "11436:llama2:7b:trade-cal"
        "11437:mistral:7b:wiki-cal"
        "11438:llama2:7b:combat-cal"
    )
    
    for instance in "${OLLAMA_INSTANCES[@]}"; do
        IFS=':' read -r port model_name model_tag agent_name <<< "$instance"
        full_model="$model_name:$model_tag"
        
        log "Pulling $full_model for $agent_name on port $port..."
        
        # Pull model with retry logic
        for attempt in {1..3}; do
            if curl -s -X POST "http://localhost:$port/api/pull" \
                -H "Content-Type: application/json" \
                -d "{\"name\": \"$full_model\"}" > /dev/null; then
                log_success "Successfully pulled $full_model for $agent_name"
                break
            else
                log_warn "Attempt $attempt failed for $full_model, retrying..."
                sleep 5
            fi
            
            if [[ $attempt -eq 3 ]]; then
                log_error "Failed to pull $full_model after 3 attempts"
            fi
        done
    done
    
    log_success "Ollama instances deployed with models"
}

# Start Cal Agent services
start_cal_agents() {
    log "Starting Cal Agent Ecosystem..."
    
    # Start the Cal Agent service
    docker-compose -f "$COMPOSE_FILE" up -d cal-agent-ecosystem
    
    # Start Model Manager
    docker-compose -f "$COMPOSE_FILE" up -d model-manager
    
    # Start Cal Dashboard
    docker-compose -f "$COMPOSE_FILE" up -d cal-dashboard
    
    log_success "Cal Agent services started"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check service health
    SERVICES=(
        "http://localhost:8891/health:Cal Agent Ecosystem"
        "http://localhost:3004/health:Model Manager"
        "http://localhost:3005/health:Cal Dashboard"
        "http://localhost:11434/api/tags:Cal Master Ollama"
        "http://localhost:11435/api/tags:Ship Cal Ollama"
        "http://localhost:11436/api/tags:Trade Cal Ollama"
        "http://localhost:11437/api/tags:Wiki Cal Ollama"
        "http://localhost:11438/api/tags:Combat Cal Ollama"
    )
    
    ALL_HEALTHY=true
    
    for service in "${SERVICES[@]}"; do
        IFS=':' read -r url name <<< "$service"
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$name is healthy"
        else
            log_error "$name is not responding"
            ALL_HEALTHY=false
        fi
    done
    
    if $ALL_HEALTHY; then
        log_success "All services are healthy!"
        return 0
    else
        log_error "Some services are not healthy"
        return 1
    fi
}

# Display service URLs
show_endpoints() {
    echo -e "\n${PURPLE}🚀 CAL AGENT ECOSYSTEM READY!${NC}\n"
    
    echo -e "${CYAN}📊 Management Interfaces:${NC}"
    echo -e "  Model Manager:     ${GREEN}http://localhost:3004${NC}"
    echo -e "  Cal Dashboard:     ${GREEN}http://localhost:3005${NC}"
    echo -e "  Main Platform:     ${GREEN}http://localhost:8080${NC}"
    
    echo -e "\n${CYAN}🤖 Agent RPC/WebSocket:${NC}"
    echo -e "  RPC Server:        ${GREEN}http://localhost:8891${NC}"
    echo -e "  WebSocket:         ${GREEN}ws://localhost:8892${NC}"
    
    echo -e "\n${CYAN}🧠 Dedicated Ollama Instances:${NC}"
    echo -e "  Cal Master:        ${GREEN}http://localhost:11434${NC} (mistral:7b)"
    echo -e "  Ship Cal:          ${GREEN}http://localhost:11435${NC} (codellama:7b)"
    echo -e "  Trade Cal:         ${GREEN}http://localhost:11436${NC} (llama2:7b)"
    echo -e "  Wiki Cal:          ${GREEN}http://localhost:11437${NC} (mistral:7b)"
    echo -e "  Combat Cal:        ${GREEN}http://localhost:11438${NC} (llama2:7b)"
    
    echo -e "\n${CYAN}💾 Core Infrastructure:${NC}"
    echo -e "  PostgreSQL:        ${GREEN}localhost:5432${NC}"
    echo -e "  Redis:             ${GREEN}localhost:6379${NC}"
    echo -e "  MinIO:             ${GREEN}http://localhost:9000${NC}"
    
    echo -e "\n${YELLOW}💡 Quick Commands:${NC}"
    echo -e "  View logs:         ${BLUE}docker-compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "  Stop all:          ${BLUE}$0 stop${NC}"
    echo -e "  Restart:           ${BLUE}$0 restart${NC}"
    echo -e "  Status:            ${BLUE}$0 status${NC}"
    
    echo ""
}

# Show status
show_status() {
    log "Cal Agent Ecosystem Status:"
    
    echo -e "\n${CYAN}Service Status:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo -e "\n${CYAN}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep -E "(cal-|document-generator-cal)"
    
    echo -e "\n${CYAN}Model Status:${NC}"
    for port in 11434 11435 11436 11437 11438; do
        echo -n "Port $port: "
        if curl -s -f "http://localhost:$port/api/tags" > /dev/null; then
            MODELS=$(curl -s "http://localhost:$port/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | tr '\n' ', ' | sed 's/,$//')
            echo -e "${GREEN}✓ Ready${NC} ($MODELS)"
        else
            echo -e "${RED}✗ Not responding${NC}"
        fi
    done
}

# Stop services
stop_services() {
    log "Stopping Cal Agent services..."
    
    docker-compose -f "$COMPOSE_FILE" down
    
    log_success "Cal Agent services stopped"
}

# Main execution
main() {
    local command=${1:-start}
    
    case $command in
        "start"|"up")
            print_header
            check_prerequisites
            parse_model_requirements
            validate_environment
            setup_training_data
            start_infrastructure
            deploy_ollama_instances
            start_cal_agents
            
            if verify_deployment; then
                show_endpoints
                log_success "Cal Agent Model Orchestrator deployed successfully!"
            else
                log_error "Deployment verification failed"
                exit 1
            fi
            ;;
            
        "stop"|"down")
            print_header
            stop_services
            ;;
            
        "restart")
            print_header
            stop_services
            sleep 5
            main start
            ;;
            
        "status"|"ps")
            show_status
            ;;
            
        "logs")
            docker-compose -f "$COMPOSE_FILE" logs -f
            ;;
            
        "health")
            verify_deployment
            ;;
            
        "models")
            log "Checking model availability across all instances..."
            for port in 11434 11435 11436 11437 11438; do
                echo -e "\n${CYAN}Port $port:${NC}"
                curl -s "http://localhost:$port/api/tags" | jq '.models[] | {name: .name, size: .size}' 2>/dev/null || echo "Not available"
            done
            ;;
            
        "pull")
            shift
            MODEL_NAME=${1:-"mistral:7b"}
            log "Pulling $MODEL_NAME on all instances..."
            
            for port in 11434 11435 11436 11437 11438; do
                log "Pulling on port $port..."
                curl -X POST "http://localhost:$port/api/pull" \
                    -H "Content-Type: application/json" \
                    -d "{\"name\": \"$MODEL_NAME\"}"
            done
            ;;
            
        "help"|"-h"|"--help")
            echo -e "${PURPLE}Cal Agent Model Orchestrator${NC}"
            echo -e "Poetry/LoRAX-style model management for Cal Agent Ecosystem"
            echo ""
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  start, up      Start the Cal Agent Ecosystem"
            echo "  stop, down     Stop all services"
            echo "  restart        Restart all services"
            echo "  status, ps     Show service status"
            echo "  logs           Follow service logs"
            echo "  health         Check service health"
            echo "  models         List available models"
            echo "  pull MODEL     Pull a model on all instances"
            echo "  help           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 start                  # Start everything"
            echo "  $0 pull codellama:7b      # Pull CodeLlama on all instances"
            echo "  $0 logs                   # Follow all logs"
            echo ""
            ;;
            
        *)
            log_error "Unknown command: $command"
            echo "Use '$0 help' for available commands"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"