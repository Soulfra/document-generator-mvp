#!/usr/bin/env node

/**
 * VISUAL CHAOS STREAM SYSTEM
 * Bash until everything breaks with visual warnings and interactive actions
 * Real-time streams • Context window warnings • Login buttons • Wake up Cal
 */

console.log(`
⚠️ VISUAL CHAOS STREAM ACTIVE ⚠️
Bashing until things break with visual feedback
Interactive warnings • Login actions • Wake up streams
`);

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;

class VisualChaosStream extends EventEmitter {
  constructor() {
    super();
    this.chaosLevel = 0;
    this.breakagePoints = new Map();
    this.visualStreams = new Map();
    this.warningSystem = new Map();
    this.actionButtons = new Map();
    this.contextWindows = new Map();
    this.timingIssues = new Map();
    this.calState = 'sleeping';
    this.loginAttempts = 0;
    
    this.initializeChaosSystem();
    this.createVisualStreams();
    this.setupWarningSystem();
    this.buildActionButtons();
    this.enableContextWindowWarnings();
    this.createInteractiveInterface();
  }

  initializeChaosSystem() {
    console.log('💥 Initializing chaos system...');
    
    this.chaosSystem = {
      // Spam bash until things break
      spamBash: async (intensity = 1) => {
        console.log(`🔥 SPAM BASHING at intensity ${intensity}...`);
        
        this.chaosLevel += intensity;
        const bashCommands = [
          'npm run ralph',
          'npm run max',
          'npm run infinity',
          'npm run ultimate',
          'npm run chaos',
          'npm run bash-everything'
        ];
        
        // Spam all commands simultaneously
        const promises = [];
        for (let i = 0; i < intensity * 5; i++) {
          const command = bashCommands[Math.floor(Math.random() * bashCommands.length)];
          promises.push(this.executeBashCommand(command, i));
        }
        
        // Watch for breakage
        Promise.allSettled(promises).then(results => {
          this.analyzeBreakage(results);
        });
        
        // Update visual streams
        this.updateVisualStream('chaos-level', {
          level: this.chaosLevel,
          intensity,
          status: 'BASHING',
          timestamp: new Date()
        });
        
        return { 
          chaosLevel: this.chaosLevel, 
          commandsSpammed: promises.length,
          status: 'MAXIMUM_CHAOS'
        };
      },
      
      // Intentionally break things
      breakThings: async (target = 'random') => {
        console.log(`💥 INTENTIONALLY BREAKING: ${target}`);
        
        const breakMethods = {
          'memory': () => this.consumeAllMemory(),
          'processes': () => this.spawnInfiniteProcesses(),
          'context': () => this.overflowContextWindows(),
          'timing': () => this.createTimingChaos(),
          'ralph': () => this.unleashMaximumRalph(),
          'random': () => this.randomBreakage()
        };
        
        const breakage = await breakMethods[target]();
        this.recordBreakage(target, breakage);
        
        return breakage;
      },
      
      // Detect when things are broken
      detectBreakage: () => {
        const breakageIndicators = {
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          processCount: this.getProcessCount(),
          contextWindows: this.contextWindows.size,
          timingDelays: this.calculateTimingDelays(),
          ralphChaosLevel: this.getRalphChaosLevel()
        };
        
        const broken = Object.entries(breakageIndicators).filter(([key, value]) => {
          const thresholds = {
            memoryUsage: 500, // MB
            processCount: 50,
            contextWindows: 20,
            timingDelays: 5000, // ms
            ralphChaosLevel: 100
          };
          return value > thresholds[key];
        });
        
        if (broken.length > 0) {
          this.triggerBreakageWarning(broken);
        }
        
        return { broken: broken.length > 0, indicators: breakageIndicators, brokenItems: broken };
      }
    };

    console.log('💥 Chaos system ready');
  }

