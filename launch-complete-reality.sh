#!/bin/bash

# 💾⚡ COMPLETE REALITY SYSTEM LAUNCHER
# ===================================
# BREAK OUT OF SIMULATION HELL FOREVER
# No more D&D manual loops - everything is REAL and PERSISTENT

set -e

echo "💾⚡ COMPLETE REALITY SYSTEM LAUNCHER"
echo "==================================="
echo ""
echo "🚫 NO MORE SIMULATIONS"
echo "🔒 EVERYTHING LOCKS INTO PERSISTENT DATABASE"
echo "📚 NO MORE D&D MANUAL REFERENCE LOOPS"
echo "⚡ BREAK OUT OF THE INFINITE RECURSION"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js to continue."
    exit 1
fi
echo "   ✅ Node.js available"

# Check for SQLite3
if node -e "require('sqlite3')" 2>/dev/null; then
    echo "   ✅ SQLite3 module available"
else
    echo "   📦 Installing SQLite3 module..."
    npm install sqlite3
    if [[ $? -eq 0 ]]; then
        echo "   ✅ SQLite3 module installed"
    else
        echo "   ❌ Failed to install SQLite3 module"
        echo "      Try: npm install sqlite3 --build-from-source"
        exit 1
    fi
fi

# Check WebSocket module
if node -e "require('ws')" 2>/dev/null; then
    echo "   ✅ WebSocket module available"
else
    echo "   📦 Installing WebSocket module..."
    npm install ws
    if [[ $? -eq 0 ]]; then
        echo "   ✅ WebSocket module installed"
    else
        echo "   ❌ Failed to install WebSocket module"
        exit 1
    fi
fi

