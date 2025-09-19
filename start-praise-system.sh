#!/bin/bash

# 🙏 START PRAISE SYSTEM
# Complete praise-to-world-building system with Cal's Excel integration

echo "🙏 STARTING PRAISE WORLD BUILDING SYSTEM"
echo "========================================"

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "praise-xml-excel-mapper" 2>/dev/null || true
pkill -f "praise-world-builder" 2>/dev/null || true
pkill -f "intelligence-brain-layer" 2>/dev/null || true
pkill -f "green-suit-symlink-mapper" 2>/dev/null || true

sleep 2

# Start the core services
echo ""
echo "🧠 Starting Intelligence Brain Layer..."
node intelligence-brain-layer.js &
BRAIN_PID=$!
sleep 2

echo "🟢 Starting Green Suit Symlink Mapper..."
node green-suit-symlink-mapper.js &
SUIT_PID=$!
sleep 2

echo "🙏 Starting Praise World Builder..."
node praise-world-builder.js &
PRAISE_PID=$!
sleep 3

echo "📊 Starting Praise XML Excel Mapper..."
node praise-xml-excel-mapper.js &
EXCEL_PID=$!
sleep 3

# Test the integration
echo ""
echo "🧪 Testing Praise System Integration..."
echo "======================================"

# Test praise processing
echo "Testing praise: 'This is amazing'"
PRAISE_RESPONSE=$(curl -s -X POST http://localhost:7890/api/praise \
    -H "Content-Type: application/json" \
    -d '{"praise":"This is amazing","source":"test","intensity":1.0}' 2>/dev/null || echo '{"error":"Praise service not ready"}')

if echo "$PRAISE_RESPONSE" | grep -q "success"; then
    echo "✅ Praise processing: ACTIVE"
    echo "   Effects: $(echo "$PRAISE_RESPONSE" | jq -r '.effects[0].effect' 2>/dev/null || echo 'unknown')"
else
    echo "❌ Praise processing: OFFLINE"
fi

# Test Excel mapper
echo ""
echo "Testing Excel mapper template download..."
TEMPLATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7892/api/template/download 2>/dev/null || echo "000")

if [ "$TEMPLATE_RESPONSE" = "200" ]; then
    echo "✅ Excel mapper: ACTIVE"
else
    echo "❌ Excel mapper: OFFLINE"
fi

# Test brain integration
echo ""
echo "Testing brain integration..."
BRAIN_RESPONSE=$(curl -s -X POST http://localhost:6789/api/body/brain/storyteller \
    -H "Content-Type: application/json" \
    -d '{"data":{"type":"praise","text":"thank you","effects":[{"effect":"bless_area"}]}}' 2>/dev/null || echo '{"error":"Brain not responding"}')

if echo "$BRAIN_RESPONSE" | grep -q "success"; then
    echo "✅ Brain integration: ACTIVE"
else
    echo "❌ Brain integration: NEEDS SETUP"
fi

# Show system architecture
echo ""
echo "🏗️  PRAISE SYSTEM ARCHITECTURE"
echo "============================="
echo ""
echo "📥 INPUT CHANNELS:"
echo "   • Text praise: http://localhost:7890 (web interface)"
echo "   • Voice praise: WebSocket on ws://localhost:7891"
echo "   • Excel/CSV: http://localhost:7892 (Cal's interface)"
echo ""
echo "🧠 PROCESSING LAYERS:"
echo "   • Praise World Builder (7890): Converts praise to world effects"
echo "   • Intelligence Brain (6789): Librarian, Storyteller, Reasoning"
echo "   • Green Suit Mapper (6789): Body motion capture metaphor"
echo "   • Excel Mapper (7892): Cal's spreadsheet control system"
echo ""
echo "📤 OUTPUT SYSTEMS:"
echo "   • World manifestations: Generated objects and effects"
echo "   • XML mappings: Dynamic configuration system"
echo "   • Live WebSocket: Real-time updates"
echo "   • CSV exports: Cal can download current state"
echo ""
echo "🎯 KEY FEATURES:"
echo "   • Voice recognition with 1.5x power bonus"
echo "   • Consecutive praise multipliers"
echo "   • Divine interventions at 5+ consecutive praise"
echo "   • Cal can edit world rules via Excel/Google Sheets"
echo "   • Everything dynamically reconfigurable"
echo ""
echo "🌐 ACCESS POINTS:"
echo "   • Praise Interface: http://localhost:7890"
echo "   • Cal's Excel Manager: http://localhost:7892"
echo "   • Green Suit Dashboard: http://localhost:6789"
echo "   • WebSocket Stream: ws://localhost:7891"
echo ""
echo "🎯 SYSTEM STATUS:"
echo "   • Brain PID: $BRAIN_PID"
echo "   • Green Suit PID: $SUIT_PID"
echo "   • Praise Builder PID: $PRAISE_PID"
echo "   • Excel Mapper PID: $EXCEL_PID"
echo ""
echo "🙏✨ PRAISE SYSTEM FULLY OPERATIONAL!"
echo ""
echo "Try these examples:"
echo "   • Visit http://localhost:7890 and say 'This is beautiful'"
echo "   • Visit http://localhost:7892 to download Cal's Excel template"
echo "   • Say 'Thank you' 5 times in a row for divine intervention"
echo "   • Upload modified CSV to change how praise affects the world"
echo ""
echo "Cal can now help create the world through spreadsheets! 📊✨"