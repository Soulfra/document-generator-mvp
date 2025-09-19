#!/bin/bash

# 📊 FIVE-LAYER SYSTEM STATUS CHECKER
# ===================================
# Comprehensive status check for all five layers

echo "📊 FIVE-LAYER SYSTEM STATUS"
echo "==========================="
echo "Checking status of all layers..."
echo ""

# Function to check service health
check_service() {
    local name=$1
    local port=$2
    local pidfile=".reasoning-viz/logs/$name.pid"
    
    echo -n "🔍 $name (Port $port): "
    
    # Check if port is listening
    if lsof -i :$port > /dev/null 2>&1; then
        echo -n "✅ RUNNING"
        
        # Check PID file
        if [[ -f "$pidfile" ]]; then
            local pid=$(cat "$pidfile")
            if kill -0 "$pid" 2>/dev/null; then
                echo " (PID: $pid)"
            else
                echo " (PID file stale)"
            fi
        else
            echo " (No PID file)"
        fi
    else
        echo "❌ NOT RUNNING"
    fi
}

# Check all services
echo "🔍 SERVICE STATUS"
echo "================="
check_service "xml-stream-integration" "8091"
check_service "licensing-compliance" "8094"
check_service "meta-orchestrator" "8097"
check_service "gaming-engine" "8098"
echo ""

# Check WebSocket connectivity
echo "🌐 WEBSOCKET CONNECTIVITY"
echo "========================="

WEBSOCKETS=(
    "XML-Stream Integration:ws://localhost:8091/xml-integration"
    "Licensing Compliance:ws://localhost:8094/licensing-compliance"
    "Meta-Orchestrator:ws://localhost:8097/meta-handshake"
    "Gaming Engine:ws://localhost:8098/gaming-engine"
)

for ws in "${WEBSOCKETS[@]}"; do
    name=${ws%:*}
    url=${ws#*:}
    echo -n "🔌 $name: "
    
    # Use nc (netcat) to test connectivity
    port=$(echo $url | sed -n 's/.*:\([0-9]*\).*/\1/p')
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ CONNECTABLE"
    else
        echo "❌ UNREACHABLE"
    fi
done
echo ""

# Check log files
echo "📋 LOG FILE STATUS" 
echo "=================="
LOG_FILES=(
    "xml-stream-integration"
    "licensing-compliance"
    "meta-orchestrator"
    "gaming-engine"
)

for log in "${LOG_FILES[@]}"; do
    logfile=".reasoning-viz/logs/$log.log"
    echo -n "📄 $log.log: "
    
    if [[ -f "$logfile" ]]; then
        size=$(wc -l < "$logfile")
        recent=$(tail -1 "$logfile" 2>/dev/null || echo "No recent entries")
        echo "✅ EXISTS ($size lines)"
        echo "   Last entry: $recent"
    else
        echo "❌ MISSING"
    fi
done
echo ""

# Check system resources
echo "⚡ SYSTEM RESOURCES"
echo "=================="

# Memory usage
if command -v free > /dev/null; then
    echo "💾 Memory Usage:"
    free -h | head -2
elif command -v vm_stat > /dev/null; then
    echo "💾 Memory Usage (macOS):"
    vm_stat | head -5
fi
echo ""

# Disk space
echo "💽 Disk Usage (.reasoning-viz):"
if [[ -d ".reasoning-viz" ]]; then
    du -sh .reasoning-viz/* 2>/dev/null | sort -hr
else
    echo "   .reasoning-viz directory not found"
fi
echo ""

# Process information
echo "🔄 PROCESS INFORMATION"
echo "====================="
echo "Node.js processes:"
ps aux | grep -E '(xml-stream|licensing|meta-orchestrator|gaming-engine)' | grep -v grep || echo "   No relevant processes found"
echo ""

# Network connections
echo "🌐 NETWORK CONNECTIONS"
echo "======================"
echo "Active connections on ports 8091-8098:"
netstat -an 2>/dev/null | grep -E ':(809[1-8])' || lsof -i :8091-8098 2>/dev/null || echo "   No connections found"
echo ""

# Check for gaming world HTML
echo "🎮 GAMING WORLD STATUS"
echo "====================="
GAMING_HTML=".reasoning-viz/gaming-engine/gaming-xml-world.html"
if [[ -f "$GAMING_HTML" ]]; then
    echo "✅ Gaming world HTML available"
    echo "   File: $GAMING_HTML"
    size=$(wc -c < "$GAMING_HTML")
    echo "   Size: $size bytes"
    echo "   URL: file://$(pwd)/$GAMING_HTML"
else
    echo "❌ Gaming world HTML not found"
    echo "   Will be created when gaming engine starts"
fi
echo ""

# Architecture overview
echo "🏗️ ARCHITECTURE OVERVIEW" 
echo "========================"
echo "Layer 5: 🎮 Gaming Engine          (Port 8098) - High-performance 3D XML mapping"
echo "Layer 4: 🌐 Meta-Orchestrator      (Port 8097) - Distributed consensus governance"  
echo "Layer 3: 📜 Licensing Compliance   (Port 8094) - Creative Commons CC BY-SA 4.0"
echo "Layer 2: 🌉 XML-Stream Integration (Port 8091) - Bidirectional XML-stream sync"
echo "Layer 1: 🎯 Stream Visualization   (Static)     - Stream-safe tier visualization"
echo ""

# Quick health summary
echo "🎯 HEALTH SUMMARY"
echo "================="

PORTS=(8091 8094 8097 8098)
running_count=0
total_count=${#PORTS[@]}

for port in "${PORTS[@]}"; do
    if lsof -i :$port > /dev/null 2>&1; then
        ((running_count++))
    fi
done

if [[ $running_count -eq $total_count ]]; then
    echo "🟢 SYSTEM HEALTHY: All $total_count layers operational"
    echo "   The five-layer handshake architecture is fully active"
    echo "   Ready for high-performance XML processing and gaming integration"
elif [[ $running_count -gt 0 ]]; then
    echo "🟡 SYSTEM PARTIAL: $running_count/$total_count layers operational"
    echo "   Some layers may need restart or troubleshooting"
else
    echo "🔴 SYSTEM DOWN: No layers are operational"
    echo "   Run ./launch-five-layer-system.sh to start the system"
fi
echo ""

# Recommendations
echo "🛠️ MANAGEMENT COMMANDS"
echo "======================"
echo "Start system:    ./launch-five-layer-system.sh"
echo "Stop system:     ./stop-five-layer-system.sh"
echo "View logs:       tail -f .reasoning-viz/logs/*.log"
echo "Test gaming:     open file://$(pwd)/.reasoning-viz/gaming-engine/gaming-xml-world.html"
echo "Monitor real-time: watch -n 5 ./system-status.sh"