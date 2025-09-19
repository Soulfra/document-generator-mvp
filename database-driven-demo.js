#!/usr/bin/env node

/**
 * DATABASE-DRIVEN SYSTEM DEMO
 * Shows how the database-driven approach simplifies everything
 */

const DatabaseDrivenBuilder = require('./database-driven-builder');
const SchemaToSystem = require('./schema-to-system');
const AutomatedTurnRunner = require('./automated-turn-runner');
const fs = require('fs').promises;
const path = require('path');

async function runDemo() {
    console.log(`
🚀 DATABASE-DRIVEN AUTOMATION DEMO
Showing how SQL schemas can drive entire systems
    `);
    
    try {
        // Step 1: Use existing schema
        console.log('\n1️⃣ Using existing schema.sql as source of truth...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        
        // Step 2: Generate complete system from schema
        console.log('\n2️⃣ Generating complete system from database schema...');
        const builder = new DatabaseDrivenBuilder({
            schemaPath,
            outputDir: './demo-output',
            generateAPI: true,
            generateUI: true
        });
        
        const buildResult = await builder.buildFromSchema();
        console.log(`   ✅ Generated ${buildResult.models.length} models`);
        console.log(`   ✅ Generated ${buildResult.apis.length} REST APIs`);
        
        // Step 3: Create runtime system from schema
        console.log('\n3️⃣ Creating runtime system directly from schema...');
        const runtime = new SchemaToSystem({
            database: './demo-runtime.db',
            autoMigrate: true,
            enableRealtimeSync: true
        });
        
        await runtime.loadSchema(schemaPath);
        console.log(`   ✅ Runtime system ready with ${runtime.models.size} models`);
        
        // Step 4: Demonstrate CRUD operations
        console.log('\n4️⃣ Testing database-driven operations...');
        
        // Create a document
        const docModel = runtime.models.get('documents');
        if (docModel) {
            const doc = await docModel.create({
                uuid: `doc-${Date.now()}`,
                title: 'Business Plan for AI Startup',
                type: 'business-plan',
                content: 'AI-powered document processing platform...'
            });
            console.log(`   ✅ Created document: ${doc.title}`);
            
            // Process it through services
            const docService = runtime.services.get('documents');
            const processed = await docService.processDocument?.(doc.id) || doc;
            console.log(`   ✅ Processed document ${doc.id}`);
        }
        
        // Step 5: Run automated turns
        console.log('\n5️⃣ Running automated revenue generation...');
        const runner = new AutomatedTurnRunner({
            database: './demo-automation.db',
            maxTurns: 3,
            turnDuration: 2000 // 2 seconds for demo
        });
        
        await runner.initialize();
        
        // Execute turns
        await new Promise((resolve) => {
            runner.on('automation-stopped', async (summary) => {
                console.log(`\n   ✅ Automation complete!`);
                console.log(`   💰 Total revenue: $${summary.totalRevenue.toFixed(2)}`);
                console.log(`   📊 Turns executed: ${summary.totalTurns}`);
                resolve();
            });
            
            runner.start();
        });
        
        // Step 6: Show how easy it is
        console.log('\n✨ DEMO COMPLETE!');
        console.log('\n📌 Key Points:');
        console.log('   1. No DSL compilation needed - just SQL');
        console.log('   2. Database schema IS the system specification');
        console.log('   3. Everything generated from CREATE TABLE statements');
        console.log('   4. Turn automation driven by database records');
        console.log('   5. Simple, database-driven, no complex orchestration');
        
        console.log('\n📁 Check out the generated system in ./demo-output/');
        console.log('   - Models in ./demo-output/models/');
        console.log('   - Services in ./demo-output/services/');
        console.log('   - APIs in ./demo-output/api/');
        console.log('   - UI in ./demo-output/ui/');
        
        console.log('\n🎯 To run the generated system:');
        console.log('   cd demo-output');
        console.log('   npm install');
        console.log('   npm start');
        
    } catch (error) {
        console.error('\n❌ Demo failed:', error);
        console.error('\n💡 Make sure schema.sql exists in the current directory');
    }
}

// Run the demo
runDemo();