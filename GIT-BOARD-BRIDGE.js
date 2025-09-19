#!/usr/bin/env node

/**
 * 🔗📝 GIT-TO-BOARD BRIDGE
 * Phase 1.2: Real-time Git Commit to Forum Post Converter
 * 
 * Monitors git repositories for commits and converts them into rich forum posts
 * with AI character analysis. Each commit triggers character debates about code
 * quality, patterns, and architectural decisions.
 * 
 * Features:
 * - Real-time git monitoring via hooks and file watching
 * - Commit diff analysis and visualization
 * - AI character code reviews
 * - Forum thread creation with character discussions
 * - Visual entity spawning for significant changes
 * - RSS feed generation for development activity
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const chokidar = require('chokidar');
const simpleGit = require('simple-git');
const axios = require('axios');

// Integration with existing systems
const { UnifiedCharacterTool } = require('./unified-character-tool.js');
const { VisualEntitySpawningSystem } = require('./VISUAL-ENTITY-SPAWNING-SYSTEM.js');

console.log('🔗📝 GIT-TO-BOARD BRIDGE');
console.log('========================');

class GitBoardBridge extends EventEmitter {
  constructor(streamOrchestrator) {
    super();
    
    this.orchestrator = streamOrchestrator;
    this.bridgeId = crypto.randomUUID();
    
    // Git configuration
    this.gitConfig = {
      repoPath: process.env.GIT_REPO_PATH || process.cwd(),
      branch: process.env.GIT_BRANCH || 'main',
      remote: process.env.GIT_REMOTE || 'origin',
      pollInterval: 30000, // 30 seconds
      maxDiffSize: 10000, // Max diff size to include in posts
      ignorePatterns: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**'
      ]
    };
    
    // Forum configuration
    this.forumConfig = {
      apiUrl: process.env.FORUM_API_URL || 'http://localhost:8080/api',
      forumId: parseInt(process.env.FORUM_ID) || 1,
      commitForumId: parseInt(process.env.COMMIT_FORUM_ID) || 2, // Dedicated forum for commits
      maxPostLength: 10000,
      includeFullDiff: false,
      createThreadsForFeatures: true
    };
    
    // Character analysis configuration
    this.analysisConfig = {
      enabledCharacters: ['alice', 'bob', 'charlie', 'ralph', 'cal'],
      analysisDepth: 'detailed', // 'basic', 'detailed', 'comprehensive'
      debateTriggers: {
        controversial: ['hack', 'temp', 'todo', 'fixme', 'workaround'],
        significant: ['breaking', 'major', 'refactor', 'rewrite'],
        security: ['auth', 'password', 'token', 'key', 'secret']
      }
    };
    
    // Tracking data
    this.commitHistory = new Map();
    this.activeThreads = new Map();
    this.fileWatchers = new Map();
    this.lastProcessedCommit = null;
    
    // Services
    this.git = simpleGit(this.gitConfig.repoPath);
    this.characterTool = null;
    this.visualEntities = null;
    
    // RSS feed data
    this.rssFeed = {
      title: 'Development Activity Feed',
      description: 'Real-time development commits and AI analysis',
      items: [],
      maxItems: 50
    };
    
    this.initialize();
  }

  async initialize() {
    console.log('🔗 Initializing Git-to-Board Bridge...');
    
    try {
      // Verify git repository
      await this.verifyGitRepository();
      
      // Initialize services
      await this.initializeServices();
      
      // Setup git hooks
      await this.setupGitHooks();
      
      // Start file watchers
      await this.startFileWatchers();
      
      // Start polling for remote changes
      this.startGitPolling();
      
      // Process recent commits
      await this.processRecentCommits();
      
      console.log('✅ Git-to-Board Bridge initialized successfully');
      console.log(`📁 Monitoring: ${this.gitConfig.repoPath}`);
      console.log(`🌿 Branch: ${this.gitConfig.branch}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Git-to-Board Bridge:', error);
      throw error;
    }
  }

  async verifyGitRepository() {
    console.log('🔍 Verifying git repository...');
    
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        throw new Error(`${this.gitConfig.repoPath} is not a git repository`);
      }
      
      // Get current branch
      const branch = await this.git.branchLocal();
      this.gitConfig.branch = branch.current;
      
      console.log(`✅ Git repository verified: ${this.gitConfig.repoPath}`);
      console.log(`🌿 Current branch: ${this.gitConfig.branch}`);
      
    } catch (error) {
      console.error('❌ Git repository verification failed:', error);
      throw error;
    }
  }

  async initializeServices() {
    console.log('🔧 Initializing bridge services...');
    
    // Initialize Character Tool
    try {
      this.characterTool = new UnifiedCharacterTool();
      console.log('✅ Character Tool initialized for code analysis');
    } catch (error) {
      console.warn('⚠️ Character Tool unavailable:', error.message);
    }
    
    // Get Visual Entities from orchestrator if available
    if (this.orchestrator?.services?.visualEntities) {
      this.visualEntities = this.orchestrator.services.visualEntities;
      console.log('✅ Visual Entities connected from orchestrator');
    }
  }

  async setupGitHooks() {
    console.log('🪝 Setting up git hooks...');
    
    const hooksDir = path.join(this.gitConfig.repoPath, '.git', 'hooks');
    
    // Post-commit hook
    const postCommitHook = `#!/bin/sh
# Git-to-Board Bridge Post-Commit Hook
curl -X POST http://localhost:${this.orchestrator?.httpPort || 8892}/webhook/git \\
  -H "Content-Type: application/json" \\
  -d "{\\"event\\": \\"post-commit\\", \\"hash\\": \\"$(git rev-parse HEAD)\\"}"
`;
    
    try {
      await fs.writeFile(
        path.join(hooksDir, 'post-commit'),
        postCommitHook,
        { mode: 0o755 }
      );
      console.log('✅ Git hooks installed');
    } catch (error) {
      console.warn('⚠️ Could not install git hooks:', error.message);
    }
  }

  async startFileWatchers() {
    console.log('👁️ Starting file watchers...');
    
    // Watch .git directory for changes
    const gitWatcher = chokidar.watch(
      path.join(this.gitConfig.repoPath, '.git', 'refs', 'heads'),
      {
        ignored: this.gitConfig.ignorePatterns,
        persistent: true,
        ignoreInitial: true
      }
    );
    
    gitWatcher.on('change', async (filePath) => {
      console.log(`📝 Git ref changed: ${filePath}`);
      await this.checkForNewCommits();
    });
    
    this.fileWatchers.set('git', gitWatcher);
    
    // Watch source files for direct commits
    const sourceWatcher = chokidar.watch(
      this.gitConfig.repoPath,
      {
        ignored: [...this.gitConfig.ignorePatterns, /\.git/],
        persistent: true,
        ignoreInitial: true,
        depth: 5
      }
    );
    
    sourceWatcher.on('change', async (filePath) => {
      // Debounce file changes
      clearTimeout(this.fileChangeTimeout);
      this.fileChangeTimeout = setTimeout(async () => {
        await this.checkForUncommittedChanges();
      }, 5000);
    });
    
    this.fileWatchers.set('source', sourceWatcher);
    
    console.log('✅ File watchers active');
  }

  startGitPolling() {
    console.log('🔄 Starting git polling for remote changes...');
    
    setInterval(async () => {
      try {
        await this.git.fetch();
        await this.checkForNewCommits();
      } catch (error) {
        console.error('Git polling error:', error.message);
      }
    }, this.gitConfig.pollInterval);
  }

  async processRecentCommits() {
    console.log('📜 Processing recent commits...');
    
    try {
      // Get last 10 commits
      const log = await this.git.log(['-10']);
      
      console.log(`Found ${log.all.length} recent commits`);
      
      // Process each commit
      for (const commit of log.all.reverse()) {
        if (!this.commitHistory.has(commit.hash)) {
          await this.processCommit(commit);
        }
      }
      
    } catch (error) {
      console.error('Error processing recent commits:', error);
    }
  }

  async checkForNewCommits() {
    try {
      const log = await this.git.log(['-1']);
      const latestCommit = log.latest;
      
      if (latestCommit && latestCommit.hash !== this.lastProcessedCommit) {
        console.log(`🆕 New commit detected: ${latestCommit.hash.substring(0, 7)}`);
        await this.processCommit(latestCommit);
      }
    } catch (error) {
      console.error('Error checking for new commits:', error);
    }
  }

  async processCommit(commitInfo) {
    console.log(`\n🔍 PROCESSING COMMIT: ${commitInfo.hash.substring(0, 7)}`);
    console.log(`Author: ${commitInfo.author_name} <${commitInfo.author_email}>`);
    console.log(`Date: ${commitInfo.date}`);
    console.log(`Message: ${commitInfo.message}`);
    
    // Skip if already processed
    if (this.commitHistory.has(commitInfo.hash)) {
      console.log('⏭️ Commit already processed, skipping');
      return;
    }
    
    try {
      // Get detailed commit data
      const commitData = await this.getDetailedCommitData(commitInfo);
      
      // Store in history
      this.commitHistory.set(commitInfo.hash, {
        ...commitData,
        processedAt: Date.now(),
        forumPostId: null,
        characterAnalysis: {},
        visualEntityId: null
      });
      
      // Create forum post
      const forumPost = await this.createCommitForumPost(commitData);
      
      if (forumPost) {
        this.commitHistory.get(commitInfo.hash).forumPostId = forumPost.id;
        
        // Trigger character analysis
        await this.triggerCharacterAnalysis(commitData, forumPost);
        
        // Spawn visual entity if significant
        if (this.isSignificantCommit(commitData)) {
          await this.spawnCommitVisualEntity(commitData);
        }
        
        // Add to RSS feed
        this.addToRssFeed(commitData, forumPost);
      }
      
      // Update last processed
      this.lastProcessedCommit = commitInfo.hash;
      
      // Emit event for orchestrator
      this.emit('commit_processed', commitData);
      
    } catch (error) {
      console.error(`❌ Error processing commit ${commitInfo.hash}:`, error);
    }
  }

  async getDetailedCommitData(commitInfo) {
    console.log('📊 Getting detailed commit data...');
    
    try {
      // Get diff
      const diff = await this.git.show([commitInfo.hash]);
      
      // Get changed files
      const diffSummary = await this.git.diffSummary([`${commitInfo.hash}~1`, commitInfo.hash]);
      
      // Parse commit message for type
      const commitType = this.parseCommitType(commitInfo.message);
      
      // Check for breaking changes
      const isBreaking = commitInfo.message.toLowerCase().includes('breaking');
      
      // Analyze code quality indicators
      const qualityIndicators = this.analyzeCommitQuality(commitInfo.message, diff);
      
      return {
        ...commitInfo,
        type: commitType,
        isBreaking,
        diff: diff.substring(0, this.gitConfig.maxDiffSize),
        fullDiffSize: diff.length,
        diffTruncated: diff.length > this.gitConfig.maxDiffSize,
        files: diffSummary.files.map(f => ({
          file: f.file,
          changes: f.changes,
          insertions: f.insertions,
          deletions: f.deletions,
          binary: f.binary
        })),
        stats: {
          totalFiles: diffSummary.files.length,
          totalInsertions: diffSummary.insertions,
          totalDeletions: diffSummary.deletions,
          totalChanges: diffSummary.insertions + diffSummary.deletions
        },
        qualityIndicators
      };
      
    } catch (error) {
      console.error('Error getting detailed commit data:', error);
      return commitInfo;
    }
  }

  parseCommitType(message) {
    const types = {
      feat: 'feature',
      fix: 'bugfix',
      docs: 'documentation',
      style: 'style',
      refactor: 'refactor',
      test: 'test',
      chore: 'chore',
      perf: 'performance',
      ci: 'ci/cd',
      build: 'build',
      revert: 'revert'
    };
    
    const match = message.match(/^(\w+)(\(.+\))?:/);
    if (match) {
      return types[match[1]] || match[1];
    }
    
    // Guess from message content
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('fix')) return 'bugfix';
    if (lowerMessage.includes('add') || lowerMessage.includes('feature')) return 'feature';
    if (lowerMessage.includes('update')) return 'update';
    if (lowerMessage.includes('remove') || lowerMessage.includes('delete')) return 'removal';
    
    return 'other';
  }

  analyzeCommitQuality(message, diff) {
    const indicators = {
      hasTests: false,
      hasDocumentation: false,
      hasTodos: false,
      hasHacks: false,
      hasSecurityConcerns: false,
      codeSmells: []
    };
    
    const lowerMessage = message.toLowerCase();
    const lowerDiff = diff.toLowerCase();
    
    // Check message
    indicators.hasTests = lowerMessage.includes('test') || lowerMessage.includes('spec');
    indicators.hasDocumentation = lowerMessage.includes('docs') || lowerMessage.includes('readme');
    
    // Check diff content
    indicators.hasTodos = lowerDiff.includes('todo') || lowerDiff.includes('fixme');
    indicators.hasHacks = lowerDiff.includes('hack') || lowerDiff.includes('workaround');
    indicators.hasSecurityConcerns = this.analysisConfig.debateTriggers.security.some(
      keyword => lowerDiff.includes(keyword)
    );
    
    // Code smells
    if (lowerDiff.includes('console.log')) indicators.codeSmells.push('console.log statements');
    if (lowerDiff.includes('debugger')) indicators.codeSmells.push('debugger statements');
    if (/password\s*=\s*["']/.test(diff)) indicators.codeSmells.push('hardcoded passwords');
    
    return indicators;
  }

  async createCommitForumPost(commitData) {
    console.log('📝 Creating forum post for commit...');
    
    const isFeature = commitData.type === 'feature' && this.forumConfig.createThreadsForFeatures;
    
    const postData = {
      username: 'GitBot',
      subject: this.formatCommitSubject(commitData),
      content: this.formatCommitContent(commitData),
      forum_id: isFeature ? this.forumConfig.forumId : this.forumConfig.commitForumId,
      is_ai_agent: true,
      metadata: {
        commit_hash: commitData.hash,
        commit_type: commitData.type,
        author: commitData.author_name,
        timestamp: commitData.date
      }
    };
    
    try {
      const response = await axios.post(
        `${this.forumConfig.apiUrl}/posts`,
        postData,
        {
          headers: {
            'X-Agent-Token': this.bridgeId,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Forum post created: ${response.data.id}`);
      
      // Store thread reference
      this.activeThreads.set(commitData.hash, {
        postId: response.data.id,
        type: commitData.type,
        createdAt: Date.now()
      });
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Failed to create forum post:', error.message);
      
      // Emit commit info to orchestrator even if forum post fails
      if (this.orchestrator) {
        process.emit('git:commit', commitData);
      }
      
      return null;
    }
  }

  formatCommitSubject(commitData) {
    const typeEmoji = {
      feature: '✨',
      bugfix: '🐛',
      documentation: '📚',
      refactor: '♻️',
      performance: '⚡',
      test: '✅',
      build: '🏗️',
      ci: '👷',
      style: '💄',
      revert: '⏪',
      other: '📝'
    };
    
    const emoji = typeEmoji[commitData.type] || '📝';
    const breaking = commitData.isBreaking ? '💥 BREAKING: ' : '';
    
    return `${emoji} ${breaking}[${commitData.type.toUpperCase()}] ${commitData.message.split('\n')[0]}`;
  }

  formatCommitContent(commitData) {
    const qualityBadges = this.generateQualityBadges(commitData.qualityIndicators);
    
    let content = `
## Commit Details

**Hash:** \`${commitData.hash}\`
**Author:** ${commitData.author_name} <${commitData.author_email}>
**Date:** ${new Date(commitData.date).toLocaleString()}
**Type:** ${commitData.type}
${commitData.isBreaking ? '**⚠️ BREAKING CHANGE**\n' : ''}

${qualityBadges}

### Commit Message
\`\`\`
${commitData.message}
\`\`\`

### Statistics
- **Files Changed:** ${commitData.stats.totalFiles}
- **Additions:** +${commitData.stats.totalInsertions}
- **Deletions:** -${commitData.stats.totalDeletions}
- **Total Changes:** ${commitData.stats.totalChanges}

### Files Modified
${commitData.files.map(f => 
  `- \`${f.file}\` (+${f.insertions}/-${f.deletions})`
).join('\n')}
`;

    // Add diff preview if not too large
    if (commitData.diff && !commitData.diffTruncated) {
      content += `
### Full Diff
\`\`\`diff
${commitData.diff}
\`\`\`
`;
    } else if (commitData.diff) {
      content += `
### Diff Preview (truncated)
\`\`\`diff
${commitData.diff}
...
\`\`\`
*Full diff size: ${(commitData.fullDiffSize / 1024).toFixed(2)} KB*
`;
    }

    // Add quality warnings
    if (commitData.qualityIndicators.codeSmells.length > 0) {
      content += `
### ⚠️ Code Quality Warnings
${commitData.qualityIndicators.codeSmells.map(smell => `- ${smell}`).join('\n')}
`;
    }

    content += `
---
*This post was automatically generated by Git-to-Board Bridge*
*AI character analysis will follow...*
`;

    return content.trim();
  }

  generateQualityBadges(indicators) {
    const badges = [];
    
    if (indicators.hasTests) badges.push('✅ **Has Tests**');
    if (indicators.hasDocumentation) badges.push('📚 **Has Docs**');
    if (indicators.hasTodos) badges.push('📌 **Has TODOs**');
    if (indicators.hasHacks) badges.push('⚠️ **Has Hacks**');
    if (indicators.hasSecurityConcerns) badges.push('🔒 **Security Review Needed**');
    
    return badges.length > 0 ? `### Quality Indicators\n${badges.join(' | ')}\n` : '';
  }

  async triggerCharacterAnalysis(commitData, forumPost) {
    console.log('🎭 Triggering character analysis...');
    
    if (!this.characterTool) {
      console.warn('⚠️ Character tool not available for analysis');
      return;
    }
    
    const analyses = {};
    
    for (const character of this.analysisConfig.enabledCharacters) {
      console.log(`💭 ${character} analyzing commit...`);
      
      try {
        const analysis = await this.generateCharacterAnalysis(character, commitData);
        analyses[character] = analysis;
        
        // Post character analysis as reply
        if (forumPost && analysis) {
          await this.postCharacterAnalysis(character, forumPost.id, analysis);
        }
        
        // Delay between character posts
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error generating ${character} analysis:`, error);
      }
    }
    
    // Store analyses
    this.commitHistory.get(commitData.hash).characterAnalysis = analyses;
    
    // Check if debate should be triggered
    if (this.shouldTriggerDebate(commitData, analyses)) {
      await this.triggerCharacterDebate(commitData, forumPost);
    }
  }

  async generateCharacterAnalysis(character, commitData) {
    const prompts = {
      alice: `Analyze this commit for patterns and architectural implications:
Type: ${commitData.type}
Message: ${commitData.message}
Files: ${commitData.files.map(f => f.file).join(', ')}
Stats: +${commitData.stats.totalInsertions}/-${commitData.stats.totalDeletions}
Quality: ${JSON.stringify(commitData.qualityIndicators)}

Focus on: Pattern detection, architectural impact, and connections to other parts of the codebase.`,

      bob: `Review this commit from a builder's perspective:
Type: ${commitData.type}
Message: ${commitData.message}
Files: ${commitData.files.map(f => f.file).join(', ')}
Stats: +${commitData.stats.totalInsertions}/-${commitData.stats.totalDeletions}
Quality: ${JSON.stringify(commitData.qualityIndicators)}

Focus on: Code structure, documentation needs, and construction quality.`,

      charlie: `Perform security analysis on this commit:
Type: ${commitData.type}
Message: ${commitData.message}
Files: ${commitData.files.map(f => f.file).join(', ')}
Stats: +${commitData.stats.totalInsertions}/-${commitData.stats.totalDeletions}
Quality: ${JSON.stringify(commitData.qualityIndicators)}
${commitData.qualityIndicators.hasSecurityConcerns ? 'SECURITY FLAGS DETECTED!' : ''}

Focus on: Security vulnerabilities, validation issues, and defensive coding practices.`,

      ralph: `ANALYZE THIS COMMIT FOR DESTRUCTION POTENTIAL:
Type: ${commitData.type}
Message: ${commitData.message}
Files: ${commitData.files.map(f => f.file).join(', ')}
Stats: +${commitData.stats.totalInsertions}/-${commitData.stats.totalDeletions}

BE AGGRESSIVE! What needs to be DESTROYED and REBUILT?`,

      cal: `Provide wise insights on this commit:
Type: ${commitData.type}
Message: ${commitData.message}
Files: ${commitData.files.map(f => f.file).join(', ')}
Stats: +${commitData.stats.totalInsertions}/-${commitData.stats.totalDeletions}
Quality: ${JSON.stringify(commitData.qualityIndicators)}

Focus on: Learning opportunities, best practices, and growth potential.`
    };
    
    const prompt = prompts[character];
    if (!prompt) return null;
    
    try {
      const response = await this.characterTool.processCharacterResponse(character, prompt);
      return response;
    } catch (error) {
      console.error(`Error getting ${character} response:`, error);
      
      // Fallback to simple analysis
      return this.generateFallbackAnalysis(character, commitData);
    }
  }

  generateFallbackAnalysis(character, commitData) {
    const analyses = {
      alice: `I see interesting patterns in this ${commitData.type} commit. The changes across ${commitData.stats.totalFiles} files suggest ${commitData.stats.totalChanges > 100 ? 'significant architectural modifications' : 'focused improvements'}.`,
      
      bob: `This ${commitData.type} looks ${commitData.qualityIndicators.hasDocumentation ? 'well documented' : 'like it needs documentation'}. ${commitData.qualityIndicators.hasTests ? 'Good job including tests!' : 'Consider adding tests.'}`,
      
      charlie: `Security scan: ${commitData.qualityIndicators.hasSecurityConcerns ? '⚠️ POTENTIAL SECURITY ISSUES DETECTED! Requires immediate review.' : '✅ No immediate security concerns found.'}`,
      
      ralph: `${commitData.stats.totalDeletions > commitData.stats.totalInsertions ? 'EXCELLENT DESTRUCTION!' : 'NOT ENOUGH DELETION!'} This commit ${commitData.qualityIndicators.hasHacks ? 'has HACKS that must be DESTROYED!' : 'needs MORE AGGRESSIVE REFACTORING!'}`,
      
      cal: `This ${commitData.type} commit teaches us about ${commitData.message.split(' ')[0]}. ${commitData.qualityIndicators.hasTodos ? 'The TODOs remind us that perfection is a journey, not a destination.' : 'Clean code leads to clear minds.'}`
    };
    
    return analyses[character] || `Interesting ${commitData.type} commit!`;
  }

  async postCharacterAnalysis(character, postId, analysis) {
    const replyData = {
      username: character.charAt(0).toUpperCase() + character.slice(1),
      content: analysis,
      parent_id: postId,
      is_ai_agent: true,
      metadata: {
        character,
        analysis_type: 'commit_review'
      }
    };
    
    try {
      const response = await axios.post(
        `${this.forumConfig.apiUrl}/posts`,
        replyData,
        {
          headers: {
            'X-Agent-Token': this.bridgeId,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ ${character} posted analysis: ${response.data.id}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Failed to post ${character} analysis:`, error.message);
      return null;
    }
  }

  shouldTriggerDebate(commitData, analyses) {
    // Check for controversial keywords
    const hasControversial = this.analysisConfig.debateTriggers.controversial.some(
      keyword => commitData.message.toLowerCase().includes(keyword) ||
                 commitData.diff.toLowerCase().includes(keyword)
    );
    
    // Check for significant changes
    const isSignificant = this.analysisConfig.debateTriggers.significant.some(
      keyword => commitData.message.toLowerCase().includes(keyword)
    ) || commitData.stats.totalChanges > 500;
    
    // Check for security concerns
    const hasSecurityIssues = commitData.qualityIndicators.hasSecurityConcerns;
    
    // Check for conflicting character opinions (simplified)
    const hasConflictingOpinions = Object.values(analyses).some(a => 
      a.toLowerCase().includes('disagree') || 
      a.toLowerCase().includes('concern') ||
      a.toLowerCase().includes('problem')
    );
    
    return hasControversial || isSignificant || hasSecurityIssues || hasConflictingOpinions;
  }

  async triggerCharacterDebate(commitData, forumPost) {
    console.log('🎭 Triggering character debate about commit...');
    
    if (!this.orchestrator) {
      console.warn('⚠️ Orchestrator not available for debate');
      return;
    }
    
    // Select debate topic based on commit
    let topic = `Should we accept the ${commitData.type}: "${commitData.message}"?`;
    
    if (commitData.qualityIndicators.hasSecurityConcerns) {
      topic = `Security concerns in commit ${commitData.hash.substring(0, 7)} - How should we address them?`;
    } else if (commitData.qualityIndicators.hasHacks) {
      topic = `Technical debt introduced in ${commitData.hash.substring(0, 7)} - Refactor now or later?`;
    } else if (commitData.isBreaking) {
      topic = `Breaking change in ${commitData.hash.substring(0, 7)} - Worth the disruption?`;
    }
    
    // Request debate from orchestrator
    try {
      const response = await axios.post(
        `http://localhost:${this.orchestrator.httpPort}/debate/start`,
        {
          topic,
          participants: ['alice', 'bob', 'ralph'],
          context: {
            commitHash: commitData.hash,
            forumPostId: forumPost?.id,
            trigger: 'controversial_commit'
          }
        },
        {
          headers: {
            'X-Agent-Token': this.bridgeId,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Character debate started');
      
    } catch (error) {
      console.error('❌ Failed to start debate:', error.message);
    }
  }

  isSignificantCommit(commitData) {
    return commitData.type === 'feature' ||
           commitData.isBreaking ||
           commitData.stats.totalChanges > 200 ||
           commitData.stats.totalFiles > 10 ||
           commitData.qualityIndicators.hasSecurityConcerns;
  }

  async spawnCommitVisualEntity(commitData) {
    if (!this.visualEntities) {
      return;
    }
    
    console.log('🌟 Spawning visual entity for significant commit...');
    
    try {
      const entityType = commitData.type === 'feature' ? 'floating_todo' : 
                        commitData.type === 'bugfix' ? 'contract_service' :
                        'wisdom_orb';
      
      const entity = await this.visualEntities.spawnEntity(
        entityType,
        {
          x: Math.random() * 800 - 400,
          y: Math.random() * 600 - 300,
          z: Math.random() * 100
        },
        {
          description: `${commitData.type}: ${commitData.message.substring(0, 50)}`,
          tags: ['commit', commitData.type, commitData.author_name],
          contractState: commitData.qualityIndicators.hasTests ? 'VALIDATED' : 'ALIVE',
          customSprite: `commit_${commitData.type}.png`,
          mass: Math.log(commitData.stats.totalChanges + 1) * 0.5,
          commissionArtwork: commitData.type === 'feature',
          metadata: {
            commitHash: commitData.hash,
            author: commitData.author_name,
            timestamp: commitData.date,
            quality: commitData.qualityIndicators
          }
        }
      );
      
      this.commitHistory.get(commitData.hash).visualEntityId = entity.entityId;
      console.log(`✅ Visual entity spawned: ${entity.entityId}`);
      
    } catch (error) {
      console.error('❌ Failed to spawn visual entity:', error.message);
    }
  }

  addToRssFeed(commitData, forumPost) {
    const rssItem = {
      id: commitData.hash,
      title: this.formatCommitSubject(commitData),
      description: `${commitData.message}\n\nFiles: ${commitData.stats.totalFiles}, Changes: +${commitData.stats.totalInsertions}/-${commitData.stats.totalDeletions}`,
      link: forumPost ? `http://localhost:8080/posts/${forumPost.id}` : '#',
      author: commitData.author_name,
      pubDate: new Date(commitData.date).toISOString(),
      categories: [commitData.type, 'commit']
    };
    
    // Add to feed
    this.rssFeed.items.unshift(rssItem);
    
    // Trim to max items
    if (this.rssFeed.items.length > this.rssFeed.maxItems) {
      this.rssFeed.items = this.rssFeed.items.slice(0, this.rssFeed.maxItems);
    }
    
    // Emit RSS update
    this.emit('rss_updated', this.rssFeed);
    
    // Notify orchestrator
    if (this.orchestrator) {
      process.emit('rss:new', rssItem);
    }
  }

  async checkForUncommittedChanges() {
    try {
      const status = await this.git.status();
      
      if (status.files.length > 0) {
        console.log(`📝 ${status.files.length} uncommitted changes detected`);
        
        // Emit warning to orchestrator
        if (this.orchestrator) {
          this.orchestrator.broadcastToStream({
            type: 'uncommitted_changes',
            files: status.files.length,
            staged: status.staged.length,
            modified: status.modified.length,
            created: status.created.length,
            deleted: status.deleted.length
          });
        }
      }
    } catch (error) {
      console.error('Error checking uncommitted changes:', error);
    }
  }

  // Generate RSS feed XML
  generateRssFeedXml() {
    const items = this.rssFeed.items.map(item => `
    <item>
      <title>${this.escapeXml(item.title)}</title>
      <description>${this.escapeXml(item.description)}</description>
      <link>${item.link}</link>
      <guid>${item.id}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <author>${this.escapeXml(item.author)}</author>
      ${item.categories.map(cat => `<category>${cat}</category>`).join('\n      ')}
    </item>`).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${this.escapeXml(this.rssFeed.title)}</title>
    <description>${this.escapeXml(this.rssFeed.description)}</description>
    <link>http://localhost:8080</link>
    <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Public API
  async getRssFeed() {
    return this.generateRssFeedXml();
  }

  async getCommitHistory(limit = 50) {
    const commits = Array.from(this.commitHistory.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
    
    return commits;
  }

  async getActiveThreads() {
    return Array.from(this.activeThreads.entries()).map(([hash, thread]) => ({
      commitHash: hash,
      ...thread
    }));
  }

  // Cleanup
  async shutdown() {
    console.log('🛑 Shutting down Git-to-Board Bridge...');
    
    // Stop file watchers
    for (const [name, watcher] of this.fileWatchers) {
      await watcher.close();
      console.log(`✅ Stopped ${name} watcher`);
    }
    
    // Clear timeouts
    clearTimeout(this.fileChangeTimeout);
    
    console.log('✅ Git-to-Board Bridge shutdown complete');
  }
}

// Export for integration
module.exports = { GitBoardBridge };

// Run if called directly
if (require.main === module) {
  const bridge = new GitBoardBridge();
  
  console.log(`
🔗📝 GIT-TO-BOARD BRIDGE RUNNING!
================================

Monitoring: ${bridge.gitConfig.repoPath}
Branch: ${bridge.gitConfig.branch}
Forum API: ${bridge.forumConfig.apiUrl}

Features:
- Real-time commit monitoring
- Automatic forum post creation
- AI character code reviews
- Visual entity spawning
- RSS feed generation
- Debate triggering for controversial commits

Recent commits will be processed and posted to the forum.
Characters will analyze and discuss code changes.

Press Ctrl+C to stop monitoring.
  `);
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutdown signal received');
    await bridge.shutdown();
    process.exit(0);
  });
}