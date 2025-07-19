#!/usr/bin/env python3
"""
CLEAN MASTER CONTROL - Actually connects to real services
No emojis, no BS, just working integration
"""

import http.server
import socketserver
import json
import socket
import urllib.request
import urllib.error
from datetime import datetime

PORT = 8001  # Different port to avoid conflict

def check_service(host, port):
    """Check if a service is actually running"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0

def call_service(url, timeout=2):
    """Call a service and get response"""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode('utf-8')
    except:
        return None

class CleanMasterHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            # Check real services
            services = [
                {"name": "Working Launcher", "port": 7777, "url": "http://localhost:7777/api/status"},
                {"name": "Soulfra Simple", "port": 9000, "url": "http://localhost:9000"},
                {"name": "Full Pipeline", "port": 4000, "url": "http://localhost:4000"},
                {"name": "Code Assistant", "port": 8080, "url": "http://localhost:8080"},
                {"name": "Chat Logger", "port": 8888, "url": "http://localhost:8888"},
                {"name": "AI Ecosystem", "port": 9999, "url": "http://localhost:9999"},
            ]
            
            service_cards = []
            running_count = 0
            
            for service in services:
                is_running = check_service('localhost', service['port'])
                if is_running:
                    running_count += 1
                    status_class = "running"
                    status_text = "ONLINE"
                else:
                    status_class = "offline"
                    status_text = "OFFLINE"
                
                card = f'''
                <div class="service-card {status_class}">
                    <h3>{service['name']}</h3>
                    <div class="port">Port: {service['port']}</div>
                    <div class="status {status_class}">{status_text}</div>
                    {'<a href="' + service['url'].replace('/api/status', '') + '" target="_blank" class="link">Open Service</a>' if is_running else '<div class="link disabled">Not Running</div>'}
                </div>
                '''
                service_cards.append(card)
            
            html = f'''<!DOCTYPE html>
<html>
<head>
    <title>Clean Master Control</title>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            margin: 0;
            padding: 20px;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 40px;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin: 0;
            color: #fff;
        }}
        
        .stats {{
            text-align: center;
            margin: 20px 0;
            font-size: 1.2em;
        }}
        
        .stats .running {{
            color: #00ff00;
            font-weight: bold;
        }}
        
        .services-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        .service-card {{
            background: #1a1a1a;
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            transition: all 0.3s;
        }}
        
        .service-card.running {{
            border-color: #00ff00;
        }}
        
        .service-card.offline {{
            opacity: 0.6;
        }}
        
        .service-card h3 {{
            margin: 0 0 10px 0;
            color: #fff;
        }}
        
        .port {{
            color: #888;
            font-size: 0.9em;
            margin-bottom: 10px;
        }}
        
        .status {{
            font-weight: bold;
            margin-bottom: 15px;
        }}
        
        .status.running {{
            color: #00ff00;
        }}
        
        .status.offline {{
            color: #ff4444;
        }}
        
        .link {{
            display: inline-block;
            padding: 8px 16px;
            background: #0066cc;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            transition: all 0.3s;
        }}
        
        .link:hover {{
            background: #0088ff;
        }}
        
        .link.disabled {{
            background: #444;
            color: #888;
            cursor: not-allowed;
        }}
        
        .actions {{
            max-width: 800px;
            margin: 40px auto;
            text-align: center;
        }}
        
        .action-button {{
            display: inline-block;
            margin: 10px;
            padding: 12px 24px;
            background: #00aa00;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: all 0.3s;
        }}
        
        .action-button:hover {{
            background: #00cc00;
        }}
        
        .log-viewer {{
            max-width: 1000px;
            margin: 40px auto;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
        }}
        
        .log-viewer h3 {{
            margin: 0 0 15px 0;
            color: #00ff00;
        }}
        
        .log-content {{
            background: #000;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.9em;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Clean Master Control</h1>
        <p>Real-time service monitoring and control</p>
    </div>
    
    <div class="stats">
        <span class="running">{running_count}</span> of {len(services)} services running
    </div>
    
    <div class="services-grid">
        {''.join(service_cards)}
    </div>
    
    <div class="actions">
        <h3>Quick Actions</h3>
        <a href="http://localhost:7777" class="action-button">Open Working Launcher</a>
        <a href="/api/health" class="action-button">Check System Health</a>
        <a href="/api/restart" class="action-button">Restart All Services</a>
    </div>
    
    <div class="log-viewer">
        <h3>Recent Activity</h3>
        <div class="log-content">
Master Control started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Monitoring {len(services)} services
Dashboard available at http://localhost:{PORT}

Service Status:
''' + '\n'.join([f"{s['name']}: {'ONLINE' if check_service('localhost', s['port']) else 'OFFLINE'}" for s in services]) + '''
        </div>
    </div>
</body>
</html>'''
            
            self.wfile.write(html.encode('utf-8'))
            
        elif self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            services = [
                {"name": "Working Launcher", "port": 7777},
                {"name": "Soulfra Simple", "port": 9000},
                {"name": "Full Pipeline", "port": 4000},
                {"name": "Code Assistant", "port": 8080},
                {"name": "Chat Logger", "port": 8888},
                {"name": "AI Ecosystem", "port": 9999},
            ]
            
            health = {
                "timestamp": datetime.now().isoformat(),
                "services": {}
            }
            
            for service in services:
                health["services"][service["name"]] = {
                    "port": service["port"],
                    "running": check_service('localhost', service['port'])
                }
            
            self.wfile.write(json.dumps(health, indent=2).encode('utf-8'))
            
        elif self.path == '/api/restart':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "status": "restart_initiated",
                "message": "Run RESTART_SERVICES.sh to restart all services",
                "timestamp": datetime.now().isoformat()
            }
            
            self.wfile.write(json.dumps(response, indent=2).encode('utf-8'))
            
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        # Suppress request logging for cleaner output
        pass

def main():
    print(f"""
CLEAN MASTER CONTROL
====================

Starting on port {PORT}
Open http://localhost:{PORT} in your browser

This dashboard shows:
- Real service status (not fake)
- Direct links to running services
- System health monitoring
- No emojis, no encoding issues

Press Ctrl+C to stop
""")
    
    with socketserver.TCPServer(("", PORT), CleanMasterHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping Clean Master Control...")

if __name__ == "__main__":
    main()