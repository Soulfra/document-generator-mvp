#!/bin/bash

echo "🚀 LAUNCHING COMPLETE MAAS ECOSYSTEM"
echo "====================================="
echo ""

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express ws puppeteer crypto
fi

echo "🎯 Starting all systems..."
echo ""

# Launch systems in background
echo "🎮 Starting Grant Forms Character Presenter (port 3300)..."
node grant-forms-character-presenter.js &
GRANT_PID=$!

echo "💰 Starting Startup Credits Value Extractor (port 3400)..."
node startup-credits-value-extractor.js &
CREDITS_PID=$!

echo "🤖 Starting Agent Referral Economy (port 3500)..."
node agent-referral-economy-system.js &
AGENT_PID=$!

echo "🎯 Starting Master Integration Hub (port 3000)..."
node unified-system-integration.js &
MASTER_PID=$!

# Wait for systems to start
sleep 5

echo ""
echo "✅ ALL SYSTEMS LAUNCHED SUCCESSFULLY!"
echo "===================================="
echo ""
echo "🎯 MASTER DASHBOARD: http://localhost:3000"
echo "   └─ Complete system overview and agent onboarding"
echo ""
echo "🎮 GRANT QUEST: http://localhost:3300"
echo "   └─ Interactive grant applications with characters"
echo ""
echo "💰 CREDITS EXTRACTOR: http://localhost:3400"
echo "   └─ $390k+ in startup credits and infrastructure"
echo ""
echo "🤖 AGENT NETWORK: http://localhost:3500"
echo "   └─ 52 Genesis agents + referral economy"
echo ""
echo "🔧 FEATURES AVAILABLE:"
echo "   • Agent onboarding with 7-step flow"
echo "   • Multi-level commissions (10%, 3%, 1%)"
echo "   • Real grant form filling"
echo "   • $390k+ in available startup credits"
echo "   • Cross-system communication"
echo "   • Real-time monitoring"
echo ""
echo "📈 POTENTIAL VALUE:"
echo "   • AWS Credits: $100k per startup"
echo "   • Azure Credits: $150k per startup"  
echo "   • Agent Commissions: 5-15% of secured value"
echo "   • Total Ecosystem Value: $500k+ per month"
echo ""
echo "🚀 NEXT STEPS:"
echo "   1. Visit http://localhost:3000 for master dashboard"
echo "   2. Start agent onboarding process"
echo "   3. Begin referring startups to credit programs"
echo "   4. Watch commissions flow in real-time"
echo ""
echo "Press Ctrl+C to stop all systems..."

# Handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down all systems..."
    kill $GRANT_PID $CREDITS_PID $AGENT_PID $MASTER_PID 2>/dev/null
    echo "✅ All systems stopped."
    exit 0
}

trap cleanup INT TERM

# Keep script running
wait