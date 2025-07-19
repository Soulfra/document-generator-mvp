#!/usr/bin/env node

/**
 * Run Ralph Sovereign Agent Test - Integration Script
 * 
 * This script integrates the Sovereign Agents system with Ralph's proven testing infrastructure,
 * avoiding the bash execution loop and using Node.js-based testing instead.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import Ralph's infrastructure if available
let RalphSovereignAgentBasher;
try {
  RalphSovereignAgentBasher = require('./ralph-sovereign-agent-test.js');
} catch (error) {
  console.error('❌ Could not load Ralph Sovereign Agent Basher:', error.message);
  process.exit(1);
}

class SovereignAgentOrchestrator {
  constructor() {
    this.contextProfile = null;
    this.ralphBasher = null;
    this.startTime = new Date();
    
    this.loadContextProfile();
    this.initializeRalph();
  }

  loadContextProfile() {
    try {
      const profilePath = path.join(__dirname, 'sovereign-agents-context-profile.json');
      const profileData = fs.readFileSync(profilePath, 'utf8');
      this.contextProfile = JSON.parse(profileData);
      
      console.log('✅ Context Profile loaded:', this.contextProfile.name);
      console.log('🎭 Vision:', this.contextProfile.metadata.vision);
    } catch (error) {
      console.error('❌ Failed to load context profile:', error.message);
      process.exit(1);
    }
  }

  initializeRalph() {
    try {
      this.ralphBasher = new RalphSovereignAgentBasher();
      console.log('🔨 Ralph the Basher initialized for Sovereign Agents testing');
    } catch (error) {
      console.error('❌ Failed to initialize Ralph:', error.message);
      process.exit(1);
    }
  }

  async checkDockerServices() {
    console.log('🐳 Checking Docker services status...');
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker-compose', ['ps'], { 
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let output = '';
      docker.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      docker.stderr.on('data', (data) => {
        console.error('Docker stderr:', data.toString());
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Docker services status retrieved');
          
          // Check for sovereign-agents service
          if (output.includes('document-generator-sovereign-agents')) {
            console.log('✅ Sovereign Agents service found in Docker');
            resolve(true);
          } else {
            console.log('⚠️ Sovereign Agents service not found, may need to start');
            resolve(false);
          }
        } else {
          reject(new Error(`Docker command failed with code ${code}`));
        }
      });
      
      docker.on('error', (error) => {
        reject(new Error(`Docker command error: ${error.message}`));
      });
    });
  }

  async startDockerServices() {
    console.log('🚀 Starting Docker services...');
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker-compose', ['up', '-d'], { 
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      docker.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      
      docker.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Docker services started successfully');
          resolve(true);
        } else {
          reject(new Error(`Docker start failed with code ${code}`));
        }
      });
      
      docker.on('error', (error) => {
        reject(new Error(`Docker start error: ${error.message}`));
      });
    });
  }

  async waitForServices(timeoutMs = 120000) {
    console.log('⏳ Waiting for services to initialize...');
    
    const startTime = Date.now();
    const checkInterval = 5000;
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch('http://localhost:8085/health');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'healthy') {
            console.log('✅ Services are healthy and ready');
            return true;
          }
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }
      
      console.log('⏳ Services still initializing...');
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    throw new Error('Services failed to start within timeout period');
  }

  async runRalphTests() {
    console.log('🔨 Starting Ralph\'s Sovereign Agent Bash Tests...');
    console.log('🎭 Ralph\'s mission: Test the soul-like responsiveness of your agents');
    
    try {
      const results = await this.ralphBasher.runCompleteBasher();
      
      console.log('\\n📊 RALPH\\'S TEST RESULTS SUMMARY:');
      console.log('==========================================');
      console.log(`Total Tests: ${results.summary.totalTests}`);
      console.log(`Passed: ${results.summary.passed}`);
      console.log(`Failed: ${results.summary.failed}`);
      console.log(`Critical Issues: ${results.summary.criticalIssues}`);
      
      if (results.summary.criticalIssues === 0 && results.summary.failed === 0) {
        console.log('\\n🏆 SUCCESS: Your Sovereign Agents pass Ralph\\'s destruction tests!');
        console.log('🎼 Your digital orchestra is ready for conducting!');
      } else {
        console.log('\\n⚠️ ISSUES FOUND: Ralph discovered problems that need attention');
        
        if (results.criticalIssues.length > 0) {
          console.log('\\n💥 CRITICAL ISSUES:');
          results.criticalIssues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.testName}: ${issue.error}`);
          });
        }
        
        if (results.failures.length > 0) {
          console.log('\\n❌ FAILED TESTS:');
          results.failures.forEach((failure, index) => {
            console.log(`${index + 1}. ${failure.testName}: ${failure.error}`);
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('💥 Ralph\\'s tests crashed:', error.message);
      throw error;
    }
  }

  async runCompleteOrchestration() {
    console.log('🎭 SOVEREIGN AGENT ORCHESTRATION STARTING');
    console.log('=========================================');
    console.log('Vision: "I was a conductor of orchestration and it would be responsive like a soul"');
    console.log('');
    
    try {
      // Step 1: Check if Docker services are running
      const servicesRunning = await this.checkDockerServices();
      
      // Step 2: Start services if not running
      if (!servicesRunning) {
        await this.startDockerServices();
      }
      
      // Step 3: Wait for services to be ready
      await this.waitForServices();
      
      // Step 4: Run Ralph's comprehensive tests
      const testResults = await this.runRalphTests();
      
      // Step 5: Generate final report
      const duration = Date.now() - this.startTime.getTime();
      
      console.log('\\n🎯 ORCHESTRATION COMPLETE');
      console.log('==========================');
      console.log(`Duration: ${Math.round(duration / 1000)} seconds`);
      console.log(`Context Profile: ${this.contextProfile.name}`);
      console.log(`Ralph Verdict: ${testResults.summary.criticalIssues === 0 ? 'APPROVED' : 'NEEDS FIXES'}`);
      
      if (testResults.summary.criticalIssues === 0) {
        console.log('\\n🎼 YOUR SOVEREIGN AGENTS ARE READY FOR CONDUCTING!');
        console.log('Access your agents at: http://localhost:8085');
        console.log('WebSocket monitoring: ws://localhost:8085');
        console.log('');
        console.log('🎭 Next Steps:');
        console.log('- Upload a document to process');
        console.log('- Monitor agent reasoning in real-time');
        console.log('- Use conductor interface for approvals');
        console.log('- Watch your digital orchestra perform!');
      }
      
      return {
        success: testResults.summary.criticalIssues === 0,
        duration,
        testResults,
        contextProfile: this.contextProfile.name
      };
      
    } catch (error) {
      console.error('💥 ORCHESTRATION FAILED:', error.message);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const orchestrator = new SovereignAgentOrchestrator();
  
  orchestrator.runCompleteOrchestration()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 FATAL ERROR:', error);
      process.exit(1);
    });
}

module.exports = SovereignAgentOrchestrator;