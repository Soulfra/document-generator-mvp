#!/bin/bash

# 🚀 AI TRUST SYSTEM - TMUX TUNNEL ORCHESTRATOR
# ============================================
# Advanced deployment with tmux sessions, SSH tunnels, and cave crawlers

set -e

# Configuration
REMOTE_HOST=${1:-"your-server.com"}
REMOTE_USER=${2:-"root"}
REMOTE_PORT=${3:-"22"}
LOCAL_MONITOR_PORT=${4:-"8888"}
TMUX_SESSION="ai-trust-orchestrator"
PACKAGE_NAME="ai-trust-system-*.tar.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🌐 AI TRUST SYSTEM - TMUX TUNNEL ORCHESTRATOR${NC}"
echo "================================================"
echo ""

# Function to create SSH tunnel configuration
create_tunnel_config() {
    cat > ssh-tunnel-config.sh << 'EOF'
#!/bin/bash
# SSH Tunnel Configuration for AI Trust System

# Create persistent SSH tunnel with auto-reconnect
create_tunnel() {
    local LOCAL_PORT=$1
    local REMOTE_HOST=$2
    local REMOTE_PORT=$3
    local TUNNEL_NAME=$4
    
    while true; do
        echo "[$(date)] Establishing $TUNNEL_NAME tunnel..."
        ssh -N -L $LOCAL_PORT:localhost:$REMOTE_PORT \
            -o ServerAliveInterval=60 \
            -o ServerAliveCountMax=3 \
            -o ExitOnForwardFailure=yes \
            -o TCPKeepAlive=yes \
            $REMOTE_USER@$REMOTE_HOST
        
        echo "[$(date)] $TUNNEL_NAME tunnel disconnected. Reconnecting in 5 seconds..."
        sleep 5
    done
}

# Start all tunnels
create_tunnel 6666 $REMOTE_HOST 6666 "API" &
create_tunnel 6667 $REMOTE_HOST 6667 "WebSocket" &
create_tunnel 8080 $REMOTE_HOST 80 "Web" &
create_tunnel 5432 $REMOTE_HOST 5432 "Database" &

wait
EOF
    chmod +x ssh-tunnel-config.sh
}

# Function to create tmux orchestration script
create_tmux_orchestrator() {
    cat > tmux-orchestrator.sh << 'EOF'
#!/bin/bash
# TMUX Orchestration for AI Trust System

TMUX_SESSION="ai-trust-orchestrator"

# Kill existing session if exists
tmux kill-session -t $TMUX_SESSION 2>/dev/null || true

# Create new tmux session
tmux new-session -d -s $TMUX_SESSION -n "control"

# Window 1: Control Panel
tmux send-keys -t $TMUX_SESSION:control "echo '🎮 AI TRUST CONTROL PANEL'" C-m
tmux send-keys -t $TMUX_SESSION:control "echo '====================='" C-m
tmux send-keys -t $TMUX_SESSION:control "echo 'Commands:'" C-m
tmux send-keys -t $TMUX_SESSION:control "echo '  - Ctrl+b 1-6: Switch windows'" C-m
tmux send-keys -t $TMUX_SESSION:control "echo '  - Ctrl+b d: Detach'" C-m
tmux send-keys -t $TMUX_SESSION:control "echo '  - Ctrl+b ?: Help'" C-m

# Window 2: SSH Tunnels
tmux new-window -t $TMUX_SESSION -n "tunnels"
tmux send-keys -t $TMUX_SESSION:tunnels "./ssh-tunnel-config.sh" C-m

# Window 3: Remote System
tmux new-window -t $TMUX_SESSION -n "remote"
tmux send-keys -t $TMUX_SESSION:remote "ssh $REMOTE_USER@$REMOTE_HOST" C-m
sleep 2
tmux send-keys -t $TMUX_SESSION:remote "cd ai-trust-deployment && pm2 monit" C-m

# Window 4: Local Monitor
tmux new-window -t $TMUX_SESSION -n "monitor"
tmux send-keys -t $TMUX_SESSION:monitor "./cave-crawler-monitor.sh" C-m

# Window 5: Log Aggregator
tmux new-window -t $TMUX_SESSION -n "logs"
tmux send-keys -t $TMUX_SESSION:logs "tail -f logs/*.log" C-m

# Window 6: Performance Metrics
tmux new-window -t $TMUX_SESSION -n "metrics"
tmux send-keys -t $TMUX_SESSION:metrics "./performance-monitor.sh" C-m

# Set default window
tmux select-window -t $TMUX_SESSION:control

# Split control window for status displays
tmux split-window -h -t $TMUX_SESSION:control
tmux send-keys -t $TMUX_SESSION:control.1 "watch -n 1 'curl -s localhost:6666/trust-status | jq .'" C-m

tmux split-window -v -t $TMUX_SESSION:control.0
tmux send-keys -t $TMUX_SESSION:control.2 "htop" C-m

echo "✅ TMUX session '$TMUX_SESSION' created"
echo ""
echo "📺 To attach: tmux attach -t $TMUX_SESSION"
echo "🔌 To detach: Ctrl+b d"
echo "📊 To see all sessions: tmux ls"
EOF
    chmod +x tmux-orchestrator.sh
}

