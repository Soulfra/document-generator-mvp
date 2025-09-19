#!/bin/bash

# 📞🌐 LAUNCH HOLLOWTOWN.COM YELLOWBOOK
# ====================================
# Start the ultimate internet directory

echo "📞🌐 LAUNCHING HOLLOWTOWN.COM YELLOWBOOK SYSTEM"
echo "=============================================="

echo "🏗️ Building the internet's premier directory..."
echo "📞 Creating comprehensive yellowbook listings..."
echo "🤝 Integrating XML handshake protocols..."
echo "🌐 Starting HollowTown.com website..."
echo ""

# Check if port 8888 is available
if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8888 is already in use. Stopping existing service..."
    kill $(lsof -t -i:8888) 2>/dev/null || true
    sleep 2
fi

echo "🚀 Starting HollowTown.com YellowBook System..."
echo ""

# Start the yellowbook system
node hollowtown-yellowbook-system.js &
YELLOWBOOK_PID=$!

# Wait for startup
sleep 4

# Check if system started successfully
if ps -p $YELLOWBOOK_PID > /dev/null; then
    echo "✅ HollowTown.com YellowBook System started successfully!"
    echo ""
    echo "🌐 WEBSITE LIVE: http://localhost:8888"
    echo ""
    echo "📞 THE INTERNET YELLOWBOOK FEATURES:"
    echo "   🤖 AI Services Directory"
    echo "   🗺️ XML Mapping Services"
    echo "   🏗️ System Architecture Solutions"
    echo "   🛡️ Recovery & Protection Systems"
    echo "   📊 Visualization & Dashboards"
    echo "   ⚙️ Automation & Workflow Tools"
    echo "   🔮 Prediction & Analytics Engines"
    echo "   🎨 Creative & Design Tools"
    echo ""
    echo "🔍 CAPABILITIES:"
    echo "   • Comprehensive service search"
    echo "   • XML handshake verification"
    echo "   • Real-time service status"
    echo "   • Category browsing"
    echo "   • Featured service showcase"
    echo "   • Professional directory interface"
    echo ""
    echo "🤝 HANDSHAKE INTEGRATION:"
    echo "   • Service verification protocols"
    echo "   • Real-time availability testing"
    echo "   • XML mapping integration"
    echo "   • System health monitoring"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening HollowTown.com..."
        open http://localhost:8888
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening HollowTown.com..."
        xdg-open http://localhost:8888
    else
        echo "📱 Manually visit: http://localhost:8888"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $YELLOWBOOK_PID"
    echo ""
    echo "🎯 HollowTown.com - The Internet's Premier YellowBook Directory"
    echo "📞 Where Innovation Meets Directory Services"
    echo ""
    
    # Keep script running to monitor
    echo "🔄 YellowBook system running... Press Ctrl+C to stop"
    trap "echo ''; echo '🛑 Stopping HollowTown.com...'; kill $YELLOWBOOK_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $YELLOWBOOK_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ HollowTown.com stopped unexpectedly"
else
    echo "❌ Failed to start HollowTown.com YellowBook System"
    exit 1
fi