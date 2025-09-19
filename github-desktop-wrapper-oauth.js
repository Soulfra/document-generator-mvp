#!/usr/bin/env node

/**
 * GITHUB DESKTOP WRAPPER WITH OAUTH INTEGRATION
 * 
 * Enhanced GitHub Desktop wrapper that uses OAuth tokens from the unified auth server
 * No more terminal authentication - just click "Login with GitHub" and go!
 */

const AuthenticatedGitHubWrapper = require('./github-desktop-wrapper-authenticated.js');
const {
    GitHubOAuthIntegration,
    GitHubOAuthTerminal,
    oauthSessionMiddleware,
    createOAuthEndpoints
} = require('./github-oauth-integration.js');

class OAuthGitHubWrapper extends AuthenticatedGitHubWrapper {
    constructor(options = {}) {
        super(options);
        
        // Initialize OAuth integration
        this.oauthIntegration = new GitHubOAuthIntegration({
            authServerUrl: options.authServerUrl || 'http://localhost:3340',
            vaultPath: this.privateVault
        });
        
        // Replace terminal auth with OAuth auth
        this.authTerminal = new GitHubOAuthTerminal(this.privateVault, this.oauthIntegration);
        
        console.log('🔐 OAuth-enabled GitHub Desktop Wrapper initialized');
        console.log(`   Auth Server: ${this.oauthIntegration.authServerUrl}`);
    }
    
