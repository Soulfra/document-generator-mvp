#!/bin/bash

echo "🚀 UNIFIED INTEGRATION LAUNCHER"
echo "=============================="
echo "Testing full end-to-end integration of all systems"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Kill any existing processes on our ports
echo -e "${YELLOW}🔧 Cleaning up existing processes...${NC}"
for port in 3000 3333 4444 5555 7777 8080 8081 8082 8095; do
    if check_port $port; then
        echo "  Killing process on port $port"
        lsof -ti :$port | xargs kill -9 2>/dev/null
    fi
done

sleep 2

# Start PostgreSQL if not running
echo -e "${BLUE}🐘 Checking PostgreSQL...${NC}"
if ! pg_isready >/dev/null 2>&1; then
    echo "  Starting PostgreSQL..."
    pg_ctl -D /usr/local/var/postgres start >/dev/null 2>&1 || true
fi

# Initialize database
echo -e "${BLUE}💾 Initializing databases...${NC}"
node << 'EOF'
const { Client } = require('pg');

async function initDB() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: process.env.USER,
        database: 'postgres'
    });
    
    try {
        await client.connect();
        
        // Create database if not exists
        await client.query(`
            SELECT 'CREATE DATABASE unified_platform'
            WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'unified_platform')
        `);
        
        console.log('  ✅ Database ready');
    } catch (error) {
        console.log('  ⚠️  Database error (non-critical):', error.message);
    } finally {
        await client.end();
    }
}

initDB();
EOF

echo ""
echo -e "${GREEN}🎮 Starting core systems in order...${NC}"
echo ""

# 1. Start Event Orchestrator (foundation)
echo -e "${BLUE}1️⃣  Starting Event Orchestrator...${NC}"
node unified-event-spawn-orchestrator.js > logs/orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
sleep 2

# 2. Start Port Manager
echo -e "${BLUE}2️⃣  Starting Port Manager...${NC}"
node empire-port-manager.js > logs/port-manager.log 2>&1 &
PORT_MANAGER_PID=$!
sleep 2

# 3. Start Flag Mode Hooks
echo -e "${BLUE}3️⃣  Starting Flag Mode Hooks...${NC}"
node flag-mode-hooks.js > logs/hooks.log 2>&1 &
HOOKS_PID=$!
sleep 2

# 4. Start Hexagonal Platform (2.5D)
echo -e "${BLUE}4️⃣  Starting Hexagonal Platform (2.5D)...${NC}"
node hexagonal-isometric-platform.js > logs/hex-platform.log 2>&1 &
HEX_PID=$!
sleep 2

# 5. Start 3D Humanoid System
echo -e "${BLUE}5️⃣  Starting 3D Humanoid System...${NC}"
node unified-3d-humanoid-system.js > logs/humanoid-system.log 2>&1 &
HUMANOID_PID=$!
sleep 2

# 6. Start UPC Scanner
echo -e "${BLUE}6️⃣  Starting UPC Scanner Animation System...${NC}"
node upc-scanner-animation-system.js > logs/upc-scanner.log 2>&1 &
SCANNER_PID=$!
sleep 2

# 7. Start Unified Render Manager (master controller)
echo -e "${BLUE}7️⃣  Starting Unified Render Manager...${NC}"
node unified-render-manager.js > logs/render-manager.log 2>&1 &
RENDER_PID=$!
sleep 3

# 8. Start Integration Test Server
echo -e "${BLUE}8️⃣  Starting Integration Test Server...${NC}"
node integration-test-server.js > logs/integration-test.log 2>&1 &
TEST_PID=$!
sleep 2

echo ""
echo -e "${GREEN}✅ All systems started!${NC}"
echo ""
echo -e "${YELLOW}📊 System Status:${NC}"
echo "  • Event Orchestrator: PID $ORCHESTRATOR_PID"
echo "  • Port Manager: PID $PORT_MANAGER_PID"
echo "  • Flag Hooks: PID $HOOKS_PID"
echo "  • Hex Platform: PID $HEX_PID (http://localhost:8095)"
echo "  • 3D Humanoids: PID $HUMANOID_PID"
echo "  • UPC Scanner: PID $SCANNER_PID"
echo "  • Render Manager: PID $RENDER_PID"
echo "  • Integration Test: PID $TEST_PID (http://localhost:8080)"
echo ""

# Save PIDs for cleanup
echo $ORCHESTRATOR_PID > .orchestrator_pid
echo $PORT_MANAGER_PID > .port_manager_pid
echo $HOOKS_PID > .hooks_pid
echo $HEX_PID > .hex_pid
echo $HUMANOID_PID > .humanoid_pid
echo $SCANNER_PID > .scanner_pid
echo $RENDER_PID > .render_pid
echo $TEST_PID > .test_pid

echo -e "${YELLOW}🧪 Running integration tests...${NC}"
echo ""

# Wait for everything to be ready
sleep 5

# Run integration tests
node << 'EOF'
const http = require('http');

async function runTests() {
    console.log('🧪 TEST 1: Boss Death → Auto Spawns');
    
    // Trigger boss death event
    const bossDeathData = JSON.stringify({
        event: 'entity_death',
        data: {
            entityType: 'boss',
            entityId: 'test-boss-001',
            position: { x: 10, y: 0, z: 10 }
        }
    });
    
    const req = http.request({
        hostname: 'localhost',
        port: 8080,
        path: '/api/trigger-event',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': bossDeathData.length
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const result = JSON.parse(data);
            console.log('  ✅ Boss death triggered:', result.spawned.length, 'entities spawned');
        });
    });
    
    req.write(bossDeathData);
    req.end();
    
    // Wait then test render switching
    setTimeout(() => {
        console.log('\n🧪 TEST 2: Render Mode Switching');
        
        const renderTest = JSON.stringify({
            test: 'render_modes'
        });
        
        const req2 = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api/test-render-modes',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': renderTest.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                console.log('  ✅ Render modes tested:', result.modes);
            });
        });
        
        req2.write(renderTest);
        req2.end();
    }, 2000);
    
    // Test UPC scanning
    setTimeout(() => {
        console.log('\n🧪 TEST 3: UPC Scanner Integration');
        
        const upcTest = JSON.stringify({
            upc: '123456789012'
        });
        
        const req3 = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api/test-upc-scan',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': upcTest.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                console.log('  ✅ UPC scanned:', result.product);
            });
        });
        
        req3.write(upcTest);
        req3.end();
    }, 4000);
}

runTests();
EOF

echo ""
echo -e "${GREEN}🎮 UNIFIED PLATFORM READY!${NC}"
echo ""
echo "Access points:"
echo "  • Integration Dashboard: http://localhost:8080"
echo "  • Hexagonal Platform: http://localhost:8095"
echo "  • WebSocket Events: ws://localhost:8081"
echo ""
echo "Logs available in ./logs/"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Create logs directory if it doesn't exist
mkdir -p logs

# Trap to cleanup on exit
trap 'echo -e "\n${RED}Shutting down...${NC}"; kill $ORCHESTRATOR_PID $PORT_MANAGER_PID $HOOKS_PID $HEX_PID $HUMANOID_PID $SCANNER_PID $RENDER_PID $TEST_PID 2>/dev/null; exit' INT TERM

# Keep script running and show logs
tail -f logs/*.log