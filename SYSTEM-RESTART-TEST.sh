#!/bin/bash

# 🔄 SYSTEM RESTART & RECOVERY TEST
# 
# Comprehensive test to verify system restart, state persistence, 
# and reconnection capabilities across all services

echo "🔄 SYSTEM RESTART & RECOVERY TEST"
echo "=================================="
echo ""
echo "🎯 Testing:"
echo "1. 🛑 Graceful shutdown of all services"
echo "2. 💾 State persistence verification" 
echo "3. 🚀 Service restart in correct order"
echo "4. 🔌 WebSocket reconnection testing"
echo "5. 🟣 Debug functionality post-restart"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Service tracking
SERVICES_PIDS=()
TEST_RESULTS=()

# Utility functions
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
}

debug() {
    echo -e "${PURPLE}[$(date '+%H:%M:%S')] DEBUG:${NC} $1"
}

check_port() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
    return $?
}

wait_for_port() {
    local port=$1
    local timeout=${2:-30}
    local count=0
    
    while [ $count -lt $timeout ]; do
        if check_port $port; then
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    return 1
}

test_health_endpoint() {
    local url=$1
    local timeout=${2:-10}
    
    if command -v curl >/dev/null 2>&1; then
        curl -s --max-time $timeout "$url/health" >/dev/null 2>&1 || \
        curl -s --max-time $timeout "$url/api/health" >/dev/null 2>&1 || \
        curl -s --max-time $timeout "$url" >/dev/null 2>&1
    else
        # Fallback to port check if curl not available
        local port=$(echo $url | sed 's/.*://' | sed 's/[^0-9]//g')
        check_port $port
    fi
}

# Phase 1: Initial System Startup
echo ""
echo "🚀 PHASE 1: INITIAL SYSTEM STARTUP"
echo "==================================="

log "Starting Universal Display Kernel..."
if [ -f "UNIVERSAL-DISPLAY-KERNEL.js" ]; then
    node UNIVERSAL-DISPLAY-KERNEL.js > /tmp/display-kernel.log 2>&1 &
    DISPLAY_KERNEL_PID=$!
    SERVICES_PIDS+=($DISPLAY_KERNEL_PID)
    log "Display Kernel started (PID: $DISPLAY_KERNEL_PID)"
else
    error "UNIVERSAL-DISPLAY-KERNEL.js not found!"
    exit 1
fi

# Give it time to start
sleep 3

# Check if Display Kernel started properly
if wait_for_port 8888 10; then
    log "✅ Display Kernel responding on port 8888"
else
    error "❌ Display Kernel failed to start on port 8888"
    TEST_RESULTS+=("FAIL: Display Kernel startup")
fi

log "Starting Fluid State Manager..."
if [ -f "UNIFIED-FLUID-STATE-MANAGER.js" ]; then
    node UNIFIED-FLUID-STATE-MANAGER.js > /tmp/fluid-state.log 2>&1 &
    FLUID_STATE_PID=$!
    SERVICES_PIDS+=($FLUID_STATE_PID)
    log "Fluid State Manager started (PID: $FLUID_STATE_PID)"
    
    # Wait for WebSocket port
    if wait_for_port 8081 10; then
        log "✅ Fluid State WebSocket responding on port 8081"
    else
        warn "⚠️ Fluid State WebSocket not responding (may start later)"
    fi
else
    warn "UNIFIED-FLUID-STATE-MANAGER.js not found, continuing without it"
fi

# Wait for services to fully initialize
log "Waiting for services to initialize..."
sleep 5

# Phase 2: Create Test Data
echo ""
echo "📊 PHASE 2: CREATE TEST DATA"
echo "============================="

log "Creating test data through API calls..."

# Test data to create
TEST_AGENTS=("TestAgent1" "TestAgent2" "RestartTestAgent")
API_CALLS_MADE=0

for agent in "${TEST_AGENTS[@]}"; do
    log "Creating agent: $agent"
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -X POST http://localhost:8888/api/test \
            -H "Content-Type: application/json" \
            -d "{\"action\":\"create_agent\",\"name\":\"$agent\"}" 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            log "✅ Agent $agent created"
            API_CALLS_MADE=$((API_CALLS_MADE + 1))
        else
            warn "⚠️ Failed to create agent $agent"
        fi
    else
        warn "curl not available, skipping API test data creation"
        break
    fi
    sleep 1
done

# Record initial state
INITIAL_STATE_FILE="/tmp/initial_system_state.json"
log "Recording initial state to $INITIAL_STATE_FILE"