# Function to create cave crawler monitor
create_cave_crawler() {
    cat > cave-crawler-monitor.sh << 'EOF'
#!/bin/bash
# 🕷️ CAVE CRAWLER - Deep System Monitor

echo "🕷️ CAVE CRAWLER ACTIVATED"
echo "========================"
echo "Crawling through system tunnels..."
echo ""

# Function to crawl API endpoints
crawl_api() {
    echo "🔍 Crawling API endpoints..."
    
    endpoints=(
        "http://localhost:6666/trust-status"
        "http://localhost:6666/health"
        "http://localhost:8080/"
        "ws://localhost:6667"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo -n "  Checking $endpoint... "
        if curl -s -o /dev/null -w "%{http_code}" "$endpoint" | grep -q "200\|101"; then
            echo "✅ ALIVE"
        else
            echo "❌ DEAD"
        fi
    done
}

# Function to monitor WebSocket activity
monitor_websocket() {
    echo ""
    echo "📡 WebSocket Activity Monitor"
    echo "----------------------------"
    
    # Use websocat or wscat if available
    if command -v websocat &> /dev/null; then
        echo "Connecting to WebSocket..."
        timeout 10 websocat ws://localhost:6667 &
    else
        echo "Install websocat for WebSocket monitoring: brew install websocat"
    fi
}

# Function to check tunnel health
check_tunnels() {
    echo ""
    echo "🚇 Tunnel Health Check"
    echo "--------------------"
    
    local ports=(6666 6667 8080 5432)
    for port in "${ports[@]}"; do
        if lsof -i :$port | grep -q LISTEN; then
            echo "  Port $port: ✅ Tunnel Active"
        else
            echo "  Port $port: ❌ Tunnel Down"
        fi
    done
}

# Function to analyze trust patterns
analyze_trust() {
    echo ""
    echo "🧠 Trust Pattern Analysis"
    echo "-----------------------"
    
    local status=$(curl -s http://localhost:6666/trust-status 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "$status" | jq -r '
            "Total Handshakes: \(.totalHandshakes // 0)",
            "Average Trust: \(.averageTrustLevel // 0)",
            "Active Sessions: \(.activeSessions // 0)"
        ' 2>/dev/null || echo "  No data available"
    else
        echo "  Trust system offline"
    fi
}

# Main monitoring loop
while true; do
    clear
    echo "🕷️ CAVE CRAWLER - $(date)"
    echo "================================"
    
    crawl_api
    check_tunnels
    analyze_trust
    
    echo ""
    echo "🔄 Refreshing in 5 seconds... (Ctrl+C to exit)"
    sleep 5
done
EOF
    chmod +x cave-crawler-monitor.sh
}

# Function to create performance monitor
create_performance_monitor() {
    cat > performance-monitor.sh << 'EOF'
#!/bin/bash
# 📊 Performance Monitor for AI Trust System

echo "📊 PERFORMANCE MONITOR"
echo "===================="

# Function to get system metrics
get_metrics() {
    echo "🖥️  System Metrics"
    echo "----------------"
    
    # CPU usage
    echo -n "CPU: "
    top -l 1 | grep "CPU usage" | awk '{print $3 " " $4 " " $5}' 2>/dev/null || echo "N/A"
    
    # Memory usage
    echo -n "Memory: "
    vm_stat | grep "Pages free" | awk '{print $3}' 2>/dev/null || echo "N/A"
    
    # Network connections
    echo -n "Active Connections: "
    netstat -an | grep -E "6666|6667|8080" | wc -l
    
    # Process info
    echo ""
    echo "🔄 Process Status"
    echo "----------------"
    ps aux | grep -E "node|pm2" | grep -v grep | awk '{print $11 " - CPU: " $3 "% MEM: " $4 "%"}' | head -5
}

# Function to monitor latency
monitor_latency() {
    echo ""
    echo "⚡ Latency Monitor"
    echo "-----------------"
    
    # API latency
    start=$(date +%s.%N)
    curl -s http://localhost:6666/trust-status > /dev/null 2>&1
    end=$(date +%s.%N)
    latency=$(echo "$end - $start" | bc 2>/dev/null || echo "0")
    echo "API Latency: ${latency}s"
    
    # WebSocket ping
    echo "WebSocket: Testing..."
}

# Main loop
while true; do
    clear
    echo "📊 PERFORMANCE MONITOR - $(date)"
    echo "======================================"
    
    get_metrics
    monitor_latency
    
    echo ""
    echo "🔄 Updating every 2 seconds..."
    sleep 2
done
EOF
    chmod +x performance-monitor.sh
}

# Function to create orchestration manager
create_orchestration_manager() {
    cat > orchestration-manager.sh << 'EOF'
#!/bin/bash
# 🎭 ORCHESTRATION MANAGER

REMOTE_HOST="$1"
REMOTE_USER="$2"

echo "🎭 AI TRUST ORCHESTRATION MANAGER"
echo "================================"

# Menu function
show_menu() {
    echo ""
    echo "Select Operation:"
    echo "1) 🚀 Full Deploy (Package + Remote Setup)"
    echo "2) 🚇 Start Tunnels Only"
    echo "3) 📺 Attach to TMUX Session"
    echo "4) 🕷️  Start Cave Crawler"
    echo "5) 📊 View Performance Metrics"
    echo "6) 🔄 Restart All Services"
    echo "7) 🛑 Stop Everything"
    echo "8) 📝 View Logs"
    echo "9) 🔧 Advanced Options"
    echo "0) Exit"
    echo ""
    read -p "Choice: " choice
    
    case $choice in
        1) full_deploy ;;
        2) start_tunnels ;;
        3) tmux attach -t ai-trust-orchestrator ;;
        4) ./cave-crawler-monitor.sh ;;
        5) ./performance-monitor.sh ;;
        6) restart_all ;;
        7) stop_all ;;
        8) view_logs ;;
        9) advanced_menu ;;
        0) exit 0 ;;
        *) echo "Invalid choice" ;;
    esac
}

