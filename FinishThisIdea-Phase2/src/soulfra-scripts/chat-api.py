#!/usr/bin/env python3
"""
CHAT API GATEWAY - Routes all chat requests to appropriate services
"""

import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import os

class ChatGateway(BaseHTTPRequestHandler):
    """API Gateway for all chat interactions"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'''
            <html>
            <body style="font-family: Arial; padding: 20px;">
                <h1>Soulfra Chat Gateway</h1>
                <p>Access points:</p>
                <ul>
                    <li><a href="/chat">Web Chat Interface</a></li>
                    <li>CLI: python3 LOCAL_CHAT_SYSTEM.py cli</li>
                    <li>API: POST /api/chat</li>
                    <li>WebSocket: ws://localhost:8086</li>
                </ul>
            </body>
            </html>
            ''')
            
        elif parsed_path.path == '/chat':
            # Redirect to chat interface
            self.send_response(302)
            self.send_header('Location', 'http://localhost:8085')
            self.end_headers()
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                message = data.get('message', '')
                
                # Route to appropriate handler
                response = self.route_message(message)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'response': response,
                    'routed_to': self.get_route_info(message)
                }).encode())
                
            except Exception as e:
                self.send_error(400, str(e))
        else:
            self.send_error(404)
            
    def route_message(self, message):
        """Route message to appropriate service"""
        message_lower = message.lower()
        
        # Determine routing
        if 'qr' in message_lower or 'validate' in message_lower:
            # Route to QR validator
            return self.call_qr_validator(message)
            
        elif 'process' in message_lower or 'analyze' in message_lower:
            # Route to chat processor
            return self.call_chat_processor(message)
            
        elif 'status' in message_lower:
            # Route to monitor
            return self.get_system_status()
            
        else:
            # Default chat response
            return self.default_chat(message)
            
    def call_qr_validator(self, message):
        """Call the QR validator"""
        # Extract QR code from message
        import re
        match = re.search(r'qr-\w+-\d+', message)
        
        if match:
            qr_code = match.group(0)
            
            # Call the JavaScript QR validator
            try:
                result = subprocess.run(
                    ['node', '../qr-validator.js', qr_code],
                    capture_output=True,
                    text=True,
                    cwd=os.path.dirname(os.path.abspath(__file__))
                )
                
                if result.returncode == 0:
                    return f" QR code {qr_code} is valid!"
                else:
                    return f" QR code {qr_code} is invalid."
            except:
                return "QR validator not available"
        else:
            return "Please provide a QR code to validate (format: qr-xxxxx-0000)"
            
    def call_chat_processor(self, message):
        """Route to chat processor"""
        return f"Chat processor would analyze: '{message}'"
        
    def get_system_status(self):
        """Get system status"""
        import socket
        
        services = {
            7777: "Monitor",
            4040: "Chat Logger", 
            8085: "Chat Interface",
            8086: "WebSocket Server"
        }
        
        status = []
        for port, name in services.items():
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if result == 0:
                status.append(f" {name} (:{port})")
            else:
                status.append(f" {name} (:{port})")
                
        return "System Status:\n" + "\n".join(status)
        
    def default_chat(self, message):
        """Default chat handler"""
        return f"I received: '{message}'. Try 'status' to check services or 'validate qr-founder-0000' to test QR validation."
        
    def get_route_info(self, message):
        """Get routing information"""
        message_lower = message.lower()
        
        if 'qr' in message_lower:
            return "qr_validator"
        elif 'process' in message_lower:
            return "chat_processor"
        elif 'status' in message_lower:
            return "system_monitor"
        else:
            return "default_chat"
            
    def log_message(self, format, *args):
        pass

def main():
    print("=" * 60)
    print("SOULFRA CHAT API GATEWAY")
    print("=" * 60)
    print()
    print("Starting gateway on http://localhost:8090")
    print()
    print("Routes:")
    print("  GET  /          - Gateway info")
    print("  GET  /chat      - Web chat interface")
    print("  POST /api/chat  - Send chat messages")
    print()
    
    server = HTTPServer(('localhost', 8090), ChatGateway)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down gateway...")

if __name__ == "__main__":
    main()