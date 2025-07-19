#!/bin/bash

# QUICK DEPLOY - Save memory, close terminals, keep system running

echo "🚀 QUICK DEPLOY - Document Generator"
echo "==================================="
echo "Saving memory and deploying efficiently"

# Kill any existing node processes to free memory
echo "🧹 Cleaning up old processes..."
pkill -f "node"
pkill -f "npm"

# Create minimal startup script
cat > start-minimal.sh << 'EOF'
#!/bin/bash
# Minimal memory footprint startup

# Start only essential services
echo "Starting Document Generator (Minimal Mode)..."

# Option 1: Character System Only (uses least memory)
node character-system-max.js &
CHAR_PID=$!

# Option 2: Web Interface Only  
node execute-character-system.js &
WEB_PID=$!

echo "✅ Minimal system running"
echo "🌐 Web Interface: http://localhost:8888"
echo "PIDs: Character=$CHAR_PID, Web=$WEB_PID"
echo ""
echo "To stop: kill $CHAR_PID $WEB_PID"
EOF

chmod +x start-minimal.sh

# Create memory-efficient launcher
cat > launch.js << 'EOF'
#!/usr/bin/env node

// MEMORY EFFICIENT LAUNCHER
console.log('💾 Memory-Efficient Document Generator Launcher');
console.log('==============================================');

const http = require('http');
const fs = require('fs');

// Simple web server - minimal memory usage
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Document Generator - Minimal</title>
  <style>
    body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
    .btn { padding: 20px; margin: 10px; font-size: 18px; cursor: pointer; }
    .status { background: #f0f0f0; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>🎭 Document Generator - Memory Efficient Mode</h1>
  
  <div class="status">
    <h3>💾 Low Memory Mode Active</h3>
    <p>Close all terminals after starting this!</p>
  </div>
  
  <button class="btn" onclick="start('character')">🎭 Start Character System</button>
  <button class="btn" onclick="start('full')">🚀 Start Full System</button>
  
  <div id="output"></div>
  
  <script>
    function start(mode) {
      fetch('/start/' + mode)
        .then(r => r.text())
        .then(text => {
          document.getElementById('output').innerHTML = '<pre>' + text + '</pre>';
        });
    }
  </script>
  
  <h3>📋 Manual Commands (if web fails):</h3>
  <pre>
# Minimal Character System:
node character-system-max.js

# Web Interface: 
node execute-character-system.js

# Full System:
node final-executor.js
  </pre>
</body>
</html>
    `);
  } else if (req.url.startsWith('/start/')) {
    const mode = req.url.split('/')[2];
    const { spawn } = require('child_process');
    
    let cmd, args;
    if (mode === 'character') {
      cmd = 'node';
      args = ['character-system-max.js'];
    } else {
      cmd = 'node';
      args = ['final-executor.js'];
    }
    
    const proc = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    proc.unref();
    
    res.writeHead(200);
    res.end(`Started ${mode} system. Check http://localhost:8888`);
  }
});

server.listen(7777, () => {
  console.log('🌐 Launcher running at http://localhost:7777');
  console.log('📌 This uses minimal memory');
  console.log('✅ You can close your terminal after this starts!');
});
EOF

# Create persistent systemd service (if on Linux/Mac with systemd)
cat > document-generator.service << EOF
[Unit]
Description=Document Generator
After=network.target

[Service]
Type=simple
WorkingDirectory=/Users/matthewmauer/Desktop/Document-Generator
ExecStart=/usr/bin/node launch.js
Restart=always
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Create LaunchDaemon for macOS
cat > com.documentgenerator.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.documentgenerator</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/matthewmauer/Desktop/Document-Generator/launch.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/matthewmauer/Desktop/Document-Generator</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# Create quick memory cleanup script
cat > cleanup-memory.sh << 'EOF'
#!/bin/bash
echo "🧹 Cleaning up memory..."

# Clear node_modules in subdirectories (they can be reinstalled)
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Clear temporary files
rm -rf temp/* logs/* .cache

# Clear Chrome/Electron caches if any
rm -rf ~/.config/Electron/Cache
rm -rf ~/.config/chromium/Default/Cache

echo "✅ Memory cleanup complete"
echo "💾 You can now close terminals safely"
EOF

chmod +x cleanup-memory.sh

echo ""
echo "✅ QUICK DEPLOY READY!"
echo "===================="
echo ""
echo "🚀 OPTION 1: Start minimal launcher (uses least memory):"
echo "   node launch.js"
echo "   → Then open http://localhost:7777"
echo "   → You can close terminal after this!"
echo ""
echo "🎭 OPTION 2: Start character system only:"
echo "   node character-system-max.js"
echo ""
echo "🧹 OPTION 3: Clean up memory first:"
echo "   ./cleanup-memory.sh"
echo ""
echo "💻 OPTION 4: Install as background service (macOS):"
echo "   cp com.documentgenerator.plist ~/Library/LaunchAgents/"
echo "   launchctl load ~/Library/LaunchAgents/com.documentgenerator.plist"
echo ""
echo "📌 After starting with Option 1, you can close ALL terminals!"
echo "   The system will keep running in background"