#!/usr/bin/env node

/**
 * CONVERGENCE PIPELINE RUNNER
 * Executes complete convergence pipeline to achieve user's goal:
 * "1 conversation and 1 set of code for both mirror sides"
 */

console.log(`
⚡ CONVERGENCE PIPELINE RUNNER ⚡
Bashing through template layers • Final convergence • 2 unified agents
`);

const { spawn } = require('child_process');
const fs = require('fs').promises;

class ConvergencePipelineRunner {
  constructor() {
    this.results = new Map();
    this.completed = new Map();
  }

  async runCommand(command, args, description) {
    console.log(`\n🔄 ${description}...`);
    console.log(`Command: node ${command} ${args.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      const process = spawn('node', [command, ...args], {
        stdio: 'inherit',
        cwd: '/Users/matthewmauer/Desktop/Document-Generator'
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${description} completed successfully`);
          resolve(true);
        } else {
          console.log(`❌ ${description} failed with code ${code}`);
          resolve(false); // Continue pipeline even if one step fails
        }
      });
      
      process.on('error', (error) => {
        console.log(`❌ ${description} error: ${error.message}`);
        resolve(false);
      });
    });
  }

  async checkFileExists(filename) {
    try {
      await fs.access(filename);
      return true;
    } catch {
      return false;
    }
  }

  async runFullPipeline() {
    console.log('\n🚀 Starting complete convergence pipeline...');
    
    // Step 1: Context Scanner - Find all duplicates
    console.log('\n📊 PHASE 1: CONTEXT SCANNING');
    const scanResult = await this.runCommand(
      'context-scanner-agent.js', 
      ['scan'],
      'Scanning codebase for duplicates and template layers'
    );
    this.completed.set('context-scan', scanResult);
    
    if (scanResult && await this.checkFileExists('convergence-report.json')) {
      console.log('✅ Convergence report generated');
    }

    // Step 2: Mirror Deployment - Prepare mirror sides  
    console.log('\n🪞 PHASE 2: MIRROR DEPLOYMENT');
    const deployResult = await this.runCommand(
      'mirror-deployment-agent.js',
      ['deploy'],
      'Deploying mirror sides to Soulfra with deduplication'
    );
    this.completed.set('mirror-deploy', deployResult);

    if (deployResult && await this.checkFileExists('soulfra-chaos-mirror.json')) {
      console.log('✅ Mirror deployment packages created');
    }

    // Step 3: Context Mixing - Combine character profiles
    console.log('\n🧬 PHASE 3: CONTEXT MIXING');
    const mixResult = await this.runCommand(
      'context-mixer-agent.js',
      ['mix'],
      'Mixing character contexts intelligently without overloading'
    );
    this.completed.set('context-mix', mixResult);

    if (mixResult && await this.checkFileExists('context-mixing-report.json')) {
      console.log('✅ Character contexts mixed and deduplicated');
    }

    // Step 4: Final Convergence - Create unified agents
    console.log('\n⚡ PHASE 4: FINAL CONVERGENCE');
    const convergeResult = await this.runCommand(
      'convergence-engine.js',
      ['converge'],
      'Performing final convergence to 1 conversation + 1 codebase per mirror'
    );
    this.completed.set('converge', convergeResult);

    if (convergeResult && await this.checkFileExists('chaos-unified.js')) {
      console.log('✅ Unified agents created');
    }

    // Report results
    await this.generateFinalReport();
  }

  async generateFinalReport() {
    console.log('\n📋 CONVERGENCE PIPELINE SUMMARY\n');

    const phases = [
      { name: 'Context Scanning', key: 'context-scan', file: 'convergence-report.json' },
      { name: 'Mirror Deployment', key: 'mirror-deploy', file: 'soulfra-chaos-mirror.json' },
      { name: 'Context Mixing', key: 'context-mix', file: 'context-mixing-report.json' },
      { name: 'Final Convergence', key: 'converge', file: 'chaos-unified.js' }
    ];

    let completedPhases = 0;
    for (const phase of phases) {
      const completed = this.completed.get(phase.key);
      const fileExists = await this.checkFileExists(phase.file);
      
      const status = completed && fileExists ? '✅' : completed ? '⚠️' : '❌';
      console.log(`${status} ${phase.name}: ${completed ? 'Executed' : 'Failed'} | ${fileExists ? 'Files created' : 'No output files'}`);
      
      if (completed && fileExists) completedPhases++;
    }

    console.log(`\n🎯 Pipeline Status: ${completedPhases}/${phases.length} phases successful`);

    // Check for final artifacts
    const finalArtifacts = [
      'chaos-unified.js',
      'simple-unified.js', 
      'final-convergence-report.json'
    ];

    console.log('\n📄 Final Artifacts:');
    for (const artifact of finalArtifacts) {
      const exists = await this.checkFileExists(artifact);
      console.log(`${exists ? '✅' : '❌'} ${artifact}`);
    }

    if (completedPhases === phases.length) {
      console.log('\n🎉 CONVERGENCE COMPLETE! 🎉');
      console.log('✅ Template layers successfully bashed and converged');
      console.log('✅ Character contexts mixed without overloading');
      console.log('✅ Duplicates removed and exact matches eliminated');
      console.log('✅ Final result: 1 conversation + 1 codebase per mirror side');
      console.log('\n🚀 Ready for Soulfra deployment!');
    } else {
      console.log('\n⚠️ Convergence partially completed');
      console.log('Some phases may have failed, but pipeline attempted all steps');
    }
  }
}

// Run the pipeline if called directly
if (require.main === module) {
  const runner = new ConvergencePipelineRunner();
  runner.runFullPipeline().catch(console.error);
}

module.exports = ConvergencePipelineRunner;