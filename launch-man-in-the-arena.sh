#!/bin/bash

# 🏟️⚔️🎭 LAUNCH MAN IN THE ARENA SYSTEM
# =====================================
# Watch individual heroes face dramatic obstacles with cinematic storytelling

echo "🏟️⚔️🎭 MAN IN THE ARENA SYSTEM"
echo "==============================="
echo ""
echo "🎯 Epic Hero Challenge Experience:"
echo "   • Individual agents face dramatic obstacles"
echo "   • Cinematic storytelling with character arcs"
echo "   • Visual progression through challenge stages"
echo "   • Real-time narrative of struggle and triumph"
echo "   • Theodore Roosevelt's 'Man in the Arena' spirit"
echo "   • Watch heroes overcome seemingly impossible odds"
echo ""

# Check if port 4000 is available
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 4000 is already in use. Stopping existing service..."
    kill $(lsof -t -i:4000) 2>/dev/null || true
    sleep 2
fi

echo "🏟️ THE ARENA OF TRIALS:"
echo "   • Golden circle arena with dramatic lighting"
echo "   • Spotlight following the current challenger"
echo "   • Multi-stage challenge progression system"
echo "   • Real-time obstacle tracking and storytelling"
echo "   • Hall of Heroes showcasing all contestants"
echo "   • Live narrative feed with dramatic moments"
echo ""

echo "⚔️ EPIC CHALLENGES AVAILABLE:"
echo "   • 🧠 The Abyss Climb (Legendary) - Philosophical enlightenment"
echo "   • ⚙️ The Innovation Forge (Epic) - Breakthrough invention"
echo "   • 🎨 The Culture Renaissance (Epic) - Artistic inspiration" 
echo "   • 🤝 The Leadership Trial (Heroic) - Unite warring factions"
echo "   • 🔨 The Survival Gauntlet (Brutal) - Overcome impossible odds"
echo ""

echo "🎭 CHALLENGE STAGES & OBSTACLES:"
echo "   • Each challenge has 5 progressive stages"
echo "   • Stage-specific obstacles test different abilities"
echo "   • Success probability based on agent stats and type"
echo "   • Previous failures make later obstacles harder"
echo "   • Previous successes build momentum and confidence"
echo ""

echo "📊 HERO STATISTICS & REPUTATION:"
echo "   • Courage: Willingness to face danger"
echo "   • Skill: Technical/professional competence"
echo "   • Determination: Persistence through setbacks"
echo "   • Wisdom: Learning from experience"
echo "   • Luck: Random fortune and timing"
echo "   • Reputation: Unknown → Promising → Capable → Skilled → Heroic → Legendary"
echo ""

echo "🎬 CINEMATIC STORYTELLING:"
echo "   • Hero Journey: Classic triumph through adversity"
echo "   • Tragedy: Noble effort ending in instructive defeat"
echo "   • Redemption: Past failures overcome through growth"
echo "   • Real-time narration with contextual drama"
echo "   • Audience reactions and crowd engagement"
echo ""

echo "🌟 HEROIC CHALLENGER TYPES:"
echo "   • 🧠 Philosophers: Deep wisdom, logical reasoning, spiritual insight"
echo "   • ⚙️ Engineers: Technical mastery, problem-solving, innovation"
echo "   • 🎨 Artists: Creative vision, emotional expression, cultural impact"
echo "   • 🤝 Diplomats: Persuasive speech, conflict resolution, leadership"
echo "   • 🔨 Workers: Unwavering determination, physical endurance, practical skills"
echo ""

echo "🏆 VICTORY CONDITIONS:"
echo "   • Must overcome 60% or more of challenge obstacles"
echo "   • Success builds reputation and unlocks harder challenges"
echo "   • Defeat is noble and teaches valuable lessons"
echo "   • Every attempt adds to the hero's legend"
echo "   • Arena history preserves all great efforts"
echo ""

echo "🎯 DRAMATIC PROGRESSION:"
echo "   • Preparation: Hero enters arena, crowd anticipates"
echo "   • Challenge: Obstacles mount, failure seems certain"
echo "   • Crisis: Darkest moment, final test of character"
echo "   • Resolution: Victory through perseverance or noble defeat"
echo "   • Legacy: Stories inspire future challengers"
echo ""

