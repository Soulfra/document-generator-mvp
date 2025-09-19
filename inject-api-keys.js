#!/usr/bin/env node

/**
 * API KEY INJECTOR
 * Finds API keys from various sources and injects them into .env
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Key sources to check
const keySources = {
    vault: '.vault/keys/',
    env: process.env,
    home: process.env.HOME,
    config: './guardian-config.json'
};

// Known key patterns
const keyPatterns = {
    openai: /sk-[a-zA-Z0-9]{48}/,
    anthropic: /sk-ant-[a-zA-Z0-9]{48}/,
    deepseek: /sk-[a-zA-Z0-9]{32,}/,
    stripe: /sk_(test|live)_[a-zA-Z0-9]{24,}/
};

async function findKeys() {
    console.log('🔍 Searching for API keys...\n');
    const foundKeys = {};
    
    // Check environment variables
    console.log('📋 Checking environment variables...');
    for (const [name, value] of Object.entries(process.env)) {
        if (name.includes('API_KEY') || name.includes('SECRET')) {
            if (value && value.length > 10) {
                console.log(`  ✓ Found ${name}`);
                foundKeys[name] = value;
            }
        }
    }
    
    // Check vault for encrypted keys
    console.log('\n🔐 Checking vault...');
    try {
        const vaultFiles = await fs.readdir(keySources.vault);
        const encryptedKeys = vaultFiles.filter(f => f.endsWith('.enc'));
        
        for (const file of encryptedKeys) {
            console.log(`  📦 Found encrypted: ${file}`);
            
            // Check if it's a known API key type
            if (file.includes('stripe')) {
                foundKeys.STRIPE_ENCRYPTED = path.join(keySources.vault, file);
            }
        }
    } catch (error) {
        console.log('  ⚠️ Vault not accessible');
    }
    
    // Check for existing .env.example patterns
    console.log('\n📄 Checking .env.example...');
    try {
        const envExample = await fs.readFile('.env.example', 'utf8');
        const lines = envExample.split('\n');
        
        for (const line of lines) {
            if (line.includes('_KEY=') && !line.includes('your_')) {
                const [key, value] = line.split('=');
                if (value && value.length > 10) {
                    console.log(`  ✓ Found example: ${key}`);
                    foundKeys[key] = value;
                }
            }
        }
    } catch (error) {
        console.log('  ⚠️ No .env.example found');
    }
    
    return foundKeys;
}

async function promptForKeys(foundKeys) {
    console.log('\n🔑 API Key Configuration\n');
    
    const requiredKeys = [
        { name: 'OPENAI_API_KEY', prompt: 'OpenAI API Key (sk-...): ', pattern: keyPatterns.openai },
        { name: 'ANTHROPIC_API_KEY', prompt: 'Anthropic API Key (sk-ant-...): ', pattern: keyPatterns.anthropic },
        { name: 'DEEPSEEK_API_KEY', prompt: 'DeepSeek API Key (optional): ', pattern: keyPatterns.deepseek, optional: true },
        { name: 'STRIPE_SECRET_KEY', prompt: 'Stripe Secret Key (optional): ', pattern: keyPatterns.stripe, optional: true }
    ];
    
    const configuredKeys = {};
    
    for (const keyConfig of requiredKeys) {
        const existing = foundKeys[keyConfig.name];
        
        if (existing) {
            console.log(`✓ ${keyConfig.name} already configured`);
            configuredKeys[keyConfig.name] = existing;
        } else {
            const value = await new Promise(resolve => {
                rl.question(keyConfig.prompt, resolve);
            });
            
            if (value) {
                if (keyConfig.pattern && !keyConfig.pattern.test(value)) {
                    console.log(`  ⚠️ Warning: Key format doesn't match expected pattern`);
                }
                configuredKeys[keyConfig.name] = value;
            } else if (!keyConfig.optional) {
                console.log(`  ⚠️ Skipping ${keyConfig.name} - will use demo mode`);
            }
        }
    }
    
    return configuredKeys;
}

async function updateEnvFile(keys) {
    console.log('\n📝 Updating .env file...');
    
    let envContent = '';
    
    // Try to read existing .env
    try {
        envContent = await fs.readFile('.env', 'utf8');
    } catch {
        // Use template if no .env exists
        try {
            envContent = await fs.readFile('.env.example', 'utf8');
        } catch {
            envContent = '';
        }
    }
    
    // Update or add keys
    for (const [key, value] of Object.entries(keys)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        
        if (regex.test(envContent)) {
            // Update existing key
            envContent = envContent.replace(regex, `${key}=${value}`);
            console.log(`  ✓ Updated ${key}`);
        } else {
            // Add new key
            envContent += `\n${key}=${value}`;
            console.log(`  ✓ Added ${key}`);
        }
    }
    
    // Ensure DEMO_MODE is set appropriately
    const hasRealKeys = keys.OPENAI_API_KEY || keys.ANTHROPIC_API_KEY;
    const demoMode = !hasRealKeys;
    
    if (envContent.includes('DEMO_MODE=')) {
        envContent = envContent.replace(/^DEMO_MODE=.*$/m, `DEMO_MODE=${demoMode}`);
    } else {
        envContent += `\nDEMO_MODE=${demoMode}`;
    }
    
    // Save updated .env
    await fs.writeFile('.env', envContent);
    console.log('\n✅ .env file updated successfully!');
    
    if (demoMode) {
        console.log('\n📋 Running in DEMO MODE (no API keys configured)');
        console.log('   Services will use fallback AI responses');
    } else {
        console.log('\n🚀 API keys configured - full functionality enabled!');
    }
}

async function main() {
    console.log('🔧 API Key Injection Tool');
    console.log('========================\n');
    
    try {
        // Find existing keys
        const foundKeys = await findKeys();
        
        // Prompt for missing keys
        const configuredKeys = await promptForKeys(foundKeys);
        
        // Update .env file
        await updateEnvFile(configuredKeys);
        
        console.log('\n🎉 Configuration complete!');
        console.log('\nNext steps:');
        console.log('  1. Run: ./quick-setup.sh');
        console.log('  2. Open: http://localhost:8080/launcher.html');
        console.log('  3. Start building!');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { findKeys, updateEnvFile };