/**
 * GitHub Automation Service
 * Adapted from Soulfra-AgentZero's AI_ECONOMY_GITHUB_AUTOMATION
 * Provides automated PR creation, AI collaboration, and code improvement workflows
 */

import { EventEmitter } from 'events';
import { Octokit } from '@octokit/rest';
import { PrismaClient } from '@prisma/client';
import Bull from 'bull';
import { logger } from '../../utils/logger';
import { AIService } from '../ai/ai.service';

interface GitHubConfig {
  token?: string;
  owner?: string;
  repo?: string;
  baseUrl?: string;
}

interface ImprovementProposal {
  id: string;
  agentId: string;
  type: 'refactor' | 'security_fix' | 'feature' | 'optimization' | 'bug_fix';
  targetFiles: string[];
  description: string;
  implementationPlan: string;
  estimatedImpact: number;
  bountyAmount?: number;
  status: 'proposed' | 'pr_created' | 'under_review' | 'merged' | 'rejected';
  githubPrUrl?: string;
  githubPrNumber?: number;
  createdAt: Date;
}

interface AIReview {
  id: string;
  proposalId: string;
  reviewerAgentId: string;
  reviewType: 'approve' | 'request_changes' | 'comment';
  confidenceScore: number;
  reviewComment: string;
  codeQualityScore: number;
  securityScore: number;
  performanceImpact: number;
  createdAt: Date;
}

export class GitHubAutomationService extends EventEmitter {
  private octokit: Octokit;
  private prisma: PrismaClient;
  private aiService: AIService;
  private queue: Bull.Queue;
  private config: GitHubConfig;
  private consensusThreshold = 0.7; // 70% approval needed for auto-merge

