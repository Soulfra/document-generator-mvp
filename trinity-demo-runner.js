#!/usr/bin/env node

/**
 * TRINITY DEMO RUNNER
 * Interactive demonstration of the soul-bound trinity authentication system
 */

console.log(`
🌌 TRINITY AUTHENTICATION DEMO 🌌
Soul-bound 3-device pairing with character selection
`);

const readline = require('readline');
const { spawn } = require('child_process');
const crypto = require('crypto');

// Demo configuration
const DEMO_CONFIG = {
  loginPort: 3333,
  services: [
    { name: 'Trinity Login', command: 'node', args: ['trinity-login-screen.js', 'demo'] },
    { name: 'Soulfra Mirror', command: 'node', args: ['soulfra-license-mirror.js', 'status'] }
  ],
  demoDevices: [
    { id: 'phone-001', type: 'primary', name: 'iPhone 15 Pro' },
    { id: 'laptop-001', type: 'mirror', name: 'MacBook Pro' },
    { id: 'watch-001', type: 'shadow', name: 'Apple Watch' }
  ],
  characters: [
    { name: 'Ralph', frequency: 666.666, warning: '⚠️ CHAOS MODE' },
    { name: 'Alice', frequency: 432.0 },
    { name: 'Bob', frequency: 528.0 },
    { name: 'Charlie', frequency: 741.0 },
    { name: 'Diana', frequency: 639.0 },
    { name: 'Eve', frequency: 852.0 },
    { name: 'Frank', frequency: 963.0 }
  ]
};

