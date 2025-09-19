#!/usr/bin/env node

/**
 * 💡 SUGGESTION ENGINE
 * 
 * Provides intelligent fix suggestions based on error patterns
 * Learns from successful fixes and tracks what works
 */

const sqlite3 = require('sqlite3').verbose();
const UnifiedColorTaggedLogger = require('./unified-color-tagged-logger');

class SuggestionEngine {
    constructor() {
        this.logger = new UnifiedColorTaggedLogger('SUGGEST');
        this.db = new sqlite3.Database('./suggestion-engine.db');
        this.dbReady = false;
        
        // Initialize patterns from debug-flow-orchestrator.js patterns
        this.errorPatterns = new Map();
        this.fixPatterns = new Map();
        this.successfulFixes = new Map();
        
        this.initialize();
    }
    
    initialize() {
        this.logger.info('INIT', 'Initializing Suggestion Engine...');
        
        // Create database tables
        this.initializeDatabase();
        
        // Load error patterns
        this.loadErrorPatterns();
        
        // Load fix patterns
        this.loadFixPatterns();
        
        // Load successful fix history
        this.loadSuccessfulFixes();
        
        this.logger.success('INIT', 'Suggestion Engine ready');
    }
    
    initializeDatabase() {
        // Use serialize to ensure proper order of database operations
        this.db.serialize(() => {
            // Suggestions table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS suggestions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    error_pattern TEXT,
                    error_message TEXT,
                    suggestion TEXT,
                    command TEXT,
                    success_count INTEGER DEFAULT 0,
                    failure_count INTEGER DEFAULT 0,
                    last_used DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Failed to create suggestions table:', err);
                }
            });
            
