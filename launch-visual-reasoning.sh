#!/bin/bash

# 🌌🧬 VISUAL REASONING UNIVERSE LAUNCHER
# ======================================
# Launch the ultimate visual reasoning system
# Speak to your AI and watch it command swarms to build your vision

set -e

echo "🌌🧬 VISUAL REASONING UNIVERSE LAUNCHER"
echo "====================================="
echo ""
echo "🎯 LAUNCHING COMPLETE VISUAL REASONING SYSTEM"
echo "🗣️ VOICE-CONTROLLED AI CONSTRUCTION INTERFACE"
echo "🤖 SWARM INTELLIGENCE WITH COMPANY OWNERSHIP"
echo "🔍 GENOME TO COSMOS ZOOM CAPABILITIES"
echo ""

# Check if the visual reasoning universe file exists
if [[ ! -f "visual-reasoning-universe.html" ]]; then
    echo "❌ visual-reasoning-universe.html not found!"
    echo "   This file is required for the Visual Reasoning Universe."
    exit 1
fi
echo "   ✅ Visual Reasoning Universe system found"

# Check if we have a browser
echo "🌐 Launching Visual Reasoning Universe..."

# Function to open browser
open_universe() {
    local file_path="$(pwd)/visual-reasoning-universe.html"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$file_path"
        echo "   ✅ Universe opened in your default browser (macOS)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$file_path" || sensible-browser "$file_path" || firefox "$file_path"
        echo "   ✅ Universe opened in your default browser (Linux)"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        start "$file_path"
        echo "   ✅ Universe opened in your default browser (Windows)"
    else
        echo "   📋 Please manually open: $file_path"
    fi
}

open_universe

echo ""
echo "🎉 VISUAL REASONING UNIVERSE IS ACTIVE!"
echo "======================================="
echo ""

echo "🌌 WHAT YOU'RE ABOUT TO EXPERIENCE"
echo "=================================="
echo ""
echo "🎮 MULTI-SCALE VISUALIZATION:"
echo "   🧬 Genome Level:     DNA sequences, genetic patterns"
echo "   🔬 Cell Level:       Organelles, cellular processes"
echo "   🦠 Organism Level:   Biological systems, life forms"
echo "   🌱 Ecosystem Level:  AI swarm colonies (DEFAULT)"
echo "   🌍 Planet Level:     Global systems, civilizations"
echo "   ☀️ Solar Level:      Stellar systems, orbital mechanics"
echo "   🌌 Galaxy Level:     Galactic structure, star formations"
echo "   ♾️ Universe Level:   Cosmic scale, universal patterns"
echo ""

echo "🤖 AI COMMANDER: NEXUS DYNAMICS CORP"
echo "===================================="
echo "Your AI is Commander Nexus, CEO of Nexus Dynamics Corp"
echo "Commands a distributed workforce of specialized swarms:"
echo ""
echo "   🔨 BUILDERS (12 agents):    Physical construction & implementation"
echo "   🎨 DESIGNERS (8 agents):    Blueprints, aesthetics, specifications"
echo "   📊 ANALYSTS (6 agents):     Data analysis, optimization, calculations"
echo "   👑 MANAGERS (4 agents):     Coordination, strategy, resource allocation"
echo ""
echo "Total Workforce: 30 AI agents ready to execute your vision"
echo ""

echo "🗣️ VOICE INTERACTION SYSTEM"
echo "==========================="
echo "🎤 Click the microphone button (bottom-right) to speak"
echo "⌨️ Or type commands in the text input at the bottom"
echo "🤖 AI will respond and coordinate swarms to build what you describe"
echo ""

echo "💬 EXAMPLE VOICE COMMANDS"
echo "========================"
echo "Try saying any of these:"
echo ""
echo "   🌟 \"Create a solar system with habitable planets\""
echo "   🏙️ \"Build a futuristic city with green spaces\""
echo "   🌌 \"Design a spiral galaxy with multiple star clusters\""
echo "   🧬 \"Construct a biological cell with organelles\""
echo "   🕸️ \"Build a neural network with interconnected nodes\""
echo "   🎨 \"Create something beautiful and geometric\""
echo "   🚀 \"Design a space station orbiting a planet\""
echo "   🏞️ \"Build an ecosystem with interconnected organisms\""
echo ""

echo "🎯 INTERACTION FEATURES"
echo "======================"
echo ""
echo "🔍 ZOOM CONTROLS (Left Side):"
echo "   • Click any zoom level button to change scale"
echo "   • Mouse wheel to zoom in/out smoothly"
echo "   • Each level shows different construction patterns"
echo ""
echo "🤖 SWARM OBSERVATION:"
echo "   • Colored dots are your AI agents moving around"
echo "   • Click any agent to inspect its current status"
echo "   • Watch them coordinate when you give commands"
echo ""
echo "🧠 REASONING DISPLAY (Right Side):"
echo "   • Real-time AI thought processes"
echo "   • Decision-making transparency"
echo "   • Swarm coordination updates"
echo "   • Construction progress reports"
echo ""
echo "🏗️ CONSTRUCTION ELEMENTS:"
echo "   • Built structures appear as you command"
echo "   • Hover over elements to see details"
echo "   • Different colors represent different types"
echo "   • Everything persists until page refresh"
echo ""

