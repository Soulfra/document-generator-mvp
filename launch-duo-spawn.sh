#!/bin/bash

# 🎮⚔️🔗 DUO SPAWNING LAUNCHER
# Quick launcher for the duo spawning system

echo "🎮⚔️🔗 DUO SPAWNING SYSTEM LAUNCHER"
echo "=================================="
echo ""
echo "This will spawn:"
echo "• 3 verification duos (scraper/validator pairs)"
echo "• 1 ledger pairing (primary/secondary databases)"
echo "• Cross-system monitoring and sync"
echo ""

# Check Python dependencies
echo "📋 Checking dependencies..."
python3 -c "import asyncio, sqlite3, json, secrets, subprocess, hashlib" 2>/dev/null || {
    echo "❌ Missing Python dependencies"
    echo "Installing required packages..."
    pip3 install --user requests beautifulsoup4 || {
        echo "⚠️ Some packages may need manual installation"
    }
}

# Check if we have the main script
if [ ! -f "spawn-duo-system.py" ]; then
    echo "❌ spawn-duo-system.py not found in current directory"
    exit 1
fi

echo "✅ Dependencies ready"
echo ""

# Launch the spawning system
echo "🚀 Launching duo spawning system..."
python3 spawn-duo-system.py

echo ""
echo "🎯 Spawning complete!"
echo ""
echo "📁 Check the 'spawned_systems' directory for:"
echo "   • duo_1/, duo_2/, duo_3/ - Verification duo pairs"
echo "   • master_ledger/ - Ledger pairing with sync"
echo "   • master_control.db - Central coordination"
echo ""
echo "🔄 To monitor all systems:"
echo "   python3 spawned_systems/system_monitor.py"
echo ""
echo "Happy duo slashing! ⚔️"