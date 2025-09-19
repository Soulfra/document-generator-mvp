#!/bin/bash

# 🌍 Launch Closed Loop Terrain Generator
# Single file, no dependencies except CDN-loaded Three.js

echo "🌍 Launching Closed Loop Terrain Generator..."
echo "================================"
echo "Features:"
echo "✅ Drop any document to see it as 3D terrain"
echo "✅ Geographic height maps (Kickapoo Valley & Sapri, Italy)"
echo "✅ Multi-mesh shader effects"
echo "✅ Export animated GIFs for terminal"
echo "✅ Schema & indentation monitoring"
echo "================================"

# Open in default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open closed-loop-generator.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open closed-loop-generator.html
else
    echo "Please open closed-loop-generator.html in your browser"
fi

echo ""
echo "🎯 Everything runs in a single screen!"
echo "🎁 Condensed into one gift box as requested"
echo ""