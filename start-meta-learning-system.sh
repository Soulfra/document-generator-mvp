#!/bin/bash

# 🧠 META-LEARNING SYSTEM STARTUP
# 
# This script starts all components of the meta-learning error prevention system
# in the correct order, ensuring everything is properly initialized.

echo "🧠 META-LEARNING SYSTEM STARTUP"
echo "==============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Function to start a service with logging
start_service() {
    local name=$1
    local script=$2
    local log_file="logs/${name}.log"
    
    echo -n "Starting ${name}..."
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Start the service in background with logging
    nohup node "$script" > "$log_file" 2>&1 &
    local pid=$!
    
    # Give it time to initialize
    sleep 2
    
    # Check if process is still running
    if ps -p $pid > /dev/null; then
        echo " ✅ (PID: $pid)"
        echo $pid > "logs/${name}.pid"
        return 0
    else
        echo " ❌ Failed to start"
        echo "Check logs at: $log_file"
        return 1
    fi
}

# Function to check if a service is already running
check_service() {
    local name=$1
    local pid_file="logs/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "⚠️  ${name} is already running (PID: $pid)"
            return 0
        fi
    fi
    return 1
}

echo "🔍 Checking existing services..."
echo ""

# Check for running services
services=(
    "meta-learning-error-system"
    "proactive-error-prevention" 
    "error-knowledge-vault"
    "claude-instruction-updater"
)

running_services=0
for service in "${services[@]}"; do
    if check_service "$service"; then
        ((running_services++))
    fi
done

if [ $running_services -gt 0 ]; then
    echo ""
    echo "Some services are already running. Stop them first with:"
    echo "./stop-meta-learning-system.sh"
    echo ""
    read -p "Stop running services and continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./stop-meta-learning-system.sh
        sleep 2
    else
        exit 0
    fi
fi

echo ""
echo "🚀 Starting Meta-Learning Components..."
echo ""

# Start services in order
echo "1️⃣ Meta-Learning Error System"
if ! start_service "meta-learning-error-system" "meta-learning-error-system.js"; then
    echo "❌ Failed to start Meta-Learning Error System"
    exit 1
fi

echo ""
echo "2️⃣ Error Knowledge Vault"
if ! start_service "error-knowledge-vault" "error-knowledge-vault.js"; then
    echo "❌ Failed to start Error Knowledge Vault"
    exit 1
fi

echo ""
echo "3️⃣ Proactive Error Prevention"
if ! start_service "proactive-error-prevention" "proactive-error-prevention.js"; then
    echo "❌ Failed to start Proactive Error Prevention"
    exit 1
fi

echo ""
echo "4️⃣ Claude Instruction Updater"
if ! start_service "claude-instruction-updater" "claude-instruction-updater.js"; then
    echo "❌ Failed to start Claude Instruction Updater"
    exit 1
fi

echo ""
echo "✅ All meta-learning services started successfully!"
echo ""
echo "📊 Service Status:"
echo "=================="

# Show running services
for service in "${services[@]}"; do
    pid_file="logs/${service}.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "✅ ${service}: Running (PID: $pid)"
        else
            echo "❌ ${service}: Not running"
        fi
    else
        echo "❌ ${service}: No PID file"
    fi
done

echo ""
echo "📋 Quick Commands:"
echo "=================="
echo "View logs:        tail -f logs/*.log"
echo "Check status:     ./check-meta-learning-status.sh"
echo "Stop services:    ./stop-meta-learning-system.sh"
echo "View dashboard:   http://localhost:9999/meta-learning"
echo ""
echo "🧠 The system is now learning from every error!"
echo "   - Errors are being tracked and analyzed"
echo "   - Patterns are being identified" 
echo "   - Prevention rules are being created"
echo "   - CLAUDE.md files are being updated"
echo ""
echo "Press Ctrl+C in any log window to see real-time learning in action."