    async setupWebServer() {
        // Add OAuth middleware before other routes
        this.app.use(oauthSessionMiddleware(this.oauthIntegration));
        
        // Set up base routes
        await super.setupWebServer();
        
        // Add OAuth-specific endpoints
        createOAuthEndpoints(this.app, this.oauthIntegration);
        
        // Override auth status endpoint to use OAuth
        this.app.get('/api/auth/status', async (req, res) => {
            const oauthStatus = await this.oauthIntegration.checkOAuthStatus(req.sessionId);
            
            res.json({
                authenticated: oauthStatus.authenticated && oauthStatus.githubConnected,
                method: oauthStatus.authenticated ? 'oauth' : null,
                githubConnected: oauthStatus.githubConnected || false,
                user: oauthStatus.user || null,
                authServerUrl: this.oauthIntegration.authServerUrl,
                loginUrl: `${this.oauthIntegration.authServerUrl}/auth/github`
            });
        });
        
        // Override test endpoint to use OAuth
        this.app.post('/api/auth/test', async (req, res) => {
            try {
                const result = await this.authTerminal.testGitHubConnection(req.sessionId);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    // Override push/pull to use OAuth tokens
    async pushToGitHub(req, res) {
        try {
            // Check OAuth authentication
            const oauthStatus = await this.oauthIntegration.checkOAuthStatus(req.sessionId);
            
            if (!oauthStatus.authenticated) {
                return res.status(401).json({
                    error: 'Not authenticated',
                    authRequired: true,
                    loginUrl: `${this.oauthIntegration.authServerUrl}`,
                    message: 'Please login via the unified auth server'
                });
            }
            
            if (!oauthStatus.githubConnected) {
                return res.status(401).json({
                    error: 'GitHub not connected',
                    authRequired: true,
                    connectUrl: `${this.oauthIntegration.authServerUrl}/dashboard`,
                    message: 'Please connect your GitHub account'
                });
            }
            
            // Configure Git to use OAuth token
            await this.oauthIntegration.configureGitWithOAuth(
                oauthStatus.user.githubUsername,
                oauthStatus.token
            );
            
            // Proceed with push using parent implementation
            return super.pushToGitHub(req, res);
            
        } catch (error) {
            console.error('Push failed:', error);
            return res.status(500).json({
                error: 'Push operation failed',
                details: error.message
            });
        }
    }
    
    async pullFromGitHub(req, res) {
        try {
            // Check OAuth authentication
            const oauthStatus = await this.oauthIntegration.checkOAuthStatus(req.sessionId);
            
            if (!oauthStatus.authenticated || !oauthStatus.githubConnected) {
                return res.status(401).json({
                    error: 'GitHub authentication required',
                    authRequired: true,
                    loginUrl: `${this.oauthIntegration.authServerUrl}`,
                    message: 'Please login and connect GitHub'
                });
            }
            
            // Configure Git to use OAuth token
            await this.oauthIntegration.configureGitWithOAuth(
                oauthStatus.user.githubUsername,
                oauthStatus.token
            );
            
            // Proceed with pull
            return super.pullFromGitHub(req, res);
            
        } catch (error) {
            console.error('Pull failed:', error);
            return res.status(500).json({
                error: 'Pull operation failed',
                details: error.message
            });
        }
    }
    
    // Enhanced GitHub Desktop interface with OAuth UI
    async serveGitHubDesktop(req, res) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Desktop - OAuth Edition</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: #161b22;
            padding: 1rem;
            border-bottom: 1px solid #30363d;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .title {
            font-size: 1.2rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .auth-status {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .auth-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            font-size: 0.9rem;
        }
        
        .auth-indicator.connected {
            background: rgba(46, 160, 67, 0.2);
            color: #3fb950;
        }
        
        .auth-indicator.disconnected {
            background: rgba(248, 81, 73, 0.2);
            color: #f85149;
        }
        
        .main-content {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .sidebar {
            width: 280px;
            background: #0d1117;
            border-right: 1px solid #30363d;
            padding: 1rem;
            overflow-y: auto;
        }
        
        .content {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
        }
        
        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn-primary {
            background: #238636;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2ea043;
        }
        
        .btn-secondary {
            background: #21262d;
            color: #c9d1d9;
            border: 1px solid #30363d;
        }
        
        .btn-secondary:hover {
            background: #30363d;
        }
        
        .login-prompt {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 2rem;
            text-align: center;
            margin-top: 2rem;
        }
        
        .login-prompt h2 {
            margin-bottom: 1rem;
            color: #f85149;
        }
        
        .login-prompt p {
            margin-bottom: 1.5rem;
            opacity: 0.8;
        }
        
        .repo-section {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .repo-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .status-badge.clean {
            background: rgba(46, 160, 67, 0.2);
            color: #3fb950;
        }
        
        .status-badge.changes {
            background: rgba(187, 128, 9, 0.2);
            color: #d29922;
        }
        
        .oauth-benefits {
            background: rgba(56, 139, 253, 0.1);
            border: 1px solid rgba(56, 139, 253, 0.3);
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        .oauth-benefits h3 {
            color: #58a6ff;
            margin-bottom: 0.5rem;
        }
        
        .oauth-benefits ul {
            list-style: none;
            padding-left: 1rem;
        }
        
        .oauth-benefits li:before {
            content: "✓ ";
            color: #3fb950;
            font-weight: bold;
        }
        
        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #c9d1d9;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">
            <span style="font-size: 1.5rem;">🐙</span>
            GitHub Desktop (OAuth Edition)
        </div>
        <div class="auth-status">
            <div id="authIndicator" class="auth-indicator disconnected">
                <span class="loading"></span>
                Checking authentication...
            </div>
            <button id="authAction" class="btn btn-primary" style="display: none;">
                Login with GitHub
            </button>
        </div>
    </div>
    
    <div class="main-content">
        <div class="sidebar">
            <h3 style="margin-bottom: 1rem;">Repositories</h3>
            <div id="repoList">
                <p style="opacity: 0.6;">Loading repositories...</p>
            </div>
        </div>
        
        <div class="content">
            <div id="authRequired" class="login-prompt" style="display: none;">
                <h2>🔐 Authentication Required</h2>
                <p>To use GitHub Desktop, you need to authenticate with your GitHub account through our secure OAuth flow.</p>
                
                <div class="oauth-benefits">
                    <h3>Benefits of OAuth Authentication:</h3>
                    <ul>
                        <li>One-click login - no more terminal commands</li>
                        <li>Secure token management</li>
                        <li>Automatic token refresh</li>
                        <li>Works across all your devices</li>
                        <li>Integrated with all our tools</li>
                    </ul>
                </div>
                
                <a id="loginButton" href="#" class="btn btn-primary" style="font-size: 1.1rem; padding: 1rem 2rem;">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    Login with GitHub
                </a>
            </div>
            
            <div id="repoContent" style="display: none;">
                <!-- Repository content will be loaded here -->
            </div>
        </div>
    </div>
    
    <script>
        let authStatus = null;
        let currentRepo = null;
        
        // Check authentication status on load
        async function checkAuthStatus() {
            try {
                const response = await fetch('/api/auth/status');
                authStatus = await response.json();
                updateAuthUI();
                
                if (authStatus.authenticated) {
                    loadRepositories();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                updateAuthUI(false);
            }
        }
        
        function updateAuthUI(authenticated = authStatus?.authenticated) {
            const indicator = document.getElementById('authIndicator');
            const authAction = document.getElementById('authAction');
            const authRequired = document.getElementById('authRequired');
            const repoContent = document.getElementById('repoContent');
            const loginButton = document.getElementById('loginButton');
            
            if (authenticated) {
                indicator.className = 'auth-indicator connected';
                indicator.innerHTML = \`
                    ✅ Connected as \${authStatus.user?.githubUsername || authStatus.user?.displayName}
                \`;
                authAction.style.display = 'none';
                authRequired.style.display = 'none';
                repoContent.style.display = 'block';
            } else {
                indicator.className = 'auth-indicator disconnected';
                indicator.innerHTML = '❌ Not authenticated';
                authAction.style.display = 'block';
                authAction.textContent = 'Login with GitHub';
                authAction.onclick = () => window.location.href = authStatus?.loginUrl || 'http://localhost:3340';
                authRequired.style.display = 'block';
                repoContent.style.display = 'none';
                
                // Set login button URL
                if (loginButton && authStatus?.loginUrl) {
                    loginButton.href = authStatus.loginUrl;
                }
            }
        }
        
        async function loadRepositories() {
            try {
                const response = await fetch('/api/repositories');
                const repos = await response.json();
                
                const repoList = document.getElementById('repoList');
                if (repos.length === 0) {
                    repoList.innerHTML = '<p style="opacity: 0.6;">No repositories found</p>';
                    return;
                }
                
                repoList.innerHTML = repos.map(repo => \`
                    <div class="repo-item" style="padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 6px; cursor: pointer; transition: background 0.2s;"
                         onmouseover="this.style.background='#161b22'" 
                         onmouseout="this.style.background='transparent'"
                         onclick="selectRepo('\${repo.name}')">
                        <div style="font-weight: 600;">\${repo.name}</div>
                        <div style="font-size: 0.85rem; opacity: 0.6; margin-top: 0.25rem;">
                            \${repo.path}
                        </div>
                    </div>
                \`).join('');
                
                // Select first repo by default
                if (repos.length > 0) {
                    selectRepo(repos[0].name);
                }
                
            } catch (error) {
                console.error('Failed to load repositories:', error);
            }
        }
        
        async function selectRepo(repoName) {
            currentRepo = repoName;
            
            try {
                const response = await fetch(\`/api/repositories/\${repoName}/status\`);
                const status = await response.json();
                
                document.getElementById('repoContent').innerHTML = \`
                    <div class="repo-section">
                        <div class="repo-header">
                            <h2>\${repoName}</h2>
                            <span class="status-badge \${status.hasChanges ? 'changes' : 'clean'}">
                                \${status.hasChanges ? 'Changes to commit' : 'No changes'}
                            </span>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                            <button class="btn btn-primary" onclick="pullChanges()">
                                ↓ Pull from GitHub
                            </button>
                            <button class="btn btn-secondary" onclick="pushChanges()">
                                ↑ Push to GitHub
                            </button>
                            <button class="btn btn-secondary" onclick="refreshStatus()">
                                🔄 Refresh
                            </button>
                        </div>
                        
                        <div id="gitStatus">
                            <h3 style="margin-bottom: 1rem;">Git Status</h3>
                            <pre style="background: #161b22; padding: 1rem; border-radius: 6px; overflow-x: auto;">\${status.output || 'No status available'}</pre>
                        </div>
                    </div>
                \`;
            } catch (error) {
                console.error('Failed to load repo status:', error);
            }
        }
        
        async function pullChanges() {
            if (!authStatus?.authenticated) {
                alert('Please authenticate first!');
                return;
            }
            
            try {
                const response = await fetch('/api/pull', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ repository: currentRepo })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert('Pull successful!');
                    selectRepo(currentRepo); // Refresh
                } else {
                    if (result.authRequired) {
                        window.location.href = result.loginUrl;
                    } else {
                        alert('Pull failed: ' + result.error);
                    }
                }
            } catch (error) {
                alert('Pull failed: ' + error.message);
            }
        }
        
        async function pushChanges() {
            if (!authStatus?.authenticated) {
                alert('Please authenticate first!');
                return;
            }
            
            const message = prompt('Commit message:');
            if (!message) return;
            
            try {
                const response = await fetch('/api/push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        repository: currentRepo,
                        message 
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert('Push successful!');
                    selectRepo(currentRepo); // Refresh
                } else {
                    if (result.authRequired) {
                        window.location.href = result.loginUrl;
                    } else {
                        alert('Push failed: ' + result.error);
                    }
                }
            } catch (error) {
                alert('Push failed: ' + error.message);
            }
        }
        
        function refreshStatus() {
            selectRepo(currentRepo);
        }
        
        // Check for OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('oauth') === 'success') {
            // OAuth login successful, remove query param and reload
            window.history.replaceState({}, document.title, window.location.pathname);
            checkAuthStatus();
        }
        
        // Initialize
        checkAuthStatus();
        
        // Refresh auth status periodically
        setInterval(checkAuthStatus, 60000); // Every minute
    </script>
</body>
</html>
        `;
        
        res.send(html);
    }
}

module.exports = OAuthGitHubWrapper;

// Start standalone if run directly
if (require.main === module) {
    const wrapper = new OAuthGitHubWrapper({
        port: process.env.GITHUB_WRAPPER_PORT || 3337,
        wsPort: process.env.GITHUB_WRAPPER_WS_PORT || 3338,
        authServerUrl: process.env.AUTH_SERVER_URL || 'http://localhost:3340',
        workspaceRoot: process.env.WORKSPACE_ROOT || process.cwd()
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n👋 Shutting down gracefully...');
        await wrapper.shutdown();
        process.exit(0);
    });
    
    console.log('\n🚀 OAuth-Enabled GitHub Desktop Wrapper');
    console.log('=====================================');
    console.log('   Web Interface: http://localhost:3337');
    console.log('   Auth Server: http://localhost:3340');
    console.log('\n📝 To use:');
    console.log('   1. Make sure unified-auth-server.js is running');
    console.log('   2. Visit http://localhost:3337');
    console.log('   3. Click "Login with GitHub"');
    console.log('   4. Authorize the OAuth app');
    console.log('   5. Start using Git with no terminal auth needed!');
    console.log('\n✨ OAuth makes everything simpler!');
}