# Full deployment function
full_deploy() {
    echo "🚀 Starting Full Deployment..."
    
    # Upload package
    echo "📤 Uploading package..."
    scp ai-trust-system-*.tar.gz $REMOTE_USER@$REMOTE_HOST:~/
    
    # Remote setup
    echo "🔧 Running remote setup..."
    ssh $REMOTE_USER@$REMOTE_HOST << 'REMOTE_EOF'
        tar -xzf ai-trust-system-*.tar.gz
        cd ai-trust-deployment
        ./setup-remote.sh
REMOTE_EOF
    
    # Start local orchestration
    echo "🎭 Starting local orchestration..."
    ./tmux-orchestrator.sh
}

# Start tunnels
start_tunnels() {
    echo "🚇 Starting SSH tunnels..."
    tmux new-window -t ai-trust-orchestrator -n "tunnels-manual"
    tmux send-keys -t ai-trust-orchestrator:tunnels-manual "./ssh-tunnel-config.sh" C-m
}

# Restart all services
restart_all() {
    echo "🔄 Restarting all services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd ai-trust-deployment && pm2 restart all"
    tmux kill-session -t ai-trust-orchestrator 2>/dev/null
    ./tmux-orchestrator.sh
}

# Stop everything
stop_all() {
    echo "🛑 Stopping all services..."
    tmux kill-session -t ai-trust-orchestrator 2>/dev/null
    pkill -f ssh-tunnel-config.sh
    ssh $REMOTE_USER@$REMOTE_HOST "pm2 stop all" 2>/dev/null
    echo "✅ All services stopped"
}

# View logs
view_logs() {
    echo "📝 Select log type:"
    echo "1) Remote PM2 logs"
    echo "2) Local tunnel logs"
    echo "3) Cave crawler logs"
    echo "4) All logs"
    read -p "Choice: " log_choice
    
    case $log_choice in
        1) ssh $REMOTE_USER@$REMOTE_HOST "pm2 logs" ;;
        2) tail -f tunnel-*.log ;;
        3) tail -f cave-crawler.log ;;
        4) tmux attach -t ai-trust-orchestrator \; select-window -t logs ;;
    esac
}

