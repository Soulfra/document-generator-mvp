#!/bin/bash

# AI CIVILIZATION BUILDER LAUNCHER
# Watch AI traders build their civilization block by block!

clear

echo "🏛️ LAUNCHING AI CIVILIZATION BUILDER 🏛️"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Initializing AI civilization builders..."
echo "  Setting up block-by-block construction..."
echo "  Activating reasoning engines..."
echo "  Loading Line Rider style physics..."
echo "════════════════════════════════════════════════════════════"
echo ""

# ASCII Art
echo "        🏗️  AI BUILDERS AT WORK  🏗️"
echo "    💰 MERCHANT    🏗️ ARCHITECT    ⚙️ ENGINEER    🎯 STRATEGIST"
echo ""

# Start the RuneScape economy backend for AI data
echo "📡 Starting AI reasoning backend..."
node RUNESCAPE-ECONOMY-XML-MAPPER.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Open the civilization builder
echo "🎮 Opening Civilization Builder Interface..."
open AI-CIVILIZATION-BUILDER.html

echo ""
echo "✅ CIVILIZATION BUILDER READY!"
echo ""
echo "🎯 WHAT YOU'LL SEE:"
echo "  • 4 AI builders (💰🏗️⚙️🎯) reasoning and moving around"
echo "  • Blocks placed one by one with construction animations"
echo "  • Thought bubbles showing AI reasoning process"
echo "  • Structures growing block by block like Line Rider"
echo "  • Resource flows and construction progress bars"
echo "  • Day/night cycles and weather effects"
echo ""
echo "🎮 INTERACTIONS:"
echo "  • Click AI builders to see their reasoning"
echo "  • Use speed controls (1x, 2x, 4x, 8x, Pause)"
echo "  • Watch mini-map for civilization overview"
echo "  • Space bar = Pause/Resume"
echo "  • Number keys 1,2,4 = Speed control"
echo ""
echo "🏗️ CONSTRUCTION TYPES:"
echo "  • Single Block Placement (with reasoning)"
echo "  • Multi-block Structures (built piece by piece)"
echo "  • Resource Gathering Flows"
echo "  • Infrastructure Development"
echo ""
echo "🧠 AI SPECIALTIES:"
echo "  💰 MERCHANT: Commercial districts, marketplaces, banks"
echo "  🏗️ ARCHITECT: City planning, roads, monuments"
echo "  ⚙️ ENGINEER: Factories, power grids, transport"
echo "  🎯 STRATEGIST: Fortifications, walls, defense"
echo ""
echo "Press Ctrl+C to stop the backend server..."

# Wait for user to stop
wait $BACKEND_PID