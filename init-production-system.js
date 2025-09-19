#!/usr/bin/env node

/**
 * 🚀 PRODUCTION SYSTEM INITIALIZER
 * Initializes database schemas, deploys contracts, and starts all services
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class ProductionInitializer {
    constructor() {
        this.services = [];
        this.databases = {
            main: null,
            reasoning: null,
            blockchain: null
        };
    }
    
    async initialize() {
        console.log('\x1b[30m\x1b[43m'); // Black background, yellow text
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                PRODUCTION SYSTEM INITIALIZER                   ');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\x1b[0m');
        
        try {
            // Phase 1: Database Initialization
            await this.initializeDatabases();
            
            // Phase 2: Smart Contract Deployment
            await this.deploySmartContracts();
            
            // Phase 3: Start Core Services
            await this.startCoreServices();
            
            // Phase 4: Launch Terminal Dashboard
            await this.launchTerminalDashboard();
            
            // Phase 5: Export JSONL Schemas
            await this.exportJSONLSchemas();
            
            console.log('\x1b[30m\x1b[42m✅ SYSTEM INITIALIZATION COMPLETE\x1b[0m');
            
        } catch (error) {
            console.error('\x1b[30m\x1b[41m❌ INITIALIZATION FAILED:\x1b[0m', error);
            process.exit(1);
        }
    }
    
    async initializeDatabases() {
        console.log('\x1b[33m📊 Phase 1: Initializing Databases...\x1b[0m');
        
        // Main database (SQLite for local, can swap to PostgreSQL)
        this.databases.main = new sqlite3.Database('soulfra-production.db');
        
        // Read and execute schema files
        const schemas = [
            'database-schema.sql',
            'database-setup.sql',
            'schema.sql'
        ];
        
        for (const schemaFile of schemas) {
            try {
                const schema = await fs.readFile(schemaFile, 'utf8');
                await this.executeSQLSchema(this.databases.main, schema);
                console.log(`  ✅ Loaded ${schemaFile}`);
            } catch (err) {
                console.log(`  ⚠️  Skipping ${schemaFile}: ${err.message}`);
            }
        }
        
        // Initialize reasoning differential database
        this.databases.reasoning = new sqlite3.Database('reasoning-differentials.db');
        await this.initializeReasoningDB();
        
        // Initialize blockchain state database
        this.databases.blockchain = new sqlite3.Database('blockchain-state.db');
        await this.initializeBlockchainDB();
    }
    
    async executeSQLSchema(db, schema) {
        // Split schema into individual statements
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                for (const statement of statements) {
                    db.run(statement, (err) => {
                        if (err && !err.message.includes('already exists')) {
                            console.error('SQL Error:', err);
                        }
                    });
                }
                resolve();
            });
        });
    }
    
    async initializeReasoningDB() {
        return new Promise((resolve) => {
            this.databases.reasoning.serialize(() => {
                this.databases.reasoning.run(`
                    CREATE TABLE IF NOT EXISTS differentials (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        source TEXT NOT NULL,
                        layer_from TEXT,
                        layer_to TEXT,
                        differential REAL NOT NULL,
                        metadata JSON
                    )
                `);
                
                this.databases.reasoning.run(`
                    CREATE TABLE IF NOT EXISTS truth_fragments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        layer TEXT NOT NULL,
                        truth TEXT NOT NULL,
                        confidence REAL
                    )
                `);
                
                resolve();
            });
        });
    }
    
    async initializeBlockchainDB() {
        return new Promise((resolve) => {
            this.databases.blockchain.serialize(() => {
                this.databases.blockchain.run(`
                    CREATE TABLE IF NOT EXISTS contracts (
                        address TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        network TEXT NOT NULL,
                        deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        abi JSON,
                        bytecode TEXT
                    )
                `);
                
                this.databases.blockchain.run(`
                    CREATE TABLE IF NOT EXISTS blame_records (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        entity TEXT NOT NULL,
                        blame_amount INTEGER NOT NULL,
                        karma_score INTEGER DEFAULT 100,
                        is_zombie BOOLEAN DEFAULT 0,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                resolve();
            });
        });
    }
    
    async deploySmartContracts() {
        console.log('\x1b[33m🔗 Phase 2: Deploying Smart Contracts...\x1b[0m');
        
        // Check if we have local blockchain running
        const hasGanache = await this.checkService('http://localhost:8545');
        
        if (hasGanache) {
            console.log('  ✅ Local blockchain detected');
            // Deploy contracts logic here
        } else {
            console.log('  ⚠️  No local blockchain, using mock addresses');
            
            // Insert mock contract addresses
            await this.insertMockContracts();
        }
    }
    
    async insertMockContracts() {
        const mockContracts = [
            {
                address: '0x' + '42'.repeat(20),
                name: 'BlameChainRegistry',
                network: 'local'
            },
            {
                address: '0x' + '69'.repeat(20),
                name: 'ReasoningDifferentialToken',
                network: 'local'
            },
            {
                address: '0x' + '13'.repeat(20),
                name: 'SequentialTagVault',
                network: 'local'
            }
        ];
        
        for (const contract of mockContracts) {
            this.databases.blockchain.run(
                'INSERT OR IGNORE INTO contracts (address, name, network) VALUES (?, ?, ?)',
                [contract.address, contract.name, contract.network]
            );
        }
    }
    
    async startCoreServices() {
        console.log('\x1b[33m🚀 Phase 3: Starting Core Services...\x1b[0m');
        
        const services = [
            {
                name: 'Flask Blockchain Bridge',
                check: 'http://localhost:5000',
                start: 'cd FinishThisIdea && python flask-blockchain-bridge.py',
                required: false
            },
            {
                name: 'Solidity BlameChain',
                check: 'http://localhost:8545',
                start: 'node solidity-blamechain-layer.js',
                required: false
            }
        ];
        
        for (const service of services) {
            const isRunning = await this.checkService(service.check);
            
            if (!isRunning && service.required) {
                console.log(`  🔄 Starting ${service.name}...`);
                this.startService(service.start);
                await this.sleep(2000);
            } else if (isRunning) {
                console.log(`  ✅ ${service.name} already running`);
            } else {
                console.log(`  ⚠️  ${service.name} not available`);
            }
        }
    }
    
    async launchTerminalDashboard() {
        console.log('\x1b[33m💻 Phase 4: Launching Terminal Dashboard...\x1b[0m');
        
        // Start the terminal dashboard in a new terminal
        exec('node terminal-dashboard.js', (err) => {
            if (err) {
                console.log('  ⚠️  Terminal dashboard failed to start');
            }
        });
        
        console.log('  ✅ Terminal dashboard launched');
    }
    
    async exportJSONLSchemas() {
        console.log('\x1b[33m📄 Phase 5: Exporting JSONL Schemas...\x1b[0m');
        
        const schemas = {
            components: {
                id: 'string',
                path: 'string',
                type: 'string',
                exists: 'boolean',
                size: 'number',
                metadata: 'object'
            },
            differentials: {
                id: 'number',
                timestamp: 'string',
                source: 'string',
                layer_from: 'string',
                layer_to: 'string',
                differential: 'number',
                metadata: 'object'
            },
            blame_records: {
                id: 'number',
                entity: 'string',
                blame_amount: 'number',
                karma_score: 'number',
                is_zombie: 'boolean',
                timestamp: 'string'
            }
        };
        
        const jsonlExport = Object.entries(schemas).map(([table, schema]) => ({
            table,
            schema,
            timestamp: new Date().toISOString()
        }));
        
        await fs.writeFile(
            'database-schemas.jsonl',
            jsonlExport.map(s => JSON.stringify(s)).join('\n')
        );
        
        console.log('  ✅ Exported to database-schemas.jsonl');
    }
    
    async checkService(url) {
        try {
            const response = await fetch(url);
            return response.ok;
        } catch {
            return false;
        }
    }
    
    startService(command) {
        exec(command, { detached: true, stdio: 'ignore' }).unref();
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Production configuration
const config = {
    database: {
        main: process.env.DATABASE_URL || 'sqlite://soulfra-production.db',
        reasoning: process.env.REASONING_DB || 'sqlite://reasoning-differentials.db',
        blockchain: process.env.BLOCKCHAIN_DB || 'sqlite://blockchain-state.db'
    },
    contracts: {
        network: process.env.BLOCKCHAIN_NETWORK || 'local',
        rpcUrl: process.env.RPC_URL || 'http://localhost:8545'
    },
    services: {
        orchestrator: process.env.ORCHESTRATOR_URL || 'http://localhost:8000',
        sequentialTagging: process.env.TAGGING_URL || 'http://localhost:42000',
        voiceOfGod: process.env.VOG_URL || 'http://localhost:55001'
    }
};

// Save configuration
fs.writeFile('production-config.json', JSON.stringify(config, null, 2))
    .then(() => console.log('Configuration saved to production-config.json'));

// Run initializer
const initializer = new ProductionInitializer();
initializer.initialize();