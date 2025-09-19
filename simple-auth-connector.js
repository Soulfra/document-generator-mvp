#!/usr/bin/env node
/**
 * Simple Auth Connector - Uses Your Existing Working JWT System
 * 
 * Connects to your PropTech JWT authentication that actually works
 * No bullshit, no bloat, just connects what you built
 */

const http = require('http');
const https = require('https');

class SimpleAuthConnector {
    constructor() {
        this.authBaseUrl = 'http://localhost:5000'; // Your PropTech backend
        this.tokens = this.loadTokens();
        
        console.log('🔐 SIMPLE AUTH CONNECTOR - USING YOUR WORKING JWT SYSTEM');
        console.log('=========================================================');
        console.log('');
    }
    
    loadTokens() {
        // Check localStorage-style storage first
        const fs = require('fs');
        const tokenFile = '.auth-tokens.json';
        
        if (fs.existsSync(tokenFile)) {
            try {
                const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
                console.log('✅ Found existing auth tokens');
                return tokens;
            } catch (e) {
                console.log('⚠️ Invalid token file, will re-auth');
            }
        }
        
        return null;
    }
    
    saveTokens(tokens) {
        const fs = require('fs');
        fs.writeFileSync('.auth-tokens.json', JSON.stringify(tokens, null, 2));
        this.tokens = tokens;
        console.log('✅ Auth tokens saved');
    }
    
    async quickLogin() {
        console.log('🚀 Quick Login to Your Working JWT System\n');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const email = await new Promise(resolve => {
            rl.question('Email: ', resolve);
        });
        
        const password = await new Promise(resolve => {
            rl.question('Password: ', (input) => {
                process.stdout.write('\n');
                resolve(input);
            });
        });
        
        rl.close();
        
        try {
            const response = await this.apiRequest('POST', '/auth/login', {
                email,
                password
            });
            
            if (response.success && response.data.accessToken) {
                console.log('✅ Login successful!');
                console.log(`👤 Welcome back, ${response.data.user.firstName}!`);
                
                this.saveTokens({
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                    user: response.data.user
                });
                
                return true;
            } else {
                console.log('❌ Login failed:', response.message);
                return false;
            }
        } catch (error) {
            console.log('❌ Login error:', error.message);
            return false;
        }
    }
    
    async checkAuth() {
        if (!this.tokens) {
            console.log('❌ No auth tokens found');
            return false;
        }
        
        try {
            // Try to use the access token
            const response = await this.apiRequest('GET', '/auth/me', null, this.tokens.accessToken);
            
            if (response.success) {
                console.log('✅ Auth token valid');
                console.log(`👤 Logged in as: ${response.data.firstName} ${response.data.lastName}`);
                return true;
            } else {
                console.log('🔄 Access token expired, refreshing...');
                return await this.refreshAuth();
            }
        } catch (error) {
            console.log('🔄 Token invalid, refreshing...');
            return await this.refreshAuth();
        }
    }
    
    async refreshAuth() {
        if (!this.tokens?.refreshToken) {
            console.log('❌ No refresh token available');
            return false;
        }
        
        try {
            const response = await this.apiRequest('POST', '/auth/refresh', {
                refreshToken: this.tokens.refreshToken
            });
            
            if (response.success && response.data.accessToken) {
                console.log('✅ Token refreshed successfully');
                
                this.saveTokens({
                    ...this.tokens,
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken || this.tokens.refreshToken
                });
                
                return true;
            } else {
                console.log('❌ Token refresh failed');
                return false;
            }
        } catch (error) {
            console.log('❌ Refresh error:', error.message);
            return false;
        }
    }
    
