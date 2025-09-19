#!/usr/bin/env node

/**
 * SOULFRA GIT WRAPPER
 * 
 * Voice-controlled Git operations with AI enhancement and permission management.
 * Integrates with SoulFra OAuth system and GitHub automation service.
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const axios = require('axios').default;

const execAsync = util.promisify(exec);

class SoulFraGit {
  constructor() {
    this.authDaemonUrl = 'http://localhost:8463';
    this.githubToken = null;
    this.currentRepo = null;
    this.permissionLevels = {
      'private': { visibility: 'private', protection: true },
      'protected': { visibility: 'private', protection: true },
      'public': { visibility: 'public', protection: false },
      'remixable': { visibility: 'public', protection: false, issues: true, pulls: true },
      'opensource': { visibility: 'public', protection: false, issues: true, pulls: true, wiki: true }
    };
    
    this.init();
  }

  async init() {
    await this.loadGitHubToken();
    await this.detectCurrentRepo();
    this.setupVoiceIntegration();
  }

  // === AUTHENTICATION ===
  
  async loadGitHubToken() {
    try {
      const response = await axios.get(`${this.authDaemonUrl}/auth/github/token`);
      this.githubToken = response.data.token;
      console.log('🔐 GitHub token loaded from SoulFra OAuth system');
    } catch (error) {
      console.warn('⚠️  GitHub token not found. Run: soulfra-auth login github');
      this.githubToken = process.env.GITHUB_TOKEN;
    }
  }

  async authenticateWithGitHub() {
    if (!this.githubToken) {
      console.log('🚀 Initiating GitHub OAuth through SoulFra...');
      try {
        await axios.post(`${this.authDaemonUrl}/auth/github/login`);
        await this.loadGitHubToken();
      } catch (error) {
        throw new Error('Failed to authenticate with GitHub. Ensure SoulFra OAuth daemon is running.');
      }
    }
    return this.githubToken;
  }

  // === REPOSITORY DETECTION ===
  
  async detectCurrentRepo() {
    try {
      const { stdout } = await execAsync('git remote get-url origin');
      const remoteUrl = stdout.trim();
      
      // Parse GitHub repo from remote URL
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
      if (match) {
        this.currentRepo = {
          owner: match[1],
          name: match[2],
          url: remoteUrl
        };
        console.log(`📂 Current repository: ${this.currentRepo.owner}/${this.currentRepo.name}`);
      }
    } catch (error) {
      // Not in a Git repository or no origin remote
      this.currentRepo = null;
    }
  }

  // === VOICE INTEGRATION ===
  
  setupVoiceIntegration() {
    // Register voice commands with the voice engine
    if (typeof window !== 'undefined' && window.soulFraVoiceEngine) {
      const commands = {
        'create branch': this.createBranch.bind(this),
        'commit changes': this.smartCommit.bind(this),
        'push code': this.pushWithAI.bind(this),
        'create pull request': this.createPullRequest.bind(this),
        'make branch public': () => this.setBranchPermission('public'),
        'make branch remixable': () => this.setBranchPermission('remixable'),
        'make branch private': () => this.setBranchPermission('private'),
        'show repository status': this.getRepoStatus.bind(this),
        'sync with remote': this.syncRepository.bind(this)
      };
      
      Object.entries(commands).forEach(([phrase, handler]) => {
        window.soulFraVoiceEngine.addCommand(phrase, handler);
      });
    }
  }

  // === AI-ENHANCED GIT OPERATIONS ===
  
  async createBranch(branchName = null, fromVoice = false) {
    try {
      if (!branchName) {
        if (fromVoice) {
          // Generate branch name from recent changes or context
          branchName = await this.generateBranchName();
        } else {
          branchName = await this.promptForBranchName();
        }
      }
      
      // Sanitize branch name
      const safeBranchName = branchName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      console.log(`🌳 Creating branch: ${safeBranchName}`);
      
      await execAsync(`git checkout -b ${safeBranchName}`);
      
      // Log to learning system
      this.logLearningActivity('git_mastery', 'branch_creation', {
        branchName: safeBranchName,
        method: fromVoice ? 'voice' : 'manual'
      });
      
      return safeBranchName;
    } catch (error) {
      console.error('❌ Failed to create branch:', error.message);
      throw error;
    }
  }

  async smartCommit(message = null, fromVoice = false) {
    try {
      // Check for staged changes
      const { stdout: status } = await execAsync('git status --porcelain');
      
      if (!status.trim()) {
        console.log('📝 No changes to commit. Staging all changes...');
        await execAsync('git add .');
      }
      
      // Generate AI commit message if not provided
      if (!message) {
        message = await this.generateCommitMessage();
      }
      
      console.log(`💬 Commit message: ${message}`);
      await execAsync(`git commit -m "${message}"`);
      
      // Log to learning system
      this.logLearningActivity('git_mastery', 'commit_creation', {
        message,
        aiGenerated: !message,
        method: fromVoice ? 'voice' : 'manual'
      });
      
      return message;
    } catch (error) {
      console.error('❌ Failed to commit:', error.message);
      throw error;
    }
  }

  async generateCommitMessage() {
    try {
      // Get git diff
      const { stdout: diff } = await execAsync('git diff --staged');
      
      if (!diff.trim()) {
        return 'chore: update files';
      }
      
      // Use AI to generate commit message
      const aiMessage = await this.queryAI(`
        Generate a conventional commit message for these changes:
        
        ${diff.slice(0, 2000)}
        
        Follow the format: type(scope): description
        Types: feat, fix, docs, style, refactor, test, chore
        Keep it under 50 characters.
      `);
      
      return aiMessage.trim();
    } catch (error) {
      console.warn('⚠️  Failed to generate AI commit message, using default');
      return 'chore: update files';
    }
  }

  async generateBranchName() {
    try {
      // Get current state and recent commits
      const { stdout: status } = await execAsync('git status --porcelain');
      const { stdout: lastCommit } = await execAsync('git log -1 --oneline');
      
      const context = `Status: ${status}\nLast commit: ${lastCommit}`;
      
      const branchName = await this.queryAI(`
        Generate a git branch name based on current work:
        
        ${context}
        
        Format: type/brief-description
        Types: feature, bugfix, hotfix, experiment, docs
        Use kebab-case, max 30 characters.
      `);
      
      return branchName.trim();
    } catch (error) {
      return 'feature/voice-request';
    }
  }

  async pushWithAI() {
    try {
      const { stdout: currentBranch } = await execAsync('git branch --show-current');
      const branch = currentBranch.trim();
      
      console.log(`🚀 Pushing branch: ${branch}`);
      
      // Push to remote
      await execAsync(`git push -u origin ${branch}`);
      
      // Check if we should create a PR
      if (branch !== 'main' && branch !== 'master') {
        const shouldCreatePR = await this.shouldCreatePR();
        if (shouldCreatePR) {
          await this.createPullRequest();
        }
      }
      
      return branch;
    } catch (error) {
      console.error('❌ Failed to push:', error.message);
      throw error;
    }
  }

  async shouldCreatePR() {
    // Simple heuristic: create PR for feature branches
    const { stdout: currentBranch } = await execAsync('git branch --show-current');
    const branch = currentBranch.trim();
    
    return branch.startsWith('feature/') || 
           branch.startsWith('bugfix/') || 
           branch.startsWith('hotfix/');
  }

  async createPullRequest() {
    try {
      await this.authenticateWithGitHub();
      
      if (!this.currentRepo) {
        throw new Error('Not in a GitHub repository');
      }
      
      const { stdout: currentBranch } = await execAsync('git branch --show-current');
      const branch = currentBranch.trim();
      
      // Generate PR title and description
      const prData = await this.generatePRData(branch);
      
      const response = await axios.post(
        `https://api.github.com/repos/${this.currentRepo.owner}/${this.currentRepo.name}/pulls`,
        {
          title: prData.title,
          body: prData.body,
          head: branch,
          base: 'main'
        },
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      console.log(`🎉 Pull request created: ${response.data.html_url}`);
      
      // Log to learning system
      this.logLearningActivity('git_mastery', 'pr_creation', {
        prUrl: response.data.html_url,
        branch,
        aiGenerated: true
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create pull request:', error.message);
      throw error;
    }
  }

  async generatePRData(branch) {
    try {
      // Get commits and diff for this branch
      const { stdout: commits } = await execAsync(`git log main..${branch} --oneline`);
      const { stdout: diff } = await execAsync(`git diff main..${branch} --stat`);
      
      const context = `Branch: ${branch}\nCommits:\n${commits}\nChanges:\n${diff}`;
      
      const prDescription = await this.queryAI(`
        Generate a GitHub pull request title and description for this branch:
        
        ${context}
        
        Return JSON format:
        {
          "title": "Brief title under 50 chars",
          "body": "Detailed description with bullet points"
        }
      `);
      
      return JSON.parse(prDescription);
    } catch (error) {
      return {
        title: `Update from ${branch}`,
        body: `## Changes\n\nUpdates from branch \`${branch}\`\n\n- Various improvements and fixes\n\n---\n*Generated by SoulFra AI*`
      };
    }
  }

  // === PERMISSION MANAGEMENT ===
  
  async setBranchPermission(level, branchName = null) {
    try {
      await this.authenticateWithGitHub();
      
      if (!this.currentRepo) {
        throw new Error('Not in a GitHub repository');
      }
      
      if (!branchName) {
        const { stdout: currentBranch } = await execAsync('git branch --show-current');
        branchName = currentBranch.trim();
      }
      
      const permissions = this.permissionLevels[level];
      if (!permissions) {
        throw new Error(`Unknown permission level: ${level}`);
      }
      
      console.log(`🔒 Setting ${branchName} to ${level} permission level`);
      
      // Update repository settings
      if (level === 'public' || level === 'remixable' || level === 'opensource') {
        await this.setRepositoryVisibility('public');
      }
      
      // Set branch protection if needed
      if (permissions.protection) {
        await this.setBranchProtection(branchName);
      }
      
      // Enable features for remixable/opensource
      if (level === 'remixable' || level === 'opensource') {
        await this.enableCommunityFeatures();
      }
      
      console.log(`✅ Branch ${branchName} is now ${level}`);
      
      // Log to learning system
      this.logLearningActivity('git_mastery', 'permission_change', {
        branch: branchName,
        level,
        timestamp: Date.now()
      });
      
      return { branch: branchName, level, permissions };
    } catch (error) {
      console.error('❌ Failed to set branch permission:', error.message);
      throw error;
    }
  }

  async setRepositoryVisibility(visibility) {
    try {
      await axios.patch(
        `https://api.github.com/repos/${this.currentRepo.owner}/${this.currentRepo.name}`,
        { private: visibility === 'private' },
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
    } catch (error) {
      console.warn('⚠️  Could not change repository visibility:', error.message);
    }
  }

  async setBranchProtection(branchName) {
    try {
      await axios.put(
        `https://api.github.com/repos/${this.currentRepo.owner}/${this.currentRepo.name}/branches/${branchName}/protection`,
        {
          required_status_checks: null,
          enforce_admins: false,
          required_pull_request_reviews: {
            required_approving_review_count: 1
          },
          restrictions: null
        },
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
    } catch (error) {
      console.warn('⚠️  Could not set branch protection:', error.message);
    }
  }

  async enableCommunityFeatures() {
    try {
      // Enable issues and pull requests
      await axios.patch(
        `https://api.github.com/repos/${this.currentRepo.owner}/${this.currentRepo.name}`,
        {
          has_issues: true,
          has_projects: true,
          has_wiki: true
        },
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
    } catch (error) {
      console.warn('⚠️  Could not enable community features:', error.message);
    }
  }

  // === REPOSITORY STATUS ===
  
  async getRepoStatus() {
    try {
      const status = {
        repository: this.currentRepo,
        branch: null,
        changes: null,
        remoteStatus: null,
        permissions: null
      };
      
      // Get current branch
      const { stdout: currentBranch } = await execAsync('git branch --show-current');
      status.branch = currentBranch.trim();
      
      // Get working directory status
      const { stdout: gitStatus } = await execAsync('git status --porcelain');
      status.changes = gitStatus.trim().split('\n').filter(line => line.trim());
      
      // Get remote status
      try {
        await execAsync('git fetch');
        const { stdout: behindAhead } = await execAsync('git rev-list --left-right --count origin/main...HEAD');
        const [behind, ahead] = behindAhead.trim().split('\t');
        status.remoteStatus = { behind: parseInt(behind), ahead: parseInt(ahead) };
      } catch (error) {
        status.remoteStatus = null;
      }
      
      // Get repository permissions from GitHub
      if (this.githubToken && this.currentRepo) {
        try {
          const response = await axios.get(
            `https://api.github.com/repos/${this.currentRepo.owner}/${this.currentRepo.name}`,
            {
              headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );
          
          status.permissions = {
            private: response.data.private,
            issues: response.data.has_issues,
            projects: response.data.has_projects,
            wiki: response.data.has_wiki
          };
        } catch (error) {
          status.permissions = null;
        }
      }
      
      console.log('📊 Repository Status:', JSON.stringify(status, null, 2));
      return status;
    } catch (error) {
      console.error('❌ Failed to get repository status:', error.message);
      throw error;
    }
  }

  async syncRepository() {
    try {
      console.log('🔄 Syncing repository...');
      
      // Fetch latest changes
      await execAsync('git fetch --all');
      
      // Get current branch
      const { stdout: currentBranch } = await execAsync('git branch --show-current');
      const branch = currentBranch.trim();
      
      // Check if we're behind
      try {
        const { stdout: behindAhead } = await execAsync(`git rev-list --left-right --count origin/${branch}...HEAD`);
        const [behind, ahead] = behindAhead.trim().split('\t');
        
        if (parseInt(behind) > 0) {
          console.log(`📥 Pulling ${behind} commits from remote`);
          await execAsync(`git pull origin ${branch}`);
        }
        
        if (parseInt(ahead) > 0) {
          console.log(`📤 You have ${ahead} commits to push`);
        }
      } catch (error) {
        // Branch might not exist on remote
        console.log('🌱 Branch exists only locally');
      }
      
      console.log('✅ Repository synced');
      return true;
    } catch (error) {
      console.error('❌ Failed to sync repository:', error.message);
      throw error;
    }
  }

  // === AI INTEGRATION ===
  
  async queryAI(prompt) {
    try {
      // Try local AI first (Ollama)
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'codellama',
        prompt,
        stream: false
      });
      
      return response.data.response;
    } catch (error) {
      // Fallback to SoulFra AI service
      try {
        const response = await axios.post('http://localhost:3001/ai/query', {
          prompt,
          model: 'claude-3-sonnet',
          temperature: 0.3
        });
        
        return response.data.response;
      } catch (fallbackError) {
        console.warn('⚠️  AI not available, using fallback');
        return 'AI service unavailable';
      }
    }
  }

  // === LEARNING SYSTEM INTEGRATION ===
  
  logLearningActivity(subject, activity, metadata = {}) {
    try {
      // Send to learning system if available
      if (typeof window !== 'undefined' && window.soulFraLearningEngine) {
        window.soulFraLearningEngine.logActivity(subject, activity, metadata);
      } else {
        // Log to file for later processing
        const logEntry = {
          timestamp: Date.now(),
          subject,
          activity,
          metadata
        };
        
        const logFile = path.join(process.cwd(), '.soulfra-git-activity.log');
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
      }
    } catch (error) {
      // Silent fail - logging shouldn't break git operations
    }
  }

  // === CLI INTERFACE ===
  
  async handleCommand(args) {
    const command = args[0];
    const params = args.slice(1);
    
    try {
      switch (command) {
        case 'branch':
          return await this.createBranch(params[0]);
          
        case 'commit':
          return await this.smartCommit(params.join(' ') || null);
          
        case 'push':
          return await this.pushWithAI();
          
        case 'pr':
        case 'pull-request':
          return await this.createPullRequest();
          
        case 'permission':
        case 'perm':
          return await this.setBranchPermission(params[0], params[1]);
          
        case 'status':
          return await this.getRepoStatus();
          
        case 'sync':
          return await this.syncRepository();
          
        case 'init':
          return await this.initRepository(params[0]);
          
        default:
          this.showHelp();
          return;
      }
    } catch (error) {
      console.error(`❌ Error executing ${command}:`, error.message);
      process.exit(1);
    }
  }

  async initRepository(repoName) {
    try {
      if (!repoName) {
        throw new Error('Repository name required');
      }
      
      console.log(`🚀 Initializing SoulFra repository: ${repoName}`);
      
      // Initialize git repository
      await execAsync('git init');
      
      // Create initial files
      const readmeContent = `# ${repoName}\n\nA SoulFra-managed repository with voice-controlled Git operations.\n\n## Voice Commands\n\n- "SoulFra create branch [name]"\n- "SoulFra commit changes"\n- "SoulFra make branch public"\n- "SoulFra create pull request"\n\n---\n*Powered by SoulFra AI*`;
      
      fs.writeFileSync('README.md', readmeContent);
      
      // Initial commit
      await execAsync('git add README.md');
      await execAsync('git commit -m "feat: initialize SoulFra repository"');
      
      // Create GitHub repository if authenticated
      if (this.githubToken) {
        await this.createGitHubRepository(repoName);
      }
      
      console.log(`✅ Repository ${repoName} initialized`);
      return repoName;
    } catch (error) {
      console.error('❌ Failed to initialize repository:', error.message);
      throw error;
    }
  }

  async createGitHubRepository(name) {
    try {
      const response = await axios.post(
        'https://api.github.com/user/repos',
        {
          name,
          description: 'A SoulFra-managed repository with AI-enhanced Git operations',
          private: false,
          has_issues: true,
          has_projects: true,
          has_wiki: true
        },
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      // Add remote
      await execAsync(`git remote add origin ${response.data.clone_url}`);
      await execAsync('git push -u origin main');
      
      console.log(`🌐 GitHub repository created: ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      console.warn('⚠️  Could not create GitHub repository:', error.message);
    }
  }

  showHelp() {
    console.log(`
🚀 SoulFra Git - Voice-Controlled Git Operations

USAGE:
  soulfra-git <command> [options]

COMMANDS:
  branch [name]           Create a new branch (AI generates name if not provided)
  commit [message]        Smart commit with AI-generated message
  push                    Push with AI assistance and auto-PR
  pr, pull-request        Create pull request with AI description
  permission <level>      Set branch permission (private|public|remixable|opensource)
  status                  Show detailed repository status
  sync                    Sync with remote repository
  init <name>             Initialize new SoulFra repository

PERMISSION LEVELS:
  private      - Only you and invited collaborators
  protected    - Team members with specific permissions  
  public       - Anyone can view and fork
  remixable    - Community can create PRs and suggestions
  opensource   - Full community contribution

VOICE COMMANDS:
  Say "SoulFra" followed by:
  - "create branch [name]"
  - "commit changes"  
  - "make branch public/remixable/private"
  - "create pull request"
  - "show repository status"

EXAMPLES:
  soulfra-git branch feature-auth    # Create feature branch
  soulfra-git commit                 # AI generates commit message
  soulfra-git permission remixable   # Make current branch remixable
  soulfra-git init my-project        # Create new repository

For more help: https://soulfra.dev/docs/git
    `);
  }
}

// === CLI EXECUTION ===

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    const git = new SoulFraGit();
    git.showHelp();
    process.exit(0);
  }
  
  const git = new SoulFraGit();
  git.handleCommand(args)
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ SoulFra Git Error:', error.message);
      process.exit(1);
    });
}

module.exports = SoulFraGit;