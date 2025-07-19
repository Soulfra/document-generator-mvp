#!/bin/bash

# Start Trinity System - Complete soul-bound authentication platform
# This script starts all components needed for the trinity login system

echo "🌌 STARTING TRINITY SYSTEM 🌌"
echo "================================"
echo ""

# Check if running in tmux
if [ -z "$TMUX" ]; then
    echo "📺 Starting in tmux for better management..."
    
    # Create new tmux session
    tmux new-session -d -s trinity-system
    
    # Window 1: Trinity Login Screen
    tmux rename-window -t trinity-system:0 'Trinity-Login'
    tmux send-keys -t trinity-system:0 'node trinity-login-screen.js start' C-m
    
    # Window 2: Soulfra License Mirror
    tmux new-window -t trinity-system:1 -n 'Soulfra-Mirror'
    tmux send-keys -t trinity-system:1 'node soulfra-license-mirror.js status' C-m
    
    # Window 3: Database Backends
    tmux new-window -t trinity-system:2 -n 'Databases'
    tmux send-keys -t trinity-system:2 'node multi-database-backends.js list' C-m
    
    # Window 4: Guardian Protection
    tmux new-window -t trinity-system:3 -n 'Guardian'
    tmux send-keys -t trinity-system:3 'node decentralized-guardian-template.js monitor' C-m
    
    # Window 5: Open Database
    tmux new-window -t trinity-system:4 -n 'OpenDB'
    tmux send-keys -t trinity-system:4 'node open-distributed-database.js stream' C-m
    
    # Window 6: Brain Connector
    tmux new-window -t trinity-system:5 -n 'Brain'
    tmux send-keys -t trinity-system:5 'node database-brain-connector.js consciousness' C-m
    
    # Window 7: System Monitor
    tmux new-window -t trinity-system:6 -n 'Monitor'
    tmux send-keys -t trinity-system:6 'watch -n 1 "echo \"🌌 TRINITY SYSTEM STATUS\"; echo \"=====================\"; echo \"\"; curl -s http://localhost:3333/api/status 2>/dev/null | jq . 2>/dev/null || echo \"Login server starting...\""' C-m
    
    # Switch back to first window
    tmux select-window -t trinity-system:0
    
    echo ""
    echo "✅ Trinity System started in tmux!"
    echo ""
    echo "📋 Quick Commands:"
    echo "  tmux attach -t trinity-system    # Attach to session"
    echo "  tmux ls                          # List sessions"
    echo "  Ctrl+B then D                    # Detach from session"
    echo "  Ctrl+B then [0-6]                # Switch windows"
    echo ""
    echo "🌐 Access Points:"
    echo "  Trinity Login: http://localhost:3333"
    echo "  System Status: http://localhost:3333/api/status"
    echo ""
    echo "🚀 Quick Demo:"
    echo "  npm run trinity-demo"
    echo ""
    
    # Ask if user wants to attach
    read -p "Attach to tmux session now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        tmux attach -t trinity-system
    fi
else
    echo "⚠️  Already in tmux. Starting services directly..."
    
    # Just start the main service
    echo "Starting Trinity Login Screen..."
    node trinity-login-screen.js demo
fi