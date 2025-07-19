#!/usr/bin/env node

/**
 * TMUX ORCHESTRATOR - Session Management
 * Manage tmux sessions for character orchestration
 * Each character gets its own tmux window/pane
 */

console.log(`
🖥️  TMUX ORCHESTRATOR ACTIVE 🖥️ 
Character session management + tmux orchestration
`);

const { spawn, exec } = require('child_process');
const fs = require('fs');

class TmuxOrchestrator {
  constructor() {
    this.sessionName = 'bash-system';
    this.windows = new Map();
    this.panes = new Map();
    this.characters = ['ralph', 'alice', 'bob', 'charlie', 'diana', 'eve', 'frank'];
    this.services = ['vault', 'api', 'brain', 'dashboard'];
    
    this.initializeTmuxConfig();
  }

  // Initialize tmux configuration
  initializeTmuxConfig() {
    this.tmuxConfig = {
      sessionName: this.sessionName,
      baseIndex: 1,
      mouseSupport: true,
      statusPosition: 'bottom',
      statusLeft: '#[fg=green]#S #[fg=yellow]#I:#P',
      statusRight: '#[fg=cyan]%H:%M:%S #[fg=blue]%Y-%m-%d',
      windows: {
        'conductor': {
          name: 'Conductor',
          panes: [
            { name: 'main', command: 'node start-bash-system.js' }
          ]
        },
        'characters': {
          name: 'Characters',
          panes: [
            { name: 'ralph', command: 'node -e "console.log(\'🔥 RALPH READY\'); setInterval(() => console.log(\'BASH!\'), 5000)"' },
            { name: 'alice', command: 'node -e "console.log(\'🤓 ALICE READY\'); setInterval(() => console.log(\'ANALYZE!\'), 7000)"' },
            { name: 'bob', command: 'node -e "console.log(\'🔧 BOB READY\'); setInterval(() => console.log(\'BUILD!\'), 6000)"' },
            { name: 'charlie', command: 'node -e "console.log(\'🛡️ CHARLIE READY\'); setInterval(() => console.log(\'SECURE!\'), 8000)"' }
          ]
        },
        'services': {
          name: 'Services',
          panes: [
            { name: 'vault', command: 'node vibecoding-vault.js' },
            { name: 'api', command: 'node bash-system-integration.js' },
            { name: 'brain', command: 'node layer-23-brain-layer.js' },
            { name: 'dashboard', command: 'python3 -m http.server 8080' }
          ]
        },
        'monitoring': {
          name: 'Monitoring',
          panes: [
            { name: 'logs', command: 'tail -f *.log' },
            { name: 'system', command: 'watch -n 1 "ps aux | grep node"' },
            { name: 'network', command: 'watch -n 2 "netstat -tlnp | grep :300"' }
          ]
        }
      }
    };

    console.log('🖥️  Tmux configuration initialized');
  }

  // Check if tmux is available
  async checkTmux() {
    return new Promise((resolve) => {
      exec('which tmux', (error, stdout) => {
        if (error) {
          console.error('❌ tmux not found. Please install tmux first.');
          resolve(false);
        } else {
          console.log('✅ tmux found at:', stdout.trim());
          resolve(true);
        }
      });
    });
  }

  // Create tmux session
  async createSession() {
    if (!(await this.checkTmux())) {
      throw new Error('tmux not available');
    }

    console.log(`🚀 Creating tmux session: ${this.sessionName}`);
    
    // Kill existing session if it exists
    await this.killSession();

    // Create new session
    const createCommand = `tmux new-session -d -s ${this.sessionName} -x 120 -y 40`;
    await this.execCommand(createCommand);

    // Configure session
    await this.configureSession();

    // Create windows
    await this.createWindows();

    console.log(`✅ Tmux session '${this.sessionName}' created`);
    return this.sessionName;
  }

