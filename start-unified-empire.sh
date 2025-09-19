#!/bin/bash

# 🎮 UNIFIED EMPIRE STARTUP SCRIPT
# Launches the complete 300+ domain empire as a unified gaming universe
# Manages database migration, service adaptation, and real-time systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Gaming elements
EMPIRE="🏰"
SUCCESS="✅"
FAILURE="❌"
LOADING="⚡"
DATABASE="🗄️"
GAMING="🎮"
AI="🧠"
NETWORK="📡"
MIGRATION="🔄"

echo -e "${PURPLE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${EMPIRE} UNIFIED EMPIRE STARTUP - GAMING UNIVERSE INITIALIZATION ${EMPIRE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Transforming 300+ domain empire into GTA6-style gaming universe
🧠 LLM reasoning with PostgreSQL-powered entity system  
🎮 Real-time gaming engine with WebSocket triggers
⚡ Unified database schema with gacha mechanics
🎁 Content generation triggered by gamepad combos
${NC}"

# Function to log with timestamp and emoji
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

log_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    ! lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local timeout=${3:-60}
    
    log_info "${LOADING} Waiting for $name to be ready..."
    
    for i in $(seq 1 $timeout); do
        if curl -s "$url" >/dev/null 2>&1; then
            log "${SUCCESS} $name is ready!"
            return 0
        fi
        sleep 1
    done
    
    log_error "${FAILURE} $name failed to start within $timeout seconds"
    return 1
}

# Phase 1: Environment Check
echo -e "\n${CYAN}━━━ PHASE 1: ENVIRONMENT VERIFICATION ━━━${NC}"

log_info "🔍 Checking system requirements..."

# Check required commands
REQUIRED_COMMANDS=("node" "npm" "docker" "docker-compose" "psql" "curl")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if command_exists "$cmd"; then
        log "${SUCCESS} $cmd found"
    else
        log_error "${FAILURE} $cmd not found - please install $cmd"
        exit 1
    fi
done

# Check Node.js version
NODE_VERSION=$(node --version | cut -c2-)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
if [ "$NODE_MAJOR" -ge 18 ]; then
    log "${SUCCESS} Node.js version: $NODE_VERSION"
else
    log_error "${FAILURE} Node.js 18+ required, found: $NODE_VERSION"
    exit 1
fi

# Check Docker
if docker info >/dev/null 2>&1; then
    log "${SUCCESS} Docker daemon is running"
else
    log_error "${FAILURE} Docker daemon is not running - please start Docker"
    exit 1
fi

# Check available ports
REQUIRED_PORTS=(5432 6379 3000 3001 7777 7788 11434)
for port in "${REQUIRED_PORTS[@]}"; do
    if port_available $port; then
        log "${SUCCESS} Port $port is available"
    else
        log_warning "${YELLOW}⚠️${NC} Port $port is in use - may cause conflicts"
    fi
done

# Phase 2: Database Infrastructure
echo -e "\n${CYAN}━━━ PHASE 2: DATABASE INFRASTRUCTURE ━━━${NC}"

log_info "${DATABASE} Starting PostgreSQL and Redis..."

# Start core database services
if ! docker-compose ps postgres | grep -q "Up"; then
    docker-compose up -d postgres redis
    log "${LOADING} Starting database services..."
    sleep 10
fi

# Wait for PostgreSQL
log_info "${DATABASE} Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
    log_info "Waiting for PostgreSQL..."
    sleep 2
done
log "${SUCCESS} PostgreSQL is ready"

# Wait for Redis
log_info "${DATABASE} Waiting for Redis..."
until docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; do
    log_info "Waiting for Redis..."
    sleep 2
done
log "${SUCCESS} Redis is ready"

# Initialize empire database schema
log_info "${DATABASE} Initializing empire database schema..."
if docker-compose exec -T postgres psql -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname='empire_game_world'" | grep -q 1; then
    log "${SUCCESS} Empire database already exists"
else
    log_info "${MIGRATION} Creating empire database and schema..."
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE empire_game_world;"
    docker-compose exec -T postgres psql -U postgres -d empire_game_world < EMPIRE-MASTER-SCHEMA.sql
    log "${SUCCESS} Empire database schema created"
fi

# Phase 3: AI Infrastructure
echo -e "\n${CYAN}━━━ PHASE 3: AI INFRASTRUCTURE ━━━${NC}"

log_info "${AI} Starting Ollama for local AI processing..."

# Start Ollama
if ! docker-compose ps ollama | grep -q "Up"; then
    docker-compose up -d ollama
    log "${LOADING} Starting Ollama..."
    sleep 15
