#!/bin/bash

# 🛑 FIVE-LAYER SYSTEM SHUTDOWN
# =============================
# Cleanly stops all five layers in reverse order

echo "🛑 FIVE-LAYER SYSTEM SHUTDOWN"
echo "============================="
echo "Stopping all layers gracefully..."
echo ""

# Function to stop a service
stop_service() {
    local name=$1
    local port=$2
    local pidfile=".reasoning-viz/logs/$name.pid"
    
    echo "🛑 Stopping Layer: $name (Port $port)"
    
    # Try to stop via PID file first
    if [[ -f "$pidfile" ]]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   📍 Found PID: $pid"
            
            # Send SIGTERM first (graceful shutdown)
            echo "   ⏳ Sending SIGTERM..."
            kill -TERM "$pid"
            
            # Wait up to 10 seconds for graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [[ $count -lt 10 ]]; do
                sleep 1
                ((count++))
                echo -n "."
            done
            echo ""
            
            # If still running, force kill
            if kill -0 "$pid" 2>/dev/null; then
                echo "   💀 Force killing with SIGKILL..."
                kill -KILL "$pid"
                sleep 1
            fi
            
            # Verify process is dead
            if kill -0 "$pid" 2>/dev/null; then
                echo "   ❌ Failed to stop process"
            else
                echo "   ✅ Process stopped"
            fi
        else
            echo "   ⚠️  PID file exists but process not running"
        fi
        
        # Remove PID file
        rm -f "$pidfile"
    else
        echo "   ⚠️  No PID file found"
    fi
    
    # Double-check by port
    if lsof -i :$port > /dev/null 2>&1; then
        echo "   🔍 Port still in use, finding process..."
        local port_pid=$(lsof -ti :$port)
        if [[ -n "$port_pid" ]]; then
            echo "   💀 Force killing process on port $port (PID: $port_pid)"
            kill -KILL "$port_pid"
        fi
    fi
    
    # Final verification
    if lsof -i :$port > /dev/null 2>&1; then
        echo "   ❌ Port $port still in use"
    else
        echo "   ✅ Port $port freed"
    fi
    
    echo ""
}

# Services to stop (in reverse order - top layer first)
SERVICES=(
    "gaming-engine:8098"
    "meta-orchestrator:8097"
    "licensing-compliance:8094"
    "xml-stream-integration:8091"
)

echo "🔄 Stopping layers in reverse order (Layer 5 → Layer 1)..."
echo ""

# Stop each service
for service in "${SERVICES[@]}"; do
    name=${service%:*}
    port=${service#*:}
    stop_service "$name" "$port"
done

# Clean up any remaining Node.js processes
echo "🧹 CLEANUP PHASE"
echo "================"
echo "🔍 Checking for remaining processes..."

# Find any remaining related processes
remaining_pids=$(ps aux | grep -E '(xml-stream|licensing|meta-orchestrator|gaming-engine)' | grep -v grep | awk '{print $2}' || true)

if [[ -n "$remaining_pids" ]]; then
    echo "⚠️  Found remaining processes: $remaining_pids"
    echo "💀 Force killing remaining processes..."
    
    for pid in $remaining_pids; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "   Killing PID: $pid"
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done
    
    sleep 2
    
    # Check again
    remaining_pids=$(ps aux | grep -E '(xml-stream|licensing|meta-orchestrator|gaming-engine)' | grep -v grep | awk '{print $2}' || true)
    if [[ -n "$remaining_pids" ]]; then
        echo "   ❌ Some processes still running: $remaining_pids"
    else
        echo "   ✅ All processes cleaned up"
    fi
else
    echo "✅ No remaining processes found"
fi
echo ""

# Clean up port usage
echo "🌐 PORT CLEANUP"
echo "==============="
PORTS=(8091 8094 8097 8098)

for port in "${PORTS[@]}"; do
    echo -n "🔍 Port $port: "
    if lsof -i :$port > /dev/null 2>&1; then
        echo "❌ Still in use"
        
        # Try to kill process using the port
        port_pid=$(lsof -ti :$port 2>/dev/null || true)
        if [[ -n "$port_pid" ]]; then
            echo "   💀 Killing process $port_pid using port $port"
            kill -KILL "$port_pid" 2>/dev/null || true
            sleep 1
            
            if lsof -i :$port > /dev/null 2>&1; then
                echo "   ❌ Port still in use after cleanup"
            else
                echo "   ✅ Port freed"
            fi
        fi
    else
        echo "✅ Free"
    fi
done
echo ""

# Log file management
echo "📋 LOG FILE MANAGEMENT"
echo "======================"
if [[ -d ".reasoning-viz/logs" ]]; then
    echo "📁 Log directory contents:"
    ls -la .reasoning-viz/logs/
    echo ""
    
    # Ask if user wants to archive logs
    echo "💾 Log file options:"
    echo "   1. Keep logs for debugging"
    echo "   2. Archive logs with timestamp"
    echo "   3. Delete all logs"
    echo ""
    
    # Default to keeping logs in automated shutdown
    if [[ "$1" == "--auto" ]]; then
        echo "🔄 Automated shutdown - keeping logs for debugging"
    else
        read -p "Choose option (1-3) [default: 1]: " log_choice
        
        case ${log_choice:-1} in
            2)
                timestamp=$(date +"%Y%m%d_%H%M%S")
                archive_dir=".reasoning-viz/logs_archive_$timestamp"
                echo "📦 Archiving logs to $archive_dir"
                mv .reasoning-viz/logs "$archive_dir"
                mkdir -p .reasoning-viz/logs
                echo "   ✅ Logs archived"
                ;;
            3)
                echo "🗑️  Deleting all logs..."
                rm -rf .reasoning-viz/logs/*
                echo "   ✅ Logs deleted"
                ;;
            *)
                echo "📋 Keeping logs in .reasoning-viz/logs/"
                ;;
        esac
    fi
else
    echo "⚠️  No log directory found"
fi
echo ""

# Final system verification
echo "🔍 FINAL VERIFICATION"
echo "===================="

# Check all ports are free
all_clear=true
for port in "${PORTS[@]}"; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo "❌ Port $port still in use"
        all_clear=false
    fi
done

# Check for processes
remaining_processes=$(ps aux | grep -E '(xml-stream|licensing|meta-orchestrator|gaming-engine)' | grep -v grep | wc -l)
if [[ $remaining_processes -gt 0 ]]; then
    echo "❌ $remaining_processes related processes still running"
    all_clear=false
fi

if [[ "$all_clear" == true ]]; then
    echo "🎉 SHUTDOWN COMPLETE"
    echo "==================="
    echo "✅ All five layers stopped successfully"
    echo "✅ All ports freed (8091, 8094, 8097, 8098)"
    echo "✅ No remaining processes detected"
    echo ""
    echo "🚀 To restart the system:"
    echo "   ./launch-five-layer-system.sh"
    echo ""
    echo "📊 To check system status:"
    echo "   ./system-status.sh"
else
    echo "⚠️ SHUTDOWN INCOMPLETE"
    echo "======================"
    echo "Some services or ports may still be active."
    echo "Check manually with:"
    echo "   lsof -i :8091-8098"
    echo "   ps aux | grep -E '(xml-stream|licensing|meta-orchestrator|gaming-engine)'"
    echo ""
    echo "🛠️ Manual cleanup commands:"
    echo "   sudo lsof -ti :8091-8098 | xargs kill -9"
    echo "   pkill -f 'xml-stream\\|licensing\\|meta-orchestrator\\|gaming-engine'"
fi

echo ""
echo "🎯 Five-layer system shutdown process complete."