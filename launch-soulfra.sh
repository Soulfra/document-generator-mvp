#!/bin/bash

# Quick launcher for SoulFRA Personal OS
echo "🚀 Launching SoulFRA Personal OS..."

# Check if we're in the right directory
if [ ! -f "soulfra-os-startup.sh" ]; then
    echo "❌ Please run this from the Document-Generator directory"
    exit 1
fi

# Run the main startup script
./soulfra-os-startup.sh

echo "✅ SoulFRA Personal OS launched!"