#!/bin/bash

# 👁️📄🎮 LAUNCH CONTRACT VISION VIBE SYSTEM
# ==========================================
# Eye scans contracts → Boss worlds → Interactive vibe casting platform

echo "👁️📄🎮 CONTRACT VISION VIBE SYSTEM"
echo "=================================="
echo ""
echo "🎯 Revolutionary Platform Concept:"
echo "   • Eye scans any contract document"
echo "   • Automatically generates boss world from contract"
echo "   • Interactive vibe casting with live audience"
echo "   • Real-time boss battles against predatory terms"
echo "   • Community-driven contract roasting sessions"
echo ""

# Check if port 8888 is available
if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8888 is already in use. Using alternative port 8889..."
    sed -i '' 's/this.port = 8888/this.port = 8889/g' contract-vision-vibe-system.js 2>/dev/null || sed -i 's/this.port = 8888/this.port = 8889/g' contract-vision-vibe-system.js
    PORT=8889
else
    PORT=8888
fi

echo "👁️ CONTRACT SCANNING FEATURES:"
echo "   • AI-powered contract analysis"
echo "   • Evil level assessment (1-10 scale)"
echo "   • Power imbalance detection"
echo "   • Clause risk identification"
echo "   • Automatic boss type classification"
echo ""

echo "🏗️ BOSS WORLD GENERATION:"
echo "   • Corporate Overlord (Employment contracts)"
echo "   • Landlord Dragon (Rental leases)"
echo "   • Platform Titan (Terms of Service)"
echo "   • Debt Demon (Loan agreements)"
echo "   • Data Harvester (Privacy policies)"
echo "   • Claim Crusher (Insurance policies)"
echo "   • Code Tyrant (Software licenses)"
echo ""

echo "🎮 INTERACTIVE BOSS BATTLES:"
echo "   • Negotiate: Attempt to improve terms (60% success)"
echo "   • Challenge: Direct confrontation (40% success)"
echo "   • Lawyer Up: Legal protection shield (80% success)"
echo "   • Find Loophole: Exploit contract weaknesses (70% success)"
echo "   • Public Shame: Viral social media damage (50% success)"
echo "   • Union Organize: Collective action power (90% success)"
echo ""

echo "📺 VIBE CASTING PLATFORM:"
echo "   • Live audience participation"
echo "   • Real-time chat and reactions"
echo "   • Crowd-sourced legal advice"
echo "   • Viral moment amplification"
echo "   • Educational contract breakdowns"
echo ""

echo "🎭 VIBE SESSION TYPES:"
echo "   • Contract Roast Sessions"
echo "   • Boss Battle Arenas"
echo "   • Legal Comedy Hours"
echo "   • Terms Breakdown Theater"
echo "   • Corporate Horror Experiences"
echo "   • Educational Legal Streams"
echo ""

echo "🔥 AUDIENCE FEATURES:"
echo "   • Live viewer count"
echo "   • Real-time chat reactions"
echo "   • Audience polling for strategies"
echo "   • Vibe boost multipliers"
echo "   • Community contract submissions"
echo ""

echo "🚀 Launching Contract Vision Vibe System..."
node contract-vision-vibe-system.js &
VIBE_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $VIBE_PID > /dev/null; then
    echo ""
    echo "✅ Contract Vision Vibe System started successfully!"
    echo ""
    echo "👁️ VIBE PLATFORM: http://localhost:$PORT"
    echo ""
    echo "🎯 PLATFORM LAYOUT:"
    echo "   • Left Panel: Contract Scanner & Boss Worlds"
    echo "   • Center Stage: Live Boss Battle Arena"
    echo "   • Right Panel: Audience Chat & Vibe Rooms"
    echo ""
    echo "📄 CONTRACT SCANNING PROCESS:"
    echo "   1. Upload any contract document"
    echo "   2. Eye analyzes terms and clauses"
    echo "   3. AI generates boss entity from contract"
    echo "   4. Boss world environment created"
    echo "   5. Live vibe room opened for battles"
    echo ""
    echo "🎮 BOSS BATTLE MECHANICS:"
    echo "   • Each boss has unique abilities based on contract type"
    echo "   • Player actions have cooldowns and success rates"
    echo "   • Audience reactions provide vibe boosts"
    echo "   • Boss health decreases with successful actions"
    echo "   • Victory nullifies predatory contract terms"
    echo ""
    echo "📊 SAMPLE BOSS WORLDS LOADED:"
    echo "   • EvilCorp Platform Titan (Power: 95%)"
    echo "   • Slumlord Landlord Dragon (Power: 80%)"
    echo "   • Predatory Debt Demon (Power: 100%)"
    echo ""
    echo "🎭 VIBE CASTING FEATURES:"
    echo "   • Live audience participation"
    echo "   • Real-time strategy suggestions"
    echo "   • Community contract analysis"
    echo "   • Educational legal breakdowns"
    echo "   • Viral moment amplification"
    echo ""
    echo "💡 INTERACTION EXAMPLES:"
    echo "   • Negotiate with Corporate Overlord about overtime"
    echo "   • Find loopholes in predatory loan terms"
    echo "   • Organize union against platform exploitation"
    echo "   • Public shame landlord for illegal clauses"
    echo "   • Lawyer up against privacy violations"
    echo ""
    echo "🔄 REAL-TIME FEATURES:"
    echo "   • Live boss health bars"
    echo "   • Audience reaction counters"
    echo "   • Dynamic vibe effects"
    echo "   • Auto-generated crowd comments"
    echo "   • Victory celebration animations"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening contract vision vibe platform..."
        open http://localhost:$PORT
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening contract vision vibe platform..."
        xdg-open http://localhost:$PORT
    else
        echo "📱 Manually visit: http://localhost:$PORT"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $VIBE_PID"
    echo ""
    echo "👁️ The eye sees all contracts, the audience decides their fate..."
    echo ""
    
    # Keep script running
    echo "🔄 Contract vision vibe system running... Press Ctrl+C to stop"
    trap "echo ''; echo '👁️ Closing the vibe platform...'; kill $VIBE_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $VIBE_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Contract vision vibe system stopped"
else
    echo "❌ Failed to launch Contract Vision Vibe System"
    exit 1
fi