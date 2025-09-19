#!/bin/bash

# 🌐📜 LAUNCH WEBSITE SCANNER SAGA
# ================================
# XML Handshake Scanner with HollowTown Lore

echo "🌐📜 WEBSITE SCANNER SAGA"
echo "========================"
echo ""
echo "📖 THE SAGA BEGINS..."
echo ""
echo "Long ago, when dial-up modems sang their connection songs,"
echo "worldbuilders began digging through the depths of HollowTown,"
echo "searching for treasures hidden in the fabric of the internet..."
echo ""
echo "🏰 HOLLOWTOWN DEPTHS:"
echo "   Level 1: The Protocol Stone"
echo "   Level 2: The Packet Prism"
echo "   Level 3: The Binary Blade"
echo "   Level 4: The Encryption Eye"
echo "   Level 5: The Algorithm Amulet"
echo "   Level 6: The Quantum Key"
echo "   Level 7: The Singularity Seed"
echo ""

# Check if port 4444 is available
if lsof -Pi :4444 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 4444 is already in use. Stopping existing service..."
    kill $(lsof -t -i:4444) 2>/dev/null || true
    sleep 2
fi

echo "🔍 SCANNER FEATURES:"
echo "   • XML Handshake Protocol v2.0"
echo "   • Frontend framework detection"
echo "   • Backend server analysis"
echo "   • Integration pattern mapping"
echo "   • Treasure hunting at each depth"
echo "   • Storyteller observations"
echo ""

echo "📚 INTERNET HISTORY CHAPTERS:"
echo "   • The Dial-Up Dawn (1969-1995)"
echo "   • The Browser Wars (1995-2001)"
echo "   • The Social Awakening (2001-2010)"
echo "   • The Mobile Revolution (2010-2020)"
echo "   • The Metaverse Emergence (2020-Present)"
echo ""

echo "🚀 Starting scanner saga..."
node website-scanner-saga.js &
SCANNER_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $SCANNER_PID > /dev/null; then
    echo ""
    echo "✅ Website Scanner Saga started successfully!"
    echo ""
    echo "📜 SCANNER INTERFACE: http://localhost:4444"
    echo ""
    echo "🎯 HOW TO USE:"
    echo "   1. Enter any website URL to scan"
    echo "   2. Choose depth level (1-7)"
    echo "   3. Watch as the scanner analyzes frontend/backend"
    echo "   4. Search for treasures at each depth"
    echo "   5. View XML handshake data"
    echo "   6. Read storyteller observations"
    echo ""
    echo "🎭 The storytellers are watching..."
    echo "   They observe how people react to this new way"
    echo "   of consuming media through the digital realm..."
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening scanner saga..."
        open http://localhost:4444
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening scanner saga..."
        xdg-open http://localhost:4444
    else
        echo "📱 Manually visit: http://localhost:4444"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $SCANNER_PID"
    echo ""
    echo "📜 The saga continues..."
    echo ""
    
    # Keep script running
    echo "🔄 Scanner saga running... Press Ctrl+C to stop"
    trap "echo ''; echo '📜 Closing the tome...'; kill $SCANNER_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $SCANNER_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Scanner saga ended"
else
    echo "❌ Failed to start Website Scanner Saga"
    exit 1
fi