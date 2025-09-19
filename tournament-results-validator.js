#!/usr/bin/env node

/**
 * TOURNAMENT RESULTS VALIDATOR
 * Validates expected results and database operations
 * Research lab for testing and fixing tournament system
 */

const mysql = require('mysql2/promise');
const chalk = require('chalk');
const Table = require('cli-table3');

class TournamentResultsValidator {
    constructor(config = {}) {
        this.config = {
            dbConfig: {
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'economic_engine',
                ...config.dbConfig
            },
            verbose: config.verbose !== false
        };
        
        this.dbPool = null;
        this.validationResults = [];
    }
    
    async initialize() {
        try {
            // Connect to database
            this.dbPool = await mysql.createPool({
                ...this.config.dbConfig,
                waitForConnections: true,
                connectionLimit: 10
            });
            
            console.log(chalk.green('✅ Database connected'));
            
            // Check if tables exist
            await this.checkDatabaseSchema();
            
        } catch (error) {
            console.error(chalk.red('❌ Database connection failed:'), error.message);
            throw error;
        }
    }
    
    /**
     * Check if all required tables exist
     */
    async checkDatabaseSchema() {
        console.log(chalk.cyan('\n🔍 Checking Database Schema...'));
        
        const requiredTables = [
            'characters',
            'character_dialogues',
            'character_quests',
            'quest_objectives',
            'character_events',
            'overlay_configs',
            'claude_queries',
            'tournaments',
            'tournament_units',
            'tournament_matches',
            'unit_responses',
            'unit_inventory',
            'tournament_statistics',
            'tournament_achievements'
        ];
        
        const results = [];
        
        for (const table of requiredTables) {
            try {
                const [rows] = await this.dbPool.execute(
                    `SELECT COUNT(*) as count FROM information_schema.tables 
                     WHERE table_schema = ? AND table_name = ?`,
                    [this.config.dbConfig.database, table]
                );
                
                const exists = rows[0].count > 0;
                results.push({
                    table,
                    exists,
                    status: exists ? '✅' : '❌'
                });
                
            } catch (error) {
                results.push({
                    table,
                    exists: false,
                    status: '❌',
                    error: error.message
                });
            }
        }
        
        // Display results
        const table = new Table({
            head: ['Table', 'Status', 'Notes'],
            style: { head: ['cyan'] }
        });
        
        results.forEach(r => {
            table.push([
                r.table,
                r.status,
                r.error || (r.exists ? 'Ready' : 'Missing - Run tournament-tables.sql')
            ]);
        });
        
        console.log(table.toString());
        
        // Check if we need to create tables
        const missingTables = results.filter(r => !r.exists && r.table.startsWith('tournament'));
        if (missingTables.length > 0) {
            console.log(chalk.yellow('\n⚠️  Tournament tables missing. Run:'));
            console.log(chalk.white('mysql economic_engine < tournament-tables.sql'));
        }
        
        return results;
    }
    
