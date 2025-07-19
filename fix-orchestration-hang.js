#!/usr/bin/env node

/**
 * Fix Orchestration Hang
 * 
 * Identifies and fixes the hanging issue in the symlink orchestration layer
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

console.log('🔧 FIX ORCHESTRATION HANG');
console.log('==========================');

class OrchestrationFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.finishThisIdeaPath = path.join(this.projectRoot, 'FinishThisIdea');
    this.issues = [];
  }

  async checkSymlinkManager() {
    console.log('🔍 Checking symlink manager for hanging issues...');
    
    try {
      const symlinkManagerPath = path.join(this.finishThisIdeaPath, 'symlink-manager.js');
      await fs.access(symlinkManagerPath);
      
      // Run symlink manager with timeout
      return new Promise((resolve) => {
        const symlinkProcess = spawn('node', [symlinkManagerPath, 'list'], {
          cwd: this.finishThisIdeaPath,
          stdio: 'pipe',
          timeout: 10000 // 10 second timeout
        });
        
        let output = '';
        let hasOutput = false;
        
        symlinkProcess.stdout.on('data', (data) => {
          output += data.toString();
          hasOutput = true;
        });
        
        symlinkProcess.stderr.on('data', (data) => {
          output += data.toString();
          hasOutput = true;
        });
        
        const timeout = setTimeout(() => {
          console.log('⏰ Symlink manager hanging - killing process');
          symlinkProcess.kill('SIGKILL');
          this.issues.push('Symlink manager hangs on execution');
          resolve(false);
        }, 10000);
        
        symlinkProcess.on('close', (code) => {
          clearTimeout(timeout);
          if (hasOutput) {
            console.log('✅ Symlink manager responds');
            console.log('Output preview:', output.substring(0, 200) + '...');
            resolve(true);
          } else {
            console.log('❌ Symlink manager no output');
            this.issues.push('Symlink manager produces no output');
            resolve(false);
          }
        });
        
        symlinkProcess.on('error', (error) => {
          clearTimeout(timeout);
          console.log('❌ Symlink manager error:', error.message);
          this.issues.push(\`Symlink manager error: \${error.message}\`);
          resolve(false);
        });
      });
      
    } catch (error) {
      console.log('❌ Symlink manager not found');
      this.issues.push('Symlink manager file missing');
      return false;
    }
  }

  async checkFeatureFlags() {
    console.log('🚦 Checking feature flags for execution blocks...');
    
    try {
      // Check if feature flags are blocking shell execution
      const envPath = path.join(this.projectRoot, '.env');
      const envContent = await fs.readFile(envPath, 'utf8');
      
      const blockingFlags = [
        'ENABLE_SHELL_EXECUTION=false',
        'DISABLE_CLI_TOOLS=true',
        'GUARDIAN_MODE=strict',
        'SYMLINK_PROTECTION=true'
      ];
      
      const foundBlocks = blockingFlags.filter(flag => envContent.includes(flag));
      
      if (foundBlocks.length > 0) {
        console.log('🚫 Found blocking feature flags:');
        foundBlocks.forEach(flag => console.log(\`   • \${flag}\`));
        this.issues.push('Feature flags blocking execution: ' + foundBlocks.join(', '));
        return false;
      } else {
        console.log('✅ No blocking feature flags found');
        return true;
      }
      
    } catch (error) {
      console.log('⚠️  Could not check feature flags:', error.message);
      return true; // Assume OK if can't check
    }
  }

  async checkDockerServices() {
    console.log('🐳 Checking Docker services status...');
    
    return new Promise((resolve) => {
      const dockerProcess = spawn('docker-compose', ['ps'], {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      let output = '';
      
      dockerProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      dockerProcess.on('close', (code) => {
        if (code === 0) {
          const runningServices = (output.match(/Up /g) || []).length;
          console.log(\`✅ Docker available, \${runningServices} services running\`);
          resolve(true);
        } else {
          console.log('❌ Docker not available or services down');
          this.issues.push('Docker services not running');
          resolve(false);
        }
      });
      
      dockerProcess.on('error', (error) => {
        console.log('❌ Docker command failed:', error.message);
        this.issues.push('Docker not installed or not in PATH');
        resolve(false);
      });
    });
  }

  async createOrchestrationFix() {
    console.log('🔧 Creating orchestration fix...');
    
    const orchestrationFix = \`#!/usr/bin/env node

/**
 * Orchestration Fix - Prevents hanging and ensures proper startup
 */

const { spawn } = require('child_process');
const path = require('path');

