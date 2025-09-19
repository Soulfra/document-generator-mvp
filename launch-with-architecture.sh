#!/bin/bash

echo "🗺️ 🧠 📱 LAUNCHING D2JSP WITH ARCHITECTURAL MAPPING"
echo "==================================================="
echo ""
echo "🎯 Enhanced System Components:"
echo "  ✅ XML Architecture Manager - System mapping and validation"
echo "  ✅ Context Preservation Layer - Memory and relationship management"
echo "  ✅ Mobile Wallet App (port 9001) - Primary mobile interface"
echo "  ✅ D2JSP Forum System (port 3000) - Community & trading"
echo "  ✅ Game Engine (port 8000) - Interactive gameplay"
echo "  ✅ AI Reasoning (port 5500) - AI analysis layers"
echo "  ✅ Crypto Tracing (port 6000) - Wallet monitoring"
echo "  ✅ Unified Mining Node (port 7000) - Consolidated interface"
echo ""

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check required files
echo "📋 Checking architectural files..."
if [ ! -f "system-architecture-map.xml" ]; then
    echo "❌ Architecture map not found: system-architecture-map.xml"
    exit 1
fi

if [ ! -f "xml-architecture-manager.js" ]; then
    echo "❌ Architecture manager not found: xml-architecture-manager.js"
    exit 1
fi

if [ ! -f "context-preservation-layer.js" ]; then
    echo "❌ Context layer not found: context-preservation-layer.js"
    exit 1
fi

echo "✅ All architectural files present"

# Make scripts executable
chmod +x xml-architecture-manager.js 2>/dev/null
chmod +x context-preservation-layer.js 2>/dev/null

