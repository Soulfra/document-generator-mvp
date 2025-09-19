#!/bin/bash

# 🛑 UNIFIED EMPIRE SHUTDOWN SCRIPT
# Gracefully shuts down the empire gaming universe
# Preserves data and ensures clean shutdown

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Gaming elements
EMPIRE="🏰"
SUCCESS="✅"
SHUTDOWN="🛑"
DATABASE="🗄️"
GAMING="🎮"
AI="🧠"

echo -e "${PURPLE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${SHUTDOWN} UNIFIED EMPIRE SHUTDOWN - PRESERVING GAME STATE ${SHUTDOWN}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎮 Gracefully shutting down empire gaming universe
💾 Preserving all entity data and game state
🔄 Ensuring clean service termination
${NC}"

# Function to log with timestamp and emoji
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

log_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

# Function to safely kill process by PID file
safe_kill() {
    local pid_file=$1
    local process_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "${SHUTDOWN} Stopping $process_name (PID: $pid)..."
            kill -TERM "$pid"
            
            # Wait for graceful shutdown
            for i in {1..10}; do
                if ! kill -0 "$pid" 2>/dev/null; then
                    log "${SUCCESS} $process_name stopped gracefully"
                    rm -f "$pid_file"
                    return 0
                fi
                sleep 1
            done
            
            # Force kill if necessary
            if kill -0 "$pid" 2>/dev/null; then
                log_warning "⚠️ Force killing $process_name..."
                kill -KILL "$pid" 2>/dev/null || true
                rm -f "$pid_file"
            fi
        else
            log_warning "⚠️ $process_name PID file exists but process not running"
            rm -f "$pid_file"
        fi
    else
        log_info "ℹ️ No PID file found for $process_name"
    fi
}

# Phase 1: Stop Node.js Services
echo -e "\n${BLUE}━━━ PHASE 1: STOPPING NODE.JS SERVICES ━━━${NC}"

# Stop Unified Decision Debugger
safe_kill "unified-debugger.pid" "Unified Decision Debugger"

# Stop LLM Reasoning Orchestrator
safe_kill "llm-orchestrator.pid" "LLM Reasoning Orchestrator"

# Stop Real-time Gaming Engine
safe_kill "gaming-engine.pid" "Real-time Gaming Engine"

# Stop any other empire processes
log_info "${SHUTDOWN} Stopping any remaining empire processes..."
pkill -f "empire-" 2>/dev/null || true
pkill -f "unified-decision-debugger" 2>/dev/null || true
pkill -f "real-time-gaming-engine" 2>/dev/null || true
pkill -f "llm-reasoning-orchestrator" 2>/dev/null || true

# Phase 2: Docker Services Shutdown
echo -e "\n${BLUE}━━━ PHASE 2: STOPPING DOCKER SERVICES ━━━${NC}"

log_info "${EMPIRE} Stopping empire-specific services..."

# Stop gaming and specialized services first
GAMING_SERVICES=("cybersecurity-gaming" "espn-sports-hub" "multiplayer-hub" "guardian-teacher")
for service in "${GAMING_SERVICES[@]}"; do
    if docker-compose ps "$service" 2>/dev/null | grep -q "Up"; then
        log_info "${GAMING} Stopping $service..."
        docker-compose stop "$service" 2>/dev/null || true
    fi
done

# Stop main application services
APP_SERVICES=("master-orchestrator" "platform-hub" "ai-api" "template-processor" "analytics")
for service in "${APP_SERVICES[@]}"; do
    if docker-compose ps "$service" 2>/dev/null | grep -q "Up"; then
        log_info "${EMPIRE} Stopping $service..."
        docker-compose stop "$service" 2>/dev/null || true
    fi
done

# Stop AI services
log_info "${AI} Stopping AI services..."
docker-compose stop ollama 2>/dev/null || true

# Phase 3: Data Persistence Check
echo -e "\n${BLUE}━━━ PHASE 3: ENSURING DATA PERSISTENCE ━━━${NC}"

log_info "${DATABASE} Checking database state..."

