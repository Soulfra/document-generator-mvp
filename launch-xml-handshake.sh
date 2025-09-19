#!/bin/bash

# 🤝🗺️ LAUNCH XML HANDSHAKE MAPPING SYSTEM
# =========================================
# Start comprehensive XML mapping with viewing interface

echo "🤝🗺️ LAUNCHING XML HANDSHAKE MAPPING SYSTEM"
echo "==========================================="

echo "🔍 Initializing system discovery..."
echo "🗺️ Creating XML structure maps..."
echo "🤝 Setting up handshake protocols..."
echo "📺 Starting viewing interface..."
echo ""

# Check if port 3333 is available
if lsof -Pi :3333 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3333 is already in use. Stopping existing service..."
    kill $(lsof -t -i:3333) 2>/dev/null || true
    sleep 2
fi

echo "🚀 Starting XML Handshake Mapping System..."
echo ""

# Start the system
node xml-handshake-mapping-system.js &
SYSTEM_PID=$!

# Wait a moment for startup
sleep 3

# Check if system started successfully
if ps -p $SYSTEM_PID > /dev/null; then
    echo "✅ XML Handshake Mapping System started successfully!"
    echo ""
    echo "🌐 VIEWING INTERFACE: http://localhost:3333"
    echo ""
    echo "📊 Features available:"
    echo "   • Real-time system discovery and mapping"
    echo "   • XML structure visualization"
    echo "   • Handshake protocol verification"
    echo "   • Connection graph analysis"
    echo "   • Live data updates every 30 seconds"
    echo ""
    echo "🔧 Available actions:"
    echo "   • Refresh data in real-time"
    echo "   • Test handshake protocols"
    echo "   • Export XML mappings"
    echo "   • View system connections"
    echo ""
    echo "⏹️  To stop the system: kill $SYSTEM_PID"
    echo ""
    
    # Try to open browser (if available)
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening browser..."
        open http://localhost:3333
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening browser..."
        xdg-open http://localhost:3333
    else
        echo "📱 Manually open: http://localhost:3333"
    fi
    
    # Keep script running to monitor
    echo "🔄 System running... Press Ctrl+C to stop"
    trap "echo ''; echo '🛑 Stopping XML Handshake System...'; kill $SYSTEM_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $SYSTEM_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ System stopped unexpectedly"
else
    echo "❌ Failed to start XML Handshake Mapping System"
    exit 1
fi