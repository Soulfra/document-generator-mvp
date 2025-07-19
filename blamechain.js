#!/usr/bin/env node

/**
 * BLAMECHAIN LEDGER - Track what broke and when
 */

console.log('⛓️  BLAMECHAIN LEDGER ACTIVATED');
console.log('==============================');

const fs = require('fs');
const { exec } = require('child_process');

class BlameChain {
  constructor() {
    this.blocks = [];
    this.currentBlock = {
      timestamp: Date.now(),
      attempts: [],
      failures: [],
      successes: []
    };
  }

  addAttempt(command, result) {
    this.currentBlock.attempts.push({
      command,
      result,
      timestamp: Date.now()
    });
    
    if (result.error) {
      this.currentBlock.failures.push({
        command,
        error: result.error,
        blame: this.assignBlame(result.error)
      });
    } else {
      this.currentBlock.successes.push({
        command,
        output: result.output
      });
    }
  }

  assignBlame(error) {
    if (error.includes('snapshot')) return 'SHELL_ENVIRONMENT';
    if (error.includes('ENOENT')) return 'MISSING_FILE';
    if (error.includes('MODULE_NOT_FOUND')) return 'MISSING_DEPENDENCY';
    if (error.includes('EADDRINUSE')) return 'PORT_CONFLICT';
    if (error.includes('permission')) return 'PERMISSION_ERROR';
    return 'UNKNOWN_COSMIC_FORCE';
  }

  finalizeBlock() {
    this.blocks.push(this.currentBlock);
    this.currentBlock = {
      timestamp: Date.now(),
      attempts: [],
      failures: [],
      successes: []
    };
  }

  generateReport() {
    const report = {
      totalBlocks: this.blocks.length,
      totalAttempts: this.blocks.reduce((sum, block) => sum + block.attempts.length, 0),
      totalFailures: this.blocks.reduce((sum, block) => sum + block.failures.length, 0),
      totalSuccesses: this.blocks.reduce((sum, block) => sum + block.successes.length, 0),
      blameDistribution: {},
      blocks: this.blocks
    };

    // Calculate blame distribution
    this.blocks.forEach(block => {
      block.failures.forEach(failure => {
        report.blameDistribution[failure.blame] = (report.blameDistribution[failure.blame] || 0) + 1;
      });
    });

    return report;
  }

  async executeWithBlame(command) {
    console.log(`⛓️  EXECUTING: ${command}`);
    
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        const result = {
          command,
          output: stdout,
          error: error ? error.message : null,
          stderr: stderr
        };
        
        this.addAttempt(command, result);
        
        if (error) {
          console.log(`❌ FAILED: ${error.message}`);
          console.log(`🎯 BLAME: ${this.assignBlame(error.message)}`);
        } else {
          console.log(`✅ SUCCESS`);
        }
        
        resolve(result);
      });
    });
  }
}

async function runBlameChain() {
  const chain = new BlameChain();
  
  // The usual suspects
  const commands = [
    'node execute.js',
    'node character-system-max.js',
    'node execute-character-system.js',
    'node ralph-bash.js',
    'node execute-plan.js'
  ];
  
  console.log('🔗 Starting blamechain execution...\n');
  
  for (const command of commands) {
    await chain.executeWithBlame(command);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  chain.finalizeBlock();
  
  // Generate blame report
  const report = chain.generateReport();
  
  console.log('\n⛓️  BLAMECHAIN REPORT');
  console.log('====================');
  console.log(`Total Attempts: ${report.totalAttempts}`);
  console.log(`Total Failures: ${report.totalFailures}`);
  console.log(`Total Successes: ${report.totalSuccesses}`);
  console.log(`Success Rate: ${((report.totalSuccesses / report.totalAttempts) * 100).toFixed(1)}%`);
  
  console.log('\n🎯 BLAME DISTRIBUTION:');
  Object.entries(report.blameDistribution).forEach(([blame, count]) => {
    console.log(`  ${blame}: ${count} failures`);
  });
  
  // Save the blockchain
  fs.writeFileSync('./blamechain-ledger.json', JSON.stringify(report, null, 2));
  console.log('\n📊 Blamechain ledger saved to blamechain-ledger.json');
  
  // Determine next action
  if (report.totalSuccesses > 0) {
    console.log('\n🎉 SOME THINGS WORKED! Focus on:');
    report.blocks.forEach(block => {
      block.successes.forEach(success => {
        console.log(`  ✅ ${success.command}`);
      });
    });
  } else {
    console.log('\n💥 EVERYTHING FAILED! Primary blame:');
    const primaryBlame = Object.entries(report.blameDistribution)
      .sort(([,a], [,b]) => b - a)[0];
    if (primaryBlame) {
      console.log(`  🎯 ${primaryBlame[0]} (${primaryBlame[1]} failures)`);
    }
  }
}

// Execute the blamechain
if (require.main === module) {
  runBlameChain().catch(console.error);
}

module.exports = BlameChain;