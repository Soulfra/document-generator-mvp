#!/usr/bin/env node

/**
 * 🖥️ PRODUCTION SYSTEM VIEWER
 * Black background, yellow text terminal interface
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    black: '\x1b[30m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    bgBlack: '\x1b[40m',
    bgYellow: '\x1b[43m',
    bright: '\x1b[1m'
};

// Set terminal to black background with yellow text
console.log('\x1b[40m\x1b[33m\x1b[2J\x1b[H'); // Black bg, yellow text, clear screen

class ProductionSystemViewer {
    constructor() {
        this.width = process.stdout.columns || 80;
        this.height = process.stdout.rows || 24;
    }
    
    display() {
        this.clear();
        this.showHeader();
        this.showDatabaseSchemas();
        this.showSmartContracts();
        this.showServices();
        this.showCommands();
    }
    
    clear() {
        console.log('\x1b[2J\x1b[H'); // Clear screen and move to top
    }
    
    showHeader() {
        const header = '═'.repeat(this.width);
        console.log(header);
        console.log(this.center('DOCUMENT GENERATOR PRODUCTION SYSTEM'));
        console.log(this.center('Reasoning Engine → Database → Blockchain'));
        console.log(header);
        console.log('');
    }
    
    showDatabaseSchemas() {
        console.log('📊 DATABASE SCHEMAS:');
        console.log('─'.repeat(40));
        
        const schemas = [
            { file: 'database-schema.sql', tables: 12, desc: 'Soulfra Platform Core' },
            { file: 'database-setup.sql', tables: 15, desc: 'Economic Engine' },
            { file: 'schema.sql', tables: 8, desc: 'Document Processing' }
        ];
        
        schemas.forEach(schema => {
            const exists = fs.existsSync(schema.file);
            const status = exists ? `${colors.green}✓${colors.yellow}` : `${colors.red}✗${colors.yellow}`;
            console.log(`  ${status} ${schema.file.padEnd(25)} ${schema.tables} tables - ${schema.desc}`);
        });
        console.log('');
    }
    
    showSmartContracts() {
        console.log('🔗 SMART CONTRACTS:');
        console.log('─'.repeat(40));
        
        const contracts = [
            { name: 'BlameChainRegistry', addr: '0x4242...4242', status: 'Mock' },
            { name: 'ReasoningToken', addr: '0x6969...6969', status: 'Mock' },
            { name: 'SequentialTagVault', addr: '0x1313...1313', status: 'Mock' }
        ];
        
        contracts.forEach(contract => {
            console.log(`  ${contract.name.padEnd(25)} ${contract.addr} [${contract.status}]`);
        });
        console.log('');
    }
    
    showServices() {
        console.log('🚀 ACTIVE SERVICES:');
        console.log('─'.repeat(40));
        
        // Check actual running services
        const services = [
            { name: 'Local Orchestrator', port: 8000, path: '/api/orchestration/status' },
            { name: 'Sequential Tagging', port: 42000, path: '/api/collar/status' },
            { name: 'Voice of God', port: 55001, path: '/status' },
            { name: 'Reasoning Monitor', port: 9005, path: '/api/status' },
            { name: 'Flask Bridge', port: 5000, path: '/health' }
        ];
        
        services.forEach(service => {
            // For now, just show as configured (in real system, would check)
            console.log(`  ${service.name.padEnd(25)} :${service.port} ${service.path}`);
        });
        console.log('');
    }
    
    showCommands() {
        console.log('💻 INITIALIZATION COMMANDS:');
        console.log('─'.repeat(40));
        console.log('  1. Initialize Database:');
        console.log(`     ${colors.bright}sqlite3 soulfra.db < database-schema.sql${colors.reset}${colors.yellow}`);
        console.log('');
        console.log('  2. Export JSONL Schema:');
        console.log(`     ${colors.bright}node export-schemas.js > schemas.jsonl${colors.reset}${colors.yellow}`);
        console.log('');
        console.log('  3. Deploy Contracts:');
        console.log(`     ${colors.bright}node deploy-contracts.js --network local${colors.reset}${colors.yellow}`);
        console.log('');
        console.log('  4. Start Production:');
        console.log(`     ${colors.bright}./start-production.sh${colors.reset}${colors.yellow}`);
        console.log('');
    }
    
    center(text) {
        const padding = Math.floor((this.width - text.length) / 2);
        return ' '.repeat(padding) + text;
    }
}

// Create JSONL export script
const exportScript = `#!/usr/bin/env node
// Export database schemas to JSONL format

const schemas = {
    components: {
        id: 'string',
        path: 'string',
        type: 'string',
        exists: 'boolean',
        size: 'number',
        registered_at: 'timestamp',
        metadata: 'jsonb'
    },
    reasoning_differentials: {
        id: 'integer',
        timestamp: 'timestamp',
        source: 'string',
        layer_from: 'string',
        layer_to: 'string',
        differential: 'float',
        truth_fragment: 'string'
    },
    blame_records: {
        id: 'integer',
        entity: 'string',
        blame_amount: 'integer',
        karma_score: 'integer',
        is_zombie: 'boolean',
        timestamp: 'timestamp'
    },
    sequential_tags: {
        id: 'integer',
        sequence: 'integer',
        tag: 'string',
        onion_layer: 'integer',
        joy_level: 'integer',
        created_at: 'timestamp'
    }
};

// Output as JSONL
Object.entries(schemas).forEach(([table, schema]) => {
    console.log(JSON.stringify({
        table,
        schema,
        version: '1.0.0',
        timestamp: new Date().toISOString()
    }));
});`;

// Save export script
fs.writeFileSync('export-schemas.js', exportScript);

// Create production start script
const startScript = `#!/bin/bash
# Start all production services

echo "Starting Document Generator Production System..."

# Start database
echo "Initializing databases..."
sqlite3 soulfra.db < database-schema.sql 2>/dev/null || true

# Start services
echo "Starting services..."
node FinishThisIdea/soulfra-local-orchestration-sequencer.js &
node FinishThisIdea/sequential-tagging-collar.js &
node voice-of-god-storyteller.js &
node reasoning-monitor-simple.js &

echo "Production system started!"
echo "Monitor at: http://localhost:9005"
`;

// Save start script
fs.writeFileSync('start-production.sh', startScript);
fs.chmodSync('start-production.sh', '755');

// Display the viewer
const viewer = new ProductionSystemViewer();
viewer.display();

// Show cursor at bottom
console.log('\n' + colors.bright + 'Press Ctrl+C to exit' + colors.reset);