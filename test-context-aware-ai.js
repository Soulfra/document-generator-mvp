#!/usr/bin/env node
/**
 * TEST CONTEXT-AWARE AI PROCESSING
 * Sends actual codebase content to AI for analysis and improvement
 */

const axios = require('axios');
const fs = require('fs');

async function testContextAwareProcessing() {
    console.log('=== CONTEXT-AWARE AI PROCESSING TEST ===\n');
    
    try {
        // Read actual template processor code
        const templateProcessorCode = fs.readFileSync('./services/template-processor.js', 'utf8');
        
        // Create a comprehensive prompt with actual code
        const contextualPrompt = `
I have a Document Generator system with actual code. Here's my current template-processor.js:

${templateProcessorCode}

This processor currently returns basic hardcoded responses like {"type":"web-app","files":["index.html","style.css","script.js"]}. 

I also have these sophisticated systems already built:
- Empire Bridge (port 3333) that discovered 105,000+ files
- Character agents (Cal, Arty, Ralph) with reasoning systems
- 7 AI subagents (DocAgent, TradeAgent, BattleAgent, etc.)
- Unified API Gateway (port 8890)
- CAL Compare system (you are part of it)

How do I modify this template processor to actually use my existing empire systems and AI agents to generate real, sophisticated MVPs instead of hardcoded responses?

Please provide actual code modifications that:
1. Connect to the Empire Bridge to discover available templates
2. Use the character agents for different aspects of MVP generation
3. Integrate with the existing AI subagents
4. Return detailed, AI-generated MVPs with actual file contents
        `;
        
        console.log('🤖 Asking AI to analyze actual codebase and provide improvements...\n');
        
        const response = await axios.post('http://localhost:3001/api/cal-compare/consult', {
            question: contextualPrompt,
            expertType: 'technical-architecture'
        }, { timeout: 30000 });
        
        console.log('✅ AI ANALYSIS COMPLETE!\n');
        console.log('📊 Response Details:');
        console.log('   Provider:', response.data.consultation.provider);
        console.log('   Cost: $' + response.data.consultation.cost);
        console.log('   Confidence:', response.data.consultation.confidence);
        console.log('   Experts:', response.data.consultation.experts.join(', '));
        console.log('\n🔧 AI RECOMMENDATIONS:');
        console.log('=' * 60);
        console.log(response.data.consultation.response);
        
        // Save the response for later implementation
        fs.writeFileSync('./ai-improvement-recommendations.md', `# AI Improvement Recommendations

## Context
${contextualPrompt}

## AI Response
${response.data.consultation.response}

Generated: ${new Date().toISOString()}
Provider: ${response.data.consultation.provider}
Cost: $${response.data.consultation.cost}
`);
        
        console.log('\n💾 Recommendations saved to: ai-improvement-recommendations.md');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testContextAwareProcessing();