#!/usr/bin/env node

/**
 * SPRITE API KEYS SETUP SCRIPT
 * 
 * Quick script to help configure API keys for the enhanced sprite generation system.
 * This will search for existing API keys and help you configure the .env file.
 */

const fs = require('fs').promises;
const path = require('path');

async function findExistingKeys() {
    console.log('🔍 Searching for existing API keys in the system...\n');
    
    const foundKeys = {};
    const searchLocations = [
        './FinishThisIdea/.env',
        './WORKING-MINIMAL-SYSTEM/.env', 
        './proptech-vc-demo/backend/.env',
        './ObsidianVault/99-Uncategorized/.env'
    ];
    
    for (const location of searchLocations) {
        try {
            console.log(`📁 Checking ${location}...`);
            const content = await fs.readFile(location, 'utf8');
            const lines = content.split('\n');
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.includes('API_KEY=') || trimmed.includes('API_TOKEN=')) {
                    if (!trimmed.includes('your_') && !trimmed.includes('your-') && !trimmed.includes('=sk-your')) {
                        const [key, value] = trimmed.split('=');
                        if (value && value.length > 20 && !value.includes('example') && !value.includes('here')) {
                            console.log(`  ✅ Found real key: ${key}`);
                            foundKeys[key] = value;
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`  ❌ Could not read ${location}`);
        }
    }
    
    return foundKeys;
}

async function checkCapsuleKeys() {
    console.log('\n🔮 Checking for encrypted capsule keys...');
    
    const capsuleFiles = [
        'identity-capsule.soulfra',
        'memory-capsule.soulfra', 
        'interaction-capsule.soulfra',
        'projection-capsule.soulfra'
    ];
    
    for (const capsule of capsuleFiles) {
        try {
            const content = await fs.readFile(capsule, 'utf8');
            const data = JSON.parse(content);
            console.log(`  🔐 Found encrypted capsule: ${capsule} (${data.type})`);
        } catch (error) {
            // Capsule doesn't exist or can't be read
        }
    }
    
    console.log('  ⚠️  Note: Capsules appear to be encrypted. If they contain API keys,');
    console.log('     you may need to decrypt them manually or provide keys directly.');
}

async function updateEnvFile(keys) {
    console.log('\n📝 Updating .env file with API key configuration...');
    
    try {
        let envContent = await fs.readFile('.env', 'utf8');
        let updated = false;
        
        // Map found keys to required environment variables
        const keyMappings = {
            'OPENAI_API_KEY': keys.OPENAI_API_KEY,
            'ANTHROPIC_API_KEY': keys.ANTHROPIC_API_KEY,
            'REPLICATE_API_TOKEN': keys.REPLICATE_API_TOKEN,
            'GOOGLE_API_KEY': keys.GOOGLE_API_KEY,
            'GOOGLE_CUSTOM_SEARCH_ID': keys.GOOGLE_CUSTOM_SEARCH_ID
        };
        
        for (const [envKey, foundValue] of Object.entries(keyMappings)) {
            if (foundValue) {
                // Replace placeholder with real value
                const placeholder = `${envKey}=your-${envKey.toLowerCase().replace(/_/g, '-')}-here`;
                if (envContent.includes(placeholder)) {
                    envContent = envContent.replace(placeholder, `${envKey}=${foundValue}`);
                    console.log(`  ✅ Updated ${envKey}`);
                    updated = true;
                }
            }
        }
        
        if (updated) {
            await fs.writeFile('.env', envContent);
            console.log('\n✅ .env file updated with found API keys!');
        } else {
            console.log('\n⚠️  No API keys found to update. You may need to add them manually.');
        }
        
    } catch (error) {
        console.error('❌ Error updating .env file:', error.message);
    }
}

async function showNextSteps() {
    console.log('\n🚀 Next Steps to Enable Sprite Generation:');
    console.log('==========================================');
    console.log('');
    console.log('1. 📋 Check your .env file for placeholder API keys:');
    console.log('   - REPLICATE_API_TOKEN=your-replicate-api-token-here');
    console.log('   - GOOGLE_API_KEY=your-google-api-key-here');
    console.log('   - ANTHROPIC_API_KEY=your-anthropic-api-key-here');
    console.log('   - OPENAI_API_KEY=your-openai-api-key-here');
    console.log('');
    console.log('2. 🔑 Replace placeholders with your actual API keys');
    console.log('');
    console.log('3. 🧪 Test the sprite generation system:');
    console.log('   node test-enhanced-sprite-system.js');
    console.log('');
    console.log('4. 🎭 Enable AI integration in the grim reaper husky:');
    console.log('   Edit grim-reaper-husky-mascot.js line ~939:');
    console.log('   Change: enabled: false  →  enabled: true');
    console.log('');
    console.log('🎯 Once configured, the sprite system will generate actual');
    console.log('   AI sprites instead of emoji representations!');
}

async function main() {
    console.log('🐺💀✨ Enhanced Sprite Generation - API Key Setup');
    console.log('================================================\n');
    
    try {
        // Search for existing keys
        const foundKeys = await findExistingKeys();
        
        // Check encrypted capsules
        await checkCapsuleKeys();
        
        // Update .env file if we found keys
        if (Object.keys(foundKeys).length > 0) {
            await updateEnvFile(foundKeys);
        }
        
        // Show what to do next
        await showNextSteps();
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { findExistingKeys, updateEnvFile };