    async apiRequest(method, path, data = null, authToken = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.authBaseUrl);
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Document-Generator-Auth'
                }
            };
            
            if (authToken) {
                options.headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const req = http.request(url, options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseData);
                        resolve(response);
                    } catch (e) {
                        resolve({ success: false, message: 'Invalid response' });
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    async getAuthHeaders() {
        const isValid = await this.checkAuth();
        
        if (!isValid) {
            const loginSuccess = await this.quickLogin();
            if (!loginSuccess) {
                throw new Error('Authentication failed');
            }
        }
        
        return {
            'Authorization': `Bearer ${this.tokens.accessToken}`,
            'Content-Type': 'application/json'
        };
    }
    
    async authenticatedGitPush() {
        console.log('\n🚀 AUTHENTICATED GIT PUSH');
        console.log('========================');
        
        try {
            // Check if we're authenticated
            const isValid = await this.checkAuth();
            if (!isValid) {
                const loginSuccess = await this.quickLogin();
                if (!loginSuccess) {
                    console.log('❌ Cannot push without authentication');
                    return;
                }
            }
            
            // Get GitHub token from the authenticated API
            console.log('🔍 Getting GitHub access from authenticated API...');
            
            const response = await this.apiRequest('GET', '/integrations/github', null, this.tokens.accessToken);
            
            if (response.success && response.data.githubToken) {
                console.log('✅ Got GitHub token from API');
                
                // Use the token to push
                this.pushWithToken(response.data.githubToken);
            } else {
                console.log('⚠️ No GitHub integration found, using fallback...');
                this.fallbackGitPush();
            }
            
        } catch (error) {
            console.log('❌ Auth error:', error.message);
            this.fallbackGitPush();
        }
    }
    
    pushWithToken(token) {
        const { execSync } = require('child_process');
        
        try {
            // Stage changes
            console.log('📦 Staging changes...');
            execSync('git add .', { stdio: 'inherit' });
            
            // Create commit
            const timestamp = new Date().toISOString();
            const commitMsg = `Authenticated update: ${timestamp}`;
            console.log(`💾 Creating commit: "${commitMsg}"`);
            
            try {
                execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
            } catch (e) {
                console.log('ℹ️ No changes to commit');
            }
            
            // Configure remote with token
            const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
            const authUrl = remoteUrl.replace('https://', `https://${token}@`);
            execSync(`git remote set-url origin "${authUrl}"`, { stdio: 'pipe' });
            
            // Push
            console.log('🚀 Pushing to GitHub...');
            execSync('git push -u origin main', { stdio: 'inherit' });
            
            console.log('✅ PUSH SUCCESSFUL!');
            
        } catch (error) {
            console.log('❌ Push failed:', error.message);
        }
    }
    
    fallbackGitPush() {
        console.log('\n🔄 FALLBACK: Personal Access Token');
        console.log('===================================');
        
        const fs = require('fs');
        const readline = require('readline');
        
        // Check for stored token
        if (fs.existsSync('.github-token')) {
            const token = fs.readFileSync('.github-token', 'utf8').trim();
            if (token && token.length > 10) {
                console.log('✅ Using stored personal access token');
                this.pushWithToken(token);
                return;
            }
        }
        
        console.log('Need a GitHub Personal Access Token:');
        console.log('1. Go to https://github.com/settings/tokens');
        console.log('2. Click "Generate new token (classic)"');
        console.log('3. Select "repo" scope');
        console.log('4. Generate and copy the token\n');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('Paste your GitHub token: ', (token) => {
            if (token && token.length > 10) {
                fs.writeFileSync('.github-token', token);
                console.log('✅ Token saved');
                this.pushWithToken(token);
            } else {
                console.log('❌ Invalid token');
            }
            rl.close();
        });
    }
    
    // Create auth status endpoint for other components
    createStatusServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.url === '/auth/status') {
                const isValid = await this.checkAuth();
                res.end(JSON.stringify({
                    authenticated: isValid,
                    user: isValid ? this.tokens.user : null,
                    timestamp: new Date().toISOString()
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(9999, () => {
            console.log('🎧 Auth status server running on http://localhost:9999');
        });
        
        return server;
    }
}

// CLI usage
async function main() {
    const connector = new SimpleAuthConnector();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'status';
    
    switch (command) {
        case 'login':
            await connector.quickLogin();
            break;
            
        case 'status':
            await connector.checkAuth();
            break;
            
        case 'push':
            await connector.authenticatedGitPush();
            break;
            
        case 'server':
            await connector.checkAuth();
            connector.createStatusServer();
            console.log('\nAuth server running. Press Ctrl+C to stop.');
            break;
            
        default:
            console.log('Usage:');
            console.log('  node simple-auth-connector.js login   # Login to your JWT system');
            console.log('  node simple-auth-connector.js status  # Check auth status');
            console.log('  node simple-auth-connector.js push    # Authenticated git push');
            console.log('  node simple-auth-connector.js server  # Start auth status server');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleAuthConnector;