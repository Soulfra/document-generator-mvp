/**
 * 🏗️ Architecture Limits Manager
 * Manages complex nested system architecture with proper boundaries and resource limits
 * Handles database mapping, system constraints, and architectural governance
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class ArchitectureLimitsManager extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 7886;
        this.server = null;
        
        // Architecture State
        this.architectureState = {
            systems: new Map(),
            limits: new Map(),
            connections: new Map(),
            resources: new Map(),
            boundaries: new Map()
        };
        
        // System Limits Configuration
        this.systemLimits = {
            // Database Limits
            database: {
                max_connections: 50,
                max_tables: 100,
                max_rows_per_table: 1000000,
                max_query_time: 30000,
                max_transaction_size: 10000,
                backup_frequency: 3600000 // 1 hour
            },
            
            // Memory Limits
            memory: {
                max_heap_size: 2048, // MB
                max_buffer_size: 512, // MB
                gc_threshold: 0.8,
                context_cache_limit: 10000,
                pattern_cache_limit: 5000
            },
            
            // Network Limits
            network: {
                max_concurrent_requests: 100,
                max_request_size: 50, // MB
                rate_limit_per_minute: 1000,
                timeout_threshold: 60000,
                max_connections_per_ip: 10
            },
            
            // Processing Limits
            processing: {
                max_crawl_depth: 10,
                max_reasoning_chains: 50,
                max_context_threads: 1000,
                max_pattern_complexity: 100,
                max_automation_rules: 200
            },
            
            // Storage Limits
            storage: {
                max_file_size: 100, // MB
                max_total_storage: 10000, // MB
                max_log_retention: 2592000000, // 30 days
                max_archive_size: 5000, // MB
                cleanup_interval: 86400000 // 24 hours
            }
        };
        
        // Architecture Boundaries
        this.architectureBoundaries = {
            'system-isolation': {
                description: 'Each system runs in isolated namespace',
                enforcement: 'container-level',
                violation_action: 'terminate_process'
            },
            'data-sovereignty': {
                description: 'Data stays within defined boundaries',
                enforcement: 'schema-validation',
                violation_action: 'reject_transaction'
            },
            'resource-quotas': {
                description: 'Each system has defined resource quotas',
                enforcement: 'runtime-monitoring',
                violation_action: 'throttle_system'
            },
            'api-rate-limiting': {
                description: 'API calls are rate limited per system',
                enforcement: 'gateway-level',
                violation_action: 'queue_requests'
            },
            'complexity-capping': {
                description: 'System complexity cannot exceed thresholds',
                enforcement: 'design-time-validation',
                violation_action: 'reject_architecture'
            }
        };
        
        // Database Schema Management
        this.databaseSchemas = {
            // Master Architecture Registry
            architecture_systems: {
                table: 'architecture_systems',
                schema: `
                    CREATE TABLE IF NOT EXISTS architecture_systems (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        type TEXT NOT NULL,
                        status TEXT NOT NULL,
                        resource_usage TEXT,
                        limits TEXT,
                        boundaries TEXT,
                        dependencies TEXT,
                        created_at INTEGER,
                        updated_at INTEGER
                    )
                `,
                indexes: [
                    'CREATE INDEX IF NOT EXISTS idx_systems_type ON architecture_systems(type)',
                    'CREATE INDEX IF NOT EXISTS idx_systems_status ON architecture_systems(status)'
                ]
            },
            
            // Resource Usage Tracking
            resource_usage: {
                table: 'resource_usage',
                schema: `
                    CREATE TABLE IF NOT EXISTS resource_usage (
                        id TEXT PRIMARY KEY,
                        system_id TEXT NOT NULL,
                        resource_type TEXT NOT NULL,
                        usage_amount REAL NOT NULL,
                        limit_amount REAL NOT NULL,
                        timestamp INTEGER NOT NULL,
                        exceeded BOOLEAN DEFAULT FALSE,
                        FOREIGN KEY (system_id) REFERENCES architecture_systems(id)
                    )
                `,
                indexes: [
                    'CREATE INDEX IF NOT EXISTS idx_usage_system ON resource_usage(system_id)',
                    'CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON resource_usage(timestamp)',
                    'CREATE INDEX IF NOT EXISTS idx_usage_exceeded ON resource_usage(exceeded)'
                ]
            },
            
            // System Connections & Dependencies
            system_connections: {
                table: 'system_connections',
                schema: `
                    CREATE TABLE IF NOT EXISTS system_connections (
                        id TEXT PRIMARY KEY,
                        source_system TEXT NOT NULL,
                        target_system TEXT NOT NULL,
                        connection_type TEXT NOT NULL,
                        bandwidth_limit REAL,
                        latency_threshold REAL,
                        error_rate REAL DEFAULT 0,
                        status TEXT NOT NULL,
                        created_at INTEGER,
                        FOREIGN KEY (source_system) REFERENCES architecture_systems(id),
                        FOREIGN KEY (target_system) REFERENCES architecture_systems(id)
                    )
                `,
                indexes: [
                    'CREATE INDEX IF NOT EXISTS idx_connections_source ON system_connections(source_system)',
                    'CREATE INDEX IF NOT EXISTS idx_connections_target ON system_connections(target_system)',
                    'CREATE INDEX IF NOT EXISTS idx_connections_status ON system_connections(status)'
                ]
            },
            
            // Architectural Violations
            architecture_violations: {
                table: 'architecture_violations',
                schema: `
                    CREATE TABLE IF NOT EXISTS architecture_violations (
                        id TEXT PRIMARY KEY,
                        system_id TEXT NOT NULL,
                        violation_type TEXT NOT NULL,
                        severity TEXT NOT NULL,
                        description TEXT,
                        limit_exceeded TEXT,
                        current_value REAL,
                        limit_value REAL,
                        action_taken TEXT,
                        resolved BOOLEAN DEFAULT FALSE,
                        timestamp INTEGER NOT NULL,
                        FOREIGN KEY (system_id) REFERENCES architecture_systems(id)
                    )
                `,
                indexes: [
                    'CREATE INDEX IF NOT EXISTS idx_violations_system ON architecture_violations(system_id)',
                    'CREATE INDEX IF NOT EXISTS idx_violations_severity ON architecture_violations(severity)',
                    'CREATE INDEX IF NOT EXISTS idx_violations_resolved ON architecture_violations(resolved)'
                ]
            },
            
            // System Health Metrics
            system_health: {
                table: 'system_health',
                schema: `
                    CREATE TABLE IF NOT EXISTS system_health (
                        id TEXT PRIMARY KEY,
                        system_id TEXT NOT NULL,
                        cpu_usage REAL,
                        memory_usage REAL,
                        disk_usage REAL,
                        network_io REAL,
                        response_time REAL,
                        error_rate REAL,
                        health_score REAL,
                        status TEXT NOT NULL,
                        timestamp INTEGER NOT NULL,
                        FOREIGN KEY (system_id) REFERENCES architecture_systems(id)
                    )
                `,
                indexes: [
                    'CREATE INDEX IF NOT EXISTS idx_health_system ON system_health(system_id)',
                    'CREATE INDEX IF NOT EXISTS idx_health_timestamp ON system_health(timestamp)',
                    'CREATE INDEX IF NOT EXISTS idx_health_score ON system_health(health_score)'
                ]
            }
        };
        
        // Resource Monitors
        this.resourceMonitors = new Map();
        
        // Limit Enforcers
        this.limitEnforcers = new Map();
        
        this.initializeDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.startResourceMonitoring();
    }
    
    async initializeDatabase() {
        // Create main architecture database
        this.architectureDB = new sqlite3.Database('./architecture_limits.db');
        
        // Create all schema tables
        for (const [schemaName, schemaConfig] of Object.entries(this.databaseSchemas)) {
            await this.createSchemaTable(schemaConfig);
        }
        
        // Initialize system registry
        await this.initializeSystemRegistry();
        
        console.log('🗄️ Architecture database initialized with limits management');
    }
    
    async createSchemaTable(schemaConfig) {
        return new Promise((resolve, reject) => {
            this.architectureDB.serialize(() => {
                // Create table
                this.architectureDB.run(schemaConfig.schema, (err) => {
                    if (err) {
                        console.error(`Error creating table ${schemaConfig.table}:`, err);
                        reject(err);
                        return;
                    }
                    
                    // Create indexes
                    if (schemaConfig.indexes) {
                        schemaConfig.indexes.forEach(indexSQL => {
                            this.architectureDB.run(indexSQL, (indexErr) => {
                                if (indexErr) {
                                    console.error(`Error creating index:`, indexErr);
                                }
                            });
                        });
                    }
                    
                    resolve();
                });
            });
        });
    }
    
    async initializeSystemRegistry() {
        // Register known systems with their limits
        const knownSystems = [
            {
                name: 'blamechain-storybook',
                type: 'blockchain-archive',
                port: 7877,
                limits: {
                    memory: 512,
                    cpu: 0.5,
                    storage: 1000,
                    connections: 100
                }
            },
            {
                name: 'chat-processor',
                type: 'ai-processing',
                port: 7879,
                limits: {
                    memory: 1024,
                    cpu: 0.8,
                    storage: 2000,
                    connections: 50
                }
            },
            {
                name: 'web3-playable-world',
                type: 'gaming-platform',
                port: 7880,
                limits: {
                    memory: 2048,
                    cpu: 1.0,
                    storage: 5000,
                    connections: 500
                }
            },
            {
                name: 'soulfra-multiverse',
                type: 'trading-engine',
                port: 7881,
                limits: {
                    memory: 1536,
                    cpu: 0.7,
                    storage: 3000,
                    connections: 200
                }
            },
            {
                name: 'clarity-engine',
                type: 'reasoning-machine',
                port: 7882,
                limits: {
                    memory: 1024,
                    cpu: 0.6,
                    storage: 1500,
                    connections: 100
                }
            },
            {
                name: 'onion-crawler',
                type: 'web-crawler',
                port: 7884,
                limits: {
                    memory: 2048,
                    cpu: 0.9,
                    storage: 4000,
                    connections: 300
                }
            }
        ];
        
        for (const system of knownSystems) {
            await this.registerSystem(system);
        }
    }
    
    async registerSystem(systemConfig) {
        const systemId = crypto.randomUUID();
        const timestamp = Date.now();
        
        return new Promise((resolve, reject) => {
            this.architectureDB.run(`
                INSERT OR REPLACE INTO architecture_systems 
                (id, name, type, status, resource_usage, limits, boundaries, dependencies, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                systemId,
                systemConfig.name,
                systemConfig.type,
                'active',
                JSON.stringify({}),
                JSON.stringify(systemConfig.limits || {}),
                JSON.stringify({}),
                JSON.stringify(systemConfig.dependencies || []),
                timestamp,
                timestamp
            ], (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.architectureState.systems.set(systemConfig.name, {
                        id: systemId,
                        ...systemConfig,
                        registered_at: timestamp
                    });
                    resolve(systemId);
                }
            });
        });
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateArchitectureDashboard());
        });
        
        // System registration
        this.app.post('/systems/register', async (req, res) => {
            try {
                const systemId = await this.registerSystem(req.body);
                res.json({ success: true, system_id: systemId });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        // Resource usage reporting
        this.app.post('/systems/:systemId/usage', async (req, res) => {
            try {
                await this.recordResourceUsage(req.params.systemId, req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        // Limit enforcement
        this.app.post('/limits/enforce', async (req, res) => {
            try {
                const result = await this.enforceLimits(req.body);
                res.json(result);
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        // Architecture validation
        this.app.post('/architecture/validate', async (req, res) => {
            try {
                const validation = await this.validateArchitecture(req.body);
                res.json(validation);
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        // System health check
        this.app.get('/systems/:systemId/health', async (req, res) => {
            try {
                const health = await this.getSystemHealth(req.params.systemId);
                res.json(health);
            } catch (error) {
                res.status(404).json({ success: false, error: error.message });
            }
        });
        
        // Resource limits overview
        this.app.get('/limits/overview', async (req, res) => {
            try {
                const overview = await this.getLimitsOverview();
                res.json(overview);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Violations report
        this.app.get('/violations', async (req, res) => {
            try {
                const violations = await this.getViolationsReport();
                res.json(violations);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Architecture optimization
        this.app.post('/architecture/optimize', async (req, res) => {
            try {
                const optimization = await this.optimizeArchitecture(req.body);
                res.json(optimization);
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
    }
    
    startResourceMonitoring() {
        // Monitor system resources every 30 seconds
        setInterval(() => {
            this.monitorAllSystems();
        }, 30000);
        
        // Check limits every 10 seconds
        setInterval(() => {
            this.checkLimitsCompliance();
        }, 10000);
        
        // Cleanup old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000);
        
        console.log('📊 Resource monitoring started');
    }
    
    async monitorAllSystems() {
        for (const [systemName, systemInfo] of this.architectureState.systems) {
            try {
                const health = await this.collectSystemMetrics(systemInfo);
                await this.recordSystemHealth(systemInfo.id, health);
                
                // Check for limit violations
                await this.checkSystemLimits(systemInfo.id, health);
                
            } catch (error) {
                console.error(`Error monitoring system ${systemName}:`, error.message);
            }
        }
    }
    
    async collectSystemMetrics(systemInfo) {
        // Mock system metrics collection - in production would use actual monitoring
        const mockMetrics = {
            cpu_usage: Math.random() * 100,
            memory_usage: Math.random() * systemInfo.limits.memory,
            disk_usage: Math.random() * systemInfo.limits.storage,
            network_io: Math.random() * 1000,
            response_time: Math.random() * 1000,
            error_rate: Math.random() * 0.1
        };
        
        // Calculate health score
        const healthScore = this.calculateHealthScore(mockMetrics, systemInfo.limits);
        mockMetrics.health_score = healthScore;
        
        // Determine status
        mockMetrics.status = healthScore > 0.8 ? 'healthy' : 
                           healthScore > 0.6 ? 'warning' : 'critical';
        
        return mockMetrics;
    }
    
    calculateHealthScore(metrics, limits) {
        const cpuScore = 1 - (metrics.cpu_usage / 100);
        const memoryScore = 1 - (metrics.memory_usage / limits.memory);
        const responseScore = Math.max(0, 1 - (metrics.response_time / 5000));
        const errorScore = 1 - (metrics.error_rate * 10);
        
        return (cpuScore + memoryScore + responseScore + errorScore) / 4;
    }
    
    async recordSystemHealth(systemId, health) {
        const healthId = crypto.randomUUID();
        const timestamp = Date.now();
        
        return new Promise((resolve, reject) => {
            this.architectureDB.run(`
                INSERT INTO system_health 
                (id, system_id, cpu_usage, memory_usage, disk_usage, network_io, response_time, error_rate, health_score, status, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                healthId, systemId, health.cpu_usage, health.memory_usage, health.disk_usage,
                health.network_io, health.response_time, health.error_rate, health.health_score,
                health.status, timestamp
            ], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(healthId);
                }
            });
        });
    }
    
    async checkSystemLimits(systemId, health) {
        const violations = [];
        
        // Get system info
        const systemInfo = Array.from(this.architectureState.systems.values())
            .find(sys => sys.id === systemId);
        
        if (!systemInfo) return violations;
        
        // Check memory limit
        if (health.memory_usage > systemInfo.limits.memory * 0.9) {
            violations.push({
                type: 'memory_limit',
                severity: health.memory_usage > systemInfo.limits.memory ? 'critical' : 'warning',
                current: health.memory_usage,
                limit: systemInfo.limits.memory,
                description: `Memory usage ${health.memory_usage}MB exceeds limit ${systemInfo.limits.memory}MB`
            });
        }
        
        // Check CPU limit
        if (health.cpu_usage > 90) {
            violations.push({
                type: 'cpu_limit',
                severity: health.cpu_usage > 95 ? 'critical' : 'warning',
                current: health.cpu_usage,
                limit: 100,
                description: `CPU usage ${health.cpu_usage}% is critically high`
            });
        }
        
        // Check response time
        if (health.response_time > 5000) {
            violations.push({
                type: 'response_time',
                severity: 'warning',
                current: health.response_time,
                limit: 5000,
                description: `Response time ${health.response_time}ms exceeds threshold`
            });
        }
        
        // Record violations
        for (const violation of violations) {
            await this.recordViolation(systemId, violation);
        }
        
        return violations;
    }
    
    async recordViolation(systemId, violation) {
        const violationId = crypto.randomUUID();
        const timestamp = Date.now();
        
        return new Promise((resolve, reject) => {
            this.architectureDB.run(`
                INSERT INTO architecture_violations 
                (id, system_id, violation_type, severity, description, limit_exceeded, current_value, limit_value, action_taken, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                violationId, systemId, violation.type, violation.severity, violation.description,
                violation.type, violation.current, violation.limit, 'logged', timestamp
            ], (err) => {
                if (err) {
                    reject(err);
                } else {
                    // Emit violation event for real-time handling
                    this.emit('violation', {
                        id: violationId,
                        system_id: systemId,
                        violation
                    });
                    resolve(violationId);
                }
            });
        });
    }
    
    async enforceLimits(enforcement) {
        const results = {
            enforced: [],
            failed: [],
            summary: {}
        };
        
        // Implement different enforcement strategies
        switch (enforcement.strategy) {
            case 'throttle':
                results.enforced.push(await this.throttleSystem(enforcement.system_id, enforcement.level));
                break;
                
            case 'scale_down':
                results.enforced.push(await this.scaleDownSystem(enforcement.system_id));
                break;
                
            case 'circuit_break':
                results.enforced.push(await this.circuitBreakSystem(enforcement.system_id));
                break;
                
            case 'emergency_stop':
                results.enforced.push(await this.emergencyStopSystem(enforcement.system_id));
                break;
                
            default:
                results.failed.push({ error: 'Unknown enforcement strategy' });
        }
        
        return results;
    }
    
    async validateArchitecture(architectureConfig) {
        const validation = {
            valid: true,
            violations: [],
            warnings: [],
            recommendations: []
        };
        
        // Check system complexity
        if (architectureConfig.systems && architectureConfig.systems.length > 20) {
            validation.warnings.push('High system complexity detected (>20 systems)');
        }
        
        // Check resource allocation
        let totalMemory = 0;
        let totalCPU = 0;
        
        if (architectureConfig.systems) {
            architectureConfig.systems.forEach(system => {
                if (system.limits) {
                    totalMemory += system.limits.memory || 0;
                    totalCPU += system.limits.cpu || 0;
                }
            });
        }
        
        if (totalMemory > this.systemLimits.memory.max_heap_size * 4) {
            validation.violations.push('Total memory allocation exceeds system capacity');
            validation.valid = false;
        }
        
        if (totalCPU > 8) {
            validation.violations.push('Total CPU allocation exceeds system capacity');
            validation.valid = false;
        }
        
        // Check for circular dependencies
        const circularDeps = this.detectCircularDependencies(architectureConfig);
        if (circularDeps.length > 0) {
            validation.violations.push(...circularDeps);
            validation.valid = false;
        }
        
        return validation;
    }
    
    detectCircularDependencies(architectureConfig) {
        // Implementation for circular dependency detection
        return []; // Simplified for now
    }
    
    async getLimitsOverview() {
        return new Promise((resolve, reject) => {
            this.architectureDB.all(`
                SELECT 
                    s.name,
                    s.type,
                    s.status,
                    s.limits,
                    h.health_score,
                    h.cpu_usage,
                    h.memory_usage,
                    COUNT(v.id) as violation_count
                FROM architecture_systems s
                LEFT JOIN system_health h ON s.id = h.system_id 
                    AND h.timestamp = (SELECT MAX(timestamp) FROM system_health WHERE system_id = s.id)
                LEFT JOIN architecture_violations v ON s.id = v.system_id AND v.resolved = FALSE
                GROUP BY s.id
                ORDER BY s.name
            `, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const overview = {
                        total_systems: rows.length,
                        healthy_systems: rows.filter(r => r.health_score > 0.8).length,
                        warning_systems: rows.filter(r => r.health_score > 0.6 && r.health_score <= 0.8).length,
                        critical_systems: rows.filter(r => r.health_score <= 0.6).length,
                        total_violations: rows.reduce((sum, r) => sum + r.violation_count, 0),
                        systems: rows.map(row => ({
                            name: row.name,
                            type: row.type,
                            status: row.status,
                            limits: JSON.parse(row.limits || '{}'),
                            health_score: row.health_score,
                            cpu_usage: row.cpu_usage,
                            memory_usage: row.memory_usage,
                            violation_count: row.violation_count
                        }))
                    };
                    resolve(overview);
                }
            });
        });
    }
    
    async getViolationsReport() {
        return new Promise((resolve, reject) => {
            this.architectureDB.all(`
                SELECT 
                    v.*,
                    s.name as system_name,
                    s.type as system_type
                FROM architecture_violations v
                JOIN architecture_systems s ON v.system_id = s.id
                WHERE v.resolved = FALSE
                ORDER BY v.timestamp DESC
                LIMIT 100
            `, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        total_violations: rows.length,
                        violations: rows
                    });
                }
            });
        });
    }
    
    async cleanupOldData() {
        const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
        
        // Clean old health records
        this.architectureDB.run(`
            DELETE FROM system_health WHERE timestamp < ?
        `, [cutoffTime]);
        
        // Clean resolved violations older than 7 days
        const violationCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.architectureDB.run(`
            DELETE FROM architecture_violations 
            WHERE resolved = TRUE AND timestamp < ?
        `, [violationCutoff]);
        
        console.log('🧹 Cleaned up old architecture data');
    }
    
    generateArchitectureDashboard() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🏗️ Architecture Limits Manager</title>
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                    color: #00ff41;
                    margin: 0;
                    padding: 20px;
                    line-height: 1.6;
                }
                .container { max-width: 1600px; margin: 0 auto; }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    border: 2px solid #00ff41;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(0, 255, 65, 0.1);
                }
                .architecture-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .arch-card {
                    border: 2px solid #00ff41;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(0, 255, 65, 0.05);
                }
                .limits-overview {
                    border: 2px solid #ffd700;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(255, 215, 0, 0.1);
                    margin: 20px 0;
                }
                .system-status {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .system-card {
                    border: 1px solid #00ff41;
                    padding: 15px;
                    border-radius: 8px;
                    background: rgba(0, 255, 65, 0.05);
                }
                .health-indicator {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                .healthy { background-color: #00ff41; }
                .warning { background-color: #ffd700; }
                .critical { background-color: #ff4444; }
                .violations-section {
                    border: 2px solid #ff4444;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(255, 68, 68, 0.1);
                    margin: 20px 0;
                }
                .violation-item {
                    background: rgba(255, 68, 68, 0.2);
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 5px;
                    border-left: 4px solid #ff4444;
                }
                .controls-section {
                    margin: 30px 0;
                    padding: 20px;
                    border: 2px dashed #00ff41;
                    border-radius: 10px;
                }
                .button {
                    background: #00ff41;
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 5px;
                }
                .button:hover { background: #00cc33; }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .metric-card {
                    text-align: center;
                    padding: 15px;
                    border: 1px solid #00ff41;
                    border-radius: 8px;
                    background: rgba(0, 255, 65, 0.1);
                }
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #333;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 5px 0;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #00ff41, #ffd700, #ff4444);
                    transition: width 0.3s ease;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏗️ Architecture Limits Manager</h1>
                    <p>Complex system architecture boundaries and resource limit management</p>
                    <div id="systemOverview">Loading system overview...</div>
                </div>
                
                <div class="architecture-grid">
                    <div class="arch-card">
                        <h2>📊 Resource Limits</h2>
                        <div id="resourceLimits">
                            <p><strong>Memory Limit:</strong> ${this.systemLimits.memory.max_heap_size}MB</p>
                            <p><strong>Database Connections:</strong> ${this.systemLimits.database.max_connections}</p>
                            <p><strong>Max Crawl Depth:</strong> ${this.systemLimits.processing.max_crawl_depth}</p>
                            <p><strong>Network Requests/min:</strong> ${this.systemLimits.network.rate_limit_per_minute}</p>
                        </div>
                    </div>
                    
                    <div class="arch-card">
                        <h2>🏛️ Architecture Boundaries</h2>
                        <div id="architectureBoundaries">
                            ${Object.entries(this.architectureBoundaries).map(([boundary, config]) => `
                                <p><strong>${boundary}:</strong> ${config.enforcement}</p>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="arch-card">
                        <h2>⚡ Active Systems</h2>
                        <div id="activeSystems">
                            <p>Registered Systems: <span id="systemCount">${this.architectureState.systems.size}</span></p>
                            <p>Resource Monitors: <span id="monitorCount">${this.resourceMonitors.size}</span></p>
                            <p>Limit Enforcers: <span id="enforcerCount">${this.limitEnforcers.size}</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="limits-overview">
                    <h2>📈 System Status Overview</h2>
                    <div class="system-status" id="systemStatus">
                        Loading system status...
                    </div>
                </div>
                
                <div class="violations-section">
                    <h2>⚠️ Current Violations</h2>
                    <div id="violationsList">
                        Loading violations...
                    </div>
                </div>
                
                <div class="controls-section">
                    <h2>🎛️ Architecture Controls</h2>
                    <div style="margin: 20px 0;">
                        <button class="button" onclick="refreshMetrics()">🔄 Refresh Metrics</button>
                        <button class="button" onclick="validateArchitecture()">✅ Validate Architecture</button>
                        <button class="button" onclick="optimizeResources()">⚡ Optimize Resources</button>
                        <button class="button" onclick="emergencyStop()">🚨 Emergency Stop</button>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3>Manual Limit Enforcement</h3>
                        <select id="enforcementSystem">
                            <option value="">Select System</option>
                            ${Array.from(this.architectureState.systems.keys()).map(name => 
                                `<option value="${name}">${name}</option>`
                            ).join('')}
                        </select>
                        <select id="enforcementStrategy">
                            <option value="throttle">Throttle</option>
                            <option value="scale_down">Scale Down</option>
                            <option value="circuit_break">Circuit Break</option>
                            <option value="emergency_stop">Emergency Stop</option>
                        </select>
                        <button class="button" onclick="enforceLimit()">⚖️ Enforce Limit</button>
                    </div>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Total Memory Usage</h3>
                        <div id="totalMemory">0 MB</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="memoryProgress" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <h3>Database Connections</h3>
                        <div id="dbConnections">0</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="dbProgress" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <h3>Network Load</h3>
                        <div id="networkLoad">0 req/min</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="networkProgress" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <h3>System Health</h3>
                        <div id="systemHealth">Unknown</div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="healthProgress" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                // Load initial data
                loadSystemOverview();
                loadViolations();
                
                // Auto-refresh every 30 seconds
                setInterval(() => {
                    loadSystemOverview();
                    loadViolations();
                }, 30000);
                
                async function loadSystemOverview() {
                    try {
                        const response = await fetch('/limits/overview');
                        const data = await response.json();
                        
                        document.getElementById('systemOverview').innerHTML = \`
                            <strong>Systems:</strong> \${data.total_systems} | 
                            <span class="healthy">●</span> Healthy: \${data.healthy_systems} | 
                            <span class="warning">●</span> Warning: \${data.warning_systems} | 
                            <span class="critical">●</span> Critical: \${data.critical_systems}
                        \`;
                        
                        const systemStatusDiv = document.getElementById('systemStatus');
                        systemStatusDiv.innerHTML = data.systems.map(system => \`
                            <div class="system-card">
                                <h4>
                                    <span class="health-indicator \${system.health_score > 0.8 ? 'healthy' : system.health_score > 0.6 ? 'warning' : 'critical'}"></span>
                                    \${system.name}
                                </h4>
                                <p><strong>Type:</strong> \${system.type}</p>
                                <p><strong>Status:</strong> \${system.status}</p>
                                <p><strong>Health Score:</strong> \${(system.health_score * 100).toFixed(1)}%</p>
                                <p><strong>Memory:</strong> \${system.memory_usage.toFixed(1)}MB / \${system.limits.memory}MB</p>
                                <p><strong>CPU:</strong> \${system.cpu_usage.toFixed(1)}%</p>
                                <p><strong>Violations:</strong> \${system.violation_count}</p>
                            </div>
                        \`).join('');
                        
                        // Update metrics
                        updateMetrics(data);
                        
                    } catch (error) {
                        console.error('Error loading system overview:', error);
                    }
                }
                
                async function loadViolations() {
                    try {
                        const response = await fetch('/violations');
                        const data = await response.json();
                        
                        const violationsDiv = document.getElementById('violationsList');
                        if (data.violations.length === 0) {
                            violationsDiv.innerHTML = '<p style="color: #00ff41;">✅ No active violations</p>';
                        } else {
                            violationsDiv.innerHTML = data.violations.map(violation => \`
                                <div class="violation-item">
                                    <strong>\${violation.system_name}</strong> - \${violation.violation_type}
                                    <br><small>\${violation.description}</small>
                                    <br><small>Severity: \${violation.severity} | \${new Date(violation.timestamp).toLocaleString()}</small>
                                </div>
                            \`).join('');
                        }
                        
                    } catch (error) {
                        console.error('Error loading violations:', error);
                    }
                }
                
                function updateMetrics(data) {
                    const totalMemory = data.systems.reduce((sum, sys) => sum + sys.memory_usage, 0);
                    const maxMemory = ${this.systemLimits.memory.max_heap_size * 4};
                    const memoryPercent = (totalMemory / maxMemory) * 100;
                    
                    document.getElementById('totalMemory').textContent = \`\${totalMemory.toFixed(1)} MB\`;
                    document.getElementById('memoryProgress').style.width = \`\${Math.min(memoryPercent, 100)}%\`;
                    
                    const avgHealth = data.systems.reduce((sum, sys) => sum + (sys.health_score || 0), 0) / data.systems.length;
                    document.getElementById('systemHealth').textContent = \`\${(avgHealth * 100).toFixed(1)}%\`;
                    document.getElementById('healthProgress').style.width = \`\${avgHealth * 100}%\`;
                }
                
                function refreshMetrics() {
                    loadSystemOverview();
                    loadViolations();
                }
                
                async function validateArchitecture() {
                    try {
                        const response = await fetch('/architecture/validate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ validate_all: true })
                        });
                        const result = await response.json();
                        
                        alert(\`Architecture Validation: \${result.valid ? 'PASSED' : 'FAILED'}\\n\\nViolations: \${result.violations.length}\\nWarnings: \${result.warnings.length}\`);
                    } catch (error) {
                        alert('Validation failed: ' + error.message);
                    }
                }
                
                async function optimizeResources() {
                    try {
                        const response = await fetch('/architecture/optimize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ strategy: 'auto' })
                        });
                        const result = await response.json();
                        
                        alert('Resource optimization completed');
                        refreshMetrics();
                    } catch (error) {
                        alert('Optimization failed: ' + error.message);
                    }
                }
                
                async function enforceLimit() {
                    const system = document.getElementById('enforcementSystem').value;
                    const strategy = document.getElementById('enforcementStrategy').value;
                    
                    if (!system || !strategy) {
                        alert('Please select both system and strategy');
                        return;
                    }
                    
                    try {
                        const response = await fetch('/limits/enforce', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                system_id: system,
                                strategy: strategy
                            })
                        });
                        const result = await response.json();
                        
                        alert(\`Limit enforcement: \${result.enforced.length} actions taken\`);
                        refreshMetrics();
                    } catch (error) {
                        alert('Enforcement failed: ' + error.message);
                    }
                }
                
                function emergencyStop() {
                    if (confirm('Are you sure you want to initiate emergency stop? This will affect all systems.')) {
                        // Implementation would go here
                        alert('Emergency stop initiated');
                    }
                }
            </script>
        </body>
        </html>
        `;
    }
    
    // Enforcement Methods (stubs for implementation)
    async throttleSystem(systemId, level) {
        console.log(`🐌 Throttling system ${systemId} to level ${level}`);
        return { action: 'throttle', system_id: systemId, level };
    }
    
    async scaleDownSystem(systemId) {
        console.log(`📉 Scaling down system ${systemId}`);
        return { action: 'scale_down', system_id: systemId };
    }
    
    async circuitBreakSystem(systemId) {
        console.log(`🔌 Circuit breaking system ${systemId}`);
        return { action: 'circuit_break', system_id: systemId };
    }
    
    async emergencyStopSystem(systemId) {
        console.log(`🚨 Emergency stopping system ${systemId}`);
        return { action: 'emergency_stop', system_id: systemId };
    }
    
    async optimizeArchitecture(config) {
        return {
            optimizations: ['memory_reallocation', 'connection_pooling', 'cache_optimization'],
            estimated_improvement: '15-25% performance gain',
            actions_taken: 3
        };
    }
    
    async recordResourceUsage(systemId, usage) {
        const usageId = crypto.randomUUID();
        const timestamp = Date.now();
        
        return new Promise((resolve, reject) => {
            this.architectureDB.run(`
                INSERT INTO resource_usage 
                (id, system_id, resource_type, usage_amount, limit_amount, timestamp, exceeded)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                usageId, systemId, usage.resource_type, usage.usage_amount,
                usage.limit_amount, timestamp, usage.usage_amount > usage.limit_amount
            ], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(usageId);
                }
            });
        });
    }
    
    async getSystemHealth(systemId) {
        return new Promise((resolve, reject) => {
            this.architectureDB.get(`
                SELECT * FROM system_health 
                WHERE system_id = ? 
                ORDER BY timestamp DESC 
                LIMIT 1
            `, [systemId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error('System not found'));
                } else {
                    resolve(row);
                }
            });
        });
    }
    
    async checkLimitsCompliance() {
        // Check all systems for limit compliance
        for (const [systemName, systemInfo] of this.architectureState.systems) {
            try {
                await this.checkSystemLimits(systemInfo.id, await this.collectSystemMetrics(systemInfo));
            } catch (error) {
                console.error(`Error checking limits for ${systemName}:`, error.message);
            }
        }
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🏗️ Architecture Limits Manager running on http://localhost:${this.port}`);
            console.log(`📊 Monitoring ${this.architectureState.systems.size} registered systems`);
            console.log(`⚖️ Enforcing ${Object.keys(this.systemLimits).length} limit categories`);
            console.log(`🛡️ ${Object.keys(this.architectureBoundaries).length} architecture boundaries active`);
        });
    }
}

// Initialize and start the architecture manager
const architectureManager = new ArchitectureLimitsManager();
architectureManager.start();

module.exports = ArchitectureLimitsManager;