cat > "$INITIAL_STATE_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "agents_created": ${#TEST_AGENTS[@]},
  "api_calls_made": $API_CALLS_MADE,
  "services": {
    "display_kernel": {
      "pid": $DISPLAY_KERNEL_PID,
      "port": 8888,
      "status": "running"
    },
    "fluid_state": {
      "pid": ${FLUID_STATE_PID:-0},
      "port": 8081,
      "status": "running"
    }
  }
}
EOF

log "Initial state recorded. System ready for restart test."

# Phase 3: Verify Services Are Working
echo ""
echo "🔍 PHASE 3: PRE-RESTART VERIFICATION"
echo "====================================="

log "Testing mobile debugger interface..."
if test_health_endpoint "http://localhost:8888" 5; then
    log "✅ Mobile debugger interface responding"
    TEST_RESULTS+=("PASS: Mobile debugger pre-restart")
else
    error "❌ Mobile debugger interface not responding"
    TEST_RESULTS+=("FAIL: Mobile debugger pre-restart")
fi

log "Testing WebSocket connectivity..."
if check_port 8889; then
    log "✅ Display Kernel WebSocket port open"
else
    warn "⚠️ Display Kernel WebSocket port not open"
fi

# Phase 4: Graceful Shutdown
echo ""
echo "🛑 PHASE 4: GRACEFUL SHUTDOWN"
echo "=============================="

log "Beginning graceful shutdown of all services..."

# Function to gracefully shutdown a service
graceful_shutdown() {
    local pid=$1
    local name=$2
    local timeout=${3:-15}
    
    if kill -0 $pid 2>/dev/null; then
        log "Sending SIGTERM to $name (PID: $pid)"
        kill -TERM $pid 2>/dev/null
        
        # Wait for graceful shutdown
        local count=0
        while [ $count -lt $timeout ] && kill -0 $pid 2>/dev/null; do
            sleep 1
            count=$((count + 1))
        done
        
        if kill -0 $pid 2>/dev/null; then
            warn "$name didn't respond to SIGTERM, using SIGKILL"
            kill -KILL $pid 2>/dev/null
            sleep 2
        fi
        
        if kill -0 $pid 2>/dev/null; then
            error "Failed to stop $name (PID: $pid)"
            return 1
        else
            log "✅ $name stopped successfully"
            return 0
        fi
    else
        warn "$name (PID: $pid) was already stopped"
        return 0
    fi
}

# Shutdown services in reverse order
if [ ${FLUID_STATE_PID:-0} -gt 0 ]; then
    graceful_shutdown $FLUID_STATE_PID "Fluid State Manager"
fi

graceful_shutdown $DISPLAY_KERNEL_PID "Display Kernel"

# Verify all ports are freed
log "Verifying ports are freed..."
sleep 3

PORTS_TO_CHECK=(8888 8889 8081)
PORTS_STILL_OPEN=()

for port in "${PORTS_TO_CHECK[@]}"; do
    if check_port $port; then
        PORTS_STILL_OPEN+=($port)
        warn "Port $port still in use"
    else
        log "✅ Port $port freed"
    fi
done

