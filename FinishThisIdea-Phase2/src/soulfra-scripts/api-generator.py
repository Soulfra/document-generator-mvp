#!/usr/bin/env python3
"""
API ROUTER - Central routing layer for the platform
Connects games (3000s) to AI backend (4000s)
"""

import http.server
import socketserver
import json
import urllib.parse
import urllib.request
from datetime import datetime

PORT = 5000

# Service registry
SERVICES = {
    'game': {
        'simple_clicker': 'http://localhost:3000',
        'arena': 'http://localhost:3001',
        'character': 'http://localhost:3002'
    },
    'ai': {
        'cal_riven': 'http://localhost:4040',
        'reflection': 'http://localhost:4003',
        'economy': 'http://localhost:4002'
    },
    'data': {
        'scores': {},  # In-memory for now
        'sessions': {},
        'reflections': []
    }
}

# Router HTML dashboard
DASHBOARD_HTML = """<!DOCTYPE html>
<html>
<head>
<title>SOULFRA API ROUTER</title>
<style>
body { background: #000; color: #fff; font-family: Arial; margin: 0; }
.header { background: linear-gradient(45deg, #00ff88, #00ccff); padding: 20px; text-align: center; }
.header h1 { margin: 0; color: #000; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.section { background: #1a1a1a; border-radius: 10px; padding: 20px; margin: 20px 0; }
.section h2 { color: #00ff88; margin-top: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
.service { background: #2a2a2a; padding: 15px; border-radius: 8px; }
.service.online { border-left: 4px solid #00ff88; }
.service.offline { border-left: 4px solid #ff4444; }
.endpoint { background: #333; padding: 10px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
.stats { display: flex; gap: 40px; }
.stat { text-align: center; }
.stat-value { font-size: 48px; color: #00ff88; }
.stat-label { color: #888; }
button { background: #00ff88; color: #000; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px; }
</style>
</head>
<body>

<div class="header">
<h1>SOULFRA PLATFORM ROUTER</h1>
<p>API Gateway - Port 5000</p>
</div>

<div class="container">

<div class="section">
<h2>ROUTING DASHBOARD</h2>
<div class="stats">
<div class="stat">
<div class="stat-value" id="requests">0</div>
<div class="stat-label">Total Requests</div>
</div>
<div class="stat">
<div class="stat-value" id="active">0</div>
<div class="stat-label">Active Sessions</div>
</div>
<div class="stat">
<div class="stat-value" id="games">1</div>
<div class="stat-label">Games Online</div>
</div>
<div class="stat">
<div class="stat-value" id="ais">0</div>
<div class="stat-label">AI Services</div>
</div>
</div>
</div>

<div class="section">
<h2>API ENDPOINTS</h2>
<div class="grid">
<div>
<h3>Game APIs</h3>
<div class="endpoint">GET /api/games</div>
<div class="endpoint">GET /api/game/{id}/status</div>
<div class="endpoint">POST /api/game/{id}/action</div>
</div>
<div>
<h3>AI APIs</h3>
<div class="endpoint">POST /api/ai/reflect</div>
<div class="endpoint">GET /api/ai/cal/status</div>
<div class="endpoint">POST /api/ai/economy/trade</div>
</div>
<div>
<h3>Data APIs</h3>
<div class="endpoint">GET /api/scores/top</div>
<div class="endpoint">POST /api/session/create</div>
<div class="endpoint">GET /api/reflections</div>
</div>
</div>
</div>

<div class="section">
<h2>SERVICE STATUS</h2>
<div class="grid" id="services">
<div class="service online">
<h3>Simple Clicker</h3>
<p>Port 3000 - ONLINE</p>
<button onclick="window.open('http://localhost:3000')">Open Game</button>
</div>
</div>
</div>

<div class="section">
<h2>RECENT ACTIVITY</h2>
<div id="activity" style="font-family: monospace; background: #000; padding: 10px; border-radius: 5px; max-height: 200px; overflow-y: auto;">
<div style="color: #00ff88;">[SYSTEM] Router started on port 5000</div>
</div>
</div>

</div>

<script>
let requestCount = 0;

// Update stats
setInterval(() => {
    fetch('/api/status')
        .then(r => r.json())
        .then(data => {
            document.getElementById('requests').textContent = data.requests;
            document.getElementById('active').textContent = data.sessions;
        });
}, 1000);

// Add activity log
function addLog(msg) {
    const activity = document.getElementById('activity');
    const entry = document.createElement('div');
    entry.style.color = '#888';
    entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    activity.appendChild(entry);
    activity.scrollTop = activity.scrollHeight;
}

// Check service status
async function checkServices() {
    const services = document.getElementById('services');
    services.innerHTML = '';
    
    // Check game service
    try {
        const response = await fetch('http://localhost:3000', {mode: 'no-cors'});
        services.innerHTML += `
            <div class="service online">
                <h3>Simple Clicker</h3>
                <p>Port 3000 - ONLINE</p>
                <button onclick="window.open('http://localhost:3000')">Open Game</button>
            </div>
        `;
    } catch (e) {
        services.innerHTML += `
            <div class="service offline">
                <h3>Simple Clicker</h3>
                <p>Port 3000 - OFFLINE</p>
            </div>
        `;
    }
    
    // Add placeholder for future services
    services.innerHTML += `
        <div class="service offline">
            <h3>Cal Riven AI</h3>
            <p>Port 4040 - PENDING</p>
        </div>
        <div class="service offline">
            <h3>Economy Service</h3>
            <p>Port 4002 - PENDING</p>
        </div>
    `;
}

checkServices();
setInterval(checkServices, 5000);
</script>

</body>
</html>"""

