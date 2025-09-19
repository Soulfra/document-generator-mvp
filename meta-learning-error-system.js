#!/usr/bin/env node

/**
 * 🧠 META-LEARNING ERROR SYSTEM
 * 
 * A proactive error prevention system that:
 * - Learns from every error and never forgets
 * - Detects patterns before failures occur
 * - Shares knowledge across all services
 * - Prevents the same error from happening twice
 * 
 * "Those who cannot remember the past are condemned to repeat it."
 */

const EventEmitter = require('events');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

class MetaLearningErrorSystem extends EventEmitter {
    constructor() {
        super();
        
        // Initialize databases
        this.errorDB = new sqlite3.Database('./meta-error-knowledge.db');
        this.patternDB = new sqlite3.Database('./error-patterns.db');
        
        // Pattern recognition engine
        this.patterns = new Map();
        this.resolutions = new Map();
        this.preventions = new Map();
        
        // Error signature cache
        this.errorSignatures = new Map();
        this.silentErrors = new Map();
        
        // Learning parameters
        this.learning = {
            threshold: 3,        // Errors before pattern recognition
            decayRate: 0.95,    // Pattern importance decay
            correlationMin: 0.7 // Minimum correlation for pattern linking
        };
        
        // Meta-lesson tracking
        this.metaLessons = {
            timeouts: new Map(),
            silentFailures: new Map(),
            cascadingFailures: new Map(),
            performanceDegradation: new Map()
        };
        
        // Proactive monitoring
        this.monitoring = {
            services: new Map(),
            healthChecks: new Map(),
            responseTime: new Map()
        };
        
        console.log('🧠 Meta-Learning Error System initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create error pattern tables
            await this.createErrorTables();
            
            // Load existing patterns
            await this.loadExistingPatterns();
            
            // Start monitoring
            this.startProactiveMonitoring();
            
            // Initialize meta-lesson file
            await this.initializeMetaLessons();
            
            console.log('✅ Meta-Learning Error System ready!');
            console.log(`   📊 Loaded ${this.patterns.size} error patterns`);
            console.log(`   💡 ${this.resolutions.size} known resolutions`);
            console.log(`   🛡️ ${this.preventions.size} prevention rules`);
            
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    async createErrorTables() {
        const runAsync = promisify(this.errorDB.run.bind(this.errorDB));
        
        // Main error patterns table
        await runAsync(`
            CREATE TABLE IF NOT EXISTS error_patterns (
                pattern_id TEXT PRIMARY KEY,
                error_signature TEXT UNIQUE,
                error_type VARCHAR(100),
                error_message TEXT,
                service_context TEXT,
                stack_trace TEXT,
                
                -- Pattern tracking
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                occurrence_count INTEGER DEFAULT 1,
                severity_score REAL DEFAULT 1.0,
                
                -- Resolution data
                resolution_steps TEXT, -- JSON
                prevention_rules TEXT, -- JSON
                verified_fix BOOLEAN DEFAULT 0,
                fix_success_rate REAL DEFAULT 0.0,
                
                -- Meta-learning
                parent_pattern_id TEXT,
                child_patterns TEXT, -- JSON array
                related_patterns TEXT, -- JSON array
                
                -- Context
                environment_snapshot TEXT, -- JSON
                preconditions TEXT, -- JSON
                postconditions TEXT -- JSON
            )
        `);
        
        // Timeout patterns
        await runAsync(`
            CREATE TABLE IF NOT EXISTS timeout_patterns (
                id TEXT PRIMARY KEY,
                service_name VARCHAR(255),
                endpoint VARCHAR(500),
                average_response_time INTEGER,
                timeout_threshold INTEGER,
                
                -- Pattern analysis
                time_of_day_pattern TEXT, -- JSON
                load_correlation TEXT, -- JSON
                dependency_chain TEXT, -- JSON
                
                -- Proactive rules
                pre_timeout_indicators TEXT, -- JSON
                prevention_actions TEXT, -- JSON
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Silent errors (claiming to work but don't)
        await runAsync(`
            CREATE TABLE IF NOT EXISTS silent_errors (
                id TEXT PRIMARY KEY,
                service_name VARCHAR(255),
                claimed_status VARCHAR(50),
                actual_status VARCHAR(50),
                detection_method TEXT,
                
                -- Pattern data
                false_positive_indicators TEXT, -- JSON
                verification_steps TEXT, -- JSON
                
                first_detected DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_detected DATETIME DEFAULT CURRENT_TIMESTAMP,
                detection_count INTEGER DEFAULT 1
            )
        `);
        
        // Error relationships
        await runAsync(`
            CREATE TABLE IF NOT EXISTS error_relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_pattern_id TEXT,
                target_pattern_id TEXT,
                relationship_type VARCHAR(50), -- 'causes', 'correlates', 'prevents'
                correlation_strength REAL,
                evidence_count INTEGER DEFAULT 1,
                
                FOREIGN KEY (source_pattern_id) REFERENCES error_patterns(pattern_id),
                FOREIGN KEY (target_pattern_id) REFERENCES error_patterns(pattern_id)
            )
        `);
        
        // Resolution success tracking
        await runAsync(`
            CREATE TABLE IF NOT EXISTS resolution_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_id TEXT,
                resolution_attempted TEXT, -- JSON
                success BOOLEAN,
                time_to_resolve INTEGER, -- milliseconds
                side_effects TEXT, -- JSON
                
                attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (pattern_id) REFERENCES error_patterns(pattern_id)
            )
        `);
        
        // Create indexes
        await runAsync('CREATE INDEX IF NOT EXISTS idx_error_signature ON error_patterns(error_signature)');
        await runAsync('CREATE INDEX IF NOT EXISTS idx_error_type ON error_patterns(error_type)');
        await runAsync('CREATE INDEX IF NOT EXISTS idx_service_context ON error_patterns(service_context)');
        await runAsync('CREATE INDEX IF NOT EXISTS idx_timeout_service ON timeout_patterns(service_name)');
    }
    
    /**
     * Record a new error and learn from it
     */
    async recordError(errorData) {
        const signature = this.generateErrorSignature(errorData);
        
        console.log(`\n🔍 Recording error: ${errorData.type}`);
        console.log(`   Signature: ${signature}`);
        
        // Check if we've seen this before
        const existingPattern = await this.getErrorPattern(signature);
        
        if (existingPattern) {
            // Update existing pattern
            await this.updateErrorPattern(existingPattern, errorData);
            
            // Check if we should trigger prevention
            if (existingPattern.occurrence_count >= this.learning.threshold) {
                await this.triggerProactivePrevention(existingPattern);
            }
        } else {
            // Create new pattern
            await this.createErrorPattern(signature, errorData);
        }
        
        // Analyze for relationships
        await this.analyzeErrorRelationships(signature, errorData);
        
        // Update meta-lessons
        await this.updateMetaLessons(errorData);
        
        // Emit for other systems
        this.emit('error:recorded', {
            signature,
            errorData,
            isNew: !existingPattern
        });
    }
    
    /**
     * Generate unique signature for error
     */
    generateErrorSignature(errorData) {
        const components = [
            errorData.type || 'unknown',
            errorData.service || 'unknown',
            errorData.message ? errorData.message.slice(0, 100) : '',
            errorData.code || ''
        ];
        
        const signatureString = components.join('::');
        return crypto.createHash('sha256').update(signatureString).digest('hex').slice(0, 16);
    }
    
    /**
     * Get error pattern from database
     */
    async getErrorPattern(signature) {
        return new Promise((resolve, reject) => {
            this.errorDB.get(
                'SELECT * FROM error_patterns WHERE error_signature = ?',
                [signature],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
    
    /**
     * Create new error pattern
     */
    async createErrorPattern(signature, errorData) {
        const patternId = crypto.randomBytes(8).toString('hex');
        
        const pattern = {
            pattern_id: patternId,
            error_signature: signature,
            error_type: errorData.type || 'unknown',
            error_message: errorData.message || '',
            service_context: errorData.service || '',
            stack_trace: errorData.stack || '',
            resolution_steps: JSON.stringify(errorData.resolution || []),
            prevention_rules: JSON.stringify([]),
            environment_snapshot: JSON.stringify(errorData.environment || {}),
            preconditions: JSON.stringify(errorData.preconditions || {}),
            postconditions: JSON.stringify(errorData.postconditions || {})
        };
        
        return new Promise((resolve, reject) => {
            this.errorDB.run(
                `INSERT INTO error_patterns (
                    pattern_id, error_signature, error_type, error_message,
                    service_context, stack_trace, resolution_steps, prevention_rules,
                    environment_snapshot, preconditions, postconditions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                Object.values(pattern),
                (err) => {
                    if (err) reject(err);
                    else {
                        this.patterns.set(signature, pattern);
                        resolve(pattern);
                    }
                }
            );
        });
    }
    
    /**
     * Update existing error pattern
     */
    async updateErrorPattern(pattern, errorData) {
        pattern.occurrence_count++;
        pattern.last_seen = new Date().toISOString();
        pattern.severity_score = this.calculateSeverity(pattern);
        
        // Merge environment data
        const envSnapshot = JSON.parse(pattern.environment_snapshot || '{}');
        Object.assign(envSnapshot, errorData.environment || {});
        pattern.environment_snapshot = JSON.stringify(envSnapshot);
        
        return new Promise((resolve, reject) => {
            this.errorDB.run(
                `UPDATE error_patterns 
                SET occurrence_count = ?, last_seen = ?, severity_score = ?,
                    environment_snapshot = ?
                WHERE pattern_id = ?`,
                [
                    pattern.occurrence_count,
                    pattern.last_seen,
                    pattern.severity_score,
                    pattern.environment_snapshot,
                    pattern.pattern_id
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve(pattern);
                }
            );
        });
    }
    
    /**
     * Calculate error severity based on patterns
     */
    calculateSeverity(pattern) {
        let severity = 1.0;
        
        // Increase based on frequency
        severity += pattern.occurrence_count * 0.1;
        
        // Increase for timeouts (they cascade)
        if (pattern.error_type === 'timeout') severity *= 1.5;
        
        // Increase for silent errors (hard to detect)
        if (pattern.error_type === 'silent_error') severity *= 2.0;
        
        // Increase if no resolution found
        const resolutions = JSON.parse(pattern.resolution_steps || '[]');
        if (resolutions.length === 0) severity *= 1.3;
        
        return Math.min(severity, 10.0); // Cap at 10
    }
    
    /**
     * Analyze relationships between errors
     */
    async analyzeErrorRelationships(signature, errorData) {
        // Look for errors that happened recently
        const recentErrors = await this.getRecentErrors(300000); // 5 minutes
        
        for (const recentError of recentErrors) {
            if (recentError.error_signature === signature) continue;
            
            // Check temporal correlation
            const timeDiff = Date.now() - new Date(recentError.last_seen).getTime();
            if (timeDiff < 60000) { // Within 1 minute
                await this.recordErrorRelationship(
                    recentError.pattern_id,
                    signature,
                    'correlates',
                    0.8
                );
            }
            
            // Check service correlation
            if (recentError.service_context === errorData.service) {
                await this.recordErrorRelationship(
                    recentError.pattern_id,
                    signature,
                    'correlates',
                    0.6
                );
            }
        }
    }
    
    /**
     * Get recent errors for correlation
     */
    async getRecentErrors(timeWindow) {
        return new Promise((resolve, reject) => {
            const cutoff = new Date(Date.now() - timeWindow).toISOString();
            this.errorDB.all(
                'SELECT * FROM error_patterns WHERE last_seen > ? ORDER BY last_seen DESC',
                [cutoff],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }
    
    /**
     * Record relationship between errors
     */
    async recordErrorRelationship(sourceId, targetId, type, strength) {
        return new Promise((resolve, reject) => {
            this.errorDB.run(
                `INSERT OR REPLACE INTO error_relationships 
                (source_pattern_id, target_pattern_id, relationship_type, correlation_strength)
                VALUES (?, ?, ?, ?)`,
                [sourceId, targetId, type, strength],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    /**
     * Trigger proactive prevention based on patterns
     */
    async triggerProactivePrevention(pattern) {
        console.log(`\n🛡️ Triggering proactive prevention for pattern: ${pattern.error_type}`);
        
        // Get prevention rules
        const preventionRules = JSON.parse(pattern.prevention_rules || '[]');
        
        if (preventionRules.length === 0) {
            // Generate prevention rules based on pattern
            const rules = await this.generatePreventionRules(pattern);
            pattern.prevention_rules = JSON.stringify(rules);
            await this.savePreventionRules(pattern.pattern_id, rules);
        }
        
        // Execute prevention actions
        for (const rule of preventionRules) {
            try {
                await this.executePreventionRule(rule, pattern);
            } catch (error) {
                console.error(`   ❌ Prevention rule failed:`, error.message);
            }
        }
        
        this.emit('prevention:triggered', {
            pattern,
            rules: preventionRules
        });
    }
    
    /**
     * Generate prevention rules based on error pattern
     */
    async generatePreventionRules(pattern) {
        const rules = [];
        
        switch (pattern.error_type) {
            case 'timeout':
                rules.push({
                    type: 'increase_timeout',
                    action: 'multiply',
                    factor: 1.5,
                    target: pattern.service_context
                });
                rules.push({
                    type: 'add_retry',
                    action: 'exponential_backoff',
                    maxRetries: 3,
                    target: pattern.service_context
                });
                break;
                
            case 'ECONNREFUSED':
                rules.push({
                    type: 'health_check',
                    action: 'verify_service_running',
                    target: pattern.service_context
                });
                rules.push({
                    type: 'auto_restart',
                    action: 'restart_if_dead',
                    target: pattern.service_context
                });
                break;
                
            case 'memory_leak':
                rules.push({
                    type: 'memory_limit',
                    action: 'set_max_memory',
                    limit: '512MB',
                    target: pattern.service_context
                });
                rules.push({
                    type: 'periodic_restart',
                    action: 'schedule_restart',
                    interval: '24h',
                    target: pattern.service_context
                });
                break;
                
            case 'silent_error':
                rules.push({
                    type: 'deep_health_check',
                    action: 'verify_actual_functionality',
                    checks: ['process_exists', 'port_listening', 'http_responding', 'data_flowing'],
                    target: pattern.service_context
                });
                break;
        }
        
        return rules;
    }
    
    /**
     * Execute a prevention rule
     */
    async executePreventionRule(rule, pattern) {
        console.log(`   → Executing rule: ${rule.type} on ${rule.target}`);
        
        switch (rule.type) {
            case 'increase_timeout':
                // Update timeout configuration
                this.emit('config:update', {
                    service: rule.target,
                    setting: 'timeout',
                    value: rule.factor
                });
                break;
                
            case 'health_check':
                // Trigger immediate health check
                this.emit('health:check', {
                    service: rule.target,
                    deep: true
                });
                break;
                
            case 'auto_restart':
                // Request service restart
                this.emit('service:restart', {
                    service: rule.target,
                    reason: 'error_prevention'
                });
                break;
                
            case 'deep_health_check':
                // Perform multi-layer verification
                for (const check of rule.checks) {
                    this.emit('verify:layer', {
                        service: rule.target,
                        layer: check
                    });
                }
                break;
        }
    }
    
    /**
     * Save prevention rules to database
     */
    async savePreventionRules(patternId, rules) {
        return new Promise((resolve, reject) => {
            this.errorDB.run(
                'UPDATE error_patterns SET prevention_rules = ? WHERE pattern_id = ?',
                [JSON.stringify(rules), patternId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    /**
     * Load existing patterns from database
     */
    async loadExistingPatterns() {
        return new Promise((resolve, reject) => {
            this.errorDB.all(
                'SELECT * FROM error_patterns ORDER BY severity_score DESC',
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        rows.forEach(row => {
                            this.patterns.set(row.error_signature, row);
                            
                            // Load resolutions
                            const resolutions = JSON.parse(row.resolution_steps || '[]');
                            if (resolutions.length > 0) {
                                this.resolutions.set(row.error_signature, resolutions);
                            }
                            
                            // Load preventions
                            const preventions = JSON.parse(row.prevention_rules || '[]');
                            if (preventions.length > 0) {
                                this.preventions.set(row.error_signature, preventions);
                            }
                        });
                        resolve();
                    }
                }
            );
        });
    }
    
    /**
     * Initialize meta-lessons file
     */
    async initializeMetaLessons() {
        const lessonsPath = path.join(__dirname, 'CLAUDE.meta-lessons.md');
        
        const header = `# 🧠 META-LESSONS: System Error Knowledge Base

This file is automatically generated and updated by the Meta-Learning Error System.
It contains lessons learned from every error encountered, ensuring we never repeat mistakes.

Last Updated: ${new Date().toISOString()}

## Table of Contents
1. [Common Timeout Patterns](#timeout-patterns)
2. [Silent Failure Detection](#silent-failures)
3. [Cascading Error Prevention](#cascading-errors)
4. [Performance Degradation Signs](#performance-degradation)
5. [Resolution Strategies](#resolution-strategies)
6. [Prevention Rules](#prevention-rules)

---

`;
        
        await fs.writeFile(lessonsPath, header);
        
        // Create symlinks to all service directories
        await this.createMetaLessonSymlinks(lessonsPath);
    }
    
    /**
     * Create symlinks for meta-lessons
     */
    async createMetaLessonSymlinks(sourcePath) {
        const targetDirs = [
            './services',
            './FinishThisIdea',
            './mcp',
            './web-interface'
        ];
        
        for (const dir of targetDirs) {
            try {
                const targetPath = path.join(dir, 'CLAUDE.meta-lessons.md');
                
                // Remove existing symlink if exists
                try {
                    await fs.unlink(targetPath);
                } catch {}
                
                // Create new symlink
                await fs.symlink(path.relative(dir, sourcePath), targetPath);
                console.log(`   📎 Symlinked meta-lessons to ${dir}`);
            } catch (error) {
                console.warn(`   ⚠️ Could not symlink to ${dir}:`, error.message);
            }
        }
    }
    
    /**
     * Update meta-lessons file with new knowledge
     */
    async updateMetaLessons(errorData) {
        const lessonsPath = path.join(__dirname, 'CLAUDE.meta-lessons.md');
        
        // Read current content
        let content = await fs.readFile(lessonsPath, 'utf-8');
        
        // Find the right section
        let section = '';
        switch (errorData.type) {
            case 'timeout':
                section = '## Timeout Patterns';
                break;
            case 'silent_error':
                section = '## Silent Failures';
                break;
            case 'cascade':
                section = '## Cascading Errors';
                break;
            default:
                section = '## Resolution Strategies';
        }
        
        // Add new lesson
        const lesson = `
### ${new Date().toISOString()} - ${errorData.service || 'Unknown Service'}
- **Error**: ${errorData.message}
- **Type**: ${errorData.type}
- **Frequency**: ${this.patterns.get(this.generateErrorSignature(errorData))?.occurrence_count || 1} occurrences
- **Resolution**: ${errorData.resolution || 'Pending investigation'}
- **Prevention**: ${errorData.prevention || 'Monitor for patterns'}

`;
        
        // Insert lesson in the right section
        const sectionIndex = content.indexOf(section);
        if (sectionIndex !== -1) {
            const nextSectionIndex = content.indexOf('\n##', sectionIndex + 1);
            const insertIndex = nextSectionIndex !== -1 ? nextSectionIndex : content.length;
            content = content.slice(0, insertIndex) + lesson + content.slice(insertIndex);
        } else {
            content += `\n${section}\n${lesson}`;
        }
        
        // Update last updated timestamp
        content = content.replace(
            /Last Updated: .*/,
            `Last Updated: ${new Date().toISOString()}`
        );
        
        await fs.writeFile(lessonsPath, content);
    }
    
    /**
     * Start proactive monitoring
     */
    startProactiveMonitoring() {
        // Check for pre-error conditions every 30 seconds
        setInterval(() => {
            this.checkPreErrorConditions();
        }, 30000);
        
        // Analyze patterns every 5 minutes
        setInterval(() => {
            this.analyzePatternTrends();
        }, 300000);
        
        console.log('   👁️ Proactive monitoring started');
    }
    
    /**
     * Check for conditions that precede errors
     */
    async checkPreErrorConditions() {
        // Memory check
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed / memUsage.heapTotal > 0.85) {
            this.emit('pre-error:detected', {
                type: 'memory_pressure',
                severity: 'high',
                metric: memUsage.heapUsed / memUsage.heapTotal,
                action: 'consider_restart'
            });
        }
        
        // Response time degradation
        for (const [service, times] of this.monitoring.responseTime) {
            const recent = times.slice(-10);
            const average = recent.reduce((a, b) => a + b, 0) / recent.length;
            const baseline = times.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
            
            if (average > baseline * 1.5) {
                this.emit('pre-error:detected', {
                    type: 'response_degradation',
                    service,
                    severity: 'medium',
                    metric: average / baseline,
                    action: 'investigate_load'
                });
            }
        }
    }
    
    /**
     * Analyze pattern trends
     */
    async analyzePatternTrends() {
        const trends = {
            increasing: [],
            decreasing: [],
            stable: []
        };
        
        for (const [signature, pattern] of this.patterns) {
            // Calculate trend (simplified)
            if (pattern.occurrence_count > 10) {
                trends.increasing.push(pattern);
            } else if (pattern.occurrence_count === 1) {
                trends.stable.push(pattern);
            }
        }
        
        if (trends.increasing.length > 0) {
            console.log(`\n📈 Error trends detected:`);
            console.log(`   Increasing: ${trends.increasing.length} patterns`);
            
            this.emit('trends:detected', trends);
        }
    }
    
    /**
     * Query for solutions to an error
     */
    async getSolution(errorData) {
        const signature = this.generateErrorSignature(errorData);
        const pattern = await this.getErrorPattern(signature);
        
        if (!pattern) {
            return {
                found: false,
                message: 'No previous occurrence of this error'
            };
        }
        
        const resolutions = JSON.parse(pattern.resolution_steps || '[]');
        const preventions = JSON.parse(pattern.prevention_rules || '[]');
        
        return {
            found: true,
            pattern: {
                occurrences: pattern.occurrence_count,
                firstSeen: pattern.first_seen,
                lastSeen: pattern.last_seen,
                severity: pattern.severity_score
            },
            resolutions,
            preventions,
            relatedErrors: await this.getRelatedErrors(pattern.pattern_id)
        };
    }
    
    /**
     * Get related errors
     */
    async getRelatedErrors(patternId) {
        return new Promise((resolve, reject) => {
            this.errorDB.all(
                `SELECT ep.* FROM error_patterns ep
                JOIN error_relationships er ON ep.pattern_id = er.target_pattern_id
                WHERE er.source_pattern_id = ?
                ORDER BY er.correlation_strength DESC`,
                [patternId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }
    
    /**
     * Get system health report
     */
    async getHealthReport() {
        const report = {
            totalPatterns: this.patterns.size,
            resolutionsKnown: this.resolutions.size,
            preventionRules: this.preventions.size,
            recentErrors: await this.getRecentErrors(3600000), // Last hour
            topErrors: [],
            trends: {
                timeouts: 0,
                silentErrors: 0,
                cascades: 0
            }
        };
        
        // Get top errors by frequency
        const patterns = Array.from(this.patterns.values())
            .sort((a, b) => b.occurrence_count - a.occurrence_count)
            .slice(0, 10);
        
        report.topErrors = patterns.map(p => ({
            type: p.error_type,
            count: p.occurrence_count,
            severity: p.severity_score,
            hasResolution: JSON.parse(p.resolution_steps || '[]').length > 0
        }));
        
        // Count error types
        for (const pattern of this.patterns.values()) {
            if (pattern.error_type === 'timeout') report.trends.timeouts++;
            if (pattern.error_type === 'silent_error') report.trends.silentErrors++;
            if (pattern.parent_pattern_id) report.trends.cascades++;
        }
        
        return report;
    }
}

// Export for use
module.exports = MetaLearningErrorSystem;

// Run if executed directly
if (require.main === module) {
    const errorSystem = new MetaLearningErrorSystem();
    
    errorSystem.on('ready', async () => {
        console.log('\n📋 META-LEARNING ERROR SYSTEM DEMO');
        console.log('===================================');
        
        // Example: Record a timeout error
        console.log('\n1. Recording timeout error...');
        await errorSystem.recordError({
            type: 'timeout',
            service: 'api-gateway',
            message: 'Request timeout after 30000ms',
            code: 'ETIMEDOUT',
            environment: {
                load: 'high',
                memory: '85%',
                connections: 1523
            }
        });
        
        // Example: Record same error again
        console.log('\n2. Recording same error again...');
        await errorSystem.recordError({
            type: 'timeout',
            service: 'api-gateway',
            message: 'Request timeout after 30000ms',
            code: 'ETIMEDOUT'
        });
        
        // Example: Check for solution
        console.log('\n3. Checking for solutions...');
        const solution = await errorSystem.getSolution({
            type: 'timeout',
            service: 'api-gateway',
            message: 'Request timeout after 30000ms'
        });
        
        console.log('Solution found:', solution.found);
        if (solution.found) {
            console.log('Occurrences:', solution.pattern.occurrences);
            console.log('Preventions:', solution.preventions);
        }
        
        // Example: Get health report
        console.log('\n4. System Health Report:');
        const report = await errorSystem.getHealthReport();
        console.log(JSON.stringify(report, null, 2));
        
        // Listen for pre-error conditions
        errorSystem.on('pre-error:detected', (condition) => {
            console.log('\n⚠️ Pre-error condition detected:', condition);
        });
        
        console.log('\n✅ Meta-Learning Error System is actively learning!');
    });
}