#!/usr/bin/env node

/**
 * Debug Flow Orchestrator
 * Intelligent error handling, categorization, and routing system
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const util = require('util');

class DebugFlowOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.db = null;
        this.errorPatterns = new Map();
        this.debugStrategies = new Map();
        this.activeDebugSessions = new Map();
        this.errorHandlers = new Map();
        
        this.initializePatterns();
        this.initializeStrategies();
    }

    async initialize() {
        console.log('🐛 Initializing Debug Flow Orchestrator...');
        
        // Initialize database
        await this.initializeDatabase();
        
        // Load error patterns
        await this.loadErrorPatterns();
        
        // Set up global error handlers
        this.setupGlobalHandlers();
        
        // Initialize character-specific debuggers
        await this.initializeCharacterDebuggers();
        
        console.log('✅ Debug Flow Orchestrator initialized');
        return this;
    }

    initializePatterns() {
        // Common error patterns and their categories
        this.errorPatterns.set('syntax', {
            patterns: [
                /SyntaxError/,
                /Unexpected token/,
                /Unexpected identifier/,
                /missing \)/,
                /Invalid or unexpected token/
            ],
            category: 'syntax',
            severity: 'medium',
            character: 'Arty' // Arty handles code beauty and syntax
        });

        this.errorPatterns.set('runtime', {
            patterns: [
                /ReferenceError/,
                /TypeError/,
                /Cannot read prop/,
                /is not a function/,
                /is not defined/
            ],
            category: 'runtime',
            severity: 'high',
            character: 'Ralph' // Ralph finds runtime issues
        });

        this.errorPatterns.set('async', {
            patterns: [
                /UnhandledPromiseRejection/,
                /async/,
                /await/,
                /Promise/,
                /callback/
            ],
            category: 'async',
            severity: 'high',
            character: 'Cal' // Cal handles complex async flows
        });

        this.errorPatterns.set('network', {
            patterns: [
                /ECONNREFUSED/,
                /ETIMEDOUT/,
                /ENOTFOUND/,
                /fetch failed/,
                /Network/
            ],
            category: 'network',
            severity: 'medium',
            character: 'Ralph' // Ralph tests network issues
        });

        this.errorPatterns.set('database', {
            patterns: [
                /SQLITE_/,
                /ER_/,
                /database/,
                /table .* doesn't exist/,
                /constraint/
            ],
            category: 'database',
            severity: 'critical',
            character: 'Cal' // Cal manages data architecture
        });

        this.errorPatterns.set('security', {
            patterns: [
                /permission denied/,
                /unauthorized/,
                /forbidden/,
                /CORS/,
                /CSP/
            ],
            category: 'security',
            severity: 'critical',
            character: 'Ralph' // Ralph handles security testing
        });
    }

    initializeStrategies() {
        // Debug strategies for each error category
        this.debugStrategies.set('syntax', {
            steps: [
                'Parse error location',
                'Check for missing semicolons/brackets',
                'Validate syntax with linter',
                'Suggest fixes'
            ],
            tools: ['eslint', 'prettier', 'syntax-highlighter']
        });

        this.debugStrategies.set('runtime', {
            steps: [
                'Identify undefined variables',
                'Check type mismatches',
                'Trace execution path',
                'Add defensive checks'
            ],
            tools: ['debugger', 'console.trace', 'type-checker']
        });

        this.debugStrategies.set('async', {
            steps: [
                'Trace promise chains',
                'Check for missing await',
                'Add try-catch blocks',
                'Implement proper error propagation'
            ],
            tools: ['async-hooks', 'promise-tracker']
        });

        this.debugStrategies.set('network', {
            steps: [
                'Check service availability',
                'Verify URLs and ports',
                'Test with curl/fetch',
                'Add retry logic'
            ],
            tools: ['ping', 'netstat', 'wireshark']
        });

        this.debugStrategies.set('database', {
            steps: [
                'Check connection string',
                'Verify table schemas',
                'Test queries directly',
                'Add migration checks'
            ],
            tools: ['db-client', 'migration-tool', 'query-analyzer']
        });
    }

    async initializeDatabase() {
        this.db = new sqlite3.Database('./debug-orchestrator.db');
        
        const tables = [
            `CREATE TABLE IF NOT EXISTS error_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                error_hash TEXT,
                error_type TEXT,
                error_message TEXT,
                stack_trace TEXT,
                category TEXT,
                severity TEXT,
                file_path TEXT,
                line_number INTEGER,
                assigned_character TEXT,
                status TEXT DEFAULT 'new',
                solution TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved_at DATETIME
            )`,
            `CREATE TABLE IF NOT EXISTS debug_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE,
                error_id INTEGER,
                character_name TEXT,
                strategy TEXT,
                steps_completed TEXT,
                status TEXT,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME
            )`,
            `CREATE TABLE IF NOT EXISTS error_patterns_learned (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT,
                category TEXT,
                solution_template TEXT,
                success_rate REAL,
                times_used INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await new Promise((resolve, reject) => {
                this.db.run(table, err => err ? reject(err) : resolve());
            });
        }
    }

    async loadErrorPatterns() {
        // Load any learned patterns from database
        const learned = await new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM error_patterns_learned WHERE success_rate > 0.7',
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });

        console.log(`📚 Loaded ${learned.length} learned error patterns`);
    }

    setupGlobalHandlers() {
        // Catch unhandled errors
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            this.handleError(error, { source: 'uncaughtException' });
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection:', reason);
            this.handleError(reason, { source: 'unhandledRejection', promise });
        });

        // Override console.error to capture all errors
        const originalError = console.error;
        console.error = (...args) => {
            originalError.apply(console, args);
            const error = args[0];
            if (error instanceof Error) {
                this.handleError(error, { source: 'console.error' });
            }
        };
    }

    async handleError(error, context = {}) {
        const errorInfo = this.parseError(error);
        const category = this.categorizeError(errorInfo);
        const character = this.assignCharacter(category);
        
        console.log(`\n🔍 Debug Orchestrator: Analyzing ${category.category} error`);
        console.log(`   Severity: ${category.severity}`);
        console.log(`   Assigned to: ${character}`);
        
        // Generate error hash for deduplication
        const errorHash = this.generateErrorHash(errorInfo);
        
        // Check if we've seen this error before
        const existing = await this.checkExistingError(errorHash);
        if (existing && existing.solution) {
            console.log(`   ✓ Found previous solution!`);
            this.emit('error:resolved', {
                error: errorInfo,
                solution: existing.solution,
                automatic: true
            });
            return existing.solution;
        }
        
        // Log error to database
        const errorId = await this.logError(errorInfo, category, character, errorHash);
        
        // Create debug session
        const sessionId = await this.createDebugSession(errorId, character, category.category);
        
        // Start debugging process
        this.startDebugging(sessionId, errorInfo, category, character);
        
        return {
            errorId,
            sessionId,
            category: category.category,
            character,
            status: 'debugging'
        };
    }

    parseError(error) {
        if (typeof error === 'string') {
            return {
                message: error,
                type: 'string',
                stack: new Error().stack
            };
        }
        
        return {
            message: error.message || 'Unknown error',
            type: error.name || error.constructor.name,
            stack: error.stack || new Error().stack,
            code: error.code,
            file: this.extractFileFromStack(error.stack),
            line: this.extractLineFromStack(error.stack)
        };
    }

    extractFileFromStack(stack) {
        if (!stack) return null;
        const match = stack.match(/at .* \((.+):(\d+):(\d+)\)/);
        return match ? match[1] : null;
    }

    extractLineFromStack(stack) {
        if (!stack) return null;
        const match = stack.match(/at .* \((.+):(\d+):(\d+)\)/);
        return match ? parseInt(match[2]) : null;
    }

    categorizeError(errorInfo) {
        const errorString = `${errorInfo.type} ${errorInfo.message} ${errorInfo.stack}`;
        
        for (const [name, config] of this.errorPatterns.entries()) {
            for (const pattern of config.patterns) {
                if (pattern.test(errorString)) {
                    return config;
                }
            }
        }
        
        // Default category
        return {
            category: 'unknown',
            severity: 'medium',
            character: 'Cal'
        };
    }

    assignCharacter(category) {
        return category.character || 'Cal';
    }

    generateErrorHash(errorInfo) {
        const crypto = require('crypto');
        const content = `${errorInfo.type}:${errorInfo.message}:${errorInfo.file}:${errorInfo.line}`;
        return crypto.createHash('md5').update(content).digest('hex');
    }

    async checkExistingError(errorHash) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM error_logs WHERE error_hash = ? AND solution IS NOT NULL',
                [errorHash],
                (err, row) => err ? reject(err) : resolve(row)
            );
        });
    }

    async logError(errorInfo, category, character, errorHash) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO error_logs 
                (error_hash, error_type, error_message, stack_trace, category, 
                 severity, file_path, line_number, assigned_character)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                errorHash,
                errorInfo.type,
                errorInfo.message,
                errorInfo.stack,
                category.category,
                category.severity,
                errorInfo.file,
                errorInfo.line,
                character
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async createDebugSession(errorId, character, category) {
        const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO debug_sessions 
                (session_id, error_id, character_name, strategy, status)
                VALUES (?, ?, ?, ?, 'active')
            `, [sessionId, errorId, character, category], 
            err => err ? reject(err) : resolve());
        });
        
        return sessionId;
    }

    async startDebugging(sessionId, errorInfo, category, character) {
        console.log(`\n🔧 Starting debug session ${sessionId}`);
        
        const strategy = this.debugStrategies.get(category.category) || {
            steps: ['Analyze error', 'Search for solutions', 'Apply fix'],
            tools: ['general-debugger']
        };
        
        this.activeDebugSessions.set(sessionId, {
            errorInfo,
            category,
            character,
            strategy,
            currentStep: 0
        });
        
        // Execute debugging steps
        for (let i = 0; i < strategy.steps.length; i++) {
            const step = strategy.steps[i];
            console.log(`   Step ${i + 1}: ${step}`);
            
            // Simulate step execution
            await this.executeDebugStep(sessionId, step, i);
            
            // Update progress
            await this.updateDebugProgress(sessionId, i + 1);
        }
        
        // Generate solution
        const solution = await this.generateSolution(errorInfo, category, strategy);
        
        // Update error log with solution
        await this.saveSolution(sessionId, solution);
        
        console.log(`\n✅ Debug session ${sessionId} completed`);
        console.log(`   Solution: ${solution.summary}`);
        
        this.emit('debug:completed', {
            sessionId,
            errorInfo,
            solution
        });
    }

    async executeDebugStep(sessionId, step, stepIndex) {
        // Simulate step execution with delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Emit progress event
        this.emit('debug:progress', {
            sessionId,
            step,
            stepIndex,
            total: this.activeDebugSessions.get(sessionId).strategy.steps.length
        });
    }

    async updateDebugProgress(sessionId, stepsCompleted) {
        const session = this.activeDebugSessions.get(sessionId);
        const completed = session.strategy.steps.slice(0, stepsCompleted);
        
        await new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE debug_sessions SET steps_completed = ? WHERE session_id = ?',
                [JSON.stringify(completed), sessionId],
                err => err ? reject(err) : resolve()
            );
        });
    }

    async generateSolution(errorInfo, category, strategy) {
        // Generate solution based on error type and strategy
        const solutions = {
            syntax: {
                summary: 'Fix syntax error',
                steps: [
                    `Check line ${errorInfo.line} in ${errorInfo.file}`,
                    'Look for missing brackets or semicolons',
                    'Run linter to identify issues'
                ],
                code: `// Add missing syntax element\n// Example: }); or ;`
            },
            runtime: {
                summary: 'Handle runtime error',
                steps: [
                    'Add null/undefined checks',
                    'Verify variable initialization',
                    'Add try-catch blocks'
                ],
                code: `if (variable !== undefined && variable !== null) {\n  // Safe to use variable\n}`
            },
            async: {
                summary: 'Fix async/promise issue',
                steps: [
                    'Add await keyword',
                    'Wrap in try-catch',
                    'Handle promise rejection'
                ],
                code: `try {\n  const result = await asyncFunction();\n} catch (error) {\n  console.error('Async error:', error);\n}`
            },
            network: {
                summary: 'Resolve network issue',
                steps: [
                    'Check service availability',
                    'Verify network configuration',
                    'Add retry mechanism'
                ],
                code: `// Retry logic\nconst retry = async (fn, retries = 3) => {\n  try {\n    return await fn();\n  } catch (error) {\n    if (retries > 0) {\n      await new Promise(r => setTimeout(r, 1000));\n      return retry(fn, retries - 1);\n    }\n    throw error;\n  }\n};`
            },
            database: {
                summary: 'Fix database error',
                steps: [
                    'Check database connection',
                    'Verify schema/tables exist',
                    'Run migrations if needed'
                ],
                code: `// Ensure database is initialized\nawait db.initialize();\n// Run migrations\nawait db.migrate();`
            }
        };
        
        return solutions[category.category] || {
            summary: 'Analyze and fix error',
            steps: ['Review error message', 'Check documentation', 'Apply appropriate fix'],
            code: '// Implement fix based on error type'
        };
    }

    async saveSolution(sessionId, solution) {
        const session = this.activeDebugSessions.get(sessionId);
        
        // Update debug session
        await new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE debug_sessions 
                 SET status = 'completed', completed_at = datetime('now') 
                 WHERE session_id = ?`,
                [sessionId],
                err => err ? reject(err) : resolve()
            );
        });
        
        // Update error log with solution
        await new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE error_logs 
                 SET solution = ?, status = 'resolved', resolved_at = datetime('now')
                 WHERE id = (SELECT error_id FROM debug_sessions WHERE session_id = ?)`,
                [JSON.stringify(solution), sessionId],
                err => err ? reject(err) : resolve()
            );
        });
        
        // Clean up active session
        this.activeDebugSessions.delete(sessionId);
    }

    async initializeCharacterDebuggers() {
        // Set up character-specific debugging personalities
        this.errorHandlers.set('Cal', {
            approach: 'systematic',
            messages: [
                'Let me analyze the system architecture...',
                'This requires a holistic view...',
                'I see the deeper pattern here...'
            ]
        });
        
        this.errorHandlers.set('Ralph', {
            approach: 'aggressive',
            messages: [
                'Time to break this down!',
                'Let me stress test this...',
                'Found the weak point!'
            ]
        });
        
        this.errorHandlers.set('Arty', {
            approach: 'harmonious',
            messages: [
                'Let\'s smooth out these rough edges...',
                'I can feel where the flow is disrupted...',
                'This needs more elegance...'
            ]
        });
    }

    async getDebugStatistics() {
        const stats = await new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    category,
                    COUNT(*) as total_errors,
                    COUNT(DISTINCT error_hash) as unique_errors,
                    AVG(CASE WHEN solution IS NOT NULL THEN 1 ELSE 0 END) as resolution_rate,
                    AVG(CASE 
                        WHEN resolved_at IS NOT NULL 
                        THEN julianday(resolved_at) - julianday(timestamp)
                        ELSE NULL
                    END) * 24 * 60 as avg_resolution_minutes
                FROM error_logs
                GROUP BY category
            `, (err, rows) => err ? reject(err) : resolve(rows));
        });
        
        return stats;
    }
}

// Export for use in other modules
module.exports = DebugFlowOrchestrator;

// Run if called directly
if (require.main === module) {
    const orchestrator = new DebugFlowOrchestrator();
    
    orchestrator.initialize().then(async () => {
        console.log('\n🐛 Debug Flow Orchestrator Running\n');
        
        // Test with example errors
        const testErrors = [
            new SyntaxError('Unexpected token }'),
            new TypeError('Cannot read property \'foo\' of undefined'),
            new Error('Connection refused: ECONNREFUSED'),
            new Error('Table users doesn\'t exist')
        ];
        
        // Process test errors
        for (const error of testErrors) {
            await orchestrator.handleError(error, { source: 'test' });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Show statistics after processing
        setTimeout(async () => {
            console.log('\n📊 Debug Statistics:');
            const stats = await orchestrator.getDebugStatistics();
            console.log(JSON.stringify(stats, null, 2));
        }, 10000);
        
        console.log('\n✨ Debug Orchestrator is monitoring for errors...');
        console.log('Press Ctrl+C to stop\n');
    }).catch(console.error);
}