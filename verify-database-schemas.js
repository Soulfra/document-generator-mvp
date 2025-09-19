#!/usr/bin/env node

/**
 * DATABASE SCHEMA VERIFICATION
 * Checks all database connections, schemas, and data integrity
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database files to verify
const databases = {
    'business-accounting': './business-accounting.db',
    'economic-engine': './economic-engine.db', 
    'file-decisions': './file-decisions.db',
    'master-gaming-router': './master-gaming-router.db',
    'ai-reasoning-game': './ai_reasoning_game.db',
    'trust-handshake': './trust-handshake.db',
    'gacha-tokens': './gacha_tokens.db',
    'mascot-world': './mascot_world.db',
    'tax-intelligence': './tax-intelligence.db',
    'wallet-addresses': './wallet-addresses.db'
};

async function verifyDatabase(name, path) {
    return new Promise((resolve) => {
        if (!fs.existsSync(path)) {
            resolve({ name, status: 'missing', error: 'File does not exist' });
            return;
        }

        const db = new sqlite3.Database(path, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                resolve({ name, status: 'error', error: err.message });
                return;
            }

            // Get all tables
            db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
                if (err) {
                    resolve({ name, status: 'error', error: err.message });
                    return;
                }

                const tableNames = tables.map(t => t.name);
                
                // Get row counts for each table
                const promises = tableNames.map(tableName => {
                    return new Promise((tableResolve) => {
                        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, row) => {
                            if (err) {
                                tableResolve({ name: tableName, count: 'error', error: err.message });
                            } else {
                                tableResolve({ name: tableName, count: row.count });
                            }
                        });
                    });
                });

                Promise.all(promises).then(tableCounts => {
                    db.close();
                    resolve({
                        name,
                        status: 'connected',
                        tables: tableCounts,
                        totalTables: tableNames.length
                    });
                });
            });
        });
    });
}

async function main() {
    console.log('\n🔍 DATABASE SCHEMA VERIFICATION');
    console.log('================================\n');

    const results = [];
    
    for (const [name, dbPath] of Object.entries(databases)) {
        console.log(`📊 Checking ${name}...`);
        const result = await verifyDatabase(name, dbPath);
        results.push(result);
        
        if (result.status === 'connected') {
            console.log(`✅ ${name}: ${result.totalTables} tables`);
            result.tables.forEach(table => {
                console.log(`   - ${table.name}: ${table.count} rows`);
            });
        } else {
            console.log(`❌ ${name}: ${result.error}`);
        }
        console.log('');
    }

    // Summary
    const connected = results.filter(r => r.status === 'connected').length;
    const missing = results.filter(r => r.status === 'missing').length;
    const errors = results.filter(r => r.status === 'error').length;

    console.log('\n📋 VERIFICATION SUMMARY');
    console.log('======================');
    console.log(`✅ Connected: ${connected}`);
    console.log(`❌ Missing: ${missing}`);
    console.log(`⚠️  Errors: ${errors}`);
    console.log(`📊 Total: ${results.length}\n`);

    // Test key queries from empire-api-bridge.js
    console.log('🧪 TESTING KEY QUERIES');
    console.log('======================\n');

    // Test revenue query
    if (fs.existsSync('./business-accounting.db')) {
        const businessDb = new sqlite3.Database('./business-accounting.db', sqlite3.OPEN_READONLY);
        
        businessDb.all('SELECT * FROM transactions WHERE type = "income" ORDER BY created_at DESC LIMIT 5', [], (err, rows) => {
            if (err) {
                console.log('❌ Revenue query failed:', err.message);
            } else {
                console.log(`✅ Revenue query: Found ${rows.length} income transactions`);
                if (rows.length > 0) {
                    console.log('   Sample:', rows[0]);
                }
            }
            businessDb.close();
        });
    }

    // Test economic engine query
    if (fs.existsSync('./economic-engine.db')) {
        const economicDb = new sqlite3.Database('./economic-engine.db', sqlite3.OPEN_READONLY);
        
        economicDb.all('SELECT * FROM agent_trades ORDER BY created_at DESC LIMIT 5', [], (err, rows) => {
            if (err) {
                console.log('❌ Agent trades query failed:', err.message);
            } else {
                console.log(`✅ Agent trades query: Found ${rows.length} trades`);
                if (rows.length > 0) {
                    console.log('   Sample:', rows[0]);
                }
            }
            economicDb.close();
        });
    }

    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        summary: { connected, missing, errors, total: results.length },
        databases: results
    };

    fs.writeFileSync('./database-verification-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to database-verification-report.json');
}

main().catch(console.error);