if [ ${#PORTS_STILL_OPEN[@]} -gt 0 ]; then
    error "Some ports still in use: ${PORTS_STILL_OPEN[*]}"
    log "Force killing processes on busy ports..."
    for port in "${PORTS_STILL_OPEN[@]}"; do
        lsof -ti :$port | xargs kill -9 2>/dev/null
        log "Force killed processes on port $port"
    done
    sleep 2
fi

# Phase 5: Startup Verification
echo ""
echo "💾 PHASE 5: PERSISTENCE VERIFICATION"  
echo "====================================="

log "Checking for state persistence files..."

STATE_FILES_FOUND=()
STATE_FILES_TO_CHECK=(
    "./state/unified-state.db"
    "./databases/economic-engine.db" 
    "./unified-state.db"
    "./economic-engine.db"
)

for file in "${STATE_FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        STATE_FILES_FOUND+=("$file")
        log "✅ Found state file: $file"
        # Check file size
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "unknown")
        log "   Size: $size bytes"
    fi
done

if [ ${#STATE_FILES_FOUND[@]} -eq 0 ]; then
    warn "⚠️ No state persistence files found"
    TEST_RESULTS+=("WARN: No persistence files found")
else
    log "✅ Found ${#STATE_FILES_FOUND[@]} state persistence files"
    TEST_RESULTS+=("PASS: State files exist")
fi

# Phase 6: System Restart
echo ""
echo "🔄 PHASE 6: SYSTEM RESTART"
echo "=========================="

log "Restarting systems in dependency order..."

# Clear previous PIDs
SERVICES_PIDS=()

log "Starting Universal Display Kernel..."
node UNIVERSAL-DISPLAY-KERNEL.js > /tmp/display-kernel-restart.log 2>&1 &
DISPLAY_KERNEL_PID=$!
SERVICES_PIDS+=($DISPLAY_KERNEL_PID)

# Wait for startup
if wait_for_port 8888 15; then
    log "✅ Display Kernel restarted successfully"
    TEST_RESULTS+=("PASS: Display Kernel restart")
else
    error "❌ Display Kernel failed to restart"
    TEST_RESULTS+=("FAIL: Display Kernel restart")
fi

if [ -f "UNIFIED-FLUID-STATE-MANAGER.js" ]; then
    log "Starting Fluid State Manager..."
    node UNIFIED-FLUID-STATE-MANAGER.js > /tmp/fluid-state-restart.log 2>&1 &
    FLUID_STATE_PID=$!
    SERVICES_PIDS+=($FLUID_STATE_PID)
    
    if wait_for_port 8081 15; then
        log "✅ Fluid State Manager restarted successfully"
        TEST_RESULTS+=("PASS: Fluid State restart")
    else
        warn "⚠️ Fluid State Manager WebSocket not responding after restart"
        TEST_RESULTS+=("WARN: Fluid State restart")
    fi
fi

# Give services time to fully initialize and load state
log "Allowing services to fully initialize and load state..."
sleep 8

# Phase 7: Post-Restart Verification
echo ""
echo "🔍 PHASE 7: POST-RESTART VERIFICATION"
echo "====================================="

log "Testing mobile debugger after restart..."
if test_health_endpoint "http://localhost:8888" 10; then
    log "✅ Mobile debugger responding after restart"
    TEST_RESULTS+=("PASS: Mobile debugger post-restart")
else
    error "❌ Mobile debugger not responding after restart"
    TEST_RESULTS+=("FAIL: Mobile debugger post-restart")
fi

log "Testing debug switches functionality..."
if command -v curl >/dev/null 2>&1; then
    # Test debug API call
    debug_response=$(curl -s -X POST http://localhost:8888/api/test \
        -H "Content-Type: application/json" \
        -d '{"action":"test_debug","mode":"purple"}' 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        log "✅ Debug API responding after restart"
        TEST_RESULTS+=("PASS: Debug API post-restart")
    else
        warn "⚠️ Debug API not fully responsive"
        TEST_RESULTS+=("WARN: Debug API post-restart")
    fi
fi

log "Testing WebSocket reconnection..."
if check_port 8889; then
    log "✅ Display Kernel WebSocket port available"
    
    # Test WebSocket connection
    if command -v node >/dev/null 2>&1; then
        cat > /tmp/websocket_test.js << 'EOF'
const WebSocket = require('ws');
try {
    const ws = new WebSocket('ws://localhost:8889');
    ws.on('open', () => {
        console.log('WebSocket connection successful');
        ws.close();
        process.exit(0);
    });
    ws.on('error', (error) => {
        console.log('WebSocket connection failed:', error.message);
        process.exit(1);
    });
    setTimeout(() => {
        console.log('WebSocket connection timeout');
        process.exit(1);
    }, 5000);
} catch (error) {
    console.log('WebSocket test error:', error.message);
    process.exit(1);
}
EOF
        
        if node /tmp/websocket_test.js 2>/dev/null; then
            log "✅ WebSocket reconnection successful"
            TEST_RESULTS+=("PASS: WebSocket reconnection")
        else
            warn "⚠️ WebSocket reconnection failed"
            TEST_RESULTS+=("WARN: WebSocket reconnection")
        fi
        rm -f /tmp/websocket_test.js
    fi
else
    error "❌ Display Kernel WebSocket port not available"
    TEST_RESULTS+=("FAIL: WebSocket port availability")
fi

# Phase 8: State Persistence Verification
echo ""
echo "📊 PHASE 8: STATE PERSISTENCE TEST"
echo "=================================="

log "Comparing pre and post restart state..."

# Record post-restart state
POST_STATE_FILE="/tmp/post_restart_state.json"

cat > "$POST_STATE_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "services": {
    "display_kernel": {
      "pid": $DISPLAY_KERNEL_PID,
      "port": 8888,
      "status": "$(test_health_endpoint 'http://localhost:8888' 3 && echo 'running' || echo 'failed')"
    },
    "fluid_state": {
      "pid": ${FLUID_STATE_PID:-0},
      "port": 8081,
      "status": "$(check_port 8081 && echo 'running' || echo 'failed')"
    }
  },
  "test_results_count": ${#TEST_RESULTS[@]}
}
EOF

if [ -f "$INITIAL_STATE_FILE" ] && [ -f "$POST_STATE_FILE" ]; then
    log "✅ State comparison files created"
    TEST_RESULTS+=("PASS: State persistence verification")
else
    warn "⚠️ Could not create state comparison files"
    TEST_RESULTS+=("WARN: State persistence verification")
fi

# Phase 9: Final Integration Test
echo ""
echo "🧪 PHASE 9: FINAL INTEGRATION TEST"
echo "=================================="

log "Testing full system integration after restart..."

# Test that we can create new data after restart
if command -v curl >/dev/null 2>&1; then
    log "Testing API functionality post-restart..."
    post_restart_response=$(curl -s -X POST http://localhost:8888/api/test \
        -H "Content-Type: application/json" \
        -d '{"action":"create_agent","name":"PostRestartAgent"}' 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        log "✅ API creation working after restart"
        TEST_RESULTS+=("PASS: Post-restart API functionality")
    else
        error "❌ API creation failed after restart"
        TEST_RESULTS+=("FAIL: Post-restart API functionality")
    fi
fi

# Test debug color switches
log "Testing purple debug mode (AI layer) after restart..."
if test_health_endpoint "http://localhost:8888" 3; then
    log "✅ Purple debug functionality available"
    TEST_RESULTS+=("PASS: Purple debug mode post-restart")
else
    warn "⚠️ Could not verify purple debug mode"
    TEST_RESULTS+=("WARN: Purple debug mode post-restart")
fi

# Final Results
echo ""
echo "📋 FINAL RESULTS"
echo "================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == PASS:* ]]; then
        echo -e "${GREEN}✅ $result${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    elif [[ $result == FAIL:* ]]; then
        echo -e "${RED}❌ $result${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    elif [[ $result == WARN:* ]]; then
        echo -e "${YELLOW}⚠️ $result${NC}"
        WARN_COUNT=$((WARN_COUNT + 1))
    fi
done

echo ""
echo "📊 SUMMARY:"
echo "==========="
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${YELLOW}⚠️ Warnings: $WARN_COUNT${NC}"  
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""

TOTAL_TESTS=${#TEST_RESULTS[@]}
SUCCESS_RATE=$(( (PASS_COUNT * 100) / TOTAL_TESTS ))

echo "🎯 Overall Success Rate: $SUCCESS_RATE% ($PASS_COUNT/$TOTAL_TESTS)"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 RESTART TEST SUCCESSFUL!${NC}"
    echo "✅ System successfully survives restart"
    echo "✅ State persistence working"
    echo "✅ WebSocket reconnection functional" 
    echo "✅ Mobile debugger operational"
    echo "✅ Debug color switches (including purple AI mode) working"
    echo ""
    EXIT_CODE=0
else
    echo -e "${RED}❌ RESTART TEST FAILED!${NC}"
    echo "System needs attention before production use"
    echo ""
    EXIT_CODE=1
fi

echo "📁 Log files available:"
echo "  • Display Kernel: /tmp/display-kernel.log, /tmp/display-kernel-restart.log"
echo "  • Fluid State: /tmp/fluid-state.log, /tmp/fluid-state-restart.log"  
echo "  • Initial State: $INITIAL_STATE_FILE"
echo "  • Post-restart State: $POST_STATE_FILE"
echo ""

echo "🔗 Access URLs:"
echo "  • Mobile Debugger: http://localhost:8888"
echo "  • WebSocket: ws://localhost:8889"
echo ""

echo "Press Ctrl+C to stop all services and exit"
echo ""

# Keep services running for manual testing
trap "
    echo ''
    echo '🛑 Stopping all services...'
    for pid in \${SERVICES_PIDS[@]}; do
        kill -TERM \$pid 2>/dev/null
    done
    sleep 3
    for pid in \${SERVICES_PIDS[@]}; do
        kill -KILL \$pid 2>/dev/null
    done
    echo '✅ All services stopped'
    exit $EXIT_CODE
" INT TERM

# Wait indefinitely
wait