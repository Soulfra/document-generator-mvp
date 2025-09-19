#!/usr/bin/env node

/**
 * 🌈 UNIFIED COLOR-TAGGED LOGGER
 * 
 * Standard logging system with color coding, tags, and verification
 * Used by ALL services for consistent, searchable, provable logs
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const colors = require('colors');
const { v4: uuidv4 } = require('uuid');

class UnifiedColorTaggedLogger {
    constructor(serviceName = 'SYSTEM') {
        this.serviceName = serviceName;
        this.sessionId = uuidv4().substring(0, 8);
        this.logDir = path.join(__dirname, 'logs');
        this.dbPath = path.join(__dirname, 'tagged-debug.db');
        
        // Database readiness tracking
        this.dbReady = false;
        this.logQueue = [];
        
        // Standard color scheme
        this.colorScheme = {
            success: 'green',     // 🟢 Working/Success
            warning: 'yellow',    // 🟡 Warning/Degraded
            error: 'red',         // 🔴 Error/Failed
            info: 'blue',         // 🔵 Info/Status
            debug: 'magenta',     // 🟣 Debug/Trace
            suggest: 'white'      // ⚪ Suggestion/Fix
        };
        
        // Status icons
        this.statusIcons = {
            success: '🟢',
            warning: '🟡',
            error: '🔴',
            info: '🔵',
            debug: '🟣',
            suggest: '⚪'
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Create log directory
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        
        // Initialize database
        this.initializeDatabase();
        
        // Create session log file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFile = path.join(this.logDir, `${this.serviceName}-${timestamp}.log`);
        
        // Log session start
        this.logToFile(`\n=== SESSION START: ${this.serviceName} [${this.sessionId}] ===\n`);
    }
    
    initializeDatabase() {
        this.db = new sqlite3.Database(this.dbPath);
        this.dbReady = false;
        
        // Create logs table if not exists - using serialize to ensure proper order
        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS debug_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_id TEXT,
                    service TEXT,
                    tag TEXT,
                    status TEXT,
                    message TEXT,
                    suggestion TEXT,
                    metadata TEXT,
                    searchable TEXT
                )
            `, (err) => {
                if (err) {
                    console.error('Failed to create debug_logs table:', err);
                } else {
                    // Create index for fast searching
                    this.db.run(`
                        CREATE INDEX IF NOT EXISTS idx_logs_search 
                        ON debug_logs(service, tag, status, timestamp)
                    `, (err) => {
                        if (err) {
                            console.error('Failed to create index:', err);
                        } else {
                            this.dbReady = true;
                            // Process any queued log entries
                            this.processLogQueue();
                        }
                    });
                }
            });
        });
    }
    
    /**
     * Core logging method
     */
    log(status, tag, message, options = {}) {
        const timestamp = new Date().toISOString();
        const icon = this.statusIcons[status] || '⚫';
        const color = this.colorScheme[status] || 'white';
        
        // Format: [TIMESTAMP] [TAG] [SERVICE] [STATUS] Message
        const consoleFormat = `[${timestamp.substring(11, 19)}] [${tag}] [${this.serviceName}] [${icon} ${status.toUpperCase()}] ${message}`;
        const fileFormat = `[${timestamp}] [${tag}] [${this.serviceName}] [${status.toUpperCase()}] ${message}`;
        
        // Console output with color
        console.log(consoleFormat[color]);
        
        // File output
        this.logToFile(fileFormat);
        
        // Database output
        this.logToDatabase({
            session_id: this.sessionId,
            service: this.serviceName,
            tag,
            status,
            message,
            suggestion: options.suggestion || null,
            metadata: JSON.stringify(options.metadata || {})
        });
        
        // If there's a suggestion, log it separately
        if (options.suggestion) {
            const suggestionFormat = `[${timestamp.substring(11, 19)}] [SUGGEST] [${this.serviceName}] [${this.statusIcons.suggest} FIX] ${options.suggestion}`;
            console.log(suggestionFormat.white.bgBlack);
            this.logToFile(`[${timestamp}] [SUGGEST] [${this.serviceName}] [FIX] ${options.suggestion}`);
        }
        
        return {
            timestamp,
            sessionId: this.sessionId,
            service: this.serviceName,
            tag,
            status,
            message
        };
    }
    
    /**
     * Convenience methods for different log levels
     */
    success(tag, message, options = {}) {
        return this.log('success', tag, message, options);
    }
    
    warning(tag, message, options = {}) {
        return this.log('warning', tag, message, options);
    }
    
    error(tag, message, options = {}) {
        return this.log('error', tag, message, options);
    }
    
    info(tag, message, options = {}) {
        return this.log('info', tag, message, options);
    }
    
    debug(tag, message, options = {}) {
        return this.log('debug', tag, message, options);
    }
    
    suggest(tag, message, suggestion) {
        return this.log('suggest', tag, message, { suggestion });
    }
    
    /**
     * Log to file
     */
    logToFile(message) {
        try {
            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }
    
    /**
     * Log to database
     */
    logToDatabase(data) {
        const searchable = `${data.service} ${data.tag} ${data.status} ${data.message} ${data.suggestion || ''}`.toLowerCase();
        
        const logEntry = {
            session_id: data.session_id,
            service: data.service,
            tag: data.tag,
            status: data.status,
            message: data.message,
            suggestion: data.suggestion,
            metadata: data.metadata,
            searchable: searchable
        };
        
        if (!this.dbReady) {
            // Queue the log entry for later processing
            this.logQueue.push(logEntry);
            return;
        }
        
        this.insertLogEntry(logEntry);
    }
    
    insertLogEntry(logEntry) {
        if (!this.db) return;
        
        this.db.run(`
            INSERT INTO debug_logs (session_id, service, tag, status, message, suggestion, metadata, searchable)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            logEntry.session_id,
            logEntry.service,
            logEntry.tag,
            logEntry.status,
            logEntry.message,
            logEntry.suggestion,
            logEntry.metadata,
            logEntry.searchable
        ], (err) => {
            if (err) {
                console.error('Database logging error:', err);
            }
        });
    }
    
    processLogQueue() {
        while (this.logQueue.length > 0) {
            const logEntry = this.logQueue.shift();
            this.insertLogEntry(logEntry);
        }
    }
    
    /**
     * Test a condition and log result
     */
    test(tag, testName, condition, options = {}) {
        if (condition) {
            this.success(tag, `✓ ${testName}`, options);
            return true;
        } else {
            const suggestion = options.suggestion || `Check ${testName} configuration`;
            this.error(tag, `✗ ${testName}`, { suggestion });
            return false;
        }
    }
    
    /**
     * Measure and log timing
     */
    startTimer(tag, operation) {
        const startTime = Date.now();
        this.debug(tag, `Starting: ${operation}`);
        
        return {
            end: (success = true) => {
                const duration = Date.now() - startTime;
                const status = success ? 'success' : 'warning';
                const message = `${operation} completed in ${duration}ms`;
                
                if (duration > 1000) {
                    this.warning(tag, message, {
                        suggestion: `${operation} took ${duration}ms - consider optimization`
                    });
                } else {
                    this[status](tag, message);
                }
                
                return duration;
            }
        };
    }
    
    /**
     * Wait for database to be ready
     */
    async waitForDatabaseReady(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (this.dbReady) {
                resolve();
                return;
            }
            
            const startTime = Date.now();
            const checkReady = () => {
                if (this.dbReady) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Database initialization timeout'));
                } else {
                    setTimeout(checkReady, 50);
                }
            };
            
            checkReady();
        });
    }

    /**
     * Search logs in database
     */
    async searchLogs(criteria = {}) {
        // Wait for database to be ready
        await this.waitForDatabaseReady();
        
        let query = 'SELECT * FROM debug_logs WHERE 1=1';
        const params = [];
        
        if (criteria.service) {
            query += ' AND service = ?';
            params.push(criteria.service);
        }
        
        if (criteria.tag) {
            query += ' AND tag = ?';
            params.push(criteria.tag);
        }
        
        if (criteria.status) {
            query += ' AND status = ?';
            params.push(criteria.status);
        }
        
        if (criteria.search) {
            query += ' AND searchable LIKE ?';
            params.push(`%${criteria.search.toLowerCase()}%`);
        }
        
        if (criteria.sessionId) {
            query += ' AND session_id = ?';
            params.push(criteria.sessionId);
        }
        
        query += ' ORDER BY timestamp DESC';
        
        if (criteria.limit) {
            query += ' LIMIT ?';
            params.push(criteria.limit);
        }
        
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    /**
     * Get suggestion history
     */
    async getSuggestions(status = 'error') {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT DISTINCT suggestion, COUNT(*) as count
                FROM debug_logs
                WHERE status = ? AND suggestion IS NOT NULL
                GROUP BY suggestion
                ORDER BY count DESC
            `, [status], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    /**
     * Export logs for sharing
     */
    async exportLogs(format = 'json', criteria = {}) {
        const logs = await this.searchLogs(criteria);
        
        switch (format) {
            case 'json':
                return JSON.stringify(logs, null, 2);
                
            case 'csv':
                const headers = ['timestamp', 'service', 'tag', 'status', 'message', 'suggestion'];
                const csv = [headers.join(',')];
                
                logs.forEach(log => {
                    csv.push(headers.map(h => `"${log[h] || ''}"`).join(','));
                });
                
                return csv.join('\n');
                
            case 'markdown':
                let md = '# Debug Logs\n\n';
                md += '| Time | Service | Tag | Status | Message | Suggestion |\n';
                md += '|------|---------|-----|--------|---------|------------|\n';
                
                logs.forEach(log => {
                    md += `| ${log.timestamp} | ${log.service} | ${log.tag} | ${log.status} | ${log.message} | ${log.suggestion || '-'} |\n`;
                });
                
                return md;
                
            default:
                return logs;
        }
    }
    
    /**
     * Create a child logger with same session
     */
    createChild(serviceName) {
        const child = new UnifiedColorTaggedLogger(serviceName);
        child.sessionId = this.sessionId;
        return child;
    }
}

// Export singleton for easy use
const defaultLogger = new UnifiedColorTaggedLogger();

module.exports = UnifiedColorTaggedLogger;
module.exports.logger = defaultLogger;

// CLI usage
if (require.main === module) {
    const logger = new UnifiedColorTaggedLogger('TEST');
    
    console.log('\n🌈 UNIFIED COLOR-TAGGED LOGGER TEST\n');
    
    // Test all log levels
    logger.success('STARTUP', 'Logger initialized successfully');
    logger.info('CONFIG', 'Loading configuration from environment');
    logger.warning('MEMORY', 'Memory usage at 75%', {
        suggestion: 'Consider increasing heap size with --max-old-space-size=4096'
    });
    logger.error('DATABASE', 'Connection refused on port 5432', {
        suggestion: 'Check if PostgreSQL is running: docker ps | grep postgres'
    });
    logger.debug('TRACE', 'Entering main processing loop');
    
    // Test timer
    const timer = logger.startTimer('PERF', 'Database query');
    setTimeout(() => {
        timer.end();
    }, 234);
    
    // Test condition
    logger.test('HEALTH', 'API endpoint responsive', true);
    logger.test('HEALTH', 'Database connection', false, {
        suggestion: 'Start database with: docker-compose up -d postgres'
    });
    
    console.log('\n✅ Logger test complete! Check ./logs/ for file output.');
}