#!/bin/bash

# 🎮 Launch AI World Generator
# Command-driven game world creation and play

echo "🎮 Launching AI World Generator..."
echo "================================"
echo "🚀 Features:"
echo "✅ AI-powered world generation (maze, dungeon, town, forest)"
echo "✅ Command terminal interface"
echo "✅ Real gameplay (player, enemies, items, combat)"
echo "✅ Shareable world links"
echo "✅ Export for streaming/commercials"
echo "✅ Professional game quality"
echo "================================"
echo ""
echo "📋 Example Commands:"
echo "  generate maze 30x30 ancient_temple"
echo "  generate dungeon 25x25 crystal_caves"
echo "  generate town 40x40 medieval"
echo "  spawn enemies 15"
echo "  play"
echo "================================"
echo ""
echo "🎮 Game Controls:"
echo "  WASD/Arrows: Move player"
echo "  Space: Attack"
echo "  E: Use items"
echo "  R: Restart (if dead)"
echo "================================"

# Open in default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open ai-world-generator.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open ai-world-generator.html
else
    echo "Please open ai-world-generator.html in your browser"
fi

echo ""
echo "🎬 Ready for streaming and commercials!"
echo "🔗 Share worlds with generated links"
echo "🏆 Perfect for game jams and partnerships"
echo ""