fi

# Wait for Ollama
log_info "${AI} Waiting for Ollama API..."
until curl -s http://localhost:11434/api/tags >/dev/null 2>&1; do
    log_info "Waiting for Ollama..."
    sleep 3
done
log "${SUCCESS} Ollama is ready"

# Pull required models
log_info "${AI} Ensuring required AI models are available..."
MODELS=("codellama:7b" "mistral:7b")
for model in "${MODELS[@]}"; do
    if docker-compose exec -T ollama ollama list | grep -q "$model"; then
        log "${SUCCESS} Model $model is available"
    else
        log_info "${LOADING} Pulling model $model..."
        docker-compose exec -T ollama ollama pull "$model" &
    fi
done

# Wait for model pulls to complete
wait
log "${SUCCESS} AI models ready"

# Phase 4: Core Empire Services
echo -e "\n${CYAN}━━━ PHASE 4: CORE EMPIRE SERVICES ━━━${NC}"

log_info "${EMPIRE} Installing Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    log "${SUCCESS} Dependencies installed"
else
    log "${SUCCESS} Dependencies already installed"
fi

# Start template processor (MCP service)
log_info "${EMPIRE} Starting template processor service..."
if ! docker-compose ps template-processor | grep -q "Up"; then
    docker-compose up -d template-processor
fi

# Start AI API service
log_info "${AI} Starting AI API service..."
if ! docker-compose ps ai-api | grep -q "Up"; then
    docker-compose up -d ai-api
fi

# Wait for core services
wait_for_service "http://localhost:3000/health" "Template Processor" 60
wait_for_service "http://localhost:3001/health" "AI API" 60

# Phase 5: Empire Migration
echo -e "\n${CYAN}━━━ PHASE 5: EMPIRE MIGRATION ━━━${NC}"

log_info "${MIGRATION} Running empire migration to gaming system..."

# Check if migration has been run
MIGRATION_CHECK=$(docker-compose exec -T postgres psql -U postgres -d empire_game_world -t -c "SELECT COUNT(*) FROM empire_entities WHERE entity_type='domain';" 2>/dev/null | xargs)

if [ "$MIGRATION_CHECK" -gt 0 ]; then
    log "${SUCCESS} Empire migration already completed ($MIGRATION_CHECK entities found)"
else
    log_info "${MIGRATION} Starting empire discovery and migration..."
    
    # Run migration orchestrator
    if node empire-migration-orchestrator.js; then
        log "${SUCCESS} Empire migration completed successfully"
    else
        log_error "${FAILURE} Empire migration failed"
        exit 1
    fi
fi

# Phase 6: Gaming Engine
echo -e "\n${CYAN}━━━ PHASE 6: REAL-TIME GAMING ENGINE ━━━${NC}"

log_info "${GAMING} Starting real-time gaming engine..."

# Start gaming engine in background
if pgrep -f "real-time-gaming-engine.js" >/dev/null; then
    log "${SUCCESS} Gaming engine already running"
else
    nohup node real-time-gaming-engine.js > gaming-engine.log 2>&1 &
    GAMING_PID=$!
    echo $GAMING_PID > gaming-engine.pid
    log "${SUCCESS} Gaming engine started (PID: $GAMING_PID)"
fi

# Wait for gaming engine
wait_for_service "ws://localhost:7788" "Gaming Engine WebSocket" 30 || true

# Phase 7: LLM Reasoning Orchestrator
echo -e "\n${CYAN}━━━ PHASE 7: LLM REASONING ORCHESTRATOR ━━━${NC}"

log_info "${AI} Starting LLM reasoning orchestrator..."

# Start LLM orchestrator in background
if pgrep -f "llm-reasoning-orchestrator.js" >/dev/null; then
    log "${SUCCESS} LLM orchestrator already running"
else
    nohup node llm-reasoning-orchestrator.js > llm-orchestrator.log 2>&1 &
    LLM_PID=$!
    echo $LLM_PID > llm-orchestrator.pid
    log "${SUCCESS} LLM orchestrator started (PID: $LLM_PID)"
fi

# Phase 8: Service Adaptation
echo -e "\n${CYAN}━━━ PHASE 8: SERVICE ADAPTATION ━━━${NC}"

log_info "${EMPIRE} Adapting existing services to unified system..."

