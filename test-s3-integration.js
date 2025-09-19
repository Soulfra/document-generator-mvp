#!/usr/bin/env node

/**
 * TEST S3 INTEGRATION
 * Verifies that all components are storing data properly
 */

const axios = require('axios');

async function testS3Integration() {
  console.log('🧪 Testing S3 Integration...\n');
  
  // Test character operation
  console.log('1️⃣ Testing character database operation with S3 storage...');
  try {
    const charResult = await axios.post('http://localhost:9902/api/characters/ralph/database/insertMetric', {
      test: true,
      operation: 's3_integration_test',
      value: 42,
      timestamp: Date.now()
    });
    
    console.log('✅ Character operation result:', {
      success: charResult.data.success,
      character: charResult.data.character,
      s3Storage: charResult.data.s3Storage
    });
  } catch (error) {
    console.error('❌ Character operation failed:', error.message);
  }
  
  // Test RL system carrot reward
  console.log('\n2️⃣ Testing RL carrot reward with character attribution...');
  try {
    const carrotResult = await axios.post('http://localhost:9900/api/reward/ai-factory', {
      amount: 2,
      reason: 'S3 integration test reward'
    });
    
    console.log('✅ Carrot reward result:', carrotResult.data);
  } catch (error) {
    console.error('❌ Carrot reward failed:', error.message);
  }
  
  // Get knowledge graph (which should be stored in S3)
  console.log('\n3️⃣ Testing knowledge graph generation and S3 storage...');
  try {
    const graphResult = await axios.get('http://localhost:9900/api/knowledge-graph');
    
    console.log('✅ Knowledge graph result:', {
      nodes: graphResult.data.graph.nodes?.length || 0,
      edges: graphResult.data.graph.edges?.length || 0,
      builtBy: graphResult.data.graph.builtBy,
      s3Location: graphResult.data.graph.s3Location
    });
  } catch (error) {
    console.error('❌ Knowledge graph failed:', error.message);
  }
  
  // Test unified API gateway
  console.log('\n4️⃣ Testing unified API gateway...');
  try {
    const gatewayHealth = await axios.get('http://localhost:8888/health');
    console.log('✅ Gateway health:', gatewayHealth.data);
    
    // Get storage stats through gateway
    const storageStats = await axios.get('http://localhost:8888/api/storage/stats');
    console.log('✅ Storage statistics:', storageStats.data);
  } catch (error) {
    console.error('❌ Gateway test failed:', error.message);
  }
  
  // Test system overview aggregation
  console.log('\n5️⃣ Testing system overview aggregation...');
  try {
    const overview = await axios.get('http://localhost:8888/api/aggregate/system-overview');
    console.log('✅ System overview:', {
      services: Object.keys(overview.data.services).length,
      storage: overview.data.storage,
      characters: overview.data.characters?.effectiveness ? 'Available' : 'N/A'
    });
  } catch (error) {
    console.error('❌ System overview failed:', error.message);
  }
  
  console.log('\n✨ S3 Integration test complete!');
}

// Run tests
testS3Integration().catch(console.error);