  constructor(config?: GitHubConfig) {
    super();
    
    this.config = {
      token: config?.token || process.env.GITHUB_TOKEN,
      owner: config?.owner || process.env.GITHUB_OWNER,
      repo: config?.repo || process.env.GITHUB_REPO,
      baseUrl: config?.baseUrl
    };

    // Initialize GitHub client
    this.octokit = new Octokit({
      auth: this.config.token,
      baseUrl: this.config.baseUrl
    });

    // Initialize services
    this.prisma = new PrismaClient();
    this.aiService = new AIService();
    
    // Initialize queue for async PR operations
    this.queue = new Bull('github-automation', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.setupQueueProcessors();
  }

  private setupQueueProcessors() {
    // Process improvement proposals
    this.queue.process('create-pr', async (job) => {
      const { proposal } = job.data;
      return await this.createPullRequest(proposal);
    });

    // Process AI reviews
    this.queue.process('ai-review', async (job) => {
      const { prNumber, proposalId } = job.data;
      return await this.performAIReview(prNumber, proposalId);
    });

    // Process consensus checks
    this.queue.process('check-consensus', async (job) => {
      const { proposalId } = job.data;
      return await this.checkConsensus(proposalId);
    });
  }

  /**
   * Analyze codebase and suggest improvements
   */
  async analyzeCodebase(targetPath?: string): Promise<ImprovementProposal[]> {
    try {
      logger.info('Analyzing codebase for improvements', { targetPath });

      // Get repository contents
      const files = await this.getRepositoryFiles(targetPath);
      const proposals: ImprovementProposal[] = [];

      // Analyze each file with AI
      for (const file of files) {
        if (this.shouldAnalyzeFile(file.path)) {
          const content = await this.getFileContent(file.path);
          const analysis = await this.aiService.analyzeCode({
            code: content,
            language: this.detectLanguage(file.path),
            analysisType: 'comprehensive'
          });

          // Generate improvement proposals based on analysis
          if (analysis.suggestions && analysis.suggestions.length > 0) {
            const proposal = await this.generateProposal(file.path, analysis);
            if (proposal) {
              proposals.push(proposal);
            }
          }
        }
      }

      // Store proposals in database
      for (const proposal of proposals) {
        await this.storeProposal(proposal);
      }

      logger.info('Codebase analysis complete', { 
        proposalsCount: proposals.length 
      });

      return proposals;
    } catch (error) {
      logger.error('Error analyzing codebase', error);
      throw error;
    }
  }

  /**
   * Create a pull request from an improvement proposal
   */
  async createPullRequest(proposal: ImprovementProposal): Promise<string> {
    try {
      logger.info('Creating pull request', { proposalId: proposal.id });

      // Create a new branch
      const branchName = `ai-improvement/${proposal.type}/${proposal.id}`;
      await this.createBranch(branchName);

      // Apply improvements to files
      for (const filePath of proposal.targetFiles) {
        const originalContent = await this.getFileContent(filePath);
        const improvedContent = await this.applyImprovements(
          originalContent,
          proposal,
          filePath
        );

        await this.updateFile(filePath, improvedContent, branchName, 
          `AI: ${proposal.type} for ${filePath}`
        );
      }

      // Create pull request
      const pr = await this.octokit.pulls.create({
        owner: this.config.owner!,
        repo: this.config.repo!,
        title: `AI ${proposal.type}: ${proposal.description}`,
        head: branchName,
        base: 'main',
        body: this.generatePRBody(proposal)
      });

      // Update proposal with PR info
      await this.updateProposalStatus(proposal.id, {
        status: 'pr_created',
        githubPrUrl: pr.data.html_url,
        githubPrNumber: pr.data.number
      });

      // Queue AI reviews
      await this.queue.add('ai-review', {
        prNumber: pr.data.number,
        proposalId: proposal.id
      });

      logger.info('Pull request created', { 
        prNumber: pr.data.number,
        prUrl: pr.data.html_url 
      });

      return pr.data.html_url;
    } catch (error) {
      logger.error('Error creating pull request', error);
      throw error;
    }
  }

  /**
   * Perform AI review on a pull request
   */
  private async performAIReview(prNumber: number, proposalId: string): Promise<AIReview[]> {
    try {
      logger.info('Performing AI review', { prNumber, proposalId });

      // Get PR diff
      const diff = await this.getPRDiff(prNumber);
      
      // Get multiple AI agents to review
      const reviewAgents = ['security-agent', 'quality-agent', 'performance-agent'];
      const reviews: AIReview[] = [];

      for (const agentId of reviewAgents) {
        const review = await this.getAIReview(agentId, diff, proposalId);
        reviews.push(review);

        // Post review comment on GitHub
        await this.postReviewComment(prNumber, review);
      }

      // Check for consensus
      await this.queue.add('check-consensus', { proposalId });

      return reviews;
    } catch (error) {
      logger.error('Error performing AI review', error);
      throw error;
    }
  }

  /**
   * Get AI review for code changes
   */
  private async getAIReview(agentId: string, diff: string, proposalId: string): Promise<AIReview> {
    const prompt = `
You are an AI code reviewer specializing in ${agentId}. 
Review the following code changes and provide:
1. Overall review type (approve/request_changes/comment)
2. Confidence score (0-1)
3. Detailed review comment
4. Code quality score (0-100)
5. Security score (0-100)
6. Performance impact (-100 to +100)

Diff:
${diff}
`;

    const response = await this.aiService.query({
      prompt,
      model: 'claude-3-opus',
      temperature: 0.3
    });

    // Parse AI response into structured review
    const review: AIReview = {
      id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      proposalId,
      reviewerAgentId: agentId,
      reviewType: this.parseReviewType(response),
      confidenceScore: this.parseConfidenceScore(response),
      reviewComment: this.parseReviewComment(response),
      codeQualityScore: this.parseQualityScore(response),
      securityScore: this.parseSecurityScore(response),
      performanceImpact: this.parsePerformanceImpact(response),
      createdAt: new Date()
    };

    // Store review in database
    await this.storeReview(review);

    return review;
  }

  /**
   * Check if there's consensus among AI reviewers
   */
  private async checkConsensus(proposalId: string): Promise<boolean> {
    try {
      const reviews = await this.getProposalReviews(proposalId);
      const proposal = await this.getProposal(proposalId);

      if (!proposal || !proposal.githubPrNumber) {
        return false;
      }

      // Calculate consensus metrics
      const approvals = reviews.filter(r => r.reviewType === 'approve').length;
      const totalReviews = reviews.length;
      const approvalRate = totalReviews > 0 ? approvals / totalReviews : 0;

      const avgConfidence = reviews.reduce((sum, r) => sum + r.confidenceScore, 0) / totalReviews;
      const avgQuality = reviews.reduce((sum, r) => sum + r.codeQualityScore, 0) / totalReviews;
      const avgSecurity = reviews.reduce((sum, r) => sum + r.securityScore, 0) / totalReviews;

      // Check if consensus is reached
      const hasConsensus = approvalRate >= this.consensusThreshold &&
                          avgConfidence >= 0.7 &&
                          avgQuality >= 80 &&
                          avgSecurity >= 90;

      if (hasConsensus) {
        logger.info('Consensus reached for auto-merge', { 
          proposalId,
          approvalRate,
          avgConfidence,
          avgQuality,
          avgSecurity
        });

        // Auto-merge the PR
        await this.mergePullRequest(proposal.githubPrNumber);
        await this.updateProposalStatus(proposalId, { status: 'merged' });

        // Distribute bounties if applicable
        if (proposal.bountyAmount) {
          await this.distributeBounty(proposal);
        }
      } else {
        logger.info('Consensus not reached', { 
          proposalId,
          approvalRate,
          avgConfidence 
        });
      }

      return hasConsensus;
    } catch (error) {
      logger.error('Error checking consensus', error);
      return false;
    }
  }

  /**
   * Merge a pull request
   */
  private async mergePullRequest(prNumber: number): Promise<void> {
    try {
      await this.octokit.pulls.merge({
        owner: this.config.owner!,
        repo: this.config.repo!,
        pull_number: prNumber,
        merge_method: 'squash'
      });

      logger.info('Pull request merged', { prNumber });
    } catch (error) {
      logger.error('Error merging pull request', error);
      throw error;
    }
  }

  /**
   * Generate PR body with detailed information
   */
  private generatePRBody(proposal: ImprovementProposal): string {
    return `
## 🤖 AI-Generated Improvement

**Type**: ${proposal.type}
**Impact**: ${proposal.estimatedImpact}/10
**Agent**: ${proposal.agentId}

### Description
${proposal.description}

### Implementation Plan
${proposal.implementationPlan}

### Files Changed
${proposal.targetFiles.map(f => `- ${f}`).join('\n')}

### Review Process
This PR will be automatically reviewed by multiple AI agents:
- Security Agent: Checks for vulnerabilities and security best practices
- Quality Agent: Evaluates code quality, maintainability, and standards
- Performance Agent: Analyzes performance impact and optimizations

If consensus is reached (70% approval with high confidence), this PR will be automatically merged.

---
*Generated by FinishThisIdea AI Automation*
`;
  }

  /**
   * Helper methods
   */
  private shouldAnalyzeFile(filePath: string): boolean {
    const analyzableExtensions = ['.ts', '.js', '.py', '.java', '.go', '.rs'];
    const excludedPaths = ['node_modules', 'dist', 'build', '.git', 'vendor'];
    
    const hasValidExtension = analyzableExtensions.some(ext => filePath.endsWith(ext));
    const isExcluded = excludedPaths.some(path => filePath.includes(path));
    
    return hasValidExtension && !isExcluded;
  }

  private detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php'
    };
    