  createVisualStreams() {
    console.log('📺 Creating visual streams...');
    
    this.visualStreamSystem = {
      // Create real-time visual streams
      createStream: (streamId, config = {}) => {
        const stream = {
          id: streamId,
          type: config.type || 'text',
          buffer: [],
          maxBuffer: config.maxBuffer || 100,
          visualElements: [],
          warnings: [],
          actions: [],
          created: new Date(),
          active: true,
          
          // Stream methods
          push: (data) => {
            const entry = {
              id: crypto.randomUUID(),
              data,
              timestamp: new Date(),
              level: data.level || 'info'
            };
            
            stream.buffer.push(entry);
            if (stream.buffer.length > stream.maxBuffer) {
              stream.buffer.shift();
            }
            
            // Update visual elements
            this.updateStreamVisual(streamId, entry);
            
            // Check for warnings
            if (data.level === 'warning' || data.level === 'error') {
              this.addStreamWarning(streamId, entry);
            }
          },
          
          getHTML: () => this.generateStreamHTML(stream),
          clear: () => { stream.buffer = []; stream.warnings = []; }
        };
        
        this.visualStreams.set(streamId, stream);
        console.log(`📺 Visual stream created: ${streamId}`);
        return stream;
      },
      
      // Update stream with visual feedback
      updateStream: (streamId, data) => {
        const stream = this.visualStreams.get(streamId);
        if (stream) {
          stream.push(data);
          this.emit('streamUpdate', { streamId, data });
        }
      },
      
      // Get all streams for display
      getAllStreams: () => Array.from(this.visualStreams.values())
    };

    // Create default streams
    this.visualStreamSystem.createStream('chaos-level', { type: 'chart', maxBuffer: 50 });
    this.visualStreamSystem.createStream('system-status', { type: 'status', maxBuffer: 20 });
    this.visualStreamSystem.createStream('ralph-activity', { type: 'log', maxBuffer: 30 });
    this.visualStreamSystem.createStream('cal-status', { type: 'character', maxBuffer: 15 });
    this.visualStreamSystem.createStream('warnings', { type: 'alert', maxBuffer: 25 });
    
    console.log('📺 Visual streams ready');
  }

  setupWarningSystem() {
    console.log('⚠️ Setting up warning system...');
    
    this.warningSystem = {
      // Create interactive warnings
      createWarning: (type, message, severity = 'medium', actions = []) => {
        const warningId = crypto.randomUUID();
        const warning = {
          id: warningId,
          type,
          message,
          severity,
          actions,
          created: new Date(),
          acknowledged: false,
          
          // Visual properties
          color: this.getWarningColor(severity),
          icon: this.getWarningIcon(type),
          animation: this.getWarningAnimation(severity),
          
          // Interactive methods
          acknowledge: () => {
            warning.acknowledged = true;
            this.emit('warningAcknowledged', warning);
          },
          
          escalate: () => {
            warning.severity = 'critical';
            warning.color = this.getWarningColor('critical');
            this.emit('warningEscalated', warning);
          }
        };
        
        this.warningSystem.set(warningId, warning);
        
        // Add to visual streams
        this.visualStreamSystem.updateStream('warnings', {
          level: 'warning',
          message,
          severity,
          actions,
          warningId
        });
        
        console.log(`⚠️ Warning created: ${type} - ${message}`);
        return warning;
      },
      
      // Context window warnings
      contextWindowWarning: (windowCount, threshold = 10) => {
        if (windowCount > threshold) {
          return this.warningSystem.createWarning(
            'context-overflow',
            `Too many context windows: ${windowCount}/${threshold}`,
            'high',
            [
              { label: 'Close Windows', action: 'closeContextWindows' },
              { label: 'Increase Limit', action: 'increaseContextLimit' },
              { label: 'Emergency Reset', action: 'emergencyReset' }
            ]
          );
        }
      },
      
      // Timing warnings
      timingWarning: (delay, threshold = 2000) => {
        if (delay > threshold) {
          return this.warningSystem.createWarning(
            'timing-issue',
            `System timing off by ${delay}ms`,
            'medium',
            [
              { label: 'Sync Timing', action: 'syncTiming' },
              { label: 'Restart Services', action: 'restartServices' },
              { label: 'Ignore', action: 'ignoreWarning' }
            ]
          );
        }
      },
      
      // Ralph chaos warnings
      ralphChaosWarning: (chaosLevel) => {
        if (chaosLevel > 80) {
          return this.warningSystem.createWarning(
            'ralph-chaos',
            `Ralph chaos level critical: ${chaosLevel}%`,
            'critical',
            [
              { label: 'Deploy Charlie', action: 'deployCharlie' },
              { label: 'Emergency Containment', action: 'emergencyContainment' },
              { label: 'Let Ralph Bash', action: 'letRalphBash' }
            ]
          );
        }
      }
    };

    console.log('⚠️ Warning system ready');
  }

