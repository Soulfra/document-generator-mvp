#!/usr/bin/env python3
"""
CONTAINER MONITOR - Keeps everything alive
"""

import os
import sys
import time
import subprocess
import signal

class ContainerMonitor:
    def __init__(self):
        self.running = True
        self.service_name = os.environ.get('SERVICE_NAME', 'unknown')
        
    def signal_handler(self, signum, frame):
        print(f"[{self.service_name}] Received signal {signum}, shutting down...")
        self.running = False
        sys.exit(0)
        
    def run(self):
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)
        
        print(f"[{self.service_name}] Container monitor started")
        
        while self.running:
            try:
                # Heartbeat
                print(f"[{self.service_name}] Heartbeat - {time.strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Check if main process is running
                result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
                if 'python' in result.stdout:
                    print(f"[{self.service_name}] Service is running")
                else:
                    print(f"[{self.service_name}] WARNING: Service may be down")
                    
                time.sleep(60)  # Check every minute
                
            except Exception as e:
                print(f"[{self.service_name}] Monitor error: {e}")
                time.sleep(10)

if __name__ == "__main__":
    monitor = ContainerMonitor()
    monitor.run()
