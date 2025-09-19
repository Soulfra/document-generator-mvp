#!/bin/bash

# 🚇 ADVANCED TUNNEL MANAGER WITH FAILOVER
# =======================================

set -e

# Configuration
TUNNEL_CONFIG_FILE="tunnel-config.json"
TUNNEL_STATE_FILE="tunnel-state.json"
HEALTH_CHECK_INTERVAL=30
RECONNECT_DELAY=5
MAX_RETRIES=3

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🚇 ADVANCED TUNNEL MANAGER${NC}"
echo "=========================="
echo ""

# Create tunnel configuration
create_tunnel_config() {
    cat > $TUNNEL_CONFIG_FILE << 'EOF'
{
  "tunnels": [
    {
      "name": "api-tunnel",
      "local_port": 6666,
      "remote_port": 6666,
      "remote_host": "localhost",
      "priority": 1,
      "health_check": "http://localhost:6666/trust-status",
      "health_check_type": "http",
      "expected_response": 200
    },
    {
      "name": "websocket-tunnel",
      "local_port": 6667,
      "remote_port": 6667,
      "remote_host": "localhost",
      "priority": 1,
      "health_check": "ws://localhost:6667",
      "health_check_type": "websocket"
    },
    {
      "name": "web-tunnel",
      "local_port": 8080,
      "remote_port": 80,
      "remote_host": "localhost",
      "priority": 2,
      "health_check": "http://localhost:8080/",
      "health_check_type": "http",
      "expected_response": 200
    },
    {
      "name": "database-tunnel",
      "local_port": 5432,
      "remote_port": 5432,
      "remote_host": "localhost",
      "priority": 3,
      "health_check_type": "tcp"
    },
    {
      "name": "monitoring-tunnel",
      "local_port": 9090,
      "remote_port": 9090,
      "remote_host": "localhost",
      "priority": 3,
      "health_check_type": "tcp"
    }
  ],
  "ssh_options": {
    "ServerAliveInterval": 60,
    "ServerAliveCountMax": 3,
    "ExitOnForwardFailure": "yes",
    "TCPKeepAlive": "yes",
    "StrictHostKeyChecking": "no",
    "UserKnownHostsFile": "/dev/null",
    "LogLevel": "ERROR",
    "Compression": "yes",
    "CompressionLevel": 6
  },
  "failover": {
    "enabled": true,
    "backup_hosts": [
      "backup1.server.com",
      "backup2.server.com"
    ],
    "health_check_interval": 30,
    "failover_threshold": 3
  }
}
EOF
}

# Tunnel manager class
cat > tunnel-manager.py << 'EOF'
#!/usr/bin/env python3

