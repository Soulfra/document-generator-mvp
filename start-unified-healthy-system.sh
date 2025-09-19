#!/bin/bash

# 🎮🛡️ UNIFIED HEALTHY ENGAGEMENT SYSTEM
# Game-like rotation between building and anti-addiction safeguards
# Like Snake/Pong/Line Rider - simple mechanics, healthy cycles

echo "🎮🛡️ STARTING UNIFIED HEALTHY ENGAGEMENT SYSTEM"
echo "=============================================="

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "healthy-engagement-game" 2>/dev/null || true
pkill -f "therapeutic-coaching-system" 2>/dev/null || true
pkill -f "therapeutic-praise-system" 2>/dev/null || true
pkill -f "praise-xml-excel-mapper" 2>/dev/null || true
pkill -f "intelligence-brain-layer" 2>/dev/null || true

sleep 2

# Start the unified system
echo ""
echo "🧠 Starting Intelligence Brain Layer..."
node intelligence-brain-layer.js &
BRAIN_PID=$!
sleep 2

echo "🎮 Starting Healthy Engagement Game (core mechanics)..."
node healthy-engagement-game.js &
GAME_PID=$!
sleep 2

echo "💚 Starting Therapeutic Coaching System..."
node therapeutic-coaching-system.js &
COACHING_PID=$!
sleep 2

echo "🙏 Starting Therapeutic Praise System..."
node therapeutic-praise-system.js &
PRAISE_PID=$!
sleep 2

echo "📊 Starting Cal's Configuration Interface..."
node praise-xml-excel-mapper.js &
EXCEL_PID=$!
sleep 3

# Test the unified system
echo ""
echo "🧪 Testing Unified System Integration..."
echo "======================================="

# Test core game mechanics
echo "Testing healthy engagement game..."
GAME_RESPONSE=$(curl -s -X POST http://localhost:9000/api/game/start \
    -H "Content-Type: application/json" \
    -d '{"userId":"test_user","goal":"Build a working user authentication system"}' 2>/dev/null || echo '{"error":"Game not ready"}')

if echo "$GAME_RESPONSE" | grep -q "gameStarted"; then
    echo "✅ Healthy engagement game: ACTIVE"
    echo "   Core mechanics: Building → Reflection → Break → Validation"
else
    echo "❌ Healthy engagement game: OFFLINE"
fi

# Test therapeutic coaching
echo ""
echo "Testing therapeutic coaching integration..."
COACHING_RESPONSE=$(curl -s -X POST http://localhost:8088/api/coaching/start \
    -H "Content-Type: application/json" \
    -d '{"userId":"test_user","goal":"Debug the payment processing error in my e-commerce app"}' 2>/dev/null || echo '{"error":"Coaching not ready"}')

if echo "$COACHING_RESPONSE" | grep -q "sessionId"; then
    echo "✅ Therapeutic coaching: ACTIVE"
    echo "   Focus: Real problem-solving and debugging support"
else
    echo "❌ Therapeutic coaching: OFFLINE"
fi

# Test therapeutic praise
echo ""
echo "Testing evidence-based praise system..."
PRAISE_RESPONSE=$(curl -s -X POST http://localhost:8090/api/therapy/start \
    -H "Content-Type: application/json" \
    -d '{"userId":"test_user","goal":"Complete the shopping cart feature with working checkout"}' 2>/dev/null || echo '{"error":"Praise system not ready"}')

if echo "$PRAISE_RESPONSE" | grep -q "sessionStarted"; then
    echo "✅ Evidence-based praise: ACTIVE"
    echo "   Requirement: Real progress evidence for all encouragement"
else
    echo "❌ Evidence-based praise: OFFLINE"
fi

# Show the unified architecture
echo ""
echo "🏗️  UNIFIED HEALTHY ENGAGEMENT ARCHITECTURE"
echo "=========================================="
echo ""
echo "🎮 GAME-LIKE CORE MECHANICS (Like Snake/Pong/Line Rider):"
echo "   1. BUILDING (15-25min) → Like Snake moving forward"
echo "      • Must show real progress"
echo "      • Focus on actual building"
echo "      • Evidence required"
echo ""
echo "   2. REFLECTION (3-5min) → Like Pong ball bouncing"
echo "      • What did you build?"
echo "      • What did you learn?"
echo "      • What's next?"
echo ""
echo "   3. BREAK (15-30min) → Like Line Rider reset"
echo "      • Away from screen"
echo "      • Physical activity"
echo "      • Mental refresh"
echo ""
echo "   4. GUIDANCE (5-10min) → Like getting power-ups"
echo "      • Collaborative debugging"
echo "      • Problem-solving support"
echo "      • Systematic help"
echo ""
echo "   5. VALIDATION (2-5min) → Like scoring points"
echo "      • Show working evidence"
echo "      • Celebrate real achievement"
echo "      • Earn next building cycle"
echo ""
echo "🛡️ ANTI-ADDICTION SAFEGUARDS (Built into game rotation):"
echo "   • Automatic state transitions prevent endless loops"
echo "   • Evidence required for all rewards"
echo "   • Forced breaks after addiction patterns detected"
echo "   • Health score tracking with penalties for unhealthy behavior"
echo "   • Maximum session times with automatic game-over"
echo ""
echo "💚 THERAPEUTIC INTEGRATION:"
echo "   • Coaching supports real problem-solving"
echo "   • Praise requires demonstrable progress"
echo "   • Brain layer provides systematic reasoning"
echo "   • All engagement tied to building actual things"
echo ""
echo "🌐 ACCESS POINTS:"
echo "   • Healthy Engagement Game: http://localhost:9000"
echo "   • Therapeutic Coaching: http://localhost:8088"
echo "   • Evidence-Based Praise: http://localhost:8090"
echo "   • Cal's Configuration: http://localhost:7892"
echo "   • Brain Layer: http://localhost:6789"
echo ""
echo "🎯 SYSTEM STATUS:"
echo "   • Brain PID: $BRAIN_PID"
echo "   • Game Core PID: $GAME_PID"
echo "   • Coaching PID: $COACHING_PID"
echo "   • Praise PID: $PRAISE_PID"
echo "   • Cal's Config PID: $EXCEL_PID"
echo ""
echo "🎮🛡️ UNIFIED HEALTHY SYSTEM ACTIVE!"
echo ""
echo "🔄 HOW IT WORKS (Like Classic Games):"
echo "   • Simple rotation mechanics prevent addiction"
echo "   • Each state has clear rules and time limits"
echo "   • Progress only happens through real building"
echo "   • Automatic safeguards trigger when needed"
echo "   • Game-over forces healthy reset when required"
echo ""
echo "✨ KEY BENEFITS:"
echo "   • Builds real things instead of seeking empty rewards"
echo "   • Prevents addiction through automatic rotation"
echo "   • Provides therapeutic support for actual problems"
echo "   • Maintains healthy engagement through game mechanics"
echo "   • Cal can configure therapeutic responses via spreadsheet"
echo ""
echo "Try starting a game at http://localhost:9000 with a specific building goal!"
echo "The system will guide you through healthy building cycles automatically! 🎮💚"