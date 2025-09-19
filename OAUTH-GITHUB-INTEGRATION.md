# OAuth GitHub Integration System

A seamless integration between the Unified Auth Server and GitHub Desktop Wrapper that replaces terminal-based authentication with OAuth tokens.

## 🚀 Overview

This integration provides:
- **One-click GitHub login** via OAuth
- **No terminal authentication** required
- **Automatic token management**
- **Shared authentication state** between services
- **Secure token storage** and encryption
- **Session management** with automatic cleanup

## 📦 Components

### 1. **github-oauth-integration.js**
Core integration module that bridges the unified auth server with GitHub operations:
- Manages OAuth token retrieval from unified auth server
- Configures Git to use OAuth tokens automatically
- Provides session management and caching
- Handles token validation and testing

### 2. **github-desktop-wrapper-oauth.js**
Enhanced GitHub Desktop wrapper with OAuth support:
- Replaces terminal authentication with OAuth flow
- Checks unified auth server for authentication status
- Automatically configures Git for each operation
- Beautiful web UI with OAuth status indicators

### 3. **start-oauth-github-system.sh**
Unified launcher that starts both services in tmux:
- Starts unified auth server
- Starts OAuth-enabled GitHub wrapper
- Provides monitoring and logging
- Easy session management

## 🔧 Setup Instructions

### Prerequisites

1. **Install Dependencies**
```bash
npm install express express-session passport passport-github2 passport-google-oauth20
npm install ws crypto
```

2. **Configure OAuth Apps**

#### GitHub OAuth App:
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: "Your App Name"
   - Homepage URL: `http://localhost:3340`
   - Authorization callback URL: `http://localhost:3340/auth/github/callback`
4. Save the Client ID and Client Secret

3. **Set Environment Variables**
```bash
export GITHUB_CLIENT_ID=your-github-client-id
export GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Quick Start

1. **Launch the System**
```bash
./start-oauth-github-system.sh
```

2. **Access GitHub Desktop**
- Open http://localhost:3337
- You'll see the OAuth-enabled interface

3. **Login with GitHub**
- Click "Login with GitHub"
- You'll be redirected to the unified auth server
- Click the GitHub login button
- Authorize the OAuth app
- You'll be redirected back to GitHub Desktop

4. **Start Using Git**
- Pull/Push operations now use OAuth tokens automatically
- No need to enter credentials or set up SSH keys
- Tokens are securely managed by the auth server

## 🏗️ Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   User Browser      │────▶│  GitHub Desktop     │
│                     │     │  localhost:3337     │
└─────────────────────┘     └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  OAuth Integration  │
                            │    Module           │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  Unified Auth       │
                            │  Server             │
                            │  localhost:3340     │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  GitHub OAuth       │
                            │  Provider           │
                            └─────────────────────┘
```

## 🔐 Security Features

- **Encrypted Token Storage**: OAuth tokens are encrypted before storage
- **Session Management**: Automatic session expiry and cleanup
- **Secure Communication**: All auth checks happen server-side
- **No Token Exposure**: Tokens never sent to browser
- **Automatic Git Configuration**: Per-operation token injection

## 📡 API Endpoints

### GitHub Wrapper Endpoints

- `GET /api/auth/status` - Check OAuth authentication status
- `GET /api/oauth/status` - Detailed OAuth status with user info
- `GET /api/oauth/token` - Get OAuth token (server-side only)
- `POST /api/oauth/test` - Test GitHub connection with OAuth
- `POST /api/oauth/configure` - Configure Git to use OAuth

### Unified Auth Server Endpoints

- `GET /api/github/token` - Get GitHub OAuth token for authenticated user
- `GET /api/user` - Get current user info
- `GET /auth/github` - Initiate GitHub OAuth flow
- `GET /auth/github/callback` - GitHub OAuth callback

## 🛠️ Customization

### Change Ports
```javascript
// In github-desktop-wrapper-oauth.js
const wrapper = new OAuthGitHubWrapper({
    port: 3337,  // Change web interface port
    authServerUrl: 'http://localhost:3340'  // Change auth server URL
});
```

### Add Additional OAuth Providers
The system supports multiple OAuth providers. Add them in `unified-auth-server.js`:
```javascript
// Example: Add GitLab
passport.use(new GitLabStrategy({
    clientID: process.env.GITLAB_CLIENT_ID,
    clientSecret: process.env.GITLAB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3340/auth/gitlab/callback'
}, handleOAuthCallback));
```

### Customize Session Duration
```javascript
// In github-oauth-integration.js
const integration = new GitHubOAuthIntegration({
    sessionTimeout: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

## 🐛 Troubleshooting

### "Not authenticated" error
1. Check if unified auth server is running: `curl http://localhost:3340`
2. Clear browser cookies and try logging in again
3. Check browser console for errors

### "GitHub not connected" error
1. Login to unified auth dashboard: http://localhost:3340/dashboard
2. Click "Connect GitHub" if not already connected
3. Ensure GitHub OAuth app is properly configured

### Git operations fail
1. Check if OAuth token is valid: Use "Test Connection" button
2. Verify Git is installed: `git --version`
3. Check Git configuration: `git config --list`

### Session issues
1. Clear browser cookies for localhost
2. Restart both services
3. Check session storage in `.vault/unified-accounts.json`

## 🚀 Advanced Usage

### Programmatic Integration
```javascript
const { GitHubOAuthIntegration } = require('./github-oauth-integration');

const integration = new GitHubOAuthIntegration({
    authServerUrl: 'http://localhost:3340'
});

// Check auth status
const status = await integration.checkOAuthStatus(sessionId);

// Get OAuth token
const token = await integration.getOAuthToken(sessionId);

// Test connection
const result = await integration.testOAuthConnection(token);
```

### Using with CI/CD
The OAuth tokens can be used in CI/CD pipelines:
```bash
# Get token via API
TOKEN=$(curl -s http://localhost:3340/api/github/token \
  -H "Cookie: connect.sid=$SESSION_ID" \
  | jq -r .token)

# Use with Git
git clone https://oauth2:$TOKEN@github.com/user/repo.git
```

## 📝 License

This integration is part of the Document Generator project and follows the same license terms.