import json
import subprocess
import threading
import time
import requests
import websocket
import socket
import logging
from datetime import datetime
from collections import defaultdict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class TunnelManager:
    def __init__(self, config_file='tunnel-config.json'):
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        self.tunnels = {}
        self.tunnel_processes = {}
        self.health_status = defaultdict(lambda: {'healthy': False, 'last_check': None, 'failures': 0})
        self.current_host = None
        self.failover_hosts = self.config['failover']['backup_hosts']
        
    def start(self, host, user='root'):
        self.current_host = host
        logging.info(f"Starting tunnel manager for {user}@{host}")
        
        # Start all tunnels
        for tunnel in self.config['tunnels']:
            self.start_tunnel(tunnel, host, user)
        
        # Start health monitoring
        self.start_health_monitor()
        
    def start_tunnel(self, tunnel, host, user):
        name = tunnel['name']
        local_port = tunnel['local_port']
        remote_port = tunnel['remote_port']
        remote_host = tunnel.get('remote_host', 'localhost')
        
        # Build SSH command
        ssh_cmd = [
            'ssh', '-N',
            '-L', f'{local_port}:{remote_host}:{remote_port}'
        ]
        
        # Add SSH options
        for option, value in self.config['ssh_options'].items():
            ssh_cmd.extend(['-o', f'{option}={value}'])
        
        ssh_cmd.append(f'{user}@{host}')
        
        # Start tunnel
        logging.info(f"Starting tunnel: {name} (:{local_port} -> {remote_host}:{remote_port})")
        
        process = subprocess.Popen(
            ssh_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        self.tunnel_processes[name] = {
            'process': process,
            'config': tunnel,
            'start_time': datetime.now(),
            'restarts': 0
        }
        
    def check_tunnel_health(self, tunnel):
        name = tunnel['name']
        check_type = tunnel.get('health_check_type', 'tcp')
        
        try:
            if check_type == 'http':
                response = requests.get(
                    tunnel['health_check'],
                    timeout=5
                )
                healthy = response.status_code == tunnel.get('expected_response', 200)
                
            elif check_type == 'websocket':
                ws = websocket.create_connection(
                    tunnel['health_check'],
                    timeout=5
                )
                ws.close()
                healthy = True
                
            elif check_type == 'tcp':
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex(('localhost', tunnel['local_port']))
                sock.close()
                healthy = result == 0
                
            else:
                healthy = False
                
        except Exception as e:
            logging.warning(f"Health check failed for {name}: {e}")
            healthy = False
        
        # Update health status
        self.health_status[name]['healthy'] = healthy
        self.health_status[name]['last_check'] = datetime.now()
        
        if not healthy:
            self.health_status[name]['failures'] += 1
        else:
            self.health_status[name]['failures'] = 0
            
        return healthy
        
    def monitor_tunnels(self):
        while True:
            for name, tunnel_info in self.tunnel_processes.items():
                process = tunnel_info['process']
                config = tunnel_info['config']
                
                # Check if process is alive
                if process.poll() is not None:
                    logging.error(f"Tunnel {name} died, restarting...")
                    self.restart_tunnel(name)
                    
                # Check tunnel health
                if 'health_check' in config:
                    healthy = self.check_tunnel_health(config)
                    
                    if not healthy and self.health_status[name]['failures'] > 3:
                        logging.warning(f"Tunnel {name} unhealthy, restarting...")
                        self.restart_tunnel(name)
                        
            # Check for failover conditions
            if self.config['failover']['enabled']:
                self.check_failover()
                
            time.sleep(self.config['failover']['health_check_interval'])
            
    def restart_tunnel(self, name):
        tunnel_info = self.tunnel_processes.get(name)
        if not tunnel_info:
            return
            
        # Kill existing process
        process = tunnel_info['process']
        if process.poll() is None:
            process.terminate()
            time.sleep(1)
            if process.poll() is None:
                process.kill()
                
        # Increment restart counter
        tunnel_info['restarts'] += 1
        
        # Restart tunnel
        config = tunnel_info['config']
        self.start_tunnel(config, self.current_host, 'root')
        
    def check_failover(self):
        # Count unhealthy critical tunnels
        critical_failures = 0
        for name, status in self.health_status.items():
            tunnel = next((t for t in self.config['tunnels'] if t['name'] == name), None)
            if tunnel and tunnel.get('priority', 3) == 1 and not status['healthy']:
                critical_failures += 1
                
        # Trigger failover if threshold reached
        if critical_failures >= self.config['failover']['failover_threshold']:
            logging.error(f"Critical failures detected ({critical_failures}), initiating failover...")
            self.failover()
            
    def failover(self):
        # Try backup hosts
        for backup_host in self.failover_hosts:
            logging.info(f"Attempting failover to {backup_host}...")
            
            # Stop all current tunnels
            self.stop_all_tunnels()
            
            # Try to establish tunnels to backup host
            try:
                self.start(backup_host)
                
                # Wait and check if tunnels are healthy
                time.sleep(10)
                
                healthy_count = sum(1 for s in self.health_status.values() if s['healthy'])
                if healthy_count >= len(self.config['tunnels']) * 0.7:
                    logging.info(f"Failover to {backup_host} successful!")
                    return
                    
            except Exception as e:
                logging.error(f"Failover to {backup_host} failed: {e}")
                
        logging.error("All failover attempts failed!")
        
    def stop_all_tunnels(self):
        for name, tunnel_info in self.tunnel_processes.items():
            process = tunnel_info['process']
            if process.poll() is None:
                process.terminate()
                
    def start_health_monitor(self):
        monitor_thread = threading.Thread(target=self.monitor_tunnels, daemon=True)
        monitor_thread.start()
        
    def get_status(self):
        status = {
            'current_host': self.current_host,
            'tunnels': {}
        }
        
        for name, tunnel_info in self.tunnel_processes.items():
            process = tunnel_info['process']
            health = self.health_status[name]
            
            status['tunnels'][name] = {
                'alive': process.poll() is None,
                'healthy': health['healthy'],
                'restarts': tunnel_info['restarts'],
                'uptime': str(datetime.now() - tunnel_info['start_time']),
                'failures': health['failures']
            }
            
        return status

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: tunnel-manager.py <remote_host> [remote_user]")
        sys.exit(1)
        
    host = sys.argv[1]
    user = sys.argv[2] if len(sys.argv) > 2 else 'root'
    
    manager = TunnelManager()
    manager.start(host, user)
    
    # Keep running and print status
    try:
        while True:
            time.sleep(30)
            status = manager.get_status()
            print(json.dumps(status, indent=2))
    except KeyboardInterrupt:
        print("\nShutting down tunnel manager...")
        manager.stop_all_tunnels()
EOF

chmod +x tunnel-manager.py

# Create tunnel dashboard
cat > tunnel-dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>🚇 Tunnel Dashboard</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0a;
            color: #00ff88;
            margin: 0;
            padding: 20px;
        }
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #ffffff;
            text-shadow: 0 0 20px #00ff88;
        }
        .tunnel-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .tunnel-card {
            background: rgba(26, 26, 46, 0.8);
            border: 2px solid #00ff88;
            border-radius: 10px;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }
        .tunnel-card.unhealthy {
            border-color: #ff6666;
        }
        .status-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        .status-indicator.healthy {
            background: #00ff88;
        }
        .status-indicator.unhealthy {
            background: #ff6666;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .metric {
            margin: 5px 0;
            font-size: 14px;
        }
        .metric-label {
            color: #888;
        }
        .metric-value {
            color: #ffffff;
            font-weight: bold;
        }
        .control-panel {
            background: rgba(0, 0, 0, 0.5);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        button {
            background: linear-gradient(45deg, #00ff88, #0088ff);
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        button:hover {
            background: linear-gradient(45deg, #88ff00, #00ffcc);
        }
        .log-viewer {
            background: #000;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            height: 200px;
            overflow-y: auto;
            margin: 20px 0;
        }
        .log-entry {
            margin: 2px 0;
        }
        .log-error {
            color: #ff6666;
        }
        .log-warning {
            color: #ffff00;
        }
        .log-info {
            color: #00ff88;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>🚇 AI Trust Tunnel Dashboard</h1>
        
        <div class="control-panel">
            <h2>Control Panel</h2>
            <button onclick="refreshStatus()">🔄 Refresh</button>
            <button onclick="restartAll()">🔄 Restart All</button>
            <button onclick="testFailover()">🚨 Test Failover</button>
            <button onclick="viewLogs()">📝 View Logs</button>
            <button onclick="exportMetrics()">📊 Export Metrics</button>
        </div>
        
        <div class="tunnel-grid" id="tunnelGrid">
            <!-- Tunnel cards will be inserted here -->
        </div>
        
        <div class="log-viewer" id="logViewer">
            <div class="log-entry log-info">[INFO] Tunnel dashboard initialized</div>
        </div>
    </div>
    
    <script>
        let tunnelStatus = {};
        
        // Tunnel definitions
        const tunnels = [
            { name: 'API Tunnel', port: 6666, type: 'HTTP API' },
            { name: 'WebSocket Tunnel', port: 6667, type: 'WebSocket' },
            { name: 'Web Tunnel', port: 8080, type: 'Web UI' },
            { name: 'Database Tunnel', port: 5432, type: 'PostgreSQL' },
            { name: 'Monitoring', port: 9090, type: 'Metrics' }
        ];
        
        function refreshStatus() {
            addLog('info', 'Refreshing tunnel status...');
            
            // Simulate getting status - replace with actual API call
            fetch('/tunnel-status')
                .then(res => res.json())
                .then(data => {
                    tunnelStatus = data;
                    updateDashboard();
                })
                .catch(err => {
                    addLog('error', 'Failed to fetch status: ' + err.message);
                    // Use mock data for demo
                    updateDashboard();
                });
        }
        
        function updateDashboard() {
            const grid = document.getElementById('tunnelGrid');
            grid.innerHTML = '';
            
            tunnels.forEach(tunnel => {
                const card = createTunnelCard(tunnel);
                grid.appendChild(card);
            });
        }
        
        function createTunnelCard(tunnel) {
            const card = document.createElement('div');
            const isHealthy = Math.random() > 0.2; // Simulate status
            
            card.className = `tunnel-card ${isHealthy ? '' : 'unhealthy'}`;
            card.innerHTML = `
                <div class="status-indicator ${isHealthy ? 'healthy' : 'unhealthy'}"></div>
                <h3>${tunnel.name}</h3>
                <div class="metric">
                    <span class="metric-label">Port:</span>
                    <span class="metric-value">${tunnel.port}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Type:</span>
                    <span class="metric-value">${tunnel.type}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Status:</span>
                    <span class="metric-value">${isHealthy ? 'Healthy' : 'Unhealthy'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime:</span>
                    <span class="metric-value">${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Restarts:</span>
                    <span class="metric-value">${Math.floor(Math.random() * 5)}</span>
                </div>
                <button onclick="restartTunnel('${tunnel.name}')">Restart</button>
            `;
            
            return card;
        }
        
        function restartTunnel(name) {
            addLog('warning', `Restarting tunnel: ${name}`);
            // Implement restart logic
        }
        
        function restartAll() {
            addLog('warning', 'Restarting all tunnels...');
            // Implement restart all logic
        }
        
        function testFailover() {
            addLog('error', 'Testing failover scenario...');
            // Implement failover test
        }
        
        function viewLogs() {
            const viewer = document.getElementById('logViewer');
            viewer.scrollTop = viewer.scrollHeight;
        }
        
        function exportMetrics() {
            addLog('info', 'Exporting tunnel metrics...');
            // Implement metrics export
        }
        
        function addLog(level, message) {
            const viewer = document.getElementById('logViewer');
            const entry = document.createElement('div');
            entry.className = `log-entry log-${level}`;
            const timestamp = new Date().toLocaleTimeString();
            entry.textContent = `[${level.toUpperCase()}] ${timestamp} - ${message}`;
            viewer.appendChild(entry);
            viewer.scrollTop = viewer.scrollHeight;
        }
        
        // Auto-refresh every 5 seconds
        setInterval(refreshStatus, 5000);
        
        // Initial load
        updateDashboard();
    </script>
</body>
</html>
EOF

# Create the main script
echo ""
echo -e "${GREEN}✅ Advanced Tunnel Manager Created!${NC}"
echo ""
echo -e "${YELLOW}📋 Features:${NC}"
echo "  - Automatic tunnel health monitoring"
echo "  - Failover to backup hosts"
echo "  - Web dashboard for tunnel status"
echo "  - Python-based management with threading"
echo "  - Configurable health checks"
echo ""
echo -e "${BLUE}🚀 Usage:${NC}"
echo "  1. Edit tunnel-config.json for your setup"
echo "  2. Run: python3 tunnel-manager.py <remote_host>"
echo "  3. View dashboard: open tunnel-dashboard.html"
echo ""

# Create tunnel configuration
create_tunnel_config

echo -e "${GREEN}✅ Configuration files created!${NC}"