  buildActionButtons() {
    console.log('🔘 Building action buttons...');
    
    this.actionButtonSystem = {
      // Create interactive buttons
      createButton: (buttonId, config) => {
        const button = {
          id: buttonId,
          label: config.label,
          icon: config.icon || '🔘',
          action: config.action,
          type: config.type || 'primary',
          disabled: config.disabled || false,
          cooldown: config.cooldown || 0,
          lastUsed: null,
          
          // Visual states
          states: {
            normal: config.normalState || 'ready',
            hover: config.hoverState || 'highlighted',
            active: config.activeState || 'pressed',
            disabled: config.disabledState || 'grayed'
          },
          
          // Execute action
          execute: async () => {
            if (button.disabled || this.isOnCooldown(button)) {
              return { error: 'Button not available' };
            }
            
            button.lastUsed = new Date();
            console.log(`🔘 Button pressed: ${button.label}`);
            
            // Update visual feedback
            this.updateButtonVisual(buttonId, 'active');
            
            // Execute the action
            const result = await this.executeButtonAction(button.action);
            
            // Reset visual state
            setTimeout(() => {
              this.updateButtonVisual(buttonId, 'normal');
            }, 200);
            
            return result;
          },
          
          getHTML: () => this.generateButtonHTML(button)
        };
        
        this.actionButtons.set(buttonId, button);
        console.log(`🔘 Action button created: ${button.label}`);
        return button;
      }
    };

    // Create essential action buttons
    this.createEssentialButtons();
    
    console.log('🔘 Action buttons ready');
  }

  createEssentialButtons() {
    // Login button
    this.actionButtonSystem.createButton('login', {
      label: 'Emergency Login',
      icon: '🔑',
      action: 'emergencyLogin',
      type: 'critical'
    });
    
    // Wake up Cal button
    this.actionButtonSystem.createButton('wake-cal', {
      label: 'Wake Up Cal',
      icon: '🎯',
      action: 'wakeCal',
      type: 'character'
    });
    
    // Deploy Charlie button
    this.actionButtonSystem.createButton('deploy-charlie', {
      label: 'Deploy Charlie',
      icon: '🛡️',
      action: 'deployCharlie',
      type: 'protection'
    });
    
    // Emergency bash button
    this.actionButtonSystem.createButton('emergency-bash', {
      label: 'EMERGENCY BASH',
      icon: '💥',
      action: 'emergencyBash',
      type: 'chaos',
      cooldown: 5000
    });
    
    // Break everything button
    this.actionButtonSystem.createButton('break-everything', {
      label: 'Break Everything',
      icon: '💀',
      action: 'breakEverything',
      type: 'destructive',
      cooldown: 10000
    });
    
    // Reset system button
    this.actionButtonSystem.createButton('reset-system', {
      label: 'Emergency Reset',
      icon: '🔄',
      action: 'emergencyReset',
      type: 'recovery'
    });
  }

