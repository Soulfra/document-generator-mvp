#!/bin/bash

echo "🚀 LAUNCH LAYER - PRODUCTION DEPLOYMENT WITH SSH/TMUX MONITORING"
echo "=================================================="

# Create tmux session for production monitoring
tmux new-session -d -s document-generator-mvp

# Window 0: Main application
tmux rename-window -t document-generator-mvp:0 'main-app'
tmux send-keys -t document-generator-mvp:0 'npm start' C-m

# Window 1: System monitoring
tmux new-window -t document-generator-mvp:1 -n 'system-monitor'
tmux send-keys -t document-generator-mvp:1 'top -o cpu' C-m

# Window 2: Logs monitoring
tmux new-window -t document-generator-mvp:2 -n 'logs'
tmux send-keys -t document-generator-mvp:2 'tail -f *.log' C-m

# Window 3: Git operations
tmux new-window -t document-generator-mvp:3 -n 'git-ops'
tmux send-keys -t document-generator-mvp:3 'git status' C-m

# Window 4: Deploy commands
tmux new-window -t document-generator-mvp:4 -n 'deploy'
tmux send-keys -t document-generator-mvp:4 'echo "Deploy commands ready..."' C-m
tmux send-keys -t document-generator-mvp:4 'echo "railway up - for Railway deployment"' C-m
tmux send-keys -t document-generator-mvp:4 'echo "vercel --prod - for Vercel deployment"' C-m

# Window 5: Testing
tmux new-window -t document-generator-mvp:5 -n 'testing'
tmux send-keys -t document-generator-mvp:5 'echo "Testing environment ready..."' C-m

echo "✅ Tmux session 'document-generator-mvp' created with monitoring windows"
echo ""
echo "🔗 Access the session:"
echo "tmux attach-session -t document-generator-mvp"
echo ""
echo "📊 Windows available:"
echo "0: main-app     - Running the MVP"
echo "1: system-monitor - CPU/Memory monitoring"  
echo "2: logs         - Application logs"
echo "3: git-ops      - Git operations"
echo "4: deploy       - Deployment commands"
echo "5: testing      - Testing environment"
echo ""
echo "⌨️  Tmux shortcuts:"
echo "Ctrl+b, n - Next window"
echo "Ctrl+b, p - Previous window" 
echo "Ctrl+b, 0-5 - Jump to window number"
echo "Ctrl+b, d - Detach session"
echo ""

# Launch local development first
echo "🏃 Starting local development server..."
npm install > /dev/null 2>&1

# Check if we're already in a tmux session
if [ -z "$TMUX" ]; then
    echo "🚀 Launching tmux monitoring session..."
    tmux attach-session -t document-generator-mvp
else
    echo "⚠️  Already in tmux session. Run 'tmux attach-session -t document-generator-mvp' in a new terminal"
fi