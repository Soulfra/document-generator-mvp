#!/usr/bin/env node

/**
 * BASH LOCALHOST INTERFACE
 * Interactive web dashboard + CLI for the entire system
 * One place to bash through everything
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

console.log(`
🌐 BASH LOCALHOST INTERFACE STARTING 🌐
Interactive dashboard for the entire quantum system
http://localhost:3333 - Web Interface
ws://localhost:3334 - WebSocket Terminal
`);

class BashLocalhostInterface {
  constructor() {
    this.app = express();
    this.wss = new WebSocketServer({ port: 3334 });
    this.port = 3333;
    this.activeProcesses = new Map();
    this.systemStatus = {};
    
    this.setupWebInterface();
    this.setupWebSocketTerminal();
    this.setupSystemMonitoring();
    this.startServer();
  }

  setupWebInterface() {
    this.app.use(express.static('.'));
    this.app.use(express.json());

    // Main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // System status API
    this.app.get('/api/status', async (req, res) => {
      const status = await this.getFullSystemStatus();
      res.json(status);
    });

    // Execute command API
    this.app.post('/api/execute', async (req, res) => {
      const { command } = req.body;
      const result = await this.executeCommand(command);
      res.json(result);
    });

    // Quick actions
    this.app.post('/api/quick/:action', async (req, res) => {
      const { action } = req.params;
      const result = await this.executeQuickAction(action);
      res.json(result);
    });

    console.log('🌐 Web interface setup complete');
  }

  setupWebSocketTerminal() {
    this.wss.on('connection', (ws) => {
      console.log('🔌 Terminal connection established');
      
      ws.send(JSON.stringify({
        type: 'welcome',
        message: `
🔥 BASH SYSTEM TERMINAL 🔥
Type commands to interact with the system:

Quick Commands:
  status          - Show system status
  ralph           - Unleash Ralph chaos
  charlie         - Activate Charlie protection
  trinity         - Start trinity login
  shadow          - Enter shadow testing
  templates       - List action templates
  mirror-git      - Quantum operations
  remote          - Remote system demo
  ultimate        - ULTIMATE MODE
  
System Commands:
  npm run <script> - Run any npm script
  node <file>      - Run any system file
  help            - Show all commands
  clear           - Clear terminal

Type a command and press Enter to bash forward!
`
      }));

      ws.on('message', async (data) => {
        try {
          const { command } = JSON.parse(data);
          const result = await this.executeTerminalCommand(command, ws);
          
          ws.send(JSON.stringify({
            type: 'result',
            command,
            result
          }));
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });
    });

    console.log('⚡ WebSocket terminal ready');
  }

  setupSystemMonitoring() {
    // Monitor system status every 5 seconds
    setInterval(async () => {
      this.systemStatus = await this.getFullSystemStatus();
      
      // Broadcast to all connected terminals
      this.wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: 'status-update',
            status: this.systemStatus
          }));
        }
      });
    }, 5000);

    console.log('📊 System monitoring active');
  }

  async executeTerminalCommand(command, ws) {
    console.log(`💬 Terminal command: ${command}`);
    
    // Handle built-in commands
    switch (command.toLowerCase().trim()) {
      case 'clear':
        return { output: '\n'.repeat(50), type: 'clear' };
      
      case 'help':
        return { output: this.getHelpText(), type: 'help' };
      
      case 'status':
        const status = await this.getFullSystemStatus();
        return { output: JSON.stringify(status, null, 2), type: 'status' };
      
      case 'ralph':
        return await this.executeCommand('npm run ralph');
      
      case 'charlie':
        return await this.executeCommand('npm run guardian');
      
      case 'trinity':
        return await this.executeCommand('npm run trinity-demo');
      
      case 'shadow':
        return await this.executeCommand('npm run shadow');
      
      case 'templates':
        return await this.executeCommand('npm run templates');
      
      case 'mirror-git':
        return await this.executeCommand('npm run mirror-git demo');
      
      case 'remote':
        return await this.executeCommand('npm run remote demo');
      
      case 'ultimate':
        return await this.executeCommand('npm run ultimate-demo');
      
      default:
        // Execute as shell command
        return await this.executeCommand(command);
    }
  }

  async executeCommand(command) {
    return new Promise((resolve) => {
      console.log(`🔥 Executing: ${command}`);
      
      const process = spawn('bash', ['-c', command], {
        cwd: __dirname,
        stdio: 'pipe'
      });

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          command,
          output: output || error,
          exitCode: code,
          timestamp: new Date(),
          success: code === 0
        });
      });

      // Store process for potential killing
      const processId = Date.now().toString();
      this.activeProcesses.set(processId, process);
      
      // Clean up after 30 seconds
      setTimeout(() => {
        if (this.activeProcesses.has(processId)) {
          process.kill();
          this.activeProcesses.delete(processId);
        }
      }, 30000);
    });
  }

  async executeQuickAction(action) {
    const actions = {
      'ralph-chaos': 'npm run ralph',
      'charlie-protect': 'npm run guardian',
      'trinity-login': 'npm run trinity-demo',
      'shadow-test': 'npm run shadow',
      'template-demo': 'npm run templates',
      'quantum-demo': 'npm run mirror-git demo',
      'remote-demo': 'npm run remote demo',
      'ultimate-mode': 'npm run ultimate-demo',
      'system-status': 'npm run bash-status'
    };

    const command = actions[action];
    if (!command) {
      return { error: 'Unknown action' };
    }

    return await this.executeCommand(command);
  }

  async getFullSystemStatus() {
    try {
      // Try to get status from various components
      const checks = [
        { name: 'Trinity', command: 'node trinity-login-screen.js status' },
        { name: 'Shadow', command: 'node shadow-playtest-system.js status' },
        { name: 'Templates', command: 'node template-action-system.js status' },
        { name: 'Mirror-Git', command: 'node mirror-git-quantum-layer.js status' },
        { name: 'Remote', command: 'node remote-crash-mapping-system.js status' },
        { name: 'Quantum', command: 'node quantum-unified-system.js status' }
      ];

      const results = {};
      
      for (const check of checks) {
        try {
          const result = await this.executeCommand(check.command);
          results[check.name] = {
            status: result.success ? 'online' : 'error',
            lastCheck: new Date(),
            output: result.output.slice(0, 500) // Limit output
          };
        } catch (error) {
          results[check.name] = {
            status: 'offline',
            lastCheck: new Date(),
            error: error.message
          };
        }
      }

      return {
        overall: 'operational',
        timestamp: new Date(),
        components: results,
        uptime: process.uptime(),
        activeProcesses: this.activeProcesses.size
      };
    } catch (error) {
      return {
        overall: 'error',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  getHelpText() {
    return `
🔥 BASH SYSTEM HELP 🔥

Quick Commands:
  status          - Full system status
  ralph           - Ralph chaos mode
  charlie         - Charlie protection
  trinity         - Trinity authentication demo
  shadow          - Shadow realm testing
  templates       - Template action system
  mirror-git      - Quantum mirror operations
  remote          - Remote crash mapping
  ultimate        - ULTIMATE MODE ACTIVATION

NPM Scripts (npm run ...):
  trinity-demo    - Trinity authentication
  shadow         - Shadow playtest system
  templates      - Template actions
  mirror-git     - Mirror-git quantum layer
  remote         - Remote crash mapping
  ultimate-demo  - Quantum unified system
  ralph          - Ralph chaos test
  guardian       - Charlie protection
  pentest        - Security testing
  demo           - Complete system demo

Node Commands (node ...):
  trinity-login-screen.js
  shadow-playtest-system.js  
  template-action-system.js
  mirror-git-quantum-layer.js
  remote-crash-mapping-system.js
  quantum-unified-system.js

System Commands:
  clear          - Clear terminal
  help           - This help text
  exit           - Close connection

Just type any command and bash forward! 🚀
`;
  }

  generateDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 Bash System Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: 1fr 400px;
            grid-template-rows: auto 1fr;
            height: 100vh;
            gap: 20px;
            padding: 20px;
        }
        
        .header {
            grid-column: 1 / -1;
            text-align: center;
            padding: 20px;
            border: 2px solid #00ff88;
            border-radius: 10px;
            background: rgba(0, 255, 136, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 0 0 20px #00ff88;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .terminal-container {
            border: 2px solid #00ff88;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
        }
        
        .terminal-header {
            background: #00ff88;
            color: #000;
            padding: 10px 15px;
            font-weight: bold;
            border-radius: 8px 8px 0 0;
        }
        
        .terminal {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.4;
            max-height: 70vh;
        }
        
        .terminal-input {
            display: flex;
            padding: 10px 15px;
            border-top: 1px solid #00ff88;
        }
        
        .terminal-prompt {
            color: #ff6b6b;
            margin-right: 10px;
        }
        
        .terminal-command {
            flex: 1;
            background: transparent;
            border: none;
            color: #00ff88;
            font-family: inherit;
            font-size: 14px;
            outline: none;
        }
        
        .quick-actions {
            border: 2px solid #00ff88;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.8);
        }
        
        .quick-actions-header {
            background: #00ff88;
            color: #000;
            padding: 10px 15px;
            font-weight: bold;
            border-radius: 8px 8px 0 0;
        }
        
        .action-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding: 15px;
        }
        
        .action-btn {
            background: linear-gradient(45deg, #ff6b6b, #ffa500);
            border: none;
            color: white;
            padding: 15px 10px;
            border-radius: 8px;
            font-family: inherit;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            font-size: 12px;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }
        
        .action-btn.ralph {
            background: linear-gradient(45deg, #ff0000, #ff6b6b);
        }
        
        .action-btn.charlie {
            background: linear-gradient(45deg, #4ECDC4, #45B7B8);
        }
        
        .action-btn.ultimate {
            background: linear-gradient(45deg, #8B5CF6, #EC4899);
            animation: rainbow 3s infinite;
        }
        
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
        
        .status-display {
            margin-top: 15px;
            padding: 15px;
            border-top: 1px solid #00ff88;
            font-size: 12px;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .status-online {
            color: #00ff88;
        }
        
        .status-offline {
            color: #ff6b6b;
        }
        
        .terminal-output {
            color: #00ff88;
            margin-bottom: 10px;
            white-space: pre-wrap;
        }
        
        .terminal-output.error {
            color: #ff6b6b;
        }
        
        .terminal-output.success {
            color: #00ff88;
        }
        
        .scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        
        .scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.5);
        }
        
        .scrollbar::-webkit-scrollbar-thumb {
            background: #00ff88;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🔥 BASH SYSTEM DASHBOARD 🔥</h1>
            <p>Interactive localhost interface for the complete quantum system</p>
            <p><strong>localhost:3333</strong> • WebSocket Terminal • Real-time Monitoring</p>
        </div>
        
        <div class="terminal-container">
            <div class="terminal-header">
                💻 Bash Terminal - Type commands and press Enter
            </div>
            <div class="terminal scrollbar" id="terminal">
                <div class="terminal-output">
🌟 Welcome to the Bash System Terminal! 🌟

This is your interactive command center for the entire system.
Type any command below and hit Enter to execute it.

Try these commands:
• status - Show system status
• ralph - Unleash Ralph chaos  
• ultimate - Activate ultimate mode
• help - Show all commands

Ready to bash forward! 🚀
                </div>
            </div>
            <div class="terminal-input">
                <span class="terminal-prompt">bash$</span>
                <input type="text" class="terminal-command" id="commandInput" placeholder="Type command here..." autocomplete="off">
            </div>
        </div>
        
        <div class="quick-actions">
            <div class="quick-actions-header">
                ⚡ Quick Actions
            </div>
            <div class="action-grid">
                <button class="action-btn ralph" onclick="executeAction('ralph-chaos')">
                    🔥 RALPH<br>CHAOS
                </button>
                <button class="action-btn charlie" onclick="executeAction('charlie-protect')">
                    🛡️ CHARLIE<br>PROTECT
                </button>
                <button class="action-btn" onclick="executeAction('trinity-login')">
                    🌌 TRINITY<br>LOGIN
                </button>
                <button class="action-btn" onclick="executeAction('shadow-test')">
                    👤 SHADOW<br>TEST
                </button>
                <button class="action-btn" onclick="executeAction('template-demo')">
                    ⚡ TEMPLATE<br>DEMO
                </button>
                <button class="action-btn" onclick="executeAction('quantum-demo')">
                    🪞 QUANTUM<br>DEMO
                </button>
                <button class="action-btn" onclick="executeAction('remote-demo')">
                    🌐 REMOTE<br>DEMO
                </button>
                <button class="action-btn ultimate" onclick="executeAction('ultimate-mode')">
                    🌟 ULTIMATE<br>MODE
                </button>
            </div>
            
            <div class="status-display">
                <h3>🎯 System Status</h3>
                <div id="systemStatus">
                    <div class="status-item">
                        <span>Overall:</span>
                        <span class="status-online">Operational</span>
                    </div>
                    <div class="status-item">
                        <span>Uptime:</span>
                        <span id="uptime">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:3334');
        const terminal = document.getElementById('terminal');
        const commandInput = document.getElementById('commandInput');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'welcome':
                    appendToTerminal(data.message, 'success');
                    break;
                case 'result':
                    appendToTerminal(\`> \${data.command}\`, 'command');
                    appendToTerminal(data.result.output, data.result.success ? 'success' : 'error');
                    break;
                case 'error':
                    appendToTerminal(data.message, 'error');
                    break;
                case 'status-update':
                    updateSystemStatus(data.status);
                    break;
            }
        };
        
        function appendToTerminal(text, type = '') {
            const div = document.createElement('div');
            div.className = \`terminal-output \${type}\`;
            div.textContent = text;
            terminal.appendChild(div);
            terminal.scrollTop = terminal.scrollHeight;
        }
        
        function executeCommand(command) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ command }));
                commandInput.value = '';
            } else {
                appendToTerminal('WebSocket not connected. Refresh page.', 'error');
            }
        }
        
        async function executeAction(action) {
            try {
                const response = await fetch(\`/api/quick/\${action}\`, {
                    method: 'POST'
                });
                const result = await response.json();
                
                appendToTerminal(\`> Quick Action: \${action}\`, 'command');
                appendToTerminal(result.output || result.error || 'Action completed', 
                    result.success ? 'success' : 'error');
            } catch (error) {
                appendToTerminal(\`Error executing \${action}: \${error.message}\`, 'error');
            }
        }
        
        function updateSystemStatus(status) {
            const statusDiv = document.getElementById('systemStatus');
            const uptimeSpan = document.getElementById('uptime');
            
            if (uptimeSpan) {
                uptimeSpan.textContent = \`\${Math.floor(status.uptime / 60)}m \${Math.floor(status.uptime % 60)}s\`;
            }
            
            // Update component status
            let statusHTML = \`
                <div class="status-item">
                    <span>Overall:</span>
                    <span class="status-\${status.overall === 'operational' ? 'online' : 'offline'}">\${status.overall}</span>
                </div>
                <div class="status-item">
                    <span>Uptime:</span>
                    <span id="uptime">\${Math.floor(status.uptime / 60)}m \${Math.floor(status.uptime % 60)}s</span>
                </div>
            \`;
            
            if (status.components) {
                Object.entries(status.components).forEach(([name, info]) => {
                    statusHTML += \`
                        <div class="status-item">
                            <span>\${name}:</span>
                            <span class="status-\${info.status === 'online' ? 'online' : 'offline'}">\${info.status}</span>
                        </div>
                    \`;
                });
            }
            
            statusDiv.innerHTML = statusHTML;
        }
        
        // Command input handling
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = commandInput.value.trim();
                if (command) {
                    executeCommand(command);
                }
            }
        });
        
        // Focus command input
        commandInput.focus();
        
        // Auto-scroll terminal
        setInterval(() => {
            terminal.scrollTop = terminal.scrollHeight;
        }, 1000);
        
        console.log('🔥 Bash System Dashboard loaded!');
    </script>
</body>
</html>`;
  }

  startServer() {
    this.app.listen(this.port, () => {
      console.log(`
🎉 BASH LOCALHOST INTERFACE READY! 🎉

🌐 Web Dashboard: http://localhost:${this.port}
⚡ WebSocket Terminal: ws://localhost:3334
📊 Live System Monitoring Active

Ready to bash through everything! 🔥
      `);
    });
  }
}

// Start the interface
if (require.main === module) {
  new BashLocalhostInterface();
}

module.exports = BashLocalhostInterface;