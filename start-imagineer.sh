#!/bin/bash

# IMAGINEER KEYBIND SYSTEM LAUNCHER
# The magical kingdom awaits!

clear

echo "🏰 Welcome to the Imagineer Keybind System! 🏰"
echo ""
echo "Loading magical components..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js and try again."
    exit 1
fi

# Launch the Imagineer system
echo "✨ Starting magical keyboard transformation..."
sleep 1

node /Users/matthewmauer/Desktop/Document-Generator/IMAGINEER-KEYBIND-SYSTEM.js

echo ""
echo "👋 Thanks for visiting the magical kingdom!"