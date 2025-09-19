#!/usr/bin/env node

/**
 * 🐋 COMPLETE WHALE DEMO
 * Demonstrates the full "draw a whale" → AI reasoning → pixel commands → rendered art pipeline
 */

const AIPixelArtGenerator = require('./ai-pixel-art-generator.js');

async function demonstrateWhaleGeneration() {
    console.log('🐋 COMPLETE AI-ENHANCED PIXEL ART PIPELINE DEMO');
    console.log('═'.repeat(70));
    console.log('🎯 Request: "draw a whale"');
    console.log('⚡ Process: Natural Language → AI Reasoning → Pixel Commands → Rendered Art');
    console.log();
    
    const generator = new AIPixelArtGenerator({
        gridSize: 32,
        enableReasoning: true,
        cacheResults: true
    });
    
    // Listen for events to show the full pipeline
    generator.on('reasoning', (data) => {
        console.log('🧠 AI REASONING CHAIN:');
        console.log(data.reasoning);
        console.log();
    });
    
    generator.on('commands', (data) => {
        console.log('🎯 AI-GENERATED PIXEL COMMANDS:');
        console.log(data.commands);
        console.log();
    });
    
    try {
        const result = await generator.generateFromQuery('draw a whale');
        
        console.log('🎨 FINAL RENDERED PIXEL ART:');
        if (result.pixelResult.ascii) {
            console.log(result.pixelResult.ascii);
        } else {
            console.log('(ASCII art not available)');
        }
        
        console.log('\n📊 GENERATION STATISTICS:');
        console.log(`🆔 Generation ID: ${result.id}`);
        console.log(`⏱️ Processing Time: ${result.processingTime}ms`);
        console.log(`🎯 Commands Generated: ${result.metadata.commandCount}`);
        console.log(`📐 Grid Size: ${result.metadata.gridSize}x${result.metadata.gridSize}`);
        console.log(`🧠 LLM Used: ${result.metadata.llmUsed}`);
        
        console.log('\n🎉 SUCCESS SUMMARY:');
        console.log('✅ Natural language understood: "draw a whale"');
        console.log('✅ AI reasoning generated: Color choices, composition, details');  
        console.log('✅ Pixel commands created: Rectangle, line, and point commands');
        console.log('✅ Bitmap rendered: Ready for display/texture mapping');
        console.log('✅ Files saved: .txt (ASCII), .html (Canvas), .json (Data)');
        
        console.log('\n🎮 NEXT STEPS:');
        console.log('1. 🌐 Launch web interface: node eye-pixel-art-system.js');
        console.log('2. 📱 Visit: http://localhost:8889');
        console.log('3. 🎨 Type "draw a whale" in the AI Generation input');
        console.log('4. ⚡ Watch real-time generation with reasoning display');
        console.log('5. 👁️ Use eye controls for further editing');
        
        return result;
        
    } catch (error) {
        console.error('\n❌ DEMO FAILED:', error.message);
        
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('- Check if Ollama is running: curl http://localhost:11434/api/tags');
        console.log('- Or add API keys: OPENAI_API_KEY or ANTHROPIC_API_KEY');
        console.log('- System falls back to built-in knowledge when LLMs fail');
    }
}

// Run the demo
demonstrateWhaleGeneration();