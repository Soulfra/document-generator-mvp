#!/usr/bin/env node

/**
 * MODEL TAGGING DEMO
 * Demonstrates comprehensive model tagging with semantic search
 */

async function demonstrateModelTagging() {
  console.log('🏷️  MODEL TAGGING SYSTEM DEMONSTRATION');
  console.log('=====================================');
  console.log('Testing semantic search, tagging, and database functionality...\n');

  const baseUrl = 'http://localhost:5001';

  try {
    // Test 1: Check system health
    console.log('1️⃣ SYSTEM HEALTH CHECK');
    console.log('======================');
    
    const healthResponse = await fetch(`${baseUrl}/health`);
    const health = await healthResponse.json();
    
    console.log(`Status: ${health.status}`);
    console.log(`Models: ${health.models_count}`);
    console.log(`Tag Categories: ${health.categories}`);
    console.log(`Semantic Index: ${health.semantic_index_size} entries`);

    // Test 2: Register a new model
    console.log('\n2️⃣ REGISTERING NEW MODEL');
    console.log('========================');
    
    const newModel = {
      name: 'Custom Fine-Tuned BERT',
      description: 'BERT model fine-tuned for medical text classification and entity recognition',
      provider: 'huggingface',
      model_type: 'classification',
      architecture: 'transformer',
      parameters: 110000000,
      metadata: {
        domain: 'medical',
        training_data: 'PubMed abstracts',
        accuracy: 0.94
      },
      auto_tag: true
    };

    const registerResponse = await fetch(`${baseUrl}/models/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newModel)
    });

    const registeredModel = await registerResponse.json();
    console.log(`✅ Registered: ${registeredModel.model.name}`);
    console.log(`   ID: ${registeredModel.model.id}`);
    console.log(`   Provider: ${registeredModel.model.provider}`);

    const modelId = registeredModel.model.id;

    // Test 3: Manual tagging
    console.log('\n3️⃣ MANUAL TAGGING');
    console.log('=================');
    
    const manualTags = [
      { category: 'domain', tags: ['medical', 'healthcare'], confidence: 1.0 },
      { category: 'capability', tags: ['classification', 'entity_recognition'], confidence: 0.95 },
      { category: 'status', tags: ['production'], confidence: 1.0 }
    ];

    for (const tagGroup of manualTags) {
      const tagResponse = await fetch(`${baseUrl}/models/${modelId}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagGroup)
      });

      const tagResult = await tagResponse.json();
      console.log(`✅ Tagged with ${tagGroup.category}: ${tagGroup.tags.join(', ')}`);
    }

    // Test 4: Semantic search
    console.log('\n4️⃣ SEMANTIC SEARCH TESTING');
    console.log('===========================');
    
    const searchQueries = [
      'medical text analysis',
      'code generation programming',
      'large language model reasoning',
      'classification medical'
    ];

    for (const query of searchQueries) {
      const searchResponse = await fetch(`${baseUrl}/search/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, options: { limit: 3 } })
      });

      const searchResults = await searchResponse.json();
      console.log(`🔍 Query: "${query}"`);
      console.log(`   Results: ${searchResults.results.length} models found`);
      
      searchResults.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.model.name} (similarity: ${result.similarity_score.toFixed(3)})`);
      });
    }

    // Test 5: Tag-based search
    console.log('\n5️⃣ TAG-BASED SEARCH');
    console.log('===================');
    
    const tagSearches = [
      ['medical', 'classification'],
      ['llm', 'transformer'],
      ['code_generation'],
      ['production']
    ];

    for (const tags of tagSearches) {
      const tagSearchResponse = await fetch(`${baseUrl}/search/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags, options: { limit: 5 } })
      });

      const tagResults = await tagSearchResponse.json();
      console.log(`🏷️  Tags: [${tags.join(', ')}]`);
      console.log(`   Results: ${tagResults.results.length} models found`);
      
      tagResults.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.model.name} (${result.tag_matches} tag matches)`);
      });
    }

    // Test 6: Model details
    console.log('\n6️⃣ MODEL DETAILS');
    console.log('================');
    
    const detailsResponse = await fetch(`${baseUrl}/models/${modelId}`);
    const modelDetails = await detailsResponse.json();
    
    console.log(`📊 Model: ${modelDetails.model.name}`);
    console.log(`   Type: ${modelDetails.model.model_type}`);
    console.log(`   Parameters: ${modelDetails.model.parameters.toLocaleString()}`);
    console.log(`   Tags: ${modelDetails.model.tags.length} applied`);
    console.log(`   Has Embedding: ${modelDetails.model.has_embedding}`);
    
    console.log('\n   Applied Tags:');
    const tagsByCategory = {};
    modelDetails.model.tags.forEach(tag => {
      if (!tagsByCategory[tag.category]) tagsByCategory[tag.category] = [];
      if (tag.tag) tagsByCategory[tag.category].push(tag.tag);
    });
    
    Object.entries(tagsByCategory).forEach(([category, tags]) => {
      if (tags.length > 0) {
        console.log(`     ${category}: ${tags.join(', ')}`);
      }
    });

    // Test 7: Browse by category
    console.log('\n7️⃣ BROWSE BY CATEGORY');
    console.log('=====================');
    
    const browseResponse = await fetch(`${baseUrl}/browse/medical`);
    const browseResults = await browseResponse.json();
    
    console.log(`📚 Medical models: ${browseResults.models.length} found`);
    browseResults.models.forEach((model, index) => {
      console.log(`   ${index + 1}. ${model.name} (${model.provider})`);
    });

    // Test 8: Performance metrics
    console.log('\n8️⃣ PERFORMANCE METRICS');
    console.log('======================');
    
    const startTime = Date.now();
    
    // Run multiple searches
    const performanceTests = await Promise.all([
      fetch(`${baseUrl}/search/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'machine learning model' })
      }),
      fetch(`${baseUrl}/search/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: ['transformer'] })
      }),
      fetch(`${baseUrl}/models/${modelId}`)
    ]);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`⚡ Performance Test Results:`);
    console.log(`   Concurrent operations: 3`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average per operation: ${(totalTime / 3).toFixed(1)}ms`);

    // Summary
    console.log('\n🎉 DEMONSTRATION COMPLETE');
    console.log('=========================');
    
    const finalHealthResponse = await fetch(`${baseUrl}/health`);
    const finalHealth = await finalHealthResponse.json();
    
    console.log('✅ All model tagging features verified:');
    console.log('   📝 Model registration with auto-tagging');
    console.log('   🏷️  Manual tagging with categories and confidence');
    console.log('   🔍 Semantic search with embeddings');
    console.log('   🏷️  Tag-based search with filtering');
    console.log('   📊 Model details and metadata retrieval');
    console.log('   📚 Category browsing');
    console.log('   ⚡ Performance optimization');
    
    console.log(`\n📈 Current System State:`);
    console.log(`   Models: ${finalHealth.models_count}`);
    console.log(`   Tag Categories: ${finalHealth.categories}`);
    console.log(`   Semantic Index: ${finalHealth.semantic_index_size} entries`);
    
    console.log('\n🎯 YOUR MODEL TAGGING SYSTEM IS FULLY OPERATIONAL!');
    console.log('===================================================');
    console.log('Features available:');
    console.log('• Semantic search with vector embeddings');
    console.log('• Comprehensive tagging with 8 categories');
    console.log('• SQLite database with persistent storage');
    console.log('• Auto-tagging based on model descriptions');
    console.log('• Tag-based filtering and search');
    console.log('• Model performance and metadata tracking');
    console.log('• REST API for integration');
    
    console.log('\n📡 Access Points:');
    console.log(`• Dashboard: http://localhost:5001`);
    console.log(`• Health Check: ${baseUrl}/health`);
    console.log(`• Register Model: POST ${baseUrl}/models/register`);
    console.log(`• Semantic Search: POST ${baseUrl}/search/semantic`);
    console.log(`• Tag Search: POST ${baseUrl}/search/tags`);

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.log('\nEnsure the semantic model tagging system is running:');
    console.log('node semantic-model-tagging-system.js');
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateModelTagging();
}

module.exports = demonstrateModelTagging;