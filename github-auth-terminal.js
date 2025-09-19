#!/usr/bin/env node

/**
 * GITHUB AUTHENTICATION TERMINAL INTEGRATION
 * 
 * Provides terminal functionality for GitHub authentication within the wrapper.
 * Supports multiple authentication methods:
 * - GitHub CLI (gh)
 * - SSH keys
 * - Personal Access Tokens
 * - OAuth (future)
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class GitHubAuthTerminal {
    constructor(vaultPath) {
        this.vaultPath = vaultPath || path.join(process.cwd(), '.vault');
        this.sshDir = path.join(os.homedir(), '.ssh');
        this.configPath = path.join(this.vaultPath, 'github-auth.json');
        
        // Encryption for stored tokens
        this.encryptionKey = this.getOrCreateEncryptionKey();
        
        console.log('🔐 GitHub Authentication Terminal initialized');
    }
    
    // === AUTHENTICATION STATUS CHECK ===
    
    async checkAuthStatus() {
        const status = {
            githubCLI: false,
            sshKey: false,
            personalAccessToken: false,
            gitConfig: false,
            authenticatedUser: null,
            preferredMethod: null
        };
        
        // Check GitHub CLI
        try {
            const ghStatus = await this.execCommand('gh auth status');
            status.githubCLI = ghStatus.includes('Logged in');
            if (status.githubCLI) {
                const userMatch = ghStatus.match(/Logged in to github\.com as ([^\s]+)/);
                if (userMatch) status.authenticatedUser = userMatch[1];
            }
        } catch {}
        
        // Check SSH key
        try {
            const sshKeyExists = await this.checkSSHKey();
            if (sshKeyExists) {
                const sshTest = await this.execCommand('ssh -T git@github.com', false);
                status.sshKey = sshTest.includes('successfully authenticated');
            }
        } catch {}
        
        // Check stored PAT
        try {
            const config = await this.loadConfig();
            if (config.encryptedPAT) {
                status.personalAccessToken = true;
            }
        } catch {}
        
        // Check git config
        try {
            const userName = await this.execCommand('git config --global user.name');
            const userEmail = await this.execCommand('git config --global user.email');
            status.gitConfig = !!(userName.trim() && userEmail.trim());
        } catch {}
        
        // Determine preferred method
        if (status.githubCLI) status.preferredMethod = 'cli';
        else if (status.sshKey) status.preferredMethod = 'ssh';
        else if (status.personalAccessToken) status.preferredMethod = 'pat';
        
        return status;
    }
    
    // === GITHUB CLI AUTHENTICATION ===
    
    async setupGitHubCLI() {
        console.log('🚀 Setting up GitHub CLI authentication...');
        
        // Check if gh is installed
        try {
            await this.execCommand('gh --version');
        } catch {
            throw new Error('GitHub CLI (gh) is not installed. Please install it first: https://cli.github.com');
        }
        
        // Interactive login
        return new Promise((resolve, reject) => {
            const ghAuth = spawn('gh', ['auth', 'login'], {
                stdio: 'inherit',
                shell: true
            });
            
            ghAuth.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ GitHub CLI authentication successful');
                    resolve(true);
                } else {
                    reject(new Error('GitHub CLI authentication failed'));
                }
            });
        });
    }
    
    // === SSH KEY MANAGEMENT ===
    
    async setupSSHKey() {
        console.log('🔑 Setting up SSH key authentication...');
        
        // Check if SSH key already exists
        const keyPath = path.join(this.sshDir, 'id_ed25519');
        const keyExists = await this.fileExists(keyPath);
        
        if (keyExists) {
            console.log('📁 SSH key already exists');
            const publicKey = await fs.readFile(keyPath + '.pub', 'utf8');
            return {
                exists: true,
                publicKey,
                path: keyPath
            };
        }
        
        // Generate new SSH key
        console.log('🔨 Generating new SSH key...');
        const email = await this.promptUser('Enter your GitHub email: ');
        
        await this.execCommand(`ssh-keygen -t ed25519 -C "${email}" -f ${keyPath} -N ""`);
        
        // Add to ssh-agent
        console.log('🔐 Adding key to ssh-agent...');
        await this.execCommand('eval "$(ssh-agent -s)"');
        await this.execCommand(`ssh-add ${keyPath}`);
        
        // Read public key
        const publicKey = await fs.readFile(keyPath + '.pub', 'utf8');
        
        console.log('\n📋 Copy this SSH public key to GitHub:');
        console.log('   https://github.com/settings/ssh/new\n');
        console.log(publicKey);
        
        return {
            exists: false,
            publicKey,
            path: keyPath
        };
    }
    
    async checkSSHKey() {
        const keyPaths = [
            path.join(this.sshDir, 'id_ed25519'),
            path.join(this.sshDir, 'id_rsa'),
            path.join(this.sshDir, 'id_ecdsa')
        ];
        
        for (const keyPath of keyPaths) {
            if (await this.fileExists(keyPath)) {
                return keyPath;
            }
        }
        
        return null;
    }
    
    // === PERSONAL ACCESS TOKEN ===
    
    async setupPAT(token) {
        console.log('🔐 Setting up Personal Access Token...');
        
        if (!token) {
            console.log('\n📋 Create a Personal Access Token:');
            console.log('   https://github.com/settings/tokens/new');
            console.log('   Scopes needed: repo, read:user\n');
            
            token = await this.promptUser('Enter your Personal Access Token: ');
        }
        
        // Validate token
        try {
            const validation = await this.validatePAT(token);
            console.log(`✅ Token validated for user: ${validation.login}`);
            
            // Encrypt and store token
            const encryptedToken = this.encrypt(token);
            const config = await this.loadConfig();
            config.encryptedPAT = encryptedToken;
            config.githubUser = validation.login;
            await this.saveConfig(config);
            
            // Configure git to use token
            await this.configureGitWithPAT(validation.login, token);
            
            return true;
            
        } catch (error) {
            throw new Error(`Invalid token: ${error.message}`);
        }
    }
    
    async validatePAT(token) {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Token validation failed');
        }
        
        return response.json();
    }
    
    async configureGitWithPAT(username, token) {
        // Set up git credential helper to use the token
        const credentialHelper = `
#!/bin/sh
echo "username=${username}"
echo "password=${token}"
`;
        
        const helperPath = path.join(this.vaultPath, 'git-credential-helper.sh');
        await fs.writeFile(helperPath, credentialHelper, { mode: 0o700 });
        
        // Configure git to use our credential helper
        await this.execCommand(`git config --global credential.helper "${helperPath}"`);
    }
    
    // === GIT CONFIGURATION ===
    
    async setupGitConfig() {
        console.log('📝 Setting up Git configuration...');
        
        let userName, userEmail;
        
        try {
            userName = await this.execCommand('git config --global user.name');
            userEmail = await this.execCommand('git config --global user.email');
        } catch {}
        
        if (!userName?.trim()) {
            userName = await this.promptUser('Enter your name for Git commits: ');
            await this.execCommand(`git config --global user.name "${userName}"`);
        }
        
        if (!userEmail?.trim()) {
            userEmail = await this.promptUser('Enter your email for Git commits: ');
            await this.execCommand(`git config --global user.email "${userEmail}"`);
        }
        
        console.log(`✅ Git configured: ${userName} <${userEmail}>`);
        
        return { userName, userEmail };
    }
    
    // === TERMINAL OPERATIONS ===
    
    async runInteractiveCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args, {
                stdio: 'inherit',
                shell: true
            });
            
            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Command failed with code ${code}`));
                }
            });
            
            proc.on('error', reject);
        });
    }
    
    async testGitHubConnection() {
        console.log('🧪 Testing GitHub connection...');
        
        const status = await this.checkAuthStatus();
        
        if (status.preferredMethod === 'cli') {
            try {
                const result = await this.execCommand('gh api user');
                const user = JSON.parse(result);
                console.log(`✅ Connected to GitHub as: ${user.login}`);
                return { success: true, method: 'cli', user: user.login };
            } catch (error) {
                console.error('❌ GitHub CLI test failed:', error.message);
            }
        }
        
        if (status.preferredMethod === 'ssh') {
            try {
                const result = await this.execCommand('ssh -T git@github.com', false);
                console.log('✅ SSH connection to GitHub successful');
                return { success: true, method: 'ssh' };
            } catch (error) {
                // SSH test returns exit code 1 even on success
                if (error.message.includes('successfully authenticated')) {
                    console.log('✅ SSH connection to GitHub successful');
                    return { success: true, method: 'ssh' };
                }
                console.error('❌ SSH test failed:', error.message);
            }
        }
        
        if (status.preferredMethod === 'pat') {
            try {
                const config = await this.loadConfig();
                const token = this.decrypt(config.encryptedPAT);
                const validation = await this.validatePAT(token);
                console.log(`✅ PAT authentication valid for: ${validation.login}`);
                return { success: true, method: 'pat', user: validation.login };
            } catch (error) {
                console.error('❌ PAT test failed:', error.message);
            }
        }
        
        return { success: false, error: 'No valid authentication method found' };
    }
    
    // === UTILITY METHODS ===
    
    async execCommand(command, throwOnError = true) {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');
            exec(command, (error, stdout, stderr) => {
                if (error && throwOnError) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(stdout || stderr);
                }
            });
        });
    }
    
    async promptUser(question) {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            readline.question(question, (answer) => {
                readline.close();
                resolve(answer);
            });
        });
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    // === CONFIGURATION MANAGEMENT ===
    
    async loadConfig() {
        try {
            await fs.mkdir(this.vaultPath, { recursive: true });
            const data = await fs.readFile(this.configPath, 'utf8');
            return JSON.parse(data);
        } catch {
            return {};
        }
    }
    
    async saveConfig(config) {
        await fs.mkdir(this.vaultPath, { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    
    // === ENCRYPTION ===
    
    getOrCreateEncryptionKey() {
        const keyPath = path.join(this.vaultPath, '.encryption-key');
        
        try {
            return fs.readFileSync(keyPath, 'utf8');
        } catch {
            const key = crypto.randomBytes(32).toString('hex');
            try {
                fs.mkdirSync(this.vaultPath, { recursive: true });
                fs.writeFileSync(keyPath, key, { mode: 0o600 });
            } catch (error) {
                console.warn('Could not persist encryption key:', error.message);
            }
            return key;
        }
    }
    
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            Buffer.from(this.encryptionKey, 'hex'),
            iv
        );
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }
    
    decrypt(encryptedText) {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            Buffer.from(this.encryptionKey, 'hex'),
            iv
        );
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
}

// === INTERACTIVE SETUP WIZARD ===

async function setupWizard() {
    const auth = new GitHubAuthTerminal();
    
    console.log('🚀 GitHub Authentication Setup Wizard');
    console.log('=====================================\n');
    
    // Check current status
    const status = await auth.checkAuthStatus();
    
    console.log('📊 Current Authentication Status:');
    console.log(`   GitHub CLI: ${status.githubCLI ? '✅' : '❌'}`);
    console.log(`   SSH Key: ${status.sshKey ? '✅' : '❌'}`);
    console.log(`   Personal Access Token: ${status.personalAccessToken ? '✅' : '❌'}`);
    console.log(`   Git Config: ${status.gitConfig ? '✅' : '❌'}`);
    
    if (status.authenticatedUser) {
        console.log(`   Authenticated as: ${status.authenticatedUser}`);
    }
    
    console.log('\n');
    
    // If already authenticated, offer to test connection
    if (status.preferredMethod) {
        const test = await auth.promptUser('Authentication detected. Test connection? (y/n): ');
        if (test.toLowerCase() === 'y') {
            await auth.testGitHubConnection();
        }
        return;
    }
    
    // Setup git config first
    if (!status.gitConfig) {
        await auth.setupGitConfig();
        console.log('');
    }
    
    // Choose authentication method
    console.log('Choose authentication method:');
    console.log('1. GitHub CLI (recommended)');
    console.log('2. SSH Key');
    console.log('3. Personal Access Token');
    console.log('4. Exit');
    
    const choice = await auth.promptUser('\nEnter choice (1-4): ');
    
    switch (choice) {
        case '1':
            await auth.setupGitHubCLI();
            break;
        
        case '2':
            await auth.setupSSHKey();
            console.log('\nAfter adding the key to GitHub, run this wizard again to test the connection.');
            break;
        
        case '3':
            await auth.setupPAT();
            break;
        
        case '4':
            console.log('👋 Exiting...');
            return;
        
        default:
            console.log('❌ Invalid choice');
            return;
    }
    
    // Test connection
    console.log('\n');
    const testNow = await auth.promptUser('Test GitHub connection now? (y/n): ');
    if (testNow.toLowerCase() === 'y') {
        await auth.testGitHubConnection();
    }
}

// Export for use in the main wrapper
module.exports = GitHubAuthTerminal;

// Run wizard if called directly
if (require.main === module) {
    setupWizard().catch(console.error);
}