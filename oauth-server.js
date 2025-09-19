#!/usr/bin/env node

/**
 * Simple OAuth Server
 * Following GitHub's documentation examples from docs.github.com
 * 
 * Based on: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');
const GitHubAPIClient = require('./github-api-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(express.static('portal'));
app.use(express.static('docs'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session storage (in production, use Redis or database)
const sessions = new Map();

// CSRF state storage
const stateStore = new Map();

/**
 * Generate cryptographically secure random state for CSRF protection
 */
function generateState() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * GitHub OAuth Configuration
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/github/callback`;

// Check if GitHub OAuth is configured (not placeholder values)
const OAUTH_CONFIGURED = GITHUB_CLIENT_ID && 
                         GITHUB_CLIENT_SECRET && 
                         GITHUB_CLIENT_ID !== 'your-github-client-id-here' &&
                         GITHUB_CLIENT_SECRET !== 'your-github-client-secret-here';

if (!OAUTH_CONFIGURED) {
    console.log('⚠️  GitHub OAuth not configured - running in demo mode');
    console.log('   To enable GitHub integration:');
    console.log('   1. Go to: https://github.com/settings/developers');
    console.log('   2. Create OAuth App with callback: http://localhost:3000/auth/github/callback');
    console.log('   3. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env file');
    console.log('   4. Run: npm start');
    console.log('');
}

// Routes

/**
 * Home page - redirect to portal
 */
app.get('/', (req, res) => {
    res.redirect('/portal/');
});

/**
 * Portal home page 
 */
app.get('/portal/', (req, res) => {
    res.sendFile(path.join(__dirname, 'portal/index.html'));
});

/**
 * Login route - initiate GitHub OAuth
 * Following: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity
 */
app.get('/auth/github/login', (req, res) => {
    if (!OAUTH_CONFIGURED) {
        return res.status(400).json({
            error: 'GitHub OAuth not configured',
            message: 'Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env file'
        });
    }
    
    // Generate and store CSRF state
    const state = generateState();
    const sessionId = crypto.randomUUID();
    
    stateStore.set(state, {
        sessionId,
        timestamp: Date.now()
    });
    
    // Clean old states (5 minutes)
    for (const [key, value] of stateStore.entries()) {
        if (Date.now() - value.timestamp > 5 * 60 * 1000) {
            stateStore.delete(key);
        }
    }
    
    // Redirect to GitHub OAuth
    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'user:email read:user repo',
        state: state,
        allow_signup: 'true'
    });
    
    const githubURL = `https://github.com/login/oauth/authorize?${params}`;
    
    console.log(`🔐 Redirecting to GitHub OAuth: ${githubURL}`);
    res.redirect(githubURL);
});

/**
 * OAuth callback - handle GitHub response
 * Following: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
 */