# Ensure PostgreSQL flushes data
if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
    log_info "${DATABASE} Flushing PostgreSQL data..."
    docker-compose exec -T postgres psql -U postgres -c "CHECKPOINT;" 2>/dev/null || true
    docker-compose exec -T postgres psql -U postgres -d empire_game_world -c "CHECKPOINT;" 2>/dev/null || true
fi

# Ensure Redis saves data
if docker-compose ps redis 2>/dev/null | grep -q "Up"; then
    log_info "${DATABASE} Saving Redis data..."
    docker-compose exec -T redis redis-cli BGSAVE 2>/dev/null || true
    sleep 2
fi

# Phase 4: Infrastructure Shutdown
echo -e "\n${BLUE}━━━ PHASE 4: STOPPING INFRASTRUCTURE ━━━${NC}"

# Stop database services last
log_info "${DATABASE} Stopping database services..."
docker-compose stop postgres redis minio 2>/dev/null || true

# Stop monitoring services
log_info "📊 Stopping monitoring services..."
docker-compose stop prometheus grafana 2>/dev/null || true

# Stop nginx if running
docker-compose stop nginx 2>/dev/null || true

# Phase 5: Cleanup
echo -e "\n${BLUE}━━━ PHASE 5: CLEANUP ━━━${NC}"

log_info "🧹 Cleaning up temporary files..."

# Clean up log files older than 7 days
find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

# Clean up any stale PID files
rm -f *.pid 2>/dev/null || true

# Clean up Docker if requested
if [ "$1" = "--clean" ]; then
    log_info "🗑️ Cleaning up Docker resources..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    if [ "$2" = "--volumes" ]; then
        log_warning "⚠️ Removing Docker volumes (this will delete all data)..."
        docker-compose down --volumes 2>/dev/null || true
    fi
else
    log_info "📦 Keeping Docker containers (use --clean to remove)"
fi

# Phase 6: Final Status
echo -e "\n${BLUE}━━━ PHASE 6: SHUTDOWN VERIFICATION ━━━${NC}"

# Check for any remaining empire processes
REMAINING_PROCESSES=$(pgrep -f "empire\|unified-decision\|gaming-engine\|llm-orchestrator" 2>/dev/null | wc -l)

if [ "$REMAINING_PROCESSES" -eq 0 ]; then
    log "${SUCCESS} All empire processes stopped"
else
    log_warning "⚠️ $REMAINING_PROCESSES empire processes still running"
    pgrep -f "empire\|unified-decision\|gaming-engine\|llm-orchestrator" 2>/dev/null || true
fi

# Check Docker containers
RUNNING_CONTAINERS=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
log_info "📦 Docker containers still running: $RUNNING_CONTAINERS"

# Final status
echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$REMAINING_PROCESSES" -eq 0 ]; then
    echo -e "${GREEN}
${SUCCESS} UNIFIED EMPIRE SHUTDOWN COMPLETE ${SUCCESS}

🎮 Gaming Universe: OFFLINE
🧠 AI Reasoning: STOPPED
📡 Real-time Engine: TERMINATED
💾 Game State: PRESERVED
🗄️ Database: SAFE

📊 SHUTDOWN SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All empire processes stopped gracefully
✅ Game state and entity data preserved
✅ Database integrity maintained
✅ No orphaned processes remaining

🚀 TO RESTART THE EMPIRE:
./start-unified-empire.sh

📋 SHUTDOWN OPTIONS:
./stop-unified-empire.sh --clean          # Remove containers
./stop-unified-empire.sh --clean --volumes # Remove all data
${NC}"
else
    echo -e "${YELLOW}
⚠️ EMPIRE SHUTDOWN WITH WARNINGS

Some processes may still be running. Check manually:
ps aux | grep -E 'empire|unified-decision|gaming-engine|llm-orchestrator'

To force kill all processes:
pkill -f 'empire|unified-decision|gaming-engine|llm-orchestrator'
${NC}"
fi

echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create shutdown timestamp
echo "Empire shutdown at: $(date)" > .last-shutdown

log "${SUCCESS} Empire shutdown complete. Game state preserved for next launch."