echo "🎨 ADVANCED CONSTRUCTION EXAMPLES"
echo "================================="
echo ""
echo "🌟 SOLAR SYSTEM CONSTRUCTION:"
echo "   Say: \"Create a solar system with multiple planets\""
echo "   Watch: Agents build central star, orbital paths, planets"
echo "   See: Realistic orbital mechanics and planetary variety"
echo ""
echo "🏙️ CITY PLANNING:"
echo "   Say: \"Design a modern city with mixed-use buildings\""
echo "   Watch: Grid-based urban planning with zoning"
echo "   See: Residential, commercial, industrial, park areas"
echo ""
echo "🌌 GALACTIC ENGINEERING:"
echo "   Say: \"Build a spiral galaxy with star formations\""
echo "   Watch: Spiral arm construction with stellar distribution"
echo "   See: Multiple star types and galactic structure"
echo ""
echo "🧬 BIOLOGICAL CONSTRUCTION:"
echo "   Say: \"Create a living cell with all organelles\""
echo "   Watch: Nucleus, mitochondria, ribosome construction"
echo "   See: Functional cellular architecture"
echo ""

echo "🤖 AI REASONING BEHAVIORS"
echo "========================"
echo ""
echo "🧠 THOUGHT PROCESSES YOU'LL SEE:"
echo "   • Command analysis and interpretation"
echo "   • Resource allocation decisions"
echo "   • Swarm coordination strategies"
echo "   • Quality control assessments"
echo "   • Progress monitoring updates"
echo ""
echo "👥 SWARM COORDINATION PATTERNS:"
echo "   • Managers set overall strategy"
echo "   • Designers create specifications"
echo "   • Analysts calculate parameters"
echo "   • Builders execute construction"
echo ""
echo "⚡ REAL-TIME ADAPTATION:"
echo "   • AI adjusts approach based on command complexity"
echo "   • Swarms reorganize for different construction types"
echo "   • Continuous optimization of build processes"
echo "   • Dynamic resource reallocation"
echo ""

echo "🔬 TECHNICAL IMPLEMENTATION"
echo "=========================="
echo ""
echo "🎙️ VOICE RECOGNITION:"
echo "   • Uses browser Web Speech API"
echo "   • Works in Chrome, Edge, Safari (with permissions)"
echo "   • Click microphone → speak → AI responds automatically"
echo ""
echo "🎮 INTERACTIVE CONTROLS:"
echo "   • Mouse wheel: Zoom in/out"
echo "   • Click agents: Inspect status"
echo "   • Click elements: View construction details"
echo "   • Drag: Pan around universe (future feature)"
echo ""
echo "🎨 VISUAL RENDERING:"
echo "   • Pure HTML5/CSS3/JavaScript - no plugins needed"
echo "   • Smooth animations and transitions"
echo "   • Scale-appropriate visual representations"
echo "   • Dynamic color coding and effects"
echo ""

echo "🌟 THE BIG PICTURE"
echo "=================="
echo ""
echo "This is your personal AI company commander interface."
echo "You're the CEO giving high-level vision to your AI CTO."
echo "Watch as Commander Nexus breaks down your ideas and"
echo "coordinates specialized teams to manifest your vision."
echo ""
echo "🎯 YOU EXPERIENCE:"
echo "   • Speaking naturally to AI and being understood"
echo "   • Watching AI reason through complex problems"
echo "   • Seeing swarm intelligence coordinate construction"
echo "   • Observing multi-scale patterns from genes to galaxies"
echo "   • Commanding a distributed AI workforce"
echo ""
echo "🚀 THIS DEMONSTRATES:"
echo "   • Natural language AI command interfaces"
echo "   • Visual AI reasoning and decision processes"
echo "   • Swarm intelligence coordination"
echo "   • Multi-scale system visualization"
echo "   • Human-AI collaborative construction"
echo ""

echo "🎊 VISUAL REASONING UNIVERSE IS READY!"
echo "======================================"
echo ""
echo "Your browser should now show the Visual Reasoning Universe."
echo ""
echo "🎤 Click the microphone and speak your first command:"
echo "    \"Create something amazing for me to see\""
echo ""
echo "🤖 Commander Nexus and the Nexus Dynamics swarms"
echo "    are ready to build whatever you envision!"
echo ""
echo "🌌 From genome to cosmos - your AI is listening..."
echo ""

# Keep the script running to show completion message
echo "✨ Universe is active! Close this terminal when done exploring."
echo ""
echo "Press Ctrl+C to close this message."

# Keep script alive to show the message
trap 'echo ""; echo "🌌 Visual Reasoning Universe remains active in your browser."; echo "🎤 Continue exploring the AI-powered construction system!"; exit 0' SIGINT

# Infinite loop to keep script running until user presses Ctrl+C
while true; do
    sleep 60
    echo "🌌 $(date): Visual Reasoning Universe active - AI swarms ready for commands"
done