class RouterHandler(http.server.BaseHTTPRequestHandler):
    request_count = 0
    
    def do_GET(self):
        RouterHandler.request_count += 1
        
        if self.path == '/':
            # Serve dashboard
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(DASHBOARD_HTML.encode())
            
        elif self.path == '/api/status':
            # API status endpoint
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            status = {
                'router': 'online',
                'requests': RouterHandler.request_count,
                'sessions': len(SERVICES['data']['sessions']),
                'games': 1,  # Simple clicker
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(status).encode())
            
        elif self.path == '/api/games':
            # List available games
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            games = [
                {'id': 'simple_clicker', 'name': 'Simple Clicker', 'port': 3000, 'status': 'online'},
                {'id': 'arena', 'name': 'Arena Shooter', 'port': 3001, 'status': 'pending'},
                {'id': 'character', 'name': 'Character Creator', 'port': 3002, 'status': 'pending'}
            ]
            self.wfile.write(json.dumps(games).encode())
            
        elif self.path.startswith('/api/'):
            # Generic API response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'path': self.path,
                'message': 'API endpoint placeholder',
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_error(404)
    
    def do_POST(self):
        RouterHandler.request_count += 1
        
        if self.path == '/api/ai/reflect':
            # Handle AI reflection request
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Store reflection
            reflection = {
                'text': data.get('text', ''),
                'timestamp': datetime.now().isoformat(),
                'source': data.get('source', 'unknown')
            }
            SERVICES['data']['reflections'].append(reflection)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'reflected',
                'id': len(SERVICES['data']['reflections']) - 1,
                'message': 'Reflection stored for Cal Riven processing'
            }
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
    
    def log_message(self, format, *args):
        # Custom logging
        print(f"[ROUTER] {self.address_string()} - {format % args}")

# Start router
print(f"""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║                    SOULFRA API ROUTER                      ║
║                                                            ║
║  Running at: http://localhost:{PORT}                       ║
║                                                            ║
║  Services:                                                 ║
║  • Game Layer: Ports 3000-3999                            ║
║  • AI Backend: Ports 4000-4999                            ║
║  • Router/API: Port 5000 (this service)                   ║
║                                                            ║
║  Dashboard: http://localhost:5000                          ║
║                                                            ║
║  This router connects all platform services!              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
""")

try:
    with socketserver.TCPServer(("", PORT), RouterHandler) as httpd:
        httpd.allow_reuse_address = True
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down router...")
except Exception as e:
    print(f"Error: {e}")