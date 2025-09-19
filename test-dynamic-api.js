#!/usr/bin/env node

/**
 * 🧪 DYNAMIC API TESTING SUITE
 * Tests all the dynamic game API endpoints
 */

const axios = require('axios');
const fs = require('fs');

class DynamicAPITester {
    constructor() {
        this.apiBase = 'http://localhost:4455';
        this.tests = [];
        this.results = [];
    }
    
    async runAllTests() {
        console.log('🧪 DYNAMIC API TESTING SUITE');
        console.log('==============================');
        console.log(`Testing API at: ${this.apiBase}`);
        console.log('');
        
        // Test basic endpoints
        await this.testHealthCheck();
        await this.testDiscovery();
        await this.testGamesList();
        
        // Test content type handling
        await this.testContentTypes();
        
        // Test game-specific endpoints
        await this.testShipRektAPI();
        await this.testDocumentMVPAPI();
        await this.testCharacterAPI();
        await this.testRuneScapeAPI();
        
        // Test dynamic registration
        await this.testDynamicRegistration();
        
        // Summary
        this.printSummary();
    }
    
    async testHealthCheck() {
        console.log('🏥 Testing health check...');
        try {
            const response = await axios.get(`${this.apiBase}/health`);
            console.log('✅ Health check passed');
            console.log(`   Status: ${response.data.status}`);
            console.log(`   Games: ${response.data.games.join(', ')}`);
            this.recordTest('health', true);
        } catch (error) {
            console.log('❌ Health check failed:', error.message);
            this.recordTest('health', false, error.message);
        }
        console.log('');
    }
    
    async testDiscovery() {
        console.log('📡 Testing API discovery...');
        try {
            const response = await axios.get(`${this.apiBase}/api/discover`);
            console.log('✅ Discovery endpoint working');
            
            const games = Object.keys(response.data);
            console.log(`   Found ${games.length} games: ${games.join(', ')}`);
            
            // Show details for each game
            games.forEach(gameId => {
                const game = response.data[gameId];
                console.log(`   🎮 ${gameId}: ${game.endpoints.length} endpoints`);
            });
            
            this.recordTest('discovery', true);
        } catch (error) {
            console.log('❌ Discovery failed:', error.message);
            this.recordTest('discovery', false, error.message);
        }
        console.log('');
    }
    
    async testGamesList() {
        console.log('📋 Testing games list...');
        try {
            const response = await axios.get(`${this.apiBase}/api/games`);
            console.log('✅ Games list working');
            console.log(`   Active games: ${response.data.games.length}`);
            this.recordTest('games-list', true);
        } catch (error) {
            console.log('❌ Games list failed:', error.message);
            this.recordTest('games-list', false, error.message);
        }
        console.log('');
    }
    
    async testContentTypes() {
        console.log('📝 Testing content type handling...');
        
        // Test JSON
        await this.testContentType('application/json', { test: 'data' });
        
        // Test plain text
        await this.testContentType('text/plain', 'This is plain text');
        
        console.log('');
    }
    
    async testContentType(contentType, data) {
        try {
            const response = await axios.post(`${this.apiBase}/api/document-mvp/analyze`, data, {
                headers: { 'Content-Type': contentType }
            });
            console.log(`✅ Content type ${contentType} handled`);
            this.recordTest(`content-type-${contentType}`, true);
        } catch (error) {
            if (error.response && error.response.status === 415) {
                console.log(`⚠️  Content type ${contentType} not supported (expected)`);
            } else {
                console.log(`❌ Content type ${contentType} failed:`, error.message);
            }
            this.recordTest(`content-type-${contentType}`, false, error.message);
        }
    }
    