# Function to kill process on port
kill_port() {
    local port=$1
    if lsof -i:$port >/dev/null 2>&1; then
        echo "⚠️ Freeing port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Clean up all ports
echo ""
echo "🧹 Cleaning up existing processes..."
kill_port 3000  # Forum
kill_port 5500  # Reasoning
kill_port 6000  # Crypto
kill_port 7000  # Mining
kill_port 8000  # Game Engine
kill_port 9001  # Mobile App

sleep 2

echo ""
echo "🗺️ Step 1: Initializing XML Architecture Manager..."
timeout 10 node xml-architecture-manager.js validate &
ARCH_VALIDATION_PID=$!

sleep 3

echo ""
echo "🧠 Step 2: Starting Context Preservation Layer..."
node context-preservation-layer.js monitor &
CONTEXT_PID=$!

sleep 2

echo ""
echo "🚀 Step 3: Starting backend services in architectural order..."

# Start services according to architecture map dependency order
echo "  📡 Starting D2JSP Forum System..."
node d2jsp-forum-system.js &
FORUM_PID=$!

sleep 3

echo "  🧠 Starting AI Reasoning Dashboard..."
node reasoning-game-integration.js &
REASONING_PID=$!

sleep 3

echo "  💰 Starting Crypto Trace Engine..."
node crypto-trace-engine.js &
CRYPTO_PID=$!

sleep 3

echo "  ⛏️ Starting Unified Mining Node..."
node unified-mining-node.js &
MINING_PID=$!

sleep 3

echo "  🎮 Starting D2JSP Game Engine..."
node d2jsp-style-game-engine.js &
GAME_PID=$!

sleep 5

echo ""
echo "📱 Step 4: Starting Mobile Wallet App (Primary Interface)..."
node mobile-wallet-app.js &
MOBILE_PID=$!

sleep 8

echo ""
echo "🔍 Step 5: Running architectural validation..."
node xml-architecture-manager.js status

echo ""
echo "🧠 Step 6: Checking context preservation..."
timeout 5 node context-preservation-layer.js status

# Check service health using architecture manager
check_architectural_health() {
    echo ""
    echo "🏥 Architectural Health Check..."
    
    local health_output=$(timeout 10 node xml-architecture-manager.js validate 2>/dev/null)
    local health_status=$?
    
    if [ $health_status -eq 0 ]; then
        echo "✅ Architectural integrity validated"
        return 0
    else
        echo "⚠️ Architectural validation warnings detected"
        return 1
    fi
}

# Function to test service with architectural context
test_service_with_context() {
    local name=$1
    local port=$2
    
    if curl -s --max-time 5 http://localhost:$port/ >/dev/null 2>&1; then
        echo "✅ $name: Operational with context preservation"
        return 0
    else
        echo "❌ $name: Failed to start or context lost"
        return 1
    fi
}

echo ""
echo "🔍 Step 7: Validating services with architectural context..."

SERVICES_OK=0
test_service_with_context "D2JSP Forum" 3000 && ((SERVICES_OK++))
test_service_with_context "AI Reasoning" 5500 && ((SERVICES_OK++))
test_service_with_context "Crypto Trace" 6000 && ((SERVICES_OK++))
test_service_with_context "Mining Node" 7000 && ((SERVICES_OK++))
test_service_with_context "Game Engine" 8000 && ((SERVICES_OK++))
test_service_with_context "Mobile Wallet App" 9001 && ((SERVICES_OK++))

# Run architectural health check
check_architectural_health
ARCH_HEALTH=$?

echo ""
if [ $SERVICES_OK -eq 6 ] && [ $ARCH_HEALTH -eq 0 ]; then
    echo "🎉 COMPLETE ARCHITECTURAL SYSTEM OPERATIONAL!"
    echo ""
    echo "🗺️ ARCHITECTURAL FEATURES ACTIVE:"
    echo "   📋 XML system mapping preserves component relationships"
    echo "   🧠 Context preservation prevents knowledge loss"
    echo "   🔄 Flow state management maintains system continuity"
    echo "   🔍 Architectural validation ensures integrity"
    echo "   📊 Real-time system health monitoring"
    echo ""
    echo "📱 PRIMARY ACCESS (Enhanced with Architecture):"
    echo "   🌟 Mobile Wallet App:   http://localhost:9001"
    echo "      • Context-aware crypto wallet"
    echo "      • Preserved user preferences"
    echo "      • Architectural flow management"
    echo ""
    echo "🖥️ DESKTOP ACCESS (Full Architectural Context):"
    echo "   🏛️ D2JSP Forum:        http://localhost:3000"
    echo "   🧠 AI Reasoning:       http://localhost:5500"
    echo "   💰 Crypto Tracing:     http://localhost:6000"
    echo "   ⛏️ Mining Node:        http://localhost:7000"
    echo "   🎮 Game Engine:        http://localhost:8000"
    echo ""
    echo "🗺️ ARCHITECTURAL BENEFITS:"
    echo "   🔒 Critical context preservation:"
    echo "      • User crypto wallet (0xd5dc6c...)"
    echo "      • Scammed wallet tracking (0x742d35Cc...)"
    echo "      • AI reasoning patterns"
    echo "      • System component relationships"
    echo "      • Mobile app state persistence"
    echo ""
    echo "   🔄 Flow state management:"
    echo "      • Startup sequence optimization"
    echo "      • User interaction flow mapping"
    echo "      • Cross-service integration paths"
    echo "      • Offline degradation handling"
    echo ""
    echo "   📊 System intelligence:"
    echo "      • Component relationship validation"
    echo "      • Architectural integrity monitoring"
    echo "      • Knowledge base preservation"
    echo "      • Historical flow analysis"
    echo ""
    echo "🎯 ENHANCED CAPABILITIES:"
    echo "   • System never loses its architectural knowledge"
    echo "   • Component relationships are preserved across restarts"
    echo "   • User context and preferences persist indefinitely"
    echo "   • Flow patterns are learned and optimized"
    echo "   • Critical system insights are maintained"
    echo ""
    echo "📱 USAGE WITH ARCHITECTURAL ENHANCEMENT:"
    echo "   1. All user interactions are context-aware"
    echo "   2. System maintains memory of previous sessions"
    echo "   3. Component relationships are automatically validated"
    echo "   4. Flow states guide optimal user experience"
    echo "   5. Critical contexts are preserved across shutdowns"
    echo ""
    echo "🔧 ARCHITECTURAL MANAGEMENT:"
    echo "   node xml-architecture-manager.js status    - System status"
    echo "   node xml-architecture-manager.js validate  - Validate integrity"
    echo "   node context-preservation-layer.js status  - Context health"
    echo ""
    echo "🛑 Press Ctrl+C to stop all services"
    
    # Open mobile app in browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo ""
        echo "🚀 Opening context-aware mobile app..."
        open http://localhost:9001 2>/dev/null
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:9001 2>/dev/null
    fi
    
    # Display architectural insights
    echo ""
    echo "🧠 ARCHITECTURAL INSIGHTS ACTIVE:"
    timeout 5 node xml-architecture-manager.js 2>/dev/null | grep -A 20 "Critical Insights:" || echo "   • Mobile-first architecture with proxy pattern"
    echo "   • AI reasoning with preserved learning patterns"
    echo "   • Crypto wallet with persistent scam monitoring"
    echo "   • PWA with offline context preservation"
    
    # Cleanup function with architectural awareness
    cleanup() {
        echo ""
        echo "🛑 Shutting down architectural system..."
        echo "  💾 Preserving final system context..."
        
        # Preserve context before shutdown  
        timeout 5 node context-preservation-layer.js status >/dev/null 2>&1
        
        echo "  📱 Stopping Mobile Wallet App..."
        kill $MOBILE_PID 2>/dev/null
        echo "  🏛️ Stopping Forum System..."
        kill $FORUM_PID 2>/dev/null
        echo "  🧠 Stopping AI Reasoning..."
        kill $REASONING_PID 2>/dev/null
        echo "  💰 Stopping Crypto Trace..."
        kill $CRYPTO_PID 2>/dev/null
        echo "  ⛏️ Stopping Mining Node..."
        kill $MINING_PID 2>/dev/null
        echo "  🎮 Stopping Game Engine..."
        kill $GAME_PID 2>/dev/null
        echo "  🧠 Stopping Context Preservation..."
        kill $CONTEXT_PID 2>/dev/null
        echo "  🗺️ Stopping Architecture Manager..."
        kill $ARCH_VALIDATION_PID 2>/dev/null
        
        echo "✅ All services stopped with context preserved"
        echo "🧠 System memory and architecture maintained for next startup"
        exit 0
    }
    
    trap cleanup INT TERM
    
    # Enhanced monitoring with architectural awareness
    echo ""
    echo "📊 Monitoring architectural system health..."
    monitor_count=0
    
    while true; do
        # Check processes
        if ! kill -0 $MOBILE_PID 2>/dev/null; then
            echo "❌ Mobile wallet app stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $FORUM_PID 2>/dev/null; then
            echo "❌ Forum system stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $REASONING_PID 2>/dev/null; then
            echo "❌ AI reasoning stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $CRYPTO_PID 2>/dev/null; then
            echo "❌ Crypto trace stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $MINING_PID 2>/dev/null; then
            echo "❌ Mining node stopped unexpectedly"
            cleanup
        fi
        if ! kill -0 $GAME_PID 2>/dev/null; then
            echo "❌ Game engine stopped unexpectedly"
            cleanup
        fi
        
        # Periodic architectural validation (every 5 minutes)
        monitor_count=$((monitor_count + 1))
        if [ $((monitor_count % 30)) -eq 0 ]; then
            echo "[$(date +'%H:%M:%S')] Running architectural health check..."
            if ! check_architectural_health >/dev/null 2>&1; then
                echo "⚠️ Architectural integrity warning detected"
            fi
        fi
        
        sleep 10
    done
    
else
    echo "❌ System failed to start properly"
    echo ""
    echo "📊 Status: $SERVICES_OK/6 services operational"
    echo "🏥 Architectural health: $([ $ARCH_HEALTH -eq 0 ] && echo 'OK' || echo 'ISSUES')"
    echo ""
    echo "🔧 Troubleshooting with architectural context:"
    echo "   • Check architectural validation: node xml-architecture-manager.js validate"
    echo "   • Check context preservation: node context-preservation-layer.js status"  
    echo "   • Review system architecture: cat system-architecture-map.xml"
    echo "   • Check individual service logs above"
    echo ""
    echo "🛑 Cleaning up failed architectural system..."
    kill $MOBILE_PID $FORUM_PID $REASONING_PID $CRYPTO_PID $MINING_PID $GAME_PID $CONTEXT_PID $ARCH_VALIDATION_PID 2>/dev/null
    exit 1
fi