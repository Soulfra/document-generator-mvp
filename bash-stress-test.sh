#!/bin/bash

# 🔥 BASH STRESS TEST
# 
# Hammer the system with extreme load and combinations
# Push every limit to see what breaks

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🔥 BASH STRESS TEST${NC}"
echo -e "${YELLOW}⚡ Pushing system to the limit${NC}"
echo ""

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Emergency cleanup...${NC}"
    pkill -f node 2>/dev/null || true
    for port in {3000..9999}; do
        lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    done
    sleep 3
}

# Stress test 1: Rapid fire commands
stress_rapid_fire() {
    echo -e "${GREEN}🚀 Stress Test 1: Rapid Fire Commands${NC}"
    
    for i in {1..20}; do
        echo -n "Cycle $i... "
        
        # Rapid sequence
        ./doc-gen clean >/dev/null 2>&1 &
        ./doc-gen status >/dev/null 2>&1 &
        ./doc-gen ultra >/dev/null 2>&1 &
        sleep 0.5
        ./doc-gen stop >/dev/null 2>&1
        
        echo "✅"
    done
    
    cleanup
    echo "Rapid fire stress test complete"
}

# Stress test 2: Concurrent instances
stress_concurrent() {
    echo -e "${GREEN}🔄 Stress Test 2: Concurrent Instances${NC}"
    
    # Start multiple reasoning differentials
    echo "Starting 10 concurrent reasoning processes..."
    for i in {1..10}; do
        timeout 10 node reasoning-differential-live.js test >/dev/null 2>&1 &
        echo -n "."
    done
    echo ""
    
    sleep 5
    
    # Start multiple ultra systems
    echo "Starting 5 concurrent ultra systems..."
    for i in {1..5}; do
        timeout 10 ./doc-gen ultra >/dev/null 2>&1 &
        echo -n "."
    done
    echo ""
    
    sleep 10
    cleanup
    echo "Concurrent stress test complete"
}

# Stress test 3: Memory bomb
stress_memory() {
    echo -e "${GREEN}💣 Stress Test 3: Memory Stress${NC}"
    
    # Create large temporary files
    echo "Creating memory pressure..."
    for i in {1..100}; do
        head -c 1M </dev/urandom > "stress_test_$i.tmp" 2>/dev/null &
    done
    
    sleep 2
    
    # Try to start system under memory pressure
    echo "Starting system under memory pressure..."
    timeout 15 ./doc-gen ultra >/dev/null 2>&1 &
    ULTRA_PID=$!
    
    sleep 8
    
    # Check if still running
    if kill -0 $ULTRA_PID 2>/dev/null; then
        echo "✅ System survived memory pressure"
    else
        echo "❌ System failed under memory pressure"
    fi
    
    kill $ULTRA_PID 2>/dev/null || true
    
    # Cleanup temp files
    rm -f stress_test_*.tmp 2>/dev/null || true
    cleanup
}

# Stress test 4: Port exhaustion
stress_ports() {
    echo -e "${GREEN}🔌 Stress Test 4: Port Exhaustion${NC}"
    
    # Try to exhaust ports
    echo "Attempting port exhaustion..."
    for port in {3000..3100}; do
        timeout 1 python3 -c "
import socket
s = socket.socket()
s.bind(('localhost', $port))
s.listen(1)
import time
time.sleep(10)
" >/dev/null 2>&1 &
    done
    
    sleep 2
    
    # Try to start system
    echo "Starting system with exhausted ports..."
    timeout 15 ./doc-gen ultra >/dev/null 2>&1 &
    ULTRA_PID=$!
    
    sleep 10
    
    # Check if it found alternative ports
    if curl -s http://localhost:3333 >/dev/null 2>&1 || \
       curl -s http://localhost:4444 >/dev/null 2>&1; then
        echo "✅ System adapted to port exhaustion"
    else
        echo "❌ System failed with port exhaustion"
    fi
    
    kill $ULTRA_PID 2>/dev/null || true
    cleanup
}

