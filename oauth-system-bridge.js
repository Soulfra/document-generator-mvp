#!/usr/bin/env node

/**
 * OAUTH SYSTEM BRIDGE
 * 
 * Creates "Oathgate" connections between web OAuth and your OS.
 * Like Shadesmar in Stormlight Archives - bridging realms.
 */

const { execSync, spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const os = require('os');

class OAuthSystemBridge {
    constructor() {
        this.platform = os.platform();
        this.keychainService = 'SoulFra-OAuth';
        this.callbackPort = 8462; // Random port for OAuth callbacks
        this.activeFlows = new Map();
        
        console.log('🌉 OAuth System Bridge initializing...');
        console.log(`🖥️  Platform: ${this.platform}`);
    }
    
    // === KEYCHAIN OPERATIONS ===
    
    async setKeychainItem(account, service, secret) {
        if (this.platform === 'darwin') {
            // macOS Keychain
            try {
                // Delete existing item first
                execSync(
                    `security delete-generic-password -a "${account}" -s "${this.keychainService}-${service}" 2>/dev/null || true`,
                    { encoding: 'utf8' }
                );
                
                // Add new item
                execSync(
                    `security add-generic-password -a "${account}" -s "${this.keychainService}-${service}" -w "${secret}"`,
                    { encoding: 'utf8' }
                );
                
                console.log(`🔐 Stored ${service} token in macOS Keychain`);
                return true;
            } catch (error) {
                console.error('❌ Keychain error:', error.message);
                return false;
            }
        } else if (this.platform === 'linux') {
            // Linux secret-tool (GNOME Keyring)
            try {
                execSync(
                    `echo -n "${secret}" | secret-tool store --label="${this.keychainService}" service "${service}" account "${account}"`,
                    { encoding: 'utf8' }
                );
                console.log(`🔐 Stored ${service} token in GNOME Keyring`);
                return true;
            } catch (error) {
                // Fallback to encrypted file
                return this.setEncryptedFile(account, service, secret);
            }
        } else if (this.platform === 'win32') {
            // Windows Credential Manager
            try {
                const cred = {
                    targetName: `${this.keychainService}:${service}:${account}`,
                    credential: secret
                };
                // Would need node-windows-credentials package
                return this.setEncryptedFile(account, service, secret);
            } catch (error) {
                return this.setEncryptedFile(account, service, secret);
            }
        }
    }
    
    async getKeychainItem(account, service) {
        if (this.platform === 'darwin') {
            try {
                const result = execSync(
                    `security find-generic-password -a "${account}" -s "${this.keychainService}-${service}" -w 2>/dev/null`,
                    { encoding: 'utf8' }
                );
                return result.trim();
            } catch (error) {
                return null;
            }
        } else if (this.platform === 'linux') {
            try {
                const result = execSync(
                    `secret-tool lookup service "${service}" account "${account}"`,
                    { encoding: 'utf8' }
                );
                return result.trim();
            } catch (error) {
                return this.getEncryptedFile(account, service);
            }
        } else {
            return this.getEncryptedFile(account, service);
        }
    }
    
    async deleteKeychainItem(account, service) {
        if (this.platform === 'darwin') {
            try {
                execSync(
                    `security delete-generic-password -a "${account}" -s "${this.keychainService}-${service}" 2>/dev/null`,
                    { encoding: 'utf8' }
                );
                console.log(`🗑️  Removed ${service} token from Keychain`);
                return true;
            } catch (error) {
                return false;
            }
        } else if (this.platform === 'linux') {
            try {
                execSync(
                    `secret-tool clear service "${service}" account "${account}"`,
                    { encoding: 'utf8' }
                );
                return true;
            } catch (error) {
                return this.deleteEncryptedFile(account, service);
            }
        } else {
            return this.deleteEncryptedFile(account, service);
        }
    }
    
    // === ENCRYPTED FILE FALLBACK ===
    
    async setEncryptedFile(account, service, secret) {
        const configDir = path.join(os.homedir(), '.soulfra', 'oauth');
        await fs.mkdir(configDir, { recursive: true });
        
        const key = this.deriveKey(account, service);
        const encrypted = this.encrypt(secret, key);
        
        const filePath = path.join(configDir, `${service}-${account}.enc`);
        await fs.writeFile(filePath, encrypted, { mode: 0o600 });
        
        console.log(`🔐 Stored ${service} token in encrypted file`);
        return true;
    }
    
    async getEncryptedFile(account, service) {
        const filePath = path.join(os.homedir(), '.soulfra', 'oauth', `${service}-${account}.enc`);
        try {
            const encrypted = await fs.readFile(filePath, 'utf8');
            const key = this.deriveKey(account, service);
            return this.decrypt(encrypted, key);
        } catch (error) {
            return null;
        }
    }
    
    async deleteEncryptedFile(account, service) {
        const filePath = path.join(os.homedir(), '.soulfra', 'oauth', `${service}-${account}.enc`);
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // === ENCRYPTION HELPERS ===
    
    deriveKey(account, service) {
        // Derive a key from machine ID + account + service
        const machineId = this.getMachineId();
        return crypto.pbkdf2Sync(
            `${machineId}-${account}-${service}`,
            'soulfra-oauth-salt',
            100000,
            32,
            'sha256'
        );
    }
    
    getMachineId() {
        try {
            if (this.platform === 'darwin') {
                const result = execSync(
                    'ioreg -rd1 -c IOPlatformExpertDevice | awk \'/IOPlatformUUID/ { print $3; }\'',
                    { encoding: 'utf8' }
                );
                return result.trim().replace(/"/g, '');
            } else if (this.platform === 'linux') {
                const result = execSync('cat /etc/machine-id', { encoding: 'utf8' });
                return result.trim();
            } else {
                // Windows or fallback
                return os.hostname() + '-' + os.userInfo().username;
            }
        } catch {
            return 'default-machine-id';
        }
    }
    
    encrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    
    decrypt(encryptedText, key) {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    // === OAUTH FLOW MANAGEMENT ===
    
    async startOAuthFlow(provider, config) {
        const state = crypto.randomBytes(32).toString('hex');
        const flowId = crypto.randomUUID();
        
        this.activeFlows.set(state, {
            flowId,
            provider,
            config,
            startTime: Date.now()
        });
        
        // Start callback server
        await this.startCallbackServer();
        
        // Build OAuth URL
        const authUrl = this.buildAuthUrl(provider, config, state);
        
        console.log(`\n🔗 Starting OAuth flow for ${provider}`);
        console.log(`📋 Flow ID: ${flowId}`);
        
        return {
            flowId,
            authUrl,
            state,
            callbackUrl: `http://localhost:${this.callbackPort}/callback`
        };
    }
    
    buildAuthUrl(provider, config, state) {
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: `http://localhost:${this.callbackPort}/callback`,
            response_type: 'code',
            scope: config.scopes.join(' '),
            state: state
        });
        
        // Provider-specific parameters
        switch (provider) {
            case 'github':
                return `https://github.com/login/oauth/authorize?${params}`;
            case 'google':
                params.append('access_type', 'offline');
                params.append('prompt', 'consent');
                return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
            case 'microsoft':
                return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }
    
    async startCallbackServer() {
        if (this.callbackServer) return;
        
        this.callbackServer = http.createServer(async (req, res) => {
            const parsedUrl = url.parse(req.url, true);
            
            if (parsedUrl.pathname === '/callback') {
                const { code, state, error } = parsedUrl.query;
                
                if (error) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(this.getErrorHTML(error));
                    return;
                }
                
                const flow = this.activeFlows.get(state);
                if (!flow) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(this.getErrorHTML('Invalid state'));
                    return;
                }
                
                try {
                    // Exchange code for token
                    const tokenData = await this.exchangeCodeForToken(
                        flow.provider,
                        flow.config,
                        code
                    );
                    
                    // Store in keychain
                    await this.storeTokens(flow.provider, tokenData);
                    
                    // Success response
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(this.getSuccessHTML(flow.provider));
                    
                    // Cleanup
                    this.activeFlows.delete(state);
                    
                    // Emit success event
                    if (this.onSuccess) {
                        this.onSuccess(flow.provider, tokenData);
                    }
                    
                } catch (error) {
                    console.error('❌ Token exchange failed:', error);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(this.getErrorHTML(error.message));
                }
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        this.callbackServer.listen(this.callbackPort);
        console.log(`🌐 Callback server listening on port ${this.callbackPort}`);
    }
    
    async exchangeCodeForToken(provider, config, code) {
        const tokenUrl = this.getTokenUrl(provider);
        const params = new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code: code,
            redirect_uri: `http://localhost:${this.callbackPort}/callback`,
            grant_type: 'authorization_code'
        });
        
        const response = await this.httpPost(tokenUrl, params.toString(), {
            'Content-Type': 'application/x-www-form-urlencoded'
        });
        
        const data = JSON.parse(response);
        
        if (data.error) {
            throw new Error(`Token exchange failed: ${data.error_description || data.error}`);
        }
        
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
            scope: data.scope
        };
    }
    
    getTokenUrl(provider) {
        switch (provider) {
            case 'github':
                return 'https://github.com/login/oauth/access_token';
            case 'google':
                return 'https://oauth2.googleapis.com/token';
            case 'microsoft':
                return 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }
    
    async storeTokens(provider, tokenData) {
        const account = await this.getUserInfo(provider, tokenData.accessToken);
        
        // Store access token
        await this.setKeychainItem(
            account.email || account.login || account.id,
            `${provider}-access`,
            tokenData.accessToken
        );
        
        // Store refresh token if available
        if (tokenData.refreshToken) {
            await this.setKeychainItem(
                account.email || account.login || account.id,
                `${provider}-refresh`,
                tokenData.refreshToken
            );
        }
        
        // Store account info
        await this.setKeychainItem(
            account.email || account.login || account.id,
            `${provider}-account`,
            JSON.stringify(account)
        );
        
        console.log(`✅ Stored ${provider} tokens for ${account.email || account.login}`);
    }
    
    async getUserInfo(provider, accessToken) {
        let userUrl;
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        };
        
        switch (provider) {
            case 'github':
                userUrl = 'https://api.github.com/user';
                headers['Authorization'] = `token ${accessToken}`;
                break;
            case 'google':
                userUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
                break;
            case 'microsoft':
                userUrl = 'https://graph.microsoft.com/v1.0/me';
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
        
        const response = await this.httpGet(userUrl, headers);
        return JSON.parse(response);
    }
    
    // === HTTP HELPERS ===
    
    httpPost(url, data, headers = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    ...headers,
                    'Content-Length': Buffer.byteLength(data)
                }
            };
            
            const proto = parsedUrl.protocol === 'https:' ? https : http;
            const req = proto.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(body);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }
    
    httpGet(url, headers = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...headers
                }
            };
            
            const proto = parsedUrl.protocol === 'https:' ? https : http;
            const req = proto.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(body);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.end();
        });
    }
    
    // === UI TEMPLATES ===
    
    getSuccessHTML(provider) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Success</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 3rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { margin-bottom: 1rem; }
        .close-hint { opacity: 0.7; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Successfully Connected ${provider}!</h1>
        <p>Your OAuth tokens have been securely stored in your system keychain.</p>
        <p class="close-hint">You can close this window and return to the terminal.</p>
    </div>
    <script>
        setTimeout(() => {
            window.close();
        }, 5000);
    </script>
</body>
</html>
        `;
    }
    
    getErrorHTML(error) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 3rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 500px;
        }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { margin-bottom: 1rem; }
        .error { 
            background: rgba(0, 0, 0, 0.2); 
            padding: 1rem; 
            border-radius: 10px; 
            margin-top: 1rem;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">❌</div>
        <h1>OAuth Failed</h1>
        <p>There was a problem completing the OAuth flow.</p>
        <div class="error">${error}</div>
        <p style="margin-top: 2rem;">Please close this window and try again.</p>
    </div>
</body>
</html>
        `;
    }
    
    // === CLEANUP ===
    
    async cleanup() {
        if (this.callbackServer) {
            this.callbackServer.close();
            console.log('🛑 Callback server stopped');
        }
        
        // Clear expired flows
        for (const [state, flow] of this.activeFlows.entries()) {
            if (Date.now() - flow.startTime > 10 * 60 * 1000) { // 10 minutes
                this.activeFlows.delete(state);
            }
        }
    }
}

module.exports = OAuthSystemBridge;