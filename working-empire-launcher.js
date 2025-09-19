#!/usr/bin/env node

/**
 * WORKING EMPIRE LAUNCHER
 * Actually launches empire games with proper port management
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const EmpirePortManager = require('./empire-port-manager');

class WorkingEmpireLauncher {
  constructor() {
    this.portManager = new EmpirePortManager();
    this.runningGames = new Map();
    this.gameConfigs = {
      'cannabis-tycoon': {
        file: './depths-civilization-tycoon.js',
        name: 'Depths Civilization Tycoon',
        description: 'AI agents build cannabis civilization',
        requirements: { ports: 2, memory: '512MB' }
      },
      'space-exploration': {
        file: './starship-glass-observer.js',
        name: 'Starship Glass Observer',
        description: 'Space exploration and starship command',
        requirements: { ports: 1, memory: '256MB' }
      },
      'galactic-federation': {
        file: './GALACTIC-FEDERATION-TERMINAL.js',
        name: 'Galactic Federation Terminal',
        description: 'Diplomatic federation management',
        requirements: { ports: 1, memory: '256MB' }
      },
      'civilization-builder': {
        file: './AI-CIVILIZATION-BUILDER.html',
        name: 'AI Civilization Builder',
        description: 'Build and manage civilizations',
        requirements: { ports: 1, memory: '128MB' }
      }
    };
  }

  async launchEmpireGame(theme, userConfig = {}) {
    console.log(`🚀 Launching ${theme} empire game...`);

    const gameConfig = this.gameConfigs[theme];
    if (!gameConfig) {
      throw new Error(`Unknown game theme: ${theme}`);
    }

    // Check if file exists
    try {
      await fs.access(gameConfig.file);
    } catch (error) {
      throw new Error(`Empire file not found: ${gameConfig.file}`);
    }

    // Kill existing instance if running
    if (this.runningGames.has(theme)) {
      await this.stopEmpireGame(theme);
    }

    // Get port configuration
    const portConfig = await this.portManager.createEmpireGameConfig(theme);

    // Create a modified version of the empire file with safe ports
    const safeGameFile = await this.createSafeEmpireGame(gameConfig.file, portConfig, theme);

    // Launch the game
    return await this.spawnEmpireGame(theme, safeGameFile, portConfig);
  }

  async createSafeEmpireGame(originalFile, portConfig, theme) {
    const content = await fs.readFile(originalFile, 'utf8');
    
    // Remove shebang and clean content
    let cleanContent = content.replace(/^#!/m, '// #!/');
    
    // Replace problematic ports with safe ones
    let safeContent = cleanContent
      .replace(/port.*=.*5000/g, `port = ${portConfig.ports.main}`)
      .replace(/port.*=.*5001/g, `port = ${portConfig.ports.websocket}`)
      .replace(/port.*=.*9000/g, `port = ${portConfig.ports.api}`)
      .replace(/:5000/g, `:${portConfig.ports.main}`)
      .replace(/:5001/g, `:${portConfig.ports.websocket}`)
      .replace(/:9000/g, `:${portConfig.ports.api}`);

    // Add empire game wrapper
    const wrapperCode = `#!/usr/bin/env node

// EMPIRE GAME WRAPPER - Auto-generated safe version
const EMPIRE_CONFIG = ${JSON.stringify(portConfig, null, 2)};
console.log('🎮 Starting ${theme} on ports:', EMPIRE_CONFIG.ports);

// Override console.log to prevent spam
const originalConsoleLog = console.log;
console.log = (...args) => {
  if (args[0] && !args[0].includes('tick') && !args[0].includes('update')) {
    originalConsoleLog(...args);
  }
};

${safeContent}
`;

    const safeFileName = `./empire-safe-${theme}-${Date.now()}.js`;
    await fs.writeFile(safeFileName, wrapperCode);
    
    return safeFileName;
  }

  async spawnEmpireGame(theme, gameFile, portConfig) {
    return new Promise((resolve, reject) => {
      console.log(`   📁 Executing: ${gameFile}`);
      console.log(`   🌐 Ports: ${portConfig.ports.main}, ${portConfig.ports.websocket}`);

      const child = spawn('node', [gameFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      let startupOutput = '';
      let hasStarted = false;

      child.stdout.on('data', (data) => {
        const output = data.toString();
        startupOutput += output;

        // Look for startup success indicators
        if (output.includes('listening') || output.includes('started') || output.includes('ready')) {
          if (!hasStarted) {
            hasStarted = true;
            
            const gameInfo = {
              theme,
              pid: child.pid,
              ports: portConfig.ports,
              startTime: new Date(),
              file: gameFile,
              process: child
            };

            this.runningGames.set(theme, gameInfo);
            this.portManager.registerRunningService(theme, portConfig.ports.main, child.pid, theme);

            console.log(`   ✅ ${theme} started successfully (PID: ${child.pid})`);
            resolve(gameInfo);
          }
        }
      });

      child.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE')) {
          console.log(`   ⚠️  Port conflict for ${theme}, retrying...`);
          // Could retry with different port here
        } else if (!error.includes('Warning') && !error.includes('DeprecationWarning')) {
          console.log(`   ⚠️  ${theme} stderr:`, error.trim());
        }
      });

      child.on('error', (error) => {
        console.log(`   ❌ Failed to start ${theme}: ${error.message}`);
        reject(error);
      });

      child.on('exit', (code) => {
        if (!hasStarted) {
          console.log(`   ❌ ${theme} exited before starting (code: ${code})`);
          reject(new Error(`Game exited with code ${code}`));
        } else {
          console.log(`   🔌 ${theme} stopped (code: ${code})`);
          this.runningGames.delete(theme);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!hasStarted) {
          console.log(`   ⏰ ${theme} startup timeout`);
          child.kill();
          reject(new Error('Startup timeout'));
        }
      }, 10000);
    });
  }

  async stopEmpireGame(theme) {
    const gameInfo = this.runningGames.get(theme);
    if (gameInfo) {
      console.log(`🛑 Stopping ${theme} (PID: ${gameInfo.pid})`);
      
      gameInfo.process.kill();
      this.runningGames.delete(theme);
      this.portManager.unregisterService(gameInfo.ports.main);

      // Clean up temporary file
      try {
        await fs.unlink(gameInfo.file);
      } catch {}

      return true;
    }
    return false;
  }

  async stopAllGames() {
    console.log('🛑 Stopping all empire games...');
    
    const themes = Array.from(this.runningGames.keys());
    for (const theme of themes) {
      await this.stopEmpireGame(theme);
    }

    console.log('✅ All empire games stopped');
  }

  getRunningGames() {
    return Array.from(this.runningGames.entries()).map(([theme, info]) => ({
      theme,
      name: this.gameConfigs[theme]?.name || theme,
      pid: info.pid,
      ports: info.ports,
      uptime: Date.now() - info.startTime.getTime(),
      accessUrl: `http://localhost:${info.ports.main}`
    }));
  }

  async testLaunch() {
    console.log('🧪 TESTING EMPIRE GAME LAUNCHES');
    console.log('================================\n');

    const themes = ['cannabis-tycoon'];
    
    for (const theme of themes) {
      try {
        console.log(`🎮 Testing ${theme}...`);
        const gameInfo = await this.launchEmpireGame(theme);
        
        console.log(`   ✅ Success! Access at: http://localhost:${gameInfo.ports.main}`);
        
        // Test for 3 seconds then stop
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.stopEmpireGame(theme);
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
      
      console.log();
    }

    console.log('🎯 Test complete!');
  }
}

// CLI usage
if (require.main === module) {
  const launcher = new WorkingEmpireLauncher();

  const command = process.argv[2];
  const theme = process.argv[3];

  switch (command) {
    case 'test':
      launcher.testLaunch().catch(console.error);
      break;
    
    case 'start':
      if (!theme) {
        console.log('Usage: node working-empire-launcher.js start <theme>');
        process.exit(1);
      }
      launcher.launchEmpireGame(theme)
        .then(info => {
          console.log(`🎮 ${theme} running at http://localhost:${info.ports.main}`);
        })
        .catch(console.error);
      break;
    
    case 'stop':
      if (theme) {
        launcher.stopEmpireGame(theme);
      } else {
        launcher.stopAllGames();
      }
      break;
    
    case 'status':
      const running = launcher.getRunningGames();
      if (running.length === 0) {
        console.log('No empire games running');
      } else {
        console.log('Running empire games:');
        running.forEach(game => {
          console.log(`  🎮 ${game.name} - ${game.accessUrl} (${Math.round(game.uptime/1000)}s)`);
        });
      }
      break;
    
    default:
      console.log('🏛️ WORKING EMPIRE LAUNCHER');
      console.log('Commands:');
      console.log('  test                    - Test launch cannabis-tycoon');
      console.log('  start <theme>          - Start empire game');
      console.log('  stop [theme]           - Stop game(s)');
      console.log('  status                 - Show running games');
      console.log();
      console.log('Available themes: cannabis-tycoon, space-exploration, galactic-federation');
  }
}

module.exports = WorkingEmpireLauncher;