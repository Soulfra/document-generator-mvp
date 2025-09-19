#!/bin/bash

# 🔄⚡ LAUNCH SYSTEM RESET & RECOVERY
# ===================================
# Start automatic overload detection and recovery

echo "🔄⚡ LAUNCHING SYSTEM RESET & RECOVERY ENGINE"
echo "============================================="

# Check if we're in emergency mode
if [ -f ".emergency-stop" ]; then
    echo "🚨 EMERGENCY STOP DETECTED"
    echo "Reading emergency status..."
    cat .emergency-stop
    echo ""
    echo "🔧 To clear emergency state, run:"
    echo "   rm .emergency-stop"
    echo "   ./launch-recovery-system.sh"
    exit 1
fi

# Check if system is isolated
if [ -f ".system-isolated" ]; then
    echo "🏝️ SYSTEM ISOLATION DETECTED"
    echo "Isolation timestamp: $(cat .system-isolated)"
    echo ""
    echo "🔧 To clear isolation, run:"
    echo "   rm .system-isolated"
    echo "   ./launch-recovery-system.sh"
    exit 1
fi

echo "🔍 Pre-flight system check..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "   ✅ Node.js available"

# Check system resources before starting
echo "📊 Current system status:"
echo "   CPU: $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo 'unknown')"
echo "   Memory: $(vm_stat | grep "Pages free" | awk '{print $3}' || echo 'unknown') pages free"
echo "   Node processes: $(ps aux | grep node | grep -v grep | wc -l | tr -d ' ')"

echo ""
echo "🚀 Starting System Reset & Recovery Engine..."
echo ""

# Start the recovery system
node system-reset-recovery.js

echo ""
echo "🔄 System Reset & Recovery Engine stopped"
echo ""

# Check if emergency files were created
if [ -f ".emergency-stop" ]; then
    echo "🚨 EMERGENCY STOP WAS TRIGGERED"
    echo "Check emergency-diagnostic-dump.json for details"
fi

if [ -f ".system-isolated" ]; then
    echo "🏝️ SYSTEM WAS ISOLATED"
    echo "Manual intervention may be required"
fi

if [ -f "system-recovery-state.json" ]; then
    echo "📊 Recovery state saved to system-recovery-state.json"
fi

echo "🔄 Recovery system shutdown complete"