app.get('/auth/github/callback', async (req, res) => {
    const { code, state, error } = req.query;
    
    // Handle OAuth errors
    if (error) {
        console.error('❌ GitHub OAuth error:', error);
        return res.status(400).send(`
            <h1>OAuth Error</h1>
            <p>GitHub returned an error: ${error}</p>
            <a href="/auth/github/login">Try again</a>
        `);
    }
    
    // Validate CSRF state
    if (!state || !stateStore.has(state)) {
        console.error('❌ Invalid or missing state parameter');
        return res.status(400).send(`
            <h1>Invalid Request</h1>
            <p>Invalid or missing state parameter. This could be a CSRF attack.</p>
            <a href="/auth/github/login">Start over</a>
        `);
    }
    
    // Get session info and clean up state
    const stateInfo = stateStore.get(state);
    stateStore.delete(state);
    
    if (!code) {
        return res.status(400).send(`
            <h1>No Authorization Code</h1>
            <p>GitHub did not provide an authorization code.</p>
            <a href="/auth/github/login">Try again</a>
        `);
    }
    
    try {
        console.log('🔄 Exchanging code for access token...');
        
        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Document-Generator-OAuth'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: REDIRECT_URI
            })
        });
        
        if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            throw new Error(`Token error: ${tokenData.error_description || tokenData.error}`);
        }
        
        const accessToken = tokenData.access_token;
        
        if (!accessToken) {
            throw new Error('No access token received');
        }
        
        console.log('✅ Access token received');
        
        // Get user info
        const client = new GitHubAPIClient(accessToken);
        const user = await client.getUser();
        
        console.log(`👤 Authenticated user: ${user.login} (${user.name})`);
        
        // Store session
        sessions.set(stateInfo.sessionId, {
            accessToken,
            user,
            timestamp: Date.now()
        });
        
        // Set session cookie
        res.cookie('session_id', stateInfo.sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        // Success! Redirect to repo selector
        res.redirect('/portal/repo-selector.html');
        
    } catch (error) {
        console.error('❌ OAuth callback error:', error.message);
        res.status(500).send(`
            <h1>Authentication Failed</h1>
            <p>Error: ${error.message}</p>
            <a href="/auth/github/login">Try again</a>
        `);
    }
});

/**
 * Logout route
 */
app.get('/auth/logout', (req, res) => {
    const sessionId = req.cookies?.session_id;
    
    if (sessionId && sessions.has(sessionId)) {
        sessions.delete(sessionId);
    }
    
    res.clearCookie('session_id');
    res.redirect('/docs/');
});

/**
 * Get current user API endpoint
 */
app.get('/api/user', (req, res) => {
    const sessionId = req.cookies?.session_id;
    
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = sessions.get(sessionId);
    res.json({ user: session.user });
});

/**
 * List user repositories API endpoint
 */
app.get('/api/repos', async (req, res) => {
    const sessionId = req.cookies?.session_id;
    
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const session = sessions.get(sessionId);
        const client = new GitHubAPIClient(session.accessToken);
        
        const repos = await client.listRepositories({
            sort: 'updated',
            per_page: 50
        });
        
        res.json(repos);
    } catch (error) {
        console.error('Error fetching repos:', error.message);
        res.status(500).json({ error: 'Failed to fetch repositories' });
    }
});

/**
 * Get repository documents API endpoint
 */
app.get('/api/repos/:owner/:repo/documents', async (req, res) => {
    const sessionId = req.cookies?.session_id;
    
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const { owner, repo } = req.params;
        const session = sessions.get(sessionId);
        const client = new GitHubAPIClient(session.accessToken);
        
        const documents = await client.findDocuments(owner, repo);
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error.message);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        github_oauth: {
            client_id: GITHUB_CLIENT_ID ? 'configured' : 'missing',
            client_secret: GITHUB_CLIENT_SECRET ? 'configured' : 'missing'
        }
    });
});

/**
 * 404 handler
 */
app.use((req, res) => {
    res.status(404).send(`
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/docs/">Back to Documentation</a>
    `);
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send(`
        <h1>Server Error</h1>
        <p>Something went wrong on our end.</p>
        <a href="/docs/">Back to Documentation</a>
    `);
});

/**
 * Start server
 */
app.listen(PORT, () => {
    console.log(`🚀 OAuth Server running on http://localhost:${PORT}`);
    console.log(`📚 Documentation: http://localhost:${PORT}/docs/`);
    console.log(`🔐 GitHub Login: http://localhost:${PORT}/auth/github/login`);
    
    if (!OAUTH_CONFIGURED) {
        console.log('\n⚠️  GitHub OAuth not configured');
        console.log('   Visit: http://localhost:3000/docs/authentication/oauth-setup.html');
    } else {
        console.log('\n✅ GitHub OAuth configured');
        console.log(`   Client ID: ${GITHUB_CLIENT_ID.substring(0, 8)}...`);
    }
    
    console.log('\n' + '='.repeat(50));
});

module.exports = app;