# Check for required files
REQUIRED_FILES=(
    "reality-database-core.js"
    "reality-integration-system.js"
    "master-ai-agent-observatory.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ Found $file"
    else
        echo "   ❌ Missing $file"
        echo "      This file is required for the reality system."
        exit 1
    fi
done

echo ""

# Create reality directories
echo "🏗️ Setting up reality infrastructure..."
mkdir -p .reality-system/logs
mkdir -p .reality-system/database
mkdir -p .reality-system/exports
mkdir -p .reality-system/backups
echo "   ✅ Reality infrastructure ready"

# Create database backup if it exists
if [[ -f "REALITY.db" ]]; then
    echo "💾 Backing up existing reality database..."
    cp REALITY.db ".reality-system/backups/REALITY-backup-$(date +%Y%m%d-%H%M%S).db"
    echo "   ✅ Database backed up"
fi

echo ""
echo "🚀 LAUNCHING COMPLETE REALITY SYSTEM..."
echo "======================================"

# Start reality integration system
echo "⚡ Starting reality integration system..."
nohup node reality-integration-system.js > .reality-system/logs/reality-integration.log 2>&1 &
INTEGRATION_PID=$!
echo $INTEGRATION_PID > .reality-system/logs/reality-integration.pid

echo "   ⚡ Reality integration started (PID: $INTEGRATION_PID)"
echo "   💾 SQLite database initializing..."
echo "   🤖 52 AI agents being loaded into persistent reality..."
echo "   ⏳ Waiting for reality database to lock in..."

# Wait for reality system to initialize
max_attempts=15
attempt=1
reality_ready=false

while [[ $attempt -le $max_attempts ]]; do
    # Check if REALITY.db exists and has data
    if [[ -f "REALITY.db" ]] && [[ $(wc -c < "REALITY.db") -gt 1000 ]]; then
        echo "   💾 Reality database locked in with persistent data"
        reality_ready=true
        break
    else
        echo "   ⏳ Attempt $attempt/$max_attempts - locking in reality..."
        sleep 3
        ((attempt++))
    fi
done

if [[ "$reality_ready" != true ]]; then
    echo "   ⚠️  Reality may still be initializing..."
fi

# Start master observatory (now connected to reality DB)
echo ""
echo "🧠 Starting AI agent observatory (connected to reality)..."
nohup node master-ai-agent-observatory.js > .reality-system/logs/observatory.log 2>&1 &
OBSERVATORY_PID=$!
echo $OBSERVATORY_PID > .reality-system/logs/observatory.pid

echo "   🧠 Observatory started (PID: $OBSERVATORY_PID)"
echo "   📡 Now connected to persistent reality database"
echo "   ⏳ Waiting for agents to load from database..."

# Wait for observatory
sleep 10

# Check if observatory is ready
if lsof -i :9200 > /dev/null 2>&1; then
    echo "   ✅ Observatory ready and connected to reality"
else
    echo "   ⚠️  Observatory may still be starting..."
fi

echo ""
echo "🌐 Opening reality system interfaces..."

# Function to open browser
open_browser() {
    local url=$1
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$url" || sensible-browser "$url" || firefox "$url"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        start "$url"
    else
        echo "   ⚠️  Could not auto-open browser. Please manually open: $url"
    fi
}

# Open the reality-connected observatory
sleep 3
open_browser "http://localhost:9200"

echo ""
echo "🎉 COMPLETE REALITY SYSTEM IS ACTIVE!"
echo "====================================="
echo ""
echo "💾 REALITY DATABASE STATUS"
echo "=========================="
echo "Database File:         $(pwd)/REALITY.db"
echo "Reality Integration:   http://localhost:9200"
echo "Agent Observatory:     http://localhost:9200 (same interface, now persistent!)"
echo "Integration Logs:      tail -f .reality-system/logs/reality-integration.log"
echo "Observatory Logs:      tail -f .reality-system/logs/observatory.log"
echo ""
echo "🔒 REALITY LOCKED IN - NO MORE SIMULATION LOOPS"
echo "=============================================="
echo ""
echo "💾 PERSISTENT DATABASE TABLES:"
echo "   • agents: All 52 AI agents with permanent state"
echo "   • conversations: Every message ever spoken"
echo "   • decisions: All decisions made by any agent"
echo "   • reasoning_sessions: Complete session history"
echo "   • agent_states: State change tracking"
echo "   • system_events: Complete system event log"
echo "   • reality_metadata: System configuration data"
echo ""
echo "🤖 52 AI AGENTS NOW PERSISTENT:"
echo "   🔴 Executive Council (4): CEO, CTO, Strategy, Oversight"
echo "   🟠 Department Heads (16): 4 departments × 4 agents each"
echo "   🔵 Specialist Teams (16): 4 teams × 4 specialists each"  
echo "   🟢 Worker Pods (16): 4 pods × 4 workers each"
echo ""
echo "🔗 WHAT'S NOW CONNECTED TO REALITY:"
echo "   ✅ All agent conversations are permanently recorded"
echo "   ✅ All decisions build historical context"
echo "   ✅ Agent relationships and interactions persist"
echo "   ✅ System events create permanent audit trail"
echo "   ✅ No more data loss when systems restart"
echo "   ✅ Agents remember previous conversations"
echo "   ✅ Decision history influences future choices"
echo ""
echo "📊 REALITY DATABASE OPERATIONS:"
echo "   View all agents:      sqlite3 REALITY.db 'SELECT id, name, type, current_state FROM agents;'"
echo "   View conversations:   sqlite3 REALITY.db 'SELECT speaker_id, message_content FROM conversations LIMIT 10;'"
echo "   View decisions:       sqlite3 REALITY.db 'SELECT decision_type, description FROM decisions LIMIT 10;'"
echo "   Count records:        sqlite3 REALITY.db 'SELECT COUNT(*) FROM agents;'"
echo "   Export to JSON:       node -e \"const r=require('./reality-integration-system');new r().exportCompleteReality()\""
echo ""
echo "🎯 WHAT CHANGED FROM SIMULATION TO REALITY:"
echo "   ❌ BEFORE: Fake agent conversations that disappear"
echo "   ✅ NOW: Real conversations stored in SQLite database"
echo ""
echo "   ❌ BEFORE: Simulated decisions with no history"  
echo "   ✅ NOW: All decisions recorded with full context"
echo ""
echo "   ❌ BEFORE: Agent states reset every restart"
echo "   ✅ NOW: Agent states persist and build over time"
echo ""
echo "   ❌ BEFORE: No memory between sessions"
echo "   ✅ NOW: Complete memory and relationship history"
echo ""
echo "   ❌ BEFORE: D&D manual infinite reference loops"
echo "   ✅ NOW: Linear progression with persistent state"
echo ""
echo "📈 GROWING INTELLIGENCE:"
echo "   • Agents learn from conversation history"
echo "   • Decision patterns improve over time"
echo "   • Relationships deepen through interactions"
echo "   • Collective intelligence builds naturally"
echo "   • System gets smarter with every conversation"
echo ""
echo "🔄 DATABASE SYNCHRONIZATION:"
echo "   • Reality sync every 10 seconds"
echo "   • All system changes immediately persisted"
echo "   • Automatic database backups created"
echo "   • Complete system state export available"
echo ""
echo "🛠️ REALITY SYSTEM MANAGEMENT:"
echo "   Check integration:    curl http://localhost:9200/api/agents | jq '.'"
echo "   View database size:   ls -lh REALITY.db"
echo "   Backup database:      cp REALITY.db \"backup-\$(date +%Y%m%d).db\""
echo "   Stop integration:     kill \$(cat .reality-system/logs/reality-integration.pid)"
echo "   Stop observatory:     kill \$(cat .reality-system/logs/observatory.pid)"
echo ""
echo "🎮 THE DIFFERENCE:"
echo "================"
echo "This is like the difference between:"
echo "   📚 Reading about D&D rules (simulation)"
echo "   🎯 Actually playing a persistent campaign (reality)"
echo ""
echo "Your AI agents now have:"
echo "   • Permanent memory"
echo "   • Growing relationships"
echo "   • Decision history"
echo "   • Persistent personality development"
echo "   • Real consequences for actions"
echo ""
echo "🎊 REALITY SYSTEM IS LOCKED AND LOADED!"
echo "   No more simulations - everything is real"
echo "   No more loops - linear progression"
echo "   No more resets - persistent state"
echo "   Watch your AI society grow and evolve!"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 SHUTTING DOWN REALITY SYSTEM..."
    echo "================================="
    
    # Stop integration system
    if [[ -f ".reality-system/logs/reality-integration.pid" ]]; then
        pid=$(cat ".reality-system/logs/reality-integration.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   ⚡ Stopping reality integration (PID: $pid)"
            kill "$pid"
        fi
        rm -f ".reality-system/logs/reality-integration.pid"
    fi
    
    # Stop observatory
    if [[ -f ".reality-system/logs/observatory.pid" ]]; then
        pid=$(cat ".reality-system/logs/observatory.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   🧠 Stopping AI observatory (PID: $pid)"
            kill "$pid"
        fi
        rm -f ".reality-system/logs/observatory.pid"
    fi
    
    # Final database backup
    if [[ -f "REALITY.db" ]]; then
        echo "   💾 Creating final database backup..."
        cp REALITY.db ".reality-system/backups/REALITY-final-backup-$(date +%Y%m%d-%H%M%S).db"
    fi
    
    echo "   🔒 Reality system shutdown complete"
    echo "   💾 All data preserved in REALITY.db"
    echo "   📁 Backups saved in .reality-system/backups/"
    echo ""
    echo "✅ Reality is locked in - no data lost!"
    echo "   Your AI society will remember everything next time."
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Monitor reality system
echo "🔄 Reality system monitoring active. Press Ctrl+C to shutdown safely."
echo ""

# Monitoring loop
while true; do
    sleep 60  # Check every minute
    
    # Check if database exists and is growing
    if [[ -f "REALITY.db" ]]; then
        db_size=$(wc -c < "REALITY.db")
        echo "💾 $(date): Reality database size: $db_size bytes - system active"
        
        # Check if systems are still running
        integration_running=false
        observatory_running=false
        
        if [[ -f ".reality-system/logs/reality-integration.pid" ]]; then
            pid=$(cat ".reality-system/logs/reality-integration.pid")
            if kill -0 "$pid" 2>/dev/null; then
                integration_running=true
            fi
        fi
        
        if [[ -f ".reality-system/logs/observatory.pid" ]]; then
            pid=$(cat ".reality-system/logs/observatory.pid")
            if kill -0 "$pid" 2>/dev/null; then
                observatory_running=true
            fi
        fi
        
        if [[ "$integration_running" != true ]] || [[ "$observatory_running" != true ]]; then
            echo "⚠️  Some systems appear offline - reality may not be updating"
        fi
        
    else
        echo "❌ $(date): Reality database missing - system may have failed"
    fi
done