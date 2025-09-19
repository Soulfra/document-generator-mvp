#!/usr/bin/env node

/**
 * Frogger Terminal Game
 * Watch your API calls leap through endpoints in glorious ASCII!
 */

const blessed = require('blessed');
const axios = require('axios');

class FroggerTerminalGame {
  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Frogger API Agility Course'
    });
    
    this.stats = {
      attempts: 0,
      successes: 0,
      combo: 0,
      treasure: 0
    };
    
    this.platforms = [];
    this.characterPosition = 0;
    this.isJumping = false;
    
    this.setupUI();
    this.setupKeybindings();
    this.connectToRouter();
  }

  setupUI() {
    // Title
    this.titleBox = blessed.box({
      top: 0,
      left: 'center',
      width: '100%',
      height: 3,
      content: '{center}🐸 FROGGER API AGILITY COURSE 🐸{/center}',
      tags: true,
      style: {
        fg: 'green',
        bold: true
      }
    });

    // Game area
    this.gameArea = blessed.box({
      top: 3,
      left: 0,
      width: '100%',
      height: '60%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'cyan'
        }
      }
    });

    // ASCII art platforms
    this.asciiCourse = blessed.box({
      parent: this.gameArea,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      tags: true
    });

    // Stats panel
    this.statsBox = blessed.box({
      top: 3,
      right: 0,
      width: 30,
      height: 10,
      label: ' Stats ',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'yellow'
        }
      }
    });

    // Console output
    this.console = blessed.log({
      bottom: 0,
      left: 0,
      width: '100%',
      height: '30%',
      label: ' Console ',
      border: {
        type: 'line'
      },
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      style: {
        border: {
          fg: 'green'
        }
      }
    });

    // Keybindings help
    this.helpBox = blessed.box({
      bottom: 0,
      right: 0,
      width: 30,
      height: 8,
      label: ' Controls ',
      content: 'SPACE - Jump\nR - Reset\nS - Sound Toggle\nP - Pause\n1-4 - Switch Tier\nQ - Quit',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'magenta'
        }
      }
    });

    // Add all to screen
    this.screen.append(this.titleBox);
    this.screen.append(this.gameArea);
    this.screen.append(this.statsBox);
    this.screen.append(this.console);
    this.screen.append(this.helpBox);

    // Initialize platforms
    this.initializePlatforms();
    this.updateDisplay();
  }

  initializePlatforms() {
    this.platforms = [
      { name: 'BRONZE-1', tier: 'bronze', position: 10, symbol: '[B]' },
      { name: 'BRONZE-2', tier: 'bronze', position: 25, symbol: '[B]' },
      { name: 'BRONZE-3', tier: 'bronze', position: 40, symbol: '[B]' },
      { name: 'IRON-1', tier: 'iron', position: 55, symbol: '[I]' },
      { name: 'IRON-2', tier: 'iron', position: 70, symbol: '[I]' },
      { name: 'STEEL-1', tier: 'steel', position: 85, symbol: '[S]' },
      { name: 'MITHRIL', tier: 'mithril', position: 100, symbol: '[M]' }
    ];
  }

  updateDisplay() {
    // Clear game area
    let display = '';
    
    // Draw the course
    const courseWidth = this.gameArea.width - 4;
    const courseHeight = this.gameArea.height - 4;
    
    // Sky
    for (let i = 0; i < courseHeight / 3; i++) {
      display += ' '.repeat(courseWidth) + '\n';
    }
    
    // Character layer
    let characterLine = '';
    for (let i = 0; i < courseWidth; i++) {
      if (i === Math.floor(this.characterPosition * courseWidth / 110)) {
        characterLine += this.isJumping ? '🦘' : '🐸';
      } else {
        characterLine += ' ';
      }
    }
    display += characterLine + '\n';
    
    // Jump arc visualization
    if (this.isJumping) {
      display += ' '.repeat(Math.floor(this.characterPosition * courseWidth / 110)) + '˜˜˜\n';
    } else {
      display += '\n';
    }
    
    // Platform layer
    let platformLine = '';
    let labelLine = '';
    
    for (let i = 0; i < courseWidth; i++) {
      const platform = this.platforms.find(p => 
        Math.floor(p.position * courseWidth / 110) === i
      );
      
      if (platform) {
        platformLine += '▓▓▓';
        labelLine += platform.symbol;
        i += 2;
      } else {
        platformLine += ' ';
        labelLine += ' ';
      }
    }
    
    display += '\n' + platformLine + '\n' + labelLine + '\n';
    
    // Ground
    display += '═'.repeat(courseWidth) + '\n';
    
    // Progress bar
    const progress = Math.floor(this.characterPosition / 110 * courseWidth);
    display += '\n[' + '█'.repeat(progress) + '░'.repeat(courseWidth - progress - 2) + ']\n';
    display += `Progress: ${Math.floor(this.characterPosition / 110 * 100)}%`;
    
    this.asciiCourse.setContent(display);
    
    // Update stats
    this.updateStats();
    
    this.screen.render();
  }

  updateStats() {
    const successRate = this.stats.attempts > 0 
      ? (this.stats.successes / this.stats.attempts * 100).toFixed(1)
      : 0;
    
    const statsContent = `
Attempts: ${this.stats.attempts}
Successes: ${this.stats.successes}
Success Rate: ${successRate}%
Current Combo: ${this.stats.combo}x
Treasure: ${this.stats.treasure} 🏆
    `.trim();
    
    this.statsBox.setContent(statsContent);
  }

  jump(targetPlatform) {
    if (this.isJumping) return;
    
    this.isJumping = true;
    this.log(`Jumping to ${targetPlatform.name}...`, 'info');
    
    // Animate jump
    const startPos = this.characterPosition;
    const endPos = targetPlatform.position;
    const steps = 10;
    let currentStep = 0;
    
    const jumpInterval = setInterval(() => {
      currentStep++;
      
      // Interpolate position
      this.characterPosition = startPos + (endPos - startPos) * (currentStep / steps);
      
      // Add jump arc effect
      if (currentStep === steps / 2) {
        this.isJumping = true;
      }
      
      this.updateDisplay();
      
      if (currentStep >= steps) {
        clearInterval(jumpInterval);
        this.isJumping = false;
        this.landOnPlatform(targetPlatform);
      }
    }, 50);
  }

  landOnPlatform(platform) {
    this.stats.attempts++;
    
    // Simulate API call
    const success = Math.random() > 0.2; // 80% success rate
    
    if (success) {
      this.stats.successes++;
      this.stats.combo++;
      this.stats.treasure++;
      
      this.log(`✓ SUCCESS: ${platform.name} responded!`, 'success');
      
      if (this.stats.combo % 5 === 0) {
        this.log(`⚡ COMBO x${this.stats.combo}! Bonus points!`, 'warning');
        this.stats.treasure += 5;
      }
    } else {
      this.stats.combo = 0;
      this.log(`✗ FAILED: ${platform.name} rate limited!`, 'error');
    }
    
    this.updateDisplay();
    
    // Auto-continue
    if (this.characterPosition < 100) {
      setTimeout(() => this.autoJump(), 1000);
    } else {
      this.log('🏁 Course complete! Press R to restart.', 'info');
    }
  }

  autoJump() {
    const nextPlatform = this.platforms.find(p => p.position > this.characterPosition);
    if (nextPlatform) {
      this.jump(nextPlatform);
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '{cyan-fg}',
      success: '{green-fg}',
      error: '{red-fg}',
      warning: '{yellow-fg}'
    };
    
    const color = colors[type] || '';
    this.console.log(`${color}[${timestamp}] ${message}{/}`);
  }

  setupKeybindings() {
    this.screen.key(['space'], () => {
      const nextPlatform = this.platforms.find(p => p.position > this.characterPosition);
      if (nextPlatform && !this.isJumping) {
        this.jump(nextPlatform);
      }
    });

    this.screen.key(['r', 'R'], () => {
      this.reset();
    });

    this.screen.key(['q', 'Q', 'escape'], () => {
      return process.exit(0);
    });

    this.screen.key(['p', 'P'], () => {
      this.paused = !this.paused;
      this.log(this.paused ? 'Game PAUSED' : 'Game RESUMED', 'warning');
    });

    this.screen.key(['1', '2', '3', '4'], (ch) => {
      const tiers = ['bronze', 'iron', 'steel', 'mithril'];
      const tier = tiers[parseInt(ch) - 1];
      this.log(`Switched to ${tier.toUpperCase()} tier`, 'info');
    });
  }

  reset() {
    this.characterPosition = 0;
    this.stats = {
      attempts: 0,
      successes: 0,
      combo: 0,
      treasure: 0
    };
    this.isJumping = false;
    this.log('Game reset!', 'info');
    this.updateDisplay();
  }

  connectToRouter() {
    // Try to connect to real router
    this.log('Connecting to Frogger Router...', 'info');
    
    const checkConnection = async () => {
      try {
        const response = await axios.get('http://localhost:3456/health');
        this.log('Connected to Frogger Router!', 'success');
        this.startRealTimeMode();
      } catch (error) {
        this.log('Running in demo mode', 'warning');
        setTimeout(() => this.autoJump(), 2000);
      }
    };
    
    setTimeout(checkConnection, 1000);
  }

  startRealTimeMode() {
    // Connect to WebSocket for real-time updates
    try {
      const WebSocket = require('ws');
      const ws = new WebSocket('ws://localhost:8081');
      
      ws.on('open', () => {
        this.log('WebSocket connected!', 'success');
      });
      
      ws.on('message', (data) => {
        const event = JSON.parse(data);
        
        if (event.type === 'api-call') {
          // Find matching platform
          const platform = this.platforms.find(p => 
            p.name.toLowerCase().includes(event.endpoint.toLowerCase())
          );
          
          if (platform) {
            this.jump(platform);
          }
        }
      });
      
      ws.on('error', () => {
        this.log('WebSocket error - continuing in demo mode', 'warning');
      });
    } catch (error) {
      this.log('WebSocket not available', 'warning');
    }
  }

  start() {
    this.log('🐸 Frogger Terminal Game started!', 'success');
    this.log('Press SPACE to jump manually, or watch the auto-pilot', 'info');
    this.screen.render();
  }
}

// Check if blessed is installed
try {
  require.resolve('blessed');
} catch (e) {
  console.log('Installing blessed for terminal UI...');
  require('child_process').execSync('npm install blessed', { stdio: 'inherit' });
}

// Start the game
const game = new FroggerTerminalGame();
game.start();