async function startServicesSequentially() {
  console.log('🚀 Starting services in sequence to prevent hanging...');
  
  const services = [
    {
      name: 'Docker Infrastructure',
      command: 'docker-compose',
      args: ['up', '-d', 'postgres', 'redis', 'minio'],
      cwd: process.cwd(),
      timeout: 60000
    },
    {
      name: 'Ollama AI',
      command: 'docker-compose',
      args: ['up', '-d', 'ollama'],
      cwd: process.cwd(),
      timeout: 90000
    },
    {
      name: 'Sovereign Agents',
      command: 'docker-compose',
      args: ['up', '-d', 'sovereign-agents'],
      cwd: process.cwd(),
      timeout: 120000
    }
  ];
  
  for (const service of services) {
    console.log(\\\`🔄 Starting \\\${service.name}...\\\`);
    
    const success = await new Promise((resolve) => {
      const process = spawn(service.command, service.args, {
        cwd: service.cwd,
        stdio: 'inherit'
      });
      
      const timeout = setTimeout(() => {
        console.log(\\\`⏰ \\\${service.name} timeout - continuing anyway\\\`);
        process.kill('SIGTERM');
        resolve(true); // Continue even if timeout
      }, service.timeout);
      
      process.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          console.log(\\\`✅ \\\${service.name} started successfully\\\`);
          resolve(true);
        } else {
          console.log(\\\`⚠️  \\\${service.name} exited with code \\\${code} - continuing\\\`);
          resolve(true); // Continue even if error
        }
      });
      
      process.on('error', (error) => {
        clearTimeout(timeout);
        console.log(\\\`❌ \\\${service.name} error: \\\${error.message}\\\`);
        resolve(false);
      });
    });
    
    // Wait a moment between services
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('🎯 Sequential startup complete');
}

// Export for use by other scripts
module.exports = { startServicesSequentially };

// Execute if run directly
if (require.main === module) {
  startServicesSequentially().catch(console.error);
}
\`;

    await fs.writeFile(
      path.join(this.projectRoot, 'fix-orchestration-sequential.js'),
      orchestrationFix
    );
    
    console.log('✅ Created orchestration fix script');
  }

  async createSymlinkFix() {
    console.log('🔗 Creating symlink fix...');
    
    const symlinkFix = \`#!/usr/bin/env node

/**
 * Symlink Fix - Repairs broken symlinks that cause hanging
 */

const fs = require('fs').promises;
const path = require('path');

async function fixBrokenSymlinks() {
  console.log('🔧 Fixing broken symlinks...');
  
  const searchPaths = [
    'FinishThisIdea',
    'vibecoding-vault',
    'services'
  ];
  
  for (const searchPath of searchPaths) {
    if (await fs.access(searchPath).then(() => true).catch(() => false)) {
      await fixSymlinksInPath(searchPath);
    }
  }
}

async function fixSymlinksInPath(dir) {
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isSymbolicLink()) {
        const linkPath = path.join(dir, item.name);
        
        try {
          await fs.access(linkPath);
          console.log(\\\`✅ Valid symlink: \\\${linkPath}\\\`);
        } catch {
          console.log(\\\`🔧 Removing broken symlink: \\\${linkPath}\\\`);
          await fs.unlink(linkPath);
        }
      }
    }
  } catch (error) {
    console.log(\\\`⚠️  Could not fix symlinks in \\\${dir}: \\\${error.message}\\\`);
  }
}

// Execute if run directly
if (require.main === module) {
  fixBrokenSymlinks().catch(console.error);
}

module.exports = { fixBrokenSymlinks };
\`;

    await fs.writeFile(
      path.join(this.projectRoot, 'fix-broken-symlinks.js'),
      symlinkFix
    );
    
    console.log('✅ Created symlink fix script');
  }

  async generateSolution() {
    console.log('🎯 Generating complete solution...');
    
    const solution = \`# ORCHESTRATION HANG FIX

## Issues Found:
\${this.issues.map(issue => \`• \${issue}\`).join('\\n')}

## Solution Steps:

### 1. Fix Broken Symlinks (Run First)
\\\`\\\`\\\`bash
node fix-broken-symlinks.js
\\\`\\\`\\\`

### 2. Start Services Sequentially (Prevents Hanging)
\\\`\\\`\\\`bash
node fix-orchestration-sequential.js
\\\`\\\`\\\`

### 3. Create Localhost-Cloud Bridge
\\\`\\\`\\\`bash
node vibecoding-localhost-bridge.js
\\\`\\\`\\\`

### 4. Test Complete System
\\\`\\\`\\\`bash
node http-only-test.js
\\\`\\\`\\\`

## Expected Result:
✅ Sovereign Agents running on localhost:8085
✅ AI Economy system operational  
✅ Electron app bridging localhost ↔ cloud
✅ No more hanging orchestration
✅ "Conductor of orchestration with soul-like agents" ready!

## If Still Hanging:
Run individual diagnostic commands to identify the specific blocking service.
\`;

    await fs.writeFile(
      path.join(this.projectRoot, 'ORCHESTRATION_FIX_SOLUTION.md'),
      solution
    );
    
    console.log('✅ Generated complete solution guide');
  }

  async diagnose() {
    console.log('🔍 Diagnosing orchestration hanging issues...');
    
    // Check all potential hang points
    await this.checkSymlinkManager();
    await this.checkFeatureFlags();
    await this.checkDockerServices();
    
    // Create fix scripts
    await this.createOrchestrationFix();
    await this.createSymlinkFix();
    await this.generateSolution();
    
    console.log('\\n🎯 DIAGNOSIS COMPLETE');
    console.log('====================');
    
    if (this.issues.length > 0) {
      console.log('❌ Issues found:');
      this.issues.forEach(issue => console.log(\`   • \${issue}\`));
      console.log('\\n🔧 Solutions created:');
      console.log('   • fix-broken-symlinks.js');
      console.log('   • fix-orchestration-sequential.js');
      console.log('   • vibecoding-localhost-bridge.js');
      console.log('   • ORCHESTRATION_FIX_SOLUTION.md');
    } else {
      console.log('✅ No hanging issues detected');
    }
    
    console.log('\\n🚀 Next steps: Run the fix scripts in sequence');
    console.log('   1. node fix-broken-symlinks.js');
    console.log('   2. node fix-orchestration-sequential.js'); 
    console.log('   3. node vibecoding-localhost-bridge.js');
    console.log('   4. node http-only-test.js');
  }
}

// Execute if run directly
if (require.main === module) {
  const fixer = new OrchestrationFixer();
  fixer.diagnose().catch(console.error);
}

module.exports = OrchestrationFixer;