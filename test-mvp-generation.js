#!/usr/bin/env node

/**
 * 🧪 TEST MVP GENERATION
 * 
 * Quick test to verify the complete MVP generation pipeline
 */

const UnifiedMVPGenerator = require('./unified-mvp-generator');

async function testMVPGeneration() {
    console.log('🧪 Testing MVP Generation Pipeline...\n');
    
    const generator = new UnifiedMVPGenerator();
    
    // Test document
    const testDocument = {
        content: `
# TaskFlow - Project Management SaaS

## Executive Summary
TaskFlow is a collaborative project management platform designed for remote teams.

## Core Features
- User authentication and team management
- Project creation and task assignment
- Real-time collaboration with comments
- Dashboard with analytics
- API for third-party integrations
- Subscription billing (monthly/yearly plans)

## Technical Requirements
- Must support 1000+ concurrent users
- Real-time updates using WebSockets
- Mobile-responsive design
- RESTful API with documentation
- Automated backups

## Target Market
Small to medium businesses with remote teams
        `,
        type: 'business-plan'
    };
    
    const options = {
        name: 'TaskFlow',
        database: 'postgresql',
        deployment: { platform: 'docker' }
    };
    
    // Listen to progress events
    generator.on('step:start', (step) => {
        console.log(`⏳ Starting: ${step}`);
    });
    
    generator.on('step:complete', (step, data) => {
        console.log(`✅ Completed: ${step}`);
    });
    
    try {
        console.log('📄 Input Document:');
        console.log('-------------------');
        console.log(testDocument.content.trim());
        console.log('-------------------\n');
        
        console.log('🚀 Starting MVP generation...\n');
        
        const mvp = await generator.generateFromDocument(testDocument, options);
        
        console.log('\n🎉 MVP Generation Complete!');
        console.log('===========================');
        console.log(`📁 Project ID: ${mvp.id}`);
        console.log(`📍 Location: ${mvp.paths.root}`);
        console.log(`🌐 Frontend URL: ${mvp.urls.frontend}`);
        console.log(`⚙️ Backend URL: ${mvp.urls.backend}`);
        console.log(`📚 Documentation: ${mvp.urls.docs}`);
        console.log('\n🏗️ Architecture:');
        console.log(JSON.stringify(mvp.architecture, null, 2));
        console.log('\n🎨 Template Used:');
        console.log(JSON.stringify(mvp.template, null, 2));
        console.log('\n🚀 To launch your MVP:');
        console.log(`  cd ${mvp.paths.root}`);
        console.log('  ./launch-mvp.sh');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error(error.stack);
    }
}

// Run the test
testMVPGeneration();