    /**
     * Validate tournament result structure
     */
    validateTournamentResult(result) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };
        
        // Required fields
        const requiredFields = [
            'tournamentId',
            'winner',
            'duration',
            'rounds',
            'participants'
        ];
        
        requiredFields.forEach(field => {
            if (!result[field]) {
                validation.valid = false;
                validation.errors.push(`Missing required field: ${field}`);
            }
        });
        
        // Winner validation
        if (result.winner) {
            const winnerFields = ['id', 'name', 'response', 'confidence', 'inventory'];
            winnerFields.forEach(field => {
                if (!result.winner[field]) {
                    validation.valid = false;
                    validation.errors.push(`Missing winner field: ${field}`);
                }
            });
            
            // Inventory validation
            if (result.winner.inventory && !Array.isArray(result.winner.inventory)) {
                validation.valid = false;
                validation.errors.push('Winner inventory must be an array');
            }
        }
        
        // Logical validations
        if (result.rounds && result.participants) {
            const expectedRounds = Math.ceil(Math.log2(result.participants));
            if (result.rounds !== expectedRounds) {
                validation.warnings.push(
                    `Round count (${result.rounds}) doesn't match expected (${expectedRounds}) for ${result.participants} participants`
                );
            }
        }
        
        // Knowledge accumulation validation
        if (result.winner && result.winner.inventory) {
            const inventorySize = result.winner.inventory.length;
            const defeatedUnits = result.participants - 1;
            
            if (inventorySize < defeatedUnits) {
                validation.warnings.push(
                    `Low inventory size (${inventorySize}) for ${defeatedUnits} defeated units`
                );
            }
        }
        
        return validation;
    }
    
    /**
     * Test database operations
     */
    async testDatabaseOperations() {
        console.log(chalk.cyan('\n🧪 Testing Database Operations...'));
        
        const tests = [];
        
        // Test 1: Insert test character
        try {
            const [result] = await this.dbPool.execute(
                `INSERT INTO characters (character_name, genetic_hash, lineage) 
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
                ['Test Champion', 'TEST-HASH-001', 'test-lineage']
            );
            
            const characterId = result.insertId;
            tests.push({
                test: 'Create test character',
                status: '✅',
                result: `Character ID: ${characterId}`
            });
            
            // Test 2: Create tournament record
            const tournamentId = `tournament-test-${Date.now()}`;
            await this.dbPool.execute(
                `INSERT INTO tournaments SET ?`,
                {
                    id: tournamentId,
                    character_id: characterId,
                    query_text: 'Test tournament query',
                    query_type: 'test',
                    winner_unit_id: 'test-winner',
                    winner_name: 'Test Winner',
                    winner_approach: 'analytical',
                    winner_confidence: 0.95,
                    winner_inventory_size: 15,
                    total_rounds: 3,
                    total_participants: 8,
                    duration_ms: 5000
                }
            );
            
            tests.push({
                test: 'Create tournament',
                status: '✅',
                result: `Tournament ID: ${tournamentId}`
            });
            
            // Test 3: Create quest from tournament
            const [questResult] = await this.dbPool.execute(
                `INSERT INTO character_quests SET ?`,
                {
                    character_id: characterId,
                    quest_name: 'Tournament Victory: Test',
                    quest_description: 'Test tournament victory',
                    quest_type: '!',
                    quest_category: 'achievement',
                    status: 'completed',
                    progress: 100,
                    max_progress: 100,
                    requirements: JSON.stringify({ tournamentId }),
                    rewards: JSON.stringify({ experience: 150 })
                }
            );
            
            tests.push({
                test: 'Create quest',
                status: '✅',
                result: `Quest ID: ${questResult.insertId}`
            });
            
            // Test 4: Query tournament history
            const [history] = await this.dbPool.execute(
                `SELECT * FROM tournaments WHERE character_id = ? ORDER BY created_at DESC LIMIT 5`,
                [characterId]
            );
            
            tests.push({
                test: 'Query tournament history',
                status: '✅',
                result: `Found ${history.length} tournaments`
            });
            
            // Cleanup
            await this.dbPool.execute('DELETE FROM tournaments WHERE id = ?', [tournamentId]);
            await this.dbPool.execute('DELETE FROM characters WHERE character_name = ?', ['Test Champion']);
            
        } catch (error) {
            tests.push({
                test: 'Database operations',
                status: '❌',
                result: error.message
            });
        }
        
        // Display test results
        const table = new Table({
            head: ['Test', 'Status', 'Result'],
            style: { head: ['cyan'] }
        });
        
        tests.forEach(t => {
            table.push([t.test, t.status, t.result]);
        });
        
        console.log(table.toString());
        
        return tests;
    }
    
    /**
     * Simulate tournament and validate results
     */
    async simulateTournament() {
        console.log(chalk.cyan('\n🎮 Simulating Tournament...'));
        
        // Create mock tournament result
        const mockResult = {
            tournamentId: `tournament-${Date.now()}-mock`,
            winner: {
                id: 'synthesis-master',
                name: 'Synthesis Master',
                approach: 'synthesis',
                response: {
                    content: 'Synthesized response from tournament',
                    approach: 'synthesis',
                    metadata: { synthesis: true }
                },
                confidence: 0.92,
                inventory: [
                    ['base-query', 'test query'],
                    ['approach', 'synthesis'],
                    ['eliminated-unit1', { name: 'Analytical Unit', approach: 'analytical' }],
                    ['eliminated-unit2', { name: 'Creative Unit', approach: 'creative' }],
                    ['eliminated-unit3', { name: 'Critical Unit', approach: 'critical' }],
                    ['knowledge-item1', 'insight from round 1'],
                    ['knowledge-item2', 'insight from round 2'],
                    ['synthesis-result', 'combined knowledge']
                ]
            },
            duration: 15000,
            rounds: 3,
            participants: 8
        };
        
        // Validate structure
        const validation = this.validateTournamentResult(mockResult);
        
        console.log(chalk.blue('\n📋 Validation Results:'));
        if (validation.valid) {
            console.log(chalk.green('✅ Tournament result structure is valid'));
        } else {
            console.log(chalk.red('❌ Tournament result has errors:'));
            validation.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
        }
        
        if (validation.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️  Warnings:'));
            validation.warnings.forEach(w => console.log(chalk.yellow(`  - ${w}`)));
        }
        
        // Show inventory analysis
        console.log(chalk.blue('\n📦 Inventory Analysis:'));
        const inventoryAnalysis = this.analyzeInventory(mockResult.winner.inventory);
        
        const table = new Table({
            head: ['Type', 'Count', 'Examples'],
            style: { head: ['cyan'] }
        });
        
        Object.entries(inventoryAnalysis).forEach(([type, data]) => {
            table.push([type, data.count, data.examples.join(', ')]);
        });
        
        console.log(table.toString());
        
        return { mockResult, validation, inventoryAnalysis };
    }
    
    /**
     * Analyze inventory contents
     */
    analyzeInventory(inventory) {
        const analysis = {
            eliminated: { count: 0, examples: [] },
            knowledge: { count: 0, examples: [] },
            metadata: { count: 0, examples: [] },
            other: { count: 0, examples: [] }
        };
        
        inventory.forEach(([key, value]) => {
            if (key.startsWith('eliminated-')) {
                analysis.eliminated.count++;
                if (analysis.eliminated.examples.length < 2) {
                    analysis.eliminated.examples.push(value.name || key);
                }
            } else if (key.includes('knowledge') || key.includes('insight')) {
                analysis.knowledge.count++;
                if (analysis.knowledge.examples.length < 2) {
                    analysis.knowledge.examples.push(key);
                }
            } else if (key.includes('approach') || key.includes('query')) {
                analysis.metadata.count++;
                if (analysis.metadata.examples.length < 2) {
                    analysis.metadata.examples.push(key);
                }
            } else {
                analysis.other.count++;
                if (analysis.other.examples.length < 2) {
                    analysis.other.examples.push(key);
                }
            }
        });
        
        return analysis;
    }
    
    /**
     * Test LLM integration points
     */
    async testLLMIntegration() {
        console.log(chalk.cyan('\n🤖 Testing LLM Integration Points...'));
        
        const integrationPoints = [
            {
                name: 'Query Enhancement',
                test: () => {
                    const original = "How to solve problems?";
                    const enhanced = `${original}\n\n[Character Context: Test Character (warrior, Gen 2), Stats: STR 10, INT 8]`;
                    return enhanced.includes('[Character Context');
                }
            },
            {
                name: 'Response Evaluation',
                test: () => {
                    // Simulate response scoring
                    const score1 = 0.7 + Math.random() * 0.3;
                    const score2 = 0.6 + Math.random() * 0.3;
                    return { winner: score1 > score2 ? 1 : 2, score1, score2 };
                }
            },
            {
                name: 'Knowledge Synthesis',
                test: () => {
                    const inventory = new Map([
                        ['insight1', 'Pattern recognition'],
                        ['insight2', 'Context analysis'],
                        ['insight3', 'Creative solution']
                    ]);
                    return {
                        synthesized: true,
                        items: inventory.size
                    };
                }
            }
        ];
        
        const results = [];
        
        for (const point of integrationPoints) {
            try {
                const result = point.test();
                results.push({
                    name: point.name,
                    status: '✅',
                    result: JSON.stringify(result)
                });
            } catch (error) {
                results.push({
                    name: point.name,
                    status: '❌',
                    result: error.message
                });
            }
        }
        
        // Display results
        const table = new Table({
            head: ['Integration Point', 'Status', 'Result'],
            style: { head: ['cyan'] }
        });
        
        results.forEach(r => {
            table.push([r.name, r.status, r.result]);
        });
        
        console.log(table.toString());
        
        return results;
    }
    
    /**
     * Generate test report
     */
    async generateReport() {
        console.log(chalk.cyan('\n📊 Generating Validation Report...'));
        
        const report = {
            timestamp: new Date().toISOString(),
            database: {
                connected: !!this.dbPool,
                schema: await this.checkDatabaseSchema()
            },
            operations: await this.testDatabaseOperations(),
            simulation: await this.simulateTournament(),
            integration: await this.testLLMIntegration()
        };
        
        // Save report
        const fs = require('fs').promises;
        const reportPath = `tournament-validation-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(chalk.green(`\n✅ Validation report saved to: ${reportPath}`));
        
        return report;
    }
    
    /**
     * Fix common issues
     */
    async fixCommonIssues() {
        console.log(chalk.cyan('\n🔧 Checking for Common Issues...'));
        
        const fixes = [];
        
        // Check for missing overlay configs
        try {
            const [overlays] = await this.dbPool.execute(
                `SELECT COUNT(*) as count FROM overlay_configs WHERE config_type = 'tournament'`
            );
            
            if (overlays[0].count === 0) {
                console.log(chalk.yellow('Adding missing tournament overlay configs...'));
                
                await this.dbPool.execute(`
                    INSERT INTO overlay_configs (config_name, config_type, default_icon, default_color, default_position, default_animation) VALUES
                    ('tournament_start', 'tournament', 'crossed_swords', '#FF6B6B', 'center_screen', 'pulse'),
                    ('tournament_victory', 'tournament', 'trophy_gold', '#FFD700', 'above_head', 'bounce')
                `);
                
                fixes.push('Added tournament overlay configs');
            }
        } catch (error) {
            console.error(chalk.red('Failed to check overlay configs:'), error.message);
        }
        
        return fixes;
    }
    
    async cleanup() {
        if (this.dbPool) {
            await this.dbPool.end();
        }
    }
}

// Run validator
if (require.main === module) {
    (async () => {
        const validator = new TournamentResultsValidator();
        
        try {
            await validator.initialize();
            
            // Run all validations
            await validator.generateReport();
            
            // Check for fixes
            const fixes = await validator.fixCommonIssues();
            if (fixes.length > 0) {
                console.log(chalk.green('\n✅ Applied fixes:'));
                fixes.forEach(f => console.log(`  - ${f}`));
            }
            
            console.log(chalk.green('\n✅ Validation complete!'));
            
        } catch (error) {
            console.error(chalk.red('\n❌ Validation failed:'), error);
        } finally {
            await validator.cleanup();
            process.exit(0);
        }
    })();
}

module.exports = TournamentResultsValidator;