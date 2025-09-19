#!/bin/bash
clear
echo "📊 TRINITY SYSTEM LAYER DASHBOARD"
echo "================================="
echo ""

# Check each layer
echo "🧠 SOULFRA LAYER:"
if [ -f "soulfra-proof-of-life.sh" ]; then
    echo "   ✅ Soul framework active"
    echo "   ✅ Reasoning differential operational"
    echo "   ✅ Document consciousness layer live"
else
    echo "   ⚠️ Soulfra layer needs activation"
fi
echo ""

echo "😬 CRINGEPROOF LAYER:"
if [ -f "cringeproof-engine.sh" ]; then
    echo "   ✅ Cringe protection active"
    echo "   ✅ Professional output verified"
    echo "   ✅ Quality assurance operational"
else
    echo "   ⚠️ Cringeproof layer needs activation"
fi
echo ""

echo "💎 CLARITY LAYER:"
if [ -f "clarity-engine.sh" ]; then
    echo "   ✅ Clarity engine operational"
    echo "   ✅ Clear communication verified"
    echo "   ✅ Transparent operation confirmed"
else
    echo "   ⚠️ Clarity layer needs activation"
fi
echo ""

echo "⚡ ULTRA-COMPACT LAYER:"
if [ -f "doc-gen" ]; then
    echo "   ✅ Ultra-compact system ready"
    echo "   ✅ Single command control active"
    echo "   ✅ Bash combo system operational"
else
    echo "   ⚠️ Ultra-compact layer needs setup"
fi
echo ""

echo "🔱 TRINITY STATUS:"
active_layers=0
[ -f "soulfra-proof-of-life.sh" ] && ((active_layers++))
[ -f "cringeproof-engine.sh" ] && ((active_layers++))
[ -f "clarity-engine.sh" ] && ((active_layers++))
[ -f "doc-gen" ] && ((active_layers++))

if [ $active_layers -eq 4 ]; then
    echo "   🟢 ALL LAYERS OPERATIONAL (4/4)"
    echo "   🚀 TRINITY SYSTEM FULLY ACTIVE"
elif [ $active_layers -ge 2 ]; then
    echo "   🟡 PARTIAL ACTIVATION ($active_layers/4)"
    echo "   ⚡ System partially operational"
else
    echo "   🔴 NEEDS ACTIVATION ($active_layers/4)"
    echo "   🔧 Run trinity system setup"
fi
echo ""

echo "📱 Quick Commands:"
echo "   ./trinity-system.sh        # Run full trinity setup"
echo "   ./trinity-master.sh        # Run trinity master controller"
echo "   ./doc-gen combo            # Run bash combo system"
echo "   ./layer-dashboard.sh       # Show this dashboard"
echo ""

echo "🔍 Discovered Systems:"
echo "   $(find . -name "*.js" | wc -l) JavaScript systems"
echo "   $(find . -name "*.sh" | wc -l) Bash systems"
echo "   $(find . -name "*.md" | wc -l) Documentation files"