    async testShipRektAPI() {
        console.log('🏴‍☠️ Testing ShipRekt API...');
        
        // Test create game from document
        try {
            const response = await axios.post(`${this.apiBase}/api/shiprekt/create-from-doc`, {
                document: 'This is a test business plan for a pirate trading company',
                gameMode: 'auto'
            });
            console.log('✅ ShipRekt game creation working');
            this.recordTest('shiprekt-create', true);
        } catch (error) {
            console.log('❌ ShipRekt game creation failed:', error.message);
            this.recordTest('shiprekt-create', false, error.message);
        }
        
        // Test player stats
        try {
            const response = await axios.get(`${this.apiBase}/api/shiprekt/player-stats?playerId=test123`);
            console.log('✅ ShipRekt player stats working');
            this.recordTest('shiprekt-stats', true);
        } catch (error) {
            console.log('❌ ShipRekt player stats failed:', error.message);
            this.recordTest('shiprekt-stats', false, error.message);
        }
        
        console.log('');
    }
    
    async testDocumentMVPAPI() {
        console.log('📄 Testing Document MVP API...');
        
        // Test document analysis
        try {
            const response = await axios.post(`${this.apiBase}/api/document-mvp/analyze`, {
                document: 'Build a web application that manages tasks',
                type: 'business-requirement'
            });
            console.log('✅ Document analysis working');
            this.recordTest('document-analyze', true);
        } catch (error) {
            console.log('❌ Document analysis failed:', error.message);
            this.recordTest('document-analyze', false, error.message);
        }
        
        // Test MVP generation
        try {
            const response = await axios.post(`${this.apiBase}/api/document-mvp/generate`, {
                document: 'Create a simple blog website',
                options: { framework: 'react', deployment: 'vercel' }
            });
            console.log('✅ MVP generation working');
            console.log(`   Job ID: ${response.data.result.jobId || 'N/A'}`);
            this.recordTest('document-generate', true);
        } catch (error) {
            console.log('❌ MVP generation failed:', error.message);
            this.recordTest('document-generate', false, error.message);
        }
        
        console.log('');
    }
    
    async testCharacterAPI() {
        console.log('🎭 Testing Character API...');
        
        // Test character consultation
        try {
            const response = await axios.post(`${this.apiBase}/api/characters/consult`, {
                character: 'alice',
                question: 'How should I design a REST API?'
            });
            console.log('✅ Character consultation working');
            this.recordTest('character-consult', true);
        } catch (error) {
            console.log('❌ Character consultation failed:', error.message);
            this.recordTest('character-consult', false, error.message);
        }
        
        console.log('');
    }
    
    async testRuneScapeAPI() {
        console.log('⚔️ Testing RuneScape API...');
        
        // Test Grand Exchange
        try {
            const response = await axios.get(`${this.apiBase}/api/runescape/grand-exchange?itemId=4151`);
            console.log('✅ RuneScape Grand Exchange working');
            this.recordTest('runescape-ge', true);
        } catch (error) {
            console.log('❌ RuneScape Grand Exchange failed:', error.message);
            this.recordTest('runescape-ge', false, error.message);
        }
        
        console.log('');
    }
    
    async testDynamicRegistration() {
        console.log('🔧 Testing dynamic game registration...');
        
        // For this test, we'd need to add a registration endpoint to the API
        // This is a placeholder for now
        console.log('⚠️  Dynamic registration test needs implementation');
        this.recordTest('dynamic-registration', false, 'Not implemented yet');
        
        console.log('');
    }
    
    recordTest(name, passed, error = null) {
        this.results.push({
            name,
            passed,
            error
        });
    }
    
    printSummary() {
        console.log('📊 TEST SUMMARY');
        console.log('===============');
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`Tests passed: ${passed}/${total} (${percentage}%)`);
        console.log('');
        
        // Show failed tests
        const failed = this.results.filter(r => !r.passed);
        if (failed.length > 0) {
            console.log('❌ Failed tests:');
            failed.forEach(test => {
                console.log(`   • ${test.name}: ${test.error}`);
            });
        } else {
            console.log('🎉 All tests passed!');
        }
        
        console.log('');
        console.log('💡 Next steps:');
        console.log('   • Fix any failed tests');
        console.log('   • Add more game integrations');
        console.log('   • Implement dynamic registration endpoint');
        console.log('   • Add real RuneScape API integration');
        console.log('   • Connect to actual character AI system');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new DynamicAPITester();
    tester.runAllTests().catch(console.error);
}

module.exports = DynamicAPITester;