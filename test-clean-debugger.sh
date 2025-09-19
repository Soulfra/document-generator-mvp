#!/bin/bash

# 📱🔍 TEST CLEAN MOBILE DEBUGGER
# 
# Tests the new clean, debug-focused mobile-responsive interface

echo "📱🔍 CLEAN MOBILE DEBUGGER TEST"
echo "==============================="
echo ""
echo "🎯 What this tests:"
echo "1. 📱 Clean mobile-first interface"
echo "2. 🔍 Visual debug color switches"  
echo "3. 🟣 Purple AI layer debugging"
echo "4. 📐 Responsive across all devices"
echo "5. 🎮 Touch gesture support"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js."
    exit 1
fi

# Check if files exist
if [ ! -f "UNIVERSAL-DISPLAY-KERNEL.js" ]; then
    echo "❌ UNIVERSAL-DISPLAY-KERNEL.js not found!"
    exit 1
fi

if [ ! -f "MOBILE-RESPONSIVE-DEBUGGER.html" ]; then
    echo "❌ MOBILE-RESPONSIVE-DEBUGGER.html not found!"
    exit 1
fi

echo "🚀 Starting Universal Display Kernel with Clean Debugger..."
echo ""

# Start the kernel
node UNIVERSAL-DISPLAY-KERNEL.js &
KERNEL_PID=$!

# Give it time to start
sleep 3

echo ""
echo "✅ CLEAN DEBUGGER FEATURES:"
echo "=========================="
echo ""

echo "🔍 DEBUG COLOR SYSTEM:"
echo "   🟢 Green Switch: Normal operations (APIs working)"
echo "   🔴 Red Switch: Errors/failures (API down, connection issues)"
echo "   🟡 Yellow Switch: Warnings/performance (slow responses)"
echo "   🟣 Purple Switch: AI layer issues (LLM problems, token limits) ← YOUR REQUEST!"
echo "   🔵 Blue Switch: State changes (blockchain events)"
echo "   ⚪ White Switch: System info (device type, viewport)"
echo ""

echo "📱 MOBILE INTERFACE:"
echo "   • Tab 1 (⚡ APIs): Touch-optimized API testing"
echo "   • Tab 2 (🌊 State): Real-time event stream" 
echo "   • Tab 3 (🗺️ Map): MUD interface with debug info"
echo "   • Tab 4 (📡 Sonar): Responsive radar display"
echo ""

echo "🖥️ DESKTOP INTERFACE:"
echo "   • Left Panel: Rigid API Layer (red border)"
echo "   • Center Panel: Fluid State Layer (blue border)"
echo "   • Right Panel: Minimap/MUD Layer (green border)"
echo ""

echo "🎮 TESTING INSTRUCTIONS:"
echo "======================="
echo ""

echo "1️⃣ OPEN THE INTERFACE:"
echo "   Desktop: http://localhost:8888"
echo "   Mobile: Same URL but on phone/tablet"
echo ""

echo "2️⃣ TEST DEBUG SWITCHES (Top Bar):"
echo "   • Click 🟢 Normal: Everything should look normal"
echo "   • Click 🔴 Errors: Components turn red, shows error simulation"
echo "   • Click 🟡 Warnings: Shows yellow warning states"
echo "   • Click 🟣 AI Issues: Purple highlights AI problems ← THIS IS YOUR MAIN ASK!"
echo "   • Click 🔵 State: Shows state change events"
echo "   • Click ⚪ Info: Shows system information"
echo ""

echo "3️⃣ TEST API ENDPOINTS:"
echo "   • Click any API button (POST /api/agent/create, etc.)"
echo "   • Watch the color changes based on debug mode"
echo "   • In AI debug mode, click 'POST /api/ai/query' to see purple issues"
echo ""

echo "4️⃣ MOBILE SPECIFIC:"
echo "   • Swipe between tabs on mobile"
echo "   • Touch feedback on interactions"
echo "   • Pull to refresh gestures"
echo ""

echo "5️⃣ DEBUG CONSOLE:"
echo "   • Click 🔍 button to open debug overlay"
echo "   • Shows all events with color coding"
echo "   • Filter by debug type"
echo ""

echo "🟣 AI DEBUGGING HIGHLIGHTED:"
echo "=========================="
echo "This specifically addresses your request:"
echo "\"why aren't we using the switches and colors etc. that way we can debug easier\""
echo "\"maybe purple because that seems to show any issues asap for the ai layer too\""
echo ""
echo "✅ SOLUTION:"
echo "   • Purple debug switch specifically for AI issues"
echo "   • Visual color coding makes problems immediately visible"
echo "   • Easy to spot AI layer problems vs regular errors"
echo "   • Clean interface that's not 'off' like the previous HTML"
echo ""

echo "🎯 WHAT'S DIFFERENT FROM MESSY HTML:"
echo "==================================="
echo "• Clean, organized CSS with proper mobile-first design"
echo "• Debug color system built-in from the start"
echo "• Uses existing debug infrastructure (universal-debug-interface.js)"
echo "• Proper touch targets and responsive breakpoints"
echo "• Visual feedback for all interactions"
echo "• Real-time WebSocket connection to existing systems"
echo ""

echo "Press Ctrl+C to stop the test"
echo ""
echo "🔗 Interface URL: http://localhost:8888"
echo "🔌 WebSocket: ws://localhost:8889"
echo ""

# Wait for interrupt
trap "kill $KERNEL_PID 2>/dev/null; echo ''; echo '✅ Clean debugger test stopped'; exit 0" INT TERM

wait $KERNEL_PID