  // Configure tmux session
  async configureSession() {
    const commands = [
      `tmux set-option -t ${this.sessionName} base-index ${this.tmuxConfig.baseIndex}`,
      `tmux set-option -t ${this.sessionName} mouse on`,
      `tmux set-option -t ${this.sessionName} status-position ${this.tmuxConfig.statusPosition}`,
      `tmux set-option -t ${this.sessionName} status-left "${this.tmuxConfig.statusLeft}"`,
      `tmux set-option -t ${this.sessionName} status-right "${this.tmuxConfig.statusRight}"`,
      `tmux set-option -t ${this.sessionName} status-style "fg=white,bg=black"`,
      `tmux set-option -t ${this.sessionName} window-status-current-style "fg=black,bg=green"`
    ];

    for (const command of commands) {
      await this.execCommand(command);
    }

    console.log('⚙️  Session configured');
  }

  // Create windows and panes
  async createWindows() {
    const windows = Object.entries(this.tmuxConfig.windows);
    
    for (let i = 0; i < windows.length; i++) {
      const [windowKey, windowConfig] = windows[i];
      const windowIndex = i + 1;
      
      if (i === 0) {
        // Rename first window
        await this.execCommand(`tmux rename-window -t ${this.sessionName}:1 "${windowConfig.name}"`);
      } else {
        // Create new window
        await this.execCommand(`tmux new-window -t ${this.sessionName} -n "${windowConfig.name}"`);
      }

      // Create panes in window
      await this.createPanes(windowIndex, windowConfig.panes);
      
      this.windows.set(windowKey, windowIndex);
    }

    console.log('🖼️  Windows and panes created');
  }

  // Create panes in a window
  async createPanes(windowIndex, panes) {
    for (let i = 0; i < panes.length; i++) {
      const pane = panes[i];
      
      if (i === 0) {
        // First pane - send command to existing pane
        await this.execCommand(`tmux send-keys -t ${this.sessionName}:${windowIndex}.1 "${pane.command}" Enter`);
      } else {
        // Split window and create new pane
        const splitCommand = i % 2 === 1 ? 'split-window -h' : 'split-window -v';
        await this.execCommand(`tmux ${splitCommand} -t ${this.sessionName}:${windowIndex}`);
        
        // Send command to new pane
        await this.execCommand(`tmux send-keys -t ${this.sessionName}:${windowIndex}.${i + 1} "${pane.command}" Enter`);
      }
      
      this.panes.set(pane.name, { window: windowIndex, pane: i + 1 });
    }

    // Balance panes
    await this.execCommand(`tmux select-layout -t ${this.sessionName}:${windowIndex} tiled`);
  }