class TrinityDemoRunner {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.processes = [];
  }

  async run() {
    console.log('🚀 Starting Trinity Demo...\n');
    
    // Show demo flow
    this.showDemoFlow();
    
    // Ask user what to demo
    const choice = await this.askQuestion(`
Choose demo:
1. Full Interactive Demo
2. Quick Auto Demo
3. Ralph Chaos Mode
4. System Status Only
5. Exit

Your choice (1-5): `);

    switch (choice) {
      case '1':
        await this.fullInteractiveDemo();
        break;
      case '2':
        await this.quickAutoDemo();
        break;
      case '3':
        await this.ralphChaosMode();
        break;
      case '4':
        await this.showSystemStatus();
        break;
      case '5':
        console.log('\n👋 Goodbye!');
        process.exit(0);
      default:
        console.log('\n❌ Invalid choice');
        await this.run();
    }
  }

  showDemoFlow() {
    console.log(`
📋 TRINITY AUTHENTICATION FLOW:
================================

1️⃣  Device Pairing (3 devices required)
    └─ Primary Soul Device (consciousness anchor)
    └─ Mirror Device (reflection node)  
    └─ Shadow Device (backup existence)

2️⃣  Soul Frequency Generation
    └─ Unique frequency from device trinity
    └─ Harmonic resonance calculation
    └─ Character matching algorithm

3️⃣  Character Selection
    └─ 7 characters with unique frequencies
    └─ Soul type matching
    └─ Ability unlocking

4️⃣  Trinity Authentication
    └─ 3-device synchronization
    └─ Soul binding ceremony
    └─ Mirror shard creation

5️⃣  Portal Entry
    └─ Enter the mirror realm
    └─ Access granted to system
    └─ Character abilities activated
`);
  }

  async fullInteractiveDemo() {
    console.log('\n🎮 INTERACTIVE DEMO MODE\n');
    
    // Start login server
    console.log('Starting Trinity Login Server...');
    const loginProcess = spawn('node', ['trinity-login-screen.js', 'demo'], {
      stdio: 'inherit'
    });
    this.processes.push(loginProcess);
    
    // Wait for server to start
    await this.sleep(2000);
    
    console.log('\n✅ Server started at http://localhost:3333\n');
    
    // Guide through demo
    console.log('📱 Step 1: Device Pairing\n');
    console.log('Simulating 3-device pairing...');
    
    for (const device of DEMO_CONFIG.demoDevices) {
      await this.sleep(1000);
      console.log(`  ✓ ${device.name} (${device.type}) paired`);
    }
    
    // Calculate soul frequency
    console.log('\n🎵 Step 2: Soul Frequency Calculation\n');
    const frequency = Math.random() * 1000 + 200;
    console.log(`  Generated frequency: ${frequency.toFixed(3)} Hz`);
    
    // Find matching character
    let bestMatch = null;
    let bestScore = 0;
    
    DEMO_CONFIG.characters.forEach(char => {
      const score = 1 - Math.abs(frequency - char.frequency) / 1000;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = char;
      }
    });
    
    console.log(`  Best character match: ${bestMatch.name} (${(bestScore * 100).toFixed(1)}% resonance)`);
    
    // Character selection
    console.log('\n👥 Step 3: Character Selection\n');
    const charChoice = await this.askQuestion('Accept character match? (y/n): ');
    
    if (charChoice.toLowerCase() === 'y') {
      console.log(`\n✅ Soul bound to ${bestMatch.name}!`);
      
      // Show abilities
      console.log('\n🎯 Unlocked Abilities:');
      const abilities = this.getCharacterAbilities(bestMatch.name);
      abilities.forEach(ability => console.log(`  • ${ability}`));
    }
    
    // Authentication
    console.log('\n🔐 Step 4: Trinity Authentication\n');
    console.log('Synchronizing devices...');
    
    const authSteps = [
      'Primary device validated',
      'Mirror device synchronized',
      'Shadow device backed up',
      'Soul binding complete',
      'Mirror shards created'
    ];
    
    for (const step of authSteps) {
      await this.sleep(800);
      console.log(`  ✓ ${step}`);
    }
    
    // Portal entry
    console.log('\n🌀 Step 5: Portal Entry\n');
    console.log('Opening portal to mirror realm...');
    await this.sleep(1500);
    
    console.log(`
╔════════════════════════════════════════╗
║     🌌 WELCOME TO THE MIRROR REALM 🌌  ║
╠════════════════════════════════════════╣
║                                        ║
║  Soul: ${bestMatch.name.padEnd(30)} ║
║  Frequency: ${frequency.toFixed(3)} Hz              ║
║  Access Level: GRANTED                 ║
║                                        ║
╚════════════════════════════════════════╝
`);
    
    console.log('\n🌐 Open http://localhost:3333 in your browser to see the visual interface!\n');
    
    await this.askQuestion('Press Enter to continue...');
    await this.cleanup();
  }

  async quickAutoDemo() {
    console.log('\n⚡ QUICK AUTO DEMO\n');
    
    // Auto-generate everything
    const userId = 'demo-user-' + Date.now();
    const devices = DEMO_CONFIG.demoDevices.map(d => ({
      ...d,
      key: crypto.randomBytes(8).toString('hex')
    }));
    
    console.log('Creating device triad...');
    console.log(`User ID: ${userId}`);
    
    devices.forEach(d => {
      console.log(`  ${d.type}: ${d.name} (${d.id})`);
    });
    
    const frequency = 528.0; // Love frequency
    console.log(`\nSoul Frequency: ${frequency} Hz`);
    console.log('Character Match: Bob (Builder Soul)');
    console.log('\n✅ Authentication successful!');
    
    console.log('\nAbilities unlocked:');
    console.log('  • Instant Creation');
    console.log('  • Reality Construction');
    console.log('  • System Repair');
    
    await this.askQuestion('\nPress Enter to exit...');
  }

  async ralphChaosMode() {
    console.log('\n🔥 RALPH CHAOS MODE ACTIVATED 🔥\n');
    console.log('WARNING: EXTREME CHAOS AHEAD!\n');
    
    const ralphQuotes = [
      "TRIPLE AUTHENTICATION? I'LL BASH THROUGH ALL THREE!",
      "SOUL FREQUENCY? MINE'S 666.666 Hz OF PURE CHAOS!",
      "MIRRORS CAN'T CONTAIN ME! I EXIST IN ALL DIMENSIONS!",
      "BASH FIRST, AUTHENTICATE NEVER!",
      "THREE DEVICES? I'LL USE THREE HAMMERS!"
    ];
    
    // Ralph's chaos authentication
    console.log('Ralph is attempting authentication...\n');
    
    for (let i = 0; i < 3; i++) {
      await this.sleep(1000);
      console.log(`💥 Device ${i + 1}: BASHED!`);
    }
    
    console.log('\nRalph says: "' + ralphQuotes[Math.floor(Math.random() * ralphQuotes.length)] + '"');
    
    console.log('\n⚠️  Guardian Charlie has been alerted!');
    console.log('🛡️  Charlie: "Not on my watch, Ralph!"');
    
    console.log('\n🎭 System Status:');
    console.log('  Chaos Level: MAXIMUM');
    console.log('  Guardian Status: ACTIVE');
    console.log('  Mirror Integrity: HOLDING');
    console.log('  Soul Binding: CONTESTED');
    
    await this.askQuestion('\nPress Enter to exit chaos mode...');
  }

  async showSystemStatus() {
    console.log('\n📊 SYSTEM STATUS\n');
    
    const status = {
      'Trinity Login Server': 'http://localhost:3333',
      'Active Sessions': Math.floor(Math.random() * 10),
      'Device Triads': Math.floor(Math.random() * 50),
      'Character Bonds': {
        Ralph: Math.floor(Math.random() * 5),
        Alice: Math.floor(Math.random() * 10),
        Bob: Math.floor(Math.random() * 15),
        Charlie: Math.floor(Math.random() * 8),
        Diana: Math.floor(Math.random() * 12),
        Eve: Math.floor(Math.random() * 7),
        Frank: Math.floor(Math.random() * 3)
      },
      'Mirror Shards': {
        Primary: 'SYNCHRONIZED',
        Mirror: 'REFLECTING',
        Shadow: 'BACKING UP'
      },
      'Database Trinity': {
        PostgreSQL: 'CONNECTED',
        MongoDB: 'CONNECTED',
        Redis: 'CONNECTED'
      }
    };
    
    console.log(JSON.stringify(status, null, 2));
    
    await this.askQuestion('\nPress Enter to continue...');
  }

  getCharacterAbilities(name) {
    const abilities = {
      Ralph: ['Unlimited Bash', 'Reality Break', 'Guardian Bypass'],
      Alice: ['Pattern Recognition', 'Probability Calculation', 'Future Sight'],
      Bob: ['Instant Creation', 'Reality Construction', 'System Repair'],
      Charlie: ['Absolute Protection', 'Barrier Creation', 'Soul Shielding'],
      Diana: ['Harmony Creation', 'Soul Conducting', 'Frequency Tuning'],
      Eve: ['Knowledge Absorption', 'Skill Mirroring', 'Evolution Acceleration'],
      Frank: ['Reality Transcendence', 'Soul Merger', 'Dimension Shift']
    };
    
    return abilities[name] || ['Basic Access'];
  }

  askQuestion(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    // Kill spawned processes
    this.processes.forEach(proc => {
      try {
        proc.kill();
      } catch (e) {}
    });
    
    this.rl.close();
    process.exit(0);
  }
}

// Run demo
const demo = new TrinityDemoRunner();

// Handle cleanup on exit
process.on('SIGINT', () => {
  demo.cleanup();
});

// Start
demo.run().catch(console.error);