#!/usr/bin/env node

/**
 * TEST MVP GENERATOR - Shell-free testing
 */

console.log('🧪 TESTING MVP GENERATOR');
console.log('========================');

// Direct require and execute
try {
  const MVPGenerator = require('./mvp-generator.js');
  
  async function testGeneration() {
    console.log('🚀 Creating MVP Generator...');
    const generator = new MVPGenerator();
    
    console.log('📄 Testing with test-document.md...');
    const mvp = await generator.generateMVP('./test-document.md');
    
    if (mvp) {
      console.log('✅ MVP GENERATION SUCCESSFUL!');
      console.log('📦 Generated MVP:', mvp.path);
      console.log('🎯 Files created:', mvp.files.length);
      console.log('📊 Analytics:', generator.getAnalytics());
      
      // List what was created
      const fs = require('fs');
      if (fs.existsSync(mvp.path)) {
        console.log('\n📁 Generated files:');
        fs.readdirSync(mvp.path).forEach(file => {
          console.log(`   - ${file}`);
        });
      }
      
      console.log('\n🎉 SUCCESS! MVP ready for testing');
      console.log(`👉 Next: cd ${mvp.path} && npm install && npm start`);
      
    } else {
      console.log('❌ MVP Generation failed');
    }
  }
  
  testGeneration().catch(console.error);
  
} catch (error) {
  console.error('💥 Test failed:', error.message);
  console.error(error.stack);
}