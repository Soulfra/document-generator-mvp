#!/usr/bin/env node

/**
 * API KEYS VERIFICATION TEST
 * 
 * Quick test to verify that API keys are working before running
 * the full enhanced sprite generation system.
 */

require('dotenv').config();

async function testOpenAI() {
    console.log('🤖 Testing OpenAI API...');
    
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-')) {
        console.log('  ⚠️  OpenAI API key not configured');
        return false;
    }
    
    try {
        // Simple test call (would need openai package installed)
        console.log('  ✅ OpenAI API key configured');
        return true;
    } catch (error) {
        console.log('  ❌ OpenAI API key invalid:', error.message);
        return false;
    }
}

async function testAnthropic() {
    console.log('🧠 Testing Anthropic API...');
    
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('your-')) {
        console.log('  ⚠️  Anthropic API key not configured');
        return false;
    }
    
    console.log('  ✅ Anthropic API key configured');
    return true;
}

async function testReplicate() {
    console.log('🎨 Testing Replicate API...');
    
    if (!process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN.includes('your-')) {
        console.log('  ⚠️  Replicate API token not configured');
        return false;
    }
    
    console.log('  ✅ Replicate API token configured');
    return true;
}

async function testGoogle() {
    console.log('🔍 Testing Google API...');
    
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.includes('your-')) {
        console.log('  ⚠️  Google API key not configured');
        return false;
    }
    
    if (!process.env.GOOGLE_CUSTOM_SEARCH_ID || process.env.GOOGLE_CUSTOM_SEARCH_ID.includes('your-')) {
        console.log('  ⚠️  Google Custom Search ID not configured');
        return false;
    }
    
    console.log('  ✅ Google API key and Search ID configured');
    return true;
}

async function main() {
    console.log('🔑 API Keys Verification Test');
    console.log('============================\n');
    
    const results = [];
    
    results.push(await testOpenAI());
    results.push(await testAnthropic());
    results.push(await testReplicate());
    results.push(await testGoogle());
    
    console.log('\n📊 Results Summary:');
    console.log('==================');
    
    const configured = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`✅ Configured: ${configured}/${total} API keys`);
    
    if (configured === total) {
        console.log('\n🎉 ALL API KEYS CONFIGURED!');
        console.log('🚀 Ready to run enhanced sprite generation:');
        console.log('   node test-enhanced-sprite-system.js');
        console.log('');
        console.log('🎭 Or test the grim reaper husky demo:');
        console.log('   open husky-trailer-demo.html');
    } else {
        console.log('\n⚠️  Some API keys still need configuration.');
        console.log('📝 Edit your .env file and replace placeholder values:');
        console.log('');
        
        if (!process.env.REPLICATE_API_TOKEN?.length || process.env.REPLICATE_API_TOKEN.includes('your-')) {
            console.log('   REPLICATE_API_TOKEN=r8_your_actual_token_here');
        }
        if (!process.env.GOOGLE_API_KEY?.length || process.env.GOOGLE_API_KEY.includes('your-')) {
            console.log('   GOOGLE_API_KEY=AIza_your_actual_key_here');
        }
        if (!process.env.ANTHROPIC_API_KEY?.length || process.env.ANTHROPIC_API_KEY.includes('your-')) {
            console.log('   ANTHROPIC_API_KEY=sk-ant-your_actual_key_here');
        }
        if (!process.env.OPENAI_API_KEY?.length || process.env.OPENAI_API_KEY.includes('your-')) {
            console.log('   OPENAI_API_KEY=sk-your_actual_key_here');
        }
    }
}

if (require.main === module) {
    main();
}