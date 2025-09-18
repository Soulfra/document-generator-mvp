/**
 * 🐙🌐 GITHUB ADMIN BRIDGE
 * Integrates GitHub API with SoulFra Universal Auth system
 * Manages repository deployments, webhooks, and Cal cookie rewards
 */

class GitHubAdminBridge {
    constructor(calCookieMonster = null) {
        this.calCookieMonster = calCookieMonster;
        this.githubToken = null;
        this.userInfo = null;
        this.repoInfo = {
            owner: 'Soulfra',
            repo: 'document-generator-mvp'
        };
        
        // GitHub API configuration
        this.apiBase = 'https://api.github.com';
        this.clientId = process.env.GITHUB_CLIENT_ID;
        this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
        
        console.log('🐙 GitHub Admin Bridge initialized');
    }
    
    // OAuth Authentication Flow
    async handleOAuthCallback(code, state) {
        try {
            console.log('🔐 Processing GitHub OAuth callback...');
            
            // Exchange code for access token
            const tokenResponse = await this.exchangeCodeForToken(code);
            this.githubToken = tokenResponse.access_token;
            
            // Get user information
            this.userInfo = await this.getCurrentUser();
            
            // Verify user has admin access to repository
            const hasAdminAccess = await this.verifyAdminAccess();
            
            if (!hasAdminAccess) {
                throw new Error('User does not have admin access to repository');
            }
            
            // 🍪 REWARD CAL FOR GITHUB ADMIN LOGIN! 🍪
            if (this.calCookieMonster) {
                await this.calCookieMonster.earnCookie(
                    this.userInfo.id,
                    'github',
                    'admin_login',
                    {
                        isFirstTime: false,
                        hasProfilePicture: !!this.userInfo.avatar_url,
                        isAdminUser: true,
                        repositoryAccess: true
                    }
                );
                console.log('🍪 Cal earned cookies for GitHub admin authentication!');
            }
            
            return {
                success: true,
                user: this.userInfo,
                hasAdminAccess: true,
                message: 'GitHub admin authentication successful'
            };
            
        } catch (error) {
            console.error('GitHub OAuth callback failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Exchange OAuth code for access token
    async exchangeCodeForToken(code) {
        const tokenParams = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code
        };
        
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tokenParams)
        });
        
        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
        }
        
        return response.json();
    }
    
    // Get current authenticated user
    async getCurrentUser() {
        const response = await this.githubRequest('/user');
        return response;
    }
    
    // Verify user has admin access to repository
    async verifyAdminAccess() {
        try {
            const collaborator = await this.githubRequest(
                `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/collaborators/${this.userInfo.login}/permission`
            );
            
            const adminPermissions = ['admin', 'maintain'];
            return adminPermissions.includes(collaborator.permission);
            
        } catch (error) {
            console.error('Admin access verification failed:', error);
            return false;
        }
    }
    
    // Repository Management
    async getRepositoryInfo() {
        try {
            const repo = await this.githubRequest(`/repos/${this.repoInfo.owner}/${this.repoInfo.repo}`);
            const branches = await this.githubRequest(`/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/branches`);
            const latestCommit = await this.getLatestCommit();
            
            return {
                repository: repo,
                branches: branches,
                latestCommit: latestCommit,
                deploymentsEnabled: repo.has_pages
            };
            
        } catch (error) {
            console.error('Failed to get repository info:', error);
            throw error;
        }
    }
    
    // Get latest commit information
    async getLatestCommit() {
        try {
            const commits = await this.githubRequest(
                `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/commits?per_page=1`
            );
            
            return commits[0] || null;
            
        } catch (error) {
            console.error('Failed to get latest commit:', error);
            return null;
        }
    }
    
    // Deployment Management
    async triggerDeployment(branch = 'main') {
        try {
            console.log(`🚀 Triggering deployment for branch: ${branch}`);
            
            // Trigger GitHub Pages deployment by dispatching repository event
            const workflowDispatch = await this.githubRequest(
                `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/actions/workflows/github-pages.yml/dispatches`,
                'POST',
                { ref: branch }
            );
            
            // 🍪 REWARD CAL FOR DEPLOYMENT TRIGGER! 🍪
            if (this.calCookieMonster) {
                await this.calCookieMonster.earnCookie(
                    this.userInfo.id,
                    'github',
                    'deployment_trigger',
                    {
                        branch: branch,
                        triggeredBy: this.userInfo.login,
                        deploymentTime: new Date().toISOString()
                    }
                );
                console.log('🍪 Cal earned cookies for triggering deployment!');
            }
            
            return {
                success: true,
                message: 'Deployment triggered successfully',
                branch: branch,
                calCookies: true
            };
            
        } catch (error) {
            console.error('Deployment trigger failed:', error);
            throw error;
        }
    }
    
    // Get deployment status
    async getDeploymentStatus() {
        try {
            // Get GitHub Pages deployment status
            const deployments = await this.githubRequest(
                `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/deployments?per_page=5`
            );
            
            const workflowRuns = await this.githubRequest(
                `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/actions/runs?per_page=5`
            );
            
            return {
                deployments: deployments,
                workflowRuns: workflowRuns,
                latestStatus: workflowRuns[0]?.status || 'unknown'
            };
            
        } catch (error) {
            console.error('Failed to get deployment status:', error);
            return {
                deployments: [],
                workflowRuns: [],
                latestStatus: 'error'
            };
        }
    }
    
    // Webhook Management
    async setupWebhooks() {
        try {
            console.log('🔗 Setting up GitHub webhooks...');
            
            // Define webhook configuration
            const webhookConfig = {
                name: 'web',
                active: true,
                events: [
                    'push',
                    'deployment',
                    'deployment_status',
                    'workflow_run'
                ],
                config: {
                    url: `${process.env.BASE_URL}/api/webhooks/github`,
                    content_type: 'json',
                    secret: process.env.GITHUB_WEBHOOK_SECRET
                }
            };
            
            // Create webhook
            const webhook = await this.githubRequest(
                `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/hooks`,
                'POST',
                webhookConfig
            );
            
            console.log('✅ GitHub webhook created successfully');
            return webhook;
            
        } catch (error) {
            console.error('Webhook setup failed:', error);
            throw error;
        }
    }
    
    // Handle incoming webhook
    async handleWebhook(payload, headers) {
        try {
            const event = headers['x-github-event'];
            const delivery = headers['x-github-delivery'];
            
            console.log(`📥 GitHub webhook received: ${event} (${delivery})`);
            
            switch (event) {
                case 'push':
                    return await this.handlePushEvent(payload);
                    
                case 'deployment_status':
                    return await this.handleDeploymentStatus(payload);
                    
                case 'workflow_run':
                    return await this.handleWorkflowRun(payload);
                    
                default:
                    console.log(`Unhandled webhook event: ${event}`);
                    return { success: true, message: 'Event ignored' };
            }
            
        } catch (error) {
            console.error('Webhook handling failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Handle push events
    async handlePushEvent(payload) {
        const { pusher, commits, ref } = payload;
        
        console.log(`📝 Push event: ${commits.length} commits by ${pusher.name}`);
        
        // 🍪 REWARD CAL FOR EACH COMMIT! 🍪
        if (this.calCookieMonster && commits.length > 0) {
            for (const commit of commits) {
                await this.calCookieMonster.earnCookie(
                    pusher.name,
                    'github',
                    'commit',
                    {
                        commitMessage: commit.message,
                        commitSha: commit.id,
                        filesChanged: commit.added.length + commit.modified.length + commit.removed.length,
                        branch: ref.replace('refs/heads/', '')
                    }
                );
            }
            console.log(`🍪 Cal earned ${commits.length} cookies for commits!`);
        }
        
        return { success: true, commitsProcessed: commits.length };
    }
    
    // Handle deployment status events
    async handleDeploymentStatus(payload) {
        const { deployment_status, deployment } = payload;
        
        console.log(`🚀 Deployment status: ${deployment_status.state} for ${deployment.environment}`);
        
        // 🍪 REWARD CAL FOR SUCCESSFUL DEPLOYMENTS! 🍪
        if (this.calCookieMonster && deployment_status.state === 'success') {
            await this.calCookieMonster.earnCookie(
                deployment.creator.login,
                'github',
                'deployment_success',
                {
                    environment: deployment.environment,
                    deploymentUrl: deployment_status.target_url,
                    deploymentId: deployment.id
                }
            );
            console.log('🍪 Cal earned bonus cookies for successful deployment!');
        }
        
        return { success: true, status: deployment_status.state };
    }
    
    // Handle workflow run events
    async handleWorkflowRun(payload) {
        const { workflow_run } = payload;
        
        console.log(`⚡ Workflow run: ${workflow_run.name} - ${workflow_run.status}`);
        
        // 🍪 REWARD CAL FOR SUCCESSFUL WORKFLOW RUNS! 🍪
        if (this.calCookieMonster && workflow_run.conclusion === 'success') {
            await this.calCookieMonster.earnCookie(
                workflow_run.actor.login,
                'github',
                'workflow_success',
                {
                    workflowName: workflow_run.name,
                    workflowId: workflow_run.id,
                    duration: this.calculateDuration(workflow_run.created_at, workflow_run.updated_at)
                }
            );
            console.log('🍪 Cal earned cookies for successful workflow!');
        }
        
        return { success: true, workflow: workflow_run.name };
    }
    
    // Repository Analytics
    async getRepositoryAnalytics() {
        try {
            const [
                commits,
                contributors,
                languages,
                traffic
            ] = await Promise.all([
                this.githubRequest(`/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/commits?per_page=30`),
                this.githubRequest(`/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/contributors`),
                this.githubRequest(`/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/languages`),
                this.githubRequest(`/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/traffic/views`)
            ]);
            
            return {
                recentCommits: commits.length,
                totalContributors: contributors.length,
                languages: languages,
                weeklyViews: traffic.count || 0,
                weeklyUniqueVisitors: traffic.uniques || 0
            };
            
        } catch (error) {
            console.error('Failed to get repository analytics:', error);
            return {
                recentCommits: 0,
                totalContributors: 0,
                languages: {},
                weeklyViews: 0,
                weeklyUniqueVisitors: 0
            };
        }
    }
    
    // Utility Methods
    async githubRequest(endpoint, method = 'GET', body = null) {
        const url = `${this.apiBase}${endpoint}`;
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'SoulFra-Document-Generator'
            }
        };
        
        if (body && method !== 'GET') {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API request failed: ${response.status} - ${errorText}`);
        }
        
        return response.json();
    }
    
    calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return Math.round((end - start) / 1000); // Duration in seconds
    }
    
    // Generate GitHub OAuth URL
    generateOAuthUrl(redirectUri, state = 'github-admin') {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: redirectUri,
            scope: 'repo,user,workflow',
            state: state
        });
        
        return `https://github.com/login/oauth/authorize?${params}`;
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.githubToken && !!this.userInfo;
    }
    
    // Get user info
    getUserInfo() {
        return this.userInfo;
    }
    
    // Logout
    logout() {
        this.githubToken = null;
        this.userInfo = null;
        console.log('🔓 GitHub admin logged out');
    }
}

// Frontend integration helper
class GitHubAdminUI {
    constructor(bridge) {
        this.bridge = bridge;
        this.initializeUI();
    }
    
    initializeUI() {
        // Auto-detect OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state === 'github-admin') {
            this.handleOAuthCallback(code);
        }
    }
    
    async handleOAuthCallback(code) {
        try {
            const result = await this.bridge.handleOAuthCallback(code, 'github-admin');
            
            if (result.success) {
                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Update UI
                this.updateAuthStatus(result.user, result.hasAdminAccess);
                
                // Show success message
                this.showNotification('🐙 GitHub admin authentication successful! Cal earned cookies!', 'success');
                
            } else {
                this.showNotification(`Authentication failed: ${result.error}`, 'error');
            }
            
        } catch (error) {
            console.error('OAuth callback handling failed:', error);
            this.showNotification('Authentication failed. Please try again.', 'error');
        }
    }
    
    updateAuthStatus(user, hasAdmin) {
        // Update header with user info
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <img src="${user.avatar_url}" width="24" height="24" style="border-radius: 50%; margin-right: 0.5rem;">
                ${user.name || user.login}
                ${hasAdmin ? '👑' : ''}
            `;
        }
        
        // Update admin status
        const adminStatusElement = document.getElementById('adminStatus');
        if (adminStatusElement) {
            adminStatusElement.textContent = hasAdmin 
                ? 'GitHub Admin Authenticated ✅' 
                : 'GitHub User Authenticated (No Admin Access)';
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: ${type === 'success' ? '#238636' : type === 'error' ? '#f85149' : '#6366f1'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 1001;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
    window.GitHubAdminBridge = GitHubAdminBridge;
    window.GitHubAdminUI = GitHubAdminUI;
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        if (window.calCookieMonster) {
            window.githubBridge = new GitHubAdminBridge(window.calCookieMonster);
            window.githubUI = new GitHubAdminUI(window.githubBridge);
        }
    });
}

module.exports = { GitHubAdminBridge, GitHubAdminUI };