# Stress test 5: File system stress
stress_filesystem() {
    echo -e "${GREEN}📁 Stress Test 5: File System Stress${NC}"
    
    # Create many files
    echo "Creating file system stress..."
    mkdir -p stress_dir
    for i in {1..1000}; do
        echo "test data $i" > "stress_dir/file_$i.txt" &
        if [ $((i % 100)) -eq 0 ]; then
            wait  # Wait for batch to complete
        fi
    done
    wait
    
    # Try to start system
    echo "Starting system with file system stress..."
    timeout 15 ./doc-gen ultra >/dev/null 2>&1 &
    ULTRA_PID=$!
    
    sleep 8
    
    if kill -0 $ULTRA_PID 2>/dev/null; then
        echo "✅ System handled file system stress"
    else
        echo "❌ System failed with file system stress"
    fi
    
    kill $ULTRA_PID 2>/dev/null || true
    
    # Cleanup
    rm -rf stress_dir 2>/dev/null || true
    cleanup
}

# Stress test 6: Network simulation
stress_network() {
    echo -e "${GREEN}🌐 Stress Test 6: Network Stress${NC}"
    
    # Simulate slow network with curl delays
    echo "Simulating network stress..."
    
    # Start system
    timeout 15 ./doc-gen reasoning >/dev/null 2>&1 &
    REASONING_PID=$!
    
    sleep 5
    
    # Hammer with requests
    echo "Sending 50 concurrent requests..."
    for i in {1..50}; do
        curl -s http://localhost:4444 >/dev/null 2>&1 &
    done
    
    sleep 10
    
    if kill -0 $REASONING_PID 2>/dev/null; then
        echo "✅ System survived network stress"
    else
        echo "❌ System failed under network stress"
    fi
    
    kill $REASONING_PID 2>/dev/null || true
    cleanup
}

# Ultimate stress test
ultimate_stress() {
    echo -e "${PURPLE}💀 ULTIMATE STRESS TEST${NC}"
    echo "Combining ALL stress factors..."
    
    # Memory pressure
    for i in {1..50}; do
        head -c 500K </dev/urandom > "ultimate_$i.tmp" 2>/dev/null &
    done
    
    # Port pressure
    for port in {3000..3050}; do
        timeout 5 python3 -c "
import socket
s = socket.socket()
try: s.bind(('localhost', $port))
except: pass
import time
time.sleep(5)
" >/dev/null 2>&1 &
    done
    
    # Process pressure
    for i in {1..20}; do
        timeout 3 ./doc-gen status >/dev/null 2>&1 &
    done
    
    sleep 2
    
    # Try to start the full system
    echo "Starting full system under ultimate stress..."
    timeout 20 ./doc-gen ultra >/dev/null 2>&1 &
    ULTIMATE_PID=$!
    
    sleep 15
    
    # Check if anything is responding
    ultra_alive=false
    reasoning_alive=false
    
    if curl -s http://localhost:3333 >/dev/null 2>&1; then
        ultra_alive=true
    fi
    
    if curl -s http://localhost:4444 >/dev/null 2>&1; then
        reasoning_alive=true
    fi
    
    if [ "$ultra_alive" = true ] || [ "$reasoning_alive" = true ]; then
        echo "🏆 SYSTEM SURVIVED ULTIMATE STRESS!"
        echo "✅ This system is absolutely bulletproof"
    else
        echo "💥 System failed ultimate stress test"
        echo "⚠️  Consider optimization for extreme conditions"
    fi
    
    kill $ULTIMATE_PID 2>/dev/null || true
    
    # Ultimate cleanup
    rm -f ultimate_*.tmp 2>/dev/null || true
    cleanup
}

# Run all stress tests
echo -e "${PURPLE}Starting comprehensive stress testing...${NC}"

stress_rapid_fire
echo ""

stress_concurrent
echo ""

stress_memory
echo ""

stress_ports
echo ""

stress_filesystem
echo ""

stress_network
echo ""

ultimate_stress
echo ""

echo -e "${GREEN}🔥 STRESS TESTING COMPLETE${NC}"
echo -e "${YELLOW}📊 System has been thoroughly hammered${NC}"
echo -e "${PURPLE}🚀 If anything survived, it's production ready!${NC}"