#!/bin/bash
# Start tmux session for decentralized guardian monitoring

SESSION="decentralized-guardians"

# Kill existing session if it exists
tmux kill-session -t $SESSION 2>/dev/null

# Create new session
tmux new-session -d -s $SESSION

# Window 1: Guardian Monitor
tmux rename-window -t $SESSION:0 "guardian-monitor"
tmux send-keys -t $SESSION:0 "watch -n 1 'node guardian-layers.js status'" C-m

# Window 2: Payment Flow
tmux new-window -t $SESSION:1 -n "payment-flow"
tmux send-keys -t $SESSION:1 "touch payment-logs.json && tail -f payment-logs.json" C-m

# Window 3: Live Updates
tmux new-window -t $SESSION:2 -n "live-updates"
tmux send-keys -t $SESSION:2 "node decentralized-guardian-template.js monitor" C-m

# Window 4: Ralph Watch
tmux new-window -t $SESSION:3 -n "ralph-watch"
tmux send-keys -t $SESSION:3 "while true; do node guardian-layers.js ralph-test; sleep 30; done" C-m

# Window 5: Config Watch
tmux new-window -t $SESSION:4 -n "config-watch"
tmux send-keys -t $SESSION:4 "watch -n 1 'cat guardian-config.json | jq .templates'" C-m

# Window 6: Contract Status
tmux new-window -t $SESSION:5 -n "contracts"
tmux send-keys -t $SESSION:5 "node decentralized-guardian-template.js status" C-m

# Set layout for main window
tmux select-window -t $SESSION:2
tmux select-layout -t $SESSION tiled

# Attach to session
echo "🖥️ Attaching to tmux session: $SESSION"
echo "Use 'Ctrl+B' then 'n' to switch windows"
echo "Use 'Ctrl+B' then 'd' to detach"
tmux attach-session -t $SESSION