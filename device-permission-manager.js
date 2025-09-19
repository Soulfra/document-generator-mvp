#!/usr/bin/env node

/**
 * 🔐 DEVICE PERMISSION MANAGER
 * Manages device-based access control and integrates with SOULFRA security system
 * Ensures row-level security at the application layer
 */

const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Import existing security systems
const SoulfraSecuritySystem = require('./SOULFRA-SECURITY-SYSTEM.js');
const SoulfraVerificationGateway = require('./SOULFRA-VERIFICATION-GATEWAY.js');

class DevicePermissionManager {
    constructor(config = {}) {
        // Device identification
        this.deviceId = config.deviceId || this.generateDeviceId();
        this.deviceFingerprint = config.deviceFingerprint || this.generateDeviceFingerprint();
        
        // Security context
        this.currentContext = {
            deviceId: this.deviceId,
            agentId: null,
            customerId: null,
            sessionId: this.generateSessionId(),
            permissions: new Set()
        };
        
        // Initialize SOULFRA integration
        this.soulfra = new SoulfraSecuritySystem(this.deviceId, this.deviceFingerprint);
        this.verificationGateway = new SoulfraVerificationGateway(this.deviceId, this.deviceFingerprint);
        
        // Permission cache
        this.permissionCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        // Database connections
        this.databases = {
            postgres: null,
            mysql: null,
            sqlite: new Map()
        };
        
        // Audit configuration
        this.auditEnabled = config.auditEnabled !== false;
        this.auditLog = [];
        
        console.log('🔐 Device Permission Manager initialized');
        console.log(`📱 Device ID: ${this.deviceId}`);
        console.log(`🔑 Fingerprint: ${this.deviceFingerprint.substring(0, 16)}...`);
    }
    
    /**
     * Generate unique device ID
     */
    generateDeviceId() {
        const os = require('os');
        const deviceInfo = {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem()
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(deviceInfo))
            .digest('hex')
            .substring(0, 32);
    }
    