            // Fix history table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS fix_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    error_message TEXT,
                    suggestion_used TEXT,
                    command_used TEXT,
                    success BOOLEAN,
                    service_name TEXT,
                    fixed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Failed to create fix_history table:', err);
                } else {
                    // Database is ready
                    this.dbReady = true;
                }
            });
        });
    }
    
    loadErrorPatterns() {
        // Port conflicts
        this.errorPatterns.set('port_conflict', {
            patterns: [/EADDRINUSE.*:(\d+)/, /address already in use.*:(\d+)/, /port (\d+).*in use/i],
            extractor: (match) => ({ port: match[1] })
        });
        
        // Database connections
        this.errorPatterns.set('postgres_down', {
            patterns: [/ECONNREFUSED.*5432/, /postgres.*connection refused/i, /could not connect to.*postgres/i],
            extractor: () => ({ service: 'PostgreSQL', port: 5432 })
        });
        
        this.errorPatterns.set('redis_down', {
            patterns: [/ECONNREFUSED.*6379/, /redis.*connection refused/i, /could not connect to.*redis/i],
            extractor: () => ({ service: 'Redis', port: 6379 })
        });
        
        this.errorPatterns.set('mongo_down', {
            patterns: [/ECONNREFUSED.*27017/, /mongodb.*connection refused/i, /MongoNetworkError/],
            extractor: () => ({ service: 'MongoDB', port: 27017 })
        });
        
        // Missing modules
        this.errorPatterns.set('missing_module', {
            patterns: [/Cannot find module ['"](.+?)['"]/, /MODULE_NOT_FOUND.*['"](.+?)['"]/],
            extractor: (match) => ({ module: match[1] })
        });
        
        // API key issues
        this.errorPatterns.set('missing_api_key', {
            patterns: [/API key.*not found/i, /missing.*api.*key/i, /undefined.*api.*key/i],
            extractor: (match) => {
                const keyMatch = match[0].match(/(OPENAI|ANTHROPIC|STRIPE|GOOGLE).*KEY/i);
                return { key: keyMatch ? keyMatch[0] : 'API_KEY' };
            }
        });
        
        // Memory issues
        this.errorPatterns.set('out_of_memory', {
            patterns: [/JavaScript heap out of memory/, /FATAL ERROR:.*heap/, /Allocation failed/],
            extractor: () => ({})
        });
        
        // Permission issues
        this.errorPatterns.set('permission_denied', {
            patterns: [/EACCES/, /Permission denied/, /operation not permitted/i],
            extractor: (match) => {
                const fileMatch = match[0].match(/['"](\/.*?)['"]/);
                return { file: fileMatch ? fileMatch[1] : 'unknown' };
            }
        });
        
        // Timeout issues
        this.errorPatterns.set('timeout', {
            patterns: [/ETIMEDOUT/, /timeout.*exceeded/i, /request.*timed out/i],
            extractor: () => ({})
        });
        
        // Syntax errors
        this.errorPatterns.set('syntax_error', {
            patterns: [/SyntaxError/, /Unexpected token/, /Unexpected identifier/],
            extractor: (match) => {
                const lineMatch = match[0].match(/line (\d+)/i);
                return { line: lineMatch ? lineMatch[1] : 'unknown' };
            }
        });
    }
    
    loadFixPatterns() {
        // Port conflict fixes
        this.fixPatterns.set('port_conflict', [
            {
                description: 'Kill process using the port',
                command: 'lsof -ti:{port} | xargs kill -9',
                priority: 1
            },
            {
                description: 'Use a different port',
                command: 'Change port in configuration or use --port flag',
                priority: 2
            }
        ]);
        
        // PostgreSQL fixes
        this.fixPatterns.set('postgres_down', [
            {
                description: 'Start PostgreSQL with Docker',
                command: 'docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres',
                priority: 1
            },
            {
                description: 'Start existing PostgreSQL container',
                command: 'docker start postgres',
                priority: 2
            },
            {
                description: 'Check if PostgreSQL is installed',
                command: 'brew services start postgresql || sudo systemctl start postgresql',
                priority: 3
            }
        ]);
        
        // Redis fixes
        this.fixPatterns.set('redis_down', [
            {
                description: 'Start Redis with Docker',
                command: 'docker run -d --name redis -p 6379:6379 redis',
                priority: 1
            },
            {
                description: 'Start existing Redis container',
                command: 'docker start redis',
                priority: 2
            },
            {
                description: 'Start Redis service',
                command: 'brew services start redis || sudo systemctl start redis',
                priority: 3
            }
        ]);
        
        // Missing module fixes
        this.fixPatterns.set('missing_module', [
            {
                description: 'Install the missing module',
                command: 'npm install {module}',
                priority: 1
            },
            {
                description: 'Install all dependencies',
                command: 'npm install',
                priority: 2
            },
            {
                description: 'Clear cache and reinstall',
                command: 'rm -rf node_modules package-lock.json && npm install',
                priority: 3
            }
        ]);
        
        // API key fixes
        this.fixPatterns.set('missing_api_key', [
            {
                description: 'Add API key to .env file',
                command: 'echo "{key}=your-api-key-here" >> .env',
                priority: 1
            },
            {
                description: 'Export API key in current session',
                command: 'export {key}=your-api-key-here',
                priority: 2
            },
            {
                description: 'Copy from example env file',
                command: 'cp .env.example .env && vim .env',
                priority: 3
            }
        ]);
        
        // Memory fixes
        this.fixPatterns.set('out_of_memory', [
            {
                description: 'Increase Node.js memory limit',
                command: 'node --max-old-space-size=4096 your-script.js',
                priority: 1
            },
            {
                description: 'Set memory limit in package.json',
                command: 'Add to scripts: "start": "node --max-old-space-size=4096 index.js"',
                priority: 2
            },
            {
                description: 'Check for memory leaks',
                command: 'node --inspect your-script.js # Then use Chrome DevTools',
                priority: 3
            }
        ]);
        
        // Permission fixes
        this.fixPatterns.set('permission_denied', [
            {
                description: 'Change file permissions',
                command: 'chmod 755 {file}',
                priority: 1
            },
            {
                description: 'Change file ownership',
                command: 'sudo chown $USER:$USER {file}',
                priority: 2
            },
            {
                description: 'Run with elevated permissions',
                command: 'sudo node your-script.js',
                priority: 3
            }
        ]);
        
        // Timeout fixes
        this.fixPatterns.set('timeout', [
            {
                description: 'Increase timeout duration',
                command: 'Increase timeout in configuration (e.g., timeout: 30000)',
                priority: 1
            },
            {
                description: 'Check network connectivity',
                command: 'ping google.com && curl -v <your-endpoint>',
                priority: 2
            },
            {
                description: 'Check if service is overloaded',
                command: 'top || htop # Check CPU/memory usage',
                priority: 3
            }
        ]);
        
        // Syntax error fixes
        this.fixPatterns.set('syntax_error', [
            {
                description: 'Check syntax at the specified line',
                command: 'Check line {line} in your code for syntax errors',
                priority: 1
            },
            {
                description: 'Run linter to find issues',
                command: 'npx eslint your-file.js',
                priority: 2
            },
            {
                description: 'Validate JSON if applicable',
                command: 'npx jsonlint your-file.json',
                priority: 3
            }
        ]);
    }
    
    loadSuccessfulFixes() {
        // Load from database
        this.db.all(`
            SELECT error_pattern, suggestion, command, success_count
            FROM suggestions
            WHERE success_count > 0
            ORDER BY success_count DESC
        `, (err, rows) => {
            if (!err && rows) {
                rows.forEach(row => {
                    this.successfulFixes.set(row.error_pattern, {
                        suggestion: row.suggestion,
                        command: row.command,
                        successCount: row.success_count
                    });
                });
                this.logger.info('LOAD', `Loaded ${rows.length} successful fix patterns`);
            }
        });
    }
    
    /**
     * Get suggestion for an error
     */
    getSuggestion(errorMessage, context = {}) {
        this.logger.debug('ANALYZE', `Analyzing error: ${errorMessage.substring(0, 100)}...`);
        
        // Try to match error pattern
        for (const [patternName, pattern] of this.errorPatterns) {
            for (const regex of pattern.patterns) {
                const match = errorMessage.match(regex);
                if (match) {
                    this.logger.info('MATCH', `Matched pattern: ${patternName}`);
                    
                    // Extract variables from error
                    const variables = pattern.extractor(match);
                    
                    // Get fixes for this pattern
                    const fixes = this.fixPatterns.get(patternName);
                    if (fixes) {
                        // Check if we have a successful fix from history
                        const historicalFix = this.successfulFixes.get(patternName);
                        if (historicalFix) {
                            this.logger.success('HISTORY', `Found successful fix from history (${historicalFix.successCount} times)`);
                            return {
                                pattern: patternName,
                                suggestion: historicalFix.suggestion,
                                command: this.interpolateCommand(historicalFix.command, variables),
                                confidence: 'high',
                                source: 'history'
                            };
                        }
                        
                        // Return best fix
                        const bestFix = fixes[0];
                        return {
                            pattern: patternName,
                            suggestion: bestFix.description,
                            command: this.interpolateCommand(bestFix.command, variables),
                            alternatives: fixes.slice(1).map(fix => ({
                                suggestion: fix.description,
                                command: this.interpolateCommand(fix.command, variables)
                            })),
                            confidence: 'medium',
                            source: 'pattern'
                        };
                    }
                }
            }
        }
        
        // No pattern matched - try generic suggestions
        return this.getGenericSuggestion(errorMessage);
    }
    
    /**
     * Interpolate variables into command
     */
    interpolateCommand(command, variables) {
        let result = command;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        return result;
    }
    
    /**
     * Get generic suggestion when no pattern matches
     */
    getGenericSuggestion(errorMessage) {
        const suggestions = [];
        
        // Check logs
        suggestions.push({
            suggestion: 'Check service logs for more details',
            command: 'tail -n 100 logs/*.log | grep -i error'
        });
        
        // Check running services
        if (errorMessage.includes('connect') || errorMessage.includes('refused')) {
            suggestions.push({
                suggestion: 'Check if required services are running',
                command: 'docker ps || pm2 list'
            });
        }
        
        // Check environment
        if (errorMessage.includes('undefined') || errorMessage.includes('null')) {
            suggestions.push({
                suggestion: 'Check environment variables',
                command: 'env | grep -E "(API|KEY|URL|PORT)"'
            });
        }
        
        return {
            pattern: 'generic',
            suggestion: suggestions[0]?.suggestion || 'Check error details and logs',
            command: suggestions[0]?.command || 'cat logs/*.log | tail -n 50',
            alternatives: suggestions.slice(1),
            confidence: 'low',
            source: 'generic'
        };
    }
    
    /**
     * Record fix attempt result
     */
    async recordFixAttempt(errorMessage, suggestion, command, success, serviceName = null) {
        // Record in history
        this.db.run(`
            INSERT INTO fix_history (error_message, suggestion_used, command_used, success, service_name)
            VALUES (?, ?, ?, ?, ?)
        `, [errorMessage, suggestion, command, success ? 1 : 0, serviceName]);
        
        // Update suggestion success rate
        if (success) {
            this.db.run(`
                UPDATE suggestions 
                SET success_count = success_count + 1, last_used = CURRENT_TIMESTAMP
                WHERE suggestion = ? AND command = ?
            `, [suggestion, command]);
            
            this.logger.success('RECORD', `Fix successful: ${suggestion}`);
        } else {
            this.db.run(`
                UPDATE suggestions 
                SET failure_count = failure_count + 1, last_used = CURRENT_TIMESTAMP
                WHERE suggestion = ? AND command = ?
            `, [suggestion, command]);
            
            this.logger.warning('RECORD', `Fix unsuccessful: ${suggestion}`);
        }
    }
    
    /**
     * Get suggestion statistics
     */
    async getStats() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    COUNT(*) as total_suggestions,
                    SUM(success_count) as total_successes,
                    SUM(failure_count) as total_failures,
                    AVG(CAST(success_count AS FLOAT) / NULLIF(success_count + failure_count, 0)) as success_rate
                FROM suggestions
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });
    }
    
    /**
     * Get most successful fixes
     */
    async getTopFixes(limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT error_pattern, suggestion, command, success_count,
                       CAST(success_count AS FLOAT) / NULLIF(success_count + failure_count, 0) as success_rate
                FROM suggestions
                WHERE success_count > 0
                ORDER BY success_count DESC
                LIMIT ?
            `, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Export
module.exports = SuggestionEngine;

// CLI usage
if (require.main === module) {
    const engine = new SuggestionEngine();
    
    console.log('\n💡 SUGGESTION ENGINE TEST\n');
    
    // Test various error patterns
    const testErrors = [
        'Error: listen EADDRINUSE: address already in use :::3000',
        'Error: connect ECONNREFUSED 127.0.0.1:5432',
        'Error: Cannot find module \'express\'',
        'Error: OPENAI_API_KEY is not defined',
        'FATAL ERROR: JavaScript heap out of memory',
        'Error: EACCES: permission denied, open \'/etc/hosts\'',
        'Error: Request timeout after 5000ms',
        'SyntaxError: Unexpected token } at line 42'
    ];
    
    testErrors.forEach(error => {
        console.log(`\n❌ Error: ${error}`);
        const suggestion = engine.getSuggestion(error);
        
        console.log(`💡 Suggestion: ${suggestion.suggestion}`.yellow);
        console.log(`📋 Command: ${suggestion.command}`.cyan);
        console.log(`🎯 Confidence: ${suggestion.confidence}`.gray);
        
        if (suggestion.alternatives) {
            console.log('🔄 Alternatives:'.gray);
            suggestion.alternatives.forEach((alt, i) => {
                console.log(`   ${i + 1}. ${alt.suggestion}`.gray);
                console.log(`      ${alt.command}`.gray);
            });
        }
    });
}