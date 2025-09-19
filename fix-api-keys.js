#!/usr/bin/env node
/**
 * Fix API Keys - Replace Placeholder Keys with Real Ones
 * 
 * Simple script to set up your real API keys once and for all
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class APIKeyFixer {
    constructor() {
        this.keysFile = '.real-api-keys.json';
        this.envFile = '.env';
        
        console.log('🔑 API KEY FIXER - NO MORE PLACEHOLDERS');
        console.log('======================================');
        console.log('');
    }
    
    async fixKeys() {
        console.log('Setting up your real API keys...\n');
        
        const keys = await this.collectKeys();
        this.saveKeys(keys);
        this.updateEnvFile(keys);
        this.updateVaultKeys(keys);
        
        console.log('\n✅ ALL API KEYS FIXED!');
        console.log('Your system is now ready to use real AI services.');
    }
    
    async collectKeys() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const ask = (question) => new Promise(resolve => {
            rl.question(question, resolve);
        });
        
        console.log('Enter your API keys (press Enter to skip):');
        console.log('');
        
        const keys = {};
        
        // Anthropic (Claude)
        console.log('🤖 Anthropic Claude API Key:');
        console.log('   Get from: https://console.anthropic.com/');
        keys.anthropic = await ask('   Key (starts with sk-ant-): ');
        
        // OpenAI
        console.log('\n🧠 OpenAI API Key:');
        console.log('   Get from: https://platform.openai.com/api-keys');
        keys.openai = await ask('   Key (starts with sk-): ');
        
        // GitHub (for automation)
        console.log('\n🐙 GitHub Personal Access Token:');
        console.log('   Get from: https://github.com/settings/tokens');
        keys.github = await ask('   Token (starts with ghp_ or github_pat_): ');
        
        // Stripe (you have the integration)
        console.log('\n💳 Stripe Secret Key (optional):');
        console.log('   Get from: https://dashboard.stripe.com/apikeys');
        keys.stripe = await ask('   Key (starts with sk_live_ or sk_test_): ');
        
        rl.close();
        
        // Filter out empty keys
        Object.keys(keys).forEach(key => {
            if (!keys[key] || keys[key].trim() === '') {
                delete keys[key];
            } else {
                keys[key] = keys[key].trim();
            }
        });
        
        return keys;
    }
    
    saveKeys(keys) {
        console.log('\n💾 Saving keys securely...');
        
        // Save to local file
        fs.writeFileSync(this.keysFile, JSON.stringify(keys, null, 2));
        console.log(`✅ Keys saved to ${this.keysFile}`);
        
        // Update gitignore to protect keys
        this.updateGitignore();
    }
    
    updateEnvFile(keys) {
        console.log('📝 Updating .env file...');
        
        let envContent = '';
        if (fs.existsSync(this.envFile)) {
            envContent = fs.readFileSync(this.envFile, 'utf8');
        }
        
        // Update or add keys
        const updates = {
            'ANTHROPIC_API_KEY': keys.anthropic,
            'OPENAI_API_KEY': keys.openai,
            'GITHUB_TOKEN': keys.github,
            'STRIPE_SECRET_KEY': keys.stripe
        };
        
        Object.entries(updates).forEach(([envVar, value]) => {
            if (value) {
                if (envContent.includes(`${envVar}=`)) {
                    // Replace existing
                    envContent = envContent.replace(
                        new RegExp(`${envVar}=.*`),
                        `${envVar}=${value}`
                    );
                } else {
                    // Add new
                    envContent += `\n${envVar}=${value}`;
                }
            }
        });
        
        fs.writeFileSync(this.envFile, envContent);
        console.log('✅ .env file updated');
    }
    
    updateVaultKeys(keys) {
        console.log('🔐 Updating vault keys...');
        
        const vaultDir = '.vault/api-keys';
        if (!fs.existsSync(vaultDir)) {
            fs.mkdirSync(vaultDir, { recursive: true });
        }
        
        // Save keys in vault format
        Object.entries(keys).forEach(([service, key]) => {
            if (key) {
                const vaultFile = path.join(vaultDir, `${service}_key.json`);
                const vaultData = {
                    service,
                    key,
                    created: new Date().toISOString(),
                    status: 'active'
                };
                
                fs.writeFileSync(vaultFile, JSON.stringify(vaultData, null, 2));
                console.log(`✅ Vault updated: ${service}`);
            }
        });
    }
    
    updateGitignore() {
        const gitignoreFile = '.gitignore';
        let gitignoreContent = '';
        
        if (fs.existsSync(gitignoreFile)) {
            gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8');
        }
        
        const protectedFiles = [
            '.real-api-keys.json',
            '.auth-tokens.json',
            '.github-token',
            '.cookies.json',
            '.vault/api-keys/*.json'
        ];
        
        protectedFiles.forEach(file => {
            if (!gitignoreContent.includes(file)) {
                gitignoreContent += `\n${file}`;
            }
        });
        
        fs.writeFileSync(gitignoreFile, gitignoreContent);
        console.log('✅ .gitignore updated to protect keys');
    }
    
    testKeys() {
        console.log('\n🧪 TESTING API KEYS');
        console.log('===================');
        
        const keys = this.loadKeys();
        
        if (keys.anthropic) {
            this.testAnthropic(keys.anthropic);
        }
        
        if (keys.openai) {
            this.testOpenAI(keys.openai);
        }
        
        if (keys.github) {
            this.testGitHub(keys.github);
        }
    }
    
    async testAnthropic(key) {
        console.log('🤖 Testing Anthropic API...');
        
        const https = require('https');
        const data = JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
        });
        
        const options = {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Anthropic API working');
            } else {
                console.log(`❌ Anthropic API failed: ${res.statusCode}`);
            }
        });
        
        req.on('error', () => {
            console.log('❌ Anthropic API connection failed');
        });
        
        req.write(data);
        req.end();
    }
    
    async testOpenAI(key) {
        console.log('🧠 Testing OpenAI API...');
        
        const https = require('https');
        const data = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
        });
        
        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ OpenAI API working');
            } else {
                console.log(`❌ OpenAI API failed: ${res.statusCode}`);
            }
        });
        
        req.on('error', () => {
            console.log('❌ OpenAI API connection failed');
        });
        
        req.write(data);
        req.end();
    }
    
    async testGitHub(token) {
        console.log('🐙 Testing GitHub API...');
        
        const https = require('https');
        const options = {
            hostname: 'api.github.com',
            path: '/user',
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'Document-Generator'
            }
        };
        
        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ GitHub API working');
            } else {
                console.log(`❌ GitHub API failed: ${res.statusCode}`);
            }
        });
        
        req.on('error', () => {
            console.log('❌ GitHub API connection failed');
        });
        
        req.end();
    }
    
    loadKeys() {
        if (fs.existsSync(this.keysFile)) {
            return JSON.parse(fs.readFileSync(this.keysFile, 'utf8'));
        }
        return {};
    }
    
    showStatus() {
        console.log('📊 API KEY STATUS');
        console.log('=================');
        
        const keys = this.loadKeys();
        const services = ['anthropic', 'openai', 'github', 'stripe'];
        
        services.forEach(service => {
            const status = keys[service] ? '✅ Configured' : '❌ Missing';
            console.log(`${service.padEnd(10)}: ${status}`);
        });
        
        if (Object.keys(keys).length === 0) {
            console.log('\nNo API keys configured. Run with "setup" to add them.');
        }
    }
}

// CLI usage
async function main() {
    const fixer = new APIKeyFixer();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'status';
    
    switch (command) {
        case 'setup':
            await fixer.fixKeys();
            break;
            
        case 'test':
            fixer.testKeys();
            break;
            
        case 'status':
            fixer.showStatus();
            break;
            
        default:
            console.log('Usage:');
            console.log('  node fix-api-keys.js setup   # Set up your API keys');
            console.log('  node fix-api-keys.js test    # Test your API keys');
            console.log('  node fix-api-keys.js status  # Show key status');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = APIKeyFixer;