echo "🚀 Launching Man in the Arena System..."
node man-in-the-arena-system.js &
ARENA_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $ARENA_PID > /dev/null; then
    echo ""
    echo "✅ Man in the Arena System started successfully!"
    echo ""
    echo "🏟️ ARENA INTERFACE: http://localhost:4000"
    echo ""
    echo "🎯 INTERFACE LAYOUT:"
    echo "   • Header: Arena stats, current challenge, hero controls"
    echo "   • Left Panel: Hall of Heroes with reputations and records"
    echo "   • Center Arena: Circular golden arena with dramatic lighting"
    echo "   • Right Panel: Available challenges and difficulty ratings"
    echo "   • Bottom Panel: Live narrative feed and arena history"
    echo ""
    echo "⚔️ WATCHING THE CHALLENGES:"
    echo "   • Heroes appear as glowing emoji in the arena center"
    echo "   • Challenge progress shown with stage indicators"
    echo "   • Real-time progress bar shows completion percentage"
    echo "   • Obstacles overcome vs failed tracked live"
    echo "   • Dramatic lighting changes based on challenge phase"
    echo ""
    echo "🎭 NARRATIVE EXPERIENCE:"
    echo "   1. Hero enters arena with motivation and background story"
    echo "   2. Challenge begins with dramatic announcement"
    echo "   3. Each obstacle generates contextual narration"
    echo "   4. Crowd reactions and commentary build tension"
    echo "   5. Victory or noble defeat concludes with legacy impact"
    echo ""
    echo "📊 HERO DEVELOPMENT:"
    echo "   • Each hero has unique strengths and weaknesses"
    echo "   • Personal motivation drives their arena efforts"
    echo "   • Background story influences challenge approach"
    echo "   • Reputation grows with victories and noble defeats"
    echo "   • Challenge history builds character legend"
    echo ""
    echo "🎮 INTERACTION FEATURES:"
    echo "   • 🌟 New Hero: Spawn additional challengers"
    echo "   • 🔄 Refresh: Update arena status and progress"
    echo "   • Hover heroes for detailed stats and background"
    echo "   • Watch real-time challenge progression"
    echo "   • Follow dramatic narrative moments"
    echo ""
    echo "🏆 CHALLENGE DIFFICULTY SYSTEM:"
    echo "   • Brutal: High failure rate, intense pressure"
    echo "   • Heroic: Significant challenge requiring skill"
    echo "   • Epic: Major obstacles testing multiple abilities"
    echo "   • Legendary: Nearly impossible, reserved for greatest heroes"
    echo ""
    echo "📜 THEODORE ROOSEVELT INSPIRATION:"
    echo '   "It is not the critic who counts; not the man who points out'
    echo '   how the strong man stumbles, or where the doer of deeds could'
    echo '   have done them better. The credit belongs to the man who is'
    echo '   actually in the arena, whose face is marred by dust and sweat'
    echo '   and blood; who strives valiantly; who errs, who comes short'
    echo '   again and again, because there is no effort without error and'
    echo '   shortcoming; but who does actually strive to do the deeds..."'
    echo ""
    echo "🎪 ARENA ATMOSPHERE:"
    echo "   • Golden arena circle with dramatic radial lighting"
    echo "   • Spotlight follows the current challenger"
    echo "   • Tension-building visual effects during challenges"
    echo "   • Victory celebrations with golden triumph lighting"
    echo "   • Somber but respectful atmosphere for noble defeats"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening the Arena of Trials..."
        open http://localhost:4000
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening the Arena of Trials..."
        xdg-open http://localhost:4000
    else
        echo "📱 Manually visit: http://localhost:4000"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $ARENA_PID"
    echo ""
    echo "🏟️ The arena awaits heroes willing to face their greatest challenges..."
    echo ""
    
    # Keep script running
    echo "🔄 Arena system running... Press Ctrl+C to stop"
    trap "echo ''; echo '🏟️ Closing the arena...'; kill $ARENA_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $ARENA_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Man in the Arena system stopped"
else
    echo "❌ Failed to launch Man in the Arena System"
    exit 1
fi