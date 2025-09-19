#!/usr/bin/env node

const CALContextDiscoveryBridge = require('./CAL-Context-Discovery-Bridge.js');

async function test() {
    console.log('🧪 Testing CAL Context Discovery Bridge Integration...\n');
    
    // First, let's test without MasterDiscoveryOrchestrator
    const bridge = new CALContextDiscoveryBridge({
        enableTodoExtraction: true,
        enablePatternAnalysis: true,
        maxSnippets: 5,
        contextRadius: 30
    });
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
        // Test 1: Search for authentication code
        console.log('\n📍 Test 1: Searching for authentication system...');
        const authContext = await bridge.searchWithContext('authentication login token session');
        
        console.log(`✅ Found ${authContext.stats.snippetsFound} code snippets`);
        console.log(`📝 Found ${authContext.stats.todosFound} related TODOs`);
        
        // Test 2: Extract TODOs for task management
        console.log('\n📍 Test 2: Extracting TODOs for task manager...');
        const tasks = await bridge.extractTodosForTaskManager();
        console.log(`✅ Found ${tasks.length} task groups`);
        
        // Test 3: Provide context to CAL system
        console.log('\n📍 Test 3: Providing context to CAL orchestrator...');
        const calContext = await bridge.provideContextToCAL('build authentication system', 'cal-orchestrator');
        
        console.log(`✅ Context prepared with:`);
        console.log(`  - ${calContext.relevantCode.length} code snippets`);
        console.log(`  - ${calContext.pendingTasks.length} pending tasks`);
        console.log(`  - ${calContext.suggestedPatterns.length} patterns`);
        
        // Show sample results
        if (authContext.codeSnippets.length > 0) {
            console.log('\n📄 Sample Code Snippet:');
            const snippet = authContext.codeSnippets[0];
            console.log(`File: ${snippet.file}`);
            console.log(`Line: ${snippet.lineNumber}`);
            console.log(`Relevance: ${(snippet.relevance * 100).toFixed(1)}%`);
        }
        
        if (authContext.todos.length > 0) {
            console.log('\n📝 Sample TODO:');
            const todo = authContext.todos[0];
            console.log(`[${todo.type}] ${todo.content}`);
            console.log(`Location: ${todo.file}:${todo.line}`);
        }
        
        // Show stats
        console.log('\n📊 Bridge Statistics:');
        console.log(JSON.stringify(bridge.getStats(), null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

test().catch(console.error);