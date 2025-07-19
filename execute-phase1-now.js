#!/usr/bin/env node

/**
 * Execute Phase 1 - Core Integration & Testing
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;

console.log('🚀 EXECUTING PHASE 1: CORE INTEGRATION & TESTING');
console.log('=================================================');

class Phase1Executor {
  constructor() {
    this.steps = [
      {
        name: 'Environment Bypass',
        script: 'run-bypass-now.js',
        description: 'Create valid environment configuration',
        required: true
      },
      {
        name: 'Feature Flags Disable',
        script: 'execute-disable-features.js',
        description: 'Disable blocking feature flags',
        required: true
      },
      {
        name: 'Docker Services',
        script: 'start-docker-services.js',
        description: 'Start all Docker services',
        required: true
      },
      {
        name: 'System Diagnostics',
        script: 'run-full-diagnostics.js',
        description: 'Run comprehensive system diagnostics',
        required: true
      },
      {
        name: 'Git Worktrees',
        script: 'setup-git-worktrees.js',
        description: 'Setup parallel development environment',
        required: false
      }
    ];
    
    this.results = [];
    this.startTime = new Date();
  }

  /**
   * Execute a single step
   */
  async executeStep(step, stepIndex) {
    console.log(`\n📋 STEP ${stepIndex + 1}/${this.steps.length}: ${step.name}`);
    console.log(`🔄 ${step.description}...`);
    
    const stepStartTime = new Date();

    return new Promise((resolve) => {
      const process = spawn('node', [step.script], {
        stdio: 'inherit'
      });

      process.on('close', (code) => {
        const stepEndTime = new Date();
        const duration = stepEndTime - stepStartTime;
        
        const result = {
          step: step.name,
          script: step.script,
          success: code === 0,
          duration,
          exitCode: code,
          required: step.required
        };

        this.results.push(result);

        if (code === 0) {
          console.log(`✅ ${step.name} completed successfully (${duration}ms)`);
        } else {
          console.log(`❌ ${step.name} failed with exit code ${code} (${duration}ms)`);
        }

        resolve(result);
      });

      process.on('error', (error) => {
        const stepEndTime = new Date();
        const duration = stepEndTime - stepStartTime;
        
        const result = {
          step: step.name,
          script: step.script,
          success: false,
          duration,
          error: error.message,
          required: step.required
        };

        this.results.push(result);
        console.error(`💥 ${step.name} execution error: ${error.message}`);
        resolve(result);
      });
    });
  }

  /**
   * Execute all Phase 1 steps
   */
  async executePhase1() {
    console.log('🎯 Starting Phase 1 execution sequence...\n');

    for (const [index, step] of this.steps.entries()) {
      const result = await this.executeStep(step, index);
      
      // Check if required step failed
      if (step.required && !result.success) {
        console.log(`\n💥 CRITICAL FAILURE: Required step "${step.name}" failed`);
        console.log('⚠️ Cannot continue Phase 1 execution');
        return this.generateReport(false);
      }

      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return this.generateReport(true);
  }

  /**
   * Generate execution report
   */
  generateReport(completed) {
    const endTime = new Date();
    const totalDuration = endTime - this.startTime;
    
    const report = {
      phase: 'Phase 1: Core Integration & Testing',
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration,
      completed,
      results: this.results,
      summary: {
        totalSteps: this.steps.length,
        completedSteps: this.results.filter(r => r.success).length,
        failedSteps: this.results.filter(r => !r.success).length,
        requiredSteps: this.steps.filter(s => s.required).length,
        requiredCompleted: this.results.filter(r => r.required && r.success).length
      }
    };

    console.log('\n🎯 PHASE 1 EXECUTION REPORT');
    console.log('============================');
    console.log(`📅 Started: ${this.startTime.toLocaleTimeString()}`);
    console.log(`📅 Completed: ${endTime.toLocaleTimeString()}`);
    console.log(`⏱️ Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`📊 Success Rate: ${report.summary.completedSteps}/${report.summary.totalSteps} steps`);

    console.log('\n📋 STEP RESULTS:');
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      const required = result.required ? '[REQUIRED]' : '[OPTIONAL]';
      const duration = Math.round(result.duration / 1000);
      
      console.log(`   ${status} ${result.step} ${required} (${duration}s)`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }

    if (completed && report.summary.requiredCompleted === report.summary.requiredSteps) {
      console.log('\n🎉 PHASE 1 COMPLETED SUCCESSFULLY!');
      console.log('==================================');
      console.log('✅ All required steps completed');
      console.log('✅ System ready for Phase 2');
      console.log('\n🚀 NEXT STEPS:');
      console.log('   1. Start Debug Dashboard: node services/sovereign-agents/src/monitoring/DebugDashboard.js');
      console.log('   2. Open dashboard: http://localhost:8086/debug');
      console.log('   3. Test document upload and agent processing');
      console.log('   4. Begin Phase 2: Agent Reasoning & Decision Making');
      
    } else {
      console.log('\n⚠️ PHASE 1 INCOMPLETE');
      console.log('=====================');
      
      const failedRequired = this.results.filter(r => r.required && !r.success);
      if (failedRequired.length > 0) {
        console.log('❌ Required steps failed:');
        for (const result of failedRequired) {
          console.log(`   - ${result.step}: ${result.error || `Exit code ${result.exitCode}`}`);
        }
      }
      
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('   1. Check Docker is running: docker ps');
      console.log('   2. Verify environment configuration');
      console.log('   3. Check for port conflicts');
      console.log('   4. Review step-specific error messages above');
    }

    return report;
  }

  /**
   * Save report to file
   */
  async saveReport(report) {
    try {
      await fs.writeFile(
        'phase1-execution-report.json',
        JSON.stringify(report, null, 2)
      );
      console.log('\n💾 Execution report saved: phase1-execution-report.json');
    } catch (error) {
      console.error('❌ Failed to save report:', error.message);
    }
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    const checks = [
      { name: 'Node.js', command: 'node', args: ['--version'] },
      { name: 'Docker', command: 'docker', args: ['--version'] },
      { name: 'Git', command: 'git', args: ['--version'] }
    ];

    for (const check of checks) {
      try {
        await this.executeCommand(check.command, check.args);
        console.log(`✅ ${check.name} available`);
      } catch (error) {
        console.log(`❌ ${check.name} not available: ${error.message}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Execute command helper
   */
  executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Main execution
async function main() {
  const executor = new Phase1Executor();
  
  try {
    // Check prerequisites
    const prereqsOk = await executor.checkPrerequisites();
    if (!prereqsOk) {
      console.log('💥 Prerequisites check failed. Please install missing dependencies.');
      process.exit(1);
    }

    // Execute Phase 1
    const report = await executor.executePhase1();
    
    // Save report
    await executor.saveReport(report);
    
    // Exit with appropriate code
    const success = report.completed && 
                   report.summary.requiredCompleted === report.summary.requiredSteps;
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Phase 1 execution failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = Phase1Executor;