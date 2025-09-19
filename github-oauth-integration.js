#!/usr/bin/env node

/**
 * GITHUB OAUTH INTEGRATION MODULE
 * 
 * Bridges the unified auth server OAuth tokens with the GitHub desktop wrapper
 * Replaces terminal-based authentication with seamless OAuth flow
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class GitHubOAuthIntegration {
    constructor(options = {}) {
        this.authServerUrl = options.authServerUrl || 'http://localhost:3340';
        this.vaultPath = options.vaultPath || path.join(process.cwd(), '.vault');
        this.configPath = path.join(this.vaultPath, 'oauth-integration.json');
        
        // Session management
        this.sessions = new Map();
        this.sessionTimeout = options.sessionTimeout || 24 * 60 * 60 * 1000; // 24 hours
        
        console.log('🔗 GitHub OAuth Integration initialized');
    }
    
    /**
     * Check if user is authenticated via unified auth server
     * @param {string} sessionId - Optional session ID from cookie/header
     * @returns {Object} Authentication status and user info
     */
    async checkOAuthStatus(sessionId) {
        try {
            // First check local session cache
            if (sessionId && this.sessions.has(sessionId)) {
                const session = this.sessions.get(sessionId);
                if (session.expiresAt > Date.now()) {
                    return {
                        authenticated: true,
                        method: 'oauth',
                        user: session.user,
                        token: session.token
                    };
                } else {
                    // Session expired
                    this.sessions.delete(sessionId);
                }
            }
            
            // If no valid session, check with auth server
            const response = await fetch(`${this.authServerUrl}/api/user`, {
                headers: sessionId ? { 'Cookie': `connect.sid=${sessionId}` } : {}
            });
            
            if (!response.ok) {
                return { authenticated: false };
            }
            
            const user = await response.json();
            
            // Check if GitHub is connected
            if (!user.connectedAccounts?.github) {
                return {
                    authenticated: true,
                    githubConnected: false,
                    user: {
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName
                    }
                };
            }
            
            // Get GitHub token from auth server
            const tokenResponse = await fetch(`${this.authServerUrl}/api/github/token`, {
                headers: sessionId ? { 'Cookie': `connect.sid=${sessionId}` } : {}
            });
            
            if (!tokenResponse.ok) {
                return {
                    authenticated: true,
                    githubConnected: false,
                    error: 'Failed to retrieve GitHub token'
                };
            }
            
            const { token, username } = await tokenResponse.json();
            
            // Cache the session
            const newSessionId = sessionId || crypto.randomUUID();
            this.sessions.set(newSessionId, {
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    githubUsername: username
                },
                token,
                expiresAt: Date.now() + this.sessionTimeout
            });
            
            return {
                authenticated: true,
                method: 'oauth',
                githubConnected: true,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    githubUsername: username
                },
                token,
                sessionId: newSessionId
            };
            
        } catch (error) {
            console.error('OAuth status check failed:', error);
            return {
                authenticated: false,
                error: error.message
            };
        }
    }
    
    /**
     * Configure Git to use OAuth token for operations
     * @param {string} username - GitHub username
     * @param {string} token - OAuth access token
     */
    async configureGitWithOAuth(username, token) {
        // Create a credential helper that uses the OAuth token
        const credentialHelper = `#!/bin/sh
# OAuth credential helper for GitHub
case "$1" in
    get)
        echo "protocol=https"
        echo "host=github.com"
        echo "username=${username}"
        echo "password=${token}"
        ;;
esac
`;
        
        const helperPath = path.join(this.vaultPath, 'git-oauth-helper.sh');
        await fs.mkdir(this.vaultPath, { recursive: true });
        await fs.writeFile(helperPath, credentialHelper, { mode: 0o700 });
        
        // Configure git to use our OAuth credential helper
        const { exec } = require('child_process').promises;
        await exec(`git config --global credential.https://github.com.helper "${helperPath}"`);
        
        console.log(`✅ Git configured to use OAuth for user: ${username}`);
    }
    
    /**
     * Test GitHub connection using OAuth token
     * @param {string} token - OAuth access token
     */
    async testOAuthConnection(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API responded with ${response.status}`);
            }
            
            const user = await response.json();
            
            return {
                success: true,
                method: 'oauth',
                user: user.login,
                name: user.name,
                email: user.email
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get or refresh OAuth token from unified auth server
     * @param {string} sessionId - Session ID
     */
    async getOAuthToken(sessionId) {
        const status = await this.checkOAuthStatus(sessionId);
        
        if (!status.authenticated) {
            throw new Error('User not authenticated');
        }
        
        if (!status.githubConnected) {
            throw new Error('GitHub account not connected');
        }
        
        return status.token;
    }
    
    /**
     * Invalidate a session
     * @param {string} sessionId - Session ID to invalidate
     */
    async invalidateSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    
    /**
     * Clean up expired sessions
     */
    cleanupSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions) {
            if (session.expiresAt <= now) {
                this.sessions.delete(sessionId);
            }
        }
    }
    
    /**
     * Save integration config
     */
    async saveConfig(config) {
        await fs.mkdir(this.vaultPath, { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    
    /**
     * Load integration config
     */
    async loadConfig() {
        try {
            const data = await fs.readFile(this.configPath, 'utf8');
            return JSON.parse(data);
        } catch {
            return {};
        }
    }
}

// Enhanced GitHubAuthTerminal replacement that uses OAuth
class GitHubOAuthTerminal {
    constructor(vaultPath, oauthIntegration) {
        this.vaultPath = vaultPath;
        this.oauthIntegration = oauthIntegration;
        this.configPath = path.join(this.vaultPath, 'github-oauth-auth.json');
    }
    
    async checkAuthStatus(sessionId) {
        const oauthStatus = await this.oauthIntegration.checkOAuthStatus(sessionId);
        
        if (oauthStatus.authenticated && oauthStatus.githubConnected) {
            return {
                githubCLI: false,
                sshKey: false,
                personalAccessToken: false,
                oauth: true,
                gitConfig: true,
                authenticatedUser: oauthStatus.user.githubUsername,
                preferredMethod: 'oauth'
            };
        }
        
        // Fallback to checking traditional methods if OAuth not available
        return {
            githubCLI: false,
            sshKey: false,
            personalAccessToken: false,
            oauth: false,
            gitConfig: false,
            authenticatedUser: null,
            preferredMethod: null
        };
    }
    
    async testGitHubConnection(sessionId) {
        try {
            const token = await this.oauthIntegration.getOAuthToken(sessionId);
            return await this.oauthIntegration.testOAuthConnection(token);
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async setupOAuth(sessionId) {
        const status = await this.oauthIntegration.checkOAuthStatus(sessionId);
        
        if (!status.authenticated) {
            throw new Error('Please login via the unified auth server first');
        }
        
        if (!status.githubConnected) {
            throw new Error('Please connect your GitHub account in the unified auth dashboard');
        }
        
        // Configure git to use OAuth
        await this.oauthIntegration.configureGitWithOAuth(
            status.user.githubUsername,
            status.token
        );
        
        return {
            success: true,
            user: status.user.githubUsername
        };
    }
}

// Middleware for Express to extract session from cookies
function oauthSessionMiddleware(integration) {
    return (req, res, next) => {
        // Extract session ID from cookie
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});
        
        req.sessionId = cookies?.['connect.sid'] || req.headers['x-session-id'];
        req.oauthIntegration = integration;
        
        next();
    };
}

// API endpoints for the GitHub wrapper to use
function createOAuthEndpoints(app, integration) {
    // Check OAuth status
    app.get('/api/oauth/status', async (req, res) => {
        const status = await integration.checkOAuthStatus(req.sessionId);
        res.json(status);
    });
    
    // Get OAuth token for Git operations
    app.get('/api/oauth/token', async (req, res) => {
        try {
            const token = await integration.getOAuthToken(req.sessionId);
            res.json({ token });
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    });
    
    // Test OAuth connection
    app.post('/api/oauth/test', async (req, res) => {
        try {
            const token = await integration.getOAuthToken(req.sessionId);
            const result = await integration.testOAuthConnection(token);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Configure Git with OAuth
    app.post('/api/oauth/configure', async (req, res) => {
        try {
            const status = await integration.checkOAuthStatus(req.sessionId);
            
            if (!status.authenticated || !status.githubConnected) {
                return res.status(401).json({
                    error: 'GitHub not connected via OAuth'
                });
            }
            
            await integration.configureGitWithOAuth(
                status.user.githubUsername,
                status.token
            );
            
            res.json({
                success: true,
                message: 'Git configured to use OAuth'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = {
    GitHubOAuthIntegration,
    GitHubOAuthTerminal,
    oauthSessionMiddleware,
    createOAuthEndpoints
};

// Standalone test
if (require.main === module) {
    const integration = new GitHubOAuthIntegration();
    
    // Cleanup expired sessions periodically
    setInterval(() => {
        integration.cleanupSessions();
    }, 60 * 60 * 1000); // Every hour
    
    console.log('🔗 GitHub OAuth Integration Module');
    console.log('   This module bridges the unified auth server with GitHub operations');
    console.log('   Import it in your GitHub wrapper to enable OAuth-based authentication');
    console.log('\nExample usage:');
    console.log('   const { GitHubOAuthIntegration } = require("./github-oauth-integration");');
    console.log('   const integration = new GitHubOAuthIntegration();');
    console.log('   const status = await integration.checkOAuthStatus(sessionId);');
}