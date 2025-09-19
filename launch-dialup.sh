#!/bin/bash

# 📞 LAUNCH TECH TITAN DIAL-UP SYSTEM
# ===================================
# Direct dial to Apple, Google, Microsoft and more!

echo "📞🌐 TECH TITAN DIAL-UP SYSTEM"
echo "=============================="
echo ""
echo "🏢 PREPARING DIRECT LINES TO SILICON VALLEY..."
echo ""

# Check if port 7777 is available
if lsof -Pi :7777 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 7777 is already in use. Stopping existing service..."
    kill $(lsof -t -i:7777) 2>/dev/null || true
    sleep 2
fi

echo "📞 AVAILABLE CONNECTIONS:"
echo "   🍎 Apple Inc. (AAPL) - 1-800-APL-CARE"
echo "   🔍 Google/Alphabet (GOOGL) - 1-800-GOOGLE1"
echo "   🪟 Microsoft (MSFT) - 1-800-MSFT-NOW"
echo "   👥 Meta/Facebook (META) - 1-800-META-VRS"
echo "   📦 Amazon (AMZN) - 1-800-AMAZON1"
echo "   🚗 Tesla (TSLA) - 1-800-TESLA-GO"
echo "   🎮 NVIDIA (NVDA) - 1-800-GPU-POWR"
echo "   🗄️ Oracle (ORCL) - 1-800-ORACLE1"
echo ""

echo "⭐ VIP DIRECT LINES:"
echo "   💼 Bill Gates - 1-800-BILL-GAT"
echo "   🍎 Steve Jobs Archive - 1-800-STEVE-JB"
echo "   🚀 Elon Musk Hotline - 1-800-ELON-MUS"
echo "   📦 Jeff Bezos - 1-800-JEFF-BEZ"
echo "   👥 Mark Zuckerberg - 1-800-ZUCK-MET"
echo ""

echo "🚀 Starting dial-up system..."
node tech-titan-dialup-system.js &
DIALUP_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $DIALUP_PID > /dev/null; then
    echo ""
    echo "✅ Tech Titan Dial-Up System started successfully!"
    echo ""
    echo "📞 SWITCHBOARD: http://localhost:7777"
    echo "📋 Connection protocols saved: tech-titan-protocols.json"
    echo ""
    echo "🎯 FEATURES:"
    echo "   • Direct dial to major tech companies"
    echo "   • VIP lines to tech legends"
    echo "   • Real-time connection status"
    echo "   • Switchboard operator routing"
    echo "   • Connection transcripts"
    echo "   • Response time simulation"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening switchboard..."
        open http://localhost:7777
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening switchboard..."
        xdg-open http://localhost:7777
    else
        echo "📱 Manually visit: http://localhost:7777"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $DIALUP_PID"
    echo ""
    echo "☎️  Ring ring... Your call is important to us!"
    echo ""
    
    # Keep script running to monitor
    echo "🔄 Switchboard active... Press Ctrl+C to hang up"
    trap "echo ''; echo '📞 Hanging up...'; kill $DIALUP_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $DIALUP_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Dial-up system disconnected"
else
    echo "❌ Failed to start Tech Titan Dial-Up System"
    exit 1
fi