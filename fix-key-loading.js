#!/usr/bin/env node

/**
 * 🔧 FIX KEY LOADING - Direct loader from .env.template
 * 
 * This script:
 * 1. Loads hidden API keys directly from .env.template
 * 2. Injects them into process.env
 * 3. Tests API connectivity
 * 4. Shows which keys are working
 * 
 * Use this to bypass broken vault encryption and test your hidden keys
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

async function loadHiddenKeys() {
    console.log('🔧 Fix Key Loading - Bypassing Vault System\n');
    
    // Load .env.template
    const envTemplatePath = path.join(__dirname, '.env.template');
    console.log(`📄 Loading hidden keys from: ${envTemplatePath}`);
    
    try {
        const envContent = await fs.readFile(envTemplatePath, 'utf-8');
        const lines = envContent.split('\n');
        
        const keys = {
            anthropic: null,
            openai: null,
            deepseek: null,
            gemini: null,
            perplexity: null,
            kimi: null
        };
        
        // Parse keys from .env.template
        for (const line of lines) {
            if (line.includes('ANTHROPIC_API_KEY=')) {
                keys.anthropic = line.split('=')[1].trim();
            } else if (line.includes('OPENAI_API_KEY=')) {
                keys.openai = line.split('=')[1].trim();
            } else if (line.includes('DEEPSEEK_API_KEY=')) {
                keys.deepseek = line.split('=')[1].trim();
            } else if (line.includes('GEMINI_API_KEY=')) {
                keys.gemini = line.split('=')[1].trim();
            } else if (line.includes('PERPLEXITY_API_KEY=')) {
                keys.perplexity = line.split('=')[1].trim();
            } else if (line.includes('KIMI_API_KEY=')) {
                keys.kimi = line.split('=')[1].trim();
            }
        }
        
        console.log('\n🔑 Found Keys:');
        console.log('============');
        
        let validKeys = 0;
        for (const [service, key] of Object.entries(keys)) {
            if (key && key.length > 10 && !key.includes('your_')) {
                console.log(`✅ ${service}: ${key.substring(0, 20)}...`);
                // Inject into process.env
                process.env[`${service.toUpperCase()}_API_KEY`] = key;
                validKeys++;
            } else {
                console.log(`❌ ${service}: Not configured`);
            }
        }
        
        console.log(`\n📊 Summary: ${validKeys} valid keys loaded`);
        
        return keys;
        
    } catch (error) {
        console.error('❌ Failed to load .env.template:', error.message);
        throw error;
    }
}

async function testAPIKey(service, key) {
    if (!key || key.length < 10 || key.includes('your_')) {
        return { success: false, error: 'Invalid or placeholder key' };
    }
    
    console.log(`\n🧪 Testing ${service} API...`);
    
    try {
        switch (service) {
            case 'anthropic':
                return await testAnthropic(key);
            case 'openai':
                return await testOpenAI(key);
            case 'deepseek':
                return await testDeepSeek(key);
            default:
                return { success: false, error: 'Test not implemented' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testAnthropic(apiKey) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            model: 'claude-3-haiku-20240307',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10
        });
        
        const options = {
            hostname: 'api.anthropic.com',
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({ success: true, response: 'API key valid!' });
                } else {
                    const error = JSON.parse(responseData);
                    resolve({ success: false, error: error.error?.message || responseData });
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });
        
        req.write(data);
        req.end();
    });
}

async function testOpenAI(apiKey) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10
        });
        
        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({ success: true, response: 'API key valid!' });
                } else {
                    try {
                        const error = JSON.parse(responseData);
                        resolve({ success: false, error: error.error?.message || responseData });
                    } catch {
                        resolve({ success: false, error: responseData });
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });
        
        req.write(data);
        req.end();
    });
}

async function testDeepSeek(apiKey) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10
        });
        
        const options = {
            hostname: 'api.deepseek.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({ success: true, response: 'API key valid!' });
                } else {
                    try {
                        const error = JSON.parse(responseData);
                        resolve({ success: false, error: error.error?.message || responseData });
                    } catch {
                        resolve({ success: false, error: responseData });
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });
        
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('=' .repeat(60));
    console.log('🔧 FIX KEY LOADING SYSTEM');
    console.log('=' .repeat(60));
    
    try {
        // Step 1: Load hidden keys
        const keys = await loadHiddenKeys();
        
        // Step 2: Test each key
        console.log('\n🧪 Testing API Connectivity:');
        console.log('=' .repeat(60));
        
        const results = [];
        for (const [service, key] of Object.entries(keys)) {
            const result = await testAPIKey(service, key);
            results.push({ service, ...result });
            
            if (result.success) {
                console.log(`✅ ${service}: Working!`);
            } else {
                console.log(`❌ ${service}: ${result.error}`);
            }
        }
        
        // Step 3: Summary
        console.log('\n📊 Final Report:');
        console.log('=' .repeat(60));
        
        const working = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`✅ Working APIs: ${working}`);
        console.log(`❌ Failed APIs: ${failed}`);
        
        if (working > 0) {
            console.log('\n🎉 Keys are loaded into process.env and ready to use!');
            console.log('💡 You can now run any script and it will use these keys.');
            
            // Test with gas tank system
            console.log('\n🧪 Testing Gas Tank System...');
            try {
                const GasTankKeyManager = require('./gas-tank-key-manager.js');
                const gasTank = new GasTankKeyManager({
                    enableFallbackKeys: true,
                    enableTransparentFallback: true
                });
                
                await gasTank.initialize();
                console.log('✅ Gas Tank System initialized successfully!');
                
                // Get a key through gas tank
                const testKey = await gasTank.getAPIKey('anthropic', 'test');
                console.log(`⛽ Gas tank provided ${testKey.source} key for Anthropic`);
                
            } catch (error) {
                console.log('⚠️  Gas Tank System not available:', error.message);
            }
        } else {
            console.log('\n⚠️  No working API keys found!');
            console.log('💡 Check .env.template for valid keys');
        }
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

// Export for use in other scripts
module.exports = { loadHiddenKeys };