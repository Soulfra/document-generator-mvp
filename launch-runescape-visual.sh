#!/bin/bash

# RUNESCAPE VISUAL TRADER LAUNCHER
# Starts the economy backend and opens the visual interface

clear

echo "🏰 LAUNCHING RUNESCAPE AI TRADER VISUAL INTERFACE 🏰"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Starting economy backend server..."
echo "  Opening visual interface..."
echo "  Connecting WebSocket stream..."
echo "════════════════════════════════════════════════════════════"
echo ""

# Start the economy mapper in background
echo "📡 Starting RuneScape Economy XML Mapper..."
node RUNESCAPE-ECONOMY-XML-MAPPER.js &
ECONOMY_PID=$!

# Wait a moment for server to start
sleep 3

# Open the visual interface
echo "🎮 Opening Visual Trader Interface..."
open RUNESCAPE-VISUAL-TRADER-INTERFACE.html

echo ""
echo "✅ SYSTEM READY!"
echo ""
echo "🌐 Visual Interface: Browser should be open now"
echo "📊 Economy Dashboard: http://localhost:9999/economy"
echo "🔗 XML Stream: http://localhost:9999/xml"
echo "📡 WebSocket: ws://localhost:9998"
echo ""
echo "🎯 HOW TO USE:"
echo "  • Click on AI traders (💰🔨⚡📈) to see their menus"
echo "  • Drag & drop elements from the right palette"
echo "  • Use drawing tools at bottom to draw lines/circles"
echo "  • Watch chat bubbles above traders as they discuss"
echo "  • Connection lines show trader relationships"
echo ""
echo "Press Ctrl+C to stop the economy server..."

# Wait for user to stop
wait $ECONOMY_PID