    return languageMap[extension || ''] || 'unknown';
  }

  private async getRepositoryFiles(path?: string): Promise<any[]> {
    const response = await this.octokit.repos.getContent({
      owner: this.config.owner!,
      repo: this.config.repo!,
      path: path || ''
    });

    let files: any[] = [];
    
    if (Array.isArray(response.data)) {
      for (const item of response.data) {
        if (item.type === 'file') {
          files.push(item);
        } else if (item.type === 'dir') {
          const subFiles = await this.getRepositoryFiles(item.path);
          files = files.concat(subFiles);
        }
      }
    }

    return files;
  }

  private async getFileContent(path: string): Promise<string> {
    const response = await this.octokit.repos.getContent({
      owner: this.config.owner!,
      repo: this.config.repo!,
      path
    });

    if ('content' in response.data) {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }

    throw new Error('Unable to get file content');
  }

  private async createBranch(branchName: string): Promise<void> {
    // Get default branch SHA
    const { data: ref } = await this.octokit.git.getRef({
      owner: this.config.owner!,
      repo: this.config.repo!,
      ref: 'heads/main'
    });

    // Create new branch
    await this.octokit.git.createRef({
      owner: this.config.owner!,
      repo: this.config.repo!,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha
    });
  }

  private async updateFile(
    path: string, 
    content: string, 
    branch: string, 
    message: string
  ): Promise<void> {
    // Get current file SHA
    const { data: currentFile } = await this.octokit.repos.getContent({
      owner: this.config.owner!,
      repo: this.config.repo!,
      path,
      ref: branch
    });

    // Update file
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.config.owner!,
      repo: this.config.repo!,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha: 'sha' in currentFile ? currentFile.sha : '',
      branch
    });
  }

  private async postReviewComment(prNumber: number, review: AIReview): Promise<void> {
    const body = `
### 🤖 ${review.reviewerAgentId} Review

**Decision**: ${review.reviewType}
**Confidence**: ${(review.confidenceScore * 100).toFixed(1)}%

**Scores**:
- Code Quality: ${review.codeQualityScore}/100
- Security: ${review.securityScore}/100
- Performance Impact: ${review.performanceImpact > 0 ? '+' : ''}${review.performanceImpact}%

**Review**:
${review.reviewComment}
`;

    await this.octokit.issues.createComment({
      owner: this.config.owner!,
      repo: this.config.repo!,
      issue_number: prNumber,
      body
    });
  }

  private async getPRDiff(prNumber: number): Promise<string> {
    const response = await this.octokit.pulls.get({
      owner: this.config.owner!,
      repo: this.config.repo!,
      pull_number: prNumber,
      mediaType: {
        format: 'diff'
      }
    });

    return response.data as unknown as string;
  }

  // Database operations (simplified for now)
  private async storeProposal(proposal: ImprovementProposal): Promise<void> {
    // In production, this would store in PostgreSQL via Prisma
    logger.info('Storing proposal', { proposalId: proposal.id });
  }

  private async storeReview(review: AIReview): Promise<void> {
    // In production, this would store in PostgreSQL via Prisma
    logger.info('Storing review', { reviewId: review.id });
  }

  private async getProposal(proposalId: string): Promise<ImprovementProposal | null> {
    // In production, this would fetch from PostgreSQL via Prisma
    return null;
  }

  private async getProposalReviews(proposalId: string): Promise<AIReview[]> {
    // In production, this would fetch from PostgreSQL via Prisma
    return [];
  }

  private async updateProposalStatus(
    proposalId: string, 
    updates: Partial<ImprovementProposal>
  ): Promise<void> {
    // In production, this would update in PostgreSQL via Prisma
    logger.info('Updating proposal status', { proposalId, updates });
  }

  private async generateProposal(
    filePath: string, 
    analysis: any
  ): Promise<ImprovementProposal | null> {
    // Generate improvement proposal based on AI analysis
    return {
      id: `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: 'ai-analyzer',
      type: this.determineProposalType(analysis),
      targetFiles: [filePath],
      description: analysis.summary || 'Code improvement',
      implementationPlan: analysis.suggestions?.join('\n') || '',
      estimatedImpact: analysis.impact || 5,
      bountyAmount: this.calculateBounty(analysis),
      status: 'proposed',
      createdAt: new Date()
    };
  }

  private determineProposalType(analysis: any): ImprovementProposal['type'] {
    if (analysis.securityIssues) return 'security_fix';
    if (analysis.performanceIssues) return 'optimization';
    if (analysis.bugs) return 'bug_fix';
    return 'refactor';
  }

  private calculateBounty(analysis: any): number {
    const baseAmount = 10; // $10 base
    const impactMultiplier = (analysis.impact || 5) / 10;
    const complexityMultiplier = (analysis.complexity || 5) / 10;
    
    return Math.round(baseAmount * (1 + impactMultiplier + complexityMultiplier));
  }

  private async applyImprovements(
    originalContent: string, 
    proposal: ImprovementProposal,
    filePath: string
  ): Promise<string> {
    // Use AI to apply the improvements
    const prompt = `
Apply the following improvements to this code:

Original code:
${originalContent}

Improvements to apply:
${proposal.implementationPlan}

Return only the improved code without any explanation.
`;

    const response = await this.aiService.query({
      prompt,
      model: 'claude-3-opus',
      temperature: 0.1
    });

    return response;
  }

  private async distributeBounty(proposal: ImprovementProposal): Promise<void> {
    logger.info('Distributing bounty', { 
      proposalId: proposal.id,
      amount: proposal.bountyAmount 
    });
    // In production, this would handle actual payments/credits
  }

  // Parse AI response methods
  private parseReviewType(response: string): AIReview['reviewType'] {
    if (response.toLowerCase().includes('approve')) return 'approve';
    if (response.toLowerCase().includes('request changes')) return 'request_changes';
    return 'comment';
  }

  private parseConfidenceScore(response: string): number {
    const match = response.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) / 100 : 0.5;
  }

  private parseReviewComment(response: string): string {
    // Extract the review comment section
    const lines = response.split('\n');
    const commentStart = lines.findIndex(line => 
      line.toLowerCase().includes('review') || 
      line.toLowerCase().includes('comment')
    );
    
    if (commentStart >= 0) {
      return lines.slice(commentStart + 1).join('\n').trim();
    }
    
    return response;
  }

  private parseQualityScore(response: string): number {
    const match = response.match(/quality[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) : 50;
  }

  private parseSecurityScore(response: string): number {
    const match = response.match(/security[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) : 50;
  }

  private parsePerformanceImpact(response: string): number {
    const match = response.match(/performance[:\s]+([+-]?\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }
}