  enableContextWindowWarnings() {
    console.log('🪟 Enabling context window warnings...');
    
    this.contextWindowManager = {
      // Monitor context windows
      monitor: () => {
        setInterval(() => {
          const contextCount = this.contextWindows.size;
          const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
          
          // Check thresholds
          if (contextCount > 10) {
            this.warningSystem.contextWindowWarning(contextCount);
          }
          
          if (memoryUsage > 200) {
            this.warningSystem.createWarning(
              'memory-usage',
              `High memory usage: ${memoryUsage.toFixed(1)}MB`,
              'high',
              [
                { label: 'Garbage Collect', action: 'forceGC' },
                { label: 'Clear Cache', action: 'clearCache' }
              ]
            );
          }
          
          // Update streams
          this.visualStreamSystem.updateStream('system-status', {
            contextWindows: contextCount,
            memoryUsage: memoryUsage.toFixed(1),
            level: contextCount > 10 ? 'warning' : 'info'
          });
        }, 2000);
      },
      
      // Create context window
      createWindow: (content, type = 'normal') => {
        const windowId = crypto.randomUUID();
        const window = {
          id: windowId,
          content,
          type,
          created: new Date(),
          size: content.length,
          
          close: () => {
            this.contextWindows.delete(windowId);
            this.visualStreamSystem.updateStream('system-status', {
              message: `Context window closed: ${windowId}`,
              level: 'info'
            });
          }
        };
        
        this.contextWindows.set(windowId, window);
        
        // Immediate warning if too many
        if (this.contextWindows.size > 15) {
          this.warningSystem.contextWindowWarning(this.contextWindows.size, 15);
        }
        
        return window;
      }
    };

    // Start monitoring
    this.contextWindowManager.monitor();
    
    console.log('🪟 Context window warnings enabled');
  }