  // Execute command
  async execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Command failed: ${command}`);
          console.error(`Error: ${error.message}`);
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  // Kill existing session
  async killSession() {
    try {
      await this.execCommand(`tmux kill-session -t ${this.sessionName}`);
      console.log(`🗑️  Killed existing session: ${this.sessionName}`);
    } catch (error) {
      // Session doesn't exist, that's fine
    }
  }

  // Attach to session
  async attachSession() {
    console.log(`🔗 Attaching to session: ${this.sessionName}`);
    
    // Use spawn to attach interactively
    const attach = spawn('tmux', ['attach-session', '-t', this.sessionName], {
      stdio: 'inherit'
    });

    attach.on('exit', (code) => {
      console.log(`Session exited with code: ${code}`);
    });

    return attach;
  }

  // Send command to specific character
  async sendCharacterCommand(character, command) {
    const paneInfo = this.panes.get(character);
    if (!paneInfo) {
      throw new Error(`Character '${character}' not found in tmux session`);
    }

    const tmuxCommand = `tmux send-keys -t ${this.sessionName}:${paneInfo.window}.${paneInfo.pane} "${command}" Enter`;
    await this.execCommand(tmuxCommand);
    
    console.log(`📤 Sent to ${character}: ${command}`);
  }

  // List sessions
  async listSessions() {
    try {
      const output = await this.execCommand('tmux list-sessions');
      console.log('📋 Active tmux sessions:');
      console.log(output);
      return output;
    } catch (error) {
      console.log('📋 No active tmux sessions');
      return '';
    }
  }

  // Get session info
  async getSessionInfo() {
    try {
      const windows = await this.execCommand(`tmux list-windows -t ${this.sessionName}`);
      const panes = await this.execCommand(`tmux list-panes -t ${this.sessionName} -a`);
      
      return {
        sessionName: this.sessionName,
        windows: windows.trim().split('\n'),
        panes: panes.trim().split('\n'),
        windowCount: this.windows.size,
        paneCount: this.panes.size
      };
    } catch (error) {
      return null;
    }
  }

  // Create tmux configuration file
  createTmuxConfig() {
    const configPath = './tmux-bash-system.conf';
    const configContent = `
# Bash System tmux configuration
# Mouse support
set -g mouse on

# Status bar
set -g status-position bottom
set -g status-bg black
set -g status-fg white
set -g status-left '#[fg=green]#S #[fg=yellow]#I:#P '
set -g status-right '#[fg=cyan]%H:%M:%S #[fg=blue]%Y-%m-%d'

# Window status
set-window-option -g window-status-current-style fg=black,bg=green

# Pane borders
set -g pane-border-style fg=magenta
set -g pane-active-border-style fg=green

# Start windows and panes at 1
set -g base-index 1
setw -g pane-base-index 1

# Renumber windows when one is closed
set -g renumber-windows on

# Key bindings
bind-key r source-file ~/.tmux.conf \\; display-message "Config reloaded"
bind-key h split-window -h
bind-key v split-window -v

# Vi mode
setw -g mode-keys vi
bind-key -T copy-mode-vi 'v' send -X begin-selection
bind-key -T copy-mode-vi 'y' send -X copy-selection
    `.trim();

    fs.writeFileSync(configPath, configContent);
    console.log(`📝 Tmux config created: ${configPath}`);
    return configPath;
  }

  // Command line interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'create':
        await this.createSession();
        break;

      case 'attach':
        await this.attachSession();
        break;

      case 'kill':
        await this.killSession();
        break;

      case 'list':
        await this.listSessions();
        break;

      case 'info':
        const info = await this.getSessionInfo();
        if (info) {
          console.log('📊 Session Info:');
          console.log(JSON.stringify(info, null, 2));
        } else {
          console.log('❌ Session not found');
        }
        break;

      case 'send':
        const character = args[1];
        const cmd = args.slice(2).join(' ');
        if (!character || !cmd) {
          console.error('❌ Usage: send <character> <command>');
          process.exit(1);
        }
        await this.sendCharacterCommand(character, cmd);
        break;

      case 'config':
        this.createTmuxConfig();
        break;

      case 'full':
        console.log('🚀 Full tmux orchestration setup...');
        await this.createSession();
        console.log('🔗 Attaching to session...');
        await this.attachSession();
        break;

      default:
        console.log(`
🖥️  Tmux Orchestrator

Usage:
  node tmux-orchestrator.js create                 # Create tmux session
  node tmux-orchestrator.js attach                 # Attach to session
  node tmux-orchestrator.js kill                   # Kill session
  node tmux-orchestrator.js list                   # List sessions
  node tmux-orchestrator.js info                   # Show session info
  node tmux-orchestrator.js send <char> <cmd>      # Send command to character
  node tmux-orchestrator.js config                 # Create tmux config
  node tmux-orchestrator.js full                   # Create and attach

Examples:
  node tmux-orchestrator.js create                 # Create bash-system session
  node tmux-orchestrator.js send ralph "BASH!"     # Send command to Ralph
  node tmux-orchestrator.js attach                 # Attach to session
        `);
    }
  }
}

// Export for use as module
module.exports = TmuxOrchestrator;

// Run CLI if called directly
if (require.main === module) {
  const orchestrator = new TmuxOrchestrator();
  orchestrator.cli().catch(console.error);
}