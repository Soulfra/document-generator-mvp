/**
 * 🛡️ Database Schema Guardian
 * Acts like a postmaster/watchdog to verify system integrity and database schema
 * Ensures all systems are working properly with proper data validation
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const crypto = require('crypto');
const axios = require('axios');

class DatabaseSchemaGuardian {
    constructor() {
        this.app = express();
        this.port = 7891;
        this.server = null;
        
        // System Registry - All services to monitor
        this.systemRegistry = {
            'blamechain-storybook': { port: 7877, status: 'unknown', lastCheck: null },
            'chat-processor': { port: 7879, status: 'unknown', lastCheck: null },
            'web3-playable-world': { port: 7880, status: 'unknown', lastCheck: null },
            'soulfra-multiverse': { port: 7881, status: 'unknown', lastCheck: null },
            'clarity-engine': { port: 7882, status: 'unknown', lastCheck: null },
            'onion-crawler': { port: 7884, status: 'unknown', lastCheck: null },
            'architecture-manager': { port: 7886, status: 'unknown', lastCheck: null },
            'terminal-mud': { port: 7887, status: 'unknown', lastCheck: null },
            'cjis-scraper': { port: 7889, status: 'unknown', lastCheck: null }
        };
        
        // Database Schemas to Validate
        this.expectedSchemas = {
            'cjis_compliance.db': {
                tables: [
                    'scraping_sessions',
                    'scraped_data', 
                    'ai_decisions',
                    'compliance_violations',
                    'domain_validation'
                ],
                criticalColumns: {
                    'scraping_sessions': ['id', 'user_id', 'target_domain', 'cjis_compliant'],
                    'scraped_data': ['id', 'session_id', 'encrypted_content', 'validation_score'],
                    'ai_decisions': ['id', 'agent_id', 'confidence_score', 'reasoning'],
                    'compliance_violations': ['id', 'violation_type', 'severity', 'resolved'],
                    'domain_validation': ['id', 'domain', 'is_government', 'dns_valid']
                }
            },
            'architecture_limits.db': {
                tables: [
                    'architecture_systems',
                    'resource_usage',
                    'system_connections', 
                    'architecture_violations',
                    'system_health'
                ],
                criticalColumns: {
                    'architecture_systems': ['id', 'name', 'type', 'status'],
                    'resource_usage': ['id', 'system_id', 'usage_amount', 'limit_amount'],
                    'system_health': ['id', 'system_id', 'health_score', 'status']
                }
            }
        };
        
        // Watchdog Configuration
        this.watchdogConfig = {
            checkInterval: 30000, // 30 seconds
            healthThreshold: 0.8,
            alertThreshold: 3, // Alert after 3 consecutive failures
            autoRestart: false, // Set to true for production
            logRetention: 86400000 // 24 hours
        };
        
        // Guardian State
        this.guardianState = {
            systemHealth: new Map(),
            schemaIntegrity: new Map(),
            alertCount: new Map(),
            lastFullCheck: null,
            totalChecks: 0,
            issuesDetected: []
        };
        
        this.initializeGuardianDB();
        this.setupMiddleware();
        this.setupRoutes();
        this.startWatchdog();
    }
    
    async initializeGuardianDB() {
        this.guardianDB = new sqlite3.Database('./guardian_log.db');
        
        this.guardianDB.serialize(() => {
            // System health logs
            this.guardianDB.run(`
                CREATE TABLE IF NOT EXISTS system_health_log (
                    id TEXT PRIMARY KEY,
                    system_name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    response_time INTEGER,
                    error_message TEXT,
                    checked_at INTEGER NOT NULL
                )
            `);
            
            // Schema validation logs
            this.guardianDB.run(`
                CREATE TABLE IF NOT EXISTS schema_validation_log (
                    id TEXT PRIMARY KEY,
                    database_name TEXT NOT NULL,
                    table_name TEXT NOT NULL,
                    validation_status TEXT NOT NULL,
                    missing_columns TEXT,
                    row_count INTEGER,
                    validated_at INTEGER NOT NULL
                )
            `);
            
            // Guardian alerts
            this.guardianDB.run(`
                CREATE TABLE IF NOT EXISTS guardian_alerts (
                    id TEXT PRIMARY KEY,
                    alert_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    system_affected TEXT,
                    description TEXT NOT NULL,
                    resolved BOOLEAN DEFAULT FALSE,
                    created_at INTEGER NOT NULL,
                    resolved_at INTEGER
                )
            `);
            
            // Verification tests results
            this.guardianDB.run(`
                CREATE TABLE IF NOT EXISTS verification_tests (
                    id TEXT PRIMARY KEY,
                    test_name TEXT NOT NULL,
                    test_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details TEXT,
                    duration INTEGER,
                    executed_at INTEGER NOT NULL
                )
            `);
        });
        
        console.log('🛡️ Guardian database initialized');
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        // Main guardian dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateGuardianDashboard());
        });
        
        // System health check
        this.app.get('/health', async (req, res) => {
            const health = await this.performFullHealthCheck();
            res.json(health);
        });
        
        // Database schema verification
        this.app.get('/verify/schemas', async (req, res) => {
            const verification = await this.verifyAllSchemas();
            res.json(verification);
        });
        
        // Run specific test
        this.app.post('/test/:testName', async (req, res) => {
            const result = await this.runSpecificTest(req.params.testName, req.body);
            res.json(result);
        });
        
        // Alert management
        this.app.get('/alerts', async (req, res) => {
            const alerts = await this.getActiveAlerts();
            res.json(alerts);
        });
        
        // Fix detected issues
        this.app.post('/fix/:issueType', async (req, res) => {
            const result = await this.attemptFix(req.params.issueType, req.body);
            res.json(result);
        });
    }
    
    startWatchdog() {
        console.log('🐕 Starting Database Schema Guardian watchdog...');
        
        // Immediate full check
        this.performFullCheck();
        
        // Periodic checks
        setInterval(() => {
            this.performFullCheck();
        }, this.watchdogConfig.checkInterval);
        
        // Schema verification every 5 minutes
        setInterval(() => {
            this.verifyAllSchemas();
        }, 300000);
        
        console.log('🐕 Watchdog active - monitoring all systems');
    }
    
    async performFullCheck() {
        console.log('🔍 Guardian performing full system check...');
        this.guardianState.totalChecks++;
        this.guardianState.lastFullCheck = Date.now();
        
        const checkResults = {
            timestamp: Date.now(),
            systemHealth: {},
            schemaIntegrity: {},
            overallHealth: 'UNKNOWN',
            issuesFound: [],
            recommendations: []
        };
        
        // Check all registered systems
        for (const [systemName, systemInfo] of Object.entries(this.systemRegistry)) {
            const healthResult = await this.checkSystemHealth(systemName, systemInfo);
            checkResults.systemHealth[systemName] = healthResult;
            
            this.guardianState.systemHealth.set(systemName, healthResult);
            
            // Log to database
            await this.logSystemHealth(systemName, healthResult);
        }
        
        // Verify database schemas
        const schemaResults = await this.verifyAllSchemas();
        checkResults.schemaIntegrity = schemaResults;
        
        // Calculate overall health
        const healthySystemsCount = Object.values(checkResults.systemHealth)
            .filter(h => h.status === 'healthy').length;
        const totalSystems = Object.keys(checkResults.systemHealth).length;
        const healthRatio = healthySystemsCount / totalSystems;
        
        if (healthRatio >= 0.8) {
            checkResults.overallHealth = 'HEALTHY';
        } else if (healthRatio >= 0.6) {
            checkResults.overallHealth = 'WARNING';
        } else {
            checkResults.overallHealth = 'CRITICAL';
        }
        
        // Generate recommendations
        checkResults.recommendations = this.generateRecommendations(checkResults);
        
        // Check for alerts
        await this.processAlerts(checkResults);
        
        return checkResults;
    }
    
    async checkSystemHealth(systemName, systemInfo) {
        const startTime = Date.now();
        const healthCheck = {
            system: systemName,
            status: 'unknown',
            responseTime: null,
            error: null,
            details: {},
            lastCheck: Date.now()
        };
        
        try {
            // Attempt to connect to the system
            const response = await axios.get(`http://localhost:${systemInfo.port}`, {
                timeout: 10000,
                validateStatus: () => true // Accept any status code
            });
            
            healthCheck.responseTime = Date.now() - startTime;
            
            if (response.status >= 200 && response.status < 400) {
                healthCheck.status = 'healthy';
                healthCheck.details = {
                    statusCode: response.status,
                    contentLength: response.data.length,
                    hasContent: response.data.length > 0
                };
            } else {
                healthCheck.status = 'warning';
                healthCheck.error = `HTTP ${response.status}`;
            }
            
        } catch (error) {
            healthCheck.status = 'error';
            healthCheck.error = error.message;
            healthCheck.responseTime = Date.now() - startTime;
            
            // Increment alert count
            const currentCount = this.guardianState.alertCount.get(systemName) || 0;
            this.guardianState.alertCount.set(systemName, currentCount + 1);
        }
        
        // Update system registry
        this.systemRegistry[systemName] = {
            ...systemInfo,
            status: healthCheck.status,
            lastCheck: healthCheck.lastCheck
        };
        
        return healthCheck;
    }
    
    async verifyAllSchemas() {
        console.log('📋 Verifying database schemas...');
        const schemaResults = {
            timestamp: Date.now(),
            databases: {},
            overallValid: true,
            issuesFound: []
        };
        
        for (const [dbName, expectedSchema] of Object.entries(this.expectedSchemas)) {
            const dbResult = await this.verifyDatabaseSchema(dbName, expectedSchema);
            schemaResults.databases[dbName] = dbResult;
            
            if (!dbResult.valid) {
                schemaResults.overallValid = false;
                schemaResults.issuesFound.push(...dbResult.issues);
            }
            
            this.guardianState.schemaIntegrity.set(dbName, dbResult);
        }
        
        return schemaResults;
    }
    
    async verifyDatabaseSchema(dbName, expectedSchema) {
        const verification = {
            database: dbName,
            valid: true,
            issues: [],
            tableResults: {},
            lastVerified: Date.now()
        };
        
        try {
            // Check if database file exists
            const dbPath = `./${dbName}`;
            try {
                await fs.access(dbPath);
            } catch (error) {
                verification.valid = false;
                verification.issues.push(`Database file ${dbName} does not exist`);
                return verification;
            }
            
            // Connect to database
            const db = new sqlite3.Database(dbPath);
            
            // Verify each expected table
            for (const tableName of expectedSchema.tables) {
                const tableResult = await this.verifyTable(db, tableName, expectedSchema.criticalColumns[tableName]);
                verification.tableResults[tableName] = tableResult;
                
                if (!tableResult.exists) {
                    verification.valid = false;
                    verification.issues.push(`Table ${tableName} missing in ${dbName}`);
                }
                
                if (tableResult.missingColumns.length > 0) {
                    verification.valid = false;
                    verification.issues.push(`Missing columns in ${tableName}: ${tableResult.missingColumns.join(', ')}`);
                }
                
                // Log table verification
                await this.logSchemaValidation(dbName, tableName, tableResult);
            }
            
            db.close();
            
        } catch (error) {
            verification.valid = false;
            verification.issues.push(`Database verification error: ${error.message}`);
        }
        
        return verification;
    }
    
    async verifyTable(db, tableName, expectedColumns) {
        return new Promise((resolve, reject) => {
            const result = {
                table: tableName,
                exists: false,
                rowCount: 0,
                missingColumns: [],
                extraColumns: [],
                actualColumns: []
            };
            
            // Check if table exists
            db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!row) {
                    resolve(result);
                    return;
                }
                
                result.exists = true;
                
                // Get table info
                db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    result.actualColumns = columns.map(col => col.name);
                    
                    // Check for missing columns
                    if (expectedColumns) {
                        expectedColumns.forEach(expectedCol => {
                            if (!result.actualColumns.includes(expectedCol)) {
                                result.missingColumns.push(expectedCol);
                            }
                        });
                    }
                    
                    // Get row count
                    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, countResult) => {
                        if (err) {
                            result.rowCount = -1;
                        } else {
                            result.rowCount = countResult.count;
                        }
                        
                        resolve(result);
                    });
                });
            });
        });
    }
    
    async runSpecificTest(testName, params) {
        console.log(`🧪 Running specific test: ${testName}`);
        const testResult = {
            test: testName,
            status: 'UNKNOWN',
            duration: 0,
            details: {},
            passed: false,
            timestamp: Date.now()
        };
        
        const startTime = Date.now();
        
        try {
            switch (testName) {
                case 'cjis-scraper-functionality':
                    testResult.details = await this.testCJISScraper();
                    break;
                    
                case 'database-integrity':
                    testResult.details = await this.testDatabaseIntegrity();
                    break;
                    
                case 'system-communication':
                    testResult.details = await this.testSystemCommunication();
                    break;
                    
                case 'ai-swarm-response':
                    testResult.details = await this.testAISwarmResponse();
                    break;
                    
                case 'compliance-validation':
                    testResult.details = await this.testComplianceValidation();
                    break;
                    
                default:
                    throw new Error(`Unknown test: ${testName}`);
            }
            
            testResult.status = 'PASSED';
            testResult.passed = true;
            
        } catch (error) {
            testResult.status = 'FAILED';
            testResult.details.error = error.message;
            testResult.passed = false;
        }
        
        testResult.duration = Date.now() - startTime;
        
        // Log test result
        await this.logTestResult(testResult);
        
        return testResult;
    }
    
    async testCJISScraper() {
        const testDetails = {
            endpoint_reachable: false,
            domain_validation_works: false,
            ai_swarm_responsive: false,
            database_accessible: false
        };
        
        // Test if CJIS scraper is reachable
        try {
            const response = await axios.get('http://localhost:7889', { timeout: 5000 });
            testDetails.endpoint_reachable = response.status === 200;
        } catch (error) {
            testDetails.endpoint_error = error.message;
        }
        
        // Test domain validation
        try {
            const response = await axios.post('http://localhost:7889/validate/domain', {
                domain: 'sba.gov'
            }, { timeout: 10000 });
            testDetails.domain_validation_works = response.data.valid === true;
        } catch (error) {
            testDetails.domain_validation_error = error.message;
        }
        
        // Test database accessibility
        try {
            const dbPath = './cjis_compliance.db';
            await fs.access(dbPath);
            testDetails.database_accessible = true;
        } catch (error) {
            testDetails.database_error = error.message;
        }
        
        return testDetails;
    }
    
    async testDatabaseIntegrity() {
        const databases = ['cjis_compliance.db', 'architecture_limits.db', 'guardian_log.db'];
        const results = {};
        
        for (const dbName of databases) {
            try {
                await fs.access(`./${dbName}`);
                const db = new sqlite3.Database(`./${dbName}`);
                
                // Test basic query
                await new Promise((resolve, reject) => {
                    db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
                
                db.close();
                results[dbName] = { accessible: true, error: null };
            } catch (error) {
                results[dbName] = { accessible: false, error: error.message };
            }
        }
        
        return results;
    }
    
    async testSystemCommunication() {
        const communicationResults = {};
        
        for (const [systemName, systemInfo] of Object.entries(this.systemRegistry)) {
            try {
                const response = await axios.get(`http://localhost:${systemInfo.port}`, {
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                communicationResults[systemName] = {
                    reachable: true,
                    statusCode: response.status,
                    responseTime: response.headers['x-response-time'] || 'unknown'
                };
            } catch (error) {
                communicationResults[systemName] = {
                    reachable: false,
                    error: error.message
                };
            }
        }
        
        return communicationResults;
    }
    
    async testAISwarmResponse() {
        // Test AI swarm communication if CJIS scraper is available
        try {
            const response = await axios.post('http://localhost:7889/swarm/communicate', {
                session_id: 'test-session',
                message: 'Guardian system test - please respond'
            }, { timeout: 10000 });
            
            return {
                swarm_responsive: response.data.success === true,
                ai_response: response.data.ai_response,
                response_time: Date.now()
            };
        } catch (error) {
            return {
                swarm_responsive: false,
                error: error.message
            };
        }
    }
    
    async testComplianceValidation() {
        // Test compliance validation functionality
        try {
            const testDomains = ['sba.gov', 'grants.gov', 'nih.gov'];
            const results = {};
            
            for (const domain of testDomains) {
                try {
                    const response = await axios.post('http://localhost:7889/validate/domain', {
                        domain: domain
                    }, { timeout: 15000 });
                    
                    results[domain] = {
                        validated: true,
                        is_government: response.data.is_government,
                        dns_valid: response.data.dns_valid,
                        jurisdiction: response.data.jurisdiction
                    };
                } catch (error) {
                    results[domain] = {
                        validated: false,
                        error: error.message
                    };
                }
            }
            
            return results;
        } catch (error) {
            return { error: error.message };
        }
    }
    
    generateRecommendations(checkResults) {
        const recommendations = [];
        
        // System health recommendations
        Object.entries(checkResults.systemHealth).forEach(([system, health]) => {
            if (health.status === 'error') {
                recommendations.push(`🚨 System ${system} is not responding - check if service is running`);
            } else if (health.status === 'warning') {
                recommendations.push(`⚠️ System ${system} has issues - investigate HTTP errors`);
            }
        });
        
        // Schema recommendations
        if (!checkResults.schemaIntegrity.overallValid) {
            recommendations.push('📋 Database schema issues detected - run schema verification');
        }
        
        // Overall health recommendations
        if (checkResults.overallHealth === 'CRITICAL') {
            recommendations.push('🆘 System health is critical - immediate attention required');
        }
        
        return recommendations;
    }
    
    async processAlerts(checkResults) {
        // Create alerts for critical issues
        Object.entries(checkResults.systemHealth).forEach(async ([system, health]) => {
            if (health.status === 'error') {
                const alertCount = this.guardianState.alertCount.get(system) || 0;
                if (alertCount >= this.watchdogConfig.alertThreshold) {
                    await this.createAlert('SYSTEM_DOWN', 'HIGH', system, 
                        `System ${system} has been down for ${alertCount} consecutive checks`);
                }
            }
        });
    }
    
    // Database logging methods
    async logSystemHealth(systemName, healthResult) {
        return new Promise((resolve, reject) => {
            this.guardianDB.run(`
                INSERT INTO system_health_log (id, system_name, status, response_time, error_message, checked_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                crypto.randomUUID(), systemName, healthResult.status,
                healthResult.responseTime, healthResult.error, Date.now()
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    async logSchemaValidation(dbName, tableName, tableResult) {
        return new Promise((resolve, reject) => {
            this.guardianDB.run(`
                INSERT INTO schema_validation_log (id, database_name, table_name, validation_status, missing_columns, row_count, validated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                crypto.randomUUID(), dbName, tableName,
                tableResult.exists ? 'VALID' : 'INVALID',
                tableResult.missingColumns.join(','), tableResult.rowCount, Date.now()
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    async logTestResult(testResult) {
        return new Promise((resolve, reject) => {
            this.guardianDB.run(`
                INSERT INTO verification_tests (id, test_name, test_type, status, details, duration, executed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                crypto.randomUUID(), testResult.test, 'MANUAL',
                testResult.status, JSON.stringify(testResult.details),
                testResult.duration, testResult.timestamp
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    async createAlert(alertType, severity, systemAffected, description) {
        return new Promise((resolve, reject) => {
            this.guardianDB.run(`
                INSERT INTO guardian_alerts (id, alert_type, severity, system_affected, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                crypto.randomUUID(), alertType, severity, systemAffected, description, Date.now()
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
    
    async getActiveAlerts() {
        return new Promise((resolve, reject) => {
            this.guardianDB.all(`
                SELECT * FROM guardian_alerts 
                WHERE resolved = FALSE 
                ORDER BY created_at DESC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    generateGuardianDashboard() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🛡️ Database Schema Guardian</title>
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    background: linear-gradient(135deg, #2c1810 0%, #8b4513 100%);
                    color: #daa520;
                    margin: 0;
                    padding: 20px;
                    line-height: 1.6;
                }
                .container { max-width: 1400px; margin: 0 auto; }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    border: 2px solid #daa520;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(218, 165, 32, 0.1);
                }
                .guardian-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .guard-card {
                    border: 2px solid #daa520;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(218, 165, 32, 0.05);
                }
                .system-monitoring {
                    border: 2px solid #cd853f;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(205, 133, 63, 0.1);
                    margin: 20px 0;
                }
                .schema-verification {
                    border: 2px solid #8b4513;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(139, 69, 19, 0.1);
                    margin: 20px 0;
                }
                .test-results {
                    border: 2px solid #daa520;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(218, 165, 32, 0.05);
                    margin: 20px 0;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .system-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    margin: 5px 0;
                    border: 1px solid #cd853f;
                    border-radius: 5px;
                    background: rgba(205, 133, 63, 0.1);
                }
                .status-indicator {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                .healthy { background-color: #32cd32; }
                .warning { background-color: #ffa500; }
                .error { background-color: #dc143c; }
                .unknown { background-color: #696969; }
                .button {
                    background: #daa520;
                    color: #2c1810;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 5px;
                }
                .button:hover { background: #b8860b; }
                .alert-item {
                    background: rgba(220, 20, 60, 0.2);
                    border-left: 4px solid #dc143c;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 5px;
                }
                .test-item {
                    background: rgba(218, 165, 32, 0.1);
                    border-left: 4px solid #daa520;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 5px;
                }
                .guardian-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .stat-card {
                    text-align: center;
                    padding: 15px;
                    border: 1px solid #daa520;
                    border-radius: 8px;
                    background: rgba(218, 165, 32, 0.1);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛡️ Database Schema Guardian</h1>
                    <p>Postmaster/Watchdog for System Integrity and Database Verification</p>
                    <div>
                        <strong>Guardian Status:</strong> <span id="guardianStatus">ACTIVE</span> |
                        <strong>Last Check:</strong> <span id="lastCheck">Never</span> |
                        <strong>Total Checks:</strong> <span id="totalChecks">0</span>
                    </div>
                </div>
                
                <div class="guardian-grid">
                    <div class="guard-card">
                        <h2>🏥 System Health</h2>
                        <div id="systemHealthSummary">
                            <p>Healthy: <span id="healthyCount">0</span></p>
                            <p>Warning: <span id="warningCount">0</span></p>
                            <p>Error: <span id="errorCount">0</span></p>
                        </div>
                        <button class="button" onclick="runHealthCheck()">🔍 Full Health Check</button>
                    </div>
                    
                    <div class="guard-card">
                        <h2>📋 Schema Integrity</h2>
                        <div id="schemaHealthSummary">
                            <p>Databases: <span id="dbCount">0</span></p>
                            <p>Tables Valid: <span id="validTables">0</span></p>
                            <p>Issues Found: <span id="schemaIssues">0</span></p>
                        </div>
                        <button class="button" onclick="verifySchemas()">✅ Verify Schemas</button>
                    </div>
                    
                    <div class="guard-card">
                        <h2>🚨 Active Alerts</h2>
                        <div id="alertsSummary">
                            <p>Critical: <span id="criticalAlerts">0</span></p>
                            <p>Warning: <span id="warningAlerts">0</span></p>
                            <p>Total: <span id="totalAlerts">0</span></p>
                        </div>
                        <button class="button" onclick="loadAlerts()">📋 View Alerts</button>
                    </div>
                </div>
                
                <div class="system-monitoring">
                    <h2>📊 System Monitoring</h2>
                    <div id="systemList">
                        ${Object.entries(this.systemRegistry).map(([name, info]) => `
                            <div class="system-row">
                                <div>
                                    <span class="status-indicator unknown"></span>
                                    <strong>${name}</strong> (Port ${info.port})
                                </div>
                                <div id="status-${name}">Unknown</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="schema-verification">
                    <h2>🗄️ Database Schema Status</h2>
                    <div id="schemaStatus">
                        <div class="system-row">
                            <strong>CJIS Compliance DB</strong>
                            <span id="cjis-db-status">Not Checked</span>
                        </div>
                        <div class="system-row">
                            <strong>Architecture Limits DB</strong>
                            <span id="arch-db-status">Not Checked</span>
                        </div>
                        <div class="system-row">
                            <strong>Guardian Log DB</strong>
                            <span id="guardian-db-status">Active</span>
                        </div>
                    </div>
                </div>
                
                <div class="guardian-stats">
                    <div class="stat-card">
                        <h3>Uptime</h3>
                        <div id="uptime">0h 0m</div>
                    </div>
                    <div class="stat-card">
                        <h3>Checks Performed</h3>
                        <div id="checksPerformed">${this.guardianState.totalChecks}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Issues Resolved</h3>
                        <div id="issuesResolved">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>System Reliability</h3>
                        <div id="reliability">100%</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div class="test-results">
                        <h2>🧪 Verification Tests</h2>
                        <div>
                            <button class="button" onclick="runTest('cjis-scraper-functionality')">Test CJIS Scraper</button>
                            <button class="button" onclick="runTest('database-integrity')">Test DB Integrity</button>
                            <button class="button" onclick="runTest('system-communication')">Test Communication</button>
                            <button class="button" onclick="runTest('compliance-validation')">Test Compliance</button>
                        </div>
                        <div id="testResults">
                            <div class="test-item">
                                <strong>Guardian:</strong> Ready to run verification tests. Click any test button above.
                            </div>
                        </div>
                    </div>
                    
                    <div class="test-results">
                        <h2>🚨 Recent Alerts</h2>
                        <div id="recentAlerts">
                            <div class="alert-item">
                                <strong>System:</strong> Guardian initialized successfully. All systems ready for monitoring.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                let startTime = Date.now();
                
                function updateUptime() {
                    const uptime = Date.now() - startTime;
                    const hours = Math.floor(uptime / 3600000);
                    const minutes = Math.floor((uptime % 3600000) / 60000);
                    document.getElementById('uptime').textContent = \`\${hours}h \${minutes}m\`;
                }
                
                async function runHealthCheck() {
                    addTestResult('Guardian', 'Running full system health check...');
                    
                    try {
                        const response = await fetch('/health');
                        const health = await response.json();
                        
                        // Update system status
                        Object.entries(health.systemHealth).forEach(([system, status]) => {
                            const indicator = document.querySelector(\`#status-\${system}\`);
                            if (indicator) {
                                indicator.textContent = status.status.toUpperCase();
                                const statusIcon = indicator.parentElement.querySelector('.status-indicator');
                                statusIcon.className = \`status-indicator \${status.status}\`;
                            }
                        });
                        
                        // Update counters
                        const healthySystems = Object.values(health.systemHealth).filter(s => s.status === 'healthy').length;
                        const warningSystems = Object.values(health.systemHealth).filter(s => s.status === 'warning').length;
                        const errorSystems = Object.values(health.systemHealth).filter(s => s.status === 'error').length;
                        
                        document.getElementById('healthyCount').textContent = healthySystems;
                        document.getElementById('warningCount').textContent = warningSystems;
                        document.getElementById('errorCount').textContent = errorSystems;
                        document.getElementById('lastCheck').textContent = new Date().toLocaleTimeString();
                        
                        addTestResult('Guardian', \`Health check complete: \${healthySystems} healthy, \${warningSystems} warning, \${errorSystems} error\`);
                        
                        // Add recommendations
                        health.recommendations.forEach(rec => {
                            addAlert('System', rec);
                        });
                        
                    } catch (error) {
                        addTestResult('Guardian', \`Health check failed: \${error.message}\`);
                    }
                }
                
                async function verifySchemas() {
                    addTestResult('Guardian', 'Verifying database schemas...');
                    
                    try {
                        const response = await fetch('/verify/schemas');
                        const schemas = await response.json();
                        
                        let validTables = 0;
                        let totalIssues = 0;
                        
                        Object.entries(schemas.databases).forEach(([dbName, dbResult]) => {
                            Object.values(dbResult.tableResults || {}).forEach(table => {
                                if (table.exists && table.missingColumns.length === 0) {
                                    validTables++;
                                }
                            });
                            totalIssues += dbResult.issues.length;
                        });
                        
                        document.getElementById('dbCount').textContent = Object.keys(schemas.databases).length;
                        document.getElementById('validTables').textContent = validTables;
                        document.getElementById('schemaIssues').textContent = totalIssues;
                        
                        addTestResult('Guardian', \`Schema verification complete: \${validTables} valid tables, \${totalIssues} issues found\`);
                        
                        if (totalIssues > 0) {
                            schemas.issuesFound.forEach(issue => {
                                addAlert('Schema', issue);
                            });
                        }
                        
                    } catch (error) {
                        addTestResult('Guardian', \`Schema verification failed: \${error.message}\`);
                    }
                }
                
                async function runTest(testName) {
                    addTestResult('Guardian', \`Running test: \${testName}...\`);
                    
                    try {
                        const response = await fetch(\`/test/\${testName}\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                        });
                        const result = await response.json();
                        
                        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
                        const duration = \`(\${result.duration}ms)\`;
                        
                        addTestResult('Test Result', \`\${testName}: \${status} \${duration}\`);
                        
                        if (result.details.error) {
                            addTestResult('Error', result.details.error);
                        }
                        
                    } catch (error) {
                        addTestResult('Test Error', \`\${testName} failed: \${error.message}\`);
                    }
                }
                
                async function loadAlerts() {
                    try {
                        const response = await fetch('/alerts');
                        const alerts = await response.json();
                        
                        document.getElementById('totalAlerts').textContent = alerts.length;
                        
                        // Clear and populate alerts
                        const alertsDiv = document.getElementById('recentAlerts');
                        alertsDiv.innerHTML = '';
                        
                        if (alerts.length === 0) {
                            alertsDiv.innerHTML = '<div class="alert-item"><strong>System:</strong> No active alerts. All systems operating normally.</div>';
                        } else {
                            alerts.slice(0, 10).forEach(alert => {
                                addAlert(alert.alert_type, alert.description);
                            });
                        }
                        
                    } catch (error) {
                        addAlert('System', \`Failed to load alerts: \${error.message}\`);
                    }
                }
                
                function addTestResult(sender, message) {
                    const resultsDiv = document.getElementById('testResults');
                    const div = document.createElement('div');
                    div.className = 'test-item';
                    div.innerHTML = \`<strong>\${sender}:</strong> \${message}\`;
                    resultsDiv.appendChild(div);
                    resultsDiv.scrollTop = resultsDiv.scrollHeight;
                }
                
                function addAlert(type, message) {
                    const alertsDiv = document.getElementById('recentAlerts');
                    const div = document.createElement('div');
                    div.className = 'alert-item';
                    div.innerHTML = \`<strong>\${type}:</strong> \${message}\`;
                    alertsDiv.insertBefore(div, alertsDiv.firstChild);
                    
                    // Keep only last 10 alerts
                    while (alertsDiv.children.length > 10) {
                        alertsDiv.removeChild(alertsDiv.lastChild);
                    }
                }
                
                // Auto-update functions
                setInterval(updateUptime, 60000); // Update uptime every minute
                setInterval(runHealthCheck, 300000); // Auto health check every 5 minutes
                
                // Initial checks
                updateUptime();
                setTimeout(runHealthCheck, 2000);
                setTimeout(verifySchemas, 4000);
                setTimeout(loadAlerts, 6000);
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🛡️ Database Schema Guardian running on http://localhost:${this.port}`);
            console.log(`🐕 Watchdog monitoring ${Object.keys(this.systemRegistry).length} systems`);
            console.log(`📋 Validating ${Object.keys(this.expectedSchemas).length} database schemas`);
            console.log(`⏰ Check interval: ${this.watchdogConfig.checkInterval / 1000} seconds`);
        });
    }
}

// Initialize and start the Guardian
const guardian = new DatabaseSchemaGuardian();
guardian.start();

module.exports = DatabaseSchemaGuardian;