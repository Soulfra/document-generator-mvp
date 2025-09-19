#!/bin/bash

# 📦 Launch Isometric World Editor
# Habbo Hotel-style world builder with actual controls

echo "📦 Launching Isometric World Editor..."
echo "================================"
echo "Features:"
echo "✅ Click to place objects on isometric grid"
echo "✅ WASD/Arrows to pan, mouse wheel to zoom"
echo "✅ Drag documents to convert to objects"
echo "✅ Working exports (PNG, JSON, ASCII)"
echo "✅ Object palette with 6 types"
echo "✅ Properties panel for customization"
echo "================================"
echo ""
echo "Controls:"
echo "🖱️ Left Click: Place object"
echo "🖱️ Right Click + Drag: Pan view"
echo "⌨️ WASD/Arrows: Move camera"
echo "⌨️ R: Rotate selected object"
echo "⌨️ Delete: Remove selected object"
echo "⌨️ Space: Center view"
echo "⌨️ 1-6: Quick select object type"
echo "================================"

# Open in default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open isometric-world-editor.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open isometric-world-editor.html
else
    echo "Please open isometric-world-editor.html in your browser"
fi

echo ""
echo "🎮 Now with proper controls and placement!"
echo "📦 Everything works - no fake functions"
echo ""