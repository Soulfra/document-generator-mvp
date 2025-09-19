#!/usr/bin/env node

/**
 * WORKING THEMED LAUNCHER
 * Actually launches functional themed empire games
 */

const { spawn } = require('child_process');
const EmpirePortManager = require('./empire-port-manager');

class WorkingThemedLauncher {
  constructor() {
    this.portManager = new EmpirePortManager();
    this.runningGames = new Map();
    
    // Working game configurations
    this.gameConfigs = {
      'cannabis-tycoon': {
        script: 'simple-working-empire-demo.js',
        name: 'Cannabis Tycoon Empire',
        description: 'Build dispensaries, grow strains, manage legal compliance',
        theme: 'cannabis-tycoon'
      },
      'space-exploration': {
        script: 'simple-working-empire-demo.js',
        name: 'Space Exploration Empire',
        description: 'Command starships, explore galaxies, contact aliens',
        theme: 'space-exploration'
      },
      'galactic-federation': {
        script: 'simple-working-empire-demo.js',
        name: 'Galactic Federation',
        description: 'Manage diplomatic relations, build alliances',
        theme: 'galactic-federation'
      }
    };
  }

  async launchGame(theme) {
    console.log(`🚀 Launching ${theme} game...`);

    const config = this.gameConfigs[theme];
    if (!config) {
      throw new Error(`Unknown theme: ${theme}`);
    }

    // Stop existing instance
    if (this.runningGames.has(theme)) {
      await this.stopGame(theme);
    }

    // Get ports
    const portConfig = await this.portManager.createEmpireGameConfig(theme);

    // Launch the game
    return new Promise((resolve, reject) => {
      const child = spawn('node', [config.script, theme], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        env: { 
          ...process.env, 
          EMPIRE_PORT: portConfig.ports.main,
          EMPIRE_WS_PORT: portConfig.ports.websocket 
        }
      });

      let started = false;
      let output = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        if (text.includes('listening') && !started) {
          started = true;
          
          const gameInfo = {
            theme,
            name: config.name,
            pid: child.pid,
            ports: portConfig.ports,
            accessUrl: `http://localhost:${portConfig.ports.main}`,
            startTime: new Date(),
            process: child
          };

          this.runningGames.set(theme, gameInfo);
          console.log(`   ✅ ${config.name} started!`);
          console.log(`   🌐 Access: ${gameInfo.accessUrl}`);
          resolve(gameInfo);
        }
      });

      child.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('Warning') && !started) {
          console.log(`   ⚠️  ${theme}:`, error.trim());
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('exit', (code) => {
        if (started) {
          console.log(`   🔌 ${theme} stopped (code: ${code})`);
          this.runningGames.delete(theme);
        } else {
          reject(new Error(`Game failed to start (code: ${code})`));
        }
      });

      // Timeout
      setTimeout(() => {
        if (!started) {
          child.kill();
          reject(new Error('Startup timeout'));
        }
      }, 10000);
    });
  }

  async stopGame(theme) {
    const game = this.runningGames.get(theme);
    if (game) {
      console.log(`🛑 Stopping ${game.name}...`);
      game.process.kill();
      this.runningGames.delete(theme);
      return true;
    }
    return false;
  }

  async stopAllGames() {
    console.log('🛑 Stopping all games...');
    const themes = Array.from(this.runningGames.keys());
    for (const theme of themes) {
      await this.stopGame(theme);
    }
  }

  getRunningGames() {
    return Array.from(this.runningGames.values()).map(game => ({
      theme: game.theme,
      name: game.name,
      pid: game.pid,
      accessUrl: game.accessUrl,
      uptime: Date.now() - game.startTime.getTime(),
      status: 'running'
    }));
  }

  async testGame(theme) {
    console.log(`🧪 Testing ${theme} game...`);
    
    try {
      const game = await this.launchGame(theme);
      
      // Wait for startup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test API
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const response = await fetch(`${game.accessUrl}/api/status`);
      const status = await response.json();
      
      console.log(`   📊 Status: ${status.status}`);
      console.log(`   💰 Revenue: $${status.revenue}`);
      console.log(`   ⏱️  Uptime: ${Math.round(status.uptime/1000)}s`);
      
      // Test game action
      const actionResponse = await fetch(`${game.accessUrl}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_empire' })
      });
      
      const actionResult = await actionResponse.json();
      console.log(`   🎮 Action test: ${actionResult.success ? '✅' : '❌'}`);
      
      return game;
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
      throw error;
    }
  }

  async showStatus() {
    const running = this.getRunningGames();
    
    console.log('🏛️ WORKING THEMED EMPIRE STATUS');
    console.log('=================================');
    
    if (running.length === 0) {
      console.log('No games currently running');
    } else {
      running.forEach(game => {
        console.log(`🎮 ${game.name}`);
        console.log(`   Theme: ${game.theme}`);
        console.log(`   Access: ${game.accessUrl}`);
        console.log(`   Uptime: ${Math.round(game.uptime/1000)}s`);
        console.log(`   PID: ${game.pid}`);
        console.log();
      });
    }
    
    return running;
  }

  async launchAll() {
    console.log('🚀 LAUNCHING ALL THEMED EMPIRE GAMES');
    console.log('====================================\n');

    const themes = Object.keys(this.gameConfigs);
    const results = [];

    for (const theme of themes) {
      try {
        const game = await this.launchGame(theme);
        results.push({ theme, success: true, game });
      } catch (error) {
        console.log(`❌ Failed to launch ${theme}: ${error.message}`);
        results.push({ theme, success: false, error: error.message });
      }
    }

    console.log('\n🎯 LAUNCH SUMMARY:');
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.theme}: ${result.game.accessUrl}`);
      } else {
        console.log(`❌ ${result.theme}: ${result.error}`);
      }
    });

    return results;
  }
}

// CLI interface
if (require.main === module) {
  const launcher = new WorkingThemedLauncher();
  const command = process.argv[2];
  const theme = process.argv[3];

  (async () => {
    try {
      switch (command) {
        case 'launch':
          if (!theme) {
            console.log('Usage: node working-themed-launcher.js launch <theme>');
            console.log('Themes:', Object.keys(launcher.gameConfigs).join(', '));
            process.exit(1);
          }
          await launcher.launchGame(theme);
          break;

        case 'test':
          const testTheme = theme || 'cannabis-tycoon';
          const game = await launcher.testGame(testTheme);
          console.log(`\n🎉 ${testTheme} test successful!`);
          console.log(`🌐 Play at: ${game.accessUrl}`);
          break;

        case 'launch-all':
          await launcher.launchAll();
          break;

        case 'stop':
          if (theme) {
            await launcher.stopGame(theme);
          } else {
            await launcher.stopAllGames();
          }
          break;

        case 'status':
          await launcher.showStatus();
          break;

        default:
          console.log('🏛️ WORKING THEMED EMPIRE LAUNCHER');
          console.log('=================================');
          console.log('Commands:');
          console.log('  launch <theme>     - Launch specific game');
          console.log('  test [theme]       - Test game (default: cannabis-tycoon)');
          console.log('  launch-all         - Launch all games');
          console.log('  stop [theme]       - Stop game(s)');
          console.log('  status             - Show running games');
          console.log();
          console.log('Available themes:');
          Object.entries(launcher.gameConfigs).forEach(([theme, config]) => {
            console.log(`  ${theme}: ${config.name}`);
          });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();

  // Handle cleanup
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await launcher.stopAllGames();
    process.exit(0);
  });
}

module.exports = WorkingThemedLauncher;