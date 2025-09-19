#!/bin/bash

# 🛑 STOP META-LEARNING SYSTEM
# 
# Gracefully stops all meta-learning system components

echo "🛑 Stopping Meta-Learning System"
echo "================================"
echo ""

# Function to stop a service
stop_service() {
    local name=$1
    local pid_file="logs/${name}.pid"
    
    echo -n "Stopping ${name}..."
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            sleep 1
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid
            fi
            
            rm -f "$pid_file"
            echo " ✅ Stopped"
        else
            rm -f "$pid_file"
            echo " ⚠️  Was not running"
        fi
    else
        echo " ⚠️  No PID file found"
    fi
}

# Services to stop (in reverse order)
services=(
    "claude-instruction-updater"
    "proactive-error-prevention"
    "error-knowledge-vault"
    "meta-learning-error-system"
)

# Stop each service
for service in "${services[@]}"; do
    stop_service "$service"
done

echo ""
echo "✅ All meta-learning services stopped"
echo ""

# Check if any node processes are still running
remaining=$(pgrep -f "meta-learning|error-knowledge|proactive-error|claude-instruction" | wc -l)
if [ $remaining -gt 0 ]; then
    echo "⚠️  Warning: $remaining related processes still running"
    echo "   Run 'ps aux | grep node' to check"
fi