    /**
     * Generate device fingerprint
     */
    generateDeviceFingerprint() {
        const os = require('os');
        const fingerprint = {
            hostname: os.hostname(),
            platform: os.platform(),
            release: os.release(),
            arch: os.arch(),
            cpus: os.cpus().map(cpu => cpu.model),
            networkInterfaces: Object.keys(os.networkInterfaces()),
            timestamp: Date.now()
        };
        
        return crypto.createHash('sha512')
            .update(JSON.stringify(fingerprint))
            .digest('hex');
    }
    
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    }
    
    /**
     * Set security context for current operations
     */
    async setContext(context) {
        // Validate context
        if (!context.agentId || !context.customerId) {
            throw new Error('Agent ID and Customer ID are required');
        }
        
        // Verify agent belongs to customer
        const verified = await this.verifyAgentOwnership(context.agentId, context.customerId);
        if (!verified) {
            throw new Error('Agent does not belong to customer');
        }
        
        // Update context
        this.currentContext = {
            ...this.currentContext,
            ...context,
            lastUpdated: Date.now()
        };
        
        // Load permissions for this context
        await this.loadPermissions();
        
        console.log('🔐 Security context updated:', {
            deviceId: this.currentContext.deviceId,
            agentId: this.currentContext.agentId,
            customerId: this.currentContext.customerId,
            permissions: Array.from(this.currentContext.permissions)
        });
        
        return this.currentContext;
    }
    
    /**
     * Verify agent belongs to customer
     */
    async verifyAgentOwnership(agentId, customerId) {
        // Check cache first
        const cacheKey = `ownership:${agentId}:${customerId}`;
        if (this.permissionCache.has(cacheKey)) {
            const cached = this.permissionCache.get(cacheKey);
            if (cached.timestamp > Date.now() - this.cacheTimeout) {
                return cached.verified;
            }
        }
        
        // Verify in database
        try {
            const db = await this.getDatabase('economic-engine');
            const result = await db.get(
                'SELECT 1 FROM ai_agents WHERE id = ? AND customer_id = ?',
                [agentId, customerId]
            );
            
            const verified = !!result;
            
            // Cache result
            this.permissionCache.set(cacheKey, {
                verified,
                timestamp: Date.now()
            });
            
            return verified;
        } catch (error) {
            console.error('Failed to verify agent ownership:', error);
            return false;
        }
    }
    
    /**
     * Load permissions for current context
     */
    async loadPermissions() {
        const { agentId, customerId } = this.currentContext;
        
        // Default permissions
        const permissions = new Set([
            'read:own_data',
            'write:own_data',
            'read:public_stats'
        ]);
        
        // Load agent-specific permissions
        try {
            const db = await this.getDatabase('economic-engine');
            const agentPerms = await db.all(
                'SELECT permission FROM agent_permissions WHERE agent_id = ?',
                [agentId]
            );
            
            agentPerms.forEach(p => permissions.add(p.permission));
        } catch (error) {
            console.warn('Failed to load agent permissions:', error);
        }
        
        // Load customer-level permissions
        try {
            const db = await this.getDatabase('business-accounting');
            const customerPerms = await db.all(
                'SELECT permission FROM customer_permissions WHERE customer_id = ?',
                [customerId]
            );
            
            customerPerms.forEach(p => permissions.add(p.permission));
        } catch (error) {
            console.warn('Failed to load customer permissions:', error);
        }
        
        this.currentContext.permissions = permissions;
        return permissions;
    }
    
    /**
     * Check if current context has permission
     */
    hasPermission(permission) {
        return this.currentContext.permissions.has(permission);
    }
    
    /**
     * Get database connection with context
     */
    async getDatabase(dbName) {
        const dbPath = `./${dbName}.db`;
        
        if (!this.databases.sqlite.has(dbName)) {
            const db = new sqlite3.Database(dbPath);
            
            // Wrap database methods to include context
            const wrappedDb = {
                get: (sql, params) => this.executeQuery(db, 'get', sql, params),
                all: (sql, params) => this.executeQuery(db, 'all', sql, params),
                run: (sql, params) => this.executeQuery(db, 'run', sql, params),
                close: () => db.close()
            };
            
            this.databases.sqlite.set(dbName, wrappedDb);
        }
        
        return this.databases.sqlite.get(dbName);
    }
    
    /**
     * Execute query with security context
     */
    async executeQuery(db, method, sql, params = []) {
        const startTime = Date.now();
        
        try {
            // Check if query is allowed
            await this.checkQueryPermissions(sql);
            
            // Add context to query for SQLite
            const contextualSql = this.addSecurityContext(sql);
            
            // Execute query
            return new Promise((resolve, reject) => {
                db[method](contextualSql, params, (err, result) => {
                    if (err) {
                        this.auditQuery(sql, params, false, err.message, Date.now() - startTime);
                        reject(err);
                    } else {
                        this.auditQuery(sql, params, true, null, Date.now() - startTime);
                        resolve(result);
                    }
                });
            });
        } catch (error) {
            this.auditQuery(sql, params, false, error.message, Date.now() - startTime);
            throw error;
        }
    }
    
    /**
     * Check if query is allowed based on permissions
     */
    async checkQueryPermissions(sql) {
        const normalizedSql = sql.toLowerCase().trim();
        
        // Check for DELETE operations
        if (normalizedSql.startsWith('delete')) {
            if (!this.hasPermission('delete:data')) {
                throw new Error('DELETE operations not allowed');
            }
        }
        
        // Check for UPDATE on read-only data
        if (normalizedSql.startsWith('update')) {
            // This is a simplified check - in production, parse SQL properly
            if (normalizedSql.includes('read_only')) {
                throw new Error('Cannot update read-only data');
            }
        }
        
        // Check for schema modifications
        if (normalizedSql.match(/^(create|alter|drop)\s+(table|index|view)/i)) {
            if (!this.hasPermission('modify:schema')) {
                throw new Error('Schema modifications not allowed');
            }
        }
        
        return true;
    }
    
    /**
     * Add security context to SQL query
     */
    addSecurityContext(sql) {
        const { deviceId, agentId, customerId } = this.currentContext;
        
        // For SELECT queries, add WHERE conditions
        if (sql.toLowerCase().trim().startsWith('select')) {
            // This is simplified - in production, use proper SQL parser
            if (!sql.toLowerCase().includes('where')) {
                sql += ' WHERE 1=1';
            }
            
            // Add context filters
            if (sql.includes('agent_id')) {
                sql += ` AND agent_id = '${agentId}'`;
            }
            if (sql.includes('customer_id')) {
                sql += ` AND customer_id = '${customerId}'`;
            }
            if (sql.includes('device_id')) {
                sql += ` AND device_id = '${deviceId}'`;
            }
        }
        
        // For INSERT queries, add context values
        if (sql.toLowerCase().trim().startsWith('insert')) {
            // This would need proper SQL parsing in production
            // For now, we'll handle it in the application layer
        }
        
        return sql;
    }
    
    /**
     * Audit query execution
     */
    auditQuery(sql, params, success, error, duration) {
        if (!this.auditEnabled) return;
        
        const auditEntry = {
            timestamp: new Date().toISOString(),
            sessionId: this.currentContext.sessionId,
            deviceId: this.currentContext.deviceId,
            agentId: this.currentContext.agentId,
            customerId: this.currentContext.customerId,
            sql: sql.substring(0, 1000), // Truncate long queries
            params: params.length,
            success,
            error,
            duration,
            operation: this.getOperationType(sql)
        };
        
        this.auditLog.push(auditEntry);
        
        // Write to audit database
        this.writeAuditLog(auditEntry).catch(err => {
            console.error('Failed to write audit log:', err);
        });
    }
    
    /**
     * Get operation type from SQL
     */
    getOperationType(sql) {
        const normalized = sql.toLowerCase().trim();
        if (normalized.startsWith('select')) return 'SELECT';
        if (normalized.startsWith('insert')) return 'INSERT';
        if (normalized.startsWith('update')) return 'UPDATE';
        if (normalized.startsWith('delete')) return 'DELETE';
        return 'OTHER';
    }
    
    /**
     * Write audit log to database
     */
    async writeAuditLog(auditEntry) {
        try {
            // Use a dedicated audit database or table
            const auditDb = new sqlite3.Database('./security-audit.db');
            
            await new Promise((resolve, reject) => {
                auditDb.run(`
                    CREATE TABLE IF NOT EXISTS audit_log (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT,
                        session_id TEXT,
                        device_id TEXT,
                        agent_id TEXT,
                        customer_id TEXT,
                        operation TEXT,
                        success INTEGER,
                        error TEXT,
                        duration INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, err => err ? reject(err) : resolve());
            });
            
            await new Promise((resolve, reject) => {
                auditDb.run(`
                    INSERT INTO audit_log (
                        timestamp, session_id, device_id, agent_id, 
                        customer_id, operation, success, error, duration
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    auditEntry.timestamp,
                    auditEntry.sessionId,
                    auditEntry.deviceId,
                    auditEntry.agentId,
                    auditEntry.customerId,
                    auditEntry.operation,
                    auditEntry.success ? 1 : 0,
                    auditEntry.error,
                    auditEntry.duration
                ], err => err ? reject(err) : resolve());
            });
            
            auditDb.close();
        } catch (error) {
            console.error('Audit log write failed:', error);
        }
    }
    
    /**
     * Create secure database wrapper
     */
    createSecureWrapper(database) {
        const manager = this;
        
        return {
            async query(sql, params = []) {
                return manager.executeQuery(database, 'all', sql, params);
            },
            
            async get(sql, params = []) {
                return manager.executeQuery(database, 'get', sql, params);
            },
            
            async run(sql, params = []) {
                return manager.executeQuery(database, 'run', sql, params);
            },
            
            async transaction(callback) {
                await manager.executeQuery(database, 'run', 'BEGIN TRANSACTION');
                try {
                    const result = await callback(this);
                    await manager.executeQuery(database, 'run', 'COMMIT');
                    return result;
                } catch (error) {
                    await manager.executeQuery(database, 'run', 'ROLLBACK');
                    throw error;
                }
            }
        };
    }
    
    /**
     * Get audit summary
     */
    getAuditSummary() {
        const summary = {
            totalQueries: this.auditLog.length,
            byOperation: {},
            successRate: 0,
            averageDuration: 0,
            errors: []
        };
        
        let successCount = 0;
        let totalDuration = 0;
        
        this.auditLog.forEach(entry => {
            // Count by operation
            summary.byOperation[entry.operation] = 
                (summary.byOperation[entry.operation] || 0) + 1;
            
            // Track success
            if (entry.success) successCount++;
            
            // Track duration
            totalDuration += entry.duration;
            
            // Collect errors
            if (!entry.success && entry.error) {
                summary.errors.push({
                    timestamp: entry.timestamp,
                    operation: entry.operation,
                    error: entry.error
                });
            }
        });
        
        summary.successRate = this.auditLog.length > 0 
            ? (successCount / this.auditLog.length) * 100 
            : 100;
        
        summary.averageDuration = this.auditLog.length > 0
            ? totalDuration / this.auditLog.length
            : 0;
        
        return summary;
    }
}

// Export for use in other modules
module.exports = DevicePermissionManager;

// Example usage
if (require.main === module) {
    (async () => {
        console.log('\n🔐 DEVICE PERMISSION MANAGER DEMO\n');
        
        // Initialize manager
        const permissionManager = new DevicePermissionManager();
        
        // Set context for an agent
        await permissionManager.setContext({
            agentId: 'agent-001',
            customerId: 'customer-123'
        });
        
        // Get secure database connection
        const db = await permissionManager.getDatabase('economic-engine');
        
        // Queries will automatically be filtered by context
        try {
            const agents = await db.all('SELECT * FROM ai_agents');
            console.log('✅ Agents visible to current context:', agents.length);
            
            // Try to update - will check permissions
            await db.run(
                'UPDATE ai_agents SET balance = balance + ? WHERE id = ?',
                [100, 'agent-001']
            );
            console.log('✅ Balance updated successfully');
            
        } catch (error) {
            console.error('❌ Operation failed:', error.message);
        }
        
        // Get audit summary
        const summary = permissionManager.getAuditSummary();
        console.log('\n📊 Audit Summary:', summary);
        
        process.exit(0);
    })();
}