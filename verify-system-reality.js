#!/usr/bin/env node

/**
 * 🔍 System Reality Verification
 * 
 * Tests what ACTUALLY works vs what we documented
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

// Test results
const results = {
    working: [],
    partial: [],
    broken: [],
    untested: []
};

console.log(`\n${colors.bright}🔍 SYSTEM REALITY CHECK${colors.reset}`);
console.log('=' .repeat(60));
console.log('Testing what actually works vs documentation claims...\n');

// Test 1: Check if core files exist and can be loaded
async function testFileIntegrity() {
    console.log(`${colors.bright}1. Testing File Integrity${colors.reset}`);
    
    const files = [
        'unified-3d-game-engine.js',
        'enhanced-ai-behavior-system.js',
        'game-persistence-service.js',
        'game-verification-service.js',
        'enhanced-3d-game-launcher.html',
        'game-monitoring-dashboard.html'
    ];
    
    for (const file of files) {
        try {
            const stats = await fs.stat(file);
            if (stats.isFile()) {
                // Try to load JS files to check for syntax errors
                if (file.endsWith('.js')) {
                    try {
                        require(path.resolve(file));
                        console.log(`  ${colors.green}✅ ${file} - exists and loads${colors.reset}`);
                        results.working.push(`${file} exists and has valid syntax`);
                    } catch (error) {
                        if (error.code === 'MODULE_NOT_FOUND') {
                            console.log(`  ${colors.yellow}⚠️  ${file} - missing dependencies${colors.reset}`);
                            results.partial.push(`${file} exists but has missing dependencies`);
                        } else {
                            console.log(`  ${colors.red}❌ ${file} - syntax error${colors.reset}`);
                            results.broken.push(`${file} has errors: ${error.message}`);
                        }
                    }
                } else {
                    console.log(`  ${colors.green}✅ ${file} - exists${colors.reset}`);
                    results.working.push(`${file} exists`);
                }
            }
        } catch (error) {
            console.log(`  ${colors.red}❌ ${file} - not found${colors.reset}`);
            results.broken.push(`${file} not found`);
        }
    }
    console.log();
}

// Test 2: Check database connectivity and tables
async function testDatabase() {
    console.log(`${colors.bright}2. Testing Database${colors.reset}`);
    
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/document_generator',
        max: 1,
        connectionTimeoutMillis: 5000,
    });
    
    try {
        const client = await pool.connect();
        console.log(`  ${colors.green}✅ PostgreSQL connection successful${colors.reset}`);
        results.working.push('PostgreSQL connection works');
        
        // Check for game tables
        const gameTablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE 'game_%' OR table_name LIKE 'player%' OR table_name LIKE 'ai_%')
            ORDER BY table_name
        `);
        
        console.log(`  Found ${gameTablesResult.rows.length} game-related tables:`);
        gameTablesResult.rows.forEach(row => {
            console.log(`    - ${row.table_name}`);
        });
        
        if (gameTablesResult.rows.length > 0) {
            results.partial.push(`Database has ${gameTablesResult.rows.length} game tables (but not our schema)`);
        } else {
            results.broken.push('No game tables found in database');
        }
        
        client.release();
    } catch (error) {
        console.log(`  ${colors.red}❌ Database connection failed: ${error.message}${colors.reset}`);
        results.broken.push(`Database connection failed: ${error.message}`);
    } finally {
        await pool.end();
    }
    console.log();
}

// Test 3: Check if services can start
async function testServices() {
    console.log(`${colors.bright}3. Testing Services${colors.reset}`);
    
    const services = [
        { name: 'HTTP Server', port: 8888 },
        { name: 'Game WebSocket', port: 9101 },
        { name: 'Verification WebSocket', port: 9102 },
        { name: 'Monitoring Dashboard', port: 9103 }
    ];
    
    for (const service of services) {
        const isPortFree = await checkPortFree(service.port);
        if (isPortFree) {
            console.log(`  ${colors.green}✅ Port ${service.port} is free for ${service.name}${colors.reset}`);
            results.working.push(`Port ${service.port} available for ${service.name}`);
        } else {
            console.log(`  ${colors.yellow}⚠️  Port ${service.port} is in use (${service.name})${colors.reset}`);
            results.partial.push(`Port ${service.port} already in use`);
        }
    }
    console.log();
}

// Test 4: Check HTML files
async function testHTMLFiles() {
    console.log(`${colors.bright}4. Testing HTML Interfaces${colors.reset}`);
    
    const htmlFiles = [
        'enhanced-3d-game-launcher.html',
        'game-monitoring-dashboard.html',
        'project-progress-dashboard.html'
    ];
    
    for (const file of htmlFiles) {
        try {
            const content = await fs.readFile(file, 'utf8');
            const hasThreeJS = content.includes('three.js') || content.includes('THREE');
            const hasWebSocket = content.includes('WebSocket');
            const hasCanvas = content.includes('<canvas');
            
            if (file.includes('3d-game') && hasThreeJS) {
                console.log(`  ${colors.green}✅ ${file} - has Three.js integration${colors.reset}`);
                results.working.push(`${file} properly includes Three.js`);
            } else if (file.includes('monitoring') && hasWebSocket) {
                console.log(`  ${colors.green}✅ ${file} - has WebSocket integration${colors.reset}`);
                results.working.push(`${file} has WebSocket code`);
            } else {
                console.log(`  ${colors.yellow}⚠️  ${file} - exists but untested${colors.reset}`);
                results.untested.push(`${file} exists but functionality untested`);
            }
        } catch (error) {
            console.log(`  ${colors.red}❌ ${file} - not found${colors.reset}`);
            results.broken.push(`${file} not found`);
        }
    }
    console.log();
}

// Test 5: Check documentation vs reality
async function testDocumentationClaims() {
    console.log(`${colors.bright}5. Testing Documentation Claims${colors.reset}`);
    
    // Check if launch scripts exist
    const scripts = [
        'launch-enhanced-3d-game.sh',
        'launch-verified-3d-game.sh',
        'launch-documentation-system.sh'
    ];
    
    for (const script of scripts) {
        try {
            const stats = await fs.stat(script);
            const isExecutable = (stats.mode & 0o111) !== 0;
            if (isExecutable) {
                console.log(`  ${colors.green}✅ ${script} - exists and is executable${colors.reset}`);
                results.working.push(`${script} is ready to run`);
            } else {
                console.log(`  ${colors.yellow}⚠️  ${script} - exists but not executable${colors.reset}`);
                results.partial.push(`${script} needs chmod +x`);
            }
        } catch (error) {
            console.log(`  ${colors.red}❌ ${script} - not found${colors.reset}`);
            results.broken.push(`${script} not found`);
        }
    }
    console.log();
}

// Helper: Check if port is free
function checkPortFree(port) {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        
        server.once('error', () => {
            resolve(false);
        });
        
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        
        server.listen(port);
    });
}

// Generate summary report
async function generateReport() {
    console.log(`${colors.bright}📊 REALITY CHECK SUMMARY${colors.reset}`);
    console.log('=' .repeat(60));
    
    const total = results.working.length + results.partial.length + 
                  results.broken.length + results.untested.length;
    
    console.log(`\n${colors.green}✅ ACTUALLY WORKING (${results.working.length}/${total})${colors.reset}`);
    results.working.forEach(item => console.log(`  • ${item}`));
    
    console.log(`\n${colors.yellow}⚠️  PARTIALLY WORKING (${results.partial.length}/${total})${colors.reset}`);
    results.partial.forEach(item => console.log(`  • ${item}`));
    
    console.log(`\n${colors.red}❌ BROKEN/MISSING (${results.broken.length}/${total})${colors.reset}`);
    results.broken.forEach(item => console.log(`  • ${item}`));
    
    console.log(`\n${colors.blue}❓ UNTESTED (${results.untested.length}/${total})${colors.reset}`);
    results.untested.forEach(item => console.log(`  • ${item}`));
    
    // Calculate reality score
    const score = Math.round((results.working.length / total) * 100);
    console.log(`\n${colors.bright}REALITY SCORE: ${score}%${colors.reset}`);
    
    if (score < 30) {
        console.log(`${colors.red}⚠️  Most documented features don't actually work${colors.reset}`);
    } else if (score < 70) {
        console.log(`${colors.yellow}⚠️  Some features work but many are incomplete${colors.reset}`);
    } else {
        console.log(`${colors.green}✅ Most features are actually implemented${colors.reset}`);
    }
    
    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            working: results.working.length,
            partial: results.partial.length,
            broken: results.broken.length,
            untested: results.untested.length,
            total: total,
            score: score
        },
        details: results
    };
    
    await fs.writeFile('REALITY-CHECK-REPORT.json', JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to REALITY-CHECK-REPORT.json`);
}

// Run all tests
async function runAllTests() {
    try {
        await testFileIntegrity();
        await testDatabase();
        await testServices();
        await testHTMLFiles();
        await testDocumentationClaims();
        await generateReport();
        
        console.log(`\n${colors.bright}🔍 Reality check complete!${colors.reset}\n`);
    } catch (error) {
        console.error(`\n${colors.red}Error during testing: ${error.message}${colors.reset}`);
    }
}

// Execute
runAllTests();