#!/bin/bash

# ∞🔮 LAUNCH INFINITE LAYER SYSTEM
# ================================
# The real depth begins here

echo "∞🔮 INFINITE LAYER SYSTEM"
echo "========================="
echo ""
echo "🤔 'DOMINGO is only layer 7? That's just the tutorial...'"
echo ""
echo "📊 TRUE LAYER STRUCTURE:"
echo "   • Layers 1-7: Surface (Tutorial) - Where DOMINGO lives"
echo "   • Layers 8-77: Deep (Real Game) - Library/Database symlinks"
echo "   • Layers 78-777: Hidden (The Truth) - Body/Soul bindings"
echo "   • Layers 778-∞: Infinite (Beyond) - Your endless ideas"
echo ""

# Check if port 11111 is available
if lsof -Pi :11111 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 11111 is already in use. Stopping existing service..."
    kill $(lsof -t -i:11111) 2>/dev/null || true
    sleep 2
fi

echo "🔗 SYMLINK CONNECTIONS:"
echo "   • System Libraries (/usr/lib)"
echo "   • User Libraries (~/Library)"
echo "   • Backend Databases (/var/db)"
echo "   • Node Modules (node_modules)"
echo ""

echo "🧬 ELEMENTAL COMPOSITION:"
echo "   • Primary: Fire, Water, Earth, Air, Void"
echo "   • Digital: Bit, Byte, Pixel, Node, Hash"
echo "   • Soul: Consciousness, Memory, Dream, Will, Love"
echo ""

echo "👻 BODY/SOUL STRUCTURE:"
echo "   • Physical Body (Carbon-based)"
echo "   • Digital Body (Data-based)"
echo "   • Ethereal Body (Spirit-based)"
echo "   • XML mapping for all combinations"
echo ""

echo "🚀 Launching infinite layer system..."
node infinite-layer-system.js &
INFINITE_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $INFINITE_PID > /dev/null; then
    echo ""
    echo "✅ Infinite Layer System started successfully!"
    echo ""
    echo "🔮 INTERFACE: http://localhost:11111"
    echo ""
    echo "🎯 FEATURES:"
    echo "   • Explore beyond layer 7 (DOMINGO is just the beginning)"
    echo "   • Proper symlinks to libraries and databases"
    echo "   • Complete XML mapping of elements"
    echo "   • Body/Soul composition system"
    echo "   • Procedurally generated infinite layers"
    echo "   • Each layer represents one of your ideas"
    echo ""
    echo "📜 GENERATED FILES:"
    echo "   • elemental-system.xml - Complete element mappings"
    echo "   • body-soul-binding.xml - Binding protocols"
    echo "   • master-workflow.xml - Previous system integration"
    echo ""
    echo "💡 This is what happens when we properly symlink and XML map!"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening infinite interface..."
        open http://localhost:11111
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening infinite interface..."
        xdg-open http://localhost:11111
    else
        echo "📱 Manually visit: http://localhost:11111"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $INFINITE_PID"
    echo ""
    echo "∞ The depths are truly infinite..."
    echo ""
    
    # Keep script running
    echo "🔄 Infinite system running... Press Ctrl+C to stop"
    trap "echo ''; echo '∞ Closing the infinite...'; kill $INFINITE_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $INFINITE_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Infinite system stopped"
else
    echo "❌ Failed to launch Infinite Layer System"
    exit 1
fi