  createInteractiveInterface() {
    console.log('🖥️ Creating interactive interface...');
    
    this.interface = {
      // Generate complete HTML interface
      generateHTML: () => {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚠️ Visual Chaos Stream - Live System Monitor</title>
    ${this.generateCSS()}
</head>
<body>
    <div class="chaos-interface">
        <header class="chaos-header">
            <h1>⚠️ VISUAL CHAOS STREAM</h1>
            <div class="chaos-level">
                <span>Chaos Level: </span>
                <span id="chaos-meter" class="chaos-meter">${this.chaosLevel}</span>
            </div>
        </header>
        
        <div class="main-grid">
            <div class="streams-panel">
                <h2>📺 Live Streams</h2>
                ${this.generateStreamsHTML()}
            </div>
            
            <div class="warnings-panel">
                <h2>⚠️ Active Warnings</h2>
                ${this.generateWarningsHTML()}
            </div>
            
            <div class="actions-panel">
                <h2>🔘 Emergency Actions</h2>
                ${this.generateActionsHTML()}
            </div>
            
            <div class="status-panel">
                <h2>📊 System Status</h2>
                ${this.generateStatusHTML()}
            </div>
        </div>
        
        <div class="cal-interaction">
            ${this.generateCalInterface()}
        </div>
    </div>
    ${this.generateJavaScript()}
</body>
</html>`;
      },
      
      // Real-time updates via WebSocket
      startWebSocket: () => {
        const WebSocket = require('ws');
        const wss = new WebSocket.Server({ port: 3336 });
        
        wss.on('connection', (ws) => {
          console.log('🔌 Chaos stream client connected');
          
          // Send initial state
          ws.send(JSON.stringify({
            type: 'initial-state',
            chaosLevel: this.chaosLevel,
            streams: this.visualStreamSystem.getAllStreams(),
            warnings: Array.from(this.warningSystem.values()),
            calState: this.calState
          }));
          
          // Listen for events and broadcast updates
          this.on('streamUpdate', (data) => {
            ws.send(JSON.stringify({ type: 'stream-update', ...data }));
          });
          
          this.on('warningCreated', (warning) => {
            ws.send(JSON.stringify({ type: 'warning-created', warning }));
          });
          
          this.on('chaosLevelChanged', (level) => {
            ws.send(JSON.stringify({ type: 'chaos-level', level }));
          });
        });
        
        console.log('🔌 WebSocket server started on port 3336');
        return wss;
      }
    };

    console.log('🖥️ Interactive interface ready');
  }

  // Action implementations
  async executeButtonAction(action) {
    console.log(`⚡ Executing action: ${action}`);
    
    const actions = {
      'emergencyLogin': async () => {
        this.loginAttempts++;
        if (this.loginAttempts > 3) {
          return this.warningSystem.createWarning(
            'login-failed',
            'Too many login attempts!',
            'critical',
            [{ label: 'Reset', action: 'resetLogin' }]
          );
        }
        return { success: true, message: 'Emergency access granted' };
      },
      
      'wakeCal': async () => {
        this.calState = 'awake';
        this.visualStreamSystem.updateStream('cal-status', {
          message: '🎯 Cal is now awake and ready!',
          level: 'success',
          state: this.calState
        });
        return { success: true, message: 'Cal awakened successfully' };
      },
      
      'deployCharlie': async () => {
        return await this.chaosSystem.spamBash(1); // Counter Ralph with controlled bash
      },
      
      'emergencyBash': async () => {
        return await this.chaosSystem.spamBash(5); // Maximum intensity
      },
      
      'breakEverything': async () => {
        return await this.chaosSystem.breakThings('random');
      },
      
      'emergencyReset': async () => {
        this.chaosLevel = 0;
        this.contextWindows.clear();
        this.warningSystem.clear();
        this.calState = 'sleeping';
        return { success: true, message: 'System reset' };
      }
    };
    
    const actionFn = actions[action];
    if (actionFn) {
      return await actionFn();
    }
    
    return { error: 'Unknown action' };
  }

  generateCalInterface() {
    return `
<div class="cal-interface">
    <div class="cal-avatar ${this.calState}">
        <div class="cal-icon">🎯</div>
        <div class="cal-status">Cal is ${this.calState}</div>
    </div>
    <div class="cal-actions">
        <button onclick="wakeCal()" ${this.calState === 'awake' ? 'disabled' : ''}>
            Wake Up Cal
        </button>
        <button onclick="askCal()" ${this.calState === 'sleeping' ? 'disabled' : ''}>
            Ask Cal
        </button>
    </div>
    <div class="cal-chat">
        <input type="text" id="cal-input" placeholder="Talk to Cal..." 
               ${this.calState === 'sleeping' ? 'disabled' : ''}>
        <button onclick="sendToCal()">Send</button>
    </div>
</div>`;
  }

  // Generate CSS
  generateCSS() {
    return `
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

.chaos-interface {
  min-height: 100vh;
  padding: 20px;
}

.chaos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 2px solid #ff6b6b;
  border-radius: 10px;
  background: rgba(255, 107, 107, 0.1);
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

.chaos-header h1 {
  font-size: 2em;
  text-shadow: 0 0 20px #ff6b6b;
}

.chaos-meter {
  font-size: 1.5em;
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 0 0 10px #ff6b6b;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  height: 70vh;
}

.streams-panel, .warnings-panel, .actions-panel, .status-panel {
  border: 2px solid #00ff88;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  overflow-y: auto;
}

.streams-panel h2, .warnings-panel h2, .actions-panel h2, .status-panel h2 {
  margin-bottom: 15px;
  text-shadow: 0 0 10px #00ff88;
}

.stream-item {
  background: rgba(0, 255, 136, 0.1);
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  border-left: 4px solid #00ff88;
}

.stream-item.warning {
  border-left-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.stream-item.error {
  border-left-color: #ff0000;
  background: rgba(255, 0, 0, 0.1);
}

.warning-item {
  background: rgba(255, 107, 107, 0.2);
  padding: 15px;
  margin: 10px 0;
  border-radius: 8px;
  border: 1px solid #ff6b6b;
  animation: blink 1s infinite;
}

.warning-item.critical {
  border-color: #ff0000;
  background: rgba(255, 0, 0, 0.3);
}

.action-button {
  background: linear-gradient(45deg, #4ECDC4, #44A08D);
  color: white;
  border: none;
  padding: 15px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin: 10px 5px;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
  min-width: 150px;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
}

.action-button.critical {
  background: linear-gradient(45deg, #ff6b6b, #ff0000);
}

.action-button.destructive {
  background: linear-gradient(45deg, #ff0000, #8B0000);
  animation: pulse 2s infinite;
}

.action-button.recovery {
  background: linear-gradient(45deg, #27AE60, #2ECC71);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.cal-interface {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #00ff88;
  border-radius: 15px;
  padding: 20px;
  min-width: 300px;
}

.cal-avatar {
  text-align: center;
  margin-bottom: 15px;
}

.cal-avatar .cal-icon {
  font-size: 3em;
  margin-bottom: 10px;
}

.cal-avatar.sleeping .cal-icon {
  opacity: 0.3;
  animation: sleep 3s infinite;
}

.cal-avatar.awake .cal-icon {
  animation: bounce 1s infinite;
}

.cal-status {
  font-size: 0.9em;
  opacity: 0.8;
}

.cal-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.cal-actions button {
  flex: 1;
  background: linear-gradient(45deg, #4ECDC4, #44A08D);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
}

.cal-chat {
  display: flex;
  gap: 10px;
}

.cal-chat input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #00ff88;
  color: #00ff88;
  padding: 8px;
  border-radius: 4px;
}

.cal-chat button {
  background: #00ff88;
  color: black;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

@keyframes sleep {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.timestamp {
  font-size: 0.8em;
  opacity: 0.6;
  float: right;
}

.severity-high {
  color: #ff6b6b;
}

.severity-critical {
  color: #ff0000;
  font-weight: bold;
}

.chaos-level-display {
  background: rgba(255, 107, 107, 0.2);
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
}
</style>`;
  }

  // Generate JavaScript
  generateJavaScript() {
    return `
<script>
// WebSocket connection for real-time updates
const ws = new WebSocket('ws://localhost:3336');

ws.onopen = () => {
  console.log('📡 Connected to chaos stream');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleRealtimeUpdate(data);
};

function handleRealtimeUpdate(data) {
  switch (data.type) {
    case 'stream-update':
      updateStream(data.streamId, data.data);
      break;
    case 'warning-created':
      addWarning(data.warning);
      break;
    case 'chaos-level':
      updateChaosLevel(data.level);
      break;
  }
}

function updateStream(streamId, data) {
  const streamContainer = document.getElementById('stream-' + streamId);
  if (streamContainer) {
    const item = document.createElement('div');
    item.className = 'stream-item ' + (data.level || 'info');
    item.innerHTML = \`
      <div>\${data.message || JSON.stringify(data)}</div>
      <div class="timestamp">\${new Date().toLocaleTimeString()}</div>
    \`;
    streamContainer.appendChild(item);
    
    // Keep only last 10 items
    while (streamContainer.children.length > 10) {
      streamContainer.removeChild(streamContainer.firstChild);
    }
    
    // Auto-scroll
    streamContainer.scrollTop = streamContainer.scrollHeight;
  }
}

function addWarning(warning) {
  const warningsContainer = document.getElementById('warnings-container');
  if (warningsContainer) {
    const item = document.createElement('div');
    item.className = 'warning-item ' + warning.severity;
    item.innerHTML = \`
      <div><strong>\${warning.type}:</strong> \${warning.message}</div>
      <div class="timestamp">\${new Date().toLocaleTimeString()}</div>
      <div class="warning-actions">
        \${warning.actions.map(action => 
          \`<button onclick="executeAction('\${action.action}')">\${action.label}</button>\`
        ).join('')}
      </div>
    \`;
    warningsContainer.appendChild(item);
  }
}

function updateChaosLevel(level) {
  const meter = document.getElementById('chaos-meter');
  if (meter) {
    meter.textContent = level;
    meter.style.color = level > 80 ? '#ff0000' : level > 50 ? '#ff6b6b' : '#00ff88';
  }
}

// Action button handlers
function executeAction(action) {
  console.log('Executing action:', action);
  
  // Send action to backend via WebSocket
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'action', action }));
  }
  
  // Handle specific actions locally
  switch (action) {
    case 'emergencyLogin':
      showLoginPrompt();
      break;
    case 'wakeCal':
      wakeCal();
      break;
    case 'emergencyBash':
      confirmDestructiveAction('Emergency Bash', () => {
        fetch('/api/chaos/bash', { method: 'POST' });
      });
      break;
  }
}

function wakeCal() {
  const calAvatar = document.querySelector('.cal-avatar');
  const calInput = document.getElementById('cal-input');
  const calButtons = document.querySelectorAll('.cal-actions button');
  
  if (calAvatar) {
    calAvatar.classList.remove('sleeping');
    calAvatar.classList.add('awake');
    calAvatar.querySelector('.cal-status').textContent = 'Cal is awake';
  }
  
  if (calInput) calInput.disabled = false;
  calButtons.forEach(btn => {
    if (btn.textContent.includes('Ask Cal')) btn.disabled = false;
  });
  
  // Show Cal wake up message
  updateStream('cal-status', {
    message: '🎯 Cal has awakened! Ready to help.',
    level: 'success'
  });
}

function sendToCal() {
  const input = document.getElementById('cal-input');
  if (input && input.value.trim()) {
    const message = input.value.trim();
    
    // Add user message to stream
    updateStream('cal-status', {
      message: \`You: \${message}\`,
      level: 'info'
    });
    
    // Simulate Cal response
    setTimeout(() => {
      updateStream('cal-status', {
        message: \`🎯 Cal: I can help you with that! Let me fetch the information...\`,
        level: 'success'
      });
    }, 1000);
    
    input.value = '';
  }
}

function confirmDestructiveAction(actionName, callback) {
  if (confirm(\`Are you sure you want to execute: \${actionName}? This may break things!\`)) {
    callback();
  }
}

function showLoginPrompt() {
  const username = prompt('Emergency Login - Username:');
  const password = prompt('Emergency Login - Password:');
  
  if (username && password) {
    updateStream('system-status', {
      message: \`🔑 Emergency login attempt: \${username}\`,
      level: 'warning'
    });
  }
}

// Auto-refresh chaos level
setInterval(() => {
  fetch('/api/chaos/level')
    .then(r => r.json())
    .then(data => updateChaosLevel(data.level))
    .catch(() => {}); // Ignore errors
}, 5000);

console.log('⚠️ Visual Chaos Stream interface loaded');
</script>`;
  }

  // Generate HTML components
  generateStreamsHTML() {
    const streams = this.visualStreamSystem.getAllStreams();
    return streams.map(stream => \`
      <div class="stream-section">
        <h3>\${stream.id}</h3>
        <div id="stream-\${stream.id}" class="stream-container">
          \${stream.buffer.map(item => \`
            <div class="stream-item \${item.level}">
              <div>\${item.data.message || JSON.stringify(item.data)}</div>
              <div class="timestamp">\${item.timestamp.toLocaleTimeString()}</div>
            </div>
          \`).join('')}
        </div>
      </div>
    \`).join('');
  }

  generateWarningsHTML() {
    const warnings = Array.from(this.warningSystem.values());
    return \`
      <div id="warnings-container">
        \${warnings.map(warning => \`
          <div class="warning-item \${warning.severity}">
            <div><strong>\${warning.type}:</strong> \${warning.message}</div>
            <div class="timestamp">\${warning.created.toLocaleTimeString()}</div>
            <div class="warning-actions">
              \${warning.actions.map(action => 
                \`<button onclick="executeAction('\${action.action}')">\${action.label}</button>\`
              ).join('')}
            </div>
          </div>
        \`).join('')}
      </div>
    \`;
  }

  generateActionsHTML() {
    const buttons = Array.from(this.actionButtons.values());
    return buttons.map(button => \`
      <button class="action-button \${button.type}" 
              onclick="executeAction('\${button.action}')"
              \${button.disabled ? 'disabled' : ''}>
        \${button.icon} \${button.label}
      </button>
    \`).join('');
  }

  generateStatusHTML() {
    return \`
      <div class="status-grid">
        <div class="status-item">
          <strong>Chaos Level:</strong> 
          <span class="chaos-level-display">\${this.chaosLevel}</span>
        </div>
        <div class="status-item">
          <strong>Context Windows:</strong> 
          <span>\${this.contextWindows.size}</span>
        </div>
        <div class="status-item">
          <strong>Active Warnings:</strong> 
          <span>\${this.warningSystem.size}</span>
        </div>
        <div class="status-item">
          <strong>Cal State:</strong> 
          <span>\${this.calState}</span>
        </div>
        <div class="status-item">
          <strong>Memory Usage:</strong> 
          <span>\${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB</span>
        </div>
      </div>
    \`;
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'start':
        console.log('\n⚠️ Starting Visual Chaos Stream...');
        
        // Generate interface
        const html = this.interface.generateHTML();
        await fs.writeFile('chaos-stream-interface.html', html);
        
        // Start WebSocket
        this.interface.startWebSocket();
        
        // Start web server
        const express = require('express');
        const app = express();
        app.use(express.static('.'));
        app.get('/', (req, res) => res.sendFile('chaos-stream-interface.html', { root: __dirname }));
        
        const server = app.listen(3337, () => {
          console.log('🌐 Chaos Stream Interface: http://localhost:3337');
          console.log('📡 WebSocket streaming on port 3336');
        });
        
        // Auto-start chaos monitoring
        setTimeout(() => {
          this.chaosSystem.spamBash(2);
        }, 2000);
        
        return server;

      case 'bash':
        const intensity = parseInt(args[1]) || 3;
        console.log(`\n💥 Spam bashing at intensity ${intensity}...`);
        
        const result = await this.chaosSystem.spamBash(intensity);
        console.log(`Chaos level: ${result.chaosLevel}`);
        console.log(`Commands spammed: ${result.commandsSpammed}`);
        break;

      case 'break':
        const target = args[1] || 'random';
        console.log(`\n💀 Breaking ${target}...`);
        
        const breakage = await this.chaosSystem.breakThings(target);
        console.log('Breakage result:', breakage);
        break;

      case 'wake':
        console.log('\n🎯 Waking up Cal...');
        const wakeResult = await this.executeButtonAction('wakeCal');
        console.log('Cal status:', wakeResult);
        break;

      case 'demo':
        console.log('\n⚠️ VISUAL CHAOS STREAM DEMO ⚠️\n');
        
        console.log('1️⃣ Starting chaos interface...');
        await this.cli(['start']);
        
        console.log('\n2️⃣ Spam bashing to create chaos...');
        await this.chaosSystem.spamBash(3);
        
        console.log('\n3️⃣ Breaking things randomly...');
        await this.chaosSystem.breakThings('random');
        
        console.log('\n4️⃣ Waking up Cal...');
        await this.executeButtonAction('wakeCal');
        
        console.log('\n✅ CHAOS DEMO COMPLETE!');
        console.log('🌐 View live chaos at: http://localhost:3337');
        console.log('📡 WebSocket streams on port 3336');
        break;

      default:
        console.log(`
⚠️ Visual Chaos Stream System

Usage:
  node visual-chaos-stream.js start       # Start chaos interface
  node visual-chaos-stream.js bash <intensity>  # Spam bash commands
  node visual-chaos-stream.js break <target>    # Break things
  node visual-chaos-stream.js wake              # Wake up Cal
  node visual-chaos-stream.js demo              # Full chaos demo

🌐 Interface: http://localhost:3337
📡 WebSocket: ws://localhost:3336

⚠️ Features:
  • Real-time visual streams of all chaos
  • Interactive warning system with actions
  • Context window overflow detection
  • Timing issue warnings
  • Emergency action buttons
  • Cal interaction interface
  • Live breakage monitoring

Ready to bash until everything breaks! 💥
        `);
    }
  }
}

// Export for use as module
module.exports = VisualChaosStream;

// Run CLI if called directly
if (require.main === module) {
  const chaos = new VisualChaosStream();
  chaos.cli().catch(console.error);
}