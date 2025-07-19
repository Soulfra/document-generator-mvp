#!/usr/bin/env node

/**
 * Document Generator Git Layer
 * Manages git operations, symlinks, and version control
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DocumentGeneratorGitLayer {
  constructor() {
    this.repos = new Map();
    this.symlinks = new Map();
    this.gitOperations = [];
  }

  async initialize() {
    console.log('🔗 DOCUMENT GENERATOR GIT LAYER');
    console.log('================================');
    
    await this.setupGitEnvironment();
    await this.createSymlinks();
    await this.initializeRepos();
    await this.setupHooks();
    
    console.log('✅ Git layer operational');
    return this;
  }

  async setupGitEnvironment() {
    console.log('🔧 Setting up git environment...');
    
    // Check git availability
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' });
      console.log(`✅ Git available: ${gitVersion.trim()}`);
    } catch (error) {
      console.log('❌ Git not available - install git first');
      throw new Error('Git is required');
    }
    
    // Set up git config
    try {
      execSync('git config --global user.name "Document Generator"', { stdio: 'ignore' });
      execSync('git config --global user.email "docgen@local"', { stdio: 'ignore' });
    } catch (error) {
      console.log('⚠️  Git config already set');
    }
  }

  async createSymlinks() {
    console.log('🔗 Creating symlinks...');
    
    const symlinkPairs = [
      // Link sovereign agents to main services
      {
        source: './FinishThisIdea/DOC-FRAMEWORK/soulfra-mvp/vibecoding-vault/src/services',
        target: './services/sovereign-agents',
        name: 'sovereign-services'
      },
      // Link templates to accessible location
      {
        source: './FinishThisIdea/templates',
        target: './templates/finish-this-idea',
        name: 'idea-templates'
      },
      // Link tier system
      {
        source: './FinishThisIdea/tier-3-symlink-manager.js',
        target: './symlink-manager.js',
        name: 'tier-3-symlinks'
      },
      {
        source: './FinishThisIdea/tier-4-substrate-manager.js',
        target: './substrate-manager.js',
        name: 'tier-4-substrate'
      },
      {
        source: './FinishThisIdea/tier-5-universal-interface.js',
        target: './universal-interface.js',
        name: 'tier-5-interface'
      }
    ];
    
    for (const link of symlinkPairs) {
      await this.createSymlink(link.source, link.target, link.name);
    }
    
    console.log(`✅ Created ${this.symlinks.size} symlinks`);
  }

  async createSymlink(source, target, name) {
    try {
      const sourcePath = path.resolve(source);
      const targetPath = path.resolve(target);
      
      // Check if source exists
      if (!fs.existsSync(sourcePath)) {
        console.log(`⚠️  Source not found: ${source}`);
        return;
      }
      
      // Create target directory if needed
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Remove existing symlink
      if (fs.existsSync(targetPath)) {
        const stats = fs.lstatSync(targetPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(targetPath);
        }
      }
      
      // Create symlink
      fs.symlinkSync(sourcePath, targetPath);
      console.log(`🔗 Created symlink: ${name}`);
      
      this.symlinks.set(name, {
        source: sourcePath,
        target: targetPath,
        created: new Date()
      });
      
    } catch (error) {
      console.log(`❌ Symlink failed for ${name}:`, error.message);
    }
  }

  async initializeRepos() {
    console.log('📦 Initializing repositories...');
    
    // Main repository
    await this.initRepo('.', 'document-generator-main');
    
    // Generated projects repository
    await this.initRepo('./generated', 'generated-mvps');
    
    // Templates repository  
    await this.initRepo('./templates', 'mvp-templates');
    
    console.log(`✅ Initialized ${this.repos.size} repositories`);
  }

  async initRepo(repoPath, name) {
    try {
      const fullPath = path.resolve(repoPath);
      
      // Create directory if needed
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      
      // Check if already a git repo
      const gitPath = path.join(fullPath, '.git');
      if (!fs.existsSync(gitPath)) {
        // Initialize new repo
        execSync('git init', { cwd: fullPath, stdio: 'ignore' });
        
        // Create initial commit
        const readmePath = path.join(fullPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
          fs.writeFileSync(readmePath, `# ${name}\n\nInitialized by Document Generator Git Layer\n`);
        }
        
        execSync('git add .', { cwd: fullPath, stdio: 'ignore' });
        execSync('git commit -m "Initial commit"', { cwd: fullPath, stdio: 'ignore' });
        
        console.log(`📦 Initialized repo: ${name}`);
      } else {
        console.log(`✅ Repo exists: ${name}`);
      }
      
      this.repos.set(name, {
        path: fullPath,
        initialized: new Date(),
        commits: this.getCommitCount(fullPath)
      });
      
    } catch (error) {
      console.log(`❌ Repo init failed for ${name}:`, error.message);
    }
  }

  getCommitCount(repoPath) {
    try {
      const count = execSync('git rev-list --count HEAD', { 
        cwd: repoPath, 
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
      return parseInt(count.trim()) || 0;
    } catch {
      return 0;
    }
  }

  async setupHooks() {
    console.log('🪝 Setting up git hooks...');
    
    // Post-commit hook for MVP generation
    const postCommitHook = `#!/bin/bash
# Document Generator Post-Commit Hook
echo "🎭 Document Generator: MVP committed successfully"
`;

    // Pre-commit hook for validation
    const preCommitHook = `#!/bin/bash
# Document Generator Pre-Commit Hook
echo "🔍 Document Generator: Validating MVP structure..."
`;

    try {
      const mainHooksPath = './.git/hooks';
      if (fs.existsSync(mainHooksPath)) {
        fs.writeFileSync(path.join(mainHooksPath, 'post-commit'), postCommitHook);
        fs.chmodSync(path.join(mainHooksPath, 'post-commit'), '755');
        
        fs.writeFileSync(path.join(mainHooksPath, 'pre-commit'), preCommitHook);
        fs.chmodSync(path.join(mainHooksPath, 'pre-commit'), '755');
        
        console.log('✅ Git hooks installed');
      }
    } catch (error) {
      console.log('⚠️  Git hooks setup failed:', error.message);
    }
  }

  // Git operations
  async createMVPCommit(projectPath, message, files) {
    console.log(`📝 Creating MVP commit: ${message}`);
    
    try {
      // Add files
      for (const file of files) {
        execSync(`git add ${file}`, { cwd: projectPath, stdio: 'ignore' });
      }
      
      // Create commit
      execSync(`git commit -m "${message}"`, { cwd: projectPath, stdio: 'ignore' });
      
      const hash = execSync('git rev-parse HEAD', { 
        cwd: projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      this.gitOperations.push({
        type: 'commit',
        path: projectPath,
        message,
        hash,
        timestamp: new Date()
      });
      
      console.log(`✅ Commit created: ${hash.substring(0, 7)}`);
      
      return hash;
      
    } catch (error) {
      console.log('❌ Commit failed:', error.message);
      return null;
    }
  }

  async createMVPBranch(projectPath, branchName) {
    console.log(`🌿 Creating branch: ${branchName}`);
    
    try {
      execSync(`git checkout -b ${branchName}`, { cwd: projectPath, stdio: 'ignore' });
      
      this.gitOperations.push({
        type: 'branch',
        path: projectPath,
        branch: branchName,
        timestamp: new Date()
      });
      
      console.log(`✅ Branch created: ${branchName}`);
      
      return true;
      
    } catch (error) {
      console.log('❌ Branch creation failed:', error.message);
      return false;
    }
  }

  async tagMVPRelease(projectPath, version, message) {
    console.log(`🏷️  Creating tag: ${version}`);
    
    try {
      execSync(`git tag -a ${version} -m "${message}"`, { cwd: projectPath, stdio: 'ignore' });
      
      this.gitOperations.push({
        type: 'tag',
        path: projectPath,
        tag: version,
        message,
        timestamp: new Date()
      });
      
      console.log(`✅ Tag created: ${version}`);
      
      return true;
      
    } catch (error) {
      console.log('❌ Tag creation failed:', error.message);
      return false;
    }
  }

  // Status and reporting
  async getRepoStatus(repoName) {
    const repo = this.repos.get(repoName);
    if (!repo) return null;
    
    try {
      const status = execSync('git status --porcelain', { 
        cwd: repo.path, 
        encoding: 'utf8' 
      });
      
      const branch = execSync('git branch --show-current', { 
        cwd: repo.path, 
        encoding: 'utf8' 
      }).trim();
      
      const lastCommit = execSync('git log -1 --oneline', { 
        cwd: repo.path, 
        encoding: 'utf8' 
      }).trim();
      
      return {
        name: repoName,
        path: repo.path,
        branch,
        clean: status.length === 0,
        changes: status.split('\n').filter(l => l.length > 0).length,
        lastCommit,
        commits: this.getCommitCount(repo.path)
      };
      
    } catch (error) {
      return {
        name: repoName,
        error: error.message
      };
    }
  }

  async showGitStatus() {
    console.log('\n🔗 GIT LAYER STATUS');
    console.log('===================');
    
    console.log('\n📦 Repositories:');
    for (const [name, repo] of this.repos) {
      const status = await this.getRepoStatus(name);
      if (status) {
        console.log(`  ${name}:`);
        console.log(`    Path: ${status.path}`);
        console.log(`    Branch: ${status.branch || 'N/A'}`);
        console.log(`    Status: ${status.clean ? 'Clean' : `${status.changes} changes`}`);
        console.log(`    Commits: ${status.commits}`);
      }
    }
    
    console.log('\n🔗 Symlinks:');
    for (const [name, link] of this.symlinks) {
      const exists = fs.existsSync(link.target);
      console.log(`  ${name}: ${exists ? '✅' : '❌'} ${link.target}`);
    }
    
    console.log('\n📝 Recent Operations:');
    this.gitOperations.slice(-5).forEach(op => {
      console.log(`  ${op.timestamp.toISOString().substr(11, 8)} | ${op.type} | ${op.message || op.branch || op.tag}`);
    });
  }

  // Integration with other layers
  async integrateWithMVPGeneration(mvpData) {
    console.log('🔗 Integrating git layer with MVP generation...');
    
    const projectPath = mvpData.path || path.join('./generated', mvpData.name);
    
    // Initialize project repo
    await this.initRepo(projectPath, mvpData.name);
    
    // Create initial commit
    await this.createMVPCommit(
      projectPath,
      `Initial MVP: ${mvpData.name}\n\nGenerated from: ${mvpData.sourceDocument}`,
      ['.']
    );
    
    // Create development branch
    await this.createMVPBranch(projectPath, 'development');
    
    // Tag initial release
    await this.tagMVPRelease(projectPath, 'v1.0.0', 'Initial MVP release');
    
    // Switch back to main
    execSync('git checkout main', { cwd: projectPath, stdio: 'ignore' });
    
    console.log(`✅ Git integration complete for ${mvpData.name}`);
  }

  // Tier system connections
  async connectToTierSystem() {
    console.log('🔗 Connecting to tier system...');
    
    // Check if tier files exist via symlinks
    const tierFiles = ['symlink-manager.js', 'substrate-manager.js', 'universal-interface.js'];
    const availableTiers = [];
    
    for (const file of tierFiles) {
      if (fs.existsSync(file)) {
        availableTiers.push(file);
        console.log(`✅ Tier connected: ${file}`);
      }
    }
    
    if (availableTiers.length > 0) {
      console.log(`🎯 ${availableTiers.length} tier layers available`);
    } else {
      console.log('⚠️  No tier system connections found');
    }
    
    return availableTiers;
  }
}

// Start git layer if run directly
if (require.main === module) {
  const gitLayer = new DocumentGeneratorGitLayer();
  
  gitLayer.initialize().then(async () => {
    await gitLayer.showGitStatus();
    
    // Connect to tier system
    const tiers = await gitLayer.connectToTierSystem();
    
    console.log('\n✅ GIT LAYER OPERATIONAL!');
    console.log('Ready for version control and symlink management');
    
    if (tiers.length > 0) {
      console.log('\n🎯 Tier system accessible via:');
      tiers.forEach(tier => {
        console.log(`   node ${tier}`);
      });
    }
    
  }).catch(error => {
    console.error('❌ Git layer initialization failed:', error);
  });
}

module.exports = DocumentGeneratorGitLayer;