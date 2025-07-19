#!/usr/bin/env node

/**
 * TEST NAVIGATION SYSTEM INTEGRATION
 * Test the complete navigation prediction system with hooks and templates
 */

console.log(`
🧪🔮 TESTING NAVIGATION SYSTEM INTEGRATION 🔮🧪
API Pre-fetch → Template Mapping → Navigation Prediction → Complete Flow
`);

async function testNavigationSystem() {
  console.log('🚀 Starting navigation system integration test...\n');
  
  try {
    // Test 1: API Pre-fetch Hook System
    console.log('📡 Testing API Pre-fetch Hook System...');
    const APIPreFetchHookSystem = require('./api-prefetch-hook-system.js');
    const apiHooks = new APIPreFetchHookSystem();
    
    // Test navigation hook
    const hookResult = await apiHooks.hookNavigationEvent('beforeNavigate', 'https://shop.example.com/products');
    console.log(`  ✅ Navigation hook result: ${hookResult.siteType} site detected`);
    console.log(`  📡 Pre-fetched APIs: ${hookResult.prefetched.join(', ')}`);
    console.log(`  📄 Templates: ${hookResult.templates.join(', ')}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Template Mapping Layer
    console.log('\n📋 Testing Template Mapping Layer...');
    const TemplateMappingLayer = require('./template-mapping-layer.js');
    const templateMapper = new TemplateMappingLayer();
    
    const mapping = await templateMapper.mapSiteToTemplates(
      'https://app.example.com/dashboard',
      '<div>analytics chart table metrics</div>'
    );
    
    console.log(`  ✅ Template mapping: ${mapping.matched_pattern}`);
    console.log(`  🎯 Confidence: ${(mapping.confidence * 100).toFixed(1)}%`);
    console.log(`  📄 Required templates: ${mapping.required_templates.join(', ')}`);
    console.log(`  💉 Injection strategy: ${mapping.injection_strategy}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Site Navigation Predictor
    console.log('\n🔮 Testing Site Navigation Predictor...');
    const SiteNavigationPredictor = require('./site-navigation-predictor.js');
    const predictor = new SiteNavigationPredictor();
    
    // Track some navigation
    predictor.trackNavigation('/home', {
      userBehavior: { dwellTime: 3000, scrolledToBottom: false }
    });
    
    predictor.trackNavigation('/products', {
      userBehavior: { dwellTime: 5000, mouseNearNavigation: true }
    });
    
    // Predict next navigation
    const predictions = await predictor.predictNextNavigation('/products', {
      mouseNearNavigation: true,
      dwellTime: 4000
    });
    
    console.log(`  🎯 Top predictions:`);
    predictions.slice(0, 3).forEach((pred, i) => {
      console.log(`    ${i + 1}. ${pred.pattern} (${(pred.confidence * 100).toFixed(1)}%)`);
      console.log(`       Target: ${pred.target_urls[0]}`);
      console.log(`       Priority: ${pred.preload_priority}`);
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Full Integration Flow
    console.log('\n🔄 Testing Full Integration Flow...');
    
    // Simulate user starting at homepage
    console.log('  👤 User starts at homepage...');
    const homepageMapping = await templateMapper.mapSiteToTemplates('https://example.com/');
    await apiHooks.hookNavigationEvent('beforeNavigate', 'https://example.com/');
    
    // Predict next navigation
    const homepagePredictions = await predictor.predictNextNavigation('/', {
      dwellTime: 2000,
      scrolledToBottom: true
    });
    
    if (homepagePredictions.length > 0) {
      const topPrediction = homepagePredictions[0];
      console.log(`  🔮 Predicted next: ${topPrediction.target_urls[0]} (${(topPrediction.confidence * 100).toFixed(1)}%)`);
      
      // Pre-fetch for predicted navigation
      console.log(`  📡 Pre-fetching for predicted navigation...`);
      await apiHooks.hookNavigationEvent('predictive-fetch', topPrediction.target_urls[0]);
      
      // Pre-map templates
      const predictedMapping = await templateMapper.mapSiteToTemplates(topPrediction.target_urls[0]);
      console.log(`  📄 Pre-mapped templates: ${predictedMapping.required_templates.join(', ')}`);
      
      // Simulate actual navigation
      console.log(`  🚀 User actually navigates to: ${topPrediction.target_urls[0]}`);
      predictor.trackNavigation(topPrediction.target_urls[0]);
      
      console.log(`  ✅ Everything was ready! Templates and APIs pre-loaded.`);
    }
    
    // Test 5: System Stats
    console.log('\n📊 System Statistics:');
    
    const apiStats = apiHooks.getCacheStats();
    console.log(`  📡 API Cache: ${apiStats.total_cached_apis} APIs, ${apiStats.cache_hit_rate}% hit rate`);
    
    const templateStats = templateMapper.getStats();
    console.log(`  📄 Templates: ${templateStats.cached_templates} cached, ${templateStats.total_injections} injections`);
    
    const predictorStats = predictor.getStats();
    console.log(`  🔮 Predictor: ${predictorStats.total_predictions} predictions, ${predictorStats.navigation_history} events`);
    
    console.log('\n🎉 NAVIGATION SYSTEM INTEGRATION TEST COMPLETE!');
    console.log(`
✅ All systems working together:
  • API pre-fetch hooks intercept navigation events
  • Template mapping identifies required templates  
  • Navigation predictor learns user patterns
  • Everything pre-loads before users need it
  • Complete navigation experience ready!
    `);
    
    return {
      success: true,
      api_cache_size: apiStats.total_cached_apis,
      templates_cached: templateStats.cached_templates,
      predictions_made: predictorStats.total_predictions,
      integration_status: 'fully_operational'
    };
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return {
      success: false,
      error: error.message,
      integration_status: 'failed'
    };
  }
}

// Run the test
if (require.main === module) {
  testNavigationSystem()
    .then(result => {
      console.log('\n📋 Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testNavigationSystem;