# Advanced menu
advanced_menu() {
    echo "🔧 Advanced Options:"
    echo "1) Database backup"
    echo "2) Security audit"
    echo "3) Performance tuning"
    echo "4) Network diagnostics"
    echo "5) Container management"
    read -p "Choice: " adv_choice
    
    case $adv_choice in
        1) backup_database ;;
        2) security_audit ;;
        3) performance_tune ;;
        4) network_diagnostics ;;
        5) container_management ;;
    esac
}

# Main loop
while true; do
    show_menu
done
EOF
    chmod +x orchestration-manager.sh
}

# Function to create the master control script
create_master_control() {
    cat > ai-trust-master-control.sh << 'EOF'
#!/bin/bash
# 🎯 AI TRUST MASTER CONTROL

echo "🎯 AI TRUST SYSTEM - MASTER CONTROL"
echo "==================================="
echo ""

# Quick status check
quick_status() {
    echo "📊 Quick Status Check"
    echo "-------------------"
    
    # Check if tmux session exists
    if tmux has-session -t ai-trust-orchestrator 2>/dev/null; then
        echo "✅ TMUX Session: Active"
    else
        echo "❌ TMUX Session: Not running"
    fi
    
    # Check tunnels
    local tunnel_count=$(ps aux | grep -c "[s]sh.*-L.*6666\|6667\|8080")
    echo "🚇 Active Tunnels: $tunnel_count"
    
    # Check local services
    if curl -s http://localhost:6666/trust-status > /dev/null 2>&1; then
        echo "✅ API Tunnel: Connected"
    else
        echo "❌ API Tunnel: Not connected"
    fi
}

# One-click deploy
one_click_deploy() {
    echo "🚀 ONE-CLICK DEPLOYMENT"
    echo "====================="
    
    read -p "Remote host: " REMOTE_HOST
    read -p "Remote user [root]: " REMOTE_USER
    REMOTE_USER=${REMOTE_USER:-root}
    
    echo ""
    echo "📦 Creating deployment package..."
    ./deploy-ai-trust-remote.sh
    
    echo ""
    echo "🎭 Setting up orchestration..."
    ./tmux-tunnel-orchestrator.sh $REMOTE_HOST $REMOTE_USER
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📺 Attach to control center: tmux attach -t ai-trust-orchestrator"
}

# Main menu
echo "Choose operation:"
echo "1) 🚀 One-Click Deploy"
echo "2) 📊 Quick Status"
echo "3) 🎭 Orchestration Manager"
echo "4) 📺 Attach to TMUX"
echo "5) 🕷️  Cave Crawler"
echo ""

read -p "Choice [1]: " choice
choice=${choice:-1}

case $choice in
    1) one_click_deploy ;;
    2) quick_status ;;
    3) ./orchestration-manager.sh ;;
    4) tmux attach -t ai-trust-orchestrator ;;
    5) ./cave-crawler-monitor.sh ;;
    *) echo "Invalid choice" ;;
esac
EOF
    chmod +x ai-trust-master-control.sh
}

# Create all the supporting scripts
echo -e "${BLUE}📝 Creating orchestration scripts...${NC}"
create_tunnel_config
create_tmux_orchestrator
create_cave_crawler
create_performance_monitor
create_orchestration_manager
create_master_control

# Create log directory
mkdir -p logs

# Create systemd service for persistent tunnels (optional)
cat > ai-trust-tunnels.service << EOF
[Unit]
Description=AI Trust SSH Tunnels
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
ExecStart=$PWD/ssh-tunnel-config.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo -e "${GREEN}✅ TMUX Tunnel Orchestrator Created!${NC}"
echo ""
echo -e "${YELLOW}📋 QUICK START:${NC}"
echo ""
echo "1. ${BLUE}Basic deployment:${NC}"
echo "   ./ai-trust-master-control.sh"
echo ""
echo "2. ${BLUE}Manual orchestration:${NC}"
echo "   ./tmux-orchestrator.sh"
echo ""
echo "3. ${BLUE}Advanced management:${NC}"
echo "   ./orchestration-manager.sh $REMOTE_HOST $REMOTE_USER"
echo ""
echo -e "${PURPLE}🎮 TMUX Commands:${NC}"
echo "  - Attach: tmux attach -t ai-trust-orchestrator"
echo "  - Detach: Ctrl+b d"
echo "  - Switch windows: Ctrl+b [number]"
echo "  - List sessions: tmux ls"
echo ""
echo -e "${GREEN}🕷️  Cave Crawler available for deep system monitoring!${NC}"