#!/usr/bin/env python3
"""
AUTONOMOUS SIMPLE - Works within 2 minute limit
"""

import os
import subprocess
import time
import sys

def main():
    print("=" * 60)
    print("SOULFRA AUTONOMOUS - SIMPLE VERSION")
    print("=" * 60)
    print()
    
    # Create directories
    dirs = ["logs", "chatlog_drops", "processed_logs", "mobile_sync", "qr_codes"]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    
    # Services to start
    services = [
        ("FIXED_MONITOR.py", 7777),
        ("CHAT_LOG_PROCESSOR.py", 4040),
        ("UNIFIED_CHATLOG_SYSTEM.py", 8888),
        ("MINIMAL_AI_ECOSYSTEM.py", 9999),
    ]
    
    # Kill existing processes
    for _, port in services:
        os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
    
    time.sleep(1)
    
    # Start services
    print("Starting services:")
    for script, port in services:
        if os.path.exists(script):
            print(f"  Starting {script} on port {port}...")
            subprocess.Popen(
                [sys.executable, "-u", script],
                stdout=open(f'logs/{script}.log', 'a'),
                stderr=subprocess.STDOUT
            )
    
    print()
    print("All services started!")
    print()
    print("Monitor:        http://localhost:7777")
    print("Chat Logger:    http://localhost:4040") 
    print("Chat Processor: http://localhost:8888")
    print("AI Chat:        http://localhost:9999")
    print()
    print("Drop files in: chatlog_drops/")

if __name__ == "__main__":
    main()