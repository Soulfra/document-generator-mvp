#!/usr/bin/env node

/**
 * FLAG CONTROL PANEL
 * Interactive control for dual economy flags and hooks
 */

const readline = require('readline');

console.log('🎛️ FLAG CONTROL PANEL');
console.log('=====================');

class FlagControlPanel {
  constructor() {
    this.flagSystem = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🚀 Loading flag system...');
    
    try {
      const FlagModeHooks = require('./flag-mode-hooks.js');
      this.flagSystem = new FlagModeHooks();
      console.log('✅ Flag system loaded');
      
      this.showMenu();
    } catch (error) {
      console.error('💥 Failed to load flag system:', error.message);
      process.exit(1);
    }
  }

  showMenu() {
    console.log('\n🎛️ CONTROL PANEL MENU');
    console.log('======================');
    console.log('1. Show flag status');
    console.log('2. Toggle flag');
    console.log('3. Set mode preset');
    console.log('4. Start dual economy');
    console.log('5. Show recent events');
    console.log('6. Add custom hook');
    console.log('7. Trigger custom event');
    console.log('8. Real-time dashboard');
    console.log('9. Export logs');
    console.log('0. Exit');
    
    this.rl.question('\nSelect option: ', (choice) => {
      this.handleChoice(choice);
    });
  }

  handleChoice(choice) {
    switch (choice) {
      case '1':
        this.showFlagStatus();
        break;
      case '2':
        this.toggleFlag();
        break;
      case '3':
        this.setModePreset();
        break;
      case '4':
        this.startDualEconomy();
        break;
      case '5':
        this.showRecentEvents();
        break;
      case '6':
        this.addCustomHook();
        break;
      case '7':
        this.triggerCustomEvent();
        break;
      case '8':
        this.startRealTimeDashboard();
        break;
      case '9':
        this.exportLogs();
        break;
      case '0':
        console.log('👋 Goodbye!');
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice');
        this.showMenu();
    }
  }

  showFlagStatus() {
    this.flagSystem.showStatus();
    this.showMenu();
  }

  toggleFlag() {
    console.log('\n🚩 Available flags:');
    const flags = Object.keys(this.flagSystem.flags);
    flags.forEach((flag, index) => {
      const status = this.flagSystem.flags[flag] ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${flag}`);
    });
    
    this.rl.question('\nEnter flag number to toggle: ', (choice) => {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < flags.length) {
        const flagName = flags[index];
        this.flagSystem.toggleFlag(flagName);
        console.log(`✅ Toggled ${flagName}`);
      } else {
        console.log('❌ Invalid flag number');
      }
      this.showMenu();
    });
  }

  setModePreset() {
    console.log('\n🔧 Mode presets:');
    console.log('1. Development mode');
    console.log('2. Production mode');
    console.log('3. Testing mode');
    
    this.rl.question('Select mode: ', (choice) => {
      switch (choice) {
        case '1':
          this.flagSystem.developmentMode();
          break;
        case '2':
          this.flagSystem.productionMode();
          break;
        case '3':
          this.flagSystem.testingMode();
          break;
        default:
          console.log('❌ Invalid mode');
      }
      this.showMenu();
    });
  }

  startDualEconomy() {
    console.log('\n🏦 Starting dual economy...');
    this.flagSystem.startDualEconomy();
    
    setTimeout(() => {
      console.log('\n✅ Dual economy started');
      this.showMenu();
    }, 2000);
  }

  showRecentEvents() {
    const events = this.flagSystem.getRecentEvents(10);
    console.log('\n📋 Recent events:');
    if (events.length === 0) {
      console.log('No events yet');
    } else {
      events.forEach(event => {
        console.log(`${event.timestamp} | ${event.type} | ${JSON.stringify(event.data)}`);
      });
    }
    this.showMenu();
  }

  addCustomHook() {
    this.rl.question('Hook name: ', (hookName) => {
      this.flagSystem.addHook(hookName, (data) => {
        console.log(`🪝 Custom hook '${hookName}' triggered:`, data);
      });
      console.log(`✅ Added hook: ${hookName}`);
      this.showMenu();
    });
  }

  triggerCustomEvent() {
    this.rl.question('Event name: ', (eventName) => {
      this.rl.question('Event data (JSON): ', (dataStr) => {
        try {
          const data = dataStr ? JSON.parse(dataStr) : {};
          this.flagSystem.triggerHook(eventName, data);
          console.log(`✅ Triggered event: ${eventName}`);
        } catch (error) {
          console.log('❌ Invalid JSON data');
        }
        this.showMenu();
      });
    });
  }

  startRealTimeDashboard() {
    console.log('\n📊 Starting real-time dashboard...');
    console.log('Press any key to stop...');
    
    this.flagSystem.setFlag('DASHBOARD_ENABLED', true);
    
    // Listen for keypress to stop
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      this.flagSystem.setFlag('DASHBOARD_ENABLED', false);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      console.log('\n📊 Dashboard stopped');
      this.showMenu();
    });
  }

  exportLogs() {
    const events = this.flagSystem.getRecentEvents(100);
    const fs = require('fs');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      flags: this.flagSystem.flags,
      events: events
    };
    
    const filename = `flag-system-export-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Logs exported to: ${filename}`);
    this.showMenu();
  }
}

// Start the control panel
if (require.main === module) {
  const panel = new FlagControlPanel();
  panel.start();
}

module.exports = FlagControlPanel;