# Create service adapter instances
log_info "🔌 Initializing service adapters..."
if node -e "
const AIAdapter = require('./service-adapters/ai-api-adapter');
const adapter = new AIAdapter();
adapter.initialize().then(() => {
    console.log('Service adapters initialized');
    process.exit(0);
}).catch(err => {
    console.error('Adapter initialization failed:', err);
    process.exit(1);
});
"; then
    log "${SUCCESS} Service adapters initialized"
else
    log_warning "${YELLOW}⚠️${NC} Service adapter initialization had issues"
fi

# Phase 9: Unified Decision Debugger
echo -e "\n${CYAN}━━━ PHASE 9: UNIFIED DECISION DEBUGGER ━━━${NC}"

log_info "${NETWORK} Starting unified decision debugger on port 7777..."

# Start unified debugger in background
if pgrep -f "unified-decision-debugger.js" >/dev/null; then
    log "${SUCCESS} Unified debugger already running"
else
    nohup node unified-decision-debugger.js > unified-debugger.log 2>&1 &
    DEBUGGER_PID=$!
    echo $DEBUGGER_PID > unified-debugger.pid
    log "${SUCCESS} Unified debugger started (PID: $DEBUGGER_PID)"
fi

# Wait for unified debugger
wait_for_service "http://localhost:7777" "Unified Decision Debugger" 30

# Phase 10: System Verification
echo -e "\n${CYAN}━━━ PHASE 10: SYSTEM VERIFICATION ━━━${NC}"

log_info "🔍 Verifying empire gaming system..."

# Check all core services
SERVICES=(
    "http://localhost:7777:Unified Debugger"
    "http://localhost:7788:Gaming Engine"
    "http://localhost:3000/health:Template Processor"
    "http://localhost:3001/health:AI API"
    "http://localhost:5432:PostgreSQL"
    "http://localhost:6379:Redis"
    "http://localhost:11434/api/tags:Ollama"
)

ALL_GOOD=true
for service in "${SERVICES[@]}"; do
    IFS=':' read -r url name <<< "$service"
    if curl -s "$url" >/dev/null 2>&1; then
        log "${SUCCESS} $name is responding"
    else
        log_error "${FAILURE} $name is not responding at $url"
        ALL_GOOD=false
    fi
done

# Check database entities
ENTITY_COUNT=$(docker-compose exec -T postgres psql -U postgres -d empire_game_world -t -c "SELECT COUNT(*) FROM empire_entities;" 2>/dev/null | xargs)
if [ "$ENTITY_COUNT" -gt 0 ]; then
    log "${SUCCESS} Empire entities: $ENTITY_COUNT"
else
    log_error "${FAILURE} No empire entities found"
    ALL_GOOD=false
fi

# Final Status
echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}
${EMPIRE} UNIFIED EMPIRE SUCCESSFULLY LAUNCHED! ${EMPIRE}

🎮 Gaming Universe Status: ACTIVE
🧠 AI Reasoning: ONLINE  
📡 Real-time Engine: RUNNING
🏰 Empire Entities: $ENTITY_COUNT
⚡ Database: READY

🎯 ACCESS POINTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 Gaming Dashboard:     http://localhost:7777
🧠 AI Services:          http://localhost:3001
📝 Template Processor:   http://localhost:3000
📊 Database Admin:       http://localhost:5432
⚡ Redis Console:        http://localhost:6379
🤖 Ollama API:          http://localhost:11434

🎁 GAMING FEATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 Gamepad Combos:       Content generation via controller
🎁 Gacha System:         Random rarity content drops
🏆 Achievements:         Unlockable gaming milestones
🥕 Carrots Economy:      Universal gaming currency
🌐 Domain Zones:         300+ domains as game world areas
🤖 Service NPCs:         All services as interactive entities

🚀 READY FOR GAMING! Your empire is now a living, breathing game world.
${NC}"

    # Save PIDs for easy management
    echo -e "\n📋 Process Management:"
    echo "Gaming Engine PID: $(cat gaming-engine.pid 2>/dev/null || echo 'Not found')"
    echo "LLM Orchestrator PID: $(cat llm-orchestrator.pid 2>/dev/null || echo 'Not found')"
    echo "Unified Debugger PID: $(cat unified-debugger.pid 2>/dev/null || echo 'Not found')"
    
    echo -e "\n🛑 To stop the empire:"
    echo "./stop-unified-empire.sh"
    
else
    echo -e "${RED}
${FAILURE} EMPIRE LAUNCH FAILED

Some services failed to start properly. Check the logs:
- gaming-engine.log
- llm-orchestrator.log  
- unified-debugger.log
- docker-compose logs

${NC}"
    exit 1
fi

echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"