#!/bin/bash

# Quick Asset Mining - Focused on key discoveries
PROJECT_DIR="/Users/matthewmauer/Desktop/Document-Generator"
EXTRACT_DIR="$PROJECT_DIR/extracted-ship-models"

mkdir -p "$EXTRACT_DIR/ship-models"
mkdir -p "$EXTRACT_DIR/blueprints"
mkdir -p "$EXTRACT_DIR/3d-assets"

echo "🏴‍☠️ Quick Asset Mining Started..."

# Mine key ShipRekt files
echo "⚓ Mining ShipRekt systems..."
cp shiprekt-charting-game-engine.js "$EXTRACT_DIR/ship-models/"
cp shiprekt-gaming-economy-scoring-tiers.js "$EXTRACT_DIR/ship-models/"
cp shiprekt-visual-interface-electron.js "$EXTRACT_DIR/ship-models/"
cp shiprekt-mobile-pwa.html "$EXTRACT_DIR/ship-models/"

# Mine 3D game files  
echo "🎮 Mining 3D game assets..."
cp actually-working-3d-game.html "$EXTRACT_DIR/3d-assets/"
cp unified-3d-game-experience.html "$EXTRACT_DIR/3d-assets/"
cp unified-3d-game-engine.js "$EXTRACT_DIR/3d-assets/"
cp 3d-game-server.js "$EXTRACT_DIR/3d-assets/"

# Mine component systems
echo "🔧 Mining component systems..."
find . -name "*component*" -path "*/shiprekt*" -exec cp {} "$EXTRACT_DIR/ship-models/" \; 2>/dev/null

# Mine vault key files
echo "🔐 Mining vault keys..."
if [ -d ".vault" ]; then
    find .vault -name "*.enc" -exec cp {} "$EXTRACT_DIR/blueprints/" \; 2>/dev/null
fi

# Mine layer systems
echo "📚 Mining layer systems..."
cp EXECUTE-11-LAYERS.js "$EXTRACT_DIR/ship-models/" 2>/dev/null
cp BASH-ALL-*-LAYERS.js "$EXTRACT_DIR/ship-models/" 2>/dev/null

echo "✅ Quick mining complete!"
echo "📁 Assets extracted to: $EXTRACT_DIR"

# Count results
ship_count=$(find "$EXTRACT_DIR/ship-models" -type f | wc -l)
game_count=$(find "$EXTRACT_DIR/3d-assets" -type f | wc -l)
blueprint_count=$(find "$EXTRACT_DIR/blueprints" -type f | wc -l)

echo "📊 Discovered:"
echo "   🚢 Ship assets: $ship_count"
echo "   🎮 3D game files: $game_count"  
echo "   📋 Blueprint files: $blueprint_count"