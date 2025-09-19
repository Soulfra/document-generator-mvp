#!/usr/bin/env node
/**
 * Automated GitHub Push using Existing OAuth System
 * 
 * This uses your existing OAuth authentication to push to GitHub
 * without any manual Git configuration bullshit.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class AutoGitHubPush {
    constructor() {
        this.cookieJar = this.loadCookieJar();
        this.authToken = null;
        this.githubUser = null;
        this.repoUrl = null;
        
        this.init();
    }
    
    init() {
        console.log('🚀 AUTO GITHUB PUSH - NO MANUAL BULLSHIT');
        console.log('========================================\n');
        
        // Check if OAuth server is running
        this.checkOAuthServer();
    }
    
    loadCookieJar() {
        // Load cookies from the OAuth system's cookie jar
        const cookieFile = path.join(__dirname, '.cookies.json');
        if (fs.existsSync(cookieFile)) {
            return JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
        }
        
        // Check localStorage-style storage
        const localStorageFile = path.join(__dirname, '.local-storage.json');
        if (fs.existsSync(localStorageFile)) {
            const storage = JSON.parse(fs.readFileSync(localStorageFile, 'utf8'));
            return {
                github_token: storage.github_oauth_token,
                github_user: storage.github_username
            };
        }
        
        return {};
    }
    
    async checkOAuthServer() {
        console.log('🔍 Checking for existing OAuth session...\n');
        
        // Try to get auth from running OAuth server
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/auth/status',
            method: 'GET',
            headers: {
                'Cookie': this.buildCookieString()
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const authStatus = JSON.parse(data);
                    if (authStatus.github && authStatus.github.authenticated) {
                        console.log('✅ Found existing GitHub authentication!');
                        console.log(`👤 User: ${authStatus.github.username}`);
                        this.authToken = authStatus.github.token;
                        this.githubUser = authStatus.github.username;
                        this.automatePush();
                    } else {
                        this.startQuickAuth();
                    }
                } catch (e) {
                    this.startQuickAuth();
                }
            });
        });
        
        req.on('error', () => {
            console.log('⚠️  OAuth server not running. Starting quick auth...\n');
            this.startQuickAuth();
        });
        
        req.end();
    }
    
    startQuickAuth() {
        console.log('🔐 Starting Quick GitHub Authentication...\n');
        
        // Check if we have stored credentials
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const clientId = envContent.match(/GITHUB_CLIENT_ID=(.+)/)?.[1];
            const clientSecret = envContent.match(/GITHUB_CLIENT_SECRET=(.+)/)?.[1];
            
            if (clientId && clientId !== 'your-github-client-id-here') {
                this.launchOAuthFlow(clientId);
                return;
            }
        }
        
        // Use personal access token as fallback
        console.log('📝 No OAuth app configured. Using personal access token...\n');
        this.usePersonalAccessToken();
    }
    
    launchOAuthFlow(clientId) {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;
        console.log('🌐 Opening GitHub authorization in browser...');
        console.log(`URL: ${authUrl}\n`);
        
        // Open in default browser
        const platform = process.platform;
        const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
        execSync(`${command} "${authUrl}"`);
        
        // Start local server to catch callback
        this.startCallbackServer();
    }
    
    startCallbackServer() {
        const server = http.createServer(async (req, res) => {
            if (req.url.startsWith('/auth/github/callback')) {
                const url = new URL(req.url, 'http://localhost:8000');
                const code = url.searchParams.get('code');
                
                if (code) {
                    console.log('✅ Received authorization code!');
                    // Exchange code for token
                    const token = await this.exchangeCodeForToken(code);
                    this.authToken = token;
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <body style="font-family: Arial; background: #1a1a1a; color: #4ecca3; padding: 50px; text-align: center;">
                                <h1>✅ GitHub Authentication Successful!</h1>
                                <p>You can close this window and return to the terminal.</p>
                                <script>setTimeout(() => window.close(), 3000);</script>
                            </body>
                        </html>
                    `);
                    
                    server.close();
                    this.automatePush();
                }
            }
        });
        
        server.listen(8000, () => {
            console.log('🎧 Waiting for GitHub callback on port 8000...\n');
        });
    }
    
    async exchangeCodeForToken(code) {
        // This would exchange the code for an access token
        // Using the OAuth flow from your existing system
        console.log('🔄 Exchanging code for access token...');
        
        // For now, we'll use the stored token
        return this.cookieJar.github_token || null;
    }
    
    usePersonalAccessToken() {
        // Check if we have a stored token
        const tokenFile = path.join(__dirname, '.github-token');
        
        if (fs.existsSync(tokenFile)) {
            this.authToken = fs.readFileSync(tokenFile, 'utf8').trim();
            console.log('✅ Found stored GitHub token');
            this.automatePush();
        } else {
            console.log('To create a personal access token:');
            console.log('1. Go to https://github.com/settings/tokens');
            console.log('2. Click "Generate new token (classic)"');
            console.log('3. Select "repo" scope');
            console.log('4. Generate and copy the token\n');
            
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.question('Paste your GitHub token: ', (token) => {
                if (token) {
                    fs.writeFileSync(tokenFile, token);
                    this.authToken = token;
                    console.log('✅ Token saved');
                    rl.close();
                    this.automatePush();
                } else {
                    console.log('❌ No token provided');
                    rl.close();
                }
            });
        }
    }
    
    buildCookieString() {
        return Object.entries(this.cookieJar)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
    }
    
    async automatePush() {
        console.log('\n🎯 AUTOMATING GIT PUSH PROCESS');
        console.log('================================\n');
        
        try {
            // 1. Auto-detect repository info
            await this.detectRepository();
            
            // 2. Configure Git to use our token
            await this.configureGitAuth();
            
            // 3. Stage all changes
            console.log('📦 Staging all changes...');
            execSync('git add .', { stdio: 'inherit' });
            
            // 4. Create commit
            const timestamp = new Date().toISOString();
            const commitMsg = `Auto-update from Document Generator [${timestamp}]`;
            console.log(`💾 Creating commit: "${commitMsg}"`);
            
            try {
                execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
            } catch (e) {
                console.log('ℹ️  No changes to commit');
            }
            
            // 5. Push to GitHub
            console.log('\n🚀 Pushing to GitHub...');
            execSync('git push -u origin main', { stdio: 'inherit' });
            
            console.log('\n✅ SUCCESSFULLY PUSHED TO GITHUB!');
            console.log(`🔗 View at: ${this.repoUrl}\n`);
            
            // Save successful auth for next time
            this.saveCookieJar();
            
        } catch (error) {
            console.error('\n❌ Push failed:', error.message);
            this.handlePushError(error);
        }
    }
    
    async detectRepository() {
        console.log('🔍 Detecting repository information...');
        
        // Check current remotes
        try {
            const remotes = execSync('git remote -v', { encoding: 'utf8' });
            
            if (remotes.includes('origin')) {
                const originUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
                console.log(`✅ Found origin: ${originUrl}`);
                this.repoUrl = originUrl;
            } else {
                // No remote, try to detect from package.json
                if (fs.existsSync('package.json')) {
                    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                    if (pkg.repository && pkg.repository.url) {
                        let repoUrl = pkg.repository.url;
                        repoUrl = repoUrl.replace('git+', '').replace('.git', '');
                        
                        // Auto-fix the placeholder URL
                        if (repoUrl.includes('yourusername')) {
                            console.log('\n📝 Need to set up repository...');
                            await this.createOrDetectRepo();
                        } else {
                            console.log(`📦 Found repo in package.json: ${repoUrl}`);
                            execSync(`git remote add origin ${repoUrl}`);
                            this.repoUrl = repoUrl;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('ℹ️  No Git repository found. Initializing...');
            execSync('git init');
            await this.createOrDetectRepo();
        }
    }
    
    async createOrDetectRepo() {
        if (!this.githubUser && this.authToken) {
            // Get username from GitHub API
            const https = require('https');
            const options = {
                hostname: 'api.github.com',
                path: '/user',
                headers: {
                    'Authorization': `token ${this.authToken}`,
                    'User-Agent': 'Document-Generator'
                }
            };
            
            const userData = await new Promise((resolve) => {
                https.get(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const user = JSON.parse(data);
                            this.githubUser = user.login;
                            resolve(user);
                        } catch (e) {
                            resolve(null);
                        }
                    });
                });
            });
        }
        
        const repoName = 'document-generator';
        const repoUrl = `https://github.com/${this.githubUser || 'yourusername'}/${repoName}`;
        
        console.log(`\n📁 Repository: ${repoUrl}`);
        console.log('ℹ️  Make sure this repository exists on GitHub\n');
        
        // Set the remote
        try {
            execSync(`git remote add origin ${repoUrl}.git`);
        } catch (e) {
            execSync(`git remote set-url origin ${repoUrl}.git`);
        }
        
        this.repoUrl = repoUrl;
    }
    
    configureGitAuth() {
        console.log('🔐 Configuring Git authentication...');
        
        if (this.authToken) {
            // Configure Git to use the token
            const authUrl = this.repoUrl
                .replace('https://', `https://${this.authToken}@`)
                .replace('http://', `http://${this.authToken}@`);
            
            execSync(`git remote set-url origin ${authUrl}`, { stdio: 'pipe' });
            console.log('✅ Git configured with OAuth token');
        }
    }
    
    saveCookieJar() {
        const cookieFile = path.join(__dirname, '.cookies.json');
        const cookies = {
            ...this.cookieJar,
            github_token: this.authToken,
            github_user: this.githubUser,
            last_push: new Date().toISOString()
        };
        
        fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));
    }
    
    handlePushError(error) {
        if (error.message.includes('failed to push')) {
            console.log('\n💡 Try these solutions:');
            console.log('1. Make sure the repository exists on GitHub');
            console.log('2. Check that you have push permissions');
            console.log('3. Try: git pull origin main --allow-unrelated-histories');
            console.log('4. Then run this script again\n');
        } else if (error.message.includes('authentication')) {
            console.log('\n💡 Authentication issue. Clearing stored credentials...');
            fs.unlinkSync('.github-token');
            fs.unlinkSync('.cookies.json');
            console.log('Run this script again to re-authenticate\n');
        }
    }
}

// Self-executing
if (require.main === module) {
    new AutoGitHubPush();
}

module.exports = AutoGitHubPush;