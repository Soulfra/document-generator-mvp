#!/bin/bash

# 🧠💚 START THERAPEUTIC COACHING SYSTEM
# Anti-addiction design focused on real progress and actual building

echo "🧠💚 STARTING THERAPEUTIC COACHING SYSTEM"
echo "========================================"

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "therapeutic-coaching-system" 2>/dev/null || true
pkill -f "therapeutic-praise-system" 2>/dev/null || true
pkill -f "praise-xml-excel-mapper" 2>/dev/null || true
pkill -f "intelligence-brain-layer" 2>/dev/null || true

sleep 2

# Start therapeutic services
echo ""
echo "🧠 Starting Intelligence Brain Layer (therapeutic mode)..."
node intelligence-brain-layer.js &
BRAIN_PID=$!
sleep 2

echo "💚 Starting Therapeutic Coaching System..."
node therapeutic-coaching-system.js &
COACHING_PID=$!
sleep 2

echo "🙏 Starting Therapeutic Praise System..."
node therapeutic-praise-system.js &
PRAISE_PID=$!
sleep 2

echo "📊 Starting Cal's Excel Interface (therapeutic mode)..."
node praise-xml-excel-mapper.js &
EXCEL_PID=$!
sleep 3

# Test the therapeutic system
echo ""
echo "🧪 Testing Therapeutic System..."
echo "================================="

# Test coaching system
echo "Testing therapeutic coaching..."
COACHING_RESPONSE=$(curl -s -X POST http://localhost:8088/api/coaching/start \
    -H "Content-Type: application/json" \
    -d '{"userId":"test_user","goal":"Build a working login system that validates user emails and passwords"}' 2>/dev/null || echo '{"error":"Coaching not ready"}')

if echo "$COACHING_RESPONSE" | grep -q "sessionId"; then
    echo "✅ Therapeutic coaching: ACTIVE"
    echo "   Focus: Real progress and problem-solving"
else
    echo "❌ Therapeutic coaching: OFFLINE"
fi

# Test praise system (with evidence requirement)
echo ""
echo "Testing therapeutic praise system..."
PRAISE_RESPONSE=$(curl -s -X POST http://localhost:8090/api/therapy/start \
    -H "Content-Type: application/json" \
    -d '{"userId":"test_user","goal":"Create a React component that handles form validation"}' 2>/dev/null || echo '{"error":"Praise system not ready"}')

if echo "$PRAISE_RESPONSE" | grep -q "sessionStarted"; then
    echo "✅ Therapeutic praise: ACTIVE"
    echo "   Anti-addiction: Evidence required for all praise"
else
    echo "❌ Therapeutic praise: OFFLINE"
fi

# Test Cal's interface
echo ""
echo "Testing Cal's therapeutic Excel interface..."
EXCEL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7892/ 2>/dev/null || echo "000")

if [ "$EXCEL_RESPONSE" = "200" ]; then
    echo "✅ Cal's Excel interface: ACTIVE"
    echo "   Cal can configure therapeutic responses"
else
    echo "❌ Cal's Excel interface: OFFLINE"
fi

# Show the therapeutic architecture
echo ""
echo "🏗️  THERAPEUTIC SYSTEM ARCHITECTURE"
echo "=================================="
echo ""
echo "🚫 ANTI-ADDICTION DESIGN:"
echo "   • No empty rewards or dopamine manipulation"
echo "   • All praise requires evidence of real progress"
echo "   • Healthy time limits and break reminders"
echo "   • Focus on single goals, not endless engagement"
echo "   • Problem-solving support, not validation seeking"
echo ""
echo "🧠 THERAPEUTIC LAYERS:"
echo "   • Coaching System (8088): Live therapy support"
echo "   • Therapeutic Praise (8090): Evidence-based encouragement"
echo "   • Intelligence Brain: Librarian, Storyteller, Reasoning Engine"
echo "   • Cal's Configuration (7892): Therapeutic response patterns"
echo ""
echo "📥 HEALTHY INPUT CHANNELS:"
echo "   • Specific goals: 'I want to build X that does Y'"
echo "   • Real progress: 'I built this working feature'"
echo "   • Actual problems: 'I'm stuck on this specific error'"
echo "   • Evidence required: Code, screenshots, functional demos"
echo ""
echo "📤 THERAPEUTIC OUTPUTS:"
echo "   • Problem-solving guidance"
echo "   • Real progress acknowledgment"
echo "   • Break and health reminders"
echo "   • Collaborative debugging support"
echo ""
echo "🌐 ACCESS POINTS:"
echo "   • Therapeutic Coaching: http://localhost:8088"
echo "   • Evidence-Based Praise: http://localhost:8090"
echo "   • Cal's Therapeutic Config: http://localhost:7892"
echo "   • Brain Layer: http://localhost:6789"
echo ""
echo "🎯 SYSTEM STATUS:"
echo "   • Brain PID: $BRAIN_PID"
echo "   • Coaching PID: $COACHING_PID"
echo "   • Therapeutic Praise PID: $PRAISE_PID"
echo "   • Cal's Excel PID: $EXCEL_PID"
echo ""
echo "🧠💚 THERAPEUTIC SYSTEM ACTIVE!"
echo ""
echo "🚫 ANTI-ADDICTION FEATURES:"
echo "   • Real progress required for all feedback"
echo "   • Healthy session time limits (90 minutes max)"
echo "   • Break reminders every 25 minutes"
echo "   • No infinite reward loops"
echo "   • Focus on building actual working things"
echo ""
echo "Try these therapeutic interactions:"
echo "   • Visit http://localhost:8088 with a specific building goal"
echo "   • Visit http://localhost:8090 but bring evidence of real work"
echo "   • Cal can configure therapeutic response patterns at http://localhost:7892"
echo ""
echo "This system helps people build real things, not get addicted to fake rewards! 🛡️✨"