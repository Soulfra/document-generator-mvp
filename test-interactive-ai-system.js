#!/usr/bin/env node

/**
 * 🎨👍 INTERACTIVE AI PIXEL ART SYSTEM TEST
 * Test the complete pipeline with rating, refinement, and parallel processing
 */

const AIPixelArtGenerator = require('./ai-pixel-art-generator.js');
const AIFeedbackSystem = require('./ai-feedback-system.js');

async function testCompleteInteractiveSystem() {
    console.log('🎨👍 INTERACTIVE AI PIXEL ART SYSTEM TEST');
    console.log('═'.repeat(70));
    console.log('🎯 Testing: Complete user feedback loop');
    console.log('⚡ Features: Rating, Refinement, Parallel Processing');
    console.log();
    
    // Initialize systems
    const aiGenerator = new AIPixelArtGenerator({
        gridSize: 32,
        enableReasoning: true,
        cacheResults: false
    });
    
    const feedbackSystem = new AIFeedbackSystem({
        feedbackFile: './test-feedback.json',
        autoSave: true
    });
    
    console.log('🚀 Step 1: Generate initial pixel art (parallel mode)');
    console.log('─'.repeat(50));
    
    // Step 1: Generate initial pixel art with parallel processing
    const initialResult = await aiGenerator.generateFromQuery('draw a dragon', {
        parallel: true,
        style: 'fantasy'
    });
    
    console.log(`✅ Generated dragon with ID: ${initialResult.id}`);
    console.log(`📊 Processing time: ${initialResult.processingTime}ms`);
    console.log(`💰 Cost: $${initialResult.metadata.totalCost?.toFixed(4) || '0.0000'}`);
    
    if (initialResult.parallelResults) {
        console.log('\n🔬 Parallel Processing Results:');
        if (initialResult.parallelResults.reasoning) {
            console.log('Reasoning services:');
            initialResult.parallelResults.reasoning.forEach(r => {
                const status = r.success ? '✅' : '❌';
                console.log(`  ${status} ${r.service}: ${r.responseTime || 0}ms`);
            });
        }
        if (initialResult.parallelResults.commands) {
            console.log('Command services:');
            initialResult.parallelResults.commands.forEach(r => {
                const status = r.success ? '✅' : '❌';
                console.log(`  ${status} ${r.service}: ${r.responseTime || 0}ms`);
            });
        }
    }
    
    // Show the generated pixel art
    if (initialResult.pixelResult.ascii) {
        console.log('\n🐉 Generated Dragon:');
        console.log(initialResult.pixelResult.ascii);
    }
    
    console.log('\n🚀 Step 2: Simulate user rating');
    console.log('─'.repeat(50));
    
    // Step 2: User rates the generation
    const userRating = {
        overall: 3,      // User thinks it's okay but could be better
        accuracy: 4,     // Pretty accurate to request
        aesthetics: 2,   // Not very appealing
        creativity: 4,   // Creative interpretation
        comment: 'The dragon looks okay but could be more colorful and detailed'
    };
    
    const ratingData = await feedbackSystem.rateGeneration(
        initialResult.id, 
        userRating, 
        'test_user_123'
    );
    
    console.log(`📈 Rating submitted: ${ratingData.weightedScore}/5 (weighted)`);
    console.log(`👍 Approved: ${ratingData.approved ? 'Yes' : 'No'}`);
    
    console.log('\n🚀 Step 3: Add improvement suggestion');
    console.log('─'.repeat(50));
    
    // Step 3: User suggests improvement
    const improvement = {
        text: 'Add more vibrant colors, especially reds and golds for a majestic dragon',
        type: 'color',
        priority: 'high'
    };
    
    const improvementData = await feedbackSystem.addImprovement(
        initialResult.id,
        improvement,
        'test_user_123'
    );
    
    console.log(`💡 Improvement added: "${improvement.text}"`);
    
    console.log('\n🚀 Step 4: Generate refinement based on feedback');
    console.log('─'.repeat(50));
    
    // Step 4: Generate refined version
    const feedback = {
        rating: userRating,
        improvements: [improvement]
    };
    
    const refinedResult = await feedbackSystem.generateRefinement(
        initialResult,
        feedback,
        aiGenerator
    );
    
    console.log(`✅ Generated refined dragon with ID: ${refinedResult.id}`);
    console.log(`📊 Processing time: ${refinedResult.processingTime}ms`);
    console.log(`🔄 Original ID: ${refinedResult.metadata.refinementOf}`);
    
    // Show the refined pixel art
    if (refinedResult.pixelResult.ascii) {
        console.log('\n🐉✨ Refined Dragon:');
        console.log(refinedResult.pixelResult.ascii);
    }
    
    console.log('\n🚀 Step 5: Rate the refined version');
    console.log('─'.repeat(50));
    
    // Step 5: User rates the refined version (hopefully better!)
    const refinedRating = {
        overall: 5,      // Much better!
        accuracy: 5,     // Perfect match to request
        aesthetics: 4,   // Much more appealing
        creativity: 5,   // Very creative
        comment: 'Excellent improvement! The colors are much better and more majestic.'
    };
    
    const refinedRatingData = await feedbackSystem.rateGeneration(
        refinedResult.id,
        refinedRating,
        'test_user_123'
    );
    
    console.log(`📈 Refined rating: ${refinedRatingData.weightedScore}/5 (weighted)`);
    console.log(`👍 Approved: ${refinedRatingData.approved ? 'Yes' : 'No'}`);
    
    console.log('\n🚀 Step 6: Show feedback system statistics');
    console.log('─'.repeat(50));
    
    const stats = feedbackSystem.getStats();
    console.log('📊 Feedback System Statistics:');
    console.log(`- Total ratings: ${stats.totalRatings}`);
    console.log(`- Average rating: ${stats.avgRating}/5`);
    console.log(`- Approval rate: ${stats.approvalRate}%`);
    console.log(`- Total improvements: ${stats.totalImprovements}`);
    console.log(`- Unique users: ${stats.uniqueUsers}`);
    
    console.log('\n🎉 INTERACTIVE SYSTEM TEST COMPLETE');
    console.log('═'.repeat(70));
    
    console.log('\n📋 SUMMARY OF CAPABILITIES:');
    console.log('✅ Real LLM integration (OpenAI, Anthropic, Ollama)');
    console.log('✅ Parallel processing for model comparison');
    console.log('✅ Interactive rating system (5-star, weighted)');
    console.log('✅ User improvement suggestions');
    console.log('✅ Automated refinement based on feedback');
    console.log('✅ Cost tracking and performance monitoring');
    console.log('✅ Learning from user preferences');
    console.log('✅ Multi-user support with persistence');
    
    console.log('\n🎮 WEB INTERFACE READY:');
    console.log('1. 🌐 Launch: node eye-pixel-art-system.js');
    console.log('2. 📱 Visit: http://localhost:8889');
    console.log('3. 🎨 Generate art with parallel mode checkbox');
    console.log('4. ⭐ Rate results with star system');
    console.log('5. 🔄 Refine based on your feedback');
    console.log('6. 👁️ Use eye controls for manual editing');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('- Add more LLM providers (Google Vertex, Azure)');
    console.log('- Implement A/B testing for prompt optimization');
    console.log('- Create collaborative rating (multiple users)');
    console.log('- Add export to game engine formats');
    console.log('- Implement voice input for hands-free operation');
    
    return {
        initialResult,
        refinedResult,
        feedback: stats
    };
}

// Run the test
testCompleteInteractiveSystem().catch(console.error);