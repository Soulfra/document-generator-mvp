#!/bin/bash

# UNIFIED OAUTH GITHUB SYSTEM LAUNCHER
# Starts both the unified auth server and OAuth-enabled GitHub wrapper

echo "🚀 Starting Unified OAuth GitHub System"
echo "====================================="

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux is not installed. Please install tmux first."
    echo "   On macOS: brew install tmux"
    echo "   On Ubuntu: sudo apt-get install tmux"
    exit 1
fi

# Kill any existing sessions
tmux kill-session -t oauth-github 2>/dev/null || true

# Create new tmux session
tmux new-session -d -s oauth-github -n auth-server

# Start unified auth server
tmux send-keys -t oauth-github:auth-server "echo '🔐 Starting Unified Auth Server...'" C-m
tmux send-keys -t oauth-github:auth-server "node unified-auth-server.js" C-m

# Create window for GitHub wrapper
tmux new-window -t oauth-github -n github-wrapper

# Wait a moment for auth server to start
tmux send-keys -t oauth-github:github-wrapper "echo '⏳ Waiting for auth server to start...'" C-m
tmux send-keys -t oauth-github:github-wrapper "sleep 3" C-m

# Start OAuth GitHub wrapper
tmux send-keys -t oauth-github:github-wrapper "echo '🐙 Starting OAuth GitHub Wrapper...'" C-m
tmux send-keys -t oauth-github:github-wrapper "node github-desktop-wrapper-oauth.js" C-m

# Create window for monitoring
tmux new-window -t oauth-github -n monitor

# Set up monitoring pane
tmux send-keys -t oauth-github:monitor "echo '📊 System Monitor'" C-m
tmux send-keys -t oauth-github:monitor "echo '================'" C-m
tmux send-keys -t oauth-github:monitor "echo ''" C-m
tmux send-keys -t oauth-github:monitor "echo 'Services:'" C-m
tmux send-keys -t oauth-github:monitor "echo '  Auth Server: http://localhost:3340'" C-m
tmux send-keys -t oauth-github:monitor "echo '  GitHub Desktop: http://localhost:3337'" C-m
tmux send-keys -t oauth-github:monitor "echo ''" C-m
tmux send-keys -t oauth-github:monitor "echo 'Quick Commands:'" C-m
tmux send-keys -t oauth-github:monitor "echo '  Ctrl+B then 0: Auth Server logs'" C-m
tmux send-keys -t oauth-github:monitor "echo '  Ctrl+B then 1: GitHub Wrapper logs'" C-m
tmux send-keys -t oauth-github:monitor "echo '  Ctrl+B then d: Detach from session'" C-m
tmux send-keys -t oauth-github:monitor "echo ''" C-m
tmux send-keys -t oauth-github:monitor "echo 'To stop all services: tmux kill-session -t oauth-github'" C-m

# Attach to session
echo ""
echo "✅ Services Started!"
echo ""
echo "🌐 Access Points:"
echo "   Auth Server: http://localhost:3340"
echo "   GitHub Desktop: http://localhost:3337"
echo ""
echo "📝 Setup Instructions:"
echo "   1. Visit http://localhost:3337"
echo "   2. Click 'Login with GitHub'"
echo "   3. Authorize the OAuth app on GitHub"
echo "   4. You're ready to use Git with OAuth!"
echo ""
echo "🔧 Session Management:"
echo "   View logs: tmux attach -t oauth-github"
echo "   Detach: Ctrl+B then d"
echo "   Stop all: tmux kill-session -t oauth-github"
echo ""
echo "Attaching to tmux session..."
echo ""

# Attach to the session
tmux attach-session -t oauth-github