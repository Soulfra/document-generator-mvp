#!/usr/bin/env node
// test-archaeological.js - Test archaeological programming integration

const { ArchaeologicalProgrammingAgent } = require('./mcp/modules/archaeological-programming/archaeological-programming');
const fs = require('fs');

// Mock dependencies for testing
class MockReasoningTracker {
  async trackStep(agentId, step, description) {
    console.log(`[${agentId}] ${step}: ${description}`);
  }
}

class MockDatabaseManager {
  async query(sql, params) {
    console.log('Database query:', sql);
    return { rows: [] };
  }
}

async function testArchaeologicalProgramming() {
  console.log('🏛️ Testing Archaeological Programming Integration');
  console.log('================================================');
  
  try {
    // Initialize mock services
    const reasoningTracker = new MockReasoningTracker();
    const dbManager = new MockDatabaseManager();
    
    // Create archaeological programming agent
    const archaeoAgent = new ArchaeologicalProgrammingAgent(reasoningTracker, dbManager);
    
    // Read test document
    const testDocument = fs.readFileSync('./ARCHAEOLOGICAL-PROGRAMMING-TEST.md', 'utf-8');
    console.log('📄 Processing test document...');
    console.log('Document preview:', testDocument.substring(0, 200) + '...');
    
    // Process document
    const result = await archaeoAgent.processDocument(testDocument, 'egyptian');
    
    if (result.success) {
      console.log('\\n✅ SUCCESS - Document processed with archaeological programming!');
      console.log('\\n🔍 Analysis Results:');
      console.log('- Programming concepts found:', result.programming_concepts.length);
      console.log('- Ancient symbols identified:', result.symbols_identified.length);
      console.log('- Template generated:', result.template ? 'Yes' : 'No');
      
      console.log('\\n📜 Identified Symbols:');
      result.symbols_identified.forEach(symbol => {
        console.log(`  ${symbol.symbol} (${symbol.civilization}) - ${symbol.meaning} → ${symbol.programming_concept}`);
      });
      
      console.log('\\n💻 Generated Archaeological Code:');
      console.log(result.generated_code);
      
      console.log('\\n🎯 Learning Path:');
      result.learning_path.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });
      
      if (result.template) {
        console.log('\\n🏛️ Template Details:');
        console.log(`  Name: ${result.template.name}`);
        console.log(`  Civilization: ${result.template.civilization}`);
        console.log(`  Difficulty: ${result.template.difficulty_level}`);
        console.log(`  Paradigm: ${result.template.programming_paradigm}`);
      }
      
    } else {
      console.log('❌ FAILED - Could not process document');
    }
    
    // Test code translation
    console.log('\\n🔄 Testing Code Translation...');
    const modernCode = `
function loginUser(credentials) {
  const user = new User(credentials);
  while (user.isActive()) {
    user.process();
  }
  return user;
}
    `;
    
    const translation = await archaeoAgent.translateToArchaeological(modernCode);
    console.log('\\n📝 Modern Code Translation:');
    console.log('Original:', modernCode);
    console.log('Archaeological:', translation.archaeological_code);
    console.log('\\n🗝️ Symbol Mappings:');
    translation.symbol_mappings.forEach(mapping => {
      console.log(`  ${mapping.modern} → ${mapping.ancient} (${mapping.symbol})`);
    });
    
    // Test template retrieval
    console.log('\\n📚 Available Templates:');
    const templates = await archaeoAgent.getAvailableTemplates();
    templates.forEach(template => {
      console.log(`  - ${template.name} (${template.civilization}, ${template.difficulty_level})`);
    });
    
    console.log('\\n🎉 Archaeological Programming Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testArchaeologicalProgramming();