#!/bin/bash
echo "🌐 Opening all dashboards..."

# Check if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:7777  # Dungeon Master
    open http://localhost:6666  # MCP Connector
    open "file://$(pwd)/LAYER-RIDER-PI.html"
    open "file://$(pwd)/3D-API-WORLD.html"
else
    echo "Manual URLs:"
    echo "http://localhost:7777"
    echo "http://localhost:6666"
    echo "file://$(pwd)/LAYER-RIDER-PI.html"
    echo "file://$(pwd)/3D-API-WORLD.html"
fi
