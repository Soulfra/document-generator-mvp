#!/bin/bash

echo "🔍 SYSTEM VERIFICATION REPORT"
echo "============================="
echo ""

# Count online services
ONLINE_COUNT=0
TOTAL_COUNT=7

# Test each service
echo "📡 SERVICE STATUS:"
echo ""

# Orchestrator
if curl -s http://localhost:3001/status | grep -q "operational"; then
    echo "✅ Orchestrator (3001): ONLINE"
    EVENTS=$(curl -s http://localhost:3001/status | grep -o '"totalEvents":[0-9]*' | cut -d: -f2)
    echo "   └─ Events processed: $EVENTS"
    ((ONLINE_COUNT++))
else
    echo "❌ Orchestrator (3001): OFFLINE"
fi

# Flask API
if curl -s http://localhost:5002/api/metrics >/dev/null 2>&1; then
    echo "✅ Flask API (5002): ONLINE"
    ((ONLINE_COUNT++))
else
    echo "❌ Flask API (5002): OFFLINE"
fi

# Hyper-Dimensional
if curl -s http://localhost:3005/hyper/status | grep -q "signatures"; then
    echo "✅ Hyper-Dimensional (3005): ONLINE"
    SIGS=$(curl -s http://localhost:3005/hyper/status | grep -o '"chainLength":[0-9]*' | cut -d: -f2)
    echo "   └─ Signature chain: $SIGS"
    ((ONLINE_COUNT++))
else
    echo "❌ Hyper-Dimensional (3005): OFFLINE"
fi

# Groove Layer
if curl -s http://localhost:3006/groove/status | grep -q "bpm"; then
    echo "✅ Groove Layer (3006): ONLINE"
    BPM=$(curl -s http://localhost:3006/groove/status | grep -o '"bpm":[0-9]*' | cut -d: -f2)
    echo "   └─ Current BPM: $BPM"
    ((ONLINE_COUNT++))
else
    echo "❌ Groove Layer (3006): OFFLINE"
fi

# Trust System
if curl -s http://localhost:3008/trust/status | grep -q "handshakes"; then
    echo "✅ Trust System (3008): ONLINE"
    echo "   └─ Trust established between human and AI"
    ((ONLINE_COUNT++))
else
    echo "❌ Trust System (3008): OFFLINE"
fi

# Game Engine
if curl -s http://localhost:4009/games/status >/dev/null 2>&1; then
    echo "✅ Game Engine (4009): ONLINE"
    ((ONLINE_COUNT++))
else
    echo "❌ Game Engine (4009): OFFLINE"
fi

# Classic Battle.net
if curl -s http://localhost:4200/classic/status >/dev/null 2>&1; then
    echo "✅ Classic Battle.net (4200): ONLINE"
    ((ONLINE_COUNT++))
else
    echo "❌ Classic Battle.net (4200): OFFLINE"
fi

echo ""
echo "📊 SUMMARY: $ONLINE_COUNT/$TOTAL_COUNT services online"
echo ""

# Test key features
echo "🔧 FEATURE TESTS:"
echo ""

# Test Bass Drop
echo -n "1. Bass Drop Test: "
if curl -s -X POST http://localhost:3006/groove/drop | grep -q "success"; then
    echo "✅ WORKING - Bass drop triggered successfully!"
else
    echo "❌ FAILED - Cannot trigger bass drop"
fi

# Test BPM Change
echo -n "2. BPM Sync Test: "
if curl -s -X POST http://localhost:3006/groove/bpm -H "Content-Type: application/json" -d '{"bpm": 128}' | grep -q "success"; then
    echo "✅ WORKING - BPM synchronization active"
else
    echo "❌ FAILED - BPM sync not responding"
fi

# Test Trust Logic
echo -n "3. Trust Logic Test: "
LOGIC_COUNT=$(curl -s "http://localhost:3008/trust/logic?limit=5" 2>/dev/null | grep -o '"recentLogic":\[' | wc -l)
if [ "$LOGIC_COUNT" -gt 0 ]; then
    echo "✅ WORKING - Trust logic stream active"
else
    echo "❌ FAILED - No trust logic data"
fi

# Test Hyper Signatures
echo -n "4. Signature Test: "
if curl -s http://localhost:3005/hyper/status | grep -q "matthewmauer"; then
    echo "✅ WORKING - Personal signatures verified"
else
    echo "❌ FAILED - Signature verification failed"
fi

echo ""
echo "🎮 OVERALL SYSTEM STATUS:"
if [ $ONLINE_COUNT -ge 4 ]; then
    echo "✅ SYSTEM OPERATIONAL - Core services running"
else
    echo "❌ SYSTEM DEGRADED - Too many services offline"
fi

echo ""
echo "📝 To view real-time dashboard:"
echo "   Open: file:///Users/matthewmauer/Desktop/Document-Generator/verification-dashboard.html"
echo ""
echo "🔬 Verification complete at $(date)"