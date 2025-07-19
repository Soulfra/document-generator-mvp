"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubAutomationService = void 0;
const events_1 = require("events");
const rest_1 = require("@octokit/rest");
const client_1 = require("@prisma/client");
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../../utils/logger");
const ai_service_1 = require("../ai/ai.service");
class GitHubAutomationService extends events_1.EventEmitter {
    octokit;
    prisma;
    aiService;
    queue;
    config;
    consensusThreshold = 0.7;
    constructor(config) {
        super();
        this.config = {
            token: config?.token || process.env.GITHUB_TOKEN,
            owner: config?.owner || process.env.GITHUB_OWNER,
            repo: config?.repo || process.env.GITHUB_REPO,
            baseUrl: config?.baseUrl
        };
        this.octokit = new rest_1.Octokit({
            auth: this.config.token,
            baseUrl: this.config.baseUrl
        });
        this.prisma = new client_1.PrismaClient();
        this.aiService = new ai_service_1.AIService();
        this.queue = new bull_1.default('github-automation', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379')
            }
        });
        this.setupQueueProcessors();
    }
    setupQueueProcessors() {
        this.queue.process('create-pr', async (job) => {
            const { proposal } = job.data;
            return await this.createPullRequest(proposal);
        });
        this.queue.process('ai-review', async (job) => {
            const { prNumber, proposalId } = job.data;
            return await this.performAIReview(prNumber, proposalId);
        });
        this.queue.process('check-consensus', async (job) => {
            const { proposalId } = job.data;
            return await this.checkConsensus(proposalId);
        });
    }
    async analyzeCodebase(targetPath) {
        try {
            logger_1.logger.info('Analyzing codebase for improvements', { targetPath });
            const files = await this.getRepositoryFiles(targetPath);
            const proposals = [];
            for (const file of files) {
                if (this.shouldAnalyzeFile(file.path)) {
                    const content = await this.getFileContent(file.path);
                    const analysis = await this.aiService.analyzeCode({
                        code: content,
                        language: this.detectLanguage(file.path),
                        analysisType: 'comprehensive'
                    });
                    if (analysis.suggestions && analysis.suggestions.length > 0) {
                        const proposal = await this.generateProposal(file.path, analysis);
                        if (proposal) {
                            proposals.push(proposal);
                        }
                    }
                }
            }
            for (const proposal of proposals) {
                await this.storeProposal(proposal);
            }
            logger_1.logger.info('Codebase analysis complete', {
                proposalsCount: proposals.length
            });
            return proposals;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing codebase', error);
            throw error;
        }
    }
    async createPullRequest(proposal) {
        try {
            logger_1.logger.info('Creating pull request', { proposalId: proposal.id });
            const branchName = `ai-improvement/${proposal.type}/${proposal.id}`;
            await this.createBranch(branchName);
            for (const filePath of proposal.targetFiles) {
                const originalContent = await this.getFileContent(filePath);
                const improvedContent = await this.applyImprovements(originalContent, proposal, filePath);
                await this.updateFile(filePath, improvedContent, branchName, `AI: ${proposal.type} for ${filePath}`);
            }
            const pr = await this.octokit.pulls.create({
                owner: this.config.owner,
                repo: this.config.repo,
                title: `AI ${proposal.type}: ${proposal.description}`,
                head: branchName,
                base: 'main',
                body: this.generatePRBody(proposal)
            });
            await this.updateProposalStatus(proposal.id, {
                status: 'pr_created',
                githubPrUrl: pr.data.html_url,
                githubPrNumber: pr.data.number
            });
            await this.queue.add('ai-review', {
                prNumber: pr.data.number,
                proposalId: proposal.id
            });
            logger_1.logger.info('Pull request created', {
                prNumber: pr.data.number,
                prUrl: pr.data.html_url
            });
            return pr.data.html_url;
        }
        catch (error) {
            logger_1.logger.error('Error creating pull request', error);
            throw error;
        }
    }
    async performAIReview(prNumber, proposalId) {
        try {
            logger_1.logger.info('Performing AI review', { prNumber, proposalId });
            const diff = await this.getPRDiff(prNumber);
            const reviewAgents = ['security-agent', 'quality-agent', 'performance-agent'];
            const reviews = [];
            for (const agentId of reviewAgents) {
                const review = await this.getAIReview(agentId, diff, proposalId);
                reviews.push(review);
                await this.postReviewComment(prNumber, review);
            }
            await this.queue.add('check-consensus', { proposalId });
            return reviews;
        }
        catch (error) {
            logger_1.logger.error('Error performing AI review', error);
            throw error;
        }
    }
    async getAIReview(agentId, diff, proposalId) {
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
        const review = {
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
        await this.storeReview(review);
        return review;
    }
    async checkConsensus(proposalId) {
        try {
            const reviews = await this.getProposalReviews(proposalId);
            const proposal = await this.getProposal(proposalId);
            if (!proposal || !proposal.githubPrNumber) {
                return false;
            }
            const approvals = reviews.filter(r => r.reviewType === 'approve').length;
            const totalReviews = reviews.length;
            const approvalRate = totalReviews > 0 ? approvals / totalReviews : 0;
            const avgConfidence = reviews.reduce((sum, r) => sum + r.confidenceScore, 0) / totalReviews;
            const avgQuality = reviews.reduce((sum, r) => sum + r.codeQualityScore, 0) / totalReviews;
            const avgSecurity = reviews.reduce((sum, r) => sum + r.securityScore, 0) / totalReviews;
            const hasConsensus = approvalRate >= this.consensusThreshold &&
                avgConfidence >= 0.7 &&
                avgQuality >= 80 &&
                avgSecurity >= 90;
            if (hasConsensus) {
                logger_1.logger.info('Consensus reached for auto-merge', {
                    proposalId,
                    approvalRate,
                    avgConfidence,
                    avgQuality,
                    avgSecurity
                });
                await this.mergePullRequest(proposal.githubPrNumber);
                await this.updateProposalStatus(proposalId, { status: 'merged' });
                if (proposal.bountyAmount) {
                    await this.distributeBounty(proposal);
                }
            }
            else {
                logger_1.logger.info('Consensus not reached', {
                    proposalId,
                    approvalRate,
                    avgConfidence
                });
            }
            return hasConsensus;
        }
        catch (error) {
            logger_1.logger.error('Error checking consensus', error);
            return false;
        }
    }
    async mergePullRequest(prNumber) {
        try {
            await this.octokit.pulls.merge({
                owner: this.config.owner,
                repo: this.config.repo,
                pull_number: prNumber,
                merge_method: 'squash'
            });
            logger_1.logger.info('Pull request merged', { prNumber });
        }
        catch (error) {
            logger_1.logger.error('Error merging pull request', error);
            throw error;
        }
    }
    generatePRBody(proposal) {
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
    shouldAnalyzeFile(filePath) {
        const analyzableExtensions = ['.ts', '.js', '.py', '.java', '.go', '.rs'];
        const excludedPaths = ['node_modules', 'dist', 'build', '.git', 'vendor'];
        const hasValidExtension = analyzableExtensions.some(ext => filePath.endsWith(ext));
        const isExcluded = excludedPaths.some(path => filePath.includes(path));
        return hasValidExtension && !isExcluded;
    }
    detectLanguage(filePath) {
        const extension = filePath.split('.').pop()?.toLowerCase();
        const languageMap = {
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
    async getRepositoryFiles(path) {
        const response = await this.octokit.repos.getContent({
            owner: this.config.owner,
            repo: this.config.repo,
            path: path || ''
        });
        let files = [];
        if (Array.isArray(response.data)) {
            for (const item of response.data) {
                if (item.type === 'file') {
                    files.push(item);
                }
                else if (item.type === 'dir') {
                    const subFiles = await this.getRepositoryFiles(item.path);
                    files = files.concat(subFiles);
                }
            }
        }
        return files;
    }
    async getFileContent(path) {
        const response = await this.octokit.repos.getContent({
            owner: this.config.owner,
            repo: this.config.repo,
            path
        });
        if ('content' in response.data) {
            return Buffer.from(response.data.content, 'base64').toString('utf-8');
        }
        throw new Error('Unable to get file content');
    }
    async createBranch(branchName) {
        const { data: ref } = await this.octokit.git.getRef({
            owner: this.config.owner,
            repo: this.config.repo,
            ref: 'heads/main'
        });
        await this.octokit.git.createRef({
            owner: this.config.owner,
            repo: this.config.repo,
            ref: `refs/heads/${branchName}`,
            sha: ref.object.sha
        });
    }
    async updateFile(path, content, branch, message) {
        const { data: currentFile } = await this.octokit.repos.getContent({
            owner: this.config.owner,
            repo: this.config.repo,
            path,
            ref: branch
        });
        await this.octokit.repos.createOrUpdateFileContents({
            owner: this.config.owner,
            repo: this.config.repo,
            path,
            message,
            content: Buffer.from(content).toString('base64'),
            sha: 'sha' in currentFile ? currentFile.sha : '',
            branch
        });
    }
    async postReviewComment(prNumber, review) {
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
            owner: this.config.owner,
            repo: this.config.repo,
            issue_number: prNumber,
            body
        });
    }
    async getPRDiff(prNumber) {
        const response = await this.octokit.pulls.get({
            owner: this.config.owner,
            repo: this.config.repo,
            pull_number: prNumber,
            mediaType: {
                format: 'diff'
            }
        });
        return response.data;
    }
    async storeProposal(proposal) {
        logger_1.logger.info('Storing proposal', { proposalId: proposal.id });
    }
    async storeReview(review) {
        logger_1.logger.info('Storing review', { reviewId: review.id });
    }
    async getProposal(proposalId) {
        return null;
    }
    async getProposalReviews(proposalId) {
        return [];
    }
    async updateProposalStatus(proposalId, updates) {
        logger_1.logger.info('Updating proposal status', { proposalId, updates });
    }
    async generateProposal(filePath, analysis) {
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
    determineProposalType(analysis) {
        if (analysis.securityIssues)
            return 'security_fix';
        if (analysis.performanceIssues)
            return 'optimization';
        if (analysis.bugs)
            return 'bug_fix';
        return 'refactor';
    }
    calculateBounty(analysis) {
        const baseAmount = 10;
        const impactMultiplier = (analysis.impact || 5) / 10;
        const complexityMultiplier = (analysis.complexity || 5) / 10;
        return Math.round(baseAmount * (1 + impactMultiplier + complexityMultiplier));
    }
    async applyImprovements(originalContent, proposal, filePath) {
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
    async distributeBounty(proposal) {
        logger_1.logger.info('Distributing bounty', {
            proposalId: proposal.id,
            amount: proposal.bountyAmount
        });
    }
    parseReviewType(response) {
        if (response.toLowerCase().includes('approve'))
            return 'approve';
        if (response.toLowerCase().includes('request changes'))
            return 'request_changes';
        return 'comment';
    }
    parseConfidenceScore(response) {
        const match = response.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i);
        return match ? parseFloat(match[1]) / 100 : 0.5;
    }
    parseReviewComment(response) {
        const lines = response.split('\n');
        const commentStart = lines.findIndex(line => line.toLowerCase().includes('review') ||
            line.toLowerCase().includes('comment'));
        if (commentStart >= 0) {
            return lines.slice(commentStart + 1).join('\n').trim();
        }
        return response;
    }
    parseQualityScore(response) {
        const match = response.match(/quality[:\s]+(\d+)/i);
        return match ? parseInt(match[1]) : 50;
    }
    parseSecurityScore(response) {
        const match = response.match(/security[:\s]+(\d+)/i);
        return match ? parseInt(match[1]) : 50;
    }
    parsePerformanceImpact(response) {
        const match = response.match(/performance[:\s]+([+-]?\d+)/i);
        return match ? parseInt(match[1]) : 0;
    }
}
exports.GitHubAutomationService = GitHubAutomationService;
//# sourceMappingURL=github-automation.service.js.map