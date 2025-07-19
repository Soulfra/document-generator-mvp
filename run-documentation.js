#!/usr/bin/env node

// Direct execution of documentation layer bash system
const DocumentationLayerBash = require('./documentation-layer-bash.js');

async function runDocumentationPipeline() {
  console.log('🚀 Starting documentation pipeline execution...');
  
  try {
    const docBash = new DocumentationLayerBash();
    const result = await docBash.bashDocumentationLayers();
    
    console.log('\n✅ DOCUMENTATION LAYER BASH COMPLETE!');
    console.log(`\n📊 Results:`);
    console.log(`  Layers processed: ${result.layers_processed.length}`);
    console.log(`  Files generated: ${result.layers_processed.reduce((acc, layer) => acc + layer.files_generated.length, 0)}`);
    console.log(`  Characters involved: ${result.character_assignments.size}`);
    console.log(`  Tools used: ${result.tool_usage.size}`);
    
    console.log('\n📄 Generated Documentation:');
    result.layers_processed.forEach(layer => {
      const emoji = docBash.docConfig.characters[layer.character].emoji;
      console.log(`  ${emoji} ${layer.character}: ${layer.files_generated.join(', ')}`);
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Documentation pipeline failed:', error.message);
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  runDocumentationPipeline();
}

module.exports = runDocumentationPipeline;