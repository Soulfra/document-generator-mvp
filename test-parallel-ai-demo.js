#!/usr/bin/env node

/**
 * 🚀 PARALLEL AI PROCESSING DEMO
 * Test the new parallel LLM capabilities with multiple models simultaneously
 */

const AIPixelArtGenerator = require('./ai-pixel-art-generator.js');

async function testParallelGeneration() {
    console.log('🚀 PARALLEL AI PIXEL ART GENERATION TEST');
    console.log('═'.repeat(70));
    console.log('🎯 Testing: "draw a castle" with parallel processing');
    console.log('⚡ Models: Ollama + OpenAI + Anthropic (if configured)');
    console.log();
    
    const generator = new AIPixelArtGenerator({
        gridSize: 32,
        enableReasoning: true,
        cacheResults: false // Force fresh generation
    });
    
    // Listen for detailed events
    generator.on('reasoning', (data) => {
        console.log('🧠 REASONING PHASE:');
        if (data.reasoningMetadata) {
            console.log(`📊 Services used: ${data.reasoningMetadata.totalServices}`);
            console.log(`✅ Successful: ${data.reasoningMetadata.successfulServices}`);
            console.log(`🏆 Fastest: ${data.reasoningMetadata.fastestService}`);
            console.log(`💰 Cost: $${data.reasoningMetadata.totalCost.toFixed(4)}`);
        }
        console.log('💭 Best reasoning:', data.reasoning.substring(0, 200) + '...');
        console.log();
    });
    
    generator.on('commands', (data) => {
        console.log('🎯 COMMAND GENERATION PHASE:');
        if (data.commandMetadata) {
            console.log(`📊 Services used: ${data.commandMetadata.totalServices}`);
            console.log(`✅ Successful: ${data.commandMetadata.successfulServices}`);
            console.log(`🏆 Fastest: ${data.commandMetadata.fastestService}`);
            console.log(`💰 Cost: $${data.commandMetadata.totalCost.toFixed(4)}`);
        }
        console.log('🔧 Generated commands:');
        console.log(data.commands);
        console.log();
    });
    
    try {
        console.log('🎬 Starting parallel generation...');
        const startTime = Date.now();
        
        const result = await generator.generateFromQuery('draw a castle', {
            parallel: true,
            style: 'medieval'
        });
        
        const totalTime = Date.now() - startTime;
        console.log('🎉 PARALLEL GENERATION RESULTS:');
        console.log('═'.repeat(50));
        console.log(`🆔 Generation ID: ${result.id}`);
        console.log(`⏱️ Total Time: ${totalTime}ms`);
        console.log(`💰 Total Cost: $${result.metadata.totalCost.toFixed(4)}`);
        console.log(`🎯 Commands Generated: ${result.metadata.commandCount}`);
        
        if (result.parallelResults) {
            console.log('\n🔬 DETAILED PARALLEL RESULTS:');
            
            if (result.parallelResults.reasoning) {
                console.log('\n🧠 Reasoning Results:');
                result.parallelResults.reasoning.forEach((r, i) => {
                    const status = r.success ? '✅' : '❌';
                    const time = r.responseTime || 0;
                    console.log(`  ${status} ${r.service}: ${time}ms`);
                });
            }
            
            if (result.parallelResults.commands) {
                console.log('\n🎯 Command Results:');
                result.parallelResults.commands.forEach((r, i) => {
                    const status = r.success ? '✅' : '❌';
                    const time = r.responseTime || 0;
                    console.log(`  ${status} ${r.service}: ${time}ms`);
                });
            }
        }
        
        if (result.pixelResult.ascii) {
            console.log('\n🏰 FINAL CASTLE PIXEL ART:');
            console.log(result.pixelResult.ascii);
        }
        
        console.log('\n📊 PERFORMANCE COMPARISON:');
        console.log('Normal mode: Would use single fastest LLM');
        console.log('Parallel mode: Uses all available LLMs simultaneously');
        console.log('Benefit: Better quality through model comparison');
        console.log('Cost: Higher due to multiple API calls');
        
        return result;
        
    } catch (error) {
        console.error('\n❌ PARALLEL GENERATION FAILED:', error.message);
        
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('- Ensure API keys are set: OPENAI_API_KEY, ANTHROPIC_API_KEY');
        console.log('- Check Ollama is running: curl http://localhost:11434/api/tags');
        console.log('- Verify network connection for cloud APIs');
        console.log('- System will fall back to available services automatically');
    }
}

// Run the demo
testParallelGeneration();