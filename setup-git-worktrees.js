#!/usr/bin/env node

/**
 * Setup Git Worktrees - Create parallel development environment
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

console.log('🌳 SETTING UP GIT WORKTREES');
console.log('===========================');

class GitWorktreeManager {
  constructor() {
    this.worktrees = [
      {
        name: 'sovereign-agents',
        branch: 'feature/sovereign-agents-eventbus',
        path: '../sovereign-agents-dev',
        description: 'Event-driven agent system development'
      },
      {
        name: 'git-integration',
        branch: 'feature/git-automation',
        path: '../git-integration-dev',
        description: 'Git automation and project management'
      },
      {
        name: 'component-actions',
        branch: 'feature/component-actions',
        path: '../component-actions-dev',
        description: 'Component-based action system'
      },
      {
        name: 'debug-monitoring',
        branch: 'feature/debug-monitoring',
        path: '../debug-monitoring-dev',
        description: 'Real-time debugging and monitoring'
      },
      {
        name: 'integration-testing',
        branch: 'feature/integration-testing',
        path: '../integration-testing-dev',
        description: 'System integration and testing'
      }
    ];
    
    this.currentBranch = null;
    this.remoteExists = false;
  }

  /**
   * Execute git command
   */
  async executeGit(args, options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn('git', args, {
        stdio: 'pipe',
        cwd: options.cwd || process.cwd(),
        ...options
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
        } else {
          resolve({ success: false, code, stdout: stdout.trim(), stderr: stderr.trim() });
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Check current git status
   */
  async checkGitStatus() {
    console.log('🔍 Checking Git repository status...');

    try {
      // Check if we're in a git repository
      const isGitRepo = await this.executeGit(['rev-parse', '--git-dir']);
      if (!isGitRepo.success) {
        throw new Error('Not in a Git repository');
      }

      // Get current branch
      const currentBranch = await this.executeGit(['branch', '--show-current']);
      this.currentBranch = currentBranch.stdout;
      console.log(`📍 Current branch: ${this.currentBranch}`);

      // Check for remote
      const remotes = await this.executeGit(['remote']);
      this.remoteExists = remotes.stdout.includes('origin');
      console.log(`🌐 Remote 'origin' exists: ${this.remoteExists}`);

      // Check status
      const status = await this.executeGit(['status', '--porcelain']);
      const hasChanges = status.stdout.length > 0;
      
      if (hasChanges) {
        console.log('⚠️ Working directory has uncommitted changes');
        console.log('Changes:');
        console.log(status.stdout);
      } else {
        console.log('✅ Working directory is clean');
      }

      return { hasChanges, currentBranch: this.currentBranch };

    } catch (error) {
      console.error('❌ Git status check failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a new branch for worktree
   */
  async createBranch(branchName, fromBranch = 'main') {
    console.log(`🌿 Creating branch: ${branchName} from ${fromBranch}`);

    // Check if branch already exists
    const branchExists = await this.executeGit(['branch', '--list', branchName]);
    if (branchExists.stdout.includes(branchName)) {
      console.log(`ℹ️ Branch ${branchName} already exists`);
      return true;
    }

    // Create new branch
    const result = await this.executeGit(['checkout', '-b', branchName, fromBranch]);
    
    if (result.success) {
      console.log(`✅ Branch ${branchName} created successfully`);
      
      // Switch back to original branch
      await this.executeGit(['checkout', this.currentBranch]);
      
      return true;
    } else {
      console.error(`❌ Failed to create branch ${branchName}:`, result.stderr);
      return false;
    }
  }

  /**
   * Create a worktree
   */
  async createWorktree(worktree) {
    console.log(`\n🏗️ Creating worktree: ${worktree.name}`);
    console.log(`   Path: ${worktree.path}`);
    console.log(`   Branch: ${worktree.branch}`);
    console.log(`   Description: ${worktree.description}`);

    try {
      // Check if worktree path already exists
      try {
        await fs.access(worktree.path);
        console.log(`⚠️ Path ${worktree.path} already exists, removing...`);
        await this.executeGit(['worktree', 'remove', worktree.path, '--force']);
      } catch {
        // Path doesn't exist, which is good
      }

      // Create the branch if it doesn't exist
      await this.createBranch(worktree.branch);

      // Create the worktree
      const result = await this.executeGit([
        'worktree', 'add',
        worktree.path,
        worktree.branch
      ]);

      if (result.success) {
        console.log(`✅ Worktree ${worktree.name} created successfully`);
        
        // Create a README in the worktree
        await this.createWorktreeReadme(worktree);
        
        return true;
      } else {
        console.error(`❌ Failed to create worktree ${worktree.name}:`, result.stderr);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error creating worktree ${worktree.name}:`, error.message);
      return false;
    }
  }

  /**
   * Create README for worktree
   */
  async createWorktreeReadme(worktree) {
    const readmePath = path.join(worktree.path, 'WORKTREE_README.md');
    
    const readmeContent = `# ${worktree.name} Development Worktree

## Description
${worktree.description}

## Branch
\`${worktree.branch}\`

## Development Guidelines

### Getting Started
1. This is an isolated development environment
2. Changes here are automatically on the \`${worktree.branch}\` branch
3. Commit frequently and push to share progress
4. Merge back to main when feature is complete

### Integration Points
- Main codebase: \`../Document-Generator\`
- Other worktrees: \`../*-dev\`
- Event bus: Redis on localhost:6379
- Services: Docker Compose in main directory

### Commands
\`\`\`bash
# Switch to this worktree
cd ${worktree.path}

# Check status
git status

# Commit changes
git add .
git commit -m "feat: your change description"

# Push to remote
git push origin ${worktree.branch}

# Sync with main
git fetch origin
git merge origin/main

# Go back to main development
cd ../Document-Generator
\`\`\`

### Event Bus Integration
This worktree should connect to the shared event bus:
- Redis: redis://localhost:6379
- Namespace: sovereign-agents
- Events: See EventTypes.js for event definitions

### Testing
Run tests that integrate with the main system:
\`\`\`bash
# Start main system (from main directory)
cd ../Document-Generator
docker-compose up -d

# Test your component
npm test
\`\`\`

---
*Created by Git Worktree Manager on ${new Date().toISOString()}*
`;

    try {
      await fs.writeFile(readmePath, readmeContent);
      console.log(`📄 Created worktree README: ${readmePath}`);
    } catch (error) {
      console.error(`❌ Failed to create worktree README:`, error.message);
    }
  }

  /**
   * List existing worktrees
   */
  async listWorktrees() {
    console.log('📋 Existing worktrees:');
    
    const result = await this.executeGit(['worktree', 'list']);
    if (result.success) {
      if (result.stdout) {
        console.log(result.stdout);
      } else {
        console.log('   No worktrees found');
      }
    } else {
      console.log('   Could not list worktrees');
    }
  }

  /**
   * Setup all worktrees
   */
  async setupAllWorktrees() {
    console.log('🚀 Setting up all development worktrees...');

    // Check git status first
    const status = await this.checkGitStatus();
    
    if (status.hasChanges) {
      console.log('\n⚠️ WARNING: Uncommitted changes detected');
      console.log('Consider committing or stashing changes before creating worktrees');
      console.log('Continuing anyway...\n');
    }

    // List existing worktrees
    await this.listWorktrees();

    // Create each worktree
    let successCount = 0;
    for (const worktree of this.worktrees) {
      const success = await this.createWorktree(worktree);
      if (success) successCount++;
    }

    console.log('\n🎯 WORKTREE SETUP SUMMARY');
    console.log('=========================');
    console.log(`✅ Successfully created: ${successCount}/${this.worktrees.length} worktrees`);
    
    if (successCount === this.worktrees.length) {
      console.log('\n🎉 ALL WORKTREES CREATED SUCCESSFULLY!');
      console.log('\n📁 Development Structure:');
      console.log('Document-Generator/          # Main development (current)');
      for (const worktree of this.worktrees) {
        console.log(`${worktree.path.replace('../', '')}/          # ${worktree.description}`);
      }
      
      console.log('\n🔄 Next Steps:');
      console.log('1. cd ../sovereign-agents-dev     # Start with agent development');
      console.log('2. Implement event-driven features');
      console.log('3. Test integration with main system');
      console.log('4. Merge back to main when ready');
      
      return true;
    } else {
      console.log('\n⚠️ Some worktrees failed to create');
      console.log('Check the errors above and try again');
      return false;
    }
  }

  /**
   * Cleanup worktrees
   */
  async cleanupWorktrees() {
    console.log('🧹 Cleaning up worktrees...');
    
    for (const worktree of this.worktrees) {
      try {
        await this.executeGit(['worktree', 'remove', worktree.path, '--force']);
        console.log(`🗑️ Removed worktree: ${worktree.name}`);
      } catch (error) {
        console.log(`ℹ️ Worktree ${worktree.name} not found or already removed`);
      }
    }
    
    console.log('✅ Worktree cleanup completed');
  }
}

// Main execution
async function main() {
  const manager = new GitWorktreeManager();
  
  try {
    // Check if we should clean up first
    const args = process.argv.slice(2);
    if (args.includes('--cleanup')) {
      await manager.cleanupWorktrees();
      return;
    }
    
    // Setup all worktrees
    const success = await manager.setupAllWorktrees();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Worktree setup failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = GitWorktreeManager;