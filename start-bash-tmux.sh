#!/bin/bash

# BASH SYSTEM TMUX SETUP
# Launches the complete system in organized tmux sessions

echo "🔥 STARTING BASH SYSTEM WITH TMUX 🔥"
echo "Launching all components in organized tmux sessions..."

# Kill any existing bash-system session
tmux kill-session -t bash-system 2>/dev/null

# Create new tmux session
tmux new-session -d -s bash-system -n "Dashboard"

# Window 0: Main Dashboard (localhost interface)
tmux send-keys -t bash-system:Dashboard "echo '🌐 Starting Bash Localhost Interface...'" Enter
tmux send-keys -t bash-system:Dashboard "npm run localhost" Enter

# Window 1: System Monitor
tmux new-window -t bash-system -n "Monitor"
tmux send-keys -t bash-system:Monitor "echo '📊 System monitoring active...'" Enter
tmux send-keys -t bash-system:Monitor "while true; do echo '⏰ System check at \$(date)'; npm run bash-status 2>/dev/null || echo 'Services starting...'; sleep 10; done" Enter

# Window 2: Ralph Zone (dangerous!)
tmux new-window -t bash-system -n "Ralph"
tmux send-keys -t bash-system:Ralph "echo '🔥 RALPH ZONE - BASH WITH CAUTION! 🔥'" Enter
tmux send-keys -t bash-system:Ralph "echo 'Commands:'" Enter
tmux send-keys -t bash-system:Ralph "echo '  npm run ralph          - Basic Ralph test'" Enter
tmux send-keys -t bash-system:Ralph "echo '  npm run crash-ralph    - Crash simulation'" Enter
tmux send-keys -t bash-system:Ralph "echo '  npm run ralph-infinite - INFINITE CHAOS'" Enter
tmux send-keys -t bash-system:Ralph "echo ''" Enter
tmux send-keys -t bash-system:Ralph "echo 'Ralph says: READY TO BASH EVERYTHING!'" Enter

# Window 3: Charlie Protection
tmux new-window -t bash-system -n "Charlie"
tmux send-keys -t bash-system:Charlie "echo '🛡️ CHARLIE GUARDIAN ZONE 🛡️'" Enter
tmux send-keys -t bash-system:Charlie "echo 'Commands:'" Enter
tmux send-keys -t bash-system:Charlie "echo '  npm run guardian       - Activate protection'" Enter
tmux send-keys -t bash-system:Charlie "echo '  npm run pentest        - Security testing'" Enter
tmux send-keys -t bash-system:Charlie "echo '  npm run guardian-template - Template protection'" Enter
tmux send-keys -t bash-system:Charlie "echo ''" Enter
tmux send-keys -t bash-system:Charlie "echo 'Charlie says: All systems protected from Ralph chaos.'" Enter

# Window 4: Trinity & Systems
tmux new-window -t bash-system -n "Systems"
tmux send-keys -t bash-system:Systems "echo '🌌 SYSTEM OPERATIONS 🌌'" Enter
tmux send-keys -t bash-system:Systems "echo 'Available systems:'" Enter
tmux send-keys -t bash-system:Systems "echo '  npm run trinity-demo    - Trinity authentication'" Enter
tmux send-keys -t bash-system:Systems "echo '  npm run shadow         - Shadow testing'" Enter
tmux send-keys -t bash-system:Systems "echo '  npm run templates      - Template actions'" Enter
tmux send-keys -t bash-system:Systems "echo '  npm run mirror-git     - Quantum operations'" Enter
tmux send-keys -t bash-system:Systems "echo '  npm run remote         - Remote crash mapping'" Enter
tmux send-keys -t bash-system:Systems "echo '  npm run ultimate-demo  - ULTIMATE MODE'" Enter

# Window 5: Development
tmux new-window -t bash-system -n "Dev"
tmux send-keys -t bash-system:Dev "echo '💻 DEVELOPMENT ZONE 💻'" Enter
tmux send-keys -t bash-system:Dev "echo 'Quick development commands:'" Enter
tmux send-keys -t bash-system:Dev "echo '  ls *.js                 - List all system files'" Enter
tmux send-keys -t bash-system:Dev "echo '  npm run demo           - Complete system demo'" Enter
tmux send-keys -t bash-system:Dev "echo '  npm run bash-clean     - Clean temporary files'" Enter
tmux send-keys -t bash-system:Dev "echo '  node <file>.js         - Run any system file'" Enter
tmux send-keys -t bash-system:Dev "echo ''" Enter
tmux send-keys -t bash-system:Dev "echo 'Ready for development!'" Enter

# Go back to Dashboard window
tmux select-window -t bash-system:Dashboard

# Split Dashboard window to show quick info
tmux split-window -t bash-system:Dashboard -h
tmux send-keys -t bash-system:Dashboard.1 "echo '🎯 QUICK ACCESS GUIDE'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '==================='" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo ''" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '🌐 Web Interface:'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '   http://localhost:3333'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo ''" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '⚡ Quick Commands:'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '   Ctrl+B then 1 = Ralph Zone'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '   Ctrl+B then 2 = Charlie Zone'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '   Ctrl+B then 3 = Systems'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '   Ctrl+B then 4 = Development'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo ''" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo '🔥 Ready to bash forward!'" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo ''" Enter
tmux send-keys -t bash-system:Dashboard.1 "echo 'Type commands in any pane...'" Enter

# Resize panes
tmux resize-pane -t bash-system:Dashboard.0 -x 60%

echo ""
echo "🎉 TMUX BASH SYSTEM READY! 🎉"
echo ""
echo "📋 Windows created:"
echo "  0. Dashboard  - Main web interface (localhost:3333)"
echo "  1. Monitor    - System monitoring"  
echo "  2. Ralph      - Ralph chaos zone (dangerous!)"
echo "  3. Charlie    - Charlie protection zone"
echo "  4. Systems    - Trinity, Shadow, Templates, etc."
echo "  5. Dev        - Development and testing"
echo ""
echo "🔗 Quick access:"
echo "  tmux attach-session -t bash-system"
echo "  OR just run: ./tmux-bash.sh"
echo ""
echo "🌐 Web Interface: http://localhost:3333"
echo "⚡ WebSocket Terminal: ws://localhost:3334"
echo ""
echo "🎯 Navigation:"
echo "  Ctrl+B then <window-number> - Switch windows"
echo "  Ctrl+B then d - Detach session"
echo "  Ctrl+B then [ - Scroll mode"
echo ""
echo "Ready to bash everything! 🚀"

# Auto-attach to session
tmux attach-session -t bash-system