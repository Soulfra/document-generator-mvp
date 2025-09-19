#!/usr/bin/env node
/**
 * DEMONSTRATE EXISTING JOINT SYSTEMS
 * 
 * Shows how your existing blueprint-joint-mapper.js and diamond-broadcast-connector.js
 * already provide the agility course/monkey bar navigation you're looking for.
 * 
 * No new code needed - just connecting what you already built!
 */

const BlueprintJointMapper = require('./blueprint-joint-mapper.js');
const DiamondBroadcastConnector = require('./diamond-broadcast-connector.js');

class ExistingJointDemo {
  constructor() {
    console.log('🎯 EXISTING JOINT SYSTEMS DEMONSTRATION');
    console.log('=====================================');
    console.log('');
    console.log('🔍 Using your existing implementations:');
    console.log('   📁 blueprint-joint-mapper.js (830 lines)');
    console.log('   💎 diamond-broadcast-connector.js (756 lines)');
    console.log('   🎮 calos/ routing systems');
    console.log('');
    
    // Initialize your existing systems
    this.jointMapper = new BlueprintJointMapper({
      enableJointVisualization: true,
      jointSensitivity: 0.7
    });
    
    this.diamondConnector = new DiamondBroadcastConnector({
      logAggregator: {
        enableMusicalVerification: true
      }
    });
    
    this.setupJointNavigation();
  }
  
  async setupJointNavigation() {
    console.log('🐒 Setting up monkey bar navigation...');
    
    // Scan for joints using your existing mapper
    const jointScan = await this.jointMapper.scanForJoints('./calos');
    
    console.log('✅ Joint scan complete!');
    console.log(`   🔗 Found ${jointScan.joints.length} joints`);
    console.log(`   📊 Mapped ${jointScan.connections.length} connections`);
    console.log(`   ⚡ Identified ${jointScan.seams.length} seams`);
    console.log('');
    
    // Show the joints as monkey bars
    this.displayMonkeyBars(jointScan.joints);
    
    // Connect to diamond broadcasting
    this.connectToDiamondGrid(jointScan);
    
    // Demonstrate navigation
    this.demonstrateNavigation(jointScan.joints);
  }
  
  displayMonkeyBars(joints) {
    console.log('🏃 MONKEY BAR JOINT NAVIGATION:');
    console.log('================================');
    
    const bars = joints.slice(0, 8); // Show first 8 as bars
    let visualization = '   ';
    
    bars.forEach((joint, index) => {
      const symbol = this.jointMapper.jointTypes[joint.type]?.symbol || '🔗';
      visualization += `${symbol}[${index}] `;
    });
    
    console.log(visualization);
    console.log('   ' + '─'.repeat(bars.length * 5));
    console.log('');
    
    // Show joint details
    bars.forEach((joint, index) => {
      const leak = joint.characteristics.leakPotential;
      const coupling = joint.characteristics.coupling;
      
      console.log(`   Bar ${index}: ${joint.type}`);
      console.log(`      📁 ${joint.file.split('/').pop()}`);
      console.log(`      🔗 Coupling: ${coupling}`);
      console.log(`      💧 Leak potential: ${(leak * 100).toFixed(0)}%`);
      console.log('');
    });
  }
  
  connectToDiamondGrid(jointScan) {
    console.log('💎 CONNECTING TO DIAMOND BROADCAST:');
    console.log('===================================');
    
    // Your diamond system is already running!
    const gridState = this.diamondConnector.getDiamondGridState();
    
    console.log(`   📊 Grid size: ${gridState.size.width}x${gridState.size.height}`);
    console.log(`   🎵 Tiles active: ${gridState.tiles.length}`);
    console.log(`   📡 System health: ${gridState.systemHealth}%`);
    console.log('');
    
    // Show how joints connect to diamond tiles
    gridState.tiles.forEach(tile => {
      console.log(`   💎 ${tile.id}: ${tile.shade} (${tile.health}%)`);
      console.log(`      🎵 Playing: ${tile.musical.chord}`);
    });
    console.log('');
  }
  
  demonstrateNavigation(joints) {
    console.log('🎮 AGILITY COURSE NAVIGATION:');
    console.log('=============================');
    console.log('');
    
    // Simulate swinging between joints
    let currentJoint = 0;
    const navigationPath = [0, 1, 3, 2, 4, 1, 0];
    
    navigationPath.forEach((targetIndex, step) => {
      if (targetIndex < joints.length) {
        const joint = joints[targetIndex];
        const symbol = this.jointMapper.jointTypes[joint.type]?.symbol || '🔗';
        
        console.log(`Step ${step + 1}: Swing to ${symbol} ${joint.type}`);
        console.log(`   📁 ${joint.file.split('/').pop()}:${joint.line}`);
        console.log(`   🔗 "${joint.match}"`);
        
        // Simulate diamond broadcast
        this.diamondConnector.addLog({
          type: 'navigation',
          source: 'joint-agility',
          content: `Agent navigated to ${joint.type} joint`
        });
        
        console.log(`   💎 Broadcasted to diamond grid`);
        console.log('');
      }
    });
  }
  
  showSeamVulnerabilities() {
    console.log('⚡ SEAM VULNERABILITIES (Mining Points):');
    console.log('=======================================');
    
    const weakPoints = this.jointMapper.findWeakPoints();
    
    weakPoints.forEach(weak => {
      console.log(`   🔍 ${weak.type}`);
      console.log(`      📍 ${weak.location}`);
      console.log(`      ⚠️  ${weak.recommendation}`);
      console.log('');
    });
  }
}

// Run the demonstration
async function runDemo() {
  try {
    const demo = new ExistingJointDemo();
    
    // Give systems time to initialize
    setTimeout(() => {
      demo.showSeamVulnerabilities();
      
      console.log('🎯 SUMMARY:');
      console.log('===========');
      console.log('✅ Your blueprint-joint-mapper.js finds all the joints');
      console.log('✅ Your diamond-broadcast-connector.js handles the broadcasting');
      console.log('✅ Your calos/ folder has the routing patterns');
      console.log('✅ The agility course is the connections between these!');
      console.log('');
      console.log('🎮 Open: /calos/integration/joint-agility-course.html');
      console.log('🌐 Debug: http://localhost:3333 (run ./calos/start-debug.sh)');
      console.log('');
      console.log('🐒 You already have the monkey bars - they\'re your joints!');
      
    }, 2000);
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('');
    console.log('🔧 Make sure these files exist:');
    console.log('   - blueprint-joint-mapper.js');
    console.log('   - diamond-broadcast-connector.js');
    console.log('   - calos/ folder with debug system');
  }
}

if (require.main === module) {
  runDemo();
}

module.exports = ExistingJointDemo;